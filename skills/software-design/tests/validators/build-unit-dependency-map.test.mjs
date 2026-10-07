#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const validator = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..", "scripts", "validate-build-unit-dependency-map.mjs");

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

function card(id, name, family, dependencies, location, x, y, color) {
  return {
    id: id.toLowerCase(),
    type: "text",
    x,
    y,
    width: 800,
    height: 260,
    color,
    text: [
      "## [" + id + " — " + name + "](../build/units/" + id.toLowerCase() + "-" + name.toLowerCase().replace(/\s+/g, "-") + ".md)",
      "",
      "`" + location + "` · **Domain:** " + family,
      "",
      "**Requires:** " + dependencies.replace(/None\./, "none"),
      "",
      "This artifact gives dependent units one clear capability and a stable boundary that they can build and test without hidden ownership.",
    ].join("\n"),
  };
}

function edge(from, to, label) {
  return {
    id: from.toLowerCase() + "-to-" + to.toLowerCase(),
    fromNode: from.toLowerCase(),
    fromEnd: "none",
    toNode: to.toLowerCase(),
    toEnd: "arrow",
    label,
  };
}

function fixture() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "build-unit-dependency-map-"));
  const root = path.join(workspace, "software-design");
  const buildRoot = path.join(root, "build");
  const canvasPath = path.join(root, "diagrams", "build-unit-dependency-map.canvas");
  const units = [
    ["BU-001", "Core", "Shared foundation", "None.", "packages/core"],
    ["BU-002", "Contract", "Base", "BU-001", "contracts/base"],
    ["BU-003", "Application", "Application", "BU-001, BU-002", "apps/web"],
    ["BU-004", "Worker", "Operations", "BU-001", "workers/observe"],
  ];
  for (const item of units) {
    const [id, name, family, dependencies, location] = item;
    write(
      path.join(buildRoot, "units", id.toLowerCase() + "-" + name.toLowerCase() + ".md"),
      unitRecord(id, name, family, dependencies, location),
    );
  }
  write(path.join(root, "README.md"), "# Software Design\n\n- [Build Unit Dependency Map](./diagrams/build-unit-dependency-map.canvas)\n");
  write(path.join(buildRoot, "README.md"), "# Build\n\n- [Build Unit Dependency Map](../diagrams/build-unit-dependency-map.canvas)\n");
  const canvas = {
    nodes: [
      {
        id: "intro",
        type: "text",
        x: 500,
        y: -800,
        width: 1000,
        height: 180,
        color: "#6b7280",
        text: "# Build Unit Dependency Map\n\nThis map shows build dependencies, not runtime or lifecycle execution order.",
      },
      {
        id: "legend",
        type: "text",
        x: 600,
        y: -450,
        width: 800,
        height: 180,
        color: "#6b7280",
        text: "## Color key\n\nColor shows responsibility, not readiness or priority.",
      },
      card("BU-001", "Core", "Shared foundation", "None.", "packages/core", 600, 0, "#7c3aed"),
      card("BU-002", "Contract", "Base", "BU-001", "contracts/base", 0, 600, "#2563eb"),
      card("BU-004", "Worker", "Operations", "BU-001", "workers/observe", 1200, 600, "#b45309"),
      card("BU-003", "Application", "Application", "BU-001, BU-002", "apps/web", 600, 1200, "#166534"),
    ],
    edges: [
      edge("BU-001", "BU-002", "contract definitions"),
      edge("BU-001", "BU-004", "shared event schema"),
      edge("BU-002", "BU-003", "contract client"),
    ],
  };
  write(canvasPath, JSON.stringify(canvas, null, 2));
  return { root, canvasPath };
}

function editCanvas(canvasPath, change) {
  const canvas = JSON.parse(fs.readFileSync(canvasPath, "utf8"));
  change(canvas);
  fs.writeFileSync(canvasPath, JSON.stringify(canvas, null, 2));
}

test("validates exact unit coverage with a transitive reduction and parallel row", () => {
  const { root } = fixture();
  const result = run(root);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /4 units, 3 reduced dependency edges, 3 topological rows/);
});

test("requires the canonical map once two or more build units exist", () => {
  const { root, canvasPath } = fixture();
  fs.rmSync(canvasPath);
  const result = run(root);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /requires diagrams\/build-unit-dependency-map\.canvas/);
});

test("rejects a missing canonical build-unit card", () => {
  const { root, canvasPath } = fixture();
  editCanvas(canvasPath, (canvas) => {
    canvas.nodes = canvas.nodes.filter((node) => node.id !== "bu-004");
    canvas.edges = canvas.edges.filter((item) => item.fromNode !== "bu-004" && item.toNode !== "bu-004");
  });
  const result = run(root);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Missing build-unit card: BU-004/);
});

test("rejects a card whose full dependency list is incomplete", () => {
  const { root, canvasPath } = fixture();
  editCanvas(canvasPath, (canvas) => {
    const node = canvas.nodes.find((item) => item.id === "bu-003");
    node.text = node.text.replace("**Requires:** BU-001, BU-002", "**Requires:** BU-002");
  });
  const result = run(root);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /BU-003 card Requires list must exactly cover canonical dependencies/);
});

test("rejects transitively redundant visible arrows", () => {
  const { root, canvasPath } = fixture();
  editCanvas(canvasPath, (canvas) => canvas.edges.push(edge("BU-001", "BU-003", "shared rules")));
  const result = run(root);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /transitively redundant dependency arrow: BU-001->BU-003/);
});

test("rejects reversed prerequisite arrows", () => {
  const { root, canvasPath } = fixture();
  editCanvas(canvasPath, (canvas) => {
    const item = canvas.edges.find((candidate) => candidate.id === "bu-001-to-bu-002");
    item.fromNode = "bu-002";
    item.toNode = "bu-001";
  });
  const result = run(root);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Missing reduced dependency arrow: BU-001->BU-002/);
  assert.match(result.stderr, /Unexpected or transitively redundant dependency arrow: BU-002->BU-001/);
});

test("rejects responsibility-family drift between prose and the map", () => {
  const { root, canvasPath } = fixture();
  editCanvas(canvasPath, (canvas) => {
    const node = canvas.nodes.find((item) => item.id === "bu-002");
    node.text = node.text.replace("**Domain:** Base", "**Domain:** Application");
  });
  const result = run(root);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /BU-002 card responsibility family must match/);
});

test("rejects code-location drift from the Build Unit record", () => {
  const { root, canvasPath } = fixture();
  editCanvas(canvasPath, (canvas) => {
    const node = canvas.nodes.find((item) => item.id === "bu-002");
    node.text = node.text.replace("`contracts/base`", "`apps/web`");
  });
  const result = run(root);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /BU-002 card code location must match/);
});

test("rejects vertically split cards at the same dependency depth", () => {
  const { root, canvasPath } = fixture();
  editCanvas(canvasPath, (canvas) => {
    canvas.nodes.find((item) => item.id === "bu-004").y = 900;
  });
  const result = run(root);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Topological row 1 is vertically misaligned/);
});

test("requires direct links from both README entry points", () => {
  const { root } = fixture();
  fs.writeFileSync(path.join(root, "build", "README.md"), "# Build\n");
  const result = run(root);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Build README must directly link/);
});
