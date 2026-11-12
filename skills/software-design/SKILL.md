---
name: software-design
description: Use for $software-design work from rough idea to delivery plan: turn rough ideas, requirements, documents, diagrams, or existing code into a reviewed software brief; create, repair, or continue the staged blueprint (architecture, domains, responsibilities, flows, state, contracts, UI/UX prototypes); find missing implementation tickets or backfill approved answers; prepare or reconcile expert consultations; sync, reconcile, or repair the GitHub ticket projection and process its comments; write or export the System Guide PDFs; report which decisions the user approved and which the agent chose; define Verification Obligations, Build Units, and repository architecture; assess Delivery Readiness; and write or refresh the WORKPACK.md for a settled Stage 9 handoff. Executing a workpack or changing product code belongs to $software-design-execution.
---

# Software Design

Turn rough source material into a reviewed software **brief** through intake; turn the brief into an implementation-grade `software-design/` **package**, one **stage** at a time; and carry it through Build Design to a Stage 9 delivery **handoff** and, when asked, a **workpack** for that slice. Every settled fact lives in exactly one **canonical owner** record; the System Guide explains the system to readers and owns none of it. Each stage writes only after its **checkpoint** is approved. Implementation, deployment, broader product framing, and research stay outside this skill.

## Resolve The Workspace

For repository-scoped work the design workspace is `<repository-root>/design/` (otherwise `<workspace-root>/design/`), with `software-brief.md` and `software-design/` as siblings. Resolve paths by one rule: an explicit user path wins; then exactly one existing brief/package pair, lone brief, or lone package under `design/` or the repository root, whose folder also receives the missing sibling; then the new `design/` defaults. If several candidates are plausible, ask which is canonical. Never move an existing brief or package or create a duplicate merely to adopt the default. Create a new `design/` folder no earlier than the approved brief write, and `design/software-design/` only after Stage 0 approval. For ticket projection from the repository root, use `design/software-design` as `ticketRoot`.

Follow the user's source restriction. If the user says to use the package only, do not read, validate against, or discuss the software brief, product package, or another upstream artifact unless the user later authorizes it.

## Detect The Stage, Then Route

Detect in this order:

1. **A question about settled design:** answer directly. Lead with the answer and its canonical source, then add only context that helps the asker use or trust it, such as an open decision that limits it.
2. **Brief and package state:** an existing package means continue it under step 3, and "use the package only" also blocks reading the brief. With no package, read the `Status:` line in the brief's header; any brief counts, template or not. `Ready for software design` → Stage 0. `Needs intake review` or `Needs answers` → resume intake. No `Status:` line → ask the user to confirm the brief was reviewed. No brief but source material → intake; no material at all → ask for it. Rerun intake on an existing brief only when the user asks, and do not silently turn rough source material into a technical blueprint.
3. **Otherwise:** take the operation the user named; if they named none, continue the next unfinished stage.

Read only what the matched routes name; ticket-only, GitHub-only, decision-only, and package-only requests skip the staged workflow unless their work changes that surface.

- **Intake — when step 2 selects it, or the user asks to create or revise the brief before Stage 0:** read [references/brief-intake.md](references/brief-intake.md), [references/brief-intake-review.md](references/brief-intake-review.md), [references/checkpoint-workflow.md](references/checkpoint-workflow.md), and, when the source has ordered behavior, state, credentials, or cross-system handoffs, [references/mechanism-registers.md](references/mechanism-registers.md). Done when the approved brief is written with a truthful `Status:` line and, if it is ready, the Stage 0 checkpoint is shown with nothing else written; when the user asked for a brief alone, done at the write.
- **Stages 0–7 — create, repair, or continue the staged blueprint:** read [references/package-layout.md](references/package-layout.md), [references/system-model-format.md](references/system-model-format.md), [references/staged-design-workflow.md](references/staged-design-workflow.md), [references/checkpoint-workflow.md](references/checkpoint-workflow.md), and [references/core-design-audits.md](references/core-design-audits.md). Done when the approved stage is written, its validators pass, and the next checkpoint is shown.
- **Human-facing surface, prototype review, optional slideshows, or interface-affecting changes:** read [references/ui-ux-design.md](references/ui-ux-design.md) plus the staged or Stage 8/9 reference for the active work. Done when the named scope is reconciled and rendered inspection is recorded, or its limitation is reported.
- **Create, discuss, change, or review implementation-detail tickets, including a batch interview:** read [references/implementation-detail-tickets.md](references/implementation-detail-tickets.md); when a resolution sets a durable technical `must` or `must not`, also read [references/technical-constraints.md](references/technical-constraints.md) and create or update its `CONS-xxx`. Ticket work never activates Stage 8. Done when answers reach their canonical owners and the ticket validator passes.
- **Find missing tickets, complete or assess a backlog, or backfill earlier decisions:** also read [references/ticket-inventory-mode.md](references/ticket-inventory-mode.md). Done when its completeness contract holds or the result is reported partial with the exact blocker.
- **Prepare questions for an expert or process a returned consultation brief:** read [references/expert-consultation.md](references/expert-consultation.md) and [references/implementation-detail-tickets.md](references/implementation-detail-tickets.md).
- **Sync or reconcile GitHub, configure or repair GitHub Project views, inspect ticket comments, or publish a draft response:** read [references/ticket-projection.md](references/ticket-projection.md). Its defaults start with the dependency-aware Tickets board; Repositories defaults on only for multiple canonical Repository Build Designs, with explicit show/hide preferences taking precedence. Use bounded `sync --create-views --view <name>` for genuinely missing selected views and in-place repair for existing views. Keep data synchronization, bounded field/API presentation setup, and saved browser verification separate; installing this skill never migrates consumer Projects.
- **Add or review an optional Current shape visual inside a ticket:** read [references/issue-visuals.md](references/issue-visuals.md) plus the applicable ticket reference.
- **Create, backfill, change, or route technical constraints:** read [references/technical-constraints.md](references/technical-constraints.md).
- **Create, migrate, assign, map, close, or report Verification Obligations and their evidence:** read [references/assurance-traceability.md](references/assurance-traceability.md), plus the system-model or Build Design reference for the active stage.
- **Write, migrate, review, or export the System Guide:** read [references/system-guide.md](references/system-guide.md), [references/guide-writing.md](references/guide-writing.md) for prose, and [references/guide-pdf-export.md](references/guide-pdf-export.md) for PDFs.
- **Generate, check, or explain the decision overview, or find which settled decisions a change touches:** read [references/decision-attribution.md](references/decision-attribution.md).
- **Propose, create, extend, or refresh the System Explorer, the Build Unit Dependency Map, or another diagram:** read [references/diagram-selection.md](references/diagram-selection.md) and [references/system-explorer.md](references/system-explorer.md). Done when the rendered pages are walked from the index.
- **Stage 8 — Build Units, module architecture, repository construction, agent guidance, or a Build Unit/Repository visual refresh:** read [references/package-layout.md](references/package-layout.md), [references/build-design-and-delivery-readiness.md](references/build-design-and-delivery-readiness.md), and, for first-party repository work, [references/maintainability-and-agent-guidance-baseline.md](references/maintainability-and-agent-guidance-baseline.md). Done when Build Design validation passes and every first-party repository's contract lanes are covered.
- **Stage 9 — Delivery Readiness or a delivery-slice handoff:** read [references/build-design-and-delivery-readiness.md](references/build-design-and-delivery-readiness.md) and [references/planning-execution-contract.md](references/planning-execution-contract.md). Done when the handoff and sequence index validate and the Snapshot ID is written, or the exact blockers are reported with no handoff.
- **A canonical change touching a slice with a current handoff, workpack, or implementation report:** run the affected-slice audit and lineage rules in [references/build-design-and-delivery-readiness.md](references/build-design-and-delivery-readiness.md#delivery-readiness-and-handoff) and [references/planning-execution-contract.md](references/planning-execution-contract.md), with [references/legacy-lineage-recovery.md](references/legacy-lineage-recovery.md) only when explicitly authorized. Done when every mapped current slice is classified and only affected handoffs are refreshed.
- **Write or refresh a workpack — the user asks for one and the slice's settled Stage 9 handoff records `IMPLEMENTATION_DETAILS_READY` or `IMPLEMENTATION_DETAILS_PARTIAL`:** read [references/workpack-planning.md](references/workpack-planning.md), [references/workpack-rules.md](references/workpack-rules.md), [references/delivery-evidence-contract.md](references/delivery-evidence-contract.md), and [references/planning-execution-contract.md](references/planning-execution-contract.md). When a workpack or implementation report already exists for the slice, run its lineage audit first. Done when `validate-workpack.mjs` passes at the handoff's Snapshot ID, or when a realizability recheck fails and one consolidated blocker report replaces the draft. Never start execution.
- **Implement, execute, or release:** these belong to `software-design-execution`. Offer it once a workpack validates; never start it or change product code here.

## Rules For Every Request

**Before Asking.** Before putting any question to the user, or deciding a material choice the user delegated, read and apply [Before Asking](references/checkpoint-workflow.md#before-asking): inspect relevant approved definitions, decisions, source history, and applicable implementation within the authorized source scope, make the choices your delegation covers within approved requirements and boundaries, and ask only about a material choice beyond them. Test consequential ambiguity first under [Consequential Ambiguity](references/checkpoint-workflow.md#consequential-ambiguity).

**Decision attribution.** Record who chose each meaningful design decision (Human-approved · User specified, Human-approved · Agent recommended, Agent-chosen, or Unknown origin) in the record that owns it, whenever you record or materially change it. Read [references/decision-attribution.md](references/decision-attribution.md) whenever you record an answer or other settled decision, interpret an approval, revise or withdraw a settled decision, or regenerate the decision overview.

**Stop conditions.** Open design-around items are constraints, not automatic blockers. Stop only the affected work when:

- a required source is missing or contradictory;
- the System Responsibility map or authority boundary is genuinely ambiguous;
- proceeding would collapse distinct states, objects, credentials, artifacts, or external domains;
- proceeding would invent a mechanism-critical transition or automatic handoff;
- proceeding would choose an unresolved product or technical decision without approval or explicit delegation; or
- an approved earlier artifact and the active source disagree materially.

These conditions and the user's source restriction govern every route: intake, ticket answers, GitHub comments, and Build Design as well as new stages. Record unresolved product behavior in existing `kind: product` tickets. Obtain user approval for material choices outside the authority the user has delegated and for conflicts with approved requirements. Once settled, record behavior in its canonical owner; tickets keep question and resolution context, not duplicate specifications. Design around safe local gates, continue unaffected Domains, and withhold only the affected readiness claim. Do not create a glossary, decision register, questionnaire, approval stage, or new status.

**Mechanism preservation.** Apply [references/core-design-audits.md](references/core-design-audits.md) at every checkpoint it affects.

**Consumer packages.** A skill or template update never authorizes broad edits to an established consumer package or a GitHub Project migration. Name the exact records in scope and make only the minimum source-backed correction.

**Affected slices.** After any canonical change, including a ticket answer or a Stage 1–7 repair, run the affected-slice audit when a current handoff, workpack, or implementation report exists for a mapped slice.

**Stage boundaries.** Never start the next stage, Build Design, Delivery Readiness, a workpack, or execution unprompted. Offer the next step only when the requested scope has reached a valid outcome. Showing the Stage 0 checkpoint after an approved brief write belongs to the intake route; it writes nothing.

**Visual claims.** If rendering is blocked, report the limitation and do not describe source inspection or structural validation as visual verification; structural checks are not visual verification.

**Completion levels.** Distinguish `Software Design complete`, `Build Design complete`, `selected implementation slices complete`, `target outcome operable`, `deployable`, `activated`, and `production ready`; never collapse them into `finished` without naming the achieved level.

## Validate And Report

Resolve script paths from the directory containing the active `SKILL.md`; do not assume the skill scripts live in the consumer repository. For example, after ticket creation, status changes, file moves, or write-target changes, run:

```sh
node <software-design-skill-directory>/scripts/validate-implementation-detail-tickets.mjs --root <software-design-package>
```

Run every validator applicable to files changed in the active pass; [references/script-catalog.md](references/script-catalog.md) names the script that owns each contract. Do not claim semantic completeness from a structural validator. For selected delivery validation, report `NON_BLOCKING_PACKAGE_MAINTENANCE` notices separately; do not reopen unrelated records merely to clear them. Relevant contract and compatibility failures still block, and full-package validation remains strict.

At completion, report the package path, files changed, meaningful Agent-chosen decisions recorded in the pass, unresolved tickets and source conflicts, ticket totals when present, optional Build Design and Delivery Readiness outcomes, readiness for the requested planning scope, and the exact blockers when not ready. When the user asks whether the product or project is finished, also state separately whether the target outcome is operable in each required profile, deployable, activated, and production ready; never infer those claims from implemented slice rows.

Scope every completion claim to its evidence. Structural validation, rendered prototype interaction inspection, independent review, the user's approval, and readiness or release eligibility are separate claims: for each one you make, name the scope it covers and the evidence behind it, and state material outstanding decisions and review limits. Describe each decision's origin as its attribution record does. Review repaired behavior at the final state of the affected artifacts, reusing evidence for the parts a repair did not touch rather than restarting a whole-package review after a harmless edit.

Report a blocker by the missing decision, evidence, or prerequisite; the deliverable it actually blocks and the dependency path that makes it block; and the useful work that continues. When the missing input is a document, file, or other evidence, ask for or locate that input rather than asking for approval again. Preserve genuine shared-contract and readiness dependencies; a block across many deliverables needs a concrete dependency path for each and does not stop independent work. Before waiting on another agent or session, confirm that it currently owns the remaining work. Treat ownership as stale only on evidence that the owner ended or released it, such as an archived or closed session or the user saying so; then continue within existing authority or state the actual boundary, keeping locks and other mechanical guards in force.
