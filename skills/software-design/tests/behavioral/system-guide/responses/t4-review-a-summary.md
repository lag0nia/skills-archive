All three guides fail under the key's pass rule. None has a Critical defect. Each needs only a few added sentences to pass. Full findings are in /private/tmp/claude-501/-Users-alanguerrero-Documents-ai-prompts/b72a9647-f430-4577-b73d-46cf594be5b3/scratchpad/eval/responses/t4-review-a.md. I changed nothing in the package.

| Guide | Critical | Major | Facts kept | Comprehension (of 8) | Verdict |
| --- | --- | --- | --- | --- | --- |
| `guide/architecture.md` | 0 | 2 | 14/15 (93%) | 7 correct, 1 partial | FAIL: two Majors |
| `guide/domains/loan-terms-and-commitments.md` | 0 | 1 | 13/15 (87%) | 6 correct, 2 partial | FAIL: under 90%, and the Major needs a correction note |
| `guide/domains/participant-access-and-loan-operations.md` | 0 | 0 | 12/15 (80%) | 6 correct, 2 partial | FAIL: under 90% only |

**Major defects:**
- **Architecture, line 153:** it says Bitcoin gates stop when the two sources "disagree or are both unavailable". The record (IFACE-006 and the TICKET-0025 resolution) requires fresh agreement between both sources. So a gate also stops when only one source is unavailable. The sentence contradicts the guide's own line 32 and hides the difference with Base, where one healthy provider is enough.
- **Architecture, lines 138 and 161:** they leave out the main risk of the two chains not settling together (SEC-023 THREAT-001). After the lender pays the principal on Base, the borrower, or anyone holding the signed refund, can broadcast the matured prefund refund before activation confirms. The lender is then left without collateral.
- **Loan Terms:** the guide never says that a reservation or a final-terms approval grants no signing, Vault custody, funding or chain authority. Rule 4.6 and section 2a require this; the owners are SR-010, IFACE-001, FLOW-001 step 4 and STATE-002.

**Weakened facts behind the percentages:**
- **Architecture:** A-14 lacks the rule that no threat may be summarized by a severity word alone, and that each combination has one owner.
- **Loan Terms:**
  - L-7 is the approval-authority gap above.
  - L-14 lacks the sentence "a narrative or diagram cannot supply a missing approval".
- **Participant:**
  - P-4 lacks the rule that every interaction makes its own identity and role check. The 403 wording on line 34 is also garbled.
  - P-11 lacks that operator approval is by one person, with no two-person or break-glass path.
  - P-14 gives no recorded status for the payment capability or the demo. The records say "Planned — unverified", and the demo slice is "Blocked". Line 105, "this design claims only the first two", can be read as current status.

The most notable Minor defects:
- **Loan Terms, line 58:** it says the records "do not say" whether an unused reservation expires or is cancelled before commitment. They do say, and they disagree: STATE-001 says Expired, while SEL-012 cancels with an infraction.
- **Architecture, line 54:** the figure label "a borrower reserves it, creating the loan" leans toward one side of the open approval conflict.
- **Architecture claim table:** the local demo row reads as a working claim ("A developer can run…"). The table also merges testnet, mainnet and production into one row.

**Facts the migration removed that now exist nowhere, or only in a guide:**
1. "A narrative or diagram cannot supply a missing approval" (old loan-terms domain record). It is now nowhere.
2. "These rules prevent an apparently successful retry from reviving old approval or signing material." It is gone as a statement. STATE-002 still covers part of it.
3. "The current payment capability is still an implementation target with no execution evidence." It is gone from the system model and the guides. Only build status records keep the status (VA-003, and BU-004's IFACE-022 rows).
4. The system-level statement that the approval-wording and fee/count conflicts remain unresolved now exists only in the architecture guide. Each conflict still has its own domain owner.

Everything else the migration removed still has a technical owner. Two inconsistencies remain in the technical records themselves:
- The "Cross-Domain Boundaries" section of `system-model/architecture.md` still says "no second lender approval" with no conflict marker.
- The old participant record called production gas sponsorship "excluded", but SR-011 now calls it "deferred". The guide follows SR-011.

**Where the key is wrong or incomplete:**
- L-12 counts H(S) as part of the terms, but IFACE-001's field list excludes it. The guides correctly report this as a discrepancy.
- P-9 oversimplifies what happens at 180 seconds. The participant guide is more accurate than the key.
- The key misses four real discrepancies, which the architecture guide reports correctly:
  - whether a reservation expires or is cancelled before commitment;
  - random participant references versus actual account IDs;
  - "any caller" versus "term-bound caller" for revealing X and Y;
  - "no on-chain pause" versus STATE-019's pause roles, and the missing beta key.

**Fixes that would pass each guide:**
- **Architecture:** rewrite line 153 and add the SEC-023 race.
- **Loan Terms:** add one sentence that approval carries no authority, and restore the narrative/diagram sentence.
- **Participant:** add one sentence each for the per-interaction check, one-person operator approval, and the planned and unverified status.
