# How the Bitcoin-backed USDC one-loan system works

The system lets one borrower take a USDC loan on the Base network from one selected lender, secured by Bitcoin that only the participants' own keys and Bitcoin's consensus rules can move. The participants authorize fixed routes for their money and collateral in advance, and the operating company never holds a collateral key or the lender's capital. Where a route depends on timing, on another party or on a race between routes, this guide says so.

## What the system is for

A **borrower** wants US dollar liquidity without selling Bitcoin. A **lender** wants to lend USDC, a dollar stablecoin, against that Bitcoin. The system connects exactly one borrower with one selected lender for one loan. It is not a marketplace, a pool or a custodian: the lender publishes a firm offer for one loan, a borrower takes it, and each side keeps control of its own assets and keys throughout.

Several other parties take part without gaining authority over the loan:

- **The organization** runs the product, the application services, the chain observers and the Bitcoin operations. It can pay network fees and submit contract calls whose effect is already fixed, but it has no key in the collateral script and never holds lender capital.
- **Workforce operators** acknowledge incidents, pause automation, request rechecks, choose among already-signed fee levels, export a reviewed fee-bump request and request Base calls whose effect is already fixed. They cannot change a chain fact or a loan's terms.
- **An independent validation service** may act as a conditional fallback, described under [When things go wrong](#when-things-go-wrong). It is selected but not yet available in production.
- **External providers** supply hosting (Cloudflare), sign-in (WorkOS), Base data access and Bitcoin data, fee estimates and transaction relay.

### Two chains that cannot see each other

The loan spans two blockchains. **Base**, an Ethereum layer-2 network, carries the USDC and a loan contract that records funding, acceptance, repayment, claim and refund. **Bitcoin** carries the collateral. Neither chain can read or act on the other, so the system links them with secrets. Each secret is random, and only its hash goes into the agreement. Once a secret is public, it makes a matching pre-signed Bitcoin transaction usable:

- The borrower's secret **X** becomes public on Base when the borrower accepts the funded loan. It completes the transaction that moves the collateral into escrow.
- The lender's secret **Y** becomes public on Base when the lender claims the repayment. It completes the borrower's transaction that returns the collateral.
- A third secret **S** is never revealed on Base. For a loan that commits to the fallback, the independent validation service holds it and may publish it after its own checks, if the lender never claims a valid repayment. It completes the same return transaction as Y.

### Prefund, escrow and pre-signed packages

Before the loan starts, the borrower sends Bitcoin to a **prefund** output, a staging script that the borrower can reclaim after a relative timelock. When the loan activates, a transaction spends the prefund into the **escrow**, the collateral output that the rest of the loan depends on.

Each Bitcoin transaction for the loan's fixed routes is built in advance and signed by the participants in their own **Vault**, a separate browser application that holds each participant's seed, loan keys and secrets, encrypted under a password only the participant knows. The signed transactions, called **packages**, are stored durably so the system can operate them later without a fresh signature. A package fixes its inputs, outputs and destinations; operating it can add a revealed secret or choose among pre-signed fee levels, but it can never change where the Bitcoin goes.

### When a fact counts

The system acts on a Base event only after its block reaches **Base L1 finality**, the stage at which the Base block is irreversibly settled on Ethereum, which takes roughly 20 minutes. Bitcoin lifecycle gates need fresh agreement between two configured sources, and the prefund and escrow gates also need six unchanged confirmations. A transaction that was merely sent, seen or shown in the application is progress, not a fact.

## The domains and their roles

The system is divided into five domains. Each owns one kind of truth or authority, and each has its own guide.

| Domain | Its role |
| --- | --- |
| [Loan Terms And Commitments](domains/loan-terms-and-commitments.md) | Defines the one agreement that every other part refers to: the firm offer, the borrower's reservation, the exact loan terms with their hash, and the separate identity of each deployment environment. It decides meaning, not money movement. |
| [Bitcoin Authorization And Recovery](domains/bitcoin-authorization-and-recovery.md) | Keeps participant control of Bitcoin: keys and secrets in each Vault, the prefund and escrow scripts, the pre-signed packages, fees, relay and Bitcoin observation. It gives the organization no collateral key. |
| [Base USDC Settlement And Funding](domains/base-usdc-settlement-and-funding.md) | Owns the Base loan contract and its per-loan funding and repayment vaults: funding, acceptance, repayment, lender claim and refund, always to fixed recipients. It cannot sign or confirm anything on Bitcoin. |
| [Base Observation And Fallback Review](domains/base-observation-and-fallback-review.md) | Observes Base events and classifies their finality, so the rest of the system acts only on finalized facts, and defines the conditional fallback in which an independent service publishes a per-loan secret after an unclaimed repayment is refunded. |
| [Participant Access And Loan Operations](domains/participant-access-and-loan-operations.md) | Runs the product: accounts, roles and sessions, the durable loan workspace, commands and background jobs, package storage, notifications, payment requests and the isolated local demonstration. It coordinates authorities it does not hold. |

Loan Terms And Commitments supplies the loan identity that all the others consume. Participant Access And Loan Operations presents and records the workflow and hands narrowly bound actions to the participants' Vaults. Bitcoin Authorization And Recovery builds and operates packages from the committed terms, while Base USDC Settlement And Funding moves USDC under its own contract rules. Base Observation And Fallback Review qualifies the Base events on which the workspace and the Bitcoin operations act. The separation matters because each domain can report progress without acquiring another's authority: signing in is not a Vault unlock, an accepted command is not a chain fact, and a Base refund is not a confirmed Bitcoin recovery.

## A loan from start to finish

The following case follows one loan through the normal path. It is illustrative: it shows the order of events and who acts, not every condition.

```figure
caption: Before the money moves. Nothing relies on the prefund until it has six unchanged confirmations.
step: Offer and reservation | The lender publishes a firm offer; a borrower reserves it, creating the loan.
step: Final terms | Both Vaults prepare keys and destinations; the terms are approved, then committed once.
step: Prefund and packages | The borrower stages Bitcoin and signs every package; the lender signs the activations.
step: Funding | The opener opens a funding window; the lender deposits the exact principal.
```

**Offer and reservation.** A lender publishes a firm offer for one loan; publication records the lender's standing approval of the offer's commercial values. A borrower reserves the offer atomically, which creates a random loan identifier and holds the offer for that borrower for 24 hours. Whether the lender must approve again after this point is an open conflict, described under [Choices and open questions](#choices-and-open-questions).

**Final terms.** Each participant's Vault allocates loan-specific keys and prepares public destinations and the hash of its secret. The application assembles one candidate set of terms and its hash. In the detailed terms records, the borrower and the lender each approve that same candidate, and the second matching approval commits it exactly once. Any change to a hashed field invalidates earlier approvals.

**Prefund and packages.** The borrower sends Bitcoin to the prefund address. The system may build and sign packages against the exact prefund before it confirms, but nothing relies on the prefund until it has six unchanged confirmations. The first set of packages contains six activation and six refund candidates, one per pre-signed fee level. The borrower signs all twelve and the lender adds its signature to the six activation candidates. The signed set is verified and stored before the loan can qualify for funding.

**Funding.** The Base contract cannot observe Bitcoin, so a dedicated opener run by the organization opens the loan on Base only after the prefund has six unchanged confirmations, the signed set is stored and at least 67 hours remain before the borrower could reclaim the prefund. That margin covers 24 hours of funding, 24 hours for acceptance and a 19-hour safety buffer. The contract trusts the opener for this Bitcoin qualification; on its own it only rejects a duplicate loan and recomputes the terms. Opening creates a 24-hour funding window and the loan's own funding vault. The lender, and only the lender, decides to fund: it sends USDC to that vault from any wallet it controls. Once the balance covers the principal, anyone may finalize the exact principal before the funding deadline, which starts a 24-hour window for acceptance.

```figure
caption: From acceptance to close. Each handoff between the chains waits for a finalized Base fact or a confirmed Bitcoin fact.
step: Acceptance | The borrower reveals X; the contract pays the principal and creates the repayment vault.
step: Activation | X completes a pre-signed activation; both then sign the exit packages.
step: Repayment and claim | The exact debt is repaid by the deadline; the lender claims it, revealing Y.
step: Collateral return | Y completes the borrower's pre-signed recovery; the loan closes on confirmation.
```

**Acceptance.** Within that window, and only while at least 19 hours remain before the prefund could be refunded, the borrower accepts. The Vault first shows a review of the non-secret facts, then prepares the exact transaction that reveals X, and a second confirmation of those exact bytes authorizes signing and sending. The acceptance call pays the principal to the borrower's fixed recipient, makes X public and creates the loan's repayment vault in one step. This is a Base fact; the collateral is not yet in escrow.

**Activation.** Once acceptance is final on Base, the Bitcoin operations insert X into one pre-signed activation candidate and broadcast it. The loan is *activation pending* until an activation transaction has six unchanged confirmations. The system then builds the 18 exit packages for that actual escrow: six normal recovery transactions that return collateral to the borrower with Y or S, six lender timelock transactions and six borrower long-stop transactions. The borrower signs its twelve, the lender signs its six, and the set is stored before the loan is shown as fully active.

**Repayment, claim and collateral return.** Anyone may send USDC to the repayment vault; paying does not give the payer any role. The exact debt must be finalized no later than the repayment deadline **D**. The lender then claims the repayment before the claim cutoff **C**, two days after D, by revealing Y. The claim pays the lender's fixed recipient once. When the claim is final, the Bitcoin operations add Y to the borrower's pre-signed recovery transaction and broadcast it. The loan is closed when that spend confirms, not when it is sent.

At each step the proof of progress is a finalized contract event or a confirmed Bitcoin spend. The application's status, an email or a transaction hash never stands in for one. The [origination flow](../system-model/behavior/flows/flow-001-origination-preparation-and-qualification.md), the [activation flow](../system-model/behavior/flows/flow-002-activation-completion-and-active-entry.md) and the [normal repayment flow](../system-model/behavior/flows/flow-004-normal-repayment-close.md) hold the exact sequences and their failure routes.

## Identity, authority and sources of truth

### One loan, one meaning

Every record and artifact in every domain refers to the same loan through one canonical set of loan terms and its hash. The terms carry the participant references, amounts, deadlines, the loan-specific Bitcoin public keys, the external destinations, the Base addresses and fixed recipients, and the hashes of X and Y. The architecture record also counts the selected offer revision, the reservation number and, where used, the hash of S as part of that binding, which the field list of the terms does not include; this is one of the [open discrepancies](#open-discrepancies). Any consumer rejects an artifact with the wrong loan, chain, asset, key, destination or version.

A separate **deployment manifest** identifies each environment: its chains, contracts, asset, Bitcoin network, timing policy and upgrade authority. Production uses Base mainnet with Bitcoin mainnet, the test environment uses Base Sepolia with Bitcoin Signet, and the local environment uses a local Base chain with Bitcoin regtest. Keeping loan facts and environment facts apart prevents two consumers from acting on different meanings under the same name.

Several identities look alike but stay separate: a participant's per-loan Bitcoin keys, its Base protocol account for loan calls, the external destinations that receive funds, and an optional Vault payment account used to pay. None silently becomes another.

### Who decides what

| Authority | Held by | What it does not include |
| --- | --- | --- |
| Meaning of the loan | The committed loan terms | Moving money or proving a chain outcome |
| Bitcoin spendability and the final collateral outcome | Bitcoin consensus | Anything a Base record or the application says |
| USDC movement and loan state on Base | The Base contracts, once events are final | Signing, sending or confirming Bitcoin |
| Passwords, seeds, keys and unrevealed secrets | Each participant's Vault | Access through product sign-in |
| The decision to fund | The selected lender | Pooling or automatic use of capital |
| Reporting which Base events are final | The Base observer, under the finality rule | Creating a fact or approving its consequence |
| Publishing the fallback secret | The independent validation service, after its own checks | Judging who deserves the collateral |
| The workflow and its records | The application | Private keys, lender capital or chain truth |

The organization's fee wallets can pay to speed up a stuck Bitcoin transaction or submit a Base call whose effect is already fixed. Neither gives it a say over recipients, amounts, secrets or collateral.

> **Progress is not authority**
> Signing in does not unlock a Vault. An accepted command is not a chain fact. A sent transaction is not a confirmed one. A Base refund does not return Bitcoin. Each of these distinctions is enforced by a different domain, and the guides keep them separate.

## Where it runs and what version 1 claims

All production application parts run on Cloudflare: the product web application, the application programming interface (API) with its D1 database, the Base observer, the Vault as a separate origin and project, and a container for Bitcoin operations. They are separate deployments with separate credentials, but they share one provider failure domain. A required state change and its background job are committed together in D1; a direct wake-up starts the job promptly, and a one-minute scan finds anything missed.

If Cloudflare as a whole is unavailable, the product, Vault, API, observers, Bitcoin automation and operator tools stop together. The chains keep running, but the application accepts no new consequential command and claims no chain result. When service returns, it replays and reconciles both chains before resuming its jobs. Version 1 has no live fallback to another provider and no stated recovery time objective (RTO) or recovery point objective (RPO). Hourly copies of new signed packages and new encrypted Vault versions to separate storage outside Cloudflare protect completed data, not the running service.

The target outcome of this design is a **local demonstration**: a developer starts the system with one command, and two isolated participants complete one loan through normal repayment and confirmed return of the borrower's collateral, using the real product, Vault, API, contracts, observer and Bitcoin operations. The design keeps the claims for each runtime profile separate:

| Profile | What this design claims | What it does not prove |
| --- | --- | --- |
| Local verification | Automated tests with disposable fixtures | A runnable product or any deployment |
| Local demo | A developer can run and resume the complete isolated system | Real providers, testnet or production |
| Testnet, mainnet and production | No deployment or operation claim | Readiness; each needs its own credentials, funding, evidence and approval |

The local demo fails closed before any demo provisioning if a required local setting is missing or conflicting, or points outside its isolated profile, such as at a public network or public credentials.

## When things go wrong

### Before the borrower accepts

If the lender does not fund in time, nothing becomes active: anyone may mark the funding expired and return the funding vault's balance to the lender's fixed settlement recipient. If funding was finalized but the borrower does not accept within 24 hours, anyone may return the principal once to that same recipient. The borrower's prefund becomes refundable after its relative timelock of 259,584 seconds, about three days, and one of the pre-signed refund candidates is sent.

If the 24-hour reservation ends with no valid prefund, the reservation is cancelled, the offer reopens and that borrower is blocked from that offer with one recorded infraction. The records disagree on whether this also applies when the reservation ends before the terms are committed; see the [open discrepancies](#open-discrepancies). A valid prefund that stays unconfirmed for 72 hours goes to manual review instead of being cancelled.

### After acceptance, before full activation

Once X is public, activation must complete with the same selected transaction: the system cannot refund the prefund, pay the principal again or build a replacement. If a different pre-signed activation candidate confirms instead, that one becomes the escrow on which every exit package is built. If the exit packages are not yet fully signed, the loan stays in an explicit pending state while recovery work continues; nothing undoes the principal payment or the escrow.

### When the borrower does not repay

If no exact repayment is finalized by D, the loan qualifies as an ordinary default for product purposes. That classification does not move Bitcoin. Once Bitcoin's median time past (MTP), the consensus clock, is strictly later than **T**, three days after D, the lender may export its pre-signed timelock transaction and broadcast it with its own tools. The organization does not broadcast it automatically.

### When the lender does not claim a valid repayment

If the borrower repaid in time but the lender does not reveal Y before C, the lender loses the Base claim permanently. Anyone may then refund the exact repayment to the borrower's refund recipient, which is frozen at C; before C the borrower may switch it once to its own Base protocol account. The refund returns the USDC, but by itself it does not return the Bitcoin.

For a loan that committed to the fallback, the independent validation service checks the exact finalized refund event and then publishes S. The Bitcoin operations check S, insert it into the same pre-signed recovery transaction that Y would have completed and broadcast it. That recovery is final only when it confirms on Bitcoin. Until then, and in every loan without S, the other routes stay open: the lender's timelock route becomes valid once MTP is strictly later than T, and the borrower's long-stop route once MTP passes **B**, ten days after D, without cancelling the lender's route. Whichever spend confirms first wins. This is a residual risk for a borrower who repaid, not a default.

### Chain and provider failures

- **Reorganizations.** A displaced Base event is kept as non-canonical evidence and the observer replays from the last common finalized block. On Bitcoin, a changed or lost parent transaction invalidates its pre-signed descendants, while a reorganization that keeps the same parent pauses reliance on it until it requalifies.
- **Disagreeing sources.** If both Base providers are unavailable or disagree, existing finalized information stays visible but new actions that depend on Base stop. Bitcoin gates stop whenever the two required sources disagree or are both unavailable.
- **Ambiguous sends.** A relay timeout does not prove that a transaction was not sent; the system reconciles the exact attempt before retrying, and never sends a different transaction instead.
- **Fees too low.** A stuck Bitcoin transaction can be accelerated by a separately funded child transaction from the organization's fee wallet, through a manual operator process that does not touch the signed transaction.

### Compromise and lost access

The security records analyze what each compromised capability can do in each loan state, with particular attention to combinations, such as a malicious frontend together with one participant's unlocked Vault, that are more dangerous than any single leak. A forgotten Vault password cannot be recovered through product sign-in or support; stronger Vault recovery is deferred.

What the system cannot guarantee: an exact waiting time for any chain step, availability during a Cloudflare-wide outage, or return of the collateral after a valid repayment that the lender never claims, unless the fallback is in force, S is published and the recovery confirms first.

## Choices and open questions

### Recorded choices

- **Base L1 finality as the single gate** for every consequential Base fact. The recorded reason is one uniform, safety-first rule for funding, secret disclosure, repayment and refund, accepting roughly 20 minutes of delay per cross-chain handoff.
- **One ownerless funding vault and one repayment vault per loan.** Every ordinary USDC transfer then has one unambiguous destination, no platform key decides where funds move, and any wallet can repay without approving the loan contract.
- **A governed, upgradeable loan contract.** The main contract sits behind an upgradeable proxy with one ownership path: a single upgrade key for local and test use and the intentionally short public mainnet beta, then a two-of-three multi-signature Safe acting through a seven-day timelock for the rest of version 1. Every upgrade is published and checked for compatibility first. Existing loans are never migrated to another contract, but an approved upgrade becomes the code for every loan the proxy holds. The selected governance has no on-chain pause: in an incident the organization can stop its own frontend, API and opener, but valid direct contract calls, including every exit, remain available. The recorded reason is a repair route for the early beta; an immutable contract is deferred.
- **Pre-signed fixed fee levels** of 10, 20, 50, 100, 150 and 200 satoshis per virtual byte (sat/vB). Fees must be fixed because the transactions are signed before use; the system picks the lowest level strictly above 1.25 times a fresh estimate.
- **A separate deployment manifest per environment**, because separately maintained configurations could allow a cross-domain mismatch that is hard to detect after funds move.
- **One contracted independent validation service** for the lender-silence fallback. It holds no Bitcoin key or destination control, but its secret could still be disclosed early, withheld, lost or compromised, so its production use is gated by counsel approval and implementation evidence.

### Open conflicts

These conflicts exist between the technical records. This guide does not resolve them.

- **Second lender approval.** The architecture record, the offer and reservation contract, the offer selection and the user-approved offer ticket say publication is the lender's standing acceptance and that reservation creates the loan without a second lender approval; the ticket excludes a second commercial approval. The responsibility, the offer and terms state records, the terms binding contract and the origination flow say publication approves only the commercial values and require both participants to approve the exact final terms. No record decides whether that final approval is the excluded second approval. The [Loan Terms And Commitments guide](domains/loan-terms-and-commitments.md#open-excluded-and-deferred) explains both readings.
- **No qualifying fee level.** One part of the [fee selection contract](../system-model/contracts/interfaces/iface-007-bitcoin-fee-estimate-and-tier-selection.md) and its implementation ticket select the highest level, 200 sat/vB, with an alert when no level is high enough; another part of the same contract and a former decision say the selection fails and picks nothing. The [Bitcoin Authorization And Recovery guide](domains/bitcoin-authorization-and-recovery.md#open-excluded-and-deferred) describes both.
- **Number of exit packages.** One sentence in the [package construction responsibility](../system-model/domains/bitcoin-authorization-and-recovery/responsibilities/sr-002-bitcoin-prefund-escrow-and-package-construction.md) still calls the exit phase a twelve-package phase; the rest of that record and the flow, state, invariant and timing records specify eighteen. The stale sentence awaits a separate repair.

### Open discrepancies

These descriptions differ between records and are not reconciled. The domain guides state each one where it applies.

- **What the terms contain.** The architecture and responsibility records include the offer revision, the reservation number and the hash of S in the loan binding; the terms field contract does not, and it describes random per-loan participant references where the offer selection binds the actual account identifiers. See the [Loan Terms And Commitments guide](domains/loan-terms-and-commitments.md#open-excluded-and-deferred).
- **A reservation that ends before commitment.** The offer state record lets an unused reservation simply expire before the terms are committed, while the offer selection and the reservation contract cancel it and record an infraction whenever no valid prefund is visible at the deadline. See the [Loan Terms And Commitments guide](domains/loan-terms-and-commitments.md#exceptions-and-recovery).
- **Who may reveal X and Y.** The contract interface accepts acceptance or claim from any caller with the exact secret, while the participant-call contract treats a reveal from any account other than the participant's term-bound protocol account as invalid. See the [Base USDC Settlement And Funding guide](domains/base-usdc-settlement-and-funding.md#open-excluded-and-deferred).
- **Pause and the beta upgrade key.** The upgrade selection and the settlement records say version 1 has no on-chain pause, while the deployment state record lists pause roles and a paused state without saying whether they are on-chain; the upgrade invariant and that state record also omit the single-key beta period. See the [Base USDC Settlement And Funding guide](domains/base-usdc-settlement-and-funding.md#open-excluded-and-deferred).

### Excluded, deferred and bounded

Version 1 defers these capabilities, each with its own condition for revisiting:

- automatic broadcast of the lender's default transaction by the organization, and any institutional last-resort collateral recovery;
- any company-held or delegated way to accept or activate when the borrower does not accept funded principal; funding then expires and the prefund is refunded;
- protection or put-option operations;
- complete cooperative settlement operations with Base accounting, although participants can already sign a cooperative spend;
- stronger Vault recovery and an immutable loan contract;
- platform-paid Base calls that reveal secrets, and replacement of the selected sign-in provider with application-owned authentication.

Version 1 excludes outright:

- public or multi-lender matching, pooled capital, custody and automatic capital deployment;
- Bitcoin liquidation, automated surplus return and shortfall enforcement;
- marketing, pricing and positioning, and legal and regulatory analysis.

Two areas are in scope only within stated bounds. The user-interface specification and prototype are a presentation contract; application implementation, production visual review and user testing are outside this package. Runtime claims stop at local verification and the local demo; any testnet, mainnet or production deployment needs its own gates.

The [technical architecture record](../system-model/architecture.md) holds the exact boundaries and sources of truth.
