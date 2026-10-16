I read the whole PDF, all 10 pages, and nothing else. Reading with the `pages` parameter failed because pdftoppm is not installed, so I read the file in one call without it. The text of every page came through.

## Answers

**1. When can a Base event move a loan forward or start a Bitcoin action?**
Only after the block holding the event reaches Base L1 finality, which Base says takes roughly 20 minutes. Two other conditions also apply:
- The observer must already have checked the event's chain, contract deployment, interface definition and loan binding against the pinned expected values.
- The application must have stored the finalized observation durably, which the document calls "acknowledged".

Before finality the event is only "observed" or "safe". The application may show it, labeled as awaiting finality, but it creates no final lifecycle step, no automatic Bitcoin action and no economic completion. After that, the application updates the loan, and the Bitcoin side may finalize only the matching pre-signed transaction. No new consequential action happens while both Base providers are down or disagree. Funding or repayment of a loan is set only by the named contract event at L1 finality. A plain token transfer between participants never moves the loan forward.
- Pages: 2, 3, 4, 5, 8.
- Confidence: high.
- One gap: Figure 1 says the event "may now drive consequential action" at the L1-finalized step, but its caption says action "waits for the final step" (Acted on). I read this as finality being the trigger and acknowledgement having to come first, but the wording is not fully clear.

**2. How many sources must work before a Base event is trusted, and how does that compare with Bitcoin?**
- **Base:** one healthy provider is enough to report a finalized fact. On Base Mainnet and Base Sepolia there are two independently operated providers, Alchemy as primary and QuickNode as fallback. The second one is for failover and periodic cross-checks, not a second approval for every action. If two healthy providers disagree, new Base-dependent actions stop. The local demonstration uses one local Base node.
- **Bitcoin:** the rule is stricter. Steps that depend on Bitcoin need fresh agreement between two sources read in parallel:
  - production mainnet: Blockstream and Validation Cloud;
  - Signet test network: Blockstream and Mempool;
  - local demonstration: separate Bitcoin Core nodes.
  A conflict or an outage blocks the dependent automation.
- Pages: 4, 9.
- Confidence: high for this comparison.
- Caveat: page 5 says a public profile with two separately operated Base providers plus the observer is "deferred", and that only the local profile is selected now. That seems to contradict page 4. It may apply only to Vault payment evidence, but the document does not say.

**3. What does the application show, and allow, when both Base providers fail or disagree?**
- Facts that were already finalized stay visible.
- New Base data shows as delayed during an outage.
- Operations staff are alerted after five minutes.
- No new consequential action that depends on Base goes ahead.
- When a source recovers, the observer replays every missed event from its cursor before normal processing resumes.
- An outage never rewrites, rolls back or finalizes a loan on its own.

If the whole cloud provider goes down, Base and Bitcoin are replayed and reconciled before queued work resumes.
- Pages: 4.
- Confidence: high for what is listed.
- Partly answered: the document does not say what participants see in the disagreement case ("delayed" is stated only for outages). It also does not say which user actions stay available, such as whether a participant can still submit a transaction.

**4. What can a staff operator do if they believe an observed fact is wrong?**
An authorized operator can only ask for a recheck through the application. They cannot call the observer directly, edit source records, move the cursor forward or override the result. A manual note never becomes a chain fact, and nobody, including the company, may override a fact.
- Pages: 4, 8.
- Confidence: high.
- Not answered: what a recheck actually does, how its result is reported, and whether there is any escalation beyond it. I also assumed "authorized operator" means a staff operator.

**5. What must already be true when a loan is created for the fallback to ever help it?**
- The fallback must already be activated for production. That needs counsel approval and implementation evidence; a resolved design question is not enough.
- The loan must be built with that capability. The fallback service (the ECVS) must have generated a unique random 32-byte secret S for the loan, and returned only its hash H(S) before the loan's Bitcoin escrow was built and signed.
- H(S) must be written into the loan and into the Bitcoin recovery script.
- The borrower's pre-signed recovery transaction must exist, because S completes that transaction.

An existing loan without H(S) can never gain the capability later. Today the fallback is selected but not activated, so no loan has it and a loan created now has no S route.
- Pages: 1, 6, 7, 9.
- Confidence: high.

**6. What lets the fallback service release its secret, and what does it check on its own?**
The only trigger is the exact unclaimed-repayment refund event for that loan reaching L1 finality. That refund is possible only after the cutoff C. These can never trigger release:
- missing Y;
- elapsed time;
- a claim by the application;
- a raw token transfer;
- the earlier repayment event.

Wrong, early, unfinalized, cross-loan or unverifiable evidence fails closed. The ECVS does not take the application's or the observer's word for the refund. It checks the public chain itself:
- the configured chain, deployment and current contract implementation;
- the event signature;
- the loan, the transaction and the log;
- that the block is canonical and has reached L1 finality;
- the exact debt and the frozen refund recipient.

Only then may it publish S, durably and publicly, with evidence tying it to that loan and event. No one can order an early release.
- Pages: 2, 7, 8.
- Confidence: high.
- Not stated: which data sources the ECVS itself uses to read the chain.

**7. After S is published, what still has to happen before the borrower has the Bitcoin back?**
1. The Bitcoin Authorization And Recovery domain runs its own checks: the activation gate, the binding between the publication and the event, the matching hash, the stored recovery transaction and its signature, the fixed outputs, and that the escrow is still unspent.
2. It places S into the same recovery transaction the borrower already signed. No new signature, second transaction, service key or new destination is involved.
3. The transaction is broadcast.
4. The transaction confirms on Bitcoin. Only then is the Bitcoin recovered.

Publication, broadcast and confirmation are three separate steps. Until the S recovery confirms, the collateral is still exposed to the lender's default route, which becomes valid at D + 3 days (D is the repayment deadline). Confirming a recovery also needs the two Bitcoin sources to agree.
- Pages: 4, 6, 7, 8.
- Confidence: high on the sequence, medium on the details.
- Not stated: who broadcasts and pays fees, and how many confirmations count as "confirms".

**8. If the fallback service is unreachable or never publishes, what remains true for each party?**
- **General:** the Base refund still stands complete, and recovery through S is simply unavailable. An outage or interruption can be fixed later by verifying and publishing again with the same S. An empty or unreachable lookup is not proof that S was deliberately withheld. Loss, compromise or withholding goes through a "defined incident path", which the document does not describe. There is no discretionary release by the company, and a lost or compromised S cannot be replaced in the existing escrow.
- **Borrower:** the repayment USDC came back once to the frozen recipient. The Bitcoin is still unspent. In newly built escrows, a borrower long-stop route becomes valid at D + 10 days, needs neither Y nor S, and pays the borrower's fixed destination. It does not cancel the lender's route; from then on both are valid and whichever confirms first wins. The borrower can also agree a cooperative settlement with the lender, signed by both.
- **Lender:** the lender's claim was permanently disabled at C, and claim and refund cannot both happen, so the lender cannot also collect the repayment. The lender's pre-signed default route becomes valid at D + 3 days and pays the lender's fixed destination. The system does not broadcast it; the lender may export it and broadcast it by hand.
- **Company and fallback service:** neither holds a collateral key or has any power to sell or pay out. The ECVS cannot carry out or block the refund.
- **Timing:** these routes follow Bitcoin's own clock (median time past), not Base or application time.

The document records all this as an accepted residual risk: valid repayment is not default, but the collateral stays exposed to the lender's route.
- Pages: 6, 7, 8, 9.
- Confidence: high.
- Partly answered: the incident path is not described, and it is unclear whether escrows that are not "newly built" have the long-stop route.

## Confusing points, terms used before they are explained, and gaps

**Confusing**
- Page 5's statement that the public two-provider profile is deferred conflicts with page 4, which describes Alchemy and QuickNode on the public networks.
- The Figure 1 caption ("waits for the final step") does not make clear whether action waits for L1 finality or for the "Acted on" step.
- The timeline is never put side by side. The refund is only possible after C (D + 2 days), the ECVS also has to wait for L1 finality, and the lender's route matures at D + 3 days. That suggests about one day for S recovery to win the race, but the document never says so.
- "In every newly built escrow" implies some escrows lack the borrower long-stop route, but this is not explained.
- The "Choices" section refers to "the user" and "the agent" without saying who they are.

**Terms used without explanation**
- "Vault", "Vault payment account" and "Vault password" (Vault itself is never explained).
- "prefund", "activation" and "pre-signed activation".
- "Bitcoin package" and "package storage".
- "fixed-effect refund".
- "committed protocol account".
- "proxy address" and "interface definition".
- "activation gate", used before the box that explains it.
- "eligible loan".
- The hash function behind H(S) is not named.

**Expected but not found**
- The incident path for a lost, compromised or withheld S.
- What a recheck produces and how operators see the result.
- How the ECVS reads the chain and how it is contracted.
- Who broadcasts the S recovery transaction and who pays its fees.
- How many Bitcoin confirmations are required.
- What participants see when Base sources disagree, when Bitcoin sources disagree, or when the fallback is unavailable.
- Any description of the other four domains beyond their names.
