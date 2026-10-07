import fs from "node:fs";
import path from "node:path";
import { currentShapeErrors } from "./current-shape.mjs";
import { buildLayout } from "./build-layout.mjs";

export const TECHNICAL_DECISION_STATES = new Set([
  "Open",
  "Partially Resolved",
  "Deferred For Later Design",
  "Blocked",
  "Resolved",
]);

const REQUIRED_FIELDS = [
  "id",
  "title",
  "state",
  "primary_domain",
  "affected_responsibilities",
  "context",
  "why_it_matters",
  "established",
  "how_tickets_fit",
  "outcome",
  "defer_reason",
  "resume_when",
];
const ALLOWED_FIELDS = new Set([...REQUIRED_FIELDS, "blocker", "current_shape"]);

function parseScalar(raw, filePath, fieldName) {
  const value = raw.trim();
  if (value === "null") return null;
  if (/^(?:true|false|-?\d+)$/.test(value)) return JSON.parse(value);
  if (value.startsWith("\"") || value.startsWith("[") || value.startsWith("{")) {
    try {
      return JSON.parse(value);
    } catch (error) {
      throw new Error(`${filePath}: invalid JSON-compatible YAML value for ${fieldName}: ${error.message}`);
    }
  }
  throw new Error(`${filePath}: ${fieldName} must use a quoted JSON-compatible scalar or inline array.`);
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function parseDecisionBlocks(text, filePath) {
  const header = /^decisions:\s*$/m.exec(text);
  if (!header) throw new Error(`${filePath}: missing decisions list.`);
  const section = text.slice(header.index + header[0].length);
  const blocks = [...section.matchAll(/^  - id:\s*(.+?)\s*$([\s\S]*?)(?=^  - id:|(?![\s\S]))/gm)];
  if (!blocks.length) throw new Error(`${filePath}: decisions must contain at least one record.`);
  return blocks.map((match) => {
    const record = { id: parseScalar(match[1], filePath, "id") };
    for (const line of match[2].split("\n")) {
      const field = /^    ([a-z][a-z0-9_]*):\s*(.*?)\s*$/.exec(line);
      if (!field) {
        if (line.trim()) throw new Error(`${filePath}: unsupported technical-decision YAML line: ${line.trim()}`);
        continue;
      }
      if (Object.hasOwn(record, field[1])) throw new Error(`${filePath}: duplicate field ${field[1]} in ${record.id}.`);
      record[field[1]] = parseScalar(field[2], filePath, field[1]);
    }
    return record;
  });
}

export function parseTechnicalDecisionFile(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const version = /^technical_decision_file_version:\s*(\d+)\s*$/m.exec(text)?.[1];
  if (version !== "1") throw new Error(`${filePath}: technical_decision_file_version must be 1.`);
  return { filePath, version: 1, decisions: parseDecisionBlocks(text, filePath) };
}

export function findTechnicalDecisionRecords(rootPath) {
  const root = path.resolve(rootPath);
  const filePath = buildLayout(root).technicalDecisionsPath;
  if (!filePath || !fs.existsSync(filePath)) return new Map();
  const document = parseTechnicalDecisionFile(filePath);
  const records = new Map();
  for (const record of document.decisions) {
    for (const field of Object.keys(record)) {
      if (!ALLOWED_FIELDS.has(field)) throw new Error(`${record.id || filePath}: unknown field ${field}.`);
    }
    for (const field of REQUIRED_FIELDS) {
      if (!Object.hasOwn(record, field)) throw new Error(`${record.id || filePath}: missing ${field}.`);
    }
    if (!/^TD-\d{3}$/.test(record.id || "")) throw new Error(`${filePath}: invalid Technical Decision id ${String(record.id)}.`);
    if (records.has(record.id)) throw new Error(`${filePath}: duplicate Technical Decision id ${record.id}.`);
    if (!nonEmptyString(record.title) || !TECHNICAL_DECISION_STATES.has(record.state)) {
      throw new Error(`${record.id}: title must be non-empty and state must be supported.`);
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.primary_domain || "")) {
      throw new Error(`${record.id}: primary_domain must be a lowercase domain slug.`);
    }
    if (!Array.isArray(record.affected_responsibilities)
      || !record.affected_responsibilities.length
      || record.affected_responsibilities.some((id) => !/^SR-\d{3,}$/.test(id))
      || new Set(record.affected_responsibilities).size !== record.affected_responsibilities.length) {
      throw new Error(`${record.id}: affected_responsibilities must be a unique non-empty inline array of SR-xxx identifiers.`);
    }
    for (const field of ["context", "why_it_matters", "established", "how_tickets_fit"]) {
      if (!nonEmptyString(record[field])) throw new Error(`${record.id}: ${field} must be non-empty.`);
    }
    const visualErrors = currentShapeErrors(record.current_shape, { owner: record.id, root });
    if (visualErrors.length) throw new Error(visualErrors.join("\n"));
    if (record.state === "Deferred For Later Design") {
      if (!nonEmptyString(record.defer_reason) || !nonEmptyString(record.resume_when)) {
        throw new Error(`${record.id}: Deferred For Later Design requires defer_reason and resume_when.`);
      }
    } else if (record.defer_reason !== null || record.resume_when !== null) {
      throw new Error(`${record.id}: defer_reason and resume_when must be null unless the decision is Deferred For Later Design.`);
    }
    if (record.state === "Blocked") {
      if (!nonEmptyString(record.blocker)) throw new Error(`${record.id}: Blocked requires a concrete blocker.`);
    } else if (Object.hasOwn(record, "blocker") && record.blocker !== null) {
      throw new Error(`${record.id}: blocker must be null unless the decision is Blocked.`);
    }
    if (record.state === "Resolved") {
      if (!nonEmptyString(record.outcome)) throw new Error(`${record.id}: Resolved requires a non-empty outcome.`);
    } else if (record.outcome !== null) {
      throw new Error(`${record.id}: outcome must be null until the decision is Resolved.`);
    }
    records.set(record.id, { ...record, filePath });
  }
  return records;
}
