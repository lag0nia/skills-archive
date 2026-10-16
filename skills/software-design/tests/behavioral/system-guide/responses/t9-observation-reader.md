Method note: the PDF is 5 pages. Reading it with the `pages` parameter failed because pdftoppm is not installed, so I read it in one call without `pages`. That call returned the full text and page images for all 5 pages. I opened no other file and ran no commands.

## Answers

**1. When can a Base event move a loan forward or start a Bitcoin action?**
Only after the block containing the event reaches **Base L1 finality**. The document defines that as the point where the batch containing the block, posted to Ethereum, is older than two Ethereum epochs.
- Before that, an event is only "observed", then "safe". "Safe" is progress information only.
- It must also be the named contract event, checked for chain, contract deployment, loan, transaction and block. A raw token transfer, a balance, or a Vault payment account transaction can never establish loan funding or repayment.
- The expected wait is roughly 20 minutes, according to Base's documentation, but this is not a promise of an exact time.
Pages 1–2, 4. Confidence: high.

**2. How many data sources must work, and how does that compare with Bitcoin?**
- **Base:** one healthy provider is enough, if it independently satisfies the finality rule. Alchemy is the primary provider and QuickNode the fallback. The second provider gives failover and detects disagreement.
- **Bitcoin:** the rule is stricter. Lifecycle gates need fresh agreement between the configured independent observers. The document does not say how many observers there are.
- **Open point:** the document says a provider security record states that no one source may become authoritative chain state. It explicitly calls the fit with the one-provider rule open.
Pages 2, 5. Confidence: high on the rule as stated; the document itself leaves the reconciliation open.

**3. What happens when both Base providers fail or disagree?**
- Status that is already final stays visible.
- New consequential actions that depend on Base are blocked.

The document does not say what the user-facing screen looks like, which actions count as "consequential", or what non-consequential actions stay allowed. It also gives no message wording or recovery procedure for a Base outage. For Bitcoin, conflicts and outages block dependent automation, and a failure after loan acceptance is immediately critical; this is not stated for Base.
Pages 2, 5. Confidence: high on the stated rule. The answer is partial on what is shown and allowed.

**4. What can a staff operator do if they think an observed fact is wrong?**
- An authorized operator may only request a recheck, and only through the application, never by calling the observer directly.
- They cannot change the fact, override the result or move the observer's cursor.

The document does not explain what a recheck does, who counts as "authorized", or what follows if the recheck agrees with the operator.
Page 2 (reinforced by the authority boundaries on page 4). Confidence: high.

**5. What must already be true at loan creation for the fallback to ever help that loan?**
- The loan must be created with the activated capability.
- The ECVS must have generated S and returned H(S) before the loan's Bitcoin transactions are built and signed, and the recovery script must contain that commitment.
- Production use is gated by counsel approval and implementation evidence. Until that gate is met, new loans must not commit H(S) or present the fallback as available. The gate is currently not activated.
- An existing escrow built with Y only cannot gain the capability later.
- A lost or compromised S cannot be swapped into an existing commitment.

"Eligible loan" is used but never defined beyond this.
Pages 3–5. Confidence: high.

**6. What lets the service release its secret, and what does it check itself?**
- **Trigger:** only the exact UnclaimedRepaymentRefunded refund event, conforming and at Base L1 finality.
- **What does not trigger it:** a missing Y, elapsed time, an application assertion, a raw token transfer, or the earlier repayment event.
- **What it checks itself:** it does not accept the application observer's conclusion as authority. It independently checks the configured Base deployment, the loan, the exact refund event, the amount, the frozen recipient, provenance and L1 finality. Only then may it publish the matching S durably and publicly.

The document does not say what data sources the service itself uses.
Pages 3–4. Confidence: high.

**7. After S is published, what still has to happen before the borrower has the Bitcoin back?**
1. Bitcoin finalization separately checks the publication, the commitment, the existing signatures, and that the escrow is still unspent.
2. It then uses S in the same recovery transaction the borrower signed in advance, to a fixed destination. No new signature, key or destination is involved.
3. That transaction must be broadcast.
4. It must then be confirmed. Publication, broadcast and confirmed recovery are three separate steps, and recovery is final only when confirmed.

Until the S recovery confirms, competing routes can still win: the lender's pre-signed route (matures 3 days after D), the borrower long-stop (matures 10 days after D, if it exists), and mutual cooperation. Whichever confirms first wins, so return is not guaranteed.

The document does not say who broadcasts, beyond "Bitcoin operations", or any timing or fees for confirmation.
Pages 3–4. Confidence: high on the steps; medium on whether the long-stop applies (see question 8).

**8. If the service is unreachable or never publishes, what remains true for each party?**
- **Borrower's USDC:** the Base refund stays complete and never waits for the service. It goes to the frozen refund address and happened exactly once.
- **Lender:** their claim was permanently disabled at C, which is two days (172,800 seconds) after D. Their pre-signed Bitcoin route still matures 3 days after D.
- **Borrower's Bitcoin:** the collateral stays unspent until some route confirms. The borrower may have a long-stop route maturing 10 days after D, without Y or S, which does not cancel the lender's route; first to confirm wins.
- **Both parties:** mutual cooperation is another route.
- **If the service is only interrupted:** publication can be recovered later through independent verification and public replay of the same committed S.
- **If the evidence is wrong:** S is not published and recovery through S is unavailable.
- **The organization:** there is no company release or replacement secret, and it has no collateral key, sale authority or discretionary payout power.
- **Withholding, loss or compromise of S:** these have a "defined incident path", but the document does not describe it.
- **How to read the outcome:** these are residual Bitcoin risks. They are not evidence of borrower default, and the collateral is not guaranteed to return.

The big caveat: the document itself says the long-stop's place is inconsistent. Some records include it. Others omit it, and one security record says a loan without the fallback secret has no borrower fallback Bitcoin route. It leaves this open. So whether the borrower has an independent Bitcoin route is uncertain.
Pages 2–5. Confidence: high on the refund, lender route and organization limits; low to medium on the borrower long-stop.

## Confusing points, terms used before explanation, and gaps

**Confusing:**
- The document calls the long-stop inconsistency (page 4) and the one-provider versus "no one source authoritative" conflict (pages 2, 5) open, but gives no resolution, owner or deadline for either.
- "Lender's pre-signed Bitcoin route" (page 4) is never explained. I could not tell what it does, or whether it means the lender takes the collateral after valid repayment.
- "Two days after D" for C on Base versus "three days after D under Bitcoin's consensus time rules" for the lender's route mix two clocks with no explanation.
- The domain name "Fallback Review" does not match its content, which describes no review process.

**Used before being explained, or never explained:**
- "Base", "Base L1 finality" and "safe": used on page 1, defined on page 2. "Safe" is never defined.
- "Two Ethereum epochs": not explained.
- "Secret Y" and "claim cutoff": Y is first introduced on page 2 with little context. Who generates it and how the lender holds it is not said.
- "Vault payment account", "payment intents", "durable cursor" (explained briefly), "versioned ingestion hand-off", "provenance", "committed protocol address", "escrow", "recovery script", "long-stop": none are really explained.
- "Eligible loan" and "activated capability": not defined.
- The repayment deadline D: introduced without explaining how it is set.

**Expected but missing:**
- What the participant actually sees in the application during outages, disagreements or rechecks.
- The incident path for S loss, compromise or withholding, and the "boundary" for early disclosure.
- Who the ECVS operator is, and its availability expectations.
- How many Bitcoin observers there are.
- What a recheck actually does.
- How operators are authorized.
- Timing for reorganization detection.
- What "consequential actions" covers.
- Fees and who broadcasts the S recovery.
- Many details are deferred to the architecture guide and technical records, which I was not allowed to open.
