---
type: repository-build-design
id: REPO-xxx
name: Repository name
member_build_units: "BU-xxx, BU-yyy"
technical_constraints: "CONS-xxx, CONS-yyy"
discovery_status: blocked
discovery_blockers: "TICKET-xxxx"
---

# REPO-xxx — Repository name

## Repository Overview

Replace this guidance with two to four short, connected paragraphs for a human reader. Explain what the repository contributes, which Build Units live here, why they share one source-control and workspace boundary while remaining independently buildable and testable, and how their public artifacts, direct dependencies, shared tooling, and internal-versus-published consumption boundaries fit together. Link canonical Build Unit records when that helps orientation, but do not turn this overview into a table, checklist, or duplicate of their detailed contracts. Use Repository and Build Unit names in this overview and Material Workspace Tree, never bare IDs. On a first cross-record mention that needs traceability, append the ID in parentheses after the name; use the name alone for later mentions.

This overview is a synchronized reading aid. Keep it aligned with frontmatter and the canonical reference below; never place a repository constraint, technical constraint, public-API rule, command, release rule, verification obligation, or discovery blocker only here.

### Material Workspace Tree

Replace this template guidance with a compact fenced `text` workspace-level tree: repository root, workspace or package roots, each member Build Unit home, shared source/test/fixture/generated/evidence/tool roots when material, and root configuration. Do not copy these instructions into a record. Do not expand internal member code here; link each Build Unit's `## Module Architecture` for that detail. Omit vendor directories, caches, build output, and ordinary configuration noise.

---

## Agent-First Canonical Reference

The sections below are the authoritative construction reference for implementation agents and technical review. Preserve their exact facts and stable headings; they are not a second human summary.

### Repository And Workspace Shape

State the exact source-control repository boundary, workspace root and material package paths. Distinguish repository, workspace, package, and independently buildable artifact only where that distinction affects construction or verification; do not repeat the overview.

### Member Build Units

List every member `BU-xxx`, its package or code path, public artifact, and relationship to the other members. This must agree with each build unit's `repository` field.

### Applicable Technical Constraints

List every `CONS-xxx` that applies to one or more member units. State the affected package or module beside each ID. This is the complete construction route for imported Software Design rules; do not make a builder rediscover them by searching the blueprint.

### Repository Constraints

Define only repository-realization `RC-xxx` rules: public-import/dependency direction, source versus published-package consumption, root/package configuration, fixture/generated-code topology, release restrictions, or other durable repository boundaries. Each RC must state its rule, affected scope, and verification intent. Do not make RCs for cosmetic or reversible local discretion.

### Version-Control And Generated-File Policy

**Must track:** List canonical source, configuration, lockfiles, workflows, fixtures, evidence, manifests, and other reviewable repository inputs that must never be hidden by ignore rules.

**Must ignore:** List disposable or machine-local dependency directories, build products, coverage, caches, test reports, logs, editor/OS metadata, and local environment files implied by the selected stack.

**Generated-output disposition:** Distinguish transient outputs, reproducibly generated untracked outputs, and any intentionally versioned generated artifacts with their review rule.

**Secret/template rule:** State which secret-bearing files remain local and which redacted example or schema files may be committed.

**Verification:** Name the repository-local command or deterministic procedure that proves representative must-ignore and must-track paths follow this policy.

### Repository Contract Coverage

Record the disposition of each required repository contract lane:

- `repository-module-conventions`: `inherited` — Source: [authoritative repository rule](path/to/repository-rule.md).
- `code-construction-public-api`: `resolved` — Source: [TICKET-xxxx](../../workflow/tickets/<domain>/sr-xxx/sr-xxx-tickets.yaml#ticket-xxxx).
- `maintainability-agent-guidance`: `adapted` — Reason: explain the repository-specific exception; Affected scope: name the packages or units; Verification/revisit: state the proof or revisit condition; Source: [TICKET-yyyy](../../workflow/tickets/<domain>/sr-xxx/sr-xxx-tickets.yaml#ticket-yyyy).

For each lane, link the source ticket or authoritative inherited rule. An adapted or not-applicable lane must state its reason, affected scope, and verification or revisit condition. Use `maintainability-agent-guidance-baseline` as the portable baseline.

### Agent Guidance Projection

State the derived artifact and future repository root target:

**Derived artifact:** [Repository agent guidance](./agent-guidance.md)
**Repository root target:** `AGENTS.md`

The projection must summarize the canonical repository/module contract, code-construction/public-API contract, maintainability baseline, hard rules, defaults with exception guidance, rationale-comment policy, stop/escalate conditions, and verification expectations. Keep those actionable rules in `agent-guidance.md`; do not duplicate their full text in this Repository Build Design.

### Commands, Release, And Verification

State the repository-wide commands, release shape, verification layers, and linked SEL/VA records. Mark a command `Planned — unverified until scaffold exists` until execution evidence exists.

### Assurance Manifest And Report

Apply the active Software Design skill's Assurance Traceability contract. If any member Build Unit owns a structured VO, require exactly one authored, reviewed, and tracked repository-root `assurance/coverage.yaml` for all member units. State `Planned — implementation repository not yet materialized` until it exists. If no member owns a VO, state `Not applicable — <concrete reason>`.

The manifest maps exact VO IDs to exact evidence selectors or non-test evidence bindings. Repository adapters emit normalized results; they do not place generated reports in this repository. The one blueprint-wide generated report belongs in `<software-design-package-parent>/.software-design-assurance/` and remains ignored and non-canonical.

### Discovery Status

`discovery_status` is exactly `complete` or `blocked`. `discovery_blockers` is `None.` only when discovery is complete; otherwise it lists the material unresolved `TICKET-NNNN` tickets or an explicit constraint-coverage gap. A ready Stage 9 handoff cannot rely on a blocked repository discovery pass.

### Local Discretion

List only reversible choices that do not alter a CONS, RC, build-unit boundary, command, environment, release, or Verification Obligation.
