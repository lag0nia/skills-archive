---
name: codebase-restructure
description: Assess and improve the architecture of existing software - responsibility and state ownership, modules and public interfaces, dependencies and communication, shared rules and contracts, build, packaging, configuration and deployment boundaries, the folder layout expressing them, and design patterns only where they solve a demonstrated problem. A short request is enough, about a whole repository, one module, a responsibility spread across modules, an architectural objective such as making a frontend independently distributable, a complaint to trace across code such as new integrations touching many places, or executing or continuing a restructuring plan. Maps the current system, diagnoses with evidence, designs a coherent target or concludes none is justified, and plans behavior-preserving migration; implements only when asked. Keeps plans under maintenance/ and durable rationale in maintenance/decisions/. Not for dead-code removal or tidy-ups inside existing ownership.
---

# Codebase Restructure

Improve where responsibilities live and how parts of a system depend on and communicate with each other, so each concept has a clear owner, related code sits together, dependencies stop causing avoidable coordinated changes, facts that must agree have one source of truth, and build and deployment boundaries match how the software must be delivered. The scope may be one responsibility, one module or the whole repository, and a restructuring need not be a rewrite. No architectural style is a goal in itself, and concluding that the current organization should stay is a valid outcome.

## Responsibilities

Restructuring assesses and, when authorized, changes:

- responsibility and state ownership, including duplicated sources of truth;
- modules and their public interfaces;
- dependencies and communication between parts;
- shared rules and contracts;
- build, packaging, configuration and deployment boundaries;
- the folder and file organization that expresses those responsibilities;
- design patterns, only where they solve a demonstrated problem.

It preserves behavior and supported compatibility unless the user authorizes a change. It does not cover:

- new product features or a blanket redesign nobody asked for;
- removing unrelated dead code or tidying inside existing ownership. Record such findings as observations unless the user adds them to the scope;
- bug fixes. Keep bugs distinct and preserve current behavior while moving code;
- deleting user or runtime data such as conversations, telemetry databases, credentials, browser profiles, uploads or production records.

## References

- [references/maintenance-records.md](references/maintenance-records.md): plans, observations, decisions, concurrent work and completion. Read before reading or writing anything under `maintenance/`.
- [references/restructure-judgment.md](references/restructure-judgment.md): evidence and diagnosis, intended direction, material decisions and question rounds, ownership, interfaces, dependencies and how they are verified, deployment boundaries, abstractions, trade-offs, alternative designs, scenario checks, migration safety and outcome verification. Read before diagnosing or designing a target.
- [references/design-discussion.md](references/design-discussion.md): worked examples of a question round with a dependent question, two designs compared against one caller scenario, scenario checks and a term clarified. Read before asking material questions or comparing designs for a consequential decision.
- [references/visual-report.md](references/visual-report.md): when to write the disposable HTML explanation of a substantial review, where, what it shows and how to check it. Read before writing or updating one.
- [assets/architecture-report-template.html](assets/architecture-report-template.html): self-contained starter for that report. Copy it to the report location; never edit it in place.
- [assets/architecture-report-example.html](assets/architecture-report-example.html): the starter populated for a fictional repository, showing the intended depth and visual quality. Its architecture is not a recommendation.
- [assets/restructure-plan-template.md](assets/restructure-plan-template.md): starting shape for a new plan.
- [references/plan-example.md](references/plan-example.md): a compact example of step readiness and a material decision. Read when writing or revising a plan's migration order. It illustrates the reasoning, not a required architecture or wording.

## Requests

Infer the scope and mode from the request. A short request is enough to run the complete workflow; never ask the user to describe the workflow, list what to examine, request observations, describe outputs or rephrase the request at greater length.

| Request shape | Example | What it starts from |
| --- | --- | --- |
| Whole repository | "Check this repository's structure and suggest improvements." | A repository-wide map, prioritized by evidence of cost and by confirmed needs. |
| One module | "Review the configuration module." | The module's responsibilities, interface, callers and dependencies. |
| A responsibility spanning modules | "Where does pricing logic live, and should it?" | The concept wherever it currently lives. |
| An architectural objective | "I want the frontend to be independently distributable and connect to another compatible backend." | What currently prevents the objective across code, contracts, build, configuration and deployment. |
| A complaint or difficulty | "Adding integrations requires changes everywhere; investigate why." | The symptom, traced through related code to its cause, which may lie elsewhere than the complaint names. |
| An existing plan | "Execute this restructuring plan." | The plan's recorded state, revalidated against current code. |

Inspecting related code wherever it lives is always part of the work and never authorizes modifying it. What may be modified follows the mode and scope below.

## Mode

- Inspect and plan (default): any request to inspect, review, assess, investigate or restructure that does not also ask for implementation. Run stages 1–5 and stop before implementation.
- Plan and implement: the user explicitly asks for the changes to be made as well. Continue through stages 6–7 once the necessary decisions are resolved.
- Execute: the user asks to carry out or continue an existing plan. Revalidate it first.

Explicit limits in the request override these defaults:

- "Findings only" or "no plan": investigate, report, and record observations, but write no plan.
- "Do not change any files": report in the conversation only, and write no maintenance records or report files, including temporary ones.

An investigation that finds nothing worthwhile produces no findings, observations or placeholder plan. A short request never authorizes changing supported behavior, changing runtime or user data, or implementing outside its scope.

## Scope

Infer the scope and clarify only when the ambiguity changes the work.

- Strict module: inspect surrounding code as needed, but implementation changes (code, tests, configuration, product documentation) stay inside the named boundary. Propose any necessary implementation change outside it and wait.
- Module-focused, including one responsibility spread across modules, an architectural objective or a complaint: prioritize the selected module, responsibility or objective and make the necessary related edits to callers, shared dependencies, configuration, build, tests and documentation.
- Repository-wide: investigate broadly, establish a coherent overall target, and migrate in coherent batches under one repository plan.

Writing the maintenance records under `maintenance/` is part of the workflow at every scope and does not count as leaving a strict boundary. It never authorizes other edits outside the scope. If the user forbids writes outside the module, keep the records in the conversation, or at a location inside the module that the user accepts.

A focused request never authorizes unrelated improvements elsewhere. Report them as suggestions or observations, and ask before expanding the scope.

## Authorization

- A proposal, in a plan, a report or the conversation, is not an approved decision. Never record it as approved or implemented.
- `Ready` means a plan or step is specified well enough to execute. Authorization to execute comes from the recorded request or a later one, never from the status.
- "Plan and implement" already authorizes the ordinary technical decisions needed within the agreed scope. Moving from one stage to the next needs no further approval.
- Material unresolved questions still need answers. Each one blocks only the steps that depend on it.

## Questions

- Use answers and authorization already given, including those recorded in plans and decisions.
- Investigate repository facts yourself instead of asking the user.
- Ask once you have enough context, and only when intended direction, preserved behavior, compatibility or scope genuinely needs the user's judgment and the answer materially changes the architecture or the migration. Examples are which of two drifted behaviors is correct, whether an externally used interface may change, whether to depart from a documented decision, or whether a planned capability is confirmed.
- For each material decision, give a descriptive title, state the precise decision and why it matters, give realistic options with their benefits, costs, risks and compatibility consequences for this repository, recommend one with reasons when the evidence supports it, and name the design choices or steps it affects (see [restructure-judgment.md](references/restructure-judgment.md)).
- Ask in small rounds of questions whose prerequisites are settled. A question that depends on an unanswered one waits for a later round. After each answer, record it and work out what remains; stop once the decisions the current scope needs are resolved. [design-discussion.md](references/design-discussion.md) works through an example.
- In broad reviews, ask whether concrete upcoming capabilities or deployment changes should shape the target. Do not force a questionnaire or hold back a useful current-state review when future plans are undefined; state the basis and limits of the recommendation instead.
- When the request or an earlier answer already names the objective, candidate or scope, work from it; do not ask the user to choose it again.
- Resolve routine technical choices within scope without asking. When a discovery needs more scope, explain the concrete proposal and wait before doing that part.
- Continue independent authorized work while a question is pending, and keep open questions in the plan.

## Documentation

- References and documentation that an authorized move makes wrong are updated as part of that move, without a new permission request.
- Records of intent, such as roadmaps, commitments and priorities, are the user's. Mechanical corrections caused by authorized work, such as a moved file's path or link, are routine when they preserve the meaning. Never alter a commitment, priority, intended behavior or scope to match the implementation unless the user has authorized that update. When the work substantively conflicts with such a record, report the conflict and its consequences, and continue independent authorized work.
- Documentation that is stale for other reasons (obsolete, superseded, completed, contradicting current code or broken) is the user's decision. Give the evidence for each coherent group in one grouped question asking whether to remove, update or keep it. Age, historical status or few incoming links are not evidence on their own. Follow retention preferences the user has already given, leave the documents untouched until the user decides, and continue independent work meanwhile.
- Before an approved removal, move unresolved findings the document holds to a durable location and update incoming links.

## Workflow

The stages are reasoning checkpoints, not approval gates or separate documents. Revisit an earlier stage when evidence changes. Keep small tasks light: a narrow question may pass through the first three stages quickly and end with an answer, without a plan or report.

### 1. Understand the System, Request and Intended Direction

- Read the repository's applicable instructions (`AGENTS.md` and any equivalent agent or contributor instructions, including nested ones) and follow them where they differ from this skill's defaults.
- Check the working tree and preserve uncommitted or untracked work that is not yours.
- Read the existing `maintenance/` plans, observations and decisions and any other architecture records for the area. Treat observations as leads and verify each against current code before relying on it. The work proceeds the same way when none exist.
- Establish the system's purpose and important behavior, the scope, constraints, existing decisions, authorization and material unknowns.
- Establish intended direction from the request, earlier answers, roadmaps and recorded decisions, distinguishing confirmed plans, tentative or stale proposals and your own assumptions. Never infer future intentions from code alone.
- When continuing the same task, reuse its plan: keep its reasoning, constraints, answers and completed work, and revalidate rather than rebuild it.

### 2. Map the Current Architecture

- Trace representative end-to-end flows from their entry points. For each concept in scope, find where its data, rules, state and behavior live, which part owns its truth, who calls whom, how parts communicate, and which public contracts and build, runtime or distribution boundaries are involved.
- Trace every consumer a move could break: entry points, routes, registries and dynamic loading, background jobs, configuration, packaging, persisted and serialized formats, public APIs, tests and documentation.
- In large repositories go breadth first (entry points, top-level parts, build and deployment configuration, the dependency structure), then in depth where the request or the evidence points.
- Read history and decision records: why the current shape exists, which decisions constrain it, which files change together, and which bugs came from divergence.
- Record coverage: what was inspected, only sampled, inaccessible or uncertain.
- Record a baseline: revision, working-tree state, and the existing focused checks with any failures that already exist. Do not install tools or change dependencies to do this.

### 3. Diagnose and Prioritize

Separate confirmed architectural problems, each with the concrete cost it causes, from intentional arrangements, uncertain leads (with what would settle them), bugs, cleanup candidates and new functionality. Tie every proposed improvement to evidence and its consequence. Record bugs, cleanup candidates and other findings the plan will not resolve in `maintenance/observations.md` as you confirm them.

Prioritize by cost and by confirmed needs. When nothing justifies restructuring, say so with the basis and its limits, and write no plan.

Keep improvement candidates, which address different problems, apart from alternative solutions to one problem, and note where candidates complement, depend on or conflict with each other. When a broad review leaves a genuinely material choice of direction or scope, present the prioritized candidates (in the visual report when one is warranted; see Report) and ask it, then continue designing and planning as far as the evidence allows, keeping the open choice and the items it affects in the plan.

### 4. Design a Coherent Target

Apply [restructure-judgment.md](references/restructure-judgment.md). Before implementation, explain:

- which part owns each responsibility and its state afterwards, and why;
- boundaries, public interfaces and how parts communicate, including changes to dependencies and contracts;
- build, packaging, configuration and deployment boundaries when they are relevant;
- the resulting layout, and what deliberately stays as it is;
- compatibility: contracts kept, temporary transitions and when they end;
- trade-offs: genuine alternatives, the recommendation, and the cost of leaving things as they are;
- observable success criteria for each significant architectural claim.

For whole-repository work, establish the coherent overall target before dividing it into independent batches. Fit the target to this repository's size, runtime and framework contracts. Introduce a pattern, layer, facade, factory or other abstraction only when it solves a demonstrated problem or a confirmed need. Architecture choices that belong to the user are material questions; decide and explain the rest.

When a consequential interface or ownership decision is unresolved, consider designing it more than once, and walk significant proposals through representative and awkward scenarios before recommending them (see Alternative Designs and Scenario Checks in [restructure-judgment.md](references/restructure-judgment.md)).

### 5. Plan the Migration

- Order the steps so each leaves the system working and verifiable: protect unprotected behavior with characterization tests first, keep moves separate from logic changes, update every reference, and remove temporary transitions once their consumers have moved.
- For each step, state what it changes, its prerequisites, what it preserves, its intermediate state and its verification. When a step is not ready, list every unmet condition: another step that must be completed and verified first, a user decision, or missing evidence or external confirmation. A step is ready only when all its conditions are met, and resolving one leaves the others in place. Explain each condition once, in the step or question it belongs to, and refer to it elsewhere.
- For risky transitions, give proportionate recovery or safe-stopping information.
- Check other plans for overlap, and identify any plan this work would invalidate.
- Write or update `maintenance/plans/restructure-<scope>.md` from the template. When updating a plan written from an earlier template, keep its structure and add sections only when they gain content; do not convert it wholesale.
- Keep the reasoning, evidence pointers, assumptions, questions, answers and migration information in the plan. A report may present them, but nothing needed to continue the work may exist only in the report.
- Set `Ready` only when another agent could execute it without this conversation.

For inspect-and-plan requests, stop here and report.

### 6. Execute When Authorized

- Revalidate the plan against current code, working-tree changes, concurrent work and other pending plans before the first edit.
- Execute verified increments. After each, run its verification and record the actual state in `## Progress`, including anything half-migrated.
- When a discovery invalidates an assumption, revisit the affected design or steps and record the change. Ask only when intent, compatibility, behavior or scope is affected.
- When an edit would leave the scope or change behavior, stop that part, explain the concrete proposal and wait. Continue independent authorized steps meanwhile.
- When a step changes something another plan relies on, record the invalidation in both plans and tell the user.
- Record significant approved rationale in the decision document once it guides other work, following [maintenance-records.md](references/maintenance-records.md); do not wait for completion.
- Record bugs and unrelated cleanup candidates instead of fixing them.
- Follow the repository's delivery requirements, such as commits, changelog and review. Do not push, deploy, install tools or change dependencies unless the user or repository authorizes it.

### 7. Verify and Close

- Verify both that supported behavior and compatibility are preserved and that the intended architectural outcome was achieved (see Verification).
- Follow the completion steps in [maintenance-records.md](references/maintenance-records.md): move durable rationale into decisions with a truthful status and unresolved findings into observations, confirm nothing important exists only in the plan, then state that the plan is complete and the user can delete it. Whole-repository work updates the repository decision document and existing area documents, never one file per module.
- Incomplete or blocked work stays resumable, with the exact next step recorded.

## Verification

- Produce evidence for two things: preserved behavior and compatibility, and the achieved improvement. The second means checking the architectural claim itself, for example that consolidated rules have one owner that the relevant callers consume, that a removed dependency is absent from the affected import or execution path, that supported public entry points still work, or that an independently distributable part builds, runs and connects through its intended path rather than only through the old combined deployment. See [restructure-judgment.md](references/restructure-judgment.md).
- Use the repository's own tools and existing focused checks first, then broader checks proportionate to the risk. Do not build a new architecture-testing framework.
- Add characterization tests before moving important behavior that no test protects.
- Verify what moves can break: imports and dependencies, dynamic loading and registries, packaging and published entry points, configuration, links, and affected UI or runtime flows. After moves and renames, search again for old paths, names and strings.
- Compare with the baseline: identify regressions attributable to the change, and do not fix unrelated failures. When a baseline failure prevents meaningful verification of a changed behavior, name the limitation and what would resolve it instead of claiming the step passed.
- Unavailable tooling or history limits the conclusions that depend on it, not the whole task.
- When a check could succeed while doing no work, confirm an expected observable signal, such as the number of tests run or the artifact produced, instead of relying only on a zero exit code.
- Never delete tests because their cases are rare, weaken assertions to make a migration pass, or preserve compatibility shims nobody uses. A clean run does not prove every live scenario; say what remains unverified.

## Report

Give a concise summary in the conversation. Cover:

- the target and trade-offs, or why the current organization should stay, with the basis and limits of the recommendation;
- coverage: what was only sampled, inaccessible or uncertain;
- what moved and what deliberately did not;
- verification of preserved behavior and of the architectural outcome, and baseline failures;
- questions or proposals awaiting the user, and which steps they affect;
- decisions and observations recorded;
- plans affected by this work;
- the plan's path and status;
- the visual report's path, its key recommendation and whether it was visually inspected, when one was written.

### Visual Report

For a substantial review, such as several candidates, a target that changes ownership, boundaries, contracts, build or deployment, or a consequential choice between designs, also write a self-contained HTML explanation by default, following [visual-report.md](references/visual-report.md). It needs no separate permission. Skip it for a narrow question, a justified no-change answer, a small self-evident change, or a request for text only or no files; explain in the conversation instead.

- It is a disposable view of evidence and proposals, not a record. The plan and decisions remain authoritative and sufficient for another agent to continue without it.
- Write it outside the repository in a per-task temporary location unless the user names another, and reuse the same file within the discussion when conclusions change. No numbered versions or report directories in the repository. Any restriction on where files may be written applies to the report too.
- It is not a gate: continue investigating and planning as far as the information allows. Reading it approves nothing; answers come in the conversation and are recorded in the plan.
- Say whether it was rendered and inspected or only written.

Apart from this visual report, do not write separate report files.
