"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildLocalAnalysis,
  buildManualLocation,
  canUseBrowserGeolocation,
  createPhotoEntryId,
  filterPhotoEntries,
  geolocationErrorMessage,
  geolocationMessage,
  reduceColors
} from "../../lib/photo-log.js";

const storageKey = "doorPhotoLog.entries.v1";
const locationStorageKey = "doorPhotoLog.lastLocation.v1";

const blankLocation = {
  latitude: "",
  longitude: "",
  accuracy: "",
  placeName: "",
  capturedAt: ""
};

function formatDateTime(value) {
  if (!value) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatVisionStatus(status) {
  if (!status) {
    return "Vision service status unavailable.";
  }

  if (status.ok) {
    return "OpenAI vision analysis completed.";
  }

  const messages = {
    missing_openai_api_key: "OpenAI vision is not configured on the server.",
    openai_network_error: "The server could not reach OpenAI.",
    openai_rejected_request: "OpenAI rejected the vision request.",
    openai_response_parse_error: "OpenAI replied, but the response could not be parsed."
  };

  const base = messages[status.reason] || "OpenAI vision analysis did not complete.";
  const detail = status.message || status.code || (status.status ? `Status ${status.status}` : "");
  return detail ? `${base} ${detail}` : base;
}

function getImageInfo(file, dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const paletteCanvas = document.createElement("canvas");
      const maxPaletteSize = 220;
      const paletteRatio = Math.min(maxPaletteSize / image.width, maxPaletteSize / image.height, 1);
      paletteCanvas.width = Math.max(1, Math.round(image.width * paletteRatio));
      paletteCanvas.height = Math.max(1, Math.round(image.height * paletteRatio));

      const context = paletteCanvas.getContext("2d", { willReadFrequently: true });
      context.drawImage(image, 0, 0, paletteCanvas.width, paletteCanvas.height);
      const { data } = context.getImageData(0, 0, paletteCanvas.width, paletteCanvas.height);
      const samples = [];

      for (let index = 0; index < data.length; index += 16) {
        const alpha = data[index + 3];
        if (alpha > 180) {
          samples.push({ r: data[index], g: data[index + 1], b: data[index + 2] });
        }
      }

      const analysisCanvas = document.createElement("canvas");
      const maxAnalysisSize = 1400;
      const analysisRatio = Math.min(maxAnalysisSize / image.width, maxAnalysisSize / image.height, 1);
      analysisCanvas.width = Math.max(1, Math.round(image.width * analysisRatio));
      analysisCanvas.height = Math.max(1, Math.round(image.height * analysisRatio));
      analysisCanvas.getContext("2d").drawImage(image, 0, 0, analysisCanvas.width, analysisCanvas.height);

      resolve({
        fileName: file.name || "Device photo",
        fileType: file.type || "image/*",
        fileSize: file.size,
        width: image.width,
        height: image.height,
        analysisImage: analysisCanvas.toDataURL("image/jpeg", 0.86),
        analysisImageType: "image/jpeg",
        analysisWidth: analysisCanvas.width,
        analysisHeight: analysisCanvas.height,
        colors: reduceColors(samples)
      });
    };
    image.onerror = reject;
    image.src = dataUrl;
  });
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function reverseGeocode(latitude, longitude) {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", latitude);
  url.searchParams.set("lon", longitude);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Unable to find location name.");
  }

  const data = await response.json();
  return data.display_name || "Location name unavailable";
}

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported on this device."));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    });
  });
}

export default function PhotoLogPage() {
  const fileInputRef = useRef(null);
  const [entries, setEntries] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [currentLocation, setCurrentLocation] = useState(blankLocation);
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [deviceLocationReady, setDeviceLocationReady] = useState(true);
  const [locationNote, setLocationNote] = useState("Checking device GPS availability...");
  const [manualLocation, setManualLocation] = useState({ latitude: "", longitude: "", placeName: "" });

  useEffect(() => {
    try {
      const savedEntries = JSON.parse(localStorage.getItem(storageKey) || "[]");
      const savedLocation = JSON.parse(localStorage.getItem(locationStorageKey) || "null");
      setEntries(savedEntries);
      setSelectedId(savedEntries[0]?.id || "");
      if (savedLocation) {
        setCurrentLocation(savedLocation);
      }
    } catch {
      setStatus("Saved photo data could not be loaded.");
    }
  }, []);

  useEffect(() => {
    const canUseDeviceLocation = canUseBrowserGeolocation({
      protocol: window.location.protocol,
      hostname: window.location.hostname,
      isSecureContext: window.isSecureContext
    });
    const hasNavigatorGeolocation = Boolean(navigator.geolocation);

    setDeviceLocationReady(canUseDeviceLocation && hasNavigatorGeolocation);
    setLocationNote(geolocationMessage({ hasNavigatorGeolocation, canUseDeviceLocation }));
  }, []);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    localStorage.setItem(locationStorageKey, JSON.stringify(currentLocation));
  }, [currentLocation]);

  const selectedEntry = useMemo(
    () => entries.find((entry) => entry.id === selectedId) || entries[0] || null,
    [entries, selectedId]
  );

  const filteredEntries = useMemo(() => filterPhotoEntries(entries, query), [entries, query]);

  async function captureLocation() {
    setIsLocating(true);
    setStatus("Getting current location...");

    try {
      if (!deviceLocationReady) {
        throw new Error(locationNote);
      }

      const position = await getCurrentPosition();
      const latitude = Number(position.coords.latitude.toFixed(6));
      const longitude = Number(position.coords.longitude.toFixed(6));
      let placeName = "Location name unavailable";

      try {
        placeName = await reverseGeocode(latitude, longitude);
      } catch {
        placeName = "Location name unavailable";
      }

      const nextLocation = {
        latitude,
        longitude,
        accuracy: Math.round(position.coords.accuracy),
        placeName,
        capturedAt: new Date().toISOString(),
        source: "device"
      };

      setCurrentLocation(nextLocation);
      setStatus("Location captured.");
      return nextLocation;
    } catch (error) {
      setStatus(geolocationErrorMessage(error));
      throw error;
    } finally {
      setIsLocating(false);
    }
  }

  async function useManualLocation() {
    setIsLocating(true);
    setStatus("Saving manual location...");

    try {
      const nextLocation = buildManualLocation(manualLocation);

      if (!manualLocation.placeName.trim()) {
        try {
          nextLocation.placeName = await reverseGeocode(nextLocation.latitude, nextLocation.longitude);
        } catch {
          nextLocation.placeName = "Manual location";
        }
      }

      setCurrentLocation(nextLocation);
      setStatus("Manual location saved.");
      return nextLocation;
    } catch (error) {
      setStatus(error.message || "Manual location could not be saved.");
      throw error;
    } finally {
      setIsLocating(false);
    }
  }

  async function analyzeWithServer(dataUrl, info, location) {
    const response = await fetch("/api/analyze-photo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: dataUrl, imageInfo: info, location })
    });

    if (!response.ok) {
      throw new Error("Server vision analysis unavailable.");
    }

    return response.json();
  }

  async function handlePhotoChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setStatus("Reading photo and extracting colors...");

    try {
      const dataUrl = await readAsDataUrl(file);
      const info = await getImageInfo(file, dataUrl);
      let photoLocation = currentLocation;

      try {
        photoLocation = await captureLocation();
      } catch (error) {
        setStatus(`Photo will use the last saved/manual location. ${geolocationErrorMessage(error)}`);
        photoLocation = currentLocation;
      }

      let analysis = buildLocalAnalysis(info);
      try {
        setStatus("Requesting detailed photo analysis...");
        analysis = await analyzeWithServer(info.analysisImage || dataUrl, info, photoLocation);
      } catch {
        setStatus("Photo saved with local color analysis. The server analysis route could not be reached.");
      }

      const entry = {
        id: createPhotoEntryId(),
        image: dataUrl,
        createdAt: new Date().toISOString(),
        customerName: "",
        addressHint: "",
        visitOutcome: "",
        followUp: "",
        notes: "",
        consentConfirmed: false,
        imageInfo: {
          fileName: info.fileName,
          fileType: info.fileType,
          fileSize: info.fileSize,
          width: info.width,
          height: info.height,
          analysisImageType: info.analysisImageType,
          analysisWidth: info.analysisWidth,
          analysisHeight: info.analysisHeight,
          colors: info.colors
        },
        location: photoLocation,
        analysis
      };

      setEntries((current) => [entry, ...current]);
      setSelectedId(entry.id);
      setStatus(
        analysis.visionStatus?.ok
          ? "Photo logged with OpenAI vision analysis."
          : `Photo logged with local analysis. ${formatVisionStatus(analysis.visionStatus)}`
      );
    } catch (error) {
      setStatus(error.message || "Photo could not be processed.");
    } finally {
      setIsAnalyzing(false);
      event.target.value = "";
    }
  }

  function updateEntry(id, changes) {
    setEntries((current) => current.map((entry) => (entry.id === id ? { ...entry, ...changes } : entry)));
  }

  function removeEntry(id) {
    const nextEntries = entries.filter((entry) => entry.id !== id);
    setEntries(nextEntries);
    setSelectedId(nextEntries[0]?.id || "");
    setStatus("Photo entry removed from this device.");
  }

  function exportJson() {
    const payload = JSON.stringify(entries, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `photo-customer-log-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="photo-app-shell">
      <header className="photo-header">
        <div>
          <p className="eyebrow">Door-to-door customer photo log</p>
          <h1>Photo notes, color details, and location memory</h1>
          <p>
            Capture a property photo with permission, save it temporarily on this device, record coordinates, and keep
            searchable sales notes for follow-up.
          </p>
        </div>
        <div className="photo-header-actions">
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isAnalyzing}>
            {isAnalyzing ? "Processing..." : "Take photo"}
          </button>
          <button type="button" className="secondary-action" onClick={captureLocation} disabled={isLocating || !deviceLocationReady}>
            {isLocating ? "Locating..." : "Use GPS"}
          </button>
          <input
            ref={fileInputRef}
            className="visually-hidden"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoChange}
          />
        </div>
      </header>

      {status ? <p className="photo-status">{status}</p> : null}

      <section className="privacy-strip">
        <strong>Consent first.</strong>
        <span>
          Store customer/property photos only with permission and avoid capturing faces, children, interiors, or license
          plates unless your business has a clear policy for it.
        </span>
      </section>

      <section className="photo-location-panel">
        <div>
          <h2>Current Location</h2>
          <p>{currentLocation.placeName || "No location captured yet."}</p>
          <p className={deviceLocationReady ? "location-note good" : "location-note warning"}>{locationNote}</p>
        </div>
        <dl>
          <div>
            <dt>Latitude</dt>
            <dd>{currentLocation.latitude || "-"}</dd>
          </div>
          <div>
            <dt>Longitude</dt>
            <dd>{currentLocation.longitude || "-"}</dd>
          </div>
          <div>
            <dt>Accuracy</dt>
            <dd>
              {currentLocation.accuracy
                ? currentLocation.accuracy === "Manual"
                  ? "Manual entry"
                  : `${currentLocation.accuracy} m`
                : "-"}
            </dd>
          </div>
          <div>
            <dt>Captured</dt>
            <dd>{formatDateTime(currentLocation.capturedAt)}</dd>
          </div>
        </dl>
        <div className="manual-location-grid">
          <label>
            <span>Latitude</span>
            <input
              inputMode="decimal"
              value={manualLocation.latitude}
              onChange={(event) => setManualLocation((current) => ({ ...current, latitude: event.target.value }))}
              placeholder="10.641500"
            />
          </label>
          <label>
            <span>Longitude</span>
            <input
              inputMode="decimal"
              value={manualLocation.longitude}
              onChange={(event) => setManualLocation((current) => ({ ...current, longitude: event.target.value }))}
              placeholder="-61.501900"
            />
          </label>
          <label className="manual-place-field">
            <span>Location name</span>
            <input
              value={manualLocation.placeName}
              onChange={(event) => setManualLocation((current) => ({ ...current, placeName: event.target.value }))}
              placeholder="Street, landmark, area"
            />
          </label>
          <button type="button" className="secondary-action" onClick={useManualLocation} disabled={isLocating}>
            Save manual location
          </button>
        </div>
      </section>

      <section className="photo-workspace">
        <aside className="photo-list-panel">
          <div className="list-tools">
            <label>
              <span>Search saved photos</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, place, color, note..." />
            </label>
            <button type="button" className="secondary-action" onClick={exportJson} disabled={!entries.length}>
              Export log
            </button>
          </div>

          <div className="photo-entry-list">
            {filteredEntries.length ? (
              filteredEntries.map((entry) => (
                <button
                  type="button"
                  key={entry.id}
                  className={entry.id === selectedEntry?.id ? "photo-entry active" : "photo-entry"}
                  onClick={() => setSelectedId(entry.id)}
                >
                  <img src={entry.image} alt="" />
                  <span>
                    <strong>{entry.customerName || entry.addressHint || "Unnamed customer"}</strong>
                    <small>{entry.location?.placeName || formatDateTime(entry.createdAt)}</small>
                  </span>
                </button>
              ))
            ) : (
              <p className="empty-state">No saved photos match this search.</p>
            )}
          </div>
        </aside>

        <section className="photo-detail-panel">
          {selectedEntry ? (
            <>
              <div className="photo-detail-grid">
                <img className="selected-photo" src={selectedEntry.image} alt="Selected customer property" />
                <div className="detail-summary">
                  <p className="eyebrow">Logged {formatDateTime(selectedEntry.createdAt)}</p>
                  <h2>{selectedEntry.customerName || "Customer / Property Details"}</h2>
                  <p>{selectedEntry.analysis?.summary}</p>
                  <div className="palette">
                    {selectedEntry.imageInfo.colors.map((color) => (
                      <span key={color.hex} title={`${color.name} ${color.hex}`}>
                        <i style={{ background: color.hex }} />
                        {color.name} {color.percentage}%
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="photo-fields-grid">
                <label>
                  <span>Customer name</span>
                  <input
                    value={selectedEntry.customerName}
                    onChange={(event) => updateEntry(selectedEntry.id, { customerName: event.target.value })}
                    placeholder="Name or business"
                  />
                </label>
                <label>
                  <span>Address hint</span>
                  <input
                    value={selectedEntry.addressHint}
                    onChange={(event) => updateEntry(selectedEntry.id, { addressHint: event.target.value })}
                    placeholder="House number, street, landmark"
                  />
                </label>
                <label>
                  <span>Visit outcome</span>
                  <select
                    value={selectedEntry.visitOutcome}
                    onChange={(event) => updateEntry(selectedEntry.id, { visitOutcome: event.target.value })}
                  >
                    <option value="">Select outcome</option>
                    <option>Interested</option>
                    <option>Not interested</option>
                    <option>Follow up needed</option>
                    <option>No answer</option>
                    <option>Existing customer</option>
                  </select>
                </label>
                <label>
                  <span>Follow-up date</span>
                  <input
                    type="date"
                    value={selectedEntry.followUp}
                    onChange={(event) => updateEntry(selectedEntry.id, { followUp: event.target.value })}
                  />
                </label>
                <label className="wide-field">
                  <span>Sales notes</span>
                  <textarea
                    value={selectedEntry.notes}
                    onChange={(event) => updateEntry(selectedEntry.id, { notes: event.target.value })}
                    placeholder="Product interest, preferred contact time, landmarks, objections, next step..."
                  />
                </label>
                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={selectedEntry.consentConfirmed}
                    onChange={(event) => updateEntry(selectedEntry.id, { consentConfirmed: event.target.checked })}
                  />
                  <span>Customer/property photo storage permission confirmed</span>
                </label>
              </div>

              <div className="insight-grid">
                <article>
                  <h3>Photo Details</h3>
                  <ul>
                    <li>{selectedEntry.imageInfo.fileName}</li>
                    <li>
                      {selectedEntry.imageInfo.width} x {selectedEntry.imageInfo.height}px
                    </li>
                    <li>{Math.round(selectedEntry.imageInfo.fileSize / 1024)} KB</li>
                    <li>{selectedEntry.imageInfo.fileType}</li>
                  </ul>
                </article>
                <article>
                  <h3>Photo Location</h3>
                  <ul>
                    <li>{selectedEntry.location?.placeName || "Location name unavailable"}</li>
                    <li>Lat: {selectedEntry.location?.latitude || "-"}</li>
                    <li>Long: {selectedEntry.location?.longitude || "-"}</li>
                    <li>Accuracy: {selectedEntry.location?.accuracy ? `${selectedEntry.location.accuracy} m` : "-"}</li>
                  </ul>
                </article>
                <article>
                  <h3>Visible Features</h3>
                  <ul>
                    {(selectedEntry.analysis?.visibleFeatures || []).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>
                <article>
                  <h3>Color Notes</h3>
                  <ul>
                    {(selectedEntry.analysis?.colorNotes || []).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>
                <article>
                  <h3>Customer Clues</h3>
                  <ul>
                    {(selectedEntry.analysis?.customerClues || []).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>
                <article>
                  <h3>Review Concerns</h3>
                  <ul>
                    {(selectedEntry.analysis?.concerns || []).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>
                <article>
                  <h3>Vision Service</h3>
                  <p>{formatVisionStatus(selectedEntry.analysis?.visionStatus)}</p>
                </article>
              </div>

              <div className="danger-row">
                <button type="button" className="secondary-action" onClick={() => removeEntry(selectedEntry.id)}>
                  Delete this photo
                </button>
              </div>
            </>
          ) : (
            <div className="photo-empty-detail">
              <h2>No photo logged yet</h2>
              <p>Tap Take photo to capture or upload the first customer/property image.</p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
