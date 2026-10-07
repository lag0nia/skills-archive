---
name: software-design-intake
description: Turn rough software ideas, requirements, documents, diagrams, or existing code into a reviewed software brief for $software-design. Capture approved product behavior, component boundaries, flows, state, constraints, source conflicts, and conditional UI/UX context. Use for intake and clarification before staged software design; do not create the architecture package or execute implementation.
---

# Software Design Intake

Use this skill to turn rough software input into a trusted `software-brief.md`. The skill is an interviewer and mapper, not the final architecture writer.

The output brief should give a downstream software-design skill enough reviewed context to expand the system without inventing components, hiding assumptions, or misunderstanding boundaries.

## Design Workspace

For new repository-scoped work, default to `<repository-root>/design/software-brief.md`. If no repository root exists, use `<workspace-root>/design/`.

Resolve paths in this order: explicit user paths; exactly one existing brief or package under `design/`, or the repository root; otherwise the new `design/` defaults. If multiple candidates are plausible, stop and ask which is canonical. Never move an existing brief/package or create a duplicate merely to adopt the new default. Create `design/` only after the final write preview is approved.

## Default Invocation Contract

The user should only need to invoke `$software-design-intake` and provide source material, such as an attached PDF, pasted explanation, repository path, diagram, or notes.

When the user does not provide extra instructions, infer this goal:

> Create a reviewed software brief for a later software-design or implementation-planning workflow. Identify approved product behavior, the main logical components, boundaries, dependencies, flows, constraints, assumptions, and unknowns. Do not write the full architecture package yet.

Do not ask the user to restate this default goal. Ask only when the source material is missing, inaccessible, or the intended output path is ambiguous in a way that matters.

When the user only attaches or references source material, treat it as idea/reference input by default. Do not ask "what authority should this source have?" unless the user explicitly says the source may be stale, there are conflicting sources, or treating it as exact target architecture would materially change the next step.

Do not show this default source-role assumption as review content. It is normal workflow behavior, not useful user-facing information. Mention source role only when it changes the technical interpretation or prevents a likely misread.

## Core Boundary

Create or update only the software brief unless the user explicitly asks for something else. Do not create the final architecture package, component documentation, implementation plan, test matrix, or diagrams.

Those artifacts belong to the downstream software-design workflow.

## Default Flow

1. Read the user's source material: prompt text, PDFs, docs, diagrams, repo files, notes, or existing code. If the user simply says `$software-design-intake`, use all attached or clearly referenced material as the source.
2. Classify the role of each source before extracting components.
3. Run a deep source digestion and mechanism-preservation pass before proposing the component map.
4. Show an intake checkpoint before writing the final brief.
5. Interview the user on missing product intent, expected behavior, scope, policy, or technical detail when it materially affects the main journey, authority boundaries, or architecture. Use the existing questions and brief sections; apply the Ask-Now rules below to decide what needs an answer now.
6. Iterate until the component map, boundaries, flows, constraints, assumptions, and unresolved questions are clear enough.
7. Show a final write preview and wait for explicit approval to write.
8. Write or update `software-brief.md` using [assets/templates/software-brief.md](assets/templates/software-brief.md).
9. Stop. Do not continue into software design unless the user explicitly asks.

When a human-facing application or operator surface is in scope, capture only the Stage 0 context the downstream workflow needs: intended users, main tasks, product-versus-demo distinction, and basic UI/UX expectations. Reuse approved upstream product/UI decisions. Do not add a separate UX interview, prototype stage, visual-style exercise, or long questionnaire; surface missing answers only when they materially affect the main journey, authority boundaries, or architecture, and use the existing unknown handling to distinguish immediate prerequisites from safe later discovery.

If the target folder is not specified and no existing brief resolves uniquely, write `design/software-brief.md` under the repository or workspace root. Update an existing uniquely resolved brief rather than creating a duplicate. Do not ask for a target folder before the first checkpoint unless there are multiple plausible workspaces, multiple candidate briefs, or an overwrite risk.

## Write Gate

Never write `software-brief.md` just because the user answered questions, corrected components, clarified flows, or accepted part of the intake. Corrections are not write approval.

Before creating or updating the brief, show a final write preview and ask for explicit approval. After the final write preview, the single word `approve` is enough to write the brief. Outside a final write preview, `approve` only approves the current intake state and does not write files.

The final write preview must show:

- target path;
- final technical summary in paragraph form;
- final mechanism trace and relevant registers, when the system has ordered behavior, state transitions, credentials, or cross-system handoffs;
- final proposed component list with one-line ownership for each component;
- final main flow list with one-line descriptions;
- remaining `Needs Your Answer Now` items, or `none`;
- material assumptions that will be written, or `none`;
- parked and not-modeled areas, if any;
- what source notes or notation will be omitted from the visible brief because they are not useful.

End with a direct approval prompt, such as:

```md
Reply `approve` to write the brief, or send edits.
```

Do not write the file in the same response that first shows the write preview unless the user has already explicitly requested an uninterrupted write.

Preserve approved requirements with their source references. When sources conflict or a material product or technical choice remains unresolved, explain the affected boundary and obtain user approval before adopting an answer; carry safe local unknowns forward without deciding them. Downstream Software Design owns approved behavior through existing product tickets and canonical system records.

## Source Role Classification

Classify each source before turning it into components. Do not assume that a paper, PDF, example, diagram, or existing codebase is the exact target architecture.

Use these source roles:

- `Target Architecture`: should be implemented substantially as written.
- `Theory / Reference`: explains mechanisms, constraints, or proofs, but still needs translation into target implementation components.
- `Example Problem`: illustrates one issue or edge case, not the full architecture.
- `Constraint Source`: supplies requirements, formulas, invariants, legal/operational constraints, or non-goals.
- `Existing Implementation`: current code or system reality that the design must respect.
- `Partial / Stale Source`: useful but incomplete, old, speculative, or superseded.

When the role is ambiguous, state the assumed role in the checkpoint. Ask the user to confirm only when the source role materially changes the component map or implementation goal. Do not make source-role confirmation the first or only question for an attached PDF or rough idea.

## Deep Source Digestion Gate

Do not jump from source material directly to a generic component list. Before the first component inventory checkpoint, digest the source enough to show that the mechanism was understood.

For each substantial source, capture:

- coverage: what pages, sections, files, or diagrams were inspected;
- source role and authority;
- plain-language mechanism summary;
- mechanism trace and relevant registers when the source has ordered behavior, state changes, credentials, handoffs, artifacts, or protocols;
- important terms and variables translated into human-readable names;
- source claims, security objectives, invariants, or formulas;
- explicit exclusions and non-goals;
- missing implementation details the source does not answer;
- likely misread risks.

For PDFs, technical papers, protocols, and design notes, read all major sections before presenting the first checkpoint when feasible. If only part of a source can be inspected, say exactly what was inspected and classify the remaining coverage gap as an intake risk.

The source digestion pass must happen before component mapping, but the first checkpoint should not lead with dense source notes. Present the important intake conclusions first. Keep source digestion and notation out of the visible checkpoint unless needed to explain a component, flow, or question.

## Mechanism Preservation Gate

Use this gate when the source has ordered behavior, state transitions, cross-system handoffs, credentials, tokens, secrets, contracts, queues, jobs, ledgers, devices, sessions, workflows, or protocol steps. If none of these exist, omit the mechanism registers instead of forcing boilerplate.

Before finalizing components, capture the mechanism skeleton with only the registers that apply:

- `Mechanism Trace`: ordered steps with actor, domain or system, action, input, output or revealed artifact, what the step enables, state before, state after, and what the step must not imply.
- `Stateful Object Register`: records, documents, files, queues, jobs, sessions, devices, accounts, reservations, deployments, or other objects whose state matters across steps.
- `Credential / Token / Secret Register`: API keys, auth tokens, signatures, capabilities, invitations, certificates, passwords, or other artifacts that prove, authorize, unlock, or reveal something.
- `External Domain Register`: services, APIs, vendors, devices, ledgers, browsers, payment rails, databases, or execution environments that impose boundaries or finality assumptions.
- `Cross-System Coupling Register`: facts in one system that enable, trigger, authorize, or inform actions in another system.
- `Invariant Register`: constraints that must remain true across components, states, flows, and handoffs.

Use plain names. Do not make the user understand source notation to review the mechanism.

Mechanism registers are not a replacement for components. They are source-truth scaffolding that prevents later design stages from collapsing distinct states, confusing credentials, skipping activation conditions, or implying automatic handoffs that are unresolved.

If a mechanism-critical detail is missing or contradictory, require an answer when it is essential to a coherent, trustworthy brief or to safety or authority prerequisites. Otherwise mark it `Open But Design-Around` and state the safe boundary for later exploration; do not hide the gap inside a generic component. If the user corrects a mechanism detail, update the mechanism trace and affected registers before updating components or flows.

Apply domain-specific checks only when the source requires them: for example, blockchain settlement may need confirmations and reorganization handling, while a job queue may need leases and duplicate-delivery handling. Preserve authority, state, recovery, security, and correctness requirements without assuming a particular domain.

## Plain-Language And Notation Rules

Write prose-first. A teammate should not need to remember the source notation to understand the checkpoint or brief.

Use this order:

1. plain-language name;
2. short explanation;
3. source notation in parentheses only when useful.

Good: `one-time invitation token (source notation: t)`  
Avoid: `t controls W_access admission`

When a source uses formulas or symbols, explain the meaning before the formula:

```md
The upload limit applies to the total uncompressed batch size. Compression reduces transfer size but does not increase the allowed batch.

Source formula: batch size = sum of uncompressed file sizes (`B = Σ sᵢ`).
```

Create a terminology translation when variables, reused letters, or domain-specific symbols could confuse downstream readers. Rename ambiguous source terms into clear implementation names in the brief.

Do not put a long `Key Terms` or notation table in the checkpoint by default. Put source notation in the final brief only when it helps downstream work, and keep it after the summary, components, flows, questions, and risks. If the user asks for source details, show them under `Source Notes`, not before the main interpretation.

## Intake Checkpoints

Use checkpoint mode by default. A checkpoint is a review of what the skill understood and what still needs attention. It is not a file-writing step.

The first checkpoint must be reader-first and prose-first. Use this order:

1. `Technical Summary`: 1-3 short paragraphs. Start with a real description of the system and the implementation meaning. Do not use bullets here.
2. `Mechanism Trace And Registers`: only when they affect trust in the component map or flows. Keep it concise in checkpoints.
3. `Proposed Components`: the main logical components that inform downstream System Responsibilities. Make clear these are components, not flows or raw source terms.
4. `Main Flows`: the lifecycle or system flows the downstream design would expand. Make clear these are flows, not components.
5. `Important Review Points`: likely misreads, boundary risks, and scope risks the user should check.
6. `Needs Your Answer Now`: only product or technical questions that must be answered to establish a coherent, trustworthy brief and cannot safely remain open.
7. `Material Assumptions`: only assumptions that materially affect components, flows, constraints, or downstream implementation choices.
8. `Approval Prompt`: approve, revise, merge/split/rename, answer questions, park/not-model areas, or stop.

Do not lead with a variable list, formula list, page-by-page notes, or raw source taxonomy. Those are supporting evidence, not the first thing the user should read.

At every checkpoint, include:

- A prose technical summary.
- Mechanism trace and relevant registers when ordered behavior, state transitions, credentials, tokens, or cross-system handoffs materially affect the design.
- Proposed components with plain-language descriptions.
- Main flows with plain-language descriptions.
- Important review points that combine misread risks, boundary risks, and scope risks.
- Component boundary concerns only when they affect user review.
- Cross-component constraints and invariants when they affect the component map or flows.
- Unknowns grouped by handling status.
- One concise approval prompt.

Do not ask long questionnaires. Prefer a small set of high-impact questions over exhaustive detail.

If a section has no useful content, omit it instead of filling it with obvious defaults. In particular, do not show `Material Assumptions` when the only assumption is that a single attached PDF is idea/reference input.

## Correction Handling

When the user corrects the intake, do not write the brief immediately. First produce an updated review checkpoint.

The updated review checkpoint should show:

1. `What Changed`: a short summary of the user's corrections that were applied.
2. `Updated Technical Summary`: paragraph prose, not bullets.
3. `Updated Mechanism Trace And Registers`: when the correction affects ordered behavior, state, credentials, tokens, or handoffs.
4. `Updated Proposed Components`: the revised component list with one-line ownership and changed boundaries.
5. `Updated Main Flows`: the revised flow list.
6. `Still Needs Your Answer`: only questions that truly block a trusted brief.
7. `Ready To Write?`: if no blockers remain, show the final write preview required by `Write Gate`.

Do not show only a correction summary. The user needs to see the resulting intake state before it becomes source truth.

If the user says "yes", "correct", "that's right", or similar after a correction checkpoint, treat that as approval of the current intake state, not automatic permission to write. If the correction checkpoint includes a final write preview, `approve` is enough to write.

### Technical Summary Rules

The technical summary should answer "what should the user understand first?" before showing evidence. It must be paragraph prose, not a list.

For a theory/reference source, use wording like:

```md
I read this source as an idea and mechanism reference for a later implementation, not as a complete implementation architecture. It describes how an offline field-service app reconciles local edits with server assignments while preserving conflict and recovery rules.
```

Then state the implementation consequence:

```md
The main intake task is to decide which software and protocol boundaries are needed to implement this mechanism safely, not to copy source artifacts directly into components.
```

Do not include readiness as a bullet in this summary. If readiness matters, state it in normal prose: `I would not write the brief yet because the watcher boundary and operational-recovery scope still need review.`

### Proposed Components Rules

Translate source artifacts into likely implementation boundaries before listing notation-heavy source terms. The checkpoint section should be named `Proposed Components`, not `Target Architecture Shape`, so the user can tell what is being reviewed.

Prefer concrete names appropriate to the source, for example:

- `Document Access And Invitation Validation`
- `Offline Edit Synchronization`
- `Media Upload And Processing`
- `Job Dispatch And Retry Recovery`
- `Inventory Reservation And Expiry`

Avoid leading with raw source symbols such as `S_i`, `Q_pending`, or `op_sync`. These can appear later as source notation.

Each proposed component should include one sentence that says what it owns. Keep this section concise, but do not make it a bare list of names.

### Main Flows Rules

Keep flows separate from components. A flow is an end-to-end lifecycle path across multiple components. It should not be presented as a component.

For each main flow, provide a plain-language sentence or short paragraph that explains:

- what starts the flow;
- which major components participate;
- what successful outcome it reaches;
- what failure or timeout path matters.

Do not use raw source notation unless it is necessary and already translated.

### Ask-Now Question Rules

Capture missing product intent, expected behavior, scope, or policy when it materially affects the main journey, authority boundaries, or architecture, using the existing summary, flows, questions, and scope sections.

`Needs Your Answer Now` includes questions whose answers are necessary to establish a coherent, trustworthy brief. A possible change to the component map or a major flow does not by itself require an immediate answer. Use `Open But Design-Around` when a bounded uncertainty can safely remain explicit for later Software Design or prototype exploration. Do not defer essential safety or authority prerequisites, invent a missing transition, or use an assumption to conceal a blocker.

Do not reduce the first checkpoint to only "is this source target architecture or reference?" when other material ambiguities are visible. This is targeted clarification, not a mandatory product questionnaire or a new approval gate.

For event-driven or cross-system sources, consider whether these need explicit first-checkpoint questions:

- What should watchers or coordinators actually observe: job completion, event delivery, acknowledgements, timeouts, or separate responsibilities?
- Which areas are intentionally out of scope for this brief even if needed in production?
- Should a missing operational area be modeled now, kept open but design-around, or parked?
- Should a source-level artifact become its own component, live inside a component, or remain just a flow detail?

Do not ask `What authority should this source have?` for a single attached PDF, note, or rough idea. Assume it is idea/reference input unless the user says otherwise or there is a real conflict.

If an issue can be carried as a reversible assumption, show it only when it materially affects the component map, main flows, constraints, or downstream implementation choices. Do not show obvious default assumptions just to prove the workflow understood them.

## Component Handling

Treat component discovery as the central intake job. Intake component boundaries inform logical System Responsibilities; they do not establish Build Units or physical implementation boundaries, which Software Design establishes later during Build Design. Preserve the existing review process for correcting approved boundaries.

For each major component, capture:

- source evidence or inference basis;
- why it deserves to be a component rather than an internal function, branch, or flow step;
- purpose in the system;
- responsibilities it owns;
- responsibilities it does not own;
- dependencies on other components or external systems;
- flows it participates in;
- constraints or invariants that affect it;
- open questions that affect its boundary or feasibility.

Only components large enough to deserve downstream design attention should appear in the approved component map. Internal functions, branches, methods, or sub-steps should usually be described inside a parent component.

Prefer domain-specific component names over generic labels. Avoid names such as `Manager`, `Engine`, `Coordinator`, `Orchestrator`, `Service`, or `System` unless the source, repo, or user already uses that boundary or there is no clearer domain-specific name. If a generic name is used, justify why it is a real component boundary and state exactly what it observes, controls, or verifies.

Do not convert protocol actors into software components unless the target system actually implements software for that actor. For example, `editor` and `reviewer` may be actors, while `document editing and revision storage` or `review approval validation` may be implementation components.

For watchers, coordinators, and monitors, always state:

- what condition is observed;
- where it is observed;
- why it matters;
- what reaction follows;
- whether the source role or user intent makes that responsibility uncertain.

If the source mentions one observed condition but the user's target may require another, ask instead of assuming.

Watcher questions should be direct. Example:

```md
What should the watcher responsibility be in the target implementation?

A. Watch job state only
B. Watch event delivery only
C. Watch both, but split them into separate responsibilities
D. Watch acknowledgements, timeouts, and job state as one operational boundary
E. None of these; I will describe the target watcher role
```

### Proposed Components

Propose missing components when the source implies they are necessary but does not name them. Label them as `Proposed` until the user approves them.

Example:

```md
Proposed component: Job Completion Monitor

Reason: the target implementation needs a boundary that detects whether the required job result exists before a downstream processor acts. The source also mentions event-delivery observation, so this responsibility needs confirmation instead of being assumed.

Recommended handling: include a watcher component only after confirming exactly what it watches and what actions it triggers.

User choice needed: approve, rename, merge, park, or reject.
```

### Merges And Splits

Use proposed merges and splits during the interview to improve the component map. Do not preserve a long merge/split history in the final brief unless the reasoning clarifies the approved boundary.

The final brief should optimize for the approved component map, not the review process.

Use this rule:

- During review: show proposed merges, splits, and renames.
- In the final brief: record only the approved component boundary and a short boundary note when useful.

Never silently merge, split, rename, or remove a user-provided component. Propose the change and ask for approval.

## Unknown Handling

Classify unknowns by how they affect the next workflow.

- `Ask Now`: must be answered before the brief can be trusted.
- `Open But Design-Around`: unresolved, but a safe boundary allows downstream design or prototype exploration without silently selecting approved behavior. State the uncertainty and exploration limits in the existing question handling; keep essential safety and authority prerequisites settled.
- `Approved Assumption`: the user accepted a temporary assumption; mark it as an assumption, not a fact.
- `Proposed Assumption`: useful candidate assumption that still needs approval.
- `Parked`: relevant later, intentionally outside this pass.
- `Not Modeled`: intentionally excluded from the downstream software design.
- `Blocked`: cannot produce a ready brief until external input or a user answer exists.

Assumptions remain assumptions, and prototype hypotheses remain exploratory until reviewed and approved as behavior. Later discovery must reconcile approved answers into Software Design’s existing canonical owners; visual direction approval does not approve behavioral changes.

When the user has not thought about an issue, offer practical handling choices:

- answer now;
- explain this before choosing;
- keep open and design around it;
- approve a temporary assumption;
- model multiple options later;
- park it;
- mark it not modeled.

## Recommendation Discipline

Make technical recommendations when they help reveal missing components, boundary problems, risks, or architecture constraints. Label every recommendation as a proposal until the user approves it.

Recommend:

- missing components;
- merges, splits, or renames;
- boundary corrections;
- cross-component constraints;
- critical unknowns;
- likely blockers;
- safer question handling.

Do not recommend product direction, vendor choices, protocol choices, deployment choices, or implementation strategy as final answers unless the user asks for a recommendation. If advice is requested, mark it as advice pending approval.

## Misread Risk Review

Include a misread-risk review whenever the source is a technical paper, protocol note, dense PDF, partial implementation, or example problem.

Use this section to surface places where the intake may be over-reading, under-reading, or mapping theory to implementation incorrectly. Typical risks:

- treating a theory/reference paper as exact target architecture;
- turning mathematical notation into component names;
- confusing actors, contracts, scripts, transactions, and services;
- collapsing distinct states or stateful objects into one generic object;
- using a credential, token, secret, signature, or capability for the wrong purpose;
- skipping activation, validation, handoff, timeout, or terminal-state conditions;
- implying an automatic cross-system handoff when the handoff mechanism is unresolved;
- assuming what a watcher, coordinator, or monitor observes;
- missing explicitly excluded areas;
- flattening multiple lifecycle branches into one generic orchestrator;
- using one component for responsibilities that need separate boundaries;
- splitting one implementation boundary into several source-term components.

For each risk, state the current read and the confirmation needed. In the checkpoint, merge these into `Important Review Points` instead of showing a separate dense `Misread Risks` list unless the user asks for a risk-only view.

## Brief Readiness

Mark `Status: Ready for software design` only when:

- the approved component map is clear;
- component boundaries are stable enough for downstream expansion;
- main flows are identified;
- product and technical constraints material to the main journey, authority boundaries, or architecture are captured;
- assumptions are labeled;
- unresolved questions are classified;
- no `Ask Now` or `Blocked` items remain.

If questions remain but can be designed around, the brief may still be ready. The final prompt must instruct the downstream skill to preserve those open items and avoid silently choosing for the user.

## Output Contract

Use [assets/templates/software-brief.md](assets/templates/software-brief.md) as the output structure.

The brief must include:

- raw source summary;
- source role classification;
- source digestion summary;
- mechanism trace and relevant registers when ordered behavior, state transitions, credentials, tokens, external domains, or cross-system handoffs are material;
- terminology translation when useful;
- software design goal;
- system summary;
- approved component map;
- component boundary notes;
- main system flows;
- cross-component constraints and invariants;
- assumptions;
- open questions and handling;
- misread risks;
- parked and not-modeled areas;
- readiness assessment;
- final prompt for the downstream software-design skill.

For a human-facing scope, also include the concise conditional `Human-Facing Product Context` from the template. Omit it for libraries, background services, pipelines, and other non-UI targets. It forwards Stage 0 context and upstream ownership only; it does not duplicate a product/UI specification or require a prototype during intake.

Keep the brief prose-first and human-readable. Use tables only where they improve scanning. Do not create dozens of tiny sections when one explanation is clearer.

The final brief should also be reader-first. Put the technical summary, proposed components, main flows, and remaining material product or technical questions before dense source notation or formula references.

## Final Prompt Rules

The final prompt for the downstream software-design skill must say:

- use this `software-brief.md` as source truth;
- do not rely on hidden chat memory;
- use intake component boundaries to inform logical System Responsibilities; establish Build Units and physical implementation boundaries later during Build Design;
- preserve mechanism traces and relevant registers across every stage;
- preserve open-but-design-around items for safe later design or prototype exploration without silently deciding them; assumptions and prototype hypotheses are not approved behavior;
- stop the affected work if a new boundary issue undermines the trusted brief or an essential safety or authority prerequisite; ask before changing, merging, or splitting approved component boundaries;
- produce the downstream package using Software Design’s current structured format, canonical owners, and staged workflow;
- for human-facing scope, carry the intended users, main tasks, product-versus-demo boundary, basic UI/UX expectations, and upstream UI/UX ownership into Software Design Stage 0.

Do not include downstream package file names unless the user has already chosen them or the brief needs to constrain the next workflow.
