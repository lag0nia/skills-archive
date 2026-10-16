**Answers from the PDF "Loan Terms And Commitments" domain guide (5 pages)**

I read all 5 pages. Reading with the `pages` parameter failed because pdftoppm is not installed, so I read the file in one call without it. The text and page images of every page came through. I opened nothing else and ran no commands.

## Answers

**1. What a lender commits to by publishing an offer, and what is decided later.**
- **What publishing commits to:** a firm offer is the lender's published proposal for exactly one loan, covering principal, rate and dates (p.1). Publishing it is the lender's "standing acceptance" of the offer. The detailed records limit that approval to the proposed commercial values, and the guide says this point is still open (p.2).
- **What is decided later:**
  - Both participants approve the exact final candidate terms and their terms hash (p.3).
  - Separately, the lender decides whether and when to fund the loan. Committing the terms gives no funding power (p.3, p.4).
- **The unresolved conflict:** some records say there is no second lender approval and that reservation already binds the terms. Others say neither publishing nor reservation commits the final terms, and that the lender must explicitly approve them. The guide says this is undecided (pp.4–5).
- **Confidence:** medium. The facts are clear, but the document says the scope of the lender's commitment is unresolved.

**2. What a borrower has when an offer is reserved.**
- In one atomic step the offer becomes a reservation for that borrower, the loan gets its stable random identifier, and a commercial draft is stored (p.2; the identifier is also on p.1).
- The reservation is identified by the offer plus a counter (p.1).
- A competing selection at the same moment loses, so no second loan exists (p.2).
- The borrower has 24 hours to make a valid Bitcoin prefund before the reservation lapses (p.2).
- The borrower does not yet have committed terms. That needs both approvals (p.3), though one group of records claims reservation already binds the terms (pp.4–5).
- **Confidence:** high for the items listed. Medium on whether anything is "bound" at this point.

**3. What must exist before the final agreement is committed, and the exact committing event.**
- **What must exist first:**
  - Each Vault's allocation result: a fresh, never-reused key for this loan, giving the loan's Bitcoin public key and the participant's registered Base address.
  - Each Vault's preparation result: the confirmed Base recipient, the external Bitcoin destination, and the hash of the participant's secret (X for the borrower, Y for the lender).
  - All of these must be durably recorded for both participants. The application then assembles one complete candidate version with its terms hash, and both participants approve that same version and hash through their signed-in accounts (pp.2–3).
- **The committing event:** the second matching approval commits the agreement exactly once, in the same transaction that records it (p.3). Retries return the same result, and two simultaneous final approvals still commit at most once (p.3).
- **Confidence:** high.

**4. What happens to existing approvals if a destination is edited before commitment.**
- Any change to a value covered by the terms hash creates a new candidate version and hash and invalidates every earlier approval. Both participants must approve again (p.3).
- **Gap:** the document does not explicitly list destinations among the values the hash covers. It implies it: artifacts must agree on destinations (p.1), the pinned terms include fixed recipients (p.2), and a wrong destination is rejected (p.3).
- **Confidence:** medium-high.

**5. How the loan description is kept apart from its environment, and why.**
- **How:**
  - The loan terms are ordered, versioned agreement data, identified by the terms hash (p.1).
  - The deployment manifest separately identifies the environment, carries its own fingerprint, and excludes web addresses, credentials, settings and secrets (p.2). It covers:
    - the Base chain, contract and code;
    - the USDC token;
    - the Bitcoin network;
    - the timing and upgrade policy.
  - Consumers reject a manifest that mixes environments (p.3).
- **Why:** interoperability and verifiability. Divergent encodings, or loan facts mixed with deployment facts, could bind signatures, manifests and chain actions to different loans, or make a package impossible to reproduce (p.4).
- **Why one manifest:** separate per-component configuration could cause hard-to-detect mismatches, and remotely fetched configuration could change without review. The cost is that changing an environment needs a new package version and consumer deployment (p.4).
- **Gap:** the document does not say how the terms reference the manifest, for example whether the terms hash covers the manifest fingerprint.
- **Confidence:** high.

**6. When a participant's payment wallet can receive loan money.**
- I am assuming "payment wallet" means what the document calls the "Vault payment account/address."
- A Vault payment account can pay into a loan without becoming a recipient or a protocol caller.
- A fresh loan may use a Vault payment address as the value of an existing recipient field. This is allowed only through the normal role authorization and fresh approvals.
- Historical terms never change.
- A protocol key or address must never silently become a payout destination.
- All of this is on p.4.
- **Gap:** "normal role authorization" is not explained.
- **Confidence:** medium-high.

**7. Reusing an offer after a reservation is cancelled, and what carries over.**
- Cancellation ends that reservation permanently, and it is kept as history.
- Reopening the offer requires the next reservation number and a fresh loan identifier (p.3; the counter is on p.1).
- In the no-prefund case, the operations domain reopens the offer, blocks that borrower from the same offer, and records an infraction (p.3).
- **What carries over:** only partly answered. Apparently the offer itself and the cancelled reservation's history. The document does not say whether the same offer revision, draft, keys, destinations or approvals carry over. A new loan identifier suggests the earlier loan-bound artifacts do not.
- **Confidence:** medium.

**8. What a correct loan identity on an artifact proves.**
- It proves only which agreement the artifact describes (p.2).
- It does not authorize a spend, transfer or signature, and it does not establish that anything happened on a chain (p.2).
- Likewise, committing the agreement grants no signing, custody or funding power (p.3).
- **Confidence:** high.

## Confusing points, undefined terms, and gaps

**Confusing or inconsistent**
- **The 24-hour clock.** p.2 says the borrower has 24 hours after reservation to prefund. p.3's "No prefund" item counts 24 hours after the terms are committed. p.3's "Unused reservation" item has expiry before commitment. It is unclear when the clock starts and whether it restarts.
- **The 72-hour start point.** The 72-hour manual-review window has no stated starting point.
- **Lender approval.** The normal case shows the lender approving the final terms, but pp.4–5 say it is undecided whether that step exists. This undercuts Q1 and Q3.
- **What consumes the reservation.** "Does not consume the reservation" (p.3) is never followed by what does consume it.
- **"Activation."** "Before the collateral is active" is used without saying what activation is.

**Terms used without being explained**
- Base (only "the loan contract on Base")
- prefund and "the prefund rule"
- "pinned"
- "acknowledged Vault results"
- "allocation results" versus "preparation results"
- "commercial draft" versus "candidate version"
- "Base protocol address" versus "registered Base address"
- "role authorization"
- "workspace copy" and "acceptance snapshot"
- "terms and binding contract" (presumably the LoanTermsV1 interface contract)
- secrets X and Y: their purpose is not explained, only that their hashes leave the Vault

**Expected but missing**
- The actual list of fields in the loan terms
- How the terms link to the deployment manifest
- What happens to the reservation after commitment and after a successful prefund
- What manual review decides
- What happens on default, given that liquidation is excluded
- What an amendment does to an in-flight prefund
- An explicit statement of which values the terms hash covers
