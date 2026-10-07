import fs from "node:fs";
import path from "node:path";

export const CURRENT_SHAPE_TYPES = new Set(["tree", "logic", "state"]);

function plainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function packageRelativeSource(source, root) {
  if (!nonEmptyString(source) || path.isAbsolute(source)) return false;
  const normalized = source.replaceAll("\\", "/");
  if (normalized === "." || normalized.startsWith("../") || normalized.includes("/../")) return false;
  const absolute = path.resolve(root, normalized);
  return absolute.startsWith(path.resolve(root) + path.sep) && fs.existsSync(absolute);
}

export function currentShapeErrors(value, { owner = "record", root = null } = {}) {
  if (value === undefined || value === null) return [];
  const errors = [];
  const prefix = owner + ": current_shape";
  if (!plainObject(value)) return [prefix + " must be null or one inline JSON object."];

  const expectedKeys = ["type", "title", "source_refs", "lines"];
  const keys = Object.keys(value);
  for (const key of keys) {
    if (!expectedKeys.includes(key)) errors.push(prefix + " contains unsupported field " + key + ".");
  }
  for (const key of expectedKeys) {
    if (!Object.hasOwn(value, key)) errors.push(prefix + " is missing " + key + ".");
  }
  if (errors.length) return errors;

  if (!CURRENT_SHAPE_TYPES.has(value.type)) {
    errors.push(prefix + " type must be tree, logic, or state.");
  }
  if (!nonEmptyString(value.title) || value.title.length > 120 || /[\r\n]/.test(value.title || "")) {
    errors.push(prefix + " title must be one non-empty line of at most 120 characters.");
  }
  if (!Array.isArray(value.source_refs)
    || !value.source_refs.length
    || value.source_refs.some((source) => !nonEmptyString(source))
    || new Set(value.source_refs).size !== value.source_refs.length) {
    errors.push(prefix + " source_refs must be a unique non-empty array of package-relative paths.");
  } else if (root) {
    for (const source of value.source_refs) {
      if (!packageRelativeSource(source, root)) {
        errors.push(prefix + " source does not resolve inside Software Design: " + source);
      }
    }
  }
  const fence = String.fromCharCode(96).repeat(3);
  if (!Array.isArray(value.lines)
    || value.lines.length < 2
    || value.lines.length > 24
    || value.lines.some((line) => !nonEmptyString(line) || line.length > 240 || /[\r\n]/.test(line) || line.includes(fence))) {
    errors.push(prefix + " lines must contain 2 to 24 non-empty fence-free lines of at most 240 characters.");
  } else if (value.type === "logic" && !/^flowchart (?:TD|TB|LR|RL|BT)$/.test(value.lines[0])) {
    errors.push(prefix + " logic must start with a supported Mermaid flowchart direction.");
  } else if (value.type === "state" && value.lines[0] !== "stateDiagram-v2") {
    errors.push(prefix + " state must start with stateDiagram-v2.");
  } else if (value.type === "tree" && /^(?:flowchart |stateDiagram-v2)/.test(value.lines[0])) {
    errors.push(prefix + " tree must be plain-text hierarchy, not Mermaid syntax.");
  }
  return errors;
}

