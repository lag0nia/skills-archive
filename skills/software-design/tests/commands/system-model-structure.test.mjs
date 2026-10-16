#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const scriptsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "scripts");
const validator = path.join(scriptsRoot, "validate-software-design-structure.mjs");

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function packageFixture() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "software-design-v4-system-model-"));
  const root = path.join(workspace, "software-design");
  const brief = path.join(workspace, "software-brief.md");
  write(brief, "# Software Brief\n");
  write(path.join(root, "system-model", "architecture.md"), `---
type: system-architecture
design_format: 2
name: Example lifecycle system
assurance_id: "example-system"
domains: "core"
global_invariants: "INV-001"
security_boundaries: "None."
scope_boundaries: "None."
---

# System Architecture

## Purpose And Binding

Bind every action to one canonical example identity.

## Authority And Sources Of Truth

The Core Domain owns the canonical state.

## System Domains

| Domain | Purpose | System Responsibilities |
| --- | --- | --- |
| [Core](./domains/core/domain.md) | Core behavior | \`SR-001\` |

## Cross-Domain Boundaries

None.
`);
  write(path.join(root, "system-model", "domains", "core", "domain.md"), `---
type: system-domain
id: DOMAIN-core
name: Core Domain
responsibilities: "SR-001"
external_responsibilities: "None."
---

# Core Domain

## Purpose

Own the canonical example lifecycle.
`);
  write(path.join(root, "system-model", "domains", "core", "responsibilities", "sr-001-transition.md"), `---
type: system-responsibility
id: SR-001
name: Transition Responsibility
domain: core
depends_on: "None."
participates_in: "FLOW-001"
realized_by: "None."
---

# SR-001 — Transition Responsibility

## Purpose

Own the terminal transition.
`);
  write(path.join(root, "system-model", "behavior", "flows", "flow-001-complete.md"), `---
type: system-flow
id: FLOW-001
name: Complete Lifecycle
responsibilities: "SR-001"
contracts: "INV-001"
starts_when: The canonical subject is ready
ends_when: The terminal outcome is recorded
---

# FLOW-001 — Complete Lifecycle

## Purpose

Complete the lifecycle once.
`);
  write(path.join(root, "system-model", "contracts", "invariants", "inv-001-example.md"), structuredInvariantRecord());
  write(path.join(root, "system-model", "behavior", "lifecycle.yaml"), `lifecycle_version: 1
name: "Example Lifecycle"
initial_stage: "STAGE-001"
stages: [{"id":"STAGE-001","name":"Complete","flow":"FLOW-001","next":[],"terminal_outcome":"OUTCOME-001"}]
terminal_outcomes: [{"id":"OUTCOME-001","name":"Completed","meaning":"The canonical lifecycle is terminal."}]
invariants: ["INV-001"]
`);
  write(path.join(root, "README.md"), "# Software Design\n");
  return { workspace, root, brief };
}

function materialInterfaceRecord({ includeOutput = true } = {}) {
  return `---
type: system-interface
id: IFACE-001
name: Observe State
producers: "SR-001"
consumers: "SR-001"
flows: "FLOW-001"
related_contracts: "INV-001"
---

# IFACE-001 — Observe State

## Boundary

The consumer observes canonical state.

## Payload Or Artifact

The observation carries subject identity and current state.

## Material Interactions

<a id="act-001"></a>
### ACT-001 — Observe current state

**Kind:** \`state-observation\`

**Trigger or entry:** The consumer requests current state for one subject.

**Input:** The canonical subject identifier.

${includeOutput ? "**Output or observable result:** The current state or a distinct absence result.\n\n" : ""}**Access or authority:** The authorized participant may observe its subject.

**Failure and recovery:** Forbidden, stale, and unavailable remain distinct and retryable as specified.

**Risk:** \`ordinary\`

**Verification intent:** Exercise positive, absence, forbidden, and unavailable behavior from the consumer path.

## Preconditions And Validation

Validate subject identity and authority.

## Failure Meaning

Failure does not imply empty state.

## Must Not Imply

Observation does not grant mutation authority.
`;
}

function structuredInvariantRecord() {
  return `---
type: system-invariant
id: INV-001
name: Terminal Exclusivity
responsibilities: "SR-001"
flows: "FLOW-001"
related_contracts: "None."
---

# INV-001 — Terminal Exclusivity

## Rule

The lifecycle reaches exactly one terminal outcome.

## Scope

The rule applies to every terminal transition.

## Violation Meaning

A violation would permit conflicting terminal outcomes.

## Verification Obligations

<a id="inv-001.vo-001"></a>
### INV-001.VO-001 — Conflicting terminal outcomes are rejected

**Claim:** A subject cannot acquire a second terminal outcome.

**Required observation:** Every attempted second terminal transition is rejected and the first outcome remains authoritative.

**Risk:** \`high\`

**Evidence expectation:** Stateful behavioral evidence exercises the positive transition and conflicting replay.

**Boundary cases:** First transition, same-outcome retry, and conflicting-outcome retry.
`;
}

function structuredSecurityRecord({ coveredControl = "SEC-001.CONTROL-001", canonicalOwner = "[SR-001](../../domains/core/responsibilities/sr-001-transition.md) owns terminal transition authority." } = {}) {
  return `---
type: system-security-boundary
id: SEC-001
name: Transition Authority
responsibilities: "SR-001"
flows: "FLOW-001"
related_contracts: "INV-001"
---

# SEC-001 — Transition Authority

## Threats

<a id="sec-001.threat-001"></a>
### SEC-001.THREAT-001 — Unauthorized terminal transition

**Scenario:** An untrusted caller attempts to set a terminal outcome.

**Affected assets or authority:** The caller could illegitimately control lifecycle authority.

## Required Controls

<a id="sec-001.control-001"></a>
### SEC-001.CONTROL-001 — Authorize terminal writers

**Rule:** Only the canonical authority may commit a terminal transition.

**Mitigates:** \`SEC-001.THREAT-001\`

**Canonical owner:** ${canonicalOwner}

## Verification Obligations

<a id="sec-001.vo-001"></a>
### SEC-001.VO-001 — Unauthorized writers are denied

**Claim:** An unauthorized caller cannot commit a terminal transition.

**Covers:** \`SEC-001.THREAT-001\`, \`${coveredControl}\`

**Required observation:** The unauthorized attempt is denied and canonical state is unchanged.

**Risk:** \`high\`

**Evidence expectation:** Consumer-path behavioral evidence exercises authorized success, denial, and unavailable recovery.

**Boundary cases:** Authorized success, unauthorized denial, and authority-service unavailability.
`;
}

test("structure validation accepts the canonical system model", (context) => {
  const fixture = packageFixture();
  context.after(() => fs.rmSync(fixture.workspace, { recursive: true, force: true }));
  assert.equal(fs.existsSync(path.join(fixture.root, "views")), false);
  const validated = spawnSync(process.execPath, [validator, "--root", fixture.root], { encoding: "utf8" });
  assert.equal(validated.status, 0, validated.stderr);
});

test("structure validation names each retired-format leftover instead of accepting it", (context) => {
  const fixture = packageFixture();
  context.after(() => fs.rmSync(fixture.workspace, { recursive: true, force: true }));
  write(path.join(fixture.root, "diagrams", "build-unit-dependency-map.canvas"), "{\"nodes\":[],\"edges\":[]}\n");
  write(path.join(fixture.root, "build", "workflow", "technical-decisions.yaml"), "technical_decision_file_version: 1\ndecisions: []\n");
  const layout = spawnSync(process.execPath, [validator, "--root", fixture.root], { encoding: "utf8" });
  assert.equal(layout.status, 1);
  assert.match(layout.stderr, /^diagrams\/ is the retired Canvas lane; current views are generated HTML under visuals\//m);
  assert.match(layout.stderr, /^build\/workflow\/technical-decisions\.yaml is a retired Technical Decision registry/m);
  assert.doesNotMatch(layout.stderr, /outside the canonical package layout/);
  assert.doesNotMatch(layout.stderr, /^\s+at /m);

  fs.rmSync(path.join(fixture.root, "diagrams"), { recursive: true });
  fs.rmSync(path.join(fixture.root, "build"), { recursive: true });
  write(path.join(fixture.root, "system-model", "contracts", "scope", "scope-001-later.md"), `---
type: system-scope-boundary
id: SCOPE-001
name: Later capability
status: deferred
responsibilities: "SR-001"
decision: "TD-001"
---

# SCOPE-001 — Later Capability
`);
  const scope = spawnSync(process.execPath, [validator, "--root", fixture.root], { encoding: "utf8" });
  assert.equal(scope.status, 1);
  assert.match(scope.stderr, /scope-001-later\.md: scope decision pointers are retired with the Technical Decision registry/);
  assert.doesNotMatch(scope.stderr, /^\s+at /m);
});

function stateRecord(id, slug, body) {
  return `---
type: system-state
id: ${id}
name: ${slug}
authority: "SR-001"
flows: "FLOW-001"
---

# ${id} — ${slug}

${body}`;
}

test("structure validation reads every canonical state table's Terminal value, drawn or not", (context) => {
  const fixture = packageFixture();
  context.after(() => fs.rmSync(fixture.workspace, { recursive: true, force: true }));
  const states = path.join(fixture.root, "system-model", "contracts", "states");
  write(path.join(states, "state-001-account.md"), stateRecord("STATE-001", "Account", `## Account States

| State | Meaning | Terminal |
| --- | --- | --- |
| Open | Usable. | No |
| Closed | Kept for audit; reopened only by an explicit recovery transition. | Yes |

## Per-Intent States

| Intent state or disposition | Meaning | Account effect | Terminal |
| --- | --- | --- | --- |
| Recorded | Stored before signing. | None. | No |
| Reconciliation blocked | No safe disposition. | Account stays blocked until explicit recovery or decision. | Yes |

## Transitions

| From | Event or fact | Authority | To | Rejection or guard |
| --- | --- | --- | --- | --- |
| Open | Owner closes | \`SR-001\` | Closed | Yes |

## Closure Catalogue

| Closure reason | Owner | Reversible | Noted |
| --- | --- | --- | --- |
| Owner request | \`SR-001\` | Sí | Yesterday |
`));
  const valid = spawnSync(process.execPath, [validator, "--root", fixture.root], { encoding: "utf8" });
  assert.equal(valid.status, 0, valid.stderr);

  write(path.join(states, "state-002-obra.md"), stateRecord("STATE-002", "Obra", `## States

| State | Meaning | Terminal |
| --- | --- | --- |
| Abierta | Admite todo | No |
| Certificada | Incluida en una certificación emitida | Sí, salvo cantidad devuelta por rectificativa |
| Cerrada | Cerrada con pendientes | No; se reabre con motivo |
| Validada | Inmutable | Sí |
| Ayer | Prueba | Yesterday |
| Vacía | Sin valor |  |

## Sub-states

| State | Meaning |
| --- | --- |
| Retenida | Registrada sin imputar |

## Transitions

| From | Event or fact | Authority | To | Rejection or guard |
| --- | --- | --- | --- | --- |
| Abierta | Cierre | \`SR-001\` | Cerrada | Garbage |
`));
  const invalid = spawnSync(process.execPath, [validator, "--root", fixture.root], { encoding: "utf8" });
  assert.equal(invalid.status, 1);
  const lines = invalid.stderr.trim().split("\n");
  const place = (row) => `state-002-obra.md: state table under "States", row ${row}`;
  for (const [row, state, value] of [[2, "Certificada", '"Sí, salvo cantidad devuelta por rectificativa"'], [3, "Cerrada", '"No; se reabre con motivo"'], [4, "Validada", '"Sí"'], [5, "Ayer", '"Yesterday"'], [6, "Vacía", "a blank cell"]]) {
    assert.ok(lines.some((line) => line.endsWith(`${place(row)} (${state}): Terminal must be exactly Yes or No, found ${value}. Write conditions, qualifications and reopening rules in Meaning, the transitions or Observation And Finality.`)), invalid.stderr);
  }
  assert.ok(lines.some((line) => line.endsWith('state-002-obra.md: state table under "Sub-states" has no Terminal column; a state table needs exactly one Terminal column whose cells are Yes or No.')), invalid.stderr);
  assert.equal(lines.filter((line) => /Terminal/.test(line)).length, 6, "transition rows, unrelated tables and valid rows are not reported");
  assert.doesNotMatch(invalid.stderr, /state-001-account\.md/);
  assert.doesNotMatch(invalid.stderr, /^\s+at /m);
});

test("structure validation accepts and routes the conditional UI/UX Design lane", (context) => {
  const fixture = packageFixture();
  context.after(() => fs.rmSync(fixture.workspace, { recursive: true, force: true }));
  const skillRoot = path.resolve(scriptsRoot, "..");
  const uiRoot = path.join(fixture.root, "ui-ux");
  fs.mkdirSync(uiRoot, { recursive: true });
  fs.copyFileSync(path.join(skillRoot, "references", "ui-ux", "templates", "specification.md"), path.join(uiRoot, "specification.md"));
  fs.copyFileSync(path.join(skillRoot, "references", "ui-ux", "templates", "index.html"), path.join(uiRoot, "index.html"));
  fs.mkdirSync(path.join(uiRoot, "alternatives", "main"), { recursive: true });
  fs.copyFileSync(path.join(skillRoot, "references/ui-ux/templates/candidate.html"), path.join(uiRoot, "alternatives/main/index.html"));
  write(path.join(fixture.root, "README.md"), "# Software Design\n\n- [UI/UX Design](./ui-ux/specification.md)\n");
  const validated = spawnSync(process.execPath, [validator, "--root", fixture.root], { encoding: "utf8" });
  assert.equal(validated.status, 0, validated.stderr);
});

test("structure validation rejects an unlinked UI/UX Design lane", (context) => {
  const fixture = packageFixture();
  context.after(() => fs.rmSync(fixture.workspace, { recursive: true, force: true }));
  const skillRoot = path.resolve(scriptsRoot, "..");
  const uiRoot = path.join(fixture.root, "ui-ux");
  fs.mkdirSync(uiRoot, { recursive: true });
  fs.copyFileSync(path.join(skillRoot, "references", "ui-ux", "templates", "specification.md"), path.join(uiRoot, "specification.md"));
  fs.copyFileSync(path.join(skillRoot, "references", "ui-ux", "templates", "index.html"), path.join(uiRoot, "index.html"));
  fs.mkdirSync(path.join(uiRoot, "alternatives", "main"), { recursive: true });
  fs.copyFileSync(path.join(skillRoot, "references/ui-ux/templates/candidate.html"), path.join(uiRoot, "alternatives/main/index.html"));
  const validated = spawnSync(process.execPath, [validator, "--root", fixture.root], { encoding: "utf8" });
  assert.notEqual(validated.status, 0);
  assert.match(validated.stderr, /must link directly to ui-ux\/specification\.md as UI\/UX Design/);
});

test("structure validation accepts structured invariant and security Verification Obligations", (context) => {
  const fixture = packageFixture();
  context.after(() => fs.rmSync(fixture.workspace, { recursive: true, force: true }));
  write(path.join(fixture.root, "system-model", "contracts", "invariants", "inv-001-example.md"), structuredInvariantRecord());
  write(path.join(fixture.root, "system-model", "contracts", "security", "sec-001-transition-authority.md"), structuredSecurityRecord());
  const validated = spawnSync(process.execPath, [validator, "--root", fixture.root], { encoding: "utf8" });
  assert.equal(validated.status, 0, validated.stderr);
});

test("structure validation rejects a security VO that covers an unknown control", (context) => {
  const fixture = packageFixture();
  context.after(() => fs.rmSync(fixture.workspace, { recursive: true, force: true }));
  write(path.join(fixture.root, "system-model", "contracts", "invariants", "inv-001-example.md"), structuredInvariantRecord());
  write(path.join(fixture.root, "system-model", "contracts", "security", "sec-001-transition-authority.md"), structuredSecurityRecord({ coveredControl: "SEC-001.CONTROL-999" }));
  const validated = spawnSync(process.execPath, [validator, "--root", fixture.root], { encoding: "utf8" });
  assert.notEqual(validated.status, 0);
  assert.match(validated.stderr, /covers unknown local control SEC-001\.CONTROL-999/);
  assert.match(validated.stderr, /SEC-001\.CONTROL-001 is not covered by any Verification Obligation/);
});

test("structure validation rejects malformed structured assurance headings instead of ignoring them", (context) => {
  const fixture = packageFixture();
  context.after(() => fs.rmSync(fixture.workspace, { recursive: true, force: true }));
  write(path.join(fixture.root, "system-model", "contracts", "invariants", "inv-001-example.md"), structuredInvariantRecord().replaceAll("INV-001.VO-001", "INV-001.VO-01"));
  const validated = spawnSync(process.execPath, [validator, "--root", fixture.root], { encoding: "utf8" });
  assert.notEqual(validated.status, 0);
  assert.match(validated.stderr, /unexpected or malformed ### heading in Verification Obligations/);
});

test("structured Verification Obligations require one Architecture-owned assurance id", (context) => {
  const fixture = packageFixture();
  context.after(() => fs.rmSync(fixture.workspace, { recursive: true, force: true }));
  const architecturePath = path.join(fixture.root, "system-model", "architecture.md");
  write(architecturePath, fs.readFileSync(architecturePath, "utf8").replace('assurance_id: "example-system"', 'assurance_id: "None."'));
  write(path.join(fixture.root, "system-model", "contracts", "invariants", "inv-001-example.md"), structuredInvariantRecord());
  const validated = spawnSync(process.execPath, [validator, "--root", fixture.root], { encoding: "utf8" });
  assert.notEqual(validated.status, 0);
  assert.match(validated.stderr, /assurance_id must be a stable lowercase slug/);
});

test("structure validation requires a control owner link that resolves to a canonical System Model record", (context) => {
  const fixture = packageFixture();
  context.after(() => fs.rmSync(fixture.workspace, { recursive: true, force: true }));
  write(path.join(fixture.root, "system-model", "contracts", "security", "sec-001-transition-authority.md"), structuredSecurityRecord({
    canonicalOwner: "[SR-999](../../domains/core/responsibilities/sr-999-missing.md) owns terminal transition authority.",
  }));
  const validated = spawnSync(process.execPath, [validator, "--root", fixture.root], { encoding: "utf8" });
  assert.notEqual(validated.status, 0);
  assert.match(validated.stderr, /Canonical owner must contain exactly one local link to a canonical System Model record/);
});

test("lifecycle validation rejects a stage without a terminal path", (context) => {
  const fixture = packageFixture();
  context.after(() => fs.rmSync(fixture.workspace, { recursive: true, force: true }));
  write(path.join(fixture.root, "system-model", "behavior", "lifecycle.yaml"), `lifecycle_version: 1
name: "Example Lifecycle"
initial_stage: "STAGE-001"
stages: [{"id":"STAGE-001","name":"Loop","flow":"FLOW-001","next":["STAGE-001"],"terminal_outcome":null}]
terminal_outcomes: [{"id":"OUTCOME-001","name":"Completed","meaning":"The canonical lifecycle is terminal."}]
invariants: ["INV-001"]
`);
  const validated = spawnSync(process.execPath, [validator, "--root", fixture.root], { encoding: "utf8" });
  assert.notEqual(validated.status, 0);
  assert.match(validated.stderr, /STAGE-001 cannot reach a terminal outcome/);
});

test("structure validation accepts a complete material interaction contract", (context) => {
  const fixture = packageFixture();
  context.after(() => fs.rmSync(fixture.workspace, { recursive: true, force: true }));
  write(path.join(fixture.root, "system-model", "contracts", "interfaces", "iface-001-observe-state.md"), materialInterfaceRecord());
  const validated = spawnSync(process.execPath, [validator, "--root", fixture.root], { encoding: "utf8" });
  assert.equal(validated.status, 0, validated.stderr);
});

test("structure validation rejects an incomplete material interaction contract", (context) => {
  const fixture = packageFixture();
  context.after(() => fs.rmSync(fixture.workspace, { recursive: true, force: true }));
  write(path.join(fixture.root, "system-model", "contracts", "interfaces", "iface-001-observe-state.md"), materialInterfaceRecord({ includeOutput: false }));
  const validated = spawnSync(process.execPath, [validator, "--root", fixture.root], { encoding: "utf8" });
  assert.notEqual(validated.status, 0);
  assert.match(validated.stderr, /ACT-001 is missing \*\*Output or observable result:\*\*/);
});

test("structure validation accepts a concrete passive-boundary None disposition", (context) => {
  const fixture = packageFixture();
  context.after(() => fs.rmSync(fixture.workspace, { recursive: true, force: true }));
  write(path.join(fixture.root, "system-model", "contracts", "interfaces", "iface-001-passive-artifact.md"), `---
type: system-interface
id: IFACE-001
name: Passive Artifact
producers: "SR-001"
consumers: "SR-001"
flows: "FLOW-001"
related_contracts: "INV-001"
---

# IFACE-001 — Passive Artifact

## Material Interactions

**Material interactions:** \`None.\` — The boundary transfers one passive immutable artifact and exposes no independently invocable or observable operation.
`);
  const validated = spawnSync(process.execPath, [validator, "--root", fixture.root], { encoding: "utf8" });
  assert.equal(validated.status, 0, validated.stderr);
});

test("templates keep global contract navigation in the root index", () => {
  const skillRoot = path.resolve(scriptsRoot, "..");
  const rootTemplate = fs.readFileSync(path.join(skillRoot, "assets", "templates", "README.md"), "utf8");
  const architectureTemplate = fs.readFileSync(path.join(skillRoot, "assets", "templates", "system-model", "architecture.md"), "utf8");
  assert.match(rootTemplate, /### Global Contract Routes/);
  assert.match(rootTemplate, /\[Invariants\]\(\.\/system-model\/contracts\/invariants\//);
  assert.match(rootTemplate, /\[Security Boundaries\]\(\.\/system-model\/contracts\/security\//);
  assert.match(rootTemplate, /\[Scope Boundaries\]\(\.\/system-model\/contracts\/scope\//);
  assert.doesNotMatch(architectureTemplate, /Global Contract Routes/);
  assert.doesNotMatch(architectureTemplate, /Parameter Owners|Vocabulary/);
});

for (const [kind, file, content] of [
  ["invariants", "inv-001-example.md", structuredInvariantRecord],
  ["security", "sec-001-transition-authority.md", structuredSecurityRecord],
]) {
  test(`omitting Verification Obligations from ${kind} fails current-format validation`, (context) => {
    const fixture = packageFixture();
    context.after(() => fs.rmSync(fixture.workspace, { recursive: true, force: true }));
    write(path.join(fixture.root, "system-model", "contracts", kind, file), content().split("## Verification Obligations")[0]);
    const result = spawnSync(process.execPath, [validator, "--root", fixture.root], { encoding: "utf8" });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /missing ## Verification Obligations/);
  });
}

test("omitting Material Interactions cannot bypass interface validation", (context) => {
  const fixture = packageFixture();
  context.after(() => fs.rmSync(fixture.workspace, { recursive: true, force: true }));
  write(path.join(fixture.root, "system-model/contracts/interfaces/iface-001-observe.md"), materialInterfaceRecord().replace(/## Material Interactions[\s\S]*?(?=## Preconditions)/, ""));
  const result = spawnSync(process.execPath, [validator, "--root", fixture.root], { encoding: "utf8" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /missing ## Material Interactions/);
});
