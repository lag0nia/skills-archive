Answers from "Base Observation And Fallback Review" (domain guide, 6 pages, generated 15 October 2026)

How I read it: I read all 6 pages and opened nothing else. Reading with the `pages` parameter failed because pdftoppm isn't installed, so I read the file without that parameter. The PDF has only 6 pages, so the whole document came through.

**1. At what point can an event seen on Base move a loan forward or start a Bitcoin action?**
Only once its block reaches **Base L1 finality**, meaning the block's data is final on Ethereum. Base puts that at roughly 20 minutes. At that point the event becomes a "lifecycle fact". The worked example is a lender's claim: only then may the application treat Y as public and the Bitcoin automation complete the borrower's recovery. The same rule covers funding, acceptance, repayment and refund.
- The earlier stages are progress information only. "Observed" means the event first appears in a block, and "safe" means its batch is posted. The app may show an observed event labelled as awaiting finality.
- Before that, the observer must confirm which chain, contract deployment, loan, transaction and block produced the event.
- The event is passed to the application through a "versioned ingestion handoff". The application stores the evidence and acknowledges it, and only then does the observer advance its cursor.
- For payments, only the named finalized contract event establishes funding or repayment. A raw transfer never moves the loan forward.
- The 20 minutes is not a promise of an exact waiting time.
- One gap: the document says the observer "does not create the fact" or approve its consequence, but it never says who does.

Pages 1, 2, 3, 4. Confidence: high.

**2. How many data sources must work before a Base event is trusted, and how does that compare with Bitcoin evidence?**
- **Base:** one healthy configured provider is enough for a finalized fact. Alchemy is the primary and QuickNode the fallback. The second provider gives failover and lets disagreement be detected. The document states plainly that two simultaneous responses are not required for every loan action.
- **Bitcoin:** the rule is stricter. Bitcoin lifecycle gates need "fresh agreement between independent configured sources", not just one healthy source. The document never says how many Bitcoin sources there are or how many must agree.
- **Exception:** confirming payments from Vault payment accounts in public use would need two separately run Base providers plus the independent observer. That public setup is deferred, and only a local demonstration setup (one local chain plus the observer) is defined.

Pages 2, 5. Confidence: high on the Base-versus-Bitcoin comparison; medium on Bitcoin, because no number is given.

**3. What does the application show, and what does it allow, when both Base providers fail or disagree?**
- **Shown:** existing finalized views stay visible, and fresh Base data is marked as delayed.
- **Alerting:** operations staff are alerted after five minutes.
- **Blocked:** new consequential actions that depend on Base.

The document does not list what remains allowed, beyond viewing what was already finalized. It does not define "consequential", and it does not say what a participant can still do.

Page 3. Confidence: high for what is shown and blocked; low for what is allowed, since it is only implied.

**4. What can a staff operator do if they believe an observed fact is wrong?**
They can only ask for a recheck through the application. They cannot change a fact, override a result or advance the cursor. The observer itself also does not edit application status. The document doesn't explain what a recheck does, who handles it, or what happens if the recheck finds the fact is wrong. The only correction mechanism described is the automatic one for reorganizations: the earlier observation is kept as noncanonical evidence, a correction is appended, and the observer replays from the last common finalized block.

Pages 2, 3, 4. Confidence: high on the limits; the follow-up process is not answered.

**5. What must already be true when a loan is created for the fallback service ever to help that loan?**
- The loan must be created after the fallback's activation gate is passed, which requires counsel approval and implementation evidence. The figure says "only for a loan created after activation".
- The service must have generated a unique random S for that loan and returned only its hash before the loan was built.
- That hash must be committed into the Bitcoin recovery script.
- The borrower's recovery transaction is already signed; S only completes it later.
- Until the gate is passed, new loans must not commit the hash or advertise the fallback. A loan created without the hash can never gain the fallback later.
- The loan must also be "eligible", but the document never defines eligibility or says whether it means anything beyond "created after activation".

Pages 1, 3, 4, 5. Confidence: high, except medium on what "eligible" covers.

**6. What lets the fallback service release its secret, and what does the service check on its own?**
The only trigger is one exact refund event that has reached Base L1 finality. The service checks this itself and does not trust the application observer's conclusion.
- **What it checks:** the configured deployment, the loan, the exact refund event, the amount, the frozen recipient, provenance, and L1 finality.
- **What can never trigger release:** missing Y, elapsed time, an application assertion, a raw token transfer, or the earlier repayment event.
- **Who cannot force it:** the company, the borrower and the lender never receive an unrevealed S and cannot order an early release.
- **What follows:** if every check passes, it publishes S "durably and publicly".

The document doesn't say where S is published, what data sources the service uses for Base, or what "provenance" means.

Pages 2, 3, 4. Confidence: high.

**7. After S is published, what still has to happen before the borrower has the Bitcoin back?**
1. The Bitcoin automation separately checks the published S against the committed hash, the existing signatures, and the escrow, which must still be unspent.
2. It puts S into the same borrower-signed recovery transaction that could have used Y. No new signature, signing key or destination is involved.
3. It broadcasts the transaction.
4. The transaction must confirm on Bitcoin.

The document stresses that publication, broadcast and confirmed recovery are three separate steps. Page 5 adds that the lender's signed recovery becomes valid three days after D (the repayment deadline) and that "one confirmed spend wins".

My inference, not stated in the document: the claim cutoff C is two days after D. That would leave about one day for the refund, finality, publication, broadcast and confirmation before the lender's route becomes valid and could compete.

The document doesn't say who runs the automation, how many confirmations count as "confirmed", how fees work, or what happens if the broadcast stalls.

Pages 3, 4, 5. Confidence: high for the steps; medium for the timing inference.

**8. If the fallback service is unreachable or never publishes, what remains true for each party?**
- **Borrower:** the Base refund of the repayment is still complete, paid to the frozen refund recipient. Bitcoin recovery through S is unavailable. A borrower "long-stop" becomes valid ten days after D without Y or S, but it does not cancel the lender's route. Mutual cooperation is named as another, separately authorized route. The document is explicit that this is not evidence of borrower default and not a guarantee that the collateral comes back.
- **Lender:** the USDC claim was permanently disabled at C. The lender's signed recovery can still become valid three days after D under Bitcoin consensus time, and one confirmed spend wins. The document never says where the lender's recovery sends the Bitcoin. The page-6 record title "Missing Y Residual Lender Risk" suggests this is a known residual risk, but the document gives no detail.
- **Company:** it has no collateral key, no sale authority and no discretionary payout power. Automatic company broadcast of lender recovery and institutional last-resort collateral recovery are both deferred and outside this design.
- **Service:** it holds no Bitcoin key and cannot sign, so it cannot help any other way.

Page 5, plus pages 3 and 4. Confidence: medium. The facts are stated, but the document never lays them out party by party or explains the lender's recovery.

**Confusing points, terms used before explanation, and gaps**

Terms used too early or never explained:
- **Y** is used on page 2 ("treat Y as public") but only explained on page 3, as what the lender reveals to claim the USDC.
- **X** ("public X, Y or S", page 2) is never explained.
- **"Activation"** appears in the page 4 figure before the activation gate is described on page 5.
- **"Eligible loan"** (pages 1 and 3) is never defined.
- **Never defined:** "Vault payment account", "fixed-effect refund", "committed protocol address", "provenance", "noncanonical evidence", "consequential action", "Bitcoin's consensus time", "borrower long-stop", "lender's signed recovery", and "mutual cooperation route".
- **Event names** such as "funding window opened", "sweeps and expiries" and "refund-recipient switch" are listed but not explained.
- **Who runs the "Bitcoin automation"** is never stated.

Apparent contradictions:
- Page 2 says the claim "becomes a lifecycle fact" at finality, but page 4 says the observer "does not create the fact". It is unclear who does.
- "One healthy provider suffices" sits awkwardly with "if both providers … disagree, actions are blocked". The document doesn't say how a disagreement is settled or what "healthy" means.
- Page 3 describes payment probing at 0, 15 and 60 seconds as if it is live, but page 5 says the public payment setup is deferred and only the local demonstration is defined.

Things I expected but did not find:
- Where and how S is published, and how S is stored and destroyed (only "protected retention" is mentioned).
- What happens to S if a loan ends normally.
- How the service gets its own Base data.
- How a recheck works.
- What happens if nobody calls the refund at C.
- How many Bitcoin sources must agree.
- Any guaranteed timing between C and the lender's route at three days after D.
- Who the contracted service operator is.
- What the "Missing Y Residual Lender Risk" record actually says.
- The detailed rules, which page 6 says live in separate records I was not allowed to open.
