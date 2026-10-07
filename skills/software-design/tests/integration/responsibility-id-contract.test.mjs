#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { validateImplementationDetailTickets } from "../../scripts/validate-implementation-detail-tickets.mjs";

const scriptsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "scripts");
const structureValidator = path.join(scriptsRoot, "validate-software-design-structure.mjs");

function fixture(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function writeSystemModel(root, responsibilityId = "SR-001") {
  const responsibilitySlug = responsibilityId.toLowerCase();
  write(path.join(root, "system-model", "architecture.md"), `---
type: system-architecture
name: Example system
domains: "example"
global_invariants: "None."
security_boundaries: "None."
scope_boundaries: "None."
---

# System Architecture

## Purpose And Binding

Define the example system and its canonical subject.

## Authority And Sources Of Truth

The Example Domain owns the example fact.

## System Domains

| Domain | Purpose | System Responsibilities |
| --- | --- | --- |
| [Example](./domains/example/domain.md) | Example concern | \`${responsibilityId}\` |

## Cross-Domain Boundaries

None.
`);
  write(path.join(root, "system-model", "domains", "example", "domain.md"), `---
type: system-domain
id: DOMAIN-example
name: Example Domain
responsibilities: "${responsibilityId}"
external_responsibilities: "None."
---

# Example Domain

## Purpose

Own the example concern.

## Owns

- The example fact.

## Excludes

- External authority.

## Responsibility Composition

- ${responsibilityId}

## Cross-Domain Contracts

None.
`);
  write(path.join(root, "system-model", "domains", "example", "responsibilities", `${responsibilitySlug}-example.md`), `---
type: system-responsibility
id: ${responsibilityId}
name: Example Responsibility
domain: example
depends_on: "None."
participates_in: "None."
realized_by: "None."
---

# ${responsibilityId} — Example Responsibility

## Purpose

Own the example behavior.

## Owns

- The example behavior.

## Must Not Own

- External authority.

## Inputs And Outputs

None.

## State And Artifacts

None.

## Failure And Recovery

Reject invalid input.

## Invariants

None.
`);
}

function writeBlueprintFixture(workspace, responsibilityId = "SR-001") {
  const root = path.join(workspace, "software-design");
  const brief = path.join(workspace, "software-brief.md");
  writeSystemModel(root, responsibilityId);
  write(path.join(root, "build", "workflow", "technical-decisions.yaml"), `technical_decision_file_version: 1

decisions:
  - id: "TD-001"
    title: "Example choice"
    state: "Open"
    primary_domain: "example"
    affected_responsibilities: ["${responsibilityId}"]
    context: "The example representation must be chosen."
    why_it_matters: "The choice controls interoperable realization."
    established: "The logical responsibility boundary is approved."
    how_tickets_fit: "Future implementation questions must preserve one representation contract."
    blocker: null
    outcome: null
    defer_reason: null
    resume_when: null
`);
  write(brief, "# Software Brief\n");
  write(path.join(root, "README.md"), "# Software Design\n");
  return { root, brief };
}

function writeTicketFixture(workspace, responsibilityId = "SR-001") {
  const root = path.join(workspace, "software-design");
  const responsibilitySlug = responsibilityId.toLowerCase();
  writeSystemModel(root, responsibilityId);
  write(path.join(root, "build", "workflow", "tickets", "example", responsibilitySlug, `${responsibilitySlug}-tickets.yaml`), `ticket_file_version: 3
scope: "responsibility:${responsibilityId}"

tickets:
  - id: "TICKET-0001"
    title: "Choose the example representation"
    status: "todo"
    kind: "technical"
    complexity: "medium"
    concern: "data-model"
    owner: "${responsibilityId}"
    affects: ["${responsibilityId}"]
    build_units: []
    build_unit_disposition: "Realization mapping has not started."
    repositories: []
    repository_contract_area: null
    parent_decision: null
    cluster: "representation"
    question: "Which storage representation will realize the example responsibility?"
    context: "The logical boundary is known, but its storage representation is not selected."
    candidate_proof: "An implementer cannot finish or verify the example responsibility realization without choosing the example storage representation, and the current package does not already choose it."
    options: ["Representation A", "Representation B"]
    recommendation: "Prefer Representation A for the first implementation."
    resolution: null
    result_refs: []
    constraint_refs: []
    depends_on: []
    write_targets: ["system-model/domains/example/responsibilities/${responsibilitySlug}-example.md"]
`);
  return root;
}

for (const responsibilityId of ["SR-001", "SR-0001"]) {
  test(`${responsibilityId} is accepted across blueprint, Technical Decision, and ticket validation`, (context) => {
    const blueprintWorkspace = fixture("software-design-responsibility-id-blueprint-");
    const ticketWorkspace = fixture("software-design-responsibility-id-ticket-");
    context.after(() => {
      fs.rmSync(blueprintWorkspace, { recursive: true, force: true });
      fs.rmSync(ticketWorkspace, { recursive: true, force: true });
    });

    const blueprint = writeBlueprintFixture(blueprintWorkspace, responsibilityId);
    const structured = spawnSync(process.execPath, [structureValidator, "--root", blueprint.root], { encoding: "utf8" });
    assert.equal(structured.status, 0, structured.stderr);
    assert.deepEqual(validateImplementationDetailTickets(blueprint.root).errors, []);

    const tickets = validateImplementationDetailTickets(writeTicketFixture(ticketWorkspace, responsibilityId));
    assert.deepEqual(tickets.errors, []);
    assert.equal(tickets.responsibilities.has(responsibilityId), true);
  });
}

test("structure validation accepts titled local Markdown links", (context) => {
  const workspace = fixture("software-design-titled-link-");
  context.after(() => fs.rmSync(workspace, { recursive: true, force: true }));
  const blueprint = writeBlueprintFixture(workspace);
  fs.appendFileSync(path.join(blueprint.root, "system-model", "architecture.md"), "\n[Example responsibility](domains/example/responsibilities/sr-001-example.md \"Responsibility\")\n");
  const structured = spawnSync(process.execPath, [structureValidator, "--root", blueprint.root], { encoding: "utf8" });
  assert.equal(structured.status, 0, structured.stderr);
});

test("structure validation rejects a responsibility filename without its canonical ID", (context) => {
  const workspace = fixture("software-design-responsibility-filename-");
  context.after(() => fs.rmSync(workspace, { recursive: true, force: true }));
  const blueprint = writeBlueprintFixture(workspace);
  fs.renameSync(
    path.join(blueprint.root, "system-model", "domains", "example", "responsibilities", "sr-001-example.md"),
    path.join(blueprint.root, "system-model", "domains", "example", "responsibilities", "example-responsibility.md"),
  );
  const structured = spawnSync(process.execPath, [structureValidator, "--root", blueprint.root], { encoding: "utf8" });
  assert.notEqual(structured.status, 0);
  assert.match(structured.stderr, /responsibilities references missing SR-001/);
});

test("structure validation rejects an existing local Markdown link with a missing anchor", (context) => {
  const workspace = fixture("software-design-missing-anchor-");
  context.after(() => fs.rmSync(workspace, { recursive: true, force: true }));
  const blueprint = writeBlueprintFixture(workspace);
  fs.appendFileSync(path.join(blueprint.root, "system-model", "architecture.md"), "\n[Responsibility](domains/example/responsibilities/sr-001-example.md#missing-anchor)\n");
  const structured = spawnSync(process.execPath, [structureValidator, "--root", blueprint.root], { encoding: "utf8" });
  assert.notEqual(structured.status, 0);
  assert.match(structured.stderr, /broken local link anchor/);
});

test("runtime architecture is linked from README", (context) => {
  const workspace = fixture("software-design-runtime-architecture-");
  context.after(() => fs.rmSync(workspace, { recursive: true, force: true }));
  const blueprint = writeBlueprintFixture(workspace);
  write(path.join(blueprint.root, "diagrams", "runtime-architecture.html"), "<!doctype html><title>Runtime Architecture</title>\n");
  let result = spawnSync(process.execPath, [structureValidator, "--root", blueprint.root], { encoding: "utf8" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /README\.md: must link directly to diagrams\/runtime-architecture\.html/);

  write(path.join(blueprint.root, "README.md"), "# Software Design\n\n[Runtime Architecture](./diagrams/runtime-architecture.html)\n");
  result = spawnSync(process.execPath, [structureValidator, "--root", blueprint.root], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
});
