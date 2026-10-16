Answers from the Bitcoin Authorization And Recovery guide

The PDF is 7 pages and I read all of it. The paged read (pages "1-20") failed with "pdftoppm is not installed". A plain Read of the same file, with no pages parameter, returned all 7 pages. I opened nothing else and ran no commands.

**1. Staged collateral versus active collateral.** Pages 1, 3, 4, 6. Confidence: high for the facts; medium for treating them as "permissions", because the document uses different names.
- The document never says "staged" or "active collateral". It uses **prefund** and **escrow**.
- **Prefund** is "a staging object, not yet collateral for an active loan" (p1).
  - As soon as it is seen with the expected script and amount, even with zero confirmations, the system builds 12 transactions: 6 activation variants (prefund to escrow) and 6 refund variants. The refunds return the Bitcoin to the borrower after a relative timelock of about 72 hours (p3).
  - Nothing relies on the prefund until it has six unchanged confirmations. Only then can the Base funding window open, and only while at least 67 hours remain before the refund route becomes valid (p3).
  - A refund may be broadcast only with fresh evidence that the prefund is unspent and X was never accepted (p4).
- **Escrow** "secures the active loan" (p1). It exists only once a pre-signed activation transaction has six confirmations.
  - Only then are the 18 exit transactions built: 6 recovery (using Y or S), 6 lender (valid after T) and 6 long-stop (valid after B, no secret needed).
  - The loan becomes active only after these are signed and archived with a second receipt (p3).
  - The escrow can also be spent by a cooperative settlement that both participants freshly sign; this needs no secret and no timelock (p6).

**2. What is signed before the lender funds, and what only afterward.** Pages 3, 4, 5. Confidence: high. The before/after split comes from the order of the numbered steps; the document does not state it as a rule.
- **Before funding** (step 2, before qualification and before Ben funds in step 4):
  - The 12 prefund transactions.
  - Ana signs all 12; Ben signs the 6 activation variants.
  - The activation variants are signed but cannot be completed until X is inserted.
- **After funding:**
  - Ana's Base transaction that reveals X. It is prepared and signed only during acceptance.
  - X is then inserted into one already-signed activation variant, which is broadcast.
  - After the escrow has six confirmations, the 18 exit transactions are built and signed. Ana signs her 12 (recovery and long-stop) and Ben signs his 6 (lender).
- **Later, only if needed:**
  - Operator-approved CPFP child transactions (p5).
  - Any freshly signed cooperative settlement (p6).

**3. Status after X is disclosed and the USDC received, but before activation confirms.** Pages 3, 4, 5. Confidence: high for the risk; low for the status, because the document gives this phase no name.
- **Status:** "the principal has been paid on Base but the escrow does not exist yet" (p4). The loan is not yet active (p3).
- **What the application must do:** keep pushing the activation.
  - Before the selected variant enters a mempool, it may switch to a higher signed fee variant.
  - Once a variant is accepted, that variant is the only parent, and only an approved CPFP fee bump can add fee.
  - It may not refund the prefund or substitute a different, unsigned transaction.
- **Risk:** if the borrower's refund confirms first anyway, the borrower keeps both the principal and the Bitcoin, and the lender is unsecured. The records call this the "principal residual cross-chain risk", borne by the lender, because Base and Bitcoin cannot settle atomically (p4).
- **Related safeguards:**
  - Observation problems are treated as critical immediately once X is public (p5).
  - Acceptance fails closed unless at least 19 hours remain before the refund route opens (p3). The document does not say outright that this margin exists to protect the activation.

**4. How the Bitcoin comes back after repayment, and what changes with the fallback.** Pages 2, 3, 5, 6. Confidence: high for what is stated, with gaps.
- **Normal repayment:**
  - Ana repays on Base, and Ben claims the repayment by revealing Y.
  - When that event is final on Base, the application inserts Y into Ana's already-signed recovery transaction. Nothing else in it changes.
  - The application broadcasts it, and its confirmation pays Ana's committed destination (p3).
- **Independent fallback (secret S from the validation service):**
  - It completes the same recovery transaction with the same borrower signature. The service never signs, and Ana does not sign again (p6).
  - It applies when Ben does not claim before the claim window closes. In that case the USDC returns to Ana on Base, but the escrow is untouched (p5).
  - It works only for loans created after the service is approved for production. The service is not yet in production, and the fallback cannot be added to loans whose escrow already exists (p2, p5).
  - It protects Ana only if it confirms before Ben's lender transaction, which becomes valid at T regardless of repayment (p5).
- **Not answered:** where or how S is published, and what makes the service publish it. The service's "own judgment" is outside this domain (p6).

**5. Time-based routes when neither recovery secret becomes available.** Pages 2, 5, 7. Confidence: high.
- **Lender route:** valid at T, three days after the repayment deadline D.
- **Borrower long-stop:** valid at B, ten days after D. It needs no secret.
- Both deadlines are measured by Bitcoin's median time past (MTP), not any application clock (p2).
- **How a clash is settled:** the long-stop does not cancel the lender route. Both can be valid at once, and the first to confirm wins. Bitcoin consensus decides (p1, p5).
- Since T comes before B, the lender route is valid 7 days earlier.
- In version 1 the lender exports the package and broadcasts it himself; the organization does not broadcast default transactions (p5, p7).
- **Not answered:** who broadcasts the long-stop, and whether the application does it automatically.

**6. Confirmations given when disclosing a secret on Base.** Page 3. Confidence: medium.
- **Borrower (revealing X)** confirms in two steps:
  - First she confirms "the plain facts of the loan".
  - Then an isolated worker in her Vault briefly unlocks X and her Base key, prepares the exact transaction that reveals X, and asks for a second confirmation tied to those exact bytes.
- The second confirmation explicitly allows signing and submitting that transaction.
- The document does not say what the first confirmation allows. From the order, it appears to let the worker unlock X and prepare the transaction.
- Acceptance fails closed unless at least 19 hours remain.
- **Lender (revealing Y):** the document only says the lender claims the repayment by revealing Y (p2, p3). It gives no confirmation steps for that.

**7. How the fee is chosen for a pre-signed transaction, and what is unsettled.** Pages 1, 2, 4, 5, 6, 7. Confidence: high.
- **Variants:** each transaction is signed in 6 variants: 10, 20, 50, 100, 150 and 200 sat/vB. Each carries a 240-satoshi pay-to-anchor (P2A) output for a later CPFP child.
- **Selection rule:** take the lowest signed variant whose rate is strictly above the current estimate plus a 25% buffer, using integer arithmetic only.
- **Estimates:** from Mempool, then Blockstream, then Validation Cloud, each with a 15-second deadline.
- **Switching:** a higher variant may be chosen before one enters a mempool.
- **Stuck transactions:** an operator approves a CPFP child.
  - A local helper builds it unsigned from the organization's fee wallet.
  - A manually unlocked Bitcoin Core node signs and broadcasts it.
  - The fee wallet gains no authority over the loan.
- **Unsettled:** what happens when no variant clears the buffered estimate. The records conflict and the document leaves this open (p7):
  - One paragraph of the fee contract, and a resolved ticket, say: pick the 200 sat/vB variant, record CPFP eligibility, and raise an alert.
  - The same contract's selection action says: fail closed with "no eligible tier".

**8. A forgotten Vault password.** Page 5, with deferred options on page 7. Confidence: high.
- There is no forgotten-password recovery.
- Signing in again, or restoring the encrypted backup, works on a new device, but only with the known password and the complete encrypted backup.
- Without the password, no server, operator or product mechanism can restore the Vault, and an unrevealed X or Y is lost.
- The 12-word recovery phrase rebuilds the Bitcoin key material but does not decrypt those secrets.
- Packages already fully signed stay usable under their own conditions.
- Recovery codes, passkeys, and delegated or social recovery are deferred (p7).
- The document does not spell out the consequences. My inference: a lost X means the loan cannot be activated, and a lost Y leads to the "lender never reveals Y" case.

**Confusing points, terms used before explanation, and what I expected but did not find**
- **Terms used but never defined, or explained only later:**
  - "Vault" appears on p1 and is never defined; its parts (seed, origin, isolated worker, password, backup) emerge only gradually.
  - "Base", "finality on Base", "Base exclusivity" (p5) and "claim window" (p5) are not explained.
  - "funding window", "qualification" and "receipt" are not explained. "A receipt is never an input to the signing that produced it" (p3) is cryptic.
  - "terminal signing pending" and "terminal-construction" are used without defining "terminal".
  - "the current eligible package" (p5) is not explained.
  - "hardened child key" (p6) is not explained.
- **Unclear specifics:**
  - What "one fallback case" for S means, and how S is triggered or published.
  - Whether the roughly 72-hour relative timelock is measured in blocks or in MTP.
  - Why the margins are 67 and 19 hours.
  - "If X is not accepted on Base" (p4) is odd wording, since X is revealed and it is the borrower who accepts.
  - Fee-estimate source "Validation Cloud" is easy to confuse with the "independent validation service".
  - The refund can "nonetheless" confirm first even though the application may not refund. The document does not say who could broadcast it.
- **Internal conflict:** twelve versus eighteen exit packages (p3, p7). The guide follows eighteen.
- **Expected but missing:**
  - Who broadcasts the long-stop and the S-completed recovery.
  - The lengths of the funding window and the claim window, and how D is set.
  - The lender's confirmation steps when revealing Y.
  - Who bears the Bitcoin fees (whether they come out of the collateral).
  - A named lifecycle state for the period between X going public and the escrow confirming.
  - Handling of reorganizations deeper than six confirmations.
  - Many details are deferred to "the records" and the architecture guide, which were not available to me.
