I read the whole PDF, all 11 pages, and nothing else. It is the architecture guide only. It names five separate domain guides and several technical records for the details, and I did not have any of those.

## Answers

**1. Final word on Bitcoin and on USDC movement**
- **Bitcoin:** Bitcoin consensus itself has the final word. It owns the prefund and escrow outputs, signatures, timelocks, broadcasts, confirmations and the "one final spend". Nothing on Base can spend or confirm Bitcoin. The loan's Bitcoin outcome is final only when the transaction confirms.
- **USDC:** The Base contracts have the final word. They own funding, acceptance, repayment, claim, refund and the public reveal of X and Y. Raw transfers, balances, submitted transactions and application status stay provisional until the named contract event reaches Base's final settlement point.
- **What the other parts do:** The observation domain only reports Base facts; it does not create them. The application has "no independent chain truth". Before a Bitcoin prefund counts, two independent Bitcoin data sources must agree.
- Pages 2, 5, 7, 8. Confidence: high.

**2. What the company can do with the borrower's Bitcoin collateral**
- In short, it cannot spend it. The company holds no key to the collateral.
- Its Bitcoin fee wallet may pay to speed up a transaction that is already signed. Any such fee-bump (child-pays-for-parent) transaction must be separately approved.
- It has no say over recipients, capital, debt or secrets.
- Its "dedicated opener" can open the Base funding window once the prefund qualifies, but that moves no USDC.
- The application stores the signed transactions ("package custody") and can broadcast the routes that are already signed, for example activation once X is public, or recovery once Y is public.
- It does not broadcast the lender's default route; the lender exports and broadcasts that one by hand.
- Workforce operators can only request operations that are already authorized.
- Pages 1, 3, 6, 7, 8. Confidence: high.

**3. Full outage of the hosting provider**
- Everything in production runs on Cloudflare. A provider-wide outage can stop the product, the Vaults, the application, observation and Bitcoin automation all at once.
- The chains carry on. During the outage the application accepts no new consequential command and claims no chain result.
- When service returns, it reconciles Base and Bitcoin before it resumes queued work.
- Backups held at a second provider protect the data, not the service. There is no promise about how long recovery takes. Version 1 accepts this risk on purpose.
- **Only partly answered:** the document does not say what happens to loans whose deadlines pass during the outage. Examples are the 24-hour acceptance window, the repayment deadline D and the lender's claim cutoff C. It also does not say whether participants can reach their Vaults to act directly on-chain while the outage lasts.
- Pages 9, 10. Confidence: high for what is stated; the gap is real.

**4. What this version delivers, and what it does not claim**
- **Delivers:** a developer-run local demonstration. Two isolated participants use the real product, application, Vaults, Base contracts, observer, Bitcoin operations and protocol libraries to complete one loan, through normal repayment to a confirmed borrower recovery.
- **Not claimed:**
  - Deterministic local verification is verification only, not a runnable product.
  - The demonstration does not mean deployment or that it works with real providers.
  - There is no deployment claim for the test network or the main network.
  - There is no activated production operation. That would also need monitoring, incident response, legal and security gates, funding, approval and a deliberate switch-on.
- **Status:** the demonstration itself is currently blocked on other components' outputs and is not yet runnable. Several components are recorded as implemented, with corrections still pending.
- Page 9. Confidence: high.

**5. Borrower repays in full and on time, but the lender never claims**
- **USDC:** at the cutoff C (two days after D) the lender's claim is disabled. The exact repayment becomes refundable to the borrower, so the lender cannot collect both.
- **Bitcoin:** that refund does not release the Bitcoin. For every loan, the collateral stays exposed to the lender's default route until a borrower recovery actually confirms. That route becomes valid three days after D.
- **Fallback secret S:** for loans built after the fallback service is activated, the service may publish S to complete the borrower's recovery. Publishing it is not the same as recovering the Bitcoin. Until that transaction confirms, a cooperative settlement or the lender's default route may still win.
- **Long-stop route:** every newly built escrow also has a borrower route that needs no secret and becomes valid ten days after D. Whether it is really part of the signed packages is an open question (see Q6).
- When more than one route is valid, the first to confirm wins.
- The system explicitly cannot guarantee the collateral comes back if the lender disappears after valid repayment, even where a fallback exists.
- Pages 7, 8, 9, 10. Confidence: high.

**6. Points the design records as unresolved, and how it treats them**
- **Lender's approval:** one set of records says publishing the offer is the lender's standing acceptance, with no second approval. Another set requires the lender to approve the final terms explicitly.
- **Bitcoin package count:** the signed exit set is described as 12 packages in some places and 18 in others. The difference is the six borrower long-stop packages.
- **Fee selection:** when no pre-signed fee rate is high enough, the fee-selection contract says both "use the highest rate with an alert" and "fail closed".
- **Browser-wallet acceptance step:** a browser-extension wallet is required in one record but called historical in others.
- **Smaller points** that may be read in a way that reconciles them:
  - whether either party can cancel after the terms are committed but before any money moves;
  - whether the Base deployment has an on-chain pause role;
  - how the single upgrade key used during the main-network beta fits the ban on an unrestricted single upgrade key;
  - which transactions the relay may carry;
  - whether the acceptance and claim calls are signed by the Vault or by an external wallet.
- **How it treats them:** each is marked as undecided. The conflicting records are named on both sides and nothing is picked. The details are deferred to the domain guides, which "state both readings". The guide also separates the larger conflicts from the smaller points that might be reconcilable.
- Separately, page 9 lists limits the system admits rather than open questions: no guarantee of collateral return if the lender vanishes, no recovery of a forgotten Vault password, no recovery-time promise for an outage.
- Pages 5, 6, 9, 10. Confidence: high.

**7. How a security threat must be described, and why checking each credential alone is not enough**
- **First part:** each attack combination the design analyses has one primary threat record. It states the exact prerequisites and consequence rather than a severity label. The example given is a compromised shared frontend that captures both participants during origination.
- **Second part, mostly not answered:** the document never talks about checking credentials one by one. The closest it comes is that threats are analysed as attack combinations, and that "no single holder can act alone". From that I infer that the danger is one compromise reaching several authorities together, as in the shared-frontend example. The document does not say this.
- Pages 7, 9, 11. Confidence: high for the first part; low for the second.

**8. How every part knows it is the same loan, and what that reference does not do**
- Every domain identifies the loan through one canonical terms value and its hash. It binds:
  - the participants and the selected offer revision;
  - the amounts and deadlines;
  - the loan's Bitcoin public keys;
  - the participants' payout destinations;
  - the Base addresses and fixed recipients;
  - the commitments to X, Y and, where used, S.
- A separate deployment description pins the chain, contracts, asset, Bitcoin network, timing policy and upgrade authority.
- Anything for the wrong loan, chain, asset, key, destination or version is rejected. A change to a hashed field invalidates earlier approvals.
- **What it does not do:** neither binding is itself a wallet, key, source of funds or chain fact. Workspace copies and acceptance snapshots cannot redefine it.
- Pages 2, 4, 7. Confidence: high.

**9. Someone steals a signed default transaction prepared for the lender**
- **Not addressed directly:** the document never discusses theft of a package.
- **What it does say:**
  - Every route is pre-signed to a fixed destination.
  - Each one-sided route needs one participant's own key plus a secret or a deadline.
  - The lender's default route becomes valid three days after D under Bitcoin's clock.
  - No destination can change, and the company does not broadcast this route.
- **My inference:** a thief could at most broadcast it once it becomes valid. It could not be used earlier, and the Bitcoin would still go to the lender's committed destination, not the thief.
- **Not covered:** whether broadcasting it early, or in a non-default situation such as repaid-but-unclaimed, could hurt the borrower. Page 8 suggests the route stays usable in that case until a borrower recovery confirms.
- Pages 2, 7, 8, 10. Confidence: medium on where the Bitcoin goes; low on what a thief could do.

## Confusing points, terms used before they are explained, and gaps

**Confusing**
- "Vault" means two different things: the participant's browser Vault, and the Base per-loan funding and repayment vaults.
- "Vault payment account" is never explained.
- The guide says there is no main-network deployment claim, but page 10 mentions a "short public main-network beta" with a single upgrade key.
- The long-stop route is stated as a fact on page 8 ("Every newly built escrow also has...") but is an open question on pages 6 and 10.
- The "one narrow situation" for S on page 2 is only explained on pages 3 and 8.
- "Residual failure is reconciled" is not defined.
- Process language is unexplained: "the agent", "the user approved", "recorded ticket answer", "delivery slices".

**Terms used before or without explanation**
- Long-stop (page 6, explained on page 8).
- "Dedicated opener" and "qualified prefund" (page 3).
- The fixed "recovery path" for USDC.
- Base's "final settlement point" (page 6; finality and the roughly 20-minute delay only appear on page 10).
- Cutoff C (page 7).
- The relay.
- The System Explorer.
- Why there are six fee variants per route.
- The reasons for the 67-hour and 19-hour margins.

**Expected but not found**
- Interest, loan-to-value, any Bitcoin price oracle, margin calls or liquidation.
- Partial or early repayment.
- The company's fees and business model.
- How cooperative settlement works.
- KYC and legal handling.
- What happens to deadlines during an outage.
- Any discussion of package theft.
- An explanation of "checking credentials individually".
