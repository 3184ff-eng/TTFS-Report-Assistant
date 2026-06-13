# TTFS Fire Report Rules

Placeholder for rules extracted from:

- TTFS Fire Report Form
- Northern Division Guide to Completion of Fire Reports

## Notes

- Add field requirements, section definitions, wording rules, and placement rules here.
- Preserve the distinction between observations, witness statements, received information, and pre-arrival actions.

## Official Form PDF Export

The final completed fire report must export as a PDF using the uploaded blank TTFS Fire Report Form as the template. Preserve the original form layout as much as possible.

The official PDF contains embedded form fields. Populate those fields directly for export wherever possible so the document's original placeholders control alignment.

Generated content must be placed into the correct form areas/categories:

- Report Number
- Station
- Watch
- Incident Type
- Date Call Received
- Time Call Received
- How Call Received
- Address Given
- Actual Address
- Owner/Occupier
- Hydrant distance
- Cause of fire
- Water supply
- LPM available/required
- Type of property
- How fire was extinguished
- Description of damage
- Appliances attending
- Officers attending
- FS/SO and FS/O attending
- Number of men attending
- Casualties
- Values/damage/insurance
- Officer's observations

## Appendix Overflow Rules

If text is too long to fit in its official form area, continue it on automatically appended pages labelled `APPENDIX 1`, `APPENDIX 2`, etc.

Each appendix page must include:

- Fire Report Number
- Address of Fire
- Date of Fire
- Date of Report
- Section continued, such as `Officer's Observations Continued`
- Officer signature line
- Rank line

Report content must not be invented, silently omitted, or truncated. Missing required content must be flagged before export.

## Watch Options

- White Watch
- Black Watch
- Red Watch
- Blue Watch

## Station Selection

Station must be selected from a dropdown list of TTFS fire stations, not entered as free text. Keep the station list current as official TTFS station names are confirmed.

## Dropdown Fields

Use dropdowns for constrained values where applicable:

- Station
- Watch
- Incident Type
- How Call Received
- Wind
- Was water supply sufficient?
- Cause of Fire

The official `Number of Men Attending` area is split into `Professionals` and `Auxiliary` count boxes. Capture those as separate count fields and place their values in the matching boxes on the official form. Personnel names, ranks, and service numbers must be captured separately under `Number of men attending / personnel details` and placed into the appropriate Officers Attending rows on the official PDF.

## AI Writing Improvement Rules

The `Improve Writing` feature may improve grammar, spelling, punctuation, sentence structure, and professional TTFS report style, but it must not change facts or invent information.

It must preserve exact times, names, addresses, appliance numbers, service numbers, vehicle registrations, values, and cause classifications.

The improved output must be separated into:

- Officer's Observations
- Additional Information
- Description of Damage
- How Fire Was Extinguished
- Cause Determination

Officer's Observations must contain only what the officer observed from arrival to departure. Witness statements, information received, and actions before Fire Service arrival must be placed under Additional Information. Missing information must be flagged.

Writing modes:

- Grammar Correction
- Professional Rewrite
- Fire Prevention Standard

The writing output must show Original Text, Improved Text, Missing Information, Quality Score, and Fire Prevention Readiness Score.

OpenAI API calls must be made only from server-side application code using `OPENAI_API_KEY`. The API key must not be exposed to browser code.

Version 1.1 scoring categories:

- Administrative Data
- Property Description
- Extinguishment
- Damage Description
- Cause Analysis
- Officer Observations

## Bulk Data Intake

Bulk pasted notes may be used to auto-fill the official form only when facts can be identified from labels, known dropdown values, or clear patterns. Unclear content must be routed to Additional Information for officer review or flagged as missing. The app must not guess missing TTFS form values.

Paragraph-style reports may be parsed for appliances, firefighter service numbers, station names, addresses, property descriptions, values, damage estimates, investigation details, and cause/origin narrative. Probable cause wording must not be silently converted into an official cause classification without officer confirmation.

## Incident Type Prompts

The app must provide intelligent prompts for:

- House Fire
- Commercial Fire
- Vehicle Fire
- Light Pole Fire
- Bush Fire
- RTA
- MVF

## Quality Scoring

Quality scoring must be category-based and include recommendations. Categories should cover official form completion, narrative quality, cause support, operational detail, and vetting compliance.
