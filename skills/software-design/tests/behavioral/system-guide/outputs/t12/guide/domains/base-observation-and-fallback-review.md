# Base Observation And Fallback Review

This domain makes facts from Base safe to use elsewhere in the loan, and defines a narrowly limited fallback that may help return the Bitcoin collateral after a repaid but unclaimed loan has been refunded. Its job matters because the two chains cannot see each other: a wallet notification, an updated screen or a silent lender must never be mistaken for a settled Base fact. The [architecture guide](../architecture.md) shows where this domain fits in the whole system.

## What this domain does

The loan contract on Base settles the USDC, a dollar-denominated token; Bitcoin independently controls the collateral. Other parts of the system act on Base facts: the application shows the loan's status, and the Bitcoin side completes transactions with secrets that Base calls make public. This domain supplies those Base facts with their exact source and their degree of finality, and it keeps two jobs strictly apart: reporting what happened, and the conditional release of one backup secret.

A Base event passes through stages. When it first appears in a block it is **observed**, which is provisional. Base then reaches a **safe** stage, which is only progress information. An event counts for the loan only when its block reaches **Base L1 finality**, the settlement point on the underlying Ethereum network, the layer 1 (L1) beneath Base. If a reorganization removes an observed event before that, the event becomes **noncanonical** and is kept as evidence rather than deleted.

## How its responsibilities work together

**[Base observation, finality, and reconciliation](../../system-model/domains/base-observation-and-fallback-review/responsibilities/sr-006-base-observation-finality-and-reconciliation.md)** follows the approved deployment, reads the contract's named events for funding, acceptance, repayment, claim, recipient switch and refunds, and checks which chain, contract, loan, transaction and block produced each one. It records their finality, appends corrections when a reorganization displaces an event, and replays from the last finalized point. It also reconciles independent Bitcoin evidence and classifies observations of Vault payment transfers.

**[Evidence-conditioned validation-service fallback](../../system-model/domains/base-observation-and-fallback-review/responsibilities/sr-007-evidence-conditioned-validation-service-fallback.md)** defines one contracted independent service, the evidence-conditioned validation service. For each eligible loan it holds a secret S and may publish it only after independently verifying one exact finalized refund event.

Observation reports facts; the fallback controls one secret's disclosure. Neither decides who deserves the collateral or signs a Bitcoin transaction. The domain receives the deployment identity and committed terms from the terms domain and named events from the Base contract. It provides finality-qualified facts and corrections to the operations domain, finalized public X and Y to the Bitcoin domain, a public event reference that the fallback service may use as a starting point, and, when published, S to the Bitcoin domain.

## A normal case: establishing a usable fact

Suppose the borrower repays. The repayment event appears in a Base block and the observer records it as observed. The observer sends it to the application through a versioned ingestion handoff. The application stores the source evidence and derives the status the participants see, labelled as awaiting finality. The observer advances its saved resume position, its cursor, only after the application acknowledges storage. If that acknowledgement is lost, the observer sends the same event again, and its stable identity prevents a duplicate.

Later, roughly twenty minutes as Base documents it, though this is not a promised waiting time, the block reaches Base L1 finality. Only now does the repayment become usable: the application can advance the loan, and a later finalized claim event can let the Bitcoin domain act on the public Y.

The observer reads from Alchemy as the primary Base provider and QuickNode as the fallback. One healthy provider is enough to establish a finalized fact; the second gives failover and disagreement detection.

## Exceptions and recovery

**Providers fail or disagree.** If both Base providers are unavailable or disagree, finalized status already shown stays visible, and new consequential actions that depend on Base are blocked until the problem clears.

**A reorganization.** When a reorganization displaces an observed event, the observer keeps it as noncanonical evidence, appends a correction and replays canonical history from the last common finalized block. Only the derived status changes; the recorded source history is never edited. An operator may request a recheck through the application, but cannot change a fact, override the result or move the observer's cursor.

**Bitcoin evidence.** Bitcoin lifecycle gates are stricter than the one-healthy-provider rule for Base: they need fresh agreement between the configured Bitcoin observers. A conflict or outage blocks the automation that depends on it, repeated reports update one incident, which escalates after five minutes or one missed block, and a failure after the borrower's acceptance is treated as critical at once. Recovery replays from the last agreed state.

**Payment transfers.** For a payment from a participant's Vault payment account, the exact transaction and nonce evidence can update that payment's own record, but only the named finalized contract event can establish loan funding or repayment. Even a confirmed standalone transfer to a recipient the participant chose does not advance the loan.

### When the borrower repays but the lender does not claim

Normally the lender claims the repayment by revealing its secret Y before the claim cutoff, and public Y lets the Bitcoin domain complete the recovery transaction the borrower signed earlier for a fixed destination. If the lender cannot or does not reveal Y, valid repayment alone does not release the Bitcoin.

At the claim cutoff, C, which is the repayment deadline D plus 172,800 seconds, two days, Base permanently disables the lender's claim and freezes the borrower's refund recipient. Anyone may then call the fixed refund; the caller cannot choose where the money goes. Once the exact "unclaimed repayment refunded" event reaches Base L1 finality, the observer can report that the exact repayment was returned once. The refund never waits for the fallback service, and the Bitcoin escrow stays unspent.

The fallback works as follows for an eligible loan:

```figure
caption: The service only verifies and publishes; the Bitcoin domain decides whether the fixed transaction can be completed, and only confirmation finishes it.
step: Commit | Before the loan's escrow is built, the service creates a random secret S for this loan and returns only its hash.
step: Bind | The borrower's recovery transaction is built to accept either Y or S, and the borrower signs it once.
step: Verify | After the finalized refund, the service independently checks the chain, deployment, loan, event, amount, frozen recipient and finality.
step: Publish | The service publishes S durably and publicly, with evidence binding it to this loan and event.
step: Complete | The Bitcoin domain checks the publication and hash, inserts S into the same signed transaction and broadcasts it.
step: Confirm | The borrower's recovery is final only when that transaction confirms on Bitcoin.
```

The service does not accept the application observer's conclusion as authority, and no new borrower signature, second transaction family, service signing key or new destination is involved. The organization, the borrower and the lender do not receive S before publication and cannot command an early release; the service itself holds S, which is why its early disclosure remains a risk.

**When the fallback fails.** Wrong, early, unfinalized, cross-loan or unverifiable evidence cannot authorize publication. An outage can be recovered by independent verification and public replay of the same committed S. If S is lost, compromised or withheld, there is no discretionary company release and no replacement secret for the existing escrow. Early disclosure is itself dangerous, because it could enable premature borrower recovery. An empty or unreachable publication source does not prove that the service deliberately withheld S. In every one of these cases the Base refund remains complete, and Bitcoin recovery through S is simply unavailable.

**What remains without Y or S.** Missing Y, elapsed time, an application assertion, a raw token transfer or the earlier repayment event can never trigger publication of S. Without Y or S, the lender's pre-signed Bitcoin recovery can mature three days after D under Bitcoin's own time rules, and the borrower's long-stop matures ten days after D without any secret but does not cancel the lender's route; the first confirmed spend wins. Mutual cooperation is a further, separately authorized route. These are recorded residual risks, not evidence that the borrower defaulted after repaying and not a guarantee that the collateral returns.

## Authority boundaries

The domain decides which Base facts are canonical and final, and, for an eligible loan, whether the exact refund event conforms so that S may be published. It must not decide or imply:

- any Base transaction, Bitcoin signature, broadcast or destination;
- who is entitled to the collateral in a dispute;
- an edit to the application's status or to a recorded fact;
- that an observation is an action, that a claim is available beyond what the event shows, that Bitcoin was activated or recovered, or that a borrower defaulted;
- that a missing Y satisfies the fallback's trigger.

The fallback service holds no Bitcoin key, chooses no destination and has no discretionary evidence-arbitration role. Monitoring, package storage and the service give the organization no collateral key, sale authority or discretionary payout power.

## Choices and their reasons

- **Base L1 finality as the single consequential boundary.** Waiting for L1 finality delays each consequential handoff by roughly twenty minutes, but keeps one simple rule for funding, secret disclosure, repayment and refund, instead of risking a cross-chain action on a transient observation. The [finality selection](../../build/records/selections/sel-013-base-l1-finality-and-reorg-reconciliation.md) records this trade-off.
- **An append-only event history.** A watcher-owned mutable status or stored contract snapshots would hide the sequence of transitions and duplicate facts already recoverable from events. An append-only history of events and corrections costs some storage and replay work but makes restart, provider failover, reorganization and audit unambiguous. A versioned ingestion boundary, rather than letting the observer write application tables, makes one stored record the durable result and lets replay safely deliver the same event twice. The [event handoff selection](../../build/records/selections/sel-015-base-event-observation-handoff.md) records the choice.
- **An independent, narrow fallback.** The selected service has no Bitcoin key and no discretionary role, but its secret can still be disclosed too early, withheld, lost or compromised; those risks are why the independent controls and the activation gate remain material. The [independent release-secret constraint](../../build/records/constraints/cons-020-independent-ecvs-release-secret-authority.md) records the rule.

## Open, excluded and deferred

**The fallback is selected but not available.** Production use is gated by counsel approval and implementation evidence. Until that gate is met, no new loan may commit to S or advertise this fallback, and an existing loan built with Y only can never gain it later. A resolved technical ticket does not satisfy the gate. The [fallback publication interface](../../system-model/contracts/interfaces/iface-017-conditional-ecvs-publication.md) holds the exact script, trigger and lookup contract.

**Excluded.** [Automatic organization broadcast of lender recovery packages](../../system-model/contracts/scope/scope-001-automatic-lender-default-broadcast.md) and [institutional collateral recovery](../../system-model/contracts/scope/scope-002-institutional-last-resort-collateral-recovery.md) remain outside this version, and are not duties or implied powers of the fallback service. Legal classification of the service is outside the technical design.

The [domain record](../../system-model/domains/base-observation-and-fallback-review/domain.md) lists exactly what the domain owns and excludes, and the [conditional recovery flow](../../system-model/behavior/flows/flow-006-conditional-ecvs-borrower-recovery.md) and the [residual missing-Y risk](../../system-model/contracts/invariants/inv-025-missing-y-residual-lender-risk.md) hold the exact conditions.
