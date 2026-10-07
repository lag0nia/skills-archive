# Checkpoint And Repair Workflow

Read this reference before presenting a Software Design write checkpoint, interpreting approval, handling a correction, or repairing upstream source truth.

## Contents

- Checkpoint Rule
- Active Section Passes
- Approval Semantics
- Correction Handling
- Upstream Repair Handling
- Checkpoint Content

## Checkpoint Rule

Every stage requires a checkpoint before writing. Never write the whole package at once.

Each stage follows this rhythm:

1. Read the software brief and any approved earlier package files needed for this stage.
2. Re-check mechanism trace and registers from the brief when present.
3. Show a stage interpretation checkpoint.
4. Wait for explicit approval.
5. Write only the files for that stage.
6. Summarize files written and important design choices preserved.
7. Prepare the next stage checkpoint when possible.
8. Stop for approval before writing the next stage.

The first checkpoint happens before any package files are written.

### Active Section Passes

Treat an explicitly approved System Domain, System Responsibility, flow, contract family, or named section as one active write pass. Default to resolving its related sub-decisions conversationally, then write the records as one coherent update. Do not require a fresh approval for each sub-decision, small consistency edit, or file within that approved pass.

An approved Stage 7 human-facing pass includes prototype prerequisites, bounded exploration, rendered walkthroughs, journey-level reconciliation, and completion of agreed coverage. Earlier bounded sketches are allowed inside an authorized pass. Reconcile approved findings at coherent journey boundaries without repeated screen or synchronization approvals. Visual-direction selection approves presentation qualities only; explicit behavior hypotheses may be explored but cannot establish reconciled design while material contradictions remain. Trace material changes through only the affected canonical owners and connected dependencies. After the initial reviewed prototype, later ticket resolutions update canonical requirements and record pending prototype work in the specification; editing and rendering wait for a prototype-change or synchronization request. An explicit prototype-change request already authorizes its affected updates, including required canonical reconciliation; do not demand another sync command or approval. Reopen only the affected UI/UX requirements, prototype states, and Build Unit or handoff routes.

If the user explicitly says to record a confirmed detail while continuing the same section, make that narrow in-pass update without resetting the approval cycle. Preserve the active pass and continue the related discussion.

Reuse explicit approval already given for the requested change; these repair checkpoints resolve unapproved material changes, not repeat authorization. Require a new checkpoint only for an unresolved material decision or work beyond the existing authorization, including unapproved behavior, authority, scope, safety, responsibility-boundary, or source-truth changes. Touching another Responsibility/Domain as part of an already-authorized repair does not itself require another approval. If upstream repair is approved and does not change the paused pass's scope, resume that pass automatically afterward; do not request redundant re-approval.

### Approval Semantics

Use direct approval prompts. The single word `approve` is enough only when the current message is a stage checkpoint, package setup checkpoint, or repair checkpoint.

If the user says `yes`, `correct`, or provides corrections, update the checkpoint interpretation. Do not write files unless approval to write the current stage is clear.

Do not ask the user to approve preparing another checkpoint. Checkpoints are interpretation previews and should be prepared directly when enough context exists. User approval should control file writes, not whether the next checkpoint may be shown.

After a non-writing setup checkpoint is approved or corrected and no blockers remain, immediately show the next write-stage checkpoint in the same response when possible. The next user `approve` should write that stage.

## Correction Handling

When the user corrects a checkpoint, avoid a correction-only response that forces an extra approval cycle.

Apply this flow:

1. Apply the correction to the current interpretation.
2. If the correction changes source truth or invalidates an already-written earlier stage, use `Upstream Repair Handling` below instead of continuing the current stage.
3. Briefly state what changed.
4. If the affected repair and current pass are already authorized and unambiguous, reconcile the affected sources and resume that pass. Otherwise show the updated write-ready checkpoint for the still-unapproved stage or material decision.
5. End with an approval prompt only for work or decisions not already authorized; preserve the normal checkpoint for a new stage.

Do not respond with only "I updated X; reply approve to prepare the next checkpoint." That creates an unnecessary loop. Instead, show the updated checkpoint in the same response so `approve` writes the stage.

If a correction changes an already-written stage and its repair is not already authorized, show the revised checkpoint for the affected stage and wait for approval before editing those stage files.

## Upstream Repair Handling

Use this when a correction during a later stage reveals that the software brief or an already-written earlier stage is wrong. Pause only the affected work until the upstream source is repaired. An already explicit change request authorizes the affected repair; present a new checkpoint only for unresolved behavior or additional scope.

Start the user-facing response with a clear stop message:

> Stopping Stage N. Your correction changes Stage X/Y source truth, so the current Stage N checkpoint is superseded. I am going back to repair the affected upstream files before writing Stage N.

Do not write the paused stage. Do not ask whether to repair when the correction is clear. Treat clear corrections such as "cancelling an upload must discard its unfinished file" as source-truth corrections. Ask only if the corrected truth itself is ambiguous.

For an already-authorized, unambiguous repair, perform the affected reconciliation and resume the authorized pass without another approval prompt. If a material decision remains unresolved or the repair exceeds the authorized scope, show a `Repair Checkpoint` for that decision or additional scope instead. It must include:

- paused stage and superseded checkpoint;
- corrected source truth;
- earlier files or stages affected;
- the concrete repair model, including the behavior, contract, invariant, or decision that changes;
- what the repair makes true across the system and what remains unchanged;
- a short `Route` line and `Expected Recording Plan`, as required below;
- remaining decisions, or `none`;
- approval prompt for the proposed repair, not merely its file edits.

Repair from the earliest affected source forward. If the brief is wrong, repair `software-brief.md` first, then repair generated package files that inherited the wrong assumption. If only generated files are wrong, repair only those files.

After the authorized repair is written and its affected reconciliation is checked:

1. Summarize the repaired files and corrected assumption.
2. If the paused active pass remains within its prior approved scope, resume it automatically from the repaired source.
3. Otherwise regenerate its checkpoint and wait for approval before writing it.

After an authorized repair, resume the affected pass without repeating approval when its scope remains covered.

## Checkpoint Content

For any non-trivial proposed behavior, contract, invariant, decision, or repair, show a `Proposed Change` before asking for approval. It must explain the current gap; the concrete proposed model and material rules, records, identifiers, transitions, or rejection behavior; what becomes true across the system; what remains unchanged; affected System Responsibilities, flows, and correctness obligations; the classification (`Software Design repair`, `Build Design selection`, `Product decision`, or `Reversible local choice`) and why; and any unresolved user decision.

Do not ask the user to approve headings, themes, or a list of file edits when the actual behavior has not been explained. If the proposal cannot yet be stated concretely, ask the missing design question instead of requesting approval.

After the proposed change, include one short `Route` line that says whether the work continues in the current stage, pauses Build Design or Delivery Readiness for a Software Design repair, requires a Product decision, or remains a reversible local choice. End with a short `Expected Recording Plan` that says whether the approved behavior will amend Software Design, create or update Build Design/Delivery Readiness, or both. Mention expected paths only there; the user approves the behavior and classification, not the file list.

Each checkpoint must show:

- what was understood from the software brief and approved earlier stages;
- mechanism-critical facts this stage must preserve, when relevant;
- what this stage will encode;
- open design-around items that affect the stage;
- risks, contradictions, or boundary issues if any;
- answers needed before writing, or `none`.

Do not include a `Source files used` section in user-facing checkpoints. The skill may read the software brief, templates, and earlier package files internally, but checkpoint output should not list those file paths. Mention paths only when the path itself requires user review, such as an ambiguous brief, multiple possible package roots, an overwrite risk, or a target-path decision.

Do not include low-signal file housekeeping in `what this stage will encode`. Avoid bullets such as `Package navigation and current status in README.md`, `README links`, `template usage`, `current status`, or other statements that only describe document mechanics. The checkpoint should describe the technical meaning that will be written: architecture interpretation, mechanism preservation, responsibility boundaries, flow behavior, invariants, open design-around items, decision-required items, correctness obligations, and implementation sequencing.

Do not ask long questionnaires. Ask only questions that materially affect the current stage.

For UI/UX, recommend defaults for reversible visual and copy details. Ask only when the answer changes product behavior, architecture, trust, information needed for an informed decision, accessibility, recovery, or the main journey.

If a stage exposes an unresolved or unauthorized System Responsibility boundary change, pause the affected work and ask. Do not silently split, merge, rename, move, or remove approved responsibilities. Reconcile an explicit, unambiguous authorized boundary correction without asking for the same approval again.

Treat approved-responsibility-map stability as an internal guardrail, not checkpoint content. Mention it only when there is an actual boundary risk, proposed correction, contradiction, or user-requested change.

Do not include obvious dependency-source bullets in checkpoints. For example, in Stage 4 do not say `The flows must use the approved Responsibility and Domain boundaries already written.` Use approved earlier-stage files internally and show only meaningful flow behavior, unresolved items, risks, or decisions.
