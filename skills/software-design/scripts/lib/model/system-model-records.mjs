import fs from "node:fs";
import path from "node:path";
import { findFiles, readText } from "./files.mjs";
import { parseFrontmatter } from "./frontmatter.mjs";

export const SYSTEM_MODEL_ID_PATTERNS = {
  responsibility: /^SR-\d{3,}$/,
  flow: /^FLOW-\d{3,}$/,
  interface: /^IFACE-\d{3,}$/,
  state: /^STATE-\d{3,}$/,
  invariant: /^INV-\d{3,}$/,
  security: /^SEC-\d{3,}$/,
  scope: /^SCOPE-\d{3,}$/,
};

export const CONTRACT_FAMILIES = {
  interfaces: { type: "system-interface", field: "interface", pattern: SYSTEM_MODEL_ID_PATTERNS.interface },
  states: { type: "system-state", field: "state", pattern: SYSTEM_MODEL_ID_PATTERNS.state },
  invariants: { type: "system-invariant", field: "invariant", pattern: SYSTEM_MODEL_ID_PATTERNS.invariant },
  security: { type: "system-security-boundary", field: "security", pattern: SYSTEM_MODEL_ID_PATTERNS.security },
  scope: { type: "system-scope-boundary", field: "scope", pattern: SYSTEM_MODEL_ID_PATTERNS.scope },
};

export function parseIdList(raw, { fieldName = "identifier list", allowNone = true } = {}) {
  const value = String(raw ?? "").trim();
  if (!value || value === "None.") return allowNone ? [] : null;
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

export function markdownSection(text, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp("^## " + escaped + "\\s*$\\n([\\s\\S]*?)(?=^##\\s|$(?![\\s\\S]))", "m").exec(text);
  return match ? match[1].trim() : "";
}

export function recordTitle(text) {
  return /^#\s+(.+?)\s*$/m.exec(text)?.[1]?.trim() || "";
}

function record(filePath) {
  const text = readText(filePath);
  return { filePath, text, frontmatter: parseFrontmatter(text, filePath), title: recordTitle(text) };
}

function records(root, matcher) {
  return findFiles(root, matcher).map(record);
}

function parseScalar(raw, filePath, fieldName) {
  const value = raw.trim();
  if (/^(?:true|false|null|-?\d+)$/.test(value)) return JSON.parse(value);
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error(filePath + ": " + fieldName + " must use a JSON-compatible YAML value: " + error.message);
  }
}

export function parseLifecycle(filePath) {
  const text = readText(filePath);
  const result = {};
  for (const line of text.split("\n")) {
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    const field = /^([a-z][a-z0-9_]*):\s*(.*?)\s*$/.exec(line);
    if (!field) throw new Error(filePath + ": unsupported lifecycle YAML line: " + line.trim());
    if (Object.hasOwn(result, field[1])) throw new Error(filePath + ": duplicate lifecycle field " + field[1] + ".");
    result[field[1]] = parseScalar(field[2], filePath, field[1]);
  }
  return { filePath, text, value: result };
}

export function readSystemModel(rootPath) {
  const root = path.resolve(rootPath);
  const systemModelRoot = path.join(root, "system-model");
  const domainsRoot = path.join(systemModelRoot, "domains");
  const behaviorRoot = path.join(systemModelRoot, "behavior");
  const contractsRoot = path.join(systemModelRoot, "contracts");
  const architecturePath = path.join(systemModelRoot, "architecture.md");
  const lifecyclePath = path.join(behaviorRoot, "lifecycle.yaml");

  const domains = records(domainsRoot, (name) => name === "domain.md");
  const responsibilities = records(domainsRoot, (name) => /^sr-\d{3,}-.+\.md$/i.test(name));
  const flows = records(path.join(behaviorRoot, "flows"), (name) => /^flow-\d{3,}-.+\.md$/i.test(name));
  const contracts = Object.fromEntries(Object.keys(CONTRACT_FAMILIES).map((family) => [
    family,
    records(path.join(contractsRoot, family), (name) => name.endsWith(".md")),
  ]));

  return {
    root,
    systemModelRoot,
    domainsRoot,
    behaviorRoot,
    contractsRoot,
    architecturePath,
    lifecyclePath,
    architecture: fs.existsSync(architecturePath) ? record(architecturePath) : null,
    lifecycle: fs.existsSync(lifecyclePath) ? parseLifecycle(lifecyclePath) : null,
    domains,
    responsibilities,
    flows,
    contracts,
  };
}
