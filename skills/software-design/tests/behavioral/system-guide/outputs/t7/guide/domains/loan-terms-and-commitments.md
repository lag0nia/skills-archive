# Loan Terms And Commitments

This domain gives every part of the system one shared, unchangeable meaning for a loan: who the participants are, how much is lent and owed, the deadlines, where money and Bitcoin may go, and which secrets unlock which steps. The [architecture guide](../architecture.md) shows how the rest of the system relies on that meaning.

## What this domain does

A loan in this system touches many separate artifacts. The borrower and the lender each prepare keys and destinations in their own Vault, the dedicated browser application that holds their secrets. USD Coin (USDC) moves under a loan contract on the Base network. Bitcoin collateral is locked by pre-signed transactions. The application keeps a workspace with the loan's progress. If any of these disagreed about the amount, a deadline or a destination, a signature or a chain action could end up applying to a different loan from the one the participants approved. This domain defines the single agreement they must all match, and gives every consumer a way to prove the match.

It works with a few distinct objects:

- **A firm offer** is a lender's published proposal of the commercial values for one loan. Publishing it is the lender's standing approval of those commercial values.
- **A reservation** is one borrower's atomic selection of one offer revision. It holds the offer for that borrower for 24 hours, creates the loan's permanent random identifier, and opens a commercial draft. It is numbered: each later reservation of the same offer gets the next number, never a reused one.
- **The loan terms** are the complete, ordered and versioned agreement: random per-loan references to the two participants, their Base protocol addresses and fixed Base recipient addresses, principal, debt and deadlines, the Bitcoin collateral, each participant's per-loan Bitcoin public key and external Bitcoin payout destination, and the hash commitments to the borrower's secret X and the lender's secret Y. The **terms hash** binds the exact encoded values, so any change produces a different hash. The selected offer and reservation are tied to the loan through the reservation record and the approvals, which name the exact terms version and hash; the records differ on whether they also belong inside the hashed terms (see the open questions below). For loans created after the independent validation service is approved for production, the loan's binding also carries a commitment to that service's secret S, fixed before any Bitcoin transaction is signed.
- **The deployment description** is separate. It is one strictly versioned document per environment (production, test or local) that identifies the Base chain, the loan contract and its code, the USDC token, the Bitcoin network, the uniform timing and policy settings, and who may upgrade the contract. It carries a fingerprint computed over its canonical form. It deliberately contains no URLs, credentials, application settings, per-attempt data or secrets.

Holding a matching identifier or hash proves which agreement an artifact describes. It does not authorize anyone to spend, fund or move anything, and it does not prove that anything happened on a chain.

## How its responsibilities work together

The domain has one responsibility, [Loan terms, one-loan offer, reservation, and parameter binding](../../system-model/domains/loan-terms-and-commitments/responsibilities/sr-001-loan-terms-offer-reservation-and-parameter-binding.md). It defines the loan's identity and encoding, the candidate versions of the terms, how approvals are counted, when the terms are committed, and how cancellation and replacement work. It also defines the deployment description and how consumers check its fingerprint.

The responsibility depends on other domains for its inputs, and every other domain consumes its output:

- The participant application supplies the offer, the borrower's selection, the participants' identities and their approvals, and stores the workflow records.
- Each participant's Vault supplies the public results of its preparation work: the per-loan Bitcoin public key, the Base addresses, the payout destinations and the secret commitment.
- Bitcoin package construction binds every transaction it builds to the committed terms and their hash.
- The Base loan contract accepts only terms and a deployment that match what it was given, recomputing the terms hash itself rather than trusting a supplied value.
- The Base observer rejects evidence from the wrong deployment.
- Each Vault checks the role and loan binding before it returns a public identity or signs anything.

## A normal case

The following case is illustrative and follows the sequence in the detailed terms records; the note after it explains the one step another record disputes. Ben, a lender, publishes a firm offer to lend a fixed amount of USDC against Bitcoin collateral.

1. **Reservation.** Ana, a borrower, selects Ben's offer. In one atomic step the application reserves it for her for 24 hours, assigns the loan its permanent random identifier, and records a commercial draft. In the detailed records, Ana's selection is not yet agreement to final terms, and Ben's publication was not either.
2. **Allocation.** Ana's Vault and Ben's Vault each set aside a fresh per-loan Bitcoin key for this loan identifier, save their updated encrypted state, and return only public results: the Bitcoin public key and their existing Base protocol address, bound to the Vault revision the application has acknowledged.
3. **Preparation.** Each Vault then confirms where its participant wants to be paid (a Base recipient address and an external Bitcoin destination) and creates its role's secret automatically: X for Ana, Y for Ben. If a secret already exists for this loan, the Vault reuses it; changing a destination does not create a new secret. The Vault returns only the destinations and the hash of the secret.
4. **Candidate.** The application's coordination service assembles one complete candidate version of the terms and its hash, and the product shows both participants an understandable version together with the identities it binds.
5. **Approval and commitment.** Ana and Ben each explicitly approve that exact candidate version and hash. The second matching approval, the creation of the immutable agreement, and its commitment happen in one transaction, exactly once. Repeating an identical approval returns the existing record, while a changed resubmission is rejected; if the two approvals arrive at the same moment, they are serialized so the agreement still commits only once.

From then on, Bitcoin construction and Base setup can begin against these exact terms. The reservation itself stays open until Ana later accepts the funded loan on Base; only then is the offer consumed and no longer available.

> **One step is still disputed in the records**
> The detailed terms records describe the sequence above, in which the lender approves the final terms separately from publishing the offer. A sentence in the architecture record, and similar wording in the selection record and the interface contract for offers and reservations, says that reservation creates the canonical loan without a second lender approval. Both positions trace to user decisions, and neither is recorded as taking precedence; the conflict is unresolved, and this guide does not treat either side as settled.

## Exceptions and recovery

**A change before approval.** Any change to a field covered by the terms hash creates a new candidate version and hash, and every earlier approval becomes invalid. Both participants must approve the new version.

**A rejected approval.** An approval is rejected if it is stale, comes from the wrong role or the wrong loan, names a different candidate version or hash, or arrives after the draft expired or was cancelled. A missing or stale allocation or preparation result, a key not bound to the loan and the acknowledged Vault revision, or a destination on the wrong network also blocks the candidate.

**Cancellation and expiry.** Either participant can cancel before the terms are committed, and an unused reservation expires after 24 hours if no terms were committed and no prefund was attempted. Cancellation is terminal and kept as history; it blocks commitment and package construction. Reopening the offer requires the next reservation number and a fresh loan identifier, so no earlier approval or signature can be revived by a retry.

**A missing collateral deposit.** Once the terms are committed, the borrower must send a valid Bitcoin prefund within the 24-hour reservation. If none arrives, the application cancels the reservation, reopens the offer, blocks that borrower from the same offer, records exactly one infraction, and notifies both participants. A valid prefund that is seen but stays unconfirmed keeps the reservation alive; if it remains stuck for 72 hours, the reservation moves to manual review: the application alerts operations and emails the borrower to raise the fee, without inferring cancellation or an infraction. Operations may then cancel and reopen the reservation manually, which adds no automatic infraction.

**Amendment.** Before activation, a correction produces a later version that needs two fresh approvals and fresh dependent artifacts; the earlier version remains as superseded history. Once the loan is active, its terms cannot be amended.

**A mismatched consumer.** Every consumer rejects an unsupported encoding, a changed fingerprint, a wrong chain, contract, token or network, a mixed environment, a wrong key or destination, and any dependent artifact that does not bind exactly. It does not try to reinterpret the artifact.

## Authority boundaries

This domain decides what the loan means. It does not decide anything else:

- **Approval is not execution.** A recorded approval is a workflow record bound to the exact terms, not a Bitcoin signature, wallet authority, Base transaction authorization or proof outside the application.
- **Agreement is not funding.** The selected lender still decides whether and when to fund, even after the terms are committed. A reservation gives the system no custody of the lender's capital and no authority to deploy it.
- **Keys, accounts and destinations stay separate.** A participant's per-loan Bitcoin public key, Base protocol address, external payout destinations and Vault payment account are distinct identities. The payment account can pay an eligible transfer, but it never silently becomes a loan recipient or the address that makes protocol calls. The origination flow lets a participant choose it as a recipient for a new loan only if the account is recoverable and the product discloses its separate participant-transfer capability, and only through the normal fresh approvals; existing terms stay unchanged. The architecture record and the lender authorization record say instead that a payment account is never a term-bound recipient; that conflict is unresolved.
- **Copies are not authorities.** An acceptance snapshot, a workspace copy or a display of the terms is a presentation copy only; it cannot become a second source of the loan's meaning.

Product sign-in, Vault decryption, Bitcoin construction, Base execution, observation and workflow coordination all belong to other domains.

## Choices and their reasons

- **One canonical, versioned encoding and hash.** The recorded reason is interoperability and verifiability: if consumers encoded the terms differently, or mixed per-loan facts with environment facts, signatures, deployment descriptions and chain actions could bind to different loans, or a package could become impossible to reproduce.
- **The Base contract checks the hash itself.** A database-only identifier would not tie Base state to the same terms used to build the Bitcoin transactions. So the application sends the full terms to the contract, which recomputes and verifies the hash and keeps only the verified hash and the fields it enforces. The user approved this on the agent's recommendation.
- **Per-loan facts only in the terms.** Facts that repeat for every loan, such as the Base chain and the loan contract address, live in the deployment description; per-attempt facts such as funding sources, transaction identifiers and packages stay outside both. The user specified keeping repeated deployment facts out of the terms, and approved the final field list.

The [encoding and hashing contract](../../system-model/contracts/interfaces/iface-001-loan-terms-and-canonical-binding.md) and the [deployment description contract](../../system-model/contracts/interfaces/iface-002-protocol-deployment-manifest.md) hold the exact byte-level definitions.

## Open, excluded and deferred

- **The approval conflict** described above remains open. Until it is resolved, the records do not settle whether the lender must approve the final terms separately from publishing the offer.
- **Not a marketplace.** Public or multi-lender matching, pooled capital, product custody of capital and automatic deployment of lender capital are [excluded from version 1](../../system-model/contracts/scope/scope-011-public-multi-lender-pooling-custody-and-automatic-capital.md), and so is [liquidation of the collateral](../../system-model/contracts/scope/scope-012-bitcoin-liquidation-surplus-and-shortfall.md).
- **The fallback secret's commitment** is bound only into loans created after the independent validation service passes its production gate. Until then, loans carry only the X and Y commitments.
- **A payment account as a recipient.** The origination flow allows it under the conditions above, but the architecture record and the lender authorization record say a payment account is never a term-bound recipient. The records do not reconcile this.
- **Where the offer, reservation and S commitment are bound.** This domain's responsibility record and the architecture record list them among the values the loan terms bind, while the encoding contract keeps them out of the hashed field list. This guide describes the encoding contract's field list; the records do not reconcile the two.

The [domain record](../../system-model/domains/loan-terms-and-commitments/domain.md) lists exactly what the domain owns and excludes.
