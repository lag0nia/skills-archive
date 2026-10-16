**Note on method:** Reading with the `pages` parameter failed because pdftoppm is not installed. I read the PDF with the same Read tool without `pages`, and that returned all 10 pages (text and page images). I opened no other file and ran no commands. In the answers, "workforce operator" is the document's term for the staff operator in Q4.

---

**1. When can a Base event move a loan forward or start a Bitcoin action?**
Only when it reaches **Finalized** status, which means Base layer-1 finality. An event can have four statuses:
- **Observed:** display only.
- **Safe:** batched to Ethereum. Display only.
- **Finalized:** the only status that "may drive application lifecycle changes and handoffs to Bitcoin."
- **Noncanonical:** kept as audit evidence only.

No lifecycle step, Bitcoin action or economic completion follows from an observed or safe event. Base describes finality as taking about 20 minutes, but that figure is not guaranteed.

Before acting, the event must also:
- be one of the named contract action events, not a snapshot, raw transfer or balance;
- match the approved chain, contract, implementation, loan and block;
- be stored by the application. The cursor advances only after storage, and the loan status is then recomputed from the recorded history.

Two related points:
- New Base-dependent actions stop while the providers disagree or are both down.
- Anyone can still call a public contract function directly at any time. The product just shows the result as provisional until finality.

Pages 2, 3, 4. **Confidence: high.**

**2. How many sources must work for a Base event, compared with Bitcoin evidence?**
- **Base:** one healthy source is enough, as long as it independently meets the finality rule. The sources are Alchemy (primary) and QuickNode (fallback). The second source is for failover and for spotting disagreement, "not as a second signature on every action." If both are healthy and disagree, new actions stop (p3–4, p8–9).
- **Bitcoin:** stricter. A Bitcoin lifecycle gate needs fresh agreement between the configured observers. That means two independent providers on each public network, or two separately connected nodes in the local demonstration. A conflict or outage blocks automation and is retried every minute. It escalates after 5 minutes or one missed block, and becomes critical at once if the borrower has already disclosed X (p4).
- **Payments from a participant's Vault** are a third case. In "public profiles" the check uses two separately operated Base providers plus the observer. The document does not say whether they must agree (p4).

**Confidence: high** for Base and Bitcoin. **Medium** for the Vault payment check.

**3. What the application shows and allows when both Base providers fail or disagree**
- **Disagree:** existing finalized statuses stay visible, and new Base-dependent actions with consequences stop. The operations team is alerted until a replay of canonical history resolves the conflict. No majority guess or manual override is allowed.
- **Both unavailable:**
  - Finalized statuses remain visible and fresh Base data is shown as delayed.
  - The operations team is alerted after 5 minutes, and nothing new that depends on Base proceeds.
  - When a source returns, the observer replays every missed event from its cursor before resuming.
- An outage is never itself a chain or lifecycle fact. Provider health feeds an internal health signal and is not exposed publicly.
- Things that still work:
  - Participants can still call contract functions directly; the results show as provisional (p2).
  - The permissionless refund cannot be blocked (p8).
  - An authorized operator can ask for a recheck (p4).

Pages 2, 3–4, 8. **Confidence: high** on the rules. **The document only partly answers this.** It does not describe the actual screens, wording or which buttons are disabled. For disagreement, it gives no alert delay.

**4. What a staff operator can do if they think an observed fact is wrong**
Very little. An operator with the required authorization may ask the application to recheck a loan. They cannot:
- call the observer directly;
- edit recorded observations;
- move the cursor;
- override the resulting fact.

Elsewhere the document repeats that no one may let an operator override a fact (p8), that disagreements cannot be settled by manual override (p4), and that an operator's assertion cannot trigger the release of S (p6).

Pages 4, 6, 8. **Confidence: high** on the limits. **Not answered:** what a recheck actually does, what happens if it confirms the operator's doubt, and who holds the "required authorization." The page 10 record "Workforce Operator Authorization And Immutable Audit" is named but not explained.

**5. What must be true at loan creation for the fallback to ever help**
- The loan must be "built with the activated fallback." That requires:
  - The fallback's production-activation gate must be met: legal counsel's approval plus implementation evidence (p8–9).
  - The ECVS must have generated a unique S for this eligible loan and returned H(S) (p6).
  - H(S) must be committed **before the escrow is built and before the borrower signs anything**, because the Bitcoin recovery script contains it (p6).
  - The borrower must have pre-signed each fixed fee variant of the recovery transaction (p6).
- An escrow committed only to Y can never gain the fallback later, and a lost or compromised S cannot be swapped in (p6).
- The fallback is not yet available. Until the gate is met, no new loan may commit H(S), so today no loan has it (p9).

Pages 5, 6, 8, 9. **Confidence: high.** **Not answered:** the document never says what makes a loan "eligible."

**6. What lets the fallback service release S, and what it checks itself**
- **Trigger:** only the loan's canonical, finalized `UnclaimedRepaymentRefunded` event. That event can exist only after the claim cutoff C, which is D plus 172,800 seconds (two days), once someone calls the refund.
- **What the service checks itself:**
  - the configured chain;
  - the contract deployment and current implementation;
  - the event signature;
  - the loan, block, transaction and log;
  - that the block is canonical and final;
  - the exact debt and the frozen recipient.
- **What it does not rely on:**
  - It does not take the application observer's word. The observer may pass a public reference to the event, but not the conclusion.
  - Nothing else can substitute: not the earlier repayment event (the lender could still claim then), a missing Y, time passing, a token balance or transfer, an operator's assertion, or an application status.
  - No one can order an early release.

Pages 5, 6, 9. **Confidence: high.** **Not answered:** how the ECVS reads Base (its own providers? how many?), and whether it checks that the fallback is activated for the loan. On p7 that activation check is described only for the Bitcoin finalizer.

**7. After S is published, what still has to happen before the borrower has the Bitcoin back**
"Publication is not recovery." The remaining steps are:
1. Someone looks up the publication and authenticates it by checking that its hash equals H(S). The answer can be: none yet, valid, invalid or mismatched, or source unavailable.
2. The Bitcoin finalizer in the Bitcoin Authorization And Recovery domain checks:
   - that the fallback was activated for this loan;
   - the publication, its event binding and its hash;
   - the retained recovery transaction and the borrower's signature;
   - the fixed outputs;
   - that the escrow is still unspent.
3. The finalizer inserts S, picks one of the already-signed fee variants and submits the transaction. No new signature or destination is allowed.
4. Recovery is final only when independent Bitcoin observation confirms the spend. A published S, a broadcast transaction and a confirmed recovery are "three separate facts."
5. The spend must also confirm before any competing route, because the first confirmed spend wins.

Pages 6, 7, 8 (and p4 for the Bitcoin observation rules). **Confidence: high** on the steps. **Partly answered:** the document does not say who runs or triggers the finalizer, or how many confirmations count as "confirmed."

My own inference, not stated in the document: the refund is possible from D+2 days and the lender's route opens after D+3 days. So refund finality, ECVS publication and Bitcoin confirmation must all fit in roughly a one-day window. The document does not discuss whether that is enough time.

**8. If the fallback service is unreachable or never publishes**
- **In general:**
  - An empty or unreachable answer is not proof that S was withheld.
  - Outages are handled by verifying again and replaying the publication, always with the same S.
  - Loss, compromise or deliberate withholding of S follows a "defined incident path." There is no discretionary company release and no replacement secret (p6–7).
- **Borrower:**
  - The Base refund stays complete, so they have their USDC back, but the Bitcoin stays unspent in escrow.
  - They can use the long-stop strictly after D + 864,000 seconds (10 days, measured by Bitcoin's median time past, MTP).
  - They can also use cooperative settlement with the lender at any time before another spend confirms. However, cooperative settlement is not yet an operational product capability (p6–8).
- **Lender:**
  - Their USDC claim has been disabled forever since C, so they get no repayment.
  - Their pre-signed timelocked route, which they export and broadcast themselves, is valid strictly after D + 259,200 seconds (3 days).
  - The long-stop does not cancel this route, and whichever spend confirms first wins.
  - So the lender can take the collateral even though the borrower repaid. This is the stated "residual risk," with a one-week window before the long-stop matures. It is not evidence of borrower default (p7–8).
- **Company:** no collateral key, no sale or payout power, does not broadcast the lender's default transaction, and cannot release or replace S (p8–9).

Pages 6, 7, 8, 9. **Confidence: high.** **Not answered:** what the "defined incident path" contains.

---

**Confusing points, terms used before explanation, and gaps**
- **Undefined or late-defined terms:**
  - "Vault" and "lost their Vault password" (p4–5), and whether that Vault differs from the "repayment vault" (p5).
  - Secret X (p2): its role is never explained, although Y and S are.
  - "escrow" (p5) is never defined.
  - "committed protocol account" and "original refund recipient" (p5).
  - "funding window," "expiries" and "sweeps" (p2).
  - "public profiles" vs "local demonstration" (p4).
  - "fixed fee variant" (p6).
  - "eligible loan" (p6).
  - "production-activation gate" (p8) is only explained on p9.
  - The timelock figures in the p7 table come before MTP is explained on p8.
- **Possible inconsistency:** the "one healthy provider is enough" rule for Base vs "two separately operated Base providers plus the observer" for Vault payments.
- **Unclear Y route after the cutoff:** the lender's claim, which is what discloses Y, is disabled at C. Yet the p7 table still lists "normal recovery with Y" without saying whether that route is dead after C.
- **Unclear actor names:** whether "Bitcoin operations" (p5) is the same as the finalizer in the Bitcoin Authorization And Recovery domain (p7). Also how the "operations team" relates to the "workforce operator."
- **Things I expected but did not find:**
  - who actually calls the permissionless refund, and whether it happens automatically;
  - how the ECVS reads Base, and what happens when its own sources fail;
  - where S is published, and any availability commitment for the service;
  - the Bitcoin confirmation depth;
  - what the S incident path does;
  - what an operator recheck does;
  - the alert timing for provider disagreement;
  - the names of the other three of the "five domains."
- **Minor:** "Scope boundarys" typo on p10. Many records are cited by name ("the observation state record," "the publication contract") without their content, which this guide leaves to separate documents.
