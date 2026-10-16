---
type: system-architecture
design_format: 2
name: System name
assurance_id: "None."
system_guide: adopted
domains: "domain-one, domain-two"
global_invariants: "INV-001"
security_boundaries: "SEC-001"
scope_boundaries: "None."
---

# System Architecture

The [architecture guide](../guide/architecture.md) explains the system for readers. This record holds its exact purpose, binding, authority and boundaries.

Source brief: TBD

## Purpose And Binding

State the system purpose and the canonical identity or binding that lets its domains refer to the same subject. Exact lifecycle transitions remain in their flow and state owners.

## Authority And Sources Of Truth

State which domain or external system owns each authoritative fact and which projections or observations must not replace it.

## System Domains

| Domain | Purpose | System Responsibilities |
| --- | --- | --- |
| [Domain name](./domains/domain-one/domain.md) | Concise concern | `SR-001`, `SR-002` |

State material relationships between domains concisely; the architecture guide explains them for readers. The table must cover every canonical domain exactly once and agree with frontmatter.

## Cross-Domain Boundaries

List only boundaries that constrain more than one domain. Link exact `IFACE`, `STATE`, `INV`, or `SEC` owners rather than repeating their rules.

- TBD.
