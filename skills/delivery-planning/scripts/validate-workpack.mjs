#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));

const REQUIRED_SECTIONS = [
  "Delivery Objective",
  "Delivery Scope",
  "Canonical Sources Used",
  "Stage 9 Obligation Coverage",
  "Delivery Responsibility Coverage",
  "Delivery Design",
  "Protected Boundaries",
  "Acceptance Criteria",
  "Verification Evidence Required",
  "Delivery Evidence Contract",
  "Workpack Integrity Review",
  "Definition of Done",
  "Stop and Escalation Conditions",
  "Evidence to Preserve for Later Review",
  "/goal Handoff",
];
const REVIEW_FIELDS = [
  "Canonical-source consistency",
  "Required-input closure",
  "Later-lifecycle gate disposition",
  "Stage 9 obligation coverage",
  "Verification-obligation coverage",
  "Responsibility coverage",
  "Acceptance/evidence reciprocity",
  "Phase and capability sequencing",
  "Proof capability adequacy",
];
const COMPATIBILITY_REVIEW_FIELDS = [
  "Execution eligibility",
  "Stage 9 compatibility closure",
  "Diagnostic and known-consumer coverage preservation",
  "Affected-slice isolation",
];
const LATER_LIFECYCLE_STAGES = new Set(["Release", "Deployment", "Activation", "Operation"]);
const SNAPSHOT_PATTERN = /^`?(sha256:[a-f0-9]{64})`?$/;
const LEGACY_CANONICAL_ID_PATTERN = /\b(?:C-\d{2,}|IF-\d{3,}|OSG-\d{3,}|OOS-\d{3,}|TC-\d{3,}|IS-\d{3,}|DES-\d{4,})\b/g;
const ROUTING_SOURCE_FIELDS = [
  "Canonical sources",
  "Repository Build Design",
  "Technical constraints",
  "Implementation selections",
  "Verification references",
  "Dependencies",
];
const UI_REVIEW_MODES = new Set(["automated", "agent inspection", "human acceptance"]);
const EXECUTION_PREFLIGHT_FIELDS = [
  "Disk capacity",
  "Toolchains",
  "Local artifacts and images",
  "Services and ports",
  "Browsers or devices",
  "External access",
  "Failure policy",
];

function parseArgs(argv) {
  const args = { workpack: null, softwareDesignSkill: null };
  for (let index = 2; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--workpack") args.workpack = argv[++index];
    else if (value === "--software-design-skill") args.softwareDesignSkill = argv[++index];
    else throw new Error("Unknown argument: " + value);
  }
  if (!args.workpack || !args.softwareDesignSkill) {
    throw new Error("Use --workpack <WORKPACK.md> --software-design-skill <active-software-design-skill-directory>.");
  }
  return args;
}

function escape(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sectionBody(text, heading) {
  const match = new RegExp("^##\\s+" + escape(heading) + "\\s*$([\\s\\S]*?)(?=^##\\s+|(?![\\s\\S]))", "m").exec(text);
  return match ? match[1].trim() : null;
}

function subsectionBody(text, heading) {
  const match = new RegExp("^###\\s+" + escape(heading) + "\\s*$([\\s\\S]*?)(?=^###\\s+|^##\\s+|(?![\\s\\S]))", "m").exec(text);
  return match ? match[1].trim() : null;
}

function field(block, name) {
  return new RegExp("^(?:[-*]\\s+)?\\*\\*" + escape(name) + ":\\*\\*\\s*(.+)$", "m").exec(block)?.[1]?.trim() || null;
}

function records(body, pattern) {
  const matches = [...String(body || "").matchAll(pattern)];
  return matches.map((match, index) => ({
    id: match[1],
    scope: match[2] || null,
    body: String(body).slice(match.index, matches[index + 1]?.index).trim(),
  }));
}

function ids(value, pattern) {
  return [...String(value || "").matchAll(pattern)].map((match) => match[0]);
}

function unique(values) {
  return [...new Set(values)];
}

function meaningful(value) {
  const normalized = String(value || "").trim().replace(/^`|`$/g, "");
  return Boolean(normalized) && !/^(?:TBD\.?|<[^>]+>)$/i.test(normalized);
}

function isNone(value) {
  return normalizedField(value) === "None.";
}

function isNoneDeclaration(value) {
  return /^`?None\.`?(?:\s*(?:—|-)\s*.+)?$/.test(String(value || "").trim());
}

function markdownLinks(value, baseDir) {
  return [...String(value || "").matchAll(/\[[^\]]+\]\(([^)]+)\)/g)]
    .map((match) => {
      const target = match[1];
      if (!target || /^[a-z]+:/i.test(target) || target.startsWith("#")) return null;
      const [fileTarget, fragment = ""] = target.split("#", 2);
      return {
        raw: target,
        path: path.resolve(baseDir, fileTarget),
        fragment,
      };
    })
    .filter(Boolean);
}

function localLinks(value, baseDir) {
  return markdownLinks(value, baseDir).map((link) => link.path);
}

function hasPathSequence(filePath, sequence) {
  const parts = path.resolve(filePath).split(path.sep);
  return parts.some((part, index) => part === sequence[0]
    && sequence.every((segment, offset) => parts[index + offset] === segment));
}

function samePath(left, right) {
  return path.resolve(left) === path.resolve(right);
}

function sameValues(left, right) {
  const a = unique(left).sort();
  const b = unique(right).sort();
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function citesHandoffEntry(value, baseDir, handoffPath, id) {
  return markdownLinks(value, baseDir).some((link) => samePath(link.path, handoffPath)
    && link.fragment.toLowerCase().replace(/[^a-z0-9-]/g, "")
      .includes(id.toLowerCase().replace(/[^a-z0-9-]/g, "")));
}

function citesHandoffSection(value, baseDir, handoffPath, fragment) {
  return markdownLinks(value, baseDir).some((link) => samePath(link.path, handoffPath)
    && link.fragment.toLowerCase() === fragment.toLowerCase());
}

function normalizedField(value) {
  return String(value || "").trim().replace(/^`|`$/g, "").replace(/\s+/g, " ");
}

// Resolve relative links before comparing preserved authority/profile fields across files.
function interactionProjectionValue(value, baseDir) {
  return normalizedField(String(value || "").replace(/\]\(([^)]+)\)/g, (match, target) => {
    if (/^[a-z][a-z0-9+.-]*:/i.test(target)) return match;
    const [file, fragment] = target.split("#");
    return "](" + path.resolve(baseDir, file) + (fragment ? "#" + fragment : "") + ")";
  }));
}

function leadingCodeLiteral(value) {
  return /^`([^`]+)`/.exec(String(value || "").trim())?.[1] || null;
}

function evidenceClassValues(value) {
  return [...String(value || "").matchAll(/`([a-z-]+)`/g)].map((match) => match[1]);
}

function tableRows(body) {
  return String(body || "").split("\n")
    .filter((line) => /^\s*\|/.test(line))
    .map((line) => line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim()))
    .filter((cells) => cells[0] !== "Journey" && !cells.every((cell) => /^:?-+:?$/.test(cell)));
}

// The upstream Stage 9 validator already proves that the handoff's approved
// sources name the specification's selected candidate and that its covered
// journeys are reviewed. Here we only require the workpack to preserve that
// handoff projection and give every covered journey separate evidence routes.
function handoffUiUxReview(handoff, handoffDir) {
  const body = sectionBody(handoff, "UI/UX Delivery Review");
  const sources = body === null ? null : field(body, "Approved UI/UX sources");
  if (!sources) return null;
  return {
    sources: unique(localLinks(sources, handoffDir)),
    journeys: unique(markdownLinks(field(body, "Covered prototype states"), handoffDir)
      .filter((link) => link.fragment.startsWith("journey-"))
      .map((link) => link.path + "#" + link.fragment)),
  };
}

function validateUiUxDeliveryCoverage({ body, baseDir, handoffPath, handoffUi, acceptanceIds, evidenceIds, acToVe, errors }) {
  const label = "UI/UX Delivery Coverage";
  if (!handoffUi) {
    if (body !== null) errors.push("Stage 9 Obligation Coverage adds " + label + ", but the linked handoff has no applicable UI/UX Delivery Review.");
    return;
  }
  if (body === null) {
    errors.push("Stage 9 Obligation Coverage must project the handoff's applicable UI/UX Delivery Review as ### " + label + ".");
    return;
  }
  if (!citesHandoffSection(field(body, "Handoff source"), baseDir, handoffPath, "uiux-delivery-review")) {
    errors.push(label + " **Handoff source:** must link the selected handoff's UI/UX Delivery Review.");
  }
  if (!sameValues(unique(localLinks(field(body, "Approved UI/UX sources"), baseDir)), handoffUi.sources)) {
    errors.push(label + " **Approved UI/UX sources:** must link exactly the handoff's approved UI/UX sources, including its selected candidate.");
  }
  for (const name of ["Application entrypoint", "Representative viewports and states"]) {
    if (!meaningful(field(body, name))) errors.push(label + " lacks concrete **" + name + ":**.");
  }
  const modes = [...String(field(body, "Implemented UI/UX review mode") || "").matchAll(/`([^`]+)`/g)].map((match) => match[1]);
  if (!modes.length || modes.some((mode) => !UI_REVIEW_MODES.has(mode))) {
    errors.push(label + " **Implemented UI/UX review mode:** must use `automated`, `agent inspection`, or `human acceptance`.");
  }
  const mapped = new Map();
  for (const cells of tableRows(body)) {
    const links = markdownLinks(cells[0], baseDir).filter((link) => link.fragment.startsWith("journey-"));
    if (cells.length !== 4 || links.length !== 1) {
      errors.push(label + " rows require one specification journey anchor, Acceptance, Functional evidence, and Implemented UI/UX evidence: " + cells.join(" | "));
      continue;
    }
    const key = links[0].path + "#" + links[0].fragment;
    const journey = "#" + links[0].fragment;
    if (mapped.has(key)) errors.push(label + " maps journey " + journey + " more than once.");
    const acceptance = unique(ids(cells[1], /AC-\d{3}/g));
    const functional = unique(ids(cells[2], /VE-\d{3}/g));
    const implemented = unique(ids(cells[3], /VE-\d{3}/g));
    if (!acceptance.length || !functional.length || !implemented.length) {
      errors.push(label + " journey " + journey + " must map at least one AC-xxx, functional VE-xxx, and implemented UI/UX VE-xxx.");
    }
    for (const id of acceptance) if (!acceptanceIds.has(id)) errors.push(label + " journey " + journey + " maps unknown " + id + ".");
    for (const id of [...functional, ...implemented]) if (!evidenceIds.has(id)) errors.push(label + " journey " + journey + " maps unknown " + id + ".");
    const shared = functional.filter((id) => implemented.includes(id));
    if (shared.length) {
      errors.push(label + " journey " + journey + " must keep functional and implemented UI/UX evidence separate; " + shared.join(", ") + " is used for both.");
    }
    const required = new Set(acceptance.flatMap((id) => acToVe.get(id) || []));
    for (const id of unique([...functional, ...implemented])) {
      if (evidenceIds.has(id) && !required.has(id)) errors.push(label + " journey " + journey + " evidence " + id + " is not required by its mapped acceptance criteria.");
    }
    mapped.set(key, journey);
  }
  for (const key of handoffUi.journeys) {
    if (!mapped.has(key)) errors.push(label + " omits handoff-covered journey #" + key.split("#").pop() + ".");
  }
  for (const [key, journey] of mapped) {
    if (!handoffUi.journeys.includes(key)) errors.push(label + " maps journey " + journey + " that the handoff does not cover.");
  }
}

function legacySoftwareDesignPath(filePath) {
  const normalized = path.resolve(filePath).split(path.sep).join("/");
  return /\/implementation-details\//.test(normalized)
    || /\/technical-appendix\//.test(normalized)
    || /\/system-model\/(?:areas|appendix)\//.test(normalized)
    || /\/build\/architecture\.md$/.test(normalized)
    || /\/system-lifecycle\.md$/.test(normalized)
    || /\/software-design\/architecture\.md$/.test(normalized)
    || /\/views\//.test(normalized);
}

function validateWorkpackLocation({ workpackPath, handoffPath, errors }) {
  const deliverySlice = path.basename(handoffPath, path.extname(handoffPath));
  const workpackDirectory = path.dirname(workpackPath);
  const deliveryWorkpacksDirectory = path.dirname(workpackDirectory);
  const expectedPath = path.join("delivery-workpacks", deliverySlice, "WORKPACK.md");
  if (path.basename(workpackPath) !== "WORKPACK.md"
    || path.basename(workpackDirectory) !== deliverySlice
    || path.basename(deliveryWorkpacksDirectory) !== "delivery-workpacks") {
    errors.push("WORKPACK.md must use the stable delivery-slice path " + expectedPath + "; do not add a sequence number, date, Snapshot ID, or revision suffix.");
  }
}

function validateCurrentHandoff({ handoffPath, softwareDesignSkill, errors }) {
  const wrapper = path.resolve(SCRIPT_DIR, "validate-stage9-handoff.mjs");
  if (!fs.existsSync(wrapper)) {
    errors.push("Delivery Planning lacks scripts/validate-stage9-handoff.mjs: " + wrapper + ".");
    return;
  }
  const softwareDesignRoot = path.resolve(path.dirname(handoffPath), "..", "..", "..");
  const result = spawnSync(process.execPath, [
    wrapper,
    "--software-design-skill",
    softwareDesignSkill,
    "--root",
    softwareDesignRoot,
    "--handoff",
    path.relative(softwareDesignRoot, handoffPath),
  ], { encoding: "utf8" });
  // Preserve upstream maintenance notices even when selected delivery passes.
  for (const line of String(result.stderr || "").split("\n")) {
    if (line.startsWith("NON_BLOCKING_PACKAGE_MAINTENANCE:")) console.warn(line);
  }
  if (result.status !== 0) {
    const detail = [result.stdout, result.stderr].filter(Boolean).join("\n").trim()
      || "current Stage 9 validation failed";
    errors.push("The linked Stage 9 handoff is not currently ready: " + detail);
  }
}

function sourceResponsibilities(buildUnitPath) {
  if (!fs.existsSync(buildUnitPath)) return [];
  const text = fs.readFileSync(buildUnitPath, "utf8");
  const value = /^source_responsibilities:\s*["']?([^\n"']+)["']?\s*$/m.exec(text)?.[1] || "";
  return unique(ids(value, /SR-\d{3,}/g));
}

function validate(workpackPath, softwareDesignSkill) {
  const errors = [];
  const text = fs.readFileSync(workpackPath, "utf8");
  const baseDir = path.dirname(workpackPath);

  for (const heading of REQUIRED_SECTIONS) {
    const body = sectionBody(text, heading);
    if (body === null) errors.push("WORKPACK.md is missing ## " + heading + ".");
    else if (!meaningful(body)) errors.push("WORKPACK.md ## " + heading + " is empty or placeholder-only.");
  }

  const workpackSnapshotFields = [...text.matchAll(/^\*\*Software Design snapshot:\*\*\s*(.+?)\s*$/gm)];
  const workpackSnapshot = workpackSnapshotFields.length === 1
    ? SNAPSHOT_PATTERN.exec(workpackSnapshotFields[0][1])?.[1] || null
    : null;
  if (workpackSnapshotFields.length !== 1) {
    errors.push("WORKPACK.md must contain exactly one **Software Design snapshot:** field.");
  } else if (!workpackSnapshot) {
    errors.push("WORKPACK.md must declare **Software Design snapshot:** as `sha256:` followed by 64 lowercase hexadecimal characters.");
  }

  const deliveryEvidenceBody = sectionBody(text, "Delivery Evidence Contract");
  if (deliveryEvidenceBody !== null) {
    const evidenceRoot = leadingCodeLiteral(field(deliveryEvidenceBody, "Evidence root"));
    if (evidenceRoot !== "delivery-evidence/") {
      errors.push("Delivery Evidence Contract **Evidence root:** must be exactly `delivery-evidence/`.");
    }
    if (workpackSnapshot) {
      const digest = workpackSnapshot.slice("sha256:".length);
      const expectedExecutionRoot = "delivery-evidence/executions/sha256-" + digest + "/";
      const expectedSummary = expectedExecutionRoot + "SUMMARY.md";
      const expectedArtifacts = expectedExecutionRoot + "artifacts/";
      if (leadingCodeLiteral(field(deliveryEvidenceBody, "Execution summary")) !== expectedSummary) {
        errors.push("Delivery Evidence Contract **Execution summary:** must be `" + expectedSummary + "`.");
      }
      const rawArtifacts = field(deliveryEvidenceBody, "Raw artifacts");
      if (leadingCodeLiteral(rawArtifacts) !== expectedArtifacts || !/optional/i.test(rawArtifacts || "")) {
        errors.push("Delivery Evidence Contract **Raw artifacts:** must name `" + expectedArtifacts + "` and classify it as optional.");
      }
    }
    const publicationReceipts = field(deliveryEvidenceBody, "Publication receipts");
    if (!isNone(publicationReceipts)
      && !/`delivery-evidence\/receipts\/publications\/[^`]+\.json`/.test(publicationReceipts || "")) {
      errors.push("Delivery Evidence Contract **Publication receipts:** must be `None.` or exact JSON paths under `delivery-evidence/receipts/publications/`.");
    }
    const consumerReceipts = field(deliveryEvidenceBody, "Consumer-install receipts");
    if (!isNone(consumerReceipts)
      && !/`delivery-evidence\/receipts\/consumers\/[^`]+\.json`/.test(consumerReceipts || "")) {
      errors.push("Delivery Evidence Contract **Consumer-install receipts:** must be `None.` or exact JSON paths under `delivery-evidence/receipts/consumers/`.");
    }
    const compatibilityEvidence = field(deliveryEvidenceBody, "Compatibility evidence");
    if (!meaningful(compatibilityEvidence)
      || !/VE-\d{3}/.test(compatibilityEvidence)
      || !/(?:publication|installation|install)[^\n]*(?:do not|does not|cannot)[^\n]*compatib|compatib[^\n]*(?:not|cannot)[^\n]*(?:publication|installation|install)/i.test(compatibilityEvidence)) {
      errors.push("Delivery Evidence Contract **Compatibility evidence:** must map a shipped-seam VE-xxx and state that publication or installation receipts do not establish behavioral compatibility.");
    }
    const historicalEvidence = field(deliveryEvidenceBody, "Historical evidence");
    if (!meaningful(historicalEvidence) || !/preserv/i.test(historicalEvidence) || !/(?:without|do not|must not).*(?:rewrite|migrat)/i.test(historicalEvidence)) {
      errors.push("Delivery Evidence Contract **Historical evidence:** must preserve existing evidence without silent rewrite or migration.");
    }
  }

  const canonicalSourcesBody = sectionBody(text, "Canonical Sources Used") || "";
  const canonicalSourceTable = canonicalSourcesBody.split("\n").filter((line) => /^\s*\|/.test(line)).join("\n");
  const canonicalAuthorityFields = text.split("\n")
    .filter((line) => /^\s*(?:[-*]\s+)?\*\*Canonical (?:source|sources|responsibility):\*\*/i.test(line))
    .join("\n");
  const legacyIds = unique([...(`${canonicalSourceTable}\n${canonicalAuthorityFields}`).matchAll(LEGACY_CANONICAL_ID_PATTERN)]
    .map((match) => match[0]));
  if (legacyIds.length) {
    errors.push("WORKPACK.md presents legacy identifiers as current canonical authority (" + legacyIds.join(", ") + "); use current SR-xxx, IFACE-xxx, CONS-xxx, SEL-xxx, and TICKET-NNNN identities.");
  }
  const canonicalSourceLinks = markdownLinks(canonicalSourceTable, baseDir);
  for (const link of canonicalSourceLinks) {
    if (!fs.existsSync(link.path)) errors.push("Canonical Sources Used links a missing local source: " + link.path + ".");
    if (legacySoftwareDesignPath(link.path)) {
      errors.push("Canonical Sources Used presents a retired Software Design path as current authority: " + link.raw + ".");
    }
  }
  const stage9Rows = canonicalSourcesBody.split("\n").filter((line) => /^\s*\|.*\bStage 9 handoff\b/i.test(line));
  if (stage9Rows.length !== 1) errors.push("Canonical Sources Used must contain exactly one Stage 9 handoff row.");
  const stage9Links = stage9Rows.length === 1 ? localLinks(stage9Rows[0], baseDir) : [];
  if (stage9Rows.length === 1 && stage9Links.length !== 1) {
    errors.push("The Stage 9 handoff row must contain exactly one local Markdown link.");
  }
  const handoffPath = stage9Links[0] || null;
  let handoff = "";
  let handoffSelectedScopes = [];
  let handoffWritableScopes = [];
  let handoffRouting = [];
  let handoffLaterGates = [];
  let handoffInputs = [];
  let handoffInteractions = [];
  let handoffExcludedInteractions = [];
  let handoffPhysicalRealizability = [];
  let handoffVerificationObligations = [];
  let handoffInputNone = null;
  let handoffInteractionNone = null;
  let handoffHasInputLedger = false;
  let handoffHasInteractionClosure = false;
  let handoffRequiredSourcePaths = [];
  let handoffUi = null;
  if (handoffPath) validateWorkpackLocation({ workpackPath, handoffPath, errors });
  if (handoffPath && !hasPathSequence(handoffPath, ["build", "workflow", "handoffs"])) {
    errors.push("The Stage 9 handoff must use the current build/workflow/handoffs/ path.");
  }
  if (handoffPath && !fs.existsSync(handoffPath)) {
    errors.push("The linked Stage 9 handoff does not exist: " + handoffPath + ".");
  } else if (handoffPath) {
    handoff = fs.readFileSync(handoffPath, "utf8");
    const handoffSnapshotFields = [...handoff.matchAll(/^\*\*Snapshot ID:\*\*\s*(.+?)\s*$/gm)];
    const handoffSnapshot = handoffSnapshotFields.length === 1
      ? SNAPSHOT_PATTERN.exec(handoffSnapshotFields[0][1])?.[1] || null
      : null;
    if (handoffSnapshotFields.length !== 1 || !handoffSnapshot) {
      errors.push("The linked Stage 9 handoff must contain exactly one valid **Snapshot ID:** field.");
    } else if (workpackSnapshot && workpackSnapshot !== handoffSnapshot) {
      errors.push("WORKPACK.md Software Design snapshot does not match the linked Stage 9 handoff Snapshot ID.");
    }
    validateCurrentHandoff({ handoffPath, softwareDesignSkill, errors });

    handoffSelectedScopes = unique(ids(field(handoff, "Selected build units"), /BUILD_UNIT:BU-\d{3,}/g));
    handoffWritableScopes = unique(ids(field(handoff, "Writable build units"), /BUILD_UNIT:BU-\d{3,}/g));
    const routingBody = sectionBody(handoff, "Build Unit Routing Index") || "";
    handoffRouting = records(routingBody, /^###\s+`?(BUILD_UNIT:BU-\d{3,})`?\s*$/gm);
    const routingScopes = handoffRouting.map((record) => record.id);
    if (!sameValues(handoffSelectedScopes, routingScopes)) {
      errors.push("The linked Stage 9 handoff selected Build Units do not match its Build Unit Routing Index.");
    }

    const handoffDir = path.dirname(handoffPath);
    const routedLinks = handoffRouting.flatMap((record) => ROUTING_SOURCE_FIELDS.flatMap((name) => localLinks(field(record.body, name), handoffDir)));
    const protectedLinks = localLinks(sectionBody(handoff, "Protected Technical Boundaries"), handoffDir);
    const integrationLinks = localLinks(sectionBody(handoff, "Cross-Unit Integration And Verification"), handoffDir);
    handoffRequiredSourcePaths = unique([...routedLinks, ...protectedLinks, ...integrationLinks])
      .filter((target) => !samePath(target, handoffPath));
    for (const requiredPath of handoffRequiredSourcePaths) {
      if (!canonicalSourceLinks.some((link) => samePath(link.path, requiredPath))) {
        errors.push("Canonical Sources Used omits a Stage 9-routed source: " + requiredPath + ".");
      }
    }

    const repositoryDesignPaths = unique(handoffRouting.flatMap((record) => localLinks(field(record.body, "Repository Build Design"), handoffDir)));
    for (const repositoryDesignPath of repositoryDesignPaths) {
      if (!fs.existsSync(repositoryDesignPath)) continue;
      const repositoryDesign = fs.readFileSync(repositoryDesignPath, "utf8");
      const guidanceLinks = localLinks(field(repositoryDesign, "Derived artifact"), path.dirname(repositoryDesignPath));
      for (const guidancePath of guidanceLinks) {
        if (!fs.existsSync(guidancePath)) {
          errors.push("Repository Build Design links a missing derived agent-guidance artifact: " + guidancePath + ".");
        } else if (!canonicalSourceLinks.some((link) => samePath(link.path, guidancePath))) {
          errors.push("Canonical Sources Used omits routed repository agent guidance: " + guidancePath + ".");
        }
      }
    }

    handoffHasInputLedger = sectionBody(handoff, "Required Input Ledger") !== null;
    const handoffInputBody = sectionBody(handoff, "Required Input Ledger") || "";
    handoffInputs = records(handoffInputBody, /^###\s+`?(INPUT-\d{3})`?\s+—\s+.+$/gm);
    handoffInputNone = field(handoffInputBody, "Required inputs");
    handoffHasInteractionClosure = sectionBody(handoff, "Required Interaction Closure") !== null;
    const handoffInteractionBody = sectionBody(handoff, "Required Interaction Closure") || "";
    handoffInteractions = records(handoffInteractionBody, /^###\s+`?(INT-\d{3})`?\s+—\s+`?(IFACE-\d{3,}\.ACT-\d{3})`?\s*$/gm);
    handoffInteractionNone = field(handoffInteractionBody, "Required interactions");
    const excludedBody = subsectionBody(sectionBody(handoff, "Exclusions And Local Discretion") || "", "Interaction Scope Exclusions") || "";
    handoffExcludedInteractions = [...excludedBody.matchAll(/^\|\s*`(IFACE-\d{3}\.ACT-\d{3})`\s*\|/gm)].map((match) => match[1]);

    const handoffPhysicalBody = sectionBody(handoff, "Physical Realizability Closure") || "";
    handoffPhysicalRealizability = records(handoffPhysicalBody, /^###\s+`?(PSEAM-\d{3})`?\s+—\s+.+$/gm);

    const handoffVerificationBody = sectionBody(handoff, "Required Verification Obligation Closure") || "";
    handoffVerificationObligations = records(
      handoffVerificationBody,
      /^###\s+`?((?:INV|SEC)-\d{3,}\.VO-\d{3})`?\s+—\s+.+$/gm,
    );

    handoffUi = handoffUiUxReview(handoff, handoffDir);

    const handoffGateBody = sectionBody(handoff, "Later-Lifecycle Gates");
    handoffLaterGates = handoffGateBody === null
      ? []
      : records(handoffGateBody, /^###\s+`?(LGATE-\d{3})`?\s*(?:—|:)\s+.+$/gm);
  }

  const scopeBody = sectionBody(text, "Delivery Scope") || "";
  const scopeSubsections = [
    "Selected Build Units",
    "Repository Disposition",
    "Direct Build Unit Dependencies",
    "Explicit Exclusions",
    "Local Implementation Discretion",
  ];
  for (const heading of scopeSubsections) {
    const body = subsectionBody(scopeBody, heading);
    if (body === null) errors.push("Delivery Scope is missing ### " + heading + ".");
    else if (!meaningful(body)) errors.push("Delivery Scope ### " + heading + " is empty or placeholder-only.");
  }
  const selectedBody = subsectionBody(scopeBody, "Selected Build Units") || "";
  const selectedScopes = unique(ids(selectedBody, /BUILD_UNIT:BU-\d{3,}/g));
  if (!selectedScopes.length) errors.push("Delivery Scope must name at least one selected BUILD_UNIT:BU-xxx.");
  if (handoffPath && !sameValues(selectedScopes, handoffSelectedScopes)) {
    errors.push("Delivery Scope selected Build Units do not match the linked Stage 9 handoff.");
  }
  const deliveryRoles = new Map();
  if (handoffPhysicalRealizability.length) {
    for (const scope of selectedScopes) {
      const roleLines = selectedBody.split("\n").filter((line) => line.includes(scope));
      const roles = unique(roleLines.flatMap((line) => [...line.matchAll(/`(Target|Existing prerequisite)`/g)].map((match) => match[1])));
      if (roleLines.length !== 1 || roles.length !== 1) {
        errors.push(scope + " must appear once under Selected Build Units with exactly one `Target` or `Existing prerequisite` role.");
      } else {
        deliveryRoles.set(scope, roles[0]);
      }
    }
    if (![...deliveryRoles.values()].includes("Target")) {
      errors.push("A workpack must select at least one Build Unit with role `Target`.");
    }
    const targetScopes = [...deliveryRoles.entries()].filter(([, role]) => role === "Target").map(([scope]) => scope);
    if (!sameValues(targetScopes, handoffWritableScopes)) {
      errors.push("Workpack Target Build Units must exactly match the handoff Writable build units.");
    }
  }

  const dependencyBody = subsectionBody(scopeBody, "Direct Build Unit Dependencies") || "";
  const workpackDependencies = unique(ids(dependencyBody, /BUILD_UNIT:BU-\d{3,}/g));
  const handoffDependencies = unique(handoffRouting.flatMap((record) => ids(field(record.body, "Dependencies"), /BUILD_UNIT:BU-\d{3,}/g)));
  if (handoffPath && !sameValues(workpackDependencies, handoffDependencies)) {
    errors.push("Delivery Scope direct Build Unit dependencies do not match the linked Stage 9 routing entries.");
  }

  const repositoryBody = subsectionBody(scopeBody, "Repository Disposition") || "";
  const explicitExclusionsBody = subsectionBody(scopeBody, "Explicit Exclusions") || "";
  const excludedInteractions = field(explicitExclusionsBody, "Excluded interactions");
  if (handoffExcludedInteractions.length || excludedInteractions) {
    const projected = ids(excludedInteractions || "", /IFACE-\d{3}\.ACT-\d{3}/g);
    if (projected.length !== unique(projected).length || !sameValues(projected, handoffExcludedInteractions)) {
      errors.push("Explicit Exclusions must project exactly the linked Stage 9 Interaction Scope Exclusions.");
    }
    if (!handoffPath || !localLinks(excludedInteractions, baseDir).some((link) => samePath(link, handoffPath))) {
      errors.push("Excluded interactions must link the selected Stage 9 handoff's scope dispositions.");
    }
  }
  const routedRepositories = [];
  for (const route of handoffRouting) {
    const repositoryValue = field(route.body, "Repository Build Design") || "";
    const repositoryId = ids(repositoryValue, /REPO-\d{3,}/g)[0] || null;
    const dispositionValue = normalizedField(field(route.body, "Repository membership disposition"));
    const disposition = /^(Full repository|Partial repository)\b/.exec(dispositionValue)?.[1] || null;
    if (!repositoryId || !disposition) continue;
    routedRepositories.push(repositoryId);
    const line = repositoryBody.split("\n").find((candidate) => candidate.includes(repositoryId));
    if (!line) {
      errors.push("Repository Disposition omits " + repositoryId + " from the linked Stage 9 routing entry.");
      continue;
    }
    if (!line.includes(disposition)) {
      errors.push("Repository Disposition for " + repositoryId + " does not match Stage 9 value `" + disposition + "`.");
    }
    if (disposition === "Partial repository") {
      const excluded = unique(ids(dispositionValue, /BU-\d{3,}/g));
      for (const id of excluded) {
        if (!line.includes(id) || !explicitExclusionsBody.includes(id)) {
          errors.push("Partial repository disposition must preserve excluded " + id + " in Repository Disposition and Explicit Exclusions.");
        }
      }
    }
  }
  for (const repositoryId of unique(ids(repositoryBody, /REPO-\d{3,}/g))) {
    if (!routedRepositories.includes(repositoryId)) errors.push("Repository Disposition adds unrouted " + repositoryId + ".");
  }

  const acceptanceBody = sectionBody(text, "Acceptance Criteria") || "";
  const evidenceBody = sectionBody(text, "Verification Evidence Required") || "";
  const acceptance = records(acceptanceBody, /^###\s+(AC-\d{3}):\s+.+$/gm);
  const evidence = records(evidenceBody, /^###\s+(VE-\d{3}):\s+.+$/gm);
  const acceptanceIds = new Set(acceptance.map((record) => record.id));
  const evidenceIds = new Set(evidence.map((record) => record.id));
  if (!acceptance.length) errors.push("Acceptance Criteria must define at least one ### AC-xxx entry.");
  if (!evidence.length) errors.push("Verification Evidence Required must define at least one ### VE-xxx entry.");
  if (acceptanceIds.size !== acceptance.length) errors.push("Acceptance Criteria contains duplicate AC identifiers.");
  if (evidenceIds.size !== evidence.length) errors.push("Verification Evidence Required contains duplicate VE identifiers.");

  const acToVe = new Map();
  for (const record of acceptance) {
    const canonical = field(record.body, "Canonical source");
    const canonicalLinks = markdownLinks(canonical, baseDir);
    if (!meaningful(canonical) || !canonicalLinks.length || !canonicalLinks.some((link) => fs.existsSync(link.path))) {
      errors.push(record.id + " **Canonical source:** must cite an existing canonical local link.");
    }
    if (!meaningful(field(record.body, "Expected result"))) errors.push(record.id + " lacks a concrete **Expected result:**.");
    const references = unique(ids(field(record.body, "Required evidence"), /VE-\d{3}/g));
    acToVe.set(record.id, references);
    if (!references.length) errors.push(record.id + " must name at least one VE-xxx in **Required evidence:**.");
    for (const id of references) if (!evidenceIds.has(id)) errors.push(record.id + " references unknown " + id + ".");
  }

  const veToAc = new Map();
  for (const record of evidence) {
    for (const name of ["Capability", "Procedure", "Evidence to preserve"]) {
      if (!meaningful(field(record.body, name))) errors.push(record.id + " lacks a concrete **" + name + ":**.");
    }
    const capability = normalizedField(field(record.body, "Capability"));
    if (!/^None\.$/.test(capability)) {
      const capabilityIds = unique(ids(capability, /VA-\d{3,}/g));
      if (capabilityIds.length !== 1 || !canonicalSourceTable.includes(capabilityIds[0])) {
        errors.push(record.id + " **Capability:** must be `None.` or name one VA-xxx present in Canonical Sources Used.");
      }
    }
    const references = unique(ids(field(record.body, "Supports"), /AC-\d{3}/g));
    veToAc.set(record.id, references);
    if (!references.length) errors.push(record.id + " must name at least one AC-xxx in **Supports:**.");
    for (const id of references) if (!acceptanceIds.has(id)) errors.push(record.id + " references unknown " + id + ".");
  }

  for (const [acId, veIds] of acToVe) {
    for (const veId of veIds) if (!(veToAc.get(veId) || []).includes(acId)) {
      errors.push(acId + " requires " + veId + " but " + veId + " does not reciprocally support it.");
    }
  }
  for (const [veId, acIds] of veToAc) {
    for (const acId of acIds) if (!(acToVe.get(acId) || []).includes(veId)) {
      errors.push(veId + " supports " + acId + " but " + acId + " does not reciprocally require it.");
    }
  }

  const obligationBody = sectionBody(text, "Stage 9 Obligation Coverage") || "";
  const inputObligations = records(obligationBody, /^###\s+`?(INPUT-\d{3})`?\s+—\s+.+$/gm);
  const interactionObligations = records(obligationBody, /^###\s+`?(INT-\d{3})`?\s+—\s+`?(IFACE-\d{3,}\.ACT-\d{3})`?\s*$/gm);
  const verificationObligations = records(
    obligationBody,
    /^###\s+`?((?:INV|SEC)-\d{3,}\.VO-\d{3})`?\s+—\s+.+$/gm,
  );
  const physicalObligations = records(obligationBody, /^###\s+`?(PSEAM-\d{3})`?\s+—\s+.+$/gm);
  const inputObligationNone = field(obligationBody, "Input obligations");
  const interactionObligationNone = field(obligationBody, "Interaction obligations");
  const verificationObligationNone = field(obligationBody, "Verification obligations");
  const declaredLaterGateIds = new Set(ids(sectionBody(text, "Later-Lifecycle Gates"), /LGATE-\d{3}/g));
  const declaredProtectedBoundaryIds = new Set(records(
    sectionBody(text, "Protected Boundaries") || "",
    /^###\s+(PB-\d{3}):\s+.+$/gm,
  ).map((record) => record.id));

  if (handoffPath && !handoffHasInputLedger) errors.push("The linked Stage 9 handoff lacks Required Input Ledger.");
  if (handoffPath && !handoffHasInteractionClosure) errors.push("The linked Stage 9 handoff lacks Required Interaction Closure.");

  if (inputObligations.length) {
    if (inputObligationNone) errors.push("Stage 9 Obligation Coverage cannot combine **Input obligations:** with INPUT entries.");
    if (new Set(inputObligations.map((record) => record.id)).size !== inputObligations.length) {
      errors.push("Stage 9 Obligation Coverage contains duplicate INPUT identifiers.");
    }
    if (handoffPath && !sameValues(inputObligations.map((record) => record.id), handoffInputs.map((record) => record.id))) {
      errors.push("Stage 9 Obligation Coverage must project exactly every INPUT-NNN from the linked handoff.");
    }
  } else if (handoffInputs.length) {
    errors.push("Stage 9 Obligation Coverage omits the linked handoff's INPUT-NNN obligations.");
  } else if (!isNoneDeclaration(handoffInputNone)
    || !isNoneDeclaration(inputObligationNone)
    || !handoffPath
    || !citesHandoffSection(inputObligationNone, baseDir, handoffPath, "required-input-ledger")) {
    errors.push("An input-free slice must preserve an evidence-linked **Input obligations:** `None.` declaration to the handoff Required Input Ledger.");
  }

  for (const obligation of inputObligations) {
    if (!handoffPath || !citesHandoffEntry(field(obligation.body, "Handoff source"), baseDir, handoffPath, obligation.id)) {
      errors.push(obligation.id + " **Handoff source:** must link its exact entry in the selected Stage 9 handoff.");
    }
    if (!meaningful(field(obligation.body, "Handling"))) errors.push(obligation.id + " lacks concrete **Handling:**.");
    const coverageValue = field(obligation.body, "Coverage");
    const mapped = unique(ids(coverageValue, /(?:AC|VE)-\d{3}|LGATE-\d{3}/g));
    if (!mapped.length) errors.push(obligation.id + " must map **Coverage:** to at least one AC-xxx, VE-xxx, or LGATE-NNN.");
    for (const id of mapped) {
      if (id.startsWith("AC-") && !acceptanceIds.has(id)) errors.push(obligation.id + " maps to unknown " + id + ".");
      if (id.startsWith("VE-") && !evidenceIds.has(id)) errors.push(obligation.id + " maps to unknown " + id + ".");
      if (id.startsWith("LGATE-") && !declaredLaterGateIds.has(id)) errors.push(obligation.id + " maps to unknown " + id + ".");
    }
  }

  if (interactionObligations.length) {
    if (interactionObligationNone) errors.push("Stage 9 Obligation Coverage cannot combine **Interaction obligations:** with INT entries.");
    if (new Set(interactionObligations.map((record) => record.id)).size !== interactionObligations.length) {
      errors.push("Stage 9 Obligation Coverage contains duplicate INT identifiers.");
    }
    if (new Set(interactionObligations.map((record) => record.scope)).size !== interactionObligations.length) {
      errors.push("Stage 9 Obligation Coverage contains duplicate IFACE.ACT interactions.");
    }
    const exactInteractionProjection = sameValues(
      interactionObligations.map((record) => record.id + "=" + record.scope),
      handoffInteractions.map((record) => record.id + "=" + record.scope),
    );
    if (handoffPath && !exactInteractionProjection) {
      errors.push("Stage 9 Obligation Coverage must project every INT-NNN with its exact IFACE-xxx.ACT-NNN from the linked handoff.");
    }
  } else if (handoffInteractions.length) {
    errors.push("Stage 9 Obligation Coverage omits the linked handoff's INT-NNN obligations.");
  } else if (!isNoneDeclaration(handoffInteractionNone)
    || !isNoneDeclaration(interactionObligationNone)
    || !handoffPath
    || !citesHandoffSection(interactionObligationNone, baseDir, handoffPath, "required-interaction-closure")) {
    errors.push("An interaction-free slice must preserve an evidence-linked **Interaction obligations:** `None.` declaration to the handoff Required Interaction Closure.");
  }

  for (const obligation of interactionObligations) {
    const upstream = handoffInteractions.find((record) => record.id === obligation.id && record.scope === obligation.scope);
    if (!handoffPath || !citesHandoffEntry(field(obligation.body, "Handoff source"), baseDir, handoffPath, obligation.id)) {
      errors.push(obligation.id + " **Handoff source:** must link its exact entry in the selected Stage 9 handoff.");
    }
    const gatedInteraction = normalizedField(field(upstream?.body || "", "Availability")) === "later-lifecycle output";
    const externalConsumer = /^`External`(?:\s|$)/.test(field(upstream?.body || "", "Consumer") || "");
    if (gatedInteraction || externalConsumer) {
      const preserved = ["Consumer", "Producer", "Proof owner", "Required at", "Availability"];
      if (gatedInteraction) preserved.push("Later-lifecycle gate", "Lifecycle inputs", "Current-profile inputs", "Current-profile availability", "Current-profile verification");
      for (const name of preserved) {
        const expected = field(upstream?.body || "", name);
        if (!expected || interactionProjectionValue(field(obligation.body, name), baseDir)
          !== interactionProjectionValue(expected, path.dirname(handoffPath))) {
          errors.push(obligation.id + " must preserve Stage 9 **" + name + ":**; verification ownership cannot change actor identity, authority, scope or lifecycle handling.");
        }
      }
      if (gatedInteraction) {
        const gates = unique(ids(field(upstream.body, "Later-lifecycle gate"), /LGATE-\d{3}/g));
        const coverageGates = unique(ids(field(obligation.body, "Coverage"), /LGATE-\d{3}/g));
        if (!gates.length || !sameValues(gates, coverageGates) || gates.some((id) => !declaredLaterGateIds.has(id))) {
          errors.push(obligation.id + " must map Coverage to its exact declared later-lifecycle gate as well as current-profile VE evidence.");
        }
      }
    }
    const mappedEvidence = unique(ids(field(obligation.body, "Coverage"), /VE-\d{3}/g));
    if (!mappedEvidence.length) errors.push(obligation.id + " must map **Coverage:** to at least one consumer-observable VE-xxx.");
    for (const id of mappedEvidence) if (!evidenceIds.has(id)) errors.push(obligation.id + " maps to unknown " + id + ".");

    const declaredClasses = evidenceClassValues(field(obligation.body, "Required evidence classes"));
    const upstreamClasses = evidenceClassValues(field(upstream?.body || "", "Required evidence classes"));
    if (!upstream || !declaredClasses.length || new Set(declaredClasses).size !== declaredClasses.length || !sameValues(declaredClasses, upstreamClasses)) {
      errors.push(obligation.id + " **Required evidence classes:** must exactly preserve the linked Stage 9 interaction's evidence classes.");
    }

    const risk = normalizedField(field(upstream?.body || "", "Risk"));
    const highRiskCases = field(obligation.body, "High-risk cases");
    if (risk === "ordinary") {
      if (!isNone(highRiskCases)) errors.push(obligation.id + " ordinary risk must use `None.` for **High-risk cases:**.");
    } else if (risk === "high") {
      const cases = [
        ["positive", /(?:^|;)\s*`?Positive(?: path)?\s*:\s*([^;]+)/i],
        ["rejection\/denial", /(?:^|;)\s*Rejection\/denial\s*:\s*([^;]+)/i],
        ["failure\/recovery", /(?:^|;)\s*Failure\/recovery\s*:\s*([^;]+)/i],
      ];
      for (const [label, pattern] of cases) {
        const caseEvidence = unique(ids(pattern.exec(highRiskCases || "")?.[1], /VE-\d{3}/g));
        if (!caseEvidence.length) errors.push(obligation.id + " high risk must map the " + label + " case to VE-xxx evidence.");
        for (const id of caseEvidence) if (!evidenceIds.has(id)) errors.push(obligation.id + " high-risk " + label + " case maps to unknown " + id + ".");
      }
    } else if (upstream) {
      errors.push(obligation.id + " has no valid upstream risk classification.");
    }
  }

  if (handoffPhysicalRealizability.length) {
    if (!handoffPhysicalRealizability.length) {
      errors.push("The handoff lacks PSEAM-NNN entries.");
    }
    if (new Set(physicalObligations.map((record) => record.id)).size !== physicalObligations.length) {
      errors.push("Stage 9 Obligation Coverage contains duplicate PSEAM identifiers.");
    }
    if (!sameValues(physicalObligations.map((record) => record.id), handoffPhysicalRealizability.map((record) => record.id))) {
      errors.push("Stage 9 Obligation Coverage must project exactly every PSEAM-NNN from the linked handoff.");
    }
    for (const obligation of physicalObligations) {
      const upstream = handoffPhysicalRealizability.find((record) => record.id === obligation.id);
      if (!handoffPath || !citesHandoffEntry(field(obligation.body, "Handoff source"), baseDir, handoffPath, obligation.id)) {
        errors.push(obligation.id + " **Handoff source:** must link its exact entry in the selected Stage 9 handoff.");
      }
      const result = normalizedField(field(obligation.body, "Handoff result"));
      const upstreamResult = normalizedField(field(upstream?.body || "", "Current result"));
      if (!upstream || result !== upstreamResult) {
        errors.push(obligation.id + " **Handoff result:** must exactly preserve the linked handoff's Current result.");
      }
      if (!meaningful(field(obligation.body, "Handling"))) errors.push(obligation.id + " lacks concrete **Handling:**.");
      for (const localField of ["Implementation situation", "Boundary class", "Candidate compatibility proof", "Evidence provenance"]) {
        if (leadingCodeLiteral(field(obligation.body, localField)) !== leadingCodeLiteral(field(upstream?.body || "", localField))) {
          errors.push(obligation.id + " **" + localField + ":** must exactly preserve the linked handoff value.");
        }
      }
      if (!meaningful(field(obligation.body, "Direct change-impact handling"))) {
        errors.push(obligation.id + " lacks concrete **Direct change-impact handling:**.");
      }
      if (!meaningful(field(obligation.body, "Required-command-effect handling"))) {
        errors.push(obligation.id + " lacks concrete **Required-command-effect handling:**.");
      }
      const mapped = unique(ids(field(obligation.body, "Coverage"), /(?:AC|VE)-\d{3}/g));
      if (!mapped.some((id) => id.startsWith("VE-"))) {
        errors.push(obligation.id + " must map **Coverage:** to at least one consumer-observable VE-xxx.");
      }
      for (const id of mapped) {
        if (id.startsWith("AC-") && !acceptanceIds.has(id)) errors.push(obligation.id + " maps to unknown " + id + ".");
        if (id.startsWith("VE-") && !evidenceIds.has(id)) errors.push(obligation.id + " maps to unknown " + id + ".");
      }
      const boundary = field(obligation.body, "Protected-boundary compatibility");
      const boundaryIds = unique(ids(boundary, /PB-\d{3}/g));
      if (!meaningful(boundary) || !boundaryIds.length) {
        errors.push(obligation.id + " lacks concrete **Protected-boundary compatibility:** naming PB-xxx.");
      }
      for (const id of boundaryIds) if (!declaredProtectedBoundaryIds.has(id)) {
        errors.push(obligation.id + " names unknown protected boundary " + id + ".");
      }
    }

    const preflight = sectionBody(text, "Execution Environment Preflight");
    if (preflight === null) {
      errors.push("The workpack is missing ## Execution Environment Preflight.");
    } else {
      for (const name of EXECUTION_PREFLIGHT_FIELDS) {
        const value = field(preflight, name);
        if (!value || !meaningful(value) || /<[^>]+>/.test(value)) {
          errors.push("Execution Environment Preflight **" + name + ":** lacks a concrete check or Not applicable reason.");
        }
      }
      const failurePolicy = field(preflight, "Failure policy") || "";
      if (!/safe independent/i.test(failurePolicy)
        || !/(?:group|consolidat)/i.test(failurePolicy)
        || !/before source edits/i.test(failurePolicy)) {
        errors.push("Execution Environment Preflight **Failure policy:** must complete safe independent checks and consolidate failures before source edits.");
      }
    }
  }

  if (verificationObligations.length) {
    if (verificationObligationNone) {
      errors.push("Stage 9 Obligation Coverage cannot combine **Verification obligations:** with structured VO entries.");
    }
    if (new Set(verificationObligations.map((record) => record.id)).size !== verificationObligations.length) {
      errors.push("Stage 9 Obligation Coverage contains duplicate structured Verification Obligation identifiers.");
    }
    if (handoffPath && !sameValues(
      verificationObligations.map((record) => record.id),
      handoffVerificationObligations.map((record) => record.id),
    )) {
      errors.push("Stage 9 Obligation Coverage must project exactly every structured Verification Obligation from the linked handoff.");
    }
  } else if (handoffVerificationObligations.length) {
    errors.push("Stage 9 Obligation Coverage omits the linked handoff's structured Verification Obligations.");
  } else if (!isNoneDeclaration(verificationObligationNone)
    || !handoffPath
    || !citesHandoffSection(verificationObligationNone, baseDir, handoffPath, "allowed-delivery-slice")) {
    errors.push("A slice without structured Verification Obligations must preserve an evidence-linked **Verification obligations:** `None.` declaration to the handoff selected scope.");
  }

  for (const obligation of verificationObligations) {
    const upstream = handoffVerificationObligations.find((record) => record.id === obligation.id);
    if (!handoffPath || !citesHandoffEntry(field(obligation.body, "Handoff source"), baseDir, handoffPath, obligation.id)) {
      errors.push(obligation.id + " **Handoff source:** must link its exact entry in the selected Stage 9 handoff.");
    }
    const selectedAssignments = unique(ids(field(obligation.body, "Selected assignments"), /BUILD_UNIT:BU-\d{3,}/g));
    const upstreamAssignments = unique(ids(field(upstream?.body || "", "Selected assignments"), /BUILD_UNIT:BU-\d{3,}/g));
    if (!upstream || !selectedAssignments.length || !sameValues(selectedAssignments, upstreamAssignments)) {
      errors.push(obligation.id + " **Selected assignments:** must exactly preserve the linked handoff's selected Build Unit owners.");
    }
    const manifestRoute = field(obligation.body, "Repository manifest route");
    const manifestLinks = markdownLinks(manifestRoute, baseDir);
    const routeNamesManifest = /assurance\/coverage\.yaml/.test(manifestRoute || "");
    const routeNamesExternalEvidence = /external|no-code/i.test(manifestRoute || "");
    if (!meaningful(manifestRoute)
      || !manifestLinks.length
      || !manifestLinks.some((link) => fs.existsSync(link.path))
      || (!routeNamesManifest && !routeNamesExternalEvidence)) {
      errors.push(obligation.id + " **Repository manifest route:** must cite an existing canonical route and name `assurance/coverage.yaml` or the external/no-code evidence route.");
    }
    if (!meaningful(field(obligation.body, "Required evidence"))) {
      errors.push(obligation.id + " lacks concrete **Required evidence:** preserving the handoff obligation.");
    }
    const mappedEvidence = unique(ids(field(obligation.body, "Coverage"), /VE-\d{3}/g));
    if (!mappedEvidence.length) errors.push(obligation.id + " must map **Coverage:** to at least one VE-xxx.");
    for (const id of mappedEvidence) if (!evidenceIds.has(id)) errors.push(obligation.id + " maps to unknown " + id + ".");
  }

  validateUiUxDeliveryCoverage({
    body: subsectionBody(obligationBody, "UI/UX Delivery Coverage"),
    baseDir,
    handoffPath,
    handoffUi,
    acceptanceIds,
    evidenceIds,
    acToVe,
    errors,
  });

  const coverageBody = sectionBody(text, "Delivery Responsibility Coverage") || "";
  const coverage = records(coverageBody, /^###\s+(RCOV-\d{3})\s+·\s+`?(BUILD_UNIT:BU-\d{3,})`?\s*$/gm);
  const coverageIds = new Set(coverage.map((record) => record.id));
  if (!coverage.length) errors.push("Delivery Responsibility Coverage must define at least one ### RCOV-xxx entry.");
  if (coverageIds.size !== coverage.length) errors.push("Delivery Responsibility Coverage contains duplicate RCOV identifiers.");
  for (const scope of selectedScopes) {
    if (!coverage.some((record) => record.scope === scope)) errors.push(scope + " has no Delivery Responsibility Coverage entry.");
  }
  if (handoffPhysicalRealizability.length) {
    for (const [scope, role] of deliveryRoles) {
      const dispositions = coverage
        .filter((record) => record.scope === scope)
        .map((record) => normalizedField(field(record.body, "Disposition")));
      if (role === "Target" && !dispositions.includes("Deliver")) {
        errors.push(scope + " is a Target but has no Deliver RCOV entry.");
      }
      if (role === "Existing prerequisite") {
        if (dispositions.includes("Deliver")) errors.push(scope + " is an Existing prerequisite but has a Deliver RCOV entry.");
        if (!dispositions.includes("Existing prerequisite")) {
          errors.push(scope + " is an Existing prerequisite but has no verification-only Existing prerequisite RCOV entry.");
        }
      }
    }
  }
  for (const route of handoffRouting) {
    const buildUnitPaths = localLinks(field(route.body, "Canonical sources"), path.dirname(handoffPath))
      .filter((target) => hasPathSequence(target, ["build", "units"]));
    if (buildUnitPaths.length !== 1) {
      errors.push(route.id + " must route exactly one canonical Build Unit record.");
      continue;
    }
    for (const responsibilityId of sourceResponsibilities(buildUnitPaths[0])) {
      const mapped = coverage.some((record) => record.scope === route.id
        && String(field(record.body, "Canonical responsibility") || "").toUpperCase().includes(responsibilityId));
      if (!mapped) errors.push(route.id + " has no RCOV entry for canonical " + responsibilityId + ".");
    }
  }
  for (const record of coverage) {
    if (!selectedScopes.includes(record.scope)) errors.push(record.id + " covers unselected " + record.scope + ".");
    const canonical = field(record.body, "Canonical responsibility");
    if (!meaningful(canonical)) errors.push(record.id + " lacks a concrete **Canonical responsibility:**.");
    const canonicalResponsibilityIds = unique(ids(String(canonical || "").toUpperCase(), /SR-\d{3,}/g));
    if (canonicalResponsibilityIds.length > 1) {
      errors.push(record.id + " must map one canonical responsibility per RCOV entry, not " + canonicalResponsibilityIds.join(", ") + ".");
    }
    const links = localLinks(canonical, baseDir);
    if (!links.length || !links.some((target) => fs.existsSync(target))) {
      errors.push(record.id + " **Canonical responsibility:** must cite an existing canonical local link.");
    }
    const disposition = field(record.body, "Disposition")?.match(/^`(Deliver|Existing prerequisite|Excluded by Stage 9)`$/)?.[1] || null;
    if (!disposition) errors.push(record.id + " has an invalid **Disposition:**.");
    const coverageValue = field(record.body, "Coverage");
    if (!meaningful(coverageValue)) errors.push(record.id + " lacks concrete **Coverage:**.");
    if (disposition === "Deliver") {
      const mapped = unique(ids(coverageValue, /AC-\d{3}/g));
      if (!mapped.length) errors.push(record.id + " Deliver disposition must map to at least one AC-xxx.");
      for (const id of mapped) if (!acceptanceIds.has(id)) errors.push(record.id + " maps to unknown " + id + ".");
    }
    if (disposition === "Existing prerequisite") {
      const mapped = unique(ids(coverageValue, /VE-\d{3}/g));
      if (!mapped.length) errors.push(record.id + " Existing prerequisite disposition must map to at least one VE-xxx.");
      for (const id of mapped) if (!evidenceIds.has(id)) errors.push(record.id + " maps to unknown " + id + ".");
    }
    if (disposition === "Excluded by Stage 9") {
      const exclusionLinks = markdownLinks(coverageValue, baseDir);
      if (!handoffPath || !exclusionLinks.some((link) => samePath(link.path, handoffPath) && meaningful(link.fragment))) {
        errors.push(record.id + " Excluded by Stage 9 disposition must cite the linked handoff's canonical exclusion anchor.");
      }
    }
  }
  for (const acId of acceptanceIds) {
    if (!coverage.some((record) => field(record.body, "Disposition") === "`Deliver`" && ids(field(record.body, "Coverage"), /AC-\d{3}/g).includes(acId))) {
      errors.push(acId + " is not mapped from a Deliver responsibility coverage entry.");
    }
  }

  const phasesBody = sectionBody(text, "Optional Phases");
  if (phasesBody !== null) {
    const phases = records(phasesBody, /^(###\s+Phase\s+\d+:\s+.+)$/gm);
    if (!phases.length) errors.push("Optional Phases exists but defines no ### Phase N entry.");
    const scheduledAc = new Set();
    const scheduledVe = new Set();
    for (const phase of phases) {
      for (const name of ["Objective", "Depends on", "Entry criteria"]) {
        if (!meaningful(field(phase.body, name))) errors.push(phase.id + " lacks a concrete **" + name + ":**.");
      }
      const exit = field(phase.body, "Exit criteria");
      const acRefs = unique(ids(exit, /AC-\d{3}/g));
      const veRefs = unique(ids(exit, /VE-\d{3}/g));
      if (!acRefs.length || !veRefs.length) errors.push(phase.id + " must name at least one AC-xxx and VE-xxx in **Exit criteria:**.");
      for (const id of acRefs) {
        scheduledAc.add(id);
        if (!acceptanceIds.has(id)) errors.push(phase.id + " references unknown " + id + ".");
      }
      for (const id of veRefs) {
        scheduledVe.add(id);
        if (!evidenceIds.has(id)) errors.push(phase.id + " references unknown " + id + ".");
      }
    }
    for (const id of acceptanceIds) if (!scheduledAc.has(id)) errors.push(id + " is not scheduled in any phase exit criterion.");
    for (const id of evidenceIds) if (!scheduledVe.has(id)) errors.push(id + " is not scheduled in any phase exit criterion.");
  }

  const laterGateBody = sectionBody(text, "Later-Lifecycle Gates");
  const laterGates = laterGateBody === null ? [] : records(laterGateBody, /^###\s+`?(LGATE-\d{3})`?:\s+.+$/gm);
  if (laterGateBody !== null && !laterGates.length) errors.push("Later-Lifecycle Gates exists but defines no ### `LGATE-NNN` entry.");
  if (new Set(laterGates.map((record) => record.id)).size !== laterGates.length) errors.push("Later-Lifecycle Gates contains duplicate LGATE identifiers.");
  if (handoffPath && !sameValues(laterGates.map((record) => record.id), handoffLaterGates.map((record) => record.id))) {
    errors.push("Later-Lifecycle Gates must project exactly every LGATE-NNN from the linked Stage 9 handoff.");
  }
  for (const gate of laterGates) {
    const canonical = field(gate.body, "Canonical source");
    const links = localLinks(canonical, baseDir);
    if (!meaningful(canonical) || !links.length || !links.some((target) => fs.existsSync(target))) {
      errors.push(gate.id + " **Canonical source:** must cite an existing canonical local link.");
    }
    const consumedAt = field(gate.body, "Consumed at")?.match(/^`([^`]+)`$/)?.[1] || null;
    if (!LATER_LIFECYCLE_STAGES.has(consumedAt)) errors.push(gate.id + " must select a valid later lifecycle in **Consumed at:**.");
    for (const name of ["Gate condition", "Verification", "Until satisfied"]) {
      if (!meaningful(field(gate.body, name))) errors.push(gate.id + " lacks a concrete **" + name + ":**.");
    }
    const handoffGate = handoffLaterGates.find((record) => record.id === gate.id);
    if (handoffGate) {
      const producerLinks = localLinks(field(handoffGate.body, "Produced by"), path.dirname(handoffPath));
      if (producerLinks.length && !links.some((target) => producerLinks.some((producer) => samePath(target, producer)))) {
        errors.push(gate.id + " **Canonical source:** does not preserve the Stage 9 gate producer.");
      }
      const fields = ["Consumed at", "Gate condition", "Verification", "Until satisfied"];
      for (const name of fields) {
        if (interactionProjectionValue(field(gate.body, name), baseDir) !== interactionProjectionValue(field(handoffGate.body, name), path.dirname(handoffPath))) {
          errors.push(gate.id + " **" + name + ":** does not match the linked Stage 9 gate.");
        }
      }
    }
  }

  const protectedBoundaryBody = sectionBody(text, "Protected Boundaries") || "";
  const protectedBoundaries = records(protectedBoundaryBody, /^###\s+(PB-\d{3}):\s+.+$/gm);
  if (!protectedBoundaries.length) errors.push("Protected Boundaries must define at least one ### PB-xxx entry.");
  if (new Set(protectedBoundaries.map((record) => record.id)).size !== protectedBoundaries.length) {
    errors.push("Protected Boundaries contains duplicate PB identifiers.");
  }
  for (const boundary of protectedBoundaries) {
    const canonical = field(boundary.body, "Canonical source");
    const links = markdownLinks(canonical, baseDir);
    if (!meaningful(canonical) || !links.length || !links.some((link) => fs.existsSync(link.path))) {
      errors.push(boundary.id + " **Canonical source:** must cite an existing canonical local link.");
    } else if (!links.some((link) => canonicalSourceLinks.some((source) => samePath(source.path, link.path)))) {
      errors.push(boundary.id + " **Canonical source:** must also appear in Canonical Sources Used.");
    }
    for (const name of ["Must preserve", "Workpack limit"]) {
      if (!meaningful(field(boundary.body, name))) errors.push(boundary.id + " lacks a concrete **" + name + ":**.");
    }
  }

  const review = sectionBody(text, "Workpack Integrity Review") || "";
  const reviewResult = field(review, "Review result")?.match(/^`(PASS|BLOCKED)`$/)?.[1] || null;
  if (reviewResult !== "PASS") errors.push("A ready workpack requires **Review result:** `PASS`.");
  const reviewFields = [
    ...REVIEW_FIELDS,
    ...(handoffUi ? ["UI/UX delivery coverage"] : []),
    ...(handoffPhysicalRealizability.length ? ["Physical-realizability projection"] : []),
    ...(deliveryEvidenceBody === null ? [] : ["Delivery-evidence contract"]),
    ...COMPATIBILITY_REVIEW_FIELDS,
  ];
  for (const name of reviewFields) {
    const value = field(review, name);
    const match = /^`(PASS|BLOCKED)`\s*(?:—|-)\s*(.+)$/.exec(value || "");
    if (!match || match[1] !== "PASS" || !meaningful(match[2])) {
      errors.push("Workpack Integrity Review **" + name + ":** must be `PASS` with a concrete conclusion.");
      continue;
    }
    if (["Canonical-source consistency", "Required-input closure"].includes(name)) {
      const links = localLinks(match[2], baseDir);
      if (!links.length || !links.some((target) => fs.existsSync(target))) {
        errors.push("Workpack Integrity Review **" + name + ":** must cite an existing canonical local link.");
      }
    }
    if (name === "Responsibility coverage" && !/RCOV-\d{3}/.test(match[2])) errors.push("Responsibility coverage review must cite RCOV-xxx entries.");
    if (name === "Acceptance/evidence reciprocity" && (!/AC-\d{3}/.test(match[2]) || !/VE-\d{3}/.test(match[2]))) {
      errors.push("Acceptance/evidence reciprocity review must cite AC-xxx and VE-xxx entries.");
    }
    if (name === "Phase and capability sequencing") {
      if (phasesBody === null && !/unphased/i.test(match[2])) errors.push("An unphased workpack must say why it is unphased in the sequencing review.");
      if (phasesBody !== null && !/Phase\s+\d+/i.test(match[2])) errors.push("A phased workpack sequencing review must cite its phases.");
    }
    if (name === "Proof capability adequacy" && !/VE-\d{3}/.test(match[2])) errors.push("Proof capability adequacy review must cite VE-xxx evidence.");
    if (name === "UI/UX delivery coverage" && !/VE-\d{3}/.test(match[2])) errors.push("UI/UX delivery coverage review must cite its functional and implemented UI/UX VE-xxx evidence.");
    if (name === "Delivery-evidence contract") {
      if (!/SUMMARY\.md/.test(match[2]) || !/receipt/i.test(match[2]) || !/(?:historical|preserv)/i.test(match[2])) {
        errors.push("Delivery-evidence contract review must cite the snapshot-scoped SUMMARY.md, receipt classification, and historical-evidence preservation.");
      }
    }
    if (name === "Later-lifecycle gate disposition") {
      if (laterGates.length) {
        for (const gate of laterGates) if (!match[2].includes(gate.id)) errors.push("Later-lifecycle gate disposition review must cite " + gate.id + ".");
      } else if (!/no later-lifecycle gate/i.test(match[2])) {
        errors.push("A workpack without LGATE entries must say that no later-lifecycle gate applies.");
      }
    }
    if (name === "Stage 9 obligation coverage") {
      for (const obligation of [...inputObligations, ...interactionObligations]) {
        if (!match[2].includes(obligation.id)) errors.push("Stage 9 obligation coverage review must cite " + obligation.id + ".");
      }
      if (!inputObligations.length && !/no input obligation|input-free/i.test(match[2])) {
        errors.push("Stage 9 obligation coverage review must state that the slice has no input obligations.");
      }
      if (!interactionObligations.length && !/no interaction obligation|interaction-free/i.test(match[2])) {
        errors.push("Stage 9 obligation coverage review must state that the slice has no interaction obligations.");
      }
    }
    if (name === "Physical-realizability projection") {
      const links = markdownLinks(match[2], baseDir);
      if (!handoffPath || !links.some((link) => samePath(link.path, handoffPath)
        && link.fragment.toLowerCase() === "physical-realizability-closure")) {
        errors.push("Physical-realizability projection review must link the selected handoff's Physical Realizability Closure.");
      }
      for (const obligation of physicalObligations) {
        if (!match[2].includes(obligation.id)) errors.push("Physical-realizability projection review must cite " + obligation.id + ".");
      }
    }
    if (name === "Verification-obligation coverage") {
      for (const obligation of verificationObligations) {
        if (!match[2].includes(obligation.id)) {
          errors.push("Verification-obligation coverage review must cite " + obligation.id + ".");
        }
      }
      if (!verificationObligations.length && !/no structured verification obligation|vo-free/i.test(match[2])) {
        errors.push("Verification-obligation coverage review must state that the slice has no structured Verification Obligations.");
      }
    }
    if (name === "Execution eligibility" && !/sequence|order group|implemented slice/i.test(match[2])) {
      errors.push("Execution eligibility review must state the accepted sequence or retained implemented-slice basis.");
    }
    if (name === "Stage 9 compatibility closure") {
      const links = markdownLinks(match[2], baseDir);
      if (!handoffPath || !links.some((link) => samePath(link.path, handoffPath) && link.fragment.toLowerCase() === "delivery-slice-realizability-review")) {
        errors.push("Stage 9 compatibility closure review must link the selected handoff's Delivery Slice Realizability Review.");
      }
      const mappedPhysicalEvidence = [...interactionObligations].some((obligation) => ids(field(obligation.body, "Coverage"), /VE-\d{3}/g).length);
      if (interactionObligations.length && !mappedPhysicalEvidence) {
        errors.push("Stage 9 compatibility closure requires consumer-observable VE coverage for its interactions.");
      }
    }
    if (name === "Affected-slice isolation" && !/producer|consumer|evidence-only|unaffected|selected slice/i.test(match[2])) {
      errors.push("Affected-slice isolation review must state the selected slice's impact disposition.");
    }
    if (name === "Diagnostic and known-consumer coverage preservation") {
      const links = markdownLinks(match[2], baseDir);
      if (!handoffPath || !links.some((link) => samePath(link.path, handoffPath) && link.fragment.toLowerCase() === "delivery-slice-realizability-review")) {
        errors.push("Diagnostic and known-consumer coverage preservation must link the selected handoff's Delivery Slice Realizability Review.");
      }
      if (!/cohort|diagnostic|consumer/i.test(match[2]) || !/zero-new-blocker/i.test(match[2])) {
        errors.push("Diagnostic and known-consumer coverage preservation must retain the bounded cohort, known-consumer coverage, and zero-new-blocker conclusion.");
      }
    }
  }
  if (field(review, "Review blockers") !== "`None.`") errors.push("A ready workpack requires **Review blockers:** `None.`.");

  return errors;
}

try {
  const args = parseArgs(process.argv);
  const workpackPath = path.resolve(args.workpack);
  if (!fs.existsSync(workpackPath)) throw new Error("Workpack does not exist: " + workpackPath);
  const errors = validate(workpackPath, path.resolve(args.softwareDesignSkill));
  if (errors.length) {
    console.error("Workpack integrity validation failed:");
    for (const error of errors) console.error("- " + error);
    process.exitCode = 1;
  } else {
    console.log("Verified workpack/handoff scope and source closure, current Stage 9 readiness, exact INPUT/INT/PSEAM/VO obligation and LGATE projection, applicable UI/UX source and journey coverage, target/prerequisite roles, bounded environment preflight when required, repository guidance routing, responsibility and protected-boundary coverage, AC/VE content and reciprocity, snapshot-scoped delivery-evidence contract, phase contract, and integrity receipt.");
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
