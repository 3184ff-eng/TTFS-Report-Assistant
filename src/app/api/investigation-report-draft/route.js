import { NextResponse } from "next/server";
import { formatRetrievedKnowledge, retrieveKnowledge } from "../../../lib/knowledge-retrieval";

const reportSections = [
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
];

const systemPrompt = `
You draft fire investigation reports from officer-provided investigation data.

Use NFPA 921 scientific-method discipline, NFPA 1033 documentation expectations, and the uploaded Grenada report structure.

Rules:
- Use all available fields in the investigation data and investigation summary.
- Do not invent facts, names, dates, locations, values, evidence, origin, cause, or classification.
- Keep unsupported information bracketed or marked as missing, unknown, unconfirmed, or requiring officer review.
- Separate facts, source statements, analysis, conclusions, and unresolved gaps.
- Origin conclusions must be tied to tested data and competing hypotheses.
- Cause conclusions must identify, where supported, ignition source, first material ignited, oxidant, and ignition sequence.
- Cause classification must be only Natural, Accidental, Incendiary, or Undetermined.
- If support is insufficient, state the limitation and keep origin or cause undetermined.

Return JSON only:
{
  "reportWriteup": {
    "cover": "string",
    "definitions": "string",
    "overview": "string",
    "generalInformation": "string",
    "investigation": "string",
    "originAnalysis": "string",
    "causeAnalysis": "string",
    "samplesEvidence": "string",
    "conclusion": "string",
    "appendices": "string"
  },
  "originGuidance": ["string"],
  "causeGuidance": ["string"],
  "missingInformation": ["string"],
  "concerns": ["string"]
}
`;

async function readJsonResponse(response) {
  const text = await response.text();
  try {
    return { data: JSON.parse(text), text };
  } catch {
    return { data: null, text };
  }
}

function extractResponseText(data) {
  if (typeof data.output_text === "string") {
    return data.output_text;
  }

  return (data.output || [])
    .flatMap((item) => item.content || [])
    .map((content) => content.text || "")
    .join("")
    .trim();
}

function normalizeReportDraft(result) {
  const writeup = result?.reportWriteup || {};
  return {
    reportWriteup: reportSections.reduce(
      (sections, section) => ({
        ...sections,
        [section]: String(writeup[section] || "")
      }),
      {}
    ),
    originGuidance: Array.isArray(result?.originGuidance) ? result.originGuidance.map(String) : [],
    causeGuidance: Array.isArray(result?.causeGuidance) ? result.causeGuidance.map(String) : [],
    missingInformation: Array.isArray(result?.missingInformation) ? result.missingInformation.map(String) : [],
    concerns: Array.isArray(result?.concerns) ? result.concerns.map(String) : []
  };
}

export async function POST(request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY is not configured on the server." }, { status: 500 });
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ error: "The report draft request was not valid JSON." }, { status: 400 });
    }

    const investigationSummary = String(payload.investigationSummary || "").trim();
    if (!investigationSummary) {
      return NextResponse.json({ error: "Investigation summary is required before drafting the report." }, { status: 400 });
    }

    const knowledgeQuery = `${investigationSummary}\n${JSON.stringify(payload.investigation || {})}`;
    const knowledgeContext = formatRetrievedKnowledge(retrieveKnowledge(knowledgeQuery, { limit: 10 }));
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_FIRE_INVESTIGATION_MODEL || process.env.OPENAI_MODEL || "gpt-4.1-mini",
        input: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: JSON.stringify(
              {
                investigation: payload.investigation || {},
                investigationSummary,
                existingReportWriteup: payload.existingReportWriteup || {},
                retrievedGuidance: knowledgeContext
              },
              null,
              2
            )
          }
        ],
        temperature: 0.2
      })
    });

    const { data } = await readJsonResponse(response);
    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error?.message || "OpenAI report drafting request failed." },
        { status: 500 }
      );
    }

    const result = JSON.parse(extractResponseText(data));
    return NextResponse.json(normalizeReportDraft(result));
  } catch (error) {
    return NextResponse.json({ error: error.message || "Investigation report drafting failed." }, { status: 500 });
  }
}
