# How the Bitcoin-backed USDC one-loan system works

The system lets one borrower borrow USD Coin (USDC) on the Base network from one selected lender, secured by the borrower's Bitcoin, while each participant keeps its own keys and secrets. Its central design rule is that no screen, server, operator or data provider can stand in for an authority it does not hold: money and collateral move only through fixed routes that the participants authorized in advance and that the Base contracts or Bitcoin consensus enforce.

## What the system is for

A lender publishes a firm offer to lend a fixed amount of USDC, a dollar-denominated token, for one loan. A borrower who wants that loan reserves the offer, locks Bitcoin as collateral, receives the USDC, and later repays it to get the Bitcoin back. The product coordinates these steps across two independent blockchains: Base, where the USDC moves under a loan contract, and Bitcoin, where the collateral sits in a script that only pre-agreed transactions can spend.

Several parties take part, and each has a deliberately limited role:

- **The borrower** supplies the Bitcoin collateral, accepts the funded loan, and repays it.
- **The selected lender** publishes the offer, decides whether and when to send its capital, and claims the repayment.
- **The organization** that runs the product operates the web application, the coordination service and the automation that submits already-authorized actions. Its staff (called workforce operators) can review incidents and request fixed operations. The organization holds no key that can spend the Bitcoin collateral.
- **An independent validation service** may, for loans created after a later activation gate, release a backup secret when a repayment was refunded because the lender never claimed it. It is selected in the design but not yet available for production use.
- **External providers** supply blockchain data, fee estimates and transaction relay, and host the application. They report and carry facts; they never decide them.

A few ideas run through every part of the design:

- **The Vault.** Each participant has a dedicated Vault: a separate browser application on its own web origin that creates and encrypts the participant's keys and secrets under the participant's Vault password, and signs locally. Signing in to the product lets a participant fetch their encrypted Vault data; it never decrypts it, and the organization never receives the password, keys or unrevealed secrets.
- **Three secrets with separate jobs.** The borrower's secret, called **X**, is revealed only when the borrower deliberately accepts the funded loan; publishing it on Base pays out the principal and enables the fixed Bitcoin transaction that locks the collateral. The lender's secret, **Y**, is revealed when the lender claims the repayment; once public, it completes the borrower's pre-signed transaction that returns the Bitcoin. An optional third secret, **S**, held by the independent validation service, can complete that same return transaction in one narrowly defined failure case. Each secret has a hash commitment recorded in the loan terms, so anyone can check a revealed secret against it.
- **Pre-signed packages.** Bitcoin transactions are prepared in advance as partially signed Bitcoin transactions (PSBTs), each in six fee variants, and signed by the participants in their Vaults. A signed package is evidence that the participant authorized those exact bytes; it does not let anyone choose a new destination or amount.
- **Prefund and escrow.** The borrower first sends Bitcoin to a staging output called the **prefund**. Only after the borrower accepts the loan does a pre-signed activation transaction move it into the **escrow**, the output that secures the active loan. The two are separate objects with separate rules.
- **Deadlines.** The repayment deadline **D** is fixed in the loan terms. The lender's claim window closes at **C**, two days after D. The lender's own Bitcoin recovery route becomes valid at **T**, three days after D, and the borrower's last-resort "long-stop" route at **B**, ten days after D.

Version 1 is deliberately narrow. It is not a public or multi-lender marketplace, it does not pool or hold lender capital or deploy it automatically, and it never sells collateral: liquidation is outside the design. On default the lender's fixed route takes the whole collateral; there is no return of any surplus to the borrower and no enforcement of a shortfall.

## The domains and their roles

The system is divided into five domains. Each owns one kind of truth and must not acquire another's authority.

| Domain | Its role |
| --- | --- |
| [Loan Terms And Commitments](domains/loan-terms-and-commitments.md) | Defines the one shared meaning of a loan, from the published offer and reservation to the committed final terms (whether the lender approves them separately is an open conflict), and the separate description of the deployed environment. Every other domain checks its artifacts against this meaning. |
| [Bitcoin Authorization And Recovery](domains/bitcoin-authorization-and-recovery.md) | Builds, validates, stores and operates the pre-signed Bitcoin transactions, and keeps each participant's Bitcoin keys and secrets inside their own Vault. Bitcoin consensus, not the application, decides which transaction wins. |
| [Base USDC Settlement And Funding](domains/base-usdc-settlement-and-funding.md) | Owns the loan contract on Base and its per-loan funding and repayment vaults: exact funding, acceptance, repayment, lender claim and fixed-recipient refunds. It never moves Bitcoin. |
| [Base Observation And Fallback Review](domains/base-observation-and-fallback-review.md) | Turns Base contract events into trustworthy, finality-qualified facts for the rest of the system, and defines the conditional fallback in which an independent service may publish the backup secret. |
| [Participant Access And Loan Operations](domains/participant-access-and-loan-operations.md) | Provides the product itself: accounts and roles, the durable loan workspace, commands and background jobs, payment coordination, operator access, and an isolated local demonstration. It coordinates actions but holds no participant secret and no chain truth. |

The domains depend on each other in one direction of meaning and another of evidence. The loan terms are consumed by everyone. The application domain carries requests from participants to their Vaults and to the chains, and shows them the results. The Base contracts and Bitcoin consensus produce the facts; the observation domain qualifies Base facts and the Bitcoin domain reconciles Bitcoin facts before anything else relies on them. A published secret is the only thing that crosses from Base to Bitcoin, and it can only complete a transaction the participants already signed.

## A loan from start to finish

The following case is illustrative. Ana is a borrower and Ben is a lender; amounts and names are examples, not requirements.

**Agreeing the loan.** Ben publishes a firm offer to lend a fixed USDC amount against Bitcoin collateral. Publishing it is Ben's standing approval of those commercial values. Ana selects the offer, which atomically reserves it for her and creates the loan's permanent identity together with a commercial draft. She then has 24 hours to produce a valid Bitcoin prefund; one visible in the Bitcoin mempool by then keeps the reservation, and otherwise the reservation is cancelled, the offer reopens, Ana is blocked from that offer and receives an infraction. Each participant's Vault then sets aside a fresh Bitcoin key for this loan, confirms where that participant wants to be paid, and creates its role's secret (X for Ana, Y for Ben), returning only public information such as the secret's hash. The application assembles the complete final terms. In the detailed terms records, Ana and Ben each approve that exact version and the second matching approval commits it. The architecture record and the offer-and-reservation records say instead that the reservation binds the loan with no second lender approval. Both positions trace to user decisions, and the conflict is unresolved.

**Staging the collateral.** Ana sends Bitcoin to the prefund output defined by the terms. As soon as that exact transaction is seen, even before it confirms, the Bitcoin domain builds six activation variants and six refund variants. Ana signs all twelve in her Vault; Ben adds his signature to the six activation variants. The application stores the signed set in its primary archive and issues a receipt only after every object is verified. When the prefund has six unchanged confirmations and at least 67 hours remain before Ana's refund route opens, the loan qualifies and the application opens a funding window on Base.

**Funding and acceptance.** The loan contract deploys a funding vault for this loan alone: a dedicated, ownerless Base address, unrelated to the participants' Vaults, that only the contract's fixed rules can move money from. Ben sends USDC to it from any wallet he controls; partial transfers add up. (The design also lets him pay from a payment account in his Vault, which is not yet verified in implementation.) Once the balance covers the principal, anyone can call the contract to finalize exactly the principal, which starts a 24-hour deadline for Ana's acceptance. The application opens her acceptance step only once that event is final and a fresh check shows at least 19 hours remaining before her prefund refund route opens. In her Vault she first confirms the terms, then confirms the exact prepared transaction; her Vault reveals X on Base. In one contract step the principal goes to Ana's fixed recipient address and the loan's repayment vault is deployed.

**Activating the collateral.** Base acceptance is not yet Bitcoin activation. With X now public, the application completes one of the activation transactions Ana and Ben signed earlier and broadcasts it. Only when an activation transaction has six confirmations does the escrow exist, and the next transactions are built for whichever variant actually confirmed. The Bitcoin domain then builds the eighteen transactions that can later spend the escrow: six that return the Bitcoin to Ana using Y, six that pay Ben after the lender deadline, and six long-stop transactions that return it to Ana after the long-stop deadline. Ana signs her twelve and Ben signs his six; once all are stored with a verified receipt, the loan is active. (One readiness sentence in the records still counts twelve exit packages; see the open conflicts below.)

**Repaying and closing.** Before D, Ana sends the exact debt to the loan's repayment vault, from any wallet, after confirming the refund recipient the application shows her. The repayment must then be finalized on Base no later than D; the application normally submits that call, and anyone may. Before C, Ben claims it: his Vault reveals Y on Base and the contract pays the debt to his fixed recipient. Y is now public, so the application inserts it into Ana's pre-signed return transaction and broadcasts it. When that transaction confirms on Bitcoin, Ana has her collateral back at the destination she chose in the terms.

```figure
caption: Each step that moves value waits for evidence from the chain that owns it, never for an application status.
step: Agree | The final terms are committed; whether the lender approves them separately is open.
step: Stage | The prefund confirms and the first twelve packages are signed and archived.
step: Fund | The lender's USDC is finalized on Base.
step: Accept | The borrower reveals X and receives the principal.
step: Activate | The escrow reaches six Bitcoin confirmations and its eighteen exit packages are archived.
step: Repay | The exact debt is finalized on Base by the deadline.
step: Claim | The lender reveals Y and receives the repayment.
step: Return | The borrower's pre-signed return transaction confirms on Bitcoin.
```

Throughout, the evidence that counts is the chain's own: a Base contract event that has reached Base's layer-1 finality, and a Bitcoin transaction with the required confirmations. A submitted transaction, a balance, an application screen or a relay response is progress information only. The [canonical flow records](../system-model/behavior/flows/flow-001-origination-preparation-and-qualification.md) give the exact order and failure routes of each stage.

## Identity, authority and sources of truth

**One loan, one meaning.** Every artifact refers to the same loan through a random loan identifier and the hash of its canonical terms. The terms bind the participants, amounts and deadlines, each participant's Bitcoin public key and payout destination, the fixed Base recipients, and the commitments to X and Y. The selected offer and reservation, and the commitment to S for loans that have the fallback, are bound to the same loan as well; the records differ on whether they sit inside the hashed terms themselves or in the reservation and binding records around them. A separate deployment description identifies the environment: chain, contracts, token, Bitcoin network and timing policy. Any artifact that cannot prove it belongs to this exact loan and environment is rejected rather than reinterpreted.

**Keeping identities apart.** A participant has several identities that look alike but carry different authority: a per-loan Bitcoin key, a protocol account on Base that makes their secret-revealing contract calls, a separate Vault payment account that can send USDC, an external Bitcoin payout destination, and fixed Base recipient addresses. Using one does not grant the authority of another. A payment account that pays the principal or the debt does not become a recipient. Whether it may be chosen as a recipient for a new loan is an open conflict: the origination flow allows it for a recoverable account with fresh approvals and a disclosure of its separate transfer function, while the architecture record and the lender authorization record say it is never a term-bound recipient.

The table summarizes who decides what.

| Fact or power | Who holds it | What does not hold it |
| --- | --- | --- |
| The meaning of the loan | The committed loan terms | Workspace copies, acceptance snapshots, screens |
| Participant keys, Vault password, unrevealed X and Y | Each participant's Vault | The organization, product login, backups |
| Whether and how to fund | The selected lender | The product, which cannot pool, hold or draw capital |
| Funding, acceptance, repayment, claim and refund | The Base loan contract, once the event reaches finality | Raw transfers, balances, submitted transactions |
| Prefund, escrow, timelocks and the one final spend | Bitcoin consensus | Base records, relay responses, application labels |
| What happened on Base | The observer reports it with provenance and finality | Operators, who can request a recheck but not change a fact |
| Release of S | The independent validation service, only after the exact finalized refund event | The organization, borrower and lender |

The organization's own wallets are bounded too. Its Bitcoin fee wallet can pay for a separate child transaction that speeds up a stuck parent without changing it, and its Base fee wallet can submit permissionless calls whose effect is fixed by the contract. Neither gains a recipient, capital, debt, secret or contract authority. The [technical architecture record](../system-model/architecture.md) states these boundaries exactly.

## Where it runs and what is claimed today

All production application components of version 1 run on Cloudflare: the product web application, the application programming interface (API) with its database, the Base observer, the separately deployed Vault, and the Bitcoin operations worker. The operator's manual fee-bump tooling, with its own Bitcoin node, and the backups sit outside it. They keep separate projects, credentials and release processes, but they share one provider failure domain. The application database records each required state change together with the job that carries it out, so a crash or a lost wake-up call cannot lose work; a scan every minute picks up anything missed.

A Cloudflare-wide outage can therefore stop the product, the Vault, the API, observation and Bitcoin automation together. The chains keep running, but the application accepts no new consequential command and claims no chain result while it is down. When it returns, it reconciles Base and Bitcoin before resuming jobs. Version 1 has no live fallback provider and states no recovery time or data-loss objective; hourly backups to a separate cloud account protect the signed packages and encrypted Vault data, not continuity of service.

The target of this design version is narrower than production. It requires a deterministic local verification environment and a developer-run local demonstration in which two isolated participants use the real product, Vault and services to complete one loan through normal repayment and confirmed return of the collateral.

| Profile | Local verification | Local demonstration | Testnet, mainnet, production |
| --- | --- | --- | --- |
| What this version claims | Disposable automated scenarios across all parts | A developer can start, resume and reset the whole system and complete the browser journey | No claim |
| What it does not prove | A runnable product or any deployment | Testnet or mainnet deployment, real-provider compatibility, production use | Each needs its own credentials, funding, deployment evidence and, for production, monitoring, legal and security gates and an intentional enablement |

Demonstration identities, tokens, wallets and substitutes exist only inside the local profile, which refuses to start if any setting points at a public network or credential. A configuration named after an environment proves nothing by itself; the [runtime profile boundary](../system-model/contracts/scope/scope-013-runtime-profile-claims-and-activation-gates.md) lists the evidence each claim needs.

## When things go wrong

**Before the borrower accepts.** If the loan stops before X is revealed on Base, through expiry, cancellation or failure, the two chains unwind separately. The funding contract returns the lender's USDC only to the lender's fixed recipient, and after the prefund's relative timelock (about 72 hours after its first confirmation) the application may broadcast one of the borrower's pre-signed refund transactions, but only with fresh evidence that the prefund is unspent and that X was never accepted. No company action can accept on the borrower's behalf; a borrower who never responds simply gets the expiry and refund path.

**After acceptance but before the escrow confirms.** Paying the principal on Base and activating the escrow on Bitcoin are not atomic. Once X is final, the loan is "activation pending", and the application must keep pushing the activation until it confirms. Before the selected transaction enters the Bitcoin mempool, a higher pre-signed fee tier may still be chosen; after that, only an operator-approved fee-bump, a separate child transaction paid from the organization's fee wallet, can add fee. It may not refund the prefund or pay the principal again. The gate before acceptance leaves at least 19 hours before the borrower's refund route opens, but if activation still fails to confirm in time, a borrower refund could win the race. The records call this the principal residual cross-chain risk; it falls on the lender.

**When the eighteen exit packages are not complete.** If a participant does not sign their exit packages after the escrow confirms, or the archive receipt fails, the loan stays explicitly "terminal signing pending". The principal and escrow cannot be reversed, so the application keeps prompting and alerting, and never presents the loan as fully ready.

**When the borrower does not repay.** If no exact repayment is final by D, the loan is classified as an ordinary default for the product. That classification does not move Bitcoin. After T, Bitcoin itself accepts the lender's pre-signed transaction to the lender's fixed destination. In version 1 the lender exports it and broadcasts it manually; the organization does not broadcast default transactions.

**When the borrower repays but the lender never claims.** This is the hardest case. Valid repayment does not release the Bitcoin by itself; only Y or S can complete the return transaction. At C the contract permanently disables the lender's claim and lets anyone refund the exact repayment once to the borrower's recipient, frozen at that moment. That refund settles the USDC, but the escrow is still unspent. The lender's route becomes valid at T for every loan and can take the collateral even though the borrower repaid. For loans created after the validation service is activated, its published S can complete the borrower's return transaction, which protects the borrower only if it confirms before the lender's transaction. The borrower's long-stop becomes valid at B, and whichever valid transaction confirms first wins.

> **Repayment does not guarantee the collateral comes back**
> If the lender never reveals Y, the borrower gets the USDC back on Base, but the Bitcoin remains exposed to the lender's matured route until a return transaction confirms. Only loans created after the fallback service is activated have the extra S route, and even then publication can fail. The long-stop does not cancel the lender's route; both can be valid at once.

**When both participants agree.** Borrower and lender can freshly sign a cooperative settlement of the escrow with their existing loan keys. The Bitcoin mechanism is designed, but the matching Base accounting, signing-session experience and support procedures are deferred, so the product cannot yet claim cooperative settlement as an operational capability.

**When data or providers fail.** Base observation uses a primary and a fallback provider; one healthy provider is enough for a finalized fact, but if both fail or disagree, new Base-dependent actions stop while existing final facts stay visible. Bitcoin evidence must agree across independent sources before any gate passes. A relay timeout is treated as unknown, not failed, and is reconciled before any retry; the application never sends a different transaction to replace it.

**What the system cannot guarantee.** It cannot make Base acceptance and Bitcoin activation atomic. No server, operator or product mechanism can recover a forgotten Vault password; the participant's own 12-word recovery phrase restores Bitcoin key material, but an unrevealed X or Y is lost with the password. It cannot prevent a matured, correctly signed Bitcoin transaction from confirming because of a Base fact, since Bitcoin cannot see Base. It cannot keep running through a Cloudflare-wide outage. And it does not decide legal questions: whether the product counts as non-custodial, and the legal approval the fallback service needs, are outside this technical design.

Security analysis follows the same logic: it asks what capability an attacker would gain at which stage of a loan, not only whether one stolen item is harmful alone. A particularly serious shared risk is a malicious version of the Vault delivered to both participants of the same loan, because it could capture both matching keys at once, and two matching keys can redirect the escrow. One malicious release could collect matching keys across many loans and use them later. Version 1 has no multi-person control over Vault releases, so this risk remains explicit. The [security boundaries](../system-model/contracts/security/sec-015-common-frontend-captures-both-participants-during-origination.md) record each such threat with its controls.

## Choices and open questions

Several choices shape the whole system, each with a recorded reason:

- **Act only on Base layer-1 finality.** The application may show a Base event as soon as it is seen, but it triggers no lifecycle change or Bitcoin action until the block reaches Base's layer-1 finality, roughly 20 minutes. The [finality selection](../build/records/selections/sel-013-base-l1-finality-and-reorg-reconciliation.md) accepts that delay in exchange for one simple rule at every cross-chain boundary.
- **One managed provider.** Running all production application components on Cloudflare was chosen as an explicit simplicity tradeoff: separate accounts and projects limit narrower failures, but the [topology selection](../build/records/selections/sel-024-managed-provider-failure-domain-topology.md) states plainly that this is not provider independence.
- **Per-loan funding and repayment vaults.** Funding and repayment use deployed, ownerless per-loan addresses so that any ordinary wallet transfer reaches the right loan without the payer constructing contract calls, and no platform key can choose where money goes.
- **Governed upgrades instead of immutable code.** The Base loan contract stays upgradeable, to keep a repair path during the first version, and the settlement records say it has no on-chain pause; one deployment record still lists a narrow pause role, an open conflict. After a short beta under one dedicated upgrade key, ownership moves to a two-of-three multi-signature wallet acting through a seven-day timelock. Whoever controls upgrades could change the contract that holds the funds of every loan, and the security records note that such authority can be economically equivalent to holding the funds; the organization's account that opens funding windows is likewise trusted, only to report that the Bitcoin prefund qualified. Making the contract immutable is deferred.
- **An independent, narrowly scoped fallback.** The backup secret is held by one contracted independent service that can only publish it after verifying one exact event, rather than by the organization, so that the company has no release override.
- **Manual lender default.** Lenders broadcast their own default transactions; automatic organization broadcast is deferred until its authority and safety model is designed.

The domain map itself has a mixed origin. The user approved adding Participant Access And Loan Operations as a separate domain for the product application, on the agent's recommendation. The boundaries of the other four domains were chosen by the agent; no exchange presented the complete list for approval.

Several source conflicts remain open, and this guide does not choose between their sides:

- **Final approval of the terms.** The architecture record and the offer-and-reservation records say a reservation binds the canonical loan without a second lender approval. The detailed terms records say a reservation creates only the loan identity and a commercial draft, and that the lender, like the borrower, must explicitly approve the final terms. Both positions trace to user decisions. The [Loan Terms And Commitments guide](domains/loan-terms-and-commitments.md) explains both.
- **Payment account as recipient.** One set of records allows a Vault payment account as a recipient for a new loan under conditions; another says it is never a term-bound recipient.
- **Where some bindings sit.** The records differ on whether the selected offer, the reservation and the commitment to S are part of the hashed loan terms or bound around them.
- **No eligible fee tier.** The fee contract and a resolved fee ticket say the highest pre-signed tier is selected with an alert, while the contract's selection action says selection fails closed when no tier qualifies.
- **Number of exit packages.** One readiness item in the Bitcoin construction record speaks of twelve exit packages, while the same record's construction item and the flow, state and invariant records specify eighteen.
- **On-chain pause.** The settlement records say version 1 has no on-chain pause role; the deployment-lifecycle record lists one.

The [Bitcoin Authorization And Recovery guide](domains/bitcoin-authorization-and-recovery.md) explains the fee and exit-package conflicts, and the [Base USDC Settlement And Funding guide](domains/base-usdc-settlement-and-funding.md) the pause conflict. The [technical architecture record](../system-model/architecture.md) holds the exact boundaries and sources of truth, and the [System Explorer](../visuals/index.html) shows the components and lifecycles visually.
