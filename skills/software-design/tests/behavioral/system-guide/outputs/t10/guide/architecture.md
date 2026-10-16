# How the Bitcoin-backed USDC one-loan system works

The system lets one borrower obtain a USDC loan on the Base network from one selected lender, secured by Bitcoin collateral that neither the company nor the application can spend. Its guarantee is that every step on either chain happens only through an authority that already agreed to it, and that the application never reports an outcome a chain has not actually produced.

## What the system is for

A **lender** publishes a firm offer to lend a fixed amount of USDC on stated terms. A **borrower** browses offers, reserves one, locks Bitcoin as collateral, and receives the USDC. Later the borrower repays and gets the Bitcoin back, or, if the borrower does not repay on time, the lender can eventually take the collateral through a route both agreed to in advance. Version 1 serves exactly one borrower and one lender per loan: there is no public or multi-lender matching, no pooled capital, no product custody of anyone's funds and no automatic deployment of lender capital.

Several other parties take part without gaining control over the loan:

- The **company** runs the product, the application and the automation. It holds no key to the collateral. Its Bitcoin fee wallet may pay to speed up an already-signed transaction, and its Base fee wallet may submit calls whose effect is fixed in advance; neither gains any say over recipients, capital, debt or secrets.
- **Workforce operators** use a separate, audited access path and can request already-authorized operations, but cannot edit contract meaning or claim success without evidence.
- An optional independent outside service, explained below, may hold a fallback secret for some loans once it is approved for production.
- **Bitcoin** and **Base** themselves are the final authorities for what happened on each chain.

A few ideas carry through everything that follows:

- Each participant has a **Vault**: a separate browser application on its own web origin that holds that participant's encrypted seed, keys and secrets. Signing in to the product lets a participant retrieve their encrypted Vault data; it never decrypts it. Only the participant's Vault password does that, and a forgotten Vault password cannot be recovered through the product.
- The loan is protected by three secrets whose hashes are fixed in the agreement before anything is signed. The borrower's secret **X** is revealed on Base to accept the loan and also completes the Bitcoin transaction that locks the collateral. The lender's secret **Y** is revealed on Base to claim the repayment and also completes the transaction that returns the borrower's Bitcoin. A third secret **S**, held by the outside fallback service, can complete that same return transaction in one narrow situation.
- The borrower first stages Bitcoin in a **prefund** output. A pre-signed **activation** transaction later moves it into the **escrow** output that is the actual collateral. Each unilateral way to spend the escrow needs one participant's own key plus a secret or a deadline, and the system prepares every such route in advance as a signed transaction to a fixed destination; these signed transactions are called **packages**. The only other route is a cooperative settlement that both participants would negotiate and sign later.
- **D** is the repayment deadline. Every Bitcoin deadline is measured by Bitcoin's own consensus clock, and every Base deadline by the Base contract's clock; the application's clock decides nothing.

## The domains and their roles

The system is divided into five domains. Each can report progress without acquiring another's authority: signing in is not unlocking a Vault, an accepted command is not a chain fact, and a Base refund is not a confirmed Bitcoin recovery.

| Domain | Its role |
| --- | --- |
| [Loan Terms And Commitments](domains/loan-terms-and-commitments.md) | Owns what the loan means: the offer, the reservation, the exact agreed terms and their hash, and the description of the deployed environment. Every other domain checks its work against this one meaning. |
| [Bitcoin Authorization And Recovery](domains/bitcoin-authorization-and-recovery.md) | Keeps Bitcoin authority with the participants: their Vault keys and secrets, the construction and validation of every pre-signed package, fees, relay, and choosing only the route the chain evidence currently permits. |
| [Base USDC Settlement And Funding](domains/base-usdc-settlement-and-funding.md) | Owns what happens to USDC on Base: the loan contract, the per-loan funding and repayment vaults, the lender's explicit funding action, repayment, claim and refund, always to fixed recipients. |
| [Base Observation And Fallback Review](domains/base-observation-and-fallback-review.md) | Turns Base events into trustworthy, finalized facts for the rest of the system, and defines the conditional fallback service that may publish the secret S. |
| [Participant Access And Loan Operations](domains/participant-access-and-loan-operations.md) | Turns the separate authorities into a usable product: accounts and roles, the durable loan workspace, queued operations, participant hand-offs to the Vaults, package storage, and an isolated local demonstration. |

The loan terms domain is the shared reference that all others consume. The participant access domain coordinates everything but decides nothing on any chain: it asks the Vaults to sign, asks the Bitcoin domain to operate a route, and shows what the observation domain and Bitcoin evidence report. The Base settlement and Bitcoin domains never control each other. The only way a Base fact can move Bitcoin is a finalized public secret: X or Y revealed on Base, or S published by the fallback service after a finalized Base refund. Even then it can only complete a Bitcoin transaction the participants already signed. In the other direction, a qualified prefund lets the company's dedicated opener open the Base funding window, which moves no USDC.

## A loan from start to finish

The following case follows one loan through its normal path. The figures name the steps; the paragraphs say who acts and what proves each result.

### Agreeing the loan

```figure
caption: Nothing is signed until the exact terms are committed; how the lender approves them is open.
step: Reserve | The borrower reserves a published offer; the loan gets its permanent identity.
step: Prepare | Each Vault derives the loan's keys and confirms destinations and its secret's hash.
step: Commit | The exact terms are committed; whether the lender approves them again is open.
step: Prefund | The borrower's Vault signs and broadcasts the Bitcoin prefund.
step: Pre-sign | The borrower's Vault signs activation and refund packages, the lender's activation; all are archived.
step: Qualify | After six confirmations of the unchanged prefund, the loan qualifies for funding.
```

The lender's published offer records the commercial values. When a borrower reserves it, the system atomically creates the reservation and a stable random loan identity; a second borrower cannot reserve the same offer. Each participant's Vault then derives fresh keys for this loan, confirms the participant's own payout destinations, and returns only public material, including the hash of its secret. The application assembles the complete terms as one exact version, and any later change to a hashed field invalidates approvals given for the earlier version. The terms records require both participants to approve that exact version before it is committed; whether the lender really gives that second approval is the open question below.

> **Open question: what the lender approves, and when**
> The records describe the lender's part differently. The technical architecture record says publishing the offer is the lender's standing acceptance and that reservation creates the loan without a second lender approval. The offer and reservation contract, the offer selection ("there is no second lender-approval step") and the scope record for multi-lender lending say the same, the funding-vault state lists a second lender approval as invalid, and the origination flow calls publication standing acceptance. The detailed reservation and terms state records, that same flow's approval step and the terms responsibility require explicit lender and borrower approval of the same final terms before they are committed, and the reservation state says this lender approval is distinct from the earlier commercial-offer approval. The terms responsibility also says publication approves only the proposed commercial values; that reading would fit the reservation wording but not the selection's statement that no second approval step exists. Which wording is right has not been decided.

Once the terms are committed, the borrower stages Bitcoin in the prefund. The Bitcoin domain constructs the activation candidates, which need both participants' signatures, and prefund refund candidates, which the borrower alone signs; each is prepared at several fixed fee rates because nothing can be re-signed later. Each Vault signs locally after reviewing exactly what it is signing. The application revalidates every signature and stores the complete set in the primary package archive before it issues its receipt; periodic encrypted backups go to a second provider. Only after the prefund has six unchanged confirmations, with fresh agreement from two independent Bitcoin data sources, does the loan qualify for funding, and the funding window may open only while at least 67 hours remain before the prefund refund becomes valid.

### Funding and activation

```figure
caption: Base acceptance pays the principal; Bitcoin activation is a separate, later fact.
step: Open | The company's dedicated opener opens a 24-hour funding window and its funding vault.
step: Fund | The lender explicitly sends USDC; finalizing exactly the principal makes it acceptable.
step: Accept | Within 24 hours, the borrower's Vault reveals X on Base; the principal is paid.
step: Activate | Public X completes one pre-signed activation; six confirmations establish the escrow.
step: Protect | Both Vaults sign the escrow's exit packages; once archived, the loan is fully active.
```

The lender funds deliberately, from any wallet the lender controls, including the lender's own Vault payment account; sending tokens into the vault gives the sender no role. Funding counts only when the contract's named funding event reaches Base's final settlement point. Successful funding starts a 24-hour acceptance window, and acceptance still fails unless at least 19 hours remain before the prefund refund becomes valid. The borrower accepts in two deliberate confirmations: the first approves a review of the non-secret facts, and the second approves the exact transaction bytes that reveal X. The application never receives X.

Once the acceptance event is final, the loan is "accepted, activation pending", not active, and the Bitcoin domain inserts the now-public X into one selected pre-signed activation transaction and broadcasts it. At this point the principal has been paid, and the system must keep operating that same activation until its escrow output has six confirmations. Only then are the exit packages for that exact escrow built and signed: the borrower's normal recovery route and the lender's default route, plus, according to most package records (the package manifest, the package and escrow states, the activation flow and the long-stop constraint), the borrower's long-stop route. The loan becomes fully active only when the exit phase is signed and archived; whether the archived exit phase includes the long-stop packages is an open question explained at the end.

### Repayment and return of the collateral

```figure
caption: The lender's claim on Base is what releases the borrower's Bitcoin.
step: Repay | Anyone pays the exact debt into the repayment vault; it must be finalized by D.
step: Claim | Before the cutoff, the lender's Vault reveals Y on Base and the contract pays the lender.
step: Recover | Public Y completes the borrower's pre-signed recovery transaction to its fixed destination.
step: Confirmed | The loan's Bitcoin outcome is final only when that transaction confirms.
```

Repayment is payer-neutral: any address may send the USDC, but only the exact debt finalized by D counts, and the payer gains no rights. The lender claims by revealing Y strictly before the cutoff C, two days after D. The claim pays the lender's fixed recipient once and makes Y public; the Bitcoin domain then places Y into the recovery transaction the borrower signed when the escrow was established, which pays the borrower's own committed destination. No fresh signature is needed and no destination can change.

## Identity, authority and sources of truth

Every domain identifies the loan through one canonical terms value and its hash. That binding covers the participants, the selected offer revision, the amounts and deadlines, the loan's Bitcoin public keys, the participants' independently chosen payout destinations, the Base addresses and fixed recipients, and the commitments to X, Y and, where used, S. A separate deployment description pins the chain, contracts, asset, Bitcoin network, timing policy and upgrade authority of the environment. Any record, package or observation for the wrong loan, chain, asset, key, destination or version is rejected. Neither binding is itself a wallet, key, source of funds or chain fact. A participant's Vault payment account is a separate public identity for paying; choosing it as a recipient on a fresh loan needs the same fresh approvals as any other term and never rewrites an existing loan.

Authority is divided so that no single holder can act alone:

- The terms domain owns what the loan means; workspace copies and acceptance snapshots cannot redefine it.
- Bitcoin consensus owns the prefund and escrow outputs, signatures, timelocks, broadcasts, confirmations and the one final spend. Nothing on Base can spend or confirm Bitcoin.
- The Base contracts own funding, acceptance, repayment, claim, refund and the public reveal of X and Y. Raw transfers, balances, submitted transactions and application status stay provisional until the named contract event reaches Base's final settlement point.
- The participants' Vaults own passwords, seeds, loan keys, unrevealed secrets and their payment accounts. Product sign-in grants access to encrypted data only.
- The selected lender owns the decision to fund; nothing can pool, take custody of, substitute or automatically deploy the lender's capital.
- The observation domain reports Base facts; it does not create them or approve their consequences. The fallback service may only publish its committed S after verifying one exact event.
- The application owns durable commands, queued work, projections, payment intents and package custody, but no private authority, no capital and no independent chain truth.

The [technical architecture record](../system-model/architecture.md) holds the exact boundaries, and the [System Explorer](../visuals/index.html) shows the components and lifecycles visually; those views are derived perspectives, and the records remain authoritative.

## When things go wrong

- **Origination stops before X is public.** Funding or acceptance expiry, cancellation or failure leads to a separate unwind: the lender's USDC returns through the contract's fixed recovery path and the borrower's prefund through its pre-signed refund. The two recoveries are independent of each other, and neither needs company-held authority.
- **X is public but activation has not confirmed.** The principal has been paid and cannot be paid again, and the system cannot refund the prefund instead. Before the network first accepts an activation transaction, a higher already-signed fee variant may be chosen; once one is accepted, the system must keep rebroadcasting that same transaction, and extra fee can come only from a separately approved fee-bump (child-pays-for-parent) transaction, until the escrow is established or the residual failure is reconciled. The borrower has accepted at this point, so a Bitcoin data failure is treated as immediately critical. The recorded residual risk is that, if the borrower's prefund refund confirms first, the borrower keeps both the principal and the Bitcoin and the lender is left unsecured; the system cannot recreate the escrow from that prefund.
- **The borrower does not repay.** Only missing or invalid timely repayment counts as default. The lender's pre-signed default route becomes valid three days after D under Bitcoin's clock. The company does not broadcast it; the lender exports and broadcasts it manually.
- **The borrower repays but the lender never claims.** At the cutoff, the lender's claim is disabled and the exact repayment becomes refundable to the borrower, so the lender cannot collect both. The Bitcoin, however, is not released by that refund, and for every loan it stays exposed to the lender's default route until a borrower recovery actually confirms. For loans built after the fallback service is activated, the service may publish S to complete the borrower's recovery, but publication is not recovery: it is final only when that transaction confirms, and until then a cooperative settlement or the lender's default route may still win. Every newly built escrow also has a borrower long-stop route that needs no secret and becomes valid ten days after D. When more than one route is valid, the first to confirm wins. The [observation and fallback guide](domains/base-observation-and-fallback-review.md) explains this in full.
- **Chain data is wrong, late or contested.** Disagreeing or unavailable sources block dependent actions instead of being resolved by guesswork, and a reorganization is corrected by replaying canonical history.
- **The hosting provider fails.** All production application components run on Cloudflare, so a provider-wide outage can stop the product, the Vaults, the application, observation and Bitcoin automation together. The chains carry on; the application accepts no new consequential command and claims no chain result, and after recovery it reconciles Base and Bitcoin before resuming queued work. Off-provider package backups protect data, not service continuity.

The system cannot guarantee that collateral returns when the lender disappears after valid repayment, even where an activated fallback exists, cannot recover a forgotten Vault password, and makes no recovery-time promise for a provider outage. Each attack combination the design analyses has one primary threat record that states its exact prerequisites and consequence rather than a severity label; for example, a compromised shared frontend capturing both participants during origination is described in its [shared-frontend threat record](../system-model/contracts/security/sec-015-common-frontend-captures-both-participants-during-origination.md).

## What runs where, and what is proven

The required outcome of this design is a developer-run local demonstration: two isolated participants use the real product, application, Vaults, Base contracts, observer, Bitcoin operations and protocol libraries to complete one loan through normal repayment and confirmed borrower recovery. Every claim is kept separate:

| Profile | What it may claim now |
| --- | --- |
| Deterministic local verification | Verification only: disposable fixtures and failure injection; not a runnable product. |
| Local demonstration | Runnable use, once built: a developer starts or resumes the isolated system and completes the journey. Not deployment or real-provider compatibility. |
| Test network and main network | No deployment claim in this version; each needs its own credentials, funding, contract deployment and evidence. |
| Production | No activated operation; activation additionally needs monitoring, incident response, legal and security gates, funding, approval and a deliberate enablement. |

The local demonstration refuses to start unless every local-only condition holds; a non-local Bitcoin or Base network, public credentials or a public deployment description stops it before anything is provisioned. Its delivery is currently blocked on other components' outputs and is not yet runnable, although the libraries, contracts, application, observer, Vault, Bitcoin operations and verification harness are each recorded as implemented in earlier delivery slices, with later corrections to several of them still pending. The [runtime profile boundary](../system-model/contracts/scope/scope-013-runtime-profile-claims-and-activation-gates.md) owns these claims.

## Choices and open questions

- **Five domains.** The user approved adding a separate domain for the product application layer, on the agent's recommendation. The other four domains were chosen by the agent; no exchange presented the full list for approval.
- **One hosting provider for everything.** Spreading components across providers would multiply identity, replication, deployment and incident paths before the team has proven those operations, so version 1 accepts that a Cloudflare-wide failure stops the application and automation together. Separate accounts, projects and credentials still limit the damage from a narrower compromise or bad release, but they are not presented as provider independence.
- **Act on Base only at final settlement.** Waiting for Base's layer-1 finality adds roughly 20 minutes to each consequential handoff in exchange for one simple rule across funding, secret disclosure, repayment and refund.
- **Exact pre-signed Bitcoin transactions.** A mismatch in a script or witness could strand collateral or authorize the wrong party. Fee rates are a fixed set of pre-signed variants, with extra fee only through a separately approved fee-bump transaction, because otherwise an operator or data provider could change participant-authorized outputs, create an unsigned fee path or present an unusable transaction.

Open questions recorded in the design, each undecided:

- **The lender's approval.** The architecture record, the offer contract and selection, the multi-lender scope record and the funding-vault state say there is no second lender approval; the detailed state, flow and terms responsibility records require a separate lender approval of the final terms. See the callout above.
- **Two Bitcoin package details.** One sentence of the package construction responsibility and the signed-package archive constraint describe the signed exit phase as twelve packages (six borrower recovery, six lender default), while the package manifest contract, the package state record and another sentence of that same responsibility define eighteen, adding six borrower long-stop packages. The fee-selection contract says both that, when no pre-signed fee rate is high enough, the highest rate is used with an alert (as the recorded ticket answer also says) and that the selection fails closed. The [Bitcoin guide](domains/bitcoin-authorization-and-recovery.md) explains both.
- **The browser-wallet acceptance step.** The runnable-demonstration constraint asks the human acceptance run to prove wallet setup with an installed browser-extension wallet, while the payment-account selection and the demonstration's acceptance record call that injected-wallet path historical. The [participant access guide](domains/participant-access-and-loan-operations.md) explains it.
- **Smaller points found while writing the domain guides.** These are undecided but not recorded as conflicts, because the records may be read in a way that reconciles them; each domain guide states both readings. Whether either participant may still cancel after the terms are committed but before any Bitcoin or USDC moves (a recorded ticket answer allows it; the terms state record allows cancellation only before commitment), in the [loan terms guide](domains/loan-terms-and-commitments.md). Whether the Base deployment has an on-chain pause role (the contract selections and constraints say version 1 has none; the deployment state record lists pause roles and a paused state), and how the single upgrade key used during the short public main-network beta fits the deployment state record's ban on an unrestricted single upgrade key, in the [Base settlement guide](domains/base-usdc-settlement-and-funding.md). Which transactions the relay may carry (the relay contract lists only activation, normal recovery and automatic prefund refund; the long-stop and cooperative-settlement flows also use it), and whether the acceptance and claim calls are signed by the Vault or by an external participant wallet (one part of the acceptance contract still describes the external wallet), in the [Bitcoin guide](domains/bitcoin-authorization-and-recovery.md).

The [technical architecture record](../system-model/architecture.md) holds the exact purpose, binding, authority and boundaries.
