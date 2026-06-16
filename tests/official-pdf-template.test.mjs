import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { PDFDocument } from "pdf-lib";

const requiredFields = [
  "No",
  "Text7",
  "Fire Station",
  "Date Call Received",
  "Time Call Received",
  "How Call Received",
  "Address Given 1",
  "Actual Address of Fire 1",
  "Time Appliance Left Station",
  "Approx Distance to Fire 1",
  "Owners Name",
  "Distance of nearest Hydrant to Fire",
  "Cause of Fire 1",
  "Check Box1",
  "Check Box2",
  "LPM Available",
  "LPM Required",
  "Text4",
  "Text5",
  "Text6",
  "Appliances AttendingRow1",
  "Officers AttendingRow1",
  "FSSO  FSOs AttendingRow1",
  "Number of Men Attending 1",
  "Number of Men Attending 2",
  "Text1",
  "Text2",
  "NameRow1",
  "Brief description of injuriesRow1",
  "Treated byRow1",
  "Date",
  "Rank",
  "Value of Building",
  "Value of Stock",
  "Damage to Building",
  "Damage to Stock",
  "Building and Stock Insured as follows 1",
  "Text3"
];

test("official output template is the fillable TTFS PDF expected by export mapping", async () => {
  const pdf = await PDFDocument.load(readFileSync(new URL("../public/templates/ttfs-fire-report-form.pdf", import.meta.url)));
  const fields = new Set(pdf.getForm().getFields().map((field) => field.getName()));

  assert.equal(pdf.getPageCount(), 2);
  requiredFields.forEach((fieldName) => {
    assert.ok(fields.has(fieldName), `Missing PDF field: ${fieldName}`);
  });
});
