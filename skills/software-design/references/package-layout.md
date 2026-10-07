# Software Design Package Layout

Read this reference before creating, repairing, or structurally validating a Software Design package. It owns the canonical hierarchy and the boundary between root navigation, the agent-first system model, build construction, decisions, and workflow state.

## Contents

- Canonical Layout
- Ownership And Audience
- Canonical Terms
- Conditional Creation

## Canonical Layout

```text
software-design/
  README.md
  system-model/                       # canonical agent-first logical model
    architecture.md
    domains/
      <domain-slug>/
        domain.md
        responsibilities/
          sr-xxx-responsibility.md
    behavior/
      lifecycle.yaml
      flows/
        flow-xxx-flow.md
    contracts/
      interfaces/
        iface-xxx-interface.md
      states/
        state-xxx-state.md
      invariants/
        inv-xxx-invariant.md
      security/
        sec-xxx-security-boundary.md
      scope/
        scope-xxx-boundary.md
  build/                              # created with its first workflow artifact, record, or Build Design artifact
    README.md
    units/                            # Stage 8 only
      bu-xxx-build-unit.md
    repositories/                     # Stage 8 only
      repo-xxx-repository-slug/
        README.md                     # canonical Repository Build Design
        agent-guidance.md             # only after repository guidance resolves
    records/
      constraints/                   # whenever the first decided CONS is justified
        cons-xxx-technical-constraint.md
      selections/                    # Stage 8 only
        sel-xxx-selection.md
      verification/                  # Stage 8 only
        va-xxx-capability.md
    workflow/                         # mutable/derived workflow, not build architecture
      technical-decisions.yaml        # compact canonical TD parent records
      tickets/
        <domain-slug>/
          sr-xxx/
            sr-xxx-tickets.yaml
        cross-domain-tickets.yaml
      handoffs/                       # Stage 9 only
        README.md                     # concise single-table sequential delivery-slice order groups
        <delivery-slice>.md
  ui-ux/                              # Stage 7 UI work; earlier bounded sketches allowed
    specification.md                  # presentation and interaction requirements
    prototype.html                    # simple local candidate launcher
    alternatives/<candidate>/         # candidate entrypoint, pages, and local resources
      index.html                      # linked candidate entrypoint; other pages as needed
      slides.html                     # optional self-contained screenshot review slideshow
    assets/                           # optional local supporting assets only when needed
  diagrams/
    runtime-architecture.html          # only after Runtime Diagram Readiness
    build-unit-dependency-map.canvas    # only for Stage 8 designs with 2+ Build Units
    <subject>-state-machine.canvas      # only when one persisted object's transitions need a visual
```

## Ownership And Audience

- Keep the package root limited to actual destinations: README, `system-model/`, `build/`, and `diagrams/`.
- Treat the root README as the package index with generic Blueprint Terms only. Link canonical destinations directly, including existing invariant, security, and scope collections, without duplicating their truth into summary files. Route project-specific vocabulary, parameter ownership, security terminology, and scope claims to their exact canonical owners; never use the root README as a project glossary, parameter-owner index, security taxonomy, or scope specification.
- Treat `system-model/` as canonical logical truth optimized for atomic retrieval, explicit relationships, and deterministic validation. Do not optimize its records as a long-form technical book.
- Do not create a parallel generated summary surface. The canonical architecture, Domain, System Responsibility, flow, contract, and lifecycle records already own that information.
- Treat `build/` as the concrete construction entry point. Before Stage 8, its README is a compact lane index. Once Stage 8 exists, the same README becomes the detailed human construction guide: it explains every Repository and Build Unit directly enough to supply a usable construction mental model, while Build Units and Repository Build Designs retain exact construction truth. Derive cross-unit realization coverage from reciprocal System Responsibility and Build Unit fields; do not create a second topology record.
- Treat `build/records/` as one supporting-record family while preserving the distinct semantics of Technical Constraints (`CONS`), Implementation Selections (`SEL`), and Verification Capabilities (`VA`).
- Treat `build/workflow/` as operational state around the design. `technical-decisions.yaml` owns compact TD parent context and history, tickets own independently answerable questions and workflow, and handoffs are derived transitions to Delivery Planning. None is canonical build architecture or a substitute for durable system truth.
- Treat conditional `ui-ux/` as the owner of presentation and interaction requirements. `specification.md` owns requirements, explicit candidate selection, reviewed journey coverage, pending prototype changes, and material limitations. `prototype.html` is a simple launcher; each `alternatives/<candidate>/` holds a single-page or multi-page candidate and its local resources. Select the actual entrypoint without copying. An optional `alternatives/<candidate>/slides.html` is a derived, self-contained screenshot slideshow of that candidate; it is never an entrypoint, selection, or review evidence, and its temporary captures are not package artifacts. Existing product and system-model owners retain behavior, state, and correctness authority.
- Represent each first-party repository as one folder. Its `README.md` owns repository construction truth. Its optional `agent-guidance.md` is a concise derived projection for the future repository-root `AGENTS.md`.
- Structured VOs remain inside their canonical `INV-xxx` or `SEC-xxx` records; do not create a blueprint assurance folder or one file per VO. Repository evidence mappings live later in one tracked implementation-repository `assurance/coverage.yaml`. Generated normalized results and the one HTML report live outside this canonical package at `<software-design-package-parent>/.software-design-assurance/`; the repository hosting the design workspace must ignore and verify that exact generated path.

## Canonical Terms

- A **System Domain** is a coherent logical concern. It groups System Responsibilities but is not a repository, deployment unit, build phase, team, or DDD bounded context unless the approved design explicitly makes it one.
- A **System Responsibility** is one stable logical behavior, authority, state, or artifact boundary with a canonical `SR-xxx` record. It is not assumed to be independently buildable.
- A **Build Unit** is an independently buildable and testable software artifact with a canonical `BU-xxx` record.
- A **Repository** is a source-control and workspace container for one or more Build Units.
- Map System Responsibilities to Build Units many-to-many.

Use exactly three digits for new `SR`, `FLOW`, `IFACE`, `STATE`, `INV`, `SEC`, and `SCOPE` identifiers. Preserve a wider established width only when continuing an approved package that already uses it consistently.

## Conditional Creation

- Create `system-model/architecture.md`, domain records, and System Responsibility records during Stages 1–3.
- Create canonical flows and `system-model/behavior/lifecycle.yaml` during Stage 4.
- Create only justified contract records during Stage 5. Do not create empty contract-category folders.
- Create `build/README.md` when the first workflow artifact, Technical Constraint, or Stage 8 construction artifact is created. It remains the single build entry point even when only one lane exists. When the first Build Unit is created, add and thereafter synchronize its detailed Repository-and-Build-Unit construction guide; do not create another summary file or GitHub Project README.
- Create `build/workflow/technical-decisions.yaml` only when the first genuine TD is established, and create `build/workflow/tickets/` when ticket tracking begins. Either workflow surface may exist without activating Stage 8 construction.
- Create `build/records/constraints/` whenever the first decided `CONS-xxx` is justified, including before Stage 8. Create `build/units/`, `build/repositories/`, and justified `build/records/selections/` and `build/records/verification/` during Stage 8. During the same pass, make every System Responsibility's `realized_by` field exactly reciprocal with Build Unit `source_responsibilities`; use an external/no-code Build Unit with an explicit repository disposition when no first-party artifact exists.
- Create `build/workflow/handoffs/` only during Stage 9. Create its concise `README.md` sequence index before the first slice handoff, then keep one current Markdown file per delivery slice; multiple current slice handoffs may coexist, while superseded revisions of the same slice remain in version control. The index is mutable workflow navigation, not a handoff receipt or snapshot owner.
- Stage 7 includes required UI prerequisites, exploration, reconciliation, and completion when human-facing surfaces are in scope; earlier bounded sketches are allowed. Create one specification, a simple launcher, and linked folder-based candidates. Stage 8 consumes the selected candidate and reviewed coverage. Non-UI scopes require no prototype. Use one current format without legacy compatibility branches; do not modify consumer blueprints merely because this skill changed.

Do not infer permission to rewrite an established package merely because this skill or its templates changed. Repairs remain bounded by the user's requested package and approved checkpoint scope.
