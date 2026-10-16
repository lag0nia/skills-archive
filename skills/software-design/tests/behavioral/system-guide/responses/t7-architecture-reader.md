**How I read it:** Reading with the `pages` parameter failed because pdftoppm is not installed. Reading the file without that parameter returned the whole document, which is only 11 pages ("Architecture Guide", generated 15 October 2026). I read all of it and opened no other file. Page numbers below are the PDF's own page numbers.

---

**1. Who has the final word on whether the Bitcoin collateral moved, and whether USDC moved?**
- **Bitcoin:** Bitcoin consensus decides. The "who decides what" table gives "Prefund, escrow, timelocks and the one final spend" to Bitcoin consensus. It says Base records, relay responses and application labels do not decide this (p.6). The domain table says "Bitcoin consensus, not the application, decides which transaction wins" (p.3). Only a transaction with the required confirmations counts (p.5). Inside the system, the Bitcoin Authorization And Recovery domain reconciles Bitcoin facts before anything relies on them (p.3), and the evidence must agree across independent sources (pp.8–9).
- **USDC:** The Base loan contract decides, but only once its event reaches Base's layer-1 finality (p.6). Raw transfers, balances and submitted transactions do not count (pp.5–6). The Base Observation And Fallback Review domain reports that fact with provenance and finality. Operators can ask for a recheck but cannot change a fact (pp.3, 6).
- Confidence: high.

**2. What can the operating company do with a borrower's Bitcoin collateral?**
Very little, and none of it involves spending it at its own discretion:
- It holds no key that can spend the collateral (pp.1–2). It never sells collateral, because liquidation is outside the design (p.2).
- Its automation only submits actions the participants already authorized (p.1):
  - completing an activation transaction with X and broadcasting it (p.4)
  - inserting Y into the borrower's pre-signed return transaction and broadcasting it (p.4)
  - broadcasting a pre-signed refund of the prefund, but only after the timelock and with fresh evidence that the prefund is unspent and X was never accepted (p.7)
- Signed packages cannot be redirected to a new destination or amount (p.2).
- It stores the signed packages in its archive, with hourly backups (pp.4, 7).
- An operator can approve a fee bump paid from the company's fee wallet. This is a separate child transaction that speeds up a stuck one without changing it. It cannot refund the prefund or pay the principal again (pp.6, 8).
- It cannot accept a loan on the borrower's behalf (p.7). It does not broadcast default transactions in version 1, because the lender does that manually (pp.8, 10). It has no override on releasing S (pp.6, 10).
- Indirect risks the document records: a malicious Vault release could capture both participants' matching keys and redirect the escrow, and version 1 has no multi-person control over Vault releases (p.9). Whether the product counts as "non-custodial" is a legal question left outside the design (p.9).
- Confidence: high.

**3. What happens to loans in progress during a full hosting-provider outage, and when service returns?**
- **The outage:** Everything runs on Cloudflare: the product, the API and database, the Base observer, the Vault and the Bitcoin worker. A Cloudflare-wide outage can stop all of them together (p.7). The blockchains keep running. While the application is down it accepts no new consequential command and claims no chain result (p.7). The system "cannot keep running through a Cloudflare-wide outage" (p.9).
- **Recovery:** Each state change is recorded together with the job that carries it out, and a scan every minute picks up anything missed, so no work is lost (p.7). When service returns, the application reconciles Base and Bitcoin before resuming jobs (p.7).
- **What is missing:** There is no live fallback provider and no stated recovery time or data-loss target. Backups protect the signed packages and encrypted Vault data, not continuity of service (p.7).
- **Partly unanswered:** The document does not say what happens to deadlines that keep running during the outage. These include the 24-hour acceptance deadline, the prefund refund timelock, an activation still pending, and D, C, T and B. It also does not say whether participants can claim or repay while the Vault is down. One can infer that the chains enforce their timelocks regardless, but the document does not spell this out.
- Confidence: high for what is stated. The effect on individual loans is only partly answered.

**4. What does this design version set out to deliver, and which later stages does it not claim?**
- **Target (p.7):** It is narrower than production. It aims for two things:
  - a deterministic local verification environment, with disposable automated scenarios across all parts
  - a developer-run local demonstration, where two isolated participants use the real product, Vault and services to complete one loan through normal repayment and confirmed return of the collateral. A developer can start, resume and reset the whole system.
- **Explicitly not claimed (p.7 table):** testnet, mainnet and production ("No claim"). Each needs its own credentials, funding and deployment evidence. Production also needs monitoring, legal and security gates, and an intentional enablement. The local demonstration does not prove deployment, compatibility with real providers, or production use. The local profile refuses to start if any setting points at a public network or credential.
- **Other items noted as not yet available:**
  - the validation service (p.2)
  - Vault payment-account funding (p.4)
  - cooperative settlement as an operational capability (p.8)
  - automatic default broadcast (p.10)
  - an immutable contract (p.9)
- Confidence: high.

**5. The borrower repays fully and on time, but the lender never claims. What happens to the USDC and the Bitcoin?** (p.8, plus pp.2, 6)
- **USDC:** At C (two days after D), the contract permanently disables the lender's claim. Anyone can then refund the exact repayment, once, to the borrower's recipient as frozen at that moment. That settles the USDC.
- **Bitcoin:** Repaying does not release the Bitcoin. Only Y or S can complete the return transaction, so the escrow stays unspent.
  - At T (three days after D), the lender's route becomes valid for every loan. The lender can take the collateral even though the borrower repaid.
  - Only for loans created after the validation service is activated, the service may publish S after the exact finalized refund event. That completes the borrower's return transaction, but it protects the borrower only if it confirms before the lender's transaction, and publication can fail.
  - At B (ten days after D), the borrower's long-stop becomes valid. It does not cancel the lender's route; both can be valid at once, and whichever confirms first wins.
- **Unanswered:** who submits the refund after C, and who broadcasts the transaction completed with S or the long-stop.
- Confidence: high.

**6. Which points does the design record as unresolved, and how does it treat them?**
- **Six open source conflicts (p.10):**
  1. Whether the lender must approve the final terms separately.
  2. Whether a Vault payment account may be chosen as a recipient.
  3. Whether the selected offer, the reservation and the commitment to S sit inside the hashed terms or are bound around them.
  4. What happens when no fee tier is eligible: select the highest tier with an alert, or fail closed.
  5. Whether there are twelve or eighteen exit packages.
  6. Whether there is an on-chain pause role.
- **How it treats them:** The guide says it "does not choose between their sides". It states both positions and their sources, notes that both sides of the terms-approval conflict trace back to user decisions, and points to the domain guides for detail. It also flags the conflicts inline where they matter (pp.3, 4, 5, 6, 9).
- **Related open or deferred items:**
  - The boundaries of four of the five domains were chosen by "the agent" and never presented to anyone as a complete list for approval (p.10).
  - Malicious-Vault risk is left explicit (p.9).
  - The cross-chain principal risk falls on the lender (p.8).
  - Legal questions are out of scope (p.9).
  - Several capabilities are deferred (pp.8–10).
- **Not stated:** who resolves the conflicts, when, or whether they block implementation.
- Confidence: high.

**7. How must a security threat be described, and why is checking each credential on its own not enough?** (p.9)
- **How it is described:** Security analysis "asks what capability an attacker would gain at which stage of a loan, not only whether one stolen item is harmful alone." The security boundary records hold each threat with its controls.
- **Why per-credential checks fall short:** Items that look harmless alone can combine. A malicious Vault delivered to both participants of the same loan could capture both matching keys, and two matching keys can redirect the escrow. One malicious release could also collect keys across many loans for later use. A related point: control of contract upgrades can be economically equivalent to holding the funds (p.9).
- **Partly answered:** The document describes this framing but gives no mandated format or required fields for a threat description. It also opens with "Security analysis follows the same logic" without saying which logic.
- Confidence: medium.

**8. How does every part know it is the same loan, and what does that shared reference not do?** (pp.5–6, plus p.3)
- **The shared reference:** Every artifact uses a random loan identifier plus the hash of the canonical terms. The identity is created atomically when the borrower selects the offer (p.3). The terms bind:
  - the participants, amounts and deadlines
  - each participant's Bitcoin public key and payout destination
  - the fixed Base recipients
  - the commitments to X and Y
- Any artifact that cannot prove it belongs to this exact loan and environment is rejected rather than reinterpreted.
- **What it does not do:**
  - It does not identify the environment. A separate deployment description covers the chain, contracts, token, Bitcoin network and timing policy.
  - It is not settled whether it covers the selected offer, the reservation and the commitment to S (open conflict).
  - Copies of the terms (workspace copies, acceptance snapshots, screens) do not carry the loan's meaning.
  - It does not merge a participant's several identities. Using one identity grants none of another's authority.
- The document has no sentence that says explicitly "the reference does not do X". These are the closest statements.
- Confidence: medium.

---

**Confusing points, terms used before they were explained, and gaps**

*Confusing:*
- "Version 1" (a production architecture on Cloudflare) versus "this design version" (local-only claims). How the two relate is never explained.
- On p.7, "They keep separate projects, credentials and release processes, but they share one provider failure domain." It is unclear whether "they" means the Cloudflare components or the tooling and backups outside Cloudflare.
- "Security analysis follows the same logic" (p.9) without saying which logic.
- On p.10, "the user" and "the agent" chose the domain boundaries, but neither is introduced.
- Several internal records are cited and never explained: "the architecture record", "detailed terms records", "flow records", "selection records", "a resolved fee ticket" and "System Explorer".
- Naming clash between the participant "Vault" (a browser app) and the "funding vault" or "repayment vault" (contract addresses). The text clarifies this only on p.4.
- The account that opens funding windows is described as trusted (p.9). That sits awkwardly with the central rule on p.1, and the account is missing from the authority table on p.6.
- The purpose of the long-stop at B is unclear when the lender's route opens earlier, at T.

*Used before explained:*
- Base, and "Base's layer-1 finality" (p.5). Its rough length of 20 minutes appears only on p.9. The document never says Base is a layer-2.
- mempool (p.3)
- "infraction" (p.3): its consequences are never explained.
- "activation gate" for the validation service (p.2)
- the 67-hour and 19-hour margins (p.4), which only make sense after the roughly 72-hour prefund timelock appears on p.7
- fee tiers or variants
- the "protocol account" and the "payment account": funding through a payment account is mentioned on p.4, but the account is introduced on p.6
- "canonical terms"
- "gate"
- child-transaction fee bump
- the 12-word recovery phrase, which appears first on p.9

*Expected but not found:*
- How "the exact debt" is calculated (interest, fees) and how the collateral amount or loan-to-value is set.
- Any price source, early or partial repayment, or the company's own fees.
- Who pays Bitcoin network fees for the pre-signed transactions.
- What the operators' "fixed operations" are.
- How deadlines interact with an outage.
- Who broadcasts the transactions completed with S and the long-stop.
- Who resolves the open conflicts.
