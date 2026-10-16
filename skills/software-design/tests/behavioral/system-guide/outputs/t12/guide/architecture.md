# How the Bitcoin-backed USDC one-loan system works

The system lets one borrower lock Bitcoin as collateral and receive a USDC loan on Base from one selected lender, while keeping every participant's private keys and secrets in that participant's own hands. Its purpose is that each party gets exactly what the agreed loan says, and that no application screen, operator or service can move collateral or money on its own authority. The Base loan contract itself remains upgradeable through a governed route; who may upgrade it during the beta and how upgrades reach existing loans are open points described below.

## What the system is for

A **borrower** wants dollars without selling Bitcoin. A **lender** publishes a firm offer for exactly one loan and later decides whether and when to fund it. The loan is paid in **USDC**, a dollar-denominated token, on **Base**, a public blockchain where the loan's smart contract runs. The collateral stays on the **Bitcoin** network, locked in a script that only the participants' own keys can spend, under conditions agreed in advance; the organization holds no key to it. The two chains cannot see each other, so the system's work is to carry exact, verified facts between them without letting either chain, the product or the operating organization acquire authority it was never given.

Several other parties take part:

- **The organization** that runs the product. It operates the web application, the background workers that watch both chains, and two fee wallets that can pay network fees. It has no key to the collateral script and holds no lender capital.
- **Workforce operators** employed by the organization. They can review incidents and request actions that are already fixed in advance; they cannot change a loan amount, a recipient or a chain fact.
- **An independent validation service** that may, for loans created after its separate activation gate, publish a backup secret when a repaid loan's USDC had to be refunded. This service is selected but not yet available for production use.
- **External providers**: Cloudflare runs every production application component, WorkOS authenticates product accounts, and named Base and Bitcoin data providers supply observations and fee estimates.

A few ideas recur throughout:

- **The Vault** is a dedicated browser application, on its own web origin, where each participant's seed phrase, loan keys and secrets are created, encrypted under the participant's Vault password and used. The rest of the product only ever stores the encrypted bytes.
- **Three secrets** drive the loan. The borrower's secret **X** accepts the loan on Base and completes the Bitcoin activation. The lender's secret **Y** claims the repayment on Base and, once public, completes the borrower's Bitcoin recovery. An optional third secret **S**, held by the independent validation service, can complete that same recovery, but only after the unclaimed repayment has been refunded on Base and that refund is final; a missing Y alone never releases S. Before use, each secret exists in the loan only as a hash commitment.
- **Prefund and escrow** are different Bitcoin outputs. The borrower first sends collateral to a staging output, the prefund. An activation transaction later moves it into the escrow that secures the active loan.
- **Signed packages** are Bitcoin transactions that the participants review and sign in their Vaults before they are needed, each with a fixed destination. Holding a signed package is evidence of a prior authorization, not permission to choose a new destination.
- **Finality and confirmation** decide when a chain fact counts. A Base event counts only once its block reaches Base L1 finality, the settlement point on the underlying Ethereum network, the layer 1 (L1) beneath Base, which the recorded finality choice expects to take roughly twenty minutes. A Bitcoin transaction counts only once it is confirmed, and key gates require six unchanged confirmations.

## The domains and their roles

The design divides the system into five domains so that each kind of authority stays with exactly one owner.

| Domain | Its role and boundary |
| --- | --- |
| [Loan Terms And Commitments](domains/loan-terms-and-commitments.md) | Defines the one shared meaning of the loan: the offer, the reservation, the exact agreed terms and their fingerprint, and the separate description of the deployed environment. It authorizes no spend and records no chain outcome. |
| [Bitcoin Authorization And Recovery](domains/bitcoin-authorization-and-recovery.md) | Keeps Bitcoin authority with the borrower and lender, builds and checks every prefund, escrow and recovery transaction, and operates only the fixed routes that chain evidence makes eligible. |
| [Base USDC Settlement And Funding](domains/base-usdc-settlement-and-funding.md) | Owns the loan contract on Base: funding, the borrower's acceptance, repayment, the lender's claim and the fixed refunds. It cannot sign, broadcast or confirm a Bitcoin transaction. |
| [Base Observation And Fallback Review](domains/base-observation-and-fallback-review.md) | Turns Base events into trustworthy, finality-qualified facts for the rest of the system, and defines the narrowly limited fallback that may publish S after an exact refund. |
| [Participant Access And Loan Operations](domains/participant-access-and-loan-operations.md) | Provides accounts, sign-in and roles, the durable loan workspace, the queue of work, the handoffs into each Vault, payment coordination and the isolated local demonstration. It coordinates authority it does not hold. |

The terms domain is the common reference that every other domain checks before acting. The two chain domains act only on their own chain. The observation domain is the only bridge for Base facts, and Bitcoin facts come from independent Bitcoin observers. The operations domain sits in the middle: it records what was requested, what was submitted and what was observed, and it never turns one of those into another.

## A loan from offer to close

This case follows the normal path. The amounts and parties are illustrative; the order and conditions are the recorded design.

```figure
caption: Each step waits for a fact owned by another domain; nothing advances on a screen state alone.
step: Reserve | A borrower reserves the lender's published offer, which creates the loan's identity.
step: Agree | Both Vaults supply public keys and secret commitments; both participants approve the same exact terms, a lender approval whose relation to its standing offer acceptance is open.
step: Prefund | The borrower sends Bitcoin to the prefund; both participants sign the activation and refund transactions.
step: Fund | After six prefund confirmations, the lender transfers the principal into the loan's funding vault on Base.
step: Accept | The borrower reveals X on Base, which pays the principal and makes X public.
step: Activate | X completes the signed activation; after six confirmations, both sign their recovery transactions.
step: Repay and claim | The borrower repays by the deadline; the lender reveals Y to claim the USDC.
step: Recover | Public Y completes the borrower's signed recovery transaction, which returns the Bitcoin once confirmed.
```

**Reservation and agreement.** The lender's published offer is browsable and firm. One borrower's selection atomically reserves it and creates the loan's stable identity; a competing selection loses. Each participant's Vault then allocates a fresh key for this loan, saves an encrypted copy of its updated state, and returns only public results. Each Vault also confirms the participant's payout destinations and creates that participant's secret, or reuses the one it already holds for this loan, returning only its hash. The application assembles one complete set of terms with a single fingerprint, and the borrower and lender each approve that exact version. The second matching approval commits it once; any change to a fingerprinted field invalidates both approvals. How this explicit lender approval relates to the lender's earlier standing acceptance of the offer is an [open question](#choices-and-open-questions).

**Prefund and the first signed packages.** The borrower sends collateral from an external wallet to the prefund. The Bitcoin domain builds six activation transactions and six borrower refund transactions, one per fixed fee level from 10 to 200 satoshis per virtual byte. The borrower signs all twelve; the lender adds its signature to the six activation transactions. The complete signed set is written to the primary archive and acknowledged before the loan can qualify. Construction may start from an unconfirmed prefund, but opening the funding window requires six unchanged confirmations, current agreement between two Bitcoin observers and at least 67 hours left before the borrower's refund becomes valid.

**Funding and acceptance.** The Base contract then opens the loan and deploys an immutable funding vault for it. The lender alone decides when to send the principal, from any wallet it controls; partial transfers add up, and a transfer by itself is never treated as funding. Once the exact principal is finalized, the borrower has a bounded window to accept. Acceptance is deliberate: the borrower first reviews the facts, the Vault then prepares the exact transaction containing X, and a second confirmation of those exact bytes authorizes signing and submission. A successful acceptance pays the principal to the borrower's fixed recipient, opens the repayment vault and makes X public, all at once.

**Activation.** Public, finalized X lets the Bitcoin domain complete one of the pre-signed activation transactions and broadcast it, choosing among the signed fee levels; what happens when no signed level is high enough is an [open conflict](#choices-and-open-questions). Base acceptance is not yet active collateral: the loan stays "activation pending" until one activation transaction reaches six confirmations. Only then are the recovery transactions for that actual escrow built: six for the borrower's normal recovery, six for the lender's timelocked recovery and six for the borrower's long-stop. Each participant signs only its own fixed-destination routes, and the loan becomes package-ready active only when that set is archived and acknowledged. The design records conflicting counts for the size of that archived set, an [open conflict](#choices-and-open-questions) explained below.

**Repayment and close.** Anyone may pay the exact debt into the repayment vault; paying gives the payer no role or refund right. The exact debt must be finalized no later than the repayment deadline, called D. The lender then claims by revealing Y, strictly before the claim cutoff C, two days after D. The claim pays the lender's fixed recipient once and makes Y public. Once the claim is finalized on Base, the Bitcoin domain inserts Y into the borrower's already-signed recovery transaction and broadcasts it. The Bitcoin returns to the borrower's committed destination, and the loan is closed on Bitcoin only when that transaction confirms.

The [normal repayment flow](../system-model/behavior/flows/flow-004-normal-repayment-close.md) and the [activation flow](../system-model/behavior/flows/flow-002-activation-completion-and-active-entry.md) hold the exact steps and conditions.

## When the lender does not claim

Valid repayment does not by itself release the Bitcoin; the lender's secret does. If the lender loses its Vault password, is unavailable or refuses, Y may never appear. The design handles this case in layers, each with its own limit.

At C, Base permanently disables the lender's claim and freezes the borrower's refund recipient. Before C, the borrower may once switch that recipient to its own protocol account on Base, for example if it fears losing access to the original recipient. From C onward, anyone may call the fixed refund, which returns the exact repayment to the frozen recipient exactly once; the caller cannot choose where the money goes. The claim and the refund exclude each other, so the lender can never collect the USDC and also see it refunded.

The refund does not unlock the Bitcoin. For a loan created after the validation service is activated for production, the service holds a per-loan secret S whose hash was built into the borrower's recovery transaction before signing. After independently verifying the exact finalized refund event, the service publishes S, and S completes the same borrower-signed recovery transaction that Y would have completed. No new signature, transaction family or destination is involved. Until counsel approval and implementation evidence activate the service, no new loan may commit to S or advertise this fallback.

Without Y or S, the Bitcoin stays in escrow and two timed routes remain. The lender's pre-signed recovery becomes valid three days after D under Bitcoin's own time rules, and the borrower's long-stop becomes valid ten days after D without any secret. Bitcoin cannot see that repayment happened, so the lender's route can still pay the lender even after the borrower repaid; after ten days both routes are valid and whichever confirms first wins. This is a recorded residual risk, not borrower default and not a guarantee that the collateral returns. Mutual cooperation, with fresh signatures from both participants, is a further route. The [flow for valid repayment without a lender claim](../system-model/behavior/flows/flow-005-valid-repayment-without-lender-claim.md) and the [residual missing-Y risk](../system-model/contracts/invariants/inv-025-missing-y-residual-lender-risk.md) hold the exact rules.

## Identity, authority and sources of truth

**One loan, one meaning.** Every record, contract call, Bitcoin transaction, observation and secret commitment refers to the same loan through one canonical set of terms and its fingerprint, called the terms hash. A separate deployment manifest identifies the environment: which chain, contract, token, Bitcoin network and timing policy are in force. Any consumer rejects an artifact for the wrong loan, chain, token, key, destination or version. A matching fingerprint says which agreement an artifact describes; it never authorizes a spend.

**Who decides what.**

- The terms domain owns the loan's meaning. Workspace copies and acceptance snapshots cannot redefine it.
- Bitcoin consensus owns the prefund and escrow, signatures, timelocks, confirmations, reorganizations and the one final spend. Base records cannot spend or confirm Bitcoin.
- The Base contracts own funding, acceptance, repayment, claim, refund and deadlines. A raw token transfer, a vault balance, a submitted transaction or an application status stays provisional until the named contract event reaches finality.
- Each participant's Vault owns that participant's password, seed, loan keys, unrevealed secret and payment account. Signing in to the product grants access to encrypted bytes only; it is not a Vault unlock, a signature or a recovery of a secret.
- The selected lender owns the decision to fund. The product never pools, holds, substitutes or automatically deploys lender capital.
- The Base observer reports facts with their source and finality; it does not create a fact or approve its consequence. The validation service may publish only its committed secret and is not an arbiter of who deserves the collateral.
- The operations domain owns durable requests, the work queue, sourced status, package storage and the coordination of already-authorized actions. It owns no private authority, no capital and no independent chain truth.
- Upgrade authority over the main Base loan contract is held outside the participants. The upgrade governance selection uses a single upgrade key during the intentionally short public beta and then a 2-of-3 multi-signature Safe acting through a seven-day public timelock, with published code and a compatibility check before every upgrade, while other records keep the Safe and timelock for the whole version, treat an unrestricted unilateral upgrade key as invalid and say no unilateral key may bypass the Safe or timelock; that conflict, how upgrades reach existing loans and whether an on-chain pause exists are [open](#choices-and-open-questions). Upgrades must preserve fixed-recipient and lifecycle authority and each loan's originating identity.
- The organization's Bitcoin fee wallet may pay to speed up a signed transaction through a separate child transaction without changing it. Its Base fee wallet may submit calls whose effect is already fixed. Neither gains any recipient, capital, debt or secret authority.

**What counts as evidence.** On Base, only a named contract event at Base L1 finality advances the loan or permits a Bitcoin action; earlier "observed" and "safe" states are progress information. On Bitcoin, only a confirmed spend of the exact output is an outcome; a broadcast, a mempool sighting or a local "selected" label is not. Lifecycle gates on Bitcoin require fresh agreement between the configured independent observers.

The [technical architecture record](../system-model/architecture.md) holds the exact authority boundaries, the cross-domain rules and the security change-control procedure.

## Where it runs and what is claimed

All production application components run on Cloudflare: the product web application, the application programming interface (API) and its relational database, the Base observer, the separate Vault application and the Bitcoin operations container. They keep separate projects, credentials, origins and releases, but they share one provider failure domain. A required state change and its queued job are committed together in that database; an immediate wake-up is only an optimization, and a recovery scan every minute finds missed or crashed work.

A Cloudflare-wide outage can therefore stop the product, the Vault, the API, observation and automation together. The chains keep running, but the application accepts no new consequential command and claims no chain result. When Cloudflare returns, the system replays and reconciles Base and Bitcoin before resuming queued jobs. There is no live fallback provider and no promised recovery time; periodic off-Cloudflare backups protect data, not service.

The design separates what each environment is expected to prove:

| Environment | What this version claims | What it does not prove |
| --- | --- | --- |
| Deterministic local verification | Verification only: disposable fixtures, failure injection and cross-component assertions. | A runnable product, preserved demo state or any deployment. |
| Local demonstration | Runnable use: a developer starts or resumes the whole isolated system and completes one loan through normal repayment and confirmed borrower recovery in two browsers. | Test-network or main-network deployment, real-provider compatibility or production activation. |
| Test network | No deployment claim. | Anything about the main network. |
| Main network | No deployment claim. | An operated production service. |
| Production | No activated-operation claim; activation needs monitoring, incident response, paid services, legal and security gates, funding, release approval and an intentional enablement. | Nothing is activated by a configuration name or a successful local run. |

Demo identities, tokens, wallets and fixtures exist only inside the local demonstration, which refuses to start if any setting points at a public network or public credentials. The [handoff sequence](../build/workflow/handoffs/README.md) records delivery status: earlier deliveries of every component up to the cross-domain verification harness are recorded as implemented, current corrections to several of them have not yet been executed, and the local demonstration runtime is still blocked with its acceptance checks not yet passed. The runnable local claim above is therefore a target, not yet an achieved result.

## When things go wrong

- **Origination stops before acceptance.** If funding expires or the borrower never accepts, the lender's USDC returns only to its fixed recipient, and after the prefund's relative timelock matures the organization may broadcast one of the borrower's signed refund transactions, but only with fresh evidence that the prefund is unspent and that X was never accepted.
- **Principal paid but activation not confirmed.** Base acceptance and Bitcoin activation are not one atomic transaction. After X is public the system must keep operating the same selected activation route until it confirms: a higher already signed fee level can be chosen only before a candidate enters the mempool, and after that only a separately approved fee-bump child can add fee. What happens if no signed level is high enough is an open conflict, described below. If the borrower's refund confirms first, the lender is left with unsecured credit; the design records this as the principal residual cross-chain risk.
- **Recovery signing incomplete.** If a participant has not yet signed its recovery transactions after activation, the loan stays explicitly "terminal signing pending" and keeps prompting. The principal and the escrow cannot be reversed.
- **Observers disagree or are unavailable.** Existing finalized status stays visible, new actions that depend on the contested fact stop, and one incident is tracked until fresh agreement returns. An operator may request a recheck but cannot override a fact.
- **A relay times out.** The outcome is treated as unknown, not failed. The system reconciles the exact attempt before any retry and never sends a different transaction in its place.
- **A participant forgets the Vault password.** No server, operator, account recovery or support process can reconstruct it. Already signed, unchanged packages stay usable under their own conditions, but new signatures and secret disclosure become impossible.
- **A component is compromised.** Threats are analysed by the exact capability lost, the loan state and whether supposedly independent controls share a failure domain. For example, a malicious Vault release active while both participants unlock could capture both matching loan keys, which together allow an arbitrary cooperative spend of the escrow; and once its timelock matures, a stolen signed lender package can be broadcast to pay the lender's fixed destination even after the borrower repaid. The [security boundaries](../system-model/contracts/security/sec-015-common-frontend-captures-both-participants-during-origination.md) record each such path, its blast radius and its controls.

The system cannot guarantee that collateral returns after valid repayment if the lender withholds Y and no S exists, that Bitcoin activation always confirms after principal is paid, or that service continues through a Cloudflare-wide outage.

## Choices and open questions

The recorded choices behind this structure include:

- **A separate product-application domain.** The user approved adding a domain for accounts, the workspace and application coordination, separate from the protocol domains, on the design agent's recommendation. The other four domain boundaries were chosen by the design agent and not presented to the user as a complete list for approval.
- **Base L1 finality for every consequential handoff.** Waiting for L1 finality delays each cross-chain step by roughly twenty minutes but keeps one simple rule for funding, secret disclosure, repayment and refund, instead of risking an action on a transient observation. The [finality selection](../build/records/selections/sel-013-base-l1-finality-and-reorg-reconciliation.md) records the trade-off.
- **No organization key over collateral.** Default broadcast by the organization, institutional collateral recovery, liquidation, pooled or custodied lender capital and company-held acceptance are excluded from this version, each with its own revisit condition.
- **A single cloud provider.** All production components run on Cloudflare with separate accounts, projects and releases where that limits a compromise or a bad release. The [provider selection](../build/records/selections/sel-024-managed-provider-failure-domain-topology.md) records this as an explicit simplicity trade-off: several providers would multiply identity, replication, deployment and incident paths, and the accepted cost is that a Cloudflare-wide failure stops the application and Bitcoin automation together.

Six points are open and remain undecided:

- **Lender approval of the final terms.** The architecture record, the offer-and-reservation contract and selection, the scope boundary for matching and pooling, and the funding vault state say there is no second lender approval, and the selection says reservation already binds the canonical terms. The terms responsibility, the offer state and the origination flow limit the lender's standing acceptance to the commercial values and require an explicit lender approval of the exact final terms, distinct from that commercial approval. Whether the unqualified "no second lender approval" wording allows this second, final-terms approval is undecided.
- **How many recovery transactions the active-phase archive holds.** One sentence of the Bitcoin construction responsibility calls the signed active-phase set a 12-package phase, while the same responsibility, the package-graph state, the archive invariant and the activation flow describe 18 transactions. This conflict is undecided.
- **Who may upgrade the Base contract during the beta.** The [upgrade governance selection](../build/records/selections/sel-009-base-contract-upgrade-governance.md) uses a single upgrade key during the short public beta before the same ownership passes to the Safe and timelock. The [upgrade boundary](../system-model/contracts/invariants/inv-020-base-upgrade-boundary.md) and the settlement responsibility keep the Safe and timelock for this whole version, the deployment state treats an unrestricted unilateral upgrade key as invalid, and the [upgrade-compromise threat record](../system-model/contracts/security/sec-017-base-upgrade-administrator-or-operational-signer-compromise.md) says no unilateral key may bypass the Safe or timelock. This conflict is undecided.
- **How upgrades reach existing loans.** The selection makes a compatible upgrade the one code path for every loan the contract holds; the upgrade boundary keeps existing loans on their originating contract without silent migration, and the deployment state and threat record forbid retroactive mutation. Whether these fit together is undecided.
- **Whether an on-chain pause exists.** The selection and the settlement responsibility say there is none; the deployment state includes pause roles and a narrow operational pause. Whether that pause is only the application stop is undecided.
- **What happens when no fee level is high enough.** The fee interface's payload rule and the answered fee ticket say the system then uses the 200 level, records eligibility for a fee-bump child and alerts. The same interface's selection action says the result is a fail-closed "no eligible tier" that selects nothing. This conflict is undecided.

The domain guides explain where each of these points matters, and the [technical architecture record](../system-model/architecture.md) holds the exact boundaries and sources of truth.
