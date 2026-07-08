import { NextResponse } from "next/server";
import { formatRetrievedKnowledge, retrieveKnowledge } from "../../../lib/knowledge-retrieval";

const assistantId =
  process.env.OPENAI_FIRE_INVESTIGATION_ASSISTANT_ID || process.env.FIRE_INVESTIGATION_ASSISTANT_ID || "";

const systemPrompt = `
You are the Fire Investigation AI Agent connected to the TTFS Report Assistant.

Use your fire-investigation expertise to guide the officer through the investigation workflow while obeying TTFS report rules.

Rules:
- Do not invent facts.
- Preserve the distinction between direct observations, witness statements, received information, investigation analysis, and events before Fire Service arrival.
- Officer's Observations must contain only what the officer observed from arrival to departure.
- Witness statements, received information, pre-arrival actions, access/legal notes, and investigation findings belong in Additional Information or internal investigation notes.
- Use only these official cause classifications when a cause classification is stated: Natural, Accidental, Incendiary, Undetermined.
- Do not convert probable cause language into an official cause classification unless the officer explicitly confirms it.
- If ignition source, first fuel, oxidant, area of origin, timeline, access, witness, safety, evidence, or suppression-effect information is missing, flag it.
- Tie recommendations to the current investigation stage and the official TTFS report fields where appropriate.
- Surface uncertainty clearly as missing, unknown, unconfirmed, or requiring officer review.

Return JSON only:
{
  "answer": "string",
  "concerns": ["string"],
  "suggestedUpdates": ["string"],
  "missingInformation": ["string"],
  "stageFocus": "string"
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

function normalizeAgentResult(result) {
  return {
    answer: String(result.answer || ""),
    concerns: Array.isArray(result.concerns) ? result.concerns.map(String) : [],
    suggestedUpdates: Array.isArray(result.suggestedUpdates) ? result.suggestedUpdates.map(String) : [],
    missingInformation: Array.isArray(result.missingInformation) ? result.missingInformation.map(String) : [],
    stageFocus: String(result.stageFocus || "")
  };
}

function buildAgentPayload(payload, knowledgeContext) {
  return JSON.stringify(
    {
      question: String(payload.question || ""),
      activeStage: payload.activeStage || "",
      form: payload.form || {},
      investigation: payload.investigation || {},
      investigationSummary: payload.investigationSummary || "",
      retrievedGuidance: knowledgeContext
    },
    null,
    2
  );
}

async function callResponsesModel(apiKey, payload, knowledgeContext) {
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
          content: buildAgentPayload(payload, knowledgeContext)
        }
      ],
      temperature: 0.2
    })
  });

  const { data } = await readJsonResponse(response);
  if (!response.ok) {
    throw new Error(data?.error?.message || "OpenAI fire investigation model request failed.");
  }

  const outputText = extractResponseText(data);
  return JSON.parse(outputText);
}

async function openAiJsonFetch(path, apiKey, options = {}) {
  const response = await fetch(`https://api.openai.com/v1${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "OpenAI-Beta": "assistants=v2",
      ...(options.headers || {})
    }
  });
  const { data } = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.error?.message || `OpenAI assistant request failed at ${path}.`);
  }

  return data;
}

async function callConfiguredAssistant(apiKey, payload, knowledgeContext) {
  const thread = await openAiJsonFetch("/threads", apiKey, {
    method: "POST",
    body: JSON.stringify({
      messages: [
        {
          role: "user",
          content: `${systemPrompt}\n\nIncident and investigation context:\n${buildAgentPayload(payload, knowledgeContext)}`
        }
      ]
    })
  });

  let run = await openAiJsonFetch(`/threads/${thread.id}/runs`, apiKey, {
    method: "POST",
    body: JSON.stringify({
      assistant_id: assistantId,
      instructions: systemPrompt
    })
  });

  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (["completed", "failed", "cancelled", "expired", "requires_action"].includes(run.status)) {
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, 900));
    run = await openAiJsonFetch(`/threads/${thread.id}/runs/${run.id}`, apiKey);
  }

  if (run.status !== "completed") {
    throw new Error(`Fire investigation assistant run did not complete. Status: ${run.status}.`);
  }

  const messages = await openAiJsonFetch(`/threads/${thread.id}/messages?limit=10`, apiKey);
  const assistantMessage = (messages.data || []).find((message) => message.role === "assistant");
  const outputText = (assistantMessage?.content || [])
    .map((content) => content.text?.value || "")
    .join("")
    .trim();

  return JSON.parse(outputText);
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
      return NextResponse.json({ error: "The fire investigation agent request was not valid JSON." }, { status: 400 });
    }

    const question = String(payload.question || "").trim();
    if (!question) {
      return NextResponse.json({ error: "Question or instruction is required for the fire investigation agent." }, { status: 400 });
    }

    const knowledgeQuery = `${question}\n${payload.investigationSummary || ""}\n${JSON.stringify(payload.form || {})}\n${JSON.stringify(payload.investigation || {})}`;
    const knowledgeContext = formatRetrievedKnowledge(retrieveKnowledge(knowledgeQuery, { limit: 10 }));
    const rawResult = assistantId
      ? await callConfiguredAssistant(apiKey, payload, knowledgeContext)
      : await callResponsesModel(apiKey, payload, knowledgeContext);

    return NextResponse.json({
      ...normalizeAgentResult(rawResult),
      connectedAgent: Boolean(assistantId)
    });
  } catch (error) {
    console.error("Fire investigation agent failed:", error);
    return NextResponse.json(
      { error: "The Fire Investigation AI Agent route failed. Confirm the agent ID and try again." },
      { status: 500 }
    );
  }
}
