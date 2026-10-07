# Technical Constraints

Use this reference when creating, backfilling, changing, or routing a durable `CONS-xxx` technical constraint.

## Purpose

A Technical Constraint owns one decided, durable technical `must` or `must not` rule that an implementation, repository, handoff, or later delivery must preserve and be able to prove. It gives critical rules a stable identity without turning the architecture into a second implementation plan.

Technical Constraint records live at `build/records/constraints/` and may be created before Stage 8 as soon as a technical rule becomes decided. They own the concise normative statement while architecture, Domain, System Responsibility, flow, and atomic contract records explain the surrounding mechanism and rationale and link to the applicable record. During Stage 8, Build Units and Repository Build Designs consume those records as construction constraints; their location does not let Build Design redefine Software Design behavior.

Do not create a CONS for an unanswered question, a proposed option, a material implementation selection, a reusable verification environment, or reversible local discretion. Those belong respectively to a `TICKET` ticket, `SEL`, `VA`, or the owning Build Design record.

## Creation And Change

Create or update a CONS as soon as a technical rule becomes decided while writing architecture through atomic contracts, or when a resolved ticket establishes or changes one. A ticket may produce an SEL, a VA, a CONS, more than one of them, or none. An unanswered ticket creates no CONS.

For an existing package, run a bounded constraint-coverage pass before relying on Stage 8 routing: identify the implementation-relevant authority, interface, security, lifecycle, invariant, and correctness rules in the selected source scope that still exist only as prose, then backfill only those rules. Do not atomize explanatory sentences or duplicate every local validation detail.

Each record uses `build/records/constraints/cons-xxx-<slug>.md` and must contain:

- one precise normative rule;
- its canonical Software Design source links and affected System Responsibilities;
- source tickets when a ticket established or changed it, otherwise `None.` for a backfill; and
- verification intent, not delivery-specific test steps or evidence.

Use stable decimal IDs. Retire or supersede a rule by updating its canonical record and the relevant source prose; do not leave competing active records for the same rule.

## Ticket And Stage 8 Routing

When a ticket creates or changes a CONS, add the ID to the ticket's `constraint_refs` inline array, add the ticket to the CONS's `source_tickets`, and add the CONS file to `write_targets`. Keep `result_refs` reserved for SEL and VA records.

During Stage 8, Build Units map their applicable CONS IDs and Repository Build Designs compile the relevant subset into a construction contract. Stage 9 routes exactly those IDs in each selected Build Unit handoff entry. A repository builder or downstream planner must not discover applicable constraints by searching the whole blueprint.

After creating or changing CONS records, run `sync-technical-constraint-sources.mjs` before the validator. It derives each missing relative link from the canonical System Responsibility record and appends it under `## Scope And Sources`; the operation is idempotent and does not rewrite the rule prose or remove existing links.

## Verification

Run `validate-technical-constraints.mjs` after synchronization and CONS changes. It checks structural identifiers, reciprocal ticket routing, source-responsibility references, and required sections. It does not prove that the coverage pass found every semantic rule; that remains an explicit review step.
