# Base USDC Settlement And Funding

This domain owns everything that happens to the loan's USDC on the Base network: the lender's funding, the borrower's acceptance and payout, repayment, the lender's claim, and every refund. Its contracts move exact amounts, or a vault's whole leftover balance, only to recipients fixed in advance, so no caller, payer or operator can redirect the money. The [architecture guide](../architecture.md) shows where it fits in the system.

## What this domain does

USDC is a dollar stablecoin, and Base is an Ethereum layer-2 network. For each loan, a main loan contract on Base keeps the authoritative record: the amounts, deadlines, fixed recipients, the hashes of the borrower's secret X and the lender's secret Y, and the loan's current state. Two small per-loan contracts receive the money:

- The **funding vault** is an immutable address created for one loan, into which the lender sends the principal.
- The **repayment vault** is a second immutable address for the same loan, created when the borrower accepts, into which anyone sends the repayment.

USDC that arrives in either vault is provisional. It counts only when someone calls the main contract to finalize the exact required amount, and the rest of the system acts on that call only once its event reaches finality. Funding and repayment are **payer-neutral**: any address may send the USDC, and sending it gives the sender no role, no say over recipients and no refund right. Recipients come from the approved loan terms and the contract state, never from the identity of the payer.

The Bitcoin collateral lives under a separate authority. A Base call can reveal a secret that makes a pre-signed Bitcoin transaction usable, but the contract cannot sign, broadcast or confirm anything on Bitcoin.

## How its responsibilities work together

- [Base loan state and USDC settlement](../../system-model/domains/base-usdc-settlement-and-funding/responsibilities/sr-003-base-loan-state-and-usdc-settlement.md) owns the contracts: the loan's states, deadlines, calls, named events and errors, exact amounts and fixed recipients. A dedicated opener opens the funding window and registers the funding vault; borrower acceptance pays the principal and creates the repayment vault in one step. The contract also provides the calls for finalizing, sweeping, expiring and refunding. A failed or conflicting call reverts without a success event or any unintended movement of funds.
- [Lender-controlled funding-vault interaction](../../system-model/domains/base-usdc-settlement-and-funding/responsibilities/sr-005-lender-controlled-funding-vault-interaction.md) supplies the selected lender's side of funding. It shows the lender the verified funding vault, chain, asset, loan, remaining principal, deadline and the lender's own fixed settlement recipient, and it leaves the decision and the signing to the lender. It never pools capital, substitutes a lender or draws funds automatically.

The domain receives the committed loan terms and the deployment it must match from Loan Terms And Commitments. The participants' Vaults, covered in Bitcoin Authorization And Recovery, prepare and sign the participants' own contract calls, and Participant Access And Loan Operations coordinates the workflow around them. Base Observation And Fallback Review watches the contract's events and decides when they are final; only then do the workspace and the Bitcoin operations act on them.

### Who may call what

Only two calls are restricted to a particular caller: opening a funding window, which only the dedicated opener may do, and the borrower's one-time switch of its refund recipient, which only the borrower's committed protocol account may make. Finalizing an amount, sweeping leftovers and paying refunds are open to anyone. That lets the organization, or anyone else, pay the network fee without gaining any control over amount, recipient or meaning.

Acceptance and claim, the calls that reveal X and Y, are prepared and signed only in the participant's own Vault, from the participant's Base protocol account. To cover their network fee, and that of the refund-recipient switch, the system may send the participant's protocol account one bounded stipend of ether per eligible call, with no refill and nothing sent when the estimated fee is unusually high; participants can always pay the fee themselves instead. Whether the contract also rejects these two calls from any other account is an open discrepancy described at the end of this guide.

## A normal case

The following case is illustrative; it follows the money for one loan.

```figure
caption: Funding and acceptance. A balance in a vault is provisional until the main contract finalizes the exact amount.
step: Window opens | After the collateral qualifies, the opener opens a 24-hour funding window and a funding vault.
step: Lender funds | The lender sends USDC to the funding vault from any wallet it controls.
step: Funding finalized | Anyone finalizes the exact principal; the call records a 24-hour acceptance deadline.
step: Borrower accepts | The borrower reveals X; the contract pays the principal and creates the repayment vault.
```

**Funding.** Once the borrower's prefunded collateral has qualified on Bitcoin, the opener opens the loan's record and its funding vault. The lender reviews the vault, amount and deadline and, by its own explicit decision, sends USDC from any wallet or treasury it controls, including an optional Vault payment account. Partial deposits add up. When the balance covers the principal before the funding deadline, anyone may finalize exactly the principal; that call records a 24-hour deadline for acceptance.

**Acceptance.** The borrower deliberately accepts by revealing X through its Vault before that deadline. In one atomic step, the contract checks X against its hash, pays the principal to the borrower's fixed recipient, makes X public and creates and registers the repayment vault. This is the moment the borrower receives the money. The Bitcoin side is still only *activation pending*; only confirmed Bitcoin evidence later makes the collateral active.

```figure
caption: Repayment and claim. Paying gives the payer no role; only the finalized events count.
step: Repayment | Anyone sends USDC to the repayment vault; the exact debt is finalized by the deadline D.
step: Lender claims | Before the cutoff C, the lender reveals Y and the debt goes to its fixed recipient.
```

**Repayment.** Anyone, including the borrower's Vault payment account or any other wallet, sends USDC to the repayment vault. A sufficient balance is necessary but is not itself repayment: the exact debt must be finalized no later than the repayment deadline **D**.

**Claim.** The lender then claims by revealing Y, strictly before the claim cutoff **C**, which is D plus 172,800 seconds (two days). The claim pays the debt once to the lender's fixed recipient and makes Y public. Once that claim is final, the Bitcoin operations can complete the borrower's pre-signed recovery transaction. The contract itself does nothing on Bitcoin.

What proves each step is a named contract event at finality: funding finalized, X accepted, repaid, Y released. A balance, a sent transaction or an application screen is not proof.

## Exceptions and recovery

- **Funding is never finalized.** If the funding deadline passes without finalized funding, anyone may mark the attempt expired and return the funding vault's balance to the lender's fixed settlement recipient.
- **The borrower does not accept.** If funding was finalized but the 24-hour acceptance deadline passes, anyone may return the principal once to the lender's fixed settlement recipient. The borrower's prefunded Bitcoin follows its own refund route in the Bitcoin domain.
- **Too much or late USDC.** Leftover USDC in a funding vault can be swept, after funding is finalized or expired, only to the lender's fixed settlement recipient. Leftover USDC in a repayment vault can be swept, after repayment is finalized or once D has passed, only to the borrower's refund recipient: the current one before C and the frozen one from C on. There is no general asset rescue and no arbitrary destination, and a sweep does not cure a missed repayment.
- **The repayment is late or wrong.** If the exact debt is not finalized by D, the loan has no valid repayment, whatever balance arrives later. The Base contract does not move Bitcoin; the lender's pre-signed timelock route on Bitcoin, valid once Bitcoin's consensus clock is strictly later than D plus three days, is a separate fact.
- **The lender does not claim.** At C the lender's claim becomes permanently impossible and the borrower's refund recipient freezes. Before C, the borrower may switch that recipient once, from its committed Base recipient to its own committed protocol account. At or after C, anyone may refund the exact unclaimed repayment, once, to the frozen recipient. Claim and refund exclude each other.
- **Wrong input or an unclear result.** A wrong loan, hash, role, recipient, amount, deadline, state or deployment blocks the call. Before any retry, the application reconciles the earlier transaction and its event, then repeats only the same fixed effect.

> **A Base refund is not a Bitcoin recovery**
> The finalized unclaimed-repayment refund event is the only Base fact that can trigger the optional fallback in which an independent service publishes a secret for the Bitcoin recovery, and only for a loan created after that service's production activation with its commitment in place. Lender silence, a missing secret, elapsed time or raw token activity is not that event, and the refund itself returns only the USDC.

## Authority boundaries

This domain decides the Base loan state and where USDC goes, under fixed rules. It must not:

- activate, recover or confirm anything on Bitcoin, or treat a Base fact as a Bitcoin outcome;
- hold, pool, allocate or substitute lender capital, or liquidate collateral;
- author the loan terms, hold participant secrets or classify chain finality, which belong to other domains;
- let a payer, a fee payer or an operator change an amount, a recipient or the meaning of a call.

A workforce operator may request an already authorized operation, but cannot edit the contract's meaning or claim success without a finalized event. A Vault payment account, and the separate narrow capability to send configured USDC to a recipient of the participant's choice, change none of the payer-neutral rules or historical recipients.

## Choices and their reasons

- **An immutable, ownerless funding vault per loan.** Every ordinary transfer has one unambiguous on-chain destination without a memo or sender identity, and no platform key chooses where principal or refunds move; the cost is one small contract creation per opened loan. The [funding vault selection](../../build/records/selections/sel-021-immutable-per-loan-funding-vault.md) records the reasons.
- **A separate repayment vault created by acceptance.** Any wallet can repay with an ordinary transfer, partial payments stay attributable to one loan, the payer never approves the loan contract, and creating the vault atomically with acceptance avoids a later deployment race. See the [repayment vault selection](../../build/records/selections/sel-022-immutable-per-loan-repayment-vault.md).
- **A governed, upgradeable main contract.** The main contract sits behind an upgradeable proxy with one ownership path: a single upgrade key for local and test use and the intentionally short public mainnet beta, then a two-of-three multi-signature Safe acting through a seven-day timelock for the rest of version 1. Every upgrade is published and checked for compatibility first. Existing loans are never migrated to another contract, but an approved upgrade becomes the code path for every loan the proxy holds. Replacing a lost or compromised opener goes through the same published, seven-day-delayed upgrade. The recorded reason is a repair route for the early beta, instead of immutable code with no repair path. The selected governance has no on-chain pause: in an incident the organization can stop its own frontend, API and opener, but valid direct contract calls, including every exit, remain available. The [upgrade governance selection](../../build/records/selections/sel-009-base-contract-upgrade-governance.md) records this.

## Open, excluded and deferred

> **Open discrepancy: who may reveal X and Y**
> The contract interface lets any caller with the exact secret submit acceptance or claim. The participant-call contract says that revealing X or Y from any account other than the participant's term-bound protocol account is not a valid protocol transition, even if the transaction confirms. The records do not reconcile the two.

> **Open discrepancies: pause and the beta upgrade key**
> The upgrade selection, the settlement responsibility and the opener constraint say version 1 has no on-chain pause. The deployment state record lists pause and operational roles in the deployment identity and a narrow "paused for new or risky action" state set by an operational role, without saying whether it is on-chain. Separately, the upgrade invariant and the deployment state record describe only the two-of-three Safe and seven-day timelock, while the upgrade selection adds the single-key period during the short beta.

- Conversion to an immutable contract is deferred, with its own [revisit condition](../../system-model/contracts/scope/scope-007-immutable-base-contract-conversion.md).
- For a cooperative Bitcoin settlement, the Bitcoin mechanism is defined, but its signing session, Base accounting and support procedures are deferred.
- Platform-paid execution of the secret-revealing calls, through a relayer or a paymaster, is deferred; in version 1 each participant signs and submits them, helped by the bounded stipend. Gas funding for Vault payment accounts in production is also deferred.
- Public or multi-lender matching, pooled capital, custody by the organization, automatic capital deployment and Bitcoin liquidation are excluded from version 1.

The [domain record](../../system-model/domains/base-usdc-settlement-and-funding/domain.md) lists exactly what the domain owns and excludes.
