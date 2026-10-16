# Loan Terms And Commitments

This domain makes every part of the system refer to the same loan. The borrower's and lender's Vaults, the loan contract on Base, the Bitcoin transactions and the application's records all check against one agreed set of terms, so no part can sign or process a different meaning under the same name. The [architecture guide](../architecture.md) shows where this domain fits in the whole system.

## What this domain does

A loan touches many separate places. The lender publishes an offer in the product; each participant's **Vault**, the dedicated browser application that holds that participant's keys and secrets, prepares keys and payout destinations; the loan contract on Base moves USDC, a dollar-denominated token; and Bitcoin transactions lock and release the collateral. Each of these produces artifacts that must agree on the participants, amounts, deadlines, destinations and secret commitments. This domain owns that shared meaning.

It distinguishes four things that are easy to confuse:

- A **firm offer** is the lender's published commercial proposal for exactly one loan: principal, rate and dates.
- A **reservation** is one borrower's selection of one revision of that offer. It is identified by the offer and a counter that grows with each later reservation of the same offer, and it creates the loan's stable random identifier.
- **The loan terms** are the ordered, versioned agreement data. A fingerprint over their exact encoding, the **terms hash**, identifies them; changing any covered value changes the fingerprint.
- **The deployment manifest** identifies the environment rather than the loan: which Base chain, contract and code, which USDC token, which Bitcoin network, and which timing and upgrade policy apply. It excludes web addresses, credentials, application settings and secrets, and it carries its own fingerprint.

A matching identifier or fingerprint proves which agreement an artifact describes. It does not authorize a spend, a transfer or a signature, and it does not establish anything that happened on a chain.

## How its one responsibility works

The domain has a single responsibility, [Loan terms, one-loan offer, reservation, and parameter binding](../../system-model/domains/loan-terms-and-commitments/responsibilities/sr-001-loan-terms-offer-reservation-and-parameter-binding.md). It defines the loan's identity and encoding, assembles candidate versions, records both participants' approvals, commits the agreement once, and handles cancellation and replacement by a later version.

Its output is consumed by every other domain:

- **Bitcoin authorization and recovery** builds the collateral transactions only from committed terms whose Bitcoin keys came from the participants' acknowledged Vault results, and binds every package to them.
- **Base settlement and funding** accepts only the pinned terms and deployment, including the fixed recipients for principal, repayment and refunds.
- **Base observation** rejects events from any deployment other than the pinned one.
- **Participant access and loan operations** stores and shows the same candidate and agreement, and records each participant's approval.
- **Each Vault** checks the same role and loan before it returns a public identity or signs anything.

The domain receives its inputs from the operations domain and from the Vaults: the offer revision, the borrower's selection, the participants' immutable account identities, each Vault's public loan identity and prepared destinations and commitments, and each participant's approval of an exact candidate.

## A normal case

A lender publishes a firm offer. Publication is the lender's standing acceptance of the offer; the detailed records limit that approval to the proposed commercial values, a point that is [still open](#open-excluded-and-deferred). A borrower selects it, and in one atomic step the offer becomes a reservation for that borrower, the loan receives its stable identifier, and a commercial draft is stored. If another borrower selects the same offer at the same moment, that selection loses and no second loan exists. The borrower then has 24 hours to make a valid Bitcoin prefund before the reservation lapses.

Next, each participant's Vault allocates a fresh, never-reused key for this loan, saves its encrypted state, and returns only the public result: the loan's Bitcoin public key and the participant's already registered Base address. Each Vault then confirms the participant's Base recipient and external Bitcoin destination, and creates the participant's secret, X for the borrower and Y for the lender, or reuses the one it already holds for this loan. Only the secret's hash leaves the Vault.

When both allocation results and both preparation results are durably recorded, the application assembles one complete candidate version of the terms with its terms hash. The product shows the terms in understandable form together with both participants' bound identities. The borrower and the lender each approve that same version and hash through their signed-in accounts. The second matching approval commits the agreement exactly once, in the same transaction that records it.

The result is one committed agreement that every later step checks. Committing it does not move any money or Bitcoin, does not consume the reservation, and gives neither participant's approval any signing, custody or funding power. The lender still decides separately whether and when to fund the loan.

How this explicit lender approval of the final terms relates to the lender's earlier standing acceptance is undecided; see [what remains open](#open-excluded-and-deferred).

## Exceptions and recovery

- **Changed terms.** Any change to a value covered by the terms hash creates a new candidate version and hash and invalidates every earlier approval. Both participants must approve again.
- **Retries and duplicates.** An identical repeated approval, or a retried commitment, returns the same recorded result. Two final approvals arriving together still commit at most once. A changed approval sent under the same identity is rejected.
- **Stale or wrong approvals.** An approval for an old version, the wrong role, the wrong loan, mismatched content, or an expired or cancelled draft is rejected.
- **Wrong artifacts.** Every consumer rejects an unsupported encoding, a changed fingerprint, the wrong chain, contract, token or Bitcoin network, a manifest that mixes environments, a wrong key or destination, and any dependent artifact that does not bind exactly to the terms.
- **Amendment before activation.** Before the collateral is active, the terms can be replaced only by a later version with fresh approvals and freshly built dependent artifacts. An active loan is never amended in place.
- **Cancellation.** Cancellation ends that reservation permanently and is kept as history. Reopening the offer requires the next reservation number and a fresh loan identifier.
- **Unused reservation.** A reservation that reaches its 24-hour expiry before the terms are committed and without any prefund attempt simply expires; no loan and no second lender approval may be inferred from it.
- **No prefund.** If no valid prefund appears within 24 hours under the prefund rule after the terms are committed, the operations domain cancels the reservation, reopens the offer, blocks that borrower from the same offer and records an infraction. A valid prefund that is still unconfirmed after 72 hours goes to manual review without an automatic infraction.

## Authority boundaries

The domain decides what the loan means and whether an artifact belongs to it. It must not decide or imply anything else:

- It does not authenticate participants, assign roles, decrypt a Vault or sign. Those belong to the operations domain and the Vaults.
- It does not hold, allocate or deploy lender capital. The selected lender alone controls funding.
- It does not build Bitcoin transactions, execute Base calls, observe either chain or coordinate the workflow.
- The participants' identities stay separate. A loan's Bitcoin public key, a participant's Base protocol address, an external payout destination and a Vault payment account are four different things. A protocol key or protocol address must never silently become a payout destination, and a Vault payment account can pay into the loan without becoming a recipient or a protocol caller. A fresh loan may use a Vault payment address as the value of an existing recipient field only through the normal role authorization and fresh approvals; historical terms never change.
- A workspace copy or an acceptance snapshot is a presentation copy. It never becomes a second source of the agreement's meaning.

## Choices and their reasons

- **One exact encoding, separate from the environment.** The recorded reason is interoperability and verifiability: divergent encodings, or immutable loan facts mixed with deployment facts, could bind signatures, manifests and chain actions to different loans or make a package impossible to reproduce. The exact encoding and accepted address spellings are fixed in the [terms and binding contract](../../system-model/contracts/interfaces/iface-001-loan-terms-and-canonical-binding.md).
- **One reviewed deployment manifest.** Separately maintained configuration files per component would allow a cross-domain mismatch that is hard to detect after funds move, and remotely fetched configuration could change without review. One strict manifest with a self-checking fingerprint gives every consumer one reviewable identity, at the cost that changing an environment requires a new package version and consumer deployment. The [deployment manifest selection](../../build/records/selections/sel-010-protocol-deployment-manifest.md) records this trade-off.
- **One offer, one loan, one reservation.** Direct invitations or lender-by-lender approval would add a private second commercial decision after the borrower chooses, and a pooled listing would need allocation rules this version does not need. The [offer and reservation selection](../../build/records/selections/sel-012-one-loan-offer-reservation-and-binding.md) records the choice. Its statement that there is no second lender-approval step is one side of the [open question](#open-excluded-and-deferred) below about what the lender approves.

## Open, excluded and deferred

**Open question: what the lender approves, and when.** One group of records says the lender gives no second approval: the architecture record, the offer and reservation contract, the offer and reservation selection, the scope boundary for matching and pooling, and the funding vault state all say there is no second lender approval, and the selection adds that reservation binds the borrower, the selected lender and the canonical terms. The responsibility record, the offer and reservation state and the origination flow instead limit publication to approval of the proposed commercial values only, say that neither publication nor reservation commits the final terms, and require the lender to approve the exact final terms explicitly, an approval the state record calls distinct from the earlier commercial one. An answered ticket records the decision as no email invitation or second lender approval, quoting the user that a click to accept accepts automatically, while its resolution phrases the rule as no second commercial approval; and a later recorded instruction says both participants approve the final terms separately afterward. The unqualified wording that there is no second lender approval, and the statement that reservation already binds the terms, do not settle it, so the point remains undecided. The normal case above follows the detailed records step by step; whether the standing-acceptance wording allows that sequence is exactly what remains to be answered.

**Excluded.** Public or multi-lender matching, pooled lender capital, product custody of capital, automatic capital deployment and liquidation are outside this version and must not be described as present. The [scope boundary for matching, pooling and custody](../../system-model/contracts/scope/scope-011-public-multi-lender-pooling-custody-and-automatic-capital.md) holds the revisit condition.

The [domain record](../../system-model/domains/loan-terms-and-commitments/domain.md) lists exactly what the domain owns and excludes, and the [offer and reservation state](../../system-model/contracts/states/state-001-one-loan-offer-and-reservation.md) and [canonical terms state](../../system-model/contracts/states/state-002-canonical-loan-terms.md) hold every transition.
