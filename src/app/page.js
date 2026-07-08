"use client";

import { useEffect, useMemo, useState } from "react";

const authStorageKey = "ttfs-fire-investigation-auth-v1";
const authSessionKey = "ttfs-fire-investigation-session-v1";

const investigationStatuses = ["Not Started", "In Progress", "Blocked", "Complete"];

const investigationStages = [
  {
    id: "preScene",
    code: "1000",
    title: "Pre-scene Activities",
    mission:
      "Receive the assignment, define the problem, gather initial information, identify hazards, notify required parties, and prepare a safe investigation plan.",
    checkpoints: [
      "Record date/time of loss, location, property type, known hazards, injuries/fatalities, jurisdiction, and who is in charge.",
      "Identify permission/access issues, interested parties, partner agencies, equipment needs, and possible pre-scene interviews.",
      "Create and document a safety plan, PPE needs, known hazards, and any required safety briefing."
    ],
    outputs: ["Investigation need defined", "Initial information captured", "Safety plan", "Parties notified where required"],
    operations: [
      {
        id: "assignmentScope",
        title: "Assignment and Scope",
        action: "Confirm why investigative services are required and what authority or agency requested the work.",
        collect: ["Requesting agency/officer", "Incident location", "Date/time of loss", "Property type", "Known injuries/fatalities"],
        completeWhen: "The investigation need, jurisdiction, and initial scope are recorded."
      },
      {
        id: "initialIntelligence",
        title: "Initial Intelligence",
        action: "Gather early information before arrival without treating unverified information as fact.",
        collect: ["Dispatch notes", "Initial fireground summary", "Known hazards", "Owner/occupier details", "Possible witnesses"],
        completeWhen: "Early information is source-linked and unconfirmed items are clearly marked."
      },
      {
        id: "resourcesSafetyPlan",
        title: "Resources and Safety Plan",
        action: "Identify PPE, equipment, specialist support, scene hazards, and briefing needs.",
        collect: ["PPE required", "Tools/camera/sampling equipment", "Hazardous materials", "Utilities status", "Personnel briefing notes"],
        completeWhen: "A documented safety plan exists before scene work starts."
      }
    ]
  },
  {
    id: "sceneAccess",
    code: "1200",
    title: "Scene Access",
    mission:
      "Confirm lawful access before scene work and document whether access is by consent, agency authority, exigent circumstances, warrant, court order, or another approved route.",
    checkpoints: [
      "Record who controls the property or scene.",
      "Document consent, authority, exigent circumstances, warrant status, court order status, or reason access is delayed.",
      "If access is delayed, record permitted tasks completed while waiting, such as distance photographs, interviews, or checks for neighbouring CCTV."
    ],
    outputs: ["Access basis documented", "Access limitations recorded", "Permitted interim tasks tracked"],
    operations: [
      {
        id: "sceneControl",
        title: "Scene Control",
        action: "Identify who controls the scene and whether fire, police, owner, occupier, or another authority is responsible.",
        collect: ["Scene controller", "Property controller", "Restricted areas", "Safety perimeter", "Scene log if available"],
        completeWhen: "Control and restrictions are documented before entry."
      },
      {
        id: "lawfulAuthority",
        title: "Lawful Access Basis",
        action: "Document the access route before examination, including consent, agency authority, exigency, warrant, or court order.",
        collect: ["Access basis", "Person granting consent", "Warrant/order details", "Limits of authority", "Time access granted"],
        completeWhen: "The basis and limits of scene access are recorded."
      },
      {
        id: "delayedAccessTasks",
        title: "If Access Is Delayed",
        action: "Complete only permitted non-entry tasks while awaiting access.",
        collect: ["Distance photos", "Exterior observations", "Witness leads", "Neighbouring CCTV checks", "Weather/utility information"],
        completeWhen: "All interim tasks are documented with sources and no unauthorized entry is implied."
      }
    ]
  },
  {
    id: "witnessInfo",
    code: "1400-1500",
    title: "Witness Information",
    mission:
      "Identify, interview, and document fact witnesses, incident-related witnesses, first responders, and digital witness sources while preserving source details.",
    checkpoints: [
      "Record witness identity, role, contact, interview timing, method, and whether follow-up is required.",
      "Separate first-hand observations from received information, assumptions, or hearsay.",
      "For digital sources, record system/device type, file/storage type, owner or person in possession, and collection method."
    ],
    outputs: ["Witness list", "Timeline contributions", "Digital evidence leads", "Follow-up questions"],
    operations: [
      {
        id: "identifyWitnesses",
        title: "Identify Witnesses",
        action: "Separate fact witnesses, incident-related witnesses, first responders, and digital witnesses.",
        collect: ["Name/contact", "Role", "Location during fire", "First-hand observations", "Received information"],
        completeWhen: "A witness/source list exists and each source type is labelled."
      },
      {
        id: "conductInterviews",
        title: "Interview and Timeline",
        action: "Record statements, interview method, timing, and timeline details without merging them into officer observations.",
        collect: ["Interview date/time", "Method", "What was seen/heard/smelled", "Actions before arrival", "Follow-up questions"],
        completeWhen: "Witness facts are source-linked and timeline entries are separated from assumptions."
      },
      {
        id: "digitalWitnesses",
        title: "Digital Sources",
        action: "Identify CCTV, alarms, dispatch logs, phones, smart devices, and other digital systems.",
        collect: ["Device/system type", "Owner/controller", "File/storage type", "Collection method", "Preservation request"],
        completeWhen: "Digital sources are logged with possession/control and collection status."
      }
    ]
  },
  {
    id: "dataCollection",
    code: "2000",
    title: "Data Collection",
    mission:
      "Collect, preserve, and evaluate scene and non-scene data, including observations, fire effects, suppression effects, evidence, records, and outside reports.",
    checkpoints: [
      "Document general observations: odour, sound, visuals, ventilation, building/room characteristics, dimensions, fuels, contents, and disturbed items.",
      "Assess fire effects, suppression effects, overhaul effects, forced entry, ventilation changes, utility disconnections, and moved contents.",
      "Record evidence collection, sampling, testing requests, chain of custody, maps, CCTV, weather, dispatch logs, injuries, outside reports, and research."
    ],
    outputs: ["Scene data", "Non-scene data", "Evidence/samples", "Data gaps"],
    operations: [
      {
        id: "documentBeforeDisturbance",
        title: "Document Before Disturbance",
        action: "Photograph and note the scene condition before moving, sampling, or destructive examination.",
        collect: ["Overall photos", "Scene orientation", "Hazards", "Initial condition", "What has already been moved"],
        completeWhen: "The original observed condition is preserved in notes/photos before alteration."
      },
      {
        id: "systematicSceneExam",
        title: "Systematic Scene Exam",
        action: "Move from exterior to interior, then room by room, assigning labels and photos to each area.",
        collect: ["Exterior sides", "Room labels", "Ventilation openings", "Contents/fuels", "Fire and smoke effects"],
        completeWhen: "Every examined area has notes, label, and photo references."
      },
      {
        id: "preserveEvidence",
        title: "Preserve Evidence",
        action: "Identify, photograph, protect, collect, package, and track evidence only when appropriate.",
        collect: ["Potential ignition sources", "Samples", "Evidence location", "Collector", "Chain of custody"],
        completeWhen: "Evidence handling is documented before removal or testing."
      },
      {
        id: "collectNonSceneData",
        title: "Non-scene Data",
        action: "Collect records and technical data that may affect origin, cause, timeline, or fire development.",
        collect: ["CCTV", "Weather", "Utility status", "Dispatch logs", "Plans/maps", "Outside reports"],
        completeWhen: "Non-scene data is source-linked and contradictions are flagged."
      }
    ]
  },
  {
    id: "originDetermination",
    code: "3000-3200",
    title: "Origin Determination",
    mission:
      "Analyze fire patterns, fire dynamics, witness information, physical evidence, timeline data, and reconstruction information to develop and test origin hypotheses.",
    checkpoints: [
      "Evaluate fire effects in context: ventilation, fuels, heat/smoke flow, suppression, duration, and post-fire disturbance.",
      "Develop all area-of-origin hypotheses supported by the data.",
      "Test each origin hypothesis against analyzed case data, scientific knowledge, and contradictory evidence."
    ],
    outputs: ["Origin hypotheses", "Test results", "Surviving/eliminated hypotheses", "Area of origin or uncertainty"],
    operations: [
      {
        id: "analyzeFireEffects",
        title: "Analyze Fire Effects",
        action: "Assign meaning to patterns only after considering fuel, ventilation, duration, suppression, and disturbance.",
        collect: ["Pattern photos", "Measurements", "Fuel packages", "Ventilation conditions", "Suppression effects"],
        completeWhen: "Pattern interpretation includes limits and alternative explanations."
      },
      {
        id: "developOriginHypotheses",
        title: "Develop Origin Hypotheses",
        action: "List every plausible sector or area of origin supported by collected data.",
        collect: ["Possible sectors", "Supporting facts", "Contradictory facts", "Witness/digital timeline", "Physical evidence"],
        completeWhen: "All plausible origin hypotheses are documented before elimination."
      },
      {
        id: "testOriginHypotheses",
        title: "Test Origin Hypotheses",
        action: "Test each origin hypothesis against all known data and scientific knowledge.",
        collect: ["Hypothesis tested", "Support", "Contradictions", "Additional tests needed", "Eliminated/surviving status"],
        completeWhen: "Eliminated and surviving hypotheses are recorded with reasons."
      },
      {
        id: "stateOriginLimits",
        title: "State Origin or Limits",
        action: "State sector, area, point, or undetermined origin only to the precision supported by the evidence.",
        collect: ["Sector of origin", "Area of origin", "Point of origin if supported", "Uncertainty/radius", "Reviewer concerns"],
        completeWhen: "The origin conclusion or uncertainty is tied to tested facts."
      }
    ]
  },
  {
    id: "causeDetermination",
    code: "4000-4300",
    title: "Cause Determination",
    mission:
      "Identify and test ignition source, first fuel, oxidant, and ignition sequence before forming a cause conclusion or classifying the fire as undetermined.",
    checkpoints: [
      "Identify potential ignition sources, proximate first fuels, and oxidants in the area of origin.",
      "Build and update the event timeline using data, analyses, witness information, and fire patterns.",
      "Test each cause hypothesis for ignition-source competence, proximity, temperature, duration, timeline consistency, and fit with all observations."
    ],
    outputs: ["Ignition source", "First fuel/material ignited", "Oxidant", "Ignition sequence", "Cause hypothesis status"],
    operations: [
      {
        id: "identifyCauseElements",
        title: "Identify Cause Elements",
        action: "Identify potential ignition sources, first fuels, oxidants, and circumstances in the area of origin.",
        collect: ["Ignition source candidates", "First fuel candidates", "Oxidant/ventilation", "Human activity", "Equipment/appliance status"],
        completeWhen: "Cause elements are listed without selecting a conclusion prematurely."
      },
      {
        id: "buildIgnitionSequence",
        title: "Build Ignition Sequence",
        action: "Describe how ignition source, fuel, oxidant, and circumstances could have come together.",
        collect: ["Event timeline", "Competent ignition source", "Proximity", "Heat/energy duration", "Fuel configuration"],
        completeWhen: "Each sequence is mechanically and temporally plausible or clearly rejected."
      },
      {
        id: "testCauseHypotheses",
        title: "Test Cause Hypotheses",
        action: "Compare each cause hypothesis against all supporting and contradictory data.",
        collect: ["Hypothesis", "Supporting facts", "Contradictions", "Tests/lab needs", "Elimination reason"],
        completeWhen: "Only hypotheses that survive testing remain active."
      },
      {
        id: "classifyOrUndetermined",
        title: "Classify or Hold",
        action: "Use only Natural, Accidental, Incendiary, or Undetermined when classification is supported or confirmed.",
        collect: ["Supported cause", "Classification", "Unresolved elements", "Officer review", "Additional data required"],
        completeWhen: "The cause/classification is supported, or the matter remains Undetermined with reasons."
      }
    ]
  },
  {
    id: "reportingReview",
    code: "5000-5100",
    title: "Reporting and Review",
    mission:
      "Prepare a defensible investigation record, resolve review issues, and archive data, analysis, hypotheses, documentation, findings, and issued reports.",
    checkpoints: [
      "Confirm the investigation file separates facts, source statements, observations, analysis, conclusions, and unresolved gaps.",
      "Resolve technical or administrative review issues through additional data, consultation, revision, or documented disagreement.",
      "Archive notes, photographs, sketches, evidence records, witness statements, analysis, hypotheses, and issued reports."
    ],
    outputs: ["Investigation summary", "Review result", "Open issues", "Case record archive"],
    operations: [
      {
        id: "fileCompleteness",
        title: "File Completeness",
        action: "Confirm notes, photos, sketches, witness records, evidence logs, testing, and research are complete or flagged.",
        collect: ["Notes", "Photos", "Sketches", "Witness records", "Evidence records", "Outside reports"],
        completeWhen: "The file shows what was collected, what was not collected, and why."
      },
      {
        id: "technicalReview",
        title: "Technical Review",
        action: "Check whether conclusions follow from facts and tested hypotheses.",
        collect: ["Origin support", "Cause support", "Contradictions", "Missing tests", "Peer/reviewer comments"],
        completeWhen: "Review issues are resolved or documented for follow-up."
      },
      {
        id: "writeInvestigationReport",
        title: "Write Investigation Report",
        action: "Prepare the narrative investigation report using the Grenada example structure as the guide.",
        collect: ["Cover information", "Overview", "General information", "Investigation narrative", "Origin/cause conclusions", "Appendices"],
        completeWhen: "The report separates facts, analysis, conclusions, photographs, evidence, and unresolved limitations."
      },
      {
        id: "archiveAndIssue",
        title: "Archive and Issue",
        action: "Archive the case record and issue progress/final documents according to agency requirements.",
        collect: ["Issued reports", "Appendices", "Photo logs", "Evidence transfers", "Final unresolved items"],
        completeWhen: "The case record is preserved and final/progress outputs are traceable to the data."
      }
    ]
  }
];

const dataCollectionTracks = [
  {
    id: "generalObservations",
    code: "2006/2030",
    title: "General Observations",
    purpose: "Record the walk-through observations that define what is present, altered, damaged, missing, or potentially relevant.",
    prompts: [
      "Olfactory, audible, and visual observations.",
      "Ventilation sources: windows, doors, exhaust/intake openings, forced openings, and their condition.",
      "Building and room characteristics: dimensions, lining materials, surfaces, assemblies, contents, fuels, and things moved out.",
      "Disturbance: suppression effects, occupant movement, investigator movement, collapse, overhaul, or removed contents.",
      "Building systems observed: electrical, gas, HVAC, alarms, sprinklers, security, utilities, and telecoms."
    ],
    expectedEvidence: ["Scene notes", "Overall photographs", "Sketches/measurements", "Ventilation notes", "Disturbance notes"]
  },
  {
    id: "witnessAndDigital",
    code: "2008/1400",
    title: "Witness and Digital Data",
    purpose: "Collect information from people and digital systems without blending statements into direct observations.",
    prompts: [
      "Fact witnesses: discoverer, occupants, owners, employees, neighbours, observers, and callers.",
      "Incident-related witnesses: firefighters, police, security, 911/control operators, and other responders.",
      "Digital sources: CCTV, alarm panels, fire protection systems, intrusion systems, smart appliances, phones, computers, GPS, and communication logs.",
      "Document who owns or controls the device/source and how the information was collected.",
      "Record timeline facts separately from assumptions or opinion."
    ],
    expectedEvidence: ["Witness list", "Interview notes", "Digital source log", "Collection method", "Timeline entries"]
  },
  {
    id: "fireEffects",
    code: "2010/2050",
    title: "Fire Effects",
    purpose: "Assess and document physical fire effects before using them in origin analysis.",
    prompts: [
      "Fire patterns, smoke deposition, clean burn, oxidation, staining, deformation, melting, spalling, calcination, char depth, and mass loss.",
      "Fire effects on building systems including alarms, sprinklers, HVAC, utilities, and electrical components.",
      "Take measurements where useful, such as char depth, calcination depth, and fire-pattern dimensions.",
      "Document whether sampling or localized examination is needed.",
      "Avoid single-pattern conclusions; note possible ventilation, fuel, duration, or suppression explanations."
    ],
    expectedEvidence: ["Pattern photographs", "Measurements", "Sample notes", "Fire effects map", "Uncertainty notes"]
  },
  {
    id: "suppressionEffects",
    code: "2012/2080",
    title: "Suppression and Overhaul Effects",
    purpose: "Separate fire-caused damage from changes caused by firefighting, entry, ventilation, salvage, and overhaul.",
    prompts: [
      "Forced entry, broken windows, opened doors, roof holes, wall/ceiling penetrations, and utility disconnections.",
      "Offensive or defensive operations and whether fire was driven or ventilation changed.",
      "Items moved by crews, salvage operations, overhaul, wetting down, and debris relocation.",
      "Equipment brought into the scene and any resulting pattern disturbance.",
      "Fire suppression timeline and appliances/resources involved."
    ],
    expectedEvidence: ["Fireground action notes", "Crew statements", "Suppression timeline", "Disturbance photographs", "Utility isolation notes"]
  },
  {
    id: "physicalEvidence",
    code: "2056/2062",
    title: "Physical Evidence and Samples",
    purpose: "Track evidence that may need preservation, sampling, testing, or chain-of-custody control.",
    prompts: [
      "Potential ignition sources, appliances, conductors, fuel samples, debris samples, comparison samples, and failed components.",
      "Location found, condition, photograph reference, collector, packaging, storage, and transfer history.",
      "Whether evidence should be tested, preserved in place, removed, or compared with exemplar material.",
      "Avoid spoliation: document before alteration, removal, or destructive examination.",
      "Record laboratory/testing requests and pending results."
    ],
    expectedEvidence: ["Evidence log", "Photo references", "Packaging notes", "Chain of custody", "Testing requests"]
  },
  {
    id: "analysesAndReconstruction",
    code: "2014/2090-2096",
    title: "Analyses and Reconstruction",
    purpose: "Capture laboratory, modeling, reconstruction, and pre-fire condition data that feeds origin/cause testing.",
    prompts: [
      "Laboratory data: chemical, materials, metallurgical, electrical, mechanical, or ignitability results.",
      "Pre-fire conditions from interviews, photos, videos, electronic data, and reconstruction.",
      "Fire scene reconstruction, contents reconstruction, fire modeling, scale testing, or other hypothesis testing.",
      "Note assumptions, limits, and whether results support or contradict existing hypotheses.",
      "Identify additional data needed before relying on the analysis."
    ],
    expectedEvidence: ["Lab results", "Modeling notes", "Reconstruction sketches", "Assumptions", "Contradictions"]
  },
  {
    id: "causeSpecificData",
    code: "2018/2120",
    title: "Cause-Specific Data",
    purpose: "Collect data directly related to ignition source, first fuel, oxidant, and ignition sequence.",
    prompts: [
      "Human activity around the time and location of the fire.",
      "Potential ignition sources in the area of origin: electrical, smoking, heating, appliances, mechanical, open flame, lightning, chemicals, spontaneous/self-heating.",
      "Potential fuels: normal and atypical fuels, first fuel candidates, configuration, geometry, ignitability, and proximity.",
      "Oxidants and ventilation: air, oxygen-enriched atmosphere, chemical oxidants, concentration, amount, and proximity.",
      "Timeline analysis of how ignition source, fuel, and oxidant could have come together."
    ],
    expectedEvidence: ["Ignition source list", "First fuel list", "Oxidant/ventilation notes", "Human activity timeline", "Cause data gaps"]
  },
  {
    id: "outsideReportsResearch",
    code: "2020/2022/2130/2140",
    title: "Outside Reports and Research",
    purpose: "Collect non-scene data, outside reports, and technical research without treating them as direct scene observations.",
    prompts: [
      "Outside reports under review: observations, fire effects, suppression effects, witness statements, non-scene data, analyses, and cause-related data.",
      "Maps, blueprints, building permits, utility maps/status, weather, dispatch records, communication logs, injury/autopsy information, and public records.",
      "Research sources: literature, product manuals, manufacturer information, safety data sheets, recalls, standards, and peer-reviewed material.",
      "Document source, date, reliability, and whether the data supports or contradicts other information.",
      "Flag any required notifications or parties to put on notice based on cause-specific data."
    ],
    expectedEvidence: ["Outside report list", "Research notes", "Source reliability notes", "Contradictions", "Notification needs"]
  }
];

const sceneExaminationSteps = [
  {
    id: "externalExamination",
    code: "Scene - External",
    title: "External Examination",
    entryLabel: "Exterior sector / side",
    defaultEntryName: "Side A",
    repeatPrompt: "Add another exterior side or sector",
    purpose: "Work around the exterior before entering, documenting sides, openings, utilities, exposures, fire travel, suppression effects, and access points.",
    prompts: [
      "Label each side of the structure or scene consistently, such as Side A/B/C/D or north/east/south/west.",
      "Photograph overall views before close-ups.",
      "Document windows, doors, vents, roof, exterior wall damage, utilities, exposures, and suppression/entry effects.",
      "Note smoke/fire travel indicators and any exterior evidence or hazards.",
      "Do not infer interior origin from exterior damage alone."
    ],
    sequence: [
      "Establish exterior orientation and side labels.",
      "Take four-side overall photographs before close-ups.",
      "Document openings, utilities, exposures, access, forced entry, and ventilation changes.",
      "Record exterior fire/smoke travel indicators and suppression effects.",
      "Flag hazards or exterior evidence requiring protection before entry."
    ]
  },
  {
    id: "internalRoomByRoom",
    code: "Scene - Internal",
    title: "Internal Room by Room",
    entryLabel: "Room / interior area",
    defaultEntryName: "Room 1",
    repeatPrompt: "Add another room",
    purpose: "Move through the interior systematically, room by room, labelling each room/area and assigning photographs to that label.",
    prompts: [
      "Create a room/area label before taking photos, such as Kitchen, Bedroom 1, Office, Mezzanine Storage, or Sector 1.",
      "Take doorway/entry overview photos before close-up photos.",
      "Document contents, fuel load, ventilation, fire effects, smoke staining, suppression disturbance, utilities, and electrical items.",
      "Record what was moved, collapsed, consumed, missing, or protected.",
      "Keep each photo tied to the room/area and direction of view."
    ],
    sequence: [
      "Create a room or area label before starting that space.",
      "Photograph from the doorway or entry point before disturbing contents.",
      "Record contents, fuel packages, ventilation, fire effects, smoke staining, and utilities.",
      "Take close-up photographs of relevant damage, systems, evidence, and comparison areas.",
      "Note moved/collapsed/overhauled items and what follow-up is required before leaving the room."
    ]
  },
  {
    id: "sectorOfOrigin",
    code: "Origin - Sector",
    title: "Sector of Origin",
    entryLabel: "Origin sector hypothesis",
    defaultEntryName: "Sector 1",
    repeatPrompt: "Add another sector hypothesis",
    purpose: "Narrow the scene to the sector or broad region where the fire most likely originated, while preserving alternative sectors.",
    prompts: [
      "Identify the sector naming method used, such as business sector, floor, room group, quadrant, or building wing.",
      "List fire pattern, damage, witness, timeline, ventilation, and suppression data supporting this sector.",
      "List contradictory data and sectors not yet eliminated.",
      "Photograph sector boundaries, transition areas, and comparison areas.",
      "Do not treat sector of origin as point of origin."
    ],
    sequence: [
      "Define the broad sector naming method.",
      "Group supporting data by fire effects, timeline, witness/digital data, and physical evidence.",
      "Record sectors still possible and sectors eliminated with reasons.",
      "Photograph boundaries, transitions, and comparison sectors.",
      "Identify what data is needed before narrowing to area of origin."
    ]
  },
  {
    id: "areaOfOrigin",
    code: "Origin - Area",
    title: "Area of Origin",
    entryLabel: "Area of origin hypothesis",
    defaultEntryName: "Area 1",
    repeatPrompt: "Add another area hypothesis",
    purpose: "Define the area of origin using fire dynamics, pattern analysis, witness/digital data, physical evidence, and hypothesis testing.",
    prompts: [
      "Describe the area boundaries and why they are scientifically supported.",
      "Tie photos to specific patterns, fuels, ventilation features, contents, and electrical/building systems.",
      "Document supporting and contradictory evidence.",
      "Record uncertainty, radius of error, or need for further data.",
      "Preserve alternative area hypotheses until tested."
    ],
    sequence: [
      "Define the proposed area boundaries.",
      "Tie each boundary to observed fire effects, fuels, ventilation, witness/digital data, or physical evidence.",
      "List all competing area hypotheses before eliminating any.",
      "Test the area hypothesis against contradictions and fire dynamics.",
      "Record uncertainty, radius of error, and remaining work."
    ]
  },
  {
    id: "pointOfOrigin",
    code: "Origin - Point",
    title: "Point of Origin",
    entryLabel: "Point / specific area",
    defaultEntryName: "Point 1",
    repeatPrompt: "Add another point or specific area",
    purpose: "Document the exact or most specific physical location where ignition source, first fuel, and oxidant interacted, where the facts support that level of precision.",
    prompts: [
      "Record whether a true point of origin is supported or whether only an area of origin can be stated.",
      "Photograph close-ups with orientation and scale.",
      "Identify ignition source candidates, first fuel candidates, oxidant/ventilation, and ignition sequence.",
      "Document evidence removed, sampled, or requiring laboratory/electrical examination.",
      "If unsupported, keep point of origin as undetermined or requiring officer review."
    ],
    sequence: [
      "Decide whether the data supports a point, a smaller area, or no further narrowing.",
      "Photograph the point/area with orientation, scale, and surrounding context.",
      "Identify ignition source, first fuel, oxidant, and competent ignition sequence candidates.",
      "Record evidence collection, sampling, electrical examination, or laboratory needs.",
      "If the point is unsupported, document why it remains area-level or undetermined."
    ]
  }
];

const reportSections = [
  {
    id: "cover",
    title: "Cover / Title Information",
    guidance: "Report title, incident location, date of fire, date of investigation, investigation team, agency, and roles."
  },
  {
    id: "definitions",
    title: "Definitions",
    guidance:
      "Define technical terms used in the report, such as area of origin, point of origin, fire patterns, arc mapping, soot, spalling, smouldering, radius of error, and related fire/electrical terms."
  },
  {
    id: "overview",
    title: "Overview",
    guidance:
      "Summarize call receipt, incident background, occupancy/ownership, fire service operations, reason investigation was requested, investigation dates/team, and high-level findings."
  },
  {
    id: "generalInformation",
    title: "General Information",
    guidance:
      "Record date/time of fire, address, first officer or agency at scene, responding units where known, premises description, construction, occupants/businesses, fire protection systems, utilities, pre-arrival actions, and losses where supported."
  },
  {
    id: "investigation",
    title: "The Investigation",
    guidance:
      "Describe arrival, access, safety, mapping, scene documentation, external examination, internal room-by-room examination, non-scene data, interviews, and evidence handling."
  },
  {
    id: "originAnalysis",
    title: "Origin Analysis",
    guidance:
      "Explain sector of origin, area of origin, point of origin where supported, supporting/contradictory data, hypothesis testing, uncertainty, and limits."
  },
  {
    id: "causeAnalysis",
    title: "Ignition Source and Cause Analysis",
    guidance:
      "Identify and test ignition source, first material ignited, oxidant, ignition sequence, human activity or equipment involvement where supported, and cause classification only when supported."
  },
  {
    id: "samplesEvidence",
    title: "Samples / Evidence Taken",
    guidance:
      "List evidence, samples, location found, condition, photo references, collection method, packaging, storage, transfers, tests requested, and chain-of-custody gaps."
  },
  {
    id: "conclusion",
    title: "Conclusion",
    guidance:
      "State supported findings, limitations, unresolved items, and whether origin or cause remains undetermined. Do not state facts or conclusions not supported by the investigation record."
  },
  {
    id: "appendices",
    title: "Appendices",
    guidance:
      "Photographic illustrations, drawings/site plans, risk assessment, evidence collection and packaging records, related reports, witness statements, and other supporting documents."
  }
];

function createSceneEntry(step, index = 0) {
  const exteriorLabels = ["Side A", "Side B", "Side C", "Side D"];
  const label =
    step.id === "externalExamination"
      ? exteriorLabels[index] || `Exterior Sector ${index + 1}`
      : index === 0
        ? step.defaultEntryName
        : `${step.defaultEntryName.replace(/\d+$/, "").trim()} ${index + 1}`;

  return {
    id: globalThis.crypto?.randomUUID?.() || `${step.id}-${Date.now()}-${index}`,
    areaLabel: label,
    observationFocus: "",
    notes: "",
    gaps: "",
    photos: []
  };
}

function buildInitialSceneExamination() {
  return sceneExaminationSteps.reduce(
    (steps, step) => ({
      ...steps,
      [step.id]: {
        areaLabel: "",
        observationFocus: "",
        notes: "",
        gaps: "",
        photos: [],
        activeEntryId: `${step.id}-entry-1`,
        entries: [
          {
            ...createSceneEntry(step, 0),
            id: `${step.id}-entry-1`
          }
        ]
      }
    }),
    {}
  );
}

function buildInitialDataTracks() {
  return dataCollectionTracks.reduce(
    (tracks, track) => ({
      ...tracks,
      [track.id]: {
        notes: "",
        collectedFrom: "",
        gaps: "",
        photos: []
      }
    }),
    {}
  );
}

function buildInitialReportWriteup() {
  return reportSections.reduce(
    (sections, section) => ({
      ...sections,
      [section.id]: ""
    }),
    {}
  );
}

function buildInitialOperationSteps(stage) {
  return (stage.operations || []).reduce(
    (steps, operation) => ({
      ...steps,
      [operation.id]: {
        status: "Not Started",
        notes: "",
        records: "",
        gaps: "",
        intakeFiles: []
      }
    }),
    {}
  );
}

const initialInvestigation = investigationStages.reduce(
  (state, stage) => ({
    ...state,
    [stage.id]: {
      status: "Not Started",
      notes: "",
      missingInfo: "",
      evidence: "",
      hypotheses: "",
      operationSteps: buildInitialOperationSteps(stage),
      reportWriteup: stage.id === "reportingReview" ? buildInitialReportWriteup() : {},
      sceneExamination: stage.id === "dataCollection" ? buildInitialSceneExamination() : {},
      dataTracks: stage.id === "dataCollection" ? buildInitialDataTracks() : {}
    }
  }),
  {}
);

function calculateProgress(investigation) {
  const complete = investigationStages.filter((stage) => investigation[stage.id]?.status === "Complete").length;
  return Math.round((complete / investigationStages.length) * 100);
}

function buildOpenItems(investigation) {
  return investigationStages.flatMap((stage) => {
    const data = investigation[stage.id] || {};
    const items = [];

    if (data.status !== "Complete") {
      items.push(`${stage.code} ${stage.title}: ${data.status || "Not Started"}.`);
    }

    if (!String(data.notes || "").trim()) {
      items.push(`${stage.code} ${stage.title}: add notes or reason not applicable.`);
    }

    if (String(data.missingInfo || "").trim()) {
      items.push(`${stage.code} ${stage.title}: missing info - ${data.missingInfo.trim()}`);
    }

    const incompleteOperations = (stage.operations || []).filter(
      (operation) => data.operationSteps?.[operation.id]?.status !== "Complete"
    );

    if (incompleteOperations.length) {
      items.push(
        `${stage.code} ${stage.title}: operation steps still open - ${incompleteOperations
          .map((operation) => operation.title)
          .join(", ")}.`
      );
    }

    return items;
  });
}

function buildInvestigationSummary(investigation) {
  return investigationStages
    .map((stage) => {
      const data = investigation[stage.id] || {};
      const baseSummary = [
        `${stage.code} ${stage.title}`,
        `Status: ${data.status || "Not Started"}`,
        `Notes: ${data.notes?.trim() || "[No notes entered]"}`,
        `Evidence/Data: ${data.evidence?.trim() || "[No evidence/data notes entered]"}`,
        `Hypotheses/Analysis: ${data.hypotheses?.trim() || "[No hypothesis notes entered]"}`,
        `Missing Information: ${data.missingInfo?.trim() || "[None entered]"}`
      ].join("\n");

      const operationSummary = (stage.operations || [])
        .map((operation) => {
          const operationData = data.operationSteps?.[operation.id] || {};
          return [
            `${operation.title}`,
            `Status: ${operationData.status || "Not Started"}`,
            `Records: ${operationData.records?.trim() || "[Not recorded]"}`,
            `Notes: ${operationData.notes?.trim() || "[No notes entered]"}`,
            `Intake Files: ${operationData.intakeFiles?.length || 0}`,
            `Gaps: ${operationData.gaps?.trim() || "[None entered]"}`
          ].join("\n");
        })
        .join("\n\n");

      const stageSummary = operationSummary ? `${baseSummary}\n\nOperational Sequence\n${operationSummary}` : baseSummary;

      if (stage.id !== "dataCollection") {
        if (stage.id !== "reportingReview") {
          return stageSummary;
        }

        const reportSummary = reportSections
          .map((section) => `${section.title}\n${data.reportWriteup?.[section.id]?.trim() || "[Not drafted]"}`)
          .join("\n\n");

        return `${stageSummary}\n\nInvestigation Report Write-up\n${reportSummary}`;
      }

      const trackSummary = dataCollectionTracks
        .map((track) => {
          const trackData = data.dataTracks?.[track.id] || {};
          return [
            `${track.code} ${track.title}`,
            `Collected From: ${trackData.collectedFrom?.trim() || "[Not recorded]"}`,
            `Notes: ${trackData.notes?.trim() || "[No notes entered]"}`,
            `Photos: ${trackData.photos?.length || 0}`,
            `Gaps: ${trackData.gaps?.trim() || "[None entered]"}`
          ].join("\n");
        })
        .join("\n\n");

      const sceneSummary = sceneExaminationSteps
        .map((step) => {
          const stepData = data.sceneExamination?.[step.id] || {};
          const entries = stepData.entries?.length
            ? stepData.entries
            : [
                {
                  areaLabel: stepData.areaLabel,
                  observationFocus: stepData.observationFocus,
                  notes: stepData.notes,
                  gaps: stepData.gaps,
                  photos: stepData.photos || []
                }
              ];
          const entrySummary = entries
            .map((entry, index) =>
              [
                `Entry ${index + 1}: ${entry.areaLabel?.trim() || "[Not labelled]"}`,
                `Observation Focus: ${entry.observationFocus?.trim() || "[Not recorded]"}`,
                `Notes: ${entry.notes?.trim() || "[No notes entered]"}`,
                `Photos: ${entry.photos?.length || 0}`,
                `Gaps: ${entry.gaps?.trim() || "[None entered]"}`
              ].join("\n")
            )
            .join("\n\n");
          return [
            `${step.code} ${step.title}`,
            entrySummary
          ].join("\n");
        })
        .join("\n\n");

      return `${stageSummary}\n\nScene Examination Sequence\n${sceneSummary}\n\nData Collection Tracks\n${trackSummary}`;
    })
    .join("\n\n");
}

function buildReportDraft(investigation) {
  const sectionText = {
    cover: [
      "FIRE INVESTIGATION REPORT",
      "",
      "Incident location: [Enter incident location]",
      "Date of fire: [Enter date of fire]",
      "Date(s) of investigation: [Enter investigation date(s)]",
      "Investigator(s): [Enter investigation team and roles]",
      "",
      "This draft must be reviewed by the investigator. Missing or unsupported information is intentionally left bracketed."
    ].join("\n"),
    definitions:
      "Define only the technical terms used in this report. Consider definitions for area of origin, point of origin, fire patterns, arc mapping, soot, spalling, smouldering, first material ignited, ignition source, oxidant, and radius of error where relevant.",
    overview: [
      investigation.preScene?.notes || "[Pre-scene assignment and initial information not entered]",
      investigation.sceneAccess?.notes ? `Scene access: ${investigation.sceneAccess.notes}` : "Scene access: [Not entered]",
      investigation.witnessInfo?.notes ? `Witness/source overview: ${investigation.witnessInfo.notes}` : "Witness/source overview: [Not entered]"
    ].join("\n\n"),
    generalInformation: [
      investigation.preScene?.evidence || "[Administrative, location, property, and initial incident details not entered]",
      investigation.dataCollection?.dataTracks?.generalObservations?.notes
        ? `General observations: ${investigation.dataCollection.dataTracks.generalObservations.notes}`
        : "General observations: [Not entered]",
      investigation.dataCollection?.dataTracks?.suppressionEffects?.notes
        ? `Suppression and overhaul effects: ${investigation.dataCollection.dataTracks.suppressionEffects.notes}`
        : "Suppression and overhaul effects: [Not entered]"
    ].join("\n\n"),
    investigation: [
      investigation.dataCollection?.notes || "[Data collection narrative not entered]",
      "Scene examination:",
      ...sceneExaminationSteps.map((step) => {
        const stepData = investigation.dataCollection?.sceneExamination?.[step.id] || {};
        const entries = stepData.entries?.length ? stepData.entries : [stepData];
        const entryText = entries
          .map(
            (entry) =>
              `${entry.areaLabel?.trim() || "[Unlabelled]"}: ${entry.notes?.trim() || "[Not entered]"} Photos: ${
                entry.photos?.length || 0
              }. Gaps: ${entry.gaps?.trim() || "[None entered]"}`
          )
          .join("\n");
        return `${step.title}:\n${entryText}`;
      }),
      investigation.dataCollection?.dataTracks?.physicalEvidence?.notes
        ? `Evidence/samples: ${investigation.dataCollection.dataTracks.physicalEvidence.notes}`
        : "Evidence/samples: [Not entered]"
    ].join("\n\n"),
    originAnalysis: [
      investigation.originDetermination?.notes || "[Origin analysis notes not entered]",
      investigation.originDetermination?.hypotheses
        ? `Origin hypotheses/testing: ${investigation.originDetermination.hypotheses}`
        : "Origin hypotheses/testing: [Not entered]",
      investigation.originDetermination?.missingInfo
        ? `Origin limitations/missing data: ${investigation.originDetermination.missingInfo}`
        : "Origin limitations/missing data: [None entered]"
    ].join("\n\n"),
    causeAnalysis: [
      investigation.causeDetermination?.notes || "[Cause analysis notes not entered]",
      investigation.causeDetermination?.hypotheses
        ? `Cause hypotheses/testing: ${investigation.causeDetermination.hypotheses}`
        : "Cause hypotheses/testing: [Not entered]",
      investigation.dataCollection?.dataTracks?.causeSpecificData?.notes
        ? `Cause-specific data: ${investigation.dataCollection.dataTracks.causeSpecificData.notes}`
        : "Cause-specific data: [Not entered]",
      "Cause classification must be one of Natural, Accidental, Incendiary, or Undetermined, and only when supported or confirmed."
    ].join("\n\n"),
    samplesEvidence: [
      investigation.dataCollection?.dataTracks?.physicalEvidence?.notes || "[Evidence and samples not entered]",
      investigation.dataCollection?.dataTracks?.physicalEvidence?.gaps
        ? `Evidence gaps: ${investigation.dataCollection.dataTracks.physicalEvidence.gaps}`
        : "Evidence gaps: [None entered]"
    ].join("\n\n"),
    conclusion: [
      investigation.originDetermination?.hypotheses || "[Supported origin conclusion or uncertainty not entered]",
      investigation.causeDetermination?.hypotheses || "[Supported cause conclusion or uncertainty not entered]",
      investigation.reportingReview?.missingInfo
        ? `Limitations/open items: ${investigation.reportingReview.missingInfo}`
        : "Limitations/open items: [None entered]"
    ].join("\n\n"),
    appendices:
      "List photographic illustrations, drawings/site plans, pre-investigation risk assessment, evidence collection and packaging records, related reports, witness statements, and other supporting documents. Add only appendices that exist in the case record."
  };

  return reportSections.reduce(
    (draft, section) => ({
      ...draft,
      [section.id]: sectionText[section.id] || ""
    }),
    {}
  );
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Photo could not be read."));
    reader.readAsDataURL(file);
  });
}

function PhotoAnalysisList({ photos }) {
  if (!photos?.length) {
    return null;
  }

  return (
    <div className="photo-analysis-list">
      {photos.map((photo) => (
        <div className="photo-analysis-item" key={photo.id}>
          <div>
            <strong>{photo.label ? `${photo.label} - ${photo.fileName}` : photo.fileName}</strong>
            <span>{new Date(photo.capturedAt).toLocaleString()}</span>
          </div>
          <p>{photo.analysis?.summary || "No summary returned."}</p>
          {photo.analysis?.visibleFeatures?.length ? (
            <ul>
              {photo.analysis.visibleFeatures.slice(0, 5).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
          {photo.analysis?.customerClues?.length ? (
            <>
              <h4>Investigation Clues</h4>
              <ul>
                {photo.analysis.customerClues.slice(0, 5).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </>
          ) : null}
          {photo.analysis?.concerns?.length ? (
            <>
              <h4>Concerns</h4>
              <ul>
                {photo.analysis.concerns.slice(0, 5).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function SceneExaminationPanel({
  activeStepId,
  sceneExamination,
  setActiveStepId,
  onStepChange,
  onAddSceneEntry,
  onSetActiveSceneEntry,
  onPhotoAnalyze,
  photoLoadingTarget
}) {
  const activeStep = sceneExaminationSteps.find((step) => step.id === activeStepId) || sceneExaminationSteps[0];
  const activeData = sceneExamination?.[activeStep.id] || {
    areaLabel: "",
    observationFocus: "",
    notes: "",
    gaps: "",
    photos: [],
    activeEntryId: "",
    entries: []
  };
  const entries = activeData.entries?.length ? activeData.entries : [activeData];
  const activeEntry = entries.find((entry) => entry.id === activeData.activeEntryId) || entries[0];

  return (
    <section className="data-collection-panel" aria-label="Scene examination sequence">
      <div className="subsection-title">
        <h3>Scene Examination Sequence</h3>
        <p>Follow the scene from outside to inside, then narrow from sector to area and point of origin.</p>
      </div>

      <div className="process-tabs scene-step-tabs" role="tablist" aria-label="Scene examination steps">
        {sceneExaminationSteps.map((step) => (
          <button
            key={step.id}
            type="button"
            className={activeStep.id === step.id ? "active" : ""}
            onClick={() => setActiveStepId(step.id)}
          >
            <span>{step.code}</span>
            {step.title}
          </button>
        ))}
      </div>

      <div className="data-track-detail">
        <div>
          <p className="eyebrow">{activeStep.code}</p>
          <h3>{activeStep.title}</h3>
          <p>{activeStep.purpose}</p>
        </div>
        <div>
          <h4>Guided Observations</h4>
          <ul>
            {activeStep.prompts.map((prompt) => (
              <li key={prompt}>{prompt}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4>Operational Sequence</h4>
          <ol className="sequence-list">
            {activeStep.sequence.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </div>
        <div className="scene-entry-manager">
          <div className="subsection-title">
            <h3>{activeStep.entryLabel} Entries</h3>
            <p>Label one area, add its notes/photos, then repeat for the next side, sector, room, area, or point.</p>
          </div>
          <div className="scene-entry-tabs" role="tablist" aria-label={`${activeStep.title} repeated entries`}>
            {entries.map((entry, index) => (
              <button
                key={entry.id}
                type="button"
                className={entry.id === activeEntry.id ? "active" : ""}
                onClick={() => onSetActiveSceneEntry(activeStep.id, entry.id)}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                {entry.areaLabel?.trim() || `${activeStep.entryLabel} ${index + 1}`}
              </button>
            ))}
          </div>
          <button type="button" className="secondary-action" onClick={() => onAddSceneEntry(activeStep.id)}>
            {activeStep.repeatPrompt}
          </button>
        </div>
        <div className="form-grid">
          <label>
            <span>
              {activeStep.entryLabel} label <em>Photo assignment</em>
            </span>
            <input
              value={activeEntry.areaLabel}
              onChange={(event) => onStepChange(activeStep.id, activeEntry.id, "areaLabel", event.target.value)}
              placeholder="e.g. Side A, Kitchen, Bedroom 1, Sector 1, Mezzanine Storage"
            />
          </label>
          <label>
            <span>
              Observation focus <em>What this step records</em>
            </span>
            <input
              value={activeEntry.observationFocus}
              onChange={(event) => onStepChange(activeStep.id, activeEntry.id, "observationFocus", event.target.value)}
              placeholder="e.g. ventilation, char depth, electrical conductors, fire spread"
            />
          </label>
          <label className="wide">
            <span>
              Step notes <em>Room-by-room facts</em>
            </span>
            <textarea
              value={activeEntry.notes}
              onChange={(event) => onStepChange(activeStep.id, activeEntry.id, "notes", event.target.value)}
              rows={4}
              placeholder="Record observations for this labelled room/area or origin step. Separate facts from interpretation."
            />
          </label>
          <label className="wide">
            <span>
              Missing / follow-up <em>Do not guess</em>
            </span>
            <textarea
              value={activeEntry.gaps}
              onChange={(event) => onStepChange(activeStep.id, activeEntry.id, "gaps", event.target.value)}
              rows={2}
              placeholder="Record photos, measurements, interviews, samples, or tests still required for this step."
            />
          </label>
        </div>

        <div className="photo-capture-panel">
          <div>
            <h4>Photos for {activeEntry.areaLabel?.trim() || activeStep.title}</h4>
            <p>
              Take overview and close-up photos for this step. Each photo will be attached to this room/area or
              origin step label.
            </p>
          </div>
          <label className="photo-input-label">
            <span>
              Add step photo <em>Camera or upload</em>
            </span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(event) => onPhotoAnalyze(activeStep.id, activeEntry.id, event)}
              disabled={photoLoadingTarget === `scene:${activeStep.id}:${activeEntry.id}`}
            />
          </label>
          {photoLoadingTarget === `scene:${activeStep.id}:${activeEntry.id}` ? (
            <p className="export-status">Analyzing photo for this scene examination step...</p>
          ) : null}
          <PhotoAnalysisList photos={activeEntry.photos} />
        </div>
      </div>
    </section>
  );
}

function DataCollectionTrackPanel({
  activeTrackId,
  dataTracks,
  onTrackChange,
  setActiveTrackId,
  onPhotoAnalyze,
  photoLoadingTrack
}) {
  const activeTrack = dataCollectionTracks.find((track) => track.id === activeTrackId) || dataCollectionTracks[0];
  const activeData = dataTracks?.[activeTrack.id] || { notes: "", collectedFrom: "", gaps: "", photos: [] };

  return (
    <section className="data-collection-panel" aria-label="Data collection process map categories">
      <div className="subsection-title">
        <h3>2000 Data Collection Source Tabs</h3>
        <p>Use these tabs to collect each category of scene and non-scene data before origin and cause analysis.</p>
      </div>

      <div className="process-tabs data-track-tabs" role="tablist" aria-label="Data collection source categories">
        {dataCollectionTracks.map((track) => (
          <button
            key={track.id}
            type="button"
            className={activeTrack.id === track.id ? "active" : ""}
            onClick={() => setActiveTrackId(track.id)}
          >
            <span>{track.code}</span>
            {track.title}
          </button>
        ))}
      </div>

      <div className="data-track-detail">
        <div>
          <p className="eyebrow">{activeTrack.code}</p>
          <h3>{activeTrack.title}</h3>
          <p>{activeTrack.purpose}</p>
        </div>
        <div className="stage-columns">
          <div>
            <h4>Collect / Check</h4>
            <ul>
              {activeTrack.prompts.map((prompt) => (
                <li key={prompt}>{prompt}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Evidence to Capture</h4>
            <ul>
              {activeTrack.expectedEvidence.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="form-grid">
          <label>
            <span>
              Collected from <em>Source</em>
            </span>
            <textarea
              value={activeData.collectedFrom}
              onChange={(event) => onTrackChange(activeTrack.id, "collectedFrom", event.target.value)}
              rows={2}
              placeholder="Scene area, witness, device, document, lab, agency, or record source."
            />
          </label>
          <label>
            <span>
              Gaps / follow-up <em>Required</em>
            </span>
            <textarea
              value={activeData.gaps}
              onChange={(event) => onTrackChange(activeTrack.id, "gaps", event.target.value)}
              rows={2}
              placeholder="What still needs to be collected, confirmed, tested, or reviewed?"
            />
          </label>
          <label className="wide">
            <span>
              Notes <em>Facts, not assumptions</em>
            </span>
            <textarea
              value={activeData.notes}
              onChange={(event) => onTrackChange(activeTrack.id, "notes", event.target.value)}
              rows={4}
              placeholder="Record the actual collected data, source reliability, contradictions, and limits."
            />
          </label>
        </div>
        <div className="photo-capture-panel">
          <div>
            <h4>Photo Capture and Analysis</h4>
            <p>
              On a phone, use this control to take a scene photo for this exact data category. The analysis is
              decision-support only and must be reviewed by the investigator.
            </p>
          </div>
          <label className="photo-input-label">
            <span>
              Add photo <em>Camera or upload</em>
            </span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(event) => onPhotoAnalyze(activeTrack.id, event)}
              disabled={photoLoadingTrack === activeTrack.id}
            />
          </label>
          {photoLoadingTrack === activeTrack.id ? <p className="export-status">Analyzing photo for this data category...</p> : null}
          <PhotoAnalysisList photos={activeData.photos} />
        </div>
      </div>
    </section>
  );
}

function OperationalStepsPanel({
  stage,
  activeOperationId,
  setActiveOperationId,
  operationSteps,
  onOperationChange,
  onOperationFileImport,
  intakeLoadingTarget
}) {
  const operations = stage.operations || [];

  if (!operations.length) {
    return null;
  }

  const activeOperation = operations.find((operation) => operation.id === activeOperationId) || operations[0];
  const activeData = operationSteps?.[activeOperation.id] || {
    status: "Not Started",
    notes: "",
    records: "",
    gaps: "",
    intakeFiles: []
  };

  return (
    <section className="operation-panel" aria-label={`${stage.title} operational steps`}>
      <div className="subsection-title">
        <h3>Operational Sequence</h3>
        <p>Work these steps in order. Record facts, source-linked records, and unresolved gaps before moving on.</p>
      </div>

      <div className="process-tabs operation-tabs" role="tablist" aria-label={`${stage.title} step sequence`}>
        {operations.map((operation, index) => (
          <button
            key={operation.id}
            type="button"
            className={activeOperation.id === operation.id ? "active" : ""}
            onClick={() => setActiveOperationId(stage.id, operation.id)}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            {operation.title}
          </button>
        ))}
      </div>

      <div className="operation-detail">
        <div className="operation-guidance">
          <div>
            <h4>Action</h4>
            <p>{activeOperation.action}</p>
          </div>
          <div>
            <h4>Collect / Confirm</h4>
            <ul>
              {activeOperation.collect.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Complete When</h4>
            <p>{activeOperation.completeWhen}</p>
          </div>
        </div>

        <div className="form-grid">
          <label>
            <span>
              Step status <em>Operational</em>
            </span>
            <select
              value={activeData.status}
              onChange={(event) => onOperationChange(stage.id, activeOperation.id, "status", event.target.value)}
            >
              {investigationStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>
              Records collected <em>Source-linked</em>
            </span>
            <textarea
              value={activeData.records}
              onChange={(event) => onOperationChange(stage.id, activeOperation.id, "records", event.target.value)}
              rows={2}
              placeholder="Photos, witness/source, document, device, measurement, sample, log, or record reference."
            />
          </label>
          <label className="wide">
            <span>
              Step notes <em>Facts and decisions</em>
            </span>
            <textarea
              value={activeData.notes}
              onChange={(event) => onOperationChange(stage.id, activeOperation.id, "notes", event.target.value)}
              rows={3}
              placeholder="Record what was done, observed, collected, tested, eliminated, or deferred."
            />
          </label>
          <label className="wide">
            <span>
              Gaps / next action <em>Before completion</em>
            </span>
            <textarea
              value={activeData.gaps}
              onChange={(event) => onOperationChange(stage.id, activeOperation.id, "gaps", event.target.value)}
              rows={2}
              placeholder="Unknowns, unconfirmed information, contradictions, safety concerns, or follow-up tasks."
            />
          </label>
        </div>

        <div className="intake-upload-panel">
          <div>
            <h4>Upload Intake Source</h4>
            <p>
              Add PDF, Word, text, or image source material for this operation. Extracted information is appended for
              officer review and should not be treated as confirmed until checked.
            </p>
          </div>
          <label className="photo-input-label">
            <span>
              Intake file <em>PDF, Word, text, image</em>
            </span>
            <input
              type="file"
              accept=".txt,.md,.csv,.json,.rtf,.pdf,.docx,image/*"
              onChange={(event) => onOperationFileImport(stage.id, activeOperation.id, event)}
              disabled={intakeLoadingTarget === `${stage.id}:${activeOperation.id}`}
            />
          </label>
          {intakeLoadingTarget === `${stage.id}:${activeOperation.id}` ? (
            <p className="export-status">Extracting source information for this operation...</p>
          ) : null}
          {activeData.intakeFiles?.length ? (
            <div className="intake-file-list">
              {activeData.intakeFiles.map((item) => (
                <div key={item.id}>
                  <strong>{item.fileName}</strong>
                  <span>{item.summary || "Source extracted for officer review."}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function ReportWriteupPanel({ reportWriteup, onReportChange, onBuildDraft }) {
  return (
    <section className="report-writeup-panel" aria-label="Investigation report write-up">
      <div className="subsection-title">
        <h3>Investigation Report Write-up</h3>
        <p>
          Use the Grenada report example as the structure guide. Draft only from collected data, tested analysis,
          and clearly marked unresolved gaps.
        </p>
      </div>

      <div className="report-template-note">
        <strong>Report order:</strong> Cover, definitions, overview, general information, investigation, scene
        examination, origin, ignition source/cause, samples, conclusion, appendices.
      </div>

      <button type="button" className="secondary-action" onClick={onBuildDraft}>
        Build Draft from Investigation Notes
      </button>

      <div className="report-section-list">
        {reportSections.map((section) => (
          <label key={section.id} className="wide report-section-editor">
            <span>
              {section.title} <em>Grenada report guide</em>
            </span>
            <small>{section.guidance}</small>
            <textarea
              value={reportWriteup?.[section.id] || ""}
              onChange={(event) => onReportChange(section.id, event.target.value)}
              rows={section.id === "investigation" || section.id === "originAnalysis" || section.id === "causeAnalysis" ? 8 : 5}
              placeholder="Draft this section from investigation facts. Leave missing items bracketed or flagged."
            />
          </label>
        ))}
      </div>
    </section>
  );
}

function StageCard({
  stage,
  data,
  onChange,
  activeOperationId,
  setActiveOperationId,
  onOperationChange,
  onOperationFileImport,
  intakeLoadingTarget,
  onReportChange,
  onBuildReportDraft,
  activeDataTrackId,
  setActiveDataTrackId,
  onDataTrackChange,
  activeSceneStepId,
  setActiveSceneStepId,
  onSceneStepChange,
  onAddSceneEntry,
  onSetActiveSceneEntry,
  onScenePhotoAnalyze,
  onPhotoAnalyze,
  photoLoadingTarget
}) {
  return (
    <section className="investigation-stage">
      <div className="stage-header">
        <div>
          <p className="eyebrow">{stage.code}</p>
          <h3>{stage.title}</h3>
        </div>
        <label>
          <span>
            Status <em>Stage</em>
          </span>
          <select value={data.status} onChange={(event) => onChange(stage.id, "status", event.target.value)}>
            {investigationStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p>{stage.mission}</p>

      <OperationalStepsPanel
        stage={stage}
        activeOperationId={activeOperationId}
        setActiveOperationId={setActiveOperationId}
        operationSteps={data.operationSteps}
        onOperationChange={onOperationChange}
        onOperationFileImport={onOperationFileImport}
        intakeLoadingTarget={intakeLoadingTarget}
      />

      <details className="stage-guidance">
        <summary>Stage guidance</summary>
        <div className="stage-columns">
          <div>
            <h4>Checklist</h4>
            <ul>
              {stage.checkpoints.map((checkpoint) => (
                <li key={checkpoint}>{checkpoint}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Expected Outputs</h4>
            <ul>
              {stage.outputs.map((output) => (
                <li key={output}>{output}</li>
              ))}
            </ul>
          </div>
        </div>
      </details>

      <div className="form-grid">
        <label className="wide">
          <span>
            Investigation notes <em>Facts and decisions</em>
          </span>
          <textarea
            value={data.notes}
            onChange={(event) => onChange(stage.id, "notes", event.target.value)}
            rows={4}
            placeholder="Record facts collected, decisions made, source details, or reason this stage is not applicable."
          />
        </label>
        <label>
          <span>
            Evidence / data <em>Source-linked</em>
          </span>
          <textarea
            value={data.evidence}
            onChange={(event) => onChange(stage.id, "evidence", event.target.value)}
            rows={3}
            placeholder="Photos, samples, witness data, lab data, CCTV, plans, measurements, or records."
          />
        </label>
        <label>
          <span>
            Hypotheses / analysis <em>Tested, not assumed</em>
          </span>
          <textarea
            value={data.hypotheses}
            onChange={(event) => onChange(stage.id, "hypotheses", event.target.value)}
            rows={3}
            placeholder="Supporting facts, contradictory facts, confidence level, and testing needed."
          />
        </label>
        <label className="wide">
          <span>
            Missing information <em>Do not guess</em>
          </span>
          <textarea
            value={data.missingInfo}
            onChange={(event) => onChange(stage.id, "missingInfo", event.target.value)}
            rows={2}
            placeholder="List unknown, unconfirmed, contradictory, or officer-review-required information."
          />
        </label>
      </div>

      {stage.id === "dataCollection" ? (
        <>
          <SceneExaminationPanel
            activeStepId={activeSceneStepId}
            sceneExamination={data.sceneExamination}
            setActiveStepId={setActiveSceneStepId}
            onStepChange={onSceneStepChange}
            onAddSceneEntry={onAddSceneEntry}
            onSetActiveSceneEntry={onSetActiveSceneEntry}
            onPhotoAnalyze={onScenePhotoAnalyze}
            photoLoadingTarget={photoLoadingTarget}
          />
          <DataCollectionTrackPanel
            activeTrackId={activeDataTrackId}
            dataTracks={data.dataTracks}
            onTrackChange={onDataTrackChange}
            setActiveTrackId={setActiveDataTrackId}
            onPhotoAnalyze={onPhotoAnalyze}
            photoLoadingTrack={photoLoadingTarget?.startsWith("data:") ? photoLoadingTarget.replace("data:", "") : ""}
          />
        </>
      ) : null}

      {stage.id === "reportingReview" ? (
        <ReportWriteupPanel
          reportWriteup={data.reportWriteup}
          onReportChange={onReportChange}
          onBuildDraft={onBuildReportDraft}
        />
      ) : null}
    </section>
  );
}

function formatAssistantError(error) {
  const message = String(error?.message || error || "Fire Investigation AI Agent request failed.");
  if (/failed to fetch|networkerror|load failed/i.test(message)) {
    return "The server-side Fire Investigation AI Agent route could not be reached. Confirm the app server is running, then try again.";
  }
  return message;
}

function readAuthStore() {
  try {
    return JSON.parse(localStorage.getItem(authStorageKey) || '{"users":{}}');
  } catch {
    return { users: {} };
  }
}

function writeAuthStore(store) {
  localStorage.setItem(authStorageKey, JSON.stringify(store));
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function generateVerificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function hashPassword(password) {
  const source = `ttfs-fire-investigation:${password}`;
  if (globalThis.crypto?.subtle) {
    const data = new TextEncoder().encode(source);
    const digest = await globalThis.crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }
  return btoa(source);
}

function AuthGate({ onAuthenticated }) {
  const [mode, setMode] = useState("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingCode, setPendingCode] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function registerUser(event) {
    event.preventDefault();
    const cleanName = name.trim();
    const cleanEmail = normalizeEmail(email);

    if (!cleanName || !cleanEmail || password.length < 8) {
      setStatus("Enter your name, a valid email, and a password with at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const store = readAuthStore();
      const code = generateVerificationCode();
      store.users[cleanEmail] = {
        name: cleanName,
        email: cleanEmail,
        passwordHash: await hashPassword(password),
        verified: false,
        verificationCode: code,
        createdAt: new Date().toISOString()
      };
      writeAuthStore(store);
      setPendingCode(code);
      setPendingEmail(cleanEmail);
      setMode("verify");
      setStatus("Verification required before sign in.");
    } finally {
      setLoading(false);
    }
  }

  function verifyUser(event) {
    event.preventDefault();
    const cleanEmail = normalizeEmail(pendingEmail || email);
    const store = readAuthStore();
    const user = store.users[cleanEmail];

    if (!user || user.verificationCode !== verificationCode.trim()) {
      setStatus("Verification code is incorrect.");
      return;
    }

    store.users[cleanEmail] = {
      ...user,
      verified: true,
      verificationCode: ""
    };
    writeAuthStore(store);
    setEmail(cleanEmail);
    setPassword("");
    setVerificationCode("");
    setMode("signin");
    setStatus("Email verified. You can now sign in.");
  }

  async function signInUser(event) {
    event.preventDefault();
    const cleanEmail = normalizeEmail(email);
    const store = readAuthStore();
    const user = store.users[cleanEmail];

    if (!user) {
      setStatus("No registered account was found for that email.");
      return;
    }

    if (!user.verified) {
      setPendingEmail(cleanEmail);
      setPendingCode(user.verificationCode || "");
      setMode("verify");
      setStatus("Verify your email before signing in.");
      return;
    }

    setLoading(true);
    try {
      const passwordHash = await hashPassword(password);
      if (passwordHash !== user.passwordHash) {
        setStatus("Password is incorrect.");
        return;
      }

      const session = {
        name: user.name,
        email: user.email,
        signedInAt: new Date().toISOString()
      };
      localStorage.setItem(authSessionKey, JSON.stringify(session));
      onAuthenticated(session);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="auth-brand">
          <p className="eyebrow">Secure Access</p>
          <h1>Fire Investigation</h1>
          <p>Register, verify your email, then sign in to access the investigation workspace.</p>
        </div>

        <div className="auth-panel">
          <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
            <button type="button" className={mode === "signin" ? "active" : ""} onClick={() => setMode("signin")}>
              Sign In
            </button>
            <button type="button" className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>
              Register
            </button>
          </div>

          {mode === "register" ? (
            <form className="auth-form" onSubmit={registerUser}>
              <label>
                <span>Name</span>
                <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" />
              </label>
              <label>
                <span>Email</span>
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
              </label>
              <label>
                <span>Password <em>8 characters minimum</em></span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                />
              </label>
              <button type="submit" disabled={loading}>
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </form>
          ) : null}

          {mode === "verify" ? (
            <form className="auth-form" onSubmit={verifyUser}>
              <label>
                <span>Email</span>
                <input type="email" value={pendingEmail || email} onChange={(event) => setPendingEmail(event.target.value)} />
              </label>
              <label>
                <span>Verification Code</span>
                <input
                  inputMode="numeric"
                  value={verificationCode}
                  onChange={(event) => setVerificationCode(event.target.value)}
                  placeholder="Enter 6-digit code"
                />
              </label>
              {pendingCode ? <p className="auth-code">Development verification code: {pendingCode}</p> : null}
              <button type="submit">Verify Email</button>
            </form>
          ) : null}

          {mode === "signin" ? (
            <form className="auth-form" onSubmit={signInUser}>
              <label>
                <span>Email</span>
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
              </label>
              <label>
                <span>Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                />
              </label>
              <button type="submit" disabled={loading}>
                {loading ? "Signing In..." : "Sign In"}
              </button>
            </form>
          ) : null}

          {status ? <p className="auth-status">{status}</p> : null}
        </div>
      </section>
    </main>
  );
}

export default function Home() {
  const [authSession, setAuthSession] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [investigation, setInvestigation] = useState(initialInvestigation);
  const [activeStageId, setActiveStageId] = useState("preScene");
  const [activeOperationByStage, setActiveOperationByStage] = useState(() =>
    investigationStages.reduce(
      (active, stage) => ({
        ...active,
        [stage.id]: stage.operations?.[0]?.id || ""
      }),
      {}
    )
  );
  const [activeDataTrackId, setActiveDataTrackId] = useState(dataCollectionTracks[0].id);
  const [activeSceneStepId, setActiveSceneStepId] = useState(sceneExaminationSteps[0].id);
  const [agentQuestion, setAgentQuestion] = useState("");
  const [agentStageFocus, setAgentStageFocus] = useState("");
  const [agentResult, setAgentResult] = useState(null);
  const [agentStatus, setAgentStatus] = useState("");
  const [agentLoading, setAgentLoading] = useState(false);
  const [aiActionLoading, setAiActionLoading] = useState("");
  const [photoLoadingTarget, setPhotoLoadingTarget] = useState("");
  const [intakeLoadingTarget, setIntakeLoadingTarget] = useState("");

  const progress = useMemo(() => calculateProgress(investigation), [investigation]);
  const openItems = useMemo(() => buildOpenItems(investigation), [investigation]);
  const summary = useMemo(() => buildInvestigationSummary(investigation), [investigation]);
  const activeStage = investigationStages.find((stage) => stage.id === activeStageId) || investigationStages[0];

  useEffect(() => {
    try {
      const savedSession = JSON.parse(localStorage.getItem(authSessionKey) || "null");
      setAuthSession(savedSession);
    } catch {
      setAuthSession(null);
    } finally {
      setAuthChecked(true);
    }
  }, []);

  function signOut() {
    localStorage.removeItem(authSessionKey);
    setAuthSession(null);
  }

  function updateStage(stageId, key, value) {
    setInvestigation((current) => ({
      ...current,
      [stageId]: {
        ...current[stageId],
        [key]: value
      }
    }));
  }

  function setActiveOperationId(stageId, operationId) {
    setActiveOperationByStage((current) => ({
      ...current,
      [stageId]: operationId
    }));
  }

  function updateOperationStep(stageId, operationId, key, value) {
    setInvestigation((current) => ({
      ...current,
      [stageId]: {
        ...current[stageId],
        operationSteps: {
          ...current[stageId].operationSteps,
          [operationId]: {
            ...current[stageId].operationSteps[operationId],
            [key]: value
          }
        }
      }
    }));
  }

  function updateReportWriteup(sectionId, value) {
    setInvestigation((current) => ({
      ...current,
      reportingReview: {
        ...current.reportingReview,
        reportWriteup: {
          ...current.reportingReview.reportWriteup,
          [sectionId]: value
        }
      }
    }));
  }

  function buildDraftReportFromInvestigation() {
    setInvestigation((current) => ({
      ...current,
      reportingReview: {
        ...current.reportingReview,
        reportWriteup: {
          ...current.reportingReview.reportWriteup,
          ...buildReportDraft(current)
        }
      }
    }));
  }

  function appendText(existing, addition) {
    const cleanAddition = String(addition || "").trim();
    if (!cleanAddition) {
      return existing || "";
    }
    return [existing, cleanAddition].filter((value) => String(value || "").trim()).join("\n\n");
  }

  async function importOperationFile(stageId, operationId, event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const stage = investigationStages.find((item) => item.id === stageId);
    const operation = stage?.operations?.find((item) => item.id === operationId);
    const loadingKey = `${stageId}:${operationId}`;
    setIntakeLoadingTarget(loadingKey);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("stageTitle", stage?.title || stageId);
      formData.append("operationTitle", operation?.title || operationId);

      const response = await fetch("/api/intake-file", {
        method: "POST",
        body: formData
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "File intake failed.");
      }

      const suggestionText = [
        result.suggestions?.preSceneNotes,
        result.suggestions?.initialIntelligence,
        result.reviewWarning
      ]
        .filter(Boolean)
        .join("\n");
      const extractedPreview = String(result.extractedText || "").slice(0, 2500);
      const intakeRecord = {
        id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${file.name}`,
        fileName: result.fileName || file.name,
        fileType: result.fileType || file.type || "unknown",
        summary: suggestionText || "Source extracted for officer review.",
        extractedAt: new Date().toISOString()
      };

      setInvestigation((current) => {
        const currentStage = current[stageId] || {};
        const currentOperation = currentStage.operationSteps?.[operationId] || {};
        const updatedOperation = {
          ...currentOperation,
          records: appendText(
            currentOperation.records,
            `Uploaded source: ${intakeRecord.fileName}\n${suggestionText || "[No obvious initial fields identified]"}`
          ),
          notes: appendText(currentOperation.notes, extractedPreview ? `Extracted text preview:\n${extractedPreview}` : ""),
          gaps: appendText(currentOperation.gaps, result.reviewWarning),
          intakeFiles: [intakeRecord, ...(currentOperation.intakeFiles || [])]
        };

        const stageUpdates =
          stageId === "preScene"
            ? {
                notes: appendText(currentStage.notes, result.suggestions?.preSceneNotes),
                evidence: appendText(
                  currentStage.evidence,
                  `Initial intelligence source ${intakeRecord.fileName}:\n${result.suggestions?.initialIntelligence || extractedPreview}`
                ),
                missingInfo: appendText(currentStage.missingInfo, result.reviewWarning)
              }
            : {};

        return {
          ...current,
          [stageId]: {
            ...currentStage,
            ...stageUpdates,
            operationSteps: {
              ...currentStage.operationSteps,
              [operationId]: updatedOperation
            }
          }
        };
      });
    } catch (error) {
      setAgentStatus(formatAssistantError(error));
    } finally {
      setIntakeLoadingTarget("");
    }
  }

  function updateDataTrack(trackId, key, value) {
    setInvestigation((current) => ({
      ...current,
      dataCollection: {
        ...current.dataCollection,
        dataTracks: {
          ...current.dataCollection.dataTracks,
          [trackId]: {
            ...current.dataCollection.dataTracks[trackId],
            [key]: value
          }
        }
      }
    }));
  }

  function setActiveSceneEntry(stepId, entryId) {
    setInvestigation((current) => ({
      ...current,
      dataCollection: {
        ...current.dataCollection,
        sceneExamination: {
          ...current.dataCollection.sceneExamination,
          [stepId]: {
            ...current.dataCollection.sceneExamination[stepId],
            activeEntryId: entryId
          }
        }
      }
    }));
  }

  function addSceneEntry(stepId) {
    const step = sceneExaminationSteps.find((item) => item.id === stepId) || sceneExaminationSteps[0];

    setInvestigation((current) => {
      const currentStep = current.dataCollection.sceneExamination[stepId] || {};
      const existingEntries = currentStep.entries?.length ? currentStep.entries : [currentStep];
      const entry = createSceneEntry(step, existingEntries.length);

      return {
        ...current,
        dataCollection: {
          ...current.dataCollection,
          sceneExamination: {
            ...current.dataCollection.sceneExamination,
            [stepId]: {
              ...currentStep,
              activeEntryId: entry.id,
              entries: [...existingEntries, entry]
            }
          }
        }
      };
    });
  }

  function updateSceneStep(stepId, entryId, key, value) {
    setInvestigation((current) => {
      const currentStep = current.dataCollection.sceneExamination[stepId] || {};
      const entries = currentStep.entries?.length ? currentStep.entries : [currentStep];
      const updatedEntries = entries.map((entry) => (entry.id === entryId ? { ...entry, [key]: value } : entry));
      const activeEntry = updatedEntries.find((entry) => entry.id === entryId) || updatedEntries[0];

      return {
        ...current,
        dataCollection: {
          ...current.dataCollection,
          sceneExamination: {
            ...current.dataCollection.sceneExamination,
            [stepId]: {
              ...currentStep,
              [key]: activeEntry?.[key] || currentStep[key] || "",
              activeEntryId: entryId,
              entries: updatedEntries
            }
          }
        }
      };
    });
  }

  async function analyzeDataCollectionPhoto(trackId, event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const track = dataCollectionTracks.find((item) => item.id === trackId);
    setPhotoLoadingTarget(`data:${trackId}`);

    try {
      const image = await fileToDataUrl(file);
      const response = await fetch("/api/analyze-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image,
          analysisMode: "fire-investigation",
          imageInfo: {
            fileName: file.name,
            type: file.type,
            size: file.size
          },
          investigationContext: {
            stage: "2000 Data Collection",
            trackTitle: track?.title || "Data Collection",
            trackCode: track?.code || "2000"
          },
          location: {
            placeName: track?.title || "Data Collection"
          }
        })
      });
      const analysis = await response.json();

      if (!response.ok) {
        throw new Error(analysis.error || "Photo analysis failed.");
      }

      setInvestigation((current) => {
        const currentTrack = current.dataCollection.dataTracks[trackId] || {};
        const existingPhotos = currentTrack.photos || [];
        const photoRecord = {
          id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${file.name}`,
          fileName: file.name,
          label: track?.title || "Data Collection",
          capturedAt: new Date().toISOString(),
          analysis
        };

        return {
          ...current,
          dataCollection: {
            ...current.dataCollection,
            dataTracks: {
              ...current.dataCollection.dataTracks,
              [trackId]: {
                ...currentTrack,
                photos: [photoRecord, ...existingPhotos]
              }
            }
          }
        };
      });
    } catch (error) {
      setAgentStatus(formatAssistantError(error));
    } finally {
      setPhotoLoadingTarget("");
    }
  }

  async function analyzeSceneExaminationPhoto(stepId, entryId, event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const step = sceneExaminationSteps.find((item) => item.id === stepId);
    const stepData = investigation.dataCollection.sceneExamination[stepId] || {};
    const entries = stepData.entries?.length ? stepData.entries : [stepData];
    const entry = entries.find((item) => item.id === entryId) || entries[0] || {};
    const label = entry.areaLabel?.trim() || stepData.areaLabel?.trim() || step?.title || "Scene Examination";
    setPhotoLoadingTarget(`scene:${stepId}:${entryId}`);

    try {
      const image = await fileToDataUrl(file);
      const response = await fetch("/api/analyze-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image,
          analysisMode: "fire-investigation",
          imageInfo: {
            fileName: file.name,
            type: file.type,
            size: file.size
          },
          investigationContext: {
            stage: step?.title || "Scene Examination",
            trackTitle: label,
            trackCode: step?.code || "Scene"
          },
          location: {
            placeName: label
          }
        })
      });
      const analysis = await response.json();

      if (!response.ok) {
        throw new Error(analysis.error || "Photo analysis failed.");
      }

      setInvestigation((current) => {
        const currentStep = current.dataCollection.sceneExamination[stepId] || {};
        const entries = currentStep.entries?.length ? currentStep.entries : [currentStep];
        const photoRecord = {
          id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${file.name}`,
          fileName: file.name,
          label,
          capturedAt: new Date().toISOString(),
          analysis
        };
        const updatedEntries = entries.map((item) =>
          item.id === entryId ? { ...item, photos: [photoRecord, ...(item.photos || [])] } : item
        );
        const activeEntry = updatedEntries.find((item) => item.id === entryId) || updatedEntries[0];

        return {
          ...current,
          dataCollection: {
            ...current.dataCollection,
            sceneExamination: {
              ...current.dataCollection.sceneExamination,
              [stepId]: {
                ...currentStep,
                areaLabel: activeEntry?.areaLabel || currentStep.areaLabel || "",
                observationFocus: activeEntry?.observationFocus || currentStep.observationFocus || "",
                notes: activeEntry?.notes || currentStep.notes || "",
                gaps: activeEntry?.gaps || currentStep.gaps || "",
                photos: activeEntry?.photos || currentStep.photos || [],
                activeEntryId: entryId,
                entries: updatedEntries
              }
            }
          }
        };
      });
    } catch (error) {
      setAgentStatus(formatAssistantError(error));
    } finally {
      setPhotoLoadingTarget("");
    }
  }

  async function askAgent() {
    return askAgentWithQuestion({
      question: agentQuestion,
      stageFocus: agentStageFocus || "General investigation question",
      loadingLabel: "freeform"
    });
  }

  async function askAgentWithQuestion({ question, stageFocus, loadingLabel }) {
    setAgentLoading(true);
    setAiActionLoading(loadingLabel || "freeform");
    setAgentStatus("Consulting the Fire Investigation AI Agent...");
    setAgentResult(null);

    try {
      const response = await fetch("/api/fire-investigation-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          activeStage: stageFocus,
          investigation,
          investigationSummary: summary,
          form: {}
        })
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Fire Investigation AI Agent request failed.");
      }

      setAgentResult(result);
      setAgentStatus(
        result.connectedAgent
          ? "Connected agent response complete."
          : "Fire investigation model response complete. Review before acting."
      );
    } catch (error) {
      setAgentStatus(formatAssistantError(error));
    } finally {
      setAgentLoading(false);
      setAiActionLoading("");
    }
  }

  function analyzeOriginWithAgent() {
    setActiveStageId("originDetermination");
    return askAgentWithQuestion({
      loadingLabel: "origin",
      stageFocus: "3000-3200 Origin Determination",
      question:
        "Using every completed field, uploaded/extracted intake note, scene examination entry, data collection track, photo analysis summary, witness/digital source, evidence note, and missing-information field in the investigation state, assist with origin determination. Identify supported sector/area/point of origin hypotheses, supporting facts, contradictory facts, what can be eliminated, what cannot be eliminated, and what additional data is required. Do not invent facts or state a final origin beyond the support provided."
    });
  }

  function analyzeCauseWithAgent() {
    setActiveStageId("causeDetermination");
    return askAgentWithQuestion({
      loadingLabel: "cause",
      stageFocus: "4000-4300 Cause Determination",
      question:
        "Using every completed field, uploaded/extracted intake note, scene examination entry, data collection track, photo analysis summary, witness/digital source, evidence note, origin analysis field, and missing-information field in the investigation state, assist with cause determination. Identify possible ignition sources, first fuel/material ignited, oxidant, ignition sequence, supporting facts, contradictory facts, hypotheses that can or cannot be eliminated, and whether the cause classification must remain Undetermined. Use only Natural, Accidental, Incendiary, or Undetermined if classification is discussed."
    });
  }

  async function draftReportWithAgent() {
    setAiActionLoading("report");
    setAgentStatus("Drafting the investigation report from all current fields...");
    setAgentResult(null);

    try {
      const response = await fetch("/api/investigation-report-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          investigation,
          investigationSummary: summary,
          existingReportWriteup: investigation.reportingReview.reportWriteup
        })
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Investigation report drafting failed.");
      }

      setInvestigation((current) => ({
        ...current,
        reportingReview: {
          ...current.reportingReview,
          reportWriteup: {
            ...current.reportingReview.reportWriteup,
            ...result.reportWriteup
          },
          operationSteps: {
            ...current.reportingReview.operationSteps,
            writeInvestigationReport: {
              ...current.reportingReview.operationSteps.writeInvestigationReport,
              status: "In Progress",
              records: appendText(
                current.reportingReview.operationSteps.writeInvestigationReport.records,
                "AI-generated investigation report draft inserted into report write-up sections."
              ),
              gaps: appendText(
                current.reportingReview.operationSteps.writeInvestigationReport.gaps,
                [...(result.missingInformation || []), ...(result.concerns || [])].join("\n")
              )
            }
          }
        }
      }));
      setActiveStageId("reportingReview");
      setAgentResult({
        answer: "The report write-up sections were drafted from the current investigation fields. Review every section before relying on it.",
        concerns: result.concerns || [],
        suggestedUpdates: [...(result.originGuidance || []), ...(result.causeGuidance || [])],
        missingInformation: result.missingInformation || [],
        stageFocus: "5000-5100 Reporting and Review"
      });
      setAgentStatus("Investigation report draft inserted into the Reporting and Review section.");
    } catch (error) {
      setAgentStatus(formatAssistantError(error));
    } finally {
      setAiActionLoading("");
    }
  }

  if (!authChecked) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <p className="eyebrow">Loading</p>
          <h1>Fire Investigation</h1>
        </section>
      </main>
    );
  }

  if (!authSession) {
    return <AuthGate onAuthenticated={setAuthSession} />;
  }

  return (
    <main className="app-shell">
      <section className="topbar">
        <div>
          <p className="eyebrow">TTFS Field Intelligence</p>
          <h1>Fire Investigation</h1>
          <p className="topbar-copy">
            Capture the scene, organize the evidence, and move from observations to origin, cause, and report.
          </p>
        </div>
        <div className="score-pill" aria-label={`Investigation progress ${progress} out of 100`}>
          <span>{progress}</span>
          <small>ready</small>
        </div>
      </section>

      <section className="user-strip" aria-label="Signed in user">
        <div>
          <strong>{authSession.name}</strong>
          <span>{authSession.email}</span>
        </div>
        <button type="button" className="secondary-action" onClick={signOut}>
          Sign Out
        </button>
      </section>

      <div className="workspace investigation-only-workspace">
        <section className="panel input-panel" aria-labelledby="process-heading">
          <div className="section-heading">
            <p className="eyebrow">Workflow</p>
            <h2 id="process-heading">Current Stage</h2>
          </div>

          <nav className="process-tabs" aria-label="Fire investigation process stages">
            {investigationStages.map((stage) => (
              <button
                key={stage.id}
                type="button"
                className={activeStage.id === stage.id ? "active" : ""}
                onClick={() => setActiveStageId(stage.id)}
              >
                <span>{stage.code}</span>
                {stage.title}
              </button>
            ))}
          </nav>

          <div className="investigation-guide">
            <StageCard
              key={activeStage.id}
              stage={activeStage}
              data={investigation[activeStage.id]}
              onChange={updateStage}
              activeOperationId={activeOperationByStage[activeStage.id]}
              setActiveOperationId={setActiveOperationId}
              onOperationChange={updateOperationStep}
              onOperationFileImport={importOperationFile}
              intakeLoadingTarget={intakeLoadingTarget}
              onReportChange={updateReportWriteup}
              onBuildReportDraft={buildDraftReportFromInvestigation}
              activeDataTrackId={activeDataTrackId}
              setActiveDataTrackId={setActiveDataTrackId}
              onDataTrackChange={updateDataTrack}
              activeSceneStepId={activeSceneStepId}
              setActiveSceneStepId={setActiveSceneStepId}
              onSceneStepChange={updateSceneStep}
              onAddSceneEntry={addSceneEntry}
              onSetActiveSceneEntry={setActiveSceneEntry}
              onScenePhotoAnalyze={analyzeSceneExaminationPhoto}
              onPhotoAnalyze={analyzeDataCollectionPhoto}
              photoLoadingTarget={photoLoadingTarget}
            />
          </div>
        </section>

        <section className="panel output-panel no-print" aria-labelledby="agent-heading">
          <div className="output-header">
            <div>
              <p className="eyebrow">Assistant</p>
              <h2 id="agent-heading">Case Intelligence</h2>
            </div>
            <strong>{progress}%</strong>
          </div>

          <article>
            <h3>Case Readiness</h3>
            <div className="meter" aria-hidden="true">
              <span style={{ width: `${progress}%` }} />
            </div>
            <p>{progress}% of major stages are complete.</p>
          </article>

          <article className="assistant-actions">
            <h3>Next Best Action</h3>
            <div className="ai-action-panel">
              <div>
                <h4>AI uses the full case file</h4>
                <p>
                  Origin, cause, and report drafting use the information already captured in every stage.
                </p>
              </div>
              <div className="ai-action-buttons">
                <button type="button" className="secondary-action" onClick={analyzeOriginWithAgent} disabled={Boolean(aiActionLoading)}>
                  {aiActionLoading === "origin" ? "Analyzing Origin..." : "Assist Origin Determination"}
                </button>
                <button type="button" className="secondary-action" onClick={analyzeCauseWithAgent} disabled={Boolean(aiActionLoading)}>
                  {aiActionLoading === "cause" ? "Analyzing Cause..." : "Assist Cause Determination"}
                </button>
                <button type="button" onClick={draftReportWithAgent} disabled={Boolean(aiActionLoading)}>
                  {aiActionLoading === "report" ? "Drafting Report..." : "Draft Investigation Report"}
                </button>
              </div>
            </div>
          </article>

          <article>
            <details>
              <summary>Review Open Items</summary>
              {openItems.length ? (
                <ul>
                  {openItems.slice(0, 18).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p>All stages are marked complete and documented.</p>
              )}
            </details>
          </article>

          <article>
            <h3>Ask a Specific Question</h3>
            <label className="writer-level">
              <span>
                Stage focus <em>Optional</em>
              </span>
              <select value={agentStageFocus} onChange={(event) => setAgentStageFocus(event.target.value)}>
                <option value="">General investigation question</option>
                {investigationStages.map((stage) => (
                  <option key={stage.id} value={`${stage.code} ${stage.title}`}>
                    {stage.code} - {stage.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="writer-box">
              <span>
                Question <em>Current process notes included</em>
              </span>
              <textarea
                value={agentQuestion}
                onChange={(event) => setAgentQuestion(event.target.value)}
                rows={5}
                placeholder="Ask about origin hypotheses, electrical analysis, propane behaviour, missing scene data, evidence handling, witness follow-up, or next investigative steps."
              />
            </label>
            <button type="button" onClick={askAgent} disabled={agentLoading || !agentQuestion.trim()}>
              {agentLoading ? "Consulting Agent..." : "Ask Fire Investigation Agent"}
            </button>
            {agentStatus ? <p className="export-status">{agentStatus}</p> : null}
          </article>

          {agentResult ? (
            <article>
              <h3>Agent Guidance</h3>
              <p>{agentResult.stageFocus || "General investigation question"}</p>
              <pre>{agentResult.answer}</pre>
              <div className="agent-result-grid">
                <div>
                  <h4>Concerns</h4>
                  {agentResult.concerns?.length ? (
                    <ul>
                      {agentResult.concerns.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>No concerns returned.</p>
                  )}
                </div>
                <div>
                  <h4>Missing Information</h4>
                  {agentResult.missingInformation?.length ? (
                    <ul>
                      {agentResult.missingInformation.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>No missing information returned.</p>
                  )}
                </div>
              </div>
              {agentResult.suggestedUpdates?.length ? (
                <>
                  <h4>Suggested Updates</h4>
                  <ul>
                    {agentResult.suggestedUpdates.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </>
              ) : null}
            </article>
          ) : null}

          <article>
            <h3>Process Summary</h3>
            <pre>{summary}</pre>
          </article>
        </section>
      </div>
    </main>
  );
}
