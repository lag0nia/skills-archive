I read the PDF at /private/tmp/claude-501/-Users-alanguerrero-Documents-ai-prompts/b72a9647-f430-4577-b73d-46cf594be5b3/scratchpad/eval/t13-pdf/bitcoin-backed-usdc-one-loan-system-architecture.pdf and nothing else. It is a 10-page architecture guide. Reading it with the pages parameter failed because the PDF renderer (pdftoppm) is not installed. Reading it without that parameter returned all 10 pages, so the whole document was read.

## Answers

**1. Who has the final word on the Bitcoin collateral and on USDC?**
- **Bitcoin:** Bitcoin consensus has the final word. It owns deposits, the locked collateral output (the escrow), signatures, timelocks, confirmations, chain reorganizations and "the one final spend". The guide says nothing on Base can spend or confirm Bitcoin. The system acts on Bitcoin only once independent sources freshly agree on the required confirmations.
- **USDC:** The Base contracts have the final word. They own funding, acceptance, repayment, the lender's claim and refunds. Transfers, balances, submitted transactions and the application's own status stay provisional until the named contract event is final. "Final" means the event's block is final on Ethereum, which takes roughly 20 minutes.
- Base observation only reports facts and never creates them. The workspace that coordinates each loan holds "no chain truth". The two chains are described as independent authorities over different assets.
- Pages: 2, 3, 6. Confidence: high.

**2. What can the operating company do with a borrower's Bitcoin collateral?**
- It can do very little. The guide says neither the product nor the company can spend the collateral. The company holds no collateral key and cannot choose where money goes.
- It does store the signed transactions in its primary archive and watches both chains.
- It may pay network fees from its own fee wallets, including funding a fee-bump transaction. Paying fees gives it no say over recipients, capital, debt, secrets or the contract.
- Its system resubmits the pre-signed activation and raises its fee. It also relays some pre-signed transactions through a constrained path. Every one of these transactions has a fixed destination, and a signed transaction is "never permission for the application to choose a new destination".
- It does not broadcast default transactions; the lender does that.
- Pages: 1, 2, 5, 6, 9. Confidence: high that it cannot spend or redirect the collateral. Medium on exactly which transactions it relays, because the guide lists that as an open question (page 9).

**3. What happens during a full outage of the hosting provider, and when service returns?**
- The hosting provider is Cloudflare, which runs every production part. An outage can take down the product, the Vaults, the interface and database, chain observation, Bitcoin automation and the operator surface all at once.
- During the outage the chains keep running. The application accepts no new consequential request and claims no chain result.
- When service returns, it first reconciles Base and Bitcoin, then resumes its durable jobs.
- There is no live fallback to another provider and no stated recovery time. Off-provider backups protect stored data, not availability.
- **Not answered:** what happens to on-chain deadlines and timelocks that pass during an outage. They would presumably keep running because "the chains keep running", but the guide never says so. Elsewhere (page 2) it says anyone may still call the public contract directly, but it does not connect this to repaying during an outage while the Vaults are down.
- Pages: 7 (and 2). Confidence: high for what is stated; the answer is only partial for loans in progress.

**4. What does this version set out to deliver, and what does it not claim?**
- **Target:** a local demonstration run by a developer. Two isolated participants use the real product, Vault, Base contracts, observer, Bitcoin operations and protocol libraries to complete one loan through normal repayment and confirmed borrower recovery. This is to be done through one developer entrypoint, with saved state and an explicit reset. There is also a separate profile for deterministic local verification only.
- That demonstration is "not yet runnable": it is blocked on pending changes to components it depends on.
- **Not claimed:**
  - any testnet or mainnet deployment;
  - any activated production operation ("nothing is activated by a configuration name or a successful local run");
  - any public deployment or compatibility with real providers;
  - the fallback service, which waits for counsel approval and implementation evidence.
- **Out of scope in this version:** multi-lender or public matching, pooled capital, the product holding funds, automatic deployment of lender capital, and liquidation of Bitcoin.
- Pages: 7, 8 (scope on 2). Confidence: high.

**5. The borrower repays in full and on time, but the lender never collects. What happens?**
- **USDC:** At the claim cutoff C, two days after the deadline D, the lender's claim ends for good. Anyone can then return the exact repayment to the borrower's frozen refund recipient. The guide does not say whether anyone is obliged to do this or whether it happens automatically.
- **Bitcoin:** That refund does not release the Bitcoin.
  - With the fallback set up (none can be yet), the independent service can publish secret S, which completes the borrower's recovery transaction.
  - Otherwise, until a recovery confirms, the lender's pre-signed default transaction can still win. It becomes valid once Bitcoin's median time past passes D plus 3 days, because Bitcoin cannot see that the loan was repaid on Base.
  - The borrower's long-stop transaction becomes valid 10 days after D and needs no secret. Whichever spend confirms first wins.
- So the borrower can lose the collateral despite repaying. The guide calls this a recorded residual risk: a refunded balance is not a settled loan, and repayment followed by lender silence is not borrower default. Even with the fallback, the borrower only gains an earlier competing route, not a guarantee.
- Pages: 6, 7. Confidence: high.

**6. Which points does the design record as unresolved, and how does it treat them?**
The guide lists nine open questions:
1. Whether the lender must approve the final terms, which conflicts with "no second lender approval".
2. Whether there are 12 or 18 terminal packages.
3. What to do when no signed fee rate is high enough: pick the highest rate and alert for manual approval, or fail closed.
4. Whether the fee of a pending activation can rise through already-signed tiers or only through a child transaction.
5. Who relays the borrower long-stop and the cooperative transactions.
6. Whether the Base contract has an on-chain pause.
7. Whether a single upgrade key during the beta is allowed.
8. What happens when an unused reservation expires: simple expiry, or cancellation plus a block and an infraction.
9. Whether the local demonstration must also prove a browser-extension wallet.

**How they are treated:** the guide says they are "recorded as undecided in their technical owners" and that it "does not settle them". For each one it sets out the conflicting statements in the technical records and points to the relevant domain guide. Several are also flagged where they come up in the walkthrough (pages 4, 5, 6).

The lender-silence collateral risk is a known, recorded risk rather than an open question. Legal classification of the fallback is placed outside the design.

Pages: 8, 9 (also 4, 5, 6, 7). Confidence: high.

**7. How must a security threat be described, and why is checking each credential alone not enough?**
- The guide only partly answers this. It says the system cannot make a combination of compromises safe "merely because each stolen piece looks harmless alone". So the security records analyse realistic combinations and name one owner for each. Its example is a shared frontend compromise during both participants' unlocks.
- That is why checking each credential in isolation is not enough: harm comes from combinations.
- It does not give any required format or template for describing a threat, and says nothing more on the subject.
- Page: 7. Confidence: medium on the reason, low on "how it must be described".

**8. How does every part know it is dealing with the same loan, and what does that reference not do?**
- Every domain identifies the loan by one canonical set of loan terms and its hash. The terms bind:
  - the participants, the selected offer revision and the reservation;
  - amounts and deadlines;
  - the loan's Bitcoin public keys and the payout destinations;
  - the Base protocol addresses and fixed recipients;
  - the hashes of secrets X, Y and, when committed, S.
- A separate deployment manifest binds facts about the environment: chains, contracts, the USDC asset, the Bitcoin network, timing policy and upgrade authority.
- Any artifact naming the wrong loan, chain, asset, key, destination or version is rejected. Workspace copies cannot redefine committed terms.
- **What it does not do:** a matching identifier proves which agreement an artifact describes, but it does not authorize a spend. The loan terms domain "binds; it never moves value".
- Pages: 5 (also 2, 3). Confidence: high.

**9. If someone steals a signed default transaction prepared for the lender, what can they do, and where would the Bitcoin go?**
- The guide never discusses this case directly; this answer is pieced together from general statements.
- Pre-signed transactions each have a fixed destination, and a signed transaction cannot be redirected. So a thief could at most broadcast it, and the Bitcoin would go to its fixed destination, which is presumably the lender's payout destination bound in the terms. The guide never states the default transaction's destination explicitly.
- Bitcoin accepts it once median time past passes D plus 3 days, "whether or not the loan was repaid on Base". After that point, a thief could broadcast it in a race against the borrower's recovery or long-stop transaction, and the first to confirm wins. Before D plus 3 days it is not valid.
- The guide says the lender exports and broadcasts default transactions and the organization does not, while the application stores signed transactions in its archive. It does not say where default transactions are kept or how they are protected.
- Pages: 2, 5, 6, 7. Confidence: medium that the destination is fixed and timing as described; low on the theft scenario itself, which is not covered.

## Confusing points, unexplained terms and gaps

**Terms used before being explained, or never explained:**
- "Long-stop" first appears on page 5 and is only explained on page 7.
- Never defined: "median time past", "relative timelock", "mempool", "fee-bump child" or "child transaction", "terminal transactions" versus "terminal packages", "infraction", "operator surface", "counsel approval", "protection expiry" (in the offer on page 1, never explained), and "cooperative settlement" transactions (they appear only in the open questions).
- Several destination terms are used without saying how they relate: "fixed recipient", "payout destination", "frozen refund recipient" and "Vault payment account".

**Confusing:**
- The 18-package list on page 8 says "six lender recovery", while the rest of the guide calls the lender's route the "default" transaction.
- The "Choices" section refers to "the user" and "the agent", which look like leftovers from the design process. It is unclear who they are.
- Page 3 is mostly blank after the walkthrough introduction.
- Several numbers are stated without rationale: the 67-hour margin, the six fee rates and the timing gaps of D+2, D+3 and D+10 days. The default becoming valid one day after the claim cutoff, regardless of repayment, is surprising and only explained through the open-risk framing.

**Expected but not found:**
- What happens to in-flight loans and on-chain deadlines during a long outage.
- What happens if the lender does not fund within the 24-hour window.
- Any discussion of a fall in the collateral's value; liquidation is excluded but nothing else is said.
- Interest or fee structure beyond "total amount owed".
- Which data providers are used and how many must agree.
- A threat-model format, and how stored signed transactions such as the default are protected.
- What happens if a participant loses their Vault (only the forgotten password is mentioned).
- How S is committed.
- What workforce operators can actually request.
- Who in practice performs the "anyone can return the repayment" step.
