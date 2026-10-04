import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { fillReadableGroup, drawCombinedAppendices, takeLines, completeBoundary } from "../src/lib/pdf-readable-fields.js";

test("continuations use complete sentences or paragraph breaks", () => {
  const text = "The roof was damaged. The next sentence is too long to fit.";
  assert.equal(text.slice(0, completeBoundary(text, 35)), "The roof was damaged.");
  assert.equal(completeBoundary("An unfinished sentence with no punctuation", 20), 0);
  assert.equal(completeBoundary("First paragraph\n\nSecond paragraph", 20), 15);
  assert.equal(completeBoundary("Mr. Mills observed smoke.", 8), 0);
  assert.equal(completeBoundary("Value $500.00 was recorded.", 12), 0);
});

test("official narrative fields keep 9-12 point text and retain every overflow word", async () => {
  const doc = await PDFDocument.load(readFileSync("public/templates/ttfs-fire-report-form.pdf"));
  const font = await doc.embedFont(StandardFonts.TimesRoman);
  const form = doc.getForm();
  const overflow = [];
  const source = "Observed timber walls and a galvanised roof. ".repeat(250).trim();
  for (const name of ["Text4", "Text5", "Text6", "Text3"]) {
    form.getTextField(name).enableMultiline();
    const result = fillReadableGroup(form, [name], source, font, name, overflow);
    assert.equal(result.size, 9);
    assert.ok(result.remaining.startsWith("Observed timber"));
    assert.ok(result.values[0].replace("[See Appendix]", "").trimEnd().endsWith("roof."));
    const actual = result.values.join(" ").replace("[See Appendix]", "") + " " + result.remaining;
    assert.equal(actual.replace(/\s+/g, " ").trim(), source);
    const rect = form.getTextField(name).acroField.getWidgets()[0].getRectangle();
    for (const line of result.values[0].split("\n")) assert.ok(font.widthOfTextAtSize(line, 9) <= rect.width - 6);
  }
  drawCombinedAppendices(doc, {reportNumber: "145", actualAddress: "Arima"}, overflow, font, font);
  assert.ok(doc.getPageCount() > 3);
  const restored = await PDFDocument.load(await doc.save());
  assert.match(restored.getForm().getTextField("Text4").acroField.getDefaultAppearance(), /9 Tf/);
});

test("short text uses 12 points and row groups retain more than five list items", async () => {
  const doc = await PDFDocument.load(readFileSync("public/templates/ttfs-fire-report-form.pdf"));
  const font = await doc.embedFont(StandardFonts.TimesRoman);
  const form = doc.getForm();
  const overflow = [];
  assert.equal(fillReadableGroup(form, ["Text4"], "Concrete dwelling.", font, "Property", overflow).size, 12);
  const text = Array.from({length: 80}, (_, i) => `FF Officer ${i}`).join(", ");
  const result = fillReadableGroup(form, Array.from({length: 5}, (_, i) => `Officers AttendingRow${i + 1}`), text, font, "Officers", overflow);
  assert.equal((result.values.join(" ").replace("[See Appendix]", "") + " " + result.remaining).replace(/\s+/g, " ").trim(), text);
  assert.equal(overflow.length, 1);
  const wide = "W".repeat(500);
  const wrapped = takeLines(wide, font, 12, 504, Infinity);
  assert.equal(wrapped.lines.join(""), wide);
  assert.ok(wrapped.lines.every(line => font.widthOfTextAtSize(line, 12) <= 504));
});
