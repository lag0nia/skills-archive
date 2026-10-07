---
type: build-unit
id: BU-xxx
name: Build unit name
kind: application
responsibility_family: Responsibility family
source_responsibilities: "SR-001, SR-002"
depends_on_build_units: "None."
repository: "REPO-xxx"
code_path: "path/from-repository-root"
repository_disposition: "None."
technical_constraints: "CONS-xxx, CONS-yyy"
ui_ux_applicability: "applicable" # applicable | not-applicable
ui_ux_disposition: "Human-facing consumer application; realize the reviewed UI/UX Design artifacts." # or a concrete non-UI reason
---

# BU-xxx — Build unit name

Software Design sources: TBD.

## Build Unit Overview

Replace this guidance with two to four short, connected paragraphs for a human reader. Explain the independently buildable and testable artifact, the responsibility family it realizes, what it contributes to the rest of the system, and where it lives (or its concrete external/no-code disposition). Then explain why its build/test boundary is separate, its material direct dependencies and public input/output relationship, and the authority or responsibility it deliberately does not own. Link the Repository Build Design or direct Build Unit dependencies when that helps orientation, but do not turn this overview into a table, checklist, or duplicate of the detailed contract. Use Repository and Build Unit names in this overview and Detailed Code Shape, never bare IDs. On a first cross-record mention that needs traceability, append the ID in parentheses after the name; use the name alone for later mentions.

This overview is a synchronized reading aid. Keep it aligned with frontmatter and the canonical reference below; never place a constraint, exact dependency classification, interface, command, security boundary, or verification obligation only here.

### Detailed Code Shape

Replace this template guidance with a compact, source-derived visual map of how a reader will encounter this Build Unit in code. Do not copy these instructions into a record. It is a reading layer, not a second implementation plan or owner of detailed facts. Derive it from the selected or inherited canonical interfaces, state, constraints, and Build Unit contract; once a ticket is finished, do not treat the ticket as the durable source of an action or interface.

Use the fewest visual blocks that answer the reader's material questions:

- a materially complete shallow file tree for a new scaffold, including source roots, public entrypoints, cross-boundary types or schemas, state/authority owners, generated or release boundaries, and proof-owning test roots;
- an exhaustive Supported Actions map when this unit has a selected action or capability surface, including material read and recovery actions;
- a public seam block for exported signatures, routes, events, types, or commands when it makes the boundary clearer;
- a critical call, state, component, or proof shape only when it carries material risk or ownership; and
- for a UI unit, a behaviorally meaningful component tree showing state owners, hooks, and module boundaries rather than presentational leaves.

Write at least one compact fenced visual block (normally `text`) for a first-party code-bearing unit. Do not list ordinary private helpers, every test case, vendor/build output, or a generic architecture diagram. A small library may need only one export/type block. For an external or no-code unit, state `Not applicable —` followed by its concrete disposition. Keep detailed sections below authoritative for exact paths, interfaces, constraints, commands, and Verification Obligations.

Describe only the material internal folders, packages, namespaces, generated-code locations, public seams, and allowed dependency direction. Use actual module names or paths; do not invent global module IDs or force a fixed layered architecture.

---

## Agent-First Canonical Reference

The sections below are the authoritative construction reference for implementation agents and technical review. Preserve their exact facts and stable headings; they are not a second human summary.

### Artifact And Code Location

State the artifact type, repository/workspace/package path, runtime, language, supported versions, and material inherited evidence. `repository` and `code_path` are the canonical machine-readable home for a first-party unit. Use `repository: "None."`, `code_path: "None."`, and a concrete `repository_disposition` only for an external or no-code unit. Distinguish build, release, and deployment boundaries when they differ.

**Repository Build Design:** Link the owning `REPO-xxx` record. This field maps the unit to the source-control repository; state any workspace/package path above.

### Applicable Technical Constraints

List every `CONS-xxx` that this unit must preserve. These records are the complete route to applicable technical dos and don'ts; do not make a repository or handoff rediscover them by searching the whole Software Design package.

### Source Responsibility Mapping

Explain which subset from each `source_responsibilities` entry is realized here. Keep the mapping many-to-many and link canonical System Responsibility records.

### Interfaces And Dependencies

Describe public and internal seams, protected data/authority/security boundaries, and dependencies on other `BU-xxx` units or external systems. Classify build-time, runtime, development, test, or deployment dependencies when material.

### Operational Composition And Runtime Profiles

Include this section only when the unit owns a runnable or otherwise artifact-appropriate target outcome, runtime-profile entrypoint, cross-artifact composition, startup/shutdown, dependency provisioning, bootstrap/seed/migration behavior, persistence/resume/reset, or acceptance proof. Name the intended actor or consumer, exact profile claim, public entrypoint or invocation, minimum observable result, external prerequisites or approved substitutes, and the command/procedure that will prove it. A verification-only profile must say so. Fixed fixture identities and provider fakes belong only to an explicit test or demo composition. Remove this section when another Build Unit owns composition and this unit makes no independent runtime-profile claim; state that non-ownership in `Interfaces And Dependencies` instead.

### UI/UX Realization

Include this section when `ui_ux_applicability: "applicable"`; omit it when the explicit decision is `not-applicable`. Link the applicable requirements in `ui-ux/specification.md`, the actual selected candidate entrypoint under `ui-ux/alternatives/<candidate>/` and reviewed specification journey anchors, and any upstream UI/UX owner. Name the modules or components that realize them, keep product behavior linked to its canonical Software Design owner, and distinguish demo-only simulations and fake data from implementation requirements. For each linked journey, point to the `Material Interaction Bindings` entries or canonical state sources that supply its real operations and data instead of restating them. The selected candidate is the presentation and interaction target; state only the implementation discretion the specification explicitly permits.

### Material Interaction Bindings

Map only material cross-Build-Unit or external interactions. For each `IFACE-xxx.ACT-NNN`, state the physical route, producer and consumer roles, contract/schema/type source, audience or access boundary, and the conformance procedure that proves the physical representation matches the logical contract. Mark the binding `Planned` or `Verified`; a verified pre-existing producer needs current consumer-side evidence. Do not list private helper calls. If the unit has no material cross-unit or external interaction, state `**Material interaction bindings:** \`None.\` — <concrete reason>`.

| Logical interaction | Physical binding | Producer / consumer role | Contract or representation source | Audience or access | Conformance | State |
| --- | --- | --- | --- | --- | --- | --- |
| `IFACE-xxx.ACT-xxx` | Route, export, event, artifact path, command, or manual handoff | Producer or consumer | Canonical schema/type/format owner | Public, internal, authenticated, authorized role, or named operator | Exact check or `Not applicable — <reason>` | `Planned` or `Verified` |

### Module Architecture

Record the exact material module boundaries, responsibility of each module, allowed dependency direction and forbidden imports/cycles, public versus internal seams, and the source System Responsibilities they realize. The Detailed Code Shape above is the reader-facing visual; do not repeat it here when the exact table or prose already covers the same fact.

### Commands And Verification

| Purpose | Command | Status | Evidence or limitation |
| --- | --- | --- | --- |
| Build | TBD | `Verified` or `Planned — unverified until scaffold exists` | TBD |
| Test | TBD | `Verified` or `Planned — unverified until scaffold exists` | TBD |
| Run or consume required target profile, when applicable | TBD or `Not applicable — <artifact-specific reason>` | `Verified`, `Planned — unverified until scaffold exists`, or `Not applicable` | Target outcome and profile limitation |

Link relevant `VA-xxx` capabilities when the unit needs reusable evidence infrastructure. Ordinary checks need no VA record.

### Verification Obligation Assignments

Apply the active Software Design skill's Assurance Traceability contract. When structured VOs exist, list every obligation for which this Build Unit must supply evidence. One VO may appear in several Build Units, but every row here is one exact assignment; assignment is not passing evidence.

| Verification Obligation | Evidence responsibility | Required evidence or observation | State |
| --- | --- | --- | --- |
| [`INV-001.VO-001`](../../system-model/contracts/invariants/inv-001-name.md#inv-001.vo-001) | Producer, consumer, joint, repository-wide, or external responsibility | Exact routed requirement | `Planned` or `Existing — freshness unverified` |

If no structured VO applies, replace the table with `**Verification obligation assignments:** \`None.\` — <concrete reason>`.

### Local Discretion

List only reversible choices that do not change Software Design truth, the build-unit boundary, material commands, environments, security constraints, or Verification Obligations.
