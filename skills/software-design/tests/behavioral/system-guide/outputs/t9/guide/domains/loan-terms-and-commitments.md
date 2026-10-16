# Loan Terms And Commitments

This domain makes every part of the product refer to the same loan. The [architecture guide](../architecture.md) shows how it fits with the domains that move USD Coin (USDC) on Base, hold Bitcoin collateral and run the product.

## What this domain does

A borrower and a selected lender see an offer, authorize keys and payment addresses in their Vaults, move USDC on Base and prepare collateral transactions on Bitcoin. All of those artifacts must agree about the participants, amounts, deadlines, addresses and secret commitments. This domain owns that shared meaning. A matching identifier proves which agreement an artifact describes; it does not authorize a spend or establish anything that happened on a blockchain.

The concepts a reader needs:

- A **firm offer** records the lender's proposed commercial values for one loan. Publishing it is the lender's standing approval of those commercial values. Whether the lender must also approve the final terms is one of the open questions below.
- A **reservation** is one borrower's selection of one offer revision. It happens atomically, creates a stable random loan identifier and a durable commercial draft, and cannot be won twice.
- The **loan terms** are the ordered, versioned agreement data. Their **terms hash** binds the exact encoded values, so a matching hash identifies the same exact agreement.
- The **deployment description** is different: one strict document per environment (production, test or local) that identifies the Base chain, contract, code and USDC asset, the Bitcoin network, the timing policy and the declared status of contract upgrade authority, which it records but does not grant. Addresses of services, credentials, application settings, secrets and facts that change per loan or attempt are deliberately not part of it.

Keeping loan-specific facts apart from environment facts prevents different consumers from signing or processing different meanings under the same label.

## How its responsibility works together with the rest of the system

The domain has one responsibility, [Loan terms, one-loan offer, reservation, and parameter binding](../../system-model/domains/loan-terms-and-commitments/responsibilities/sr-001-loan-terms-offer-reservation-and-parameter-binding.md). It defines the loan identity, the encoding and fingerprint of the terms and of the deployment description, the candidate versions of the agreement, the two approvals, commitment, cancellation and supersession.

It receives the offer revision, the borrower's selection, participant identities, each Vault's allocation and preparation results, and the two approvals from the product's access and workspace services. Its output is used everywhere else:

- Bitcoin construction binds every transaction it builds to the committed terms and refuses to build before they exist.
- Base settlement accepts only the agreed terms and the pinned deployment.
- Observers reject evidence from the wrong deployment.
- The workspace stores and presents the same candidate rather than its own version.
- Each Vault checks the same role and loan before returning public identities or signing.

The exact representations are in the [loan terms and binding contract](../../system-model/contracts/interfaces/iface-001-loan-terms-and-canonical-binding.md), the [deployment description contract](../../system-model/contracts/interfaces/iface-002-protocol-deployment-manifest.md) and the [offer and reservation contract](../../system-model/contracts/interfaces/iface-003-one-loan-offer-reservation-and-loan-binding.md).

## A normal case

Suppose a lender has published an offer and a borrower selects it.

1. **Reservation.** The selection reserves that offer revision and creates the loan identifier and a commercial draft. Nothing is final yet: the reservation neither approves nor commits the bound terms.
2. **Allocation.** Because the loan identifier now exists, each participant's Vault can allocate loan-specific keys for it. Each Vault returns its public Bitcoin key and Base protocol address, after any change to the encrypted Vault state has been saved and acknowledged; the result is accepted only if that Base address equals the participant's existing registered identity.
3. **Preparation.** Each participant confirms the exact addresses that should receive their money and Bitcoin. Each Vault reuses that participant's secret, generating it only if it does not yet exist, and returns its hash together with the confirmed destinations, never the secret itself: the borrower's for X, the lender's for Y.
4. **Candidate.** The application's core service assembles and validates one complete candidate version of the terms and its exact hash, and the product presents it in understandable form with both participants' bound identities.
5. **Approval and commitment.** Following the detailed records, borrower and lender each explicitly approve that same candidate version and hash, and the second matching approval commits the agreement, exactly once. Other records say the lender gives no second approval; see the open question below.

```figure
caption: In the detailed records, the agreement is committed by the second matching approval of one exact candidate.
step: Reserve | The borrower's selection creates the loan identity and a commercial draft.
step: Allocate | Each Vault returns public keys bound to that loan.
step: Prepare | Each participant confirms addresses; each Vault returns a secret hash.
step: Assemble | One complete candidate and its hash are presented to both.
step: Approve | Both approve the same candidate; the second approval commits it.
```

What proves the result is the committed terms with their hash. Every later artifact, from a Base contract record to a signed Bitcoin transaction, must bind to exactly that.

## Exceptions and recovery

- **Edits.** Any change to a hashed field creates a new candidate version and hash and invalidates every earlier approval. Before activation, an amendment produces a later version and fresh dependent artifacts.
- **Retries.** A duplicate identical approval or a repeated commitment request returns the same durable result; two simultaneous final approvals commit at most once.
- **Rejected approvals.** A stale, wrong-role, wrong-loan or mismatched approval, or one on an expired or cancelled draft, is rejected.
- **Cancellation.** Cancellation ends that reservation for good. Reopening requires a new loan identity, so an apparently successful retry can never revive old approvals or signing material.
- **Wrong environment or binding.** Consumers reject an unsupported encoding, a changed fingerprint, a mix of environments, the wrong key or address, and any dependent artifact that does not bind exactly. Base-facing consumers also reject the wrong chain, contract or asset, and Bitcoin-facing consumers the wrong Bitcoin network.

## Authority boundaries

Several identities look alike and must stay apart: a participant's Bitcoin public key for this loan, the participant's Base protocol address, the external address that receives a payout, and a Vault payment account used to send USDC. A payment account can fund a transfer; it does not silently become a loan recipient or the address that calls the contract. A participant may choose a Vault payment address for an existing recipient field of a new loan only through explicit role authorization and fresh approvals of the candidate, and only after that address has qualified as recoverable and the separate transfer capability has been disclosed. Historical terms never change. An acceptance snapshot or workspace copy cannot become a second authority for what the agreement means.

The domain decides meaning, not action. It does not authenticate users, decrypt Vaults, hold or allocate lender capital, build Bitcoin transactions, execute or observe Base transactions, or coordinate durable work. In particular, even after an agreement is committed, the lender separately decides whether and when to fund.

## Choices and open questions

The recorded reasons for one canonical encoding, kept apart from the deployment description, are that a database-only identifier would not bind the Base record to the same terms used to build the Bitcoin transactions, that values fixed for a whole deployment and data that changes per attempt should not be copied into every loan's terms, and that one machine-checkable deployment description stops components from using incompatible fixed values. The exact encoding and accepted address spellings stay in the loan terms and binding contract.

Retries and cancellation are designed so that an apparently successful retry can never revive old approvals or signing material: an edit invalidates earlier approvals, and a cancelled reservation stays cancelled for good; the offer can be taken again only through a new reservation and a new loan identity.

**Open question: what exactly does the lender approve, and when?** The records word this differently, and which wording governs is undecided.

- The [architecture record](../../system-model/architecture.md) says publication is the lender's standing acceptance of the offer and that reservation creates the canonical loan without a second lender approval. The [offer selection record](../../build/records/selections/sel-012-one-loan-offer-reservation-and-binding.md) says reservation binds the canonical terms without a second lender approval, and the [offer and reservation contract](../../system-model/contracts/interfaces/iface-003-one-loan-offer-reservation-and-loan-binding.md) says the reservation requires no second lender approval. The one-loan scope boundary, the selected-lender invariant and the preconditions of the origination flow also describe publication as standing acceptance.
- The responsibility record, the [canonical loan terms state](../../system-model/contracts/states/state-002-canonical-loan-terms.md) and the steps of the [origination flow](../../system-model/behavior/flows/flow-001-origination-preparation-and-qualification.md) require borrower and lender each to approve the exact final candidate, with commitment on the second matching approval.
- The responsibility record calls publication standing approval of the commercial values only, and the [offer and reservation state](../../system-model/contracts/states/state-001-one-loan-offer-and-reservation.md) separates the lender's commercial approval at publication from the lender's later final-terms approval. Whether the shorter wording elsewhere is meant only in that commercial sense is not recorded.

The normal case above follows the detailed records, which is how the current design is written; it does not settle the question.

## Open, excluded and deferred

Public or multi-lender matching, pooled lender capital, product custody and automatic deployment of lender capital are excluded from this version under the [one-loan scope boundary](../../system-model/contracts/scope/scope-011-public-multi-lender-pooling-custody-and-automatic-capital.md), and Bitcoin liquidation under the [liquidation scope boundary](../../system-model/contracts/scope/scope-012-bitcoin-liquidation-surplus-and-shortfall.md). A reader should not expect the terms to describe any of those.

The [domain record](../../system-model/domains/loan-terms-and-commitments/domain.md) lists exactly what the domain owns and excludes.
