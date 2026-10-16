# Participant Access And Loan Operations

This domain is the product application around a Bitcoin-backed USDC loan: it decides who may use the product and in which role, keeps a durable record of what the application accepted and what it is waiting for, sends each participant to their own Vault for exactly one bounded action at a time, and assembles an isolated local demonstration of the whole system. It coordinates the authorities that actually move value without becoming one of them. The [architecture guide](../architecture.md) shows where it fits in the system.

## What this domain does

A loan in this system involves one borrower, one lender and two blockchains. The borrower locks Bitcoin collateral in an escrow on Bitcoin; the lender's USDC is lent and repaid through loan contracts on Base, a layer-2 network that settles on Ethereum. Other domains own the authorities that matter financially: the agreed loan terms, the participants' Bitcoin keys and pre-signed transactions, the Base contracts that move USDC, and the observers that report what each chain actually recorded. None of them is a product a person can use by itself. This domain turns them into one: sign-in, a loan screen that stays correct after a refresh, a way to ask for the next step, and a record of what happened.

The participants are the **borrower** and the **lender**, each with a product account; **workforce operators**, company staff with a separate and narrower access path; and a **developer**, who runs the local demonstration on a workstation.

A few concepts recur throughout:

- The **Vault** is a separate application on its own web origin, built and deployed apart from the normal product. Each participant's Vault holds, encrypted under a Vault password only that participant knows, their seed, their per-loan Bitcoin keys, their Base keys, and their role secret. The product never sees those in plaintext.
- The borrower's secret is called **X** and the lender's secret **Y**. Revealing X on Base is how the borrower accepts the loan and receives the principal; revealing Y is how the lender claims repayment, which in turn lets the borrower's Bitcoin recovery transaction complete.
- A **protocol account** is the public Base address (an externally owned account, or EOA) that each participant's Vault derives and that becomes the participant's caller identity in the loan's Base contracts.
- A **payment account** is a second, independent Base account inside the Vault, used only to send USDC for funding or repayment and for one narrow kind of personal transfer. It is not the protocol account.
- The **workspace** is the application's current view of one loan, as one participant's role is allowed to see it. Its **revision** is a number that changes whenever that view changes; a request names the revision it was based on.
- An **operation** is the durable receipt the application issues for each request it accepts, so the request can be found again after a lost response or a restart.
- A **handoff** is a one-time code that sends one participant from the normal product to their Vault for one bounded action. It is not a general signing token.
- A **payment intent** fixes one exact public payment request (account, recipient, amount, fees, sequence number) before the Vault signs anything.

These concepts exist to keep apart things that are easy to confuse: a request the application accepted, a transaction submitted to a chain, an event a chain recorded, an event that has become final on Base, and a Bitcoin spend that has confirmed.

## How its responsibilities work together

Three responsibilities share the work.

[Participant identity and role access](../../system-model/domains/participant-access-and-loan-operations/responsibilities/sr-010-participant-identity-and-role-access.md) decides who someone is and what they may do. It owns product accounts, the borrower or lender role on each loan, sessions, fresh reauthentication before sensitive actions, optional two-factor codes, account recovery, and the permission to retrieve the opaque, encrypted artifacts bound to a participant. It also authorizes, interaction by interaction, the Vault action that allocates a loan's keys and each participant's approval of the final terms. Signing in proves who you are to the product; it never unlocks a Vault, recovers a secret or makes a chain action valid.

[Loan workspace and application coordination](../../system-model/domains/participant-access-and-loan-operations/responsibilities/sr-011-loan-workspace-and-application-coordination.md) is the durable middle of the system. It keeps the loan workspace, accepts revision-checked requests, gives each accepted request a stable operation, records the follow-up work that must happen, runs that work through workers, and derives what participants see from sourced facts. It also holds the signed Bitcoin package archive, issues Vault handoffs, coordinates payment intents, records gas stipends, sends notifications, and carries the separate workforce operator boundary. It owns no participant private key, no lender capital and no chain fact.

[Local runtime composition and controlled demonstration](../../system-model/domains/participant-access-and-loan-operations/responsibilities/sr-012-local-runtime-composition-and-controlled-demonstration.md) assembles the independently built parts of the system into one runnable demonstration on a developer's workstation, through the same public interfaces the real system uses, and records evidence that a representative loan completed. It is deliberately isolated: nothing it creates is accepted anywhere else.

The first two cooperate on every request. The identity responsibility resolves the caller to one internal account and checks the role for that exact loan, resource and action; only then does the workspace responsibility look at the request's revision and content. The third responsibility uses both, but only through their public interfaces, the way a real participant's browser would.

What the domain receives and provides:

- From the Loan Terms And Commitments domain it receives the offer, the reservation, the final terms candidate and the committed terms, and it carries each participant's approval back. It never changes committed terms.
- From the Bitcoin Authorization And Recovery domain it receives unsigned signing material and fee and relay results, and it sends participants to their Vaults to sign. The Vault signs locally; this domain only stores and verifies what comes back.
- From the Base USDC Settlement And Funding domain and the Base Observation And Fallback Review domain it receives observed and finalized Base events, corrections, and the public status of the optional fallback secret. It displays them and schedules the fixed follow-up actions they permit.
- To all of them it provides authenticated participants with exact roles, durable requests, a sourced current view, and one place where package bytes and audit history are kept.

## Who may act: accounts, roles and sessions

### Participants

V1 uses WorkOS AuthKit, a hosted authentication service, behind narrow adapters so that no other part of the product depends on it. A participant signs in with Google or with a six-digit code sent to a verified email address; the product has no password of its own. Each sign-in resolves to **one immutable internal account**. The external identity (the WorkOS subject, the Google identity, the email address) is only a unique link to that account and can be replaced; it never becomes the participant's identity in a loan, a Vault or an audit record, and it never grants a role.

Roles live in the application's database. One account may be the borrower on one loan and the lender on another, but never both on the same loan.

Sessions last at most seven days and end after 24 hours of inactivity. Some actions are sensitive: retrieving the encrypted Vault contents, asking to display the seed, exporting the current raw Bitcoin packages, opening a Vault handoff, and replacing the Vault password. Each of these requires a fresh reauthentication no older than 15 minutes. Two-factor codes from an authenticator app (time-based one-time passwords, TOTP) are optional; once a participant enrolls, they are required for those sensitive actions too. Replacing the Vault password needs one more check: a separate single-use confirmation code sent to the verified email, bound to the same account, Vault, action, session and 15-minute window. That code carries no Vault material and cannot stand in for the current Vault password, which the participant must still enter so the Vault can re-encrypt locally. A completion notice follows, and it proves nothing either.

The normal product and the Vault are separate applications with separate sign-in configurations. A product session is rejected by the Vault and a Vault session by the product; both must independently resolve to the same internal account.

Every request is checked on its own; holding a session is not a decision for the next request. Refusals are designed not to reveal what exists:

| Situation | Participant gets | Operator gets |
| --- | --- | --- |
| Missing, invalid or expired sign-in | 401 | 401 |
| Resource absent, or outside the caller's account or loan | 404 (the same for both) | 404 for absence within the operator's permitted scope |
| Resource visible to the caller, but the role may not perform this action | 403 | 403 when the operator lacks the permission |

Account recovery restores product access and the ability to download one's own encrypted Vault contents. It does not decrypt them, reset the Vault password or recover a seed, key or secret. An older exported Vault backup remains usable for recovery only.

### Workforce operators

Staff never use participant accounts. A dedicated operator hostname and every workforce interface sit behind Cloudflare Access, which admits only allowlisted company Google identities with a mandatory six-digit authenticator code and a session of at most 15 minutes. The application then checks, on every request, that the person is an active operator with exactly the permission needed: a **viewer** may only read; an **operator** may perform a fixed list of actions such as reviewing incidents, requesting a recheck, pausing automation, choosing among already-signed fee tiers, exporting a reviewed fee-bumping request and requesting already-fixed Base operations; a **security administrator** manages operator membership and roles.

One operator may act alone; V1 has no general two-person approval and no break-glass bypass. No operator can override a fact from a chain or observer, change the contents of a fixed transaction or Base call, command the observers or Bitcoin workers directly, or sign anything. Every privileged attempt, including a refused one, is appended to an audit operators cannot edit, exported hourly in checksummed batches to a locked recovery archive and kept for seven years. Logging out ends the session; deactivating an operator rejects their later requests.

## A normal case: one loan from reservation to repayment

The figures in this example are illustrative: a lender offers 10,000 USDC against 0.25 BTC of collateral.

The lender publishes a firm one-loan offer. The borrower, signed in, browses the available offers; the list is a page of results, and an empty page simply means nothing matches. The borrower reserves the offer by naming the exact offer revision and terms they saw; the browser cannot substitute different amounts, dates or participants. The reservation runs on a 24-hour window (what happens when it lapses is described under when a reservation stalls), creates the loan's stable identity, and returns an operation, so a lost response can be retried with the same request and leads back to the same reservation instead of a second one.

Next, each participant sets up the loan in their own Vault, through two separate handoffs per role. In the first, the Vault allocates the loan's keys and returns only their public identities. In the second, the participant confirms where their funds and collateral should go, and the Vault creates or reuses the role secret and returns only a public commitment to it. In both cases the application accepts the result only after the Vault's new encrypted snapshot is acknowledged as current, and it shows the step as pending or complete so either participant can refresh or restart without repeating it. No package or signing handoff exists until both allocation results and the committed terms exist. The application side of the destination-and-commitment handoff is a current change whose delivery has not yet been executed.

When both participants' results exist, the application assembles one versioned final terms candidate with a fingerprint of every term (the terms hash). The workspace shows each participant the final terms in understandable form, both participants' public identities, the candidate version and hash, and whether each role has approved. Each approval names that exact version and hash and takes the approver's role from their signed-in session, not from anything the browser claims. Approving twice is harmless; any change to a hashed term invalidates earlier approvals; and the second matching approval commits the terms exactly once, in the same database transaction, while the reservation is still active. Approval grants no signing, custody, funding or chain authority.

> **Open: what the lender approves, and when**
> The records do not agree on whether the lender's final-terms approval described here is required. The system architecture says publishing the offer is the lender's standing acceptance and that reservation creates the canonical loan without a second lender approval; the offer and reservation interface says the reservation requires no second lender approval; the offer-reservation selection says "there is no second lender-approval step"; the multi-lender scope record lists no second lender approval; the funding-vault lifecycle lists a second lender approval as invalid; and the origination flow treats publication as standing acceptance. The offer and reservation lifecycle, the canonical terms lifecycle, the origination flow's approval step and the loan terms responsibility require explicit borrower and lender approvals of the same final candidate before the terms commit, and the offer lifecycle says the lender's final-terms approval is distinct from its earlier approval of the offer. The loan terms responsibility also narrows publication to approval of "the proposed commercial values only"; that reading would reconcile the reservation wording (no second approval to reserve, a separate approval to commit) but not the selection's statement that no second lender-approval step exists. The question is undecided and waits for the owner's answer. This guide describes the approval step as the terms and workspace records define it, without settling the question.

The borrower then sends the exact Bitcoin prefund, and the Bitcoin Authorization And Recovery domain constructs the activation and refund transactions. Signing follows a strict order. That domain supplies every public fact; the application validates and stores one immutable **unsigned signing batch** for the current loan and phase; the participant opens a fresh handoff bound to their acknowledged Vault revision; the Vault signs locally and returns the exact signed batch; the application verifies every required signature; it writes the exact bytes to locked object storage and reads them back to check them; and only then records one archive receipt. The product shows signing as available because a current unsigned batch exists, never because of a receipt, which can only exist after signing. The initial receipt is a precondition for the loan to qualify for funding.

Now the lender funds the loan on Base, either from any wallet they control or from their Vault payment account. A transfer, a balance or a submitted transaction is only provisional; funding counts once the Base contract's funding event is final under the Base Observation And Fallback Review domain's rule. The borrower then accepts by revealing X. The application prepares this action without the secret: it binds the exact deployed contract, method, caller and arguments, and only the Vault, after unlocking, inserts X and builds the transaction. If the borrower's protocol account lacks gas, the application can arrange one bounded stipend of ether to it, but the borrower still signs and submits the call. One part of the Base call contract still describes an external participant wallet signing this call, so which signer that contract means here (the Vault or an outside wallet) is undecided; the same applies to the lender's later release. Once the acceptance event is final on Base, the application records that activation is pending and asks the Bitcoin workers to complete the matching activation transaction; after it reaches six confirmations, both participants sign their later recovery transactions through fresh handoffs and the application archives them under a second receipt.

At repayment the borrower pays the debt into the loan's repayment vault by the repayment deadline, from any address including their Vault payment account; paying grants the payer no role or say over where funds go. After the repayment event is final, the lender reveals Y through their own Vault before the claim cutoff, again after a fresh reauthentication; once that release is final on Base, the application schedules the borrower's already-signed Bitcoin recovery transaction with Y inserted. The workspace shows the loan closed only after that Bitcoin spend confirms.

```figure
caption: The application advances only from sourced facts, and every key, secret and signature stays in the participant's own Vault.
step: Reserve | The borrower reserves an exact offer revision; a stable operation records it.
step: Set up in Vaults | Each role allocates keys and confirms destinations through its own handoffs.
step: Approve terms | Both roles approve one exact candidate, though whether the lender must is open; the second approval commits it once.
step: Sign and archive | The Vault signs the stored batch; the application verifies, stores, then issues a receipt.
step: Fund and accept | Funding and acceptance count only when their Base events are final.
step: Repay and release | Repayment and the lender's release count only when final on Base.
step: Close | The loan closes when the borrower's Bitcoin recovery confirms.
```

The canonical step-by-step sequences are the [origination flow](../../system-model/behavior/flows/flow-001-origination-preparation-and-qualification.md), the [activation flow](../../system-model/behavior/flows/flow-002-activation-completion-and-active-entry.md) and the [normal repayment flow](../../system-model/behavior/flows/flow-004-normal-repayment-close.md).

### What a participant sees, and what it proves

Each participant reads the loan through one bounded workspace response for their role. It carries the revision, where each fact came from and how fresh and how final it is, the current status, short summaries of the agreement, funding, repayment, packages, handoffs and observations, and only the next actions that role may take. Large or separately protected material, such as raw packages and encrypted Vault contents, stays behind narrow interfaces of its own. If the database or a required source is unavailable, the response says so; it never presents a cached view as current.

To change something, the browser sends a request naming the revision it was looking at and a scoped idempotency key, a value that identifies this one request. If the revision has moved on, nothing changes and the browser rereads the workspace first. If the request is accepted, the change, the operation and any follow-up work are committed together, and the reply carries the operation's identity. If the reply is lost, sending the same key with the same content returns the same operation; reusing the key with different content is refused. The operation then moves through clearly separated states: accepted, submitted, reconciling, corrected or obsolete, completed locally, permanently failed, or blocked by an external fact. A locally completed operation links to the workspace revision it produced.

> **A receipt is not a result on a chain**
> An accepted request, a running worker, a submitted transaction, an email, or a locally completed operation does not mean that a Base event is final or a Bitcoin transaction has confirmed. Base facts stay submitted or observed until they are final on Base; Bitcoin facts stay broadcast or observed until the required confirmations. The workspace changes from those external facts only.

For the optional fallback secret, the workspace also shows a public status, one of six values, which also covers loans that cannot use it: the capability is unavailable for production, this loan has no fallback commitment, the commitment exists and the trigger has not happened, the exact refund event has been verified and publication is pending, publication failed or was withheld, or the secret was published. The application derives these only from the production gate, the loan's own terms and the fallback service's public record. It never infers them from a missing Y, elapsed time, balances or its own watchers. Publication of the secret is separate from the Bitcoin recovery transaction, which has its own status.

## Exceptions and recovery

### Lost responses, crashes and retries

Every change that needs follow-up work is committed together with a durable job record in the application's database (Cloudflare D1). Right after the commit, the application nudges the Bitcoin workers so they start immediately, but that nudge is only a speed-up: a scan every minute finds any job a lost nudge or a crashed worker left behind. A worker claims one job under a two-minute lease it may renew; when a lease expires, another worker can take over only after reloading the job and the external facts.

Retryable failures become due again after 1, 2, 5 and 15 minutes, then hourly, and each retry happens only after the worker proves, from the database and the relevant chain or provider, that the identical action is still required. A timeout or an ambiguous answer is different: the job records every request, provider and transaction identity it knows and enters reconciliation, with no immediate resubmission. A retry can never change the recipient, amount, route, package, sequence number or signed bytes. If neither success nor failure can be proved, the job stays blocked and alerts an operator, who has no power to declare the outcome. Ambiguous financial results, provider conflicts and broken invariants alert immediately; an ordinary unresolved retry warns at 15 minutes and becomes critical at one hour; safety-critical reconciliation continues until it completes, is shown to be obsolete or is permanently rejected, and demands an operator's attention after 15 minutes.

A handoff code expires, is used once and is bound to one participant, role, loan, workspace revision, action and set of package references. A fresh code is issued only for an action that is still current and unchanged.

### When a reservation stalls

A reservation that is never used, with no terms committed and no prefund attempt, simply expires at the end of its 24-hour window; no loan exists and no lender approval is inferred. Until the terms are committed, either participant may also cancel, which ends that terms version and blocks any further setup. Once the terms are committed and no valid Bitcoin prefund arrives within the 24-hour rule, the offer lifecycle cancels the reservation and reopens the offer under the product's infraction and notification rules; a valid prefund that stays stuck reaches manual review after 72 hours.

Whether a loan can be cancelled after its terms are committed is undecided. The offer lifecycle cancels the reservation and reopens the offer after commitment when no prefund arrives. The canonical terms lifecycle allows cancellation only when a participant cancels or the reservation expires before commitment, and has no transition from committed terms to cancelled. The approved decision behind that lifecycle says either role can cancel before any Bitcoin or USDC action, which could also reach committed terms. Reservation timers, borrower blocks and these escalations are product records only: they change nothing on either chain.

### When the outcome of a payment is unknown

Payments get the strictest treatment, described in the next section: an unknown outcome is reconciled against the exact transaction, and if it cannot be resolved, the payment account is visibly blocked rather than left reconciling forever.

### When backups fall behind

Signed packages and encrypted Vault contents live in separate private, locked buckets in Cloudflare R2 object storage, with separate credentials, interfaces, retention and audit; the database keeps only their indexes, checksums, receipts and pointers. Every hour a scheduled job copies new package and Vault versions and their receipt records to separately protected recovery buckets in Amazon S3, outside Cloudflare, and once a day a complete database export goes to a third bucket. If no verified backup has completed for two hours, the application warns; at six hours it raises a critical alert; after 24 hours it stops qualifying new loans until backups recover. Existing loans stay valid throughout. Packages, receipts and audit records are kept for seven years; Vault ciphertext is kept while its account or any loan is active and leaves the recovery archive within 90 days after deletion with no active loan; daily database exports are kept for 90 days. Daily checks, monthly sample restorations and quarterly full reconstructions test the archive.

### When Cloudflare is down

All V1 application parts run on Cloudflare: the product, the Vault, the application service and its database, the Base observer, the Bitcoin workers and the operator interface. They have separate origins, projects, credentials and releases, but one Cloudflare-wide outage can stop them all together. The chains keep running; the application accepts no new consequential request and claims no chain result. An external monitor outside Cloudflare (Better Stack) watches a generic health route, checked every three minutes with an email alert after two consecutive failures (about six minutes), and a heartbeat sent after each successful one-minute scan. It can report the outage but cannot continue any product work. When Cloudflare returns, the application reconciles Base and Bitcoin before resuming its jobs. V1 has no live fallback provider and promises no recovery time or recovery point; the off-Cloudflare backups protect data, not service continuity.

### Recovering access versus recovering a Vault

A participant who loses their product sign-in can recover the account and download their encrypted Vault contents again. A participant who forgets their Vault password cannot be helped: no server, operator, product account, recovery code, passkey, delegated or escrowed mechanism can reconstruct the password, seed, keys or secrets. An older backup made before the payment account existed cannot recover that account. Prepared Bitcoin packages and public-condition paths remain usable where they were designed to be.

## Paying from a Vault payment account

Funding and repayment contracts accept USDC from any payer. V1 adds an option for participants to pay from a payment account inside their own Vault, so they do not need a separate browser wallet. This is a bounded payment capability, not a general wallet.

The payment account is generated independently of the protocol account and of every Bitcoin key. Its address is registered and shown as a deposit address only after the Vault's current encrypted snapshot and the participant's backup acknowledgement prove that the same account can be restored. The application then knows only the public address and observed balances; it never receives the key, the password or signed transaction bytes.

Every payment starts as a durable **payment intent** that fixes its purpose (funding, repayment, or a personal transfer), the account, network, token contract, recipient, amount, a reserved sequence number (nonce), gas and fee limits, and the fee policy. The participant reviews and approves exactly that; any edit invalidates the approval and needs a new intent. The application owns the account's sequence numbers and a lease on each intent, and every phase change is a guarded compare-and-set that a stale browser tab, device or restored backup cannot win. The order is fixed:

```figure
caption: Each phase is written before the next begins, so a crash or a lost reply can always be traced to one exact transaction.
step: Record | The application stores the exact intent before any signing.
step: Approve | The participant approves the exact transfer and fee limits in the Vault.
step: Signing | The application records that signing has started, then invokes the Vault signer.
step: Hash stored | The Vault keeps the signed bytes encrypted locally; the public transaction hash is recorded.
step: Broadcast | The application records the attempt, then the transaction is sent.
step: Outcome | The exact transfer is observed to succeed or revert, separately from loan finality.
```

Because the signing phase is recorded before the Vault signs, a timeout after that point is never taken as proof that nothing was sent. Cancelling is possible only before signing starts. A retry may resend only the identical signed bytes at the same sequence number and fees; anything different needs a fresh review and a new intent. A new device can take over only by restoring or verifiably reproducing the exact pending transaction.

When an outcome is unknown, the application checks at 0, 15 and 60 seconds and escalates at 180 seconds. "Accepted, pending" is a normal state when the transaction is known but not yet included. After the escalation, the participant or an authorized operator may explicitly recheck or resend the identical bytes; this does not create a new signing attempt. The intent ends as unresolvable only when the bounded evidence is exhausted, its generation is stale, or the pending Vault record or an exact reproduction of the transaction is unavailable; then the account is visibly **blocked** for new payments until an explicit recovery or decision. A payment account is never silently replaced. In the public configuration the checks require two independently operated Base providers plus the independent observer; that requirement is deferred, and the local demonstration uses one local chain endpoint plus the observer without claiming a quorum.

A successful transfer is only that. Funding and repayment advance only from the Base contracts' own events once they are final. The personal transfer purpose, which the participant can use for USDC received at the payment address, is narrower still: only the configured USDC token, to a validated recipient the participant chooses, for a positive amount, with zero native value, sufficient USDC and gas, and fresh approval. It is tied to no loan and changes no loan when it confirms. Arbitrary contract calls, token approvals, swaps, other assets, sending ether and generic signing are excluded. A participant may choose their payment address as a recipient in a new loan's terms only through the normal terms fields, with role authorization, fresh approvals and a disclosure of this transfer capability; existing loans never change.

> **The payment account is selected, not yet delivered**
> The payment account design is approved, but its delivery status is partial: implementation and execution evidence remain gated to a later delivery stage. The Vault's payment signing adapter and its exact-byte test fixtures do not exist yet, so the signing profile is not verified. A correction to the application's and product's transfer review passes focused checks, but its delivery receipts are not final, and the local acceptance run that would demonstrate the journey is planned and unverified. Earlier evidence from an injected browser wallet remains historical regression evidence only.

## The local demonstration

The required outcome for this version of the system is a developer-run local demonstration in which two isolated participants use the real product, Vault, application service, Base contracts, observer and Bitcoin operations to complete one representative loan through normal repayment and confirmed Bitcoin recovery. The local runtime composition responsibility owns that demonstration.

One documented command checks the environment, starts or resumes everything in dependency order, waits until every component is healthy and reports how to reach each participant's product and Vault. Paired commands report status and logs, shut down, and reset. The local profile uses a local Base chain with chain identifier 31337 and a fake USDC token, two connected persistent Bitcoin nodes on a private regression-test network (regtest) with named wallets, and two demo participants with separate browser sessions and separate Vaults. Everything binds to the local machine only, on fixed local ports (4173 for the product, 4175 for the Vault, 4176 for the application service, 44105 for the local chain), and every public configuration rejects these allowances.

The order matters. Each participant's Vault is created and its protocol account registered before any demo offer or loan is bound to it, and gas is sent to its public protocol account without the composition ever holding its key. The local chain's built-in test accounts act only as outside funders, payers and recipients and never as a participant's protocol account. The composition will also provision disposable local ether and fake USDC to the participants' payment addresses, which is setup, not evidence that a participant paid.

Ordinary shutdown stops only the processes it started, in reverse order, and keeps all state, so the next start resumes the same chains, wallets, participants and loans. Only the separate reset command recreates state, and only by asking each component to reset its own data; the composition never deletes another repository's directories. A failure names the component and the last successful stage, keeps the diagnostic state and never resets silently.

A ready demonstration proves only that the local composition's health checks pass. A passing run proves only runnable local use: it is not testnet or mainnet deployment, real-provider compatibility, monitoring, an audit, production funding or activated operation. Demo identities, tokens, wallets, funds, contracts and fixtures must be unreachable or rejected in every other configuration.

> **The local demonstration is not yet runnable**
> The delivery records show the local demonstration's delivery as blocked: its supervisor still stops with an explicit not-implemented marker, its acceptance checks have not passed, and it waits on the application, Vault and product outputs for the new role-preparation step and on renewed cross-domain verification. The earlier local development harness is a disposable verification setup and cannot satisfy this outcome.

## Authority boundaries

This domain decides:

- who a participant is inside the product, which role they hold on which loan, and whether a session is fresh enough for a sensitive action;
- whether a request is authorized, current and new, and which durable operation and follow-up work it creates;
- what each participant's workspace shows, derived from sourced facts and labeled with their source and finality;
- when to issue a Vault handoff and whether a returned public result matches what was asked;
- when to run fixed actions that other domains have already authorized, such as finalizing funding or repayment, scheduling the unclaimed-repayment refund at its cutoff, recording that activation is pending after X is final, starting the borrower's recovery after Y is final or after a valid fallback secret is published, and, only under the exact observation and Base conditions, unwinding before activation; anyone may call the permissionless Base actions first;
- how packages, Vault ciphertext, notifications, backups and audit records are stored and retained;
- the local demonstration's lifecycle, inside its isolated profile only.

It must not decide or imply:

- anything a participant's Vault controls: passwords, seeds, keys, X or Y, signatures, or the choice of Bitcoin destination;
- the meaning of the loan terms, which the Loan Terms And Commitments domain owns; the application keeps copies and approvals but cannot redefine committed terms;
- the lender's capital decisions, or any chain fact: whether Base funding, acceptance, repayment, claim or refund happened and is final, or whether a Bitcoin transaction confirmed;
- the fallback service's verdict, or any automatic broadcast of a lender-default transaction;
- that sign-in, a reservation, an allocation, an approval, an email, a balance, a submitted transaction, a worker result or a silent observer means funding, repayment, default, a chosen beneficiary or a recovered secret.

The gas stipend illustrates the boundary. For an eligible acceptance, release or refund-recipient switch, the application may send one bounded stipend of ether to the participant's protocol account, sized at 1.5 times the current fee estimate, at most once per loan, action and account, with no refill. Above 0.00025 ether it also warns operations; above 0.001 ether it sends nothing and shows a review message. The participant can always pay their own gas and submit directly. The stipend never carries, signs or submits the participant's call. Similarly, for the organization's fee-bumping of stuck Bitcoin transactions, the application raises alerts and exports a reviewed request, but it has no helper, wallet, signing, finalization or broadcast control.

Within the local demonstration, the composition starts processes and provisions local resources, but it cannot redefine the protocol, act as a participant outside its isolated profile, become a source of chain truth or activate any public configuration.

## Choices and their reasons

- **One workspace response per loan, plus a receipt for every request.** A producer-local request handler and a passing test harness did not ensure that a real browser could load the current state or recover a request it had already made. The user chose one bounded, role-scoped workspace response as the consistent current view of a loan, with raw and separately authorized material behind narrow interfaces, and a stable operation for every accepted request that the browser can retrieve after a timeout, refresh, retry or restart; some details of the states and the commit were added by the agent while encoding those answers.
- **Relational records with an outbox in one database, no separate queue.** Full event sourcing would have added complexity when Base and Bitcoin already keep their own event histories, and a plain current-state model without immutable source and audit records would make corrections and investigations unsafe. A separate queue would add a second delivery and storage model even though each change must already commit with its work item. Emails may therefore be delayed or rarely duplicated, which is safe because they never change a loan; financial and chain actions are never allowed that ambiguity.
- **WorkOS behind adapters, with internal identities.** Using the WorkOS identifier as the account would embed a vendor value into immutable loans, Vault encryption bindings, roles and audit; building an application-owned sign-in service in V1 would add security and operations work before the product needs it. Keeping the provider behind adapters was the user's requirement so it can be replaced later.
- **Cloudflare Access for staff.** A second application-owned staff identity service would duplicate sign-in, two-factor, session and audit work, and reusing participant accounts would merge customer and staff authority. Cloudflare Access blocks unauthenticated requests before they reach the application, and the database permission check keeps an Access session from being application permission by itself. Authenticator codes are the V1 second factor; passkeys or hardware keys may come in a later reviewed change.
- **One provider, accepted as one failure domain.** Spreading the system across providers or self-hosting would multiply identity, replication, deployment, monitoring and incident paths before the team has proven them. The user chose Cloudflare for V1; the design keeps separate accounts, projects, credentials and releases where they limit the damage of a compromise or bad release, and explicitly accepts that a Cloudflare-wide outage stops the application and Bitcoin automation together.
- **Package bytes stored directly, not encrypted by the application.** Keeping package bytes in the database would not make the database and object storage one atomic system and would weaken retention controls. Encrypting packages in the application would require a decryption key in the automated services, and losing it would make every retained exit package unusable. Provider-managed encryption is used, and the Vault's client-side encryption remains the stronger secret boundary.
- **A separately owned local demonstration.** Independently implemented units did not by themselves supply a persistent runnable demonstration or safe profile separation. An unowned root script would leave process identity, persistence, reset safety and evidence without an owner, and extending the verification harness would blur disposable verification with preserved interactive use. Separating local verification from runnable local use was approved by the user on the agent's recommendation.
- **A Vault-owned payment account.** Keeping an injected browser wallet would leave payment authority outside the product's custody and require an extension; deriving payments from the protocol account would collapse the caller, gas and payment boundaries. An independent Vault payment account, recoverable before its address is exposed and paying only through durable exact intents, avoids exposing unrecoverable addresses, paying twice after lost responses, and mixing protocol keys with payer identities. The records do not show who chose this design.

## Open, excluded and deferred

**Open questions.** Whether the lender gives a separate final-terms approval, or whether reservation alone creates the loan, is undecided, as the callout in the normal case explains. A second, smaller point also remains open: the constraint for the runnable demonstration still asks the human acceptance run to prove wallet setup with an installed browser-wallet extension and a disposable test account, while the newer payment design and its acceptance record treat that injected-wallet path as historical. Whether the extension step remains required in the demonstration or is a stale requirement has not been decided; the domain record records it as an unresolved source conflict. Related to it, one part of the Base call contract still describes an external participant wallet signing the acceptance and release calls, while the rest of that contract and the activation flow have the Vault sign them; which signer the contract means is undecided. Whether a loan can be cancelled after its terms are committed is also undecided, as described under when a reservation stalls.

**Excluded from V1.** Automatic lender-default broadcast, collateral liquidation and handling of default proceeds, the application holding any participant key or lender capital, and any manual override of a chain fact are outside this domain's authority.

**Deferred, with what it means now:**

- Forgotten Vault-password recovery is [deferred](../../system-model/contracts/scope/scope-006-stronger-participant-vault-recovery.md); a participant who forgets the password cannot recover the seed or their role secret.
- Participant-operated cooperative settlement, with its signing session and Base accounting, is [deferred](../../system-model/contracts/scope/scope-005-cooperative-settlement-operations.md); the product cannot claim that cooperative settlement is operational or closes the Base ledger.
- Replacing WorkOS with an application-owned sign-in service is [deferred](../../system-model/contracts/scope/scope-015-application-owned-authentication-replacement.md); any replacement must keep every internal account, loan and Vault identity and prove linking, session, two-factor and recovery parity, cutover and rollback first.
- Platform-paid relaying or sponsored execution of the borrower's and lender's secret-revealing Base calls is [deferred](../../system-model/contracts/scope/scope-014-platform-paid-base-reveal-execution.md); today the participant signs and submits, helped only by the bounded gas stipend.
- Production gas funding for Vault payment accounts is [deferred](../../system-model/contracts/interfaces/iface-015-participant-gas-sponsorship.md); the stipend funds only the protocol account, and the local demonstration's disposable funds are setup only.
- Testnet deployment, mainnet deployment and activated production operation are [not claimed](../../system-model/contracts/scope/scope-013-runtime-profile-claims-and-activation-gates.md) by this version; each needs its own credentials, funding, deployment and, for production, monitoring, incident response, paid services, legal and fallback gates and live evidence. Separately, the deliverability of Cloudflare Email Sending, still in beta, is a release gate for product notifications.

**Delivery status now.** The application's earlier deliveries for identity, the workspace, the Vault and the product are recorded as implemented. The current changes, including the new role-preparation step, the Vault payment account and the runnable local demonstration, are planned or in progress and not yet accepted.

The [domain record](../../system-model/domains/participant-access-and-loan-operations/domain.md) lists exactly what the domain owns and excludes.
