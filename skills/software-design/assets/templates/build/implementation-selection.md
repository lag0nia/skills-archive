---
type: implementation-selection
id: SEL-xxx
title: Implementation selection title
state: Proposed
technical_sources: "SR-001, FLOW-001, IFACE-001"
affected_scopes: "BUILD_UNIT:BU-xxx"
source_tickets: "TICKET-xxxx"
inheritance_evidence: "None."
needed_before: Delivery Planning
---

# SEL-xxx Implementation selection title

Explain the concrete implementation choice, why Delivery Planning needs it, and which approved Software Design boundaries it must preserve. Do not use this record for a decision that changes system behavior, authority, an externally visible interface, a lifecycle rule, or a correctness claim; route that decision to Software Design instead.

`source_tickets` identifies the implementation-detail tickets that own proposal and approval workflow. Use `None.` only for an `Inherited` selection, and then replace `inheritance_evidence` with the repository, environment, or canonical source that establishes the inherited fact. Every listed ticket must reciprocally name this `SEL-xxx` in `result_refs`.

## Affected Scopes

List every `BUILD_UNIT:BU-xxx` affected by this selection. `technical_sources` separately identifies the System Responsibilities, flows, and contracts it preserves. A selected Build Unit Routing Index must link this record from each relevant unit.

## Options And Consequences

Explain viable options, including their repository, environment, security, cost, migration, and verification consequences. State reversibility rather than implying it.

## Selected Or Inherited Direction

State the approved or inherited choice. If the state is `Proposed`, explain what user approval is needed. Use `Deferred Outside Selected Scope` only when the Delivery Planning handoff explicitly excludes the affected capability from the selected delivery scope.

## Planning And Verification Impact

State the build-unit/module boundary, command, environment, or verification route that this choice makes possible. Link Build Unit and Software Design sources.
