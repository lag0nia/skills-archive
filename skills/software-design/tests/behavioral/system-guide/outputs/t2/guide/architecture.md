# How the Bitcoin-backed USDC one-loan system works

The system lets one borrower take a loan in USD Coin (USDC) on the Base network from one lender, secured by Bitcoin locked in an escrow that only the participants' own signatures can release. It exists to guarantee that each consequential outcome, from funding to the return or loss of the collateral, happens only through the authority that actually owns it, so that no application record, service or company action can stand in for a participant's consent or a blockchain's fact.

## What the system is for

### Who takes part

- The **lender** publishes a firm offer for one loan. Publishing it is the lender's standing acceptance of its commercial values, and the lender later decides, explicitly, whether to send the principal.
- The **borrower** reserves an offer, locks Bitcoin as collateral, receives the USDC principal and repays it by a fixed deadline.
- The **company** operates the product: the web application, its database, the chain observers and the Bitcoin operations. It holds no key to the collateral, never sees a participant's unrevealed secret and never holds the lender's capital. Its fee wallets can only pay network fees for transactions whose effect is already fixed.
- An independent **validation service**, under contract with the company, may one day hold a per-loan fallback secret. It is selected but not yet active.
- **Workforce operators** can request operations the design already permits; they cannot change a fact or a participant's decision.
- **Developers** run the whole system locally as a demonstration, which is the outcome this version of the design must deliver.

This first version (V1) is deliberately small: one lender and one borrower per loan. It has no public or multi-lender matching, no pooled capital, no custody by the company, no automatic deployment of lender capital and no liquidation of collateral.

### Two chains and one loan

The loan spans two blockchains that cannot see each other.

- **Bitcoin** holds the collateral. The borrower first stages Bitcoin in a **prefund** output; once the loan activates, it moves into an **escrow** output. The ways out of the escrow are fixed in advance: each participant signs, before it is needed, transactions that pay fixed destinations, and only a cooperative settlement needs fresh signatures from both. Bitcoin consensus, including its confirmations and timelocks, decides which of them can be spent and which one finally is.
- **Base** is an Ethereum layer-2 network where the loan contract and USDC live. For each loan the contract deploys an immutable **funding vault** that receives the principal and, later, a **repayment vault** that receives the repayment. The contract alone moves the money, to recipients fixed in the loan terms.

Each participant also has a **Vault**: a separate browser application, at its own web address, that keeps the participant's password-encrypted seed, the loan's keys and the participant's secret. Logging into the product only lets a participant fetch their encrypted Vault data; it never unlocks it.

Three secrets connect the chains. Each is created in advance, and only its hash is written into the loan terms.

- The borrower's **X**: disclosing it on Base accepts the loan and pays out the principal, and the now-public X completes the signed transaction that activates the Bitcoin escrow.
- The lender's **Y**: disclosing it on Base claims the repayment, and the now-public Y completes the borrower's signed transaction that returns the collateral.
- The fallback **S**, held by the validation service: an alternative to Y, for loans built with the fallback, that can complete the same return transaction after a specific refund on Base.

Timing is fixed in the terms around the repayment deadline, **D**. The lender may claim the repayment until the claim cutoff **C**, two days after D; the lender's pre-signed default transaction can become valid three days after D; and a borrower long-stop transaction can become valid ten days after D.

## The five domains and their roles

The design divides the system into five domains, each owning one kind of truth.

| Domain | Its role |
| --- | --- |
| [Loan Terms And Commitments](domains/loan-terms-and-commitments.md) | Defines the one offer, reservation and agreed terms that every other part must refer to, separately from the environment the contracts run in. It decides meaning, not money or keys. |
| [Bitcoin Authorization And Recovery](domains/bitcoin-authorization-and-recovery.md) | Keeps each participant's Bitcoin keys and secret in their own Vault, builds and validates the fixed pre-signed transactions, and operates only the route that current chain evidence allows. |
| [Base USDC Settlement And Funding](domains/base-usdc-settlement-and-funding.md) | Owns the loan contract and its vaults on Base: funding, the borrower's acceptance, repayment, the lender's claim and the fixed refunds. It cannot touch Bitcoin. |
| [Base Observation And Fallback Review](domains/base-observation-and-fallback-review.md) | Decides when a Base event is final enough to be used elsewhere, and defines the narrow fallback that may publish S after one exact refund. It reports facts and never creates them. |
| [Participant Access And Loan Operations](domains/participant-access-and-loan-operations.md) | Runs the product: accounts and roles, the durable loan workspace, background operations, handoffs to the Vaults, and the isolated local demonstration. It coordinates authorities it does not hold. |

Loan Terms And Commitments sits underneath everything: every other domain checks its artifacts against the same agreed terms. Participant Access And Loan Operations is the hub participants see; it sends them to their Vaults for anything that needs a key or a secret and records the results. Bitcoin Authorization And Recovery and Base USDC Settlement And Funding each act only on their own chain. Base Observation And Fallback Review carries finalized Base facts to the workspace and to the Bitcoin operations. The separation matters because each part can report progress without acquiring another's authority: a login is not a Vault unlock, an accepted command is not a chain fact, and a Base refund is not a returned Bitcoin.

## A loan from offer to returned collateral

The following case is illustrative: it follows one loan along the normal path to show who supplies what, who decides, what changes and what proves the result.

```figure
caption: The loan alternates between the two chains, and no step relies on the other chain until that chain's fact is final.
step: Reserve | The borrower reserves a published offer, creating the loan's identity.
step: Agree | Both Vaults supply keys and commitments; both participants approve the same final terms.
step: Prefund | The borrower stages Bitcoin; activation and refund transactions are signed and archived.
step: Fund | After six prefund confirmations the funding window opens and the lender sends the exact principal.
step: Accept | The borrower discloses X on Base and receives the principal.
step: Activate | X completes the activation; at six confirmations the exit transactions are signed.
step: Repay and claim | The borrower repays by D; the lender claims before C by disclosing Y.
step: Return | Y completes the borrower's signed return transaction; its confirmation closes the loan.
```

**Reserve and agree.** A lender's published offer is browsable. When a borrower selects it, the system atomically creates one reservation and a stable loan identity; a competing selection simply loses. Each participant's Vault then derives keys for this loan, saves its encrypted state and returns only public identities: a Bitcoin public key and a Base account. Each Vault also confirms its owner's payout destinations and creates, or reuses, the owner's secret, returning only its hash. The application assembles the complete candidate terms, and the borrower and the lender each approve that exact candidate; the second matching approval commits the terms. Any change to the terms invalidates earlier approvals.

**Prefund.** The borrower sends Bitcoin to the prefund. Once it is seen, even before it confirms, the Bitcoin operations build six activation and six refund transactions, one per fixed fee rate. The borrower signs all of them, the lender adds signatures to the activation transactions, and the complete set is archived before the loan can go further. Six unchanged confirmations of the prefund and fresh agreement between independent Bitcoin observers are then required, with enough time left before the borrower's refund could become valid, before the loan qualifies for funding.

**Fund and accept.** The loan contract opens the funding window and deploys the funding vault. The lender sends USDC from any wallet they control; only when the exact principal is finalized on Base is the loan funded. While a fresh safety check still holds, including recent funding and enough time before the prefund refund, the borrower reviews the loan in their Vault and confirms twice: once on the facts, and again on the exact transaction prepared with X. That call pays the principal to the borrower's fixed recipient and discloses X on Base.

**Activate.** Once X is final on Base, the Bitcoin operations insert it into one signed activation transaction and broadcast it. Only when an activation transaction reaches six confirmations is the escrow treated as established; if a different signed activation confirms, that one becomes the escrow. The exit transactions are then built for that actual escrow, six fee variants for each of three routes: the normal return, the lender's default and the borrower's long-stop. Each participant signs only their own routes; the set is archived, and the loan becomes active with every exit route ready.

**Repay, claim and return.** Anyone may pay into the repayment vault, but the repayment is valid only when the exact debt is finalized on Base no later than D. Before C, the lender re-authenticates and, again confirming twice in their Vault, claims the USDC by disclosing Y. Once Y is final, the Bitcoin operations insert it into the borrower's already-signed return transaction and broadcast it. The loan closes only when that spend confirms.

The precise sequences are owned by the [origination flow](../system-model/behavior/flows/flow-001-origination-preparation-and-qualification.md), the [activation flow](../system-model/behavior/flows/flow-002-activation-completion-and-active-entry.md) and the [normal repayment flow](../system-model/behavior/flows/flow-004-normal-repayment-close.md).

## What binds everything to one loan

Every record, transaction and observation must describe the same agreement. The **canonical loan terms** (`LoanTermsV1`) are an ordered, versioned value; their hash, `terms_hash`, binds the exact encoded content. They name both participants, the selected offer revision and reservation, the amounts and deadlines, each participant's loan-specific Bitcoin public key and separately chosen payout destination, the Base contract addresses and fixed recipients, and the hashes of X, Y and, where used, S. A separate **deployment manifest** (`ProtocolDeploymentV1`) identifies the environment: chains, contracts, the USDC token, the Bitcoin network, timing policy and upgrade authority. Keeping loan facts apart from environment facts stops two components from signing or processing different meanings under one label.

Neither of these is a wallet, a key, a source of funds or a chain fact. Several identities stay deliberately distinct: a participant's loan key on Bitcoin, their protocol account on Base, their external payout destinations, and the **payment account** in their Vault that can pay funding or repayment. Choosing a payment account as a recipient in a new loan's terms needs the normal fresh approvals and never rewrites an earlier loan. Any component that meets a wrong loan, chain, contract, asset, key, destination or version rejects it, and an amendment before activation produces a new candidate with fresh dependent artifacts.

## Who decides what, and which facts count

Authority is split so that no single holder can complete a consequential outcome alone:

- Bitcoin consensus decides the prefund and escrow outputs, signature and witness validity, timelocks, confirmations and reorganizations, and which single spend finally wins.
- The Base contracts decide funding, acceptance, repayment, the claim, the fixed refunds and the public disclosure of X and Y.
- Each participant's Vault holds their password, seed, loan keys, unrevealed secret and payment account, and signs locally.
- The lender alone decides to fund; the product presents the funding vault but never pools, holds, substitutes or automatically deploys capital.
- The Base observer qualifies Base events and their finality; it reports a fact without creating it or approving its consequences.
- The validation service, once active, may only publish its committed S after verifying one exact refund event.
- The workspace records commands, operations and sourced status, and coordinates already-authorized actions; it holds no participant authority, no capital and no chain truth of its own.
- The local demonstration composes the real components inside an isolated profile and cannot redefine protocol meaning, become a source of chain truth or activate a public profile.

The same discipline applies to evidence. The workspace keeps accepted, submitted, observed, finalized, broadcast and confirmed as different states, and only the right fact can advance a loan:

| Outcome | What proves it | What does not |
| --- | --- | --- |
| Loan funded | The finalized funding event for the exact principal | A transfer into the vault, its balance or a submitted transaction |
| Loan accepted | The finalized acceptance event that discloses X | The borrower's submission or an application status |
| Collateral in escrow | An activation transaction with six confirmations under fresh observer agreement | Base acceptance or a broadcast |
| Repayment valid | The finalized repayment event for the exact debt by D | Funds in the repayment vault |
| Repayment claimed or refunded | The finalized claim or unclaimed-repayment refund event | A missing Y, elapsed time or a workspace label |
| Collateral returned or taken | The confirmed Bitcoin spend of the escrow | A published secret, a broadcast or a Base refund |

On Base, "finalized" means the containing block has reached finality on Ethereum, roughly 20 minutes after the transaction, and the application does nothing consequential before then. The [Base Observation And Fallback Review](domains/base-observation-and-fallback-review.md) guide explains that rule.

## Where the system runs, and what an outage means

Every production component runs on Cloudflare: the product web application, the application programming interface (API) with its database, the Base observer, which runs every minute, the Vault, and the Bitcoin operations container. They keep separate builds, projects, credentials, web origins and releases where those limit damage, but they share one provider. The application database is the single durable store for the workspace and its pending jobs; a state change and the job it requires are committed together, an immediate wake-up starts the work, and a scan every minute finds anything missed or interrupted.

So a Cloudflare-wide outage can stop the product, the Vault, the API and its database, Base observation, the Bitcoin automation and the operator tools together. The chains keep running, but the application accepts no new consequential command and claims no new chain result. When the provider returns, the system replays and reconciles Base and Bitcoin before resuming its pending jobs. V1 has no live fallback to another provider and states no recovery time or data-loss objective; periodic encrypted backups outside Cloudflare protect the completed transaction packages, not the running service. The [provider failure-domain decision](../build/records/selections/sel-024-managed-provider-failure-domain-topology.md) records this as an explicit simplicity trade-off.

The design also separates what each environment is claimed to prove:

| Profile | Claim in this version |
| --- | --- |
| Deterministic local verification | Verification only: disposable fixtures and failure injection, not a runnable product. |
| Local demonstration | Runnable use: a developer starts or resumes the whole isolated system with one command and completes a representative loan through normal repayment and confirmed collateral return. |
| Testnet and mainnet | No deployment claim; each needs its own credentials, funded wallets, contract deployment and evidence. |
| Production | No activated operation; activation needs monitoring, incident response, paid services, legal and security gates and a deliberate enablement. |

Demonstration identities, wallets, balances, contracts and stand-in providers exist only inside the local profile. If any local check disagrees, such as a network address that is not local, a non-test Bitcoin network or a public deployment manifest, startup fails before anything is provisioned. The [runtime-profile scope boundary](../system-model/contracts/scope/scope-013-runtime-profile-claims-and-activation-gates.md) owns these claims.

## When things go wrong

Most failures leave the participants with a route they authorized in advance, but the routes differ in who can use them and when.

- **The loan stops before the borrower accepts.** If funding, acceptance or origination expires or fails before X is disclosed, any USDC the lender sent returns to the lender's fixed recipient through the contract, and the borrower's prefund returns through one of the signed refund transactions. Neither return depends on a discretionary company decision; see the [pre-activation unwind flow](../system-model/behavior/flows/flow-003-preactivation-unwind.md).
- **The borrower accepted but activation has not confirmed.** Once X is public the principal has been paid, so the system cannot refund the prefund or pay again. Recovery continues with the same selected activation transaction and cannot construct an unapproved replacement. Missing exit-route signatures after activation leave the loan explicitly pending, with alerts, rather than presented as fully active.
- **The borrower does not repay.** After D, canonical Base facts must show that no valid repayment exists before the case counts as a default. The lender's pre-signed default transaction becomes valid only after Bitcoin's consensus clock passes three days after D; the lender exports and broadcasts it, because the company does not broadcast default transactions.
- **The borrower repays but the lender never claims.** At C the claim is disabled forever and anyone can trigger the fixed refund of the repayment to the borrower. Returning the Bitcoin to the borrower then needs the activated fallback secret S, the borrower's long-stop after ten days, or a cooperative settlement both participants agree to. Because the fallback is not yet active, the lender's default transaction can win the collateral before the long-stop matures even though the borrower repaid.
- **Sources disagree or go dark.** A conflict or outage among the Base or Bitcoin observers blocks new actions that depend on them, while already final results stay visible; nothing resumes until fresh evidence is replayed. A relay timeout is not permission to send a different transaction.
- **Several routes become valid at once.** Exactly one confirmed spend of the escrow is final; every competing transaction becomes historical, whatever the application had selected.

> **What the system cannot guarantee**
> It cannot guarantee that a borrower who repaid gets the collateral back if the lender never reveals Y and no valid S exists: the lender's default route can still confirm first. It cannot recover a forgotten Vault password. It cannot keep the application running through a Cloudflare-wide outage. And a published secret, a broadcast or a Base refund never proves that Bitcoin moved.

Security analysis follows the same logic. Threats are recorded per compromised capability and lifecycle state rather than by a severity word, with explicit attention to combinations that collapse into one shared failure, such as one compromised front end capturing both participants. After an incident, the first question is which capability was compromised; a product password reset or an application status never proves that a key, a chain outcome or another capability changed. The [combination analysis in the technical architecture record](../system-model/architecture.md#combination-attack-ownership) names the threat record that owns each such combination.

## Choices and open questions

### Recorded choices

The records say who settled each choice. Here the **approver** is the person who reviewed and approved the design, and the **design agent** is the AI agent that drafted it.

- **The domain map.** The approver of the design asked where the ordinary product application was and accepted the design agent's proposal to add the Participant Access And Loan Operations domain. The other four domain boundaries were chosen by the design agent; no exchange presented the full list for approval.
- **Act on Base only at finality.** Waiting for layer-1 finality, at the approver's request, costs about 20 minutes per consequential step and buys one uniform rule for funding, secret disclosure, repayment and refund.
- **One provider, explicit trade-off.** Running everything on Cloudflare avoids multiplying identities, replication and incident paths before they are proven, at the price of a shared outage.
- **A contracted independent fallback service.** The service holds no Bitcoin key, cannot choose a destination and cannot be overridden by the company; it remains gated on legal counsel's approval and implementation evidence.

Each domain guide gives the recorded reasons for its own choices.

### Open source conflicts

Four conflicts between the design's own sources are recorded and remain undecided:

- **Lender approval of final terms.** The [technical architecture record](../system-model/architecture.md#purpose-and-binding) says a reservation creates the loan "without a second lender approval", while the detailed terms records require both participants, the lender included, to approve the exact final terms before they commit.
- **Fee rate when no tier is high enough.** The policy text of the [fee selection contract](../system-model/contracts/interfaces/iface-007-bitcoin-fee-estimate-and-tier-selection.md) and the recorded answers select the highest pre-signed fee rate, mark the transaction for a separately approved fee bump and alert, while the same contract's selection action describes a fail-closed "no eligible tier" result.
- **Number of exit transactions.** The package contract and flows specify eighteen exit transactions after activation, six for each route, while one archive rule in the [construction responsibility](../system-model/domains/bitcoin-authorization-and-recovery/responsibilities/sr-002-bitcoin-prefund-escrow-and-package-construction.md) still refers to a twelve-package exit phase.
- **Base contract pause and beta upgrade key.** The settlement responsibility and the upgrade governance choice say the first version has no on-chain pause and lets one dedicated key own upgrades during local testing and a short mainnet beta, while the [deployment state record](../system-model/contracts/states/state-019-base-deployment-upgrade-and-opener.md) still lists a narrow on-chain pause state and treats an unrestricted single upgrade key as invalid.

No implementation question is currently open in the ticket backlog: every recorded question is answered or explicitly excluded. What remains open are these conflicts and the gates that later claims depend on, such as activating the fallback service or deploying beyond the local demonstration.

The [technical architecture record](../system-model/architecture.md) holds the exact boundaries and sources of truth.
