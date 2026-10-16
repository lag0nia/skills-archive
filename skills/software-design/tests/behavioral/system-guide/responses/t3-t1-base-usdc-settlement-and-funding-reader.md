Note on method: reading with the `pages` parameter failed because pdftoppm is not installed. A plain Read of the file worked and returned the whole document, which is only 6 pages ("Base USDC Settlement And Funding", a domain guide generated 15 October 2026). Page 6 is just a list of other guides and records. I opened nothing else and ran no commands.

## Answers

**1. Who decides whether and how the principal is funded, and what may the product do on that party's behalf?**
- **Who decides:** the lender. The product shows the lender the verified funding vault, chain, asset, loan, remaining principal, deadline and the lender's own fixed settlement recipient. It "leaves the decision and the signing to the lender" (p2).
- **How it is funded:** the lender, "by its own explicit decision," sends USDC from any wallet or treasury it controls, including an optional Vault payment account. Partial deposits add up (p3).
- **What the product may not do:** it never pools capital, substitutes a lender or draws funds automatically (p2). The domain must not hold, pool, allocate or substitute lender capital (p4). Automatic capital deployment and organization custody are excluded from version 1 (p5).
- **What the product may do:** a dedicated opener opens the funding window once the collateral qualifies (p2–3). Anyone, including the organization, may finalize the amount and pay the network fee, but gains no control over amount or recipient (p2).
- **Partial answer:** the document mostly lists what the product may not do. It never clearly lists what it may do for the lender beyond showing information and finalizing. It does not say who runs the "Vault payment account" or whether the product can send from it on the lender's instruction. It also does not explain how the "selected lender" is chosen.
- **Pages:** 2, 3, 4, 5. **Confidence:** high that the lender decides; medium on the full list of what the product may do.

**2. When is a loan funded, and what does a USDC balance at the funding address mean before then?**
- **When it is funded:** someone (anyone) calls the main contract to finalize exactly the principal, while the balance covers the principal and before the funding deadline. That call records a 24-hour acceptance deadline (p3). The rest of the system acts on the call only once its "funding finalized" event reaches finality (p1, p3).
- **What a balance means before then:** it is provisional and is not proof (p1, Figure 1 on p2, p3). Sending it gives the sender no role, no say over recipients and no refund right (p1).
- **If funding is never finalized:** anyone may mark the attempt expired and return the vault balance to the lender's fixed settlement recipient (p3). Any excess is swept to the same place (p3).
- **Unclear:** "funded" could mean the moment of the finalize call or the moment its event reaches finality. What finality means is left to another domain.
- **Pages:** 1, 2, 3. **Confidence:** high.

**3. What happens to the principal if the borrower never completes acceptance?**
- If funding was finalized but the 24-hour acceptance deadline passes, anyone may return the principal, once, to the lender's fixed settlement recipient (p3).
- The borrower's prefunded Bitcoin follows its own refund route in the Bitcoin domain, which this document does not describe (p3).
- **Not stated:** whether the return happens automatically or someone must call it, and who is expected to call it ("anyone may"). It also does not say where the principal sits between finalization and acceptance.
- **Pages:** 3. **Confidence:** high on the rule; the mechanics are not covered.

**4. What exactly counts as a valid repayment?**
- **Sending:** anyone sends USDC to the loan's repayment vault (p3). The payer gets no role (p1, p3).
- **Finalizing:** the exact debt must then be finalized on the main contract no later than the repayment deadline D. "A sufficient balance is necessary but is not itself repayment" (p3).
- **Proof:** the named "repaid" event at finality (p3).
- **If finalization misses D:** there is no valid repayment, "whatever balance arrives later" (p4). A sweep does not cure a missed repayment (p3).
- **Not stated:** how the debt is calculated (interest, fees), how D is set (only that deadlines come from the committed terms, p1–2), and whether finalizing exactly at D counts. "No later than" suggests it does, while the claim cutoff C is explicitly "strictly before."
- **Pages:** 1, 3, 4. **Confidence:** high on the rule; the debt amount and how D is set are not covered.

**5. How long does the lender have to collect, and what follows if that time passes?**
- **The window:** the lender claims by revealing Y "strictly before" the claim cutoff C, which is D plus 172,800 seconds (two days) (p3). That gives at least two days after D, and more if repayment was finalized early.
- **At C:**
  - The claim becomes permanently impossible.
  - The borrower's refund recipient freezes.
  - From C on, anyone may refund the exact unclaimed repayment, once, to that frozen recipient. Claim and refund exclude each other (p4).
- **After the refund:** the finalized refund event is the only Base fact that can trigger an optional fallback in which an independent service publishes a secret for the Bitcoin recovery (p4).
- **Pages:** 3, 4. **Confidence:** high.

**6. What control does the borrower have over where an uncollected repayment is returned?**
- Very little. Before C, the borrower may switch its refund recipient once, from its committed Base recipient to its own committed protocol account (p4).
- Only the borrower's committed protocol account can make that call (p2). The system may send a bounded ether stipend to cover its fee (p2).
- At C the recipient freezes (p4). There is "no arbitrary destination" (p3). The same current-then-frozen recipient also receives leftover repayment-vault sweeps (p3).
- **Not stated:** why a borrower would switch, whether it can be undone (the word "once" suggests not), and how the "committed Base recipient" relates to the "borrower's fixed recipient" that received the principal.
- **Pages:** 2, 3, 4. **Confidence:** high.

**7. What does the Base refund of an uncollected repayment do for the borrower's Bitcoin collateral?**
- Directly, nothing: "the refund itself returns only the USDC," and a Base refund "is not a Bitcoin recovery" (p4). The contract cannot sign, broadcast or confirm anything on Bitcoin (p1, p4).
- Its only Bitcoin relevance is that its finalized event is the sole Base fact that can trigger the optional fallback, where an independent service publishes a secret for the Bitcoin recovery (p4).
- That fallback applies only to loans created after the service's production activation, "with its commitment in place" (p4).
- **Not answered:**
  - What happens to the collateral of loans the fallback does not cover.
  - Which secret the service publishes, and who runs the service.
  - How the lender's pre-signed timelock route on Bitcoin (valid after D plus three days, p4) interacts with a repaid-but-unclaimed loan. C is only D plus two days, so this matters, and I could not tell from the document.
- **Pages:** 1, 4. **Confidence:** high that the refund itself does nothing for the collateral; low on what actually happens to it.

**8. Who can change the main loan contract, and what does that mean for loans already running?**
- **Who:** the contract sits behind an upgradeable proxy with one ownership path (p5).
  - During local and test use and the "intentionally short" public mainnet beta, a single upgrade key controls it.
  - For the rest of version 1, a two-of-three multi-signature Safe controls it, acting through a seven-day timelock.
  - Every upgrade is published and checked for compatibility first.
- **Effect on running loans:** existing loans are never migrated to another contract, but "an approved upgrade becomes the code path for every loan the proxy holds." So running loans are affected (p5).
- **Opener:** replacing a lost or compromised opener goes through the same upgrade path (p5).
- **No on-chain pause:** in an incident the organization can stop its frontend, API and opener, but direct contract calls, including every exit, stay available (p5). Operators cannot edit the contract's meaning (p4).
- **Caveats:**
  - The document flags open discrepancies. Some records describe only the Safe and timelock, with no single-key beta period. One record mentions pause and operational roles and a "paused for new or risky action" state, without saying whether it is on-chain (p5).
  - It does not say who holds the beta key, who the Safe signers are, how long the beta lasts, whether beta upgrades have any delay, or whether an upgrade could alter a running loan's amounts, recipients or deadlines.
- **Pages:** 4, 5. **Confidence:** medium, because of the stated discrepancies.

## Confusing points, terms used before they were explained, and missing material

**Confusing**
- **"Vault" has three meanings.** "Vault" is the participant's signing environment (p2). "Funding vault" and "repayment vault" are per-loan contracts (p1). There is also a "Vault payment account" (p3–4).
- **Recipient terms overlap without a defined relationship:** fixed recipient, fixed settlement recipient, committed Base recipient, refund recipient, and protocol account (also called committed or term-bound).
- **One sentence seems to clash with "no arbitrary destination" (p3):** the "narrow capability to send configured USDC to a recipient of the participant's choice" (p4).
- **The X/Y discrepancy (p5) leaves a puzzle:** a confirmed on-chain call that is "not a valid protocol transition." The document does not say what the system does in that case.
- **It is unclear whether 24 hours is a rule.** The 24-hour funding window appears only in the "illustrative" Figure 1, while the 24-hour acceptance deadline is stated as a rule.

**Terms used before (or without) explanation**
- Secrets X and Y (p1). Their Bitcoin role is never fully explained.
- "Finality" (p1).
- "The opener" (p2). Its nature is only hinted at on p5.
- "Protocol account" (p2).
- Collateral that "qualifies," and "prefunded" collateral (p2–3).
- "Selected lender" (p2).
- "Sweeping" (p2, explained on p3).
- "Activation pending" (p3).
- "Workforce operator" (p4).
- "Independent service" and "its commitment" (p4).
- "Safe" (p5).
- Records the reader cannot see: the participant-call contract, deployment state record, upgrade invariant and opener constraint (p5).

**Expected but missing**
- How the debt, interest and fees are calculated, and how D is set.
- The stipend amount and the "unusually high" fee threshold.
- The length of the beta.
- A list or diagram of the loan states, and the full set of event names. Only four are named, plus the refund event.
- What finality concretely means.
- What happens to the Bitcoin collateral on default, or when the lender never claims.
- A glossary.
