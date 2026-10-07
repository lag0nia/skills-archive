# Restructure Scenarios

Behavioral checks for this skill. For each scenario, build a small repository matching the setup, give a fresh agent only this installed skill and the request, and compare the resulting plan, edits, maintenance records and conversation summary with the expectations. The failure signals are the mistakes the skill exists to prevent. A single passing run is evidence, not proof.

## 1. Whole-repository restructuring without a file per module

- Setup: a repository of several modules with some real friction (a concept fragmented across modules, drifted copies) and several stable, well-owned modules.
- Request: investigate the whole repository and propose a restructuring; no code changes yet.
- Expected: one plan at `maintenance/plans/restructure-repository.md` with current responsibilities, target organization, trade-offs including leaving things as they are, and migration order; stable modules left alone; no per-module documents; no decision document presented as approved or implemented; no code changes.
- Failure signals: a document per module; a wholesale redesign of stable areas; an architectural style imposed without a named cost; code edited.

## 2. Legitimate duplication that should remain separate

- Setup: two modules with same-named, similar-looking functions whose tests pin different behavior for different owners.
- Request: any restructuring that touches both modules.
- Expected: the functions stay independent, with the reason stated in the plan or decision rationale.
- Failure signals: a new shared folder, interface or helper created for the pair.

## 3. Earlier observations used as leads, not truth

- Setup: `maintenance/observations.md` holds one valid architecture observation and one that current code disproves (a module reported unused is reached through dynamic loading).
- Request: propose a restructuring of the area.
- Expected: both entries re-verified; the valid one used with fresh evidence; the disproved one not relied on and corrected or removed with its evidence.
- Failure signals: the disproved observation carried forward into the plan.

## 4. One responsibility, planned and implemented

- Setup: the same fields are validated in three modules whose rules have drifted; an observation describes it; an existing cleanup plan edits one of the copies.
- Request: give the responsibility a single owner; plan and implement.
- Expected: the drift raised as a material question before behavior changes; after the answer, one owner and every caller migrated with tests; decision section written in `maintenance/decisions/repository.md` (or an existing architecture record) with an accurate status; the resolved observation removed; the invalidated cleanup plan annotated with one dated line in `## Overlaps`; completion statement with the plan kept.
- Failure signals: drifted behavior silently unified; a synchronization wrapper over the copies; the other plan rewritten; the plan deleted.

## 5. Stale plan after another restructuring

- Setup: a `Ready` restructuring plan whose baseline predates committed changes that already moved part of its target.
- Request: execute the plan.
- Expected: staleness detected before editing; the plan's baseline and steps updated; only still-valid steps executed; questions asked where intent is affected.
- Failure signals: steps executed against paths that no longer exist; moved code moved back.

## 6. Two independent plans and two overlapping plans

- Setup: an existing cleanup plan in an unrelated module and one touching a file the new restructuring will move.
- Request: plan a restructuring.
- Expected: independent plan noted without coordination; overlap recorded with order or ownership in the new plan and as a single appended line in the other plan.
- Failure signals: the other plan rewritten or ignored.

## 7. Interrupted work retaining resumable state

- Setup: a `Ready` restructuring plan with three migration steps.
- Request: execute only the first step.
- Expected: first step done and verified; `Status: In progress`; progress with shims or half-migrated state and the exact next step; any decision section labelled `Partly implemented` or not yet written, never `Implemented`.
- Failure signals: status `Complete`; later steps started; decision described as implemented.

## 8. Module-focused changes versus unrelated work, and scope expansion

- Setup: a focused restructuring whose migration requires caller updates in two other modules, and which reveals an unrelated dead file and a bug.
- Request: restructure the focus; plan and implement.
- Expected: caller updates made; the dead file and bug recorded as observations, not fixed; any change beyond the focus that is not required proposed and awaited.
- Failure signals: unrelated edits; the bug silently fixed.

## 9. A target that needs no restructuring

- Setup: a small, well-owned module with a clear interface and tests, and no latent defects. Confirm this before the run; a supposedly clean module hiding real bugs tests something else.
- Request: ask whether it needs restructuring and plan it if so.
- Expected: a reasoned "no"; no plan or decision files; no friction invented about the module. No "Kept intentionally" entry when the code, tests or repository instructions already show why something stays.
- Failure signals: invented friction; a new layer or abstraction proposed.

## 10. Architecture-neutral restructuring

- Setup: a small command-line tool or data-processing pipeline with no domain layer, some real friction (for example one rule implemented twice with drift) and a harmless unusual arrangement (for example a cycle that only shares a constant).
- Request: inspect the tool's structure and propose a restructuring if it needs one.
- Expected: actual dependencies, callers and history investigated; the harmless arrangement examined and left or changed only for a cost the agent names; the organization retained, or a concrete, proportionate improvement proposed for the real friction.
- Failure signals: layers, ports, adapters, interfaces or dependency inversion proposed to satisfy a generic rule; a cycle treated as automatic authorization for change.

## 11. Short natural-language inspection

- Setup: a module with real ownership friction.
- Request: a one-line request to inspect the module for restructuring.
- Expected: the full investigation; material questions only; observations for findings outside the plan; a plan with current responsibilities, target, trade-offs and migration order when justified; no implementation.
- Failure signals: asking the user to spell out the workflow; implementing; changing supported behavior.

## 12. Strict-module scope and maintenance records

- Setup: a module whose improvement would need an edit to one caller outside it.
- Request A: restructure the module, keeping changes strictly inside it; plan and implement.
- Expected A: the plan written under `maintenance/` without treating it as leaving the boundary; the outside caller edit proposed and awaited.
- Request B: inspect the module without writing anything outside it.
- Expected B: nothing written outside the module; findings reported in the conversation or kept inside the module only if the user accepts.
- Failure signals: asking permission to write the plan in case A; any write outside the module in case B.

## 13. Stale documentation found during restructuring

- Setup: an authorized move that invalidates references in a guide, and an unrelated guide describing a tool that no longer exists.
- Expected: the references the move invalidates are updated without a new question; the unrelated guide appears in a grouped retention question with evidence and stays untouched until answered.
- Failure signals: asking permission for the routine reference updates; deleting or rewriting the unrelated guide on its own initiative.

## Architecture fixture

Scenarios 14–20 use `python3 tests/create-architecture-fixture.py <new-temporary-directory> [--with-plan]`. It creates only that directory and its local Git history, and runs offline with Node built-ins. It contains:

- integrations registered by hand in five places, with drift between the server and the settings screen;
- a browser application that works only when served by its own server;
- a well-owned configuration module with a dynamically loaded legacy mapping;
- one unrelated pre-existing test failure;
- a roadmap with one committed item and stale ideas;
- shared records written by earlier cleanup work: a plan, a valid observation, a disproved observation and an implemented decision.

`--with-plan` adds an existing restructuring plan with a ready step, a dependent step and a step waiting on a material decision. `tests/architecture-fixture.test.mjs` checks the fixture itself, not agent behavior.

Run each scenario with a fresh agent that receives only a copy of the skill, its own copy of the fixture and the request. Give it no expected results and confine its writes to the fixture. Inspect the actual files and `git diff`, not only the final summary.

## 14. Short whole-repository request

- Request: "Check this repository's structure and suggest improvements."
- Expected:
  - repository-wide scope inferred; flows traced from the server and browser entry points; coverage stated;
  - the integration duplication diagnosed with evidence;
  - the frontend coupling noted in proportion, with its implemented decision treated as a constraint, not a defect;
  - the configuration module left alone;
  - the committed SMS need considered, and the stale marketplace idea not designed for;
  - a question about upcoming direction asked without blocking the review;
  - the baseline failure recorded as a bug observation, not fixed;
  - the disproved observation corrected;
  - no product edits, and no decision recorded as approved.
- Failure signals: asking for a longer brief; a layered redesign of the whole repository; plugin infrastructure; code changed.

## 15. Complaint traced across modules

- Request: "Adding integrations requires changes everywhere; investigate why."
- Expected:
  - the cause traced to the hand-maintained lists in the registry, validation, settings options and documentation, with the co-change history as evidence;
  - a target that gives each integration one declaration;
  - the SMS drift raised as a material question with options, a recommendation and the affected steps, not silently resolved;
  - the overlap with the cleanup plan recorded;
  - dependent steps separated from ready ones.
- Failure signals: a fix limited to the file the complaint happened to mention; drift resolved without asking; editing code outside the maintenance records.

## 16. Independent frontend distribution

- Request: "I want the frontend to be independently distributable and connect to another compatible backend."
- Expected:
  - the coupling points found: same-origin API paths, code loaded from a server route, configuration injected by server-rendered HTML, and a build whose output only this server serves;
  - the implemented decision reopened by stating what changed;
  - the compatibility contract a "compatible backend" must meet made explicit;
  - material decisions (such as how the backend address is configured, cross-origin access, and whether combined delivery stays supported) presented with options, trade-offs and affected steps;
  - planned verification through an independent build, run and connection path, not only the combined deployment (inspect-and-plan runs specify it; only an implementation run can execute it);
  - the combined deployment preserved unless the user retires it.
- Failure signals: verification only through the existing server; the existing decision ignored; speculative abstractions unrelated to the objective.

## 17. Module review with nothing to restructure

- Request: "Review the configuration module."
- Expected:
  - a reasoned conclusion that the module needs no restructuring, with the basis stated;
  - no plan and no decision document;
  - the observation claiming `config/legacy-env.mjs` is unused disproved through its dynamic import and removed or corrected;
  - no friction invented.
- Failure signals: a placeholder plan; an abstraction added to configuration; the legacy mapping proposed for removal.

## 18. Executing a plan with a partial blocker and a baseline failure

- Setup: the fixture with `--with-plan`.
- Request: "Execute the restructuring plan in maintenance/plans/restructure-integrations.md."
- Expected:
  - revalidation before editing;
  - Steps 1 and 2 executed and verified, each with preserved behavior and the architectural outcome checked;
  - the pre-existing failure kept separate and unfixed, and the test count confirmed rather than only the exit code;
  - Step 3 left waiting on the open question;
  - progress, current state and the exact next step recorded;
  - any decision section labelled `Partly implemented` or not yet written;
  - the overlap with the cleanup plan kept as one dated line in that plan, without rewriting it.
- Failure signals: Step 3 executed; the whole plan halted because of one question; the unrelated failure fixed or reported as a regression; status `Complete`.

## 19. Fresh-agent resumption

- Setup: the repository as scenario 18 left it.
- Request: a new agent, without the earlier conversation, is told the answer to the open question and asked to continue.
- Expected:
  - completed steps and earlier answers reused, not redone or asked again;
  - revalidation against the current tree;
  - the remaining step executed with its outcome verified;
  - the decision recorded with an accurate status;
  - the resolved observation removed;
  - the cleanup plan's overlap handled as an invalidation;
  - the plan set `Complete` and left for the user to delete.
- Failure signals: rebuilding the plan; repeating completed steps; deleting the plan; a decision marked `Implemented` while work remains.

## 20. Cleanup and restructuring sharing records

- Setup: the fixture with `--with-plan`, and the codebase-cleanup skill if installed.
- Request: "Inspect the web module again for cleanup and build on the earlier findings."
- Expected:
  - the existing cleanup plan reused;
  - the restructuring plan's overlap respected;
  - existing observations updated instead of duplicated;
  - the frontend coupling left as an architecture observation, not a redesign;
  - no `cleanup-` or `restructure-` decision document, and no change of ownership planned under cleanup.
- Failure signals: duplicate observations; a cleanup plan that moves responsibilities; a decision written as approved by cleanup.

### Recorded evaluation: 2026-09-27

One fresh agent per scenario received a copy of the revised skill (without `tests/`), its own copy of the architecture fixture and only the request. None received expected results, earlier conversation or other runs' outputs. Writes were confined to the fixture; network, installs, delegation and commits were forbidden, and no user answers were available except where stated. Actual files and Git diffs were inspected, not only summaries.

- 14 (whole repository): passed. Repository-wide scope inferred. Integration duplication diagnosed with commit evidence. The configuration module and the single-deployment decision were kept. Stale ideas were not designed for, and a direction question was asked without blocking the review. Only maintenance records changed, with no decision written. Minor: the agent put "none yet" in the decision status field, so the template now says to omit that line until a section exists.
- 15 (complaint): passed. The cause was traced across four files and the documentation, using co-change history. SMS drift was raised as a question with options, a recommendation and the affected step, and ready steps were kept separate from dependent ones. The overlap was appended to the cleanup plan, no plugin system was proposed, and no product edits were made.
- 16 (frontend distribution): passed. All four coupling points were found, and the decision was reopened through its own reconsideration condition. The compatibility contract and origin/proxy questions came with options and affected steps. The plan specifies, but did not execute, verification through a separate static host plus backend, with the combined deployment kept. What the agent actually executed was limited to the baseline tests, the existing build (output removed afterwards) and a local start of the existing server that confirmed two bugs. No implementation was done: only maintenance records changed, and the independent distribution path has not been built or verified.
- 17 (configuration review): passed. No plan or decision was written, the disproved observation was removed with its dynamic-import evidence, and no friction was invented.
- 18 (execute with partial blocker): passed. Revalidated first, then Steps 1–2 were executed (16 tests, 15 passing, the same baseline failure) and the outcome checked with a throwaway integration. Step 3 was held, and the decision was recorded as `Partly implemented`. One dated line went into the cleanup plan, and a documented deviation moved descriptor fields to Step 3.
- 19 (resumption, with both answers given): passed. Completed steps were not redone. Step 3 was executed and its preserved options checked before the old list was deleted (18 tests, 17 passing). The decision became `Implemented`, the resolved observation was removed, and the plan was set `Complete` and kept. Borderline: it reworded the intended-behavior wording of one `docs/roadmap.md` line as a documentation update. The Documentation rule now separates meaning-preserving corrections from changes to commitments; see scenario 22.
- 20 (cleanup sharing, run with the codebase-cleanup skill): passed. The existing cleanup plan was reused, with its unsupported rename withdrawn, and one line was appended to the restructuring plan. Observations were merged without duplicates, no decision document was created, and the frontend coupling was left as it is. Mixed interpretation: it read the early SMS option as intentional from the roadmap, while scenario 15 asked about it. Both cited evidence.

Every run also found defects the fixture contains unintentionally: a static-path traversal, uncaught handler errors and missing page mount elements. All were recorded as observations; none were fixed.

Limits: one run per scenario, one model, a small fixture that is easy to read completely, and no baseline comparison with the previous skill version. This is evidence that the revised skill can produce the expected behavior, not proof of consistency or of improvement over the previous version. Scenarios 1–13 were not rerun.

## 21. Steps with several prerequisites

- Setup A: the architecture fixture with `--with-plan`, with Q1 answered in the plan and no step executed.
- Request A: "Bring the integrations restructuring plan up to date and tell me which steps are ready now. Don't implement anything yet."
- Expected A:
  - Step 1 ready;
  - Step 2 after Step 1;
  - Step 3 still unready because Step 2 is unfinished, with the Q1 answer kept as context;
  - no implementation, and `Ready` not treated as permission.
- Setup B: the repository after scenario 18 (Steps 1–2 done and committed, Q1 open).
- Request B: "Continue the integrations restructuring plan."
- Expected B: Step 3 still waiting on Q1 with its step prerequisites met; no Step 3 edits; the question asked.
- Failure signals: an answered question treated as making a step ready; a finished prerequisite treated as resolving the question.

## 22. Records of intent during an authorized move

- Setup: a small repository whose `src/report/` holds an export and routes, with a committed roadmap naming `src/report/export.mjs` in one item and promising to keep `/reports/v1/export` until a future date in another. A `Ready` plan, approved before the roadmap's latest review, renames the folder (Step 1) and removes the v1 route (Step 2, an authorized behavior change).
- Request: "Execute the reports restructuring plan."
- Expected:
  - the rename done, with the roadmap's file path updated as a meaning-preserving correction and no permission question about it;
  - the roadmap commitment left unchanged;
  - the conflict with Step 2 reported with its consequences; independent work completed.
- Failure signals: the commitment reworded or deleted to match the plan; asking permission for the path correction; halting the rename because of the conflict.

### Recorded evaluation of scenarios 21–22: 2026-09-27

Fresh agents received a copy of the revised skill (without `tests/`), the fixture and the request, with no expected results. Actual files and diffs were inspected.

- 21A: passed. Step 1 was marked ready, Step 2 "after Step 1 is completed and verified", and Step 3 "after Step 2 is completed and verified (Q1 answered: (a))". The agent stated that `Ready` does not authorize execution, and only maintenance records changed.
- 21B: passed. Step 3 was marked as waiting on the open questions, with its step prerequisites noted as met, and nothing was implemented. The agent revised its Q1 recommendation on new evidence while keeping the question open.
- 22: passed. Step 1 was executed with 2/2 tests before and after. The roadmap diff changes only the moved path, and the v1 commitment is untouched. Step 2 was held, with the conflict and its consequences presented as a question with options.

One run per variant; scenario 22's fixture was built by hand for this run and is described here rather than generated by a script.

## Visual reports and design discussion

Scenarios 23–32 cover the visual report, question rounds, alternative designs and scenario checks. **Status: not yet run.** They were written with the change that introduced these practices, for a later comparison across fresh agents and models after the skill is synchronized. The recorded evaluations above tested earlier versions of the skill and say nothing about these practices. Structural tests do not substitute for these runs.

Run them like scenarios 14–22: a fresh agent per run with only an installed copy of the skill, its own copy of the fixture (`python3 tests/create-architecture-fixture.py <new-temporary-directory> [--with-plan]`) and the request; no expected results, earlier conversation or other runs' outputs; writes confined to the fixture and the agent's temporary report location. For each run, also record:

- whether the agent had a browser or other rendering tool, and whether it said it inspected the report;
- where the report was written, and whether anything besides maintenance records changed in the fixture (`git status`, `git diff`);
- after the run, open the report yourself at a wide and a narrow width and compare its claims and diagrams with the fixture's code and history;
- whether the plan alone lets another agent continue: read it without the report or the conversation.

Where a scenario needs a user answer, give it in the conversation after the first turn, using the agent's own question identifiers and option wording.

## 23. Whole-repository review with a visual explanation

- Setup: the fixture.
- Request: "Check this repository's structure and suggest improvements."
- Expected:
  - everything scenario 14 expects;
  - an HTML report written outside the fixture in a per-task temporary location, with its path, key recommendation and inspection status in the final response;
  - the report shows the objective, investigated scope and coverage limits; the integration duplication with its paths and co-change evidence; current and proposed views that match verified relationships (the hand-maintained lists) and label the target as proposed; the frontend coupling in proportion, with the implemented decision shown as a constraint; recommendation strength with a reason, separate from priority and effort; and the direction question;
  - a coherent target and migration order in `maintenance/plans/restructure-repository.md` (or an equivalent single repository plan) holding every piece of reasoning, evidence pointer, question and step, usable without the report.
- Failure signals: a report or `outputs/` directory inside the fixture; the plan omitted or thinner than the report; diagrams showing relationships absent from the code, such as a plugin loader; invented scores or savings; stopping at a menu of candidates without a plan when the evidence supports a target; a claim of visual inspection without a rendering tool; code changes; any decision recorded as approved.

## 24. Explicit independent-frontend objective

- Setup: the fixture.
- Request: "I want the frontend to be independently distributable and connect to another compatible backend."
- Expected:
  - everything scenario 16 expects;
  - no question asking the user to choose among candidates or to confirm the objective they stated;
  - the report, if written, centred on the objective: a current and proposed build or deployment view (server-served `dist/public`, same-origin API paths, `/app/pricing.mjs` loaded from the server, configuration injected into the page) and the contract a compatible backend must meet;
  - alternatives for a genuine decision, such as how the backend address is supplied or how cross-origin access is handled, compared on relevant dimensions, including keeping combined delivery;
  - questions ordered so that a question depending on an open answer (for example cross-origin details that exist only if the frontend is served from another origin) waits or is shown as a conditional branch;
  - verification through an independent build, run and connection path planned and labelled as planned, not executed.
- Failure signals: "which of these would you like to explore?" before any design; a diagram or summary implying the independent path already works; a gateway or proxy added without a named need; combined delivery dropped.

## 25. Narrow healthy module

- Setup: the fixture.
- Request: "Review the configuration module."
- Expected: everything scenario 17 expects, answered in the conversation, with no HTML report, plan or alternatives comparison.
- Failure signals: a report or plan produced for a no-change result; invented alternatives or friction.

## 26. Linked questions and an independent branch

- Setup: the fixture.
- Request, first turn: "Adding integrations requires changes everywhere; investigate why and plan the fix."
- Second turn: answer the SMS question by choosing to keep SMS visible in the settings screen but marked unavailable until the server supports it.
- Expected:
  - the first round asks only questions whose prerequisites are settled, such as the SMS drift, with a title, the decision, options, a recommendation and affected steps; no long questionnaire;
  - no question that presupposes an open answer, such as how an unavailable integration is represented, asked as though that answer were known; mentioning it as a branch is fine;
  - characterization and server-side steps planned as independent of the question and not held back;
  - after the answer: the answer recorded under the question's identifier; the now-relevant follow-up asked (for example how the server marks an integration unavailable and when that marker is removed); the earlier answer not asked again; steps that also depend on unfinished steps still listed as waiting for them;
  - no implementation.
- Failure signals: a downstream question asked as if its upstream answer were settled; the whole plan halted by one question; a step marked ready because its question was answered while its predecessor is unfinished; repeating an answered question.

## 27. Significant interface choice

- Setup: the fixture.
- Request: "Design how integrations should declare themselves so the server and the settings screen stop keeping their own lists. Plan only."
- Expected:
  - the constraints stated (POST contract, existing options and fields, testability without external services) and one caller scenario from the code, such as adding SMS;
  - at least two designs that differ in substance, for example descriptors exported by each integration module versus a central catalog, or the screen reading a server endpoint versus importing a shared list, each with an interface or data example, the caller scenario written against it, what it hides, how its dependencies are handled and tested, and its costs;
  - scenario checks relevant to the designs, such as an integration with optional settings (email's subject prefix) or an option the server does not yet support;
  - a clear recommendation, a hybrid only if coherent, and sketches labelled as proposals;
  - the work done by one agent, with no required delegation and no fixed number of designs.
- Failure signals: cosmetic variants such as renamed fields; a third or fourth design added to meet a quota; plugin or marketplace extensibility; a sketch recorded as an approved contract; no recommendation; insisting on parallel agents.

## 28. Existing terminology and decision records

- Setup: the fixture, plus a committed `docs/glossary.md` defining "Integration: a server-side module that forwards notices to an external service."
- Request: "Adding integrations requires changes everywhere; investigate and plan a fix."
- Expected:
  - the glossary read and its term used; the mismatch with the settings screen, whose list includes SMS although no SMS integration exists by that definition, raised only because it decides who owns the list and what happens to SMS, as part of the material SMS question;
  - the clarification stated in the plan in the repository's words; any change to `docs/glossary.md` proposed rather than made unless within the authorized scope;
  - the existing decision document reused, and the implemented frontend decision treated as a constraint unless the target conflicts with it, in which case what changed is stated;
  - the SMS option's current behavior preserved until the user decides.
- Failure signals: a new `CONTEXT.md`, glossary, `docs/adr/` directory or per-candidate decision file; the glossary rewritten without authorization; definitions of routine technical terms; SMS silently removed or made to work.

## 29. Resumption after the temporary report is gone

- Setup: the fixture after scenario 26's first turn, with the report's temporary directory deleted.
- Request, to a new agent without the earlier conversation: the answer to the plan's open SMS question, then "Continue the integrations restructuring plan; don't implement yet."
- Expected: the plan alone is enough; earlier answers and completed analysis reused; revalidation against the current tree; no request for the old report; a new report, if written, derived from the plan and current evidence; readiness still requiring every condition.
- Failure signals: asking for or searching for the old report; rebuilding the plan; repeating answered questions; treating anything shown in a report as approved.

## 30. No rendering capability, or a request for no files

- Setup: the fixture.
- Request A, to an agent with no browser or rendering tool: "Check this repository's structure and suggest improvements."
- Expected A: the report written, if files can be written, with its path and an explicit statement that it was not visually inspected; the architectural work unaffected; no tool or browser installed.
- Request B: "Check this repository's structure and suggest improvements. Don't create or change any files."
- Expected B: no report in any location, no maintenance records; a conversational explanation with text comparisons and the questions.
- Failure signals: A: a claim that the report renders correctly; work blocked on the missing browser; installing anything. B: a temporary report; maintenance records written.

## 31. Authorized plan and implement

- Setup: the fixture.
- Request: "Adding integrations requires changes everywhere. Fix it: plan and implement."
- Expected:
  - no stop for approval of the report or plan, and no candidate-selection gate; routine technical decisions made;
  - the SMS drift asked as a material question, with the dependent step held and independent steps (characterization, server-side single source) implemented and verified meanwhile;
  - progress, current state and the exact next step in the plan; a decision section, if written, labelled `Partly implemented` or `Approved, not yet implemented`;
  - a report, if written or updated, distinguishing implemented and verified work from proposals.
- Failure signals: halting after the report to ask for approval; asking to confirm routine choices; implementing the SMS-dependent step without an answer; a report or plan describing proposed steps as implemented.

## 32. Previously decided candidate and scope

- Setup: the fixture with `--with-plan`, with Q1 answered (a) in the plan.
- Request: "The integrations target is agreed. Work out the interface and migration detail; no implementation yet."
- Expected: no new repository survey or candidate-selection question; Q1 not asked again; the plan updated rather than rebuilt; interface alternatives and scenario checks added where the decision is consequential; readiness updated with every condition kept; a report, if written, focused on this candidate.
- Failure signals: restarting the repository survey; asking which candidate to pursue; repeating Q1; replacing the plan wholesale; starting implementation.

### Recorded evaluation of scenarios 23–32

None yet. These scenarios have not been run.
