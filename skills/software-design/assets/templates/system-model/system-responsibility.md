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

## Responsibility Overview

Introduce the practical job, collaborators, inputs and outcomes in ordinary language. Explain a useful success/exception path and necessary concepts before the precise contract. This opening adds understandable precision to the domain guide; do not copy the technical Purpose paragraph. Use meaningful names and descriptive source links. Preserve all exact sections below.

## Agent-First Canonical Reference

## Purpose

State the one logical behavior, authority, state, or artifact boundary this record owns. Where needed, explain its immediate relationship to callers, consumers, or external actors and introduce concepts needed to understand the rules below; link shared definitions rather than repeating their specifications.

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
