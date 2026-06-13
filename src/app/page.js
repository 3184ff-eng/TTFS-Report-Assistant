"use client";

import { useMemo, useState } from "react";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, StandardFonts } from "pdf-lib";

const tabs = ["Generate Report", "Vet Report", "Improve Report", "Export PDF"];
const causeClassifications = ["Natural", "Accidental", "Incendiary", "Undetermined"];
const watchOptions = ["White Watch", "Black Watch", "Red Watch", "Blue Watch"];
const howCallReceivedOptions = [
  "999/990 Emergency Call",
  "Station Telephone",
  "Walk-in Report",
  "Police",
  "Ambulance",
  "Disaster Management",
  "Other"
];
const windOptions = ["Strong", "Average", "None"];
const waterSupplyOptions = ["Yes", "No"];
const writingModes = ["Grammar Correction", "Professional Rewrite", "Fire Prevention Standard"];
const writingSections = [
  "Officer's Observations",
  "Additional Information",
  "Description of Damage",
  "How Fire Was Extinguished",
  "Cause Determination"
];
const stationOptions = [
  "Arima Fire Station",
  "Arouca Fire Station",
  "Belmont Fire Station",
  "Chaguanas Fire Station",
  "Couva Fire Station",
  "Crown Point Fire Station",
  "Four Roads Fire Station",
  "Freeport Fire Station",
  "Mayaro Fire Station",
  "Mon Repos Fire Station",
  "Morvant Fire Station",
  "Penal Fire Station",
  "Point Fortin Fire Station",
  "Port of Spain Fire Station",
  "Princes Town Fire Station",
  "Rio Claro Fire Station",
  "Roxborough Fire Station",
  "San Fernando Fire Station",
  "San Juan Fire Station",
  "Sangre Grande Fire Station",
  "Scarborough Fire Station",
  "Siparia Fire Station",
  "Toco Fire Station",
  "Tunapuna Fire Station",
  "Woodbrook Fire Station"
];
const incidentTypes = ["House Fire", "Commercial Fire", "Vehicle Fire", "Light Pole Fire", "Bush Fire", "RTA", "MVF"];
const officialTemplatePath = "/templates/ttfs-fire-report-form.pdf";

const incidentPrompts = {
  "House Fire": [
    "Confirm occupancy type, number of floors, construction material, and rooms/contents affected.",
    "Record hydrant distance, water supply used, appliances attending, and how the fire was extinguished.",
    "Keep neighbour or occupier statements in Additional Information, not Officer's observations."
  ],
  "Commercial Fire": [
    "Record business name, occupancy/use, affected stock/equipment, and whether operations were disrupted.",
    "Confirm insurance/value details and any fire protection systems observed.",
    "Separate received information from direct observations."
  ],
  "Vehicle Fire": [
    "Record vehicle registration, make/model if known, owner/driver, location of vehicle, and area of origin if observed.",
    "Describe damage to engine bay, passenger compartment, tray, tyres, or nearby exposures.",
    "Do not infer mechanical or electrical cause unless supported by known facts."
  ],
  "Light Pole Fire": [
    "Record pole number or nearest landmark, utility involvement, visible arcing/smoke/flame, and hazards controlled.",
    "Describe surrounding exposures and whether power authority was requested or on scene.",
    "Place caller or resident information in Additional Information."
  ],
  "Bush Fire": [
    "Record approximate acreage, vegetation type, weather/wind conditions if observed, exposures, and method of extinguishment.",
    "Note appliances, manpower, water source, and whether fire breaks or beaters were used.",
    "Avoid assigning deliberate cause without supporting facts."
  ],
  RTA: [
    "Record vehicle count, road/location, persons trapped or injured, extrication actions, and agencies present.",
    "Document hazards controlled, such as fuel spill, battery isolation, or traffic safety.",
    "Keep bystander statements in Additional Information."
  ],
  MVF: [
    "Record vehicle details, fire location on the vehicle, extinguishing agent used, and damage extent.",
    "Confirm casualties, owner/driver details, and insurance/value information if available.",
    "Use only Natural, Accidental, Incendiary, or Undetermined for cause classification."
  ]
};

const initialForm = {
  reportNumber: "",
  station: "",
  watch: "",
  incidentType: "",
  wind: "",
  dateCallReceived: "",
  timeCallReceived: "",
  howCallReceived: "",
  addressGiven: "",
  actualAddress: "",
  timeApplianceLeftStation: "",
  approxDistanceToFire: "",
  ownerOccupier: "",
  hydrantDistance: "",
  causeOfFire: "",
  waterSupply: "",
  lpmAvailable: "",
  lpmRequired: "",
  typeOfProperty: "",
  howFireExtinguished: "",
  descriptionOfDamage: "",
  appliancesAttending: "",
  officersAttending: "",
  seniorOfficersAttending: "",
  professionalsAttending: "",
  auxiliaryAttending: "",
  casualties: "",
  valuesDamageInsurance: "",
  officersObservations: "",
  additionalInformation: "",
  dateOfFire: "",
  dateOfReport: "",
  reportingOfficer: "",
  rank: ""
};

const formFields = [
  { name: "reportNumber", label: "Report Number", type: "text", mandatory: true },
  { name: "station", label: "Station", type: "select", mandatory: true, options: stationOptions },
  { name: "watch", label: "Watch", type: "select", mandatory: true, options: watchOptions },
  { name: "incidentType", label: "Incident type", type: "select", mandatory: true, options: incidentTypes },
  { name: "dateCallReceived", label: "Date Call Received", type: "date", mandatory: true },
  { name: "timeCallReceived", label: "Time Call Received", type: "time", mandatory: true },
  { name: "howCallReceived", label: "How Call Received", type: "select", mandatory: true, options: howCallReceivedOptions },
  { name: "addressGiven", label: "Address Given", type: "text", mandatory: true, wide: true },
  { name: "actualAddress", label: "Actual Address", type: "text", mandatory: true, wide: true },
  { name: "timeApplianceLeftStation", label: "Time Appliance Left Station", type: "time", mandatory: true },
  { name: "approxDistanceToFire", label: "Approx. Distance to Fire", type: "text", mandatory: true },
  { name: "wind", label: "Wind", type: "select", mandatory: true, options: windOptions },
  { name: "ownerOccupier", label: "Owner/Occupier", type: "text", mandatory: true },
  { name: "hydrantDistance", label: "Hydrant distance", type: "text", mandatory: true },
  {
    name: "causeOfFire",
    label: "Cause of fire",
    type: "select",
    mandatory: true,
    options: causeClassifications
  },
  {
    name: "waterSupply",
    label: "Was water supply sufficient?",
    type: "select",
    mandatory: true,
    options: waterSupplyOptions
  },
  { name: "lpmAvailable", label: "LPM Available", type: "text", mandatory: true },
  { name: "lpmRequired", label: "LPM Required", type: "text", mandatory: true },
  { name: "typeOfProperty", label: "Type of property", type: "textarea", mandatory: true, wide: true },
  {
    name: "howFireExtinguished",
    label: "How fire was extinguished",
    type: "textarea",
    mandatory: true,
    wide: true
  },
  {
    name: "descriptionOfDamage",
    label: "Description of damage",
    type: "textarea",
    mandatory: true,
    wide: true
  },
  { name: "appliancesAttending", label: "Appliances attending", type: "textarea", mandatory: true, wide: true },
  { name: "officersAttending", label: "Officers attending", type: "textarea", mandatory: true, wide: true },
  {
    name: "seniorOfficersAttending",
    label: "FS/SO and FS/O attending",
    type: "textarea",
    mandatory: true,
    wide: true
  },
  { name: "professionalsAttending", label: "Professionals attending", type: "text", mandatory: true },
  { name: "auxiliaryAttending", label: "Auxiliary attending", type: "text", mandatory: true },
  { name: "casualties", label: "Casualties", type: "textarea", mandatory: true, wide: true },
  {
    name: "valuesDamageInsurance",
    label: "Values/damage/insurance",
    type: "textarea",
    mandatory: true,
    wide: true
  },
  {
    name: "officersObservations",
    label: "Officer's observations",
    type: "textarea",
    mandatory: true,
    wide: true,
    help: "Only what the officer observed from arrival to departure."
  },
  {
    name: "additionalInformation",
    label: "Additional Information",
    type: "textarea",
    mandatory: false,
    wide: true,
    help: "Witness statements, information received, and pre-arrival actions go here."
  },
  { name: "dateOfFire", label: "Date of Fire", type: "date", mandatory: true },
  { name: "dateOfReport", label: "Date of Report", type: "date", mandatory: true },
  { name: "reportingOfficer", label: "Reporting Officer", type: "text", mandatory: true },
  { name: "rank", label: "Rank", type: "text", mandatory: true }
];

const mandatoryFields = formFields.filter((field) => field.mandatory);
const quickSelectFields = formFields.filter((field) => ["watch", "incidentType"].includes(field.name));
const reportFormFields = formFields.filter((field) => !["watch", "incidentType"].includes(field.name));
const officialPrintFields = [
  ["Report Number", "reportNumber"],
  ["Station", "station"],
  ["Watch", "watch"],
  ["Incident Type", "incidentType"],
  ["Wind", "wind"],
  ["Date Call Received", "dateCallReceived"],
  ["Time Call Received", "timeCallReceived"],
  ["How Call Received", "howCallReceived"],
  ["Address Given", "addressGiven"],
  ["Actual Address", "actualAddress"],
  ["Time Appliance Left Station", "timeApplianceLeftStation"],
  ["Approx. Distance to Fire", "approxDistanceToFire"],
  ["Owner/Occupier", "ownerOccupier"],
  ["Hydrant distance", "hydrantDistance"],
  ["Cause of fire", "causeOfFire"],
  ["Water supply", "waterSupply"],
  ["LPM Available", "lpmAvailable"],
  ["LPM Required", "lpmRequired"],
  ["Type of property", "typeOfProperty"],
  ["How fire was extinguished", "howFireExtinguished"],
  ["Description of damage", "descriptionOfDamage"],
  ["Appliances attending", "appliancesAttending"],
  ["Officers attending", "officersAttending"],
  ["FS/SO and FS/O attending", "seniorOfficersAttending"],
  ["Professionals attending", "professionalsAttending"],
  ["Auxiliary attending", "auxiliaryAttending"],
  ["Casualties", "casualties"],
  ["Values/damage/insurance", "valuesDamageInsurance"],
  ["Officer's observations", "officersObservations"]
];

const appendixLimits = {
  typeOfProperty: 260,
  howFireExtinguished: 260,
  descriptionOfDamage: 300,
  appliancesAttending: 220,
  officersAttending: 220,
  seniorOfficersAttending: 180,
  casualties: 200,
  valuesDamageInsurance: 240,
  officersObservations: 520
};

function valueOrMissing(value) {
  return value.trim() || "[Missing]";
}

function compactLine(label, value) {
  return `${label}: ${valueOrMissing(value)}`;
}

function missingMandatoryFields(form) {
  return mandatoryFields
    .filter((field) => !String(form[field.name]).trim())
    .map((field) => field.label);
}

function buildValidationWarnings(form) {
  const warnings = missingMandatoryFields(form).map((field) => `Missing mandatory field: ${field}.`);

  if (!form.typeOfProperty.trim()) {
    warnings.push("Missing property description.");
  }

  if (!form.howFireExtinguished.trim()) {
    warnings.push("Missing extinguishment details.");
  }

  if (!form.descriptionOfDamage.trim()) {
    warnings.push("Missing damage description.");
  }

  if (!form.officersObservations.trim()) {
    warnings.push("Missing observations.");
  }

  if (!causeClassifications.includes(form.causeOfFire)) {
    warnings.push("Unsupported cause determination. Use only Natural, Accidental, Incendiary, or Undetermined.");
  }

  const observationText = form.officersObservations.toLowerCase();
  if (observationText.includes("witness stated") || observationText.includes("was told")) {
    warnings.push("Officer's observations appear to include witness or received information.");
  }

  if (observationText.includes("before arrival") || observationText.includes("prior to arrival")) {
    warnings.push("Officer's observations appear to include actions before Fire Service arrival.");
  }

  return [...new Set(warnings)];
}

function calculateCategoryScores(form, warnings) {
  return {
    "Administrative Data": Math.round(
      ([
        "reportNumber",
        "station",
        "watch",
        "dateCallReceived",
        "timeCallReceived",
        "howCallReceived",
        "addressGiven",
        "actualAddress"
      ].filter((field) => String(form[field]).trim()).length /
        8) *
        100
    ),
    "Property Description": form.typeOfProperty.trim() ? 100 : 0,
    Extinguishment: form.howFireExtinguished.trim() ? 100 : 0,
    "Damage Description": form.descriptionOfDamage.trim() ? 100 : 0,
    "Cause Analysis": causeClassifications.includes(form.causeOfFire) ? 100 : 0,
    "Officer Observations": Math.max(
      0,
      form.officersObservations.trim() ? 100 - Math.min(warnings.length * 10, 40) : 0
    )
  };
}

function calculateQualityScore(categoryScores) {
  const scores = Object.values(categoryScores);
  return Math.round(scores.reduce((total, score) => total + score, 0) / scores.length);
}

function buildRecommendations(form, warnings, categoryScores) {
  const recommendations = [];

  if (categoryScores["Administrative Data"] < 100) {
    recommendations.push("Complete all official TTFS form fields before export.");
  }

  if (!form.typeOfProperty.trim()) {
    recommendations.push("Add a clear property description, including use, construction, and affected area where known.");
  }

  if (!form.howFireExtinguished.trim()) {
    recommendations.push("Add extinguishment details, including method, agent, water source, and appliances used.");
  }

  if (!form.descriptionOfDamage.trim()) {
    recommendations.push("Describe fire, smoke, heat, and water damage separately where possible.");
  }

  if (!form.officersObservations.trim()) {
    recommendations.push("Add Officer's observations from arrival to departure only.");
  }

  if (!causeClassifications.includes(form.causeOfFire)) {
    recommendations.push("Select one supported cause classification: Natural, Accidental, Incendiary, or Undetermined.");
  }

  if (!form.additionalInformation.trim()) {
    recommendations.push("Confirm whether there are witness statements, received information, or pre-arrival actions.");
  }

  if (warnings.length === 0 && recommendations.length === 0) {
    recommendations.push("Report is ready for officer review and PDF export.");
  }

  return recommendations;
}

function fieldTextClass(key, value) {
  const length = String(value || "").length;
  const limit = appendixLimits[key] || 120;

  if (length > limit * 0.85) {
    return "field-text shrink-tight";
  }

  if (length > limit * 0.6) {
    return "field-text shrink";
  }

  return "field-text";
}

function buildPromptSummary(form) {
  const prompts = incidentPrompts[form.incidentType] || [];

  if (!prompts.length) {
    return "Select an incident type to show TTFS drafting prompts.";
  }

  return prompts.join(" ");
}

function buildCauseAnalysis(form) {
  if (!causeClassifications.includes(form.causeOfFire)) {
    return "Cause analysis cannot be completed until a supported cause classification is selected.";
  }

  return [
    `Cause classification: ${form.causeOfFire}.`,
    "This classification must be supported only by officer-provided facts and must not add assumptions.",
    form.additionalInformation.trim()
      ? "Additional information is recorded separately from the officer's direct observations."
      : "No additional information has been entered; confirm whether witness statements, received information, or pre-arrival actions exist.",
    form.officersObservations.trim()
      ? "Officer's observations are available for review against the selected cause."
      : "Officer's observations are missing and should be completed before final export."
  ].join(" ");
}

function buildFireReport(form) {
  return [
    "TRINIDAD AND TOBAGO FIRE SERVICE",
    "FIRE REPORT",
    "",
    compactLine("Report Number", form.reportNumber),
    compactLine("Station", form.station),
    compactLine("Watch", form.watch),
    compactLine("Incident Type", form.incidentType),
    compactLine("Wind", form.wind),
    compactLine("Date Call Received", form.dateCallReceived),
    compactLine("Time Call Received", form.timeCallReceived),
    compactLine("How Call Received", form.howCallReceived),
    compactLine("Address Given", form.addressGiven),
    compactLine("Actual Address", form.actualAddress),
    compactLine("Time Appliance Left Station", form.timeApplianceLeftStation),
    compactLine("Approx. Distance to Fire", form.approxDistanceToFire),
    compactLine("Owner/Occupier", form.ownerOccupier),
    compactLine("Hydrant distance", form.hydrantDistance),
    compactLine("Cause of fire", form.causeOfFire),
    compactLine("Water supply sufficient", form.waterSupply),
    compactLine("LPM available", form.lpmAvailable),
    compactLine("LPM required", form.lpmRequired),
    compactLine("Type of property", form.typeOfProperty),
    compactLine("How fire was extinguished", form.howFireExtinguished),
    compactLine("Description of damage", form.descriptionOfDamage),
    compactLine("Appliances attending", form.appliancesAttending),
    compactLine("Officers attending", form.officersAttending),
    compactLine("FS/SO and FS/O attending", form.seniorOfficersAttending),
    compactLine("Professionals attending", form.professionalsAttending),
    compactLine("Auxiliary attending", form.auxiliaryAttending),
    compactLine("Casualties", form.casualties),
    compactLine("Values/damage/insurance", form.valuesDamageInsurance),
    "",
    "OFFICER'S OBSERVATIONS",
    valueOrMissing(form.officersObservations),
    "",
    "ADDITIONAL INFORMATION",
    form.additionalInformation.trim() ||
      "[Not provided. Place witness statements, information received, and pre-arrival actions here.]"
  ].join("\n");
}

function buildImprovedReport(form) {
  return [
    buildFireReport(form),
    "",
    "REVIEW NOTE",
    "This improved draft preserves entered facts only. Missing items remain flagged for officer review before export."
  ].join("\n");
}

function truncateForForm(key, value) {
  const limit = appendixLimits[key];
  if (!limit || value.length <= limit) {
    return value;
  }

  return `${value.slice(0, limit).trim()} [Continued in appendix]`;
}

function splitIntoChunks(text, size) {
  const chunks = [];
  let remaining = text.trim();

  while (remaining.length > size) {
    let splitAt = remaining.lastIndexOf(" ", size);
    if (splitAt < size * 0.5) {
      splitAt = size;
    }
    chunks.push(remaining.slice(0, splitAt).trim());
    remaining = remaining.slice(splitAt).trim();
  }

  if (remaining) {
    chunks.push(remaining);
  }

  return chunks;
}

function buildAppendices(form) {
  const appendices = [];

  officialPrintFields.forEach(([label, key]) => {
    const text = String(form[key] || "").trim();
    const limit = appendixLimits[key];
    if (!limit || text.length <= limit) {
      return;
    }

    const overflow = text.slice(limit).trim();
    splitIntoChunks(overflow, 1250).forEach((chunk) => {
      appendices.push({
        section: `${label} Continued`,
        text: chunk
      });
    });
  });

  return appendices;
}

function splitRoughNotes(notes) {
  return notes
    .replace(/\r/g, "\n")
    .split(/\n+|(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function improveSentence(sentence) {
  const protectedSentence = sentence
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .replace(/\bi\b/g, "I")
    .trim();
  const firstCharacter = protectedSentence.charAt(0).toUpperCase();
  const rest = protectedSentence.slice(1);
  const withCapital = `${firstCharacter}${rest}`;

  if (/[.!?]$/.test(withCapital)) {
    return withCapital;
  }

  return `${withCapital}.`;
}

function professionalizeSentence(sentence) {
  return improveSentence(sentence)
    .replace(/\bwe arrived\b/gi, "On arrival, the crew observed")
    .replace(/\bwe saw\b/gi, "The crew observed")
    .replace(/\bput out\b/gi, "extinguished")
    .replace(/\bburnt\b/gi, "burned")
    .replace(/\bguy\b/gi, "male individual")
    .replace(/\blady\b/gi, "female individual")
    .replace(/\bhouse\b/gi, "dwelling house");
}

function classifyWritingSentence(sentence) {
  const text = sentence.toLowerCase();

  if (
    text.includes("witness") ||
    text.includes("stated") ||
    text.includes("reported") ||
    text.includes("informed") ||
    text.includes("before arrival") ||
    text.includes("prior to arrival") ||
    text.includes("on arrival was told")
  ) {
    return "Additional Information";
  }

  if (
    text.includes("damage") ||
    text.includes("burnt") ||
    text.includes("charred") ||
    text.includes("smoke damage") ||
    text.includes("heat damage") ||
    text.includes("water damage")
  ) {
    return "Description of Damage";
  }

  if (
    text.includes("extinguish") ||
    text.includes("hose") ||
    text.includes("jet") ||
    text.includes("water") ||
    text.includes("foam") ||
    text.includes("dry powder") ||
    text.includes("made up")
  ) {
    return "How Fire Was Extinguished";
  }

  if (
    text.includes("cause") ||
    text.includes("natural") ||
    text.includes("accidental") ||
    text.includes("incendiary") ||
    text.includes("undetermined")
  ) {
    return "Cause Determination";
  }

  return "Officer's Observations";
}

function scoreWritingQuality(result) {
  const completedSections = writingSections.filter((section) => result.sections[section].length > 0).length;
  const sectionScore = Math.round((completedSections / writingSections.length) * 45);
  const concernPenalty = Math.min(result.concerns.length * 5, 30);
  const contentScore = result.originalText.trim() ? 35 : 0;
  const causeScore =
    result.sections["Cause Determination"].length === 0 ||
    causeClassifications.some((classification) =>
      result.sections["Cause Determination"].join(" ").toLowerCase().includes(classification.toLowerCase())
    )
      ? 20
      : 5;

  return Math.max(0, Math.min(100, sectionScore + contentScore + causeScore - concernPenalty));
}

function scoreFirePreventionReadiness(result) {
  const requiredSections = [
    "Officer's Observations",
    "Additional Information",
    "Description of Damage",
    "How Fire Was Extinguished"
  ];
  const sectionScore = requiredSections.filter((section) => result.sections[section].length > 0).length * 18;
  const causeScore = result.sections["Cause Determination"].length > 0 ? 12 : 0;
  const penalty = Math.min(result.concerns.length * 6, 35);

  return Math.max(0, Math.min(100, sectionScore + causeScore + 16 - penalty));
}

function improveWritingNotes(notes, mode) {
  const sections = writingSections.reduce((current, section) => ({ ...current, [section]: [] }), {});
  const concerns = [];
  const sentences = splitRoughNotes(notes);
  const modeRequiresSections = mode !== "Grammar Correction";
  const modeUsesProfessionalLanguage = mode !== "Grammar Correction";
  const modeIsFirePrevention = mode === "Fire Prevention Standard";

  if (!notes.trim()) {
    const emptyResult = {
      originalText: notes,
      improvedText: "",
      sections,
      concerns: ["Enter rough report notes before using Improve Writing."],
      qualityScore: 0,
      firePreventionReadinessScore: 0
    };
    return emptyResult;
  }

  if (!modeRequiresSections) {
    sections["Additional Information"] = sentences.map(improveSentence);
  } else {
    sentences.forEach((sentence) => {
      const section = classifyWritingSentence(sentence);
      const improved = modeUsesProfessionalLanguage ? professionalizeSentence(sentence) : improveSentence(sentence);
      sections[section].push(improved);
    });
  }

  if (modeRequiresSections) {
    writingSections.forEach((section) => {
      if (sections[section].length === 0) {
        concerns.push(`Missing or unclear: ${section}.`);
      }
    });
  }

  if (
    sections["Cause Determination"].length > 0 &&
    !causeClassifications.some((classification) =>
      sections["Cause Determination"].join(" ").toLowerCase().includes(classification.toLowerCase())
    )
  ) {
    concerns.push("Cause Determination must use only Natural, Accidental, Incendiary, or Undetermined when a cause classification is stated.");
  }

  if (sections["Officer's Observations"].some((sentence) => classifyWritingSentence(sentence) === "Additional Information")) {
    concerns.push("Review Officer's Observations for witness statements, received information, or pre-arrival actions.");
  }

  if (modeIsFirePrevention) {
    if (sections["Description of Damage"].length === 0) {
      concerns.push("Fire Prevention readiness issue: damage description is missing.");
    }
    if (sections["How Fire Was Extinguished"].length === 0) {
      concerns.push("Fire Prevention readiness issue: extinguishment details are missing.");
    }
    if (sections["Cause Determination"].length === 0) {
      concerns.push("Fire Prevention readiness issue: cause determination is missing or unsupported.");
    }
  }

  concerns.push("Review improved wording before placing it into the official form. No missing fact has been guessed.");

  const result = {
    originalText: notes,
    improvedText: "",
    sections,
    concerns: [...new Set(concerns)],
    qualityScore: 0,
    firePreventionReadinessScore: 0
  };
  result.improvedText = formatImprovedWritingResult(result);
  result.qualityScore = scoreWritingQuality(result);
  result.firePreventionReadinessScore = scoreFirePreventionReadiness(result);

  return result;
}

function formatImprovedWritingResult(result) {
  return writingSections
    .map((section) => {
      const content = result.sections[section].length ? result.sections[section].join(" ") : "[Missing information]";
      return `${section}\n${content}`;
    })
    .join("\n\n");
}

const bulkFieldAliases = [
  ["reportNumber", ["report number", "report no", "fire report number", "no"]],
  ["station", ["station", "fire station"]],
  ["watch", ["watch"]],
  ["incidentType", ["incident type", "type of incident", "incident"]],
  ["wind", ["wind"]],
  ["dateCallReceived", ["date call received", "date received", "call date"]],
  ["timeCallReceived", ["time call received", "time received", "call time"]],
  ["howCallReceived", ["how call received", "call received by", "received by"]],
  ["addressGiven", ["address given", "given address"]],
  ["actualAddress", ["actual address", "actual address of fire", "address of fire", "fire address"]],
  ["timeApplianceLeftStation", ["time appliance left station", "appliance left", "left station"]],
  ["approxDistanceToFire", ["approx distance to fire", "distance to fire"]],
  ["ownerOccupier", ["owner", "owner occupier", "owner/occupier", "occupier", "owner's name"]],
  ["hydrantDistance", ["hydrant distance", "distance of nearest hydrant", "nearest hydrant"]],
  ["causeOfFire", ["cause", "cause of fire", "cause determination"]],
  ["waterSupply", ["water supply", "water supply sufficient", "was water supply sufficient"]],
  ["lpmAvailable", ["lpm available", "l.p.m. available"]],
  ["lpmRequired", ["lpm required", "l.p.m. required"]],
  ["typeOfProperty", ["type of property", "property description", "property"]],
  ["howFireExtinguished", ["how fire was extinguished", "extinguished", "extinguishment"]],
  ["descriptionOfDamage", ["description of damage", "damage", "damage description"]],
  ["appliancesAttending", ["appliances attending", "appliances"]],
  ["officersAttending", ["officers attending", "officers"]],
  ["seniorOfficersAttending", ["fs/so and fs/o attending", "f.s.s.o", "senior officers", "fsso"]],
  ["professionalsAttending", ["professionals", "professionals attending"]],
  ["auxiliaryAttending", ["auxiliary", "auxillary", "auxiliary attending"]],
  ["casualties", ["casualties", "injuries"]],
  ["valuesDamageInsurance", ["values damage insurance", "insurance", "value", "values"]],
  ["officersObservations", ["officer observations", "officer's observations", "observations"]],
  ["additionalInformation", ["additional information", "additional info", "witness", "information received"]],
  ["dateOfFire", ["date of fire", "fire date"]],
  ["dateOfReport", ["date of report", "report date"]],
  ["reportingOfficer", ["reporting officer", "officer in charge", "signature"]],
  ["rank", ["rank"]]
];

function normalizeLabel(value) {
  return value.toLowerCase().replace(/[^a-z0-9/ ]/g, "").replace(/\s+/g, " ").trim();
}

function findFieldByLabel(label) {
  const normalizedLabel = normalizeLabel(label);

  return bulkFieldAliases.find(([, aliases]) =>
    aliases.some((alias) => normalizedLabel === normalizeLabel(alias) || normalizedLabel.includes(normalizeLabel(alias)))
  )?.[0];
}

function findOptionMatch(text, options) {
  const normalizedText = text.toLowerCase();
  return options.find((option) => normalizedText.includes(option.toLowerCase()));
}

function extractLabeledData(lines) {
  const data = {};
  const usedLines = new Set();

  lines.forEach((line, index) => {
    const match = line.match(/^([^:=-]{2,45})\s*[:=-]\s*(.+)$/);
    if (!match) {
      return;
    }

    const field = findFieldByLabel(match[1]);
    if (!field) {
      return;
    }

    data[field] = match[2].trim();
    usedLines.add(index);
  });

  return { data, usedLines };
}

function normalizeDateForInput(day, monthName, year) {
  const months = {
    january: "01",
    february: "02",
    march: "03",
    april: "04",
    may: "05",
    june: "06",
    july: "07",
    august: "08",
    september: "09",
    october: "10",
    november: "11",
    december: "12"
  };
  const month = months[monthName.toLowerCase()];
  if (!month) {
    return "";
  }

  return `${year}-${month}-${String(day).padStart(2, "0")}`;
}

function extractBetween(text, startPattern, endPattern) {
  const match = text.match(new RegExp(`${startPattern}([\\s\\S]*?)${endPattern}`, "i"));
  return match?.[1]?.replace(/\s+/g, " ").trim() || "";
}

function extractNarrativeData(notes) {
  const data = {};
  const concerns = [];

  const dateWords = notes.match(/\b(?:on\s+the\s+)?(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\s*,?\s+(\d{4})/i);
  if (dateWords) {
    const date = normalizeDateForInput(dateWords[1], dateWords[2], dateWords[3]);
    data.dateCallReceived = date;
    data.dateOfFire = date;
  }

  const investigationDate = notes.match(/investigation\s+was\s+conducted\s+on\s+the\s+(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\s*,?\s+(\d{4})/i);
  if (investigationDate) {
    data.dateOfReport = normalizeDateForInput(investigationDate[1], investigationDate[2], investigationDate[3]);
  }

  const stationMatch = notes.match(/left\s+the\s+([A-Za-z -]+Fire Station)/i);
  if (stationMatch) {
    const station = stationOptions.find((option) => option.toLowerCase() === stationMatch[1].toLowerCase());
    data.station = station || stationMatch[1];
  }

  const addressMatch =
    notes.match(/fire call at\s+([\s\S]*?)(?:\.\s+Involved was|\n\s*Involved was|Involved was|$)/i) ||
    notes.match(/(?:address given|actual address|address of fire)\s*[:=-]\s*([^\n]+)/i);
  if (addressMatch) {
    data.addressGiven = addressMatch[1].replace(/\s+/g, " ").replace(/\.$/, "").trim();
    data.actualAddress = data.addressGiven;
  }

  const appliances = [...notes.matchAll(/#\s*(\d+)\s+(Water Tender|Ambulance|Pump|Emergency Tender|Ladder|Appliance)/gi)].map(
    (match) => `#${match[1]} ${match[2]}`
  );
  if (appliances.length) {
    data.appliancesAttending = appliances.join(", ");
  }

  const officers = [...notes.matchAll(/#\s*(\d+)\s+Fire\s*fighter\s+([A-Za-z.' -]+)/gi)].map((match) =>
    `#${match[1]} Firefighter ${match[2].replace(/\s+(in charge|driven by|led by).*$/i, "").trim()}`
  );
  if (officers.length) {
    data.officersAttending = [...new Set(officers)].join(", ");
  }

  const inChargeMatch = notes.match(/#\s*(\d+)\s+Fire\s*fighter\s+([A-Za-z.' -]+?)\s+in charge/i);
  if (inChargeMatch) {
    data.seniorOfficersAttending = `#${inChargeMatch[1]} Firefighter ${inChargeMatch[2].trim()} in charge`;
  }

  const propertyDescription = extractBetween(notes, "Involved was\\s+", ",\\s*valued at");
  if (propertyDescription) {
    data.typeOfProperty = improveSentence(propertyDescription);
  }

  const valuesDamage = extractBetween(notes, "valued at\\s+", "A fire investigation was conducted");
  if (valuesDamage) {
    data.valuesDamageInsurance = improveSentence(valuesDamage);
  }

  const damageParts = [];
  const buildingDamage = notes.match(/damages?\s+to\s+the\s+building\s+estimated\s+at\s+([^.)]+(?:\([^)]*\))?)/i);
  const stockDamage = notes.match(/damages?\s+to\s+the\s+stock\s+valued\s+approximately\s+([^.)]+(?:\([^)]*\))?)/i);
  if (buildingDamage) {
    damageParts.push(`Damage to the building was estimated at ${buildingDamage[1].trim()}.`);
  }
  if (stockDamage) {
    damageParts.push(`Damage to the stock was valued approximately ${stockDamage[1].trim()}.`);
  }
  if (damageParts.length) {
    data.descriptionOfDamage = damageParts.join(" ");
  }

  const causeNarrative = extractBetween(notes, "The Area of Origin\\s+", "$");
  if (causeNarrative) {
    data.additionalInformation = improveSentence(
      `A fire investigation was conducted. The Area of Origin ${causeNarrative}`
    );
  }

  const investigationTime = notes.match(/started\s+at\s+(\d{3,4})\s*hours/i);
  if (investigationTime && !data.timeCallReceived) {
    concerns.push("Investigation start time was detected, but call received time was not identified.");
  }

  if (/direct application of an open flame/i.test(notes)) {
    concerns.push(
      "Open flame language detected. Select the official cause classification only after officer confirmation."
    );
  }

  if (!/extinguish|extinguished|hose|jet|water|foam|dry powder/i.test(notes)) {
    concerns.push("Could not identify how the fire was extinguished.");
  }

  return { data, concerns };
}

function inferBulkData(notes) {
  const lines = notes
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const { data, usedLines } = extractLabeledData(lines);
  const narrativeResult = extractNarrativeData(notes);
  Object.entries(narrativeResult.data).forEach(([key, value]) => {
    if (!data[key] && value) {
      data[key] = value;
    }
  });
  const lowerNotes = notes.toLowerCase();
  const concerns = [...narrativeResult.concerns];

  const station = findOptionMatch(notes, stationOptions);
  if (station && !data.station) {
    data.station = station;
  }

  const watch = findOptionMatch(notes, watchOptions);
  if (watch && !data.watch) {
    data.watch = watch;
  }

  const incidentType = findOptionMatch(notes, incidentTypes);
  if (incidentType && !data.incidentType) {
    data.incidentType = incidentType;
  }

  const cause = findOptionMatch(notes, causeClassifications);
  if (cause && !data.causeOfFire) {
    data.causeOfFire = cause;
  }

  const wind = findOptionMatch(notes, windOptions);
  if (wind && !data.wind) {
    data.wind = wind;
  }

  if (!data.waterSupply) {
    if (/\b(water supply|supply)\b.*\b(sufficient|yes)\b/i.test(notes)) {
      data.waterSupply = "Yes";
    } else if (/\b(water supply|supply)\b.*\b(insufficient|no)\b/i.test(notes)) {
      data.waterSupply = "No";
    }
  }

  const reportNumberMatch = notes.match(/\b(?:report\s*(?:number|no\.?)|no\.?)\s*[:#-]?\s*([A-Za-z0-9/-]+)/i);
  if (reportNumberMatch && !data.reportNumber) {
    data.reportNumber = reportNumberMatch[1];
  }

  const dateMatch = notes.match(/\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}-\d{2}-\d{2})\b/);
  if (dateMatch && !data.dateCallReceived) {
    if (!data.dateCallReceived) {
      data.dateCallReceived = dateMatch[1];
    }
    if (!data.dateOfFire) {
      data.dateOfFire = dateMatch[1];
    }
  }

  const timeMatch = notes.match(/\b(\d{1,2}:\d{2}\s*(?:hrs?|am|pm)?|\d{3,4}\s*hrs?)\b/i);
  if (timeMatch && !data.timeCallReceived) {
    data.timeCallReceived = timeMatch[1];
  }

  const unusedText = lines
    .filter((line, index) => !usedLines.has(index))
    .filter((line) => !stationOptions.some((stationOption) => line.includes(stationOption)))
    .join(" ");

  if (unusedText && !data.additionalInformation) {
    data.additionalInformation = improveSentence(unusedText);
    concerns.push("Unlabelled text was placed in Additional Information for officer review.");
  } else if (unusedText && data.additionalInformation) {
    concerns.push("Some unlabelled narrative text was already represented in extracted fields; review all populated fields.");
  }

  if (lowerNotes.includes("witness") || lowerNotes.includes("stated") || lowerNotes.includes("informed")) {
    concerns.push("Witness statements or received information detected; review Additional Information.");
  }

  mandatoryFields.forEach((field) => {
    if (!data[field.name]) {
      concerns.push(`Could not identify: ${field.label}.`);
    }
  });

  return {
    data,
    concerns: [...new Set(concerns)]
  };
}

function FieldInput({ field, value, onChange }) {
  const requiredText = field.mandatory ? "Required" : "Optional";

  if (field.type === "select") {
    return (
      <label className={field.wide ? "wide" : undefined}>
        <span>
          {field.label} <em>{requiredText}</em>
        </span>
        <select name={field.name} value={value} onChange={onChange}>
          <option value="">{`Select ${field.label.toLowerCase()}`}</option>
          {field.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (field.type === "textarea") {
    return (
      <label className={field.wide ? "wide" : undefined}>
        <span>
          {field.label} <em>{requiredText}</em>
        </span>
        <textarea name={field.name} value={value} onChange={onChange} rows={4} placeholder={field.help || ""} />
      </label>
    );
  }

  return (
    <label className={field.wide ? "wide" : undefined}>
      <span>
        {field.label} <em>{requiredText}</em>
      </span>
      <input type={field.type} name={field.name} value={value} onChange={onChange} />
    </label>
  );
}

function TemplateField({ className, children, fieldKey, value }) {
  const content = String(children || "").trim();
  return (
    <p className={`${className} ${fieldTextClass(fieldKey, value)}`}>{content}</p>
  );
}

function TemplateMark({ className, active }) {
  return <span className={`${className} template-mark`}>{active ? "X" : ""}</span>;
}

function splitForFields(value, lengths) {
  const words = String(value || "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const lines = lengths.map(() => "");

  words.forEach((word) => {
    const index = lines.findIndex((line, lineIndex) => `${line} ${word}`.trim().length <= lengths[lineIndex]);
    if (index >= 0) {
      lines[index] = `${lines[index]} ${word}`.trim();
    } else {
      lines[lines.length - 1] = `${lines[lines.length - 1]} ${word}`.trim();
    }
  });

  return lines;
}

function splitListForRows(value, count) {
  const items = String(value || "")
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
  return Array.from({ length: count }, (_, index) => items[index] || "");
}

function setPdfText(form, name, value, fontSize = 9) {
  const field = form.getTextField(name);
  field.setText(String(value || ""));
  field.setFontSize(fontSize);
}

function setPdfCheck(pdfForm, name, checked) {
  const field = pdfForm.getCheckBox(name);
  if (checked) {
    field.check();
  } else {
    field.uncheck();
  }
}

function extractCurrencyAfter(text, label) {
  const match = String(text || "").match(new RegExp(`${label}[^$]*\\$?\\s*([0-9,]+(?:\\.\\d{2})?)`, "i"));
  return match ? `$${match[1]}` : "";
}

async function createFilledOfficialPdf(formData) {
  const existingPdfBytes = await fetch("/templates/ttfs-fire-report-form.pdf").then((response) => response.arrayBuffer());
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  pdfDoc.registerFontkit(fontkit);
  const pdfForm = pdfDoc.getForm();
  let formFont;
  try {
    const fontBytes = await fetch("/fonts/times-new-roman.ttf").then((response) => response.arrayBuffer());
    formFont = await pdfDoc.embedFont(fontBytes, { subset: true });
  } catch {
    formFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  }

  const addressGiven = splitForFields(formData.addressGiven, [30, 44, 44]);
  const actualAddress = splitForFields(formData.actualAddress, [26, 44, 44]);
  const owner = splitForFields(formData.ownerOccupier, [24, 34, 34]);
  const hydrant = splitForFields(formData.hydrantDistance, [36]);
  const cause = splitForFields(formData.causeOfFire, [36, 36]);
  const distance = splitForFields(formData.approxDistanceToFire, [24, 42]);
  const appliances = splitListForRows(formData.appliancesAttending, 5);
  const officers = splitListForRows(formData.officersAttending, 5);
  const seniorOfficers = splitListForRows(formData.seniorOfficersAttending, 5);
  const insurance = splitForFields(formData.valuesDamageInsurance, [90, 90, 90]);

  setPdfText(pdfForm, "No", formData.reportNumber);
  setPdfText(pdfForm, "Text7", formData.station, 10);
  setPdfText(pdfForm, "Date Call Received", formData.dateCallReceived);
  setPdfText(pdfForm, "Time Call Received", formData.timeCallReceived);
  setPdfText(pdfForm, "How Call Received", formData.howCallReceived);
  setPdfText(pdfForm, "Address Given 1", addressGiven[0]);
  setPdfText(pdfForm, "Address Given 2", addressGiven[1]);
  setPdfText(pdfForm, "Address Given 3", addressGiven[2]);
  setPdfText(pdfForm, "Actual Address of Fire 1", actualAddress[0]);
  setPdfText(pdfForm, "Actual Address of Fire 2", actualAddress[1]);
  setPdfText(pdfForm, "Actual Address of Fire 3", actualAddress[2]);
  setPdfText(pdfForm, "Time Appliance Left Station", formData.timeApplianceLeftStation);
  setPdfText(pdfForm, "Approx Distance to Fire 1", distance[0]);
  setPdfText(pdfForm, "Approx Distance to Fire 2", distance[1]);
  setPdfText(pdfForm, "Owners Name", owner[0]);
  setPdfText(pdfForm, "undefined", owner[1]);
  setPdfText(pdfForm, "undefined_2", owner[2]);
  setPdfText(pdfForm, "Distance of nearest Hydrant to Fire", hydrant[0]);
  setPdfText(pdfForm, "Cause of Fire 1", cause[0]);
  setPdfText(pdfForm, "Cause of Fire 2", cause[1]);
  setPdfCheck(pdfForm, "Check Box1", formData.waterSupply === "Yes");
  setPdfCheck(pdfForm, "Check Box2", formData.waterSupply === "No");
  setPdfText(pdfForm, "LPM Available", formData.lpmAvailable);
  setPdfText(pdfForm, "LPM Required", formData.lpmRequired);
  setPdfText(pdfForm, "Text4", truncateForForm("typeOfProperty", formData.typeOfProperty), 8);
  setPdfText(pdfForm, "Text5", truncateForForm("howFireExtinguished", formData.howFireExtinguished), 8);
  setPdfText(pdfForm, "Text6", truncateForForm("descriptionOfDamage", formData.descriptionOfDamage), 8);

  for (let index = 0; index < 5; index += 1) {
    setPdfText(pdfForm, `Appliances AttendingRow${index + 1}`, appliances[index]);
    setPdfText(pdfForm, `Officers AttendingRow${index + 1}`, officers[index]);
    setPdfText(pdfForm, `FSSO  FSOs AttendingRow${index + 1}`, seniorOfficers[index]);
  }

  setPdfText(pdfForm, "Text1", formData.professionalsAttending);
  setPdfText(pdfForm, "Text2", formData.auxiliaryAttending);
  setPdfText(pdfForm, "Date", formData.dateOfReport);
  setPdfText(pdfForm, "Rank", formData.rank);
  setPdfText(pdfForm, "Value of Building", extractCurrencyAfter(formData.valuesDamageInsurance, "Value of Building"));
  setPdfText(pdfForm, "Value of Stock", extractCurrencyAfter(formData.valuesDamageInsurance, "Value of Stock"));
  setPdfText(pdfForm, "Damage to Building", extractCurrencyAfter(formData.valuesDamageInsurance, "Damage to Building"));
  setPdfText(pdfForm, "Damage to Stock", extractCurrencyAfter(formData.valuesDamageInsurance, "Damage to Stock"));
  setPdfText(pdfForm, "Building and Stock Insured as follows 1", insurance[0]);
  setPdfText(pdfForm, "Building and Stock Insured as follows 2", insurance[1]);
  setPdfText(pdfForm, "Building and Stock Insured as follows 3", insurance[2]);
  setPdfText(pdfForm, "Text3", truncateForForm("officersObservations", formData.officersObservations), 8);

  pdfForm.updateFieldAppearances(formFont);

  return pdfDoc.save();
}

export default function Home() {
  const [form, setForm] = useState(initialForm);
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [exportStatus, setExportStatus] = useState("");
  const [filledPdfUrl, setFilledPdfUrl] = useState("");
  const [roughWritingNotes, setRoughWritingNotes] = useState("");
  const [writingResult, setWritingResult] = useState(null);
  const [writingMode, setWritingMode] = useState(writingModes[1]);
  const [bulkNotes, setBulkNotes] = useState("");
  const [bulkResult, setBulkResult] = useState(null);

  const warnings = useMemo(() => buildValidationWarnings(form), [form]);
  const categoryScores = useMemo(() => calculateCategoryScores(form, warnings), [form, warnings]);
  const qualityScore = useMemo(() => calculateQualityScore(categoryScores), [categoryScores]);
  const fireReport = useMemo(() => buildFireReport(form), [form]);
  const improvedReport = useMemo(() => buildImprovedReport(form), [form]);
  const causeAnalysis = useMemo(() => buildCauseAnalysis(form), [form]);
  const appendices = useMemo(() => buildAppendices(form), [form]);
  const recommendations = useMemo(() => buildRecommendations(form, warnings, categoryScores), [form, warnings, categoryScores]);
  const promptSummary = useMemo(() => buildPromptSummary(form), [form]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleImproveWriting() {
    setWritingResult(improveWritingNotes(roughWritingNotes, writingMode));
  }

  function handleAutoFillForm() {
    const result = inferBulkData(bulkNotes);
    setForm((current) => ({ ...current, ...result.data }));
    setBulkResult(result);
  }

  function openPdfPreview() {
    setPreviewOpen(true);
    setExportStatus("PDF package preview opened below. Review the completed TTFS form pages and appendices before printing.");
    window.setTimeout(() => {
      document.getElementById("pdf-preview")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  async function downloadFilledPdf() {
    setExportStatus("Creating filled official TTFS PDF from the embedded form fields...");
    try {
      if (filledPdfUrl) {
        URL.revokeObjectURL(filledPdfUrl);
      }
      const pdfBytes = await createFilledOfficialPdf(form);
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setFilledPdfUrl(url);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${form.reportNumber || "ttfs-fire-report"}-completed.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setExportStatus("Completed official TTFS PDF generated. If it did not download automatically, use the link below.");
    } catch (error) {
      setExportStatus(`PDF export failed: ${error.message}`);
    }
  }

  function printPdf() {
    setPreviewOpen(true);
    setExportStatus(
      "Opening print dialog. If your browser blocks it, use the visible preview below and press Cmd+P or Ctrl+P, then choose Save as PDF."
    );
    window.setTimeout(() => {
      document.getElementById("pdf-preview")?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.print();
    }, 250);
  }

  return (
    <main className={`app-shell ${previewOpen ? "previewing" : ""}`}>
      <section className="topbar">
        <div>
          <p className="eyebrow">Trinidad and Tobago Fire Service</p>
          <h1>TTFS Report Assistant</h1>
        </div>
        <div className="score-pill" aria-label={`Report quality score ${qualityScore} out of 100`}>
          <span>{qualityScore}</span>
          <small>/100</small>
        </div>
      </section>

      <nav className="tabs" aria-label="Report workflow">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={activeTab === tab ? "active" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>

      <div className="workspace">
        <section className="panel input-panel" aria-labelledby="form-heading">
          <div className="section-heading">
            <p className="eyebrow">Official form fields</p>
            <h2 id="form-heading">Fire Report Input Form</h2>
          </div>

          <div className="bulk-intake">
            <label>
              <span>
                Dump collected data <em>Auto-sort</em>
              </span>
              <textarea
                value={bulkNotes}
                onChange={(event) => setBulkNotes(event.target.value)}
                rows={8}
                placeholder="Paste all collected notes here. Labelled lines work best, for example: Station: Tunapuna Fire Station, Cause: Accidental, Damage: ..."
              />
            </label>
            <button type="button" onClick={handleAutoFillForm}>
              Auto-fill Form
            </button>
            {bulkResult ? (
              <div className="bulk-result">
                <strong>{Object.keys(bulkResult.data).length} field(s) filled.</strong>
                <ul>
                  {bulkResult.concerns.slice(0, 8).map((concern) => (
                    <li key={concern}>{concern}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <div className="quick-selects" aria-label="Watch and incident type selections">
            {quickSelectFields.map((field) => (
              <FieldInput key={field.name} field={field} value={form[field.name]} onChange={updateField} />
            ))}
          </div>

          <div className="form-grid">
            {reportFormFields.map((field) => (
              <FieldInput key={field.name} field={field} value={form[field.name]} onChange={updateField} />
            ))}
          </div>
        </section>

        <section className="panel output-panel no-print" aria-labelledby="output-heading">
          <div className="output-header">
            <div>
              <p className="eyebrow">{activeTab}</p>
              <h2 id="output-heading">Report Workspace</h2>
            </div>
            <strong>{qualityScore}/100</strong>
          </div>

          {activeTab === "Generate Report" && (
            <>
              <article>
                <h3>Fire Report</h3>
                <pre>{fireReport}</pre>
              </article>
              <article>
                <h3>Officer's Observations</h3>
                <p>{form.officersObservations.trim() || "Missing: enter only observations from arrival to departure."}</p>
              </article>
              <article>
                <h3>Additional Information</h3>
                <p>
                  {form.additionalInformation.trim() ||
                    "Not provided: witness statements, received information, and pre-arrival actions belong here."}
                </p>
              </article>
              <article>
                <h3>Cause Analysis</h3>
                <p>{causeAnalysis}</p>
              </article>
              <article>
                <h3>TTFS Prompts</h3>
                {form.incidentType ? (
                  <ul>
                    {incidentPrompts[form.incidentType].map((prompt) => (
                      <li key={prompt}>{prompt}</li>
                    ))}
                  </ul>
                ) : (
                  <p>Select an incident type to show intelligent TTFS prompts.</p>
                )}
              </article>
            </>
          )}

          {activeTab === "Vet Report" && (
            <>
              <article>
                <h3>Validation Warnings</h3>
                {warnings.length ? (
                  <ul>
                    {warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No validation warnings detected.</p>
                )}
              </article>
              <article>
                <h3>Category Score</h3>
                <div className="meter" aria-hidden="true">
                  <span style={{ width: `${qualityScore}%` }} />
                </div>
                <p>{qualityScore}/100 based on category scoring.</p>
                <div className="score-grid">
                  {Object.entries(categoryScores).map(([category, score]) => (
                    <div key={category}>
                      <span>{category}</span>
                      <strong>{score}</strong>
                    </div>
                  ))}
                </div>
              </article>
              <article>
                <h3>Recommendations</h3>
                <ul>
                  {recommendations.map((recommendation) => (
                    <li key={recommendation}>{recommendation}</li>
                  ))}
                </ul>
              </article>
            </>
          )}

          {activeTab === "Improve Report" && (
            <>
              <article>
                <h3>AI Writing Improvement</h3>
                <label className="writer-level">
                  <span>
                    Writing mode <em>Required</em>
                  </span>
                  <select value={writingMode} onChange={(event) => setWritingMode(event.target.value)}>
                    {writingModes.map((mode) => (
                      <option key={mode} value={mode}>
                        {mode}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="writer-box">
                  <span>
                    Rough notes or weak wording <em>Fact-preserving</em>
                  </span>
                  <textarea
                    value={roughWritingNotes}
                    onChange={(event) => setRoughWritingNotes(event.target.value)}
                    rows={8}
                    placeholder="Paste rough notes, weak sentences, or incomplete wording here. The assistant will improve wording without changing facts."
                  />
                </label>
                <button type="button" onClick={handleImproveWriting}>
                  Improve Writing
                </button>
              </article>
              {writingResult ? (
                <>
                  <article>
                    <h3>Original Text</h3>
                    <pre>{writingResult.originalText}</pre>
                  </article>
                  <article>
                    <h3>Improved Text</h3>
                    <pre>{writingResult.improvedText}</pre>
                  </article>
                  <article>
                    <h3>Missing Information</h3>
                    <ul>
                      {writingResult.concerns.map((concern) => (
                        <li key={concern}>{concern}</li>
                      ))}
                    </ul>
                  </article>
                  <article>
                    <h3>Quality Score</h3>
                    <div className="meter" aria-hidden="true">
                      <span style={{ width: `${writingResult.qualityScore}%` }} />
                    </div>
                    <p>{writingResult.qualityScore}/100</p>
                  </article>
                  <article>
                    <h3>Fire Prevention Readiness Score</h3>
                    <div className="meter" aria-hidden="true">
                      <span style={{ width: `${writingResult.firePreventionReadinessScore}%` }} />
                    </div>
                    <p>{writingResult.firePreventionReadinessScore}/100</p>
                  </article>
                </>
              ) : null}
              <article>
                <h3>Improved Report Draft</h3>
                <pre>{improvedReport}</pre>
              </article>
              <article>
                <h3>Improvement Notes</h3>
                <p>
                  The draft is organized into official report categories without inventing facts. Missing or uncertain
                  information remains visible for officer review.
                </p>
                <p>{promptSummary}</p>
              </article>
              <article>
                <h3>Recommendations</h3>
                <ul>
                  {recommendations.map((recommendation) => (
                    <li key={recommendation}>{recommendation}</li>
                  ))}
                </ul>
              </article>
            </>
          )}

          {activeTab === "Export PDF" && (
            <>
              <article>
                <h3>Official PDF Export</h3>
                <p>
                  The printable export is prepared to use the immutable official TTFS form template at{" "}
                  <code>{officialTemplatePath}</code>. Generated content is placed over the rendered official form pages,
                  text shrinks where reasonable, and overflow continues on appendix pages.
                </p>
                <div className="export-actions">
                  <button type="button" onClick={downloadFilledPdf}>
                    Download Filled Official PDF
                  </button>
                  <button type="button" onClick={openPdfPreview}>
                    Preview PDF Package
                  </button>
                  <button type="button" className="secondary-action" onClick={printPdf}>
                    Print / Save as PDF
                  </button>
                </div>
                {exportStatus ? <p className="export-status">{exportStatus}</p> : null}
                {filledPdfUrl ? (
                  <p className="export-status">
                    <a href={filledPdfUrl} download={`${form.reportNumber || "ttfs-fire-report"}-completed.pdf`}>
                      Download generated PDF again
                    </a>
                  </p>
                ) : null}
              </article>
              <article>
                <h3>Appendix Pages</h3>
                <p>{appendices.length ? `${appendices.length} appendix page(s) will be appended.` : "No appendix pages needed."}</p>
              </article>
              <article>
                <h3>Export Readiness</h3>
                {warnings.length ? (
                  <ul>
                    {warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                ) : (
                  <p>Ready to export.</p>
                )}
              </article>
              <article>
                <h3>Submission Package</h3>
                <p>
                  PDF output contains the completed TTFS report form followed by Appendix pages as required for Fire
                  Prevention submission.
                </p>
              </article>
            </>
          )}
        </section>
      </div>

      <section id="pdf-preview" className="print-export" aria-label="Printable TTFS Fire Report">
        <div className="template-page template-page-one">
          <TemplateField className="tf-report-number" fieldKey="reportNumber" value={form.reportNumber}>
            {form.reportNumber}
          </TemplateField>
          <TemplateField className="tf-station" fieldKey="station" value={form.station}>
            {form.station}
          </TemplateField>
          <TemplateMark className="tf-wind-strong" active={form.wind === "Strong"} />
          <TemplateMark className="tf-wind-average" active={form.wind === "Average"} />
          <TemplateMark className="tf-wind-none" active={form.wind === "None"} />
          <TemplateField className="tf-date-call" fieldKey="dateCallReceived" value={form.dateCallReceived}>
            {form.dateCallReceived}
          </TemplateField>
          <TemplateField className="tf-time-call" fieldKey="timeCallReceived" value={form.timeCallReceived}>
            {form.timeCallReceived}
          </TemplateField>
          <TemplateField className="tf-how-call" fieldKey="howCallReceived" value={form.howCallReceived}>
            {form.howCallReceived}
          </TemplateField>
          <TemplateField className="tf-address-given" fieldKey="addressGiven" value={form.addressGiven}>
            {form.addressGiven}
          </TemplateField>
          <TemplateField className="tf-actual-address" fieldKey="actualAddress" value={form.actualAddress}>
            {form.actualAddress}
          </TemplateField>
          <TemplateField
            className="tf-left-station"
            fieldKey="timeApplianceLeftStation"
            value={form.timeApplianceLeftStation}
          >
            {form.timeApplianceLeftStation}
          </TemplateField>
          <TemplateField className="tf-distance-fire" fieldKey="approxDistanceToFire" value={form.approxDistanceToFire}>
            {form.approxDistanceToFire}
          </TemplateField>
          <TemplateField className="tf-owner" fieldKey="ownerOccupier" value={form.ownerOccupier}>
            {form.ownerOccupier}
          </TemplateField>
          <TemplateField className="tf-hydrant" fieldKey="hydrantDistance" value={form.hydrantDistance}>
            {form.hydrantDistance}
          </TemplateField>
          <TemplateField className="tf-cause" fieldKey="causeOfFire" value={form.causeOfFire}>
            {form.causeOfFire}
          </TemplateField>
          <TemplateMark className="tf-water-yes" active={form.waterSupply === "Yes"} />
          <TemplateMark className="tf-water-no" active={form.waterSupply === "No"} />
          <TemplateField className="tf-lpm-available" fieldKey="lpmAvailable" value={form.lpmAvailable}>
            {form.lpmAvailable}
          </TemplateField>
          <TemplateField className="tf-lpm-required" fieldKey="lpmRequired" value={form.lpmRequired}>
            {form.lpmRequired}
          </TemplateField>
          <TemplateField className="tf-type-property" fieldKey="typeOfProperty" value={form.typeOfProperty}>
            {truncateForForm("typeOfProperty", form.typeOfProperty)}
          </TemplateField>
          <TemplateField
            className="tf-extinguished"
            fieldKey="howFireExtinguished"
            value={form.howFireExtinguished}
          >
            {truncateForForm("howFireExtinguished", form.howFireExtinguished)}
          </TemplateField>
          <TemplateField className="tf-damage" fieldKey="descriptionOfDamage" value={form.descriptionOfDamage}>
            {truncateForForm("descriptionOfDamage", form.descriptionOfDamage)}
          </TemplateField>
        </div>

        <div className="template-page template-page-two">
          <TemplateField className="tf-appliances" fieldKey="appliancesAttending" value={form.appliancesAttending}>
            {truncateForForm("appliancesAttending", form.appliancesAttending)}
          </TemplateField>
          <TemplateField className="tf-officers" fieldKey="officersAttending" value={form.officersAttending}>
            {truncateForForm("officersAttending", form.officersAttending)}
          </TemplateField>
          <TemplateField
            className="tf-senior-officers"
            fieldKey="seniorOfficersAttending"
            value={form.seniorOfficersAttending}
          >
            {truncateForForm("seniorOfficersAttending", form.seniorOfficersAttending)}
          </TemplateField>
          <TemplateField
            className="tf-professionals"
            fieldKey="professionalsAttending"
            value={form.professionalsAttending}
          >
            {form.professionalsAttending}
          </TemplateField>
          <TemplateField className="tf-auxiliary" fieldKey="auxiliaryAttending" value={form.auxiliaryAttending}>
            {form.auxiliaryAttending}
          </TemplateField>
          <TemplateField className="tf-casualties" fieldKey="casualties" value={form.casualties}>
            {truncateForForm("casualties", form.casualties)}
          </TemplateField>
          <TemplateField className="tf-report-date" fieldKey="dateOfReport" value={form.dateOfReport}>
            {form.dateOfReport}
          </TemplateField>
          <TemplateField className="tf-signature-name" fieldKey="reportingOfficer" value={form.reportingOfficer}>
            {form.reportingOfficer}
          </TemplateField>
          <TemplateField className="tf-rank" fieldKey="rank" value={form.rank}>
            {form.rank}
          </TemplateField>
          <TemplateField
            className="tf-values-insurance"
            fieldKey="valuesDamageInsurance"
            value={form.valuesDamageInsurance}
          >
            {truncateForForm("valuesDamageInsurance", form.valuesDamageInsurance)}
          </TemplateField>
          <TemplateField
            className="tf-observations"
            fieldKey="officersObservations"
            value={form.officersObservations}
          >
            {truncateForForm("officersObservations", form.officersObservations)}
          </TemplateField>
        </div>

        {appendices.map((appendix, index) => (
          <div className="appendix-page" key={`${appendix.section}-${index}`}>
            <h2>{`APPENDIX ${index + 1}`}</h2>
            <div className="appendix-meta">
              <p>{compactLine("Fire Report Number", form.reportNumber)}</p>
              <p>{compactLine("Address of Fire", form.actualAddress || form.addressGiven)}</p>
              <p>{compactLine("Date of Fire", form.dateOfFire || form.dateCallReceived)}</p>
              <p>{compactLine("Date of Report", form.dateOfReport)}</p>
              <p>{compactLine("Section Continued", appendix.section)}</p>
            </div>
            <div className="appendix-text">{appendix.text}</div>
            <div className="appendix-signatures">
              <span>Officer Signature Line: ______________________________</span>
              <span>Rank Line: ______________________________</span>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
