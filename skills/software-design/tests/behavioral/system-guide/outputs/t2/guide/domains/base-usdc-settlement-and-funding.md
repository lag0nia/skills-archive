# Base USDC Settlement And Funding

This domain runs the dollar side of each loan: it keeps the one authoritative on-chain record of the loan and moves USD Coin (USDC) only in exact amounts, by fixed deadlines, to recipients fixed in the approved terms. That matters because funding, repayment, the lender's claim and every refund must behave the same way whoever sends the money or calls the contract; the [architecture guide](../architecture.md) shows how this side fits with the Bitcoin collateral.

## What this domain is responsible for

**Base** is the blockchain network where the loan contract, its per-loan vaults and USDC, a dollar-denominated token, live. It is a layer-2 network whose blocks become irreversible once Ethereum, the underlying layer-1 chain, finalizes them, roughly 20 minutes later. The system acts on a Base event only after that point, and the [Base Observation And Fallback Review](./base-observation-and-fallback-review.md) domain, not this one, decides when an event has reached it.

Each loan has one borrower and one **selected lender**, the lender whose published offer the borrower reserved. The collateral is Bitcoin, governed by its own chain rules in the [Bitcoin Authorization And Recovery](./bitcoin-authorization-and-recovery.md) domain. A Base action can make public a secret that lets an already-signed Bitcoin transaction be completed, but nothing on Base can sign, broadcast or confirm a Bitcoin transaction.

A few terms recur:

- The **main contract** keeps one record per loan: amounts, deadlines, fixed recipients, commitments to the secrets and current state.
- A **funding vault** is a small contract deployed for one loan to receive the lender's principal; a **repayment vault**, created when the borrower accepts, receives the debt. Anyone can send USDC to either, and neither has an owner, administrator or upgrade path. Neither is a participant's **Vault**, the separate client that holds that participant's keys and secrets.
- **Fixed recipients** come from the approved terms: the borrower's principal recipient; the lender's settlement recipient, which receives the claim and every funding-side refund; and the borrower's repayment-refund recipient, which starts as the principal recipient.
- **Payer-neutral** means that sending USDC to a vault gives the sender no loan role, no say over any recipient and no refund right.
- A **permissionless call** is one any account may submit; the caller pays the fee but chooses nothing about amount, recipient or effect.
- X is the borrower's secret, and revealing it accepts the loan; Y is the lender's secret, and revealing it claims the repayment. Until then the contract holds only commitments to them. Each participant reveals through a **protocol EOA**: an externally owned account (EOA), meaning an ordinary key-controlled account, that their Vault derives and the terms commit to.

## How its two responsibilities divide the work

[Base loan state and USDC settlement](../../system-model/domains/base-usdc-settlement-and-funding/responsibilities/sr-003-base-loan-state-and-usdc-settlement.md) is the contract side. It owns the main contract and both vaults: every state, deadline, exact amount and fixed recipient, one named call per transition, and the events and errors those calls emit. Any invalid call reverts with a named error, emits no success event and moves nothing. The [complete list of calls, events and errors](../../system-model/contracts/interfaces/iface-009-base-transition-api-events-and-errors.md) stays with the contract record.

[Lender-controlled funding-vault interaction](../../system-model/domains/base-usdc-settlement-and-funding/responsibilities/sr-005-lender-controlled-funding-vault-interaction.md) is the lender-facing side. Once the funding vault exists, it shows the lender the verified chain, asset, loan, remaining principal, deadline and settlement recipient, and it leaves to the lender whether, when and from which wallet or treasury to send capital. It shows the provisional balance and coordinates finalization, but never holds, pools, substitutes or automatically draws lender capital, and never signs for the lender.

The two meet at the funding vault: one brings the lender's transfers there, the other decides when they count. Around them:

- [Loan Terms And Commitments](./loan-terms-and-commitments.md) supplies the canonical terms and deployment identity the contract checks when a loan opens.
- Bitcoin Authorization And Recovery qualifies the borrower's Bitcoin prefund before a funding window may open.
- The participants' own Vaults sign acceptance, the claim and the recipient switch locally; this domain never sees X or Y before they are revealed.
- [Participant Access And Loan Operations](./participant-access-and-loan-operations.md) runs the workspace and the application worker that normally submits permissionless calls, paying fees from the organization's fee wallet.
- Base Observation And Fallback Review receives the contract's named events and classifies their finality; a finalized public X or Y then lets Bitcoin Authorization And Recovery complete its already-authorized transaction.

## What a normal loan looks like on Base

```figure
caption: The loan changes only when a named contract action succeeds and becomes final; a transfer or balance alone never changes it.
step: Open | The opener's call creates the loan record and funding vault; a 24-hour funding window starts.
step: Fund | The lender sends USDC; finalization moves exactly the principal into the main contract.
step: Accept | The borrower reveals X; principal goes to the borrower and the repayment vault appears.
step: Repay | Anyone sends USDC; finalization moves exactly the debt no later than D.
step: Claim | The lender reveals Y before C; the debt goes to the lender's settlement recipient.
optional: Refund | Only if no claim happens before C: anyone triggers the one refund to the borrower's frozen recipient.
```

In an illustrative loan (example amounts, not approved values), the principal is 10,000 USDC and the debt 10,300 USDC. Once the borrower's Bitcoin prefund qualifies, the organization's dedicated opener account calls the main contract, which creates the record and deploys the funding vault. The lender sends 6,000 USDC and later 4,000 USDC from its treasury; the transfers add up but stay provisional. Before the funding deadline, any caller, normally the application worker, finalizes funding: exactly 10,000 USDC moves into the main contract, any excess stays for the lender, **FundingFinalized** is emitted and the 24-hour acceptance window starts.

The borrower's Vault prepares the acceptance call (acceptX) containing X and signs it only after the borrower confirms the exact transaction. In one indivisible step the contract creates the repayment vault, pays exactly the principal to the borrower's principal recipient and makes X public; if any part fails, nothing happens. This is not Bitcoin activation: the collateral counts as active only after the Bitcoin escrow confirms.

Before showing the repayment vault, the product asks the borrower to confirm the current refund recipient or use the one permitted switch. Anyone may then pay from any wallet; the guided transfer closes one hour before D so that finalization has time. Once the vault holds at least 10,300 USDC, any caller can finalize, no later than D: the contract moves exactly the debt and emits **Repaid**. A sufficient balance is necessary but is not valid repayment; only exact-debt finalization made no later than D, recorded by a Repaid event that has become final, counts.

Strictly before C, the lender's Vault reveals Y through the claim call (releaseWithY). The contract pays the debt once to the lender's settlement recipient, and the now-public Y lets Bitcoin Authorization And Recovery complete the borrower's already-signed recovery transaction; the loan closes only when that transaction confirms on Bitcoin.

| Moment | When | What it changes |
| --- | --- | --- |
| Funding deadline | 24 hours after the window opens | Funding can no longer be finalized; the balance becomes refundable to the lender's settlement recipient. |
| Acceptance deadline | 24 hours after funding is finalized | X can no longer be accepted; the principal becomes refundable to the lender's settlement recipient. |
| D | The repayment deadline in the terms | Last moment to finalize exact repayment. |
| C | D + 172,800 seconds (two days) | The claim ends permanently, the refund recipient freezes and an unclaimed valid repayment becomes refundable. |
| T | D + 259,200 seconds (three days) | A Bitcoin rule, not a Base one: the lender's pre-signed Bitcoin default route can become valid. |

## What happens when funding or acceptance does not complete

If funding is not finalized by its deadline, anyone can close the attempt and send the vault's whole USDC balance to the lender's settlement recipient. If the borrower does not accept within 24 hours of funding, anyone can refund exactly the principal to the same recipient. Excess or later-arriving USDC stays sweepable there indefinitely; tokens other than the configured USDC have no recovery route.

The borrower's Bitcoin prefund is recovered separately under Bitcoin rules. Once X is public this unwind is no longer possible, and Bitcoin Authorization And Recovery continues activation instead.

## What happens when repayment is late or the lender does not claim

If exact debt is not finalized by D, there is no valid repayment, whatever the vault holds. Anyone can sweep the vault's USDC to the borrower's current refund recipient, but that does not cure the missed repayment; what follows for the collateral is decided by Bitcoin rules.

If repayment was valid but the lender has not claimed before C, the claim is permanently disabled, the refund recipient freezes, and anyone can trigger the refund of exactly the debt, once, to that frozen recipient. The application worker schedules it and the organization's fee wallet normally pays for it, but any account may call first, and the right never expires. Claim and refund exclude each other: lender and borrower can never both receive the repayment.

Before C, the borrower's protocol EOA may make one irreversible switch of the refund recipient, from the original borrower recipient to itself, for example when the borrower worries about access to the original wallet. No other address can be chosen, and payers never influence it.

The finalized **UnclaimedRepaymentRefunded** event is the only Base fact that may trigger the conditional fallback, in which a fallback service in Base Observation And Fallback Review publishes a third secret, S, so the borrower can complete Bitcoin recovery. The fallback covers only loans created after its production activation gate with a committed S, and the Base refund never depends on it. Lender silence, a missing Y, elapsed time or a raw transfer is not the trigger.

> **A Base refund is not a Bitcoin recovery**
> The refund returns the borrower's USDC, but the collateral stays in Bitcoin escrow until a Bitcoin route confirms. Bitcoin cannot see Base, so without the fallback the lender's default route can still become valid after T. The design records this as a [residual risk](../../system-model/contracts/invariants/inv-025-missing-y-residual-lender-risk.md); the lender can never also collect the refunded USDC.

A call with an unknown outcome is reconciled against the chain before any retry; a submitted transaction or worker result is never itself a transition.

## Who decides what

The main contract alone decides transitions, amounts, recipients and deadlines, under the terms fixed when the loan opened. Only the selected lender decides whether and from where to fund; the borrower decides acceptance and the recipient switch; the lender decides the claim. Submitting a permissionless call grants nothing beyond paying its fee.

Other actors have deliberately narrow powers:

- The **opener** may only open a funding window for a qualified loan. A thief holding only its key could create junk records under invented loan identifiers, but the application treats records missing from its committed registry as unrecognized and never turns them into product loans.
- The organization's **fee wallet** and **workforce operators** can trigger only already-fixed operations; neither can change an amount, recipient, call effect or authoritative outcome.
- A participant's **Vault payment account**, shown only once the participant can recover it, is just one eligible payer. It changes no existing recipient or historical terms; a new loan can name it as a recipient only through normal term approvals.

This domain must not sign or confirm Bitcoin transactions, declare collateral active, classify Base finality, author terms, hold participant secrets, or read lender silence as default.

The vaults are immutable, but the main contract is upgradeable, so the claim that the organization cannot redirect Base funds is only as strong as its [upgrade administration](../../system-model/contracts/security/sec-017-base-upgrade-administrator-or-operational-signer-compromise.md): one governance compromise could become authority to redirect or lock USDC across the system.

## Choices and their reasons

- **Deployed per-loan vaults.** Any wallet or treasury can fund or repay with an ordinary transfer to an unambiguous destination, without contract calls or token allowances, and no platform key chooses where money moves. An address predicted before deployment could strand funds, and a shared deposit address would need off-chain attribution. The approver, the person who reviewed and approved the design, specified that lenders can send from any wallet with a normal transfer ([funding vault selection](../../build/records/selections/sel-021-immutable-per-loan-funding-vault.md)).
- **Repayment vault created at acceptance.** This spends nothing on attempts that are never accepted and avoids a later deployment race; it stays a separate contract type because its recovery policy differs. In neither vault can excess block finalization, and a generic rescue for other tokens was deliberately excluded ([repayment vault selection](../../build/records/selections/sel-022-immutable-per-loan-repayment-vault.md)).
- **A two-day claim window, then a permanent refund.** The approver rejected keeping repaid USDC claimable indefinitely, judging USDC left in the contract to be the greater danger, and set 48 hours for the claim. T sits a day later so the latest normal reveal of Y still leaves a nominal 24 hours for the borrower's Bitcoin recovery ([claim cutoff rules](../../system-model/contracts/states/state-013-repayment-refund-recipient-and-claim-cutoff.md)).
- **An upgradeable main contract.** A transparent proxy keeps one address while its code can be replaced. Upgrades need a 2-of-3 Safe multisignature account, publicly published code, an automated compatibility check and a public seven-day delay. The recorded reason is a governed repair route during the early beta; the approver wanted upgradeability until the system proves stable. An approved upgrade becomes the code for every loan the contract holds, and loans are never moved to another deployment ([upgrade governance selection](../../build/records/selections/sel-009-base-contract-upgrade-governance.md)).
- **No on-chain pause.** At the approver's direction, an incident stops the organization's frontend, API and opener service instead. That cannot block valid direct calls, so existing loans keep their funding, repayment, claim and refund paths; a lost or compromised opener is replaced only through the delayed upgrade path.

## What is open, excluded or deferred

- **Cooperative settlement accounting is deferred.** Both parties can authorize a cooperative Bitcoin spend, but how Base accounts for it is not designed, so the product must not claim it closes the Base ledger ([cooperative settlement scope](../../system-model/contracts/scope/scope-005-cooperative-settlement-operations.md)).
- **Immutability is deferred.** The first version (V1) keeps upgrade authority; renouncing it, and keeping an opener working afterwards, needs a later design ([immutable conversion scope](../../system-model/contracts/scope/scope-007-immutable-base-contract-conversion.md)).
- **Paid reveals are deferred.** As the approver required, participants sign acceptance and claim themselves; the organization may send a protocol EOA a bounded one-time fee amount, and self-funding is always allowed. A platform relayer or fee sponsor is not in V1 ([platform-paid reveal scope](../../system-model/contracts/scope/scope-014-platform-paid-base-reveal-execution.md)), and production fee funding for Vault payment accounts is outside the current target.
- **Excluded:** public or multi-lender matching, pooled capital, custody and automatic capital deployment ([capital scope](../../system-model/contracts/scope/scope-011-public-multi-lender-pooling-custody-and-automatic-capital.md)), and Bitcoin liquidation ([liquidation scope](../../system-model/contracts/scope/scope-012-bitcoin-liquidation-surplus-and-shortfall.md)).
- **Two disagreements between records remain open.** The upgrade governance selection says V1 has no on-chain pause, while the [deployment state record](../../system-model/contracts/states/state-019-base-deployment-upgrade-and-opener.md) still lists a narrow paused state for an operational role. The same selection lets one dedicated key hold upgrade ownership during local testing and a short public mainnet beta before ownership moves to the Safe, while the deployment state record treats an unrestricted unilateral upgrade key as invalid.

The [domain record](../../system-model/domains/base-usdc-settlement-and-funding/domain.md) lists exactly what the domain owns and excludes.
