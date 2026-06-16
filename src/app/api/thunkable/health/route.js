import { corsJson, optionsResponse } from "../../../../lib/thunkable-api.js";

export function OPTIONS() {
  return optionsResponse();
}

export function GET() {
  return corsJson({
    ok: true,
    service: "Customer Photo Log Thunkable API",
    version: "1.0",
    endpoints: {
      analyzePhoto: "/api/thunkable/analyze-photo",
      locationName: "/api/thunkable/location-name"
    },
    openAiVisionConfigured: Boolean(process.env.OPENAI_API_KEY)
  });
}
