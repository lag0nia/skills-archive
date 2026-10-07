# Software Brief

Updated:

Status: Needs intake review

Intended next skill: `software-design`

Checkpoint mode: on

## Technical Summary

Start here with the highest-signal interpretation in paragraph form. Explain what the system is, what the source means for implementation, and what must still be clarified. Include product intent, expected behavior, scope, or policy only where it materially affects the main journey, authority boundaries, or architecture. Do not use bullets here.

TBD.

## Human-Facing Product Context

Use this concise section only when a human-facing application or operator surface is in scope. Omit it for non-UI targets. Reference approved upstream UI/UX ownership rather than duplicating its rationale.

- Intended users: TBD.
- Main tasks: TBD.
- Product, demo, or explicit combination: TBD. Distinguish product behavior from demo conveniences, simulated actors, and test data.
- Basic UI/UX expectations: TBD. Include only material device, accessibility, information-density, trust, recovery, or cross-surface expectations.
- Upstream UI/UX owner: TBD or `None.` with reason.

## Mechanism Trace And Registers

Use this section when the system has ordered behavior, state transitions, credentials, tokens, secrets, external domains, or cross-system handoffs. Omit registers that are not relevant.

### Mechanism Trace

Capture the ordered system behavior before components are expanded.

### Mechanism M-001: TBD

Use a stable `M-xxx` target ID for each mechanism.

| Step | Actor | Domain / System | Action | Inputs | Outputs / Reveals | Enables | State Before | State After | Must Not Imply |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD |

### Stateful Object Register

List records, contracts, files, queues, jobs, sessions, devices, accounts, reservations, deployments, or other stateful objects whose state matters.

| Object | Domain / System | Created Or Changed By | Important States | Owner / Authority | Consumers | Must Not Confuse With |
| --- | --- | --- | --- | --- | --- | --- |
| TBD | TBD | TBD | TBD | TBD | TBD | TBD |

### Credential / Token / Secret Register

List artifacts that prove, authorize, reveal, unlock, or enable something.

| Artifact | Holder / Issuer | Where Used Or Revealed | What It Proves | What It Enables | What It Must Not Do |
| --- | --- | --- | --- | --- | --- |
| TBD | TBD | TBD | TBD | TBD | TBD |

### External Domain Register

List external systems, ledgers, services, devices, APIs, payment rails, browsers, databases, or execution environments that impose boundaries.

| Domain / System | Role | Facts It Owns | Facts It Does Not Own | Boundary / Finality Notes |
| --- | --- | --- | --- | --- |
| TBD | TBD | TBD | TBD | TBD |

### Cross-System Coupling Register

List facts or events in one system that enable, authorize, or inform actions in another system.

| Source Fact / Event | Source Domain | Target Action | Target Domain | Handoff / Trigger Status | Must Not Imply |
| --- | --- | --- | --- | --- | --- |
| TBD | TBD | TBD | TBD | TBD | TBD |

## Proposed Components

Describe the logical component boundaries that inform downstream System Responsibilities. Build Units and physical implementation boundaries are established later during Software Design’s Build Design. Use plain-language component names here, not source notation. These are components, not flows.

### Component C-001: TBD

Status: Confirmed / Approved assumption / Open but design-around

Evidence or inference basis: TBD.

Why this is a component: TBD.

This component exists because TBD.

It owns TBD.

It does not own TBD.

It depends on TBD.

It participates in TBD flows.

Boundary notes: TBD.

Open questions: TBD.

Source references: TBD where applicable.

## Main Flows

Explain the major end-to-end flows that the software design must expand. These are flows, not components.

### Flow F-001: TBD

Purpose: TBD.

Participating components: TBD.

High-level behavior: TBD.

Failure or timeout paths to preserve: TBD.

Source references: TBD where applicable.

## Needs Your Answer Now

List only product or technical questions whose answers are necessary for a coherent, trustworthy brief. A possible component or flow change alone does not require an immediate answer; use Open But Design-Around when later exploration is safe. Do not defer essential safety or authority prerequisites. If none remain, say so.

| ID | Question | Why it matters | Useful answers | Source references |
| --- | --- | --- | --- | --- |
| TQ-001 | TBD | TBD | TBD | TBD where applicable |

## Material Assumptions

List only assumptions that materially affect components, flows, constraints, or downstream implementation choices. Assumptions are not confirmed facts. If there are no material assumptions, omit this section.

Do not include normal workflow defaults, such as treating a single attached PDF as idea/reference input.

| ID | Assumption | Why acceptable for now | Revisit trigger |
| --- | --- | --- | --- |
| A-001 | TBD | TBD | TBD |

## Important Review Points

Combine likely misreads, boundary risks, and scope risks that the user should review before the brief becomes source truth.

| Point | Current Read | Review Needed |
| --- | --- | --- |
| TBD | TBD | TBD |

## Raw Source

Summarize the source material used for this intake: user prompt, PDFs, docs, repo paths, diagrams, code, or other artifacts.

## Source Role Classification

Explain what authority each source has for this brief.

| Source | Role | Authority In This Brief | Coverage Notes |
| --- | --- | --- | --- |
| TBD | Theory / Reference | Use for mechanisms and constraints; do not treat as exact target architecture unless confirmed. | TBD |

## Source Notes

Use this section only for source details that matter downstream. Do not include dense notation by default.

### Mechanism Summary

TBD.

### Terminology Translation

Use this section only when variables, overloaded symbols, or dense protocol notation would help downstream implementation. Explain plain-language terms before source notation.

| Plain-Language Term | Source Notation | Meaning |
| --- | --- | --- |
| TBD | TBD | TBD |

### Source Claims And Invariants

- TBD.

### Explicit Exclusions

- TBD.

### Missing Implementation Details

- TBD.

## Software Design Goal

Explain what the downstream software design should produce and the level of depth expected. Keep this focused on approved software behavior and implementation architecture; broader product positioning is outside intake.

Default when the user did not specify otherwise: prepare a readable brief whose logical component boundaries inform System Responsibilities in Software Design’s current structured package; Build Units and physical implementation boundaries are established later.

## System Summary

Explain the system in plain language. A teammate should understand what is being implemented, what problem the system solves technically, and what must fit together.

## Component Boundary Notes

Capture only boundary reasoning that helps the downstream reader. Do not preserve a full interview history unless it prevents misunderstanding.

## Cross-Component Constraints And Invariants

List technical constraints that affect more than one component. Explain why each one matters.

- INV-001: TBD. Include relevant source references.

## Open Questions

Group unresolved questions by handling. If a group is empty, replace it with a short sentence.

### Ask Now

None. No Ask Now blockers remain.

### Open But Design-Around

Keep each uncertainty explicit and describe its safe boundary for later design or prototype exploration. Assumptions and prototype hypotheses are not approved behavior; material discoveries require review and reconciliation into existing canonical owners. Visual direction selection does not approve behavioral changes.

| ID | Question | Why it matters | Downstream handling |
| --- | --- | --- | --- |
| OQ-001 | TBD | TBD | Keep explicit; do not silently choose. |

### Blocked

None. No blockers remain.

## Parked And Not Modeled

### Parked

Relevant later, but intentionally outside this pass.

| ID | Area | Reason | Revisit trigger |
| --- | --- | --- | --- |
| P-001 | TBD | TBD | TBD |

### Not Modeled

Intentionally excluded from the downstream software design.

| ID | Area | Reason |
| --- | --- | --- |
| NM-001 | TBD | TBD |

## Readiness For Software Design

State whether the brief is ready for downstream software design. Explain any remaining risks or conditions.

Readiness: Needs intake review / Needs answers / Ready for software design

## Final Prompt For software-design

Use `software-design` with this software brief as source truth. Do not rely on hidden chat memory. Use the approved intake component boundaries to inform logical System Responsibilities, preserving the mechanism trace, relevant registers, main flows, constraints, assumptions, and open-question handling. Establish Build Units and physical implementation boundaries later during Build Design. Follow Software Design’s current structured package format, canonical owners, and staged workflow. Preserve mechanism-critical state transitions, credentials, tokens, artifacts, and cross-system handoffs across every stage. Preserve open-but-design-around items for safe later design or prototype exploration without silently deciding them. Assumptions and prototype hypotheses are not approved behavior, and visual selection does not approve behavioral changes. Stop the affected work when a boundary issue undermines the trusted brief or essential safety or authority prerequisites. Ask before changing, merging, or splitting approved component boundaries; do not write around a blocker.
