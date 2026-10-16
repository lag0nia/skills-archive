STATUS: INCOMPLETE. I was told to hand back before the work finished. No PDFs have been exported yet: /private/tmp/claude-501/-Users-alanguerrero-Documents-ai-prompts/b72a9647-f430-4577-b73d-46cf594be5b3/scratchpad/eval/t13-pdf is still empty or missing. Four background domain-author agents were still running when I stopped. Their results have not arrived and I have not checked them.

## Why this became a whole-package migration
The skill's exporter refuses to export anything until the full System Guide validates. That means every domain needs a guide, and no domain record can keep a `## Domain Overview` section. So an architecture PDF and a Base Observation And Fallback Review PDF can't be produced unless all five domains are migrated. I proceeded under your approval to edit the package as needed. I planned to export only the two PDFs you asked for.

## Done (package: .../eval/t13/bitrise21/loan-system/design/technical-design)
- **Baseline.** Before editing, I copied the package to `.../scratchpad/t13-work/baseline` and ran every validator on that copy. Output is in `.../t13-work/val-baseline/`. Failures before my changes:
  - The structure, build-design, ui-ux and delivery-readiness checks fail because the role-split prototype is missing its runtime evidence.
  - Delivery readiness also reports missing bounded-scope evidence for core coordination and closure gaps in the fee-bump helper handoff.
  - Assurance coverage fails because it needs repository path arguments.
  - Visuals check and decision-overview check passed.
- **Architecture record (`system-model/architecture.md`):**
  - Added `system_guide: adopted` and a link line to the guide.
  - Removed `## System Overview`; its facts already live in its own sections or in flows and invariants. The inventory is in `.../t13-work/inventory-coordinator.md`.
  - Added one `Open question:` line on lender approval wording (details below).
- **README.md:** added one paragraph linking the System Guide first.
- **Base Observation And Fallback Review domain record:**
  - Replaced `## Domain Overview` with a link line to the guide.
  - Added links its technical sections lacked: the unclaimed-repayment and conditional-recovery flows, the claim/refund exclusivity invariant, the residual missing-Y risk invariant, the finality selection, and the institutional-recovery scope record.
- **Guides written:** `guide/architecture.md` (complete draft) and `guide/domains/base-observation-and-fallback-review.md` (complete draft). Both parse. Their only validator errors are links to domain guides not yet written.
- **Delegated:** the other four domains (Loan Terms, Bitcoin, Base Settlement, Participant Access) went to background agents. Each was told to edit only its own domain record and its own guide. The shared brief is `.../t13-work/domain-brief.md`. I don't know their results.
- **Rendering tool:** built a page renderer at `.../t13-work/tools/render` because no PDF rasterizer was installed. It isn't used yet.

## Remaining steps (not done)
1. Collect the four domain results, then reconcile the open-question wording across all guides.
2. Independent fresh-context reviews: one of the technical diff against the baseline, and one of each guide against its source records. The skill requires these; nothing has been reviewed yet.
3. Regenerate the visuals: my edits make the visuals check stale. Then run all validators and compare with the baseline. The domain record edits have already changed files the visuals are generated from.
4. Export with `node <skill>/scripts/export-system-guide.mjs --root <package> --out .../eval/t13-pdf --architecture --domain base-observation-and-fallback-review`. A Playwright Chromium is in `~/Library/Caches/ms-playwright`. Then render and inspect every page.

## Package state right now
Adoption is declared but four domain guides may still be missing. Until they exist, structure validation fails on the System Guide checks, and export is impossible.

## Questions I would have asked
1. **Lender approval wording.** The architecture record, the one-loan offer contract, the offer selection and the scope record say reservation needs no second lender approval. The offer selection adds "there is no second lender-approval step"; the decision overview lists the no-second-approval rule as user-specified. But the offer state, terms state and terms responsibility records require a lender final-terms approval before commitment; the decision overview lists that rule as agent-chosen. I recorded this as an Open question, not a conflict. Which reading do you intend?
2. **Terminal package count.** The package-construction responsibility record says a "12-package signed terminal phase". The flows, state and constraint records say 18 terminal packages. This was handed to the Bitcoin agent to record as an unresolved source conflict.
3. **Fee choice when no signed tier qualifies.** The fee interface's policy paragraph says to select 200 sat/vB, mark the fee-bump eligibility and alert. Its tier-selection action says the result fails closed and selects nothing. Also handed to the Bitcoin agent as an unresolved conflict. Which is intended?
4. Do you accept that all five domain guides and all five domain records must change just to export the two PDFs you asked for?

## Checked so far
- The interface files and the two core coordination Build Units are pinned by the core coordination scope assessment. I have not edited them.
- No visual source bindings point at the removed overview sections.
- No `todo` or `deferred` tickets exist: 136 are finished and 19 are out-of-scope.
- I compared the claims in the two guides with the observation, fallback, flow, interface, state, invariant, selection, constraint and scope records, and with the decision overview's record of who chose what.
