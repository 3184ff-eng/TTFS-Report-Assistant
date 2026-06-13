# Quality Notes

## Required Checks Before Shipping

Run:

```bash
npm run check
```

This executes:

- `npm test`
- `npm run build`

## Current Regression Coverage

The test suite covers:

- Required TTFS cause classifications.
- Full category scoring for a complete report.
- Bulk note extraction for station, date, address, appliances, and personnel details.
- AI writing separation between Officer's Observations and Additional Information.
- Appendix creation when official form sections overflow.
- Local field cleanup preserving service numbers and names.

## Server-Side AI Routes

- `/api/improve-writing` improves rough narrative notes and returns structured writing sections.
- `/api/improve-fields` improves official form field wording and returns corrected field values.

Both routes use `OPENAI_API_KEY` server-side only.

Both routes also retrieve local knowledge excerpts before calling OpenAI. Retrieval searches Markdown/text files in `knowledge/` and `examples/`, then includes the most relevant guide, checklist, and example excerpts in the AI context. Retrieved examples are writing guidance only and must not be treated as incident facts.

## Official Form Rule

The TTFS Fire Report Form layout is immutable. The app must fill the official fillable PDF fields in `/public/templates/ttfs-fire-report-form.pdf` and append continuation pages instead of redesigning the government document.

Value, damage, insurance, and casualty entries must stay field-specific:

- Building value, stock value, building damage, and stock damage are separate figure fields.
- Insurance details are separate from value/damage figures.
- Casualty name, injury description, and treated-by values map to their respective official PDF table cells.
