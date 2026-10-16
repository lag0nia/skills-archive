I read the whole PDF and nothing else. Reading with the `pages` parameter failed because pdftoppm is not installed. Reading without it worked: the file is only 6 pages, and all 6 came back with their text. Page numbers below are the PDF's own (Page X of 6).

## Answers

**1. Who decides whether and how the principal is funded, and what may the product do for that party?**
- **Who decides:** the selected lender. The document calls this "the selected lender's capital decision". The lender decides when and how to transfer, from any wallet or treasury it controls, in one transfer or several (p.2).
- **What the product may do:** the application shows the lender the verified funding vault, chain, asset, loan, remaining principal, deadline and the lender's fixed settlement recipient. It also handles the balance display and the finalization call, which anyone may submit (p.2).
- **What the product may not do:**
  - Signing stays with the lender (p.2).
  - It never pools capital, puts another lender in this one's place, or draws funds automatically (p.2).
  - No payer, opener, operator or the company may choose a recipient or amount, hold lender capital, pool it or deploy it automatically (p.5).
- **One nuance:** the company's opener decides when the funding window opens (p.2, step 1).
- **Two gaps:**
  - "Whether" to fund is implied by "capital decision", but the document never states it outright.
  - The vault accepts USDC from anyone (p.1), so how "the lender decides" fits with third-party payments is not explained.
- Confidence: high on what the product may and may not do; medium on "whether".

**2. When is a loan funded, and what does a USDC balance at the funding address mean before then?**
- **When it is funded:** a transfer into the vault is only provisional. The loan counts as funded only when a separate finalization call moves exactly the principal into the loan and that call's named event becomes final (p.1, p.2 step 2). Finality is judged by Base Observation And Fallback Review, not by this domain (p.2, p.5).
- **Timing:** finalization has to happen before the 24-hour funding deadline. It also starts a 24-hour acceptance deadline counted from its own Base block (p.2).
- **What a balance means before then:**
  - It is not funding. The domain must not treat a transfer, a balance or a submitted transaction as funding (p.5).
  - Partial transfers add up (p.2). Sending tokens gives the sender no role, no say over recipients and no refund right (p.1).
  - If the deadline passes without finalized funding, anyone may trigger a refund, which can only pay the lender's fixed settlement recipient. Excess or late USDC is swept to the same recipient (p.4).
- **Not covered:** what counts as "final" on Base, and whether the lender can pull back a partial transfer before the deadline.
- Confidence: high.

**3. What happens to the principal if the borrower never completes acceptance?**
- It goes back "the same way" to the lender's fixed recipient (p.4). Reading this alongside the bullet just before it, that means anyone may trigger the refund and it can only pay that recipient.
- The borrower's Bitcoin prefund has its own Bitcoin refund path (p.4).
- **Partly unclear:** p.4 says acceptance must happen "within its lifetime" but never defines that. Page 2 gives two conditions: funding no older than 24 hours, and at least 19 hours left before the Bitcoin prefund refund. The document never says the lifetime is whichever of these runs out first.
- Confidence: high on where the money goes; medium on who triggers the refund and exactly when.

**4. What exactly counts as a valid repayment?**
- The valid repayment is the finalized repayment event: the exact debt must be finalized no later than the repayment deadline D. Anyone may pay into the repayment vault. A sufficient balance is necessary but is not itself repayment (p.3 step 4, p.1).
- The domain must not treat a transfer, balance or submitted transaction as repayment (p.5).
- The guided repayment flow closes one hour before D. Direct transfers after that "may be returned rather than counted" (p.3).
- Without exact debt finalized by D, the loan is an "ordinary default for product purposes" (p.4).
- **Not covered:**
  - How the debt is calculated (principal plus interest?) or how D is set.
  - Whether "finalized no later than D" means the call's block time or Base finality by D.
- Confidence: high on the rule; low on these details.

**5. How long does the lender have to collect a repayment, and what follows if that time passes?**
- **The window:** the lender (bound to the loan and freshly signed in) must reveal Y through its Vault strictly before the claim cutoff C, which is D + 172,800 seconds (two days) (p.3 step 5). The real window therefore runs from repayment finalization until C, so it is at least about two days. The document does not put it that way.
- **What happens at C:**
  - The claim is permanently disabled and the borrower's refund recipient freezes (p.5).
  - At or after C, anyone may trigger a one-time refund of the exact repayment to that frozen recipient. Delayed automation never makes this right expire (p.5, Figure 1 on p.4).
  - The finalized refund event is the only positive trigger for the "conditional Bitcoin fallback" (p.5).
  - The lender's Bitcoin recovery matures at T, three days after D, independently of the refund (p.4, p.5).
- **Not covered:** what happens if a claim is submitted before C but is not final yet.
- Confidence: high.

**6. What control does the borrower have over where an uncollected repayment is returned?**
- Very little. Before C, the borrower may switch the refund recipient once, and only to the borrower's own protocol address. At C the recipient freezes (p.5).
- Recipients come from the approved terms and contract state, never from who paid (p.1). Expired partial or late repayment funds can only go to the borrower's current or frozen refund recipient (p.4).
- **Not covered:** what the original refund recipient is, how the switch is made (which call, and signed where), and why only the protocol address is allowed.
- Confidence: high on the rule; low on these details.

**7. What does returning an uncollected repayment on Base do for the borrower's Bitcoin collateral?**
- It does not recover the collateral. The USDC goes back to the borrower on Base, but the collateral stays in Bitcoin escrow. Whether it comes back depends on the routes in the separate Bitcoin Authorization And Recovery guide, and for many loans that "remains a recorded residual risk" (p.5 box).
- The finalized refund event is the only positive trigger for a "conditional Bitcoin fallback". The Base refund does not imply Bitcoin recovery, and the lender's Bitcoin recovery maturing at T stays independent of it (p.5; T = D + 3 days, p.4).
- **What I infer but the document does not state:** Y is never revealed in this case, so the normal route (Bitcoin automation uses Y to complete the borrower's recovery transaction, p.3 step 6) is not available. The lender's recovery path could also become valid at T even though the borrower repaid.
- The document does not explain what the fallback actually does, or whether it can complete before T.
- Confidence: high that it does not recover the collateral; low on what does.

**8. Who can change the main loan contract, and what does that mean for loans already running?**
- **Who:** the contract is upgradeable through a proxy with one ownership path (p.5).
  - A single dedicated upgrade key covers local and test use and the "intentionally short" public mainnet beta.
  - After that, the same sole ownership moves to a two-of-three multisig behind a seven-day public timelock for the rest of the first version.
  - Every upgrade needs public notice and compatibility evidence.
  - Operators cannot edit what the contract means (p.5).
  - The funding and repayment vaults are immutable (p.1).
- **Effect on running loans:** each loan stays with the deployment where it started and is never moved, but an approved upgrade changes the code for every loan in that deployment (p.6).
  - There is no on-chain pause, and direct valid exits stay available while the application or opener is shut down (p.6).
  - Compromised upgrade governance could affect every loan in a deployment. Converting to an immutable contract is deferred (p.6).
- **Not covered:**
  - Who holds the key or the multisig seats.
  - How long the beta lasts.
  - Whether there is any timelock during the beta.
  - What "compatibility evidence" means.
  - Whether running loans can exit before an upgrade takes effect.
- Confidence: high.

## Confusing points, terms used before they were explained, and missing content

**Terms used before they were explained, or never explained:**
- **X and Y:** introduced only as "hashes of the two participant secrets" (p.1). That X belongs to the borrower and Y to the lender has to be inferred from pp.2–3. Which Bitcoin transaction X unlocks is never stated.
- **Bitcoin terms:** "prefund", "qualified" and "six unchanged prefund confirmations" (p.2) are never defined.
- **Later explanations:** "the company's opener" and "the observer" appear on p.2 but are only explained later. Figure 1's "frozen borrower recipient" (p.4) comes before the freeze is explained on p.5.
- **Other undefined terms:** D, C and T (how D is set), "debt", "protocol address", "Vault payment account", "freshly signed in", "conditional Bitcoin fallback", and the consequences of an "ordinary default".

**Confusing:**
- **"Vault":** "Vault" (participants' key-holding apps) and "funding/repayment vault" (contracts) use the same word for different things.
- **"Finalized":** used both for the finalization call and for chain finality ("once final").
- **Recipient names:** "fixed recipient", "fixed settlement recipient", "refund recipient" and "current or frozen refund recipient" are never clearly told apart.
- **The 0.001 ether stipend ceiling (p.3):** "Above a fixed ceiling… after its safety margin" is ambiguous.
- **The 67-hour and 19-hour margins:** not explained.
- **"Delayed automation never expires that right":** awkward wording.
- **Quarantined records:** what happens to the funds of a quarantined opened record is not said.

**Expected but not found:**
- Interest and debt calculation, and the loan term.
- What counts as Base finality.
- Event, call and error names.
- Whether the lender can cancel a partial funding.
- Edge cases for a claim pending at C.
- What the lender actually receives through Bitcoin recovery on default.
- Who holds upgrade authority, and how long the beta lasts.
- What the conditional Bitcoin fallback does.

File read: /private/tmp/claude-501/-Users-alanguerrero-Documents-ai-prompts/b72a9647-f430-4577-b73d-46cf594be5b3/scratchpad/eval/t8-pdf/bitcoin-backed-usdc-one-loan-system-base-usdc-settlement-and-funding.pdf
