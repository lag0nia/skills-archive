#!/usr/bin/env node

import path from "node:path";
import { readText as read } from "./lib/model/files.mjs";
import { parseFrontmatter } from "./lib/model/frontmatter.mjs";
import { findBuildUnitRecords } from "./lib/model/build-unit-records.mjs";
import { buildLayout } from "./lib/model/build-layout.mjs";
import { currentFormatError } from "./lib/model/package-format.mjs";
import { generateVisuals, buildModel, dependencyGraph } from "./generate-visuals.mjs";

const BUILD_UNIT_PATTERN = /^BU-\d{3,}$/;

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
      else result.set(id, { id, dependencies });
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

function validate(root) {
  const formatError = currentFormatError(root);
  if (formatError) return { errors: [formatError], skipped: false, units: 0, edges: 0, rows: 0 };
  const errors = [];
  try {
    const units = buildUnitIndex(buildLayout(root).unitsRoot, errors);
    const model = buildModel(root);
    const graph = dependencyGraph(model.units);
    if (units.size < 2) return { errors, skipped: true, units: units.size, edges: 0, rows: units.size };
    generateVisuals(root, { check: true });
    const target = path.resolve(root, "visuals/maps/build-unit-dependencies.html");
    for (const file of ["README.md", "build/README.md"]) if (!linkTargets(read(path.join(root, file)), path.dirname(path.join(root, file))).includes(target)) errors.push(file + " must directly link visuals/maps/build-unit-dependencies.html.");
    return { errors, skipped: false, units: units.size, edges: graph.edges.length, rows: Math.max(...Object.values(graph.levels)) + 1 };
  } catch (error) { return { errors: [...errors, error.message], skipped: false, units: 0, edges: 0, rows: 0 }; }
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
