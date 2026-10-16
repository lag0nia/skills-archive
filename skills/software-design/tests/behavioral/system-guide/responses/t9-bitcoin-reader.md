I read the whole PDF, which is 6 pages. Read with the `pages` parameter failed because pdftoppm is not installed, so I read the file with Read and no `pages` value. That returned every page's text and image. I opened no other file and ran no commands.

## Answers

**1. Staged collateral versus active collateral.** Pages 1, 2, 3, 4. Confidence: medium. The document never uses the words "staged collateral" or "active collateral". It describes two Bitcoin outputs:
- **Prefund (staged).** The borrower funds the prefund after the terms are committed, and it holds the Bitcoin before the loan starts.
  - Once the prefund output has been seen and checked against the agreement, the six activation and six refund transactions can be built and signed. Confirmations are not needed for this step.
  - Nothing relies on the prefund until it has six unchanged confirmations. Only then can the Base funding window open and the loan be accepted.
- **Escrow (active).** This is the later, confirmed collateral output, locked by a script both participants agreed to. It is created by the fixed activation.
  - Exit transactions are built only after an activation has six confirmations, and only for that exact escrow. They cover borrower recovery (with Y or S), lender default, and the borrower long-stop.
  - The loan becomes "fully active" only when that exit set is signed and durably stored.

What the prefund itself permits beyond activation and refund is not spelled out. In particular, the document does not say when or how a refund can be used.

**2. What is signed before the lender funds, and what only afterward.** Pages 2, 3, 4. Confidence: medium for the order of the sets, low for how it maps to "lender funds".
- **Before:** the initial set. There are six activation and six refund transactions, one per fee level (10, 20, 50, 100, 150 and 200 sat/vB). The borrower signs all twelve and the lender adds its signature to the six activation transactions. All of this can happen before the prefund qualifies, and so before the Base funding window opens.
- **Afterward:** the exit set. There are six borrower-recovery, six lender-default and six borrower long-stop transactions. They are built only after one activation has six confirmations. The borrower signs the two borrower routes and the lender signs its own route.
- **Gap:** the document never says exactly when the lender sends the USDC. I am inferring that it happens during or after the "Base funding window". Page 4 mentions "principal already paid" by the time the exit set is being signed. Cooperative-settlement signatures are made fresh, at whatever time a settlement is agreed (page 2).

**3. Status and risk after X is disclosed and USDC received, but before activation confirms.** Pages 3, 4, 5. Confidence: low. This is only partly answered.
- **What the document says:**
  - When X is public and final on Base, the system inserts X into one chosen activation transaction and broadcasts it.
  - The other signed activation transactions "remain valid competitors until one of them spends the prefund".
  - The loan is fully active only after an activation has six confirmations and the exit set is signed and stored. Until then, no exit transactions exist.
  - If a different activation wins, a fresh exit set is needed.
  - If the prefund is replaced, lost or conflicted, everything built on it must be rebuilt and re-signed. A plain reorganization only pauses use.
  - Once exit signing is underway, the loan is "explicitly pending signatures". Principal already paid cannot be undone.
- **What it does not say:**
  - It gives no status name for the window before activation confirms.
  - It does not say whether the borrower's signed refund transactions could compete with activation for the prefund. That would be the obvious risk to the lender.
  - It does not say for certain that the borrower receives the USDC at the moment X is disclosed.

**4. How the Bitcoin comes back after repayment, and how the fallback differs.** Pages 1, 2, 3, 4. Confidence: high.
- **Normal case:** after repayment, the lender's claim on Base makes Y public. Y completes the borrower's already-signed recovery transaction without changing its output, signature or identity. The collateral comes back when that transaction confirms.
- **Fallback:** an independent secret S fills the same recovery transaction. The differences are:
  - S exists only for loans created with that capability.
  - It is triggered by a separate refund event on Base, not by the lender's claim.
  - It comes from an independent fallback service, while Y is learned by observing Base.
  - This domain does not decide whether the fallback evidence is valid.
- The destination and the signed transaction are the same in both cases.

**5. Time-based routes if neither Y nor S ever becomes available.** Pages 1, 4, 5. Confidence: high for the routes, medium for the timing reference point.
- **Lender default:** valid after its own consensus deadline, three days after the repayment deadline.
- **Borrower long-stop:** valid "after ten days". It is authorized by the borrower in advance and uses an absolute timelock with no secret. It is included only in newly built escrows; an existing escrow cannot gain it later.
- **Clashes:** once both routes are valid they run at the same time, and "only one confirmed spend wins". Bitcoin consensus decides, and the document gives no priority rule. A Base repayment or refund cannot revoke these signatures.
- **Out of scope in this version:** automatic broadcast of lender-default transactions by the organization, and institutional recovery of stranded collateral.
- **Unclear:** "ten days" is presumably counted from the repayment deadline, but the document does not say so.

**6. Confirmations given when disclosing a secret on Base.** Page 2. Confidence: high for the borrower; the lender's side is not answered.
- **Borrower:**
  - First, the borrower reviews facts that contain no secret. This only allows a narrowly unlocked worker to prepare the exact transaction carrying X.
  - Second, a confirmation tied to those exact bytes authorizes signing and submission.
- **Lender:** the document mentions "the normal claim that reveals Y" but describes no confirmation steps for it.

**7. How the fee is chosen for a pre-signed transaction, and what is unsettled.** Pages 4, 5. Confidence: high.
- **The rule:**
  - Fees are fixed at signing time across the six levels.
  - The system picks the lowest signed level strictly above the estimate plus a 25% buffer.
  - Estimates use integer units, the expected signed size, a strict buffer comparison, freshness limits and replacement rules.
  - The levels are target fee classes, not guaranteed minimum rates.
- **Who decided:** the user set the levels. The agent recommended the 25% rule and the user approved it. The agent chose to apply the rule to activation and to the prefund refund.
- **When no level is high enough:** a pay-to-anchor output allows a separately funded child transaction to add fee. An operator approves the exact fee, a local helper builds the child, and the operator signs and broadcasts it manually from a Bitcoin Core fee wallet.
- **Unsettled:**
  - What happens when no level qualifies. One reading says use the 200 level, record that a fee bump is allowed and raise an alert. The other says fail closed and select nothing. The document says to treat this as undecided.
  - The document does not say whether the selection rule also applies to the exit transactions.

**8. A forgotten Vault password.** Pages 2, 5. Confidence: high for what is stated; consequences are not answered.
- Account recovery in the product cannot recreate a forgotten Vault password.
- This version cannot recover from it at all. Stronger Vault recovery is deferred.
- The document does not say what follows for the participant's loans, such as whether already-signed transactions remain usable without the Vault.

**9. A stolen signed default transaction prepared for the lender.** Pages 1, 2, 4, 5. Confidence: low. The document never discusses theft, so this is inference.
- **What follows from the document:**
  - A signed transaction authorizes only its exact earlier contents. It "is not permission … to choose a new destination", and the system never chooses a new destination.
  - The default route is valid only after its consensus deadline, three days after the repayment deadline.
  - Once valid, it competes with the borrower long-stop, and only one confirmed spend wins.
  - So a thief could at most broadcast it after the deadline, and the Bitcoin would go to its fixed output.
- **What is missing:**
  - The document never says what that output is; "the lender's fixed default route" only implies it pays the lender.
  - It does not say whether anyone besides the operator could add fee through the pay-to-anchor output.

## Confusing points, terms used before explanation, and gaps

- **Undefined terms:** "Base" is never defined. Other terms are used without explanation: "Base funding window", "fallback service", "Vault web origin", the "narrowly unlocked worker", "per-loan preparation has been acknowledged", "consensus deadline", "hardened key index" and "package".
- **Inconsistent wording:** "activated capability" (page 4) versus "created with that capability" (page 1) for S.
- **Timing gaps:** the deadline wording ("three days after the repayment deadline", "after ten days") leaves the reference points vague.
- **Undescribed mechanics:**
  - When the lender actually funds is never stated.
  - When and how the prefund refund transactions can be used is not described, including any timelock, who broadcasts them, and whether they compete with activation.
  - Why the lender signs activation but not refund is not explained.
- **Missing destinations:** neither the lender-default output nor the long-stop output is stated.
- **Exit-set count:** eighteen versus twelve. The document flags this as open and uses eighteen.
- **Attribution wording:** "the user" and "the agent" in the fee section are confusing for a newcomer.
- **Other domains:** the document says there are five domains but never names the other four, apart from hints.
- **Expected but missing:**
  - The status names of the loan.
  - Who broadcasts the default, long-stop and refund transactions in practice; lender-default broadcast is manual export only.
  - What a lost Vault means for collateral.
  - Any discussion of stolen transactions or compromise.
