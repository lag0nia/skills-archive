I read the whole PDF and used no other source. It is 6 pages long. Reading it with the `pages` parameter failed because pdftoppm isn't installed. Reading it without that parameter returned all 6 pages, with the text and an image of each page.

## Answers

**1. What does signing in give a participant?**
- **What signing in involves:** participants sign in through "the selected identity provider", using Google or a six-digit email code. The account and every loan role belong to the application, not to the provider. Sessions last at most 7 days and end after 24 hours of inactivity.
- **What it allows:** signing in "can authorize retrieving encrypted data". It cannot decrypt a Vault, recover a seed or secret, or make a chain action valid. A sign-in is never evidence that a chain outcome happened.
- **Implied, not stated:** a signed-in browser can load and refresh its authorized workspace and submit commands.
- **Gaps:** the document never lists everything a session unlocks, and it never names the identity provider.
- Pages 2 and 5 (plus page 4 on account recovery). Confidence: high on the limits, medium on the full list of what it unlocks.

**2. What extra checks apply before especially sensitive actions?**
- The examples given are fetching encrypted Vault data, viewing a current package, opening a Vault handoff and replacing a Vault password.
- These need a sign-in no older than 15 minutes, plus a one-time code if the participant has enrolled one.
- Replacing a Vault password also needs a separate single-use confirmation through the participant's verified email.
- **Gaps:** the list says "such as", so it may not be complete. The document doesn't say whether enrolling a one-time code is mandatory, so without one the extra factor may not apply.
- Page 2. Confidence: high.

**3. May the same person be borrower and lender?**
- One account may be the borrower on one loan and the lender on another, but never both on the same loan.
- **Gap:** the rule is stated per account, not per person. Nothing says how one person holding two accounts would be prevented.
- Page 2. Confidence: high for the account rule, low for "person".

**4. How does the product hand a signing task to the Vault, and what does the Vault do before signing?**
- **The handoff:** a handoff gives one participant access to one bounded action in their Vault, such as allocating a loan key or signing one exact batch. It is "not a general signing token" (p.1). Opening one needs the fresh sign-in and code from Q2 (p.2).
- **Bitcoin signing sequence (p.3, step 4):**
  1. The Bitcoin automation produces complete unsigned packages with their review context.
  2. The application stores one immutable signing batch.
  3. The product launches the bounded Vault handoff.
  4. The Vault signs locally.
  5. The application revalidates the result, writes the full package archive, and only then issues a receipt.
- **Payments (p.1, p.4):** a payment intent fixes one exact public payment request before the Vault signs. The application records that signing has started before the Vault signs. A repeat broadcast reuses the identical bytes, and any change needs a fresh review.
- **Gaps:** the document does not say what the Vault itself checks or does before signing. It doesn't cover unlocking with the Vault password, showing the review context to the user, or validating the batch. It also doesn't describe how the handoff is delivered technically.
- Confidence: high on the sequence, low on the Vault's own steps.

**5. Browser loses connection right after submitting — how is the action not done twice?**
- A retried command with the same identity returns the same result (p.4).
- The browser can get an acknowledgement for an accepted command and recover the same result after a refresh or restart (p.2).
- A command based on a stale revision is rejected, and the participant reloads (p.1, p.4).
- The state change and its background job commit in one database transaction (the outbox). A scan every minute finds missed or crashed work (p.1, p.3).
- The exact request, route, participant, amount, nonce, fees, bytes, provider and transaction identities survive an unclear outcome, "so a lost response never turns into a new payment or a changed action" (p.3).
- For payments, a recheck or resend uses the identical signed bytes and never creates a new signing attempt (p.4). The reasons section says the payment intent prevents "paying twice after a lost response" (p.5).
- **Gap:** "command identity" is never defined. The document doesn't say who creates it or whether the browser keeps it through a lost connection.
- Confidence: high on the principle, medium on the mechanics.

**6. What does a "completed" operation in the workspace say about the blockchain?**
- The document never uses "completed" as a status, so this is only partly answered.
- It says a workspace label is "never evidence that a chain outcome happened" (p.5). The domain may not create a chain fact (p.5).
- It keeps five things distinct: an accepted request, a submitted transaction, an observed event, a finalized contract event and a confirmed Bitcoin spend (pp.1–2).
- An acknowledgement only means the application accepted the command (p.2).
- Status is driven by finalized Base events and independent Bitcoin evidence. A loan is shown as closed only after finalized contract outcomes and a confirmed Bitcoin recovery (p.3, steps 5–6).
- **Gap:** there is no list of status names and no definition of "finalized" or "confirmed".
- Confidence: medium.

**7. What is the local demonstration, and what does a successful run not prove?**
- **What it is:** a developer-run assembly of the independently built parts through their public interfaces.
  - One entrypoint checks prerequisites, starts or resumes the system, waits for health and reports status. There are matching status, shutdown and explicit reset commands.
  - It uses a local Base test chain with test USDC, two connected local Bitcoin regtest nodes, and two isolated participant sessions and Vaults. It runs the real product, Vault, application service, observer and Bitcoin operations paths.
  - Shutdown keeps state; only an explicit, bounded reset clears it (p.2).
  - It stops before setting anything up on any missing or conflicting setting, non-loopback address, non-local chain, public credentials or public deployment description (p.4).
- **Current status:** it is the design's target outcome but is "in progress and not yet runnable". It is blocked until the Vault preparation change and its producers and acceptance evidence exist (p.2, p.5). So a successful run cannot happen today.
- **What a run does not prove:**
  - A healthy local process is never evidence of a chain outcome (p.5).
  - Local disposable funds are neither evidence of a participant payment nor production fee sponsorship (p.5).
  - Local verification, runnable local use, testnet deployment, mainnet deployment and activated production operation are separate claims. "Nothing beyond it is claimed", and a healthy process or local design check satisfies none of these gates (p.5).
  - A mock or health check does not prove the real consumer path works (p.2).
- Confidence: high on the description. Medium on "does not prove", because the document says this in scattered statements rather than about a demo run directly.

**8. What can a company staff operator do and not do?**
- **Setup:** staff use a separate operator surface behind a separate access service, with three roles (p.2).
  - **Viewers** read status, incidents and audit.
  - **Operators** may acknowledge incidents, pause automation, request rechecks, choose an already signed fee variant, export one exact fee-bump request, and request Base calls whose effect is already fixed.
  - **Security administrators** manage operator access.
- An authorized operator may also recheck or resend identical signed bytes for an unclear payment (p.4).
- **Limits:** staff identity alone grants nothing (p.2). An operator action is never evidence of a chain outcome (p.5).
- **Inferred limits:** the domain must not hold Vault secrets, sign for a participant, change terms, touch lender capital, create chain facts, judge fallback evidence, choose a destination, or broadcast a lender recovery on its own (p.5). I'm inferring these bind operators; they are stated for the domain, not for staff.
- **Gaps:** nothing says whether staff need fresh sign-in or multi-factor checks, or what staff may see of participant data.
- Confidence: high on the listed powers, medium on the limits.

## Confusing points, terms used before they were explained, and missing content

**Terms never defined or used before they were explained:**
- "Vault" is used from the first sentence and never defined: what it is, where it runs, and how a Vault password relates to it.
- "Base" is never identified.
- "Agreement authority" (p.1) is never explained.
- "Package" appears on p.2 ("viewing a current package") before step 4 partly explains it. Later "The package has not decided" (p.3) seems to mean the design package, which collides with the signed Bitcoin package meaning.
- Also undefined: terms candidate, reserved loan, qualified funding, loan qualification, deliberate acceptance, route, fee stipend, fee variant, fee-bump, secret-revealing Base calls, protocol address, nonce lease and fencing, provider check, payer-neutral settlement, cooperative settlement, lender recovery transaction, observer, fallback evidence, producer-only versus consumer path.
- "Vault preparation change" (p.2) appears before step 2 explains it.

**Contradictions or unclear passages:**
- Step 3 says both participants approve the final terms, but the "Open at step 3" box says whether the lender approves again is undecided.
- "Vault-owned payment intent" (p.5) contradicts p.4, which says the application owns the public payment intent and the Vault owns the bytes and signing.
- Payment from the Vault payment account is described as "planned rather than working behavior", so it is unclear how much of the payment text describes reality.
- The "Open, excluded and deferred" section has no item labelled "Excluded".
- "Pause automation" and "Base calls whose effect is already fixed" are unclear.

**Expected but not found:**
- How a loan is created or matched (offers, requests).
- The workspace status vocabulary and what the screens show.
- Default and liquidation handling.
- Notification channels.
- What the Vault checks before signing.
- How the handoff is delivered.
- How a command identity is generated.
- Whether multi-factor enrollment is mandatory.
- Which identity provider is used.
- How to actually run the demo.
- What "finalized" or "confirmed" means in numbers.
