#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const validator = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "scripts", "validate-workpack.mjs");
const template = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "assets", "templates", "WORKPACK.md");
const planningSkill = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "SKILL.md");
const workpackRules = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "references", "workpack-rules.md");
const deliveryEvidenceRules = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "references", "delivery-evidence.md");
const SNAPSHOT = "sha256:" + "a".repeat(64);
const EVIDENCE_EXECUTION_ROOT = "delivery-evidence/executions/sha256-" + "a".repeat(64) + "/";

const HANDOFF_GATE = `## Later-Lifecycle Gates
### \`LGATE-001\` — Production identity
**Consumed at:** \`Release\`
**Produced by:** [BU](../../units/bu-001-example.md)
**Gate condition:** The deployment-produced identity exists.
**Verification:** Compare it with the deployed artifact.
**Until satisfied:** Production release and release-ready claims are prohibited.

`;

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function handoffText({
  selected = "`BUILD_UNIT:BU-001`",
  dependencies = "`None.`",
  disposition = "`Full repository`",
  gates = "",
} = {}) {
  return `# Stage 9 Handoff

## Readiness Outcome
**Outcome:** \`IMPLEMENTATION_DETAILS_READY\`
**Snapshot ID:** \`${SNAPSHOT}\`

## Allowed Delivery Slice
**Selected build units:** ${selected}

## Required Input Ledger
### \`INPUT-001\` — Example fixture
**Consumer:** \`BUILD_UNIT:BU-001\`
**Consumed at:** \`Verification\`
**Input kind:** \`Fixture\`
**Availability:** \`selected-slice output\`
**Evidence:** [BU-001](../../units/bu-001-example.md)

## Required Interaction Closure
### \`INT-001\` — \`IFACE-001.ACT-001\`
**Consumer:** \`BUILD_UNIT:BU-001\`
**Required evidence classes:** \`existence\`, \`structural-conformance\`, \`behavioral\`, \`consumer-fitness\`
**Risk:** \`ordinary\`

${gates}## Build Unit Routing Index
### \`BUILD_UNIT:BU-001\`
**Readiness:** \`READY\`
**Canonical sources:** [BU-001](../../units/bu-001-example.md); [SR-001](../../../system-model/responsibilities/sr-001-example.md).
**Repository Build Design:** [REPO-001](../../repositories/repo-001-example/README.md)
**Technical constraints:** [CONS-001](../../records/constraints/cons-001-example.md)
**Repository membership disposition:** ${disposition}
**Implementation selections:** [SEL-001](../../records/selections/sel-001-example.md)
**Verification references:** [VA-001](../../records/verification/va-001-example.md)
**Dependencies:** ${dependencies}
**Mapped tickets:** \`None.\`
**Blockers:** \`None.\`

## Protected Technical Boundaries
[CONS-001](../../records/constraints/cons-001-example.md) remains authoritative.

## Cross-Unit Integration And Verification
[VA-001](../../records/verification/va-001-example.md) proves the selected behavior.

## Exclusions And Local Discretion
None.
`;
}

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "delivery-workpack-validator-"));
  const softwareDesign = path.join(root, "software-design");
  write(path.join(softwareDesign, "system-model", "responsibilities", "sr-001-example.md"), "# SR-001 — Example\n");
  write(path.join(softwareDesign, "system-model", "responsibilities", "sr-002-extra.md"), "# SR-002 — Extra\n");
  write(path.join(softwareDesign, "build", "units", "bu-001-example.md"), `---
source_responsibilities: "SR-001"
---
# BU-001

## Module Architecture
One public example seam.

## Source Responsibility Mapping
Implements [SR-001](../../system-model/responsibilities/sr-001-example.md).
`);
  write(path.join(softwareDesign, "build", "repositories", "repo-001-example", "README.md"), "# REPO-001\n\n**Derived artifact:** [Repository agent guidance](./agent-guidance.md)\n");
  write(path.join(softwareDesign, "build", "repositories", "repo-001-example", "agent-guidance.md"), "# Repository Agent Guidance\n");
  write(path.join(softwareDesign, "build", "records", "constraints", "cons-001-example.md"), "# CONS-001\n");
  write(path.join(softwareDesign, "build", "records", "selections", "sel-001-example.md"), "# SEL-001\n");
  write(path.join(softwareDesign, "build", "records", "verification", "va-001-example.md"), "# VA-001\n");
  write(path.join(softwareDesign, "build", "workflow", "handoffs", "example.md"), handoffText());
  write(path.join(root, "legacy-handoff.md"), "# Legacy Stage 9 Handoff\n\n**Snapshot ID:** `" + SNAPSHOT + "`\n");
  write(path.join(softwareDesign, "build", "architecture.md"), "# Retired architecture\n");
  write(path.join(softwareDesign, "views", "retired-projection.md"), "# Retired projection\n");
  write(path.join(root, "software-design-skill", "scripts", "report-build-unit-readiness-reconciliation.mjs"), `
process.stdout.write("readiness reconciliation ran\\n");
`);
  write(path.join(root, "software-design-skill", "scripts", "validate-handoff-sequence.mjs"), `
process.stdout.write("sequence eligibility ran\\n");
`);
  write(path.join(root, "software-design-skill", "scripts", "validate-delivery-readiness.mjs"), `
import fs from "node:fs";
const index = process.argv.indexOf("--handoff");
const handoff = index >= 0 ? process.argv[index + 1] : null;
const content = handoff ? fs.readFileSync(handoff, "utf8") : "";
if (!handoff || content.includes("STALE-SNAPSHOT") || content.includes("INVALID-STAGE9")) {
  process.stderr.write("Stage 9 readiness validation failed.\\n");
  process.exitCode = 1;
} else {
  process.stdout.write("Verified current Stage 9 readiness.\\n");
}
`);
  return root;
}

function validWorkpack({ selected = "`BUILD_UNIT:BU-001`", coverage = "", dependencies = "- `None.` — no direct dependency." } = {}) {
  return `# Example Delivery

## Delivery Objective
Deliver the observable example behavior.

**Software Design snapshot:** \`${SNAPSHOT}\`

## Delivery Scope
### Selected Build Units
- ${selected} — selected delivery.

### Repository Disposition
- \`REPO-001\` — \`Full repository\`; deliver the selected code path.

### Direct Build Unit Dependencies
${dependencies}

### Explicit Exclusions
- \`None.\` — the handoff excludes no selected responsibility.

### Local Implementation Discretion
- \`None.\`

## Canonical Sources Used
| Kind | Scope | ID | Canonical path | Used for |
| --- | --- | --- | --- | --- |
| Stage 9 handoff | Selected delivery | — | [Handoff](../../software-design/build/workflow/handoffs/example.md) | Scope and snapshot. |
| Build Unit | BU-001 | BU-001 | [BU](../../software-design/build/units/bu-001-example.md) | Responsibility. |
| Repository Build Design | REPO-001 | REPO-001 | [Repository](../../software-design/build/repositories/repo-001-example/README.md) | Repository contract. |
| Repository agent guidance | REPO-001 | — | [Agent guidance](../../software-design/build/repositories/repo-001-example/agent-guidance.md) | Root AGENTS.md projection. |
| Technical Constraint | BU-001 | CONS-001 | [Constraint](../../software-design/build/records/constraints/cons-001-example.md) | Protected rule. |
| Implementation selection | BU-001 | SEL-001 | [Selection](../../software-design/build/records/selections/sel-001-example.md) | Implementation direction. |
| Verification capability | BU-001 | VA-001 | [Capability](../../software-design/build/records/verification/va-001-example.md) | Proof route. |
| Software Design | SR-001 | SR-001 | [Responsibility](../../software-design/system-model/responsibilities/sr-001-example.md) | Behavior source. |

## Stage 9 Obligation Coverage
### \`INPUT-001\` — Example fixture
- **Handoff source:** [INPUT-001](../../software-design/build/workflow/handoffs/example.md#input-001--example-fixture)
- **Handling:** Generate the deterministic example fixture before verification.
- **Coverage:** \`VE-001\`

### \`INT-001\` — \`IFACE-001.ACT-001\`
- **Handoff source:** [INT-001](../../software-design/build/workflow/handoffs/example.md#int-001--iface-001act-001)
- **Coverage:** \`VE-001\`
- **Required evidence classes:** \`existence\`, \`structural-conformance\`, \`behavioral\`, \`consumer-fitness\`
- **High-risk cases:** \`None.\`

**Verification obligations:** \`None.\` — [handoff VO-free selected scope](../../software-design/build/workflow/handoffs/example.md#allowed-delivery-slice)

## Delivery Responsibility Coverage
### RCOV-001 · \`BUILD_UNIT:BU-001\`
- **Canonical responsibility:** [SR-001 responsibility](../../software-design/system-model/responsibilities/sr-001-example.md) — public example behavior.
- **Disposition:** \`Deliver\`
- **Coverage:** \`AC-001\`
${coverage}

## Delivery Design
Implement the selected responsibility at its canonical package boundary.

## Protected Boundaries
### PB-001: Public boundary
- **Canonical source:** [CONS-001](../../software-design/build/records/constraints/cons-001-example.md)
- **Must preserve:** Public behavior.
- **Workpack limit:** No contract changes.

## Acceptance Criteria
### AC-001: Observable result
- **Canonical source:** [SR-001](../../software-design/system-model/responsibilities/sr-001-example.md)
- **Expected result:** The public behavior is observable.
- **Required evidence:** \`VE-001\`

## Verification Evidence Required
### VE-001: Public behavior evidence
- **Supports:** \`AC-001\`
- **Capability:** \`None.\`
- **Procedure:** \`npm test\`
- **Evidence to preserve:** Passing output.

## Delivery Evidence Contract
- **Evidence root:** \`delivery-evidence/\`
- **Execution summary:** \`${EVIDENCE_EXECUTION_ROOT}SUMMARY.md\`
- **Raw artifacts:** \`${EVIDENCE_EXECUTION_ROOT}artifacts/\` — Optional; preserve only material machine output that supports VE-001.
- **Publication receipts:** \`None.\`
- **Consumer-install receipts:** \`None.\`
- **Compatibility evidence:** \`VE-001\` exercises the shipped consumer seam; publication or installation receipts do not establish behavioral compatibility.
- **Historical evidence:** Preserve existing evidence and links without silent rewrite or migration.

## Workpack Integrity Review
**Review result:** \`PASS\`
**Canonical-source consistency:** \`PASS\` — [SR-001](../../software-design/system-model/responsibilities/sr-001-example.md) is internally consistent.
**Required-input closure:** \`PASS\` — [BU](../../software-design/build/units/bu-001-example.md) requires no unavailable producer.
**Later-lifecycle gate disposition:** \`PASS\` — No later-lifecycle gate applies to this handoff.
**Stage 9 obligation coverage:** \`PASS\` — INPUT-001 and INT-001 are projected to VE-001.
**Verification-obligation coverage:** \`PASS\` — The selected slice is VO-free.
**Responsibility coverage:** \`PASS\` — RCOV-001 maps the selected responsibility.
**Acceptance/evidence reciprocity:** \`PASS\` — AC-001 and VE-001 are reciprocal.
**Phase and capability sequencing:** \`PASS\` — The workpack is unphased because it has one independent delivery boundary.
**Proof capability adequacy:** \`PASS\` — VE-001 directly observes the claimed result.
**Delivery-evidence contract:** \`PASS\` — The snapshot-scoped SUMMARY.md records VE-001, receipts remain typed, and historical evidence is preserved.
**Execution eligibility:** \`PASS\` — The selected slice is Ready in the current sequence order group.
**Stage 9 compatibility closure:** \`PASS\` — [Stage 9 review](../../software-design/build/workflow/handoffs/example.md#delivery-slice-realizability-review) preserves the shipped-seam preflight in VE-001.
**Diagnostic and known-consumer coverage preservation:** \`PASS\` — [Stage 9 review](../../software-design/build/workflow/handoffs/example.md#delivery-slice-realizability-review) preserves the bounded diagnostic cohort, known consumers, and zero-new-blocker rerun.
**Affected-slice isolation:** \`PASS\` — The selected slice is the only producer delta; other slices are unaffected.
**Review blockers:** \`None.\`

## Definition of Done
AC-001 and VE-001 pass.

## Stop and Escalation Conditions
Stop on a protected-boundary conflict.

## Evidence to Preserve for Later Review
Preserve \`${EVIDENCE_EXECUTION_ROOT}SUMMARY.md\` and any material VE-001 artifacts.

## /goal Handoff
Execute only this workpack.
`;
}

function physicalClosureWorkpack(root, workpack = validWorkpack()) {
  const handoffPath = path.join(root, "software-design", "build", "workflow", "handoffs", "example.md");
  const physicalClosure = `## Physical Realizability Closure
### \`PSEAM-001\` — Public seam compatibility
**Covers:** \`INPUT-001\`, \`INT-001\`
**Runtime profiles:** Local verification.
**Implementation situation:** \`existing-unchanged\`
**Boundary class:** \`ordinary\`
**Producer observation:** \`OBSERVED\` — [BU-001](../../units/bu-001-example.md) emits the exact fixture.
**Consumer observation:** \`OBSERVED\` — [BU-001](../../units/bu-001-example.md) accepts the exact fixture.
**Compared dimensions:** schema/version: exact; identity/representation: exact; transport/method: exact public call; topology/ports: in-process; authority/caller: not applicable; lifecycle/persistence: fresh fixture; command/toolchain: pinned test command.
**Candidate compatibility proof:** \`NOT_APPLICABLE\` — unchanged ordinary seam.
**Evidence provenance:** \`accepted-receipt\` — [BU-001](../../units/bu-001-example.md) records the accepted baseline.
**Direct change-impact closure:** source/imports: unchanged; tests/fixtures/golden values: unchanged; dependencies/manifests/lockfiles: unchanged; generators/generated outputs: not applicable; identity/freshness/receipt verifiers: unchanged; configuration/evidence: unchanged.
**Required-command effects:** \`NOT_APPLICABLE\` — The ordinary in-process test has no build, deploy, regenerate, migrate, or cross-repository effect.
**Current result:** \`COMPATIBLE\`
**Delta owner:** \`None.\`
**Probe:** Run the public-seam verification command.
**Evidence:** [BU-001](../../units/bu-001-example.md)
**Downstream impact:** Selected slice only.

`;
  write(handoffPath, fs.readFileSync(handoffPath, "utf8")
    .replace("**Selected build units:** `BUILD_UNIT:BU-001`", "**Selected build units:** `BUILD_UNIT:BU-001`\n**Writable build units:** `BUILD_UNIT:BU-001`")
    .replace("## Build Unit Routing Index", physicalClosure + "## Build Unit Routing Index"));

  const physicalProjection = `### \`PSEAM-001\` — Public seam compatibility
- **Handoff source:** [PSEAM-001](../../software-design/build/workflow/handoffs/example.md#pseam-001--public-seam-compatibility)
- **Handoff result:** \`COMPATIBLE\`
- **Implementation situation:** \`existing-unchanged\`
- **Boundary class:** \`ordinary\`
- **Candidate compatibility proof:** \`NOT_APPLICABLE\` — unchanged ordinary seam.
- **Evidence provenance:** \`accepted-receipt\` — [BU-001](../../software-design/build/units/bu-001-example.md) records the accepted baseline.
- **Handling:** Preserve the observed public-seam representation.
- **Direct change-impact handling:** Preserve unchanged source, tests, dependencies, generated surfaces, verifiers, configuration, and evidence.
- **Required-command-effect handling:** Preserve the handoff's Not applicable command-effect disposition under PB-001.
- **Coverage:** \`VE-001\`
- **Protected-boundary compatibility:** \`PB-001\` — the proof preserves the public boundary.

`;
  const preflight = `## Execution Environment Preflight
**Disk capacity:** \`df -Pk .\` must report at least 2 GiB free; disposable test output may be removed.
**Toolchains:** \`node --version\` must resolve the repository runtime.
**Local artifacts and images:** Not applicable — the workpack consumes no immutable local image.
**Services and ports:** Not applicable — the package verification is in-process.
**Browsers or devices:** Not applicable — no browser or device is part of VE-001.
**External access:** Not applicable — frozen local inputs satisfy this workpack.
**Failure policy:** Complete every safe independent preflight check, group failures by root cause, and report consolidated blockers before source edits; skip only transitively blocked checks.

`;
  return workpack
    .replace("- `BUILD_UNIT:BU-001` — selected delivery.", "- `BUILD_UNIT:BU-001` — `Target` — selected delivery.")
    .replace("**Verification obligations:**", physicalProjection + "**Verification obligations:**")
    .replace("## Protected Boundaries", preflight + "## Protected Boundaries")
    .replace(
      "**Verification-obligation coverage:**",
      "**Physical-realizability projection:** `PASS` — [Physical closure](../../software-design/build/workflow/handoffs/example.md#physical-realizability-closure) projects PSEAM-001 to VE-001 and PB-001.\n**Verification-obligation coverage:**",
    );
}

function addStructuredVerificationObligation(root, workpack = validWorkpack()) {
  const handoffPath = path.join(root, "software-design", "build", "workflow", "handoffs", "example.md");
  const closure = `## Required Verification Obligation Closure
### \`INV-001.VO-001\` — Preserve the public invariant
**Canonical obligation:** [SR-001](../../../system-model/responsibilities/sr-001-example.md)
**Selected assignments:** \`BUILD_UNIT:BU-001\`
**Repository manifest route:** [REPO-001](../../repositories/repo-001-example/README.md) tracks \`assurance/coverage.yaml\`.
**Required evidence:** Behavioral observation at the public boundary, including the invalid-input case.
**Routing state:** \`Planned\`
**Gap disposition:** \`None.\`

`;
  write(handoffPath, fs.readFileSync(handoffPath, "utf8").replace("## Build Unit Routing Index", closure + "## Build Unit Routing Index"));
  const entry = `### \`INV-001.VO-001\` — Preserve the public invariant
- **Handoff source:** [INV-001.VO-001](../../software-design/build/workflow/handoffs/example.md#inv-001vo-001--preserve-the-public-invariant)
- **Selected assignments:** \`BUILD_UNIT:BU-001\`
- **Repository manifest route:** [REPO-001](../../software-design/build/repositories/repo-001-example/README.md) tracks \`assurance/coverage.yaml\`.
- **Required evidence:** Behavioral observation at the public boundary, including the invalid-input case.
- **Coverage:** \`VE-001\`
`;
  return workpack
    .replace(/^\*\*Verification obligations:\*\*.*\n/m, entry)
    .replace(
      "**Verification-obligation coverage:** `PASS` — The selected slice is VO-free.",
      "**Verification-obligation coverage:** `PASS` — INV-001.VO-001 is routed through VE-001 and the repository assurance manifest.",
    );
}

function run(root, content, workpack = path.join(root, "delivery-workpacks", "example", "WORKPACK.md")) {
  write(workpack, content);
  return spawnSync(process.execPath, [
    validator,
    "--workpack",
    workpack,
    "--software-design-skill",
    path.join(root, "software-design-skill"),
  ], { encoding: "utf8" });
}

test("accepts a reciprocal unphased workpack with responsibility coverage", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const result = run(root, validWorkpack());
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Verified workpack\/handoff scope and source closure/);
});

test("accepts a workpack with exact physical-seam projection, roles, and bounded preflight", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const result = run(root, physicalClosureWorkpack(root));
  assert.equal(result.status, 0, result.stderr);
});

test("rejects a workpack that omits a PSEAM projection", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const content = physicalClosureWorkpack(root).replace(
    /### `PSEAM-001` — Public seam compatibility[\s\S]*?(?=\*\*Verification obligations:\*\*)/,
    "",
  );
  const result = run(root, content);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /must project exactly every PSEAM-NNN/);
});

test("rejects when stated Build Unit role contradicts RCOV delivery", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const content = physicalClosureWorkpack(root).replace(
    "`BUILD_UNIT:BU-001` — `Target`",
    "`BUILD_UNIT:BU-001` — `Existing prerequisite`",
  );
  const result = run(root, content);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /must select at least one Build Unit with role `Target`/);
  assert.match(result.stderr, /Existing prerequisite but has a Deliver RCOV entry/);
});

test("rejects when bounded environment preflight is absent", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const content = physicalClosureWorkpack(root).replace(
    /## Execution Environment Preflight[\s\S]*?(?=## Protected Boundaries)/,
    "",
  );
  const result = run(root, content);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /missing ## Execution Environment Preflight/);
});

test("rejects when a workpack changes the handoff implementation situation", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const content = physicalClosureWorkpack(root).replace(
    "**Implementation situation:** `existing-unchanged`",
    "**Implementation situation:** `new-output`",
  );
  const result = run(root, content);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Implementation situation.*exactly preserve/i);
});

test("rejects when direct change-impact handling is omitted", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const content = physicalClosureWorkpack(root).replace(/^\- \*\*Direct change-impact handling:\*\*.*\n/m, "");
  const result = run(root, content);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /lacks concrete.*Direct change-impact handling/i);
});

test("rejects when workpack targets differ from the handoff writable subset", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const content = physicalClosureWorkpack(root);
  const handoffPath = path.join(root, "software-design", "build", "workflow", "handoffs", "example.md");
  write(handoffPath, fs.readFileSync(handoffPath, "utf8").replace(
    "**Writable build units:** `BUILD_UNIT:BU-001`",
    "**Writable build units:** `BUILD_UNIT:BU-002`",
  ));
  const result = run(root, content);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Target Build Units must exactly match.*Writable build units/i);
});

test("rejects a Stage 9 link outside the current handoff path", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const content = validWorkpack().replace(
    "../../software-design/build/workflow/handoffs/example.md",
    "../../legacy-handoff.md",
  );
  const result = run(root, content);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /must use the current build\/workflow\/handoffs\/ path/);
});

test("allows historical legacy identifiers outside authority-bearing fields", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const content = validWorkpack().replace(
    "## Delivery Design",
    "Legacy canonical sources: `TC-001`, `IS-001`, and `DES-0001`.\n\n## Delivery Design",
  );
  const result = run(root, content);
  assert.equal(result.status, 0, result.stderr);
});

test("the bundled workpack template uses current Software Design identities", () => {
  const content = fs.readFileSync(template, "utf8");
  assert.match(content, /SR-xxx/);
  assert.match(content, /IFACE-xxx/);
  assert.match(content, /CONS-xxx/);
  assert.match(content, /SEL-xxx/);
  assert.match(content, /TICKET-NNNN/);
  assert.match(content, /## Stage 9 Obligation Coverage/);
  assert.match(content, /High-risk cases/);
  assert.match(content, /agent-guidance\.md/);
  assert.match(content, /Diagnostic and known-consumer coverage preservation/);
  assert.match(content, /## Delivery Evidence Contract/);
  assert.match(content, /delivery-evidence\/executions\/sha256-<full-workpack-snapshot-digest>\/SUMMARY\.md/);
  assert.match(content, /delivery-evidence\/receipts\/publications/);
  assert.match(content, /delivery-evidence\/receipts\/consumers/);
  assert.doesNotMatch(content, /\b(?:C-xx|IF-xxx|OSG-xxx|OOS-xxx|TC-xxx|IS-xxx|DES-xxxx)\b/);
  assert.match(content, /delivery-workpacks\/<delivery-slice>\/WORKPACK\.md/);
});

test("planning defines one snapshot-scoped summary instead of one file per VE", () => {
  const skill = fs.readFileSync(planningSkill, "utf8");
  const rules = fs.readFileSync(workpackRules, "utf8");
  const evidenceRules = fs.readFileSync(deliveryEvidenceRules, "utf8");
  assert.match(skill, /exact snapshot-scoped `Delivery Evidence Contract`/);
  assert.match(rules, /Do not plan a repository-global VE sequence or one Markdown file per VE/);
  assert.match(evidenceRules, /executions\/<snapshot>\/SUMMARY\.md/);
  assert.match(evidenceRules, /consumer-install receipt does not prove behavioral compatibility/i);
  assert.match(evidenceRules, /does not fabricate an execution directory/i);
});

test("rejects an execution summary path that does not match the full snapshot", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const content = validWorkpack().replace(
    EVIDENCE_EXECUTION_ROOT + "SUMMARY.md",
    "delivery-evidence/executions/sha256-" + "b".repeat(64) + "/SUMMARY.md",
  );
  const result = run(root, content);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Execution summary.*must be/);
});


test("planning keeps toolchain activation conditional and persistent failures terminal", () => {
  const skill = fs.readFileSync(planningSkill, "utf8");
  const rules = fs.readFileSync(workpackRules, "utf8");
  const workpackTemplate = fs.readFileSync(template, "utf8");
  assert.match(skill, /record the canonical version and verification command/);
  assert.match(skill, /activation or bootstrap command only when/);
  assert.match(rules, /still cannot run or pass after applicable safe, scope-preserving remediation/);
  assert.match(workpackTemplate, /required verification that still fails after applicable safe remediation/);
});

test("planning projects current Stage 9 obligations without inventing new canonical IDs", () => {
  const skill = fs.readFileSync(planningSkill, "utf8");
  const rules = fs.readFileSync(workpackRules, "utf8");
  for (const content of [skill, rules]) {
    assert.match(content, /Required Input Ledger/);
    assert.match(content, /Required Interaction Closure/);
    assert.match(content, /Required Verification Obligation Closure/);
    assert.match(content, /INPUT-NNN/);
    assert.match(content, /INT-NNN/);
    assert.match(content, /IFACE-xxx\.ACT-NNN/);
    assert.match(content, /INV\/SEC-xxx\.VO-NNN/);
    assert.match(content, /positive, rejection\/denial, and failure\/recovery/);
  }
  assert.match(skill, /complete current Stage 9 readiness validation and reconciliation/);
  assert.match(rules, /snapshot-only check cannot establish current readiness/);
  assert.match(skill, /agent-guidance\.md/);
  assert.match(skill, /repository-root `AGENTS\.md`/);
});

test("the current workpack always requires compatibility preservation in the existing integrity review", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const missing = run(root, validWorkpack()
    .replace(/^\*\*Execution eligibility:\*\*.*\n/m, "")
    .replace(/^\*\*Stage 9 compatibility closure:\*\*.*\n/m, "")
    .replace(/^\*\*Affected-slice isolation:\*\*.*\n/m, ""));
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /Execution eligibility/);
  assert.match(missing.stderr, /Stage 9 compatibility closure/);

  const accepted = run(root, validWorkpack());
  assert.equal(accepted.status, 0, accepted.stderr);
});

test("the current workpack preserves diagnostics and known consumers in the existing integrity review", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const missing = run(root, validWorkpack().replace(/^\*\*Diagnostic and known-consumer coverage preservation:\*\*.*\n/m, ""));
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /Diagnostic and known-consumer coverage preservation/);

  const accepted = run(root, validWorkpack());
  assert.equal(accepted.status, 0, accepted.stderr);
});

test("rejects an indexed or dated workpack directory", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const workpack = path.join(root, "delivery-workpacks", "004-example-2026-08-23", "WORKPACK.md");
  const result = run(root, validWorkpack(), workpack);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /must use the stable delivery-slice path delivery-workpacks\/example\/WORKPACK\.md/);
});

test("rejects noncanonical legacy identities in authority-bearing fields", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const content = validWorkpack().replace(
    "**Canonical responsibility:** [SR-001 responsibility]",
    "**Canonical responsibility:** `C-01`, `IF-001`, `OSG-001`, `OOS-001`, `TC-001`, `IS-001`, and `DES-0001`; [SR-001 responsibility]",
  );
  const result = run(root, content);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /legacy identifiers as current canonical authority \(C-01, IF-001, OSG-001, OOS-001, TC-001, IS-001, DES-0001\)/);
});

test("rejects retired paths as current canonical sources", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const content = validWorkpack().replace(
    "| Software Design | SR-001",
    "| Software Design | Legacy | Legacy | [Architecture](../../software-design/build/architecture.md) | Legacy truth. |\n| Software Design | SR-001",
  );
  const result = run(root, content);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /retired Software Design path as current authority/);
});

test("rejects every descendant of the retired views projection tree", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const content = validWorkpack().replace(
    "| Software Design | SR-001",
    "| Software Design | Retired | Retired | [Projection](../../software-design/views/retired-projection.md) | Retired truth. |\n| Software Design | SR-001",
  );
  const result = run(root, content);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /retired Software Design path as current authority/);
});

test("rejects a workpack whose snapshot differs from its Stage 9 handoff", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const content = validWorkpack().replace(SNAPSHOT, "sha256:" + "b".repeat(64));
  const result = run(root, content);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /does not match the linked Stage 9 handoff Snapshot ID/);
});

test("rejects a matching copied Snapshot ID when current Stage 9 validation fails", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const handoff = path.join(root, "software-design", "build", "workflow", "handoffs", "example.md");
  fs.appendFileSync(handoff, "\nSTALE-SNAPSHOT\n");
  const result = run(root, validWorkpack());
  assert.equal(result.status, 1);
  assert.match(result.stderr, /linked Stage 9 handoff is not currently ready/);
});

test("rejects a handoff that no longer passes the current Stage 9 readiness validator", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const handoff = path.join(root, "software-design", "build", "workflow", "handoffs", "example.md");
  fs.appendFileSync(handoff, "\nINVALID-STAGE9\n");
  const result = run(root, validWorkpack());
  assert.equal(result.status, 1);
  assert.match(result.stderr, /linked Stage 9 handoff is not currently ready/);
});

test("rejects selected Build Units that differ from the Stage 9 handoff", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const content = validWorkpack()
    .replace("- `BUILD_UNIT:BU-001` — selected delivery.", "- `BUILD_UNIT:BU-002` — selected delivery.")
    .replace("### RCOV-001 · `BUILD_UNIT:BU-001`", "### RCOV-001 · `BUILD_UNIT:BU-002`");
  const result = run(root, content);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /selected Build Units do not match the linked Stage 9 handoff/);
});

test("rejects direct dependencies that differ from Stage 9 routing", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  write(
    path.join(root, "software-design", "build", "workflow", "handoffs", "example.md"),
    handoffText({ dependencies: "[`BUILD_UNIT:BU-002`](#build_unitbu-002)" }),
  );
  const result = run(root, validWorkpack());
  assert.equal(result.status, 1);
  assert.match(result.stderr, /direct Build Unit dependencies do not match/);
});

test("rejects repository disposition drift from Stage 9 routing", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  write(
    path.join(root, "software-design", "build", "workflow", "handoffs", "example.md"),
    handoffText({ disposition: "`Partial repository — BU-002 excluded; outside slice.`" }),
  );
  const result = run(root, validWorkpack());
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Repository Disposition for REPO-001 does not match Stage 9 value/);
  assert.match(result.stderr, /must preserve excluded BU-002/);
});

test("rejects Delivery Scope when required subsections are absent", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const content = validWorkpack()
    .replace(/### Repository Disposition[\s\S]*?(?=### Direct Build Unit Dependencies)/, "")
    .replace(/### Explicit Exclusions[\s\S]*?(?=### Local Implementation Discretion)/, "");
  const result = run(root, content);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Delivery Scope is missing ### Repository Disposition/);
  assert.match(result.stderr, /Delivery Scope is missing ### Explicit Exclusions/);
});

test("rejects workpacks that omit a Stage 9-routed canonical source", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const content = validWorkpack().replace(/^\| Technical Constraint .*\n/m, "");
  const result = run(root, content);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Canonical Sources Used omits a Stage 9-routed source/);
});

test("rejects workpacks that omit routed repository agent guidance", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const content = validWorkpack().replace(/^\| Repository agent guidance .*\n/m, "");
  const result = run(root, content);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Canonical Sources Used omits routed repository agent guidance/);
});

test("rejects missing or mismatched Stage 9 input and interaction projection", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const content = validWorkpack()
    .replace(/### `INPUT-001` — Example fixture[\s\S]*?(?=### `INT-001`)/, "")
    .replace("### `INT-001` — `IFACE-001.ACT-001`", "### `INT-001` — `IFACE-001.ACT-002`");
  const result = run(root, content);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /omits the linked handoff's INPUT-NNN obligations/);
  assert.match(result.stderr, /exact IFACE-xxx\.ACT-NNN/);
});

test("rejects interaction coverage that changes the Stage 9 evidence classes", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const content = validWorkpack().replace(
    "- **Required evidence classes:** `existence`, `structural-conformance`, `behavioral`, `consumer-fitness`",
    "- **Required evidence classes:** `existence`, `behavioral`, `consumer-fitness`",
  );
  const result = run(root, content);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /must exactly preserve.*evidence classes/);
});

test("accepts exact structured Verification Obligation projection", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const result = run(root, addStructuredVerificationObligation(root));
  assert.equal(result.status, 0, result.stderr);
});

test("rejects a workpack that omits a selected structured Verification Obligation", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  addStructuredVerificationObligation(root);
  const result = run(root, validWorkpack());
  assert.equal(result.status, 1);
  assert.match(result.stderr, /omits the linked handoff's structured Verification Obligations/);
});

test("rejects structured Verification Obligation owner or manifest-route drift", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const drifted = addStructuredVerificationObligation(root)
    .replace("- **Selected assignments:** `BUILD_UNIT:BU-001`", "- **Selected assignments:** `BUILD_UNIT:BU-002`")
    .replace("tracks `assurance/coverage.yaml`.", "uses an unspecified proof route.");
  const result = run(root, drifted);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Selected assignments.*exactly preserve/);
  assert.match(result.stderr, /Repository manifest route.*assurance\/coverage\.yaml/);
});

test("requires the proportional three-case matrix only for a high-risk interaction", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const handoff = path.join(root, "software-design", "build", "workflow", "handoffs", "example.md");
  write(handoff, handoffText().replace("**Risk:** `ordinary`", "**Risk:** `high`"));

  const missingMatrix = run(root, validWorkpack());
  assert.equal(missingMatrix.status, 1);
  assert.match(missingMatrix.stderr, /high risk must map the positive case/);
  assert.match(missingMatrix.stderr, /high risk must map the rejection\/denial case/);
  assert.match(missingMatrix.stderr, /high risk must map the failure\/recovery case/);

  const mapped = validWorkpack().replace(
    "- **High-risk cases:** `None.`",
    "- **High-risk cases:** `Positive: VE-001; Rejection/denial: VE-001; Failure/recovery: VE-001`",
  );
  const accepted = run(root, mapped);
  assert.equal(accepted.status, 0, accepted.stderr);
});

test("accepts evidence-linked None declarations for a genuinely obligation-free slice", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const handoff = path.join(root, "software-design", "build", "workflow", "handoffs", "example.md");
  const obligationFreeHandoff = handoffText()
    .replace(
      /## Required Input Ledger[\s\S]*?(?=## Required Interaction Closure)/,
      "## Required Input Ledger\n**Required inputs:** `None.` — [BU-001](../../units/bu-001-example.md) proves the input-free boundary.\n\n",
    )
    .replace(
      /## Required Interaction Closure[\s\S]*?(?=## Build Unit Routing Index)/,
      "## Required Interaction Closure\n**Required interactions:** `None.` — [BU-001](../../units/bu-001-example.md) proves the interaction-free boundary.\n\n",
    );
  write(handoff, obligationFreeHandoff);
  const obligationFreeWorkpack = validWorkpack()
    .replace(
      /## Stage 9 Obligation Coverage[\s\S]*?(?=## Delivery Responsibility Coverage)/,
      "## Stage 9 Obligation Coverage\n**Input obligations:** `None.` — [input-free handoff](../../software-design/build/workflow/handoffs/example.md#required-input-ledger)\n\n**Interaction obligations:** `None.` — [interaction-free handoff](../../software-design/build/workflow/handoffs/example.md#required-interaction-closure)\n\n**Verification obligations:** `None.` — [handoff VO-free selected scope](../../software-design/build/workflow/handoffs/example.md#allowed-delivery-slice)\n\n",
    )
    .replace(
      "INPUT-001 and INT-001 are projected to VE-001.",
      "The slice has no input obligations and no interaction obligations under the linked handoff.",
    );
  const result = run(root, obligationFreeWorkpack);
  assert.equal(result.status, 0, result.stderr);
});

test("rejects Excluded-by-Stage-9 coverage without a canonical handoff exclusion link", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const excluded = `
### RCOV-002 · \`BUILD_UNIT:BU-001\`
- **Canonical responsibility:** [SR-001 responsibility](../../software-design/system-model/responsibilities/sr-001-example.md)
- **Disposition:** \`Excluded by Stage 9\`
- **Coverage:** Excluded for this delivery.
`;
  const result = run(root, validWorkpack({ coverage: excluded }));
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Excluded by Stage 9 disposition must cite the linked handoff's canonical exclusion anchor/);
});

test("accepts a later-lifecycle gate without making it current Definition of Done", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  write(path.join(root, "software-design", "build", "workflow", "handoffs", "example.md"), handoffText({ gates: HANDOFF_GATE }));
  const gate = `## Later-Lifecycle Gates
### \`LGATE-001\`: Production identity
- **Canonical source:** [BU](../../software-design/build/units/bu-001-example.md)
- **Consumed at:** \`Release\`
- **Gate condition:** The deployment-produced identity exists.
- **Verification:** Compare it with the deployed artifact.
- **Until satisfied:** Production release and release-ready claims are prohibited.

`;
  const content = validWorkpack()
    .replace("## Delivery Responsibility Coverage", gate + "## Delivery Responsibility Coverage")
    .replace("No later-lifecycle gate applies to this handoff.", "LGATE-001 is preserved as a Release gate outside current Definition of Done.");
  const result = run(root, content);
  assert.equal(result.status, 0, result.stderr);
});

test("rejects an incomplete later-lifecycle gate", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const gate = `## Later-Lifecycle Gates
### \`LGATE-001\`: Production identity
- **Canonical source:** Deployment notes.
- **Consumed at:** \`Build\`
- **Gate condition:** TBD.
- **Verification:** Compare it with the deployed artifact.
- **Until satisfied:** Production release is prohibited.

`;
  const content = validWorkpack()
    .replace("## Delivery Responsibility Coverage", gate + "## Delivery Responsibility Coverage")
    .replace("No later-lifecycle gate applies to this handoff.", "LGATE-001 is projected.");
  const result = run(root, content);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /LGATE-001.*Canonical source/);
  assert.match(result.stderr, /LGATE-001 must select a valid later lifecycle/);
  assert.match(result.stderr, /LGATE-001 lacks a concrete.*Gate condition/);
});

test("rejects a workpack that omits a Stage 9 later-lifecycle gate", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  write(path.join(root, "software-design", "build", "workflow", "handoffs", "example.md"), handoffText({ gates: HANDOFF_GATE }));
  const result = run(root, validWorkpack());
  assert.equal(result.status, 1);
  assert.match(result.stderr, /must project exactly every LGATE-NNN/);
});

test("rejects a selected Build Unit missing responsibility coverage", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const result = run(root, validWorkpack({ selected: "`BUILD_UNIT:BU-001`, `BUILD_UNIT:BU-002`" }));
  assert.equal(result.status, 1);
  assert.match(result.stderr, /BUILD_UNIT:BU-002 has no Delivery Responsibility Coverage entry/);
});

test("does not treat an explicitly excluded Build Unit as selected", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const content = validWorkpack().replace(
    "## Canonical Sources Used",
    "### Explicit Exclusions\n- `BUILD_UNIT:BU-002` — outside the selected slice.\n\n## Canonical Sources Used",
  );
  const result = run(root, content);
  assert.equal(result.status, 0, result.stderr);
});

test("rejects non-reciprocal AC and VE mappings", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const content = validWorkpack().replace("**Supports:** `AC-001`", "**Supports:** `AC-002`");
  const result = run(root, content);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /VE-001 references unknown AC-002/);
  assert.match(result.stderr, /AC-001 requires VE-001 but VE-001 does not reciprocally support it/);
});

test("rejects AC and VE entries that omit substantive contract fields", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const content = validWorkpack()
    .replace("- **Canonical source:** [SR-001](../../software-design/system-model/responsibilities/sr-001-example.md)\n", "")
    .replace("- **Expected result:** The public behavior is observable.\n", "")
    .replace("- **Procedure:** `npm test`\n", "")
    .replace("- **Evidence to preserve:** Passing output.\n", "");
  const result = run(root, content);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /AC-001 \*\*Canonical source:\*\*/);
  assert.match(result.stderr, /AC-001 lacks a concrete \*\*Expected result:\*\*/);
  assert.match(result.stderr, /VE-001 lacks a concrete \*\*Procedure:\*\*/);
  assert.match(result.stderr, /VE-001 lacks a concrete \*\*Evidence to preserve:\*\*/);
});

test("rejects a VE capability that is absent from canonical sources", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const content = validWorkpack().replace("- **Capability:** `None.`", "- **Capability:** `VA-999`");
  const result = run(root, content);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /VE-001 \*\*Capability:\*\* must be `None\.` or name one VA-xxx/);
});

test("rejects incomplete coverage of a multi-responsibility Build Unit", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const buildUnit = path.join(root, "software-design", "build", "units", "bu-001-example.md");
  write(buildUnit, fs.readFileSync(buildUnit, "utf8")
    .replace('source_responsibilities: "SR-001"', 'source_responsibilities: "SR-001, SR-002"')
    .replace("Implements [SR-001]", "Implements [SR-001] and [SR-002]"));
  const content = validWorkpack().replace("SR-001 responsibility", "SR-001 and SR-002 responsibilities");
  const result = run(root, content);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /RCOV-001 must map one canonical responsibility per RCOV entry, not SR-001, SR-002/);
});

test("rejects contradictory phase exit references", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const phase = `
## Optional Phases
### Phase 1: Build
- **Objective:** Build the unit.
- **Depends on:** None.
- **Entry criteria:** Source available.
- **Exit criteria:** \`AC-002\` and \`VE-001\`.
`;
  const content = validWorkpack()
    .replace("## Definition of Done", phase + "\n## Definition of Done")
    .replace("The workpack is unphased because it has one independent delivery boundary.", "Phase 1 defines the delivery boundary.");
  const result = run(root, content);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /references unknown AC-002/);
  assert.match(result.stderr, /AC-001 is not scheduled in any phase exit criterion/);
});

test("rejects phases without objective, dependency, or entry criteria", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const phase = `
## Optional Phases
### Phase 1: Build
- **Exit criteria:** \`AC-001\` and \`VE-001\`.
`;
  const content = validWorkpack()
    .replace("## Definition of Done", phase + "\n## Definition of Done")
    .replace("The workpack is unphased because it has one independent delivery boundary.", "Phase 1 defines the delivery boundary.");
  const result = run(root, content);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /lacks a concrete \*\*Objective:\*\*/);
  assert.match(result.stderr, /lacks a concrete \*\*Depends on:\*\*/);
  assert.match(result.stderr, /lacks a concrete \*\*Entry criteria:\*\*/);
});

test("rejects a workpack with no PB-xxx protected-boundary entry", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const content = validWorkpack().replace(
    /## Protected Boundaries[\s\S]*?(?=## Acceptance Criteria)/,
    "## Protected Boundaries\nNo explicit protected boundary is declared.\n\n",
  );
  const result = run(root, content);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Protected Boundaries must define at least one ### PB-xxx entry/);
});

test("rejects a mechanically blocked integrity receipt", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const content = validWorkpack().replace("**Review result:** `PASS`", "**Review result:** `BLOCKED`");
  const result = run(root, content);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /requires \*\*Review result:\*\* `PASS`/);
});

test("implementation workpacks cannot omit the current Delivery Evidence Contract", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const result = run(root, validWorkpack().replace(/^## Delivery Evidence Contract\n[\s\S]*?(?=^## )/m, ""));
  assert.equal(result.status, 1);
  assert.match(result.stderr, /missing ## Delivery Evidence Contract/);
});

const UI_SPEC_LINK = "../../software-design/ui-ux/specification.md";

function humanFacingWorkpack(root, workpack = validWorkpack()) {
  const softwareDesign = path.join(root, "software-design");
  write(path.join(softwareDesign, "ui-ux", "specification.md"), "# UI/UX Design\n");
  write(path.join(softwareDesign, "ui-ux", "alternatives", "main", "index.html"), "<!doctype html><title>Selected</title>\n");
  write(path.join(softwareDesign, "ui-ux", "alternatives", "other", "index.html"), "<!doctype html><title>Unselected</title>\n");
  const handoffPath = path.join(softwareDesign, "build", "workflow", "handoffs", "example.md");
  write(handoffPath, fs.readFileSync(handoffPath, "utf8").replace("## Build Unit Routing Index", `## UI/UX Delivery Review
**Approved UI/UX sources:** [UI/UX specification](../../../ui-ux/specification.md); [selected candidate](../../../ui-ux/alternatives/main/index.html); upstream owner: \`None.\`
**Covered prototype states:** [Main journey](../../../ui-ux/specification.md#journey-main) and [Recovery journey](../../../ui-ux/specification.md#journey-recovery) with empty, success, error, and recovery states.
**Prototype walkthrough:** \`Reviewed — no unresolved usability blockers\` — rendered review recorded in the specification.
**Functional acceptance owner:** [BU-001](../../units/bu-001-example.md) proves the outcome.
**Implemented UI/UX review owner:** [BU-001](../../units/bu-001-example.md) compares the built surface with the selected candidate.
**Actual user testing:** \`Not planned\`
**Consistency result:** \`PASS\` — sources agree.

## Build Unit Routing Index`));
  const coverage = `### UI/UX Delivery Coverage
- **Handoff source:** [UI/UX Delivery Review](../../software-design/build/workflow/handoffs/example.md#uiux-delivery-review)
- **Approved UI/UX sources:** [UI/UX specification](${UI_SPEC_LINK}); [selected candidate](../../software-design/ui-ux/alternatives/main/index.html)
- **Application entrypoint:** Start the built application with \`npm start\` and open its root route.
- **Representative viewports and states:** 390px and 1280px widths; empty, success, error, and recovery states with keyboard operation.
- **Implemented UI/UX review mode:** \`agent inspection\` — rendered comparison needs no human confirmation.

| Journey | Acceptance | Functional evidence | Implemented UI/UX evidence |
| --- | --- | --- | --- |
| [Main journey](${UI_SPEC_LINK}#journey-main) | \`AC-001\` | \`VE-001\` | \`VE-002\` |
| [Recovery journey](${UI_SPEC_LINK}#journey-recovery) | \`AC-001\` | \`VE-001\` | \`VE-002\` |

`;
  return workpack
    .replace("**Verification obligations:**", coverage + "**Verification obligations:**")
    .replace("- **Required evidence:** `VE-001`", "- **Required evidence:** `VE-001`, `VE-002`")
    .replace("## Delivery Evidence Contract", `### VE-002: Implemented UI/UX review
- **Supports:** \`AC-001\`
- **Capability:** \`None.\`
- **Procedure:** Open the built application and compare both journeys with the selected candidate at the representative viewports.
- **Evidence to preserve:** Representative screenshots, findings, reviewed build, viewports, states, and deviations.

## Delivery Evidence Contract`)
    .replace(
      "**Verification-obligation coverage:**",
      "**UI/UX delivery coverage:** `PASS` — Both covered journeys map to AC-001 with functional VE-001 and implemented UI/UX VE-002.\n**Verification-obligation coverage:**",
    );
}

test("accepts human-facing coverage where one procedure covers several related journeys", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const result = run(root, humanFacingWorkpack(root));
  assert.equal(result.status, 0, result.stderr);
});

test("rejects a human-facing workpack that drops the handoff UI/UX projection", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const content = humanFacingWorkpack(root).replace(/### UI\/UX Delivery Coverage[\s\S]*?(?=\*\*Verification obligations:\*\*)/, "");
  const result = run(root, content);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /must project the handoff's applicable UI\/UX Delivery Review/);
});

test("rejects a workpack that targets an unselected prototype candidate", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const content = humanFacingWorkpack(root).replace("ui-ux/alternatives/main/index.html)\n- **Application", "ui-ux/alternatives/other/index.html)\n- **Application");
  const result = run(root, content);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /must link exactly the handoff's approved UI\/UX sources/);
});

test("rejects omitted and uncovered journey mappings", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const content = humanFacingWorkpack(root).replace("#journey-recovery) | `AC-001`", "#journey-settings) | `AC-001`");
  const result = run(root, content);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /omits handoff-covered journey #journey-recovery/);
  assert.match(result.stderr, /maps journey #journey-settings that the handoff does not cover/);
});

test("rejects one procedure standing in for both functional and implemented UI/UX evidence", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const content = humanFacingWorkpack(root).replace("| `AC-001` | `VE-001` | `VE-002` |\n| [Recovery", "| `AC-001` | `VE-001` | `VE-001` |\n| [Recovery");
  const result = run(root, content);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /journey #journey-main must keep functional and implemented UI\/UX evidence separate/);
});

test("rejects journey evidence that its mapped acceptance criteria do not require", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const content = humanFacingWorkpack(root).replace("- **Required evidence:** `VE-001`, `VE-002`", "- **Required evidence:** `VE-001`");
  const result = run(root, content);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /evidence VE-002 is not required by its mapped acceptance criteria/);
});

test("a non-UI slice needs no UI/UX coverage and may not invent it", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const handoffPath = path.join(root, "software-design", "build", "workflow", "handoffs", "example.md");
  write(handoffPath, fs.readFileSync(handoffPath, "utf8").replace(
    "## Build Unit Routing Index",
    "## UI/UX Delivery Review\n**UI/UX delivery review:** `Not applicable` — the selected library has no human-facing surface.\n\n## Build Unit Routing Index",
  ));
  const accepted = run(root, validWorkpack());
  assert.equal(accepted.status, 0, accepted.stderr);

  const invented = validWorkpack().replace("**Verification obligations:**", `### UI/UX Delivery Coverage
- **Handoff source:** [UI/UX Delivery Review](../../software-design/build/workflow/handoffs/example.md#uiux-delivery-review)

**Verification obligations:**`);
  const rejected = run(root, invented);
  assert.equal(rejected.status, 1);
  assert.match(rejected.stderr, /adds UI\/UX Delivery Coverage, but the linked handoff has no applicable UI\/UX Delivery Review/);
});

test("planning produces a runtime-neutral execution handoff under the stable section heading", () => {
  const skill = fs.readFileSync(planningSkill, "utf8");
  const rules = fs.readFileSync(workpackRules, "utf8");
  const workpackTemplate = fs.readFileSync(template, "utf8");
  assert.doesNotMatch(skill, /\/goal|\bCodex\b|\bHermes\b/);
  assert.doesNotMatch(rules.replace("`## /goal Handoff`", "").replace("`/goal` command", ""), /\/goal|\bCodex\b|\bHermes\b/);
  assert.match(rules, /## Short Execution Handoff/);
  for (const content of [skill, rules, workpackTemplate]) {
    assert.match(content, /native goal or continuation/);
  }
  assert.match(workpackTemplate, /^## \/goal Handoff$/m);
  for (const field of ["Workpack", "Target repository", "Execution skill", "Scope", "Evidence", "Protected boundaries", "Stop"]) {
    assert.match(workpackTemplate, new RegExp("\\*\\*" + field + ":\\*\\*"));
  }
  assert.match(workpackTemplate, /`delivery-workpack-execution`/);
});

function withExternalProjection(root, { gated=false }={}) {
 const hp=path.join(root,'software-design/build/workflow/handoffs/example.md');
 const fields=`**Consumer:** \`External\` — Public monitor
**Producer:** \`BUILD_UNIT:BU-001\`
**Proof owner:** \`BUILD_UNIT:BU-001\`
**Required at:** \`${gated?'Release':'Verification'}\`
**Availability:** \`${gated?'later-lifecycle output':'selected-slice output'}\`
`+(gated?`**Later-lifecycle gate:** \`LGATE-001\`
**Lifecycle inputs:** \`INPUT-001\`
**Current-profile inputs:** \`None.\`
**Current-profile availability:** \`selected-slice output\`
**Current-profile verification:** The bounded local consumer test proves no independent provider availability.
`:'');
 // Upstream semantic validation is exercised by Software Design's real suite;
 // this suite's existing upstream stub isolates exact workpack projection checks.
 let handoff=handoffText({gates:gated?HANDOFF_GATE:''});
 const start=handoff.indexOf('## Required Interaction Closure');
 handoff=handoff.slice(0,start)+handoff.slice(start).replace('**Consumer:** `BUILD_UNIT:BU-001`',fields.trim());write(hp,handoff);
 let content=validWorkpack().replace('### `INT-001` — `IFACE-001.ACT-001`','### `INT-001` — `IFACE-001.ACT-001`\n'+fields);
 if(gated){
  const gate=`## Later-Lifecycle Gates
### \`LGATE-001\`: Production identity
- **Canonical source:** [BU](../../software-design/build/units/bu-001-example.md)
- **Consumed at:** \`Release\`
- **Gate condition:** The deployment-produced identity exists.
- **Verification:** Compare it with the deployed artifact.
- **Until satisfied:** Production release and release-ready claims are prohibited.

`;
  content=content.replace('## Delivery Responsibility Coverage',gate+'## Delivery Responsibility Coverage').replace('No later-lifecycle gate applies to this handoff.','LGATE-001 remains mandatory before release.');
  const i=content.indexOf('### `INT-001`');content=content.slice(0,i)+content.slice(i).replace('- **Coverage:** `VE-001`','- **Coverage:** `VE-001`, `LGATE-001`');
 }
 return content;
}
test('preserves external consumer identity separately from proof ownership',context=>{
 const root=fixture();context.after(()=>fs.rmSync(root,{recursive:true,force:true}));const content=withExternalProjection(root);const result=run(root,content);assert.equal(result.status,0,result.stderr);
});
test('projects current consumer verification and mandatory later provider gate separately',context=>{
 const root=fixture();context.after(()=>fs.rmSync(root,{recursive:true,force:true}));const content=withExternalProjection(root,{gated:true});const result=run(root,content);assert.equal(result.status,0,result.stderr);
});
for(const [name,mutation,expected] of [
 ['consumer identity',s=>s.replace('**Consumer:** `External` — Public monitor','**Consumer:** `BUILD_UNIT:BU-001`'),/preserve Stage 9.*Consumer/],
 ['publication authority',s=>s.replace('**Producer:** `BUILD_UNIT:BU-001`','**Producer:** `External` — Different publisher'),/preserve Stage 9.*Producer/],
 ['proof owner',s=>s.replace('**Proof owner:** `BUILD_UNIT:BU-001`','**Proof owner:** `BUILD_UNIT:BU-999`'),/preserve Stage 9.*Proof owner/],
 ['lifecycle stage',s=>s.replace('**Required at:** `Release`','**Required at:** `Verification`'),/preserve Stage 9.*Required at/],
 ['provider gate coverage',s=>s.replace('`VE-001`, `LGATE-001`','`VE-001`'),/exact declared later-lifecycle gate/],
 ['current-profile proof',s=>s.replace('**Current-profile verification:** The bounded local consumer test proves no independent provider availability.','**Current-profile verification:** Fixtures prove the provider is ready.'),/preserve Stage 9.*Current-profile verification/],
 ['current input identity',s=>s.replace('**Current-profile inputs:** `None.`','**Current-profile inputs:** `INPUT-999`'),/preserve Stage 9.*Current-profile inputs/],
])test('rejects altered external/gated projection: '+name,context=>{
 const root=fixture();context.after(()=>fs.rmSync(root,{recursive:true,force:true}));const content=withExternalProjection(root,{gated:true});const result=run(root,mutation(content));assert.notEqual(result.status,0);assert.match(result.stderr,expected);
});

test("lifecycle gate projection compares canonical links while preserving every requirement", (context) => {
  const root = fixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const handoffPath = path.join(root, "software-design/build/workflow/handoffs/example.md");
  const upstream = `## Later-Lifecycle Gates
### \`LGATE-001\` — Activation authority
**Produced by:** [BU](../../units/bu-001-example.md)
**Consumed at:** \`Activation\`
**Gate condition:** The external authority confirms [identity](../../records/verification/va-001-example.md#identity).
**Verification:** Run [VA-001](../../records/verification/va-001-example.md#verification) and check [external evidence](https://example.org/evidence#approved).
**Until satisfied:** No H(S) before activation under [policy](../../records/verification/va-001-example.md#policy).

`;
  write(handoffPath, handoffText({ gates: upstream }));
  const projected = upstream.replace("### `LGATE-001` —", "### `LGATE-001`:")
    .replace("**Produced by:**", "**Canonical source:**")
    .replaceAll("../../units/", "../../software-design/build/units/")
    .replaceAll("../../records/", "../../software-design/build/records/");
  const content = (gate) => validWorkpack()
    .replace("## Delivery Responsibility Coverage", gate + "## Delivery Responsibility Coverage")
    .replace("No later-lifecycle gate applies to this handoff.", "LGATE-001 preserves the activation prohibition outside current Definition of Done.");
  assert.equal(run(root, content(projected)).status, 0, "correctly rebased local links and identical external URL must pass");
  for (const [name, from, to, diagnostic] of [
    ["different target", "va-001-example.md#verification", "va-002-other.md#verification", "Verification"],
    ["different fragment", "#verification", "#other", "Verification"],
    ["changed label", "[VA-001]", "[VA-002]", "Verification"],
    ["missing verification link", "[VA-001](../../software-design/build/records/verification/va-001-example.md#verification)", "VA-001", "Verification"],
    ["changed external URL", "https://example.org/evidence#approved", "https://example.org/evidence#pending", "Verification"],
    ["changed authority", "external authority", "proof owner", "Gate condition"],
    ["changed condition", "confirms [identity]", "may confirm [identity]", "Gate condition"],
    ["changed stage", "`Activation`", "`Release`", "Consumed at"],
    ["removed prohibition", "No H(S) before activation", "H(S) permitted before activation", "Until satisfied"],
    ["added deferral", "No H(S) before activation", "Defer this requirement; no H(S) before activation", "Until satisfied"],
    ["different producer", "units/bu-001-example.md", "units/bu-002-other.md", "Canonical source"],
    ["missing producer", "[BU](../../software-design/build/units/bu-001-example.md)", "Unspecified", "Canonical source"],
  ]) {
    write(path.join(root, "software-design/build/records/verification/va-002-other.md"), "# Different verification\n");
    write(path.join(root, "software-design/build/units/bu-002-other.md"), "# Different producer\n");
    const result = run(root, content(projected.replace(from, to)));
    assert.equal(result.status, 1, name);
    assert.ok(result.stderr.includes("LGATE-001 **" + diagnostic + ":**"), name + ": " + result.stderr);
  }
});

for (const [label, projection, valid] of [
  ['exact projection', '**Excluded interactions:** `IFACE-001.ACT-002` — [Scope](../../software-design/build/workflow/handoffs/example.md#interaction-scope-exclusions)', true],
  ['omitted disposition', '', false],
  ['different action', '**Excluded interactions:** `IFACE-001.ACT-001` — [Scope](../../software-design/build/workflow/handoffs/example.md#interaction-scope-exclusions)', false],
  ['missing source', '**Excluded interactions:** `IFACE-001.ACT-002`', false],
  ['duplicate action', '**Excluded interactions:** `IFACE-001.ACT-002`, `IFACE-001.ACT-002` — [Scope](../../software-design/build/workflow/handoffs/example.md#interaction-scope-exclusions)', false],
]) {
  test('interaction scope exclusion projection: ' + label, (context) => {
    const root = fixture(); context.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const handoff = path.join(root, 'software-design/build/workflow/handoffs/example.md');
    write(handoff, fs.readFileSync(handoff, 'utf8') + '\n### Interaction Scope Exclusions\n\n| Interaction | Canonical scope evidence | Reason |\n| --- | --- | --- |\n| `IFACE-001.ACT-002` | Canonical evidence is checked by the upstream validator. | Unrelated to this bounded slice. |\n');
    const result = run(root, validWorkpack().replace('### Explicit Exclusions\n', '### Explicit Exclusions\n' + projection + '\n'));
    assert.equal(result.status, valid ? 0 : 1, result.stderr);
    if (!valid) assert.match(result.stderr, /Explicit Exclusions must project exactly|Excluded interactions must link/);
  });
}
