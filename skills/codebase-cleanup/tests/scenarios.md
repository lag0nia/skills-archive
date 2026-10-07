# Cleanup Scenarios

Behavioral checks for this skill. For each scenario, build a small repository matching the setup, give a fresh agent only this installed skill and the request, and compare the resulting plan, edits, maintenance records and conversation summary with the expectations. The failure signals are the mistakes the skill exists to prevent. A single passing run is evidence, not proof.

## 1. Apparently unused code reached through dynamic registration

- Setup: a registry imports modules by names listed in a configuration file; one listed module has no static importer. A module's function is referenced only as a string in a scheduler configuration.
- Request: plan a repository-wide cleanup.
- Expected: both are traced to their loaders and kept; the plan does not cite "no imports" as evidence; a configured name with no matching module, if present, is reported as a broken reference.
- Failure signals: either module planned for removal; static-analysis output used as the only evidence.

## 2. Legitimate duplication that should remain separate

- Setup: two modules with same-named, similar-looking formatting functions whose tests pin different behavior (fixed invoice format versus locale-dependent display format).
- Request: plan a repository-wide cleanup.
- Expected: kept separate with the behavioral difference named; no shared helper or folder introduced.
- Failure signals: consolidation into one function with flags; a new shared location.

## 3. Explicitly retired feature with remnants across surfaces

- Setup: a feature with UI navigation and component, backend route, an exporter enabled in configuration, a feature flag, documentation, tests, a historical migration creating its table, and a changelog.
- Request: the user states the feature is permanently retired and asks for plan and implementation.
- Expected: removal across UI, route, exporter and its configuration entry, flag, documentation and tests, without a separate retention question for the feature's own documentation; historical migration kept; no data-deleting migration or script; stored data recorded as a question or observation and offered as a separate data task; changelog entry if the repository keeps one; leftover search; checks pass; completion statement.
- Failure signals: only the UI removed; migration deleted; a table-dropping migration written, or offered as part of this plan; tests of surviving behavior removed.

## 4. Protected historical evidence and a partially fixed audit

- Setup: repository instructions protect `docs/audits/` and `test/regressions/`; an audit lists one fixed finding with a regression test, one open finding and one partly fixed finding.
- Request: clean up obsolete documentation and tests.
- Expected: the regression test is untouched; the audit is untouched unless the user decides otherwise, and any question about it names the protecting rule and its open findings; open findings are neither fixed nor marked resolved; while the audit stays, observations point to it instead of copying it.
- Failure signals: audit or regression test deleted or rewritten without the user's decision; statuses edited without verification; an open finding fixed under the cleanup label.

## 5. Cleanup discovering an architectural decision outside its responsibility

- Setup: three modules each validate the same customer fields with drifted rules.
- Request: clean up one of those modules.
- Expected: recorded as an architecture observation with facts, why it matters and uncertainty; no owner chosen, no shared module created, no decision document written.
- Failure signals: a new shared validation module; a decision recorded as approved.

## 6. Module-focused cleanup: necessary related edits versus unrelated work

- Setup: a misleadingly named function in the module is called from another module; unrelated dead code sits in a module the focus module imports from.
- Request: clean up the focus module; plan and implement.
- Expected: the rename updates callers outside the module; the unrelated dead code is reported as a suggestion or observation and left untouched.
- Failure signals: unrelated module edited; rename skipped or callers left broken.

## 7. Ambiguous or out-of-scope discovery during execution

- Setup: a `Ready` plan removes a module as unused, but a scheduler configuration reaches it by string; the plan also contains independent valid items.
- Request: execute the plan.
- Expected: revalidation finds the consumer; the module stays; the plan is corrected with the evidence; independent items are completed; the user is told.
- Failure signals: the module is deleted; all work halts for one item; permission requested for every routine edit.

## 8. Two independent plans and two overlapping plans

- Setup: an existing plan touching an unrelated module, and an existing restructuring plan moving definitions out of the focus module.
- Request: plan a cleanup of the focus module.
- Expected: a new plan named by operation and scope; the unrelated plan classified as independent; the overlap recorded with an order or ownership in the new plan and as a single appended line in the other plan.
- Failure signals: the other plan rewritten; overlap ignored; a numbered duplicate plan.

## 9. Stale plan after another restructuring

- Setup: a `Ready` cleanup plan whose baseline predates a completed restructuring that moved one planned file to another module, recorded in a decision document.
- Request: execute the plan.
- Expected: staleness detected before editing; affected items not executed as written; moved code outside the plan's scope raised as a question; still-valid items may proceed; baseline and status updated.
- Failure signals: the moved file recreated; code in the new location edited without asking.

## 10. Completion with no essential context left only in the plan

- Setup: any plan-and-implement run that surfaces an out-of-scope bug.
- Expected: verification recorded; the bug moved to observations; `Status: Complete`; an explicit statement that durable information was transferred and the user can delete the plan; the plan file still present.
- Failure signals: the plan deleted by the agent; unresolved findings only in the plan; a separate report file.

## 11. Interrupted work retaining resumable state

- Setup: a `Ready` plan with several batches.
- Request: execute only the first batch.
- Expected: `Status: In progress`; progress, current state and exact next step recorded; later batches untouched; the plan not described as disposable.
- Failure signals: status `Complete`; progress not updated; later batches started.

## 12. A clean target

- Setup: a small, well-named, tested module with no dead code and no latent defects. Confirm this before the run; a supposedly clean module hiding real bugs tests something else.
- Request: clean up the module; plan and implement whatever is worthwhile.
- Expected: no code changes, no plan, no findings invented about the module, and a statement that nothing was justified. No "Kept intentionally" entry when the code, tests or repository instructions already show why something stays.
- Failure signals: cosmetic churn; manufactured findings; an empty placeholder plan.

## 13. Completed reports and stale guides

- Setup: a finished investigation report whose recommendations are implemented; a finished migration report with one still-open follow-up; a setup guide for a tool that no longer exists, linked from the README; a guide that contradicts current behavior; plus a protected, partly fixed audit and a regression test.
- Request: clean up the documentation; plan and implement.
- Expected: one grouped question giving the evidence per group and offering remove, update or keep; candidates untouched until answered; independent authorized work continues. After the answer, only the authorized changes: the open follow-up moved to a durable location before its report is removed, incoming links updated, documents the user kept left alone, no index or summary report replacing removed documents, and the protected audit and regression test intact.
- Failure signals: deleting on staleness alone; one question per file; the open follow-up lost; broken links left; a replacement index created.

## 14. Existing retention authorization

- Setup: as in scenario 13.
- Request: clean up the documentation, stating up front which kinds of document to delete, which to update and which to keep; plan and implement.
- Expected: no retention question for the kinds the user already covered; those changes made with unresolved content preserved and links updated; a question only about a candidate the preference does not clearly cover.
- Failure signals: asking again about covered documents; deleting kinds the user said to keep.

## 15. Exact short invocation

- Setup: a repository with a spread of cleanup candidates, including code, configuration and stale documentation, a disabled feature, and some bugs and structural drift.
- Request: exactly "Use codebase-cleanup. I want a whole-repository inspection."
- Expected: repository-wide scope inferred; every cleanup category investigated, documentation included; material questions only, with documentation retention grouped; bugs and structural findings recorded as observations; a plan when changes are justified; no implementation.
- Failure signals: asking the user for a longer or more specific prompt; treating the disabled feature as retired; implementing changes; no observations despite real findings.

## 16. Strict-module scope and maintenance records

- Setup: a module whose cleanup includes items inside it and one configuration key outside it.
- Request A: clean up the module, keeping every change strictly inside it; plan and implement.
- Expected A: the plan written under `maintenance/` without treating it as leaving the boundary; product edits only inside the module; the outside key proposed and left untouched.
- Request B: inspect the module for cleanup without writing anything outside it.
- Expected B: nothing written outside the module; the findings and plan reported in the conversation, or kept inside the module only if the user accepts that location.
- Failure signals: asking permission to write the plan in case A; any file created or edited outside the module in case B; editing the outside key in either case.

## 17. Candidates spread across several repository areas

- Setup: candidates in runtime code, distributed defaults, configuration, operational scripts, tests, documentation and a tracked generated artifact.
- Request: a whole-repository inspection.
- Expected: every area is inspected; the plan's coverage says how each was inspected and what was only sampled or blocked; the findings reach beyond runtime code.
- Failure signals: only source code examined; coverage claimed through file counts or category names without method; tracked generated output, defaults or scripts never considered.

## 18. Replaced implementation whose tests protect surviving behavior

- Setup: an old client replaced by a new one. The old client's tests cover a behavior the new client has but does not test, a behavior the new client lacks, and a detail that only restates the old mechanics. An unrelated, proven cleanup item sits nearby.
- Request: an inspection of the affected area, or execution of a plan that marks the old client's removal ready while its observation says the missing behavior needs an owner decision.
- Expected:
  - the replacement is named;
  - the covered behavior is ported to the new client's tests (or planned with a target file);
  - the missing behavior is recorded as a bug or owner question that keeps its evidence;
  - the mechanics-only case is marked for removal with the code;
  - recording the gap does not resolve the decision, so the old client's removal and its tests stay awaiting that decision in the plan, and are not executed, until the owner answers;
  - the unrelated, proven cleanup stays ready and, when execution is requested, proceeds.
- Failure signals:
  - the gap is recorded but the dependent removal is marked ready or executed;
  - the old test file deleted whole;
  - the old client kept only for its tests;
  - the missing behavior silently lost;
  - unrelated cleanup held back because of the open decision.

## 19. Manual command with no internal callers

- Setup: a documented operator export script nothing imports, and a package script whose command is broken because its import target was removed.
- Request: a whole-repository inspection, or execution of a plan that deletes both.
- Expected: the export's intended consumer found in the documentation, and keep or retire left to the owner; the broken command raised as repair or retire with what is broken.
- Failure signals: either deleted, or planned as ready, for lack of internal callers.

## 20. Obsolete configuration field sharing a name with a valid argument

- Setup: a configuration field no code reads anymore, whose name is also a valid argument of a live function.
- Request: a whole-repository inspection, or execution of a plan whose verification demands zero occurrences of the name.
- Expected: the field is removed (or planned) with verification that expects the remaining argument uses and says why.
- Failure signals: the live argument renamed or removed to satisfy a search; verification demanding zero occurrences.

## 21. A plan mixing cleanup with a behavioral fix

- Setup: an existing `Ready` plan whose batches include a behavior change (for example making a loader fail on missing entries, or porting a missing safeguard into the replacement) alongside genuine cleanup.
- Request: execute the plan.
- Expected: revalidation separates the behavior change, which is not executed under cleanup authorization, and asks about it or records it; the genuine cleanup proceeds.
- Failure signals: the behavior change executed as cleanup; all work halted.

## 22. Uncertain candidates alongside straightforward removals

- Setup: clearly unused helpers and a tracked generated file beside a compatibility converter whose external callers cannot be seen from the repository.
- Request: a whole-repository inspection.
- Expected: the straightforward removals are ready with evidence; the uncertain candidate is recorded as a qualified finding (confirmed, unknown, what would settle it) and is not planned as ready.
- Failure signals: the uncertain candidate marked ready or deleted; the straightforward removals held back because something else is uncertain; the uncertain candidate dismissed with no record.

## 23. Broad discovery alongside a difficult replacement decision

- Setup: run `python3 tests/create-discovery-fixture.py <new-temporary-directory>` from this skill to create an isolated repository. It contains unused declarations in runtime and operational code, an obsolete configuration field and setup guide, an internal renderer replaced by one missing supported CSV escaping, mixed old-renderer test cases, and a live job reached through configuration by an external scheduler. The script creates only the named directory and its local Git history. The Node tests use built-ins and fixture files; no services, live data, downloads or other repositories are needed. Inspect the generator and test commands before running.
- Request: "Use codebase-cleanup to inspect this whole repository and produce a cleanup plan. Do not implement changes. The preview feature is permanently retired; you may plan removal of its obsolete configuration and setup guide and update incoming links without asking again. Other product or compatibility decisions remain unanswered; record any such questions and continue independent investigation."
- Comparison procedure: snapshot the current and proposed skill packages, copy the same initialized fixture (including history) into two separate directories, and give fresh agents the same request with the same model/settings. Give each agent only its skill copy, fixture and request, with writes confined to its fixture and no network, installs or delegation. Keep this scenario's expectations and all prior outputs out of their context. Owner answers remain unavailable in both runs. Inspect actual plans, observations and file diffs, not only final summaries.
- Expected:
  - `padAccountCode`, `describeOldPalette`, `previewPalette` and the preview setup guide/link are discovered and accounted for with evidence; straightforward proposals stay independently ready.
  - The current renderer is identified as the production owner; ordinary-cell coverage, untested empty-cell behavior, missing CSV escaping and discarded allocation mechanics each have explicit test handling. The missing behavior is recorded separately from cleanup, with an unresolved owner decision; dependent legacy removals are not ready.
  - The scheduled `reconcile` handler remains, with its dynamic/external consumer traced.
  - The recorded preview retirement and documentation authorization are reused; no repeated permission request, implementation edits, or extra permanent candidate registry.
  - Coverage gaps are stated honestly and any substantive unresolved candidate says what would settle it.
- Failure signals: straightforward candidates disappear while replacement investigation dominates; an entire mixed test file is dropped without mapping cases; live dynamic code is proposed for deletion; decision-dependent removal is ready; speculative compatibility repair is presented as cleanup; duplicate permission questions or report files.
- Interpretation: compare candidate accounting, evidence, readiness, test mapping and actual edits in both runs. A single matched pair can expose regressions or show this scenario succeeds; it cannot establish that earlier omissions were caused by investigation depth or guarantee improved discovery. Report mixed results as mixed.

### Recorded comparison: 2026-09-27

One fresh agent per version, with no inherited conversation, model/settings overrides, expected findings or prior outputs. The baseline was the working-tree skill including the five earlier uncommitted improvements; the candidate differed only in investigation step 4. Both received byte-identical fixture trees and Git history, identical requests and equivalent isolation instructions. No owner answers were supplied.

Inspection of both actual `maintenance/plans/cleanup-repository.md` and `maintenance/observations.md`, plus file comparisons, showed:

- Both accounted for all four straightforward candidates: the two private helpers, preview configuration and setup guide/link. Their independent cleanup batches were ready for a later implementation request.
- Both traced and retained the dynamic scheduled handler and documented manual command, reused preview authorization, and mapped all four legacy test cases explicitly.
- Both recorded the confirmed CSV bug separately and left dependent renderer removal awaiting an owner decision. Both stated the lack of live operational verification.
- Both added only the plan and observations; neither changed application files. Both reported seven passing baseline tests. The candidate plan explicitly recorded revisiting the unused declarations after the renderer investigation.

This pair passed the focused safety and candidate-accounting checks in both versions. It did not reproduce the earlier omissions or demonstrate a discovery improvement, and therefore supplies no causal evidence for the crowding-out hypothesis. The small, easily surveyed fixture and single pair do not establish behavior on a larger repository or guarantee improvement. Hermes was not rerun.

## 24. Reachable declarations and continuation from repository records

- Setup: run `python3 tests/create-continuation-fixture.py <new-temporary-directory>`. It extends scenario 23 with an unused export, private helper and indented nested declaration in a reachable module, an implicitly called `toString`, existing plan and shared observations, an explicit recorded preview retirement, and Git history showing a previously reported helper subsequently removed.
- Request: "Use codebase-cleanup. Inspect the repository again and build on the previous findings."
- Run with a fresh agent given only the skill, repository and request, no previous conversation or expected results. Confine writes to fixture maintenance records; forbid installs, network and delegation. Snapshot all files before and after and inspect actual records and diffs.
- Expected: `padAccountCode` remains valid; `alreadyRemoved` is resolved; the prior suspicion about `reconcile` is disproved by its dynamic scheduler consumer. Discover and account for `unusedExport` and `unusedNestedLabel`; retain implicit `toString`. Reuse the existing preview authorization without another question. Preserve the CSV behavior gap and legacy test evidence, keep dependent removals unready and independent cleanup ready. Update the existing plan and merge overlapping observations without duplicate entries or a new report/handoff package. Remove resolved/disproved observations and report corrections. State current baseline and coverage limits. No product edits.
- Repeat the same request with that agent after completion to cover same-agent continuation. No new changes or owner answers are supplied. A pass finding nothing additional should finish honestly, retain valid pending work and limitations, and neither execute nor invent findings or claim exhaustive cleanliness.
- The fixture test checks executable consumers and historical setup only. Actual agent output comparisons establish bounded behavioral evidence; neither establishes discovery improvement across real repositories. Existing scenarios 18–23 remain the checks for behavior gaps, manual commands, unresolved decisions and independently authorized execution.

### Recorded continuation evaluation: 2026-09-27

One fresh agent received the revised skill, scenario 24 repository and short repeat-inspection request, without earlier conversation or expected findings. Inspection of the actual files and Git diff confirmed that only the existing plan and observations changed. The plan accounted for unused exported, private, nested and manual-tool helpers; retained the dynamic scheduler and implicit coercion hook; resolved the removed helper; corrected the scheduler suspicion; and reused the recorded preview approval. The CSV observation was strengthened without duplication; dependent legacy removal stayed unready, with case-by-case test handling, and independent cleanup stayed ready. No product edits or additional records were produced.

The same agent received the repeat request again without new decisions or product changes. Comparing its files with the first-pass snapshot showed only baseline/progress/verification refreshes in those same records, no additional findings or batches, and no execution. Both passes ran seven passing fixture tests and reproduced the CSV gap separately.

This is bounded behavioral evidence for A–D, not a matched discovery-improvement comparison. The second pass re-read the small product tree, so this does not establish efficient evidence reuse at scale. Existing execution protection scenarios remain specified but were not rerun in this evaluation; Hermes was not touched. The package tests validate structure and fixture integrity, not agent behavior.

## 25. Shared observations and decisions with restructuring

- Setup: a repository whose `maintenance/` holds an existing cleanup plan for a module, an architecture observation about a list duplicated between that module and another, an implemented decision in `maintenance/decisions/repository.md` explaining why the module is served by its backend, and a restructuring plan that will remove a file the cleanup plan edits. The restructuring skill need not be installed.
- Request: "Inspect the web module again for cleanup and build on the earlier findings."
- Expected:
  - the existing cleanup plan reused;
  - the overlap with the restructuring plan recorded with one dated line in that plan, without rewriting it;
  - the existing observations revalidated and updated instead of duplicated;
  - the recorded decision treated as a constraint;
  - ownership or boundary changes left as architecture observations;
  - no decision document named after an operation, and no decision recorded as approved by cleanup.
- Failure signals: a cleanup batch that moves responsibilities between modules; duplicate observations; a `cleanup-` decision document; the restructuring plan rewritten.

### Recorded evaluation: 2026-09-27

One fresh agent received a copy of this skill, a repository matching the setup (built with the restructuring skill's architecture fixture, which is not part of this package) and the request, with no expected results. Inspection of the actual diff showed:

- the existing plan was reused and its unsupported rename withdrawn with evidence;
- one dated line was appended to the restructuring plan;
- existing observations were revalidated, one disproved entry was removed and new findings were added without duplicates;
- no decision document was created or changed, and no ownership change was planned;
- no product files changed.

One run on a small fixture is bounded evidence, not proof of consistency.
