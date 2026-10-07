---
name: delivery-workpack-execution
description: Execute one ready Stage 9 Delivery Planning WORKPACK.md directly in the target repository, and protect workpack lineage when a release or post-implementation change is requested for a workpack-built repository. Use when a user asks an agent to implement a bounded delivery workpack, apply a bounded implementation delta, or prepare/publish a release whose preflight may expose required code or configuration changes, whether invoked directly or under the host environment's native goal or continuation loop. Includes phases, tests, verification evidence, protected boundaries, stop conditions, and release-versus-implementation classification. Do not use for Software Design, workpack creation, plan-workflow execution, execution review, or bug-workflow stages.
---

# Delivery Workpack Execution

Execute one approved Delivery Planning workpack as the direct implementation contract. The workpack is the routing and completion truth for the run; linked Software Design and Build Design records remain authoritative for behavior, interfaces, constraints, and rationale.

## Activate Or Stop

Activate when the user explicitly asks to execute a ready `WORKPACK.md`, normally under `delivery-workpacks/`, and identifies the target implementation repository or current workspace. The request may arrive directly, as a Delivery Planning execution handoff, or inside a goal or continuation loop the user started and pointed at this skill manually; activation does not depend on a particular command, launcher, or automatic skill selection. Also activate in lineage-preflight mode when the user asks to publish, tag, or otherwise release a repository that already has a workpack-backed implementation report. Lineage-preflight mode may perform an authorized release-evidence-only operation, but it must not change implementation-owned files without a current bounded workpack.

Before changing code:

1. Read the complete workpack.
2. Resolve the active Delivery Planning and Software Design skill directories, then rerun the current workpack validator before trusting any readiness claim:

   ```sh
   node <delivery-planning-skill-directory>/scripts/validate-workpack.mjs \
     --workpack <delivery-workpack-directory>/WORKPACK.md \
     --software-design-skill <active-software-design-skill-directory>
   ```

   Report `NON_BLOCKING_PACKAGE_MAINTENANCE` notices separately; they do not authorize unrelated repairs or block the selected execution. Relevant contract, prerequisite, and compatibility errors still block.

   The validator must rerun the active Software Design skill's complete current Stage 9 readiness validation and Build Unit reconciliation, not merely compare two copied strings or pass a snapshot-only check. Stop if the handoff is stale or no longer ready, the workpack/handoff IDs differ, or any source, INPUT/INT/VO obligation, scope, responsibility, gate, boundary, acceptance, evidence, or phase contract fails.
3. Read `**Software Design snapshot:**`, resolve the one linked current Stage 9 handoff under `build/workflow/handoffs/`, and require an exact match with its current `**Snapshot ID:**`. Stop if either field is missing or malformed or the values differ. Do not make an old workpack appear current by editing only its copied ID except through the validated no-implementation-impact synchronization below.
4. Confirm the workpack's readiness outcome, complete Physical Realizability Closure, selected scope and `Target` versus `Existing prerequisite` roles, exact agreement between Target Build Units and the handoff writable subset, exact `INPUT-NNN`, `INT-NNN`, `PSEAM-NNN`, and structured `INV/SEC-xxx.VO-NNN` obligation coverage, `UI/UX Delivery Coverage` when present, phases, acceptance criteria, verification evidence, protected boundaries, every `LGATE-NNN`, and stop conditions. Require its snapshot-scoped `Delivery Evidence Contract`; a missing section requires a bounded Delivery Planning correction before execution. Also require the workpack's execution-eligibility, Stage 9 compatibility-closure, diagnostic/known-consumer-coverage, frozen-inventory termination, and affected-slice-isolation review fields.
5. Resolve every linked current canonical source needed for the current phase: Build Units under `build/units/`, Repository Build Designs and their derived `agent-guidance.md` under `build/repositories/`, `CONS-xxx` constraints, `SEL-xxx` selections, `VA-xxx` capabilities, and the linked `system-model/` Domains, System Responsibilities, flows, and contracts. Require these current canonical identities, paths, and record contracts; reject other formats. Do not replace linked sources with memory or reconstruct the design from ticket history.
6. Confirm the implementation target is the repository named by the workpack. If the workpack is in a separate planning repository, keep its source links readable and write implementation changes only to the target repository.

Before the first target-repository verification command, read and activate every exact runtime or toolchain pin declared by the workpack or repository. If the ambient toolchain is wrong, correct the recoverable environment mismatch and continue in the same execution turn; do not stop or return control unless the pinned toolchain is unavailable or verification still fails after rerunning under it.

Before modifying target source, execute the workpack's complete `Execution Environment Preflight`: disk capacity, toolchains, local immutable artifacts/images, services/ports, browsers/devices, and external access. Complete every safe independent check even when another fails; skip only checks transitively blocked by an observed prerequisite failure. Group failures by root cause and report them together. A workpack missing this required section needs a bounded Delivery Planning correction before source edits. Do not audit unrelated workstation state. If safe cleanup or another ordinary scope-preserving remediation resolves an environment failure, rerun the complete preflight and continue; otherwise stop once before source edits with the consolidated environment blockers.

Before modifying target source, reconstruct the exact frozen inventory recorded by Stage 9: the selected slice, direct and transitive implementation/build/verification prerequisites, protected changed interfaces, mechanically known direct consumers, required effectful commands, and directly affected implementation surfaces. Verify each declared direct-dependency addition has a concrete import, manifest, lock, generator, generated output, fixture, test, verifier, command-call, or exact-identity edge from an existing item. Do not expand through speculation or indirect product relationships. Run every safe independent probe even when another fails. A failed prerequisite blocks only dependent probes; record those separately and continue unrelated checks. Group all failures by canonical root cause and affected probes/slices. If any unexpected incompatibility or false Stage 9 premise remains, finish the safe diagnostic sweep and then stop once with the consolidated blocker report before changing source. After repair or resume, rerun the same frozen inventory from its beginning and require zero new blockers. A genuinely new item must identify the previously unavailable direct edge and be reported as a readiness-process defect; it must not silently start another expanding implementation loop.

Each compatibility probe must reach the shipped export, built entrypoint, public route, artifact reader, application mount, or operator command named by the workpack. A mock, producer-local helper, internal service method, health route, alternate controller, or test-only mount does not satisfy this preflight. If the selected slice creates or changes the producer, do not require its final post-change proof before implementation: rerun the candidate-fixture or current-consumer preflight first, then execute the completed built producer-consumer proof at its scheduled `VE-xxx`. The selected output's expected pre-implementation absence is not a blocker.

For every `PSEAM-NNN`, verify that current observations, implementation situation, boundary class, candidate proof/provenance, direct change-impact closure, and required-command effects still match the handoff and execute the mapped handling. A protected `implemented-evolution` requires the recorded focused candidate to reach the real existing consumer; source inspection or a planned final proof is not sufficient. Preserve `COMPATIBLE`, implement only a selected `DELTA_OWNED` class whose owner is a workpack `Target`, and preserve canonical exclusions. Before editing, confirm every required source/import, test/fixture/golden value, dependency/manifest/lockfile, generator/generated output, identity/freshness/receipt verifier, and configuration/evidence change is explicitly writable, and that every required build/deploy/regenerate/migrate/cross-repository command effect is compatible with a named protected boundary. If an observation changes, a new incompatible dimension appears, or any required delta belongs to an `Existing prerequisite` or omitted surface, finish the remaining safe independent checks and route one consolidated contradiction back to Software Design or Delivery Planning before editing source.

For each selected first-party repository, read the linked Repository Build Design's `Version-Control And Generated-File Policy` before changing `.gitignore` or an equivalent ignore file. Treat its must-track paths, must-ignore categories, generated-output disposition, secret/template rule, and verification procedure as protected repository construction inputs; do not infer a conflicting policy from local preference.

When the workpack creates, refreshes, or completes a repository boundary, also read its linked `agent-guidance.md` and materialize or reconcile the repository-root `AGENTS.md` exactly as the workpack requires. The repository file is an implementation projection of that guidance, not a competing design source.

Stop before implementation when the workpack is blocked, its linked source is missing or contradictory, the selected scope is ambiguous, or the target repository cannot be identified or written safely.

Check the captured workpack content as well as the snapshot when resuming after an interruption or when the user explicitly refreshes the Stage 9 handoff. Changes elsewhere in the Software Design package do not change this ID unless Software Design reconciles them into that handoff. Do not poll or interrupt an uninterrupted execution merely to monitor the ID. If the user asks to update an already implemented repository to the newest snapshot, classify the complete change first: synchronize the IDs directly when there is no implementation impact, or require a current workpack pinned to that snapshot and use the prior report only as the starting receipt for an implementation delta.

## Post-Implementation And Release Lineage

Before a release or any change to a previously completed repository, resolve the stable workpack, its snapshot, the implementation report, the current handoff, and the repository changes since the recorded implementation. Require the existing workpack snapshot and report `Implemented snapshot` to match before classifying the complete change. If the historical association is unknown, follow [legacy-lineage recovery](references/legacy-lineage-recovery.md) only with explicit user authorization.

Classify the requested or discovered change:

- `No implementation impact`: handoff or blueprint documentation, publication or tagging of the already-implemented tree, already-approved external registry/repository permissions, exact-version resolution or authorized installation, and evidence-only record updates. No implementation-owned tracked file or canonical implementation requirement may change. If the current handoff has a new Snapshot ID, copy it into the stable workpack, run the current workpack validator, and synchronize the evidence README and report to the same ID while retaining the prior execution summary as the physical implementation basis. Do not execute a no-op workpack, fabricate a snapshot-scoped execution summary or VE record, or leave the three IDs mismatched. Record any required release identity as artifact/version plus source revision, integrity, immutable resolution, and safe access result under the typed receipt path.
- `Implementation delta`: change source, package manifests, lockfiles, build/runtime/release configuration, workflows, tests, fixtures, or verification scripts, or satisfy a canonical requirement that needs such a change. Package repository metadata is implementation configuration. A mixed change is always an implementation delta.

If release preflight discovers missing package metadata, workflow configuration, tests, or another implementation-owned requirement, stop before publishing and require a current Stage 9 handoff plus bounded delta workpack. Do not make the quick file change under a no-implementation-impact label. After that workpack executes and its evidence names the same snapshot, resume the authorized release. Evidence-only updates after publication may append the immutable receipt; when they also refresh the handoff, synchronize all three IDs through the rule above.

## Execution Rules

- Follow the workpack phases in order and honor each phase's entry and exit criteria.
- Execute every mapped `INPUT-NNN` acquisition, production, bootstrap, or lifecycle obligation, every mapped `INT-NNN` / `IFACE-xxx.ACT-NNN` proof obligation, and every `PSEAM-NNN` handling/proof route. For every mapped structured Verification Obligation, preserve the selected Build Unit owners, produce its required evidence through the tracked repository `assurance/coverage.yaml` or canonical external/no-code route, run its mapped `VE-xxx`, and leave the manifest/result ready for the blueprint-wide assurance report. Preserve the exact evidence classes required by Stage 9. For `high`-risk interactions, collect the mapped positive, rejection/denial, and failure/recovery evidence; do not impose that three-case matrix on ordinary-risk interactions.
- Treat every unsatisfied `LGATE-NNN` as a hard prohibition on its named release, deployment, activation, operation, or readiness claim. Implementation may finish while a later gate remains open, but this run must not perform or claim the guarded later-lifecycle outcome.
- Implement the selected repository or Build Units only. Do not expand into excluded repositories, units, capabilities, applications, or infrastructure.
- Treat direct Build Unit dependencies as prerequisites. Do not integrate a dependent unit before its required dependency is independently buildable and verified.
- Run the workpack's required tests and verification procedures as soon as their prerequisites exist, then rerun the relevant checks after fixes.
- Treat a nonzero required command as diagnostic evidence, not automatically as a blocker. Diagnose the cause and attempt applicable safe, scope-preserving remediation; request approval through the available tool mechanism when remediation requires approval. Rerun the affected `VE-xxx` from its beginning and continue automatically when it passes. Do not repeat an unchanged retry without new evidence or a changed condition.
- Preserve verification evidence named by `VE-xxx` in the one snapshot-scoped execution summary. Keep concise observed results in `SUMMARY.md`; retain separate command output, fixture traces, boundary inspection, package lists, screenshots, or review notes under its optional `artifacts/` directory only when they materially support later verification.
- Require evidence to exercise the real consumer seam when `consumer-fitness` is claimed. Producer-local tests, mocks, an internal method, a health endpoint, a contract declaration, or file existence alone cannot satisfy that class.
- Preserve the Stage 9 contract-placement and fan-out classification. Do not reopen a shared producer merely because a consumer can adapt, push shared semantics into one consumer merely to stay in scope, or create a new version, profile, or adapter without canonical authority. If physical evidence contradicts the classification, stop and route the contradiction to Software Design instead of choosing locally.
- Stay inside the workpack's affected-slice disposition. Do not repair another repository or refresh another slice from this execution run. Preserve the exact producer receipt or canonical contradiction each affected downstream slice needs, so completion can state which slices are ready for Stage 9 refresh, still blocked, or unaffected.
- When the workpack creates, refreshes, or completes a repository boundary, materialize the approved ignore policy and run its repository-local hygiene check. Confirm representative disposable/local paths are ignored and representative source, configuration, lockfile, workflow, fixture, evidence, and manifest paths remain trackable.
- Keep changes focused. Preserve unrelated user changes and do not rewrite or clean up unrelated files.
- Do not delete, disable, weaken, rewrite, or bypass tests, fixtures, thresholds, golden outputs, exact runtime or toolchain pins, or verification procedures to obtain a pass.
- Make reversible local choices only where the workpack explicitly permits discretion. Record any non-obvious local choice near its owner.
- When implementation or review work is delegated, the main agent retains acceptance ownership. Treat worker reports and reviewer judgment as leads; inspect the actual execution artifacts and the observations a claim depends on before accepting it. Respect the host's existing permissions, delegation rules, and correction limits. When a correction loop repeats without new evidence, reassess the approach or stop with a precise blocker instead of retrying indefinitely.

## Human-Facing Delivery

Apply this section only when the workpack contains `UI/UX Delivery Coverage`. A non-UI workpack needs no prototype inspection, screenshots, or UI review evidence.

- Before implementing, open the approved specification and selected candidate the workpack names and inspect the covered journeys and states. The candidate is the presentation and interaction target; the specification owns presentation requirements, and canonical Software Design contracts own behavior.
- Adapt the candidate's navigation, layout, hierarchy, typography, palette, density, controls, and interactions into the chosen application stack. Deviate only for real content, responsive rendering, accessibility, and details the workpack or specification explicitly permits. For anything the candidate does not illustrate, apply explicit canonical requirements and the candidate's established patterns; route an unresolved material choice or contradiction to its design owner instead of redesigning or inventing behavior.
- Connect the interface to the actual system operations and sourced state named by the linked Build Unit `Material Interaction Bindings`. Mocks and prototype data may support component work and bounded tests but cannot satisfy functional evidence or completed integration.
- For implemented UI/UX evidence, start the built application through the workpack's application entrypoint, open equivalent journeys and states at the representative viewports, execute their interactions, and inspect the resulting state against the candidate. Correct material differences and rerun the affected functional and UI checks before claiming completion.
- If rendered inspection cannot be performed, the implemented UI/UX VE remains incomplete; source inspection, component tests, or passing functional tests do not substitute for it. Agent inspection needs recorded observations, not human confirmation; obtain human confirmation only when the workpack's review mode requires `human acceptance`.
- Record the `UI/UX Delivery Review` section of `SUMMARY.md` described in [delivery-evidence.md](references/delivery-evidence.md#uiux-delivery-review) and link representative screenshots under `artifacts/` from each implemented UI/UX VE. A prose assertion or a screenshot's existence does not prove acceptance; the recorded comparison and findings do.

## Execution-Start Identity

Before implementation edits, initialize the existing summary using the active skill paths:

```sh
node <delivery-workpack-execution-skill-directory>/scripts/execution-record.mjs \
  --mode start --workpack <WORKPACK.md> --repository <target-repository> \
  --planning-skill <active-delivery-planning-skill-directory> \
  --software-design-skill <active-software-design-skill-directory>
```

This reruns complete workpack readiness, then creates an `IN_PROGRESS` summary exclusively; it never overwrites an existing execution. It captures `Executed snapshot`, `Executed workpack content` (SHA-256 of exact workpack bytes), and `Execution started`. These are fields in the existing execution record, not a second handoff snapshot, manifest, per-file hash scheme, or orchestration layer.

Run the same helper with `--mode check --workpack <WORKPACK.md> --repository <target-repository>` before each phase, on interruption/resume, and before completion. Resume also reruns the current workpack validator. Any content change, including one that leaves the handoff snapshot unchanged, blocks continuing under the old record. Reconcile the changed scope through Delivery Planning, preserve the prior workpack and partial summary in recoverable history, and explicitly classify prior results before starting the reconciled workpack. Never replace the stored digest to make a check pass. For a same-snapshot revision, retain the old summary in recoverable history before issuing the replacement at the existing destination; do not add another execution registry.

Keep start fields immutable while appending observations. Only after all required checks pass add `Implemented snapshot`, finalize `COMPLETE`, and copy the same `Executed snapshot` and `Executed workpack content` into the report. Rerun current workpack readiness and the evidence validator before reporting completion. A legacy summary without these fields cannot prove exact workpack execution; preserve it and recover a genuine association or follow the authorized recovery route.

## Completion Evidence Layout

Before writing successful implementation evidence, read [delivery-evidence.md](references/delivery-evidence.md) and adapt the templates under [assets/templates/delivery-evidence](assets/templates/delivery-evidence). Materialize the workpack's exact paths:

```text
delivery-evidence/
├── README.md
├── IMPLEMENTATION-DELIVERY-REPORT.md
├── executions/
│   └── sha256-<full-workpack-snapshot-digest>/
│       ├── SUMMARY.md
│       └── artifacts/                         # optional
└── receipts/
    ├── publications/
    └── consumers/
```

Record every workpack AC and VE exactly once in `SUMMARY.md`; AC/VE identities are local to this snapshot. Do not continue a repository-global VE number sequence or create one Markdown file per VE. Do not create empty directories merely to reproduce the visual tree.

Use `artifacts/` only for bounded material machine output and never for secrets, credentials, caches, redundant build output, or giant logs. New publication and consumer-install receipts use the current unversioned schemas and their separate typed directories. Publication proves producer identity and integrity; installation proves consumer resolution and access; neither proves behavioral compatibility. Compatibility requires its shipped-seam VE.

Create or finalize a `COMPLETE` summary and update the README and implementation report only after every required VE passes. If execution stops, leave the prior completion evidence unchanged. A validated no-implementation-impact synchronization or receipt-only lifecycle action does not create an execution directory; preserve the prior summary as the physical implementation basis and append only the authorized typed receipt when applicable.

## Host Goal Or Continuation Loop

This skill supplies the implementation, verification, evidence, and acceptance instructions for one workpack. It is not a scheduler, loop, runner, or acceptance engine. When the host environment provides a native goal or continuation mechanism, that mechanism supplies continuation between turns; use only what the host actually supports and do not invent command names, APIs, or loop state.

- Treat every continuation turn of one uninterrupted goal as the same execution run. Continue from the workpack phase, preflight state, and recorded evidence rather than restarting completed work or re-deciding scope.
- If a continuation turn starts without the prior context, re-read the complete workpack, rerun the workpack validator, and repeat the snapshot comparison as a resume before continuing.
- Mark the host goal complete only when `Completion` is satisfied and its evidence validator passes. When a `Stop And Escalate` condition holds, stop continuation and report the blocker through the host's normal mechanism; do not keep iterating, relax a requirement, or report success to end the loop.
- The host's permissions, approval flow, and delegation rules apply unchanged; they never transfer acceptance ownership away from the main agent.

## Legacy Workflow Boundary

This skill is direct execution of a Delivery Planning workpack under whatever goal or continuation mechanism the host provides. Do not invoke or route to `execute-plan`, `idea-to-plan`, `writing-plan`, `validate-plan`, `pre-execution-bug-risk-audit`, `execution-review`, `bug-lifecycle`, or the legacy bug-workflow skills. Do not create a second plan, runner manifest, execution-review package, bug-workflow package, or alternate workpack.

The workpack may require tests, fixtures, package configuration, CI configuration, and release configuration as implementation outputs. Those are part of the selected delivery when the workpack names them; they do not convert the run into the legacy plan workflow.

## Stop And Escalate

Stop and report the exact blocker when:

- a material behavior, public API, canonical encoding, invariant, authority boundary, dependency direction, release rule, or security/custody boundary must change;
- a required test, fixture, command, boundary check, package list, or external configuration check still cannot run or pass after applicable safe, scope-preserving remediation, required approval is denied or unavailable, or remediation would violate the workpack scope or a protected boundary;
- implementation requires a provider, persistence, wallet, secret, participant signing, scheduler, broadcaster, lifecycle authority, automatic CPFP, or another excluded capability;
- a direct dependency is not independently green before integration;
- a workpack instruction conflicts with its linked Software Design, Build Design, constraint, or selection;
- the physical ignore configuration hides a must-track path, exposes a prohibited secret/local path, or lacks the required repository-hygiene verification route;
- the user asks to expand scope or bypass a verification gate; or
- the user or workpack asks this implementation run to perform or claim an action prohibited by an unsatisfied `LGATE-NNN`.

Route a system-contract or correctness change back to Software Design, a repository or package realization change back to Build Design, a readiness problem back to Stage 9, and an external repository-setting or scope decision to the user.

## Completion

Do not claim completion until every applicable acceptance criterion is satisfied and every required verification item has actual evidence from the physical target repository. Report:

- `Implemented snapshot: sha256:<the exact workpack snapshot>`;
- implemented phases and selected scope;
- tests and verification commands run with their results;
- preserved evidence locations;
- structured Verification Obligation results and repository manifest routes, or the workpack's VO-free disposition;
- for human-facing scope, the reviewed build, viewports and states, per-journey functional and implemented UI/UX results, and deviations or limitations;
- exclusions and unclaimed capabilities;
- every unsatisfied `LGATE-NNN`, its prohibited action or claim, and any remaining external confirmation or release action; and
- for a producer or shared-boundary delta, the exact producer receipt plus each mapped downstream slice classified as `Ready for Stage 9 refresh`, `Still blocked` with reason, or `Unaffected`; and
- any deviation or escalation.

Record the implemented ID in the normal completion report only after the exact workpack has executed successfully; do not create a separate snapshot or change-impact artifact solely for it. Never replace a prior `Implemented snapshot` with an implementation-impacting handoff ID before matching workpack execution. For a validated no-implementation-impact handoff refresh, synchronize the handoff, workpack, and report IDs without another execution or additional artifact. If execution stops or remains incomplete, report the attempted snapshot but do not label it implemented.

After materializing successful implementation evidence and before claiming completion, run:

```sh
node <delivery-workpack-execution-skill-directory>/scripts/validate-delivery-evidence.mjs \
  --workpack <delivery-workpack-directory>/WORKPACK.md \
  --repository <target-implementation-repository>
```

Resolve every failure. This validator is for an implementation execution; do not use it to fabricate a summary for a no-implementation-impact synchronization or receipt-only lifecycle action.

Do not claim public-network, cross-domain, live registry, branch-protection, or other external evidence unless the workpack explicitly requires it and the evidence was actually collected.

For a documentation-only snapshot synchronization, retain the original summary's `Executed snapshot`, `Executed workpack content`, start time, and observations unchanged. Keep those same executed-basis identities and the old summary link in the current report while updating its current `Implemented snapshot`; explain `Refresh classification: No implementation impact` with the reviewed reason. This is a reconciled current documentation identity, not a claim that the newer workpack was executed. Preserve the original exact workpack in recoverable history. Missing historical identities must remain unknown, never backfilled from current content. The execution evidence reference describes mechanical verification of an ID-only refresh; broader prose-only reconciliation requires review without fabricating execution.
