import { buildManualLocation, createPhotoEntryId } from "./photo-log.js";

export const thunkableCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400"
};

export function corsJson(body, init = {}) {
  return Response.json(body, {
    ...init,
    headers: {
      ...thunkableCorsHeaders,
      ...(init.headers || {})
    }
  });
}

export function optionsResponse() {
  return new Response(null, {
    status: 204,
    headers: thunkableCorsHeaders
  });
}

export function normalizeThunkableImage(image, mimeType = "image/jpeg") {
  if (typeof image !== "string") {
    return null;
  }

  const trimmed = image.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("data:image/")) {
    return trimmed;
  }

  const cleanMimeType = String(mimeType || "image/jpeg").startsWith("image/")
    ? String(mimeType || "image/jpeg")
    : "image/jpeg";
  return `data:${cleanMimeType};base64,${trimmed}`;
}

export function buildThunkableLocation(payload = {}) {
  if (payload.location && typeof payload.location === "object") {
    return {
      latitude: payload.location.latitude ?? "",
      longitude: payload.location.longitude ?? "",
      accuracy: payload.location.accuracy ?? "",
      placeName: payload.location.placeName || "Location supplied by app",
      capturedAt: payload.location.capturedAt || new Date().toISOString(),
      source: payload.location.source || "thunkable"
    };
  }

  if (payload.latitude !== undefined && payload.longitude !== undefined) {
    return buildManualLocation(
      {
        latitude: payload.latitude,
        longitude: payload.longitude,
        placeName: payload.placeName || payload.locationName || ""
      },
      payload.capturedAt || new Date().toISOString()
    );
  }

  return {
    latitude: "",
    longitude: "",
    accuracy: "",
    placeName: payload.placeName || payload.locationName || "Location not supplied",
    capturedAt: payload.capturedAt || new Date().toISOString(),
    source: "missing"
  };
}

export function buildThunkableEntry({ payload = {}, imageInfo = {}, analysis = {} }) {
  return {
    id: payload.id || createPhotoEntryId(),
    createdAt: payload.createdAt || new Date().toISOString(),
    customerName: payload.customerName || "",
    addressHint: payload.addressHint || payload.address || "",
    visitOutcome: payload.visitOutcome || "",
    followUp: payload.followUp || "",
    notes: payload.notes || "",
    consentConfirmed: Boolean(payload.consentConfirmed),
    imageInfo,
    location: buildThunkableLocation(payload),
    analysis
  };
}

export function thunkableError(message, status = 400, details = {}) {
  return corsJson(
    {
      ok: false,
      error: message,
      ...details
    },
    { status }
  );
}
