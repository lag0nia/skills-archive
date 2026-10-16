Note on method: reading with the `pages` parameter failed because pdftoppm is not installed. Reading the file without that parameter returned all 10 pages, with text and page images, so I read the whole document. I opened nothing else.

## Answers

**1. When can a Base event move a loan forward or start a Bitcoin action?**
Only after the event's block reaches Base L1 finality, which the document puts at roughly 20 minutes. Before that, the observer checks where the event came from: chain, contract deployment, loan, transaction, block and log position. The application then records the event as pending.
- "Observed" (seen in a Base block) and "Safe" (batched to Ethereum) are shown only as progress, labelled as awaiting finality.
- Once final, the application stores the final observation, the observer moves its cursor forward, and the workspace acts, for example by offering the lender the claim.
- The same rule covers every consequential step: funding becoming available for acceptance, X becoming public and the collateral activating, repayment counting as complete, normal recovery after Y, and expiry or refund counting as the final outcome.
- For Bitcoin, a final YReleased event lets the observer pass the public Y and its source details to Bitcoin finalization. That step can only complete transactions the participants signed in advance. Recovery is complete only when independent Bitcoin sources agree the spend has confirmed.
- An event later removed by a chain reorganization becomes noncanonical and is kept only as audit evidence.
- Pages 1–3, 8. Confidence: high.

**2. How many sources for a Base event, compared with Bitcoin?**
- **Base:** one healthy provider is enough to report a final fact. Alchemy is the primary and QuickNode the independent fallback. The second provider is for failover and periodic cross-checks, not a second required confirmation. If the primary fails, the observer retries with increasing delay, capped at one minute, then switches to the fallback automatically.
- **Bitcoin:** the rule is stricter. A Bitcoin gate needs fresh agreement between two configured sources:
  - mainnet: Blockstream and Validation Cloud;
  - Signet: Blockstream and Mempool;
  - local: separate Bitcoin Core nodes.
- Pages 3, 4, 8. Confidence: high.
- Gaps: the document does not say how often the cross-checks run or what makes a provider "healthy".

**3. What the application shows and allows when both Base providers fail or disagree.**
- Existing final projections stay visible.
- Every new consequential action that depends on Base stops.
- Operations are alerted after five minutes.
- When a source recovers, the observer replays missed events from its cursor and applies the correction rules before normal processing resumes.
- An outage never rewrites, rolls back or finalizes a loan.
- Pages 3, 8. Confidence: high on the above.
- Partly answered: the document does not describe what participants actually see on screen during the outage (any banner or status), or what happens to events that were pending when it started.

**4. What a staff operator can do if they think an observed fact is wrong.**
- An authorized workforce operator may only ask the application to recheck the fact.
- They cannot call the observer directly, edit source records, advance the cursor or override the result.
- The observer must not accept a manual override, and the fallback service ignores an operator's assertion.
- Corrections come only from the observer's own rules, such as marking a reorganized event noncanonical and replaying history. No fact is edited by hand.
- Pages 4, 6, 8. Confidence: high.
- Partly answered: the document does not say what a recheck actually does, what happens when it confirms a discrepancy, or how to escalate if the operator is still convinced the fact is wrong.

**5. What must be true at loan creation for the fallback to ever help.**
- The loan must be "eligible" and set up with the fallback.
- Before the loan is constructed, the fallback service (ECVS) must generate a unique random 32-byte secret S and return only its hash H(S).
- H(S) must be committed into the loan and into the Bitcoin recovery script before the escrow is built and before the borrower signs.
- That script must accept either Y or S for the same borrower recovery transaction. The borrower signs each fee variant once during setup.
- The fallback must already be activated by counsel approval and implementation evidence before any new loan may commit H(S).
- A loan created without the commitment cannot acquire it later. The document says this "today means every loan". A lost or compromised S cannot be replaced for an existing escrow.
- Pages 4, 5, 7, 9. Confidence: high.
- Gap: "eligible" is never defined.

**6. What lets the service release its secret, and what it checks on its own.**
- **Trigger:** only the expected loan's UnclaimedRepaymentRefunded event, at Base L1 finality.
- **Its own checks, from public Base data:**
  - the configured chain, deployment and current implementation;
  - the event signature;
  - the loan, transaction and log;
  - that the block is canonical and final;
  - the exact debt and the frozen recipient.
- **Never enough on their own:** Repaid alone, a raw token transfer or balance, time passing, a missing Y, a missing watcher record, a workspace label, or an operator's assertion.
- The observer may pass the service a public reference to the event, but the service does not treat the application as authority.
- Nobody can order an early release.
- Pages 2, 5, 6, 8. Confidence: high.
- Gap: the document does not say which Base data source the service itself uses.

**7. What still has to happen after S is published.**
- The authorized Bitcoin finalizer, in the Bitcoin domain, or an independent verifier fetches the public S. The product itself only receives metadata and whether the commitment matches.
- **The finalizer checks:**
  - the activation gate;
  - the publication and its link to the event;
  - that S matches H(S);
  - the exact retained recovery transaction and its signature;
  - the fixed outputs;
  - that the escrow output is still unspent.
- **It then:** selects one of the already-signed fee variants, inserts S and submits.
- **Finally:** independent Bitcoin sources must agree the spend has confirmed. Only then is recovery final. In the document's words, "Publication is not a submission, and submission is not confirmation."
- **Unresolved fee-variant question:** how a variant is chosen when none clears the current fee estimate plus margin is still disputed between the Bitcoin owners. One view picks the 200 sat/vB variant, marks it for a fee bump and alerts for manual approval. The other fails closed.
- Pages 3, 6, 7. Confidence: high.
- Gap: what triggers the finalizer and who runs it is only partly described.

**8. If the fallback service is unreachable or never publishes.**
- **Borrower:**
  - The Base refund stays complete and valid; the exact repayment went back to the frozen recipient.
  - The Bitcoin stays locked until one of these happens:
    - the borrower long-stop becomes valid once median time past passes D + 10 days. It needs neither Y nor S, and the document says "every newly constructed escrow" carries it;
    - both participants freshly sign a cooperative spend. The mechanism exists, but the product does not yet offer it as a complete operation.
  - An empty or unreachable lookup is not evidence that the service chose to withhold S. Retrying replays the same S, which never changes.
  - Loss, compromise or withholding of S follows a "defined incident path".
- **Lender:**
  - The USDC claim ended permanently at C (D + 2 days). Claim and refund cannot both succeed.
  - The lender's pre-signed default transaction becomes valid once median time past passes D + 3 days. The lender, or anyone holding the exported package, can broadcast it.
  - From D + 10 days both routes are valid and the first confirmed spend wins.
  - Lender silence is not borrower default, but a matured lender route "can still win". Nothing guarantees the collateral returns to the borrower.
- **Company:**
  - It has no collateral key, no authority to sell collateral and no discretionary payout power.
  - It cannot release S or issue a replacement secret.
  - It does not broadcast default packages.
- **Fallback service:** it can only disclose or fail to disclose. It holds no Bitcoin key or transaction and cannot block the refund.
- Pages 4, 5, 6, 7, 8. Confidence: high for what is stated.
- Partly answered: the "defined incident path" is never described. The document also does not explain the lender getting the Bitcoin through the default route after the borrower has repaid.

## Confusing points, terms used before explanation, and things I expected but did not find

**Terms used before or without an explanation**
- **X:** first appears on page 2 ("finalized public X and Y values") and is never defined. Pages 3–4 imply the borrower discloses it to accept the loan and that it activates the collateral.
- **Undefined throughout:**
  - eligible loan;
  - activation gate;
  - current implementation;
  - deployment manifest;
  - Vault and Vault payment accounts;
  - refund-recipient switch and committed protocol address;
  - exported package and default packages;
  - fee variants and sat/vB;
  - "workers" (Figure 1 caption) and the Bitcoin operations worker;
  - workforce operator.
- **Referenced but not available here:** the "defined incident path", "correction rules", "the finality selection", "the provider selection" and "the ECVS constraint" all point to technical records the guide does not include.

**Confusing points**
- **Timing gap:** the refund becomes possible at C (D + 2 days) and the lender's default route becomes valid at D + 3 days. That leaves roughly one day, minus finality and publication time, for the fallback to reach confirmation before the lender can also spend. The document never discusses this race or gives the service a deadline. This is my own inference from the dates.
- **Long-stop scope:** "every newly constructed escrow" carries a borrower long-stop. Whether older escrows have it is unclear.
- **Vault payments section:** it sits oddly in this domain, mixes in demo-versus-production caveats, and calls the whole capability "planned and not yet verified".
- **Figure 2:** the caption refers to "steps 3 to 6", but the boxes are not numbered.
- **Decision credits:** the "user specified / agent's recommendation / agent's choice" attributions are puzzling for a newcomer.

**Expected but not found**
- What happens to S when the lender claims normally with Y. Is it ever destroyed or published?
- Which Base data source the fallback service uses, and its availability commitments.
- What participants see during outages and incidents, and how the borrower is notified that S was published or that the lender's route has matured.
- How provider disagreement is detected, and how often cross-checks run.
- What an operator recheck produces.
