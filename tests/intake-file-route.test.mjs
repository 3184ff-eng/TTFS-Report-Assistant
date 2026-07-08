import assert from "node:assert/strict";
import test from "node:test";
import { POST } from "../src/app/api/intake-file/route.js";

test("intake file route extracts text and suggests initial intelligence fields", async () => {
  const formData = new FormData();
  const sourceText = [
    "Fire at Building 10 Industrial Park Road on 12/02/2018 at 14:35 hrs.",
    "Caller reported smoke, possible electrical panel involvement, and one injured occupant.",
    "Security witness has CCTV footage."
  ].join("\n");

  formData.append("file", new File([sourceText], "initial-intelligence.txt", { type: "text/plain" }));
  formData.append("stageTitle", "Pre-scene Activities");
  formData.append("operationTitle", "Initial Intelligence");

  const response = await POST(new Request("http://localhost/api/intake-file", { method: "POST", body: formData }));
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.match(result.extractedText, /Industrial Park Road/);
  assert.ok(result.suggestions.times.some((time) => /14:35/.test(time)));
  assert.ok(result.suggestions.hazards.some((hazard) => /electrical panel/i.test(hazard)));
  assert.ok(result.suggestions.witnesses.some((witness) => /CCTV/i.test(witness)));
});
