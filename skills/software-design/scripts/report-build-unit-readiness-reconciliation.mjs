#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { isEntryPoint } from "./lib/entry-point.mjs";
import { validateImplementationDetailTickets } from "./validate-implementation-detail-tickets.mjs";
import { findBuildUnitRecords } from "./lib/model/build-unit-records.mjs";
import { parseFrontmatter } from "./lib/model/frontmatter.mjs";
import { buildLayout } from "./lib/model/build-layout.mjs";

const UNRESOLVED_PATTERN = /\b(?:not selected|remain(?:s)? open|unresolved|not yet (?:selected|defined|specified|chosen)|TBD|TODO)\b/i;
const BLOCKING_STATUSES = new Set(["todo", "deferred"]);

function parseArgs(argv) {
  const args = { root: "software-design", units: null, json: false, assertReady: false };
  for (let index = 2; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--root") args.root = argv[++index];
    else if (value === "--units") args.units = argv[++index]?.split(",").map((id) => id.trim()).filter(Boolean) || [];
    else if (value === "--json") args.json = true;
    else if (value === "--assert-ready") args.assertReady = true;
    else throw new Error("Unknown argument: " + value);
  }
  return args;
}

function naturalIdOrder(left, right) {
  return left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" });
}

function unresolvedTicketIds(line) {
  const value = String(line || "");
  const unresolvedLists = [...value.matchAll(
    /\b(?:remain(?:s)? open|unresolved)\s+under\s+(`?TICKET-\d{4}`?(?:\s*,\s*`?TICKET-\d{4}`?)*(?:\s*,?\s+(?:and|or)\s+`?TICKET-\d{4}`?)?)/gi,
  )].flatMap((match) => [...match[1].matchAll(/TICKET-\d{4}/g)].map((idMatch) => idMatch[0]));
  const singleTicketPatterns = [
    /\bnot selected\s*(?:—|-)\s*`?(TICKET-\d{4})`?/gi,
    /\bcommand selected by\s+`?(TICKET-\d{4})`?/gi,
  ];
  const singleTickets = singleTicketPatterns.flatMap((pattern) => [...value.matchAll(pattern)].map((match) => match[1]));
  return [...new Set([...unresolvedLists, ...singleTickets])];
}

function indexedTickets(validation) {
  return new Map((validation.documents || []).flatMap((document) => document.tickets.map((ticket) => [ticket.id, ticket])));
}

function indexedBuildUnits(root) {
  const records = findBuildUnitRecords(buildLayout(root).unitsRoot);
  return new Map(records.map((record) => {
    const meta = parseFrontmatter(record.content, record.filePath);
    return [meta.id, { ...record, id: meta.id }];
  }));
}

function unresolvedCues(unit, tickets) {
  const cues = [];
  for (const [index, rawLine] of unit.content.split(/\r?\n/).entries()) {
    if (!UNRESOLVED_PATTERN.test(rawLine)) continue;
    const ids = unresolvedTicketIds(rawLine);
    if (!ids.length) {
      cues.push({ line: index + 1, text: rawLine.trim(), type: "unassigned-unresolved-statement", ticketId: null });
      continue;
    }
    for (const ticketId of ids) {
      const ticket = tickets.get(ticketId);
      if (!ticket) {
        cues.push({ line: index + 1, text: rawLine.trim(), type: "unknown-ticket", ticketId });
      } else if (!ticket.build_units.includes(unit.id)) {
        cues.push({ line: index + 1, text: rawLine.trim(), type: "ticket-not-mapped-to-unit", ticketId });
      } else if (!BLOCKING_STATUSES.has(ticket.status)) {
        cues.push({ line: index + 1, text: rawLine.trim(), type: "resolved-ticket-still-described-as-unresolved", ticketId, status: ticket.status });
      } else {
        cues.push({ line: index + 1, text: rawLine.trim(), type: "mapped-blocker", ticketId, status: ticket.status });
      }
    }
  }
  return cues;
}

export function buildReadinessReconciliationReport(rootPath, requestedUnits = null) {
  const root = path.resolve(rootPath);
  const validation = validateImplementationDetailTickets(root);
  if (validation.errors.length) throw new Error(validation.errors.join("\n"));

  const tickets = indexedTickets(validation);
  const units = indexedBuildUnits(root);
  const selectedIds = requestedUnits === null ? [...units.keys()] : requestedUnits;
  const unknownUnits = selectedIds.filter((id) => !units.has(id));
  if (unknownUnits.length) throw new Error("Unknown build unit(s): " + unknownUnits.join(", ") + ".");

  const selected = selectedIds.sort(naturalIdOrder).map((id) => {
    const unit = units.get(id);
    const mappedBlockingTickets = [...tickets.values()]
      .filter((ticket) => BLOCKING_STATUSES.has(ticket.status) && ticket.build_units.includes(id))
      .map((ticket) => ({ id: ticket.id, status: ticket.status, title: ticket.title }))
      .sort((left, right) => naturalIdOrder(left.id, right.id));
    const cues = unresolvedCues(unit, tickets);
    const mismatches = cues.filter((cue) => cue.type !== "mapped-blocker");
    return {
      id,
      file: path.relative(root, unit.filePath).split(path.sep).join("/"),
      mappedBlockingTickets,
      cues,
      mismatches,
      status: mismatches.length ? "MISMATCH" : (mappedBlockingTickets.length ? "BLOCKED" : "RECONCILED"),
    };
  });

  return {
    root,
    units: selected,
    mismatchCount: selected.reduce((count, unit) => count + unit.mismatches.length, 0),
    blockingTicketCount: selected.reduce((count, unit) => count + unit.mappedBlockingTickets.length, 0),
  };
}

export function formatReadinessReconciliationReport(report) {
  const lines = ["Build Unit Readiness Reconciliation", "Root: " + report.root, ""];
  for (const unit of report.units) {
    lines.push(unit.id + ": " + unit.status + " (" + unit.file + ")");
    lines.push("  Mapped todo/deferred tickets: " + (unit.mappedBlockingTickets.map((ticket) => ticket.id + " [" + ticket.status + "]").join(", ") || "none"));
    lines.push("  Unresolved record statements:");
    if (!unit.cues.length) lines.push("  - none detected");
    for (const cue of unit.cues) {
      lines.push("  - line " + cue.line + " · " + cue.type + (cue.ticketId ? " · " + cue.ticketId : "") + ": " + cue.text);
    }
    lines.push("");
  }
  lines.push("Mismatches: " + report.mismatchCount);
  lines.push("Mapped todo/deferred blockers: " + report.blockingTicketCount);
  lines.push("A reconciled result only proves the build-unit text and ticket mapping agree. Use the handoff validator before claiming READY.");
  return lines.join("\n");
}

function main() {
  const args = parseArgs(process.argv);
  const report = buildReadinessReconciliationReport(args.root, args.units);
  console.log(args.json ? JSON.stringify(report, null, 2) : formatReadinessReconciliationReport(report));
  if (args.assertReady && (report.mismatchCount || report.blockingTicketCount)) {
    throw new Error("Selected build units are not ready: " + report.mismatchCount + " reconciliation mismatch(es), " + report.blockingTicketCount + " mapped todo/deferred blocker(s).");
  }
}

if (isEntryPoint(import.meta.url)) main();
