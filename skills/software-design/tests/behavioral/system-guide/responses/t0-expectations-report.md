The answer key is written to:
`/private/tmp/claude-501/-Users-alanguerrero-Documents-ai-prompts/b72a9647-f430-4577-b73d-46cf594be5b3/scratchpad/eval/expectations/expectations.md`

The source directory was not modified. I checked that every cited source file exists and spot-checked the headings, the decision counts, and several quoted phrases against the sources. The key has not been tried on an actual guide.

**What the file contains:**
- **Part 1:** 15 must-preserve facts for each of the six guides. Each fact gives the owning file, its exact section heading, and the misunderstanding it prevents. Conditions and limits are kept exactly as the owners state them: "strictly before" the claim cutoff, the cutoff, lender-route and long-stop times, six confirmations, the 24-hour windows, the fee tiers with the strict 1.25 rule, the 15-minute reauthentication, and the 0/15/60/180-second payment probes.
- **Part 2:** distinctions (a) to (h), with owner quotes and sources, the guides that must carry each one, and phrasings a guide must not use. Section (c) also separates the three different "refunds" the sources describe.
- **Part 3:** 8 neutral comprehension questions per guide. Each has the expected answer, its source, and what counts as a wrong or dangerously simplified answer.
- **Part 4:** reviewer criteria with critical, major, and minor defect tiers, acceptable simplifications, fidelity rules, and a suggested pass rule.

**Conflicts found.** The owners themselves flag the first three as unresolved and say this revision does not choose behavior:
1. **Second lender approval.** The architecture document, the offer/reservation contract, the scope record, and a 2026-08-06 decision say reservation creates the loan with no second lender approval. The terms responsibility, the two state records, the origination flow, the UI spec, and a 2026-09-28 user decision say both roles must separately approve the final terms. It is undecided whether the wording or the behavior will change.
2. **Number of terminal packages.** One stale sentence in the package-construction record says 12; every other source says 18. Its repair is still pending. Twelve is also the correct count for the initial packages and for the borrower's terminal signatures, so those uses are not part of the conflict.
3. **Fee when no pre-signed tier qualifies.** The fee contract's payload section and the ticket decision say to use the 200 sat/vB tier, record fee-bump eligibility, and alert. The same contract's action section says fail closed and select nothing. The domain record cites a "former decision" for fail-closed but does not name it; the only fail-closed decision I found covers a different case (every fee estimator is unusable). It is undecided which behavior applies.

**Problems the owners did not flag:**
- The same state is called "awaiting_final_approvals" in one record and "Awaiting acceptances" in two others. "Acceptance" is also used in four different senses across the sources.
- The Loan Terms domain narrative mentions only the borrower preparing their secret commitment, but the detailed records require both parties to do so.
- The cross-origin handoff contract's signing list leaves out the borrower's six long-stop signatures.
- The activation flow's outcome wording mentions only the "normal/default" terminal phase, omitting the long-stop.
- The flow for an unclaimed repayment leaves out the borrower long-stop as a later route, while the lifecycle file includes it.
- The responsibility records cite API contract version 1.7.0, while the handoffs README refers to versions 1.8 and 1.9.
- The decision overview's coverage text says 0 tickets lack attribution, but its own table counts 13 unknown-origin decisions. The key uses the table's numbers and does not flag this.

**Where the sources are silent:**
- No source records that counsel approval or implementation evidence exists for the independent fallback service, so the key treats that fallback as not available in production.
- All four verification records are "Planned — unverified".
- The local demo is recorded as blocked: its runtime still has an explicit "not implemented" stop.
