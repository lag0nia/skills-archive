# Loan Terms And Commitments

This domain defines the one agreement that every part of the system refers to: which offer a borrower took, who the participants are, the amounts, deadlines, keys, destinations and secret commitments of the loan, and which deployment environment it belongs to. Because every other domain checks its work against this agreement, a mismatch anywhere is rejected instead of silently binding money or collateral to a different loan. The [architecture guide](../architecture.md) shows where it fits in the system.

## What this domain does

A loan involves several independent actors and artifacts. Participants see an offer in the product, prepare keys and recipients in their own Vaults, move USDC (a dollar stablecoin) on the Base network, and sign Bitcoin transactions for the collateral. All of these must agree on the same loan. This domain owns that shared meaning. It does not move money, sign anything or decide what happened on a chain. A matching loan identity proves which agreement an artifact describes; it never authorizes a spend or establishes a chain outcome.

The domain works with a handful of concepts:

- A **firm offer** is a lender's published proposal for exactly one loan. Its commercial values are the principal, the total debt, the collateral amount, the repayment deadline and an optional protection expiry. Publishing it records the lender's standing approval of those values. Keys, destinations and secret commitments are not part of the offer.
- A **reservation** is one borrower's atomic selection of one revision of that offer. It creates a stable, random **loan identifier** and holds the offer for that borrower for 24 hours.
- The **loan terms** are the ordered, versioned agreement data. Their field contract lists the loan identifier, the terms version, per-loan references to the borrower and the selected lender, each participant's Base protocol account and fixed Base recipient, principal, total debt, repayment deadline, the optional protection expiry, the collateral amount, each participant's loan-specific Bitcoin public key and external Bitcoin destination, and the hashes of the borrower's secret X and the lender's secret Y.
- The **terms hash** is a hash over the exact encoded terms. Every downstream artifact must carry it or resolve to it; Bitcoin packages, for example, are bound to it through their package manifests.
- The **deployment manifest** is one strictly versioned document per environment (production, test or local). It identifies the Base chain, the loan contract and its code, the USDC asset, the Bitcoin network, the uniform timing policy and the declared upgrade authority, and carries a fingerprint of its own content. It excludes service addresses, credentials, application settings, per-loan or per-attempt facts and secrets.

The recorded reason for keeping loan facts and environment facts in separate artifacts is that mixing them, or encoding them differently in different places, could bind signatures, manifests and chain actions to different loans or make a package impossible to reproduce.

## How its responsibility works with the rest of the system

The domain has one responsibility: [Loan terms, one-loan offer, reservation, and parameter binding](../../system-model/domains/loan-terms-and-commitments/responsibilities/sr-001-loan-terms-offer-reservation-and-parameter-binding.md). It defines the loan identity, the encoding of the terms, the candidate versions, the approvals, the single commitment, and the rules for cancellation and supersession.

Its inputs come from the product and the Vaults. The participant access and workspace domain supplies the offer, the borrower's selection, the participants' identities and the participants' approvals. Each participant's Vault supplies acknowledged public results: the loan-specific Bitcoin public key, the Base address, the external destinations and the secret's hash. The domain never receives a private key or an unrevealed secret.

Its output is used everywhere else:

- Bitcoin construction binds every prefund, escrow and package to the committed terms.
- The Base contract accepts only loans that match the pinned terms and deployment.
- The Base observer rejects evidence from the wrong deployment.
- The workspace stores and presents the same candidate and committed terms.
- Each Vault checks the same role and loan binding before returning a public identity or signing.

## A normal case: from offer to committed terms

The following case is illustrative. It follows the detailed terms, state and flow records; how it relates to the architecture record's wording on lender approval is an open question described at the end of this guide.

```figure
caption: How a firm offer becomes one committed loan agreement, as the detailed records describe it.
step: Publish | The lender publishes a firm offer for one loan.
step: Reserve | A borrower atomically reserves one offer revision; a loan identifier is created.
step: Prepare in the Vaults | Each Vault allocates loan keys and prepares destinations and its secret's hash.
step: Approve and commit | Both approve the same candidate terms; the second approval commits them once.
```

A lender publishes an offer for one loan, and a borrower browsing offers reserves it. The reservation succeeds for exactly one borrower and creates the loan identifier before any loan-specific key is derived.

Each participant then opens its Vault for two narrowly bound tasks. The first allocates the loan's keys and reports their public form once the encrypted Vault snapshot that contains them has been acknowledged. The second confirms the participant's public destinations and returns the hash of its secret: the Vault reuses the participant's existing secret for this loan if there is one and generates a random one only when none exists. The application accepts these results only when they name the right loan, network, current Vault revision and the participant's existing registered identities.

With both results in hand, the application assembles one complete candidate version of the terms and its hash and shows it in understandable form to both participants. The borrower and the lender each explicitly approve that same candidate version and hash, and the second matching approval commits the terms atomically and exactly once. From then on the terms are immutable, and every later artifact must bind to them.

What proves the result is the committed terms record with its hash. The reservation itself stays open until the borrower's acceptance on Base is final; committing the terms does not consume it.

## Exceptions and recovery

- **A change before commitment.** Any change to a hashed field creates a new candidate version and hash and invalidates every earlier approval. Repeating an identical approval, or retrying the commitment, returns the same durable result; two simultaneous final approvals commit at most once.
- **Rejected input.** The domain rejects a duplicate or concurrent reservation, the wrong participant or offer revision, a recipient on the wrong network, an unsupported or modified deployment manifest, a mismatch with the live deployment, a missing, stale or cross-role allocation result, the wrong key, destination or commitment, and a stale, wrong-role, wrong-loan or mismatched approval.
- **Amendment before activation.** Changing the agreement before the loan activates needs a later validated version with two fresh approvals and fresh dependent artifacts. An active escrow or Base loan is never amended in place.
- **No valid prefund by the deadline.** When the 24-hour reservation ends with no valid prefund visible, the reservation is cancelled, the offer becomes available again, that borrower is permanently blocked from that offer, one infraction is added to the borrower's record and both parties are notified. The offer-state record also describes a reservation that runs out before the terms are committed, with no prefund attempt, as simply expiring; the offer selection and its approved ticket apply the cancellation and infraction to any deadline without a valid prefund. The records do not say which applies before commitment.
- **A stuck prefund.** A valid prefund that remains unconfirmed for 72 hours goes to manual review: operations are alerted and the borrower is emailed to raise its fee. This does not cancel the reservation or add an infraction. Operations may cancel and reopen the offer manually, without an automatic infraction.
- **Cancellation.** Cancellation is final for that reservation and its history is kept. Reopening the offer creates the next reservation number and a fresh loan identifier; the old identifier is never reused.

## Authority boundaries

This domain decides what the loan means. It does not decide:

- who may sign in or hold a role, which belongs to participant access;
- anything about keys or secrets beyond their public form, which stays in each participant's Vault;
- whether and when lender capital is deployed: even after the terms are committed, the selected lender separately controls the funding action;
- how Bitcoin transactions are built or operated, how USDC moves on Base, or which chain events happened.

Six identities must stay distinct even though some look alike: a participant's per-loan Bitcoin public key, Base protocol account, Vault payment account, external Bitcoin destination and fixed Base payout recipient, and the borrower's repayment-refund recipient. A payment source never changes a recipient fixed in the terms. A Vault payment account can be chosen as the value of a recipient field on a fresh loan only if it is recoverability-qualified and only with explicit role authorization, fresh approvals and a separate disclosure of its transfer capability; historical terms never change. Likewise, a workspace copy or an acceptance snapshot of the terms is a record, not a second authority over their meaning.

## Choices and their reasons

- **One canonical encoding and hash for the terms.** The recorded reason is interoperability and verifiability: divergent encodings, or immutable loan facts mixed with deployment facts, could bind signatures, manifests and chain actions to different loans or make a package impossible to reproduce. The byte-level encoding lives in the [loan terms binding contract](../../system-model/contracts/interfaces/iface-001-loan-terms-and-canonical-binding.md).
- **One deployment manifest per environment, separate from the terms.** Separately maintained Base, Bitcoin, Vault and API configuration could permit a cross-domain mismatch that is hard to detect after funds move. One strict, fingerprinted manifest gives every environment-bound consumer one reviewable identity, recorded in the [deployment manifest selection](../../build/records/selections/sel-010-protocol-deployment-manifest.md).
- **One firm offer per loan, reserved atomically.** One offer for one loan makes reservation atomic and understandable, avoids private matching and a second commercial decision after the borrower chooses, and a per-offer reservation counter preserves history when an offer returns after cancellation. The [offer and reservation selection](../../build/records/selections/sel-012-one-loan-offer-reservation-and-binding.md) records it.

## Open, excluded and deferred

> **Open conflict: is a second lender approval required?**
> The architecture record, the offer and reservation contract, the offer selection and the user-approved offer ticket say that publication is the lender's standing acceptance and that the reservation needs no second lender approval; the ticket excludes a second commercial approval. The responsibility, the offer and terms state records, the terms binding contract and the origination flow say that publication approves only the commercial values and require the borrower and the lender each to approve the exact final terms before commitment, and the offer state record calls the lender's final approval distinct from its offer approval. No record decides whether that final approval is the excluded second approval.

For a reader now, the normal case above shows the detailed records' version; which wording governs remains undecided. The conflict is recorded in the [domain record](../../system-model/domains/loan-terms-and-commitments/domain.md#choices-and-rationale).

> **Open discrepancy: what the terms themselves contain**
> The responsibility and architecture records describe the loan's binding as also covering the selected offer revision, the reservation number and, for a loan using the optional fallback, the hash of a third secret S. The field contract lists only the fields described above, keeps offer and reservation identity in the separate offer record, and has no field for S. It also describes the participant references as random per-loan values, while the offer selection binds the participants' actual account identifiers. The records do not reconcile these descriptions.

Version 1 excludes public or multi-lender matching, pooled capital, custody by the product, automatic deployment of lender capital and liquidation. The terms can carry an optional protection expiry, but choosing a protection or put-option provider and operating its exercise and settlement are deferred.

The [domain record](../../system-model/domains/loan-terms-and-commitments/domain.md) lists exactly what the domain owns and excludes.
