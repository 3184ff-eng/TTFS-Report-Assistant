import assert from "node:assert/strict";
import test from "node:test";
import { formatRetrievedKnowledge, loadKnowledgeChunks, retrieveKnowledge } from "../src/lib/knowledge-retrieval.js";

test("loads markdown knowledge and example chunks", () => {
  const chunks = loadKnowledgeChunks();
  const sources = new Set(chunks.map((chunk) => chunk.source));

  assert.ok(sources.has("knowledge/NORTHERN_DIVISION_GUIDE.md"));
  assert.ok(sources.has("knowledge/VETTING_CHECKLIST.md"));
  assert.ok(sources.has("examples/GOOD_REPORT_STANDARD.md"));
  assert.ok(chunks.length >= 4);
});

test("retrieves relevant TTFS guidance for observation and witness separation", () => {
  const results = retrieveKnowledge(
    "Witness stated the fire started before arrival. On arrival smoke was seen in the kitchen. Officer observations additional information.",
    { limit: 5 }
  );
  const formatted = formatRetrievedKnowledge(results);

  assert.ok(results.length > 0);
  assert.match(formatted, /Officer'?s Observations/i);
  assert.match(formatted, /Additional Information/i);
  assert.match(formatted, /witness/i);
});

test("retrieves value damage insurance and casualty guidance", () => {
  const results = retrieveKnowledge(
    "Value of Building Damage to Stock Building and Stock Insured as follows casualty treated by injuries",
    { limit: 5 }
  );
  const formatted = formatRetrievedKnowledge(results);

  assert.match(formatted, /Value of Building/i);
  assert.match(formatted, /Damage to Stock/i);
  assert.match(formatted, /casualt/i);
});
