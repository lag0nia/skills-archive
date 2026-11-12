# Workpack Rules

Section-by-section rules for writing `WORKPACK.md` from [the workpack template](../assets/templates/delivery/workpack.md). Read [workpack-planning.md](workpack-planning.md) first for activation, source closure, and lineage, and apply [Planning Completeness And Execution Eligibility](planning-execution-contract.md) to validation mode, planned producers, feasibility, and authorized continuation.

## Contents

- Source Discipline
- Stage 9 Obligation Coverage
- UI/UX Delivery Coverage
- Compatibility Preservation
- Delivery Responsibility Coverage
- Acceptance Criteria
- Verification Evidence
- Execution Environment Preflight
- Repository Boundary
- Delivery Evidence Layout
- Workpack Integrity Review
- Protected Boundaries And Stops
- Definition Of Done And Later Review Evidence
- Short Execution Handoff

## Source Discipline

Keep `WORKPACK.md` limited to task-specific execution context and references. Link canonical Software Design, Build Unit, Repository Build Design, Technical Constraint, SEL, and VA sources in `Canonical Sources Used` instead of copying large sections, decision rationale, or general architecture.

Copy the linked Stage 9 handoff's revision `sha256:` Snapshot ID into `**Software Design snapshot:**`. It pins the exact handoff content; it is not a hash of linked files or a per-file hash list. The validator requires exactly one linked Stage 9 handoff, requires the two IDs to match, and reruns the complete current Stage 9 validation and Build Unit readiness reconciliation; a snapshot-only check cannot establish current readiness. If validation fails or the IDs differ, regenerate the affected content from the current handoff. Change only the ID solely through the validated no-implementation-impact synchronization in [workpack-planning.md](workpack-planning.md#lineage-before-refresh).

`Delivery Design` names only task-specific guidance: target repository paths, package/module areas, local sequencing and integration points, and references to canonical decisions. It never rewrites system behavior, contracts, invariants, technical or repository constraints, or Build Design rationale.

Use `Optional Phases` only when a repository scaffold, dependency order, rollback boundary, or integration sequence genuinely needs them. One repository-sized delivery normally stays one workpack with phases.

## Stage 9 Obligation Coverage

Before writing Acceptance Criteria, project the handoff's complete `Required Input Ledger`, `Required Interaction Closure`, `Physical Realizability Closure`, and `Required Verification Obligation Closure` into `Stage 9 Obligation Coverage`. Include every `INPUT-NNN`, `INT-NNN` with its exact `IFACE-xxx.ACT-NNN`, `PSEAM-NNN`, and selected `INV/SEC-xxx.VO-NNN` exactly once, citing that exact handoff entry. Create no parallel or workpack-local identity.

Each entry has two parts. **Copy** the handoff fields in the table below exactly in meaning and identity, rebasing relative links; the validator compares them. **Add** only the workpack's own `Handling` and `Coverage`.

| Entry | Copy from the handoff | Add in the workpack |
| --- | --- | --- |
| `INPUT-NNN` | For planned or reconciled upstream inputs: `Availability`, canonical `Produced by`/`Producer`, `Producer handoff`, `Expected output`, `Expected contract`, `Consumption point`, `Availability check`, `Availability evidence scope`, `Availability evidence`, `Upstream receipt`. | `Handling`: the concrete acquisition, production, bootstrap, or lifecycle handling. `Coverage`: existing `AC-xxx`, `VE-xxx`, or `LGATE-NNN`. |
| `INT-NNN` | `Required evidence classes`, exactly. For an external-consumer or gated interaction: `Consumer`, `Producer`, `Proof owner`, `Required at`, `Availability`; for a gated one also `Later-lifecycle gate`, `Lifecycle inputs`, `Current-profile inputs`, `Current-profile availability`, `Current-profile verification`. Planned upstream fields as for `INPUT-NNN`. | `Coverage`: at least one consumer-observable `VE-xxx`; a gated interaction maps current-profile VEs **and** its exact `LGATE-NNN`. `High-risk cases`: separate positive, rejection/denial, and failure/recovery VE mappings only for `high` risk; `None.` otherwise. |
| `PSEAM-NNN` | `Handoff result`, `Implementation situation`, `Boundary class`, `Candidate compatibility proof`, `Evidence provenance`, and planned upstream fields. | `Handling`, `Direct change-impact handling` (every affected source, test/fixture, dependency/lock, generator/generated output, verifier, and configuration/evidence item mapped into `Target` writable scope or protected unchanged scope), `Required-command-effect handling`, consumer-observable `Coverage`, and the `PB-xxx` that permits or constrains the delta. |
| `INV/SEC-xxx.VO-NNN` | `Selected assignments` (every selected Build Unit owner), `Repository manifest route` (the repository's tracked `assurance/coverage.yaml` or the canonical external/no-code route), `Required evidence`. | `Coverage`: at least one `VE-xxx`. |

When an upstream family is genuinely empty, keep its evidence-linked `None.` declaration instead of fabricating an obligation; a VO-free slice links the handoff's selected scope.

Proof ownership never changes `Target`/`Existing prerequisite` roles, external audience identity, or publication authority. A gated interaction keeps provider activation proof in its gate: local fixtures never verify it, and every current required input and existing-compatibility preflight stays blocking.

For a genuinely new consumer against an available producer, preserve the prerequisite evidence scope and the `selected-slice consumer` INT from [planning-execution-contract.md](planning-execution-contract.md#new-consumer-against-an-available-producer). Map each prerequisite-scoped INPUT/INT to a final VE with `Evidence scope: consumer-fitness` that runs through the implemented consumer; eligibility does not require that final behavior to exist yet, and producer-only checks never complete it. Existing implemented-consumer compatibility remains a prerequisite.

When the handoff declares `Interaction Scope Exclusions`, list the exact backticked `IFACE-xxx.ACT-NNN` IDs under Delivery Scope → Explicit Exclusions as `**Excluded interactions:**` with a link to the handoff dispositions. Excluded runtime outputs are not implementation or interaction obligations, but their public-contract compatibility and shared-code regression checks stay in the retained PSEAM entries, ACs, and VEs, carrying any Bounded Delta Scope evidence limits; an unchanged excluded action is never a missing producer. Missing prerequisites and future work are never grounds for exclusion. Omit the field when the handoff has no exclusions.

Never infer consumer fitness from producer-local tests, mocks, an internal service method, a public health endpoint, a contract declaration, or file existence: route evidence through the real consumer seam and every evidence class Stage 9 requires.

## UI/UX Delivery Coverage

Apply this only when the handoff's `UI/UX Delivery Review` applies; a slice whose selected Build Units are all UI/UX `not-applicable` needs no UI block, prototype reference, or UI evidence. Add one `### UI/UX Delivery Coverage` block inside `Stage 9 Obligation Coverage`:

- `Handoff source`: link the handoff's `UI/UX Delivery Review`.
- `Approved UI/UX sources`: exactly the handoff's approved sources, including the specification and its selected candidate entrypoint. Never substitute another candidate or a copied screenshot.
- `Application entrypoint`: the built application entrypoint through which both functional and implemented-UI evidence run.
- `Representative viewports and states`: supported viewports and every materially distinct state in the named selected scope, including applicable cancellation, failure/recovery, and accessibility checks. Sampling viewports and screenshots never permits omitting a material state. Impose no pixel threshold or browser vendor the canonical sources do not require.
- `Implemented UI/UX review mode`: `automated`, `agent inspection`, and/or `human acceptance`. Use `human acceptance` only when the handoff review owner or another canonical source explicitly requires a human; a non-automated visual review is agent inspection.
- One table row per journey anchor in the handoff's `Covered prototype states`, mapping it to `AC-xxx`, a functional `VE-xxx`, and a separate implemented-UI `VE-xxx`. One procedure may cover several related journeys; neither kind substitutes for the other.

Confirm the named selected scope includes every approved material journey, route, interaction, and distinct visible state; a missing material candidate state needs design reconciliation, not local design. Functional VEs exercise real outcomes through the application entrypoint against actual system operations and sourced state; mocks and prototype data never establish completed integration. Implemented-UI VEs open the built application, run the equivalent journeys and states at the representative viewports, and compare navigation, layout, hierarchy, typography, palette, density, controls, and interactions with the selected candidate and specification. Their `Evidence to preserve` names representative screenshots, findings, the build or revision reviewed, viewports and states covered, and deviations or limitations. Keep phases dependency-aware: do not mandate frontend-first work, provided the final VEs run against the integrated application.

## Compatibility Preservation

Preserve the handoff's shared-producer surface, contract placement, fan-out/evolution shape, physical shipped-seam preflight, and affected-slice disposition without reopening settled placement or fan-out choices. Mapped VE procedures name the actual exported client, built entrypoint, public route, artifact reader, application mount, or operator command and the exact identity/representation observation; a mock, producer-local helper, internal method, health route, alternate controller, or test-only mount is not the shipped seam. When the producer is selected-slice output, keep the candidate-fixture or current-consumer preflight and schedule the completed built producer-consumer proof after implementation; a protected implemented evolution must already carry focused real-consumer candidate proof.

Also preserve the handoff's frozen inventory: the initial finite inventory, evidence-backed direct-dependency additions, exact Known Consumer Compatibility Coverage, grouped root-cause result, PASS zero-new-blocker rerun, and PASS frozen-inventory termination. Do not add those downstream consumers to this workpack's scope; ensure the slice's own AC/VE mapping provides its owned probe or proof, and record `Diagnostic and known-consumer coverage preservation` in the Workpack Integrity Review with a link to the handoff review.

## Delivery Responsibility Coverage

Classify every selected Build Unit once in Delivery Scope as `Target`, `Existing prerequisite`, or `Planned prerequisite`. The Target set must equal the handoff's writable subset, with at least one target.

Before authoring Acceptance Criteria, enumerate every material responsibility from each selected Build Unit's source-responsibility and module-architecture sections. Give each `RCOV-xxx` one canonical local link and one disposition:

- `Deliver`: realized by this workpack and mapped to one or more `AC-xxx`;
- `Existing prerequisite`: an actually existing capability, mapped to availability verification;
- `Planned prerequisite`: a defined planned upstream output with explicit INPUT/INT producer contracts, mapped to pre-use acquisition and compatibility VEs; or
- `Excluded by Stage 9`: cites the handoff's canonical exclusion.

Every selected Build Unit needs a coverage entry, every target at least one `Deliver` entry, and every AC must trace to a delivered responsibility. Both prerequisite roles are verification-only, never `Deliver`. Stop when the objective would silently contract a selected Build Unit or when a stated role contradicts its RCOV dispositions. Never summarize a Build Unit in a way that drops a constructor, public seam, artifact, environment, proof obligation, directly affected file, dependency/lock change, generated output, or verifier.

Project every handoff `LGATE-NNN` into `Later-Lifecycle Gates` with its canonical producer, consumption stage, exact condition, verification procedure, and prohibited premature action or claim. A gated value is not a current missing input, Stage 9 exclusion, AC, VE, or Definition of Done item unless this workpack actually consumes it. A workpack may complete while a later gate stays open; the guarded release, deployment, activation, or operation action stays prohibited.

## Acceptance Criteria

Give every `AC-xxx` a canonical source reference, preconditions where needed, one observable result, and its required `VE-xxx`. Implementation activity is not an outcome: "add validation" is not a criterion; "the builder rejects amounts below the approved minimum before signing" is.

## Verification Evidence

Give every `VE-xxx` its related `AC-xxx`, the relevant `VA-xxx` capability or `Capability: None.` for workpack-local proof, the exact command, fixture, simulator, or manual procedure, and the evidence execution must preserve.

For an exact runtime or toolchain requirement, record the canonical version and verification command. Add an activation or bootstrap command only when canonical sources require a nonstandard route or ordinary repository/environment conventions cannot activate the version; never require a version-manager file merely to duplicate a complete pin.

An `Existing` VA is available proof infrastructure. A `Planned — unverified` VA is an implementation prerequisite: create it inside the approved writable ceiling before any dependent VE, or consume it from a named planned upstream producer, and never cite it as evidence. `Planned — unverified until scaffold exists` lets a greenfield workpack be written but never satisfies Definition of Done. A dedicated scaffold or verification-enablement workpack may prove only the capability it creates, never final product behavior.

Execution must actually run every required automated check and agent inspection and record its observations. A procedure that canonically requires human acceptance stays incomplete until a human confirms it; a check that is merely not automated needs no human. Never delete, skip, disable, rewrite, weaken, or otherwise manipulate existing tests, acceptance checks, fixtures, thresholds, golden outputs, or verification procedures to obtain a pass; when evidence conflicts with approved behavior, stop and escalate.

## Execution Environment Preflight

Add an `Execution Environment Preflight` bounded to the resources the workpack's procedures consume: disk capacity, exact toolchains, local immutable artifacts/images, services/ports, browsers/devices, and external access, each with an exact check and safe requirement or a concrete `Not applicable` reason. Require execution to finish every safe independent check, skip only transitively blocked ones, group failures by root cause, and report them together before source edits. It is not a workstation audit and never demands final end-to-end evidence before implementation.

## Repository Boundary

For every selected first-party repository, include its Repository Build Design's linked `agent-guidance.md` in `Canonical Sources Used` and read its `Version-Control And Generated-File Policy`. When the workpack scaffolds, refreshes, or completes that repository boundary:

- map the policy's must-track, must-ignore, generated-output, and secret/template boundary to RCOV, AC, and VE coverage, require the physical ignore configuration to realize it, and run its repository-local hygiene check as verification; never add broad ignore patterns that could hide canonical fixtures, evidence, manifests, workflows, lockfiles, or source, and never invent or broaden ignore rules locally; and
- map materializing or reconciling the repository-root `AGENTS.md` to RCOV, AC, and VE coverage. `AGENTS.md` is the implementation projection; `agent-guidance.md` remains the design-owned source and the repository file never becomes competing architecture.

## Delivery Evidence Layout

Add one `Delivery Evidence Contract` section following [delivery-evidence-contract.md](delivery-evidence-contract.md). Derive its execution directory from the full Snapshot ID by replacing only `sha256:` with `sha256-`. Plan one `SUMMARY.md` that records every AC and VE exactly once. Do not plan a repository-global VE sequence or one Markdown file per VE. The optional `artifacts/` directory holds only material machine output needed for later review. Plan publication and consumer-install receipts in their typed directories only when the slice produces them; neither substitutes for a shipped-seam compatibility VE. Planning names these destinations but never writes target-repository evidence, and historical evidence stays byte-preserved unless the user separately authorizes a migration.

## Workpack Integrity Review

After drafting, re-read the complete workpack independently from the Stage 9 handoff and canonical source closure, and record `PASS` or `BLOCKED` for each axis in the template's `Workpack Integrity Review`: canonical-source consistency; required-input, temporal-consumption, producer, and later-gate closure; exact input, interaction, physical-realizability, and VO projection; UI/UX delivery coverage when applicable; responsibility coverage; reciprocal AC-to-VE mapping; phase and capability sequencing; proof-capability adequacy in the claimed environment; and the snapshot-scoped delivery-evidence destination. Always record execution eligibility (`WAITING` is allowed only under planning validation; see [planning-execution-contract.md](planning-execution-contract.md#validation-and-review)), Stage 9 compatibility closure, diagnostic and known-consumer coverage preservation, and affected-slice isolation. Inside the same review, recheck the essential capabilities and the writable ceiling, including adapters and command effects. These stay inside this one review, never a second artifact.

When phases exist, every AC and VE appears in at least one phase exit criterion, every referenced ID exists, and a planned VA is created within permitted scope or supplied by its upstream producer before a dependent VE. An unphased workpack states why no ordering boundary is needed. Never declare `PASS` by copying the Stage 9 receipt or by passing the validator; resolve the concrete source and sequence questions first.

## Protected Boundaries And Stops

Give at least one `PB-xxx` pointing to the Software Design authority, invariant, interface, lifecycle, correctness, security, or compatibility boundary execution must preserve, each with an existing canonical local link, the exact rule, and the limit on workpack-local change. A linked `CONS-xxx` or repository `RC-xxx` is normally a PB source; keep its exact must/must-not meaning.

Require execution to stop and escalate on: a material decision canonical sources do not resolve; a protected-boundary conflict; an undeclared dependency or scope expansion; a required check that still cannot run or pass after applicable safe, scope-preserving remediation, or whose required approval is denied or unavailable, or whose remediation would cross a protected boundary; or evidence that conflicts with approved behavior.

## Definition Of Done And Later Review Evidence

Completion means every applicable `AC-xxx` is satisfied, every required automated verification and agent inspection actually passed, required human acceptance is confirmed by a human, protected boundaries are preserved, and the snapshot-scoped execution summary is validated. List the evidence to preserve: the execution summary, AC outcomes, material command output or traces, UI screenshots and findings when applicable, human confirmations, changed files, receipts, and deviations or escalations. Require no separate VE Markdown file or review workflow.

## Short Execution Handoff

Keep the handoff to the workpack path; the target implementation repository or workspace; the execution skill, `software-design-execution`; the allowed scope; the evidence obligation, including the snapshot-scoped `SUMMARY.md` and evidence validation; and protected boundaries with the stop/escalation rule, completion being defined only by `Definition of Done`.

Do not repeat the full workpack. Write it for any agent host: it runs only after separate explicit execution authorization, through the host's supported native goal or continuation mechanism. Planning-only reports and follow-ups end at planning. Name no host-specific command, API, launcher, or automatic skill activation. The execution skill supplies implementation, verification, evidence, and acceptance instructions; the host supplies continuation; neither is a scheduler or loop.

The template section carrying this handoff keeps the stable validator heading `## /goal Handoff`. That heading is a legacy schema identifier, not a requirement to use a `/goal` command.
