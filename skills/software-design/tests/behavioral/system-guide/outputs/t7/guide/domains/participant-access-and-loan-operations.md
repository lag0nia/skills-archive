# Participant Access And Loan Operations

This domain is the product people actually use: it signs participants in, keeps a durable workspace for each loan, carries requests to the participants' Vaults and to the chains, runs the background work, and shows what is known. It also provides an isolated local demonstration of the whole system. The [architecture guide](../architecture.md) shows how it sits between the participants and the domains that hold real authority.

## What this domain does

The loan's meaning, the participants' keys and secrets, the Base contract and Bitcoin consensus each hold their own authority, and none of them is a usable product on its own. This domain joins them into one workflow: it records who may act, what the application durably accepted, which operation is pending, and which outside result is known. Its records coordinate those authorities but never replace them. An application record is not a private key, not participant consent, and not a chain fact.

A reader needs a few terms:

- **The workspace** is the durable application view of one loan for one participant: its current status, where each fact came from and how fresh it is, and only the next actions that participant may take.
- **A revision** identifies the exact workspace state a command was based on, so a command built on stale information is rejected.
- **The outbox** records each required piece of background work in the same database transaction as the state change that needs it, so a crash or a lost wake-up call cannot lose the work.
- **A handoff** gives one participant access to one bounded action in their Vault, the separate browser application that holds their keys. It is a single-use code, not a general signing token.
- **A payment intent** fixes one exact public payment request before the participant's Vault signs it.

These terms keep apart events that look similar but mean different things: a command accepted by the application, a transaction submitted, an event observed, an event final on Base, a transaction broadcast on Bitcoin, and a transaction confirmed.

## How its responsibilities work together

[Participant identity and role access](../../system-model/domains/participant-access-and-loan-operations/responsibilities/sr-010-participant-identity-and-role-access.md) owns accounts, roles, sessions, sign-in recovery and fresh-access checks. Participants sign in through WorkOS, an external identity provider, using Google or an emailed six-digit code, behind an adapter; the application keeps its own permanent account identity and its own loan roles. One account may be a borrower on one loan and a lender on another, but never both on the same loan. Sessions last at most seven days, end after 24 hours of inactivity, and sensitive steps, such as retrieving encrypted Vault data, opening a Vault handoff or replacing the Vault password, need a sign-in no older than 15 minutes. A participant may enroll an authenticator app for time-based one-time passwords (TOTP); once enrolled, it is required for those steps. Signing in lets a participant retrieve only their own encrypted artifacts; it can never decrypt a Vault or make a chain action valid.

[Loan workspace and application coordination](../../system-model/domains/participant-access-and-loan-operations/responsibilities/sr-011-loan-workspace-and-application-coordination.md) owns the workspace, revisioned and idempotent commands, the outbox and background jobs, stored records and projections, notifications, the archive of signed Bitcoin packages, the gas stipends and the handoffs to the Vaults. It also browses and reserves offers, coordinates the final-terms approvals, coordinates Vault payment accounts, provides the separate operator console, and runs the permissionless and fixed-effect automation: finalizing funding and repayment, scheduling the unclaimed-repayment refund at the claim cutoff, and asking Bitcoin operations to act after a secret becomes final.

[Local runtime composition and controlled demonstration](../../system-model/domains/participant-access-and-loan-operations/responsibilities/sr-012-local-runtime-composition-and-controlled-demonstration.md) assembles the real, independently built parts through their public interfaces into one local system that a developer can start, resume and check with one entrypoint, with matching commands for status, shutdown and reset.

The domain receives the loan's meaning from the terms domain, public results and signatures from the Vaults, transactions and status from Bitcoin operations, and final Base facts from the observer. It provides the participants' approvals, the stored packages and the workflow that ties these together.

## A normal case

The following case is illustrative. Ana is a borrower and Ben a lender, each with their own browser session and Vault.

1. **Reserving.** Ana signs in, browses Ben's firm offer and reserves it. The application records the reservation and its timers as product records, and asks each Vault, through a handoff, to set aside a loan key and prepare destinations and a secret commitment. Each request has a durable pending or completed status, so a page refresh or restart resumes it rather than starting over.
2. **Approving.** The workspace shows both participants the understandable final terms and the identities they bind. Each approves that exact version from their signed-in session.
3. **Signing.** Bitcoin operations produce the complete, unsigned signing context. The application stores it as an immutable batch and opens a handoff: Ana's browser passes a short-lived, single-use code to her Vault, which signs in independently, redeems the code, reloads and checks the exact bytes, and signs locally. The application verifies the returned signatures, writes every package to its primary archive and only then issues a receipt.
4. **Following the chains.** After Ben funds the loan and Ana deliberately accepts it in her Vault, the observer's final Base event and independent Bitcoin evidence drive separate updates of the workspace and separate background jobs. Each job was committed with the state change that needed it.
5. **Signing the exits.** Once the activation escrow has six confirmations, a second Vault handoff asks Ana to sign her twelve exit transactions and Ben his six. The workspace shows the loan as active only after both sets are signed and archived with a validated receipt; until then it shows the loan as waiting for that signing, raises alerts and keeps prompting whoever has not signed.
6. **Closing.** Repayment and the claim follow the same pattern: the workspace advances only on the contract's final events and on the confirmed Bitcoin recovery.

```figure
caption: The application's own records move first, but a participant sees a chain result only once the chain's own evidence supports it.
step: Command | A participant's request is accepted against the current revision and gets a durable identity.
step: Commit | The state change and its job are recorded together.
step: Act | A job or a Vault handoff carries out the exact action.
step: Observe | Final Base events and independent Bitcoin evidence come back.
step: Show | The workspace shows the sourced result and the next allowed actions.
```

## Exceptions and recovery

**Lost wake-ups and crashes.** Waking a job immediately is only an optimization. A scan every minute finds any missed or crashed work, and failed jobs retry after 1, 2, 5 and 15 minutes and then hourly, but only after the application reloads its records and the chain facts and proves that the identical action is still needed.

**Ambiguous results.** The exact request, route, participant, amount, nonce, fees, bytes, provider and transaction identities survive every uncertain outcome. A lost response never becomes a new payment or a changed action; retries reuse the same command identity, and a changed request under the same identity is rejected.

**Payments from a Vault payment account.** Each participant can have a Vault payment account, a Base account separate from their protocol account and from their Bitcoin keys, which can pay funding or repayment like any other wallet. It is registered only after the participant's encrypted backup proves it can be restored at the same address. The application fixes the exact payment intent and enters a durable "signing" phase before the Vault signs. From then on, a timeout or closed tab does not prove the payment was never sent: a new device must restore or exactly reproduce the pending transaction, or the account stays visibly blocked. Reconciliation probes the outcome at 0, 15 and 60 seconds and escalates at 180 seconds. A normal inclusion delay is shown as such, and an unresolved outcome blocks the account from new payments.

**A Cloudflare-wide outage.** Every production application component of version 1 runs on Cloudflare, so one provider outage can suspend the product, the Vault, the API and its database, the observers and the automation together. The chains keep running, and the application accepts no new consequential command while it is down. On return, it reconciles Base and Bitcoin before resuming jobs. Hourly backups to a separate cloud account, plus a daily database dump, protect the data, not continuity of service; there is no stated recovery time or data-loss objective. A backup that is two hours behind raises a warning, six hours a critical alert, and 24 hours pauses the qualification of new loans without affecting existing ones. An external monitor, Better Stack, watches from outside Cloudflare.

**A forgotten Vault password.** Recovering the product account restores sign-in and access to the encrypted data, not the Vault password, the keys or the secrets behind it. Version 1 has no forgotten-password recovery.

## Authority boundaries

- **No secrets in the application.** The application never receives a Vault password, seed, private key or unrevealed secret, and has no API that carries one. It prepares the acceptance and claim calls without the secret; the Vault inserts the secret and signs locally.
- **Identity is not authority.** Sign-in, a role, account recovery, a reservation or an approval does not grant consent to a transaction, funding, chain ownership or a beneficiary. An email address or provider identity never becomes a permanent participant, loan or Vault identity.
- **Operators are bounded.** Workforce operators use a separate console behind Cloudflare Access with company Google identities, a mandatory one-time code and 15-minute sessions. Every request needs the exact permission for its action: viewer (read only), operator (fixed review, incident, recheck, automation pause, fee-tier, fee-bump export and Base request actions) or security_admin (manages operators and their roles). One operator approves an action alone; every attempt, including rejected ones, is written to an audit log operators cannot edit. No operator can override a chain fact, choose a destination or touch participant keys.
- **Notifications carry no authority.** Product emails contain no secret and no link that performs an action, and they never change loan state or prove that a participant saw something.
- **Gas help is not a relayer.** The application can send a small, one-time amount of Base gas to a participant's protocol account, but it never builds, signs or submits a call that reveals a secret.

## The local demonstration

The local profile is a developer-run version of the whole system on one machine. It uses a local Base chain (Anvil) with a fake USDC token, two connected Bitcoin regression-test nodes, the real product, Vault, API, observer and Bitcoin operations, and exactly two isolated participants with separate browser sessions and Vaults. One entrypoint checks prerequisites, starts or resumes the system, waits for every part to be healthy and reports the result; matching commands show status, shut it down and reset it. Ordinary shutdown keeps the state, and only an explicit reset asks each component to reset its own data.

The demonstration's goal is a browser-driven journey through the real product and Vault: creating, backing up and restoring a Vault, completing one loan through funding, acceptance and activation, normal repayment and the confirmed return of the collateral. It produces a redacted local receipt. The local profile refuses to start if any setting points at a public network or credential, and its fixed demo identities never enter a normal public build.

> **What the local demonstration does not prove**
> A passing test, a healthy process, a seeded fixture or a demo receipt shows only that the local profile works. It does not show a testnet or mainnet deployment, compatibility with real providers, a completed security audit or readiness for production, each of which needs its own evidence and gate.

## Choices and their reasons

- **A separate domain for the product.** When the user asked where the ordinary web application belonged, the agent recommended a separate domain for participant access and the loan workspace, because the design lacked a home for that application layer; the user approved it.
- **Proving the consumer path.** The records add explicit work for how a browser obtains and refreshes its workspace and recovers an accepted operation, because a command that works inside one service and a passing test harness did not by themselves show that a browser could do so.
- **A runnable local composition.** Independently built parts did not by themselves provide a persistent, runnable demonstration or a safe separation between local and public settings, so the local composition was added as its own responsibility.
- **Vault-owned payment intents.** Fixing the exact intent before signing, and keeping the pending transaction in the Vault, is designed to prevent addresses that cannot be recovered, duplicate payments after lost responses, and the mixing of protocol keys with payer identities. The design is not yet verified in implementation, and an unresolved case leaves the account blocked until the participant decides.
- **One managed provider.** All production application components run on Cloudflare as a deliberate simplicity tradeoff; separate projects and credentials limit narrower failures, but this is not independence from the provider.

## Open, excluded and deferred

- **Vault payment accounts are a target, not verified behavior.** Their exact-payment and participant-transfer design is selected, but no execution evidence exists yet. The participant transfer can send only the configured USDC to a recipient the participant chooses; arbitrary calls, approvals, swaps, other assets, native-coin sends and generic signing are excluded. Providing Base gas to these accounts in public production is deferred, and so is the policy of reconciling their payments across two public data providers.
- **Profiles beyond local** ([testnet, mainnet and production](../../system-model/contracts/scope/scope-013-runtime-profile-claims-and-activation-gates.md)) are not claimed by this version.
- **Platform-paid secret-revealing calls** through a relayer or paymaster are [deferred](../../system-model/contracts/scope/scope-014-platform-paid-base-reveal-execution.md).
- **Replacing the identity provider** is [deferred](../../system-model/contracts/scope/scope-015-application-owned-authentication-replacement.md); a replacement must preserve every internal account, loan and Vault identity.
- **Forgotten-password recovery** and **complete cooperative-settlement operations** are deferred under their own [Vault recovery](../../system-model/contracts/scope/scope-006-stronger-participant-vault-recovery.md) and [cooperative settlement](../../system-model/contracts/scope/scope-005-cooperative-settlement-operations.md) boundaries.

The [domain record](../../system-model/domains/participant-access-and-loan-operations/domain.md) lists exactly what the domain owns and excludes.
