# Scope And Readiness

## Routing

Treat the Stage 9 handoff as a compact routing index. Treat the linked Build Unit records, Repository Build Designs, Technical Constraints, Implementation Selections, Verification Capabilities, and named Software Design sources as canonical truth.

For every selected `BUILD_UNIT:BU-xxx`, record in `WORKPACK.md`:

- its Build Unit record and relevant source section;
- its `REPO-xxx` build design and code path;
- every applicable `CONS-xxx` and relevant repository `RC-xxx` rule;
- linked `SEL-xxx` and `VA-xxx` records; and
- why the source is needed by this delivery.

For every routed first-party repository, also resolve the Repository Build Design's `Derived artifact` link and include its `agent-guidance.md` in `Canonical Sources Used`. When delivery establishes or refreshes that repository boundary, plan the corresponding repository-root `AGENTS.md` projection without making it a second architecture authority.

Do not read every Build Unit, repository, constraint, System Responsibility, or ticket in the package. The handoff and direct links determine the source closure.

## Scope Closure

Include every direct Build Unit dependency declared by a selected routing entry. Add no other Build Unit unless an explicitly linked interface, flow, or runtime boundary makes it necessary.

Shared applicability does not expand scope: a SEL, VA, CONS, or RC may apply to other Build Units without making those units part of this delivery.

When the handoff declares a full-repository disposition, the selected Build Units collectively cover all members of that repository. When it declares a partial-repository disposition, preserve every named omitted Build Unit and reason as an explicit exclusion. Do not add an omitted member merely because it shares the repository root.

## Readiness

The Stage 9 validator is the structural readiness authority. Planning may proceed only when the current validator, readiness reconciliation, and selected-row sequence check accept the handoff, its `Delivery Slice Realizability Review` passes, and the selected delivery outcome is `IMPLEMENTATION_DETAILS_READY` or a valid narrower `IMPLEMENTATION_DETAILS_PARTIAL` scope whose unresolved items are all outside the requested scope and direct-dependency closure. An unimplemented slice must be `Ready` in the current order group with every required slice `Implemented`; a retained `Implemented` row may be planned only for the existing stable slice's bounded delta or no-impact lineage path. Revalidate this current state again whenever the workpack itself is validated; snapshot equality alone is insufficient. Acceptance is necessary but does not replace the planning pass's bounded semantic check against the exact objective.

The accepted handoff must carry a current handoff revision Snapshot ID. Copy that exact ID into the workpack. If an existing workpack names another ID, it is stale for this handoff revision: replace it from the current handoff rather than patching only the ID or retaining competing active workpacks.

`READY` selected Build Units must have no blockers, a complete Repository Build Design discovery status, a concrete Version-Control And Generated-File Policy with a repository-local verification route, only `finished` or explicitly `out-of-scope` mapped tickets, approved/inherited selections where applicable, closed producers for every input consumed by implementation/build/test, verified exact toolchain compatibility, complete responsibility projection, and a credible environment-capable verification route. A declared `LGATE-NNN` output consumed only during later release, deployment, activation, or operation does not reduce implementation readiness; preserve its later guard in the workpack. A `PARTIAL` or `BLOCKED` selected/direct dependency stops planning unless the handoff itself proves it is excluded from the narrower requested scope.

Apply [Compatibility Preservation](workpack-rules.md#compatibility-preservation), confirm the bounded conclusions remain internally consistent, and plan only the current slice. Do not reopen canonically settled placement or fan-out choices. A producer delta may legitimately block a downstream workpack until the producer receipt exists; do not refresh the dependent workpack early merely to copy a future identity.

Project the accepted handoff's `Required Input Ledger` and `Required Interaction Closure` exactly into the workpack before claiming readiness. Every `INPUT-NNN` needs concrete handling and AC, VE, or later-gate coverage. Every `INT-NNN` and its `IFACE-xxx.ACT-NNN` need consumer-observable VE coverage with the exact upstream evidence classes. Require the three-case verification matrix only for interactions classified `high` risk; ordinary interactions use `None.`. Never treat producer-local tests, mocks, an internal method, a health route, or contract-file existence as consumer-fitness evidence.

Project every `PSEAM-NNN` exactly once with its implementation situation, boundary class, unchanged result, candidate proof and provenance, complete direct change-impact handling, required-command-effect handling, consumer-observable VE route, and protected-boundary disposition. Re-run the bounded semantic comparison against the workpack objective; do not copy `PASS` text. Distinguish selected Build Units that this workpack changes (`Target`) from already-accepted dependencies (`Existing prerequisite`). The Target set must exactly equal the handoff's writable subset; every target must have delivered responsibility coverage, and existing prerequisites remain verification-only.

Preserve the handoff's frozen inventory: selected slice, direct/transitive implementation/build/verification prerequisites, protected changed interfaces, mechanically known direct consumers, required effectful commands, and directly affected implementation surfaces. Add no speculative or indirect item. A newly discovered item is eligible only when a concrete import, manifest, lock, generator, generated output, fixture, test, verifier, command-call, or exact-identity dependency connects it to an existing inventory item. After consolidated repair, rerun the same frozen inventory once; do not silently begin another expanding planning loop.

Treat an `Existing` VA as available proof infrastructure. Treat `Planned — unverified` as an implementation prerequisite, not execution evidence. A workpack may create it before a dependent VE, or be dedicated to creating the capability. A Build Unit with `Verification references: None.` may use a direct workpack-specific VE with `Capability: None.`.

## Escalate

Stop before writing a final workpack when:

- a system contract, authority boundary, lifecycle rule, or correctness claim needs to change: return to Software Design;
- a material repository, package, toolchain, or implementation selection is missing: return to Stage 8;
- a selected Build Unit, dependency, repository discovery, or verification route is not ready: return to Stage 9; or
- requested scope or inclusion of an omitted repository member needs a user choice: ask the user.

Also stop when the workpack objective reveals a contradiction, a missing producer for an input consumed by this workpack, an incompatible exact selection, responsibility omitted from the delivery projection, or claim that the available verification procedure cannot observe. Do not stop merely because a canonical `LGATE-NNN` producer runs later; stop only if the workpack consumes that output now or the gate lacks a producer, condition, verification, or prohibited-premature-action rule. Route the problem by owner even when the Stage 9 handoff previously passed.
