# Participant Access And Loan Operations

This domain turns the separate authorities of the agreement, the participants' Vaults, Base and Bitcoin into a usable product. The [architecture guide](../architecture.md) shows how it coordinates the other four domains without taking over their authority.

## What this domain does

The domain records who may act, what the application has durably accepted, which public operation is pending, and which externally sourced result is known. It also owns a deliberately isolated developer demonstration. Application records coordinate the other authorities; they can never become private keys, participant consent or blockchain truth.

The concepts a reader needs:

- A **workspace** is the durable application view of one loan for one participant role, holding sourced status and the actions currently allowed.
- A **revision** identifies the exact state a command was based on, so a command made against an outdated view is rejected rather than misapplied.
- An **outbox** records required work in the same database transaction as the state change, so losing an immediate wake-up cannot lose the operation.
- A **handoff** gives one participant access to one bounded action in their Vault, through a short-lived, single-use code. It is not a general signing token.
- A **payment intent** fixes one exact public payment request before the participant's Vault signs it.

Together these distinguish an accepted request from a submitted transaction, an observed one, a finalized contract event and a confirmed Bitcoin spend.

## How its responsibilities work together

[Participant identity and role access](../../system-model/domains/participant-access-and-loan-operations/responsibilities/sr-010-participant-identity-and-role-access.md) owns accounts, borrower and lender roles, sessions, account recovery, fresh reauthentication and multi-factor authentication (MFA), and permission to fetch the encrypted artifacts bound to a participant. Sign-in uses WorkOS behind a provider adapter, while the stable account identity and loan roles stay owned by the application. Access for the organization's own operators is separate. Signing in can authorize fetching encrypted Vault data; it cannot decrypt a Vault, recover a seed or secret, or make a chain action valid.

[Loan workspace and application coordination](../../system-model/domains/participant-access-and-loan-operations/responsibilities/sr-011-loan-workspace-and-application-coordination.md) owns revision-checked commands, safe retries of the same request, durable outbox work, source records, the status shown to participants, notifications, stored transaction packages, gas-stipend records and the exact Vault handoffs. A product page can load and refresh its authorized workspace, tell a missing or unauthorized result apart from a stale or unavailable one, receive an acknowledgement for an accepted command, and recover the same result after a refresh or restart. A mock, a health check or a method that is only callable internally does not prove that this public path works.

[Local runtime composition and controlled demonstration](../../system-model/domains/participant-access-and-loan-operations/responsibilities/sr-012-local-runtime-composition-and-controlled-demonstration.md) assembles the independently built parts through their public interfaces for a developer. One entry command checks prerequisites, starts or resumes, waits for every part to be healthy and reports; matching status, shutdown and explicit reset or reseed commands make state ownership clear. The local setup uses a local Base test chain with a test USDC token, two connected persistent local Bitcoin test nodes, two isolated participants with their own browser sessions and Vaults, the real product, Vault, API, observer and Bitcoin operations, and fixtures bound to those identities. A coordination record points to state that each producing part owns, instead of owning or deleting it. Ordinary shutdown keeps that state; only an explicit reset asks each part to reset its own.

## A normal case

1. **Agreement.** The application binds authenticated participants to a reserved loan. Each Vault returns acknowledged public identities and preparation material, and the final candidate is approved under the loan-terms rules, where whether the lender approves it a second time is an open question.
2. **Signing.** Bitcoin operations produce complete unsigned signing material. The application stores an immutable batch, the product opens a bounded Vault handoff, and the Vault signs locally. The application checks the result, writes the full package set to storage and only then issues its receipt.
3. **Funding, acceptance and activation.** After funding is final and the borrower deliberately accepts, finalized public X on Base and independent Bitcoin evidence drive separate status and operation steps.
4. **Repayment.** Normal repayment likewise waits for finalized contract outcomes and a confirmed Bitcoin recovery before the workspace shows the loan as closed.

```figure
caption: The application moves forward only on durable records and sourced facts, never on a response it assumes.
step: Command | A participant's request is checked against the current revision.
step: Commit | The state change and its job are saved together.
step: Hand off | The Vault performs the bounded action locally.
step: Observe | Base and Bitcoin evidence arrive from their own sources.
step: Show | The workspace shows sourced status, provisional or final.
```

## Exceptions and recovery

- **Lost wake-ups and crashes.** An immediate private wake-up is only an optimization. A scan every minute finds missed or crashed work, which retries only after the application has re-checked that the identical action is still needed.
- **Ambiguous outcomes.** The exact request, route, participant, amount, nonce, fees, bytes, provider and transaction identities survive an ambiguous result, so a lost response never becomes a new payment or a changed action. A known delay in inclusion is kept separate from unresolved reconciliation: a payment is probed at 0, 15 and 60 seconds, and at 180 seconds an escalation decision is mandatory. The participant or an authorized operator may then trigger an explicit reprobe or an identical retry, a payment known to be pending may stay pending, and only missing or contradictory evidence blocks it.
- **Payment accounts.** A Vault payment account is separate from the participant's protocol address and loan keys. It is made public only after a backup proves it can be restored to the same address. The application owns the public intent and the ordering controls; the Vault owns the encrypted pending bytes and signing. The application records that signing has begun before the signer runs. A timeout after that point is not proof that nothing was sent. A new device must restore the pending bytes, or reproduce them exactly once the required reproduction proof exists; otherwise the account stays visibly blocked until an explicit recovery or decision. A repeated broadcast uses identical bytes, and any change needs a fresh review.
- **Provider outage.** All production application parts share Cloudflare as one failure domain, despite separate origins, projects, credentials and releases. A provider-wide outage can stop the product, Vault, API and database, observers and automation together. The chains keep running; new consequential commands stop; and after recovery the application reconciles Base and Bitcoin before resuming its jobs. Backups outside the provider protect stored data, not a running service, and no recovery time is promised.

## Authority boundaries

The domain decides application access, durable workflow and presentation. It never holds Vault passwords, seeds, private keys or unrevealed secrets, signs Bitcoin or participant Base transactions, defines the agreement, holds lender capital, decides chain facts, judges the fallback evidence, chooses destinations, or broadcasts lender-default transactions automatically. A login, prompt, cache, notification, balance, submitted transaction, relay response, completed worker, silent observer, missing secret or application state does not mean chain finality, Bitcoin confirmation, default, beneficiary selection or secret recovery.

A participant may also send configured USDC from their Vault payment account to an address they choose, after exact approval and balance and gas checks. That transfer has no link to a loan and cannot advance loan state. Arbitrary contract calls, token approvals, swaps, other assets, native-currency sends and generic signing are excluded. The local setup funds public payment addresses with disposable test money, but that is neither evidence of a participant payment nor production gas sponsorship for payment accounts, which is deferred.

## Choices and their reasons

- **Public consumer continuity.** A command that works only inside the producing service, and a passing test harness, do not by themselves ensure that a browser can load state or recover an accepted operation, so the public read, acknowledgement and result paths are explicit.
- **A separate local composition.** Independently implemented parts did not by themselves provide a persistent, runnable demonstration or a safe separation between the local setup and public profiles.
- **Vault-owned payment accounts.** Keeping payment keys in the Vault, exposing an address only once it is recoverable, and having the application record each exact intent before the Vault signs it prevents exposing addresses that cannot be recovered, paying twice after a lost response, and mixing protocol keys with payer identities.

## Open, excluded and deferred

Automated local verification, the runnable local demonstration, test-network and main-network deployment, and activated production operation are separate claims under the [runtime profile scope](../../system-model/contracts/scope/scope-013-runtime-profile-claims-and-activation-gates.md); only the first two are required in this version. The local demonstration is not yet delivered: its own supervisor is still in progress, it waits on pending work in other parts, and its browser acceptance check is planned and unverified. The Vault payment capability's delivery is recorded as partial, and its check in the local demonstration is planned and unverified. A test, fixture, healthy process or demonstration receipt cannot by itself satisfy those claims, and no local evidence satisfies the later activation gates.

This version has no way to recover a forgotten Vault password; a stronger recovery mechanism and complete cooperative settlement operations are deferred under [stronger Vault recovery](../../system-model/contracts/scope/scope-006-stronger-participant-vault-recovery.md) and [cooperative settlement operations](../../system-model/contracts/scope/scope-005-cooperative-settlement-operations.md). Replacing WorkOS with an application-owned sign-in service is deferred; a replacement needs an explicit runtime and provider choice and must keep internal account, loan and Vault identities and prove account linking, session, MFA and recovery parity, cutover, rollback and adapter conformance ([authentication replacement](../../system-model/contracts/scope/scope-015-application-owned-authentication-replacement.md)). Optional platform-paid submission of the borrower's acceptance and the lender's claim is also deferred; in this version participants sign and submit those calls themselves from their protocol address, which receives a bounded prefunded gas stipend, and paying their own gas always remains possible ([platform-paid reveal execution](../../system-model/contracts/scope/scope-014-platform-paid-base-reveal-execution.md)).

The [domain record](../../system-model/domains/participant-access-and-loan-operations/domain.md) lists exactly what the domain owns and excludes.
