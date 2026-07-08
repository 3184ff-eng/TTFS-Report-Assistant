import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

async function loadPageLogic() {
  const source = readFileSync(new URL("../src/app/page.js", import.meta.url), "utf8");
  const start = source.indexOf("const investigationStatuses =");
  const end = source.indexOf("function fileToDataUrl");

  assert.notEqual(start, -1, "Could not find start of investigation page logic.");
  assert.notEqual(end, -1, "Could not find end of investigation page logic.");

  const modulePath = join(tmpdir(), `investigation-page-logic-${Date.now()}-${Math.random().toString(16).slice(2)}.mjs`);
  const moduleSource = `${source.slice(start, end)}

export {
  buildInvestigationSummary,
  buildReportDraft,
  buildOpenItems,
  calculateProgress,
  dataCollectionTracks,
  initialInvestigation,
  investigationStages,
  reportSections,
  investigationStatuses,
  sceneExaminationSteps
};
`;

  writeFileSync(modulePath, moduleSource);
  return import(`file://${modulePath}`);
}

const logic = await loadPageLogic();

test("investigation page exposes the expected process stages", () => {
  assert.deepEqual(
    logic.investigationStages.map((stage) => stage.code),
    ["1000", "1200", "1400-1500", "2000", "3000-3200", "4000-4300", "5000-5100"]
  );
  assert.ok(logic.investigationStages.some((stage) => stage.title === "Origin Determination"));
  assert.ok(logic.investigationStages.some((stage) => stage.title === "Cause Determination"));
});

test("process stages expose operational substeps for field sequence", () => {
  const dataCollection = logic.investigationStages.find((stage) => stage.id === "dataCollection");
  const origin = logic.investigationStages.find((stage) => stage.id === "originDetermination");
  const cause = logic.investigationStages.find((stage) => stage.id === "causeDetermination");

  assert.ok(dataCollection.operations.some((operation) => operation.id === "systematicSceneExam"));
  assert.ok(origin.operations.some((operation) => operation.id === "testOriginHypotheses"));
  assert.ok(cause.operations.some((operation) => operation.id === "buildIgnitionSequence"));
  assert.equal(logic.initialInvestigation.dataCollection.operationSteps.systematicSceneExam.status, "Not Started");
});

test("data collection tabs follow the process map evidence categories", () => {
  assert.deepEqual(
    logic.dataCollectionTracks.map((track) => track.id),
    [
      "generalObservations",
      "witnessAndDigital",
      "fireEffects",
      "suppressionEffects",
      "physicalEvidence",
      "analysesAndReconstruction",
      "causeSpecificData",
      "outsideReportsResearch"
    ]
  );
  assert.ok(
    logic.dataCollectionTracks.some((track) =>
      /chain of custody/i.test([...track.prompts, ...track.expectedEvidence].join(" "))
    )
  );
  assert.ok(
    logic.dataCollectionTracks.some((track) => /CCTV/i.test([...track.prompts, ...track.expectedEvidence].join(" ")))
  );
});

test("scene examination steps support external internal and origin photo assignment", () => {
  assert.deepEqual(
    logic.sceneExaminationSteps.map((step) => step.id),
    ["externalExamination", "internalRoomByRoom", "sectorOfOrigin", "areaOfOrigin", "pointOfOrigin"]
  );
  assert.ok(logic.sceneExaminationSteps.some((step) => /room by room/i.test(step.title)));
  assert.ok(logic.sceneExaminationSteps.some((step) => /point of origin/i.test(step.title)));
  assert.ok(logic.sceneExaminationSteps.every((step) => step.sequence.length >= 5));
  assert.deepEqual(logic.initialInvestigation.dataCollection.sceneExamination.internalRoomByRoom.photos, []);
  assert.equal(logic.initialInvestigation.dataCollection.sceneExamination.externalExamination.entries[0].areaLabel, "Side A");
  assert.equal(logic.initialInvestigation.dataCollection.sceneExamination.internalRoomByRoom.entries[0].areaLabel, "Room 1");
});

test("report write-up follows the uploaded Grenada report structure", () => {
  assert.deepEqual(
    logic.reportSections.map((section) => section.id),
    [
      "cover",
      "definitions",
      "overview",
      "generalInformation",
      "investigation",
      "originAnalysis",
      "causeAnalysis",
      "samplesEvidence",
      "conclusion",
      "appendices"
    ]
  );
  assert.ok(logic.investigationStages.find((stage) => stage.id === "reportingReview").operations.some((operation) => operation.id === "writeInvestigationReport"));

  const investigation = structuredClone(logic.initialInvestigation);
  investigation.originDetermination.hypotheses = "Area of origin supported in the mezzanine storage area.";
  investigation.causeDetermination.hypotheses = "Cause remains undetermined pending electrical examination.";
  const draft = logic.buildReportDraft(investigation);

  assert.match(draft.cover, /FIRE INVESTIGATION REPORT/);
  assert.match(draft.originAnalysis, /mezzanine storage area/);
  assert.match(draft.causeAnalysis, /Natural, Accidental, Incendiary, or Undetermined/);
});

test("progress is based on completed investigation stages", () => {
  const investigation = structuredClone(logic.initialInvestigation);
  assert.equal(logic.calculateProgress(investigation), 0);

  investigation.preScene.status = "Complete";
  investigation.sceneAccess.status = "Complete";

  assert.equal(logic.calculateProgress(investigation), 29);
});

test("open items identify incomplete and undocumented stages", () => {
  const investigation = structuredClone(logic.initialInvestigation);
  investigation.preScene.status = "Complete";
  investigation.preScene.notes = "Initial information and hazards recorded.";
  investigation.causeDetermination.missingInfo = "Ignition source not yet confirmed.";

  const items = logic.buildOpenItems(investigation);

  assert.ok(items.some((item) => /1200 Scene Access: Not Started/.test(item)));
  assert.ok(items.some((item) => /Cause Determination: missing info - Ignition source not yet confirmed/.test(item)));
  assert.ok(!items.some((item) => /1000 Pre-scene Activities: add notes/.test(item)));
});

test("investigation summary separates notes evidence hypotheses and missing information", () => {
  const investigation = structuredClone(logic.initialInvestigation);
  investigation.originDetermination.status = "In Progress";
  investigation.originDetermination.notes = "Greatest damage observed in the mezzanine storage area.";
  investigation.originDetermination.evidence = "Photos 12-18 and scene sketch.";
  investigation.originDetermination.hypotheses = "Mezzanine origin hypothesis pending electrical analysis.";
  investigation.originDetermination.missingInfo = "Need full electrical panel examination.";

  const summary = logic.buildInvestigationSummary(investigation);

  assert.match(summary, /3000-3200 Origin Determination/);
  assert.match(summary, /Evidence\/Data: Photos 12-18 and scene sketch/);
  assert.match(summary, /Hypotheses\/Analysis: Mezzanine origin hypothesis/);
  assert.match(summary, /Missing Information: Need full electrical panel examination/);
});

test("investigation summary lists repeated scene examination entries", () => {
  const investigation = structuredClone(logic.initialInvestigation);
  investigation.dataCollection.sceneExamination.internalRoomByRoom.entries = [
    {
      id: "kitchen",
      areaLabel: "Kitchen",
      observationFocus: "Fire effects and appliances",
      notes: "Heavy smoke staining and heat damage noted.",
      gaps: "Need appliance exam.",
      photos: [{ id: "photo-1" }]
    },
    {
      id: "bedroom-1",
      areaLabel: "Bedroom 1",
      observationFocus: "Comparison area",
      notes: "Light smoke staining noted.",
      gaps: "",
      photos: []
    }
  ];

  const summary = logic.buildInvestigationSummary(investigation);

  assert.match(summary, /Entry 1: Kitchen/);
  assert.match(summary, /Photos: 1/);
  assert.match(summary, /Entry 2: Bedroom 1/);
});
