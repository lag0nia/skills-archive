---
name: codebase-cleanup
description: Inspect and clean up an existing codebase with accumulated obsolete or unused code and dependencies, remnants of retired features, unnecessary local complexity, harmful duplication, misleading names, stale configuration, broken references, or obsolete docs, tooling and generated artifacts. A short request, such as asking for a whole-repository inspection, runs the complete workflow. Proves consumers before removing anything, preserves supported behavior, completes explicitly authorized retirements, lets the user decide about stale documentation, and keeps bugs and architectural decisions separate. Works on a strict module, a module plus necessary related edits, or the whole repository; inspects and plans first, implements when asked, and keeps plans and unresolved findings under maintenance/. Use for cleanup, cruft inspections, dead-code or dependency removal and retiring features. Not for redesigning module boundaries or moving responsibilities between modules.
---

# Codebase Cleanup

Reduce maintenance burden without changing supported behavior: remove what is proven obsolete or unused, finish retirements the user has authorized, simplify within existing ownership, and correct misleading names, stale configuration, broken references and outdated documentation or tooling. Finding nothing worth changing is a valid outcome.

## Responsibilities

Cleanup covers:

- obsolete or genuinely unused code, files, exports, dependencies, configuration and tooling;
- remnants of features the user has explicitly retired;
- unnecessary local complexity and harmful duplication within established ownership;
- misleading names, stale configuration and broken references;
- obsolete, superseded, completed, contradictory or broken documentation, whose removal or rewriting the user decides;
- obsolete scripts, tooling and generated repository artifacts.

It does not cover:

- new module boundaries, moving responsibilities between owners, changing which modules depend on which, or choosing one owner for a concept several modules own. Record these as architecture observations, never as approved decisions;
- bug fixes. Keep bugs distinct and never change behavior under a cleanup label;
- new product features, data-reset functionality, or deleting user or runtime data such as conversations, telemetry databases, credentials, browser profiles, uploads or production records.

## References

- [references/maintenance-records.md](references/maintenance-records.md): plans, observations, decisions, concurrent work and completion. Read before reading or writing anything under `maintenance/`.
- [references/consumer-evidence.md](references/consumer-evidence.md): proving something unused or obsolete, static-analysis tools, and completing a retirement. Read before classifying anything as removable.
- [references/cleanup-judgment.md](references/cleanup-judgment.md): behavior preservation, simplification, duplication, naming, protections, tests, documentation, history that is not documentation, and the lines between cleanup, bugs and restructuring. Read before planning changes.
- [assets/cleanup-plan-template.md](assets/cleanup-plan-template.md): starting shape for a new plan.

## Mode

Infer the mode from the request. A short request such as "inspect the whole repository" or "look at src/billing for cleanup" is enough to run the complete workflow for that scope. Never ask the user to list cleanup categories, request observations, describe outputs or rephrase the request at greater length.

- Inspect and plan (default): any request to inspect, review, audit, assess or clean up that does not also ask for implementation. Investigate every cleanup category in scope, ask the material questions the investigation raises, record useful unresolved findings, write a plan when changes are justified, and stop before implementation. The plan is `Ready` for this or another agent, or `Awaiting decision` while a material question blocks part of it.
- Plan and implement: the user explicitly asks for the changes to be made as well. Continue into execution once necessary decisions are resolved.
- Execute: the user asks to carry out an existing plan. Revalidate it first.

Explicit limits in the request override these defaults:

- "Findings only" or "no plan": investigate, report, and record observations, but write no plan.
- "Do not change any files": report in the conversation only, and write no maintenance records.

An investigation that finds nothing worthwhile produces no findings, observations or placeholder plan. A short request never authorizes retiring supported features, changing runtime or user data, or implementing outside its scope.

## Scope

Infer the scope and clarify only when the ambiguity changes the work.

- Strict module: inspect surrounding code as needed, but implementation changes (code, tests, configuration, product documentation) stay inside the named boundary. Propose any necessary implementation change outside it and wait.
- Module-focused: prioritize the module and make the necessary related edits to callers, shared dependencies, configuration, tests and documentation, such as updating the callers of a renamed function.
- Repository-wide: investigate broadly and implement in coherent, reviewable batches.

Writing the maintenance records under `maintenance/` is part of the workflow at every scope and does not count as leaving a strict boundary. It never authorizes other edits outside the scope. If the user forbids writes outside the module, keep the records in the conversation, or at a location inside the module that the user accepts.

A module-focused request never authorizes unrelated improvements elsewhere. Report them as suggestions or observations, and ask before expanding the scope.

## Questions

- Use answers and authorization already given.
- Investigate repository facts yourself instead of asking the user.
- Ask about product intent, what must be preserved, compatibility and scope only when the answer materially changes the work. Group questions and say what each answer changes.
- Ask whether stale documentation should be removed, updated or kept in one grouped question organized by coherent groups of documents, not file by file (see [cleanup-judgment.md](references/cleanup-judgment.md)).
- Do not ask permission for routine edits inside the authorized scope.
- When a discovery needs more scope, explain the concrete proposal and wait before doing that part.
- Continue independent authorized work while a question is pending, and keep open questions in the plan.

## Workflow

### 1. Orient

- Read the repository's applicable instructions (`AGENTS.md` and any equivalent agent or contributor instructions, including nested ones) and follow them where they differ from this skill's defaults.
- Check the working tree and preserve uncommitted or untracked work that is not yours.
- Read the existing `maintenance/` plans, observations and decisions that touch the area. For repeat inspections, follow Continuing an Inspection below.
- Identify generated, vendored, migration, fixture, protected and published paths before judging anything.

### Continuing an Inspection

For requests to inspect again or build on earlier findings, use repository records even when the earlier conversation is unavailable. Establish the relevant records' scope, revision and verification limits; revalidate findings against current code, reusing evidence that still applies. Preserve applicable answers, approvals and protected boundaries without asking the user to reconstruct the earlier conversation.

Update the same scope's existing plan and shared observations, checking overlap with materially separate plans. Reconcile new discoveries with existing entries: distinguish still-open, resolved, disproved and superseded conclusions, merge duplicates, and remove obsolete entries under the maintenance-record rules rather than maintaining a historical ledger. Preserve important unresolved information outside the disposable plan.

Prioritize previously sampled, blocked or weakly covered areas and promising unresolved leads, while allowing a fresh look elsewhere within scope. Prior findings are not an exclusive search list. Continue in the requested mode: another inspection does not authorize execution, bug fixes, architectural changes, feature retirement or document removal. Summarize what this pass changed—new findings, stronger evidence, corrected conclusions, resolved items and remaining limitations—in the existing records and final response. No additional findings is a valid result; do not create a new dated report, handoff package or comparison log, require endless passes, or claim exhaustive cleanliness.

### 2. Establish the Contract

Settle the scope, the behavior and compatibility to preserve, any retirement or behavior change the user explicitly authorized (keep its source), and the material questions. A feature that is disabled, hidden or unused is not retired until the user says so.

### 3. Record a Baseline

Record the revision and working-tree state, and run the existing focused checks for the scope (tests, type checks, lint, build) so failures that already exist are known. Do not install tools or change dependencies to do this.

### 4. Investigate

Use three passes, keeping discovery broad and removal selective:

1. **Broad discovery.** Survey the requested scope across the categories under Responsibilities before concentrating deeply on a few difficult areas. Collect plausible candidates, including straightforward unused declarations, across runtime code, defaults and distributed content, configuration, operational tooling, dependencies, tests, documentation, generated artifacts and feature remnants where present. This is discovery, not removal authorization; it requires neither exhaustive line-by-line inspection nor a finding quota. Finding nothing is valid.
2. **Candidate investigation.** Establish consumers, supported behavior, replacement coverage, ownership and authorization with [consumer-evidence.md](references/consumer-evidence.md) and [cleanup-judgment.md](references/cleanup-judgment.md). Keep confirmed facts, uncertainties and proposed actions distinct. Continue independent investigation while an item awaits a user decision, using answers and authorization already recorded.
   - Old files, large functions, similar code, missing internal callers and unusual checks are clues, never deletion evidence. Caution about deleting is never a reason to stop investigating.
   - Check that both sides of each integration agree: configuration written and read, defaults distributed and loaded, commands documented and shipped, tests present and actually run. Treat a mismatch as an investigation lead: establish the supported contract and consequence before classifying it (see Bugs Versus Cleanup in cleanup-judgment.md).
   - For an implementation that something newer replaced, name the replacement and decide what happens to each test of the old one.
3. **Final reconciliation.** Revisit the discovery candidates, including straightforward ones that may have received less attention during difficult investigations. Account for each substantive candidate as a confirmed cleanup proposal, intentionally retained with evidence, or unresolved with what is known and what would settle it. Revisit promising leads and anything uncertain, sampled or blocked; settle what can be settled and state meaningful coverage gaps honestly. "Uncertain, keep" alone is not a conclusion. Do not invent findings or keep searching without purpose.

Reuse the existing plan and observations for actionable work and material decisions. Working notes may be temporary; these passes require no additional file, permanent candidate registry or exhaustive record of rejected ideas.

Classify every finding: remove, retire, simplify, consolidate, rename or fix reference, update documentation, keep, bug, needs decision, or architecture. Record findings the plan will not resolve, such as bugs, architecture observations and candidates outside the scope, in `maintenance/observations.md` as you confirm them. The plan's `## Out-of-scope findings` then points to their identifiers.

### 5. Plan

Write or update `maintenance/plans/cleanup-<scope>.md` from the template:

- Record coverage briefly: for each relevant area, how it was inspected and what was only sampled or blocked. File counts are not coverage. Keep it proportional to the scope.
- Keep facts, questions and permission apart. Each finding records its confirmed evidence, what is still unknown, the proposed action and the authorization it needs. "Possibly removable" is a finding, not a planned change.
- Group changes into coherent batches, each with its evidence, files or surfaces, test handling and verification. Check other plans for overlap.

Before calling a batch ready, check it:

- it stays in scope;
- every item has confirmed evidence and no open consumer question;
- no owner decision it depends on is missing. Retiring or repairing a documented or manual command, or retiring a feature, needs an applicable explicit owner decision. A historical commit alone is not approval; a recorded owner decision remains usable unless superseded. Ask only when authority, scope or intended behavior is materially unresolved;
- each affected test is kept, ported to the current owner or removed for a stated reason;
- no behavior fix hides inside it;
- its verification can tell legitimate remaining uses of a name from obsolete ones.

Set the plan `Ready` only when another agent could execute it without this conversation. When implementation was not requested, stop here and summarize the plan, coverage gaps, the observations recorded and any open questions.

### 6. Execute

- Revalidate the plan against current code, working-tree changes and other pending plans before the first edit. Apply the batch check from step 5 to every item. A request to execute the plan covers only what the plan validly authorizes, so an item whose owner decision was never recorded goes back to the owner.
- Work batch by batch. After each batch, run its verification and update `## Progress`.
- Complete every authorized removal across all the surfaces it reaches.
- When execution reveals a consumer the plan missed, keep the code, correct the plan and continue with independent items.
- When an edit would leave the scope or change behavior, stop that part, explain the concrete proposal and wait; continue with independent work.
- Record bugs instead of silently fixing them.
- Follow the repository's delivery requirements, such as commits, changelog and review. Do not push, deploy, install tools or change dependencies unless the user or repository authorizes it.

### 7. Complete

Follow the completion steps in [maintenance-records.md](references/maintenance-records.md): verify, transfer unresolved findings to observations and architectural rationale to decisions, confirm nothing important exists only in the plan, then state explicitly that the plan is complete, durable information has been transferred, and the user can delete it. Interrupted or blocked work stays resumable.

## Verification

- Use the repository's own tools and existing focused tests first, then broader checks proportionate to the risk.
- Add characterization tests before changing important behavior that no test protects.
- When a change touches dynamic loading, packaging, links or UI and runtime flows, exercise those directly, for example by loading the registry, building the package, checking links or running the flow.
- After removals, search again for the removed names, paths, keys and strings, and account for each remaining hit. A different thing can share the name, such as a valid function argument named like a removed configuration field. Expect those hits rather than demanding zero occurrences.
- Separate failures that existed at the baseline from regressions.
- Never delete tests because their cases are rare, weaken assertions to make cleanup pass, or treat static-analysis output as authorization to delete.
- A clean test run does not prove every live scenario; say what remains unverified.

## Report

Give a concise summary in the conversation. Cover:

- what changed, or that no change was justified;
- what was only sampled or blocked;
- notable things kept and why;
- verification results and baseline failures;
- questions or proposals awaiting the user;
- observations recorded;
- the plan's path and status.

Do not write separate report files.
