# How the Bitcoin-backed USDC one-loan system works

The system lets one borrower obtain a USDC loan on Base from one selected lender, secured by Bitcoin collateral that neither the product nor the organization running it can spend. It exists to keep the agreement, the USDC, the collateral and the participants' private authority separate while still letting a loan move from offer to repayment, or to a fixed fallback outcome, across interruptions.

## What the system is for

A **lender** publishes a firm offer for exactly one loan: the principal, the total amount owed, the Bitcoin collateral required, the repayment deadline and an optional protection expiry. A **borrower** who signs in to the product can reserve an available offer, which creates the loan. The two then set up the collateral and the USDC loan, and later the borrower repays. Other parties take part without gaining authority over the loan:

- the **organization** that runs the product, which operates the application, stores signed transactions, watches both chains and may pay network fees from its own fee wallets, but holds no collateral key and cannot choose where money goes;
- **workforce operators**, who sign in separately and can only request operations the design already permits;
- **external systems**: the Base and Bitcoin networks, the data providers that report what happened on them, Cloudflare (which hosts every production part of the application), and WorkOS (which authenticates participants);
- an optional, independent **fallback service** that can publish one secret per loan after a specific refund on Base. It is a selected design, not yet available (see below).

This version is deliberately narrow: one offer funds one loan with one selected lender. There is no public or multi-lender matching, no pooled lender capital, no product custody of funds, no automatic deployment of lender capital and no liquidation of Bitcoin.

A few ideas recur across the whole system:

- **The Vault.** Each participant has a Vault, a separate browser application on its own web origin that holds that participant's seed, keys and secrets, encrypted with a password only the participant knows. Signing in to the product lets the participant fetch the encrypted Vault; it never decrypts it, recovers a forgotten Vault password, signs anything or makes a chain action valid.
- **Pre-signed transactions.** The Bitcoin side works with transactions that both participants review and sign in advance, each with a fixed destination. Several copies of each transaction are signed at different fixed fee rates, because a signed transaction's fee cannot be changed later; a separately funded child transaction can add fee if needed. A signed transaction is evidence of what a participant authorized, never permission for the application to choose a new destination.
- **Three secrets.** The borrower's secret **X**, revealed when the borrower accepts the funded loan on Base, completes the transaction that moves the collateral into its locked loan output (the escrow). The lender's secret **Y**, revealed when the lender claims repayment, completes the borrower's recovery transaction. A fallback secret **S**, held by the independent fallback service, can complete that same recovery transaction in one narrow case. Each secret enables only its fixed, pre-signed route.
- **Finality.** The application and its workers take no step that depends on a Base event until the event's block reaches finality on Base's layer 1, Ethereum (roughly 20 minutes); they may show the event earlier as provisional, and anyone may still call the public contract directly. Bitcoin lifecycle gates wait until independent sources freshly agree on the required confirmations.

## The domains and their roles

The system is divided into five domains. Each is a coherent concern with its own authority, and each has its own guide.

| Domain | Its role |
| --- | --- |
| [Loan Terms And Commitments](domains/loan-terms-and-commitments.md) | The one shared meaning of a loan: offer, reservation, versioned terms and the deployment they refer to. It binds; it never moves value. |
| [Bitcoin Authorization And Recovery](domains/bitcoin-authorization-and-recovery.md) | Participant-controlled Bitcoin keys and secrets, the staged deposit and the locked collateral, every pre-signed route, fees, relay and Bitcoin evidence. |
| [Base USDC Settlement And Funding](domains/base-usdc-settlement-and-funding.md) | The Base contract record of the loan and its fixed rules for funding, acceptance, repayment, the lender's claim and refunds. |
| [Base Observation And Fallback Review](domains/base-observation-and-fallback-review.md) | Deciding when a Base event is final enough to rely on, and the rules for an independent, conditional fallback secret service. |
| [Participant Access And Loan Operations](domains/participant-access-and-loan-operations.md) | Accounts and roles, the durable loan workspace that coordinates every step, and the isolated local demonstration. |

The loan terms domain is used by all the others: every artifact names the same loan. Participant Access And Loan Operations coordinates the others but owns none of their authority: it records what was requested and what each external source reported, and it sends narrowly bound requests to participants' Vaults. Base settlement and Bitcoin authorization are independent authorities over different assets. Base observation decides when a Base event is final enough for the rest of the system to act on, and the fallback service checks its one trigger event independently rather than trusting that observation.

## A loan from start to finish

The following case is illustrative. A lender has published an offer for 10,000 USDC; a borrower holds Bitcoin.

```figure
caption: Each step produces its own evidence; none of the later steps is implied by an earlier one.
step: Reserve | The borrower reserves the offer; the loan identity is created at once.
step: Agree | Both Vaults prepare keys and destinations, and the exact final terms are frozen.
step: Prepare collateral | The borrower deposits Bitcoin; both sign the activation and refund transactions in advance.
step: Fund | After six confirmations the funding window opens; the lender transfers the principal.
step: Accept | The borrower discloses X on Base and receives the principal.
step: Activate | X completes the pre-signed activation; recovery transactions are then signed.
step: Repay and claim | The borrower repays; the lender claims by revealing Y.
step: Recover | Y completes the borrower's recovery; Bitcoin confirmation ends the loan.
```

**Reserve and agree.** The borrower's reservation is atomic: a competing reservation loses, and a reservation is limited to 24 hours (whether an unused one that expires before the terms are committed also costs the borrower an infraction is an open question, below). The offer's publication is the lender's standing acceptance of its commercial values, and the reservation needs no second lender approval. Each participant's Vault then derives keys for this loan, confirms its own payout destinations and generates its secret (X for the borrower, Y for the lender), returning only the secret's hash. The workspace assembles one complete candidate version of the terms. The detailed terms records then require both the borrower and the lender to approve that exact candidate before it is committed. Whether that lender approval of the final candidate contradicts the statements that there is no second lender approval is an open question, explained below.

**Prepare the collateral.** The borrower sends Bitcoin to a staging output called the prefund. The Bitcoin domain builds six activation transactions and six borrower refund transactions at fixed fee rates; the borrower signs all of them and the lender adds its signature to the activation transactions. The application stores the complete signed set in its primary archive before relying on it. Only after six unchanged confirmations of the prefund, with independent sources agreeing and at least 67 hours left before the borrower's refund route opens, does the system ask the Base contract to open a 24-hour funding window.

**Fund and accept.** The lender alone decides whether to fund, from any wallet it controls, by ordinary transfers to a per-loan funding vault on Base. When the exact principal is finalized, the borrower deliberately reviews and accepts in the Vault, which discloses X through the Base contract. The contract pays the principal to the borrower's fixed recipient and sets up the repayment vault in the same step. At this point the Bitcoin collateral is not yet active: the system completes the pre-signed activation with the now-public X and waits for six confirmations of the escrow output. Only then are the terminal transactions for that exact output built and signed (borrower recovery, the lender's default and the borrower's long-stop; how many this set contains is an open question, see below), and the loan becomes active once they are archived.

**Repay and recover.** The borrower, or anyone paying on the borrower's behalf, pays the debt into the repayment vault, and the repayment of exactly the debt must be finalized on Base no later than the deadline D; a transfer or balance alone does not count. The lender claims by revealing Y before the claim cutoff C, two days after D, and receives the USDC at its fixed recipient. Once that claim is final, Y completes the borrower's pre-signed recovery transaction, and the loan is closed when independent Bitcoin sources agree that the spend has confirmed.

The [technical architecture record](../system-model/architecture.md) and the linked flow records hold every exact transition.

## Identity, authority and sources of truth

**One loan identity.** Every domain identifies the loan through one canonical set of loan terms and its hash. The terms bind the participants, the selected offer revision and reservation, amounts and deadlines, the loan's Bitcoin public keys, the separately chosen payout destinations, the Base protocol addresses and fixed recipients, and the hashes of X, Y and, when committed, S. A separate deployment manifest binds environment-wide facts: chains, contracts, the USDC asset, the Bitcoin network, timing policy and upgrade authority. Any artifact that names the wrong loan, chain, asset, key, destination or version is rejected. A matching identifier proves which agreement an artifact describes; it does not authorize a spend.

**Distinct identities.** A loan's Bitcoin keys, a participant's Base protocol account, its external payout destinations and its Vault payment account are four different things. A payment account can pay into a funding or repayment vault, but it never becomes a protocol caller or a recipient by doing so, and choosing it as a recipient for a new loan requires fresh approval.

**Who decides what.**

- The loan terms domain owns what the loan means; workspace copies cannot redefine committed terms.
- Bitcoin consensus owns deposits, the escrow, signatures, timelocks, confirmations, reorganizations and the one final spend. Nothing on Base can spend or confirm Bitcoin.
- The Base contracts own funding, acceptance, repayment, the claim and refunds. Transfers, balances, submitted transactions and application status stay provisional until the named contract event is final.
- Participants' Vaults own passwords, seeds, keys, unrevealed secrets and payment signing.
- The selected lender alone approves and funds the capital.
- Base observation reports facts and never creates or approves them.
- The fallback service may only disclose its committed secret after verifying one exact refund event itself.
- The workspace owns requests, durable jobs, stored packages and derived status, but no private authority, no lender capital and no chain truth.
- The local demonstration owns only its isolated developer profile.

**Evidence, not status.** The application keeps separate states for a request it accepted, a job it completed locally, a transaction it submitted, an event it observed, an event that is final, a Bitcoin transaction broadcast and a Bitcoin transaction confirmed. It never collapses them into one generic "done". Paying gas does not transfer authority: the organization's fee wallets may submit fixed-effect calls or fund a fee-bump transaction, but gain no say over recipients, capital, debt, secrets or the contract.

## When things go wrong

**Before the borrower accepts.** If origination fails, is cancelled or expires before X is disclosed, each side recovers separately: the lender's USDC returns only to the lender's fixed recipient, and the borrower's deposit returns through a pre-signed refund once its relative timelock matures. No company decision is needed.

**After acceptance but before activation confirms.** The loan is then "accepted on Base, X public, activation pending", not active. The system keeps resubmitting the same chosen activation, raising its fee, until the escrow output reaches six confirmations or the failure is reconciled. Whether that fee can still rise through already-signed variants once the activation is in a mempool, or only through a separately approved fee-bump child, is an open question (below).

**If the borrower does not repay.** Once the deadline passes without a valid, final repayment, the lender may use its pre-signed default transaction. Bitcoin cannot see Base, so it accepts that transaction once median time past passes D plus three days whether or not the loan was repaid on Base. The lender exports and broadcasts it; the organization does not broadcast default transactions. Missing secrets, observer outages or lender silence never count as borrower default.

**If the borrower repays but the lender never claims.** At C the lender's claim ends for good and anyone can return the exact repayment to the borrower's frozen refund recipient. That refund does not release the Bitcoin. For a loan set up with the fallback (none can be until counsel approval and implementation evidence activate it), the independent service can then publish S, which completes the same borrower recovery transaction. Otherwise, and in any case until a recovery confirms, the lender's timelocked route can still win; a borrower long-stop transaction, valid ten days after D without any secret, gives the borrower a competing route, and the first confirmed spend wins. This residual risk is recorded rather than hidden: a refunded balance is not a settled loan, and valid repayment followed by lender silence is not borrower default.

**If observers fail or disagree.** A Base provider outage or disagreement keeps existing final information visible but blocks every new step that depends on Base; Bitcoin source disagreement blocks dependent automation. Neither is ever resolved by a manual override of a chain fact.

**If Cloudflare fails.** All production parts share Cloudflare's provider failure domain despite separate accounts, projects, credentials and release processes. A Cloudflare-wide outage can suspend the product, Vaults, the application interface and its database, observation, Bitcoin automation and the operator surface together. The chains keep running; the application accepts no new consequential request and claims no chain result. After recovery it reconciles Base and Bitcoin before resuming its durable jobs. There is no live fallback to another provider and no stated recovery time; off-provider backups protect stored data, not service availability.

**What the system cannot guarantee.** It cannot guarantee that the borrower's collateral returns after lender silence. Until the fallback is available, the borrower's only secret-free route is the long-stop, valid ten days after D, which races the lender's default transaction, valid from D plus three days; whichever spend confirms first wins. Even a loan with the fallback only gains an earlier competing route, not a guarantee. It cannot recover a forgotten Vault password. It cannot make a combination of compromises safe merely because each stolen piece looks harmless alone: the security records analyse realistic combinations, such as a shared frontend compromise during both participants' unlocks, and name one owner for each.

## Where it runs and what has been built

Every production part of the application runs on Cloudflare. The required outcome of this design is narrower than production: a developer-operated local demonstration in which two isolated participants use the real product, Vault, Base contracts, observer, Bitcoin operations and protocol libraries to complete one loan through normal repayment and confirmed borrower recovery.

| Profile | What this version targets | What it does not prove |
| --- | --- | --- |
| Deterministic local verification | Verification only: disposable fixtures, failure injection and cross-component assertions. | A runnable product, deployment or operation. |
| Local demonstration | Runnable use through one developer entrypoint, with preserved state and explicit reset. Not yet runnable: it is blocked on pending changes. | Any public deployment or real-provider compatibility. |
| Testnet, mainnet | No deployment is claimed. | Anything about production. |
| Production | No activated operation is claimed. | Nothing is activated by a configuration name or a successful local run. |

Demonstration identities, funds and substitutes exist only inside the explicit local profile, and the profile refuses to start if anything points at a public network or credential. The local demonstration is not yet runnable: it is blocked on pending changes to components it depends on. Nothing has been deployed to a public network or activated.

## Choices and open questions

**Choices and their reasons.**

- *Five domains.* Adding a separate domain for the product application layer was approved on the agent's recommendation after the user asked where the ordinary web application belonged. The other four domains were the agent's choice: the user endorsed the concept of durable domains, but no exchange presented the full list for approval.
- *One finality rule for Base.* Waiting for layer-1 finality before any consequential step trades about 20 minutes of delay for one uniform, safety-first rule; the user specified it. See the [Base Observation And Fallback Review guide](domains/base-observation-and-fallback-review.md).
- *One provider failure domain.* The user specified Cloudflare for every production part, and the outage behaviour was approved on the agent's recommendation. The recorded reason is simplicity: spreading parts across providers would multiply identity, replication, deployment and incident paths before those operations are proven, so the design accepts that a Cloudflare-wide outage stops the application and Bitcoin automation together.
- *An independent fallback service.* The user chose a service contracted by agreement over one the organization operates, because operating it would make the arrangement custodial. Its use waits for counsel approval and implementation evidence; legal classification is outside this design.

**Open questions.** These points are recorded as undecided in their technical owners; this guide does not settle them.

- *Lender approval of the final terms.* The architecture record, the one-loan offer contract and the offer selection say publication is the lender's standing acceptance and reservation needs no second lender approval; the selection adds that there is no second lender-approval step. The terms state records and the terms responsibility require both participants, the lender included, to approve the final candidate terms before commitment, an approval they describe as distinct from the lender's commercial approval. Whether these describe different stages or conflict is undecided. See the [Loan Terms And Commitments guide](domains/loan-terms-and-commitments.md).
- *Number of terminal packages.* One sentence of the package-construction responsibility describes a 12-package terminal phase, while that record's own construction rule and the flow, state and constraint records describe 18 terminal packages (six borrower recovery, six lender recovery, six borrower long-stop). See the [Bitcoin Authorization And Recovery guide](domains/bitcoin-authorization-and-recovery.md).
- *Fee choice when no signed rate is high enough.* One statement selects the highest signed fee rate, marks the transaction eligible for a fee bump and alerts for manual approval; another says no candidate is selected and the action fails closed. See the [Bitcoin Authorization And Recovery guide](domains/bitcoin-authorization-and-recovery.md).
- *Raising the fee of a pending activation.* The activation-pending invariant says the system escalates through signed tiers or a separately approved child; the fee-selection contract says an activation already accepted into a mempool is the sole parent and only a child can add fee. Whether tier escalation applies only before acceptance is undecided. See the [Bitcoin Authorization And Recovery guide](domains/bitcoin-authorization-and-recovery.md).
- *Who relays the borrower long-stop and cooperative transactions.* The relay contract accepts only activation, normal recovery and automatic refund transactions, while the long-stop and cooperative settlement records describe relaying those transactions through the existing constrained path. Which relay boundary applies is undecided. See the [Bitcoin Authorization And Recovery guide](domains/bitcoin-authorization-and-recovery.md).
- *Whether the Base contract has a pause.* The contract responsibility, the governance selection and the opening-authority constraint say this version has no on-chain pause and must not add one; the deployment state record lists pause and operational roles and a paused state. Whether that pause is only the application's stop or an on-chain role is undecided. See the [Base USDC Settlement And Funding guide](domains/base-usdc-settlement-and-funding.md).
- *The single upgrade key during the beta.* The governance selection has one dedicated key own contract upgrades during local testing and a short public beta before ownership moves to a 2-of-3 multisig timelock; the upgrade-boundary invariant, the contract responsibility and the immutable-conversion scope record say this version keeps the multisig timelock, and the deployment state record forbids an unrestricted single upgrade key. Whether the beta key is a permitted stage is undecided. See the [Base USDC Settlement And Funding guide](domains/base-usdc-settlement-and-funding.md).
- *Expiry of an unused reservation.* The reservation state record says a reservation that expires before the terms are committed, with no prefund attempted, simply expires; the offer selection and the reservation contract apply cancellation, reopening, a block on that borrower and an infraction to any missing prefund at the deadline. Which applies is undecided. See the [Participant Access And Loan Operations guide](domains/participant-access-and-loan-operations.md).
- *Browser-extension wallet in the local demonstration.* Two records require the demonstration's acceptance to prove setup of an installed browser-extension wallet; others describe that external-wallet path as historical evidence that is not the current journey, which pays from the Vault payment account. Whether both proofs are required is undecided. See the [Participant Access And Loan Operations guide](domains/participant-access-and-loan-operations.md).

The [technical architecture record](../system-model/architecture.md) holds the exact boundaries, authority and sources of truth.
