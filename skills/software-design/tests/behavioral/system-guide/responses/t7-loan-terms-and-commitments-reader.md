I read the whole PDF, all 6 pages, and nothing else. The 20-page read with the `pages` parameter failed because pdftoppm isn't installed. A plain Read of the file worked and returned the text and image of every page. Page 6 only lists other guides and technical records.

## Answers

**1. What does a lender commit to by publishing an offer, and what is decided later?**
- **What publishing commits to:** a firm offer is the lender's published proposal of the commercial values for one loan. Publishing it is "the lender's standing approval of those commercial values" (p1). The normal case says the offer is to lend a fixed amount of USDC against Bitcoin collateral (p2).
- **What it is not:** in the detailed records, publishing is not agreement to the final terms (p3).
- **What is decided later:**
  - which borrower takes the offer (the reservation);
  - each side's per-loan Bitcoin key and Base protocol address;
  - each side's Base recipient address and external Bitcoin destination;
  - the X and Y secret commitments;
  - the full candidate terms and their hash, which both sides then approve (p3).
  - Whether and when the lender actually funds also comes later. The lender keeps that choice even after the terms are committed (p4).
- **Gaps:**
  - The records disagree on one step. The architecture, selection and offer/reservation interface records say reservation creates the loan without a second lender approval. This is unresolved (p3, p5), so whether publishing is the lender's only approval is open.
  - The document never lists which fields count as "commercial values".
- Pages 1, 2, 3, 4, 5. Confidence: **medium**, because of the dispute and the missing field list.

**2. What does a borrower have at the moment an offer is reserved?**
- In one atomic step the borrower gets:
  - the offer held for them for 24 hours;
  - the loan's permanent random identifier;
  - an open commercial draft;
  - a reservation number. Each later reservation of the same offer gets the next number, never a reused one (p1, p3).
- What they do not have:
  - agreed final terms. Their selection is not yet agreement to final terms (p3).
  - any custody of or authority over the lender's capital (p4).
- The same dispute applies: some records say reservation already creates the loan (p3).
- Pages 1, 3, 4. Confidence: **high** on what is created, **medium** on its legal weight.

**3. What must exist before the final agreement can be committed, and what exact event commits it?**
- **Prerequisites (p1–p3):**
  - A live reservation, not expired or cancelled. Cancellation blocks commitment (p4).
  - Allocation results from both Vaults: a fresh per-loan Bitcoin public key and the existing Base protocol address, bound to the Vault revision the application has acknowledged.
  - Preparation results from both Vaults: a Base recipient address, an external Bitcoin destination, and the hash of the role's secret (X for the borrower, Y for the lender).
  - One complete candidate version of the terms and its hash, assembled by the coordination service and shown to both participants in an understandable form.
  - An explicit approval from each participant of that exact version and hash.
  - For loans created after the independent validation service is approved for production, a commitment to its secret S, fixed before any Bitcoin transaction is signed (p2).
- **What blocks it:** a missing or stale allocation or preparation result, a key not bound to the loan and the acknowledged Vault revision, or a destination on the wrong network (p3).
- **The committing event:** the second matching approval. That approval, the creation of the immutable agreement and its commitment happen in one transaction, exactly once (p3).
  - An identical repeated approval returns the existing record.
  - A changed resubmission is rejected.
  - Two approvals arriving at the same moment are serialized, so the agreement still commits only once.
- **Gap:** the records disagree on whether S, the offer and the reservation are inside the hashed terms (p2, p5).
- Pages 1, 2, 3, 4, 5. Confidence: **high** for the sequence in the detailed records, **medium** overall because of the dispute.

**4. What happens to approvals already given if a destination is edited before commitment?**
- Destinations (the fixed Base recipient addresses and the external Bitcoin payout destination) are part of the terms (p1–p2).
- Any change to a field covered by the terms hash creates a new candidate version and hash. Every earlier approval becomes invalid, and both participants must approve the new version (p3).
- Changing a destination does not create a new secret; the Vault reuses the existing one (p3).
- An approval naming a different version or hash is rejected (p3).
- Pages 1, 2, 3. Confidence: **high**.

**5. How is the description of a single loan kept apart from its environment, and why?**
- **How:**
  - There is a separate deployment description: one strictly versioned document per environment (production, test or local).
  - It identifies the Base chain, the loan contract and its code, the USDC token, the Bitcoin network, the uniform timing and policy settings, and who may upgrade the contract.
  - It carries a fingerprint computed over its canonical form. It contains no URLs, credentials, application settings, per-attempt data or secrets (p2).
  - Per-loan facts go only in the terms. Facts that repeat for every loan go in the deployment description. Per-attempt facts (funding sources, transaction IDs, packages) stay outside both (p5).
- **How it is enforced:**
  - The Base contract accepts only matching terms and deployment, and the Base observer rejects evidence from the wrong deployment (p2).
  - Every consumer rejects a changed fingerprint, a wrong chain, contract, token or network, or a mixed environment (p4).
- **Why:** interoperability and verifiability. If per-loan facts were mixed with environment facts, signatures, deployment descriptions and chain actions could bind to different loans, or a package could become impossible to reproduce. The user specified this split and approved the final field list (p5).
- **Gap:** the document does not say how a loan's terms point to their deployment, for example whether the terms or their hash include the deployment fingerprint.
- Pages 2, 4, 5. Confidence: **high** on the split and the reason. The link between the two is not covered.

**6. When can a participant's payment wallet become an address that receives loan money?**
- The document calls this the "Vault payment account". It is a distinct identity from the per-loan Bitcoin key, the Base protocol address and the payout destinations. It can pay an eligible transfer, but it never silently becomes a loan recipient or the address that makes protocol calls (p4).
- **The origination flow allows it only when all of these hold:**
  - it is chosen as a recipient for a new loan;
  - the account is recoverable;
  - the product discloses its separate participant-transfer capability;
  - the choice goes through the normal fresh approvals.
- Existing terms stay unchanged (p4).
- **Conflict:** the architecture record and the lender authorization record say a payment account is never a term-bound recipient. The document says this is unresolved (p4, p5).
- "Recoverable" and "participant-transfer capability" are not defined.
- Pages 4, 5. Confidence: **medium**. The answer is disputed, and I am assuming "payment wallet" means the payment account.

**7. After a reservation is cancelled, how can the offer be used again, and what carries over?**
- **How it is reused:**
  - Cancellation is terminal and kept as history, and it blocks commitment and package construction.
  - Reopening the offer needs the next reservation number and a fresh loan identifier, so no earlier approval or signature can be revived by a retry (p4).
  - If the borrower sends no prefund in time, the application itself cancels, reopens the offer, blocks that borrower from the same offer, records exactly one infraction and notifies both participants.
  - If operations cancel and reopen by hand after 72 hours stuck in manual review, no automatic infraction is added (p4).
- **What carries over**, as far as the document says:
  - the offer itself;
  - the cancelled reservation as history;
  - in the no-prefund case, the borrower's block and the infraction.
- **What does not carry over:** approvals and signatures.
- **Gaps:**
  - The document does not say whether per-loan keys, X/Y secrets or destinations carry over. Secrets are reused "for this loan", and a fresh loan identifier suggests new ones, but that is not stated.
  - It does not say whether the offer revision stays the same.
- Pages 1, 4. Confidence: **high** on how, **low** on what carries over.

**8. What does an artifact carrying the correct loan identity prove?**
- It only proves which agreement the artifact describes. It does not authorize anyone to spend, fund or move anything, and it does not prove that anything happened on a chain (p2).
- Related limits:
  - A recorded approval is not a Bitcoin signature, wallet authority, Base transaction authorization or proof outside the application (p4).
  - An acceptance snapshot, workspace copy or display of the terms is a presentation copy only (p4).
- Pages 2, 4. Confidence: **high**.

## Confusing points, terms used before explained, and gaps

**Confusing or contradictory**
- Page 1 says publishing is the lender's "standing approval" of the commercial values. Page 3 says publishing was not agreement to final terms. The two can be reconciled, but only with care, and the open approval dispute makes it worse.
- "Matching identifier or hash" proves which agreement (p2). The loan identifier seems to stay the same across amended versions, so an identifier alone may not pin down a version. The document doesn't say whether the identifier changes on amendment.
- Page 2 says the loan's binding "carries" the S commitment. Page 5 says the encoding contract keeps S, the offer and the reservation out of the hashed field list.
- "Within the 24-hour reservation" (p4) is unclear. It seems to mean 24 hours from reservation, so allocation, preparation, approval and prefund would all fit in that window.
- The reservation "stays open until Ana later accepts the funded loan" (p3), yet it lapses after 24 hours without a prefund. How the two fit together is not spelled out.

**Terms used before or without explanation**
- "prefund" (p3–p4)
- "activation" / "active loan" (p4)
- "Vault revision the application has acknowledged" (p3)
- "package" / "package construction" (p2)
- "independent validation service", "production gate", and "fallback secret" (p5), which seems to be S
- "offer revision" (p1)
- "commercial draft" compared with "candidate version"
- "acceptance snapshot"
- "eligible transfer", "participant-transfer capability", "recoverable"
- "manual review", "infraction"
- The introduction promises to explain "which secrets unlock which steps", but X, Y and S are never explained beyond being committed.

**Expected but missing**
- The actual field list and encoding.
- Which "commercial values" the offer fixes.
- What the deadlines are, and how debt is calculated.
- How offers are revised or withdrawn.
- How long the participants have to approve.
- What happens if the lender never funds after commitment.
- The consequences and duration of an infraction or a borrower block.
- How terms reference their deployment description.
- Names of the other four domains.
- The repayment and default flow.

Several details are deferred to records that aren't included: the domain record, the responsibility record, and the LoanTermsV1 and ProtocolDeploymentV1 interface contracts.
