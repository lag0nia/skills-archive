# How the Bitcoin-backed USDC one-loan system works

The system lets one borrower lock Bitcoin as collateral and receive a USD Coin (USDC) loan on the Base blockchain from one selected lender. Its purpose is to make that loan work while each participant keeps control of their own keys and secrets, so that no application screen, operator or service can move collateral or choose where money goes on its own. On Base, that protection is only as strong as the contract's upgrade administration, described in the Base settlement guide.

## What the system is for

A **lender** publishes a firm offer for one loan: an amount of USDC, the debt to be repaid, deadlines and the collateral required. A **borrower** who wants that loan reserves the offer. From then on, the two of them are the only participants in that loan. The system coordinates four things that would otherwise be hard to keep consistent:

- the agreement itself, which every later step must refer to exactly;
- Bitcoin collateral, which the borrower stages before the loan and which later sits in a shared **escrow** controlled by a script both participants agreed to;
- USDC movements on Base: the lender's principal, the borrower's repayment, and the lender's claim or the borrower's refund;
- the product application that participants use: accounts, a shared loan workspace, notifications, and a separate browser **Vault** in which each participant holds their own keys and secrets.

The organization that runs the product operates the application and automation, and pays some network fees. It holds no key to the collateral script. A separate, contracted **evidence-conditioned validation service (ECVS)** has a narrow, optional role described below; its production use is not yet activated.

Three secrets connect the two chains. Each is a random 32-byte value generated inside a Vault or service, and only a hash of it is committed in advance.

- **X** belongs to the borrower. Revealing it on Base accepts the funded loan, and the same public value lets the prepared Bitcoin activation transaction move the staged collateral into escrow.
- **Y** belongs to the lender. Revealing it on Base claims the repaid USDC, and the same public value lets the borrower's already-signed Bitcoin recovery transaction return the collateral.
- **S** belongs to the ECVS, for loans created with that optional capability. It can complete the same borrower recovery transaction as Y. The service may publish it only after verifying an exact, finalized refund event on Base, although a secret disclosed too early remains a recorded risk.

A revealed secret makes a previously signed Bitcoin transaction usable. It never signs anything, chooses a destination or confirms a transaction by itself.

## The domains and their roles

The design divides the system into five domains. Each one owns a kind of truth or authority that the others must not take over.

| Domain | Its role |
| --- | --- |
| [Loan Terms And Commitments](domains/loan-terms-and-commitments.md) | Defines the one shared meaning of a loan: the offer, the reservation, the exact agreed terms and the environment they apply to. |
| [Bitcoin Authorization And Recovery](domains/bitcoin-authorization-and-recovery.md) | Keeps Bitcoin keys and secrets with the participants, and builds, checks and operates only the fixed Bitcoin transactions they signed in advance. |
| [Base USDC Settlement And Funding](domains/base-usdc-settlement-and-funding.md) | Holds the authoritative loan record on Base and the fixed rules for funding, acceptance, repayment, claim and refund. |
| [Base Observation And Fallback Review](domains/base-observation-and-fallback-review.md) | Turns Base events into reliable, final facts for the rest of the system, and defines the conditional ECVS fallback. |
| [Participant Access And Loan Operations](domains/participant-access-and-loan-operations.md) | Runs the product: accounts and roles, the durable loan workspace, coordination of already-authorized actions, and an isolated local demonstration. |

Loan Terms And Commitments supplies the identity every other domain checks. Participant Access And Loan Operations presents and records the workspace and sends narrowly bound requests to each participant's Vault. Bitcoin Authorization And Recovery constructs and validates the participant-signed transactions. Base USDC Settlement And Funding controls its own value movements. Base Observation And Fallback Review qualifies the Base events that other domains rely on and independently constrains whether S may ever be published. The separation matters because each domain can report progress without acquiring another's authority: signing in is not unlocking a Vault, an accepted command is not a blockchain fact, and a Base refund is not a confirmed Bitcoin recovery.

## A loan from start to finish

The following case follows one loan through its normal path. The exact order, conditions and failure routes are in the flow records linked from each domain guide.

**Agreeing.** The borrower reserves a lender's published offer. Reservation creates a stable loan identity and a commercial draft, but no final agreement yet. Each participant's Vault then allocates loan-specific keys, confirms where that participant's money and Bitcoin should be paid, and prepares the hash of that participant's secret (X for the borrower, Y for the lender). The application assembles one complete candidate agreement and shows it to both. In the detailed records the agreement is committed when the second of two matching approvals arrives; whether the lender approves a second time is one of the open questions below.

**Staging collateral.** The borrower sends Bitcoin to a **prefund** output. The Bitcoin operations service builds six activation transactions and six refund transactions, one per fee level (10, 20, 50, 100, 150 and 200 satoshis per virtual byte). The borrower signs all of them and the lender adds its signature to the activation transactions. The application stores the signed set durably before anything depends on it. Once the prefund has six unchanged confirmations and enough time remains before the borrower's refund would become possible, the loan qualifies.

**Funding and acceptance.** The application's dedicated opener then opens a 24-hour Base funding window and a per-loan **funding vault**, a fixed address that accepts USDC for this loan only. It may do so only while at least 67 hours remain before the borrower's Bitcoin refund would become possible: 24 hours for funding, 24 hours for acceptance and 19 hours of safety margin. The selected lender decides when to transfer the principal; anyone may then finalize the exact amount. When that funding is final on Base, the borrower deliberately reveals X through their Vault. Acceptance pays the principal to the borrower's agreed address and opens a per-loan **repayment vault** in the same transaction.

**Activating collateral.** Public X lets the system broadcast one of the already-signed activation transactions, moving the prefund into escrow. When one activation transaction has six confirmations, the system builds the final set of exit transactions for that exact escrow and both participants sign their own routes. The loan is fully active only when that set is signed and durably stored.

**Repaying and closing.** The borrower, or any payer, sends the exact debt to the repayment vault, and it is finalized no later than the repayment deadline. The lender then reveals Y on Base to claim the USDC. Public Y completes the borrower's already-signed recovery transaction, and the collateral returns to the borrower's agreed Bitcoin address when that transaction confirms.

```figure
caption: Each hand-off waits for a final fact from the previous step; no screen or command stands in for one.
step: Agree | One exact candidate agreement is approved and committed.
step: Stage collateral | The borrower funds the prefund; all activation and refund transactions are signed and stored.
step: Fund | The lender transfers principal; the exact amount is finalized on Base.
step: Accept | The borrower reveals X; principal is paid and the repayment vault opens.
step: Activate | Public X moves collateral into escrow; exit transactions are signed and stored.
step: Repay and claim | Exact debt is finalized; the lender reveals Y and receives it.
step: Recover | Public Y completes the borrower's signed recovery; it is final when confirmed.
```

## Identity, authority and sources of truth

Every domain identifies the same loan through one canonical agreement and its hash. The agreement binds the participants, the selected offer and reservation, amounts, deadlines, the loan-specific Bitcoin public keys, each participant's chosen external Bitcoin address, the participants' Base protocol addresses and fixed payment recipients, and the hash commitments to X and Y. For a loan with the fallback capability, the hash of S is committed in the Bitcoin recovery script before signing; the architecture record also counts it in the agreement binding, while the agreement's field list does not include it, and which is meant is not stated. A separate deployment description binds environment-wide facts such as the chain, contracts, asset and timing policy. Neither is a wallet, a signing key or a fact about chain state, and an artifact that binds to the wrong loan, chain, asset, key, address or version is rejected.

Authority is deliberately split:

- **The agreement** is owned by the loan-terms domain. Workspace copies and acceptance snapshots cannot redefine it.
- **Bitcoin consensus** decides prefund and escrow outputs, signatures, timelocks, confirmations, reorganizations and which single spend of the escrow wins. Base records cannot spend or confirm Bitcoin.
- **The Base contracts** decide funding, acceptance, repayment, claim, refund and deadlines. Raw transfers, balances, submitted transactions and application status remain provisional until the named contract event reaches the required finality.
- **Each participant's Vault** holds that participant's password, seed, loan keys and unrevealed secret, and a separate, independently recoverable payment account for sending USDC on Base. Signing in to the product only permits fetching encrypted data; it is not decryption, signing, secret recovery or chain authority.
- **The selected lender** decides whether and when to fund. The product never pools, holds, substitutes or automatically deploys lender capital.
- **The observer** reports what Base recorded and how final it is. It does not create the fact or approve its consequence.
- **The ECVS**, when activated, may publish only its per-loan S after independently verifying one exact Base refund event. It is not a judge of entitlement, a signer or a destination selector.
- **The application** records durable commands, jobs, sourced status and stored transaction packages, and coordinates actions that participants have already authorized. It holds no participant private authority, no lender capital and no independent chain truth.
- **The organization's fee wallets** can add fees: on Bitcoin by funding a separate child transaction through a small anchor output, and on Base by submitting calls whose effect is already fixed. Neither gains any recipient, capital, debt, secret or contract authority.

## Where the system runs, and what it currently claims

All production application parts run on Cloudflare: the product web application, the application programming interface (API) with its database, the Base observer, the separately deployed Vault and the Bitcoin operations service. They keep separate build, project, credential, origin and release boundaries where required, but they share one provider failure domain. A Cloudflare-wide outage can therefore stop the product, the Vault, the API, observation and Bitcoin automation together. The blockchains keep running; the application accepts no new consequential command and claims no new chain result. When the provider returns, the system reconciles Base and Bitcoin before resuming its durable jobs. There is no live fallback to another provider and no stated recovery time; periodic backups outside Cloudflare protect stored package data, not a running service.

The required outcome of this design version is narrower than a production service. It is a developer-run local demonstration in which two isolated participants use the real product, API, Vault, contracts, observer, Bitcoin operations and protocol libraries to complete one loan through normal repayment and confirmed borrower recovery, on a local Base chain and a local Bitcoin test network. Automated local verification, the runnable local demonstration, test-network deployment, main-network deployment and activated production operation are separate claims; only the first two are required, and none of the later ones is claimed. Demonstration identities, tokens, wallets and substitutes exist only inside that local setup, which refuses to start if anything points at a public network or public credentials. The demonstration is not yet delivered: its own runtime is still in progress and it also waits on other pending work, so this guide does not describe it as runnable today.

## When things go wrong

Most failures stop the affected step rather than guess. The consequential routes are:

- **Before acceptance.** If funding expires, or the borrower never accepts, the lender's USDC returns to the lender's fixed address on Base, and once its timelock has matured the borrower's staged Bitcoin returns through one of the pre-signed refund transactions. The system has no way to accept on the borrower's behalf.
- **Acceptance without activation.** After X is public, the loan is not yet active. The system keeps pushing the chosen activation route until its escrow output has six confirmations. Before a candidate enters the network's queue, a fresh estimate may pick another signed fee level; once one is accepted there, the fee-selection contract allows only a separately approved fee-bump child to add fee, while the activation invariant speaks of escalating through the signed levels or such a child. How those two statements fit is not recorded. If the exit transactions are not all signed after activation, the loan stays explicitly pending signatures; principal already paid and confirmed escrow cannot be reversed.
- **Repaid, but the lender does not claim.** Two days after the repayment deadline the lender's claim is permanently disabled and the exact repayment can be refunded once to the borrower's frozen refund address. That refund does not release Bitcoin. For a loan created with the activated ECVS capability, S can then complete the borrower's recovery, but until that recovery confirms, the lender's timelocked route or a cooperative settlement can still win. Without S, the escrow stays unspent while the lender's timelocked route still matures and, for an escrow built with it, the borrower's long-stop matures later; whichever confirms first wins. Several residual-risk records omit the long-stop from this case, and one says such a loan has no borrower fallback route, an open point listed below. This is a recorded residual risk, not borrower default.
- **Missed repayment.** If exact debt is not finalized by the deadline, the loan is in ordinary default. The lender's pre-signed timelocked Bitcoin route becomes valid three days after the deadline under Bitcoin's own time rules, whatever happened on Base. The lender exports and broadcasts it manually; the organization does not broadcast it.
- **Long-stop.** Every newly constructed escrow includes a separate borrower route that needs no secret and matures ten days after the deadline. An existing escrow cannot acquire it later. It does not cancel the lender's route; whichever confirms first wins.
- **Unreliable evidence.** If Base providers disagree or are both unavailable, or Bitcoin observers disagree or are unavailable, existing final status stays visible and new dependent actions stop until the evidence is reconciled. A relay timeout is treated as unknown, never as permission to send a different transaction.

The system cannot guarantee that collateral returns to the borrower after valid repayment if the lender never reveals Y, whether or not an activated S exists, until a borrower recovery actually confirms; nor can it guarantee that a participant who forgets their Vault password can recover it; this version has no such recovery. Automatic organization broadcast of lender-default transactions, institutional collateral recovery, liquidation, public or multi-lender matching and pooled capital are outside this version.

## Choices and open questions

The five-domain map has mixed origins, and the architecture record holds its attribution. The user approved adding a separate domain for the product application layer after the agent recommended it. The other four domain names and boundaries were chosen by the agent while carrying out an approved migration; no exchange presented the full list for approval.

Running every production part on one provider is a recorded tradeoff: it avoids multiplying identity, replication, deployment and incident paths before those operations are proven, at the cost of one shared outage domain.

Several points remain open because the records that own them disagree or do not clearly agree. None is decided here.

- **Lender approval of final terms.** The architecture record says publishing an offer is the lender's standing acceptance and that reservation creates the loan without a second lender approval. The detailed loan-terms records require both borrower and lender to approve the exact final candidate before the agreement is committed, and the offer state record treats these as two different approvals. Which wording governs is undecided; see the [Loan Terms And Commitments guide](domains/loan-terms-and-commitments.md#choices-and-open-questions).
- **Number of exit transactions.** The exit-transaction contract and flows specify eighteen transactions after activation (six for each of three routes), while one archive sentence in the Bitcoin construction record still says twelve. See the [Bitcoin Authorization And Recovery guide](domains/bitcoin-authorization-and-recovery.md#open-excluded-and-deferred).
- **No qualifying fee level.** The fee-selection contract's general rule and a settled fee decision say that when even the highest signed fee level is not enough, the 200-level transaction is used, fee-bump eligibility is recorded and an alert is raised. The same contract's selection action says the selection fails closed and selects nothing. See the same Bitcoin guide.
- **The long-stop in the residual-risk records.** The long-stop route is part of every newly built escrow, but the records describing the risk after valid repayment without Y list the remaining Bitcoin outcomes without it, and one security record says a loan without the fallback secret has no borrower fallback route. See the [Base Observation And Fallback Review guide](domains/base-observation-and-fallback-review.md#limits-and-the-remaining-recovery-paths).
- **Where the hash of S is committed.** The architecture record counts it in the agreement binding, while the agreement's field list contains only the hashes of X and Y and the Bitcoin records commit it in the recovery script. See the identity section above.
- **Fee bumps once activation is queued.** The fee-selection contract allows only a fee-bump child once an activation transaction is accepted into the network's queue; the activation invariant also mentions the signed fee levels. See "Acceptance without activation" above.
- **One provider as enough.** The provider selection lets one healthy provider report a finalized Base fact, while a security record says no one source may become authoritative. See the [Base Observation And Fallback Review guide](domains/base-observation-and-fallback-review.md#establishing-a-fact-the-rest-of-the-system-can-use).
- **Base contract pause and upgrades.** Whether the deployment carries an on-chain pause role, and how an upgrade treats existing loans, are worded differently across the Base records, and three of them describe only the final multi-signature administration without the single key used during the beta, while two rule out an unrestricted single upgrade key. See the [Base USDC Settlement And Funding guide](domains/base-usdc-settlement-and-funding.md#choices-and-their-reasons).

The [technical architecture record](../system-model/architecture.md) holds the exact boundaries, authority and sources of truth.
