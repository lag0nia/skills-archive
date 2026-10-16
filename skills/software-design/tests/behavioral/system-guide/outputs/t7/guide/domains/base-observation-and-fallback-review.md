# Base Observation And Fallback Review

This domain turns what happened on the Base network into facts the rest of the system can safely act on, and it defines a narrowly limited fallback that can help return a borrower's Bitcoin after a repayment the lender never claimed. The [architecture guide](../architecture.md) shows where these facts are used.

## What this domain does

The Base contracts settle the USD Coin (USDC), and Bitcoin independently controls the collateral. Nothing on either chain can see the other, and neither a wallet notification, an updated screen nor a lender's silence is proof of anything. Before the application changes a loan's status, or before a Base event leads to a Bitcoin action, someone must establish exactly which contract recorded which event for which loan, and whether that event can still be undone. That is this domain's first job.

Its second job concerns one hard case. If a borrower repays on time but the lender never claims the repayment, the lender's secret Y never becomes public, and Y is what normally completes the borrower's Bitcoin recovery transaction. For eligible loans, this domain defines how an independent service may publish a backup secret S that completes the same transaction.

A reader needs two terms. **Base layer-1 finality** is the point at which the Ethereum batch containing a Base block is final, roughly 20 minutes after the block; before that, an event can still disappear in a chain reorganization. The **evidence-conditioned validation service (ECVS)** is one contracted, independent service that holds the backup secret S for each eligible loan and publishes it only after verifying one exact Base event.

Neither job decides who deserves the collateral, and neither signs a Bitcoin transaction.

## How its responsibilities work together

[Base observation, finality, and reconciliation](../../system-model/domains/base-observation-and-fallback-review/responsibilities/sr-006-base-observation-finality-and-reconciliation.md) follows the approved Base deployment, records each named contract event with its provenance and finality, and repairs the application's view when evidence changes. It also reconciles independently sourced Bitcoin evidence and the outcome of payments sent from participants' Vault payment accounts.

[Evidence-conditioned validation-service fallback](../../system-model/domains/base-observation-and-fallback-review/responsibilities/sr-007-evidence-conditioned-validation-service-fallback.md) defines the ECVS: a unique secret S per loan, a hash commitment to S fixed in the loan before any Bitcoin transaction is signed, and publication of S only after the service independently verifies the exact final refund event.

The two are deliberately separate. Observation reports facts to the application; it never controls S. The ECVS can use the observer's event reference as a pointer, but it verifies the event itself and never trusts the application's conclusion. The Base contracts produce the events, the participant application stores and displays them, and Bitcoin operations consume the final facts and any published S.

## A normal case: establishing a fact

The following case is illustrative. Ben has finalized the funding of Ana's loan on Base.

1. **Reading the event.** The observer reads the funding event from Alchemy, its primary data provider, and checks the chain, the contract deployment and its code, the loan, the transaction and the block. Each event gets a stable identity from those fields.
2. **Showing progress.** The application may show the event as soon as it is seen. Even Base's intermediate "safe" status, reached in about two minutes, is shown as progress only.
3. **Waiting for finality.** When the block reaches layer-1 finality, the observer delivers the event to the application through a versioned ingestion handoff. The application stores it, derives the status Ana and Ben see, and acknowledges storage.
4. **Advancing the cursor.** Only after that acknowledgement does the observer advance its durable cursor, the saved position from which it resumes. If an acknowledgement is lost, the observer sends the same event again, and its stable identity prevents a duplicate.

The final funding event is one of the inputs Ana's acceptance step needs. The application opens that step only after a fresh check that Bitcoin evidence still agrees, that the funding is less than 24 hours old, and that at least 19 hours remain before the prefund refund becomes valid. The same observation pattern applies to acceptance, repayment, the lender's claim and every refund.

## A fallback case: an unclaimed repayment

The following case is illustrative, for a loan created after the ECVS passed its production gate.

Ana's exact repayment is finalized by the deadline D, and that event becomes final. Ben does not claim it. At C, two days after D, the Base contract permanently disables Ben's claim and freezes Ana's refund recipient. Anyone can then trigger the refund, which pays the exact repayment once to that recipient. The refund never waits for the ECVS.

When the refund's exact event reaches layer-1 finality, the ECVS checks it independently: the configured chain, deployment and contract code, the event, the loan, the transaction and log, the block's canonical status and finality, the exact amount and the frozen recipient. Only then does it publish S, durably and publicly, with evidence binding it to this loan and event. Anyone can check S against the hash commitment recorded in the loan.

Bitcoin operations then check the publication, the commitment, the stored recovery transaction that Ana signed after the activation escrow confirmed, and that the escrow is still unspent. They insert S into that same transaction, unchanged in every other respect, and broadcast it. Ana's recovery is complete only when that transaction confirms on Bitcoin; the ECVS's publication is neither a broadcast nor a confirmation.

```figure
caption: The fallback starts only from one exact, final refund event, and ends only with a confirmed Bitcoin spend.
step: Repaid | Exact repayment is final by D, but the lender does not claim.
step: Cutoff | At C the claim is disabled and the refund recipient freezes.
step: Refunded | The refund pays the exact repayment once and its event becomes final.
step: Verified | The ECVS independently checks that exact event and publishes S.
step: Recovered | The borrower's existing recovery transaction is completed with S and confirms.
```

## Exceptions and recovery

**Provider failure or disagreement.** QuickNode is the fallback to Alchemy. One healthy provider is enough to establish a final Base fact; the second supplies failover and disagreement detection. If both fail, or two healthy providers disagree, facts already final stay visible, but every new action that depends on Base is blocked until the incident is resolved.

**A reorganization.** If a reorganization displaces an event the observer had seen, the event is kept as non-canonical evidence rather than deleted, a correction is appended, and the application's view is rebuilt from the last common final block.

**An operator wants a recheck.** An operator can request a recheck through the application, but cannot change a fact, override a result or advance the observer's cursor.

**Bitcoin evidence.** Unlike Base, Bitcoin gates need fresh agreement between two independent sources. A conflict or outage blocks dependent automation, repeated reports update one incident, and recovery replays from the last agreed state. An incident escalates after five minutes or one missed block, and is treated as critical immediately once the borrower has revealed X.

**Payments from a Vault payment account.** Exact transaction and nonce evidence can update that payment's own record. Reconciliation probes the outcome at 0, 15 and 60 seconds and escalates at 180 seconds, and an unresolved outcome blocks the account. A payment is never funding or repayment by itself: only the contract's named final event establishes those, and a standalone participant transfer never advances a loan at all.

**The wrong trigger.** Lender silence, a missing Y, elapsed time, a token balance, an application assertion or the earlier repayment event cannot trigger S. Wrong, early, non-final, cross-loan or unverifiable evidence cannot authorize publication.

**The fallback fails.** The ECVS could be unavailable, could withhold S, lose it, have it compromised or disclose it too early, which could enable premature borrower recovery. An outage can be recovered by verifying again and replaying the same S, and an empty or unreachable source is not proof that S was deliberately withheld. Loss or compromise follows a defined incident path, but nothing can replace the secret committed in an existing escrow. In every such case the Base refund stays complete and valid, and the Bitcoin escrow can still be reached by its other pre-authorized routes, and, after early disclosure or compromise, by S.

> **The fallback is designed, not available**
> The ECVS model is selected, but production use requires counsel approval and implementation evidence first. Until then, no new loan may commit to S or advertise the fallback, and a loan without that commitment can never gain it later. For every loan, with or without the fallback, the lender's pre-signed Bitcoin route matures three days after D and can take the collateral even though the borrower repaid. Publishing S only gives the borrower a competing recovery transaction, which protects her only if it confirms first; the refund, its finality, the publication and the Bitcoin confirmation all have to fit in the roughly 24 hours between C and that maturity. The borrower's long-stop route matures ten days after D but does not cancel the lender's route; the first confirmed spend wins.

## Authority boundaries

- **The observer reports; it does not act.** It executes no contract call, builds or signs no Bitcoin transaction, holds no secret and cannot override a fact. Observing an event never implies an action, Bitcoin activation or recovery, or default.
- **The event history is the record.** The application keeps an append-only history of events and corrections, not a mutable snapshot of the loan read from the contract.
- **The ECVS controls only S.** It has no Bitcoin key, cannot sign, broadcast or choose a destination, holds no provider-wide master secret, and does not judge who deserves the collateral. The organization, the borrower and the lender never receive S before publication and cannot order an early release.
- **The Base refund never depends on the ECVS.** The refund is permissionless and stays available indefinitely, whether or not S is ever published.

## Choices and their reasons

- **Act only at layer-1 finality.** The agent first recommended acting at the faster "safe" stage; the user asked for full layer-1 finality as the safest, irreversible point, and the agent revised its recommendation. The recorded tradeoff is a delay of roughly 20 minutes per consequential step in exchange for one simple rule across funding, secret disclosure, repayment and refund. The roughly 20 minutes is Base's documented figure, not a guaranteed waiting time.
- **One primary and one fallback provider.** A single provider would leave the observer blind during its outage, while requiring two providers to agree on every action would add a permanent dependency and delay safe operations whenever the backup is down. A disagreement between two healthy providers is treated as an incident, never resolved by a local majority guess. Running an own Base node was judged not justified for version 1.
- **Event history with a versioned handoff.** Keeping the ordered event-and-correction history, instead of a mutable status or stored snapshots, makes restarts, provider changes, reorganizations and audits unambiguous. A versioned ingestion handoff, rather than letting the observer write application tables directly, makes one application transaction the durable record and makes repeated delivery safe.
- **An independent, contracted service holds S.** The user specified that the organization should not operate the service, because doing so would make it custodial, and that participants should not choose it; instead the organization contracts an independent service by agreement.
- **One recovery transaction for Y and S.** The user specified that the same borrower-signed transaction must work with either secret, so the fallback adds no second set of transactions to sign.

## Open, excluded and deferred

- **Production activation of the ECVS** remains open: it needs counsel approval and implementation evidence. The legal classification of the fallback is outside this technical design.
- **No automatic default broadcast or institutional recovery.** [Organization broadcast of default packages](../../system-model/contracts/scope/scope-001-automatic-lender-default-broadcast.md) and [institutional collateral recovery](../../system-model/contracts/scope/scope-002-institutional-last-resort-collateral-recovery.md) are deferred; they are not duties or implied powers of the ECVS.
- **The missing-Y risk** is a [recorded residual risk](../../system-model/contracts/invariants/inv-025-missing-y-residual-lender-risk.md). Valid repayment is not borrower default, and a refunded USDC balance is not complete Bitcoin settlement; the product must say so.

The [domain record](../../system-model/domains/base-observation-and-fallback-review/domain.md) lists exactly what the domain owns and excludes.
