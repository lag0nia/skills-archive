# Loan Terms And Commitments

This domain gives every part of a Bitcoin-backed USDC loan one shared, unchangeable description of the agreement, so that the product, the participants' Vaults, the Base contracts, the observers and the Bitcoin transactions all act on the same loan. It defines what a lender's offer is, what a borrower's reservation creates, what the final agreement contains and when it becomes binding; it moves no money and gives nobody authority to sign. The [architecture guide](../architecture.md) shows where the domain sits in the whole system.

## What this domain does

A loan in this system lives in several places at once. The lender's USDC is lent and repaid through contracts on Base, the borrower's Bitcoin collateral sits in Bitcoin transactions, each participant keeps keys and secrets in a personal encrypted Vault, and the product application coordinates the work. Each of these produces its own artifacts: offers, Vault results, transactions, contract records, observations. They are only safe together if they agree exactly about the participants, the amounts, the deadlines, the destinations that receive value, and the hashes of the participants' secrets. This domain owns that shared meaning.

Agreement has a strict limit. A matching loan identifier and hash prove which agreement an artifact describes. They do not authorize a spend, sign anything, fund anything, or establish that something happened on a chain; those authorities stay with the participants, the contracts and the chains.

The reader needs five concepts, which the domain keeps carefully apart:

- **Firm one-loan offer.** A lender publishes an offer that funds exactly one loan. It carries the lender's proposed commercial values: principal, total amount owed, repayment deadline, protection expiry and Bitcoin collateral amount. Authenticated participants can browse the offers visible to them. The offer records treat publication as the lender's standing acceptance of those commercial values and say a reservation needs no second lender approval, while the offer-and-reservation and terms state records require the lender to approve the final terms separately; whether both can hold is undecided, as explained under [Open, excluded and deferred](#open-excluded-and-deferred).
- **Reservation.** An authenticated borrower selects one current offer revision, and the application reserves it for that borrower atomically, so a competing borrower cannot claim it. The reservation creates the loan's stable identifier, a cryptographically random 32-byte value, and a durable commercial draft. A reservation is identified by the offer plus a counter, the reservation number, that increases by one each time the offer is reserved again.
- **Loan terms.** The final agreement is one ordered, versioned record of 19 fields, called LoanTermsV1 in the contracts. It holds only facts fixed for this loan before collateral is staged: the loan identifier and terms version, per-loan participant references, the participants' Base protocol addresses and payout recipients, principal, total debt, repayment deadline, protection expiry, collateral amount, each participant's loan-specific Bitcoin public key, each participant's external Bitcoin destination, and the hashes of the borrower's secret X and the lender's secret Y.
- **Terms hash.** The record is encoded with standard Ethereum typed encoding (ABI encoding) in that exact field order, together with a fixed version tag, and hashed with Keccak-256. The hash binds the exact encoded values: change any field and the hash changes.
- **Deployment manifest.** Facts that are the same for every loan in an environment are not loan terms. One strict, versioned manifest per environment (production, test and local) identifies the Base chain, the loan contract and its current implementation and code hash, the USDC contract, the Bitcoin network, the timing and policy values that apply to all of version 1, and the declared upgrade-authority status. Endpoints, provider identities, credentials, secrets, application settings and mutable loan or attempt facts are excluded. Each manifest carries a fingerprint: a SHA-256 hash of its canonical content with only the fingerprint itself omitted.

Keeping per-loan facts and environment facts in separate, exactly encoded records prevents different consumers from signing or processing different meanings under the same label; the recorded reasons are under [Choices and their reasons](#choices-and-their-reasons).

## How its responsibilities work together

The domain has a single responsibility, [Loan terms, one-loan offer, reservation, and parameter binding](../../system-model/domains/loan-terms-and-commitments/responsibilities/sr-001-loan-terms-offer-reservation-and-parameter-binding.md). It defines the loan identity, the encoding and hash, the deployment manifest and its fingerprint, the candidate versions of the terms, their approvals, commitment, cancellation and supersession, and it rejects any version, artifact, authority or destination that does not fit.

It depends on the [Participant Access And Loan Operations](participant-access-and-loan-operations.md) domain. That domain's application coordination responsibility publishes offers and records reservations as transactional application state, persists the drafts and approvals, and presents the terms to people; its identity responsibility establishes who is the borrower and who is the lender. This domain defines what those records mean and when they become an agreement.

It also receives public results from the participants' Vaults, described in the [Bitcoin Authorization And Recovery](bitcoin-authorization-and-recovery.md) guide: each Vault allocates a loan-specific Bitcoin key and reports only its public identity, then confirms the participant's destinations and reports only the hash of that participant's secret.

What it provides is used everywhere else:

- Bitcoin package construction binds its transactions and package records to the committed loan identifier, terms version and terms hash.
- The Base loan contract, described in the [Base USDC Settlement And Funding](base-usdc-settlement-and-funding.md) guide, receives the complete terms when the funding window opens and recomputes the hash itself, and it accepts only the pinned terms and deployment.
- Base observers, described in the [Base Observation And Fallback Review](base-observation-and-fallback-review.md) guide, validate the deployment manifest and reject evidence from the wrong deployment.
- The product application persists and presents the same candidate terms to both participants.
- Each Vault checks the same role and loan binding before it returns a public identity or signs.

## A normal case

This illustrative case follows one loan from offer to committed agreement, in the order the origination flow requires.

A lender publishes a firm offer for one loan. A borrower browses the available offers and selects one, submitting the offer revision and terms reference that were displayed; the application resolves the commercial values itself, so the browser cannot substitute amounts, dates, collateral, participants or destinations. The reservation succeeds atomically. It records the actual, unchangeable borrower and lender accounts, starts a 24-hour reservation window and creates the loan identifier and the commercial draft. No final terms and no terms hash exist yet, and the reservation is not an approval of final terms.

Next, each participant's Vault allocates that participant's loan-specific Bitcoin key and returns a public identity naming this loan, the expected network, the Vault's acknowledged current revision, the compressed Bitcoin public key and a Base protocol address that must equal the participant's existing registered Vault identity. Then each participant confirms their own destinations in their Vault: the borrower a Base recipient and an external Bitcoin destination, the lender a settlement recipient and an external Bitcoin destination. The Vault reuses that participant's secret for this loan if it already exists, or generates and encrypts it only when absent, and returns only the secret's hash. Confirming destinations selects no secret, publishes nothing and approves nothing.

When both allocation results and both preparation results are durable, the coordination service assembles one complete candidate with a candidate version and its exact terms hash. The product shows each participant the understandable candidate terms and both bound public identities.

The borrower and the lender then each approve that exact candidate version and hash through an authenticated command, and the second matching approval commits the agreement atomically and exactly once. This is how the state records, the responsibility record, the terms contract and the origination flow describe the step. The offer contract, the offer selection, the exclusion record for public and multi-lender matching, and the architecture record instead describe the lender's publication as standing acceptance that needs no second lender approval. Whether the lender's approval here is a separate required step or contradicts standing acceptance is undecided.

```figure
caption: From offer to committed agreement. The lender's approval in the sixth step is an open question: the state records require it, while the offer records say no second lender approval exists. It is undecided.
step: Publish | The lender publishes a firm offer for one loan.
step: Reserve | A borrower atomically reserves it; the loan identifier and commercial draft are created.
step: Allocate | Each Vault returns the public loan key and the registered Base address.
step: Prepare | Each Vault confirms its destinations and returns only its secret's hash.
step: Assemble | One complete candidate with a version and exact terms hash is frozen for review.
step: Approve | Both roles approve the same version and hash, as the state records require; undecided for the lender.
step: Commit | The second matching approval commits the agreement once.
```

What proves the result is the committed, immutable agreement record and its approvals, bound to the exact loan identifier, terms version and terms hash. Each approval records the role, the participant reference, the time, the selected offer revision and reservation number, the version of the displayed terms format, the candidate version and the exact hash. Later, the Base contract independently recomputes the same hash from the full terms.

Commitment does not end the reservation. The reservation stays open while the borrower stages the Bitcoin prefund and the other domains prepare and sign the collateral transactions; it is consumed only when the loan reaches the finalized Base acceptance step, at which the borrower's secret X becomes public. Commitment itself is not a chain event and not a signature.

## Exceptions and recovery

**Competing or repeated reservations.** If two borrowers select the same offer, or a borrower acts on a stale page, one wins and the other gets no reservation and no loan. A retry with the same request key and body returns the same reservation after a timeout or restart; reusing the key with a different body is rejected without change.

**Repeated, late or wrong approvals.** A duplicate identical approval or a retried commitment returns the existing result, and concurrent final approvals commit at most once. An approval that is stale, from the wrong role, for the wrong loan, for a different version or hash, or against an expired or cancelled draft is rejected.

**Changed terms.** Any change to a hashed field creates a new candidate version and hash and invalidates every earlier approval. A retry therefore cannot revive an approval given to different terms.

**Cancellation.** Before the terms are committed, either bound participant may cancel, and a reservation that expires before commitment has the same effect. Cancellation is final for that terms version and that reservation: it keeps the history, invalidates pending approvals, and blocks commitment and package construction. The offer can return only through the next reservation number and a fresh loan identifier, and the cancelled record's participants never change.

**Reservation timing.** The reservation rules belong to the application coordination records and are explained further in the [Participant Access And Loan Operations](participant-access-and-loan-operations.md) guide. In outline: once terms are committed, a missing valid prefund at the 24-hour deadline cancels the reservation, reopens the offer, permanently blocks that borrower from that offer, adds one infraction to the borrower's count and notifies both parties. What happens when the 24 hours run out before the terms are committed and no prefund was attempted is undecided: the reservation state record says the reservation simply expires without a loan, with no loan or second lender approval inferred, while the offer selection and the reservation contract apply the cancellation, block and infraction rule to any missing prefund at the deadline. A valid prefund seen in the Bitcoin mempool, the network's pool of broadcast but unconfirmed transactions, keeps the reservation, but it is not yet collateral. If that exact prefund stays unconfirmed for 72 hours, operations are alerted and the borrower is emailed to raise its fee; operations may cancel and reopen manually when the transaction cannot progress or appears abusive, with no automatic infraction.

**Amendment before activation.** A loan whose collateral is not yet active can move to a later validated version with fresh approvals, which supersedes the earlier version and requires fresh dependent artifacts; the earlier version stays as unchangeable history. The state record calls these two fresh acceptances, while the offer records say there is no second lender approval; whether the lender's fresh acceptance is required is the same undecided question as above. An active escrow or Base loan is never amended in place.

**Wrong or mixed environments.** Every consumer recomputes the manifest fingerprint and rejects an unsupported schema, a changed fingerprint, the wrong chain, contract, asset or network, or a mix of environments. Base-facing consumers also check the live chain, contract, implementation code and USDC identity, and Bitcoin-facing consumers check the network. Unknown or mismatched deployment data blocks the value-moving or lifecycle-changing action and records the discrepancy for reconciliation. The application stores the originating protocol package version and manifest fingerprint with each loan, so a later release cannot silently retarget an existing loan; a manifest changes only through a new pinned package release.

**Artifacts that do not bind.** An artifact with an unsupported encoding, a hash mismatch, the wrong key or destination, or any other binding that does not match exactly is not part of the loan. The action fails closed, and no workspace copy, acceptance snapshot, Base record, package label or observer view can repair or reinterpret it.

> **Fixed terms protect after approval, not before**
> A compromised interface or backend could substitute a destination, recipient, public key, contract, amount, deadline, secret hash or chain identifier before the terms are committed. If a participant approves the substituted values, the later fixed transactions faithfully enforce them. The defence is that every signing or value-moving step shows the exact recipients, amounts, chains, deadlines, key fingerprints, terms version and hash, and deployment identity, and that wallet data and Bitcoin transaction bytes are compared with the committed terms rather than with what the screen shows.

## Authority boundaries

This domain decides what the loan means: its identity, the content and encoding of each terms version, when a candidate is committed, cancelled or superseded, and which artifacts belong to the loan. It does not authenticate users, decrypt Vaults or sign, hold or allocate lender capital, construct Bitcoin transactions, execute Base settlement, observe chains, or coordinate the durable workflow; those stay with their own domains. It does not handle fallback secret publication, liquidation or post-default proceeds.

Approving the terms grants no Vault, signing, secret, transaction, funding or custody authority. A reservation does not fund USDC, move Bitcoin, create signing authority or let the platform choose the lender's capital source. The selected lender alone decides whether, when and from which controlled wallet to fund the loan, even after the agreement is committed.

Several identities look alike but stay separate, each with its own authority: a participant's loan-specific Bitcoin public key, the Base protocol address the participant's Vault generates, the participant's independent Vault payment account, the external Bitcoin destination, the fixed Base payout recipient and the repayment-refund recipient. A Vault payment account may pay an eligible transfer, but it never silently becomes a loan recipient or the protocol caller. A participant may select a Vault payment address for a fresh loan's existing recipient field only after that address is shown to be recoverable and its separate transfer capability is disclosed; the selection is an ordinary value change that needs the normal fresh approvals, and historical terms never change. No organization key can replace a participant's protocol key.

The terms record is the only authority for the agreement's meaning. An acceptance snapshot, a display copy or a workspace record is a presentation of it, never a second source of truth.

## Choices and their reasons

**One exact encoding, separate from the environment.** The recorded reason for a single, ordered, versioned encoding with its own hash, and for keeping environment facts in a separate manifest, is interoperability and verifiability. Divergent encodings, or loan facts mixed with deployment facts, could bind signatures, manifests and chain actions to different loans or make a package impossible to reproduce. The decision records show the field boundary, the hash construction and the manifest's role and contents as approved by the user on the agent's recommendation, the manifest's fingerprint method, release-only change rule and upgrade-authority declaration as chosen by the agent, keeping repeated deployment-wide facts out of the terms as the user's own suggestion, and the Base contract's emission of the verified hash in its events as chosen by the agent.

**Base addresses mean their 20-byte value.** A Base address is its decoded 20-byte value, so letter case never changes the loan or its hash. The checksummed mixed-case spelling a Vault registers is preserved end to end; an all-lowercase spelling is still accepted for compatibility with already published fixtures, and any mixed-case spelling must carry a valid checksum. The recorded reason is to keep the Vault's checksummed identity, keep existing fixtures valid, match how the Base contracts treat addresses, and fail closed on a corrupted checksum. The user approved this on the agent's recommendation.

**Real accounts for the reservation, private references in the terms.** A reservation binds the actual, unchangeable borrower and lender accounts plus the offer and reservation number, which the user specified; reusing the identity the application already has avoids an arbitrary extra identifier. The terms themselves carry new random per-loan participant references that map privately to those accounts and are neither personal data nor stable across loans.

**A fixed deadline.** The repayment deadline is a fixed time chosen before origination, with a 24-hour commercial cushion so the date is known before funding or Bitcoin setup. If setup takes longer, the deadline does not move. Any protection expiry must be at least seven days (604,800 seconds) after the repayment deadline.

**Approval of final terms.** The lifecycle in which a terms version commits only with both matching role approvals was approved by the user on the agent's recommendation, and the user later specified that both participants approve the final terms separately after preparation. The user also specified that accepting an offer reserves it without a second lender approval. Whether these describe different stages or contradict each other is undecided; the open question below explains both sides.

## Open, excluded and deferred

> **Open question: does the lender approve the final terms?**
> The architecture record, the offer and reservation contract, the offer selection and the exclusion record for public and multi-lender matching say that publishing an offer is the lender's standing acceptance and that a reservation needs no second lender approval; the selection adds that there is no second lender-approval step. The offer-and-reservation and terms state records, the responsibility record, the terms contract and the origination flow require matching borrower and lender approvals of the final candidate terms before commitment, a lender approval distinct from its earlier approval of the commercial offer. Whether these describe different stages or contradict each other is undecided. Until the user answers, read every description of final approval, commitment and amendment in this guide with that question open.

**Open question: expiry of an unused reservation.** Whether a reservation that expires before the terms are committed, with no prefund attempted, simply expires or also costs the borrower an infraction and a block on that offer is undecided; the reservation timing passage above gives both sides, and the [Participant Access And Loan Operations](participant-access-and-loan-operations.md) guide lists it.

**Excluded.** Version 1 is not public or multi-lender matching, pooled lender capital, product custody or automatic deployment of lender capital, and must not be described as any of them; the [matching and pooling exclusion](../../system-model/contracts/scope/scope-011-public-multi-lender-pooling-custody-and-automatic-capital.md) records the user's decision and allows a revisit only through a new approved design. Bitcoin liquidation, automated surplus return and shortfall enforcement are also excluded, under the [liquidation exclusion](../../system-model/contracts/scope/scope-012-bitcoin-liquidation-surplus-and-shortfall.md).

**Deferred.** The terms may carry a protection expiry as a reference only. Choosing a protection provider and running exercise and settlement are deferred under the [protection operations scope record](../../system-model/contracts/scope/scope-004-protection-or-put-option-operations.md), and the question that would design them is out of scope. A bound reference authorizes no spend, transfer, liquidation or provider discretion.

**Conditional.** A loan can carry a commitment to a fallback secret only if it is created with the approved fallback capability, and that capability is not available until counsel approval and implementation evidence activate it; the [Base Observation And Fallback Review](base-observation-and-fallback-review.md) guide explains it.

**Where delivery stands.** The delivery sequence records its earlier slices, including the protocol library, the coordination service, the Vault and the product, as implemented. The change that adds the participants' destination and secret preparation step to the coordination service is planned but not yet executed, so the preparation step described above is not yet built; the local demonstration remains blocked on it and on the matching Vault and product changes, the cross-domain acceptance evidence and the unfinished demonstration supervisor. Deployment to a test network or mainnet, publication of complete environment manifests, and production activation are separate later gates that have not been passed.

No question for this domain is waiting in an open or deferred ticket; one ticket, on protection operations, is out of scope. An unresolved detail is settled through its ticket; neither this guide nor a diagram can supply a missing approval.

The [domain record](../../system-model/domains/loan-terms-and-commitments/domain.md) lists exactly what the domain owns and excludes, and the [terms contract](../../system-model/contracts/interfaces/iface-001-loan-terms-and-canonical-binding.md) holds the byte-level encoding.
