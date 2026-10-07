---
type: technical-constraint
id: CONS-xxx
title: Constraint title
technical_sources: "SR-001, SR-002"
affected_responsibilities: "SR-001, SR-002"
source_tickets: "None."
---

# CONS-xxx — Constraint title

## Rule

State one decided, durable technical `must` or `must not` rule. This record is the canonical concise statement of the rule; link its surrounding architecture, System Responsibility, flow, or contract sources for the mechanism and rationale. Do not create this record for an unanswered question, a reversible local choice, or a rule that merely repeats an implementation-selection detail.

## Scope And Sources

Name the affected System Responsibilities and link the exact canonical sources. `source_tickets` is `None.` for a backfilled constraint with no originating ticket; otherwise it names each resolved `TICKET-NNNN` whose answer established or changed this rule.

## Verification Intent

State the required category of proof, such as deterministic unit fixtures, boundary rejection checks, integration scenarios, or a reusable `VA-xxx` capability. Do not prescribe a delivery-specific command, test file, or evidence artifact here.
