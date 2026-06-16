import assert from "node:assert/strict";
import test from "node:test";
import {
  buildLocalAnalysis,
  buildManualLocation,
  canUseBrowserGeolocation,
  colorName,
  createPhotoEntryId,
  filterPhotoEntries,
  geolocationErrorMessage,
  geolocationMessage,
  normalizeAnalysis,
  normalizeCoordinate,
  reduceColors,
  toHex
} from "../src/lib/photo-log.js";
import { POST } from "../src/app/api/analyze-photo/route.js";

test("photo color helpers classify and summarize dominant colors", () => {
  assert.equal(toHex(300), "ff");
  assert.equal(toHex(-10), "00");
  assert.equal(colorName({ r: 22, g: 20, b: 18 }), "black");
  assert.equal(colorName({ r: 45, g: 155, b: 60 }), "green / vegetation");
  assert.equal(colorName({ r: 190, g: 55, b: 45 }), "red / brick");

  const palette = reduceColors([
    { r: 40, g: 150, b: 55 },
    { r: 42, g: 148, b: 57 },
    { r: 190, g: 60, b: 50 }
  ]);

  assert.equal(palette.length, 2);
  assert.equal(palette[0].name, "green / vegetation");
  assert.equal(palette[0].percentage, 67);
});

test("photo entry id generation works when crypto.randomUUID is unavailable", () => {
  let requestedBytes = 0;
  const id = createPhotoEntryId(
    {
      getRandomValues(bytes) {
        requestedBytes = bytes.length;
        for (let index = 0; index < bytes.length; index += 1) {
          bytes[index] = index + 1;
        }
      }
    },
    123456789
  );

  assert.equal(requestedBytes, 16);
  assert.match(id, /^01020304-0506-4708-890a-0b0c0d0e0f10-21i3v9$/);
});

test("geolocation availability explains local network HTTP blocking", () => {
  assert.equal(
    canUseBrowserGeolocation({ protocol: "http:", hostname: "192.168.100.192", isSecureContext: false }),
    false
  );
  assert.equal(canUseBrowserGeolocation({ protocol: "http:", hostname: "localhost", isSecureContext: false }), true);
  assert.equal(canUseBrowserGeolocation({ protocol: "https:", hostname: "example.com", isSecureContext: true }), true);

  assert.match(
    geolocationMessage({ hasNavigatorGeolocation: true, canUseDeviceLocation: false }),
    /local HTTP address/
  );
});

test("geolocation errors are translated into useful officer-facing messages", () => {
  assert.match(geolocationErrorMessage({ code: 1, message: "" }), /permission was denied/i);
  assert.match(geolocationErrorMessage({ code: 2, message: "" }), /could not determine/i);
  assert.match(geolocationErrorMessage({ code: 3, message: "" }), /timed out/i);
  assert.match(geolocationErrorMessage({ message: "[object GeolocationPositionError]" }), /could not be captured/i);
  assert.equal(geolocationErrorMessage({ message: "Only secure origins are allowed" }), "Only secure origins are allowed");
});

test("manual location validates coordinates and creates a usable saved location", () => {
  assert.equal(normalizeCoordinate("10.6415123", -90, 90), 10.641512);
  assert.equal(normalizeCoordinate("-181", -180, 180), null);

  const location = buildManualLocation(
    { latitude: "10.6415", longitude: "-61.5019", placeName: "Port of Spain" },
    "2026-06-16T14:00:00.000Z"
  );

  assert.deepEqual(location, {
    latitude: 10.6415,
    longitude: -61.5019,
    accuracy: "Manual",
    placeName: "Port of Spain",
    capturedAt: "2026-06-16T14:00:00.000Z",
    source: "manual"
  });

  assert.throws(() => buildManualLocation({ latitude: "north", longitude: "-61.5" }), /valid latitude/);
});

test("local analysis preserves color notes and includes privacy concerns", () => {
  const analysis = buildLocalAnalysis({
    colors: [{ name: "tan / beige", hex: "#c9b884", percentage: 42 }]
  });

  assert.match(analysis.colorNotes[0], /tan \/ beige/);
  assert.ok(analysis.visibleFeatures.some((item) => item.includes("house number")));
  assert.ok(analysis.concerns.some((item) => item.toLowerCase().includes("consent")));
});

test("photo entries search customer, place, notes, and generated analysis text", () => {
  const entries = [
    {
      customerName: "Asha Singh",
      addressHint: "Blue gate near corner",
      notes: "Interested in solar package",
      visitOutcome: "Follow up needed",
      location: { placeName: "Arima, Trinidad" },
      analysis: {
        summary: "Cream house with red roof",
        visibleFeatures: ["front garden", "white fence"],
        colorNotes: ["red roof"],
        customerClues: ["corner property"]
      }
    },
    {
      customerName: "R. Ali",
      notes: "No answer",
      location: { placeName: "Chaguanas" },
      analysis: { visibleFeatures: ["gray apartment block"], colorNotes: [] }
    }
  ];

  assert.equal(filterPhotoEntries(entries, "solar").length, 1);
  assert.equal(filterPhotoEntries(entries, "red roof")[0].customerName, "Asha Singh");
  assert.equal(filterPhotoEntries(entries, "chaguanas")[0].customerName, "R. Ali");
  assert.equal(filterPhotoEntries(entries, "").length, 2);
});

test("vision analysis normalization trims unsafe shapes into the app contract", () => {
  const result = normalizeAnalysis({
    summary: "x".repeat(600),
    visibleFeatures: [" gate ", "", "roof"],
    colorNotes: "not an array",
    customerClues: Array.from({ length: 20 }, (_, index) => `clue ${index}`),
    concerns: ["permission"]
  });

  assert.equal(result.summary.length, 500);
  assert.deepEqual(result.visibleFeatures, ["gate", "roof"]);
  assert.deepEqual(result.colorNotes, []);
  assert.equal(result.customerClues.length, 12);
  assert.deepEqual(result.concerns, ["permission"]);
});

test("analyze-photo API rejects missing images and falls back without an API key", async () => {
  const previousKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;

  const badResponse = await POST(
    new Request("http://localhost/api/analyze-photo", {
      method: "POST",
      body: JSON.stringify({ image: "" })
    })
  );
  assert.equal(badResponse.status, 400);

  const okResponse = await POST(
    new Request("http://localhost/api/analyze-photo", {
      method: "POST",
      body: JSON.stringify({ image: "data:image/png;base64,AAAA", imageInfo: { colors: [] } })
    })
  );
  assert.equal(okResponse.status, 200);
  const body = await okResponse.json();
  assert.match(body.summary, /Detailed vision analysis is not configured/);
  assert.equal(body.visionStatus.reason, "missing_openai_api_key");
  assert.ok(body.concerns.some((item) => item.includes("permission")));

  if (previousKey) {
    process.env.OPENAI_API_KEY = previousKey;
  }
});
