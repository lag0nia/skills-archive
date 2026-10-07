import fs from "node:fs";
import { validateBoundedDeltaScope } from "./bounded-delta-scope.mjs";
import path from "node:path";
import { validateUiUxDesign, readUiUxSpecification, validateUiUxJourneyReadiness } from "./ui-ux-design.mjs";
import { buildLayout, capabilityFiles, selectionFiles } from "../model/build-layout.mjs";
import {
  collectStructuredVerificationObligations,
  verificationAssignmentNone,
  verificationAssignmentRows,
  verificationAssignmentSection,
} from "../model/assurance-traceability.mjs";
import { commaSeparatedIds, findBuildUnitRecords } from "../model/build-unit-records.mjs";
import { findFiles as matchingFiles, readText as read } from "../model/files.mjs";
import { parseFrontmatter as frontmatter } from "../model/frontmatter.mjs";
import { findRepositoryBuildDesignRecords } from "../model/repository-build-design-records.mjs";
import { readSystemModel } from "../model/system-model-records.mjs";
import { parseTicketFile } from "../model/ticket-format.mjs";
import { findTechnicalConstraintRecords } from "../model/technical-constraint-records.mjs";
import { deliverySnapshotErrors } from "../delivery-snapshot.mjs";
import { validateRepositoryTicketMappings } from "../../validate-implementation-detail-tickets.mjs";
import { validateHandoffSequence } from "./handoff-sequence.mjs";

const READINESS = new Set(["READY", "PARTIAL", "BLOCKED"]);
const OUTCOMES = new Set([
  "IMPLEMENTATION_DETAILS_READY",
  "IMPLEMENTATION_DETAILS_PARTIAL",
  "NEEDS_TECHNICAL_DECISION",
  "NEEDS_PRODUCT_DECISION",
  "NEEDS_USER_APPROVAL",
]);
const SELECTION_STATES = new Set(["Proposed", "Approved", "Inherited", "Deferred Outside Selected Scope"]);
const VA_STATES = new Set(["Existing", "Planned — unverified"]);
const ACTIVE_TICKET_STATUSES = new Set(["todo", "deferred", "decided", "finished", "out-of-scope"]);
const REPOSITORY_DISCOVERY_STATES = new Set(["complete", "blocked"]);
const REQUIRED_ENTRY_FIELDS = [
  "Readiness",
  "Canonical sources",
  "Implementation selections",
  "Verification references",
  "Dependencies",
  "Mapped tickets",
  "Blockers",
];
const REQUIRED_VA_FIELDS = [
  "State",
  "Source tickets",
  "Existing-capability evidence",
  "Affected scopes",
  "Prerequisites, actors, and services",
  "Fixtures and scenario inputs",
  "Setup and reset/isolation",
  "Canonical or planned commands",
  "Expected evidence types",
  "Limitations",
];
const REQUIRED_VERIFICATION_CAPABILITY_FIELDS = ["Technical sources", ...REQUIRED_VA_FIELDS];

const BUILD_UNIT_OVERVIEW_SECTION = "Build Unit Overview";
const AGENT_FIRST_BUILD_UNIT_REFERENCE_SECTION = "Agent-First Canonical Reference";
const REQUIRED_AGENT_FIRST_BUILD_UNIT_SECTIONS = [
  "Artifact And Code Location",
  "Applicable Technical Constraints",
  "Source Responsibility Mapping",
  "Interfaces And Dependencies",
  "Module Architecture",
  "Commands And Verification",
  "Local Discretion",
];
const DETAILED_CODE_SHAPE_SECTION = "Detailed Code Shape";
const REQUIRED_REPOSITORY_SECTIONS = [
  "Repository And Workspace Shape",
  "Member Build Units",
  "Applicable Technical Constraints",
  "Repository Constraints",
  "Commands, Release, And Verification",
  "Discovery Status",
  "Local Discretion",
];
const REPOSITORY_OVERVIEW_SECTION = "Repository Overview";
const AGENT_FIRST_REPOSITORY_REFERENCE_SECTION = "Agent-First Canonical Reference";
const MATERIAL_WORKSPACE_TREE_SECTION = "Material Workspace Tree";
const REPOSITORY_CONTRACT_LANES = [
  "repository-module-conventions",
  "code-construction-public-api",
  "maintainability-agent-guidance",
];
const REPOSITORY_CONTRACT_DISPOSITIONS = new Set(["inherited", "resolved", "adapted", "not applicable"]);
const VERSION_CONTROL_POLICY_FIELDS = [
  "Must track",
  "Must ignore",
  "Generated-output disposition",
  "Secret/template rule",
  "Verification",
];
const REQUIRED_AGENT_GUIDANCE_SECTIONS = [
  "Canonical Sources",
  "Hard Rules",
  "Defaults And Exception Guidance",
  "Rationale Comments",
  "Stop And Escalate",
  "Verification Expectations",
];
const REQUIRED_SELECTION_SECTIONS = [
  "Affected Scopes",
  "Options And Consequences",
  "Selected Or Inherited Direction",
  "Planning And Verification Impact",
];
const REQUIRED_HANDOFF_SECTIONS = [
  "Readiness Outcome",
  "Allowed Delivery Slice",
  "Selected Or Inherited Implementation Shape",
  "Required Input Ledger",
  "Required Interaction Closure",
  "Delivery Slice Realizability Review",
  "Build Unit Routing Index",
  "Protected Technical Boundaries",
  "Cross-Unit Integration And Verification",
  "Exclusions And Local Discretion",
];
const REALIZABILITY_REVIEW_FIELDS = [
  "Source consistency",
  "Required-input closure",
  "Interaction closure",
  "Toolchain realizability",
  "Responsibility projection",
  "Verification adequacy",
  "Execution-context readiness",
];
const TARGET_OUTCOME_FIELDS = ["Target outcome", "Runtime-profile claims"];
const TARGET_OUTCOME_REVIEW_FIELD = "Target-outcome closure";
const COMPATIBILITY_REVIEW_FIELDS = [
  "Shared-producer surface closure",
  "Contract-change placement",
  "Fan-out and evolution",
  "Physical compatibility preflight",
  "Affected-slice propagation",
];
const DIAGNOSTIC_SWEEP_FIELDS = [
  "Selected cohort",
  "Initial finite inventory",
  "Direct-dependency additions",
  "Independent probes",
  "Dependency-blocked probes",
  "Root-cause groups",
  "Zero-new-blocker pass",
  "Frozen-inventory termination",
];
const CONSUMER_COVERAGE_SECTION = "Known Consumer Compatibility Coverage";
const DIAGNOSTIC_SWEEP_SECTION = "Bounded Diagnostic Sweep";
const PHYSICAL_REALIZABILITY_SECTION = "Physical Realizability Closure";
const PHYSICAL_RESULTS = new Set(["COMPATIBLE", "DELTA_OWNED", "BLOCKED", "EXCLUDED"]);
const PHYSICAL_OBSERVATION_STATES = new Set(["OBSERVED", "SELECTED_SLICE_OUTPUT", "NOT_APPLICABLE"]);
const PHYSICAL_IMPLEMENTATION_SITUATIONS = new Set(["new-output", "existing-unchanged", "implemented-evolution"]);
const PHYSICAL_BOUNDARY_CLASSES = new Set(["protected-machine-interface", "required-effectful-command", "change-impact", "ordinary"]);
const PHYSICAL_CANDIDATE_STATES = new Set(["PASS", "PLANNED", "NOT_APPLICABLE"]);
const PHYSICAL_EVIDENCE_PROVENANCE = new Set(["executed-probe", "accepted-receipt", "source-inspection", "planned-proof"]);
const PHYSICAL_COMMAND_EFFECT_STATES = new Set(["CHECKED", "NOT_APPLICABLE"]);
const PHYSICAL_DIMENSIONS = [
  "schema/version",
  "identity/representation",
  "transport/method",
  "topology/ports",
  "authority/caller",
  "lifecycle/persistence",
  "command/toolchain",
];
const PHYSICAL_IMPACT_DIMENSIONS = [
  "source/imports",
  "tests/fixtures/golden values",
  "dependencies/manifests/lockfiles",
  "generators/generated outputs",
  "identity/freshness/receipt verifiers",
  "configuration/evidence",
];
const LATER_LIFECYCLE_STAGES = new Set(["Release", "Deployment", "Activation", "Operation"]);
const INPUT_CONSUMPTION_STAGES = new Set(["Implementation", "Build", "Verification", ...LATER_LIFECYCLE_STAGES]);
const INPUT_PRODUCER_STAGES = new Set([...INPUT_CONSUMPTION_STAGES, "Existing", "External"]);
const INPUT_KINDS = new Set(["Source", "Immutable artifact", "Credential", "Configuration", "External fact", "Fixture"]);
const INPUT_AVAILABILITIES = new Set(["selected-slice output", "verified existing input", "later-lifecycle output", "missing"]);
const INPUT_MATURITIES = new Set(["source-only", "built", "published", "accessible", "verified", "not-applicable"]);
const EARLY_INPUT_STAGES = new Set(["Implementation", "Build", "Verification"]);
const INPUT_LIFECYCLE_ORDER = ["Implementation", "Build", "Verification", "Release", "Deployment", "Activation", "Operation"];
const REQUIRED_INPUT_FIELDS = [
  "Consumer",
  "Consumed at",
  "Input kind",
  "Produced by",
  "Producer repository",
  "Produced at",
  "Availability",
  "Maturity",
  "Evidence",
  "Later-lifecycle gate",
  "Artifact identity",
  "Source revision",
  "Integrity",
  "Resolution check",
  "Authorized access check",
];
const INTERACTION_STAGES = new Set(["Implementation", "Build", "Verification", ...LATER_LIFECYCLE_STAGES]);
const INTERACTION_KINDS = new Set([
  "callable",
  "state-observation",
  "event-or-message",
  "artifact-transfer",
  "manual-handoff",
  "external-system",
]);
const MACHINE_INTERACTION_KINDS = new Set([
  "callable",
  "state-observation",
  "event-or-message",
  "artifact-transfer",
  "external-system",
]);
const INTERACTION_AVAILABILITIES = new Set(["selected-slice output", "verified existing interaction", "later-lifecycle output", "missing"]);
const INTERACTION_EVIDENCE_CLASSES = new Set([
  "existence",
  "identity-freshness",
  "structural-conformance",
  "behavioral",
  "consumer-fitness",
]);
const REQUIRED_INTERACTION_FIELDS = [
  "Consumer",
  "Producer",
  "Required at",
  "Interaction kind",
  "Logical contract",
  "Physical binding",
  "Consumer path",
  "Availability",
  "Required evidence classes",
  "Fitness evidence",
  "Representation conformance",
  "Consumer challenge",
  "Risk",
  "High-risk verification matrix",
];
const BUILD_UNIT_SCOPE_PATTERN = /BUILD_UNIT:BU-\d{3,}/g;
const TICKET_PATTERN = /TICKET-\d{4}/g;
const RESULT_PATTERN = /(?:SEL|VA)-\d{3}/g;
const CONSTRAINT_PATTERN = /CONS-\d{3,}/g;
const PRE_MAPPING_DISPOSITION = /^Realization mapping has not started\.?$/i;
const UI_UX_APPLICABILITY = new Set(["applicable", "not-applicable"]);

function escape(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function field(block, name) {
  return new RegExp("^\\*\\*" + escape(name) + ":\\*\\*\\s*(.+)$", "m").exec(block)?.[1]?.trim() || null;
}

function ids(text, pattern) {
  return [...String(text || "").matchAll(pattern)].map((match) => match[0]);
}

function buildUnitScopes(text) {
  return ids(text, BUILD_UNIT_SCOPE_PATTERN);
}

function ticketIds(text) {
  return ids(text, TICKET_PATTERN);
}

function resultIds(text) {
  return ids(text, RESULT_PATTERN);
}

function constraintIds(text) {
  return ids(text, CONSTRAINT_PATTERN);
}

function isNone(value) {
  return /^`?None\.`?$/.test(String(value || "").trim());
}

function meaningful(value) {
  return Boolean(value) && !isNone(value) && !/^(?:TBD\.?|<[^>]+>)$/i.test(String(value).trim());
}

function placeholder(value) {
  const normalized = String(value || "").trim().replace(/^`|`$/g, "").replace(/^['"]|['"]$/g, "").trim();
  return !normalized || /^(?:TBD\.?|<[^>]+>)$/i.test(normalized);
}

function technicalSourceTokens(value) {
  const normalized = String(value || "").trim();
  if (!normalized || isNone(normalized)) return [];
  const sourceList = normalized.split(";", 1)[0];
  return sourceList.split(",").map((token) => token.trim());
}

function technicalSourceIds(value) {
  return technicalSourceTokens(value)
    .map((token) => token.replace(/^and\s+/i, "").replace(/^`|`$/g, "").trim())
    .filter(Boolean);
}

function validTechnicalSources(value) {
  const normalized = String(value || "").trim();
  const tokens = technicalSourceTokens(normalized);
  const sourceId = "(?:SR-\\d{3,}|FLOW-\\d{3,}|IFACE-\\d{3,}|STATE-\\d{3,}|INV-\\d{3,}|SEC-\\d{3,}|SCOPE-\\d{3,})";
  if (!tokens.length || tokens.some((token) => !new RegExp("^(?:and\\s+)?`?" + sourceId + "`?$").test(token))) return false;
  if (normalized.includes(";")) {
    const trailing = normalized.split(";").slice(1).join(";").trim();
    if (!trailing || !/^(?:\[[^\]]+\]\([^)]+\)|link\b)/i.test(trailing)) return false;
  }
  return technicalSourceIds(normalized).length === tokens.length;
}

function headingBody(text, heading, level) {
  const prefix = "#".repeat(level);
  const match = new RegExp("^" + prefix + "\\s+" + escape(heading) + "\\s*$([\\s\\S]*?)(?=^#{1," + level + "}\\s+|(?![\\s\\S]))", "m").exec(text);
  return match ? match[1].trim() : null;
}

function sectionBody(text, heading) {
  return headingBody(text, heading, 2);
}

function subsectionBody(text, heading) {
  return headingBody(text, heading, 3);
}

function repositorySectionBody(text, heading) {
  return sectionBody(text, heading) ?? subsectionBody(text, heading);
}

function buildUnitSectionBody(text, heading) {
  return sectionBody(text, heading) ?? subsectionBody(text, heading);
}

function validateBuildUnitSections({ text, headings, label, errors }) {
  for (const heading of headings) {
    const body = buildUnitSectionBody(text, heading);
    if (body === null) errors.push(label + " is missing ## or ### " + heading + ".");
    else if (!body || sectionContainsPlaceholder(body)) errors.push(label + " ## or ### " + heading + " contains placeholder content.");
  }
}

function sectionContainsPlaceholder(body) {
  return String(body || "").split("\n").some((line) => {
    const trimmed = line.trim();
    return /^(?:[-*]\s+)?(?:[^:|]+:\s*)?`?TBD\.?`?$/i.test(trimmed)
      || /\|\s*`?TBD\.?`?\s*(?=\|)/i.test(trimmed)
      || /^<[^>]+>$/.test(trimmed);
  });
}

function containsFencedVisualBlock(body) {
  const match = /```[^\n]*\n([\s\S]*?)\n```/.exec(String(body || ""));
  return Boolean(match?.[1].trim());
}

function validateSections({ text, headings, label, errors, level = 2 }) {
  const marker = "#".repeat(level);
  for (const heading of headings) {
    const body = headingBody(text, heading, level);
    if (body === null) errors.push(label + " is missing " + marker + " " + heading + ".");
    else if (!body || sectionContainsPlaceholder(body)) errors.push(label + " " + marker + " " + heading + " contains placeholder content.");
  }
}

function validateUiUxDeliveryReview({ root, handoff, handoffDir, outcome, buildUnits, selectedScopes, errors }) {
  const selectedUnits = selectedScopes.map((scope) => buildUnits.get(scope.split(":")[1])).filter(Boolean);
  const planningClaim = ["IMPLEMENTATION_DETAILS_READY", "IMPLEMENTATION_DETAILS_PARTIAL"].includes(outcome);
  const humanFacing = selectedUnits.filter((unit) => unit.uiUxApplicability === "applicable");
  if (!humanFacing.length) return;

  const uiValidation = validateUiUxDesign(root, { selectedOnly: true });
  errors.push(...uiValidation.errors.map((error) => "UI/UX Delivery Review: " + error));
  const body = sectionBody(handoff, "UI/UX Delivery Review");
  if (body === null) {
    errors.push("Selected human-facing Build Units require ## UI/UX Delivery Review.");
    return;
  }
  const requiredFields = [
    "Approved UI/UX sources",
    "Covered prototype states",
    "Prototype walkthrough",
    "Functional acceptance owner",
    "Implemented UI/UX review owner",
    "Actual user testing",
    "Consistency result",
  ];
  for (const name of requiredFields) {
    const value = field(body, name);
    if (!value) errors.push("UI/UX Delivery Review is missing **" + name + ":**.");
    else if (sectionContainsPlaceholder(value)) errors.push("UI/UX Delivery Review **" + name + ":** contains placeholder content.");
  }
  const sourceLinks = linkPaths(field(body, "Approved UI/UX sources") || "", handoffDir).filter(({ local }) => local);
  const selectedCandidate = readUiUxSpecification(root).selectedPath;
  if (!selectedCandidate) errors.push("UI/UX Delivery Review requires a selected reviewed prototype candidate.");
  for (const requiredPath of [path.join(root, "ui-ux", "specification.md"), selectedCandidate].filter(Boolean)) {
    if (!sourceLinks.some(({ local }) => local.resolved === requiredPath)) {
      errors.push("UI/UX Delivery Review must link " + path.relative(root, requiredPath).split(path.sep).join("/") + ".");
    }
  }
  if (planningClaim) errors.push(...validateUiUxJourneyReadiness(root, field(body, "Covered prototype states") || "", handoffDir));
  const walkthrough = field(body, "Prototype walkthrough") || "";
  const consistency = field(body, "Consistency result") || "";
  if (planningClaim && !/^`?Reviewed — no unresolved usability blockers`?/i.test(walkthrough)) {
    errors.push(outcome + " for a human-facing slice requires a reviewed prototype walkthrough with no unresolved usability blockers.");
  }
  if (planningClaim && !/^`?PASS`?\b/.test(consistency)) {
    errors.push(outcome + " for a human-facing slice requires a PASS UI/UX consistency result.");
  }
  for (const name of ["Functional acceptance owner", "Implemented UI/UX review owner"]) {
    const value = field(body, name) || "";
    if (!meaningful(value) || !linkPaths(value, handoffDir).some(({ local }) => local && fs.existsSync(local.resolved))) {
      errors.push("UI/UX Delivery Review **" + name + ":** must name a concrete owner and link an existing local evidence or implementation route.");
    }
  }
}

function validateAgentFirstBuildUnitEntry({ text, label, errors, requiresVisual }) {
  const audienceHeadings = [BUILD_UNIT_OVERVIEW_SECTION, AGENT_FIRST_BUILD_UNIT_REFERENCE_SECTION];
  validateSections({ text, headings: audienceHeadings, label, errors });
  const actual = [...text.matchAll(/^##\s+(.+?)\s*$/gm)].map((match) => match[1].trim());
  if (audienceHeadings.some((heading, index) => actual[index] !== heading)) {
    errors.push(label + " must begin with presentation sections in this order: " + audienceHeadings.join(", ") + ".");
  }

  const overview = sectionBody(text, BUILD_UNIT_OVERVIEW_SECTION) || "";
  const hasDetailedCodeShape = new RegExp("^###\\s+" + escape(DETAILED_CODE_SHAPE_SECTION) + "\\s*$", "m").test(text);
  if (hasDetailedCodeShape && subsectionBody(overview, DETAILED_CODE_SHAPE_SECTION) === null) {
    errors.push(label + " must place ### " + DETAILED_CODE_SHAPE_SECTION + " inside ## " + BUILD_UNIT_OVERVIEW_SECTION + ".");
  }
  validateOptionalDetailedCodeShape({
    text,
    parentText: overview,
    parentHeading: BUILD_UNIT_OVERVIEW_SECTION,
    label,
    errors,
    requiresVisual,
  });

  const reference = sectionBody(text, AGENT_FIRST_BUILD_UNIT_REFERENCE_SECTION) || "";
  validateSections({
    text: reference,
    headings: REQUIRED_AGENT_FIRST_BUILD_UNIT_SECTIONS,
    level: 3,
    label,
    errors,
  });
}

function validateAgentFirstRepositoryEntry({ text, label, errors }) {
  const audienceHeadings = [REPOSITORY_OVERVIEW_SECTION, AGENT_FIRST_REPOSITORY_REFERENCE_SECTION];
  validateSections({ text, headings: audienceHeadings, label, errors });
  const actual = [...text.matchAll(/^##\s+(.+?)\s*$/gm)].map((match) => match[1].trim());
  if (audienceHeadings.some((heading, index) => actual[index] !== heading)) {
    errors.push(label + " must begin with presentation sections in this order: " + audienceHeadings.join(", ") + ".");
  }

  const overview = sectionBody(text, REPOSITORY_OVERVIEW_SECTION) || "";
  const hasMaterialWorkspaceTree = new RegExp("^###\\s+" + escape(MATERIAL_WORKSPACE_TREE_SECTION) + "\\s*$", "m").test(text);
  if (hasMaterialWorkspaceTree && subsectionBody(overview, MATERIAL_WORKSPACE_TREE_SECTION) === null) {
    errors.push(label + " must place ### " + MATERIAL_WORKSPACE_TREE_SECTION + " inside ## " + REPOSITORY_OVERVIEW_SECTION + ".");
  }
  validateOptionalMaterialWorkspaceTree({ text, parentText: overview, label, errors });

  const reference = sectionBody(text, AGENT_FIRST_REPOSITORY_REFERENCE_SECTION) || "";
  validateSections({
    text: reference,
    headings: REQUIRED_REPOSITORY_SECTIONS,
    level: 3,
    label,
    errors,
  });
}

function validateOptionalDetailedCodeShape({ text, parentText = text, parentHeading = null, label, errors, requiresVisual }) {
  if (sectionBody(text, "Code Shape") !== null) {
    errors.push(label + " must place visual code shape inside ## " + (parentHeading || "Module Architecture") + ", not in a separate ## Code Shape section.");
  }
  const body = subsectionBody(parentText, DETAILED_CODE_SHAPE_SECTION);
  if (body === null) return;
  if (!body || sectionContainsPlaceholder(body)) {
    errors.push(label + " ### " + DETAILED_CODE_SHAPE_SECTION + " contains placeholder content.");
  }
  if (requiresVisual && !containsFencedVisualBlock(body)) {
    errors.push(label + " ### " + DETAILED_CODE_SHAPE_SECTION + " must contain a concrete fenced visual block.");
  }
  if (!requiresVisual && !/^Not applicable\s*[—-]\s*\S/m.test(body)) {
    errors.push(label + " ### " + DETAILED_CODE_SHAPE_SECTION + " must state a concrete Not applicable disposition for an external or no-code unit.");
  }
  const matches = [...text.matchAll(new RegExp("^###\\s+" + escape(DETAILED_CODE_SHAPE_SECTION) + "\\s*$", "gm"))];
  if (matches.length !== 1) {
    errors.push(label + " must contain ### " + DETAILED_CODE_SHAPE_SECTION + " at most once when present.");
  }
  const moduleBody = sectionBody(text, "Module Architecture");
  if (!parentHeading && moduleBody !== null && !new RegExp("^###\\s+" + escape(DETAILED_CODE_SHAPE_SECTION) + "\\s*(?:\\n|$)").test(moduleBody)) {
    errors.push(label + " ### " + DETAILED_CODE_SHAPE_SECTION + " must be the first subsection inside ## Module Architecture.");
  }
}

function validateOptionalMaterialWorkspaceTree({ text, label, errors, parentText = text }) {
  const body = subsectionBody(parentText, MATERIAL_WORKSPACE_TREE_SECTION);
  if (body === null) return;
  if (!body || sectionContainsPlaceholder(body)) {
    errors.push(label + " ### " + MATERIAL_WORKSPACE_TREE_SECTION + " contains placeholder content.");
  }
  if (!containsFencedVisualBlock(body)) {
    errors.push(label + " ### " + MATERIAL_WORKSPACE_TREE_SECTION + " must contain a concrete fenced visual block.");
  }
  const matches = [...text.matchAll(new RegExp("^###\\s+" + escape(MATERIAL_WORKSPACE_TREE_SECTION) + "\\s*$", "gm"))];
  if (matches.length !== 1) {
    errors.push(label + " must contain ### " + MATERIAL_WORKSPACE_TREE_SECTION + " at most once when present.");
  }
}

function validateRealizabilityReview({ handoff, handoffDir, outcome, errors }) {
  const body = sectionBody(handoff, "Delivery Slice Realizability Review");
  if (body === null) return;
  const planningClaim = ["IMPLEMENTATION_DETAILS_READY", "IMPLEMENTATION_DETAILS_PARTIAL"].includes(outcome);
  const reviewResult = field(body, "Review result")?.match(/^`(PASS|BLOCKED)`$/)?.[1] || null;
  if (!reviewResult) errors.push("Delivery Slice Realizability Review must select `PASS` or `BLOCKED` in **Review result:**.");
  if (planningClaim && reviewResult !== "PASS") {
    errors.push(outcome + " requires a PASS Delivery Slice Realizability Review.");
  }

  const readinessBody = sectionBody(handoff, "Readiness Outcome") || "";
  if (field(readinessBody, "Compatibility preflight contract")) {
    errors.push("Readiness Outcome must not declare **Compatibility preflight contract:**; current handoffs use the one unversioned compatibility preflight structure.");
  }

  const allowedSliceBody = sectionBody(handoff, "Allowed Delivery Slice") || "";
  const targetOutcomeValues = TARGET_OUTCOME_FIELDS.map((name) => [name, field(allowedSliceBody, name)]);
  const targetOutcomeReview = field(body, TARGET_OUTCOME_REVIEW_FIELD);
  {
    for (const [name, value] of targetOutcomeValues) {
      if (!value) {
        errors.push("Handoff is missing **" + name + ":** under Allowed Delivery Slice.");
        continue;
      }
      if (!meaningful(value) || placeholder(value)) {
        errors.push("Allowed Delivery Slice **" + name + ":** lacks a concrete conclusion.");
      }
      if (!existingLocalLinks(value, handoffDir).length) {
        errors.push("Allowed Delivery Slice **" + name + ":** must cite at least one existing canonical local link.");
      }
    }
    if (!targetOutcomeReview) {
      errors.push("Handoff is missing **" + TARGET_OUTCOME_REVIEW_FIELD + ":** in Delivery Slice Realizability Review.");
    }
  }

  const statuses = [];
  const reviewFields = [
    ...REALIZABILITY_REVIEW_FIELDS,
    TARGET_OUTCOME_REVIEW_FIELD,
    ...COMPATIBILITY_REVIEW_FIELDS,
  ];
  for (const name of reviewFields) {
    const value = field(body, name);
    if (!value) {
      errors.push("Delivery Slice Realizability Review is missing **" + name + ":**.");
      continue;
    }
    const match = /^`(PASS|BLOCKED)`\s*(?:—|-)\s*(.+)$/.exec(value);
    if (!match) {
      errors.push("Delivery Slice Realizability Review **" + name + ":** must use `PASS` or `BLOCKED` followed by concrete evidence.");
      continue;
    }
    const [, status, evidence] = match;
    statuses.push(status);
    if (!meaningful(evidence) || placeholder(evidence)) {
      errors.push("Delivery Slice Realizability Review **" + name + ":** lacks a concrete conclusion.");
    }
    const localLinks = linkPaths(evidence, handoffDir).filter(({ local }) => local && fs.existsSync(local.resolved));
    if (!localLinks.length) {
      errors.push("Delivery Slice Realizability Review **" + name + ":** must cite at least one existing canonical local link.");
    }
    if (planningClaim && status !== "PASS") {
      errors.push(outcome + " requires PASS for realizability axis " + name + ".");
    }
  }

  const blockers = field(body, "Review blockers");
  if (!blockers) errors.push("Delivery Slice Realizability Review is missing **Review blockers:**.");
  if (planningClaim && !isNone(blockers)) errors.push(outcome + " requires `None.` Delivery Slice Realizability Review blockers.");
  if (reviewResult === "PASS" && (statuses.some((status) => status !== "PASS") || !isNone(blockers))) {
    errors.push("A PASS Delivery Slice Realizability Review requires every axis to PASS and **Review blockers:** to be `None.`.");
  }
  if (reviewResult === "BLOCKED" && statuses.every((status) => status === "PASS") && isNone(blockers)) {
    errors.push("A BLOCKED Delivery Slice Realizability Review must identify a blocked axis or a canonical review blocker.");
  }
}

function validateBoundedDiagnosticSweep({ handoff, handoffDir, outcome, errors }) {
  const review = sectionBody(handoff, "Delivery Slice Realizability Review") || "";
  const sweep = subsectionBody(review, DIAGNOSTIC_SWEEP_SECTION);
  if (sweep === null) {
    errors.push("Delivery Slice Realizability Review is missing required ### " + DIAGNOSTIC_SWEEP_SECTION + ".");
    return;
  }
  for (const name of DIAGNOSTIC_SWEEP_FIELDS) {
    if (!field(sweep, name)) errors.push(DIAGNOSTIC_SWEEP_SECTION + " is missing **" + name + ":**.");
  }

  const selectedCohort = field(sweep, "Selected cohort") || "";
  if (!meaningful(selectedCohort) || !existingLocalLinks(selectedCohort, handoffDir).length) {
    errors.push("Bounded Diagnostic Sweep **Selected cohort:** must name the complete bounded cohort and cite existing local routing evidence.");
  }
  const initialInventory = field(sweep, "Initial finite inventory") || "";
  if (!meaningful(initialInventory) || !existingLocalLinks(initialInventory, handoffDir).length) {
    errors.push("Bounded Diagnostic Sweep **Initial finite inventory:** must name the frozen direct-dependency-bounded inventory and cite existing local routing evidence.");
  }
  const additions = field(sweep, "Direct-dependency additions");
  if (!isNone(additions) && (!meaningful(additions) || !existingLocalLinks(additions, handoffDir).length)) {
    errors.push("Bounded Diagnostic Sweep **Direct-dependency additions:** must be `None.` or cite concrete direct-dependency evidence.");
  }
  const independent = statusWithDetail(field(sweep, "Independent probes"), new Set(["COMPLETE"]));
  if (!independent || !meaningful(independent.detail)) {
    errors.push("Bounded Diagnostic Sweep **Independent probes:** must be `COMPLETE` with the completed safe-independent-probe summary.");
  }
  const dependencyBlocked = field(sweep, "Dependency-blocked probes");
  if (!isNone(dependencyBlocked)) {
    const blocked = statusWithDetail(dependencyBlocked, new Set(["BLOCKED"]));
    if (!blocked || !meaningful(blocked.detail)) {
      errors.push("Bounded Diagnostic Sweep **Dependency-blocked probes:** must be `None.` or `BLOCKED` with the exact prerequisite and skipped probes.");
    }
  }
  const rootCauses = field(sweep, "Root-cause groups");
  if (!rootCauses) errors.push("Bounded Diagnostic Sweep is missing **Root-cause groups:**.");
  else if (!isNone(rootCauses) && (!meaningful(rootCauses) || !existingLocalLinks(rootCauses, handoffDir).length)) {
    errors.push("Bounded Diagnostic Sweep **Root-cause groups:** must be `None.` or grouped canonical blockers with existing local links.");
  }
  const zeroNew = statusWithDetail(field(sweep, "Zero-new-blocker pass"), new Set(["PASS", "BLOCKED"]));
  if (!zeroNew || !meaningful(zeroNew.detail)) {
    errors.push("Bounded Diagnostic Sweep **Zero-new-blocker pass:** must be `PASS` or `BLOCKED` with a concrete conclusion.");
  }
  const termination = statusWithDetail(field(sweep, "Frozen-inventory termination"), new Set(["PASS", "BLOCKED"]));
  if (!termination || !meaningful(termination.detail)) {
    errors.push("Bounded Diagnostic Sweep **Frozen-inventory termination:** must be `PASS` or `BLOCKED` with a concrete conclusion.");
  }

  const planningClaim = ["IMPLEMENTATION_DETAILS_READY", "IMPLEMENTATION_DETAILS_PARTIAL"].includes(outcome);
  if (planningClaim && !isNone(dependencyBlocked)) {
    errors.push(outcome + " requires `None.` dependency-blocked probes after the complete cohort rerun.");
  }
  if (planningClaim && !isNone(rootCauses)) {
    errors.push(outcome + " requires `None.` root-cause groups after repairs.");
  }
  if (planningClaim && zeroNew?.status !== "PASS") {
    errors.push(outcome + " requires a PASS zero-new-blocker rerun of the complete bounded cohort.");
  }
  if (planningClaim && termination?.status !== "PASS") {
    errors.push(outcome + " requires PASS frozen-inventory termination; do not start another expanding audit.");
  }
}

function codeFieldValue(block, name, allowed) {
  const value = field(block, name)?.match(/^`([^`]+)`$/)?.[1] || null;
  return value && allowed.has(value) ? value : null;
}

function requiredInputEntries(handoff) {
  const body = sectionBody(handoff, "Required Input Ledger");
  if (body === null) return null;
  const matches = [...body.matchAll(/^###\s+`?(INPUT-\d{3})`?\s+—\s+.+$/gm)];
  return {
    body,
    entries: matches.map((match, index) => ({
      id: match[1],
      body: body.slice(match.index, matches[index + 1]?.index).trim(),
    })),
  };
}

function requiredInteractionEntries(handoff) {
  const body = sectionBody(handoff, "Required Interaction Closure");
  if (body === null) return null;
  const matches = [...body.matchAll(/^###\s+`?(INT-\d{3})`?\s+—\s+`?(IFACE-\d{3,}\.ACT-\d{3})`?\s*$/gm)];
  return {
    body,
    entries: matches.map((match, index) => ({
      id: match[1],
      interactionId: match[2],
      body: body.slice(match.index, matches[index + 1]?.index).trim(),
    })),
  };
}

function physicalRealizabilityEntries(handoff) {
  const body = sectionBody(handoff, PHYSICAL_REALIZABILITY_SECTION);
  if (body === null) return null;
  const matches = [...body.matchAll(/^###\s+`?(PSEAM-\d{3})`?\s+—\s+.+$/gm)];
  return {
    body,
    entries: matches.map((match, index) => ({
      id: match[1],
      body: body.slice(match.index, matches[index + 1]?.index).trim(),
    })),
  };
}

function validatePhysicalRealizabilityClosure({ handoff, handoffDir, handoffPath, outcome, selectedScopes, errors }) {
  const closure = physicalRealizabilityEntries(handoff);
  if (closure === null) {
    errors.push("Handoff is missing ## " + PHYSICAL_REALIZABILITY_SECTION + ".");
    return false;
  }
  if (!closure.entries.length) {
    errors.push(PHYSICAL_REALIZABILITY_SECTION + " must define at least one ### `PSEAM-NNN` compatibility class.");
    return true;
  }
  if (new Set(closure.entries.map((entry) => entry.id)).size !== closure.entries.length) {
    errors.push(PHYSICAL_REALIZABILITY_SECTION + " contains duplicate PSEAM identifiers.");
  }

  const inputIds = (requiredInputEntries(handoff)?.entries || []).map((entry) => entry.id);
  const interactionIds = (requiredInteractionEntries(handoff)?.entries || []).map((entry) => entry.id);
  const allowedSliceBody = sectionBody(handoff, "Allowed Delivery Slice") || "";
  const targetOutcomeDeclared = Boolean(field(allowedSliceBody, "Target outcome"));
  const writableScopes = [...new Set(buildUnitScopes(field(allowedSliceBody, "Writable build units") || ""))];
  if (!targetOutcomeDeclared || !field(allowedSliceBody, "Runtime-profile claims")) {
    errors.push("The handoff requires both **Target outcome:** and **Runtime-profile claims:** under Allowed Delivery Slice.");
  }
  if (!writableScopes.length) {
    errors.push("The handoff requires at least one **Writable build units:** entry under Allowed Delivery Slice.");
  }
  for (const scope of writableScopes) if (!selectedScopes.includes(scope)) {
    errors.push("Writable build unit " + scope + " is not selected by the handoff.");
  }
  const expected = [...inputIds, ...interactionIds, ...(targetOutcomeDeclared ? ["Target outcome"] : [])];
  const seen = new Map(expected.map((id) => [id, 0]));
  const planningClaim = ["IMPLEMENTATION_DETAILS_READY", "IMPLEMENTATION_DETAILS_PARTIAL"].includes(outcome);

  for (const entry of closure.entries) {
    for (const name of [
      "Covers",
      "Runtime profiles",
      "Implementation situation",
      "Boundary class",
      "Producer observation",
      "Consumer observation",
      "Compared dimensions",
      "Candidate compatibility proof",
      "Evidence provenance",
      "Direct change-impact closure",
      "Required-command effects",
      "Current result",
      "Probe",
      "Evidence",
      "Downstream impact",
    ]) {
      const value = field(entry.body, name);
      if (!value || !meaningful(value) || placeholder(value)) {
        errors.push(entry.id + " lacks a concrete **" + name + ":**.");
      }
    }
    if (!field(entry.body, "Delta owner")) errors.push(entry.id + " is missing **Delta owner:**.");

    const covers = field(entry.body, "Covers") || "";
    const coveredIds = [...new Set([
      ...ids(covers, /INPUT-\d{3}/g),
      ...ids(covers, /INT-\d{3}/g),
      ...(/\bTarget outcome\b/i.test(covers) ? ["Target outcome"] : []),
    ])];
    if (!coveredIds.length) errors.push(entry.id + " **Covers:** must name at least one INPUT-NNN, INT-NNN, or `Target outcome`.");
    for (const id of coveredIds) {
      if (!seen.has(id)) errors.push(entry.id + " covers unknown or out-of-slice obligation " + id + ".");
      else seen.set(id, seen.get(id) + 1);
    }

    for (const name of ["Producer observation", "Consumer observation"]) {
      const observation = statusWithDetail(field(entry.body, name), PHYSICAL_OBSERVATION_STATES);
      if (!observation || !meaningful(observation.detail) || placeholder(observation.detail)) {
        errors.push(entry.id + " **" + name + ":** must use an allowed observation state with concrete detail.");
      } else if (observation.status !== "NOT_APPLICABLE" && !existingLocalLinks(observation.detail, handoffDir).length) {
        errors.push(entry.id + " **" + name + ":** must cite current local producer or consumer evidence.");
      }
    }

    const situation = field(entry.body, "Implementation situation")?.match(/^`([^`]+)`$/)?.[1] || null;
    if (!PHYSICAL_IMPLEMENTATION_SITUATIONS.has(situation)) {
      errors.push(entry.id + " has an invalid **Implementation situation:**.");
    }
    const boundaryClass = field(entry.body, "Boundary class")?.match(/^`([^`]+)`$/)?.[1] || null;
    if (!PHYSICAL_BOUNDARY_CLASSES.has(boundaryClass)) {
      errors.push(entry.id + " has an invalid **Boundary class:**.");
    }

    const candidate = statusWithDetail(field(entry.body, "Candidate compatibility proof"), PHYSICAL_CANDIDATE_STATES);
    if (!candidate || !meaningful(candidate.detail) || placeholder(candidate.detail)) {
      errors.push(entry.id + " **Candidate compatibility proof:** must use an allowed state with concrete detail.");
    }
    const provenance = statusWithDetail(field(entry.body, "Evidence provenance"), PHYSICAL_EVIDENCE_PROVENANCE);
    if (!provenance || !meaningful(provenance.detail) || placeholder(provenance.detail)) {
      errors.push(entry.id + " **Evidence provenance:** must use an allowed state with concrete detail.");
    } else if (!existingLocalLinks(provenance.detail, handoffDir).length) {
      errors.push(entry.id + " **Evidence provenance:** must cite current local evidence outside this handoff.");
    }
    if (situation === "implemented-evolution" && boundaryClass === "protected-machine-interface") {
      const producer = statusWithDetail(field(entry.body, "Producer observation"), PHYSICAL_OBSERVATION_STATES);
      const consumer = statusWithDetail(field(entry.body, "Consumer observation"), PHYSICAL_OBSERVATION_STATES);
      if (producer?.status !== "OBSERVED" || consumer?.status !== "OBSERVED") {
        errors.push(entry.id + " protected implemented evolution requires OBSERVED producer and consumer baselines.");
      }
      if (candidate?.status !== "PASS" || provenance?.status !== "executed-probe") {
        errors.push(entry.id + " protected implemented evolution requires PASS candidate compatibility from `executed-probe` evidence.");
      }
    }

    const impact = String(field(entry.body, "Direct change-impact closure") || "").toLowerCase();
    for (const dimension of PHYSICAL_IMPACT_DIMENSIONS) {
      if (!impact.includes(dimension)) {
        errors.push(entry.id + " **Direct change-impact closure:** must explicitly dispose " + dimension + ".");
      }
    }
    const commandEffects = statusWithDetail(field(entry.body, "Required-command effects"), PHYSICAL_COMMAND_EFFECT_STATES);
    if (!commandEffects || !meaningful(commandEffects.detail) || placeholder(commandEffects.detail)) {
      errors.push(entry.id + " **Required-command effects:** must use CHECKED or NOT_APPLICABLE with concrete detail.");
    } else if (commandEffects.status === "CHECKED" && !existingLocalLinks(commandEffects.detail, handoffDir).length) {
      errors.push(entry.id + " checked command effects must cite current local command or procedure evidence.");
    }
    if (boundaryClass === "required-effectful-command" && commandEffects?.status !== "CHECKED") {
      errors.push(entry.id + " required-effectful-command boundary requires CHECKED command effects.");
    }

    const dimensions = String(field(entry.body, "Compared dimensions") || "").toLowerCase();
    for (const dimension of PHYSICAL_DIMENSIONS) {
      if (!dimensions.includes(dimension)) {
        errors.push(entry.id + " **Compared dimensions:** must explicitly dispose " + dimension + ".");
      }
    }

    const result = field(entry.body, "Current result")?.match(/^`([^`]+)`$/)?.[1] || null;
    if (!PHYSICAL_RESULTS.has(result)) errors.push(entry.id + " has an invalid **Current result:**.");
    const deltaOwner = field(entry.body, "Delta owner") || "";
    const owners = [...new Set(buildUnitScopes(deltaOwner))];
    if (result === "COMPATIBLE" && !isNone(deltaOwner)) {
      errors.push(entry.id + " COMPATIBLE must use `None.` for **Delta owner:**.");
    }
    if (result === "DELTA_OWNED") {
      if (!owners.length) errors.push(entry.id + " DELTA_OWNED must name at least one selected Build Unit in **Delta owner:**.");
      for (const owner of owners) if (!selectedScopes.includes(owner)) {
        errors.push(entry.id + " DELTA_OWNED names unselected owner " + owner + ".");
      }
      for (const owner of owners) if (!writableScopes.includes(owner)) {
        errors.push(entry.id + " DELTA_OWNED names non-writable owner " + owner + ".");
      }
      const producer = statusWithDetail(field(entry.body, "Producer observation"), PHYSICAL_OBSERVATION_STATES);
      const consumer = statusWithDetail(field(entry.body, "Consumer observation"), PHYSICAL_OBSERVATION_STATES);
      if (situation !== "implemented-evolution" && ![producer?.status, consumer?.status].includes("SELECTED_SLICE_OUTPUT")) {
        errors.push(entry.id + " DELTA_OWNED must identify at least one `SELECTED_SLICE_OUTPUT` observation.");
      }
    }
    if (["BLOCKED", "EXCLUDED"].includes(result)) {
      if (!existingLocalLinks(deltaOwner, handoffDir).length) {
        errors.push(entry.id + " " + result + " must link its canonical blocker or exclusion in **Delta owner:**.");
      }
    }
    if (planningClaim && result === "BLOCKED") {
      errors.push(outcome + " cannot contain BLOCKED physical class " + entry.id + ".");
    }
    if (result === "EXCLUDED" && coveredIds.includes("Target outcome")) {
      errors.push(entry.id + " cannot exclude the declared Target outcome from a planning-ready handoff.");
    }

    const evidence = field(entry.body, "Evidence") || "";
    const evidenceLinks = existingLocalLinks(evidence, handoffDir);
    if (!evidenceLinks.length || evidenceLinks.every(({ local }) => local?.resolved === handoffPath)) {
      errors.push(entry.id + " **Evidence:** must cite current local evidence outside this handoff.");
    }
  }

  for (const [id, count] of seen) {
    if (count === 0) errors.push(PHYSICAL_REALIZABILITY_SECTION + " does not cover " + id + ".");
    if (count > 1) errors.push(PHYSICAL_REALIZABILITY_SECTION + " covers " + id + " more than once; assign it to one compatibility class.");
  }

  const physicalReview = field(sectionBody(handoff, "Delivery Slice Realizability Review") || "", "Physical compatibility preflight") || "";
  for (const entry of closure.entries) {
    if (!physicalReview.includes(entry.id)) {
      errors.push("Delivery Slice Realizability Review **Physical compatibility preflight:** must cite " + entry.id + ".");
    }
  }
  return true;
}

function existingLocalLinks(value, baseDir) {
  return linkPaths(value || "", baseDir).filter(({ local }) => local && fs.existsSync(local.resolved));
}

function interactionBindingBody(unit) {
  return unit ? buildUnitSectionBody(unit.content, "Material Interaction Bindings") : null;
}

function evidenceClassValues(value) {
  return [...String(value || "").matchAll(/`([a-z-]+)`/g)].map((match) => match[1]);
}

function statusWithDetail(value, allowed) {
  const match = /^`([^`]+)`\s*(?:—|-)\s*(.+)$/.exec(value || "");
  return match && allowed.has(match[1]) ? { status: match[1], detail: match[2] } : null;
}

function expectedSelectedInteractions(root, buildUnits, selectedScopes, errors) {
  const selectedIds = new Set(selectedScopes.map((scope) => scope.split(":")[1]));
  const expected = new Set();
  const units = [...buildUnits.values()];
  const unitsForResponsibilities = (responsibilities) => new Set(units
    .filter((unit) => unit.sourceResponsibilities.some((id) => responsibilities.includes(id)))
    .map((unit) => unit.id));

  for (const record of readSystemModel(root).contracts.interfaces) {
    const interfaceId = record.frontmatter.id;
    const producers = commaSeparatedIds(record.frontmatter.producers);
    const consumers = commaSeparatedIds(record.frontmatter.consumers);
    const producerUnits = unitsForResponsibilities(producers);
    const consumerUnits = unitsForResponsibilities(consumers);
    const selectedParticipates = [...producerUnits, ...consumerUnits].some((id) => selectedIds.has(id));
    const crossesUnit = [...producerUnits].some((producerId) => [...consumerUnits].some((consumerId) => consumerId !== producerId));
    const crossesExternal = !producers.length || !consumers.length;
    if (!selectedParticipates || (!crossesUnit && !crossesExternal)) continue;

    const interactions = sectionBody(record.text, "Material Interactions");
    if (interactions === null) {
      errors.push(interfaceId + " is relevant to the selected slice but lacks Material Interactions required before Stage 9.");
      continue;
    }
    const actionIds = [...interactions.matchAll(/^###\s+(ACT-\d{3})\s+—\s+.+$/gm)].map((match) => match[1]);
    if (!actionIds.length) {
      const none = field(interactions, "Material interactions");
      if (!/^`?None\.`?\s*(?:—|-)\s*\S+/.test(none || "")) {
        errors.push(interfaceId + " Material Interactions requires ACT entries or a concrete None. disposition before Stage 9.");
      }
      continue;
    }
    for (const actionId of actionIds) expected.add(interfaceId + "." + actionId);
  }
  return expected;
}

// Shared responsibility participation is a conservative inventory, not writable scope.
// Exclusions remain explicit, evidence-backed dispositions; they never waive an
// target, changed action, prerequisite or compatibility obligation of the slice.
function interactionScopeExclusions({ root, handoff, handoffDir, buildUnits, selectedScopes, errors }) {
  const body = subsectionBody(sectionBody(handoff, "Exclusions And Local Discretion") || "", "Interaction Scope Exclusions");
  const excluded = new Set();
  if (body === null) return excluded;
  const header = ["Interaction", "Canonical scope evidence", "Reason"];
  const lines = body.trim().split(/\r?\n/);
  const rows = lines.filter((line) => line.trim().startsWith("|")).map(markdownTableCells);
  if (rows.length < 3 || JSON.stringify(rows[0].map(plainTableCell)) !== JSON.stringify(header)
    || rows[1].length !== 3 || rows[1].some((cell) => !/^:?-{3,}:?$/.test(cell))) {
    errors.push("Interaction Scope Exclusions requires an Interaction / Canonical scope evidence / Reason table with at least one disposition.");
    return excluded;
  }
  const expected = expectedSelectedInteractions(root, buildUnits, selectedScopes, errors);
  const writable = buildUnitScopes(field(sectionBody(handoff, "Allowed Delivery Slice") || "", "Writable build units") || "");
  const writableUnits = writable.map((scope) => buildUnits.get(scope.split(":")[1])).filter(Boolean);
  const interfaces = readSystemModel(root).contracts.interfaces;
  for (const row of rows.slice(2)) {
    const match = /^`(IFACE-\d{3}\.ACT-\d{3})`$/.exec(row[0] || "");
    const id = match?.[1];
    if (row.length !== 3 || !id || !expected.has(id) || excluded.has(id)) {
      errors.push("Interaction Scope Exclusions must name each relevant canonical IFACE.ACT exactly once; invalid or duplicate entry " + (row[0] || "<empty>") + ".");
      continue;
    }
    excluded.add(id);
    const [interfaceId, actionId] = id.split(".");
    const record = interfaces.find((item) => item.frontmatter.id === interfaceId);
    const actionLink = (value) => existingLocalLinks(value, handoffDir).some(({ local }) =>
      local.fragment === actionId.toLowerCase() && record && local.resolved === record.filePath);
    const links = existingLocalLinks(row[1], handoffDir);
    if (!actionLink(row[1]) || !links.some(({ local }) => writableUnits.some((unit) => unit.filePath === local.resolved))
      || !meaningful(row[2]) || placeholder(row[2])) {
      errors.push(id + " exclusion requires its exact canonical action, a writable Build Unit scope source, and a concrete reason why it is not consumed or changed.");
    }
    const slice = sectionBody(handoff, "Allowed Delivery Slice") || "";
    for (const name of ["Target outcome", "Target actions", "Changed actions"]) {
      const value = field(slice, name) || "";
      if (new RegExp("\\b" + escape(id) + "\\b").test(value) || actionLink(value)) {
        errors.push(id + " cannot be excluded: declared " + name + ".");
      }
    }
    for (const input of requiredInputEntries(handoff)?.entries || []) {
      if (new RegExp("\\b" + escape(id) + "\\b").test(input.body) || actionLink(input.body)) {
        errors.push(id + " cannot be excluded: required input " + input.id + " consumes or cites that interaction.");
      }
    }
  }
  const bound = new Set([...expected].filter((id) => writableUnits.some((unit) => interactionBindingRoles(unit, id, errors).length)));
  if ([...excluded].some((id) => bound.has(id)) || field(sectionBody(handoff, "Exclusions And Local Discretion") || "", "Bounded delta scope")) {
    validateBoundedDeltaScope({ handoff, handoffDir, expected, excluded, bound, interfaces, field, sectionBody, existingLocalLinks, errors });
  }
  return excluded;
}

function markdownTableCells(line) {
  const trimmed = String(line || "").trim();
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) return [];
  return trimmed.slice(1, -1).split("|").map((cell) => cell.trim());
}

function plainTableCell(value) {
  return String(value || "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[`*_]/g, "")
    .trim();
}

function parseConsumerCoverageTable(body, errors) {
  const expectedHeader = ["Producer", "Consumer", "Interaction", "Consumer slice", "Shipped seam", "Probe procedure", "Result / proof owner"];
  const lines = String(body || "").split(/\r?\n/);
  const headerIndex = lines.findIndex((line) => {
    const parsed = markdownTableCells(line);
    return parsed.length === expectedHeader.length && parsed.every((cell, index) => plainTableCell(cell) === expectedHeader[index]);
  });
  if (headerIndex < 0) {
    errors.push(CONSUMER_COVERAGE_SECTION + " requires the exact seven-column coverage table.");
    return [];
  }
  const separator = markdownTableCells(lines[headerIndex + 1]);
  if (separator.length !== expectedHeader.length || separator.some((cell) => !/^:?-{3,}:?$/.test(cell))) {
    errors.push(CONSUMER_COVERAGE_SECTION + " requires one Markdown separator cell per column.");
  }
  const rows = [];
  for (let index = headerIndex + 2; index < lines.length; index += 1) {
    const cells = markdownTableCells(lines[index]);
    if (!cells.length) break;
    if (cells.length !== expectedHeader.length) {
      errors.push(CONSUMER_COVERAGE_SECTION + " row " + (index + 1) + " must contain exactly seven columns.");
      continue;
    }
    rows.push({
      producerCell: cells[0],
      consumerCell: cells[1],
      interactionCell: cells[2],
      sliceCell: cells[3],
      seamCell: cells[4],
      probeCell: cells[5],
      resultCell: cells[6],
      line: index + 1,
    });
  }
  return rows;
}

// Only a candidate table row asserts a physical binding. Prose citations and
// explicit exclusions do not; required ownership is checked by interaction closure.
function interactionBindingRoles(unit, interactionId, errors) {
  const body = interactionBindingBody(unit) || "";
  const rows = body.split("\n").filter((line) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) return false;
    const firstCell = trimmed.slice(1).split("|")[0];
    return [...firstCell.matchAll(/\bIFACE-\d{3}\.ACT-\d{3}\b/g)].some((m) => m[0] === interactionId);
  }).map(markdownTableCells);
  // Retain malformed candidate rows (including missing delimiters) for diagnosis.
  if (!rows.length) return [];
  const roleText = String(rows[0][2] || "").replace(/`/g, "").trim().toLowerCase();
  const declared = [...roleText.matchAll(/\b(producer|consumer|verifier)\b/g)];
  const roles = declared.map((match) => match[1]);
  // Qualifiers describe a declared role (e.g. "acknowledgement consumer");
  // they do not turn a consumer/verifier into a producer. Alternatives and
  // negations are not affirmative ownership and must be resolved explicitly.
  const valid = rows.length === 1 && rows[0].length === 7
    && [...String(rows[0][0]).matchAll(/\bIFACE-\d{3}\.ACT-\d{3}\b/g)].length === 1
    && /^[a-z][a-z0-9 ()/,&.-]*$/.test(roleText) && !/[/,&]\s*$/.test(roleText)
    && !/\b(?:not|no|non|or|maybe|either|unknown|unresolved|tbd|todo|optional)\b/.test(roleText)
    && new Set(roles).size === roles.length
    && declared.every((match, i) => !i || /[/,&]|\band\b/.test(roleText.slice(declared[i - 1].index + declared[i - 1][0].length, match.index)))
    && roles.some((value) => value === "producer" || value === "consumer");
  if (!valid) {
    const message = unit.id + ":" + interactionId + " requires one unambiguous action-binding row with an explicit Producer / consumer role (optional verifier).";
    if (!errors.includes(message)) errors.push(message);
    return [];
  }
  return roles;
}

export function expectedKnownConsumerCoverage(root, buildUnits, selectedScopes, sequenceRows, errors) {
  const selectedIds = new Set(selectedScopes.map((scope) => scope.split(":")[1]));
  const units = [...buildUnits.values()];
  const rowsByBuildUnit = new Map();
  for (const row of sequenceRows || []) {
    for (const buildUnit of row.buildUnits || []) {
      if (!rowsByBuildUnit.has(buildUnit)) rowsByBuildUnit.set(buildUnit, []);
      rowsByBuildUnit.get(buildUnit).push(row);
    }
  }
  const unitsFor = (responsibilities, interactionId, role, selectedOnly = false) => units.filter((unit) => {
    if (selectedOnly && !selectedIds.has(unit.id)) return false;
    if (!unit.sourceResponsibilities.some((id) => responsibilities.includes(id))) return false;
    return interactionBindingRoles(unit, interactionId, errors).includes(role);
  });
  const expected = [];

  for (const record of readSystemModel(root).contracts.interfaces) {
    const interfaceId = record.frontmatter.id;
    const interactions = sectionBody(record.text, "Material Interactions") || "";
    const actionIds = [...interactions.matchAll(/^###\s+(ACT-\d{3})\s+—\s+.+$/gm)].map((match) => match[1]);
    const producerResponsibilities = commaSeparatedIds(record.frontmatter.producers);
    const consumerResponsibilities = commaSeparatedIds(record.frontmatter.consumers);
    for (const actionId of actionIds) {
      const interactionId = interfaceId + "." + actionId;
      const selectedProducers = unitsFor(producerResponsibilities, interactionId, "producer", true);
      if (!selectedProducers.length) continue;
      const consumers = unitsFor(consumerResponsibilities, interactionId, "consumer").filter((unit) => /^REPO-\d{3}$/.test(unit.repository || ""));
      for (const producer of selectedProducers) {
        const producerSlices = rowsByBuildUnit.get(producer.id) || [];
        const independentConsumers = consumers.filter((consumer) => {
          if (consumer.id === producer.id) return false;
          const consumerSlices = rowsByBuildUnit.get(consumer.id) || [];
          return consumerSlices.some((consumerRow) => producerSlices.every((producerRow) => consumerRow.slug !== producerRow.slug));
        });
        if (independentConsumers.length < 2) continue;
        for (const consumer of independentConsumers) {
          const consumerSlices = rowsByBuildUnit.get(consumer.id) || [];
          if (consumerSlices.length !== 1) {
            errors.push(CONSUMER_COVERAGE_SECTION + " requires exactly one Handoff Sequence slice for known consumer " + consumer.id + ".");
            continue;
          }
          expected.push({
            producerId: producer.id,
            consumerId: consumer.id,
            interactionId,
            slice: consumerSlices[0].slug,
            consumerPath: consumer.filePath,
          });
        }
      }
    }
  }
  return expected;
}

function validateKnownConsumerCoverage({ root, handoff, handoffDir, buildUnits, selectedScopes, sequenceRows, excludedInteractions, errors }) {
  const review = sectionBody(handoff, "Delivery Slice Realizability Review") || "";
  const coverage = subsectionBody(review, CONSUMER_COVERAGE_SECTION);
  if (coverage === null) {
    errors.push("Delivery Slice Realizability Review is missing required ### " + CONSUMER_COVERAGE_SECTION + ".");
    return;
  }
  const expected = expectedKnownConsumerCoverage(root, buildUnits, selectedScopes, sequenceRows, errors)
    .filter((item) => !excludedInteractions.has(item.interactionId));
  const none = field(coverage, "Known consumer coverage");
  const rows = parseConsumerCoverageTable(coverage, expected.length ? errors : []);
  if (!expected.length) {
    const noneWithEvidence = /^`?None\.`?\s*(?:—|-)\s*\S+/.test(none || "");
    if (!noneWithEvidence || !existingLocalLinks(coverage, handoffDir).length) {
      errors.push(CONSUMER_COVERAGE_SECTION + " must use an evidence-linked **Known consumer coverage:** `None.` declaration when no selected shared producer has multiple independently delivered mapped consumers.");
    }
    if (rows.length) errors.push(CONSUMER_COVERAGE_SECTION + " declares consumer rows outside the derived bounded cohort.");
    return;
  }
  if (none) errors.push(CONSUMER_COVERAGE_SECTION + " cannot declare `None.` when the selected producer has known independently delivered consumers.");
  if (!rows.length) {
    errors.push(CONSUMER_COVERAGE_SECTION + " must enumerate every derived producer-consumer interaction row.");
    return;
  }

  const declared = new Map();
  for (const row of rows) {
    const producerIds = ids(plainTableCell(row.producerCell), /\bBU-\d{3,}\b/g);
    const consumerIds = ids(plainTableCell(row.consumerCell), /\bBU-\d{3,}\b/g);
    const interactionIds = ids(plainTableCell(row.interactionCell), /\bIFACE-\d{3,}\.ACT-\d{3}\b/g);
    const slices = [...plainTableCell(row.sliceCell).matchAll(/\brepo-\d{3}-[a-z0-9]+(?:-[a-z0-9]+)*\b/g)].map((match) => match[0]);
    if (producerIds.length !== 1 || consumerIds.length !== 1 || interactionIds.length !== 1 || slices.length !== 1) {
      errors.push(CONSUMER_COVERAGE_SECTION + " row " + row.line + " must name exactly one producer BU, consumer BU, IFACE.ACT, and consumer slice.");
      continue;
    }
    const key = [producerIds[0], consumerIds[0], interactionIds[0], slices[0]].join("|");
    if (declared.has(key)) errors.push(CONSUMER_COVERAGE_SECTION + " contains duplicate row " + key.replaceAll("|", " -> ") + ".");
    declared.set(key, row);

    const consumer = buildUnits.get(consumerIds[0]);
    const seamLinks = existingLocalLinks(row.seamCell, handoffDir);
    if (!meaningful(row.seamCell) || !consumer || !seamLinks.some(({ local }) => local.resolved === consumer.filePath)) {
      errors.push(CONSUMER_COVERAGE_SECTION + " row " + row.line + " shipped seam must name the physical seam and link consumer " + consumerIds[0] + ".");
    }
    if (!meaningful(row.probeCell) || (!/`[^`]+`/.test(row.probeCell) && !existingLocalLinks(row.probeCell, handoffDir).length)) {
      errors.push(CONSUMER_COVERAGE_SECTION + " row " + row.line + " probe procedure must name an exact command/procedure or link its canonical procedure.");
    }
    const result = statusWithDetail(row.resultCell, new Set(["PASS", "Planned"]));
    if (!result || !meaningful(result.detail) || !existingLocalLinks(result.detail, handoffDir).length) {
      errors.push(CONSUMER_COVERAGE_SECTION + " row " + row.line + " result must be `PASS` or `Planned` with an existing evidence or proof-owner link.");
    }
  }

  for (const item of expected) {
    const key = [item.producerId, item.consumerId, item.interactionId, item.slice].join("|");
    if (!declared.has(key)) {
      errors.push(CONSUMER_COVERAGE_SECTION + " omits " + item.producerId + " -> " + item.consumerId + " for " + item.interactionId + " in " + item.slice + ".");
    }
  }
  const expectedKeys = new Set(expected.map((item) => [item.producerId, item.consumerId, item.interactionId, item.slice].join("|")));
  for (const key of declared.keys()) {
    if (!expectedKeys.has(key)) errors.push(CONSUMER_COVERAGE_SECTION + " declares out-of-cohort row " + key.replaceAll("|", " -> ") + ".");
  }
}

function validateRequiredInteractionClosure({ root, handoff, handoffDir, outcome, buildUnits, selectedScopes, excludedInteractions, errors }) {
  const closure = requiredInteractionEntries(handoff);
  if (closure === null) return;
  const planningClaim = ["IMPLEMENTATION_DETAILS_READY", "IMPLEMENTATION_DETAILS_PARTIAL"].includes(outcome);
  const selectedUnits = selectedScopes.map((scope) => buildUnits.get(scope.split(":")[1])).filter(Boolean);
  const expectedInteractions = expectedSelectedInteractions(root, buildUnits, selectedScopes, errors);
  for (const id of excludedInteractions) expectedInteractions.delete(id);
  for (const unit of selectedUnits) {
    const binding = interactionBindingBody(unit);
    if (binding === null) errors.push(unit.id + " is selected for Stage 9 but lacks Material Interaction Bindings.");
    else if (!binding.trim() || sectionContainsPlaceholder(binding)) errors.push(unit.id + " Material Interaction Bindings contains placeholder content.");
  }

  if (!closure.entries.length) {
    const declaration = field(closure.body, "Required interactions");
    const match = /^`?None\.`?\s*(?:—|-)\s*(.+)$/.exec(declaration || "");
    if (!match) {
      errors.push("Required Interaction Closure must define at least one ### `INT-NNN` entry or an evidence-linked **Required interactions:** `None.` declaration.");
      return;
    }
    if (!existingLocalLinks(match[1], handoffDir).length) {
      errors.push("Required Interaction Closure `None.` declaration must cite existing canonical local evidence.");
    }
    for (const unit of selectedUnits) {
      const binding = interactionBindingBody(unit) || "";
      const none = field(binding, "Material interaction bindings");
      const bindings = [...binding.matchAll(/^\|\s*`(IFACE-\d{3}\.ACT-\d{3})`\s*\|/gm)].map((match) => match[1]);
      if (!/^`?None\.`?\s*(?:—|-)\s*\S+/.test(none || "")
        && (!bindings.length || bindings.some((id) => !excludedInteractions.has(id)))) {
        errors.push(unit.id + " must declare concrete None. Material Interaction Bindings or have every binding explicitly excluded when the handoff declares no required interactions.");
      }
    }
    if (expectedInteractions?.size) {
      errors.push("Required Interaction Closure declares None. but selected-slice Software Design requires: " + [...expectedInteractions].sort().join(", ") + ".");
    }
    return;
  }

  if (field(closure.body, "Required interactions")) {
    errors.push("Required Interaction Closure cannot combine **Required interactions:** with INT entries.");
  }
  if (new Set(closure.entries.map((entry) => entry.id)).size !== closure.entries.length) {
    errors.push("Required Interaction Closure contains duplicate INT identifiers.");
  }
  if (new Set(closure.entries.map((entry) => entry.interactionId)).size !== closure.entries.length) {
    errors.push("Required Interaction Closure contains duplicate IFACE.ACT interactions.");
  }
  if (expectedInteractions) {
    const declared = new Set(closure.entries.map((entry) => entry.interactionId));
    for (const interactionId of expectedInteractions) {
      if (!declared.has(interactionId)) errors.push("Required Interaction Closure omits selected-slice " + interactionId + ".");
    }
    for (const interactionId of declared) {
      if (!expectedInteractions.has(interactionId)) errors.push("Required Interaction Closure declares " + interactionId + " outside the selected slice's material cross-unit or external interfaces.");
    }
  }

  const interactionReview = field(sectionBody(handoff, "Delivery Slice Realizability Review") || "", "Interaction closure") || "";
  for (const entry of closure.entries) {
    for (const name of REQUIRED_INTERACTION_FIELDS) {
      if (!field(entry.body, name)) errors.push(entry.id + " is missing **" + name + ":**.");
    }
    if (!interactionReview.includes(entry.id)) errors.push("Interaction closure must summarize " + entry.id + ".");

    const consumerField = field(entry.body, "Consumer") || "";
    const consumerScopes = buildUnitScopes(consumerField);
    const consumerScope = consumerScopes.length === 1 ? consumerScopes[0] : null;
    const consumer = consumerScope ? buildUnits.get(consumerScope.split(":")[1]) : null;
    const externalConsumer = /^`External`\s+—\s+\S/.test(consumerField) && consumerScopes.length === 0;
    if (externalConsumer) {
      // External audience is distinct from a selected first-party verification owner.
    } else if (!consumerScope || !/^`BUILD_UNIT:BU-\d{3,}`$/.test(consumerField)) {
      errors.push(entry.id + " **Consumer:** must name exactly one code-formatted BUILD_UNIT:BU-xxx or `External` — named actor/system with its canonical action link.");
    } else if (!consumer) {
      errors.push(entry.id + " names unknown consumer " + consumerScope + ".");
    } else if (!selectedScopes.includes(consumerScope)) {
      errors.push(entry.id + " consumer " + consumerScope + " must be selected in the delivery slice.");
    } else if (!interactionBindingRoles(consumer, entry.interactionId, errors).includes("consumer")) {
      errors.push(entry.id + " consumer " + consumerScope + " Material Interaction Bindings must name " + entry.interactionId + " in a valid consumer action-binding row.");
    }

    const producerField = field(entry.body, "Producer") || "";
    const producerScopes = buildUnitScopes(producerField);
    const producerScope = producerScopes.length === 1 ? producerScopes[0] : null;
    const externalProducer = /^`?External`?(?:\s|$)/.test(producerField);
    const producer = producerScope ? buildUnits.get(producerScope.split(":")[1]) : null;
    if ((!producerScope && !externalProducer) || producerScopes.length > 1) {
      errors.push(entry.id + " **Producer:** must name exactly one BUILD_UNIT:BU-xxx with its canonical link, or `External`.");
    } else if (producerScope && !producer) {
      errors.push(entry.id + " names unknown producer " + producerScope + ".");
    } else if (producer) {
      if (!existingLocalLinks(producerField, handoffDir).some(({ local }) => local.resolved === producer.filePath)) {
        errors.push(entry.id + " **Producer:** must link the canonical record for " + producerScope + ".");
      }
      if (!interactionBindingRoles(producer, entry.interactionId, errors).includes("producer")) {
        errors.push(entry.id + " producer " + producerScope + " Material Interaction Bindings must name " + entry.interactionId + " in a valid producer action-binding row.");
      }
    }

    const requiredAt = codeFieldValue(entry.body, "Required at", INTERACTION_STAGES);
    if (!requiredAt) errors.push(entry.id + " has an invalid **Required at:** stage.");
    const kind = codeFieldValue(entry.body, "Interaction kind", INTERACTION_KINDS);
    if (!kind) errors.push(entry.id + " has an invalid **Interaction kind:**.");
    const availability = codeFieldValue(entry.body, "Availability", INTERACTION_AVAILABILITIES);
    if (!availability) errors.push(entry.id + " has an invalid **Availability:**.");
    if (planningClaim && availability === "missing") errors.push(outcome + " cannot claim readiness while " + entry.id + " is missing.");
    if (availability === "selected-slice output" && (!producerScope || !selectedScopes.includes(producerScope))) {
      errors.push(entry.id + " selected-slice output must be produced by a selected Build Unit.");
    }
    if (availability === "selected-slice output" && producerScope
      && !buildUnitScopes(field(sectionBody(handoff, "Allowed Delivery Slice") || "", "Writable build units") || "").includes(producerScope)) {
      errors.push(entry.id + " selected-slice output must have a writable producer; selected read-only membership grants no production authority.");
    }

    const gated = availability === "later-lifecycle output";
    const ownerField = field(entry.body, "Proof owner") || "";
    const ownerScopes = buildUnitScopes(ownerField);
    const ownerScope = ownerScopes.length === 1 ? ownerScopes[0] : null;
    const proofOwner = ownerScope ? buildUnits.get(ownerScope.split(":")[1]) : null;
    if (externalConsumer || gated || ownerField) {
      if (!proofOwner || !/^REPO-\d{3}$/.test(proofOwner.repository || "") || !selectedScopes.includes(ownerScope)
        || !existingLocalLinks(ownerField, handoffDir).some(({ local }) => local.resolved === proofOwner.filePath)
        || !interactionBindingRoles(proofOwner, entry.interactionId, errors).some((role) => ["producer", "consumer", "verifier"].includes(role))) {
        errors.push(entry.id + " Proof owner must link one selected Build Unit with an explicit relevant action binding; ownership of proof grants no actor role or writable scope.");
      }
    }
    let evidenceAvailability = availability;
    if (gated) {
      const inputs = requiredInputEntries(handoff)?.entries || [];
      const gateId = /^`(LGATE-\d{3})`$/.exec(field(entry.body, "Later-lifecycle gate") || "")?.[1];
      const gate = laterLifecycleGateEntries(handoff)?.find((item) => item.id === gateId);
      if (!LATER_LIFECYCLE_STAGES.has(requiredAt) || !gate || field(gate.body, "Consumed at") !== "`" + requiredAt + "`") {
        errors.push(entry.id + " later-lifecycle interaction must reference an existing LGATE with the same later Required at stage; it cannot satisfy Implementation, Build, or Verification.");
      }
      const referencedInputs = (name) => {
        const value = field(entry.body, name) || "";
        const ids = [...value.matchAll(/`(INPUT-\d{3})`/g)].map((match) => match[1]);
        if (new Set(ids).size !== ids.length || ids.some((id) => !inputs.some((input) => input.id === id))) {
          errors.push(entry.id + " " + name + " must reference existing INPUT identities exactly once.");
        }
        return ids.map((id) => inputs.find((input) => input.id === id)).filter(Boolean);
      };
      const lifecycleInputs = referencedInputs("Lifecycle inputs");
      if (!lifecycleInputs.length || lifecycleInputs.some((input) =>
        field(input.body, "Availability") !== "`later-lifecycle output`"
        || field(input.body, "Later-lifecycle gate") !== "`" + gateId + "`"
        || field(input.body, "Consumed at") !== "`" + requiredAt + "`"
        || (externalProducer ? !/^`?External`?(?:\s|$)/.test(field(input.body, "Produced by") || "")
          : !buildUnitScopes(field(input.body, "Produced by") || "").includes(producerScope)))) {
        errors.push(entry.id + " Lifecycle inputs must retain the same producer, later consumption stage and LGATE; no new deferral or authority can be inferred.");
      }
      const currentInputs = referencedInputs("Current-profile inputs");
      if (!currentInputs.length && !isNone(field(entry.body, "Current-profile inputs") || "")) {
        errors.push(entry.id + " Current-profile inputs must name existing INPUT records or explicit None. with justification in Current-profile verification.");
      }
      if (currentInputs.some((input) => !EARLY_INPUT_STAGES.has(codeFieldValue(input.body, "Consumed at", INPUT_CONSUMPTION_STAGES))
        || !["`selected-slice output`", "`verified existing input`"].includes(field(input.body, "Availability")))) {
        errors.push(entry.id + " current-profile implementation/build/verification inputs must be available or owned selected outputs; later or missing inputs cannot be deferred.");
      }
      const profile = field(entry.body, "Current-profile verification") || "";
      if (!meaningful(profile) || !existingLocalLinks(profile, handoffDir).length) {
        errors.push(entry.id + " Current-profile verification must link the approved bounded profile, substitute/acquisition, proof and authority limits; fixture evidence is not provider evidence.");
      }
      evidenceAvailability = codeFieldValue(entry.body, "Current-profile availability", new Set(["selected-slice output", "verified existing interaction"]));
      if (!evidenceAvailability) errors.push(entry.id + " requires a valid Current-profile availability independent of future provider availability.");
      if (evidenceAvailability === "verified existing interaction" && currentInputs.some((input) => field(input.body, "Availability") !== "`verified existing input`")) {
        errors.push(entry.id + " verified current-profile proof cannot depend on an unproduced selected-slice input.");
      }
      const writable = buildUnitScopes(field(sectionBody(handoff, "Allowed Delivery Slice") || "", "Writable build units") || "");
      if (evidenceAvailability === "selected-slice output" && !writable.includes(ownerScope)) {
        errors.push(entry.id + " planned current-profile output must have an already writable selected proof owner; proof ownership does not expand scope.");
      }
    } else {
      for (const name of ["Later-lifecycle gate", "Lifecycle inputs", "Current-profile inputs", "Current-profile availability", "Current-profile verification"]) {
        if (field(entry.body, name) && !isNone(field(entry.body, name))) errors.push(entry.id + " " + name + " applies only to later-lifecycle output; it cannot excuse a missing current interaction.");
      }
    }

    const logicalContract = field(entry.body, "Logical contract") || "";
    const logicalLinks = existingLocalLinks(logicalContract, handoffDir);
    const [interfaceId, actionId] = entry.interactionId.split(".");
    const logicalMatch = logicalLinks.some(({ local }) => {
      const source = read(local.resolved);
      return local.fragment === actionId.toLowerCase()
        && new RegExp("\\b" + escape(interfaceId) + "\\b").test(source)
        && new RegExp("^###\\s+" + escape(actionId) + "\\s+—", "m").test(source);
    });
    if (!logicalContract.includes(entry.interactionId) || !logicalMatch) {
      errors.push(entry.id + " **Logical contract:** must link the exact canonical " + entry.interactionId + " heading.");
    }

    const citesAction = (value) => existingLocalLinks(value, handoffDir).some(({ local }) =>
      logicalLinks.some((link) => link.local.resolved === local.resolved && link.local.fragment === local.fragment && local.fragment === actionId.toLowerCase()));
    if (externalConsumer && !citesAction(consumerField)) errors.push(entry.id + " External consumer must link its canonical actor/action authority.");
    if (gated && externalProducer && (!/^`External`\s+—\s+\S/.test(producerField) || !citesAction(producerField))) {
      errors.push(entry.id + " gated External producer must name its independent authority and link the exact canonical action; observation/proof ownership is not publication authority.");
    }

    const physicalBinding = field(entry.body, "Physical binding") || "";
    const relevantBindingPaths = new Set([consumer?.filePath, producer?.filePath, proofOwner?.filePath].filter(Boolean));
    if (!meaningful(physicalBinding) || !existingLocalLinks(physicalBinding, handoffDir).some(({ local }) => relevantBindingPaths.has(local.resolved))) {
      errors.push(entry.id + " **Physical binding:** must name the concrete seam and link a relevant Build Unit binding.");
    }
    const consumerPath = field(entry.body, "Consumer path") || "";
    if (!meaningful(consumerPath) || (externalConsumer
      ? !proofOwner || !citesAction(consumerPath) || !existingLocalLinks(consumerPath, handoffDir).some(({ local }) => local.resolved === proofOwner.filePath)
      : !consumer || !existingLocalLinks(consumerPath, handoffDir).some(({ local }) => local.resolved === consumer.filePath))) {
      errors.push(entry.id + " **Consumer path:** must name the concrete consumer seam and link its Build Unit.");
    }

    const evidenceValue = field(entry.body, "Required evidence classes") || "";
    const evidenceClasses = evidenceClassValues(evidenceValue);
    if (!evidenceClasses.length || new Set(evidenceClasses).size !== evidenceClasses.length
      || evidenceClasses.some((value) => !INTERACTION_EVIDENCE_CLASSES.has(value))) {
      errors.push(entry.id + " has invalid or duplicate **Required evidence classes:**.");
    }
    for (const requiredClass of ["existence", "behavioral", "consumer-fitness"]) {
      if (!evidenceClasses.includes(requiredClass)) errors.push(entry.id + " must require evidence class `" + requiredClass + "`.");
    }
    if (kind && MACHINE_INTERACTION_KINDS.has(kind) && !evidenceClasses.includes("structural-conformance")) {
      errors.push(entry.id + " machine-consumable interaction must require evidence class `structural-conformance`.");
    }
    if (evidenceAvailability === "verified existing interaction" && !evidenceClasses.includes("identity-freshness")) {
      errors.push(entry.id + " verified existing interaction must require evidence class `identity-freshness`.");
    }

    const fitnessEvidence = field(entry.body, "Fitness evidence") || "";
    if (!meaningful(fitnessEvidence) || !existingLocalLinks(fitnessEvidence, handoffDir).length) {
      errors.push(entry.id + " **Fitness evidence:** must cite a current local evidence or selected-slice proof owner link.");
    }
    const conformance = statusWithDetail(field(entry.body, "Representation conformance"), new Set(["Verified", "Planned", "Not applicable"]));
    if (!conformance || !meaningful(conformance.detail)) {
      errors.push(entry.id + " has an invalid **Representation conformance:** disposition.");
    } else {
      if (["Verified", "Planned"].includes(conformance.status) && !existingLocalLinks(conformance.detail, handoffDir).length) {
        errors.push(entry.id + " Representation conformance " + conformance.status + " disposition must cite an existing local link.");
      }
      if (kind && MACHINE_INTERACTION_KINDS.has(kind) && conformance.status === "Not applicable") {
        errors.push(entry.id + " machine-consumable interaction cannot mark Representation conformance Not applicable.");
      }
      const justifiedNonMachineException = conformance.status === "Not applicable" && kind && !MACHINE_INTERACTION_KINDS.has(kind);
      if (evidenceAvailability === "verified existing interaction" && conformance.status !== "Verified" && !justifiedNonMachineException) {
        errors.push(entry.id + " verified existing interaction requires Verified representation conformance.");
      }
    }

    const challenge = statusWithDetail(field(entry.body, "Consumer challenge"), new Set(["PASS", "Planned"]));
    if (!challenge || !meaningful(challenge.detail) || !existingLocalLinks(challenge?.detail, handoffDir).length) {
      errors.push(entry.id + " **Consumer challenge:** must state PASS or Planned with a concrete local evidence/proof-owner link.");
    } else if (evidenceAvailability === "verified existing interaction" && challenge.status !== "PASS") {
      errors.push(entry.id + " verified existing interaction requires a fresh independent consumer-side PASS challenge.");
    }

    const risk = codeFieldValue(entry.body, "Risk", new Set(["ordinary", "high"]));
    if (!risk) errors.push(entry.id + " has an invalid **Risk:**.");
    const matrix = field(entry.body, "High-risk verification matrix") || "";
    if (risk === "ordinary" && !isNone(matrix)) {
      errors.push(entry.id + " ordinary risk must use `None.` for **High-risk verification matrix:**.");
    } else if (risk === "high") {
      if (!existingLocalLinks(matrix, handoffDir).length
        || !/(?:positive|success|happy path)/i.test(matrix)
        || !/(?:rejection|denial|forbidden|unauthori[sz]ed|invalid)/i.test(matrix)
        || !/(?:failure|recovery|retry|unavailable|timeout)/i.test(matrix)) {
        errors.push(entry.id + " high risk requires a linked matrix with positive, rejection/denial, and failure/recovery cases.");
      }
    }
  }
}

function addGraphEdge(graph, from, to) {
  if (!graph.has(from)) graph.set(from, new Set());
  graph.get(from).add(to);
  if (!graph.has(to)) graph.set(to, new Set());
}

function firstDirectedCycle(graph) {
  const state = new Map();
  const stack = [];
  const visit = (node) => {
    state.set(node, 1);
    stack.push(node);
    for (const next of graph.get(node) || []) {
      if (state.get(next) === 1) {
        const start = stack.indexOf(next);
        return [...stack.slice(start), next];
      }
      if (!state.has(next)) {
        const cycle = visit(next);
        if (cycle) return cycle;
      }
    }
    stack.pop();
    state.set(node, 2);
    return null;
  };
  for (const node of graph.keys()) {
    if (!state.has(node)) {
      const cycle = visit(node);
      if (cycle) return cycle;
    }
  }
  return null;
}

function validateRequiredInputLedger({ handoff, handoffDir, outcome, buildUnits, selectedScopes, errors }) {
  const ledger = requiredInputEntries(handoff);
  if (ledger === null) return;
  const planningClaim = ["IMPLEMENTATION_DETAILS_READY", "IMPLEMENTATION_DETAILS_PARTIAL"].includes(outcome);
  if (!ledger.entries.length) {
    const noneDeclaration = field(ledger.body, "Required inputs");
    const match = /^`?None\.`?\s*(?:—|-)\s*(.+)$/.exec(noneDeclaration || "");
    if (!match) {
      errors.push("Required Input Ledger must define at least one ### `INPUT-NNN` entry or an evidence-linked **Required inputs:** `None.` declaration.");
      return;
    }
    const links = linkPaths(match[1], handoffDir).filter(({ local }) => local && fs.existsSync(local.resolved));
    if (!links.length) errors.push("Required Input Ledger `None.` declaration must cite existing canonical local evidence.");
    return;
  }

  if (field(ledger.body, "Required inputs")) {
    errors.push("Required Input Ledger cannot combine **Required inputs:** with INPUT entries.");
  }
  if (new Set(ledger.entries.map((entry) => entry.id)).size !== ledger.entries.length) {
    errors.push("Required Input Ledger contains duplicate INPUT identifiers.");
  }

  const inputReview = field(sectionBody(handoff, "Delivery Slice Realizability Review") || "", "Required-input closure") || "";
  const gateIds = new Set((laterLifecycleGateEntries(handoff) || []).map((entry) => entry.id));
  const graph = new Map();
  const graphBuildUnits = new Set();

  for (const entry of ledger.entries) {
    for (const name of REQUIRED_INPUT_FIELDS) {
      if (!field(entry.body, name)) errors.push(entry.id + " is missing **" + name + ":**.");
    }
    if (!inputReview.includes(entry.id)) errors.push("Required-input closure must summarize " + entry.id + ".");

    const consumerField = field(entry.body, "Consumer") || "";
    const consumers = buildUnitScopes(consumerField);
    const consumerScope = consumers.length === 1 ? consumers[0] : null;
    if (!consumerScope || !/^`BUILD_UNIT:BU-\d{3,}`$/.test(consumerField)) {
      errors.push(entry.id + " **Consumer:** must name exactly one code-formatted BUILD_UNIT:BU-xxx.");
    } else if (!buildUnits.has(consumerScope.split(":")[1])) {
      errors.push(entry.id + " consumes an unknown " + consumerScope + ".");
    }

    const consumedAt = codeFieldValue(entry.body, "Consumed at", INPUT_CONSUMPTION_STAGES);
    if (!consumedAt) errors.push(entry.id + " has an invalid **Consumed at:** stage.");
    const inputKind = codeFieldValue(entry.body, "Input kind", INPUT_KINDS);
    if (!inputKind) errors.push(entry.id + " has an invalid **Input kind:**.");
    const producedAt = codeFieldValue(entry.body, "Produced at", INPUT_PRODUCER_STAGES);
    if (!producedAt) errors.push(entry.id + " has an invalid **Produced at:** stage.");
    const availability = codeFieldValue(entry.body, "Availability", INPUT_AVAILABILITIES);
    if (!availability) errors.push(entry.id + " has an invalid **Availability:**.");
    const maturity = codeFieldValue(entry.body, "Maturity", INPUT_MATURITIES);
    if (!maturity) errors.push(entry.id + " has an invalid **Maturity:**.");

    const producerField = field(entry.body, "Produced by") || "";
    const producers = buildUnitScopes(producerField);
    const producerScope = producers.length === 1 ? producers[0] : null;
    const externalProducer = /^`?External`?(?:\s|$)/.test(producerField);
    if ((!producerScope && !externalProducer) || producers.length > 1) {
      errors.push(entry.id + " **Produced by:** must name exactly one BUILD_UNIT:BU-xxx with its canonical link, or `External`.");
    } else if (producerScope) {
      const producer = buildUnits.get(producerScope.split(":")[1]);
      if (!producer) {
        errors.push(entry.id + " names unknown producer " + producerScope + ".");
      } else if (!linkPaths(producerField, handoffDir).some(({ local }) => local?.resolved === producer.filePath)) {
        errors.push(entry.id + " **Produced by:** must link the canonical record for " + producerScope + ".");
      }
    }

    const repositoryValue = field(entry.body, "Producer repository")?.match(/^`([^`]+)`$/)?.[1] || null;
    if (!repositoryValue || !/^(?:REPO-\d{3,}|External)$/.test(repositoryValue)) {
      errors.push(entry.id + " **Producer repository:** must select one REPO-xxx identifier or `External`.");
    } else if (producerScope) {
      const expectedRepository = buildUnits.get(producerScope.split(":")[1])?.repository;
      const normalizedExpected = meaningful(expectedRepository) ? expectedRepository : "External";
      if (repositoryValue !== normalizedExpected) {
        errors.push(entry.id + " producer repository must match " + producerScope + " repository " + normalizedExpected + ".");
      }
    }

    const evidence = field(entry.body, "Evidence") || "";
    if (!meaningful(evidence) || placeholder(evidence)) {
      errors.push(entry.id + " lacks concrete current **Evidence:**.");
    } else if (!linkPaths(evidence, handoffDir).some(({ local }) => local && fs.existsSync(local.resolved))) {
      errors.push(entry.id + " **Evidence:** must cite an existing local delivery, registry, fixture, or canonical owner receipt.");
    }

    const gateField = field(entry.body, "Later-lifecycle gate") || "";
    const gateMatch = /^`(LGATE-\d{3})`$/.exec(gateField);
    if (availability === "later-lifecycle output") {
      if (!consumedAt || !LATER_LIFECYCLE_STAGES.has(consumedAt)) {
        errors.push(entry.id + " later-lifecycle output cannot satisfy Implementation, Build, or Verification.");
      }
      if (!gateMatch || !gateIds.has(gateMatch[1])) {
        errors.push(entry.id + " later-lifecycle output must reference an existing LGATE-NNN.");
      }
    } else if (!isNone(gateField)) {
      errors.push(entry.id + " must use `None.` for **Later-lifecycle gate:** unless availability is `later-lifecycle output`.");
    }

    if (availability === "selected-slice output") {
      if (!producerScope || !selectedScopes.includes(producerScope)) {
        errors.push(entry.id + " selected-slice output must be produced by a selected Build Unit.");
      }
      if (producerScope && !buildUnitScopes(field(sectionBody(handoff, "Allowed Delivery Slice") || "", "Writable build units") || "").includes(producerScope)) {
        errors.push(entry.id + " selected-slice output must have a writable producer; selected read-only membership grants no production authority.");
      }
      if (["Existing", "External"].includes(producedAt)) {
        errors.push(entry.id + " selected-slice output must name a selected lifecycle producer stage.");
      }
    }
    if (planningClaim && availability === "missing") {
      errors.push(outcome + " cannot claim readiness while " + entry.id + " is missing.");
    }
    if (planningClaim && EARLY_INPUT_STAGES.has(consumedAt) && availability === "later-lifecycle output") {
      errors.push(outcome + " cannot use later-lifecycle " + entry.id + " during " + consumedAt + ".");
    }
    if (planningClaim && availability === "verified existing input" && maturity !== "verified") {
      errors.push(outcome + " requires " + entry.id + " verified existing input to have `verified` maturity, not `" + (maturity || "invalid") + "`.");
    }

    const artifactReceiptRequired = inputKind === "Immutable artifact" && availability === "verified existing input";
    if (artifactReceiptRequired) {
      for (const name of ["Artifact identity", "Source revision", "Integrity", "Resolution check", "Authorized access check"]) {
        const value = field(entry.body, name);
        if (!meaningful(value) || placeholder(value) || isNone(value)) {
          errors.push(entry.id + " verified immutable artifact requires a concrete **" + name + ":** receipt.");
        }
      }
      const revision = field(entry.body, "Source revision") || "";
      if (!/[0-9a-f]{7,64}/i.test(revision)) errors.push(entry.id + " **Source revision:** must include an exact revision identifier.");
      const integrity = field(entry.body, "Integrity") || "";
      if (!/(?:sha(?:256|384|512)[:=-]|integrity\b)/i.test(integrity)) errors.push(entry.id + " **Integrity:** must include an exact digest or integrity value.");
      for (const name of ["Resolution check", "Authorized access check"]) {
        const value = field(entry.body, name) || "";
        if (!linkPaths(value, handoffDir).some(({ local }) => local && fs.existsSync(local.resolved))) {
          errors.push(entry.id + " **" + name + ":** must cite current local evidence.");
        }
      }
    }

    if (consumerScope && producerScope && consumedAt && INPUT_CONSUMPTION_STAGES.has(producedAt)) {
      const consumerNode = consumerScope + "@" + consumedAt;
      const producerNode = producerScope + "@" + producedAt;
      addGraphEdge(graph, consumerNode, producerNode);
      graphBuildUnits.add(consumerScope);
      graphBuildUnits.add(producerScope);
    }
  }

  for (const scope of graphBuildUnits) {
    for (let index = 1; index < INPUT_LIFECYCLE_ORDER.length; index += 1) {
      addGraphEdge(
        graph,
        scope + "@" + INPUT_LIFECYCLE_ORDER[index],
        scope + "@" + INPUT_LIFECYCLE_ORDER[index - 1],
      );
    }
  }
  const cycle = firstDirectedCycle(graph);
  if (cycle) errors.push("Temporal required-input cycle detected: " + cycle.join(" -> ") + ".");
}

function laterLifecycleGateEntries(handoff) {
  const body = sectionBody(handoff, "Later-Lifecycle Gates");
  if (body === null) return null;
  const matches = [...body.matchAll(/^###\s+`?(LGATE-\d{3})`?\s+—\s+.+$/gm)];
  return matches.map((match, index) => ({
    id: match[1],
    body: body.slice(match.index, matches[index + 1]?.index).trim(),
  }));
}

function validateLaterLifecycleGates({ handoff, handoffDir, errors }) {
  const entries = laterLifecycleGateEntries(handoff);
  if (entries === null) return;
  if (!entries.length) {
    errors.push("Later-Lifecycle Gates exists but defines no ### `LGATE-NNN` entry.");
    return;
  }
  if (new Set(entries.map((entry) => entry.id)).size !== entries.length) {
    errors.push("Later-Lifecycle Gates contains duplicate LGATE identifiers.");
  }
  for (const entry of entries) {
    const consumedAt = field(entry.body, "Consumed at")?.match(/^`([^`]+)`$/)?.[1] || null;
    if (!LATER_LIFECYCLE_STAGES.has(consumedAt)) {
      errors.push(entry.id + " must select `Release`, `Deployment`, `Activation`, or `Operation` in **Consumed at:**.");
    }
    const producedBy = field(entry.body, "Produced by");
    if (!meaningful(producedBy) || placeholder(producedBy)) errors.push(entry.id + " lacks a concrete **Produced by:**.");
    const producerLinks = linkPaths(producedBy || "", handoffDir).filter(({ local }) => local && fs.existsSync(local.resolved));
    if (!producerLinks.length) errors.push(entry.id + " **Produced by:** must cite an existing canonical local link.");
    for (const name of ["Gate condition", "Verification", "Until satisfied"]) {
      const value = field(entry.body, name);
      if (!meaningful(value) || placeholder(value)) errors.push(entry.id + " lacks a concrete **" + name + ":**.");
    }
  }
  const inputReview = field(sectionBody(handoff, "Delivery Slice Realizability Review") || "", "Required-input closure") || "";
  const ledgerEntries = requiredInputEntries(handoff)?.entries || [];
  for (const entry of entries) {
    if (!inputReview.includes(entry.id)) errors.push("Required-input closure must classify " + entry.id + " by lifecycle consumption stage.");
    if (!ledgerEntries.some((input) => field(input.body, "Later-lifecycle gate") === "`" + entry.id + "`")) {
      errors.push(entry.id + " must be referenced by one later-lifecycle INPUT-NNN entry.");
    }
  }
}

function pathWithin(root, target) {
  const relative = path.relative(root, target);
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative);
}

function validateRepositoryContractCoverage(record, label, errors) {
  const body = repositorySectionBody(record.content, "Repository Contract Coverage");
  if (body === null) {
    errors.push(label + " is missing ## Repository Contract Coverage.");
    return;
  }
  if (!body || sectionContainsPlaceholder(body)) {
    errors.push(label + " ## Repository Contract Coverage contains placeholder content.");
    return;
  }

  const found = new Map();
  for (const rawLine of body.split(/\r?\n/)) {
    const laneMatch = /^\s*-\s*`?([a-z0-9-]+)`?\s*:\s*(.+?)\s*$/.exec(rawLine);
    if (!laneMatch || !REPOSITORY_CONTRACT_LANES.includes(laneMatch[1])) continue;
    const lane = laneMatch[1];
    if (found.has(lane)) {
      errors.push(label + " lists repository contract lane " + lane + " more than once.");
      continue;
    }
    const dispositionMatch = /^`?(inherited|resolved|adapted|not applicable)`?\s*(?:[—-]\s*(.*))?$/i.exec(laneMatch[2]);
    if (!dispositionMatch || !REPOSITORY_CONTRACT_DISPOSITIONS.has(dispositionMatch[1].toLowerCase())) {
      errors.push(label + " repository contract lane " + lane + " must use inherited, resolved, adapted, or not applicable.");
      continue;
    }
    const disposition = dispositionMatch[1].toLowerCase();
    const detail = String(dispositionMatch[2] || "").trim();
    const sourceLink = linkRecords(detail, path.dirname(record.filePath)).find(({ local }) => local && fs.existsSync(local.resolved));
    if (!sourceLink) errors.push(label + " repository contract lane " + lane + " must link its source ticket or authoritative rule.");
    if (["adapted", "not applicable"].includes(disposition)) {
      if (!/\bReason\s*:/i.test(detail)) errors.push(label + " repository contract lane " + lane + " must state its reason.");
      if (!/\bAffected scope\s*:/i.test(detail)) errors.push(label + " repository contract lane " + lane + " must state its affected scope.");
      if (!/\b(?:Verification|Revisit)\s*:/i.test(detail)) errors.push(label + " repository contract lane " + lane + " must state its verification or revisit condition.");
    }
    found.set(lane, disposition);
  }

  for (const lane of REPOSITORY_CONTRACT_LANES) {
    if (!found.has(lane)) errors.push(label + " is missing repository contract lane " + lane + ".");
  }
}

function validateVersionControlPolicy(record, label, errors) {
  const body = repositorySectionBody(record.content, "Version-Control And Generated-File Policy");
  if (body === null) {
    errors.push(label + " is missing ## Version-Control And Generated-File Policy.");
    return;
  }
  if (!body || sectionContainsPlaceholder(body)) {
    errors.push(label + " ## Version-Control And Generated-File Policy contains placeholder content.");
    return;
  }
  for (const name of VERSION_CONTROL_POLICY_FIELDS) {
    const matches = [...body.matchAll(new RegExp("^\\*\\*" + escape(name) + ":\\*\\*\\s*(.+)$", "gm"))];
    if (matches.length !== 1) {
      errors.push(label + " version-control policy must contain exactly one **" + name + ":** field.");
    } else if (!meaningful(matches[0][1]) || placeholder(matches[0][1])) {
      errors.push(label + " version-control policy **" + name + ":** must be concrete.");
    }
  }
}

function validateAgentGuidanceProjection(record, layout, label, errors) {
  const body = repositorySectionBody(record.content, "Agent Guidance Projection");
  if (body === null) {
    errors.push(label + " is missing ## Agent Guidance Projection.");
    return;
  }
  if (!body || sectionContainsPlaceholder(body)) {
    errors.push(label + " ## Agent Guidance Projection contains placeholder content.");
    return;
  }

  const guidanceRoot = path.dirname(record.filePath);
  const guidanceLinks = linkRecords(body, path.dirname(record.filePath))
    .filter(({ local }) => local && pathWithin(guidanceRoot, local.resolved));
  if (guidanceLinks.length !== 1) {
    errors.push(label + " must link exactly one sibling agent-guidance.md artifact.");
    return;
  }

  const guidancePath = guidanceLinks[0].local.resolved;
  const guidanceFilename = path.basename(guidancePath).toLowerCase();
  if (guidanceFilename !== "agent-guidance.md" || guidancePath !== path.join(path.dirname(record.filePath), "agent-guidance.md")) {
    errors.push(label + " must link its sibling agent-guidance.md artifact.");
  }
  if (!fs.existsSync(guidancePath)) {
    errors.push(label + " derived agent guidance does not exist: " + rel(layout.root, guidancePath) + ".");
    return;
  }

  const guidance = read(guidancePath);
  const guidanceLabel = rel(layout.root, guidancePath);
  validateSections({ text: guidance, headings: REQUIRED_AGENT_GUIDANCE_SECTIONS, label: guidanceLabel, errors });
  if (!/maintainability-agent-guidance-baseline(?!-[a-z0-9])/.test(guidance)) {
    errors.push(guidanceLabel + " must identify maintainability-agent-guidance-baseline.");
  }
  const canonicalSources = sectionBody(guidance, "Canonical Sources") || "";
  if (!linkRecords(canonicalSources, path.dirname(guidancePath)).some(({ local }) => local?.resolved === record.filePath)) {
    errors.push(guidanceLabel + " must link its canonical Repository Build Design.");
  }
}

function sameIds(left, right) {
  const normalized = (values) => [...new Set(values)].sort();
  return JSON.stringify(normalized(left)) === JSON.stringify(normalized(right));
}

function rel(root, filePath) {
  return path.relative(root, filePath).split(path.sep).join("/");
}

function links(text) {
  const result = [];
  const matcher = /!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  let match;
  while ((match = matcher.exec(text))) result.push(match[1].replace(/^<|>$/g, ""));
  return result;
}

function linkRecords(text, baseDir) {
  const result = [];
  const matcher = /!?\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  let match;
  while ((match = matcher.exec(text))) {
    const target = match[2].replace(/^<|>$/g, "");
    result.push({ label: match[1].trim(), target, local: localLink(baseDir, target) });
  }
  return result;
}

function localLink(baseDir, target) {
  if (/^(?:[a-z]+:|\/\/)/i.test(target)) return null;
  const [filePart, fragment = ""] = target.split("#", 2);
  return { resolved: path.resolve(baseDir, filePart || "."), fragment: fragment.toLowerCase() };
}

function linkPaths(text, baseDir) {
  return links(text).map((target) => ({ target, local: localLink(baseDir, target) }));
}

function canonicalOwnerIndex(root, { buildUnits, tickets, selections, capabilities, technicalConstraints, repositories }) {
  const result = new Map();
  const add = (id, filePath) => {
    if (!id || !filePath) return;
    if (!result.has(id)) result.set(id, new Set());
    result.get(id).add(filePath);
  };
  for (const records of [buildUnits, tickets, selections, capabilities, technicalConstraints, repositories]) {
    for (const [id, record] of records) add(id, record.filePath);
  }
  const model = readSystemModel(root);
  for (const record of [...model.responsibilities, ...model.flows, ...Object.values(model.contracts).flat()]) add(record.frontmatter.id, record.filePath);
  return result;
}

function canonicalOwnerLinkExists(exclusions, handoffDir, capabilityId, ownerIndex) {
  const ownerPaths = ownerIndex.get(capabilityId) || new Set();
  return linkRecords(exclusions, handoffDir).some(({ local }) => {
    if (!local || !ownerPaths.has(local.resolved) || !fs.existsSync(local.resolved)) return false;
    return new RegExp("\\b" + escape(capabilityId) + "\\b").test(read(local.resolved));
  });
}

function buildUnitIndex(layout, errors, documentationFindings) {
  const result = new Map();
  for (const { filePath, filename, content } of findBuildUnitRecords(layout.unitsRoot)) {
    try {
      const meta = frontmatter(content, filePath);
      const id = meta.id;
      const sourceResponsibilities = commaSeparatedIds(meta.source_responsibilities);
      const dependencies = commaSeparatedIds(meta.depends_on_build_units);
      const technicalConstraints = commaSeparatedIds(meta.technical_constraints);
      const repository = String(meta.repository || "").trim();
      const codePath = String(meta.code_path || "").trim();
      const repositoryDisposition = String(meta.repository_disposition || "").trim();
      const uiUxApplicability = String(meta.ui_ux_applicability || "").trim().toLowerCase();
      const uiUxDisposition = String(meta.ui_ux_disposition || "").trim();
      if (meta.type !== "build-unit") errors.push(rel(layout.buildRoot, filePath) + " must use type build-unit.");
      if (!/^BU-\d{3,}$/.test(id || "")) errors.push(rel(layout.buildRoot, filePath) + " is missing a valid BU-xxx id.");
      if (id && (!filename.startsWith(id.toLowerCase() + "-") || !/^bu-\d{3,}-.+\.md$/.test(filename))) {
        errors.push(rel(layout.buildRoot, filePath) + " filename must start with its lowercase BU id and a slug.");
      }
      if (!meaningful(meta.name) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(meta.kind || "")) {
        errors.push(rel(layout.buildRoot, filePath) + " requires a name and lowercase-slug kind.");
      }
      if (!sourceResponsibilities.length || sourceResponsibilities.some((idValue) => !/^SR-\d{3,}$/.test(idValue))) {
        errors.push(rel(layout.buildRoot, filePath) + " requires source_responsibilities with SR-xxx identifiers.");
      }
      if (dependencies.some((idValue) => !/^BU-\d{3,}$/.test(idValue)) || new Set(dependencies).size !== dependencies.length) {
        errors.push(rel(layout.buildRoot, filePath) + " requires unique depends_on_build_units BU-xxx identifiers or None.");
      }
      if (!UI_UX_APPLICABILITY.has(uiUxApplicability)) {
        errors.push(rel(layout.buildRoot, filePath) + " ui_ux_applicability must be applicable or not-applicable.");
      }
      if (!meaningful(uiUxDisposition) || isNone(uiUxDisposition)) {
        errors.push(rel(layout.buildRoot, filePath) + " requires a concrete ui_ux_disposition.");
      }
      if (uiUxApplicability === "applicable") {
        validateBuildUnitSections({
          text: content,
          headings: ["UI/UX Realization"],
          label: rel(layout.buildRoot, filePath),
          errors,
        });
        const uiUxBody = buildUnitSectionBody(content, "UI/UX Realization") || "";
        const uiUxLinks = linkPaths(uiUxBody, path.dirname(filePath)).filter(({ local }) => local);
        const uiRoot = path.resolve(layout.buildRoot, "..", "ui-ux");
        const selectedCandidate = readUiUxSpecification(path.dirname(uiRoot)).selectedPath;
        if (!selectedCandidate) errors.push(rel(layout.buildRoot, filePath) + " UI/UX Realization requires a selected candidate entrypoint.");
        for (const expected of [path.join(uiRoot, "specification.md"), selectedCandidate].filter(Boolean)) {
          const target = path.relative(uiRoot, expected);
          if (!uiUxLinks.some(({ local }) => local.resolved === expected)) {
            errors.push(rel(layout.buildRoot, filePath) + " UI/UX Realization must link ui-ux/" + target + ".");
          }
        }
      }
      const documentErrors = [];
      documentationFindings.push({ unitIds: [id], errors: documentErrors });
      validateAgentFirstBuildUnitEntry({
        text: content,
        label: rel(layout.buildRoot, filePath),
        errors: documentErrors,
        requiresVisual: !isNone(repository),
      });
      const repositoryDesignActive = fs.existsSync(layout.repositoriesRoot);
      if (repositoryDesignActive) {
        if (!repository) errors.push(rel(layout.buildRoot, filePath) + " must declare repository: REPO-xxx or None.");
        if (isNone(repository)) {
          if (!isNone(codePath)) errors.push(rel(layout.buildRoot, filePath) + " with repository None. must use code_path: None.");
          if (!meaningful(repositoryDisposition)) errors.push(rel(layout.buildRoot, filePath) + " with repository None. requires a concrete repository_disposition.");
        } else {
          if (!/^REPO-\d{3,}$/.test(repository)) errors.push(rel(layout.buildRoot, filePath) + " requires a valid REPO-xxx repository.");
          if (!meaningful(codePath)) errors.push(rel(layout.buildRoot, filePath) + " requires a concrete code_path for its first-party repository.");
          if (!isNone(repositoryDisposition)) errors.push(rel(layout.buildRoot, filePath) + " with a REPO-xxx repository must use repository_disposition: None.");
        }
        if (technicalConstraints.some((idValue) => !/^CONS-\d{3,}$/.test(idValue)) || new Set(technicalConstraints).size !== technicalConstraints.length) {
          errors.push(rel(layout.buildRoot, filePath) + " technical_constraints must use unique CONS-xxx identifiers or None.");
        }
        validateBuildUnitSections({
          text: content,
          headings: ["Applicable Technical Constraints"],
          label: rel(layout.buildRoot, filePath),
          errors,
        });
      } else {
        if (!isNone(repository)) errors.push(rel(layout.buildRoot, filePath) + " without a repository design must use repository: None.");
        if (!isNone(codePath)) errors.push(rel(layout.buildRoot, filePath) + " with repository None. must use code_path: None.");
        if (!meaningful(repositoryDisposition)) errors.push(rel(layout.buildRoot, filePath) + " with repository None. requires a concrete repository_disposition.");
      }
      if (id) {
        if (result.has(id)) errors.push("Duplicate build-unit identifier: " + id + ".");
        else result.set(id, { id, filePath, sourceResponsibilities, dependencies, repository: repository || null, codePath, repositoryDisposition, technicalConstraints, uiUxApplicability, uiUxDisposition, content });
      }
    } catch (error) {
      errors.push(error.message);
    }
  }
  for (const unit of result.values()) {
    for (const dependency of unit.dependencies) {
      if (dependency === unit.id) errors.push(unit.id + " cannot depend on itself.");
      else if (!result.has(dependency)) errors.push(unit.id + " depends on unknown build unit " + dependency + ".");
    }
  }
  return result;
}

function repositoryIndex(layout, buildUnits, constraints, errors, documentationFindings) {
  const repositories = new Map();
  for (const record of findRepositoryBuildDesignRecords(layout.repositoriesRoot)) {
    const relative = rel(layout.buildRoot, record.filePath);
    if (record.type !== "repository-build-design") errors.push(relative + " must use type repository-build-design.");
    if (!/^REPO-\d{3,}$/.test(record.id || "")) errors.push(relative + " must use a valid REPO-xxx id.");
    if (!record.folderRecord || record.filename !== "readme.md" || !/^repo-\d{3,}-.+$/i.test(record.slug) || (record.id && !record.slug.startsWith(record.id.toLowerCase() + "-"))) {
      errors.push(relative + " must be README.md inside a repo-NNN-slug folder matching its REPO id.");
    }
    if (!meaningful(record.name)) errors.push(relative + " requires a name.");
    if (repositories.has(record.id)) errors.push("Duplicate Repository Build Design identifier: " + record.id + ".");
    else repositories.set(record.id, record);
    if (!record.memberBuildUnits.length || record.memberBuildUnits.some((id) => !buildUnits.has(id)) || new Set(record.memberBuildUnits).size !== record.memberBuildUnits.length) {
      errors.push((record.id || relative) + " member_build_units must name unique canonical BU-xxx records.");
    }
    if (record.technicalConstraints.some((id) => !constraints.has(id)) || new Set(record.technicalConstraints).size !== record.technicalConstraints.length) {
      errors.push((record.id || relative) + " technical_constraints must name unique canonical CONS-xxx records or None.");
    }
    if (!REPOSITORY_DISCOVERY_STATES.has(record.discoveryStatus)) {
      errors.push((record.id || relative) + " discovery_status must be complete or blocked.");
    } else if (record.discoveryStatus === "complete" && record.discoveryBlockers.length) {
      errors.push(record.id + " is complete but still names discovery_blockers.");
    } else if (record.discoveryStatus === "blocked" && !record.discoveryBlockers.length) {
      errors.push(record.id + " is blocked but has no discovery_blockers.");
    }
    const documentErrors = [];
    documentationFindings.push({ unitIds: record.memberBuildUnits, errors: documentErrors });
    validateAgentFirstRepositoryEntry({ text: record.content, label: record.id || relative, errors: documentErrors });
    if (record.discoveryStatus === "complete") {
      validateRepositoryContractCoverage(record, record.id || relative, errors);
      validateVersionControlPolicy(record, record.id || relative, errors);
      if (/^REPO-\d{3,}$/.test(record.id || "")) {
        validateAgentGuidanceProjection(record, layout, record.id, errors);
      }
    }
    const linksInRecord = linkPaths(record.content, path.dirname(record.filePath));
    for (const constraintId of record.technicalConstraints) {
      const constraint = constraints.get(constraintId);
      if (constraint && !linksInRecord.some(({ local }) => local?.resolved === constraint.filePath)) {
        errors.push(record.id + " must link the canonical file for " + constraintId + ".");
      }
    }
  }
  for (const repository of repositories.values()) {
    const expectedConstraints = [...new Set(repository.memberBuildUnits.flatMap((id) => buildUnits.get(id)?.technicalConstraints || []))];
    if (!sameIds(repository.technicalConstraints, expectedConstraints)) {
      errors.push(repository.id + " technical_constraints must exactly cover its member build units' CONS mappings.");
    }
    for (const unitId of repository.memberBuildUnits) {
      const unit = buildUnits.get(unitId);
      if (unit?.repository !== repository.id) errors.push(repository.id + " member " + unitId + " must reciprocally name this repository.");
    }
  }
  for (const unit of buildUnits.values()) {
    if (!meaningful(unit.repository)) continue;
    const repository = repositories.get(unit.repository);
    if (!repository) errors.push(unit.id + " names missing Repository Build Design " + unit.repository + ".");
    else if (!repository.memberBuildUnits.includes(unit.id)) errors.push(unit.id + " is not a member of " + unit.repository + ".");
    const linksInUnit = linkPaths(buildUnitSectionBody(unit.content, "Applicable Technical Constraints") || "", path.dirname(unit.filePath));
    for (const constraintId of unit.technicalConstraints) {
      const constraint = constraints.get(constraintId);
      if (!constraint) errors.push(unit.id + " references missing Technical Constraint " + constraintId + ".");
      else if (!linksInUnit.some(({ local }) => local?.resolved === constraint.filePath)) {
        errors.push(unit.id + " must link the canonical file for " + constraintId + ".");
      }
    }
  }
  return repositories;
}

function validateResponsibilityRealization(root, layout, buildUnits, errors) {
  const realizedByUnits = new Map();
  for (const unit of buildUnits.values()) {
    for (const responsibilityId of unit.sourceResponsibilities) {
      if (!realizedByUnits.has(responsibilityId)) realizedByUnits.set(responsibilityId, []);
      realizedByUnits.get(responsibilityId).push(unit.id);
    }
  }
  for (const responsibility of readSystemModel(root).responsibilities) {
    const id = responsibility.frontmatter.id || rel(root, responsibility.filePath);
    const actual = realizedByUnits.get(id) || [];
    const declared = commaSeparatedIds(responsibility.frontmatter.realized_by);
    if (!actual.length) {
      errors.push(id + " requires at least one Build Unit source_responsibilities mapping once Build Design exists.");
    }
    if (!sameIds(declared, actual)) {
      errors.push(id + " realized_by must exactly match reciprocal Build Unit source_responsibilities mappings.");
    }
  }
}

function validateAssuranceBuildRouting(model, buildUnits, repositories, errors) {
  const obligations = collectStructuredVerificationObligations(model, errors);
  const assignmentsByUnit = new Map([...buildUnits.keys()].map((id) => [id, []]));
  if (!obligations.size) return { obligations, assignmentsByUnit };
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(model.architecture?.frontmatter?.assurance_id || ""))) {
    errors.push("system-model/architecture.md assurance_id must be a stable lowercase slug when structured Verification Obligations exist.");
  }

  const ownersByObligation = new Map([...obligations.keys()].map((id) => [id, []]));
  for (const unit of buildUnits.values()) {
    const body = verificationAssignmentSection(unit.content);
    const assignmentRows = verificationAssignmentRows(unit.content);
    const assignmentIds = assignmentRows?.filter((row) => !row.invalidTable && row.obligationId).map((row) => row.obligationId) || [];
    const none = verificationAssignmentNone(unit.content);
    if (body === null) {
      errors.push(unit.id + " requires ### Verification Obligation Assignments because structured VOs exist.");
      continue;
    }
    if (assignmentRows?.some((row) => row.invalidTable)) {
      errors.push(unit.id + " Verification Obligation Assignments must use the exact four-column table contract.");
    }
    if (!assignmentIds?.length) {
      if (!none) errors.push(unit.id + " Verification Obligation Assignments must define exact VO IDs or a concrete None. disposition.");
      continue;
    }
    if (none) errors.push(unit.id + " cannot combine Verification Obligation assignments with a None. disposition.");
    for (const row of assignmentRows || []) {
      if (row.invalidTable) continue;
      if (!row.obligationId) errors.push(unit.id + " Verification Obligation assignment row must name exactly one valid VO ID.");
      if (!meaningful(row.responsibility) || !/\b(?:producer|consumer|joint|repository-wide|external)\b/i.test(row.responsibility)) {
        errors.push(unit.id + " assignment " + (row.obligationId || "row") + " requires a concrete producer, consumer, joint, repository-wide, or external Evidence responsibility.");
      }
      if (!meaningful(row.requiredEvidence) || sectionContainsPlaceholder(row.requiredEvidence)) {
        errors.push(unit.id + " assignment " + (row.obligationId || "row") + " requires concrete Required evidence or observation.");
      }
      if (!/^`(?:Planned|Existing — freshness unverified)`$/.test(row.state)) {
        errors.push(unit.id + " assignment " + (row.obligationId || "row") + " must use `Planned` or `Existing — freshness unverified` state.");
      }
    }
    if (new Set(assignmentIds).size !== assignmentIds.length) errors.push(unit.id + " contains duplicate Verification Obligation assignments.");
    assignmentsByUnit.set(unit.id, [...new Set(assignmentIds)]);
    const linksInAssignment = linkPaths(body, path.dirname(unit.filePath));
    for (const obligationId of new Set(assignmentIds)) {
      const obligation = obligations.get(obligationId);
      if (!obligation) {
        errors.push(unit.id + " assigns unknown Verification Obligation " + obligationId + ".");
        continue;
      }
      ownersByObligation.get(obligationId).push(unit.id);
      const exactLink = linksInAssignment.some(({ local }) => local?.resolved === obligation.record.filePath
        && local.fragment === obligationId.toLowerCase());
      if (!exactLink) errors.push(unit.id + " must link the exact canonical anchor for " + obligationId + ".");
    }
  }

  for (const [obligationId, owners] of ownersByObligation) {
    if (!owners.length) errors.push(obligationId + " is unassigned across the Build Design.");
  }

  for (const repository of repositories.values()) {
    const ownsAssignments = repository.memberBuildUnits.some((unitId) => (assignmentsByUnit.get(unitId) || []).length);
    const body = repositorySectionBody(repository.content, "Assurance Manifest And Report");
    if (!ownsAssignments) continue;
    if (body === null || !meaningful(body) || sectionContainsPlaceholder(body)) {
      errors.push(repository.id + " requires a concrete Assurance Manifest And Report section because a member Build Unit owns VOs.");
    } else if (!/`?assurance\/coverage\.yaml`?/.test(body)) {
      errors.push(repository.id + " Assurance Manifest And Report must require one tracked assurance/coverage.yaml.");
    }
  }

  return { obligations, assignmentsByUnit };
}

function verificationObligationClosureEntries(handoff) {
  const body = sectionBody(handoff, "Required Verification Obligation Closure");
  if (body === null) return null;
  const matches = [...body.matchAll(/^###\s+`?((?:INV|SEC)-\d{3,}\.VO-\d{3})`?\s+—\s+(.+)$/gm)];
  return {
    body,
    entries: matches.map((match, index) => ({
      id: match[1],
      title: match[2].trim(),
      body: body.slice(match.index, matches[index + 1]?.index).trim(),
    })),
  };
}

function validateVerificationObligationClosure({ handoff, handoffDir, outcome, selectedScopes, buildUnits, repositories, assurance, errors }) {
  const selectedIds = new Set(selectedScopes.map((scope) => scope.split(":")[1]));
  const expectedOwners = new Map();
  for (const [unitId, obligationIds] of assurance.assignmentsByUnit) {
    if (!selectedIds.has(unitId)) continue;
    for (const obligationId of obligationIds) {
      if (!expectedOwners.has(obligationId)) expectedOwners.set(obligationId, []);
      expectedOwners.get(obligationId).push(unitId);
    }
  }
  if (!expectedOwners.size) return;

  const closure = verificationObligationClosureEntries(handoff);
  if (closure === null) {
    errors.push("Selected Build Units with VO assignments require ## Required Verification Obligation Closure.");
    return;
  }
  if (new Set(closure.entries.map((entry) => entry.id)).size !== closure.entries.length) {
    errors.push("Required Verification Obligation Closure contains duplicate VO entries.");
  }
  const entriesById = new Map(closure.entries.map((entry) => [entry.id, entry]));
  for (const id of expectedOwners.keys()) if (!entriesById.has(id)) errors.push("Required Verification Obligation Closure omits selected " + id + ".");
  for (const id of entriesById.keys()) if (!expectedOwners.has(id)) errors.push("Required Verification Obligation Closure includes " + id + " without a selected Build Unit assignment.");

  const planningClaim = ["IMPLEMENTATION_DETAILS_READY", "IMPLEMENTATION_DETAILS_PARTIAL"].includes(outcome);
  for (const [obligationId, owners] of expectedOwners) {
    const entry = entriesById.get(obligationId);
    if (!entry) continue;
    for (const name of ["Canonical obligation", "Selected assignments", "Repository manifest route", "Required evidence", "Routing state", "Gap disposition"]) {
      const value = field(entry.body, name);
      if (!value) errors.push(obligationId + " closure is missing **" + name + ":**.");
      else if (name !== "Gap disposition" && (!meaningful(value) || sectionContainsPlaceholder(value))) {
        errors.push(obligationId + " closure **" + name + ":** must be concrete and cannot contain placeholder content.");
      } else if (name === "Gap disposition" && sectionContainsPlaceholder(value)) {
        errors.push(obligationId + " closure **Gap disposition:** cannot contain placeholder content.");
      }
    }
    const obligation = assurance.obligations.get(obligationId);
    const canonical = field(entry.body, "Canonical obligation") || "";
    if (obligation && !linkPaths(canonical, handoffDir).some(({ local }) => local?.resolved === obligation.record.filePath
      && local.fragment === obligationId.toLowerCase())) {
      errors.push(obligationId + " closure must link its exact canonical VO anchor.");
    }
    const declaredOwners = [...new Set(buildUnitScopes(field(entry.body, "Selected assignments") || "").map((scope) => scope.split(":")[1]))];
    if (!sameIds(declaredOwners, owners)) errors.push(obligationId + " closure Selected assignments must exactly cover its selected Build Unit owners.");
    const route = field(entry.body, "Repository manifest route") || "";
    const routeLinks = linkPaths(route, handoffDir);
    for (const unitId of owners) {
      const repositoryId = buildUnits.get(unitId)?.repository;
      if (!meaningful(repositoryId)) {
        if (!/\bexternal\b/i.test(route)) errors.push(obligationId + " external/no-code assignment must name its external evidence route.");
        continue;
      }
      const repository = repositories.get(repositoryId);
      if (!repository || !routeLinks.some(({ local }) => local?.resolved === repository.filePath)) {
        errors.push(obligationId + " closure must link Repository Build Design " + repositoryId + ".");
      }
      if (!/assurance\/coverage\.yaml/.test(route)) errors.push(obligationId + " closure must name assurance/coverage.yaml for first-party evidence.");
    }
    const state = /^`(Planned|Mapped existing — freshness unverified|Approved exception)`$/.exec(field(entry.body, "Routing state") || "")?.[1];
    if (!state) errors.push(obligationId + " closure has an invalid Routing state.");
    const gap = field(entry.body, "Gap disposition");
    if (planningClaim && state !== "Approved exception" && !isNone(gap)) {
      errors.push(obligationId + " ready/partial closure requires `None.` Gap disposition unless it uses an approved exception.");
    }
    if (state === "Approved exception" && (!meaningful(gap) || isNone(gap) || !existingLocalLinks(gap, handoffDir).length)) {
      errors.push(obligationId + " approved exception requires a linked canonical Gap disposition.");
    }
  }
}

function headingBlocks(text, level) {
  const marker = "#".repeat(level);
  const matches = [...String(text || "").matchAll(new RegExp("^" + marker + "\\s+(.+?)\\s*$", "gm"))];
  return matches.map((match, index) => ({
    heading: match[1].trim(),
    index: match.index,
    body: text.slice(match.index + match[0].length, matches[index + 1]?.index).trim(),
  }));
}

function linkCountTo(text, baseDir, filePath) {
  return linkRecords(text, baseDir).filter(({ local }) => local?.resolved === filePath).length;
}

function readableText(text) {
  return String(text || "")
    .replace(/!?\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/[`*_#>|]/g, " ")
    .replace(/^[\s-]+/gm, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function validateBuildConstructionGuide(layout, buildUnits, repositories, errors) {
  if (!buildUnits.size || !fs.existsSync(layout.buildReadmePath)) return;
  const readme = read(layout.buildReadmePath);
  const readmeDir = path.dirname(layout.buildReadmePath);
  const firstHeading = /^##\s+(.+?)\s*$/m.exec(readme)?.[1]?.trim() || null;
  if (firstHeading !== "Construction At A Glance") {
    errors.push("build/README.md must begin its substantive sections with ## Construction At A Glance once Build Design exists.");
  }

  const guide = sectionBody(readme, "Construction At A Glance");
  if (guide === null) {
    errors.push("build/README.md is missing ## Construction At A Glance.");
    return;
  }
  if (!guide || sectionContainsPlaceholder(guide)) {
    errors.push("build/README.md ## Construction At A Glance contains placeholder content.");
    return;
  }

  const prohibitedSections = new Set(["Construction Model", "Reusable Records", "Workflow", "Visual Navigation", "Current Readiness"]);
  for (const section of headingBlocks(readme, 2)) {
    if (prohibitedSections.has(readableText(section.heading))) {
      errors.push("build/README.md must not include the " + readableText(section.heading) + " navigation/readiness section once Build Design exists.");
    }
  }

  const blocks = headingBlocks(guide, 3);
  for (const repository of repositories.values()) {
    const matchingBlocks = blocks.filter((block) => linkCountTo(block.heading, readmeDir, repository.filePath) > 0);
    if (matchingBlocks.length !== 1) {
      errors.push("build/README.md construction guide must contain exactly one linked ### block for " + repository.id + ".");
      continue;
    }
    if (linkCountTo(guide, readmeDir, repository.filePath) !== 1) {
      errors.push("build/README.md construction guide must link " + repository.id + " exactly once.");
    }

    const block = matchingBlocks[0];
    const unitBlocks = headingBlocks(block.body, 4);
    const repositoryExplanation = readableText(block.body.slice(0, unitBlocks[0]?.index ?? block.body.length));
    if (repositoryExplanation.length < 160) {
      errors.push(repository.id + " construction-guide block must explain repository purpose, workspace shape, grouping, and member relationships before its Build Unit blocks.");
    }

    for (const unitId of repository.memberBuildUnits) {
      const unit = buildUnits.get(unitId);
      if (!unit) continue;
      const matchingUnitBlocks = unitBlocks.filter((unitBlock) => linkCountTo(unitBlock.heading, readmeDir, unit.filePath) > 0);
      if (matchingUnitBlocks.length !== 1) {
        errors.push(repository.id + " construction-guide block must contain one linked #### explanation block for member " + unitId + ".");
        continue;
      }
      if (linkCountTo(block.body, readmeDir, unit.filePath) !== 1) {
        errors.push(repository.id + " construction-guide block must link member " + unitId + " exactly once.");
      }
      if (readableText(matchingUnitBlocks[0].body).length < 180) {
        errors.push(unitId + " construction-guide explanation must describe the artifact, separate boundary, code home or disposition, connections, and excluded authority in readable prose.");
      }
    }

    for (const unit of buildUnits.values()) {
      if (repository.memberBuildUnits.includes(unit.id)) continue;
      if (linkCountTo(block.body, readmeDir, unit.filePath) > 0) {
        errors.push(repository.id + " construction-guide block includes non-member " + unit.id + ".");
      }
    }
  }

  const externalUnits = [...buildUnits.values()].filter((unit) => !meaningful(unit.repository));
  const externalBlocks = blocks.filter((block) => /^External Or Unassigned Build Units$/i.test(readableText(block.heading)));
  if (externalUnits.length && externalBlocks.length !== 1) {
    errors.push("build/README.md construction guide requires exactly one ### External Or Unassigned Build Units block.");
  }
  if (!externalUnits.length && externalBlocks.length) {
    errors.push("build/README.md construction guide must omit External Or Unassigned Build Units when every unit has a first-party repository.");
  }
  if (externalUnits.length && externalBlocks.length === 1) {
    const externalUnitBlocks = headingBlocks(externalBlocks[0].body, 4);
    for (const unit of externalUnits) {
      const matchingUnitBlocks = externalUnitBlocks.filter((unitBlock) => linkCountTo(unitBlock.heading, readmeDir, unit.filePath) > 0);
      if (matchingUnitBlocks.length !== 1 || linkCountTo(externalBlocks[0].body, readmeDir, unit.filePath) !== 1) {
        errors.push("External Or Unassigned Build Units must contain one linked #### explanation block for " + unit.id + ".");
      } else if (readableText(matchingUnitBlocks[0].body).length < 180) {
        errors.push(unit.id + " construction-guide explanation must describe the artifact, separate boundary, disposition, connections, and excluded authority in readable prose.");
      }
    }
  }

  for (const unit of buildUnits.values()) {
    if (linkCountTo(guide, readmeDir, unit.filePath) !== 1) {
      errors.push("build/README.md construction guide must link " + unit.id + " exactly once overall.");
    }
  }
}

function ticketIndex(buildRoot, errors) {
  const result = new Map();
  for (const filePath of matchingFiles(buildRoot, (name) => name.endsWith("-tickets.yaml"))) {
    try {
      const document = parseTicketFile(filePath);
      for (const archived of document.archivedRecords) {
        result.set(archived.id, { ...archived, filePath, status: archived.status_at_close,
          resultRefs: archived.result_refs || [], writeTargets: archived.write_targets || [],
          buildUnits: archived.build_units || [], buildUnitDisposition: archived.build_unit_disposition || "" });
      }
      for (const sourceTicket of document.tickets) {
        const ticket = { ...sourceTicket, filePath };
        ticket.status = String(ticket.status || "");
        ticket.resultRefs = ticket.result_refs === undefined ? [] : ticket.result_refs;
        ticket.writeTargets = ticket.write_targets;
        ticket.buildUnits = ticket.build_units;
        for (const [rawName, parsedName] of [
          ["result_refs", "resultRefs"],
          ["write_targets", "writeTargets"],
          ["build_units", "buildUnits"],
        ]) {
          if (!Array.isArray(ticket[parsedName]) || !ticket[parsedName].every((item) => typeof item === "string")) {
            errors.push(ticket.id + " has an invalid or missing " + rawName + " inline array.");
            ticket[parsedName] = [];
          }
        }
        ticket.buildUnitDisposition = String(ticket.build_unit_disposition || "").trim();
        if (!ACTIVE_TICKET_STATUSES.has(ticket.status)) errors.push(ticket.id + " has an invalid or missing active status.");
        if (result.has(ticket.id)) errors.push("Duplicate ticket identifier in realization synchronization: " + ticket.id + ".");
        result.set(ticket.id, ticket);
      }
    } catch (error) {
      errors.push(error.message);
    }
  }
  return result;
}

function validateTicketSource({ artifact, ticketId, allowedStatuses, tickets, root, errors }) {
  const ticket = tickets.get(ticketId);
  if (!ticket) {
    errors.push(artifact.id + " references missing source ticket " + ticketId + ".");
    return;
  }
  if (!allowedStatuses.has(ticket.status)) {
    errors.push(artifact.id + " state " + artifact.state + " conflicts with source ticket " + ticketId + " status " + ticket.status + ".");
  }
  if (!ticket.resultRefs.includes(artifact.id)) errors.push(ticketId + " must reciprocally name " + artifact.id + " in result_refs.");
  const target = rel(root, artifact.filePath);
  if (!ticket.writeTargets.includes(target)) errors.push(ticketId + " must include " + target + " in write_targets for " + artifact.id + ".");
}

function routingEntries(handoff) {
  const matches = [...handoff.matchAll(/^###\s+`(BUILD_UNIT:BU-\d{3,})`\s*$/gm)];
  return matches.map((match, index) => ({
    scope: match[1],
    buildUnitId: match[1].split(":")[1],
    body: handoff.slice(match.index, matches[index + 1]?.index),
  }));
}

function verificationCapabilityEntries(layout) {
  return capabilityFiles(layout).flatMap((filePath) => {
    const content = read(filePath);
    const match = /^#\s+(VA-\d{3})\s+—\s+(.+)$/m.exec(content);
    return match ? [{ id: match[1], body: content, filePath }] : [];
  });
}

function currentHandoffFiles(layout) {
  if (!fs.existsSync(layout.handoffsRoot)) return [];
  return fs.readdirSync(layout.handoffsRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md") && entry.name.toLowerCase() !== "readme.md")
    .map((entry) => path.join(layout.handoffsRoot, entry.name))
    .sort();
}

export function validateBuildAndDeliveryReadiness(root, { scope = "auto", handoffPath: requestedHandoffPath = null } = {}) {
  if (!["auto", "build", "delivery"].includes(scope)) throw new Error("Unknown validation scope: " + scope + ".");
  if (scope !== "build" && !requestedHandoffPath) {
    const initialLayout = buildLayout(root);
    const availableHandoffs = currentHandoffFiles(initialLayout);
    if (availableHandoffs.length > 1) {
      const buildResult = validateBuildAndDeliveryReadiness(root, { scope: "build" });
      const errors = [...buildResult.errors];
      for (const currentHandoffPath of availableHandoffs) {
        const handoffResult = validateBuildAndDeliveryReadiness(root, {
          scope: "delivery",
          handoffPath: currentHandoffPath,
        });
        const handoffLabel = rel(initialLayout.handoffsRoot, currentHandoffPath);
        for (const error of handoffResult.errors) {
          if (!buildResult.errors.includes(error)) errors.push(handoffLabel + ": " + error);
        }
      }
      return { errors, skipped: false, mappingOnly: false };
    }
  }
  const errors = [];
  const layout = buildLayout(root);
  const buildRoot = layout.buildRoot;
  if (!fs.existsSync(buildRoot)) {
    if (scope === "delivery") errors.push("Delivery Readiness requires an active Build Design layer.");
    return { errors, skipped: true, mappingOnly: false };
  }

  const buildDesignActive = [layout.unitsRoot, layout.repositoriesRoot, layout.selectionsRoot, layout.verificationRoot]
    .some((target) => fs.existsSync(target));
  if (!buildDesignActive) {
    if (scope === "delivery") errors.push("Delivery Readiness requires an active Build Design layer.");
    return { errors, skipped: true, mappingOnly: false };
  }

  const requiredPaths = [layout.buildReadmePath, layout.unitsRoot];
  for (const required of requiredPaths) {
    if (!fs.existsSync(required)) errors.push("Missing required Build Design path: " + rel(root, required));
  }

  const documentationFindings = [];
  const warnings = [];
  const buildUnits = buildUnitIndex(layout, errors, documentationFindings);
  const uiUxValidation = scope === "build" || (scope === "auto" && !requestedHandoffPath && !currentHandoffFiles(layout).length)
    ? validateUiUxDesign(root) : { applicable: fs.existsSync(path.join(root, "ui-ux")), errors: [] };
  if ([...buildUnits.values()].some((unit) => unit.uiUxApplicability === "applicable") && !uiUxValidation.applicable) {
    errors.push("Applicable UI Build Units require the ui-ux/ specification and local interactive prototype.");
  }
  errors.push(...uiUxValidation.errors);
  if (!buildUnits.size) errors.push("Build Design requires at least one canonical build-unit record.");
  const knownTechnicalSourceIds = new Set([...buildUnits.values()].flatMap((unit) => unit.sourceResponsibilities));
  const model = readSystemModel(root);
  for (const record of [...model.responsibilities, ...model.flows, ...Object.values(model.contracts).flat()]) knownTechnicalSourceIds.add(record.frontmatter.id);
  const technicalConstraints = new Map();
  for (const record of findTechnicalConstraintRecords(root)) {
    if (technicalConstraints.has(record.id)) errors.push("Duplicate Technical Constraint identifier: " + record.id + ".");
    else technicalConstraints.set(record.id, record);
  }
  const repositories = repositoryIndex(layout, buildUnits, technicalConstraints, errors, documentationFindings);
  const assurance = validateAssuranceBuildRouting(model, buildUnits, repositories, errors);
  validateResponsibilityRealization(root, layout, buildUnits, errors);
  validateBuildConstructionGuide(layout, buildUnits, repositories, errors);
  const tickets = ticketIndex(layout.ticketsRoot, errors);
  validateRepositoryTicketMappings([...tickets.values()].filter((ticket) => ticket.record_state !== "archived"), buildUnits, repositories, errors);
  for (const ticket of tickets.values()) {
    if (ticket.record_state === "archived") continue;
    if (!ticket.buildUnits.length && PRE_MAPPING_DISPOSITION.test(ticket.buildUnitDisposition)) {
      errors.push(ticket.id + " retains the pre-mapping build_unit_disposition after realization mapping exists.");
    }
  }
  const handoffPaths = currentHandoffFiles(layout);
  let sequenceResult = { errors: [], rows: [], currentOrderGroup: null };
  if (fs.existsSync(layout.handoffsRoot)) {
    sequenceResult = validateHandoffSequence(root);
    errors.push(...sequenceResult.errors);
  }
  const nestedHandoffs = matchingFiles(layout.handoffsRoot, (name) => name.endsWith(".md"))
    .filter((filePath) => path.dirname(filePath) !== layout.handoffsRoot);
  for (const nestedHandoff of nestedHandoffs) {
    errors.push("Stage 9 handoffs must be direct Markdown files under " + rel(root, layout.handoffsRoot) + ": " + rel(root, nestedHandoff));
  }
  let handoffPath = handoffPaths[0] || null;
  if (requestedHandoffPath) {
    const resolvedHandoffPath = path.resolve(requestedHandoffPath);
    if (!handoffPaths.includes(resolvedHandoffPath)) {
      errors.push("Selected Stage 9 handoff must be an existing Markdown file under " + rel(root, layout.handoffsRoot) + ": " + rel(root, resolvedHandoffPath));
      handoffPath = null;
    } else {
      handoffPath = resolvedHandoffPath;
    }
  }
  const handoffExists = Boolean(handoffPath && fs.existsSync(handoffPath));

  // Only document-shape checks may become notices. Identity, routing, constraints,
  // and compatibility continue to validate globally and fail closed.
  let relevantUnits = null;
  if (scope === "delivery" && requestedHandoffPath && handoffExists) {
    const selected = buildUnitScopes(field(read(handoffPath), "Selected build units") || "");
    if (selected.length && selected.every((entry) => buildUnits.has(entry.split(":")[1]))) {
      relevantUnits = new Set(selected.map((entry) => entry.split(":")[1]));
      const coverageErrors = [];
      const consumers = expectedKnownConsumerCoverage(root, buildUnits, selected, sequenceResult.rows, coverageErrors);
      for (const consumer of consumers) relevantUnits.add(consumer.consumerId);
      // Include proof consumers' prerequisites as well as the delivery prerequisites.
      for (const id of relevantUnits) {
        for (const dependency of buildUnits.get(id)?.dependencies || []) relevantUnits.add(dependency);
      }
      if (coverageErrors.length || sequenceResult.errors.length) relevantUnits = null;
    }
  }
  for (const finding of documentationFindings) {
    const unrelated = relevantUnits && finding.unitIds.length
      && finding.unitIds.every((id) => buildUnits.has(id) && !relevantUnits.has(id));
    (unrelated ? warnings : errors).push(...finding.errors);
  }

  const selections = new Map();
  for (const filePath of selectionFiles(layout)) {
    try {
      const content = read(filePath);
      const meta = frontmatter(content, filePath);
      const artifact = {
        type: meta.type,
        id: meta.id,
        filename: path.basename(filePath).toLowerCase(),
        state: meta.state,
        technicalSources: meta.technical_sources,
        affected: buildUnitScopes(meta.affected_scopes || ""),
        sourceTickets: ticketIds(meta.source_tickets || ""),
        inheritanceEvidence: meta.inheritance_evidence,
        filePath,
      };
      if (artifact.type !== "implementation-selection") errors.push(rel(buildRoot, filePath) + " must use type implementation-selection.");
      if (!/^SEL-\d{3}$/.test(artifact.id || "")) errors.push(rel(buildRoot, filePath) + " is missing a valid SEL-NNN id.");
      if (artifact.id && (!/^sel-\d{3}-.+\.md$/i.test(artifact.filename) || !artifact.filename.startsWith(artifact.id.toLowerCase() + "-"))) {
        errors.push(rel(buildRoot, filePath) + " filename must start with its lowercase SEL id and a slug.");
      }
      const sourceIds = technicalSourceIds(artifact.technicalSources);
      if (!validTechnicalSources(artifact.technicalSources)) {
        errors.push((artifact.id || rel(buildRoot, filePath)) + " requires valid Technical sources.");
      } else if (sourceIds.some((sourceId) => !knownTechnicalSourceIds.has(sourceId))) {
        errors.push((artifact.id || rel(buildRoot, filePath)) + " references an unknown Technical source.");
      }
      if (selections.has(artifact.id)) errors.push("Duplicate Implementation Selection identifier: " + artifact.id + ".");
      else selections.set(artifact.id, artifact);
      if (!SELECTION_STATES.has(artifact.state)) errors.push((artifact.id || rel(buildRoot, filePath)) + " has an invalid SEL state.");
      if (!artifact.affected.length) errors.push((artifact.id || rel(buildRoot, filePath)) + " must affect at least one BUILD_UNIT:BU-xxx scope.");
      for (const scope of artifact.affected) if (!buildUnits.has(scope.split(":")[1])) errors.push(artifact.id + " affects unknown " + scope + ".");
      if (artifact.state !== "Inherited" && !artifact.sourceTickets.length) errors.push(artifact.id + " requires at least one source ticket.");
      if (artifact.state === "Inherited" && !artifact.sourceTickets.length && !meaningful(artifact.inheritanceEvidence)) {
        errors.push(artifact.id + " is inherited without source tickets or concrete inheritance_evidence.");
      }
      validateSections({
        text: content,
        headings: REQUIRED_SELECTION_SECTIONS,
        label: artifact.id || rel(buildRoot, filePath),
        errors,
      });
    } catch (error) {
      errors.push(error.message);
    }
  }

  const capabilities = new Map();
  const verificationCapabilities = verificationCapabilityEntries(layout);
  for (const capability of verificationCapabilities) {
    const filename = path.basename(capability.filePath || "").toLowerCase();
    if (!/^va-\d{3}-.+\.md$/i.test(filename) || !filename.startsWith(capability.id.toLowerCase() + "-")) {
      errors.push((capability.id || filename) + " filename must start with its lowercase VA id and a slug.");
    }
    const sourceIds = technicalSourceIds(field(capability.body, "Technical sources"));
    if (!validTechnicalSources(field(capability.body, "Technical sources"))) {
      errors.push(capability.id + " requires valid Technical sources.");
    } else if (sourceIds.some((sourceId) => !knownTechnicalSourceIds.has(sourceId))) {
      errors.push(capability.id + " references an unknown Technical source.");
    }
    for (const name of REQUIRED_VERIFICATION_CAPABILITY_FIELDS) {
      if (!field(capability.body, name)) errors.push(capability.id + " is missing **" + name + ":**.");
    }
    const claimField = "Verification obligations it can support";
    if (!field(capability.body, claimField)) errors.push(capability.id + " is missing **Verification obligations it can support:**.");
    capability.state = field(capability.body, "State")?.match(/`([^`]+)`/)?.[1] || null;
    capability.affected = buildUnitScopes(field(capability.body, "Affected scopes") || "");
    capability.sourceTickets = ticketIds(field(capability.body, "Source tickets") || "");
    if (!VA_STATES.has(capability.state)) errors.push(capability.id + " has an invalid VA state.");
    if (!capability.affected.length) errors.push(capability.id + " must affect at least one BUILD_UNIT:BU-xxx scope.");
    for (const scope of capability.affected) if (!buildUnits.has(scope.split(":")[1])) errors.push(capability.id + " affects unknown " + scope + ".");
    if (capability.state === "Planned — unverified" && !capability.sourceTickets.length) errors.push(capability.id + " is planned but has no source ticket.");
    if (capability.state === "Existing" && !capability.sourceTickets.length
      && !meaningful(field(capability.body, "Existing-capability evidence"))) {
      errors.push(capability.id + " is existing without source tickets or concrete evidence.");
    }
    for (const name of [...REQUIRED_VA_FIELDS.slice(4), claimField].filter(Boolean)) {
      const value = field(capability.body, name);
      if (value && (placeholder(value) || isNone(value))) {
        errors.push(capability.id + " **" + name + ":** contains placeholder content.");
      }
    }
    if (capabilities.has(capability.id)) errors.push("Duplicate verification identifier: " + capability.id + ".");
    capabilities.set(capability.id, capability);
  }

  for (const ticket of tickets.values()) {
    for (const resultId of ticket.resultRefs) {
      const artifact = resultId.startsWith("VA-") ? capabilities.get(resultId) : selections.get(resultId);
      if (!artifact) errors.push(ticket.id + " references missing realization result " + resultId + ".");
      else if (!artifact.sourceTickets.includes(ticket.id)) errors.push(resultId + " must reciprocally name " + ticket.id + " as a source ticket.");
    }
  }

  if (scope === "build" || !handoffExists) {
    for (const artifact of selections.values()) {
      const allowed = {
        Proposed: new Set(["todo"]),
        Approved: new Set(["decided", "finished"]),
        Inherited: new Set(["decided", "finished"]),
        "Deferred Outside Selected Scope": new Set(["out-of-scope"]),
      }[artifact.state] || new Set();
      for (const ticketId of artifact.sourceTickets) validateTicketSource({ artifact, ticketId, allowedStatuses: allowed, tickets, root, errors });
    }
    for (const capability of capabilities.values()) {
      const allowed = capability.state === "Existing" ? new Set(["decided", "finished"]) : new Set(["decided", "finished"]);
      for (const ticketId of capability.sourceTickets) validateTicketSource({ artifact: capability, ticketId, allowedStatuses: allowed, tickets, root, errors });
    }
    if (scope === "delivery" && !handoffExists) errors.push("Delivery Readiness requires at least one current Stage 9 handoff.");
    return { errors, warnings, skipped: false, mappingOnly: scope !== "delivery" };
  }

  const handoff = read(handoffPath);
  const handoffDir = path.dirname(handoffPath);
  errors.push(...deliverySnapshotErrors({ root, handoffPath }));
  validateSections({
    text: handoff,
    headings: REQUIRED_HANDOFF_SECTIONS,
    label: "handoff",
    errors,
  });
  const outcome = /^\*\*Outcome:\*\*\s*`([^`]+)`\s*$/m.exec(handoff)?.[1];
  if (!OUTCOMES.has(outcome)) errors.push("Handoff must select one valid **Outcome:** value.");

  for (const { target, local } of linkPaths(handoff, handoffDir)) {
    if (local && !fs.existsSync(local.resolved)) errors.push("Broken handoff link: " + target);
  }
  validateRealizabilityReview({ handoff, handoffDir, outcome, errors });
  validateBoundedDiagnosticSweep({ handoff, handoffDir, outcome, errors });
  validateLaterLifecycleGates({ handoff, handoffDir, errors });

  const entries = routingEntries(handoff);
  if (!entries.length) errors.push("Handoff has no Build Unit Routing Index entries.");
  const entryByScope = new Map();
  for (const entry of entries) {
    if (entryByScope.has(entry.scope)) errors.push("Duplicate Build Unit Routing Index entry: " + entry.scope);
    entryByScope.set(entry.scope, entry);
    if (!buildUnits.has(entry.buildUnitId)) errors.push(entry.scope + " has no canonical build-unit record.");
    for (const name of REQUIRED_ENTRY_FIELDS) if (!field(entry.body, name)) errors.push(entry.scope + " is missing **" + name + ":**.");
    entry.readiness = field(entry.body, "Readiness")?.match(/`([^`]+)`/)?.[1] || null;
    if (!READINESS.has(entry.readiness)) errors.push(entry.scope + " has an invalid readiness value.");
    const blockers = field(entry.body, "Blockers");
    if (entry.readiness === "READY" && blockers !== "`None.`") errors.push(entry.scope + " is READY but blockers are not `None.`.");
    if (["PARTIAL", "BLOCKED"].includes(entry.readiness) && (!blockers || blockers === "`None.`")) {
      errors.push(entry.scope + " is " + entry.readiness + " but has no canonical blocker or exclusion.");
    }

    const canonicalLinks = linkPaths(field(entry.body, "Canonical sources") || "", handoffDir);
    const expectedBuildUnit = buildUnits.get(entry.buildUnitId)?.filePath;
    if (!expectedBuildUnit || !canonicalLinks.some(({ local }) => local?.resolved === expectedBuildUnit)) {
      errors.push(entry.scope + " must link its canonical build-unit record.");
    }

    const unit = buildUnits.get(entry.buildUnitId);
    if (meaningful(unit?.repository)) {
      const repositoryField = field(entry.body, "Repository Build Design");
      const constraintField = field(entry.body, "Technical constraints");
      entry.repositoryMembershipDisposition = field(entry.body, "Repository membership disposition");
      if (!repositoryField) errors.push(entry.scope + " is missing **Repository Build Design:**.");
      if (!constraintField) errors.push(entry.scope + " is missing **Technical constraints:**.");
      if (!entry.repositoryMembershipDisposition) errors.push(entry.scope + " is missing **Repository membership disposition:**.");
      const repository = repositories.get(unit.repository);
      if (repository && !linkPaths(repositoryField || "", handoffDir).some(({ local }) => local?.resolved === repository.filePath)) {
        errors.push(entry.scope + " must link its canonical Repository Build Design " + unit.repository + ".");
      }
      if (repository?.discoveryStatus !== "complete") {
        errors.push(entry.scope + " cannot enter a Stage 9 handoff while " + unit.repository + " repository discovery is " + (repository?.discoveryStatus || "missing") + ".");
      }
      const listedConstraints = constraintIds(constraintField || "");
      if (!sameIds(listedConstraints, unit.technicalConstraints)) {
        errors.push(entry.scope + " Technical constraints must exactly cover the canonical Build Unit CONS mapping.");
      }
      const constraintLinks = linkPaths(constraintField || "", handoffDir);
      for (const constraintId of listedConstraints) {
        const constraint = technicalConstraints.get(constraintId);
        if (!constraint) errors.push(entry.scope + " references unknown Technical Constraint " + constraintId + ".");
        else if (!constraintLinks.some(({ local }) => local?.resolved === constraint.filePath)) {
          errors.push(entry.scope + " must link the canonical file for " + constraintId + ".");
        }
      }
    }

    const dependencyField = field(entry.body, "Dependencies") || "";
    entry.dependencies = buildUnitScopes(dependencyField);
    if (new Set(entry.dependencies).size !== entry.dependencies.length) {
      errors.push(entry.scope + " Dependencies contains duplicate Build Unit identifiers.");
    }
    const expectedDependencies = (buildUnits.get(entry.buildUnitId)?.dependencies || [])
      .map((id) => "BUILD_UNIT:" + id);
    if (!sameIds(entry.dependencies, expectedDependencies)) {
      errors.push(entry.scope + " Dependencies must exactly cover canonical Build Unit dependencies.");
    }

    const mappedField = field(entry.body, "Mapped tickets") || "";
    entry.mappedTickets = ticketIds(mappedField);
    if (!entry.mappedTickets.length && !isNone(mappedField)) errors.push(entry.scope + " must name TICKET-NNNN tickets or `None.`.");
    for (const ticketId of entry.mappedTickets) {
      const ticket = tickets.get(ticketId);
      if (!ticket) errors.push(entry.scope + " references missing mapped ticket " + ticketId + ".");
      else if (!ticket.buildUnits.includes(entry.buildUnitId)) errors.push(ticketId + " does not reciprocally name " + entry.buildUnitId + " in build_units.");
    }
    const expectedTickets = [...tickets.values()].filter((ticket) => ticket.record_state !== "archived" && ticket.buildUnits.includes(entry.buildUnitId)).map((ticket) => ticket.id).sort();
    const listedTickets = [...new Set(entry.mappedTickets)].sort();
    if (JSON.stringify(expectedTickets) !== JSON.stringify(listedTickets)) {
      errors.push(entry.scope + " Mapped tickets must exactly cover tickets whose build_units include " + entry.buildUnitId + ".");
    }
    if (["READY", "PARTIAL"].includes(entry.readiness)) {
      const allowed = entry.readiness === "READY"
        ? new Set(["finished", "out-of-scope"])
        : new Set(["decided", "finished", "out-of-scope"]);
      for (const ticketId of entry.mappedTickets) {
        const ticket = tickets.get(ticketId);
        const status = ticket?.status;
        if (status && !allowed.has(status)) errors.push(entry.scope + " is " + entry.readiness + " but mapped ticket " + ticketId + " is " + status + ".");
        if (entry.readiness === "READY" && status === "decided" && ticket.resultRefs.length) {
          errors.push(entry.scope + " is READY but result-producing mapped ticket " + ticketId + " is decided.");
        }
      }
    }
  }

  const selectedLine = /^\*\*Selected build units:\*\*\s*(.+)$/m.exec(handoff)?.[1];
  const selectedScopes = buildUnitScopes(selectedLine || "");
  if (!selectedScopes.length) errors.push("Handoff must declare at least one **Selected build units:** identifier.");
  for (const scope of selectedScopes) if (!entryByScope.has(scope)) errors.push("Selected build unit " + scope + " has no routing entry.");
  for (const scope of entryByScope.keys()) if (!selectedScopes.includes(scope)) errors.push("Routing entry " + scope + " is missing from **Selected build units:**.");
  for (const entry of entries) {
    for (const dependency of entry.dependencies) {
      if (!selectedScopes.includes(dependency)) errors.push(entry.scope + " direct Build Unit dependency " + dependency + " must be selected in the delivery closure.");
    }
  }
  validateUiUxDeliveryReview({ root, handoff, handoffDir, outcome, buildUnits, selectedScopes, errors });
  validateRequiredInputLedger({ handoff, handoffDir, outcome, buildUnits, selectedScopes, errors });
  const excludedInteractions = interactionScopeExclusions({ root, handoff, handoffDir, buildUnits, selectedScopes, errors });
  validateRequiredInteractionClosure({ root, handoff, handoffDir, outcome, buildUnits, selectedScopes, excludedInteractions, errors });
  const physicalRealizabilityPresent = validatePhysicalRealizabilityClosure({
    handoff,
    handoffDir,
    handoffPath,
    outcome,
    selectedScopes,
    errors,
  });
  validateKnownConsumerCoverage({
    root,
    handoff,
    handoffDir,
    buildUnits,
    selectedScopes,
    sequenceRows: sequenceResult.rows,
    excludedInteractions,
    errors,
  });
  validateVerificationObligationClosure({
    handoff,
    handoffDir,
    outcome,
    selectedScopes,
    buildUnits,
    repositories,
    assurance,
    errors,
  });

  for (const entry of entries) {
    const repositoryId = buildUnits.get(entry.buildUnitId)?.repository;
    if (!meaningful(repositoryId)) continue;
    const repository = repositories.get(repositoryId);
    if (!repository) continue;
    const selectedInRepository = repository.memberBuildUnits
      .map((id) => "BUILD_UNIT:" + id)
      .filter((scope) => selectedScopes.includes(scope));
    const omitted = repository.memberBuildUnits.filter((id) => !selectedInRepository.includes("BUILD_UNIT:" + id));
    const disposition = entry.repositoryMembershipDisposition || "";
    if (!omitted.length) {
      if (!/^`?Full repository\b/i.test(disposition)) {
        errors.push(entry.scope + " selects all members of " + repositoryId + " and must declare a Full repository disposition.");
      }
    } else {
      if (!/^`?Partial repository\b/i.test(disposition)) {
        errors.push(entry.scope + " selects only part of " + repositoryId + " and must declare a Partial repository disposition.");
      }
      for (const omittedId of omitted) {
        if (!new RegExp("\\b" + escape(omittedId) + "\\b").test(disposition)) {
          errors.push(entry.scope + " partial-repository disposition must name omitted " + omittedId + ".");
        }
        const reasonPattern = new RegExp("\\b" + escape(omittedId) + "\\b[\\s\\S]*(?:because|reason\\s*:|rationale\\s*:)\\s+\\S+", "i");
        if (!reasonPattern.test(disposition)) {
          errors.push(entry.scope + " partial-repository disposition for omitted " + omittedId + " must provide a reason.");
        }
      }
    }
  }

  for (const entry of entries) {
    const selectionField = field(entry.body, "Implementation selections") || "";
    const selectionIds = resultIds(selectionField).filter((id) => !id.startsWith("VA-"));
    if (!selectionIds.length && !isNone(selectionField)) errors.push(entry.scope + " must name SEL-NNN selections or `None.`.");
    if (new Set(selectionIds).size !== selectionIds.length) errors.push(entry.scope + " Implementation selections contains duplicate SEL identifiers.");
    const expectedSelectionIds = [...selections.values()]
      .filter((artifact) => artifact.affected.includes(entry.scope))
      .map((artifact) => artifact.id);
    if (!sameIds(selectionIds, expectedSelectionIds)) {
      errors.push(entry.scope + " Implementation selections must exactly cover affected SEL records.");
    }
    for (const id of selectionIds) {
      const artifact = selections.get(id);
      if (!artifact) errors.push(entry.scope + " references unknown Implementation Selection " + id + ".");
      else {
        if (!artifact.affected.includes(entry.scope)) errors.push(id + " does not list affected scope " + entry.scope + ".");
        if (!linkPaths(selectionField, handoffDir).some(({ local }) => local?.resolved === artifact.filePath)) {
          errors.push(entry.scope + " must link the canonical file for " + id + ".");
        }
        if (entry.readiness === "READY" && !["Approved", "Inherited"].includes(artifact.state)) {
          errors.push(entry.scope + " is READY but " + id + " state is " + artifact.state + ".");
        }
      }
    }

    const verificationField = field(entry.body, "Verification references") || "";
    const verificationIds = resultIds(verificationField).filter((id) => id.startsWith("VA-"));
    if (!verificationIds.length && !isNone(verificationField)) errors.push(entry.scope + " must name VA-NNN references or `None.`.");
    if (new Set(verificationIds).size !== verificationIds.length) errors.push(entry.scope + " Verification references contains duplicate VA identifiers.");
    const expectedVerificationIds = [...capabilities.values()]
      .filter((capability) => capability.affected.includes(entry.scope))
      .map((capability) => capability.id);
    if (!sameIds(verificationIds, expectedVerificationIds)) {
      errors.push(entry.scope + " Verification references must exactly cover affected VA records.");
    }
    for (const id of verificationIds) {
      const capability = capabilities.get(id);
      if (!capability) errors.push(entry.scope + " references unknown verification capability " + id + ".");
      else {
        if (!capability.affected.includes(entry.scope)) errors.push(id + " does not list affected scope " + entry.scope + ".");
        const capabilityLinked = linkPaths(verificationField, handoffDir).some(({ local }) => local?.resolved === capability.filePath);
        if (!capabilityLinked) {
          errors.push(entry.scope + " must link the canonical file for " + id + ".");
        }
      }
    }
  }

  for (const artifact of selections.values()) {
    const affectsReady = artifact.affected.some((scope) => entryByScope.get(scope)?.readiness === "READY");
    const allowed = {
      Proposed: new Set(["todo"]),
      Approved: affectsReady ? new Set(["finished"]) : new Set(["decided", "finished"]),
      Inherited: affectsReady ? new Set(["finished"]) : new Set(["decided", "finished"]),
      "Deferred Outside Selected Scope": new Set(["out-of-scope"]),
    }[artifact.state] || new Set();
    for (const ticketId of artifact.sourceTickets) validateTicketSource({ artifact, ticketId, allowedStatuses: allowed, tickets, root, errors });
  }

  for (const capability of capabilities.values()) {
    const affectsReady = capability.affected.some((scope) => entryByScope.get(scope)?.readiness === "READY");
    const allowed = affectsReady ? new Set(["finished"]) : new Set(["decided", "finished"]);
    for (const ticketId of capability.sourceTickets) validateTicketSource({ artifact: capability, ticketId, allowedStatuses: allowed, tickets, root, errors });
  }

  const ownerIndex = canonicalOwnerIndex(root, {
    buildUnits,
    tickets,
    selections,
    capabilities,
    technicalConstraints,
    repositories,
  });
  const canonicalAuthorityPaths = new Set();
  const integrationAuthorityPaths = new Set();
  for (const entry of entries) {
    if (!selectedScopes.includes(entry.scope)) continue;
    for (const { local } of linkPaths(field(entry.body, "Canonical sources") || "", handoffDir)) {
      if (local && fs.existsSync(local.resolved)) {
        canonicalAuthorityPaths.add(local.resolved);
        integrationAuthorityPaths.add(local.resolved);
      }
    }
    for (const { local } of linkPaths(field(entry.body, "Verification references") || "", handoffDir)) {
      if (local && fs.existsSync(local.resolved)) integrationAuthorityPaths.add(local.resolved);
    }
  }

  const statuses = entries.map((entry) => entry.readiness);
  const traceableSections = ["Protected Technical Boundaries", "Cross-Unit Integration And Verification", "Exclusions And Local Discretion"];
  for (const heading of traceableSections) {
    const body = sectionBody(handoff, heading) || "";
    const localLinks = linkPaths(body, handoffDir).filter(({ local }) => local);
    if (!localLinks.length) {
      errors.push(heading + " must contain at least one canonical local link.");
    } else if (heading === "Protected Technical Boundaries"
      && !localLinks.some(({ local }) => canonicalAuthorityPaths.has(local.resolved))) {
      errors.push(heading + " must link a relevant canonical authority.");
    } else if (heading === "Cross-Unit Integration And Verification"
      && !localLinks.some(({ local }) => integrationAuthorityPaths.has(local.resolved))) {
      errors.push(heading + " must link a relevant canonical authority.");
    }
  }
  if (statuses.includes("PARTIAL")) {
    const exclusions = sectionBody(handoff, "Exclusions And Local Discretion") || "";
    const selectedUnitIds = new Set(selectedScopes.map((scope) => scope.split(":")[1]));
    const excludedIds = [...new Set(ids(exclusions, /(?:TICKET-\d{4}|BU-\d{3,}|SR-\d{3,}|FLOW-\d{3,}|IFACE-\d{3,}|STATE-\d{3,}|INV-\d{3,}|SEC-\d{3,}|SCOPE-\d{3,}|(?:SEL|VA)-\d{3}|CONS-\d{3,})/g))]
      .filter((id) => !selectedUnitIds.has(id));
    const unknownExcludedIds = excludedIds.filter((id) => !ownerIndex.has(id));
    const unownedExcludedIds = excludedIds.filter((id) => ownerIndex.has(id)
      && !canonicalOwnerLinkExists(exclusions, handoffDir, id, ownerIndex));
    for (const id of unknownExcludedIds) {
      errors.push("PARTIAL handoff exclusion " + id + " must name a canonical capability.");
    }
    for (const id of unownedExcludedIds) {
      errors.push("PARTIAL handoff exclusion " + id + " must link its canonical owner.");
    }
    if (!excludedIds.length || unknownExcludedIds.length || unownedExcludedIds.length) {
      errors.push("PARTIAL handoff exclusions must name an unresolved capability and canonical owner.");
    }
  }
  if (outcome === "IMPLEMENTATION_DETAILS_READY" && statuses.some((status) => status !== "READY")) {
    errors.push("IMPLEMENTATION_DETAILS_READY requires every selected build unit to be READY.");
  }
  if (outcome === "IMPLEMENTATION_DETAILS_PARTIAL" && !statuses.includes("PARTIAL")) {
    errors.push("IMPLEMENTATION_DETAILS_PARTIAL requires at least one PARTIAL build unit.");
  }
  if (outcome === "IMPLEMENTATION_DETAILS_PARTIAL" && statuses.includes("BLOCKED")) {
    errors.push("IMPLEMENTATION_DETAILS_PARTIAL cannot include a BLOCKED selected build unit.");
  }
  if (["NEEDS_TECHNICAL_DECISION", "NEEDS_PRODUCT_DECISION", "NEEDS_USER_APPROVAL"].includes(outcome)) {
    errors.push(outcome + " cannot be consumed as a Delivery Planning readiness claim.");
  }

  return { errors, warnings, skipped: false, mappingOnly: false, physicalRealizabilityPresent };
}
