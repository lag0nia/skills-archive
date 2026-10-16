# Base Observation And Fallback Review

This domain decides when something that happened on Base may be relied on by the rest of the loan system, and it defines one narrow fallback that can help return a borrower's Bitcoin after a valid repayment was refunded because the lender never claimed it. The [architecture guide](../architecture.md) shows where it fits among the other domains.

## Why the system needs this domain

A loan in this system lives on two blockchains with separate authorities. The loan contracts on **Base**, an Ethereum layer-2 network, hold and move the USD Coin (USDC); Bitcoin consensus alone controls the collateral. Neither chain can see the other. Something has to carry facts across that gap, and the carrier must not become a new authority: a transaction that appears in a wallet, a status on an application screen or a lender who stops responding cannot be allowed to move collateral or money by itself.

This domain supplies that carrier in two deliberately separate parts:

- **Base observation, finality, and reconciliation** reads the approved Base contracts, records exactly which event happened where, decides how final it is, and repairs the application's view when the evidence changes. It reports facts; it never creates them. Its [responsibility record](../../system-model/domains/base-observation-and-fallback-review/responsibilities/sr-006-base-observation-finality-and-reconciliation.md) holds the precise rules.
- **Evidence-conditioned validation-service fallback** describes an independent service that holds one secret per loan and may publish it only after verifying, on its own, one exact refund event on Base. It controls the disclosure of that secret and nothing else. Its [responsibility record](../../system-model/domains/base-observation-and-fallback-review/responsibilities/sr-007-evidence-conditioned-validation-service-fallback.md) holds the precise rules.

Neither part decides who deserves the collateral, signs a Bitcoin transaction or chooses where money or Bitcoin goes. Those powers stay with the participants, the Base contracts and Bitcoin consensus.

A few terms recur below. A **reorganization** (reorg) happens when a chain replaces recent blocks, so an event that was seen can disappear or move. **Finality** is the point after which that can no longer happen under normal assumptions. The **cursor** is the saved position from which the observer can safely resume reading. The secrets are single values whose hash is fixed in advance: the lender's **Y** completes the normal close of a repaid loan, and the fallback secret **S** is an alternative to Y for loans built with the fallback. **H(S)** is the hash commitment that lets anyone check a disclosed S.

## How does a Base event become a fact the system can act on?

### What the observer reads and checks

The observer follows the named events that the loan contract emits for each successful step: funding-window opening and funding finalization, the borrower's acceptance (which discloses the borrower's secret X), repayment, the lender's claim (which discloses Y), the borrower's one-time refund-recipient switch, the refund of an unclaimed repayment, expiries and the related refunds and sweeps. Each observation is identified by its chain, contract, block, transaction and position in the block, and is checked against the approved deployment of the contracts, including the code actually running there. An event from the wrong chain, contract, implementation or loan is rejected rather than recorded.

Only these action events count as history. A snapshot of the loan read from the contract can help diagnose a problem, but it never becomes a recorded fact, and a raw token transfer or balance is never read as funding or repayment.

### How final is final?

A new event moves through up to four statuses, and only one of them may change anything outside the observer:

- **Observed:** seen in a Base block. Display only, labeled as awaiting finality.
- **Safe:** the block has been batched to Ethereum, Base's layer 1. Display only.
- **Finalized:** the block has reached finality on layer 1. Only this status may drive application lifecycle changes and handoffs to Bitcoin.
- **Noncanonical:** a reorg replaced the block before finality. Kept as audit evidence only.

The rule at that boundary is **Base layer-1 finality**: no application-side lifecycle step, Bitcoin action or economic completion follows from an observed or safe event. Base documents finality as taking roughly 20 minutes, so each consequential handoff waits about that long; the figure is the provider's description, not a guaranteed time. A person can still call a public contract function directly at any time; the product simply shows the result as provisional until finality. The [finality and reorg decision](../../build/records/selections/sel-013-base-l1-finality-and-reorg-reconciliation.md) records the rule and its trade-off.

### Handing the fact to the application

The observer never writes the application's tables. It sends each observation through one versioned, authenticated [ingestion handoff](../../system-model/contracts/interfaces/iface-012-base-event-observation-and-correction.md), and the application derives the status a participant sees from the recorded evidence.

```figure
caption: The observer advances only after the application has durably stored what it reported, so a crash can repeat work but never skip it.
step: Read | A provider reports a contract event; a push notification is only a prompt to read it properly.
step: Verify | Chain, contract, implementation, loan and block identity match the approved deployment.
step: Classify | The event is observed, safe or finalized.
step: Store | The application atomically records it and answers stored or already recorded.
step: Advance | The cursor moves past a finalized block only after every event in it is stored.
step: Derive | The application recomputes the loan's current status from the recorded history.
```

If an acknowledgement is lost, the observer sends exactly the same observation again; its fixed identity makes the repeat harmless. After a restart, a provider switch or a reconnection, the observer rereads every block newer than its cursor, because those blocks could still be replaced. This append-only event history was chosen so that restarts, provider changes, reorgs and audits can always be reconstructed, which a mutable status or stored snapshot would hide; the [observation handoff decision](../../build/records/selections/sel-015-base-event-observation-handoff.md) records that reasoning.

## What happens when providers fail or history changes?

The observer reads Base through two independently operated services: Alchemy as the primary source and QuickNode as the fallback. One healthy source is enough to report a finalized fact, provided it independently satisfies the finality rule; the second source exists for failover and for detecting disagreement, not as a second signature on every action. When the primary errors or rate-limits, the observer retries with increasing delays of at most one minute and promotes the healthy fallback automatically, recording which source supplied each observation. While both are healthy it periodically compares their view of the chain and of finalized blocks and events.

- **The sources disagree.** Existing finalized statuses stay visible, new Base-dependent actions with consequences stop, and the operations team is alerted until replay of canonical history resolves the conflict. No one may settle it by majority guess or manual override.
- **Both sources are unavailable.** The same holds: finalized statuses remain, fresh Base data is shown as delayed, the operations team is alerted after five minutes, and nothing new that depends on Base proceeds. When a source returns, the observer first replays every missed event from its cursor and only then resumes.
- **A reorg displaces an observed event.** The original observation is kept and marked noncanonical, a correction is appended, the derived status is rewound to the last finalized block both histories share, and canonical history is replayed forward. Nothing is deleted, and no compensating chain event is invented.

An outage is never itself a chain or lifecycle fact. A workforce operator with the [required authorization](../../build/records/constraints/cons-019-workforce-operator-authorization-and-audit.md) may ask the application to recheck a loan, but cannot call the observer directly, edit recorded observations, move its cursor or override the resulting fact. The observer's lag and provider health feed the application's general health signal without exposing those dependency details publicly; an alert is operational evidence, not a chain fact. The [observation state record](../../system-model/contracts/states/state-014-base-event-observation-and-projection.md) and the [provider failover decision](../../build/records/selections/sel-014-base-observation-provider-failover.md) hold the exact transitions and retry policy.

## Does the same discipline apply to Bitcoin evidence and payment transfers?

Yes, with stricter or narrower rules where the consequences differ.

**Bitcoin evidence.** The same responsibility reconciles independently sourced Bitcoin observations for the Bitcoin operations: two independent providers on each public network, and two separately connected Bitcoin nodes in the local demonstration. Unlike the one-healthy-source rule for Base, a Bitcoin lifecycle gate requires fresh agreement between the configured observers. Commands and events trigger immediate reads, and a one-minute poll recovers and monitors only the transactions and outputs that still matter. A conflict or outage blocks dependent automation and is retried every minute as one durable incident rather than a stream of duplicates; it escalates after five minutes or one missed Bitcoin block, and becomes critical at once if it occurs after the borrower has accepted the loan by disclosing X. Automation resumes only after fresh agreement and a replay from the last agreed state. The [Bitcoin observation evidence contract](../../system-model/contracts/interfaces/iface-006-bitcoin-observation-evidence.md) defines that evidence.

**Payments from a participant's Vault.** A participant can pay funding or repayment from a payment account held in their own Vault. The observer can record the exact transaction and account sequence number (nonce) for such a payment, and that evidence updates only the payment's own record. Only the named finalized contract event can establish loan funding or repayment; a balance, a transfer event, a transaction hash or a successful submission cannot. An unresolved payment is probed at 0, 15 and 60 seconds and must escalate at 180 seconds. In public profiles that check uses two separately operated Base providers plus the observer; the local demonstration deliberately uses one local test chain and claims no provider agreement. A confirmed standalone transfer from a participant to a recipient of their choosing updates only that transfer's record and never advances the loan. The [payment account and intent state](../../system-model/contracts/states/state-021-vault-owned-base-payment-account-and-intent.md) keeps the exact matching rules and the handling of reorgs and nonce conflicts.

## When the borrower repays but the lender never claims

The fallback exists for one specific situation. The following case is illustrative.

A borrower repays the exact debt into the loan's repayment vault before the repayment deadline, **D**, and the repayment is finalized. Normally the lender now claims the USDC through the contract by revealing Y. Once Y is public and final, the Bitcoin operations insert it into a recovery transaction the borrower signed in advance, when the escrow was established, which returns the collateral to the borrower's fixed destination. But suppose the lender has lost their Vault password, refuses or simply disappears. Without Y, the valid repayment alone does not release the Bitcoin.

```figure
caption: The Base refund settles the USDC on its own; returning the Bitcoin needs a separate, conditional step.
step: Repayment final | The exact debt is finalized on Base no later than the deadline D.
optional: Recipient switch | Only before the claim cutoff, and only if the borrower worries about reaching the original refund recipient: the borrower may switch it once to their own committed protocol account.
step: Claim cutoff | At C, two days after D, the lender's claim is disabled forever and the refund recipient is frozen.
step: Refund | Anyone may call the fixed refund; the exact repayment returns once to the frozen recipient.
step: Refund final | The observer records the finalized unclaimed-repayment refund event.
optional: Fallback | Only for a loan built with the activated fallback: the service verifies that event itself and publishes S.
```

The cutoff **C** is exactly D plus 172,800 seconds. From then on the contract allows only the refund, so the lender and the borrower can never both receive the repayment. Calling the refund needs no special permission and gives the caller no choice over amount or recipient; it never waits for the fallback service, and it stays available indefinitely. When its **UnclaimedRepaymentRefunded** event reaches finality, the observer reports that the exact repayment was returned once. The [unclaimed-repayment flow](../../system-model/behavior/flows/flow-005-valid-repayment-without-lender-claim.md) and the [claim and refund exclusivity rule](../../system-model/contracts/invariants/inv-007-claim-refund-exclusivity-and-fallback-trigger.md) own these conditions. At this point the borrower has their USDC back, but the Bitcoin collateral is still sitting unspent in its escrow.

## How can the fallback secret return the collateral?

### A secret fixed before the loan exists

The selected fallback is an **evidence-conditioned validation service** (ECVS): one independent service under contract with the company. For each eligible loan it generates a cryptographically random, unique 32-byte secret S, keeps it protected and returns only its hash, H(S). There is no service-wide master secret. H(S) must be committed before the escrow is constructed and before the borrower signs anything, because the Bitcoin recovery script itself contains it. Neither the company nor either participant receives S before publication, and no one can order an early release.

The script lets either Y or S complete the **same** borrower-signed recovery transaction. The borrower signs each fixed fee variant of that transaction once, in advance; the signature does not cover which secret is later supplied, so swapping Y for S changes neither the transaction, its destination nor the signatures. There is no second fallback transaction, no new borrower signature after publication and no service key in the script. The [publication contract](../../system-model/contracts/interfaces/iface-017-conditional-ecvs-publication.md) owns the exact script and witness forms. One consequence follows directly: an existing escrow committed only to Y cannot gain the fallback later, and a lost or compromised S cannot be swapped into an existing escrow.

### The only event that counts

The ECVS publishes only after it has independently verified the loan's canonical, finalized UnclaimedRepaymentRefunded event. It checks the configured chain, contract deployment and current implementation, event signature, loan, block, transaction and log, that the block is canonical and final, the exact debt, and the frozen recipient. It does not take the application observer's word for any of this: the observer may supply a public reference to the event, but not the conclusion.

Nothing else is a substitute. The earlier repayment event is not enough because the lender could still have claimed; a missing Y, the passage of time, a token balance or transfer, an operator's assertion or an application status cannot trigger publication either.

### Publication is not recovery

After successful verification, the ECVS publishes S durably and publicly, with evidence binding it to this loan and this event. Anyone can authenticate it by checking that its hash equals the committed H(S). A consumer that looks for the publication, or replays the lookup after an interruption, gets one of four answers: no publication yet, a valid publication, an invalid or mismatched one, or an unavailable source. An empty or unreachable answer is not proof that the service withheld S. The product receives only the public metadata and whether the commitment matches; an authorized Bitcoin finalizer or independent verifier may fetch the already-public secret itself.

Returning the Bitcoin then belongs to the [Bitcoin Authorization And Recovery](./bitcoin-authorization-and-recovery.md) domain. Its finalizer checks that the fallback was activated for this loan, validates the publication, its event binding and hash, the retained recovery transaction, the borrower's signature, the fixed outputs and that the escrow is still unspent. It then inserts S, picks one of the already-signed fee variants and submits the transaction. The [fixed recovery handoff](../../system-model/contracts/interfaces/iface-020-finalized-public-secret-to-fixed-bitcoin-action.md) allows no new signature and no new destination. Recovery is final only when independent Bitcoin observation confirms the spend.

> **Three separate facts**
> A published S, a broadcast recovery transaction and a confirmed Bitcoin recovery are different events. The service's publication is neither a submission receipt nor a confirmation, and the [conditional recovery flow](../../system-model/behavior/flows/flow-006-conditional-ecvs-borrower-recovery.md) treats only the confirmed spend as the outcome.

## What if the fallback fails, and what else can happen to the collateral?

Wrong, early, non-final, cross-loan or unverifiable evidence cannot authorize publication. An outage or interruption is recovered by verifying again and replaying the public publication, always with the same committed S. Loss, compromise or deliberate withholding of S follows a defined incident path: there is no discretionary company release and no replacement secret that could repair an existing escrow. Early disclosure is itself dangerous, because it would let the borrower recover the collateral prematurely.

In every one of these cases the Base refund stays complete. The unspent escrow can still be reached through other routes that the participants authorized in advance, and Bitcoin consensus time and the first confirmed spend decide among them:

| Route | Who can use it | Earliest time | Needs a secret? |
| --- | --- | --- | --- |
| Normal recovery with Y, or with S where activated | The borrower's pre-signed transaction | When Y is final on Base, or S is validly published | Yes, Y or S |
| Lender's timelocked route | The lender's pre-signed transaction, exported and broadcast by the lender | Strictly after D plus 259,200 seconds (three days) | No |
| Borrower long-stop | The borrower's pre-signed transaction | Strictly after D plus 864,000 seconds (ten days) | No |
| Cooperative settlement | Both participants, with fresh signatures | Any time before another spend confirms | No |

The two timelocks are measured by Bitcoin's consensus clock, the median time past (MTP) of recent blocks, not by wall-clock time. The borrower long-stop does not cancel the lender's route, which by then is already valid; whichever confirms first wins. Cooperative settlement is fixed as a Bitcoin mechanism, but its signing session and Base-side accounting are not yet an operational product capability. This is the **residual risk** the design keeps visible: after a valid repayment has been refunded, unless the collateral first returns to the borrower through a valid S, the long-stop or a cooperative settlement, the lender's pre-signed route can take it even though the borrower repaid. While the fallback is not yet activated no S exists, so from three days after D the lender's route can be used for a week before the borrower's long-stop matures. That is not evidence of borrower default, and a refunded USDC balance is not a completed Bitcoin settlement. The [missing-Y residual risk rule](../../system-model/contracts/invariants/inv-025-missing-y-residual-lender-risk.md) owns this boundary, and the [lender's timelocked flow](../../system-model/behavior/flows/flow-007-timelocked-lender-spend.md), [borrower long-stop flow](../../system-model/behavior/flows/flow-010-borrower-long-stop-recovery.md) and [cooperative settlement flow](../../system-model/behavior/flows/flow-009-cooperative-settlement.md) describe the other routes.

## What this domain may and may not decide

The observer decides only the provenance and finality classification of Base observations, and the corrections that follow from canonical replay. The ECVS decides only whether one exact event conforms and, if so, publishes the committed secret.

Neither may:

- execute Base transactions or block the permissionless refund;
- construct, sign, broadcast or confirm Bitcoin transactions, or choose a destination;
- weigh disputed evidence or decide economic entitlement;
- edit application status or let an operator override a fact;
- let an observation imply an action, a claim right beyond the event itself, a Bitcoin activation or recovery, or a default;
- treat a missing Y as the fallback trigger;
- present the fallback as available before its production-activation gate is met.

Monitoring, package storage and the ECVS give the company no collateral key, no authority to sell collateral and no discretionary payout power.

## Why it was designed this way

The records say who settled each of these choices. Here the **approver** is the person who reviewed and approved the design, and the **design agent** is the AI agent that drafted it.

- **Wait for layer-1 finality.** The design agent first proposed acting at the earlier batched stage, about two minutes in; the approver asked for the safest, irreversible point instead. The recorded trade-off is roughly 20 minutes of delay at each consequential handoff in exchange for one simple rule across funding, secret disclosure, repayment and refund.
- **One healthy provider is enough.** The design agent first proposed requiring both providers to agree; the approver questioned whether always checking both would add bugs, and approved the revised recommendation. Requiring agreement on every action would add a permanent second dependency and delay safe operations whenever the backup is down, while a disagreement between two healthy sources still stops new actions.
- **Event history rather than snapshots.** An append-only record of action events with corrections makes restarts, provider changes, reorgs and audits unambiguous, at some cost in storage and replay work. The approver accepted this recommendation.
- **The refund event as the only trigger.** The approver accepted the recommendation that only the finalized refund after the cutoff proves both valid repayment and lender silence; the repayment event alone does not, because the lender may still claim.
- **An independent contracted service.** The approver chose a service the company contracts with, rather than one the company operates, which the approver considered custodial, or one the participants choose, and accepted the recommended operating model with no Bitcoin key, no destination control and no company access or override. Keeping legal counsel's approval as a production-activation gate is the design agent's reading of that approval and is recorded as the agent's choice. The [independent release-secret constraint](../../build/records/constraints/cons-020-independent-ecvs-release-secret-authority.md) records the resulting rule.

## What is still open, excluded or deferred

- **The fallback is not yet available.** The ECVS model is selected, but production use requires both legal counsel's approval and implementation evidence. Until then no new loan may commit H(S), the product must not advertise the fallback, and the residual missing-Y risk above applies to every loan. The [fallback secret state](../../system-model/contracts/states/state-007-ecvs-s.md) begins in its production-unavailable state, and a resolved technical question does not satisfy that gate. Whether the arrangement is legally custodial is outside this technical design under the [legal and regulatory scope boundary](../../system-model/contracts/scope/scope-009-legal-and-regulatory-analysis.md).
- **No company default broadcasting.** The company does not schedule or broadcast the lender's pre-signed default transaction; the lender exports and broadcasts it. Revisiting that requires a complete authority and operating design under the [automatic lender-default broadcast exclusion](../../system-model/contracts/scope/scope-001-automatic-lender-default-broadcast.md).
- **No institutional collateral recovery.** There is no company recovery key and no company-run sale or distribution of collateral, and any future capability of that kind must remain separate from the borrower's repayment protection. Both are excluded under the [institutional last-resort recovery boundary](../../system-model/contracts/scope/scope-002-institutional-last-resort-collateral-recovery.md).
- No implementation question in this domain is currently open: its recorded questions are either answered or explicitly excluded.

The [domain record](../../system-model/domains/base-observation-and-fallback-review/domain.md) lists exactly what the domain owns and excludes.
