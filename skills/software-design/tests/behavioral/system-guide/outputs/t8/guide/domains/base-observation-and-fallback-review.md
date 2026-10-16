# Base Observation And Fallback Review

This domain makes evidence from one chain safe to use elsewhere in a Bitcoin-backed USDC loan. It supplies trustworthy observations of what happened on Base, and it defines a narrowly limited fallback that may help return Bitcoin after an unclaimed repayment has been refunded. The [architecture guide](../architecture.md) shows where it fits in the system.

## What this domain does

The Base contracts settle the USDC; Bitcoin independently controls the collateral. A transaction appearing in a wallet, an updated application screen or a missing lender response cannot bridge those two authorities. Before the rest of the system acts on something that happened on Base, it needs to know that the event really belongs to this loan and this deployment, and that it will not disappear in a chain reorganization.

Two ideas matter here:

- **Base L1 finality** is the stronger settlement condition a Base block reaches once its data is final on Ethereum. Base describes it as roughly 20 minutes. Earlier stages, "observed" when an event first appears in a block and "safe" once its batch is posted, are progress information only.
- The **evidence-conditioned validation service** is one contracted independent service that holds a unique random secret, S, for each eligible loan. Before the loan is built, it returns only the hash of S, which goes into the Bitcoin recovery script. Publishing S later lets the borrower's already signed recovery transaction be completed.

Observation reports facts; the fallback controls one secret's disclosure. Neither decides who deserves the collateral or signs a Bitcoin transaction.

## How its responsibilities work together

[Base observation, finality, and reconciliation](../../system-model/domains/base-observation-and-fallback-review/responsibilities/sr-006-base-observation-finality-and-reconciliation.md) follows the approved deployment and reads its named contract events: funding window opened, funding finalized, sweeps and expiries, acceptance, repayment, claim, refund-recipient switch and refunds. It checks which chain, contract deployment, loan, transaction and block produced each event, records its finality, and repairs the application's view when evidence changes. It also reconciles independently sourced Bitcoin evidence and classifies payment-transfer evidence.

[Evidence-conditioned validation-service fallback](../../system-model/domains/base-observation-and-fallback-review/responsibilities/sr-007-evidence-conditioned-validation-service-fallback.md) defines the independent service: one random S per loan, only its hash before the loan, protected retention, and durable public publication of S only after independently verifying one exact finalized refund event. It does not trust the application observer's conclusion.

The domain receives contract events from Base USDC Settlement And Funding and the expected deployment from Loan Terms And Commitments. It provides finalized facts to Participant Access And Loan Operations, which shows them and schedules work, and, through public X, Y or S, the evidence Bitcoin Authorization And Recovery needs to complete its fixed transactions.

## A normal case: establishing a fact the system can use

Take the lender's claim on a repaid loan.

1. The claim appears in a Base block. The observer records it as observed, with its chain, contract, transaction, block and log position. The application may show it, labeled as awaiting finality.
2. The observer sends the event to the application through a versioned ingestion handoff. The application stores the source evidence and acknowledges it, and only then does the observer advance its durable cursor, the saved position from which it can safely resume. If an acknowledgement is lost, the observer sends the same event again, and its stable identity prevents a duplicate.
3. When the block reaches Base L1 finality, the claim becomes a lifecycle fact. Only now may the application treat Y as public and the Bitcoin automation complete the borrower's recovery. The same rule applies to funding, acceptance, repayment and refund.

Alchemy is the primary Base data source and QuickNode the fallback. One healthy configured provider is enough for a finalized fact; the second supplies failover and disagreement detection. Bitcoin is held to a stricter rule: Bitcoin lifecycle gates need fresh agreement between independent configured sources, not just one healthy source.

## Exceptions and recovery

- **A reorganization.** When a chain reorganization displaces an observed event, the observer keeps it as noncanonical evidence, appends a correction and replays from the last common finalized block. It never deletes the earlier observation or invents a compensating event.
- **Providers fail or disagree.** If both Base providers are unavailable or disagree, existing finalized views stay visible and fresh Base data is shown as delayed, operations are alerted after five minutes, and new consequential actions that depend on Base are blocked.
- **Bitcoin sources conflict.** A conflict or outage blocks dependent automation and is retried every minute. Repeated reports update one incident, which escalates after five minutes or one missed Bitcoin block. Recovery replays from the last agreed state, and a failure after the borrower has accepted is treated as critical immediately.
- **An operator asks for a recheck.** An operator may request a recheck through the application, but cannot change a fact, override a result or advance the cursor.
- **Payment transfers.** A participant's payment from a Vault payment account is probed at 0, 15 and 60 seconds and escalated at 180 seconds. Exact transaction and nonce evidence can update that payment's own record, but only the named finalized contract event establishes funding or repayment. A confirmed transfer that is not a loan payment never advances the loan.

### When the borrower repays but the lender does not claim

A concrete case shows why the fallback is separate. Assume exact repayment finalized by the repayment deadline, D. Normally the lender claims the USDC by revealing Y before the claim cutoff, C, two days after D. If the lender cannot or does not reveal Y, valid repayment alone does not release the Bitcoin.

At C, Base permanently disables the claim and freezes the borrower's refund recipient. A borrower worried about access to the original recipient may have switched it, once and before C, to the borrower's own committed protocol address on Base; whatever is current at C is final. Anyone may then call the fixed-effect refund; the caller cannot choose where the money goes, and claim and refund can never both happen. Once the refund's exact event reaches Base L1 finality, the observer can report that the exact repayment was returned once. The refund does not require the fallback service, and the Bitcoin escrow is still unspent.

For an eligible loan, the validation service then independently checks the configured deployment, the loan, the exact refund event, the amount, the frozen recipient, provenance and L1 finality. Only then may it publish the matching S durably and publicly. The Bitcoin automation separately checks the publication against the committed hash, the existing signatures and the still-unspent escrow, and uses S in the same borrower-signed recovery transaction that could have used Y. No new borrower signature, second transaction family, service signing key or new destination is introduced. Publication, broadcast and confirmed Bitcoin recovery are three separate steps.

```figure
caption: Only one exact finalized refund event can lead to publication of S, and S can only complete a transaction the borrower already signed.
step: Repaid, not claimed | Exact repayment finalized by D; no claim before C.
step: Refund | At C anyone may trigger the fixed refund to the frozen borrower recipient.
step: Finality | The refund event reaches Base L1 finality.
optional: Verify and publish | Only for a loan created after activation: the service verifies independently and publishes S.
optional: Recover | The automation completes the borrower's signed recovery with S and broadcasts it.
```

## Authority boundaries

The observer decides how final a Base event is and keeps the history that explains it. It does not create the fact, approve its consequence, execute Base transactions or edit application status. The validation service decides only whether one loan's committed S may be published, by a fixed rule; it is not an evidence arbiter, holds no Bitcoin key, chooses no destination and cannot sign. The company, the borrower and the lender never receive an unrevealed S and cannot command an early release.

Missing Y, elapsed time, an application assertion, a raw token transfer or the earlier repayment event can never trigger S publication.

## Choices and their reasons

- **One uniform finality rule.** Consequential steps wait for Base L1 finality, accepting extra waiting in return for one consistent rule at every cross-chain boundary. It is not a promise of an exact waiting time.
- **Event history rather than snapshots.** Ordered contract events were chosen so that a restart or provider change can reconstruct what happened, instead of trusting a mutable loan snapshot or an independently edited watcher status.
- **Provider failover without a quorum on every action.** One healthy provider suffices for finality, so two simultaneous responses are not a prerequisite for every loan action.
- **A secret-holding service instead of an arbiter.** The selected fallback avoids giving the service a Bitcoin key or a discretionary role in judging evidence. Its secret can still be disclosed too early, withheld, lost or compromised, which is why independent controls and the activation gate remain material.

## Open, excluded and deferred

> **The fallback is selected, not available**
>
> Production use needs counsel approval and implementation evidence. Until that gate is satisfied, a new loan must not commit the hash of S or advertise the fallback, and an existing loan without it can never acquire it later.

- **Residual risk.** If the service is unavailable, evidence is wrong or S cannot be published, the Base refund remains complete and Bitcoin recovery through S stays unavailable. The lender's signed recovery can still become valid three days after D under Bitcoin's consensus time; a borrower long-stop becomes valid ten days after D without Y or S but does not cancel the lender route, and one confirmed spend wins. Mutual cooperation is another separately authorized route. These are [residual Bitcoin risks](../../system-model/contracts/invariants/inv-025-missing-y-residual-lender-risk.md), not evidence of borrower default after valid repayment and not a guarantee that the collateral returns.
- **Deferred, outside this design:** [automatic company broadcast of lender recovery transactions](../../system-model/contracts/scope/scope-001-automatic-lender-default-broadcast.md) and [institutional last-resort collateral recovery](../../system-model/contracts/scope/scope-002-institutional-last-resort-collateral-recovery.md). Monitoring, package storage and the validation service give the company no collateral key, sale authority or discretionary payout power.
- **Deferred payment profile:** confirming payments from Vault payment accounts in public use needs two separately operated Base providers plus the independent observer; that public profile is deferred, and only the local demonstration's profile, with one local chain and the observer, is defined.

The [domain record](../../system-model/domains/base-observation-and-fallback-review/domain.md) lists exactly what the domain owns and excludes.
