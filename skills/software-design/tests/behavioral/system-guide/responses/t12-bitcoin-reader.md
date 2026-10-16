Note on reading: the PDF has only 6 pages. Reading it with the `pages` parameter failed because pdftoppm is not installed, so I read it without that parameter and got the full text of all 6 pages. I opened no other file and ran no commands.

## Answers

**1. Staged versus active collateral** (pp. 1–4; confidence medium-high)
The document never uses the phrases "staged collateral" or "active collateral". It describes two Bitcoin outputs, and I am mapping them onto your terms.
- **Prefund (staged):**
  - The borrower sends the collateral here from their external wallet before the loan is active (p. 1).
  - Packages can be built from the observed prefund even before it confirms (p. 2).
  - Six unchanged confirmations are needed before anyone relies on it, the funding window on Base opens, or acceptance is allowed (p. 2).
  - It can be spent by one of six signed activation variants, or by one of six borrower refund variants. A refund becomes usable after a relative timelock if X is never accepted (pp. 2–4).
- **Escrow (active):**
  - It secures the active loan, and one activation transaction moves the prefund into it (p. 1).
  - It can be spent only by the borrower's normal recovery (completed with Y or S), the lender's timelocked recovery, or the borrower's long-stop (pp. 1–3).
  - The loan becomes "package-ready active" only after those recovery packages are archived and acknowledged (p. 3).

**2. What is signed before versus after the lender funds** (pp. 2–3; confidence medium for the package sets, low for the timing against funding)
- **Before activation:** six activation and six borrower refund transactions, at 10, 20, 50, 100, 150 and 200 sat/vB. The borrower's Vault signs all twelve, and the lender's Vault adds its signature to the six activations. Operations checks the signatures, archives them, then issues a receipt.
- **Only after one activation reaches six confirmations:** 18 recovery packages, six of each kind (borrower normal recovery, lender timelocked recovery, borrower long-stop). The borrower signs two families and the lender signs its own.
- **Gap:** the document never says exactly when the lender pays the USDC.
  - It only mentions a "funding window on Base" that opens after the prefund has six confirmations (p. 2).
  - It also says, for the "terminal signing pending" case, that "the principal already paid" cannot be undone (p. 3).
  - That suggests the recovery packages are signed after funding, but this is my inference.
- **Open conflict:** whether the archived active-phase set holds 12 or 18 packages is unresolved (p. 6).

**3. X disclosed and USDC received, but activation not yet confirmed** (pp. 3–4; confidence low-medium, answered only partly)
- **Status:** the document names no status for this exact window. "Terminal signing pending" applies only after activation confirms, and "package-ready active" only after recovery packages are archived.
- **Risks the document supports:**
  - No recovery package exists yet, because the escrow output is unknown (p. 3).
  - Any of the six signed activation variants could confirm. If a different one wins, packages built for another parent are invalid (p. 3).
  - If the prefund is replaced or lost, every package that depends on it becomes invalid and must be rebuilt and re-signed (p. 3).
  - Once X is public, an observation incident is "critical immediately" (p. 4).
  - A stuck activation can only be sped up with a fee-bump child (p. 4).
- **Not addressed:** whether the borrower's refund could still race the activation at the Bitcoin level once X is public. The organization will not broadcast a refund if Base shows an accepted X (p. 4).

**4. How the Bitcoin comes back after repayment** (pp. 1–4; confidence high)
- **Normal route:**
  - The borrower repays on Base, and the lender claims by revealing Y.
  - The finalized public Y fills the witness of the borrower's already-signed normal recovery transaction. Outputs, signature and package entry are unchanged.
  - The system picks a fee variant and broadcasts it. The escrow counts as recovered only when that transaction confirms (p. 3).
- **Independent fallback (S):**
  - It applies only to loans created after the validation service was activated for production.
  - It requires that the lender did not claim before the claim cutoff (D + 2 days), that the repayment became refundable to the borrower on Base, and that the service verified that refund event at Base L1 finality.
  - S then completes the same recovery transaction, to the same destination.
  - Lender silence, elapsed time or a missing Y alone never triggers S (pp. 2, 4).

**5. If neither Y nor S ever becomes available** (pp. 2, 4, 6; confidence high)
- The lender's timelocked recovery becomes valid at D + 3 days, and the borrower's long-stop at D + 10 days.
- Bitcoin measures time by median-time-past, not by any application clock.
- From day 10 both can be valid at once. The first to confirm wins, and that one confirmed spend is the only final outcome.
- Base repayments or refunds cannot revoke these signatures, because Bitcoin cannot see Base.
- The organization does not broadcast the lender's recovery automatically; the lender exports its package and broadcasts it itself (p. 6).
- **Not stated:** who broadcasts the long-stop, and whether the normal recovery route stays valid alongside these.

**6. Confirmations when disclosing a secret on Base** (p. 3; confidence medium, answered only partly)
- **Borrower (X), two confirmations:**
  1. The borrower reviews the public facts. The document does not say exactly what this step permits; it appears to lead to a narrowly unlocked Vault worker preparing the exact acceptance transaction carrying X.
  2. A second confirmation, bound to those exact bytes, authorizes signing and submission.
- Submitting makes X public. Only after Base L1 finality may the construction side complete and broadcast one activation transaction.
- **Lender (Y):** the document gives no confirmation steps for the claim that reveals Y.

**7. Fees for pre-signed transactions** (pp. 4, 5, 6; confidence high)
- **Selection rule:** pick the lowest signed level strictly greater than 1.25 times a fresh one-block estimate, using whole-number arithmetic and the transaction's actual virtual size.
- **Estimates:** sources are tried in order (Mempool, then Blockstream Esplora, then Validation Cloud), each with a 15-second deadline and one retry. An estimate must be at most 120 seconds old at first broadcast.
- **No usable estimate:** automatic broadcast stops. An operator may record only an existing signed level, with a reason.
- **After relay:**
  - Activation and recovery transactions can only get more fee from a fee-bump child. The organization's fee wallet pays it through the pay-to-anchor output, with operator approval, a local helper and the operator's own Bitcoin Core node.
  - A relayed refund may instead be replaced by a higher, already-signed refund variant.
- **Unsettled:** if every signed level is too low, one record says to use 200, record that a fee-bump child may be needed, and alert. Another says to fail closed with "no eligible tier". So it is unknown whether such a transaction would be broadcast at 200.

**8. Forgotten Vault password** (pp. 4–6; confidence high)
- The participant cannot disclose their secret, rebuild packages, sign anything new or settle cooperatively.
- Packages already signed and unchanged remain usable under their own conditions.
- If the lender loses the password before signing its recovery packages, that protection stays unsigned. This window is a recorded residual risk.
- There is no forgotten-password recovery in this version. Stronger recovery, such as recovery codes or social recovery, is deferred.

**9. Theft of the lender's signed default transaction** (pp. 1, 3–6; confidence medium, my inference)
- "Default transaction" is not the document's term; I take it to mean the lender's timelocked recovery. The document never discusses theft of a signed package directly.
- From its rules:
  - A signed package pays a fixed destination agreed in the terms and gives nobody permission to choose a new one (p. 1).
  - A fee-bump child cannot change the destination or amount (p. 4).
  - Each participant signs only routes paying its own fixed destination (p. 3).
- So a thief could at most broadcast it once it is valid (D + 3 days), and the Bitcoin would go to the lender's committed destination.
- **Contrast:** a stolen loan key is dangerous, because once a route that key can use on its own becomes usable, the thief can sign a new transaction to any destination (p. 5).

## Confusing points, terms used before they were explained, and gaps
- **Undefined terms:** "Base", "Base L1 finality", "funding window", "eligible loans" (only explained on p. 4) and "acknowledged Vault results" are never defined or are defined late. "Fee variant", "manifest", "witness", "parent", "hardened key", "golden fixtures" and "qualification pauses" assume prior knowledge. "Fee-bump" is mentioned on p. 2 but only explained on p. 4.
- **Unexplained statuses:** "package-ready active" and "terminal signing pending" appear without explanation of the full status lifecycle.
- **Expected but missing:**
  - When the lender actually pays the USDC relative to acceptance and activation.
  - How long the prefund refund's relative timelock is.
  - Who broadcasts the borrower's long-stop.
  - What happens if the lender claims late and the normal recovery has not confirmed before D + 3, when the lender's recovery becomes valid.
  - Whether the borrower keeps both the refunded USDC and the Bitcoin in the S case.
  - What happens to the borrower if they never repay (only implied by the lender's timelocked recovery).
  - The confirmation steps for the lender revealing Y.
- **Conflicts the document itself flags (p. 6):** whether the archived package set holds 12 or 18 packages, and what happens when every fee level is too low.
