# Base Observation And Fallback Review

This domain decides when something that happened on the Base network is safe to act on elsewhere, and it defines a narrow fallback that can help return a borrower's Bitcoin when a valid repayment was never claimed by the lender. Without it, a transient chain event, a stale screen or a missing lender response could be mistaken for a fact that moves collateral. The [architecture guide](../architecture.md) shows where it fits in the system.

## What this domain does

The loan's USDC (a dollar stablecoin) settles on Base, an Ethereum layer-2 network, while the collateral sits on Bitcoin. Bitcoin cannot inspect what happened on Base, and a transaction in a wallet, an updated application screen or a lender's silence cannot bridge the two. This domain supplies trustworthy observations of Base contract events and their finality, and it defines the conditions under which one independent service alone may disclose a fallback secret.

The concepts a reader needs:

- An **observation** records one named event from the approved loan contract, such as funding finalized, X accepted, repaid, Y released or unclaimed repayment refunded, together with its chain, contract deployment, loan, transaction and block.
- **Finality status.** An event first seen in a Base block is *observed*; once its batch is posted to Ethereum it is *safe*, which is progress information only; when its block reaches **Base L1 finality**, the stage at which it is irreversibly settled on Ethereum, it is *finalized*. An event displaced by a chain reorganization becomes *noncanonical*. Only finalized events can change the loan's lifecycle or trigger a Bitcoin action.
- The **cursor** is the observer's saved position in the chain, from which it can safely resume after a restart.
- The **evidence-conditioned validation service (ECVS)** is one contracted, independent service that holds a unique random secret **S** for each eligible loan and may publish it only after verifying one exact refund event.

## How its responsibilities work together

The domain has two distinct responsibilities:

- [Base observation, finality, and reconciliation](../../system-model/domains/base-observation-and-fallback-review/responsibilities/sr-006-base-observation-finality-and-reconciliation.md) follows the approved deployment, records its events and their finality, and repairs the application's view when evidence changes. It also reconciles the independent Bitcoin evidence on which lifecycle gates depend, and classifies the chain evidence for payments made from participants' Vault payment accounts.
- [Evidence-conditioned validation-service fallback](../../system-model/domains/base-observation-and-fallback-review/responsibilities/sr-007-evidence-conditioned-validation-service-fallback.md) defines how the ECVS commits to S before a loan is built, verifies the exact finalized refund event on its own, and publishes S durably and publicly.

Observation reports facts; the fallback governs one secret's disclosure. Neither decides who deserves the collateral, and neither signs a Bitcoin transaction. The domain receives events from the contracts of Base USDC Settlement And Funding and the deployment identity from Loan Terms And Commitments. It provides finalized Base facts to the workspace in Participant Access And Loan Operations, to the Bitcoin operations in Bitcoin Authorization And Recovery and to the fallback service, and agreed Bitcoin evidence to the Bitcoin operations, the Base settlement responsibility and the workspace. Each consumer acts only under its own authority.

## A normal case: turning an event into a fact

Suppose the lender has just finalized funding for a loan. This illustrative case shows how that event becomes a fact the rest of the system can use.

```figure
caption: How one Base event becomes a fact the system may act on.
step: Read and check | The observer reads the named event and checks chain, deployment, loan, transaction and block.
step: Wait for finality | The event is observed, then safe; it becomes a fact only at Base L1 finality.
step: Hand off | The observer sends the finalized fact to the application through a versioned handoff.
step: Acknowledge | The application stores the evidence and acknowledges it; only then does the cursor advance.
```

The application may show the event at once, clearly labelled as awaiting finality. When finality arrives, the application stores the source evidence and acknowledges it, and that stored evidence then drives the status a participant sees. If the acknowledgement is lost, the observer sends the same observation again, and its stable identity prevents a duplicate. Because the history is a sequence of events and corrections rather than one mutable snapshot, a restart, a provider switch or a reorganization leaves an unambiguous record of what happened; a correction that remains ambiguous stays contested and blocks the actions that depend on it.

Alchemy is the primary Base data provider and QuickNode is the fallback. One healthy provider is enough for a finalized fact; the second supplies failover and detects disagreement.

## When the borrower repays but the lender does not claim

This case explains why the fallback exists. Assume the exact repayment was finalized by the repayment deadline **D**. Normally the lender claims the USDC by revealing its secret Y before the claim cutoff **C**; once that claim reaches Base L1 finality, the public Y lets the Bitcoin operations complete a recovery transaction that the borrower signed in advance. If the lender cannot or does not reveal Y, the valid repayment alone does not release the Bitcoin.

At C, which is D plus 172,800 seconds (two days), the Base contract permanently disables the lender's claim and freezes the borrower's refund recipient. Anyone may then submit the fixed refund, and the caller cannot choose where the money goes; the refund never waits for the fallback service. Once the exact unclaimed-repayment refund event reaches Base L1 finality, the observer can report that the repayment was returned once. The Bitcoin collateral, however, is still in escrow.

```figure
caption: The conditional fallback. Publishing S is not a Bitcoin recovery; each step is a separate fact.
step: Commit | Before the loan is built, the ECVS creates S and returns only its hash for the escrow script.
step: Refund | At or after C, the exact unclaimed repayment is refunded to the frozen borrower recipient.
step: Verify and publish | The ECVS checks the finalized refund event itself, then publishes S durably and publicly.
step: Submit | The Bitcoin operations check S, add it to the pre-signed recovery and broadcast it; it is still pending.
```

The ECVS does not accept the application's conclusion. On its own it verifies the configured chain, contract deployment and current implementation, the event signature, the loan, the transaction and log, block canonicality and finality, the exact debt and the frozen recipient. Only then may it publish S. The Bitcoin operations separately check that the fallback is production-activated for the loan, the public source and its binding to the event, the hash match, the exact retained recovery package, its signature and fixed outputs, and that the escrow is still unspent. Only then do they insert S into the same borrower-signed transaction that Y would have completed, pick an existing fee level and broadcast it. No fresh borrower signature, second transaction family, service key or new destination is involved, and the recovery is final only when that spend confirms on Bitcoin.

## Exceptions and recovery

- **Providers fail or disagree.** If both Base providers are unavailable, or they disagree, existing finalized information stays visible while new consequential actions that depend on Base are blocked.
- **A reorganization.** When a chain reorganization displaces an observed event, the observer keeps it as noncanonical evidence, appends a correction and replays from the last common finalized block. Only the derived application view is corrected; source records are never overwritten.
- **Bitcoin sources disagree.** Bitcoin lifecycle gates require fresh agreement between two configured sources, unlike the one-healthy-provider rule on Base. A conflict, or both sources being unavailable, is retried every minute as one incident, escalates after five minutes or one missed Bitcoin block, and is critical at once after the borrower's acceptance. Dependent automation resumes only after fresh agreement and a replay from the last agreed state.
- **Payments from Vault accounts.** Exact evidence about the transaction, nonce, amount, recipient and the other bound fields classifies only that payment's own outcome, and it stays provisional until finality; only the named finalized contract event establishes loan funding or repayment. When a submission's outcome is ambiguous, probes run at 0, 15 and 60 seconds after that point, with a mandatory escalation decision at 180 seconds. The public profile needs two separately operated Base providers plus the observer; the local demonstration uses one local provider and makes no such claim. A confirmed transfer that is not for a loan never advances any loan.
- **An operator asks for a recheck.** An authorized operator may request a recheck through the application, but cannot call the observer directly, edit source records, move the cursor or override the resulting fact.
- **The fallback fails.** Wrong, early, non-final, cross-loan or unverifiable evidence cannot authorize publication. An outage can be recovered by verifying again and replaying the same S. If S is lost, compromised or withheld, the defined incident path applies, and there is no company release or replacement secret that can repair an existing escrow. The completed Base refund remains valid in every case.
- **No S, no Y.** Until a recovery spend confirms, other routes stay open: the lender's pre-signed timelock route becomes valid once Bitcoin's consensus clock is strictly later than three days after D, and the borrower's long-stop becomes valid by the same clock ten days after D, without cancelling the lender's route. Mutual cooperation is another, separately authorized route. The first confirmed spend wins. This is a residual risk for a borrower who repaid, not evidence of a default or a promise that the collateral returns.

## Authority boundaries

This domain reports what happened on Base and sets the conditions for disclosing S. It must not:

- execute contract calls, build, sign, relay or confirm Bitcoin transactions, or choose a destination;
- treat a missing Y, elapsed time, an application assertion, a raw token transfer or the earlier repaid event as the trigger for S;
- let an operator, the company or a participant override a fact, command publication or obtain S before publication;
- judge contested entitlement: the ECVS checks one exact event, it does not arbitrate evidence.

> **Observation is not action**
> A finalized fact is evidence that a contract transition happened. It does not by itself sign, broadcast or confirm anything on Bitcoin, and it does not establish a default.

## Choices and their reasons

- **Base L1 finality as the single gate.** One uniform, safety-first rule covers funding, secret disclosure, repayment and refund, accepting roughly 20 minutes of delay per consequential cross-chain handoff instead of letting a transient observation trigger an action. It is not a promise of an exact waiting time. The [finality selection](../../build/records/selections/sel-013-base-l1-finality-and-reorg-reconciliation.md) records the options considered.
- **An append-only history of events and corrections.** A mutable watcher status or stored loan snapshots would hide the sequence of transitions; an append-only history makes restart, provider failover, reorganization correction and audit unambiguous.
- **A primary and a fallback provider, one healthy source sufficient.** The observer continues through one provider's outage without making every action wait for a second provider, and a disagreement between two healthy sources stops new consequential actions instead of being resolved by guess.
- **One independent ECVS for the lender-silence fallback.** The service holds no Bitcoin key, destination control or discretionary role. Its secret can still be disclosed early, withheld, lost or compromised, which is why independent controls and the production gate remain material.

## Open, excluded and deferred

> **The fallback is selected, not available**
> Production use of the ECVS remains gated by counsel approval and implementation evidence. Until that gate passes, a new loan must not commit to S or advertise the fallback.

An existing escrow that relies only on Y can never acquire S later, whatever happens to the gate. For a reader now, this means no loan may rely on S until the gate passes: if the lender does not claim a valid repayment, only the Base refund, the timelocked Bitcoin routes and mutual cooperation apply. Automatic broadcast of the lender's default package by the organization and institutional recovery of collateral are deferred capabilities, not part of this version, and the ECVS gives the company no collateral key, sale authority or discretionary payout power.

The [domain record](../../system-model/domains/base-observation-and-fallback-review/domain.md) lists exactly what the domain owns and excludes.
