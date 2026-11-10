# Original guidance responses

Verbatim outputs from the trial using the original skill. Each section below is one agent's complete response file; the four agents per version worked in separate fresh contexts (prototypes 1–4, contracts 5–6, authority and reporting 7–10, supplementary 11–12). Only top-level titles were demoted to fit this file.

---

<!-- trial file responses-P.md -->

### Software Design skill: simulated responses (trial-m)

Routing used: `SKILL.md` sends human-facing prototype work to `references/ui-ux-design.md` plus the staged reference for the active work. For Scenarios 1–3 I read `ui-ux-design.md`, `ui-ux/README.md`, `ui-ux/design-workflow.md`, `ui-ux/templates/specification.md` (for the sections being edited) and `ui-ux/templates/candidate.html` (for the interaction markers to keep). I also read `staged-design-workflow.md` and `checkpoint-workflow.md` (Stage 7 pass and authorization) and the `ui-ux/` ownership rules in `package-layout.md`. For Scenario 4 the ticket route adds `implementation-detail-tickets.md` and `decision-attribution.md`. To see what the UI/UX validator enforces about selection, pending rows and runtime evidence, I read `scripts/lib/validation/ui-ux-design.mjs`.

Paths below use `software-design/` for the booking product's package and `<skill>` for the directory that contains the active `SKILL.md`. Text in `<angle brackets>` stands for something only a real run would produce, such as a tool name or an actual finding. I don't invent those results.

---

## Scenario 1

### Rules that apply

- **The request is already authorized.** "Add … to the prototypes and check that it works" is an explicit prototype-change request. Under `ui-ux-design.md` § Later Interface Changes and the Stage 7 pass in `checkpoint-workflow.md`, that covers the affected updates and their inspection. No sync command, checkpoint or extra approval is needed.
- **All five candidates get the change.** No candidate is selected (`Unresolved`), so A–E are all exploratory alternatives being compared over one bounded flow. The workflow says to use "the same bounded representative journey and comparable states across candidates so comparison is fair". TICKET-0012 changed FLOW-004 inside that compared flow (create booking → confirmation), and the user said "prototypes" in the plural. Updating only some candidates would make the comparison unfair and would quietly treat one as the favourite.
- **No selection follows from this work.** The selected target stays `` `Unresolved` ``. "Before selection, record the choice as unresolved rather than treating the newest file as selected."
- **I don't ask the prototype-count, direction or slideshow question.** This is an ordinary update to existing candidates, not a request for new alternatives. When no slideshow preference is recorded, ordinary updates don't raise that question.
- **The empty Change Synchronization list proves nothing.** It is `None.` even though TICKET-0012 was approved after the initial reviewed prototype. Yesterday's pass should have left a pending row. "An empty pending list does not prove freshness", so I compare every candidate against the current FLOW-004 and specification requirements, not against the pending list.
- **No runtime-evidence receipt is required.** `runtime-evidence.json` is required only for a selected candidate with JavaScript-rendered elements, and none is selected. Rendered inspection from disk is still required.

### Actions

1. **Read before editing.** I read `software-design/ui-ux/specification.md` in full: selection, alternatives table, journey and state coverage, rules, review and Change Synchronization. I also read FLOW-004 and TICKET-0012 (its resolution and write targets), the launcher and the five candidate folders. Then I compare each candidate's booking flow with the current requirements. Expected finding: none of A–E has the weekly recurring option. The only gap source is TICKET-0012.
2. **Edit the five candidates.** Files: `software-design/ui-ux/alternatives/{a,b,c,d,e}/`, meaning each candidate's affected entry pages and its local script, style and demo-data files.
   - Add the weekly recurring option to the create-booking step, using that candidate's own navigation, sequence and visual treatment. Each direction stays distinct; I don't standardize them.
   - Illustrate exactly the states that FLOW-004 and the updated specification define for a recurring booking. That includes what the user must see at the decision before confirming, as the specification requires (for example the series and its consequences), and a confirmed series that is still shown when the user returns. It also includes cancellation and payment failure behaving as FLOW-004 defines for a series.
   - Keep the one-off booking path working as before.
   - Keep the standard markers (`data-product-action`, `data-next-step`, `data-cancel-action`, `data-recovery-action`), the reviewer area inside `details[data-prototype-reviewer]` with `data-review-state-target`, and the single prototype disclosure.
   - Keep the files portable: demo data in classic scripts, relative local resources, no CDN, module or fetch, and storage that fails harmlessly.
   - Make changes local to each candidate and don't add shared `ui-ux/assets/` unless something is genuinely shared.
   - If FLOW-004 or the specification turned out to leave a materially visible recurring state undefined (for example what the user sees when one week in the series is unavailable), I wouldn't invent the behavior. I would leave that state out, report it as an open question routed to its owner, and describe the affected scope as incomplete.
3. **Check that it works (rendered inspection).** I open `software-design/ui-ux/index.html` directly from disk (`file://`, no local server) with the available browser tooling, follow each card A–E, and exercise these paths:
   - a one-off booking, as a regression check;
   - a weekly recurring booking through confirmation;
   - returning after confirmation to see that the series persists;
   - cancelling before submission, which must keep the prior state;
   - payment failure for a recurring booking, with recovery that doesn't duplicate the submission.

   I also check keyboard operation and focus, and run a desktop viewport and a phone viewport. If a candidate uses storage, I also test blocked storage reads and malformed stored data. I fix any material problem in the same pass and re-check it. If rendering or opening from disk is blocked, I record that limitation and claim no visual or portability verification.
4. **Edit `software-design/ui-ux/specification.md`.**
   - `## Prototype Alternatives And Selection`: Selected implementation target stays `` `Unresolved` ``. In all five alternatives-table rows, the coverage cell becomes "arrival → availability → create booking (one-off or weekly recurring) → confirmation, plus cancellation and payment failure". The status stays "Exploratory comparison", optionally with "updated 2026-11-05 (TICKET-0012)".
   - The Covered-flow approval line is not extended to the recurring states. My walkthrough is not the user's approval of them.
   - `## Journey And Route Coverage` and `## State Coverage` were already updated for TICKET-0012. I only check that they match what the candidates now illustrate, and correct a prototype-state reference if one is missing.
   - `## Prototype Review`: I update the booking journey's row (its existing `#journey-…` anchor). The evidence records the date, the tool, the viewports, the direct-file launcher check, results per candidate, and the limitation that this is a heuristic agent walkthrough, not user testing. The result is `Reviewed` if no usability blocker or contradiction remains, otherwise `Blocked — <finding>`.
   - `## Change Synchronization`: stays `None.`, because nothing is pending once this pass completes.
   - Review slideshows: if any of A–E already has `slides.html`, I re-capture its affected screens in this pass. If that fails, I mark the deck outdated beside its link and inside the deck. If no deck exists, nothing changes and I don't ask.
5. **Leave the rest unchanged.** The launcher `software-design/ui-ux/index.html` stays the same: no new candidate, no selection, no new deck. TICKET-0012's answer and canonical writes already exist, and this pass doesn't change them.
6. **Validate.**
   - `node <skill>/scripts/validate-ui-ux-design.mjs --root software-design`
   - `node <skill>/scripts/validate-software-design-structure.mjs --root software-design`

   Passing these is structural only. It is not evidence of visual or usability quality.

### Message to the user (verbatim)

> I added the weekly recurring-booking option to all five prototypes (A–E) and checked each one in the browser.
>
> **What changed**
> - Each candidate's create-booking step now offers weekly repetition, in that candidate's own layout and flow. A–E still differ from each other as before.
> - Before you confirm, each candidate shows what the recurring booking commits you to, as the booking flow and UI specification now require. After confirming, the series stays visible when you come back. Cancelling before you submit leaves things as they were, and a payment failure for a recurring booking recovers without creating a second booking.
> - One-off bookings work exactly as before.
>
> **How I checked it**
> I opened the prototype launcher directly from disk in `<browser tool>`, without a local server, and ran each candidate at desktop and phone widths. I covered one-off and weekly bookings, coming back after confirming, cancelling, and payment failure with recovery, using the keyboard as well as the mouse. Result: `<"no problems left" / the specific findings and what I fixed>`. This is my own walkthrough, not testing with real users.
>
> **What stays the same**
> - None of the five is selected yet. Adding the option to all of them keeps the comparison fair; it doesn't favour any direction.
> - Your earlier approval of the booking flow covers what you reviewed then. The new recurring screens haven't been reviewed by you yet.
>
> **Housekeeping**
> When TICKET-0012 was recorded yesterday, no "pending prototype work" entry was added to the UI specification, so its list said "None" even though the prototypes lacked the option. This update closes that gap, and nothing is pending now.
>
> **Files changed**
> - `software-design/ui-ux/alternatives/a/` … `e/`: booking pages and their local scripts, styles and demo data
> - `software-design/ui-ux/specification.md`: alternatives coverage and the booking journey's review evidence
>
> UI/UX validation: `<pass / exact errors>`. I made no product decisions of my own in this pass; where to place the option in each candidate is a presentation detail within the approved requirements.

---

## Scenario 2

### Rules that apply

- **Only C gets the change.** The specification selects C (`./alternatives/c/index.html`), and the user's attributed decision is "Go with C. Keep the others just for reference." A, B, D and E are recorded as retained comparisons that weren't updated after 2026-10-02. `ui-ux-design.md` says retained unselected candidates "need no continuous synchronization or full coverage and do not block readiness for a selected target". The user asks for "the prototype", singular, with TICKET-0012. That means C only.
- **The request is already authorized.** It is an explicit prototype-change request, so the update and its inspection need no further approval.
- **C's runtime evidence must be re-captured.** C is the selected candidate, and its interactions are rendered by JavaScript. Its `runtime-evidence.json` hashes C's resources and shared UI resources, so any edit to C makes an existing receipt stale, and a stale receipt fails validation. I re-capture it after the change.
- **No count, direction or slideshow question.** This is an ordinary update to an existing selected prototype.

### Actions

1. **Read before editing.** I read the specification, FLOW-004, TICKET-0012, candidate C and its current coverage. I compare C's booking journey with the current requirements and use the Change Synchronization list only as leads. If it holds a TICKET-0012 row, I clear it when the work is done. If it says `None.`, I treat that as stale, as in Scenario 1.
2. **Edit `software-design/ui-ux/alternatives/c/`**, meaning the affected booking pages and C's local script, style and demo-data files.
   - Add the weekly recurring option and the states FLOW-004 and the specification define: the information needed before confirming, a persistent confirmed series, cancellation, and payment failure with recovery that doesn't duplicate the submission.
   - Keep C's established navigation, hierarchy and visual language, since C is the implementation target.
   - Keep the interaction markers, the separate reviewer area and the portable mechanics, and change only C-local files.
   - A, B, D and E are not touched.
3. **Inspect.** I open `software-design/ui-ux/index.html` from disk, follow C's card, and exercise the same paths as in Scenario 1 at desktop and phone widths, including keyboard use, plus storage edge cases if C uses storage. I fix material problems and re-check.
4. **Re-capture runtime evidence** in `software-design/ui-ux/alternatives/c/runtime-evidence.json`.
   - I use `<skill>/scripts/capture-prototype-runtime.mjs` from a temporary driver outside `ui-ux/`, with a page from the available browser utility.
   - The steps include the recurring booking action, a next step, a cancellation, a recovery, and two distinct reviewer targets.
   - If no browser utility can drive the capture, I say so. I don't hand-write a receipt or delete the stale one to make validation pass, and I report the validation failure as it is.
5. **Edit `software-design/ui-ux/specification.md`.**
   - The selection stays `` `./alternatives/c/index.html` `` and the Decision Attribution stays unchanged.
   - In C's alternatives row, the coverage now names the weekly recurring option.
   - The `## Prototype Review` row for the booking journey gets fresh evidence: date, tool, viewports, direct-file check, findings, and a note that runtime evidence was re-captured. The result is `Reviewed` or `Blocked — <finding>`.
   - Change Synchronization: the TICKET-0012 row is cleared if it existed, otherwise it stays `None.`.
   - The A, B, D and E rows are not edited, because "not updated after 2026-10-02" is still true.
   - If C has a `slides.html`, I refresh its affected captures in this pass, or mark them outdated if that fails.
6. **Check downstream links.** If Build Design already links C's booking journey from a Build Unit's UI/UX Realization or a current Stage 9 handoff, the request covers reopening those affected routes. Their anchors and the candidate link stay valid, and any handoff covering this journey is reconciled and re-snapshotted in the same pass. If none exist, nothing more is needed.
7. **Validate.**
   - `node <skill>/scripts/validate-ui-ux-design.mjs --root software-design`. Because C is selected and review is declared, this also checks C's runtime receipt.
   - `node <skill>/scripts/validate-software-design-structure.mjs --root software-design`

### Message to the user (verbatim)

> I added the weekly recurring-booking option (TICKET-0012) to candidate C, your selected design, and checked that it works.
>
> **What changed in C**
> - The booking step now offers weekly repetition, in C's existing layout and flow.
> - Before you confirm, C shows what the recurring booking commits you to, as the booking flow and UI specification require. After confirming, the series is still there when you come back. Cancelling before you submit leaves things unchanged, and a payment failure for a recurring booking recovers without creating a duplicate.
> - One-off bookings are unchanged.
>
> **How I checked it**
> I opened the launcher directly from disk in `<browser tool>`, without a local server, and ran C at desktop and phone widths with keyboard and mouse. I covered one-off and weekly bookings, returning after confirmation, cancelling, and payment failure with recovery. I also re-recorded C's interaction evidence, since the old evidence no longer matched the changed files. Result: `<"no problems left" / specific findings and fixes>`. This is my own walkthrough, not testing with real users.
>
> **Not changed**
> A, B, D and E don't have the recurring option. You asked to keep them only for reference, and the specification already says they cover the booking journey only and haven't been updated since 2 October. If you want them to show it too, just say so.
>
> **Files changed**
> - `software-design/ui-ux/alternatives/c/`: booking pages, local scripts, styles, demo data, and `runtime-evidence.json`
> - `software-design/ui-ux/specification.md`: C's coverage and the booking journey's review evidence
>
> UI/UX validation: `<pass / exact errors>`. I made no product decisions of my own in this pass.

---

## Scenario 3

### Rules that apply

- **All five candidates get the change, because the user said so.** The user's standing, recorded and unchanged instruction is "Keep all five alternatives at the same functionality even after we choose one; I want to keep showing them to the client". The current request also says "prototypes", plural. The skill says retained candidates *need* no synchronization, which permits leaving them alone but doesn't forbid updating them. The user's instruction requires it, so I update all five.
- **The two recorded statements fit together.** "Go with C. Keep the others just for reference." and the parity instruction carry the same date and source. Read together, C is the only implementation target, and the other four are kept for reference and client demos with the same functionality. Updating them doesn't select them or make them implementation targets.
- **The retained rows will become false.** After this change, "not updated after 2026-10-02" is no longer true for A, B, D and E, so I correct those rows.
- **C's receipt still needs re-capturing.** Its runtime-evidence hash excludes other alternatives, so editing A, B, D and E doesn't make it stale, but editing C does. Only C needs a receipt; A, B, D and E need rendered inspection, not receipts.
- **Parity may already be broken, and I must not claim it.** The four retained rows say "booking journey only". If C now covers more than the booking journey, the four were already behind the standing instruction before this request. "Discretion never lowers a requirement": I must not describe them as being at parity when they aren't. A full catch-up across other journeys is also well beyond the change the user just asked for. So I do the requested change in all five, record the actual state truthfully, and ask one focused question about the rest.

### Actions

1. **Read before editing.** I read the specification, including the selection notes and C's alternatives row and coverage, plus FLOW-004, TICKET-0012 and all five candidate folders. I compare C's current functionality with A, B, D and E to find any gap that predates this request.
2. **Edit all five candidates in `software-design/ui-ux/alternatives/{a,b,c,d,e}/`.** Each gets the weekly recurring option and the FLOW-004 and specification states, as in Scenario 2, each in its own design. The markers, the reviewer area and the portable mechanics stay the same, and changes stay local to each candidate so C's receipt depends only on C.
3. **Inspect from disk.** I open `software-design/ui-ux/index.html` from disk and exercise the same paths as in Scenarios 1 and 2 in every candidate, at desktop and phone widths, with keyboard use and storage edge cases where applicable. I fix and re-check any material problems.
4. **Re-capture runtime evidence for C only** in `software-design/ui-ux/alternatives/c/runtime-evidence.json`, with the same procedure and honesty limits as in Scenario 2.
5. **Edit `software-design/ui-ux/specification.md`.**
   - The selection stays C, and the Decision Attribution and selection notes stay unchanged.
   - C's row coverage now names the weekly recurring option.
   - The A, B, D and E status cells change from "Retained comparison — booking journey only; not updated after 2026-10-02" to "Retained comparison, kept at C's functionality at the user's request — booking journey including the weekly recurring option (TICKET-0012); updated 2026-11-05". If C covers more than the booking journey, I add: "behind C on <journeys>".
   - The `## Prototype Review` booking-journey evidence lists results per candidate, including C's re-captured runtime evidence.
   - Change Synchronization is cleared of any TICKET-0012 row, otherwise it stays `None.`.
   - I refresh any existing decks for the edited candidates, or mark them outdated if that fails.
6. **Check downstream links and validate.** Build Unit and handoff routes are checked as in Scenario 2. They are affected only through C. Then I run:
   - `node <skill>/scripts/validate-ui-ux-design.mjs --root software-design`
   - `node <skill>/scripts/validate-software-design-structure.mjs --root software-design`

### Message to the user (verbatim)

> I added the weekly recurring-booking option (TICKET-0012) to all five prototypes and checked each one. That keeps all five at the same functionality, as you asked on 2 October.
>
> **What changed**
> - Every candidate's booking step now offers weekly repetition, each in its own design.
> - Before you confirm, each shows what the recurring booking commits you to. After confirming, the series is still there when you come back. Cancelling before you submit changes nothing, and a payment failure recovers without a duplicate booking.
> - One-off bookings are unchanged everywhere.
> - C is still the design to build; keeping the others matched doesn't change that.
>
> **How I checked it**
> I opened the launcher directly from disk in `<browser tool>` and ran all five at desktop and phone widths with keyboard and mouse. I covered one-off and weekly bookings, returning after confirmation, cancelling, and payment failure with recovery. I also re-recorded C's interaction evidence, since C's files changed. Result: `<"no problems left" / findings per candidate and fixes>`. This is my own walkthrough, not testing with real users.
>
> **Specification**
> The notes for A, B, D and E said they hadn't been updated since 2 October. They now say they're kept at C's functionality, with this update dated today.
>
> **Files changed**
> - `software-design/ui-ux/alternatives/a/` … `e/`: booking pages, local scripts, styles and demo data, plus C's `runtime-evidence.json`
> - `software-design/ui-ux/specification.md`: coverage and status for all five, and the booking journey's review evidence
>
> UI/UX validation: `<pass / exact errors>`. I made no product decisions of my own in this pass.

*Add this paragraph only if the comparison in step 1 found that C covers more than the booking journey:*

> **One question.** Apart from this change, A, B, D and E only cover the booking journey, while C also has `<C's other journeys>`. Under your "same functionality" instruction they're behind C there, and I haven't described them as matched. Should I bring all four up to C's full functionality now? That means adding `<journeys>` to each, which is a much larger change than this one. Or do you want them matched on the booking journey only? I'd recommend bringing them up, since that's what your instruction says. If showing them to the client only involves booking, matching on booking alone is enough.

---

## Scenario 4

### Rules that apply

- **This is a live ticket interview.** The user's "Q1 yes" answers the only planned question (Q1/1). The batch convention applies: record the answer, don't repeat the batch, and mark the ticket complete with the exact `✓` line.
- **Attribution.** A plain yes to a clearly presented recommendation is **Human-approved · Agent recommended**. The evidence is the proposal as presented plus the user's verbatim reply, and there are no conditions.
- **Recording and canonical writes.** I record the answer immediately as `decided`, then write the approved meaning to its canonical owners in the same coherent pass.
  - Showing the fee and deadline at the confirmation step is a presentation and interaction requirement, so `ui-ux/specification.md` owns it.
  - The behavior owner is updated first, and only if behavior actually changes. If FLOW-004 (or its interface) doesn't yet make the cancellation fee and deadline available before confirmation, that becomes a behavior change consistent with the approved answer.
- **No prototype work.** The initial reviewed prototype exists, and nobody has asked for prototype work in this session. So I record the affected journey as pending under Change Synchronization, and I don't edit or render any candidate or regenerate any slides. The narrow exception lets the ticket be `finished` while this prototype work is pending, as long as the work is recorded in the specification and every other completion requirement is met.
- **Five unselected candidates.** The pending entry describes the requirement for the journey and doesn't pick candidates. It notes that none of A–E illustrates it yet.

### Actions

1. **Record the answer in the TICKET-0015 entry** in `software-design/build/workflow/tickets/<domain>/sr-xxx/sr-xxx-tickets.yaml`. It first becomes `decided`, then `finished` after step 5.

   ```yaml
       status: "decided"
       resolution: "Show the cancellation fee and its deadline on the confirmation step, before the user confirms."
       attribution: [{"decision": "Show the cancellation fee and its deadline on the confirmation step, before the user confirms.", "origin": "human-approved/agent-recommended", "evidence": "Ticket interview 2026-11-05, TICKET-0015 · Q1/1 · Show the cancellation fee before confirming. Agent recommendation: \"Show the fee and its deadline on the confirmation step, before the user confirms.\" User reply: \"Q1 yes.\"", "conditions": []}]
   ```

   `write_targets` must list `ui-ux/specification.md`, plus the behavior owner if step 2 edits it. `kind` stays `product`, since the answer didn't change what the question decides.
2. **Write the canonical owners as one coherent pass.**
   - *Behavior owner (FLOW-004 or its interface), only if needed.* I check whether the cancellation fee and deadline are already available to the confirmation step before submission. If not, I add that requirement. If they are, I make no behavior edit.
   - *`software-design/ui-ux/specification.md`.* In `## Interaction And Content Rules`, the informed-decision rule now says the confirmation step shows the cancellation fee and its deadline before the confirm action. The booking journey's row in `## Journey And Route Coverage` gains the same requirement at the confirmation step, with links to TICKET-0015 and FLOW-004.
   - *`## Change Synchronization`.* `None.` becomes the pending table:

     | Journey | Pending change | Canonical / ticket references |
     | --- | --- | --- |
     | [Booking journey](#journey-<booking-anchor>) | Show the cancellation fee and its deadline on the confirmation step, before the confirm action. Not yet illustrated in any candidate (A–E; none selected). | [TICKET-0015](../build/workflow/tickets/<domain>/sr-xxx/sr-xxx-tickets.yaml), [FLOW-004](../system-model/behavior/flows/flow-004-<slug>.md) |

   - *`Required prototype coverage` line.* If it claims `Complete` for a scope that includes the booking journey, it becomes `Incomplete — booking journey pending TICKET-0015`. The Prototype Review row and the selection (`Unresolved`) are unchanged.
   - *No candidate, launcher or slideshow is touched.*
3. **Synchronize what the answer affects.**
   - I refresh the System Guide passage only if a booking domain guide explains what the customer sees before confirming.
   - I inspect directly affected unanswered tickets, such as open questions about cancellation terms or confirmation content, for wording the answer has made stale, and refresh it without changing their open choices. I don't rescan the whole backlog.
4. **Regenerate the decision overview**, because attribution changed:
   - `node <skill>/scripts/generate-decision-overview.mjs --root software-design`
   - then the same command with `--check`
5. **Validate.**
   - `node <skill>/scripts/validate-implementation-detail-tickets.mjs --root software-design`
   - `node <skill>/scripts/validate-technical-constraints.mjs --root software-design`
   - `node <skill>/scripts/validate-ui-ux-design.mjs --root software-design`
   - `node <skill>/scripts/validate-software-design-structure.mjs --root software-design`

   When every write target holds the resolution and these pass, TICKET-0015 moves to `finished` with its prototype work pending. If any validator fails, it stays `decided` and I report the exact failure.

### Message to the user (verbatim)

> ✓ TICKET-0015 complete · 1/1 questions resolved
>
> Recorded: the confirmation step will show the cancellation fee and its deadline before the user confirms. I recorded it as your approval of my recommendation.
>
> - **Written to:** the UI specification (the content rule for the confirmation step, and the booking journey's coverage). `<FLOW-004 also now requires the fee and deadline to be available before confirmation / FLOW-004 already provided both, so it didn't change>`.
> - **Prototypes:** not changed. Since the first reviewed prototype exists, I queue changes like this as pending prototype work in the specification rather than editing the prototypes automatically. None of the five candidates shows the fee yet. When you want it in the prototypes, ask me to update them. With no design selected yet, I'd add it to all five so the comparison stays fair.
> - **Status:** TICKET-0015 is finished, with the prototype update pending. Checks: `<all passed / exact failure, in which case it stays "decided">`. Decision overview regenerated.
> - No choices of my own were involved.

*If the interview continues with another ticket, the same reply continues straight into it, presenting all of that ticket's questions with full context and a recommendation, for example:*

> ▶ TICKET-<next> · Q1/<n> · <short label>

*Otherwise, the reply ends with the ticket totals by status for the scope under discussion.*

---

<!-- trial file responses-C.md -->

### Responses — Software Design skill, trial C

Package: `fixture/design/software-design/` · Brief: `fixture/design/software-brief.md` (paths below are package-relative unless stated).

Routing applied for both scenarios (one Stage 7 pass): SKILL.md → *continue the staged blueprint* (`package-layout.md`, `system-model-format.md`, `staged-design-workflow.md` §7, `checkpoint-workflow.md`) + *find missing tickets* (`implementation-detail-tickets.md`, `ticket-inventory-mode.md`) + `decision-attribution.md` (repairs record settled decisions) + `planning-execution-contract.md` (mandatory entry read) + `ui-ux-design.md` (Office Workspace is a human-facing surface, so Stage 7 completion has a UI lane). Templates read: interface, flow, scope, System Responsibility, responsibility-tickets.

---

## Scenario 5

### What I ran (read-only)

| Command | Result |
| --- | --- |
| `validate-software-design-structure.mjs --root <pkg>` | PASS — "Verified canonical system-model structure: 4 System Responsibilities across 2 System Domains." |
| `validate-implementation-detail-tickets.mjs --root <pkg>` | PASS — 1 ticket, 1 file; "Semantic inventory completeness was not assessed." |
| `validate-technical-constraints.mjs --root <pkg>` | PASS — no constraint register active. |
| `report-ticket-inventory-leads.mjs --root <pkg>` | SR-001 = 0, SR-002 = 1, SR-003 = 0, SR-004 = 0; zero-owned: SR-001, SR-003, SR-004; explicit unresolved-language leads: 0. |
| `generate-decision-overview.mjs --root <pkg> --affected <every file/ticket I would change>` | `affected: []` — no recorded human-approved decision is touched by the repairs. |
| `generate-decision-overview.mjs --root <pkg> --check` | Overview missing (expected: no pass has recorded attribution yet). |

The structure validator only proves that the ACT entries that *are* declared have anchors, fields, kinds and risks. It cannot see an operation that was never declared. That is the main finding here.

### 7A — Ticket/owner validation (setup only, not discovery evidence)

`TICKET-0001` (line rounding) is truthfully owned by Invoicing (SR-002), its write target resolves, and it has no dependencies. Owner synchronization passes. That proves nothing about whether the backlog is complete.

### 7B/7C — Findings

**F1 — Journey 1's initiating operation is missing (main finding).** The brief starts journey 1 with "A site manager submits a daily work report". FLOW-001's `starts_when` says the same thing, but no transition performs the submission, and its only precondition assumes the submission already happened. IFACE-001, the only Work Reports ↔ Office Workspace boundary, declares only `ACT-001` (the clerk's validate/return) and `ACT-002` (validated quantities). Office Workspace (SR-004) "holds no … report authority and acts only through the interfaces of the owning responsibilities", so the site manager has no way to create a report. Work Reports (SR-001) "owns daily work reports from submission", so the owner is clear. The behaviour is already approved, so this needs no decision. It is a Software Design repair: a missing canonical contract and flow transition. **It is not a ticket**: nothing has to be chosen, because the approved brief already settles the behaviour.

**F2 — The rest of journey 1 has no interactions either.** The same consumer-side walk shows:
- *Clerk opens it.* FLOW-001 step 1 is owned by SR-004 ("Report shown with quantities"), but no interaction reads a report, and nothing lists the reports awaiting a decision. A command surface (`ACT-001`) does not imply a read surface. `ACT-002` returns only validated, not-yet-invoiced quantities.
- *Return with a written reason.* `ACT-001` input is only "identifier and decision", and the IFACE-001 payload has no reason. FLOW-001 step 2 already says "returned report carrying the reason", so the interface is narrower than its own flow.
- *Reason shown to the site manager.* No interaction exposes the reason, and no access entry names site managers.
- *Correct and resubmit.* FLOW-001 step 3 gives the `returned → submitted` state change to SR-004, which has no report authority. No interaction accepts a correction.

All of these are settled by the brief, so they are repairs (R1, R2).

**F3 — Journey 2's issuing command is missing.** IFACE-002 has the issued-invoice publication (`ACT-001`), the simulation (`ACT-002`) and the accountant listing (`ACT-003`). It has no operation through which the clerk issues the invoice, even though FLOW-002 step 3 has Invoicing issue it after "Previewed selection". The brief settles this, so it is a repair (R3). The IFACE-002 payload also has no issue date, although journey 3 lists invoices "for a period". I would add it (Agent-chosen, R3).

**F4 — FLOW-002 contradicts IFACE-002.** FLOW-002 step 3 records `draft → issued`, while `IFACE-002.ACT-002` says the preview stores and numbers nothing. The brief ("can no longer be edited") does not resolve it. This is a product choice between two approved records → `TICKET-0008`. I am not editing the state change.

**F5 — Journey 3 has two owners (boundary inconsistency → paused).** Accounting Registers (SR-003) owns "the tax-register listings derived from issued invoices" and records an entry for each issued invoice (FLOW-002 step 4). The only accountant-facing listing is `IFACE-002.ACT-003`, produced by Invoicing. Nothing exposes SR-003's entries, and journey 3 has no flow. Deciding which responsibility answers the accountant is a responsibility/authority boundary question, so I pause only that branch and ask (B1). The acknowledgement gap in `IFACE-002.ACT-001` ("Redelivered until acknowledged", but no acknowledgement point or duplicate handling) sits inside this branch, because option B could remove the consumer.

**F6 — Unowned or open material choices → tickets.** Prospective tickets `TICKET-0002`…`TICKET-0013` cover site-manager authority, one report per site-day, correction scope, price source and line composition, tax, numbering series, draft vs direct issue, who holds the "already invoiced" status, the invoice document, the target outcome/runtime profile, identity and roles, and customer/site reference data. They are listed below with candidate proofs.

**F7 — Brief exclusions have no canonical owner.** Architecture has `scope_boundaries: "None."`, but the brief excludes email/post sending, layout customisation and credit notes. These are approved, so recording them is a repair (R4: `SCOPE-001`, `SCOPE-002`).

**F8 — Model-coherence gaps outside the ticket lane (reported, not repaired here).** All four System Responsibility records contain only `Purpose`. They lack `Responsibility Overview`, `Owns`, `Must Not Own`, `Inputs And Outputs`, `State And Artifacts`, `Failure And Recovery` and `Invariants`. FLOW-001 and FLOW-002 lack `Outcomes` and `Invariants`. There is no `build/README.md` even though a ticket file exists. The missing SR consumer-need statements are the systemic reason F1–F3 slipped through Stage 5. I would add `Inputs And Outputs` only where interactions change (SR-001, SR-002, SR-004) and flow `Outcomes`/`Invariants` where I edit flows. Completing the other SR sections is still owed as Stage 7 model reconciliation.

### Classification and authority for the repairs

R1–R4 restate approved brief behaviour in the canonical owners and correct a flow transition owner so it matches SR-004's approved boundary. That makes them **Software Design repairs inside the active Stage 7 reconciliation pass**: the approved source unambiguously settles them, so no new checkpoint is needed. `--affected` reported no human-approved decision touched. Anything the brief leaves open goes to a ticket or to B1 and is not written into canonical behaviour. Prospective inventory itself writes only ticket YAML.

### Exact changes I would make (nothing written in this run)

#### R1 — `system-model/contracts/interfaces/iface-001-work-reports.md` (full replacement body; frontmatter unchanged)

```markdown
### IFACE-001 — Work Reports

## Boundary

Work Reports (SR-001) accepts daily work reports, corrections and validation decisions from the Office Workspace (SR-004), lets the workspace read reports and their state, and exposes validated quantities to Invoicing (SR-002) and the workspace.

## Payload Or Artifact

A work report: identifier, site, date, quantities (each with a reference that stays stable within its report), the submitting site manager, state (`submitted`, `returned`, or `validated`), and, while returned, the clerk's written return reason.

## Material Interactions

<a id="act-001"></a>
### ACT-001 — Validate or return a work report

**Kind:** `callable`

**Trigger or entry:** The office clerk decides on a submitted report after opening it through ACT-005.

**Input:** Report identifier and the decision: `validate`, or `return` with a non-empty written reason.

**Output or observable result:** The report's new state, `validated` or `returned`; a returned report carries the written reason, which its site manager sees through ACT-005.

**Access or authority:** Office clerks only.

**Failure and recovery:** An unknown report is not found; a caller who is not an office clerk is forbidden; a report not in `submitted` state (already decided, or returned and awaiting correction) is rejected as stale with its current state, so a clerk retrying after a lost response re-reads it through ACT-005; a `return` without a reason is rejected. Every rejection leaves the report unchanged.

**Risk:** `ordinary`

**Verification intent:** Validating and returning change the state; a return stores and exposes its reason; a return without a reason, a decision by a non-clerk, and deciding twice are rejected without change.

<a id="act-002"></a>
### ACT-002 — Validated quantities for a period

**Kind:** `state-observation`

**Trigger or entry:** Invoicing or the workspace reads validated, not-yet-invoiced quantities.

**Input:** Site and period.

**Output or observable result:** Validated quantities with their report references.

**Access or authority:** Office clerks and Invoicing.

**Failure and recovery:** Empty when nothing is validated in the period; an unknown site is not found; any other caller is forbidden.

**Risk:** `ordinary`

**Verification intent:** Only validated, not-yet-invoiced quantities appear.

<a id="act-003"></a>
### ACT-003 — Submit a daily work report

**Kind:** `callable`

**Trigger or entry:** A site manager submits the day's work report for a site.

**Input:** Site, date, and the quantities of work done.

**Output or observable result:** The new report's identifier, in state `submitted`; office clerks can find it through ACT-005.

**Access or authority:** Site managers; which sites a site manager may submit for is open in `TICKET-0002`.

**Failure and recovery:** An unknown site is not found; a caller who may not submit for the site is forbidden; missing or invalid site, date or quantities are rejected; whether a second report for the same site and date is rejected is open in `TICKET-0003`. A rejected submission creates nothing.

**Risk:** `ordinary`

**Verification intent:** A valid submission creates exactly one `submitted` report visible to clerks; every rejected submission creates nothing.

<a id="act-004"></a>
### ACT-004 — Correct and resubmit a returned report

**Kind:** `callable`

**Trigger or entry:** A site manager corrects a returned report after reading its reason through ACT-005 and resubmits it.

**Input:** Report identifier and the corrected report content; which parts may change is open in `TICKET-0004`.

**Output or observable result:** The same report identifier, back in state `submitted`, awaiting a new decision through ACT-001.

**Access or authority:** The report's site manager; whether other site managers of the site may also correct it is open in `TICKET-0002`.

**Failure and recovery:** An unknown report is not found; a caller who may not correct it is forbidden; a report not in `returned` state is rejected as stale with its current state; invalid content is rejected. Every rejection leaves the report unchanged.

**Risk:** `ordinary`

**Verification intent:** A corrected report returns to `submitted` under the same identifier and must be decided again; resubmitting a report that is not returned is rejected.

<a id="act-005"></a>
### ACT-005 — Work reports and their current state

**Kind:** `state-observation`

**Trigger or entry:** An office clerk looks for reports awaiting a decision and opens one; a site manager looks at their reports, including returned ones and their reasons.

**Input:** A report identifier, or a state with an optional site and date range.

**Output or observable result:** The matching reports with site, date, quantities, state and, for a returned report, its written return reason.

**Access or authority:** Office clerks may read every report; site managers may read the reports they may submit or correct (`TICKET-0002`).

**Failure and recovery:** An unknown report is not found; a report outside the caller's access is forbidden; a search with no match is empty. A result reflects the state when read; consumers refresh by reading again.

**Risk:** `ordinary`

**Verification intent:** A clerk finds submitted reports and opens one with its quantities; a returned report shows its reason to its site manager; a site manager cannot read reports outside their access.

## Preconditions And Validation

- A submission needs a site, a date and its quantities.
- Decisions apply only to submitted reports; a return requires a non-empty written reason.
- Corrections apply only to returned reports and keep the report's identifier.

## Failure Meaning

A rejected submission, correction or decision leaves every report unchanged and creates nothing. The rejection says whether the report or site is unknown, the caller is not permitted, the report is no longer in the required state (with its current state), or the input is invalid.

## Must Not Imply

- Validation does not invoice anything.
- Submitting, correcting or reading a report never validates it; only a clerk's decision does.
- A returned report is not rejected permanently.

## Decision Attribution

| Decision | Origin | Evidence | Conditions |
| --- | --- | --- | --- |
| A site manager submits a daily work report; an office clerk opens it and validates it or returns it with a written reason; the reason is shown to the site manager, who corrects and resubmits the same report. | Human-approved · User specified | Software brief (`../software-brief.md`), Required journeys 1, reviewed and approved by the product owner. | None |
| These steps are separate submit, correct-and-resubmit and read interactions; rejections distinguish not found, forbidden, stale and invalid; clerks may read every report; each quantity has a reference stable within its report; the report records its submitting site manager. | Agent-chosen | Written in the Stage 7 reconciliation pass to give the approved journey its missing operations; the user has not reviewed these contract details. | None |
```

#### R2 — `system-model/behavior/flows/flow-001-work-report-validation.md` (frontmatter unchanged; body from Preconditions down)

```markdown
## Preconditions

- A site manager has a day's work to report for a site.

## Ordered Transitions

| Step | Owner | Requires | Action | Produces | State change | Must not imply |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `SR-001` | Site, date and quantities submitted by a site manager through the workspace ([IFACE-001.ACT-003](../../contracts/interfaces/iface-001-work-reports.md#act-003)) | Accept the daily report | Submitted report | none → submitted | Submission does not validate |
| 2 | `SR-004` | Submitted report | Office clerk finds and opens the report ([IFACE-001.ACT-005](../../contracts/interfaces/iface-001-work-reports.md#act-005)) | Report shown with quantities | None | Opening does not validate |
| 3 | `SR-001` | Clerk decision ([IFACE-001.ACT-001](../../contracts/interfaces/iface-001-work-reports.md#act-001)) | Validate the report, or return it with a written reason | Validated report, or returned report carrying the reason | submitted → validated, or submitted → returned | A returned report is not rejected permanently |
| 4 | `SR-004` | Returned report | Show the reason to the site manager ([IFACE-001.ACT-005](../../contracts/interfaces/iface-001-work-reports.md#act-005)), who corrects the report | Reason shown | None | Showing the reason does not resubmit |
| 5 | `SR-001` | Corrected report resubmitted by the site manager ([IFACE-001.ACT-004](../../contracts/interfaces/iface-001-work-reports.md#act-004)) | Accept the correction under the same report identifier | Resubmitted report | returned → submitted | Resubmission does not skip validation |

## Failure And Reroute

- A report already validated cannot be returned.
- A return without a written reason is rejected and the report stays submitted.
- A rejected submission creates no report; a rejected correction leaves the report returned.
- A resubmitted report re-enters step 2.

## Outcomes

- Validated: the report's quantities become billable through [IFACE-001.ACT-002](../../contracts/interfaces/iface-001-work-reports.md#act-002).
- Returned: the report waits for its site manager's correction.

## Invariants

- None.

## Decision Attribution

| Decision | Origin | Evidence | Conditions |
| --- | --- | --- | --- |
| The returned → submitted change and the initial submission are owned by Work Reports; the workspace only shows and forwards them. | Agent-chosen | Stage 7 reconciliation of this flow with the Office Workspace's approved purpose ("holds no … report authority"). | None |
```

#### R3 — `system-model/contracts/interfaces/iface-002-issued-invoicing.md` (targeted edits; `ACT-001` and `ACT-003` untouched pending B1)

- **Boundary** → "Invoicing (SR-002) exposes invoice previews and invoice issuance to the Office Workspace and issued invoices to Accounting Registers."
- **Payload** → "An invoice: number, series, issue date, customer, lines, totals, and state."
- **ACT-002 Failure and recovery** → append "; an unknown customer or quantity is not found; a caller who is not an office clerk is forbidden."
- **Add after ACT-003:**

```markdown
<a id="act-004"></a>
### ACT-004 — Issue an invoice

**Kind:** `callable`

**Trigger or entry:** The office clerk issues the invoice after previewing it through ACT-002.

**Input:** Customer and the selected validated quantities that were previewed; whether a stored draft or the previewed totals are also supplied is open in `TICKET-0008`.

**Output or observable result:** The issued invoice with its number in the customer invoice series, issue date, lines, totals and state `issued`; it is then published through ACT-001.

**Access or authority:** Office clerks.

**Failure and recovery:** An unknown customer or quantity is not found; a caller who is not an office clerk is forbidden; an empty selection or a quantity that is not validated is rejected; a quantity already on an issued invoice is rejected with that invoice's number, so a clerk whose earlier response was lost can find the invoice already issued; of two concurrent issues sharing a quantity at most one succeeds. A rejected issue assigns no number and changes nothing; whether a failure after numbering may leave a gap is open in `TICKET-0007`.

**Risk:** `high`

**Verification intent:** Issuing assigns the next series number, makes the invoice final and publishes it; rejection cases: non-clerk caller, empty selection, unvalidated or already-invoiced quantity, each consuming no number; failure and recovery cases: concurrent issues over one quantity produce at most one invoice, and an interruption after issuing still leads to publication through ACT-001.
```

- **Preconditions And Validation** → add "- A quantity can be on at most one issued invoice; an issued invoice cannot be edited."
- **Failure Meaning** → "A rejected simulation or issue changes nothing and assigns no number."
- **Must Not Imply** → add "- Issuing does not send the invoice to the customer ([SCOPE-002](../scope/scope-002-invoice-sending-and-layout.md))." and "- An issued invoice is not corrected or cancelled in this version ([SCOPE-001](../scope/scope-001-credit-notes.md))."
- **Add `## Decision Attribution`:** (a) "The office clerk issues the previewed invoice; issuing assigns the next customer-series number, makes it final and makes it available to accounting." · Human-approved · User specified · brief, Required journeys 2. (b) "Issue date in the payload; `high` risk; an already-invoiced rejection names the existing invoice; an empty selection is rejected; not-found/forbidden meanings." · Agent-chosen · written in the Stage 7 reconciliation pass.

`system-model/behavior/flows/flow-002-invoice-issuance.md`:
- Step 1 Requires → "Validated quantities ([IFACE-001.ACT-002](…#act-002))".
- Step 2 Action → "Preview the invoice totals ([IFACE-002.ACT-002](…#act-002))".
- Step 3 Requires → "Previewed selection issued by the clerk ([IFACE-002.ACT-004](…#act-004))". The `draft → issued` state change stays as written; `TICKET-0008` owns that contradiction.
- Failure And Reroute → add "- An issue containing an already-invoiced quantity is rejected, names the invoice that holds it, and numbers nothing."
- Add `## Outcomes` ("- Issued: the invoice is final, numbered in the customer invoice series, and published to Accounting Registers.") and `## Invariants` ("- None.").
- Step 4 is untouched pending B1.

System Responsibility `## Inputs And Outputs` (tables per the template; consumer need plus exact contract):
- `sr-001-work-reports.md`: one input row each for ACT-003 (submission), ACT-004 (correction) and ACT-001 (decision); one output row each for ACT-005 (reports, state and reason; re-read to refresh) and ACT-002 (validated quantities; invoiced-status authority open in `TICKET-0009`).
- `sr-002-invoicing.md`: inputs IFACE-001.ACT-002, IFACE-002.ACT-002, IFACE-002.ACT-004; outputs IFACE-002.ACT-001 and IFACE-002.ACT-003 (consumer side paused at B1).
- `sr-004-office-workspace.md`: site manager uses ACT-003/ACT-004/ACT-005; clerk uses ACT-005/ACT-001, IFACE-001.ACT-002, IFACE-002.ACT-002/ACT-004; accountant listing paused at B1.

#### R4 — Scope records for the brief's exclusions

`system-model/contracts/scope/scope-001-credit-notes.md`: frontmatter `type: system-scope-boundary`, `id: SCOPE-001`, `name: Credit notes`, `status: deferred`, `responsibilities: "SR-002, SR-003"`, `flows: "FLOW-002"`. Sections:
- Boundary: issuing credit notes that correct or cancel an issued invoice.
- Reason: the approved brief plans credit notes for a later version.
- Must Not Be Inferred: an issued invoice cannot be corrected, cancelled or reversed in this version; the customer invoice series does not number credit notes.
- Revisit Condition: an approved brief brings credit notes into the target version.
- Decision Attribution: the exclusion is Human-approved · User specified (brief "Out of scope"); the must-not and revisit wording is Agent-chosen.

`system-model/contracts/scope/scope-002-invoice-sending-and-layout.md`: `status: excluded`, `responsibilities: "SR-002, SR-004"`, `flows: "FLOW-002"`. Sections:
- Boundary: sending invoices by email or post, and customising the invoice document layout.
- Reason: excluded by the approved brief.
- Must Not Be Inferred: issuing does not deliver the invoice to the customer.
- Revisit Condition: an approved brief brings sending or layout customisation into scope.
- Attribution as for SCOPE-001.

`system-model/architecture.md` frontmatter → `scope_boundaries: "SCOPE-001, SCOPE-002"`.

#### R5 — Navigation and derived files

- Create `build/README.md`: a compact lane index stating that Build Design has not started, linking `./workflow/tickets/` and the Decision Overview.
- Root `README.md`: add links to `./system-model/contracts/scope/`, `./build/README.md` and `./build/workflow/decision-overview.md` (Decision Overview). No other README content changes.
- Generate `build/workflow/decision-overview.md`, then `--check`.

#### Tickets (prospective inventory; all `todo`, `build_units: []`, `build_unit_disposition: "Realization mapping has not started."`, `repositories: []`, `repository_contract_area: null`, `current_shape: null`, `resolution: null`, `result_refs: []`, `constraint_refs: []`, `blocked_by: []`)

New file `build/workflow/tickets/operations/sr-001/sr-001-tickets.yaml` (`ticket_file_version: 4`, `scope: "responsibility:SR-001"`):

```yaml
  - id: "TICKET-0002"
    title: "Decide which site managers may submit and correct a site's work reports"
    status: "todo"
    kind: "product"
    complexity: "low"
    concern: "access-authority"
    owner: "SR-001"
    affects: ["SR-001", "SR-004"]
    cluster: "work-report-submission"
    question: "Which site managers may submit a site's daily work report, and who may correct and resubmit a report the office returned?"
    context: "A site manager records each day's work on a construction site and submits it as a daily work report; an office clerk then validates it or returns it with a written reason, and the returned report goes back to its site manager to correct and resubmit. Approved sources say a report belongs to its site manager but not whether a site manager may report for any site or only for assigned sites, nor whether another site manager of the same site may correct a returned report. Example: Ana and Luis both manage Site North; Ana's Monday report is returned while she is on leave. Under a submitter-only rule Monday's quantities wait for Ana; under a site rule Luis can correct it."
    candidate_proof: "An implementer cannot finish or verify the access checks on work-report submission, correction and reading without choosing whether site managers are limited to assigned sites and who may correct a returned report, and the current package does not already choose it."
    options: ["Assigned sites; any site manager assigned to the report's site may correct it: returned reports never wait on one person, but the system must know site assignments.", "Assigned sites; only the submitting site manager may correct: matches the brief literally, but a returned report waits while that person is absent.", "Any site manager for any site: no site assignments needed, but anyone in the role can submit or alter reports for sites they do not manage."]
    recommendation: "Assigned sites, with any site manager assigned to the report's site allowed to correct it: it keeps reports with the people responsible for the site and avoids billable work waiting on one absent person. It assumes site assignments are available from whichever source the identity question selects."
    depends_on: []
    write_targets: ["system-model/contracts/interfaces/iface-001-work-reports.md", "system-model/domains/operations/responsibilities/sr-001-work-reports.md"]

  - id: "TICKET-0003"
    title: "Decide whether a site can have more than one work report per date"
    status: "todo"
    kind: "product"
    complexity: "low"
    concern: "state-lifecycle"
    owner: "SR-001"
    affects: ["SR-001", "SR-002", "SR-004"]
    cluster: "work-report-submission"
    question: "Can a site have more than one work report for the same date, or is a second submission for that site and date rejected?"
    context: "The brief calls it a daily work report, and every validated report's quantities become billable, so two reports for the same site and date would both be billable. Approved sources do not say whether a site-day has exactly one report. Example: two foremen at Site North each submit a report for 3 March; under a one-per-day rule the second is rejected and the work goes on one report; under a multiple-report rule both are reviewed and both can be billed."
    candidate_proof: "An implementer cannot finish or verify work-report submission without choosing whether a second report for the same site and date is accepted or rejected, and the current package does not already choose it."
    options: ["One report per site and date: a second submission is rejected while one exists, which also makes an accidental double submission harmless; several people must combine their work into one report.", "Several reports per site and date: each is reviewed and billed separately; clerks must watch for duplicated work and double submissions need separate protection."]
    recommendation: "One report per site and date, because the brief describes a daily report and the rule prevents the same day's work being billed twice. If several crews must report separately, choose the second option."
    depends_on: []
    write_targets: ["system-model/contracts/interfaces/iface-001-work-reports.md", "system-model/behavior/flows/flow-001-work-report-validation.md", "system-model/domains/operations/responsibilities/sr-001-work-reports.md"]

  - id: "TICKET-0004"
    title: "Define what correcting a returned report may change and keep"
    status: "todo"
    kind: "product"
    complexity: "low"
    concern: "data-model"
    owner: "SR-001"
    affects: ["SR-001", "SR-004"]
    cluster: "work-report-submission"
    question: "When a site manager corrects a returned report, which parts may change (quantities only, or also site and date), and are earlier return reasons kept for the clerk to see?"
    context: "A returned report carries the clerk's written reason; its site manager corrects it and resubmits the same report, which a clerk must decide again. Approved sources do not say which parts may change or whether the earlier reason is replaced or kept, and they offer no way to withdraw a report. Example: a report is returned with 'concrete volume looks doubled'; a clerk who sees that earlier reason can check that exact point, one who sees only the corrected report cannot tell why it came back."
    candidate_proof: "An implementer cannot finish or verify the correct-and-resubmit operation without choosing which report fields may change and whether earlier return reasons are kept, and the current package does not already choose it."
    options: ["Quantities only may change; earlier return reasons stay visible to the clerk: the clerk can check the requested fix; a report filed under the wrong site or date can never be fixed or withdrawn.", "Quantities only; the earlier reason is cleared on resubmission: simplest record, the clerk loses why it was returned.", "Site, date and quantities may change; earlier reasons stay visible: wrongly filed reports can be fixed; a changed site or date passes the same checks as a new submission, including the one-report-per-date rule if chosen."]
    recommendation: "Site, date and quantities may change, keeping earlier return reasons visible: it avoids stranding a wrongly filed report (no withdrawal exists) and lets the clerk check the correction."
    depends_on: []
    write_targets: ["system-model/contracts/interfaces/iface-001-work-reports.md", "system-model/behavior/flows/flow-001-work-report-validation.md", "system-model/domains/operations/responsibilities/sr-001-work-reports.md"]
```

Appended to `build/workflow/tickets/billing/sr-002/sr-002-tickets.yaml` (`TICKET-0001` unchanged):

```yaml
  - id: "TICKET-0005"
    title: "Choose where unit prices come from and how quantities become invoice lines"
    status: "todo"
    kind: "product"
    complexity: "medium"
    concern: "data-model"
    owner: "SR-002"
    affects: ["SR-002", "SR-001", "SR-004"]
    cluster: "invoicing"
    question: "What does each validated quantity identify (which work item and unit), where does its unit price for the chosen customer come from, and does each quantity become its own invoice line?"
    context: "Invoicing previews totals from the validated quantities the clerk chooses and then issues the invoice. Line totals need a unit price, and the separate rounding question already assumes one, but approved sources do not say what a quantity refers to (for example '12 m3 of excavation'), where its price comes from, or whether lines are per quantity or grouped by work item. Example: three daily reports each contain excavation in m3; the invoice could show three lines or one line of the summed volume at the customer's price."
    candidate_proof: "An implementer cannot finish or verify invoice preview and issued invoice lines without choosing what a quantity identifies, the source of its unit price and how quantities group into lines, and the current package does not already choose it."
    options: ["Shared work-item catalogue with units and a price per work item for each customer; one line per work item summing the selected quantities: compact invoices, someone maintains customer prices.", "Shared work-item catalogue and one price list for all customers; one line per selected quantity: simpler data, no customer-specific pricing.", "Site managers record work item and amount; the clerk types each unit price when preparing the invoice: nothing to maintain, but totals depend on manual entry and a preview is not reproducible."]
    recommendation: "Shared work-item catalogue with per-customer prices and one line per work item, because construction work is usually priced per customer contract and grouped lines keep invoices readable. It assumes a single currency; confirm with whoever prepares customer contracts."
    depends_on: []
    write_targets: ["system-model/domains/billing/responsibilities/sr-002-invoicing.md", "system-model/contracts/interfaces/iface-002-issued-invoicing.md", "system-model/contracts/interfaces/iface-001-work-reports.md"]

  - id: "TICKET-0006"
    title: "Decide how tax is applied to invoices"
    status: "todo"
    kind: "product"
    complexity: "high"
    concern: "product-policy"
    owner: "SR-002"
    affects: ["SR-002", "SR-003", "SR-004"]
    cluster: "invoicing"
    question: "Which tax applies to invoice lines (one standard rate, a rate per work item, or customer exemptions or reverse charge), and how do invoice totals show taxable base, tax and total?"
    context: "The accountant lists issued invoices for a period to prepare the tax register, so every issued invoice must carry the figures that register needs. Approved sources say only that invoices have totals. Line-total rounding is a separate open question; whatever it decides, this answer must state its own tax rounding consistently. Example: a 1,000.00 invoice at a 21% rate shows base 1,000.00, tax 210.00, total 1,210.00; an exempt customer's invoice shows base 1,000.00 and the exemption reason."
    candidate_proof: "An implementer cannot finish or verify invoice totals and the tax figures the accountant's listing needs without choosing which tax applies to invoice lines and how base, tax and total are computed and shown, and the current package does not already choose it."
    options: ["One standard rate for every line, with base, tax and total on each invoice: simplest; wrong if any customer or work item is taxed differently.", "A rate per work item, with base and tax grouped by rate: handles mixed rates; every catalogue item needs a rate.", "Rates per work item plus customer-level exemptions or reverse charge with a stated reason: covers construction subcontracting cases; most rules and data to define."]
    recommendation: "No recommendation yet: the answer depends on the tax rules for this company's construction invoices. Ask the accountant which rates, exemptions or reverse-charge cases occur; if only one rate ever applies, choose the first option."
    depends_on: []
    write_targets: ["system-model/domains/billing/responsibilities/sr-002-invoicing.md", "system-model/contracts/interfaces/iface-002-issued-invoicing.md", "system-model/domains/billing/responsibilities/sr-003-accounting-registers.md"]

  - id: "TICKET-0007"
    title: "Define the customer invoice number series"
    status: "todo"
    kind: "product"
    complexity: "medium"
    concern: "product-policy"
    owner: "SR-002"
    affects: ["SR-002", "SR-003"]
    cluster: "invoice-issuance"
    question: "What format does the customer invoice number take, does the series restart (for example each year), and must numbers be strictly consecutive with no gaps?"
    context: "Issuing assigns the next number in the customer invoice series and makes the invoice final; credit notes come in a later version and will not use this series. Approved sources do not give the format, a restart rule, or what happens to a number if issuing fails after it was assigned. Example: with a yearly series the first invoice of 2027 is 2027-0001; with a continuous series it is the next integer. If gaps are forbidden, numbering and finalising must succeed or fail together."
    candidate_proof: "An implementer cannot finish or verify invoice issuance numbering without choosing the series format, its restart rule and whether gaps are allowed, and the current package does not already choose it."
    options: ["Yearly prefixed series, strictly consecutive: matches common tax-authority expectations; number assignment and finalisation happen in one indivisible step.", "Continuous series, strictly consecutive: no yearly reset; same no-gap requirement.", "Continuous series where failures may leave gaps: simplest; may not be acceptable to the tax authority."]
    recommendation: "Yearly prefixed series with strictly consecutive numbers assigned in the same indivisible step that makes the invoice final, because invoice series usually must be gap-free and auditable by period. Confirm the required format with the accountant."
    depends_on: []
    write_targets: ["system-model/domains/billing/responsibilities/sr-002-invoicing.md", "system-model/contracts/interfaces/iface-002-issued-invoicing.md", "system-model/behavior/flows/flow-002-invoice-issuance.md"]

  - id: "TICKET-0008"
    title: "Resolve whether a draft invoice is stored before issuing"
    status: "todo"
    kind: "product"
    complexity: "medium"
    concern: "state-lifecycle"
    owner: "SR-002"
    affects: ["SR-002", "SR-004"]
    cluster: "invoice-issuance"
    question: "Is there a stored, editable draft invoice between preview and issue, or does the clerk issue directly from the previewed selection with nothing stored before issuing?"
    context: "The brief says the clerk previews totals, then issues, and that issuing makes the invoice final so it can no longer be edited. The approved package contradicts itself: the issuance flow records the state change 'draft to issued', while the invoicing interface says a preview stores and numbers nothing. The answer also settles what happens if prices change between preview and issue. Example: a clerk previews on Monday, a price changes on Tuesday, the clerk issues on Wednesday; a stored draft keeps Monday's figures, issuing from the selection recomputes them."
    candidate_proof: "An implementer cannot finish or verify the issue operation and the invoice state model without choosing whether an editable draft is stored before issue, and the current package does not already choose it."
    options: ["No stored draft: issuing takes the previewed customer and selection and recomputes totals; the flow's draft state is removed; totals can differ from the preview if prices changed.", "No stored draft, and issuing is rejected when recomputed totals differ from the previewed totals, so the clerk previews again: the clerk always issues what they saw.", "Stored editable draft: adds a draft state, a draft listing and cleanup of abandoned drafts; drafts reserve nothing, so issuing a draft whose quantities were invoiced elsewhere is rejected."]
    recommendation: "The second option: it matches the brief's preview-then-issue journey, keeps the interface rule that a preview stores nothing, and guarantees the issued figures equal the previewed ones. It assumes 'can no longer be edited' contrasts the final invoice with the preview, not with a saved draft."
    depends_on: []
    write_targets: ["system-model/behavior/flows/flow-002-invoice-issuance.md", "system-model/contracts/interfaces/iface-002-issued-invoicing.md", "system-model/domains/billing/responsibilities/sr-002-invoicing.md"]

  - id: "TICKET-0009"
    title: "Decide which responsibility records that a validated quantity was invoiced"
    status: "todo"
    kind: "technical"
    complexity: "medium"
    concern: "interface-api"
    owner: "SR-002"
    affects: ["SR-002", "SR-001", "SR-004"]
    cluster: "invoice-issuance"
    question: "Which responsibility is the authority for whether a validated quantity is already invoiced, and how does the clerk's list of billable quantities learn it?"
    context: "Work Reports publishes validated quantities, and its listing is defined to return only quantities not yet invoiced. But only Invoicing knows which quantities are on issued invoices, and nothing tells Work Reports when an invoice is issued. Issuing must also reject an already-invoiced quantity at the moment of issue, which only Invoicing can check reliably. The behaviour is fixed: each validated quantity is invoiced at most once and the clerk chooses among quantities not yet invoiced."
    candidate_proof: "An implementer cannot finish or verify the 'not yet invoiced' filter on validated quantities without choosing which responsibility holds the invoiced status and how the listing obtains it, and the current package does not already choose it."
    options: ["Invoicing owns invoiced status: Work Reports lists all validated quantities with stable references; Invoicing excludes those on issued invoices and offers the clerk a billable-quantities read. One authority, consistent with the issue-time check.", "Work Reports mirrors invoiced status by also receiving the issued-invoice publication: the current listing keeps filtering, but the mark lags issuance, so the list can briefly offer quantities that issuing will reject."]
    recommendation: "Invoicing owns invoiced status, because the architecture makes Billing the authority for invoices and the issue-time check must live there anyway; a lagging copy in Work Reports would offer quantities that can no longer be issued."
    depends_on: []
    write_targets: ["system-model/contracts/interfaces/iface-001-work-reports.md", "system-model/contracts/interfaces/iface-002-issued-invoicing.md", "system-model/behavior/flows/flow-002-invoice-issuance.md", "system-model/domains/operations/responsibilities/sr-001-work-reports.md", "system-model/domains/billing/responsibilities/sr-002-invoicing.md"]

  - id: "TICKET-0010"
    title: "Decide whether issuing produces an invoice document"
    status: "todo"
    kind: "product"
    complexity: "low"
    concern: "data-model"
    owner: "SR-002"
    affects: ["SR-002", "SR-004"]
    cluster: "invoice-issuance"
    question: "Does issuing produce a fixed-layout invoice document (for example a PDF) that the clerk can download and give to the customer, and if so which fields must it show?"
    context: "Sending invoices by email or post and customising the document layout are excluded from this version, which suggests a standard-layout document exists, but no approved source says issuing produces one or how the clerk obtains it. Without one, the customer receives nothing from the system. Example: after issuing, the clerk either downloads a PDF to attach to their own email or copies figures from the screen."
    candidate_proof: "An implementer cannot finish or verify the result of issuing an invoice without choosing whether a downloadable invoice document is produced and what it contains, and the current package does not already choose it."
    options: ["A fixed-layout document is produced at issue and office clerks can download it at any time; it shows number, issue date, customer, lines, tax figures and totals, and never changes after issue.", "No document in this version: the issued invoice exists only as data on screen and in the accountant's listing; customer invoices must be produced elsewhere."]
    recommendation: "Produce a fixed-layout downloadable document at issue, because the excluded layout customisation implies a standard document and customers need an invoice they can receive."
    depends_on: []
    write_targets: ["system-model/contracts/interfaces/iface-002-issued-invoicing.md", "system-model/domains/billing/responsibilities/sr-002-invoicing.md", "system-model/contracts/scope/scope-002-invoice-sending-and-layout.md"]
```

New file `build/workflow/tickets/cross-domain-tickets.yaml` (`ticket_file_version: 4`, `scope: "cross-domain"`, owner `shared`, because each question spans both domains and no single responsibility truthfully owns it):

```yaml
  - id: "TICKET-0011"
    title: "Set the target outcome and runtime profile for this version"
    status: "todo"
    kind: "product"
    complexity: "medium"
    concern: "integration-configuration"
    owner: "shared"
    affects: ["SR-001", "SR-002", "SR-003", "SR-004"]
    cluster: "target-outcome"
    question: "For this version, must the three journeys be runnable by their users in a non-production environment (which one), deployed for production use, or is this a design-only target?"
    context: "The brief names three journeys (work-report validation, invoice issuance, the tax-register listing) but not what outcome proves the version is achieved or where it must run, and the package records no environment, entrypoint, starting data or acceptance outcome. For an application people use, the normal acceptance outcome is that each user can open the real application in at least one approved non-production environment and complete their journey with known starting data and a way to reset it."
    candidate_proof: "An implementer cannot finish or verify acceptance of the three required journeys without choosing which runtime profile must run them, its entrypoint and its starting-data and reset expectations, and the current package does not already choose it."
    options: ["Local non-production environment with seeded sites, customers, prices and test users and a reset to that state; deployment and activation stay later gates. Fastest end-to-end proof; proves neither hosting nor real sign-in.", "Hosted non-production (staging) environment the real users can reach, with seeded data and reset: also proves hosting and access; hosting decisions are needed now.", "Production use: deployed and activated with real users and data; every identity, data-source and operations decision is needed before delivery.", "Design-only: no runnable outcome in this version."]
    recommendation: "Local non-production environment with seeded data and reset, keeping deployment and activation as later gates, because it proves all three journeys without blocking on hosting. It assumes nobody needs to work in the system during this version."
    depends_on: []
    write_targets: ["system-model/architecture.md", "system-model/behavior/flows/flow-001-work-report-validation.md", "system-model/behavior/flows/flow-002-invoice-issuance.md"]

  - id: "TICKET-0012"
    title: "Decide how users and their roles are established"
    status: "todo"
    kind: "product"
    complexity: "medium"
    concern: "access-authority"
    owner: "shared"
    affects: ["SR-001", "SR-002", "SR-003", "SR-004"]
    cluster: "identity-and-reference-data"
    question: "How does the system know who a user is and whether they are a site manager (and for which sites), an office clerk or an accountant?"
    context: "Every operation is limited to a role: office clerks validate reports and issue invoices, accountants list issued invoices, site managers submit reports. No responsibility owns user accounts, sign-in or role assignment, and no external system is named. The workspace holds no authority, so the owning responsibilities must be able to trust who is calling. The site-manager rule decides whether site assignments must also be held; the target outcome decides whether fixed test users are acceptable."
    candidate_proof: "An implementer cannot finish or verify the role checks on every work-report and invoicing operation without choosing where users, roles and site assignments come from and how users sign in, and the current package does not already choose it."
    options: ["User and role administration inside this system: a new responsibility manages users, roles and site assignments and signs users in; complete, but a boundary change to approve.", "The company's existing identity provider signs users in and supplies roles and site assignments: nothing to administer here; depends on the provider carrying the assignments.", "Fixed test users with switchable roles, only inside a non-production profile: proves the journeys; must never become production behaviour, and real sign-in becomes a later gate."]
    recommendation: "Fixed test users inside the non-production profile if that is the target outcome, with real sign-in recorded as a later deployment gate; otherwise the company's identity provider. In-system user administration only if no provider exists."
    depends_on: ["TICKET-0002", "TICKET-0011"]
    write_targets: ["system-model/architecture.md", "system-model/contracts/interfaces/iface-001-work-reports.md", "system-model/contracts/interfaces/iface-002-issued-invoicing.md"]

  - id: "TICKET-0013"
    title: "Decide where customers and sites come from"
    status: "todo"
    kind: "product"
    complexity: "medium"
    concern: "data-model"
    owner: "shared"
    affects: ["SR-001", "SR-002", "SR-003", "SR-004"]
    cluster: "identity-and-reference-data"
    question: "Where do customers, construction sites and the link saying which customer each site's work is billed to come from, and who maintains them?"
    context: "Site managers report per site; the clerk chooses a customer and then that customer's validated quantities. The validated-quantities read is selected by site and period, so the workspace must know which sites belong to the chosen customer, and invoices need the customer's name and tax details. No responsibility owns customers, sites or that link, and no external system is named. The pricing answer may add customer prices to this data; the target outcome decides whether seeded test data is enough."
    candidate_proof: "An implementer cannot finish or verify choosing a customer's billable quantities and issuing their invoice without choosing the source and maintainer of customers, sites and the site-to-customer link, and the current package does not already choose it."
    options: ["Maintained here by office clerks: needs a new or extended responsibility (a boundary change to approve); complete, more to build.", "Read or imported from the company's existing customer or ERP system: nothing to maintain; depends on that system's availability and format.", "Seeded fixed reference data inside the non-production profile only: proves the journeys; real maintenance becomes a later gate."]
    recommendation: "Seeded reference data if the target is the local non-production profile, otherwise read from the company's existing customer system. Each site should bill exactly one customer so a selection never mixes customers; confirm that assumption."
    depends_on: ["TICKET-0005", "TICKET-0011"]
    write_targets: ["system-model/architecture.md", "system-model/contracts/interfaces/iface-001-work-reports.md", "system-model/contracts/interfaces/iface-002-issued-invoicing.md"]
```

**Kind statements (working notes):**
- 0002: chooses who may act → permissions are product, open → product.
- 0003: chooses report cardinality, which changes billable outcomes → product.
- 0004: chooses editable fields and what clerks see → product.
- 0005: chooses accepted inputs and calculation basis → product. The strongest competitor is technical, but no pricing contract is fixed.
- 0006: chooses the tax calculation → product (expert input does not make it technical).
- 0007: chooses legal numbering meaning → product.
- 0008: chooses whether a user-visible draft lifecycle exists → product.
- 0009: the behaviour is fixed (invoice once; show only not-yet-invoiced) and the ticket chooses which responsibility holds and serves that status → technical.
- 0010: chooses a supported output capability → product.
- 0011: chooses the acceptance and runtime claim (scope) → product.
- 0012 and 0013: choose whether a capability is in the product or external → product. Operational does not control either one: no service procedure is being chosen.

**Post-write checks (real session):** structure, ticket and constraint validators; lead report (expected SR-001 = 3, SR-002 = 7, SR-003 = 0, SR-004 = 0, plus 3 shared); decision overview generate + `--check`; `validate-ui-ux-design.mjs` not applicable (no `ui-ux/` yet). None of these ran on the proposed writes in this run.

### Working ledgers (temporary; never written to the package)

**Responsibility × lens** (L1 artifacts, L2 lifecycle/concurrency, L3 authority, L4 interfaces, L5 protocol/transaction, L6 failure/recovery, L7 observation/ops, L8 economics, L9 verification, L10 operability)

| SR | Dispositions |
| --- | --- |
| SR-001 Work Reports | L1 `answered:IFACE-001 Payload (R1)` + `ticket:TICKET-0004` (correction fields/history) + `ticket:TICKET-0005` (what a quantity identifies) · L2 `answered:FLOW-001 (R2), IFACE-001.ACT-001 "deciding twice is rejected"` + `ticket:TICKET-0003` (duplicate site-day); withdrawal `excluded:approved journey has no withdrawal or deletion; validated is final ("cannot be returned")` · L3 `answered:IFACE-001.ACT-001 clerk-only` + `ticket:TICKET-0002` + `ticket:TICKET-0012`; secrets `excluded:no credential or signature artifact` · L4 `answered:IFACE-001.ACT-003/004/005 (R1)` + `ticket:TICKET-0009` (invoiced status) + `ticket:TICKET-0013` (customer→site) · L5 `answered:IFACE-001 Failure Meaning (rejection leaves report unchanged)`; amounts `excluded:Work Reports records quantities only; pricing is TICKET-0005`; date rules `excluded:no approved date rule; no contract effect` · L6 `answered:ACT-001/004 stale rejection + ACT-005 re-read (R1)` · L7 `answered:IFACE-001.ACT-005 (R1)`; return notification `excluded:approved journey shows the reason on the report; no notification channel in scope`; audit `excluded:approved journeys need only state and reason; no manual/operator authority` · L8 `ticket:TICKET-0005` (units); capacity `excluded:no volume or rate requirement` · L9 `answered:IFACE-001 verification intents (R1)` · L10 `ticket:TICKET-0011` + `ticket:TICKET-0012` + `ticket:TICKET-0013` |
| SR-002 Invoicing | L1 `answered:IFACE-002 Payload (+issue date, R3)` + `ticket:0005/0006/0007/0008/0010` · L2 `answered:FLOW-002 + IFACE-002.ACT-002/ACT-004 (R3)` + `ticket:TICKET-0008`; correction/cancel `excluded:SCOPE-001 (R4)`; duplicate/concurrent issue `answered:FLOW-002 Failure + ACT-004 (R3)` · L3 `answered:IFACE-002.ACT-002/004 clerks` + `ticket:TICKET-0012` · L4 `answered:IFACE-002.ACT-004 (R3)` + `ticket:TICKET-0009` + `ticket:TICKET-0013`; publication consumer `paused:B1` · L5 `answered:ACT-004 numbering with finalisation (R3)` + `ticket:TICKET-0001` + `ticket:TICKET-0006` + `ticket:TICKET-0007` (gaps) · L6 `answered:ACT-004 failure (R3) + ACT-001 "redelivered until acknowledged"` · L7 `answered:ACT-004 output and already-invoiced rejection naming the invoice (R3)`; ops alerts `excluded:no operator role in approved scope` · L8 `ticket:TICKET-0001/0005/0006` · L9 `answered:ACT-002/004 intents (R3)` + `ticket:TICKET-0007` · L10 `ticket:TICKET-0011/0013` |
| SR-003 Accounting Registers | L1 `paused:B1` (listing ownership) + `ticket:TICKET-0006` (tax fields) · L2 `paused:B1` (entry per invoice, redelivery duplicates) · L3 `ticket:TICKET-0012` · L4 `paused:B1` (IFACE-002.ACT-001 acknowledgement, period listing) · L5 `answered:FLOW-002 step 4 "registration does not change the invoice"` · L6 `paused:B1` (acknowledgement point) · L7 `paused:B1` (listing freshness) · L8 `ticket:TICKET-0006` · L9 `paused:B1` · L10 `ticket:TICKET-0011` |
| SR-004 Office Workspace | L1 `excluded:owns no business record (Purpose); presentation belongs to the Stage 7 UI/UX specification` · L2 `excluded:no owned state` · L3 `answered:SR-004 Purpose (no authority)` + `ticket:TICKET-0002/0012` · L4 `answered:IFACE-001.ACT-001…005, IFACE-002.ACT-002/004 (R1, R3)`; accountant listing `paused:B1` · L5 `excluded:no transactions; delegates to SR-001/SR-002` · L6 `answered:failure meanings in IFACE-001/002 (R1, R3)` · L7 `answered:refresh by re-read (ACT-005, IFACE-001.ACT-002)` · L8 `excluded:computes no amounts; totals come from IFACE-002.ACT-002` · L9 `excluded:no open choice; functional and UI/UX review routed at Stage 9` · L10 `ticket:TICKET-0011` (entrypoint) + `ticket:TICKET-0012` (sign-in) |

**Handoffs and material-interaction consumer challenges** (access · read-before-write · refresh/retry/recovery · empty/not-found/forbidden/stale · acknowledgement · failure owner)

| Interaction | Producer → consumer | Dispositions |
| --- | --- | --- |
| IFACE-001.ACT-003 submit (new) | SR-004 (site manager) → SR-001 | access `ticket:0002/0012`, site list `ticket:0013` · existing report for site-day `ticket:0003` · double submit `ticket:0003` · not-found/forbidden/invalid `answered:R1` · ack = returned identifier + `submitted` `answered:R1` · owner SR-001 `answered:R1` |
| IFACE-001.ACT-005 read (new) | SR-001 → SR-004 (clerk, site manager) | access `answered:R1` + `ticket:0002` · read-before-write `excluded:observation` · refresh = re-read `answered:R1` · empty/not-found/forbidden `answered:R1` · ack `excluded:observation` · owner SR-001 |
| IFACE-001.ACT-001 decide (widened) | SR-004 (clerk) → SR-001 | access needs ACT-005 `answered:R1` · read-before-write via ACT-005 `answered:R1` · lost-response retry → stale rejection + re-read `answered:R1` · not-found/forbidden/stale/missing-reason `answered:R1` · ack = new state + reason `answered:R1` · owner SR-001; concurrency `answered:"deciding twice is rejected"` |
| IFACE-001.ACT-004 resubmit (new) | SR-004 (site manager) → SR-001 | access `ticket:0002` · read reason first via ACT-005 `answered:R1` · stale `answered:R1` · editable fields `ticket:0004` · ack `answered:R1` · owner SR-001 |
| IFACE-001.ACT-002 validated quantities (reused) | SR-001 → SR-002, SR-004 | access by customer `ticket:0013` · invoiced-status authority `ticket:0009` · refresh by re-read, stale guarded by ACT-004 rejection `answered:R3` · empty/not-found/forbidden `answered:R1` · ack `excluded:observation` |
| IFACE-002.ACT-002 simulation | SR-002 → SR-004 | access `answered` + `ticket:0012/0013` · prices `ticket:0005` · stale preview vs issue `ticket:0008` · not-found/forbidden `answered:R3` · ack `excluded:observation` |
| IFACE-002.ACT-004 issue (new) | SR-004 (clerk) → SR-002 | read-before-write = preview `answered:R3` + `ticket:0008` · lost-response recovery = rejection naming the invoice `answered:R3` · concurrency `answered:R3` · numbering gap `ticket:0007` · ack = issued invoice `answered:R3` · owner SR-002 |
| IFACE-002.ACT-001 publication | SR-002 → SR-003 | initial/restart via redelivery `answered` · acknowledgement point and duplicate handling `paused:B1` · owner SR-002 redelivers |
| IFACE-002.ACT-003 period listing | SR-002 (or SR-003) → SR-004 (accountant) | `paused:B1` |
| Identity source | none → all | `ticket:TICKET-0012` |
| Customer/site reference data | none → SR-001, SR-002, SR-004 | `ticket:TICKET-0013` |

**Target-outcome and runtime-profile census:**
- Outcomes: J1 (site manager and clerk; result: validated quantities billable, or a returned report shows its reason); J2 (clerk; result: a final, numbered invoice made available to accounting); J3 (accountant; result: issued invoices for a period).
- Named profiles: none in the brief or the package. For each outcome the claim, entrypoint (logically SR-004), composition/bootstrap owner, state/reset, external substitutes and proof route are all unrecorded → `ticket:TICKET-0011`, with bootstrap facets in `TICKET-0012`/`TICKET-0013`.
- The J3 producer is additionally `paused:B1`.
- No fixture identities exist that could leak into a product claim.

**Unresolved-language census:**
- No `TBD`/`TODO`/`profile`/`deploy` hits.
- "later" (brief, credit notes) → `answered:SCOPE-001 (R4)`.
- "selected" (IFACE-002.ACT-002 input) → `answered:IFACE-002.ACT-004 (R3)`.
- "recovery" hits are template labels → `excluded:field label`.
- "draft" (FLOW-002) → `ticket:TICKET-0008`.
- "available to accounting" (brief) → `answered:IFACE-002.ACT-001` + `paused:B1`.

**Semantic overlaps:**
- Linked: 0012→0002 (the site rule decides whether the identity source must carry site assignments); 0012→0011 and 0013→0011 (the fixed-test-user and seeded-data options exist only for a non-production target); 0013→0005 (per-customer pricing widens the reference data).
- Justified independent:
  - 0001/0005 (rounding point vs price source).
  - 0001/0006 (tax states its own rounding consistently with either rounding answer).
  - 0005/0006 (every pricing option has work items).
  - 0002/0003, 0003/0004 (a corrected site/date passes the same rule, stated in 0004).
  - 0007/0008 (the number is assigned at issue in every option).
  - 0008/0009, 0008/0005 (the price-change effect is stated in 0008's context).
  - 0010/SCOPE-002 (the scope record holds only approved exclusions).
  - 0006/B1 and 0009/B1 (decided whichever responsibility serves the listing).
- Merges: none.

### 7D — Zero-delta challenge

- **Affected scope:** IFACE-001 (ACT-001…005, payload, validation), FLOW-001, IFACE-002 (payload, ACT-002 failure, ACT-004), FLOW-002 steps 1–3, the SR-001/002/004 Inputs And Outputs rows, SCOPE-001/002, and the 12 new tickets against TICKET-0001.
- **Re-challenge:** I walked each repaired journey step from the consumer side against the proposed text. Every journey-1 and journey-2 step maps to a declared interaction, and every remaining choice has one ticket owner. No additional finding appeared.
- **Retained coverage:** the SR-004 excluded lenses (L1, L2, L5, L8, L9) and the SR-003 lenses not under B1 (L3, L5, L8, L10).
- **Whole-scope revalidation:** not needed. The journey 1–2 responsibility map is stable, and B1 is local to SR-002/SR-003/SR-004 and IFACE-002.
- **Limit:** this pass ran against the proposed text; nothing has been written or validated.
- **After B1 is answered:** delta-review IFACE-002.ACT-001/ACT-003, the new journey-3 flow, SR-003/SR-004 and TICKET-0006.
- **After the owed SR section completion (F8):** impact-review the SR-001…004 Inputs And Outputs against the interfaces.

### Message to the user (verbatim)

> **Stage 7 inventory for the three required journeys: partial. One boundary decision is needed (journey 3).**
>
> Both validators pass, but they only check the shape of the interactions that are declared. Walking each journey step from the user's side found operations that were never declared:
>
> - **Journey 1 cannot start.** Nothing lets a site manager submit a daily work report. The validation flow starts "when a site manager submits", but the Work Reports interface has only the clerk's validate/return and the validated-quantities read. Nothing lets the clerk find and open a report or the site manager see a return reason. The return has no place for the written reason, and the flow gives "resubmit" to the Office Workspace, which holds no report authority.
> - **Journey 2 cannot finish.** There is no operation through which the clerk issues the invoice.
>
> The approved brief already settles these, so they are Software Design repairs, not tickets. Here are the changes (nothing was written in this pass; writes weren't permitted):
>
> 1. **Work Reports interface.**
>    - The validate/return decision now requires a written reason when returning, carries it on the returned report, and spells out not-found, forbidden and stale rejections.
>    - I'm adding Submit a daily work report, Correct and resubmit a returned report, and Work reports and their current state (the clerk's queue and report view, plus the site manager's view of returned reports and reasons).
>    - The validated-quantities read stays as it is.
> 2. **Work-report validation flow.** It gains a submission step. The state changes now belong to Work Reports, with the workspace only showing and forwarding them.
> 3. **Invoicing interface.** I'm adding Issue an invoice, classed `high` risk because it creates a final, numbered tax document. Invoices also gain an issue date so the accountant can list by period.
> 4. **Scope records** for the brief's exclusions: credit notes (deferred) and invoice sending/layout customisation (excluded).
> 5. **12 new `todo` tickets** for the choices the brief leaves open:
>    - Work-report submission (Work Reports): site-manager authority; one report per site and date; what a correction may change.
>    - Invoicing: price source and invoice lines; tax; invoice number series; draft vs direct issue (the flow and interface currently contradict each other); which responsibility records that a quantity was invoiced; whether issuing produces an invoice document.
>    - Cross-domain: target outcome and runtime profile; how users and roles are established; where customers and sites come from.
>
> Agent-chosen in these repairs (recorded with attribution, listed so you can see them):
> - Separate submit/correct/read operations, and clerks may read every report.
> - Not-found/forbidden/stale rejection meanings, and the per-quantity reference and submitter on each report.
> - Work Reports owning the resubmission state change.
> - Issue risk `high`, the invoice issue date, and the already-invoiced rejection naming the existing invoice.
> - The scope records' "must not be inferred" and revisit wording.
>
> **Coverage receipt.**
> - Work Reports: gained 3 tickets plus the interface repairs; 10/10 lenses dispositioned.
> - Invoicing: kept TICKET-0001 and gained 6 tickets plus the issue repair; 10/10.
> - Accounting Registers: paused at the boundary below (listing, register entries, publication acknowledgement); its other lenses are dispositioned.
> - Office Workspace: no material question of its own (it is affected by the shared target-outcome and identity tickets); 10/10.
> - All direct handoffs and every applicable consumer challenge are dispositioned except the paused journey-3 branch. The target-outcome census found no recorded profile, which is now TICKET-0011.
> - Tickets after the writes: 13 `todo` (Work Reports 3, Invoicing 7, shared 3); 0 deferred, decided, finished or out-of-scope.
> - Clusters: work-report-submission 3, invoicing 3, invoice-issuance 4, target-outcome 1, identity-and-reference-data 2.
> - Genuine dependencies: identity → site-manager authority and target outcome; customers/sites → pricing and target outcome. All other overlaps were checked and are independent; no merges.
> - Zero-delta re-challenge of the repaired boundaries: no further finding.
> - Validators passed before the changes, which is structural only. They have not run on the proposed writes.
>
> **Decision needed: who answers the accountant's tax-register listing?**
> Accounting Registers' approved purpose is to own "the tax-register listings derived from issued invoices", and it records an entry for every issued invoice. But the only listing the accountant can actually use, "Issued invoices for a period", is produced by Invoicing, and nothing exposes Accounting Registers' entries to anyone. Journey 3 also has no flow. I've paused only this branch; journeys 1 and 2 are unaffected.
>
> - **A (recommended):** the accountant's period listing becomes Accounting Registers' tax-register listing.
>   - I'd add an Accounting Registers interface to the workspace with a "Tax-register listing for a period" read (accountants only, in series-number order, empty when nothing was issued).
>   - I'd remove the duplicate Invoicing listing and add a journey-3 flow.
>   - The invoice publication becomes precise: Accounting Registers acknowledges only after recording the entry and ignores an invoice it has already recorded.
>   - Effect: an invoice appears in the listing once its publication is recorded, normally moments after issue. Invoicing stays the authority for the invoice itself.
> - **B:** the accountant keeps listing issued invoices straight from Invoicing.
>   - No approved journey would then use Accounting Registers, so it must be merged into Invoicing or given another purpose. That is a change to the approved responsibility map.
>   - Effect: fewer parts, but it contradicts Accounting Registers' approved purpose and the architecture's "registers derived from" invoices.
>
> Route: a Software Design repair of approved responsibility and interface records; it pauses only the journey-3 branch. Recording plan: Software Design only (interfaces, one new flow, the Accounting Registers and Office Workspace records); no Build Design.
>
> **Still open for Stage 7 beyond this inventory:**
> - The System Responsibility records contain only their purpose; the required sections are missing.
> - The UI/UX specification and reviewed prototype for the three journeys haven't started.
>
> Software Design is therefore not complete. Build Design and Delivery Readiness were not assessed.
>
> **A or B?**

### Completion result

**`TICKET_INVENTORY_PARTIAL`**

Exact blockers:
1. The journey-3 boundary decision (B1) leaves Accounting Registers' outputs, `IFACE-002.ACT-001` acknowledgement and `IFACE-002.ACT-003` paused.
2. Repairs R1–R5 and the 12 tickets are not yet written, so the post-write validators, lead report and decision overview have not run on them.

After B1 is answered and the writes pass their checks, the affected delta review is the only remaining step before `TICKET_INVENTORY_COMPLETE`. That completion is for the inventory snapshot only: Stage 7 also still needs the System Responsibility section completion and the UI/UX lane.

---

## Scenario 6

Same pass and result as Scenario 5 (`TICKET_INVENTORY_PARTIAL`; B1 does not touch journey 1). This answer covers journey 1 against `IFACE-001.ACT-001` and `IFACE-001.ACT-002`.

### Step-to-interaction map after the pass

| Journey 1 step (brief) | Interaction | Handling |
| --- | --- | --- |
| Site manager submits a daily work report | `IFACE-001.ACT-003` Submit a daily work report | **Add** (the initiating operation) |
| Office clerk opens it | `IFACE-001.ACT-005` Work reports and their current state | **Add** |
| Clerk validates it, or returns it with a written reason | `IFACE-001.ACT-001` Validate or return a work report | **Reuse, widened** |
| Returned report shows the reason to the site manager | `IFACE-001.ACT-005` | **Add** (same read, site-manager access) |
| Site manager corrects and resubmits | `IFACE-001.ACT-004` Correct and resubmit a returned report | **Add** |
| Validated quantities become billable | `IFACE-001.ACT-002` Validated quantities for a period | **Reuse** (failure meanings only) |

### Reuse

- **`ACT-001` is kept as the single decision operation** for both outcomes, with the same ID, anchor, `callable` kind, "Office clerks only" authority, `ordinary` risk and "deciding twice is rejected" rule. I do not split it into separate validate and return actions, because both are one clerk decision on one submitted report with one precondition and failure owner. I do not add a "return with reason" action beside it.
- **`ACT-002` is kept as the journey's end state.** "Validated quantities become billable" is exactly what Invoicing and the clerk read. Its input (site, period), output, access and verification intent are unchanged. Its "not-yet-invoiced" clause is left as written: who holds that status is `TICKET-0009`, and editing it now would pre-empt that ticket.

### Widen

- **`ACT-001` (contract repair, settled by the brief, not a ticket).**
  - Input: "`validate`, or `return` with a non-empty written reason".
  - Output: a returned report carries the reason, which its site manager sees through ACT-005.
  - Failure: not found / forbidden / stale (with current state, so a lost-response retry is resolved by re-reading through ACT-005) / return without reason rejected; every rejection leaves the report unchanged.
  - Verification intent: the reason is stored and exposed; a reasonless return, a non-clerk decision and a double decision are rejected without change.
  - Why this is a repair: FLOW-001 step 2 already says "returned report carrying the reason" and the brief requires a written reason, so the interface was narrower than its own flow. The IFACE-001 **payload** widens with it: return reason, submitting site manager, and a reference per quantity that stays stable within its report.
- **`ACT-002`, failure meanings only.** An unknown site is not found and any other caller is forbidden; empty still means nothing validated. That closes the empty/not-found/forbidden consumer challenge without changing scope.
- **Not widened: `ACT-002` into a report read.** Opening a submitted report and showing a return reason are different observations:
  - different state (any state vs validated only);
  - different selector (a report vs site and period);
  - different audience (site managers, who must never get billing-facing data, vs Invoicing, which must never see unvalidated reports).
  Folding them in would break ACT-002's verification intent ("only validated, not-yet-invoiced quantities appear") and the flow's "only validated quantities become billable".
- **Not widened: `ACT-001` into "submit, validate or return".** Submission is done by a different actor (site manager, not clerk), has a different precondition and creates a report. Merging would make "Office clerks only" false. A command surface also never stands in for the read the clerk needs before deciding.

### Add

- **`ACT-003` Submit a daily work report** (`callable`; site managers; creates a `submitted` report; rejected submissions create nothing). This is the missing initiating operation.
- **`ACT-004` Correct and resubmit a returned report** (`callable`; the report's site manager; `returned → submitted` under the same identifier; stale if not returned). It is kept separate from ACT-003 because it acts on an existing report in another state, with its own precondition and failure meaning.
- **`ACT-005` Work reports and their current state** (`state-observation`; clerks read all reports; site managers read reports within their access; returns quantities, state and any return reason). One read serves both the clerk's "open it" and the site manager's "see the reason", because it is the same object and projection, differing only by access scope.
- **FLOW-001** gets the submission step, links each step to its ACT, and moves the `returned → submitted` change from Office Workspace to Work Reports (Agent-chosen reconciliation with the workspace's "no report authority" purpose). It also gains Outcomes, which link "validated → billable" to ACT-002.
- **Not added:** no new interface record (IFACE-001 is already the Work Reports ↔ workspace boundary and already lists the workspace as consumer); no renumbering (new ACTs append as 003–005); no ticket for "add a submit operation" (nothing to choose, since the brief decides it).
- **Tickets for the parts the brief leaves open:**
  - `TICKET-0002`: which site managers may submit and correct (ACT-003/004/005 access).
  - `TICKET-0003`: one report per site and date (ACT-003 rejection).
  - `TICKET-0004`: which fields a correction may change and whether earlier reasons are kept (ACT-004 input, payload).
  The ACT text points to each open ticket instead of guessing an answer.
- **Attribution in IFACE-001:**
  - The journey behaviour is Human-approved · User specified (brief, Required journeys 1).
  - The interaction split, rejection meanings, clerk read scope, quantity reference and submitter field are Agent-chosen.

### Message to the user (verbatim, journey-1 part of the same report)

> For journey 1, I reused the existing two operations and filled the gaps around them:
>
> - The clerk's **validate-or-return** operation stays the one decision operation. It now requires the written reason when returning and keeps it on the report.
> - The **validated-quantities** read stays exactly the billable output it was. It only gained clear "unknown site" and "not allowed" meanings. I deliberately did not stretch it to open reports or show reasons, because that would expose unvalidated reports to Invoicing and billing data to site managers.
> - I'm adding three operations the journey needs and the package never declared:
>   - **submit a daily report** (the missing first step);
>   - **correct and resubmit** a returned report;
>   - **read reports and their state**, so the clerk can find and open a report and the site manager can see why it was returned.
> - The flow now gives these state changes to Work Reports instead of the workspace.
> - Three questions the brief leaves open are new tickets: who may submit and correct for a site, whether a site can have two reports for one date, and what a correction may change.


---

<!-- trial file responses-R.md -->

### Responses — Scenarios 7 to 10

Skill under test: `trial-m/skill/SKILL.md`. Paths below are package-relative to the consumer's `design/software-design/` unless stated. `<skill>` is the directory containing the active `SKILL.md`.

## Scenario 7

**Routing and references read.** Writing an approved contract is part of the staged blueprint (Stage 5 contract pass), so I read `package-layout.md`, `system-model-format.md`, `staged-design-workflow.md`, `checkpoint-workflow.md`, and the interface template. I'm recording settled decisions and interpreting a delegation, so I read `decision-attribution.md`. I read `implementation-detail-tickets.md` and the candidate test in `ticket-inventory-mode.md` to decide whether these points need tickets, and its consumer-challenge rule for empty, not-found, forbidden and unavailable results. I read `system-guide.md` (Keeping Guides Current) for guide reconciliation after a contract write.

**How I classify the three open points.** None of them is a real product decision. The approved journey already fixes the product requirement, "the customer sees their upcoming bookings first". What remains is how the contract meets it:

- **Default sort order.** The approved rule is upcoming bookings first. I still have to choose the order within each group and a stable tie-breaker so pages don't repeat or skip bookings. This is a routine choice, and it does not weaken the approved requirement.
- **Page size.** This is a routine, reversible choice and is covered by the delegation.
- **Empty list.** This is a representation choice inside the settled behavior. A customer with no bookings is a normal state, not an error. The consumer challenge requires keeping "empty" separate from "not found", "forbidden" and "unavailable". Otherwise a screen could show "no bookings" when the read actually failed or was refused. This choice doesn't change any promised outcome, so it's within the delegation.

All three still set interface behavior, so each is a meaningful decision that needs attribution. The user delegated them in so many words, so I don't ask. I record each one as Agent-chosen and keep going (decision-attribution: "Handle it; I trust you" choices stay Agent-chosen; record them and continue without asking).

**Actions**

1. Check the owning System Responsibility's ticket file for a ticket that already covers these points. None is described here.
   - If one existed, I would record the answer and its `attribution` there, set it to `decided`, and set it to `finished` after the write.
   - With no ticket, the attribution goes in the contract's own `## Decision Attribution` section. I create no ticket just to hold attribution, and none for reversible local discretion.
2. Edit `system-model/contracts/interfaces/iface-006-<slug>.md`. Write the ACT-002 entry:

   ```markdown
   <a id="act-002"></a>
   ### ACT-002 — List a customer's bookings

   **Kind:** `callable`

   **Trigger or entry:** The customer opens their bookings list, or asks for the next page of it.

   **Input:** The customer whose bookings are listed and, for a later page, the continuation marker returned with the previous page.

   **Output or observable result:** A page of up to 20 of that customer's bookings. Upcoming bookings come first, soonest first; past bookings follow, most recent first; bookings with the same start time are ordered by booking reference, so no booking repeats or is skipped across pages. Every page except the last returns a continuation marker. A customer with no bookings receives a successful, empty list.

   **Access or authority:** Unchanged — the access rule already approved for this contract.

   **Failure and recovery:** An empty list means only "this customer has no bookings". A caller who may not see these bookings receives the existing denial, never an empty list. When bookings cannot be read, the result is a retryable "unavailable" failure that the consumer must not present as "no bookings"; the consumer retries the same page. An invalid or expired continuation marker is rejected and the consumer restarts from the first page. Not-found is never used for a customer with zero bookings.

   **Risk:** `ordinary`

   **Verification intent:** For a customer whose upcoming and past bookings span more than one page: upcoming soonest first, then past most recent first, with no repeats or gaps across pages. A customer with no bookings gets an empty list. A denied caller, an unavailable booking store and an invalid continuation marker each produce their own failure, never an empty list.
   ```

   Add a bullet to `## Must Not Imply`: "An empty list never stands for a denied request or a failed read."

   Add rows to the record's `## Decision Attribution` table:

   ```markdown
   ## Decision Attribution

   | Decision | Origin | Evidence | Conditions |
   | --- | --- | --- | --- |
   | Customer bookings list order (`IFACE-006.ACT-002`): upcoming bookings soonest first, then past bookings most recent first; equal start times ordered by booking reference. | Agent-chosen | Chosen while writing `IFACE-006.ACT-002`. The user said earlier in this session: "Decide the routine details yourself and record them as Agent-chosen; only bring me real product decisions." The upcoming-first rule itself comes from the approved journey (linked) and keeps that origin; this entry covers only the ordering inside it. | None |
   | Customer bookings list paging (`IFACE-006.ACT-002`): up to 20 bookings per page, continued with the marker returned by the previous page; an invalid or expired marker is rejected and the list restarts from the first page. | Agent-chosen | Chosen while writing `IFACE-006.ACT-002` under the user's instruction "Decide the routine details yourself and record them as Agent-chosen". | None |
   | A customer with no bookings receives a successful empty list (`IFACE-006.ACT-002`); denial and unavailability remain distinct failures and are never returned as an empty list. | Agent-chosen | Chosen while writing `IFACE-006.ACT-002` under the user's instruction "Decide the routine details yourself and record them as Agent-chosen". | None |
   ```

3. In the producing System Responsibility record's `Inputs And Outputs`, state the consumer need and link `IFACE-006.ACT-002`: the first page, the next page, what an empty list means, and recovery when bookings are unavailable. I change only meaning that is missing or different.
4. Reconcile the guide passage that explains the bookings list, if one does. Change only the sentences that tell these facts.
5. If the UI/UX specification covers the bookings list, check that its requirements show the empty state and the upcoming-first order.
   - If the initial reviewed prototype already exists, add a `Change Synchronization` row for that journey instead of editing or rendering the prototype.
6. Run:
   - `node <skill>/scripts/validate-software-design-structure.mjs --root <package>`
   - `node <skill>/scripts/generate-decision-overview.mjs --root <package>`, then the same command with `--check`
   - `validate-ui-ux-design.mjs`, if the specification changed

**Message to the user at this moment:** None. These are delegated routine details, so I continue the contract pass without asking.

**Report (in the end-of-pass handback)**

> IFACE-006 now includes the "list a customer's bookings" interaction (`system-model/contracts/interfaces/iface-006-<slug>.md`), and the bookings responsibility links to it. Structure validation and the decision overview have been regenerated and checked. These checks are structural only.
>
> As you asked, I settled these routine details myself and recorded them as Agent-chosen. I'm listing them so you can see them; this isn't a request for approval.
> - **Order of the bookings list.** Upcoming bookings come first, soonest first, then past bookings, most recent first. Bookings at the same time are ordered by booking reference so paging never repeats or skips one. Recorded in the IFACE-006 Decision Attribution. The "upcoming first" rule itself comes from your approved journey.
> - **Page size.** 20 bookings per page. An expired page marker makes the list start again from the first page. Recorded in IFACE-006.
> - **No bookings.** A customer with no bookings gets an empty list, not an error. A refused request and "bookings couldn't be loaded" stay separate errors, so the screen never says "no bookings" when it simply failed to load them. Recorded in IFACE-006.
>
> No product decisions came up in this contract.

## Scenario 8

**Routing and references read.** This is human-facing Stage 7 work, so I read `ui-ux-design.md`, `ui-ux/design-workflow.md` (prototype mechanics) and the specification template. I read `decision-attribution.md` for what the delegation covers and what it doesn't. I read `implementation-detail-tickets.md` for ticket shape and how to assign kind (product vs technical), and `ticket-inventory-mode.md` for the candidate test and the rule against speculative tickets. I read `checkpoint-workflow.md` for the active pass and when to ask about UI matters, and `staged-design-workflow.md` and `system-model-format.md` because a security record would be needed if geocoding is chosen. I read `technical-constraints.md`: an unanswered ticket creates no constraint record. I read `build-design-and-delivery-readiness.md` because a library choice becomes an implementation selection record at Build Design.

**How I classify the open points**

- **Map library for the prototype.** This is not a decision. Prototypes must be portable static files that open from disk, with no remote host, content delivery network or online dependency. So the prototype loads no map library and no online map imagery. It uses a small local schematic map picture. I record that as a demo convenience under "Product And Demo Boundary". It needs no attribution.
- **Map library for the product.** This is a technical (Software) implementation choice, and under the delegation I would make it myself and record it as Agent-chosen. But whether a map exists at all depends on the location answer. I create no speculative ticket for a branch that may never be selected. If the answer includes a map, I create a technical ticket that depends on the product ticket and decide it under the delegation. At Build Design it becomes an implementation selection record.
- **How locations are stored and where coordinates come from.** This is a real product decision, so the delegation doesn't cover it. It decides:
  - whether customers' work-site addresses are disclosed to an outside company;
  - a per-request running cost;
  - whether site managers get a new task;
  - what data the product accepts and keeps.

  It also creates a security boundary if the geocoding option is chosen. The brief settles only that the screen "shows where each site is". Choosing here would decide an unresolved product question without approval. Delegated discretion never covers that, and the user explicitly asked for real product decisions to come to them. I pause only this part. Name, contact and schedule continue.

  Kind check: this ticket chooses what location data the product records, who supplies it, and whether customer addresses go to a paid third party. The brief fixes only "shows where each site is", and the rest is open, so the kind is `product`. `technical` doesn't control it, because the promised data, workflow and disclosure aren't fixed yet; the mechanism (the library) is a separate, later choice.

**Actions**

1. Continue the site details screen in the selected candidate with its settled content: name, contact and schedule.
2. Show the location area as a labelled exploration hypothesis.
   - The reviewer area switches between "address as text" and "address plus a pin on a local schematic map".
   - The label "Exploration — how site locations are recorded is not decided" sits in the reviewer area and prototype disclosure, not in product copy.
   - Nothing about location goes into canonical owners until the ticket is decided.
3. Create one ticket in the ticket file of the System Responsibility that owns site records, `build/workflow/tickets/<domain>/sr-0xx/sr-0xx-tickets.yaml`, using the next free ID. Main fields:

   ```yaml
     - id: "TICKET-NNNN"
       title: "Choose how site locations are recorded and whether addresses go to a geocoding service"
       status: "todo"
       kind: "product"
       complexity: "medium"
       concern: "data-model"
       owner: "SR-0xx"            # site records
       affects: ["SR-0xx", "SR-0yy"]   # site records; site-details presentation owner if separate
       build_units: []
       build_unit_disposition: "Realization mapping has not started."
       cluster: "site-details"
       question: "How is a site's location recorded for the site details screen: address text only, address plus coordinates the site manager sets by placing a pin, or address plus coordinates obtained by sending the address to an external paid geocoding service?"
       context: "The approved brief says the site details screen shows where each site is; name, contact and schedule are settled; nothing else about location is. The choice decides whether customers' work-site addresses are disclosed to an outside provider, whether each lookup is paid, and whether site managers get an extra step. Illustration: a manager adds a site at 14 Quay Road ..."
       candidate_proof: "An implementer cannot finish or verify the site details location display without choosing whether locations are stored as address text, manager-placed coordinates, or geocoded coordinates, and the current package does not already choose it."
       options: ["Address text only: ...", "Address plus manager-placed pin: ...", "Address plus geocoded coordinates: ..."]
       recommendation: "Address text only for this version, assuming people use the screen to identify the site and reach it by address; manager-placed pin if they need the exact spot; geocoding only if the client accepts disclosure of work-site addresses to the provider and the per-lookup cost."
       resolution: null
       attribution: []
       depends_on: []
       write_targets: ["system-model/domains/<domain>/responsibilities/sr-0xx-<site-records>.md", "system-model/contracts/interfaces/iface-0zz-<site-details>.md", "ui-ux/specification.md"]
   ```

   The ticket gets no attribution, because an unanswered recommendation is only a proposal.
4. Update `ui-ux/specification.md`:
   - In the site-details journey row, mark location as open and link the ticket.
   - Set `Required prototype coverage` to `Incomplete — site details location pending TICKET-NNNN`.
   - Under `Product And Demo Boundary`, record the local schematic map as a placeholder, not a library choice.
5. Run `validate-implementation-detail-tickets.mjs` and `validate-ui-ux-design.mjs`. I create no security, constraint or implementation selection record yet.

**Message to the user (verbatim)**

> The site details screen is coming along. Name, contact and schedule are settled and I'm carrying on with them. One part is a real product decision rather than a routine detail, so I'm bringing it to you.
>
> **How should a site's location be recorded?** The brief says the screen "shows where each site is", but not how the location gets into the system. The answer decides three things:
> - whether your customers' work-site addresses are sent to an outside company;
> - whether you pay for each lookup;
> - whether site managers get an extra step.
>
> Illustration (not a requirement): a site manager adds a new site at "14 Quay Road, Northport".
>
> - **A — Address only.**
>   - The manager types the address and the screen shows it as text.
>   - There is no map, nothing leaves the system, and there's no running cost.
>   - Anyone who needs directions copies the address into their own maps app.
> - **B — Address plus a pin the manager places.**
>   - The manager also drops a pin on a map at the right spot, for example the side gate, and the screen shows the map with that pin.
>   - No address is sent to a lookup service.
>   - The pin is only as accurate as the manager's click. A site saved without a pin shows the address only.
>   - The map pictures would come from a standard map provider. That provider can see roughly which area is being viewed, but not customer names or addresses. Keeping even that in-house means hosting our own map pictures, which adds setup and running cost.
> - **C — Address plus an automatic map position from a geocoding service.**
>   - When the address is saved, it's sent to the geocoding provider, which returns a map position. The screen shows a pin with no extra step for the manager.
>   - Every customer work-site address goes to that outside company, and each lookup is paid.
>   - If the provider can't match an address or is down, that site has no pin until the lookup is retried.
>   - Map pictures work as in B.
>   - Depending on your client contracts and the provider's terms, this might also need the client's agreement to share those addresses. I don't know whether it does; it's something to check.
>
> **My recommendation: A for this version.** That assumes people mainly use the screen to identify the site and get there by its address. Choose B if they need the exact spot, for example large or rural sites or a specific entrance. I'd avoid C unless the client explicitly accepts sending their work-site addresses to an outside provider and the per-lookup cost.
>
> What follows from your answer:
> - With A there's no map, so no map library is needed.
> - With B or C, I'll choose the map library myself under your earlier instruction and record it as Agent-chosen.
> - C also adds a security record that states exactly what is sent to the geocoding provider.
>
> Until you decide, the prototype shows location as a clearly labelled exploration: the address as text, and a pin on a simple built-in map picture. Nothing about location goes into the design records yet. I've logged this as open ticket TICKET-NNNN.
>
> Which should it be: A, B, C, or something different?

**Report.** The message above is the report for this point. When the user answers, I record the answer on the ticket with its attribution, set it to `decided`, and write the result into its owners. If they pick A with a plain yes, it's Human-approved · Agent recommended; B or C is recorded according to how they chose it. If C is chosen, I add the security record and the external interaction. The site details pass then continues without asking again.

## Scenario 9

**Routing and references read.** I read `planning-execution-contract.md` first, as `SKILL.md` requires before readiness decisions. Then `package-layout.md`, `build-design-and-delivery-readiness.md` (repository preflight, realizability challenge, handoff sequence, UI/UX delivery review), `maintainability-and-agent-guidance-baseline.md` (first-party repositories), the `handoff-sequence.md` and `delivery-planning-handoff.md` templates, `ui-ux-design.md` (web-checkout is human-facing), and `implementation-detail-tickets.md` (mapping a contract-changing ticket to producer and consumer Build Units). I would read `assurance-traceability.md` only if the selected units have structured Verification Obligations.

**Assessment**

- **TICKET-0031 (`todo`)** decides the rounding rule in `IFACE-003`, which payments-api produces and web-checkout consumes.
  - The ticket changes the contract's behavior, so it must map every Build Unit bound to `IFACE-003` on both the producer and consumer side.
  - A `todo` ticket blocks READY.
  - It can change a shared producer's public surface, so it must be finished before payments-api can be executed.
  - Which rounding result is correct is a product decision.
- **INPUT-004** is the settlement-file specification. The user said it is in `docs/provider/`, but the folder is empty.
  - Its availability is `missing`, which blocks payments-api planning.
  - I don't guess the format or substitute another source.
- **reporting-export** consumes only `IFACE-005`, which has no path to `IFACE-003`, and TICKET-0031 isn't mapped to it.
  - Under "continue unaffected work; withhold only the affected readiness claim", it can be assessed and handed off on its own.
  - Its handoff still needs its own checks to pass.
- **checkout-prototype ownership note.** The note is stale: the session was archived on 2026-10-29 with no changes after 2026-10-20. The work belongs to the prototype pass the user already authorized for me. I don't wait on an archived session or ask permission again. I take the work over, start from whatever that session left in the candidate folder, and say so.
- **web-checkout UI readiness** also needs the remaining checkout screens built, inspected as rendered pages, and recorded in the specification's reviewed coverage.

**Actions**

1. Run `sync-technical-constraint-sources.mjs`, then `validate-technical-constraints.mjs`.
2. For reporting-export, run the full Stage 9 sequence:
   - Repository discovery preflight.
   - `report-build-unit-readiness-reconciliation.mjs`: a two-way check between tickets and Build Units.
   - The realizability challenge: the eight core axes plus the five compatibility axes.
   - The Required Input Ledger and the Required Interaction Closure for the `IFACE-005` actions. This includes checking that the `IFACE-005` producer is actually available, together with a fresh consumer-side challenge.
   - The physical seam closure (`PSEAM` entries), target-outcome closure, and runtime-profile claims.
   - If everything passes, write `build/workflow/handoffs/repo-<id>-reporting-export.md` with `IMPLEMENTATION_DETAILS_READY`, then:
     - `delivery-snapshot.mjs --write --check`;
     - `validate-delivery-readiness.mjs --validation-mode planning --handoff <path>`.
   - If anything fails, write no handoff and report the exact blocker.
3. Create no handoff for payments-api or web-checkout. When a slice is blocked, its handoff stays absent.
4. Check that TICKET-0031's `build_units` lists the payments-api and web-checkout units and not the reporting-export unit. Its `affects` must list the producer and consumer responsibilities. Fix the mapping if it's wrong, then run `validate-implementation-detail-tickets.mjs`.
5. Create `build/workflow/handoffs/README.md`, the first Stage 9 artifact. Runnable independent work comes before blocked work:

   ```markdown
   # Handoff Sequence

   **Current order group:** `1`

   | Order group | Delivery slice | Repository | Build Units | Requires | State |
   | ---: | --- | --- | --- | --- | --- |
   | 1 | `repo-<id>-reporting-export` | `REPO-<id>` | `BU-…` | `None.` | `Next` (becomes `Ready` with a link once its handoff passes) |
   | 2 | `repo-<id>-payments-api` | `REPO-<id>` | `BU-…` | `None.` | `Blocked — TICKET-0031 (IFACE-003 rounding rule) is todo; INPUT-004 settlement-file specification missing (docs/provider/ is empty)` |
   | 3 | `repo-<id>-web-checkout` | `REPO-<id>` | `BU-…` | `repo-<id>-payments-api` | `Blocked — TICKET-0031 (IFACE-003 rounding rule) is todo; remaining checkout prototype screens not yet inspected and reviewed` |
   ```

   Run `validate-handoff-sequence.mjs --validation-mode planning`. I reconcile the README again at the end of the pass, after the reporting-export outcome is known and the checkout screens are done.
6. Finish the remaining checkout prototype screens in the selected candidate:
   - Prices whose display depends on the rounding rule are labelled illustrative (pending TICKET-0031) in the reviewer area.
   - Open `ui-ux/index.html` from disk and walk the checkout journeys at representative viewports.
   - Record the tool, findings and coverage in `ui-ux/specification.md`.
   - Update the note that assigned the screens to checkout-prototype.
   - Run `validate-ui-ux-design.mjs`.
7. No application code is changed. Delivery Planning is not started.

**Message to the user (verbatim)**

> Not everything. Only reporting-export can go to Delivery Planning, and only once its own readiness checks pass. payments-api and web-checkout are blocked. No application code has been changed.
>
> **reporting-export — can go ahead.**
> - It only uses the bookings export (IFACE-005), and nothing it depends on touches the pricing contract, so the open rounding question doesn't affect it.
> - I'm running its full readiness checks now. If they pass, I'll write its handoff and offer you Delivery Planning for it. I won't start planning on my own.
>
> **payments-api — blocked, for two reasons.**
> 1. The currency rounding rule (TICKET-0031) is still open. payments-api produces the shared pricing contract (IFACE-003), and that rule changes what the contract returns, so payments-api can't be planned until you decide it.
> 2. Its plan needs the payment provider's settlement-file specification. You said it's in docs/provider/, but that folder is empty, so I can't confirm the file format payments-api has to read. I won't guess it.
>
> **web-checkout — blocked.**
> - It reads prices from the same pricing contract, so it waits on the same rounding decision, and it can only be built after payments-api.
> - Its remaining checkout prototype screens weren't finished either. Earlier notes say the checkout-prototype session owns them, but that session was archived on 2026-10-29 with no changes since 2026-10-20, and the screens are part of the prototype work you already authorized for me.
> - So I'm finishing them now, starting from whatever that session left, and I'll update the note.
> - Any price on those screens that depends on the rounding rule stays labelled illustrative until TICKET-0031 is decided.
>
> Delivery order I've recorded:
> 1. reporting-export
> 2. payments-api — blocked (rounding rule; settlement-file specification missing)
> 3. web-checkout — blocked (rounding rule; checkout screens being finished); needs payments-api first
>
> Two things from you would unblock payments-api and web-checkout:
> 1. Can you put the provider's settlement-file specification in docs/provider/, or tell me where it is?
> 2. Shall I take you through the rounding decision in TICKET-0031 now?

**Report state after the pass**

- Planning complete: reporting-export, if its checks pass. Planning blocked: payments-api (`NEEDS_PRODUCT_DECISION` for TICKET-0031, plus the missing INPUT-004 the user must supply) and web-checkout (TICKET-0031, and it requires payments-api).
- Files: the sequence README; the reporting-export handoff (only if ready); the TICKET-0031 mapping (only if it needed correction); the checkout candidate pages and specification.
- Decisions needed: TICKET-0031. User action needed: provide INPUT-004.
- Next authorized action: offer Delivery Planning for reporting-export only.

## Scenario 10

**Routing and references read.** From `SKILL.md`: answer a status question directly; Stage 7 completion and the UI readiness rules. Then `ui-ux-design.md` (Stage 7 completion, rendered inspection, validation limits), `ui-ux/design-workflow.md` (selected direction vs covered-flow approval vs required coverage), the specification template's Prototype Review fields, `decision-attribution.md` (choosing a visual direction approves only the presentation; a reviewer's check is not the user's approval; Agent-chosen decisions are described truthfully, never as "approved"), and `implementation-detail-tickets.md` (TICKET-0019 is an open product decision).

**Assessment**

- **Validators.** The three passing validators prove structure only: files, links, declarations and markers. They say nothing about how the prototype looks, how usable it is, or whether it reaches the required coverage.
- **Rendered inspection.** It has not happened, because no browser is available. I can't claim visual verification, or that the prototype opens correctly from disk.
- **Coverage.** Required coverage is incomplete. TICKET-0019 (whether staff can override the cancellation fee) is an unanswered material UI decision. It changes staff authority and the cancellation journey, so that scope is incomplete.
- **Approvals.** The only human approval is the selection of Candidate C, and it covers presentation qualities only. Covered-flow approval reads `Not reviewed`. The independent reviewer checked the interface contracts, not the prototype, and a reviewer's check is evidence, not the user's approval. Page size 25 and newest-first sort are Agent-chosen.
- **Conclusion.** Stage 7 UI completion cannot be claimed, and telling the client "approved" would be untrue.

**Actions**

1. Check `ui-ux/specification.md` and make sure it records the current state truthfully, adding anything missing:
   - Rendered inspection: `Blocked — no browser available in this environment; no rendered or direct-from-disk check performed; source and structural checks only.`
   - Review status: `Not reviewed`.
   - Required prototype coverage: `Incomplete — cancellation journey pending TICKET-0019 (staff override of the cancellation fee)`.
   - Covered-flow approval stays `Not reviewed`. No approval is added anywhere.
   - If the specification changed, re-run `validate-ui-ux-design.mjs`.
2. Confirm that the regenerated decision overview lists page size 25 and newest-first sort under Agent-chosen.
3. No other edits.

**Message to the user (verbatim)**

> No to both, not yet.
>
> **Is the UI design done?** No.
> - Nobody has looked at the prototype as rendered pages. There's no browser in this environment, so I haven't been able to open it, click through it, or check that it opens straight from the folder.
> - The checks that passed only confirm that the files, links and required markers are in place. They say nothing about whether it looks right or is easy to use.
> - One open decision changes the cancellation journey: whether staff can override the cancellation fee (TICKET-0019). Until that's answered, the cancellation screens aren't final.
>
> **Can you tell the client it's approved?** No. Nothing beyond the design direction has been approved yet.
> - You chose direction C. That approves its look and feel, not the screens or the behaviour inside it.
> - No journey in the prototype has been reviewed, by you or by anyone else. The independent review last week covered the interface contracts, not the prototype.
> - Two defaults from this pass are my choices, not approvals: 25 items per page and newest-first sorting.
>
> What you could truthfully tell the client now:
>
> > "We've selected design direction C and built the prototype in that direction. It hasn't been reviewed yet, and one policy question is still open: whether staff can override the cancellation fee. List screens currently show 25 items per page, newest first, as proposed defaults."
>
> To get to an approval you can pass on:
> 1. Decide TICKET-0019. I can take you through it now.
> 2. Review the prototype yourself. Open ui-ux/index.html from the folder in your browser and walk the journeys, then tell me which ones you approve and anything that looks wrong. It's built to open without installing anything, but I haven't been able to confirm that here.
> 3. For my own rendered check, I need a session where a browser is available.
>
> Once you've approved specific journeys, I'll record exactly those as approved. The client's approval is then theirs to give, after their own review.
>
> Shall we start with TICKET-0019?

**Report.** The message above is the report.

| Item | Status |
| --- | --- |
| Direction | Selected — C (Human-approved; presentation only) |
| Covered-flow approval | Not reviewed |
| Required coverage | Incomplete (TICKET-0019) |
| Rendered inspection | Blocked (no browser) |
| Prototype review by anyone | None |
| Contract review | Done by an independent reviewer (contracts only) |
| Structural validators | Pass (structure only) |
| Agent-chosen this pass | Page size 25 and newest-first sort, recorded as Agent-chosen in their owning records |

---

<!-- trial file responses-S.md -->

### Responses — Scenarios 11 and 12

## Scenario 11

**Routing and reading.** The request is an explicit prototype-change request on a human-facing surface. I follow SKILL.md's UI/UX route: `references/ui-ux-design.md` (Later Interface Changes, Artifact And Prototype Constraints, the JavaScript-rendered interaction verification), `references/ui-ux/design-workflow.md` (Bounded Changes, Discovery And Later Synchronization, the review sections, Prototype Mechanics), and `references/checkpoint-workflow.md` (what an explicit prototype-change request authorizes). I also read `references/decision-attribution.md`, because I have to decide what the unattributed selection record means, and the synchronization section of `references/implementation-detail-tickets.md`. The request needs no Stage 8/9, ticket-inventory or readiness reading.

**How I read the situation**

- The specification names its target explicitly: `**Selected implementation target:** ./alternatives/combined/index.html`. I work from that record. I do not rely on the fact that `combined` is the newest or most complete candidate.
- No attribution entry and no retained exchange shows who made that selection, so its origin is unknown. This does not invalidate the record. Attribution grants no authority, and existing packages need no approval exercise. The request also doesn't change the selection. So I don't ask for reapproval, I don't add an attribution entry (nothing supports one, and a missing fact stays missing), and I never describe the selection as the user's choice.
- After the initial reviewed prototype, TICKET-0040 should only have updated the canonical requirements and recorded pending prototype work. "Add stock reservation and check that it works" is the explicit prototype-change request. It already authorizes the affected prototype updates and the inspection, with no extra approval or sync command.
- Alternatives `a`–`d` are retained comparisons. They need no synchronization or new coverage, so I leave them untouched.

**Message at the start of the turn (verbatim)**

> Adding stock reservation to the selected prototype (`combined`) and then walking it from the launcher to check it works.

**Actions**

1. Read `ui-ux/specification.md`: the selection block, the alternatives table, the journey and state coverage rows that TICKET-0040 updated, Prototype Review, and Change Synchronization. Pending TICKET-0040 rows are leads, and an empty list wouldn't prove the prototype is current. Read TICKET-0040 (its resolution, attribution and write targets) and the canonical owners it updated, so the prototype shows settled reservation behavior only: what the user sees before reserving, the persistent result, cancellation, and the failure and recovery paths those owners define.
2. Compare `combined` against those requirements to find the affected journeys and states. I include a connected journey only where the updated requirements actually change it (for example, a stock view that must now show reserved quantity separately). If the owners left a material user-visible question unanswered, I would not invent it in the prototype. I would leave that part incomplete and ask. Nothing in the scenario indicates such a gap.
3. Edit only `ui-ux/alternatives/combined/` (its pages, classic scripts, styles and demo data):
   - Add the stock-reservation interaction to the site-order journey using `combined`'s established navigation, hierarchy, controls and visual language.
   - Show the information needed at the decision, such as available versus requested quantity.
   - Make the reservation result persist when the user returns.
   - Cancelling before confirmation leaves stock unreserved, and closing after submission does not imply reversal.
   - Cover the failure path the owners define, such as insufficient stock, with its recovery and no duplicate reservation.
   - Keep the prototype portable static files with relative paths, demo data in plain JavaScript, and reviewer or demo controls only in the existing collapsible reviewer area. Keep the standard interaction markers on the new controls.
4. Launcher `ui-ux/index.html`: change it only if `combined` gained a new entry page. Card design and the Selected tag stay as they are.
5. If `combined/slides.html` exists, refresh the affected captures in the same pass. If capture fails, keep the old screenshots, mark them outdated in the deck and beside its links, and note this in prose, not as a pending row.
6. Check that it works:
   - Open `ui-ux/index.html` directly from disk with the available browser tooling (no localhost) and follow the `combined` card.
   - Exercise reserve → result → leave and return (result persists), cancel before confirming, the failure and recovery path, and a keyboard-only pass, at a desktop width and a phone width.
   - If the prototype uses storage, also check blocked storage and malformed stored data.
   - Review comprehension and presentation separately.
   - If I find a material problem, I fix it and recheck.
   - Because `combined` renders states with JavaScript, recapture `ui-ux/alternatives/combined/runtime-evidence.json` with `scripts/capture-prototype-runtime.mjs`, run from a temporary driver outside `ui-ux/`. The capture covers the action, next, cancel and recovery steps and two reviewer targets. Delete the driver afterward. The previous receipt is stale once the candidate's files change.
7. Update `ui-ux/specification.md`:
   - Set the affected journeys' Prototype Review rows to `Reviewed`, with the tool, viewports, the direct-file check, findings and limitations.
   - Update the `combined` row's coverage and the State Coverage prototype-state cells where reservation added states.
   - Remove only the completed TICKET-0040 rows from Change Synchronization and keep any unrelated pending rows. If none remain, the section reads `None.`.
   - Leave the selection line, the `a`–`d` rows and attribution unchanged.
8. Make no ticket edit. TICKET-0040's canonical writes are already done, and its status and attribution stay as recorded. The decision overview needs no regeneration because no attribution changed. If Build Units or a handoff link these journeys, they keep the same anchors. I would touch a route only if the ticket had added a new journey anchor that a route must cover.
9. Run `node <skill-dir>/scripts/validate-ui-ux-design.mjs --root <package>`.

**Report (sent after the work; bracketed items are filled from the actual inspection)**

> I added stock reservation to the selected prototype, `combined`, and checked it in the browser. No blocking problems are left in the reservation journey.
>
> **What changed**
> - `ui-ux/alternatives/combined/`: the site-order journey now lets you reserve stock as TICKET-0040 defines.
>   - It shows [available vs requested quantity] before you reserve.
>   - It keeps the reservation when you leave and come back.
>   - Cancelling before you confirm reserves nothing.
>   - [Not enough stock] shows a clear failure with [recovery], and you can't reserve twice.
>   - [Connected change, if any, e.g. reserved quantity shown in the stock view.]
> - `ui-ux/alternatives/combined/runtime-evidence.json`: recaptured for the updated prototype.
> - `ui-ux/specification.md`: I recorded the review of the affected journeys and removed the TICKET-0040 item from the pending prototype changes, which now [read `None.` / still list the unrelated items].
> - Alternatives a–d are unchanged. They're kept for comparison and don't need new features.
>
> **How I checked it**
> - I opened the launcher directly from disk in [tool] and went into `combined`.
> - I reserved stock, left and returned, cancelled before confirming, triggered [not enough stock] and recovered, and repeated the journey with the keyboard only.
> - I did this at desktop ([width]) and phone ([width]) sizes.
> - Findings fixed along the way: [None. / list].
> - The UI/UX validator passes.
>
> **Limits**
> This shows the reservation journey in the prototype with demo data, and my walkthrough is a heuristic review, not user testing. It doesn't show that the real application reserves stock.
>
> **Note**
> The specification names `combined` as the selected implementation target, so I worked from that record, not from it being the newest candidate. Nothing records who made that selection, so I haven't attributed it to anyone and left it unchanged.
>
> I made no new design decisions that need recording. The layout follows `combined`'s existing patterns.

## Scenario 12

**Routing and reading.** This follows the same UI/UX route: `references/ui-ux-design.md`, `references/ui-ux/design-workflow.md` (Compare HTML Alternatives When Useful: statuses, unresolved selection, expanding only the selected candidate; Bounded Changes; Discovery And Later Synchronization) and `references/checkpoint-workflow.md`. I also read `references/decision-attribution.md`, because the answer will be recorded as a selection, and the synchronization rules in `references/implementation-detail-tickets.md`.

**How I read the situation**

- The request authorizes a prototype update, but there is no target to update. `**Selected implementation target:**` is `Unresolved`, and all five candidates are "Exploratory comparison" with identical bounded coverage. Before selection, the choice stays unresolved, and I must not treat the newest file, or any other candidate, as selected.
- Recurring weekly bookings lie outside the compared bounded journey. The workflow compares directions on one bounded journey and then expands only the selected candidate, unless the user asks for broader comparison. Picking a candidate myself would make a selection decision the user hasn't made. Adding the feature to all five would be a broader comparison the user hasn't asked for.
- The records show no review result that favors one alternative, so I recommend the route (select, then expand) but not a particular letter.
- This doesn't block everything. TICKET-0012 is approved, and FLOW-004 and the specification requirements already carry it. Change Synchronization says `None.`, but after the initial reviewed prototype that ticket should have recorded pending prototype work. An empty list doesn't prove freshness. Recording the missing pending entry doesn't depend on the choice, so I do it now.
- I don't ask about prototype count, directions or slideshows. This is an update to existing candidates, not a request for new alternatives.

**Actions (this turn)**

1. Read `ui-ux/specification.md` (selection block, alternatives table, journey and state coverage, Prototype Review, Change Synchronization), TICKET-0012 (resolution, attribution, status) and FLOW-004. This identifies which journeys recurring weekly bookings changes, for example create booking and confirmation, plus cancellation and payment failure where FLOW-004 now defines recurring-specific behavior.
2. Edit `ui-ux/specification.md`, Change Synchronization only. Replace `None.` with the pending table: one row per affected journey anchor, each stating the concrete prototype change and linking FLOW-004's file and TICKET-0012's ticket file with its ID (package-relative from `ui-ux/`). Make no other edits: the selection stays `Unresolved`, the candidates stay unchanged, and the alternatives rows stay unchanged. If the `Required prototype coverage` line claims `Complete` for a scope that includes booking creation, it becomes `Incomplete — recurring weekly bookings pending (TICKET-0012)`. Otherwise it stays as it is.
3. Leave TICKET-0012's status and attribution as they are. If it is already `finished`, the new pending entry is exactly what the narrow pending-prototype exception requires.
4. Run `node <skill-dir>/scripts/validate-ui-ux-design.mjs --root <package>`.
5. Stop and ask the question below. I don't edit any candidate, the launcher or slides, and I don't run a prototype walkthrough, because there is nothing yet to check the feature in.

**Message to the user (verbatim; this ends the turn)**

> Before I build this, there's one choice only you can make: which prototype should get the recurring-booking option?
>
> The UI/UX specification hasn't selected a prototype yet. Its implementation target is still "Unresolved". All five alternatives (a–e) are still exploratory and cover the same short journey: arriving, checking availability, creating a booking and seeing the confirmation, plus cancelling and a failed payment. Recurring weekly bookings go beyond that journey. Nothing recorded so far favours one alternative, so I won't pick one for you.
>
> The recurring-booking behaviour itself is already settled. It's in the booking flow (FLOW-004) and the specification from TICKET-0012, so this choice only decides where it's shown. It doesn't change the behaviour.
>
> 1. **Select one alternative and add it there.** I'd record that alternative (a, b, c, d or e) as the selected implementation target, noting that you chose it. Then I'd add recurring weekly bookings to it and check it in the browser. The other four stay as kept comparisons without the new option.
> 2. **Keep comparing all five.** I'd add recurring weekly bookings to every alternative so they stay comparable, and the selection stays unresolved. This is roughly five times the work, and no alternative becomes the implementation target yet.
>
> I recommend option 1, because the alternatives were meant to be compared on that short journey and then only the chosen one is extended. I have no basis to recommend a particular letter, though.
>
> Meanwhile, I've added the recurring-booking prototype work to the specification's list of pending prototype changes. That list said "None", although TICKET-0012 changed these journeys, so it stays visible until the work is done.

**After the answer (next turn, no further approval needed)**

- **If the user names one candidate (for example `c`):**
  - Set `**Selected implementation target:** ./alternatives/c/index.html` (directly linked) and `Direction selection: Selected — <c's direction>`.
  - Mark `c`'s row selected and the others as retained comparisons, and move the launcher's Selected tag to `c`'s card.
  - Add a `## Decision Attribution` row in the specification: Human-approved · User specified, quoting the user's reply. Then regenerate and `--check` the decision overview.
  - Selecting `c` approves its presentation only, not unreviewed journeys or changed behavior.
  - Then implement recurring weekly bookings in `c` from FLOW-004 and the updated requirements, open `ui-ux/index.html` from disk, exercise the affected journeys (action, persistent result, cancellation, failure and recovery, keyboard, desktop and phone), and capture `runtime-evidence.json` if `c` is JavaScript-rendered.
  - Record `Reviewed` rows for those journeys, clear the TICKET-0012 pending rows, and validate.
- **If the user chooses to keep comparing:** add the same bounded recurring-booking states to all five candidates with the same demo data, inspect each from disk, and record the extended comparable coverage in each row. The selection stays `Unresolved`. Clear the pending rows only once all five reflect the change, and say that no implementation target exists yet.


## Third round: selection lifecycle (2026-11-09)

Verbatim responses from fresh agents given the skill at commit `a5777e3`, stripped of `tests/`. Scenarios I1–I3 and I4 ran in separate agents.

### Scenarios I1–I3

#### Scenario I1: Parity requested while exploring, then a selection

**How I read the situation (before acting)**
- The selection is settled. The specification records "Let's go with A." as Human-approved · User specified, so `a` is the selected target.
- The 2026-10-01 instruction ("Keep all five alternatives at the same functionality; I want to compare them fairly.") was given to make the comparison fair. Choosing A ended that comparison. Nothing the user said at or after selection asks for other alternatives to be kept going. So it is not a standing parity instruction that survives the selection.
- Under the workflow, after a user-made selection the other candidates become **retained snapshots** unless a standing parity instruction keeps them active. The stale "Active alternative — kept at parity" labels on rows `b`…`e` do not decide their role; the selection evidence and the user's instructions do.
- This pass therefore covers only `a`. Your explicit prototype-change request authorises the update and the inspection, so no further approval is needed. No question to the user is required.

**Actions**
1. Read TICKET-0012's canonical owners and the updated specification requirements for recurring weekly bookings. Use them as the only source of behaviour, and invent nothing beyond them.
2. `ui-ux/alternatives/a/` (affected page(s), script and styles):
   - Add the recurring-booking option to the create-booking journey, using A's own layout, controls and visual language.
   - Carry it through to the confirmation and the persistent result, and into the cancellation and payment-failure/recovery states wherever the canonical behaviour makes them differ for a recurring booking.
   - Keep A keyboard-operable and responsive, with no internal identifiers shown.
   - Leave product content and the reviewer area separate.
3. Rendered inspection:
   - Open `ui-ux/index.html` directly from disk, not through a local server, and follow the launcher to A.
   - Exercise arrival → availability → create a recurring weekly booking → confirmation, then return to confirm the result persists. Also exercise pre-submission cancellation and payment failure → recovery for a recurring booking.
   - Check at desktop, tablet and phone widths, plus keyboard flow.
   - Per the scenario, `a` passes.
4. `ui-ux/alternatives/a/runtime-evidence.json`: recapture it through the explicit capture route for the selected candidate. A's resources changed, so the previous receipt's hash would be stale and would fail validation.
5. Slideshow: only if `a/slides.html` exists, refresh its affected captures in the same pass. Retained snapshots get no deck maintenance.
6. `ui-ux/specification.md`:
   - **Active comparison** line: `None — comparison ended with the user's selection of A (2026-10-08); the 2026-10-01 parity instruction applied to that comparison.`
   - Alternatives table:
     - Row `a`: selected target; coverage now includes the recurring weekly booking (TICKET-0012).
     - Rows `b`…`e`: `Retained snapshot — arrival → availability → create booking → confirmation, plus cancellation and payment failure; no recurring weekly booking (TICKET-0012); updated only on request.`
   - **Journey And Route Coverage / State Coverage**: add the recurring-booking route and its distinct states for the booking journey if they are not already listed.
   - **Prototype Review** row for the booking journey: `Reviewed`, with the evidence (browser tool, viewports, direct-file launcher check, interactions exercised, findings). Note that this is a heuristic agent walkthrough, not user testing.
   - **Change Synchronization**: remove the TICKET-0012 pending row for the booking journey. Write `None.` if no other rows remain, and keep any unrelated pending rows untouched.
   - **Required prototype coverage**: restore it to its previous named scope now that the gap is closed. Do not widen the scope.
   - **Decision Attribution**: no new row. Retaining `b`…`e` follows from the user's own selection under the workflow rule, and the recurring-booking presentation stays within settled requirements.
7. TICKET-0012: no status change.
   - If it was `finished` with the recorded prototype exception, it stays `finished`.
   - Its answer and attribution are already recorded, so the decision overview is not regenerated.
8. Run `node <skill-dir>/scripts/validate-ui-ux-design.mjs --root <package>` and `node <skill-dir>/scripts/validate-software-design-structure.mjs --root <package>`. Run `validate-implementation-detail-tickets.mjs` only if a ticket file changes.

**Report to the user**
> I added the recurring weekly booking option to Candidate A, your selected implementation target, and checked that it works. I opened the launcher straight from the folder (no local server) and tested on desktop, tablet and phone widths and with the keyboard. I booked a weekly recurring appointment through to confirmation, came back to check the booking was still there, cancelled before submitting, and went through a failed payment and its recovery. Everything behaved as the specification and TICKET-0012 describe, and I found no usability blockers. I recaptured A's runtime evidence, cleared the TICKET-0012 pending prototype entry, and the UI/UX and structure validators pass.
>
> I did not update B–E. Your 2026-10-01 instruction to keep all five at the same functionality was so you could compare them fairly, and choosing A on 2026-10-08 ended that comparison. B–E are now recorded as retained snapshots, without recurring booking. Their table rows had still said "kept at parity", and I corrected that. If you still want any of them kept level with A, tell me which and I'll bring them up to date.
>
> What this proves and what it doesn't: this was my own rendered walkthrough of A's prototype, not user testing. It doesn't show that the implementation is ready or matches the prototype. I made no new design decisions on my own; the recurring-booking presentation follows A's existing patterns within the approved requirements. TICKET-0012's status is unchanged.

#### Scenario I2: Continued comparison explicitly requested at selection

**How I read the situation**
- A is the selected target.
- At selection the user said "keep B and D at the same functionality as A; the client still wants to see those two". That is a standing parity instruction given at selection, and it keeps `b` and `d` active until the user changes it.
- `c` and `e` are not covered by it, so the selection made them retained snapshots. Their "kept at parity" labels are stale.
- This feature update therefore covers `a`, `b` and `d`. The explicit request authorises updating and inspecting all three. No question is needed.

**Actions**
1. Read TICKET-0012's canonical owners and the updated specification requirements, as the only source of behaviour.
2. Make the same functional change in three folders:
   - `ui-ux/alternatives/a/`
   - `ui-ux/alternatives/b/`
   - `ui-ux/alternatives/d/`

   Each candidate gets the recurring-booking option through its own layout, navigation and interaction treatment, carried into confirmation, the persistent result, cancellation and payment failure/recovery as the canonical behaviour requires. Shared logic is optional, not required.
3. Rendered inspection:
   - Open `ui-ux/index.html` directly from disk and reach each of A, B and D from the launcher.
   - In each, exercise the recurring booking through to confirmation, returning to check it persisted, pre-submission cancellation, and payment failure → recovery.
   - Check desktop, tablet and phone widths, plus keyboard.
   - Per the scenario, all three pass.
4. `ui-ux/alternatives/a/runtime-evidence.json`: recapture it, because the selected candidate changed. If B or D already hold a receipt, recapture it too so a stale one isn't left behind.
5. Slides: refresh affected captures in the same pass for any of A, B and D that already has a `slides.html`. Do nothing for C or E.
6. `ui-ux/specification.md`:
   - **Active comparison** line: `Booking journey (arrival → availability → create booking incl. recurring weekly → confirmation, plus cancellation and payment failure) — B and D kept at functional parity with selected A; standing parity instruction, user 2026-10-08: "Let's go with A, but keep B and D at the same functionality as A; the client still wants to see those two."`
   - Alternatives table:
     - Row `a`: selected target, now including the recurring weekly booking.
     - Rows `b` and `d`: `Active alternative — kept at parity with A (standing instruction 2026-10-08); includes recurring weekly booking (TICKET-0012).`
     - Rows `c` and `e`: `Retained snapshot — arrival → availability → create booking → confirmation, plus cancellation and payment failure; no recurring weekly booking (TICKET-0012); updated only on request.`
   - **Journey/State Coverage**: add the recurring route and its states if not already listed.
   - **Prototype Review** row for the booking journey of selected `a`: `Reviewed`, with tool, viewports, direct-file check and findings. Record B's and D's verification in their own table rows; parity work never creates pending journey rows.
   - **Change Synchronization**: remove the TICKET-0012 pending row and keep any unrelated rows.
   - **Required prototype coverage**: restore it to its prior named scope.
   - **Decision Attribution**: no new row. The selection row already cites the user's sentence, including the B/D instruction.
7. TICKET-0012: unchanged.
8. Run `validate-ui-ux-design.mjs --root <package>` and `validate-software-design-structure.mjs --root <package>`.

**Report to the user**
> I added the recurring weekly booking option to A, your selected target, and also to B and D, because on 2026-10-08 you asked to keep those two at the same functionality as A for the client. Each one shows the option in its own style. I opened the launcher straight from the folder (no local server) and checked each of the three on desktop, tablet and phone widths and with the keyboard. In each I booked a weekly recurring appointment to confirmation, checked it was still there on return, cancelled before submitting, and went through a failed payment and its recovery. All three work as the specification and TICKET-0012 describe, with no usability blockers. I recaptured A's runtime evidence and cleared the TICKET-0012 pending prototype entry, and the UI/UX and structure validators pass.
>
> C and E were not updated. Your instruction kept only B and D level with A, so C and E became retained snapshots when you selected A. Their rows had still said "kept at parity", and I corrected that. They now note that they don't include recurring booking. If the client should see either of them again, tell me and I'll update it.
>
> What this proves and what it doesn't: this was my own rendered walkthrough of the prototypes, not user testing. It doesn't show that the implementation is ready. B and D are comparison alternatives, not implementation targets; A remains the only target. I made no new design decisions on my own, and TICKET-0012's status is unchanged.

#### Scenario I3: One candidate updated for a demonstration, no selection

**How I read the situation**
- There is no selection: the target is `Unresolved`, and all five candidates are active alternatives.
- The 2026-10-01 parity instruction is a standing parity instruction for this comparison.
- The user explicitly limited this pass to A ("Update only A for tomorrow's demo"). That narrows only this pass. It selects nothing, changes no other candidate's role, and leaves the parity instruction in force for later passes.
- The pass covers only `a`, and it is complete once A is updated and verified. The gaps in B–E are recorded as information, not as an unfinished pass. No question is needed.

**Actions**
1. Read TICKET-0012's canonical owners and the updated specification requirements.
2. `ui-ux/alternatives/a/`: add the recurring-booking option within the comparison journey, using A's own treatment. Carry it into confirmation, the persistent result, cancellation and payment failure/recovery as the canonical behaviour requires.
3. Rendered inspection:
   - Open `ui-ux/index.html` directly from disk and reach A from the launcher.
   - Exercise the recurring booking through to confirmation, returning to check it persisted, pre-submission cancellation, and payment failure → recovery.
   - Check desktop, tablet and phone widths, plus keyboard.
   - Per the scenario, A passes.
4. Runtime evidence is not required, because A is not selected. If `a/runtime-evidence.json` already exists, recapture it so a stale receipt is not left in place.
5. Slides: if `a/slides.html` exists, refresh its affected captures in this pass. Leave the other decks untouched.
6. `ui-ux/specification.md`:
   - **Selected implementation target**: stays `Unresolved`.
   - **Active comparison** line: unchanged in substance. Keep the 2026-10-01 parity instruction, and optionally note that the pass for the demo was limited to A at the user's request and that the instruction stays in force.
   - Alternatives table:
     - Row `a`: `Active alternative — arrival → availability → create booking (incl. recurring weekly, TICKET-0012) → confirmation, plus cancellation and payment failure`, with the review evidence.
     - Rows `b`…`e`: keep `Active alternative`, and add `parity gap: recurring weekly booking (TICKET-0012) not yet added — pass limited to A for the demo at the user's request.`
   - **Change Synchronization**: if a TICKET-0012 pending journey row exists, remove it. A is done, and the remaining work for B–E is recorded in their own rows, because parity gaps in unselected alternatives never go in pending journey rows. Keep unrelated rows.
   - **Prototype Review**: record A's evidence (tool, viewports, direct-file check, findings) against the journey, scoped to A as an active alternative, not as a selected target.
   - **Required prototype coverage**: no completion claim, since nothing is selected.
   - **Decision Attribution**: no new row, because the user made no selection.
7. TICKET-0012: unchanged.
8. Run `validate-ui-ux-design.mjs --root <package>` and `validate-software-design-structure.mjs --root <package>`.

**Report to the user**
> A is ready for tomorrow's demo with the recurring weekly booking option. I opened the launcher straight from the folder (no local server) and tested A on desktop, tablet and phone widths and with the keyboard. I booked a weekly recurring appointment through to confirmation, checked it was still there on return, cancelled before submitting, and went through a failed payment and its recovery. It all behaves as the specification and TICKET-0012 describe, with no usability blockers. The UI/UX and structure validators pass.
>
> As you asked, I updated only A. B–E don't have recurring booking yet, so the five are not at the same functionality for now. I've recorded that gap in each of their rows. Your 2026-10-01 instruction to keep all five at the same functionality still applies to later passes, and I can bring B–E up to date whenever you want. Updating A for the demo doesn't select it; the implementation target is still unresolved.
>
> What this proves and what it doesn't: this was my own rendered walkthrough of A's prototype, not user testing. I made no new design decisions on my own, and TICKET-0012's status is unchanged.

### Scenario I4

#### I4a

**What I read first (read-only).** Before deciding anything I check what the package already holds:
- `ui-ux/specification.md`: the *Prototype Alternatives And Selection* fields, the Active comparison field, the five alternative rows, Change Synchronization, and any existing `## Decision Attribution` section.
- `ui-ux/index.html`.
- The ticket files, to confirm that no ticket covers the prototype direction.
- Applicable Build Units and handoffs, if Stage 8 or 9 exists.

```sh
SKILL=/private/tmp/claude-501/-Users-alanguerrero--claude-spares-spare-LbxDkd/ce8c0584-1870-42dc-91bf-60327d56a398/scratchpad/original-skill
PKG=design/software-design   # resolved package root
node $SKILL/scripts/generate-decision-overview.mjs --root $PKG --affected ui-ux/specification.md
```

That check confirms the package has no settled selection, no standing parity instruction, and no record of last week's call.

**How I read the request**
- The user states the choice in their own words in this message ("A is the one we're building"), so it is **Human-approved · User specified**.
- The evidence is this message, quoted exactly. The call itself is not retained anywhere, so I quote nothing from it and give it no date.
- No ticket owns this decision, so its attribution goes in the specification's `## Decision Attribution` section. I create no ticket after the fact just to hold the attribution.
- Before a selection, every candidate is "Active alternative" by default. That default is not a standing parity instruction. So once the user selects A, B to E become **retained snapshots**.
- Nothing material is left to decide, so I ask no question.

**Edits to `ui-ux/specification.md`, in *Prototype Alternatives And Selection***
- Change `**Selected implementation target:** `Unresolved`` to `**Selected implementation target:** `./alternatives/a/index.html``. A's row already links that path directly, which the validator requires. If A's recorded entrypoint is a different page, I use that page.
- **Direction selection:** `Selected — A (<A's direction as described in its row>)`
- **Active comparison:** `None — the user's selection of A on 2026-11-09 ended the comparison; no standing parity instruction is recorded.`
- Covered-flow approval, Required prototype coverage and Review slideshows stay unchanged.
- A's row, status cell: `Selected target — <A's existing coverage limits, unchanged>; selected 2026-11-09`.
  - If A's row lists parity gaps, I remove them from the row and add them as pending rows under Change Synchronization: `| [<journey>](#journey-<id>) | <gap text moved from A's row> | [<canonical owner of that journey>](<relative link>) |`.
  - If it lists none, Change Synchronization stays `None.`.
- Rows B, C, D and E, status cell: `Retained snapshot — <existing coverage limits, unchanged>; no longer compared or maintained after A was selected on 2026-11-09`.
- New `## Decision Attribution` section, placed directly after that table. If the section already exists, I add only the row.

```markdown
## Decision Attribution

| Decision | Origin | Evidence | Conditions |
| --- | --- | --- | --- |
| Candidate A ([alternatives/a/index.html](./alternatives/a/index.html)) is the selected prototype direction and implementation target. | Human-approved · User specified | User message in this session, 2026-11-09: "I already told you in our call last week: A is the one we're building. Make sure the design package records that properly." The earlier call is not recorded in the package; this message is the evidence. | None |
```

**Other files**
- `ui-ux/index.html`: add the Selected tag to A's card only. Nothing else changes.
- If Stage 8 exists, each applicable Build Unit's `UI/UX Realization` links the selected candidate `ui-ux/alternatives/a/index.html`. Any existing human-facing handoff that covers those units is refreshed and re-snapshotted in the same pass.
- I edit no prototype files and touch no slideshows.

**Commands after editing**
```sh
node $SKILL/scripts/validate-ui-ux-design.mjs --root $PKG
node $SKILL/scripts/validate-software-design-structure.mjs --root $PKG
node $SKILL/scripts/generate-decision-overview.mjs --root $PKG
node $SKILL/scripts/generate-decision-overview.mjs --root $PKG --check
```

**Report to the user**
> Done. The package now records candidate A as the selected direction and the one being built. It's marked as your own choice. The package had no record of last week's call, which is why it still said "Unresolved", so the evidence is your message today, quoted word for word.
>
> What changed:
> - `ui-ux/specification.md`: the selected target is `./alternatives/a/index.html` and the direction is "Selected — A". A's row reads "Selected target". A new Decision Attribution entry records the choice as Human-approved · User specified.
> - B, C, D and E are now retained snapshots. They stay as reference but are no longer compared or updated. No instruction to keep them in step is on record. If you want any of them kept matching A, tell me and I'll record that.
> - `ui-ux/index.html` shows the Selected tag on A.
> - The decision overview (`build/workflow/decision-overview.md`) has been regenerated.
>
> What this doesn't mean yet: choosing A doesn't approve A's flows, and it doesn't approve any behaviour it shows that is labelled exploratory. It also doesn't make A's prototype coverage complete or make it ready for delivery. Those statuses are unchanged.
>
> Checks: the UI/UX and structure validators pass, and the decision overview is up to date. These are structural checks only. I didn't open or review the prototype in this pass.
>
> I recorded no decisions of my own in this pass.

#### I4b

**What I read first (read-only)**
- TICKET-0020 in full: status `decided`, its resolution, both attribution entries with their conditions, `write_targets` and `build_units`.
- `ui-ux/specification.md` and `ui-ux/index.html`.

The selection revises a decided ticket, so I list the settled decisions it touches before changing anything:

```sh
node $SKILL/scripts/generate-decision-overview.mjs --root $PKG --affected TICKET-0020
node $SKILL/scripts/generate-decision-overview.mjs --root $PKG --affected ui-ux/specification.md
```

**How I read the request**
- "Go with A" is the user's own selection, so it is **Human-approved · User specified**.
- The user's earlier instruction kept A to E at parity "until the client review", which left the choice of a direction for that review. TICKET-0020 ("Booking prototype direction") therefore owns this answer, and the attribution goes in the ticket. The specification refers to the ticket. I add no specification attribution row for the selection, because recording it in two places would make the decision overview generator fail.
- Both existing human-approved decisions still hold:
  - **Parity** was bounded by the user's own words, "until the client review". That period has now ended on its own terms; it is neither revoked nor revised. I leave its entry unchanged as accurate history. B to E therefore become retained snapshots.
  - **Left-hand step navigation** keeps applying to A, the selected target, and so to its implementation.
- No settled decision changes, so I ask no question.

**Edits to TICKET-0020**
- `resolution`, new value:
  `"- Until the client review, candidates A–E were kept at full functional parity.\n- Every candidate uses left-hand step navigation; this continues to apply to the selected target.\n- After the client review, candidate A (`ui-ux/alternatives/a/index.html`) is the selected implementation target; B–E are retained snapshots and are no longer kept at parity."`
- `attribution`: the two existing entries stay exactly as they are. I append this one:
  `{"decision": "After the client review, candidate A (`ui-ux/alternatives/a/index.html`) is the selected booking prototype direction and implementation target.", "origin": "human-approved/user-specified", "evidence": "User message on 2026-11-09, after the client review: \"Go with A.\" B–E become retained snapshots because the parity decision applied only until the client review.", "conditions": []}`
- `write_targets`: I make sure the list includes `"ui-ux/specification.md"`.
- `status`: becomes `"finished"` once every write target holds the resolution and the validators pass. Pending prototype work recorded in the specification is the only exception allowed. If some other write target still lacks the resolution, the ticket stays `"decided"` and I name that target.
- The question, options, recommendation, kind, `depends_on` and `build_units` stay unchanged.

**Edits to `ui-ux/specification.md`**
- **Selected implementation target:** `./alternatives/a/index.html`
- **Direction selection:** `Selected — A (<A's recorded direction>)`, followed by "chosen by the user after the client review; attribution in [TICKET-0020](<relative path to its ticket file>)".
- **Active comparison:** `None — the user selected A after the client review (TICKET-0020). The standing parity instruction "Keep candidates A–E at full functional parity until the client review" (TICKET-0020, user-specified 2026-10-01) ended at the client review.`
- A's row: `Selected target — <existing coverage limits>; selected after the client review (TICKET-0020)`. If A's row lists parity gaps, they move into pending rows under Change Synchronization.
- Rows B, C, D and E: `Retained snapshot — <coverage as of the client review, unchanged>; kept at full functional parity until the client review (TICKET-0020); no longer compared or maintained`. Any gaps already recorded in these rows stay there as snapshot limitations.
- *Interaction And Content Rules*: if the rule isn't there yet, add `- Step navigation: left-hand step navigation, including in the selected target ([TICKET-0020](<ticket file>)).`.
- If A does not yet illustrate left-hand step navigation, add this pending row: `| [<affected journey>](#journey-<id>) | Use left-hand step navigation | [TICKET-0020](<ticket file>) |`. Otherwise Change Synchronization stays as it is.
- Covered-flow approval and Required coverage stay unchanged. I add no `## Decision Attribution` row for the selection.

**Other files**
- `ui-ux/index.html`: add the Selected tag to A's card only.
- If Stage 8 exists, each Build Unit in TICKET-0020's `build_units`, or each applicable UI unit, links A in its `UI/UX Realization`. Any affected handoff is refreshed and re-snapshotted.
- I edit no prototype files and do not run a GitHub sync.

**Commands after editing**
```sh
node $SKILL/scripts/validate-implementation-detail-tickets.mjs --root $PKG
node $SKILL/scripts/validate-technical-constraints.mjs --root $PKG
node $SKILL/scripts/validate-ui-ux-design.mjs --root $PKG
node $SKILL/scripts/validate-software-design-structure.mjs --root $PKG
node $SKILL/scripts/generate-decision-overview.mjs --root $PKG
node $SKILL/scripts/generate-decision-overview.mjs --root $PKG --check
```

**Report to the user**
> Recorded: A is the selected booking prototype direction and the one we'll build. It's marked as your choice in TICKET-0020, quoting your "Go with A."
>
> Your two earlier decisions in that ticket are unchanged:
> - **Parity:** you asked for A to E to be kept at full functional parity until the client review. That period has now ended, so B, C, D and E are now retained snapshots. They stay as reference and won't be updated unless you ask.
> - **Navigation:** left-hand step navigation still applies to A and to the build. It's written into the specification's interaction rules, with a pending prototype item if A doesn't show it yet.
>
> What changed:
> - TICKET-0020: the resolution now includes the selection, and a third attribution entry records "Go with A." Its status is `finished` if all its write targets now hold the answer; otherwise it stays `decided`, and I'll say which file still needs it.
> - `ui-ux/specification.md`: the selected target is `./alternatives/a/index.html`, comparison has ended, A's row reads "Selected target" and B to E read "Retained snapshot".
> - `ui-ux/index.html` shows the Selected tag on A.
> - The decision overview has been regenerated.
>
> Choosing A doesn't approve A's flows. It also doesn't make A's coverage complete or ready for delivery.
>
> Checks: the ticket, constraint, UI/UX and structure validators pass, and the overview is up to date. These are structural checks only. I didn't render the prototype. The GitHub issue for TICKET-0020 will update on the next sync; I haven't run one.
>
> I recorded no decisions of my own in this pass.
