#!/usr/bin/env node

import fs from "node:fs";
import { checkExecutionRecord, identityField, validateReady, executionIdentity } from "./execution-record.mjs";
import path from "node:path";

const SNAPSHOT_PATTERN = /^sha256:[a-f0-9]{64}$/;
// Recognized by extension only: the check proves a screenshot was retained, not what it shows.
const IMAGE_ARTIFACT_PATTERN = /\.(?:png|jpe?g|webp|gif|avif)$/i;

function parseArgs(argv) {
  const args = { workpack: null, repository: null };
  for (let index = 2; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--workpack") args.workpack = argv[++index];
    else if (value === "--repository") args.repository = argv[++index];
    else if (value === "--basis-workpack") args.basis = argv[++index];
    else if (value === "--planning-skill") args.planningSkill = argv[++index];
    else if (value === "--software-design-skill") args.softwareDesignSkill = argv[++index];
    else throw new Error("Unknown argument: " + value);
  }
  if (!args.workpack || !args.repository) {
    throw new Error("Use --workpack <WORKPACK.md> --repository <target-implementation-repository>.");
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

function field(block, name) {
  return new RegExp("^(?:[-*]\\s+)?\\*\\*" + escape(name) + ":\\*\\*\\s*(.+)$", "m").exec(String(block || ""))?.[1]?.trim() || null;
}

function records(body, prefix) {
  const pattern = new RegExp("^###\\s+`?(" + prefix + "-\\d{3})`?\\s*:\\s*.+$", "gm");
  const matches = [...String(body || "").matchAll(pattern)];
  return matches.map((match, index) => ({
    id: match[1],
    body: String(body).slice(match.index, matches[index + 1]?.index).trim(),
  }));
}

function ids(value, prefix) {
  return [...String(value || "").matchAll(new RegExp(prefix + "-\\d{3}", "g"))].map((match) => match[0]);
}

function unique(values) {
  return [...new Set(values)];
}

function sameValues(left, right) {
  const a = unique(left).sort();
  const b = unique(right).sort();
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function normalized(value) {
  return String(value || "").trim().replace(/^`|`$/g, "").replace(/\s+/g, " ");
}

function meaningful(value) {
  const result = normalized(value);
  return Boolean(result) && result !== "None." && !/^<[^>]+>$/.test(result);
}

function isNone(value) {
  return normalized(value) === "None.";
}

function markdownLinks(value, baseDir) {
  return [...String(value || "").matchAll(/\[[^\]]+\]\(([^)]+)\)/g)]
    .map((match) => {
      const target = match[1];
      if (!target || /^[a-z]+:/i.test(target) || target.startsWith("#")) return null;
      return path.resolve(baseDir, target.split("#", 1)[0]);
    })
    .filter(Boolean);
}

function subsectionBody(text, heading) {
  const match = new RegExp("^###\\s+" + escape(heading) + "\\s*$([\\s\\S]*?)(?=^###\\s+|^##\\s+|(?![\\s\\S]))", "m").exec(String(text || ""));
  return match ? match[1].trim() : null;
}

function tableRows(body) {
  return String(body || "").split("\n")
    .filter((line) => /^\s*\|/.test(line))
    .map((line) => line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim()))
    .filter((cells) => cells[0] !== "Journey" && !cells.every((cell) => /^:?-+:?$/.test(cell)));
}

function codeLiterals(value) {
  return unique([...String(value || "").matchAll(/`([^`]+)`/g)].map((match) => match[1]));
}

// Journeys are compared by their specification anchor: the summary lives in the
// implementation repository, so its links need not resolve to the blueprint.
function journeyRows(body, columns) {
  return tableRows(body).map((cells) => ({
    cells,
    journey: /#(journey-[A-Za-z0-9_-]+)/.exec(cells[0] || "")?.[1] || null,
    functional: unique(ids(cells[columns.functional], "VE")),
    implemented: unique(ids(cells[columns.implemented], "VE")),
  }));
}

// The workpack validator owns planned UI coverage. This check only confirms that
// completion evidence records the same journeys, evidence routes, and review
// facts; it does not judge visual fidelity or authenticate the observations.
function validateUiUxCompletion({ workpack, summary, summaryPath, artifactsRoot, summaryVe, errors }) {
  const planned = subsectionBody(sectionBody(workpack, "Stage 9 Obligation Coverage"), "UI/UX Delivery Coverage");
  const recorded = sectionBody(summary, "UI/UX Delivery Review");
  if (planned === null) {
    if (recorded !== null) errors.push("Execution summary records a UI/UX Delivery Review, but the workpack has no UI/UX Delivery Coverage.");
    return;
  }
  if (recorded === null) {
    errors.push("Execution summary must record ## UI/UX Delivery Review for the workpack's UI/UX Delivery Coverage.");
    return;
  }
  for (const name of ["Reviewed build", "Viewports and states"]) {
    if (!meaningful(field(recorded, name))) errors.push("UI/UX Delivery Review lacks concrete **" + name + ":**.");
  }
  if (!String(field(recorded, "Deviations and limitations") || "").trim()) {
    errors.push("UI/UX Delivery Review must record **Deviations and limitations:** or `None.`.");
  }
  const plannedModes = codeLiterals(field(planned, "Implemented UI/UX review mode"));
  if (!sameValues(plannedModes, codeLiterals(field(recorded, "Review mode")))) {
    errors.push("UI/UX Delivery Review **Review mode:** must match the workpack's implemented UI/UX review mode.");
  }
  if (plannedModes.includes("human acceptance") && !meaningful(field(recorded, "Human acceptance"))) {
    errors.push("UI/UX Delivery Review must record **Human acceptance:** because the workpack requires human acceptance.");
  }

  const plannedRows = journeyRows(planned, { functional: 2, implemented: 3 }).filter((row) => row.journey);
  const recordedRows = journeyRows(recorded, { functional: 1, implemented: 2 });
  const seen = new Set();
  for (const row of recordedRows) {
    if (!row.journey) {
      errors.push("UI/UX Delivery Review rows must identify one specification journey anchor: " + row.cells.join(" | "));
      continue;
    }
    if (seen.has(row.journey)) errors.push("UI/UX Delivery Review records journey " + row.journey + " more than once.");
    seen.add(row.journey);
    const plan = plannedRows.find((candidate) => candidate.journey === row.journey);
    if (!plan) {
      errors.push("UI/UX Delivery Review records journey " + row.journey + " that the workpack does not map.");
      continue;
    }
    if (!sameValues(plan.functional, row.functional) || !sameValues(plan.implemented, row.implemented)) {
      errors.push("UI/UX Delivery Review journey " + row.journey + " evidence does not match the workpack mapping.");
    }
    const result = /^`?PASS`?\s*(?:—|-)\s*(.+)$/.exec(row.cells[3] || "");
    if (!result || !meaningful(result[1])) errors.push("UI/UX Delivery Review journey " + row.journey + " must record `PASS` with concrete findings.");
  }
  for (const plan of plannedRows) {
    if (!seen.has(plan.journey)) errors.push("UI/UX Delivery Review omits workpack journey " + plan.journey + ".");
  }
  for (const id of unique(plannedRows.flatMap((row) => row.implemented))) {
    const record = summaryVe.find((candidate) => candidate.id === id);
    if (!record) continue;
    const images = markdownLinks(field(record.body, "Artifacts"), path.dirname(summaryPath))
      .filter((artifact) => IMAGE_ARTIFACT_PATTERN.test(artifact) && inside(artifact, artifactsRoot)
        && fs.existsSync(artifact) && fs.statSync(artifact).isFile());
    if (!images.length) {
      errors.push(id + " implemented UI/UX evidence must link at least one retained screenshot image (.png, .jpg, .jpeg, .webp, .gif, or .avif) under artifacts/.");
    }
  }
}

function inside(candidate, parent) {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function requireFile(filePath, label, errors) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    errors.push(label + " is missing: " + filePath + ".");
    return null;
  }
  return fs.readFileSync(filePath, "utf8");
}

function snapshotField(text, name, errors, label) {
  const matches = [...String(text || "").matchAll(new RegExp("^\\*\\*" + escape(name) + ":\\*\\*\\s*`?([^`\\s]+)`?\\s*$", "gm"))];
  if (matches.length !== 1 || !SNAPSHOT_PATTERN.test(matches[0]?.[1] || "")) {
    errors.push(label + " must contain exactly one valid **" + name + ":** field.");
    return null;
  }
  return matches[0][1];
}

function receiptFiles(root) {
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => path.join(root, entry.name));
}

function receiptValue(receipt, name) {
  const value = receipt?.[name];
  return typeof value === "string" && value.trim() && !/^<[^>]+>$/.test(value.trim());
}

function validateReceipts(evidenceRoot, errors) {
  const receiptsRoot = path.join(evidenceRoot, "receipts");
  if (!fs.existsSync(receiptsRoot)) return;

  for (const misplaced of receiptFiles(receiptsRoot)) {
    errors.push("Receipt JSON must use a typed publications/ or consumers/ directory: " + misplaced + ".");
  }

  const definitions = [
    {
      directory: path.join(receiptsRoot, "publications"),
      schema: "producer-publication-receipt",
      scope: "producer-publication",
      required: ["artifact", "version", "source_revision", "location", "integrity", "resolution"],
      outcome: ["result", "PASS"],
    },
    {
      directory: path.join(receiptsRoot, "consumers"),
      schema: "consumer-install-receipt",
      scope: "consumer-install",
      required: ["consumer_repository", "artifact", "version", "resolved", "integrity"],
      outcome: ["install_result", "PASS"],
    },
  ];

  for (const definition of definitions) {
    for (const filePath of receiptFiles(definition.directory)) {
      let receipt;
      try {
        receipt = JSON.parse(fs.readFileSync(filePath, "utf8"));
      } catch (error) {
        errors.push("Receipt is not valid JSON: " + filePath + ".");
        continue;
      }
      if (Object.hasOwn(receipt, "schema_version")) {
        errors.push("Receipt uses obsolete schema_version instead of the current unversioned schema: " + filePath + ".");
      }
      if (receipt.schema !== definition.schema || receipt.evidence_scope !== definition.scope) {
        errors.push("Receipt has the wrong current schema or evidence_scope: " + filePath + ".");
      }
      for (const name of definition.required) {
        if (!receiptValue(receipt, name)) errors.push("Receipt lacks concrete " + name + ": " + filePath + ".");
      }
      if (receipt[definition.outcome[0]] !== definition.outcome[1]) {
        errors.push("Receipt must record " + definition.outcome[0] + " as PASS: " + filePath + ".");
      }
    }
  }
}

function validate(workpackPath, repository, refresh = null) {
  const errors = [];
  const workpack = requireFile(workpackPath, "Workpack", errors);
  if (workpack === null) return errors;

  const snapshot = snapshotField(workpack, "Software Design snapshot", errors, "Workpack");
  if (!snapshot) return errors;

  let currentSnapshot = snapshot;
  if (refresh) {
    try {
      const current = fs.readFileSync(refresh.workpack, "utf8");
      currentSnapshot = executionIdentity(refresh.workpack).snapshot;
      const normalize = (text, id) => text.replaceAll(id, "SNAPSHOT").replaceAll(id.replace(":", "-"), "SNAPSHOT_DIRECTORY");
      if (normalize(current, currentSnapshot) !== normalize(workpack, snapshot)) throw new Error("Documentation refresh changes workpack content beyond snapshot propagation; reconcile its scope before claiming completion.");
      validateReady(refresh.workpack, refresh.planningSkill, refresh.softwareDesignSkill);
    } catch (error) { errors.push(error.message); }
  }

  const digest = snapshot.slice("sha256:".length);
  const executionName = "sha256-" + digest;
  const evidenceRoot = path.join(repository, "delivery-evidence");
  const executionRoot = path.join(evidenceRoot, "executions", executionName);
  const artifactsRoot = path.join(executionRoot, "artifacts");
  const summaryPath = path.join(executionRoot, "SUMMARY.md");
  const readmePath = path.join(evidenceRoot, "README.md");
  const reportPath = path.join(evidenceRoot, "IMPLEMENTATION-DELIVERY-REPORT.md");

  const contract = sectionBody(workpack, "Delivery Evidence Contract");
  const declaredSummary = /^`([^`]+)`/.exec(field(contract, "Execution summary") || "")?.[1] || null;
  const expectedDeclaredSummary = "delivery-evidence/executions/" + executionName + "/SUMMARY.md";
  if (contract !== null && declaredSummary !== expectedDeclaredSummary) {
    errors.push("Workpack Delivery Evidence Contract must declare `" + expectedDeclaredSummary + "`.");
  }

  for (const name of contract === null ? [] : ["Publication receipts", "Consumer-install receipts"]) {
    const value = field(contract, name);
    if (isNone(value)) continue;
    const paths = [...String(value || "").matchAll(/`([^`]+\.json)`/g)].map((match) => match[1]);
    if (!paths.length) {
      errors.push("Workpack **" + name + ":** must be `None.` or name exact JSON paths.");
    }
    for (const declaredPath of paths) {
      const resolved = path.resolve(repository, declaredPath);
      if (!fs.existsSync(resolved)) errors.push("Workpack-declared receipt is missing: " + resolved + ".");
    }
  }

  const summary = requireFile(summaryPath, "Execution summary", errors);
  const readme = requireFile(readmePath, "Delivery evidence README", errors);
  const report = requireFile(reportPath, "Implementation delivery report", errors);
  if (summary === null || readme === null || report === null) return errors;

  try {
    const started = checkExecutionRecord(workpackPath, repository, summary);
    if (identityField(report, "Executed workpack content") !== started.content || identityField(report, "Executed snapshot") !== started.snapshot) {
      errors.push("Implementation delivery report must identify the exact executed workpack content and snapshot.");
    }
  } catch (error) { errors.push(error.message); }

  const summarySnapshot = snapshotField(summary, "Implemented snapshot", errors, "Execution summary");
  const readmeSnapshot = snapshotField(readme, "Latest implemented snapshot", errors, "Delivery evidence README");
  const reportSnapshot = snapshotField(report, "Implemented snapshot", errors, "Implementation delivery report");
  for (const [label, value] of [
    ["Execution summary", summarySnapshot],
    ["Delivery evidence README", readmeSnapshot],
    ["Implementation delivery report", reportSnapshot],
  ]) {
    const expectedSnapshot = label === "Execution summary" ? snapshot : currentSnapshot;
    if (value && value !== expectedSnapshot) errors.push(label + " snapshot does not match the workpack snapshot.");
  }

  if (refresh && !/^No implementation impact\s*(?:—|-)\s*\S+/.test(normalized(field(report, "Refresh classification")))) {
    errors.push("Documentation refresh requires a concrete No implementation impact classification in the existing report; it is not execution of new requirements.");
  }

  if (normalized(field(summary, "Outcome")) !== "COMPLETE") {
    errors.push("Execution summary **Outcome:** must be `COMPLETE`.");
  }
  if (normalized(field(report, "Outcome")) !== "COMPLETE") {
    errors.push("Implementation delivery report **Outcome:** must be `COMPLETE`.");
  }

  const summaryLinks = [
    ...markdownLinks(field(readme, "Latest execution summary"), path.dirname(readmePath)),
    ...markdownLinks(field(report, "Execution summary"), path.dirname(reportPath)),
  ];
  if (summaryLinks.length !== 2 || !summaryLinks.every((target) => path.resolve(target) === path.resolve(summaryPath))) {
    errors.push("README and implementation report must each link the current snapshot's exact execution SUMMARY.md.");
  }

  const workpackAc = records(sectionBody(workpack, "Acceptance Criteria"), "AC");
  const workpackVe = records(sectionBody(workpack, "Verification Evidence Required"), "VE");
  const summaryAc = records(sectionBody(summary, "Acceptance Criteria"), "AC");
  const summaryVe = records(sectionBody(summary, "Verification Evidence"), "VE");

  if (!sameValues(workpackAc.map((record) => record.id), summaryAc.map((record) => record.id))) {
    errors.push("Execution summary must record every workpack AC exactly once and no unrelated AC.");
  }
  if (!sameValues(workpackVe.map((record) => record.id), summaryVe.map((record) => record.id))) {
    errors.push("Execution summary must record every workpack VE exactly once and no unrelated VE.");
  }
  if (new Set(summaryAc.map((record) => record.id)).size !== summaryAc.length) {
    errors.push("Execution summary contains duplicate AC identifiers.");
  }
  if (new Set(summaryVe.map((record) => record.id)).size !== summaryVe.length) {
    errors.push("Execution summary contains duplicate VE identifiers.");
  }

  for (const record of summaryAc) {
    if (normalized(field(record.body, "Status")) !== "PASS") errors.push(record.id + " summary status must be PASS.");
    if (!meaningful(field(record.body, "Observed result"))) errors.push(record.id + " lacks a concrete observed result.");
    const planned = workpackAc.find((candidate) => candidate.id === record.id);
    if (planned && !sameValues(ids(field(planned.body, "Required evidence"), "VE"), ids(field(record.body, "Evidence"), "VE"))) {
      errors.push(record.id + " summary evidence does not match the workpack mapping.");
    }
  }

  for (const record of summaryVe) {
    if (normalized(field(record.body, "Status")) !== "PASS") errors.push(record.id + " summary status must be PASS.");
    if (!meaningful(field(record.body, "Procedure"))) errors.push(record.id + " lacks the executed procedure.");
    if (!meaningful(field(record.body, "Observed result"))) errors.push(record.id + " lacks a concrete observed result.");
    const planned = workpackVe.find((candidate) => candidate.id === record.id);
    if (planned && !sameValues(ids(field(planned.body, "Supports"), "AC"), ids(field(record.body, "Supports"), "AC"))) {
      errors.push(record.id + " summary support mapping does not match the workpack.");
    }
    const artifacts = field(record.body, "Artifacts");
    if (isNone(artifacts)) continue;
    const links = markdownLinks(artifacts, path.dirname(summaryPath));
    if (!links.length) {
      errors.push(record.id + " **Artifacts:** must be `None.` or contain local links.");
      continue;
    }
    for (const artifact of links) {
      if (!inside(artifact, artifactsRoot)) errors.push(record.id + " artifact is outside the current execution artifacts directory: " + artifact + ".");
      if (!fs.existsSync(artifact) || !fs.statSync(artifact).isFile()) errors.push(record.id + " artifact is missing: " + artifact + ".");
    }
  }

  validateUiUxCompletion({ workpack, summary, summaryPath, artifactsRoot, summaryVe, errors });
  validateReceipts(evidenceRoot, errors);
  return errors;
}

try {
  const args = parseArgs(process.argv);
  const workpackPath = path.resolve(args.workpack);
  const repository = path.resolve(args.repository);
  if (!fs.existsSync(repository) || !fs.statSync(repository).isDirectory()) {
    throw new Error("Target implementation repository does not exist: " + repository);
  }
  const errors = validate(args.basis ? path.resolve(args.basis) : workpackPath, repository, args.basis ? {
    workpack: workpackPath, planningSkill: args.planningSkill, softwareDesignSkill: args.softwareDesignSkill,
  } : null);
  if (errors.length) {
    console.error("Delivery evidence validation failed:");
    for (const error of errors) console.error("- " + error);
    process.exitCode = 1;
  } else {
    console.log(args.basis ? "Verified retained execution basis and ID-only documentation refresh; no execution of the refreshed workpack is claimed." : "Verified snapshot-scoped delivery evidence, exact AC/VE completion coverage, applicable UI/UX journey and review evidence coverage, current README/report lineage, optional artifact links, and typed unversioned receipts.");
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
