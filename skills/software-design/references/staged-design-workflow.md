# Staged Software Design Workflow

Use this workflow to create, repair, or continue a Software Design package from an approved software brief. Read [package-layout.md](package-layout.md), [system-model-format.md](system-model-format.md), and [checkpoint-workflow.md](checkpoint-workflow.md) first.

## Contents

- Output Package
- Stage Order
- Ticket Workflow Lane
- Stage Guidance
- Writing Contract
- Final Handoff

## Output Package

Use the complete canonical hierarchy and conditional-creation rules in [package-layout.md](package-layout.md). This workflow adds only the following stage-specific rules:

- create only justified contract-category folders;
- keep compact TD parents in `build/workflow/technical-decisions.yaml` when genuine consequential choices exist;
- create `build/README.md` with the first workflow artifact, decided Technical Constraint, or Stage 8 construction artifact;
- create decided `CONS-xxx` records when their rules are established, including before Stage 8;
- create ticket workflow without implying that Stage 8 Build Design exists;
- create Build Units and repositories only during Stage 8;
- establish the conditional UI/UX specification and reviewed candidate coverage during Stage 7 for human-facing surfaces, allowing earlier bounded sketches; and
- create current delivery-slice handoffs only during Stage 9.

`README.md` is the package index with generic Blueprint Terms only. It should link the canonical system-model entry, lifecycle and flow destinations, and existing invariant/security/scope collections when present, justified diagrams, and the concrete `build/` entry point when workflow or Build Design exists. Route project-specific vocabulary, parameter ownership, security terminology, and scope claims to their exact canonical owners rather than keeping them in the root README. Technical Decisions are read through their human-first GitHub issues; the local YAML remains compact agent-first truth. Do not duplicate canonical system truth into parallel summary files.

## Stage Order

Use this order unless the user explicitly changes it:

1. **Stage 0 — Package confirmation:** confirm source brief, destination, scope, and checkpoint expectations. Write nothing.
2. **Stage 1 — Architecture foundation:** create package navigation, `system-model/architecture.md`, the System Domain map, and any already-justified TD or scope-contract records.
3. **Stage 2 — System Domains:** create one canonical Domain record at a time.
4. **Stage 3 — System Responsibilities:** create the `SR-xxx` records for one approved Domain at a time.
5. **Stage 4 — Behavior:** create atomic `FLOW-xxx` records plus canonical `lifecycle.yaml`.
6. **Stage 5 — Contracts:** create justified `IFACE`, `STATE`, `INV`, `SEC`, and `SCOPE` records, define structured VOs for all invariant/security records, and reconcile all relationships.
7. **Stage 6 — Optional state visuals:** create a state machine only when one persisted object's established transitions need visual review.
8. **Stage 7 — Completion and inventory:** reconcile the system model, complete the whole-package implementation-detail ticket inventory, and complete applicable prototype prerequisites, exploration, and journey reconciliation.
9. **Stage 8 — Optional Build Design and Runtime Architecture:** consume Stage 7 UI/UX requirements and reviewed candidate coverage for human-facing surfaces; map System Responsibilities many-to-many to Build Units, assign structured VOs, group Build Units into repositories, and generate the Runtime Architecture only after Runtime Diagram Readiness passes.
10. **Stage 9 — Optional Delivery Readiness:** close selected VO assignments and other prerequisites, reconcile reviewed UI/UX for selected human-facing slices, assess the slice, and create one compact handoff only when ready.

Stage numbers are writing order. `SR-xxx`, `FLOW-xxx`, contract, Build Unit, and repository identifiers are stable references and never imply implementation order.

## Ticket Workflow Lane

Ticket tracking is a workflow lane, not a replacement for the numbered stages. It may begin for a System Responsibility after its Stage 3 record is approved and may continue later without activating Stage 8.

Place ordinary ticket files at:

```text
build/workflow/tickets/<domain-slug>/sr-xxx/sr-xxx-tickets.yaml
```

Use `build/workflow/tickets/cross-domain-tickets.yaml` only when no single System Responsibility truthfully owns the question. A broad question is not automatically cross-domain; select the owner whose implementation cannot finish without the answer.

Read [implementation-detail-tickets.md](implementation-detail-tickets.md) before creating or changing tickets. Read [ticket-inventory-mode.md](ticket-inventory-mode.md) for prospective inventory or decision-history backfill. Ticket creation does not create Build Units, repositories, selections, verification capabilities, or handoffs.

## Stage Guidance

### 0. Package Confirmation

Confirm:

- the reviewed software brief and canonical destination;
- new package creation or continuation of the existing canonical package;
- target system scope and important exclusions;
- the artifact-appropriate target outcome: intended actor or consumer, minimum observable result, and expected entrypoint;
- for each human-facing surface, intended users, their main tasks, likely prior knowledge, what must be understandable without blueprint context, whether the target is a product, demo, or an explicit combination, and basic UI/UX expectations such as device context, accessibility, information density, and critical trust or recovery needs;
- every named runtime profile and whether the target-version claim is build compatibility, verification only, runnable use, deployment, or activated operation;
- the proposed System Domain and `SR-xxx` identity scheme;
- optional Stage 8/9 intent, without activating it; and
- the stage-by-stage approval rhythm.

When source material proposes “components,” preserve their logical meaning as System Responsibilities unless a boundary is actually an independently buildable Build Unit. If the source boundary is ambiguous, stop and resolve it before Stage 1.

Do not require the user to invent a demo for every artifact. For an application or service with a human or operator surface, normally propose at least one non-production runnable outcome unless the approved scope explicitly excludes it. For a CLI, library, SDK, pipeline, or infrastructure target, propose the corresponding invocation, real-consumer, input-to-output, or isolated-provision acceptance outcome. A profile name alone does not state what support means. Handle user-observable scope changes with existing product tickets and user approval inside Software Design; reconcile approved answers into canonical behavior owners. Route implementation/runtime choices to later tickets and Build Design. Do not create a separate maintained outcome manifest: preserve the approved contract through the applicable flows, scope boundaries, tickets, Build Units, and Stage 9 handoff.

Reuse approved upstream UI/UX decisions and link their owner rather than repeating the rationale. Do not require a prototype or a separate UX questionnaire at Stage 0. Ask only material unresolved questions; recommend defaults for reversible details.

### 1. Architecture Foundation

Create `system-model/architecture.md` from [the architecture template](../assets/templates/system-model/architecture.md). It owns only system purpose/binding, authority and source-of-truth boundaries, the complete Domain index, and cross-domain boundaries. The root README routes readers to global contract collections.

Define System Domains as coherent logical concerns. A Domain is not a repository, deployment unit, build phase, team, or DDD bounded context unless the approved design explicitly makes it one. Give each Domain one stable lowercase slug and one `DOMAIN-<slug>` identity.

Assign stable System Responsibility IDs during this stage so later stages can reference them. New IDs use exactly three digits (`SR-001`). Order them for stable comprehension, not delivery sequence. Every responsibility has exactly one owning Domain and one canonical future record; it may participate in other Domains only through explicit cross-domain contracts.

Do not put lifecycle sequence, responsibility-local detail, Build Unit topology, repository construction, decision workflow, a parameter-owner registry, a security-change procedure, or ticket/readiness evidence in architecture. Create or update compact TD records for consequential coherent choices regardless of current answer state, and create `SCOPE-xxx` only for explicit deferred or excluded technical capability. Do not create a parallel decision dashboard in the package.

For Stages 1–7, identify material interface questions and distinguish exploration prerequisites from questions a prototype can help answer. Establish the intended task, affected canonical owners, known authority and safety constraints, and explicit hypotheses before the bounded exploration that needs them. Material questions about responsibility boundaries, routes, persisted state, feedback, recovery, or cross-surface handoffs may remain open for prototype exploration; materiality alone does not make them pre-prototype prerequisites. Preserve approved answers in the existing canonical product or Software Design owner, and resolve material contradictions before claiming reconciliation. Resolve reversible presentation details in the Stage 7 UI/UX pass or earlier bounded sketches.

### 2. System Domains

Create one `system-model/domains/<domain-slug>/domain.md` at a time from [the Domain template](../assets/templates/system-model/domain.md).

Each record declares:

- the coherent concern and positive boundary;
- authority, artifact, or state families owned at Domain level;
- exclusions that prevent boundary collapse;
- the complete owned `SR-xxx` list;
- material external responsibilities; and
- exact cross-domain contracts when already known.

Do not turn the Domain record into an essay, flow walkthrough, responsibility duplication, or repository proposal. Keep relationship metadata reciprocal with architecture and later responsibility records.

### 3. System Responsibilities

Create one file per approved responsibility under its owning Domain from [the System Responsibility template](../assets/templates/system-model/system-responsibility.md):

```text
system-model/domains/<domain-slug>/responsibilities/sr-001-responsibility-name.md
```

A System Responsibility owns one stable logical behavior, authority, state, or artifact boundary. It is not assumed to be a package, service, repository, deployment, workpack, or Build Unit. Define its positive ownership, explicit non-ownership, inputs and outputs, relevant state/artifacts, failure and recovery semantics, and local invariant obligations. For material inputs and outputs, make the consumer need explicit: initial acquisition or observation, refresh/restart behavior, absence/rejection meaning, and recovery path. This is still responsibility truth, not a Build Unit or API design.

Declare `depends_on` and `participates_in` relationships in frontmatter. Before Stage 8, `realized_by` is `None.`. After Build Design exists, it lists every Build Unit that realizes part of the responsibility, and each Build Unit reciprocally lists `source_responsibilities`.

If a responsibility must be split, merged, moved, or renamed, treat that as a material boundary change and checkpoint it. Never copy one responsibility into several Domains.

### 4. Behavior

Create one atomic `FLOW-xxx` record per approved branch or mechanism under `system-model/behavior/flows/` from [the flow template](../assets/templates/system-model/flow.md). A flow declares participating System Responsibilities, referenced contracts, precise entry and exit predicates, ordered transitions, failure/reroute behavior, outcomes, and invariants.

Use the exact transition table from [system-model-format.md](system-model-format.md) when more than one mechanism-critical transition exists. Every transition owner is an `SR-xxx` or explicitly external actor/system. Preserve distinct credentials, stateful objects, external fact owners, manual versus automatic handoffs, and `must not imply` boundaries.

Create `system-model/behavior/lifecycle.yaml` from [the lifecycle template](../assets/templates/system-model/lifecycle.yaml). It is the canonical graph connecting flow records into stages and terminal outcomes. It must use JSON-compatible YAML values, resolve every reference, and give every stage a path to a terminal outcome. Do not put narrative, implementation order, Build Unit dependencies, or readiness in it.

When an approved target outcome spans several responsibilities, ensure the flow set contains the actual actor- or consumer-facing path from its entry predicate to its observable result. Do not create a synthetic “demo flow” when existing canonical flows already cover the journey, and do not let a verification scenario become the canonical user or operator flow.

Run the structure validator after lifecycle reconciliation. If flow reconciliation reveals an earlier responsibility or authority error, stop and repair the earliest affected stage.

### 5. Atomic Contracts

Represent broad technical rules through only the atomic contracts justified by the design:

- `IFACE-xxx` owns one producer/consumer or external interface boundary;
- `STATE-xxx` owns one persisted or authority-relevant state model;
- `INV-xxx` owns one cross-responsibility or cross-flow invariant;
- `SEC-xxx` owns one threat, trust, protected-authority, and control boundary; and
- `SCOPE-xxx` owns one explicit deferred or excluded technical capability.

Use the templates under [assets/templates/system-model/contracts](../assets/templates/system-model/contracts/). Do not create empty category folders. Split a concern when it has its own identity, consumers, change boundary, or verification intent; do not fragment one concern merely to create more files.

For `INV-xxx` and `SEC-xxx` records, read [Assurance Traceability](assurance-traceability.md). Keep stable VOs inside the owning record; give security threats and controls stable local identities and close every threat through a control and every control through at least one VO. A VO states an observable claim and required evidence category, not a test filename. Missing structured obligations fail validation. Consumer repairs require their own authorized scope.

Move every durable shared rule to exactly one contract owner and link it from responsibilities and flows. Preserve interface payload identity, state authority/finality distinctions, invariant violation meaning, security misuse cases, and prohibited implications. For every material `IFACE-xxx` boundary, identify its independently invoked or observed `ACT-NNN` interactions, including consumer reads, observations, refresh, acknowledgement, and recovery where applicable. Do not treat the existence of a write/command surface as proof that a consumer read or projection surface exists. Keep the list at the public or cross-responsibility boundary; do not enumerate private helper calls. Do not copy TD questions into scope contracts or use a contract as a decision register.

After contract writes, reconcile root contract-category links, Domain cross-contracts, responsibility and flow metadata, lifecycle invariants, and local links. Run the structure validator.

### 6. Optional State Visuals

Read [diagram-selection.md](diagram-selection.md) before proposing a visual. Create a state machine only when it makes one persisted object's established transition rules easier to review. Create only the supported package visuals and never use a speculative architecture view. Human-readable Technical Decisions belong in GitHub rather than a second Canvas.

Validate a justified state-machine Canvas with the Canvas layout script. A geometry pass does not replace source review.

### 7. Completion And Whole-Package Ticket Inventory

For human-facing scopes, this stage includes prototype prerequisites, exploration, reconciliation, and completion under [UI/UX Design](ui-ux-design.md). Preserve initial ticket visibility and the independent inventory below; do not wait for a prototype to expose tickets. Earlier bounded sketches are allowed. Establish canonical sources and representative journey prerequisites, explore explicit hypotheses, and reconcile approved findings at coherent journey boundaries through only affected canonical owners and dependencies. Complete agreed reviewed coverage with no unresolved material contradictions or usability blockers before claiming Stage 7 UI completion. Non-UI scopes require no prototype.

Reconcile the canonical system model and run every applicable decision, structure, ticket, and diagram check. Then complete:

1. **7A — Ticket/TD relationship validation:** every ticket declares one valid `parent_decision` or explicit `null`; every TD's child set is derived from those links.
2. **7B — Independent discovery:** review every System Responsibility without starting from existing tickets or TDs and ask what material choices would still prevent implementation, verification, or the approved target outcome.
3. **7C — Handoff, outcome/profile, reverse challenge, and decision-cluster audit:** inspect each direct boundary and each material `IFACE-xxx.ACT-NNN` from producer and consumer sides; trace every required target outcome and runtime-profile claim through entrypoint, composition/bootstrap, state/reset, external prerequisites or substitutes, and proof; reconcile overlaps; and propose meaningful TD parents for ticket groups that collectively form one consequential choice.
4. **7D — Snapshot zero-delta:** preserve the initial whole-scope discovery and challenge, then verify repairs through the impact-based follow-up in [ticket-inventory-mode.md](ticket-inventory-mode.md#fixed-point-completion). Trace connected effects across the system; repeat the full review only when concrete evidence shows systemic omissions or unreliable coverage, including a destabilized responsibility/handoff map that invalidates prior coverage. Produce the per-responsibility coverage receipt, retained coverage, affected review scope, and snapshot boundary; return partial when material findings remain undispositioned, reporting the exact blocker when missing information or an unresolved decision prevents progress instead of repeating unchanged checks.

Do not declare Stage 7 complete when only 7A is complete or the 7B–7D receipt is absent. Return `TICKET_INVENTORY_PARTIAL`. Report TD-linked and standalone ticket counts separately, plus every approved, rejected, or still-pending decision-cluster candidate.

The main Software Design is complete when architecture, Domains, System Responsibilities, flows, lifecycle, contracts, justified visuals, Technical Decision records and ticket relationships, and ticket inventory are coherent. Remaining `todo`, `deferred`, or `out-of-scope` tickets affect later readiness, not inventory snapshot completion; material contradictions in required UI journeys still prevent Stage 7 UI completion. Do not activate Stage 8 or create a handoff automatically.

### 8. Optional Build Design

Enter only when the user wants concrete buildable codebase or repository design. Read [build-design-and-delivery-readiness.md](build-design-and-delivery-readiness.md).

When human-facing surfaces are in scope, consume the reconciled Stage 7 specification and selected candidate under [ui-ux-design.md](ui-ux-design.md). Link the actual candidate entrypoint and reviewed journeys before finalizing affected Build Units. Relevant pending prototype changes block selected-scope UI readiness; unrelated journeys need not be revalidated. An explicit prototype-change request authorizes affected updates in the same pass. Non-UI scopes require no prototype.

Create justified `BU-xxx` records and Repository Build Designs. Map System Responsibilities to Build Units many-to-many through reciprocal `realized_by` and `source_responsibilities` fields, and derive cross-unit coverage from those records rather than creating a topology summary. Group one or more Build Units into repositories; do not infer that a Domain or responsibility is independently buildable.

For every required target outcome and runtime profile, assign ownership of the real entrypoint, composition, startup/shutdown, dependencies, configuration, bootstrap or seed behavior, persistence/resume/reset, and acceptance proof. Reuse an existing Build Unit when these are part of its coherent artifact. Create a dedicated composition, developer-runtime, or demo Build Unit only when that concern is itself independently buildable and testable; never manufacture one merely because a demo is desirable. A repository-root command or verification harness without an owning Build Unit does not close the outcome.

When structured VOs exist, read [Assurance Traceability](assurance-traceability.md), assign every VO to at least one Build Unit, and give every unit an explicit assignment or concrete `None.` disposition. For each first-party repository with one or more assigned VOs, plan exactly one tracked repository-root `assurance/coverage.yaml` covering all member units. Do not create a manifest per Build Unit or place implementation evidence in the blueprint.

For every material cross-Build-Unit or external `IFACE-xxx.ACT-NNN`, add a `Material Interaction Bindings` entry to the affected Build Units. Bind the logical interaction to the concrete route, export, event, artifact path, command, or manual handoff; name producer/consumer roles, the canonical schema/type/format source, access audience, conformance procedure, and `Planned` or `Verified` state. Keep internal helpers out. A unit with no material cross-unit or external interaction may use a concrete `None.` declaration.

Every first-party Build Unit states one repository and code path; external/no-code units state an explicit repository disposition. Repository-specific construction belongs in that repository's `README.md`; derived future-agent instructions belong in its optional `agent-guidance.md`; portable technical must/must-not rules belong in CONS records. Unresolved tickets block readiness, not truthful mapping.

When at least two Build Units exist, create or refresh `diagrams/build-unit-dependency-map.canvas`, link it from the root README and `build/README.md`, and validate it. Reconcile reciprocal unit mappings, repository membership, constraints, tickets, and the dependency map.

After Build Design, generate `diagrams/runtime-architecture.html` only when Runtime Diagram Readiness in [diagram-selection.md](diagram-selection.md) passes: diagram-relevant Build Units, runtime bindings, and tickets or Technical Decisions must be resolved enough to make the shown runtime truthful. Build a temporary model, run `validate-runtime-architecture.mjs`, render the one self-contained HTML file, link it from the root README as `Runtime Architecture`, and inspect it at Fit view and reading zoom. Do not retain the temporary model, create an SVG duplicate, or create preview artifacts.

### 9. Optional Delivery Readiness And Handoff

Enter only when the user selects exact Build Units for delivery. Confirm every material ticket for those units is `decided` or `finished`, no current-scope `deferred` ticket remains, every `out-of-scope` item is excluded by the declared slice, and every selected repository's discovery is complete. Apply approved answers without asking again and create only justified SEL/VA records.

For each selected human-facing slice, confirm the reviewed prototype and UI/UX specification remain consistent with canonical requirements and the handoff. The handoff must separately route functional acceptance and implemented UI/UX review. Do not treat prototype approval, implementation review, structural validation, or actual user testing as interchangeable, and do not claim UI implementation readiness before the applicable review route exists and the walkthrough has no unresolved usability blocker.

Every new or refreshed handoff declares the artifact-appropriate target outcome and exact runtime-profile claims for its slice, with canonical links. Prove target-outcome closure by tracing the intended actor or consumer through the real selected entrypoint, assembly owner, required bootstrap/state, dependencies, and minimum observable result. A test harness proves only the behavior it exercises; it cannot satisfy a runnable product or operator claim unless the harness is itself the selected target. Untouched historical handoffs may retain their existing shape until refreshed, but do not use that compatibility allowance to make a new completion claim.

Before a ready outcome, materialize `Required Interaction Closure` for the slice. Trace each required `IFACE-xxx.ACT-NNN` from logical contract through Stage 8 physical binding to the consumer path. Classify the proof needed as existence, identity/freshness, structural conformance, behavioral evidence, and consumer fitness. Evidence supports only the class it actually exercises: source or file existence does not prove behavior; producer-local tests or mocks do not prove consumer fitness; a schema declaration does not prove the deployed or generated representation conforms. For a verified pre-existing producer, run a fresh independent consumer-side challenge and require `PASS`. For a selected-slice output, bind the planned proof to the selected producer and consumer work. Require the positive, rejection/denial, and failure/recovery matrix only for interactions classified `high` risk; ordinary interactions explicitly use `None.` for that matrix.

For every new or refreshed handoff, materialize `Physical Realizability Closure`. Partition the selected target outcome, all `INPUT-NNN` records, and all `INT-NNN` records into the smallest useful set of `PSEAM-NNN` compatibility equivalence classes, then freeze the inventory with required effectful commands and directly affected implementation surfaces. For each class, record the implementation situation and boundary class; actual producer representation and consumer acceptance rule; affected runtime profiles; schema/version, identity/representation, transport/method, topology/ports, authority/caller, lifecycle/persistence, and command/toolchain comparisons; focused candidate proof and provenance; complete direct change-impact disposition; required-command effects; current result; exact writable delta owner; probe; local evidence; and downstream impact. Run existing prerequisites through their real public seams. A protected implemented evolution requires an executed candidate through the real consumer before readiness. A genuinely new selected output may schedule final proof when its candidate is concrete and all correction/proof owners are writable. A ready outcome forbids `BLOCKED`; an `EXCLUDED` entry cannot cover something required by the selected target outcome. After consolidated repair, rerun the same frozen direct-dependency-bounded inventory once rather than starting an expanding audit.

When selected Build Units have structured VO assignments, also materialize `Required Verification Obligation Closure`. Enumerate every distinct selected assignment, route it to the affected Repository Build Design and planned `assurance/coverage.yaml` or exact external evidence owner, and inherit the VO's observation and risk. Planned evidence is allowed before implementation only when its selected owner and route are concrete; unassigned, unmapped, expired-exception, or silently skipped obligations block readiness.

The handoff selects Build Units, not repositories. It routes each selected unit to its Repository Build Design and applicable constraints. A partial-repository slice names omitted Build Units and their disposition. If blocked, report the exact blockers and leave the handoff absent. Otherwise create one compact versioned current `build/workflow/handoffs/<delivery-slice>.md`, run validators, and offer the separate Delivery Planning workflow without starting it. Its Snapshot ID immutably identifies that revision; refresh the same file for later revisions and let version control preserve the superseded content.

## Writing Contract

The `system-model/` is agent-first: exact frontmatter relationships plus bounded Markdown sections. Use one record per independently retrievable concern, stable typed IDs, explicit exclusions, and canonical links. Do not make it a long-form book or a YAML-only database.

The root README is the package index with generic Blueprint Terms only. Do not create a parallel summary surface.

The `build/` model remains reader-oriented because it explains concrete artifacts, repository construction, and delivery boundaries. Use connected prose where rationale matters and tables for repeated mappings. Omit empty boilerplate.

## Final Handoff

After Stage 7, summarize:

- package and source brief paths;
- files created or updated;
- system-model structure validation result;
- Technical Decision totals by state and explicit deferred scope;
- implementation-detail ticket totals by status when present;
- that main Software Design completion is independent of unresolved implementation-detail tickets;
- Stage 8 Build Design and Stage 9 readiness outcomes only when assessed;
- Build Unit records and current delivery-slice handoff paths when created;
- whether the requested slice is ready for Delivery Planning; and
- the exact TD, ticket, System Responsibility, Build Unit, or repository blockers when not ready.

When the user asks whether the product or project is finished, report a compact completion matrix instead of one broad label: Software Design, Build Design, selected implementation slices, required target outcome by runtime profile, deployment, activation/operation, and production readiness. State `Not assessed` or `Not required for this target` where appropriate.

When ready, offer the separate Delivery Planning workflow. Never start it automatically.
