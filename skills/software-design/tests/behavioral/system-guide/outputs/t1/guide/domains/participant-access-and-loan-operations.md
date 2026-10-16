# Participant Access And Loan Operations

This domain turns the separate authorities of the loan agreement, the participants' Vaults, the Base contracts and Bitcoin into one usable product: it knows who may act, records what the application accepted, runs the resulting work reliably and shows each participant what is pending and what is known. It also owns an isolated local demonstration of the whole system. Application records coordinate those authorities; they never become private keys or chain truth, and recording an approval grants no signing, custody or funding authority. The [architecture guide](../architecture.md) shows where it fits in the system.

## What this domain does

A borrower and a lender use the product to find and reserve an offer, approve terms, sign packages, fund, accept, repay and claim. Each of those steps depends on an authority that lives elsewhere: the meaning of the terms, the keys in a participant's Vault, a contract on Base or a transaction on Bitcoin. This domain coordinates them without absorbing them.

The concepts a reader needs:

- An **account** is the stable internal identity of a person in the product. A sign-in provider identity is only linked to it.
- A **workspace** is the durable application view of one loan for one participant role: its current status with the source and freshness of each fact, and only the next actions that participant may take.
- A **revision** identifies the exact workspace state a command was based on, so a command built on stale information is rejected.
- An **outbox** records the work a state change requires in the same database transaction as the change, so a lost wake-up cannot lose the work.
- A **handoff** is a short-lived, single-use pointer that directs a participant's separately signed-in Vault to one bounded action, such as signing one exact batch of packages. It is not authentication, consent or a signing token.
- A **payment intent** fixes one exact public payment request before the participant's Vault signs it.

These concepts keep an accepted request distinct from a submitted transaction, an observation, a finalized contract event and a confirmed Bitcoin spend.

## How its responsibilities work together

The domain has three responsibilities:

- [Participant identity and role access](../../system-model/domains/participant-access-and-loan-operations/responsibilities/sr-010-participant-identity-and-role-access.md) owns accounts, borrower and lender roles, sessions, recovery of product access, fresh reauthentication with optional time-based one-time passwords (TOTP), and permission to retrieve a participant's own encrypted artifacts. Sign-in uses Google or a six-digit email code through WorkOS behind an adapter, while accounts and loan roles stay in the application. One account may be borrower on one loan and lender on another, but never both on the same loan.
- [Loan workspace and application coordination](../../system-model/domains/participant-access-and-loan-operations/responsibilities/sr-011-loan-workspace-and-application-coordination.md) owns the workspace, revisioned and idempotent commands, durable background work, source records, notifications, package storage and receipts, Vault handoffs, payment intents and the fixed-effect automation that operates already-authorized actions. A browser can load and refresh its workspace, get an acknowledgement for an accepted command, and recover its result after a refresh or restart.
- [Local runtime composition and controlled demonstration](../../system-model/domains/participant-access-and-loan-operations/responsibilities/sr-012-local-runtime-composition-and-controlled-demonstration.md) assembles the independently built parts through their public interfaces into one developer-run local system, with a single command to start or resume it and explicit controls for status, shutdown and reset.

The domain receives the meaning of the loan from Loan Terms And Commitments, finalized Base facts from Base Observation And Fallback Review, and Bitcoin evidence and unsigned packages from Bitcoin Authorization And Recovery. It provides the participants' approvals, the bounded Vault handoffs, durable package storage and the jobs that operate fixed actions.

### Signing in is not unlocking

Product sign-in authorizes access to a participant's own encrypted Vault data and packages; it cannot decrypt the Vault, recover a seed or a secret, or make a chain action valid. The Vault is a separate application with its own origin, repository, hosting project and sign-in configuration. It loads only pinned, necessary dependencies, with no analytics, advertising, remote scripts or unnecessary third-party code. Sensitive actions, namely retrieving encrypted Vault data, requesting the seed display, obtaining a current package, opening a Vault handoff or replacing the Vault password, need a reauthentication no older than 15 minutes, plus a TOTP code when the participant has enrolled one. Replacing the Vault password also needs the current password and a separate single-use email confirmation bound to that session and action. Sessions last at most seven days and end after 24 hours of inactivity.

Access errors are deliberately uninformative: an authenticated participant gets the same "not found" answer for a resource that does not exist and for one outside its account or loan, while "forbidden" is reserved for a known action within its scope. The workspace also tells apart results that are stale or unavailable.

Workforce operators are a separate population. They sign in through Cloudflare Access with company Google accounts, a mandatory six-digit authenticator-app code (email codes do not count) and a 15-minute session, and every request also needs an active operator record with the exact permission for the action: viewer, operator or security administrator. Operators can acknowledge incidents, pause automation, request rechecks, choose an already-signed fee level, export a reviewed fee-bump request and request Base calls whose effect is already fixed. A participant account grants no operator authority, and every privileged attempt is recorded in an audit log that operators cannot edit.

## A normal case: from reservation to a stored package set

The following case is illustrative; it follows one participant action through the domain.

```figure
caption: How the application coordinates a signing step without ever holding a key.
step: Command | The participant acts on the revision it saw; the change and its job commit together.
step: Handoff | The product directs the Vault with a single-use code bound to one participant, loan and action.
step: Sign | The Vault signs in separately, reloads the exact request, checks it and signs locally.
step: Verify and store | The application verifies, stores the full set, issues its receipt and updates the workspace.
```

After a borrower reserves an offer, the application binds the two authenticated participants to the new loan. Each participant's Vault returns acknowledged public keys and preparation material through handoffs. The detailed terms records then require both participants to approve the same final terms; the architecture record's wording that reservation needs no second lender approval is an open conflict described in the [Loan Terms And Commitments guide](loan-terms-and-commitments.md).

When packages need signing, the Bitcoin operations produce the complete unsigned request, the application stores it as one immutable batch, and the product launches a handoff. The handoff code travels only in the address fragment, is redeemed once by the Vault under its own fresh session, and binds one participant, role, loan, workspace revision and exact action. The Vault reloads and checks the request itself before signing. The application then verifies every signature, writes the complete set to locked object storage and only then issues its receipt.

Later steps follow the same pattern. After funding is finalized and the borrower deliberately accepts, finalized Base events and agreed Bitcoin evidence drive separate updates. Normal repayment likewise waits for finalized contract outcomes and a confirmed Bitcoin recovery before the loan is shown as closed.

### Reliable background work

A required state change and its job commit together in the D1 database. An immediate wake-up is only an optimization: a one-minute scan finds any missed or crashed work. Retries happen after 1, 2, 5 and 15 minutes and then hourly, and each retry first reloads the database and the canonical sources to prove that the identical action is still needed. Exact request, participant, amount, nonce, fee, bytes, provider and transaction identities survive an ambiguous outcome, so a lost response never turns into a second payment or a different action. Anyone may still submit a permissionless Base call before the system does.

## Payments from a Vault payment account

A participant can keep a **Vault payment account**, a Base account generated in its Vault separately from its loan keys and its Base protocol account. Its address becomes public only after the Vault shows that its current backup restores the same address. The participant can use it to fund or repay a loan, or for a narrow non-loan transfer of the configured USDC to a recipient of its choice.

Every payment starts as a payment intent that fixes the account, nonce, amount, recipient and fee, and the application enters a durable signing phase before the Vault signs. Before signing, any edit invalidates the approval and needs a new intent. After signing, version 1 allows only a rebroadcast of the identical bytes, or a verified reproduction of them; a new signature, a fee bump, a replacement or a cancellation is not supported. A timeout after signing is not proof that nothing was sent.

When a submission's outcome is unclear, the application probes at 0, 15 and 60 seconds and makes a mandatory escalation decision at 180 seconds. A known pending transaction is normal delay, not a failure; after escalation, a participant or operator may only probe again or rebroadcast the identical bytes. The account is visibly blocked only when the exact pending bytes can be neither found nor reproduced, or the evidence is contradictory. A new device must restore or reproduce the exact pending bytes, or the account stays blocked.

None of this changes the loan's rules. Funding and repayment remain payer-neutral, historical terms never change, and only the finalized contract event establishes funding or repayment. A non-loan transfer has no loan binding and never advances a loan. Arbitrary calls, approvals, swaps, other assets, native-currency sends and generic signing are not supported.

## The local demonstration

The target outcome of the design is a developer-run local system in which two isolated participants complete one loan through normal repayment and confirmed return of the borrower's collateral. It uses the real product, Vault, API, observer and Bitcoin operations, with a local Base chain and test USDC, two connected persistent Bitcoin regtest nodes and two separate browser sessions and Vaults.

One entrypoint checks preconditions, starts or resumes, waits for health and reports the system. Ordinary shutdown preserves all state; only an explicit, bounded reset clears it, through each component's own reset contract. The local profile fails closed before any demo provisioning or seeded action if a required local setting is missing or conflicting, or points elsewhere, such as a non-loopback address, a public network, public credentials or a public deployment manifest. Local test funds are setup, not evidence of a participant payment, and a successful demo proves nothing about testnet, mainnet or production.

## Exceptions and recovery

- **Stale or wrong commands.** A stale revision, a reused idempotency key with a different body, a partial update or the wrong participant, loan, chain, contract, action, account, recipient, amount, nonce, fee or package is rejected. An identical retry returns the original result.
- **Reservation timers.** The application runs the reservation rules. When the 24-hour reservation ends with no valid prefund, it cancels the reservation, reopens the offer, blocks that borrower from that offer, records one infraction and notifies both parties; the offer-state record instead treats a reservation that ends before terms commitment, with no prefund attempt, as expired, a discrepancy the [Loan Terms And Commitments guide](loan-terms-and-commitments.md#exceptions-and-recovery) describes. A valid prefund stuck for 72 hours goes to manual review, with an operations alert and an email suggesting a fee bump, and no automatic infraction.
- **Backup copies behind.** Newly stored package objects and new encrypted Vault versions are copied hourly to separate storage outside Cloudflare. The application warns at two hours of lag, raises a critical status at six hours and pauses new qualification at 24 hours without invalidating existing loans.
- **Notifications fail.** Product email is retried for at most 24 hours. It never contains a secret or an action link, never changes loan state and never proves that a participant saw it.
- **Cloudflare is down.** All application parts share one provider failure domain, so a provider-wide outage stops the product, Vault, API, observers and automation together. The chains continue; new consequential commands stop. On return, both chains are reconciled before jobs resume. There is no live fallback and no stated recovery time or recovery point objective. An external monitor checks health every three minutes and alerts by email after two consecutive failed checks.
- **A forgotten Vault password.** Product account recovery restores sign-in and access to encrypted data only; it cannot recover the Vault password.

## Authority boundaries

The domain decides who may use the product, what the application accepted and which already-authorized work to run. It must not:

- hold or see Vault passwords, seeds, private keys or unrevealed secrets, or sign any Bitcoin or Base participant transaction;
- define the loan terms, hold lender capital, choose a destination, judge the fallback service's evidence or broadcast a lender default automatically;
- treat a sign-in, prompt, cache, notification, balance, submitted transaction, relay response, worker completion or missing secret as chain finality, Bitcoin confirmation, default or recovery.

> **Accepted is not done**
> The workspace keeps accepted, completed by a worker, submitted, observed, finalized, broadcast and confirmed as separate states, each with the source and freshness of the fact behind it.

## Choices and their reasons

- **Browser-visible continuity.** A command that works inside its own service and a passing test harness do not by themselves ensure that a browser can load state or recover an accepted operation, so the public consumer path is part of the design.
- **One isolated local composition.** Independently built parts did not by themselves provide a persistent runnable demonstration or safe separation from public profiles.
- **Vault-owned payment accounts with exact intents.** They prevent unrecoverable exposed addresses, duplicate payments after lost responses and accidental mixing of protocol keys with payer identities.
- **WorkOS behind an adapter, with application-owned accounts.** Using the provider's identity as the account would embed a vendor identifier in immutable loan, Vault, role, audit and recovery records, while building the application's own authentication now would add security and operations work before the product needs it. The [sign-in provider selection](../../build/records/selections/sel-028-workos-authkit-provider-adapter.md) records this.

## Open, excluded and deferred

- **Runtime claims.** Verification, runnable local use, testnet or mainnet deployment and activated production operation are separate claims, and this design claims only the first two. A fixture, a healthy process or a local check cannot satisfy a later profile's gate; see the [runtime profile boundary](../../system-model/contracts/scope/scope-013-runtime-profile-claims-and-activation-gates.md).
- **Deferred capabilities.** Forgotten-password recovery and complete cooperative settlement operations are deferred. Platform-paid execution of the secret-revealing Base calls is deferred; in version 1 participants sign and submit them, helped by a bounded fee stipend. Production gas funding for Vault payment accounts is also deferred.
- **Replacing the sign-in provider.** WorkOS is the selected version 1 provider. A replacement must preserve internal account, loan and Vault identities and prove authenticated linking, session, multi-factor and recovery parity, cutover, rollback and adapter conformance; it remains deferred.
- **User interface.** The user-interface specification and prototype are in scope as a presentation contract only; application implementation, production visual review and user testing are outside this design package.

The [domain record](../../system-model/domains/participant-access-and-loan-operations/domain.md) lists exactly what the domain owns and excludes.
