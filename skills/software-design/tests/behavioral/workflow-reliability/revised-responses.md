# Revised guidance responses

Verbatim outputs from the trial using the revised skill. Each section below is one agent's complete response file; the four agents per version worked in separate fresh contexts (prototypes 1–4, contracts 5–6, authority and reporting 7–10, supplementary 11–12). Only top-level titles were demoted to fit this file.

---

<!-- trial file responses-P.md -->

### Responses — Software Design skill (trial-k)

What I read for these scenarios: `SKILL.md`. For Scenarios 1–3 I followed the route "design a human-facing application… or reconcile interface-affecting changes" into `references/ui-ux-design.md` and `references/ui-ux/README.md`. I then read `references/ui-ux/design-workflow.md`, especially Keep Active Alternatives Comparable, Bounded Changes, Discovery And Later Synchronization and Prototype Mechanics, plus `references/ui-ux/templates/specification.md`. I also read the Stage 7 part of `references/staged-design-workflow.md`, and from `references/checkpoint-workflow.md` the Active Section Passes and Before Asking sections. Scenario 4 also follows the ticket route, so I read `references/implementation-detail-tickets.md`, `references/decision-attribution.md` and the Keeping Guides Current section of `references/system-guide.md`. Path placeholders below assume the default package root `design/software-design/`. Text in `[brackets]` is filled in from the actual run.

---

## Scenario 1

### How I read the request

- "Add the recurring-booking option to the prototypes and check that it works" is an **explicit prototype-change request**. It authorizes the affected prototype updates and the inspection. No extra sync command, checkpoint or approval is needed.
- **Which candidates are active:** no selection exists (`Selected implementation target: Unresolved`). Before a selection, every candidate in the agreed comparison is active unless the user set it aside. All five have the same bounded comparable coverage, and nothing records the user setting any of them aside. The status label "Exploratory comparison" does not decide a candidate's role. So **A, B, C, D and E are all active alternatives**, and this pass must carry the feature into all five.
- **Scope:** recurring weekly booking changes the create-booking step and its outcomes: availability, confirmation, cancellation and payment failure. Those are inside the agreed comparison journey. The user's request ("the prototypes") authorizes growing the comparison by this feature. It does not authorize a full-application sync.
- **Behavior source:** TICKET-0012 is approved, and FLOW-004 plus the specification requirements are already updated. The prototypes illustrate that settled behavior. They do not invent it.
- **No question to the user.** The count and directions are known. This is an update, so I don't ask the prototype-choice question or the slideshow question. The behavior is settled and the authority is explicit.
- **Freshness note:** Change Synchronization says `None.`, although TICKET-0012 changed requirements after the initial reviewed prototype. An empty pending list does not prove freshness, so I compare the candidates directly against FLOW-004 and the updated specification requirements.

### Actions

1. **Read before editing:**
   - TICKET-0012: resolution, attribution and write targets.
   - FLOW-004.
   - The updated specification requirements (Journey And Route Coverage, State Coverage, Interaction And Content Rules).
   - Each candidate's booking-journey pages and scripts under `ui-ux/alternatives/a` … `e`.
   - `ui-ux/index.html`.
2. **Edit all five candidates** (`ui-ux/alternatives/a/…` through `e/…`):
   - Add the recurring weekly option to create booking, expressed through **each alternative's own layout, navigation and interaction treatment**. I don't paste one shared widget into all five. Sharing script logic is allowed but not required.
   - Carry it through the rest of the comparison journey exactly as FLOW-004 and the specification define it:
     - availability for the repeated dates;
     - a confirmation that shows the recurring result and persists when the user returns;
     - cancellation before submission, which keeps the prior state;
     - payment failure and recovery with no duplicate series on retry.
   - Keep the one-off booking path working.
   - Prototype mechanics stay portable: relative paths, classic scripts, demo data in plain JavaScript, reviewer-only controls inside the existing collapsible reviewer area, and no remote dependencies.
   - If FLOW-004 or the specification leaves a **material** point unsettled, I do not invent it. I show it as an explicitly labelled exploration hypothesis, the same in all five, and keep it visible as a `todo` ticket under the existing ticket rules. Before raising it, I confirm that no approved source already settles it.
3. **Check that it works (rendered inspection):**
   - Open `ui-ux/index.html` **directly from disk** (`file://`) in the available browser tooling, not through a localhost preview.
   - From the launcher, enter each of the five alternatives and exercise the affected paths:
     - a recurring weekly booking from arrival through availability to a persistent confirmation, then return to it;
     - cancellation before submission;
     - payment failure and recovery;
     - a regression pass on the one-off booking.
   - Check at desktop, tablet and phone widths, with keyboard-only operation and visible focus.
   - If a candidate uses browser storage, include blocked storage and malformed stored data in the affected-interaction check.
   - Fix whatever fails and re-exercise it. Record the tool and the findings per candidate.
   - No `runtime-evidence.json` capture is required, because there is no selected candidate.
4. **Slideshows:** I don't ask. If any candidate already has a `slides.html`, I recapture its affected screens from this same inspection and rebuild that deck. If the refresh fails, I keep the old images labelled outdated in the deck and beside its links.
5. **`ui-ux/specification.md`:**
   - **Prototype Alternatives And Selection:**
     - `Selected implementation target` stays `` `Unresolved` ``. Direction selection stays Unresolved. `## Decision Attribution` is untouched; nothing here selects a candidate.
     - Active comparison line: "arrival → availability → create booking (one-off or recurring weekly) → confirmation, plus cancellation and payment failure — A, B, C, D, E kept comparable."
     - Alternatives table, each row's coverage: "arrival → availability → create booking (one-off or recurring weekly) → confirmation, plus cancellation and payment failure".
     - Alternatives table, each row's status: "Active alternative — exploratory comparison; recurring weekly option added and exercised 2026-11-05".
   - **Prototype Review:** the booking journey row records this inspection: tool, viewports, the direct-file launcher check and per-candidate findings. It also records the limits: a heuristic agent walkthrough, not user testing, and not the user's approval of the new recurring states. Covered-flow approval is unchanged.
   - **Change Synchronization:** stays `None.` when all five pass.
   - Requirement sections are unchanged, since they were already updated, unless inspection exposes a contradiction.
6. **Launcher:** no change. No new entry page, no selection and no new deck.
7. **TICKET-0012:**
   - If it is `decided` and every other write target is complete, move it to `finished`.
   - If it was already `finished`, no change. Its missing pending row is now moot.
   - In either case, run `validate-implementation-detail-tickets.mjs` and, if the status changed, regenerate and `--check` the decision overview.
8. **Validation:** `node <skill-dir>/scripts/validate-ui-ux-design.mjs --root design/software-design`.

### Message during work (verbatim)

> Adding the recurring weekly option to all five alternatives. None is selected yet, so all five are still in the comparison. I'll then open each one from the launcher and walk through it.

### Final report (verbatim)

> Recurring weekly bookings (TICKET-0012) are now in all five prototype alternatives, and I walked through each one from the launcher.
>
> **What changed**
> - **Alternatives A–E** (`ui-ux/alternatives/a` … `e`): create booking now offers a weekly repeat, as FLOW-004 and the updated specification describe it. Each alternative presents it in its own way: [A: …; B: …; C: …; D: …; E: …]. Availability, confirmation, cancellation and payment failure work for a recurring booking as well as a one-off booking.
> - **`ui-ux/specification.md`:**
>   - Each alternative's coverage now includes the recurring option.
>   - The active-comparison line lists all five.
>   - The booking journey's review row records this check.
>   - Change Synchronization remains None.
>   - Selection is still Unresolved; nothing in this pass selects a candidate.
>
> **How I checked it**
> - I opened `ui-ux/index.html` directly from disk in [tool].
> - In each alternative I made a recurring weekly booking through to its confirmation and returned to it, cancelled before submitting, and recovered from a payment failure. I also rechecked a one-off booking.
> - I did this at desktop, tablet and phone widths and with the keyboard only.
> - Findings: [findings, and what I fixed and rechecked].
> - `validate-ui-ux-design.mjs` passes.
>
> **Limits**
> - This is my heuristic walkthrough, not user testing. It is also not your approval of the new recurring screens: covered-flow approval still covers only the flow you reviewed earlier.
> - Change Synchronization had no entry for TICKET-0012, even though it changed requirements after the first review. I therefore compared the prototypes directly with FLOW-004. I only added this feature; I did not resynchronize anything else.
> - Agent-chosen decisions recorded: none. The changes are presentation within the settled behavior.
> - TICKET-0012: [now finished / already finished].

**Variants of that report:**

- **An alternative is unfinished or fails inspection.** The report opens with: "The recurring-booking pass is **incomplete**: alternative [X] [does not yet …/failed …]." Row X's status says what is missing, and Change Synchronization gets a row for the booking journey: "[X]: add/finish the recurring weekly option", linking TICKET-0012 and FLOW-004. No selected target exists, so this pending row blocks no readiness.
- **Opening from disk or rendering is blocked.** The report says so. It does not claim visual or portability verification, and it calls the pass unverified for the affected alternatives.
- **FLOW-004 leaves a material point open.** The report names the point, says it is shown as a labelled hypothesis in all five, and presents the new `todo` ticket question with context, options and a recommendation.

---

## Scenario 2

### How I read the request

- This is an explicit prototype-change request ("to the prototype"), so it authorizes updating and inspecting the affected candidate with no further approval.
- **Which candidates the pass covers:** the user selected C, recorded as Human-approved · User specified: "Go with C. Keep the others just for reference." After a selection the user made, the other candidates become **retained snapshots** unless a standing instruction keeps them active, and none exists here. Retained snapshots are updated only on request, and the request names the single prototype. So **only C is updated**. A, B, D and E stay unchanged. I don't ask how many to maintain; I reuse the recorded set.
- C is the **selected implementation target**. It must illustrate settled behavior only: no unlabelled hypotheses, and no details designed locally to fill a gap.
- No question to the user.

### Actions

1. **Read:** TICKET-0012, FLOW-004, the updated specification requirements, candidate C's booking-journey files, and the specification's selection, alternatives table and Decision Attribution.
2. **Edit `ui-ux/alternatives/c/…` only:**
   - Add the recurring weekly option to create booking using C's established navigation, hierarchy, controls and visual language.
   - Carry it through availability, a persistent confirmation, cancellation before submission and payment-failure recovery, exactly as FLOW-004 and the specification define them.
   - Keep the one-off booking path intact, with portable static mechanics and reviewer controls only in the reviewer area.
   - If a material point is unsettled in the canonical sources, I don't design it into the selected target. I raise a `todo` ticket and record that journey as incomplete for that point.
3. **Check that it works:**
   - Open `ui-ux/index.html` from disk and go to C from its launcher card.
   - Exercise:
     - a recurring weekly booking through to a persistent confirmation, then return to it;
     - cancellation before submission;
     - payment failure and recovery with no duplicate series;
     - a one-off booking regression.
   - Check desktop, tablet and phone widths, keyboard-only operation and focus, and storage failure cases if C uses storage.
   - Fix what fails and recheck.
4. **Runtime evidence for the selected candidate:** C has JavaScript-rendered interactions, and editing it makes any existing `ui-ux/alternatives/c/runtime-evidence.json` stale. Stale evidence fails validation.
   - I recapture it with `scripts/capture-prototype-runtime.mjs` from a temporary driver kept outside `ui-ux/`, using a Playwright-compatible page from the available browser tooling.
   - The capture covers all five interaction kinds (action, next, cancel, recovery, review-state targets), with the recurring booking as the product action and two distinct reviewer targets.
   - I then delete the driver.
   - If no such page is available, I report that limitation. I don't author a receipt by hand.
5. **Slideshow:** if C has a `slides.html`, I refresh its affected captures in this pass, or mark them outdated if that fails. Retained candidates' decks are left alone.
6. **`ui-ux/specification.md`:**
   - **C row:** coverage now includes the recurring weekly option; status remains selected target.
   - **Required prototype coverage:** the named scope now includes recurring weekly bookings, as `Complete — …` only if inspection passed with no contradiction or usability blocker.
   - **Prototype Review:** the booking journey row records the tool, viewports, direct-file check, runtime capture and findings.
   - **Covered-flow approval:** unchanged. The recurring states are agent-reviewed, not user-approved.
   - **Change Synchronization:** stays `None.`.
   - **Unchanged:** rows A, B, D and E ("Retained comparison — booking journey only; not updated after 2026-10-02"), the selected target, and `## Decision Attribution`.
7. **Launcher:** no change.
8. **Downstream:** if Build Design exists, check whether a Build Unit's UI/UX Realization or a current handoff names the booking journey. If the journey anchor is unchanged, no edit is needed. If the recurring path got its own anchor, update only those links and run the affected-slice audit.
9. **TICKET-0012:** move it to `finished` if it was `decided` and everything else is complete.
10. **Validation:**
    - `validate-ui-ux-design.mjs`.
    - `validate-implementation-detail-tickets.mjs` if the status changed.
    - The decision overview regenerated and `--check`ed if a settled ticket changed.

### Final report (verbatim)

> Recurring weekly bookings (TICKET-0012) are now in prototype C, your selected implementation target, and I checked them end to end.
>
> **What changed**
> - **`ui-ux/alternatives/c/`:** create booking offers a weekly repeat, following FLOW-004 and the specification, in C's existing layout and controls. Availability, confirmation, cancellation and payment failure handle recurring bookings; one-off booking is unchanged.
> - **`ui-ux/specification.md`:** C's coverage and the booking journey's review row now include the recurring option. Change Synchronization remains None.
>
> **How I checked it**
> - I opened `ui-ux/index.html` from disk in [tool] and went into C.
> - I made a recurring weekly booking through to its confirmation and returned to it, cancelled before submitting, and recovered from a payment failure without creating a second series. I also rechecked a one-off booking.
> - I did this at desktop, tablet and phone widths and with the keyboard only.
> - Findings: [findings/fixes].
> - I recaptured C's runtime evidence after the change.
> - `validate-ui-ux-design.mjs` passes.
>
> **Not changed**
> - A, B, D and E are kept for reference only, as you asked on 2026-10-02. They do not have the recurring option.
> - They don't block anything for C. I can update them if you want them to show it too.
>
> **Limits**
> - This is my heuristic walkthrough, not user testing. Your earlier approval of C's reviewed flow doesn't extend to the new recurring screens until you look at them.
> - Agent-chosen decisions recorded: none.
> - TICKET-0012: [now finished / already finished].

---

## Scenario 3

### How I read the request

- This is an explicit prototype-change request ("to the prototypes"), so it authorizes the affected updates and inspection.
- **Which candidates the pass covers:** C is the user-selected target. The specification also records a **standing instruction** from the same date and source: "Keep all five alternatives at the same functionality even after we choose one; I want to keep showing them to the client." The user has not changed it.
- A standing instruction to maintain several alternatives keeps them **active after a selection** until the user changes it. So A, B, D and E are **active alternatives**, not retained snapshots.
- Their rows still say "Retained comparison — booking journey only; not updated after 2026-10-02". A recorded label does not decide a candidate's role; the selection evidence and the user's instructions do.
- "Keep the others just for reference" does not revoke an instruction that explicitly covers the time after a selection. The current request also says "prototypes".
- So **all five are updated**. The authorized pass already covers every active alternative, so I don't ask.
- C remains the selected implementation target, under the selected-target rules (settled behavior only, runtime evidence). Unselected alternatives never block C's readiness.

### Actions

1. **Read:** TICKET-0012, FLOW-004, the updated specification requirements, the selection notes and Decision Attribution, and all five candidates' booking-journey files.
   - I also compare C's current agreed-scope functionality with A, B, D and E. Their rows say they were not updated after 2026-10-02.
   - The recurring option builds on the booking journey that all five already have, so a gap elsewhere does not stop this pass.
2. **Edit all five candidates:**
   - Add the recurring weekly option, carried through availability, a persistent confirmation, cancellation before submission and payment-failure recovery, as FLOW-004 and the specification define them.
   - Each alternative gets it through **its own** layout, navigation and interaction treatment.
   - The behavior is the same everywhere. A visual direction never approves different behavior.
   - In C, any unsettled material point is raised as a ticket, not designed locally.
3. **Check that it works in each:**
   - Open `ui-ux/index.html` from disk and go to each candidate in turn.
   - In each one, exercise:
     - a recurring weekly booking to a persistent confirmation, then return to it;
     - cancellation before submission;
     - payment failure and recovery with no duplicate series;
     - a one-off regression.
   - Check desktop, tablet and phone widths, keyboard-only operation and focus, and storage failure cases if used.
   - Fix and recheck.
4. **Runtime evidence:** recapture `ui-ux/alternatives/c/runtime-evidence.json` for C, as in Scenario 2. It is not required for the unselected alternatives.
5. **Slideshows:** refresh affected captures for any of the five that already has a deck, or mark them outdated if the refresh fails. I don't ask about slides.
6. **`ui-ux/specification.md`:**
   - **Active comparison line:** "arrival → availability → create booking (one-off or recurring weekly) → confirmation, plus cancellation and payment failure — A, B, C, D, E kept functionally comparable. Standing instruction, User (2026-10-02): "Keep all five alternatives at the same functionality even after we choose one; I want to keep showing them to the client.""
   - **Rows A, B, D and E:**
     - Role corrected to "Active alternative — kept at functional parity with the selected target under the user's standing instruction (2026-10-02)".
     - Coverage now includes the recurring weekly option.
     - "not updated after 2026-10-02" is replaced by the 2026-11-05 update.
   - **Row C:** still the selected target; coverage now includes the recurring option.
   - **Prototype Review:** the booking journey row records the per-candidate inspection, C's runtime capture, and the limits.
   - **Unchanged:** the selected target, Covered-flow approval and `## Decision Attribution`.
   - **Change Synchronization:** stays `None.` for this feature when all five pass.
7. **Any pre-existing parity gap:** suppose C carries other approved functionality that A, B, D and E lack.
   - I list it per alternative in those rows' coverage cells, as "parity gap: lacks … (TICKET-…/canonical link)". The standing instruction requires that functionality in them too.
   - I don't add it as a Change Synchronization row on a shared journey anchor. Such a row would read, and validate, as pending work blocking the selected target C, and unselected alternatives must not block C.
   - I don't close that gap silently beyond this request. I report it and offer to close it next.
   - If C's coverage is still the booking journey only, no such gap exists.
8. **Launcher:** no change.
9. **TICKET-0012 and validation:** as in Scenario 2.

### Final report (verbatim)

> Recurring weekly bookings (TICKET-0012) are now in all five prototypes, and I checked each one.
>
> **What changed**
> - **C (selected), A, B, D and E:** create booking offers a weekly repeat, following FLOW-004 and the specification, in each alternative's own layout. Availability, confirmation, cancellation and payment failure handle recurring bookings; one-off booking is unchanged in all five.
> - **`ui-ux/specification.md`:**
>   - A, B, D and E were still labelled "Retained comparison … not updated after 2026-10-02".
>   - Because of your standing instruction of 2026-10-02 to keep all five at the same functionality after choosing one, I corrected them to active alternatives.
>   - I recorded that instruction on the active-comparison line.
>   - C remains the selected implementation target.
>
> **How I checked it**
> - I opened `ui-ux/index.html` from disk in [tool] and, in each alternative, made a recurring weekly booking through to its confirmation and returned to it, cancelled before submitting, and recovered from a payment failure. I also rechecked a one-off booking.
> - I did this at desktop, tablet and phone widths and with the keyboard only.
> - Findings: [per alternative].
> - I recaptured C's runtime evidence.
> - `validate-ui-ux-design.mjs` passes.
>
> **Still open**
> - [Only if found:] Apart from this feature, A, B, D and E are behind C on [functionality, with tickets]. Those changes were made to C after 2026-10-02 without carrying them across, so the five are not yet at full parity. I've noted this on their rows. I can bring them level next.
> - If you no longer need the other four maintained for the client, tell me and I'll mark them as reference-only snapshots.
>
> **Limits**
> - This is my heuristic walkthrough, not user testing or your approval of the new screens.
> - Agent-chosen decisions recorded: none.
> - TICKET-0012: [now finished / already finished].

If any alternative remains unfinished or unverified, the report opens by saying the pass is **incomplete** and names that alternative.

---

## Scenario 4

### How I read the reply

- "Q1 yes" approves a recommendation I presented clearly: the fee and its deadline on the confirmation step, before the user confirms. That is **Human-approved · Agent recommended**. It settles the ticket's only question, so TICKET-0015 is resolved.
- Recording the answer and writing it into its canonical owners is in-pass workflow. It needs no new checkpoint.
- **Prototypes:** nothing was said about them, so there is no prototype-change or sync request. The initial reviewed prototype is already established, so manual batching applies:
  - I update canonical requirements, including the specification's requirements, and record pending prototype work in Change Synchronization.
  - I **do not edit or render** any candidate, and I regenerate no slides.
  - With no selection, all five alternatives are active, so the pending work names all five.

### Actions

1. **TICKET-0015**, in its ticket YAML file:
   - Change `status` from `todo` to `decided`.
   - Set `resolution: "Show the cancellation fee and its deadline on the confirmation step, before the user confirms."`
   - Add `attribution: [{"decision": "Show the cancellation fee and its deadline on the booking confirmation step, before the user confirms.", "origin": "human-approved/agent-recommended", "evidence": "Agent proposal (2026-11-05, ticket interview TICKET-0015 · Q1/1 · Show the cancellation fee before confirming): show the fee and its deadline on the confirmation step, before the user confirms. User reply: \"Q1 yes.\"", "conditions": []}]`.
   - Keep the question, options, recommendation and candidate proof. The kind stays `product`, since the answer doesn't reframe the question.
2. **Coherent write pass** to the ticket's write targets and the owners the answer actually affects:
   - **The booking flow's confirmation step:** before the confirm action, the user is shown the cancellation fee and its deadline.
   - **The interface action that supplies the confirmation step:** I check that it already provides the fee and deadline.
     - If it doesn't, I add them to that action's representation in its interface record, to realize the approved behavior. That counts as a meaningful interface choice, so I record it as **Agent-chosen** in that record's `## Decision Attribution`.
     - If no owner defines the fee amount or deadline rule itself, I don't invent one. The display requirement is recorded. The fee rule stays an open product question on its existing ticket, or on a new `todo` ticket that I present next. TICKET-0015 stays `decided` if a write target can't be completed without it.
   - **`ui-ux/specification.md`:**
     - Interaction And Content Rules, on the informed-decision line: the cancellation fee and its deadline are shown on the confirmation step, before confirming.
     - The booking journey row in Journey And Route Coverage reflects the same.
3. **System Guide:** search the guides for where confirming a booking is explained and update every such passage to say the same. If the user keeps PDFs, they are now stale, and regenerating them (`export-system-guide.mjs`, with `--check`) is part of this change.
4. **Affected unanswered tickets:** inspect open tickets about the confirmation step or cancellation for wording or options this answer invalidates, and refresh only those. I don't rescan the whole backlog.
5. **Change Synchronization** in `ui-ux/specification.md`: replace `None.` with:

   | Journey | Pending change | Canonical / ticket references |
   | --- | --- | --- |
   | [Booking journey](#[existing-booking-journey-anchor]) | Show the cancellation fee and its deadline on the confirmation step, before the confirm action, in each active alternative (A, B, C, D, E), through each alternative's own confirmation layout. | [TICKET-0015](../build/workflow/tickets/[domain]/[sr-xxx]/[sr-xxx]-tickets.yaml), [booking flow](../system-model/behavior/flows/[flow-file].md) |

   I leave the alternatives table, the selection (still `Unresolved`), Decision Attribution and the Prototype Review rows unchanged. The pending row marks the booking journey as not yet synchronized in all five.
6. **No edits** to `ui-ux/alternatives/*`, `ui-ux/index.html` or any `slides.html`.
7. **Status:** move TICKET-0015 to `finished` only after every canonical write target contains the answer, the guide is reconciled and the validators pass. The recorded pending prototype work is the one exception the skill allows for `finished`.
8. **Validation:**
   - `validate-implementation-detail-tickets.mjs`
   - `validate-technical-constraints.mjs` (no CONS; this is product behavior, not a technical must)
   - `validate-software-design-structure.mjs`
   - `validate-ui-ux-design.mjs`, which checks that the pending row's anchor and links resolve
   - `generate-decision-overview.mjs`, then the same script with `--check`

### Message to the user (verbatim)

> ✓ TICKET-0015 complete · 1/1 questions resolved
>
> I recorded the cancellation fee and its deadline on the confirmation step, shown before the user confirms. You approved my recommendation.
>
> - **Ticket:** TICKET-0015 is finished, attributed as Human-approved · Agent recommended.
> - **Design:** the booking flow's confirmation step and the UI/UX specification's confirmation rules now require the fee and its deadline before the confirm action. The guide passage that explains confirming a booking says the same.
> - **Prototypes:** not changed. The first reviewed prototype already exists, so I recorded this as pending prototype work for the booking journey in all five alternatives (A–E) rather than editing them. When you want them updated, tell me and I'll add it to all five and check each one.
> - **Checks:** the ticket, structure, UI/UX and decision-overview checks pass.
> - **Agent-chosen decisions recorded:** none. [If the interface had to change: "added the fee and deadline to the confirmation data the booking interface provides, recorded in that interface's record."]

If the interview continues with another ticket, the same message goes straight on to the next one in full, opening with `▶ TICKET-NNNN · Q1/N · <label>`. If a fee or deadline rule turned out to be undefined, the message instead says TICKET-0015 is decided but not yet finished, names the missing rule, and presents its ticket question next.

---

<!-- trial file responses-C.md -->

### Responses — Software Design skill, trial-k fixture

Paths below are relative to the package `fixture/design/software-design/` unless they start with `skill/` (the skill directory) or name the brief.

**Evaluation note.** The constraints of this run forbid writes, so nothing was changed. Each "change" below is a write I would make in a real session inside the authorized Stage 7 pass. The validator results below come from the unchanged fixture. In a real session I would rerun them on the repaired state (commands are listed in Scenario 5, step 9).

---

## Scenario 5

### 1. What I read and ran before the review

Routing from `SKILL.md` gave me this reading list:
- Continuing a staged blueprint at Stage 7 required `package-layout.md`, `system-model-format.md`, `staged-design-workflow.md` and `checkpoint-workflow.md`.
- Running a whole-scope ticket inventory required `implementation-detail-tickets.md` and `ticket-inventory-mode.md`.
- `SKILL.md` line 10 requires `planning-execution-contract.md`.
- `decision-attribution.md` was needed because I would record Agent-chosen contract repairs and approved scope exclusions.
- `ui-ux-design.md` was needed only to locate the Stage 7 UI work, because the Office Workspace is a human-facing surface.

I read the whole canonical package: the architecture, both Domains, all four System Responsibilities, `lifecycle.yaml`, both flows, both interfaces and the one ticket file. I also read the complete `software-brief.md`.

| Check (read-only) | Result |
| --- | --- |
| `validate-software-design-structure.mjs` | PASS. 4 System Responsibilities across 2 Domains |
| `validate-implementation-detail-tickets.mjs` | PASS. 1 ticket. Semantic completeness was not assessed |
| `validate-technical-constraints.mjs` | No register active |
| `report-ticket-inventory-leads.mjs` | Work Reports (SR-001) 0 tickets, Invoicing (SR-002) 1, Accounting Registers (SR-003) 0, Office Workspace (SR-004) 0. Zero-ticket responsibilities: SR-001, SR-003, SR-004. **0 explicit unresolved-language leads** |
| `generate-decision-overview.mjs --affected` on every interface, flow, responsibility and the lifecycle | No attributed decisions touched. No human-approved decision constrains the repairs |

**7A (owner synchronization).** TICKET-0001 (rounding) has a truthful owner (SR-002), a write target that resolves, and no dependencies. Owner synchronization is setup only. It is not evidence that discovery is complete.

Two checks passed and the lead report shows no leads, but none of these tools can find an operation that no record declares. The semantic check is the counterfactual review (7B) followed by the journey-operation census (7C). The census found most of the material problems.

### 2. 7B — Independent discovery (working ledger: temporary, never written to the package)

I asked one question of every responsibility, without starting from TICKET-0001: "if every current ticket were resolved, what would an implementer still have to choose?"

| Lens | Work Reports (SR-001) | Invoicing (SR-002) | Accounting Registers (SR-003) | Office Workspace (SR-004) |
| --- | --- | --- | --- | --- |
| 1 Artifacts & data | `answered:IFACE-001 payload` (after repair: adds submitter and return reason). Content of a quantity → `ticket:TICKET-0002`. Report identity per site and date → `ticket:TICKET-0003` | `answered:IFACE-002 payload` (after repair: adds issue date). Rounding → `ticket:TICKET-0001`. Unit prices → `ticket:TICKET-0005`. Taxes → `ticket:TICKET-0006`. Customer records → `ticket:TICKET-0008` | Content of a register entry → `paused:` listing ownership (§6). Tax figures → `ticket:TICKET-0006` (affects) | `excluded:` owns no records. Its purpose grants no authority, and FLOW-002 step 1 says a selection reserves nothing |
| 2 Lifecycle & concurrency | submitted/validated/returned → `answered:FLOW-001 + IFACE-001.ACT-001/ACT-003` (repaired). Deciding twice → `answered:ACT-001`. Duplicate or retried submission → `ticket:TICKET-0003`. A returned report that is never resubmitted → `excluded:` no journey withdraws it; it stays returned and is never billable | Atomic issuance, concurrent issues, no draft → `answered:IFACE-002.ACT-004` (repaired). Correcting an issued invoice → `excluded:SCOPE-003` (credit notes deferred, new record) | Entry created when the invoice is received → `answered:FLOW-002 step 4`. Duplicate redelivery → `answered:IFACE-002.ACT-001` (publication promised once; each invoice number has one entry) | `excluded:` local screen state only. After repair, SR-004 owns no state change |
| 3 Authority & secrets | Decisions by office clerks only → `answered:ACT-001`. Site-manager submission and visibility → `answered:ACT-003/ACT-004` (minimum the journey needs, repaired). How roles and sites are assigned → `ticket:TICKET-0010` | Issuance by office clerks only → `answered:ACT-004`. Role assignment → `ticket:TICKET-0010`. Billing a site's work to another customer → `ticket:TICKET-0009` | Listing for accountants only → `answered:IFACE-002.ACT-003` | Acts only through the owners' interfaces → `answered:SR-004 Purpose`. Sign-in → `ticket:TICKET-0010` |
| 4 Interfaces & handoffs | IFACE-001 ACT-001…004 → `answered` (repaired). Who records that a quantity was invoiced → `ticket:TICKET-0004` | IFACE-002 ACT-001…004 → `answered` (repaired). Invoiced mark → `ticket:TICKET-0004` (affects) | Consumer of its own register listing, and initial acquisition / catch-up → `paused:` §6 | Every journey control maps to an owner action → `answered` (census §3). Customer chooser → `ticket:TICKET-0008` |
| 5 Protocol / transaction | Decision checks (submitted only, reason required) → `answered:ACT-001` (widened). Resubmission checks → `answered:ACT-003` | Next number, no number consumed by a failed issue → `answered:ACT-004`. Shape of the series → `ticket:TICKET-0007` | Number-ordered listing → `answered:IFACE-002.ACT-003` verification intent | `excluded:` owns no transaction |
| 6 Failure & recovery | A rejection leaves the report unchanged → `answered:IFACE-001 Failure Meaning`. Lost response on a decision → `answered:ACT-001 + ACT-004` re-read. Lost response on a submission → `ticket:TICKET-0003` | A rejected or failed issue changes nothing. A retry never issues twice → `answered:ACT-004`. Redelivery until acknowledged → `answered:ACT-001` | Catch-up after being unavailable or starting late → `paused:` §6 | Shows the owners' rejections and re-reads → `answered:ACT-001/ACT-004`, `IFACE-002.ACT-004` (the refusal lists the quantities) |
| 7 Observation & operations | Clerk's queue and site manager's view → `answered:ACT-004`. Decision history beyond current state and latest reason → `excluded:` not required by journey 1; no operator role in scope | Publication to accounting → `answered:ACT-001`. Invoice document or delivery → `excluded:SCOPE-001/SCOPE-002` (no required journey produces or sends a document) | How fresh the accountant's listing must be → `paused:` §6 | Clerk queue and returned reason → `answered:ACT-004` |
| 8 Economics & resources | Units and precision → `ticket:TICKET-0002`. Quotas or limits → `excluded:` no limit or cost rule in the journeys | Rounding → `TICKET-0001`. Price and currency → `TICKET-0005`. Tax → `TICKET-0006` | `excluded:` amounts are owned by Invoicing | `excluded:` |
| 9 Verification | `answered:IFACE-001` verification intents (repaired) | `answered:IFACE-002` intents. ACT-004 is `high` risk with its matrix cases named | Consumer side of ACT-001 → `answered`. Listing → `paused:` §6 | `excluded:` presentation and interaction belong to the Stage 7 UI/UX specification (not yet created), not to an implementation-detail ticket |
| 10 Operability & composition | Profile, seeded sites and accounts → `ticket:TICKET-0011` (with 0008, 0010) | Profile, seeded customers and prices → `ticket:TICKET-0011` | `ticket:TICKET-0011` | Entrypoint for the three roles → `ticket:TICKET-0011` and `ticket:TICKET-0010` |

### 3. 7C — Journey-operation census (approved scope: the three required journeys)

I started from the brief's journeys and FLOW-001/FLOW-002, not from the declared `ACT-NNN` lists.

**Journey 1: work-report validation**

| Op | Actor and authority | Operation | Before this pass | Disposition |
| --- | --- | --- | --- | --- |
| J1.1 | Site manager | **Submit a daily work report** (the command that starts the journey; site, date, quantities; none → submitted) | **Declared by no contract.** FLOW-001 assumes it in `starts_when` but has no transition for it. IFACE-001 has only the clerk's decision and the billable-quantities read | **Contract gap. Repair: add `IFACE-001.ACT-003 — Submit or resubmit a work report`** |
| J1.2 | Office clerk | Find submitted reports and open one with its quantities (FLOW-001 step "clerk opens the report") | No read. ACT-002 returns only validated, not-yet-invoiced quantities, so the clerk cannot find a submitted report to decide on | **Contract gap. Repair: add `IFACE-001.ACT-004 — Work reports for review`** |
| J1.3 | Office clerk | Validate, or return **with a written reason** | ACT-001 exists, but its input is only the identifier and the decision. There is no reason, and the output carries none | **Reuse ACT-001 and widen it**: a return requires the reason, and the reason is stored and returned. Failure meanings separated |
| J1.4 | Site manager | See the returned report and its reason | No read. ACT-002 excludes site managers and unvalidated reports | **Covered by the same new ACT-004** (site manager sees own reports). No separate action |
| J1.5 | Site manager | Correct and resubmit (returned → submitted) | No command. FLOW-001 step 3 gives this state change to SR-004, which holds no report authority | **Covered by the same new ACT-003** (resubmission branch). FLOW-001 re-owned to SR-001 |
| J1.6 | Invoicing / clerk | Validated quantities become billable | ACT-002 exists | **Reuse ACT-002 unchanged.** Where its "not yet invoiced" fact comes from → `TICKET-0004` |

Denials and failures, all dispositioned:
- deciding on a report that is not submitted (ACT-001);
- returning without a reason (widened ACT-001);
- resubmitting a report that is not returned, or someone else's report (ACT-003);
- a validated report cannot be returned (FLOW-001 failure plus ACT-001).

**Journey 2: customer invoice issuance**

| Op | Actor | Operation | Before this pass | Disposition |
| --- | --- | --- | --- | --- |
| J2.1 | Office clerk | Choose a customer | No owner or source for customer records | `ticket:TICKET-0008` (source) and `TICKET-0009` (site-to-customer rule). No action is added until answered |
| J2.2 | Office clerk | Choose validated quantities | IFACE-001.ACT-002 | Reuse |
| J2.3 | Office clerk | Preview totals | IFACE-002.ACT-002 | Reuse. Widen only its failure meanings (forbidden, unknown customer). Totals inputs → TICKET-0001/0005/0006 |
| J2.4 | Office clerk | **Issue the invoice** (next number, final, quantities invoiced) | **Declared by no contract.** ACT-001 is the *published result* (an event) and ACT-002 a *simulation that stores nothing*. Neither starts an issuance. FLOW-002 step 3 also claims "draft → issued", but no draft is ever stored | **Contract gap. Repair: add `IFACE-002.ACT-004 — Issue an invoice`.** Reconcile FLOW-002 step 3 to "none → issued (no draft stored)" |
| J2.5 | Invoicing → Accounting Registers | Make it available to accounting | IFACE-002.ACT-001 | Reuse (Accounting Registers side paused, §6) |

**Journey 3: tax register listing**

| Op | Actor | Operation | Before this pass | Disposition |
| --- | --- | --- | --- | --- |
| J3.1 | Accountant | List issued invoices for a period | IFACE-002.ACT-003 exists, but the invoice records no date, so "period" has nothing to select on | **Reuse and widen**: the invoice records its issue date, and the period selects by issue date. *Which responsibility produces this listing* → `paused:` §6 |

**Contract gaps found and their repair state.** Five gaps, all repaired in the Stage 7 pass (§7):
1. Submission/resubmission command missing.
2. Report-review read missing.
3. ACT-001 had no reason.
4. Issue command missing.
5. Invoice had no issue date.

Also repaired: FLOW-001 assigned a state change to SR-004, and FLOW-002 recorded a stale "draft" state. One ownership overlap remains paused (§6).

### 4. 7C — Handoffs and consumer-side challenges

| Interaction | Producer → consumer | Access / first acquisition | Read-before-write | Refresh / retry / recovery | Empty vs not-found vs forbidden vs stale | Acknowledgement | Failure owner |
| --- | --- | --- | --- | --- | --- | --- | --- |
| IFACE-001.ACT-001 decide | SR-001 → SR-004 (clerk) | Report id via ACT-004. **Before repair there was no route** | Quantities via ACT-004 | Lost response → retry rejected with the current state → re-read ACT-004 | not found / forbidden / not submitted (stale) / missing reason, after widening | New state + reason | SR-001 |
| IFACE-001.ACT-002 billable quantities | SR-001 → SR-002, SR-004 | Site + period | n/a (read) | Re-read | Empty when nothing validated. Stale (invoiced since the read) → refused by IFACE-002 ACT-002/ACT-004. Source of the "invoiced" fact → **TICKET-0004** | n/a | SR-001 |
| IFACE-001.ACT-003 submit/resubmit (new) | SR-001 → SR-004 (site manager) | Which sites may be chosen → TICKET-0008/0010 | Resubmission reads the returned report and reason via ACT-004. Existing report for the same site and date → TICKET-0003 | Lost response on a first submission → **TICKET-0003** | forbidden / not found / not returned / malformed | Submitted report + identifier | SR-001 |
| IFACE-001.ACT-004 review read (new) | SR-001 → SR-004 (clerk, site manager) | Id or site + period (+ state) | n/a | Re-read | Empty / not found / forbidden (another manager's report) | n/a | SR-001 |
| IFACE-002.ACT-001 issued invoice published | SR-002 → SR-003 | Initial acquisition / catch-up → **paused §6** | n/a | Redelivered until acknowledged (answered) | n/a | Consumer acknowledges. One entry per invoice number | SR-002 redelivers |
| IFACE-002.ACT-002 preview | SR-002 → SR-004 (clerk) | Customer → TICKET-0008 | Quantities via IFACE-001.ACT-002 | Re-preview | already invoiced / not validated, plus forbidden and unknown customer (widened) | Simulated totals | SR-002 |
| IFACE-002.ACT-003 period listing | SR-002 (paused) → SR-004 (accountant) | Period by issue date (repaired) | n/a | Re-read. Freshness → **paused §6** | Empty when none issued | n/a | paused |
| IFACE-002.ACT-004 issue (new, `high`) | SR-002 → SR-004 (clerk) | Customer → TICKET-0008/0009 | Preview via ACT-002 | Retry after a lost response is rejected as already invoiced, listing the quantities. Never a second invoice | forbidden / unknown customer / quantity no longer billable | Issued invoice with number and issue date | SR-002 |
| (none declared) invoiced mark | SR-002 → SR-001 | — | — | — | — | — | **TICKET-0004** |
| (none declared) tax-register listing | SR-003 → SR-004 | — | — | — | — | — | **paused §6** |
| (none declared) identity and roles | external or unowned → all | — | — | — | — | — | **TICKET-0010** |
| (none declared) customers and sites | external or unowned → SR-001/SR-002 | — | — | — | — | — | **TICKET-0008** |

No external system is declared. The only candidate external systems (an identity provider, a company customer system) arise as options in TICKET-0010 and TICKET-0008.

### 5. 7C — Other censuses

- **Target outcome and runtime profiles.**
  - The implied outcome: the three roles complete the three journeys through the Office Workspace.
  - Neither the brief nor the package names a profile, a claim level, a composition/bootstrap owner, seed data (sites, customers, prices, accounts), reset behaviour or a proof route.
  - Disposition: `ticket:TICKET-0011` (seed contents depend on 0005/0008/0010).
  - No fixture or harness stands in for a runnable claim. Assigning Build Units comes later, in Stage 8.
- **Artifacts.**
  - Owned by Work Reports: work report, quantity line (0002), return reason (repaired).
  - Owned by Invoicing: invoice, number/series (0007), issue date (repaired), lines/totals (0001/0005/0006), the published issued-invoice message (ACT-001).
  - Accounting Registers' register entry: paused.
  - Customer and site: 0008/0009. User/role: 0010.
  - A preview is explicitly never stored.
- **Authority.**
  - Site manager: submit and resubmit, see own reports.
  - Clerk: read and decide reports, select, preview, issue.
  - Accountant: list.
  - Invoicing as a service: reads ACT-002.
  - Role and site assignment: 0010.
  - No secrets, funds transfers or signatures are in scope.
- **External integration.** None declared. Possible integrations appear only inside 0008 and 0010. No human operator in the journeys.
- **Lifecycle tails.**

  | Tail | Disposition |
  | --- | --- |
  | Returned report never resubmitted | Excluded: never billable |
  | Duplicate submission / lost response | TICKET-0003 |
  | Validated quantities never invoiced | Answered: they remain listed |
  | Preview abandoned | Answered: nothing stored |
  | Concurrent or retried issue | Answered: ACT-004 |
  | **Issued invoice found wrong** | Excluded: credit notes deferred. No canonical owner existed (`scope_boundaries: "None."`), so SCOPE-003 is created |
  | Publication not acknowledged | Answered: redelivery |
  | Accounting Registers unavailable | Paused |

- **Unresolved language.** The lead report found no hits, so I did a manual pass over the brief and package:

  | Term in brief or package | Disposition |
  | --- | --- |
  | "customer invoice series" | 0007 |
  | "next number" | ACT-004 + 0007 |
  | "draft" | Repaired in FLOW-002 |
  | "period" | Repaired for invoices. For ACT-002 the report date is the only date a report has |
  | "available to accounting" | ACT-001 |
  | "prepare the tax register" | Paused + 0006 |
  | "quantities" | 0002 |
  | "written reason" | ACT-001 widened |
  | "corrects and resubmits" | ACT-003 + 0003 |
  | The three Out-of-scope items | SCOPE-001/002/003 |
  | "planned for a later version" | SCOPE-003 revisit condition |
  | "Customising the invoice document layout" | Implies a document. No required journey produces one, so it is recorded as an exclusion and SCOPE-002 states that it adds no document |

### 6. Paused boundary: who serves the accountant's period listing

Accounting Registers is defined as owning "the tax-register listings derived from issued invoices", and it receives every issued invoice (IFACE-002.ACT-001, redelivered until acknowledged). Nothing reads what it keeps. Meanwhile journey 3's listing is produced by Invoicing (IFACE-002.ACT-003, access: accountants). The architecture says issued invoices "cross to accounting".

So the same need has two plausible owners, and Accounting Registers has an output with no consumer. Choosing between them changes which responsibility serves accountants. That is a responsibility/authority boundary choice, outside what my delegation covers. I paused only that branch (Accounting Registers lenses 1/4/6/7/9 and the producer of J3.1) and asked the user (§8). Journeys 1 and 2 and the other repairs do not depend on the answer.

### 7. Changes I make (authorized Stage 7 pass)

These are contract gaps that approved behaviour already determines. They are repaired in the owning interfaces and flows, not ticketed. Prospective-inventory writes create tickets only. No System Responsibility behaviour is changed.

**7.1 `system-model/contracts/interfaces/iface-001-work-reports.md`.** Full new content (frontmatter unchanged):

````markdown
---
type: system-interface
id: IFACE-001
name: Work reports
producers: "SR-001"
consumers: "SR-002, SR-004"
flows: "FLOW-001, FLOW-002"
related_contracts: "None."
---

### IFACE-001 — Work Reports

## Boundary

Work Reports (SR-001) exposes report submission and resubmission to site managers, report review and the validate-or-return decision to office clerks — both through the Office Workspace — and validated quantities to Invoicing.

## Payload Or Artifact

A work report: identifier, site, date, quantities, state, the site manager who submitted it, and, when it has been returned, the written reason of its latest return.

## Material Interactions

<a id="act-001"></a>
### ACT-001 — Validate or return a work report

**Kind:** `callable`

**Trigger or entry:** The office clerk decides on a submitted report.

**Input:** Report identifier and the decision: `validate`, or `return` with a non-empty written reason.

**Output or observable result:** The report's new state, `validated` or `returned`; a returned report carries the written reason, which its site manager sees through ACT-004.

**Access or authority:** Office clerks only.

**Failure and recovery:** Rejected, leaving the report unchanged, when the report does not exist (not found), the caller is not an office clerk (forbidden), a return has no written reason, or the report is not in `submitted` state (already decided, or returned and not yet resubmitted); the rejection states the current state. After a lost response the clerk re-reads the report through ACT-004 instead of deciding again.

**Risk:** `ordinary`

**Verification intent:** Validating and returning change the state; a return without a reason is rejected; deciding twice is rejected; a returned report's reason is visible to the site manager who submitted it.

<a id="act-002"></a>
### ACT-002 — Validated quantities for a period

**Kind:** `state-observation`

**Trigger or entry:** Invoicing or the workspace reads validated, not-yet-invoiced quantities.

**Input:** Site and period.

**Output or observable result:** Validated quantities with their report references.

**Access or authority:** Office clerks and Invoicing.

**Failure and recovery:** Empty when nothing is validated in the period.

**Risk:** `ordinary`

**Verification intent:** Only validated, not-yet-invoiced quantities appear.

<a id="act-003"></a>
### ACT-003 — Submit or resubmit a work report

**Kind:** `callable`

**Trigger or entry:** A site manager submits a daily work report, or resubmits a returned report after correcting it.

**Input:** First submission: site, date and quantities. Resubmission: the returned report's identifier and its corrected quantities.

**Output or observable result:** The report in `submitted` state with its identifier; a resubmitted report keeps its identifier, site and date and must be decided again.

**Access or authority:** Site managers; a returned report can be resubmitted only by the site manager who submitted it.

**Failure and recovery:** Rejected, changing nothing, when the caller is not a site manager or the report belongs to another site manager (forbidden), the report to resubmit does not exist (not found), the report is not `returned` (a `submitted` or `validated` report cannot be resubmitted; the rejection states its state), or the quantities are malformed. Whether a second report for the same site and date is accepted, and how a repeated first submission after a lost response is recognised, is open in TICKET-0003.

**Risk:** `ordinary`

**Verification intent:** A first submission creates a `submitted` report; a resubmission moves `returned` → `submitted` with corrected quantities; resubmitting a `submitted` or `validated` report is rejected; no submission or resubmission makes quantities billable.

<a id="act-004"></a>
### ACT-004 — Work reports for review

**Kind:** `state-observation`

**Trigger or entry:** An office clerk looks for submitted reports awaiting a decision and opens one; a site manager looks at the reports they submitted, including a returned report and its reason.

**Input:** A report identifier, or a site and period with an optional state (`submitted`, `validated` or `returned`).

**Output or observable result:** Matching reports with identifier, site, date, quantities and state, and, for a returned report, the written reason of its latest return.

**Access or authority:** Office clerks: every report. Site managers: only the reports they submitted.

**Failure and recovery:** Empty when no report matches; not found for an unknown identifier; forbidden when a site manager asks for a report they did not submit or the caller has neither role.

**Risk:** `ordinary`

**Verification intent:** A clerk finds submitted reports and opens one with its quantities; a site manager sees their returned report with its reason and never another site manager's report; reading never changes a report.

## Preconditions And Validation

- Decisions apply only to submitted reports.
- A return requires a non-empty written reason.
- Only a returned report can be resubmitted, and only by the site manager who submitted it.

## Failure Meaning

A rejected decision, submission or resubmission leaves every report unchanged.

## Must Not Imply

- Validation does not invoice anything.
- Submitting, resubmitting, opening or reading a report does not validate it or make its quantities billable.

## Decision Attribution

| Decision | Origin | Evidence | Conditions |
| --- | --- | --- | --- |
| One action, ACT-003, covers both a first submission and the resubmission of a corrected returned report. | Agent-chosen | Chosen during the authorized Stage 7 journey-operation census; journey 1 of the software brief and `system-model/behavior/flows/flow-001-work-report-validation.md` require both, and one operation serves both controls. | None |
| A resubmission corrects the returned report's quantities and keeps its identifier, site and date. | Agent-chosen | Chosen while adding ACT-003; the brief's "corrects and resubmits it" read as the same report. Report identity per site and date stays open in TICKET-0003. | None |
| Site managers read and resubmit only the reports they submitted; office clerks read every report. | Agent-chosen | The minimum access journey 1 needs, chosen while adding ACT-003 and ACT-004; wider site-based access is open in TICKET-0010. | None |
````

**7.2 `system-model/contracts/interfaces/iface-002-issued-invoicing.md`.** Changes:
- `related_contracts: "SCOPE-001, SCOPE-003"`.
- Boundary, payload, ACT-002 failure, ACT-003 input/output, Preconditions, Failure Meaning and Must Not Imply are widened.
- New ACT-004 and a Decision Attribution section.
- ACT-001 is unchanged.

````markdown
## Boundary

Invoicing (SR-002) exposes invoice previews and invoice issuance to office clerks through the Office Workspace, the period listing of issued invoices to accountants, and issued invoices to Accounting Registers.

## Payload Or Artifact

An invoice: number, series, issue date, customer, lines, totals, and state. An invoice exists only once issued; a preview is never stored.

(ACT-001 unchanged)

ACT-002 — **Failure and recovery:** Rejected, changing nothing, when the caller is not an office clerk (forbidden), the customer is unknown (not found), or a selected quantity is not validated or is already invoiced; the rejection lists those quantities.

ACT-003 — **Input:** Period: the issued invoices whose issue date falls within it.
          **Output or observable result:** Issued invoices with numbers, issue dates and totals.

<a id="act-004"></a>
### ACT-004 — Issue an invoice

**Kind:** `callable`

**Trigger or entry:** After previewing, the office clerk issues the invoice for a customer and the selected validated quantities.

**Input:** Customer and the selected validated quantities (the previewed selection).

**Output or observable result:** The issued invoice: the next number in the customer invoice series, series, issue date, customer, lines and totals. The invoice is final and cannot be edited, its quantities are invoiced, and ACT-001 then publishes it.

**Access or authority:** Office clerks only.

**Failure and recovery:** All or nothing: either the invoice is issued with the next number and its quantities become invoiced, or nothing changes and no number is consumed. Rejected when the caller is not an office clerk (forbidden), the customer is unknown (not found), or a selected quantity is no longer validated and not yet invoiced — for example because another invoice took it after the preview — and the rejection lists those quantities so the clerk can preview again. A retry after a lost response is rejected the same way and never issues a second invoice.

**Risk:** `high`

**Verification intent:** Positive: issuing assigns the next number, records the issue date, makes the invoice final and marks its quantities invoiced. Rejection/denial: a non-clerk is denied; already-invoiced quantities are rejected without consuming a number. Failure/recovery: concurrent issues over overlapping quantities issue at most one invoice; a retried issue after a lost response never issues a second invoice; numbers have no gap or duplicate.

## Preconditions And Validation

- Only validated, not-yet-invoiced quantities can be simulated or issued.

## Failure Meaning

A rejected simulation or issuance changes nothing and consumes no invoice number.

## Must Not Imply

- A simulation is never an issued invoice.
- Publishing an issued invoice (ACT-001) reports an issuance; it does not perform one.
- Issuing does not deliver the invoice to the customer ([SCOPE-001](../scope/scope-001-invoice-delivery.md)), and an issued invoice cannot be corrected in this version ([SCOPE-003](../scope/scope-003-credit-notes.md)).

## Decision Attribution

| Decision | Origin | Evidence | Conditions |
| --- | --- | --- | --- |
| Issuing (ACT-004) creates the invoice directly in its final issued state; no draft invoice is stored, and a rejected or failed issue consumes no number. | Agent-chosen | Chosen while adding ACT-004 in the Stage 7 census; reconciles the flow's former "draft → issued" with ACT-002 (a preview stores nothing) and with the brief's "assigns the next number". | None |
| An invoice records its issue date, and ACT-003 selects issued invoices by issue date. | Agent-chosen | ACT-003 took a period while the invoice carried no date; chosen during the Stage 7 census. | None |
| ACT-004 is classified `high` risk. | Agent-chosen | Issuing is irreversible, legally numbered and exposed to double billing. | None |
````

The producer of ACT-003 stays as declared while §6 is paused.

**7.3 `system-model/behavior/flows/flow-001-work-report-validation.md`.**
- Frontmatter unchanged.
- In the new table, SR-004 no longer owns `returned → submitted`.
- Contract links are written as `../../contracts/interfaces/iface-001-work-reports.md#act-00N`.

```markdown
| Step | Owner | Requires | Action | Produces | State change | Must not imply |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `SR-001` | Site manager's report: site, date, quantities ([IFACE-001.ACT-003](../../contracts/interfaces/iface-001-work-reports.md#act-003)) | Record the submitted report | Submitted report | none → submitted | Submission does not validate the report or make its quantities billable |
| 2 | `SR-004` | Submitted report ([IFACE-001.ACT-004](../../contracts/interfaces/iface-001-work-reports.md#act-004)) | Office clerk finds and opens the report | Report shown with quantities | None | Opening does not validate |
| 3 | `SR-001` | Clerk decision ([IFACE-001.ACT-001](../../contracts/interfaces/iface-001-work-reports.md#act-001)) | Validate the report, or return it with a written reason | Validated report, or returned report carrying the reason | submitted → validated, or submitted → returned | A returned report is not rejected permanently |
| 4 | `SR-004` | Returned report ([IFACE-001.ACT-004](../../contracts/interfaces/iface-001-work-reports.md#act-004)) | Show the returned report and its reason to the site manager, who corrects it | Corrected quantities ready to resubmit | None | Showing the reason does not resubmit |
| 5 | `SR-001` | Corrected returned report ([IFACE-001.ACT-003](../../contracts/interfaces/iface-001-work-reports.md#act-003)) | Accept the resubmission; the report returns to step 2 | Resubmitted report | returned → submitted | Resubmission does not skip validation |

## Failure And Reroute

- A report already validated cannot be returned or resubmitted.
- A return without a written reason is rejected and the report stays submitted.
- Only a returned report can be resubmitted, and only by the site manager who submitted it.
- Any rejected decision, submission or resubmission leaves the report unchanged.
```

**7.4 `system-model/behavior/flows/flow-002-invoice-issuance.md`.**
- Frontmatter: `contracts: "IFACE-001, IFACE-002, SCOPE-003"`.
- Table changes:
  - Step 1 Requires gets `([IFACE-001.ACT-002](../../contracts/interfaces/iface-001-work-reports.md#act-002))`.
  - Step 2 gets `([IFACE-002.ACT-002](../../contracts/interfaces/iface-002-issued-invoicing.md#act-002))`.
  - Step 4 gets `([IFACE-002.ACT-001](…#act-001))`.
  - Step 3 becomes:
    `| 3 | `SR-002` | Previewed selection ([IFACE-002.ACT-004](../../contracts/interfaces/iface-002-issued-invoicing.md#act-004)) | Issue the invoice: assign the next series number, record the issue date and make it final | Issued invoice | none → issued (no draft is stored) | Issuing is not reversible by editing |`
- Failure And Reroute adds:
  - "Issuing is rejected without consuming a number when a selected quantity has been invoiced since the preview; the clerk previews again."
  - "An issued invoice cannot be corrected in this version; credit notes are deferred ([SCOPE-003](../../contracts/scope/scope-003-credit-notes.md))."

**7.5 Approved exclusions without a canonical owner.** The brief's "Out of scope" has no owner (Architecture says `scope_boundaries: "None."`). The lifecycle-tail census found that the credit-note exclusion leaves an issued-invoice error uncorrectable. New files in `system-model/contracts/scope/`, each from the scope template with Boundary, Reason, Must Not Be Inferred, Revisit Condition and Decision Attribution:

| File | id / status | Must not be inferred (core) | Revisit | Attribution |
| --- | --- | --- | --- | --- |
| `scope-001-invoice-delivery.md` | SCOPE-001 · `excluded` · SR-002 · FLOW-002 | Issuing does not send the invoice by email or post or notify the customer. "Available to accounting" is not "available to the customer" | When the product owner asks for invoices to reach customers through the system | Unknown origin. Evidence: the brief's Out of scope section states product-owner approval, but no record shows who chose the exclusion |
| `scope-002-invoice-layout-customisation.md` | SCOPE-002 · `excluded` · SR-002 · FLOW-002 | Nobody can change an invoice document's layout. This exclusion does not itself add an invoice document: no required journey produces one | When a customer-facing invoice document is brought into scope | Unknown origin (same evidence) |
| `scope-003-credit-notes.md` | SCOPE-003 · `deferred` · SR-002, SR-003 · FLOW-002 | An issued invoice with an error cannot be corrected, cancelled or offset in this version. The customer invoice series implies nothing about credit-note numbering | When the later version that adds credit notes is scoped | Unknown origin (same evidence) |

Related edits:
- `system-model/architecture.md` frontmatter: `scope_boundaries: "SCOPE-001, SCOPE-002, SCOPE-003"`.
- Root `README.md`: keep the Architecture link and add `- [Scope boundaries](./system-model/contracts/scope/)`, `- [Build and workflow](./build/README.md)` and `- [Decision Overview](./build/workflow/decision-overview.md)`.
- Create the missing compact lane index `build/README.md`. It should have existed since the first ticket file. Content: the tickets lane plus the generated Decision Overview, with the note that Stage 8 has not started.

**7.6 Tickets.** Kind rationale is kept in temporary notes: "This ticket chooses X; contract Y is fixed or open; therefore kind Z." Every ticket is `todo`, `resolution: null`, `build_units: []`, `build_unit_disposition: "Realization mapping has not started."`.

`build/workflow/tickets/operations/sr-001/sr-001-tickets.yaml` (new; scope `"responsibility:SR-001"`):

```yaml
ticket_file_version: 4
scope: "responsibility:SR-001"

tickets:
  - id: "TICKET-0002"
    title: "Define what a reported quantity records"
    status: "todo"
    kind: "product"
    complexity: "medium"
    concern: "data-model"
    owner: "SR-001"
    affects: ["SR-001", "SR-002", "SR-004"]
    build_unit_disposition: "Realization mapping has not started."
    build_units: []
    cluster: "work-report-content"
    question: "What does each quantity in a daily work report record: a predefined work item with its fixed unit and an amount, free text with a unit and an amount, or both?"
    context: "A site manager submits a daily work report listing the work done on a site; once an office clerk validates it, those quantities become billable and Invoicing turns them into invoice lines. The design says only that a report carries quantities. Example: '12 m2 of tiling' could be picked from a list of work items whose unit is m2, or typed as text. The choice decides what the site manager enters, what the clerk checks and whether a line can be priced automatically."
    candidate_proof: "An implementer cannot finish or verify work-report submission and the invoice lines built from validated quantities without choosing what a reported quantity records (work-item reference or free text, unit, amount precision), and the current package does not already choose it."
    options: ["Predefined work items: each quantity references a work item with its fixed unit plus an amount; lines can be priced automatically, and a new kind of work needs the list updated first.", "Free text: each quantity is a description, a unit and an amount; flexible on site, but every invoice line needs a manually supplied price.", "Both: predefined work items plus optional free-text extras; covers unusual work at the cost of handling two line kinds in validation and invoicing."]
    recommendation: "Predefined work items with a fixed unit and an amount with up to two decimals, assuming the company already bills against a known list of work types, because validation and pricing then follow mechanically; if unusual work is common, choose the combined option."
    resolution: null
    depends_on: []
    write_targets: ["system-model/contracts/interfaces/iface-001-work-reports.md", "system-model/domains/operations/responsibilities/sr-001-work-reports.md"]
  - id: "TICKET-0003"
    title: "Decide whether a site can have more than one report per day"
    status: "todo"
    kind: "product"
    complexity: "low"
    concern: "state-lifecycle"
    owner: "SR-001"
    affects: ["SR-001", "SR-002", "SR-004"]
    build_unit_disposition: "Realization mapping has not started."
    build_units: []
    cluster: "work-report-content"
    question: "Can more than one work report exist for the same site and date, and what happens when a site manager submits again for a site and date that already has one?"
    context: "A site manager submits a daily work report for a site and date, and validated quantities become billable. Nothing says whether a second report for the same site and day is allowed. Example: the connection drops after a site manager taps Submit and they submit again, or two site managers both report Monday on the same site. If both reports are accepted and validated, the same work can be billed twice; if a second report is refused, a second crew needs another way to report. A resubmitted report keeps its site and date, so the answer also decides how a wrong date is fixed."
    candidate_proof: "An implementer cannot finish or verify work-report submission without choosing whether a second report for the same site and date is accepted, refused or treated as a repeat of the first, and the current package does not already choose it."
    options: ["One report per site and date: a second submission is refused and points to the existing report, and a repeated submission after a lost response returns the existing report instead of creating another.", "Several reports per site and date (for example one per crew): each submission creates a report, a repeated submission needs a submission reference so it is not recorded twice, and clerks must watch for overlapping quantities."]
    recommendation: "One report per site and date, because the brief describes a daily report for a site and this makes billing the same day's work twice structurally impossible; it assumes one person reports for each site each day."
    resolution: null
    depends_on: []
    write_targets: ["system-model/contracts/interfaces/iface-001-work-reports.md", "system-model/domains/operations/responsibilities/sr-001-work-reports.md", "system-model/behavior/flows/flow-001-work-report-validation.md"]
  - id: "TICKET-0004"
    title: "Decide how Work Reports learns which validated quantities are invoiced"
    status: "todo"
    kind: "technical"
    complexity: "medium"
    concern: "interface-api"
    owner: "SR-001"
    affects: ["SR-001", "SR-002", "SR-004"]
    build_unit_disposition: "Realization mapping has not started."
    build_units: []
    cluster: "billable-quantities"
    question: "Work Reports promises to list only validated quantities that are not yet invoiced, but only Invoicing knows when an invoice takes them: should Invoicing tell Work Reports which quantities each issued invoice used, or should Invoicing itself provide the clerk's list of quantities still to bill?"
    context: "Office clerks pick quantities to bill from the Work reports listing of validated, not-yet-invoiced quantities. Invoicing issues invoices and already refuses quantities that are invoiced, so it is the authority on what has been billed, yet nothing carries that fact back to Work Reports. Example: invoice 41 bills Monday's tiling; unless Work Reports learns this, Monday's tiling stays on the clerk's list and only the preview refuses it. The behaviour is settled (nothing is billed twice; the clerk sees what is still billable); the open choice is which responsibility holds the invoiced mark."
    candidate_proof: "An implementer cannot finish or verify the validated, not-yet-invoiced quantities listing without choosing which responsibility records that a validated quantity has been invoiced and how the listing learns it, and the current package does not already choose it."
    options: ["Invoicing reports the quantities of each issued invoice to Work Reports through a new interaction on the Work reports interface; the listing keeps its promise, Invoicing stays authoritative and still refuses stale selections, and a delayed report only leaves an already billed line visible until the preview refuses it.", "Work Reports lists validated quantities only, and Invoicing offers the clerk's list of quantities still to bill through a new read on the Issued invoicing interface; the invoiced mark stays inside Billing and the Work reports listing loses its not-yet-invoiced promise."]
    recommendation: "Invoicing reports invoiced quantities back to Work Reports, because it keeps the approved Work reports listing unchanged while Invoicing's own refusal of already invoiced quantities continues to prevent double billing."
    resolution: null
    depends_on: []
    write_targets: ["system-model/contracts/interfaces/iface-001-work-reports.md", "system-model/contracts/interfaces/iface-002-issued-invoicing.md", "system-model/domains/operations/responsibilities/sr-001-work-reports.md", "system-model/domains/billing/responsibilities/sr-002-invoicing.md"]
```

`build/workflow/tickets/billing/sr-002/sr-002-tickets.yaml`. TICKET-0001 stays unchanged; append:

```yaml
  - id: "TICKET-0005"
    title: "Choose where invoice unit prices come from"
    status: "todo"
    kind: "product"
    complexity: "medium"
    concern: "data-model"
    owner: "SR-002"
    affects: ["SR-002", "SR-004"]
    build_unit_disposition: "Realization mapping has not started."
    build_units: []
    cluster: "invoicing"
    question: "Where does the unit price of each invoice line come from (a price per work item for everyone, a price per work item with customer-specific prices, or a price the clerk types while preparing the invoice), and in which currency?"
    context: "Invoicing previews and issues invoices whose lines are validated quantities times a unit price; the rounding question already assumes prices exist, but nothing says where they come from. Example: 12 m2 of tiling at 30.00 per m2 is a 360.00 line; the 30.00 might be fixed for all customers, agreed with this customer or typed by the clerk. The answer decides what price data must exist before a preview, who may change it, and whether two invoices can price the same work differently. Which options work depends on how quantities are recorded."
    candidate_proof: "An implementer cannot finish or verify the invoice preview and issued-invoice totals without choosing the source and currency of each line's unit price, and the current package does not already choose it."
    options: ["One price per work item for all customers, in one currency: simple and consistent, but negotiated customer prices are impossible.", "A price per work item with optional customer-specific prices, in one currency: matches negotiated pricing, at the cost of maintaining customer price data.", "The clerk enters each unit price while preparing the invoice: needs no price data, but prices are unchecked and can differ for the same work."]
    recommendation: "A price per work item with optional customer-specific prices in a single currency, assuming quantities reference predefined work items and some customers have negotiated prices; if quantities are free text, clerk-entered prices are the only workable option."
    resolution: null
    depends_on: ["TICKET-0002"]
    write_targets: ["system-model/domains/billing/responsibilities/sr-002-invoicing.md", "system-model/contracts/interfaces/iface-002-issued-invoicing.md"]
  - id: "TICKET-0006"
    title: "Decide how taxes apply to invoices for the tax register"
    status: "todo"
    kind: "product"
    complexity: "high"
    concern: "product-policy"
    owner: "SR-002"
    affects: ["SR-002", "SR-003", "SR-004"]
    build_unit_disposition: "Realization mapping has not started."
    build_units: []
    cluster: "invoicing"
    question: "Which tax applies to invoice lines, where do the rates come from, and which tax figures must an issued invoice record so the accountant can prepare the tax register?"
    context: "The accountant lists issued invoices for a period to prepare the tax register, but an invoice currently carries only lines and totals, with no tax base, rate or amount. Example: a 360.00 line at a 21% rate carries 75.60 of tax, and a register normally needs base and tax per rate. The rule decides what the preview shows, what the issued invoice keeps permanently and what accounting can derive. Tax rules depend on the jurisdiction, so the accountant's input is needed."
    candidate_proof: "An implementer cannot finish or verify issued-invoice totals and the accountant's period listing without choosing which tax applies, its rate source and the tax figures an issued invoice records, and the current package does not already choose it."
    options: ["A tax rate per line (from the work item, with a default), and the issued invoice records base, rate and tax amount per rate: supports mixed rates and gives the register what it needs.", "One tax rate per invoice, recorded with base and amount: simpler, but work with different rates cannot share an invoice.", "No tax on invoices in this version: the tax register then cannot be prepared from issued invoices, which defeats the accountant's journey."]
    recommendation: "A rate per line, with base, rate and tax amount recorded per rate on the issued invoice, because it covers mixed rates and gives the accountant every figure the register needs; confirm the applicable taxes and rates with the accountant."
    resolution: null
    depends_on: []
    write_targets: ["system-model/domains/billing/responsibilities/sr-002-invoicing.md", "system-model/contracts/interfaces/iface-002-issued-invoicing.md", "system-model/domains/billing/responsibilities/sr-003-accounting-registers.md"]
  - id: "TICKET-0007"
    title: "Define the customer invoice numbering series"
    status: "todo"
    kind: "product"
    complexity: "medium"
    concern: "data-model"
    owner: "SR-002"
    affects: ["SR-002", "SR-003", "SR-004"]
    build_unit_disposition: "Realization mapping has not started."
    build_units: []
    cluster: "invoicing"
    question: "Is 'the customer invoice series' one numbering sequence shared by all customer invoices or a separate sequence per customer, and does the numbering restart each year?"
    context: "Issuing assigns the next number in the customer invoice series and makes the invoice final, and the accountant's listing shows issued invoices in number order. Example: the clerk issues an invoice to customer A and then one to customer B; with one shared series they become 41 and 42, while with a series per customer both could be number 1 and number order no longer identifies an invoice. Issuance already guarantees that each invoice takes the next number and that a refused or failed issue uses none. Credit notes, deferred to a later version, will probably need their own series."
    candidate_proof: "An implementer cannot finish or verify invoice numbering on issuance and the number-ordered period listing without choosing whether the series is shared or per customer and whether it restarts each year, and the current package does not already choose it."
    options: ["One series for all customer invoices, consecutive and restarting each year with the year in the number (for example 2026-0041).", "One series for all customer invoices, consecutive and never restarting.", "One series per customer, each consecutive; numbers repeat across customers, so an invoice is identified by customer and number."]
    recommendation: "One series shared by all customer invoices, because the brief names a single customer invoice series and leaves room for a separate credit-note series later; restart it yearly only if the accountant confirms the tax rules expect that."
    resolution: null
    depends_on: []
    write_targets: ["system-model/domains/billing/responsibilities/sr-002-invoicing.md", "system-model/contracts/interfaces/iface-002-issued-invoicing.md"]
  - id: "TICKET-0009"
    title: "Decide whether a site's work can be billed only to its own customer"
    status: "todo"
    kind: "product"
    complexity: "low"
    concern: "product-policy"
    owner: "SR-002"
    affects: ["SR-001", "SR-002", "SR-004"]
    build_unit_disposition: "Realization mapping has not started."
    build_units: []
    cluster: "reference-data"
    question: "When the clerk chooses a customer and validated quantities, may they pick quantities from any site, or only from sites that belong to that customer?"
    context: "The clerk chooses a customer and then validated quantities, which are listed by site and period; nothing links a site to a customer. Example: the clerk selects customer A and by mistake picks quantities from a site that belongs to customer B; under a free rule the invoice is issued to A and, once final, cannot be corrected in this version because credit notes are deferred."
    candidate_proof: "An implementer cannot finish or verify the refusals of invoice preview and issuance without choosing whether quantities from a site may be billed to a customer other than the site's own, and the current package does not already choose it."
    options: ["Each site belongs to one customer and only its quantities can be billed to that customer: preview and issue refuse other quantities, and site records must carry their customer.", "Any validated quantities can be billed to any customer: more flexible (for example for subcontracted work), but a wrong pick is final once issued."]
    recommendation: "Each site belongs to one customer and only its quantities can be billed to that customer, because issued invoices cannot be corrected in this version."
    resolution: null
    depends_on: []
    write_targets: ["system-model/domains/billing/responsibilities/sr-002-invoicing.md", "system-model/contracts/interfaces/iface-002-issued-invoicing.md"]
```

`build/workflow/tickets/cross-domain-tickets.yaml` is new, with `scope: "cross-domain"` and owner `shared` on every ticket. No single responsibility owns customer/site records, identity, or the composition of the whole target. All three entries share these fields: `ticket_file_version: 4`, `status: "todo"`, `kind: "product"`, `complexity: "medium"`, `resolution: null`, `build_units: []`, `build_unit_disposition: "Realization mapping has not started."`.

```yaml
  - id: "TICKET-0008"
    title: "Decide where customers and construction sites come from"
    concern: "data-model"
    owner: "shared"
    affects: ["SR-001", "SR-002", "SR-004"]
    cluster: "reference-data"
    question: "Who maintains the customers the clerk invoices and the construction sites site managers report on: office staff inside this system, an existing company system this one reads, or a fixed list loaded when the system is set up for this version?"
    context: "Site managers submit reports for a site and the clerk chooses a customer when invoicing, but no part of the design owns customer or site records and none of the three journeys creates or edits them. Example: a new site opens on Monday; under the first option a clerk adds it here, under the second it appears once the company system has it, under the third someone outside the application updates the setup list. Whether a site must also record its customer depends on the site-to-customer billing rule."
    candidate_proof: "An implementer cannot finish or verify site selection when submitting a report and customer selection when issuing an invoice without choosing where customer and site records come from and who maintains them, and the current package does not already choose it."
    options: ["Maintained in this system by office staff: adds an administration capability no current responsibility owns, so a responsibility-map change would follow through a checkpoint.", "Read from an existing company system (for example a customer or ERP system): adds an external integration with its own availability and freshness rules, and no editing here.", "A fixed list loaded at setup for this version, with in-app maintenance recorded as out of scope: simplest, but every change needs someone outside the application."]
    recommendation: "Read them from the company's existing customer system if one exists, so customer data has a single owner; otherwise a fixed setup list for this version with maintenance recorded as out of scope. The brief gives no evidence either way."
    depends_on: ["TICKET-0009"]
    write_targets: ["system-model/architecture.md", "system-model/domains/operations/responsibilities/sr-001-work-reports.md", "system-model/domains/billing/responsibilities/sr-002-invoicing.md", "system-model/contracts/interfaces/iface-001-work-reports.md", "system-model/contracts/interfaces/iface-002-issued-invoicing.md"]
  - id: "TICKET-0010"
    title: "Decide how people sign in and receive their role and sites"
    concern: "authorization-keys"
    owner: "shared"
    affects: ["SR-001", "SR-002", "SR-003", "SR-004"]
    cluster: "access"
    question: "How do people sign in and become a site manager, office clerk or accountant, and may a site manager report only for the sites assigned to them?"
    context: "Every required journey depends on who is acting: only office clerks validate, return and issue; only accountants list issued invoices; site managers submit and correct reports. The interfaces check these roles, but nothing says how a person is identified or given a role, or which sites a site manager may report for. Today a returned report can be seen and resubmitted only by the site manager who submitted it; whether colleagues on the same site may also do so is part of this question."
    candidate_proof: "An implementer cannot finish or verify the role checks on report decisions, submissions, issuance and the accountant's listing without choosing how users are identified, how roles and site assignments are given and whether site managers are limited to assigned sites, and the current package does not already choose it."
    options: ["Sign in through the company's existing identity provider and take roles (and site assignments) from its groups: no user administration here, but the system depends on that provider.", "Accounts, roles and site assignments administered in this product by an administrator: adds an administration capability and a responsibility the current map lacks, through a checkpointed boundary change.", "Only fixed accounts in a non-production setup for this version, with real sign-in recorded as out of scope: only a demonstration claim is then possible."]
    recommendation: "Use the company's existing identity provider with role groups and limit site managers to their assigned sites, assuming such a provider exists; if it does not, administer accounts in this product."
    depends_on: []
    write_targets: ["system-model/architecture.md", "system-model/contracts/interfaces/iface-001-work-reports.md", "system-model/contracts/interfaces/iface-002-issued-invoicing.md", "system-model/domains/operations/responsibilities/sr-004-office-workspace.md"]
  - id: "TICKET-0011"
    title: "Choose the runtime profile and claim for the target version"
    concern: "integration-configuration"
    owner: "shared"
    affects: ["SR-001", "SR-002", "SR-003", "SR-004"]
    cluster: "target-outcome"
    question: "Where must the three journeys work for this version to count as done, and what does that cover: a non-production setup in which the three roles complete the journeys, a deployed production service, or design only?"
    context: "The brief defines three journeys but names no environment, starting point or acceptance outcome, and the design records none. Without one, nobody can say what to start, which sites, customers, prices and accounts must exist first, whether data can be reset, or what proves the journeys work. Example: a non-production setup starts the Office Workspace with seeded sites, customers, prices and three test accounts; a site manager submits, a clerk validates and issues, an accountant lists the invoice, and the data resets to the seed."
    candidate_proof: "An implementer cannot finish or verify the target version's acceptance outcome without choosing the runtime profile in which the three journeys must run and its claim level (runnable use, deployment or activated operation), and the current package does not already choose it."
    options: ["One non-production profile where the three roles complete all three journeys through the Office Workspace against seeded reference data, resettable to the seed; deployment and production activation stay later steps.", "That profile plus a deployable production profile in this version: production needs real sign-in, reference data and operations decided now.", "Design only for this version, with no runnable claim: nothing is proven to work end to end."]
    recommendation: "One resettable non-production profile in which the three roles complete all three journeys through the Office Workspace, because it is the smallest outcome that proves the journeys end to end; add a production profile only if this version must go live."
    depends_on: []
    write_targets: ["system-model/architecture.md", "system-model/behavior/flows/flow-001-work-report-validation.md", "system-model/behavior/flows/flow-002-invoice-issuance.md"]
```

Kind notes (temporary):
- 0004 chooses which responsibility holds the invoiced mark while the behaviour is fixed, so it is technical. Product does not control it because no promised outcome changes.
- All others choose promised behaviour (inputs, calculations, permissions, scope, claims), so they are product.
- 0010's sign-in mechanism is controlled by whether the product includes user administration and what roles may do, so it stays product.

**7.7 Overlap review (all active tickets, across domains).**

| Pair | Disposition |
| --- | --- |
| 0005 → 0002 | Linked. How quantities are recorded determines which price sources are possible |
| 0008 → 0009 | Linked. The billing rule determines whether site records must carry their customer |
| 0001 / 0006 | Independent. Line rounding and the tax rule are answerable separately; 0006 may adopt 0001's rounding point |
| 0001 / 0005 | Independent |
| 0008 / 0010 | Independent. Site assignment lives entirely in 0010 |
| 0010 / 0011 | Independent. The setup accounts follow 0010's answer |
| 0002 / 0003, 0004 / 0009, 0006 / 0007 | Independent |

No duplicates, so nothing is archived.

### 8. Message to the user (verbatim)

> **Stage 7 ticket inventory (7B–7D) for the three required journeys — result: `NEEDS_BOUNDARY_DECISION`.** Everything except one Accounting Registers boundary has reached zero delta. That boundary needs your choice (question at the end), so I am not reporting the inventory complete.
>
> **What the checks could not see.** The structure and ticket validators pass and the lead report finds no unresolved wording. None of them can find an operation that no contract declares, so I traced each journey to the operations it needs:
> - **Journey 1 had no starting command.** Nothing let a site manager submit a daily work report, or resubmit one after correcting it. Nothing let a clerk find and open a submitted report, and nothing showed a site manager the reason for a return. The clerk's validate-or-return action also had no field for the written reason.
> - **Journey 2 had no issue command.** Its "issued invoice published" event describes the result and its preview is a simulation that stores nothing; neither issues anything.
> - **Journey 3's period listing could not select by period**, because invoices recorded no date.
>
> Approved behaviour already settles all of these, so I repaired them in the contracts instead of opening tickets.
>
> **What I changed**
> - **Work reports interface** (`system-model/contracts/interfaces/iface-001-work-reports.md`): the validate-or-return action now requires and returns the written reason. Added one submit-or-resubmit action and one review read for clerks and site managers. The validated-quantities listing is unchanged.
> - **Issued invoicing interface** (`system-model/contracts/interfaces/iface-002-issued-invoicing.md`): added the issue action (high risk, all-or-nothing, the next number, no second invoice on retry) and the invoice issue date. The period listing now selects by issue date. The preview now names its refusals.
> - **Work report validation flow** (`system-model/behavior/flows/flow-001-work-report-validation.md`): submission is now an explicit step, and resubmission belongs to Work Reports instead of the Office Workspace.
> - **Invoice issuance flow** (`system-model/behavior/flows/flow-002-invoice-issuance.md`): issuing creates the invoice final ("draft" removed, because no draft is ever stored).
> - **Scope boundaries** (`system-model/contracts/scope/scope-001…003`): the brief's three exclusions now have canonical owners. Most importantly, credit notes are deferred, so an issued invoice cannot be corrected in this version.
> - **Navigation and new tickets**: `system-model/architecture.md` (scope links), `README.md`, a new compact `build/README.md` and the regenerated `build/workflow/decision-overview.md`. 10 new tickets in `build/workflow/tickets/operations/sr-001/sr-001-tickets.yaml`, `build/workflow/tickets/billing/sr-002/sr-002-tickets.yaml` and `build/workflow/tickets/cross-domain-tickets.yaml`.
>
> **Choices I made (Agent-chosen, recorded where they live):**
> - one action covers both submitting and resubmitting a report (Work reports interface);
> - a resubmission corrects the returned report's quantities and keeps its site and date (Work reports interface);
> - site managers see and resubmit only the reports they submitted, and clerks see all reports (Work reports interface);
> - issuing creates the invoice directly as final, and a failed issue consumes no number (Issued invoicing interface);
> - invoices record an issue date, and the accountant's period listing uses it (Issued invoicing interface);
> - the issue action is high risk (Issued invoicing interface).
>
> I recorded the three exclusions as Unknown origin. The brief says the product owner approved them, but nothing records who chose them.
>
> **Coverage receipt (snapshot: the three required journeys, current package plus these repairs)**
> - Work Reports: gained TICKET-0002 (what a quantity records), 0003 (one report per site per day), 0004 (who records that quantities were invoiced); its contract gaps are repaired.
> - Invoicing: kept TICKET-0001 (rounding) as sufficient; gained 0005 (unit prices and currency), 0006 (taxes), 0007 (numbering series), 0009 (site-to-customer billing rule); its contract gaps are repaired.
> - Accounting Registers: **paused** at the listing-ownership boundary below. It is also affected by 0006, 0010 and 0011.
> - Office Workspace: no material question it owns. It is affected by the shared tickets 0008 (customer and site source), 0010 (sign-in, roles, site assignment) and 0011 (runtime profile and claim). Its presentation belongs to the Stage 7 UI/UX specification, which does not exist yet.
> - All ten lenses for each responsibility, all journey operations (6 + 5 + 1), the target-outcome and runtime-profile census, every direct handoff, and every applicable consumer challenge have a concrete disposition. The only `paused:` dispositions are the Accounting Registers branch.
> - Contract gaps: submit/resubmit, review read, return reason, issue command and invoice issue date are all repaired. The flow ownership and stale-draft inconsistencies are reconciled.
> - Tickets: 11 `todo`, 0 `deferred`, 0 `decided`, 0 `finished`, 0 `out-of-scope`.
> - Owners: Work Reports 3, Invoicing 5, Accounting Registers 0, Office Workspace 0, shared 3.
> - Clusters: work-report-content 2, billable-quantities 1, invoicing 4, reference-data 2, access 1, target-outcome 1.
> - Genuine dependencies: unit prices depend on how quantities are recorded (0005→0002); where customers and sites come from depends on the site-to-customer billing rule (0008→0009). Every other related pair was checked and is answerable independently. No duplicates.
> - Exclusions: email/post delivery, invoice layout customisation, credit notes (deferred, revisit when that version is scoped).
> - **Zero-delta pass.** I traced the repaired interfaces and flows and the new tickets through every producer and consumer, across all four responsibilities, and re-challenged the new actions from the consumer side. This produced no further finding. No earlier coverage existed to retain, because this is the first full pass. A whole-scope repeat is not needed: the repairs did not destabilise the responsibility or handoff map outside the paused branch.
> - **Validators.** I run the structure, ticket and constraint validators, the lead report and the decision-overview check after these writes. They prove structure and links only, not that the backlog is complete.
>
> **Not part of this pass:**
> - The Office Workspace is a human-facing surface, so Stage 7 also needs the UI/UX specification and a reviewed prototype. Neither exists, so I make no Stage 7 UI completion claim.
> - The responsibility records contain only a Purpose. The format also expects Owns, Must Not Own, an Inputs and Outputs table linking these actions, failure and recovery, and invariants. The domain records lack boundaries, and the flows lack Outcomes and Invariants. The validator does not enforce these sections. Reconciling them is the rest of the Stage 7 model pass, and I can do it next.
> - Main Software Design is not complete yet. The 11 open tickets do not block that claim, but this boundary, the UI work and the record reconciliation do.
>
> **One decision needed: who serves the accountant's period listing?**
> Accounting Registers is defined as owning "the tax-register listings derived from issued invoices". It receives every issued invoice, redelivered until it acknowledges, yet nothing in the design reads what it keeps. Meanwhile the accountant's journey ("list issued invoices for a period to prepare the tax register") is served directly by Invoicing, so the same need has two plausible owners.
>
> Example: invoice 42 is issued at 17:00 and its delivery to Accounting Registers is delayed. If Invoicing serves the listing, the accountant sees 42 at once. If Accounting Registers serves it, 42 appears once Accounting Registers has recorded it.
>
> - **A — Accounting Registers serves the listing (recommended).** It answers from the register entries it records. Invoicing's period read becomes Accounting Registers' catch-up read for anything it missed, and a new Accounting Registers → Office Workspace read serves accountants. The listing may lag issuance briefly.
> - **B — Invoicing keeps serving the listing.** Accounting Registers' own register listing has no consumer in this version, so it is recorded as deferred. Accounting Registers only receives invoices, or leaves the target version, which is a responsibility-map change.
>
> I recommend A. The architecture says issued invoices "cross to accounting", Accounting Registers already owns the tax-register listings and receives every invoice, and the brief says the accountant "keeps the tax registers". It assumes a short delay between issuing and listing is acceptable.
>
> *Route:* this pauses only the Accounting Registers branch of the Stage 7 inventory. Journeys 1 and 2 and the repairs above are unaffected. *Expected Recording Plan:* amends Software Design only:
> - the Issued invoicing interface;
> - a new Accounting Registers interface (A) or a scope record (B);
> - the Accounting Registers record;
> - the invoice issuance flow.
>
> Then I rerun the affected impact review.
>
> **Should Accounting Registers (A) or Invoicing (B) serve the accountant's period listing?**

### 9. Validation after the writes (real session)

```sh
node skill/scripts/validate-software-design-structure.mjs --root fixture/design/software-design
node skill/scripts/validate-implementation-detail-tickets.mjs --root fixture/design/software-design
node skill/scripts/validate-technical-constraints.mjs --root fixture/design/software-design
node skill/scripts/report-ticket-inventory-leads.mjs --root fixture/design/software-design
node skill/scripts/generate-decision-overview.mjs --root fixture/design/software-design
node skill/scripts/generate-decision-overview.mjs --root fixture/design/software-design --check
```

The completion report stands only if all six pass. Expected lead-report counts: Work Reports 3, Invoicing 5, Accounting Registers 0 (paused), Office Workspace 0 (dispositioned). No UI/UX validator applies because `ui-ux/` does not exist.

### 10. Completion result

**`NEEDS_BOUNDARY_DECISION`.** The inventory is partial for the reviewed snapshot. The only blocker is the Accounting Registers listing-ownership decision (§6/§8). It blocks the Accounting Registers lens and handoff dispositions and the producer of journey 3's listing, and nothing else.

It is not `TICKET_INVENTORY_COMPLETE`, because one ownership overlap is unresolved. The fixture as it stands on disk, with no writes in this evaluation, is **`TICKET_INVENTORY_PARTIAL`**: the two missing starting commands and the other contract gaps remain unrepaired until §7 is applied. Passing validators do not change either result.

---

## Scenario 6

**Journey 1 against the existing Work reports actions (same pass as Scenario 5).** The journey needs six operations. I cover them with the two existing actions (one widened, one reused as is) plus two new actions, not one action per screen control.

| Journey 1 operation | Action | Treatment |
| --- | --- | --- |
| Site manager submits a daily report | `IFACE-001.ACT-003` Submit or resubmit | **Add.** It is the starting command, and no contract declared it |
| Clerk finds submitted reports and opens one with its quantities | `IFACE-001.ACT-004` Work reports for review | **Add** (one read) |
| Clerk validates, or returns with a written reason | `IFACE-001.ACT-001` | **Reuse and widen** |
| Site manager sees the returned report and its reason | `IFACE-001.ACT-004` | Same new read. No extra action |
| Site manager corrects and resubmits | `IFACE-001.ACT-003` | Same new command (resubmission branch). No separate "resubmit" action |
| Validated quantities become billable | `IFACE-001.ACT-002` | **Reuse unchanged** |

**ACT-001 (validate or return): reuse it and widen it.**
- **Reused:** it remains the single decision action behind both the Validate and Return controls. The actor (office clerks only), the precondition (submitted only), the state changes (submitted → validated or returned) and the "deciding twice is rejected" rule all stay as they are.
- **Widened.** The journey and FLOW-001 require a return "with a written reason" that the site manager later sees, but ACT-001 accepted only the identifier and the decision:
  - the input becomes `validate`, or `return` with a non-empty written reason;
  - the output carries the reason;
  - the failure meanings now distinguish not found, forbidden (not an office clerk), not `submitted` (already decided, with the current state stated) and a return without a reason;
  - recovery after a lost response is a re-read through ACT-004;
  - the verification intent adds "a return without a reason is rejected" and "the reason reaches the site manager";
  - the payload adds the submitting site manager and the latest return reason;
  - Preconditions add "a return requires a written reason".
- **Not widened to cover submission.** Submission has a different actor (site manager), a different permission, different input (site, date, quantities) and a different transition (none or returned → submitted). Folding it into ACT-001 would replace "Office clerks only" with per-branch permission rules. A site manager could then reach the decision action, or a clerk the submit action. It would also mix two verification intents.

**ACT-002 (validated quantities for a period): reuse it unchanged.**
- It is exactly the journey's last step ("validated quantities become billable") and the selection input for journey 2. Its text is not changed.
- **Not widened into the review read.** Its consumers include Invoicing, and it guarantees that only validated, not-yet-invoiced quantities appear. Serving submitted or returned reports through it would hand unvalidated quantities to Invoicing, break that guarantee, and require site-manager access to a billing read. The review read has its own consumers (clerks, site managers) and its own verification intent, so it is a separate action.
- One gap sits on ACT-002 but not on journey 1: how Work Reports learns that a quantity has been invoiced. That is TICKET-0004 (technical, owned by Work Reports). Its recommended answer keeps ACT-002 unchanged.

**What I add: two actions, no more.**
- **ACT-003 — Submit or resubmit a work report** (`callable`, site managers). First submission takes site, date and quantities. Resubmission takes the returned report's identifier and corrected quantities, keeps the identifier, site and date, and only the submitting site manager may resubmit. It rejects a report that is not `returned` and never makes quantities billable. Duplicate and lost-response submissions are left to TICKET-0003 instead of being invented here.
- **ACT-004 — Work reports for review** (`state-observation`). Office clerks see every report; site managers see only reports they submitted, including a returned report's reason. It supports empty, not-found and forbidden results, and reading changes nothing. One read serves the clerk's queue, opening a report, the site manager's returned-report view, and recovery re-reads for both actors.

**Supporting edits in the same pass:**
- In FLOW-001, submission becomes an explicit Work Reports step (none → submitted).
- The old step 3 is split. The Office Workspace now only shows the returned report and reason through ACT-004, and Work Reports performs `returned → submitted` through ACT-003. Before, the Office Workspace, which holds no report authority, owned that state change.
- Failure And Reroute adds the reason and resubmission rules.
- The meaningful choices are recorded as Agent-chosen in IFACE-001's `## Decision Attribution`:
  - one action for submit and resubmit;
  - correction keeps the site and date;
  - site managers see only their own reports, and clerks see all.
- Wider site-based access for site managers is left to TICKET-0010.

**Ledger result for journey 1.** All six operations are dispositioned `answered`:
- four by the two new actions (submit and resubmit through ACT-003; open-for-decision and returned-reason through ACT-004);
- one by the widened ACT-001;
- one by the unchanged ACT-002.

Two tickets cover the remaining material choices that approved behaviour does not settle: TICKET-0003 (duplicate and retried submission) and TICKET-0004 (where the invoiced mark lives). No action was created per button, and no consumer guarantee of the existing actions was weakened.

---

<!-- trial file responses-R.md -->

### Responses R: Software Design skill, Scenarios 7 to 10

Paths below are package-relative to the canonical package (`<repository-root>/design/software-design/`). The scenarios do not give real record IDs or slugs, so I use placeholders such as `SR-xxx`, `<slug>` and `TICKET-NNNN`. Each scenario lists the references a real run reads, the actions I take, the verbatim message to the user, and the report.

## Scenario 7

### References read for this moment

- `SKILL.md`. Routes this to "Create, repair, or continue the staged blueprint" (an approved Stage 5 contract pass), plus Consequential Ambiguity and Decision Attribution.
- `references/package-layout.md`, `references/system-model-format.md` (Interface `IFACE-xxx` and `Material Interactions`), `references/staged-design-workflow.md` (Stage 5).
- `references/checkpoint-workflow.md`. Active Section Passes, Approval Semantics, and **Before Asking**.
- `references/decision-attribution.md`. Interpreting Approval ("Handle it; I trust you" → Agent-chosen), "Discretion never lowers a requirement", Recording (decisions without a ticket), Handback, Decision Overview.
- `references/implementation-detail-tickets.md`. Used to confirm that no ticket is warranted.
- `assets/templates/system-model/contracts/interface.md`. Gives the required ACT fields.

### Assessment (Before Asking)

1. **Investigate first.** I check the approved booking-list journey, the bookings System Responsibility, the flows that use `IFACE-006`, any UI/UX specification rows for the bookings list, existing tickets, and the user's standing instruction. The only settled fact that bears on these three points is the journey requirement "the customer sees their upcoming bookings first". Nothing settles the page size or the meaning of an empty list.
2. **Use the authority I have.** The user delegated "the routine details". All three open points are routine and reversible details of an already-approved contract. None changes security exposure, cost, stored or shared data, or who holds authority. Each preserves the approved journey requirement:
   - **Sort order.** It must satisfy "upcoming first", and does. Discretion covers *how* to meet that requirement and never weakens it.
   - **Page size.** A routine paging detail.
   - **Empty list vs. not-found.** An empty success for a customer with no bookings matches the template's distinction between empty/not-found and forbidden. It discloses nothing and leaves the approved access rule unchanged.
   I decide all three, record each as **Agent-chosen**, and continue.
3. **Ask only what remains.** Nothing remains, so I ask no question. No ticket is created: these are not unresolved questions, and the attribution rules forbid a retrospective ticket created only to hold attribution.

### Actions (files and changes)

1. **`system-model/contracts/interfaces/iface-006-<slug>.md`.** Complete `### ACT-002 — List a customer's bookings`:
   - **Kind:** `callable`.
   - **Trigger or entry:** the customer opens their bookings list, or requests the next page.
   - **Input:** the caller's authenticated customer identity, as the approved access rule already states. For later pages, add the opaque continuation token returned by the previous page. The consumer does not choose the page size.
   - **Output or observable result:** one page of at most 20 of the customer's bookings, plus a continuation token only while more bookings remain. Order:
     - Upcoming bookings first. "Upcoming" means the booked time has not yet ended. They appear soonest first.
     - Then past bookings, most recent first.
     - Ties break by booking identifier.
     - "Now" is the producer's time at the first-page request. The continuation token carries it, so later pages do not reshuffle as time passes.
   - **Access or authority:** unchanged from the approved rule.
   - **Failure and recovery:**
     - A customer with no bookings gets a successful empty list with no continuation token. This is never not-found.
     - An unreadable or no-longer-valid continuation token is rejected with a meaning that tells the consumer to restart from the first page. No partial page is returned.
     - Forbidden and unavailable keep their approved meanings.
   - **Risk:** `ordinary`.
   - **Verification intent:**
     - Upcoming-first ordering holds across a page boundary.
     - The empty list returns success.
     - An invalid token is rejected and recovery from the first page works.

   In the same file, add or extend `## Decision Attribution`:

   ```markdown
   ## Decision Attribution

   | Decision | Origin | Evidence | Conditions |
   | --- | --- | --- | --- |
   | The booking list (`IFACE-006.ACT-002`) returns upcoming bookings first (booked time not yet ended, soonest first), then past bookings (most recent first); ties break by booking identifier, and the ordering instant is fixed at the first-page request and carried in the continuation token. | Agent-chosen | Chosen on 2026-11-05 while writing `IFACE-006.ACT-002` in the approved contract pass, under the user's instruction in this session: "Decide the routine details yourself and record them as Agent-chosen; only bring me real product decisions." Implements the approved journey requirement that the customer sees their upcoming bookings first, which stays attributed in its own owner (<link to the journey's canonical owner>). | None |
   | The booking list returns 20 bookings per page; further pages use the opaque continuation token returned while more bookings remain; consumers cannot choose the page size in this version; an unreadable or no-longer-valid token is rejected and the consumer restarts from the first page. | Agent-chosen | Chosen on 2026-11-05 while writing `IFACE-006.ACT-002`, under the same delegation; a routine paging detail that changes no stored data, authority, cost, or exposure. | None |
   | A customer with no bookings receives a successful empty list with no continuation token, never a not-found error; not-found and forbidden keep their approved access meanings. | Agent-chosen | Chosen on 2026-11-05 while writing `IFACE-006.ACT-002`, under the same delegation; follows the interface contract's distinction between empty, not-found, and forbidden and discloses nothing. | None |
   ```

2. **Owning bookings System Responsibility (`system-model/domains/<domain>/responsibilities/sr-xxx-<bookings>.md`).** Only if it is not already there: in `Inputs And Outputs`, the booking-list output's consumer need (first acquisition, refresh from the first page, empty meaning, recovery) links `IFACE-006.ACT-002`. No other edits.
3. **System Guide (`guide/domains/<domain>.md`).** This applies only if a passage already describes the bookings list's order or empty case: I align it with the contract. If it names the origin, it describes it as "Agent-chosen (IFACE-006)" and never as approved. No other edits.
4. **UI/UX specification.** This applies only if `ui-ux/specification.md` already covers the bookings list: I align its ordering and empty-state requirement. If an initial reviewed prototype already exists, I add a `Change Synchronization` row instead of editing the prototype.
5. **Validation.** Run:
   - `node <skill-dir>/scripts/validate-software-design-structure.mjs --root <package>`
   - `node <skill-dir>/scripts/generate-decision-overview.mjs --root <package>`
   - `node <skill-dir>/scripts/generate-decision-overview.mjs --root <package> --check`

   I fix and rerun anything that fails before reporting. The message below assumes both checks pass.

### Message to the user (verbatim, in-pass update; no question)

> Booking list contract (`IFACE-006.ACT-002`) is written. Three routine details were open. As you asked, I decided them myself and recorded them as Agent-chosen in the contract's Decision Attribution section:
>
> - **Order:** upcoming bookings first, soonest first, then past bookings, most recent first. This follows the approved journey ("the customer sees their upcoming bookings first"). The exact ordering inside each group is my choice.
> - **Page size:** 20 bookings per page, with a continuation token for the next page. If a token is no longer valid, the app starts again from the first page.
> - **No bookings:** a customer with no bookings gets an empty list, not a not-found error, so the app can show its normal empty state.
>
> None of these needed a decision from you. Structure validation passes and the decision overview is regenerated. I'm continuing with the rest of the contract pass.

### Report (carried into the end-of-pass summary)

- **Package:** `<repository-root>/design/software-design/`.
- **Files changed:**
  - `system-model/contracts/interfaces/iface-006-<slug>.md` (ACT-002 completed; Decision Attribution added)
  - The bookings SR's `Inputs And Outputs` link, if it was missing
  - The affected guide passage, if there was one
  - `build/workflow/decision-overview.md` (regenerated)
- **Agent-chosen decisions recorded this pass**, all owned by `IFACE-006` (`## Decision Attribution`):
  1. Upcoming-first ordering details
  2. Page size 20, with continuation-token recovery
  3. Empty list returns success, not not-found
- **New tickets:** none. **Source conflicts:** none. The approved "upcoming first" requirement is preserved, not weakened.

## Scenario 8

### References read for this moment

- `SKILL.md`. Routes this to "Design a human-facing application or operator surface", plus the staged reference for the active work, Consequential Ambiguity, and Decision Attribution.
- `references/ui-ux-design.md`, `references/ui-ux/README.md`, `references/ui-ux/design-workflow.md`, `references/ui-ux/templates/specification.md`.
- `references/staged-design-workflow.md` (Stages 1–7: material interface questions; questions may stay open for prototype exploration). `references/checkpoint-workflow.md`, Before Asking, which uses this exact distinction: "Choosing a map library for an approved map is yours; storing locations, letting users place them, and sending addresses to an external geocoding service is the user's".
- `references/implementation-detail-tickets.md` (ticket shape, Assigning Ticket Kind, candidate proof) and `assets/templates/build/responsibility-tickets.yaml`.
- `references/decision-attribution.md` (recording the Agent-chosen library choice; Handback).

### Assessment (Before Asking)

1. **Investigate first.** The brief says only "the site details screen shows where each site is". No canonical owner, ticket, or standing instruction settles what a location is or where it comes from. Name, contact and schedule are settled.
2. **Use the authority I have.** **Map display library: mine.** A display library adds no stored data, no user interaction and no external recipient, so it falls inside the delegation. One nuance: a map is not yet approved, because whether the screen shows a map depends on how locations are recorded. So I make the library choice now, scoped "where the screen shows a map", record it as **Agent-chosen**, and do not ask about it.
3. **Ask only what remains.** **How locations are stored and obtained: the user's.** This is material by consequence, not by label:
   - Coordinates add stored data.
   - Pin placement adds a site-manager interaction.
   - Geocoding sends customers' work-site addresses to an outside company and costs money per request.

   This is beyond "routine details". It is a real product decision with a data-disclosure and security consequence, so I put it to the user as one focused question with a recommendation.
4. **Make the question concrete, and keep working on what it does not affect.** That means name, contact, schedule, layout and states of the site details screen.

Possible downstream effect, labelled as conditional: any map needs background imagery. Where that comes from may involve another outside recipient (which map areas are viewed) and cost. It only arises under the pin or geocoding options, so I flag it as a later follow-up rather than adding it to this question.

Kind review note, kept in my temporary notes rather than in the ticket: "This ticket chooses what location data is stored for each site, who supplies it, and whether customers' work-site addresses are disclosed to an outside service. The requirement 'shows where each site is' is fixed, but its meaning remains open. Therefore kind is `product`. `technical` does not control, because the choice changes stored data, a user workflow and data disclosure, not only the realization mechanism."

### Actions (files and changes)

1. **Create the ticket** in the site-records responsibility's file, `build/workflow/tickets/<domain>/sr-xxx/sr-xxx-tickets.yaml`, using the next free ID (shown as `TICKET-NNNN`):

   ```yaml
     - id: "TICKET-NNNN"
       title: "Choose how each site's location is recorded"
       status: "todo"
       kind: "product"
       complexity: "medium"
       concern: "data-model"
       owner: "SR-xxx"
       affects: ["SR-xxx"]
       build_units: []
       build_unit_disposition: "Realization mapping has not started."
       repositories: []
       repository_contract_area: null
       cluster: "site-details"
       question: "How should each site's location be recorded so the site details screen can show where the site is: as address text only, as coordinates the site manager sets by placing a pin on a map, or as coordinates obtained by sending the address to an external geocoding service?"
       context: "The approved brief says the site details screen shows where each site is; the screen's other content (name, contact, schedule) is settled. Nothing settles what a site's location is or where it comes from. Site managers create and edit sites, and the addresses are customers' work sites. The alternatives differ in what is stored, whether site managers gain a pin-placing step, and whether customers' work-site addresses are sent to an outside company that charges per lookup."
       current_shape: null
       candidate_proof: "An implementer cannot finish or verify the location shown on the site details screen without choosing whether a site's location is stored as address text, as manager-placed coordinates, or as coordinates geocoded by an external service, and the current package does not already choose it."
       options: ["Address text only: the site manager types the address and the screen shows it as text. No map, nothing new stored beyond the address, no outside recipient and no per-use charges; an imprecise address stays imprecise.", "Pin placed by the site manager: the site manager places a pin when creating or editing a site, coordinates are stored, and the screen shows the site on a map. No address leaves the system and nothing is charged per use; site managers gain one step, and a site without a pin shows no map until one is placed.", "Coordinates from an external geocoding service: each address is sent to an outside company that returns coordinates for a map. No extra step for site managers, but every lookup is charged, customers' work-site addresses are disclosed to that company (which may require an agreement with it and notice to customers, depending on contracts and jurisdiction), and failed or wrong matches need a correction path."]
       recommendation: "Pin placed by the site manager. It shows exactly where each site is without disclosing customers' work-site addresses or incurring per-lookup charges. Assumes site managers know where their sites are and can place a pin when they set one up. If a map is shown (pin or geocoding), where its background imagery comes from is a separate follow-up choice."
       resolution: null
       result_refs: []
       constraint_refs: []
       depends_on: []
       blocked_by: []
       write_targets: ["system-model/domains/<domain>/responsibilities/sr-xxx-<site-records>.md", "ui-ux/specification.md"]
   ```

   If the geocoding option is chosen, the security contract that owns customer-data disclosure is added to `write_targets` when the answer is recorded. Then run `node <skill-dir>/scripts/validate-implementation-detail-tickets.mjs --root <package>`.

2. **`ui-ux/specification.md`.**
   - Specify the site details screen's settled content: name, contact, schedule, layout, and loading, error and empty states.
   - Mark the location area **pending TICKET-NNNN**. Because an unanswered material UI decision leaves the affected scope incomplete, set Required prototype coverage to `Incomplete — site details location pending TICKET-NNNN`.
   - Add a `## Decision Attribution` row:

   ```markdown
   | Where the site details screen shows a map, the prototype and product use the open-source Leaflet library (1.9.4); the prototype vendors it locally with a bundled stand-in map image so it still opens from disk without a network. | Agent-chosen | Chosen on 2026-11-05 while designing the site details screen, under the user's instruction in this session: "Decide the routine details yourself and record them as Agent-chosen; only bring me real product decisions." A display library adds no stored data, user interaction, or outside recipient. Whether a map is shown depends on TICKET-NNNN; the background-imagery source is not chosen here. | None |
   ```

3. **Prototype (active Stage 7 exploration).**
   - Build the site details screen's name, contact and schedule in each active alternative.
   - Show the location region as a visibly labelled pending area. I do not present any location option as approved behavior, and I don't add a map until the answer makes one part of the screen.
   - Inspect the rendered result by opening `ui-ux/index.html` directly from disk. If rendering is blocked, I record that limitation and claim no visual check.
4. **Validation.** Run `validate-ui-ux-design.mjs`, then `generate-decision-overview.mjs` and its `--check`.

### Message to the user (verbatim)

> One decision about the site details screen needs you. I'm handling everything else there.
>
> **How should each site's location be recorded?** (tracked as TICKET-NNNN)
>
> The brief says the site details screen "shows where each site is", but nothing settles what that location is or where it comes from. This is your call rather than a routine detail. Each option changes what we store, what site managers have to do, and whether your customers' work-site addresses leave the system.
>
> - **A. Address text only.** The site manager types the address, and the screen shows it as text.
>   - No map, nothing new stored, no outside service.
>   - People need to know the area to find the site, and an imprecise address (say, a new site with no street number yet) stays imprecise.
> - **B. Pin placed by the site manager.** When creating or editing a site, the site manager places a pin on a map. We store those coordinates and the screen shows the site on a map.
>   - No addresses are sent anywhere, and nothing is charged per use.
>   - It adds one step for site managers, and a site without a pin shows no map until one is placed.
> - **C. Coordinates looked up by an outside geocoding service.** The site manager types an address, we send it to a geocoding company to get coordinates, and we show a map.
>   - No extra step for site managers, but every lookup is charged.
>   - Your customers' work-site addresses go to that company. Depending on your contracts and where you operate, that may require an agreement with the company and telling customers.
>   - Lookups can fail or land on the wrong spot, so we'd also need a way to correct them.
>
> **My recommendation: B.** It shows exactly where each site is, without sending customer addresses to anyone and without per-lookup charges. It assumes site managers know where their sites are and can place a pin when they set a site up. Tell me if that isn't true.
>
> **Follow-up only if you pick B or C:** a map also needs background map imagery. That can come from hosting it ourselves or from a map company, which would see which areas are viewed and may charge. That's a separate choice I'd bring you with a recommendation. It doesn't change this answer.
>
> **Not asking you:** the map display library is mine to pick. If the screen shows a map, it will use Leaflet, an open-source library that doesn't tie us to any paid map provider. I've recorded that as Agent-chosen.
>
> Meanwhile I'm finishing the rest of site details (name, contact, schedule) and leaving the location area marked as waiting for this answer.

### Report

- **Files changed:**
  - `build/workflow/tickets/<domain>/sr-xxx/sr-xxx-tickets.yaml` (new `TICKET-NNNN`, `todo`, `product`)
  - `ui-ux/specification.md` (site details requirements; location pending; Decision Attribution row)
  - The affected prototype pages in each active alternative
  - `build/workflow/decision-overview.md` (regenerated)
- **Agent-chosen this pass:** Leaflet as the map display library wherever the site details screen shows a map. Owner: `ui-ux/specification.md`, `## Decision Attribution`.
- **Unresolved:** `TICKET-NNNN` (`todo`, kind `product`), location recording and disclosure. The site details scope stays **Incomplete** for its location area until it is answered and synchronized. If the answer is pin or geocoding, a conditional follow-up about the map imagery source follows.
- **Not claimed:** no reconciled or complete site details design and no visual verification unless rendered inspection actually ran.

## Scenario 9

### References read for this moment

- `SKILL.md`: Build Design And Delivery Readiness, plus "Report a blocker…" and "Before waiting on another agent or session…" in Validation And Delivery.
- `references/planning-execution-contract.md`. Applied before any readiness decision: planned upstream outputs need an earlier, settled READY/PARTIAL producer handoff.
- `references/package-layout.md`, `references/build-design-and-delivery-readiness.md` (repository discovery preflight, delivery-slice realizability challenge, Stage 9 outcomes, handoff sequence), and `references/maintainability-and-agent-guidance-baseline.md` (first-party repository lanes in the preflight).
- `assets/templates/build/handoff-sequence.md` and `assets/templates/build/delivery-planning-handoff.md`.
- `references/ui-ux-design.md` and `references/ui-ux/design-workflow.md`, because `web-checkout` is human-facing and its prototype screens are unfinished.
- `references/implementation-detail-tickets.md` (TICKET-0031 mapping and presentation) and `references/checkpoint-workflow.md` (Before Asking).

### Assessment

**TICKET-0031 (`todo`) decides the currency rounding rule in `IFACE-003`.** A `todo` ticket blocks readiness. `IFACE-003` is a shared pricing contract, and its target-version surface must be closed before its producer is executable. TICKET-0031 can change that surface. Dependency paths:
- TICKET-0031 → `IFACE-003` rounding → **payments-api** produces `IFACE-003` → blocked.
- TICKET-0031 → `IFACE-003` rounding → **web-checkout** consumes and displays `IFACE-003` amounts → blocked.

**INPUT-004 is missing.** It is the provider's settlement-file specification, and the user said it is in `docs/provider/`, but that folder is empty. It sits in **payments-api**'s Required Input Ledger only. Availability is `missing` until located. This is a missing document, so I locate it or ask for it; I don't ask for approval.

**web-checkout also depends on payments-api.** It consumes payments-api's `IFACE-003` output. That is a planned upstream output, which needs payments-api's handoff with a settled READY/PARTIAL planning outcome as an earlier direct `Requires` edge. So web-checkout cannot be fully planned until payments-api's handoff exists, even after TICKET-0031 is decided.

**The checkout prototype's ownership is stale.** The notes say the checkout-prototype session owns the remaining checkout prototype screens. The session list shows it archived on 2026-10-29 with no changes after 2026-10-20, so it does not currently own the work. That work is inside the prototype pass the user already authorized for me. I continue it myself, without waiting and without asking. Until those screens are complete and reviewed, web-checkout has no reviewed walkthrough for its selected UI scope, which is a second, independent web-checkout blocker.

**reporting-export is independent.** It consumes only `IFACE-005` and has no path to `IFACE-003` or INPUT-004, so neither blocker reaches it. It still has to pass its own repository discovery preflight and realizability challenge before I call it ready. The message below assumes those checks pass; if any fails, I report that exact blocker instead and write no handoff.

### Actions (files and changes)

1. **Checkout prototype (continue under existing authority).**
   - Inspect what the archived session produced up to 2026-10-20, plus the specification's coverage and pending rows, and build on it.
   - Finish the remaining checkout screens in the selected candidate, and in any active alternatives the specification keeps comparable.
   - Where a displayed amount depends on the rounding rule, label it pending TICKET-0031 rather than inventing a rule.
   - Inspect the rendered prototype by opening `ui-ux/index.html` from disk. If rendering is blocked, record the limitation and claim no visual verification.
   - Update `ui-ux/specification.md` coverage and review rows, and correct the stale "checkout-prototype session owns…" note where it lives so no one waits on an archived session.
   - Run `validate-ui-ux-design.mjs`.
2. **INPUT-004: locate first.**
   - Confirm `docs/provider/` is empty.
   - Search the repository for the settlement-file specification by name and content.
   - Check version-control history for `docs/provider/` (a moved or removed file).
   - If found, use it: record its identity in the payments-api input analysis, then continue that slice's checks.
   - If not found, ask the user for the file. The message below assumes it was not found.
3. **TICKET-0031.**
   - Leave the status `todo`.
   - Confirm its `build_units` includes every Build Unit already bound through `IFACE-003`'s producer and consumer responsibilities (the payments-api and web-checkout units), and add any that are missing.
   - Run `validate-implementation-detail-tickets.mjs`.
   - Present the question from its record (context, options, recommendation). The scenario does not give the record's text, so the options in the message below show the per-line vs. at-total alternatives the rounding rule must settle. If the record states them differently, I present the record's wording.
4. **Readiness checks for all three slices.**
   - Run `report-build-unit-readiness-reconciliation.mjs`, the repository discovery preflight, and the delivery-slice realizability challenge over the bounded cohort.
   - Run every safe independent probe even after another fails, and group failures by root cause: TICKET-0031, INPUT-004, unfinished prototype review.
5. **Sequence index `build/workflow/handoffs/README.md`.** Created before the first handoff, then reconciled. Slugs use the repository-prefixed form, `repo-xxx-…`.

   ```markdown
   **Current order group:** `1`

   | Order group | Delivery slice | Repository | Build Units | Requires | State |
   | ---: | --- | --- | --- | --- | --- |
   | 1 | `[repo-xxx-reporting-export](./repo-xxx-reporting-export.md)` | `REPO-xxx` | `BU-xxx` | `None.` | `Ready` |
   | 2 | `repo-yyy-payments-api` | `REPO-yyy` | `BU-yyy` | `None.` | `Blocked — TICKET-0031 (todo) decides the rounding rule in IFACE-003, which this slice produces; INPUT-004 provider settlement-file specification is missing (docs/provider/ is empty)` |
   | 3 | `repo-zzz-web-checkout` | `REPO-zzz` | `BU-zzz` | `repo-yyy-payments-api` | `Blocked — TICKET-0031 (todo) decides the rounding rule in IFACE-003, which this slice consumes; remaining checkout prototype screens are not yet complete and reviewed` |
   ```

   The runnable independent slice comes first. Each blocked slice sits at the earliest later position that stalls nothing runnable, and web-checkout transitively depends on the blocked payments-api. Run `validate-handoff-sequence.mjs --root <package> --validation-mode planning`.
6. **reporting-export handoff.**
   - Create `build/workflow/handoffs/repo-xxx-reporting-export.md` with outcome `IMPLEMENTATION_DETAILS_READY`, filling these sections:
     - Required Input Ledger
     - Required Interaction Closure (`IFACE-005` actions)
     - Physical Realizability Closure
     - The eight-axis realizability review plus the five compatibility axes
     - Target outcome and runtime-profile claims
     - Applicable VO closure
     - UI/UX delivery review, or its `Not applicable` disposition
   - Then run:
     - `delivery-snapshot.mjs --root <package> --handoff build/workflow/handoffs/repo-xxx-reporting-export.md --write --check`
     - `validate-delivery-readiness.mjs --root <package> --handoff build/workflow/handoffs/repo-xxx-reporting-export.md --validation-mode planning`
7. **payments-api and web-checkout.** Write no handoff files; blocked handoffs stay absent. Outcomes:
   - payments-api: `NEEDS_PRODUCT_DECISION` (TICKET-0031), with INPUT-004 as a second, independent blocker.
   - web-checkout: `NEEDS_PRODUCT_DECISION` (TICKET-0031), plus the incomplete prototype review and the wait for payments-api's handoff.
8. **No Delivery Planning started.** I only offer it, and only for reporting-export.

### Message to the user (verbatim)

> Not everything. One of the three slices can go to Delivery Planning now. The other two are held up by one open decision and one missing document.
>
> **Where things stand**
>
> - **Requested:** hand payments-api, web-checkout and reporting-export to Delivery Planning.
> - **Ready for planning:** reporting-export. Its handoff is written and validated. It only uses the bookings export contract (`IFACE-005`), so neither problem below touches it.
> - **Blocked:** payments-api and web-checkout. I haven't written handoffs for them.
> - **Nothing changed in the application code**, and I haven't started Delivery Planning for anything.
>
> **What blocks payments-api and web-checkout**
>
> 1. **TICKET-0031 is still open.** It decides the currency rounding rule in the shared pricing contract. payments-api calculates amounts under that contract and web-checkout shows them to customers, so neither can be planned until the rule is settled. Otherwise the two could round differently. The question is below.
> 2. **The payment provider's settlement-file specification is missing (payments-api only).** You said it's in `docs/provider/`, but that folder is empty, and I didn't find the file elsewhere in the repository or its history. Could you put it in `docs/provider/`, or tell me where it is?
> 3. **web-checkout also waits for payments-api.** It uses the pricing output payments-api produces, so it can only be planned once payments-api's handoff is ready.
>
> **What I'm doing meanwhile**
>
> - **The remaining checkout prototype screens.** My notes said the checkout-prototype session owned them, but that session was archived on 29 October with no changes since 20 October, so nobody is working on them. They're part of the prototype work you already gave me, so I'm finishing them now from where that session stopped. Where a total depends on the rounding rule, I'm marking it as pending TICKET-0031 instead of guessing. web-checkout also needs these screens reviewed before it's ready.
> - **The delivery order is updated:** group 1 reporting-export (ready), group 2 payments-api (blocked), group 3 web-checkout (blocked).
>
> **TICKET-0031: how should currency amounts be rounded in the pricing contract?**
>
> payments-api works out every amount under the shared pricing contract (line prices, discounts, totals), and checkout displays those amounts. The rule decides where rounding to the cent happens.
>
> An illustrative example: three add-ons at 3.335 each. Rounding each line first gives 3.34 + 3.34 + 3.34 = 10.02. Adding first and rounding once gives 10.005, which becomes 10.01 if halves round up, or 10.00 if halves round to even.
>
> - **Round each line, then add.** Every amount the customer sees adds up exactly to what they're charged. The total can differ from the exact sum by a cent or two.
> - **Add exact amounts, round once at the total.** The total is as close to exact as possible, but the lines shown may not add up to the total shown.
> - **Halfway amounts:** round half up (what most people expect) or half to even (less drift over many transactions).
>
> **My recommendation:** round each line to the cent, halves up, then add. Customers can check their receipt line by line, and checkout never shows a total that doesn't match its lines. This assumes no tax rule or provider requirement says otherwise. If the settlement-file specification turns out to require a particular rounding, I'll flag it when the file arrives.
>
> Once you've answered and the specification is in place, I'll update the pricing contract and re-run readiness for payments-api, then web-checkout, and write their handoffs if they pass. Do you want me to start Delivery Planning for reporting-export now?

### Report

- **Package:** `<repository-root>/design/software-design/`.
- **Files changed:**
  - `build/workflow/handoffs/README.md` (created)
  - `build/workflow/handoffs/repo-xxx-reporting-export.md` (created and snapshotted)
  - TICKET-0031's ticket file (only if its `build_units` mapping needed the producer and consumer units)
  - `ui-ux/specification.md` and the affected checkout prototype pages (remaining screens)
  - The stale ownership note
- **No application code changed.**
- **Readiness for the requested scope (all three slices): not ready as a whole.**

  | Slice | Outcome | Blockers or dependency path |
  | --- | --- | --- |
  | reporting-export | `IMPLEMENTATION_DETAILS_READY`, under planning validation | None. It does not reach `IFACE-003` or INPUT-004. |
  | payments-api | `NEEDS_PRODUCT_DECISION` | TICKET-0031 (todo) → `IFACE-003` it produces. INPUT-004 is `missing` (settlement-file specification; `docs/provider/` empty; not found elsewhere). |
  | web-checkout | `NEEDS_PRODUCT_DECISION` | TICKET-0031 (todo) → `IFACE-003` it consumes. Checkout prototype screens not yet complete or reviewed (I'm continuing them). It also requires payments-api's ready handoff, because `IFACE-003` is a planned upstream output. |

- **Execution eligibility:** none of the three is executing. reporting-export becomes eligible only on the user's later authorization.
- **Decisions or inputs needed from the user:**
  1. Answer TICKET-0031.
  2. Provide the settlement-file specification.
- **Next authorized action:** finish the checkout prototype screens. Delivery Planning is offered for reporting-export, not started.
- **Validator results:** structural only, not proof of semantic completeness or external availability.

## Scenario 10

### References read for this moment

- `SKILL.md`. Covers the UI/UX route, Stage 7 completion, and Validation And Delivery ("Scope every completion claim to its evidence", "Describe each decision's origin as its attribution record does", "If rendering is blocked, report the limitation").
- `references/ui-ux-design.md`. Covers Stage 7 completion, Validation Limits, and Implementation Fidelity distinctions.
- `references/ui-ux/design-workflow.md`. Distinguishes the selected direction from covered-flow approval and required coverage; covers rendered inspection and the fact that an agent walkthrough is not user testing.
- `references/ui-ux/templates/specification.md` (Prototype Review fields).
- `references/staged-design-workflow.md` (Stage 7 UI completion requires agreed reviewed coverage with no unresolved material contradictions or usability blockers).
- `references/decision-attribution.md`. Approving a visual direction approves that presentation, not the behavior underneath; agent choices remain Agent-chosen; Handback.
- `references/checkpoint-workflow.md` Before Asking and `references/implementation-detail-tickets.md`, for presenting TICKET-0019.

### Assessment

These are separate claims, each scoped to its evidence:

| Claim | Status | Scope and evidence |
| --- | --- | --- |
| Structural validation | Passes | Structure, ticket and UI/UX validators: files, links, declarations, markers. This is not appearance, comprehension, usability, accessibility or fidelity. |
| Visual direction | Candidate C selected (human-approved) | Approves presentation qualities and the selected target only. It does not approve unreviewed journeys or behavior. |
| Rendered inspection | Not performed | No browser in this environment can render the prototype, so I make no visual or portability claim. |
| Covered-flow approval | `Not reviewed` | The user has reviewed no journey, and nobody has reviewed the prototype. |
| Independent review | Interface contracts only (last week) | Evidence about the contracts, not the prototype. |
| Open material decision | TICKET-0019 (`todo`) | Whether staff can override the cancellation fee. This changes the cancellation screens, so that scope is **Incomplete**. |
| Agent-chosen this pass | Page size 25; newest-first sort | Recorded as Agent-chosen, not approved by the user. |

Conclusion:
- **The UI design is not done.** Stage 7 UI completion needs reviewed coverage with no unresolved material decisions or usability blockers. None of the journeys is reviewed, rendered inspection hasn't happened, and TICKET-0019 is open.
- **Nothing supports saying "approved"**, beyond the user's own selection of Candidate C as the direction.
- **What I can do:** I cannot supply rendered inspection here, and the review and the decision are the user's. I can record the limitation accurately, give an accurate status the user can share, and ask the one open question.

### Actions (files and changes)

1. Read `ui-ux/specification.md`, TICKET-0019, and the attribution records for Candidate C and for the two Agent-chosen decisions.
2. **`ui-ux/specification.md`, Prototype Review.** Only where not already recorded, without changing any other row or any attribution:
   - **Rendered inspection:** `Blocked — no browser available in this environment to render the prototype; no visual verification or direct-file portability check claimed.`
   - **Review status:** `Not reviewed`.
   - **Required prototype coverage:** `Incomplete — cancellation journey pending TICKET-0019 (staff override of the cancellation fee)`.
   - **Covered-flow approval:** stays `Not reviewed`.
3. Run `node <skill-dir>/scripts/validate-ui-ux-design.mjs --root <package>` after that edit.
4. Mark nothing as approved, change no ticket status, and draft nothing to send to the client.

### Message to the user (verbatim)

> Short answer: not yet, on both counts. Here's exactly what is and isn't true today.
>
> | | Status |
> | --- | --- |
> | **Visual direction** | Done. You chose Candidate C. That approved its look and overall direction, not the individual screens and flows. |
> | **Automated checks** | Pass. They confirm the files, links and required markers are in place. They can't tell whether the screens look right or are easy to use. |
> | **Seeing it rendered** | Not done. No browser here can open the prototype, so I haven't visually checked a single screen. |
> | **Journey review** | Not done. Nobody has reviewed any journey, you or anyone else; the specification still says "Not reviewed". The independent review last week covered the interface contracts, not the prototype. |
> | **Open decision** | TICKET-0019: whether staff can override the cancellation fee. Until it's decided, the cancellation screens aren't final. |
> | **My own choices this pass** | Lists show 25 items per page, newest first. I chose these; you haven't approved them. Change either if you like. |
>
> So telling the client it's approved would overstate it. If you need to tell them something now, this would be accurate: *"We've chosen the visual direction and built the prototype. The screen-by-screen review and one policy decision, whether staff can override cancellation fees, are still to come."*
>
> **To get to "approved":**
>
> 1. **Open `ui-ux/index.html` in a browser.** It works straight from the folder, with no install or server. Walk through the journeys. I can also do a rendered check wherever a browser is available.
> 2. **Tell me which journeys you approve, or what to change.** I'll record exactly what you approved.
> 3. **Decide TICKET-0019** (below). I'll then update the cancellation screens and re-check them.
>
> **TICKET-0019: can staff override the cancellation fee?**
>
> An illustrative example: a customer cancels the day before their booking and the cancellation fee applies. They contact you and ask for it to be waived. Can a staff member remove or change that fee?
>
> - **No override.** The fee always follows the cancellation policy. The cancellation screens stay as they are.
> - **Staff can waive or reduce it, with a required reason.** This adds an override control to the staff cancellation screen and a record of who changed the fee and why. The customer sees the adjusted fee.
> - **Same, but only for certain staff** (for example, managers). As above, plus a rule about who may do it.
>
> Whether to allow overrides at all is a business-policy call, and I don't have enough to recommend one way or the other. If you do allow them, I recommend requiring a recorded reason and showing who made the change, because it changes what the customer owes and should be traceable.

### Report

- **Package:** `<repository-root>/design/software-design/`.
- **Files changed:** `ui-ux/specification.md`, Prototype Review limitation, review status and coverage lines (only where not already recorded). `validate-ui-ux-design.mjs` was rerun afterwards. Nothing else changed.
- **Claims:**
  - **Structural validation:** passes (structure, tickets, UI/UX).
  - **Visual direction:** Candidate C, the user's selection.
  - **Rendered inspection:** blocked; no browser.
  - **Covered-flow approval:** Not reviewed.
  - **Independent review:** interface contracts only.
  - **Stage 7 UI completion:** not met.
- **Agent-chosen decisions recorded this pass:** page size 25 and newest-first sort, each recorded as Agent-chosen in its owning record's Decision Attribution.
- **Unresolved:** TICKET-0019 (`todo`), staff override of the cancellation fee. The cancellation journey stays Incomplete until it is answered and synchronized into the prototype.
- **Not claimed:**
  - Visual verification
  - Usability
  - Accessibility conformance
  - The user's or the client's approval of any journey
  - UI implementation readiness

---

<!-- trial file responses-S.md -->

### Responses — Scenarios 11 and 12

Both answers follow the Software Design skill at `trial-k/skill`. `<package>` means the resolved `software-design/` package, for example `design/software-design/`. `<skill>` means the directory that contains the active `SKILL.md`. Each user message is written as if the rendered walkthrough and the validator passed. Text in angle brackets is filled in from the actual run. Where a check could fail, the answer says how the message would change.

## Scenario 11

### Routing and references read

SKILL.md sends work that reconciles interface-affecting changes on a human-facing surface to `references/ui-ux-design.md`, plus the reference for the active stage. This is prototype work after the initial reviewed prototype, inside the Stage 7 UI lane. Nobody asked for Build Design or Delivery Readiness, so the Stage 8/9 reference is not loaded.

Read for this run:

- `references/ui-ux-design.md`: Later Interface Changes, Artifact And Prototype Constraints, Validation Limits, and Explicit Verification Of JavaScript-Rendered Interactions.
- `references/ui-ux/README.md`.
- `references/ui-ux/design-workflow.md`: Compare HTML Alternatives, Keep Active Alternatives Comparable, rendered inspection, Prototype Mechanics, Link And Maintain, Bounded Changes, and Discovery And Later Synchronization.
- `references/ui-ux/templates/specification.md`: only for the shape of the Prototype Alternatives, Prototype Review and Change Synchronization sections. The template is not a diff target.
- `references/checkpoint-workflow.md`: Active Section Passes and Before Asking.
- `references/decision-attribution.md`: Unknown origin, evidence, recording, and decisions without a ticket.
- `references/implementation-detail-tickets.md`: the later-prototype exception in Validation.
- `scripts/lib/validation/ui-ux-design.mjs`: to see how selection, review rows, pending rows and runtime receipts are checked.

Not loaded: `examples.md` (there is no design contrast to resolve), the slideshow starter (no new deck is being made), and the Stage 8/9 reference.

### How the agent reads the situation

1. **The request is an explicit prototype change.** TICKET-0040's canonical owners and specification requirements are already updated. What remains is the prototype, so "Add stock reservation and check that it works" asks for that change and for a rendered inspection. The request already authorizes both. The agent shows no checkpoint, asks for no approval, and needs no separate sync command. This is an ordinary update to an existing prototype, so the agent does not ask about prototype count, directions or slideshows.

2. **The recorded selection has unknown origin.** Before asking anything, the agent checks:
   - the specification's `## Decision Attribution` section: no entry for the selection;
   - the Active comparison line: no standing instruction to keep alternatives maintained;
   - TICKET-0040's attribution: it covers the reservation behavior, not which prototype was chosen;
   - comments and history within the authorized scope: nothing.

   Nothing shows who chose `./alternatives/combined/index.html`. The record stays, but the agent never treats or reports it as the user's choice. That `combined` is the newest and most complete candidate selects nothing. The "Retained alternative — reviewed delivery journey" labels on a–d don't settle their role either: only selection evidence and the user's instructions do.

3. **The answer changes which candidates this pass updates.** Stock is reserved on a site order, inside the delivery journey that a–d also cover.
   - If the user chose `combined`, a–d are retained snapshots and stay as they are.
   - If the user did not choose it, there is no user selection. Every candidate the user hasn't set aside is then an active alternative, and this pass must add reservation to each one with comparable coverage.

   Because the answer changes the scope of the pass, the rule applies: ask the user once, record the answer, and meanwhile do the work the recorded candidate (`combined`) needs either way. If the updated requirements had placed reservation entirely outside the delivery journey, a–d would not need it in either case and no question would be needed.

4. **No attribution is invented.** This pass doesn't record or change the selection, so the agent adds no attribution row now. It does not write Unknown origin, and it certainly does not write a human-approved label. The user's answer is recorded when it arrives.

### Actions this turn (files and changes)

1. **`<package>/ui-ux/alternatives/combined/`** (the pages and classic scripts that hold the site-order screens). Add stock reservation for a site order using `combined`'s existing layout, controls and language. Every state comes from what TICKET-0040's updated canonical owners and specification requirements define:
   - the reserve action on a site order;
   - the confirmation, showing the reserved quantity and the stock that remains reservable, which is still there when the user returns;
   - the insufficient-stock outcome as the requirements define it, shown before the user confirms;
   - cancelling before confirming, which leaves stock unchanged;
   - failure and unknown-outcome recovery that keeps the user's input and checks for an existing reservation before allowing a retry, so nothing is reserved twice;
   - any connected stock view whose displayed quantities the requirements changed.

   Demo data and reviewer controls stay inside the existing collapsible reviewer area. No behavior beyond the canonical requirements is added.

2. **`<package>/ui-ux/specification.md`**:
   - **Prototype Review:** update the row for the affected journey anchor with this inspection's evidence and limitations. Set it to `Reviewed` only if the walkthrough finds no unresolved contradiction or usability blocker. Otherwise set `Blocked` and name the finding.
   - **Change Synchronization:** remove only the TICKET-0040 pending row. The work it records on the recorded target is now done and inspected. Other rows are preserved; if none remain, the section reads `None.`.
   - **Alternatives table:** the `combined` row's coverage now includes stock reservation. Rows a–d gain one limitation each, "does not include stock reservation (TICKET-0040)", which is true whatever their role turns out to be. Their role wording is not changed until the user answers.
   - **Required prototype coverage:** if it already reads `Complete — <scope>`, the named scope now includes stock reservation.
   - **Unchanged:** the `Selected implementation target` and `Direction selection` lines; `Covered-flow approval`, because the user has not reviewed the reservation states; the `## Decision Attribution` section.

3. **`<package>/ui-ux/alternatives/combined/runtime-evidence.json`.** `combined` is the recorded selected candidate and renders through JavaScript. Editing it changes the candidate's resource hash, so any earlier receipt is now stale and would fail validation. The agent recaptures it with `<skill>/scripts/capture-prototype-runtime.mjs` from a temporary driver outside `ui-ux/`, using an available Playwright-compatible browser page. The steps cover the reserve action, next, cancel and recovery, plus two distinct reviewer targets. The driver and logs are deleted afterward. If no such browser utility is available, the agent records that limitation and reports that the stale receipt still fails validation until it is recaptured.

4. **`<package>/ui-ux/alternatives/combined/slides.html`**, only if it exists. Refresh the affected captures in the same pass. If that fails, keep the existing screenshots marked outdated, in the deck and beside its links in the specification and launcher.

Not touched: candidates a–d, the TICKET-0040 YAML, canonical owners, `ui-ux/index.html`, and the decision overview.

### "Check that it works"

- Open `<package>/ui-ux/index.html` directly from disk, not through a localhost preview, and follow `combined`'s card.
- Exercise every reservation state listed above at desktop and phone widths, with the keyboard as well as the mouse. If the prototype uses browser storage, also try a blocked storage read and malformed stored data.
- Fix any material problem within this pass and inspect again.
- Run `node <skill>/scripts/validate-ui-ux-design.mjs --root <package>`.
- The ticket validator is not run because no ticket changed. The decision overview is not regenerated because no attribution changed this turn.

### Message to the user (verbatim)

> Stock reservation is now in the `combined` prototype. I checked it by opening the prototype launcher straight from disk in <browser tool>, at desktop and phone widths, using the keyboard as well as the mouse. On a site order I went through:
>
> - **Reserving stock:** the confirmation shows the reserved quantity and the stock still available to reserve, and it's still there when you return to the order.
> - **Not enough stock:** <the outcome TICKET-0040 defines> appears before you confirm, with your next step.
> - **Cancelling before you confirm:** stock stays unchanged.
> - **A failed or unconfirmed reservation:** your entries are kept, and the prototype checks for an existing reservation before letting you try again, so it can't reserve twice.
>
> I found no blocking problems. <If a check had failed, this line instead names the problem, says what I changed, and says whether it's still open.>
>
> Files changed:
>
> - `ui-ux/alternatives/combined/<pages and scripts>`
> - `ui-ux/specification.md`: review evidence for the reservation journey, the TICKET-0040 pending entry cleared, and a note on prototypes a–d that they don't include reservation
> - `ui-ux/alternatives/combined/runtime-evidence.json`: recaptured
>
> The UI/UX validator passes. No meaningful decisions were made on my own: the placement and wording follow `combined`'s existing patterns.
>
> This shows the prototype's interactions work as the updated requirements describe. It's my own walkthrough, not your review of the new screens and not user testing. It doesn't touch a real stock system or the product code.
>
> One question about the other four prototypes. The specification names `combined` as the design to build, but I can't find any record of who chose it: there's no attribution entry, comment or conversation. Prototypes a–d are labelled "retained", but that label doesn't tell me you set them aside, and `combined` being the newest and most complete doesn't make it your choice.
>
> **Did you choose `combined` as the design to build?**
>
> - **Yes:** I'll record it as your choice and keep a–d as reference copies without stock reservation. Nothing else changes.
> - **No:** tell me which design you want to build, or which prototypes you're still comparing. I'll record that and add stock reservation to each one you're still comparing so they stay comparable.

### After the answer

- **"Yes":** add a `## Decision Attribution` row to `ui-ux/specification.md`: "Selected implementation target `./alternatives/combined/index.html`" | Human-approved · User specified | evidence: the user's reply, quoted verbatim and dated 2026-11-05, given in answer to the question above | conditions: None. Rows a–d now read as retained snapshots on that evidence and keep their reservation limitation. Then regenerate the decision overview and run `--check`. No candidate is edited.
- **"No", or a different choice:** record what the user said. That means the selection they name with its attribution, or `Unresolved` with the active set they name. Correct the target line and the alternatives table. Add stock reservation to every active alternative, each in its own layout, and inspect each one from disk. Report the pass incomplete, naming the alternative, while any active one is unfinished or unverified. Regenerate and check the decision overview if attribution changed.

## Scenario 12

### Routing and references read

The routing is the same as Scenario 11: an interface-affecting change to a human-facing surface after the initial reviewed prototype.

Read for this run:

- `references/ui-ux-design.md`: Later Interface Changes, Artifact And Prototype Constraints, and Validation Limits.
- `references/ui-ux/README.md`.
- `references/ui-ux/design-workflow.md`: Keep Active Alternatives Comparable, Compare HTML Alternatives, Choose Prototype Count And Directions (to confirm the question is skipped), rendered inspection, Prototype Mechanics, Link And Maintain, Bounded Changes, and Discovery And Later Synchronization.
- `references/ui-ux/templates/specification.md`: section shapes only.
- `references/checkpoint-workflow.md`: Active Section Passes and Before Asking.
- `references/implementation-detail-tickets.md`: the prototype-sync exception.
- The validator's specification reader.

Not needed: `decision-attribution.md`, because no decision is recorded or changed and nothing is selected; `examples.md`; the slideshow starter; the Stage 8/9 reference.

### How the agent reads the situation

1. **The request is an explicit prototype change.** TICKET-0012 is approved, and FLOW-004 and the specification requirements are already updated. "Add the recurring-booking option and check that it works" therefore authorizes the prototype update and its inspection in every active alternative, with no separate approval for each candidate. The agent asks no prototype count, direction or slideshow question, because this is an ordinary update.

2. **All five candidates are active alternatives.** The selected target is `Unresolved`, and nothing shows the user set any candidate aside. Before a selection, every candidate in the agreed comparison is active, so a, b, c, d and e are all active alternatives. The "Exploratory comparison" label agrees with this but doesn't decide it. The agent selects nothing, does not treat the newest or most complete candidate as chosen, and does not ask the user to pick: picking is not needed for this change.

3. **Parity applies.** Every row's agreed comparison covers arrival → availability → create booking → confirmation, plus cancellation and payment failure. The weekly recurring option changes create booking and what follows it within that same journey, so it falls inside the agreed comparison scope. It goes into all five, each through its own layout, navigation and interaction treatment, and the affected paths are exercised in each.

4. **The empty pending list is not proof of freshness.** Change Synchronization says `None.`, but TICKET-0012 changed FLOW-004 and the specification after the initial review, and no prototype shows the recurring option. The agent compares each candidate with FLOW-004 and the current specification rather than relying on the empty list.

5. **No question remains.** The canonical owners settle the recurring behavior, so the agent asks nothing. If the agent had found a material user-visible behavior that FLOW-004 leaves open, it would label that behavior as a hypothesis in the prototypes and ask only about that point. The facts given show no such gap.

6. **The direction is not reopened.** The option sits inside create booking. It does not change the main journey, shared navigation, information hierarchy, safety, accessibility or a cross-surface contract.

### Actions this turn (files and changes)

1. **`<package>/ui-ux/alternatives/a/`, `b/`, `c/`, `d/` and `e/`** (each candidate's booking pages and classic scripts). Add the weekly recurring option in each candidate's own treatment. All recurring behavior comes from FLOW-004 and the specification, and nothing beyond it is added:
   - choosing to repeat weekly while creating a booking;
   - availability for the dates the series covers, as FLOW-004 defines;
   - creating the series, with the confirmation showing it, still there on return;
   - cancelling before submission, which creates nothing;
   - payment failure for a recurring booking and its recovery, which keeps the user's details and cannot create the series twice;
   - the existing one-off booking path, still working.

   Representative fake data and reviewer controls go only in each candidate's reviewer area.

2. **`<package>/ui-ux/specification.md`**:
   - **Active comparison line:** the agreed comparison journey now includes the weekly recurring option (TICKET-0012, FLOW-004), with a–e listed as the active alternatives kept comparable.
   - **Alternatives table:** each row's bounded coverage becomes "arrival → availability → create booking (including the weekly recurring option) → confirmation, plus cancellation and payment failure". The status wording is left as it is.
   - **Prototype Review:** the row for the booking journey anchor gets per-alternative evidence and limitations from this inspection. It is `Reviewed` only if no unresolved contradiction or usability blocker remains; otherwise it is `Blocked` with the finding.
   - **Change Synchronization:** stays `None.` if all five are finished and verified. If any alternative is not, add a row for the journey that names that alternative and the remaining change, linking FLOW-004 and the TICKET-0012 file.
   - **Unchanged:** `Selected implementation target: Unresolved`, `Direction selection`, `Covered-flow approval` (not extended to the new recurring states), `## Decision Attribution`, Journey and State Coverage (already updated in the ticket pass), FLOW-004, TICKET-0012, and the launcher.

3. **`slides.html`** for any candidate that already has one: refresh its affected captures in the same pass. If that fails, mark the deck outdated in the deck and beside its links.

4. **Runtime receipt:** none is required, because there is no selected candidate. Static checks and the rendered walkthrough are the evidence.

### "Check that it works"

- Open `<package>/ui-ux/index.html` directly from disk and follow each of the five cards.
- In each candidate, at desktop and phone widths and with the keyboard, exercise:
  - the one-off booking;
  - the weekly recurring booking through availability, creation, confirmation and return;
  - cancelling before submission;
  - payment failure and its recovery.
- Fix any material problem within this pass and inspect again.
- Run `node <skill>/scripts/validate-ui-ux-design.mjs --root <package>`.
- No ticket or attribution files change, so the ticket validator and the decision overview are not run.

### Message to the user (verbatim)

> The weekly recurring-booking option is now in all five booking prototypes (a–e). None of them has been chosen as the design to build yet, so all five are still being compared. I added the option to each one, in its own layout, so the comparison stays fair: <one short note per prototype on where the option sits>.
>
> I checked it by opening the prototype launcher straight from disk in <browser tool> and going through each prototype at desktop and phone widths, with the keyboard as well as the mouse:
>
> - A one-off booking still works as before.
> - Choosing to repeat weekly shows availability for the dates the series covers, creates the booking, and the confirmation lists the series. It's still there when you come back.
> - Cancelling before you submit creates nothing.
> - A payment failure on a recurring booking keeps your details and lets you recover without creating the series twice.
>
> | Prototype | Result |
> | --- | --- |
> | a | Works, no blocking problems |
> | b | Works, no blocking problems |
> | c | Works, no blocking problems |
> | d | Works, no blocking problems |
> | e | Works, no blocking problems |
>
> <If any prototype had failed, its row names the problem, the update is reported as incomplete for that prototype, and it is listed as pending in the specification.>
>
> Files changed:
>
> - `ui-ux/alternatives/a` to `e`: the booking pages and scripts
> - `ui-ux/specification.md`: the comparison scope and each prototype's coverage now include the recurring option, plus the review evidence for the booking journey
>
> The UI/UX validator passes. No meaningful decisions were made on my own: how the option looks in each prototype follows that prototype's existing patterns.
>
> The specification's list of pending prototype changes said "None." even though TICKET-0012 changed the booking flow after the prototypes were reviewed. So I compared each prototype with FLOW-004 and the current specification instead of relying on that list. Nothing is pending now.
>
> This is my own walkthrough of the prototypes, not your review of the new screens and not user testing, and it doesn't involve a real booking or payment system. You haven't picked a design to build yet; this change didn't need one, and you can pick whenever you're ready.

---

<!-- post-review final-text recheck: trial file responses-F.md (Scenarios 1, 2, 11, 12, 13) -->

### Responses — Trial F

Skill references used in every scenario: `SKILL.md`, then the UI/UX route: `references/ui-ux-design.md` and `references/ui-ux/design-workflow.md`. I also read the Stage 7 section of `references/staged-design-workflow.md`, `references/checkpoint-workflow.md` (Active Section Passes, Before Asking), `references/implementation-detail-tickets.md` (Ticket And Canonical Owner Synchronization, prototype rule under Validation) and `references/decision-attribution.md` (who made a selection). For a recorded selected candidate with JavaScript-rendered elements, I also read `scripts/capture-prototype-runtime.mjs` and `scripts/lib/validation/prototype-runtime.mjs`, which define how runtime evidence is captured.

In each package, the files I read are `ui-ux/specification.md`, the originating ticket YAML, the canonical flow and specification requirements it updated, `ui-ux/index.html`, and the candidate folders.

---

## Scenario 1

**How I read the situation**

- No candidate is selected. The target is `Unresolved` and nothing records a selection.
- All five rows have the same bounded coverage, and nothing shows the user setting any of them aside. Before a selection, every candidate in the agreed comparison is active, so A–E are all active alternatives. "Exploratory comparison" is older wording. A label does not decide a candidate's role.
- "Add … to the prototypes and check that it works" is an explicit prototype-change request. It already authorizes the edits and the inspection, so I ask no approval and no "which prototype" question. The request names no subset, so the change goes into every active alternative: A, B, C, D and E.
- Change Synchronization says `None.`, even though TICKET-0012 was approved after the initial reviewed prototype. An empty pending list does not prove the prototypes are current. I compare against the current requirements, and recurring booking is missing from all five.

**Actions**

1. Read TICKET-0012's resolution, FLOW-004 and the updated specification requirements (journey and state coverage). These define what recurring weekly booking does and shows. I build only that behavior. If those sources leave a material visible outcome undefined, I don't invent it. I ask one focused question about that point and keep doing the rest.
2. Edit `ui-ux/alternatives/a/…` through `ui-ux/alternatives/e/…`:
   - Add the weekly-repeat option at the create-booking step.
   - Add the recurring states the canonical sources define within the comparison journey: series availability, series confirmation, cancellation, and payment failure with recovery.
   - Express each one through that candidate's own layout, navigation and interaction treatment. I don't paste one design into all five, though sharing logic between them is allowed.
   - Keep demo data in classic scripts, keep paths relative, add no remote dependencies, and keep reviewer controls inside the reviewer area.
3. Check that it works:
   - Open `ui-ux/index.html` directly from disk in the available browser tool, not on localhost, and follow each candidate's card.
   - In each of A–E, walk arrival → availability → create a weekly series → confirmation. Also cancel before and after submission, where those differ, and trigger a payment failure and recover from it.
   - Confirm that a one-off booking still works.
   - Repeat at desktop, tablet and phone widths. Check keyboard operation and visible focus.
   - If a candidate uses storage, also check blocked storage and malformed stored data.
   - Record the tool and findings.
   - If any candidate already has `slides.html`, refresh its affected captures in the same pass. If that fails, label its screenshots outdated beside its links.
4. Update `ui-ux/specification.md`:
   - **Alternatives table:** add "recurring weekly booking (TICKET-0012)" to each row's bounded coverage. Restate each status as "Active alternative — …, recurring booking added and exercised 2026-11-05".
   - **Active comparison line:** the agreed journey now includes the recurring option across all five, extended at the user's request on 2026-11-05.
   - **Prototype Review:** add an evidence row for the booking journey anchor, with each candidate's findings and the limits.
   - **Selected implementation target:** stays `` `Unresolved` ``.
   - **Change Synchronization:** stays `None.`. If a candidate fails or remains unverified, I record that in its own alternatives row, not as a pending journey row, and report the pass as incomplete.
5. Check TICKET-0012's status. If it is `decided` only because the prototype work was outstanding, and every other write target and check is satisfied, move it to `finished` and run `validate-implementation-detail-tickets.mjs`. If it is already `finished`, leave it.
6. Run `node <skill>/scripts/validate-ui-ux-design.mjs --root <package>`. I record no attribution entries: no selection was made, and layout choices need none.

**Message to the user (sent after the checks pass; any candidate that fails is named as unfinished instead)**

> Recurring weekly booking (TICKET-0012) is now in all five booking prototypes, A to E, and I've checked it in each one.
>
> **What changed**
> - Each prototype offers the weekly repeat option at the create-booking step, in its own layout.
> - Availability, confirmation, cancellation and payment failure now show the series the way FLOW-004 and the UI/UX specification describe.
> - One-off bookings still work as before.
>
> **How I checked:** I opened `ui-ux/index.html` straight from disk in the browser. In each prototype I booked a weekly series end to end, cancelled before and after submitting, and triggered a payment failure and recovered from it. I did this at desktop, tablet and phone widths, and by keyboard. The findings are recorded in the specification's prototype review.
>
> **Specification:** every alternative's coverage now includes recurring weekly booking, and all five are marked as active alternatives because no design has been selected yet. Nothing is left pending, and the UI/UX validator passes.
>
> **Limits:** this was my own walkthrough, not user testing. With no selected design, it says nothing about implementation readiness.

---

## Scenario 2

**How I read the situation**

- C is the implementation target. Its Decision Attribution entry is Human-approved · User specified, quoting the user: "Go with C. Keep the others just for reference."
- That instruction sets A, B, D and E aside, and no standing instruction keeps them active. They are retained snapshots, which are updated only on request.
- "Add … (TICKET-0012) to the prototype and check that it works" names the singular prototype, which is C. It is an explicit prototype-change request, so I ask no approval and no question.

**Actions**

1. Read TICKET-0012, FLOW-004 and the updated specification requirements. Treat any Change Synchronization row for TICKET-0012 as a lead, not a full list.
2. Edit only `ui-ux/alternatives/c/…`:
   - Add the weekly-repeat option at create booking.
   - Add every recurring state the canonical sources define in C's booking journey: series availability, series confirmation, cancellation, and payment failure with recovery.
   - Keep C's established patterns.
3. Check that it works:
   - Open `ui-ux/index.html` from disk and follow C's card.
   - Exercise the full recurring path, cancellation before and after submit, payment failure and recovery, and an unchanged one-off booking.
   - Repeat at desktop, tablet and phone widths, with keyboard and focus checks, and with storage-failure cases if C uses storage.
   - Because C is the selected candidate and has JavaScript-rendered elements, recapture `ui-ux/alternatives/c/runtime-evidence.json` with `capture-prototype-runtime.mjs`, using a temporary driver kept outside `ui-ux/`. Editing C makes any older receipt stale, and a stale receipt fails validation. If capture isn't possible, I say so; I don't keep or fake an old receipt.
   - If C has `slides.html`, refresh its affected captures. If that fails, mark them outdated.
4. Update `ui-ux/specification.md`:
   - **C's row:** coverage now includes recurring weekly booking.
   - **Prototype Review:** add evidence and limits for the booking journey anchor.
   - **Change Synchronization:** clear only the completed TICKET-0012 entry, if one exists, and keep any unrelated pending rows. Otherwise it stays `None.`.
   - **Required prototype coverage:** keep naming its scope; I don't broaden the claim.
   - **Rows A, B, D and E:** unchanged. "Not updated after 2026-10-02" is still accurate.
5. Make TICKET-0012's status consistent, as in Scenario 1. Run the UI/UX validator, plus the ticket validator if the status changed. Decision Attribution is untouched.

**Message to the user**

> Recurring weekly booking (TICKET-0012) is now in prototype C, your selected design, and it works in the checks I ran.
>
> **What changed in C**
> - The create-booking step offers a weekly repeat.
> - Availability, confirmation, cancellation and payment failure show the series as FLOW-004 and the UI/UX specification describe.
> - One-off bookings are unchanged.
>
> **How I checked:** I opened `ui-ux/index.html` from disk and went through C. I booked a weekly series, cancelled before and after submitting, and triggered a payment failure and recovered from it. I did this at desktop, tablet and phone widths, and by keyboard. I also recaptured C's runtime evidence.
>
> **Specification:** C's coverage and the prototype review now include recurring booking, and nothing is pending for TICKET-0012. The UI/UX validator passes.
>
> **Not changed:** A, B, D and E. On 2 October you said to keep them just for reference, so they still show only the original booking journey. Tell me if you want any of them updated.
>
> **Limits:** this was my own walkthrough, not user testing. It covers the booking journey, not the whole app.

---

## Scenario 11

**How I read the situation**

- The specification names `combined` as the target, but nothing establishes who chose it. There is no Decision Attribution entry, no retained conversation and no comment.
- Being the newest and most complete candidate selects nothing. A selection of unknown origin keeps its record but is never treated as the user's choice.
- I therefore can't tell whether a–d are retained snapshots or still-active alternatives. Their "Retained alternative" label doesn't settle it, because there is no evidence the user set them aside.
- The answer changes this pass. If the user selected `combined`, only `combined` gets stock reservation. If not, all five are active and each gets it.
- So I ask once, and meanwhile do the work needed either way: `combined` is updated in both cases.

**Actions now**

1. Read TICKET-0040, its updated canonical owners and the specification requirements for stock reservation.
2. Edit `ui-ux/alternatives/combined/…` to add reserving stock for a site order, with the states the canonical sources define (for example confirmation, release or cancellation, and failure with recovery).
3. Check that it works:
   - Open `ui-ux/index.html` from disk and exercise the reservation path, cancellation and failure/recovery.
   - Confirm the existing delivery journey is unaffected.
   - Repeat at desktop, tablet and phone widths, and by keyboard.
   - `combined` is the recorded selected target, and the validator treats it that way. If it has JavaScript-rendered elements, recapture its `runtime-evidence.json`.
   - Refresh any existing deck, or mark it outdated.
4. Update `ui-ux/specification.md` for `combined` only: its row's coverage, plus a Prototype Review evidence row.
   - Leave a–d, their rows and `Selected implementation target` as they are.
   - Write no Decision Attribution entry yet. I record the answer when it arrives.
5. Run the UI/UX validator. I report the pass as incomplete until the user answers.

**After the answer**

- **"Yes, I chose combined":** add a `## Decision Attribution` row: "`combined` is the implementation target | Human-approved · User specified", with the user's reply and date (2026-11-05) as evidence. a–d stay retained snapshots and are not updated.
- **"No" or "not sure":** add a row recording the existing selection as Unknown origin. The evidence is that I inspected the specification and found no attribution, conversation or comment. I don't present that selection as the user's choice. a–d are active alternatives, so I add stock reservation to each in its own layout, exercise each one, and update their rows. Until all four are done, I record any unfinished one in its own row.
- **If the user picks a target in the reply:** record it as Human-approved · User specified.
- In all cases, regenerate and check the decision overview.

**Message to the user**

> I've added stock reservation (TICKET-0040) to the `combined` prototype and checked it. I opened `ui-ux/index.html` from disk, reserved stock for a site order, then tried cancelling and a failed reservation with recovery. I did this at desktop, tablet and phone widths, and by keyboard. The delivery journey still works as before, and the specification records the check.
>
> One question before I touch the others. The specification names `combined` as the design to build, but nothing records who chose it: there's no attribution entry and no saved conversation or comment. Being the newest and most complete version doesn't count as a choice. **Did you choose `combined` as the design to build?**
>
> - **If yes:** I'll record that as your choice and keep a, b, c and d as reference-only. They won't get stock reservation.
> - **If no, or you're not sure:** a–d are still part of the comparison. I'll add stock reservation to each of them in their own layouts so you're comparing designs, not missing features, and the choice stays open.
>
> Until you answer, this update is complete for `combined` only.

---

## Scenario 12

**How I read the situation**

- The facts match Scenario 1. Nothing is selected, and A–E have the same coverage with no evidence that any was set aside, so all five are active alternatives.
- The request doesn't say "prototypes", but TICKET-0012's canonical owners (FLOW-004 and the specification requirements) already contain recurring booking. Adding the option can only mean adding it to the prototypes, and "check that it works" confirms that.
- This is an explicit prototype-change request, so I ask no approval and no "which one" question. It names no subset, so every active alternative is in the pass.

**Actions** (the same pass as Scenario 1)

1. Read TICKET-0012, FLOW-004 and the updated specification requirements.
2. Add the weekly-repeat option and the canonical recurring states to each of `ui-ux/alternatives/a` through `e`, each in its own layout and interaction treatment.
3. Check each one from disk:
   - Open `ui-ux/index.html` from disk and, in each candidate, book a weekly series end to end.
   - Cancel before and after submitting, and fail a payment and recover from it.
   - Confirm a one-off booking is unaffected.
   - Repeat at desktop, tablet and phone widths, and by keyboard.
   - Refresh any existing decks.
4. Update `ui-ux/specification.md`:
   - Add recurring booking to each row's coverage and restate each status as "Active alternative".
   - Update the Active comparison line and add Prototype Review evidence.
   - Leave the target `Unresolved` and Change Synchronization at `None.`.
   - Record any candidate that fails in its own row and report the pass as incomplete.
5. Make TICKET-0012's status consistent, then run the UI/UX validator, plus the ticket validator if the status changed.

**Message to the user**

> Recurring weekly booking (TICKET-0012) was already in the design (FLOW-004 and the UI/UX specification). I've now added it to all five booking prototypes, A to E, and checked each one.
>
> **What changed:** each prototype offers the weekly repeat at the create-booking step in its own layout. Availability, confirmation, cancellation and payment failure show the series as specified, and one-off bookings still work.
>
> **How I checked:** I opened `ui-ux/index.html` from disk. In every prototype I booked a weekly series, cancelled before and after submitting, and failed a payment and recovered. I did this at desktop, tablet and phone widths, and by keyboard. The findings are in the specification's prototype review.
>
> **Specification:** all five alternatives list recurring booking in their coverage and stay active alternatives, because no design has been selected. Nothing is pending, and the UI/UX validator passes.
>
> **Limits:** this was my own walkthrough, not user testing, and with no selected design it isn't an implementation-readiness claim.

---

## Scenario 13

**How I read the situation**

- Nothing is selected, and all five candidates are active alternatives.
- The request explicitly names B, so the feature update goes into B only. It is an explicit prototype-change request, so I ask no approval.
- Adding a feature to B, or showing B to a client, is not a selection. The target stays `Unresolved`, and A, C, D and E stay active.
- Their missing parity goes in their own alternatives rows, not as pending journey rows.

**Actions**

1. Read TICKET-0012, FLOW-004 and the updated specification requirements.
2. Edit `ui-ux/alternatives/b/…` to add the weekly-repeat option and the canonical recurring states (series availability, confirmation, cancellation, payment failure with recovery) in B's own treatment.
3. Check that it works, with the client demo in mind:
   - Open `ui-ux/index.html` directly from disk, as a recipient of the `ui-ux/` folder would, and follow B's card.
   - Exercise a weekly series end to end, cancellation before and after submit, payment failure and recovery, and an unchanged one-off booking.
   - Repeat at desktop, tablet and phone widths, with keyboard and focus checks, and with storage-failure cases if B uses storage.
   - Confirm B needs no server, network or remote resources.
   - Confirm the reviewer controls stay collapsed and separate from the product, and the prototype disclosure is present.
   - If B has `slides.html`, refresh its affected captures. I don't raise the slideshow question, because this is an ordinary update.
4. Update `ui-ux/specification.md`:
   - **B's row:** coverage now includes recurring weekly booking, exercised on 2026-11-05.
   - **A, C, D and E rows:** add "Recurring weekly booking (TICKET-0012) not added — the 2026-11-05 update covered B only, at the user's request".
   - **Prototype Review:** add evidence for B's booking journey.
   - **Target:** stays `Unresolved`.
   - **Change Synchronization:** stays `None.`.
5. Run the UI/UX validator. I don't change TICKET-0012's status in a way that implies all active alternatives are synchronized; the parity gap is recorded in the four rows.

**Message to the user**

> Prototype B now has the recurring weekly booking option (TICKET-0012). It works in the checks I ran, so it's ready to show tomorrow.
>
> **What changed in B**
> - The create-booking step offers a weekly repeat.
> - Availability, confirmation, cancellation and payment failure show the series as FLOW-004 and the UI/UX specification describe.
> - One-off bookings are unchanged.
>
> **How I checked:** I opened `ui-ux/index.html` straight from disk, the same way your client would if you send them the `ui-ux` folder. No server or internet is needed. In B I booked a weekly series, cancelled before and after submitting, and failed a payment and recovered. I did this at desktop, tablet and phone widths, and by keyboard. The reviewer controls stay tucked away in their own collapsed panel.
>
> **The other designs:** A, C, D and E don't have recurring booking yet, so the five are no longer like-for-like. I've noted this in each of their rows in the specification. Do you want me to add it to them as well?
>
> Showing B to the client doesn't make it the chosen design; that choice stays open until you make it. This was my own walkthrough, not user testing.

---

<!-- second round: final wording before the second-round review; trial files responses-ACD.md, responses-B.md, responses-EFG.md, responses-G2.md; text verbatim, headings demoted one level -->

## Second round responses (Scenarios A–G and G2)

<!-- responses-ACD.md -->

Skill files read: `SKILL.md`; `references/ui-ux-design.md` (the route for prototype changes); `references/ui-ux/README.md`, `references/ui-ux/design-workflow.md` (in particular *Keep Active Alternatives Comparable*, *Optional Review Slideshows*, *Bounded Changes* and *Discovery And Later Synchronization*), and `references/ui-ux/templates/specification.md`; `references/staged-design-workflow.md` and `references/checkpoint-workflow.md` (the Stage 7 reference for the active work, plus the active-pass and *Before Asking* rules); `references/decision-attribution.md` (to read the recorded selection and instructions); `references/implementation-detail-tickets.md` (ticket statuses, canonical-owner synchronization and the later-prototype exception); and `references/planning-execution-contract.md`, read because `SKILL.md` names it first, though it doesn't apply here because none of these scenarios makes a readiness or lineage decision. I also searched `scripts/lib/validation/ui-ux-design.mjs` for the specification fields it parses. None of the scenarios gives a real package to run validators against, so validator results below are written as passing.

### Scenario A

**Routing and scope.** This is an explicit prototype-change request made after the initial reviewed prototype, so it authorizes the affected updates and rendered inspection with no further approval. No candidate is selected, and nothing shows the user setting any candidate aside, so all five candidates (`a` to `e`) are active alternatives. The request names none of them, so the pass covers all five. The recurring option belongs to the "create booking" step of the agreed comparison journey, and the user's request widens that agreed scope by this one feature. Change Synchronization reads `None.`, but an empty list doesn't prove the prototype is current. Comparing the candidates with the updated specification requirements shows that all five lack TICKET-0012's recurring option. This is an ordinary update, so I don't ask about the number of prototypes, directions or slideshows.

**Actions**

1. `ui-ux/alternatives/a/` to `e/`: add the weekly recurring option to the create-booking step of each candidate. Each one expresses it through its own layout, navigation and interaction style rather than a copied widget. The series appears on the confirmation and when the user returns to the booking. Cancellation and payment failure behave as the updated specification requirements and TICKET-0012's canonical owners state. Demo data stays in classic scripts, with no remote dependencies.
2. Rendered inspection: open `ui-ux/index.html` directly from disk in the browser pane and go from the launcher into each candidate. In each one, exercise:
   - choosing weekly, then creating the booking, then checking the confirmation;
   - leaving and returning to the booking, where the series must still be there;
   - cancelling before submitting, which must keep the prior state;
   - a payment failure on a recurring booking, with recovery that doesn't create a duplicate submission;
   - a single booking, to confirm it still works.

   Also check keyboard operation and desktop, tablet and phone widths. If a candidate uses storage, also check blocked and malformed stored data. Result: `a`, `b`, `c` and `e` pass. In `d`, the weekly series is not kept after returning to the booking, and it isn't fixed in this pass.
3. `ui-ux/specification.md`:
   - `**Selected implementation target:** \`Unresolved\``, Direction selection and Covered-flow approval stay unchanged.
   - Active comparison: the agreed journey now includes the weekly recurring option, and `a` to `e` are active.
   - Rows `a`, `b`, `c`, `e`: "Active alternative — arrival → availability → create booking (incl. weekly recurring option) → confirmation, plus cancellation and payment failure; recurring paths verified 2026-11-05 by rendered inspection from disk".
   - Row `d`: "Active alternative — same journey incl. weekly recurring option; **parity gap:** the weekly series does not persist after returning to the booking (TICKET-0012); recurring paths unverified, not fixed in the 2026-11-05 pass".
   - Prototype Review evidence for the booking journey: the tool, viewports, direct-file check and findings for `a`, `b`, `c` and `e`. For `d`'s failure it only points to `d`'s row.
   - Change Synchronization stays `None.`. The gap in `d`, an unselected alternative, is recorded in its own row and never as a pending journey row.
   - No candidate is shown with a deck. If one exists, I refresh its affected captures in this pass, or mark them outdated beside its link if the refresh fails.
4. No ticket edits. The gap in `d` holds no ticket and no readiness claim. No attribution is recorded, so the decision overview isn't regenerated.
5. `node <skill-dir>/scripts/validate-ui-ux-design.mjs --root <package>`: PASS.

**Message to the user**

> I added the weekly recurring-booking option to all five alternatives (A–E), each in its own layout and interaction style. I checked them by opening the prototype launcher directly from disk in the browser, at desktop, tablet and phone widths, with keyboard as well as mouse.
>
> **This pass is incomplete: alternative D is not finished.**
> - **A, B, C, E — working.** Creating a weekly series, seeing it on the confirmation, coming back to the booking and still seeing it, cancelling before submitting, and recovering from a payment failure without a duplicate booking all behave as the updated requirements say. Single bookings still work.
> - **D — not working.** The option is there, but the weekly series is lost when you go back to the booking. I couldn't fix it in this pass. The gap is recorded in D's row of the alternatives table in `ui-ux/specification.md`.
>
> Nothing else changed. No direction is selected (the implementation target is still Unresolved), and D's gap doesn't hold any ticket or readiness claim. Files changed: `ui-ux/alternatives/a/`–`e/` and `ui-ux/specification.md` (comparison scope, the five alternative rows, review evidence). The UI/UX validator passes, but it checks structure only. My browser walkthrough is a heuristic check, not user testing, and it isn't your approval of the recurring flow. I recorded no Agent-chosen design decisions; where each alternative places the option is presentation only.

### Scenario C

**Routing and scope.** The selection of C is Human-approved · User specified. The same instruction, "Keep the others just for reference", set `a`, `b`, `d` and `e` aside, and nothing keeps them active. So they are retained snapshots, which are updated only on request. The request doesn't name them, so the pass covers only `c`, the selected target. I don't ask how many alternatives to maintain.

**Actions**

1. `ui-ux/alternatives/c/`: add the weekly recurring option to C's existing booking journey, using C's established patterns.
2. Rendered inspection from disk: go from the launcher into `c` and run the same recurring paths as in Scenario A (create, confirmation, return and persistence, cancellation before submit, payment failure and recovery, single-booking regression), with keyboard and desktop, tablet and phone widths. Result: pass.
3. `c` is the selected candidate and its files changed, so any existing `alternatives/c/runtime-evidence.json` is now stale. Recapture it with `scripts/capture-prototype-runtime.mjs` and the browser utility, keeping the driver outside `ui-ux/`. The capture covers the recurring action as well as the next, cancel, recovery and two reviewer-target interactions.
4. `ui-ux/specification.md`:
   - Prototype Review: the booking journey row becomes `Reviewed — no unresolved usability blockers`, with the tool, viewports, direct-file check and the recurring paths exercised on 2026-11-05.
   - State Coverage: add the recurring-series prototype state only if the updated requirements make it a materially distinct state.
   - Change Synchronization: clear TICKET-0012's pending row if there is one, and keep every unrelated row. Write `None.` only if no rows remain.
   - Required prototype coverage: add the recurring option to the named selected scope if no other pending row affects that scope.
   - Row `c` coverage mentions the recurring option. Rows `a`, `b`, `d`, `e` stay unchanged, since they already say "not updated after 2026-10-02".
   - The selection and its `## Decision Attribution` row stay unchanged.
5. If `c` has a deck, refresh its affected captures. Decks of retained snapshots get no maintenance.
6. No ticket edits and no attribution. If Build Units link C's booking journey, they keep the same entrypoint and anchors, so they need no edit. `validate-ui-ux-design.mjs`: PASS.

**Message to the user**

> I added the weekly recurring-booking option to C, your selected implementation target. I checked it by opening the prototype launcher directly from disk, at desktop, tablet and phone widths, with keyboard as well as mouse. Everything works: creating a weekly series, seeing it on the confirmation, finding it again when you return to the booking, cancelling before submitting, and recovering from a payment failure without a duplicate booking. Single bookings still work.
>
> I left A, B, D and E untouched. When you chose C on 2 October you asked to keep the others just for reference, so they stay as reference snapshots of the booking journey from that date, without recurring bookings.
>
> Files changed: `ui-ux/alternatives/c/` (prototype and its recaptured runtime evidence) and `ui-ux/specification.md` (C's review evidence and coverage; the TICKET-0012 pending entry is cleared). The UI/UX validator passes, but it checks structure only. My walkthrough is a heuristic check, not user testing or your approval of the new recurring screens. I recorded no Agent-chosen design decisions.

### Scenario D

### D1

**Routing and scope.** On 2026-10-02 the user gave a standing instruction to keep all five alternatives at the same functionality "even after we choose one", and hasn't changed it. So C is the selected target, and `a`, `b`, `d` and `e` stay active alternatives. On the same date the user also said "just for reference". That doesn't override an instruction written specifically for the period after selection, and the rows record parity, so the record establishes each candidate's role and I ask no question. The request names no alternative, so the pass covers all five.

**Actions**

1. `ui-ux/alternatives/a/` to `e/`: add the weekly recurring option to each, in its own layout, navigation and interaction style.
2. Rendered inspection from disk: go from the launcher into each candidate and run the same recurring paths and checks as in Scenario A. Result: all five pass, so the pass is complete.
3. Recapture `alternatives/c/runtime-evidence.json`, because the selected candidate's files changed. Any shared files outside `alternatives/` that changed also count toward that evidence.
4. `ui-ux/specification.md`:
   - C: mark the booking journey's Prototype Review row `Reviewed`, with today's evidence. Clear TICKET-0012's pending row if there is one and keep unrelated rows. Add the recurring option to the named scope in Required prototype coverage if nothing else is pending there.
   - Rows `a`, `b`, `d`, `e`: "Active alternative — kept at parity by standing instruction; booking journey incl. weekly recurring option (TICKET-0012), verified 2026-11-05".
   - The selection, the Decision Attribution and the Active comparison note about the standing instruction stay unchanged.
5. Refresh the affected captures of any candidate that has a deck. No ticket edits, no attribution. `validate-ui-ux-design.mjs`: PASS.

**Message to the user**

> Following your standing instruction to keep all five alternatives at the same functionality, I added the weekly recurring-booking option to every one: C (your implementation target) and A, B, D and E, each in its own style. I checked all five by opening the prototype launcher directly from disk, at desktop, tablet and phone widths, with keyboard as well as mouse. All five work: creating a weekly series, seeing it on the confirmation, finding it again when you return to the booking, cancelling before submitting, and recovering from a payment failure without a duplicate booking. Single bookings still work.
>
> Files changed: `ui-ux/alternatives/a/`–`e/` (including C's recaptured runtime evidence) and `ui-ux/specification.md` (review evidence, the five alternative rows; the TICKET-0012 pending entry is cleared). C remains the implementation target. The UI/UX validator passes, but it checks structure only. My walkthrough is a heuristic check, not user testing or your approval of the new screens. I recorded no Agent-chosen design decisions.

### D2

**Routing and scope.** "Only B for this demo" explicitly limits this pass, so it covers `b` alone even though the parity instruction stands. Limiting the pass selects nothing. C remains the target, `a`, `c`, `d` and `e` stay active, and the standing parity instruction stays in force for later passes. Gaps in the other active alternatives are reported as information, not asked about. TICKET-0014 was approved after the initial reviewed prototype, so the selected target C needs a recorded pending entry.

**Actions**

1. `ui-ux/alternatives/b/`: show the cancellation fee before the confirm step, in B's own treatment. Keep the change inside `b/`. If D1 used shared prototype logic, don't alter shared files in a way that changes other alternatives: that would go beyond this pass and make C's runtime evidence stale.
2. Rendered inspection from disk: go from the launcher into `b` and check the cancellation path:
   - the fee is visible before confirming;
   - backing out keeps the booking;
   - confirming cancels it, consistent with the fee shown;
   - a recurring booking behaves as the TICKET-0014 requirements state, where they cover it.

   Also check keyboard and desktop, tablet and phone widths. Result: pass, and the pass is complete.
3. `ui-ux/specification.md`:
   - Row `b`: "Active alternative — kept at parity by standing instruction; booking journey incl. weekly recurring option and cancellation-fee display (TICKET-0014), verified 2026-11-05 in a pass limited to B by the user".
   - Rows `a`, `d`, `e`: still "Active alternative — kept at parity by standing instruction", plus "parity gap: cancellation-fee display (TICKET-0014) not yet added; 2026-11-05 pass limited to B".
   - C, the selected target: make sure Change Synchronization has a pending row for C's cancellation journey anchor, linking the canonical owner and the TICKET-0014 ticket file, and add it if the ticket recording didn't. Leave it uncleared. Required prototype coverage becomes `Incomplete — cancellation journey pending TICKET-0014`.
   - The selection, the Decision Attribution and the standing-instruction note stay unchanged.
4. C's files and the shared files are unchanged, so C's runtime evidence stays valid. Refresh B's affected captures if B has a deck. No ticket status change. `validate-ui-ux-design.mjs`: PASS.

**Message to the user**

> As you asked, I added the cancellation-fee display to B only. I checked it by opening the prototype launcher directly from disk, at desktop, tablet and phone widths, with keyboard as well as mouse. It works: B shows the fee before you confirm a cancellation, backing out keeps the booking, and confirming cancels it consistently with the fee shown.
>
> Because you limited this pass to B:
> - **C, your implementation target, doesn't show the fee yet.** I recorded it as pending prototype work in `ui-ux/specification.md`. C's cancellation journey counts as incomplete, and isn't ready for UI implementation, until it's synchronized.
> - **A, D and E don't show it either.** I noted the gap in each of their rows.
>
> This doesn't select B; C remains the target. Your standing instruction to keep all five alternatives at the same functionality still applies, so the next prototype pass that isn't limited will add the fee display to A, C, D and E.
>
> Files changed: `ui-ux/alternatives/b/` and `ui-ux/specification.md`. The UI/UX validator passes, but it checks structure only. My walkthrough is a heuristic check, not user testing or your approval. I recorded no Agent-chosen design decisions.

<!-- responses-B.md -->

Skill files read: `SKILL.md`; `references/ui-ux-design.md`; `references/ui-ux/design-workflow.md` (in full, especially "Keep Active Alternatives Comparable", "Optional Review Slideshows" and "Discovery And Later Synchronization"); `references/ui-ux/templates/specification.md`; `references/staged-design-workflow.md`; `references/checkpoint-workflow.md`; and the "Ticket And Canonical Owner Synchronization" and "Validation" sections of `references/implementation-detail-tickets.md` (lines 240–288, located by searching that file for prototype rules).

### Scenario B

### How the agent reads the moment

- The request explicitly asks for a prototype change, so it already authorizes the affected updates and the inspection. No checkpoint, approval or sync command is needed.
- No candidate is selected, so all five (`a`–`e`) are active alternatives. "Update B only for this demo" explicitly limits this pass to B. The pass therefore covers only B. It does not select B, `a`/`c`/`d`/`e` stay active, and any standing parity instruction stays in force for later passes. Every candidate's role is clear, so there is nothing to ask. The prototype-count, direction and slideshow questions are not raised for an ordinary update.
- Recurring weekly booking changes the create-booking step of the agreed comparison flow. That flow is the same in all five rows: arrival → availability → create booking → confirmation, plus cancellation and payment failure. So the change falls inside the comparison scope.
- Change Synchronization reads `None.`, but that does not mean the prototypes are current. TICKET-0012 changed create-booking requirements after the initial reviewed prototype, and none of the five candidates shows recurring bookings. The ticket's prototype work was never recorded. With no selected target, a parity gap in an unselected alternative belongs in that alternative's own table row, not in a pending journey row. Change Synchronization therefore stays `None.`, and the remaining gaps go into the `a`, `c`, `d` and `e` rows.

### Actions (paths relative to the software-design package)

1. **`ui-ux/alternatives/b/`** (B's existing page or pages and its local classic script or demo data):
   - Add the recurring weekly booking option to B's create-booking step, using B's own layout, navigation and controls.
   - Carry the TICKET-0012 behavior through the rest of the comparison flow in B, exactly as the updated canonical owners and specification requirements define it: how the series appears in the availability check and at confirmation, and how cancellation and payment failure apply to a recurring booking. Nothing is invented beyond those sources.
   - The one-off booking path stays as it was. No other candidate, shared resource or unrelated journey is touched.
2. **Rendered check of B:**
   - Open `ui-ux/index.html` directly from disk, not through a localhost preview, and follow the launcher to B.
   - Exercise these paths: arrival → availability → create a weekly recurring booking → confirmation; cancellation and payment failure with recovery on the recurring path; the unchanged one-off path.
   - Use desktop and phone viewports and keyboard-only operation.
   - If B uses browser storage, also test blocked storage and malformed stored data.
   - Result (given in the scenario): B passes, with no usability blockers.
3. **`ui-ux/specification.md`:**
   - **Alternatives table, B row:** coverage becomes the comparison flow plus the recurring weekly option (TICKET-0012), with the status kept as `Active alternative`. It also notes "recurring paths rendered-checked 2026-11-05, direct-file launcher, desktop and phone, keyboard; no blockers".
   - **`a`, `c`, `d`, `e` rows:** each stays `Active alternative` and gains "parity gap: recurring weekly booking option (TICKET-0012) not carried in; outside the B-only demo pass of 2026-11-05".
   - **Active comparison line:** notes that this pass was narrowed to B, so the comparison currently has a known feature gap on the recurring option.
   - **Prototype Review:** the comparison-flow journey row gets B-scoped evidence: the tool used, viewports, the direct-file check, the paths exercised and "no blockers". It also states that `a`, `c`, `d` and `e` have not been reviewed against TICKET-0012.
   - **Unchanged:** `Selected implementation target: Unresolved`, Direction selection, Covered-flow approval (the user has not reviewed the recurring path), Required prototype coverage (not complete, since no scope is selected), Decision Attribution, and Change Synchronization (`None.`).
4. **B's slideshow, if `ui-ux/alternatives/b/slides.html` exists:** re-capture the affected screens from the same walkthrough and rebuild the deck with `build-review-slideshow.mjs`. If the refresh fails, mark the deck outdated next to its links. If B has no deck, do nothing.
5. **Not changed:** TICKET-0012, canonical owners, the launcher, and candidates `a`, `c`, `d` and `e`.
6. **Validation:** run `node <skill-dir>/scripts/validate-ui-ux-design.mjs --root <package>`. It passes. No ticket validator is needed because no ticket file changed.

### Message to the user (verbatim)

> B now has the recurring weekly booking option, and it passed the check.
>
> **What changed in B:** On the create-booking step, B now offers the weekly repeat option from TICKET-0012, using B's own layout and controls. Confirmation, cancellation and payment failure in B now follow the updated requirements for a recurring booking. Booking a single slot works as before, and nothing else in B changed.
>
> **How I checked it:** I opened the prototype launcher directly from disk, the way a recipient would, and went to B. I booked a weekly recurring slot from arrival through to confirmation. I also tried cancelling it, tried a payment failure and its recovery, and made sure a one-off booking still works. I did this at desktop and phone widths and with the keyboard only, and found no blockers. The structure validator also passes. This was my own walkthrough, not user testing, and you haven't reviewed the recurring path yet.
>
> *[Only if B already has a slideshow:]* B's slideshow now uses fresh screenshots that include the new screens.
>
> **Before the demo:**
> - **Only B has recurring bookings.** A, C, D and E are still active alternatives, but this pass didn't touch them, so they don't show the option. If you compare them side by side tomorrow, that difference is missing functionality, not a difference in design direction. I've noted the gap on each of their rows in the specification.
> - **B is still not the chosen design.** Updating it for the demo doesn't select it, and the implementation target is still open.
> - **The change list was out of date.** It said there was no pending prototype work, even though TICKET-0012 had changed the booking requirements since the prototypes were reviewed. All five were missing recurring bookings with no record of it. That gap is now recorded for A, C, D and E.

### Report

- **Files changed:**
  - B's candidate files under `ui-ux/alternatives/b/`
  - `ui-ux/specification.md`: alternatives table (all five rows), the Active comparison line, and Prototype Review evidence
  - `ui-ux/alternatives/b/slides.html`, only if it already existed
- **Claims and their evidence:**
  - Structure: `validate-ui-ux-design.mjs` passes.
  - Rendered interaction: B's recurring and affected comparison paths were exercised from disk at desktop and phone widths with the keyboard, with no blockers. This is a heuristic agent review.
  - Not claimed: the user's approval of the recurring path, a selected target, Stage 7 UI completion, required prototype coverage, or user testing.
- **Pass status:** complete for its scope, B only. Parity gaps remain as information in `a`, `c`, `d` and `e`. They were not updated or verified because the user narrowed this pass, and their gaps are recorded in their own rows.
- **Decisions:** no new design decisions were recorded. B presents the option with its existing patterns, and the behavior comes from TICKET-0012's canonical owners. The selection stays `Unresolved`.
- **Tickets and canonical owners:** unchanged. TICKET-0012's prototype work is now recorded in the specification through the alternatives' rows.

<!-- responses-EFG.md -->

Skill files read: `SKILL.md`; `references/checkpoint-workflow.md`, which includes Before Asking and the routine-versus-material map/geocoding example; `references/decision-attribution.md`; `references/ui-ux-design.md`; `references/ui-ux/README.md`; `references/ui-ux/design-workflow.md`; `references/ui-ux/templates/specification.md`; `references/staged-design-workflow.md`; `references/package-layout.md`; `references/system-model-format.md`; `references/planning-execution-contract.md`; `references/implementation-detail-tickets.md`; `references/technical-constraints.md`; and the templates `assets/templates/build/responsibility-tickets.yaml`, `assets/templates/build/technical-constraint.md` and `assets/templates/system-model/contracts/security.md`. Package IDs and slugs below, such as `SR-xxx`, `TICKET-NNNN`, `IFACE-xxx`, `CONS-xxx` and `<sites>`, stand for the package's actual site-records responsibility and its next free identifiers. Validator and inspection results appear as bracketed placeholders because this simulation does not invent their output.

### Scenario E

**How Before Asking applies.** The standing instruction covers routine details only. The map display library is routine as long as it adds no cost, account or outside data recipient, so I decide it myself. How locations are stored, whether users place them, and whether addresses go to a paid external geocoder is a material product and provider choice. Nothing approved or delegated covers it, so I ask. All other work on the screen continues.

**Actions**

1. **Investigate.** I re-read the brief line, the site-records responsibility, its ticket file and `ui-ux/specification.md`. I confirm that no ticket answer, approval or delegation covers the location model, an external provider or a paid service.
2. **Map library: decided.** I choose MapLibre GL JS. It is open source (BSD-3-Clause) and needs no account, key or licence fee. Its base map must come from a source that adds no cost, account or outside recipient, so no third-party tile service is allowed. Build Design picks the concrete tile hosting within that limit. The choice only applies if sites end up with coordinates. I record it in `ui-ux/specification.md` under `## Decision Attribution`:
   - Origin: Agent-chosen.
   - Evidence: "Chosen during the approved Stage 7 site-details pass under the user's instruction: \"Decide the routine details yourself and record them as Agent-chosen; only bring me real product decisions.\" Adds no cost, account, or external data recipient."
   - Conditions: None.

   It gets no ticket because it is reversible local discretion. If a ticket for it already exists, I resolve it there with the same entry instead.
3. **Location question: tracked, not decided.** In `build/workflow/tickets/<sites>/sr-xxx/sr-xxx-tickets.yaml` I create `TICKET-NNNN`, "Choose how a site's location is captured and stored". If a ticket for this already exists, I refresh it instead.
   - Classification: `status: "todo"`, `kind: "product"`, `complexity: "medium"`, `concern: "data-model"`.
   - Kind note: "This ticket chooses what location data is stored, who sets it, and whether customers' addresses go to an outside service. No data-disclosure or workflow contract is fixed yet that a mechanism could realize, so the kind is product, not technical."
   - `candidate_proof`: "An implementer cannot finish or verify the location part of the site details screen without choosing whether a site's location is address text, a manager-placed pin, or geocoded coordinates, and the current package does not already choose it."
   - It also gets the three options below, the recommendation, and write targets: the site-records responsibility record and `ui-ux/specification.md`. It has no attribution because it is unanswered.
4. **Continue unaffected work.** I write the name, contact and schedule requirements and their prototype states. The location area shows the recommended option as a clearly labelled exploration hypothesis. Its map is a local static image with fake sites, because prototypes may not load remote tiles. The specification marks the location part of the site-details journey as not reconciled until `TICKET-NNNN` is answered.
5. **Validate.** I run `validate-implementation-detail-tickets.mjs` and `validate-ui-ux-design.mjs`, then `generate-decision-overview.mjs` followed by its `--check`. No address goes anywhere and no provider is contacted.

**Message to the user (verbatim)**

> One product decision is needed for the site details screen; the rest of the screen (name, contact, schedule) is moving ahead.
>
> The brief says the screen shows where each site is, but not how a site's location gets into the system. The answer decides what we store, who does the work, and whether customers' work-site addresses leave our system. For example, take a site on a farm road with no street number:
>
> 1. **Address text only.** The site manager types the address and the screen shows that text, with no map. There is no outside recipient and no cost, but the farm-road site is described only by its words.
> 2. **Address plus a pin the site manager places.** The manager types the address and drops a pin on a map, and we store both. There is no outside recipient and no per-request cost. Each new site takes the manager a moment, and the pin is only as accurate as they place it.
> 3. **Address plus automatic geocoding.** The system sends each work-site address to an external geocoding service and stores the coordinates it returns. Nobody has to place anything, but customers' addresses go to an outside company (depending on your contracts, under a data-processing agreement) and every request is charged.
>
> I recommend **2**. It shows exactly where each site is without adding an outside recipient or a running cost, assuming site managers can recognise their site on a map. Geocoding could later suggest the pin if you approve a provider. If you prefer 3, tell me which provider may receive the addresses and the monthly spending limit.
>
> Which option should I use?
>
> As you asked, I chose the map display myself: MapLibre GL JS. It's open source and needs no account, key or licence fee, and its base map is served without any third-party tile service. I recorded it as Agent-chosen in the UI/UX specification. It only matters for options 2 and 3.

**Report**

- **Files changed:**
  - `ui-ux/specification.md`: site-details requirements, the location area marked unreconciled, and the Decision Attribution row.
  - The site-details candidate under `ui-ux/alternatives/<candidate>/`.
  - `build/workflow/tickets/<sites>/sr-xxx/sr-xxx-tickets.yaml`: `TICKET-NNNN`.
  - `build/workflow/decision-overview.md`: regenerated.
- **Agent-chosen this pass:** the map display library, owned by `ui-ux/specification.md`.
- **Open:** `TICKET-NNNN` (todo, product). It holds back only the location part of the site-details journey. Name, contact and schedule are unaffected.
- **Not claimed:** the site-details journey is not reconciled or reviewed, and Stage 7 UI is not complete.
- **Validation:** [actual validator and overview-check output].

### Scenario F

**How Before Asking applies.** The user explicitly delegated location capture and storage, including whether to geocode, and set boundaries: only the existing EU provider, under the signed data-processing agreement, within the €50 monthly mapping budget, and no other outside recipients. Geocoding with that provider costs about €5 a month and handles every address format in the approved site list. The best approach therefore stays inside every boundary, so I decide it, record it and ask nothing.

**Actions**

1. **Investigate.** I re-read the brief line, the site-records responsibility, any ticket on site location, the specification and both user instructions. I confirm the €5 a month estimate and the address-format coverage.
2. **Decide.** All of the following are Agent-chosen:
   - **Capture.** The site manager types the address. When an address is created or changed, the system sends only the address text, never the customer name, contact or schedule, to the existing EU provider. It shows the returned pin, which the manager confirms or drags to the site entrance, and then saves.
   - **Storage.** We store the address text, the coordinates, and whether the pin was geocoded or placed by hand.
   - **When geocoding runs.** Only on create or address change, never when the screen is viewed, so cost follows site edits rather than views.
   - **Failure path.** If the provider is unreachable or returns no match, the manager places the pin by hand. A location is required before saving, so every site keeps showing where it is.
   - **Map display.** MapLibre GL JS, with no third-party tile service, because a tile host would be an "other outside recipient".
3. **Record attribution.** If the open point already has a ticket, I set it to `decided` with the resolution and the attribution below. I move it to `finished` once every write target holds the resolution and the validators pass. If it has no ticket, I don't create a retrospective one. The same entries then go in a `## Decision Attribution` section of the site-records responsibility record.
   - **User specified** (`human-approved/user-specified`):
     - Decision: "Site addresses may be sent only to the existing EU geocoding provider, under the signed data-processing agreement and within the existing €50/month mapping budget; no other outside recipients."
     - Evidence: User, today: "You decide how site locations are captured and stored, including whether to geocode. Site addresses may go to our existing EU geocoding provider under our signed data-processing agreement, within the existing €50 a month mapping budget. No other outside recipients."
     - Conditions: `Requirement: No outside recipient other than the existing EU geocoding provider receives site addresses.` and `Requirement: Geocoding spend stays within the existing €50 per month mapping budget.`
   - **Agent-chosen** (`agent-chosen`):
     - Decision: the capture, storage, timing and failure design above.
     - Evidence: chosen during the Stage 7 site-details pass under that delegation. Expected cost is about €5 a month at expected volume, and the provider handles every address format in the approved site list. The €50 is a ceiling the user set, not an approved €5 setting.
   - **Map library:** recorded as Agent-chosen in `ui-ux/specification.md`, with the same entry as Scenario E.
4. **Write canonical owners.** The delegation authorizes recording the decision, so these upstream edits need no new checkpoint:
   - **Site-records responsibility.** Update Owns, Inputs And Outputs, State And Artifacts, and Failure And Recovery: location data, the outbound address, and the pending or manual-placement recovery.
   - **New external interface.** `system-model/contracts/interfaces/iface-xxx-eu-geocoding-provider.md` gets `ACT-001` (`external-system`): it geocodes one address, takes only the address text, and returns coordinates or no match. Unavailable or no match leads to manual placement. Risk is ordinary.
   - **Site create/edit flow.** If a flow covers site creation or editing, add the geocoding step and its manual-placement reroute.
   - **Technical constraint.** Add `build/records/constraints/cons-xxx-site-address-recipients.md`: "Site address data must not be sent to any outside recipient other than the existing EU geocoding provider under its data-processing agreement." Its verification intent is boundary checks on outbound requests that carry address data. Link it through `constraint_refs` and `source_tickets` when a ticket exists, and `source_tickets: None.` otherwise.
   - **UI/UX specification.** Add the location section, its confirm-pin step, and the states: locating (waiting), located (success), no match or provider unavailable leading to placing the pin by hand (error and recovery), and cancelling an edit, which keeps the previous location.
   - **Domain guide.** Update `guide/domains/<sites>.md`, and the architecture guide if it lists external systems.
5. **Prototype.** In the active discovery pass I update the site-details candidate with a local static map image and fake sites. I exercise its confirm, drag, failure and cancel paths and open `ui-ux/index.html` from disk at desktop and phone widths. I record the tool and findings under Prototype Review.
6. **Validate.** I run, in order: `validate-software-design-structure.mjs`, `validate-implementation-detail-tickets.mjs`, `sync-technical-constraint-sources.mjs`, `validate-technical-constraints.mjs`, `validate-ui-ux-design.mjs`, and `generate-decision-overview.mjs` followed by its `--check`.

**Message to the user (verbatim)**

> Site locations are decided and recorded; nothing is needed from you.
>
> Here's how it works:
>
> - The site manager types the address.
> - When an address is new or changes, we send just that address to your existing EU geocoding provider.
> - The manager sees the pin it returns, confirms it or drags it to the right spot, and we store the address and the pin.
> - If the provider can't be reached, the manager places the pin by hand, so every saved site has a location.
>
> Geocoding only runs when an address is saved, not when the screen is viewed. That comes to about €5 a month, inside your €50 mapping budget. Addresses go to no one else, and the map itself uses an open-source library with no third-party tile service.

**Report**

- **Agent-chosen decisions recorded:**
  - The location capture, storage and failure design, owned by `TICKET-NNNN` if a ticket exists, otherwise by the site-records responsibility record.
  - The map display library, owned by `ui-ux/specification.md`.
- **User-specified:** the recipient and budget boundary, recorded beside them as a Requirement and carried into `CONS-xxx`.
- **Files changed:**
  - The site-records responsibility record.
  - `iface-xxx-eu-geocoding-provider.md`.
  - The site create/edit flow, if one exists.
  - `cons-xxx-site-address-recipients.md`.
  - The ticket, if one exists.
  - `ui-ux/specification.md`.
  - The site-details candidate.
  - The domain guide.
  - `build/workflow/decision-overview.md`.
- **Scope:** the location part of the site-details journey is designed and prototyped. "Reviewed" is claimed only for what the rendered inspection actually covered: [tool, viewports, findings]. This is heuristic agent review, not user testing. Stage 7 UI completion is not claimed.
- **Validation:** [actual output]. The ticket becomes `finished` only after these pass.

### Scenario G

**How Before Asking applies.** The delegation and boundaries are the same as in Scenario F. The new fact is that the EU provider cannot geocode about 40% of sites: rural sites without street numbers. The US provider that can is outside both user-set boundaries. It is not covered by the data-processing agreement, and it costs about €120 a month against a €50 budget. Placing a pin by hand works for any site. So a design inside the boundaries still fully meets "shows where each site is", and I decide it myself. I don't use, trial or send any address to the US provider. Because the requirement is still met, there is nothing to ask. I only mention the excluded option so the user knows about it.

**Actions**

1. **Investigate.** Same as Scenario F, plus a check of the EU provider's results on the approved site list. This confirms the gap is rural sites without street numbers, about 40%.
2. **Decide.** All of the following are Agent-chosen:
   - **Address entry.** The site manager types the address. On create or address change, only the address text goes to the EU provider.
   - **Street-level match.** The manager confirms or drags the returned pin.
   - **No street-level match or provider unreachable.** The manager places the pin by hand. The map opens on the best area the provider returned, such as the village, and otherwise on the region.
   - **Location required.** A location is required before saving, so the requirement is never weakened.
   - **Storage.** We store the address text, the coordinates, and whether the pin was geocoded or placed by hand.
   - **Cost.** Geocoding runs only on create or address change, which stays at about €5 a month or less.
   - **Map display.** MapLibre GL JS, with no third-party tile service.
   - **Not used.** The US provider.
3. **Record attribution.** Same placement and user-specified entry as Scenario F. The Agent-chosen entry's evidence adds: "The existing EU provider cannot geocode rural sites without street numbers (about 40% of sites). A US provider that can is not covered by the data-processing agreement and costs about €120/month against the €50 budget, so it is outside the user's boundaries and was excluded. Manual pin placement works for any site." If a ticket exists, its context lists the US provider as a considered alternative and gives the reason for rejecting it.
4. **Write canonical owners.** Same as Scenario F, with these differences:
   - **Interface.** In `iface-xxx-eu-geocoding-provider.md`, "no street-level match" is an expected outcome that routes to manual placement.
   - **Technical constraint.** `CONS-xxx` keeps addresses away from every other recipient, so it rules out the US provider unless the user later changes the boundary.
   - **Specification.** Manual pin placement is a primary path, used for about 4 in 10 sites, rather than an edge case. It needs a clear prompt, a map centred on the found area, and keyboard operation: arrow keys move the pin as well as dragging. Its states are the same as in Scenario F, plus "no street-level match, place the pin".
5. **Prototype and validate.** The prototype includes a rural site with no street number. Inspection and validators are as in Scenario F.

**Message to the user (verbatim)**

> Site locations are decided and recorded; nothing is needed from you.
>
> Your EU geocoding provider can't locate rural sites that have no street number, which is about 4 in 10 sites. For those:
>
> - The site manager places the pin by hand when creating the site or changing its address.
> - The map opens on the nearest area the provider could find, such as the village.
>
> All other addresses are located automatically and the manager just confirms the pin. Every saved site has a location. Addresses go only to the EU provider, and the cost stays around €5 a month.
>
> I didn't use the US provider that can locate those rural sites. It isn't covered by your data-processing agreement, and it costs about €120 a month against your €50 budget, so it's outside the limits you set. Hand-placed pins cover those sites fully, so there's nothing to decide. Using that provider later would need your approval of it as a recipient and of the extra cost.

**Report**

- **Agent-chosen decisions recorded:**
  - The capture design (EU geocoding, required manual pin when there's no match, storage, and geocoding only on save), owned by the ticket if one exists, otherwise by the site-records responsibility record.
  - The map display library, owned by `ui-ux/specification.md`.
- **User-specified:** the recipient and budget boundary, recorded as a Requirement and as `CONS-xxx`.
- **Rejected:** the US provider, because it exceeds both user-specified boundaries. No address was sent to it.
- **Files changed:** same set as Scenario F.
- **Scope:** the site-details location journey, including the manual-pin path, is designed and prototyped. Review claims are limited to [the rendered inspection actually performed]. Stage 7 UI completion is not claimed.
- **Validation:** [actual output].

<!-- responses-G2.md -->

Skill files read: `SKILL.md`; `references/checkpoint-workflow.md` (Before Asking, Active Section Passes); `references/decision-attribution.md`; `references/implementation-detail-tickets.md`; `references/technical-constraints.md`; `references/ui-ux-design.md`; `references/ui-ux/README.md`; `references/ui-ux/design-workflow.md`; `references/ui-ux/templates/specification.md`; `references/staged-design-workflow.md`; `references/package-layout.md`; `references/system-model-format.md`; `references/planning-execution-contract.md`.

### Scenario G2

### Actions

1. **Map-library open point: decided by me (routine, within delegation).** Its ticket moves to `decided` with one `agent-chosen` entry. The choice is MapLibre GL JS, an open-source library with no account or fee. The background map is served from our own hosting, so viewing a site's map sends nothing to an outside party. The marker is display-only. Evidence: "Chosen in the Stage 7 site-details pass under the user's instruction to decide routine details and record them as Agent-chosen; adds no fee, account or outside recipient." The ticket stays `decided` until Stage 8 records the library as an Implementation Selection. If serving the map ourselves turns out to need new spend or a new provider, I bring that back to the user instead of picking a tile service.

2. **Location capture-and-storage ticket** (owning site responsibility's `build/workflow/tickets/<site-domain>/sr-xxx/sr-xxx-tickets.yaml`). It stays `todo` with `resolution: null`. Its dependencies are unchanged and its dependents keep waiting.
   - **New attribution entries for the parts the user settled:**
     - The brief requirement, in its own words: "the site details screen shows where each site is" and "Site managers never place or adjust map pins; each site's location comes from its address automatically." Origin `human-approved/user-specified`, evidence: approved software brief, site-details section. If the brief's review record shows the wording came from intake rather than the user, I use `human-approved/agent-recommended`.
     - Today's boundary: origin `human-approved/user-specified`. Evidence: User (2026-11-05): "Site addresses may go to our existing EU geocoding provider under our signed data-processing agreement, within the existing €50 a month mapping budget. No other outside recipients." Conditions: `Requirement: Site addresses go to no outside recipient other than the existing EU geocoding provider under the signed data-processing agreement.` and `Requirement: Mapping spend stays within the existing €50 a month budget.`
   - **`context` now states what is established under the user's delegation.** The server geocodes a site's address with the existing EU provider whenever the address is created or changed, for about €5 a month. The resulting position is stored on the site with the address it came from, the provider and the time. No role has a control to place or move a location. It also states the limitation: the EU provider cannot locate rural addresses without street numbers, about 40% of sites. The only provider found that can is US-based, outside the data-processing agreement, and costs about €120 a month. These delegated choices become `agent-chosen` entries when the ticket is decided. Open tickets carry entries only for parts the user settled, so they are not attributed yet.
   - **`question`, `options` and `recommendation` are narrowed to the remaining part:** the sites the EU provider cannot locate. They hold options A, B and C and the recommendation from the message below.
   - **`kind` changes from `technical` to `product`.** Review note: "This ticket chooses whether site addresses may go to an additional outside provider at extra cost, or whether the promised location display narrows. The brief's promise and the user's recipient and budget limits are fixed, and the mechanism for addresses that can be located is already within my delegation. Therefore the kind is product: data disclosure and promised behavior." `complexity: medium`.
   - **Nothing from this ticket goes into canonical owners yet.** That covers the site responsibility, the location state contract, the flow, the UI spec requirements and any CONS record. A CONS for the address-recipient rule is created only when the ticket is decided.

3. **UI work that doesn't depend on the answer continues.**
   - In `ui-ux/specification.md` and the selected candidate's site-details page, the settled name, contact and schedule content is laid out. The location section always shows the address and, for a site with a stored position, a display-only map with one marker. No role gets a pin control.
   - States covered:
     - Locating: the address was just saved and its position is being looked up.
     - Located.
     - Lookup temporarily unavailable: the system retries and the manager has nothing to do.
   - "No map location for this address" is added only as a labelled exploration hypothesis tied to the open ticket, not as approved behavior.
   - The site-details journey's Prototype Review row reads `Blocked — location decision for addresses the EU provider cannot locate is open (ticket link)`.
   - The prototype uses a local static map image, because prototypes may not load remote tiles. I open the launcher from disk and inspect the page at desktop and phone widths.

4. **Not done:**
   - No address was sent to the US provider, not even as a trial.
   - The budget and the brief are unchanged.
   - The design is not described as meeting the location requirement.

5. **Validation run after the edits:**
   - `validate-implementation-detail-tickets.mjs` and `validate-technical-constraints.mjs`
   - `validate-ui-ux-design.mjs`
   - `generate-decision-overview.mjs`, then `--check`

   These are structural checks only. They show the two user-specified entries as part of an open question.

### Message to the user (verbatim)

> **Site details: map and site locations**
>
> I've settled the routine parts myself and recorded them as Agent-chosen:
> - **Map display:** MapLibre GL JS, an open-source library with no account or fee. The background map comes from our own hosting, so looking at a site's map sends nothing to any outside party. The marker is display-only. Nobody gets a control to place or move it.
> - **Locations:** when a site's address is saved or changed, the server looks it up with your existing EU geocoding provider. It stores the resulting position on the site, along with the address it came from. That costs about €5 a month, well inside the €50 budget. Site managers never touch the location.
>
> There's one thing I can't settle within your limits. The EU provider can't locate rural addresses without street numbers, which is about 40% of our sites. For those sites the screen would show the address but no map position. That doesn't meet the brief: "the site details screen shows where each site is" and "each site's location comes from its address automatically". I've kept that requirement as written and haven't marked the design as meeting it.
>
> The only provider I found that locates those addresses reliably is based in the US. It isn't covered by your data-processing agreement and costs about €120 a month. Using it would send those sites' addresses to a recipient you've excluded and raise mapping spend to about €125 a month. I haven't sent it anything.
>
> **How should we handle sites the EU provider can't locate?**
> - **A. Add the US provider for those addresses only.** Every site appears on the map, as the brief says. This needs a data-processing agreement covering that provider, signed before any address goes to it, and a mapping budget of about €125 a month.
> - **B. Stay within your current limits.** Those sites show their address with a clear "No map location for this address" note, and nobody places pins. The brief's promise becomes "shows where each site is when its address can be located automatically", which covers about 6 in 10 sites.
> - **C. Stay within your limits, but let office staff set the position for those sites.** Site managers still never would. Every site appears on the map, but about 40% of positions would be set by hand rather than taken from the address, and someone has to own that task.
>
> **My recommendation is A.** It's the only option that keeps the brief as written, and the US provider would receive only the addresses the EU provider can't resolve. This assumes a map position matters for rural sites, which are the hardest to find from an address without a street number. If the recipient or budget limit is firm, B is the closest alternative.
>
> Meanwhile I'm continuing the rest of the site details screen: name, contact, schedule, and the map for sites that can be located. The "no map location" state stays a labelled draft until you decide.

### Report

- **Changed:**
  - the map-library ticket (`decided`, Agent-chosen)
  - the location ticket (still `todo`; two User specified part entries; question narrowed to the addresses the EU provider can't locate; kind changed to `product`)
  - `ui-ux/specification.md` and the selected candidate's site-details page (address-independent states only; the "no location" state is a labelled hypothesis)
  - the regenerated decision overview
- **Agent-chosen:**
  - MapLibre GL JS with a self-hosted background map, recorded now on the map-library ticket.
  - EU-provider geocoding on address save, with the position and the address it came from stored on the site, and no location controls for any role. This is chosen under the user's delegation and is recorded as Agent-chosen on the location ticket when that ticket is decided.
- **Open:**
  - The location ticket is a product decision. It conflicts with the approved brief requirement under the user's recipient and budget limits.
  - The site-details location journey cannot be reconciled until it is answered, so Stage 7 UI completion is not claimed for that journey.
  - Name, contact, schedule and the located-site map continue unaffected.
- **Next, depending on the answer:**
  - **A:** add a CONS record for the address-recipient rule. Record the condition "signed data-processing agreement before any address is sent" and the new budget on the entry. Then write the answer to the canonical owners.
  - **B or C:** repair the brief requirement and canonical owners as the user's answer authorizes, then design the chosen state as product behavior.


---

<!-- second round: post-review recheck against the revised final wording; trial files responses-BDH.md, responses-G3.md; text verbatim, headings demoted one level -->

## Second round post-review recheck (Scenarios B, D, H and G3)

<!-- responses-BDH.md -->

Skill files read: `SKILL.md`; `references/ui-ux-design.md`; `references/ui-ux/README.md`; `references/ui-ux/design-workflow.md` (in full, especially Keep Active Alternatives Comparable, rendered inspection, Link And Maintain, Discovery And Later Synchronization); `references/ui-ux/templates/specification.md`; the Selected-tag markup in `references/ui-ux/templates/index.html` (grep); `references/decision-attribution.md`; `references/checkpoint-workflow.md`; `references/staged-design-workflow.md`; and `references/implementation-detail-tickets.md` (Ticket Statuses through Validation, including the later-prototype exception). I also grepped `scripts/lib/validation/ui-ux-design.mjs` to see how it reads the selection line and Change Synchronization.

### Scenario B

**How I read the request.** The user asked for a specific prototype change, which already authorizes the edit and the rendered check. No checkpoint and no approval prompt are needed. No standing parity instruction is recorded, and the request names B and says "only", so this pass covers `b` alone. All five candidates are unselected active alternatives, and narrowing the pass to B does not select it. TICKET-0012's requirements are already in the canonical owners and the specification, so nothing needs deciding and I ask no question.

**Actions**

1. `ui-ux/alternatives/b/`: add the recurring weekly booking option exactly as the updated specification requirements and canonical owners define it. Build it into B's own layout, navigation and interaction treatment. Edit only B's own files, not any shared resource under `ui-ux/`, so that `a`, `c`, `d` and `e` stay untouched. Keep demo data in classic scripts with relative paths so the prototype still works when opened as a file.
2. Rendered inspection: open `ui-ux/index.html` directly from disk with the available browser tool and follow B's card. Exercise the affected paths:
   - choose a weekly repeat, create the booking, see the confirmation, and check that the result persists on return;
   - cancel before submitting and check that the prior state is preserved;
   - trigger a payment failure on a recurring booking and recover from it.

   Run these at desktop and phone widths, with keyboard operation and visible focus. If B uses storage, also check blocked and malformed storage. Result: pass, no findings.
3. `ui-ux/specification.md`:
   - **B's alternatives row:** `Active alternative — arrival → availability → create booking (including the recurring weekly option, TICKET-0012) → confirmation, plus cancellation and payment failure; recurring option inspected by direct-file launcher check, desktop + phone, keyboard`.
   - **Rows for A, C, D and E:** `Active alternative — arrival → availability → create booking → confirmation, plus cancellation and payment failure; parity gap: recurring weekly booking option (TICKET-0012) not carried in`.
   - **Prototype Review:** add rendered-inspection evidence for the create-booking journey, explicitly limited to B (tool, viewports, direct-file check, findings `None.`).
   - **Unchanged:** `**Selected implementation target:** \`Unresolved\``, Direction selection, Active comparison (all five, no standing instruction) and Decision Attribution. This pass makes no decision.
   - **Change Synchronization stays `None.`** A parity gap in an unselected active alternative belongs in that alternative's row, not in a pending journey row.
4. No ticket, canonical owner, launcher card or Build Unit changes. I do not raise the slideshow question. If B already had a `slides.html`, I would refresh its affected captures in this pass or mark them outdated. None is recorded, so there is nothing to do.
5. Run `node <skill-dir>/scripts/validate-ui-ux-design.mjs --root <package>`. It passes.

**Questions to the user:** none.

**Report to the user (verbatim)**

> B now has the recurring weekly booking option, and I checked it.
>
> B's booking step offers the weekly repeat as the updated requirements describe, in B's own layout. I opened the prototype launcher straight from disk, as your client would, and walked B through these paths at desktop and phone widths and by keyboard. Everything worked, with no issues found:
> - arrival → availability → creating a weekly recurring booking → confirmation, which is still there when you come back
> - cancelling before submitting
> - a payment failure and its recovery
>
> The UI/UX validator passes.
>
> I changed only B, as you asked. A, C, D and E don't have the recurring option yet. I noted that gap in each of their rows in the UI/UX specification and changed nothing else about them. This doesn't select B: there's still no chosen implementation target, and all five remain active alternatives. When you want the others brought level, ask and I'll add it to each one in its own style.
>
> No Agent-chosen design decisions were recorded. The check above is my own walkthrough of the prototype, not user testing.

### Scenario D

### D1

**How I read the request.** This is an explicit prototype-change request, with no checkpoint needed. The standing parity instruction (user, 2026-10-02, recorded in the specification) is still in force, and the request does not limit this pass. So the pass covers the selected target `c` and the active alternatives `a`, `b`, `d` and `e`. The instruction asks for full functional parity, so the agreed scope is the whole approved interface, and the recurring option is in scope for all five. I ask nothing.

**Actions**

1. In each of `ui-ux/alternatives/a/` through `e/`: add the recurring weekly booking option exactly as TICKET-0012's updated requirements define it. Express it through each candidate's own layout, navigation and interaction treatment. Sharing logic between candidates is optional.
2. Rendered inspection of all five: open `ui-ux/index.html` from disk and follow each card. In each candidate, exercise the recurring create → confirmation path (persistent on return), cancellation before submitting, and the payment-failure/recovery states as the requirements apply them. Run these at desktop and phone widths, by keyboard. All five pass.
3. `c` is the selected target and renders with JavaScript, and its files changed, so any earlier `ui-ux/alternatives/c/runtime-evidence.json` is now stale. Recapture it with `scripts/capture-prototype-runtime.mjs`, covering:
   - all five interaction kinds, including the recurring-booking action;
   - two distinct reviewer targets;
   - no browser diagnostics.

   Keep the driver script outside `ui-ux/`.
4. `ui-ux/specification.md`:
   - **Prototype Review, `c`'s create-booking journey row:** `Reviewed`, with evidence (tool, viewports, direct-file launcher check, runtime receipt) and findings `None.`
   - **Change Synchronization:** remove the TICKET-0012 pending row if one was recorded, and keep any unrelated rows. If no rows remain, write `None.`
   - **Required prototype coverage:** if TICKET-0012 was the only gap, set it back to `Complete — <same named selected scope>`. Otherwise leave the other remaining gaps listed.
   - **Alternatives table:** in `c`'s row and in rows `a`, `b`, `d` and `e` (still `Active alternative — kept at parity by standing instruction`), add the recurring option to the coverage. Clear any TICKET-0012 parity gap that had been noted.
   - **Unchanged:** Selected implementation target (`./alternatives/c/index.html`), Decision Attribution, and the Active comparison note about the standing instruction.
5. If any candidate has a `slides.html`, refresh its affected captures in this same pass, or mark them outdated beside its links if capture fails.
6. TICKET-0012 is left unchanged; this is prototype synchronization only. No decision attribution changed, so the decision overview is not regenerated.
7. Run `validate-ui-ux-design.mjs --root <package>`. It passes, and C's fresh runtime receipt validates.

**Questions to the user:** none.

**Report to the user (verbatim)**

> All five prototypes now have the recurring weekly booking option, and each one works. You asked to keep all five at the same functionality, so I added it to every one in its own style, including C, your chosen implementation target.
>
> For each candidate I opened the launcher straight from disk and walked these paths at desktop and phone widths and by keyboard. No issues were found in any of them:
> - making a weekly recurring booking through to confirmation, which persists when you return
> - cancelling before submitting
> - a payment failure and recovery
>
> For C I also re-recorded the browser evidence of its interactions, because its files changed.
>
> In the UI/UX specification:
> - C's create-booking journey is marked reviewed.
> - The recurring-booking item is cleared from the pending prototype work.
> - All four other alternatives stay at parity with C.
>
> The UI/UX validator passes. No Agent-chosen design decisions were recorded. This is my walkthrough of the prototypes, not user testing.

### D2

**How I read the request.** The standing parity instruction still applies, but the request explicitly limits this pass ("Only B for this demo"), so the pass covers `b` alone. C remains the selected target and B is not selected. The standing instruction stays in force for later passes. TICKET-0014's requirements are already updated, and I ask nothing.

**Actions**

1. `ui-ux/alternatives/b/` only: show the cancellation fee before the user confirms a cancellation, as TICKET-0014's updated requirements define it, in B's own treatment. Do not edit shared resources under `ui-ux/`. That would change the other candidates and make C's runtime receipt stale.
2. Rendered inspection of B from disk. Open the cancellation journey and check that:
   - the fee is visible before confirming;
   - confirming leads to the cancelled result;
   - backing out leaves the booking intact;
   - any failure or recovery states the requirements define behave correctly.

   Run these at desktop and phone widths, by keyboard. Pass.
3. `ui-ux/specification.md`:
   - **B's row:** `Active alternative — kept at parity by standing instruction; includes the cancellation-fee display (TICKET-0014), inspected by direct-file launcher check, desktop + phone, keyboard`.
   - **Rows for A, D and E:** append `; parity gap: cancellation-fee display before confirming (TICKET-0014) not carried in`.
   - **C (selected target):** its gap is a pending journey row, not a row note. Change Synchronization keeps the row for C's cancellation journey (`Show the cancellation fee before confirming` · links to the TICKET-0014 ticket file and its canonical owner). If the TICKET-0014 recording pass did not already add that row, add it now, replacing `None.`
   - **C's coverage and review status:** Required prototype coverage reads `Incomplete — cancellation journey: fee display (TICKET-0014) pending`. C's Prototype Review row for that journey shows it as pending, not reviewed.
   - **Unchanged:** selection, Decision Attribution, and the Active comparison note recording the standing instruction.
4. C's `runtime-evidence.json` is untouched and still valid. Other alternatives fall outside its hashed inventory.
5. No ticket changes. Conditional slides refresh for B only, as in D1.
6. Run `validate-ui-ux-design.mjs --root <package>`. It passes. The pending row is a valid declaration, and I make no selected-scope readiness claim for C's cancellation journey.

**Questions to the user:** none.

**Report to the user (verbatim)**

> B now shows the cancellation fee before the user confirms a cancellation, and I checked it. I opened the launcher from disk and walked B's cancellation path at desktop and phone widths and by keyboard. The fee appears before confirming, confirming cancels, and backing out leaves the booking as it was. No issues were found, and the UI/UX validator passes.
>
> I changed only B for this demo, as you asked. Some things to know:
> - **C is behind.** C is your chosen implementation target and doesn't show the fee yet. Its cancellation journey stays listed as pending prototype work in the specification. Until it's updated, C's cancellation journey isn't ready to hand to implementation.
> - **A, D and E are behind too.** I noted the gap in each of their rows.
> - **B is not selected.** Narrowing this pass to B doesn't change your choice of C.
> - **Your standing instruction still applies.** You asked to keep all five at the same functionality, so the next prototype update you ask for without limiting it will bring A, C, D and E level.
>
> No Agent-chosen design decisions were recorded. This is my walkthrough of the prototype, not user testing.

### Scenario H

**How I read the request.** "Let's go with C." is the user's own choice of candidate, so it is recorded as Human-approved · User specified. It is a selection, not a prototype-change or synchronization request. The initial reviewed prototype is established, so I do not edit or render C's prototype now. No standing parity instruction exists, so after this selection `a`, `b`, `d` and `e` become retained snapshots. C's own row records a parity gap, and that gap moves to a pending journey row. Every candidate's role is clear from the record, so I don't need to ask how many alternatives to maintain.

**Actions**

1. `ui-ux/specification.md`, Prototype Alternatives And Selection:
   - `**Selected implementation target:** \`./alternatives/c/index.html\``
   - **Direction selection:** `Selected — <C's direction as named in its row>`.
   - **Active comparison:** `None — the user selected C; no standing parity instruction, so the other candidates are retained snapshots`.
   - **Covered-flow approval:** unchanged. Selecting a direction approves neither unreviewed journeys nor changed behavior.
   - **Required prototype coverage:** `Incomplete — C covers the bounded comparison flow (arrival → availability → create booking → confirmation, cancellation, payment failure); recurring weekly booking option (TICKET-0012) pending; remaining approved journeys and states outside the comparison flow not yet built`.
   - **Alternatives table:**
     - `c`: `Selected target — arrival → availability → create booking → confirmation, plus cancellation and payment failure; recurring weekly booking option pending (see Change Synchronization)`.
     - `a`, `d` and `e`: `Retained snapshot — arrival → availability → create booking → confirmation, plus cancellation and payment failure; lacks the recurring weekly booking option (TICKET-0012); not maintained, updated only on request`.
     - `b`: `Retained snapshot — same flow plus the recurring weekly booking option (TICKET-0012); not maintained, updated only on request`.
2. Change Synchronization: replace `None.` with one pending row. The row is: `| [Create booking](#<existing create-booking journey anchor>) | Add the recurring weekly booking option to C as the updated requirements define it | [TICKET-0012](<package-relative ticket file>) · <link to its canonical owner> |`.
3. `## Decision Attribution` in the specification (add the section if it is missing): `| Candidate C is the implementation target | Human-approved · User specified | User (2026-11-05, this session), after reviewing the candidates with their client (my summary of context): "Let's go with C." | None |`.
4. `ui-ux/index.html`: give C's card `class="card is-selected"` and a `<span class="tag">Selected</span>`. No other card changes. Open the launcher from disk to confirm the tag shows and all candidate links still work. If C already has a `runtime-evidence.json`, this launcher edit makes it stale, because the launcher is inside its hashed inventory, so recapture it now. Otherwise capture it in C's synchronization pass.
5. No prototype edits to any candidate, and no ticket changes; TICKET-0012's pending work is now recorded against C. If Build Units or handoffs existed, I would link C's entrypoint from their UI/UX Realization or coverage. None are in scope here.
6. Run:
   - `validate-ui-ux-design.mjs --root <package>`. It passes.
   - `generate-decision-overview.mjs --root <package>`, then `--check`. The Decision Attribution section changed, so the overview is regenerated in this pass.

**Question to the user (verbatim, at the end of the report):** "Shall I bring C up to date now, adding the recurring weekly booking option and checking it?"

**Report to the user (verbatim)**

> Recorded: C is your selected prototype and the implementation target for the booking experience. It's recorded as your own choice, with your words "Let's go with C."
>
> What this changes:
> - **C has a gap.** C doesn't have the recurring weekly booking option yet; only B got it in the demo pass. I've listed it as pending prototype work for C's create-booking journey. Until that's done, C's coverage is incomplete and that journey isn't ready to hand to implementation. C also covers only the comparison flow so far, so the rest of the approved interface still needs to be built out in C.
> - **The others are now kept as references.** You didn't ask to keep the other alternatives maintained, so A, B, D and E become retained reference snapshots. I recorded what each covers: B includes the recurring option and A, D and E don't. They won't be updated unless you ask.
> - **Choosing C settles direction only.** It sets the presentation and interaction direction. It doesn't by itself approve journeys we haven't reviewed or any change in behavior.
> - **The launcher marks C as Selected.** The UI/UX validator passes, and the decision overview is regenerated.
>
> No Agent-chosen design decisions were recorded.
>
> Shall I bring C up to date now, adding the recurring weekly booking option and checking it?

<!-- responses-G3.md -->

Skill files read: `SKILL.md`; `references/implementation-detail-tickets.md` (ticket route); `references/checkpoint-workflow.md` (Before Asking, approval semantics); `references/decision-attribution.md` (interpreting delegated discretion, parts of an open question, "discretion never lowers a requirement"); `references/technical-constraints.md` (to confirm that an unanswered ticket produces no CONS); and the attribution rules in `scripts/lib/model/decision-attribution.mjs`, which the ticket validator uses for open-ticket attribution.

### Scenario G3

### Actions

**Before deciding.** I read the approved brief's two requirements, the user's message from today, and the ticket. The user delegated the whole ticket, including whether to geocode. That covers every choice I can make inside two limits the user stated: addresses go only to the existing EU provider under the data-processing agreement, and spending stays within the €50 a month mapping budget. Delegation does not let me relax either limit or the brief's requirement.

**What I can decide.** For the sites the EU provider can locate, I can settle everything. Each site's address is geocoded automatically with the EU provider (about €5 a month) when the site is created or its address changes. The coordinates are stored on the site record with the address they came from and whether geocoding succeeded. No one places pins.

**What I can't decide.** For about 40% of sites (rural, no street number) the brief cannot be met within the user's limits. The only reliable alternative is the US provider. It is outside the data-processing agreement, which breaks the data-sharing limit, and costs about €120 a month, which breaks the budget. The other options weaken an approved requirement. I therefore don't use the US provider, don't add a fallback, don't quietly show "no location", and don't describe the design as meeting the brief. That part goes to the user, and the rest of the ticket's resolution waits for it.

**File changed:** the site-records responsibility's ticket file, `design/software-design/build/workflow/tickets/<site-records-domain>/sr-xxx/sr-xxx-tickets.yaml`. The scenario doesn't give the real path or ticket ID. Only this ticket's record changes:

- `status`: stays `"todo"`. `resolution`: stays `null`.
- `kind`: stays `"product"`. Review note: "This ticket chooses what the product promises about locating sites and which recipient receives their addresses. That contract is still open for rural sites, so the kind is product. Technical (the geocoding mechanism) doesn't control the decision, because every remaining option changes promised behavior, a data recipient, or cost."
- `complexity`: reassessed to `"medium"`. The question was narrowed, and answering it means weighing three competing constraints.
- `attribution`: one entry for the part the user settled. The ticket stays open.
  `[{"decision": "Site addresses may be sent for geocoding only to the existing EU geocoding provider under the existing data-processing agreement, and site mapping must stay within the existing €50 a month mapping budget.", "origin": "human-approved/user-specified", "evidence": "User message in the 2026-11-05 ticket session about this ticket: \"You decide this one, including whether to geocode. Addresses may go only to our existing EU geocoding provider under our data-processing agreement, within the existing €50 a month mapping budget.\"", "conditions": []}]`
- `question`: narrowed to the open part: "About 40% of sites are rural addresses without a street number, which the EU geocoding provider cannot locate. For those sites, should their addresses go to a US provider outside the data-processing agreement (about €120 a month, beyond the €50 budget), should they be shown without a map location, or should staff other than site managers set their location?"
- `context`: rewritten so the ticket stands alone. It quotes the brief's requirements word for word, attributed to the approved brief: "the site details screen shows where each site is" and "Site managers never place or adjust map pins; each site's location comes from its address automatically." It also records:
  - the user's delegation and its two limits;
  - the EU provider's cost (about €5 a month) and its rural gap (about 40% of sites);
  - the US provider's cost (about €120 a month) and that the data-processing agreement doesn't cover it;
  - that no option meets both the brief and those limits for the rural sites.
- `options`: the three options A, B and C, worded as in the message below.
- `recommendation`: the conditional recommendation below. It also sets out the design I plan to record as Agent-chosen once the ticket is decided: automatic EU geocoding on create and on address change, coordinates stored with their source address and geocoding status, and no pin placement for site managers. These aren't recorded as attribution yet, because an open ticket carries entries only for parts the user settled.
- `candidate_proof`: "An implementer cannot finish or verify how the site details screen shows the location of a rural site without a street number, which the EU geocoding provider cannot locate, without choosing whether its address goes to another provider or what the screen shows instead, and the current package does not already choose it."
- Unchanged: `depends_on`, `write_targets`, `constraint_refs` (no CONS for an unanswered ticket) and `blocked_by` (this waits on a user decision, not an external fact).

**Not changed:** the brief, the site-records responsibility, flows, contracts and the System Guide. Neither the settled part nor the planned design is written to canonical owners until the ticket is decided.

**Commands run:**
- `node <skill-dir>/scripts/validate-implementation-detail-tickets.mjs --root design/software-design`
- `node <skill-dir>/scripts/generate-decision-overview.mjs --root design/software-design`, then the same with `--check`. The overview is regenerated because attribution changed; it shows the entry as part of an open question.

I report their actual output. This simulation has no package, so I claim no result.

### Message to the user (verbatim)

> TICKET-NNNN · Q1/1 · Locating rural sites the EU provider can't geocode
>
> You asked me to decide how site locations are captured and stored, within two limits: addresses go only to our existing EU geocoding provider under the data-processing agreement, and mapping stays within the €50 a month budget. The approved brief also requires that "the site details screen shows where each site is" and that "Site managers never place or adjust map pins; each site's location comes from its address automatically."
>
> For most sites I've decided it within those limits. Each site's address is geocoded automatically by the EU provider when the site is created or its address changes, at about €5 a month. The location is stored with the site, and nobody places pins.
>
> The gap: the EU provider can't geocode rural sites that have no street number, about 40% of sites. For those, I can't meet the brief within your limits, so I've left this part open. The only provider I found that locates them reliably is a US provider. It isn't covered by our data-processing agreement and costs about €120 a month, so it would exceed both of your limits.
>
> What should happen for those rural sites?
>
> - **A. Send only those addresses to the US provider.** Every site gets its location from its address, as the brief requires. This needs two approvals from you: a new address recipient outside our current data-processing agreement (plus any agreement your rules require before the first address is sent), and a mapping budget of about €125 a month (€5 + €120).
> - **B. EU provider only. Those sites show their address with a visible "location not found from address" note and no map position.** Both of your limits hold, and site managers still never place pins. However, about 40% of sites wouldn't show where they are, which falls short of the brief. These may also be the sites where an address alone is hardest to find on the ground.
> - **C. EU provider only, and staff other than site managers (for example office staff) set a map location for those sites.** Every site appears on the map and site managers still don't place pins. However, those locations no longer come from the address automatically, and the brief doesn't define this new manual task or who is allowed to do it.
>
> My recommendation: if your data-processing and budget limits are firm, choose B. It keeps both limits and the "location comes from the address, no manual pins" rule, and it shows the gap openly instead of hiding it. If showing every site on the map matters more, choose A, the only option that meets the brief as written. This trades your stated limits against an approved requirement, so it's your call.
>
> Reply A, B, C, or describe another approach. Meanwhile I'm continuing with the next open site-records ticket. Nothing that depends on this answer will be written.

### Report

- **TICKET-NNNN** (How site locations are captured and stored) is still `todo`, with one question waiting for you. I recorded your data-sharing and budget limits on it as "Human-approved · User specified". The brief's requirement is quoted in your words and isn't described as met. I didn't use or plan for the US provider.
- **Agent-chosen decisions recorded this pass:** none. The design I plan for this ticket (automatic EU geocoding, coordinates stored with their source address and geocoding status, no pins) is written into the ticket's recommendation. I'll record it as Agent-chosen when the ticket is decided.
- **Canonical files:** none changed (brief, site-records responsibility, flows, contracts, System Guide). No CONS was created. The decision overview was regenerated.
- **Validation:** the ticket validator and the decision-overview check were run, and their actual output goes here. A structural pass would not show the ticket is complete.
- **Next:** continuing with the next open `kind: product` ticket in site records. This ticket resumes when you answer A, B or C.

