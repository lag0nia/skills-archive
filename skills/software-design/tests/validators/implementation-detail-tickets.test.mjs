#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const validator = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..", "scripts", "validate-implementation-detail-tickets.mjs");

function fixture() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "build-unit-ticket-mapping-"));
}

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function setup(root, {
  buildUnitsLine,
  dispositionLine = "    build_unit_disposition: null\n",
  secondBuildUnit = true,
  firstDependency = "None.",
  resultRefsLine = "[]",
  constraintRefsLine = null,
  repositoryContractAreaLine = null,
  repositoriesLine = null,
  repositories = [],
} = {}) {
  const domainRoot = path.join(root, "system-model", "domains", "example");
  const responsibilityPath = path.join(domainRoot, "responsibilities", "sr-001-example.md");
  write(path.join(domainRoot, "domain.md"), `---
type: system-domain
id: DOMAIN-example
name: Example Domain
responsibilities: "SR-001"
---

# Example Domain
`);
  write(responsibilityPath, `---
type: system-responsibility
id: SR-001
name: Example Responsibility
domain: example
---

# SR-001 — Example Responsibility
`);
  const buildUnit = (id, name, dependency = "None.") => `---
type: build-unit
id: ${id}
name: ${name}
kind: library
source_responsibilities: "SR-001"
depends_on_build_units: "${dependency}"
---

# ${id} — ${name}
`;
  const buildUnitsRoot = path.join(root, "build", "units");
  write(path.join(buildUnitsRoot, "bu-001-library.md"), buildUnit("BU-001", "Library", firstDependency));
  if (secondBuildUnit) write(path.join(buildUnitsRoot, "bu-002-cli.md"), buildUnit("BU-002", "CLI"));
  for (const repository of repositories) {
    write(path.join(root, "build", "repositories", `${repository.id.toLowerCase()}-example`, "README.md"), `---
type: repository-build-design
id: ${repository.id}
name: ${repository.name || "Example repository"}
member_build_units: "${repository.memberBuildUnits.join(", ") || "None."}"
technical_constraints: "None."
---
`);
  }
  const buildUnitFields = buildUnitsLine === undefined
    ? ""
    : `    build_units: ${buildUnitsLine}\n${dispositionLine}`;
  const resultRefsField = resultRefsLine === null ? "" : `    result_refs: ${resultRefsLine}\n`;
  const constraintRefsField = constraintRefsLine === null ? "" : `    constraint_refs: ${constraintRefsLine}\n`;
  const repositoryContractAreaField = repositoryContractAreaLine === null ? "" : `    repository_contract_area: ${repositoryContractAreaLine}\n`;
  const repositoriesField = repositoriesLine === null ? "" : `    repositories: ${repositoriesLine}\n`;
  const ticketsRoot = path.join(root, "build", "workflow", "tickets");
  write(path.join(ticketsRoot, "example", "sr-001", "sr-001-tickets.yaml"), `ticket_file_version: 3
scope: "responsibility:SR-001"

tickets:
  - id: "TICKET-0001"
    title: "Choose the public API"
    status: "finished"
    kind: "technical"
    complexity: "medium"
    concern: "interface-api"
    owner: "SR-001"
    affects: ["SR-001"]
${buildUnitFields}    cluster: "public-api"
    parent_decision: null
    question: "Which public API will the implementation expose?"
    context: "The logical responsibility is fixed and the public code interface has been selected."
    options: []
    recommendation: "Use the selected typed interface."
    resolution: "Use the selected typed interface."
    current_shape: null
${resultRefsField}    depends_on: []
${constraintRefsField}${repositoriesField}${repositoryContractAreaField}    write_targets: ["system-model/domains/example/responsibilities/sr-001-example.md"]
`);
}

function run(root) {
  return spawnSync(process.execPath, [validator, "--root", root], { encoding: "utf8" });
}

test("one responsibility ticket may apply to several build units", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  setup(root, { buildUnitsLine: "[\"BU-001\", \"BU-002\"]" });
  const result = run(root);
  assert.equal(result.status, 0, result.stderr);
});

test("repository contract area values are constrained to the supported lanes", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  setup(root, { buildUnitsLine: '["BU-001"]', secondBuildUnit: false, repositoryContractAreaLine: '"not-a-repository-lane"' });
  const result = run(root);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /repository_contract_area must be null or one of the supported repository contract lanes/);
});

test("every active ticket requires a build-unit disposition once mapping exists", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  setup(root, {});
  const result = run(root);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /build_units is required after realization mapping exists/);
});

test("ticket build-unit references must resolve", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  setup(root, { buildUnitsLine: "[\"BU-003\"]", secondBuildUnit: false });
  const result = run(root);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /build_units names an unknown build unit/);
});

test("a no-artifact ticket may use an explicit empty build-unit disposition", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  setup(root, {
    buildUnitsLine: "[]",
    dispositionLine: "    build_unit_disposition: \"External no-code responsibility.\"\n",
    secondBuildUnit: false,
  });
  const result = run(root);
  assert.equal(result.status, 0, result.stderr);
});

test("a material repository contract ticket must map a build unit after Build Design exists", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  setup(root, {
    buildUnitsLine: "[]",
    dispositionLine: '    build_unit_disposition: "External no-code responsibility."\n',
    secondBuildUnit: false,
    repositoriesLine: '["REPO-001"]',
    repositoryContractAreaLine: '"repository-module-conventions"',
    repositories: [{ id: "REPO-001", memberBuildUnits: ["BU-001"] }],
  });
  const result = run(root);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /repository contract ticket.*build unit/i);
});

test("an explicit repository mapping must map build units to their declared repositories", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  setup(root, {
    buildUnitsLine: '["BU-001"]',
    repositoriesLine: '["REPO-002"]',
    repositoryContractAreaLine: "null",
    repositories: [
      { id: "REPO-001", memberBuildUnits: ["BU-001"] },
      { id: "REPO-002", memberBuildUnits: ["BU-002"] },
    ],
  });
  const result = run(root);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /BU-001.*REPO-002|REPO-002.*BU-001/i);
});

test("a genuine repository-only ticket remains valid without a repository contract lane", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  setup(root, {
    buildUnitsLine: "[]",
    dispositionLine: '    build_unit_disposition: "External no-code responsibility."\n',
    secondBuildUnit: false,
    repositoriesLine: '["REPO-001"]',
    repositoryContractAreaLine: "null",
    repositories: [{ id: "REPO-001", memberBuildUnits: ["BU-001"] }],
  });
  const result = run(root);
  assert.equal(result.status, 0, result.stderr);
});

test("build-unit dependencies must resolve", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  setup(root, { buildUnitsLine: "[\"BU-001\"]", secondBuildUnit: false, firstDependency: "BU-999" });
  const result = run(root);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /unknown build-unit dependency BU-999/);
});

test("ticket result references must resolve to canonical SEL or VA artifacts", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  setup(root, { buildUnitsLine: '["BU-001"]', secondBuildUnit: false, resultRefsLine: '["SEL-999"]' });
  const result = run(root);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /TICKET-0001 references missing realization result SEL-999/);
});

test("the pre-mapping disposition is invalid after a Build Unit exists", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  setup(root, {
    buildUnitsLine: "[]",
    dispositionLine: '    build_unit_disposition: "Realization mapping has not started."\n',
    secondBuildUnit: false,
  });
  const result = run(root);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /pre-mapping build_unit_disposition/);
});

test("result_refs remains optional when a ticket produces no realization artifact", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  setup(root, { buildUnitsLine: '["BU-001"]', secondBuildUnit: false, resultRefsLine: null });
  const result = run(root);
  assert.equal(result.status, 0, result.stderr);
});

test("a resolved ticket may route to a reciprocal Technical Constraint without treating it as an SEL or VA", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  setup(root, { buildUnitsLine: '["BU-001"]', secondBuildUnit: false, constraintRefsLine: '["CONS-001"]' });
  write(path.join(root, "build", "records", "constraints", "cons-001-boundary.md"), `---
type: technical-constraint
id: CONS-001
title: Public boundary
technical_sources: "SR-001"
affected_responsibilities: "SR-001"
source_tickets: "TICKET-0001"
---

# CONS-001 — Public boundary
`);
  const result = run(root);
  assert.equal(result.status, 0, result.stderr);
});

test("duplicate and obsolete retirement preserves identity and forbids active archived dependencies", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  setup(root, { buildUnitsLine: '["BU-001", "BU-002"]' });
  const file = path.join(root, "build/workflow/tickets/example/sr-001/sr-001-tickets.yaml");
  const active = fs.readFileSync(file, "utf8");
  const archived = '\narchived_records:\n  - id: "TICKET-0002"\n    title: "Repeated API question"\n    record_state: "archived"\n    status_at_close: "todo"\n    closed_reason: "duplicate"\n    replaced_by: ["TICKET-0001"]\n    parent_decision: null\n';
  write(file, active + archived);
  assert.equal(run(root).status, 0);
  write(file, active.replace('depends_on: []', 'depends_on: ["TICKET-0002"]') + archived);
  assert.match(run(root).stderr, /active dependency points to archived ticket/);
  write(file, active + archived.replace('["TICKET-0001"]', '["TICKET-9999"]'));
  assert.match(run(root).stderr, /replacement ticket does not exist/);
  write(file, active + archived.replace('["TICKET-0001"]', '["TICKET-0002"]'));
  assert.match(run(root).stderr, /replacement must be an active ticket/);
  write(file, active + archived.replace('"duplicate"', '"obsolete"').replace('["TICKET-0001"]', '[]'));
  assert.equal(run(root).status, 0);
  write(file, 'ticket_file_version: 3\nscope: "responsibility:SR-001"\n' + archived.replace('"duplicate"', '"obsolete"').replace('["TICKET-0001"]', '[]'));
  assert.equal(run(root).status, 0, run(root).stderr);
});

test("finished ticket may retain recorded pending prototype work but canonical write targets remain required", async (context) => {
  const { validateUiUxDesign } = await import('../../scripts/lib/validation/ui-ux-design.mjs');
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  setup(root, { buildUnitsLine: '["BU-001", "BU-002"]' });
  const templates = path.resolve(path.dirname(validator), '../references/ui-ux/templates');
  const ticketFile = 'build/workflow/tickets/example/sr-001/sr-001-tickets.yaml';
  const owner = 'system-model/domains/example/responsibilities/sr-001-example.md';
  const specification = fs.readFileSync(path.join(templates, 'specification.md'), 'utf8')
    .replace('`Unresolved` — select a linked candidate entrypoint after review.', '`./alternatives/main/index.html`.')
    .replace('| Not reviewed | TBD |', '| Reviewed | Rendered walkthrough before approved timeout change. |')
    .replace('\nNone.\n', `\n| Journey | Pending change | Canonical / ticket references |\n| --- | --- | --- |\n| [Main](#journey-main) | Apply approved timeout to waiting and recovery | [Owner](../${owner}); [TICKET-0001](../${ticketFile}) |\n`);
  write(path.join(root, 'ui-ux/specification.md'), specification);
  write(path.join(root, 'ui-ux/prototype.html'), fs.readFileSync(path.join(templates, 'prototype.html'), 'utf8'));
  write(path.join(root, 'ui-ux/alternatives/main/index.html'), fs.readFileSync(path.join(templates, 'candidate.html'), 'utf8'));
  const ticketPath = path.join(root, ticketFile);
  const ticket = fs.readFileSync(ticketPath, 'utf8').replace(`write_targets: ["${owner}"]`, `write_targets: ["${owner}", "ui-ux/specification.md"]`);
  write(ticketPath, ticket);
  assert.equal(run(root).status, 0, run(root).stderr);
  assert.deepEqual(validateUiUxDesign(root).errors, []);
  write(ticketPath, ticket.replace(`"${owner}", "ui-ux/specification.md"`, `"system-model/missing-contract.md", "ui-ux/specification.md"`));
  assert.match(run(root).stderr, /write target does not resolve/);
});


for (const complexity of ["low", "medium", "high", "urgent", "", null, 2]) {
  test(`complexity validates the canonical classification: ${complexity}`, (context) => {
    const root = fixture();
    context.after(() => fs.rmSync(root, { recursive: true, force: true }));
    setup(root, { buildUnitsLine: '["BU-001"]', secondBuildUnit: false });
    const file = path.join(root, "build/workflow/tickets/example/sr-001/sr-001-tickets.yaml");
    const field = complexity === null ? "" : `    complexity: ${JSON.stringify(complexity)}\n`;
    write(file, fs.readFileSync(file, "utf8").replace('    complexity: "medium"\n', field));
    const result = run(root);
    const valid = ["low", "medium", "high"].includes(complexity);
    assert.equal(result.status, valid ? 0 : 1, result.stderr);
    if (!valid) assert.match(result.stderr, /complexity/);
  });
}
