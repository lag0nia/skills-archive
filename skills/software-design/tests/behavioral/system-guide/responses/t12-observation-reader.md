Note on method: I tried to read the PDF with `pages` set to 1-20, but that failed because pdftoppm is not installed. The document is only 6 pages, so I read it in one Read call without `pages` and got the full text and page images for pages 1–6. I opened nothing else.

## Answers

**1. When can a Base event move a loan forward or start a Bitcoin action?**
Only when the event's block reaches Base L1 finality, the settlement point on Ethereum underneath Base. An event first seen in a block is "observed", which is provisional. Base's later "safe" stage is only progress information. Before finality the application can store the event and show a status labelled "awaiting finality", but it cannot advance the loan. After finality the application can advance the loan, and a finalized claim event lets the Bitcoin domain act on the public Y. Finality usually takes about twenty minutes, as Base documents it, but the guide says this is not a promised wait. The guide calls L1 finality the "single consequential boundary" for funding, secret disclosure, repayment and refund. If a reorganization removes an observed event before finality, the event becomes "noncanonical" and is kept as evidence.
Pages 1, 2, 5. Confidence: high.

**2. How many data sources are needed before a Base event is trusted, compared with Bitcoin evidence?**
For Base, one healthy provider is enough to establish a finalized fact. Alchemy is the primary provider and QuickNode is the fallback. The second provider is there for failover and for spotting disagreement. If both are unavailable, or they disagree, consequential actions are blocked. Bitcoin evidence has a stricter rule: it needs "fresh agreement between the configured Bitcoin observers". The guide does not say how many Bitcoin observers there are or what "fresh" means. A Bitcoin conflict or outage blocks the automation that depends on it. Repeated reports update one incident, which escalates after five minutes or one missed block. A failure after the borrower's acceptance is treated as critical at once. Recovery replays from the last agreed state.
Pages 2–3. Confidence: high for the Base rule and for the comparison; the guide answers the Bitcoin observer count only partly.

**3. What does the application show and allow when both Base providers fail or disagree?**
Finalized status already shown stays visible. New consequential actions that depend on Base are blocked until the problem clears. The guide does not say:
- whether users see a warning or outage message;
- what happens to statuses still "awaiting finality";
- exactly which actions count as "consequential";
- whether a Base outage raises an incident or escalates (it describes this only for Bitcoin).

Page 2. Confidence: high for what it states; the answer is only partial.

**4. What can a staff operator do if they think an observed fact is wrong?**
They can request a recheck through the application. They cannot change a fact, override the result or move the observer's cursor. The authority boundaries also forbid any edit to the application's status or to a recorded fact. Corrections happen only by appending them, for example after a reorganization; the source history is never edited. The guide does not explain what a recheck does, who reviews it, or what happens if the recheck confirms the operator's doubt. It also says "operator", not specifically "staff operator".
Pages 2, 5. Confidence: high for what is allowed; the answer is partial on what happens next.

**5. What must already be true when a loan is created for the fallback service ever to help it?**
- **Gate met:** the fallback's production gate must already be met, meaning counsel approval plus implementation evidence. A resolved technical ticket does not count. Until then, no new loan may commit to S or advertise the fallback.
- **Commit:** before the loan's escrow is built, the service must create a random secret S for that loan and return only its hash.
- **Bind:** the borrower's recovery transaction must be built to accept either Y or S, and the borrower signs it once.

A loan built with Y only "can never gain it later", and no replacement secret is possible for an existing escrow. The guide places these steps at escrow construction, not literally at "loan creation", and it never fully defines "eligible loan".
Pages 4, 5. Confidence: high.

**6. What lets the service release its secret, and what does it check itself?**
The trigger is one exact finalized refund event, "unclaimed repayment refunded", at Base L1 finality. That refund can only exist after the claim cutoff C (the repayment deadline D plus 172,800 seconds, which is two days), when Base disables the lender's claim and freezes the borrower's refund recipient. The service checks these on its own:
- chain
- deployment
- loan
- event
- amount
- frozen recipient
- finality

It does not accept the application observer's conclusion as authority. It may use a public event reference only as a starting point. These cannot trigger publication: a missing Y, elapsed time, an application assertion, a raw token transfer, the earlier repayment event, or wrong, early, unfinalized, cross-loan or unverifiable evidence. Nobody (the organization, the borrower or the lender) can order an early release. The exact script, trigger and lookup contract are in a separate interface record, not in this guide.
Pages 2, 3, 4, 5. Confidence: high.

**7. After S is published, what still has to happen before the borrower has the Bitcoin back?**
The Bitcoin domain checks the publication and the hash. It inserts S into the same transaction the borrower signed earlier, which has a fixed destination, and broadcasts it. Recovery is final only when that transaction confirms on Bitcoin. No new signature, destination or service key is involved.
The guide leaves one thing open. The lender's pre-signed recovery matures three days after D, and "the first confirmed spend wins". So the S-based spend probably has to confirm before the lender's route does. The guide states the race only in the "without Y or S" passage, so this is my inference, not something it says. It also says nothing about fees, how long confirmation takes, or how the borrower is told.
Page 4 (race context on pages 4–5). Confidence: high for the steps; low for the race point.

**8. If the service is unreachable or never publishes, what remains true for each party?**
- **Both parties:** the Base refund is already complete; the exact repayment was returned once to the frozen recipient. The Bitcoin escrow stays unspent. Recovery through S is unavailable. An outage can be recovered by independent verification and public replay of the same committed S. An empty or unreachable publication source does not prove the service deliberately withheld S.
- **Borrower:** has the USDC back. Their long-stop route matures ten days after D without any secret, but it does not cancel the lender's route.
- **Lender:** has lost the USDC claim since C. Their pre-signed Bitcoin recovery can mature three days after D. The first confirmed spend wins.
- **Mutual cooperation:** a further route, separately authorized.
- **Organization:** no discretionary release and no replacement secret. It has no collateral key, sale authority or discretionary payout power.

The guide calls these recorded residual risks. They are not evidence that the borrower defaulted, and the collateral is not guaranteed to come back.
Pages 4, 5. Confidence: high. The guide does not spell out per-party outcomes; I put them together from these passages.

## Confusing points, undefined terms and gaps
- **"X" is never explained.** Page 2 says the domain provides "finalized public X and Y" to the Bitcoin domain. Y is explained only on page 3; X never is.
- **Terms used before or without definition:**
  - "public Y" appears on page 2, before Y is defined on page 3.
  - "Vault payment account" and "Vault payment transfers" (pages 2–3).
  - "recipient switch" event (page 1).
  - "long-stop" (page 4).
  - "lender recovery packages" and "package storage" (pages 5–6).
  - "Bitcoin was activated" (page 5).
  - "activation gate" (page 5), before the gate is described in the next section.
  - "eligible loan" (pages 2–3), clarified only partly on page 5.
  - "ECVS" is used on page 6 but never expanded; I assume it means Evidence-Conditioned Validation Service.
- **Unnamed domain:** the guide says there are five domains but names only terms, operations and Bitcoin besides this one.
- **Confusing name:** the invariant is called "Missing Y Residual Lender Risk", yet in that scenario the borrower seems to bear the risk.
- **Apparent tension:** the service may use the observer's event reference as a starting point but does not accept the observer's conclusion. It reads as consistent, but deserves one explicit sentence.
- **Layout:** most of page 3 is blank because the flow figure was pushed to page 4.
- **Expected but missing:**
  - how many Bitcoin observers there are, and how "fresh" is defined;
  - what the user interface shows during a Base outage and what "consequential" covers;
  - any incident or escalation rule for Base provider trouble;
  - what an operator's recheck does;
  - where S is published, how long the service has to publish, and how the borrower is told;
  - an explicit statement of the race between the S route and the lender's route at D plus three days;
  - who calls the refund in practice, since "anyone may";
  - Bitcoin fee handling.
