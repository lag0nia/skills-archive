**Reading note.** The Read tool could not render pages by range because pdftoppm is missing, so the "pages" call failed. A plain Read with no "pages" argument returned the whole document. It has 11 pages, and I read all of them. I opened no other file and ran no commands. The PDF is the architecture guide of a "System Guide". It points to five separate domain guides and several technical records, and I did not read any of those.

## Answers

**1. Final word on Bitcoin movement and on USDC movement**
- **Bitcoin:** Bitcoin consensus decides. The "Who decides what" table says "Bitcoin spendability and the final collateral outcome" is held by Bitcoin consensus, not by "anything a Base record or the application says" (p.5).
  - Inside the system, the Bitcoin Authorization And Recovery domain owns Bitcoin observation (p.3).
  - A Bitcoin gate is passed only when two configured sources freshly agree. The prefund and escrow gates also need six unchanged confirmations (p.2).
  - A loan is closed when the return spend confirms, not when it is sent (p.5).
- **USDC:** the Base contracts decide, "once events are final" (p.5). The Base USDC Settlement And Funding domain owns those contracts (p.3).
  - The Base observer (Base Observation And Fallback Review) only reports which events are final, under the L1-finality rule. It does not create a fact or approve what follows from it (pp.2, 6).
- So in both cases the final word sits with the chain itself, not with any application part. Confidence: high.

**2. What the operating company can do with the Bitcoin collateral**
- **It has no key in the collateral script and never holds lender capital** (pp.1, 3).
- **What it can do:**
  - Store the pre-signed packages and run them: add a secret once it is revealed (X, Y or S), choose among fee levels that were already signed, and broadcast (pp.2, 4, 5, 8).
  - Speed up a stuck transaction by adding a separately funded child transaction from its fee wallet. This is a manual operator process that does not touch the signed transaction (pp.6, 8).
  - Its operators can choose already-signed fee levels and export a reviewed fee-bump request (p.1).
- **What it cannot do:** running a package "can never change where the Bitcoin goes" (p.2). The fee wallets give it no say over recipients, amounts, secrets or collateral (p.6).
- **What it does not do in version 1:**
  - It does not automatically broadcast the lender's default transaction; the lender does that with its own tools (p.7).
  - Automatic default broadcast and "institutional last-resort collateral recovery" are deferred (p.10).
  - Bitcoin liquidation is excluded outright (p.10).
- The page 1 summary says "operating company" and the body says "the organization". I am assuming they are the same party. Confidence: high.

**3. A full outage of the hosting provider (Cloudflare, p.2)**
- **During the outage** (p.6):
  - The product, Vault, API, observers, Bitcoin automation and operator tools all stop together.
  - The chains keep running.
  - The application accepts no new consequential command and claims no chain result.
- **When service returns,** it replays and reconciles both chains before resuming its jobs (p.6). Each required state change is committed in D1 together with its background job, and a one-minute scan picks up anything missed (p.6).
- **Not provided:**
  - Version 1 has no live fallback to another provider and no stated RTO or RPO (p.6).
  - Hourly copies of signed packages and encrypted Vault versions kept outside Cloudflare protect completed data, not the running service (p.6).
  - Availability during a Cloudflare-wide outage is listed as something the system cannot guarantee (p.8).
- **Not answered:** the document does not say what happens to a specific loan whose deadlines pass during the outage (funding, acceptance, D, C, T or B). Nor does it say whether participants can act directly on the chains while their Vault is down. Page 9 says direct contract calls, "including every exit", stay available when the organization stops its own services. That is said about an incident, not about a Cloudflare outage.
- Confidence: high for what is stated, low for any per-loan consequence.

**4. What this design sets out to deliver, and what it does not claim**
- **Target outcome:** a local demonstration (p.6).
  - One command starts the system.
  - Two isolated participants complete one loan through normal repayment and confirmed return of the borrower's collateral.
  - It uses the real product, Vault, API, contracts, observer and Bitcoin operations.
- **What each runtime profile claims** (p.7):
  - Local verification: automated tests only.
  - Local demo: a developer can run and resume the complete isolated system. It fails closed if a local setting is missing, conflicting or points outside the isolated profile.
  - Testnet, mainnet and production: "No deployment or operation claim". Each needs its own credentials, funding, evidence and approval.
- Page 11 repeats that runtime claims stop at the local demo.
- **Also outside this package** (p.11): application implementation, production visual review and user testing. The UI specification and prototype are only a presentation contract.
- The fallback validation service is "not yet available in production", and its production use is gated by counsel approval (pp.2, 9). Deferred and excluded capabilities are listed on p.10.
- Confidence: high.

**5. Full, on-time repayment that the lender never claims** (p.8)
- **The USDC:**
  - If the lender does not reveal Y before the claim cutoff C (two days after D), it loses the Base claim permanently.
  - Anyone may then refund the exact repayment to the borrower's refund recipient. That recipient is frozen at C; before C the borrower may switch it once to its own Base protocol account.
- **The Bitcoin:** the refund alone does not return it.
  - If the loan committed to the fallback, the validation service checks the finalized refund event and publishes S. The system then inserts S into the same pre-signed recovery transaction that Y would have completed and broadcasts it. That recovery counts only once it confirms.
  - Until then, and for every loan without S, the other routes stay open. The lender's timelock route opens once Bitcoin's median time past (MTP) is strictly later than T (D plus three days). The borrower's long-stop route opens after B (D plus ten days) and does not cancel the lender's route.
  - "Whichever spend confirms first wins." The document calls this a residual risk for the borrower, not a default. Return of collateral in this case is listed as not guaranteed (p.8).
- **Not answered:**
  - Who actually triggers the refund. Only "anyone may" is said, yet S depends on that refund being finalized.
  - How or when a loan "commits to the fallback".
  - The fact that the fallback service is not yet in production (p.2) suggests that, for now, loans may have no S. That is my inference.
- Confidence: high for the mechanics, medium for the practical outcome.

**6. Points the design records as unresolved, and how it treats them**
- **Open conflicts** (pp.9–10), which "exist between the technical records". The guide says it "does not resolve them":
  - Whether the lender must approve a second time (also flagged on p.4).
  - What happens when no fee level qualifies: pick 200 sat/vB with an alert, or fail.
  - The number of exit packages: twelve versus eighteen. The stale sentence "awaits a separate repair".
- **Open discrepancies** (p.10), described as differing between records and not reconciled:
  - What the terms contain (also flagged on p.5).
  - A reservation that ends before the terms are committed (also flagged on p.7).
  - Who may reveal X and Y.
  - The on-chain pause and the single-key beta upgrade period.
- **How it treats them:** it states each side and refers to the domain guide that explains both readings. It does not pick a side.
- **Separate from these:** deferred items, each "with its own condition for revisiting" (p.10), and the gates on the fallback service (pp.2, 9).
- Confidence: high.

**7. How a security threat must be described, and why checking credentials one at a time is not enough**
- **Only partly answered.** Page 8 says the security records analyze "what each compromised capability can do in each loan state". They pay particular attention to combinations that are "more dangerous than any single leak". The one example given is a malicious frontend together with one participant's unlocked Vault.
- So a threat is framed as a compromised capability in a given loan state. Single checks are not enough because combinations can be worse than any one leak.
- **Not found:** no "must" rule or required format for describing a threat, and no further explanation or list of combinations. The details are in security records that are not part of this PDF.
- My own inference, not stated in the document: the example presumably matters because a malicious frontend could feed crafted actions to a Vault that is already unlocked. Related separations appear on pp.4 and 6: the Vault's two-step confirmation of exact bytes, and the rule that signing in does not unlock a Vault.
- Confidence: medium.

**8. How every part knows it is dealing with the same loan, and what that reference does not do**
- **The shared reference** is one canonical set of committed loan terms and its hash (p.5). The Loan Terms And Commitments domain supplies it to all the other domains (p.3).
  - The terms carry participant references, amounts, deadlines, per-loan Bitcoin public keys, external destinations, Base addresses and fixed recipients, and the hashes of X and Y (p.5).
  - Any consumer rejects an artifact with the wrong loan, chain, asset, key, destination or version (p.5).
  - Changing a hashed field invalidates earlier approvals, and the terms commit exactly once (p.4).
  - A random loan identifier is created at reservation (p.3).
  - Whether the offer revision, reservation number and hash of S belong in the binding is an open discrepancy (pp.5, 10).
- **What it does not do:**
  - It does not move money or prove a chain outcome (p.5). The domain "decides meaning, not money movement" (p.3).
  - It does not identify the environment. A separate deployment manifest per environment does that (pp.5, 9).
  - The look-alike identities stay separate: per-loan Bitcoin keys, the Base protocol account, external destinations and the optional Vault payment account. None silently becomes another (p.5).
- Confidence: high.

## Confusing points, terms used before they were explained, and gaps

**Confusing**
- "Open conflicts" and "open discrepancies" are listed separately, but the difference between them is never explained.
- "Number of exit packages" is listed as an open conflict even though the substance looks settled at eighteen.
- "Version 1" mentions an "intentionally short public mainnet beta" and a Safe "for the rest of version 1" (p.9). Yet the design makes no mainnet claim (pp.7, 11). The scope of "version 1" and the scope of "this design" are not clearly separated.
- The random loan identifier (created at reservation, p.3) and the terms hash (the shared reference, p.5) are never related. It is unclear what binds records before the terms are committed.
- A 24-hour reservation ends when there is "no valid prefund". Yet a valid but unconfirmed prefund goes to manual review only after 72 hours (p.7). The difference between "valid", "visible" and "confirmed" is unclear.
- There are many look-alike recipient terms: fixed recipient, fixed settlement recipient, refund recipient, Base protocol account, external destination, Vault payment account.
- "Operating company" (p.1 summary) and "the organization" are never explicitly equated.
- The contract trusts the opener for Bitcoin qualification (p.4). The guide never discusses what that trust means for security.

**Used before explained, or never explained**
- Used early, explained later: "Base" (p.1, explained p.2); fee levels and packages in the operator description (p.1, explained pp.2 and 9); "the opener" and "activations" in Figure 1 (p.3, explained p.4); "exit packages" in Figure 2 (explained pp.4–5).
- Never explained:
  - "fee-bump request" and "Base calls whose effect is already fixed" (p.1)
  - "relative timelock" (p.2)
  - "long-stop"
  - "Safe" (p.9)
  - "cooperative spend/settlement" and "protection or put-option operations" (p.10)
  - "fail closed"
  - which "two configured sources" Bitcoin gates rely on
  - process terms such as "ticket", "former decision" and "invariant/timing records"

**Expected but not found**
- How the debt or interest is calculated, loan-to-value, price oracles, and what happens if the Bitcoin price falls. Liquidation and shortfall enforcement are excluded, but the lender's resulting risk is not discussed.
- How and by whom a loan opts into the fallback.
- Who triggers the post-C refund in practice.
- What happens to on-chain deadlines during a Cloudflare outage, and whether participants can act without the Vault.
- An actual threat list or attacker model.
- A component or deployment diagram and a picture of the Bitcoin script spending paths (only two flow figures are given).
- A glossary.
