# Workpack Planning

Read this reference when the user asks to turn a settled Stage 9 handoff into a workpack. A workpack is one concise, traceable, verifiable `WORKPACK.md` per delivery slice that the separate execution skill later implements. Read [workpack-rules.md](workpack-rules.md) for each section, [delivery-evidence-contract.md](delivery-evidence-contract.md) for the evidence destination, and [planning-execution-contract.md](planning-execution-contract.md) for planning validation, planned upstream outputs, feasibility, and authorization. Planning writes only the workpack: it never edits the implementation repository, manages Git state, or starts execution.

## Contents

- Location
- Activate Or Stop
- Lineage Before Refresh
- Resolve Sources And Scope
- Escalate
- Draft And Validate
- Report And Hand Off

## Location

Write the sole output to `delivery-workpacks/<delivery-slice>/WORKPACK.md` beside the Software Design package: `design/delivery-workpacks/` in the default layout ([package-layout.md](package-layout.md#workpack-location)). `<delivery-slice>` is the selected handoff filename without `.md`. The path is the slice's stable identity, so add no sequence number, date, Snapshot ID, or revision suffix; `**Software Design snapshot:**` records which handoff revision the workpack plans, and version control preserves earlier revisions. Slices coexist as sibling folders; never remove or replace another slice's folder.

Keep at most one active workpack per slice. When an unexecuted workpack names an older snapshot, update it in place when version control or other recoverable history preserves it; otherwise ask before overwriting. An executed workpack may be updated once its implemented Snapshot ID and required evidence stay recoverable; create no archive artifact just to retain it.

Keep this lane separate from any runner-backed `workpacks/` system. Create no manifest, review artifact, runner, orchestration layer, Git-state record, commit pin, per-file hash, or second freshness mechanism. The user manages the repository, branch, commits, and existing changes before execution.

## Activate Or Stop

Activate only when the user asks to turn a technically ready, bounded Stage 9 delivery into a workpack. Require the Software Design package and delivery objective; explicitly selected current handoffs under `build/workflow/handoffs/` (other current handoffs may coexist and are never selected implicitly); and enough repository context to identify target code paths and existing verification. If Build Design exists but no Stage 9 handoff does, stop and return to Stage 9.

Before consuming a handoff, validate it:

```sh
node <software-design-skill-directory>/scripts/validate-stage9-handoff.mjs \
  --validation-mode planning \
  --root <software-design-package> \
  --handoff build/workflow/handoffs/<delivery-slice>.md
```

It runs the Build Unit readiness reconciliation, the selected-row sequence check, and Delivery Readiness validation, and reports every independent failure; any failure forbids planning. Planning mode accepts a complete plan in a future `Waiting` group that awaits explicitly contracted planned upstream outputs; only execution requires a current runnable group and actual compatible producer outputs. Report `NON_BLOCKING_PACKAGE_MAINTENANCE` notices separately without refreshing unrelated records.

Plan only when the handoff's `Delivery Slice Realizability Review` passes and its outcome is `IMPLEMENTATION_DETAILS_READY`, or a valid narrower `IMPLEMENTATION_DETAILS_PARTIAL` whose unresolved items all lie outside the requested scope and its direct-dependency closure. A `PARTIAL` or `BLOCKED` selected unit or direct dependency stops planning unless the handoff itself proves it excluded from the requested scope. A `LGATE-NNN` output consumed only at a later lifecycle stage does not reduce implementation readiness. Never plan around a blocked selected Build Unit, direct dependency, repository discovery, required input, exact toolchain incompatibility, responsibility gap, or inadequate verification route; resolve it upstream. Validator acceptance is necessary but never replaces the bounded semantic check below.

Copy the handoff's `**Snapshot ID:**` exactly into `**Software Design snapshot:**`; never recalculate or shorten it. A workpack naming another ID is stale for this revision: regenerate its affected scope, criteria, evidence, and boundaries from the current handoff rather than patching the ID or keeping competing active workpacks.

## Lineage Before Refresh

When a workpack or implementation report already exists for the slice, audit lineage and classify the complete change under [Delivery Readiness And Handoff](build-design-and-delivery-readiness.md#delivery-readiness-and-handoff) before editing the stable workpack. Resolve the report's actual recoverable implemented workpack and exact execution basis; a known newer unexecuted plan may legitimately differ. If the historical association cannot be established, use only the explicitly authorized [legacy-lineage recovery](legacy-lineage-recovery.md); never invent a match.

- **No implementation impact:** planning preserves the prior report. Only for an explicitly requested synchronization of implemented documentation, copy the handoff's new Snapshot ID into the stable workpack, rerun the current workpack validator, and synchronize the evidence README and implementation report to the same ID, retaining the prior execution summary as the physical implementation basis. Append any required immutable receipt to the typed receipt path or consuming handoff. Never create or execute a no-op workpack, fabricate a snapshot-scoped summary or VE record, or leave the three IDs mismatched.
- **Implementation delta:** update the stable workpack in place to the current handoff snapshot and plan only the bounded delta plus the regression that preserves existing responsibilities. In `Readiness Decision`, cite the valid starting implementation report, its implemented snapshot, and its implementation commit when recorded; state the exact changed implementation-owned requirements and the truthful chronology when work was discovered or performed before planning. The report may name the current snapshot only after this workpack executes successfully. If current evidence already claims an unexecuted snapshot, stop for lineage repair.

## Resolve Sources And Scope

Read in this order, and enumerate the complete selected closure before drafting:

```text
Stage 9 handoff
→ selected Build Unit routing entries
→ direct Build Unit dependencies
→ linked Repository Build Designs and their agent-guidance.md
→ applicable CONS-xxx Technical Constraints and RC-xxx repository constraints
→ linked SEL-xxx selections and VA-xxx capabilities
→ only the linked Software Design Domains, System Responsibilities, flows, contracts, and correctness sources
```

The handoff is a compact routing index; the linked records are canonical truth. For every selected `BUILD_UNIT:BU-xxx`, cite in `Canonical Sources Used` its Build Unit record and relevant section, its Repository Build Design and code path, every applicable `CONS-xxx` and relevant `RC-xxx`, linked `SEL-xxx` and `VA-xxx` records, and why this delivery needs each. Read nothing else: the handoff and its direct links determine the closure.

Tickets are workflow history, not workpack context. Read one only when the handoff names it as a current blocker or a source inconsistency needs diagnosis; consume settled outcomes through the linked Build Unit, Repository Build Design, CONS, SEL, and VA records.

The handoff selects exact `BUILD_UNIT:BU-xxx` scopes. A full-repository disposition selects every member of the linked `REPO-xxx` without making the repository a scope type; a partial-repository disposition is a hard boundary that keeps every named omitted unit and its reason as an exclusion. Expand scope only through direct Build Unit dependencies or an explicitly linked interface, flow, or runtime boundary. Shared applicability of a SEL, VA, CONS, or RC never adds a Build Unit.

Treat the Stage 9 realizability receipt as bounded prior evidence, not permission to stop reasoning. Repeat the selected-slice contradiction, prerequisite-producer, temporal-consumption, responsibility, and proof-capability checks against the exact workpack objective, and re-run the PSEAM comparison rather than copying its `PASS`. If one check fails, draft nothing but continue every safe independent check, skipping only those that depend on the failed prerequisite; group failures by canonical root cause and affected probes or slices into one consolidated blocker report. Keep the handoff's frozen inventory: a newly discovered item qualifies only through a concrete import, manifest, lock, generator, generated output, fixture, test, verifier, command-call, or exact-identity dependency on an existing item. After upstream repair, rerun the same cohort once and require zero new blockers before drafting.

A producer delta may block downstream execution while downstream planning proceeds against supported expected outputs. Bind actual identities and receipts only after verification; never copy a fabricated future identity. External consumers stay external, and proof ownership grants no actor role, external authority, or writable scope.

## Escalate

Stop before writing a final workpack and route by owner, even when the handoff previously passed:

- a system contract, authority boundary, lifecycle rule, or correctness claim must change: Software Design;
- a material repository, package, toolchain, or implementation selection is missing: Stage 8;
- a selected Build Unit, dependency contract, repository discovery, or verification route has an unresolved planning blocker: Stage 9; or
- the requested scope, or inclusion of an omitted repository member, needs a user choice: the user.

Also stop when the objective reveals a contradiction, a missing producer for an input this workpack consumes, an incompatible exact selection, a responsibility omitted from the projection, or a claim the available verification cannot observe. A canonical `LGATE-NNN` producer that runs later is no reason to stop unless this workpack consumes its output now or the gate lacks a producer, condition, verification, or prohibited-premature-action rule.

## Draft And Validate

Copy [the workpack template](../assets/templates/delivery/workpack.md) into the slice folder and keep it concise and delivery-specific; it is a routing and execution artifact, not a replacement for Software Design or Build Design. Fill it by [workpack-rules.md](workpack-rules.md) in this order: project the handoff's `Required Input Ledger`, `Required Interaction Closure`, `Physical Realizability Closure`, and `Required Verification Obligation Closure` (every `INPUT-NNN`, `INT-NNN` with its `IFACE-xxx.ACT-NNN`, `PSEAM-NNN`, and `INV/SEC-xxx.VO-NNN`, with positive, rejection/denial, and failure/recovery mappings only for `high` risk) before Acceptance Criteria; then roles and responsibility coverage, later-lifecycle gates, the environment preflight, Delivery Design, verification evidence, and the exact snapshot-scoped `Delivery Evidence Contract`.

After the `Workpack Integrity Review`, run the validator and resolve every failure before calling the workpack ready:

```sh
node <software-design-skill-directory>/scripts/validate-workpack.mjs \
  --validation-mode planning \
  --workpack <delivery-workpack-directory>/WORKPACK.md
```

It requires the workpack snapshot to equal the linked handoff's Snapshot ID and reruns the complete current Stage 9 readiness validation and reconciliation in-process. It also checks exact INPUT, INT, PSEAM, VO, and LGATE projection; the handoff's approved UI sources and covered journeys with separate functional and implemented-UI evidence; and the snapshot-derived evidence destination. UI checks establish structural coverage, not visual quality. A mismatch, a stale or no-longer-ready handoff, an incomplete projection, or an ambiguous evidence destination means the workpack is not ready; re-read the current handoff and regenerate the affected content rather than editing only the copied ID.

The workpack is done when this validator passes at the handoff's Snapshot ID.

## Report And Hand Off

After every requested eligible plan passes its integrity review and validator, report planning completion, execution eligibility and exact waits, that no application code changed, decisions made, and the next authorized action. Give the [short execution handoff](workpack-rules.md#short-execution-handoff). Execution needs separate authorization: offer it at most, and a planning-only follow-up requests only planning. Once the user authorizes execution, the host's supported native goal or continuation mechanism may carry it; design no launcher, runner, scheduler, or execution-review workflow here.
