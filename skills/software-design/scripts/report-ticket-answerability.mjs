#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { buildLayout } from "./lib/model/build-layout.mjs";
import { isEntryPoint } from "./lib/entry-point.mjs";
import { findFiles } from "./lib/model/files.mjs";
import { assertCurrentFormat } from "./lib/model/package-format.mjs";
import { parseTicketFile } from "./lib/model/ticket-format.mjs";
import { analyzeTicketDependencies } from "./lib/model/ticket-dependencies.mjs";
import { originLabel } from "./lib/model/decision-attribution.mjs";

// A settled prerequisite is context for the consultation; its recorded origin
// keeps an agent choice from being presented to the recipient as the user's approval.
function settledOrigins(record) {
  const entries = Array.isArray(record?.attribution) ? record.attribution : [];
  return entries.length ? [...new Set(entries.map((entry) => originLabel(entry.origin) || "Unknown origin"))] : ["Unknown origin"];
}

export function buildTicketAnswerabilityReport(rootPath, { tickets = [], all = false } = {}) {
  if ((!all && !tickets.length) || (all && tickets.length)) throw new Error("Select repeated --ticket IDs or --all, exclusively.");
  const root = path.resolve(rootPath);
  if (!fs.statSync(root).isDirectory()) throw new Error("Package root must be a directory.");
  assertCurrentFormat(root, "Ticket answerability");
  const inventory = buildLayout(root).ticketsRoot;
  if (!fs.existsSync(inventory)) throw new Error("Ticket inventory directory is missing: " + inventory);
  if (!fs.statSync(inventory).isDirectory()) throw new Error("Ticket inventory path must be a directory: " + inventory);
  const ticketFiles = findFiles(inventory, (name) => name.endsWith("-tickets.yaml")).sort();
  if (!ticketFiles.length) throw new Error("No recognized ticket files (*-tickets.yaml) in ticket inventory: " + inventory);
  const records = ticketFiles.flatMap((file) => {
    const document = parseTicketFile(file);
    return [...document.tickets, ...document.archivedRecords].map((record) => ({ ...record, filePath: path.relative(root, file).split(path.sep).join("/") }));
  });
  if (tickets.some((id) => !/^TICKET-\d{4}$/.test(id))) throw new Error("Invalid selected ticket ID.");
  const analysis = analyzeTicketDependencies(records, all ? records.filter((r) => r.record_state !== "archived").map((r) => r.id) : tickets);
  const recordsById = new Map(records.map((record) => [record.id, record]));
  for (const node of analysis.nodes) {
    if (node.settled) node.origins = settledOrigins(recordsById.get(node.id));
    // Parts the user already settled inside an open question are reported so
    // they are not asked again; the question itself stays unanswered.
    else if (Array.isArray(recordsById.get(node.id)?.attribution) && recordsById.get(node.id).attribution.length) {
      node.recordedParts = recordsById.get(node.id).attribution.map((entry) => ({ origin: originLabel(entry.origin) || "Unknown origin", decision: entry.decision, conditions: entry.conditions || [] }));
    }
  }
  return { root, ...analysis };
}

export function formatTicketAnswerabilityReport(report) {
  const name = (id) => { const node = report.nodes.find((n) => n.id === id); return id + " — " + (node?.title || id); };
  const lines = ["Ticket answering availability", "Root: " + report.root, "Prerequisite sequence (waiting remains conditional): " + (report.prerequisiteOrder.map(name).join("; ") || "none")];
  for (const q of report.questions) {
    lines.push("", name(q.id) + ": " + q.disposition);
    for (const part of report.nodes.find((n) => n.id === q.id)?.recordedParts || []) {
      lines.push("  Already decided (" + part.origin + "): " + part.decision + part.conditions.map((condition) => " [" + condition + "]").join(""));
    }
    if (q.internalPrerequisites.length) lines.push("  Answer after: " + q.internalPrerequisites.map(name).join("; "));
    for (const id of q.approvedContext) {
      const node = report.nodes.find((n) => n.id === id);
      lines.push("  Settled context (" + node.origins.join(", ") + "): " + name(id) + ": " + node.resolution);
    }
    const resumeWhen = report.nodes.find((n) => n.id === q.id)?.resumeWhen;
    if (resumeWhen && ["deferred", "out-of-scope"].includes(q.status)) lines.push("  Resume when: " + resumeWhen);
    for (const c of q.causes) lines.push("  " + c.kind + ": " + c.detail + " [" + c.path.map(name).join(" -> ") + "]");
  }
  lines.push("", "Distinct outside prerequisites / facts:");
  for (const notice of report.outsideNotices) lines.push("- " + notice.kind + ": " + notice.detail + "; sources: " + notice.sources.map(name).join("; ") + "; affects: " + notice.affected.map((a) => name(a.id)).join("; "));
  for (const f of report.findings) lines.push("Review " + name(f.id) + " [" + f.code + "]: " + f.detail);
  lines.push("", "Read-only derived analysis; recorded relationships still require semantic review.");
  return lines.join("\n");
}

function main(argv) {
  let root, all = false, json = false; const tickets = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--all") all = true;
    else if (arg === "--json") json = true;
    else if (["--root", "--ticket"].includes(arg)) {
      const value = argv[++i];
      if (!value || value.startsWith("--")) throw new Error("Missing value for " + arg);
      if (arg === "--root") root = value; else tickets.push(value);
    } else throw new Error("Unknown argument: " + arg);
  }
  if (!root) throw new Error("--root <package> is required.");
  const report = buildTicketAnswerabilityReport(root, { tickets, all });
  console.log(json ? JSON.stringify(report, null, 2) : formatTicketAnswerabilityReport(report));
}
if (isEntryPoint(import.meta.url)) {
  try { main(process.argv.slice(2)); }
  catch (error) { console.error("Analysis incomplete: " + error.message); process.exitCode = 1; }
}
