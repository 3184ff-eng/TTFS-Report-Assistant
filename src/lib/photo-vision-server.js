import { fallbackVisionAnalysis, normalizeAnalysis } from "./photo-log.js";

function fallbackWithStatus(reason, details = {}) {
  return {
    ...fallbackVisionAnalysis,
    visionStatus: {
      ok: false,
      reason,
      ...details
    }
  };
}

export async function analyzePhotoWithVision({ image, imageInfo = {}, location = {} }) {
  if (!process.env.OPENAI_API_KEY) {
    return fallbackWithStatus("missing_openai_api_key");
  }

  const palette = Array.isArray(imageInfo?.colors)
    ? imageInfo.colors.map((color) => `${color.name} ${color.hex} ${color.percentage}%`).join(", ")
    : "No local palette supplied";

  const prompt = [
    "Analyze this door-to-door sales customer/property photo for a mobile photo log app.",
    "Return only JSON with keys: summary, visibleFeatures, colorNotes, customerClues, concerns.",
    "visibleFeatures should include structures, exterior property details, nature/landscaping, signs, animals, vehicles, access points, and distinctive features that may help identify the customer location.",
    "colorNotes should pair visible items with their colors, such as roof color, wall color, gate color, vehicle color, plants, or other notable objects.",
    "Do not identify faces or infer private sensitive attributes. Do not invent details you cannot see.",
    "Flag any privacy or quality concerns in concerns.",
    `Local color palette: ${palette}.`,
    `Location context: ${location?.placeName || "not supplied"}; latitude ${location?.latitude || "unknown"}; longitude ${location?.longitude || "unknown"}.`
  ].join("\n");

  let response;
  try {
    response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_VISION_MODEL || "gpt-4.1-mini",
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: prompt },
              { type: "input_image", image_url: image }
            ]
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "photo_log_analysis",
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                summary: { type: "string" },
                visibleFeatures: { type: "array", items: { type: "string" } },
                colorNotes: { type: "array", items: { type: "string" } },
                customerClues: { type: "array", items: { type: "string" } },
                concerns: { type: "array", items: { type: "string" } }
              },
              required: ["summary", "visibleFeatures", "colorNotes", "customerClues", "concerns"]
            }
          }
        }
      })
    });
  } catch (error) {
    return fallbackWithStatus("openai_network_error", {
      message: error?.message || "OpenAI request failed before a response was received."
    });
  }

  if (!response.ok) {
    let errorCode = "";
    let errorMessage = "";

    try {
      const errorBody = await response.json();
      errorCode = errorBody?.error?.code || errorBody?.error?.type || "";
      errorMessage = errorBody?.error?.message || "";
    } catch {
      errorMessage = response.statusText || "OpenAI request was rejected.";
    }

    return fallbackWithStatus("openai_rejected_request", {
      status: response.status,
      code: errorCode,
      message: errorMessage.slice(0, 260)
    });
  }

  const data = await response.json();
  const text = data.output_text || data.output?.flatMap((item) => item.content || []).find((item) => item.text)?.text;

  try {
    return {
      ...normalizeAnalysis(JSON.parse(text)),
      visionStatus: {
        ok: true,
        reason: "openai_vision_analysis_complete"
      }
    };
  } catch {
    return {
      ...fallbackVisionAnalysis,
      summary: text ? String(text).slice(0, 500) : fallbackVisionAnalysis.summary,
      visionStatus: {
        ok: false,
        reason: "openai_response_parse_error"
      }
    };
  }
}
