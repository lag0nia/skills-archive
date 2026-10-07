# Restructure plan: <scope>

Status: Draft
Updated: <YYYY-MM-DD>
Scope kind: <strict module | module-focused | repository-wide>

## Request

<The user's request and every authorization given, quoted or closely paraphrased. Mode: inspect and plan | plan and implement | execute.>

- Objective: <one sentence: the problem to solve or the outcome sought>
- Proposed outcome: <one sentence: what the target changes, or "no restructuring justified" with the reason>

## Scope

- Focus: <responsibility, module, objective or "whole repository">
- Related edits allowed: <callers, configuration, build, tests, documentation; or "none: implementation changes stay inside the focus">
- Excluded: <areas or kinds of change that are out of scope>
- Records: <maintenance/ | a location the user accepted>

## Preserved behavior

- <Behavior or compatibility that must not change: public APIs, import paths used outside the repository, persisted and serialized formats, configuration keys, supported build and deployment paths, and where each is defined or tested>

Authorized behavior changes:

- <What, and who authorized it where; or "None">

## Direction and constraints

<Omit a line with nothing to record.>

- Confirmed needs: <upcoming capabilities or deployment changes, with their source>
- Tentative or unconfirmed: <proposals, stale roadmap items, assumptions labelled as such>
- Constraints: <runtime, framework, compatibility, team or repository rules that shape the target>

## Questions and answers

- Q1: <decision and why it matters>
  - Options: <realistic options with benefits, costs, risks and compatibility consequences>
  - Recommendation: <option and reasoning, or "none: depends on product intent">
  - A: <answer and source, "Open", or "Not asked yet: waits for Q<n>" for a question that only arises after another answer>
  - Affects: <target elements or steps>

## Inspection baseline

- Date and revision: <YYYY-MM-DD, commit or "no version control">
- Working tree: <clean, or relevant uncommitted paths and whose they are>
- Other plans checked: <paths, or "none present">
- Observations and decisions consulted: <entries and whether each still holds>
- Baseline checks: <command: result and expected signal, including failures that already existed>

## Coverage

- Traced: <flows followed end to end, from which entry points>
- Inspected: <parts read in depth, and how>
- Sampled or inaccessible: <what, and what it limits>
- Uncertain: <open leads and what would settle them>

## Current responsibilities

| Responsibility or concept | Where it lives now | Consumers | Assessment and evidence |
| --- | --- | --- | --- |
| <concept> | <paths> | <callers, entry points, external users> | <confirmed problem and its cost; intentional and why; uncertain lead; or "none"> |

## Target organization

- Ownership: <where each responsibility and its state end up, and why that part owns it>
- Boundaries and interfaces: <what each part exposes and how parts communicate>
- Dependencies and contracts: <what changes, the concrete cost or confirmed need it addresses, and the runtime or framework contracts it respects; or "unchanged">
- Build and deployment: <boundaries that change and the intended build, run and connection paths; omit when not relevant>
- Resulting layout: <where things live afterwards, only where it changes>
- Deliberately unchanged: <areas left alone and similar implementations kept independent, with reasons>
- Related candidates: <for several improvements: which complement, depend on or conflict with each other; omit otherwise>
- Compatibility: <contracts kept; temporary transitions, their users and removal condition>
- Success criteria: <observable signals showing each significant architectural claim holds>

## Trade-offs

<For each consequential decision, compare genuine options on the dimensions that distinguish them: what changes, benefit, migration and ongoing cost, compatibility, verification, uncertainty.>

- Recommended: <option, what it gains, what it costs, and how strongly the evidence supports it>
- Alternative: <option, and why it is not recommended>
- Leaving it as is: <cost of doing nothing>

## Migration order

### Step 1: <name>

- Readiness: <ready, or every unmet condition: after Step <n> | waiting on Q<n> | needs evidence: <what would provide it>>
- Changes: <exact files or surfaces: moves, renames, reference updates>
- State afterwards: <what works; transitions present; what is half-migrated>
- Preserves: <behavior this step must keep>
- Verify: <commands and expected signals, for preserved behavior and for the step's architectural effect>
- Recovery: <how to back out or where it is safe to stop; only for risky transitions>

## Verification

- Preserved behavior: <overall commands and expected signals, including dependency, packaging and dynamic-loading checks>
- Architectural outcome: <checks for the success criteria>
- Baseline failures: <failures that existed before, and any verification they block>
- Not verifiable here: <live scenarios, external consumers, deployed data>

## Decision record

- Destination: <maintenance/decisions/repository.md, an area document, or the repository's existing architecture record, and the section title; or "none yet: the target is a proposal held in this plan">
- Status when written: <Proposed | Approved, not yet implemented | Partly implemented | Implemented>

<Omit the status line while no section has been written.>

## Overlaps

- <Plan path: independent | overlapping on <files or contracts>, agreed order or ownership | invalidated by this plan: <what>>

## Progress

- [ ] Step 1: <name>
- Current state: <not started, or exactly where migration stands, including transitions still present>
- Deviations: <where execution departed from the plan and why; omit if none>
- Next step: <the exact next action>

## Out-of-scope findings

- <Bug, cleanup candidate or proposal needing permission. Status: asked | recorded as OBS-<area>-<slug> | declined>
