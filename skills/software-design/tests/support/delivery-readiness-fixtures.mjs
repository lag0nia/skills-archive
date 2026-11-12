import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { writeDeliverySnapshot } from "../../scripts/lib/delivery-snapshot.mjs";

// Disposable Stage 8/9 package fixtures shared by the readiness, workpack, and
// cross-skill delivery tests. Every helper writes only under its own temporary root.
const skillRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");

export const DEFAULT_COMPATIBILITY_REVIEW = `**Shared-producer surface closure:** \`PASS\` — [BU-001](../../units/bu-001-example-unit.md) proves the target-version surface is bounded to this isolated unit.

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

export function fixture() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "software-design-readiness-"));
}

export function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

export function run(validator, root, handoff = null) {
  const args = [validator, "--root", root];
  if (handoff) args.push("--handoff", handoff);
  return spawnSync(process.execPath, args, { encoding: "utf8" });
}

export function refreshSnapshot(root) {
  const handoffPath = path.join(root, "build", "workflow", "handoffs", "repo-001-example-slice.md");
  writeDeliverySnapshot({ root, handoffPath });
  return handoffPath;
}

export function createReadyFixture(root, { withSelection = true, withVerification = true } = {}) {
  write(path.join(root, "README.md"), `# Example Software Design

- [System Model](./system-model/architecture.md)
- [Build Design](./build/README.md)
`);
  write(path.join(root, "system-model", "architecture.md"), `---
type: system-architecture
design_format: 2
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
  write(path.join(root, "build", "workflow", "tickets", "example", "sr-001", "sr-001-tickets.yaml"), `ticket_file_version: 4
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

export function addPhysicalRealizability(root, {
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

export function addMaterialInteraction(root, {
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

export function addPlanningCapabilityReview(handoff, unit='001', disposition='Existing', changes='`None.`') {
  const ceiling='`packages/example`';
  handoff=handoff.replace('## Selected Or Inherited Implementation Shape', `**Writable paths:** ${ceiling}\n\n### OUTPUT-001\n**Output:** API ${unit}\n**Contract:** v2\n**Contract authority:** [Approved selection](../../records/selections/sel-${unit}-runtime.md)\n**Owner:** \`BUILD_UNIT:BU-${unit}\`\n**Writable paths:** ${ceiling}\n**Verification:** Exercise the built public package entrypoint.\n\n## Selected Or Inherited Implementation Shape`);
  return handoff.replace('### Known Consumer Compatibility Coverage',`**Writable paths:** ${ceiling}\n\n### CAP-001\n**Capability:** Public package implementation and its deterministic verification harness\n**Disposition:** \`${disposition}\`\n**Owner:** \`BUILD_UNIT:BU-${unit}\`\n**Allowed interface:** Approved package export and harness.\n**Required changes:** ${changes}\n**Evidence:** [BU-${unit}](../../units/bu-${unit}-example-unit.md) describes inspected interface and proof route.\n**Verification:** Run the public package and harness procedures.\n\n### Known Consumer Compatibility Coverage`);
}

export function createCompletePlannedChain(root) {
  let guides=[];
  for (let index=1;index<=3;index++) {
    const n=String(index).padStart(3,'0');const isolated=fixture();createReadyFixture(isolated);
    const copy=(dir)=>{for(const item of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,item.name);if(item.isDirectory())copy(file);else{
      const relative=path.relative(isolated,file).replaceAll('001',n);
      let content=fs.readFileSync(file,'utf8').replaceAll('001',n).replaceAll('0001',String(index).padStart(4,'0')).replaceAll('INPUT-'+n,'INPUT-001').replaceAll('PSEAM-'+n,'PSEAM-001');
      if(relative==='build/README.md'){guides.push(content.slice(content.indexOf('### [REPO-')));continue;}
      if(relative.endsWith(`repo-${n}-example-slice.md`)) content=addPlanningCapabilityReview(content,n);
      write(path.join(root,relative),content);
    }}};
    copy(isolated);fs.rmSync(isolated,{recursive:true,force:true});
  }
  write(path.join(root,'build/README.md'),'# Build\n\nThe three independent packages form one delivery cohort.\n\n## Construction At A Glance\n\n'+guides.join('\n'));
  const domain=path.join(root,'system-model/domains/example/domain.md');write(domain,fs.readFileSync(domain,'utf8').replace('responsibilities: "SR-003"','responsibilities: "SR-001, SR-002, SR-003"'));
  const dir=path.join(root,'build/workflow/handoffs');
  const paths=[1,2,3].map(i=>path.join(dir,`repo-00${i}-example-slice.md`));
  write(path.join(dir,'README.md'),`# Handoff Sequence\n\n**Current order group:** \`1\`\n\n| Order group | Delivery slice | Repository | Build Units | Requires | State |\n| --- | --- | --- | --- | --- | --- |\n${paths.map((p,i)=>`| ${i+1} | [repo-00${i+1}-example-slice](./${path.basename(p)}) | REPO-00${i+1} | BU-00${i+1} | ${i?`repo-00${i}-example-slice`:'None.'} | ${i?'Waiting':'Ready'} |`).join('\n')}\n`);
  for (const i of [1,2]) {
    const n=String(i+1).padStart(3,'0'),prev=String(i).padStart(3,'0');
    const unit=path.join(root,`build/units/bu-${n}-example-unit.md`);
    write(unit,fs.readFileSync(unit,'utf8').replace('depends_on_build_units: "None."',`depends_on_build_units: "BU-${prev}"`));
    let handoff=fs.readFileSync(paths[i],'utf8').replace('**Dependencies:** `None.`',`**Dependencies:** \`BUILD_UNIT:BU-${prev}\` — [Producer](../../units/bu-${prev}-example-unit.md)`);
    handoff=handoff.replace('**Produced by:** `External`',`**Produced by:** \`BUILD_UNIT:BU-${prev}\` — [Producer](../../units/bu-${prev}-example-unit.md)`)
      .replace('**Producer repository:** `External`',`**Producer repository:** \`REPO-${prev}\``).replace('**Produced at:** `Existing`','**Produced at:** `Implementation`')
      .replace('**Availability:** `verified existing input`','**Availability:** `planned upstream output`').replace('**Maturity:** `verified`','**Maturity:** `not-applicable`')
      .replace('## Required Interaction Closure',`**Producer handoff:** [Expected output](./${path.basename(paths[i-1])}#output-001)\n**Expected output:** API ${prev}\n**Expected contract:** v2\n**Consumption point:** Phase 1 built package consumer\n**Availability check:** Acquire exact producer and exercise its public seam with this consumer.\n\n## Required Interaction Closure`)
      .replace('**Execution-context readiness:** `PASS`','**Execution-context readiness:** `WAITING`')
      .replace('binds the selected artifact and environment.','binds the environment; planned upstream output awaits earlier order group.')
      .replace('INPUT-001 is the verified deterministic fixture','INPUT-001 is the planned upstream output');
    const seam=/### `PSEAM-001`[^\n]*\n([\s\S]*?)(?=^## )/m.exec(handoff)[0];
    const future=seam.replace('PSEAM-001','PSEAM-002').replace('**Covers:** `INPUT-001`, `Target outcome`','**Covers:** `INPUT-001`')
      .replace('**Implementation situation:** `existing-unchanged`','**Implementation situation:** `new-output`')
      .replace('**Producer observation:** `OBSERVED`','**Producer observation:** `PLANNED_UPSTREAM_OUTPUT`')
      .replace('emits the accepted deterministic value.','declares the expected representation; no actual output is claimed.')
      .replace('**Candidate compatibility proof:** `NOT_APPLICABLE`','**Candidate compatibility proof:** `PLANNED`')
      .replace('**Evidence provenance:** `accepted-receipt`','**Evidence provenance:** `planned-proof`')
      .replace('records the current observation.','defines the scheduled future consumer proof, not observed success.')
      .replace('**Current result:** `COMPATIBLE`','**Current result:** `AWAITING_UPSTREAM`');
    handoff=handoff.replace(seam,seam.replace('**Covers:** `INPUT-001`, `Target outcome`','**Covers:** `Target outcome`')+future)
      .replace('PSEAM-001 confirms compatibility','PSEAM-001 and PSEAM-002 retain target compatibility and planned upstream proof');
    write(paths[i],handoff);
  }
  for(const handoffPath of paths)writeDeliverySnapshot({root,handoffPath});
  return paths;
}

export function createNewConsumerScenario(root) {
  const handoffs = createCompletePlannedChain(root);
  const dir = path.dirname(handoffs[0]);
  const isolated = fixture(); createReadyFixture(isolated); addMaterialInteraction(isolated, { availability: 'selected-slice output', conformance: 'Planned' });
  const initial = fs.readFileSync(path.join(isolated, 'build/workflow/handoffs/repo-001-example-slice.md'), 'utf8');
  let interaction = initial.match(/## Required Interaction Closure[\s\S]*?(?=\n## Physical Realizability Closure)/)[0].replaceAll('BU-001', 'BU-002').replaceAll('bu-001', 'bu-002');
  interaction = interaction.replace('**Producer:** `BUILD_UNIT:BU-002` — [BU-002 producer](../../units/bu-002-example-unit.md)', '**Producer:** `BUILD_UNIT:BU-001` — [A producer](../../units/bu-001-example-unit.md)')
    .replace('**Availability:** `selected-slice output`', '**Availability:** `selected-slice consumer`\n**Proof owner:** `BUILD_UNIT:BU-002` — [New consumer and final proof](../../units/bu-002-example-unit.md)');
  const contractPath = path.join(root, 'system-model/contracts/interfaces/iface-001-read-state.md');
  write(contractPath, fs.readFileSync(path.join(isolated, 'system-model/contracts/interfaces/iface-001-read-state.md'), 'utf8').replace('consumers: "None."', 'consumers: "SR-002"'));
  const binding = fs.readFileSync(path.join(isolated, 'build/units/bu-001-example-unit.md'), 'utf8').match(/\| Logical interaction \|[\s\S]*?(?=\n\n)/)[0];
  fs.rmSync(isolated, { recursive: true, force: true });
  for (const n of ['001', '002']) {
    const unit = path.join(root, `build/units/bu-${n}-example-unit.md`);
    write(unit, fs.readFileSync(unit, 'utf8').replace('**Material interaction bindings:** `None.` — This isolated unit has no material cross-Build-Unit or external interaction.', binding.replace('Producer and consumer', n === '001' ? 'Producer' : 'Consumer').replace('`Planned`', n === '001' ? '`Verified`' : '`Planned`')));
    const responsibility = path.join(root, `system-model/domains/example/responsibilities/sr-${n}-example.md`);
    write(responsibility, fs.readFileSync(responsibility, 'utf8').replace('participates_in: "None."', 'participates_in: "IFACE-001"'));
  }
  // Synthetic completed A receipt and actual disposable A bytes; B's consumer is absent.
  write(path.join(dir, 'a-output.json'), JSON.stringify({ subject: 'subject-1', state: 'active', contract: 'v2' }));
  const actual = JSON.parse(fs.readFileSync(path.join(dir, 'a-output.json'), 'utf8'));
  assert.equal(actual.contract, 'v2'); assert.equal(actual.state, 'active');
  const artifactHash = 'sha256:' + createHash('sha256').update(fs.readFileSync(path.join(dir, 'a-output.json'))).digest('hex');
  write(path.join(dir, 'a-conformance.txt'), 'Actual fixture A output exposes the approved v2 subject/state representation. No B consumer is implemented or observed.\n');
  write(path.join(dir, 'existing-compatibility.txt'), 'Existing A reader compatibility probe: subject-1 maps to active. This is an existing reader, not the new B client.\n');
  const existingReader = value => value.state; assert.equal(existingReader(actual), 'active');
  write(path.join(dir, 'producer-summary.txt'), `# Synthetic completed A receipt\n**Outcome:** \`COMPLETE\`\n**Output:** API 001\n**Contract:** v2\n**Producer:** \`BUILD_UNIT:BU-001\`\n**Executed snapshot:** \`sha256:${'a'.repeat(64)}\`\n**Executed workpack content:** \`sha256:${'b'.repeat(64)}\`\n`);
  write(path.join(dir, 'prerequisite-proof.txt'), `# A prerequisite observation for B\n**Scope:** \`prerequisite\`\n**Outcome:** \`PASS\`\n**Output:** API 001\n**Contract:** v2\n**Consumer:** \`BUILD_UNIT:BU-002\`\n**Artifact:** [Actual A bytes](./a-output.json)\n**Artifact identity:** \`${artifactHash}\`\n**Producer identity:** Actual acquired A artifact \`${artifactHash}\`; see linked A conformance observation.\n**Producer conformance:** \`PASS\` — [Observed A representation](./a-conformance.txt)\n**Existing-consumer compatibility:** \`PASS\` — [Existing reader probe](./existing-compatibility.txt)\n`);
  const dependency = '**Producer handoff:** [Expected output](./repo-001-example-slice.md#output-001)\n**Expected output:** API 001\n**Expected contract:** v2\n**Consumption point:** B implementation consumes A through its public state representation.\n**Availability check:** Verify A exact bytes, v2 conformance and existing-reader compatibility before source edits; final B fitness follows B implementation.\n**Availability evidence scope:** `prerequisite`\n**Upstream receipt:** [A receipt](./producer-summary.txt)\n**Availability evidence:** [Actual prerequisite observation](./prerequisite-proof.txt)\n';
  interaction += '\n' + dependency;
  let b = fs.readFileSync(handoffs[1], 'utf8')
    .replace(/## Required Interaction Closure[\s\S]*?(?=\n## Physical Realizability Closure)/, interaction.trimEnd())
    .replace(/\*\*Producer handoff:\*\*[\s\S]*?(?=\n## Required Interaction Closure)/, dependency)
    .replace('**Availability:** `planned upstream output`', '**Availability:** `verified existing input`')
    .replace('**Maturity:** `not-applicable`', '**Maturity:** `verified`')
    .replace('**Execution-context readiness:** `WAITING`', '**Execution-context readiness:** `PASS`')
    .replace(/^\*\*Interaction closure:\*\*.*$/m, '**Interaction closure:** `PASS` — INT-001 [B consumer](../../units/bu-002-example-unit.md) owns final fitness; A prerequisite is verified.')
    .replace('**Required interactions:** `None.`', '**Required interactions:** `IFACE-001.ACT-001`');
  const seam = b.match(/### `PSEAM-002`[^\n]*\n[\s\S]*?(?=^## )/m)[0];
  const owned = seam.replace('**Covers:** `INPUT-001`', '**Covers:** `INPUT-001`, `INT-001`')
    .replace('**Producer observation:** `PLANNED_UPSTREAM_OUTPUT`', '**Producer observation:** `OBSERVED`')
    .replace('declares the expected representation; no actual output is claimed.', 'is observed in [A prerequisite evidence](./prerequisite-proof.txt); B fitness is not observed.')
    .replace(/^\*\*Consumer observation:\*\*.*$/m, '**Consumer observation:** `SELECTED_SLICE_OUTPUT` — [B owner](../../units/bu-002-example-unit.md) will implement the new consumer and final proof; no B fitness is observed.')
    .replace('**Current result:** `AWAITING_UPSTREAM`', '**Current result:** `DELTA_OWNED`')
    .replace('**Delta owner:** `None.`', '**Delta owner:** `BUILD_UNIT:BU-002`');
  b = b.replace(seam, owned);
  // All B construction and its proof harness are inside the approved ceiling.
  b = b.replace('**Disposition:** `Existing`', '**Disposition:** `Selected-slice output`').replace('**Required changes:** `None.`', '**Required changes:** `packages/example/state-client.mjs`, `packages/example/state-client.test.mjs`');
  write(handoffs[1], b);
  const sequence = path.join(dir, 'README.md');
  write(sequence, fs.readFileSync(sequence, 'utf8').replace('**Current order group:** `1`', '**Current order group:** `2`').replace('| None. | Ready |', '| None. | Implemented |').replace('| repo-001-example-slice | Waiting |', '| repo-001-example-slice | Ready |'));
  writeDeliverySnapshot({ root, handoffPath: handoffs[1] });
  return { root, handoff: handoffs[1], dir };
}

export function consumerWorkpack(f, workspace) {
  const handoff = fs.readFileSync(f.handoff, 'utf8');
  const wp = path.join(workspace, 'delivery-workpacks/repo-002-example-slice/WORKPACK.md');
  const handoffDir = path.dirname(f.handoff); const wpDir = path.dirname(wp);
  const field = (body, name) => new RegExp('^\\*\\*' + name + ':\\*\\*\\s*(.+)$', 'm').exec(body)?.[1] || '';
  const records = kind => [...handoff.matchAll(new RegExp('^### `?(' + kind + '-\\d{3})`?[^\\n]*\\n([\\s\\S]*?)(?=^#{1,3} |$(?![\\s\\S]))', 'gm'))].map(m => ({ id: m[1], body: m[2] }));
  const rebase = value => value.replace(/\[([^\]]+)\]\(([^)#]+)(#[^)]*)?\)/g, (_, label, file, anchor = '') => `[${label}](${path.relative(wpDir, path.resolve(handoffDir, file)).split(path.sep).join('/')}${anchor})`);
  const ref = path.relative(wpDir, f.handoff).split(path.sep).join('/');
  let obligations = '## Stage 9 Obligation Coverage\n';
  for (const kind of ['INPUT', 'INT']) for (const record of records(kind)) {
    obligations += `### \`${record.id}\` — ${kind === 'INT' ? '`IFACE-001.ACT-001`' : 'Actual A prerequisite'}\n- **Handoff source:** [${record.id}](${ref}#${record.id.toLowerCase()})\n`;
    const names = kind === 'INPUT' ? ['Availability', 'Produced by'] : ['Consumer', 'Producer', 'Proof owner', 'Required at', 'Availability', 'Required evidence classes'];
    for (const name of [...names, 'Producer handoff', 'Expected output', 'Expected contract', 'Consumption point', 'Availability check', 'Availability evidence scope', 'Upstream receipt', 'Availability evidence']) obligations += `- **${name}:** ${rebase(field(record.body, name))}\n`;
    obligations += '- **Handling:** Verify A prerequisite before construction; implement B and run final consumer proof afterwards.\n- **Coverage:** `VE-001`\n';
    if (kind === 'INT') obligations += '- **High-risk cases:** `None.`\n';
    obligations += '\n';
  }
  for (const record of records('PSEAM')) {
    obligations += `### \`${record.id}\` — B physical seam\n- **Handoff source:** [${record.id}](${ref}#${record.id.toLowerCase()})\n`;
    for (const [name, source] of [['Handoff result', 'Current result'], ['Implementation situation', 'Implementation situation'], ['Boundary class', 'Boundary class'], ['Candidate compatibility proof', 'Candidate compatibility proof'], ['Evidence provenance', 'Evidence provenance']]) obligations += `- **${name}:** ${rebase(field(record.body, source))}\n`;
    obligations += '- **Handling:** Preserve verified A; implement B and prove B consumer fitness.\n- **Direct change-impact handling:** Keep source, tests, fixtures, manifests, generated surfaces and evidence inside the approved B ceiling.\n- **Required-command-effect handling:** Preserve approved command-effect limits.\n- **Coverage:** `VE-001`\n- **Protected-boundary compatibility:** `PB-001` — approved contract remains unchanged.\n\n';
  }
  obligations += `**Verification obligations:** \`None.\` — [VO-free selected scope](${ref}#allowed-delivery-slice)\n\n`;
  const snapshot = field(handoff, 'Snapshot ID').replaceAll('`', '');
  const template = fs.readFileSync(path.join(skillRoot, 'tests/support/new-consumer-workpack.md'), 'utf8');
  let workpack = template.replaceAll('sha256:SNAPSHOT', snapshot).replaceAll('sha256-SNAPSHOT', snapshot.replace(':', '-'))
    .replace(/## Stage 9 Obligation Coverage[\s\S]*?(?=## Delivery Responsibility Coverage)/, obligations)
    .replace('handoff declares no interaction obligations.', 'INT-001 preserves the final consumer-fitness obligation.')
    .replace('| Upstream Build Unit |', '| Interface contract | IFACE-001 | IFACE-001 | [Contract](../../software-design/system-model/contracts/interfaces/iface-001-read-state.md) | Consumer behavior. |\n| Upstream Build Unit |');
  write(wp, workpack);
  return wp;
}
