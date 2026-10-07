#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { buildReadinessReconciliationReport } from "../../scripts/report-build-unit-readiness-reconciliation.mjs";
import { createWorkspace, runNode, writeText } from "../support/workspace.mjs";

const script = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..", "scripts", "report-build-unit-readiness-reconciliation.mjs");

function buildUnit(id, command) {
  return `---
type: build-unit
id: ${id}
name: ${id} Example
kind: library
source_responsibilities: "SR-001"
depends_on_build_units: "None."
---

# ${id} Example

## Artifact And Code Location
Example library artifact.

## Source Responsibility Mapping
Maps the named component responsibility.

## Interfaces And Dependencies
Uses explicit public inputs only.

## Module Architecture
One public module.

## Commands And Verification
${command}

## Local Discretion
None.
`;
}

function ticket({ status = "todo", buildUnits = ["BU-001"], buildUnitDisposition = null, repositories = null, repositoryContractArea = null } = {}) {
  const resolution = status === "todo" ? "null" : JSON.stringify("Use the selected reproducible command.");
  const repositoryFields = repositories === null
    ? ""
    : `    repositories: ${JSON.stringify(repositories)}\n    repository_contract_area: ${JSON.stringify(repositoryContractArea)}\n`;
  return `ticket_file_version: 3
scope: "responsibility:SR-001"

tickets:
  - id: "TICKET-0001"
    title: "Select the library command"
    status: "${status}"
    kind: "technical"
    complexity: "medium"
    concern: "integration-configuration"
    owner: "SR-001"
    affects: ["SR-001"]
    cluster: "library-toolchain"
    parent_decision: null
    question: "Which reproducible command builds and verifies the library?"
    context: "The library requires one selected build command before it can be reproduced."
    candidate_proof: "An implementer cannot finish or verify the reproducible library build without choosing the exact command contract, and the current package does not already choose it."
    options: ["Use one package script.", "Use a dedicated build runner."]
    recommendation: "Use one package script."
    resolution: ${resolution}
    current_shape: null
    result_refs: []
    constraint_refs: []
    depends_on: []
    write_targets: ["system-model/domains/sample/responsibilities/sr-001-example.md"]
    build_units: ${JSON.stringify(buildUnits)}
    build_unit_disposition: ${buildUnitDisposition === null ? "null" : JSON.stringify(buildUnitDisposition)}
${repositoryFields}`;
}

function additionalTicket({ id = "TICKET-0002", status = "finished", buildUnits = ["BU-001"] } = {}) {
  const resolution = status === "todo" ? "null" : JSON.stringify("Use the selected reproducible command.");
  return `  - id: "${id}"
    title: "Select the secondary library command"
    status: "${status}"
    kind: "technical"
    complexity: "medium"
    concern: "integration-configuration"
    owner: "SR-001"
    affects: ["SR-001"]
    cluster: "library-toolchain"
    parent_decision: null
    question: "Which secondary command preserves the reproducible library workflow?"
    context: "The library command set requires one explicit secondary command."
    candidate_proof: "An implementer cannot finish or verify the secondary command without selecting its exact contract."
    options: ["Use one package script.", "Use a dedicated build runner."]
    recommendation: "Use one package script."
    resolution: ${resolution}
    current_shape: null
    result_refs: []
    constraint_refs: []
    depends_on: []
    write_targets: ["system-model/domains/sample/responsibilities/sr-001-example.md"]
    build_units: ${JSON.stringify(buildUnits)}
    build_unit_disposition: null
`;
}

function fixture({ status = "todo", buildUnits = ["BU-001"], buildUnitDisposition = null, repositories = null, repositoryContractArea = null, repositoryMembers = [] } = {}) {
  const root = createWorkspace("software-design-build-unit-reconciliation-");
  const buildUnitsRoot = path.join(root, "build", "units");
  const ticketsRoot = path.join(root, "build", "workflow", "tickets");
  writeText(path.join(root, "system-model", "domains", "sample", "domain.md"), `---
type: system-domain
id: DOMAIN-sample
name: Sample Domain
responsibilities: "SR-001"
---

# Sample Domain
`);
  writeText(
    path.join(root, "system-model", "domains", "sample", "responsibilities", "sr-001-example.md"),
    "---\ntype: system-responsibility\nid: SR-001\nname: Example Responsibility\ndomain: sample\n---\n\n# SR-001 — Example Responsibility\n",
  );
  writeText(
    path.join(buildUnitsRoot, "bu-001-example.md"),
    buildUnit("BU-001", "| Build library | Not selected — `TICKET-0001` | Planned | The toolchain remains open. |"),
  );
  writeText(
    path.join(buildUnitsRoot, "bu-002-example.md"),
    buildUnit("BU-002", "| Build library | `npm run build` | Planned | Command selected. |"),
  );
  writeText(path.join(ticketsRoot, "sample", "sr-001", "sr-001-tickets.yaml"), ticket({ status, buildUnits, buildUnitDisposition, repositories, repositoryContractArea }));
  for (const repository of repositoryMembers) {
    writeText(
      path.join(root, "build", "repositories", `${repository.id.toLowerCase()}-example`, "README.md"),
      `---
type: repository-build-design
id: ${repository.id}
name: ${repository.id} Example
member_build_units: "${repository.memberBuildUnits.join(", ")}"
technical_constraints: "None."
---
`,
    );
  }
  return root;
}

test("reports a consistently mapped blocker and strict readiness fails", () => {
  const root = fixture();
  try {
    const report = buildReadinessReconciliationReport(root, ["BU-001"]);
    assert.equal(report.mismatchCount, 0);
    assert.equal(report.blockingTicketCount, 1);
    assert.equal(report.units[0].status, "BLOCKED");
    const result = runNode(script, ["--root", root, "--units", "BU-001", "--assert-ready"]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Selected build units are not ready/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("reports a ticket cited as unresolved but mapped to another build unit", () => {
  const root = fixture({ buildUnits: ["BU-002"] });
  try {
    const report = buildReadinessReconciliationReport(root, ["BU-001"]);
    assert.equal(report.mismatchCount, 1);
    assert.equal(report.units[0].cues[0].type, "ticket-not-mapped-to-unit");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("reports a finished ticket that the build-unit record still calls unselected", () => {
  const root = fixture({ status: "finished" });
  try {
    const report = buildReadinessReconciliationReport(root, ["BU-001"]);
    assert.equal(report.mismatchCount, 1);
    assert.equal(report.units[0].cues[0].type, "resolved-ticket-still-described-as-unresolved");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("checks every ticket in a comma-separated unresolved list", () => {
  const root = fixture();
  try {
    writeText(
      path.join(root, "build", "units", "bu-001-example.md"),
      buildUnit("BU-001", "| Build library | Planned | Planned | Commands remain open under `TICKET-0001`, and `TICKET-0002`. |"),
    );
    writeText(
      path.join(root, "build", "workflow", "tickets", "sample", "sr-001", "sr-001-tickets.yaml"),
      ticket() + additionalTicket(),
    );
    const report = buildReadinessReconciliationReport(root, ["BU-001"]);
    assert.equal(report.mismatchCount, 1);
    assert.deepEqual(report.units[0].cues.map(({ type, ticketId }) => ({ type, ticketId })), [
      { type: "mapped-blocker", ticketId: "TICKET-0001" },
      { type: "resolved-ticket-still-described-as-unresolved", ticketId: "TICKET-0002" },
    ]);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("does not pull a later fixed-by ticket into the unresolved clause on the same line", () => {
  const root = fixture();
  try {
    writeText(
      path.join(root, "build", "units", "bu-001-example.md"),
      buildUnit("BU-001", "| Build library | Planned | Planned | Runtime remains open under `TICKET-0001` while the command model is fixed by `TICKET-0002`. |"),
    );
    writeText(
      path.join(root, "build", "workflow", "tickets", "sample", "sr-001", "sr-001-tickets.yaml"),
      ticket() + additionalTicket(),
    );
    const report = buildReadinessReconciliationReport(root, ["BU-001"]);
    assert.equal(report.mismatchCount, 0);
    assert.deepEqual(report.units[0].cues.map(({ type, ticketId }) => ({ type, ticketId })), [
      { type: "mapped-blocker", ticketId: "TICKET-0001" },
    ]);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("does not report an unmapped material repository contract ticket as reconciled", () => {
  const root = fixture({
    buildUnits: [],
    buildUnitDisposition: "External no-code responsibility.",
    repositories: ["REPO-001"],
    repositoryContractArea: "repository-module-conventions",
    repositoryMembers: [{ id: "REPO-001", memberBuildUnits: ["BU-001"] }],
  });
  try {
    assert.throws(
      () => buildReadinessReconciliationReport(root, ["BU-001"]),
      /repository contract ticket.*build unit/i,
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
