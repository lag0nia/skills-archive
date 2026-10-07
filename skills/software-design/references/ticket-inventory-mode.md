# Ticket Inventory Mode

Read this reference when the user asks in ordinary language to find missing or remaining implementation tickets, determine whether a backlog is complete, inventory unanswered implementation details, or backfill prior decisions into tickets. The user never needs to say “mode” or invoke a special command.

## Contents

- Route The Request
- Infer Scope
- Ticket Candidate Test
- Required Discovery Lenses
- Working Coverage Ledger
- Separate Parent Synchronization From Discovery
- Prospective Inventory
- Reverse Challenge Pass
- Fixed-Point Completion
- Decision-History Backfill
- Completeness Contract

## Route The Request

Choose exactly one operation from the user's wording and current context:

- **Prospective inventory:** “find all remaining tickets,” “look for missing implementation tickets,” “complete the backlog,” “check whether the backlog is complete,” “what implementation questions are left,” or equivalent gap-finding language.
- **Decision-history backfill:** “backfill what we decided,” “turn our previous implementation decisions into tickets,” or equivalent language asking to record settled history.
- **Status review:** “show the backlog,” “list the tickets,” or “check the current backlog” without language asking to find missing coverage.

Prospective inventory and decision-history backfill may create or update ticket YAML. Status review is read-only. If wording remains genuinely ambiguous, perform status review and explain the two write operations rather than mutating files unexpectedly.

Do not ask the user to repeat the request using special syntax. A clear prospective-inventory or decision-history-backfill request is approval for ticket-file writes in the inferred scope, not approval for design answers or other artifacts.

## Infer Scope

- “all,” “every,” “remaining,” “complete,” “the backlog,” or “the package” means every existing System Responsibility in the package.
- A named System Domain means every responsibility owned by that Domain.
- A named System Responsibility means that responsibility and only the direct cross-responsibility questions needed to deduplicate its backlog.
- During an active approved responsibility or section pass, an unqualified “find the remaining tickets here” means that active scope.

List the existing Domains and System Responsibility assignments exactly as defined before a whole-package inventory. Do not rename, regroup, split, merge, or invent an implementation order. If the package has a real boundary inconsistency, identify it precisely and pause only the affected inventory branch.

## Ticket Candidate Test

Create a ticket only when all of these are true:

1. The current package does not already answer the question.
2. An implementer cannot finish or verify a specific bounded behavior without choosing the missing detail.
3. The choice materially affects behavior, an interface, data compatibility, funds, security, operations, or verification.
4. The choice is independently answerable and has one truthful owner, affected System Responsibilities, a needed-before boundary, and canonical write targets.

Write the candidate proof as: **“An implementer cannot finish or verify `<bounded behavior>` without choosing `<missing detail>`, and the current package does not already choose it.”** If that sentence cannot be completed concretely, do not create the ticket.

Classify conversation and design gaps consistently:

- a request to explain an already fixed rule is not a ticket;
- a fact directly derivable from canonical design is later implementation work, not a design ticket;
- reversible local discretion with no contract or verification effect is not a ticket;
- a material unresolved choice prepared for discussion is `todo`;
- a material current-version choice intentionally postponed with a concrete resume condition is `deferred`;
- a material unresolved capability already excluded from the target version by canonical scope is `out-of-scope`;
- an already selected answer is `decided` or `finished` only during decision-history backfill.

## Required Discovery Lenses

Apply every lens to every System Responsibility in the selected scope. Do not stop after finding the first plausible questions.

1. **Artifacts and data:** inputs, outputs, records, schemas, canonicalization, identifiers, serialization, storage, and compatibility.
2. **Lifecycle and concurrency:** states, transitions, triggers, ordering, idempotency, duplicate actions, cancellation, timeouts, and terminal outcomes.
3. **Authority and secrets:** authentication, authorization, consent, keys, signatures, custody, access, retention, rotation, deletion, and recovery.
4. **Interfaces and handoffs:** producer, consumer, source of truth, validation, error contract, retries, and cross-responsibility or external boundaries.
5. **Protocol and transaction correctness:** request or transaction construction, validation, atomicity, ordering, timing, and rejected variants; include commitments, amounts, and fee behavior where the domain requires them.
6. **Failure and recovery:** crashes, stale state, conflicts, replacement, unavailable dependencies, partial completion, reconciliation, and safe resumption; include reorg handling for blockchain-backed state.
7. **Observation and operations:** providers, freshness, disagreement, alerts, manual authority, audit evidence, escalation, and support behavior.
8. **Economics and resources:** units, rounding, limits, minimums, costs, capacity, rate limits, and exhaustion behavior; include dust thresholds for financial protocols where relevant.
9. **Verification:** fixtures, invariants, negative cases, integration boundaries, evidence, and acceptance conditions needed to prove the behavior.
10. **Operability and composition:** intended actor or consumer, public entrypoint, startup and shutdown, configuration, dependency provisioning, bootstrap/seed/migration behavior, identity and resource discovery, persistence/resume/reset, external substitutes, and the minimum target outcome in each required runtime profile.

For each responsibility handoff, run the relevant lenses from both producer and consumer perspectives, then deduplicate. After resolving any ticket cluster, run a delta inventory on the changed boundary and its dependents: an answer may expose a new downstream choice that was not concrete before. Link already-visible dependent questions with `depends_on` only when the earlier answer determines the later scope, alternatives, or final decision, explaining that consequence in existing prose; shared topics, sources, implementation needs, or TD membership alone are insufficient. Use optional `blocked_by` only for outstanding external facts/actions under [implementation-detail-tickets.md](implementation-detail-tickets.md); do not create speculative tickets for branches that may never be selected.

## Working Coverage Ledger

Before creating tickets, build a temporary working ledger for the selected scope. Keep it in working notes or temporary storage; do not add a maintained coverage artifact to the Software Design package.

Give every selected System Responsibility one row for each of the ten discovery lenses. Every cell must end with exactly one disposition:

- `answered:<canonical source>` when the package already chooses the material detail;
- `ticket:<TICKET-NNNN>` when an existing or newly created ticket owns it;
- `excluded:<precise boundary>` when the lens has no material implementation choice for that responsibility; or
- `paused:<precise boundary>` when a real architecture inconsistency prevents review.

Do not use a bare `none`, `covered`, `n/a`, or an empty cell. A responsibility is not inspected merely because its file was opened; all ten dispositions must be concrete.

Keep a second temporary handoff ledger for every direct responsibility-to-responsibility and responsibility-to-external-system boundary in scope. Record the exact `IFACE-xxx.ACT-NNN` when available, producer, artifact/action, consumer, acknowledgement or acceptance condition, failure/retry owner, and the ticket or canonical source that makes the handoff implementable. Inspect the handoff from both sides.

For each material interaction, apply only the consumer challenges that make sense for its kind, and give every applicable challenge one normal ledger disposition: initial access or acquisition; read-before-write or initial-state discovery; refresh, restart, retry, or recovery; empty/not-found versus forbidden versus stale/unavailable meaning; acknowledgement; and failure ownership. A `callable` or `state-observation` interaction normally needs access, result, and failure dispositions; a passive artifact transfer or manual handoff may legitimately exclude read-before-write. Do not manufacture tickets to fill inapplicable cells. Do not accept “the producer has commands,” “an internal method exists,” or “tests pass” as a disposition for a consumer-visible interaction unless the canonical contract actually exposes and verifies that interaction.

For every proposed ticket, record its candidate proof in the working ledger and in the canonical `candidate_proof` field:

> An implementer cannot finish or verify `<bounded behavior>` without choosing `<missing detail>`, and the current package does not already choose it.

If the proof is vague, names the whole responsibility, or cannot name a bounded behavior and missing choice, do not create the ticket.

## Separate Parent Synchronization From Discovery

Treat ticket-to-TD parent synchronization as inventory setup only. It proves that known relationships resolve; it does not discover implementation questions or missing consequential decision groupings and must never be reported as prospective-inventory completeness.

After synchronization, start a separate System Responsibility review without using the existing ticket list as the candidate source. For every responsibility, ask:

> Assuming every active TD and current ticket were resolved now, what material choices would an implementer still need to make to finish or verify this System Responsibility's realization?

Apply all ten lenses to that counterfactual. Review zero-owned-ticket responsibilities explicitly; zero may be correct only when every lens has a concrete `answered:`, `excluded:`, `paused:`, or truthfully cross-owned `ticket:` disposition. Treat phrases such as `responsibility-level implementation details`, `implementation-detail work`, `later interface work`, and `exact ... remains` as unresolved-language leads that require disposition, not as permission to postpone discovery.

Before the semantic review, run the read-only lead report:

```sh
node <software-design-skill-directory>/scripts/report-ticket-inventory-leads.mjs --root <software-design-package>
```

The report enumerates System Responsibilities, owned-ticket counts, TD-linked versus standalone tickets, zero-owned-ticket responsibilities, and explicit unresolved-language leads. It neither creates tickets nor proves semantic completeness.

## Prospective Inventory

Use the approved Software Design package as the default source. Respect any explicit package-only or source restriction. Read repository implementation context only when the user permits it and a question cannot be characterized accurately from the package alone.

For a whole-package inventory, first read the complete canonical package surface: architecture, every Domain and System Responsibility record, lifecycle data and every flow, every atomic contract, every TD record, and every ticket file. Do not substitute a keyword search or only directly relevant files. For a narrower inventory, read the same record types wherever they define or consume the selected boundary.

Then:

1. Inventory the existing Domains, System Responsibility assignments, direct handoffs, ticket IDs, TD parent links, and explicit scope boundaries.
2. Report the TD-linked and standalone counts, then run the separate counterfactual discovery pass above. Do not begin that pass from the existing tickets or decisions.
3. Complete the responsibility-by-lens and handoff ledgers. Treat implicit missing contracts as candidates; do not look only for `TBD`, `TODO`, `later`, or other unresolved wording.
4. Identify material independently answerable implementation questions. Exclude explanatory follow-ups, facts already derivable from canonical truth, formatting choices, implementation order, and trivial local discretion.
5. Deduplicate questions across responsibilities. Assign one primary `SR-xxx` owner when truthful, list all affected responsibilities, and use cross-domain ownership only when no responsibility is a truthful owner. For each candidate, apply [Assigning Ticket Kind](implementation-detail-tickets.md#assigning-ticket-kind) independently of its candidate proof. Record the specific decision and classification rationale in the working ledger; the canonical schema is unchanged.
6. Create `todo` tickets for unresolved questions that can be prepared for discussion now. Give each concrete context, options, consequences, and an honest recommendation without selecting the answer.
7. Create `deferred` tickets only when a target-version question is intentionally postponed, and give each a concrete `resume_when`. It remains a readiness blocker for that version.
8. Create `out-of-scope` tickets only when an approved canonical scope boundary already excludes the capability from the target version. Record why it is excluded and when that decision may resume; never infer exclusion merely because the user postponed an answer or because implementation is scheduled later.
9. Do not create `finished` tickets for already settled facts during prospective inventory. That belongs to decision-history backfill.
10. Run a read-only decision-cluster audit after ticket discovery. Propose TD candidates only when several tickets collectively resolve one consequential choice; explain why they belong, which compatibility boundary they share, and why repository/Build Unit/topic grouping alone is insufficient. Materialize only approved candidates.
11. Run the Reverse Challenge Pass and semantic-overlap comparison below. During the final semantic review, challenge product, technical and operational assignments in both directions: do not treat every interface/data field as software engineering, every customer business operation as service operation, or every visible consequence as product. Reuse approved sources to distinguish an open contract from its implementation, following the common kind procedure.
12. Write or update canonical ticket YAML and approved TD records, rerun the lead report and ticket validator, then apply the Fixed-Point Completion rule.

Prospective inventory changes workflow records only. It must not modify canonical System Responsibility behavior, resolve a question, select a TD outcome, or create a different Domain grouping. Creating an approved TD parent records grouping and rationale without answering its children.

## Reverse Challenge Pass

After the forward responsibility review, search for omissions by starting from implementation obligations rather than responsibilities. This is a fresh challenge pass, not a recap of tickets already found.

Run all of these censuses:

1. **Artifact census:** enumerate every named or implied record, schema, identifier, versioned payload, API message, job, stored secret, and operator artifact. Include hashes, commitments, roots, transaction packages, and contract events when the domain uses them. Trace creation, encoding, validation, storage, consumption, compatibility, and deletion or terminal retention.
2. **Authority, secret, and resource census:** trace roles, approvals, administrative authority, credentials, secret disclosure, and resource transfers. For financial or cryptographic systems, also trace funds, keys, custody, and signatures. Check source, destination, authorization, acknowledgement, retry, recovery, and safe terminal handling.
3. **External-integration census:** enumerate external APIs, service providers, authentication services, storage, message delivery, KMS or encryption boundaries, local helpers, browsers, dashboards, and human operators. For blockchain or signing integrations, also enumerate wallets, signers, nodes, relays, and observers. Check request/response contracts, normalization, availability, disagreement, fallback, manual authority, and audit behavior.
4. **Lifecycle-tail census:** inspect cancellation, expiry, timeout, replacement, duplicate submission, partial completion, stale observation, unavailable dependencies, retry exhaustion, abandoned artifacts, and every terminal or unclaimed state. For financial or blockchain lifecycles, include abandoned funds and reorg recovery.
5. **Target-outcome and runtime-profile census:** enumerate every approved or implied acceptance outcome and named environment, network, platform, device, or operating mode. For each, classify the target-version claim as build compatibility, verification only, runnable use, deployment, or activated operation; trace the actor or consumer, real entrypoint, composition/bootstrap owner, state and reset behavior, external prerequisites or substitutes, minimum observable result, and proof route. A fixture or test harness cannot silently stand in for a runnable product claim, and fixed fixture identities must remain inside an explicit test or demo composition.
6. **Unresolved-language census:** search the selected package for `TBD`, `TODO`, `later`, `future`, `selected`, `configured`, `exact`, `provider`, `manual`, `recovery`, `fallback`, `environment`, `profile`, `supported`, `start`, `bootstrap`, `demo`, `deploy`, `activate`, and equivalent wording. Give every material occurrence a ticket, canonical-answer source, exclusion, or paused-boundary disposition. A keyword hit is only a lead, not automatically a ticket.

Initially scan the selected inventory, then compare plausible semantic overlaps in detail using question meaning, context, affected behavior, owners, write targets, dependencies, and shared contracts. Include cross-domain candidates from the package: different folders or wording do not establish independence. Clusters and other groupings are search aids, not evidence that no overlaps exist outside them. For every semantic overlap, either merge the duplicate while preserving history, link a real directed prerequisite with `depends_on`, or record in the temporary ledger why the questions are independently answerable. Matching IDs or wording are not required for two tickets to overlap.

## Fixed-Point Completion

Keep the initial independent discovery, complete Reverse Challenge Pass, and initial inventory scan with detailed comparison of plausible overlaps for the selected scope, including cross-domain candidates. After ticket writes and duplicate reconciliation, verify repairs through an impact-based follow-up:

1. Collect the outstanding findings and changed contracts, responsibilities, decisions, and ticket relationships into one working review set.
2. Trace their effects across the whole system through producers, consumers, shared artifacts, and verification owners, including transitive effects while a changed contract propagates. Challenge mappings against the canonical flows and interface behavior; a missing mapping is not evidence that a consumer is unaffected.
3. Rebuild affected lens and handoff dispositions, independently challenge the affected boundaries, and compare changed tickets with potentially overlapping active tickets across the package. Verify all outstanding findings together. Retain completed dispositions for boundaries whose relevant truth has not changed.
4. If another material finding appears, reconcile it and repeat the affected review. Expand the set only for a concrete changed contract, dependency, uncovered consumer, or outstanding finding; state the reason in working notes. Repeat the full selected-scope review only when concrete findings show systemic omissions or unreliable coverage, including a destabilized responsibility or handoff map that invalidates prior coverage. Name that reason rather than automatically restarting the whole review.
5. Declare completion only when the initial full coverage and subsequent impact review together leave zero unowned material questions, unresolved overlaps, unreviewed TD candidates, or blank/generic dispositions, and the final affected challenge produces no additional finding. If affected coverage or repairs remain incomplete, return `TICKET_INVENTORY_PARTIAL`; do not claim completion merely to end a pass. Stop once outstanding findings are reconciled and relevant checks pass. If missing information or an unresolved decision prevents reconciliation, report partial completion and the exact blocker rather than repeating unchanged checks. Do not claim completion while material inventory findings remain unresolved. A material question with a valid ticket owner is not an unanswered inventory finding, though it may still block the affected delivery.

Call this final verification the **zero-delta challenge pass**. Report its affected scope, retained earlier coverage, and any reason for whole-scope revalidation. It is bounded to the approved design snapshot and evidence reviewed; it does not mean that all future questions are knowable. A validator pass checks structure and relationships, not semantic completeness. Keep the working review set in the existing temporary ledger, not a new maintained artifact.

After snapshot completion, an approved answer, source change, prototype, implementation finding, or newly concrete branch may expose another material question. Create or reopen its ticket and apply the same impact review. Do not retroactively mark the earlier Stage 7 snapshot incomplete. Preserve whole-system impact analysis while revisiting only the connected truth affected by the change, unless the broader-review conditions above apply.

## Decision-History Backfill

Use decision-history backfill only when the user explicitly asks to record already-settled implementation work.

Create `finished` tickets only when the resolution already exists in every named canonical write target and current validation passes. Create `decided` tickets when the answer is established but one or more canonical targets still need an approved coherent write pass. Preserve unresolved current-version matters as `todo` or `deferred`, and approved target-version exclusions as `out-of-scope`; do not make the history look more complete than the package.

Decision-history backfill is not a substitute for prospective inventory. After backfill, say whether remaining-ticket discovery has or has not been performed for the same scope.

## Completeness Contract

Do not call an inventory complete merely because every existing ticket validates. Completeness is always stated for the named approved snapshot and reviewed scope, never for all future design or implementation learning. A whole-package prospective inventory is complete for that snapshot only when:

- every existing System Responsibility has ten concrete working-ledger dispositions;
- TD parent synchronization, independent ticket discovery, and the decision-cluster audit were completed and reported separately;
- every direct handoff and every applicable material-interaction challenge has a producer-side and consumer-side disposition;
- every discovered material question has one ticket owner;
- every unresolved-language lead has a ticket, canonical-answer source, exclusion, or paused-boundary disposition;
- all active-ticket semantic overlaps were reconciled or justified as independently answerable;
- every System Responsibility is reported as having new tickets, existing sufficient tickets, no material remaining questions, or a precisely identified paused boundary;
- no selected responsibility remains unreviewed; and
- initial full coverage plus the final impact-based zero-delta challenge left no additional finding or unresolved overlap for the reviewed snapshot; and
- the ticket validator passes.

Do not create a board or maintained coverage index. In the completion response, give an auditable coverage receipt:

- every inspected System Responsibility and whether it gained tickets, retained sufficient tickets, had no material remaining question, or was paused at a named boundary;
- confirmation that all ten lens dispositions, all target-outcome/runtime-profile dispositions, all direct handoffs, and all applicable material-interaction consumer challenges were completed;
- separate counts for TD-linked and standalone tickets;
- ticket counts by status and cluster;
- deferred items, out-of-scope items, approved/rejected/pending TD candidates, and paused boundaries;
- semantic overlaps merged, linked, or justified;
- the zero-delta challenge-pass result; and
- the validator result, explicitly labeled structural rather than semantic completeness proof.

Do not use a package-wide total or broad cluster summary as a substitute for the per-responsibility receipt.

Return `TICKET_INVENTORY_PARTIAL` for a current inventory operation when the independent pass, decision-cluster audit, any responsibility disposition, any direct-handoff disposition, or the coverage receipt is missing, even when parent synchronization and the structural ticket validator pass. When an existing package is assessed only for Stage 8 Build Design, absence of a historical completion response or temporary ledger does not alone block truthful Build Unit mapping; perform the bounded current-state check in [build-design-and-delivery-readiness.md](build-design-and-delivery-readiness.md).

Use one result:

- `TICKET_INVENTORY_COMPLETE`
- `TICKET_INVENTORY_PARTIAL`
- `NO_MATERIAL_TICKETS`
- `NEEDS_BOUNDARY_DECISION`

These are operation results, not ticket statuses.

## Prototype Findings And Backlog Refinement

Preserve initial ticket visibility and the independent whole-scope inventory timing. Prototype discovery can expose new questions; reconcile approved findings at coherent journey boundaries and refine only the affected backlog and connected dependencies. Reuse existing questions before adding records. Retire duplicate or obsolete questions through the existing archive fields described in [implementation-detail-tickets.md](implementation-detail-tickets.md), redirect affected active references, and recompute TD state. Later prototype work may remain pending only under that reference’s narrow completion exception; it does not waive other ticket completion requirements or relevant UI readiness.
