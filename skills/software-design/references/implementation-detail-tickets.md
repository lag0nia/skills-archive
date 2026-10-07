# Implementation Detail Tickets

Read this reference whenever a System Responsibility, Domain, flow, Software Design repair, or Build Design pass still has material questions to resolve. Tickets make the remaining design work visible and machine-readable; they do not replace canonical system records, compact TD parent records, or the later Delivery Planning handoff.

## Contents

- Purpose And Ownership
- File Layout
- Ticket Shape
- Assigning Ticket Kind
- Repository-Scoped Contract Tickets
- Ticket Statuses
- Ticket, CONS, SEL, And VA Lifecycle
- Discussion And Recording Workflow
- Parent Decisions And Decision Clusters
- Ticket And TD Synchronization
- Validation

## Purpose And Ownership

Create one ticket for each material, independently answerable implementation-detail question. Do not create tickets for explanatory follow-ups, derivable validation checks, formatting choices, or every sentence written during a discussion.

The ticket owns workflow state, the concise question, the approved resolution summary, dependencies, links to every write target, and—after Build Design exists—affected Build Units. Canonical behavior remains in the approved architecture, Domain, System Responsibility, flow, contract, Technical Constraint, Build Unit record, or other durable owner. A ticket may summarize that truth but must not become a competing system specification. A TD owns only the shared consequential choice, rationale, compatibility boundary, and history across related tickets.

Use a stable `TICKET-NNNN` identifier that does not encode a Domain or System Responsibility. Scope can change; identity must not.

When a local user needs a GitHub collaboration projection for ordinary tickets, follow [ticket-projection.md](ticket-projection.md). GitHub remains a projection and discussion surface: do not add provider IDs, Project fields, assignees, processing markers, or other projection state to ticket records. Only the normal ticket fields and canonical Software Design prose remain durable truth.

## File Layout

Organize ticket files under the existing System Domains, then by owning System Responsibility:

```text
software-design/
  build/
    workflow/
      tickets/
        <domain-slug>/
          sr-xxx/
            sr-xxx-tickets.yaml
            sr-xxx-<cluster>-tickets.yaml
        cross-domain-tickets.yaml
```

Use one `sr-xxx-tickets.yaml` file for a simple responsibility. Split a complex responsibility by coherent discussion cluster only when one file would be unwieldy or contain multiple substantial groups. Prefix every responsibility-owned filename with its lowercase ID. Use `cross-domain-tickets.yaml` only when no single System Responsibility is a truthful primary owner.

Ticket tracking starts after System Responsibility design and remains separate from Stage 8. Keep Build Units and repositories in the `build/` construction model, keep CONS/SEL/VA records under `build/records/`, and create a Stage 9 handoff only under `build/workflow/handoffs/`. Do not move or duplicate ticket files into Build Unit or repository folders.

Keep canonical YAML and design records as the source of truth. Do not create duplicate maintained local boards, ticket indexes, Kanban views, or parallel ticket sources. Use the existing GitHub projection and its documented local `software-design-ticket-projection.json` configuration under [ticket-projection.md](ticket-projection.md); projection and configuration do not become canonical ticket records.

## Ticket Shape

Keep ticket YAML deliberately constrained: one-line JSON-compatible quoted scalars and inline arrays make it deterministic to validate without a YAML dependency.

Start a new responsibility ticket file from [responsibility-tickets.yaml](../assets/templates/build/responsibility-tickets.yaml), then replace its placeholders with the approved responsibility, question, and write targets. The template’s null `kind` is an intentionally invalid authoring placeholder: replace it with one existing category using [Assigning Ticket Kind](#assigning-ticket-kind) before saving a canonical ticket; never persist null.

```yaml
ticket_file_version: 3
scope: "responsibility:SR-002"

tickets:
  - id: "TICKET-0001"
    title: "Set the recovery exercise procedure and schedule"
    status: "deferred"
    kind: "operational"
    complexity: "medium"
    concern: "failure-recovery"
    owner: "SR-002"
    affects: ["SR-002", "SR-011"]
    build_units: []
    build_unit_disposition: "Realization mapping has not started."
    repositories: []
    repository_contract_area: null
    parent_decision: null
    cluster: "service-recovery"
    question: "Who runs the isolated tenant restore exercise, on what schedule, and where is its outcome recorded?"
    context: "Tenant recovery guarantees, isolation, backup technology and the restore interface are approved. The operator procedure and exercise cadence are intentionally postponed until the recovery exercise is prepared."
    candidate_proof: "An implementer cannot finish or verify the required tenant recovery exercise without choosing its operator procedure, schedule and evidence destination, and the current package does not already choose it."
    options: []
    recommendation: "Choose a repeatable isolated exercise with recorded results and an explicit owner, within the approved recovery guarantees."
    resolution: null
    result_refs: []
    constraint_refs: []
    depends_on: []
    write_targets: ["system-model/domains/service-operations/responsibilities/sr-002-tenant-recovery.md"]
    resume_when: "Before the required tenant recovery exercise is performed."
```

Use `ticket_file_version: 3` for every ticket file. Set `parent_decision` explicitly on every active ticket and include an honest `candidate_proof` on every unresolved active record.

Every `todo`, `deferred`, or `out-of-scope` ticket must persist this exact proof shape:

> An implementer cannot finish or verify `<bounded behavior>` without choosing `<missing detail>`, and the current package does not already choose it.

The bounded behavior and missing detail must be concrete. Do not paste the same generic proof across tickets. A retained proof may remain after a ticket becomes `decided` or `finished`, but is not required for a decision-history-backfilled settled ticket.

For a `deferred` ticket, write `context` so it explains why this still-required current-scope answer is temporarily postponed, and always provide a concrete `resume_when`. For a standalone `out-of-scope` ticket, write `context` so it explains why the capability is excluded from the target version and provide a concrete `resume_when`. For an `out-of-scope` child of a deferred TD, the ticket context explains the question-specific gap while the parent TD owns the shared `defer_reason` and `resume_when`. This lets projection distinguish temporary postponement from an explicit scope exclusion without duplicating parent decision state into every child ticket.

Use these required classification fields:

- `complexity`: required `low`, `medium`, or `high`; difficulty of resolving the design question, not implementation effort, priority, or dependency reach. Use `low` for a bounded choice with clear facts and few straightforward alternatives; `medium` for a choice requiring comparison of several constraints, concrete examples, or limited investigation; `high` for substantial uncertainty, competing correctness or authority constraints, or specialist investigation needed to justify a coherent answer. Classify from the reasoning needed, not the number of affected units. Reassess when the question materially changes; do not add numerical scores. Among otherwise answerable questions, use this field for easier/harder ordering without bypassing prerequisites;
- `kind`: required `product`, `technical`, or `operational`. Apply [Assigning Ticket Kind](#assigning-ticket-kind) when creating a ticket and whenever its question or approved resolution materially changes. Never inherit a kind from the template or a related ticket;
- `concern`: one portable lowercase slug such as `interface-api`, `data-model`, `state-lifecycle`, `protocol-transaction`, `authorization-keys`, `failure-recovery`, `observation-monitoring`, `integration-configuration`, or `testing-correctness`;
- `owner`: one primary `SR-xxx`, or `shared` only in the cross-domain file;
- `affects`: every affected System Responsibility;
- `build_units`: every affected `BU-xxx` after Stage 8 Build Design exists; keep an empty inline array before mapping or when the ticket has no artifact impact. When the ticket materially changes interface behavior or representation, include every Build Unit already bound through that contract's producer and consumer System Responsibilities; this is an existing-mapping rule, not a request to predict hypothetical consumers. Do not infer material change from `write_targets` alone because structural, formatting, provenance, or migration reconciliation may touch the same file without changing its contract;
- `build_unit_disposition`: a concrete explanation when `build_units` is empty, such as mapping not started, external/no-code responsibility, or outside the mapped Build Design scope; use `null` when build units are listed;
- `repositories`: optional many-to-many `REPO-xxx` Repository Build Design applicability for repository-scoped tickets; leave it empty or omit it when the ticket is not a repository construction ticket. Do not infer repository applicability from `build_units`;
- `repository_contract_area`: optional repository-contract coverage lane. Use only `repository-module-conventions`, `code-construction-public-api`, `maintainability-agent-guidance`, or `null`; when present, the ticket must include at least one affected `REPO-xxx` in `repositories`;
- `parent_decision`: required on every active ticket. Use one existing `TD-NNN` when the ticket is a question inside that consequential choice; otherwise use explicit `null`. Never omit the field and never use a separate question ID;
- `current_shape`: optional `null` or one validated inline visual object from [issue-visuals.md](issue-visuals.md). Use it only when a current tree, logic branch, or single-object state view materially improves the projected issue; it never replaces ticket prose or a durable owner;
- `cluster`: the coherent discussion section;
- `depends_on`: inline array of canonical ticket IDs representing genuine decision prerequisites; see the contract below.
- `blocked_by`: optional inline array of non-empty strings describing outstanding external facts/actions and what clears them. Omission and `[]` both mean no recorded external blockers; no backfill is required.

Use optional `result_refs` for durable Build Design artifacts produced by the ticket: `SEL-NNN` for a material Implementation Selection and `VA-NNN` for a reusable Verification Capability. Use optional `constraint_refs` only for decided `CONS-NNN` rules established or changed by this ticket. Keep both as inline arrays. Do not add an SEL, VA, or CONS merely to give every ticket a result ID; ordinary Software Design prose, build-unit updates, and Software Design repairs remain `write_targets` only.

Use project-specific technology words such as Kafka, WebAuthn, Postgres, gRPC, or a named chain in the title, question, context, or optional `tags` array. Do not hard-code them into the portable concern taxonomy.

The GitHub Tickets board derives Work area, Answering group, and Waiting on from these existing records; they are projection fields, not canonical ticket schema. See [ticket-projection.md](ticket-projection.md) for their lifecycle and setup.

## Assigning Ticket Kind

Classify the decision being made, not the vocabulary, responsible team, workflow stage, owner, concern, parent TD, result record, or expected implementation effort. “An implementer needs this answer” establishes ticket materiality, not kind. The agent assigns the category; do not ask the user to choose a label.

Read the whole question, alternatives and context, relevant approved prerequisites and canonical contracts. For a settled ticket, read the approved resolution, including any change of scope. Separate what is already fixed from what the ticket still chooses. A recommendation is not approval; an obsolete or contradictory alternative does not reopen an approved requirement. Excluded or deferred status does not change the nature of the decision.

Use the existing kinds as follows:

- `product`: the decision establishes or changes the software’s promised behavior or business meaning: supported capabilities or compatibility, accepted inputs and evidence, calculations, lifecycle, permissions, data disclosure/retention, user workflow, configuration rights, or customer-facing timing and degraded-service policy.
- `technical`: **Software engineering decisions**. The decision selects software architecture, ownership, representation, technology, protocol or implementation mechanism to realize an already established behavior/authority/correctness contract. It does not mean generic specialist or domain knowledge: an accounting, legal, construction or security-policy question is not software engineering merely because it needs an expert. Observable implementation consequences alone do not make it product; changing the promised contract does. Use **Software** as its human-facing category label. Keep the serialized value `technical`; do not rename it to `software`. GitHub presentation and existing-option migration follow [ticket-projection.md](ticket-projection.md#software-category-display-and-existing-project-migration).
- `operational`: the decision selects how people activate, run, monitor, support, maintain or recover the service under established product and technical contracts, including concrete service procedures and their cadence. The customer’s business operations are product behavior. An operator-facing software capability or a runtime topology is not operational merely because an operator uses it.

For a coherent question with several aspects, assign one kind by its controlling decision. If the permitted outcome or capability still has to be chosen before the mechanisms can be judged, use product. If that contract is already fixed, classify the remaining choice: how the system realizes it is technical; how the established service is run is operational. Use the approved/current scope, not the number of clauses or keywords. Do not split, rename, reopen or create tickets just to avoid a category judgment.

Contrast: which notification channels customers receive is product; selecting a provider/protocol for fixed channels and delivery requirements is technical; rotating its credentials under a fixed access design is operational. Which financial rounding result is correct is product; choosing a numeric representation preserving that result is technical. A customer-visible warning threshold or recovery promise is product; an operator’s alert triage/restore schedule under that promise is operational.

Before saving a new or materially changed ticket, state in existing context or in the task’s temporary review notes: “This ticket chooses <specific decision>; <relevant contract> is fixed or remains open; therefore kind is <value>.” Do not add a schema field or boilerplate to every existing ticket. Check the strongest competing category and explain why it does not control this question.

Reassess kind when recording a scope-changing answer and when reconciling affected questions after prerequisite changes. Preserve approved resolutions, IDs, statuses, ownership, dependencies, result links and integrations unless a separately authorized change requires otherwise. Do not perform an unrelated whole-backlog rewrite.

A missing implementation fact, such as a bank’s supported profile, does not prevent classification when the nature of the choice is clear. Only if the category itself depends on a genuinely unavailable fact, identify that fact and the category under each answer; seek the substantive fact, never a preferred label. Continue unaffected work and do not invent an approved requirement.

## Decision prerequisites and external blockers

An edge in `depends_on` means that the earlier answer can determine this question's scope, alternatives, or final decision. Explain that concrete consequence in existing context/recommendation prose. Shared subject matter, documents, implementation needs, or TD membership alone are not decision prerequisites. Keep non-blocking connections in existing explanatory/canonical references. These edges persist after settlement; current waiting is derived. They are distinct from `depends_on_build_units` and delivery execution order.

Use, for example, `blocked_by: ["The pilot bank must confirm which outgoing remittance format it accepts."]`. Do not require a person or external ID, and do not encode status objects or a second ticket-edge list. Clear a resolved fact through normal authorized recording and preserve established context in its existing owner. Malformed values and bare ticket IDs are review findings, never automatically converted or treated as absent.

When creating or updating an affected question, inspect its direct prerequisites and dependents, concrete decision consequences, relevant approved sources, and any newly exposed prerequisite paths. Use the scoped analyzer described in [expert-consultation.md](expert-consultation.md); its graph checks cannot establish semantic completeness or detect every contradiction. Do not expand this review into unrelated tickets or automatically rewrite approved decisions.

`finished` and `decided` with non-empty resolutions supply approved context. A decided answer supports discussion while canonical writing remains incomplete; it does not waive reconciliation. Resolve known conflicts with relevant sources through existing approval rules before relying on the conflicting point. Approved answers are availability traversal boundaries: open historical ancestry does not automatically block downstream questions. Leftover blockers or links to unanswered prerequisites on settled tickets are semantic review leads, not automatic reopening.

A `todo` question remains unanswered even when included in a consultation. `deferred` retains its resumption reason and requires explicit authorized resumption; inclusion never resumes it. `out-of-scope` supplies no approved answer and requires scope/dependency review when a current question needs it. Unknown, archived, or ambiguous identities cannot establish availability. Analysis never changes the five canonical statuses or resolutions, and introduces no global validation or publication gate.

## Write For A Reader Without Blueprint Context

Use the existing `context`, `question`, `options`, `recommendation`, and `resolution` fields as the one canonical explanation. Do not add a second human-readable record, duplicate specifications, presentation-only state, or a subquestion schema.

- `context` explains the situation, what is already established, what is unknown, and why the choice matters in plain language. Include a concrete example when it makes a material distinction easier to understand.
- `question` states the actual choice so it is understandable without opening another blueprint record.
- Each `options` entry describes an alternative and its practical consequences. Leave letter labels to the renderer.
- `recommendation` names the proposed choice, reasons, and important assumptions. If evidence is insufficient, explain what is missing and what would support a recommendation; do not invent a preferred answer.
- `resolution` records only the approved outcome. For several related decisions, use readable paragraphs or Markdown bullets, encoded with JSON-compatible `\n` escapes inside the existing one-line quoted scalar. Preserve the original question. A recommendation is never an approved answer.

Use descriptive canonical names in narrative explanations instead of unexplained IDs such as `SR-020`, `IFACE-007`, `INV-022`, or `BU-003`. Resolve names from the owning records while authoring; if a reference cannot be resolved, surface it explicitly and clarify it rather than guessing or dropping it. Keep IDs in identity, dependency, ownership, source, and mapping fields. Explain the concrete consequence of a prerequisite in existing prose; an automatically generated relationship label cannot supply that reasoning.

Write substantive explanations during ticket creation or an authorized update. Preserve the authored language and supported Markdown. GitHub projection synchronization only formats the canonical text: it must not call AI, translate, rewrite narrative references, infer consequences, or retrofit existing consumer tickets. Comments remain discussion input under the existing approval and canonical-write workflow.

## Repository-Scoped Contract Tickets

For every greenfield or materially reorganized first-party repository, repository discovery must cover these three lanes unless an authoritative existing contract satisfies one:

- `repository-module-conventions`: repository/workspace shape, naming, paths, tests and fixtures, exports/imports, configuration, CI, release, and the version-control/generated-file boundary;
- `code-construction-public-api`: paradigm, data and mutation policy, type/interface/schema/error placement, public call shape, capability boundaries, rejection semantics, side effects, and test idioms;
- `maintainability-agent-guidance`: simplicity, abstraction and duplication rules, naming/refactor hygiene, rationale comments, agent boundaries, and verification behavior.

Create one ordinary `TICKET-NNNN` ticket per cohesive uncovered lane. Set `repository_contract_area` to the lane, map `repositories` to every affected Repository Build Design, and map `build_units` to every affected unit after Build Design exists. Do not merge these questions into a generic “coding style” prompt, silently answer them as framework conventions, or create them when an existing authoritative contract already covers the lane. The ticket interview must present the concrete choices, recommendation, alternatives, consequences, and any repository-specific adaptation of the maintainability baseline.

Within `repository-module-conventions`, require a durable version-control policy that classifies must-track sources, must-ignore local/generated outputs, generated-output treatment, secrets versus safe templates, and verification. Derive ordinary stack-specific entries such as dependency directories, build outputs, test reports, caches, logs, editor/OS metadata, and local environment files without creating one ticket per pattern. Use the lane ticket only for material alternatives whose answer changes review, release, security, reproducibility, or cross-repository consumption—for example whether generated clients, canonical fixtures, release evidence, or deployment manifests are committed.

The `maintainability-agent-guidance` ticket is one cohesive ticket, but it must be an answerable decision packet rather than a pointer to `maintainability-agent-guidance-baseline`. Its `question`, `recommendation`, `options`, and live interview must expose numbered proposed rules for: simplicity and abstraction; duplication and refactoring; naming and rationale comments; agent change boundaries; stop/escalate conditions; and verification plus final-diff review. For each area, show the inherited default, any REPO-specific adaptation, alternatives or the reason no alternative is needed, and the consequence. If the user accepts the recommendation, copy the expanded rules into `resolution` and the canonical Repository Build Design/derived agent guidance. Do not require the user to approve a baseline identifier whose contents were not shown.

Once Build Design exists, a ticket with a non-null `repository_contract_area` is material repository work and must map at least one affected Build Unit. Every explicit ticket mapping that contains both repositories and Build Units must place each mapped Build Unit under one of the ticket's listed repositories, even when `repository_contract_area: null`. A ticket with `repository_contract_area: null` may remain repository-only when its concrete `build_unit_disposition` explains why it has no artifact impact; do not reject those generic repository-scoped tickets merely because they have no Build Unit mapping.

## Ticket Statuses

Use exactly five statuses:

- `todo`: the question still needs the user's decision;
- `deferred`: the unresolved question is still required for the target version but is temporarily postponed;
- `decided`: the user's answer is durably captured, but the coherent section has not yet been written to every canonical target;
- `finished`: the resolution is written into every affected canonical document and checked;
- `out-of-scope`: the unresolved capability is explicitly excluded from the target version and does not block that version.

Keep blocking and delivery timing separate from status:

- use `blocked_by` for outstanding external facts/actions and `depends_on` for prerequisite ticket IDs;
- use `target_version: "future"` when a fully decided design will be implemented later;
- never use `deferred` or `out-of-scope` merely because delivery of a decided design is later.

A `todo` ticket must contain concrete options and a recommendation before it is presented. A `decided` or `finished` ticket must contain a non-empty resolution. A `finished` ticket must name every canonical `write_target` updated by that resolution.

## Ticket, CONS, SEL, And VA Lifecycle

Use tickets as the workflow and history layer; use `SEL-xxx` and `VA-xxx` as reusable canonical outcomes for Delivery Planning.

- A newly discovered unresolved material implementation selection starts as a `TICKET-NNNN` ticket. Do not create an SEL merely to mirror the unresolved question. A linked `SEL-xxx` may remain `Proposed` while that ticket is `todo` only when preserving a concrete candidate artifact is genuinely useful; it must not become `Approved` until every source ticket is `decided` or `finished`.
- When the user answers the ticket, record its resolution and move it to `decided` without waiting for Stage 8 artifacts. During Stage 8, if that answer selects a material runtime, language, library, service, persistence, module boundary, environment, command, or similarly consequential realization choice, record the durable answer in one `SEL-xxx` and link both directions: ticket `result_refs` to the SEL, and SEL `source_tickets` to the ticket.
- When the answer establishes or materially changes a durable system-level technical must/must-not, create or update its `CONS-xxx` record at the same time, link both directions through `constraint_refs` and `source_tickets`, and add the CONS file to `write_targets`. Do not create a CONS while the ticket remains unanswered.
- During Stage 8, when an approved answer establishes or materially changes reusable proof infrastructure, record one `VA-xxx` capability and link it reciprocally. A planned VA requires a decided or finished source ticket. An existing VA may omit a ticket only when it records concrete existing-capability evidence.
- An inherited implementation selection may use SEL state `Inherited` without a fabricated ticket when `inheritance_evidence` identifies the existing source. Do not create retrospective finished tickets during prospective inventory merely to account for inherited facts.
- Reversible local choices need neither an SEL nor a VA. A choice that changes system behavior, authority, lifecycle, an externally visible interface, or correctness truth routes to a TD repair instead.
- Shared `affected_scopes` records build-unit applicability, not dependency. Use `BUILD_UNIT:BU-xxx` after Build Design and keep delivery dependencies explicit and separate.

Set `decided` when the user-selected resolution is durably recorded in the ticket. A result-producing ticket may remain `decided` until Stage 8 creates and reconciles its SEL/VA and Build Design targets. Set `finished` only after every canonical write target, reciprocal result link, affected-scope route, and relevant validator is reconciled; only later prototype work recorded in the specification may remain pending under the narrow exception below. Apply the Stage 8 Build Design as one coherent update; do not request separate approval for the ticket, SEL/VA, realization prose, and handoff.

## Discussion And Recording Workflow

After a System Responsibility or named section has an approved high-level shape:

1. Decompose its remaining material details into tickets before beginning the long-form interview.
2. Deduplicate questions that affect several responsibilities; assign one primary owner and list the others in `affects`. When Build Design exists, list every affected Build Unit without changing logical ownership.
3. Group related tickets into coherent clusters and apply the TD boundary test before the interview; a cluster is only a discovery aid, not automatically a TD.
4. Assign `kind` using [Assigning Ticket Kind](#assigning-ticket-kind) and `complexity` using its own definition for each new or materially changed question, then create or update the ticket files without asking for approval for each label or record.
5. Tell the user the number and clusters of remaining `todo`, `deferred`, `decided`, `finished`, and `out-of-scope` tickets.
6. Present each material question with context, concrete options, consequences, and an honest recommendation. Do not ask for blind approval.
7. Record the user's answer immediately as `decided`; do not require the optional Stage 8 overlay and do not ask the same question again after an interruption. If the approved answer reframes the decision, reassess kind from that answer while preserving its full resolution and normal status lifecycle.
8. Finish the related questions conversationally, then write any approved Software Design targets as one coherent update. Create or update justified CONS records immediately; when Stage 8 is active, create or update justified SEL/VA and Build Design results in that same pass.
9. Change a ticket to `finished` only after every canonical write target contains the resolution (the recorded later-prototype exception below is the only exception), every result reference is reciprocal, build-unit applicability is current—including every existing producer/consumer Build Unit when an interface contract changes—the handoff is reconciled when one exists, and the relevant validators pass.
10. Run a completeness pass before declaring the responsibility or section finished. Add newly discovered material questions as tickets instead of hiding them in prose or conversation.

When a ticket qualifies for `current_shape`, derive it only after the normal record and its canonical sources are accurate. Review or remove it whenever those sources change; visual presentation is never evidence that the ticket or backlog is complete.

This ticket update is workflow recording inside an already approved active pass. It does not require a new checkpoint for every status change. A new checkpoint is still required when the proposed answer expands scope or changes a material authority, safety, product, or source-truth boundary outside the active pass.

## Parent Decisions And Decision Clusters

An uncertain or postponed current-version question becomes a `deferred` ticket. An unresolved capability becomes `out-of-scope` only when approved canonical scope explicitly excludes it from the target version. Do not create a TD merely because the user says "not now," "TBD," or does not yet know the answer, and do not infer a scope exclusion from postponement alone.

Before interviewing a coherent cluster, apply the TD boundary test in [technical-decisions.md](technical-decisions.md). Create or update a TD when several tickets collectively resolve one consequential technical choice and their answers must remain compatible. This test is independent of whether the questions are open, immediately answered, deferred, out of scope, or finished.

Link an atomic child with:

```yaml
parent_decision: "TD-004"
```

If the original ticket is broad, create the approved TD parent, split its independently answerable questions into atomic child tickets, and archive the broad source record:

```yaml
id: "TICKET-0038"
title: "Decide the automatic account-recovery capability"
record_state: "archived"
status_at_close: "deferred"
closed_reason: "promoted-to-td"
promoted_to: "TD-004"
replaced_by: ["TICKET-0041", "TICKET-0042", "TICKET-0043"]
```

Archived records have no active `status` and never appear as active work. Preserve existing relationships and closure context. Reuse `closed_reason` for `duplicate` or `obsolete` as well as `promoted-to-td`; keep `status_at_close` and `replaced_by` (required active replacements for duplicate/promotion, possibly empty for obsolete). `promoted_to` is required only for promotion. Archive-only cluster files are valid. Redirect active dependencies and affected Build Unit/ticket mappings to active replacements or remove obsolete obligations with a canonical reason; do not leave active dependencies pointing at archived records. Reconcile parent TD child sets and state, preserving historical result reciprocity and source relationships. For a TD left with no active children after retirement, retain its outcome and explain the archived-child disposition. Existing projected issues must retain identity, reflect retirement, close, and leave active Project views during the next authorized projection sync; do not create issues merely for archived records.

Every replacement names `parent_decision: "TD-004"`; no separate question record exists. Put closely related child tickets in the same cluster file while preserving separate records.

## Ticket And TD Synchronization

Every ticket contains `parent_decision`, including explicit `null`. Every non-null value resolves to one TD. Projection derives the TD's child table from these ticket relationships; the TD record never duplicates child question records.

Within an authorized answer-recording pass, apply the existing canonical-write obligation to a newly approved or materially changed answer, including a standalone ticket with no TD parent. Cosmetic edits do not trigger answer recording or move a ticket to `decided` or `finished`.

1. Record the approved answer in the ticket and use the existing `decided` transition when applicable.
2. During the coherent write pass, write the answer into every affected durable design owner. Move the ticket to `finished` only when the existing completion and validation requirements are met.
3. Refresh the affected parent's `context`, `established` facts, remaining-question explanation, and combined `outcome` where applicable. Remove claims that approved facts are still unknown while keeping genuinely unresolved questions visible. Preserve meaningful historical decisions; correct current summaries without erasing history.
4. Inspect directly affected unanswered tickets for assumptions, options, recommendations, and prerequisite explanations invalidated by the answer. Refresh stale wording while preserving each remaining unresolved choice. When an approved prerequisite changes a question’s live scope, reassess kind using [Assigning Ticket Kind](#assigning-ticket-kind); do not infer kind from parentage, dependencies or result record types. Trace the answer's actual canonical owners, parent, and affected questions; shared canonical sources can reveal an affected question without an explicit `depends_on` edge. Do not rescan the entire backlog. Before presenting an affected ticket later, compare its question and options with current approved requirements.
5. Recompute the parent TD state when applicable:
   - all unfinished children `out-of-scope`: `Deferred For Later Design`;
   - current child questions remain: `Open`, `Partially Resolved`, or `Blocked` as appropriate;
   - some children finished and the rest `out-of-scope`: `Deferred For Later Design`;
   - all children finished: `Resolved` with a compact combined outcome.
6. Keep a resolved TD as decision history while treating the settled architecture, Domain, System Responsibility, flow, contract, or build record as canonical system truth.
7. Keep the stable TD GitHub issue in `Decision Areas` throughout every state.

When approved source truth unambiguously settles the matter, reconcile stale summaries without asking the user to decide again, under [the existing repair authorization rules](checkpoint-workflow.md#upstream-repair-handling). Recommendations never override approved answers. If approved sources genuinely conflict and their precedence or relevant history cannot resolve them, ask a specific question explaining the conflicting rules; leave that decision unresolved.

Respect explicit user restrictions on ticket creation, deletion, status, relationships, and scope throughout this reconciliation. Correcting prose does not authorize silently closing, reopening, merging, or retiring tickets, or changing their relationships. If a restriction prevents a required transition or reconciliation, report the exact remaining inconsistency instead of overriding it. Keep unrelated tickets and prototype journeys untouched; the existing prototype synchronization rule below still applies. Stop when affected records are consistent and applicable checks pass, or report the exact unresolved blocker.

Validation must reject a missing `parent_decision`, an unknown parent, a resolved TD with unfinished children, a deferred TD with current `todo`, `deferred`, or `decided` children, a non-deferred TD with an `out-of-scope` child, or an archived promotion record whose replacements do not point to the promoted TD.

## Validation

Run:

```sh
node <software-design-skill-directory>/scripts/validate-implementation-detail-tickets.mjs --root <software-design-package>
node <software-design-skill-directory>/scripts/validate-technical-constraints.mjs --root <software-design-package>
```

Resolve `<software-design-skill-directory>` to the absolute directory containing the active `SKILL.md`, and `<software-design-package>` to the package being changed. Do not resolve the validator relative to the workspace. Run it after ticket creation, status changes, TD creation or reassignment, file moves, or write-target changes. Do not report a System Responsibility's implementation-detail backlog as synchronized until it passes.

When an approved ticket changes a human-facing interaction, presentation requirement, or materially distinct state, update the canonical behavior owner first and affected specification requirements normally. During active discovery, reconcile the prototype at coherent journey boundaries. After the initial reviewed prototype, record affected prototype work with journey and canonical/ticket references under the specification’s `Change Synchronization` section without automatically editing or rendering. An explicit prototype-change request authorizes those affected updates without another sync command or approval. A ticket may be `finished` with pending prototype work only when every other applicable completion requirement is satisfied and that work is recorded in the specification. This narrow exception does not waive canonical write targets, verification, reciprocal result links, or affected Build Unit/handoff routing; relevant pending work blocks selected UI readiness. Do not reopen unrelated journeys.

When the Markdown Build Design layer exists and a ticket names `SEL-NNN` or `VA-NNN` results, also run:

```sh
node <software-design-skill-directory>/scripts/validate-build-design.mjs --root <software-design-package>
```

Do not move a result-producing ticket to `finished` until both validators pass.

The validator checks ticket shape, references, file placement, and TD parent synchronization. It does not establish that all material implementation questions or TD clusters have been discovered; prospective-inventory completeness requires the coverage ledger, reverse challenge, decision-cluster audit, overlap comparison, and zero-delta pass in [ticket-inventory-mode.md](ticket-inventory-mode.md).

For selected expert question sets and returned DOCX answers, use [expert-consultation.md](expert-consultation.md). Expert input follows the same approval and completion distinctions.
