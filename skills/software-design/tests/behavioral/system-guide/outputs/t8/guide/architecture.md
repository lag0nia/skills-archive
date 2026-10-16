# How the Bitcoin-backed USDC one-loan system works

The system lets one borrower take a USDC loan on the Base network from one lender whose offer the borrower chose, with the borrower's Bitcoin as collateral. It coordinates the two chains so that each participant keeps sole control of their own keys and secrets, and so that every movement of USDC or Bitcoin follows rules both participants approved before any money moved.

## What the system is for

Four kinds of party take part:

- **The borrower** stages Bitcoin as collateral, receives the USDC principal, repays it, and recovers the Bitcoin.
- **The lender** publishes a firm offer for one loan, funds it from a wallet it controls, and is repaid in USDC. If the borrower does not repay, the lender can take the collateral through a Bitcoin transaction the lender signed in advance, which becomes valid three days after the repayment deadline.
- **The company** that runs the product hosts the web application, the application service, the observers and the Bitcoin automation, pays some network fees from its own fee wallets, and lets authorized staff operate it. It holds no key in any collateral script and does not take custody of lender capital, a claim that is only as strong as the governance of the Base contract's upgrades, described below.
- **External services** supply chain data, sign-in, and hosting. Every production application component runs on Cloudflare; the Bitcoin fee-bump helper and its fee wallet run on a separate operator-controlled machine, and package backups are kept outside Cloudflare. An independent evidence-conditioned validation service is part of the selected design but may be used only after its production gate is met, as described below.

A few ideas carry the rest of this guide.

**Two chains that cannot see each other.** Bitcoin holds the collateral in script outputs; a smart contract on Base holds the USDC loan. Neither chain can read the other. Public secrets, rather than a bridge, carry Base outcomes to Bitcoin. In the other direction the Base contract cannot check Bitcoin at all, so it trusts one company-operated service, the funding opener, to open funding only for a loan whose collateral has qualified.

**Three secrets.** Each secret is generated in advance, and only a hash of it (a fingerprint that later proves which secret matches) goes into the loan's terms and Bitcoin scripts. Making a secret public then makes an already signed Bitcoin transaction usable:

- the borrower's secret **X** is revealed when the borrower accepts the loan on Base, and enables the Bitcoin activation that locks the collateral in escrow;
- the lender's secret **Y** is revealed when the lender claims the repayment on Base, and enables the borrower's Bitcoin recovery;
- an optional secret **S**, held by the validation service and published by it after one exact refund event on Base, can enable the same borrower recovery, for loans created once that capability is activated.

**The Vault.** Each participant has a Vault: a dedicated browser application on its own web origin that holds a password-encrypted seed, the per-loan keys and the participant's secrets. It decrypts and signs only on the participant's device. Signing in to the product lets a participant fetch their encrypted Vault data, never open it.

**Signed packages.** The Bitcoin transactions the loan may need are built and signed in advance, each as six fee variants of 10, 20, 50, 100, 150 and 200 satoshis per virtual byte. Because they are signed before they are needed, nobody can later change their amounts or destinations; the application can only choose which signed variant to use.

**Finality.** A Base event counts only once its block reaches Base L1 finality: the point at which the block's data is final on Ethereum, the chain Base settles to. A Bitcoin step counts only after six unchanged confirmations, observed by independent data sources that agree.

The system is deliberately not a public or multi-lender marketplace, a capital pool, a custodian, or an automatic deployer of lender capital, and it never sells the collateral.

## The domains and their roles

The design divides the work into five System Domains, each with a separate authority.

| Domain | Its role |
| --- | --- |
| [Loan Terms And Commitments](domains/loan-terms-and-commitments.md) | Gives every part of the system the same loan: the one-loan offer, the reservation, the final terms and their fingerprint, and the separate description of the deployment environment. It decides meaning, not money movement. |
| [Bitcoin Authorization And Recovery](domains/bitcoin-authorization-and-recovery.md) | Keeps Bitcoin keys and secrets in the participants' Vaults and builds, signs, stores and operates the fixed Bitcoin transactions: prefund, activation, refund, recovery, default, long-stop and cooperative settlement. Bitcoin consensus decides their outcome. |
| [Base USDC Settlement And Funding](domains/base-usdc-settlement-and-funding.md) | Owns what happens to USDC on Base: the loan contract, the per-loan funding and repayment vaults, the lender's funding action, acceptance, repayment, claim and refund to fixed recipients. It never signs or confirms Bitcoin. |
| [Base Observation And Fallback Review](domains/base-observation-and-fallback-review.md) | Turns Base events into finality-qualified facts the rest of the system may rely on, and holds the boundary of the conditional fallback secret. It reports facts; it does not create them or decide who deserves the collateral. |
| [Participant Access And Loan Operations](domains/participant-access-and-loan-operations.md) | Runs the product: accounts, roles and sign-in, the durable loan workspace, commands and background work, the package archive, handoffs to the Vault, and an isolated local demonstration. It coordinates authorities it does not hold. |

Loan Terms And Commitments supplies the identity every other domain checks. Participant Access And Loan Operations coordinates the journey and hands each participant narrowly bound actions to perform in their own Vault. Bitcoin Authorization And Recovery and Base USDC Settlement And Funding settle independently on their own chains. Public secrets and the signed packages link Base outcomes to Bitcoin, and the opener's report that the collateral qualified links Bitcoin to Base. Base Observation And Fallback Review tells the others when a Base event is final enough to act on.

## A loan from start to finish

Follow one illustrative loan through normal repayment. The durations are the approved values; amounts are left out.

### Offer, reservation and agreement

The lender publishes a firm offer for one loan, with its principal, rate and dates. Publication is the lender's standing acceptance of those commercial values. A borrower who selects the offer reserves it atomically for 24 hours; the system creates a stable random loan identity, and a borrower who selects it at the same moment loses without creating a second loan.

Each participant then opens their Vault. The Vault allocates a fresh Bitcoin key for this loan only, confirms the participant's payout destinations, generates or reuses the participant's secret, saves the updated encrypted Vault data, and only then returns public results: public keys, addresses and the secret's hash. The Vault preparation step described here is a current design change whose implementation has not yet been delivered.

The application assembles a complete final terms candidate and shows it to both participants. The borrower approves that exact version, and the canonical terms commit once, on the final matching approval; whether the lender must also approve it is open, as the note below explains. Changing any field the fingerprint covers invalidates earlier approvals.

> **An open question at this step**
>
> The sources disagree on whether the lender approves again here. The system-level wording says publication is the lender's standing acceptance and reservation needs no second lender approval; the detailed terms rules require the lender, like the borrower, to approve the exact final terms before they commit. One state record treats this final-terms approval as distinct from the commercial approval given at publication, which may reconcile the two, but the package has not decided. Read this step as open.

### Collateral staged before money moves

The borrower sends Bitcoin to a **prefund** output: a staging output that only the borrower can refund to itself after a timelock of about 72 hours. The prefund must be visible, even unconfirmed, before the 24-hour reservation ends. A reservation whose terms never committed and that saw no prefund simply expires. If the terms committed but no valid prefund is visible in time, the reservation is cancelled, the offer reopens, that borrower cannot select the same offer again, the borrower's infraction count rises by one, and both participants are notified. A valid prefund still unconfirmed after 72 hours goes to the operations team and the borrower is asked to fee-bump it; the company cannot add fee to the borrower's prefund itself.

Once the exact prefund is observed, even with zero confirmations, the Bitcoin automation builds the initial package set: six activation variants, which move the prefund into escrow, and six refund variants. The borrower signs all twelve; the lender adds its signature to the six activation variants. The application stores every signed package in its primary archive and issues a receipt only after verifying them. Signing against an unconfirmed prefund is a recent clarification of the design: earlier delivery evidence does not verify it, and the implementation change has not yet been delivered.

None of this is collateral yet. The prefund qualifies only after six unchanged confirmations, fresh agreement between independent Bitcoin data sources, the recorded package receipt, and at least 67 hours left before the borrower's refund becomes valid.

### Funding and acceptance

Once the collateral qualifies, the opener has the Base contract open a 24-hour funding window and deploy an immutable funding vault for this loan. The lender transfers USDC to it from any wallet it controls, in one or several transfers. A participant may also pay from a Vault payment account: a separate Base account kept in the participant's Vault, whose address is shown only once the participant's backup can restore it. A transfer or balance is only provisional: a separate finalization call moves exactly the principal into the loan contract, and only its L1-final event counts as funding.

Finalization records a 24-hour acceptance deadline, counted from its Base block rather than from finality, and acceptance is allowed only while at least 19 hours remain before the prefund refund becomes valid. Acceptance takes two deliberate confirmations. The borrower first reviews the nonsecret facts; the Vault then unlocks X and prepares the exact Base transaction; a second confirmation tied to those exact bytes authorizes the Vault to sign and submit it. The contract atomically pays the principal to the borrower's fixed recipient, makes X public, and creates the loan's repayment vault.

### Activation

Acceptance on Base is not yet collateral in escrow. The Bitcoin automation inserts the public X into one signed activation variant and broadcasts it. Until that transaction is confirmed the loan is **activation pending**, and the automation keeps resuming and rebroadcasting it rather than building anything new. Before any mempool accepts it, the automation may escalate to a higher signed fee variant; once it is accepted, only a separately approved fee-bump child transaction can add fee. Any other signed activation variant could still confirm instead; whichever actually confirms becomes the escrow.

After six confirmations, the automation builds the exit packages for that exact escrow: six borrower recovery variants and six borrower long-stop variants, which the borrower signs, and six lender recovery variants, which the lender signs. When all eighteen are signed and archived with a receipt, the loan is **package-ready active**; until then it is explicitly shown as waiting for terminal signatures. One older statement in the records still describes this set as twelve packages; that discrepancy is open.

### Repayment and recovery

Anyone may send USDC to the repayment vault, but only exact debt finalized on Base no later than the repayment deadline, D, is valid repayment. The guided repayment flow closes one hour before D to leave time for finalization; later direct transfers may be returned rather than counted. The lender then reveals Y through its Vault, after fresh sign-in, to claim the repayment strictly before the claim cutoff, C, two days after D. The contract pays the lender's fixed recipient once and makes Y public. Once that event is L1-final, the Bitcoin automation inserts Y into the recovery transaction the borrower signed after activation, and broadcasts it. The loan closes when that Bitcoin spend confirms.

```figure
caption: Each step from Base to Bitcoin carries a public secret, never a signature: a Base event only makes usable a transaction the participants already signed.
step: Offer | The lender publishes a firm one-loan offer as standing acceptance of its commercial values.
step: Reserve and agree | The borrower reserves it; Vaults prepare keys and secret hashes; the final terms commit.
step: Prefund | The borrower stages Bitcoin; activation and refund packages are signed and archived.
step: Fund | The lender pays the funding vault; exact principal is finalized on Base.
step: Accept | The borrower reveals X on Base and receives the principal.
step: Activate | X completes a signed activation; exit packages are signed for the confirmed escrow.
step: Repay and claim | Exact debt is finalized by D; the lender reveals Y before C.
step: Recover | Y completes the borrower's signed recovery; the loan closes on confirmation.
```

## Identity, authority and sources of truth

### One loan, one meaning

Every record, signed package, Base call, observation and Vault action names the same loan identity and the fingerprint of its canonical terms. The terms bind the participants, the selected offer and reservation, amounts, deadlines, the loan's Bitcoin keys, each participant's external Bitcoin destinations, the Base addresses and fixed recipients, and the hashes of X, Y and, where used, S. A separate deployment description binds the environment: chain, contracts, USDC asset, Bitcoin network and timing policy. Any artifact for the wrong loan, chain, asset, key, destination or version is rejected. A matching identifier proves which agreement an artifact describes; it does not authorize anything.

### Who decides what

| Fact or action | Who decides | What does not count |
| --- | --- | --- |
| The agreement's meaning | The committed canonical terms | A workspace copy or acceptance snapshot |
| Collateral, signatures, timelocks and the one final Bitcoin spend | Bitcoin consensus | A Base record or application status |
| Funding, acceptance, repayment, claim and refund | The Base contracts, once the named event is L1-final | A raw transfer, a balance or a submitted transaction |
| Keys, seeds, unrevealed secrets and payment signing | Each participant's Vault | Product sign-in, account recovery or the application service |
| Whether, when and from which wallet to fund | The selected lender | The product, which cannot pool, hold, substitute or deploy capital |
| Which Base events happened and how final they are | The Base observer reports them | The observer does not create the fact or approve its consequence |
| Commands, background work, projections and the package archive | The application service | It holds no private authority, capital or chain truth |

The company's Bitcoin fee wallet can fund a separate fee-bump child transaction without changing the signed parent, and its Base fee wallet can submit calls whose effect is already fixed; neither gains any choice of amount, recipient or secret. Staff act through separately authorized operator roles: viewers read status and audit; operators may acknowledge incidents, pause automation, request rechecks, choose an already signed fee variant, export one exact fee-bump request, and request Base calls whose effect is fixed; security administrators manage operator access. The validation service, once activated, can only publish or withhold one loan's committed secret.

### What counts as evidence

The system keeps every intermediate state distinct. A command can be accepted, a transaction submitted, an event observed or marked safe, a Bitcoin transaction broadcast or seen in a mempool, and none of these is the outcome. A Base event becomes a lifecycle fact only once its block reaches Base L1 finality, which Base describes as roughly 20 minutes; the design accepts that delay for one uniform rule at every consequential step. A Bitcoin gate needs six unchanged confirmations and fresh agreement between independent sources. The application may show earlier progress, labeled as such.

## When things go wrong

### Origination stops before acceptance

If funding never finalizes, or the borrower never accepts in time, anyone may trigger the Base refund, which can pay only the lender's fixed recipient. On the Bitcoin side, once the prefund refund timelock has matured and independent sources confirm the prefund is unspent and X was never accepted, the automation broadcasts one of the borrower's signed refund variants. If X was accepted, the automation never broadcasts the refund and activation recovery continues instead; the borrower's signed refund nevertheless stays valid on Bitcoin, which is the race described next. The company cannot accept on the borrower's behalf.

### Principal is paid but activation does not confirm

Base acceptance and Bitcoin activation are not one atomic step. If the activation transaction is not broadcast, is censored or underpriced, or the archive is lost, the borrower's refund could mature and confirm first, leaving the lender's principal unsecured. The 19-hour margin, the persistent activation-pending recovery and fee-bump escalation reduce this risk; the records keep it as a residual risk the lender bears.

### The borrower does not repay

Without exact debt finalized by D, the loan is classified as an ordinary default. Lender silence, a missing secret or an observer failure is never treated as default. After T, three days after D, measured by Bitcoin's own consensus time, the lender's signed recovery transaction becomes valid. The lender exports it and broadcasts it through its own means; the company does not broadcast default transactions automatically.

### The borrower repays but the lender does not claim

At C the lender's Base claim is permanently disabled and the borrower's refund recipient is frozen. Anyone may then trigger a refund of the exact repayment to that recipient; before C, the borrower may switch it once, only to the borrower's own protocol address on Base.

> **Valid repayment alone does not return the Bitcoin**
>
> The Base refund returns the USDC, but the collateral is still in escrow, and Bitcoin cannot see that the borrower repaid. Recovery through S exists only for loans created after the validation-service capability is activated. The lender's signed recovery still becomes valid at T, one day after C, and the lender, or anyone who stole that signed transaction, can then take the collateral even though the borrower repaid; the records count this among the most important residual risks. A borrower long-stop transaction becomes valid at B, ten days after D, without Y or S. After B both can be valid at once, and whichever confirms first wins. None of this is evidence of borrower default, and nothing guarantees that the collateral returns.

### Several exits become valid at once

Normal recovery, lender recovery, the long-stop and any cooperative settlement all spend the same escrow output, so only one can confirm. The application's view can be stale, a reorganization can change the picture, and a transaction may sit only in one provider's mempool. The system treats only the confirmed spend as the outcome and keeps the losing transactions as history.

### Outages, lost passwords and compromise

All production application components share one Cloudflare failure domain despite separate projects, credentials and releases. A Cloudflare-wide outage can suspend the product, the Vault, the application service, observation and Bitcoin automation together; the chains keep running, and the application accepts no new consequential command and claims no chain result until it returns and has reconciled both chains. There is no live fallback provider and no stated recovery-time or recovery-point objective. Signed packages are copied hourly to separate locked storage outside Cloudflare, so package data can be recovered; that is not a running service, and the newest packages may exist only in Cloudflare until the next backup. A backup outage lasting 24 hours pauses the qualification of new loans; existing loans continue.

A forgotten Vault password cannot be recovered by anyone: account recovery restores sign-in and access to encrypted data only. The participant's own twelve-word seed phrase backs up the Bitcoin key material, but no mechanism can rebuild a forgotten password or the secrets X and Y. A lender who loses Vault access therefore cannot reveal Y, and a repaid loan follows the path in the note above.

The company-operated opener is the Base contract's only source for Bitcoin qualification. An opened loan the application never committed is quarantined and never shown as a product loan. A compromised opener can be replaced only through the published, seven-day-delayed upgrade path. During an incident the company can pause its own frontend, application service and opener, but that is not an on-chain pause: valid direct contract calls keep working.

 The records treat a malicious official frontend that captures both participants' keys during signing as a more important threat than two unrelated account takeovers, and treat compromise of the Base contract's upgrade governance as a system-wide risk; the security records for a [shared frontend compromise](../system-model/contracts/security/sec-015-common-frontend-captures-both-participants-during-origination.md) and an [upgrade or administrator compromise](../system-model/contracts/security/sec-017-base-upgrade-administrator-or-operational-signer-compromise.md) explain these attack paths and their controls.

## What the design claims today

The design separates five claims. Deterministic local verification exercises disposable fixtures and failure injection only. The target outcome is a developer-run local demonstration in which two isolated participants use the real product, Vault, application service, Base contracts, observer and Bitcoin automation to complete one loan through normal repayment and confirmed borrower recovery; it is recorded as in progress and not yet runnable. Testnet deployment, mainnet deployment and activated production operation are not claimed; each needs its own credentials, funding and evidence, and production activation also needs an intentional enablement action. The validation-service fallback is selected but needs counsel approval and implementation evidence before any loan may rely on it, and the Vault payment account's signing profile is recorded as not yet verified.

## Choices and open questions

### Consequential choices and their reasons

- **Firm one-loan offers.** Lenders publish browsable firm offers that a borrower reserves directly, instead of invitations or account search; the selected lender still decides separately whether and when to fund.
- **Terms separate from the environment.** Loan facts and deployment facts are encoded separately so that signatures, manifests and chain actions cannot bind to different loans and every package stays reproducible.
- **Base L1 finality for every consequential step.** Additional waiting is accepted for one uniform, safety-first rule.
- **Fixed signed fee variants.** The Bitcoin transactions are signed before use, so fees are chosen among six signed variants, with a separately approved fee-bump child once a transaction is in a mempool or beyond the highest variant. What selection returns when no variant is high enough is open, as listed below.
- **Immutable per-loan vaults on Base.** Any wallet can fund or repay with an ordinary transfer, and payers approve nothing on the loan contract.
- **A governed, upgradeable loan contract.** The contract has one upgrade ownership path: a dedicated single upgrade key for local and test use and the intentionally short public mainnet beta, after which the same sole ownership moves to a two-of-three multisignature behind a seven-day public timelock for the rest of the first version. The recorded reason is a repair route during the early beta, with public notice and compatibility evidence before every upgrade, instead of immutable code with no repair path. An approved upgrade changes the code for every loan the deployment holds; no loan is moved to another deployment. There is no on-chain pause.
- **One hosting provider.** Using Cloudflare for every production application component is an explicit simplicity trade-off, not a continuity claim.
- **No forgotten-password recovery.** Any server, operator or escrowed mechanism able to rebuild a Vault password or key would introduce hidden custody of participant authority.

### Open conflicts

- **Lender approval of final terms.** Whether the lender's approval of the exact final terms is the second lender approval the system-level wording rules out remains undecided, as described in the agreement step above.
- **No eligible fee variant.** When no signed variant is high enough for the current fee estimate, one source selects the highest variant, records fee-bump eligibility and alerts, while the action contract returns a fail-closed result. Neither is authorized.
- **Terminal package count.** One responsibility record still calls the post-activation package set twelve packages, while the flows, invariants and constraints specify eighteen.

The [Bitcoin domain record](../system-model/domains/bitcoin-authorization-and-recovery/domain.md) and the [Loan Terms domain record](../system-model/domains/loan-terms-and-commitments/domain.md) list each side of these conflicts.

### Excluded and deferred

These capabilities are outside this design, each with its own revisit condition:

- [automatic company broadcast of lender default transactions](../system-model/contracts/scope/scope-001-automatic-lender-default-broadcast.md);
- [institutional last-resort collateral recovery](../system-model/contracts/scope/scope-002-institutional-last-resort-collateral-recovery.md);
- [activation on behalf of a borrower who does not respond](../system-model/contracts/scope/scope-003-borrower-nonresponse-activation-recovery.md);
- [protection or put-option operations](../system-model/contracts/scope/scope-004-protection-or-put-option-operations.md);
- [complete cooperative-settlement operations](../system-model/contracts/scope/scope-005-cooperative-settlement-operations.md);
- [stronger Vault recovery](../system-model/contracts/scope/scope-006-stronger-participant-vault-recovery.md);
- [conversion to an immutable loan contract](../system-model/contracts/scope/scope-007-immutable-base-contract-conversion.md);
- [public or multi-lender matching, pooled or custodial capital and automatic capital deployment](../system-model/contracts/scope/scope-011-public-multi-lender-pooling-custody-and-automatic-capital.md);
- [Bitcoin liquidation and its surplus or shortfall](../system-model/contracts/scope/scope-012-bitcoin-liquidation-surplus-and-shortfall.md);
- [platform-paid relaying of secret-revealing Base calls](../system-model/contracts/scope/scope-014-platform-paid-base-reveal-execution.md);
- [replacing the selected identity provider](../system-model/contracts/scope/scope-015-application-owned-authentication-replacement.md).

Marketing and pricing, legal and regulatory analysis, and the final interface design are also outside the technical design.

The [technical architecture record](../system-model/architecture.md) holds the exact boundaries and sources of truth.
