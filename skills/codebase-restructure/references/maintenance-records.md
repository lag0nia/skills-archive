# Maintenance Records

Maintenance work keeps its records in the target repository under one default layout:

```text
maintenance/
  plans/
    cleanup-onboarding.md
    cleanup-analytics.md
    restructure-template-definitions.md
  observations.md
  decisions/
    repository.md
    onboarding.md
```

- Use another destination only when the user or the repository's instructions ask for one, and apply the same rules there.
- Writing these records is part of the maintenance workflow, not an expansion of the implementation scope. A task limited to one module still keeps its plan and observations here. This never authorizes changing product documentation, configuration, callers or other code outside the task's scope.
- When the user asks for no file changes, report in the conversation and write no records. When the user forbids writes outside a boundary, keep the records in the conversation, or at a location inside the boundary that the user accepts.
- Create a file or folder only when writing real content into it. No empty placeholders, numbered run archives, indexes, readiness reports, handoff packages or completion reports.
- When the repository already records architecture elsewhere (for example ADRs or an architecture document), extend that record instead of starting a competing one.
- These records never hold user data, secrets or runtime data.

Plans belong to one task and one operation. Observations and decisions are shared by all maintenance work in the repository, whichever operation wrote them.

## Plans

One plan per distinct active or pending task: `maintenance/plans/<operation>-<scope>.md`. The operation is `cleanup` or `restructure`; the scope is a short kebab-case name for the area, or `repository` for whole-repository work.

- Continuing the same task: reuse and update its plan.
- A genuinely different task in the same area: name it by purpose, for example `cleanup-onboarding-legacy-import.md`. Never overwrite an unrelated plan and never create numbered copies such as `cleanup-onboarding-2.md`.
- Create the plan once there is work or a material question worth preserving. A short investigation that justifies no change needs no plan.
- A plan is an execution document, not permanent history. Only the user deletes plans.

A plan must let another agent continue without the conversation. It contains these sections (the plan template provides them):

- `## Request`: the request and every authorization given, quoted or closely paraphrased, including the mode (inspect and plan, plan and implement, execute).
- `## Scope`: scope kind, focus paths or concepts, related edits allowed, exclusions, and where the records are kept.
- `## Preserved behavior`: behavior and compatibility that must not change, plus explicitly authorized behavior changes or retirements with their source.
- `## Questions and answers`: material questions, answers, and which planned items each one affects; open questions stay visible.
- `## Inspection baseline`: date, revision, relevant working-tree changes and their owners, other plans checked, baseline check results including failures that already existed.
- `## Planned changes` (in restructuring plans, `## Migration order`): ordered batches naming files or surfaces, evidence, what each preserves, and how each is verified.
- `## Verification`: commands, expected signals, and what cannot be verified here.
- `## Overlaps`: other plans sharing files, contracts or behavior, and the agreed order or ownership.
- `## Progress`: what is done, the current state (including anything half-migrated), and the exact next step.
- `## Out-of-scope findings`: bugs, architectural observations and proposals awaiting permission, and where each was recorded.

Restructuring plans also contain `## Current responsibilities`, `## Target organization`, `## Trade-offs` and `## Decision record`.

### Status

The plan's first lines hold `Status:` with exactly one of these values, and `Updated:` with the date.

| Status | Meaning |
| --- | --- |
| `Draft` | Investigation or planning is under way; not executable yet. |
| `Awaiting decision` | A material question blocks the plan or part of it; the question is in the plan. |
| `Ready` | Another agent could execute it from this file alone. |
| `In progress` | Execution has started; `## Progress` shows exactly where it stands. |
| `Blocked` | Execution cannot continue; the blocker and what would unblock it are recorded. |
| `Complete` | Verified; durable information transferred; the user may delete the file. |

Writing a plan does not make it `Ready`. `Ready` requires named scope and exclusions, listed preserved behavior, material questions answered (or their dependent items explicitly excluded), evidence and files or surfaces for every change, a recorded baseline with verification commands, and a completed overlap check.

The status describes the plan as a whole. An open question, missing evidence or an unfinished prerequisite blocks only the items that depend on it; each batch or step records its own readiness, so a plan that is `Awaiting decision` can still contain items ready to execute. A status never authorizes execution: the recorded request, or a later one, does. An answered question is context for the items it affects, not a recurring blocker.

### Revalidating a Plan

Before executing any plan, including one you wrote earlier:

1. Compare its inspection baseline with the current state: changes to the plan's paths since the recorded revision, uncommitted work, and plans or decisions completed since.
2. Re-check the evidence for each item about to be executed.
3. Update the plan: refresh the baseline, and mark items that no longer apply or need new evidence. Keep the plan's reasoning, constraints, answers and completed work; revise what current evidence contradicts instead of rebuilding the plan.
4. If intent, scope or preserved behavior is affected, set `Awaiting decision` for those items and ask. Continue items that remain valid.

## Concurrent Work

Several plans may coexist, including plans nobody is executing yet. Before planning or executing, read the plans that could touch the same area and inspect the working tree. Classify each relation:

- Independent (no shared files, contracts, configuration, tests or behavior): proceed without coordination.
- Overlapping (shared files, contracts, configuration or tests): agree on an execution order or on who owns the shared part. Record it in your plan's `## Overlaps` and append one dated line to the other plan's `## Overlaps`. Change nothing else in that plan.
- Invalidating (your change moves, renames or removes something another plan relies on): record it in both plans the same way, tell the user, and treat the other plan as needing revalidation.

Plan files are not locks. When parallel execution needs isolation or integration, use what the host or repository already provides, such as branches, worktrees or review. Do not invent locks or schedulers.

Several agents may edit shared records (`maintenance/observations.md`, decision documents and other agents' plans) at the same time. Re-read the file immediately before editing it, change only the entries you are adding, merging or resolving, keep everything else intact, and never write back a whole file from an earlier read.

## Observations

`maintenance/observations.md` holds useful unresolved findings from any maintenance work: cleanup candidates outside the current scope, bugs, architectural friction, risks and open questions.

- Give each entry a stable identifier `OBS-<area>-<slug>`. Never rename or reuse an identifier.
- Write only findings a future maintainer would want to act on. Nothing worth recording is a valid result; then do not create the file.
- Separate observed facts (with paths, symbols, commands) from interpretation and from the suggested next step.
- State the scope actually investigated. A module-only investigation never supports a repository-wide claim.
- Search for an existing entry on the same issue before adding one, and merge duplicates.
- Revalidate every entry you rely on or touch and update its `Last verified`. Remove an entry once it is resolved or disproved, including one you notice in passing, and mention the removal in your summary. Move any lasting rationale it holds to a decision document or `## Kept intentionally` first.
- Point to other authoritative records (audit reports, issue trackers, decision documents) instead of copying their content. Before such a record is removed with the user's approval, move its unresolved content here or to another durable location.
- Make every entry understandable after any plan is deleted: never rely on "see plan" or batch numbers for context.

`## Kept intentionally` records why something that looks removable or mergeable must stay. Add an entry only when the thing is likely to be suggested again and the reason is not already evident where an investigator would look: the code, its tests, the repository's instructions or its documentation. It is not a history of every rejected suggestion. Architectural rationale belongs in a decision document instead.

```markdown
# Maintenance Observations

Unresolved findings worth keeping. Remove an entry once it is resolved or disproved.

## Open

### OBS-<area>-<slug>: <one-line finding>

- Kind: bug | cleanup candidate | architecture | risk | question
- Scope checked: <what was investigated; what was not>
- Observed: <facts, with paths, symbols or commands>
- Interpretation: <hypothesis, labelled as such; omit if none>
- Why it matters: <impact on maintenance, behavior or risk>
- Uncertainty: <what could make this wrong or what is unknown>
- Suggested next step: <investigation or recommendation>
- Last verified: <YYYY-MM-DD> at <revision or "working tree">

## Kept intentionally

### OBS-<area>-<slug>: <what should stay and not be re-suggested>

- Reason: <why it must stay>
- Evidence: <paths, tests, history>
- Reconsider when: <condition>
- Last verified: <YYYY-MM-DD> at <revision or "working tree">
```

Omit a section that has no entries.

## Decisions

Decision documents keep consequential, non-obvious architectural rationale: what was chosen, why, the constraints, meaningful rejected alternatives and when to reconsider.

- A decision is a section inside a document, never its own file. Start with `maintenance/decisions/repository.md`.
- Create `maintenance/decisions/<area>.md` only when an area has distinctive, stable rationale that would crowd the repository document. Name it by architectural subject, never by the operation or task that wrote it (no `cleanup-` or `restructure-` prefix); an area may span modules, such as configuration or integrations. Never create one file per decision, module, change or run. Whole-repository work updates the repository document plus existing area documents.
- A proposal is not an approved decision. The plan holds proposals. Write a section when its rationale is useful beyond the plan, for example once an approved target must guide other work, without waiting for completion, and give it its true status.
- Sharing these documents does not extend any task's authority. Work may maintain rationale within its authorized scope; a newly discovered change of ownership or boundaries stays an architecture observation until that work is authorized.
- Reuse suitable existing architecture documentation rather than creating a competing source of truth.
- Update or consolidate overlapping sections. Keep the current rationale clear; keep a superseded explanation only while it still helps readers.
- Past decisions are evidence and constraints to reassess against current code, not immutable truth. Reopening one requires saying what changed.
- Label status honestly: never describe a proposed or partly implemented design as implemented.
- Keep execution chronology, file-by-file change lists and test logs out.

```markdown
## <Decision title>

- Status: Proposed | Approved, not yet implemented | Partly implemented (<what remains>) | Implemented | Superseded by <section or document>
- Applies to: <modules, paths or concepts>
- Decided: <YYYY-MM-DD>

**Context and constraints.** <forces, compatibility obligations, relevant history>

**Decision.** <what is chosen, in terms a future reader can check against the code>

**Why.** <reasons tied to evidence>

**Alternatives rejected.** <only alternatives someone would plausibly propose again, each with its reason>

**Reconsider when.** <conditions that would change the answer>
```

A new decision document starts with a `# <Area> architecture decisions` heading and one sentence saying what it covers.

## Completion

Before setting `Complete`:

1. Verify the requested implementation, both the behavior it preserves and the outcome it was meant to achieve, keeping failures that existed at the baseline separate from regressions and naming what could not be verified.
2. Move useful unresolved findings into observations, and remove observations the work resolved.
3. Move worthwhile architectural rationale into the decision document where it belongs, with an accurate status.
4. Keep meaningful tests and necessary evidence in the repository's normal locations, not in the plan.
5. Re-read the plan and confirm nothing a future maintainer needs exists only there.

Then set `Status: Complete` and tell the user explicitly that the plan is complete, where its durable information was transferred, and that they can delete the plan file.

Incomplete, blocked or interrupted work stays `In progress` or `Blocked`, with `## Progress` showing what is done, any half-finished state and the exact next step. Never describe such a plan as disposable.

Give the user a concise summary in the conversation instead of writing report files. The only exception is a disposable visual explanation that a skill's own instructions provide for: it is written outside `maintenance/`, it presents what these records and the conversation already hold, and it never becomes a canonical report, index or registry, or the only home of a decision, answer or next step.
