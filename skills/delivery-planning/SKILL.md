---
name: delivery-planning
description: Turn one ready Stage 9 Software Design handoff into a concise, traceable, and verifiable WORKPACK.md for later execution under the host environment's native goal or continuation loop with the delivery-workpack-execution skill. Use after Build Design and Delivery Readiness when a selected Build Unit or full/partial repository delivery must be planned with acceptance criteria, verification evidence, protected boundaries, and stop conditions, without implementing code or managing Git state.
---

# Delivery Planning

Create one execution-ready workpack from one ready Stage 9 handoff. Keep this lane separate from the runner-backed `workpacks/` system.

Write the sole output to:

```text
delivery-workpacks/<delivery-slice>/WORKPACK.md
```

Use the selected Stage 9 handoff filename without `.md` as `<delivery-slice>`. The path is a stable slice identity, so do not add a global sequence number, date, Snapshot ID, or revision suffix. The handoff/workpack Snapshot ID records the selected Software Design revision, and version control preserves earlier workpack revisions.

Do not create a manifest, review artifact, runner, orchestration layer, Git-state record, commit pin, per-file hash, or second freshness mechanism. Copy the Stage 9 handoff's one revision Snapshot ID into the workpack. The user manages repository, branch, commits, and existing changes before execution.

## Activate Or Stop

Activate only when the user asks to turn a technically ready, bounded Stage 9 delivery into an implementation workpack.

Require:

- the Software Design package and delivery objective;
- one explicitly selected current Stage 9 handoff under `build/workflow/handoffs/`; and
- enough repository context to identify target code paths and existing verification.

Run the Build Unit readiness reconciliation, selected-row sequence eligibility check, and Software Design validator through this skill's wrapper before consuming the handoff. Supply the exact handoff path and the directory of the active `software-design` skill; the wrapper verifies that the selected file is a current Stage 9 handoff, reconciles its selected units with their ticket and unresolved-statement state, requires either a current `Ready` row with finished prerequisites or a retained `Implemented` row eligible for bounded lineage planning, then delegates all remaining handoff semantics to that upstream validator. Other current slice handoffs may coexist and are not candidates for implicit selection. The accepted handoff must include a passing `Delivery Slice Realizability Review`; do not replace it with a second handoff parser here.

```sh
node <delivery-planning-skill-directory>/scripts/validate-stage9-handoff.mjs \
  --software-design-skill <active-software-design-skill-directory> \
  --root <software-design-package> \
  --handoff build/workflow/handoffs/<delivery-slice>.md
```

If Build Design exists but no Stage 9 handoff exists, stop and return to Stage 9. The wrapper collects independent read-only diagnostic failures before returning; failure still forbids planning. Report `NON_BLOCKING_PACKAGE_MAINTENANCE` notices separately without refreshing unrelated records. If the validator reports a blocker, resolve it upstream; never plan around a blocked selected Build Unit, direct dependency, repository discovery, required input, exact toolchain incompatibility, responsibility gap, or inadequate verification route.

Read the handoff's `**Snapshot ID:**` after validation and copy that exact value into `**Software Design snapshot:**` in the workpack. Do not recalculate or shorten it. Keep at most one active workpack at the stable path for the same delivery slice: when a previous unexecuted workpack names an older snapshot, update that `WORKPACK.md` in place when version control or another recoverable history already preserves it; otherwise ask before overwriting.

When prior execution evidence exists, perform the post-implementation delta classification in [workpack-rules.md](references/workpack-rules.md) before editing the stable workpack. First require the existing workpack snapshot and report `Implemented snapshot` to match. If a genuine historical association cannot be established, use only the explicitly authorized [legacy-lineage recovery](references/legacy-lineage-recovery.md) route; never invent a match. If the refreshed handoff has no implementation impact, copy its exact Snapshot ID into the stable workpack, rerun the current validator, and synchronize the evidence README and report to the same ID without creating or executing a no-op workpack, fabricating a snapshot-scoped execution summary, or adding another VE artifact; retain the prior execution summary as the physical implementation basis. An implementation-owned file or canonical implementation requirement requires a bounded delta workpack at the current handoff ID; use the valid prior implementation only as its starting receipt and do not update the report snapshot until successful execution.

## Resolve Sources And Scope

Read in this order. First enumerate the complete selected closure; do not start drafting while that inventory is incomplete:

```text
Stage 9 handoff
→ selected Build Unit routing entries
→ direct Build Unit dependencies
→ linked Repository Build Designs
→ applicable CONS-xxx Technical Constraints and RC-xxx repository constraints
→ linked SEL-xxx selections and VA-xxx capabilities
→ only the linked Software Design Domains, System Responsibilities, flows, contracts, and correctness sources
```

Treat the Stage 9 realizability receipt as bounded prior evidence, not permission to stop reasoning. Repeat the selected-slice contradiction, prerequisite-producer, temporal-consumption, responsibility, and proof-capability checks against the exact workpack objective. If one check fails, do not draft, but continue every safe independent check in the already enumerated cohort; skip only checks that depend on the failed prerequisite. Group all failures by canonical root cause and affected probes/slices so one planning pass returns one consolidated blocker report. After upstream repairs, rerun the complete cohort once and require zero new blockers before drafting.

Preserve the handoff's shared-producer, placement, fan-out/evolution, shipped-seam, and affected-slice conclusions according to [workpack-rules.md](references/workpack-rules.md). Preserve every `LGATE-NNN` later-lifecycle gate without converting its later-produced value into a current-slice exclusion or Definition of Done requirement. External consumers remain external; selected proof ownership grants no actor role, external authority or writable scope. Preserve each gated interaction’s separate current-profile inputs/proof and real-provider gate using the existing INPUT/INT/LGATE identities and the projection rules below.

For every selected first-party repository, read its `Version-Control And Generated-File Policy`. Treat must-track paths, must-ignore categories, generated-output disposition, secret/template rule, and repository-local verification as part of the repository construction contract. If the workpack scaffolds, refreshes, or delivers the full repository boundary, map that policy to delivery responsibility coverage, an acceptance criterion, and verification evidence; never let planning invent or broaden ignore rules locally.

Also read the Repository Build Design's linked `agent-guidance.md`. Include that derived artifact in `Canonical Sources Used`. When the workpack creates, refreshes, or completes the repository boundary, map materializing or reconciling its repository-root `AGENTS.md` to delivery responsibility coverage, acceptance criteria, and verification evidence. `AGENTS.md` is the implementation projection; `agent-guidance.md` remains the design-owned source.

The handoff selects exact `BUILD_UNIT:BU-xxx` scopes. A full-repository disposition means every member of the linked `REPO-xxx` is selected; it does not turn the repository into a new scope type. A partial-repository disposition is a hard boundary: plan only the selected units and honor every named exclusion.

Use only direct Build Unit dependencies or an explicitly required interface, flow, or runtime boundary to expand scope. Shared applicability of a SEL, VA, CONS, or RC never adds another Build Unit by itself.

Tickets are workflow/history, not normal workpack context. Read one only when the handoff names it as a current blocker or a source inconsistency needs diagnosis. Consume completed durable outcomes through the linked Build Unit, Repository Build Design, CONS, SEL, and VA records.

An `Existing` VA is available proof infrastructure. A `Planned — unverified` VA may support planning, but the workpack must create it before any dependent `VE-xxx` runs or make verification enablement its bounded objective. Never represent a planned VA as executed evidence. A Build Unit with no VA may use a direct workpack-specific `VE-xxx` with `Capability: None.`

Read [scope-and-readiness.md](references/scope-and-readiness.md) for scope closure, repository dispositions, and escalation rules.

## Write The Workpack

Copy [WORKPACK.md](assets/templates/WORKPACK.md) into the new delivery-workpack folder. Keep it concise and delivery-specific.

`WORKPACK.md` is a routing and execution artifact, not a replacement for Software Design or Build Design. Cite canonical paths, IDs, anchors, and sections in `Canonical Sources Used`; do not copy large source sections or duplicate their rationale.

Use `Optional Phases` only when a repository scaffold, dependency order, rollback boundary, or integration sequence genuinely needs them. One repository-sized delivery normally remains one workpack with phases, not several workpacks.

Before writing Acceptance Criteria, project the handoff's complete `Required Input Ledger`, `Required Interaction Closure`, `Physical Realizability Closure`, and `Required Verification Obligation Closure` into `Stage 9 Obligation Coverage`. Reuse every canonical `INPUT-NNN`, `INT-NNN`, `PSEAM-NNN`, `IFACE-xxx.ACT-NNN`, and `INV/SEC-xxx.VO-NNN` identity exactly once; do not invent a parallel ID family. For each input, name its concrete acquisition, production, bootstrap, or lifecycle handling and map it to existing `AC-xxx`, `VE-xxx`, or `LGATE-NNN` coverage. For each interaction, preserve the handoff's exact required evidence classes, map it to one or more `VE-xxx`, and, only when risk is `high`, provide separate positive, rejection/denial, and failure/recovery verification mappings. For each physical class, preserve its implementation situation, boundary class, candidate proof and provenance, exact upstream result, direct change-impact closure, and required-command effects; map every required change into a `Target` Build Unit, every protected unchanged surface to a `PB-xxx`, and final proof to consumer-observable VE evidence. For each structured Verification Obligation, preserve its selected Build Unit owners, repository `assurance/coverage.yaml` or external/no-code evidence route, required evidence, and at least one mapped `VE-xxx`. Apply the compatibility-preservation rules in [workpack-rules.md](references/workpack-rules.md); genuinely new selected-output final proof stays scheduled after implementation, while a protected implemented evolution must already carry focused real-consumer candidate proof. Preserve an evidence-linked `None.` declaration when an upstream obligation family is genuinely empty.

When the handoff's `UI/UX Delivery Review` applies, also add the `UI/UX Delivery Coverage` block defined in [workpack-rules.md](references/workpack-rules.md#uiux-delivery-coverage). Preserve the handoff's exact approved UI sources and selected candidate, and map every covered journey anchor to acceptance plus separate functional and implemented-UI evidence run against the built application at representative viewports and states. Distinguish automated checks, agent inspection, and explicitly required human acceptance. A non-UI slice needs no UI block or UI artifacts.

Classify each selected Build Unit once as `Target` or `Existing prerequisite`; the Target set must equal the handoff's writable subset and at least one must be a target. Then enumerate every material selected-unit responsibility in `Delivery Responsibility Coverage`. Every target needs at least one `Deliver` responsibility, while an existing prerequisite is verification-only and may not be changed or mislabeled as delivered. Map each delivered responsibility to one or more `AC-xxx`, each existing prerequisite to verification evidence, and each valid omission to the canonical Stage 9 exclusion. Project each handoff `LGATE-NNN` into `Later-Lifecycle Gates` with its canonical producer, consumption stage, condition, verification, and prohibited premature action; do not map a later gate to an AC/VE unless this workpack actually consumes and must satisfy it. Do not summarize a Build Unit in a way that drops one of its constructors, public seams, artifacts, environments, proof obligations, directly affected files, dependency/lock changes, generated outputs, or verifiers.

Before finalizing the workpack, add a bounded `Execution Environment Preflight` for only the resources its procedures consume: disk capacity, exact toolchains, local artifacts/images, services/ports, browsers/devices, and external access. State a check and safe requirement or a concrete `Not applicable` reason for every category. Require execution to finish all safe independent preflight checks and consolidate failures before source edits. This catches environment blockers together without turning unrelated machine state into readiness scope or requiring final end-to-end evidence before implementation.

In `Delivery Design`, provide only task-specific implementation guidance: target repository paths, package/module areas, local sequencing, and references to canonical decisions. Do not restate Software Design behavior, contracts, constraints, or Build Design rationale.

Use [workpack-rules.md](references/workpack-rules.md) for post-implementation delta classification, acceptance criteria, verification evidence, protected boundaries, definition of done, stop conditions, and the short execution handoff.

Read [delivery-evidence.md](references/delivery-evidence.md) whenever drafting or refreshing an implementation workpack. Add the exact snapshot-scoped `Delivery Evidence Contract` to the workpack. Plan one `SUMMARY.md` for all AC/VE results, optional material machine output under `artifacts/`, and typed publication or consumer-install receipts only when the slice actually produces them. Delivery Planning names these repository-relative destinations but does not modify the implementation repository.

For an exact runtime or toolchain requirement, record the canonical version and verification command. Add an explicit activation or bootstrap command only when canonical sources require a nonstandard route or ordinary documented repository/environment conventions cannot activate the required version. Do not require a repository-specific version-manager file merely to duplicate an otherwise complete version pin.

After drafting, perform the `Workpack Integrity Review`, then run the deterministic validator. Resolve every failure before calling the workpack ready:

```sh
node <delivery-planning-skill-directory>/scripts/validate-workpack.mjs \
  --workpack <delivery-workpack-directory>/WORKPACK.md \
  --software-design-skill <active-software-design-skill-directory>
```

The validator requires the workpack snapshot to equal the linked Stage 9 handoff Snapshot ID and reruns the active Software Design skill's complete current Stage 9 readiness validation and reconciliation through this skill's wrapper. It also requires exact input, interaction, and structured Verification Obligation projection, the handoff's approved UI sources and covered journeys with separate functional and implemented-UI evidence when UI/UX Delivery Review applies, and the exact snapshot-derived delivery-evidence destination. UI checks establish structural coverage only; they do not assess visual quality. A mismatch, stale or no-longer-ready handoff, incomplete projection, or ambiguous evidence destination means the workpack is not ready; do not edit only the copied ID. Re-read the current handoff and regenerate the workpack's affected scope, criteria, evidence, and boundaries.

## Handoff

After the workpack passes the integrity review and validator, produce the short execution handoff defined in [workpack-rules.md](references/workpack-rules.md#short-execution-handoff): the `WORKPACK.md` path, target repository or workspace, `delivery-workpack-execution` skill, allowed scope, evidence obligation, protected boundaries, and stop/escalation rule. Direct the caller to run it through the host environment's supported native goal or continuation mechanism, or to start that loop and select the execution skill manually. Do not name a host-specific command or API, and do not design a launcher, runner, scheduler, or later execution-review workflow here.

For a documentation-only snapshot synchronization, retain the original summary's `Executed snapshot`, `Executed workpack content`, start time, and observations unchanged. Keep those same executed-basis identities and the old summary link in the current report while updating its current `Implemented snapshot`; explain `Refresh classification: No implementation impact` with the reviewed reason. This is a reconciled current documentation identity, not a claim that the newer workpack was executed. Preserve the original exact workpack in recoverable history. Missing historical identities must remain unknown, never backfilled from current content. The execution evidence reference describes mechanical verification of an ID-only refresh; broader prose-only reconciliation requires review without fabricating execution.
