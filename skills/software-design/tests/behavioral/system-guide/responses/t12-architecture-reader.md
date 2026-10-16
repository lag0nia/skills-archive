I read the whole PDF, all 11 pages. Reading it with the `pages` parameter failed because a rendering helper (pdftoppm) is not installed. Reading without it returned the full document. I opened nothing else and ran no commands.

## Answers

**1. Who has the final word on Bitcoin collateral movement and on USDC movement?**
- **Bitcoin:** Bitcoin consensus itself. It owns the prefund and escrow, signatures, timelocks, confirmations, reorganizations and "the one final spend". Base records cannot spend or confirm Bitcoin. A Bitcoin outcome counts only as a confirmed spend of the exact output. A broadcast, a mempool sighting or a local "selected" label does not count. Key gates need six unchanged confirmations. Lifecycle gates also need fresh agreement between the configured independent Bitcoin observers. (pp. 2, 6, 7)
- **USDC:** the Base loan contracts. They own funding, acceptance, repayment, claim, refund and deadlines. Something counts only when a named contract event reaches Base L1 finality, roughly 20 minutes. Raw token transfers, vault balances, submitted transactions, application statuses and earlier "observed"/"safe" states are all provisional. The Base Observation domain is the only bridge that passes Base facts to the rest of the system, but it "does not create a fact". (pp. 2, 3, 6, 7)
- **Confidence:** high.

**2. What can the operating company do with a borrower's Bitcoin collateral?**
Very little.
- It holds no key to the collateral script. (pp. 1, 2)
- Its Bitcoin fee wallet may pay to speed up an already-signed transaction through a separate child transaction, without changing it. This gives no authority over recipients, capital, debt or secrets. (p. 7)
- If origination stops before acceptance, it may broadcast one of the borrower's pre-signed refund transactions. This is allowed only after the prefund's relative timelock matures, and only with fresh evidence that the prefund is unspent and that X was never accepted. (p. 8)
- Its operations domain stores signed packages and coordinates actions already authorized. Operators can review incidents, request pre-fixed actions and request rechecks. They cannot change amounts, recipients or chain facts. (pp. 2, 7, 8)
- Explicitly excluded from this version: "default broadcast by the organization", institutional collateral recovery, liquidation, and company-held acceptance. (p. 9)
- The document does not say plainly which party broadcasts the activation and recovery transactions. It says "the Bitcoin domain" does, and that domain runs in the company's Cloudflare container. (pp. 5, 7)
- **Confidence:** high on the limits, medium on who exactly broadcasts.

**3. What happens during a full outage of the hosting provider, and when service returns?**
- Everything runs on Cloudflare in one shared failure domain. An outage stops the product, the Vault, the API, chain observation and automation together. (p. 7)
- The chains keep running. The application accepts no new consequential command and claims no chain result. (p. 7)
- When Cloudflare returns, the system first replays and reconciles Base and Bitcoin, then resumes queued jobs. State changes and their jobs are committed together, and a recovery scan every minute finds missed work. (p. 7)
- There is no fallback provider and no promised recovery time. Off-Cloudflare backups protect data, not service. Continuity through such an outage is explicitly not guaranteed. (pp. 7, 9)
- **Only partly answered.** The document does not say what happens to a specific loan whose on-chain deadlines or timelocks pass during the outage. Examples are the repayment deadline D, the claim cutoff C, the lender's route at D+3 and the acceptance window. It also says nothing about participants being unable to reach their Vaults to sign or reveal secrets.
- **Confidence:** high for what is stated, low for per-loan consequences.

**4. What does this version deliver, and which later stages does it not claim?**
- **Claimed:**
  - Deterministic local verification: fixtures, failure injection and cross-component assertions.
  - A local demonstration: one developer runs the isolated system and completes one loan, through normal repayment and confirmed borrower recovery, in two browsers. (p. 8)
- **Not claimed:**
  - Test network: no deployment claim.
  - Main network: no deployment claim.
  - Production: no activated-operation claim. Activation needs monitoring, incident response, paid services, legal and security gates, funding, release approval and an intentional enablement. A configuration name or a successful local run activates nothing. (p. 8)
- **Caveat:** even the local demonstration is "a target, not yet an achieved result". Its runtime is blocked, its acceptance checks have not passed, and corrections to earlier deliveries have not yet been executed. (p. 8)
- The validation service is selected but not available for production. (pp. 2, 6) Several features are excluded from this version, as listed in Q2. (p. 9)
- **Confidence:** high.

**5. Borrower repays in full and on time, but the lender never claims.**
- **USDC:**
  - Before C (D + 2 days), the borrower may once switch its refund recipient to its own protocol account on Base.
  - At C, the lender's claim is permanently disabled and the refund recipient is frozen.
  - From C onward, anyone may trigger the fixed refund. It returns the exact repayment to the frozen recipient exactly once, and the caller cannot choose the destination.
  - Claim and refund exclude each other. (pp. 5–6)
- **Bitcoin:**
  - The refund does not unlock it.
  - Only for loans created after the validation service is activated: the service verifies the finalized refund and publishes S, which completes the borrower's existing recovery transaction. That service is not yet active. (pp. 2, 6)
  - Without Y or S, the Bitcoin stays in escrow.
  - The lender's pre-signed recovery becomes valid at D + 3 days. It can pay the lender even though the borrower repaid, because Bitcoin cannot see the repayment.
  - The borrower's long-stop becomes valid at D + 10 days.
  - After day 10, whichever transaction confirms first wins.
  - Mutual cooperation with fresh signatures from both sides is another route.
  - The document records this as a residual risk with no guarantee that the collateral returns. (pp. 6, 9)
- The document does not spell out the combined worst case, where the borrower gets the USDC refunded while the lender takes the Bitcoin. That outcome is implied by the timings.
- **Confidence:** high.

**6. Which points does the design record as unresolved, and how does it treat them?**
It lists six points as "open and remain undecided" (pp. 9–10):
1. Whether the lender must give a separate approval of the final terms, or whether reservation already binds them.
2. Whether the active-phase archive holds 12 or 18 recovery transactions.
3. Who may upgrade the Base contract during the beta: a single upgrade key, or the 2-of-3 Safe with a 7-day timelock.
4. How upgrades reach existing loans: one upgraded code path versus no silent migration or retroactive mutation.
5. Whether an on-chain pause exists.
6. What happens when no signed fee level is high enough: use the 200 level plus a fee-bump child and an alert, or fail closed with "no eligible tier".

How it treats them:
- Each one is stated as a conflict between named source records, without choosing a winner.
- They are flagged inline wherever they come up, as "open question", "open conflict" or "open". (pp. 1, 4, 5, 7, 8)
- Readers are pointed to the domain guides and the architecture record. (p. 10)
- No owner, deadline, resolution process or interim behaviour is given.
- **Confidence:** high.

**7. How must a security threat be described, and why is checking each credential on its own not enough?**
- A threat is analysed by three things: the exact capability lost, the loan state, and whether supposedly independent controls share a failure domain. The security boundaries record each path, its blast radius and its controls. (p. 9)
- Why individual checks are not enough: separate keys and credentials can share one failure point. A malicious Vault release that is live while both participants unlock could capture both matching loan keys. Together those keys allow an arbitrary cooperative spend of the escrow. (p. 9)
- The same pattern applies to Cloudflare: components have separate projects, credentials and origins, but share one provider failure domain. (p. 7)
- The document never says "checking each credential is not enough" in those words. That part of the answer is my reading of the "share a failure domain" criterion and its example.
- **Confidence:** high on the criteria, medium on the "why".

**8. How does every part know it is the same loan, and what does that shared reference not do?**
- One canonical set of terms and its fingerprint, the "terms hash", is referenced by every record, contract call, Bitcoin transaction, observation and secret commitment.
- A separate deployment manifest identifies the environment: chain, contract, token, Bitcoin network and timing policy.
- Any consumer rejects an artifact for the wrong loan, chain, token, key, destination or version.
- Changing any fingerprinted field invalidates both approvals.
- **What it does not do:** a matching fingerprint "never authorizes a spend". The terms domain authorizes no spend and records no chain outcome.
- (pp. 3, 4, 6)
- **Confidence:** high.

**9. If someone steals a signed default transaction prepared for the lender, what can they do and where does the Bitcoin go?**
- Once its timelock matures (D + 3 days), the thief can broadcast it. The Bitcoin goes to the lender's fixed destination, not to the thief. This works even if the borrower has repaid. (pp. 6, 9)
- Signed packages have a fixed destination, and holding one "is not permission to choose a new destination". (p. 2)
- The document calls this transaction the lender's "timelocked recovery" or "signed lender package", not a "default transaction". I am assuming that is what the question means.
- The document does not say this in so many words, but by implication the stolen package becomes useless if another spend of the escrow confirms first, because Bitcoin allows only one final spend. (pp. 6, 7)
- **Confidence:** high.

## Confusing points, terms used before they are explained, and gaps
- **Confusing:**
  - "Default broadcast by the organization" (p. 9) is never explained.
  - The document never states plainly that the lender's D+3 recovery is the remedy when the borrower does not repay.
  - The loan's "stable identity" created at reservation (p. 4) and the terms hash (p. 6) both identify the loan, and their relationship is unclear.
  - There are 12 prefund-phase packages, versus 18 or 12 active-phase ones.
  - Mentions of "the user" and "the design agent" (p. 9) refer to the design process, not the product.
- **Terms used before they are explained, or never explained:**
  - "fingerprint" (p. 3), before "terms hash" (p. 6)
  - "fee wallets" (p. 2), before p. 7
  - "funding window", "funding vault", "repayment vault", "protocol account on Base"
  - "long-stop", "relative timelock"
  - "Safe" and "timelock"
  - the "observed" and "safe" Base states
  - "relay", "child transaction" and "fee-bump child"
  - "package-ready active", "terminal signing pending"
  - "counsel approval", "handoff sequence", "cross-domain verification harness"
- **Expected but missing:**
  - The plain borrower-default path: borrower does not repay, and the lender takes the Bitcoin.
  - Interest, collateral ratio, or any price or valuation rule.
  - Concrete lengths for the acceptance window, the funding window and the prefund timelock (only "67 hours left" is given).
  - Which party actually broadcasts each Bitcoin transaction.
  - What happens to deadlines that pass during an outage.
  - Fees or business model, identity checks, a glossary, and a full state list.
