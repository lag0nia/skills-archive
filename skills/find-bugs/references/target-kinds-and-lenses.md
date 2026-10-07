# Target Kinds and Audit Lenses

## Contents

- [Build the Goal and Contract Map](#build-the-goal-and-contract-map)
- [Classify the Target](#classify-the-target)
- [Code and Runtime](#code-and-runtime)
- [Product Design, Specifications, and Plans](#product-design-specifications-and-plans)
- [Procedures and Operational Documentation](#procedures-and-operational-documentation)
- [Configuration, Schemas, and Infrastructure](#configuration-schemas-and-infrastructure)
- [Mixed Targets](#mixed-targets)

## Build the Goal and Contract Map

Separate three questions:

- **Audit goal:** What did the user ask to inspect?
- **Target goal:** What does the target claim to accomplish?
- **Correctness contract:** Which current behaviors and invariants decide whether something is defective?

Resolve authority in this order:

1. Explicit audit instructions from the user.
2. Canonical approved artifacts such as decisions, specifications, PRDs, blueprints, contracts, or governing documentation.
3. Acceptance criteria, invariants, schemas, public interfaces, and tests.
4. Current supported behavior shown by callers and integrations.
5. Local conventions only when no stronger source exists.

Treat tests as evidence, not infallible product intent. Treat implementation behavior as supported intent only when callers, contracts, or current product use establish that it is expected.

Classify sources and claims as `APPROVED_CURRENT`, `OPEN_DECISION`, `FUTURE_DEFERRED`, `EXPLICITLY_EXCLUDED`, `SUPERSEDED`, or `CONTRADICTORY_OR_UNCLEAR`.

When sources conflict:

- apply an explicit documented precedence rule when one exists;
- otherwise return `USER_DECISION_NEEDED` if the conflict controls broad audit direction or candidate promotion;
- never select the most convenient source silently.

## Classify the Target

Use one or more target kinds:

- `CODE_RUNTIME`
- `PRODUCT_SPEC_PLAN`
- `PROCEDURE_OPERATIONS`
- `CONFIG_SCHEMA_INFRA`
- `MIXED`

Select lenses based on the target's actual contracts. Do not apply a giant checklist indiscriminately. Record selected and omitted lenses in the coverage section.

## Code and Runtime

Consider, when relevant:

- control flow and business logic;
- authentication, authorization, privilege, and tenant isolation;
- validation, parsing, schema, and serialization boundaries;
- persistence, transactions, caches, and stale state;
- concurrency, races, retries, idempotency, and partial failure;
- empty, null, boundary, numeric, date, time, and timezone behavior;
- errors, fallbacks, disabled states, maintenance, and recovery;
- API, dependency, configuration, and deployment contracts;
- resource ownership, cleanup, cancellation, and timeout behavior;
- state transitions that callers can actually trigger.

Prefer evidence in this order: real runtime reproduction, existing test, temporary test or request, temporary script or harness, then strong static analysis. Keep temporary artifacts outside production boundaries and remove them before finalization.

## Product Design, Specifications, and Plans

Audit approved artifact truth rather than asking whether every possible detail has been designed.

Consider:

- source-decision to downstream-requirement traceability;
- contradictions among decisions, research, PRD, readiness, technical notes, diagrams, and plans;
- state-machine completeness, safety, and liveness;
- authority, ownership, custody, and responsibility gaps;
- quantitative, accounting, solvency, allocation, and limit invariants;
- failure, interruption, timeout, rollback, refund, and recovery behavior;
- proof claims that exceed the evidence actually specified;
- stale approval or superseded truth surviving downstream;
- dependencies or sequences that cannot all be satisfied;
- defects that survive competent literal implementation.

Do not report:

- a deliberately open product choice;
- an explicitly deferred feature;
- an explicitly excluded area;
- implementation detail that the current artifact does not own;
- a different design preference without a concrete contract violation.

Use precise categories such as `Specification contradiction`, `Broken design invariant`, `Unhandled state transition`, `Quantitative defect`, `Cross-artifact drift`, `False assurance`, or `Literal-implementation survivor risk`. Do not claim a runtime bug when no runtime exists.

## Procedures and Operational Documentation

Consider:

- missing prerequisites and unsafe ordering;
- ambiguous or conflicting ownership and approval authority;
- commands or steps that cannot run from the stated inputs;
- contradictory states or success criteria;
- unsafe retries, duplicate execution, and partial completion;
- missing rollback, interruption, recovery, and escalation paths;
- stale state that makes later steps unsafe;
- evidence that cannot establish the procedure's claimed success.

A missing nice-to-have explanation is not a bug. Require a concrete operational failure under competent literal use.

## Configuration, Schemas, and Infrastructure

Consider:

- invalid defaults and environment divergence;
- schema/version incompatibility;
- unsafe secret, permission, network, or exposure boundaries;
- rollout, rollback, migration, and compatibility gaps;
- conflicting sources of truth;
- missing validation of values that cause concrete failures;
- resource lifecycle, ordering, capacity, and failover defects;
- configuration that makes a stated invariant impossible.

Do not treat deliberate environment differences as defects without a violated contract.

## Mixed Targets

Add cross-boundary lenses:

- plan-to-implementation drift that produces a real behavioral failure;
- contract-to-runtime mismatch;
- source-of-truth precedence errors;
- claimed verification that does not exercise specified behavior;
- implementation evidence that invalidates earlier readiness or design assumptions;
- stale reviews, approvals, or reports that remain current after upstream change.

Keep pure plan alignment separate unless it produces or masks a concrete defect. Record which source owns the expected behavior and which target violates it.

