**How I read it:** Reading with the `pages` parameter failed because pdftoppm is not installed. I read the PDF with the same Read tool without `pages`, which returned all 7 pages (text and page images). I opened no other file and ran no commands.

## Answers

**1. What does signing in give a participant?**
- Participants sign in through WorkOS, an outside identity provider, with Google or an emailed six-digit code. A session lasts at most 7 days and ends after 24 hours of inactivity (p.2).
- Signing in lets a participant get back only their own encrypted artifacts. It "can never decrypt a Vault or make a chain action valid" (p.2).
- From the signed-in session, participants browse and reserve offers and approve the final terms (p.3).
- Signing in, a role, account recovery, a reservation or an approval never counts as consent to a transaction, funding, chain ownership or a beneficiary (p.5).
- Recovering the product account restores sign-in and access to the encrypted data. It does not restore the Vault password, keys or secrets (p.5).

Pages 2, 3, 5. Confidence: **high** on the limits. **Medium** on the full list of what a signed-in participant can do: the document never lists it in one place, so I inferred it from the example walk-through.

**2. Extra checks before especially sensitive actions?**
- Sensitive steps need a sign-in no older than 15 minutes. The examples given are retrieving encrypted Vault data, opening a Vault handoff and replacing the Vault password.
- A participant may enroll an authenticator app (TOTP). Once enrolled, it is required for those same steps.
- Enrollment is optional ("may enroll"). The list starts with "such as", so it may not be complete.

Page 2. Confidence: **high**. The document does not say whether other actions also count as sensitive.

**3. May the same person act as borrower and lender?**
One account may be a borrower on one loan and a lender on another, but never both on the same loan.

Page 2. Confidence: **high** for accounts. The rule is stated per account, not per person. The document does not say whether one person could hold two accounts and take both sides of one loan.

**4. How does the product hand a signing task to the Vault, and what does the Vault do first?**
- A handoff gives one participant access to one bounded action in their Vault. The Vault is a separate browser application that holds their keys. The handoff is a single-use code, not a general signing token (p.2).
- In the signing step, Bitcoin operations produce the complete unsigned signing context. The application stores it as an unchangeable batch and opens a handoff (p.3).
- The participant's browser passes a short-lived, single-use code to the Vault. The Vault then:
  - signs in on its own,
  - redeems the code,
  - reloads and checks the exact bytes,
  - signs locally (p.3).
- The application then checks the returned signatures, writes every package to its primary archive, and only after that issues a receipt (p.3).
- Opening a handoff needs the 15-minute fresh sign-in, plus TOTP if enrolled (p.2).
- For payments, the application fixes the exact payment intent and enters a durable "signing" phase before the Vault signs (p.4).
- For acceptance and claim calls, the application prepares the call without the secret. The Vault inserts the secret and signs locally (p.5).

Pages 2–5. Confidence: **high** on the steps. The mechanics are only partly answered:
- how the code is passed from browser to Vault,
- what the Vault signs in with,
- what the bytes are checked against,
- how short "short-lived" is.

**5. Browser loses its connection right after submitting: how is a double action avoided?**
- Commands carry a revision and are idempotent. An accepted command gets a durable identity (p.2, p.4).
- The exact request, route, participant, amount, nonce, fees, bytes, provider and transaction identities survive every uncertain outcome. A lost response never becomes a new payment or a changed action (p.4).
- Retries reuse the same command identity. A changed request under the same identity is rejected (p.4).
- The state change and its background job are recorded in the same transaction (the outbox). Requests have a durable pending or completed status, so a page refresh or restart resumes the work rather than starting over (p.1, p.3).
- For Vault payment accounts, a durable "signing" phase starts before the Vault signs. After that point, a timeout or closed tab does not prove the payment was never sent. A new device must restore or exactly reproduce the pending transaction, or the account stays visibly blocked. Reconciliation checks the outcome at 0, 15 and 60 seconds and escalates at 180 seconds (p.4).
- p.6 says these payment accounts are "a target, not verified behavior".

Pages 1–4, 6. Confidence: **medium-high**. The guide does not explain:
- how the browser keeps the command identity across the disconnect so it can retry with it,
- how a retry relates to the revision check (the first attempt may already have moved the revision on).

p.6 says only that the records "add explicit work" for how a browser recovers an accepted operation.

**6. What does a "completed" operation in the workspace say about the blockchain?**
The document does not answer this directly.
- "Completed" appears only on p.3, as the durable pending or completed status of Vault requests while reserving. Those are off-chain tasks: setting aside a loan key and preparing destinations and a secret commitment.
- The document separates "command accepted", "transaction submitted", "event observed", "event final on Base", "transaction broadcast on Bitcoin" and "transaction confirmed" (p.2).
- It says an application record is not a chain fact (p.1).
- The application's own records move first, but a participant sees a chain result only once the chain's own evidence supports it (p.4, Figure 1).
- The workspace shows where each fact came from and how fresh it is (p.1). It advances only on final contract events and confirmed Bitcoin recovery (p.3).

By inference, "completed" alone does not mean anything happened on a chain. The document never says this outright.

Pages 1–4. Confidence: **low-medium**. The question is only partly answered.

**7. What is the local demonstration, and what does a successful run not prove?**

What it is (pp.5–6):
- A developer-run copy of the whole system on one machine. It has:
  - a local Base chain (Anvil) with a fake USDC token,
  - two connected Bitcoin regression-test nodes,
  - the real product, Vault, API, observer and Bitcoin operations,
  - exactly two isolated participants, each with their own browser session and Vault.
- One entrypoint checks prerequisites, starts or resumes the system, waits until every part is healthy and reports. Matching commands show status, shut down and reset.
- Ordinary shutdown keeps the state. Only an explicit reset asks each component to wipe its own data.
- The goal is a browser-driven run through the real product and Vault:
  - create, back up and restore a Vault,
  - take one loan through funding, acceptance and activation,
  - repay normally and get the collateral back, confirmed.
- It produces a redacted local receipt.
- It refuses to start if any setting points at a public network or credential. Its fixed demo identities never enter a normal public build.

What it does not prove (p.6): a passing test, a healthy process, a seeded fixture or a demo receipt shows only that the local profile works. It does not show any of these, each of which needs its own evidence:
- a testnet or mainnet deployment,
- compatibility with real providers,
- a completed security audit,
- readiness for production.

Pages 5–6. Confidence: **high**.

**8. What can a company staff operator do and not do?**
- Operators use a separate console behind Cloudflare Access, with company Google identities, a mandatory one-time code and 15-minute sessions.
- Each request needs the exact permission for its action. There are three roles:
  - viewer: read only,
  - operator: fixed review, incident, recheck, automation pause, fee-tier, fee-bump export and Base request actions,
  - security_admin: manages operators and their roles.
- One operator approves an action alone. Every attempt, including rejected ones, goes to an audit log that operators cannot edit.
- No operator can override a chain fact, choose a destination or touch participant keys.
- The console itself is provided by the loan workspace and coordination responsibility (p.2).

Pages 2, 5. Confidence: **high** for the stated lists. **Low** on what the individual actions mean ("fixed review", "fee-tier", "fee-bump export", "Base request actions"), because none is explained. The document also does not say whether operators can see participant data, help with account recovery, cancel loans or send gas.

## Confusing points, terms used before being explained, and gaps

**Confusing**
- "Operator" is both the general word for staff and the name of one role.
- p.5 says approving the terms is not consent to a transaction, but p.3 has participants approving terms. The document never says plainly that consent comes only from signing in the Vault.
- p.4 describes Vault payment accounts as if they already work, but p.6 says they are an unverified target.
- "Choices and their reasons" talks about "the user" and "the agent", which is design-process language in a system guide.
- "One-loan system" is never explained.

**Used without being explained (or explained later)**
- "Firm offer" and the reservation "timers".
- "Secret commitment", "unrevealed secret" and "a secret becomes final": the secret's role is not explained.
- "Activation escrow", "six confirmations" and "exit transactions": why Ana signs 12 and Ben 6 is not explained.
- "Gas stipends" (p.2), explained only later as "gas help" (p.5).
- "Protocol account" (p.4).
- "Observer", "terms domain" and "Bitcoin operations": the five domains are never listed.
- "Permissionless and fixed-effect automation".
- "Claim", "claim cutoff" and the "unclaimed-repayment refund".
- "Primary archive", which suggests a secondary one.
- "Validated receipt" and "projections".
- "Consequential command".
- "Qualification of new loans".
- "Cooperative settlement".
- "Participant transfer" (first appears on p.6).
- The "adapter" around WorkOS.

**Expected but not found**
- What "completed" means compared with chain state.
- How the browser keeps the command identity for a retry.
- How long a handoff code lasts, and how the Vault signs in.
- What happens if the loan is not repaid. The walk-through covers only normal repayment.
- How sign-in works in the local demo.
- How account or sign-in recovery works.
- What triggers notifications and which channels they use.
- Data retention and account deletion.
- What participants see when there is an error.
- The loan economics: amounts, rates, collateral ratios. These are presumably in the terms domain or the architecture guide.
