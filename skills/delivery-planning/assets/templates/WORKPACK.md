# <Delivery Title>

## Delivery Objective

State the bounded, observable outcome for this workpack.

**Software Design snapshot:** `sha256:<copied exactly from the linked Stage 9 handoff>`

## Delivery Scope

### Selected Build Units

- `BUILD_UNIT:BU-xxx` — `Target` — <what this workpack changes and delivers>
- `BUILD_UNIT:BU-yyy` — `Existing prerequisite` — <what this workpack verifies but must not change>

### Repository Disposition

- `REPO-xxx` — `Full repository` or `Partial repository`; list the selected code paths and, for a partial delivery, every omitted `BU-xxx` and its handoff reason.

### Direct Build Unit Dependencies

- `BUILD_UNIT:BU-xxx` — <why its interface or artifact is required, or `None.`>

### Explicit Exclusions

- <Build Unit, behavior, repository member, or `None.`> — <why it is outside this workpack>

<!-- When Stage 9 declares Interaction Scope Exclusions, preserve the exact IDs and link its dispositions. Otherwise omit this field. -->
**Excluded interactions:** <exact backticked IFACE-xxx.ACT-NNN IDs> — [Stage 9 scope dispositions](<handoff-path>#interaction-scope-exclusions)

### Local Implementation Discretion

- <reversible local choice, or `None.`>

## Canonical Sources Used

`WORKPACK.md` is task-specific execution context and routing only. Link canonical sources; do not copy substantial Software Design or Build Design content.

| Kind | Scope | ID | Canonical path | Anchor / section | Used for |
| --- | --- | --- | --- | --- | --- |
| Stage 9 handoff | Selected delivery | — | [Stage 9 handoff](<path>) | `Build Unit Routing Index` | Delivery scope, readiness route, and Snapshot ID. |
| Build Unit | `BUILD_UNIT:BU-xxx` | `BU-xxx` | `<path>` | `<section>` | Artifact, code path, module boundaries, and commands. |
| Repository Build Design | `REPO-xxx` | `REPO-xxx` | `<path>` | `<section>` | Workspace/repository construction rules. |
| Technical Constraint | `BUILD_UNIT:BU-xxx` | `CONS-xxx` | `<path>` | `Rule` | Protected technical must/must-not. |
| Implementation selection | `BUILD_UNIT:BU-xxx` | `SEL-xxx` | `<path>` | `<section>` | Selected implementation direction. |
| Verification capability | `BUILD_UNIT:BU-xxx` | `VA-xxx` | `<path>` | `<section>` | Reusable proof infrastructure. |
| Software Design | `<relevant scope>` | `SR-xxx`, `IFACE-xxx`, or another current canonical ID | `<path>` | `<section>` | Behavior, interface, or correctness source. |

Do not add finished `TICKET-NNNN` records merely for history. Cite an unresolved ticket only when it is a current handoff blocker.

Include every routed Repository Build Design's linked `agent-guidance.md`. When this delivery establishes or refreshes the repository boundary, map its repository-root `AGENTS.md` projection to RCOV, AC, and VE entries.

## Readiness Decision

<!-- Include this section only for a valid partial delivery, inherited repository foundation, or relevant caveat. Remove it otherwise. -->

State the exception, its canonical source, and why it does not block this workpack. For a post-implementation delta, identify the recoverable starting implementation report, its exact implemented snapshot and implementation commit when recorded, the changed implementation-owned requirements, and the truthful chronology; do not imply that this workpack existed before already-completed work or publication.

## Later-Lifecycle Gates

<!-- Include this section only when the Stage 9 handoff defines LGATE-NNN records. Remove it otherwise. Do not turn a later gate into a current AC/VE or Definition of Done item unless this workpack consumes it. -->

### `LGATE-001`: <later lifecycle gate>

- **Canonical source:** <Stage 9 gate and owning canonical local link>
- **Consumed at:** `Release` / `Deployment` / `Activation` / `Operation`
- **Gate condition:** <exact later-produced fact or artifact required>
- **Verification:** <procedure that proves the gate is satisfied>
- **Until satisfied:** <action or claim that remains prohibited>

## Stage 9 Obligation Coverage

Project every handoff `INPUT-NNN`, `INT-NNN`, `PSEAM-NNN`, and structured Verification Obligation exactly once. Reuse those identities; do not invent workpack-local replacements. If an upstream obligation family is empty, use its matching evidence-linked declaration:

**Input obligations:** `None.` — [handoff input-free declaration](<Stage-9-handoff-path>#required-input-ledger)

**Interaction obligations:** `None.` — [handoff interaction-free declaration](<Stage-9-handoff-path>#required-interaction-closure)

**Verification obligations:** `None.` — [handoff VO-free selected scope](<Stage-9-handoff-path>#allowed-delivery-slice)

### `INPUT-001` — <required value or artifact>

- **Handoff source:** [INPUT-001](<Stage-9-handoff-path>#input-001--required-value-or-artifact)
- **Handling:** <concrete acquisition, production, bootstrap, or lifecycle handling>
- **Coverage:** `AC-xxx`, `VE-xxx`, or `LGATE-NNN`

### `INT-001` — `IFACE-xxx.ACT-xxx`

<!-- For external-consumer or gated interactions copy Consumer, Producer, Proof owner, Required at and Availability from Stage 9, rebasing links. For gated interactions also copy Later-lifecycle gate, Lifecycle inputs, Current-profile inputs, Current-profile availability and Current-profile verification. These retain authority/profile boundaries; they do not create scope. Omit these conditional fields for ordinary interactions. -->

- **Handoff source:** [INT-001](<Stage-9-handoff-path>#int-001--iface-xxxact-xxx)
- **Coverage:** `VE-xxx` for current-profile proof; also the exact `LGATE-NNN` for a gated interaction, and `AC-xxx` when applicable
- **Required evidence classes:** <copy the exact Stage 9 evidence classes, for example `existence`, `structural-conformance`, `behavioral`, `consumer-fitness`>
- **High-risk cases:** `None.` for ordinary risk, or `Positive: VE-xxx; Rejection/denial: VE-yyy; Failure/recovery: VE-zzz`

### `PSEAM-001` — <physical compatibility class>

- **Handoff source:** [PSEAM-001](<Stage-9-handoff-path>#pseam-001--physical-compatibility-class)
- **Handoff result:** `COMPATIBLE` / `DELTA_OWNED` / `EXCLUDED`
- **Implementation situation:** <copy the exact `new-output`, `existing-unchanged`, or `implemented-evolution` handoff value>
- **Boundary class:** <copy the exact `protected-machine-interface`, `required-effectful-command`, `change-impact`, or `ordinary` handoff value>
- **Candidate compatibility proof:** <copy the exact handoff state and detail>
- **Evidence provenance:** <copy the exact handoff provenance and evidence>
- **Handling:** <preserve the observed compatibility, implement the selected owner delta, or preserve the canonical exclusion>
- **Direct change-impact handling:** <map every affected source/import, test/fixture, dependency/manifest/lock, generator/generated output, verifier/exact-identity, and configuration/evidence disposition into writable scope or protected unchanged scope>
- **Required-command-effect handling:** <map every required build/deploy/regenerate/migrate/cross-repository effect to an allowed workpack procedure and PB-xxx, or preserve the handoff's Not applicable result>
- **Coverage:** `VE-xxx` and, when applicable, `AC-xxx`
- **Protected-boundary compatibility:** `PB-xxx` — <why the procedure and any delta stay inside the boundary>

### `INV-001.VO-001` — <verification obligation title>

- **Handoff source:** [INV-001.VO-001](<Stage-9-handoff-path>#inv-001vo-001--verification-obligation-title)
- **Selected assignments:** <copy every exact `BUILD_UNIT:BU-xxx` owner from the handoff entry>
- **Repository manifest route:** <link each applicable Repository Build Design and name its tracked `assurance/coverage.yaml`, or link the canonical external/no-code evidence route>
- **Required evidence:** <preserve the obligation's evidence classes, boundary cases, and expected observation>
- **Coverage:** `VE-xxx` and, when applicable, `AC-xxx`

### UI/UX Delivery Coverage

<!-- Include this block only when the handoff's UI/UX Delivery Review applies. Remove it for a non-UI slice. -->

- **Handoff source:** [UI/UX Delivery Review](<Stage-9-handoff-path>#uiux-delivery-review)
- **Approved UI/UX sources:** <link exactly the handoff's UI/UX specification and selected candidate entrypoint, plus any upstream owner it links>
- **Application entrypoint:** <how the built application is started and opened for functional and implemented-UI evidence>
- **Representative viewports and states:** <supported viewports and materially distinct states, including applicable cancellation, failure/recovery, and accessibility checks>
- **Implemented UI/UX review mode:** `agent inspection` / `automated` / `human acceptance` — <use human acceptance only when a canonical source requires it>

| Journey | Acceptance | Functional evidence | Implemented UI/UX evidence |
| --- | --- | --- | --- |
| [<journey>](<UI-UX-specification-path>#journey-<anchor>) | `AC-xxx` | `VE-xxx` | `VE-yyy` |

## Delivery Responsibility Coverage

Enumerate every material selected-unit responsibility; do not collapse a Build Unit into one summary row when its source mapping or module architecture defines several delivery obligations.

### RCOV-001 · `BUILD_UNIT:BU-xxx`

- **Canonical responsibility:** [SR-xxx or module responsibility](<canonical-local-path>#<section>) — <exact responsibility, public seam, artifact, or proof obligation; create a separate RCOV entry for every material source responsibility>
- **Disposition:** `Deliver` / `Existing prerequisite` / `Excluded by Stage 9`
- **Coverage:** `AC-xxx`, `VE-xxx`, or <canonical Stage 9 exclusion link and reason>

## Delivery Design

Provide only task-specific implementation guidance: target repository paths, package/module areas, local sequencing, integration points, and references to canonical sources. Do not restate Software Design or Build Design content.

## Execution Environment Preflight

Bound this section to resources the workpack actually consumes. Use `Not applicable — <reason>` instead of inventing unrelated checks.

**Disk capacity:** <check command, minimum safe capacity, and disposable-output policy, or concrete Not applicable reason>

**Toolchains:** <exact locally resolvable runtimes/builders and check commands, or concrete Not applicable reason>

**Local artifacts and images:** <exact immutable artifacts/images and availability checks, or concrete Not applicable reason>

**Services and ports:** <required bindings, collision checks, and ownership, or concrete Not applicable reason>

**Browsers or devices:** <required engines/devices and availability checks, or concrete Not applicable reason>

**External access:** <registry/network/authentication access checks without secret values, or concrete Not applicable reason>

**Failure policy:** Complete every safe independent preflight check, group all failures by root cause, and report the consolidated blockers before source edits; skip only checks transitively blocked by an observed prerequisite failure.

## Protected Boundaries

Define at least one `PB-xxx`; a ready workpack may not replace explicit protected boundaries with generic prose.

### PB-001: <boundary name>

- **Canonical source:** <CONS-xxx, RC-xxx, or Software Design path and section>
- **Must preserve:** <exact invariant, authority, interface, lifecycle, security, or compatibility rule>
- **Workpack limit:** <what this workpack may change without crossing the boundary>

## Acceptance Criteria

### AC-001: <observable result>

- **Canonical source:** <Build Unit, repository, or Software Design path and section>
- **Preconditions:** <if any>
- **Expected result:** <observable behavior or artifact outcome>
- **Required evidence:** `VE-001`

## Verification Evidence Required

### VE-001: <evidence name>

- **Supports:** `AC-001`
- **Capability:** `VA-xxx` or `None.`
- **Procedure:** <exact command, fixture, simulator, or manual procedure>
- **Evidence to preserve:** <output, trace, artifact, or human confirmation>
- **Planning note:** <for example, `Planned — unverified until scaffold exists`, or `None.`>

When the referenced VA is `Planned — unverified`, place capability creation before this procedure or make capability creation the bounded workpack objective. A planned capability is not execution evidence.

Do not delete, skip, disable, rewrite, or weaken existing tests, checks, fixtures, thresholds, golden outputs, or procedures to obtain a pass. Stop and escalate if evidence conflicts with approved behavior.

## Delivery Evidence Contract

- **Evidence root:** `delivery-evidence/`
- **Execution summary:** `delivery-evidence/executions/sha256-<full-workpack-snapshot-digest>/SUMMARY.md`
- **Raw artifacts:** `delivery-evidence/executions/sha256-<full-workpack-snapshot-digest>/artifacts/` — Optional; preserve only material machine output that supports a mapped VE.
- **Publication receipts:** `None.` or `delivery-evidence/receipts/publications/<filesystem-safe-artifact>@<version>.json`
- **Consumer-install receipts:** `None.` or `delivery-evidence/receipts/consumers/<consumer>--<filesystem-safe-artifact>@<version>.json`
- **Compatibility evidence:** <mapped shipped-seam `VE-xxx`; state explicitly that publication or installation receipts do not establish behavioral compatibility>
- **Historical evidence:** Preserve existing evidence and links without silent rewrite or migration.

Replace `<full-workpack-snapshot-digest>` with all 64 hexadecimal characters from `Software Design snapshot`, using `sha256-` rather than `sha256:` in the directory name. AC and VE identifiers are local to this workpack snapshot and are recorded together in `SUMMARY.md`; do not create one Markdown file per VE.

## Workpack Integrity Review

Perform this review after the complete draft. Re-read the canonical source closure and do not copy the Stage 9 receipt.

**Review result:** `PASS` / `BLOCKED`

**Canonical-source consistency:** `PASS` / `BLOCKED` — <cross-source conclusion and canonical local link>

**Required-input closure:** `PASS` / `BLOCKED` — <producer/precondition conclusion and canonical local link>

**Later-lifecycle gate disposition:** `PASS` / `BLOCKED` — <LGATE-NNN projection conclusion, or state that the handoff defines no later-lifecycle gate>

**Stage 9 obligation coverage:** `PASS` / `BLOCKED` — <exact INPUT-NNN and INT-NNN projection conclusion, or cite the handoff's evidence-linked None. declarations>

**UI/UX delivery coverage:** `PASS` / `BLOCKED` — <include only for an applicable handoff UI/UX Delivery Review: approved sources and selected candidate preserved, every covered journey mapped to AC plus separate functional and implemented-UI VE-xxx>

**Physical-realizability projection:** `PASS` / `BLOCKED` — <link the handoff Physical Realizability Closure and cite every exact PSEAM-NNN with its VE/PB handling>

**Verification-obligation coverage:** `PASS` / `BLOCKED` — <cite every structured INV/SEC VO entry and its VE mapping, or state that the selected slice is VO-free>

**Responsibility coverage:** `PASS` / `BLOCKED` — <RCOV-xxx coverage conclusion>

**Acceptance/evidence reciprocity:** `PASS` / `BLOCKED` — <AC-xxx to VE-xxx conclusion>

**Phase and capability sequencing:** `PASS` / `BLOCKED` — <phase order and planned-capability conclusion, or why the workpack is unphased>

**Proof capability adequacy:** `PASS` / `BLOCKED` — <VE-xxx environment and observable-claim conclusion>

**Delivery-evidence contract:** `PASS` / `BLOCKED` — <exact snapshot-scoped SUMMARY.md destination, optional artifacts disposition, receipt classification, and historical-evidence preservation conclusion>

**Execution eligibility:** `PASS` / `BLOCKED` — <current Ready sequence/order-group result, or retained Implemented-slice lineage basis>

**Stage 9 compatibility closure:** `PASS` / `BLOCKED` — <link the handoff Delivery Slice Realizability Review and preserve shared-producer surface, placement, fan-out/evolution, and shipped-seam physical preflight in the mapped VE procedures>

**Diagnostic and known-consumer coverage preservation:** `PASS` / `BLOCKED` — <link the handoff Delivery Slice Realizability Review; preserve its initial finite inventory, direct-dependency additions, complete known-consumer rows, grouped root-cause result, PASS zero-new-blocker rerun, and frozen-inventory termination without adding downstream consumers to this workpack scope>

**Affected-slice isolation:** `PASS` / `BLOCKED` — <selected slice disposition as producer delta, consumer delta, evidence-only/no-impact, blocked pending receipt, or unaffected; confirm no other slice is added>

**Review blockers:** `None.` or <canonical blocker and route>

## Optional Phases

<!-- Include this section only when execution genuinely needs phases. Remove it completely for an unphased workpack. -->

### Phase 1: <name>

- **Objective:** <bounded phase result>
- **Depends on:** <prior phase or explicit Build Unit dependency>
- **Entry criteria:** <what must already be true>
- **Exit criteria:** <AC-xxx and VE-xxx required before the next phase>

## Definition of Done

- Every applicable `AC-xxx` is satisfied.
- Every required automated `VE-xxx` and agent inspection has actually run and passed.
- Every procedure that canonically requires human acceptance has human confirmation.
- All `PB-xxx` boundaries remain preserved.
- All AC/VE outcomes are recorded in the snapshot-scoped `SUMMARY.md`.
- Optional artifacts and required typed receipts are preserved at the paths declared by `Delivery Evidence Contract`.

For a dedicated scaffold or verification-enablement workpack, define completion only for the capability it creates; do not claim final product behavior has been certified.

## Stop and Escalation Conditions

- Stop for an unresolved material decision, protected-boundary conflict, undeclared dependency, partial-repository scope expansion, required verification that still fails after applicable safe remediation or requires denied/unavailable approval, or evidence that conflicts with approved behavior.
- Route system-contract issues to Software Design, repository/build-unit realization choices to Stage 8, selected-scope readiness issues to Stage 9, and unresolved scope choices to the user.

## Evidence to Preserve for Later Review

- `delivery-evidence/executions/sha256-<full-workpack-snapshot-digest>/SUMMARY.md`;
- material automated command output and test, simulator, or fixture traces under the optional sibling `artifacts/`;
- representative UI screenshots and review findings, when UI/UX Delivery Coverage applies;
- human acceptance confirmations, when required;
- publication and consumer-install receipts declared by this workpack;
- changed files; and
- deviations or escalations.

## /goal Handoff

Run this handoff through the host environment's supported native goal or continuation mechanism, or start that loop and select the execution skill manually. This section heading is a stable schema identifier; it does not require a `/goal` command.

- **Workpack:** `<delivery-workpacks/<delivery-slice>/WORKPACK.md>` — execute only this workpack.
- **Target repository:** `<REPO-xxx target implementation repository or workspace path>`
- **Execution skill:** `delivery-workpack-execution`
- **Scope:** Stay within `Delivery Scope`; change only `Target` Build Units and verify `Existing prerequisite` units without changing them.
- **Evidence:** Collect every required `VE-xxx` in `delivery-evidence/executions/sha256-<full-workpack-snapshot-digest>/SUMMARY.md` and pass evidence validation before claiming completion.
- **Protected boundaries:** Preserve every `PB-xxx` and do not perform or claim an action guarded by an unsatisfied `LGATE-NNN`, when present.
- **Stop:** Stop and escalate under `Stop and Escalation Conditions`. Do not expand scope or weaken verification to obtain a pass. Treat the goal as complete only when `Definition of Done` is satisfied; otherwise report the consolidated blocker.
