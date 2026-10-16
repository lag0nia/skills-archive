# Participant Access And Loan Operations

This domain turns the separate authorities of the loan, the agreed terms, the participants' Vaults, the Base contract and Bitcoin, into a product that people can actually use. It records who may act, what the application has durably accepted, which operation is pending and which outside result is known. It coordinates authority it does not hold: application records never become private keys, participant consent or chain truth. The [architecture guide](../architecture.md) shows where this domain fits in the whole system.

## What this domain does

Borrowers and lenders use a web product to browse offers, approve terms, follow their loan and start actions. Their keys and secrets live elsewhere, in each participant's **Vault**, a dedicated browser application on its own web origin that decrypts and signs locally. The money, in USDC, a dollar-denominated token, lives on the Base blockchain, and the collateral lives on Bitcoin. This domain sits between them and keeps a durable, honest record of the loan's progress.

A few ideas recur:

- A **workspace** is the application's current view of one loan for one participant role: its status, the sources behind that status and the actions currently allowed.
- A **revision** identifies the exact workspace state a command was based on, so a command made against an outdated view is rejected rather than applied.
- An **outbox** records required work in the same database transaction as the state change that needs it, so a lost notification cannot lose the work.
- A **handoff** gives one participant access to one bounded action in their Vault. It is not a general signing permission.
- A **payment intent** fixes one exact public payment request before the participant's Vault signs it.

These ideas keep an accepted request separate from a submitted transaction, an observed event, a finalized contract event and a confirmed Bitcoin spend.

## How its responsibilities work together

**[Participant identity and role access](../../system-model/domains/participant-access-and-loan-operations/responsibilities/sr-010-participant-identity-and-role-access.md)** owns accounts, sign-in, sessions, account recovery, reauthentication and two-factor checks, each participant's role on each loan, and permission to retrieve the encrypted artifacts that role may have. Participants sign in through WorkOS, with Google or a six-digit code sent to a verified email, behind a narrow adapter; each account has one permanent internal identity that the provider's identifiers never replace. One account may be a borrower on one loan and a lender on another, but never both on the same loan.

**[Loan workspace and application coordination](../../system-model/domains/participant-access-and-loan-operations/responsibilities/sr-011-loan-workspace-and-application-coordination.md)** owns the workspace, revisioned and repeat-safe commands, the outbox and its workers, source records and the statuses derived from them, notifications, archives of signed packages, the small gas stipend for participant calls, Vault payment coordination and the exact handoffs into each Vault.

**[Local runtime composition and controlled demonstration](../../system-model/domains/participant-access-and-loan-operations/responsibilities/sr-012-local-runtime-composition-and-controlled-demonstration.md)** assembles the separately built components into one isolated system a developer can run on one machine, through the same public interfaces the real components use.

Sign-in authorizes the retrieval of encrypted data; it never decrypts a Vault, recovers a seed or secret, or makes a chain action valid. The domain receives the terms and their commitment from the terms domain, signed results and public identities from the Vaults, finality-qualified Base facts from the observation domain and Bitcoin evidence from the Bitcoin domain. It provides access decisions, the workspace, durable operations and handoffs to the participants and to every other domain.

## A normal case: one loan through the product

A borrower and a lender each sign in. The borrower reserves the lender's published offer, and the domain binds both authenticated participants to the reserved loan.

Each participant then opens a handoff to their Vault. The product passes a short-lived, single-use code in the web address; the Vault signs the participant in afresh, redeems the code once and reloads the exact action from the application rather than trusting the page. Through such handoffs each Vault allocates the participant's fresh key for this loan and prepares destinations and the secret commitment, returning only public results. When both participants' results are recorded, the workspace shows one candidate version of the final terms, and each participant approves the same version. How the lender's explicit approval here relates to its earlier standing acceptance of the published offer is undecided in the records; the [terms guide](loan-terms-and-commitments.md#open-excluded-and-deferred) explains both readings.

For the Bitcoin transactions, the Bitcoin domain produces the complete unsigned material, the application stores it as an immutable batch, and the product launches the Vault handoff. Each Vault signs locally. The application checks the signed result, writes the full package archive to separate storage and only then records its receipt.

After funding is finalized and the borrower deliberately accepts, the finalized Base event that makes the borrower's secret public and independent Bitcoin evidence drive separate status and operation steps. Normal repayment likewise waits for finalized contract outcomes and confirmed Bitcoin recovery. The [origination flow](../../system-model/behavior/flows/flow-001-origination-preparation-and-qualification.md), [activation flow](../../system-model/behavior/flows/flow-002-activation-completion-and-active-entry.md) and [normal repayment flow](../../system-model/behavior/flows/flow-004-normal-repayment-close.md) hold the exact sequences.

### How work survives failures

```figure
caption: An accepted command always leads to the same recorded work, however many responses are lost on the way.
step: Accept | A command based on the current revision commits its state change and its outbox job together in one database transaction.
step: Acknowledge | The participant receives a stable operation identity and can recover the same result after a refresh or restart.
step: Wake | An immediate wake starts the job quickly, but it is only an optimization.
step: Scan | A scan every minute finds any job whose wake was missed or whose worker crashed.
step: Revalidate | Before any retry, the application rechecks its records and the chain sources to prove the identical action is still required.
step: Retry | Retries follow after one, two, five and fifteen minutes and then hourly, never changing the action.
```

The exact request, route, participant, amount, nonce, fees, signed bytes, provider and transaction identity survive an ambiguous outcome. A lost response never becomes a new payment or a changed action.

## Exceptions and recovery

**Denied access.** Every interaction makes its own identity and role check. An invalid or expired sign-in gets a "not authenticated" answer. A missing resource and a resource outside the participant's account or loan look the same, "not found", so the answer reveals nothing. "Forbidden" is kept for a resource the participant may know about but whose requested action their role does not allow.

**Sensitive actions.** Sessions last at most seven days and end after 24 hours of inactivity. Retrieving sensitive encrypted data, opening a Vault handoff or replacing the Vault password needs a sign-in no older than 15 minutes, and also an authenticator code if the participant has enrolled one. Replacing the Vault password additionally needs a single-use email confirmation bound to the same account and session, which never replaces the current Vault password.

**Stale or repeated commands.** A command against an old revision is rejected. Repeating a command with the same idempotency key and the same content returns the same operation; reusing the key with changed content is rejected. A handoff code that is expired, replayed or already redeemed is refused, and a fresh code is issued only for the same, still-current action.

**Payments from a Vault.** A participant can pay from a payment account in their Vault, kept separate from the loan's protocol keys. The account is shown only once its backup and restore have been shown to recover the same address. The application records the exact payment intent and enters a durable signing phase before the Vault signs. If the outcome is unclear, the application checks at 0, 15 and 60 seconds and escalates at 180 seconds; normal inclusion delay stays distinguishable from an unresolved outcome. A timeout after signing does not prove the payment was not sent, so the application never resubmits blindly: it reconciles, retries only with the identical signed bytes, or visibly blocks the account. A new device must restore or reproduce the exact pending payment, or the account stays blocked. A narrow participant transfer lets a participant send the configured USDC to a recipient they choose; it is not linked to any loan and cannot change loan state. The handoff sequence records the latest transfer-review correction as passing its focused checks but not yet finalized, and their browser proof waits on the blocked local demonstration.

**Backups.** Signed packages and complete Vault envelopes are copied hourly to separate locked recovery storage outside Cloudflare, and the full application database is exported daily. A backup failure raises a warning after two hours and a critical alert after six; after 24 hours, new loans stop qualifying while existing loans continue.

**A Cloudflare-wide outage.** All application components of this version share Cloudflare as one provider, despite separate origins, projects and credentials. A provider-wide outage can stop the product, the Vaults, the application interface and database, the observers and the automation together. The chains keep running, and new consequential application commands stop. When service returns, Base and Bitcoin are reconciled before queued jobs resume. The off-provider backups protect data recovery; they are not a running fallback, and no recovery time is promised.

## Authority boundaries

The domain decides who may act in the product, what the application has accepted and which fixed operation runs next. It must not hold, decide or imply:

- Vault passwords, seeds, private keys or plaintext secrets, Bitcoin or Base signatures, or the meaning of the terms;
- lender capital, a destination for funds, chain facts or the fallback service's judgment;
- that a sign-in, prompt, cache, notification, balance, submitted transaction, finished worker, silent observer or missing secret shows finality, Bitcoin confirmation, default or a beneficiary;
- automatic broadcast of the lender's recovery after a default.

Workforce operators use a separate route: a dedicated operator site behind Cloudflare Access, with company Google identities, their own authenticator codes, 15-minute sessions and an active operator permission checked on every request. A viewer can only read, an operator can perform only a fixed list of review and incident actions, and a security administrator manages operator membership. Every privileged attempt, including a rejected one, is written to an audit the operator cannot edit. A participant's sign-in grants no workforce authority.

## Choices and their reasons

- **Continuity a browser can rely on.** A command handler and a passing internal test alone do not show that a browser can load its state or recover an accepted operation. The workspace is therefore one bounded, role-scoped view, and every accepted command gets a stable, retrievable operation. The [workspace and operation continuity constraint](../../build/records/constraints/cons-024-consumer-visible-workspace-and-operation-continuity.md) records the rule; neither the workspace nor the operation shows that anything is final on a chain.
- **A local composition of its own.** The separately built components did not by themselves give a persistent runnable demonstration or a safe separation between local and public settings, so one isolated composition assembles them.
- **Vault-owned payment intents.** Fixing each payment as an exact intent that the Vault signs prevents payment addresses that cannot be recovered, duplicate payments after a lost response and the mixing of protocol keys with payer identities. The [payment account and intent interface](../../system-model/contracts/interfaces/iface-022-vault-owned-base-payment-account-and-exact-transfer.md) and [payment account and intent state](../../system-model/contracts/states/state-021-vault-owned-base-payment-account-and-intent.md) hold the exact mechanics.

## The local demonstration

The local demonstration is designed to let a developer start or resume the whole system on one machine with one command, check its status, shut it down cleanly and, only when asked explicitly, reset and reseed it. Its runtime is not yet delivered, as the end of this section explains. It is designed to run a local Base chain with a fake USDC token, two connected persistent Bitcoin nodes on a private local regression-test network (regtest), never a public test network, two isolated participants with separate browser sessions and Vaults, and the real product, Vault, application, observer and operations paths. Its goal is one loan through normal repayment and confirmed borrower recovery in the browser.

Ordinary shutdown keeps all state. The composition only records references to the state each component owns, and a reset asks each component to reset its own state; it never deletes another component's files itself. It refuses to start if any setting points at a public network or public credentials, and its fixed identities and tokens never reach a public build.

Local setup may give disposable test funds to the participants' public payment addresses, but that is neither evidence of a participant payment nor production gas sponsorship. A passing check, healthy process, seeded fixture or demo receipt shows only the local profile, never a test-network or main-network deployment, an activated production service or a completed security audit. The [runtime claims boundary](../../system-model/contracts/scope/scope-013-runtime-profile-claims-and-activation-gates.md) keeps these claims apart, and the [handoff sequence](../../build/workflow/handoffs/README.md) records which deliveries are implemented: the local demonstration runtime is still in progress and blocked, with its browser acceptance checks not yet passed.

## Open, excluded and deferred

- **Forgotten Vault password.** This version offers encrypted Vault backup but no way to recover a forgotten Vault password, and account recovery never recovers Vault contents. Stronger recovery is deferred under the [participant Vault recovery scope](../../system-model/contracts/scope/scope-006-stronger-participant-vault-recovery.md).
- **Cooperative settlement operations.** Complete operation of cooperative settlement is deferred under the [cooperative settlement scope](../../system-model/contracts/scope/scope-005-cooperative-settlement-operations.md).
- **Replacing the identity provider.** WorkOS is the selected identity provider. A replacement would have to keep every internal account, loan and Vault identity and prove linking, session, two-factor and recovery parity, cutover and rollback; it is deferred under the [authentication replacement scope](../../system-model/contracts/scope/scope-015-application-owned-authentication-replacement.md).
- **Platform-paid reveal transactions.** Having the platform pay for the transactions that reveal secrets is deferred. Current support is a bounded one-time gas stipend to each participant's protocol address, with participants signing and submitting themselves, as the [platform-paid reveal scope](../../system-model/contracts/scope/scope-014-platform-paid-base-reveal-execution.md) records. Public production gas provisioning for payment accounts is also deferred.
- **Excluded.** Arbitrary contract calls, token approvals, swaps, other assets, native-currency sends and generic signing from a Vault payment account are outside this version.

The [domain record](../../system-model/domains/participant-access-and-loan-operations/domain.md) lists exactly what the domain owns and excludes, and the [identity and session state](../../system-model/contracts/states/state-003-product-identity-session-and-fresh-access.md), [workspace and outbox state](../../system-model/contracts/states/state-016-workspace-command-outbox-and-projection.md) and [local demonstration state](../../system-model/contracts/states/state-020-local-demo-runtime.md) hold the exact rules.
