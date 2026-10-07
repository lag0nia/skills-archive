---
type: system-responsibility
id: SR-001
name: Responsibility name
domain: domain-slug
depends_on: "None."
participates_in: "FLOW-001"
realized_by: "None."
---

# SR-001 — Responsibility Name

## Purpose

State the one logical behavior, authority, state, or artifact boundary this record owns.

## Owns

- Name concrete owned behavior and facts.

## Must Not Own

- Name adjacent authority, execution, storage, or policy that must remain elsewhere.

## Inputs And Outputs

| Direction | Artifact or fact | Counterparty | Consumer interaction need | Contract |
| --- | --- | --- | --- | --- |
| Input | TBD | `SR-xxx` or external system | State how the consumer initially obtains, refreshes, or recovers this fact. | `IFACE-xxx.ACT-xxx` |

## State And Artifacts

Link every directly owned or consumed `STATE-xxx` record and explain only the responsibility-local meaning.

- TBD.

## Failure And Recovery

State rejection, timeout, retry, reroute, and recovery behavior owned by this responsibility.

## Invariants

- [INV-001](../../../contracts/invariants/inv-001-example.md): state the local preservation obligation.
