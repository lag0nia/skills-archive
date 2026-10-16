# Base Observation And Fallback Review

This domain makes evidence from the Base blockchain safe to use elsewhere in a Bitcoin-backed USD Coin (USDC) loan, and defines a narrowly limited fallback that may help return Bitcoin after an unclaimed repayment has been refunded. The [architecture guide](../architecture.md) shows how it sits between Base settlement, Bitcoin operations and the product.

## What this domain does

The Base contracts settle USDC; Bitcoin independently controls the collateral. A transaction appearing in a wallet, an updated screen or a lender who does not respond cannot bridge those two authorities. This domain supplies trustworthy observations of what happened on Base, and controls when an optional secret may be published so that an already-signed Bitcoin recovery can proceed.

Its two responsibilities are deliberately different. [Base observation, finality, and reconciliation](../../system-model/domains/base-observation-and-fallback-review/responsibilities/sr-006-base-observation-finality-and-reconciliation.md) follows the approved contract deployment, records its events and how final they are, and repairs the application's view when evidence changes. [Evidence-conditioned validation-service fallback](../../system-model/domains/base-observation-and-fallback-review/responsibilities/sr-007-evidence-conditioned-validation-service-fallback.md) defines how an independent service may publish a loan's precommitted secret after verifying one exact refund event. Observation reports facts; the fallback controls one secret's disclosure. Neither decides who deserves the collateral, and neither signs a Bitcoin transaction.

## Establishing a fact the rest of the system can use

The observer reads the contract's named events for funding, acceptance, repayment, claim and refund. For each event it checks which chain, contract deployment, loan, transaction and block produced it. An event first seen in a Base block is only **observed**. The intermediate **safe** status is progress information only. Application lifecycle steps and Bitcoin hand-offs wait until the block reaches **Base L1 finality**: the stage that Base documents as reached once the batch containing the block, posted to Ethereum (the layer-one chain), is older than two Ethereum epochs. A reorganized event is kept as **noncanonical** evidence rather than deleted.

The observer passes events to the application through a versioned ingestion hand-off. The application records the source evidence and derives the status a participant sees. It acknowledges storage before the observer advances its durable **cursor**, the saved position from which it can safely resume. If an acknowledgement is lost, the observer sends the same event again, and its stable identity prevents a duplicate.

Alchemy is the primary Base data provider and QuickNode the fallback. Under the provider selection, one healthy provider is enough to report a finalized Base fact when it independently satisfies the finality rule; the second provides failover and detects disagreement. The provider security record says that no one source may become authoritative chain state, and how that fits the one-provider rule is not stated, so this point is open. If both are unavailable, or they disagree, existing final status stays visible while new consequential actions that depend on Base are blocked. When a chain reorganization displaces an observed event, the observer keeps it as noncanonical, appends a correction and replays from the last common finalized block. An authorized operator may request a recheck through the application, never by calling the observer directly, and cannot change the fact, override the result or move the observer's cursor.

The same responsibility also reconciles Bitcoin evidence from independent observers, under a stricter rule than Base: Bitcoin lifecycle gates require fresh agreement between the configured observers. Conflicts and outages block dependent automation; repeated reports update one incident; recovery replays from the last agreed state; and a failure after the borrower has accepted the loan is treated as immediately critical.

Payments from a participant's Vault payment account have another limited meaning. Exact transaction and nonce evidence can update that payment's own record, but only the named, finalized contract event establishes loan funding or repayment. A confirmed transfer that a participant makes for their own purposes never advances the loan.

## When the borrower repays but the lender does not claim

This case explains why the fallback exists. Assume exact repayment has been finalized by the repayment deadline **D**. Normally the lender claims the USDC by revealing the secret **Y** before the claim cutoff. Public Y then lets Bitcoin operations complete a recovery transaction that the borrower signed in advance for a fixed destination. If the lender cannot or does not reveal Y, valid repayment alone does not release the Bitcoin.

At **C**, two days (172,800 seconds) after D, Base permanently disables the lender's claim and freezes the borrower's current refund address. Anyone may then call the fixed refund; the caller cannot choose where the money goes. A borrower worried about access to the original address may have switched it once to the borrower's committed protocol address before C. When the exact **UnclaimedRepaymentRefunded** event reaches Base L1 finality, the observer can report that the repayment was returned exactly once. Claim and refund are mutually exclusive on Base. The refund never waits for the fallback service, and the Bitcoin collateral remains separately unspent.

The selected fallback is an **evidence-conditioned validation service (ECVS)**: one contracted, independent service that generates a unique random secret **S** for each eligible loan. Before that loan's Bitcoin transactions are built and signed, it returns only **H(S)**, a hash commitment later used to check the disclosed secret, and the recovery script contains that commitment. The organization, borrower and lender never receive unrevealed S and cannot command an early release.

The ECVS does not accept the application observer's conclusion as authority. It independently checks the configured Base deployment, the loan, the exact refund event, the amount, the frozen recipient, provenance and L1 finality. Only then may it publish the matching S durably and publicly. Bitcoin finalization separately checks the publication, the commitment, the existing signatures and that the escrow is still unspent, then uses S in the **same borrower-signed recovery transaction** that Y would have completed. No fresh borrower signature, second transaction family, service signing key or new destination is introduced. Publication, broadcast and confirmed Bitcoin recovery are three separate steps.

```figure
caption: The refund is complete on its own; S only lets an already-signed Bitcoin transaction proceed.
step: Repaid by D | Exact debt is finalized on Base.
step: No claim before C | The lender's claim is disabled and the refund address freezes.
step: Refund | Anyone triggers the fixed refund; its event reaches L1 finality.
optional: Publish S | Only for a loan created with the activated capability: the ECVS verifies the event itself and publishes S.
optional: Recover | Bitcoin operations complete the borrower's signed recovery; it is final only when confirmed.
```

## Limits and the remaining recovery paths

This model is selected, but its production use is gated by counsel approval and implementation evidence. Until that gate is satisfied, a new loan must not commit H(S) or present the fallback as available. An existing escrow built with Y only cannot acquire the capability later, and a lost or compromised S cannot be rotated into an existing commitment. Choosing an independent service avoids giving it a Bitcoin key or a discretionary role in judging evidence, but its secret can still be disclosed too early, which could allow a premature borrower recovery, or be withheld, lost or compromised. Loss, compromise and withholding have a defined incident path, early disclosure has its own boundary, and there is no discretionary company release or replacement secret.

Missing Y, elapsed time, an application assertion, a raw token transfer or the earlier repayment event cannot trigger publication of S. If the evidence is wrong, S is not published and recovery through S is unavailable. If the service is interrupted, publication can still be recovered later through independent verification and public replay of the same committed S. In either case the Base refund remains complete. The lender's pre-signed Bitcoin route still matures three days after D under Bitcoin's consensus time rules. A separate borrower long-stop route matures ten days after D without Y or S, but does not cancel the lender's route; whichever confirms first wins. Mutual cooperation is another separately authorized route. Even for a loan with S, these routes can still win until an S recovery confirms. These are residual Bitcoin risks, not evidence of borrower default after valid repayment, and not a guarantee that the collateral returns.

The long-stop's place in this case is not stated consistently. The long-stop timing rule says every newly constructed escrow includes it, and this domain's fallback responsibility, the Bitcoin escrow state and the security record on a lender default after valid repayment include it among the competing outcomes. The [missing-Y residual risk](../../system-model/contracts/invariants/inv-025-missing-y-residual-lender-risk.md), the [unclaimed repayment flow](../../system-model/behavior/flows/flow-005-valid-repayment-without-lender-claim.md), the [conditional recovery flow](../../system-model/behavior/flows/flow-006-conditional-ecvs-borrower-recovery.md), the lender default flow and the security record on missing Y list the remaining Bitcoin outcomes without it, and that security record goes further, saying a loan without the fallback secret has no borrower fallback Bitcoin route. Whether those records are simply incomplete is an open question.

## Authority boundaries

The observation responsibility decides how final an observed Base event is, reconciles independent Bitcoin evidence, and classifies evidence for payment intents. It does not execute contracts, build or sign Bitcoin transactions, hold secrets, submit application commands or override facts, and a raw token transfer or balance never establishes a loan event. The ECVS decides only whether the exact refund event conforms and, if so, publishes its committed S. It does not execute the Base refund, choose destinations, broadcast Bitcoin, automate lender default, or treat the application's status as a fact. Monitoring, stored transactions and the ECVS give the organization no collateral key, sale authority or discretionary payout power.

## Choices and their reasons

- **Finality before consequences.** Waiting for Base L1 finality accepts additional waiting, roughly 20 minutes according to Base's documentation, in return for one consistent rule at every consequential cross-chain boundary. It is not a promise of an exact waiting time.
- **Event history rather than snapshots.** Keeping an append-only event history, delivered through an acknowledged hand-off, means a restart, provider change or reorganization can be reconstructed, instead of trusting a mutable loan snapshot or a watcher status that someone could edit.
- **Two providers, one sufficient.** The observer keeps working through one provider's outage without making two-provider agreement a prerequisite for every action, while a disagreement still stops new consequential actions. How this fits the security rule that no one source may become authoritative is open, as described above.
- **An independent service with a precommitted secret.** The fallback design avoids giving the service a Bitcoin key or a role in judging disputed evidence.

The domain record links the records that hold each choice's attribution.

## Open, excluded and deferred

Production use of the fallback is not activated, as described above. [Automatic organization broadcast of lender-default transactions](../../system-model/contracts/scope/scope-001-automatic-lender-default-broadcast.md) and [institutional collateral recovery](../../system-model/contracts/scope/scope-002-institutional-last-resort-collateral-recovery.md) are outside this version. The open question about the long-stop is described under limits and the remaining recovery paths, and the open question about one provider being enough under establishing a fact.

The [domain record](../../system-model/domains/base-observation-and-fallback-review/domain.md) lists exactly what the domain owns and excludes.
