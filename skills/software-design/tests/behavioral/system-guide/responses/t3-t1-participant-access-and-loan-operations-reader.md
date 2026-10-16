I read the whole PDF, all 7 pages. Reading with the `pages` parameter failed because pdftoppm is not installed, so I used one Read call without `pages`. That returned every page. I opened no other files, ran no commands and did not search the web.

## Answers

**1. What does signing in give a participant?**
- Sign-in uses Google or a six-digit email code through WorkOS. The sign-in identity is only linked to the participant's account, which is the product's own internal identity (p.1–2).
- It gives access to the participant's own encrypted Vault data and packages (p.2, "Signing in is not unlocking").
- It cannot decrypt the Vault, recover a seed or a secret, or make a chain action valid (p.2).
- Sessions last at most seven days and end after 24 hours of inactivity (p.3).
- Account recovery restores sign-in and access to encrypted data, but never the Vault password (p.5). A sign-in must never be treated as chain finality (p.6).
- **Partly answered.** The guide never lists everything a signed-in participant can do. Using the workspace and sending commands is implied but not stated as something sign-in grants. There is also a tension: sign-in "authorizes access" to Vault data and packages (p.2), yet retrieving that data or obtaining a current package needs fresh reauthentication.
- Pages 1, 2, 3, 5, 6. Confidence: high on what is stated, medium on the full scope.

**2. What extra checks apply before especially sensitive actions?**
- Five actions count as sensitive: retrieving encrypted Vault data, requesting the seed display, obtaining a current package, opening a Vault handoff, and replacing the Vault password.
- Each needs a reauthentication no older than 15 minutes, plus a TOTP code if the participant has enrolled one (p.2–3).
- Replacing the Vault password also needs the current password and a separate single-use email confirmation, tied to that session and action (p.3).
- Operators have their own stricter regime: a mandatory authenticator-app code and a 15-minute session (p.3).
- Pages 2–3. Confidence: high.

**3. May the same person act as borrower and lender?**
- Yes, but only on different loans. One account may be borrower on one loan and lender on another, never both on the same loan (p.2).
- The guide does not say how this is enforced.
- Page 2. Confidence: high.

**4. How does the product hand a signing task to the Vault, and what does the Vault do before signing?**
- A handoff is a short-lived, single-use pointer. It directs the participant's separately signed-in Vault to one bounded action. It is not authentication, consent or a signing token (p.2).
- The flow (p.3 and Figure 1):
  1. The Bitcoin operations produce the complete unsigned request.
  2. The application stores it as one immutable batch.
  3. The product launches a handoff. The handoff code travels only in the address fragment.
  4. The Vault redeems the code once, under its own fresh session. The code is bound to one participant, role, loan, workspace revision and exact action.
  5. The Vault reloads the exact request, checks it itself, and signs locally.
  6. The application verifies every signature, writes the complete set to locked object storage, and only then issues its receipt.
- Opening a handoff needs the 15-minute reauthentication (p.2).
- For payments, a payment intent first fixes the account, nonce, amount, recipient and fee. The application enters a durable signing phase before the Vault signs. Any edit before signing needs a new intent (p.4).
- **Partly answered.** The guide never says what the Vault checks or what it checks against, how short "short-lived" is, or what happens if a handoff is never redeemed.
- Pages 2, 3, 4. Confidence: high on the flow, low on the content of the Vault's checks.

**5. If the browser loses its connection right after submitting, how is the action not done twice?**
- The guide never walks through this exact scenario. The answer below combines several separate statements, so it is partly my inference.
- An identical retry returns the original result. A reused idempotency key with a different body is rejected (p.5).
- A browser can get an acknowledgement for an accepted command and recover its result after a refresh or restart (p.2).
- Commands carry a revision, so a command built on stale state is rejected (p.2, p.5).
- The state change and its job commit together in one database transaction (the outbox). A one-minute scan picks up missed work (p.2, p.4).
- Each retry reloads the database and the canonical sources to prove the identical action is still needed. The exact request, amount, nonce, fee, bytes and transaction identities survive an ambiguous outcome, "so a lost response never turns into a second payment or a different action" (p.4).
- After a payment is signed, only the identical bytes may be rebroadcast (p.4).
- Not stated: where the idempotency key comes from, or how the browser keeps it across the disconnect.
- Pages 2, 4, 5. Confidence: medium.

**6. What does a "completed" operation tell a participant about the blockchain?**
- Essentially nothing. The workspace keeps accepted, completed by a worker, submitted, observed, finalized, broadcast and confirmed as separate states. Each carries the source and freshness of the fact behind it (p.6, "Accepted is not done").
- The domain must not treat a worker completion, or a submitted transaction, as chain finality, Bitcoin confirmation, default or recovery (p.6).
- Only the finalized contract event establishes funding or repayment (p.4).
- A loan is shown as closed only after finalized contract outcomes and a confirmed Bitcoin recovery (p.3–4).
- **Caveat:** the guide uses "completed by a worker," not a bare "completed" label. It does not describe what participants actually see on screen.
- Pages 2, 3–4, 6. Confidence: medium-high.

**7. What is the local demonstration, and what does a successful run not prove?**
- It is the design's "target outcome": a developer-run local system in which two isolated participants complete one loan through normal repayment and confirmed return of the borrower's collateral (p.4).
- It uses the real product, Vault, API, observer and Bitcoin operations. Around them are a local Base chain with test USDC, two connected persistent Bitcoin regtest nodes, and two separate browser sessions and Vaults (p.4).
- One entrypoint checks preconditions, starts or resumes the system, waits for health and reports. Shutdown keeps state; only an explicit, bounded reset clears it (p.2, p.5).
- It fails closed if a local setting is missing or conflicting, or points at anything public (p.5).
- What it does not prove:
  - Local test funds are setup, not evidence of a participant payment.
  - A successful run proves nothing about testnet, mainnet or production (p.5).
  - The design claims only verification and runnable local use. A fixture, healthy process or local check cannot satisfy a later profile's gate (p.6).
- The guide does not say whether the demo exists yet or give the command name.
- Pages 2, 4, 5, 6. Confidence: high.

**8. What can a company staff operator do and not do?**
- The guide calls them "workforce operators." I am inferring they are company staff from "company Google accounts."
- How they sign in (p.3):
  - Cloudflare Access with a company Google account.
  - A mandatory authenticator-app code; email codes do not count.
  - A 15-minute session.
  - An active operator record with the exact permission for each request: viewer, operator or security administrator.
- What they can do (p.3):
  - Acknowledge incidents.
  - Pause automation.
  - Request rechecks.
  - Choose an already-signed fee level.
  - Export a reviewed fee-bump request.
  - Request Base calls whose effect is already fixed.
- After a payment's unclear outcome is escalated, an operator, like a participant, may only probe again or rebroadcast the identical bytes (p.4).
- Stated limits (p.3):
  - A participant account grants no operator authority.
  - Every privileged attempt is recorded in an audit log that operators cannot edit.
- **Partly answered.** There is no explicit list of what operators cannot do. The domain-wide limits on p.5 imply some: no seeing passwords, seeds or keys, no signing participant transactions, no defining terms, no holding capital, no choosing destinations, no judging fallback evidence, no automatic default broadcast. The guide also does not say what each of the three permission levels allows.
- Pages 3, 4, 5. Confidence: high on what they can do, medium on what they cannot.

## Confusing points, unexplained terms and gaps

**Terms used before they are explained, or never explained:**
- **Vault:** never defined; only gradually implied to be a separate key-holding app.
- **Base, the Base contracts and the "Base protocol account":** never explained.
- **Package / package set / unsigned packages:** what a package is never stated.
- **Idempotency key:** first appears on p.5; p.2 only says "idempotent commands."
- **Also undefined:** prefund, qualification ("pauses new qualification"), infraction, terms commitment, secret-revealing Base calls, unrevealed secrets, fee stipend, permissionless Base call, fallback service, cooperative settlement, payer-neutral, observer, canonical sources, D1 database, regtest, nonce, fee bump, address fragment, fixed-effect automation, relay response, and "version 1."
- **"Workforce operators":** never explicitly tied to company staff.

**Confusing points:**
- The guide says there are "five domains" but names only four (this one, Loan Terms And Commitments, Base Observation And Fallback Review, Bitcoin Authorization And Recovery). The fifth is never named.
- Figure 1 says the handoff code is bound to "participant, loan and action." The text (p.3) adds role and workspace revision.
- "Forgotten-password recovery" is listed as deferred (p.6), while p.5 says account recovery cannot recover the Vault password. It is unclear which password p.6 means.
- "Requesting the seed display" is a product action, but the product must never see seeds. It is unclear who displays the seed and where.
- Two open conflicts are flagged and deferred to the Loan Terms guide: whether reservation needs a second lender approval (p.3), and expiry versus cancellation with an infraction (p.5).
- "Submitted" versus "broadcast" in the state list is not explained.

**Expected but not found:**
- A glossary.
- What the workspace actually displays to participants.
- What the Vault checks before signing.
- How long a handoff lasts, and what happens if it is never used.
- How the browser keeps its idempotency key across a disconnect.
- What each operator permission level allows, and an explicit list of operator prohibitions.
- Whether the retry schedule ever gives up.
- Who performs the 72-hour manual review.
- How to actually run the demo.
- Default and liquidation flows, which are only hinted at.
