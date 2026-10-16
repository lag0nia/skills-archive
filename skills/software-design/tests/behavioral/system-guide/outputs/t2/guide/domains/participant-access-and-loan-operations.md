# Participant Access And Loan Operations

This domain is the product application of the loan system: it decides who may act on a loan, keeps the durable record of what the application accepted and what the chains confirmed, and sends each participant to their own Vault for anything that needs a key. It matters because a refresh, a lost response or an outage must never become a second payment, an approval nobody gave or a false claim about either chain; the [architecture guide](../architecture.md) shows how it fits with the protocol domains.

## What does this domain do?

The other four domains each own one kind of authority: the agreed terms, the participants' Bitcoin keys and secrets, the Base contracts that hold and move USD Coin (USDC), and the observation of Base events with a conditional fallback. This domain turns them into a product people can use, and it also owns an isolated demonstration that a developer can run on one machine.

Borrowers and lenders use the **product web application**; company operators use a separate operator surface. Behind both sits the **Application API**, the application programming interface (API) that the technical records also call Core. It keeps durable records in Cloudflare D1, Cloudflare's managed relational database, and large files in Cloudflare R2 object storage. The **Vault** is a separate browser application on its own web origin that unlocks each participant's encrypted keys and secrets and does all decryption and signing locally. Its cryptographic authority belongs to [Bitcoin Authorization And Recovery](./bitcoin-authorization-and-recovery.md); this domain opens the door to it and records only public results.

> **Records are not keys, consent or chain facts**
> Nothing this domain stores can become a private key, a participant's consent or a chain fact. Signing in is not unlocking the Vault: sign-in can permit downloading encrypted Vault data, but only the Vault password, entered inside the Vault, decrypts it.

## Which ideas does a reader need first?

- A **workspace** is the current view of one loan for one role: its status, the source and freshness of each fact, and only the next actions that role allows. Its **revision** number changes with every update; a command based on an older revision is rejected, so a stale tab cannot act on old information.
- An **operation** is the durable receipt for an accepted command, so the caller can find the same result after a timeout or restart.
- The **outbox** is a job record committed in the same transaction as the state change it serves, so required work survives a crash.
- A **handoff** is a short-lived, single-use code that sends one participant to their Vault for one exact action on one loan. It is a pointer, not a sign-in and not a general signing token.
- A **payment intent** fixes one exact USDC transfer, fees included, before the participant's Vault signs it.

Together they keep five events apart: an accepted command, a submission, an observation, a finalized Base contract event and a confirmed Bitcoin spend. Only the last two are outcomes; the workspace shows the others as progress.

## How do the three responsibilities share the work?

### Participant identity and role access

[Participant identity and role access](../../system-model/domains/participant-access-and-loan-operations/responsibilities/sr-010-participant-identity-and-role-access.md) decides who someone is and what they may do on which loan. Sign-in uses the WorkOS identity provider, a hosted login service, with Google sign-in or a six-digit code sent to a verified email address; the product has no password of its own. Each person has one permanent internal account, and a WorkOS or Google identity is only a replaceable link to it. The application records each account's role per loan: different roles on different loans are allowed, both roles on one loan never.

Sessions last at most seven days and end after 24 hours of inactivity. Sensitive actions, such as retrieving encrypted Vault data or opening a Vault handoff, need a fresh sign-in from the last 15 minutes, plus a time-based one-time password (TOTP) code for participants who enrolled in that multi-factor authentication (MFA). A loan outside the caller's scope looks exactly like one that does not exist. Account recovery restores sign-in and access to encrypted data, never a Vault's contents; the [identity and session states](../../system-model/contracts/states/state-003-product-identity-session-and-fresh-access.md) give the exact rules.

### Loan workspace and application coordination

[Loan workspace and application coordination](../../system-model/domains/participant-access-and-loan-operations/responsibilities/sr-011-loan-workspace-and-application-coordination.md) keeps the workspace and its operations, runs the outbox and its workers, and coordinates every step that needs another domain. It:

- lists lender-published offers and makes a borrower's reservation atomic, creating the loan;
- creates handoffs, tracks each participant's Vault steps and collects both approvals of the final terms;
- stores signed Bitcoin packages in locked R2 storage before recording their receipt, and copies them hourly to recovery storage in a separate Amazon Web Services (AWS) account;
- runs fixed-effect automation that earlier approvals already authorized, such as finalizing funding or broadcasting the already-signed recovery transaction;
- coordinates the public side of each Vault payment account;
- sends product email, which never changes a loan;
- puts the operator surface behind Cloudflare Access, Cloudflare's sign-in gateway, with company Google accounts and a mandatory one-time code, allows only a short fixed list of actions, and audits every attempt.

### Local runtime composition and controlled demonstration

[Local runtime composition and controlled demonstration](../../system-model/domains/participant-access-and-loan-operations/responsibilities/sr-012-local-runtime-composition-and-controlled-demonstration.md) lets a developer run the whole system on one machine and complete a loan through normal repayment. One command checks the environment, starts or resumes every component in dependency order, waits for each health check and reports; other commands show status, stop everything and, only when asked, reset and reseed.

It runs the real product web application, Application API, Vault, Base observer and Bitcoin operations through their public entry points, with local stand-ins: Anvil, a local Ethereum-compatible chain, with a fake USDC; two connected Bitcoin Core nodes on the private regression-test network (regtest); and two isolated demo participants with separate sessions, Vaults and a clearly local-only sign-in. Stopping preserves all state, and the next compatible start resumes it. Only the explicit reset asks each component to recreate its own state, never deleting another repository's files. A successful run yields a redacted receipt that is local-demo evidence only.

### What the domain receives and provides

It receives terms from [Loan Terms And Commitments](./loan-terms-and-commitments.md); unsigned Bitcoin packages and Vault results such as public keys, signatures and secret commitments from [Bitcoin Authorization And Recovery](./bitcoin-authorization-and-recovery.md); finality-classified events from the [Base USDC Settlement And Funding](./base-usdc-settlement-and-funding.md) contracts, reported by [Base Observation And Fallback Review](./base-observation-and-fallback-review.md); and independent Bitcoin evidence. It provides exact roles, the workspace, operations, handoffs, package custody and automation of already-authorized actions.

## What does a normal loan look like from here?

This illustrative walk-through follows the approved [origination](../../system-model/behavior/flows/flow-001-origination-preparation-and-qualification.md), [activation](../../system-model/behavior/flows/flow-002-activation-completion-and-active-entry.md) and [normal repayment](../../system-model/behavior/flows/flow-004-normal-repayment-close.md) flows.

1. The borrower signs in and reserves a lender's published offer. The reservation creates the loan but is not an agreement.
2. Through separate handoffs, each participant's Vault allocates their keys for the loan, confirms their destinations and prepares their secret, returning only public keys and a commitment. The workspace records each step, so a refresh does not repeat it.
3. Both participants approve the same version of the final terms; the second matching approval commits the agreement exactly once, and any change cancels earlier approvals.
4. Once the borrower's Bitcoin prefund appears, Bitcoin operations build unsigned transactions and each Vault signs them locally through a handoff. The Application API verifies every signature and stores the package set before recording the receipt that funding qualification requires.
5. The lender funds the loan and the borrower deliberately accepts in their Vault, publishing the borrower's secret X on Base. Each Base step counts only when the observer reports its contract event final; Bitcoin activation counts only when it confirms.
6. The borrower repays, the lender's Vault claims with the lender's secret Y, and the application broadcasts the borrower's already-signed recovery transaction. The workspace shows the loan closed only after that spend confirms.

```figure
caption: For a command with an external effect, acceptance is only a receipt; the outcome comes from the owning source.
step: Command | The participant acts on the revision they saw, with a unique request key.
step: Accepted | The change, its operation and any job commit together in D1.
step: Wake or scan | An immediate wake starts a worker; a one-minute scan finds work the wake missed.
step: Submitted | The worker rechecks current facts and submits the exact action.
step: Observed | The observer reports the event, first provisional, then final.
step: Sourced result | Only the final contract event or confirmed Bitcoin spend changes the outcome.
```

## What happens when something goes wrong?

### A lost response or an unknown outcome

Repeating a command with the same request key and content returns the same operation; reusing the key with different content is rejected. After a timeout or restart the caller looks up the operation instead of guessing, so a lost response never becomes a duplicate. If the database is unavailable nothing is accepted, and the workspace reports the outage rather than cached data.

If an external submission times out or a provider answers ambiguously, the job moves to reconciling and is not resubmitted. It repeats only the identical action, with the same recipient, amount and signed bytes, once fresh evidence proves it is still needed. A safety-critical reconciliation asks for operator attention after 15 minutes; operators may investigate but cannot override a chain fact. The [workspace command contract](../../system-model/contracts/interfaces/iface-013-workspace-command-revision-outbox-and-result.md) holds the exact behavior.

### A lost response after a payment was signed

The contracts accept payment from any address, but each participant's Vault can also hold a **payment account**: a Base account for funding, repaying or sending USDC. It is separate from the participant's **protocol account**, the Base externally owned account (EOA) that calls the loan contract, and from the per-loan Bitcoin keys. Its address is offered for deposits only after a backed-up encrypted copy proves it can be restored. The Vault holds the key and signs; the Application API keeps the public records and decides which step may come next, so a stale tab or device cannot advance the payment.

```figure
caption: Each step is recorded before the next starts, so a lost response cannot cause a second signature or payment.
step: Intent recorded | The Application API stores the exact transfer and reserves the account's next transaction number.
step: Approved | The participant approves the exact recipient, amount and fee limit in the Vault.
step: Signing entered | The Application API records the signing phase before the Vault may sign.
step: Hash recorded | The Vault adds the signed transaction to its encrypted backup; then the public hash is recorded.
step: Broadcast | A broadcast marker is written, then the transaction is sent.
step: Settled or blocked | Evidence shows success, revert or normal pending; missing or contradictory evidence blocks the account.
```

A timeout after signing has begun is never proof that nothing was sent. The Application API probes at 0, 15 and 60 seconds and must escalate at 180 seconds; a known transaction awaiting inclusion is normal pending, not failure. Afterwards the participant or an operator may only request another check or resend the identical signed transaction; nothing is re-signed, fee-bumped, replaced or cancelled. A new device continues only by restoring the encrypted pending record or reproducing exactly the same signed bytes; otherwise the account stays visibly blocked until the original backup or device returns or the participant decides explicitly. Funding and repayment still advance only on the final contract event.

The account also allows one narrow non-loan purpose: sending the configured USDC to a recipient the participant chooses, with zero native value and exact approval of every field. It cannot change any loan. The [payment account and intent states](../../system-model/contracts/states/state-021-vault-owned-base-payment-account-and-intent.md) define every phase.

### A Cloudflare-wide outage

Every production component runs on Cloudflare, so one provider-wide outage can halt the product, the Application API and its database, the Base observer, the Vault, Bitcoin operations and the operator surface together, despite their separate projects, credentials and releases. The chains keep running; the application accepts no new consequential command and claims no chain result, and a participant can act only with a package exported before the outage. An external monitor, Better Stack, detects the outage from outside Cloudflare. When Cloudflare returns, Base and Bitcoin are reconciled before pending jobs resume. Backups outside Cloudflare protect data, not availability: there is no live fallback and no stated recovery time or recovery point objective. The [outage rule](../../build/records/constraints/cons-015-cloudflare-outage-fail-closed-and-reconcile.md) states this exactly.

If the hourly recovery copy falls behind, operators are warned at two hours and alerted critically at six; after 24 hours new loans stop qualifying while existing loans continue. In the demo, a failed step names the responsible component, keeps diagnostic state and never resets silently.

## What may this domain decide, and what must it not?

It decides who is signed in and in which role, whether a command is accepted and what work it creates, what the workspace shows and offers, which handoff a participant receives, which payment step may proceed, and how the demo starts, stops and resets.

It must not decide or imply:

- the canonical loan terms;
- anything needing a Vault password, seed, private key or the secrets X and Y;
- lender capital, destination choice or automatic lender-default broadcast;
- that a Base event or Bitcoin spend happened or is final: a login, prompt, cached status, email, balance, submitted transaction or finished worker proves nothing on either chain;
- that the fallback secret S has worked: the workspace shows only its public publication status, which is not a Bitcoin recovery.

The demo cannot redefine protocol meaning, act as a participant outside its isolated profile or activate a public deployment; its identities, funds and fixtures are rejected everywhere else.

## Why was it designed this way?

- **Internal accounts, replaceable provider.** Using the WorkOS identity as the account would embed a vendor identifier in loans, encrypted Vault data and audit records; an own login service now would add work before the product needs it. The approver, the person who reviewed and approved the design, specified isolating WorkOS behind replaceable adapters ([authentication selection](../../build/records/selections/sel-028-workos-authkit-provider-adapter.md)).
- **Current records plus outbox.** Full event sourcing would add complexity when both chains already keep histories, and records without source and audit history would make corrections unsafe ([workspace model](../../build/records/selections/sel-017-durable-workspace-command-and-projection-model.md)). A separate queue would add a second delivery model when D1 must commit state and work together anyway.
- **One workspace view and an operation per command.** The earlier implementation had no confirmed public way for the browser to load the workspace or recover a lost result. One view gives one coherent revision for loading and recovery; one uniform operation simplifies recovery and retry. The approver specified both.
- **One cloud provider.** More providers would multiply identity, data, deployment and incident paths before they are proven; the shared outage is an explicit simplicity tradeoff, not a continuity claim. The approver specified Cloudflare for every component ([provider topology](../../build/records/selections/sel-024-managed-provider-failure-domain-topology.md)).
- **A separately owned demo.** An unowned script would leave processes, saved state and reset safety without a verifiable owner, and extending the automated verification setup would blur disposable testing with a preserved demo. The approver accepted this direction; many of its details are recorded as chosen by the design agent, the AI agent that drafted the design ([demo runtime selection](../../build/records/selections/sel-035-local-demo-supervisor-and-runtime-layout.md)).
- **A Vault-owned payment account.** A browser-wallet extension would leave payment authority outside the product, and paying from the protocol account would merge caller, gas and payment boundaries. An independent Vault key, recoverable before exposure, prevents unrecoverable deposit addresses and duplicate payments at the cost of more backup and reconciliation work ([payment account selection](../../build/records/selections/sel-043-vault-owned-participant-payment-account-and-local-realization.md)).

## What is still open, excluded or deferred?

The [runtime profile claims](../../system-model/contracts/scope/scope-013-runtime-profile-claims-and-activation-gates.md) are separate, and none implies the next:

| Claim | What it would show | Current target |
| --- | --- | --- |
| Local verification | Automated scenarios with disposable fixtures | Required |
| Runnable local demo | One command runs the system and a browser journey completes | Required; acceptance evidence still planned |
| Testnet deployment | Deployment on a public test network | Not claimed |
| Mainnet deployment | Reviewed production deployment | Not claimed |
| Activated operation | Enablement, monitoring, incident response, paid services and legal gates | Not claimed |

- **Payments are designed, not proven.** The payment account has no implementation or execution evidence yet, and its signing format stays unverified until reference test vectors exist. A public two-provider check is also deferred.
- **No forgotten Vault password recovery.** It is [deferred](../../system-model/contracts/scope/scope-006-stronger-participant-vault-recovery.md): losing the Vault password loses the seed, the secrets and access to payment-account funds, and account recovery cannot help.
- **Cooperative settlement is not operational.** Its Bitcoin mechanism is fixed, but the signing session, Base accounting and support procedures are [deferred](../../system-model/contracts/scope/scope-005-cooperative-settlement-operations.md).
- **Replacing WorkOS is deferred.** A [replacement](../../system-model/contracts/scope/scope-015-application-owned-authentication-replacement.md) must keep internal account, loan and Vault identities and prove linking, session, MFA and recovery parity, cutover, rollback and adapter conformance.
- **Platform-paid reveal is deferred.** The current design sends a one-time gas stipend to the protocol account and the participant signs and submits; a [relayer or paymaster](../../system-model/contracts/scope/scope-014-platform-paid-base-reveal-execution.md) is a future choice.
- **Production payment gas is deferred.** The demo's funding of payment addresses is setup, never evidence of a participant payment or of sponsorship.
- **Product email is release-gated** while Cloudflare Email Sending is in beta.

The [domain record](../../system-model/domains/participant-access-and-loan-operations/domain.md) lists exactly what the domain owns and excludes.
