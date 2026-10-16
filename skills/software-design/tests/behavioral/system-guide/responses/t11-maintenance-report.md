## What I did
The borrower's offer reservation is now 12 hours instead of 24 in the design package, and nothing else about the reservation rules changed. The PDFs did not need regenerating. No guide passage mentions how long a reservation lasts, so the guide text is unchanged, and the export check reports all 7 PDFs current. One delivery check now fails because of the change (see "Could not resolve").

Package root: `/private/tmp/claude-501/-Users-alanguerrero-Documents-ai-prompts/b72a9647-f430-4577-b73d-46cf594be5b3/scratchpad/eval/t11/bitrise21/loan-system/design/technical-design`

**Files changed (paths relative to the package root):**
1. `system-model/contracts/states/state-001-one-loan-offer-and-reservation.md`: four "24-hour" mentions are now "12-hour". These cover the Reserved state, the no-prefund rule that cancels and reopens the offer, the expiry of an unused reservation, and the note that sends a no-prefund case to Reopened once terms are committed.
2. `system-model/contracts/interfaces/iface-003-one-loan-offer-reservation-and-loan-binding.md`: the reservation record now has a "12-hour expiry".
3. `build/records/selections/sel-012-one-loan-offer-reservation-and-binding.md`: the borrower now has "12 hours to produce a valid prefund", and the test obligation is now "exact 12-hour deadline behavior".
4. `build/workflow/tickets/participant-access-and-loan-operations/sr-010/sr-010-tickets.yaml` (TICKET-0069):
   - The ticket's context, state diagram and resolution now say 12 hours.
   - I split the original approved decision in two:
     - **Unchanged part:** everything except the duration keeps its original "user specified" origin and evidence. I added a note that the 24-hour figure quoted in that evidence was later replaced.
     - **New part:** "A borrower's offer reservation lasts 12 hours instead of 24 hours; nothing else about the reservation rules changes." It is recorded as user specified, quoting your message verbatim and noting that you called the change hypothetical and for this exercise only.
   - The ticket stays `finished`.
5. `build/workflow/decision-overview.md`: regenerated (395 decisions; user-specified went from 80 to 81).
6. `visuals/assets/sources.json`: regenerated. Only the source fingerprints for files 1–3 changed; all visual pages are byte-identical, because none of them shows how long a reservation lasts.

Nothing outside the package was changed, including the PDFs.

**Decisions I made myself:** none of substance. The records used a single reservation window for both the no-prefund deadline and the unused-reservation expiry, so I applied 12 hours to that one window. That reasoning is recorded as a note in the new decision's evidence.

## What I would have asked you
1. **Should the guides explain the reservation deadline?** They currently never mention the deadline, the cancellation when no prefund arrives, or the infraction. That is why the PDFs needed no change. I did not add it, since that would go beyond your request.
2. **Should these other timings really stay as they are?** They are separate decisions, so I left them untouched, matching "nothing else changes":
   - the 24-hour cushion built into the repayment deadline;
   - the 24-hour lender funding window;
   - the 24-hour borrower acceptance window, and the 67/19/72-hour timing figures;
   - the 72-hour review when a valid prefund stays unconfirmed;
   - the 24-hour product email retry.
3. **Is 12 hours enough time?** It now has to cover both Vault allocations, both preparations, both final-terms approvals and the borrower's prefund broadcast. Under the existing rules, running out of time before terms are committed simply expires the reservation with no infraction. Running out after commitment without a prefund cancels the reservation and adds an infraction.
4. **Should the 12-hour change join the current planned Core update or wait for a later revision?** See the next section.

## Could not resolve
- **One delivery check now fails.** The Core coordination handoff relies on a saved review that pinned the exact text of the offer-and-reservation interface (`build/workflow/handoffs/repo-002-core-coordination-scope.json`). That interface now says 12-hour expiry, so the Delivery Readiness validator reports 6 new failures for its three actions (stale evidence, plus "must pin its canonical interface source"). The skill says not to simply refresh the stored hashes; a fresh review is needed. I couldn't do that review: the implementation files it cites are missing from this copy, and the review evidence lives outside the package.
- **Which delivery slices are affected** (assessed but not written into any handoff, as the skill prescribes):
  - **Core coordination (Application API):** needs a code change, because it owns reservation timers.
  - **Product web and cross-domain verification:** may need changes if they show the deadline or test it; that needs a look at their source.
  - **Protocol libraries:** no impact.
  - No handoff states the duration, so I left the handoffs and their snapshots unchanged.
- **GitHub:** the projected ticket was not synced, since that wasn't authorized.

## What I checked
- Searched the whole package, the technical brief, the guides, the UI specification and prototypes, and the visuals for every mention of the reservation duration. The only "24 hours" left near reservation wording is the historical quote in the evidence, plus two unrelated mentions in handoffs: a Node version and a test count.
- Ran the decision-overview check for the four changed records and TICKET-0069. Of 115 decisions they touch, only TICKET-0069's 24-hour part changes, and none of them carries conditions.
- Ran every validator before and after the change. All results are identical except the 6 new Delivery Readiness failures above. The structure, Build Design, UI/UX and Delivery Readiness validators were already failing before I started, over the role-split prototype's runtime evidence and the missing Core evidence files.
- Ticket and technical-constraint validators pass. The decision overview and visuals regenerate and pass their freshness checks.
- `export-system-guide --all --combined --check` reports all 7 PDFs current. I did not re-render them, so no page inspection was needed. Their export manifest names a different copy of the package (t9) in its root and regenerate command, but the content fingerprints match this package's guides.
- Copies of the original package and PDFs are in `/private/tmp/claude-501/-Users-alanguerrero-Documents-ai-prompts/b72a9647-f430-4577-b73d-46cf594be5b3/scratchpad/t11-baseline/` if you want to compare.
