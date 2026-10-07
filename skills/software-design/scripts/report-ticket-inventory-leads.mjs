#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { isEntryPoint } from "./lib/entry-point.mjs";
import { validateImplementationDetailTickets } from "./validate-implementation-detail-tickets.mjs";

const LEAD_PATTERNS = [
  /\b(?:TBD|TODO)\b/i,
  /\b(?:component|responsibility)[- ]level implementation details?\b/i,
  /\b(?:component|responsibility)-owned implementation(?:-detail)? work\b/i,
  /\bimplementation-detail work\b/i,
  /\blater (?:interface|implementation)(?:-detail)? work\b/i,
  /\bexact\b.*\bremain(?:s|ed)?\b/i,
  /\bremain(?:s|ed)?\s+(?:unresolved|open|undefined|unspecified)\b/i,
  /\bnot yet (?:selected|defined|specified|chosen)\b/i,
  /\bmust (?:select|define|decide|specify)\b/i,
];

function parseArgs(argv) {
  const args = { root: "software-design", json: false };
  for (let index = 2; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--root") args.root = argv[++index];
    else if (value === "--json") args.json = true;
    else throw new Error("Unknown argument: " + value);
  }
  return args;
}

function files(root, matcher) {
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) return files(target, matcher);
    return entry.isFile() && matcher(target) ? [target] : [];
  });
}

function naturalIdOrder(left, right) {
  return left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" });
}

function activeTickets(validation) {
  return (validation.documents || []).flatMap((document) => document.tickets.map((ticket) => ({
    ...ticket,
    filePath: document.filePath,
  })));
}

function unresolvedLanguageLeads(root) {
  const excludedRoots = [
    path.join(root, "build") + path.sep,
    path.join(root, "diagrams") + path.sep,
  ];
  const markdownFiles = files(root, (filePath) => filePath.endsWith(".md")
    && !excludedRoots.some((excluded) => filePath.startsWith(excluded)));
  const leads = [];

  for (const filePath of markdownFiles) {
    const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
    for (let index = 0; index < lines.length; index += 1) {
      const text = lines[index].trim();
      if (!text || !LEAD_PATTERNS.some((pattern) => pattern.test(text))) continue;
      leads.push({
        file: path.relative(root, filePath).split(path.sep).join("/"),
        line: index + 1,
        text,
      });
    }
  }

  return leads.sort((left, right) => left.file.localeCompare(right.file) || left.line - right.line);
}

export function buildTicketInventoryLeadReport(rootPath) {
  const root = path.resolve(rootPath);
  const validation = validateImplementationDetailTickets(root);
  if (validation.errors.length) throw new Error(validation.errors.join("\n"));

  const tickets = activeTickets(validation);
  const linkedTickets = tickets.filter((ticket) => ticket.parent_decision);
  const independentTickets = tickets.filter((ticket) => ticket.parent_decision === null || !Object.hasOwn(ticket, "parent_decision"));
  const ownership = [...validation.responsibilities.entries()]
    .sort(([left], [right]) => naturalIdOrder(left, right))
    .map(([id, responsibility]) => {
      const owned = tickets.filter((ticket) => ticket.owner === id);
      return {
        id,
        name: responsibility.name,
        domain: responsibility.domain,
        linked: owned.filter((ticket) => ticket.parent_decision).length,
        independent: owned.filter((ticket) => ticket.parent_decision === null || !Object.hasOwn(ticket, "parent_decision")).length,
        total: owned.length,
      };
    });

  return {
    root,
    responsibilityCount: ownership.length,
    ticketCount: tickets.length,
    linkedTicketCount: linkedTickets.length,
    independentTicketCount: independentTickets.length,
    ownership,
    zeroOwnedResponsibilities: ownership.filter((responsibility) => responsibility.total === 0).map((responsibility) => responsibility.id),
    unresolvedLanguageLeads: unresolvedLanguageLeads(root),
    structuralValidation: validation.skipped ? "skipped-no-ticket-files" : "passed",
  };
}

export function formatTicketInventoryLeadReport(report) {
  const lines = [
    "Ticket Inventory Lead Report",
    "Root: " + report.root,
    "System Responsibilities: " + report.responsibilityCount,
    "Active tickets: " + report.ticketCount,
    "TD-linked tickets: " + report.linkedTicketCount,
    "Independent tickets: " + report.independentTicketCount,
    "Structural validation: " + report.structuralValidation,
    "",
    "System Responsibility ownership:",
  ];

  for (const responsibility of report.ownership) {
    lines.push(
      "- " + responsibility.id + " " + responsibility.name
      + ": total=" + responsibility.total
      + ", TD-linked=" + responsibility.linked
      + ", independent=" + responsibility.independent,
    );
  }

  lines.push(
    "",
    "System Responsibilities with zero owned tickets: " + (report.zeroOwnedResponsibilities.join(", ") || "none"),
    "",
    "Explicit unresolved-language leads: " + report.unresolvedLanguageLeads.length,
  );
  for (const lead of report.unresolvedLanguageLeads) {
    lines.push("- " + lead.file + ":" + lead.line + " " + lead.text);
  }
  lines.push("", "This report surfaces leads only; it neither creates tickets nor proves semantic inventory completeness.");
  return lines.join("\n");
}

function main() {
  const args = parseArgs(process.argv);
  const report = buildTicketInventoryLeadReport(args.root);
  console.log(args.json ? JSON.stringify(report, null, 2) : formatTicketInventoryLeadReport(report));
}

if (isEntryPoint(import.meta.url)) main();
