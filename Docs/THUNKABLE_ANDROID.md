# Thunkable Android App Guide

This project now exposes a Thunkable-ready backend API so the customer photo log can become a native Android app.

## Recommended Architecture

Use Thunkable for the Android shell and native phone features:

- Camera / Image Picker: capture the customer or property photo.
- Location Sensor: capture latitude and longitude.
- Text Inputs: customer name, address hint, visit notes, follow-up date.
- Local DB, Stored Variables, Airtable, Google Sheets, or Firebase: save returned customer photo records.
- Web API component: call this Next.js backend for photo analysis and optional location-name lookup.

Use this Next.js project as the backend:

- Keep `OPENAI_API_KEY` server-side.
- Analyze photos at `/api/thunkable/analyze-photo`.
- Reverse-geocode coordinates at `/api/thunkable/location-name`.
- Check backend readiness at `/api/thunkable/health`.

## Local Testing URL

While your phone and Mac are on the same Wi-Fi:

```text
http://192.168.100.192:3002
```

For a published Android app, deploy this project to a public HTTPS host and use that HTTPS domain in Thunkable.

## API Endpoints

### Health Check

```text
GET /api/thunkable/health
```

Response:

```json
{
  "ok": true,
  "service": "Customer Photo Log Thunkable API",
  "version": "1.0",
  "endpoints": {
    "analyzePhoto": "/api/thunkable/analyze-photo",
    "locationName": "/api/thunkable/location-name"
  },
  "openAiVisionConfigured": true
}
```

### Analyze Photo

```text
POST /api/thunkable/analyze-photo
Content-Type: application/json
```

Request body:

```json
{
  "image": "BASE64_IMAGE_OR_DATA_URL",
  "mimeType": "image/jpeg",
  "customerName": "Customer name",
  "addressHint": "House number, street, landmark",
  "visitOutcome": "Interested",
  "followUp": "2026-06-20",
  "notes": "Customer asked about product pricing.",
  "consentConfirmed": true,
  "latitude": 10.6415,
  "longitude": -61.5019,
  "placeName": "Port of Spain, Trinidad and Tobago"
}
```

Response:

```json
{
  "ok": true,
  "entry": {
    "id": "generated-entry-id",
    "createdAt": "2026-06-16T14:30:00.000Z",
    "customerName": "Customer name",
    "addressHint": "House number, street, landmark",
    "visitOutcome": "Interested",
    "followUp": "2026-06-20",
    "notes": "Customer asked about product pricing.",
    "consentConfirmed": true,
    "imageInfo": {
      "fileName": "Thunkable camera photo",
      "fileType": "image/jpeg",
      "fileSize": "",
      "width": "",
      "height": "",
      "colors": []
    },
    "location": {
      "latitude": 10.6415,
      "longitude": -61.5019,
      "accuracy": "Manual",
      "placeName": "Port of Spain, Trinidad and Tobago",
      "capturedAt": "2026-06-16T14:30:00.000Z",
      "source": "manual"
    },
    "analysis": {
      "summary": "Photo summary",
      "visibleFeatures": [],
      "colorNotes": [],
      "customerClues": [],
      "concerns": []
    }
  },
  "analysis": {
    "summary": "Photo summary",
    "visibleFeatures": [],
    "colorNotes": [],
    "customerClues": [],
    "concerns": []
  },
  "storageAdvice": {
    "thunkable": "Save the returned entry object in a Local DB, Stored Variable, or Airtable/Google Sheets data source.",
    "privacy": "Confirm customer/property photo permission before storing or syncing."
  }
}
```

### Location Name

```text
POST /api/thunkable/location-name
Content-Type: application/json
```

Request body:

```json
{
  "latitude": 10.6415,
  "longitude": -61.5019,
  "placeName": ""
}
```

Response:

```json
{
  "ok": true,
  "location": {
    "latitude": 10.6415,
    "longitude": -61.5019,
    "accuracy": "Manual",
    "placeName": "Resolved location name",
    "capturedAt": "2026-06-16T14:30:00.000Z",
    "source": "manual"
  }
}
```

## Thunkable Screen Layout

Create one main screen:

- Image component: preview selected or captured photo.
- Button: `Take Photo`.
- Button: `Get Location`.
- Text Input: `Customer Name`.
- Text Input: `Address Hint`.
- Dropdown: `Visit Outcome`.
- Date Input or Text Input: `Follow Up`.
- Text Area: `Notes`.
- Switch: `Permission Confirmed`.
- Button: `Analyze and Save`.
- Data Viewer List: saved customer entries.
- Label group: analysis summary, visible features, color notes, concerns.

## Thunkable Block Flow

1. When `Take Photo` button is clicked:
   - Open Camera or Image Picker.
   - Store the image/file result in an app variable named `photoBase64` or `photo`.
   - Show it in the Image preview.

2. When `Get Location` button is clicked:
   - Use Location Sensor to set app variables:
     - `latitude`
     - `longitude`
   - Optional: call `/api/thunkable/location-name` to set `placeName`.

3. When `Analyze and Save` button is clicked:
   - Check that permission is confirmed.
   - Build the JSON body shown above.
   - Web API method: `POST`.
   - Web API URL:

```text
https://YOUR-DEPLOYED-DOMAIN.com/api/thunkable/analyze-photo
```

   - Header: `Content-Type` = `application/json`.
   - Body: JSON object with photo, customer fields, and coordinates.
   - On success, save `response.entry` in local/device storage or a cloud data source.
   - Show `response.analysis.summary`, `visibleFeatures`, `colorNotes`, and `concerns` on screen.

## Android Publishing Notes

Before publishing to Android:

- Deploy the backend over HTTPS.
- Set `OPENAI_API_KEY` in the deployment environment.
- Confirm your Thunkable plan supports Android download/publishing.
- Add Android permissions for camera and location in the Thunkable project.
- Add Terms, Privacy Policy, photo-consent language, and data retention rules.
- For paid use, replace device-only storage with authenticated cloud storage and account-based delete/export tools.
