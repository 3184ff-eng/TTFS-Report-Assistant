# TTFS Report Assistant

Mobile-first web app for Trinidad and Tobago Fire Service officers to generate, vet, improve, score, and export fire reports using the official TTFS Fire Report Form.

## Run Locally

```bash
npm install
cp .env.example .env.local
npm run dev -- -H 127.0.0.1 -p 3001
```

Set `OPENAI_API_KEY` in `.env.local` to enable the server-side AI Writing Assistant. The key must never be placed in frontend code.

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
