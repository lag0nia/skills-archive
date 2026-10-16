# Bitcoin Authorization And Recovery

This domain keeps the borrower's Bitcoin collateral under the participants' own keys and prepares, in advance, the fixed transactions each party may later need to recover what it is owed. Bitcoin's consensus rules, not the application, decide when collateral can move and when an outcome is final. The [architecture guide](../architecture.md) shows where it fits in the system.

## What this domain does

The loan's collateral lives on Bitcoin, while the USDC (a dollar stablecoin) moves on the Base network. Bitcoin cannot observe Base, so the domain prepares fixed Bitcoin transactions that become usable only when a secret becomes public or when a Bitcoin timelock matures. The participants authorize those transactions in advance; afterwards the system can operate them, but cannot change where the Bitcoin goes.

The concepts a reader needs:

- **Prefund.** Before the loan starts, the borrower sends Bitcoin to a staging script. It holds the collateral plus a reserve for fees, and the borrower can reclaim it after a relative timelock of 259,584 seconds (about three days) if the loan never activates.
- **Escrow.** When the loan activates, an activation transaction spends the prefund into the escrow, the collateral output on which every later route depends. Any unused part of the borrower's reserve returns to the borrower's committed destination.
- **Package.** A partially signed Bitcoin transaction (PSBT) for one fixed route, built by the system and signed by a participant. Each route exists in six variants, one for each pre-signed fee level of 10, 20, 50, 100, 150 and 200 satoshis per virtual byte (sat/vB).
- **Secrets.** The borrower's secret **X** completes the activation; it becomes public when the borrower accepts the funded loan on Base. The lender's secret **Y** completes the borrower's normal recovery; it becomes public when the lender claims a valid repayment on Base. A third secret **S** can complete the same recovery transaction as Y, but only for a loan created after the independent validation service's production activation with the hash of S committed in advance, and only after that service publishes S following a finalized Base refund of an unclaimed repayment. None of them gives the organization a collateral key.
- **Long-stop.** A borrower-signed route that needs neither Y nor S, only an absolute timelock.
- **Vault.** A separate browser application in which each participant generates a 12-word seed, derives a fresh key for each loan, keeps its secrets and signs. The Vault encrypts its seed, keys and secrets under the participant's password with one fixed encryption profile. Signing in to the product never unlocks the Vault.
- **Consensus time.** Timelocks use Bitcoin's median time past (MTP), the consensus clock, never an application or provider clock.

## How its responsibilities work together

Three responsibilities share the work:

- [Bitcoin prefund, escrow, and package construction](../../system-model/domains/bitcoin-authorization-and-recovery/responsibilities/sr-002-bitcoin-prefund-escrow-and-package-construction.md) builds and checks the prefund and escrow scripts, every package and its fee variants, and the graph that links them. It selects fees, relays transactions and uses independent chain evidence, and it operates only a route that current chain and package evidence justify. It consumes committed loan terms and acknowledged public keys; it cannot allocate a key or invent a missing binding.
- [Borrower Bitcoin authorization and recovery](../../system-model/domains/bitcoin-authorization-and-recovery/responsibilities/sr-004-borrower-bitcoin-authorization-and-recovery.md) keeps the borrower's Vault, seed, loan keys and X local. It allocates the loan's keys, prepares the borrower's destination and the hash of X, signs exact batches of packages, and performs the explicit acceptance that reveals X.
- [Lender Bitcoin authorization and recovery](../../system-model/domains/bitcoin-authorization-and-recovery/responsibilities/sr-009-lender-bitcoin-authorization-and-recovery.md) applies the same local boundary to the lender's key and Y: it signs the activation candidates and the lender's timelock route, performs the repayment claim that reveals Y, exports a default package for manual use and signs a cooperative settlement afresh.

The domain receives the committed loan terms from Loan Terms And Commitments, finalized Base facts such as a public X or Y from Base Observation And Fallback Review, and narrowly bound signing requests, storage and receipts from Participant Access And Loan Operations, which holds the signed packages. It reports package and route status and confirmed outcomes back to the workspace. The Base contracts never read Bitcoin: the funding window opens only after the prefund qualifies on Bitcoin, and later Bitcoin actions follow only finalized public secrets or matured timelocks.

### How a package gets signed and stored

Signing follows one order that cannot be shortcut. The Bitcoin operations build unsigned candidates; the application stores one immutable signing batch; the participant's Vault checks its role, loan, current snapshot, destinations and exact bytes, then signs; the application verifies every signature; the complete set is written to locked object storage; and only then is a durable receipt issued. A receipt can never be an input to the signing that produces it, and a missing binding, package set or confirmed parent cannot be inferred further down the chain.

## A normal case

The following case is illustrative; it shows who acts and what proves each step.

```figure
caption: Before activation. The prefund and the activation are relied on only after six unchanged confirmations agreed by two sources.
step: Prefund | The borrower funds the staging script; signing may start before it confirms.
step: Initial packages | The borrower signs six activations and six refunds; the lender signs the activations.
step: X revealed | The borrower accepts on Base, making X public; the system waits for Base finality.
step: Activation | The system adds X to one activation and broadcasts it; the loan is activation pending.
```

**Prefund and initial packages.** After the terms are committed, the borrower sends Bitcoin to the prefund address. The system may build and sign the initial packages against the exact observed prefund even before it confirms, but six unchanged confirmations are required before the funding window opens and before anything else relies on it. The initial set has six activation and six refund candidates. The borrower signs all twelve and the lender verifies and signs the six activations. Each activation and each refund carries a small 240-satoshi pay-to-anchor (P2A) output so that its fee can be raised later without re-signing.

**Activation.** When the borrower's acceptance on Base reaches finality, X is public. The Bitcoin operations select one activation candidate under the fee rule, insert X and broadcast it, rebroadcasting the same transaction if needed. Until one activation has six confirmations the loan is *activation pending*. If a different pre-signed activation confirms instead, that actual winner becomes the escrow.

```figure
caption: After activation. The exit packages exist only for the escrow that actually confirmed.
step: Exit packages | After six confirmations, eighteen exit packages are built, signed and stored.
step: Y revealed | The lender claims the repayment on Base, making Y public.
step: Recovery | The system adds Y to the borrower's recovery and broadcasts it; it closes on confirmation.
```

**Exit packages.** Only for the confirmed escrow does the system build the eighteen exit packages: six borrower normal-recovery variants, six lender timelock variants and six borrower long-stop variants. The borrower signs its twelve, and the lender independently signs its six. Each participant signs only its own fixed-destination protection routes, so neither needs the other's signature to use them. The set is stored and receipted before the loan is shown as active.

**Normal recovery.** After valid repayment, the lender claims on Base and Y becomes public. Once that claim is final, the system selects a fee level, adds Y to the borrower's pre-signed recovery transaction and broadcasts it. The collateral is returned when that spend confirms; no fresh borrower signature, output change or new destination is involved.

### The routes after activation

| Route | Signed by | Becomes usable | Pays |
| --- | --- | --- | --- |
| Normal recovery | Borrower | When Y is public after a final claim, or, for an eligible loan, when S is validly published | The borrower's committed destination |
| Lender timelock | Lender | Once MTP is strictly later than T, three days after the repayment deadline D | The lender's committed destination |
| Borrower long-stop | Borrower | Once MTP satisfies B, ten days after D, without Y or S | The borrower's committed destination |
| Cooperative settlement | Both, freshly | By new agreement of both participants | As freshly agreed |

The lender timelock and the long-stop do not cancel each other. After B both can be valid, and whichever spend confirms first is the outcome. A Base repayment or refund cannot revoke a signed package.

## Fees, relay and observation

Because packages are signed before use, their fees are fixed in advance. When a route is operated, the system takes a fresh one-block estimate and picks the lowest pre-signed level that is strictly greater than 1.25 times the estimate, using integer arithmetic only. Estimates come from Mempool, then Blockstream Esplora, then Validation Cloud; each request has a 15-second deadline, and an estimate fetched more than 120 seconds before the first broadcast is not used. Before a candidate enters the mempool, a fresh estimate may select another signed level. Once an activation or exit transaction is accepted, only a child transaction can add fee; a relayed refund may be replaced only by a higher pre-signed refund that Bitcoin's replacement rules permit.

A transaction that stays unconfirmed because its fee is too low can be accelerated with a child-pays-for-parent (CPFP) transaction that spends the anchor output. One authorized operator approves and exports an exact request, a separate local helper builds an unsigned child, and a manually unlocked Bitcoin Core fee wallet signs and broadcasts it. The fee wallet gains no authority over the parent transaction.

Transactions are relayed through Mempool first and Blockstream Esplora second, each attempt with a 15-second deadline. A timeout is ambiguous, not proof of failure: the exact attempt is reconciled before any fallback or resend, retries then follow after one minute, two minutes and every five minutes, and a permanent rejection blocks the action and alerts.

Every lifecycle gate requires fresh agreement between two independent Bitcoin sources: Blockstream and Validation Cloud on mainnet, Blockstream and Mempool on Signet, and two connected Bitcoin Core nodes on the local regtest network. If they report different confirmation counts for the same block, the lower count is used. A conflict, or both sources being unavailable, blocks only the automation that depends on the contested fact; it escalates after five minutes or one missed block and is treated as critical at once after the borrower's acceptance.

## Exceptions and recovery

- **The loan never activates.** If funding or acceptance does not happen in time and no X has been accepted, the prefund refund matures after its relative timelock. With fresh two-source agreement and a stored refund set, the system relays one pre-signed refund and may replace it only with a higher pre-signed level. When a refund confirms, origination is cancelled and the encrypted X is deleted under the retention policy.
- **Activation stalls after X is public.** The system must keep operating the same selected activation; it cannot refund the prefund or build an unapproved replacement.
- **Exit packages are incomplete.** The loan stays *terminal signing pending* and recovery work continues; nothing undoes the principal or the escrow.
- **Reorganizations.** A changed or lost parent invalidates every pre-signed descendant, which must be rebuilt and re-signed. A reorganization that keeps the same parent preserves bytes and signatures but pauses reliance on it until it requalifies.
- **The borrower does not repay.** Once MTP is strictly later than T, the lender exports a current lender timelock package after fresh reauthentication and broadcasts it with its own tools. The organization does not select, schedule or broadcast it.
- **The lender does not claim a valid repayment.** The lender's Base claim closes at C, two days after D, and the exact repayment can then be refunded to the borrower on Base. On Bitcoin, normal recovery still needs Y or, for an eligible loan, S. Independently of either secret, the lender timelock route becomes valid once MTP is strictly later than T and the long-stop once MTP satisfies B, so any valid route may confirm first. This is a residual risk for a borrower who repaid, not a default.
- **Wrong or stale input.** A wrong binding, stale bytes, a contested fact, missing primary storage evidence or an invalid route blocks the affected action.
- **A forgotten Vault password.** Product sign-in and support cannot recover it; stronger Vault recovery is deferred.

## Authority boundaries

The domain decides how Bitcoin transactions are built, checked and operated under fixed rules. It must not:

- give the organization, the Base contract, the validation service or any fee wallet a collateral key or a choice of destination;
- treat a Base record, an application status, a relay response or a missing secret as a Bitcoin outcome;
- decide what the loan terms mean, which belongs to Loan Terms And Commitments, or classify Base finality, which belongs to Base Observation And Fallback Review;
- hold lender capital, liquidate collateral or handle product sign-in.

> **Signed is not sent, and sent is not final**
> A signed package proves exact prior authorization, not permission to choose a new destination. A broadcast or a mempool sighting is not confirmation. Routes end only when a spend of the escrow confirms, and the actual confirmed spender decides which route won.

## Choices and their reasons

- **Exact scripts and witnesses.** A mismatch in a script or witness can strand the collateral or authorize the wrong party, so every package binds exact scripts, outputs and signatures.
- **One fixed Vault encryption profile.** A fixed envelope and key-derivation profile make encrypted backups portable; the [Vault encryption selection](../../build/records/selections/sel-027-fixed-v1-participant-vault-cryptographic-profile.md) adds that a single profile avoids variable parameters, negotiation and a migration framework, at the cost of excluding a device that cannot meet it.
- **A fresh hardened key per loan.** Per-loan derivation avoids index reuse, cross-loan correlation and a wider compromise; [sequential loan indices](../../build/records/selections/sel-004-sequential-hardened-loan-indices.md) avoid collisions and let a restored Vault resume above its highest allocated index.
- **Pre-signed fee levels with a strict buffer.** Fixed fees are necessary because the transaction is signed before use; integer units, the actual transaction size, the strict comparison, estimate freshness and the replacement rules prevent underestimation or unsafe reselection.

## Open, excluded and deferred

> **Open conflict: no qualifying fee level**
> When no pre-signed level is strictly above the buffered estimate, the fee contract's payload section and its implementation ticket select the highest level, 200 sat/vB, record CPFP eligibility and alert. The same contract's action definition and a former decision say the selection fails closed and selects nothing. Neither reading has been chosen; the [domain record](../../system-model/domains/bitcoin-authorization-and-recovery/domain.md#choices-and-rationale) keeps both.

> **Open conflict: twelve or eighteen exit packages**
> One archive sentence in the package responsibility still calls the exit phase a twelve-package phase. The rest of that responsibility and the flow, state, invariant and timing records specify eighteen exit packages, as this guide describes. The stale sentence awaits a separate repair.

Several capabilities are deferred, each with its own condition for being revisited: automatic broadcast of the lender's default package by the organization, any institutional last-resort collateral recovery, activation on the borrower's behalf when the borrower does not accept, stronger Vault recovery for a forgotten password, and complete cooperative settlement operations. For cooperative settlement, the Bitcoin mechanism of six variants freshly signed with both loan keys is defined, but its signing session, Base accounting and support procedures are deferred. Bitcoin liquidation, automated surplus return and shortfall enforcement are excluded from version 1. The scope records, starting with [automatic lender-default broadcast](../../system-model/contracts/scope/scope-001-automatic-lender-default-broadcast.md), hold each boundary.

The [domain record](../../system-model/domains/bitcoin-authorization-and-recovery/domain.md) lists exactly what the domain owns and excludes.
