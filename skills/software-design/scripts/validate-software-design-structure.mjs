#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { markdownAnchorExists } from "./lib/model/markdown.mjs";
import { noncanonicalLayoutEntries } from "./lib/model/package-layout.mjs";
import { collectStructuredVerificationObligations } from "./lib/model/assurance-traceability.mjs";
import { validateUiUxDesign } from "./lib/validation/ui-ux-design.mjs";
import {
  CONTRACT_FAMILIES,
  parseIdList,
  readSystemModel,
  SYSTEM_MODEL_ID_PATTERNS,
} from "./lib/model/system-model-records.mjs";

function parseArgs(argv) {
  const args = { root: "software-design" };
  for (let index = 2; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--root") args.root = argv[++index];
    else throw new Error("Unknown argument: " + value);
  }
  return args;
}

function files(root, extension) {
  if (!fs.existsSync(root)) return [];
  const result = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) result.push(...files(target, extension));
    else if (target.endsWith(extension)) result.push(target);
  }
  return result;
}

function markdownLinkDestination(value) {
  const href = value.trim();
  const titled = /^(?:<([^>]+)>|(\S+))\s+(?:"[^"]*"|'[^']*'|\([^)]*\))$/.exec(href);
  if (titled) return titled[1] || titled[2];
  const bracketed = /^<([^>]+)>$/.exec(href);
  return bracketed ? bracketed[1] : href;
}

function markdownLinks(text) {
  return [...text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)].map((match) => markdownLinkDestination(match[1]));
}

function validateDiagramNavigation(root, errors) {
  const diagramsRoot = path.join(root, "diagrams");
  if (!fs.existsSync(diagramsRoot)) return;
  const readmePath = path.join(root, "README.md");
  const required = [
    [path.join(diagramsRoot, "runtime-architecture.html"), "diagrams/runtime-architecture.html", "Runtime Architecture"],
  ].filter(([filePath]) => fs.existsSync(filePath));
  if (!required.length) return;
  if (!fs.existsSync(readmePath)) {
    for (const [, relativePath] of required) errors.push(readmePath + ": required when " + relativePath + " exists.");
    return;
  }
  const links = markdownLinks(fs.readFileSync(readmePath, "utf8"));
  for (const [filePath, relativePath, label] of required) {
    const linked = links.some((href) => {
      const target = href.split("#")[0];
      return target && path.resolve(path.dirname(readmePath), target) === filePath;
    });
    if (!linked) errors.push(readmePath + ": must link directly to " + relativePath + " as " + label + ".");
  }
}

function validateUiUxNavigation(root, errors) {
  const specificationPath = path.join(root, "ui-ux", "specification.md");
  if (!fs.existsSync(specificationPath)) return;
  const readmePath = path.join(root, "README.md");
  if (!fs.existsSync(readmePath)) {
    errors.push(readmePath + ": required when ui-ux/specification.md exists.");
    return;
  }
  const linked = markdownLinks(fs.readFileSync(readmePath, "utf8")).some((href) => {
    const target = href.split("#")[0];
    return target && path.resolve(path.dirname(readmePath), target) === specificationPath;
  });
  if (!linked) errors.push(readmePath + ": must link directly to ui-ux/specification.md as UI/UX Design.");
}

function validateIdList(raw, pattern, known, label, filePath, errors, { allowExternal = false } = {}) {
  for (const id of parseIdList(raw)) {
    if (!pattern.test(id)) errors.push(filePath + ": " + label + " contains invalid " + id + ".");
    else if (!allowExternal && !known.has(id)) errors.push(filePath + ": " + label + " references missing " + id + ".");
  }
}

function validateRecordFilename(record, pattern, errors) {
  const id = record.frontmatter.id || "";
  const filename = path.basename(record.filePath).toLowerCase();
  if (!pattern.test(id) || !filename.startsWith(id.toLowerCase() + "-") || !filename.endsWith(".md")) {
    errors.push(record.filePath + ": filename must start with its valid lowercase identifier and a slug.");
  }
}

const MATERIAL_INTERACTION_KINDS = new Set([
  "callable",
  "state-observation",
  "event-or-message",
  "artifact-transfer",
  "manual-handoff",
  "external-system",
]);
const MATERIAL_INTERACTION_RISKS = new Set(["ordinary", "high"]);
const MATERIAL_INTERACTION_FIELDS = [
  "Kind",
  "Trigger or entry",
  "Input",
  "Output or observable result",
  "Access or authority",
  "Failure and recovery",
  "Risk",
  "Verification intent",
];

function strongField(block, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp("^\\*\\*" + escaped + ":\\*\\*\\s*(.+)$", "m").exec(block)?.[1]?.trim() || null;
}

function concreteInteractionText(value) {
  const normalized = String(value || "").trim().replace(/^`|`$/g, "").trim();
  return Boolean(normalized) && !/^(?:TBD\.?|<[^>]+>)$/i.test(normalized);
}

function validateMaterialInteractions(record, errors) {
  const text = record.text || "";
  const section = /^##\s+Material Interactions\s*$\n([\s\S]*?)(?=^##\s|$(?![\s\S]))/m.exec(text)?.[1]?.trim();
  if (section === undefined) { errors.push(record.filePath + ": missing ## Material Interactions."); return; }

  const entries = [...section.matchAll(/^###\s+(ACT-\d{3})\s+—\s+(.+)$/gm)].map((match, index, matches) => ({
    id: match[1],
    title: match[2].trim(),
    body: section.slice(match.index, matches[index + 1]?.index).trim(),
  }));
  const none = strongField(section, "Material interactions");
  if (!entries.length) {
    const noneMatch = /^`?None\.`?\s*(?:—|-)\s*(.+)$/.exec(none || "");
    if (!noneMatch || !concreteInteractionText(noneMatch[1])) {
      errors.push(record.filePath + ": Material Interactions must define at least one ACT-NNN entry or a concrete None. declaration.");
    }
    return;
  }
  if (none) errors.push(record.filePath + ": Material Interactions cannot combine a None. declaration with ACT entries.");
  if (new Set(entries.map((entry) => entry.id)).size !== entries.length) {
    errors.push(record.filePath + ": Material Interactions contains duplicate ACT identifiers.");
  }
  for (const entry of entries) {
    if (!concreteInteractionText(entry.title)) errors.push(record.filePath + ": " + entry.id + " requires a concrete name.");
    const stableAnchor = new RegExp("<a\\s+id=[\"']" + entry.id.toLowerCase() + "[\"']><\\/a>\\s*\\n###\\s+" + entry.id + "\\s+—", "i");
    if (!stableAnchor.test(section)) errors.push(record.filePath + ": " + entry.id + " requires a stable <a id=\"" + entry.id.toLowerCase() + "\"></a> anchor immediately before its heading.");
    for (const name of MATERIAL_INTERACTION_FIELDS) {
      if (!strongField(entry.body, name)) errors.push(record.filePath + ": " + entry.id + " is missing **" + name + ":**.");
    }
    const kind = /^`([^`]+)`$/.exec(strongField(entry.body, "Kind") || "")?.[1];
    if (!MATERIAL_INTERACTION_KINDS.has(kind)) errors.push(record.filePath + ": " + entry.id + " has an invalid Kind.");
    const risk = /^`([^`]+)`$/.exec(strongField(entry.body, "Risk") || "")?.[1];
    if (!MATERIAL_INTERACTION_RISKS.has(risk)) errors.push(record.filePath + ": " + entry.id + " has an invalid Risk.");
    for (const name of MATERIAL_INTERACTION_FIELDS.filter((field) => !["Kind", "Risk"].includes(field))) {
      const value = strongField(entry.body, name);
      if (!concreteInteractionText(value)) errors.push(record.filePath + ": " + entry.id + " **" + name + ":** contains placeholder content.");
    }
  }
}

function validateLifecycle(model, flowIds, contractIds, errors) {
  if (!model.lifecycle) return;
  const value = model.lifecycle.value;
  if (value.lifecycle_version !== 1 || typeof value.name !== "string" || !value.name.trim()) errors.push(model.lifecyclePath + ": lifecycle_version must be 1 and name must be non-empty.");
  if (!Array.isArray(value.stages) || !value.stages.length) errors.push(model.lifecyclePath + ": stages must be a non-empty array.");
  if (!Array.isArray(value.terminal_outcomes) || !value.terminal_outcomes.length) errors.push(model.lifecyclePath + ": terminal_outcomes must be a non-empty array.");
  if (!Array.isArray(value.stages) || !Array.isArray(value.terminal_outcomes)) return;

  const stages = new Map();
  const outcomes = new Set();
  for (const outcome of value.terminal_outcomes) {
    if (!outcome || !/^OUTCOME-\d{3,}$/.test(outcome.id || "") || !outcome.name || !outcome.meaning) errors.push(model.lifecyclePath + ": every terminal outcome needs OUTCOME-xxx id, name, and meaning.");
    else if (outcomes.has(outcome.id)) errors.push(model.lifecyclePath + ": duplicate terminal outcome " + outcome.id + ".");
    else outcomes.add(outcome.id);
  }
  for (const stage of value.stages) {
    if (!stage || !/^STAGE-\d{3,}$/.test(stage.id || "") || !stage.name) {
      errors.push(model.lifecyclePath + ": every stage needs STAGE-xxx id and name.");
      continue;
    }
    if (stages.has(stage.id)) errors.push(model.lifecyclePath + ": duplicate stage " + stage.id + ".");
    else stages.set(stage.id, stage);
    if (!flowIds.has(stage.flow)) errors.push(model.lifecyclePath + ": " + stage.id + " references missing flow " + String(stage.flow) + ".");
    if (!Array.isArray(stage.next)) errors.push(model.lifecyclePath + ": " + stage.id + " next must be an array.");
  }
  if (!stages.has(value.initial_stage)) errors.push(model.lifecyclePath + ": initial_stage does not resolve.");
  for (const stage of stages.values()) {
    const next = Array.isArray(stage.next) ? stage.next : [];
    for (const id of next) if (!stages.has(id)) errors.push(model.lifecyclePath + ": " + stage.id + " references missing next stage " + id + ".");
    if (stage.terminal_outcome !== null && stage.terminal_outcome !== undefined && !outcomes.has(stage.terminal_outcome)) errors.push(model.lifecyclePath + ": " + stage.id + " references missing terminal outcome " + stage.terminal_outcome + ".");
    const terminal = stage.terminal_outcome !== null && stage.terminal_outcome !== undefined;
    if ((next.length > 0) === terminal) errors.push(model.lifecyclePath + ": " + stage.id + " must have next stages or one terminal_outcome, not both or neither.");
  }

  const terminalReachable = new Set([...stages.values()].filter((stage) => stage.terminal_outcome).map((stage) => stage.id));
  let changed = true;
  while (changed) {
    changed = false;
    for (const stage of stages.values()) {
      if (!terminalReachable.has(stage.id) && (stage.next || []).some((id) => terminalReachable.has(id))) {
        terminalReachable.add(stage.id);
        changed = true;
      }
    }
  }
  for (const id of stages.keys()) if (!terminalReachable.has(id)) errors.push(model.lifecyclePath + ": " + id + " cannot reach a terminal outcome.");
  validateIdList((value.invariants || []).join(", "), SYSTEM_MODEL_ID_PATTERNS.invariant, contractIds, "invariants", model.lifecyclePath, errors);
}

function validateSystemModel(root, errors) {
  const model = readSystemModel(root);
  if (!model.architecture) {
    errors.push("Missing system-model/architecture.md.");
    return { model, responsibilityCount: 0, domainCount: 0 };
  }
  const architecture = model.architecture.frontmatter;
  if (architecture.type !== "system-architecture") errors.push(model.architecturePath + ": type must be system-architecture.");

  const domainBySlug = new Map();
  const responsibilityById = new Map();
  const flowById = new Map();
  const contractById = new Map();
  for (const domain of model.domains) {
    const slug = path.basename(path.dirname(domain.filePath));
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) errors.push(domain.filePath + ": invalid domain slug.");
    if (domain.frontmatter.type !== "system-domain" || domain.frontmatter.id !== "DOMAIN-" + slug || !domain.frontmatter.name) errors.push(domain.filePath + ": domain type, id, name, and folder slug must agree.");
    if (domainBySlug.has(slug)) errors.push("Duplicate System Domain " + slug + ".");
    else domainBySlug.set(slug, domain);
  }
  const architectureDomains = parseIdList(architecture.domains, { allowNone: false });
  if (!architectureDomains || new Set(architectureDomains).size !== architectureDomains.length) errors.push(model.architecturePath + ": domains must be a non-empty unique slug list.");
  else {
    for (const slug of architectureDomains) if (!domainBySlug.has(slug)) errors.push(model.architecturePath + ": domains references missing " + slug + ".");
    for (const slug of domainBySlug.keys()) if (!architectureDomains.includes(slug)) errors.push(model.architecturePath + ": domains omits " + slug + ".");
  }

  for (const record of model.responsibilities) {
    validateRecordFilename(record, SYSTEM_MODEL_ID_PATTERNS.responsibility, errors);
    const domainSlug = path.basename(path.dirname(path.dirname(record.filePath)));
    if (record.frontmatter.type !== "system-responsibility" || record.frontmatter.domain !== domainSlug || !domainBySlug.has(domainSlug)) errors.push(record.filePath + ": responsibility type/domain must match its canonical domain folder.");
    if (!record.frontmatter.name) errors.push(record.filePath + ": responsibility name is required.");
    if (responsibilityById.has(record.frontmatter.id)) errors.push("Duplicate System Responsibility " + record.frontmatter.id + ".");
    else responsibilityById.set(record.frontmatter.id, record);
  }

  for (const [slug, domain] of domainBySlug) {
    const owned = parseIdList(domain.frontmatter.responsibilities);
    if (!owned.length || new Set(owned).size !== owned.length) errors.push(domain.filePath + ": responsibilities must be a non-empty unique SR list.");
    for (const id of owned) {
      const record = responsibilityById.get(id);
      if (!record) errors.push(domain.filePath + ": responsibilities references missing " + id + ".");
      else if (record.frontmatter.domain !== slug) errors.push(domain.filePath + ": " + id + " belongs to another domain.");
    }
    validateIdList(domain.frontmatter.external_responsibilities, SYSTEM_MODEL_ID_PATTERNS.responsibility, responsibilityById, "external_responsibilities", domain.filePath, errors);
  }
  for (const [id, record] of responsibilityById) {
    const domain = domainBySlug.get(record.frontmatter.domain);
    if (domain && !parseIdList(domain.frontmatter.responsibilities).includes(id)) errors.push(record.filePath + ": owning domain does not reciprocally list " + id + ".");
  }

  for (const flow of model.flows) {
    validateRecordFilename(flow, SYSTEM_MODEL_ID_PATTERNS.flow, errors);
    if (flow.frontmatter.type !== "system-flow" || !flow.frontmatter.name) errors.push(flow.filePath + ": flow type and name are required.");
    if (flowById.has(flow.frontmatter.id)) errors.push("Duplicate flow " + flow.frontmatter.id + ".");
    else flowById.set(flow.frontmatter.id, flow);
  }
  for (const [family, records] of Object.entries(model.contracts)) {
    const definition = CONTRACT_FAMILIES[family];
    for (const record of records) {
      validateRecordFilename(record, definition.pattern, errors);
      if (record.frontmatter.type !== definition.type || !record.frontmatter.name) errors.push(record.filePath + ": contract type and name must match the " + family + " family.");
      if (contractById.has(record.frontmatter.id)) errors.push("Duplicate contract " + record.frontmatter.id + ".");
      else contractById.set(record.frontmatter.id, record);
    }
  }

  const responsibilityIds = new Set(responsibilityById.keys());
  const flowIds = new Set(flowById.keys());
  const contractIds = new Set(contractById.keys());
  for (const record of responsibilityById.values()) {
    validateIdList(record.frontmatter.depends_on, SYSTEM_MODEL_ID_PATTERNS.responsibility, responsibilityIds, "depends_on", record.filePath, errors);
    validateIdList(record.frontmatter.participates_in, SYSTEM_MODEL_ID_PATTERNS.flow, flowIds, "participates_in", record.filePath, errors);
    for (const id of parseIdList(record.frontmatter.realized_by)) if (!/^BU-\d{3,}$/.test(id)) errors.push(record.filePath + ": realized_by contains invalid " + id + ".");
  }
  for (const record of flowById.values()) {
    validateIdList(record.frontmatter.responsibilities, SYSTEM_MODEL_ID_PATTERNS.responsibility, responsibilityIds, "responsibilities", record.filePath, errors);
    for (const id of parseIdList(record.frontmatter.contracts)) if (!contractIds.has(id)) errors.push(record.filePath + ": contracts references missing " + id + ".");
  }
  for (const [family, records] of Object.entries(model.contracts)) {
    for (const record of records) {
      const meta = record.frontmatter;
      const responsibilityFields = family === "interfaces" ? ["producers", "consumers"] : family === "states" ? ["authority", "participants"] : ["responsibilities"];
      for (const field of responsibilityFields) validateIdList(meta[field], SYSTEM_MODEL_ID_PATTERNS.responsibility, responsibilityIds, field, record.filePath, errors);
      validateIdList(meta.flows, SYSTEM_MODEL_ID_PATTERNS.flow, flowIds, "flows", record.filePath, errors);
      if (meta.related_contracts !== undefined) {
        for (const id of parseIdList(meta.related_contracts)) if (!contractIds.has(id)) errors.push(record.filePath + ": related_contracts references missing " + id + ".");
      }
      if (family === "scope" && meta.decision !== undefined) {
        for (const id of parseIdList(meta.decision)) if (!/^TD-\d{3}$/.test(id)) errors.push(record.filePath + ": decision contains invalid " + id + ".");
      }
      if (family === "interfaces") validateMaterialInteractions(record, errors);
    }
  }
  const obligations = collectStructuredVerificationObligations(model, errors);
  if (obligations.size && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(architecture.assurance_id || ""))) {
    errors.push(model.architecturePath + ": assurance_id must be a stable lowercase slug when structured Verification Obligations exist.");
  }
  validateIdList(architecture.global_invariants, SYSTEM_MODEL_ID_PATTERNS.invariant, contractIds, "global_invariants", model.architecturePath, errors);
  validateIdList(architecture.security_boundaries, SYSTEM_MODEL_ID_PATTERNS.security, contractIds, "security_boundaries", model.architecturePath, errors);
  validateIdList(architecture.scope_boundaries, SYSTEM_MODEL_ID_PATTERNS.scope, contractIds, "scope_boundaries", model.architecturePath, errors);
  validateLifecycle(model, flowIds, contractIds, errors);
  return { model, responsibilityCount: responsibilityById.size, domainCount: domainBySlug.size };
}

function validateLocalLinks(root, errors) {
  for (const filePath of files(root, ".md")) {
    const text = fs.readFileSync(filePath, "utf8");
    for (const href of markdownLinks(text)) {
      if (/^(?:https?:|mailto:|#)/.test(href)) continue;
      const [target, fragment = ""] = href.split("#", 2);
      if (!target) continue;
      const absolute = path.resolve(path.dirname(filePath), target);
      if (!fs.existsSync(absolute)) errors.push(filePath + ": broken local link " + href);
      else if (fragment && !markdownAnchorExists(absolute, fragment)) errors.push(filePath + ": broken local link anchor " + href);
    }
  }
}

export function validateSoftwareDesignStructure(rootPath) {
  const root = path.resolve(rootPath);
  const errors = [];
  const noncanonical = noncanonicalLayoutEntries(root);
  if (noncanonical.length) errors.push("Software Design contains entries outside the canonical package layout: " + noncanonical.join(", ") + ".");
  if (errors.length) return { errors, responsibilityCount: 0, domainCount: 0 };

  const result = validateSystemModel(root, errors);
  errors.push(...validateUiUxDesign(root).errors);
  validateLocalLinks(root, errors);
  validateDiagramNavigation(root, errors);
  validateUiUxNavigation(root, errors);
  return { errors, responsibilityCount: result.responsibilityCount, domainCount: result.domainCount };
}

function main() {
  const args = parseArgs(process.argv);
  const result = validateSoftwareDesignStructure(args.root);
  if (result.errors.length) throw new Error(result.errors.join("\n"));
  console.log("Verified canonical system-model structure: " + result.responsibilityCount + " System Responsibilities across " + result.domainCount + " System Domains.");
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
