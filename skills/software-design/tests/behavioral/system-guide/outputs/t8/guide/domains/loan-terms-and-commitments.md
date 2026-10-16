# Loan Terms And Commitments

This domain makes every part of the system refer to the same loan. Offers, Vault actions, Base calls, signed Bitcoin transactions and observations must all agree on who the participants are, the amounts, the deadlines, the destinations and the secret commitments, and this domain defines that shared meaning. The [architecture guide](../architecture.md) shows where it fits in the system.

## What this domain does

A borrower and a selected lender meet through a one-loan offer, authorize keys and recipients in their own Vaults, move USDC on Base, and prepare collateral transactions on Bitcoin. Each of those steps produces artifacts in a different place. If any two of them disagreed about the loan, a participant could sign one meaning while a contract or transaction executed another. This domain prevents that by giving the loan one identity and one canonical description that every consumer checks.

A few terms carry the rest of this guide:

- A **firm offer** is the lender's published proposal for exactly one loan: principal, rate and dates. Publication is the lender's standing acceptance of those commercial values.
- A **reservation** is one borrower's atomic selection of one offer revision. It lasts 24 hours and creates a stable random **loan identity** before any loan-specific key exists.
- The **canonical loan terms** are the ordered, versioned agreement data. Their **terms hash** is a fingerprint over the exact encoded values, so any change produces a different hash.
- The **deployment description** is a separate, versioned document for each environment. It identifies the Base chain and contracts, the USDC asset, the Bitcoin network, the timing policy and the declared upgrade authority, and carries its own fingerprint. Web addresses, credentials, secrets and changing application state are never part of it.

Keeping loan facts and environment facts apart means a loan's meaning never depends on how one environment is configured, and a consumer can reject an artifact built for the wrong environment.

A matching identifier proves which agreement an artifact describes. It does not authorize a spend, a signature or a funding decision, and it does not establish anything on either chain.

## How its responsibilities work together

The domain has one responsibility. [Loan terms, one-loan offer, reservation, and parameter binding](../../system-model/domains/loan-terms-and-commitments/responsibilities/sr-001-loan-terms-offer-reservation-and-parameter-binding.md) defines the loan's identity, the canonical encoding and its hash, the candidate versions and their approvals, the single commitment, and cancellation and supersession. It also defines the deployment description and how consumers verify its fingerprint.

The domain receives its inputs from Participant Access And Loan Operations, which authenticates participants and carries their commands, and from the participants' Vaults, which return public keys, addresses and secret hashes but never private material. Its output is consumed everywhere else:

- Bitcoin Authorization And Recovery binds every prefund, escrow and package to the committed terms.
- Base USDC Settlement And Funding accepts only a loan whose terms and deployment match what the contract records.
- Base Observation And Fallback Review rejects evidence from the wrong deployment.
- Participant Access And Loan Operations stores and shows the same candidate to both participants.
- Each Vault checks the role and the loan before returning a public identity or signing.

## A normal case

Take an illustrative lender who publishes an offer for one loan.

1. **Offer.** The lender publishes the firm offer. Publication counts as the lender's standing acceptance of its commercial values; the selected lender still decides separately, later, whether and from which wallet to fund the loan.
2. **Reservation.** A borrower selects the offer. The selection atomically reserves that offer revision for that borrower, assigns a reservation number, creates the loan identity, and records the commercial draft. A second borrower selecting the same offer at the same moment loses without creating a second loan.
3. **Allocation.** Each participant's Vault allocates a fresh, never-reused Bitcoin key for this loan, saves its encrypted state, and returns the loan's public key together with the participant's registered Base address.
4. **Preparation.** Each Vault confirms the participant's payout destinations and generates, or reuses for the same loan, the participant's secret: X for the borrower, Y for the lender. It returns only the destinations and the secret's hash. This preparation step is a current design change whose implementation has not yet been delivered.
5. **Candidate.** Once both public results are durably recorded, the application assembles one complete terms candidate with its version and hash, and shows it to both participants in understandable form with their bound identities.
6. **Approval and commitment.** Borrower and lender each explicitly approve that exact candidate version and hash. The second matching approval commits the terms exactly once. The reservation stays active until the loan is accepted on Base or ends.

> **Open: does the lender approve twice?**
>
> The sources disagree about step 6. The system-level wording, the offer and reservation contract, the capital-scope record and the offer selection say publication is standing lender acceptance and the reservation needs no second lender approval. This domain's responsibility, the terms lifecycle and the origination flow require the lender, like the borrower, to approve the exact final candidate before the terms commit. The reservation state record treats that final-terms approval as distinct from the commercial approval given at publication, which may reconcile the two, but the package has not decided. Until it does, read step 6 as recorded in the detailed rules and the question as open.

What proves the result is the committed terms record: one version, one hash, and the approvals of that exact hash that the detailed rules require, subject to the open question above. Every later artifact carries that hash, and a consumer that cannot prove the binding treats the artifact as not part of the loan.

## Exceptions and recovery

- **A changed term.** Editing any field the hash covers creates a new candidate version and hash and invalidates every approval of the earlier version, so the new version must be approved afresh. Before activation, an amendment produces a later version and fresh dependent artifacts; it never edits a committed version in place.
- **Retries and races.** Repeating an identical approval or commitment request returns the same durable result. Concurrent final approvals commit at most once. A stale, wrong-role, wrong-loan, mismatched, expired or cancelled approval is rejected.
- **Cancellation.** Cancellation ends that reservation for good. If the offer reopens, the next reservation creates a fresh loan identity; the cancelled record keeps its original participants. This prevents an apparently successful retry from reviving old approvals or signing material.
- **Expiry and missing collateral.** An unused reservation that reaches its 24 hours before the terms commit and without any prefund simply expires. If the terms committed but no valid prefund is visible within the reservation window, the offer reopens, that borrower cannot select it again, the borrower's infraction count rises by one, and both participants are notified. A valid prefund visible in the Bitcoin mempool keeps the reservation; one still unconfirmed after 72 hours goes to operations for manual review and the borrower is asked to fee-bump it. The company cannot add fee to the borrower's prefund itself, and a fee bump that changes the prefund goes through a new prefund with freshly signed packages. Operations may cancel and reopen the offer when the transaction cannot progress or appears abusive; a valid stuck transaction carries no automatic infraction.
- **Wrong artifacts.** Every consumer rejects an unsupported encoding, a changed fingerprint, a wrong chain, contract, asset or network, a mixed environment, a wrong key or destination, or any dependent artifact that does not bind exactly.

## Authority boundaries

This domain decides what the loan means. It does not decide anything that moves value or proves a chain outcome.

- **Separate identities stay separate.** A participant's loan-specific Bitcoin public key, their Base protocol address, their Vault payment account, their external Bitcoin payout destination, their fixed Base payout recipient and the borrower's repayment-refund recipient are distinct fields with distinct authority. A protocol key never silently becomes a payout destination, and the one permitted switch of the refund recipient can select only the borrower's own committed protocol address. A Vault payment account can pay for a transfer, but it becomes a recipient only if a participant selects it for a fresh loan's existing recipient field. That needs the account's address to be recoverable from the participant's backup, the application to disclose the account's separate transfer capability, and fresh approvals; it never rewrites earlier loans.
- **No second authority for meaning.** An acceptance snapshot or a workspace copy cannot redefine the committed terms.
- **What stays elsewhere.** Sign-in and roles, Vault decryption and signing, lender capital, Bitcoin construction, Base settlement, observation and workflow coordination all belong to other domains. Approving terms grants no signing, custody, funding or chain authority.

## Choices and their reasons

- **One canonical encoding, separate from the environment.** The recorded reason is interoperability and verifiability: divergent encodings, or immutable loan facts mixed with deployment facts, could bind signatures, manifests and chain actions to different loans, or make a package impossible to reproduce. The exact byte layout and accepted address forms stay in the [canonical binding contract](../../system-model/contracts/interfaces/iface-001-loan-terms-and-canonical-binding.md) and the [deployment description contract](../../system-model/contracts/interfaces/iface-002-protocol-deployment-manifest.md).
- **Versions and fresh identities instead of edits.** Amendments create new versions, and cancellation requires a fresh loan identity, so that a retry cannot revive old approvals or signing material.
- **Firm one-loan offers.** Lenders publish browsable firm offers that a borrower reserves directly, without invitations or account search; the [offer and reservation contract](../../system-model/contracts/interfaces/iface-003-one-loan-offer-reservation-and-loan-binding.md) holds the exact rules.

## Open, excluded and deferred

- **Open:** whether the lender's approval of the final terms conflicts with the standing-acceptance wording, as described in the normal case. Nothing in this guide resolves it.
- **Excluded:** public or multi-lender matching, pooled lender capital, product custody, automatic deployment of lender capital, and liquidation are outside the design under the [capital-scope record](../../system-model/contracts/scope/scope-011-public-multi-lender-pooling-custody-and-automatic-capital.md). For a reader this means the product never chooses, aggregates, holds or moves a lender's money.
- **Excluded here, owned elsewhere:** decisions about funding, signing and chain outcomes belong to the other domains described in the [architecture guide](../architecture.md).

The [domain record](../../system-model/domains/loan-terms-and-commitments/domain.md) lists exactly what the domain owns and excludes.
