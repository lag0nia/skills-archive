# Participant Access And Loan Operations

This domain turns the separate agreement, Vault, Base and Bitcoin authorities into a product people can use. It records who may act, what the application durably accepted, which operation is pending and which externally sourced result is known, and it owns a deliberately isolated developer demonstration. The [architecture guide](../architecture.md) shows where it fits in the system.

## What this domain does

Borrowers, lenders and the company's staff need one place to see a loan, take the next step and recover after a refresh, a lost response or an outage. This domain provides that place while holding none of the authority it coordinates: application records cannot become private keys, participant consent or chain truth.

A few terms carry the rest of this guide:

- A **workspace** is the durable application view of one loan.
- A **revision** identifies the exact workspace state a command was based on, so a command built on stale information is rejected rather than applied.
- An **outbox** records required background work in the same database transaction as the state change, so losing an immediate wake-up can never lose the work.
- A **handoff** gives one participant access to one bounded action in their Vault, such as allocating a loan key or signing one exact batch. It is not a general signing token.
- A **payment intent** fixes one exact public payment request before the participant's Vault signs it.

These concepts keep an accepted request distinct from a submitted transaction, an observed event, a finalized contract event and a confirmed Bitcoin spend.

## How its responsibilities work together

[Participant identity and role access](../../system-model/domains/participant-access-and-loan-operations/responsibilities/sr-010-participant-identity-and-role-access.md) owns accounts, roles, sessions, recovery, fresh re-authentication and multi-factor checks, and permission to retrieve encrypted artifacts bound to a participant. Participants sign in through the selected identity provider, with Google or a six-digit email code, while the stable account and every loan role stay owned by the application. One account may be the borrower on one loan and the lender on another, never both on the same loan. Sessions last at most seven days and end after 24 hours of inactivity. Sensitive actions, such as fetching encrypted Vault data, viewing a current package, opening a Vault handoff or replacing a Vault password, need a sign-in no older than 15 minutes, plus a one-time code once the participant has enrolled one. Replacing a Vault password also needs a separate single-use confirmation through the participant's verified email. Signing in can authorize retrieving encrypted data; it cannot decrypt a Vault, recover a seed or secret, or make a chain action valid.

Company staff use a separate operator surface protected by a separate access service, with three explicit roles. Viewers read status, incidents and audit. Operators may acknowledge incidents, pause automation, request rechecks, choose an already signed fee variant, export one exact fee-bump request and request Base calls whose effect is already fixed. Security administrators manage operator access. Staff identity alone grants nothing.

[Loan workspace and application coordination](../../system-model/domains/participant-access-and-loan-operations/responsibilities/sr-011-loan-workspace-and-application-coordination.md) owns revisioned commands, duplicate-safe retries, durable background work, source records, the status projections participants see, notifications, the signed package archive, fee-stipend records and the exact handoffs to each participant's Vault. A participant's browser can load and refresh its authorized workspace, tell an absent, forbidden, stale or unavailable result apart, get an acknowledgement for an accepted command, and recover the same result after a refresh or restart. A mock, a health check or a producer-only method does not prove that this path works for a real consumer.

[Local runtime composition and controlled demonstration](../../system-model/domains/participant-access-and-loan-operations/responsibilities/sr-012-local-runtime-composition-and-controlled-demonstration.md) assembles the independently built parts of the system through their public interfaces into one developer-run demonstration. One entrypoint checks prerequisites, starts or resumes the system, waits until each part is healthy and reports status; matching status, shutdown and explicit reset commands make clear who owns which state. The local profile uses a local Base test chain with a test USDC token, two connected local Bitcoin test nodes, two isolated participant sessions and Vaults, and the real product, Vault, application service, observer and Bitcoin operations paths. Ordinary shutdown preserves state; only an explicit, bounded reset asks each part to reset its own state. This demonstration is the design's target outcome, and it is recorded as in progress and not yet runnable: its delivery is blocked until the Vault preparation change and its producers and acceptance evidence exist.

The domain receives committed terms from Loan Terms And Commitments, public results and signatures from the participants' Vaults, finalized Base facts from Base Observation And Fallback Review, and package and route status from Bitcoin Authorization And Recovery. It provides authenticated commands, the durable workspace, the package archive and the handoffs that let each of those domains act.

## A normal case: cooperation through a loan

Follow an illustrative loan through the product.

1. **Binding.** The application binds the two authenticated participants to a reserved loan and the current terms candidate.
2. **Vault preparation.** Through separate handoffs, each participant's Vault returns its acknowledged public identity and preparation results.
3. **Final terms.** Both participants approve the same final candidate under the rules of Loan Terms And Commitments, and the second approval commits it.
4. **Signing.** The Bitcoin automation produces complete unsigned packages with their review context; the application stores one immutable signing batch; the product launches the bounded Vault handoff; the Vault signs locally. The application revalidates the result, writes the full package archive and only then issues its receipt.
5. **Funding and acceptance.** After qualified funding and the borrower's deliberate acceptance, the finalized Base event and independent Bitcoin evidence drive separate status and operation steps.
6. **Repayment.** Normal repayment likewise waits for finalized contract outcomes and a confirmed Bitcoin recovery before the workspace shows the loan as closed.

> **Open at step 3**
>
> The sources disagree on whether the lender approves again at the final terms, given that publishing the offer was the lender's standing acceptance. The detailed terms rules require both approvals; the system-level wording says no second lender approval is needed. The package has not decided; the [Loan Terms And Commitments guide](loan-terms-and-commitments.md) explains both sides.

The Vault preparation in step 2 is a current design change whose implementation has not yet been delivered.

### Durable work behind each step

A required state change and its background job commit together in the application database. An immediate private wake-up is only an optimization; a scan every minute finds missed or crashed work. The exact request, route, participant, amount, nonce, fees, bytes, provider and transaction identities survive an ambiguous outcome, so a lost response never turns into a new payment or a changed action.

Every signed package set goes first to a locked primary object store with a database receipt; only then is it ready. An hourly job copies new packages and Vault versions to separate, locked storage outside Cloudflare, and a daily job exports the database there. Backup completion is not a per-loan gate: the system warns after two hours without a verified backup, alerts critically after six, and after 24 hours pauses new loan qualification until backups recover, without affecting existing loans or their recovery. Package archives are kept for seven years.

## Exceptions and recovery

- **Lost responses and retries.** A retried command with the same identity returns the same result. A command based on a stale revision is rejected, and the participant reloads.
- **Payment outcomes that are unclear.** For a payment from a Vault payment account, the system keeps a known inclusion delay distinct from an unresolved outcome: it checks at 0, 15 and 60 seconds and escalates at 180 seconds. After that, a participant or an authorized operator may explicitly recheck or resend the identical signed bytes; this never creates a new signing attempt. Only missing or contradictory evidence of the pending transaction makes the payment and the account visibly blocked. A timeout after signing is not proof that nothing was submitted; a new device must restore or exactly reproduce the pending transaction, otherwise the account stays visibly blocked.
- **A forgotten Vault password.** Account recovery restores sign-in and access to encrypted data only; nobody can rebuild a forgotten Vault password, seed, key or secret.
- **A provider outage.** All production application components share Cloudflare's failure domain, despite separate origins, projects, credentials and releases. A Cloudflare-wide outage can suspend the product, the Vault, the application service and database, the observers and the automation together. The chains continue, new consequential commands stop, and on return the system reconciles Base and Bitcoin before resuming jobs. Off-provider backups protect data recovery, not a running fallback, and no recovery-time or recovery-point objective is promised.
- **The local demonstration's safety checks.** Every local prerequisite must agree before setup. A missing or conflicting setting, a non-loopback address, a Bitcoin setup other than two connected local regtest nodes, a non-local Base chain, public credentials or a public deployment description stops the demonstration before anything is provisioned.

## Payment authority

A Vault payment account is a separate Base account inside the participant's Vault, independent of the participant's protocol address and per-loan Bitcoin keys. Its address is shown only after the participant's backup can restore the same address. The application owns the public payment intent, the nonce lease and its fencing, and the provider check; the Vault owns the encrypted pending bytes and the signing. The application records that signing has started before the Vault signs, and a repeat broadcast uses the identical bytes; any change needs a fresh review. The account's signing profile is recorded as not yet verified, so treat payment from it as planned rather than working behavior.

Each payment has exactly one purpose: funding, repayment or a narrow participant transfer. A participant transfer can send the configured USDC to a validated recipient the participant chooses, after exact approval and balance and fee checks. It has no loan binding and can never advance a loan. Arbitrary calls, token approvals, swaps, other assets, sending native currency and generic signing are excluded. None of this changes historical terms, payer-neutral settlement or who decides chain facts. Local setup may give disposable funds to public payment addresses; that is neither evidence of a participant payment nor production fee sponsorship. The fee stipend never funds a payment account, and production fee funding for payment accounts, like the public two-provider payment confirmation, is deferred.

## Authority boundaries

This domain decides who may act in the product, what the application accepted and in which order work runs. It must not hold or use Vault passwords, seeds, plaintext keys or secrets; sign for a participant on Bitcoin or Base; change canonical terms; touch lender capital; create a chain fact; judge fallback evidence; choose a destination; or broadcast a lender recovery transaction on its own. A participant's sign-in, a workspace label, an operator action or a healthy local process is never evidence that a chain outcome happened.

## Choices and their reasons

- **Consumer-visible continuity.** A producer-only command and a passing test harness did not by themselves ensure that a browser could load state or recover an accepted operation, so the design requires the real consumer path.
- **One isolated local composition.** Independently built parts did not by themselves give a persistent, runnable demonstration or a safe separation from public profiles, so one fail-closed composition owns that.
- **Vault-owned payment intent.** It prevents exposing addresses that cannot be recovered, paying twice after a lost response, and mixing protocol keys with payer identities.
- **A stable application account behind the identity provider.** Using the provider's subject as the account identity would embed a vendor identifier into immutable loans and encrypted Vault data.

## Open, excluded and deferred

- **Open:** the lender-approval question at the final terms, described above.
- **Claims:** verification, runnable local use, testnet and mainnet deployment, and activated production operation are separate claims under the [runtime profile and activation gates](../../system-model/contracts/scope/scope-013-runtime-profile-claims-and-activation-gates.md). The target requires deterministic local verification and a separately runnable local demonstration; the demonstration is not yet runnable, and nothing beyond it is claimed. A visual, fixture, healthy process or local design check satisfies none of these gates.
- **Deferred:** [stronger recovery of a forgotten Vault password](../../system-model/contracts/scope/scope-006-stronger-participant-vault-recovery.md); [complete cooperative-settlement operations](../../system-model/contracts/scope/scope-005-cooperative-settlement-operations.md); [platform-paid relaying of secret-revealing Base calls](../../system-model/contracts/scope/scope-014-platform-paid-base-reveal-execution.md), where current support is a bounded fee stipend to the participant's protocol address plus the participant's own signing and submission; and [replacing the selected identity provider](../../system-model/contracts/scope/scope-015-application-owned-authentication-replacement.md), which would have to preserve internal account and loan identities and prove sign-in, session, recovery, cut-over and rollback parity.

The [domain record](../../system-model/domains/participant-access-and-loan-operations/domain.md) lists exactly what the domain owns and excludes.
