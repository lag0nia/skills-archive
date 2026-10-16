---
type: system-state
id: STATE-001
name: State model name
authority: "SR-001"
participants: "SR-002"
flows: "FLOW-001"
related_contracts: "INV-001"
---

# STATE-001 — State Model Name

## Authority And Identity

State who owns the canonical state and how one instance is identified.

## States

List every state. `Terminal` is a machine value: exactly `Yes` or `No`, whatever language explains the record. Write conditions, qualifications and reopening rules in `Meaning`, the transitions or Observation And Finality, never in the `Terminal` cell.

| State | Meaning | Terminal |
| --- | --- | --- |
| Initial | Exact meaning | No |

## Transitions

| From | Event or fact | Authority | To | Rejection or guard |
| --- | --- | --- | --- | --- |
| Initial | TBD | `SR-001` | Next | TBD |

## Observation And Finality

State how observation, confirmation, finality, and authoritative state differ.

## Invalid Transitions

- State prohibited transitions or collapsed-state interpretations.

