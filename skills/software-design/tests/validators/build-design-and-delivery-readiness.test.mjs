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
import {
  DEFAULT_COMPATIBILITY_REVIEW,
  fixture,
  write,
  run,
  refreshSnapshot,
  createReadyFixture,
  addPhysicalRealizability,
  addMaterialInteraction,
  addPlanningCapabilityReview,
  createCompletePlannedChain,
  createNewConsumerScenario,
  consumerWorkpack,
} from "../support/delivery-readiness-fixtures.mjs";

const skillRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");
const buildValidator = path.join(skillRoot, "scripts", "validate-build-design.mjs");
const deliveryValidator = path.join(skillRoot, "scripts", "validate-delivery-readiness.mjs");
const sequenceValidator = path.join(skillRoot, "scripts", "validate-handoff-sequence.mjs");

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
  write(path.join(root, "ui-ux", "index.html"), fs.readFileSync(path.join(skillRoot, "references/ui-ux/templates/index.html"), "utf8"));
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
  write(path.join(root, "system-model", "architecture.md"), "---\ntype: system-architecture\ndesign_format: 2\n---\n\n# System Architecture\n");
  write(path.join(root, "build", "workflow", "tickets", "example", "sr-001", "sr-001-tickets.yaml"), "ticket_file_version: 4\nscope: responsibility:SR-001\ntickets: []\n");

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

test('complete A/B/C handoffs validate in planning mode before producer implementation, while B/C strict readiness fails',context=>{
 const root=fixture();context.after(()=>fs.rmSync(root,{recursive:true,force:true}));const handoffs=createCompletePlannedChain(root);
 for(const [index,handoff] of handoffs.entries()) {
  const result=spawnSync(process.execPath,[deliveryValidator,'--root',root,'--handoff',handoff,'--validation-mode','planning'],{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
  const strict=run(deliveryValidator,root,handoff);assert.equal(strict.status,index?1:0,strict.stderr);
  if(index)assert.match(strict.stderr,/awaits actual compatible|requires PASS.*Execution-context|not executable/);
 }
});
test('planning retains capability scope gates and rejects an adapter beyond a coverage-route ceiling',context=>{
 const root=fixture();context.after(()=>fs.rmSync(root,{recursive:true,force:true}));const handoff=createReadyFixture(root);
 write(handoff,addPlanningCapabilityReview(fs.readFileSync(handoff,'utf8'),'001','Selected-slice output','`assurance/adapters/proof.mjs`'));refreshSnapshot(root);
 const result=spawnSync(process.execPath,[deliveryValidator,'--root',root,'--handoff',handoff,'--validation-mode','planning'],{encoding:'utf8'});
 assert.equal(result.status,1);assert.match(result.stderr,/changes exceed.*ceiling/);
});
test('delivery CLI mode is explicit and build-only/unknown combinations fail',context=>{
 const root=fixture();context.after(()=>fs.rmSync(root,{recursive:true,force:true}));createReadyFixture(root);
 for(const [command,mode] of [[buildValidator,'planning'],[buildValidator,'execution'],[deliveryValidator,'unknown']]) {
  const result=spawnSync(process.execPath,[command,'--root',root,'--validation-mode',mode],{encoding:'utf8'});assert.equal(result.status,1);assert.match(result.stderr,/supported only|Unknown validation mode/);
 }
});

test('matching producer fixture evidence enables bounded downstream reconciliation; incompatible evidence still fails',context=>{
 const root=fixture();context.after(()=>fs.rmSync(root,{recursive:true,force:true}));const handoffs=createCompletePlannedChain(root);
 const dir=path.dirname(handoffs[0]);
 write(path.join(dir,'producer-summary.txt'),`# Fixture producer evidence\n**Outcome:** \`COMPLETE\`\n**Output:** API 001\n**Contract:** v2\n**Producer:** \`BUILD_UNIT:BU-001\`\n**Executed snapshot:** \`sha256:${'a'.repeat(64)}\`\n**Executed workpack content:** \`sha256:${'b'.repeat(64)}\`\n`);
 write(path.join(dir,'consumer-proof.txt'),'# Fixture consumer observation\n**Outcome:** `PASS`\n**Output:** API 001\n**Contract:** v2\n**Consumer:** `BUILD_UNIT:BU-002`\n');
 const sequence=path.join(dir,'README.md');write(sequence,fs.readFileSync(sequence,'utf8').replace('**Current order group:** `1`','**Current order group:** `2`').replace('| None. | Ready |','| None. | Implemented |').replace('| repo-001-example-slice | Waiting |','| repo-001-example-slice | Ready |'));
 let b=fs.readFileSync(handoffs[1],'utf8').replace('**Availability:** `planned upstream output`','**Availability:** `verified existing input`').replace('**Maturity:** `not-applicable`','**Maturity:** `verified`')
 .replace('**Execution-context readiness:** `WAITING`','**Execution-context readiness:** `PASS`')
 .replace('**Current result:** `AWAITING_UPSTREAM`','**Current result:** `COMPATIBLE`').replace('**Producer observation:** `PLANNED_UPSTREAM_OUTPUT`','**Producer observation:** `OBSERVED`')
 .replace('**Candidate compatibility proof:** `PLANNED`','**Candidate compatibility proof:** `PASS`').replace('**Evidence provenance:** `planned-proof`','**Evidence provenance:** `accepted-receipt`')
 .replace('## Required Interaction Closure','**Upstream receipt:** [Actual matching fixture receipt](./producer-summary.txt)\n**Availability evidence:** [Actual matching fixture consumer proof](./consumer-proof.txt)\n\n## Required Interaction Closure');
 write(handoffs[1],b);writeDeliverySnapshot({root,handoffPath:handoffs[1]});
 const accepted=run(deliveryValidator,root,handoffs[1]);assert.equal(accepted.status,0,accepted.stderr);
 write(path.join(dir,'producer-summary.txt'),fs.readFileSync(path.join(dir,'producer-summary.txt'),'utf8').replace('v2','v1'));
 const rejected=run(deliveryValidator,root,handoffs[1]);assert.equal(rejected.status,1);assert.match(rejected.stderr,/matching completed producer receipt/);
});


test('aggregate planning preserves the same A/B/C rules as individual checks; execution stays strict', context => {
  const root = fixture(); context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const handoffs = createCompletePlannedChain(root);
  for (const handoff of handoffs) {
    const result = spawnSync(process.execPath, [deliveryValidator, '--root', root, '--handoff', handoff, '--validation-mode', 'planning'], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
  }
  const aggregate = mode => spawnSync(process.execPath, [deliveryValidator, '--root', root, '--validation-mode', mode], { encoding: 'utf8' });
  assert.equal(aggregate('planning').status, 0, aggregate('planning').stderr);
  const strict = aggregate('execution'); assert.equal(strict.status, 1); assert.match(strict.stderr, /awaits actual compatible upstream output/);
  assert.equal(run(deliveryValidator, root).status, 1);
  const build = run(buildValidator, root); assert.equal(build.status, 0, build.stderr);
  write(handoffs[1], fs.readFileSync(handoffs[1], 'utf8').replace('**Expected contract:** v2', '**Expected contract:** unapproved'));
  writeDeliverySnapshot({ root, handoffPath: handoffs[1] });
  const selected = spawnSync(process.execPath, [deliveryValidator, '--root', root, '--handoff', handoffs[1], '--validation-mode', 'planning'], { encoding: 'utf8' });
  assert.equal(selected.status, 1); assert.match(selected.stderr, /promised output\/contract\/owner/);
  const invalidAggregate = aggregate('planning'); assert.equal(invalidAggregate.status, 1); assert.match(invalidAggregate.stderr, /promised output\/contract\/owner/);
});


test('a verified A prerequisite permits owned new B consumer implementation without claiming final consumer fitness', context => {
  const root = fixture(); context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const f = createNewConsumerScenario(root);
  assert.equal(fs.existsSync(path.join(root, 'packages/example/state-client.mjs')), false);
  const ready = run(deliveryValidator, root, f.handoff); assert.equal(ready.status, 0, ready.stderr);
  const proof = path.join(f.dir, 'prerequisite-proof.txt'); const original = fs.readFileSync(proof, 'utf8');
  write(proof, original.replace('**Existing-consumer compatibility:** `PASS`', '**Existing-consumer compatibility:** `Planned`'));
  const incompatibleExisting = run(deliveryValidator, root, f.handoff); assert.equal(incompatibleExisting.status, 1); assert.match(incompatibleExisting.stderr, /existing-consumer compatibility/);
  write(proof, original);
  write(path.join(f.dir, 'a-output.json'), '{}');
  const stale = run(deliveryValidator, root, f.handoff); assert.equal(stale.status, 1); assert.match(stale.stderr, /exact artifact identity/);
});


// The execution start and completion half of this path runs in the repository-level
// cross-skill tests; this skill's suite covers handoff → workpack only.
test('handoff → workpack path separates A prerequisites from final new B consumer fitness', context => {
  const workspace = fixture(); context.after(() => fs.rmSync(workspace, { recursive: true, force: true }));
  const root = path.join(workspace, 'software-design'); const f = createNewConsumerScenario(root);
  const workpack = consumerWorkpack(f, workspace);
  const validateWorkpack = () => spawnSync(process.execPath, [path.join(skillRoot, 'scripts/validate-workpack.mjs'), '--workpack', workpack, '--validation-mode', 'execution'], { encoding: 'utf8' });
  const ready = validateWorkpack(); assert.equal(ready.status, 0, ready.stderr);
  assert.equal(fs.existsSync(path.join(root, 'packages/example/state-client.mjs')), false);
  const originalWorkpack = fs.readFileSync(workpack, 'utf8');
  write(workpack, originalWorkpack.replace('- **Evidence scope:** `consumer-fitness`', '- **Evidence scope:** `prerequisite`'));
  const noFinalRoute = validateWorkpack(); assert.equal(noFinalRoute.status, 1); assert.match(noFinalRoute.stderr, /mapped final VE/);
  write(workpack, originalWorkpack.replace('- **Availability evidence scope:** `prerequisite`', '- **Availability evidence scope:** `consumer-fitness`'));
  const substituted = validateWorkpack(); assert.equal(substituted.status, 1); assert.match(substituted.stderr, /preserve upstream dependency/);
  write(workpack, originalWorkpack);
  const artifact = path.join(f.dir, 'a-output.json'); const bytes = fs.readFileSync(artifact);
  fs.rmSync(artifact); const missing = validateWorkpack(); assert.equal(missing.status, 1); assert.match(missing.stderr, /exact artifact identity|Broken handoff link/); write(artifact, bytes);
  const receipt = path.join(f.dir, 'producer-summary.txt'); const originalReceipt = fs.readFileSync(receipt, 'utf8');
  write(receipt, originalReceipt.replace('**Contract:** v2', '**Contract:** v1')); const incompatible = validateWorkpack(); assert.equal(incompatible.status, 1); assert.match(incompatible.stderr, /matching completed producer receipt/); write(receipt, originalReceipt);
  const proof = path.join(f.dir, 'prerequisite-proof.txt'); const originalProof = fs.readFileSync(proof, 'utf8');
  write(proof, originalProof.replace('**Existing-consumer compatibility:** `PASS`', '**Existing-consumer compatibility:** `Planned`'));
  const existing = validateWorkpack(); assert.equal(existing.status, 1); assert.match(existing.stderr, /existing-consumer compatibility/); write(proof, originalProof);
  const originalHandoff = fs.readFileSync(f.handoff, 'utf8');
  for (const [mutation, error] of [
    [text => text.replace('**Availability:** `selected-slice consumer`', '**Availability:** `verified existing interaction`'), /existing consumer fitness cannot be deferred|requires a fresh independent consumer/],
    [text => text.replace('**Proof owner:** `BUILD_UNIT:BU-002`', '**Proof owner:** `BUILD_UNIT:BU-001`'), /writable consumer\/proof owner|Proof owner/],
    [text => text.replace('`packages/example/state-client.test.mjs`', '`assurance/adapters/unapproved.mjs`'), /changes exceed.*ceiling/],
  ]) {
    write(f.handoff, mutation(originalHandoff)); writeDeliverySnapshot({ root, handoffPath: f.handoff });
    // Keep snapshot and exact projection current so the actual semantic gate is exercised.
    consumerWorkpack(f, workspace);
    const blocked = validateWorkpack(); assert.equal(blocked.status, 1); assert.match(blocked.stderr, error);
  }
  write(f.handoff, originalHandoff); writeDeliverySnapshot({ root, handoffPath: f.handoff }); consumerWorkpack(f, workspace);
});
