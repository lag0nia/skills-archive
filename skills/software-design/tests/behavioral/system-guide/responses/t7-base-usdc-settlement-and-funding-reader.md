I read the whole PDF. It is 6 pages and I opened no other file. Reading with the `pages` parameter failed because pdftoppm is not installed. Reading without `pages` worked and returned the text and images of all 6 pages. I ran no commands.

## Answers

**1. Who decides funding, and what may the product do on that party's behalf?**
- **Who decides:** the lender. "The lender decides funding" (p.4). The lender's "explicit decision to fund" is preserved (p.2).
- **How:** the lender sends USDC to that loan's funding vault from any wallet he controls, and partial transfers add up (p.2). The design also lets him pay from the payment account in his Vault, but that is "not yet verified in implementation" (p.2) and "not yet implemented or verified" (p.6).
- **What the product may do:**
  - Show the lender the verified funding vault, chain, token, loan, remaining principal, deadline and the lender's fixed settlement recipient (p.2).
  - Show the provisional balance and coordinate the finalization call (p.2).
  - Open the funding window through its opener account (p.2). The opener cannot choose funds or terms (p.5).
  - Submit permissionless calls through background jobs. The caller gains no control over amount, recipient or meaning (p.2).
- **What the product may not do:** it never holds, pools or draws lender capital. It never substitutes another lender or draws funds automatically. No other party can fund in the lender's place by gaining a role (p.2, p.4). Custody of lender capital and automatic allocation are outside the system (p.6).
- **Confidence:** high.

**2. When is a loan funded, and what does a balance mean before then?**
- **When:** funding happens only when the contract's own finalization call moves exactly the principal from the funding vault into the loan contract and emits its event (p.1, p.2). Anyone can make that call once the balance covers the principal, and it must happen within the 24-hour funding window (p.2, p.3).
- **When the system treats it as funded:** only after that event reaches Base layer-1 finality, about 20 minutes later. The loan is then "funded but not yet accepted," and a 24-hour acceptance deadline starts (p.1, p.2).
- **A balance before then:** it is provisional. "Balances are not results" (p.1), and a transfer or balance alone never advances the loan (p.3, Figure 1). Paying gives the payer no role and no refund right (p.2).
- **Leftover or unfinalized money:** excess goes only to the lender's settlement recipient (p.4). If the principal is never finalized within the window, the USDC is refundable only to the lender's fixed settlement recipient (p.3).
- **Confidence:** high.

**3. What happens to the principal if the borrower never completes acceptance?**
- If the borrower does not accept within 24 hours, the USDC is refundable, permissionlessly, only to the lender's fixed settlement recipient. The borrower's Bitcoin prefund then follows its own refund route on Bitcoin (p.3).
- Acceptance is atomic: if any part fails, nothing happens (p.3). The repayment vault is never deployed, because it is created only at acceptance (p.5).
- **Not answered:**
  - who normally triggers this refund (for the unclaimed-repayment refund the document says the application's job does, but not here);
  - whether this refund stays available indefinitely.
- **Confidence:** high on the destination; the trigger and timing are not covered.

**4. What exactly counts as a valid repayment?**
- The exact debt is sent to the loan's repayment vault before D, by the borrower or anyone else. Then a permissionless finalization call, executed on Base no later than D, moves exactly the debt and emits the repayment event (p.3, Figure 1).
- These do not count:
  - a balance that merely covers the debt (p.3);
  - a late or partial transfer, and missing D is ordinary default (p.4).
- Other systems rely on the event only after layer-1 finality (p.1). The product's guided transfer stops one hour before D with a risk warning (p.3). Excess goes only to the borrower's current refund recipient (p.4).
- **Not answered:** what the "debt" consists of (principal plus interest or fees) is never stated, only that the amounts come from the loan terms (p.2).
- **Confidence:** high on the rule; the debt amount is not covered.

**5. How long does the lender have to collect, and what follows if that time passes?**
- **The window:** the lender must claim strictly before C, which is two days after D (p.2, p.3). The lender's Vault reveals Y in the claim call, and the debt is paid once to the lender's fixed settlement recipient (p.3).
- **At C:**
  - The claim becomes permanently impossible and the borrower's refund recipient freezes (p.4).
  - At or after C, anyone can trigger a refund that pays the exact repayment once to that frozen recipient.
  - The application's background job normally submits it. If that automation fails, the refund stays available indefinitely (p.4).
- **What the refund event starts:** its final event is the only Base fact that can start "the independent validation service's fallback," for loans that have it (p.4).
- **On Bitcoin:** see Q7. The lender's Bitcoin route still matures at T, three days after D (p.2, p.4).
- **Confidence:** high.

**6. What control does the borrower have over where an uncollected repayment is returned?**
- Very limited. The refund goes to her "current refund recipient," which starts as her committed Base recipient from the terms.
- Before C she may make one switch, only to her own protocol account, signed by that account. No other address can be chosen (p.4). Her Vault signs that switch locally (p.2).
- The application shows her current recipient right before showing the repayment vault and asks her to confirm it or make the switch (p.3). At C the recipient freezes (p.4).
- Paying from a different wallet changes no recipient (p.2, p.4).
- **Not answered:** whether she can switch back after switching ("one switch" suggests not, but this is not stated).
- **Confidence:** high.

**7. What does the Base refund do for the Bitcoin collateral?**
- Nothing directly. "A Base refund does not return the Bitcoin": the borrower has the USDC back but the escrow is unchanged, and Bitcoin cannot see that she repaid (p.4). "a refund does not recover collateral" (p.5).
- The lender's Bitcoin route still matures at T, whether or not the fallback secret is published (p.4).
- For loans that have the fallback, the refund's final event can start the validation service's fallback. A published secret only gives the borrower a competing recovery transaction that must confirm first. The refund, its finality, the publication and the Bitcoin confirmation must all fit in the roughly 24 hours between C and T (p.4).
- **Not answered:**
  - what the fallback or the validation service is, or which loans have it;
  - what ultimately happens to the collateral if the lender uses route T;
  - how the borrower's long-stop route B (ten days after D, p.2) applies here.
- **Confidence:** medium-high on what is stated; the outcome is only partly covered.

**8. Who can change the main loan contract, and what does that mean for running loans?**
- **Who:** the contract sits behind an upgradeable proxy.
  - A single dedicated upgrade key is used for local and test environments and a deliberately short public beta.
  - Sole ownership then moves to a two-of-three multi-signature wallet acting through a seven-day timelock, and stays there for version 1.
  - There is no emergency upgrade key (p.5), and conversion to an immutable contract is deferred (p.6).
- **Effect on running loans:** existing loans stay on their original contract and keep their recorded terms. But an approved upgrade becomes the code for every loan that contract holds, with no per-loan legacy rules. Upgrades "must keep fixed recipients and lifecycle authority." Whoever controls upgrades could change the code holding every loan's funds, which can be economically equivalent to holding the funds (p.5).
- **Not answered:**
  - who holds the multisig keys;
  - how the "must keep fixed recipients" rule is enforced;
  - whether participants are told about, or can exit during, the timelock;
  - when the beta ends.
- **Confidence:** high.

## Confusing, unexplained or missing

**Confusing or inconsistent**
- "Vault" means two different things: the participants' browser key applications, and the per-loan funding and repayment vaults. The document flags this (p.1), but it still trips the reader.
- Two other pairs of names are never clearly told apart:
  - "payment account" and "protocol account";
  - "fixed settlement recipient," "committed Base recipient" and "refund recipient."
- Deadline wording varies. The transfer must be sent "before D," finalization happens "no later than D," and default is "by D" (p.3–4).
- "No other party can fund in the lender's place" (p.4) sits awkwardly beside "anyone can send USDC to a vault" (p.2).
- Whether v1 has an on-chain pause is an open conflict between the records (p.5–6).

**Terms used before or without explanation**
- X and Y: named on p.2 and only partly explained on p.3, never defined.
- Others never explained:
  - "secret commitments" and "terms hash" (p.2);
  - "Bitcoin prefund … qualified" (p.2);
  - "opener boundaries" (p.2, ahead of the opener itself);
  - "observation domain" (p.2), and the five domains are never named;
  - "exit packages" and "archive receipt" (p.3);
  - "independent validation service," "fallback" and "fallback secret" (p.4);
  - "workforce operator" (p.4);
  - "quarantined" (p.5);
  - "participant-transfer function" (p.5);
  - "cooperative settlement" (p.5).

**Expected but not found**
- What the debt is made of: interest, fees, or how the principal is sized.
- Whether early repayment, or a lender claim before D, is allowed.
- How default on Bitcoin plays out, and the role of B in the unclaimed case.
- Who runs, and when, the refund after an expired funding window or a missed acceptance.
- Contract state, event and error names.
- The size of the "bounded" gas the product hands out.
- Who holds the upgrade multisig keys.
- What happens if Y is revealed but the Bitcoin return fails.
