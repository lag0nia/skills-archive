I read the whole PDF and nothing else. It has only 6 pages. Reading with the `pages` parameter failed because pdftoppm is not installed, so I read the file without that parameter. That returned the text and image of all 6 pages.

## Answers

**1. Who decides whether and how the principal is funded, and what may the product do for that party?** (p. 2, also p. 1 and p. 4. Confidence: high on who decides, medium on what the product may do)
- **Who decides:** the lender. It chooses when to fund and from which wallet or treasury it controls, which can include a recoverable payment account in its Vault. Partial transfers add up.
- **What the product may do:** show the lender the verified, deployed funding vault (chain, token, loan, principal still missing, deadline, and the lender's fixed settlement recipient). It may show the provisional balance and coordinate finalization.
- **What stays with others:** the lender signs its own transfers. The contract and the Base observer decide what has happened.
- **What the product must never do:** pool capital, substitute another lender, or draw funds automatically. Custody of funds and automatic allocation of lender capital are excluded (p. 4, p. 5).
- **Not stated directly:** anyone may submit the fixed-effect "finalize funding" call, which only lets them pay the network fee (p. 2). The document does not say outright whether the product itself submits that call for the lender. "Coordinates finalization" suggests it can, but that is my inference.

**2. When is a loan funded, and what does a USDC balance at the funding address mean before then?** (p. 1, p. 2, p. 4. Confidence: high)
- **When:** the contract's named finalization step must move exactly the principal within the 24-hour funding window. Anyone may submit it once the balance reaches the principal. Funding counts only once that event reaches Base L1 finality.
- **A balance before that** is only provisional. A raw transfer, token event, vault balance, simulation, submitted transaction or unfinalized event never implies funding (p. 4).
- **Excess:** anything above the principal can only be recovered to the lender's fixed recipient.
- **Caveat:** p. 2 says the loan "is funded" as soon as the contract moves the principal. It does not repeat the finality condition from p. 1.

**3. What happens to the principal if the borrower never completes acceptance?** (p. 2, p. 3. Confidence: high for what is stated)
- The borrower has at most 24 hours from finalized funding to accept.
- If it does not, anyone may trigger the fixed refund of the principal to the lender's fixed recipient. The borrower's Bitcoin "prefund" then follows its own refund route on the Bitcoin side.
- **Not answered:** whether that refund happens without someone calling it, and what happens if nobody ever calls it.

**4. What exactly counts as a valid repayment?** (p. 2, also p. 1 and p. 4. Confidence: high on the rule, low on the amount)
- **The rule:** exactly the debt must be finalized from the repayment vault no later than the repayment deadline D, and the resulting repayment event must reach finality. Anyone may pay into the vault, and paying gives the sender no role or rights.
- **What does not count:** a sufficient balance is necessary but is not repayment in itself. Raw transfers, balances and unfinalized events never count either (p. 4).
- **Not answered:** how "the debt" is calculated (principal plus interest or fees?) and how D is set. Both are left to technical records I was not given.

**5. How long does the lender have to collect a repayment, and what follows if that time passes?** (p. 3. Confidence: high)
- **The window:** the lender must claim, by revealing Y from its Vault, strictly before the claim cutoff C. C is D plus 172,800 seconds (two days). The window is counted from D, not from when the repayment was finalized.
- **A successful claim** pays exactly the debt, once, to the lender's fixed recipient.
- **If C passes without a claim:** the lender permanently loses the claim on Base. The exact repayment then becomes refundable once, by anyone's call, to the borrower's refund recipient as it stood at C. Claim and refund exclude each other.
- **Not answered:** whether the lender can claim before D.

**6. What control does the borrower have over where an uncollected repayment is returned?** (p. 3. Confidence: high for the rule, low for the mechanics)
- **The control:** before C, the borrower may make one switch of its refund recipient. The switch is from its original Base recipient to "its own committed protocol address on Base". At C the recipient freezes.
- **Related:** late, short or excess USDC in the repayment vault also goes only to that current or frozen refund recipient.
- **Not answered:** what a "committed protocol address" is, how the switch is made, and whether anyone else could affect it.

**7. What does the return of an uncollected repayment on Base do for the borrower's Bitcoin collateral?** (p. 3, p. 4. Confidence: high that it does not itself recover the Bitcoin, low on the rest)
- **It does not recover the Bitcoin.** The Bitcoin outcome is decided separately on Bitcoin, and the Base domain must not decide or imply any Bitcoin outcome (p. 3, p. 4).
- **What it does do:** the finalized refund event is the only positive Base trigger for the "optional Bitcoin fallback".
- **What it does not stop:** the lender's timelocked Bitcoin recovery becomes valid after T (D plus 259,200 seconds, three days) and does not depend on anything on Base.
- **Not answered:** what the fallback actually does, who starts it, and how it relates to the lender's recovery after T. That gap matters, because the borrower could end up refunded in USDC while the collateral outcome is still open.

**8. Who can change the main loan contract, and what does that mean for loans already running?** (p. 4, p. 5. Confidence: high that the document leaves both points unresolved)
- **What is settled:**
  - The main contract can be upgraded through a proxy.
  - Every upgrade needs published code and a passing compatibility check, and goes through a governed, delayed route.
  - Upgrades must keep fixed recipients, lifecycle authority and each loan's originating identity.
  - The vaults themselves are immutable and have no owner.
  - A workforce operator cannot change the contract.
  - Freezing the proxy or giving up its administrator is deferred.
- **Who may upgrade (unresolved conflict, p. 5):** one record uses a single dedicated upgrade key during the short public beta, then hands sole ownership to a 2-of-3 multi-signature Safe behind a seven-day timelock. Other records say the administrator stays under the Safe and timelock, and that no unilateral key may bypass them. The records do not decide which applies during the beta.
- **Effect on running loans (open question, p. 5):** one record says a compatible upgrade becomes the single code path for every loan. Others say existing loans stay on their originating contract without silent migration, and forbid changing existing loans retroactively. It is undecided whether these fit together.
- **Also open:** whether there is any on-chain pause.

## Confusing points, terms used before they were explained, and gaps

**Confusing**
- "Vault" with a capital V (a participant's own app, holding secrets, keys and a payment account) sits right next to "funding vault" and "repayment vault" (on-chain addresses). The capital-V Vault is never defined.
- p. 1 says funding counts only at Base L1 finality, but p. 2 says the loan is funded once the contract moves the principal.
- p. 4 calls the main contract "the main contract that receives the funds", but elsewhere the vaults receive the funds.
- Repayment is due "no later than D" (inclusive), while the claim must come "strictly before C". The difference may be deliberate, but it is easy to miss.
- After a claim, the Bitcoin domain completes the borrower's "fixed recovery transaction". It is not explained that this means the collateral goes back to the borrower.
- Several records ("the selection", "the deployment state", "the upgrade boundary") are cited before or without saying what they are.

**Used before or without explanation**
- Secrets X and Y: "public X and Y" appears on p. 2 before either is introduced.
- Base observer.
- The terms domain, the observation domain, and "the five domains", which are never named.
- What "the loan qualifies on the Bitcoin side" means.
- D, whose value or how it is set is never given.
- The borrower's Bitcoin "prefund".
- "Activation pending", "package-ready active" and "recovery packages".
- "Committed protocol address".
- Where the "fixed recipients" come from.
- "Workforce operator".
- "Account allowed to open loans" and "loan-opening service".
- "Sweeping excess" and "optional Bitcoin fallback".
- "Debt", meaning what the borrower must repay, is not defined.

**Expected but missing**
- How the debt or interest is calculated, and how long a loan runs.
- What happens if the borrower never repays at all. Default is mentioned only as something that must not be implied.
- Who pays network fees in practice, and whether anything calls the refunds and sweeps on a schedule.
- What the Bitcoin fallback does, and how a Base refund and the lender's recovery after T interact.
- A timeline or diagram of the deadlines (24h + 24h, D, C, T).
- The architecture guide and the technical records the document points to were not available to me, so I could not check any of the above against them.
