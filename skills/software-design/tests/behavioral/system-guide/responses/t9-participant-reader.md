I read the whole PDF, which is only 5 pages. Reading it with the `pages` parameter failed because pdftoppm is missing, so I read it without that parameter and all 5 pages came back with their text and page images. I opened no other file and ran no commands.

## Answers

**1. What does signing in give a participant?** (p. 2, also p. 4; confidence: high for what is stated, but the document only partly answers)
- Signing in uses WorkOS behind a provider adapter. The application, not WorkOS, keeps the stable account identity and the borrower and lender roles.
- Signing in can authorize fetching the participant's encrypted Vault data and the encrypted artifacts bound to them.
- It cannot decrypt a Vault, recover a seed or secret, or make a chain action valid.
- Page 4 adds that a login never means chain finality, Bitcoin confirmation, default, beneficiary selection or secret recovery.
- Gap: the document never says plainly that signing in gives access to your loan workspaces or to particular actions. It only implies this: the workspace is per participant role (p. 1), and the product page loads its "authorized workspace" (p. 2).

**2. What extra checks apply before especially sensitive actions?** (p. 2, p. 4; confidence: low, mostly not answered)
- Page 2 says the identity part of the domain owns "fresh reauthentication and multi-factor authentication (MFA)". It never says which actions trigger them or when.
- The only action-specific checks described are for sending USDC from a Vault payment account: it needs exact approval plus balance and gas checks (p. 4).
- Related controls:
  - Every command is checked against the current revision (p. 1, p. 3).
  - A payment account's address is made public only after a backup proves it can be restored (p. 3).
  - Any change to a repeated broadcast needs a fresh review (p. 3).
- Page 4 notes that new consequential commands stop during a provider outage, which suggests "consequential" is a category, but the document doesn't define it.

**3. May the same person act as borrower and lender?** (pp. 1, 2; confidence: high that the document does not answer)
- Not answered. The document mentions borrower and lender roles (p. 2), a workspace per participant role (p. 1), and a demo with two isolated participants (p. 2). Nothing allows or forbids one person holding both roles.

**4. How does the product hand a signing task to the Vault, and what does the Vault do before signing?** (pp. 1, 2, 3, 4; confidence: high for the flow, low for the Vault's own pre-signing steps, which are only partly covered)
- A handoff gives one participant access to one bounded action in their Vault through a short-lived, single-use code. It is not a general signing token (p. 1).
- For Bitcoin signing, the normal case (p. 2) runs in this order:
  1. Bitcoin operations produce complete unsigned signing material.
  2. The application stores it as an immutable batch.
  3. The product opens a bounded Vault handoff.
  4. The Vault signs locally.
  5. The application checks the result and writes the full package set to storage.
  6. Only then does the application issue its receipt.
- For payments (pp. 1, 3, 4):
  - A payment intent fixes the exact public payment request before the Vault signs.
  - The application records that signing has begun before the signer runs.
  - The Vault owns the encrypted pending bytes and the signing.
- Gaps:
  - The document does not say what the Vault itself checks or shows the participant before signing (for example, displaying or verifying the request, or asking for a password).
  - It does not say how the code is passed to the Vault (redirect, link, or something else).

**5. If the browser loses its connection right after submitting, how is the action not done twice?** (pp. 1, 2, 3, 4; confidence: medium-high, but the exact mechanism isn't named)
- Commands carry a revision. A command based on an outdated view is rejected rather than misapplied (p. 1).
- The domain owns "safe retries of the same request" (p. 2).
- The state change and its outbox job are saved in one transaction (pp. 1, 3).
- The product page receives an acknowledgement for an accepted command and can recover the same result after a refresh or restart (p. 2).
- When an outcome is ambiguous, the exact request, participant, amount, nonce, fees, bytes and transaction identities are kept, so a lost response never becomes a new payment or a changed action (p. 3).
- A repeated broadcast uses identical bytes (p. 3).
- Recording the exact intent before the Vault signs prevents paying twice after a lost response (p. 4).
- Retried background work is re-checked first to confirm the identical action is still needed (p. 3).
- Gap: the document doesn't say how a resubmitted request is recognized as "the same request" (for example, a request ID).

**6. What does a "completed" operation in the workspace tell a participant about the blockchain?** (pp. 1, 2, 3, 4; confidence: medium, partly answered)
- The document never defines a "completed" status.
- What it does say:
  - A "completed worker", a submitted transaction, a relay response or any application state does not mean chain finality or Bitcoin confirmation (p. 4).
  - The workspace shows sourced status, either provisional or final (p. 3).
  - The system distinguishes five stages: accepted request, submitted transaction, observed transaction, finalized contract event, and confirmed Bitcoin spend (p. 1).
  - A loan is shown as closed only after finalized contract outcomes and a confirmed Bitcoin recovery (p. 2).
- So application-side completion by itself tells a participant nothing about the chain. Only status labelled as sourced and final does.

**7. What is the local demonstration, and what does a successful run not prove?** (pp. 2, 4, 5; confidence: high)
- What it is (p. 2): a developer-only, deliberately isolated setup that assembles the independently built parts through their public interfaces.
  - One entry command checks prerequisites, starts or resumes, waits until every part is healthy, and reports.
  - Matching status, shutdown and explicit reset or reseed commands exist.
  - It runs a local Base test chain with a test USDC token, two connected persistent local Bitcoin test nodes, and two isolated participants with their own browser sessions and Vaults.
  - It uses the real product, Vault, API, observer and Bitcoin operations, with fixtures bound to those identities.
  - Ordinary shutdown keeps state. Only an explicit reset asks each part to reset its own state.
- Current status (pp. 4–5): not yet delivered.
  - Its supervisor is still in progress, and it waits on pending work in other parts.
  - Its browser acceptance check is planned and unverified.
  - The Vault payment check inside it is also planned and unverified.
- What a successful run does not prove:
  - A test, fixture, healthy process or demo receipt cannot by itself satisfy the runtime-profile claims (pp. 4–5).
  - No local evidence satisfies the later activation gates, meaning test-network or main-network deployment and production operation (p. 5).
  - Funding payment addresses with disposable test money is neither evidence of a participant payment nor production gas sponsorship (p. 4).
  - A mock or health check does not prove that the public path works (p. 2).

**8. What can a company staff operator do and not do?** (pp. 2, 3; confidence: low, mostly not answered)
- Operator access is separate from participant access (p. 2).
- Once a payment's escalation decision is due at 180 seconds, "the participant or an authorized operator" may trigger an explicit reprobe or an identical retry (p. 3).
- Nothing else describes what operators can do. The "never" list on page 4 applies to the whole domain, not to operators specifically.

## Confusing points, undefined terms and gaps

**Confusing or unexplained**
- "Finalized public X on Base" (p. 2, step 3) looks like an unfilled placeholder.
- "Vault" is central but never defined: what it is, where it runs, and how the password relates to it.
- "Base" is never introduced as a blockchain.
- The other four domains are never named.
- In the repayment step, "confirmed Bitcoin recovery" is unclear: it probably means the collateral is returned, but the document doesn't say.
- "Payment account" and "protocol address" are both used, and it's unclear when each one applies.
- The 180-second "escalation decision is mandatory", but the document doesn't say who makes it or what the options are.
- It's unclear what counts as the "required reproduction proof" (p. 3).
- Whether the lender approves the final terms a second time is left as an open question (p. 2).

**Used before (or without) explanation**
- "Gas stipend" appears on p. 2 and is explained only partly on p. 5.
- Never explained:
  - "unrevealed secrets" and "reveal execution"
  - "fallback evidence"
  - "lender-default transactions"
  - "beneficiary selection"
  - "nonce"
  - "relay response"
  - "observer"
  - "reserved loan"
  - "preparation material"
  - "runtime profile scope"
  - "activation gates"
  - "cooperative settlement"

**Expected but missing**
- Which actions require reauthentication or MFA.
- Whether one person can hold both the borrower and lender roles.
- What operators can do, and with what audit.
- How the handoff code reaches the Vault, and what the Vault verifies or shows before signing.
- The list of workspace status labels and their meanings.
- How a retried request is identified.
- How account recovery works, as distinct from Vault password recovery, which the document says does not exist in this version.
- A glossary.
