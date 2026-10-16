# Base USDC Settlement And Funding

This domain decides what happens to USD Coin (USDC) on the Base blockchain for one loan: funding, acceptance, repayment, the lender's claim and refunds. The [architecture guide](../architecture.md) shows how it connects to the Bitcoin collateral, which lives under a separate chain authority.

## What this domain does

For each loan, a Base contract holds one authoritative record and applies fixed rules for every movement of USDC. A payout on Base can make a secret public, and that public secret can make a previously signed Bitcoin transaction usable. The Base contract itself cannot sign, broadcast or confirm that Bitcoin transaction.

The concepts a reader needs:

- A **funding vault** is a fixed, per-loan address that receives the lender's principal. A **repayment vault** is the corresponding address that receives the borrower's repayment. Both are deployed for one loan only, cannot be upgraded, have no owner, and offer no way to call arbitrary code, choose another asset or destination, or rescue tokens generically.
- Transfers into either vault are **provisional**. Only the named contract action that finalizes the exact required amount turns a balance into funding or repayment.
- **Payer-neutral** means anyone may send the tokens. Sending does not give the sender the borrower's or lender's role, change any recipient, or create a right to a refund. Recipients come from the agreed loan and the contract state, never from who paid.
- Three times matter. **D** is the repayment deadline. **C** is the claim cutoff, exactly two days (172,800 seconds) after D. **T**, three days (259,200 seconds) after D, is when the lender's Bitcoin default route matures; that is a Bitcoin fact, not a Base one.

## How its responsibilities work together

[Base loan state and USDC settlement](../../system-model/domains/base-usdc-settlement-and-funding/responsibilities/sr-003-base-loan-state-and-usdc-settlement.md) owns the contract: its states, deadlines, calls, named events and errors, exact amounts and fixed recipients. It registers the funding vault. When the borrower accepts by revealing the secret X, the contract pays the principal to the borrower's fixed address and deploys and registers the repayment vault in the same transaction. A failed or conflicting call reverts with a named error, emits no success event and moves nothing. The finalization, sweep, expiry and refund calls are **permissionless**: anyone may submit them and pay the network fee, but the caller cannot change the amount, the recipient or the meaning.

[Lender-controlled funding-vault interaction](../../system-model/domains/base-usdc-settlement-and-funding/responsibilities/sr-005-lender-controlled-funding-vault-interaction.md) is the human and application side of the selected lender's capital decision. It shows the lender the deployed vault, chain, asset, loan, remaining principal, deadline and the lender's fixed settlement address, checked against the approved deployment. The vault balance and the amount still needed to reach the principal are shown as provisional. The lender then sends one or more ordinary transfers from any wallet or treasury they control, including a recoverable Vault payment account. Partial deposits add up. This responsibility displays the provisional balance and coordinates finalization, while signing stays with the lender and authoritative transitions stay with the contract and the observer. It never pools capital, substitutes a lender or draws funds automatically.

The domain receives the agreed terms and deployment from the loan-terms domain, transfers from participants, and the participant-signed calls that reveal X, reveal Y or switch the refund address. It emits named events, which the observation domain qualifies before anything else relies on them.

## A normal case

1. **Opening.** After the Bitcoin collateral has qualified, the application's dedicated opener opens the loan's 24-hour funding window and its funding vault on the contract.
2. **Funding.** The lender transfers USDC. When the vault holds at least the principal before the funding deadline, anyone may finalize exactly the principal. The loan is then funded but not accepted, for at most 24 hours.
3. **Acceptance.** The borrower intentionally reveals X through the borrower's Vault. Acceptance pays the principal and leaves Bitcoin activation pending; the loan can be shown as active only after separate confirmed Bitcoin evidence, and the exit transactions for the confirmed escrow are signed and stored.
4. **Repayment.** The borrower, or anyone, sends USDC to the repayment vault. A sufficient balance is necessary but is not repayment; the exact debt must be finalized no later than D.
5. **Claim.** The lender reveals Y strictly before C. The claim pays the exact debt once to the lender's fixed address and makes Y public. After the observation domain qualifies that event as final, Bitcoin operations can complete the borrower's fixed recovery transaction.

```figure
caption: Every step that moves value waits for the exact amount to be finalized by the contract, not for a balance.
step: Open | The funding window and per-loan funding vault are created.
step: Fund | The lender transfers USDC; exactly the principal is finalized.
step: Accept | The borrower reveals X; principal is paid and the repayment vault opens.
step: Repay | Exact debt is finalized no later than D.
step: Claim | The lender reveals Y before C and receives the debt once.
```

## Exceptions and recovery

- **No acceptance.** If funding is not finalized by its deadline, a permissionless expiry returns whatever USDC the funding vault holds to the lender's fixed address. If the funded loan is not accepted in time, a permissionless refund returns the principal exactly once to the same address. The borrower's staged Bitcoin has its own refund route in the Bitcoin domain.
- **Changing the refund address.** Before C, the borrower may make one irreversible switch of the repayment refund address, from the agreed Base recipient to the borrower's committed protocol address, which signs the switch itself. A concern about access to the original address is one reason to do so. At C the current choice freezes.
- **No claim before C.** If the lender does not claim before C, the lender permanently loses that Base claim. The exact unclaimed repayment becomes refundable once, by anyone, to the frozen borrower address. The finalized refund event is the only positive Base trigger for the separate fallback that might publish a secret to complete Bitcoin recovery. Lender silence, a missing secret, elapsed time or raw token activity is not that event. A Base refund does not mean Bitcoin recovery, and the lender's Bitcoin default route after T stays independent.
- **Excess and late USDC.** Excess, partial or late USDC in a vault follows fixed recovery paths to recipients set by the agreement and the contract state; for the repayment vault that is the borrower's current refund address before C and the frozen one afterwards. Tokens other than the configured USDC may remain stuck. There is no general rescue and no arbitrary destination.
- **Wrong inputs and retries.** A wrong loan, hash, role, recipient, amount, deadline, state or deployment blocks the action. Application retries reload the authoritative facts first and keep the same fixed effect.
- **Operators.** A workforce operator can request only an application operation whose effect is already fixed, and cannot edit contract meaning or choose recipients.

## Authority boundaries

The domain decides the Base record and its value movements, and nothing else. It does not activate or settle Bitcoin, hold participant secrets, write the terms, classify Base finality, or pool, take custody of or automatically deploy lender capital, and it never liquidates Bitcoin. A raw transfer, token event, vault balance, simulation, worker completion, submitted transaction, observed event, missing Y or lender silence never counts as finalized funding, valid repayment, claim, refund, Bitcoin recovery or default.

A Vault payment account, and the separately scoped transfer that lets a participant send USDC to an address of their choice, do not change the payer-neutral contracts or any historical recipient. A participant's own transfer has no link to a loan and cannot advance or rewrite loan state.

## Choices and their reasons

The vaults are deliberately immutable and ownerless, so no platform key can choose where principal, repayment or refunds move from them. They release USDC only on instruction from the main contract, and that contract is upgradeable, so the security records state that the claim that the organization cannot redirect Base funds is only as strong as the contract's upgrade administration.

That administration has one ownership path. During local and test use and an intentionally short public beta on the main network, a single dedicated upgrade key controls upgrades. After the beta, that same sole ownership moves to a multi-signature wallet. The user chose the single beta key and the later move to a multi-signature wallet; the agent recommended its form, a two-of-three Safe acting through a seven-day timelock, and the user approved it. Proposed code must be public and pass an automated compatibility check before an upgrade is scheduled, a lost or compromised funding-window opener is replaced through the same delayed upgrade path, and the administrator is not renounced in this version. The recorded reason is to keep a governed repair route during the early beta instead of deploying immutable code with no repair path. The [governance selection](../../build/records/selections/sel-009-base-contract-upgrade-governance.md) holds this choice; the [upgrade boundary](../../system-model/contracts/invariants/inv-020-base-upgrade-boundary.md) and the [deployment and upgrade state](../../system-model/contracts/states/state-019-base-deployment-upgrade-and-opener.md) describe only the Safe arrangement and do not mention the beta key, and the deployment state and the Base governance security record rule out an unrestricted unilateral upgrade key. Whether the beta key counts as such a key is not stated, so this point is open.

During an incident the organization can pause normal actions in its product and stop opening new funding windows. That pause does not block valid direct contract calls, so funding, repayment, refund and claim paths for existing loans remain available even when the application is shut down.

Two further points about these choices are open because the records that own them do not clearly agree; neither is decided here:

- **Is there an on-chain pause role?** The governance selection, the [opening-authority constraint](../../build/records/constraints/cons-008-base-window-opening-authority.md), the settlement responsibility and the user's recorded decision all say there is no on-chain pause and that incident response happens in the product and its interface. The deployment and upgrade state nevertheless lists narrow pause and operational roles in the deployment identity, with a paused state entered by an authorized operational role, and the [opener and pause boundary](../../system-model/contracts/invariants/inv-019-funding-opener-and-pause-boundaries.md) limits "any" such role. Whether those entries describe a real on-chain role is not stated.
- **How do upgrades treat existing loans?** The governance selection, following the user's wish to keep all loans under the same rule, says a compatible approved upgrade becomes the one current code path for every loan held by the proxy, with existing loan data kept compatible. The upgrade boundary says existing loans remain on their originating contract and are not silently migrated, and the deployment state says an upgrade must not migrate or reinterpret existing originating loans. These fit if the originating contract means the proxy and its recorded deployment identity, and the immutable-conversion scope speaks only of a future new deployment, but no record says whether a code-path change counts as reinterpreting an existing loan.

## Open, excluded and deferred

Cooperative Bitcoin settlement exists as a mechanism, but its corresponding Base accounting is deferred under [cooperative settlement operations](../../system-model/contracts/scope/scope-005-cooperative-settlement-operations.md). Converting the contract to an immutable one is deferred under [immutable contract conversion](../../system-model/contracts/scope/scope-007-immutable-base-contract-conversion.md). Bitcoin liquidation, and organization custody or automatic allocation of lender capital, are outside this domain and this version.

The [domain record](../../system-model/domains/base-usdc-settlement-and-funding/domain.md) lists exactly what the domain owns and excludes.
