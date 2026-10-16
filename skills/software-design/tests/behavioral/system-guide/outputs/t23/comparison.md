# T23: before and after

T23 migrates a disposable copy of the Loan System package to guides under the revised skill: the domain guides carry the existing prose over, and the architecture guide is written new. The live Loan System was not touched.

## Skill

| Before | After |
| --- | --- |
| Every guide needed a coverage ledger: `report-guide-sources.mjs` listed owner sources, and `check-guide-ledger.mjs` checked a ledger of their facts. | The ledger workflow and its tooling are removed: two scripts, two model modules and three test files. Nothing else consumed them. The historical evidence in this directory is unchanged. |
| One authoring path ("Authoring And Reconciliation"). A migration rewrote the domain narrative under the writing standard. | **Writing A New Guide**: read the owners whole, write to the standard, then self-review. **Migrating An Existing Package** step 3 carries each narrative over and allows five kinds of change, each entered in a change list: Format, Names, Coverage, Accuracy and Editorial. Any other dropping, merging, generalizing, strengthening, weakening or adding is not allowed. Step 6 reviews a carried-over guide against the original, a word diff and its change list. |
| `guide-writing.md` could be read as permission to rewrite. | The standard now justifies editorial changes to carried-over prose; it is not a reason to rewrite it. Self-review checks each consequential statement against the owner it restates. |
| A guide's last paragraph could print alone on a new page. | `guide.css` keeps that paragraph together with the end of the paragraph before it. |

These parts are kept: the guide structure, the PDF exporter, the writing rules and every regression test. The suite has 582 tests: 576 pass and 6 are skipped (gated on a real browser). The full skill diff is the snapshot comparison in the session report.

## Domain guides: the original narrative compared with the guide

Each guide is the domain record's original `## Domain Overview`, changed only as [change-lists.md](change-lists.md) lists. The [word diffs](narrative-diffs/) show every difference. Three reviews confirmed that every hunk matches a listed change.

| Guide | Words, before and after | Listed changes beyond common F1–F3, N1–N2 |
| --- | --- | --- |
| Loan Terms And Commitments | 646 → 763 | 3 Accuracy, 1 Names |
| Bitcoin Authorization And Recovery | 875 → 1,115 | 3 Accuracy, 3 Names, 1 Editorial |
| Base USDC Settlement And Funding | 753 → 954 | 2 Accuracy, 2 Names |
| Base Observation And Fallback Review | 1,165 → 1,267 | 1 Accuracy, 2 Names, 1 Format |
| Participant Access And Loan Operations | 1,090 → 1,274 | 2 Accuracy, 2 Names |

Some of the added words are names that replace identifiers. Every Accuracy change does one of two things:

- It restates a declared open point or conflict that the narrative had presented as settled: approval of final terms, upgrade control, the on-chain pause, the package count, the long-stop, the fee tier and payment status.
- It removes wording that ranked one side as superseded: "older", "stale", "current" and "this migration".

Five omissions in the retained prose are reported, not written in. They are listed at the end of the change lists.

## Architecture guide: draft compared with the final guide

The architecture guide has no earlier narrative, so it is new: 5,947 words, 14 PDF pages. It started from the T21 draft, which had 5,422 words. One review and one recheck led to the corrections in [architecture-changes-from-draft.diff](architecture-changes-from-draft.diff). The main corrections:

- **Races:**
  - the activation-pending race at acceptance, activation and the figure;
  - the refund race placed so it no longer qualifies the terminal-package step.
- **Secrets:** at acceptance and at the claim, a failure or cancellation clears the plaintext.
- **Claim order:** confirm, unlock `Y`, then the second confirmation.
- **Fallback secret `S`:** both eligibility conditions are stated, and the refund is stated as independent of the fallback service.
- **Stolen package:** what a holder can do is limited at each mention.
- **Handoff:** it is an expiring pointer, not authentication, consent or signing authority.
- **Attribution:** each side of approval, the package count, the long-stop and the fee tier is attributed to the record that holds it.
- **Offer identity in `LoanTermsV1`:** added to Open questions as an undeclared disagreement.
- **Reservation window:** the draft's 24-hour window was wrongly removed during correction, then restored. It is owned by the offer state, the offer interface and the offer selection.

Validator output for the guides is identical to the unchanged package's baseline ([validation-delta.txt](validation-delta.txt)).

## PDFs

The [pdf/](pdf/) folder holds six individual guides plus the 30-page combined edition, in black-and-white editorial styling with names and no identifiers. All 30 combined pages were inspected on contact sheets.

## Maintenance check

The maintenance check ran on a separate copy of the final package. The lender's claim cutoff was changed from 48 to 36 hours (`C = D + 129,600`), and the run is recorded in [maintenance/run-log.txt](maintenance/run-log.txt).

- **Records and guides changed:** 19 replacements in 15 files, shown in [change.diff](maintenance/change.diff).
  - 12 owner records, at every location that states `C`.
  - 3 guides: the architecture deadlines, "36 hours after `C`" for the lender route, and the settlement and observation guides.
- **Stale PDFs found:** `--check` reported exactly those three PDFs and the combined edition as stale, and the other three as current.
- **Re-export:** rewrote the four stale PDFs and left the others alone. `--check` then reported every PDF current.
- **PDF text:**
  - The old PDFs contain `172,800` and "48 hours".
  - The new PDFs contain `129,600` and "36 hours", with no old values left.
- **New validator findings:** shown in [new-validator-findings.txt](maintenance/new-validator-findings.txt).
  - Twelve delivery assessments that pin the Base interface's bytes are stale.
  - The dependency map and the visuals report a changed graph source (the claim-cutoff state record).
  - This is the delivery-pin impact that "Keeping Guides Current" says to report.
- **Not rewritten:** the Explorer narrative (`explorer.json`) and the HTML generated from it, one ticket, the decision overview and one handoff still say 48 hours. These are history and derived views for the owners' normal checkpoint, so they are reported, not rewritten.
