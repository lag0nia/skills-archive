# Software Design

This package is the implementation-grade technical blueprint for: TBD.

It sits after product or technical framing and before code-level implementation planning, code execution, or deployment work. It separates the detailed logical system model from the concrete build model and keeps diagrams and workflow navigable without promoting every artifact category to the package root.

Source brief: TBD. Do not duplicate the source brief here; use it as upstream context.

## Read By Intent

### Build The Codebase

- [Build](./build/README.md): entry point for build workflow, decided Technical Constraints, concrete construction, and current readiness. Omit until the first build-owned artifact exists.
- [Build Units](./build/units/): independently buildable and testable artifacts with unit-owned module architecture. Omit until Stage 8 exists.
- [Repositories](./build/repositories/): repository/workspace construction contracts and their nested agent guidance. Omit until repository mapping exists.
- [Build Records](./build/records/): grouped Technical Constraints, Implementation Selections, and Verification Capabilities. Omit until the first reusable build record exists.
- [Build Workflow](./build/workflow/): compact Technical Decision records, implementation-detail tickets, and Delivery Planning handoffs. Omit until workflow artifacts exist. Human-readable decisions and tickets are projected to GitHub.

### Understand The System

- [Canonical System Model](./system-model/architecture.md): logical architecture, Domain map, authority boundaries, and routes to exact design truth.
- [Lifecycle Data](./system-model/behavior/lifecycle.yaml): canonical structured lifecycle stages and terminal outcomes. Omit until Stage 4 exists.
- [System Flows](./system-model/behavior/flows/): exact ordered behavior, failure routes, outcomes, and invariants. Omit until Stage 4 exists.

### Global Contract Routes

- [Invariants](./system-model/contracts/invariants/): cross-responsibility and cross-flow correctness rules. Omit until the category exists.
- [Security Boundaries](./system-model/contracts/security/): threat, trust, protected-authority, and control records. Omit until the category exists.
- [Scope Boundaries](./system-model/contracts/scope/): explicit deferred or excluded technical capabilities. Omit until the category exists.

### Supporting Navigation

- [UI/UX Design](./ui-ux/specification.md): presentation and interaction requirements plus Stage 7 prototype discovery and reconciliation for human-facing surfaces; Stage 8 consumes the reviewed design. Omit until the conditional UI/UX lane exists.
- [Runtime Architecture](./diagrams/runtime-architecture.html): interactive view of what runs, its boundaries, central coordinator, and direct relationships. Omit this bullet until Runtime Diagram Readiness passes.
- [Build Unit Dependency Map](./diagrams/build-unit-dependency-map.canvas): Stage 8 build prerequisites and potential parallelism. Omit this bullet until at least two canonical build units exist.

## Blueprint Terms

- A **System Domain** is a coherent logical concern grouping System Responsibilities. It is not automatically a repository, deployment, team, or DDD bounded context.
- A **System Responsibility** is a stable logical behavior, authority, state, or artifact boundary with one owning Domain and one `SR-xxx` record. It is not assumed to be independently buildable.
- A **technical decision** is one consequential technical subject whose related tickets must form a compatible combined choice. Its compact canonical record lives in build workflow; GitHub provides the human-readable issue.
- A **technical constraint (CONS)** is one decided durable technical must/must-not rule. Its linked Software Design sources explain the mechanism; Build Design maps it to the artifacts and repositories that must preserve it.
- An **implementation-detail ticket** tracks one independently answerable implementation choice and the Build Units it affects once Stage 8 Build Design exists. Every ticket explicitly links one parent TD or `null`.
- An **implementation selection (SEL)** is a reusable approved or inherited implementation direction that applies to named build units while preserving named Software Design contracts. It does not define system behavior.
- A **Build Unit** is an independently buildable and testable software artifact. System Responsibilities and Build Units map many-to-many.
- A **Repository Build Design** is the Stage 8 construction contract for one source-control repository and any workspace it contains. It maps member build units, applicable CONS records, and repository-only constraints.
- A **repository constraint (RC)** is a durable repository-only rule such as package dependency direction, public imports, release policy, or fixture topology. It does not redefine Software Design behavior.
- A **module** is an internal folder, package, namespace, or code boundary inside one build unit.
- A **verification capability (VA)** is a reusable environment, harness, simulator, fixture system, or public-network route that can support evidence for named Software Design claims across named build units. It does not redefine those claims or itself establish that evidence has passed.
- A **delivery slice** is the capability selected for planning and may cover part of one build unit, one complete unit, or several units.
- A **delivery handoff** reports whether a selected delivery slice has resolved decisions, known dependencies, and a credible verification route.
- **UI/UX Design** is the conditional presentation-and-interaction specification with Stage 7 prototype discovery and reconciliation for human-facing surfaces. Stage 8 consumes the reviewed design. It references product ownership and Software Design behavior rather than replacing them.
- A **workpack** is the downstream implementation plan used to build and test the selected slice; it is not part of Software Design.

The root README defines only these generic blueprint terms and navigation. Route project-specific vocabulary, parameter ownership, security terminology, and scope claims to their exact canonical System Responsibility, interface, state, invariant, security, or scope record.
