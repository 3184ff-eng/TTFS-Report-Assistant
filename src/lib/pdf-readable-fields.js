// All measurements are PDF points; leave padding for widget borders and descenders.
export function takeLines(text, font, size, width, count) {
  let remaining = String(text || "").trim();
  const lines = [];
  while (remaining && lines.length < count) {
    let end = 0;
    while (end < remaining.length && remaining[end] !== "\n" &&
      font.widthOfTextAtSize(remaining.slice(0, end + 1), size) <= width) end++;
    if (!end && remaining[0] !== "\n") break;
    if (end < remaining.length && remaining[end] !== "\n") {
      const space = remaining.lastIndexOf(" ", end);
      if (space > 0) end = space;
    }
    lines.push(remaining.slice(0, end).trimEnd());
    remaining = remaining.slice(end).trimStart();
  }
  return { lines, remaining };
}

export function fillReadableGroup(form, names, text, font, label, overflow) {
  const fields = names.map(name => form.getTextField(name));
  const source = String(text || "").trim();
  function layout(size, marker = "") {
    let remaining = source;
    const values = fields.map((field, index) => {
      const rect = field.acroField.getWidgets()[0].getRectangle();
      const width = rect.width - 6;
      const count = field.isMultiline() ? Math.max(1, Math.floor((rect.height - 6) / (size * 1.2))) : 1;
      const last = index === fields.length - 1;
      // Reserve a full line for the continuation reference in multiline widgets.
      const result = takeLines(remaining, font, size,
        last && marker && count === 1 ? width - font.widthOfTextAtSize(marker, size) : width,
        last && marker && count > 1 ? count - 1 : count);
      remaining = result.remaining;
      return result.lines.join("\n") + (last && marker ? `${count > 1 ? "\n" : " "}${marker}` : "");
    });
    return { values, remaining };
  }
  let size = 12;
  let result = layout(size);
  while (result.remaining && size > 9) result = layout(size -= 0.5);
  if (result.remaining) {
    result = layout(9, "[See Appendix]");
    overflow.push({ section: `${label} Continued`, text: result.remaining });
  }
  fields.forEach((field, index) => {
    field.acroField.setDefaultAppearance(`/Times-Roman ${size} Tf 0 g`);
    field.setText(result.values[index]);
    field.updateAppearances(font);
  });
  return { ...result, size };
}

export function drawCombinedAppendices(doc, data, entries, font, bold) {
  let page;
  let y;
  let number = 0;
  function newPage(section) {
    page = doc.addPage([612, 792]);
    number++;
    page.drawText(`APPENDIX ${number}`, { x: 54, y: 744, size: 14, font: bold });
    y = 714;
    const metadata = [
      `Fire Report Number: ${data.reportNumber || "[Missing]"}`,
      `Address of Fire: ${data.actualAddress || data.addressGiven || "[Missing]"}`,
      `Date of Fire: ${data.dateOfFire || data.dateCallReceived || "[Missing]"}`,
      `Date of Report: ${data.dateOfReport || "[Missing]"}`
    ];
    metadata.forEach(text => {
      takeLines(text, font, 12, 504, Infinity).lines.forEach(line => {
        page.drawText(line, { x: 54, y, size: 12, font }); y -= 15;
      });
    });
    y -= 16;
    page.drawText("Officer Signature: ______________________________", { x: 54, y: 72, size: 12, font });
    page.drawText("Rank: ____________________", { x: 360, y: 72, size: 12, font });
  }
  for (const entry of entries.filter(entry => entry.text)) {
    let lines = takeLines(entry.text, font, 12, 504, Infinity).lines;
    while (lines.length) {
      if (!page || y < 150) newPage(entry.section);
      page.drawText(entry.section, { x: 54, y, size: 12, font: bold });
      y -= 20;
      const count = Math.max(1, Math.floor((y - 110) / 15));
      lines.splice(0, count).forEach(line => {
        page.drawText(line, { x: 54, y, size: 12, font }); y -= 15;
      });
      y -= 14;
      if (lines.length) newPage(entry.section);
    }
  }
}
