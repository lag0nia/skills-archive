---
type: system-flow
id: FLOW-001
name: Flow name
responsibilities: "SR-001, SR-002"
contracts: "IFACE-001, STATE-001, INV-001"
starts_when: Concise entry predicate
ends_when: Concise completion or reroute predicate
---

# FLOW-001 — Flow Name

## Purpose

State why this branch or mechanism exists and the authority or safety distinction it preserves.

## Preconditions

- State exact entry facts and their canonical owners.

## Ordered Transitions

| Step | Owner | Requires | Action | Produces | State change | Must not imply |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `SR-001` | Linked fact or artifact | One bounded action | Linked output | `STATE-001`: before → after | Prohibited inference |

## Failure And Reroute

- State local rejection, refusal, timeout, retry, cancellation, and reroute behavior.

## Outcomes

- State the exact completion, terminal, or reroute meaning.

## Invariants

- [INV-001](../../contracts/invariants/inv-001-example.md): state the flow preservation obligation.

