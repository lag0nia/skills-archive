# Workflow reliability evaluation

## Method

On 2026-11-05, fresh agent contexts received the same [scenario inputs](inputs.md), one set with the untouched Software Design skill from commit `1499c5d`, the other with the revised skill. Each version ran four agents: prototype alternatives (1–4), contract discovery against a disposable fixture package (5–6), authority and reporting (7–10), and supplementary prototype cases (11–12). No agent received the other version's output, the change rationale, the criteria, or an intended answer. Skill copies were stripped of `tests/` so the criteria could not be read. [Criteria](criteria.md) for 1–10 were recorded before any output was read; criteria for 11–12 were added after reading the 1–4 outputs and before running 11–12. Full responses are retained: [original](original-responses.md), [revised](revised-responses.md).

Scenarios 5–6 used a disposable format-2 package (four responsibilities, two flows, two interfaces, one ticket) whose structure and ticket validators pass while two journeys lack their initiating commands. Every other scenario is a read-only plain-text simulation: no prototype was edited or rendered and no package other than the disposable fixture existed.

## Observations

| Case | Original | Revised | Assessment |
| --- | --- | --- | --- |
| 1 Five active, no selection | Updated all five, citing comparable states across candidates and the plural "prototypes"; verified each. | Updated all five as active alternatives, each in its own layout; verified each; named incomplete-pass variants. | Both meet. Not discriminating: the plural request carried the original. |
| 2 Selected target, retained snapshots | Updated C only; offered to update the others. | Same. | Both meet. |
| 3 Standing parity instruction | Updated all five; asked whether to bring the four up to C's other journeys. | Updated all five; recorded the instruction on the active-comparison line; offered the same catch-up instead of asking. | Both meet. The original's question concerns work the standing instruction arguably already covers. |
| 4 Ticket answered outside a prototype pass | Recorded attribution and canonical writes, queued pending prototype work, edited no prototype. | Same, noting the pending row applies to all five. | Both meet. |
| 5 Missing initiating command | Found the missing issue command, missing report submission, review read and resubmission; repaired contracts; `TICKET_INVENTORY_PARTIAL` with one paused boundary. | Found the same five gaps through an explicit journey-operation table; repaired contracts; `NEEDS_BOUNDARY_DECISION`, partial for the snapshot. | Both meet. Not discriminating on this small, journey-framed fixture. Neither proposed email, layout, credit-note or per-button actions. |
| 6 Existing action covers part of a journey | Reused and widened `ACT-001` for the return reason; added separate submit, correct-and-resubmit and read actions. | Reused and widened `ACT-001`; added one submit-or-resubmit action and one read. | Both meet; the revised run consolidated one action further. |
| 7 Routine delegated choices | Chose order, page size and empty result; recorded Agent-chosen; no question. | Same. | Both meet. |
| 8 Material location choice | Asked one location question with stored-data, external-recipient, cost and interaction consequences and a recommendation; declined to pick a library until a map exists. | Asked the same question; chose the library as Agent-chosen; flagged a conditional later question about map imagery. | Both meet; the revised run follows the library criterion literally. |
| 9 Shared prerequisite | Kept two slices blocked with their path, let `reporting-export` proceed, asked for the missing document, took over the stale session's work. | Same, with an explicit dependency path per slice. | Both meet. |
| 10 Completion claim | Separated validator, rendered, review, approval and Agent-chosen claims; refused "approved". | Same, as a status table. | Both meet. |
| 11 Selection of unknown origin | Updated `combined` only and described `a`–`d` as reference copies needing no new features, without asking; did not attribute the selection. | Updated `combined`, did not attribute the selection, and asked once whether the user chose it, naming the consequence for `a`–`d`. | Original fails (silently ends the comparison); revised meets. |
| 12 No selection, neutral request | Stopped before prototype work and asked which single alternative to extend, recommending extending only one. | Updated all five without asking and verified each. | Original fails (question plus uneven growth); revised meets. |

Scenarios 11 and 12 reproduce the observed prototype drift: with an unattributed recorded selection or a request that does not name the candidates, the original guidance grew one candidate and let the others fall behind. The revised guidance kept them comparable, asking once only where the record could not establish the selection.

Scenarios 1–10 found no behavioral difference: both versions met every criterion. They therefore show no regression from the revised guidance, but they do not demonstrate improvement for contract discovery, delegation, blockers or completion claims. The original's success there suggests the historical failures depended on conditions these short, explicit scenarios lack, such as long sessions, large packages, ambiguous records or scope framed by declared actions. The revised responses were about 12% longer overall (24,900 versus 22,300 words).

## Independent review and final-text recheck

An independent reviewer read the complete change against the pre-change skill. It confirmed three defects: unfinished parity in an unselected alternative could hold the selected target's readiness through a pending journey row; the inventory completeness list accepted an unrepaired contract gap that the result rule called partial; and two contract-test patterns would have passed on inverted guidance. It also raised seven plausible misreadings: older "retained" labels without evidence, requests naming one alternative, continuing work before a stage checkpoint, an unqualified map-library example, an undefined stale-ownership test, Stage 9 routing every unmatched operation to an interface repair, and an unbounded investigate-first step. All ten were fixed with local wording changes and tightened tests.

Because those fixes changed the parity rules after the trial, a fresh agent reran Scenarios 1, 2, 11 and 12 against the final text and answered a new Scenario 13, whose criteria were recorded first. Scenarios 1, 2, 11 and 12 behaved as in the revised trial. In Scenario 13 the agent updated only B, recorded the gap in the other rows and asked no blocking question, but it closed with an optional offer phrased as a question ("Do you want me to add it to them as well?"). That is a minor deviation from the strict criterion. The recheck output is appended to the [revised responses](revised-responses.md).

## Second round: pass scope and conditional delegation

A second review found two remaining defects. A narrowed prototype pass could not be completed while any other active alternative lacked the change. And the map example made location storage and geocoding a question even when the user had explicitly delegated that choice within approved boundaries. The fixes are as follows:

- **Pass scope.** A pass now covers every active alternative unless the request explicitly names a subset. It is complete when the alternatives it covers are updated and verified.
- **Delegation.** The map example now asks only when the choice is not delegated, or when the best option would exceed an approved data-sharing, cost, security or product boundary.
- **Supporting wording.** `SKILL.md` and `ui-ux-design.md` were reconciled with both fixes.

Instruction-contract checks in `tests/contracts/` pin the new wording. They show the guidance says it, not that agents follow it. The full suite passed on the final text: 588 tests, 582 pass, 0 fail. Six were skipped, the same opt-in real-browser tests as the baseline, with the delivery-integration paths set.

Behavioral trials used fresh agents and a copy of the final skill stripped of `tests/`, under the same isolation as the first round. Criteria for A–G were recorded before any output was read. G2 was added after reading G. H and G3 were added after the review below. Each had its criteria recorded before it ran. Behavior these fixes do not touch reuses the first round's evidence: journey-operation discovery (5–6), routine delegated choices (7), blockers (9) and completion claims (10).

| Case | Revised behavior | Assessment |
| --- | --- | --- |
| A No selection, unrestricted update, `d` fails | Updated and verified all five, each in its own layout. Reported the pass incomplete, naming `d`, and recorded `d`'s gap in its row. Asked nothing. | Meets. |
| B Explicit "B only for this demo" | Updated and verified only `b` and reported the pass complete for that scope. Recorded the gap in the `a`, `c`, `d` and `e` rows, kept them active, and selected nothing. Asked nothing. | Meets. The post-review recheck behaved the same. It closed with a statement-form offer ("ask and I'll add it"), not a question. |
| C Selected target, retained snapshots | Updated and verified only `c`. Left the snapshots untouched and asked nothing about them. | Meets. |
| D1 Standing parity, unrestricted update | Updated and verified all five, citing the standing instruction. | Meets, in both runs. |
| D2 Standing parity, explicit B-only exception | Updated and verified only `b` and reported the pass complete. Recorded the gaps in the `a`, `d` and `e` rows. Kept C's missing change as a pending journey row, with C's coverage incomplete. Said the standing instruction still governs later passes. Asked nothing. | Meets, in both runs. In the first run the agent had to infer that C's pending row survives the narrowed pass. The fix below states it. |
| E Location choice not delegated | Chose the map library as Agent-chosen. Asked one location question naming stored-data, recipient, cost and interaction consequences, with a recommendation. Continued the settled site-details work. | Meets. |
| F Location choice delegated within boundaries | Decided capture and storage within the provider, budget and recipient limits. Recorded the user's limits as User specified and the design as Agent-chosen. Asked nothing. | Meets. |
| G Out-of-boundary provider exists; manual pins allowed | Rejected the US provider and decided EU geocoding plus manual pins within the limits. Reported the excluded provider and the approval it would need, but asked no question. | **Deviation** from the recorded criterion, which expected a question about the excess. The agent judged that an in-boundary design met every requirement, so the best option did not exceed a boundary. The guidance leaves that judgement to the agent. Retained as recorded. |
| G2 Out-of-boundary provider is the only way to meet an approved requirement | Rejected the US provider and kept the no-pin requirement. Recorded the user's limits. Asked one question naming the recipient outside the agreement and the cost against the budget, with alternatives. Continued unaffected work. | Meets. |
| G3 Same as G2, reached from a ticket session | Loaded Before Asking from the ticket route through the revised `SKILL.md` pointer. Kept the ticket open with the limits recorded as User specified, and asked the same specific question. | Meets. |
| H Candidate with a recorded gap is selected | Recorded C as Human-approved · User specified and made the others retained snapshots. Moved C's recorded gap into a pending journey row, called C's coverage incomplete, and edited no candidate. Ended by asking whether to synchronize C now. | Meets. The closing question asks for the prototype-change request the guidance requires before editing. It is not about which candidates to keep. |

In the first run of D, the facts also carried the earlier "Keep the others just for reference" wording beside the standing instruction. The agent resolved the conflict in favor of the instruction. The recheck removed that wording.

### Independent review of the final wording

A reviewer read the second-round diff and the surrounding guidance. It looked for contradictions, approval loops and scope expansion, and confirmed one defect and six plausible misreadings:

1. Fixed: nothing said a narrowed pass keeps the selected target's pending journey row. Narrowing now "leaves every other candidate's role and pending work unchanged".
2. Fixed: the delegation limits were reached only before asking, so a ticket session deciding a delegated choice might not load them. The `SKILL.md` pointer now also fires before "deciding a material choice the user delegated". G3 exercised this route.
3. Fixed: a gap recorded in an alternative's row escaped the readiness gate once that alternative was selected. At selection it now moves into a pending journey row. H exercised this.
4. Not changed: older passages still say to interview the user or ask about direction qualities. These include the repository-lane rules, the ticket `decided` wording and "unapproved" in Active Section Passes. They predate this request, and Before Asking already applies before any question. Changing them would widen the scope. It remains a known limitation.
5. Not changed: "as information" does not literally exclude a closing question. B and D2 asked nothing under the final wording, so this remains a residual risk.
6. Fixed: the standing parity instruction had four names, and the template recorded it only after selection. It is now one defined term, and the template notes it whether given before or after selection.
7. Fixed: the wording "unselected alternative" and "keeps the others active" pulled retained snapshots into the active rules. It now says "unselected active alternative", and the other candidates keep their roles.

The fixes are local wording changes with matching contract assertions. B, D and the new H and G3 were rerun against the fixed text and met their criteria.

## Limits

- One sample per version and scenario, from the same model family that wrote the change; no repeated sampling.
- The author of the change wrote the scenarios. Scenarios 11–12 were added after 1–4 proved non-discriminating, so they target the change by design. Scenario 8 mirrors the map example in the revised Before Asking guidance, so the revised run there is not independent evidence; the original also met it.
- Plain-text simulation: no prototype edits, rendering or real conversation.
- The fixture is small and its scope was framed as journeys, which also helps the original. It does not reproduce the scale of the 43-row audit that motivated the change.
- Agents were told to read the skill's routing; real runs may load fewer references.
- Structural tests in `tests/contracts/` guard the written guidance only; they do not show agent behavior.
- The second round adds the same caveats: one sample per scenario, scenarios written by the author of the change, and G2, G3 and H added in response to observed output or review. Scenarios E–G2 mirror the revised Before Asking example, so they test that wording's application rather than independent transfer.

## Third round: selection lifecycle

On 2026-11-09 the guidance was clarified so that an explicit selection makes the selected candidate the sole maintained target. The changes:

- A parity instruction given while exploring now ends with the selection. A standing parity instruction must explicitly continue comparison after selection.
- Unselected candidates stay as untouched historical references.
- An already supplied selection is recorded in the UI/UX specification without a ticket of its own.
- An existing ticket that holds the selection is reconciled in place.

Fresh agents received [Scenarios I1–I4](inputs.md#third-round-selection-lifecycle), one set with the skill at commit `a5777e3` and one with the revised skill. Each version ran two agents: I1–I3 and I4. Copies were stripped of `tests/`. [Criteria](criteria.md#third-round-criteria-i1i4) were recorded before any output was read. All scenarios are plain-text simulations. Full responses are appended to the [original](original-responses.md#third-round-selection-lifecycle-2026-11-09) and [revised](revised-responses.md#third-round-selection-lifecycle-2026-11-09) response files.

| Case | Original | Revised | Assessment |
| --- | --- | --- | --- |
| I1 Parity requested while exploring, then A selected | Updated and verified only `a`. Read "compare them fairly" as ending with the selection, relabelled `b`–`e` retained snapshots and asked nothing. | Same. Cited the rule that a comparison-time instruction ends at selection, and labelled `b`–`e` "historical reference, not current". | Both meet. Not discriminating: the instruction's stated purpose let the original infer its end. |
| I2 Continued comparison requested at selection | Updated and verified `a`, `b` and `d`. Left `c` and `e` as retained snapshots. | Same. | Both meet. |
| I3 Only A updated for a demo | Updated and verified only `a`, kept all five active, selected nothing and recorded the gaps in the other rows. Closed with a statement-form offer. | Same. | Both meet. |
| I4a Selection already supplied, no ticket | Recorded A in the specification as Human-approved · User specified, quoting the user's message. Created no ticket and asked nothing. | Same, citing the no-selection-ticket rule. | Both meet. Already covered by the existing rule against retrospective attribution tickets. |
| I4b Selection replaces a parity decision in TICKET-0020 | Kept TICKET-0020 and added a selection entry. Kept the parity instruction in the current resolution as past-tense history, kept its attribution entry, and called it a standing parity instruction that had ended. | Kept TICKET-0020. Removed the parity part and its entry, kept the navigation entry unchanged, and added the selection entry. Linked the ticket from the specification without attributing the selection twice. | Original deviates: the superseded instruction stays a current decision, so the Decision Overview would still list it. Revised meets. |

Only I4b separates the versions. I1–I4a show no regression and do not demonstrate improvement there. In I4b, the revised run kept the navigation decision's original wording, "every candidate uses left-hand step navigation". That is correct under preserve-unchanged-decisions, but after the selection a reader may take "every candidate" to include the retained snapshots.

Limits follow the earlier rounds: one sample per version and scenario, from the same model family that wrote the change; scenarios written by the change's author; plain-text simulation only. I1's instruction carried a purpose ("compare them fairly"). A bare "keep all five at the same functionality" with no stated purpose was not tested; under the revised wording it also ends at selection, because it does not explicitly extend past it.
