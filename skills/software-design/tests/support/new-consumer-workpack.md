# Example Delivery

## Delivery Objective
Implement the new state client in B against the verified read-only A output; final B consumer fitness remains scheduled.

**Software Design snapshot:** `sha256:SNAPSHOT`

## Delivery Scope
### Selected Build Units
- `BUILD_UNIT:BU-002` — `Target` — selected delivery.

### Repository Disposition
- `REPO-002` — `Full repository`; deliver the selected code path.

### Direct Build Unit Dependencies
- `BUILD_UNIT:BU-001` — consume the contracted earlier producer output.

### Explicit Exclusions
- `None.` — the handoff excludes no selected responsibility.

### Local Implementation Discretion
- `None.`

## Canonical Sources Used
| Kind | Scope | ID | Canonical path | Used for |
| --- | --- | --- | --- | --- |
| Stage 9 handoff | Selected delivery | — | [Handoff](../../software-design/build/workflow/handoffs/repo-002-example-slice.md) | Scope and snapshot. |
| Build Unit | BU-002 | BU-002 | [BU](../../software-design/build/units/bu-002-example-unit.md) | Responsibility. |
| Repository Build Design | REPO-002 | REPO-002 | [Repository](../../software-design/build/repositories/repo-002-example-workspace/README.md) | Repository contract. |
| Repository agent guidance | REPO-002 | — | [Agent guidance](../../software-design/build/repositories/repo-002-example-workspace/agent-guidance.md) | Root AGENTS.md projection. |
| Technical Constraint | BU-002 | CONS-002 | [Constraint](../../software-design/build/records/constraints/cons-002-no-secret-custody.md) | Protected rule. |
| Implementation selection | BU-002 | SEL-002 | [Selection](../../software-design/build/records/selections/sel-002-runtime.md) | Implementation direction. |
| Verification capability | BU-002 | VA-002 | [Capability](../../software-design/build/records/verification/va-002-local-integration-harness.md) | Proof route. |
| Software Design | SR-002 | SR-002 | [Responsibility](../../software-design/system-model/domains/example/responsibilities/sr-002-example.md) | Behavior source. |

| Upstream Build Unit | BU-001 | BU-001 | [Producer](../../software-design/build/units/bu-001-example-unit.md) | Required public output. |

## Stage 9 Obligation Coverage
### `INPUT-001` — Example fixture
- **Handoff source:** [INPUT-001](../../software-design/build/workflow/handoffs/repo-002-example-slice.md#input-001--example-fixture)
- **Availability:** `planned upstream output`
- **Produced by:** `BUILD_UNIT:BU-001` — [Producer](../../software-design/build/units/bu-001-example-unit.md)
- **Producer handoff:** [Expected output](../../software-design/build/workflow/handoffs/repo-001-example-slice.md#output-001)
- **Expected output:** API 001
- **Expected contract:** v2
- **Consumption point:** Phase 1 built package consumer
- **Availability check:** Acquire exact producer and exercise its public seam with this consumer.
- **Handling:** Acquire and verify the expected upstream output before use; generate the deterministic example fixture before verification.
- **Coverage:** `VE-001`

**Interaction obligations:** `None.` — [Interaction-free scope](../../software-design/build/workflow/handoffs/repo-002-example-slice.md#required-interaction-closure)

### `PSEAM-001` — Selected physical seam
- **Handoff source:** [PSEAM-001](../../software-design/build/workflow/handoffs/repo-002-example-slice.md#pseam-001)
- **Handoff result:** `COMPATIBLE`
- **Implementation situation:** `existing-unchanged`
- **Boundary class:** `ordinary`
- **Candidate compatibility proof:** `NOT_APPLICABLE` — The [Build Unit public seam](../../software-design/build/units/bu-002-example-unit.md) records the focused compatibility disposition.
- **Evidence provenance:** `accepted-receipt` — [BU-002 evidence](../../software-design/build/units/bu-002-example-unit.md) records the current observation.
- **Handling:** Retain exact representation and perform scheduled consumer proof.
- **Direct change-impact handling:** Retain approved bounded source, tests, fixtures, manifests, generated surfaces and evidence dispositions.
- **Required-command-effect handling:** Preserve declared safe command effects.
- **Coverage:** `VE-001`
- **Protected-boundary compatibility:** `PB-001` — preserve contract.

### `PSEAM-002` — Selected physical seam
- **Handoff source:** [PSEAM-002](../../software-design/build/workflow/handoffs/repo-002-example-slice.md#pseam-002)
- **Handoff result:** `AWAITING_UPSTREAM`
- **Implementation situation:** `new-output`
- **Boundary class:** `ordinary`
- **Candidate compatibility proof:** `PLANNED` — The [Build Unit public seam](../../software-design/build/units/bu-002-example-unit.md) records the focused compatibility disposition.
- **Evidence provenance:** `planned-proof` — [BU-002 evidence](../../software-design/build/units/bu-002-example-unit.md) defines the scheduled future consumer proof, not observed success.
- **Handling:** Retain exact representation and perform scheduled consumer proof.
- **Direct change-impact handling:** Retain approved bounded source, tests, fixtures, manifests, generated surfaces and evidence dispositions.
- **Required-command-effect handling:** Preserve declared safe command effects.
- **Coverage:** `VE-001`
- **Protected-boundary compatibility:** `PB-001` — preserve contract.

**Verification obligations:** `None.` — [handoff VO-free selected scope](../../software-design/build/workflow/handoffs/repo-002-example-slice.md#allowed-delivery-slice)

## Delivery Responsibility Coverage
### RCOV-001 · `BUILD_UNIT:BU-002`
- **Canonical responsibility:** [SR-002 responsibility](../../software-design/system-model/domains/example/responsibilities/sr-002-example.md) — public example behavior.
- **Disposition:** `Deliver`
- **Coverage:** `AC-001`


## Delivery Design
Implement B’s new state client and consumer verification in `packages/example`; A is read-only. Final VE-001 runs through the implemented B client after construction. No B implementation currently exists.

## Execution Environment Preflight
**Disk capacity:** df -Pk . must show at least 2 GiB available.
**Toolchains:** node --version must match approved runtime.
**Local artifacts and images:** Not applicable — local source fixture only.
**Services and ports:** Not applicable — in-process library proof.
**Browsers or devices:** Not applicable — no UI.
**External access:** Not applicable — local fixture.
**Failure policy:** Complete every safe independent check, group failures by root cause and report consolidated blockers before source edits; skip only transitively blocked checks.

## Protected Boundaries
### PB-001: Public boundary
- **Canonical source:** [CONS-002](../../software-design/build/records/constraints/cons-002-no-secret-custody.md)
- **Must preserve:** Public behavior.
- **Workpack limit:** No contract changes.

## Acceptance Criteria
### AC-001: Observable result
- **Canonical source:** [SR-002](../../software-design/system-model/domains/example/responsibilities/sr-002-example.md)
- **Expected result:** The public behavior is observable.
- **Required evidence:** `VE-001`

## Verification Evidence Required
### VE-001: Public behavior evidence
- **Supports:** `AC-001`
- **Capability:** `None.`
- **Evidence scope:** `consumer-fitness`
- **Procedure:** After implementing B, exercise its real public state-client path against A: success, absence, denial, stale and unavailable cases. Preserve the observed B result; producer-only and fixture probes do not satisfy this VE.
- **Evidence to preserve:** Passing output.

## Delivery Evidence Contract
- **Evidence root:** `delivery-evidence/`
- **Execution summary:** `delivery-evidence/executions/sha256-SNAPSHOT/SUMMARY.md`
- **Raw artifacts:** `delivery-evidence/executions/sha256-SNAPSHOT/artifacts/` — Optional; preserve only material machine output that supports VE-001.
- **Publication receipts:** `None.`
- **Consumer-install receipts:** `None.`
- **Compatibility evidence:** `VE-001` exercises the shipped consumer seam; publication or installation receipts do not establish behavioral compatibility.
- **Historical evidence:** Preserve existing evidence and links without silent rewrite or migration.

## Workpack Integrity Review
**Review result:** `PASS`
**Canonical-source consistency:** `PASS` — [SR-002](../../software-design/system-model/domains/example/responsibilities/sr-002-example.md) is internally consistent.
**Required-input closure:** `PASS` — [BU](../../software-design/build/units/bu-002-example-unit.md) requires no unavailable producer.
**Later-lifecycle gate disposition:** `PASS` — No later-lifecycle gate applies to this handoff.
**Stage 9 obligation coverage:** `PASS` — INPUT-001 and PSEAM-001, PSEAM-002 are projected to VE-001; handoff declares no interaction obligations.
**Physical-realizability projection:** `PASS` — [Physical closure](../../software-design/build/workflow/handoffs/repo-002-example-slice.md#physical-realizability-closure) projects PSEAM-001, PSEAM-002 to VE-001 and PB-001.
**Verification-obligation coverage:** `PASS` — The selected slice is VO-free.
**Responsibility coverage:** `PASS` — RCOV-001 maps the selected responsibility.
**Acceptance/evidence reciprocity:** `PASS` — AC-001 and VE-001 are reciprocal.
**Phase and capability sequencing:** `PASS` — The workpack is unphased because it has one independent delivery boundary.
**Proof capability adequacy:** `PASS` — VE-001 directly observes the claimed result.
**Delivery-evidence contract:** `PASS` — The snapshot-scoped SUMMARY.md records VE-001, receipts remain typed, and historical evidence is preserved.
**Execution eligibility:** `PASS` — B is Ready in current sequence order group 2; actual A output is verified.
**Stage 9 compatibility closure:** `PASS` — [Stage 9 review](../../software-design/build/workflow/handoffs/repo-002-example-slice.md#delivery-slice-realizability-review) preserves the shipped-seam preflight in VE-001.
**Diagnostic and known-consumer coverage preservation:** `PASS` — [Stage 9 review](../../software-design/build/workflow/handoffs/repo-002-example-slice.md#delivery-slice-realizability-review) preserves the bounded diagnostic cohort, known consumers, and zero-new-blocker rerun.
**Affected-slice isolation:** `PASS` — B owns only its new consumer and final proof; A remains read-only.
**Review blockers:** `None.`

## Definition of Done
AC-001 and VE-001 pass.

## Stop and Escalation Conditions
Stop on a protected-boundary conflict.

## Evidence to Preserve for Later Review
Preserve `delivery-evidence/executions/sha256-SNAPSHOT/SUMMARY.md` and any material VE-001 artifacts.

## /goal Handoff
Planning is complete; execution requires separate explicit authorization.
