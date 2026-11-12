# Brief Intake Review

Read this reference before showing an intake checkpoint, proposing or changing logical boundaries, or writing the brief. It owns what an intake checkpoint shows and how intake reviews boundaries, flows, and source notation. The generic questioning method stays in [Before Asking](checkpoint-workflow.md#before-asking) and [Consequential Ambiguity](checkpoint-workflow.md#consequential-ambiguity); this file adds only what intake needs beyond them. [Brief Intake](brief-intake.md) owns the flow, the write gate, and the unknown classes.

## Checkpoint Order

An intake checkpoint reviews what intake understood and what still needs attention; it writes nothing. It is a declared exception to the stage [Checkpoint Content](checkpoint-workflow.md#checkpoint-content): intake keeps this eight-part order instead.

1. `Technical Summary`: one to three short paragraphs, no bullets.
2. `Mechanism Trace And Registers`: only when they affect trust in the boundaries or flows, and concise ([mechanism-registers.md](mechanism-registers.md)).
3. `Proposed Components`: the main logical boundaries, with boundary concerns only when they affect the user's review.
4. `Main Flows`: the lifecycle or system flows the design would expand.
5. `Important Review Points`: likely misreads, boundary risks, and scope risks, plus the cross-component constraints and invariants that affect the boundaries or flows.
6. `Needs Your Answer Now`: only `Ask Now` questions; group any other open unknowns by [class](brief-intake.md#unknowns) beside them.
7. `Material Assumptions`: only assumptions that materially affect boundaries, flows, constraints, or later implementation choices, each labelled approved or proposed.
8. `Approval Prompt`: one concise prompt to approve, revise, merge, split, or rename, answer questions, park or not-model areas, or stop.

Lead with the summary. Variable lists, formula lists, page-by-page notes, and raw source taxonomy are supporting evidence and come after the main interpretation, if at all. Omit a section with no useful content; the default reading of an attached document as idea/reference input never earns a `Material Assumptions` section. Prefer a few high-impact questions to a questionnaire.

### Technical Summary

Answer "what should the user understand first?" before any evidence, in paragraph prose. Start with a real description of the system and its implementation meaning. For a theory or reference source, for example:

```md
I read this source as an idea and mechanism reference for a later implementation, not as a complete implementation architecture. It describes how an offline field-service app reconciles local edits with server assignments while preserving conflict and recovery rules.
```

Then state the implementation consequence:

```md
The main intake task is to decide which software and protocol boundaries are needed to implement this mechanism safely, not to copy source artifacts directly into components.
```

When readiness matters, say it in a sentence rather than a bullet: `I would not write the brief yet because the watcher boundary and operational-recovery scope still need review.`

### Proposed Components

Translate source artifacts into likely implementation boundaries before listing any source terms. Name the section `Proposed Components`, not `Target Architecture Shape`, so the user can tell what is under review; in prose, call each entry a logical boundary (future System Responsibility). Prefer concrete names that fit the source, such as `Document Access And Invitation Validation`, `Offline Edit Synchronization`, `Media Upload And Processing`, `Job Dispatch And Retry Recovery`, or `Inventory Reservation And Expiry`. Raw source symbols such as `S_i`, `Q_pending`, or `op_sync` appear later, as source notation. Give each boundary one sentence on what it owns: concise, never a bare list of names.

### Main Flows

A flow is an end-to-end lifecycle path across several boundaries, never a boundary itself. For each main flow, give a plain-language sentence or short paragraph naming what starts it, which major boundaries take part, the successful outcome it reaches, and the failure or timeout path that matters. Use source notation only when it is necessary and already translated.

## Ask-Now Prompts

During intake, ask only about missing product intent, expected behavior, scope, policy, or technical detail that materially affects the main journey, authority boundaries, or architecture, and record the answers in the brief's existing summary, flow, question, and scope sections. The [unknown classes](brief-intake.md#unknowns) decide what needs an answer now. When an ambiguous term would change ownership, explain that ownership consequence before proposing boundaries. When other material ambiguities are visible, the first checkpoint asks about them as well as about whether a source is target architecture or reference.

For event-driven or cross-system sources, consider these first-checkpoint questions:

- What should watchers or coordinators actually observe: job completion, event delivery, acknowledgements, timeouts, or separate responsibilities?
- Which areas are intentionally out of scope for this brief even if production needs them?
- Should a missing operational area be modeled now, kept open but designed around, or parked?
- Should a source-level artifact become its own boundary, live inside one, or remain a flow detail?

## Component Handling

Boundary discovery is the central intake job. Intake boundaries inform logical System Responsibilities; Build Units and physical implementation boundaries come later, in Build Design. A change to an approved boundary follows [Merges And Splits](#merges-and-splits).

For each major boundary, capture:

- the source evidence or inference basis;
- why it deserves to be a boundary rather than an internal function, branch, or flow step;
- its purpose in the system;
- the responsibilities it owns and those it does not own;
- its dependencies on other boundaries or external systems;
- the flows it participates in;
- the constraints or invariants that affect it;
- the open questions that affect its boundary or feasibility.

Only boundaries large enough to deserve design attention enter the approved map; internal functions, branches, methods, and sub-steps are described inside their parent.

Prefer domain-specific names. Use `Manager`, `Engine`, `Coordinator`, `Orchestrator`, `Service`, or `System` only when the source, the repository, or the user already uses that boundary or no clearer domain name exists; then justify why it is a real boundary and state exactly what it observes, controls, or verifies.

Model a protocol actor as software only when the target system implements software for that actor. For example, `editor` and `reviewer` may be actors, while `document editing and revision storage` and `review approval validation` may be implementation boundaries.

For every watcher, coordinator, or monitor, state what condition it observes, where it observes it, why it matters, what reaction follows, and whether the source role or the user's intent makes that responsibility uncertain. When the source names one observed condition but the target may need another, ask directly:

```md
What should the watcher responsibility be in the target implementation?

A. Watch job state only
B. Watch event delivery only
C. Watch both, but split them into separate responsibilities
D. Watch acknowledgements, timeouts, and job state as one operational boundary
E. None of these; I will describe the target watcher role
```

### Proposals

Propose a missing boundary when the source implies it without naming it, and label it `Proposed` until the user approves it:

```md
Proposed component: Job Completion Monitor

Reason: the target implementation needs a boundary that detects whether the required job result exists before a downstream processor acts. The source also mentions event-delivery observation, so this responsibility needs confirmation instead of being assumed.

Recommended handling: include a watcher component only after confirming exactly what it watches and what actions it triggers.

User choice needed: approve, rename, merge, park, or reject.
```

### Merges And Splits

Show proposed merges, splits, and renames during review. A user-provided boundary changes only after the user approves the change, the same rule [Checkpoint Content](checkpoint-workflow.md#checkpoint-content) applies to approved responsibilities. The brief records only the approved boundary, with a short boundary note when the reasoning clarifies it.

## What To Recommend

Recommend what reveals missing boundaries, boundary problems, risks, or architecture constraints:

- missing boundaries;
- merges, splits, or renames;
- boundary corrections;
- cross-component constraints;
- critical unknowns;
- likely blockers;
- safer question handling.

A recommendation may help resolve a material intake question. Product direction, vendor, protocol, deployment, and implementation choices stay with the later stages, and strategy advice beyond the system stays out of intake.

## Misread-Risk Review

Run a misread-risk review whenever a source is a technical paper, protocol note, dense PDF, partial implementation, or example problem. Look for places where intake may over-read, under-read, or map theory to implementation wrongly, such as:

- treating a theory or reference paper as exact target architecture;
- turning mathematical notation into boundary names;
- confusing actors, contracts, scripts, transactions, and services;
- collapsing distinct states or stateful objects into one generic object;
- using a credential, token, secret, signature, or capability for the wrong purpose;
- skipping activation, validation, handoff, timeout, or terminal-state conditions;
- implying an automatic cross-system handoff whose mechanism is unresolved;
- assuming what a watcher, coordinator, or monitor observes;
- missing explicitly excluded areas;
- flattening several lifecycle branches into one generic orchestrator;
- giving one boundary responsibilities that need separate boundaries;
- splitting one implementation boundary into several source-term boundaries.

For each risk, state the current read and the confirmation needed. Fold the risks into `Important Review Points` unless the user asks for a risk-only view.

## Plain Language And Notation

Write prose-first: a teammate should understand the checkpoint or the brief without remembering source notation. Introduce each concept as its plain-language name, then a short explanation, then source notation in parentheses only when useful.

Good: `one-time invitation token (source notation: t)`
Avoid: `t controls W_access admission`

When a source uses formulas or symbols, explain the meaning before the formula:

```md
The upload limit applies to the total uncompressed batch size. Compression reduces transfer size but does not increase the allowed batch.

Source formula: batch size = sum of uncompressed file sizes (`B = Σ sᵢ`).
```

Add a terminology translation when variables, reused letters, or domain symbols could confuse later readers. Use clear implementation names for understood concepts; when a rename would choose between materially different meanings, settle the meaning through the [Ask-Now Prompts](#ask-now-prompts) before treating its boundaries as established. Checkpoints carry no long `Key Terms` or notation table by default. The brief carries source notation only when it helps later work, placed after the summary, boundaries, flows, questions, and risks; source details the user asks for go under `Source Notes`.

## Output Contract

Write the brief from [the brief template](../assets/templates/software-brief.md), which owns its sections, their order, and the rules inside each. Fill every section that has content, and omit a conditional section that does not apply, such as `Human-Facing Product Context` for a library, background service, or pipeline. Keep the brief reader-first and prose-first, with tables only where they help scanning and one clear explanation in place of many tiny sections.

Take the final prompt from the template's `Final Prompt For software-design`. It begins "Use `software-design` with this software brief", keeps every instruction the template gives, and names package files only when the user has already chosen them or the brief must constrain the next workflow.
