#!/usr/bin/env node

import { expectedKnownConsumerCoverage } from "../../scripts/lib/validation/build-design-and-delivery-readiness.mjs";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { writeDeliverySnapshot } from "../../scripts/lib/delivery-snapshot.mjs";

const skillRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");
const buildValidator = path.join(skillRoot, "scripts", "validate-build-design.mjs");
const deliveryValidator = path.join(skillRoot, "scripts", "validate-delivery-readiness.mjs");
const sequenceValidator = path.join(skillRoot, "scripts", "validate-handoff-sequence.mjs");

const DEFAULT_COMPATIBILITY_REVIEW = `**Shared-producer surface closure:** \`PASS\` — [BU-001](../../units/bu-001-example-unit.md) proves the target-version surface is bounded to this isolated unit.

**Contract-change placement:** \`PASS\` — [BU-001](../../units/bu-001-example-unit.md) owns the selected implementation boundary.

**Fan-out and evolution:** \`PASS\` — [BU-001](../../units/bu-001-example-unit.md) proves no multi-consumer evolution choice applies.

**Physical compatibility preflight:** \`PASS\` — PSEAM-001 confirms compatibility; [BU-001](../../units/bu-001-example-unit.md) names the shipped package entrypoint and deterministic verification procedure.

**Affected-slice propagation:** \`PASS\` — [Handoff Sequence](./README.md) proves only the selected slice is affected.

### Known Consumer Compatibility Coverage

**Known consumer coverage:** \`None.\` — [Handoff Sequence](./README.md) and [BU-001](../../units/bu-001-example-unit.md) prove no independently delivered mapped consumer is in the bounded cohort.

### Bounded Diagnostic Sweep

**Selected cohort:** [Handoff Sequence](./README.md) and [BU-001](../../units/bu-001-example-unit.md) define the complete bounded cohort.

**Initial finite inventory:** [Handoff Sequence](./README.md) and [BU-001](../../units/bu-001-example-unit.md) freeze the selected slice, direct prerequisites, required commands, and directly affected surfaces.

**Direct-dependency additions:** \`None.\`

**Independent probes:** \`COMPLETE\` — [BU-001](../../units/bu-001-example-unit.md) records every safe independent probe.

**Dependency-blocked probes:** \`None.\`

**Root-cause groups:** \`None.\`

**Zero-new-blocker pass:** \`PASS\` — [BU-001](../../units/bu-001-example-unit.md) records the complete rerun with zero new blockers.

**Frozen-inventory termination:** \`PASS\` — [BU-001](../../units/bu-001-example-unit.md) records that the same frozen inventory completed without an unexplained new item.

`;

function fixture() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "software-design-readiness-"));
}

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function run(validator, root, handoff = null) {
  const args = [validator, "--root", root];
  if (handoff) args.push("--handoff", handoff);
  return spawnSync(process.execPath, args, { encoding: "utf8" });
}

function runPlannableSequence(root, handoff) {
  return spawnSync(process.execPath, [
    sequenceValidator,
    "--root",
    root,
    "--handoff",
    handoff,
    "--assert-plannable",
  ], { encoding: "utf8" });
}

function refreshSnapshot(root) {
  const handoffPath = path.join(root, "build", "workflow", "handoffs", "repo-001-example-slice.md");
  writeDeliverySnapshot({ root, handoffPath });
  return handoffPath;
}

function createReadyFixture(root, { withSelection = true, withVerification = true } = {}) {
  write(path.join(root, "README.md"), `# Example Software Design

- [System Model](./system-model/architecture.md)
- [Build Design](./build/README.md)
`);
  write(path.join(root, "system-model", "architecture.md"), `---
type: system-architecture
name: Example system
domains: "example"
global_invariants: "None."
security_boundaries: "None."
scope_boundaries: "None."
---

# System Architecture
`);
  write(path.join(root, "system-model", "domains", "example", "domain.md"), `---
type: system-domain
id: DOMAIN-example
name: Example Domain
responsibilities: "SR-001"
external_responsibilities: "None."
---

# Example Domain
`);
  write(path.join(root, "system-model", "domains", "example", "responsibilities", "sr-001-example.md"), `---
type: system-responsibility
id: SR-001
name: Example Responsibility
domain: example
depends_on: "None."
participates_in: "None."
realized_by: "BU-001"
---

# SR-001 — Example Responsibility
`);

  write(path.join(root, "build", "README.md"), `# Build

This is the detailed construction guide for the example system.

## Construction At A Glance

### [REPO-001 — Example Workspace](./repositories/repo-001-example-workspace/README.md)

The repository contains one independently buildable application package at \`packages/example\` and the root tooling that verifies and releases it. They share source control because the workspace policy, lockfile, and release command must evolve with the package, while the Build Unit still keeps its own public artifact and deterministic test boundary.

#### [BU-001 — Example Unit](./units/bu-001-example-unit.md)

The unit produces the example application at \`packages/example\`. It is independently buildable and testable, has no Build Unit dependency or material external interaction, and connects only to the repository's root command and policy surfaces. It is separate from workspace tooling because it owns the public package artifact, and it deliberately excludes release authority and participant secret custody.
`);
  write(path.join(root, "build", "architecture.md"), `# Codebase Architecture

## System Codebase Shape

One repository contains one independently buildable package.

## Build Unit Map

[BU-001](./units/bu-001-example-unit.md) realizes SR-001.

## Responsibility Disposition

Every System Responsibility is mapped reciprocally to its Build Unit.

## Cross-Unit Boundaries

There are no cross-unit boundaries in this isolated fixture.

## Shared Environments And Commands

The workspace uses one deterministic test environment.

## Cross-Unit Local Discretion

None.

## Repository Map

[REPO-001](./repositories/repo-001-example-workspace/README.md) contains BU-001.

## Verification Architecture

The reusable integration harness proves the selected public behavior.
`);
  write(path.join(root, "build", "units", "bu-001-example-unit.md"), `---
type: build-unit
id: BU-001
name: Example Unit
kind: application
source_responsibilities: "SR-001"
depends_on_build_units: "None."
repository: "REPO-001"
code_path: "packages/example"
repository_disposition: "None."
technical_constraints: "CONS-001"
ui_ux_applicability: "not-applicable"
ui_ux_disposition: "This package exposes a programmatic API and has no maintained human-facing surface."
---

# BU-001 — Example Unit

## Build Unit Overview

This unit produces the independently buildable example application at \`packages/example\`. It has its own build and test boundary, depends on no other Build Unit, and deliberately owns no participant secrets.

### Detailed Code Shape

\`\`\`text
packages/example/
├── src/index.ts
├── src/application.ts
└── test/application.test.ts
\`\`\`

The package exposes one public entry point backed by a small application module and an isolated adapter boundary.

## Agent-First Canonical Reference

### Artifact And Code Location

The application package lives at \`packages/example\` in REPO-001.

### Applicable Technical Constraints

[CONS-001](../records/constraints/cons-001-no-secret-custody.md) applies to the public package boundary.

### Source Responsibility Mapping

This unit realizes [SR-001](../../system-model/domains/example/responsibilities/sr-001-example.md).

### Interfaces And Dependencies

No external or cross-Build-Unit dependency exists.

### Material Interaction Bindings

**Material interaction bindings:** \`None.\` — This isolated unit has no material cross-Build-Unit or external interaction.

### Module Architecture

The public entry point delegates to one application module and one isolated adapter.

### Commands And Verification

Run \`npm test\` to exercise the deterministic package and integration checks.

### Local Discretion

Small helper placement remains local when it does not change the public seam.
`);
  write(path.join(root, "build", "records", "constraints", "cons-001-no-secret-custody.md"), `---
type: technical-constraint
id: CONS-001
title: No secret custody
technical_sources: "SR-001"
affected_responsibilities: "SR-001"
source_tickets: "None."
---

# CONS-001 — No secret custody

## Rule

The unit must not retain a participant secret.

## Scope And Sources

The rule applies to the public package boundary and is sourced from SR-001.

## Verification Intent

Use negative package-boundary checks.
`);
  write(path.join(root, "build", "repositories", "repo-001-example-workspace", "README.md"), `---
type: repository-build-design
id: REPO-001
name: Example Workspace
member_build_units: "BU-001"
technical_constraints: "CONS-001"
discovery_status: complete
discovery_blockers: "None."
---

# REPO-001 — Example Workspace

## Repository Overview

This repository contains the example application at \`packages/example\` together with root tooling and release configuration. BU-001 remains independently buildable and testable while sharing source control with that workspace policy.

### Material Workspace Tree

\`\`\`text
repo-root/
├── package.json
├── package-lock.json
└── packages/example/
\`\`\`

\`packages/example\` contains BU-001; root files contain workspace commands and policy.

## Agent-First Canonical Reference

### Repository And Workspace Shape

One source repository contains one application package.

### Member Build Units

BU-001 is the only published package.

### Applicable Technical Constraints

[CONS-001](../../records/constraints/cons-001-no-secret-custody.md) applies to BU-001.

### Repository Constraints

RC-001: public imports use the package entry point; verify this with a dependency-boundary check.

### Version-Control And Generated-File Policy

**Must track:** Source, manifests, lockfiles, workflows, fixtures, and reviewed evidence.

**Must ignore:** Dependencies, build output, coverage, reports, caches, logs, OS metadata, and local environment files.

**Generated-output disposition:** Generated build products remain untracked; reviewed fixtures remain tracked.

**Secret/template rule:** Secret-bearing files remain local; a redacted example may be committed.

**Verification:** Run the repository hygiene verifier through the aggregate verification command.

### Repository Contract Coverage

- \`repository-module-conventions\`: \`resolved\` — Source: [TICKET-0001](../../workflow/tickets/example/sr-001/sr-001-tickets.yaml#ticket-0001).
- \`code-construction-public-api\`: \`resolved\` — Source: [TICKET-0001](../../workflow/tickets/example/sr-001/sr-001-tickets.yaml#ticket-0001).
- \`maintainability-agent-guidance\`: \`resolved\` — Source: [TICKET-0001](../../workflow/tickets/example/sr-001/sr-001-tickets.yaml#ticket-0001).

### Agent Guidance Projection

**Derived artifact:** [REPO-001 agent guidance](./agent-guidance.md)

**Repository root target:** \`AGENTS.md\`

### Commands, Release, And Verification

Run \`npm test\` before release.

### Discovery Status

Repository discovery is complete for the selected shape.

### Local Discretion

Small helper placement remains local.
`);
  write(path.join(root, "build", "repositories", "repo-001-example-workspace", "agent-guidance.md"), `# REPO-001 — Repository Agent Guidance

Baseline: \`maintainability-agent-guidance-baseline\`

## Canonical Sources

- Repository Build Design: [REPO-001](./README.md)
- Source ticket: [TICKET-0001](../../workflow/tickets/example/sr-001/sr-001-tickets.yaml#ticket-0001)

## Hard Rules

Public imports use the package entry point.

## Defaults And Exception Guidance

Keep behavior local until a stable boundary has multiple real consumers.

## Rationale Comments

Explain non-obvious repository choices at their closest durable location.

## Stop And Escalate

Stop before changing public seams, security boundaries, or release behavior.

## Verification Expectations

Run the dependency-boundary check and repository test command.
`);

  if (withSelection) {
    write(path.join(root, "build", "records", "selections", "sel-001-runtime.md"), `---
type: implementation-selection
id: SEL-001
title: Runtime
state: Approved
technical_sources: "SR-001"
affected_scopes: "BUILD_UNIT:BU-001"
source_tickets: "TICKET-0001"
inheritance_evidence: "None."
needed_before: Delivery Planning
---

# SEL-001 — Runtime

## Affected Scopes

This selection affects BU-001.

## Options And Consequences

The selected runtime is compared with the supported alternative.

## Selected Or Inherited Direction

Use the approved runtime.

## Planning And Verification Impact

The selection fixes the build and test command family.
`);
  }
  if (withVerification) {
    write(path.join(root, "build", "records", "verification", "va-001-local-integration-harness.md"), `# VA-001 — Local integration harness

**State:** \`Planned — unverified\`
**Technical sources:** \`SR-001\`
**Source tickets:** \`TICKET-0001\`
**Existing-capability evidence:** \`None.\`
**Affected scopes:** \`BUILD_UNIT:BU-001\`
**Verification obligations it can support:** The Build Unit integrates through its approved boundary.
**Prerequisites, actors, and services:** Local service and deterministic dependency.
**Fixtures and scenario inputs:** Deterministic fixture.
**Setup and reset/isolation:** Fresh isolated state per run.
**Canonical or planned commands:** \`npm test\`
**Expected evidence types:** Command output and integration trace.
**Limitations:** Does not prove production provider availability.
`);
  }

  const resultRefs = [withSelection ? "SEL-001" : null, withVerification ? "VA-001" : null].filter(Boolean);
  const writeTargets = [
    withSelection ? "build/records/selections/sel-001-runtime.md" : null,
    withVerification ? "build/records/verification/va-001-local-integration-harness.md" : null,
  ].filter(Boolean);
  write(path.join(root, "build", "workflow", "tickets", "example", "sr-001", "sr-001-tickets.yaml"), `ticket_file_version: 3
scope: "responsibility:SR-001"

tickets:
  - id: "TICKET-0001"
    title: "Choose the public package seam"
    status: "finished"
    kind: "technical"
    complexity: "medium"
    concern: "interface-api"
    owner: "SR-001"
    affects: ["SR-001"]
    build_units: ["BU-001"]
    build_unit_disposition: null
    cluster: "public-api"
    parent_decision: null
    question: "Which public seam will the implementation expose?"
    context: "The logical responsibility is fixed and the code-facing seam has been selected."
    options: []
    recommendation: "Use the selected typed interface."
    resolution: "Use the selected typed interface."
    current_shape: null
    result_refs: ${JSON.stringify(resultRefs)}
    constraint_refs: []
    repositories: ["REPO-001"]
    repository_contract_area: null
    depends_on: []
    write_targets: ${JSON.stringify(writeTargets)}
`);

  const selectionReference = withSelection ? "[SEL-001](../../records/selections/sel-001-runtime.md)" : "`None.`";
  const verificationReference = withVerification ? "[VA-001](../../records/verification/va-001-local-integration-harness.md)" : "`None.`";
  write(path.join(root, "build", "workflow", "handoffs", "repo-001-example-slice.md"), `# Delivery Planning Handoff

**Sequence index:** [Handoff Sequence](./README.md)

## Readiness Outcome

**Outcome:** \`IMPLEMENTATION_DETAILS_READY\`

**Snapshot ID:** \`sha256:pending\`

## Allowed Delivery Slice

**Selected build units:** \`BUILD_UNIT:BU-001\`

**Target outcome:** [BU-001](../../units/bu-001-example-unit.md) — a package consumer can invoke the selected public entrypoint and observe the accepted result.

**Runtime-profile claims:** [BU-001](../../units/bu-001-example-unit.md) — artifact consumer: \`runnable use\`; deployment and activated operation are excluded.

## Selected Or Inherited Implementation Shape

BU-001 uses the approved runtime in REPO-001 with the deterministic integration harness.

## Required Input Ledger

### \`INPUT-001\` — Deterministic verification fixture

**Consumer:** \`BUILD_UNIT:BU-001\`

**Consumed at:** \`Verification\`

**Input kind:** \`Fixture\`

**Produced by:** \`External\`

**Producer repository:** \`External\`

**Produced at:** \`Existing\`

**Availability:** \`verified existing input\`

**Maturity:** \`verified\`

**Evidence:** [Build Unit fixture contract](../../units/bu-001-example-unit.md)

**Later-lifecycle gate:** \`None.\`

**Artifact identity:** \`None.\`

**Source revision:** \`None.\`

**Integrity:** \`None.\`

**Resolution check:** \`None.\`

**Authorized access check:** \`None.\`

## Required Interaction Closure

**Required interactions:** \`None.\` — [Build Unit interaction boundary](../../units/bu-001-example-unit.md)

## Delivery Slice Realizability Review

**Review result:** \`PASS\`

**Source consistency:** \`PASS\` — [BU-001](../../units/bu-001-example-unit.md) and [SR-001](../../../system-model/domains/example/responsibilities/sr-001-example.md) agree; an excluded-authority scenario was checked.

**Required-input closure:** \`PASS\` — INPUT-001 is the verified deterministic fixture in [BU-001](../../units/bu-001-example-unit.md); the temporal graph is acyclic.

**Interaction closure:** \`PASS\` — [BU-001](../../units/bu-001-example-unit.md) declares no material cross-unit or external interaction.

**Toolchain realizability:** \`PASS\` — [REPO-001](../../repositories/repo-001-example-workspace/README.md) records the compatible command family.

**Responsibility projection:** \`PASS\` — [BU-001](../../units/bu-001-example-unit.md) maps SR-001 and its public seam.

**Verification adequacy:** \`PASS\` — [VA-001 or local checks](../../units/bu-001-example-unit.md) own the required evidence.

**Execution-context readiness:** \`PASS\` — [REPO-001](../../repositories/repo-001-example-workspace/README.md) binds the selected artifact and environment.

**Target-outcome closure:** \`PASS\` — [BU-001](../../units/bu-001-example-unit.md) owns the real public entrypoint, representative consumer invocation, and observable result.

${DEFAULT_COMPATIBILITY_REVIEW}**Review blockers:** \`None.\`

## Build Unit Routing Index

### \`BUILD_UNIT:BU-001\`

**Readiness:** \`READY\`

**Canonical sources:** [BU-001](../../units/bu-001-example-unit.md); [SR-001](../../../system-model/domains/example/responsibilities/sr-001-example.md)

**Repository Build Design:** [REPO-001](../../repositories/repo-001-example-workspace/README.md)

**Technical constraints:** [CONS-001](../../records/constraints/cons-001-no-secret-custody.md)

**Repository membership disposition:** Full repository.

**Implementation selections:** ${selectionReference}

**Verification references:** ${verificationReference}

**Dependencies:** \`None.\`

**Mapped tickets:** \`TICKET-0001\`

**Blockers:** \`None.\`

## Protected Technical Boundaries

[SR-001](../../../system-model/domains/example/responsibilities/sr-001-example.md) and [CONS-001](../../records/constraints/cons-001-no-secret-custody.md) define the authority boundary.

## Cross-Unit Integration And Verification

Run the planned [BU-001 checks](../../units/bu-001-example-unit.md) and linked verification capability.

## Exclusions And Local Discretion

[BU-001](../../units/bu-001-example-unit.md) records the reversible local choices; no unresolved capability is included.
`);
  write(path.join(root, "build", "workflow", "handoffs", "README.md"), `# Handoff Sequence

**Current order group:** \`1\`

Finish every slice in group N before starting group N+1. Slices inside one group may proceed in parallel.

| Order group | Delivery slice | Repository | Build Units | Requires | State |
| ---: | --- | --- | --- | --- | --- |
| 1 | [repo-001-example-slice](./repo-001-example-slice.md) | \`REPO-001\` | \`BU-001\` | \`None.\` | \`Ready\` |
`);

  addPhysicalRealizability(root);
  return refreshSnapshot(root);
}

function configureUiDelivery(root, {
  surface = "consumer",
  outcome = "IMPLEMENTATION_DETAILS_READY",
  walkthrough = "`Reviewed — no unresolved usability blockers` — Walkthrough accepted for the selected states.",
  consistency = "`PASS` — The prototype, requirements, Build Unit, and handoff agree.",
} = {}) {
  const unitPath = path.join(root, "build", "units", "bu-001-example-unit.md");
  let unit = fs.readFileSync(unitPath, "utf8")
    .replace('ui_ux_applicability: "not-applicable"', 'ui_ux_applicability: "applicable"')
    .replace('ui_ux_disposition: "This package exposes a programmatic API and has no maintained human-facing surface."', `ui_ux_disposition: "Human-facing ${surface} interface covered by the reviewed UI/UX Design."`)
    .replace("### Material Interaction Bindings", `### UI/UX Realization

[UI/UX specification](../../ui-ux/specification.md) and [reviewed prototype](../../ui-ux/alternatives/main/index.html) cover the ${surface} journey. The application module owns presentation and interaction; canonical Software Design retains system behavior. Representative records are fake data, and cosmetic details remain implementation discretion.

### Material Interaction Bindings`);
  write(unitPath, unit);

  write(path.join(root, "ui-ux", "specification.md"), `# UI/UX Design

## Scope And Ownership
The ${surface} surface owns presentation and interaction; Software Design owns system behavior.

## Intended Users And Main Tasks
The intended ${surface} user completes the primary task and recovers from a failed attempt.

## Design Rationale
The user starts from a task list, reviews the decision-relevant information, and completes one clear action. Immediate consequences stay with the decision; recovery detail appears only after failure. A familiar review-and-confirm pattern fits because the action changes a persistent preference.

## Prototype Alternatives And Selection
**Selected implementation target:** \`./alternatives/main/index.html\`.

## Product And Demo Boundary
Product behavior follows Software Design. Named records in the prototype are representative fake data.

## Journey And Route Coverage
<a id="journey-main"></a>The main route covers first use and a returning-user retry.

## State Coverage
The walkthrough covers empty, waiting, success, error, and recovery states proportionately.

## Interaction And Content Rules
User-oriented labels expose one clear primary action and preserve decision-relevant detail.

## Responsive And Accessibility Expectations
The surface uses semantic controls, visible focus, keyboard operation, and responsive layout.

## Prototype Review
[Open the reviewed interactive prototype](./alternatives/main/index.html). The walkthrough has no unresolved usability blockers.

| Journey | Review result | Evidence and limitations |
| --- | --- | --- |
| [Main](#journey-main) | Reviewed | Browser interaction and viewport inspection; canonical requirements reconciled. |

## Change Synchronization
None.
`);
  write(path.join(root, "ui-ux", "prototype.html"), fs.readFileSync(path.join(skillRoot, "references/ui-ux/templates/prototype.html"), "utf8"));
  write(path.join(root, "ui-ux", "alternatives", "main", "index.html"), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${surface} prototype</title></head>
<body data-demo-only="Representative fake data"><p data-prototype-disclosure>Prototype with fake records.</p><main data-product-surface data-prototype-state="empty"><h1>${surface} workspace</h1><p>See https://example.test/help for the displayed support address.</p><a href="https://example.com/policy">Open policy</a><button type="button" data-product-action data-action-target="success">Complete task</button><button type="button" data-cancel-action data-action-target="cancelled">Cancel</button><section data-product-outcome><h2>Task complete</h2><button type="button" data-next-step data-action-target="empty">Return</button></section><button type="button" data-recovery-action data-action-target="empty">Try again</button></main><details data-prototype-reviewer><summary>Reviewer tools</summary><select data-review-actor><option>Fake user</option></select><button type="button" data-review-state-target="empty">Empty</button><button type="button" data-review-state-target="success">Success</button></details>
<script>document.querySelectorAll('[data-action-target], [data-review-state-target]').forEach((button) => button.addEventListener('click', () => { document.querySelector('main').dataset.prototypeState = button.dataset.actionTarget || button.dataset.reviewStateTarget; }));</script></body></html>`);

  const handoffPath = path.join(root, "build", "workflow", "handoffs", "repo-001-example-slice.md");
  let handoff = fs.readFileSync(handoffPath, "utf8").replace("## Build Unit Routing Index", `## UI/UX Delivery Review

**Approved UI/UX sources:** [UI/UX specification](../../../ui-ux/specification.md); [reviewed prototype](../../../ui-ux/alternatives/main/index.html); upstream owner: \`None.\`

**Covered prototype states:** [Main journey](../../../ui-ux/specification.md#journey-main) ${surface} empty, waiting, success, error, and recovery states.

**Prototype walkthrough:** ${walkthrough}

**Functional acceptance owner:** [BU-001 behavior route](../../units/bu-001-example-unit.md) proves the selected product outcome.

**Implemented UI/UX review owner:** [BU-001 implementation route](../../units/bu-001-example-unit.md) owns viewport, interaction, content, accessibility, and fidelity review.

**Actual user testing:** \`Not planned\` — separate from prototype and implementation review.

**Consistency result:** ${consistency}

## Build Unit Routing Index`);
  if (outcome === "IMPLEMENTATION_DETAILS_PARTIAL") {
    const ticketPath = path.join(root, "build", "workflow", "tickets", "example", "sr-001", "sr-001-tickets.yaml");
    write(ticketPath, fs.readFileSync(ticketPath, "utf8") + `  - id: "TICKET-0002"
    title: "Add future analytics enhancement"
    status: "out-of-scope"
    kind: "technical"
    complexity: "medium"
    concern: "observability"
    owner: "SR-001"
    affects: ["SR-001"]
    build_units: []
    build_unit_disposition: "Excluded from the selected UI delivery slice."
    cluster: "future-analytics"
    parent_decision: null
    question: "Should the future analytics enhancement enter this slice?"
    context: "The selected UI behavior is complete without this later enhancement."
    options: []
    recommendation: "Keep it outside the selected slice."
    resolution: "Excluded from the selected slice."
    current_shape: null
    result_refs: []
    constraint_refs: []
    repositories: []
    repository_contract_area: null
    depends_on: []
    write_targets: []
`);
    handoff = handoff
      .replace("**Outcome:** `IMPLEMENTATION_DETAILS_READY`", "**Outcome:** `IMPLEMENTATION_DETAILS_PARTIAL`")
      .replace("**Readiness:** `READY`", "**Readiness:** `PARTIAL`")
      .replace("**Blockers:** `None.`", "**Blockers:** [TICKET-0002](../tickets/example/sr-001/sr-001-tickets.yaml) is explicitly outside this selected UI slice.")
      .replace("[BU-001](../../units/bu-001-example-unit.md) records the reversible local choices; no unresolved capability is included.", "[TICKET-0002](../tickets/example/sr-001/sr-001-tickets.yaml) owns the future analytics enhancement explicitly excluded from this slice; [BU-001](../../units/bu-001-example-unit.md) records reversible local choices.");
  }
  write(handoffPath, handoff);
  return refreshSnapshot(root);
}

function addPhysicalRealizability(root, {
  includeClosure = true,
  result = "COMPATIBLE",
  covers = "`INPUT-001`, `Target outcome`",
  situation = "existing-unchanged",
  boundaryClass = "ordinary",
  candidate = "NOT_APPLICABLE",
  provenance = "accepted-receipt",
  writable = "`BUILD_UNIT:BU-001`",
} = {}) {
  const handoffPath = path.join(root, "build", "workflow", "handoffs", "repo-001-example-slice.md");
  const closure = `## Physical Realizability Closure

### \`PSEAM-001\` — Fixture-to-public-entrypoint compatibility

**Covers:** ${covers}

**Runtime profiles:** artifact consumer runnable-use profile.

**Implementation situation:** \`${situation}\`

**Boundary class:** \`${boundaryClass}\`

**Producer observation:** \`OBSERVED\` — The [Build Unit fixture contract](../../units/bu-001-example-unit.md) emits the accepted deterministic value.

**Consumer observation:** \`OBSERVED\` — The [Build Unit public seam](../../units/bu-001-example-unit.md) accepts that value through the selected entrypoint.

**Compared dimensions:** schema/version: exact fixture schema matches; identity/representation: exact value matches; transport/method: the public in-process invocation matches; topology/ports: Not applicable because this is an in-process package; authority/caller: Not applicable because the public call is unauthenticated; lifecycle/persistence: fresh fixture state is deterministic; command/toolchain: the repository test command uses the selected runtime.

**Candidate compatibility proof:** \`${candidate}\` — The [Build Unit public seam](../../units/bu-001-example-unit.md) records the focused compatibility disposition.

**Evidence provenance:** \`${provenance}\` — [BU-001 evidence](../../units/bu-001-example-unit.md) records the current observation.

**Direct change-impact closure:** source/imports: selected BU paths only; tests/fixtures/golden values: deterministic fixture and test; dependencies/manifests/lockfiles: unchanged; generators/generated outputs: not applicable; identity/freshness/receipt verifiers: unchanged; configuration/evidence: selected BU evidence only.

**Required-command effects:** \`NOT_APPLICABLE\` — This ordinary seam uses only its in-repository unit test and has no build, deploy, regenerate, migrate, or cross-repository effect.

**Current result:** \`${result}\`

**Delta owner:** ${result === "COMPATIBLE" ? "\`None.\`" : "\`BUILD_UNIT:BU-001\` — [BU-001](../../units/bu-001-example-unit.md)"}

**Probe:** Run \`npm test\` through the public package entrypoint.

**Evidence:** [BU-001 commands and fixture](../../units/bu-001-example-unit.md)

**Downstream impact:** Only the selected repository slice consumes this equivalence class.

`;
  let handoff = fs.readFileSync(handoffPath, "utf8")
    .replace(/^## Physical Realizability Closure\n[\s\S]*?(?=^## )/m, "")
    .replace(/^\*\*Writable build units:\*\*.*\n\n/m, "")
    .replace(
      /^(\*\*Selected build units:\*\*.*)$/m,
      "$1\n\n**Writable build units:** " + writable,
    )
;
  if (includeClosure) handoff = handoff.replace("## Delivery Slice Realizability Review", closure + "## Delivery Slice Realizability Review");
  write(handoffPath, handoff);
  refreshSnapshot(root);
  return handoffPath;
}

function addMaterialInteraction(root, {
  availability = "verified existing interaction",
  risk = "ordinary",
  conformance = "Verified",
  challenge = availability === "verified existing interaction" ? "PASS" : "Planned",
  includeConsumerFitness = true,
  highRiskMatrix = risk === "high",
} = {}) {
  write(path.join(root, "system-model", "contracts", "interfaces", "iface-001-read-state.md"), `---
type: system-interface
id: IFACE-001
name: Read State
producers: "${availability === "selected-slice output" ? "SR-001" : "None."}"
consumers: "${availability === "selected-slice output" ? "None." : "SR-001"}"
flows: "None."
related_contracts: "None."
---

# IFACE-001 — Read State

## Boundary

The consumer obtains canonical state through the public boundary.

## Payload Or Artifact

The response identifies the subject and current state.

## Material Interactions

<a id="act-001"></a>
### ACT-001 — Read sourced state

**Kind:** \`state-observation\`

**Trigger or entry:** The consumer requests canonical state for one subject.

**Input:** The canonical subject identifier.

**Output or observable result:** The current sourced state or a distinct absence result.

**Access or authority:** Only an authorized consumer may observe the result.

**Failure and recovery:** Not found, forbidden, stale, and unavailable remain distinct; retry follows the producer contract.

**Risk:** \`${risk}\`

**Verification intent:** Exercise success, rejection or denial, and unavailable recovery from the consumer path.

## Preconditions And Validation

Validate subject identity and consumer authority.

## Failure Meaning

Failures do not imply empty or terminal state.

## Must Not Imply

Observation does not grant mutation authority.
`);

  const unitPath = path.join(root, "build", "units", "bu-001-example-unit.md");
  write(unitPath, fs.readFileSync(unitPath, "utf8").replace(
    "**Material interaction bindings:** `None.` — This isolated unit has no material cross-Build-Unit or external interaction.",
    `| Logical interaction | Physical binding | Producer / consumer role | Contract or representation source | Audience or access | Conformance | State |
| --- | --- | --- | --- | --- | --- | --- |
| \`IFACE-001.ACT-001\` | \`GET /state/:id\` through the state client | Producer and consumer | [IFACE-001.ACT-001](../../system-model/contracts/interfaces/iface-001-read-state.md#act-001) | Authorized consumer | Compare the response with the canonical contract | \`${availability === "selected-slice output" ? "Planned" : "Verified"}\` |`,
  ));

  const requiredEvidence = [
    "existence",
    ...(availability === "verified existing interaction" ? ["identity-freshness"] : []),
    "structural-conformance",
    "behavioral",
    ...(includeConsumerFitness ? ["consumer-fitness"] : []),
  ].map((value) => `\`${value}\``).join(", ");
  const producer = availability === "selected-slice output"
    ? "`BUILD_UNIT:BU-001` — [BU-001 producer](../../units/bu-001-example-unit.md)"
    : "`External`";
  const matrix = risk === "ordinary"
    ? "`None.`"
    : highRiskMatrix
      ? "Positive, rejection/denial, and failure/recovery cases are owned by the [consumer verification route](../../units/bu-001-example-unit.md)."
      : "`None.`";
  const interaction = `## Required Interaction Closure

### \`INT-001\` — \`IFACE-001.ACT-001\`

**Consumer:** \`BUILD_UNIT:BU-001\`

**Producer:** ${producer}

**Required at:** \`Implementation\`

**Interaction kind:** \`state-observation\`

**Logical contract:** [IFACE-001.ACT-001](../../../system-model/contracts/interfaces/iface-001-read-state.md#act-001)

**Physical binding:** The state client calls \`GET /state/:id\` through the [BU-001 binding](../../units/bu-001-example-unit.md).

**Consumer path:** The state client in [BU-001](../../units/bu-001-example-unit.md) consumes the result.

**Availability:** \`${availability}\`

**Required evidence classes:** ${requiredEvidence}

**Fitness evidence:** The [consumer fitness owner](../../units/bu-001-example-unit.md) exercises the real consumer path.

**Representation conformance:** \`${conformance}\` — [Binding conformance](../../units/bu-001-example-unit.md) compares the consumer representation with the contract.

**Consumer challenge:** \`${challenge}\` — The independent [consumer challenge](../../units/bu-001-example-unit.md) covers success, absence, forbidden, stale, and unavailable behavior.

**Risk:** \`${risk}\`

**High-risk verification matrix:** ${matrix}
`;
  const handoffPath = path.join(root, "build", "workflow", "handoffs", "repo-001-example-slice.md");
  write(handoffPath, fs.readFileSync(handoffPath, "utf8")
    .replace(/## Required Interaction Closure[\s\S]*?(?=\n## Delivery Slice Realizability Review)/, interaction.trimEnd())
    .replace(
      /^\*\*Interaction closure:\*\*.*$/m,
      "**Interaction closure:** `PASS` — INT-001 binds IFACE-001.ACT-001 to the [consumer state client](../../units/bu-001-example-unit.md) with conformance and challenge evidence.",
    ));
  addPhysicalRealizability(root, { covers: "`INPUT-001`, `INT-001`, `Target outcome`" });
  refreshSnapshot(root);
}

function addStructuredAssurance(root, { assignment = true, repositoryRoute = true, closure = true } = {}) {
  const architecturePath = path.join(root, "system-model", "architecture.md");
  write(architecturePath, fs.readFileSync(architecturePath, "utf8").replace(
    "type: system-architecture",
    "type: system-architecture\nassurance_id: \"example-system\"",
  ));
  write(path.join(root, "system-model", "contracts", "invariants", "inv-001-state-integrity.md"), `---
type: system-invariant
id: INV-001
name: State Integrity
responsibilities: "SR-001"
flows: "None."
related_contracts: "None."
---

# INV-001 — State Integrity

## Rule

Malformed input never changes authoritative state.

## Scope

The rule applies to every public mutation boundary.

## Violation Meaning

A violation would permit invalid authoritative state.

## Verification Obligations

<a id="inv-001.vo-001"></a>
### INV-001.VO-001 — Malformed input is rejected

**Claim:** Malformed required fields cannot change authoritative state.

**Required observation:** Every declared malformed case is rejected and state remains unchanged.

**Risk:** \`high\`

**Evidence expectation:** Parameterized behavioral evidence with state-before/state-after observation.

**Boundary cases:** Missing field, wrong type, valid input, and interrupted validation.
`);

  if (assignment) {
    const unitPath = path.join(root, "build", "units", "bu-001-example-unit.md");
    write(unitPath, fs.readFileSync(unitPath, "utf8").replace(
      "### Local Discretion",
      `### Verification Obligation Assignments

| Verification Obligation | Evidence responsibility | Required evidence or observation | State |
| --- | --- | --- | --- |
| [\`INV-001.VO-001\`](../../system-model/contracts/invariants/inv-001-state-integrity.md#inv-001.vo-001) | Producer owns mutation-boundary evidence | Reject malformed cases and preserve state | \`Planned\` |

### Local Discretion`,
    ));
  }

  if (repositoryRoute) {
    const repositoryPath = path.join(root, "build", "repositories", "repo-001-example-workspace", "README.md");
    write(repositoryPath, fs.readFileSync(repositoryPath, "utf8").replace(
      "### Discovery Status",
      `### Assurance Manifest And Report

The repository will track one \`assurance/coverage.yaml\` for every member Build Unit assignment. Repository adapters emit normalized results for the one blueprint-wide ignored report.

### Discovery Status`,
    ));
  }

  if (closure) {
    const handoffPath = path.join(root, "build", "workflow", "handoffs", "repo-001-example-slice.md");
    write(handoffPath, fs.readFileSync(handoffPath, "utf8").replace(
      "## Delivery Slice Realizability Review",
      `## Required Verification Obligation Closure

### \`INV-001.VO-001\` — Malformed input is rejected

**Canonical obligation:** [INV-001.VO-001](../../../system-model/contracts/invariants/inv-001-state-integrity.md#inv-001.vo-001)

**Selected assignments:** \`BUILD_UNIT:BU-001\`

**Repository manifest route:** [REPO-001 Repository Build Design](../../repositories/repo-001-example-workspace/README.md) owns the tracked \`assurance/coverage.yaml\`.

**Required evidence:** Parameterized behavioral evidence rejects malformed cases and observes unchanged state.

**Routing state:** \`Planned\`

**Gap disposition:** \`None.\`

## Delivery Slice Realizability Review`,
    ));
  }
  refreshSnapshot(root);
}

function addSharedProducerConsumerCohort(root, { omittedConsumers = [] } = {}) {
  addMaterialInteraction(root, { availability: "selected-slice output", conformance: "Planned", challenge: "Planned" });

  const domainPath = path.join(root, "system-model", "domains", "example", "domain.md");
  write(domainPath, fs.readFileSync(domainPath, "utf8").replace(
    'responsibilities: "SR-001"',
    'responsibilities: "SR-001, SR-002, SR-003, SR-004"',
  ));
  const producerResponsibilityPath = path.join(root, "system-model", "domains", "example", "responsibilities", "sr-001-example.md");
  write(producerResponsibilityPath, fs.readFileSync(producerResponsibilityPath, "utf8").replace(
    'participates_in: "None."',
    'participates_in: "IFACE-001"',
  ));

  const consumerSpecs = [
    { index: 2, slug: "consumer-a" },
    { index: 3, slug: "consumer-b" },
    { index: 4, slug: "consumer-c" },
  ];
  for (const { index, slug } of consumerSpecs) {
    const id = String(index).padStart(3, "0");
    write(path.join(root, "system-model", "domains", "example", "responsibilities", `sr-${id}-${slug}.md`), `---
type: system-responsibility
id: SR-${id}
name: Consumer ${index - 1}
domain: example
depends_on: "SR-001"
participates_in: "IFACE-001"
realized_by: "BU-${id}"
---

# SR-${id} — Consumer ${index - 1}

This responsibility consumes the shared state contract through its shipped client.
`);
    write(path.join(root, "build", "units", `bu-${id}-${slug}.md`), `---
type: build-unit
id: BU-${id}
name: Consumer ${index - 1}
kind: application
ui_ux_applicability: "not-applicable"
ui_ux_disposition: "This consumer exercises the producer through its programmatic client and exposes no maintained human-facing surface."
source_responsibilities: "SR-${id}"
depends_on_build_units: "None."
repository: "REPO-${id}"
code_path: "apps/${slug}"
repository_disposition: "None."
technical_constraints: "None."
---

# BU-${id} — Consumer ${index - 1}

## Build Unit Overview

Consumer ${index - 1} is an independently buildable application at \`apps/${slug}\`. It consumes the shared producer through its public client, keeps its own verification boundary, and owns no producer state or authority.

### Detailed Code Shape

\`\`\`text
apps/${slug}/
├── src/shared-state-client.ts
└── test/shared-state-client.test.ts
\`\`\`

The shipped client is the only shared-state seam exercised by compatibility proof.

## Agent-First Canonical Reference

### Artifact And Code Location

The application lives at \`apps/${slug}\` in REPO-${id}.

### Applicable Technical Constraints

No additional CONS record applies; the interface contract remains authoritative.

### Source Responsibility Mapping

This unit realizes [SR-${id}](../../system-model/domains/example/responsibilities/sr-${id}-${slug}.md).

### Interfaces And Dependencies

The shipped client consumes IFACE-001.ACT-001 without Build Unit linkage.

### Material Interaction Bindings

| Logical interaction | Physical binding | Producer / consumer role | Contract or representation source | Audience or access | Conformance | State |
| --- | --- | --- | --- | --- | --- | --- |
| \`IFACE-001.ACT-001\` | \`sharedStateClient.read()\` exported from the application client | Consumer | [IFACE-001.ACT-001](../../system-model/contracts/interfaces/iface-001-read-state.md#act-001) | Authorized consumer | Compare decoded result with the canonical candidate fixture | \`Verified\` |

### Module Architecture

The public client owns decoding and delegates no producer semantics to UI code.

### Commands And Verification

Run \`npm test -- shared-state-client\` through the built application entrypoint.

### Local Discretion

Private helper placement remains local when the exported client contract is unchanged.
`);
    write(path.join(root, "build", "repositories", `repo-${id}-${slug}`, "README.md"), `---
type: repository-build-design
id: REPO-${id}
name: Consumer ${index - 1} Repository
member_build_units: "BU-${id}"
technical_constraints: "None."
discovery_status: complete
discovery_blockers: "None."
---

# REPO-${id} — Consumer ${index - 1} Repository

## Repository Overview

This repository contains Consumer ${index - 1} at \`apps/${slug}\` with its root test and release tooling. The application remains independently buildable and shares source control only with its own repository policy.

### Material Workspace Tree

\`\`\`text
repo-root/
├── package.json
└── apps/${slug}/
\`\`\`

The application folder contains BU-${id}; root files own repository commands.

## Agent-First Canonical Reference

### Repository And Workspace Shape

One repository contains one independently delivered consumer application.

### Member Build Units

BU-${id} is the only member Build Unit.

### Applicable Technical Constraints

No additional CONS record applies to this repository.

### Repository Constraints

RC-${id}: compatibility proof must reach the shipped client export.

### Version-Control And Generated-File Policy

**Must track:** Source, manifests, lockfiles, workflows, fixtures, and reviewed evidence.

**Must ignore:** Dependencies, build output, coverage, reports, caches, logs, OS metadata, and local environment files.

**Generated-output disposition:** Generated build products remain untracked; reviewed fixtures remain tracked.

**Secret/template rule:** Secret-bearing files remain local; redacted examples may be committed.

**Verification:** Run the repository hygiene verifier through the aggregate test command.

### Repository Contract Coverage

- \`repository-module-conventions\`: \`inherited\` — Source: [BU-${id}](../../units/bu-${id}-${slug}.md).
- \`code-construction-public-api\`: \`inherited\` — Source: [BU-${id}](../../units/bu-${id}-${slug}.md).
- \`maintainability-agent-guidance\`: \`inherited\` — Source: [BU-${id}](../../units/bu-${id}-${slug}.md).

### Agent Guidance Projection

**Derived artifact:** [REPO-${id} agent guidance](./agent-guidance.md)

**Repository root target:** \`AGENTS.md\`

### Commands, Release, And Verification

Run \`npm test\` before delivery.

### Discovery Status

Repository discovery is complete for this consumer.

### Local Discretion

Private helper placement remains local.
`);
    write(path.join(root, "build", "repositories", `repo-${id}-${slug}`, "agent-guidance.md"), `# REPO-${id} — Repository Agent Guidance

Baseline: \`maintainability-agent-guidance-baseline\`

## Canonical Sources

- Repository Build Design: [REPO-${id}](./README.md)
- Member Build Unit: [BU-${id}](../../units/bu-${id}-${slug}.md)

## Hard Rules

Compatibility proof reaches the shipped client export.

## Defaults And Exception Guidance

Keep consumer adaptation local unless the canonical shared contract changes.

## Rationale Comments

Explain non-obvious decoding or compatibility choices near the client.

## Stop And Escalate

Stop before changing the shared semantic contract locally.

## Verification Expectations

Run the built-client compatibility probe and repository test command.
`);
  }

  const interfacePath = path.join(root, "system-model", "contracts", "interfaces", "iface-001-read-state.md");
  write(interfacePath, fs.readFileSync(interfacePath, "utf8").replace(
    'consumers: "None."',
    'consumers: "SR-001, SR-002, SR-003, SR-004"',
  ));

  const buildReadmePath = path.join(root, "build", "README.md");
  const consumerGuide = consumerSpecs.map(({ index, slug }) => {
    const id = String(index).padStart(3, "0");
    return `
### [REPO-${id} — Consumer ${index - 1} Repository](./repositories/repo-${id}-${slug}/README.md)

This repository contains one independently delivered consumer application at \`apps/${slug}\` and the root tooling that verifies it. The application keeps a separate public client and test boundary while sharing only its own repository policy and release command.

#### [BU-${id} — Consumer ${index - 1}](./units/bu-${id}-${slug}.md)

The unit produces the Consumer ${index - 1} application at \`apps/${slug}\`. It is independently buildable and testable, reaches the shared producer through its shipped client, and preserves a separate compatibility-proof boundary. It deliberately excludes producer state and authority.
`;
  }).join("");
  write(buildReadmePath, fs.readFileSync(buildReadmePath, "utf8").trimEnd() + "\n" + consumerGuide);

  const handoffPath = path.join(root, "build", "workflow", "handoffs", "repo-001-example-slice.md");
  const evidence = "[BU-001](../../units/bu-001-example-unit.md)";
  const coverageRows = consumerSpecs
    .filter(({ index }) => !omittedConsumers.includes(`BU-${String(index).padStart(3, "0")}`))
    .map(({ index, slug }) => {
      const id = String(index).padStart(3, "0");
      return `| \`BU-001\` | \`BU-${id}\` | \`IFACE-001.ACT-001\` | \`repo-${id}-${slug}\` | [BU-${id} shipped client](../../units/bu-${id}-${slug}.md#material-interaction-bindings) — \`sharedStateClient.read()\` | \`npm test -- shared-state-client\` | \`PASS\` — [BU-${id} consumer proof](../../units/bu-${id}-${slug}.md#commands-and-verification) |`;
    }).join("\n");
  const compatibility = `**Shared-producer surface closure:** \`PASS\` — [IFACE-001](../../../system-model/contracts/interfaces/iface-001-read-state.md) and ${evidence} close one action across three known consumers.

**Contract-change placement:** \`PASS\` — ${evidence} owns the shared selected-output producer contract.

**Fan-out and evolution:** \`PASS\` — ${evidence} preserves one canonical representation for the three consumer clients.

**Physical compatibility preflight:** \`PASS\` — PSEAM-001 confirms compatibility; ${evidence} owns the canonical candidate fixture; each consumer row exercises its shipped client.

**Affected-slice propagation:** \`PASS\` — [Handoff Sequence](./README.md) maps the producer and all three downstream consumer slices.

### Known Consumer Compatibility Coverage

| Producer | Consumer | Interaction | Consumer slice | Shipped seam | Probe procedure | Result / proof owner |
| --- | --- | --- | --- | --- | --- | --- |
${coverageRows}

### Bounded Diagnostic Sweep

**Selected cohort:** [Handoff Sequence](./README.md) covers the selected producer and all three mapped consumer slices.

**Initial finite inventory:** [Handoff Sequence](./README.md) freezes the selected producer, direct consumers, commands, and affected surfaces.

**Direct-dependency additions:** \`None.\`

**Independent probes:** \`COMPLETE\` — ${evidence} and every listed consumer proof completed the four safe independent candidate-fixture probes.

**Dependency-blocked probes:** \`None.\`

**Root-cause groups:** \`None.\`

**Zero-new-blocker pass:** \`PASS\` — ${evidence} records a complete cohort rerun with zero new blockers.

**Frozen-inventory termination:** \`PASS\` — ${evidence} records the unchanged frozen-inventory rerun.

`;
  write(handoffPath, fs.readFileSync(handoffPath, "utf8")
    .replace(DEFAULT_COMPATIBILITY_REVIEW, compatibility));

  write(path.join(root, "build", "workflow", "handoffs", "README.md"), `# Handoff Sequence

**Current order group:** \`1\`

Finish every slice in group N before starting group N+1. Slices inside one group may proceed in parallel.

| Order group | Delivery slice | Repository | Build Units | Requires | State |
| ---: | --- | --- | --- | --- | --- |
| 1 | [repo-001-example-slice](./repo-001-example-slice.md) | \`REPO-001\` | \`BU-001\` | \`None.\` | \`Ready\` |
| 2 | repo-002-consumer-a | \`REPO-002\` | \`BU-002\` | \`repo-001-example-slice\` | \`Waiting\` |
| 2 | repo-003-consumer-b | \`REPO-003\` | \`BU-003\` | \`repo-001-example-slice\` | \`Waiting\` |
| 2 | repo-004-consumer-c | \`REPO-004\` | \`BU-004\` | \`repo-001-example-slice\` | \`Waiting\` |
`);
  refreshSnapshot(root);
}
test("canonical Build Design and Delivery Readiness validate independently", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const handoff = createReadyFixture(root);

  assert.equal(run(buildValidator, root).status, 0);
  assert.equal(run(deliveryValidator, root, handoff).status, 0);
  assert.equal(run(sequenceValidator, root).status, 0);
});

test("selected delivery reports unrelated document defects but blocks relevant defects", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const handoff = createReadyFixture(root);
  const unit = path.join(root, "build", "units", "bu-001-example-unit.md");
  const unrelated = path.join(root, "build", "units", "bu-002-other-unit.md");
  write(unrelated, fs.readFileSync(unit, "utf8").replaceAll("BU-001", "BU-002"));
  const responsibility = path.join(root, "system-model", "domains", "example", "responsibilities", "sr-001-example.md");
  write(responsibility, fs.readFileSync(responsibility, "utf8").replace('realized_by: "BU-001"', 'realized_by: "BU-001, BU-002"'));
  const repository = path.join(root, "build", "repositories", "repo-001-example-workspace", "README.md");
  write(repository, fs.readFileSync(repository, "utf8").replace('member_build_units: "BU-001"', 'member_build_units: "BU-001, BU-002"'));
  const guide = path.join(root, "build", "README.md");
  const guideText = fs.readFileSync(guide, "utf8");
  const unitGuide = guideText.slice(guideText.indexOf("#### [BU-001"))
    .replaceAll("BU-001", "BU-002").replaceAll("bu-001-example-unit.md", "bu-002-other-unit.md");
  write(guide, guideText + "\n" + unitGuide);
  write(handoff, fs.readFileSync(handoff, "utf8").replace(
    "**Repository membership disposition:** Full repository.",
    "**Repository membership disposition:** Partial repository; omit BU-002 because its independent artifact is outside this delivery.",
  ));
  const sequence = path.join(root, "build", "workflow", "handoffs", "README.md");
  write(sequence, fs.readFileSync(sequence, "utf8").trimEnd()
    + "\n| 2 | repo-001-other-slice | `REPO-001` | `BU-002` | `None.` | `Blocked — separate artifact awaiting its own delivery request` |\n");
  refreshSnapshot(root);
  let result = run(deliveryValidator, root, handoff);
  assert.equal(result.status, 0, result.stderr);

  write(unrelated, fs.readFileSync(unrelated, "utf8").replace("### Commands And Verification", "### Commands"));
  result = run(deliveryValidator, root, handoff);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stderr, /NON_BLOCKING_PACKAGE_MAINTENANCE:.*bu-002.*Commands And Verification/);
  assert.equal(run(buildValidator, root).status, 1, "full Build Design remains strict");

  // The same document defect becomes blocking when this unit is a prerequisite.
  const original = fs.readFileSync(unit, "utf8");
  write(unit, original.replace('depends_on_build_units: "None."', 'depends_on_build_units: "BU-002"'));
  result = run(deliveryValidator, root, handoff);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /- units\/bu-002-other-unit.md is missing ### Commands And Verification/);
  assert.doesNotMatch(result.stderr, /NON_BLOCKING_PACKAGE_MAINTENANCE:/);
});

test("Build Design accepts complete structured VO assignment and repository routing", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  createReadyFixture(root);
  addStructuredAssurance(root);

  const result = run(buildValidator, root);
  assert.equal(result.status, 0, result.stderr);
});

test("Build Design rejects an unassigned structured VO", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  createReadyFixture(root);
  addStructuredAssurance(root, { assignment: false, repositoryRoute: false, closure: false });

  const result = run(buildValidator, root);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /INV-001\.VO-001 is unassigned|requires ### Verification Obligation Assignments/);
});

test("Build Design rejects placeholder evidence responsibility in a VO assignment", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  createReadyFixture(root);
  addStructuredAssurance(root);
  const unitPath = path.join(root, "build", "units", "bu-001-example-unit.md");
  write(unitPath, fs.readFileSync(unitPath, "utf8").replace("Producer owns mutation-boundary evidence", "TBD"));

  const result = run(buildValidator, root);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /requires a concrete producer, consumer, joint, repository-wide, or external Evidence responsibility/);
});

test("Delivery Readiness requires selected Verification Obligation closure", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const handoff = createReadyFixture(root);
  addStructuredAssurance(root, { closure: false });

  const result = run(deliveryValidator, root, handoff);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Required Verification Obligation Closure/);
});

test("Delivery Readiness accepts complete selected Verification Obligation closure", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const handoff = createReadyFixture(root);
  addStructuredAssurance(root);

  const result = run(deliveryValidator, root, handoff);
  assert.equal(result.status, 0, result.stderr);
});

test("Delivery Readiness rejects placeholder Required evidence in VO closure", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const handoff = createReadyFixture(root);
  addStructuredAssurance(root);
  write(handoff, fs.readFileSync(handoff, "utf8").replace(
    "**Required evidence:** Parameterized behavioral evidence rejects malformed cases and observes unchanged state.",
    "**Required evidence:** TBD",
  ));
  refreshSnapshot(root);

  const result = run(deliveryValidator, root, handoff);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Required evidence.*must be concrete and cannot contain placeholder content/);
});

test("ticket files alone do not activate Build Design", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  write(path.join(root, "build", "workflow", "tickets", "example", "sr-001", "sr-001-tickets.yaml"), "ticket_file_version: 3\nscope: responsibility:SR-001\ntickets: []\n");

  const result = run(buildValidator, root);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /No Build Design layer/i);
});

test("an incomplete canonical Build Design fails closed", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  write(path.join(root, "build", "units", "bu-001-example.md"), "---\ntype: build-unit\nid: BU-001\n---\n");

  const result = run(buildValidator, root);
  assert.notEqual(result.status, 0);
});

test("System Responsibility and Build Unit realization must be reciprocal", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  createReadyFixture(root);
  const responsibilityPath = path.join(root, "system-model", "domains", "example", "responsibilities", "sr-001-example.md");
  write(responsibilityPath, fs.readFileSync(responsibilityPath, "utf8").replace('realized_by: "BU-001"', 'realized_by: "None."'));

  const result = run(buildValidator, root);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /reciprocal|realized_by/i);
});

test("repository discovery requires contract coverage, guidance, and version-control policy", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  createReadyFixture(root);
  const repositoryPath = path.join(root, "build", "repositories", "repo-001-example-workspace", "README.md");
  write(repositoryPath, fs.readFileSync(repositoryPath, "utf8").replace(/### Version-Control And Generated-File Policy[\s\S]*?(?=\n### Repository Contract Coverage)/, ""));

  const result = run(buildValidator, root);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Version-Control And Generated-File Policy/);
});

test("approved selections and planned verification capabilities remain traceable to current sources", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  createReadyFixture(root);
  const selectionPath = path.join(root, "build", "records", "selections", "sel-001-runtime.md");
  write(selectionPath, fs.readFileSync(selectionPath, "utf8").replace('technical_sources: "SR-001"', 'technical_sources: "SR-999"'));

  const result = run(buildValidator, root);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /unknown Technical source/i);
});

test("an applicable UI Build Unit missing UI/UX Realization is rejected", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  createReadyFixture(root);
  const unitPath = path.join(root, "build", "units", "bu-001-example-unit.md");
  write(unitPath, fs.readFileSync(unitPath, "utf8")
    .replace('ui_ux_applicability: "not-applicable"', 'ui_ux_applicability: "applicable"')
    .replace('ui_ux_disposition: "This package exposes a programmatic API and has no maintained human-facing surface."', 'ui_ux_disposition: "Human-facing consumer application."'));

  const result = run(buildValidator, root);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /missing ## or ### UI\/UX Realization/i);
});

test("UI partial delivery rejects an unreviewed prototype and failed consistency", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  createReadyFixture(root);
  const handoff = configureUiDelivery(root, {
    outcome: "IMPLEMENTATION_DETAILS_PARTIAL",
    walkthrough: "`Blocked` — The recovery walkthrough is not reviewed.",
    consistency: "`BLOCKED` — The error state conflicts with the canonical requirement.",
  });

  const result = run(deliveryValidator, root, handoff);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /IMPLEMENTATION_DETAILS_PARTIAL.*reviewed prototype walkthrough/i);
  assert.match(result.stderr, /IMPLEMENTATION_DETAILS_PARTIAL.*PASS UI\/UX consistency/i);
});

test("valid consumer and operator UI deliveries pass", (context) => {
  const roots = [];
  context.after(() => roots.forEach((root) => fs.rmSync(root, { recursive: true, force: true })));
  for (const surface of ["consumer", "operator"]) {
    const root = fixture();
    roots.push(root);
    createReadyFixture(root);
    const handoff = configureUiDelivery(root, {
      surface,
      outcome: surface === "operator" ? "IMPLEMENTATION_DETAILS_PARTIAL" : "IMPLEMENTATION_DETAILS_READY",
    });
    const result = run(deliveryValidator, root, handoff);
    assert.equal(result.status, 0, surface + ": " + result.stderr);
  }
});

test("exploratory alternatives do not satisfy applicable delivery readiness", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  createReadyFixture(root);
  const handoff = configureUiDelivery(root);
  const specificationPath = path.join(root, "ui-ux/specification.md");
  write(specificationPath, fs.readFileSync(specificationPath, "utf8").replace('`./alternatives/main/index.html`', '`Unresolved`'));
  const result = run(deliveryValidator, root, handoff);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /selected.*candidate/);
});

test("retained unselected alternatives do not block a selected reviewed target", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  createReadyFixture(root);
  const handoff = configureUiDelivery(root);
  write(path.join(root, "ui-ux/alternatives/retained/index.html"), '<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width"></head><body><main>Unreviewed sketch</main></body></html>');
  const specificationPath = path.join(root, "ui-ux/specification.md");
  write(specificationPath, fs.readFileSync(specificationPath, "utf8") + '\n[Retained sketch](./alternatives/retained/index.html) — unselected.\n');
  const result = run(deliveryValidator, root, handoff);
  assert.equal(result.status, 0, result.stderr);
});

test("an explicitly non-UI delivery remains exempt", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const handoff = createReadyFixture(root);

  const result = run(deliveryValidator, root, handoff);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.existsSync(path.join(root, "ui-ux")), false);
});

test("every Build Unit requires explicit UI classification and disposition for build and delivery", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const handoff = createReadyFixture(root);
  const unitPath = path.join(root, "build", "units", "bu-001-example-unit.md");
  const baseline = fs.readFileSync(unitPath, "utf8");
  for (const [removed, expected] of [
    [/^ui_ux_applicability:.*\n/m, /ui_ux_applicability must be applicable or not-applicable/],
    [/^ui_ux_disposition:.*\n/m, /requires a concrete ui_ux_disposition/],
  ]) {
    write(unitPath, baseline.replace(removed, ""));
    for (const validator of [buildValidator, deliveryValidator]) {
      const result = run(validator, root, validator === deliveryValidator ? handoff : null);
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, expected);
    }
  }
});

test("Stage 9 requires a current snapshot and sequence entry", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const handoff = createReadyFixture(root);
  write(handoff, fs.readFileSync(handoff, "utf8").replace("BU-001 uses the approved runtime", "BU-001 uses a revised approved runtime"));

  const result = run(deliveryValidator, root, handoff);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /snapshot/i);
});

test("a pre-existing immutable artifact requires a complete receipt", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const handoff = createReadyFixture(root);
  write(handoff, fs.readFileSync(handoff, "utf8")
    .replace("**Input kind:** `Fixture`", "**Input kind:** `Immutable artifact`")
    .replace("**Consumed at:** `Verification`", "**Consumed at:** `Build`"));
  refreshSnapshot(root);

  const result = run(deliveryValidator, root, handoff);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Artifact identity|immutable artifact receipt/i);
});

test("an ordinary verified interaction requires consumer-fitness evidence", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const handoff = createReadyFixture(root);
  addMaterialInteraction(root, { includeConsumerFitness: false });

  const result = run(deliveryValidator, root, handoff);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /consumer-fitness/i);
});

test("a pre-existing producer requires verified conformance and a fresh consumer challenge", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const handoff = createReadyFixture(root);
  addMaterialInteraction(root, { conformance: "Planned", challenge: "Planned" });

  const result = run(deliveryValidator, root, handoff);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /conformance|consumer challenge/i);
});

test("a selected-slice producer may plan conformance and consumer proof", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const handoff = createReadyFixture(root);
  addMaterialInteraction(root, { availability: "selected-slice output", conformance: "Planned", challenge: "Planned" });

  const result = run(deliveryValidator, root, handoff);
  assert.equal(result.status, 0, result.stderr);
});

test("only high-risk interactions require the bounded verification matrix", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const handoff = createReadyFixture(root);
  addMaterialInteraction(root, { risk: "high", highRiskMatrix: false });

  const result = run(deliveryValidator, root, handoff);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /high risk requires a linked matrix/i);
});

test("a READY Build Unit rejects a mapped decided ticket even without realization result references", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const handoff = createReadyFixture(root, { withSelection: false, withVerification: false });
  const ticketPath = path.join(root, "build", "workflow", "tickets", "example", "sr-001", "sr-001-tickets.yaml");
  write(ticketPath, fs.readFileSync(ticketPath, "utf8").replace('status: "finished"', 'status: "decided"'));
  refreshSnapshot(root);

  const result = run(deliveryValidator, root, handoff);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /READY.*TICKET-0001.*decided/i);
});

test("the current handoff structure requires every bounded compatibility axis", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const handoff = createReadyFixture(root);
  write(handoff, fs.readFileSync(handoff, "utf8").replace(/^\*\*Physical compatibility preflight:\*\*.*\n\n/m, ""));
  refreshSnapshot(root);

  const result = run(deliveryValidator, root, handoff);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Physical compatibility preflight/);
});

test("an outcome-aware handoff requires the complete outcome and runtime-profile contract", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const handoff = createReadyFixture(root);
  write(handoff, fs.readFileSync(handoff, "utf8").replace(/^\*\*Runtime-profile claims:\*\*.*\n\n/m, ""));
  refreshSnapshot(root);

  const result = run(deliveryValidator, root, handoff);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /missing \*\*Runtime-profile claims:\*\*/i);
});

test("the current handoff structure requires a clean bounded diagnostic rerun", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const handoff = createReadyFixture(root);
  write(handoff, fs.readFileSync(handoff, "utf8").replace(/^\*\*Zero-new-blocker pass:\*\*.*\n\n/m, ""));
  refreshSnapshot(root);

  const result = run(deliveryValidator, root, handoff);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Bounded Diagnostic Sweep/);
  assert.match(result.stderr, /zero-new-blocker/i);
});

test("accepts one finite compatibility class covering the selected universe", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  createReadyFixture(root);
  addPhysicalRealizability(root);
  const result = run(deliveryValidator, root, "build/workflow/handoffs/repo-001-example-slice.md");
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /PHYSICAL_REALIZABILITY_RECEIPT: PRESENT_AND_STRUCTURALLY_VALID/);
});

test("rejects a missing closure instead of treating prose PASS as evidence", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  createReadyFixture(root);
  addPhysicalRealizability(root, { includeClosure: false });
  const result = run(deliveryValidator, root, "build/workflow/handoffs/repo-001-example-slice.md");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /missing ## Physical Realizability Closure/);
});

test("rejects uncovered selected obligations", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  createReadyFixture(root);
  addPhysicalRealizability(root, { covers: "`Target outcome`" });
  const result = run(deliveryValidator, root, "build/workflow/handoffs/repo-001-example-slice.md");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /does not cover INPUT-001/);
});

test("forbids a BLOCKED class under a planning-ready outcome", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  createReadyFixture(root);
  addPhysicalRealizability(root, { result: "BLOCKED" });
  const result = run(deliveryValidator, root, "build/workflow/handoffs/repo-001-example-slice.md");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /cannot contain BLOCKED physical class PSEAM-001/);
});

test("a protected implemented evolution requires an executed candidate proof", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  createReadyFixture(root);
  const handoff = addPhysicalRealizability(root, {
    result: "DELTA_OWNED",
    situation: "implemented-evolution",
    boundaryClass: "protected-machine-interface",
    candidate: "PLANNED",
    provenance: "planned-proof",
  });

  const result = run(deliveryValidator, root, handoff);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /requires PASS candidate compatibility from `executed-probe` evidence/i);
});

test("source inspection cannot substitute for protected implemented-evolution proof", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  createReadyFixture(root);
  const handoff = addPhysicalRealizability(root, {
    result: "DELTA_OWNED",
    situation: "implemented-evolution",
    boundaryClass: "protected-machine-interface",
    candidate: "PASS",
    provenance: "source-inspection",
  });

  const result = run(deliveryValidator, root, handoff);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /requires PASS candidate compatibility from `executed-probe` evidence/i);
});

test("a physical delta owner must be in the writable selected subset", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  createReadyFixture(root);
  const handoff = addPhysicalRealizability(root, {
    result: "DELTA_OWNED",
    situation: "implemented-evolution",
    boundaryClass: "protected-machine-interface",
    candidate: "PASS",
    provenance: "executed-probe",
    writable: "`None.`",
  });

  const result = run(deliveryValidator, root, handoff);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /non-writable owner BUILD_UNIT:BU-001/i);
});

test("requires complete direct change-impact category disposition", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  createReadyFixture(root);
  const handoff = addPhysicalRealizability(root);
  write(handoff, fs.readFileSync(handoff, "utf8").replace("generators/generated outputs:", "generated artifacts:"));
  refreshSnapshot(root);

  const result = run(deliveryValidator, root, handoff);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /must explicitly dispose generators\/generated outputs/i);
});

test("an effectful required command requires checked command-side-effect evidence", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  createReadyFixture(root);
  const handoff = addPhysicalRealizability(root, { boundaryClass: "required-effectful-command" });

  const result = run(deliveryValidator, root, handoff);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /required-effectful-command boundary requires CHECKED command effects/i);
});

test("one shared-producer validation reports every independently missing consumer row", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const handoff = createReadyFixture(root);
  addSharedProducerConsumerCohort(root, { omittedConsumers: ["BU-003", "BU-004"] });

  const result = run(deliveryValidator, root, handoff);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /omits BU-001 -> BU-003.*IFACE-001\.ACT-001.*repo-003-consumer-b/i);
  assert.match(result.stderr, /omits BU-001 -> BU-004.*IFACE-001\.ACT-001.*repo-004-consumer-c/i);
});

test("the shared-producer cohort passes when every known consumer is covered exactly once", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const handoff = createReadyFixture(root);
  addSharedProducerConsumerCohort(root);

  const result = run(deliveryValidator, root, handoff);
  assert.equal(result.status, 0, result.stderr);

  const consumer = path.join(root, "build", "units", "bu-002-consumer-a.md");
  write(consumer, fs.readFileSync(consumer, "utf8").replace("### Commands And Verification", "### Commands"));
  const broken = run(deliveryValidator, root, handoff);
  assert.equal(broken.status, 1);
  assert.match(broken.stderr, /- units\/bu-002-consumer-a.md is missing ### Commands And Verification/);
  assert.doesNotMatch(broken.stderr, /NON_BLOCKING_PACKAGE_MAINTENANCE:/);

});

test("selected sequence eligibility rejects Next but permits a retained Implemented slice", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const handoff = createReadyFixture(root);
  const indexPath = path.join(root, "build", "workflow", "handoffs", "README.md");
  const readyIndex = fs.readFileSync(indexPath, "utf8");
  write(indexPath, readyIndex.replace("`Ready`", "`Next`"));

  const nextResult = runPlannableSequence(root, handoff);
  assert.notEqual(nextResult.status, 0);
  assert.match(nextResult.stderr, /not executable.*Next/i);

  write(indexPath, readyIndex.replace("**Current order group:** `1`", "**Current order group:** `None.`").replace("`Ready`", "`Implemented`"));
  const implementedResult = runPlannableSequence(root, handoff);
  assert.equal(implementedResult.status, 0, implementedResult.stderr);
});

test("UI readiness blocks relevant pending work while preserving unrelated pending journeys", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  createReadyFixture(root);
  const handoff = configureUiDelivery(root);
  const specPath = path.join(root, 'ui-ux/specification.md');
  const base = fs.readFileSync(specPath, 'utf8').replace('## State Coverage', '<a id="journey-settings"></a>Settings.\n\n## State Coverage');
  const pending = '\n| Journey | Pending change | Canonical / ticket references |\n| --- | --- | --- |\n| [Settings](#journey-settings) | Update settings screen | [Source](../system-model/domains/example/responsibilities/sr-001-example.md) |\n';
  write(specPath, base.replace('\nNone.\n', pending));
  let result = run(deliveryValidator, root, handoff);
  assert.equal(result.status, 0, result.stderr);
  write(specPath, base.replace('\nNone.\n', pending.replace('(#journey-settings)', '(#journey-main)')));
  result = run(deliveryValidator, root, handoff);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Pending prototype work blocks selected UI journey/);
  const partial = configureUiDelivery(root, { outcome: 'IMPLEMENTATION_DETAILS_PARTIAL' });
  write(specPath, base.replace('\nNone.\n', pending.replace('(#journey-settings)', '(#journey-main)')));
  result = run(deliveryValidator, root, partial);
  assert.match(result.stderr, /Pending prototype work blocks selected UI journey/);
});

test("non-UI selected scope ignores unrelated pending prototype work", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const handoff = createReadyFixture(root);
  write(path.join(root, 'ui-ux/specification.md'), '# UI/UX Design\n\nUnrelated discovery with pending journeys.\n');
  const result = run(deliveryValidator, root, handoff);
  assert.equal(result.status, 0, result.stderr);
});

test("retired ticket source relationships remain valid but do not remain active handoff mappings", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  createReadyFixture(root);
  const files = fs.readdirSync(path.join(root, 'build/workflow/tickets/example/sr-001'));
  const file = path.join(root, 'build/workflow/tickets/example/sr-001', files[0]);
  const text = fs.readFileSync(file, 'utf8');
  write(file, text.replace('tickets:', 'archived_records:').replaceAll('    status: "finished"', '    record_state: "archived"\n    status_at_close: "finished"\n    closed_reason: "obsolete"\n    replaced_by: []'));
  const result = run(buildValidator, root);
  assert.equal(result.status, 0, result.stderr);
});

test("all outcome fields omitted still fails the current handoff contract", (context) => {
  const root = fixture(); context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const handoff = createReadyFixture(root);
  write(handoff, fs.readFileSync(handoff, "utf8").replace(/^\*\*(?:Target outcome|Runtime-profile claims|Target-outcome closure):\*\*.*\n/gm, ""));
  refreshSnapshot(root);
  const result = run(deliveryValidator, root, handoff);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /missing \*\*Target outcome/);
  assert.match(result.stderr, /missing \*\*Runtime-profile claims/);
  assert.match(result.stderr, /Target-outcome closure/);
});

test("omitting both physical closure and writable units cannot bypass validation", (context) => {
  const root = fixture(); context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const handoff = createReadyFixture(root);
  write(handoff, fs.readFileSync(handoff, "utf8")
    .replace(/^## Physical Realizability Closure\n[\s\S]*?(?=^## )/m, "")
    .replace(/^\*\*Writable build units:\*\*.*\n/gm, ""));
  refreshSnapshot(root);
  const result = run(deliveryValidator, root, handoff);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /missing ## Physical Realizability Closure/);
});

test("verification capability requires the current supported-obligations field", (context) => {
  const root = fixture(); context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  createReadyFixture(root);
  const file = path.join(root, "build/records/verification/va-001-local-integration-harness.md");
  write(file, fs.readFileSync(file, "utf8").replace("Verification obligations it can support", "Claims it can prove"));
  const result = run(buildValidator, root);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /missing \*\*Verification obligations it can support/);
});


test("known-consumer inference honors exact action rows and declared roles", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  createReadyFixture(root);
  addSharedProducerConsumerCohort(root);
  const unit = (id, role, action = "IFACE-001.ACT-001") => ({
    id, repository: "REPO-001", filePath: id + ".md", sourceResponsibilities: ["SR-001", "SR-002", "SR-003", "SR-004"],
    content: "### Material Interaction Bindings\n\n| Logical interaction | Physical binding | Producer / consumer role | Contract | Audience | Conformance | State |\n| --- | --- | --- | --- | --- | --- | --- |\n| `" + action + "` | route | " + role + " | source | internal | test | Planned |\n",
  });
  const infer = (roles, { sameSlice = false, action, duplicate = false } = {}) => {
    const units = roles.map((role, i) => unit("BU-00" + (i + 1), role, i === 0 ? action : undefined));
    if (duplicate) units[0].content += units[0].content.split("\n").find((line) => line.startsWith("| `")) + "\n";
    const errors = [];
    const rows = expectedKnownConsumerCoverage(root, new Map(units.map((u) => [u.id, u])), ["BUILD_UNIT:BU-001"], units.map((u, i) => ({ buildUnits: [u.id], slug: sameSlice && i === 1 ? "slice-0" : "slice-" + i })), errors);
    return { rows, errors };
  };
  for (const role of ["Consumer", "Consumer / verifier", "Composition and acceptance consumer", "Consumer / acknowledgement recipient"]) assert.deepEqual(infer([role, "Consumer", "Consumer"]).rows, []);
  for (const role of ["Producer", "Producer / consumer", "Producer and consumer", "Request producer / conformance-evidence consumer", "Consumer / acknowledgement producer", "Producer and consumer/control owner"]) {
    const result = infer([role, "Consumer", "Consumer / verifier", "Producer"]);
    assert.deepEqual(result.errors, []);
    assert.deepEqual(result.rows.map((r) => r.consumerId), ["BU-002", "BU-003"]);
  }
  assert.deepEqual(infer(["Producer", "Consumer", "Consumer"], { sameSlice: true }).rows, []);
  assert.deepEqual(infer(["Producer", "Consumer", "Consumer"], { action: "IFACE-001.ACT-0010" }).rows, []);
  for (const role of ["", "Producer or consumer", "Producer?", "Verifier", "Producer / producer", "Non-producer / consumer", "Producer consumer", "Consumer /"]) assert.match(infer([role, "Consumer", "Consumer"]).errors.join("\n"), /unambiguous action-binding/);
  assert.match(infer(["Producer", "Consumer", "Consumer"], { duplicate: true }).errors.join("\n"), /unambiguous action-binding/);
  assert.match(infer(["Producer", "Consumer?", "Consumer"]).errors.join("\n"), /BU-002.*unambiguous/);
});

test("exclusion prose and unrelated citations do not assert action ownership", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  createReadyFixture(root);
  addSharedProducerConsumerCohort(root);
  write(path.join(root, "system-model/contracts/interfaces/iface-016-helper.md"), `---
type: interface
id: IFACE-016
producers: "SR-001"
consumers: "SR-001"
---
# Helper boundary

## Material Interactions

### ACT-002 — Local helper construction

### ACT-003 — Manual signing

### ACT-004 — Independent observation
`);
  const unit = (id, body) => ({ id, repository: "REPO-001", filePath: id + ".md", sourceResponsibilities: ["SR-001", "SR-002", "SR-003"], content: "### Material Interaction Bindings\n\n" + body });
  const binding = (role) => "| `IFACE-001.ACT-001` | route | " + role + " | source | audience | test | Planned |\n";
  const units = new Map([
    ["BU-001", unit("BU-001", binding("Producer"))],
    ["BU-002", unit("BU-002", binding("Consumer"))],
    ["BU-003", unit("BU-003", binding("Consumer / verifier"))],
    ["BU-008", unit("BU-008", "Local helper construction (`IFACE-016.ACT-002`) and manual Core signing/finalization/broadcast (`IFACE-016.ACT-003`) are outside BU-008.")],
    ["BU-009", unit("BU-009", "Manual signing/finalization/broadcast (`IFACE-016.ACT-003`) and independent child observation (`IFACE-016.ACT-004`) are outside BU-009.")],
  ]);
  const infer = () => {
    const errors = [];
    const rows = expectedKnownConsumerCoverage(root, units, [...units.keys()].map((id) => "BUILD_UNIT:" + id), [...units.keys()].map((id) => ({ buildUnits: [id], slug: id })), errors);
    return { rows, errors };
  };
  const result = infer();
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.rows.map((row) => [row.producerId, row.consumerId, row.interactionId]), [
    ["BU-001", "BU-002", "IFACE-001.ACT-001"], ["BU-001", "BU-003", "IFACE-001.ACT-001"],
  ]);
  units.get("BU-008").content += "\nSee `IFACE-001.ACT-001` for context, and `IFACE-016.ACT-004` for the independent observer.\n";
  assert.deepEqual(infer(), result, "prose cannot add ownership or erase genuine edges");
  for (const row of [
    binding("Producer").trimEnd().slice(0, -1), // missing closing delimiter
    "| `IFACE-016.ACT-002` | route | Producer |\n", // missing columns
    "| `IFACE-016.ACT-002` | route | Producer / not consumer | source | audience | test | Planned |\n",
  ]) {
    const prior = units.get("BU-008").content;
    units.get("BU-008").content += "\n" + row;
    assert.match(infer().errors.join("\n"), /BU-008.*unambiguous action-binding/);
    units.get("BU-008").content = prior;
  }
});

test("required interaction owners need actual binding rows despite prose citations or exclusions", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const handoff = createReadyFixture(root);
  addMaterialInteraction(root, { availability: "selected-slice output", conformance: "Planned", challenge: "Planned" });
  const unitPath = path.join(root, "build/units/bu-001-example-unit.md");
  const original = fs.readFileSync(unitPath, "utf8");
  assert.equal(run(deliveryValidator, root, handoff).status, 0);
  for (const replacement of ["", "See `IFACE-001.ACT-001` for context.", "`IFACE-001.ACT-001` is outside this unit.", "| `IFACE-001.ACT-0010` | route | Producer / consumer | source | audience | test | Planned |"] ) {
    write(unitPath, original.replace(/^\| `IFACE-001\.ACT-001`.*$/m, replacement));
    const result = run(deliveryValidator, root, handoff);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /consumer BUILD_UNIT:BU-001.*valid consumer action-binding row/);
    assert.match(result.stderr, /producer BUILD_UNIT:BU-001.*valid producer action-binding row/);
  }
  for (const [role, missing] of [["Producer", "consumer"], ["Consumer", "producer"], ["Producer or consumer", "consumer"], ["Producer / non-consumer", "producer"], ["Producer / producer", "producer"]]) {
    write(unitPath, original.replace("| Producer and consumer |", "| " + role + " |"));
    const result = run(deliveryValidator, root, handoff);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, new RegExp(missing + " BUILD_UNIT:BU-001.*valid " + missing + " action-binding row"));
  }
});

// Full disposable handoffs: parser fixtures are not provider or execution receipts.
const EXTERNAL_ACTION = '[IFACE-001.ACT-001](../../../system-model/contracts/interfaces/iface-001-read-state.md#act-001)';
const PROOF_OWNER = '`BUILD_UNIT:BU-001` — [BU-001](../../units/bu-001-example-unit.md)';
function externalAudienceFixture(root, audience = 'Public monitor') {
  const handoff = createReadyFixture(root);
  addMaterialInteraction(root, { availability: 'selected-slice output', conformance: 'Planned', challenge: 'Planned' });
  let s = fs.readFileSync(handoff, 'utf8');
  const start = s.indexOf('## Required Interaction Closure');
  s = s.slice(0, start) + s.slice(start).replace('**Consumer:** `BUILD_UNIT:BU-001`', '**Consumer:** `External` — '+audience+'; '+EXTERNAL_ACTION+'\n\n**Proof owner:** '+PROOF_OWNER)
    .replace('**Consumer path:** The state client in [BU-001](../../units/bu-001-example-unit.md) consumes the result.', '**Consumer path:** '+audience+' invokes the public route; '+EXTERNAL_ACTION+'; proof by '+PROOF_OWNER+'.');
  write(handoff,s); refreshSnapshot(root); return handoff;
}
function gatedInteractionFixture(root) {
  const handoff=createReadyFixture(root);
  addMaterialInteraction(root, { availability:'verified existing interaction' });
  let s=fs.readFileSync(handoff,'utf8');
  const input=s.slice(s.indexOf('### `INPUT-001`'),s.indexOf('## Required Interaction Closure'));
  const later=input.replace('INPUT-001','INPUT-002').replace('Deterministic verification fixture','Independent provider activation evidence')
    .replace('`Verification`','`Activation`').replace('`Fixture`','`External fact`').replace('`Existing`','`External`')
    .replace('`verified existing input`','`later-lifecycle output`').replace('`verified`','`not-applicable`')
    .replace('**Later-lifecycle gate:** `None.`','**Later-lifecycle gate:** `LGATE-001`');
  s=s.replace('## Required Interaction Closure',later+'## Required Interaction Closure')
    .replace('**Producer:** `External`','**Producer:** `External` — Independent publication authority; '+EXTERNAL_ACTION+'\n\n**Proof owner:** '+PROOF_OWNER)
    .replace('**Required at:** `Implementation`','**Required at:** `Activation`')
    .replace('**Availability:** `verified existing interaction`',`**Availability:** \`later-lifecycle output\`

**Later-lifecycle gate:** \`LGATE-001\`

**Lifecycle inputs:** \`INPUT-002\`

**Current-profile inputs:** \`INPUT-001\`

**Current-profile availability:** \`verified existing interaction\`

**Current-profile verification:** [BU-001](../../units/bu-001-example-unit.md) defines the approved isolated fixture profile and actual consumer proof; no provider activation or publication receipt is inferred.`)
    .replace('## Delivery Slice Realizability Review',`## Later-Lifecycle Gates

### \`LGATE-001\` — Independent provider activation

**Consumed at:** \`Activation\`

**Produced by:** Independent operator under ${EXTERNAL_ACTION}

**Gate condition:** Real provider operating evidence and approved capability are available.

**Verification:** Validate actual independent-provider identity and capability; fixture success cannot establish it.

**Until satisfied:** Activation and provider availability claims are prohibited.

## Delivery Slice Realizability Review`)
    .replace('**Required-input closure:** `PASS` —','**Required-input closure:** `PASS` — INPUT-002 / LGATE-001 remain mandatory at activation;')
    .replace('**Covers:** `INPUT-001`, `INT-001`, `Target outcome`','**Covers:** `INPUT-001`, `INPUT-002`, `INT-001`, `Target outcome`');
  write(handoff,s);refreshSnapshot(root);return handoff;
}
for (const audience of ['Public monitor','Local developer']) test('external interaction accepts '+audience+' without a fictional consumer BU',context=>{
 const root=fixture();context.after(()=>fs.rmSync(root,{recursive:true,force:true}));const handoff=externalAudienceFixture(root,audience);
 const result=run(deliveryValidator,root,handoff);assert.equal(result.status,0,result.stderr);
});
for (const [name,mutate,expected] of [
 ['missing proof owner',s=>s.replace('**Proof owner:** '+PROOF_OWNER,''),/Proof owner/],
 ['unknown proof owner',s=>s.replace('**Proof owner:** '+PROOF_OWNER,'**Proof owner:** `BUILD_UNIT:BU-999`'),/Proof owner/],
 ['missing canonical actor',s=>s.replace('Public monitor; '+EXTERNAL_ACTION,'Public monitor'),/canonical actor/],
 ['external label without identity',s=>s.replace('`External` — Public monitor; '+EXTERNAL_ACTION,'`External`'),/Consumer/],
 ['missing external path',s=>s.replace(/\*\*Consumer path:\*\*[^\n]+/,'**Consumer path:** `None.`'),/Consumer path/],
 ['missing current interaction',s=>s.replace('**Availability:** `selected-slice output`','**Availability:** `missing`'),/cannot claim readiness/],
]) test('external interaction rejects '+name,context=>{
 const root=fixture();context.after(()=>fs.rmSync(root,{recursive:true,force:true}));const handoff=externalAudienceFixture(root);write(handoff,mutate(fs.readFileSync(handoff,'utf8')));refreshSnapshot(root);
 const result=run(deliveryValidator,root,handoff);assert.notEqual(result.status,0);assert.match(result.stderr,expected);
});
test('gated interaction preserves mandatory activation evidence while current consumer proof passes',context=>{
 const root=fixture();context.after(()=>fs.rmSync(root,{recursive:true,force:true}));const handoff=gatedInteractionFixture(root);const result=run(deliveryValidator,root,handoff);assert.equal(result.status,0,result.stderr);
});
for(const [name,mutate,expected] of [
 ['early use',s=>s.replace('**Required at:** `Activation`','**Required at:** `Verification`'),/same later Required at/],
 ['missing gate',s=>s.replace('**Later-lifecycle gate:** `LGATE-001`','**Later-lifecycle gate:** `LGATE-999`'),/LGATE|Lifecycle inputs/],
 ['missing lifecycle input',s=>s.replace('**Lifecycle inputs:** `INPUT-002`','**Lifecycle inputs:** `INPUT-999`'),/Lifecycle inputs/],
 ['missing current fixture',s=>s.replace('**Availability:** `verified existing input`','**Availability:** `missing`'),/missing|current-profile/],
 ['future input reused early',s=>s.replace('**Current-profile inputs:** `INPUT-001`','**Current-profile inputs:** `INPUT-002`'),/current-profile/],
 ['no current proof',s=>s.replace('**Consumer challenge:** `PASS`','**Consumer challenge:** `Planned`'),/fresh independent/],
 ['unproduced fixture claimed verified',s=>s.replace('**Availability:** `verified existing input`','**Availability:** `selected-slice output`'),/unproduced selected-slice input/],
 ['fixture promoted to provider proof',s=>s.replace('**Availability:** `later-lifecycle output`','**Availability:** `verified existing interaction`'),/Later-lifecycle gate|Lifecycle inputs/],
 ['unknown current availability',s=>s.replace('**Current-profile availability:** `verified existing interaction`','**Current-profile availability:** `later`'),/Current-profile availability/],
 ['publication reassigned to observer',s=>s.replace('**Producer:** `External` — Independent publication authority; '+EXTERNAL_ACTION,'**Producer:** '+PROOF_OWNER),/same producer/],
 ['planned proof grants writable scope',s=>s.replace('**Current-profile availability:** `verified existing interaction`','**Current-profile availability:** `selected-slice output`').replace('**Writable build units:** `BUILD_UNIT:BU-001`','**Writable build units:** `None.`'),/already writable/],
 ['duplicate action',s=>s.replace('## Physical Realizability Closure',s.slice(s.indexOf('### `INT-001`'),s.indexOf('## Physical Realizability Closure'))+'\n## Physical Realizability Closure'),/duplicate|outside|missing/],
]) test('gated interaction rejects '+name,context=>{
 const root=fixture();context.after(()=>fs.rmSync(root,{recursive:true,force:true}));const handoff=gatedInteractionFixture(root);write(handoff,mutate(fs.readFileSync(handoff,'utf8')));refreshSnapshot(root);
 const result=run(deliveryValidator,root,handoff);assert.notEqual(result.status,0);assert.match(result.stderr,expected);
});

test('gated interaction may plan owned current consumer output without claiming provider evidence',context=>{
 const root=fixture();context.after(()=>fs.rmSync(root,{recursive:true,force:true}));const handoff=gatedInteractionFixture(root);
 write(handoff,fs.readFileSync(handoff,'utf8').replace('**Current-profile availability:** `verified existing interaction`','**Current-profile availability:** `selected-slice output`').replace('**Representation conformance:** `Verified`','**Representation conformance:** `Planned`').replace('**Consumer challenge:** `PASS`','**Consumer challenge:** `Planned`'));refreshSnapshot(root);
 const result=run(deliveryValidator,root,handoff);assert.equal(result.status,0,result.stderr);
});
test('external proof owner still requires a relevant explicit action binding',context=>{
 const root=fixture();context.after(()=>fs.rmSync(root,{recursive:true,force:true}));const handoff=externalAudienceFixture(root);
 const unit=path.join(root,'build/units/bu-001-example-unit.md');write(unit,fs.readFileSync(unit,'utf8').replace('| Producer and consumer |','| Observer only |'));refreshSnapshot(root);
 const result=run(deliveryValidator,root,handoff);assert.notEqual(result.status,0);assert.match(result.stderr,/binding|role|Proof owner/);
});

function addUnrelatedInteraction(root) {
  const file = path.join(root, 'system-model/contracts/interfaces/iface-001-read-state.md');
  const text = fs.readFileSync(file, 'utf8');
  const action = text.match(/<a id="act-001"><\/a>[\s\S]*?(?=\n## Preconditions)/)[0];
  write(file, text.replace('\n## Preconditions', '\n' + action.replaceAll('act-001', 'act-002').replaceAll('ACT-001', 'ACT-002') + '\n## Preconditions'));
}

function scopeExclusion(handoff, id = 'IFACE-001.ACT-002', evidence = null) {
  const links = evidence ?? `[Action](../../../system-model/contracts/interfaces/iface-001-read-state.md#${id.split('.')[1].toLowerCase()}) and [Writable scope](../../units/bu-001-example-unit.md)`;
  write(handoff, fs.readFileSync(handoff, 'utf8') + `\n### Interaction Scope Exclusions\n\n| Interaction | Canonical scope evidence | Reason |\n| --- | --- | --- |\n| \`${id}\` | ${links} | The selected unit binds only ACT-001; this other action shares a responsibility but is neither consumed nor changed by the selected delta. |\n`);
}

test('explicit canonical scope exclusion permits unrelated action without dropping selected obligation', (context) => {
  const root = fixture(); context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const handoff = createReadyFixture(root);
  addMaterialInteraction(root);
  addUnrelatedInteraction(root);
  refreshSnapshot(root);
  let result = run(deliveryValidator, root, handoff);
  assert.match(result.stderr, /omits selected-slice IFACE-001.ACT-002/);
  scopeExclusion(handoff);
  refreshSnapshot(root);
  result = run(deliveryValidator, root, handoff);
  assert.equal(result.status, 0, result.stderr);
  write(handoff, fs.readFileSync(handoff, 'utf8').replace(/### `INT-001`[\s\S]*?(?=\n## )/, '**Required interactions:** `None.` — [Scope](../../units/bu-001-example-unit.md) excludes all actions.\n'));
  refreshSnapshot(root);
  result = run(deliveryValidator, root, handoff);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /cannot declare no required interactions|omits selected-slice|must declare concrete None/);
});

test('writable material binding requires structured bounded delta evidence', (context) => {
  const root = fixture(); context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const handoff = createReadyFixture(root); addMaterialInteraction(root);
  scopeExclusion(handoff, 'IFACE-001.ACT-001'); refreshSnapshot(root);
  const result = run(deliveryValidator, root, handoff);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /writable-bound exclusions require one/);
});

for (const reference of ['IFACE-001.ACT-002', '[contract](../../../system-model/contracts/interfaces/iface-001-read-state.md#act-002)']) {
  test('required input protects consumed action from exclusion: ' + reference, (context) => {
    const root = fixture(); context.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const handoff = createReadyFixture(root); addMaterialInteraction(root); addUnrelatedInteraction(root);
    scopeExclusion(handoff);
    write(handoff, fs.readFileSync(handoff, 'utf8').replace(/(### `INPUT-001`[^\n]*\n)/, '$1\nConsumed contract: ' + reference + '\n'));
    refreshSnapshot(root);
    const result = run(deliveryValidator, root, handoff);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /cannot be excluded: required input INPUT-001/);
  });
}

for (const [label, id, evidence] of [
  ['unknown action', 'IFACE-001.ACT-999', null],
  ['missing action anchor', 'IFACE-001.ACT-002', '[Scope](../../units/bu-001-example-unit.md)'],
  ['missing writable scope', 'IFACE-001.ACT-002', '[Action](../../../system-model/contracts/interfaces/iface-001-read-state.md#act-002)'],
]) {
  test('rejects unsupported scope exclusion: ' + label, (context) => {
    const root = fixture(); context.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const handoff = createReadyFixture(root); addMaterialInteraction(root); addUnrelatedInteraction(root);
    scopeExclusion(handoff, id, evidence); refreshSnapshot(root);
    const result = run(deliveryValidator, root, handoff);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /invalid or duplicate entry|exclusion requires its exact canonical action/);
  });
}

test('ordinary selected-slice interaction and input reject a selected read-only producer', (context) => {
  const root = fixture(); context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const handoff = createReadyFixture(root); addMaterialInteraction(root, { availability: 'selected-slice output' });
  write(handoff, fs.readFileSync(handoff, 'utf8')
    .replace('**Produced by:** `External`', '**Produced by:** `BUILD_UNIT:BU-001` — [Owner](../../units/bu-001-example-unit.md)')
    .replace('**Producer repository:** `External`', '**Producer repository:** `REPO-001`')
    .replace('**Produced at:** `Existing`', '**Produced at:** `Implementation`')
    .replace('**Availability:** `verified existing input`', '**Availability:** `selected-slice output`'));
  refreshSnapshot(root);
  const valid = run(deliveryValidator, root, handoff);
  assert.equal(valid.status, 0, valid.stderr);
  write(handoff, fs.readFileSync(handoff, 'utf8').replace('**Writable build units:** `BUILD_UNIT:BU-001`', '**Writable build units:** `None.`'));
  refreshSnapshot(root);
  const result = run(deliveryValidator, root, handoff);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /INT-001 selected-slice output must have a writable producer/);
  assert.match(result.stderr, /INPUT-001 selected-slice output must have a writable producer/);
});

test('excluding unrelated action preserves genuine shared-producer consumer coverage', (context) => {
  const root = fixture(); context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const handoff = createReadyFixture(root); addSharedProducerConsumerCohort(root);
  addUnrelatedInteraction(root); scopeExclusion(handoff); refreshSnapshot(root);
  let result = run(deliveryValidator, root, handoff);
  assert.equal(result.status, 0, result.stderr);
  write(handoff, fs.readFileSync(handoff, 'utf8').replace(/^\| `BU-001` \| `BU-002`.*\n/m, ''));
  refreshSnapshot(root);
  result = run(deliveryValidator, root, handoff);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Known Consumer Compatibility Coverage omits.*BU-002/);
});

test('scope exclusions reject duplicate dispositions and conflicting required entries', (context) => {
  const root = fixture(); context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const handoff = createReadyFixture(root); addMaterialInteraction(root); addUnrelatedInteraction(root);
  scopeExclusion(handoff);
  const original = fs.readFileSync(handoff, 'utf8');
  const row = original.split('\n').find((line) => line.startsWith('| `IFACE-001.ACT-002`'));
  write(handoff, original + row + '\n'); refreshSnapshot(root);
  let result = run(deliveryValidator, root, handoff);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /invalid or duplicate entry/);
  const entry = original.match(/### `INT-001`[\s\S]*?(?=\n## )/)[0]
    .replaceAll('INT-001', 'INT-002').replaceAll('ACT-001', 'ACT-002').replaceAll('act-001', 'act-002');
  write(handoff, original.replace('## Physical Realizability Closure', entry + '\n## Physical Realizability Closure'));
  refreshSnapshot(root);
  result = run(deliveryValidator, root, handoff);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /outside the selected|out-of-scope|not derived|not in the expected|not a selected/);
});

test('explicit exclusion supports a slice with no required material interactions', (context) => {
  const root = fixture(); context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const handoff = createReadyFixture(root);
  const unit = path.join(root, 'build/units/bu-001-example-unit.md');
  const originalUnit = fs.readFileSync(unit, 'utf8');
  const originalHandoff = fs.readFileSync(handoff, 'utf8');
  addMaterialInteraction(root);
  write(unit, originalUnit); write(handoff, originalHandoff);
  scopeExclusion(handoff, 'IFACE-001.ACT-001'); refreshSnapshot(root);
  const result = run(deliveryValidator, root, handoff);
  assert.equal(result.status, 0, result.stderr);
});

function boundedDeltaFixture(root) {
  const handoff = createReadyFixture(root); addMaterialInteraction(root); addUnrelatedInteraction(root);
  const unit = path.join(root, 'build/units/bu-001-example-unit.md');
  const binding = fs.readFileSync(unit, 'utf8').split('\n').find(line => line.startsWith('| `IFACE-001.ACT-001`'));
  write(unit, fs.readFileSync(unit, 'utf8').replace(binding, binding + '\n' + binding.replaceAll('ACT-001', 'ACT-002').replaceAll('act-001', 'act-002')));
  scopeExclusion(handoff);
  const dir = path.dirname(handoff);
  const proof = path.join(dir, 'unchanged-branch.mjs');
  write(proof, '// Reviewed unchanged public branch and compatibility probe fixture.\nexport const unchanged = value => value;\n');
  const file = path.join(dir, 'bounded-scope.json');
  const pin = p => ({ path: path.relative(dir, p), sha256: 'sha256:' + createHash('sha256').update(fs.readFileSync(p)).digest('hex') });
  const contract = path.join(root, 'system-model/contracts/interfaces/iface-001-read-state.md');
  const assessment = { version: 1, scopeEvidence: [pin(unit)], actions: [1, 2].map(n => ({ action: 'IFACE-001.ACT-00' + n, requires: [], evidence: [pin(contract), pin(proof)], unchangedEvidence: [pin(proof)] })), checks: ['public-contract compatibility', 'shared-code regression'].map(kind => ({ kind, actions: ['IFACE-001.ACT-002'], obligation: 'PSEAM-001', evidence: [pin(proof)] })) };
  write(handoff, fs.readFileSync(handoff, 'utf8')
    .replace('## Allowed Delivery Slice', '## Allowed Delivery Slice\n\n**Target actions:** `IFACE-001.ACT-001`\n\n**Changed actions:** `IFACE-001.ACT-001`')
    .replace('**Probe:**', '**Bounded regression evidence:** [unchanged branch probe](./unchanged-branch.mjs)\n\n**Probe:**')
    .replace('### Interaction Scope Exclusions', '**Bounded delta scope:** [reviewed scope](./bounded-scope.json)\n\n**Bounded delta scope integrity:** `pending`\n\n### Interaction Scope Exclusions'));
  const save = () => {
    write(file, JSON.stringify(assessment, null, 2));
    write(handoff, fs.readFileSync(handoff, 'utf8').replace(/\*\*Bounded delta scope integrity:\*\*[^\n]+/, '**Bounded delta scope integrity:** `' + pin(file).sha256 + '`'));
    refreshSnapshot(root);
  };
  save(); return { handoff, assessment, save, file, proof };
}

test('bounded delta inside multi-action writable unit retains target and permits unchanged action exclusion', context => {
  const root = fixture(); context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const { handoff } = boundedDeltaFixture(root);
  const result = run(deliveryValidator, root, handoff);
  assert.equal(result.status, 0, result.stderr);
});
for (const [name, mutate, error] of [
  ['target action', f => write(f.handoff, fs.readFileSync(f.handoff, 'utf8').replace('**Target actions:** `IFACE-001.ACT-001`', '**Target actions:** `IFACE-001.ACT-002`')), /target, changed action or direct\/transitive prerequisite/],
  ['changed action', f => write(f.handoff, fs.readFileSync(f.handoff, 'utf8').replace('**Changed actions:** `IFACE-001.ACT-001`', '**Changed actions:** `IFACE-001.ACT-002`')), /target, changed action or direct\/transitive prerequisite/],
  ['direct dependency', f => f.assessment.actions[0].requires.push('IFACE-001.ACT-002'), /direct\/transitive prerequisite/],
  ['required input', f => write(f.handoff, fs.readFileSync(f.handoff, 'utf8').replace('### `INPUT-001`', 'Consumed IFACE-001.ACT-002\n\n### `INPUT-001`').replace('**Input kind:**', 'Consumed IFACE-001.ACT-002\n\n**Input kind:**')), /cannot be excluded: required input/],
  ['missing public compatibility', f => f.assessment.checks.shift(), /omits retained public-contract compatibility/],
  ['missing shared regression', f => f.assessment.checks.pop(), /omits retained shared-code regression/],
  ['removed retained evidence', f => write(f.handoff, fs.readFileSync(f.handoff, 'utf8').replace(/^\*\*Bounded regression evidence:.*\n/m, '')), /must retain the check/],
  ['invented compatibility obligation', f => f.assessment.checks[0].obligation = 'PSEAM-999', /retained PSEAM obligation/],
  ['stale unchanged source', f => write(f.proof, 'changed behavior'), /stale or invalid evidence/],
  ['missing unchanged evidence', f => delete f.assessment.actions[1].unchangedEvidence, /unchanged behavior requires pinned/],
  ['incomplete dependency inventory', f => f.assessment.actions.pop(), /omits canonical interaction/],
  ['prose instead of dependency edges', f => f.assessment.actions[0].requires = 'unrelated', /requires edges/],
]) test('bounded delta rejects hiding ' + name, context => {
  const root = fixture(); context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const f = boundedDeltaFixture(root); mutate(f); f.save();
  const result = run(deliveryValidator, root, f.handoff);
  assert.notEqual(result.status, 0); assert.match(result.stderr, error);
});

test('bounded scope assessment cannot change behind handoff snapshot', context => {
  const root = fixture(); context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const f = boundedDeltaFixture(root); write(f.file, fs.readFileSync(f.file, 'utf8') + '\n');
  const result = run(deliveryValidator, root, f.handoff);
  assert.notEqual(result.status, 0); assert.match(result.stderr, /assessment integrity is missing or stale/);
});

test('bounded delta preserves transitive prerequisite through a retained existing action', context => {
  const root = fixture(); context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const f = boundedDeltaFixture(root);
  const contract = path.join(root, 'system-model/contracts/interfaces/iface-001-read-state.md');
  const text = fs.readFileSync(contract, 'utf8');
  const action = text.match(/<a id="act-002"><\/a>[\s\S]*?(?=\n## Preconditions)/)[0];
  write(contract, text.replace('\n## Preconditions', '\n' + action.replaceAll('act-002', 'act-003').replaceAll('ACT-002', 'ACT-003') + '\n## Preconditions'));
  const unit = path.join(root, 'build/units/bu-001-example-unit.md');
  const binding = fs.readFileSync(unit, 'utf8').split('\n').find(line => line.startsWith('| `IFACE-001.ACT-001`'));
  write(unit, fs.readFileSync(unit, 'utf8').replace(binding, binding + '\n' + binding.replaceAll('ACT-001', 'ACT-003').replaceAll('act-001', 'act-003')));
  const handoff = fs.readFileSync(f.handoff, 'utf8');
  const entry = handoff.match(/### `INT-001`[\s\S]*?(?=\n## )/)[0].replaceAll('INT-001', 'INT-003').replaceAll('ACT-001', 'ACT-003').replaceAll('act-001', 'act-003');
  write(f.handoff, handoff.replace('**Interaction closure:** `PASS` — INT-001', '**Interaction closure:** `PASS` — INT-003 and INT-001').replace('## Physical Realizability Closure', entry + '\n## Physical Realizability Closure').replace('**Covers:** `INPUT-001`, `INT-001`,', '**Covers:** `INPUT-001`, `INT-001`, `INT-003`,'));
  f.assessment.actions.push({ ...f.assessment.actions[0], action: 'IFACE-001.ACT-003', requires: [] });
  f.assessment.actions[0].requires = ['IFACE-001.ACT-003'];
  for (const node of f.assessment.actions) node.evidence[0].sha256 = 'sha256:' + createHash('sha256').update(fs.readFileSync(contract)).digest('hex');
  f.assessment.scopeEvidence[0].sha256 = 'sha256:' + createHash('sha256').update(fs.readFileSync(unit)).digest('hex');
  f.save();
  let result = run(deliveryValidator, root, f.handoff);
  assert.equal(result.status, 0, result.stderr);
  f.assessment.actions[2].requires = ['IFACE-001.ACT-002']; f.save();
  result = run(deliveryValidator, root, f.handoff);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /IFACE-001.ACT-002 cannot be excluded: target, changed action or direct\/transitive prerequisite/);
});

for (const reference of ['IFACE-001.ACT-002', '[declared target](../../../system-model/contracts/interfaces/iface-001-read-state.md#act-002)']) {
  test('declared target outcome cannot be hidden by an ordinary exclusion: ' + reference, context => {
    const root = fixture(); context.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const handoff = createReadyFixture(root); addMaterialInteraction(root); addUnrelatedInteraction(root); scopeExclusion(handoff);
    write(handoff, fs.readFileSync(handoff, 'utf8').replace('**Target outcome:**', '**Target outcome:** ' + reference + ' — ')); refreshSnapshot(root);
    const result = run(deliveryValidator, root, handoff);
    assert.notEqual(result.status, 0); assert.match(result.stderr, /cannot be excluded: declared Target outcome/);
  });
}
