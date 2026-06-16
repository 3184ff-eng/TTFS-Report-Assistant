import { NextResponse } from "next/server";
import { formatRetrievedKnowledge, retrieveKnowledge } from "../../../lib/knowledge-retrieval";

const allowedFields = [
  "reportNumber",
  "station",
  "watch",
  "incidentType",
  "wind",
  "dateCallReceived",
  "timeCallReceived",
  "howCallReceived",
  "addressGiven",
  "actualAddress",
  "timeApplianceLeftStation",
  "approxDistanceToFire",
  "ownerOccupier",
  "hydrantDistance",
  "causeOfFire",
  "waterSupply",
  "lpmAvailable",
  "lpmRequired",
  "typeOfProperty",
  "howFireExtinguished",
  "descriptionOfDamage",
  "appliancesAttending",
  "officersAttending",
  "seniorOfficersAttending",
  "personnelAttendingDetails",
  "professionalsAttending",
  "auxiliaryAttending",
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
  "additionalInformation",
  "dateOfFire",
  "dateOfReport",
  "reportingOfficer",
  "rank"
];

const systemPrompt = `
You are the TTFS Report Assistant auto-fill engine.

Task:
- Read dumped officer notes.
- Extract only facts explicitly present.
- Sort facts into the correct official TTFS Fire Report Form fields.
- Use retrieved TTFS guide/checklist/examples for placement rules only.

Rules:
- Do not invent facts.
- Preserve service numbers, names, times, addresses, appliance numbers, vehicle registrations, values, and stated cause classifications exactly.
- Correct grammar, spelling, punctuation, capitalization, and sentence structure before returning field text.
- Read every sentence and assign it to the best applicable official form field.
- If a sentence contains both observed facts and received information, split the ideas between Officer's Observations and Additional Information.
- Officer's Observations must contain only what was observed from Fire Service arrival to departure.
- Witness statements, received information, investigation findings, and actions before Fire Service arrival must go under Additional Information.
- Property construction, occupancy, dimensions, class of construction, use, and exposures belong in typeOfProperty.
- Hose lines, water/foam/dry powder, isolation, overhaul, hotspots, and how the fire was brought under control belong in howFireExtinguished.
- Burn, smoke, heat, water, stock, content, structure, vehicle, pole, and exposure damage belong in descriptionOfDamage.
- Origin/cause investigation narrative belongs in Additional Information unless a supported cause classification is explicitly stated.
- Personnel names/service numbers belong in personnelAttendingDetails unless the notes clearly identify the official Officers Attending field separately.
- Do not duplicate personnelAttendingDetails into officersAttending.
- Values must be split into valueBuilding, valueStock, damageBuilding, damageStock, and insuranceDetails.
- Casualties must be split into casualty table fields: name, injury, treated by.
- Use only causeOfFire values Natural, Accidental, Incendiary, or Undetermined when explicitly stated.
- If information is missing or uncertain, add a concern instead of guessing.

Return JSON only:
{
  "data": {},
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

function normalizeResult(result) {
  const data = {};
  Object.entries(result.data || {}).forEach(([field, value]) => {
    if (allowedFields.includes(field) && String(value || "").trim()) {
      data[field] = String(value).trim();
    }
  });

  return {
    data,
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
      return NextResponse.json({ error: "The auto-fill request was not valid JSON." }, { status: 400 });
    }

    const notes = String(payload.notes || "").trim();
    if (!notes) {
      return NextResponse.json({ error: "Dumped notes are required for auto-fill." }, { status: 400 });
    }

    const knowledgeContext = formatRetrievedKnowledge(retrieveKnowledge(notes, { limit: 8 }));
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
          { role: "user", content: `Retrieved TTFS guidance and examples:\n\n${knowledgeContext}` },
          { role: "user", content: `Dumped officer notes:\n${notes}` }
        ],
        temperature: 0.1
      })
    });

    const { data } = await readJsonResponse(response);

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error?.message || "OpenAI auto-fill request failed." },
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
      return NextResponse.json(normalizeResult(JSON.parse(outputText)));
    } catch {
      return NextResponse.json(
        { error: "OpenAI returned auto-fill data that was not valid JSON.", raw: outputText },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error("AI auto-fill failed:", error);
    return NextResponse.json({ error: "The AI auto-fill route failed. Please try again." }, { status: 500 });
  }
}
