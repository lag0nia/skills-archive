#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { currentShapeErrors } from "../../scripts/lib/model/current-shape.mjs";

function fixtureRoot(context) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "software-design-current-shape-"));
  fs.mkdirSync(path.join(root, "system-model"), { recursive: true });
  fs.writeFileSync(path.join(root, "system-model", "source.md"), "# Source\n");
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

test("accepts the three bounded current-shape grammars", (context) => {
  const root = fixtureRoot(context);
  const common = { title: "Current example", source_refs: ["system-model/source.md"] };
  assert.deepEqual(currentShapeErrors({
    ...common,
    type: "tree",
    lines: ["REPO-001 — Example", "└── BU-001 — Library"],
  }, { owner: "TICKET-0001", root }), []);
  assert.deepEqual(currentShapeErrors({
    ...common,
    type: "logic",
    lines: ["flowchart TD", "A[Verified fact] -->|exact match| B[Proceed]"],
  }, { owner: "TICKET-0001", root }), []);
  assert.deepEqual(currentShapeErrors({
    ...common,
    type: "state",
    lines: ["stateDiagram-v2", "Available --> Reserved: user selects"],
  }, { owner: "TD-001", root }), []);
});

test("rejects malformed, untraceable, and mixed current-shape records", (context) => {
  const root = fixtureRoot(context);
  assert.match(currentShapeErrors("tree", { owner: "TICKET-0001", root })[0], /inline JSON object/);
  assert.ok(currentShapeErrors({
    type: "logic",
    title: "Wrong grammar",
    source_refs: ["system-model/source.md"],
    lines: ["stateDiagram-v2", "A --> B"],
  }, { owner: "TICKET-0001", root }).some((error) => /logic must start/));
  assert.ok(currentShapeErrors({
    type: "tree",
    title: "Missing source",
    source_refs: ["system-model/missing.md"],
    lines: ["Root", "└── Child"],
  }, { owner: "TICKET-0001", root }).some((error) => /does not resolve/));
  assert.ok(currentShapeErrors({
    type: "tree",
    title: "Extra field",
    source_refs: ["system-model/source.md"],
    lines: ["Root", "└── Child"],
    history: ["Rejected option"],
  }, { owner: "TICKET-0001", root }).some((error) => /unsupported field history/));
});
