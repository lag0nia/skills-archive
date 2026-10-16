## Summary

The offer reservation is now 12 hours everywhere the package states it, and the System Guide PDFs are reprinted and current. One thing is not finished: the code that's already built still uses 24 hours, and I couldn't refresh the delivery handoff that would plan that fix (details under "Could not resolve").

Package: `/private/tmp/claude-501/-Users-alanguerrero-Documents-ai-prompts/b72a9647-f430-4577-b73d-46cf594be5b3/scratchpad/eval/t5/bitrise21/loan-system/design/technical-design`

## What I changed (package-relative paths)

**Design records:**
- `system-model/contracts/states/state-001-one-loan-offer-and-reservation.md`: the Reserved state and the cancel/reopen and expiry rules now say 12-hour.
- `system-model/contracts/interfaces/iface-003-one-loan-offer-reservation-and-loan-binding.md`: the reservation expiry is now 12-hour.
- `build/records/selections/sel-012-one-loan-offer-reservation-and-binding.md`: "12 hours to produce a valid prefund", and the tests must prove exact 12-hour deadline behavior.

**The ticket that settled the reservation design (TICKET-0069 in `build/workflow/tickets/participant-access-and-loan-operations/sr-010/sr-010-tickets.yaml`):**
- Context, resolution and state diagram now say 12 hours.
- Its record of who decided what had one "user specified" entry that included the 24 hours. I split it:
  - The original entry keeps its August 2026 evidence and covers everything except the length.
  - A new "user specified" entry records "12 hours instead of 24; nothing else changes". It quotes your message and notes that you called this a hypothetical exercise change, "not a real product decision".
- The ticket stays `finished`.

**System Guide sources:**
- `guide/architecture.md` (two passages).
- `guide/domains/loan-terms-and-commitments.md` (two passages).
- `guide/domains/participant-access-and-loan-operations.md` (one passage).

**Regenerated outputs:**
- `build/workflow/decision-overview.md`: now lists 395 decisions instead of 394 (the new 12-hour entry).
- `visuals/assets/sources.json`: only three source hashes changed. The diagram pages came out byte-identical, because they never state the reservation length.

**PDFs** in `.../scratchpad/eval/t5-pdf`:
- Reprinted: architecture, loan-terms-and-commitments, participant-access-and-loan-operations, and the combined system guide.
- The other three were already current and left untouched.
- `system-guide-export.json` now records this package's path. It previously pointed at the `t1` copy.

**Deliberately unchanged:** the separate timers that also happen to be 24 hours:
- the lender's funding window and the borrower's acceptance window after funding;
- the 67-hour opening reserve;
- the 72-hour stuck-prefund review;
- the 24-hour cushion added to the repayment deadline;
- the backup and email-retry limits.

The brief, flows, UI spec and prototypes never state the reservation length (prototype deadlines are fixed, labelled examples), so they needed no edits. Nothing outside the package was edited apart from the PDFs.

## What I would have asked you

1. **Is 12 hours meant to cover everything before the prefund?** The reservation clock covers both Vaults allocating keys, both participants preparing destinations, both participants (including the lender) approving the final terms, and the borrower sending the prefund. With 12 hours, a slow lender approval makes expiry, or the borrower's infraction, more likely. Should the clock start at terms commitment instead?
2. **Settle the existing expiry conflict?** The records already disagree on what happens when a reservation runs out before the terms are committed: plain expiry, or cancel with an infraction. A shorter window makes that case more common.
3. **Keep the 24-hour repayment-deadline cushion?** I kept it, since you said nothing else changes.

## Could not resolve

- **The code is now out of date with the design.** The Application API in the core coordination slice was built with 24 hours. The cross-domain test harness checks the exact deadline, so it needs updating too. Product Web and the local demo may also be affected; the source code isn't in this copy, so I couldn't confirm.
- **Why I didn't refresh the delivery handoffs:**
  - The handoff text never states the length, so the handoffs and their snapshot IDs are unchanged.
  - But the core slice's scope review (`build/workflow/handoffs/repo-002-core-coordination-scope.json`) pins the old version of the interface file. Delivery-readiness validation now reports 3 new "stale or invalid evidence" findings and 3 "must pin its canonical interface source" findings for it.
  - I didn't just update that pin. Honestly refreshing the handoff means re-reviewing the implementation source, which is missing from this copy (the baseline already failed on that missing evidence).
  - The workpacks are outside the package, so I didn't touch them. The earlier "implemented" records stay as they were.

## What I checked

- **Who decided what:** I listed every recorded decision touched by these files. The only one that set the reservation length was the August entry on the reservation ticket; the other timing decisions concern the funding and acceptance windows and Bitcoin timelocks.
- **Validators**, compared with a run before any edits:
  - Tickets, technical constraints, handoff sequence and the build-unit dependency map pass, as before.
  - Package structure, build design and UI/UX fail, identically to before, on the role-split prototype's runtime evidence.
  - Delivery readiness was already failing (962 lines of output); the only difference is the 6 new findings above.
- **Freshness:** the decision-overview, System Explorer and PDF freshness checks all pass.
- **PDF inspection:**
  - I rendered and looked at every page of the three changed separate PDFs, plus the changed pages and the cover and contents pages of the combined edition. Nothing was clipped or split badly.
  - Comparing old and new text shows only the 24→12 changes and the source fingerprint in the footer, with page breaks unchanged.
  - The remaining combined-edition pages were not viewed individually.

My working files (baseline logs, page renders, two small render tools) are under `.../scratchpad/t5-baseline`, `t5-after`, `t5-pdf-render` and `t5-tools`. I briefly put the two tools into the existing shared `scratchpad/tools` folder before moving them out; that folder's original files were untouched.
