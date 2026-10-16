# Bitcoin Authorization And Recovery

This domain keeps Bitcoin collateral under the participants' own control while making the transactions they signed in advance usable across interruptions, outages and races. The [architecture guide](../architecture.md) shows where it fits next to the agreement, the Base settlement and the product application.

## What this domain does

Collateral passes through two different Bitcoin outputs. A **prefund** stages the borrower's Bitcoin before the loan starts; an **escrow** is the later confirmed collateral output, locked by a script that both participants agreed to. Transactions are prepared as partially signed Bitcoin transactions (PSBTs), a format that carries a transaction together with what a signer needs to review and sign it. A signed transaction is evidence of an exact earlier authorization. It is not permission for the application to choose a new destination. Bitcoin consensus, including confirmations and timelocks, decides what can be spent and which spend is final.

Three secrets and one timelock open different routes out of the escrow:

- the borrower's secret **X** enables acceptance of the loan on Base and the fixed activation that creates the escrow;
- the lender's secret **Y** enables the borrower's normal recovery of collateral after the lender claims the repayment;
- an optional independent secret **S**, for loans created with that capability, enables the same recovery transaction after a separate refund event on Base;
- a **long-stop** route, included in every newly constructed escrow, is authorized by the borrower in advance and becomes usable after an absolute timelock, without any secret. An existing escrow cannot acquire it later.

None of these gives the organization a key to the collateral.

## How its responsibilities work together

[Bitcoin prefund, escrow, and package construction](../../system-model/domains/bitcoin-authorization-and-recovery/responsibilities/sr-002-bitcoin-prefund-escrow-and-package-construction.md) builds and checks the scripts, outputs, amounts, fee variants, signatures and the whole set of linked transactions, here called the **package graph**. It operates only the route that current chain and package evidence justify. It consumes committed terms and participant key allocations; it cannot allocate a key or invent a missing binding. It also owns fee selection, sending transactions to the network, independent observation of the Bitcoin chain, and the boundary around a separately funded fee-bump transaction.

[Borrower Bitcoin authorization and recovery](../../system-model/domains/bitcoin-authorization-and-recovery/responsibilities/sr-004-borrower-bitcoin-authorization-and-recovery.md) keeps the borrower's Vault, seed, loan keys and X inside the dedicated Vault web origin, and does the borrower's signing there. It allocates or restores the loan's keys, has the encrypted state acknowledged, prepares the borrower's public addresses and the hash of X, and signs an exact batch of transactions. Accepting the loan is deliberately two-step: the borrower first reviews facts that contain no secret; a narrowly unlocked worker then prepares the exact transaction that carries X; and only a second confirmation tied to those exact bytes authorizes signing and submission. Account recovery in the product cannot recreate a forgotten Vault password.

[Lender Bitcoin authorization and recovery](../../system-model/domains/bitcoin-authorization-and-recovery/responsibilities/sr-009-lender-bitcoin-authorization-and-recovery.md) applies the same local boundary to the lender: the lender's loan key and Y, signing of the lender's fixed default route, the normal claim that reveals Y, manual export of the default transaction, and fresh signatures for a cooperative settlement.

The domain receives committed terms from the loan-terms domain, finalized public X and Y from Base observation, an independently published S from the fallback service, and fee estimates and chain evidence from external providers. It gives the product workspace unsigned transactions to present for signing, transaction status and alerts. Signing in to the product gives no plaintext authority over either participant's keys or secrets, although a stolen account could retrieve encrypted Vault data for an offline password-guessing attack.

## A normal case

1. **Initial set.** After the terms are committed, the borrower funds the prefund. Once the per-loan preparation has been acknowledged and the exact prefund output has been observed and validated against the agreement, even with no confirmations yet, the domain builds six activation and six refund transactions, one per fee level: 10, 20, 50, 100, 150 and 200 satoshis per virtual byte. The borrower signs all twelve; the lender adds its signature to the six activation transactions.
2. **Signing order.** Unsigned construction comes first. The application then stores one immutable signing batch; the participant's Vault signs exactly that batch; the application checks the signatures cryptographically and writes the complete set to durable storage; only then does it issue a receipt. The receipt can never be an input to the signing that produces it.
3. **Qualification.** Building and signing can happen early, but nothing relies on the prefund until it has six unchanged confirmations. Only then can the Base funding window open and acceptance become possible.
4. **Activation.** When X is public and final on Base, the system inserts it into one chosen activation transaction and broadcasts it. Other signed activation transactions remain valid competitors until one of them spends the prefund.
5. **Exit set.** Only after one activation transaction actually has six confirmations does the domain build the exit transactions, and only for that exact escrow: six borrower-recovery, six lender-default and six borrower long-stop transactions (one record still counts this set differently; see the open points below). The borrower signs the two borrower routes; the lender signs its own route. The loan becomes fully active when that set is signed and durably stored.
6. **Normal recovery.** After repayment, the lender's claim on Base makes Y public. Y completes the borrower's already-signed recovery transaction without changing its output, signature or identity, and the collateral is recovered when it confirms.

```figure
caption: Exit transactions exist only for the escrow that actually confirmed, and each participant signs only their own routes.
step: Build initial set | Six activation and six refund transactions, one per fee level.
step: Sign and store | Participants sign; the full set is stored before any receipt.
step: Qualify | Six unchanged prefund confirmations.
step: Activate | Public X completes one activation transaction.
step: Build exit set | Eighteen exit transactions for the confirmed escrow only.
step: Recover | Public Y completes the borrower's signed recovery transaction.
```

## Exceptions and recovery

- **Exit set incomplete.** If exit signing or storage is incomplete after activation confirms, the loan stays explicitly pending signatures and the participants keep being prompted. Principal already paid and confirmed escrow cannot be undone. A different activation winner requires a fresh exit set for the escrow that actually exists.
- **Changed or reorganized parent.** If the prefund or escrow parent is replaced, lost or conflicted, every transaction built on it is invalidated and must be rebuilt and re-signed. If the same unchanged parent is only reorganized, bytes and signatures stay valid but use pauses until it qualifies again.
- **Lender silence, default and long-stop.** Valid public S, for a loan created with the activated capability, fills the same borrower recovery transaction as Y. Separately, the lender's default route becomes valid after its own consensus deadline, three days after the repayment deadline, and the borrower long-stop after ten days. Once both are valid they run concurrently and only one confirmed spend wins. A Base repayment or refund cannot revoke those signatures.
- **Cooperative settlement.** Both participants can agree a new outcome and sign it with their same loan keys. The complete product and accounting operation around it is deferred.
- **Fees.** Fees are fixed in advance because the transactions are signed before use. Fee estimates use integer units, the expected signed transaction size, a strict buffer comparison, freshness limits and replacement rules. The levels are target fee classes, not guaranteed minimum rates. When even the signed levels are not enough, a small **pay-to-anchor** output in the activation, refund, normal recovery, default and cooperative transactions lets a separately funded child transaction add fee. An authorized operator approves an exact fee and exports the request from the operations dashboard; a separate local helper builds an unsigned child; the operator then signs, finalizes and broadcasts it manually with a dedicated Bitcoin Core fee wallet on the same operator-controlled machine, whose private key the application never receives; and independent observation reports the result. The fee wallet gains no participant authority.
- **Unknown outcomes.** A relay timeout is ambiguous, not permission to send a different transaction. Retry follows durable reconciliation of the exact attempt and agreement between independent sources. A wrong binding, stale bytes, contested facts, missing stored evidence or an invalid route blocks the affected action.

## Authority boundaries

The domain decides which fixed, already-signed route is eligible and operates it. It does not decide what the loan terms mean, what happened on Base, how final a Base event is, whether the fallback evidence conforms, who may sign in to the product, or anything about lender capital. It must never choose a new destination, hold a collateral key for the organization, or treat a relay response, fee estimate, observer report, public secret, Base event or stored package as an accepted broadcast, a confirmation or a decision about who receives the collateral.

## Choices and their reasons

Several fixed choices have recorded reasons:

- **Exact scripts and signatures.** Every package must match the verified route exactly and every signature is cryptographically checked, because a script, witness or signature defect can make recovery impossible, pay the wrong output or expose a secret or key.
- **One fixed Vault encryption profile.** A single, code-owned password-derivation and encryption profile, rather than one tuned per device, keeps every backup of this version interoperable and makes hostile-input checks cheap and predictable.
- **Sequential per-loan keys.** Each new loan takes the next unused hardened key index in the participant's Vault, which avoids collisions between loans and makes allocation predictable after a Vault is restored.

These reasons support the existing contracts; they do not add any recovery authority.

The fee levels themselves were set by the user, and the rule of choosing the lowest signed level strictly above the estimate plus a 25 percent buffer was recommended by the agent and approved by the user. Applying that rule to activation and to the prefund refund was chosen by the agent. The fee tickets hold these attributions, and the domain record links them.

## Open, excluded and deferred

Two points are open because the records that own them disagree. Neither is decided here.

- **How many exit transactions are stored.** The construction record, the exit-availability rule and the activation flow specify six borrower-recovery, six lender-default and six long-stop transactions, eighteen in all. One archive sentence in the [construction record](../../system-model/domains/bitcoin-authorization-and-recovery/responsibilities/sr-002-bitcoin-prefund-escrow-and-package-construction.md) still calls the post-activation phase a twelve-package set. The normal case above follows the eighteen-transaction contract.
- **What happens when no fee level qualifies.** The general rule in the [fee selection contract](../../system-model/contracts/interfaces/iface-007-bitcoin-fee-estimate-and-tier-selection.md), and the settled fee-selection decision, say that when no signed level is enough, the 200 level is used, fee-bump eligibility is recorded and an alert is raised for a separate manual decision, without creating another parent transaction. The same contract's tier-selection action says the result fails closed and selects nothing when no level qualifies. A reader should treat this case as undecided.

Several capabilities are outside this version, each with its own condition for revisiting it: automatic organization broadcast of lender-default transactions ([automatic lender-default broadcast](../../system-model/contracts/scope/scope-001-automatic-lender-default-broadcast.md)); institutional recovery of stranded collateral ([institutional last-resort recovery](../../system-model/contracts/scope/scope-002-institutional-last-resort-collateral-recovery.md)); activation when the borrower does not respond ([borrower non-response activation](../../system-model/contracts/scope/scope-003-borrower-nonresponse-activation-recovery.md)); a stronger way to recover from a forgotten Vault password, which this version cannot do at all ([stronger Vault recovery](../../system-model/contracts/scope/scope-006-stronger-participant-vault-recovery.md)); and complete cooperative settlement operations ([cooperative settlement operations](../../system-model/contracts/scope/scope-005-cooperative-settlement-operations.md)).

The [domain record](../../system-model/domains/bitcoin-authorization-and-recovery/domain.md) lists exactly what the domain owns and excludes.
