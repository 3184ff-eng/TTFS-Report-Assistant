export const fallbackVisionAnalysis = {
  summary: "Detailed vision analysis is not configured. The app saved the photo and local color details.",
  visibleFeatures: [
    "Review the image for buildings, fences, vehicles, plants, signage, animals, and access points.",
    "Add any customer-specific context in the notes area."
  ],
  colorNotes: ["Local color palette is shown with the photo."],
  customerClues: ["Use notes for customer name, product interest, visit result, and follow-up date."],
  concerns: ["Confirm permission before storing customer or property photos."]
};

export function toHex(value) {
  return Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0");
}

export function createPhotoEntryId(globalCrypto = globalThis.crypto, now = Date.now()) {
  if (typeof globalCrypto?.randomUUID === "function") {
    return globalCrypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  if (typeof globalCrypto?.getRandomValues === "function") {
    globalCrypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = [...bytes].map(toHex);
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex
    .slice(8, 10)
    .join("")}-${hex.slice(10).join("")}-${now.toString(36)}`;
}

export function canUseBrowserGeolocation({ protocol = "", hostname = "", isSecureContext = false } = {}) {
  const normalizedHost = String(hostname).toLowerCase();
  return Boolean(
    isSecureContext ||
      protocol === "https:" ||
      normalizedHost === "localhost" ||
      normalizedHost === "127.0.0.1" ||
      normalizedHost === "::1"
  );
}

export function geolocationMessage({ hasNavigatorGeolocation = true, canUseDeviceLocation = true } = {}) {
  if (!hasNavigatorGeolocation) {
    return "This browser does not support device GPS location.";
  }

  if (!canUseDeviceLocation) {
    return "Device GPS is blocked because this phone is using a local HTTP address. Enter coordinates manually below, or use HTTPS for automatic GPS.";
  }

  return "Device GPS is available. Your browser may still ask for location permission.";
}

export function geolocationErrorMessage(error) {
  const code = Number(error?.code);
  const rawMessage = typeof error?.message === "string" ? error.message.trim() : "";

  if (code === 1) {
    return "Location permission was denied. Allow location access in the browser settings, then try Use GPS again.";
  }

  if (code === 2) {
    return "Your device could not determine its current location. Turn on Location/GPS, step outside if needed, or enter the coordinates manually.";
  }

  if (code === 3) {
    return "Getting your location timed out. Try again, or enter the coordinates manually.";
  }

  if (rawMessage && rawMessage !== "[object GeolocationPositionError]") {
    return rawMessage;
  }

  return "Location could not be captured. Check browser location permission, turn on GPS, or enter the coordinates manually.";
}

export function normalizeCoordinate(value, min, max) {
  const number = Number(String(value).trim());
  if (!Number.isFinite(number) || number < min || number > max) {
    return null;
  }
  return Number(number.toFixed(6));
}

export function buildManualLocation({ latitude, longitude, placeName = "" }, capturedAt = new Date().toISOString()) {
  const normalizedLatitude = normalizeCoordinate(latitude, -90, 90);
  const normalizedLongitude = normalizeCoordinate(longitude, -180, 180);

  if (normalizedLatitude === null || normalizedLongitude === null) {
    throw new Error("Enter a valid latitude between -90 and 90 and longitude between -180 and 180.");
  }

  return {
    latitude: normalizedLatitude,
    longitude: normalizedLongitude,
    accuracy: "Manual",
    placeName: String(placeName).trim() || "Manual location",
    capturedAt,
    source: "manual"
  };
}

export function colorName({ r, g, b }) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  if (max < 45) return "black";
  if (min > 218 && delta < 24) return "white";
  if (delta < 18) return max > 150 ? "light gray" : "dark gray";
  if (r > 170 && g > 140 && b < 95) return "tan / beige";
  if (r > 150 && g < 95 && b < 95) return "red / brick";
  if (r > 170 && g > 110 && b < 70) return "orange / wood";
  if (g > 120 && r < 125 && b < 125) return "green / vegetation";
  if (b > 125 && r < 130 && g < 170) return "blue";
  if (r > 110 && g > 90 && b > 80) return "brown / earth";
  return "mixed color";
}

export function reduceColors(samples) {
  if (!samples.length) {
    return [];
  }

  const buckets = new Map();

  samples.forEach(({ r, g, b }) => {
    const qr = Math.round(r / 32) * 32;
    const qg = Math.round(g / 32) * 32;
    const qb = Math.round(b / 32) * 32;
    const key = `${qr},${qg},${qb}`;
    const bucket = buckets.get(key) || { r: 0, g: 0, b: 0, count: 0 };
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    bucket.count += 1;
    buckets.set(key, bucket);
  });

  return [...buckets.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map((bucket) => {
      const r = Math.round(bucket.r / bucket.count);
      const g = Math.round(bucket.g / bucket.count);
      const b = Math.round(bucket.b / bucket.count);
      return {
        hex: `#${toHex(r)}${toHex(g)}${toHex(b)}`,
        name: colorName({ r, g, b }),
        percentage: Math.round((bucket.count / samples.length) * 100)
      };
    });
}

export function buildLocalAnalysis(info = {}) {
  const colors = Array.isArray(info.colors) ? info.colors : [];
  const colorSummary = colors.map((color) => `${color.name} (${color.hex}, ${color.percentage}%)`);

  return {
    summary: "Photo saved locally. Detailed object recognition needs the server-side vision service.",
    visibleFeatures: [
      "Review image for house number, gate, roof, driveway, vehicles, landscape, business signs, animals, or access restrictions.",
      "Confirm customer-identifying details only when permission has been given."
    ],
    colorNotes: colorSummary.length ? colorSummary : ["No dominant colors could be extracted."],
    customerClues: [
      "Use manual notes for customer name, product interest, visit outcome, and follow-up date.",
      "Use the location fields to distinguish nearby customers with similar-looking properties."
    ],
    concerns: [
      "Ask for consent before storing photos of private property.",
      "Avoid storing faces, children, license plates, or private interiors unless business policy allows it."
    ]
  };
}

export function normalizeList(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean).slice(0, 12);
}

export function normalizeAnalysis(value) {
  return {
    summary: String(value?.summary || fallbackVisionAnalysis.summary).slice(0, 500),
    visibleFeatures: normalizeList(value?.visibleFeatures),
    colorNotes: normalizeList(value?.colorNotes),
    customerClues: normalizeList(value?.customerClues),
    concerns: normalizeList(value?.concerns)
  };
}

export function searchablePhotoText(entry) {
  return [
    entry.customerName,
    entry.addressHint,
    entry.notes,
    entry.visitOutcome,
    entry.location?.placeName,
    entry.analysis?.summary,
    ...(entry.analysis?.visibleFeatures || []),
    ...(entry.analysis?.colorNotes || []),
    ...(entry.analysis?.customerClues || [])
  ]
    .join(" ")
    .toLowerCase();
}

export function filterPhotoEntries(entries, query) {
  const term = String(query || "")
    .trim()
    .toLowerCase();

  if (!term) {
    return entries;
  }

  return entries.filter((entry) => searchablePhotoText(entry).includes(term));
}
