import assert from "node:assert/strict";
import test from "node:test";
import { analyzePhotoWithVision } from "../src/lib/photo-vision-server.js";

const image = "data:image/png;base64,AAAA";

test("vision helper reports missing API key instead of silently falling back", async () => {
  const previousKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;

  const analysis = await analyzePhotoWithVision({ image });
  assert.equal(analysis.visionStatus.ok, false);
  assert.equal(analysis.visionStatus.reason, "missing_openai_api_key");

  if (previousKey) {
    process.env.OPENAI_API_KEY = previousKey;
  }
});

test("vision helper reports OpenAI rejected requests", async () => {
  const previousKey = process.env.OPENAI_API_KEY;
  const previousFetch = globalThis.fetch;
  process.env.OPENAI_API_KEY = "test-key";
  globalThis.fetch = async () =>
    Response.json(
      {
        error: {
          code: "invalid_api_key",
          message: "Incorrect API key provided."
        }
      },
      { status: 401 }
    );

  const analysis = await analyzePhotoWithVision({ image });
  assert.equal(analysis.visionStatus.ok, false);
  assert.equal(analysis.visionStatus.reason, "openai_rejected_request");
  assert.equal(analysis.visionStatus.status, 401);
  assert.equal(analysis.visionStatus.code, "invalid_api_key");

  globalThis.fetch = previousFetch;
  if (previousKey) {
    process.env.OPENAI_API_KEY = previousKey;
  } else {
    delete process.env.OPENAI_API_KEY;
  }
});

test("vision helper reports network errors", async () => {
  const previousKey = process.env.OPENAI_API_KEY;
  const previousFetch = globalThis.fetch;
  process.env.OPENAI_API_KEY = "test-key";
  globalThis.fetch = async () => {
    throw new Error("network unavailable");
  };

  const analysis = await analyzePhotoWithVision({ image });
  assert.equal(analysis.visionStatus.ok, false);
  assert.equal(analysis.visionStatus.reason, "openai_network_error");
  assert.match(analysis.visionStatus.message, /network unavailable/);

  globalThis.fetch = previousFetch;
  if (previousKey) {
    process.env.OPENAI_API_KEY = previousKey;
  } else {
    delete process.env.OPENAI_API_KEY;
  }
});

test("vision helper marks successful parsed responses", async () => {
  const previousKey = process.env.OPENAI_API_KEY;
  const previousFetch = globalThis.fetch;
  process.env.OPENAI_API_KEY = "test-key";
  globalThis.fetch = async () =>
    Response.json({
      output_text: JSON.stringify({
        summary: "Tree beside a light-colored wall.",
        visibleFeatures: ["tree", "wall"],
        colorNotes: ["green leaves", "light wall"],
        customerClues: ["front yard tree"],
        concerns: []
      })
    });

  const analysis = await analyzePhotoWithVision({ image });
  assert.equal(analysis.visionStatus.ok, true);
  assert.equal(analysis.summary, "Tree beside a light-colored wall.");
  assert.deepEqual(analysis.visibleFeatures, ["tree", "wall"]);

  globalThis.fetch = previousFetch;
  if (previousKey) {
    process.env.OPENAI_API_KEY = previousKey;
  } else {
    delete process.env.OPENAI_API_KEY;
  }
});
