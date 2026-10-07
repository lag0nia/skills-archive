# Workpack Rules

## Stable Slice Path

Write the current workpack to `delivery-workpacks/<delivery-slice>/WORKPACK.md`, where `<delivery-slice>` exactly matches the selected Stage 9 handoff filename without `.md`. Do not add a sequence number, date, Snapshot ID, or revision suffix. The stable path identifies what is being delivered; `Software Design snapshot` identifies which handoff revision the workpack plans; version control preserves prior workpack revisions.

Different delivery slices coexist as sibling folders. Update a slice's `WORKPACK.md` in place when its selected handoff Snapshot ID changes and recoverable history exists. Never remove or replace another slice's folder merely because a new workpack is created.

## Source Discipline

Keep `WORKPACK.md` limited to task-specific execution context and references. Link canonical Software Design, Build Unit, Repository Build Design, Technical Constraint, SEL, and VA sources instead of copying large sections, decision rationale, or general architecture.

Copy the linked Stage 9 handoff's revision `sha256:` Snapshot ID into `**Software Design snapshot:**`. This pins the exact handoff content; it is not a hash of its linked files or a per-file hash list. The workpack validator must find exactly one linked Stage 9 handoff, require the two IDs to match, and rerun the active Software Design skill's complete current Stage 9 validation and Build Unit readiness reconciliation. Matching copied strings or a snapshot-only check cannot establish current readiness. If validation fails or the IDs differ, regenerate the affected workpack content from the current handoff. Do not make a stale workpack appear current by changing only its ID except for the validated no-implementation-impact synchronization defined below.

`Delivery Design` may name target repository paths, modules, implementation order, local integration points, and selected decisions. It must not rewrite system behavior, contracts, invariants, technical constraints, repository constraints, or Build Design rationale.

When the selected delivery creates, refreshes, or completes a first-party repository boundary, preserve the linked Repository Build Design's `Version-Control And Generated-File Policy`. Map its must-track/must-ignore and secret/template boundary to delivery responsibility coverage, require the physical ignore configuration to realize it, and run the named repository-local hygiene check as verification evidence. Do not add broad ignore patterns that can hide canonical fixtures, evidence, manifests, workflows, lockfiles, or source.

Include every routed Repository Build Design's linked `agent-guidance.md` in `Canonical Sources Used`. When delivery creates, refreshes, or completes the repository boundary, map materialization or reconciliation of the repository-root `AGENTS.md` to RCOV, AC, and VE coverage. The derived guidance remains authoritative for this projection; the repository file must not become competing architecture.

## Post-Implementation Delta Classification

Before changing the stable workpack for a slice with prior completion evidence, resolve the stable workpack, its exact snapshot, the implementation report, and the physical repository changes since that receipt. Require the existing workpack snapshot and report `Implemented snapshot` to match before classifying the complete change.

Classify the complete post-implementation change:

- `No implementation impact`: handoff or blueprint documentation, publication, tag creation, registry/repository permissions, exact-version resolution, authorized installation, or evidence-only record updates. This class is valid only when no implementation-owned tracked file changed and no canonical requirement calls for one. Append any required immutable version/source/integrity/resolution/access receipt to the typed receipt path or consuming handoff. If the refreshed handoff has a new Snapshot ID, copy it into `Software Design snapshot`, run the current workpack validator, and synchronize the evidence README and implementation report to the same ID while retaining the prior execution summary as the physical implementation basis. Do not create or execute a no-op workpack, fabricate a snapshot-scoped summary or VE record, or leave the three IDs mismatched.
- `Implementation delta`: any change to source, package manifests, lockfiles, build/runtime/release configuration, workflows, tests, fixtures, or verification scripts, or any canonical change that requires one. Package repository metadata is implementation configuration. Treat a mixed release-and-implementation change as an implementation delta.

For an implementation delta, update the stable `WORKPACK.md` in place to the current handoff snapshot and plan only the bounded delta plus the regression needed to preserve existing responsibilities. In `Readiness Decision`, cite the valid starting implementation report, its implemented snapshot, and its implementation commit when recorded; state the exact changed implementation-owned requirements and the truthful chronology when work was discovered or performed before planning. The new implementation report may name the current snapshot only after this workpack is successfully executed. If current evidence already claims an unexecuted snapshot, stop for lineage repair rather than building on the false claim.

## Delivery Responsibility Coverage

Before authoring Acceptance Criteria, enumerate every material responsibility from each selected Build Unit's source-responsibility and module-architecture sections. Give each `RCOV-xxx` one canonical local link and classify it as:

- `Deliver`: the workpack realizes it and maps it to one or more `AC-xxx`;
- `Existing prerequisite`: the workpack consumes it and maps it to one or more `VE-xxx` procedures that prove availability; or
- `Excluded by Stage 9`: the handoff explicitly excludes it and the coverage entry cites that canonical exclusion.

Classify every selected Build Unit once in Delivery Scope as `Target` or `Existing prerequisite`, and require at least one target. Every selected Build Unit needs at least one coverage entry, every material responsibility needs a disposition, and every AC must trace back to at least one delivered responsibility. Every target needs at least one `Deliver` entry. An existing prerequisite is verification-only: it needs `Existing prerequisite` coverage and cannot carry a `Deliver` entry. Stop if the workpack objective would silently contract a selected Build Unit or if its stated target disagrees with its RCOV dispositions.

## Acceptance Criteria

Give every `AC-xxx`:

- a canonical source reference;
- preconditions, where needed;
- one observable result; and
- the required `VE-xxx` evidence.

Do not use implementation activity as an acceptance criterion. “Add validation” is not an outcome; “the builder rejects amounts below the approved minimum before signing” is.

## Stage 9 Obligation Coverage

For an external-consumer or gated interaction, also preserve its `Consumer`, `Producer`, `Proof owner`, `Required at` and `Availability` fields exactly in meaning and identity (rebase relative links). For a gated interaction preserve `Later-lifecycle gate`, `Lifecycle inputs`, `Current-profile inputs`, `Current-profile availability` and `Current-profile verification` as well. Map Coverage to current-profile `VE-xxx` evidence **and** the exact `LGATE-NNN`; provider activation proof stays in the gate, not a claim that local fixtures verified it. Keep all current required inputs and existing-compatibility preflight blocking. Proof ownership does not change Target/Existing prerequisite roles, external audience identity or publication authority. Reject omitted/substituted fields or gate coverage; do not duplicate INT, INPUT or LGATE identities.


Project the handoff's complete `Required Input Ledger`, `Required Interaction Closure`, `Physical Realizability Closure`, and `Required Verification Obligation Closure` without creating new canonical identities:

- include every `INPUT-NNN` exactly once, cite that exact handoff entry, state its concrete acquisition, production, bootstrap, or lifecycle handling, and map it to existing AC, VE, or LGATE coverage;
- include every `INT-NNN` and its exact `IFACE-xxx.ACT-NNN` exactly once, cite that exact handoff entry, preserve the exact upstream required evidence classes, and map it to at least one consumer-observable `VE-xxx`;
- for a `high`-risk interaction, map positive, rejection/denial, and failure/recovery cases separately to existing VE records; for ordinary risk, record `None.`; and
- when either upstream section declares `None.`, preserve an evidence-linked `None.` declaration rather than fabricating an obligation.
- include every `PSEAM-NNN` exactly once, cite that exact handoff entry, preserve its exact implementation situation, boundary class, result, candidate proof, and evidence provenance, state its workpack handling, map its complete direct change-impact and required-command effects into Target/PB coverage, map it to consumer-observable `VE-xxx`, and cite the `PB-xxx` boundary that permits or constrains the delta;
- include every selected `INV/SEC-xxx.VO-NNN` exactly once, preserve its selected Build Unit owners, route first-party evidence through the repository's tracked `assurance/coverage.yaml` or preserve the canonical external/no-code evidence route, preserve the required evidence, and map it to at least one `VE-xxx`; and
- when no selected structured VO exists, retain an evidence-linked `None.` declaration to the handoff selected scope.

Do not infer consumer fitness from producer-local tests, mocks, an internal service method, a public health endpoint, a contract declaration, or file existence. The workpack must route evidence that exercises the real consumer seam and every evidence class required by Stage 9.

## UI/UX Delivery Coverage

Apply this only when the handoff's `UI/UX Delivery Review` applies. A slice whose selected Build Units are all UI/UX `not-applicable` needs no UI/UX block, prototype reference, or UI evidence.

Add one `### UI/UX Delivery Coverage` block inside `Stage 9 Obligation Coverage`:

- `Handoff source`: link the handoff's `UI/UX Delivery Review`.
- `Approved UI/UX sources`: link exactly the handoff's approved sources, including the specification and its selected candidate entrypoint. Never substitute another candidate or a copied screenshot.
- `Application entrypoint`: the intended built application entrypoint through which both functional and implemented-UI evidence run.
- `Representative viewports and states`: the supported viewports and materially distinct states to review, including applicable cancellation, failure/recovery, and accessibility checks. Choose a representative set, not an exhaustive screenshot matrix, and do not impose a pixel-difference threshold or browser vendor the canonical sources do not require.
- `Implemented UI/UX review mode`: `automated`, `agent inspection`, and/or `human acceptance`. Use `human acceptance` only when the handoff review owner or another canonical source explicitly requires a human; a visual review that is not automated is agent inspection, not a reason to require human confirmation.
- One compact table with a row for every journey anchor in the handoff's `Covered prototype states`, mapping it to `AC-xxx`, functional `VE-xxx`, and implemented-UI `VE-xxx`. One criterion or procedure may cover several related journeys. Keep the functional and implemented-UI procedures distinct; neither substitutes for the other.

Functional VEs exercise real outcomes through the application entrypoint against actual system operations and sourced state. Mocks, stubs, and prototype data may support component development and bounded tests but cannot establish completed real-system integration. Implemented-UI VEs open the built application, execute the equivalent journeys and states at the representative viewports, and compare navigation, layout, hierarchy, typography, palette, density, controls, and interactions with the selected candidate and specification. Their `Evidence to preserve` names representative screenshots, concise interaction and review findings, the build or revision reviewed, the viewports and states covered, and deviations or limitations.

Keep sequencing dependency-aware. Do not mandate frontend-first development; phases may build interface and system pieces in the order their dependencies support, provided the final VEs run against the integrated application.

## Compatibility Preservation

Preserve its shared-producer surface, contract placement, fan-out/evolution shape, physical shipped-seam preflight, and affected-slice disposition. The mapped VE procedures must name the actual exported client, built entrypoint, public route, artifact reader, application mount, or operator command and the exact identity/representation observation. A mock, producer-local helper, internal method, health route, alternate controller, or test-only mount is not the shipped seam. If the producer is selected-slice output, retain the candidate-fixture or current-consumer preflight and schedule the completed built producer-consumer proof after implementation.

Also preserve the handoff's complete initial finite inventory, evidence-backed direct-dependency additions, exact Known Consumer Compatibility Coverage, grouped root-cause result, PASS zero-new-blocker rerun, and PASS frozen-inventory termination. Do not add those downstream consumers to this workpack's implementation scope. Instead, ensure the current slice's AC/VE mapping provides its owned probe or proof, and record `Diagnostic and known-consumer coverage preservation` in the existing Workpack Integrity Review with a link to the handoff review. This is one review field, not another artifact.

## Later-Lifecycle Gate Projection

Copy every Stage 9 `LGATE-NNN` into `Later-Lifecycle Gates`. Preserve its canonical producer, consumption stage, exact condition, verification procedure, and prohibited premature action or claim. Do not classify the gated value as a current missing input, Stage 9 exclusion, acceptance criterion, verification requirement, or Definition of Done item unless the current workpack actually consumes it. A workpack may complete while a later gate remains unsatisfied; its release, deployment, activation, or operation action remains prohibited.

## Verification Evidence

Give every `VE-xxx` its related `AC-xxx`, relevant `VA-xxx` capability when applicable, exact command/fixture/simulator/manual procedure, and the evidence execution must preserve.

For an exact runtime or toolchain requirement, include the canonical version and its verification command. Include an activation or bootstrap command only when canonical sources require a nonstandard route or ordinary documented repository/environment conventions cannot activate that version. Do not make a repository-specific version-manager file mandatory merely to duplicate an otherwise complete version pin.

Apply the mapped compatibility procedures from `Compatibility Preservation` above; do not duplicate or weaken them in a VE summary.

If the selected VA is `Planned — unverified`, sequence its creation before the dependent VE or make verification enablement the workpack objective. Do not cite a planned capability as evidence. Use `Capability: None.` when the verification is workpack-local and needs no reusable VA.

Add an `Execution Environment Preflight` bounded to the resources the workpack actually consumes. Cover disk capacity, exact toolchains, local immutable artifacts/images, services/ports, browsers/devices, and external access with exact checks or a concrete `Not applicable` reason. Require execution to complete every safe independent check, skip only transitively blocked checks, group root causes, and report the consolidated result before source edits. Do not turn this into a general workstation audit or require final end-to-end evidence before implementation.

`Planned — unverified until scaffold exists` permits a greenfield workpack to be written. It does not satisfy final Definition of Done. Execution must actually run every required automated check and agent inspection and record its observations. A procedure that canonically requires human acceptance remains incomplete until a human confirms it; do not require human confirmation merely because a check is not automated.

The sole exception is a dedicated scaffold or verification-enablement workpack. It may prove that it created the verification capability, but it must not claim final product behavior is certified.

Never delete, skip, disable, rewrite, weaken, or otherwise manipulate existing tests, acceptance checks, fixtures, thresholds, golden outputs, or verification procedures merely to obtain a pass. If evidence conflicts with approved behavior, stop and escalate rather than altering the evidence opportunistically.

## Delivery Evidence Layout

Read [delivery-evidence.md](delivery-evidence.md) and add one `Delivery Evidence Contract` section to every implementation workpack. Derive its execution directory from the full workpack Snapshot ID by replacing only `sha256:` with `sha256-`.

Plan one `SUMMARY.md` that records every workpack AC and VE exactly once. Do not plan a repository-global VE sequence or one Markdown file per VE. The optional `artifacts/` directory is only for material machine output needed for later review; a concise command result may stay in `SUMMARY.md`.

Plan publication and consumer-install receipts under their distinct typed directories. Use filesystem-safe artifact names. Publication proves artifact identity and integrity, installation proves consumer resolution and access, and neither substitutes for a shipped-seam compatibility VE.

Delivery Planning must not write target-repository evidence. Historical evidence remains byte-preserved and linked unless the user separately authorizes a migration.

## Workpack Integrity Review

After drafting the complete workpack, re-read it independently from the Stage 9 handoff and canonical source closure. Record `PASS` or `BLOCKED` conclusions for:

- canonical-source consistency;
- required-input, temporal-consumption, producer, and later-lifecycle-gate closure;
- exact Stage 9 input, interaction, and physical-realizability projection;
- UI/UX delivery coverage when the handoff's `UI/UX Delivery Review` applies;
- responsibility coverage;
- reciprocal AC-to-VE mapping;
- phase and verification-capability sequencing; and
- proof-capability adequacy in the claimed environment.
- snapshot-scoped delivery-evidence destination and receipt semantics.

Always record execution eligibility, Stage 9 compatibility-closure preservation, diagnostic and known-consumer coverage preservation, and affected-slice isolation. These remain bounded conclusions inside the existing integrity review, not a second review artifact.

When phases exist, every AC and VE must appear in at least one phase exit criterion, every referenced ID must exist, and a planned VA must be created before a dependent VE runs. For an unphased workpack, state why no ordering boundary is required. Do not declare the review `PASS` by copying the Stage 9 receipt or merely satisfying the validator; resolve the concrete source and sequence questions first.

## Protected Boundaries And Stops

Use at least one `PB-xxx` entry to point to the Software Design authority, invariant, interface, lifecycle, correctness, security, or compatibility boundaries that execution must preserve. Every entry needs an existing canonical local link, the exact rule to preserve, and the limit on workpack-local change. A linked `CONS-xxx` or repository `RC-xxx` is normally a PB source; retain its exact must/must-not meaning rather than paraphrasing it into a weaker local rule.

Require execution to stop and escalate when it finds:

- a material decision not resolved by canonical sources;
- a protected-boundary conflict;
- an undeclared dependency or scope expansion;
- a required check that still cannot run or pass after applicable safe, scope-preserving remediation, required approval is denied or unavailable, or remediation would conflict with a protected boundary; or
- evidence that conflicts with approved behavior.

## Definition Of Done And Later Review Evidence

Define completion as all applicable `AC-xxx` being satisfied, all required automated verification and agent inspection actually passing, required human acceptance confirmed by a human, protected boundaries preserved, and the snapshot-scoped execution summary validated. The workpack specifies required evidence; execution records all AC/VE execution results in that one summary and preserves optional material machine output separately.

List the evidence to preserve for later review: the execution summary, acceptance-criterion outcomes, material command output or test/simulator/fixture traces, UI screenshots and review findings when applicable, human acceptance confirmations, changed files, receipts, and deviations or escalations. Do not require a separate VE Markdown file or create another review workflow.

Keep at most one active `WORKPACK.md` at the stable path for a delivery slice. Update a superseded unexecuted workpack in place when recoverable history already exists. An executed workpack may be updated after its implemented Snapshot ID and required evidence remain recoverable; do not create another archive artifact solely to retain it.

## Short Execution Handoff

Keep the handoff to:

- the workpack path;
- the target implementation repository or workspace;
- the execution skill, `delivery-workpack-execution`;
- the allowed scope;
- the evidence obligation, including the snapshot-scoped `SUMMARY.md` and evidence validation; and
- protected boundaries and the stop/escalation rule, with completion defined only by `Definition of Done`.

Do not repeat the full workpack. Write the handoff for any agent host: tell the caller to run it through the host environment's supported native goal or continuation mechanism, or to start that loop and select the execution skill manually. Do not name a host-specific command, API, launcher, or automatic skill activation. The execution skill supplies implementation, verification, evidence, and acceptance instructions; the host supplies continuation. Neither Delivery Planning nor the execution skill is a scheduler or loop.

The workpack section that carries this handoff keeps the stable validator heading `## /goal Handoff`. That heading is a legacy schema identifier, not a requirement to use a `/goal` command.

When the historical workpack/receipt association cannot be established, the only exception to requiring a matching prior receipt is [explicitly authorized legacy-lineage recovery](legacy-lineage-recovery.md). Ordinary current readiness and all planning gates still apply. Preserve executed-basis identities through documentation-only refreshes; never relabel prior execution as acceptance of changed requirements.

### Interaction scope exclusions

When the selected Stage 9 handoff declares `Interaction Scope Exclusions`, preserve its exact action identities under Delivery Scope → Explicit Exclusions with `**Excluded interactions:**` followed by backticked `IFACE-xxx.ACT-NNN` IDs and a link to that handoff's dispositions. Do not project excluded runtime outputs as implementation or required-interaction obligations. Preserve any affected public-contract compatibility and shared-code regression checks in their retained PSEAM obligations, ACs and verification steps: excluding runtime output does not exclude the safety of changing shared code. For a writable-bound exclusion, carry the upstream Bounded Delta Scope assessment and its evidence limits through those PSEAM references; do not reinterpret unchanged actions as missing producers. The upstream Software Design validator checks the reviewed target/changed actions, dependency closure, pinned evidence, retained checks and required inputs; Delivery Planning checks exact projection. Missing prerequisites and future work are not grounds for exclusion. If the handoff has no interaction exclusions, omit this optional field.
