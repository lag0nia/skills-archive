I read the whole PDF. It has 6 pages. Reading with the `pages` parameter failed because a rendering tool (pdftoppm) is missing, so I read the file in one go without that parameter, and all 6 pages came through. I opened nothing else and ran no commands.

## Answers

**1. What does a lender commit to by publishing an offer, and what is decided later?**
- **What publishing commits to:** a firm offer is the lender's proposal for exactly one loan. Publishing it records the lender's standing approval of the commercial values: principal, total debt, collateral amount, repayment deadline and an optional protection expiry (p1).
- **What is decided later:**
  - Keys, destinations and secret commitments are not part of the offer. Each participant's Vault prepares them after the offer is reserved (p1, p3).
  - Even after the terms are committed, the lender separately decides whether and when to deploy capital (p4).
- **Not settled by the document:** whether the lender must give a second approval of the exact final terms. The document records this as an open conflict between its source records (p5). Some records say publishing is the lender's standing acceptance and that no second commercial approval is needed. Others say publishing approves only the commercial values and that the lender must also approve the exact final terms. The normal case (p3) follows the second version, but the document says which one governs is undecided.
- **Pages:** 1, 3, 4, 5.
- **Confidence:** high on what publishing commits to; low on whether a later lender approval is needed, because the document leaves it open.

**2. What does a borrower have at the moment an offer is reserved?**
- **What the borrower has:**
  - an atomic selection of one revision of the offer, which succeeds for exactly one borrower;
  - a stable, random loan identifier;
  - a 24-hour hold on the offer for that borrower (p1, p3).
- **What exists alongside it:** the reservation gets a number from a per-offer counter (p4, p5).
- **What the borrower does not have yet:**
  - No loan-specific keys: the identifier is created "before any loan-specific key is derived" (p3).
  - No candidate or committed terms.
- **How long it lasts:** the reservation stays open until the borrower's acceptance on Base is final. Committing the terms does not consume it (p3).
- **Pages:** 1, 3, 4, 5.
- **Confidence:** high.
- **Gap:** the document does not say what rights the borrower has during the hold beyond this. It also does not explain how the 24-hour hold fits with the reservation staying open until acceptance on Base.

**3. What must exist before the final agreement can be committed, and what exact event commits it?**
- **What must exist first (p3):**
  - A reservation.
  - Both Vault results from each participant, which are:
    - the loan's keys, reported in public form only after the encrypted Vault snapshot holding them has been acknowledged;
    - confirmed public destinations and the hash of that participant's secret.
  - The application accepts these results only if they name the right loan, network, current Vault revision and the participant's registered identities.
  - From these, one complete candidate version of the terms and its hash, shown to both participants in understandable form.
  - Explicit approval of that same candidate version and hash by both the borrower and the lender.
- **What else is checked:** the rejection list implies a supported, unmodified deployment manifest that matches the live deployment (p3).
- **The exact event:** the second matching approval. It commits the terms atomically and exactly once. Two simultaneous final approvals commit at most once, and retries return the same durable result (p3). After that the terms cannot change, and the committed terms record with its hash is the proof.
- **Caveat:** the lender's final-approval step is the open conflict from Q1 (p5).
- **Pages:** 3, 5.
- **Confidence:** high for the event; medium for the full list of prerequisites, given the open conflict.

**4. What happens to approvals already given if a destination is edited before the agreement is committed?**
- **Answer:** they are all invalidated. Destinations are fields in the terms: each participant's external Bitcoin destination and fixed Base recipient (p1–2). The terms hash covers the exact encoded terms (p2). Any change to a hashed field creates a new candidate version and hash and "invalidates every earlier approval" (p3). Both participants must then approve the new version.
- **Related rule:** changing the agreement before the loan activates needs a later validated version with two fresh approvals and fresh dependent artifacts (p3).
- **Pages:** 1–2, 3.
- **Confidence:** high.
- **Gap:** the document does not describe how a destination gets edited, or who may do it.

**5. How is the description of a single loan kept apart from the description of the environment it runs in, and why?**
- **How:** they are separate artifacts.
  - The loan terms are per-loan, ordered, versioned data with their own hash (p1–2).
  - The deployment manifest is one strictly versioned document per environment: production, test or local.
    - It identifies the Base chain, the loan contract and its code, the USDC asset, the Bitcoin network, the uniform timing policy and the declared upgrade authority.
    - It carries a fingerprint of its own content.
    - It explicitly excludes per-loan or per-attempt facts, secrets, service addresses, credentials and application settings (p2).
- **Why:**
  - Mixing the two, or encoding them differently in different places, could bind signatures, manifests and chain actions to different loans, or make a package impossible to reproduce (p2, p4).
  - Configuration kept separately for Base, Bitcoin, Vault and the API could allow a cross-domain mismatch that is hard to detect after funds move. One strict, fingerprinted manifest gives every environment-bound consumer one reviewable identity (p4–5).
- **Pages:** 1, 2, 4, 5.
- **Confidence:** high.
- **Gap:** the intro says the agreement records "which deployment environment it belongs to" (p1), and the Base contract accepts only loans matching the pinned terms and deployment (p2). But the field contract lists no deployment or manifest field, so the document does not say how a loan points to its manifest.

**6. Under what conditions can a participant's payment wallet become an address that receives loan money?**
- **Assumption:** "payment wallet" here means the document's "Vault payment account".
- **Conditions (p4):** it can be chosen as the value of a recipient field only:
  - on a fresh loan;
  - if it is "recoverability-qualified";
  - with explicit role authorization;
  - with fresh approvals;
  - with a separate disclosure of its transfer capability.
- **Limits:** historical terms never change, and a payment source never changes a recipient fixed in the terms (p4).
- **Pages:** 4.
- **Confidence:** high on the conditions.
- **Gap:** "recoverability-qualified" is never defined, so I cannot say what that condition actually requires.

**7. After a reservation is cancelled, how can that offer be used again, and what carries over?**
- **How the offer returns:**
  - When the 24 hours end with no valid prefund, the reservation is cancelled and the offer becomes available again automatically (p4).
  - In the stuck-prefund case (unconfirmed for 72 hours), operations may cancel and reopen the offer by hand, with no automatic infraction (p4).
- **What a reopened offer gets:** reopening creates the next reservation number and a fresh loan identifier. The old identifier is never reused (p4).
- **What carries over:**
  - The cancelled reservation's history is kept, and cancellation is final for that reservation (p4).
  - The per-offer reservation counter continues, which is how history is preserved when an offer returns (p5).
  - In the no-prefund case, the borrower stays permanently blocked from that offer and gets one infraction (p4).
- **Not stated:**
  - whether the lender's standing approval or the same offer revision carries over;
  - what happens to keys, Vault results, secrets or approvals from the cancelled attempt (a new identifier suggests a new loan, but this is not stated);
  - whether a borrower is blocked after a manual cancellation by operations.
- **Conflict in the records:** for a reservation that runs out before the terms are committed, one record calls this simply "expiring" rather than a cancellation with an infraction. The document says the records do not decide which applies (p4).
- **Pages:** 4, 5.
- **Confidence:** medium.

**8. What does it prove when an artifact carries the correct loan identity?**
- **Answer:** it proves which agreement the artifact describes, and nothing more. It "never authorizes a spend or establishes a chain outcome" (p1).
- **Related point:** a workspace copy or acceptance snapshot of the terms is a record, not a second authority over what the terms mean (p4).
- **Pages:** 1, 4.
- **Confidence:** high.
- **Gap:** the document does not make clear whether "loan identity" means the loan identifier, the terms hash, or both.

## Confusing, unexplained or missing

**Terms used without explanation or before being explained:**
- "Vault", "encrypted Vault snapshot" and "Vault revision" (used from p1).
- "prefund", "escrow", "package" and "package manifest" (p2).
- "secret X", "secret Y", "third secret S" and "optional fallback".
- "protection expiry" (p1). Its connection to a protection or put-option provider only appears on p5.
- "recoverability-qualified".
- "activation" and "borrower's acceptance on Base is final".
- "infraction": its consequences are never described.
- "offer revision": how an offer is revised is never described.
- "supersession": named as something the domain owns (p2), but its rules never appear.
- "uniform timing policy".

**The six identities (p4):** the document lists six identities that must stay distinct but never defines them. One of them, the borrower's "repayment-refund recipient", does not appear in the field contract on p1–2.

**Confusing points:**
- The reservation "holds the offer … for 24 hours" (p1) but also "stays open until the borrower's acceptance on Base is final" (p3). How these fit together is unclear.
- The document references records I don't have: the offer ticket, the loan terms binding contract and the selection records.
- The document flags three internal conflicts itself:
  - whether the lender gives a second approval;
  - whether running out before commitment is an expiry or a cancellation;
  - what the terms contain. Some records include the offer revision, reservation number and hash of S; the field contract does not. Participant references are also described both as random per-loan values and as real account identifiers.

**Expected but not found:**
- How the terms point to their deployment manifest.
- Whether a lender can withdraw or revise an offer while it is reserved.
- Any time limit on approvals before commitment.
- What the lender does after commitment to fund the loan.
- What happens to Vault-prepared keys and secrets after a cancellation.
- The actual encoding of the terms, which is deferred to a separate contract.
