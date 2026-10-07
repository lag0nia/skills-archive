#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const script = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..", "scripts", "delivery-snapshot.mjs");

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "delivery-snapshot-"));
  const handoffPath = path.join(root, "build", "workflow", "handoffs", "slice.md");
  const sourcePath = path.join(root, "build", "units", "bu-001.md");
  fs.mkdirSync(path.dirname(handoffPath), { recursive: true });
  fs.mkdirSync(path.dirname(sourcePath), { recursive: true });
  fs.writeFileSync(sourcePath, "# BU-001\n\nCurrent responsibility.\n");
  fs.writeFileSync(handoffPath, `# Delivery Planning Handoff

## Readiness Outcome

**Outcome:** \`IMPLEMENTATION_DETAILS_READY\`

## Build Unit Routing Index

[BU-001](../build-design/build-units/bu-001.md)
`);
  return { root, handoffPath, sourcePath };
}

function run({ root, handoffPath }, ...args) {
  return spawnSync(process.execPath, [script, "--root", root, "--handoff", handoffPath, ...args], { encoding: "utf8" });
}

test("writes and checks one Stage 9 handoff revision snapshot", (context) => {
  const files = fixture();
  context.after(() => fs.rmSync(files.root, { recursive: true, force: true }));
  const result = run(files, "--write", "--check");
  assert.equal(result.status, 0, result.stderr);
  assert.match(fs.readFileSync(files.handoffPath, "utf8"), /^\*\*Snapshot ID:\*\* `sha256:[a-f0-9]{64}`$/m);
  assert.match(result.stdout, /Wrote Stage 9 handoff snapshot/);
});

test("keeps the snapshot current after a linked source changes", (context) => {
  const files = fixture();
  context.after(() => fs.rmSync(files.root, { recursive: true, force: true }));
  assert.equal(run(files, "--write", "--check").status, 0);
  fs.appendFileSync(files.sourcePath, "Changed responsibility.\n");
  const result = run(files, "--check");
  assert.equal(result.status, 0, result.stderr);
});

test("rejects a snapshot after the handoff body changes", (context) => {
  const files = fixture();
  context.after(() => fs.rmSync(files.root, { recursive: true, force: true }));
  assert.equal(run(files, "--write", "--check").status, 0);
  fs.appendFileSync(files.handoffPath, "\n## Clarification\n\nThe selected delivery receipt changed.\n");
  const result = run(files, "--check");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Snapshot ID is stale/);
});

test("requires a recorded Snapshot ID in check mode", (context) => {
  const files = fixture();
  context.after(() => fs.rmSync(files.root, { recursive: true, force: true }));
  const result = run(files, "--check");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /exactly one \*\*Snapshot ID:\*\*/);
});
