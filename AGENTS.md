# TTFS Report Assistant

## Project Purpose

Build a mobile-friendly web app for Trinidad and Tobago Fire Service officers to generate, vet, improve, and export fire reports.

The app must help officers produce clear, complete, accurate reports while preserving the distinction between direct observations, received information, witness statements, and events that occurred before Fire Service arrival.

## Required Source Standards

All report generation, review, scoring, and improvement features must follow:

- TTFS Fire Report Form
- Northern Division Guide to Completion of Fire Reports
- Fire Report Vetting Checklist

Place project-specific rules and extracted guidance in `knowledge/`.

## Fire Cause Classifications

Use only these cause classifications:

- Natural
- Accidental
- Incendiary
- Undetermined

Do not add, infer, rename, or expand these classifications.

## Report Content Rules

- Officer's Observations must contain only what the officer observed from arrival to departure.
- Witness statements, information received, and actions before Fire Service arrival must go under Additional Information.
- Do not invent facts.
- If required information is missing, ask for it or flag it.
- Keep uncertain details clearly marked as missing, unknown, unconfirmed, or requiring officer review.
- Do not present assumptions as established facts.

## App Requirements

The app should support officers in these workflows:

- Generate a draft fire report from officer-provided facts.
- Vet an existing report against TTFS rules and checklist requirements.
- Improve wording, structure, completeness, and placement of information without changing facts.
- Export the final completed fire report as a PDF using the official TTFS Fire Report Form layout.
- Generate a quality score.
- Generate a missing-information checklist.

## Official PDF Export Requirements

Use the uploaded blank TTFS Fire Report Form as the PDF template. The export must preserve the original form layout as much as possible and place generated content into the correct form areas and categories.

Preferred PDF export path: fill the official PDF's embedded form fields directly. Do not rely on visual HTML overlay alignment when an AcroForm field exists for a value.

The app must map generated or officer-entered content into these official form areas:

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

If any section is too long to fit in the official form space, place the overflow text on automatically appended continuation pages labelled `APPENDIX 1`, `APPENDIX 2`, etc.

Each appendix page must include:

- Fire Report Number
- Address of Fire
- Date of Fire
- Date of Report
- Section continued, such as `Officer's Observations Continued`
- Officer signature line
- Rank line

Do not shrink, omit, or silently truncate report content to force it into the official form. Overflow must continue on appendix pages.

The official TTFS Fire Report Form must remain unchanged. Treat the uploaded blank form as an immutable template and overlay generated content into the corresponding form areas. Text may shrink to fit where reasonable, but overflow must continue on appendix pages.

Watch must be selected from:

- White Watch
- Black Watch
- Red Watch
- Blue Watch

Station must be selected from a dropdown list of TTFS fire stations, not entered as free text.

Use dropdowns for constrained official-form values where applicable, including How Call Received, Wind, Water Supply Sufficient, Watch, Station, Incident Type, and Cause of Fire.

The official `Number of Men Attending` area is split into `Professionals` and `Auxiliary` boxes. Capture those as separate fields and place their values in the matching boxes on the official form.

Incident-type prompts must be available for:

- House Fire
- Commercial Fire
- Vehicle Fire
- Light Pole Fire
- Bush Fire
- RTA
- MVF

The report score must be category-based and include recommendations, not only a single raw score.

## AI Writing Improvement

The app must include an `Improve Writing` feature for rough report notes, weak sentences, or incomplete wording.

The feature must:

- Correct grammar, spelling, punctuation, and sentence structure.
- Reconstruct weak sentences into clear professional TTFS fire report language.
- Preserve the facts provided by the officer.
- Preserve times, names, addresses, appliance numbers, service numbers, vehicle registrations, values, and cause classifications exactly.
- Avoid inventing information.
- Flag missing or unclear information instead of guessing.
- Separate output into Officer's Observations, Additional Information, Description of Damage, How Fire Was Extinguished, and Cause Determination.
- Keep Officer's Observations limited to what the officer observed from arrival to departure.
- Place witness statements, received information, and actions before Fire Service arrival under Additional Information.
- Output both an improved version and missing-information/concerns list.

The writing engine must support three modes:

- Grammar Correction: fix spelling, grammar, punctuation, and keep sentence structure mostly unchanged.
- Professional Rewrite: rewrite using TTFS professional report language, improve clarity, and preserve all facts.
- Fire Prevention Standard: rewrite to Fire Prevention standard, follow the Northern Division Guide and Vetting Checklist, and flag missing information.

Display Original Text, Improved Text, Missing Information, Quality Score, and Fire Prevention Readiness Score.

Version 1.1 report scoring must use these categories: Administrative Data, Property Description, Extinguishment, Damage Description, Cause Analysis, and Officer Observations.

The official TTFS form must remain unchanged. Writing improvement only improves wording that may later be placed into the form.

## Bulk Data Intake

The app should allow an officer to paste all collected incident data into one intake box and automatically sort identifiable facts into the official form fields. The sorter must be conservative: populate only information it can identify, place uncertain unlabelled text into Additional Information for review, and flag missing fields instead of guessing.

Bulk intake should support paragraph-style fire report narratives, including appliance numbers, firefighter service numbers, station names, addresses, property descriptions, building/stock values, damage estimates, investigation dates/times, and origin/cause narrative. Do not convert probable cause language into an official cause classification unless the classification is explicitly provided or confirmed by the officer.

## Mobile-Friendly Design Expectations

- Prioritize quick data entry on phones and tablets.
- Use clear sections aligned to report workflow.
- Make missing fields and validation issues easy to find.
- Keep review actions visible and understandable.
- Avoid layouts that require wide screens to complete core tasks.

## Repository Structure

- `knowledge/` contains TTFS rules, form guidance, vetting criteria, and report standards.
- `examples/` contains examples of good reports and weak report patterns.
- `src/` contains the web app source code.

## Safety and Accuracy

This app assists report writing; it must not replace officer judgment. Any generated or improved report must remain traceable to officer-provided facts and must surface missing or uncertain information for review.
