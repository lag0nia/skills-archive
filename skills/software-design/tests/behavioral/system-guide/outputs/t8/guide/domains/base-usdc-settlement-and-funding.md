# Base USDC Settlement And Funding

This domain owns what happens to USDC on Base: one authoritative contract record per loan and fixed rules for funding, the borrower's acceptance, repayment, the lender's claim and every refund. It matters because these rules move real money to fixed recipients, while the Bitcoin collateral stays under a separate chain's authority. The [architecture guide](../architecture.md) shows where the domain fits in the system.

## What this domain does

The loan's USDC side lives in smart contracts on Base. A main loan contract keeps the loan's state, deadlines, amounts, fixed recipients and the hashes of the two participant secrets. Around it, each loan gets two small contracts:

- a **funding vault**, an immutable address deployed for one loan that receives the lender's principal;
- a **repayment vault**, a second immutable address for the same loan that receives the debt once the borrower has accepted.

Both vaults are **payer-neutral**: anyone can send USDC to them, and sending tokens never gives the sender the borrower's or lender's role, a recipient choice or a refund right. Money leaves only to fixed recipients that come from the approved terms and the contract's state, never from who paid.

A transfer into either vault is provisional. A separate finalization call moves the exact required amount into the loan, and only that call's named event, once final, counts. Many calls are **permissionless**: anyone may submit them and pay the network fee, but the caller cannot change the amount, the recipient or the meaning.

A Base payout can reveal a secret that makes an already signed Bitcoin transaction usable. It cannot sign, broadcast or confirm that transaction.

## How its responsibilities work together

[Base loan state and USDC settlement](../../system-model/domains/base-usdc-settlement-and-funding/responsibilities/sr-003-base-loan-state-and-usdc-settlement.md) owns the contract: its states, deadlines, calls, named events and errors, exact amounts and fixed recipients. It registers the funding vault when the funding window opens; a successful acceptance atomically pays the principal to the borrower's fixed recipient, reveals X and deploys and registers the repayment vault. A failed or conflicting call reverts without a success event or unintended value movement. It also provides the fixed-effect finalization, sweep, expiry and refund calls, and the governed upgrade boundary.

[Lender-controlled funding-vault interaction](../../system-model/domains/base-usdc-settlement-and-funding/responsibilities/sr-005-lender-controlled-funding-vault-interaction.md) is the human and application boundary for the selected lender's capital decision. It shows the lender the verified funding vault, chain, asset, loan, remaining principal, deadline and the lender's fixed settlement recipient. The lender decides when and how to transfer, from any wallet or treasury it controls, in one or several transfers. The application coordinates the balance display and the finalization call; signing stays with the lender and the outcome with the contract and the observer. It never pools capital, substitutes a lender or draws funds automatically.

The domain receives committed terms from Loan Terms And Commitments, and participant-signed calls from the participants' Vaults, which hold the keys that reveal X and Y. It provides named contract events to Base Observation And Fallback Review, which qualifies their finality for everyone else, and, through public X and Y, the evidence that lets Bitcoin Authorization And Recovery complete its fixed transactions. A participant's Vault payment account can be one eligible payer; it does not become a protocol caller or a recipient unless selected for a fresh loan's existing recipient field through the normal approvals.

## A normal case

Follow an illustrative loan once its Bitcoin prefund has qualified.

1. **Funding window.** Only after six unchanged prefund confirmations, and while at least 67 hours remain before the borrower's Bitcoin refund becomes valid, does the company's opener have the loan contract open a 24-hour funding window and register the loan's funding vault. A late opening fails closed.
2. **Funding.** The lender reviews the vault details and sends USDC from a wallet it controls; partial transfers accumulate. When the balance reaches the principal before the deadline, a permissionless call finalizes exactly the principal. That call records a 24-hour acceptance deadline counted from its own Base block, so part of the period passes before its event is final.
3. **Acceptance.** The borrower deliberately reveals X through a call signed in the borrower's Vault. Acceptance requires the funding to be no older than 24 hours and at least 19 hours left before the borrower's Bitcoin prefund could be refunded. The contract atomically pays the principal to the borrower's fixed recipient, records X as public, and creates the repayment vault. Bitcoin activation is still pending; only separate confirmed Bitcoin evidence makes the collateral active. If activation then fails to confirm before the borrower's prefund refund does, the lender is left with unsecured credit. The records name this the principal residual cross-chain risk, which the timing margins and recovery controls reduce but cannot eliminate.
4. **Repayment.** Anyone sends USDC to the repayment vault. A sufficient balance is necessary but is not itself repayment: exact debt must be finalized no later than the repayment deadline, D, and the finalized repayment event is the valid repayment. The guided repayment flow closes one hour before D to leave time for finalization; later direct transfers may be returned rather than counted.
5. **Claim.** The lender, bound to this loan and freshly signed in, reveals Y through its Vault strictly before the claim cutoff, C, which is D plus 172,800 seconds (two days). The contract pays the debt once to the lender's fixed recipient and makes Y public.
6. **Bitcoin follows.** Once observation qualifies the claim as final, the Bitcoin automation uses Y to complete the borrower's already signed recovery transaction. The loan's Bitcoin outcome is decided on Bitcoin, not here.

Participants call acceptance and claim themselves from their own protocol address on Base. The company may send that address a one-time stipend of network fee currency for each eligible call, which never lets the company sign, submit, change or replay the call. Above a fixed ceiling of 0.001 ether after its safety margin, nothing is sent, and paying the fee yourself always remains possible.

```figure
caption: Money moves on Base only through finalized named events, and each event pays a recipient fixed before funding began.
step: Open | Funding window and funding vault for one loan.
step: Fund | Lender transfers; exact principal is finalized.
step: Accept | Borrower reveals X; principal goes to the borrower's fixed recipient.
step: Repay | Exact debt finalized no later than D.
step: Claim | Lender reveals Y before C; debt goes to the lender's fixed recipient.
optional: Refund | Only if no claim before C: the exact repayment returns to the frozen borrower recipient.
```

## Exceptions and recovery

- **Funding never completes.** If the funding deadline passes without finalized funding, anyone may trigger the refund, which can pay only the lender's fixed settlement recipient. Excess or late USDC in the funding vault is swept to the same recipient.
- **The borrower never accepts.** If funding finalized but acceptance did not happen within its lifetime, the principal returns the same way to the lender's fixed recipient, and the borrower's prefund has its own Bitcoin refund path.
- **Wrong inputs.** A wrong loan, hash, role, recipient, amount, deadline, state or deployment blocks the action and reverts without effect.
- **Repayment missed.** Without exact debt finalized by D, the loan is an ordinary default for product purposes. Expired partial or late repayment funds can be swept only to the borrower's current or frozen refund recipient; the payer gains nothing, and the sweep does not cure the missed repayment. The lender's Bitcoin recovery becomes valid only after T, three days after D, under Bitcoin's own timelock.
- **The lender does not claim.** At C the claim is permanently disabled and the borrower's refund recipient freezes. Before C, the borrower may switch that recipient once, and only to the borrower's own protocol address. At or after C, anyone may trigger a refund of the exact repayment to the frozen recipient, once; delayed automation never expires that right. The finalized refund event is the only positive trigger for the conditional Bitcoin fallback; lender silence, a missing secret, elapsed time or raw token activity is not. The Base refund does not imply Bitcoin recovery, and Bitcoin lender-recovery maturity at T stays independent of it.
- **Retries.** Application retries reload authoritative facts and repeat the same fixed effect; there is no generic asset rescue or arbitrary destination.

> **A Base refund is not a Bitcoin recovery**
>
> After a valid repayment the lender did not claim, the borrower gets the USDC back on Base, but the collateral is still in Bitcoin escrow. Whether it returns depends on the routes described in the [Bitcoin Authorization And Recovery guide](bitcoin-authorization-and-recovery.md), and for many loans that remains a recorded residual risk.

## Authority boundaries

The domain decides Base state transitions, amounts and payouts to fixed recipients. It must not:

- treat a transfer, a balance or a submitted transaction as funding or repayment;
- let a payer, an opener, an operator or the company choose a recipient or amount, hold lender capital, pool it or deploy it automatically;
- sign, broadcast or confirm Bitcoin, or treat a Base refund as Bitcoin recovery;
- classify finality itself; that belongs to Base observation.

A workforce operator can request an already authorized fixed-effect call, but cannot edit contract meaning or claim success without evidence. The company-operated opener is trusted to open a funding window only for a committed loan whose collateral qualified. The contract cannot check that itself, so the application quarantines any opened record that does not match a committed loan instead of treating it as a product loan.

## Choices and their reasons

- **An immutable funding vault per loan.** The address itself routes principal to the loan, so a lender's ordinary wallet or treasury needs neither the protocol key nor loan-specific call data.
- **A separate immutable repayment vault, created at acceptance.** Any wallet can repay with an ordinary transfer, partial payments stay attributable to one loan, the payer never grants the loan contract an allowance, and creating it inside acceptance avoids a later deployment race.
- **A governed, upgradeable loan contract.** The main contract stays upgradeable through a proxy with one ownership path: a dedicated single upgrade key for local and test use and the intentionally short public mainnet beta, after which the same sole ownership moves to a two-of-three multisignature behind a seven-day public timelock for the rest of the first version. Every upgrade needs public notice and compatibility evidence. The recorded reason is a repair route during the early beta, instead of immutable code with no repair path or a proxy that can change behavior freely. There is no on-chain pause; direct valid exits stay available while the application or the opener is shut down. Each loan stays with the deployment where it originated and is never moved to another, but an approved upgrade changes the code for every loan that deployment holds.

## Open, excluded and deferred

- **Upgrade risk.** Compromise of the upgrade governance could affect every loan in a deployment; the [upgrade boundary](../../system-model/contracts/invariants/inv-020-base-upgrade-boundary.md) records the constraints, and [conversion to an immutable contract](../../system-model/contracts/scope/scope-007-immutable-base-contract-conversion.md) is deferred.
- **Excluded:** [pooling, custody and automatic allocation of lender capital](../../system-model/contracts/scope/scope-011-public-multi-lender-pooling-custody-and-automatic-capital.md) and [Bitcoin liquidation](../../system-model/contracts/scope/scope-012-bitcoin-liquidation-surplus-and-shortfall.md).
- **Deferred:** Base-side accounting for a [cooperative Bitcoin settlement](../../system-model/contracts/scope/scope-005-cooperative-settlement-operations.md). Participants can agree a cooperative Bitcoin spend, but this domain records nothing about it.
- **Payment accounts.** A participant may pay from a Vault payment account; its signing profile is recorded as not yet verified, and it never changes the payer-neutral contracts or historical recipients.

The [domain record](../../system-model/domains/base-usdc-settlement-and-funding/domain.md) lists exactly what the domain owns and excludes.
