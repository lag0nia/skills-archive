# How the Bitcoin-backed USDC one-loan system works

The system coordinates a loan of USD Coin (USDC) on Base between one borrower and one selected lender, secured by bitcoin. Participants retain their own keys and control of capital. The product coordinates fixed, participant-authorized transactions; it does not hold a collateral key or lender funds.

## Purpose and the two-chain challenge

The intended journey is straightforward: the borrower pledges bitcoin, receives USDC, repays, and recovers the bitcoin. The difficulty is that Base and Bitcoin cannot inspect each other's state. Paying on Base cannot itself release bitcoin, and a Bitcoin transaction cannot prove that the borrower repaid on Base.

The design bridges that separation using transactions signed in advance for fixed destinations, secrets disclosed at specific steps, and independently verified chain evidence. This makes narrowly authorized actions possible across the chains, but does not make them atomic. Two consequences matter throughout: the lender can pay before Bitcoin collateral becomes active, and valid repayment does not guarantee the borrower recovers the collateral.

### Participants and control

The **borrower** stages bitcoin, deliberately accepts the principal and repays the exact debt. The **selected lender** publishes a firm offer for one loan and separately approves funding from a wallet or treasury they control. The application cannot pool or automatically deploy lender capital.

Each participant uses a **Vault**, a dedicated browser application that decrypts their encrypted data and signs locally. Its password, seed, loan keys and unrevealed secrets remain within that participant's private boundary. Product login permits authorized access to encrypted data; it does not unlock the Vault, approve a transaction or recover a lost secret. A handoff from the product is only an expiring pointer to a bounded Vault action.

The **organization** runs the product, its services and automation. It may help execute already authorized transactions or pay permitted transaction fees, but cannot choose a new payout destination or sign for a participant. Its fee wallets remain separate from participant keys and lender capital. Base contract upgrade authority is a separate, material trust boundary whose governance remains unresolved.

An independent **evidence-conditioned validation service**, abbreviated ECVS, is a selected fallback design for one specific unclaimed-repayment case. It has no Bitcoin key. Its production use still requires counsel approval and implementation evidence; it must not be presented as currently available.

### The five domains

| Domain | Contribution |
| --- | --- |
| [Loan Terms And Commitments](domains/loan-terms-and-commitments.md) | Gives every artifact the same immutable loan meaning: participants, amounts, deadlines, keys, recipients and secret commitments. |
| [Bitcoin Authorization And Recovery](domains/bitcoin-authorization-and-recovery.md) | Protects participant keys and prepares, validates and operates the fixed collateral routes under Bitcoin's rules. |
| [Base USDC Settlement And Funding](domains/base-usdc-settlement-and-funding.md) | Controls funding, acceptance, exact repayment, lender claim and fixed-recipient refunds on Base. |
| [Base Observation And Fallback Review](domains/base-observation-and-fallback-review.md) | Establishes which Base events are final and defines the independent, conditional fallback review. |
| [Participant Access And Loan Operations](domains/participant-access-and-loan-operations.md) | Provides accounts, the durable loan workspace, Vault handoffs, package storage, coordination and the isolated local demonstration. |

The domains share one committed loan identity. A separate deployment identity binds the approved networks, contracts, asset and policies. A mismatched loan, key, recipient or environment is rejected. These records identify what an action concerns; they do not themselves authorize signing, spending or a chain-state change. The workspace coordinates the domains and reports their evidence without replacing it.

## One normal loan journey

Ana borrows and Leo lends in this illustrative case. The figure shows the intended sequence; the final-approval step and the set of terminal recovery packages remain open as described below.

```figure
caption: Base pays before Bitcoin activation completes. Recovery finishes only when the Bitcoin spend confirms.
step: Agree and stage | Ana reserves Leo's offer and stages bitcoin; the final-approval rule remains open.
step: Fund and accept | Leo funds; Ana's Vault reveals her acceptance secret and Base pays her principal.
step: Activate and protect | Automation activates the escrow; each participant signs their own terminal routes. The long-stop package set remains open.
step: Repay and recover | Ana repays; Leo claims and reveals his secret; automation completes Ana's signed Bitcoin recovery.
```

### Agreement and collateral preparation

Ana reserves Leo's offer for one day, during which she must produce a valid **prefund**: bitcoin staged before the loan's escrow exists. The reservation creates a stable loan identity. Whether Leo must separately approve the final terms after reservation is unresolved; reservation must not be described as granting signing or capital authority.

Each Vault prepares a fresh loan key, payout destinations and a secret commitment. Ana's acceptance secret is called **X**; Leo's later claim secret is **Y**. Public keys and hashes can leave the Vault, but the unrevealed secrets cannot. The resulting committed terms bind the actions that follow.

For the observed prefund, the system prepares fixed activation and borrower-refund transactions in several fee variants. Ana signs both families and Leo adds his signature to the activation family. The signed packages are stored in the primary archive and their receipt validated before funding can proceed. A scheduled encrypted backup outside the main provider follows; a delayed backup raises an alert but does not block the loan.

Preparing transactions against an unconfirmed prefund is allowed. Relying on that prefund for funding requires six unchanged confirmations, fresh agreement between Bitcoin observers and enough remaining time before its refund route matures. Staging bitcoin is not yet active collateral.

### Funding, acceptance and activation

The Base contract opens a funding window with an immutable vault dedicated to this loan. After explicit approval, Leo transfers USDC to it. Anyone may finalize sufficient deposits, taking exactly the principal. The transfer alone is provisional; the funding event must become final before it supports the next step. The transfer's sender gains no loan role or destination control.

Ana accepts in her Vault through two confirmations: first a review of nonsecret preparation, then approval of the exact transaction prepared after narrowly unlocking the required secret and key. Only the second confirmation authorizes signing and submission. Failure or cancellation clears the plaintext. Acceptance is permitted only within the funding lifetime and with sufficient time left before the prefund refund matures.

Base acceptance pays the principal to Ana's fixed recipient, registers a separate repayment vault and reveals X. Once X is final on Base, automation completes and broadcasts one previously signed activation transaction. The escrow exists only after the actual activation winner reaches six Bitcoin confirmations.

**During this gap Leo is exposed.** If Ana's prefund-refund transaction matures and confirms first, Ana retains the principal and recovers her bitcoin, leaving Leo unsecured. The application cannot call the loan active merely because Base paid.

Once the escrow is confirmed, each participant signs their own terminal recovery routes for that exact output. Whether the package set includes the borrower's long-stop route remains open. Until the required signatures and archive receipt exist, the loan remains terminal-signing-pending; that status cannot reverse the already paid principal or confirmed escrow.

### Repayment and normal recovery

The exact debt must be finalized on Base by the repayment deadline. Anyone may transfer the repayment; paying does not acquire a role, refund right or control of a recipient. Leo then has until two days after that deadline to claim, strictly before the cutoff.

The claim uses fresh authentication and the Vault's two-confirmation review and signing sequence, clearing plaintext on failure or cancellation. Whether multi-factor authentication is always required or required only for enrolled participants is unresolved. Successful claim pays the exact debt once to Leo's fixed recipient and reveals Y.

Once Y is final on Base, automation inserts it into Ana's already signed recovery transaction. No fresh signature or changed destination is needed. The loan's Bitcoin outcome completes only when that spend confirms; publication of Y or a broadcast response is not recovery.

## Trust boundaries and failure cases

### Evidence permits a step; it does not perform it

Consequential Base handoffs wait for **layer-1 finality**, the settlement boundary on Ethereum. An earlier event can be displayed as provisional but cannot advance the lifecycle or trigger a Bitcoin action. One healthy configured Base provider is sufficient; conflicting sources or loss of both block new dependent actions while preserving finalized history for replay.

Bitcoin gates instead require fresh agreement between independent observers. Disagreement stops the affected automation without a manual override. Bitcoin consensus determines valid signatures, timelock maturity and which spend wins. Application clocks, raw token balances and relay responses cannot substitute for those facts.

### An attempt stops before acceptance

If funding or acceptance expires before X is final, the chains unwind separately. Principal, excess and late USDC follow fixed lender-recipient refund paths. Ana's prefund refund requires its matured timelock, an unchanged unspent prefund, observer agreement and no accepted X on Base. The organization cannot reveal X for her or force acceptance.

After X is final, application-driven prefund unwind is forbidden. Recovery pursues the same selected activation, without paying principal again or inventing an unsigned replacement. The previously signed refund can nevertheless win the Bitcoin race described above; application policy cannot revoke it.

### The borrower repays but the lender does not claim

At the claim cutoff, Base permanently disables Leo's claim and freezes Ana's refund recipient. Before the cutoff, Ana's committed protocol account may irreversibly switch that recipient to itself. Anyone can then trigger the exact debt's fixed-recipient refund; delayed automation does not expire the right. Once refunded, Leo cannot also collect that USDC.

The refund is independent of the ECVS and does not unlock bitcoin. The fallback is eligible only for a loan created after production activation of that service, with its per-loan secret hash committed before the escrow was constructed. Existing loans without that commitment cannot acquire it later. For an eligible loan, the service independently verifies the exact finalized unclaimed-repayment refund, then publishes its matching secret **S**. Missing Y, elapsed time or an application assertion is insufficient. S completes the same fixed borrower-recovery transaction as Y, and recovery still requires confirmation.

That fallback is currently unavailable. If the service later becomes unavailable or cannot publish S, the Base refund remains valid while recovery through S remains unavailable. Even a correctly operating service is not a collateral guarantee: Leo's signed Bitcoin route becomes valid three days after the repayment deadline and can win first, including after valid repayment. Anyone holding that package can broadcast it, but its payout remains fixed to Leo.

A borrower long-stop route would mature ten days after the repayment deadline without Y or S, racing the still-valid lender route. Whether it exists for every loan is unresolved. Mutual cooperative settlement is another authorized Bitcoin route until a terminal spend confirms, but its complete product and Base accounting operation is deferred.

### The borrower does not repay

Ordinary default means no exact repayment finalized by the deadline. Lender silence, unavailable observers or a missing secret are not substitutes for that condition; conflicting evidence blocks classification. Leo's Bitcoin route still waits for consensus-time maturity. This version leaves export and broadcast to Leo after fresh authentication; the organization does not automatically broadcast default packages. A confirmed spend, not the application's label, determines the collateral outcome.

### Provider outage and loss of access

The selected production topology puts the product, Vault, application service and database, observer and Bitcoin automation on Cloudflare. Separate origins, credentials and releases limit some failures, but a provider-wide outage can suspend them together. The chains continue. New consequential application commands stop, and service recovery must reconcile both chains before resuming pending work.

There is no live alternative provider or promised recovery time or recovery point. Off-provider encrypted archive backups protect already backed-up signed packages; they do not supply a running service, and the newest package set remains exposed until backed up. Delayed automation after a secret becomes public can worsen a collateral race.

Product-account recovery, support and ciphertext backups cannot recover a forgotten Vault password or its plaintext secrets. That limitation remains even when the application itself is healthy.

### Compromise and fixed authority

A stolen signed package cannot redirect a payout, but its holder can force the fixed route once its secret or timelock condition is available. Account takeover alone does not decrypt a Vault, although stolen ciphertext enables an offline password attack. Malicious frontend code is a more dangerous shared threat: if it captures both participants' keys, it can use the cooperative route to steal collateral.

Base administration is also consequential. An upgrade that could alter funded loans could redirect or lock USDC. The upgrade-control and on-chain-pause decisions remain unresolved, so fixed-recipient behavior must not be mistaken for a claim that the main contract is immutable. The per-loan funding and repayment vaults are immutable.

## Current limitations

The target is a developer-operated local demonstration of one normal loan using the real product and protocol components with isolated participants and local chains. The records do not establish a completed runnable demonstration, public deployment or activated production operation. Local test evidence would not establish those later capabilities.

Participant payment accounts are a selected design with unconfirmed delivery status. They remain separate from protocol callers, loan keys and historical recipients. The architecture does not rely on their availability to grant capital or settlement authority.

This version excludes liquidation, surplus distribution and shortfall enforcement, public or multi-lender matching, pooled capital, product custody and automatic deployment of lender capital. Stronger forgotten-password recovery, automatic organization default broadcast and complete cooperative-settlement operations remain deferred.

## Open questions

These are design uncertainties, not choices made by this guide. Domain guides provide greater depth; detailed attribution and reconciliation remain in technical records.

- **Final agreement:** publication and reservation are described as sufficient standing lender approval in some records; others require both roles to approve the same final candidate. Whether a second lender approval is required remains open.
- **Borrower protection:** some records require a long-stop in every new escrow, while others say a loan without activated fallback has no borrower fallback Bitcoin route. The related terminal-package records disagree between twelve and eighteen signed variants. Neither protection nor package completeness should be assumed from one side alone.
- **Fee exhaustion:** when no signed fee tier qualifies, the records disagree between using the largest tier with an alert and failing closed without selecting a transaction.
- **Base governance and pause:** some records require a two-of-three multisignature authority and seven-day timelock; another permits a single upgrade key for local/test and a short mainnet beta. Records also differ on whether pause means an application stop or an on-chain power.
- **Authentication:** the identity-state contract makes MFA optional to enroll in and mandatory for enrolled participants' sensitive actions; the repayment flow lists fresh reauthentication/MFA as a claim prerequisite without that qualification. Universal MFA must not be asserted until the requirements are reconciled.
- **Agreement identity and capability status:** records differ on whether offer revision and reservation identity belong inside the immutable terms value or in its separate binding contract. Payment-account records also leave implementation and verification status unsettled.

The [technical architecture record](../system-model/architecture.md) holds the exact boundaries and source records. The five domain guides above explain each part in greater depth.
