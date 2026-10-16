I read the whole PDF, all 6 pages. Reading with the `pages` parameter failed because the PDF renderer (pdftoppm) is not installed, so I read the file without that parameter. That returned the text and an image of all 6 pages. I opened no other file and ran no commands.

**What the document is:** the domain guide for "Base Observation And Fallback Review", one of five domains of the "Bitcoin-backed USDC one-loan system". It is dated 15 October 2026 and its source ID is c6174e972a50. It points to a separate architecture guide, which I did not read.

---

## Answers

**1. When can a Base event move a loan forward or start a Bitcoin action?**
Only once the event has reached Base layer-1 finality.
- **Finality defined (p.1):** the point at which the Ethereum batch containing the Base block is final, roughly 20 minutes after the block. Before that, a chain reorganization can still make the event disappear.
- **Before finality (p.2):** the application may show the event as soon as it is seen. Even Base's intermediate "safe" status, reached in about two minutes, counts as progress only.
- **At finality (p.2):** the observer delivers the event through a "versioned ingestion handoff". The application stores it, works out the loan status and acknowledges storage. Only then does the observer move its saved resume position (its "cursor") forward.
- **One rule for all steps (p.5):** "Act only at layer-1 finality" applies to funding, secret disclosure, repayment and refund. The 20 minutes is Base's documented figure, not a guaranteed waiting time.
- **Finality is necessary but not always enough:**
  - Seeing an event never by itself implies an action, a Bitcoin activation, a recovery or a default (p.4).
  - Some steps add conditions. Ana's acceptance step opens only after a fresh check that Bitcoin evidence still agrees, the funding is under 24 hours old, and at least 19 hours remain before the "prefund refund" becomes valid (p.2).
  - Only the contract's named final event establishes funding or repayment. A payment on its own, or a standalone participant transfer, never advances a loan (p.4).
- **Partly unanswered:** which Bitcoin actions follow which events is left to the architecture guide.
- **Pages:** 1, 2, 4, 5. **Confidence:** high.

**2. How many data sources must work before a Base event is trusted, compared with Bitcoin evidence?**
- **Base needs one.** One healthy provider is enough to establish a final Base fact (p.3). Alchemy is the primary provider and QuickNode is its fallback. The second provider is there for failover and to detect disagreement.
- **Why (p.5):** with a single provider the observer would be blind during an outage. Requiring two providers to agree on every action would add a permanent dependency and delay safe operations whenever the backup is down.
- **Bitcoin needs two.** Bitcoin gates need fresh agreement between two independent sources (p.4). A conflict or an outage blocks dependent automation, and recovery replays from the last agreed state. An incident escalates after five minutes or one missed block, and is critical immediately once the borrower has revealed "X".
- **Not stated:** which Bitcoin sources are used, or how recent "fresh" must be.
- **Pages:** 3, 4, 5. **Confidence:** high.

**3. What does the application show, and allow, when both Base providers fail or disagree?**
- **Shown:** facts that are already final stay visible (p.3).
- **Allowed:** every new action that depends on Base is blocked until the incident is resolved (p.3).
- **Disagreement:** a disagreement between two healthy providers is treated as an incident and never settled by a local majority guess (p.5).
- **Partly unanswered:** the document does not say what the user actually sees during the incident (a banner or message, for example), who resolves it, how, or how long it may take. It also does not say whether the fallback service is affected by the same outage.
- **Pages:** 3, 5. **Confidence:** high for what is stated; the screen details are not covered.

**4. What can a staff operator do if they believe an observed fact is wrong?**
- **What they can do:** request a recheck through the application (p.3).
- **What they cannot do:** change a fact, override a result or advance the observer's cursor (p.3).
- **Related rules (p.4):** the observer itself cannot override a fact. The application keeps an append-only history of events and corrections, not an editable snapshot.
- **Partly unanswered:** the document does not say what a recheck does, what happens if it confirms the disputed fact, or what escalation is available. It says only "an operator" and never defines that role or ties it to staff.
- **Pages:** 3, 4. **Confidence:** high for what is stated; the rest is not covered.

**5. What must already be true when a loan is created for the fallback service ever to help it?**
- **Commitment at creation:** the loan must be "eligible" and carry a hash commitment to its own unique secret S. That commitment must be fixed in the loan before any Bitcoin transaction is signed (p.2). A loan without it can never gain it later (p.4).
- **Created after the production gate:** the fallback example is for a loan created after the fallback service (the ECVS) passed its production gate (p.2). The ECVS is currently "designed, not available" (p.4). Production use needs counsel approval and implementation evidence first, and until then no new loan may commit to S or advertise the fallback (pp.4–5).
- **So today:** no loan can benefit yet.
- **One recovery transaction:** the borrower signs a single recovery transaction that must work with either the lender's secret Y or the backup secret S (p.5). It is the stored transaction the borrower signed after the activation escrow confirmed (p.3).
- **Partly unanswered:** "eligible loans" (p.1) is never defined beyond these conditions.
- **Pages:** 1, 2, 3, 4, 5. **Confidence:** high for the commitment and gate requirements; medium on what "eligible" covers.

**6. What lets the fallback service release its secret, and what does it check itself?**
- **The only trigger:** the exact refund event of that loan, after it reaches layer-1 finality (pp.2–3). The sequence:
  1. The borrower's exact repayment is final by the deadline D.
  2. The lender does not claim it.
  3. At C, two days after D, the contract permanently disables the lender's claim and freezes the borrower's refund recipient.
  4. Anyone triggers the refund, which pays the exact repayment once to that recipient.
- **Its own checks (p.3):** the configured chain, deployment and contract code, the event, the loan, the transaction and log, the block's canonical status and finality, the exact amount and the frozen recipient.
- **Independence (p.2):** it may use the observer's event reference as a pointer, but it verifies the event itself and never trusts the application's conclusion.
- **Publication (p.3):** S is published durably and publicly, with evidence binding it to the loan and the event. Anyone can check S against the loan's hash commitment.
- **Things that cannot trigger it (p.4):**
  - lender silence, a missing Y, elapsed time, a token balance, an application assertion, or the earlier repayment event;
  - wrong, early, non-final, cross-loan or unverifiable evidence.
- **No early release (p.4):** the organization, the borrower and the lender never receive S before publication and cannot order an early release.
- **Pages:** 2, 3, 4. **Confidence:** high.

**7. After S is published, what still has to happen before the borrower has the Bitcoin back?**
- **Checks and broadcast (p.3):** "Bitcoin operations" check the publication, the commitment, the stored recovery transaction the borrower signed after the activation escrow confirmed, and that the escrow is still unspent. They insert S into that same transaction, changing nothing else, and broadcast it.
- **Confirmation (p.3):** recovery is complete only when that transaction confirms on Bitcoin. Publication is neither a broadcast nor a confirmation.
- **Race against the lender (p.4):**
  - The lender's pre-signed Bitcoin route matures three days after D and can take the collateral even though the borrower repaid.
  - S only gives the borrower a competing transaction, which protects her only if it confirms first. The first confirmed spend wins.
  - The refund, its finality, the publication and the Bitcoin confirmation all have to fit into the roughly 24 hours between C and that maturity.
- **Partly unanswered:** the document does not say who "Bitcoin operations" are (a person, the organization or automation), who pays fees, how many confirmations count, or what happens if the broadcast is late.
- **Pages:** 3, 4. **Confidence:** high.

**8. If the fallback service is unreachable or never publishes, what remains true for each party?**
- **Refund (pp.2, 4, 5):** the Base refund never waits for or depends on the ECVS. It is permissionless, stays available indefinitely, and remains complete and valid whether or not S is ever published.
- **Bitcoin escrow (p.4):** it can still be reached by its other pre-authorized routes.
  - The lender's route matures three days after D.
  - The borrower's long-stop route matures ten days after D, but it does not cancel the lender's route. The first confirmed spend wins.
- **Outage versus withholding (p.4):** an outage can be recovered by verifying again and replaying the same S. An empty or unreachable source is not proof that S was deliberately withheld.
- **Loss or compromise (p.4):** this follows a defined incident path, but nothing can replace the secret committed in an existing escrow. After early disclosure or compromise, S itself also becomes a route, which could allow premature borrower recovery.
- **Borrower (p.5):** the missing-Y case is a recorded residual risk. A valid repayment is not borrower default, and a refunded USDC balance is not complete Bitcoin settlement; the product must say so.
- **Lender (pp.2, 4):** the lender's claim on Base is permanently disabled at C, but the lender's pre-signed Bitcoin route can still take the collateral from three days after D.
- **Organization (pp.4–5):** it never holds S and cannot order its release. Broadcasting default packages and institutional collateral recovery are deferred and are not duties of the ECVS.
- **Partly unanswered:** the document never states the net outcome for each party, and gives no remedy for a borrower whose collateral the lender takes after a valid repayment. It also does not say whether Y could still appear after C.
- **Pages:** 2, 4, 5. **Confidence:** medium-high. The "each party" view is my assembly of scattered statements.

---

## Confusing points, terms used before they were explained, and gaps

**Terms used but never explained, or explained only later:**
- **"X"** ("once the borrower has revealed X", p.4) is never defined.
- **Y** is only partly explained (p.1: the lender's secret that "normally completes" recovery). How and when it becomes public in the normal case is not described.
- **Never explained:**
  - "Vault payment accounts" (p.2)
  - "prefund refund" (p.2)
  - "activation escrow" (p.3)
  - "default packages" (p.5)
  - "Bitcoin operations" (p.3), which reads like another domain
  - "the organization"
  - "operator"
- **"Production gate"** (p.2) is only explained by the boxed note on p.4.
- **"Eligible loans"** (p.1) are never defined directly.
- **The lender's pre-signed route and the borrower's long-stop route** appear first in the p.4 box, with no earlier introduction.
- **Roles of Ana and Ben** (borrower and lender) are left implicit.
- **The other four domains** are never named.

**Confusing:**
- The word "Review" in the domain name is never explained.
- The "Choices" section (p.5) talks about "the agent" and "the user", which look like leftovers from the design process.
- "Secret disclosure" is listed as a consequential step (p.5) without saying whose secret.
- A Base-observation domain also reconciles Bitcoin evidence and Vault payments (pp.2, 4), which seems outside its name.
- The refund "stays available indefinitely", yet the fallback only works if the refund happens within about 24 hours of C. Nothing says who makes sure the refund is triggered promptly.

**Expected but missing:**
- What users see during an incident, who resolves incidents, and how.
- What a recheck does and what follows from it.
- The incident path for loss or compromise of S.
- Where and how S is published.
- Who broadcasts the recovery transaction, who pays the fees, and how many confirmations count.
- A timeline showing D, C, D+3 days and D+10 days.
- Any remedy when the lender takes the collateral after a valid repayment.
- What applies to loans created before the production gate, beyond relying on the other routes.
