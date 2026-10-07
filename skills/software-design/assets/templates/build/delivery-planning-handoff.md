# Delivery Planning Handoff

This file is a derived, compact routing index for one selected delivery slice. Canonical facts, decisions, dependencies, verification claims, and blockers remain in linked Build Unit, Build Design, ticket, or Software Design files.

**Sequence index:** [Handoff Sequence](./README.md)

## Readiness Outcome

**Outcome:** `IMPLEMENTATION_DETAILS_READY`

**Snapshot ID:** `sha256:<generated after the selected sources are reconciled into the final handoff>`

Use exactly one of `IMPLEMENTATION_DETAILS_READY`, `IMPLEMENTATION_DETAILS_PARTIAL`, `NEEDS_TECHNICAL_DECISION`, `NEEDS_PRODUCT_DECISION`, or `NEEDS_USER_APPROVAL`. The two `IMPLEMENTATION_DETAILS_*` values are protocol tokens consumed by Delivery Planning; the human-facing stage name is Delivery Readiness. `NOT_REQUIRED` may be reported only when Stage 9 creates no handoff; it is never valid inside this file. `IMPLEMENTATION_DETAILS_PARTIAL` is valid only when every unresolved item is explicitly outside the selected slice.

## Allowed Delivery Slice

State the capability downstream planning may implement and every excluded unresolved capability.

**Selected build units:** `BUILD_UNIT:BU-xxx`, `BUILD_UNIT:BU-yyy`

**Writable build units:** `BUILD_UNIT:BU-xxx` — every required implementation-owned change must belong to this subset; selected prerequisites omitted here are observation-only.

**Target outcome:** <canonical local link> — <intended actor or consumer> can <minimum observable result> through <real entrypoint or invocation>.

**Runtime-profile claims:** <canonical local link> — <profile name>: `build compatibility` / `verification only` / `runnable use` / `deployment` / `activated operation`; list every claim included in this slice and explicitly exclude the others.

Create exactly one Build Unit Routing Index entry for each identifier.

Every handoff uses these outcome/profile fields. Choose the acceptance shape appropriate to the artifact: runnable application/service path, real CLI invocation, installed library/SDK consumer, representative pipeline execution, or isolated infrastructure provision/dry run. A test harness cannot satisfy a runnable-use claim unless it is itself the selected target. Paid services or production credentials may remain `LGATE-NNN` gates when an approved non-production substitute preserves the required behavior; the substitute does not prove the real-provider profile.

## Selected Or Inherited Implementation Shape

- Repository and workspace topology: TBD.
- Build units and artifacts: TBD.
- Cross-unit integration points: TBD.
- Environments and commands: TBD.
- Verification infrastructure: TBD.

Link canonical Repository Build Design, Build Unit, SEL, VA, ticket, and Software Design records instead of duplicating rationale.

## UI/UX Delivery Review

Include this section when any selected Build Unit declares `ui_ux_applicability: "applicable"`. Every selected Build Unit in a new or refreshed `IMPLEMENTATION_DETAILS_READY` or `IMPLEMENTATION_DETAILS_PARTIAL` handoff must declare `ui_ux_applicability` explicitly. If all selected units declare `not-applicable`, write `**UI/UX delivery review:** \`Not applicable\` — <reason>`.

**Approved UI/UX sources:** [UI/UX specification](../../../ui-ux/specification.md); [selected candidate](../../../ui-ux/alternatives/<candidate>/index.html); upstream UI/UX owner or `None.`.

**Covered prototype states:** <links to exact specification journey anchors plus affected routes, dialogs, and materially distinct states; relevant pending changes must be reconciled>.

**Prototype walkthrough:** `Reviewed — no unresolved usability blockers` / `Blocked` — <review evidence or blocker>.

**Functional acceptance owner:** <selected Build Unit and procedure/evidence route proving product behavior and outcomes>.

**Implemented UI/UX review owner:** <selected Build Unit or named reviewer and procedure/evidence route for representative viewports; meaningful outcomes and next steps; cancellation and failure/recovery; content and accessibility; typography, spacing, hierarchy, density, and responsive readability; and prototype/specification fidelity>.

**Actual user testing:** `Not planned`, `Planned separately`, or <current evidence>. Never infer this from prototype approval or implementation review.

**Consistency result:** `PASS` / `BLOCKED` — <comparison among upstream requirements, Software Design behavior, UI/UX specification, prototype, Build Units, and this handoff>.

A human-facing slice under either `IMPLEMENTATION_DETAILS_READY` or `IMPLEMENTATION_DETAILS_PARTIAL` requires a reviewed walkthrough with no unresolved usability blocker, a `PASS` consistency result, and separate functional-acceptance and implemented-UI/UX-review routes for the selected scope. Delivery Planning projects these approved sources, covered journeys, and separate routes into the workpack. Structural validation does not establish usability, accessibility conformance, implementation fidelity, or user-testing outcomes.

## Required Input Ledger

Enumerate the complete direct and transitive prerequisite closure. Use one entry per consumed value, including prerequisites of a producer's release or publication stage. If the slice truly consumes no inputs, replace all entries with `**Required inputs:** \`None.\` — <canonical link proving the input-free boundary>`.

### `INPUT-001` — <required value or artifact>

**Consumer:** `BUILD_UNIT:BU-xxx`

**Consumed at:** `Implementation` / `Build` / `Verification` / `Release` / `Deployment` / `Activation` / `Operation`

**Input kind:** `Source` / `Immutable artifact` / `Credential` / `Configuration` / `External fact` / `Fixture`

**Produced by:** `BUILD_UNIT:BU-yyy` with canonical local link, or `External`

**Producer repository:** `REPO-xxx` / `External`

**Produced at:** `Implementation` / `Build` / `Verification` / `Release` / `Deployment` / `Activation` / `Operation` / `Existing` / `External`

**Availability:** `selected-slice output` / `verified existing input` / `later-lifecycle output` / `missing`

**Maturity:** `source-only` / `built` / `published` / `accessible` / `verified` / `not-applicable`

**Evidence:** <current local link to producer delivery evidence, registry/install receipt, fixture, or canonical input-free/selected-output owner>

**Later-lifecycle gate:** `None.` or `LGATE-NNN`

**Artifact identity:** `None.` or <exact immutable package version, image digest, or artifact identifier>

**Source revision:** `None.` or <exact source revision>

**Integrity:** `None.` or <exact digest/integrity value>

**Resolution check:** `None.` or <successful exact-version resolution with current local evidence link>

**Authorized access check:** `None.` or <successful authorized fetch/install with current local evidence link; never include the credential>

For every pre-existing immutable artifact consumed by Implementation, Build, or Verification, use `verified existing input` plus `verified` maturity and complete all five artifact receipt fields. A source tree, build output, publication claim, or accessible registry entry is not a verified artifact. A consumer-specific lock, checksum, install, fetch, or access receipt that can only be produced after an explicitly bound repository is scaffolded is ordinary workpack bootstrap when producer evidence establishes the exact artifact and the Repository Build Design fixes its acquisition, authentication, and verification route; do not mark it missing solely because bootstrap has not run. A selected-slice output must be produced by a selected Build Unit. A later-lifecycle output must map to an `LGATE-NNN` and cannot satisfy an earlier stage. Reject any consumer-stage → producer-stage cycle before selecting a ready outcome.

## Required Interaction Closure

Enumerate every material logical interaction the selected slice must implement or consume. Use one entry per `IFACE-xxx.ACT-NNN`. If the selected slice truly has no material cross-Build-Unit or external interaction, replace all entries with `**Required interactions:** \`None.\` — <canonical local link proving the interaction-free boundary>`.

### `INT-001` — `IFACE-xxx.ACT-xxx`

**Consumer:** `BUILD_UNIT:BU-xxx` or `External` — <named actor/system and exact canonical IFACE.ACT link>

**Proof owner:** <for an external consumer or gated interaction: one selected BUILD_UNIT:BU-xxx with canonical link and relevant action binding; verification ownership only>

**Producer:** `BUILD_UNIT:BU-yyy` with canonical local link, or `External`

**Required at:** `Implementation` / `Build` / `Verification` / `Release` / `Deployment` / `Activation` / `Operation`

**Interaction kind:** `callable` / `state-observation` / `event-or-message` / `artifact-transfer` / `manual-handoff` / `external-system`

**Logical contract:** [IFACE-xxx.ACT-xxx](../../../system-model/contracts/interfaces/iface-xxx-interface.md#act-xxx)

**Physical binding:** <link to the Build Unit `Material Interaction Bindings` entry and name the route, export, event, artifact path, command, or manual handoff>

**Consumer path:** <BU consumer seam and link; for an external consumer, its actual entrypoint plus canonical action and selected proof-owner links>

**Availability:** `selected-slice output` / `verified existing interaction` / `later-lifecycle output` / `missing`

<!-- The next five fields apply only to later-lifecycle output. Omit them for ordinary current interactions. Reuse existing INPUT/LGATE records; do not duplicate INT identities. -->
**Later-lifecycle gate:** `LGATE-NNN`

**Lifecycle inputs:** <existing INPUT-NNN identities sharing the producer, later stage and gate>

**Current-profile inputs:** <existing early-stage INPUT-NNN identities, or `None.` with justification below>

**Current-profile availability:** `verified existing interaction` / `selected-slice output`

**Current-profile verification:** <approved profile and consumer-proof links, required substitute/acquisition, current evidence scope and prohibition on treating fixtures as provider evidence>

**Required evidence classes:** `existence`, `identity-freshness`, `structural-conformance`, `behavioral`, `consumer-fitness` as applicable

**Fitness evidence:** <current local evidence link for a verified existing interaction, or canonical selected-slice owner link for planned proof>

**Representation conformance:** `Verified` / `Planned` / `Not applicable` — <procedure, evidence, or concrete reason with a local link when Verified or Planned>

**Consumer challenge:** `PASS` / `Planned` — <fresh independent consumer-side conclusion and local evidence link for a verified existing producer, or planned selected-slice proof owner>

**Risk:** `ordinary` / `high`

**High-risk verification matrix:** `None.` for ordinary risk, or <local link and explicit positive, rejection/denial, and failure/recovery cases>

Every material interaction requires `existence`, `behavioral`, and `consumer-fitness`; machine-consumable representations also require `structural-conformance`. A verified existing interaction additionally requires `identity-freshness`, verified representation conformance when applicable, and a fresh `PASS` consumer challenge. Producer-local tests, mocks, file existence, or a contract declaration alone cannot prove consumer fitness. `high` risk requires the bounded three-part verification matrix; ordinary risk must use `None.`. A selected-slice output may keep conformance and the consumer challenge `Planned` only when their proof owners are in the selected slice. Exact producer revision or immutable artifact identity is conditional: record it in Required Input Ledger or Fitness evidence when drift could invalidate the conclusion; do not create universal per-source hashes.


For gated interactions the existing conformance/challenge fields describe only the declared current profile. Its prerequisites and compatibility checks still apply; real provider evidence remains mandatory at the linked gate. Require the gate stage to match Required at and its INPUT records. A planned current output needs an already writable selected proof owner. External actor/proof ownership never grants authority or writable scope. See the Stage 9 reference for the complete cross-check contract.

## Physical Realizability Closure

Create a finite ledger of compatibility equivalence classes. Group inputs and interactions that share one producer/consumer representation and failure mode; do not create one row per private helper. Cover every `INPUT-NNN`, every `INT-NNN`, and the declared target outcome at least once. Existing prerequisites require observations from their actual public seams. Selected-slice outputs may use a concrete candidate representation only when the complete correction and final proof are owned by selected Build Units.

### `PSEAM-001` — <compatibility equivalence class>

**Covers:** `INPUT-NNN`, `INT-NNN`, and/or `Target outcome`

**Runtime profiles:** <exact affected profiles>

**Implementation situation:** `new-output` / `existing-unchanged` / `implemented-evolution`

**Boundary class:** `protected-machine-interface` / `required-effectful-command` / `change-impact` / `ordinary`

**Producer observation:** `OBSERVED` / `SELECTED_SLICE_OUTPUT` / `NOT_APPLICABLE` — <actual emitted value, candidate selected output, or concrete reason; include current local evidence>

**Consumer observation:** `OBSERVED` / `SELECTED_SLICE_OUTPUT` / `NOT_APPLICABLE` — <actual accepted value or validation rule, candidate selected output, or concrete reason; include current local evidence>

**Compared dimensions:** schema/version: <comparison or inapplicable reason>; identity/representation: <comparison or inapplicable reason>; transport/method: <comparison or inapplicable reason>; topology/ports: <comparison or inapplicable reason>; authority/caller: <comparison or inapplicable reason>; lifecycle/persistence: <comparison or inapplicable reason>; command/toolchain: <comparison or inapplicable reason>

**Candidate compatibility proof:** `PASS` / `PLANNED` / `NOT_APPLICABLE` — <focused real-consumer probe and observed result; protected implemented evolutions require PASS>

**Evidence provenance:** `executed-probe` / `accepted-receipt` / `source-inspection` / `planned-proof` — <current local evidence outside this handoff; `executed-probe` is mandatory for a protected implemented evolution>

**Direct change-impact closure:** source/imports: <paths and disposition>; tests/fixtures/golden values: <paths and disposition>; dependencies/manifests/lockfiles: <paths and disposition>; generators/generated outputs: <paths and disposition>; identity/freshness/receipt verifiers: <paths and disposition>; configuration/evidence: <paths and disposition>

**Required-command effects:** `CHECKED` / `NOT_APPLICABLE` — <actual build/deploy/regenerate/migrate/cross-repository effects and protected-boundary compatibility with current local command evidence, or concrete inapplicability for an ordinary command-free seam>

**Current result:** `COMPATIBLE` / `DELTA_OWNED` / `BLOCKED` / `EXCLUDED`

**Delta owner:** `None.` for `COMPATIBLE`; selected `BUILD_UNIT:BU-xxx` owner(s) for `DELTA_OWNED`; canonical blocker or exclusion link for `BLOCKED` or `EXCLUDED`

**Probe:** <exact safe command/procedure already run for existing facts, or final selected-output proof procedure>

**Evidence:** <current local evidence link; do not cite only this handoff>

**Downstream impact:** <every affected slice disposition or bounded non-applicability>

`IMPLEMENTATION_DETAILS_READY` and `IMPLEMENTATION_DETAILS_PARTIAL` forbid `BLOCKED`. `DELTA_OWNED` is valid only when every delta owner is selected and the complete correction fits the writable scope and protected boundaries. `EXCLUDED` requires a canonical scope exclusion and cannot hide a prerequisite of the declared target outcome. This closure is deliberately bounded: it compares only the selected target outcome, its direct/transitive prerequisites, and mechanically known target-version consumers.

## Required Verification Obligation Closure

Apply the active Software Design skill's Assurance Traceability contract. Include this section when any selected Build Unit has structured VO assignments. Enumerate every distinct selected assignment; do not infer closure from a test command, VA record, or repository alone.

### `INV-001.VO-001` — Obligation title

**Canonical obligation:** Link the exact invariant or security VO anchor.

**Selected assignments:** `BUILD_UNIT:BU-xxx` and every other selected Build Unit assigned to this VO.

**Repository manifest route:** Link each applicable Repository Build Design and name its tracked `assurance/coverage.yaml`; for external/no-code evidence, name the canonical external result route.

**Required evidence:** State the evidence classes, boundary cases, and expected observation inherited from the VO and assignment.

**Routing state:** `Planned` / `Mapped existing — freshness unverified` / `Approved exception`

**Gap disposition:** `None.` or a linked canonical blocker or current exception.

Every selected VO must have a concrete route. `Unassigned`, `unmapped`, missing manifest ownership, or an exception without approval and expiry blocks a ready outcome. Planned evidence is valid before implementation only when its Build Unit and repository route are in the selected slice; it is not execution evidence.

## Later-Lifecycle Gates

<!-- Include this section only when a fully specified value or artifact is intentionally produced after the selected implementation/build/test slice. Remove it otherwise. A gate does not make an implementable Build Unit PARTIAL. -->

### `LGATE-001` — <later release, deployment, activation, or operation gate>

**Consumed at:** `Release` / `Deployment` / `Activation` / `Operation`

**Produced by:** <canonical local link to the producer or owning selection>

**Gate condition:** <exact fact or artifact that must exist before the later lifecycle action>

**Verification:** <exact procedure that proves the gate is satisfied>

**Until satisfied:** <release, deployment, activation, operation, or claim that remains prohibited>

## Delivery Slice Realizability Review

Perform this review from the canonical selected-source closure after Repository Discovery. Do not copy an earlier readiness claim or infer `PASS` from ticket status.

**Review result:** `PASS` / `BLOCKED`

**Source consistency:** `PASS` / `BLOCKED` — <conclusion, boundary or negative scenario checked, and canonical local link>

**Required-input closure:** `PASS` / `BLOCKED` — <every INPUT-NNN and LGATE-NNN summarized; immutable receipts, cross-repository evidence, and temporal-cycle result stated with canonical local link>

**Interaction closure:** `PASS` / `BLOCKED` — <every INT-NNN summarized; logical-to-physical binding, representation conformance, producer fitness, consumer challenge, and high-risk matrix disposition stated with canonical local link>

**Toolchain realizability:** `PASS` / `BLOCKED` — <version existence, engines, peers, and commands checked, with canonical local link>

**Responsibility projection:** `PASS` / `BLOCKED` — <selected Build Unit responsibility coverage checked, with canonical local link>

**Verification adequacy:** `PASS` / `BLOCKED` — <claim-to-capability/environment match checked, with canonical local link>

**Execution-context readiness:** `PASS` / `BLOCKED` — <target repository binding and external prerequisites checked, with canonical local link>

**Target-outcome closure:** `PASS` / `BLOCKED` — <actor or consumer, real entrypoint, assembly owner, bootstrap/state/dependencies, minimum observable result, and artifact-appropriate proof owner checked against the declared runtime-profile claims, with canonical local link>

**Shared-producer surface closure:** `PASS` / `BLOCKED` — <known target-version actions, representations, profiles, and compatible consumer set are closed, or bounded non-applicability is proven, with canonical local link>

**Contract-change placement:** `PASS` / `BLOCKED` — <mismatches classified as shared semantic contract, consumer adapter/profile, implementation defect, new target-version capability, or future/out-of-scope, with canonical owner link>

**Fan-out and evolution:** `PASS` / `BLOCKED` — <lockstep, backward-compatible extension, stable core/profile, consumer adapter, independently versioned artifact, or bounded non-applicability selected from canonical facts, with local link>

**Physical compatibility preflight:** `PASS` / `BLOCKED` — <shipped seam, exact minimal command/procedure, expected identity and representation, observed result or selected-output candidate-fixture result, and final proof owner, with local link>

**Affected-slice propagation:** `PASS` / `BLOCKED` — <exact mapped slice slugs and producer-delta, consumer-delta, evidence-only, blocked-pending-receipt, or unaffected dispositions, with Handoff Sequence or canonical mapping link>

### Known Consumer Compatibility Coverage

For each selected shared producer that serves at least two independently delivered first-party consumer Build Units in the bounded target-version cohort, include exactly one row per mapped consumer and interaction. Derive the consumer slice from the Handoff Sequence. This table records coverage; it does not add consumers to the selected implementation scope.

<!-- When no selected producer meets that condition, remove the table and use the evidence-linked None. declaration. -->

**Known consumer coverage:** `None.` — <Handoff Sequence and canonical Build Unit/interface links proving bounded non-applicability>

<!-- Otherwise remove the None. declaration and complete this exact table. -->

| Producer | Consumer | Interaction | Consumer slice | Shipped seam | Probe procedure | Result / proof owner |
| --- | --- | --- | --- | --- | --- | --- |
| `BU-xxx` | `BU-yyy` | `IFACE-xxx.ACT-NNN` | `repo-yyy-consumer-slice` | [consumer binding](../../units/bu-yyy-name.md#material-interaction-bindings) — <actual exported client, route, mount, artifact reader, or command> | `<exact minimal command>` or [procedure owner](<local-path>) | `PASS` / `Planned` — [evidence or final proof owner](<local-path>) |

### Bounded Diagnostic Sweep

Enumerate the complete selected cohort before probing: the selected slice, direct and transitive implementation/build/verification prerequisites, and every known target-version consumer derived above. Run every safe independent probe even when another fails; a failed prerequisite blocks only its dependent probes. Group all observed failures by canonical root cause instead of returning the first blocker.

**Selected cohort:** <complete bounded cohort and Handoff Sequence/canonical mapping links>

**Initial finite inventory:** <selected slice, prerequisites, protected changed interfaces, mechanically known direct consumers, required effectful commands, and directly affected implementation surfaces>

**Direct-dependency additions:** `None.` or <items added through a concrete import, manifest, lock, generator, generated output, fixture, test, verifier, command-call, or exact-identity dependency>

**Independent probes:** `COMPLETE` — <run/pass/fail summary and current local evidence link>

**Dependency-blocked probes:** `None.` or `BLOCKED` — <failed prerequisite and every probe that could not safely run>

**Root-cause groups:** `None.` or <grouped canonical blockers with local links and affected probes/slices>

**Zero-new-blocker pass:** `PASS` / `BLOCKED` — <after repairs, one complete rerun of the same cohort produced zero new blockers; or why that rerun cannot yet pass>

**Frozen-inventory termination:** `PASS` / `BLOCKED` — <the rerun used the same frozen inventory and found no unexplained new item, or name the readiness-process defect>

**Review blockers:** `None.` or <canonical blocker links>

`IMPLEMENTATION_DETAILS_READY` and the allowed slice of `IMPLEMENTATION_DETAILS_PARTIAL` require `PASS` on every axis and `None.` blockers. If any axis cannot be proven, select a non-ready outcome and route the gap to its canonical owner.

## Build Unit Routing Index

Readiness is exactly `READY`, `PARTIAL`, or `BLOCKED`. `READY` requires `None.` blockers and every mapped ticket to be `finished` or explicitly `out-of-scope`; a `decided` ticket still needs canonical reconciliation. It may carry an `LGATE-NNN` whose output is consumed only after implementation/build/test. `PARTIAL` requires the allowed slice to exclude a material unresolved capability, not merely a later-produced value. `BLOCKED` prevents planning for the unit.

### `BUILD_UNIT:BU-xxx`

**Readiness:** `READY` / `PARTIAL` / `BLOCKED`

**Canonical sources:** [BU-xxx Build Unit](../../units/bu-xxx-name.md); linked System Responsibility and contract records.

**Repository Build Design:** [REPO-xxx Repository Build Design](../../repositories/repo-xxx-name/README.md)

**Technical constraints:** `None.` or [CONS-xxx](../../records/constraints/cons-xxx-constraint.md)

**Repository membership disposition:** `Full repository` or `Partial repository — BU-yyy excluded; reason.`

**Implementation selections:** `None.` or [SEL-xxx selection](../../records/selections/sel-xxx-selection.md)

**Verification references:** `None.` or [VA-xxx](../../records/verification/va-xxx-verification-capability.md)

**Dependencies:** `None.` or [`BUILD_UNIT:BU-yyy`](#build_unitbu-yyy) plus any external dependency.

**Mapped tickets:** `None.` or links/references to every applicable `TICKET-NNNN`.

**Blockers:** `None.` or linked canonical blockers.

## Protected Technical Boundaries

Link the Software Design authority, lifecycle, interface, external-domain, and correctness rules the downstream workpack must preserve. Do not create a test policy or restate the full design.

## Cross-Unit Integration And Verification

State the integration points among selected units, planned or verified commands, reusable VA capabilities, and evidence the slice must eventually produce. Planned commands are not execution evidence.

## Exclusions And Local Discretion

Name unresolved capabilities excluded from the allowed slice and link their owners. Separately list reversible choices intentionally left to implementation. Do not decompose work into tasks or execution order here.


<!-- Optional for unrelated unchanged actions. Required inputs, target/changed actions and direct/transitive prerequisites cannot be excluded. Writable-bound exclusions additionally require the Bounded Delta Scope assessment described in references/bounded-delta-scope.md: Target actions and Changed actions in Allowed Delivery Slice, plus the assessment link/integrity below. Retain affected compatibility and shared-code regression in PSEAM obligations. Delete unused examples. -->
<!-- **Bounded delta scope:** [Reviewed action/dependency assessment](./bounded-delta-scope.json) -->
<!-- **Bounded delta scope integrity:** `sha256:<reviewed assessment digest>` -->
### Interaction Scope Exclusions

| Interaction | Canonical scope evidence | Reason |
| --- | --- | --- |
| `IFACE-xxx.ACT-NNN` | Exact canonical action link and writable Build Unit scope link | Approved boundary proving the action is neither consumed nor changed; not a deferred dependency. |
