#!/usr/bin/env node

// Advisory review prompts for Stage 9 delivery planning. The report never changes
// validation results: it exits 0 whenever it runs, with or without findings.

import fs from "node:fs";
import path from "node:path";
import { isEntryPoint } from "./lib/entry-point.mjs";
import { buildLayout } from "./lib/model/build-layout.mjs";
import { recordedDeliverySnapshot } from "./lib/delivery-snapshot.mjs";
import { validateHandoffSequence } from "./lib/validation/handoff-sequence.mjs";
import { readWorkpackSnapshot } from "./lib/workpack-snapshot.mjs";

const SETTLED_OUTCOMES = new Set(["IMPLEMENTATION_DETAILS_READY", "IMPLEMENTATION_DETAILS_PARTIAL"]);
// Prose may write slugs in any case; matches are lowercased before the table lookup.
const PROSE_SLICE_PATTERN = /\brepo-\d{3}-[a-z0-9]+(?:-[a-z0-9]+)*\b/gi;
const STATE_WORD_PATTERN = /\b(implemented|ready|next|blocked|waiting)\b/gi;
// Prose that negates or conditions a state ("not yet implemented", "once ... is ready")
// does not claim the current state, so the heuristic skips those lines.
const CONDITIONAL_PATTERN = /\b(?:not|no longer|never|until|unless|once|after|before|when|whenever|if)\b|n't\b/i;
const STATE_WINDOW = 60;
const GROUP_CLAIM_PATTERN = /\b(current|next)\s+(?:order\s+)?group\s*(?:is|:|=)?\s*(\d+)\b|\b(?:order\s+)?group\s+(\d+)\s+(?:is|remains)\s+(?:the\s+)?(current|next)\b/gi;

const RULES = {
  missingWorkpack: {
    text: "Prepare every requested slice whose planning prerequisites are satisfied, including later execution groups; keep one stable handoff/workpack per slice.",
    reference: "references/planning-execution-contract.md#planning-completeness-and-execution-eligibility",
  },
  snapshotDrift: {
    text: "When the change remains within an existing slice's repository and Build Unit coverage, refresh its current handoff and stable workpack paths.",
    reference: "references/build-design-and-delivery-readiness.md#delivery-readiness-and-handoff",
  },
  waitingCandidate: {
    text: "Prepare every requested slice whose planning prerequisites are satisfied, including later execution groups.",
    reference: "references/planning-execution-contract.md#planning-completeness-and-execution-eligibility",
  },
  staleProse: {
    text: "Reconcile the README in the same pass whenever any handoff is created or refreshed and whenever Build Unit membership, dependency classification, slice scope, readiness, blocker state, or implementation evidence changes.",
    reference: "references/build-design-and-delivery-readiness.md#delivery-readiness-and-handoff",
  },
};

function parseArgs(argv) {
  const args = { root: null, workpacks: null, json: false };
  for (let index = 2; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--root" || value === "--workpacks") {
      const next = argv[index + 1];
      if (!next || next.startsWith("--")) throw new Error(value + " requires a directory.");
      args[value.slice(2)] = next;
      index += 1;
    } else if (value === "--json") args.json = true;
    else throw new Error("Unknown argument: " + value);
  }
  if (!args.root) throw new Error("Use --root <software-design-package> [--workpacks <delivery-workpacks-dir>] [--json].");
  return args;
}

function requireDirectory(dirPath, label) {
  if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
    throw new Error(label + " is not a readable directory: " + dirPath);
  }
}

function posix(value) {
  return value.split(path.sep).join("/");
}

function displayPath(root, filePath) {
  const relative = path.relative(root, filePath);
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative) ? posix(relative) : posix(filePath);
}

function plain(text) {
  return text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[`*_]/g, "").trim();
}

function readHandoff(target) {
  if (!target || !fs.existsSync(target) || !fs.statSync(target).isFile()) return null;
  const text = fs.readFileSync(target, "utf8");
  return {
    path: target,
    outcome: /^\*\*Outcome:\*\*\s*`([^`]+)`\s*$/m.exec(text)?.[1] || null,
    snapshot: recordedDeliverySnapshot(text),
  };
}

// Workpacks live beside the Software Design package: design/delivery-workpacks/ in the default layout.
export function defaultWorkpacksDirectory(root) {
  return path.join(path.dirname(path.resolve(root)), "delivery-workpacks");
}

function finding(kind, { slice, file, line = null, heuristic = false, message, rule }) {
  return { kind, slice, file, line, heuristic, message, rule };
}

function workpackFindings({ root, rows, handoffs, workpacksRoot }) {
  const findings = [];
  for (const row of rows) {
    if (!row.slug) continue;
    const handoff = handoffs.get(row.slug);
    if (!handoff || !SETTLED_OUTCOMES.has(handoff.outcome)) continue;
    const workpackPath = path.join(workpacksRoot, row.slug, "WORKPACK.md");
    if (!fs.existsSync(workpackPath)) {
      findings.push(finding("missing-workpack", {
        slice: row.slug,
        file: displayPath(root, workpackPath),
        message: "Review whether this slice needs a workpack: its handoff " + displayPath(root, handoff.path) + " records " + handoff.outcome + " (sequence state " + row.state + "), but the workpacks directory has no " + row.slug + "/WORKPACK.md.",
        rule: RULES.missingWorkpack,
      }));
      continue;
    }
    if (!handoff.snapshot) continue;
    const { recorded } = readWorkpackSnapshot(fs.readFileSync(workpackPath, "utf8"));
    if (recorded === handoff.snapshot) continue;
    findings.push(finding("snapshot-drift", {
      slice: row.slug,
      file: displayPath(root, workpackPath),
      message: recorded
        ? "Review whether the workpack needs a refresh: a workpack is expected to carry its handoff's exact current Snapshot ID. It records Software Design snapshot " + recorded + ", but the handoff now records " + handoff.snapshot + "."
        : "Review the workpack's snapshot: a workpack is expected to carry its handoff's exact current Snapshot ID, but it has no single readable **Software Design snapshot:** line to compare with the handoff's " + handoff.snapshot + ".",
      rule: RULES.snapshotDrift,
    }));
  }
  return findings;
}

function waitingCandidateFindings({ root, rows, handoffs, readmePath }) {
  const findings = [];
  for (const row of rows) {
    if (!row.slug || row.state !== "Waiting" || row.target) continue;
    const unsettled = row.requires.filter((required) => !SETTLED_OUTCOMES.has(handoffs.get(required)?.outcome));
    if (unsettled.length) continue;
    const producers = row.requires.length
      ? "every slice it requires (" + row.requires.join(", ") + ") already links a handoff with a READY/PARTIAL outcome"
      : "it requires no other slice";
    findings.push(finding("waiting-planning-candidate", {
      slice: row.slug,
      file: displayPath(root, readmePath),
      line: row.line,
      message: "Review this Waiting row as a planning candidate: it links no handoff, and " + producers + ". A settled producer handoff only makes the row a candidate; it does not prove the consumer handoff can be written yet. Settle its scope, contracts, expected outputs and feasibility before writing the handoff.",
      rule: RULES.waitingCandidate,
    }));
  }
  return findings;
}

function stateClaimDiffers(proseState, tableState) {
  if (proseState === tableState) return false;
  // "Next up" prose stays consistent with a Ready row in the current group.
  return !(proseState === "Next" && tableState === "Ready");
}

function proseFindings({ root, rows, readmePath, currentOrderGroup }) {
  if (!fs.existsSync(readmePath)) return [];
  const statesBySlug = new Map(rows.filter((row) => row.slug && row.state).map((row) => [row.slug, row.state]));
  const groups = new Set(rows.map((row) => row.orderGroup).filter(Number.isInteger));
  const expectedNext = currentOrderGroup !== null && groups.has(currentOrderGroup + 1) ? currentOrderGroup + 1 : null;
  const findings = [];
  let fenced = false;
  for (const [index, rawLine] of fs.readFileSync(readmePath, "utf8").split(/\r?\n/).entries()) {
    const trimmed = rawLine.trim();
    if (/^(?:```|~~~)/.test(trimmed)) { fenced = !fenced; continue; }
    if (fenced || !trimmed || trimmed.startsWith("|") || trimmed.startsWith("#")) continue;
    if (/^\*\*Current order group:\*\*/.test(trimmed)) continue;
    const line = plain(trimmed);
    if (CONDITIONAL_PATTERN.test(line)) continue;
    const base = { file: displayPath(root, readmePath), line: index + 1, heuristic: true, rule: RULES.staleProse };

    const slugs = [...new Set((line.match(PROSE_SLICE_PATTERN) || []).map((slug) => slug.toLowerCase()))].filter((slug) => statesBySlug.has(slug));
    if (slugs.length === 1) {
      const slug = slugs[0];
      const position = line.toLowerCase().indexOf(slug);
      // Group claims ("next order group 3") are checked separately, not as slice states.
      const near = [...line.replace(GROUP_CLAIM_PATTERN, (claim) => " ".repeat(claim.length)).matchAll(STATE_WORD_PATTERN)]
        .filter((match) => Math.abs(match.index - position) <= STATE_WINDOW + slug.length)
        .map((match) => match[1][0].toUpperCase() + match[1].slice(1).toLowerCase());
      const claimed = [...new Set(near)];
      const tableState = statesBySlug.get(slug);
      if (claimed.length === 1 && stateClaimDiffers(claimed[0], tableState)) {
        findings.push(finding("stale-readme-prose", {
          ...base,
          slice: slug,
          message: "Heuristic: review this prose line; it describes " + slug + " as " + claimed[0] + ", but the sequence table state is " + tableState + ".",
        }));
      }
    }

    for (const match of line.matchAll(GROUP_CLAIM_PATTERN)) {
      const which = (match[1] || match[4]).toLowerCase();
      const stated = Number(match[2] || match[3]);
      const expected = which === "current" ? currentOrderGroup : expectedNext;
      if (stated === expected) continue;
      findings.push(finding("stale-readme-prose", {
        ...base,
        slice: null,
        message: "Heuristic: review this prose line; it names " + stated + " as the " + which + " order group, but the sequence table gives " + (expected === null ? "none" : expected) + ".",
      }));
    }
  }
  return findings;
}

export function buildDeliveryPlanningGapReport(rootPath, { workpacks = null } = {}) {
  const root = path.resolve(rootPath);
  requireDirectory(root, "Software Design package");
  // An explicit override must exist; the default directory may not exist before the first workpack.
  const workpacksRoot = workpacks ? path.resolve(workpacks) : defaultWorkpacksDirectory(root);
  if (workpacks) requireDirectory(workpacksRoot, "Workpacks directory");

  const sequence = validateHandoffSequence(root);
  const readmePath = path.join(buildLayout(root).handoffsRoot, "README.md");
  const rows = sequence.rows || [];
  const handoffs = new Map(rows.filter((row) => row.slug).map((row) => [row.slug, readHandoff(row.target)]));

  const findings = [
    ...workpackFindings({ root, rows, handoffs, workpacksRoot }),
    ...waitingCandidateFindings({ root, rows, handoffs, readmePath }),
    ...proseFindings({ root, rows, readmePath, currentOrderGroup: sequence.currentOrderGroup ?? null }),
  ];

  return {
    root,
    workpacks: workpacksRoot,
    sequenceErrors: sequence.errors,
    findings,
    findingCount: findings.length,
  };
}

export function formatDeliveryPlanningGapReport(report) {
  const lines = ["Delivery Planning Gap Report (advisory)", "Root: " + report.root];
  lines.push("Workpacks: " + report.workpacks);
  if (report.sequenceErrors.length) {
    lines.push("Handoff sequence validation reports " + report.sequenceErrors.length + " error(s); run validate-handoff-sequence.mjs. Findings below use only the rows it could parse.");
  }
  lines.push("");
  if (!report.findings.length) lines.push("No review prompts found.");
  for (const item of report.findings) {
    lines.push("- [" + item.kind + "] " + (item.slice || "README prose") + " — " + item.file + (item.line ? ":" + item.line : ""));
    lines.push("  " + item.message);
    lines.push("  Rule: \"" + item.rule.text + "\" (" + item.rule.reference + ")");
  }
  lines.push("");
  lines.push("Findings: " + report.findingCount);
  lines.push("Each finding is a prompt to review, not a verdict. This report does not change any validator result.");
  return lines.join("\n");
}

function main() {
  const args = parseArgs(process.argv);
  const report = buildDeliveryPlanningGapReport(args.root, { workpacks: args.workpacks });
  console.log(args.json ? JSON.stringify(report, null, 2) : formatDeliveryPlanningGapReport(report));
}

if (isEntryPoint(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
