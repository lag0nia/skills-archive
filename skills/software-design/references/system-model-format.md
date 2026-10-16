# Hybrid System Model

Read this reference before creating or changing `system-model/` records. Read [package-layout.md](package-layout.md) first for hierarchy and terminology.

## Contents

- Design Rules
- Architecture Record
- Domain Records
- System Responsibility Records
- Flow Records
- Lifecycle Data
- Contract Records
- Package Navigation
- Validation

## Design Rules

Use Markdown records with YAML frontmatter for subjects that need both exact relationships and bounded explanation. Use JSON-compatible YAML for the lifecycle graph. Prefer one independently retrievable concern per file.

Every canonical record must:

- have one stable typed identifier where its record family defines one;
- declare relationships in frontmatter rather than making an agent infer them from prose;
- state positive ownership and explicit exclusions;
- link exact canonical owners instead of repeating their detail;
- use predictable required sections and `None.` only when the absence is meaningful;
- keep rationale short and place durable rules in their exact contract owner; and
- leave the reader-facing narrative to the [System Guide](system-guide.md) and route exhaustive rules to their exact owners.

Within the existing `Purpose` or other explanatory section, make the record's subject understandable before its detailed rules: explain its immediate participants and relationship where needed, and introduce any unfamiliar concept necessary to interpret the contract. Keep this local to the record's concern; do not add an architecture overview, glossary, or new section to every record. A concise explanation may link the canonical owner of a shared concept without copying that owner's specification. Preserve exact frontmatter relationships, contracts, and cross-references; explanatory prose does not replace them.

Do not convert the system model into YAML-only data. Concise Markdown remains necessary for mechanism meaning, rationale, failure semantics, and `must not imply` distinctions. The narrative explanation of the system and of each domain lives in the System Guide, which restates these records and owns none of their facts.

## Architecture Record

Create `system-model/architecture.md` from [the architecture template](../assets/templates/system-model/architecture.md). It owns:

- system purpose and canonical identity/binding model;
- authority and source-of-truth boundaries;
- the major domains, their roles and relationships, plus the complete Domain index;
- cross-domain boundaries.

When the package has adopted the System Guide, declare `system_guide: adopted` in this record's frontmatter and open the record with one descriptive link to `../guide/architecture.md`; the architecture guide carries the narrative explanation and cooperation scenarios. See [Adoption And Compatibility](system-guide.md#adoption-and-compatibility).

The root README owns navigation to the invariant, security, and scope collections. Their frontmatter relationships remain in Architecture, but their category links do not need a second Architecture section.

Use frontmatter `assurance_id` as the stable lowercase blueprint key whenever structured Verification Obligations exist. Repository manifests, normalized results, and assurance commands derive this key from Architecture; do not ask a later adapter or reviewer to choose it independently. A package without structured VOs may use `None.` until the assurance contract activates.

It does not own exact lifecycle sequence, responsibility-local behavior, Build Units, repository topology, decision workflow, a project-specific parameter registry, a security-change procedure, or ticket/readiness evidence. Keep its frontmatter `domains` list synchronized with canonical domain folders.

## Domain Records

Create one `system-model/domains/<domain-slug>/domain.md` from [the domain template](../assets/templates/system-model/domain.md).

A System Domain groups a coherent logical concern. It owns the concern's purpose, positive boundary, exclusions, responsibility composition, domain-level choices with their recorded rationale, and material cross-domain contracts. Keep facts, recorded rationale, recommendations, and inference distinguishable; missing rationale remains unknown. Preserve hierarchy, IDs, and file counts unless a demonstrated need justifies a change.

The domain's reader-facing explanation lives in `guide/domains/<domain-slug>.md` ([Domain Guides](system-guide.md#domain-guides)), created in the same pass as the record. The record opens with one descriptive link to that guide, then its exact sections. A package that has not adopted the System Guide keeps a `Domain Overview` in each domain record, including domains added later, written by [guide-writing.md](guide-writing.md), until the user requests a [migration](system-guide.md#migrating-an-existing-package).

Use frontmatter:

```yaml
---
type: system-domain
id: DOMAIN-<domain-slug>
name: Domain name
responsibilities: "SR-001, SR-002"
external_responsibilities: "SR-003"
---
```

The `id` is slug-derived rather than numbered. The folder slug, `id`, and domain references must agree.

## System Responsibility Records

Create one `system-model/domains/<domain-slug>/responsibilities/sr-xxx-<slug>.md` from [the System Responsibility template](../assets/templates/system-model/system-responsibility.md).

A System Responsibility is a logical behavior, authority, state, or artifact boundary. It is not a package, service, repository, deployment, workpack, or Build Unit. New identifiers use exactly three digits (`SR-001`).

Use frontmatter:

```yaml
---
type: system-responsibility
id: SR-001
name: Responsibility name
domain: domain-slug
depends_on: "None."
participates_in: "FLOW-001"
realized_by: "None."
---
```

Before Stage 8, `realized_by` is `None.`. After Build Design exists, it lists every `BU-xxx` that realizes part of this responsibility; Build Units reciprocally list `source_responsibilities`.

A proportional `Responsibility Overview` introduces the job in ordinary language, its collaborators, what it receives, what it produces or changes, and an important success/exception path before `Agent-First Canonical Reference`. It should add understandable precision after the domain guide. Copying or lightly paraphrasing the technical Purpose under another heading is insufficient: explain how and why the responsibility participates. Write it by the [guide writing standard](guide-writing.md). Preserve all precise sections. Required sections are `Purpose`, `Owns`, `Must Not Own`, `Inputs And Outputs`, `State And Artifacts`, `Failure And Recovery`, and `Invariants`. Keep each section bounded. Use a small table only for repeated input/output mappings. For each material input or output, state the consumer interaction need: how the consumer first obtains it, observes or refreshes it, distinguishes absence or rejection, and recovers after interruption. Link the exact `IFACE-xxx.ACT-NNN` when the interface contract exists. This exposes missing read/observation/recovery behavior without creating a second capability hierarchy.

## Flow Records

Create one `system-model/behavior/flows/flow-xxx-<slug>.md` from [the flow template](../assets/templates/system-model/flow.md). New identifiers use exactly three digits.

Use frontmatter:

```yaml
---
type: system-flow
id: FLOW-001
name: Flow name
responsibilities: "SR-001, SR-002"
contracts: "IFACE-001, STATE-001, INV-001"
starts_when: Concise entry predicate
ends_when: Concise completion or reroute predicate
---
```

Required sections are `Purpose`, `Preconditions`, `Ordered Transitions`, `Failure And Reroute`, `Outcomes`, and `Invariants`.

Use an ordered-transition table with these exact columns when the flow has more than one mechanism-critical transition:

| Step | Owner | Requires | Action | Produces | State change | Must not imply |
| --- | --- | --- | --- | --- | --- | --- |

Every owner is an `SR-xxx` or an explicitly external actor/system. Every referenced state, interface, invariant, or security boundary links its canonical contract. Never make a flow the canonical owner of shared contracts.

## Lifecycle Data

Create `system-model/behavior/lifecycle.yaml` from [the lifecycle template](../assets/templates/system-model/lifecycle.yaml). This is the canonical lifecycle graph.

Use JSON-compatible YAML values so deterministic tooling can parse every field without a general YAML dependency:

```yaml
lifecycle_version: 1
name: "System lifecycle"
initial_stage: "STAGE-001"
stages: [{"id":"STAGE-001","name":"Setup","flow":"FLOW-001","next":["STAGE-002"],"terminal_outcome":null}]
terminal_outcomes: [{"id":"OUTCOME-001","name":"Completed","meaning":"The bounded lifecycle is terminal."}]
invariants: ["INV-001"]
```

Requirements:

- stage and outcome IDs are unique;
- `initial_stage` resolves;
- every stage names an existing `FLOW-xxx`;
- every `next` stage resolves;
- every named terminal outcome resolves;
- every stage reaches another stage or one terminal outcome;
- lifecycle invariants resolve to `INV-xxx` contracts; and
- branch order, reroutes, and terminal exclusivity preserve the approved mechanism trace.

Do not put narrative paragraphs, implementation order, Build Unit dependencies, or readiness in lifecycle data.

## Contract Records

Represent cross-cutting technical rules as atomic records under `system-model/contracts/`. Create only justified categories and records.

### Interface — `IFACE-xxx`

Use [the interface template](../assets/templates/system-model/contracts/interface.md). Own one cross-responsibility or external boundary: producer, consumer, payload/artifact, preconditions, validation, failure meaning, and prohibited implications.

Inside `## Material Interactions`, give every independently invoked or observed material operation a local `ACT-NNN` identifier; its stable reference is `IFACE-xxx.ACT-NNN`. Use only these generic kinds: `callable`, `state-observation`, `event-or-message`, `artifact-transfer`, `manual-handoff`, or `external-system`. Each entry fixes the trigger/entry, input, consumer-observable output, access/authority, failure/recovery meaning, `ordinary` or `high` risk, and verification intent. Include reads, observations, refresh, acknowledgement, and recovery actions when consumers require them; do not infer that a command surface also provides a read surface. Do not enumerate private functions or cosmetic UI actions. A passive one-artifact transfer with no separately invocable or observable operation may use an evidence-based `None.` declaration while the `IFACE-xxx` record itself remains the traceable boundary.

This logical contract is technology-neutral. Routes, method names, generated clients, event topics, file locations, operator commands, and other physical bindings belong to Stage 8 Build Units. Stage 9 must close the exact logical-to-physical path for every interaction required by the selected delivery slice.

### State — `STATE-xxx`

Use [the state template](../assets/templates/system-model/contracts/state.md). Own one persisted or authority-relevant state model: authority, states, transitions, terminal states, observation/finality distinction, and invalid transitions.

In a state record, a table whose first column header contains `state` (`State`, or for example `Intent state or disposition` when one record keeps separate state tables) is a state table; a transition table starts with `From` and has `To` in its fourth column. Every state table needs exactly one `Terminal` column, and each of its cells is exactly `Yes` or `No` in every language: validation and the System Explorer read `Terminal` as a machine value, so a translation such as `Sí`, a different case such as `yes`, a qualified value such as `Yes, unless reopened`, a blank cell or any other text fails validation. A state that is final only in part or can be reopened keeps its recorded answer as `Yes` or `No` and states the condition, its scope and the reopening transition in `Meaning`, the transition rows or Observation And Finality. When an open ticket still decides whether a recorded terminal state stays final, keep `Yes` and declare that doubt in the explorer with `terminalUnresolved` instead of qualifying the cell.

### Invariant — `INV-xxx`

Use [the invariant template](../assets/templates/system-model/contracts/invariant.md). Own one system-level claim that spans responsibilities or flows. State the rule, scope, and violation meaning. Read [Assurance Traceability](assurance-traceability.md) and define stable `INV-xxx.VO-NNN` entries under the existing file's `Verification Obligations`; do not create one file per VO.

### Security — `SEC-xxx`

Use [the security template](../assets/templates/system-model/contracts/security.md). Own one threat or trust boundary: protected assets, trust assumptions, threats, required controls, prohibited authority, and failure impact. Read [Assurance Traceability](assurance-traceability.md), give threats and controls stable local IDs, and define stable `SEC-xxx.VO-NNN` entries in the same file. Every threat must route through a mitigating control, and every control must route to at least one VO.

### Scope — `SCOPE-xxx`

Use [the scope template](../assets/templates/system-model/contracts/scope.md). Own one explicit deferred or excluded technical capability, why it is outside the target, what must not be inferred, and its revisit condition. Keep approved exclusion rationale and exact revisit conditions here; link existing tickets for their questions and approval history.

New contract IDs use exactly three digits. Filenames start with the lowercase ID. Contract frontmatter lists affected `SR-xxx`, `FLOW-xxx`, and related contracts with `None.` for an intentionally empty relationship.

Do not split one concern merely to create more files. Split when a contract has its own identity, consumers, change boundary, or verification intent. Multiple VOs remain subsections of their owning INV or SEC record. Conversely, do not preserve a 500-line security or correctness document when several independently referenced boundaries exist.

## Package Navigation

Keep the root README as the package index with generic Blueprint Terms only. Link the System Guide first when adopted, then the canonical architecture, lifecycle, flows, existing invariant/security/scope collections, build entry point, and justified diagrams directly when they exist. Do not generate a parallel summary file.

Route project-specific meaning to the record that owns it: a behavior, artifact, or state term to its System Responsibility, interface, state, or invariant; a security term or consequence taxonomy to a justified `SEC-xxx`; and an excluded capability or non-inference boundary to `SCOPE-xxx` or `INV-xxx`. Do not retain a second copy in navigation or Architecture.

Keep settled choices and rationale at their canonical owners and project existing ticket history through GitHub. Keep Delivery Readiness in the current delivery-slice handoffs.

## Validation

Run `validate-software-design-structure.mjs` after any architecture, domain, responsibility, flow, lifecycle, contract, or navigation change. It validates identities, paths, reciprocal domain membership, relationship targets, lifecycle graph closure, canonical layout, local links, structured VO identity and security threat/control closure when a record adopts `Verification Obligations`, and the [System Guide checks](system-guide.md#validation) when the package has adopted it. Repeat the source-coverage review until no approved fact lacks a canonical owner.
