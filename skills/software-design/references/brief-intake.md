# Brief Intake

Read this reference when intake runs: turning rough source material into a reviewed `software-brief.md`, resuming an unfinished brief, or revising one before Stage 0 has begun. Intake is the interviewer and mapper. It writes only the brief, which must give Stage 0 enough reviewed context to expand the system without inventing boundaries, hiding assumptions, or misreading the source.

Read [brief-intake-review.md](brief-intake-review.md) before showing an intake checkpoint, and [mechanism-registers.md](mechanism-registers.md) when the source has mechanisms. [Checkpoint And Repair Workflow](checkpoint-workflow.md) applies throughout, with the intake deltas below.

## When Intake Runs

The stage detection in `SKILL.md` sends work here. Resume a `Needs answers` brief at its open `Ask Now` and `Blocked` items, and a `Needs intake review` brief at whatever still needs review, keeping what it settled. A brief without a `Status:` line goes to Stage 0 once the user confirms it was reviewed; otherwise offer intake on it. Once Stage 0 has begun, a change to the brief is an upstream repair, not intake.

The user need only invoke Software Design with source material: a PDF, pasted explanation, repository path, diagram, notes, or code. Without other instructions, infer this goal rather than asking the user to restate it:

> Create a reviewed software brief for staged Software Design. Identify approved product behavior, the main logical boundaries, dependencies, flows, constraints, assumptions, and unknowns. Write the package later, one stage at a time.

Ask before starting only when the source material is missing or inaccessible, or the output path is ambiguous in a way that matters.

## Source Roles

Classify each source before turning it into logical boundaries; a paper, PDF, example, diagram, or codebase is not automatically the target architecture.

- `Target Architecture`: implement substantially as written.
- `Theory / Reference`: explains mechanisms, constraints, or proofs that still need translation into target boundaries.
- `Example Problem`: illustrates one issue or edge case, not the full architecture.
- `Constraint Source`: supplies requirements, formulas, invariants, legal or operational constraints, or non-goals.
- `Existing Implementation`: current code or system reality the design must respect.
- `Partial / Stale Source`: useful but incomplete, old, speculative, or superseded.

Material the user only attaches or references is idea/reference input by default. That default is workflow, not review content: mention a source's role only when it changes the technical interpretation or prevents a likely misread. Ask about a role only when the user says a source may be stale, sources conflict, or an exact-target reading would materially change the next step, and never as the first or only question about an attached document or rough idea. When a role is ambiguous, state the assumed role in the checkpoint; ask for confirmation only if it changes the boundary map or the goal.

## Deep Source Digestion

Digest before mapping: a generic component list taken straight from the source is the failure this step prevents. Before the first intake checkpoint, capture for each substantial source:

- coverage: the pages, sections, files, or diagrams inspected;
- source role and authority;
- a plain-language mechanism summary;
- the mechanism trace and registers that apply;
- important terms and variables translated into readable names;
- source claims, security objectives, invariants, and formulas;
- explicit exclusions and non-goals;
- implementation details the source leaves unanswered;
- likely misread risks.

For PDFs, papers, protocols, and design notes, read every major section first when feasible; when only part can be inspected, say exactly what was read and classify the gap as an intake risk. Digestion feeds the checkpoint without leading it: show its conclusions first, and source notes only where they explain a boundary, flow, or question.

## The Flow

1. Read all attached or clearly referenced source material.
2. Classify each source's role.
3. Digest the sources, capturing the mechanism trace and registers before proposing boundaries and flows.
4. Show an intake checkpoint in the [Checkpoint Order](brief-intake-review.md#checkpoint-order).
5. Interview on what materially affects the main journey, authority boundaries, or architecture, using the [Ask-Now Prompts](brief-intake-review.md#ask-now-prompts).
6. Iterate until every readiness criterion below holds, or the user chooses to save the brief with its open items.
7. Show the brief write preview and wait for `approve`.
8. Write `software-brief.md` from [the brief template](../assets/templates/software-brief.md) at the resolved path, creating a new `design/` folder only now.
9. Move into Stage 0 as [Readiness](#readiness-and-the-move-into-stage-0) describes.

For a human-facing application or operator surface, capture only the template's `Human-Facing Product Context`, within the limits of [Stage 0 framing](ui-ux-design.md#stage-0-framing) and reusing approved upstream product and UI decisions; classify a missing answer there like any other unknown.

## Write Gate And Preview

While intake runs, only an approved brief write preview writes the brief. Answers, corrections, and partial acceptance update the intake state; a plain yes is not a write approval. The single word `approve` writes the brief only in reply to the preview, one of the messages [Approval Semantics](checkpoint-workflow.md#approval-semantics) names; anywhere else it approves the current intake state.

The brief write preview shows:

- the target path and the `Status:` value to be written;
- the final technical summary, in paragraphs;
- the final mechanism trace and the registers that apply;
- each logical boundary with one line on what it owns;
- each main flow with a one-line description;
- remaining `Needs Your Answer Now` items, or `none`;
- the material assumptions to be written, each labelled approved or proposed, or `none`;
- parked and not-modeled areas, if any;
- source notes or notation left out of the visible brief as unhelpful.

End with a direct prompt such as `Reply approve to write the brief, or send edits.` Show the preview and write the file in separate responses unless the user already asked for an uninterrupted write. Carry each approved requirement into the brief with its source reference. The `approve` covers only what the preview clearly presented, attributed under [Interpreting Approval](decision-attribution.md#interpreting-approval); a proposed assumption stays proposed.

Once Stage 0 has begun, the brief changes only through [Upstream Repair Handling](checkpoint-workflow.md#upstream-repair-handling), which repairs it before the package files that inherited from it, keeping the template's sections and a truthful `Status:` line.

## Corrections

Corrections follow [Correction Handling](checkpoint-workflow.md#correction-handling) with three intake deltas. First, a correction never writes the brief; it produces an updated intake checkpoint in this order:

1. `What Changed`: the corrections applied.
2. `Updated Technical Summary`: paragraphs, not bullets.
3. `Updated Mechanism Trace And Registers`: when the correction touches ordered behavior, state, credentials, tokens, or handoffs.
4. `Updated Proposed Components`: one line of ownership each, with the changed boundaries.
5. `Updated Main Flows`.
6. `Still Needs Your Answer`: only questions that block a trusted brief.
7. `Ready To Write?`: the brief write preview, when no blockers remain.

Second, reconcile each correction or approved clarification into every part of the intake state it affects, updating the trace and registers before the boundaries and flows, removing stale assumptions, and keeping still-open choices visible. Third, "yes", "correct", or similar after a correction checkpoint approves the intake state; `approve` writes only when that checkpoint includes the brief write preview.

## Unknowns

Classify every unknown by how it affects the next workflow. Software Design carries each class in its existing records, with no new status, creating each record in the stage that creates its owner: a ticket once its System Responsibility exists, a scope record with the architecture or contracts.

| Class | Meaning | In Software Design |
| --- | --- | --- |
| `Ask Now` | Must be answered before the brief can be trusted. | Empty before Stage 0. |
| `Blocked` | Needs an external input or user answer before the brief can be ready. | Empty before Stage 0. |
| `Open But Design-Around` | Unresolved, but a stated safe boundary lets later design or prototype exploration proceed without silently selecting behavior. | A `kind: product` ticket holding the question, or a constraint on the records it bounds. |
| `Approved Assumption` | A temporary assumption the user accepted. | A labelled assumption with its revisit trigger, never approved behavior. |
| `Proposed Assumption` | A candidate assumption awaiting approval. | Shown at the Stage 0 checkpoint for confirmation. |
| `Parked` | Relevant later, outside this pass. | A `deferred` ticket or a deferred `SCOPE-xxx`. |
| `Not Modeled` | Intentionally excluded from the design. | An excluded `SCOPE-xxx`. |

`Ask Now` holds only the answers a coherent, trustworthy brief needs; a possible change to the boundary map or a major flow does not by itself qualify, and a bounded uncertainty that can safely stay explicit is `Open But Design-Around`. Essential safety and authority prerequisites stay `Ask Now`, and an assumption never conceals a blocker or invents a missing transition. Assumptions and prototype hypotheses stay exploratory until reviewed and approved as behavior.

When the user has not thought about an issue, offer practical handling: answer now, explain it before choosing, keep it open and design around it, approve a temporary assumption, model several options later, park it, or mark it not modeled.

## Readiness And The Move Into Stage 0

The `Status:` line in the brief's header is its readiness marker, with exactly one of three values:

- `Ready for software design` when every criterion below holds;
- `Needs answers` while any `Ask Now` or `Blocked` item remains;
- `Needs intake review` otherwise, for example when the user saved the brief before its boundaries were stable.

A brief is ready when the approved boundary map is clear and stable enough for downstream expansion, the main flows are identified, the constraints material to the main journey, authority boundaries, or architecture are captured, assumptions are labelled, unresolved questions are classified, and no `Ask Now` or `Blocked` item remains. Open design-around items may remain; the brief's final prompt tells Software Design to preserve them without silently choosing.

After the approved write of a ready brief, show the [Stage 0 checkpoint](staged-design-workflow.md#0-package-confirmation) in the same response; it writes nothing. Build it from the brief just approved, asking only what Stage 0 adds and including the proposed assumptions. Only when the user asked for a brief alone, stop at the write and offer Stage 0. When the written status is not ready, report what remains open and resume intake with the user's next answer.
