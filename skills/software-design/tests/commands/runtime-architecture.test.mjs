#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const scriptsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "scripts");
const renderer = path.join(scriptsRoot, "render-runtime-architecture.mjs");
const validator = path.join(scriptsRoot, "validate-runtime-architecture.mjs");

function model() {
  const example = {
    title: "Example System",
    width: 1600,
    height: 900,
    groups: [
      { id: "entry", label: "PEOPLE AND APPS", x: 40, y: 140, width: 400, height: 700 },
      { id: "runtime", label: "SYSTEM RUNTIME", x: 480, y: 140, width: 640, height: 700 },
      { id: "external", label: "CONNECTED SERVICES", x: 1160, y: 140, width: 400, height: 700 },
    ],
    nodes: [
      { id: "customer", title: "Customer", meta: "human actor", description: "Starts the journey.", category: "actor", kind: "person", group: "entry", x: 70, y: 250, width: 100, height: 100 },
      { id: "customer-app", title: "Customer Application", meta: "React / Vite", description: "Customer-facing browser application.", category: "product", kind: "app", group: "entry", x: 220, y: 230, width: 180, height: 120 },
      { id: "processing-service", title: "Processing Service", meta: "HTTP service · managed runtime", description: "Coordinates the system.", category: "core", kind: "service", group: "runtime", x: 700, y: 400, width: 300, height: 160 },
      { id: "application-database", title: "Application Database", meta: "Managed database", description: "Canonical state.", category: "runtime", kind: "database", group: "runtime", x: 735, y: 670, width: 230, height: 100 },
      { id: "identity-service", title: "Identity Service", meta: "Identity provider", description: "User identity.", category: "external", kind: "identity", group: "external", x: 1240, y: 360, width: 220, height: 100 },
    ],
    edges: [
      { id: "customer-app", from: "customer", to: "customer-app", kind: "request-response", points: [[170, 300], [220, 300]] },
      { id: "app-service", from: "customer-app", to: "processing-service", kind: "request-response", points: [[400, 290], [600, 290], [600, 450], [700, 450]] },
      { id: "service-database", from: "processing-service", to: "application-database", kind: "request-response", points: [[850, 560], [850, 670]] },
      { id: "identity-service", from: "identity-service", to: "processing-service", kind: "request-response", points: [[1240, 410], [1160, 410], [1160, 320], [950, 320], [950, 400]] },
    ],
  };
  for (const node of example.nodes) {
    node.description += " It has a clear, bounded responsibility in the system.";
    node.works_with = "The direct connections highlighted in this runtime diagram.";
    node.boundary = { label: "Keeps its boundary", text: "It does not take over the authority or state of connected components." };
    node.sources = ["BU-001"];
  }
  return example;
}

function run(script, args) {
  return spawnSync(process.execPath, [script, ...args], { encoding: "utf8" });
}

test("runtime architecture renderer writes one self-contained interactive HTML file", (context) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "runtime-architecture-test-"));
  context.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const input = path.join(directory, "model.json");
  const output = path.join(directory, "runtime-architecture.html");
  fs.writeFileSync(input, JSON.stringify(model(), null, 2));
  const result = run(renderer, ["--input", input, "--output", output]);
  assert.equal(result.status, 0, result.stderr);
  const html = fs.readFileSync(output, "utf8");
  assert.match(html, /Two-finger scroll to move/);
  assert.match(html, /runtime-architecture-model/);
  assert.match(html, /Customer Application/);
  assert.doesNotMatch(html, /<svg[^>]*>\s*<title/i);
});

test("runtime architecture validator rejects crossing connector lanes", (context) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "runtime-architecture-crossing-test-"));
  context.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const input = path.join(directory, "crossing.json");
  const invalid = model();
  invalid.edges[2].points = [[850, 560], [600, 560], [600, 400], [550, 400], [550, 650], [735, 650], [735, 670]];
  fs.writeFileSync(input, JSON.stringify(invalid, null, 2));
  const result = run(validator, ["--input", input]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /cross or overlap|passes through/);
});

test("runtime architecture validator rejects a sideways arrowhead on a card edge", (context) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "runtime-architecture-tangent-test-"));
  context.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const input = path.join(directory, "tangent.json");
  const invalid = model();
  invalid.edges[2].points = [[850, 560], [760, 560], [760, 670], [850, 670]];
  fs.writeFileSync(input, JSON.stringify(invalid, null, 2));
  const result = run(validator, ["--input", input]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /perpendicular to its card side/);
});

test("runtime architecture validator requires a human-first inspector", (context) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "runtime-architecture-inspector-test-"));
  context.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const input = path.join(directory, "inspector.json");
  const invalid = model();
  delete invalid.nodes[2].works_with;
  fs.writeFileSync(input, JSON.stringify(invalid, null, 2));
  const result = run(validator, ["--input", input]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /works_with/);
});
