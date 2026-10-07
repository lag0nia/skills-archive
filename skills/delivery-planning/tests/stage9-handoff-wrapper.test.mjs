#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const wrapper = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "scripts", "validate-stage9-handoff.mjs");

function fixture() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "delivery-planning-stage9-"));
}

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function softwareDesignSkill(root, exitCode = 0, reconciliationExitCode = 0, sequenceExitCode = 0) {
  write(path.join(root, "scripts", "validate-delivery-readiness.mjs"), `process.stdout.write("technical validator ran " + JSON.stringify(process.argv.slice(2)) + "\\n"); process.exitCode = ${exitCode};\n`);
  write(path.join(root, "scripts", "report-build-unit-readiness-reconciliation.mjs"), `process.stdout.write("readiness reconciliation ran\\n"); process.exitCode = ${reconciliationExitCode};\n`);
  write(path.join(root, "scripts", "validate-handoff-sequence.mjs"), `process.stdout.write("sequence eligibility ran " + JSON.stringify(process.argv.slice(2)) + "\\n"); process.exitCode = ${sequenceExitCode};\n`);
}

function readyPackage(root, handoffNames = ["example.md"]) {
  write(path.join(root, "build", "units", "bu-001-example.md"), "# BU-001 — Example\n");
  for (const name of handoffNames) write(path.join(root, "build", "workflow", "handoffs", name), "# Stage 9 Handoff\n\n**Selected build units:** `BUILD_UNIT:BU-001`\n");
}

function run(root, skillRoot, handoff = "build/workflow/handoffs/example.md") {
  return spawnSync(process.execPath, [wrapper, "--root", root, "--handoff", handoff, "--software-design-skill", skillRoot], { encoding: "utf8" });
}

test("delegates one Stage 9 handoff to the supplied software-design validator", (context) => {
  const root = fixture();
  const skillRoot = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  context.after(() => fs.rmSync(skillRoot, { recursive: true, force: true }));
  readyPackage(root);
  softwareDesignSkill(skillRoot);
  const result = run(root, skillRoot);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /technical validator ran/);
  assert.match(result.stdout, /--handoff/);
  assert.match(result.stdout, /build\/workflow\/handoffs\/example\.md/);
});

test("selects one Stage 9 handoff explicitly while other current handoffs coexist", (context) => {
  const root = fixture();
  const skillRoot = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  context.after(() => fs.rmSync(skillRoot, { recursive: true, force: true }));
  readyPackage(root, ["one.md", "two.md"]);
  softwareDesignSkill(skillRoot);
  const result = run(root, skillRoot, "build/workflow/handoffs/two.md");
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /technical validator ran/);
  assert.match(result.stdout, /build\/workflow\/handoffs\/two\.md/);
});

test("rejects a retired implementation-details handoff instead of treating it as current", (context) => {
  const root = fixture();
  const skillRoot = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  context.after(() => fs.rmSync(skillRoot, { recursive: true, force: true }));
  write(path.join(root, "build", "units", "bu-001-example.md"), "# BU-001 — Example\n");
  write(path.join(root, "implementation-details", "handoffs", "example.md"), "# Legacy Stage 9 Handoff\n\n**Selected build units:** `BUILD_UNIT:BU-001`\n");
  softwareDesignSkill(skillRoot);
  const result = run(root, skillRoot, "implementation-details/handoffs/example.md");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /build\/workflow\/handoffs/);
  assert.doesNotMatch(result.stdout, /technical validator ran/);
});

test("propagates an upstream software-design validation failure", (context) => {
  const root = fixture();
  const skillRoot = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  context.after(() => fs.rmSync(skillRoot, { recursive: true, force: true }));
  readyPackage(root);
  softwareDesignSkill(skillRoot, 1);
  const result = run(root, skillRoot);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /technical validator ran/);
});

test("reports all independent failures when readiness reconciliation fails", (context) => {
  const root = fixture();
  const skillRoot = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  context.after(() => fs.rmSync(skillRoot, { recursive: true, force: true }));
  readyPackage(root);
  softwareDesignSkill(skillRoot, 1, 1, 1);
  const result = run(root, skillRoot);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /readiness reconciliation ran/);
  assert.match(result.stdout, /sequence eligibility ran/);
  assert.match(result.stdout, /technical validator ran/);
});

test("continues structural diagnosis when the selected sequence row is not executable", (context) => {
  const root = fixture();
  const skillRoot = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  context.after(() => fs.rmSync(skillRoot, { recursive: true, force: true }));
  readyPackage(root);
  softwareDesignSkill(skillRoot, 0, 0, 1);
  const result = run(root, skillRoot);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /sequence eligibility ran/);
  assert.match(result.stdout, /--assert-plannable/);
  assert.match(result.stdout, /technical validator ran/);
});
