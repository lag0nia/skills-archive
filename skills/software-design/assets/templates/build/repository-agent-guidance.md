---
type: repository-agent-guidance
repository: REPO-xxx
baseline: maintainability-agent-guidance-baseline
source_tickets: "TICKET-xxxx"
---

# REPO-xxx — Repository Agent Guidance

This is a derived implementation guidance artifact for the repository. It projects the resolved Repository Build Design and maintainability baseline into concise rules for implementation agents. It is not a competing architecture source.

## Canonical Sources

- Repository Build Design: [REPO-xxx](./README.md)
- Source tickets: [TICKET-xxxx](../../workflow/tickets/<domain>/sr-xxx/sr-xxx-tickets.yaml#ticket-xxxx)
- Baseline: `maintainability-agent-guidance-baseline`

## Hard Rules

State the repository, public-import, dependency-direction, security, release, and verification rules that agents must follow.

## Defaults And Exception Guidance

State the default code shape, local-first and shared-last rules, duplication policy, and the evidence required for an exception.

## Rationale Comments

State when a non-obvious implementation choice needs an inline rationale comment or a canonical design link.

## Stop And Escalate

State the public seam, security boundary, invariant, release, or cross-package changes that require a ticket or user direction before implementation.

## Verification Expectations

State the narrowest relevant checks, repository commands, and final-diff review expectations.
