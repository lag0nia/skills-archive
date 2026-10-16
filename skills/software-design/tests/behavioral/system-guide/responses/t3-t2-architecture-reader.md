**How I read it:** Reading with the `pages` parameter failed because `pdftoppm` is not installed. Reading the file without `pages` worked and returned the whole document, which is 10 pages long. I opened nothing else and ran no commands.

## Answers

**1. Who has the final word on whether the Bitcoin and the USDC moved?**
- **Bitcoin collateral:** Bitcoin consensus decides. That covers confirmations, timelocks, reorganizations and "which single spend finally wins". The only proof that collateral was returned or taken is "the confirmed Bitcoin spend of the escrow". A published secret, a broadcast or a Base refund never proves that Bitcoin moved (pp. 2, 6, 8).
- **USDC:** The Base contracts decide funding, acceptance, repayment, the claim and the fixed refunds. In the design these belong to the Base USDC Settlement And Funding domain. A USDC outcome counts only as a *finalized* Base event, meaning its block has reached finality on Ethereum, about 20 minutes later. The Base Observation domain decides when an event is final enough to use elsewhere, but it "reports facts and never creates them" (pp. 3, 6, 7).
- In both cases the final word sits with the chains, not with the application. The workspace has no chain truth of its own (p. 6).
- Confidence: high.

**2. What can the company do with the borrower's Bitcoin collateral?**
Very little.
- It holds no key to the collateral, never sees an unrevealed secret and has no custody (pp. 1–2).
- Its fee wallets can only pay network fees for transactions whose effect is already fixed (p. 1).
- Its Bitcoin operations do three things (p. 5):
  - build the fixed pre-signed transactions;
  - insert the now-public X into a signed activation transaction and broadcast it;
  - insert the now-public Y into the borrower's already-signed return transaction and broadcast it.
- It does not broadcast default transactions; the lender does that (p. 8).
- There is no liquidation in V1 (p. 2).
- Workforce operators can only request operations the design already permits (p. 2).
- The company cannot override the fallback service (p. 9).
- Refunds before activation do not depend on any company decision (p. 8).
- Confidence: high on the limits. Medium on whether that is everything it does, because the details are in the Bitcoin Authorization domain guide, which I did not have.

**3. What happens to loans in progress during a full hosting outage?**
- A Cloudflare-wide outage stops everything at once: the product, the Vault, the API and database, Base observation, Bitcoin automation and the operator tools. The chains keep running. The application accepts no new consequential command and claims no new chain result (p. 7).
- When service returns, the system replays and reconciles Base and Bitcoin, then resumes its pending jobs. Jobs survive because each one is committed together with its state change, and a scan every minute picks up anything interrupted (p. 7).
- There is no live fallback to another provider and no recovery-time or data-loss objective. Encrypted backups outside Cloudflare protect the completed transaction packages, not the running service. This is recorded as a deliberate simplicity trade-off (pp. 7, 9). The guide also says plainly that it cannot keep the application running through such an outage (p. 8).
- **Only partly answered:** the document does not say what happens if a deadline (D, C, or the D+3 or D+10 timelock) passes during an outage. It also does not say whether participants can act without the product while their Vault is down.
- Confidence: high on what is stated; low on that gap.

**4. What does this version deliver, and what does it not claim?**
- **Delivers:** a local demonstration. A developer starts or resumes the whole isolated system with one command and completes a representative loan through normal repayment and confirmed collateral return (pp. 2, 7). There is also deterministic local verification, but that is "verification only", not a runnable product (p. 7).
- **Does not claim:**
  - Testnet and mainnet: no deployment claim. Each needs its own credentials, funded wallets, contract deployment and evidence.
  - Production: no activated operation. Activation needs monitoring, incident response, paid services, legal and security gates, and a deliberate enablement (p. 7).
  - The fallback service is not active. It waits on legal counsel's approval and implementation evidence (pp. 1, 9).
- V1 also leaves out public or multi-lender matching, pooled capital, company custody, automatic deployment of lender capital and liquidation (p. 2).
- The document calls these "profiles" and "gates", not "stages".
- Confidence: high.

**5. Borrower repays in full and on time, but the lender never claims.**
- **USDC:** At C (D plus 2 days) the claim is disabled forever, and anyone can trigger the fixed refund of the repayment to the borrower (pp. 2, 8).
- **Bitcoin:** It can go back to the borrower in only three ways (p. 8):
  - the fallback secret S, which is not yet active;
  - the borrower's long-stop transaction, valid from D plus 10 days;
  - a cooperative settlement that both participants sign.
- The lender's pre-signed default transaction becomes valid at D plus 3 days, so it can win the collateral before the long-stop matures, even though the borrower repaid. The design lists this among the things it "cannot guarantee" (pp. 2, 8).
- The worst case, then, is that the borrower gets the USDC back but loses the Bitcoin.
- Confidence: high.

**6. What does the design record as unresolved, and how does it treat it?**
Four conflicts between its own sources are "recorded and remain undecided" (p. 9):
- **Lender approval of final terms:** one record says no second lender approval is needed; the detailed terms records require both participants to approve.
- **Fee rate when no tier is high enough:** one text uses the highest pre-signed rate, flags a separately approved fee bump and alerts; another describes a fail-closed "no eligible tier" result.
- **Number of exit transactions:** eighteen in the package contract and flows, versus a "twelve-package exit phase" in one archive rule.
- **Base contract pause and beta upgrade key:** one source says there is no pause and one dedicated key owns upgrades; the deployment state record lists a pause state and treats a single unrestricted upgrade key as invalid.

How it treats them:
- It states both sides and does not pick one.
- It says no implementation question is open in the backlog. What stays open is these conflicts plus the gates that later claims depend on: activating the fallback service and deploying beyond the local demo (p. 9).
- It does not say who resolves the conflicts, by when, or whether they block the demonstration. The domain map has a related gap: four of the five domain boundaries were never presented to the approver (p. 9).
- Confidence: high on the list; medium on the treatment, since the document says little beyond "undecided".

**7. How must a threat be described, and why is checking each credential alone not enough?**
- Threats are recorded by compromised capability and lifecycle state, not by a severity word (p. 8).
- Combinations that collapse into one shared failure need explicit attention. The design splits authority so that no single holder can complete a consequential outcome alone (p. 6). One compromise that captures several capabilities defeats that split. The document's example is one compromised front end capturing both participants (p. 8).
- After an incident, the first question is which capability was compromised. A password reset or an application status never proves that a key, a chain outcome or another capability changed (p. 8).
- The combination analysis lives in the technical architecture record, which I did not have.
- The document does not use the word "credential" here. It gives only one combination example, plus the related point that all components share one provider (p. 7).
- Confidence: medium-high.

**8. How does every part know it is dealing with the same loan, and what does that reference not do?**
- Reserving an offer atomically creates a stable loan identity (p. 4).
- The canonical loan terms (LoanTermsV1) are an ordered, versioned value. Their hash, `terms_hash`, binds the exact encoded content: the participants, offer revision and reservation, amounts and deadlines, Bitcoin keys, payout destinations, Base contract addresses and recipients, and the hashes of X, Y and S (p. 5).
- A separate deployment manifest (ProtocolDeploymentV1) identifies the environment, so loan facts and environment facts cannot be mixed under one label (p. 5).
- Every domain checks its work against these terms. Anything with the wrong loan, chain, contract, asset, key, destination or version is rejected. An amendment produces a new candidate and invalidates earlier approvals (pp. 3, 4, 6).
- **What it does not do:** neither the terms nor the manifest is a wallet, a key, a source of funds or a chain fact (p. 5). The terms domain "decides meaning, not money or keys" (p. 3). The participant's identities (Bitcoin key, Base account, payout destinations, Vault payment account) stay distinct. Reusing one in a new loan needs fresh approvals and never rewrites an earlier loan (pp. 5–6).
- Not explained: the hashing and encoding method, and how the loan identity created at reservation relates to `terms_hash`, which changes on every amendment.
- Confidence: high.

## Confusing points, undefined terms, and things I expected but did not find

**Confusing**
- "Vault" means two unrelated things: the participant's browser application (capital V) and the funding and repayment vaults, which are Base contracts (p. 2).
- The guide's own narrative quietly takes one side of two of the "undecided" conflicts. It describes both participants approving the terms (p. 4) and eighteen exit transactions (p. 5).
- Mainnet is contradicted. The table says there is no mainnet claim (p. 7), but the upgrade choice mentions a "short mainnet beta" (p. 9).
- Default needs canonical Base facts showing no valid repayment (p. 8). Yet the lender's default transaction can still win after a valid repayment. So that check is only the application's view, not something Bitcoin enforces.
- Production on Cloudflare is described in detail (p. 7), but production is not activated.
- "Each participant signs only their own routes" (p. 5) does not square clearly with how the escrow requires signatures (p. 2).
- It is unclear whether V1 loans are "built with the fallback" at all, since the fallback is inactive.

**Terms used before they were explained, or never explained**
- Used before being explained: "workspace" (p. 3, clarified pp. 6–7), "profile" and "public profile" (p. 6, explained p. 7), and "long-stop" and "cooperative settlement" (p. 2).
- Never explained:
  - "Bitcoin operations", and how it relates to the Bitcoin Authorization domain;
  - "independent Bitcoin observers", and who runs them;
  - "fresh" agreement and "fresh safety check";
  - fee "tier" and "fee bump", and who approves a bump;
  - "relay timeout";
  - "Opener";
  - "workforce operators", and who they are.
- The "specific refund" that unlocks S is linked to the unclaimed-repayment refund only by inference (pp. 2, 3, 8).

**Expected but missing**
- The loan economics: interest, fees, loan-to-value and how much collateral is required.
- Bitcoin price risk.
- Whether the default transaction takes all of the collateral.
- Early or partial repayment.
- Whether the refund at C is triggered automatically.
- Who pays Base fees.
- How participants act alone, without the product, during an outage or near a deadline.
- How the Vault is recovered beyond "cannot recover a forgotten password".
- Who resolves the open conflicts.
- A glossary.
- The threat list itself, and the flow and domain records the guide keeps pointing to.
