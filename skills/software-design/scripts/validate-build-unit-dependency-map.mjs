#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { readText as read } from "./lib/model/files.mjs";
import { parseFrontmatter } from "./lib/model/frontmatter.mjs";
import { findBuildUnitRecords } from "./lib/model/build-unit-records.mjs";
import { buildLayout } from "./lib/model/build-layout.mjs";

const BUILD_UNIT_PATTERN = /^BU-\d{3,}$/;
const CARD_TITLE_PATTERN = /^##\s+\[(BU-\d{3,})\s+—\s+([^\]]+)\]\(([^)]+)\)\s*$/m;
const MAP_PATH = path.join("diagrams", "build-unit-dependency-map.canvas");

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

function parseDependencies(raw) {
  const normalized = String(raw || "").replace(/`/g, "").trim();
  if (/^none\.?$/i.test(normalized)) return [];
  const expanded = normalized.replace(/BU-(\d{3,})\s+(?:through|to)\s+BU-(\d{3,})/gi, (_match, start, end) => {
    const first = Number(start);
    const last = Number(end);
    if (!Number.isInteger(first) || !Number.isInteger(last) || first > last || last - first > 999) return _match;
    const width = Math.max(start.length, end.length, 3);
    return Array.from({ length: last - first + 1 }, (_value, offset) => "BU-" + String(first + offset).padStart(width, "0")).join(", ");
  });
  return [...expanded.matchAll(/BU-\d{3,}/g)].map((match) => match[0]);
}

function cleanInline(value) {
  return String(value || "")
    .replace(/`/g, "")
    .replace(/\*\*/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();
}

function normalizedText(value) {
  return cleanInline(value)
    .toLowerCase()
    .replace(/[^a-z0-9/._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function meaningful(value) {
  const normalized = cleanInline(value);
  return Boolean(normalized) && !/^(?:tbd\.?|none\.?|depends on)$/i.test(normalized);
}

function linkTargets(markdown, baseDir) {
  return [...String(markdown || "").matchAll(/!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)]
    .map((match) => match[1].replace(/^<|>$/g, ""))
    .filter((target) => !/^(?:[a-z]+:|\/\/)/i.test(target))
    .map((target) => path.resolve(baseDir, target.split("#", 1)[0] || "."));
}

function centerX(node) {
  return Number(node.x) + Number(node.width) / 2;
}

function centerY(node) {
  return Number(node.y) + Number(node.height) / 2;
}

function sameSet(left, right) {
  const normalize = (values) => [...new Set(values)].sort();
  return JSON.stringify(normalize(left)) === JSON.stringify(normalize(right));
}

function buildUnitIndex(unitsRoot, errors) {
  const result = new Map();
  for (const { filePath, content } of findBuildUnitRecords(unitsRoot, (name) => /^bu-\d{3,}-.+\.md$/i.test(name))) {
    try {
      const meta = parseFrontmatter(content, filePath);
      const id = meta.id;
      const dependencies = parseDependencies(meta.depends_on_build_units);
      if (meta.type !== "build-unit") errors.push(path.basename(filePath) + " must use type build-unit.");
      if (!BUILD_UNIT_PATTERN.test(id || "")) errors.push(path.basename(filePath) + " is missing a valid BU-xxx id.");
      if (!meaningful(meta.name)) errors.push((id || path.basename(filePath)) + " requires a meaningful name.");
      if (!meaningful(meta.responsibility_family)) {
        errors.push((id || path.basename(filePath)) + " requires responsibility_family frontmatter for the dependency map.");
      }
      if (dependencies.some((dependency) => !BUILD_UNIT_PATTERN.test(dependency)) || new Set(dependencies).size !== dependencies.length) {
        errors.push((id || path.basename(filePath)) + " has invalid or duplicate depends_on_build_units values.");
      }
      if (id) {
        if (result.has(id)) errors.push("Duplicate build-unit identifier: " + id + ".");
      else result.set(id, {
          id,
          name: meta.name,
          family: meta.responsibility_family,
          dependencies,
          codePath: String(meta.code_path || "").trim(),
          filePath: path.resolve(filePath),
        });
      }
    } catch (error) {
      errors.push(error.message);
    }
  }
  for (const unit of result.values()) {
    for (const dependency of unit.dependencies) {
      if (dependency === unit.id) errors.push(unit.id + " cannot depend on itself.");
      else if (!result.has(dependency)) errors.push(unit.id + " depends on unknown build unit " + dependency + ".");
    }
  }
  return result;
}

function dependencyEdges(units) {
  const edges = new Set();
  for (const unit of units.values()) {
    for (const dependency of unit.dependencies) edges.add(dependency + "->" + unit.id);
  }
  return edges;
}

function alternatePathExists(edges, start, target, skipped) {
  const adjacency = new Map();
  for (const edge of edges) {
    if (edge === skipped) continue;
    const [from, to] = edge.split("->");
    if (!adjacency.has(from)) adjacency.set(from, []);
    adjacency.get(from).push(to);
  }
  const queue = [start];
  const seen = new Set([start]);
  while (queue.length) {
    const current = queue.shift();
    for (const next of adjacency.get(current) || []) {
      if (next === target) return true;
      if (!seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  return false;
}

function transitiveReduction(units) {
  const edges = dependencyEdges(units);
  return new Set([...edges].filter((edge) => {
    const [from, to] = edge.split("->");
    return !alternatePathExists(edges, from, to, edge);
  }));
}

function topologicalLevels(units, errors) {
  const levels = new Map();
  const visiting = new Set();
  const visit = (id) => {
    if (levels.has(id)) return levels.get(id);
    if (visiting.has(id)) {
      errors.push("Build-unit dependencies contain a cycle involving " + id + ".");
      return 0;
    }
    visiting.add(id);
    const dependencies = units.get(id)?.dependencies || [];
    const level = dependencies.length ? Math.max(...dependencies.map((dependency) => visit(dependency) + 1)) : 0;
    visiting.delete(id);
    levels.set(id, level);
    return level;
  };
  for (const id of units.keys()) visit(id);
  return levels;
}

function validateReadmeLink(filePath, targetPath, label, errors) {
  if (!fs.existsSync(filePath)) {
    errors.push("Missing " + label + ".");
    return;
  }
  if (!linkTargets(read(filePath), path.dirname(filePath)).includes(path.resolve(targetPath))) {
    errors.push(label + " must directly link diagrams/build-unit-dependency-map.canvas.");
  }
}

function validate(root) {
  const errors = [];
  const layout = buildLayout(root);
  const buildRoot = layout.buildRoot;
  const unitsRoot = layout.unitsRoot;
  if (!fs.existsSync(unitsRoot)) return { errors, skipped: true, units: 0, edges: 0, rows: 0 };

  const units = buildUnitIndex(unitsRoot, errors);
  const canvasPath = path.join(root, MAP_PATH);
  if (units.size < 2) {
    if (fs.existsSync(canvasPath)) errors.push("Build Unit Dependency Map requires at least two canonical build units.");
    return { errors, skipped: !fs.existsSync(canvasPath), units: units.size, edges: 0, rows: units.size };
  }
  if (!fs.existsSync(canvasPath)) {
    errors.push("Stage 8 Build Design with at least two build units requires diagrams/build-unit-dependency-map.canvas.");
    return { errors, skipped: false, units: units.size, edges: 0, rows: 0 };
  }

  validateReadmeLink(path.join(root, "README.md"), canvasPath, "Software Design README", errors);
  validateReadmeLink(path.join(buildRoot, "README.md"), canvasPath, "Build README", errors);

  let canvas;
  try {
    canvas = JSON.parse(read(canvasPath));
  } catch (error) {
    errors.push("Invalid Build Unit Dependency Map JSON: " + error.message);
    return { errors, skipped: false, units: units.size, edges: 0, rows: 0 };
  }
  const nodes = Array.isArray(canvas.nodes) ? canvas.nodes : [];
  const edges = Array.isArray(canvas.edges) ? canvas.edges : [];
  if (nodes.some((node) => node.type === "group")) {
    errors.push("Build Unit Dependency Map must not use groups; topological rows carry the dependency structure.");
  }
  const nodeIds = nodes.map((node) => node.id);
  if (nodeIds.some((id) => !id) || new Set(nodeIds).size !== nodeIds.length) {
    errors.push("Every Canvas node requires one unique id.");
  }

  const textNodes = nodes.filter((node) => node.type === "text");
  const introNodes = textNodes.filter((node) => /^#\s+Build Unit Dependency Map\b/im.test(String(node.text || "")));
  const legendNodes = textNodes.filter((node) => /^##\s+(?:Color key|Legend)\b/im.test(String(node.text || "")));
  if (introNodes.length !== 1) errors.push("Build Unit Dependency Map requires exactly one brief intro card.");
  if (legendNodes.length !== 1) errors.push("Build Unit Dependency Map requires exactly one responsibility-family legend card.");
  const intro = introNodes[0];
  const legend = legendNodes[0];
  if (intro) {
    const text = String(intro.text || "");
    if (/preview/i.test(text)) errors.push("Canonical Build Unit Dependency Map title must not be marked preview.");
    if (!/build dependenc/i.test(text) || !/(?:not|rather than)[^.\n]*(?:runtime|lifecycle|execution|the order)/i.test(text)) {
      errors.push("Intro must distinguish build dependencies from runtime, lifecycle, or execution order.");
    }
  }
  if (legend) {
    const text = String(legend.text || "");
    if (!/responsibilit/i.test(text) || !/(?:not|does not)[^.\n]*(?:readiness|priority)/i.test(text)) {
      errors.push("Legend must say color encodes responsibility rather than readiness or priority.");
    }
  }
  if (intro && legend) {
    if (Math.abs(centerX(intro) - centerX(legend)) > 80) errors.push("Legend must be centered beneath the intro card.");
    if (!intro.color || intro.color !== legend.color) errors.push("Intro and legend must use the same neutral color.");
  }

  const cards = new Map();
  const canvasNodeToUnit = new Map();
  const familyColors = new Map();
  const colorFamilies = new Map();
  for (const node of textNodes) {
    const text = String(node.text || "");
    const title = CARD_TITLE_PATTERN.exec(text);
    if (!title) continue;
    const [, id, name, linkTarget] = title;
    if (cards.has(id)) {
      errors.push("Duplicate build-unit card: " + id + ".");
      continue;
    }
    const unit = units.get(id);
    if (!unit) {
      errors.push("Stale build-unit card has no canonical record: " + id + ".");
      continue;
    }
    cards.set(id, node);
    canvasNodeToUnit.set(node.id, id);
    if (cleanInline(name) !== cleanInline(unit.name)) errors.push(id + " card name must match its canonical build-unit name.");
    const resolvedLink = path.resolve(path.dirname(canvasPath), linkTarget.split("#", 1)[0]);
    if (resolvedLink !== unit.filePath) errors.push(id + " card title must link its canonical build-unit record.");

    const domain = /\*\*(?:Domain|Responsibility family):\*\*\s*([^\n]+)/i.exec(text)?.[1];
    const family = cleanInline(domain);
    if (!family || family.toLowerCase() !== cleanInline(unit.family).toLowerCase()) {
      errors.push(id + " card responsibility family must match responsibility_family frontmatter.");
    }
    if (!node.color) errors.push(id + " card requires a responsibility-family color.");
    if (family && node.color) {
      const familyKey = family.toLowerCase();
      if (familyColors.has(familyKey) && familyColors.get(familyKey) !== node.color) {
        errors.push("Responsibility family " + family + " uses inconsistent colors.");
      }
      familyColors.set(familyKey, node.color);
      if (colorFamilies.has(node.color) && colorFamilies.get(node.color) !== familyKey) {
        errors.push("Responsibility families " + colorFamilies.get(node.color) + " and " + familyKey + " must not share one color.");
      }
      colorFamilies.set(node.color, familyKey);
    }

    const codeLocation = /`([^`\n]+)`/.exec(text)?.[1]?.trim();
    if (!meaningful(codeLocation)) errors.push(id + " card requires a concrete code location.");
    else if (!meaningful(unit.codePath) || normalizedText(unit.codePath) !== normalizedText(codeLocation)) {
      errors.push(id + " card code location must match its canonical code_path.");
    }

    const requiresMatch = /\*\*Requires:\*\*\s*([^\n]+)/i.exec(text);
    if (!requiresMatch) errors.push(id + " card requires an explicit Requires line.");
    else {
      const listed = parseDependencies(requiresMatch[1]);
      if (!sameSet(listed, unit.dependencies)) errors.push(id + " card Requires list must exactly cover canonical dependencies.");
      const purpose = text.slice(requiresMatch.index + requiresMatch[0].length).trim();
      if (cleanInline(purpose).length < 40 || cleanInline(purpose).split(/\s+/).length < 8) {
        errors.push(id + " card requires one useful plain-language purpose paragraph.");
      }
    }
    if (/(?:TICKET|TD)-\d{3,}|\*\*(?:Tickets|Readiness|Modules|Responsibilities|Lifecycle):\*\*|\bSR-\d{3,}\b/.test(text)) {
      errors.push(id + " card mixes tickets, readiness, modules, System Responsibilities, or lifecycle content into the dependency grammar.");
    }
  }
  for (const id of units.keys()) if (!cards.has(id)) errors.push("Missing build-unit card: " + id + ".");
  if (intro?.color && colorFamilies.has(intro.color)) errors.push("Intro and legend neutral color must not encode a responsibility family.");

  const expectedEdges = transitiveReduction(units);
  const visibleEdges = new Set();
  for (const edge of edges) {
    const from = canvasNodeToUnit.get(edge.fromNode);
    const to = canvasNodeToUnit.get(edge.toNode);
    if (!from || !to) {
      errors.push("Every dependency arrow must connect two build-unit cards: " + (edge.id || "unnamed edge") + ".");
      continue;
    }
    const key = from + "->" + to;
    if (visibleEdges.has(key)) errors.push("Duplicate visible dependency arrow: " + key + ".");
    visibleEdges.add(key);
    if (edge.toEnd !== "arrow" || edge.fromEnd === "arrow") {
      errors.push(key + " must point from prerequisite to dependent.");
    }
    if (!meaningful(edge.label)) errors.push(key + " requires a concrete interface, artifact, or capability label.");
    if (/^depends on$/i.test(cleanInline(edge.label))) errors.push(key + " uses the forbidden generic depends-on label.");
    const fromNode = cards.get(from);
    const toNode = cards.get(to);
    if (fromNode && toNode && centerY(fromNode) >= centerY(toNode)) {
      errors.push(key + " must point downward from an earlier topological row.");
    }
  }
  for (const edge of expectedEdges) if (!visibleEdges.has(edge)) errors.push("Missing reduced dependency arrow: " + edge + ".");
  for (const edge of visibleEdges) if (!expectedEdges.has(edge)) errors.push("Unexpected or transitively redundant dependency arrow: " + edge + ".");

  const levelErrors = [];
  const levels = topologicalLevels(units, levelErrors);
  errors.push(...levelErrors);
  const rows = new Map();
  for (const [id, level] of levels) {
    const node = cards.get(id);
    if (!node || !Number.isFinite(Number(node.y))) continue;
    if (!rows.has(level)) rows.set(level, []);
    rows.get(level).push(Number(node.y));
  }
  for (const [level, positions] of rows) {
    if (positions.length > 1 && Math.max(...positions) - Math.min(...positions) > 160) {
      errors.push("Topological row " + level + " is vertically misaligned; equal-depth units must share one row.");
    }
  }

  return { errors, skipped: false, units: units.size, edges: expectedEdges.size, rows: rows.size };
}

try {
  const args = parseArgs(process.argv);
  const result = validate(path.resolve(args.root));
  if (result.errors.length) {
    console.error("Build Unit Dependency Map validation failed:");
    for (const error of result.errors) console.error("- " + error);
    process.exitCode = 1;
  } else if (result.skipped) {
    console.log("No nontrivial Stage 8 Build Design; no dependency map required.");
  } else {
    console.log("Verified Build Unit Dependency Map: " + result.units + " units, " + result.edges + " reduced dependency edges, " + result.rows + " topological rows.");
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
