import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

async function loadPageLogic() {
  const source = readFileSync(new URL("../src/app/page.js", import.meta.url), "utf8");
  const start = source.indexOf("const tabs =");
  const end = source.indexOf("function FieldInput");

  assert.notEqual(start, -1, "Could not find start of pure page logic.");
  assert.notEqual(end, -1, "Could not find end of pure page logic.");

  const modulePath = join(tmpdir(), `ttfs-page-logic-${Date.now()}-${Math.random().toString(16).slice(2)}.mjs`);
  const moduleSource = `${source.slice(start, end)}

export {
  buildAppendices,
  buildFireReport,
  buildRecommendations,
  buildValidationWarnings,
  calculateCategoryScores,
  calculateQualityScore,
  causeClassifications,
  formFields,
  formatAssistantError,
  howCallReceivedOptions,
  improveFormFieldsLocally,
  improveWritingNotes,
  inferBulkData,
  initialForm,
  incidentTypes,
  stationGroups,
  stationOptions,
  watchOptions
};
`;

  writeFileSync(modulePath, moduleSource);
  return import(`file://${modulePath}`);
}

const logic = await loadPageLogic();

test("dropdown options include updated incident and call-received values", () => {
  assert.ok(logic.incidentTypes.includes("Indiscriminate Burning"));
  assert.ok(logic.incidentTypes.includes("Rubbish Fire"));
  assert.ok(logic.howCallReceivedOptions.includes("Wireless via North Control"));
  assert.ok(logic.howCallReceivedOptions.includes("Wireless via Fire Control"));
  assert.ok(logic.howCallReceivedOptions.includes("Telephone via Fire Control"));
});

test("assistant network failures explain that the server route is unreachable", () => {
  const message = logic.formatAssistantError(new TypeError("Failed to fetch"), "Local field cleanup");

  assert.match(message, /AI server route could not be reached/);
  assert.match(message, /Local field cleanup was used/);
});

test("station dropdown uses headquarters grouped station list", () => {
  assert.deepEqual(
    logic.stationGroups.map((group) => group.label),
    ["TTFS Headquarters North", "TTFS Headquarters Central", "TTFS Headquarters South", "TTFS Headquarters Tobago"]
  );
  assert.ok(logic.stationOptions.includes("Chaguaramas Fire Station"));
  assert.ok(logic.stationOptions.includes("Santa Cruz Fire Station"));
  assert.ok(logic.stationOptions.includes("Couva South Fire Station"));
  assert.ok(logic.stationOptions.includes("Piarco Fire Station"));
  assert.ok(!logic.stationOptions.includes("Arouca Fire Station"));
});

function completeForm(overrides = {}) {
  return {
    ...logic.initialForm,
    reportNumber: "TTFS-001",
    station: "Arima Fire Station",
    watch: "White Watch",
    incidentType: "House Fire",
    wind: "None",
    dateCallReceived: "2026-06-13",
    timeCallReceived: "10:15",
    howCallReceived: "999/990 Emergency Call",
    addressGiven: "10 Main Street, Arima",
    actualAddress: "10 Main Street, Arima",
    timeApplianceLeftStation: "10:17",
    approxDistanceToFire: "2 km",
    ownerOccupier: "John Doe",
    hydrantDistance: "30 m",
    causeOfFire: "Undetermined",
    waterSupply: "Yes",
    lpmAvailable: "1000",
    lpmRequired: "750",
    typeOfProperty: "One-storey concrete dwelling house.",
    howFireExtinguished: "The fire was extinguished using one hose reel.",
    descriptionOfDamage: "Kitchen area sustained heat and smoke damage.",
    appliancesAttending: "#554 Water Tender",
    officersAttending: "3184 FF Mills",
    seniorOfficersAttending: "3177 Firefighter St. Louis in charge",
    personnelAttendingDetails: "3184 FF Mills, 3558 FF Small, 2467 FF John and 4567 FF Gram",
    professionalsAttending: "4",
    auxiliaryAttending: "0",
    casualtyName1: "No casualties",
    casualtyInjury1: "Nil",
    casualtyTreatedBy1: "N/A",
    valueBuilding: "1,500,000",
    valueStock: "150,000",
    damageBuilding: "75,000",
    damageStock: "15,000",
    insuranceDetails: "Insurance was not ascertained.",
    officersObservations: "On arrival, smoke was observed coming from the kitchen area.",
    additionalInformation: "Occupier stated the fire was seen before Fire Service arrival.",
    dateOfFire: "2026-06-13",
    dateOfReport: "2026-06-13",
    reportingOfficer: "3184 FF Mills",
    rank: "Firefighter",
    ...overrides
  };
}

test("mandatory validation rejects unsupported cause classifications", () => {
  const warnings = logic.buildValidationWarnings(completeForm({ causeOfFire: "Electrical" }));

  assert.ok(
    warnings.includes("Unsupported cause determination. Use only Natural, Accidental, Incendiary, or Undetermined.")
  );
});

test("complete form produces a 100 category quality score", () => {
  const form = completeForm();
  const warnings = logic.buildValidationWarnings(form);
  const scores = logic.calculateCategoryScores(form, warnings);

  assert.equal(logic.calculateQualityScore(scores), 100);
  assert.deepEqual(Object.values(scores), [100, 100, 100, 100, 100, 100]);
});

test("bulk notes extract official fields and personnel details", () => {
  const notes = `
On the 12th March 2018, #554 Water Tender with #3177 Firefighter St. Louis in charge and crew along
with #168 Ambulance driven by #3284 Firefighter Evelyn, left the Arima Fire Station in response to a fire call at
# 103 Timberland Park, D'abadie.
Number of men attending: 3184 ff Mills, 3558 ff Small, 2467 ff John and 4567 ff Gram
Involved was a two storey dwelling of B Class construction, valued at approximately One Million Five Hundred Thousand Dollars ($1,500,000.00).
Damages to the building estimated at seventy-five thousand dollars, ($75,000.00).
`;

  const result = logic.inferBulkData(notes);

  assert.equal(result.data.station, "Arima Fire Station");
  assert.equal(result.data.dateCallReceived, "2018-03-12");
  assert.equal(result.data.actualAddress, "# 103 Timberland Park, D'abadie");
  assert.match(result.data.appliancesAttending, /#554 Water Tender/);
  assert.match(result.data.personnelAttendingDetails, /3184 ff Mills/i);
  assert.equal(result.data.valueBuilding, "1,500,000.00");
  assert.equal(result.data.damageBuilding, "75,000");
});

test("bulk personnel details do not duplicate into officers attending", () => {
  const result = logic.inferBulkData(
    "Number of men attending: 3184 ff Mills, 3558 ff Small, 2467 ff John and 4567 ff Gram"
  );

  assert.equal(result.data.personnelAttendingDetails, "3184 ff Mills, 3558 ff Small, 2467 ff John and 4567 ff Gram");
  assert.equal(result.data.officersAttending, undefined);
});

test("unlabelled rough notes are sorted into the best report fields", () => {
  const result = logic.inferBulkData(
    "Upon arrival smoke was observed issuing from the bedroom window. Fire was extinguished using one 45 mm hose line and overhaul was conducted. Fire damage was confined to a mattress and wardrobe. The occupier stated he smelled smoke before arrival. Involved was a single-storey residential dwelling of concrete and timber construction."
  );

  assert.match(result.data.officersObservations, /Smoke was observed/i);
  assert.match(result.data.howFireExtinguished, /45 mm hose line/i);
  assert.match(result.data.descriptionOfDamage, /mattress and wardrobe/i);
  assert.match(result.data.additionalInformation, /occupier stated/i);
  assert.match(result.data.typeOfProperty, /single-storey residential dwelling/i);
});

test("multiline dumped report data sorts into the correct official fields", () => {
  const result = logic.inferBulkData(`
Report No.: 145

Type of Call:
Structural Fire

Station:
Arima Fire Station

Watch:
White Watch

Wind:
Light

Date Call Received:
13 June 2026

Time Call Received:
0410 hrs

How Call Received:
Telephone via North Control

Owner / Occupier:
Mr. Steve Clement

Address Given:
LP #42 O'Meara Road, Arima

Actual Address:
LP #42 O'Meara Road, Arima

Distance to Nearest Hydrant:
Approximately 80 metres

Cause of Fire:
Undetermined

Time Appliance Left Station:
0415 hrs

Approximate Distance to Fire:
7 kilometres

Water Supply Sufficient:
Yes

LPM Available:
1000 LPM

LPM Required:
500 LPM

How Fire Was Extinguished:
Firefighting operations were commenced using one 45 mm hose line.

Values, Damage and Insurance:
Estimated value of building: TT$600,000.00
Estimated value of contents: TT$120,000.00
Estimated fire damage: TT$25,000.00
Owner stated that the property is insured with Guardian General Insurance Limited.
`);

  assert.equal(result.data.reportNumber, "145");
  assert.equal(result.data.incidentType, "Structural Fire");
  assert.equal(result.data.wind, "Light");
  assert.equal(result.data.dateCallReceived, "2026-06-13");
  assert.equal(result.data.timeCallReceived, "04:10");
  assert.equal(result.data.timeApplianceLeftStation, "04:15");
  assert.equal(result.data.waterSupply, "Yes");
  assert.equal(result.data.howFireExtinguished, "Firefighting operations were commenced using one 45 mm hose line.");
  assert.equal(result.data.valueBuilding, "600,000.00");
  assert.equal(result.data.valueStock, "120,000.00");
  assert.equal(result.data.damageBuilding, "25,000.00");
  assert.match(result.data.insuranceDetails, /Guardian General Insurance Limited/);
});

test("AI writing mode separates observations from received information", () => {
  const result = logic.improveWritingNotes(
    "On arrival smoke was seen from the kitchen. Witness stated occupants left before arrival. Damage to kitchen cupboards. Fire extinguished with one hose reel. Cause undetermined.",
    "Fire Prevention Standard"
  );

  assert.ok(result.sections["Officer's Observations"].some((line) => /smoke/i.test(line)));
  assert.ok(result.sections["Additional Information"].some((line) => /Witness stated/i.test(line)));
  assert.ok(result.sections["Description of Damage"].length > 0);
  assert.ok(result.sections["How Fire Was Extinguished"].length > 0);
  assert.ok(result.sections["Cause Determination"].length > 0);
});

test("long official fields create appendix continuation pages", () => {
  const form = completeForm({
    officersObservations: "Observed smoke and heat damage. ".repeat(40)
  });

  const appendices = logic.buildAppendices(form);

  assert.ok(appendices.length >= 1);
  assert.equal(appendices[0].section, "Officer's observations Continued");
});

test("local field cleanup preserves service numbers and names", () => {
  const result = logic.improveFormFieldsLocally(
    completeForm({
      personnelAttendingDetails: "3184 ff MIlls, 3558 ff Small, 2467 ff John and 4567 ff Gram",
      howFireExtinguished: "put out with one hose reel"
    })
  );

  assert.equal(result.fields.personnelAttendingDetails, "3184 ff MIlls, 3558 ff Small, 2467 ff John and 4567 ff Gram");
  assert.match(result.fields.howFireExtinguished, /extinguished/i);
});
