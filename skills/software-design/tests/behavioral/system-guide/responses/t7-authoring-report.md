## Result

The System Guide is in the package and all seven PDFs are exported. Everything changed is inside the package; the only other writes are the PDFs. The export's `--check` passes, and every validator gives the same output it gave on the untouched package.

PKG = `/private/tmp/claude-501/-Users-alanguerrero-Documents-ai-prompts/b72a9647-f430-4577-b73d-46cf594be5b3/scratchpad/eval/t7/bitrise21/loan-system/design/technical-design`

**PDFs** in `/private/tmp/claude-501/-Users-alanguerrero-Documents-ai-prompts/b72a9647-f430-4577-b73d-46cf594be5b3/scratchpad/eval/t7-pdf/`, each named `bitcoin-backed-usdc-one-loan-system-<name>.pdf`:

| Guide | File name part | Pages |
|---|---|---|
| Architecture guide | `architecture` | 11 |
| Loan Terms And Commitments | `loan-terms-and-commitments` | 6 |
| Bitcoin Authorization And Recovery | `bitcoin-authorization-and-recovery` | 7 |
| Base USDC Settlement And Funding | `base-usdc-settlement-and-funding` | 6 |
| Base Observation And Fallback Review | `base-observation-and-fallback-review` | 6 |
| Participant Access And Loan Operations | `participant-access-and-loan-operations` | 7 |
| Combined guide | `system-guide` | 41 |

The export also wrote `system-guide-export.json` there. `export-system-guide.mjs --all --combined --check` reports all seven as current (exit 0).

## Files changed (all in PKG)

- **New guides:**
  - `guide/architecture.md`
  - `guide/domains/` with one guide per domain: `loan-terms-and-commitments.md`, `bitcoin-authorization-and-recovery.md`, `base-usdc-settlement-and-funding.md`, `base-observation-and-fallback-review.md`, `participant-access-and-loan-operations.md`
- **`system-model/architecture.md`:**
  - Added `system_guide: adopted` to the frontmatter.
  - Replaced the System Overview with one link line to the guide.
- **The five `system-model/domains/*/domain.md` records:**
  - Replaced each Domain Overview with one link line to its guide.
  - Moved the overview's unique facts and conflict notes into the technical sections (Excludes, Cross-Domain Contracts, Choices And Rationale).
  - Added `Unresolved source conflict:` lines for conflicts the fact-checks found.
  - The Base record gained a new Choices And Rationale section for the pause conflict.
- **SR-001 record:** one sentence that pointed to the removed Domain Overview now links to the guide.
- **`README.md`:** added a "Read And Share How The System Works" entry.
- **`visuals/assets/explorer.json`:** updated the architecture fingerprint deliberately, after confirming the headings and quotes it cites are unchanged.
- **`visuals/assets/sources.json`:** regenerated; only hashes changed.

No pinned record was edited. These are the 23 paths in `build/workflow/handoffs/*-scope.json`, and I compared them byte-for-byte against an untouched copy of the package.

## What I checked

- **Validators.** I ran every validator before and after; the outputs are identical. The failures that were already there remain:
  - Missing UI/UX runtime evidence for `ui-ux/alternatives/role-split`, which fails the structure, ui-ux, build-design and delivery-readiness validators.
  - The assurance-coverage validator needs a `--repository` argument it wasn't given.
- **Other checks:**
  - The decision overview `--check` verifies 394 decisions.
  - `generate-visuals --check` is current.
- **Guide rules:**
  - The guide validator reports 0 errors.
  - No record identifiers appear in the guides.
- **Fact-checking.** Three read-only subagents checked every guide statement against its owner records. They found about 40 errors or omissions, and I fixed all of them.
  - **Overstated S protection.** Publishing S does not stop the lender's route at T. It only gives the borrower a competing transaction that must confirm first, within about 24 hours between C and T.
  - **Incomplete acceptance gate.** Acceptance also needs a fresh check of the 24-hour and 19-hour limits.
  - **Repayment deadline.** Repayment must be finalized by D, not merely submitted.
  - **Upgrades.** An upgrade changes the code for every loan on that contract.
  - **Fee bumps.** Once an activation transaction is in the mempool, only a fee bump can add fee.
  - **Exit-package rebuilds.** Exit packages are rebuilt only if a reorganization changes which activation transaction won.
  - **Risk ranking.** The guides no longer rank the security risks beyond what the records say.
  - **Wording and omissions.** "Excluded" vs "deferred" is now correct, the second signing round is described, the hosting scope is accurate, and the payment account is shown as not yet verified.
- **Attributions.** I checked every attribution against `build/workflow/decision-overview.md`. The guides only name decisions as made by the user, approved by the user, or chosen by the agent where that file records them that way.
- **PDF pages.** I rendered every page of all seven PDFs and inspected them, including all 41 combined pages. I found no layout defects. An earlier word break in a table was fixed by turning the table on its side.

## Decisions I made without asking

- The guide headings and the illustrative people (Ana the borrower, Ben the lender) are my editorial choices. The guides say their examples are illustrative.
- Where the records conflict, the guides describe both sides and do not pick one. The only exception is the exit-package count: the guide follows eighteen and says the records disagree.

## Questions I would have asked you (conflicts left open)

Each one is noted in the guide where the reader reaches it, and as an `Unresolved source conflict:` line in the relevant domain record.

1. **Does the lender approve the final terms separately?**
   - No second approval: the architecture record, SEL-012 and IFACE-003's Must Not Imply section (TICKET-0069, user specified, 2026-08-06).
   - Both participants approve separately: SR-001, STATE-001, STATE-002, FLOW-001 and TICKET-0150 (user specified, 2026-09-28).
   - Does the later instruction replace the earlier one?
2. **Where are the offer, reservation and H(S) bound?** SR-001's Owns list and the architecture record put the offer, reservation and H(S) inside the loan terms. IFACE-001's 19-field `LoanTermsV1` leaves them out (it assigns the offer and reservation to IFACE-003).
3. **Can a payment account be a recipient?** SR-009 and the architecture record say a payment account is never a term-bound recipient. FLOW-001 and SR-011 allow a recoverable one as a recipient for a new loan, with disclosure.
4. **Is there an on-chain pause?** STATE-019 lists pause roles and a paused state. SR-003, SEL-009 and CONS-008 say version 1 has no on-chain pause.
5. **What happens when no fee tier qualifies?** IFACE-007's payload and TICKET-0018 say use 200 sat/vB and alert. IFACE-007's selection action says fail closed. IFACE-007 is pinned, so I left it unchanged.
6. **Should SR-002 say eighteen?** SR-002's archive-readiness item says twelve exit packages; everything else says eighteen. May I correct it?
7. **Scope boundaries in frontmatter.** The architecture `scope_boundaries` frontmatter leaves out SCOPE-014 and SCOPE-015. I did not change it.

## Limitations

- The combined PDF repeats the domain guides in full, by design.
- The cover and introduction text in each PDF are generated by the export tool.
- Links to technical records print as plain text in a "Technical records" appendix.
- The explorer.json fingerprint was updated by hand after review, not regenerated.
- I deleted my temporary work directory (`scratchpad/t7-guide-work`), so the baseline and render artifacts no longer exist; the results above are the record.
