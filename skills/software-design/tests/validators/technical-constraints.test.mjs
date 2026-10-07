#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const validator = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..", "scripts", "validate-technical-constraints.mjs");
const syncer = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..", "scripts", "sync-technical-constraint-sources.mjs");

function fixture() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "technical-constraints-"));
}

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function responsibility(root, { id = "SR-001", filename = "sr-001-example.md", title = "Example" } = {}) {
  write(path.join(root, "system-model", "domains", "example", "responsibilities", filename), `---
type: system-responsibility
id: ${id}
name: ${title} Responsibility
domain: example
---

# ${id} — ${title} Responsibility
`);
}

function constraint({ sourceTickets = "None." } = {}) {
  return `---
type: technical-constraint
id: CONS-001
title: No secret custody
technical_sources: "SR-001"
affected_responsibilities: "SR-001"
source_tickets: "${sourceTickets}"
---

# CONS-001 — No secret custody

## Rule

The responsibility must not retain a participant secret after the requested operation completes.

## Scope And Sources

[Example responsibility](../../../system-model/domains/example/responsibilities/sr-001-example.md) owns the public boundary.

## Verification Intent

Use boundary rejection checks and a deterministic integration scenario.
`;
}

function run(root) {
  return spawnSync(process.execPath, [validator, "--root", root], { encoding: "utf8" });
}

function runSync(root) {
  return spawnSync(process.execPath, [syncer, "--root", root], { encoding: "utf8" });
}

test("a backfilled technical constraint needs no historical ticket", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  responsibility(root);
  write(path.join(root, "build", "records", "constraints", "cons-001-no-secret-custody.md"), constraint());
  const result = run(root);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Verified Technical Constraint records/);
});

test("a ticket-created technical constraint requires reciprocal routing", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  responsibility(root);
  write(path.join(root, "build", "records", "constraints", "cons-001-no-secret-custody.md"), constraint({ sourceTickets: "TICKET-0001" }));
  write(path.join(root, "build", "workflow", "tickets", "example", "sr-001", "sr-001-tickets.yaml"), `ticket_file_version: 3
scope: "responsibility:SR-001"

tickets:
  - id: "TICKET-0001"
    status: "finished"
    constraint_refs: ["CONS-001"]
    write_targets: ["build/records/constraints/cons-001-no-secret-custody.md"]
`);
  const result = run(root);
  assert.equal(result.status, 0, result.stderr);
});

test("an unanswered ticket cannot create a Technical Constraint", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  responsibility(root);
  write(path.join(root, "build", "records", "constraints", "cons-001-no-secret-custody.md"), constraint({ sourceTickets: "TICKET-0001" }));
  write(path.join(root, "build", "workflow", "tickets", "example", "sr-001", "sr-001-tickets.yaml"), `ticket_file_version: 3
scope: "responsibility:SR-001"

tickets:
  - id: "TICKET-0001"
    status: "todo"
    constraint_refs: ["CONS-001"]
    write_targets: ["build/records/constraints/cons-001-no-secret-custody.md"]
`);
  const result = run(root);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /not decided or finished/);
});

test("a Technical Constraint requires canonical type and filename identity", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  responsibility(root);
  write(path.join(root, "build", "records", "constraints", "cons-002-wrong-identity.md"), constraint().replace("type: technical-constraint", "type: not-a-technical-constraint"));
  const result = run(root);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /must use type technical-constraint|filename must start with its lowercase CONS id/);
});

test("a Technical Constraint requires a canonical source link", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  responsibility(root);
  write(path.join(root, "build", "records", "constraints", "cons-001-no-secret-custody.md"), constraint().replace("[Example responsibility](../../../system-model/domains/example/responsibilities/sr-001-example.md) owns the public boundary.", "The example responsibility owns the public boundary."));
  const result = run(root);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /must link the canonical Software Design source for SR-001/);
});

test("Stage 8 source synchronization adds missing canonical responsibility links before validation", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  responsibility(root);
  responsibility(root, { id: "SR-002", filename: "sr-002-second.md", title: "Second" });
  const constraintPath = path.join(root, "build", "records", "constraints", "cons-001-no-secret-custody.md");
  write(constraintPath, constraint()
    .replace('technical_sources: "SR-001"', 'technical_sources: "SR-001, SR-002"')
    .replace('affected_responsibilities: "SR-001"', 'affected_responsibilities: "SR-001, SR-002"'));

  const before = run(root);
  assert.equal(before.status, 1);
  assert.match(before.stderr, /canonical Software Design source for SR-002/);

  const sync = runSync(root);
  assert.equal(sync.status, 0, sync.stderr);
  assert.match(fs.readFileSync(constraintPath, "utf8"), /\[SR-002\]\(\.\.\/\.\.\/\.\.\/system-model\/domains\/example\/responsibilities\/sr-002-second\.md\)/);
  const synchronized = fs.readFileSync(constraintPath, "utf8");
  const secondSync = runSync(root);
  assert.equal(secondSync.status, 0, secondSync.stderr);
  assert.match(secondSync.stdout, /already synchronized/);
  assert.equal(fs.readFileSync(constraintPath, "utf8"), synchronized);

  const after = run(root);
  assert.equal(after.status, 0, after.stderr);
});
