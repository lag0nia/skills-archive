#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { validateSelectedHandoff } from "../../scripts/lib/validation/selected-handoff.mjs";
import { createNewConsumerScenario, fixture, write } from "../support/delivery-readiness-fixtures.mjs";

const skillRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");
const wrapper = path.join(skillRoot, "scripts", "validate-stage9-handoff.mjs");

function readyPackage(root, handoffNames = ["example.md"]) {
  write(path.join(root, "build", "units", "bu-001-example.md"), "# BU-001 — Example\n");
  for (const name of handoffNames) write(path.join(root, "build", "workflow", "handoffs", name), "# Stage 9 Handoff\n\n**Selected build units:** `BUILD_UNIT:BU-001`\n");
}

// Stub checks record each call so selection, independence and mode propagation are observable.
function recordingChecks({ fail = [], throwing = [] } = {}) {
  const calls = [];
  const check = (name) => (args) => {
    calls.push({ name, handoff: path.relative(args.root, args.handoffPath), units: args.selectedUnits, mode: args.validationMode });
    if (throwing.includes(name)) throw new Error(name + " could not run");
    return { errors: fail.includes(name) ? [name + " failed"] : [], warnings: name === "readiness" ? ["unrelated record"] : [] };
  };
  return { calls, checks: { reconciliation: check("reconciliation"), sequence: check("sequence"), readiness: check("readiness") } };
}

function cleanup(context, root) {
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
}

test("runs every check against the one explicitly selected handoff while others coexist", (context) => {
  const root = fixture(); cleanup(context, root);
  readyPackage(root, ["one.md", "two.md"]);
  const { calls, checks } = recordingChecks();
  const result = validateSelectedHandoff(root, "build/workflow/handoffs/two.md", { checks });
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.warnings, ["unrelated record"]);
  assert.deepEqual(calls.map((call) => call.name), ["reconciliation", "sequence", "readiness"]);
  for (const call of calls) {
    assert.equal(call.handoff, path.join("build", "workflow", "handoffs", "two.md"));
    assert.deepEqual(call.units, ["BU-001"]);
  }
});

test("accepts only a Markdown handoff directly under build/workflow/handoffs/", (context) => {
  const root = fixture(); cleanup(context, root);
  readyPackage(root);
  write(path.join(root, "implementation-details", "handoffs", "example.md"), "# Legacy Stage 9 Handoff\n\n**Selected build units:** `BUILD_UNIT:BU-001`\n");
  for (const handoff of ["implementation-details/handoffs/example.md", "build/workflow/handoffs/README.txt", "build/workflow/handoffs/missing.md"]) {
    const { calls, checks } = recordingChecks();
    assert.throws(() => validateSelectedHandoff(root, handoff, { checks }), /build\/workflow\/handoffs|does not exist/);
    assert.deepEqual(calls, []);
  }
});

test("requires an activated Stage 8 Build Design and a selected Build Unit", (context) => {
  const root = fixture(); cleanup(context, root);
  write(path.join(root, "build", "workflow", "handoffs", "example.md"), "# Stage 9 Handoff\n\n**Selected build units:** `BUILD_UNIT:BU-001`\n");
  assert.throws(() => validateSelectedHandoff(root, "build/workflow/handoffs/example.md", recordingChecks()), /build\/units/);
  write(path.join(root, "build", "units", "bu-001-example.md"), "# BU-001\n");
  write(path.join(root, "build", "workflow", "handoffs", "example.md"), "# Stage 9 Handoff\n");
  assert.throws(() => validateSelectedHandoff(root, "build/workflow/handoffs/example.md", recordingChecks()), /at least one selected Build Unit/);
});

test("reports every independent failure, including a check that throws", (context) => {
  const root = fixture(); cleanup(context, root);
  readyPackage(root);
  const { calls, checks } = recordingChecks({ fail: ["reconciliation", "readiness"], throwing: ["sequence"] });
  const result = validateSelectedHandoff(root, "build/workflow/handoffs/example.md", { checks });
  assert.deepEqual(calls.map((call) => call.name), ["reconciliation", "sequence", "readiness"]);
  assert.deepEqual(result.errors, [
    "Build Unit readiness reconciliation: reconciliation failed",
    "Selected handoff sequence check: sequence could not run",
    "Delivery Readiness validation: readiness failed",
  ]);
});

test("propagates the validation mode, defaults to execution, and rejects unknown modes before any check", (context) => {
  const root = fixture(); cleanup(context, root);
  readyPackage(root);
  for (const mode of ["planning", "execution"]) {
    const { calls, checks } = recordingChecks();
    validateSelectedHandoff(root, "build/workflow/handoffs/example.md", { validationMode: mode, checks });
    assert.deepEqual(calls.map((call) => call.mode), [mode, mode, mode]);
  }
  const defaulted = recordingChecks();
  validateSelectedHandoff(root, "build/workflow/handoffs/example.md", { checks: defaulted.checks });
  assert.deepEqual(defaulted.calls.map((call) => call.mode), ["execution", "execution", "execution"]);
  const invalid = recordingChecks();
  assert.throws(() => validateSelectedHandoff(root, "build/workflow/handoffs/example.md", { validationMode: "relaxed", checks: invalid.checks }), /Unknown validation mode/);
  assert.deepEqual(invalid.calls, []);
});

test("the CLI rejects missing, unknown, and duplicate modes and foreign skill directories", (context) => {
  const root = fixture(); cleanup(context, root);
  readyPackage(root);
  const base = [wrapper, "--root", root, "--handoff", "build/workflow/handoffs/example.md"];
  for (const [args, error] of [
    [["--validation-mode"], /Unknown validation mode/],
    [["--validation-mode", "bogus"], /Unknown validation mode/],
    [["--validation-mode", "execution", "--validation-mode", "planning"], /Duplicate --validation-mode/],
    [["--software-design-skill", root], /must be this skill's own directory/],
  ]) {
    const result = spawnSync(process.execPath, [...base, ...args], { encoding: "utf8" });
    assert.equal(result.status, 1);
    assert.match(result.stderr, error);
  }
});

test("the CLI passes a real settled handoff and blocks it once it no longer reconciles", (context) => {
  const workspace = fixture(); cleanup(context, workspace);
  const root = path.join(workspace, "software-design");
  const scenario = createNewConsumerScenario(root);
  const handoff = path.relative(root, scenario.handoff);
  const passing = spawnSync(process.execPath, [wrapper, "--root", root, "--handoff", handoff, "--validation-mode", "execution"], { encoding: "utf8" });
  assert.equal(passing.status, 0, passing.stderr);
  assert.match(passing.stdout, /VALIDATION_MODE: execution/);
  write(scenario.handoff, fs.readFileSync(scenario.handoff, "utf8") + "\nAn unreconciled edit.\n");
  const stale = spawnSync(process.execPath, [wrapper, "--root", root, "--handoff", handoff, "--validation-mode", "planning"], { encoding: "utf8" });
  assert.equal(stale.status, 1);
  assert.match(stale.stderr, /Delivery Readiness validation: .*Snapshot ID/);
});
