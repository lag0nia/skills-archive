import fs from "node:fs";
import path from "node:path";
import { findFiles, readText } from "./files.mjs";
import { markdownAnchorExists, markdownInlineLinks } from "./markdown.mjs";

// Serialized origin -> reader-facing category, in overview order. The label
// grants no authority; the evidence beside it establishes the origin.
export const DECISION_ORIGINS = Object.freeze({
  "human-approved/user-specified": "Human-approved · User specified",
  "human-approved/agent-recommended": "Human-approved · Agent recommended",
  "agent-chosen": "Agent-chosen",
  "unknown-origin": "Unknown origin",
});
export const ATTRIBUTION_SECTION = "Decision Attribution";
export const SETTLED_TICKET_STATUSES = new Set(["decided", "finished"]);
// An open ticket may already hold parts the user settled; its question stays open.
export const OPEN_TICKET_STATUSES = new Set(["todo", "deferred"]);
const ENTRY_KEYS = new Set(["decision", "origin", "evidence", "conditions"]);
// The skill's lifecycle, earliest first. A prerequisite binds from its stage
// onward; release and later stages are later-lifecycle gates that never hold
// design, implementation, build, or verification work.
export const CONDITION_STAGES = Object.freeze(["design", "implementation", "build", "verification", "release", "deployment", "activation", "operation"]);
const LATER_LIFECYCLE_STAGES = new Set(["release", "deployment", "activation", "operation"]);
const CONDITION = /^(?:(Requirement)|(Prerequisite) before ([a-z]+)): \S/;
const TICKET_REFERENCE = /TICKET-\d{4}/g;
const BACKTICKED_FILE = /`([^`\s]+?\.(?:md|yaml|yml|html|json|docx|pdf|txt))(#[^`\s]*)?`/g;
const TABLE_HEADERS = ["Decision", "Origin", "Evidence", "Conditions"];

export function originLabel(origin) {
  return DECISION_ORIGINS[origin] || null;
}

export function isHumanApproved(origin) {
  return String(origin || "").startsWith("human-approved/");
}

export function conditionKind(condition) {
  const match = CONDITION.exec(condition || "");
  return match?.[1] || match?.[2] || null;
}

export function conditionStage(condition) {
  return CONDITION.exec(condition || "")?.[3] || null;
}

export function isLaterLifecycleStage(stage) {
  return LATER_LIFECYCLE_STAGES.has(stage);
}

// Reader wording shared by the overview and projected issues.
export function conditionDisplay(condition) {
  const match = CONDITION.exec(condition || "");
  if (!match) return String(condition);
  const text = String(condition).slice(String(condition).indexOf(": ") + 2);
  return `${match[1] ? "Condition (continuing requirement)" : `Condition (before ${match[3]})`}: ${text}`;
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function normalizedDecision(text) {
  return String(text || "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function referenceErrors(owner, text, { ticketIds, resolveFile, relativeLinksAllowed = true }) {
  const errors = [];
  if (!relativeLinksAllowed && markdownInlineLinks(text).some((link) => !/^[a-z][a-z0-9+.-]*:/i.test(link.destination))) {
    errors.push(`${owner}: name package files in attribution as package-relative backticked paths, not relative Markdown links.`);
  }
  for (const id of new Set(String(text).match(TICKET_REFERENCE) || [])) {
    if (!ticketIds.has(id)) errors.push(`${owner}: attribution references unknown ticket ${id}.`);
  }
  for (const target of resolveFile(String(text))) {
    if (!target.exists) errors.push(`${owner}: attribution reference does not resolve: ${target.reference}.`);
  }
  return errors;
}

function entryErrors(owner, entry, context) {
  const errors = [];
  if (!nonEmptyString(entry.decision)) errors.push(`${owner}: each attribution entry must name the specific decision it covers.`);
  if (!originLabel(entry.origin)) errors.push(`${owner}: attribution origin must be one of ${Object.keys(DECISION_ORIGINS).join(", ")}.`);
  if (!nonEmptyString(entry.evidence)) errors.push(`${owner}: each attribution entry needs evidence: a usable source reference or a short contextual excerpt.`);
  if (!Array.isArray(entry.conditions)) errors.push(`${owner}: attribution conditions must be an inline array.`);
  for (const condition of Array.isArray(entry.conditions) ? entry.conditions : []) {
    const kind = conditionKind(condition);
    const stage = conditionStage(condition);
    if (!kind || (kind === "Prerequisite" && !CONDITION_STAGES.includes(stage))) {
      errors.push(`${owner}: each condition must start with "Requirement: " (a continuing design rule) or "Prerequisite before <stage>: " (something that must happen before that stage), where <stage> is one of ${CONDITION_STAGES.join(", ")}.`);
      continue;
    }
    if (kind === "Prerequisite" && !isLaterLifecycleStage(stage) && !(String(condition).match(TICKET_REFERENCE) || []).some((id) => id !== context.ownTicket)) {
      errors.push(`${owner}: a prerequisite before ${stage} must name the unresolved ticket that tracks it.`);
    }
  }
  for (const text of [entry.decision, entry.evidence, ...(Array.isArray(entry.conditions) ? entry.conditions : [])]) {
    if (nonEmptyString(text)) errors.push(...referenceErrors(owner, text, context));
  }
  return errors;
}

function duplicateErrors(owner, entries) {
  const seen = new Set();
  const errors = [];
  for (const entry of entries) {
    const key = normalizedDecision(entry.decision);
    if (!key) continue;
    if (seen.has(key)) errors.push(`${owner}: the same decision is attributed twice; keep one entry per decision.`);
    seen.add(key);
  }
  return errors;
}

// Ticket text names package files the way write_targets do: package-relative,
// in backticks. Only existing files count as resolvable references.
export function packageFileReferences(root) {
  return (text) => [...text.matchAll(BACKTICKED_FILE)].map((match) => {
    const absolute = path.resolve(root, match[1]);
    const anchor = match[2]?.slice(1) || "";
    const exists = fs.existsSync(absolute) && fs.statSync(absolute).isFile()
      && (!anchor || !absolute.endsWith(".md") || markdownAnchorExists(absolute, anchor));
    return { reference: match[0], absolute, anchor, exists };
  });
}

// Markdown records use ordinary links relative to the record; a bare anchor
// points into the record itself.
export function recordLinkReferences(filePath) {
  return (text) => markdownInlineLinks(text).flatMap(({ destination: target }) => {
    if (/^[a-z][a-z0-9+.-]*:/i.test(target)) return [];
    const [file, anchor = ""] = target.split("#");
    const absolute = file ? path.resolve(path.dirname(filePath), decodeURI(file)) : filePath;
    const exists = fs.existsSync(absolute) && fs.statSync(absolute).isFile()
      && (!anchor || !absolute.endsWith(".md") || markdownAnchorExists(absolute, anchor));
    return [{ reference: target, absolute, anchor, exists }];
  });
}

export function ticketAttributionErrors(ticket, { root, ticketIds }) {
  if (!Object.hasOwn(ticket, "attribution")) return [];
  const owner = String(ticket.id);
  const entries = ticket.attribution;
  if (!Array.isArray(entries) || entries.some((entry) => !entry || typeof entry !== "object" || Array.isArray(entry))) {
    return [`${owner}: attribution must be an inline array of entry objects.`];
  }
  const errors = [];
  if (entries.length && ticket.record_state !== "archived" && !SETTLED_TICKET_STATUSES.has(ticket.status) && !OPEN_TICKET_STATUSES.has(ticket.status)) {
    errors.push(`${owner}: an ${ticket.status} ticket records no attribution; keep an exclusion's attribution in its scope record.`);
  }
  const context = { ticketIds, ownTicket: ticket.id, resolveFile: packageFileReferences(root), relativeLinksAllowed: false };
  for (const entry of entries) {
    const unknownKeys = Object.keys(entry).filter((key) => !ENTRY_KEYS.has(key));
    if (unknownKeys.length) errors.push(`${owner}: unsupported attribution field(s) ${unknownKeys.join(", ")}.`);
    errors.push(...entryErrors(owner, { conditions: [], ...entry }, context));
  }
  return [...errors, ...duplicateErrors(owner, entries)];
}

function splitCells(line) {
  const cells = [];
  let value = "";
  let code = false;
  let escaped = false;
  for (const character of line.trim().replace(/^\|/, "").replace(/\|$/, "")) {
    if (escaped) { value += character; escaped = false; continue; }
    if (character === "\\") { escaped = true; value += character; continue; }
    if (character === "`") code = !code;
    if (character === "|" && !code) { cells.push(value.trim()); value = ""; } else value += character;
  }
  cells.push(value.trim());
  return cells.map((cell) => cell.replace(/\\\|/g, "|"));
}

// Owners that may hold attribution for a decision that has no ticket.
export function attributionOwnerPath(relativePath) {
  return /^system-model\/.+\.md$/.test(relativePath)
    || /^build\/units\/[^/]+\.md$/.test(relativePath)
    || /^build\/repositories\/[^/]+\/README\.md$/.test(relativePath)
    || /^build\/records\/.+\.md$/.test(relativePath)
    || relativePath === "ui-ux/specification.md";
}

export function parseAttributionSection(text, filePath) {
  const headings = [...text.matchAll(new RegExp(`^## ${ATTRIBUTION_SECTION}\\s*$`, "gm"))];
  if (!headings.length) return null;
  if (headings.length > 1) return { entries: [], errors: [`${filePath}: use one ## ${ATTRIBUTION_SECTION} section per record.`] };
  const start = headings[0].index + headings[0][0].length;
  const rest = text.slice(start);
  const end = /^#{1,2} /m.exec(rest)?.index ?? rest.length;
  const rows = rest.slice(0, end).split("\n").filter((line) => line.trim().startsWith("|")).map(splitCells);
  const errors = [];
  if (!rows.length || rows[0].join("|") !== TABLE_HEADERS.join("|")) {
    return { entries: [], errors: [`${filePath}: ## ${ATTRIBUTION_SECTION} needs a table with columns ${TABLE_HEADERS.join(", ")}.`] };
  }
  const originsByLabel = new Map(Object.entries(DECISION_ORIGINS).map(([origin, label]) => [label, origin]));
  const entries = [];
  for (const cells of rows.slice(1).filter((cells) => !cells.every((cell) => /^:?-+:?$/.test(cell)))) {
    if (cells.length !== TABLE_HEADERS.length) {
      errors.push(`${filePath}: ${ATTRIBUTION_SECTION} rows need exactly ${TABLE_HEADERS.length} cells.`);
      continue;
    }
    const [decision, label, evidence, conditionCell] = cells;
    const origin = originsByLabel.get(label);
    if (!origin) errors.push(`${filePath}: attribution origin must be one of ${[...originsByLabel.keys()].join(", ")}.`);
    const conditions = /^None\.?$/i.test(conditionCell) ? [] : conditionCell.split(/\s*<br\s*\/?>\s*/i).filter(Boolean);
    entries.push({ decision, origin: origin || label, evidence, conditions });
  }
  if (!entries.length) errors.push(`${filePath}: ## ${ATTRIBUTION_SECTION} has no entries; remove the empty section.`);
  return { entries, errors };
}

export function recordAttributionErrors(filePath, entries, { root, ticketIds }) {
  const owner = path.relative(root, filePath).split(path.sep).join("/");
  const context = { ticketIds, resolveFile: recordLinkReferences(filePath) };
  return [...entries.flatMap((entry) => entryErrors(owner, entry, context)), ...duplicateErrors(owner, entries)];
}

// Collect every ## Decision Attribution section in the package, rejecting
// sections in navigation, derived, or workflow files.
export function findRecordAttributions(rootPath, { ticketIds = new Set() } = {}) {
  const root = path.resolve(rootPath);
  const records = [];
  const errors = [];
  for (const filePath of findFiles(root, (name) => name.endsWith(".md")).sort()) {
    const relativePath = path.relative(root, filePath).split(path.sep).join("/");
    const parsed = parseAttributionSection(readText(filePath), relativePath);
    if (!parsed) continue;
    if (!attributionOwnerPath(relativePath)) {
      errors.push(`${relativePath}: ## ${ATTRIBUTION_SECTION} belongs in the authoritative record of a decision, not in navigation, derived, or workflow files.`);
      continue;
    }
    errors.push(...parsed.errors, ...recordAttributionErrors(filePath, parsed.entries, { root, ticketIds }));
    records.push({ filePath, relativePath, entries: parsed.entries });
  }
  return { records, errors };
}

// The same decision recorded in two owners would show twice and could drift;
// one owner records it and the others reference that owner.
export function crossOwnerDuplicateErrors(items) {
  const owners = new Map();
  const errors = [];
  for (const item of items) {
    const key = normalizedDecision(item.decision);
    if (!key) continue;
    if (owners.has(key) && owners.get(key) !== item.ownerKey) {
      errors.push(`Decision "${item.decision}" is attributed in both ${owners.get(key)} and ${item.ownerKey}; record it once and reference that owner.`);
    } else owners.set(key, item.ownerKey);
  }
  return errors;
}
