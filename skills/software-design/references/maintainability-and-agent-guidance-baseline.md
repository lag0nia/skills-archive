# Maintainability And Agent Guidance Baseline

Use this reference during Build Design and repository-discovery work for every first-party repository that is greenfield or materially reorganized. It is a portable default, not a substitute for repository-specific decisions.

## Baseline Identity

Use `maintainability-agent-guidance-baseline` when recording which defaults were inherited by a Repository Build Design or its derived `AGENTS.md` guidance.

## Default Code-Shaping Principles

- Prefer the simplest design that satisfies the real requirement.
- Keep behavior local to its owning module until multiple real consumers, a stable cross-boundary contract, or clear ownership friction justifies extraction.
- Prefer a small amount of deliberate duplication over an abstraction with unclear ownership, unclear reason to change, or speculative future reuse.
- Prefer plain data, direct functions, and straightforward modules before classes, wrappers, managers, services, factories, base types, or adapter layers. Admit those shapes only when they own real state, lifecycle, invariants, polymorphism, capability boundaries, or change isolation.
- Keep public outputs minimal and cohesive. Do not return redundant or derivable values merely because they might be useful later.
- Preserve clear names after refactors. Rename stale, misleading, contradictory, or overly generic identifiers when the affected code is already being changed.
- Do not add complexity for hypothetical edge cases, framework fashion, symmetry, or future flexibility. Complexity is justified by a concrete correctness, security, performance, lifecycle, compatibility, boundary, or operational requirement.

## Rationale Rule For Non-Obvious Complexity

When a reasonable maintainer might ask why the code was not implemented more simply, record the reason at the closest durable location. State the simpler alternative, why it is insufficient, and the constraint or invariant that requires the chosen form.

- Use an inline code comment for a local implementation choice, unusual ordering, deliberate duplication, non-obvious file placement, compatibility workaround, or security-sensitive guard.
- Use a canonical design record for a cross-module, public-API, repository, architectural, or long-lived decision; a local comment may point to its stable decision or constraint ID.
- Use a test, fixture, or assertion for observable behavior and exact invariants; explain the surprising setup when the test would otherwise look arbitrary.

Do not comment obvious syntax or restate what a readable function already says. Keep rationale comments plain, specific, and maintained with the code. A comment records a resolved reason; it does not authorize an otherwise unresolved architectural choice.

## Agent Change Defaults

Agents following this baseline must:

- read the repository's `AGENTS.md`, canonical design links, and local conventions before changing code;
- preserve unrelated work and avoid opportunistic refactors;
- explain the owner, reason to change, and evidence before adding a file, abstraction, wrapper, shared helper, or new public output;
- stop and ask when a proposed simplification or added complexity changes a public seam, security boundary, invariant, release behavior, or cross-package contract;
- run the narrowest relevant verification and review the final diff for stale names, dead code, redundant outputs, wrapper chains, leaked errors, and unjustified complexity.

## Repository Adaptation

The repository may adapt or override a baseline default only through an explicit implementation-detail ticket and canonical Repository Build Design outcome. Record the reason, affected scope, consequence, and verification expectation. Do not silently omit a baseline area because it feels like style; classify it as inherited, adapted, or intentionally not applicable.

## Derived AGENTS Guidance

After the repository contract lanes are resolved, derive a concise repository-scoped `AGENTS.md` guidance artifact from this baseline, the resolved repository/module contract, the resolved code-construction/public-API contract, the Repository Build Design, and applicable Technical Constraints. Include the baseline identity, canonical source links, hard rules, default rules with exception guidance, stop/escalate conditions, and verification expectations. Keep the detailed design in its canonical artifacts; `AGENTS.md` is an execution projection and must not become a competing architecture source.
