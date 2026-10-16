# Base Observation And Fallback Review

This domain makes evidence from the Base chain safe to use elsewhere in a Bitcoin-backed USDC loan, and defines one narrowly limited fallback that can help return a borrower's Bitcoin after a valid repayment that the lender never claimed. The [architecture guide](../architecture.md) shows where it fits in the system.

## What this domain does

A loan in this system lives on two chains that cannot see each other. The USDC side is settled by the loan's contracts on Base, a layer-2 network that settles on Ethereum. The Bitcoin collateral sits in an escrow output on Bitcoin, which the system spends only through transactions the borrower and lender signed in advance or a cooperative settlement both sign later. Something has to carry facts from Base to the parts of the system that act on them: the application that shows the loan's status, and the Bitcoin operations that finalize already-signed transactions. A transaction appearing in a wallet, an updated application screen or a lender who simply stops responding cannot carry that weight. This domain supplies the trustworthy version.

It has two jobs. The first is **observation**: reading what the approved Base contracts actually recorded, establishing where each record came from and how final it is, and repairing the application's view when the evidence changes. The second is the **fallback**: an independent outside service that, for loans built with this capability once it is activated, could publish a secret that lets the borrower's already-signed Bitcoin recovery transaction complete after an unclaimed repayment has been refunded on Base. The fallback is selected but not yet activated for production, so no loan has it today.

A few terms recur below:

- An **event** is the record a Base contract emits when one of its actions succeeds, such as a funding being finalized, the borrower accepting the loan, a repayment, a lender claim or a refund.
- **Base L1 finality** is the point at which the Base block containing an event cannot be reversed under normal chain assumptions, because the batch that carries it to Ethereum (layer 1) is final there. The observer can still correct a finalized record if canonical history later disagrees. Base documents this as taking roughly 20 minutes. Before that, an event is either **observed** (seen in a Base block) or **safe** (batched to Ethereum but not yet final); both are progress information only.
- **X**, **Y** and **S** are secrets whose hashes are fixed into each loan in advance. The borrower reveals X on Base to accept the loan. The lender reveals Y on Base to claim the repayment, and public Y then lets the borrower's recovery transaction complete. S is the fallback secret held by the outside service.
- **D** is the loan's repayment deadline. **C**, the claim cutoff, is D plus 172,800 seconds (two days).

## How its responsibilities work together

[Base observation, finality, and reconciliation](../../system-model/domains/base-observation-and-fallback-review/responsibilities/sr-006-base-observation-finality-and-reconciliation.md) follows the approved Base deployment, decodes the named contract events, records their provenance and finality, hands them to the application, and corrects that view after a reorganization. It also reconciles the independently sourced Bitcoin evidence that Bitcoin-dependent steps rely on, and classifies the evidence for payments made from participants' own Vault payment accounts. It reports facts; it never executes a contract call, holds a secret or decides what a fact means for the loan.

The [evidence-conditioned validation-service fallback](../../system-model/domains/base-observation-and-fallback-review/responsibilities/sr-007-evidence-conditioned-validation-service-fallback.md) defines the outside service, called the **evidence-conditioned validation service** or **ECVS**, that would hold the fallback secret S for each eligible loan. It would verify one exact finalized refund event for itself and only then publish S, and it controls disclosure of that secret and nothing else. This is a selected design, not yet activated for production and not evidence of an operating service.

The two responsibilities cooperate only loosely, by design. The observer can give the ECVS a reference to a public event, but the ECVS does not accept the observer's conclusion: it checks the public chain itself. Neither responsibility decides who deserves the collateral, chooses a destination or signs a Bitcoin transaction.

The domain receives the loan's agreed terms and the approved deployment description from the [Loan Terms And Commitments](./loan-terms-and-commitments.md) domain, and the events themselves from the Base contracts in the [Base USDC Settlement And Funding](./base-usdc-settlement-and-funding.md) domain. It provides finalized facts to the application in the [Participant Access And Loan Operations](./participant-access-and-loan-operations.md) domain, which derives what participants see, and finalized public secrets to the [Bitcoin Authorization And Recovery](./bitcoin-authorization-and-recovery.md) domain, which may then finalize only the matching transaction that was signed in advance.

## A normal case: from a Base event to a usable fact

Illustratively, suppose the borrower accepts a funded loan by revealing X on Base. The contract emits its acceptance event and pays the principal. Here is how that becomes something the rest of the system may act on.

```figure
caption: Display can start early; consequential action waits for the final step.
step: Observed | The observer reads the event from Base and checks chain, deployment, loan, transaction and block.
step: Safe | The block is batched to Ethereum; the application may show progress, labeled as awaiting finality.
step: L1 finalized | The block reaches Base L1 finality; the event may now drive consequential action.
step: Acknowledged | The application durably stores the finalized observation; only then does the observer advance its saved position.
step: Acted on | The application updates the loan, and the Bitcoin side may finalize the matching pre-signed activation.
```

Each observation carries an immutable identity made of the chain, the contract's proxy address, the block hash, the transaction hash and the position of the log in that transaction. The observer rejects an event whose chain, contract deployment, interface definition or loan binding is not the pinned expected value. Before a block reaches finality, the application may display the event, but it creates no final lifecycle step, no automatic Bitcoin action and no economic completion from it.

The observer never writes the application's tables directly. It sends each observation through one versioned, authenticated ingestion interface owned by the application, which stores it atomically and answers either "stored" or "already recorded". The observer keeps a durable **cursor**, the last finalized block up to which every event has been acknowledged, and advances it only after that acknowledgement. If an acknowledgement is lost, the observer sends exactly the same record again and its stable identity prevents a duplicate. After a restart, reconnect or provider change it rereads every block newer than the cursor, because those can still change. The application derives the status participants see from this event history; the contract's current-state query is used only as a diagnostic and never creates a stored fact.

## When sources fail, disagree or the chain reorganizes

On the public Base networks, Base Mainnet and the Base Sepolia test network, the observer reads through two independently operated managed providers: Alchemy as the primary and QuickNode as the fallback. The local demonstration instead uses one local Base node and makes no claim about providers. A notification from a provider is only a prompt to read the block and log properly. If the primary fails or rate-limits, the observer retries with increasing delay, capped at one minute, and promotes the healthy fallback automatically. One healthy provider is enough to report a finalized fact; the second exists for failover and for periodic cross-checks of chain identity and finalized blocks, not as a second approval for every action.

- **Both providers unavailable, or two healthy providers disagree.** Facts already finalized stay visible, fresh Base data shows as delayed during an outage, operations are alerted after five minutes, and no new consequential action that depends on Base proceeds. When a source recovers, the observer replays every missed event from its cursor before normal processing resumes. An outage never itself rewrites, rolls back or finalizes a loan.
- **A reorganization displaces an event.** The observer keeps the original record, appends a correction marking it noncanonical, returns the application's derived view to the last common finalized block, and replays canonical history forward. Evidence is never deleted, and a correction cannot undo an on-chain transaction or revive an invalid Bitcoin package.
- **An operator suspects a problem.** An authorized operator may request a recheck through the application, but cannot call the observer directly, edit source records, advance the cursor or override the result. A manual note never becomes a chain fact.

These rules also cover the system's shared hosting. All production application components, the observer included, run on one cloud provider, so a provider-wide outage can suspend observation along with everything else; after it returns, Base and Bitcoin are replayed and reconciled before queued work resumes.

## Bitcoin evidence and participant payments

The same responsibility reconciles Bitcoin evidence, under a stricter rule than Base. The steps that depend on Bitcoin, such as qualifying a prefund or confirming an activation or recovery, require fresh agreement between two configured sources read in parallel: Blockstream with Validation Cloud on production mainnet, Blockstream with Mempool on the default Signet test network, and separate connected Bitcoin Core nodes in the local demonstration. A conflict or outage blocks the dependent automation. Repeated reports of the same unresolved problem update one durable incident rather than creating new ones; the incident is retried every minute, escalated after five minutes or one missed Bitcoin block, and treated as immediately critical once the borrower has accepted the loan. Automation resumes only after fresh agreement and a replay from the last agreed state.

Participants can also pay from a Vault payment account, a Base account their own Vault controls. Evidence about such a payment has a deliberately limited meaning. When a payment's outcome is ambiguous, the application checks it again at 0, 15 and 60 seconds and must decide on escalation at 180 seconds; the observer supplies the chain evidence, and a success or failure counts only on exact matching evidence: the transaction hash, chain and deployment, sender, nonce (the account's transaction sequence number), token, recipient, amount, a native value of zero, call data and receipt status. A balance change, a single provider's view or a crashed process is never evidence that a payment was not sent. Even a confirmed transfer updates only that payment's own record: funding or repayment of a loan is established solely by the named contract event at L1 finality, and a standalone transfer between participants never advances the loan at all. A public profile with two separately operated allowlisted Base providers plus the observer is deferred; only the local profile, with one local Base node and no such claim, is selected now.

## When the borrower repays but the lender does not claim

The fallback exists for one situation, and a concrete case shows why it must be separate.

Illustratively, a borrower repays the exact debt and the repayment event reaches L1 finality before the deadline D. Normally the lender then claims the USDC by revealing Y before the cutoff C, and public Y lets the system complete the borrower's recovery transaction, which the borrower signed in advance to a fixed destination. But the lender may have lost their Vault password, become unavailable or simply refuse. Valid repayment alone does not release the Bitcoin.

```figure
caption: The refund settles the USDC; the fallback, where it exists, is a separate later step.
step: Repaid by D | Exact repayment is finalized on Base; the lender may claim by revealing Y before C.
step: Cutoff C | Two days after D, the lender's claim is permanently disabled and the borrower's refund recipient freezes.
step: Refund | Anyone may submit the fixed-effect refund; the exact repayment returns once to the frozen recipient.
step: Refund finalized | The refund event reaches L1 finality; the observer reports that the USDC was returned once.
optional: Fallback | Only for a loan built with the activated capability: the ECVS verifies the refund and publishes S.
optional: Bitcoin recovery | S completes the borrower's same pre-signed recovery transaction; it is final only when it confirms.
```

At C, Base permanently disables the lender's claim and freezes the borrower's current refund recipient. Before C, the borrower may have made one irreversible switch of that recipient to the borrower's own committed protocol account, for example out of concern about access to the original address. Anyone may then call the refund; the caller pays the transaction fee but cannot choose where the money goes, and the refund stays available indefinitely if automation fails. Claim and refund are mutually exclusive, so the lender cannot also collect the repayment. When the exact unclaimed-repayment refund event reaches L1 finality, the observer can report that the repayment was returned once. The refund never requires the fallback service. The Bitcoin escrow, meanwhile, is still unspent.

## How the fallback secret works

The ECVS is one contracted, independent service. For each loan built with the capability, it generates a unique random 32-byte secret S and keeps it. Before that loan's Bitcoin escrow is constructed and signed, it returns only **H(S)**, a hash commitment that is written into the loan and into the Bitcoin recovery script. Anyone can later check a disclosed secret against it. There is no provider-wide master secret. The company, the borrower and the lender never receive unrevealed S, and none of them can command an early release.

When a refund has finalized, the ECVS does not take the application's word for it. It independently checks the configured chain, deployment and current contract implementation, the event signature, the loan, the transaction and log, block canonicality and L1 finality, the exact debt and the frozen recipient. Only then may it publish S durably and publicly, with evidence binding it to that loan and event. Anyone can look the publication up and replay it after an interruption. A lookup can return no publication yet, a valid publication, an invalid or mismatched one, or an unavailable source; an empty or unreachable answer is not proof that the service deliberately withheld S. The application receives only public metadata and whether the secret matches the commitment.

Bitcoin finalization, in the [Bitcoin Authorization And Recovery](./bitcoin-authorization-and-recovery.md) domain, then makes its own checks: the activation gate, the publication and event binding, the matching hash, the retained recovery transaction and its signature, the fixed outputs and the still-unspent escrow. It places S into the **same recovery transaction the borrower already signed**, the one that Y would otherwise have completed. The borrower's signature does not cover the secret, so the transaction is unchanged and no fresh signature, second fallback transaction, service key or new destination is involved. Publication, broadcast and confirmed Bitcoin recovery remain three separate steps: the borrower's Bitcoin is recovered only when that transaction confirms.

> **The fallback is selected, not available**
> The fallback is an approved technical design, not an operating service. Counsel approval and implementation evidence must activate it for production use before any new loan may commit H(S) or the product may present the fallback as available; a resolved design question does not satisfy that gate. No approved operational fallback service exists yet: the service would be an outside party, and this system only plans verification of its boundary. An existing loan without H(S) cannot acquire the capability later.

## When the fallback cannot help

Missing Y, elapsed time, an application assertion, a raw token transfer or the earlier repayment event can never trigger publication of S. Wrong, early, unfinalized, cross-loan or unverifiable evidence fails closed. If the service is unavailable, the evidence is wrong or S cannot be published, the Base refund still stands complete, and recovery through S is simply unavailable. An outage or interruption can be recovered by verifying and publishing again with the same committed S. Loss, compromise or deliberate withholding follows a defined incident path; there is no discretionary company release, and a lost or compromised S cannot be replaced inside the existing escrow. Early disclosure is itself dangerous, because it would let borrower recovery happen too soon.

In every such case the unspent Bitcoin can still be reached by two routes the participants signed in advance, or by a cooperative settlement they may both negotiate and sign later. Their timing follows Bitcoin's own consensus clock (median time past), never Base or application time:

- The lender's pre-signed default route becomes valid at D plus three days (259,200 seconds) and pays the lender's fixed destination.
- In every newly built escrow, a borrower long-stop route becomes valid at D plus ten days (864,000 seconds), needs neither Y nor S, and pays the borrower's fixed destination. It does not cancel the lender's route; from then on both remain valid and the first to confirm wins.
- Both participants may also agree to a cooperative settlement, which needs fresh signatures from both.

This is a recorded residual risk, not a flaw to be read away: valid repayment is not borrower default, a refunded USDC balance is not complete Bitcoin settlement, and the collateral remains exposed to the lender's matured route for every loan without an activated fallback, and even with one until an S recovery actually confirms. The [missing-Y residual risk](../../system-model/contracts/invariants/inv-025-missing-y-residual-lender-risk.md) and the [threat record for valid repayment with missing Y](../../system-model/contracts/security/sec-024-valid-repayment-plus-missing-y-leaves-bitcoin-unsettled.md) keep it visible.

## Authority boundaries

This domain decides only matters of evidence: whether a Base event is canonical, finalized and correctly attributed; whether the independent Bitcoin sources agree; how evidence about a Vault payment is classified; and, for the ECVS, whether the exact finalized refund event exists for a loan so that its committed secret may be published. It must not:

- execute a Base transaction, sign, construct, fee-select or broadcast a Bitcoin transaction, or choose any destination;
- treat an observed or safe event, a submission, a provider response, a balance, a stored snapshot or an outage as a finalized fact;
- let observation imply an action, a claim beyond the event, Bitcoin activation or recovery, default, or that missing Y satisfies the fallback condition;
- let the ECVS execute or block the Base refund, judge economic entitlement, rely on the application's watcher as its authority, or hold any Bitcoin key;
- let anyone, including an operator or the company, override a fact or command the release of S.

Monitoring, package storage and the ECVS give the company no collateral key, sale authority or discretionary payout power.

## Choices and their reasons

- **Act only at Base L1 finality.** Acting on mere inclusion would be responsive but could let a rare transient event trigger a cross-chain action; acting at the safe stage lowers that risk but lacks the irreversible guarantee. Waiting for L1 finality adds roughly 20 minutes to each consequential handoff in return for one simple rule across funding, secret disclosure, repayment and refund. It is not a promise of an exact waiting time. The [finality selection](../../build/records/selections/sel-013-base-l1-finality-and-reorg-reconciliation.md) records it.
- **One primary and one fallback provider, with one healthy source sufficient.** A single provider would leave the observer blind during its outage; requiring two to agree on every action would add a permanent dependency and could delay safe operations. The user questioned an earlier proposal to always check both providers and then approved the agent's revised single-source-with-failover recommendation; the one-minute retry cap and the five-minute alert were set by the agent. The [provider selection](../../build/records/selections/sel-014-base-observation-provider-failover.md) records the choice.
- **An append-only event history with an acknowledged handoff.** A watcher-owned status or saved snapshots would hide the sequence of transitions; recording each event once, with corrections appended, lets a restart, provider change or reorganization reconstruct exactly what happened. The [event handoff selection](../../build/records/selections/sel-015-base-event-observation-handoff.md) records it.
- **An independent, contracted fallback service rather than one the company runs or users choose.** The user specified that the service be an independent party under agreement; its exact powers were approved on the agent's recommendation, and the counsel-approval activation gate was set by the agent. The design gives the service no Bitcoin key and no discretionary judgment, but its secret can still be disclosed early, withheld, lost or compromised, which is why the independent checks and the activation gate remain material. The [independent ECVS rule](../../build/records/constraints/cons-020-independent-ecvs-release-secret-authority.md) records the boundary.

## Open, excluded and deferred

- **Production fallback.** Selected but not activated: it waits for counsel approval and implementation evidence. Until then no new loan commits H(S), the product does not present the fallback as available, and a loan created now has no S route.
- **Legal classification.** Whether holding and publishing S makes the service a custodian, or how any role is legally classified, is outside this technical design; the [legal analysis boundary](../../system-model/contracts/scope/scope-009-legal-and-regulatory-analysis.md) keeps it separate.
- **Automatic lender-default broadcast.** The organization does not schedule or broadcast the lender's default route transaction; the lender may export it for manual broadcast once it is valid. This is [deferred](../../system-model/contracts/scope/scope-001-automatic-lender-default-broadcast.md) and is no duty or implied power of the ECVS.
- **Institutional collateral recovery.** No organization recovery key, sale or distribution of collateral exists; such a route is [deferred](../../system-model/contracts/scope/scope-002-institutional-last-resort-collateral-recovery.md), and the question of keeping any future one separate from repayment protection is recorded as out of scope for this version.
- **Delivery status.** The Base observation worker is recorded as implemented in an earlier delivery slice, with later corrections still pending. The local demonstration that would run the whole system end to end is blocked and not yet runnable.

No unresolved source conflict is recorded for this domain.

The [domain record](../../system-model/domains/base-observation-and-fallback-review/domain.md) lists exactly what the domain owns and excludes; the [Base event observation interface](../../system-model/contracts/interfaces/iface-012-base-event-observation-and-correction.md), the [conditional publication interface](../../system-model/contracts/interfaces/iface-017-conditional-ecvs-publication.md), the [unclaimed-repayment flow](../../system-model/behavior/flows/flow-005-valid-repayment-without-lender-claim.md) and the [conditional recovery flow](../../system-model/behavior/flows/flow-006-conditional-ecvs-borrower-recovery.md) hold the exact rules.
