---
name: software-design-execution
description: Implement an authorized Software Design delivery workpack (WORKPACK.md) directly in its target repository, in dependency order, and record verifiable delivery evidence. Use when the user authorizes executing a workpack or a sequence of workpacks, applying a bounded implementation delta, or continuing that work under the host's goal or continuation loop. Also use before preparing, tagging, or publishing a release of a repository built from workpacks, or changing it after implementation: release preflight that needs code or configuration changes stops until a current workpack covers them. Covers readiness revalidation, environment preflight, execution identity, verification evidence, rendered UI/UX review, protected boundaries, lifecycle gates, and release-versus-implementation classification. Workpacks naming delivery-workpack-execution route here. Do not use to create or revise designs or workpacks (software-design), or for plan-workflow, execution-review, or bug-workflow stages.
---

# Software Design Execution

The workpack is the routing and completion truth for the run, and every section of it binds as written; linked Software Design and Build Design records stay authoritative for behavior, interfaces, constraints, and rationale. This skill adds only execution mechanics. A workpack whose `**Execution skill:**` still names `delivery-workpack-execution`, this skill's former name, routes here and runs unchanged.

## Activate

Activate when the user explicitly authorizes a workpack, or a sequence of workpacks, under `delivery-workpacks/` and names the target repository. It may arrive directly or inside a host goal or continuation loop; it rests on the user's words, not on any command or automatic skill selection. Creating, refreshing, or validating a workpack authorizes planning only; a planning report or generated follow-up never authorizes execution. Read [execution eligibility](references/execution-eligibility.md) and start only a workpack it admits; keep later plans of a sequence and verify their prerequisites before starting each.

Lineage mode starts when the user asks to release, tag, or publish a repository built from workpacks, or to change one after implementation. Follow [Release And Post-Implementation Lineage](#release-and-post-implementation-lineage).

## Before Source Edits

1. Run the start command:

   ```sh
   node <software-design-execution-skill-directory>/scripts/execution-record.mjs \
     --validation-mode execution \
     --mode start --workpack <WORKPACK.md> --repository <target-repository> \
     --software-design-skill <software-design-skill-directory>
   ```

   It reruns the Software Design workpack validator in execution mode (complete current Stage 9 readiness), then creates the `IN_PROGRESS` execution summary with the **start identity**: `Executed snapshot`, `Executed workpack content` (SHA-256 of the exact workpack bytes), and `Execution started`. A readiness failure means the workpack cannot run now: report the validator's errors and stop. It forwards `NON_BLOCKING_PACKAGE_MAINTENANCE` notices; report them separately, as they neither block this run nor authorize unrelated repairs. It refuses to overwrite a summary or to start beside an `IN_PROGRESS` one; resume that run with `check`.
2. Run the workpack's `Execution Environment Preflight` under its failure policy, activating, never relaxing, every exact runtime or toolchain pin the workpack or repository declares before the first verification command. Remediate a recoverable cause (a wrong ambient toolchain, reclaimable disk) within scope, rerun the complete preflight, and continue in the same turn. When a blocker remains, stop once with the consolidated report.
3. Recheck the frozen inventory and every `PSEAM-NNN` against the real shipped seams; [target preflight](references/target-preflight.md) gives the procedure. Route one consolidated contradiction to Software Design before editing source.
4. When the workpack creates, refreshes, or completes a repository boundary, read the Repository Build Design's `Version-Control And Generated-File Policy` and its linked `agent-guidance.md` before touching an ignore file or `AGENTS.md`. Realize the policy and the repository-root `AGENTS.md` exactly as the workpack maps them, then run the policy's repository-hygiene check.
5. Write implementation changes only to the target repository the workpack names. Stop before editing when that target cannot be identified, when the repository you are working in is not that target, or when it cannot be written safely. When the workpack lives in a separate planning repository, read its linked sources there.

## While Implementing

Run `check` before each phase, on every resume, and before completion:

```sh
node <software-design-execution-skill-directory>/scripts/execution-record.mjs \
  --validation-mode execution \
  --mode check --workpack <WORKPACK.md> --repository <target-repository> \
  --software-design-skill <software-design-skill-directory>
```

It verifies the start identity, then reruns readiness. A content change blocks the old record, even under an unchanged snapshot: keep the prior workpack and partial summary in recoverable history, reconcile through Software Design, classify prior results, and start the reconciled workpack.

- Read each phase's canonical sources through the workpack's links rather than memory or ticket history.
- Keep changes focused on the workpack: preserve unrelated user changes and leave unrelated files as you found them.
- Diagnose a failed required command as evidence: find the cause, apply safe scope-preserving remediation (requesting approval through the host when needed), rerun the affected `VE-xxx` from its beginning, and continue when it passes. Retry only with new evidence or a changed condition.
- Prove `consumer-fitness` through the real shipped seam only.
- Treat each open `LGATE-NNN` as a hard prohibition: implementation may finish while it stays open, but this run never performs or claims its guarded release, deployment, activation, or operation.
- Route to Software Design any conflict between the workpack and its linked sources, and any physical evidence contradicting the Stage 9 contract placement or fan-out classification; settle neither locally.
- For an authorized sequence, after each producer completes, check its actual output against the expected contract, reconcile downstream references and receipts through Software Design with behavior, contracts, ownership, and scope unchanged, revalidate eligibility, and continue, or report the exact wait. A single-workpack authorization stops at its workpack.
- The main agent keeps acceptance: treat delegated reports and reviews as leads, and inspect the actual artifacts before accepting a claim. When a correction loop repeats without new evidence, change approach or stop with the exact blocker.

## Human-Facing Delivery

Apply this when the workpack has `UI/UX Delivery Coverage`.

- Before implementing, open the approved specification and selected candidate the workpack names and inspect the covered journeys and states. The candidate is the presentation target, the specification owns presentation requirements, and Software Design contracts own behavior.
- Adapt the candidate into the chosen stack, deviating only for real content, responsive rendering, accessibility, result-preserving stack mechanics, or details the workpack or specification permits; minor unillustrated details follow approved requirements and the candidate's established patterns. A missing materially different route, screen, state, or interaction makes the selected delivery scope incomplete; route it for design reconciliation before implementing that scope.
- Connect the interface to the system operations and sourced state named by the Build Unit `Material Interaction Bindings`; mocks and prototype data serve component work and bounded tests only.
- For each implemented UI/UX VE, start the built application through the workpack's application entrypoint, exercise the equivalent journeys and states at the representative viewports, compare the result with the candidate, correct material differences, and rerun the affected checks.
- Rendered inspection is the evidence: when it cannot run, that VE stays incomplete. Ask a human only when the review mode includes `human acceptance`.
- Record the [UI/UX Delivery Review](references/delivery-evidence.md#uiux-delivery-review) with representative screenshots.

## Continuation Loop

The host's goal or continuation mechanism carries the run between turns; this skill is the work, not the scheduler. Every continuation turn of one goal is the same run: continue from the recorded phase, preflight state, and evidence. When a turn starts without the prior context, reread the complete workpack and run `check` before continuing. The workpack's goal handoff section states when the goal is done; end the loop only at [Completion](#completion) or [Stop](#stop).

## Release And Post-Implementation Lineage

Resolve the stable workpack, the implementation report with its recoverable implemented workpack and execution basis, the current handoff, and the repository changes since that implementation. A known newer unexecuted plan is legitimate and leaves the prior receipt as recorded. When the historical association is unknown, use [legacy-lineage recovery](references/legacy-lineage-recovery.md), and only with explicit user authorization for that route.

Classify the complete change:

- **No implementation impact:** handoff or blueprint documentation, publication or tagging of the implemented tree, already-approved registry or repository permissions, exact-version resolution or authorized installation, and evidence-only record updates, with every implementation-owned file and requirement unchanged. Record a release identity as a typed receipt. An explicitly requested ID-only sync follows [the refresh procedure](references/delivery-evidence.md#id-only-documentation-refresh).
- **Implementation delta:** any change to source, package manifests (repository metadata included), lockfiles, build, runtime, or release configuration, workflows, tests, fixtures, or verification scripts, or a canonical requirement that needs one. A mixed change is a delta.

An implementation delta, whether release preflight finds it or the user requests it directly, stops until a current Stage 9 handoff and a bounded delta workpack cover it; lineage mode itself performs only authorized evidence-only work, and a release stops before publishing. Resume the authorized release once that workpack has executed and its evidence names the same snapshot.

## Completion

After every required VE passes, materialize the evidence by [delivery-evidence.md](references/delivery-evidence.md) and run:

```sh
node <software-design-execution-skill-directory>/scripts/validate-delivery-evidence.mjs \
  --workpack <WORKPACK.md> --repository <target-repository> \
  --software-design-skill <software-design-skill-directory>
```

It reruns current readiness and checks the recorded evidence against the workpack. Resolve every failure; the run is complete when the workpack's Definition of Done holds and this validator passes. Report what the implementation report records, plus:

- `Implemented snapshot: sha256:<snapshot>`;
- every open `LGATE-NNN`, its prohibited action or claim, and any remaining external confirmation or release action;
- for a producer or shared-boundary delta, the producer receipt and each mapped downstream slice as `Ready for Stage 9 refresh`, `Still blocked` with its reason, or `Unaffected`.

A stopped or incomplete attempt reports its attempted snapshot as attempted, never as implemented. Claim public-network, live-registry, branch-protection, or other external evidence only when the workpack requires it and it was actually collected.

## Stop

Stop with the exact blocker on any of the workpack's `Stop and Escalation Conditions`, when the physical ignore configuration hides a must-track path, exposes a secret or local path, or lacks its hygiene check, and when the user asks to expand scope or bypass verification. Take external repository-setting decisions to the user.
