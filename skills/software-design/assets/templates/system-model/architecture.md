---
type: system-architecture
name: System name
assurance_id: "None."
domains: "domain-one, domain-two"
global_invariants: "INV-001"
security_boundaries: "SEC-001"
scope_boundaries: "None."
---

# System Architecture

Source brief: TBD

## Purpose And Binding

State the system purpose and the canonical identity or binding that lets its domains refer to the same subject. Keep this static; lifecycle sequence belongs in canonical flow and lifecycle records.

## Authority And Sources Of Truth

State which domain or external system owns each authoritative fact and which projections or observations must not replace it.

## System Domains

| Domain | Purpose | System Responsibilities |
| --- | --- | --- |
| [Domain name](./domains/domain-one/domain.md) | Concise concern | `SR-001`, `SR-002` |

The table must cover every canonical domain exactly once and agree with frontmatter.

## Cross-Domain Boundaries

List only boundaries that constrain more than one domain. Link exact `IFACE`, `STATE`, `INV`, or `SEC` owners rather than repeating their rules.

- TBD.
