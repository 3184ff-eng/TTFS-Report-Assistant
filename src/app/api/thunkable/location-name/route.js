import { buildManualLocation } from "../../../../lib/photo-log.js";
import { corsJson, optionsResponse, thunkableError } from "../../../../lib/thunkable-api.js";

export function OPTIONS() {
  return optionsResponse();
}

export async function POST(request) {
  let payload;

  try {
    payload = await request.json();
  } catch {
    return thunkableError("Send latitude and longitude in a JSON body.", 400);
  }

  let location;
  try {
    location = buildManualLocation(payload);
  } catch (error) {
    return thunkableError(error.message, 400);
  }

  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", location.latitude);
  url.searchParams.set("lon", location.longitude);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "CustomerPhotoLogThunkable/1.0"
      }
    });

    if (!response.ok) {
      throw new Error("Reverse geocoding failed.");
    }

    const data = await response.json();
    location.placeName = data.display_name || location.placeName || "Location name unavailable";
  } catch {
    location.placeName = location.placeName || "Location name unavailable";
  }

  return corsJson({
    ok: true,
    location
  });
}
