import { NextResponse } from "next/server";
import { formatRetrievedKnowledge, retrieveKnowledge } from "../../../lib/knowledge-retrieval";

const editableFields = [
  "typeOfProperty",
  "howFireExtinguished",
  "descriptionOfDamage",
  "appliancesAttending",
  "officersAttending",
  "seniorOfficersAttending",
  "personnelAttendingDetails",
  "casualtyName1",
  "casualtyInjury1",
  "casualtyTreatedBy1",
  "casualtyName2",
  "casualtyInjury2",
  "casualtyTreatedBy2",
  "casualtyName3",
  "casualtyInjury3",
  "casualtyTreatedBy3",
  "casualtyName4",
  "casualtyInjury4",
  "casualtyTreatedBy4",
  "casualtyName5",
  "casualtyInjury5",
  "casualtyTreatedBy5",
  "casualtyName6",
  "casualtyInjury6",
  "casualtyTreatedBy6",
  "valueBuilding",
  "valueStock",
  "damageBuilding",
  "damageStock",
  "insuranceDetails",
  "officersObservations",
  "additionalInformation"
];

const systemPrompt = `
You improve Trinidad and Tobago Fire Service fire report form fields.

Rules:
- Correct grammar, spelling, punctuation, and professional TTFS report style.
- Do not invent facts or add missing details.
- Preserve names, times, addresses, appliance numbers, service numbers, vehicle registrations, money values, and cause classifications exactly.
- Officer's Observations must contain only what the officer observed from arrival to departure.
- Witness statements, information received, investigation findings, and actions before Fire Service arrival must go under Additional Information.
- Use only these cause classifications when one is stated: Natural, Accidental, Incendiary, Undetermined.
- Follow the TTFS Fire Report Guide and Vetting Checklist.
- Use the retrieved local knowledge excerpts as guidance and examples. Do not treat retrieved examples as facts about this incident.
- Return corrected field values only where wording can be improved from existing facts.
- Flag missing or concerning information instead of guessing.

Return JSON only:
{
  "fields": {
    "typeOfProperty": "string",
    "howFireExtinguished": "string",
    "descriptionOfDamage": "string",
    "appliancesAttending": "string",
    "officersAttending": "string",
    "seniorOfficersAttending": "string",
    "personnelAttendingDetails": "string",
    "casualtyName1": "string",
    "casualtyInjury1": "string",
    "casualtyTreatedBy1": "string",
    "casualtyName2": "string",
    "casualtyInjury2": "string",
    "casualtyTreatedBy2": "string",
    "casualtyName3": "string",
    "casualtyInjury3": "string",
    "casualtyTreatedBy3": "string",
    "casualtyName4": "string",
    "casualtyInjury4": "string",
    "casualtyTreatedBy4": "string",
    "casualtyName5": "string",
    "casualtyInjury5": "string",
    "casualtyTreatedBy5": "string",
    "casualtyName6": "string",
    "casualtyInjury6": "string",
    "casualtyTreatedBy6": "string",
    "valueBuilding": "string",
    "valueStock": "string",
    "damageBuilding": "string",
    "damageStock": "string",
    "insuranceDetails": "string",
    "officersObservations": "string",
    "additionalInformation": "string"
  },
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

function normalizeFields(result, originalForm) {
  const fields = {};
  editableFields.forEach((field) => {
    fields[field] = String(result.fields?.[field] ?? originalForm[field] ?? "");
  });

  return {
    fields,
    concerns: Array.isArray(result.concerns) ? result.concerns.map(String) : []
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
      return NextResponse.json({ error: "The form improvement request was not valid JSON." }, { status: 400 });
    }

    const form = payload.form || {};
    const retrievalQuery = JSON.stringify(form);
    const retrievedKnowledge = retrieveKnowledge(retrievalQuery, { limit: 7 });
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
          { role: "user", content: JSON.stringify({ form }, null, 2) }
        ],
        temperature: 0.2
      })
    });

    const { data } = await readJsonResponse(response);

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error?.message || "OpenAI form improvement request failed." },
        { status: response.status }
      );
    }

    if (!data) {
      return NextResponse.json({ error: "OpenAI returned an unexpected non-JSON response." }, { status: 502 });
    }

    const outputText =
      typeof data.output_text === "string"
        ? data.output_text
        : (data.output || [])
            .flatMap((item) => item.content || [])
            .map((content) => content.text || "")
            .join("")
            .trim();

    try {
      return NextResponse.json(normalizeFields(JSON.parse(outputText), form));
    } catch {
      return NextResponse.json(
        { error: "OpenAI returned form improvements that were not valid JSON.", raw: outputText },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error("AI field improvement failed:", error);
    return NextResponse.json({ error: "The AI field improvement route failed. Please try again." }, { status: 500 });
  }
}
