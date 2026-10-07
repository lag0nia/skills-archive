#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { findFiles } from "./lib/model/files.mjs";
import { buildLayout } from "./lib/model/build-layout.mjs";
import { readSystemModel } from "./lib/model/system-model-records.mjs";
import { parseTicketFile } from "./lib/model/ticket-format.mjs";
import { constraintsRoot, findTechnicalConstraintRecords } from "./lib/model/technical-constraint-records.mjs";

const RESOLVED = new Set(["decided", "finished"]);
const REQUIRED_SECTIONS = ["Rule", "Scope And Sources", "Verification Intent"];

function parseArgs(argv) {
  const args = { root: null };
  for (let index = 2; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--root") args.root = argv[++index];
    else throw new Error("Unknown argument: " + value);
  }
  if (!args.root) throw new Error("Use --root <software-design-dir>.");
  return args;
}

function sectionBody(text, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp("^##\\s+" + escaped + "\\s*$([\\s\\S]*?)(?=^##\\s+|(?![\\s\\S]))", "m").exec(text);
  return match ? match[1].trim() : null;
}

function responsibilityIds(root) {
  return new Set(readSystemModel(root).responsibilities.map((record) => record.frontmatter.id));
}

function technicalSourceFiles(root) {
  const model = readSystemModel(root);
  return new Map([
    ...model.responsibilities,
    ...model.flows,
    ...Object.values(model.contracts).flat(),
  ].map((record) => [record.frontmatter.id, record.filePath]));
}

function ticketIndex(root, errors) {
  const tickets = new Map();
  const ticketsRoot = buildLayout(root).ticketsRoot;
  for (const filePath of findFiles(ticketsRoot, (name) => name.endsWith("-tickets.yaml"))) {
    try {
      const document = parseTicketFile(filePath);
      for (const ticket of [...document.tickets, ...document.archivedRecords]) {
        if (tickets.has(ticket.id)) errors.push("Duplicate ticket " + ticket.id + ".");
        tickets.set(ticket.id, { ...ticket, filePath, status: ticket.record_state === "archived" ? ticket.status_at_close : ticket.status });
      }
    } catch (error) {
      errors.push(error.message);
    }
  }
  return tickets;
}

function commaIds(value) {
  return String(value || "").trim() === "None."
    ? []
    : String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
}

function localLinkTargets(text, baseDir) {
  return [...String(text || "").matchAll(/\[[^\]]*\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g)]
    .map((match) => match[1].replace(/^<|>$/g, ""))
    .filter((target) => !/^(?:[a-z]+:|\/|\/\/)/i.test(target))
    .map((target) => path.resolve(baseDir, target.split("#", 1)[0]));
}

function validate(root) {
  const recordsRoot = constraintsRoot(root);
  if (!fs.existsSync(recordsRoot)) return { skipped: true, errors: [] };

  const errors = [];
  const responsibilities = responsibilityIds(root);
  const technicalSourcePaths = technicalSourceFiles(root);
  const tickets = ticketIndex(root, errors);
  const records = findTechnicalConstraintRecords(root);
  const constraintIdPattern = /^CONS-\d{3,}$/;
  const constraintFilenamePattern = /^cons-\d{3,}-.+\.md$/i;
  const ticketIdPattern = /^TICKET-\d{4}$/;
  const byId = new Map();

  if (!records.length) errors.push("Technical Constraint register exists but has no canonical CONS records.");
  for (const record of records) {
    const relative = path.relative(root, record.filePath).split(path.sep).join("/");
    if (record.type !== "technical-constraint") errors.push(relative + " must use type technical-constraint.");
    if (!constraintIdPattern.test(record.id || "")) errors.push(relative + " must have a valid CONS-xxx id.");
    if (!constraintFilenamePattern.test(record.filename || "") || (record.id && !record.filename.startsWith(record.id.toLowerCase() + "-"))) {
      errors.push(relative + " filename must start with its lowercase CONS id and a slug.");
    }
    if (!record.title || !String(record.title).trim()) errors.push(relative + " requires a title.");
    if (byId.has(record.id)) errors.push("Duplicate Technical Constraint identifier: " + record.id + ".");
    else byId.set(record.id, record);
    if (!record.technicalSources.length || record.technicalSources.some((id) => !technicalSourcePaths.has(id))) {
      errors.push((record.id || relative) + " technical_sources must name existing SR, FLOW, or contract records.");
    }
    if (!record.affectedResponsibilities.length || record.affectedResponsibilities.some((id) => !responsibilities.has(id))) {
      errors.push((record.id || relative) + " affected_responsibilities must name existing logical owners.");
    }
    for (const heading of REQUIRED_SECTIONS) {
      const body = sectionBody(record.content, heading);
      if (!body || /^TBD\.?$/im.test(body)) errors.push((record.id || relative) + " is missing meaningful ## " + heading + ".");
    }
    const sourcesBody = sectionBody(record.content, "Scope And Sources") || "";
    const sourceLinks = new Set(localLinkTargets(sourcesBody, path.dirname(record.filePath)));
    for (const sourceId of record.technicalSources) {
      const sourcePath = technicalSourcePaths.get(sourceId);
      if (sourcePath && !sourceLinks.has(sourcePath)) {
        errors.push((record.id || relative) + " must link the canonical Software Design source for " + sourceId + ".");
      }
    }
    for (const ticketId of record.sourceTickets) {
      if (!ticketIdPattern.test(ticketId)) {
        errors.push(record.id + " source_tickets contains invalid " + ticketId + ".");
        continue;
      }
      const ticket = tickets.get(ticketId);
      if (!ticket) errors.push(record.id + " references missing source ticket " + ticketId + ".");
      else {
        if (!RESOLVED.has(ticket.status)) errors.push(record.id + " source ticket " + ticketId + " is not decided or finished.");
        if (!Array.isArray(ticket.constraint_refs) || !ticket.constraint_refs.includes(record.id)) {
          errors.push(ticketId + " must reciprocally name " + record.id + " in constraint_refs.");
        }
        const target = path.relative(root, record.filePath).split(path.sep).join("/");
        if (!Array.isArray(ticket.write_targets) || !ticket.write_targets.includes(target)) {
          errors.push(ticketId + " must include " + target + " in write_targets for " + record.id + ".");
        }
      }
    }
  }

  for (const ticket of tickets.values()) {
    const references = ticket.constraint_refs === undefined ? [] : ticket.constraint_refs;
    if (!Array.isArray(references) || references.some((id) => typeof id !== "string" || !constraintIdPattern.test(id)) || new Set(references).size !== references.length) {
      errors.push(ticket.id + " constraint_refs must be a unique inline array of CONS-NNN identifiers.");
      continue;
    }
    for (const id of references) {
      const record = byId.get(id);
      if (!record) errors.push(ticket.id + " references missing Technical Constraint " + id + ".");
      else if (!record.sourceTickets.includes(ticket.id)) errors.push(id + " must reciprocally name " + ticket.id + " as a source ticket.");
      if (!RESOLVED.has(ticket.status)) errors.push(ticket.id + " cannot reference " + id + " while status is " + ticket.status + ".");
    }
  }
  return { skipped: false, errors };
}

try {
  const args = parseArgs(process.argv);
  const result = validate(path.resolve(args.root));
  if (result.skipped) console.log("No technical-constraint register is active.");
  else if (result.errors.length) {
    console.error("Technical Constraint validation failed:");
    for (const error of result.errors) console.error("- " + error);
    process.exitCode = 1;
  } else console.log("Verified Technical Constraint records and ticket routing.");
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
