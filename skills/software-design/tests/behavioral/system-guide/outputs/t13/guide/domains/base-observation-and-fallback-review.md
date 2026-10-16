# Base Observation And Fallback Review

This domain decides when something that happened on Base may be relied on elsewhere in a Bitcoin-backed USDC loan, and it defines one narrow fallback that can help the borrower recover Bitcoin collateral after a valid repayment the lender never claimed. Neither part moves money, signs a transaction or decides who deserves the collateral. The [architecture guide](../architecture.md) shows where the domain sits in the whole system.

## What this domain does

Each loan lives on two chains with separate authorities. Base smart contracts settle the USDC: funding, the borrower's acceptance, repayment, the lender's claim and refunds. Bitcoin consensus controls the collateral. A transaction seen in a wallet, an updated screen in the application, or a lender who stops responding cannot carry authority from one chain to the other. The rest of the system needs one dependable answer to the question "did this Base event really happen, for this loan, and is it final?", and this domain supplies it.

A few terms matter throughout:

- An **event** is a named record that a Base contract emits when a transition succeeds, for example `Repaid` or `YReleased`. Events, not saved snapshots of the loan, are the history the system relies on.
- **Provenance** is where an event came from: the chain, the contract deployment, the loan, the transaction, the block and the position of the log entry in it.
- An event goes through several levels of confidence. **Observed** means one source has seen it in a Base block. **Safe** means it has been batched to Ethereum; this is shown as progress only. **Base L1 finality** means the block has reached Ethereum finality, which Base documents as roughly 20 minutes; only then may an event drive a consequential step. An event displaced by a chain reorganization becomes **noncanonical** and is kept only as audit evidence.
- **Y** is the lender's secret. Revealing it on Base claims the repaid USDC and at the same time makes public the value that completes the borrower's already-signed Bitcoin recovery transaction.
- **D** is the loan's repayment deadline and **C**, the claim cutoff, is D plus 172,800 seconds (two days).

## Two responsibilities with different jobs

[Base observation, finality, and reconciliation](../../system-model/domains/base-observation-and-fallback-review/responsibilities/sr-006-base-observation-finality-and-reconciliation.md) watches the approved Base deployment. It decodes the named contract events for the funding window, funding, the borrower's acceptance, repayment, the lender's claim, the refund-recipient switch, expiry and refunds, checks their provenance against the deployment manifest and the deployed contract code, classifies their finality, and hands them to the application. It also reconciles Bitcoin evidence from independent sources and classifies what is known about payments made from participants' Vault payment accounts. It reports facts; it does not create them or approve their consequences.

[Evidence-conditioned validation-service fallback](../../system-model/domains/base-observation-and-fallback-review/responsibilities/sr-007-evidence-conditioned-validation-service-fallback.md) defines the evidence-conditioned validation service (ECVS): one contracted, independent service that holds a separate secret for each eligible loan and publishes it only after it has itself verified one exact, final refund event on Base. It is a disclosure boundary, not a judge, signer or payout service.

The two cooperate without depending on each other's word. The observer can hand the fallback service a public reference to the refund event, but the service must verify the event from public Base data on its own; it never treats the application's observation as authority.

The domain receives the loan's committed terms and deployment identity from the [loan terms domain](loan-terms-and-commitments.md) and the events themselves from the Base contracts described in the [Base settlement domain](base-usdc-settlement-and-funding.md). It provides:

- normalized event observations, pending and final, and corrections to the loan workspace in the [participant access and operations domain](participant-access-and-loan-operations.md), which stores them and derives the status participants see;
- the finalized public `X` and `Y` values, with their provenance, to Bitcoin finalization in the [Bitcoin domain](bitcoin-authorization-and-recovery.md), which may then complete only transactions the participants signed in advance;
- agreed, or explicitly conflicted or unavailable, Bitcoin evidence to Bitcoin construction, Base settlement and the workspace;
- for an eligible loan, a public, replayable publication of the fallback secret.

## A normal case: from a repayment event to a usable fact

Suppose a borrower sends the exact debt to the loan's repayment vault, and a permissionless call, normally submitted by the application, finalizes the repayment no later than D. The contract emits `Repaid`.

```figure
caption: The application and the workers act only at the last step; earlier steps are shown as provisional.
step: Seen | The observer reads the event from the primary provider and checks chain, deployment, loan, transaction and block.
step: Recorded as pending | The application stores the observation and may show it as observed or safe, labelled as awaiting finality.
step: Final | The block reaches Base L1 finality; the application stores the final observation and the observer advances its cursor.
step: Acted on | The workspace treats repayment as complete and offers the lender the claim.
```

The application records the source evidence and derives the participant's view from it; the observer never writes loan status directly. Only after the application has acknowledged every relevant event up to a final block does the observer move its durable cursor, the saved position from which it safely resumes. If an acknowledgement is lost, the observer sends exactly the same observation again; its identity, built from the chain, contract, block, transaction and log position, makes the repeat harmless. Blocks newer than the cursor are re-read after any restart, provider switch or reconnection, because they can still change.

When the lender then claims by revealing Y, the same path applies to `YReleased`: once it is final, the observer hands the public Y and its provenance to Bitcoin finalization, which can complete the borrower's pre-signed recovery transaction. The observation itself still proves only that the event is final; the Bitcoin recovery is complete only when independent Bitcoin sources agree that the spend has confirmed.

The same gate covers every consequential step that depends on Base: treating funding as available for the borrower's acceptance, treating `X` as public and activating the collateral, treating repayment as complete, executing normal recovery after `Y`, and treating an expiry or refund as the final Base-side outcome. Anyone may still call a public contract function earlier; the product simply shows that call as provisional and does not build on it until finality.

## When sources fail, disagree or change

**Providers.** Alchemy is the primary read-only Base source and QuickNode the independently operated fallback, on Base Mainnet and Base Sepolia; no self-hosted Base node is run, and the local demonstration reads its own local node. In this version the observer reads Base by polling once a minute; a subscription notification, where used, is only a prompt: the observer re-reads the block and log before it reports anything. One healthy provider is enough to report a final fact; the second exists for failover and for periodic cross-checks, not as a second required confirmation of every event. When the primary fails, the observer retries with increasing delay, capped at one minute, and promotes the fallback automatically.

**Disagreement or double outage.** If both healthy providers disagree, or neither can supply usable data, existing final projections stay visible but every new consequential action that depends on Base stops, and operations are alerted after five minutes. Once a source is healthy again, the observer replays every missed event from its cursor and applies the correction rules before normal processing resumes. An outage never rewrites, rolls back or finalizes a loan.

**Reorganizations.** If an observed event disappears from canonical Base history, the observer keeps the original record, appends a separate correction marking it noncanonical, rewinds only the derived projection to the last common final block, and replays canonical history forward. No compensating chain event is invented and no fact is edited by hand.

**Operators.** An authorized workforce operator may ask the application to recheck a fact. The operator cannot call the observer directly, edit source records, advance the cursor or override the result.

**Bitcoin evidence.** The domain also reconciles Bitcoin evidence collected by the Bitcoin operations worker, under a stricter rule than for Base: a Bitcoin lifecycle gate needs fresh agreement between two configured sources (Blockstream and Validation Cloud on mainnet, Blockstream and Mempool on the default Signet, and separate connected Bitcoin Core nodes locally). A conflict or double outage blocks dependent automation, retries every minute, and updates one incident rather than opening duplicates. It escalates after five minutes or one missed Bitcoin block, and a failure after the borrower has accepted the loan by disclosing `X` is treated as immediately critical. Automation resumes only after fresh agreement and a replay from the last agreed state.

**Payments from Vault payment accounts.** A participant's Vault can sign ordinary USDC transfers from a payment account. Evidence about such a transfer (its transaction hash, nonce, provider responses) stays provisional. Reconciliation probes at 0, 15 and 60 seconds and must escalate at 180 seconds. The local demonstration uses one local Base node with the observer and makes no multi-provider claim; a public profile using two separately operated allowlisted Base providers plus the observer is deferred, and the payment-signing capability as a whole is planned and not yet verified. A valid confirmation must match the exact chain and deployment, transaction, sender, nonce, token, recipient, amount, zero native value, call data and status; if a reorganization removes a payment, its nonce goes to review and later payments from that account wait; a missing provider record, one provider's view, a balance change or a crashed process is never proof that a payment was not sent. A balance, a transfer, a transaction hash or a successful submission never completes funding or repayment: only the named final contract event does. A confirmed standalone participant transfer updates only its own transfer record and never advances the loan.

## When the lender does not claim: the conditional fallback

Normally the lender claims repaid USDC by revealing Y before C. If the lender loses access, refuses or disappears, valid repayment by itself does not release the Bitcoin. The domain's fallback addresses this case, and only for loans set up with it.

**On Base, nothing waits for the fallback.** At C, the contract permanently disables the lender's claim and freezes the borrower's current refund recipient. Before C, the borrower may switch that recipient once, irreversibly, to the borrower's committed protocol address, for example if the original recipient has become hard to use. From C onwards anyone may submit the fixed refund call, which returns the exact repaid amount once to the frozen recipient; the caller chooses nothing. The application schedules the refund and may pay its gas from a fee wallet that gains no role, and a refund submitted first by an outsider counts as success. The right never expires if automation fails. Once the `UnclaimedRepaymentRefunded` event reaches Base L1 finality, the observer can report that the exact repayment went back to the borrower. Claim and refund cannot both succeed. The Bitcoin collateral, however, is still locked.

**The fallback secret.** For an eligible loan, the ECVS generates a random, unique 32-byte secret, S, and before the loan is constructed returns only its hash, written H(S). That hash is a commitment: anyone can later check that a published S matches it. It is committed into the loan and the Bitcoin recovery script before escrow construction and before the borrower's signatures. Before public release nobody else holds S: not the company, the borrower or the lender, and no master secret shared across loans exists. Nobody can command an early release.

The recovery script accepts either Y or S for the same borrower recovery transaction. The borrower signs each of its fee variants once during setup, and a later disclosure of either secret completes that same signed transaction to the same committed destination. There is no second fallback transaction, no fresh borrower signature after publication, no service key and no new destination.

```figure
caption: The Base refund is complete at step 2 on its own; steps 3 to 6 apply only to a loan set up with the fallback.
step: Cutoff | At C the lender's claim ends and the borrower's refund recipient freezes.
step: Refund final | Anyone submits the fixed refund; its event reaches Base L1 finality.
optional: Independent check | Only for a loan set up with the fallback: the service verifies the exact final refund event itself.
optional: Publication | Only after that check: the service durably and publicly publishes the matching S.
optional: Finalization | Only once S is public: Bitcoin finalization checks S against H(S), inserts it into the already-signed recovery transaction and submits it.
optional: Confirmation | Only if the escrow is still unspent: independent Bitcoin sources agree the spend has confirmed; only then is recovery final.
```

**The independent check.** Before publishing, the ECVS checks for itself the configured chain, deployment and current implementation, the event signature, the loan, the transaction and log, that the block is canonical and final, the exact debt and the frozen recipient. Only the expected loan's final `UnclaimedRepaymentRefunded` event qualifies. `Repaid` alone, a raw token transfer or balance, the passage of time, a missing Y, a missing watcher record, a workspace label or an operator's assertion never does.

**Publication and lookup.** The service publishes S on a durable public source with evidence binding it to the loan and the event. Anyone can look it up and look again after an interruption. A lookup reports one of four things: no publication yet, a valid publication, an invalid or mismatched publication, or an unavailable source. An empty or unreachable answer is not evidence that the service decided to withhold S. The product itself receives only public metadata and whether the commitment matches; the authorized Bitcoin finalizer or an independent verifier fetches the public S.

**Bitcoin finalization.** This happens in the Bitcoin domain, not here. The finalizer checks the activation gate, the publication and its binding to the event, that S matches the committed hash, the exact retained recovery transaction and signature, the fixed outputs and that the escrow output is still unspent. It then selects one of the already-signed fee variants, inserts S and submits. How a variant is chosen when no signed variant is strictly above the current fee estimate with its safety margin added is an unresolved conflict between the Bitcoin owners: one statement selects the 200 sat/vB variant, marks it eligible for a separate fee bump and alerts for manual approval, another selects nothing and fails closed (see the [Bitcoin domain guide](bitcoin-authorization-and-recovery.md)). Publication is not a submission, and submission is not confirmation.

> **Not available yet**
> The fallback is a selected technical design, not an operating service. Counsel approval and implementation evidence must activate it before any new loan may commit H(S) or the product may present the fallback as available. A loan created without the commitment, which today means every loan, cannot acquire it later, and a lost or compromised S cannot be replaced for an existing escrow.

## Exceptions and what remains possible

Wrong, early, not-yet-final, cross-loan or unverifiable evidence cannot authorize publication. An outage or interruption is recovered by verifying again and replaying the same publication; S never changes. Loss, compromise or withholding of S follows the defined incident path; there is no discretionary company release and no replacement secret that repairs an existing escrow. Disclosure that comes too early is itself dangerous, because it would let the borrower's recovery complete prematurely.

In all these cases the Base refund stays complete and valid, and an unspent escrow can still be spent only through routes the participants authorized themselves: the two timelocked routes signed when the loan was set up, or a spend both freshly sign:

- **The lender's timelocked route.** The lender's pre-signed default transaction to the lender's fixed destination becomes valid once Bitcoin's median time past (the network's agreed clock, the median of recent block times) passes D plus 259,200 seconds (three days). The lender, or anyone holding the exported package, can broadcast it; the organization does not broadcast default packages.
- **The borrower long-stop.** Every newly constructed escrow also carries a borrower-signed transaction to the borrower's committed destination that needs neither Y nor S and becomes valid once median time past passes D plus 864,000 seconds (ten days). It does not cancel the lender's route; from then on both are valid and the first confirmed spend wins.
- **Cooperative settlement.** Both participants may freshly sign an agreed spend. The Bitcoin mechanism is fixed, but the signing session, its Base accounting and support procedures are deferred, so the product does not offer it as a complete operation.

These are residual Bitcoin risks that the design keeps visible. A valid repayment followed by lender silence is not borrower default, a refunded USDC balance is not a completed Bitcoin settlement, and nothing here guarantees that the collateral returns to the borrower: without a confirmed recovery, a matured lender route can still win.

## Authority boundaries

The observer may:

- classify the provenance and finality of named Base events and record corrections;
- block new consequential actions when its sources fail or disagree;
- classify Bitcoin and payment evidence for the gates that depend on it.

It must not execute contract calls, construct, sign, fee or relay Bitcoin transactions, release or store secrets, submit application commands, accept a manual override, treat a loan snapshot as competing history, or infer anything from raw transfers or balances. An observation does not imply an action, any claim right beyond the event itself, Bitcoin activation or recovery, or default, and a missing Y never satisfies the fallback condition.

The ECVS may only disclose, or fail to disclose, its committed secret. It has no Bitcoin key, signature, transaction or destination, cannot execute, delay or block the Base refund, does not decide who is entitled to the collateral and does not rely on the application as a source of facts.

Monitoring, package storage and the fallback service give the company no collateral key, no authority to sell collateral and no discretionary payout power.

## Choices and their reasons

- **One finality rule for everything consequential.** Acting on ordinary inclusion would be responsive but could let a transient observation trigger a cross-chain action; the safe status lowers that risk without giving Ethereum's irreversible finality. The design accepts roughly 20 minutes of delay at each consequential handoff in return for one simple safety-first rule. The user specified waiting for finality; the uniform gate and the provisional display were approved on the agent's recommendation, and keeping displaced events as noncanonical records was the agent's choice. The [finality selection](../../build/records/selections/sel-013-base-l1-finality-and-reorg-reconciliation.md) records the options.
- **Failover rather than two-provider agreement.** One provider would leave the observer blind during its outage; requiring two agreeing providers for every action would make the backup a permanent dependency and delay safe operations. Running an own Base node was judged not worth the burden for this version. The provider choice and the one-healthy-source rule were approved on the agent's recommendation; retry delays, alert timing and provenance retention were the agent's choice. See the [provider selection](../../build/records/selections/sel-014-base-observation-provider-failover.md).
- **Event history and one ingestion boundary.** A mutable status or stored loan snapshots would hide the sequence of transitions; letting the observer write application tables would add a second, unversioned interface open to duplicate or partial updates. An append-only history behind one acknowledged, versioned interface makes restart, failover, reorganization and audit unambiguous. The user specified that only emitted events become observations; the ingestion design was approved on the agent's recommendation and the record shapes were the agent's choice. See the [observation handoff selection](../../build/records/selections/sel-015-base-event-observation-handoff.md).
- **An independent, contracted service.** The user chose a service the company contracts by agreement, not one it operates and not one users select, reasoning that operating it would make the arrangement custodial. The exact trigger and the service's operating model were approved on the agent's recommendation, with some of the trigger's binding details chosen by the agent. Treating counsel approval as a production gate was the agent's choice and claims no legal classification; legal analysis is outside this design. The [ECVS constraint](../../build/records/constraints/cons-020-independent-ecvs-release-secret-authority.md) states the resulting limits.
- **One recovery transaction for either secret.** The user specified that each borrower recovery fee variant is signed once and can be completed with Y or S, so no separate fallback transaction family exists; the exact script form was approved on the agent's recommendation.

## Open, excluded and deferred

This domain has no unresolved tickets and no recorded source conflict of its own. One unresolved source conflict in the Bitcoin domain reaches its fallback narrative: how a signed fee variant is chosen when none clears the current fee estimate with its safety margin, described above.

Gated, not available: the fallback service itself, until counsel approval and implementation evidence activate it. The organization does not operate the service; the cross-domain verification harness is the only build unit mapped to it, to prove its boundary. The Base observation worker was built in an earlier delivery of the core coordination repository; the delivery index records later changes to that repository that are not yet executed, and no deployment or production operation is claimed.

Deferred, each with its own revisit condition:

- [automatic organization broadcast of lender-default packages](../../system-model/contracts/scope/scope-001-automatic-lender-default-broadcast.md);
- [institutional last-resort collateral recovery](../../system-model/contracts/scope/scope-002-institutional-last-resort-collateral-recovery.md), which would give the organization a collateral key and possible sale authority, kept separate from the repayment protection described here;
- complete [cooperative settlement operations](../../system-model/contracts/scope/scope-005-cooperative-settlement-operations.md).

Excluded from this design: [legal and regulatory classification](../../system-model/contracts/scope/scope-009-legal-and-regulatory-analysis.md), including of the fallback service's role.

The [unclaimed-repayment flow](../../system-model/behavior/flows/flow-005-valid-repayment-without-lender-claim.md), the [conditional recovery flow](../../system-model/behavior/flows/flow-006-conditional-ecvs-borrower-recovery.md), the [publication contract](../../system-model/contracts/interfaces/iface-017-conditional-ecvs-publication.md), the [event observation contract](../../system-model/contracts/interfaces/iface-012-base-event-observation-and-correction.md) and the [residual missing-Y risk](../../system-model/contracts/invariants/inv-025-missing-y-residual-lender-risk.md) hold the exact rules. The [domain record](../../system-model/domains/base-observation-and-fallback-review/domain.md) lists exactly what the domain owns and excludes.
