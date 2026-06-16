import { analyzePhotoWithVision } from "../../../../lib/photo-vision-server.js";
import {
  buildThunkableEntry,
  buildThunkableLocation,
  corsJson,
  normalizeThunkableImage,
  optionsResponse,
  thunkableError
} from "../../../../lib/thunkable-api.js";

export function OPTIONS() {
  return optionsResponse();
}

export async function POST(request) {
  let payload;

  try {
    payload = await request.json();
  } catch {
    return thunkableError("Send a JSON body from Thunkable Web API.", 400);
  }

  const image = normalizeThunkableImage(payload.image || payload.photo || payload.base64Image, payload.mimeType);
  if (!image) {
    return thunkableError("Send image as a base64 string or data:image/* data URL.", 400);
  }

  let location;
  try {
    location = buildThunkableLocation(payload);
  } catch (error) {
    return thunkableError(error.message, 400);
  }

  const imageInfo = {
    fileName: payload.fileName || "Thunkable camera photo",
    fileType: payload.mimeType || "image/jpeg",
    fileSize: payload.fileSize || "",
    width: payload.width || "",
    height: payload.height || "",
    colors: Array.isArray(payload.colors) ? payload.colors : []
  };

  const analysis = await analyzePhotoWithVision({ image, imageInfo, location });
  const entry = buildThunkableEntry({ payload: { ...payload, location }, imageInfo, analysis });

  return corsJson({
    ok: true,
    entry,
    analysis,
    storageAdvice: {
      thunkable: "Save the returned entry object in a Local DB, Stored Variable, or Airtable/Google Sheets data source.",
      privacy: "Confirm customer/property photo permission before storing or syncing."
    }
  });
}
