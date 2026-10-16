I read all 5 pages of the PDF and nothing else. The Read call with `pages` failed because pdftoppm is not installed. Read without `pages` worked and returned the whole document.

## Answers

**1. What does a lender commit to by publishing an offer, and what is decided later?**
- **Publishing:** the firm offer records the lender's proposed commercial values for one loan. Publishing it is the lender's "standing approval" of those commercial values only.
- **Final terms:** whether the lender must also approve them later is an explicit, undecided open question. The records disagree:
  - Some say publication is standing acceptance and reservation needs no second lender approval.
  - Others say borrower and lender each approve the exact final candidate.
- **Decided later in any case:**
  - The loan-specific keys, the destination addresses and the secret hashes.
  - Even after the agreement is committed, whether and when the lender actually funds.
- Pages 1, 4, 5. Confidence: high on what publishing means, medium on the later lender approval, because the document itself says it is unsettled.

**2. What does a borrower have at the moment an offer is reserved?**
- A reservation of that one offer revision. It is made atomically and cannot be won twice.
- A stable random loan identifier.
- A durable commercial draft.
- Nothing is final yet: the reservation neither approves nor commits the bound terms.
- Caveat: some records say reservation "binds the canonical terms" or "creates the canonical loan", which is part of the open question.
- Pages 1, 2, 4. Confidence: high.

**3. What must exist before the final agreement can be committed, and what exact event commits it?**
- **Prerequisites:**
  - The reservation, which provides the loan identifier.
  - Allocation: each Vault has returned its public Bitcoin key and Base protocol address, after its state was saved and acknowledged, and the Base address matches the participant's registered identity.
  - Preparation: each participant has confirmed destination addresses, and each Vault has returned its secret hash (the borrower's for X, the lender's for Y).
  - One complete candidate version of the terms with its exact hash, validated by the core service and shown to both participants with their bound identities.
- **Commitment event:** the second matching approval of that same candidate version and hash commits it, exactly once.
- Caveat: this follows only "the detailed records". Other records say the lender gives no second approval, and the document says the question is not settled.
- Pages 2, 3, 4, 5. Confidence: high on the sequence as written, medium on the commitment event.

**4. What happens to approvals already given if a destination is edited before the agreement is committed?**
- Any change to a hashed field creates a new candidate version and hash and invalidates every earlier approval, so fresh approvals are needed.
- The document never says outright that destination addresses are hashed fields. I am inferring it from two points: the terms must agree on addresses (p. 1), and switching a recipient to a Vault payment address requires "fresh approvals of the candidate" (p. 4).
- Pages 1, 3, 4. Confidence: medium-high.

**5. How is the description of a single loan kept apart from the description of the environment it runs in, and why?**
- **How:**
  - The loan terms are ordered, versioned agreement data for one loan, with a terms hash.
  - The deployment description is a separate strict document, one per environment (production, test or local). It identifies the Base chain, contract, code and USDC asset, the Bitcoin network, the timing policy and the declared status of upgrade authority.
  - It leaves out service addresses, credentials, settings, secrets and anything that changes per loan or attempt.
  - Each has its own encoding and fingerprint.
- **Why:**
  - So that different consumers do not sign or process different meanings under the same label.
  - Values fixed for a whole deployment, and data that changes per attempt, should not be copied into every loan's terms.
  - One machine-checkable deployment description stops components from using incompatible fixed values.
  - A database-only identifier would not bind the Base record to the same terms used to build the Bitcoin transactions.
- Consumers reject mixed environments and changed fingerprints.
- Pages 1, 2, 3, 4. Confidence: high.

**6. Under what conditions can a participant's payment wallet become an address that receives loan money?**
- By default it cannot: a Vault payment account can fund a transfer, but it "does not silently become a loan recipient".
- A participant may choose a Vault payment address only for an existing recipient field of a new loan, and only when all of these hold:
  - explicit role authorization;
  - fresh approvals of the candidate;
  - the address has qualified as "recoverable";
  - the separate transfer capability has been disclosed.
- Historical terms never change.
- Page 4. Confidence: high on the conditions. What "recoverable" means is never defined.

**7. After a reservation is cancelled, how can that offer be used again, and what carries over?**
- Cancellation ends that reservation for good. The offer can be taken again only through a new reservation with a new loan identity.
- Old approvals and old signing material never carry over or revive, even through an apparently successful retry.
- Only partly answered: the document does not say what does carry over. It is silent on:
  - whether the same offer revision stays available;
  - whether confirmed destinations or the participant's existing secret are reused (p. 2 says a Vault "reuses that participant's secret", but not across loans);
  - who can cancel.
- Pages 3, 4. Confidence: high on what does not carry over, low on anything else.

**8. What does it prove when an artifact carries the correct loan identity?**
- A matching identifier proves which agreement the artifact describes. It does not authorize a spend or establish that anything happened on a blockchain.
- Nuance: the loan identifier stays the same across candidate versions. Only a matching terms hash identifies "the same exact agreement", and later artifacts must bind to the committed terms with their hash. So a correct loan identity alone does not prove the artifact matches the committed version.
- The domain decides meaning, not action.
- Pages 1, 3, 4. Confidence: medium-high. The document says "matching identifier" without saying whether it means the loan ID or the hash.

## Confusing points, terms used before explanation, and gaps

**Confusing:**
- The lender-approval contradiction is acknowledged as open (pp. 4–5), but the normal case on p. 2 follows one side of it. A newcomer cannot tell which behaviour is real.
- "Edits" and "before activation, an amendment" sit side by side on p. 3 without saying how they differ.
- The document says "matching identifier" (p. 1) in one place and "terms hash" in another, without saying which is meant.

**Terms used without explanation:**
- "Vault" and the "encrypted Vault state" (pp. 1–2).
- "X" and "Y" in "the borrower's for X, the lender's for Y" (p. 2), and what the secrets are for.
- "Base protocol address" versus "registered identity" (p. 2).
- "Offer revision" (p. 1).
- "Supersession" (p. 2).
- "Pinned deployment" (p. 2).
- "Activation" (p. 3).
- "Expired" draft (p. 3), with no expiry rule given.
- "Recoverable" (p. 4).
- "Durable" result or work.
- "Acceptance snapshot" (p. 4).

**Expected but missing:**
- The actual list of commercial values and term fields: amounts, deadlines, rates.
- Reservation expiry and timing rules.
- Who can cancel, and what happens to the offer while it is reserved or after cancellation.
- What supersession means in practice.
- How a lender's funding decision connects to the committed agreement.

These are presumably in the referenced contracts on p. 5, which the guide points to but does not summarize.
