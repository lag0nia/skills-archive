# Loan Terms And Commitments

This domain gives each loan one fixed meaning that every part of the system shares, from the lender's offer to the committed terms, so that offers, Vault keys, dollar payments and Bitcoin transactions cannot disagree about who is paid, how much, by when, or under which secrets. The [architecture guide](../architecture.md) shows how it fits with the other four domains.

## What does this domain do?

The system arranges one loan between a borrower and one selected lender. The borrower locks bitcoin as collateral, and the lender lends USD Coin (USDC), a dollar-denominated token, on **Base**, the blockchain where the loan contracts run. The product application and its loan workspace, each participant's **Vault** (a separate application holding that participant's encrypted keys and secrets), the Base contracts, the signed Bitcoin transaction packages and the chain observers all produce artifacts about that loan. If they disagreed about participants, amounts, deadlines, destinations or secret commitments, a signature or payment could apply to the wrong loan or recipient.

The domain's one responsibility, [Loan terms, one-loan offer, reservation, and parameter binding](../../system-model/domains/loan-terms-and-commitments/responsibilities/sr-001-loan-terms-offer-reservation-and-parameter-binding.md), defines four things and keeps them apart:

- A **firm one-loan offer** is a lender's published commercial proposal for exactly one loan: principal, total debt, repayment deadline, optional protection expiry and collateral amount.
- A **reservation** is one borrower's atomic selection of one offer revision. It creates the loan's stable, random identity (`loan_id`) and a commercial draft, but no agreement.
- The **loan terms** (`LoanTermsV1`) are the versioned list of per-loan facts, and the **terms hash** (`terms_hash`) fixes their exact values.
- The **deployment manifest** (`ProtocolDeploymentV1`) identifies the environment the loan runs in, not the loan.

It also defines how a terms candidate is assembled, approved, committed, cancelled or superseded, and it requires every consumer to reject an artifact that does not bind exactly to its loan.

## What do the loan terms contain?

The terms hold only facts fixed before the borrower sends collateral: the loan identity and terms version, amounts and deadlines, the collateral amount, each participant's keys, accounts and payout destinations, and two secret commitments. Borrower and lender appear as random per-loan references that map privately to their accounts; these are not account identifiers, keys or wallet addresses.

The secrets are X, held by the borrower, and Y, held by the lender. Each Vault generates its own secret, and the terms carry only H(X) and H(Y), SHA-256 hashes that fix a secret without revealing it. X becomes public when the borrower accepts the funded loan on Base, and the lender discloses Y after a normal repayment; the [Bitcoin Authorization And Recovery](./bitcoin-authorization-and-recovery.md) guide explains what each unlocks. A loan created with the approved fallback capability also binds a commitment H(S) to a fallback secret S; that capability's production availability remains gated.

The terms hash is a Keccak-256 hash over all fields in one exact order, prefixed with a fixed label for this format, so changing any field changes it. It is not interchangeable with H(X) or H(Y). The [loan terms interface](../../system-model/contracts/interfaces/iface-001-loan-terms-and-canonical-binding.md) owns the field order, encoding and accepted address spellings.

Several fields look alike but carry different authority, and they stay separate wherever they are parsed, stored, shown, signed or paid:

| Identity | What it is | What it must not become |
| --- | --- | --- |
| Loan-specific Bitcoin public key | Identifies the per-loan key with which the participant signs that loan's collateral transactions | A payout destination |
| External Bitcoin payout destination | An address the participant chose, valid for the configured network, to receive bitcoin | An escrow script or a signing key |
| Base protocol account | An externally owned account (EOA) derived by the participant's Vault and registered as the participant's immutable public identity, identifying them as a caller on Base | A capital wallet or a payout recipient |
| Base payout recipient | The address fixed in the terms to receive USDC | Something a payer can change |
| Vault payment account | A separate, independently recoverable Base account in the Vault that can pay USDC | A loan term, protocol caller or recipient by default |

The deployment manifest instead names the Base chain, the loan contract with its implementation and code hash, the USDC contract, the Bitcoin network, uniform timing and policy values, and the declared upgrade authority. There is one per complete environment (production, test and local), and it excludes endpoints, credentials, application settings, secrets and dynamic loan facts. Every consumer recomputes the manifest's fingerprint before use, and components acting on Base also check the live chain, contract, code and USDC identity. Each loan stores its originating fingerprint, so a later release cannot silently retarget it; a manifest changes only through a new pinned release of the shared protocol library, as the [deployment manifest interface](../../system-model/contracts/interfaces/iface-002-protocol-deployment-manifest.md) specifies.

## How does an offer become committed terms?

Illustrative example, not a requirement: a lender publishes an offer of 10,000 USDC principal and 10,400 USDC total debt against 0.25 bitcoin of collateral, with a fixed repayment date. Publication approves those commercial values only. A signed-in borrower browses the offers and selects this one.

```figure
caption: No step before the last approves the final terms, and changing any hashed field sends the candidate back for fresh approvals.
step: Publish | The lender publishes a firm offer for one loan.
step: Reserve | One borrower's selection atomically creates the reservation, loan identity and commercial draft.
step: Allocate | Each Vault allocates that loan's key and returns only public identities.
step: Prepare | Each Vault confirms the role's payout destinations and returns H(X) or H(Y).
step: Assemble | The application builds one complete candidate with a version and exact terms hash.
step: Approve | Each role approves that exact candidate; the second matching approval commits it once.
```

This is the sequence the detailed records specify. The architecture record describes the lender's approval differently, an open conflict explained under [What is open, excluded or deferred?](#what-is-open-excluded-or-deferred)

The reservation binds the borrower's and lender's actual accounts under a per-offer reservation number; if two borrowers select at once, one wins and the other gets no loan. It lasts 24 hours: the terms must be committed, and a valid prefund must be visible on the Bitcoin network, before it ends. Each Vault handles requests bound to its participant, role and loan, reuses the role's secret for that loan if one exists, and returns only public results; confirming destinations never chooses a secret. The application assembles the candidate only when both roles' results are durable, freezes it, and shows each participant the readable terms and both sides' identities. Approvals must match the exact candidate version and hash while the reservation is current, unexpired and uncancelled, and the second approval and the agreement's creation happen in one transaction, exactly once.

Three words mark different moments. **Reserved** means a borrower holds the offer and the loan identity exists, but no agreement does. **Approved** means one role has approved one exact candidate. **Committed** means both matching approvals exist and the terms are frozen.

The committed agreement is an immutable record of the loan identity, candidate version, terms hash and both approvals; it is not a signature or a chain fact. The borrower's **prefund** (the Bitcoin transaction that stages the collateral) and the Bitcoin packages are built only against committed terms. When the Base funding window opens, the contract receives the complete terms, recomputes the hash and rejects a mismatch. The reservation is consumed only later, when the borrower's acceptance on Base, which makes X public, is finalized.

## What does the domain receive and provide?

It receives authenticated participants, roles, offers, reservations and approval commands from [Participant Access And Loan Operations](./participant-access-and-loan-operations.md), whose workspace is the application authority for offer and reservation state; this domain defines what that state means. From each Vault it receives only public identities, destinations and commitments.

It provides the committed terms, terms hash, approval and cancellation records, and deployment manifest to every domain. Because Bitcoin transactions cannot carry the loan identity, [Bitcoin Authorization And Recovery](./bitcoin-authorization-and-recovery.md) packages are bound to the loan identity, terms version and terms hash through their manifests and origination record. [Base USDC Settlement And Funding](./base-usdc-settlement-and-funding.md) recomputes the terms hash and checks the deployment. [Base Observation And Fallback Review](./base-observation-and-fallback-review.md) validates the deployment before trusting evidence. The workspace persists and presents the terms.

## What can go wrong, and how is it recovered?

- **Terms change before commitment.** Any change to a hashed field creates a new candidate version and hash and invalidates every earlier approval.
- **Retries and races.** A repeated identical approval or retried commitment returns the existing result, and simultaneous final approvals commit at most once. Stale, wrong-role, wrong-loan, changed-candidate, expired or cancelled approvals are rejected.
- **Cancellation or expiry before commitment.** Either participant may cancel, and reaching the 24-hour expiry cancels the draft. Cancellation is immutable and terminal for that reservation and blocks commitment and package construction. A reopened offer uses the next reservation number and a fresh loan identity.
- **No collateral after commitment.** If no valid prefund is visible by the 24-hour deadline, the application cancels the reservation, reopens the offer, blocks that borrower from it, adds one infraction and notifies both parties. A valid prefund keeps the reservation; if it stays unconfirmed for 72 hours, it goes to manual review without an automatic infraction. Failure before X becomes public follows the [pre-activation unwind flow](../../system-model/behavior/flows/flow-003-preactivation-unwind.md).
- **Amending before activation.** Before the collateral escrow is active, terms change only through a later version with two fresh approvals; the old version becomes superseded history, and dependent packages and signatures are produced again. Once the escrow or Base loan is in effect, nothing is amended in place.
- **A mismatched artifact.** Consumers reject an unsupported encoding or manifest, a changed fingerprint, the wrong chain, contract, asset or network, a mixed environment, the wrong key, destination or commitment, and anything that does not bind exactly. The action fails closed, and no workspace copy, snapshot, Base record or observer view can repair it.

## Who decides what?

This domain decides what offers, reservations, loan identities, terms versions and deployments mean, and which approvals commit a candidate. Authentication, Vault decryption and signing, Bitcoin construction, Base settlement, observation, workflow coordination and fallback publication belong to other domains, and chain state belongs to the Base contracts and Bitcoin consensus. The selected lender alone decides whether, when and from which wallet to fund, even after commitment; the product never pools, holds or automatically deploys lender capital, and never liquidates collateral.

A protocol key or Base protocol account never silently becomes a payout destination, and a workspace copy or acceptance snapshot never becomes a second authority. A participant may choose a Vault payment account's address as a recipient for a new loan only after it is qualified as recoverable and its separate, limited transfer capability is disclosed; the choice fills an existing recipient field, needs the normal fresh approvals and never rewrites an earlier loan.

> **A matching hash identifies; it does not authorize**
> The right loan identity and terms hash show which agreement an artifact belongs to. They grant no signing, secret disclosure, funding, payout selection or execution authority, and approving the terms grants no Vault, transaction or custody authority.

## Why was it designed this way?

- **Exact binding.** A mismatched artifact could authorize the wrong participant, loan, recipient, secret, contract, transaction or final spend of the collateral. Approvals and cancellations are explicit because dependent setup must never act on an unaccepted, changed, cancelled or ambiguously retried agreement.
- **One-loan offers with atomic reservation.** One offer for one loan makes reservation atomic and understandable; invitations or lender-by-lender approvals would add a second commercial decision after the borrower chooses, and a pooled listing would need allocation rules the first version (V1) does not need. The approver, the person who reviewed and approved the design, specified that a borrower's acceptance reserves the offer automatically, approved one loan per offer, and chose real accounts with a per-offer counter for reservations, which preserves history after cancellation.
- **Environment facts outside the terms.** The approver asked that values repeated for every loan, such as the chain identifier, stay out of the terms, and approved one fingerprinted manifest per environment so components cannot use incompatible fixed values.
- **A hash Base can recompute.** A database-only identifier would not bind Base state to the terms used for Bitcoin packages, so the hash uses an encoding the contract can recompute; the approver accepted this on the recommendation of the design agent, the AI agent that drafted the design.
- **A fixed deadline.** At the approver's request, the repayment deadline is fixed before origination with a 24-hour cushion, so it is known before setup and does not move if setup runs long.

## What is open, excluded or deferred?

### The lender's approval is an open conflict

The [architecture record](../../system-model/architecture.md#purpose-and-binding) says publication is the lender's standing acceptance and that reservation creates the canonical loan without a second lender approval. Similar wording appears in the offer interface, the exclusion record, the lender capital-control rule, the offer selection record and the origination flow's preconditions. The [responsibility record](../../system-model/domains/loan-terms-and-commitments/responsibilities/sr-001-loan-terms-offer-reservation-and-parameter-binding.md), the [terms state record](../../system-model/contracts/states/state-002-canonical-loan-terms.md), the [offer state record](../../system-model/contracts/states/state-001-one-loan-offer-and-reservation.md) and the [origination flow's steps](../../system-model/behavior/flows/flow-001-origination-preparation-and-qualification.md) say instead that publication approves only commercial values, that reservation creates only an identity and a draft, and that both roles explicitly approve the same final candidate, the second matching approval committing it.

Both sides trace to recorded instructions from the approver: an earlier one that a borrower's acceptance reserves a firm offer with no second lender approval, and a later one that both participants approve the final terms separately. The discrepancy is recorded as unresolved; no decision has chosen between the statements or changed the behavior either describes, and this guide does not settle it.

### Excluded and deferred

- **Excluded:** [public or multi-lender matching, pooled capital, custody and automatic capital deployment](../../system-model/contracts/scope/scope-011-public-multi-lender-pooling-custody-and-automatic-capital.md), which would change allocation, funding authority, custody, accounting, security and likely legal boundaries; V1 must not be described as a marketplace.
- **Excluded:** [collateral liquidation, surplus return and shortfall enforcement](../../system-model/contracts/scope/scope-012-bitcoin-liquidation-surplus-and-shortfall.md).
- **Deferred:** [protection or put-option operations](../../system-model/contracts/scope/scope-004-protection-or-put-option-operations.md). The terms may carry a protection expiry at least seven days after the repayment deadline, but it authorizes no spend, transfer or liquidation, and no provider is selected or operated.
- **Outside V1:** converting the Base contract to an immutable deployment, and routing loans to a successor deployment.
- **Future:** a mutually agreed extension would be a fresh loan with its own identity, terms, escrow, secrets and packages, linked to the original only off-chain.

The [domain record](../../system-model/domains/loan-terms-and-commitments/domain.md) lists exactly what the domain owns and excludes.
