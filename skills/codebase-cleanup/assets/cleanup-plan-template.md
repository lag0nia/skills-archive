# Cleanup plan: <scope>

Status: Draft
Updated: <YYYY-MM-DD>
Scope kind: <strict module | module-focused | repository-wide>

## Request

<The user's request and every authorization given, quoted or closely paraphrased. Mode: inspect and plan | plan and implement | execute.>

## Scope

- Focus: <paths or concepts>
- Related edits allowed: <callers, configuration, tests, documentation; or "none: implementation changes stay inside the focus">
- Excluded: <areas or kinds of change that are out of scope>
- Records: <maintenance/ | a location the user accepted>

## Preserved behavior

- <Behavior or compatibility that must not change, and where it is defined or tested>

Authorized behavior changes and retirements:

- <What, and who authorized it where; or "None">

## Questions and answers

- Q: <material question> A: <answer, or "Open"> Affects: <findings or batches>

## Inspection baseline

- Date and revision: <YYYY-MM-DD, commit or "no version control">
- Working tree: <clean, or relevant uncommitted paths and whose they are>
- Other plans checked: <paths, or "none present">
- Baseline checks: <command: result, including failures that already existed>

## Coverage

<One line per area the scope contains; omit areas that do not exist. File counts are not coverage.>

- Runtime code: <how it was inspected, such as entry points traced and reachability followed; what was only sampled or blocked>
- Defaults and distributed content: <...>
- Configuration: <...>
- Operational tooling: <...>
- Tests: <...>
- Documentation: <...>
- Generated artifacts: <...>
- Revisited before concluding: <leads and uncertain areas re-checked, and the outcome>

## Findings

| ID | Finding | Confirmed evidence | Still unknown | Proposed action | Authorization |
| --- | --- | --- | --- | --- | --- |
| F1 | <what> | <consumers searched; dynamic, public and persistence checks; history> | <open consumer or contract questions, or "nothing"> | <remove, retire, simplify, consolidate, rename or fix reference, update documentation, keep, bug, needs decision, architecture> | <cleanup | owner decision (Q1) | separate bug fix | none> |

## Planned changes

### Batch 1: <name>

- Readiness: <ready | waiting on <question> | needs evidence: <what>>
- Changes: <exact files or surfaces and what happens to each>
- Findings: <F1, F3>
- Tests: <each affected test case: keep | port <assertion> to <current owner's test file> | remove, with the reason>
- Preserves: <behavior this batch must keep>
- Verify: <commands and expected signals; for removed names, the remaining hits that are expected and why>

## Verification

- <Overall commands and expected signals>
- Not verifiable here: <live scenarios, external consumers, deployed data>

## Overlaps

- <Plan path: independent | overlapping on <files or contracts>, agreed order or ownership | invalidates <what>>

## Progress

- [ ] Batch 1: <name>
- Current state: <not started, or exactly where execution stands>
- Next step: <the exact next action>

## Out-of-scope findings

- <Bug, architecture observation or proposal needing permission. Status: asked | recorded as OBS-<area>-<slug> | declined>
