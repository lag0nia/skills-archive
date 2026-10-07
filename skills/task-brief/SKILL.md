---
name: task-brief
description: Use when the user wants a durable task brief or plan captured in one Markdown file for a feature, fix, refactor, workflow, implementation task, or other bounded piece of work. Create and maintain one `work-items/NNN-task-slug-yyyy-mm-dd.md` brief, preserve the original request, inspect relevant repo context, clarify material ambiguity, and record decisions, scope, steps, risks, and verification. Use this single-file workflow for tasks of any size; do not switch to or recommend another planning workflow based on size or complexity.
---

# Task Brief

Create a single Markdown work item that captures the complete plan and durable task memory for work of any size.

The work item file is the canonical source for what was originally asked, what has been clarified, what repo context was inspected, what decisions were made, and what implementation guidance is ready. Do not rely on chat memory for any material task truth once this skill starts.

## Core Output

Create or update one file:

```text
work-items/
  <zero-padded-index>-<task-slug>-<yyyy-mm-dd>.md
```

Rules:
- use the repo root `work-items/` directory unless the user names another destination
- use a zero-padded index such as `001`
- use `kebab-case`
- use `-`, never `_`
- use the current local date for the folder-independent filename date
- keep exactly one canonical work item file for the task
- do not create multi-file planning-package artifacts, runtime state, or review artifacts

Use [assets/task-brief-template.md](assets/task-brief-template.md) as the starting shape.

## Status Values

Use exactly one status near the top of the file:

- `Draft`: the task has been captured, but repo inspection, questions, or decisions are still in progress
- `Needs User Input`: a material ambiguity blocks a trustworthy brief
- `Ready`: the brief is sufficient for a competent implementer to execute without relying on chat history

`Status` answers whether this brief is usable. Do not add separate depth or escalation fields, or redirect the task to another workflow based on size, complexity, or risk.

An explicit request such as “use Task Brief,” “make a plan,” or “put the plan in one file” selects this workflow. Honor that choice unless a missing decision prevents a trustworthy brief; in that case use `Needs User Input`.

## Workflow

Follow these stages in order.

### 1. Capture Early

Create the work item file as soon as there is a coherent task or request to preserve.

The first write may be a thin draft. Its main job is to prevent drift by preserving:
- the original request, quoted or lightly cleaned without changing meaning
- current understanding
- current unknowns
- whether repo context has been inspected yet

Do not wait until the brief is complete before creating the file.
Do not pretend the first draft is final.
If the request is too vague even to name the task, ask one focused naming or intent question before file creation.

### 2. Inspect Context

Inspect only the repo context needed to make the brief trustworthy.

Prefer:
- relevant source files and nearby tests
- existing docs or prior work item files that directly affect this task
- local conventions in the touched boundary

Avoid broad discovery unrelated to the task. Keep the single-file brief focused while still covering the full execution scope.

Record inspected paths under `## Repo Context Checked`. If repo inspection is not relevant, write `Not needed` with a short reason.

### 3. Clarify Only Material Ambiguity

Ask focused questions only when the answer changes scope, behavior, ownership, or verification.

Rules:
- ask 1-3 questions at a time
- prefer grouped questions when they unblock the same decision
- do not ask questions the repo can answer
- do not ask cosmetic or speculative questions
- record each answer under `## Decisions and Answers`

If a material answer is missing, set `Status: Needs User Input`.

### 4. Keep Updating the Same File

Update the same work item after:
- repo inspection changes the understanding
- the user answers a material question
- the user changes scope, constraints, or success criteria
- an execution-relevant assumption becomes a decision
- scope or risk changes enough to affect the brief's completeness

Keep the file concise but current. Do not leave important task truth only in chat.

### 5. Add Execution Guidance

Make the brief implementable, whether the task is small or large.

Include:
- exact files or boundaries expected to change when known
- files or boundaries that should remain untouched when important
- concrete implementation notes
- ordered steps when they reduce ambiguity
- verification commands and expected signals when known
- risks and edge cases worth checking

Use steps only when they help. For very small tasks, a short implementation note plus verification section is enough.

### 6. Decide Readiness

Set `Status: Ready` only when:
- original request is preserved
- material ambiguity is resolved or explicitly accepted as an assumption
- repo context has been inspected or marked not needed
- scope and non-goals are clear enough
- the touched boundary is named well enough for execution
- verification expectations are stated or intentionally absent

Do not make readiness depend on task size. A large or complex task can still be `Ready` when this single file captures enough context, scope, decisions, implementation guidance, and verification for execution.

## File Quality Bar

The work item must be honest about what is known and unknown.

Do:
- preserve the starting request even if later discussion changes the direction
- write concrete decisions rather than conversational summaries
- name source paths for repo-grounded claims
- keep assumptions separate from decisions
- keep unresolved questions visible
- preserve the user's requested single-file planning format

Do not:
- bury the original request under later interpretation
- overwrite old decisions without preserving the current agreed state
- invent details to make the brief look ready
- create multi-file planning-package artifacts
- split into multiple task files for the same task
- automatically invoke another planning workflow

## Resources

Use [assets/task-brief-template.md](assets/task-brief-template.md) when creating a new work item file.
