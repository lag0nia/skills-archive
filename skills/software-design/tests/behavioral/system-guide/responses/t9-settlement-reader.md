I read the whole PDF and nothing else. It is 5 pages. The Read tool would not take the `pages` parameter because pdftoppm (poppler) is not installed on this machine. Reading the file without that parameter returned all 5 pages as text plus page images, so no content was missed.

## Answers

**1. Who decides whether and how a loan's principal is funded, and what may the product do on that party's behalf?**
The selected lender decides. The document calls funding "the selected lender's capital decision". The lender sends one or more ordinary USDC transfers from any wallet or treasury they control, including a "recoverable Vault payment account", and partial deposits add up.
- **What the product may do:** show the lender the deployed vault, chain, asset, loan, remaining principal, deadline and the lender's fixed settlement address, all checked against the approved deployment. It shows the vault balance and the shortfall as provisional, and it "coordinates finalization".
- **What it may not do:** signing stays with the lender. The authoritative state changes belong to the contract and the observer. The product never pools capital, substitutes a lender, draws funds automatically, takes custody of lender capital or deploys it automatically.
- **Finalizing:** anyone may submit the finalize call ("permissionless"), and the caller cannot change the amount, recipient or meaning. So the product could submit it, but this is inferred, not stated as a product action.
- **Operators:** a workforce operator can only request operations whose effect is already fixed.
- Pages 2, 4 (also 3 for operators). Confidence: high on the limits. Medium on exactly what "coordinates finalization" covers, because the document does not spell it out.

**2. When is a loan funded, and what does a USDC balance at the funding address mean before then?**
A loan is funded only when the named contract action finalizes exactly the principal. That requires the funding vault to hold at least the principal before the funding deadline, which is the end of a 24-hour funding window opened after the Bitcoin collateral qualifies. Anyone may submit the finalization.
Before that, any balance is provisional: it is not funding. The document says a raw transfer, token event, vault balance, simulation, submitted transaction or observed event never counts as finalized funding. Sending tokens also gives the sender no role and no right to a refund.
After finalization, the loan is "funded but not accepted" for at most 24 hours.
Pages 1, 2, 3, 4. Confidence: high.

**3. What happens to the principal if the borrower never completes acceptance?**
If the funded loan is not accepted in time (at most 24 hours after funding), a permissionless refund returns the principal exactly once to the lender's fixed address. Anyone can trigger it.
If funding was never finalized by its deadline, a permissionless expiry instead returns whatever USDC the funding vault holds to the same lender address.
The borrower's staged Bitcoin has its own refund route in the Bitcoin domain, which this document does not describe.
Pages 2, 3. Confidence: high. The document does not say what happens to any excess above the principal in this case, beyond the general rule that excess, partial or late USDC follows fixed recovery paths (p.3).

**4. What exactly counts as a valid repayment?**
A valid repayment is the exact debt, finalized by the named contract action on the repayment vault, no later than D (the repayment deadline). Anyone may send the USDC, and the sender gains no role.
A sufficient balance is necessary but is not repayment. A raw transfer, token event, vault balance, worker completion, submitted transaction or observed event never counts. Other tokens do not count and "may remain stuck". Excess or late USDC goes to the borrower's refund address through fixed recovery paths.
Pages 1, 2, 3, 4. Confidence: high on the rule.
What the document does not say: how "the exact debt" is calculated (for example principal plus interest), or how D is set.

**5. How long does the lender have to collect a repayment, and what follows if that time passes?**
The lender must reveal secret Y strictly before C, the claim cutoff, which is exactly 2 days (172,800 seconds) after D. The claim pays the exact debt once to the lender's fixed address and makes Y public. The actual window therefore runs from the moment repayment is finalized (no later than D) until C.
If the lender does not claim before C:
- the lender permanently loses that Base claim;
- the exact unclaimed repayment becomes refundable once, by anyone, to the borrower's frozen refund address;
- that finalized refund event is the only Base trigger for a separate fallback that "might publish a secret to complete Bitcoin recovery";
- the lender's Bitcoin default route, which matures at T (D + 3 days, 259,200 seconds), stays independent.
Pages 1, 2, 3. Confidence: high.

**6. What control does the borrower have over where an uncollected repayment is returned?**
Before C, the borrower may make one irreversible switch of the repayment refund address. The only allowed switch is from the agreed Base recipient to the borrower's "committed protocol address", and that address signs the switch itself. One reason given is a concern about access to the original address.
At C the current choice freezes. No arbitrary destination is possible.
Page 3. Confidence: high. The document does not explain what the "committed protocol address" is.

**7. What does the return of an uncollected repayment on Base do for the borrower's Bitcoin collateral?**
Not directly anything. The document states that a Base refund does not mean Bitcoin recovery. The finalized refund event is only the trigger for a separate fallback that might publish a secret to complete Bitcoin recovery. Lender silence, a missing secret, elapsed time or raw token activity do not trigger it. The lender's Bitcoin default route after T stays independent.
Page 3 (also p.1 on the contract being unable to sign, broadcast or confirm Bitcoin transactions). Confidence: medium. The answer is only partial. The document does not explain:
- who runs the fallback;
- which secret it publishes, or why it only "might";
- whether the borrower is assured of recovering the collateral;
- what happens if the fallback has not finished by T, when the lender's default route matures (only 1 day after C).

**8. Who can change the main loan contract, and what does that mean for loans already running?**
The vaults cannot be changed: they are immutable and ownerless. The main contract can be upgraded.
- **Who controls upgrades:** during local and test use and a short public beta on the main network, a single dedicated upgrade key. After the beta, sole ownership moves to a two-of-three Safe acting through a seven-day timelock.
- **Conditions:** proposed code must be public and pass an automated compatibility check before an upgrade is scheduled. The administrator is not renounced in this version. A lost or compromised funding-window opener is replaced through the same delayed upgrade path.
- **Consequence the document draws:** the claim that the organization cannot redirect Base funds is "only as strong as" the upgrade administration.
- **Product pause:** an incident pause in the product does not block direct contract calls, so funding, repayment, refund and claim stay available for existing loans.

The effect of an upgrade on running loans is explicitly unresolved. One record says a compatible upgrade becomes the single code path for every loan held by the proxy, with loan data kept compatible. Other records say existing loans stay on their originating contract and must not be migrated or reinterpreted. No record says whether a code-path change counts as reinterpreting a loan.
Two more points are also left open: whether the beta key counts as the ruled-out "unrestricted unilateral upgrade key", and whether an on-chain pause role exists.
Pages 4, 5. Confidence: high on who controls upgrades. Low on the effect on existing loans, because the document itself says this is open.

## Confusing points, terms used before explained, and gaps

**Terms used before they are explained (or never explained):**
- **Secrets X and Y:** first appear on p.1–2 ("revealing the secret X", "reveal Y") without saying who creates or holds them, or how they connect to the Bitcoin transactions. Page 1 says only that "a secret" made public can make a signed Bitcoin transaction usable.
- **"Vault" with a capital V** ("the borrower's Vault", "Vault payment account", "recoverable Vault payment account"): easy to confuse with the funding and repayment vaults. It is never defined.
- **Other undefined terms:**
  - "observation domain" and "qualifies";
  - "the observer";
  - "application's dedicated opener" / "funding-window opener";
  - "committed protocol address" and "agreed Base recipient";
  - "staged Bitcoin";
  - "exit transactions for the confirmed escrow";
  - "the separately scoped transfer";
  - "proxy" (it appears only in the open-question section).
- **The five domains:** mentioned, but only some are named (loan-terms, observation, Bitcoin), and it is unclear which ones those are.

**Confusing points:**
- **Bitcoin timeline:** the lender's Bitcoin default route matures at T even when the borrower has repaid. How this interacts with the borrower's recovery transaction and the fallback between C and T is not explained.
- **Design-process language:** "the user chose…, the agent recommended…" (p.4) reads like a record of the design process, not a description of the system.
- **Records that disagree:** the document cites several by name (governance selection, upgrade boundary, deployment state), and they contradict each other on the pause role and on upgrades.

**Expected but not found:**
- how the debt amount (interest, fees) and the deadline D are set;
- what happens to excess USDC above the principal when funding is finalized;
- whether repayment can arrive in several partial transfers (stated only for funding);
- when the beta ends and the move to the Safe happens;
- who holds the Safe keys;
- the full list of contract states and error names;
- what a loan participant sees or can do if an upgrade is scheduled during their loan.
