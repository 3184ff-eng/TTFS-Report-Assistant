import { NextResponse } from "next/server";
import { formatRetrievedKnowledge, retrieveKnowledge } from "../../../lib/knowledge-retrieval";

const writingSections = [
  "Officer's Observations",
  "Additional Information",
  "Description of Damage",
  "How Fire Was Extinguished",
  "Cause Determination"
];

const systemPrompt = `
You are the AI Writing Assistant for the TTFS Report Assistant.

Follow these rules exactly:
- Improve grammar, spelling, punctuation, and sentence structure.
- Reconstruct weak sentences into clear professional Trinidad and Tobago Fire Service report language.
- Do not invent facts.
- Do not change facts.
- Preserve names, times, addresses, appliance numbers, service numbers, vehicle registrations, values, and cause classifications exactly.
- Use only these cause classifications when a cause classification is stated: Natural, Accidental, Incendiary, Undetermined.
- Separate Officer's Observations from Additional Information.
- Officer's Observations must include only what the officer observed from arrival to departure.
- Witness statements, information received, and actions before Fire Service arrival must go under Additional Information.
- Follow the TTFS Fire Report Guide, Northern Division Guide to Completion of Fire Reports, and Fire Report Vetting Checklist.
- Use the retrieved local knowledge excerpts as guidance and examples. Do not treat retrieved examples as facts about this incident.
- Flag missing information instead of guessing.

Return JSON only with this exact shape:
{
  "originalText": "string",
  "improvedText": "string",
  "sections": {
    "Officer's Observations": ["string"],
    "Additional Information": ["string"],
    "Description of Damage": ["string"],
    "How Fire Was Extinguished": ["string"],
    "Cause Determination": ["string"]
  },
  "concerns": ["string"],
  "qualityScore": 0,
  "firePreventionReadinessScore": 0
}
`;

function emptySections() {
  return writingSections.reduce((sections, section) => ({ ...sections, [section]: [] }), {});
}

function normalizeResult(result, originalText) {
  const sections = emptySections();
  Object.entries(result.sections || {}).forEach(([section, values]) => {
    if (sections[section]) {
      sections[section] = Array.isArray(values) ? values.map(String) : [String(values)];
    }
  });

  return {
    originalText: String(result.originalText || originalText || ""),
    improvedText: String(result.improvedText || ""),
    sections,
    concerns: Array.isArray(result.concerns) ? result.concerns.map(String) : [],
    qualityScore: Number.isFinite(Number(result.qualityScore)) ? Number(result.qualityScore) : 0,
    firePreventionReadinessScore: Number.isFinite(Number(result.firePreventionReadinessScore))
      ? Number(result.firePreventionReadinessScore)
      : 0
  };
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

async function readJsonResponse(response) {
  const bodyText = await response.text();

  try {
    return { data: JSON.parse(bodyText), bodyText };
  } catch {
    return { data: null, bodyText };
  }
}

export async function POST(request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured on the server." },
        { status: 500 }
      );
    }

    let payload;

    try {
      payload = await request.json();
    } catch {
      return NextResponse.json(
        { error: "The AI Writing Assistant request was not valid JSON." },
        { status: 400 }
      );
    }

    const { text, mode } = payload;

    if (!String(text || "").trim()) {
      return NextResponse.json(
        { error: "Text is required for the AI Writing Assistant." },
        { status: 400 }
      );
    }

    const retrievedKnowledge = retrieveKnowledge(`${mode || ""}\n${text}`, { limit: 7 });
    const knowledgeContext = formatRetrievedKnowledge(retrievedKnowledge);

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        input: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Retrieved TTFS guidance and examples from the local knowledge base:\n\n${knowledgeContext}`
          },
          {
            role: "user",
            content: `Mode: ${mode || "Professional Rewrite"}\n\nOriginal text:\n${text}`
          }
        ],
        temperature: 0.2
      })
    });

    const { data } = await readJsonResponse(response);

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error?.message || "OpenAI request failed." },
        { status: response.status }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "OpenAI returned an unexpected non-JSON response." },
        { status: 502 }
      );
    }

    const outputText = extractResponseText(data);

    try {
      return NextResponse.json(normalizeResult(JSON.parse(outputText), text));
    } catch {
      return NextResponse.json(
        { error: "OpenAI returned a response that was not valid JSON.", raw: outputText },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error("AI Writing Assistant failed:", error);
    return NextResponse.json(
      { error: "The AI Writing Assistant server route failed. Please try again." },
      { status: 500 }
    );
  }
}
