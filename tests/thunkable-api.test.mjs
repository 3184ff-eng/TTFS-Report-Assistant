import assert from "node:assert/strict";
import test from "node:test";
import {
  buildThunkableEntry,
  buildThunkableLocation,
  normalizeThunkableImage,
  optionsResponse,
  thunkableCorsHeaders
} from "../src/lib/thunkable-api.js";
import { GET as healthGET, OPTIONS as healthOPTIONS } from "../src/app/api/thunkable/health/route.js";
import {
  POST as analyzePOST,
  OPTIONS as analyzeOPTIONS
} from "../src/app/api/thunkable/analyze-photo/route.js";
import { POST as locationPOST } from "../src/app/api/thunkable/location-name/route.js";

test("Thunkable image payloads accept data URLs and raw base64 strings", () => {
  assert.equal(normalizeThunkableImage("data:image/png;base64,AAAA"), "data:image/png;base64,AAAA");
  assert.equal(normalizeThunkableImage(" AAAA ", "image/png"), "data:image/png;base64,AAAA");
  assert.equal(normalizeThunkableImage("BBBB", "text/plain"), "data:image/jpeg;base64,BBBB");
  assert.equal(normalizeThunkableImage(""), null);
});

test("Thunkable CORS preflight allows app Web API calls", () => {
  const response = optionsResponse();
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), thunkableCorsHeaders["Access-Control-Allow-Origin"]);
  assert.equal(response.headers.get("Access-Control-Allow-Methods"), "GET, POST, OPTIONS");
});

test("Thunkable location and entry builders return app-saveable objects", () => {
  const location = buildThunkableLocation({
    latitude: "10.64",
    longitude: "-61.5",
    placeName: "Manual customer location",
    capturedAt: "2026-06-16T14:30:00.000Z"
  });

  assert.equal(location.latitude, 10.64);
  assert.equal(location.longitude, -61.5);
  assert.equal(location.source, "manual");

  const entry = buildThunkableEntry({
    payload: {
      id: "mobile-entry-1",
      customerName: "Asha Singh",
      address: "Blue gate",
      consentConfirmed: true,
      location
    },
    imageInfo: { fileName: "photo.jpg" },
    analysis: { summary: "Blue gate and tree" }
  });

  assert.equal(entry.id, "mobile-entry-1");
  assert.equal(entry.customerName, "Asha Singh");
  assert.equal(entry.addressHint, "Blue gate");
  assert.equal(entry.consentConfirmed, true);
  assert.equal(entry.analysis.summary, "Blue gate and tree");
});

test("Thunkable health endpoint reports API readiness with CORS", async () => {
  assert.equal(healthOPTIONS().status, 204);
  const response = healthGET();
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), "*");
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.endpoints.analyzePhoto, "/api/thunkable/analyze-photo");
});

test("Thunkable analyze-photo endpoint validates image and returns entry without OpenAI key", async () => {
  const previousKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;

  assert.equal(analyzeOPTIONS().status, 204);

  const badResponse = await analyzePOST(
    new Request("http://localhost/api/thunkable/analyze-photo", {
      method: "POST",
      body: JSON.stringify({ latitude: "10.64", longitude: "-61.5" })
    })
  );
  assert.equal(badResponse.status, 400);

  const okResponse = await analyzePOST(
    new Request("http://localhost/api/thunkable/analyze-photo", {
      method: "POST",
      body: JSON.stringify({
        image: "AAAA",
        latitude: "10.64",
        longitude: "-61.5",
        customerName: "Mobile Test",
        notes: "Tree in front yard"
      })
    })
  );
  assert.equal(okResponse.status, 200);
  assert.equal(okResponse.headers.get("Access-Control-Allow-Origin"), "*");
  const body = await okResponse.json();
  assert.equal(body.ok, true);
  assert.equal(body.entry.customerName, "Mobile Test");
  assert.equal(body.entry.location.latitude, 10.64);
  assert.match(body.analysis.summary, /Detailed vision analysis is not configured/);
  assert.equal(body.analysis.visionStatus.reason, "missing_openai_api_key");

  if (previousKey) {
    process.env.OPENAI_API_KEY = previousKey;
  }
});

test("Thunkable location endpoint rejects invalid coordinates before geocoding", async () => {
  const response = await locationPOST(
    new Request("http://localhost/api/thunkable/location-name", {
      method: "POST",
      body: JSON.stringify({ latitude: "north", longitude: "-61.5" })
    })
  );

  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal(body.ok, false);
  assert.match(body.error, /valid latitude/);
});
