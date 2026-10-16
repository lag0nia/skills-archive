# Bitcoin Authorization And Recovery

This domain keeps the borrower and the lender in control of the Bitcoin collateral, while making the transactions they approved in advance usable across interruptions, outages and races. Bitcoin's own rules, not the application, decide which of those transactions can spend the collateral and which one finally did. The [architecture guide](../architecture.md) shows where this domain fits in the whole system.

## What this domain does

The collateral never sits in a wallet the organization controls. It moves through two different Bitcoin outputs:

- The **prefund** is where the borrower first stages the collateral, sent from the borrower's external wallet before the loan is active.
- The **escrow** is the output that secures the active loan. One **activation** transaction moves the prefund into it.

Every way of spending these outputs is prepared as a **package**: a partially signed Bitcoin transaction (PSBT), a standard format that carries a transaction together with what a signer needs to review and sign it. Each package pays a fixed destination that was agreed in the terms. A signed package is evidence of an exact earlier authorization; it gives nobody, including the application, permission to choose a new destination.

Three secrets unlock different routes, and they are not interchangeable:

- The borrower's **X** accepts the loan on Base and completes the activation transaction.
- The lender's **Y**, revealed when the lender claims the repayment on Base, completes the borrower's normal recovery transaction.
- An optional **S**, held by an independent validation service for eligible loans, can complete that same recovery transaction, but only after the lender failed to claim, the unclaimed repayment was refunded on Base and that refund event is final. A missing Y alone never releases S.

Two further routes need no secret but wait for time: the lender's **timelocked recovery**, and the borrower's **long-stop**, a later absolute-time route that returns the collateral to the borrower. None of these routes gives the organization a key to the collateral.

The repayment deadline D anchors the timing. Bitcoin evaluates time by its median-time-past rule over recent blocks, not by any application clock.

## How its responsibilities work together

**[Bitcoin prefund, escrow, and package construction](../../system-model/domains/bitcoin-authorization-and-recovery/responsibilities/sr-002-bitcoin-prefund-escrow-and-package-construction.md)** builds and checks every script, output, amount, fee variant, manifest and signature, and keeps the graph of packages that depend on each other. It uses only committed terms whose keys came from the participants' acknowledged Vault results; it cannot allocate a key or fill in a missing binding. It also owns fee selection, relaying transactions to the network, independent Bitcoin observation, and the boundary around fee-bump transactions. It operates only a route that current chain and package evidence make eligible.

**[Borrower Bitcoin authorization and recovery](../../system-model/domains/bitcoin-authorization-and-recovery/responsibilities/sr-004-borrower-bitcoin-authorization-and-recovery.md)** keeps the borrower's seed, loan keys and X inside the borrower's Vault, the dedicated browser application on its own web origin. The Vault allocates the loan's key, prepares the borrower's public destination and the hash of X, signs exact batches of packages, and performs the deliberate acceptance that reveals X. It also holds the borrower's separate Base payment account.

**[Lender Bitcoin authorization and recovery](../../system-model/domains/bitcoin-authorization-and-recovery/responsibilities/sr-009-lender-bitcoin-authorization-and-recovery.md)** applies the same local boundary to the lender: its loan key and Y, its signatures on the activation transactions and on its own timelocked recovery, the claim that reveals Y, the manual export of its recovery package, fresh signatures for a cooperative settlement, and its separate Base payment account.

The domain receives committed terms and destinations from the terms domain, finalized public X and Y from Base observation, a published S from the validation service, and stored packages and durable requests from the operations domain. It provides the operations domain with unsigned signing batches, route status, alerts and the final classification of how the escrow was spent. Signing in to the product never exposes either participant's plaintext keys or secrets.

## A normal case

**Before activation.** Once the terms are committed, the borrower sends the prefund. The construction responsibility may start building from the exact observed prefund even before it confirms, but relying on it, opening the funding window on Base and allowing acceptance all require six unchanged confirmations. It builds six activation transactions and six borrower refund transactions, at fee levels of 10, 20, 50, 100, 150 and 200 satoshis per virtual byte. Every activation preserves the exact collateral amount and returns the borrower's unused fee reserve to the borrower's committed destination; every refund pays the borrower's committed destination. Each of these transactions carries a small anchor output, called pay-to-anchor, that lets a later child transaction add fee.

The signing order is fixed. The construction responsibility produces unsigned candidates with every public fact a signer needs; the operations domain stores them as one immutable batch; the borrower's Vault signs all twelve and the lender's Vault adds its signature to the six activation transactions; the operations domain checks every signature, writes the complete set to its primary archive, and only then issues a receipt. The receipt can never be an input to the signing that produces it.

**Acceptance and activation.** The borrower accepts in two confirmations. First the borrower reviews the public facts. Then a narrowly unlocked worker inside the Vault prepares the exact acceptance transaction carrying X, and a second confirmation bound to those exact bytes authorizes signing and submission. The acceptance call itself makes X public on Base; once that acceptance reaches Base L1 finality, the construction responsibility may act on it, completing one activation transaction with X and broadcasting it.

**The recovery packages.** No recovery package exists until one activation transaction actually reaches six confirmations, because until then nobody knows which escrow output the recovery packages must spend. For that actual escrow, the domain builds six variants of the borrower's normal recovery, six of the lender's timelocked recovery and six of the borrower's long-stop. The borrower signs both of its families; the lender independently signs its own. Each participant signs only routes that pay its own fixed destination. The loan becomes package-ready active only after this set is archived and acknowledged. The records disagree about how many packages that archived set contains; see [what remains open](#open-excluded-and-deferred).

**Normal close.** After the borrower repays on Base and the lender claims by revealing Y, the finalized public Y fills the witness of the borrower's already signed normal recovery transaction. Nothing else changes: the outputs, the signature and the package entry stay the same. The construction responsibility selects a fee variant and broadcasts it, and the escrow counts as recovered only when that transaction confirms.

## Exceptions and recovery

**The prefund changes or a block is reorganized.** If the prefund is replaced or lost, every package that depends on it becomes invalid and must be rebuilt and re-signed. If the same prefund is merely reorganized, the signed bytes remain valid but qualification pauses until it is confirmed again.

**A different activation transaction wins.** All six signed activation variants can spend the prefund. If a different one confirms than the one the platform selected, that actual winner becomes the only parent, and any recovery packages built for another parent are invalid.

**Recovery signing is incomplete.** If either participant has not finished signing after activation confirms, or the archive receipt fails, the loan stays explicitly "terminal signing pending" and keeps prompting. The principal already paid and the confirmed escrow cannot be undone.

**Origination stops before acceptance.** If X is never accepted, the borrower's prefund refund becomes usable after its relative timelock. The organization may then broadcast one signed refund variant, but only with fresh agreement from two Bitcoin observers that the prefund is unspent and with finalized Base state showing no accepted X. A refund already relayed may be replaced only by a higher, already signed refund variant.

**Fees.** The parent transactions are signed before they are used, so their fees are fixed in advance at the six levels. The selection rule picks the lowest signed level that is strictly more than 1.25 times a fresh one-block estimate, computed in whole-number units. Estimates come from Mempool, then Blockstream Esplora, then Validation Cloud, each with a 15-second deadline and one retry; an estimate is usable only if fetched at most 120 seconds before the first broadcast. If no estimator gives a usable value, automatic broadcast stops and an operator may record only an existing signed level with its reason. The records disagree about what happens when every signed level is too low; see [what remains open](#open-excluded-and-deferred). Once an activation or recovery transaction is in the mempool, only a separate fee-bump child can add fee; a relayed refund may instead be replaced by a higher, already signed refund variant.

**Fee-bump children.** The pay-to-anchor output lets the organization's dedicated fee wallet pay for a child-pays-for-parent (CPFP) transaction without changing the signed parent. One authorized operator approves and exports an exact request; a separate local helper builds only an unsigned child from confirmed fee-wallet inputs; the operator's own Bitcoin Core node, manually unlocked, signs and broadcasts it; and independent observation finds the actual child. The fee wallet gains no participant authority, and the child cannot change the parent's destination or amount.

**Relays and observation.** A broadcast is provisional. Each exact-byte attempt goes first to Mempool and then to Blockstream Esplora, with a 15-second deadline. A timeout is ambiguous, not a failure: the attempt is reconciled against independent evidence before any fallback or resend, and never replaced by a different transaction. Exhausted attempts retry from durable state after one, then two, then every five minutes. Independent Bitcoin observation uses two sources per network, and lifecycle gates require their fresh agreement; repeated problems update one incident, which escalates after five minutes or one missed block and is critical immediately once X is public.

**When the lender never reveals Y.** If the lender does not claim before the claim cutoff, two days after D, the repayment becomes refundable to the borrower on Base. For a loan created after the validation service is activated for production, the service may publish S only after independently verifying that exact refund event at Base L1 finality, and S then completes the same borrower recovery transaction that Y would have. Lender silence, elapsed time or a missing Y never triggers S. Without Y or S, the lender's timelocked recovery becomes valid three days after D and the borrower's long-stop ten days after D. A repayment or refund on Base cannot revoke those signatures, because Bitcoin cannot see Base. After ten days both can be valid at once, and the first to confirm wins; one confirmed spend is the only final outcome.

**Lost password.** Without the Vault password, a participant cannot disclose its secret, rebuild packages, sign anything new or settle cooperatively. Already signed, unchanged packages remain usable under their own conditions. For the lender, losing the password before signing its recovery packages leaves that protection unsigned; this window is a recorded residual risk.

## Authority boundaries

The domain decides how the collateral can be spent, through which fixed routes, and which spend actually happened. It must not decide or imply:

- the meaning of the terms, any Base state or Base finality, or whether a published S was justified;
- product sign-in, lender capital, liquidation, or any organization key to the collateral;
- that a relay response, fee estimate, observer report, public secret, Base event, cached status, clock reading or archived package proves a broadcast, a confirmation or a completed loan, or chooses who receives the collateral.

The participants alone authorize spending of the collateral, and only in their Vaults. The organization's fee wallet can add fee to a signed transaction but cannot alter it. A finalized public secret allows only the matching fixed transaction to be completed; it is not general signing power.

## Choices and their reasons

- **Fixed, pre-signed fee levels.** Parents are signed before use, so the six levels fix their possible fees in advance; any higher fee must come from a separately authorized child, never from a newly invented parent. Whole-number arithmetic, the transaction's actual virtual size, a strict buffer comparison, estimate freshness and the replacement rules are recorded as what prevents underestimating a fee or reselecting unsafely. The six levels were specified and approved by the design's human owner.
- **Exact scripts and witnesses.** A construction or finalization defect can make a transaction unspendable, pay the wrong output or leave a recovery route unavailable, and one library defect can affect every loan built with it. That is why scripts, witnesses and manifests are checked exactly against golden fixtures and independent implementations.
- **One fixed encryption profile for the Vault.** A single source-controlled profile keeps every backup interoperable between builds and devices, at the cost of excluding a device that cannot meet its unlock cost.
- **A new hardened key for every loan.** Each loan uses the next unused key index, never reused, even after cancellation. The key selection's recorded reason is that sequential indices avoid collisions and keep allocation deterministic after a restore. The domain record adds that hardened per-loan derivation avoids index reuse, correlation between loans and a wider compromise, and the threat record confirms that a leaked loan key is limited to that one loan. It does not protect that loan once a route the stolen key can use on its own becomes usable, because the thief can then sign a new transaction to any destination.
- **No organization collateral authority.** Automatic organization broadcast of lender recovery, institutional collateral recovery, company-held acceptance and forgotten-password recovery are kept out of this version, because each would change who holds custody of, or authority over, the collateral, the keys or the borrower's consent.

## Open, excluded and deferred

**Unresolved conflict: the size of the active-phase package set.** One sentence of the construction responsibility calls the signed set that must be archived after activation a 12-package phase. The same responsibility, the package-graph state, the archive invariant, the activation flow and the long-stop flow all describe 18 recovery packages: six normal recovery, six lender recovery and six long-stop. Both statements stand in their records and the question is undecided. The normal case above describes the 18 packages that the construction and signing steps produce, and leaves the size of the archived set open.

**Unresolved conflict: when every fee level is too low.** The fee interface's payload rule and the answered fee-selection ticket say that if no signed level exceeds the buffered estimate, the system uses the 200 level, records that a fee-bump child may be needed and alerts. The same interface's selection action says the result is a fail-closed "no eligible tier" that selects nothing. Until this is decided, it is unknown whether a transaction would be broadcast at 200 in that situation.

**Excluded or deferred, each with its own revisit condition:**

- [Automatic organization broadcast of lender recovery](../../system-model/contracts/scope/scope-001-automatic-lender-default-broadcast.md). The lender may only export its package for its own broadcast, and only once that package's Bitcoin condition is valid.
- [Institutional last-resort collateral recovery](../../system-model/contracts/scope/scope-002-institutional-last-resort-collateral-recovery.md), which would give the organization a collateral key.
- [Activation without the borrower's response](../../system-model/contracts/scope/scope-003-borrower-nonresponse-activation-recovery.md). Without the borrower's deliberate acceptance, the loan unwinds.
- [Stronger Vault recovery](../../system-model/contracts/scope/scope-006-stronger-participant-vault-recovery.md), such as recovery codes or social recovery.
- [Complete cooperative-settlement operations](../../system-model/contracts/scope/scope-005-cooperative-settlement-operations.md). The cooperative transactions themselves are defined, but the signing experience, Base accounting and support process are not.

The [domain record](../../system-model/domains/bitcoin-authorization-and-recovery/domain.md) lists exactly what the domain owns and excludes, and the [package graph state](../../system-model/contracts/states/state-009-bitcoin-package-graph.md) and [escrow outcome state](../../system-model/contracts/states/state-015-bitcoin-escrow-and-terminal-outcome.md) hold every transition.
