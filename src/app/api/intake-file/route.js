import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import { analyzePhotoWithVision } from "../../../lib/photo-vision-server.js";

const maxUploadBytes = 12 * 1024 * 1024;

function cleanText(text) {
  return String(text || "")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function uniqueMatches(matches) {
  return [...new Set(matches.map((item) => cleanText(item)).filter(Boolean))].slice(0, 12);
}

function suggestInitialFields(text, fileName) {
  const normalized = cleanText(text);
  const lines = normalized
    .split("\n")
    .map((line) => cleanText(line))
    .filter(Boolean);
  const lowerLines = lines.map((line) => line.toLowerCase());

  const dates = uniqueMatches(normalized.match(/\b(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}-\d{2}-\d{2})\b/g) || []);
  const times = uniqueMatches(normalized.match(/\b(?:[01]?\d|2[0-3])[:.][0-5]\d\s?(?:hrs?|hours|am|pm)?\b/gi) || []);
  const possibleAddresses = uniqueMatches(
    lines.filter((line) => /\b(?:street|st\.|road|rd\.|avenue|ave\.|lane|drive|trace|extension|estate|park|building|lot|no\.?)\b/i.test(line))
  );
  const hazards = uniqueMatches(lines.filter((line, index) => /hazard|chemical|gas|lpg|propane|electrical|collapse|asbestos|fuel|cylinder/.test(lowerLines[index])));
  const injuries = uniqueMatches(lines.filter((line, index) => /injur|fatal|casualt|death|burn|smoke inhalation/.test(lowerLines[index])));
  const witnesses = uniqueMatches(lines.filter((line, index) => /witness|occupant|owner|tenant|caller|neighbour|security|employee|firefighter|officer/.test(lowerLines[index])));
  const utilities = uniqueMatches(lines.filter((line, index) => /utility|electric|power|breaker|panel|gas|water|hvac|alarm|sprinkler/.test(lowerLines[index])));

  return {
    sourceFile: fileName,
    dates,
    times,
    possibleAddresses,
    hazards,
    injuries,
    witnesses,
    utilities,
    preSceneNotes: [
      dates.length ? `Dates found: ${dates.join("; ")}` : "",
      times.length ? `Times found: ${times.join("; ")}` : "",
      possibleAddresses.length ? `Possible address/location lines: ${possibleAddresses.join("; ")}` : "",
      hazards.length ? `Possible hazards: ${hazards.join("; ")}` : "",
      injuries.length ? `Possible injuries/fatalities: ${injuries.join("; ")}` : ""
    ]
      .filter(Boolean)
      .join("\n"),
    initialIntelligence: [
      witnesses.length ? `Witness/source leads: ${witnesses.join("; ")}` : "",
      utilities.length ? `Utility/building-system leads: ${utilities.join("; ")}` : "",
      normalized ? `Extracted source text requires officer review before being treated as fact.` : ""
    ]
      .filter(Boolean)
      .join("\n")
  };
}

async function extractTextFromFile(file, buffer) {
  const name = file.name || "uploaded file";
  const type = file.type || "";
  const lowerName = name.toLowerCase();

  if (type.startsWith("text/") || /\.(txt|md|csv|json|rtf)$/i.test(lowerName)) {
    return cleanText(new TextDecoder("utf-8").decode(buffer));
  }

  if (type === "application/pdf" || lowerName.endsWith(".pdf")) {
    const parser = new PDFParse({ data: Buffer.from(buffer) });
    try {
      const result = await parser.getText();
      return cleanText(result.text);
    } finally {
      await parser.destroy();
    }
  }

  if (
    type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lowerName.endsWith(".docx")
  ) {
    const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
    return cleanText(result.value);
  }

  throw new Error("Unsupported file type. Upload .txt, .pdf, .docx, or an image file.");
}

function bufferToDataUrl(file, buffer) {
  return `data:${file.type || "application/octet-stream"};base64,${Buffer.from(buffer).toString("base64")}`;
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const operationTitle = String(formData.get("operationTitle") || "Initial Intelligence");
    const stageTitle = String(formData.get("stageTitle") || "Pre-scene Activities");

    if (!file || typeof file.arrayBuffer !== "function") {
      return Response.json({ error: "Upload a file for intake." }, { status: 400 });
    }

    if (file.size > maxUploadBytes) {
      return Response.json({ error: "File is too large. Upload a file smaller than 12 MB." }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();

    if ((file.type || "").startsWith("image/")) {
      const analysis = await analyzePhotoWithVision({
        image: bufferToDataUrl(file, buffer),
        imageInfo: { fileName: file.name, type: file.type, size: file.size },
        analysisMode: "fire-investigation",
        investigationContext: {
          stage: stageTitle,
          trackTitle: operationTitle,
          trackCode: "Initial intake"
        },
        location: { placeName: operationTitle }
      });

      const imageText = [
        analysis.summary,
        ...(analysis.visibleFeatures || []),
        ...(analysis.customerClues || []),
        ...(analysis.concerns || [])
      ].join("\n");

      return Response.json({
        fileName: file.name,
        fileType: file.type,
        extractedText: cleanText(imageText),
        imageAnalysis: analysis,
        suggestions: suggestInitialFields(imageText, file.name),
        reviewWarning: "Image analysis is decision-support only. The investigator must verify all visible features."
      });
    }

    const extractedText = await extractTextFromFile(file, buffer);
    return Response.json({
      fileName: file.name,
      fileType: file.type,
      extractedText,
      suggestions: suggestInitialFields(extractedText, file.name),
      reviewWarning: "Extracted text is source material only. Do not treat it as established fact until reviewed."
    });
  } catch (error) {
    return Response.json({ error: error.message || "File intake failed." }, { status: 400 });
  }
}
