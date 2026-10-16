import fs from "node:fs";
import path from "node:path";
import { validateImplementationDetailTickets } from "../validate-implementation-detail-tickets.mjs";
import {
  DECISION_ORIGINS,
  OPEN_TICKET_STATUSES,
  SETTLED_TICKET_STATUSES,
  conditionDisplay,
  conditionKind,
  conditionStage,
  crossOwnerDuplicateErrors,
  findRecordAttributions,
  isHumanApproved,
  isLaterLifecycleStage,
  originLabel,
  packageFileReferences,
  recordLinkReferences,
} from "./model/decision-attribution.mjs";
import { readText } from "./model/files.mjs";
import { parseFrontmatter } from "./model/frontmatter.mjs";
import { markdownHeadingSlug, replaceMarkdownInlineLinks } from "./model/markdown.mjs";
import { assertCurrentFormat } from "./model/package-format.mjs";

export const DECISION_OVERVIEW_PATH = "build/workflow/decision-overview.md";
const OVERVIEW_DIR = path.posix.dirname(DECISION_OVERVIEW_PATH);
const TICKET_REFERENCE = /TICKET-\d{4}/g;

const posix = (value) => value.split(path.sep).join("/");
const withoutAnchor = (value) => String(value).split("#")[0];

function recordLabel(root, relativePath) {
  const absolute = path.join(root, relativePath);
  if (!relativePath.endsWith(".md") || !fs.existsSync(absolute)) return relativePath;
  const text = readText(absolute);
  let meta = {};
  try { meta = parseFrontmatter(text, relativePath); } catch { /* READMEs and specifications have no frontmatter */ }
  const name = meta.name || meta.title || /^#\s+(.+)$/m.exec(text)?.[1]?.trim();
  if (!name) return relativePath;
  // Reading-layer convention: the name first, the canonical ID in parentheses.
  return /^[A-Z]+-\d{3,}$/.test(meta.id || "") && !name.includes(meta.id) ? `${name} (${meta.id})` : name;
}

// Settled tickets, recorded parts of open tickets, and attributed records, in a
// stable order. A settled ticket without attribution appears once as Unknown
// origin; an open question or unanswered proposal never appears.
export function collectDecisions(rootPath) {
  const root = path.resolve(rootPath);
  assertCurrentFormat(root, "Decision overview");
  const ticketResult = validateImplementationDetailTickets(root);
  if (ticketResult.errors.length) throw new Error(ticketResult.errors.join("\n"));
  const documents = ticketResult.documents || [];
  const tickets = documents.flatMap((document) => document.tickets.map((ticket) => ({ ...ticket, filePath: document.filePath })))
    .sort((left, right) => left.id.localeCompare(right.id));
  const archivedIds = new Set(documents.flatMap((document) => document.archivedRecords.map((ticket) => ticket.id)));
  const ticketIndex = new Map(tickets.map((ticket) => [ticket.id, ticket]));
  const recordResult = findRecordAttributions(root, { ticketIds: new Set([...ticketIndex.keys(), ...archivedIds]) });
  if (recordResult.errors.length) throw new Error(recordResult.errors.join("\n"));

  const items = [];
  const settledTickets = tickets.filter((ticket) => SETTLED_TICKET_STATUSES.has(ticket.status));
  const openTickets = tickets.filter((ticket) => OPEN_TICKET_STATUSES.has(ticket.status) && Array.isArray(ticket.attribution) && ticket.attribution.length);
  for (const ticket of [...settledTickets, ...openTickets].sort((left, right) => left.id.localeCompare(right.id))) {
    const owner = { kind: "ticket", id: ticket.id, title: ticket.title, status: ticket.status, open: OPEN_TICKET_STATUSES.has(ticket.status), path: posix(path.relative(root, ticket.filePath)) };
    const shared = { owner, ownerKey: ticket.id, writeTargets: ticket.write_targets || [], references: packageFileReferences(root) };
    const entries = Array.isArray(ticket.attribution) ? ticket.attribution : [];
    if (!entries.length) items.push({ ...shared, origin: "unknown-origin", decision: ticket.title, evidence: null, conditions: [], implicit: true });
    for (const entry of entries) items.push({ ...shared, ...entry, conditions: entry.conditions || [], implicit: false });
  }
  for (const record of recordResult.records) {
    const owner = { kind: "record", id: null, title: recordLabel(root, record.relativePath), status: null, path: record.relativePath, filePath: record.filePath, anchor: markdownHeadingSlug("Decision Attribution") };
    for (const entry of record.entries) {
      items.push({ owner, ownerKey: record.relativePath, writeTargets: [], references: recordLinkReferences(record.filePath), ...entry, implicit: false });
    }
  }
  const duplicates = crossOwnerDuplicateErrors(items.filter((item) => !item.implicit));
  if (duplicates.length) throw new Error(duplicates.join("\n"));
  return {
    root,
    items,
    ticketIndex,
    archivedIds,
    counts: {
      settledTickets: settledTickets.length,
      openTickets: openTickets.length,
      openTicketDecisions: items.filter((item) => item.owner.open).length,
      unattributedTickets: items.filter((item) => item.implicit).length,
      ticketDecisions: items.filter((item) => item.owner.kind === "ticket" && !item.owner.open).length,
      recordDecisions: items.filter((item) => item.owner.kind === "record").length,
      records: recordResult.records.length,
    },
  };
}

// A destination as seen from the overview's own folder, inside or outside the package.
function fromOverview(root, absolute, anchor = "") {
  const target = posix(path.relative(path.join(root, OVERVIEW_DIR), absolute)).split("/").map(encodeURIComponent).join("/");
  return `${target}${anchor ? "#" + anchor : ""}`;
}

function overviewLink(root, relativePath, label, anchor = "") {
  return `[${label.replace(/([\\[\]])/g, "\\$1")}](${fromOverview(root, path.join(root, relativePath), anchor)})`;
}

function indent(text) {
  return String(text).replace(/\n/g, "\n    ");
}

// Authored words are kept. Each reference is resolved against the record that
// wrote it, and its link is rewritten to reach the same target from the overview.
function renderText(root, item, value) {
  let text = String(value);
  if (item.owner.kind === "ticket") {
    for (const reference of item.references(text)) {
      if (reference.exists) text = text.split(reference.reference).join(`[${reference.reference}](${fromOverview(root, reference.absolute, reference.anchor)})`);
    }
    return text;
  }
  const resolved = new Map(item.references(text).map((reference) => [reference.reference, reference]));
  return replaceMarkdownInlineLinks(text, ({ label, destination, title }) => {
    const reference = resolved.get(destination);
    return reference ? `[${label}](${fromOverview(root, reference.absolute, reference.anchor)}${title})` : undefined;
  });
}

// A prerequisite keeps its stage and shows any tracking ticket's current status;
// the overview never declares a condition satisfied.
function renderCondition(collection, item, condition) {
  const text = renderText(collection.root, item, conditionDisplay(condition));
  if (conditionKind(condition) !== "Prerequisite") return text;
  const stage = conditionStage(condition);
  const notes = isLaterLifecycleStage(stage) ? [`binds at ${stage}; earlier design, implementation, build, and verification are not held`] : [];
  for (const id of [...new Set(condition.match(TICKET_REFERENCE) || [])].filter((id) => id !== item.owner.id)) {
    const ticket = collection.ticketIndex.get(id);
    notes.push(ticket ? `${id} is ${ticket.status}` : `${id} is archived`);
  }
  return notes.length ? `${text} — ${notes.join("; ")}` : text;
}

function renderItem(collection, item) {
  const { root } = collection;
  const owner = item.owner.kind === "ticket"
    ? `${overviewLink(root, item.owner.path, `${item.owner.id} — ${item.owner.title}`)} · ${item.owner.status}${item.owner.open ? " — recorded part of an open question; the rest is still unanswered" : ""}`
    : overviewLink(root, item.owner.path, item.owner.title, item.owner.anchor);
  const lines = [`- **${indent(renderText(root, item, item.decision))}**`, `  - Owner: ${owner}`];
  const targets = [...new Set(item.writeTargets.map(withoutAnchor))].filter((target) => fs.existsSync(path.join(root, target)));
  // A ticket's status does not show which targets already hold its answer.
  if (targets.length) lines.push(`  - Canonical targets: ${targets.map((target) => overviewLink(root, target, recordLabel(root, target))).join("; ")}`);
  for (const condition of item.conditions) lines.push(`  - ${indent(renderCondition(collection, item, condition))}`);
  lines.push(item.implicit
    ? "  - Attribution: not recorded. The ticket's status shows that its answer is settled, not who chose it."
    : `  - Evidence: ${indent(renderText(root, item, item.evidence))}`);
  return lines.join("\n");
}

export function renderDecisionOverview(collection) {
  const { counts, items } = collection;
  const byOrigin = Object.keys(DECISION_ORIGINS).map((origin) => [origin, items.filter((item) => item.origin === origin)]);
  const lines = [
    "# Decision Overview",
    "",
    "Generated by the Software Design skill from tickets and canonical records; do not edit this page. Record or correct attribution in the owning ticket or record, then regenerate. The linked owners remain authoritative.",
    "",
    "## Coverage",
    "",
    `- ${items.length} current decision${items.length === 1 ? "" : "s"}: ${counts.ticketDecisions} from ${counts.settledTickets} settled ticket${counts.settledTickets === 1 ? "" : "s"}, ${counts.openTicketDecisions} recorded within ${counts.openTickets} open ticket${counts.openTickets === 1 ? "" : "s"}, and ${counts.recordDecisions} from ${counts.records} canonical record${counts.records === 1 ? "" : "s"}.`,
    `- ${counts.unattributedTickets} settled ticket${counts.unattributedTickets === 1 ? " has" : "s have"} no recorded attribution and ${counts.unattributedTickets === 1 ? "is" : "are"} listed once under Unknown origin.`,
    "- A part recorded within an open ticket does not settle that ticket: its remaining question stays open and its dependents stay waiting. Open questions and unanswered proposals are not listed. Archived records and withdrawn answers are not current and are not listed.",
    "- Choices described only in prose, without attribution, are not inventoried here; this page does not claim every historical choice has been found.",
    "",
    "| Category | Decisions |",
    "| --- | --- |",
    ...byOrigin.map(([origin, group]) => `| [${originLabel(origin)}](#${markdownHeadingSlug(originLabel(origin))}) | ${group.length} |`),
  ];
  for (const [origin, group] of byOrigin) {
    lines.push("", `## ${originLabel(origin)}`, "");
    lines.push(group.length ? group.map((item) => renderItem(collection, item)).join("\n") : "None recorded.");
  }
  return lines.join("\n") + "\n";
}

export function writeDecisionOverview(rootPath) {
  const collection = collectDecisions(rootPath);
  const target = path.join(collection.root, DECISION_OVERVIEW_PATH);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, renderDecisionOverview(collection));
  return summary(collection);
}

export function checkDecisionOverview(rootPath) {
  const collection = collectDecisions(rootPath);
  const target = path.join(collection.root, DECISION_OVERVIEW_PATH);
  if (!fs.existsSync(target)) throw new Error(`${DECISION_OVERVIEW_PATH} is missing; generate it.`);
  if (readText(target) !== renderDecisionOverview(collection)) {
    throw new Error(`${DECISION_OVERVIEW_PATH} is stale or was edited by hand; regenerate it from the owning tickets and records.`);
  }
  return summary(collection);
}

function summary(collection) {
  return {
    overview: DECISION_OVERVIEW_PATH,
    decisions: collection.items.length,
    byCategory: Object.fromEntries(Object.keys(DECISION_ORIGINS).map((origin) => [originLabel(origin), collection.items.filter((item) => item.origin === origin).length])),
    unattributedTickets: collection.counts.unattributedTickets,
  };
}

// Read-only: current decisions an intended revision touches, so protected
// human approvals and their conditions are named before the change is proposed.
export function affectedDecisions(rootPath, selectors) {
  const collection = collectDecisions(rootPath);
  const { root } = collection;
  const normalized = selectors.map((selector) => {
    if (/^TICKET-\d{4}$/.test(selector)) return { kind: "ticket", value: selector };
    const absolute = path.resolve(root, withoutAnchor(selector));
    const relativePath = posix(path.relative(root, absolute));
    if (relativePath.startsWith("../") || !fs.existsSync(absolute)) throw new Error(`Selector does not resolve inside the package: ${selector}.`);
    return { kind: "path", value: relativePath };
  });
  const affected = [];
  for (const item of collection.items) {
    const matchedBy = normalized.filter((selector) => (selector.kind === "ticket"
      ? item.owner.id === selector.value || item.conditions.some((condition) => condition.includes(selector.value))
      : item.owner.path === selector.value || item.writeTargets.map(withoutAnchor).includes(selector.value))).map((selector) => selector.value);
    if (!matchedBy.length) continue;
    affected.push({
      category: originLabel(item.origin),
      humanApproved: isHumanApproved(item.origin),
      decision: item.decision,
      conditions: item.conditions,
      evidence: item.evidence,
      owner: { id: item.owner.id, path: item.owner.path, status: item.owner.status },
      matchedBy,
    });
  }
  return { selectors: normalized.map((selector) => selector.value), affected };
}
