I read the whole PDF, all 7 pages. One note on method: reading it 20 pages at a time failed with "pdftoppm is not installed". I read the file again without the pages parameter, which returned all 7 pages. I opened nothing else and ran no commands.

## Answers

**1. What does signing in give a participant?**
- Signing in lets a participant use the web product. They can browse offers, approve terms, follow their loan and start actions (p.1).
- Every interaction checks identity and role (p.4). Sign-in gives permission to retrieve the encrypted artifacts that the participant's role on a loan may have (p.2).
- Sign-in never decrypts a Vault, recovers a seed or secret, or makes a chain action valid (p.2). It gives no workforce or operator authority (p.5). A sign-in never shows finality or anything else about the chain (p.5).
- Sign-in is through WorkOS, with Google or a six-digit code sent to a verified email. Each account has one permanent internal identity (p.2).
- Sessions last at most 7 days and end after 24 hours of inactivity (p.4).
- Partial answer: the document says what sign-in does not give more clearly than it lists what it does give.
- Pages 1, 2, 4, 5. Confidence: high.

**2. Extra checks before sensitive actions**
Three actions count as sensitive (p.4): retrieving sensitive encrypted data, opening a Vault handoff, and replacing the Vault password.
- All three need a sign-in no older than 15 minutes.
- All three also need an authenticator code, but only if the participant has enrolled one.
- Replacing the Vault password also needs a single-use email confirmation bound to the same account and session.
- Page 4. Confidence: high.
- The sentence about the email confirmation adds "which never replaces the current Vault password". It is unclear what "which" refers to.

**3. Can one person be borrower and lender?**
Not on the same loan. One account may be a borrower on one loan and a lender on another, "but never both on the same loan" (p.2). Page 2. Confidence: high.

**4. How a signing task goes to the Vault, and what the Vault does first**
- The product puts a short-lived, single-use code in the web address. The Vault signs the participant in afresh and redeems the code once. It then reloads the exact action from the application instead of trusting the page (p.2).
- A handoff covers one bounded action, not a general signing permission (p.1).
- Opening a handoff needs the fresh sign-in, plus the authenticator code if enrolled (p.4).
- An expired, replayed or already redeemed code is refused. A new code is issued only for the same, still-current action (p.4).
- Bitcoin signing (p.3): the Bitcoin domain produces the complete unsigned material, and the application stores it as an immutable batch. The Vault then signs locally. Afterwards the application checks the signed result, archives the package to separate storage, and only then records its receipt.
- Payments (p.4): the application records the exact payment intent and enters a durable signing phase before the Vault signs.
- Partial answer: the document does not say how the Vault signs the participant in, for example with which credential. It also does not say whether the Vault checks the content itself or shows it to the person for confirmation before signing.
- Pages 1–4. Confidence: high for the flow, low on what the Vault actually checks.

**5. Lost connection right after submitting: avoiding a double action**
- A command must be based on the current revision (p.1, p.4).
- The state change and its outbox job commit in one database transaction (p.3). The participant gets a stable operation identity and can recover the same result after a refresh or restart (p.3).
- Repeating a command with the same idempotency key and the same content returns the same operation. Reusing the key with different content is rejected (p.4).
- Before any retry, workers recheck the records and the chain to prove the identical action is still needed. Retries never change the action (p.3).
- For payments, a timeout after signing is never resubmitted blindly. The application reconciles, retries only with the identical signed bytes, or visibly blocks the account (p.4).
- Partial answer: the document does not say where the idempotency key comes from. It does not say whether the browser keeps it and resends it after reconnecting.
- Pages 3, 4. Confidence: medium to high.

**6. What a "completed" operation says about the blockchain**
- The document never defines a "completed" status. It does say that neither the workspace nor the operation shows that anything is final on a chain (p.5).
- A submitted transaction, a finished worker, a notification or a balance never shows finality, Bitcoin confirmation, default or a beneficiary (p.5).
- It separates five things: an accepted request, a submitted transaction, an observed event, a finalized contract event and a confirmed Bitcoin spend (p.2).
- So the answer is: nothing about chain finality. The term "completed" itself is not covered.
- Pages 2, 5. Confidence: medium.

**7. The local demonstration, and what a successful run does not prove**
- What it is meant to be: a single-machine setup that one command can start or resume, check, shut down cleanly, and reset or reseed only when explicitly asked. It runs:
  - a local Base chain with a fake USDC token
  - two persistent Bitcoin nodes on regtest, never a public test network
  - two isolated participants, each with their own browser session and Vault
  - the real product, Vault, application, observer and operations paths
- Its goal is one loan through normal repayment and confirmed borrower recovery in the browser (p.5).
- Shutdown keeps all state. It refuses to start if any setting points at a public network or public credentials (p.6).
- What a run does not prove: a passing check, healthy process, seeded fixture or demo receipt shows only the local setup. It does not prove a test-network or main-network deployment, an activated production service, or a completed security audit. Test funds are neither evidence of a participant payment nor production gas sponsorship (p.6).
- Important: its runtime is "not yet delivered". It is "still in progress and blocked", and its browser acceptance checks have not passed (p.5, p.6). Browser proof of the transfer-review correction is waiting on it (p.4).
- Pages 4–6. Confidence: high.

**8. What a company staff operator can and cannot do**
- The document says "workforce operators" (p.5). They use a separate operator site behind Cloudflare Access, with company Google identities, their own authenticator codes and 15-minute sessions. An active operator permission is checked on every request.
- There are three roles:
  - a viewer can only read
  - an operator can do only a fixed list of review and incident actions
  - a security administrator manages operator membership
- Every privileged attempt, including rejected ones, goes to an audit log the operator cannot edit.
- Partial answer: the fixed list of actions is not given. The document does not say directly whether operators can touch keys, funds or loan state. The domain as a whole holds no keys or signatures and does not automatically broadcast the lender's recovery after a default, which suggests limits, but that is not stated for operators.
- Page 5. Confidence: high for what is stated, low for anything beyond it.

## Confusing points, terms used before they are explained, gaps

**Terms used but never explained:**
- "fallback service" (p.5)
- "the borrower's secret" and "secret commitment" (p.2, p.3)
- "finality-qualified" (p.2)
- "gas" and "gas stipend" (p.2, p.6)
- "protocol keys" or "protocol address", as distinct from the payment account (p.4, p.6)
- "Vault envelopes" (p.4)
- "observers" (p.4)
- "destinations" (p.2)
- "reveal transactions" (p.6)
- "cooperative settlement" (p.6)
- "default" (p.5)
- "candidate version" of terms (p.2)
- what the borrower "deliberately accepts" after funding (p.3)
- why the system is called "one-loan" (p.1)

**Confusing:**
- "Recovery" has several meanings: account recovery, Vault recovery, the borrower's Bitcoin recovery and the lender's recovery after default.
- "Handoff" is both the Vault handoff and the "Handoff Sequence" build record (p.4, p.6).
- The sentence about the "transfer-review correction" (p.4) is hard to follow.
- How the lender's explicit approval relates to its earlier acceptance of the offer is openly undecided (p.2).
- "Which never replaces the current Vault password" (p.4) has an unclear referent.

**Expected but missing:**
- the list of operator actions
- what the Vault shows or checks before signing
- a list of loan or workspace statuses
- what happens on default or non-repayment from the participant's view
- how idempotency keys are created and kept
- loan economics such as amounts, interest and collateral ratio, which may live in the terms guide
- how the Vault's own sign-in works
