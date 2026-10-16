# Base USDC Settlement And Funding

This domain owns everything that happens to the loan's USD Coin (USDC) on the Base network: the lender's funding, the borrower's acceptance and payout, repayment, the lender's claim, and every refund, each with fixed amounts and fixed recipients. The [architecture guide](../architecture.md) shows how these Base steps line up with the Bitcoin collateral.

## What this domain does

Each loan has one authoritative record in a loan contract on Base. The contract enforces the loan's state, amounts, deadlines and recipients, and it emits a named event for each transition that succeeds. Anything that fails reverts without a success event and without moving value. Bitcoin collateral is outside this domain: a Base payout can make a secret public, and that secret can then complete a Bitcoin transaction the participants already signed, but nothing on Base can sign, broadcast or confirm a Bitcoin transaction.

Three ideas matter throughout:

- **Per-loan funding and repayment vaults.** For each loan the contract deploys a **funding vault**, a dedicated address that receives the lender's principal, and later a **repayment vault**, a dedicated address that receives the borrower's repayment. Both are immutable and ownerless, with no way to call arbitrary code, choose another token or destination, or rescue arbitrary assets. They are unrelated to the participants' Vaults, the browser applications that hold their keys.
- **Balances are not results.** Sending USDC to one of these vaults is provisional. Only the contract's own finalization call, which moves exactly the required amount and emits its event, counts as funding or repayment, and the rest of the system relies on that event only once it reaches Base's layer-1 finality.
- **Payer neutrality.** Anyone can send USDC to a vault, from any ordinary wallet. Sending money does not give the sender the borrower's or lender's role, change a recipient, or create a refund right. Recipients come from the committed loan terms and the contract's state, never from who paid.

Besides the short funding and acceptance windows, the Base contract enforces two loan deadlines. **D** is the repayment deadline. **C**, two days after D, is when the lender's claim window closes. Two further deadlines are Bitcoin timelocks, measured separately on Bitcoin, and nothing on Base changes at them: **T**, three days after D, when the lender's Bitcoin route matures, and **B**, ten days after D, when the borrower's long-stop route matures.

## How its responsibilities work together

[Base loan state and USDC settlement](../../system-model/domains/base-usdc-settlement-and-funding/responsibilities/sr-003-base-loan-state-and-usdc-settlement.md) is the contract itself: its states, deadlines, calls, events and errors, exact amounts and fixed recipients, the deployment of both vaults, and the upgrade and opener boundaries. Many of its calls are permissionless: anyone may submit them and pay the network fee, but the caller gains no control over the amount, the recipient or the meaning.

[Lender-controlled funding-vault interaction](../../system-model/domains/base-usdc-settlement-and-funding/responsibilities/sr-005-lender-controlled-funding-vault-interaction.md) is the lender-facing side of funding. It shows the selected lender the verified funding vault, chain, token, loan, remaining principal, deadline and the lender's fixed settlement recipient, preserves the lender's explicit decision to fund, and coordinates the provisional balance display and the finalization call. It never pools capital, substitutes another lender or draws funds automatically.

The domain relies on others. The loan terms supply the amounts, deadlines, recipients and secret commitments, and the contract verifies the terms hash itself. The participants' Vaults sign the calls that reveal X and Y, and the optional recipient switch, locally with each participant's Base protocol account. The observation domain decides when an event is final. The participant application presents the steps, runs background jobs that submit permissionless calls, and offers a small, bounded amount of Base gas to a participant's protocol account so the participant can submit their own call.

## A normal case

The following case is illustrative. Ben lends to Ana; the terms are committed and Ana's Bitcoin prefund has qualified.

1. **Opening.** The application's opener account opens the funding window: the contract creates the loan record and deploys its funding vault. The window lasts 24 hours.
2. **Funding.** Ben sees the exact funding vault and sends USDC to it from any wallet he controls; the design also lets him pay from the payment account in his Vault, though that account is not yet verified in implementation. Two partial transfers add up. Once the balance covers the principal, anyone can call the finalization, which moves exactly the principal into the loan contract and starts a 24-hour on-chain deadline for Ana's acceptance. The application acts on it once the event is final, about 20 minutes later; the loan is then funded but not yet accepted.
3. **Acceptance.** Ana's Vault reveals X in her acceptance call. In one atomic step, the contract checks X against its commitment, pays the principal to Ana's fixed recipient, and deploys the repayment vault. If any part fails, nothing happens. The loan is now accepted, but its Bitcoin escrow is still pending. The application shows it as active only after separate Bitcoin evidence confirms the escrow, both participants have signed the exit packages for it, and their archive receipt validates; until then it shows the loan as waiting for that signing.
4. **Repayment.** Immediately before showing Ana the repayment vault, the application shows her current refund recipient and asks her to confirm it or make her one allowed switch. Before D, Ana or anyone else sends the exact debt to the repayment vault. A permissionless finalization, which must execute on Base no later than D, moves exactly the debt and emits the repayment event. A balance that merely covers the debt is not yet a valid repayment, and the product's guided transfer stops one hour before D with a risk warning.
5. **Claim.** Strictly before C, Ben's Vault reveals Y in his claim call, and the contract pays the debt once to Ben's fixed settlement recipient. When that event is final, Bitcoin operations can use Y to return Ana's collateral.

```figure
caption: Value moves only through named contract steps; a transfer or balance alone never advances the loan.
step: Open | The opener creates the loan record and its funding vault.
step: Fund | Exact principal is finalized from the lender's transfers.
step: Accept | X is revealed, the principal is paid and the repayment vault is deployed.
step: Repay | Exact debt is finalized no later than D.
step: Claim | Y is revealed before C and the lender is paid.
```

## Exceptions and recovery

**Funding or acceptance expires.** If the principal is not finalized within the funding window, or Ana does not accept within 24 hours, the USDC is refundable, permissionlessly, only to Ben's fixed settlement recipient. Ana's Bitcoin prefund then follows its own refund route on Bitcoin.

**Too much, too late or partial.** Excess USDC, and funds that arrive too late, follow narrow fixed recovery paths: funding-vault residue goes only to the lender's settlement recipient, and repayment-vault residue only to the borrower's current refund recipient. There is no general token rescue and no way to pick another destination. Tokens sent on the wrong chain or of the wrong kind have no recovery guarantee.

**The borrower misses D.** If exact repayment is not finalized by D, a late or partial transfer does not count, and the loan is in ordinary default for the product. That classification moves nothing on Bitcoin; the lender's Bitcoin route becomes valid at T under Bitcoin's own rules.

**The lender does not claim.** At C the lender's claim becomes permanently impossible, and the borrower's refund recipient freezes. Before C, Ana may make one switch of that recipient, from her committed Base recipient to her own protocol account, signed by that account; no other address can be chosen. At or after C, anyone can trigger a refund that pays the exact repayment once to the frozen recipient. The application's own background job normally submits it, paying the network fee from an ordinary fee wallet that gains no role; if that automation fails, the refund stays available indefinitely. The final event of that refund is the only Base fact that can start the independent validation service's fallback for loans that have it. Lender silence, a missing secret or the passage of time is not that event.

> **A Base refund does not return the Bitcoin**
> After the unclaimed refund, the borrower has the USDC back, but the Bitcoin escrow is unchanged. The lender's Bitcoin route still matures at T, whether or not the fallback secret is published, and Bitcoin cannot see that the borrower repaid. For a loan that has the fallback, a published secret only gives the borrower a competing recovery transaction that must confirm first; the refund, its finality, the publication and the Bitcoin confirmation all have to fit in the roughly 24 hours between C and T.

**A call fails or is retried.** Every duplicate, wrong-state, wrong-loan, wrong-hash, wrong-amount, late, premature or unauthorized call reverts with a named error. Application jobs may retry and reconcile, but must reload the authoritative facts and repeat the same fixed effect. A workforce operator can request an operation that is already fixed, never choose the contract, amount, recipient or outcome.

## Authority boundaries

- **The contract decides Base outcomes.** Funding, acceptance, repayment, claim and refunds happen only through its named transitions; the observation domain decides when their events are final.
- **The lender decides funding.** The product never holds, pools or draws lender capital, and no other party can fund in the lender's place by gaining a role.
- **Paying confers no role.** A participant's Vault payment account can send funding or repayment like any wallet. Paying from it does not make it a protocol caller and does not change any recipient or past terms; whether it may be chosen as a recipient for a new loan is a loan-terms question, covered in the [Loan Terms And Commitments guide](loan-terms-and-commitments.md). Its separate participant-transfer function, which sends USDC to a recipient the participant chooses, has no loan binding and cannot advance or change a loan.
- **The opener only reports Bitcoin readiness.** The organization's opener account is trusted for one thing the contract cannot observe: that the Bitcoin prefund qualified. It cannot choose funds or terms, a funding window opened for an unknown loan is quarantined, and a compromised opener can be replaced only through the seven-day governed upgrade path.
- **Base cannot act on Bitcoin.** Acceptance leaves Bitcoin activation pending, a refund does not recover collateral, and a missed deadline does not move Bitcoin.

## Choices and their reasons

- **Deployed per-loan vaults for funding and repayment.** A dedicated deployed address lets an ordinary wallet or treasury pay with a plain transfer, without constructing contract calls or granting a token allowance. The alternatives were rejected for recorded reasons: a not-yet-deployed predicted address could strand funds if deployment failed, and a shared deposit address would need off-chain attribution and make routing ambiguous. The repayment vault is deployed at acceptance rather than earlier so that no deployment cost is spent on loans that are never accepted.
- **Upgradeable, governed contract.** The loan contract sits behind an upgradeable proxy. A dedicated single upgrade key is used for local and test environments and an intentionally short public beta; sole ownership then moves to a two-of-three multi-signature wallet acting through a seven-day timelock, and stays there for version 1. The recorded tradeoff: immutable code would remove upgrade trust but leave no repair path during the early version, while an upgradeable contract keeps a repair path at the cost of a continuing ability to change behavior. There is no separate emergency upgrade key. Upgrades must keep fixed recipients and lifecycle authority. Existing loans stay on their originating contract and keep their recorded terms, but an approved upgrade becomes the code for every loan that contract holds; there is no separate legacy rule set per loan. Whoever controls upgrades could therefore change the code that holds the funds of every loan; the security records note that such authority can be economically equivalent to holding the funds.
- **No on-chain pause.** The settlement record and the upgrade selection say version 1 has no on-chain pause role. During an incident the application can stop its own actions and its opener, but the contract's valid direct exits stay available. The deployment-lifecycle record still lists narrow pause roles and a paused state; this conflict is open.
- **Participants submit their own secret-revealing calls.** The platform sends a small, bounded amount of Base gas to the participant's protocol account rather than relaying the call, so it never receives a secret or signs a participant action.

## Open, excluded and deferred

- **Cooperative settlement accounting.** The Bitcoin mechanism for a cooperative settlement exists, but how the Base record would account for it is [deferred](../../system-model/contracts/scope/scope-005-cooperative-settlement-operations.md), so the product cannot claim a cooperative close.
- **Platform-paid reveal calls.** Relaying or sponsoring the acceptance and claim calls through a platform signer or paymaster is [deferred](../../system-model/contracts/scope/scope-014-platform-paid-base-reveal-execution.md), because it would change who sees the secret and who signs.
- **Immutable contract conversion** is deferred; the upgrade path described above stays in place for version 1.
- **Liquidation, custody of lender capital and automatic allocation** are outside the system.
- **Paying from Vault payment accounts.** The payment-account design is selected but not yet implemented or verified, and providing Base gas to those accounts in public production is deferred.
- **On-chain pause.** Whether version 1 has a narrow pause role is an open conflict between records, as described above.

The [domain record](../../system-model/domains/base-usdc-settlement-and-funding/domain.md) lists exactly what the domain owns and excludes.
