I read the whole PDF, all 5 pages, and nothing else. Reading it with the `pages` parameter failed because `pdftoppm` is not installed, so I used the Read tool on the same file without `pages`. That returned all 5 pages as text and page images. I opened no other file and ran no commands.

## Answers

**1. What the lender commits to by publishing, and what is decided later**
- **Committed at publication:** a firm offer is the lender's published proposal for exactly one loan: principal, rate and dates. Publishing it counts as the lender's "standing acceptance" of those commercial values (p.1, p.2 step 1).
- **Decided later:** the lender still decides separately, later, whether to fund the loan and from which wallet (p.2 step 1).
- **Not settled:** whether the lender must also approve the final terms candidate a second time. The document says its sources disagree and calls this an open question (p.3 box, p.4).
- Confidence: high on commitment and funding; the second approval is unresolved by the document itself.

**2. What the borrower has when an offer is reserved**
- The borrower has an atomic, exclusive selection of one offer revision. It lasts 24 hours (p.1).
- The reservation assigns a reservation number, creates a stable random loan identity before any loan-specific key exists, and records the "commercial draft" (p.1, p.2 step 2).
- A second borrower selecting the same offer at the same moment loses and creates no second loan (p.2).
- At that point no keys, secrets, terms candidate or committed terms exist yet. Those come in steps 3–6.
- Partial: "commercial draft" is never defined. The reservation's lifetime is also described in conflicting ways (see the last section).
- Confidence: high (pp.1–2).

**3. What must exist before the final agreement is committed, and what event commits it**
- **Must exist first:**
  - Each Vault has allocated a fresh, never-reused Bitcoin key and returned the loan's public key plus the participant's registered Base address (p.2 step 3).
  - Each Vault has confirmed payout destinations and generated a secret (X for the borrower, Y for the lender), returning only the destinations and the secret's hash (p.2–3 step 4). The document notes this step is a design change "whose implementation has not yet been delivered."
  - Once both results are durably recorded, one complete terms candidate with a version and hash is assembled and shown to both participants in understandable form with their bound identities (p.3 step 5).
  - Each participant has explicitly approved that exact version and hash (p.3 step 6).
  - Approvals that are stale, from the wrong role or wrong loan, mismatched, expired or cancelled are rejected (p.3).
- **Commit event:** "The second matching approval commits the terms exactly once." Concurrent final approvals commit at most once, and repeating a request returns the same durable result (p.3).
- **Caveat:** the open question about lender re-approval directly affects which approvals are required. The document says to read step 6 as written in the "detailed rules" and treat the question as open (p.3, p.4).
- Confidence: high on what is written; medium on the commit event because of that open question.

**4. What happens to existing approvals if a destination is edited before commitment**
- Editing any field the hash covers creates a new candidate version and hash. It invalidates every approval of the earlier version, so both participants must approve the new version afresh (p.3).
- Partial: the document never explicitly lists the fields the hash covers. I infer that destinations are covered for three reasons:
  - The opening paragraph lists destinations among the things all artifacts must agree on (p.1).
  - Destinations are returned in step 4, before the "complete" candidate is assembled (p.2–3).
  - A wrong destination makes consumers reject an artifact (p.4).
- Changing a recipient to a Vault payment account also explicitly needs "fresh approvals" (p.4).
- Confidence: medium-high.

**5. How a single loan's description is kept apart from its environment's, and why**
- **How:**
  - Loan facts live in the canonical loan terms: ordered, versioned agreement data with a terms hash over the exact encoded values (p.1).
  - Environment facts live in a separate, versioned deployment description for each environment. It covers the Base chain and contracts, the USDC asset, the Bitcoin network, the timing policy and the declared upgrade authority, and has its own fingerprint (p.1).
  - Web addresses, credentials, secrets and changing application state are never part of it (p.1).
  - Consumers verify the fingerprint. Base settlement accepts only a loan whose terms and deployment match what the contract records, and observation rejects evidence from the wrong deployment (p.2).
- **Why:**
  - A loan's meaning never depends on how one environment is configured, and a consumer can reject an artifact built for the wrong environment (p.2).
  - The recorded reason is interoperability and verifiability. Divergent encodings, or loan facts mixed with deployment facts, could bind signatures, manifests and chain actions to different loans, or make a package impossible to reproduce (p.4).
- Partial: the document does not say how a loan is tied to its deployment, for example whether the deployment fingerprint is inside the terms hash. Byte layout is deferred to other contracts (p.4).
- Confidence: high.

**6. When a participant's payment wallet can become an address that receives loan money**
- The document's term is "Vault payment account." It can pay for a transfer, but it becomes a recipient only if the participant selects it for a fresh loan's existing recipient field (p.4). That requires all three of:
  - the account's address can be recovered from the participant's backup;
  - the application discloses the account's separate transfer capability;
  - fresh approvals are given.
- It never rewrites earlier loans (p.4).
- Partial: it is unclear whether "fresh loan" means a new loan or one not yet committed, and which recipient fields qualify.
- Confidence: high.

**7. How a cancelled offer can be used again, and what carries over**
- Cancellation ends that reservation for good (p.3).
- If the offer reopens, the next reservation creates a fresh loan identity. The cancelled record keeps its original participants, so no old approvals or signing material can be revived (p.3, p.4).
- Ways it reopens:
  - Operations may cancel and reopen the offer when the transaction cannot progress or appears abusive (p.3).
  - After committed terms with no valid prefund in the window, the offer reopens, that borrower cannot select it again, and the borrower's infraction count rises by one (p.3).
- What carries over is only partly answered. By implication, nothing loan-specific carries over. The document does not say:
  - whether the reopened offer is the same revision with the same commercial values;
  - whether the same borrower can re-reserve after a cancellation by operations;
  - whether new keys and secrets are explicitly required. This is implied by "never-reused" keys and secrets reused only "for the same loan."
- The infraction count does persist in the missing-prefund case.
- Confidence: medium.

**8. What a correct loan identity on an artifact proves**
- "A matching identifier proves which agreement an artifact describes" (p.2). It does not authorize a spend, a signature or a funding decision, and it establishes nothing on either chain (p.2).
- Approving terms likewise grants no signing, custody, funding or chain authority (p.4).
- Every later artifact carries the terms hash, and a consumer that cannot prove the binding treats the artifact as not part of the loan (p.3).
- Partial: the document says "matching identifier," not "loan identity." The loan identity is created at reservation and the terms hash only at the candidate stage. So it is unclear whether the loan identity alone is enough, or whether the committed hash and deployment fingerprint must also match. The rejection rules suggest all of them must bind (pp.3–4).
- Confidence: high on what it does not prove; medium on which identifier is meant.

## Confusing points, terms used before explained, and gaps

**Used before (or without) explanation**
- "Vault" (p.1) is never defined.
- "Base" is assumed to be known as a chain.
- "Secret commitments" (p.1): X and Y are introduced, but their purpose is never explained.
- "Prefund," "escrow," "package," "mempool," "fee-bump," "manifests": "package" also seems to mean both a Bitcoin package and the design package (p.2 vs p.3).
- "Capital-scope record" (p.3) is only explained on p.5.
- Never defined at all: "offer revision," "commercial draft," "public results," "activation," "accepted on Base," "acceptance snapshot," "workspace copy," "detailed rules," "the one permitted switch of the refund recipient," "infraction count."

**Confusing**
- The reservation timeline is inconsistent:
  - it "lasts 24 hours" (p.1);
  - it "stays active until the loan is accepted on Base or ends" (p.3);
  - a mempool prefund "keeps" it, with a 72-hour review (p.3).
- It is also unclear whether a prefund can exist before commitment, since prefunds bind to the committed terms (p.2).
- "Registered Base address" (step 3) vs "Base protocol address" (p.4), and "wallet" (step 1) vs "Vault payment account": are these the same things?
- It is unclear whether the 24h/72h limits belong to the loan terms or to the deployment's "timing policy."
- The lender double-approval question is left open, which weakens the commit rule.
- Step 4 is undelivered, and the document does not say what the current behaviour is.

**Expected but not found**
- The list of fields covered by the terms hash, and the hash or encoding method.
- How the deployment fingerprint is tied to the terms.
- How offers are revised or withdrawn, and what a revision does to an active reservation.
- Who besides operations can cancel a reservation.
- What happens if the lender declines to fund after commitment.
- Any glossary or state diagram.
- Any "deferred" item, even though the section is titled "Open, excluded and deferred" (p.4–5).
