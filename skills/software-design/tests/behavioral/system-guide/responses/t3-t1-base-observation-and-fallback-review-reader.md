## How I read it

The PDF has 6 pages. When I called Read with `pages: "1-20"` it failed because pdftoppm is not installed. I then called Read once with no `pages` parameter, and that returned all 6 pages, both as text and as page images. I did not open any other file, run any commands or search the web.

## Answers

**1. When can a Base event move a loan forward or start a Bitcoin action?**
Only once the event is *finalized*, meaning its block has reached "Base L1 finality" (irreversibly settled on Ethereum). The statuses run in this order:
- *observed*: first seen in a Base block.
- *safe*: its batch has been posted to Ethereum. This is "progress information only."
- *finalized*: the only status that can change the loan's lifecycle or trigger a Bitcoin action.

An event pushed out by a chain reorganization becomes *noncanonical*.

After finality, the observer hands the fact to the application through a "versioned handoff." The application stores the evidence and acknowledges it, and that stored evidence then drives the status participants see. The application may show an event straight away, labelled as awaiting finality.

Further limits:
- A correction that stays ambiguous remains "contested" and blocks any action that depends on it.
- For Vault payments, only the named finalized contract event establishes funding or repayment.
- A finalized fact is still only evidence. It does not by itself sign or broadcast anything on Bitcoin, and it does not establish a default.
- This rule costs about 20 minutes per cross-chain handoff, and the document says that figure is not a promise.

Pages 1, 2, 4, 5. Confidence: high. One gap: the document does not say whether a dependent action may start at finality itself or only after the application has stored and acknowledged the fact.

**2. How many data sources must work before a Base event is trusted, and how does that compare with Bitcoin?**
- **Base:** one healthy provider is enough for a finalized fact. Alchemy is the primary and QuickNode the fallback. The second provider gives failover and detects disagreement. If two healthy providers disagree, new consequential actions stop rather than the system guessing.
- **Bitcoin:** lifecycle gates need *fresh agreement between two configured sources*, which is stricter than the Base rule. If the two conflict, or both are unavailable:
  - the system retries every minute, treating it as one incident;
  - it escalates after five minutes or one missed Bitcoin block;
  - it is critical immediately if this happens after the borrower's acceptance;
  - automation resumes only after fresh agreement and a replay from the last agreed state.

Pages 3, 4, 5. Confidence: high.

There is one muddle. Page 4 says "the public profile needs two separately operated Base providers plus the observer," and that the local demonstration uses one provider. My reading is that two providers must be deployed but only one needs to be healthy. However, that sentence sits inside the Vault-payments bullet, so it is unclear whether it is a general requirement. The document never names the Bitcoin sources.

**3. What is shown and allowed when both Base providers fail or disagree?**
Existing finalized information stays visible. New consequential actions that depend on Base are blocked. Page 5 adds that a disagreement stops new consequential actions instead of being settled by guessing.

Pages 3, 5. Confidence: high for these statements, but the answer is only **partial**. The document does not say:
- what warning or status the screen shows;
- whether events still awaiting finality remain visible;
- exactly which actions count as "consequential";
- how normal operation resumes on the Base side (for Bitcoin it does say how).

**4. What can a staff operator do if they think an observed fact is wrong?**
An *authorized* operator can request a recheck through the application, and that is all. They cannot call the observer directly, edit source records, move the cursor or override the resulting fact. The authority boundaries repeat that no operator, the company or a participant may override a fact.

Page 4. Confidence: high for these limits. The answer is **partial**:
- The document says "authorized operator", not "staff", and never says who qualifies.
- It does not say what a recheck actually does, how its result is reported, or what happens if the operator still disagrees.

The only related mechanism is that an ambiguous correction stays "contested" and blocks dependent actions (page 2).

**5. What must already be true when a loan is created for the fallback service ever to help it?**
- **Before the loan is built**, the ECVS (the independent fallback service) must have created the loan's unique secret S and returned only its hash. That hash goes into the Bitcoin escrow script.
- **The production gate must have passed**, which requires counsel approval and implementation evidence. Until then, a new loan must not commit to S or advertise the fallback.
- **An escrow that relies only on Y** (the lender's secret) can never acquire S later, whatever happens to the gate.

The Bitcoin side later checks that the fallback was "production-activated" for that loan. The borrower's pre-signed recovery transaction must also be retained, because S is inserted into it.

As of this document the fallback is "selected, not available," so **no loan may rely on S yet**.

Pages 2, 3, 5. Confidence: high. Gap: S exists "for each eligible loan", but the document never says what makes a loan eligible.

**6. What lets the fallback service release S, and what does it check itself?**
The only trigger is the exact unclaimed-repayment refund event, finalized at Base L1 finality. That refund can only be submitted at or after the claim cutoff C, which is the repayment deadline D plus 172,800 seconds (two days).

The ECVS does not accept the application's conclusion. On its own it verifies:
- the configured chain;
- the contract deployment and current implementation;
- the event signature;
- the loan;
- the transaction and log;
- that the block is canonical and finalized;
- the exact debt;
- the frozen refund recipient.

None of these can trigger S: a missing Y, elapsed time, an application assertion, a raw token transfer, or the earlier "repaid" event. Evidence that is wrong, early, not final, from another loan, or unverifiable cannot authorize publication either. No operator, the company or a participant can order publication or get S before it is published. The ECVS checks one exact event and does not judge disputed entitlement.

Pages 2, 3, 4. Confidence: high. Gap: S is published "durably and publicly", but the document does not say where.

**7. After S is published, what still has to happen before the borrower has the Bitcoin back?**
Publishing S is explicitly not a recovery. First, the Bitcoin operations independently check:
- that the fallback is production-activated for the loan;
- the public source and its binding to the event;
- that S matches the hash;
- the exact retained recovery package, its signature and its fixed outputs;
- that the escrow is still unspent.

Only then do they insert S into the same borrower-signed transaction that Y would have completed, pick an existing fee level and broadcast it. At that point it is still pending. Recovery is final only when that spend confirms on Bitcoin. No new borrower signature, service key or new destination is involved.

The race matters: until a recovery spend confirms, the other routes stay open, and "the first confirmed spend wins."

Pages 3, 4. Confidence: high. Not stated:
- how many confirmations count as "confirms";
- what happens if the transaction is stuck at the chosen fee level;
- who triggers the Bitcoin operations.

**8. If the fallback service is unreachable or never publishes, what remains true for each party?**
- **Borrower's USDC:** the completed Base refund stays valid in every case, and it never waits for the fallback. The repayment goes back to the frozen borrower recipient.
- **Borrower's Bitcoin:** it stays in escrow. The borrower's long-stop route becomes valid ten days after D by Bitcoin's consensus clock, without cancelling the lender's route. Mutual cooperation is a separately authorized route. The document calls this a residual risk for a borrower who repaid, not evidence of default and not a promise that the collateral comes back.
- **Lender:** the Base claim was permanently disabled at C. The lender's pre-signed timelock route on the Bitcoin becomes valid once Bitcoin's consensus clock is strictly later than three days after D. The first confirmed spend wins.
- **Fallback service:** a temporary outage can be recovered by verifying again and re-publishing the same S. If S is lost, compromised or withheld, a "defined incident path" applies. No company release or replacement secret can repair an existing escrow.
- **Company:** it has no collateral key, sale authority or discretionary payout power. Automatic broadcast of the lender's default package and institutional recovery of collateral are deferred and not part of this version.

Pages 3, 4, 5. Confidence: high for the stated facts.

One point is my own inference, not something the document says. The fallback can only start after C (D + 2 days), and the lender's timelock opens at D + 3 days. That leaves roughly one day before a borrower who repaid in full could lose the Bitcoin to the lender in the race. The document does not discuss this window.

## Confusing, defined late, or missing

**Terms used but never explained, or explained late**
- "X accepted" and "Y released" appear on page 1. Y is explained only on page 3; X is never explained.
- Other terms never explained:
  - "Vault payment accounts" (pages 2, 4)
  - "lifecycle gates"
  - "versioned handoff"
  - "eligible loan"
  - "borrower's acceptance"
  - "nonce" and "other bound fields"
  - "public profile" vs "local demonstration"
  - "transaction family"
  - "existing fee level"
  - "lender's default package"
  - "Bitcoin's consensus clock"
  - "production-activated"
  - "defined incident path"
  - "mutual cooperation … separately authorized"
- "L1" is never spelled out, and "chain reorganization" is assumed knowledge.

**Confusing points**
- "Two separately operated Base providers" (page 4) seems to sit uneasily with "one healthy provider is enough" (page 3).
- The difference between the "repaid" event and the "unclaimed repayment refunded" event is only implied.
- "Recovery" means both incident recovery and the Bitcoin recovery transaction.
- The title says "Review", but no review activity is described.
- It is unclear whether lifecycle changes happen at finality or only after the application acknowledges the fact.
- Escalation, at 180 seconds for Vault payments and at five minutes for Bitcoin sources, never says who it goes to or what they decide.

**Expected but not found**
- One timeline showing D, C, D+3 days and D+10 days together.
- What happens if repayment is not finalized by D.
- What the screen shows during a provider outage.
- What a recheck produces.
- Where S is published and how S is stored and protected.
- Who runs the ECVS and the observer.
- Confirmation depth on Bitcoin.
- What the "defined incident path" actually involves.
- Whether the fallback can realistically complete before the lender's timelock opens.
