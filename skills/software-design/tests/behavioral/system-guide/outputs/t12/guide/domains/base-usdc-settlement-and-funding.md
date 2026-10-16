# Base USDC Settlement And Funding

This domain owns everything that happens to the loan's USDC on Base: funding, the borrower's acceptance, repayment, the lender's claim and the fixed refunds. It gives each loan one authoritative contract record whose rules decide who receives the money, so no payer, operator or application can redirect it. The [architecture guide](../architecture.md) shows where this domain fits in the whole system.

## What this domain does

USDC is a dollar-denominated token, and Base is the public blockchain where the loan's smart contract runs. The Bitcoin collateral lives on a different chain under its own rules. A payout on Base can make a secret public, and that secret can complete a Bitcoin transaction the participants signed earlier, but nothing on Base can sign, broadcast or confirm a Bitcoin transaction.

Three ideas recur:

- A **funding vault** is an immutable address deployed for one loan to receive the lender's principal. A **repayment vault** is the matching address for the borrower's repayment. Neither has an owner or any way to call arbitrary code, choose an asset, choose a destination or rescue tokens.
- **Payer-neutral** means that anyone may send tokens into these vaults. Sending tokens gives the sender no borrower or lender role, no say over recipients and no refund right. Recipients come from the agreed terms and the contract's state, never from who paid.
- A transfer into a vault is **provisional**. Only the main contract's named finalization step, moving exactly the required amount, counts as funding or repayment, and only once its event reaches Base L1 finality, the settlement point on the underlying Ethereum network, the layer 1 (L1) beneath Base.

## How its responsibilities work together

**[Base loan state and USDC settlement](../../system-model/domains/base-usdc-settlement-and-funding/responsibilities/sr-003-base-loan-state-and-usdc-settlement.md)** is the loan contract itself: its states, deadlines, calls, named events and errors, exact amounts and fixed recipients. It registers the funding vault when the loan opens, and the borrower's successful acceptance pays the principal to the borrower's fixed recipient and deploys and registers the repayment vault in one step. It also offers fixed-effect calls that anyone may submit, such as finalizing funding or repayment, sweeping excess and processing refunds. Letting anyone submit them means someone other than a participant can pay the network fee; it never lets that caller change the amount, the recipient or the meaning.

**[Lender-controlled funding-vault interaction](../../system-model/domains/base-usdc-settlement-and-funding/responsibilities/sr-005-lender-controlled-funding-vault-interaction.md)** is the lender's side of funding. It shows the lender the verified, deployed funding vault: the chain, the token, the loan, the principal still missing, the deadline and the lender's fixed settlement recipient. The lender decides when to fund and from which wallet or treasury it controls, including a recoverable payment account in its Vault. Partial transfers add up. This responsibility shows the provisional balance and coordinates finalization, while the participant signs its own transfers and the contract and the Base observer decide what has happened. It never pools capital, substitutes another lender or draws funds automatically.

The domain receives the committed terms and deployment from the terms domain, the participants' locally signed calls from their Vaults, and transfers from any payer. It provides named events and contract state to the Base observer, which turns them into finality-qualified facts for the rest of the system, and those facts let the Bitcoin domain act on public X and Y.

## A normal case

**Opening and funding.** After the loan qualifies on the Bitcoin side, the contract opens the loan's record and deploys its funding vault, starting a 24-hour funding window. The lender sends USDC, perhaps in two transfers from different wallets it controls. When the balance reaches the principal before the deadline, anyone may finalize; the contract moves exactly the principal, and the loan is funded but not yet accepted. Any excess stays recoverable to the lender's fixed recipient.

**Acceptance.** The borrower has at most 24 hours from finalized funding to accept. Acceptance is deliberate and happens in the borrower's Vault, which discloses the secret X in the acceptance call. A successful acceptance pays the principal to the borrower's fixed recipient, deploys the repayment vault and makes X public, all in one step. Base acceptance is not yet active collateral: the loan stays activation pending until the Bitcoin domain's activation transaction has six confirmations under Bitcoin's own rules, and it becomes package-ready active only after the recovery packages for that escrow are signed and archived.

**Repayment.** Anyone may send USDC to the repayment vault. A sufficient balance is necessary but is not itself repayment. Valid repayment exists only when exactly the debt is finalized from that vault no later than the repayment deadline D and the resulting repayment event reaches finality.

**Claim.** The lender then claims by revealing Y in a call from its Vault, strictly before the claim cutoff C, which is D plus 172,800 seconds, two days. The claim pays exactly the debt once to the lender's fixed recipient and makes Y public. The Base observer qualifies the claim's finality, and the Bitcoin domain can then complete the borrower's fixed recovery transaction.

## Exceptions and recovery

**The lender does not claim.** If the claim has not happened before C, the lender permanently loses the claim on Base, and the exact repayment becomes refundable once, by anyone's call, to the borrower's refund recipient as it stood at C. Before C, the borrower may make one switch of that recipient from its original Base recipient to its own committed protocol address on Base; at C the recipient freezes. The finalized refund event is the only positive Base trigger for the optional Bitcoin fallback. Lender silence, a missing secret, elapsed time or raw token activity is not that event.

A Base refund does not recover the Bitcoin. The lender's timelocked Bitcoin recovery becomes valid after T, which is D plus 259,200 seconds, three days, and remains independent of anything on Base. The claim and the refund exclude each other, so the lender can never receive the USDC twice, but the Bitcoin outcome is decided separately on Bitcoin.

**Funding or acceptance expires.** If the principal is not finalized in time, or the borrower does not accept within 24 hours of finalized funding, anyone may trigger the fixed refund of the principal to the lender's fixed recipient. The borrower's Bitcoin prefund then follows its own refund route on the Bitcoin side.

**Late, partial or excess money.** USDC that arrives late, falls short or exceeds the exact amount follows the fixed recovery path: in the funding vault only to the lender's fixed recipient, in the repayment vault only to the borrower's current or frozen refund recipient. There is no generic asset rescue and no arbitrary destination.

**Failed or wrong calls.** A call for the wrong loan, hash, role, recipient, amount, deadline, state or deployment reverts with a named error, emits no success event and moves nothing. Application retries must reload the authoritative facts and repeat the same fixed effect. A workforce operator can request an operation that is already fixed but cannot change the contract, amount, recipient or effect, or claim success without evidence.

## Authority boundaries

The domain decides what the contract records and where its USDC goes. It must not decide or imply:

- Bitcoin activation or any Bitcoin outcome, which belong to the Bitcoin domain and Bitcoin itself;
- participant secrets or keys, which stay in the Vaults;
- the meaning of the terms, which belongs to the terms domain;
- Base observation and finality classification, which belong to the observation domain;
- custody, pooling or automatic allocation of lender capital, or liquidation.

A raw transfer, a token event, a vault balance, a simulation, a submitted transaction, an observed but unfinalized event, a missing Y or lender silence never implies funding, valid repayment, a claim, a refund, Bitcoin recovery or default.

A Vault payment account is one possible payer. It does not become a protocol caller and does not change any recipient or any historical terms. A separate, narrow participant transfer from that account, to a recipient the participant chooses, has no link to any loan and cannot change loan state.

## Choices and their reasons

- **Immutable, ownerless vaults per loan.** A deployed vault for each loan costs one small contract creation, but every ordinary transfer then has an unambiguous on-chain destination, needs no memo or sender identity, and no platform key can choose where principal or refunds move from the vault itself. The main contract that receives the funds stays upgradeable, which raises the open points below. A shared deposit address would need off-chain attribution, and a not-yet-deployed address could strand funds. The repayment vault is created only for an accepted loan, inside the acceptance step, so a failure anywhere in acceptance reverts everything. The [funding vault selection](../../build/records/selections/sel-021-immutable-per-loan-funding-vault.md) and the [repayment vault selection](../../build/records/selections/sel-022-immutable-per-loan-repayment-vault.md) record these choices.
- **An upgradeable main contract.** The main contract remains upgradeable through a proxy, with published code and a passing compatibility check before every upgrade. Immutable code from the start would give no repair path during the early beta, while permanent upgradeability would leave a lasting ability to change behavior; a governed repair route is the recorded middle path in the [upgrade governance selection](../../build/records/selections/sel-009-base-contract-upgrade-governance.md). A compromised account allowed to open loans is replaced through the same delayed upgrade route. Upgrades must preserve fixed-recipient and lifecycle authority and each loan's originating identity. Who may upgrade during the beta, how an upgrade reaches loans the contract already holds, and whether any on-chain pause exists are [still open](#open-excluded-and-deferred).
- **Stopping the application instead of the contract (partly open).** The selection and the settlement responsibility say this version has no on-chain pause: stopping the application or the loan-opening service avoids a second on-chain administrator, but it cannot stop a technical user from calling the contract directly, and the valid direct exits remain callable during such a shutdown. Whether the deployment state's narrow operational pause is only that application stop is open, as described below.

## Open, excluded and deferred

- **Cooperative settlement accounting.** Borrower and lender can jointly sign a cooperative Bitcoin settlement, but how such a settlement is reflected on the Base ledger is not designed; the product must not claim that a cooperative outcome closes the Base loan. See the [cooperative settlement scope](../../system-model/contracts/scope/scope-005-cooperative-settlement-operations.md).
- **Immutable contract conversion.** Freezing the proxy or renouncing its administrator is deferred, see the [immutable conversion scope](../../system-model/contracts/scope/scope-007-immutable-base-contract-conversion.md).
- **Unresolved conflict: who may upgrade during the beta.** The [upgrade governance selection](../../build/records/selections/sel-009-base-contract-upgrade-governance.md) uses a single dedicated upgrade key during the intentionally short public beta, then passes the same sole ownership to a 2-of-3 multi-signature Safe acting through a seven-day timelock. The [upgrade boundary](../../system-model/contracts/invariants/inv-020-base-upgrade-boundary.md) and the settlement responsibility say this version keeps the administrator under the Safe and timelock, the [deployment state](../../system-model/contracts/states/state-019-base-deployment-upgrade-and-opener.md) treats an unrestricted unilateral upgrade key as invalid, and the [upgrade-compromise threat record](../../system-model/contracts/security/sec-017-base-upgrade-administrator-or-operational-signer-compromise.md) says no unilateral key may bypass the Safe or timelock. The records do not decide which holds during the beta.
- **Open question: how upgrades reach existing loans.** The selection says a compatible upgrade becomes the one code path for every loan the contract holds. The upgrade boundary says existing loans stay on their originating contract without silent migration, and the deployment state and threat record forbid retroactive mutation of existing loans. Whether these fit together, for example because the originating contract is the upgradeable proxy itself, is undecided.
- **Open question: an on-chain pause.** The selection and the settlement responsibility say there is no on-chain pause, while the [deployment state](../../system-model/contracts/states/state-019-base-deployment-upgrade-and-opener.md) includes pause roles and a narrow operational pause state triggered by an authorized role. Whether that pause is only the application stop is undecided.
- **Excluded.** Liquidation, organization custody of funds and automatic deployment of lender capital are outside this version.

The [domain record](../../system-model/domains/base-usdc-settlement-and-funding/domain.md) lists exactly what the domain owns and excludes, and the [main loan state](../../system-model/contracts/states/state-011-main-base-loan.md), [repayment refund and claim cutoff state](../../system-model/contracts/states/state-013-repayment-refund-recipient-and-claim-cutoff.md) and [Base contract interface](../../system-model/contracts/interfaces/iface-009-base-transition-api-events-and-errors.md) hold the exact rules.
