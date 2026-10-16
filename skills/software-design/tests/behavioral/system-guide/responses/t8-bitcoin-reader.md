**Answers from "Bitcoin Authorization And Recovery" (domain guide, 7 pages)**

How I read it: the PDF has 7 pages. Reading with the `pages` parameter failed because the PDF page renderer (pdftoppm) isn't installed. A single Read call without `pages` returned the full text and page images of all 7 pages. I opened no other file and ran no commands.

---

**1. Staged collateral vs active collateral, and what each permits** (pp. 1, 3, 4, 5; confidence high, with one caveat)

Caveat: the document never uses the phrases "staged collateral" or "active collateral". It uses **prefund** (a "staging output") and **escrow**. I am treating these as the two you mean.

- **Prefund (staged):**
  - The borrower sends Bitcoin to a staging output after the terms commit.
  - It permits two spends:
    - a refund that the borrower alone can make after a relative timelock of 507 × 512 seconds (about 72 hours after the prefund confirms);
    - the pre-signed activation, which is completed with X.
  - It qualifies the loan for Base funding only after all of these:
    - six unchanged confirmations;
    - fresh agreement between independent data sources;
    - a recorded package receipt;
    - at least 67 hours left before the refund becomes valid.
  - "Zero confirmations is never collateral proof."
- **Escrow (active):**
  - This is a different output, created by the activation transaction.
  - It exists only once that transaction and its escrow output reach six confirmations.
  - It permits four competing exits: borrower recovery, lender recovery, borrower long-stop and cooperative settlement.
- The company holds no key in either script (p. 2).
- Gap: the document says that after X is public the loan is "activation pending, not active" (p. 5). It strongly implies, but never states, that the loan becomes "active" when the escrow reaches six confirmations.

**2. Signed before the lender funds vs only afterward** (pp. 3, 4, 5; confidence high on lists, medium on exact funding timing)

- **Before funding — the "initial set":**
  - 6 activation variants and 6 refund variants.
  - The borrower signs all twelve. The lender adds its signature to the six activation variants.
  - They are archived, and a receipt is recorded, before the prefund can qualify for Base funding. Figure 1 says "signed and archived before funding".
  - X is not a signature. It is inserted into one activation variant later.
- **Afterward — 18 exit packages, built only once one activation has six confirmations:**
  - 6 borrower recovery and 6 borrower long-stop variants, signed by the borrower;
  - 6 lender recovery variants, signed by the lender.
- Also afterward, signed fresh when needed:
  - any cooperative settlement, signed by both;
  - any fee-bump child, signed by the company's node.
- Caveats:
  - One responsibility record still says the exit set is twelve packages. This is recorded as an open discrepancy (p. 4).
  - Signing against an unconfirmed prefund is "a recent clarification" whose implementation has not been delivered (p. 3).
  - The document never says exactly when on Base the lender's USDC moves. "Paid principal" on p. 5 implies it has been paid by the time activation is pending.

**3. X disclosed and USDC received, activation not yet confirmed** (pp. 3, 5; confidence high)

- **Status:** "activation pending, not active".
- **What the automation does:**
  - It rebroadcasts the same selected activation until its escrow confirms.
  - Before any mempool accepts it, it may escalate to a higher signed variant. After acceptance, only a separately approved fee-bump child can add fee.
- **Main risk:**
  - The borrower's signed refund stays valid on Bitcoin. The automation never broadcasts it once X was accepted, but it is still a valid transaction.
  - If the refund matures and confirms first, "the lender's principal is unsecured". This is recorded as a residual lender risk.
- **Second possibility:** a different signed activation variant may confirm instead. That one becomes the only parent, and exit packages are built for it.
- **No exits yet:** exit packages do not exist in this window.
- **Not stated:** the document does not explicitly say the borrower receives USDC at acceptance.

**4. Return after normal repayment vs the independent fallback** (pp. 2, 3, 4, 5, 7; confidence high on mechanics, low on what triggers S)

- **Normal path:**
  - The lender claims repayment on Base, which makes Y public and final.
  - The automation fills Y into the borrower's already-signed recovery transaction, picks a fee variant and broadcasts it.
  - The Bitcoin returns to the destination fixed in the terms when that spend confirms. No new signature is needed.
- **Fallback path:**
  - An independent validation service publishes secret S "after one exact Base refund".
  - S completes the same recovery transaction, to the same destination. There is no second transaction family, no new borrower signature and no service key.
- **Differences:**
  - the trigger (S from the service instead of Y from the lender);
  - S works only for loans created after the capability was activated (p. 2), which p. 7 calls "after its production gate".
- **Not explained:** what a "Base refund" is, or who triggers it.

**5. Time-based routes if neither Y nor S ever appears** (pp. 2, 4, 5, 7; confidence high)

- **Lender recovery:**
  - Becomes valid at T, which is 3 days after the repayment deadline D.
  - Signed by the lender. The lender exports it and sends it manually; the company never broadcasts it.
- **Borrower long-stop:**
  - Becomes valid at B, which is 10 days after D.
  - Signed by the borrower, needs no secret, and is relayed on the borrower's request.
- Both times are measured against Bitcoin consensus median time, not an application clock.
- **How a clash is settled:**
  - After B both routes can be valid, and the long-stop does not cancel the lender route.
  - Whichever confirms first on Bitcoin wins, because they spend the same output. The domain then classifies which spend won.
- **Not time-based:** cooperative settlement is also possible.
- **Residual risk (p. 7):** if repayment was valid but Y is missing, the lender, or a thief holding the lender's signed transaction, can take the collateral at T, before B.

**6. Confirmations given when disclosing a secret on Base** (pp. 2, 3; confidence low — mostly not answered)

- The document says only that the borrower "performs the two-step acceptance that reveals X on Base", and that the lender reveals Y to claim repayment.
- It does not describe the two steps, any confirmations the participant gives, or what each one allows.
- The "six confirmations" elsewhere in the document are Bitcoin block confirmations, not participant confirmations.

**7. Fee choice for a pre-signed transaction, and what is unsettled** (pp. 2, 5, 6, 7; confidence high)

- **Variants:** each family has six fee variants: 10, 20, 50, 100, 150 and 200 sat/vB. Each also has a pay-to-anchor output so a separately funded child can add fee (child-pays-for-parent).
- **Rule:** pick the lowest signed variant strictly above the current fee estimate plus 25 percent.
- **Raising the fee:**
  - A refund may move only to an already-signed higher refund variant.
  - Once an activation or exit transaction is in a mempool, only a fee-bump child can add fee.
  - For those, and for a refund with no suitable signed replacement left, an authorized operator exports one exact fee-bump request.
  - A separate helper builds the unsigned child from the company's dedicated fee wallet, and the company's manually unlocked node signs and broadcasts it.
  - The fee wallet gains no participant authority.
- **Unsettled:** what to do when no signed variant is high enough.
  - One source says: use the 200 sat/vB variant, record that a fee-bump is needed, and alert.
  - The fee-selection action contract says: return a fail-closed result.
  - The guide leaves this open.

**8. A forgotten Vault password** (pp. 2, 5, 6, 7; confidence high)

- Nobody can recover it, and stronger password recovery is deferred and outside this design. A participant who loses access "is not rescued by the company".
- **What it blocks:** revealing a secret, signing anything new, and cooperative settlement.
- **What still works:** packages that are already fully signed stay valid.
- **Accepted residual risk:** if the password is lost between activation and exit signing, that participant cannot sign their own exit routes.
- **Gap:** the seed is backed up as a twelve-word phrase, but the document doesn't say whether that phrase can restore the Vault under a new password.
- **Gap:** it doesn't say whether exporting the lender recovery transaction needs the password.

---

**Confusing points, terms used before they were explained, and gaps**

- **Terms never explained:**
  - "Base" (used from p. 1);
  - "committed terms" / "terms commit";
  - "the automation" (who runs it);
  - "manifest";
  - "dedicated Vault origin";
  - "independent sources" (which ones);
  - "consensus median time";
  - "terminal signatures";
  - "package-ready";
  - "exact Base refund" (the trigger for S);
  - "validation service" (what it validates);
  - who "separately approves" a fee-bump.
- **"Vault" is used before it is explained:** it first appears on p. 2 and is explained in a later paragraph.
- **Naming mismatches:**
  - p. 2 says S applies once "the capability is activated", while p. 7 says "after its production gate".
  - p. 7 refers to "the missing-secret residual risk", but the invariant is named "Missing Y Residual Lender Risk".
  - That name reads as a risk to the lender, but it describes the borrower losing collateral.
- **Mild contradiction:** p. 3 says the automation "keeps pushing that same transaction", while p. 5 allows escalating to a higher variant before mempool acceptance.
- **Internal discrepancy:** one record says the exit set is 12 packages, others say 18. The document flags this as open.
- **Mixed status:** the document mixes design with delivered state. Preparing destinations and the hash of X, and signing against an unconfirmed prefund, are both not yet delivered.
- **Expected but missing:**
  - the Base-side loan flow: when and how the lender funds and when the borrower receives USDC;
  - details of the two-step acceptance;
  - the escrow script structure and how X and Y unlock their branches;
  - where lender recovery and the long-stop send funds;
  - collateral amounts and who bears the pre-signed fees;
  - how D on Base becomes a Bitcoin timelock;
  - how "final" is decided for Base facts;
  - any treatment of collateral price drops or liquidation (only that the domain must not liquidate);
  - why refunds can be replaced in the mempool but activations and exits cannot.
