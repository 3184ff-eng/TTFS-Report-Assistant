# TTFS Report Assistant

Mobile-first web app for Trinidad and Tobago Fire Service officers to generate, vet, improve, score, and export fire reports using the official TTFS Fire Report Form.

## Run Locally

```bash
npm install
cp .env.example .env.local
npm run dev -- -H 127.0.0.1 -p 3001
```

Set `OPENAI_API_KEY` in `.env.local` to enable the server-side AI Writing Assistant. The key must never be placed in frontend code.

The customer photo log is available at:

```text
http://localhost:3000/photo-log
```

## Quality Gates

```bash
npm test
npm run build
npm run check
```

`npm run check` runs the regression tests and then the production build.

## Core Behavior

- Uses only official cause classifications: Natural, Accidental, Incendiary, Undetermined.
- Keeps Officer's Observations limited to what was observed from arrival to departure.
- Places witness statements, received information, investigation findings, and pre-arrival actions in Additional Information.
- Flags missing information instead of inventing facts.
- Scores reports by category: Administrative Data, Property Description, Extinguishment, Damage Description, Cause Analysis, Officer Observations.

## Customer Photo Log

`/photo-log` is a mobile-friendly customer/property memory tool for door-to-door sales teams.

What it does:

- Captures or uploads photos from the device camera or photo library.
- Stores photo entries temporarily in the browser on the same device using `localStorage`.
- Extracts image dimensions, file metadata, and a dominant color palette locally in the browser.
- Captures current latitude, longitude, accuracy, timestamp, and a best-effort place name through browser geolocation plus reverse geocoding.
- Creates a searchable customer entry with name, address hint, visit outcome, follow-up date, consent checkbox, and free-form notes.
- Exports the local log as JSON for backup or later migration.
- Calls `/api/analyze-photo` for richer server-side vision notes when `OPENAI_API_KEY` is configured.

The server-side photo analysis route never exposes the OpenAI API key to frontend code. Without `OPENAI_API_KEY`, the app still works with local color extraction and structured manual notes.

Privacy expectations:

- Confirm permission before storing photos of customer property.
- Avoid storing faces, children, interiors, license plates, or sensitive private details unless business policy clearly allows it.
- Treat `localStorage` as temporary device storage, not a secure database. For production subscriptions, replace it with authenticated server storage, encryption-at-rest, retention controls, and delete/export account tools.

Publishing checklist:

- Deploy as a standard Next.js app.
- Set `OPENAI_API_KEY` and, optionally, `OPENAI_VISION_MODEL` in the hosting provider environment.
- Serve over HTTPS so camera and geolocation permissions work reliably on mobile devices.
- Add business terms, privacy policy, retention policy, and consent language before charging customers.
- Replace local-only storage with a user account/database layer when sales teams need cross-device access or durable records.

## Thunkable Android App

This project includes a Thunkable-compatible backend API for launching the customer photo log as an Android app:

- Health check: `/api/thunkable/health`
- Photo analysis: `/api/thunkable/analyze-photo`
- Location name lookup: `/api/thunkable/location-name`

Build the Android shell in Thunkable using native Camera, Location Sensor, local/cloud storage, and Web API blocks. See [Docs/THUNKABLE_ANDROID.md](Docs/THUNKABLE_ANDROID.md) for the screen layout, request bodies, and publishing checklist.

## Knowledge Retrieval

The AI routes retrieve local guidance before calling OpenAI. The retrieval system searches Markdown/text content in:

- `knowledge/`
- `examples/`

It retrieves relevant excerpts from the Northern Division guide summary, vetting checklist, TTFS rules, good-report examples, and weak-pattern examples. Retrieved examples are used only as writing guidance, never as facts about the current incident.

## AI Auto-Fill

`AI Auto-fill Form` sends dumped officer notes to a server-side route that retrieves local TTFS guidance, sorts facts into the official form fields, and returns concerns for missing or uncertain information. It must not duplicate personnel details into the Officers Attending field; `Number of men attending / personnel details` is kept separate from `Officers attending`.

## Official PDF Export

The export fills `/public/templates/ttfs-fire-report-form.pdf`, copied from the official fillable TTFS Fire Report PDF supplied for this project. The app uses the PDF's embedded form fields wherever possible. Text is fitted to official field areas and long sections continue into automatically appended appendix pages.

Personnel handling:

- `Number of men attending / personnel details` stores service numbers, ranks, and names.
- `Professionals attending count` and `Auxiliary attending count` store the count values for the official form boxes.
- Personnel details are written into the Officers Attending rows on the official PDF.

Values, damage, insurance, and casualties:

- `Value of Building`, `Value of Stock`, `Damage to Building`, and `Damage to Stock` are separate figure fields.
- `Building and Stock Insured as follows` is a separate insurance information field.
- Casualties are entered in rows matching the official table: Name, Brief description of injuries, and Treated by.
