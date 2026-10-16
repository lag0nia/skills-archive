#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const scripts = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..", "scripts");
const validator = path.join(scripts, "validate-build-unit-dependency-map.mjs");
const generator = path.join(scripts, "generate-visuals.mjs");

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function run(root) {
  return spawnSync(process.execPath, [validator, "--root", root], { encoding: "utf8" });
}

function unitRecord(id, name, family, dependencies, location) {
  return [
    "---",
    "type: build-unit",
    "id: " + id,
    "name: " + name,
    "kind: library",
    "responsibility_family: " + family,
    "source_responsibilities: \"SR-001\"",
    "depends_on_build_units: \"" + dependencies + "\"",
    "repository: \"REPO-001\"",
    "code_path: \"" + location + "\"",
    "repository_disposition: \"None.\"",
    "technical_constraints: \"None.\"",
    "---",
    "",
    "# " + id + " — " + name,
    "",
    "This unit produces the independently testable artifact at `" + location + "`.",
    "",
    "## Artifact And Code Location",
    location,
    "",
  ].join("\n");
}

function fixture({ generate = true } = {}) {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "build-unit-dependency-map-"));
  const root = path.join(workspace, "software-design");
  const buildRoot = path.join(root, "build");
  write(path.join(root, "system-model", "architecture.md"), "---\ntype: system-architecture\ndesign_format: 2\n---\n\n# System Architecture\n");
  const units = [
    ["BU-001", "Core", "Shared foundation", "None.", "packages/core"],
    ["BU-002", "Contract", "Base", "BU-001", "contracts/base"],
    ["BU-003", "Application", "Application", "BU-001, BU-002", "apps/web"],
    ["BU-004", "Worker", "Operations", "BU-001", "workers/observe"],
  ];
  for (const [id, name, family, dependencies, location] of units) {
    write(unitPath(root, id, name), unitRecord(id, name, family, dependencies, location));
  }
  write(path.join(root, "README.md"), "# Software Design\n\n- [Visuals](./visuals/index.html)\n- [Build Unit Dependency Map](./visuals/maps/build-unit-dependencies.html)\n");
  write(path.join(buildRoot, "README.md"), "# Build\n\n- [Build Unit Dependency Map](../visuals/maps/build-unit-dependencies.html)\n");
  if (generate) regenerate(root);
  return { workspace, root };
}

function unitPath(root, id, name) {
  return path.join(root, "build", "units", id.toLowerCase() + "-" + name.toLowerCase() + ".md");
}

function regenerate(root) {
  const generated = spawnSync(process.execPath, [generator, "--root", root], { encoding: "utf8" });
  assert.equal(generated.status, 0, generated.stderr);
}

function scenario(context, options) {
  const result = fixture(options);
  context.after(() => fs.rmSync(result.workspace, { recursive: true, force: true }));
  return result;
}

test("validates exact unit coverage of the generated HTML map with reduced edges and dependency rows", (context) => {
  const { root } = scenario(context);
  const result = run(root);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /4 units, 3 reduced dependency edges, 3 topological rows/);
  const map = fs.readFileSync(path.join(root, "visuals", "maps", "build-unit-dependencies.html"), "utf8");
  for (const id of ["BU-001", "BU-002", "BU-003", "BU-004"]) assert.match(map, new RegExp(id));
});

test("requires the generated map once two or more build units exist", (context) => {
  const { root } = scenario(context, { generate: false });
  const result = run(root);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Missing visual source manifest/);
});

test("a single Build Unit needs no dependency map", (context) => {
  const { root } = scenario(context, { generate: false });
  for (const [id, name] of [["BU-002", "Contract"], ["BU-003", "Application"], ["BU-004", "Worker"]]) fs.rmSync(unitPath(root, id, name));
  const result = run(root);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /no dependency map required/);
});

test("rejects a map that is stale against a changed Build Unit dependency", (context) => {
  const { root } = scenario(context);
  write(unitPath(root, "BU-004", "Worker"), unitRecord("BU-004", "Worker", "Operations", "BU-002", "workers/observe"));
  const result = run(root);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Stale source\(s\): build\/units\/bu-004-worker\.md/);
  regenerate(root);
  assert.equal(run(root).status, 0);
});

test("rejects a hand-edited map output", (context) => {
  const { root } = scenario(context);
  const mapPath = path.join(root, "visuals", "maps", "build-unit-dependencies.html");
  fs.writeFileSync(mapPath, fs.readFileSync(mapPath, "utf8").replace("BU-004", "BU-009"));
  const result = run(root);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Stale or modified output: maps\/build-unit-dependencies\.html/);
});

test("rejects unknown, self and duplicate Build Unit dependencies", (context) => {
  const { root } = scenario(context, { generate: false });
  write(unitPath(root, "BU-004", "Worker"), unitRecord("BU-004", "Worker", "Operations", "BU-009", "workers/observe"));
  write(unitPath(root, "BU-002", "Contract"), unitRecord("BU-002", "Contract", "Base", "BU-002", "contracts/base"));
  write(unitPath(root, "BU-003", "Application"), unitRecord("BU-003", "Application", "Application", "BU-001, BU-001", "apps/web"));
  const result = run(root);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /BU-004 depends on unknown build unit BU-009\./);
  assert.match(result.stderr, /BU-002 cannot depend on itself\./);
  assert.match(result.stderr, /BU-003 has invalid or duplicate depends_on_build_units values\./);
  assert.doesNotMatch(result.stderr, /^\s+at /m);
});

test("requires direct links from both README entry points", (context) => {
  const { root } = scenario(context);
  fs.writeFileSync(path.join(root, "build", "README.md"), "# Build\n");
  fs.writeFileSync(path.join(root, "README.md"), "# Software Design\n\n- [Visuals](./visuals/index.html)\n");
  const result = run(root);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /- README\.md must directly link visuals\/maps\/build-unit-dependencies\.html\./);
  assert.match(result.stderr, /- build\/README\.md must directly link visuals\/maps\/build-unit-dependencies\.html\./);
});
