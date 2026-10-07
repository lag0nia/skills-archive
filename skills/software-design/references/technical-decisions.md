# Technical Decision Records

Read this reference before creating, changing, backfilling, deferring, resolving, or projecting Technical Decisions.

## Contents

- Canonical Ownership
- Meaning And Boundary
- Record Shape
- Continuous Discovery
- Decision-History Backfill
- Closure Audit
- GitHub Reading Contract

## Canonical Ownership

- `build/workflow/technical-decisions.yaml` owns compact `TD-NNN` parent records.
- Each `TICKET-NNNN` owns one independently answerable question, its workflow state, answer, dependencies, and write targets.
- Every ticket declares `parent_decision`: one `TD-NNN` or explicit `null`.
- Durable system truth remains in architecture, Domain, System Responsibility, behavior, contract, Build Unit, repository, CONS, SEL, or VA records. A TD explains the shared choice and preserves its history; it never replaces those owners.
- GitHub renders every TD as one stable human-first issue and derives its child-ticket table from `parent_decision`. GitHub remains a projection, not canonical truth.

Software Design does not create separate question records, IDs, states, Markdown decision files, generated decision dashboards, or a separate decision Canvas.

## Meaning And Boundary

A TD is one consequential technical subject whose complete handling may require several independently answerable tickets. Create one regardless of whether its answer is immediately known, actively discussed, deferred, or already resolved during an approved history backfill.

Create a TD when its tickets collectively resolve one coherent technical choice and normally must remain compatible because they share a material authority, safety, interoperability, correctness, construction, validation, or reconsideration boundary. Keep tickets standalone when they merely share a repository, Build Unit, Domain, responsibility, concern, delivery phase, similar wording, or visual convenience.

Use the smallest TD that can be reviewed, selected, changed, and validated as one coherent choice. Split decisions when each ticket group can change or reopen without materially revalidating the other. Do not create one-ticket TD wrappers unless the parent adds a genuinely distinct, consequential shared explanation that the ticket cannot own alone.

A product or operations gate is not automatically a TD candidate. Use the existing product or operational ticket kind, preserve source attribution and any external authority, and obtain user approval for material unresolved behavior. Approved behavior belongs in canonical responsibilities, flows, state, and contracts; design around safe local gates without claiming affected readiness.

## Record Shape

Use `technical_decision_file_version: 1` and one `decisions:` list in `build/workflow/technical-decisions.yaml`. Start from [the template](../assets/templates/build/technical-decisions.yaml).

Each TD requires:

- `id`, `title`, and `state`;
- `primary_domain` and every `affected_responsibilities` ID;
- `context`: what is happening and the decision subject;
- `why_it_matters`: the material consequence that makes this a TD;
- `established`: facts already fixed and not reopened by child tickets;
- `how_tickets_fit`: why the questions form one choice and what compatibility they must preserve;
- `blocker`: the concrete unavailable prerequisite when state is `Blocked`; use `null` or omit it in every other state;
- `outcome`: the final combined decision only when resolved;
- `defer_reason` and `resume_when`: non-null only when deferred; and
- optional `current_shape`: one bounded tree, logic, or single-object state snapshot from [issue-visuals.md](issue-visuals.md), only when it clarifies the coherent decision more than the existing context and child table.

Keep these fields concise and connected. Do not copy ticket questions, options, recommendations, resolutions, dependencies, or status rows into the TD record. Projection generates the child table from canonical tickets.

A TD visual must explain the current shared choice or compatibility boundary. Do not use it merely to redraw the child-ticket table, summarize status, or display rejected alternatives.

Use only `Open`, `Partially Resolved`, `Blocked`, `Deferred For Later Design`, and `Resolved`.

- `Open`: current-scope child questions remain unanswered and none has established a partial result worth reporting at parent level.
- `Partially Resolved`: at least one child is finished while another current-scope child remains.
- `Blocked`: the coherent decision cannot currently progress because a material prerequisite is unavailable; record that exact prerequisite in `blocker`.
- `Deferred For Later Design`: unresolved children are explicitly excluded from the target version and use ticket status `out-of-scope`; record concrete `defer_reason` and `resume_when`.
- `Resolved`: every active child ticket is `finished`, durable owners contain the result, and `outcome` states the combined decision. Exclude archived children from active counts. When retirement leaves no active children, retain the TD only with its archived child relationships and an outcome explaining why the questions are duplicate or obsolete and how any surviving requirement is resolved; do not reopen retired questions solely to populate the child set.

A TD may briefly have no child tickets while early system design is establishing its boundary. Before its interview, Stage 7 completion, projection as resolved, or any readiness claim, create every material independently answerable child ticket.

## Continuous Discovery

Detect TDs throughout the workflow instead of treating them as a consequence of postponement:

1. Identify obvious consequential choices during architecture, responsibility, flow, and contract design.
2. Reassess related questions when a ticket cluster is created or materially changed.
3. Before a sequential ticket interview, decide whether the tickets collectively need one TD parent.
4. During the Stage 7 fixed-point inventory, run a separate decision-cluster audit over active and finished tickets.
5. Leave tickets with `parent_decision: null` when the boundary test does not pass.

Never infer or materialize TD membership from fields alone. `owner`, `affects`, `cluster`, `depends_on`, `write_targets`, Build Units, repositories, concern, or similar wording are audit leads only. Present candidate TDs and their proposed child tickets for approval before creating or changing parent relationships.

## Decision-History Backfill

When the user explicitly asks to capture already-settled technical decisions, first audit current tickets and their durable canonical owners read-only. Propose only coherent consequential TD groupings; do not infer membership from shared fields or wording.

For every approved backfill:

1. Preserve every ticket ID, status, question, answer, dependency, mapping, result, constraint, and write target.
2. Set every affected ticket's `parent_decision` to the approved TD or explicit `null`.
3. Preserve the settled facts in their durable canonical owners; the TD records the coherent context, compatibility boundary, and combined outcome.
4. Create a resolved TD only when all child tickets are already finished and the durable owners contain the complete result.
5. Validate ticket counts, parent synchronization, and semantic preservation before and after the change.

Do not turn every settled ticket cluster into a TD. Backfill records decision history; it does not substitute for prospective missing-ticket discovery.

For ordinary approved-answer updates, use [Ticket And TD Synchronization](implementation-detail-tickets.md#ticket-and-td-synchronization) to reconcile parent facts, remaining-question context, and directly affected unanswered tickets.

## Closure Audit

Whenever the last active child resolves:

1. Move every settled fact into its exact durable owner.
2. Confirm every child ticket is `finished` and every write/result/constraint route is synchronized.
3. Set the TD to `Resolved` and write its compact combined `outcome`.
4. Retain the TD as decision history and keep its stable GitHub issue.

When the current version intentionally excludes the remaining coherent decision, set the TD to `Deferred For Later Design`; all unfinished children use `out-of-scope`. Vague future ideas and undefined optional work belong in `SCOPE-NNN`, not in a TD.

## GitHub Reading Contract

Render a TD issue as a connected decision brief inspired by the ordinary ticket renderer:

1. Open with `context` and `why_it_matters`.
2. Explain `established` facts.
3. Explain `how_tickets_fit` without duplicating child bodies.
4. Show a linked table of child ticket ID, title, and status.
5. Adapt the closing section to the TD state: remaining work, blocker, deferral reason and resume condition, or final outcome.
6. Hide canonical bookkeeping in a collapsed reference block.

Every TD appears in the `Decision Areas` Project view. A deferred TD also appears as the readable grouped item in `Out-of-Scope`; its child tickets remain real issues but do not repeat as top-level rows in that view. A standalone ticket with `status: out-of-scope` and `parent_decision: null` appears directly in `Out-of-Scope` with its existing human-first ticket body.
