I read the whole PDF. It is 8 pages long, and all of them loaded in one Read call. Asking for the first 20 pages failed because the page-image renderer (pdftoppm) is not installed. Reading without the pages parameter worked and returned the full text of all 8 pages. I opened no other files.

**1. Which part has the final word on Bitcoin collateral, and which on USDC?** (p.5, also p.2–3; confidence: high)
- **Bitcoin:** Bitcoin consensus decides. That covers prefund and escrow outputs, signatures, timelocks, confirmations, reorganizations, and which single spend of the escrow wins. Base records cannot spend or confirm Bitcoin.
- **USDC:** The Base contracts decide funding, acceptance, repayment, claim, refund and deadlines. Raw transfers, balances, submitted transactions and application status are only provisional until the named contract event reaches the required finality.
- **What the observer does not do:** The observer only reports what Base recorded and how final it is. It does not create the fact or approve its consequence.
- **Related point:** p.3 says "a Base refund is not a confirmed Bitcoin recovery".

**2. What can the operating company do with a borrower's Bitcoin collateral?** (p.1, p.2, p.5, p.6, p.7; confidence: high)
- **Almost nothing on its own.** The company holds no key to the collateral script (p.2), and no operator or service can move collateral or choose where money goes on its own (p.1).
- **What the application can do:** It stores signed transaction packages and coordinates actions participants have already authorized. It holds no participant private authority (p.5). It can broadcast an already-signed activation transaction once X is public, and keep pushing it (p.3, p.6).
- **Fee wallets:** The company's fee wallets can add a Bitcoin fee by funding a separate child transaction through a small anchor output. This gives no recipient, capital, debt, secret or contract authority (p.5).
- **Lender-default transaction:** The company does not broadcast it; the lender exports and broadcasts it manually (p.6). Automatic broadcast by the company, institutional collateral recovery and liquidation are outside this version (p.7).

**3. What happens during a full hosting-provider outage, and when service returns?** (p.5; confidence: high on the stated behaviour)
- **During the outage:** All production parts run on Cloudflare. A Cloudflare-wide outage can stop the product, Vault, API, observation and Bitcoin automation together. The blockchains keep running, but the application accepts no new consequential command and claims no new chain result.
- **When it returns:** The system reconciles Base and Bitcoin before resuming its durable jobs.
- **Limits:** There is no live fallback provider and no stated recovery time. Backups outside Cloudflare protect stored package data, not a running service.
- **Not answered:** The document does not say what happens to deadlines or timelocks that expire during the outage. For example, the lender's Bitcoin default route matures on Bitcoin's own clock "whatever happened on Base" (p.6), but the outage section does not join these up.

**4. What does this version set out to deliver, and what does it not claim?** (p.5–6, p.7; confidence: high)
- **The goal:** A developer-run local demonstration. Two isolated participants use the real product, API, Vault, contracts, observer, Bitcoin operations and protocol libraries. They complete one loan through normal repayment and confirmed borrower recovery, on a local Base chain and a local Bitcoin test network.
- **Required:** Automated local verification and the runnable local demonstration.
- **Not claimed:** Test-network deployment, main-network deployment and activated production operation.
- **Status:** The demonstration is not yet delivered. Its runtime is still in progress and it waits on other pending work.
- **Also out of scope (p.7):** Automatic broadcast of lender-default transactions, institutional collateral recovery, liquidation, public or multi-lender matching, pooled capital, and Vault password recovery.
- **ECVS:** Its production use is not yet activated (p.2).

**5. Repaid in full and on time, but the lender never claims: what happens to the USDC and the Bitcoin?** (p.6, p.7; confidence: high on the description, but the document itself flags contradictions)
- **USDC:** Two days after the repayment deadline, the lender's claim is permanently disabled. The exact repayment can then be refunded once to the borrower's frozen refund address.
- **Bitcoin:** The USDC refund does not release Bitcoin.
  - **With the activated ECVS capability:** S can complete the borrower's recovery. Until that recovery confirms, the lender's timelocked route or a cooperative settlement can still win.
  - **Without S:** The escrow stays unspent while the lender's timelocked route matures (3 days after the deadline). If the escrow was built with the long-stop, the borrower's long-stop matures later (10 days). Whichever confirms first wins.
- **Consequence:** The borrower could lose the collateral despite repaying. This is recorded as a residual risk, not borrower default.
- **Contradiction:** Some residual-risk records leave out the long-stop, and one says such a loan has no borrower fallback route. This is listed as open.
- **Guarantee:** The system cannot guarantee that collateral returns after valid repayment if Y is never revealed, with or without S, until a borrower recovery actually confirms (p.7).

**6. Which points does the design record as unresolved, and how does it treat them?** (p.7–8, also p.3, p.4, p.6; confidence: high)
It says the owning records disagree or do not clearly agree, that "None is decided here", and it points to the relevant domain guide for each. The open points are:
- **Lender approval of final terms:** Standing acceptance via the published offer, or a second lender approval?
- **Number of exit transactions:** Eighteen, or twelve in one archive sentence?
- **No qualifying fee level:** Use the 200 sat/vB transaction and raise an alert, or fail closed and select nothing?
- **Long-stop:** It is missing from the residual-risk records.
- **Hash of S:** Is it committed in the agreement binding, or only in the recovery script?
- **Fee bumps after activation is queued:** Fee-bump child only, or also the signed fee levels?
- **One provider as enough:** One healthy provider may report a finalized Base fact, while a security record says no single source may be authoritative.
- **Base contract pause and upgrades:** The pause role and upgrade treatment are worded differently. Some records leave out the single beta key, while others rule out an unrestricted single upgrade key.

The same tensions are also flagged inline on p.3, p.4 and p.6. Separately, the five-domain map's origin is recorded: the user approved one domain, and the agent chose the other four without the full list being presented for approval.

**7. How must a security threat be described, and why is checking each credential on its own not enough?** (confidence: low; mostly not answered)
- **First part:** The document does not answer it. It contains no threat-description format or threat model.
- **Second part, only indirectly:**
  - Signing in only permits fetching encrypted data. It is not decryption, signing, secret recovery or chain authority (p.3, p.5).
  - Any artifact bound to the wrong loan, chain, asset, key, address or version is rejected (p.4).
  - These suggest that each item must be checked against the exact loan context. However, the document never states the "credential on its own" rationale.

**8. How does every part know it is dealing with the same loan, and what does that reference not do?** (p.4, p.5; confidence: high)
- **The shared reference:** One canonical agreement and its hash.
- **What the agreement binds:** The participants, the selected offer and reservation, amounts, deadlines, loan-specific Bitcoin public keys, each participant's external Bitcoin address, Base protocol addresses and fixed payment recipients, and the hash commitments to X and Y.
- **Environment-wide facts:** A separate deployment description binds the chain, contracts, asset and timing policy.
- **What it does not do:**
  - Neither the agreement nor the deployment description is a wallet, a signing key or a fact about chain state.
  - Workspace copies and acceptance snapshots cannot redefine the agreement (p.5).
  - Artifacts bound to the wrong loan, chain, asset, key, address or version are rejected.
- **Open point:** Whether the hash of S is part of the binding.

**9. If someone steals a signed default transaction prepared for the lender, what can they do, and where would the Bitcoin go?** (confidence: low; mostly not answered)
- **Not addressed:** The document never covers theft of this transaction.
- **What it does say:**
  - The lender's route is pre-signed and timelocked, valid three days after the deadline under Bitcoin's time rules, and the lender exports and broadcasts it manually (p.6).
  - The Bitcoin domain "operates only the fixed Bitcoin transactions they signed in advance" (p.2).
  - Revealed secrets never choose a destination (p.2).
  - The agreement binds each participant's chosen external Bitcoin address (p.4).
  - The long-stop and borrower recovery can compete, and whichever confirms first wins (p.6).
- **My inference, not stated:** A thief could at most broadcast it once it is valid, and the Bitcoin would go to the lender's agreed address. The document never says explicitly where the lender's default transaction pays.

**Confusing points, terms used before they are explained, and gaps**
- **Terms used early or never explained:**
  - "Base settlement guide" (p.1) is a loose name for the Base USDC Settlement And Funding guide.
  - "Long-stop" is used in the "Repaid, but the lender does not claim" bullet before its own bullet defines it (p.6).
  - "Frozen refund address" is never explained.
  - "Cooperative settlement" (p.6) is never described.
  - "Required finality" is never quantified for Base.
  - "Dedicated opener", "anchor output", "fee-bump child" and "network's queue" are not explained.
  - "Beta" and its single key appear only on p.8 with no earlier context.
  - "User", "agent" and "approved migration" (p.7) are unexplained provenance terms.
  - "Evidence-conditioned" in ECVS is not unpacked.
- **Naming clash:** The browser "Vault" and the per-loan "funding vault" and "repayment vault" share a name but are different things.
- **Routes not named:** The "three routes" of exit transactions are never listed. I assume borrower recovery, lender timelocked and long-stop, but that is a guess.
- **Odd wording:** "Anyone may then finalize the exact amount" (p.3) is not explained.
- **Expected but missing:**
  - A threat model or security section.
  - Explicit destinations for the lender default route.
  - Interest, collateral ratio and price-risk handling (liquidation is simply out of scope).
  - Behaviour of deadlines during an outage.
  - The flow records and domain guides it keeps referring to; they are not included.
  - Contract upgrade administration, which p.1 says the Base protection depends on, is only touched on as an open point.
