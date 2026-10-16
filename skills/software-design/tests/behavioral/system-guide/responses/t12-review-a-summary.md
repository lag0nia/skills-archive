None of the three guides passes. Architecture and Participant are each blocked under the correction's acceptance rules. Loan Terms has no blocker but narrowly misses the key's 90% fact threshold.

None of the three has a Critical defect: no authority or status collapse, no claim that the fallback is available, no open conflict presented as settled, and no wrong number. I did not run the reader-question test, so that part of the pass rule is unscored.

| Guide | Critical | Major | Facts preserved | Key's pass rule | Correction's acceptance |
|---|---|---|---|---|---|
| Architecture | 0 | 1 | 13/16 (81%) | Fail (90% rule) | Blocked |
| Loan Terms | 0 | 0 | 13/15 (87%) | Narrow fail (90% rule) | No blocker |
| Participant | 0 | 1 | 10/15 (67%) | Fail (90% rule) | Blocked |

**Architecture.** The blocker is the figure on line 46, which says "both participants sign the activation and refund transactions". FLOW-001 step 7 (and IFACE-004 and SR-002) say the lender signs only the activation transactions; the borrower alone signs the refunds. The guide's own prose on line 56 is correct, so the figure contradicts both. Other findings are Minor:
- **Fallback conditions:** line 19 calls S "optional" without the activation gate; line 13 just above carries it. A strict "each passage" reading of the correction would make this Major.
- **Observers:** line 119 merges the Base observer-conflict and observer-outage rules with the Bitcoin "fresh agreement" rule.
- **Cooperation route:** presented without noting that its operation is deferred (SCOPE-005).
- **Facts weakened:**
  - No mention that there is no guaranteed cold redeployment or active-active setup.
  - The demo's fail-closed list is partial: absent or conflicting settings and non-loopback binds are missing.
  - The severity-word and combination-attack rules are missing.
- **Verification status:** the guide never says the verification records are still "Planned — unverified".

All four required open conflicts (lender approval, package count, fee tier, beta upgrade governance) are carried correctly with both sides, and so are the upgrade-effect-on-loans and on-chain-pause tensions and the claim ladder.

**Loan Terms.** It never mentions the conditional fallback commitment H(S), so that fact is Missing. It also omits the notices to both parties and the "stale selection loses" rule when a reservation is cancelled. Two smaller gaps: it omits the bar on amending an effective Base loan in place, and "acceptance snapshot" is used without explanation. The lender-approval open question is handled thoroughly and correctly, and both reservation-expiry cases are kept. If the cancellation omissions are judged too slight to count, it reaches 14/15 (93%) and passes.

**Participant.** The blocker is line 14: "It is not a general signing permission." The correction names this wording as Major, and no passage carries IFACE-004's statement that the code is "an expiring pointer, not authentication, transaction consent, or cryptographic authority". The guide copied this wording from the pre-migration domain narrative. Minor findings:
- Payments: retry after 180 seconds is an explicit participant or operator action, and blocking happens only on missing or contradictory evidence; neither is stated.
- Participant transfer: the validation, exact-approval and balance/gas checks are omitted.
- Operator approval by one person is not mentioned.
- The payment capability's "planned and unverified" status is replaced by one correction's passing focused checks.
- It never says final-terms approval grants no signing power.
- Seed display and current PSBT are missing from the 15-minute reauthentication list.
- "Notification" is used where the owner means the internal wake.

**Where the answer key is wrong or incomplete:**
- The on-chain pause tension misses SEC-017 (pause signers, "pause new key", "pause new funding") and INV-019's pause rule.
- The upgrade tension misses SEL-009's own sentence that "each loan remains pinned to its originating deployment identity", which may reconcile the two sides.
- The lender-approval conflict misses STATE-010 on the no-approval side. It also quotes only TICKET-0069's attribution, while the ticket's resolution says "second lender commercial approval".
- The key has no fact for who signs the initial package phase.
- Most of the 90%-threshold failures here come from Minor omissions.

**Changed technical records (outside this review).**
- "A narrative or diagram cannot supply a missing approval" was removed and now has no owner.
- The domain record's "payment capability is an implementation target with no execution evidence" was removed and survives in no record; VA-003's "Planned and unverified" carries only part of it.
- SR-001 now points to the Loan Terms guide for "the full cooperation scenario".
- `build/` is unchanged from the pre copy, and I found no rewritten side of any conflict.

Full findings, with quotes, owner sections and severities, are in /private/tmp/claude-501/-Users-alanguerrero-Documents-ai-prompts/b72a9647-f430-4577-b73d-46cf594be5b3/scratchpad/eval/responses/t12-review-a.md
