How I read it: the Read call with `pages` failed because pdftoppm is not installed. The same Read call without `pages` returned the text and page images of all 11 pages, so I read the whole document. I opened nothing else and ran no commands.

## Answers

**1. Final word on whether the Bitcoin collateral moved, and on whether USDC moved**
- **Bitcoin:** Bitcoin consensus decides collateral, signatures, timelocks and "the one final Bitcoin spend". A Base record or an application status does not count (p.7 table; p.3: "Bitcoin consensus decides their outcome"). A Bitcoin step counts only after six unchanged confirmations that independent data sources agree on (p.2, p.7). When several exits compete, only the confirmed spend is the outcome (p.8–9).
- **USDC:** the Base contracts decide funding, acceptance, repayment, claim and refund, but only once the named event is L1-final. A raw transfer, a balance or a submitted transaction does not count (p.7). For funding, only the L1-final event of the separate finalization call counts (p.4).
- The Base observer only reports which events happened and how final they are. It does not create the fact (p.3, p.7).
- Confidence: high.

**2. What the company can do with a borrower's Bitcoin collateral**
- **What it is denied:** it holds no key in any collateral script (p.1). It never sells the collateral, and it is not a custodian (p.2). Bitcoin liquidation and institutional last-resort recovery are excluded (p.11).
- **What it can do:** its Bitcoin automation can only operate transactions the participants already signed. It inserts the public X into an activation variant, inserts Y into the borrower's recovery, broadcasts the borrower's refund when the conditions hold (p.5, p.8), and picks which of the six signed fee variants to use (p.2).
- **Fees:** its fee wallet can fund a separate fee-bump child transaction without changing the signed parent. It gets no choice of amount, recipient or secret (p.7). It cannot add fee to the borrower's prefund (p.4).
- **Operator powers:** operators can pause automation, request rechecks, choose an already signed fee variant and export one exact fee-bump request (p.7).
- **What it does not do:**
  - It does not broadcast default transactions automatically (p.8; excluded on p.11).
  - It cannot accept on the borrower's behalf (p.8).
  - Activating for an unresponsive borrower is excluded (p.11).
- **Caveat:** the application archives every signed package, including, as I read it, the lender's recovery variants (p.4–5). The document says the company "does not" broadcast default transactions, not that it technically cannot. The p.1 no-custody claim is "only as strong as the governance of the Base contract's upgrades". It is unclear whether that caveat covers the collateral or only lender capital.
- Confidence: high on the stated limits, medium on the archive and "cannot vs does not" nuance.

**3. Loans in progress during a full hosting-provider outage, and on return** (partly answered)
- **During the outage:** all production components share one Cloudflare failure domain. An outage can suspend the product, the Vault, the application service, observation and Bitcoin automation together, while the chains keep running.
- **On return:** the application accepts no new consequential command and claims no chain result until it is back and has reconciled both chains.
- **What is missing:** there is no live fallback provider and no stated recovery-time or recovery-point objective. Signed packages are copied hourly to locked storage outside Cloudflare. That copy is not a running service, and the newest packages may exist only in Cloudflare (p.9). The fee-bump helper runs on a separate operator machine (p.2), but its role during an outage is not stated.
- **Not covered:** the document does not say what happens to deadlines (D, C, T, B, the refund timelock) that keep running during the outage. It also does not describe the reconciliation procedure. I infer, without the document saying so, that the activation race on p.8 could get worse.
- Confidence: high on what is stated; the per-loan effects are not answered.

**4. What this version sets out to deliver, and what it does not claim**
- **The five claims (p.9):**
  1. Deterministic local verification, using disposable fixtures and failure injection only.
  2. The target outcome: a developer-run local demonstration. Two isolated participants use the real product, Vault, application service, Base contracts, observer and Bitcoin automation to complete one loan through normal repayment and confirmed borrower recovery. It is recorded as "in progress and not yet runnable".
  3. Testnet deployment: not claimed.
  4. Mainnet deployment: not claimed.
  5. Activated production operation: not claimed. Each of 3–5 needs its own credentials, funding and evidence, and production also needs an intentional enablement action.
- **Also not yet available:**
  - The validation-service fallback needs counsel approval and implementation evidence (p.9).
  - The Vault payment account's signing profile is not verified (p.9).
  - The Vault preparation step and signing against an unconfirmed prefund are not delivered (p.3–4).
- The document gives no version number. p.10 mentions an "intentionally short public mainnet beta", which sits oddly next to "mainnet deployment not claimed".
- Confidence: high.

**5. Borrower repays in full and on time, lender never collects** (p.8, also p.2, p.5, p.9)
- **USDC:**
  - At C (two days after D), the lender's Base claim is permanently disabled and the borrower's refund recipient is frozen.
  - Anyone may then trigger a refund of the exact repayment to that recipient.
  - Before C, the borrower may switch the recipient once, only to their own protocol address on Base.
- **Bitcoin:**
  - The collateral stays in escrow, because Bitcoin cannot see the repayment.
  - Recovery through S exists only for loans created after the validation service is activated, which is not yet allowed (p.9).
  - At T (one day after C), the lender's signed recovery becomes valid. The lender, or anyone who stole that signed transaction, can take the collateral even though the borrower repaid. This is recorded as one of the most important residual risks.
  - At B (ten days after D), the borrower's long-stop becomes valid without Y or S. After B both can be valid, and whichever confirms first wins.
  - None of this is evidence of default, and "nothing guarantees that the collateral returns".
  - A lender who loses Vault access ends up on the same path (p.9).
- Confidence: high.

**6. Points the design records as unresolved, and how it treats them**
- **Open conflicts (p.10, flagged inline on p.4 and p.5):**
  1. Whether the lender must approve the exact final terms again. The document says to read that step as open.
  2. What fee selection does when no signed variant is high enough. One source picks the highest variant and alerts; the action contract fails closed. "Neither is authorized."
  3. Whether the post-activation package set has twelve or eighteen packages.
- **How it treats them:** it takes no side and flags them where they arise in the loan flow. The Bitcoin domain record and the Loan Terms domain record list each side.
- **Other items marked as not delivered or residual:**
  - The undelivered or unverified items listed under question 4 (p.3, p.4, p.9).
  - No recovery-time or recovery-point objective (p.9).
  - Residual risks: the activation race and the lender taking collateral after repayment (p.8).
  - Excluded and deferred capabilities, each with its own revisit condition (p.11).
- The document does not say who resolves the conflicts or when.
- Confidence: high.

**7. How a threat must be described, and why checking each credential alone is not enough** (largely not answered)
- The document sets no required format for describing a threat. It only says security records "explain these attack paths and their controls", and it names two: a shared frontend compromise, and a Base upgrade, administrator or signer compromise (p.9, p.11).
- On the second part, the closest material is this. The records rank a malicious official frontend that captures both participants' keys during signing above "two unrelated account takeovers". They also treat compromise of upgrade governance as a system-wide risk (p.9). Separately, all components share one failure domain "despite separate projects, credentials and releases" (p.9).
- My inference, which the document does not state: a single shared component can defeat both sides at once, so protecting credentials one by one does not cover it.
- Confidence: low on "must be described", medium on the inferred "why".

**8. How every part knows it is dealing with the same loan, and what that reference does not do**
- **How:** a stable random loan identity is created at reservation (p.3). Every record, signed package, Base call, observation and Vault action names that identity plus the fingerprint of the canonical terms (p.6).
- **What the terms bind:** participants, offer and reservation, amounts, deadlines, the loan's Bitcoin keys, external Bitcoin destinations, Base addresses and fixed recipients, and the hashes of X, Y and S.
- **What a separate deployment description binds:** chain, contracts, USDC asset, Bitcoin network and timing policy.
- An artifact with the wrong loan, chain, asset, key, destination or version is rejected (p.6–7). Changing any fingerprinted field invalidates earlier approvals (p.4). The Loan Terms domain supplies the identity that every other domain checks (p.3).
- **What it does not do:** "A matching identifier proves which agreement an artifact describes; it does not authorize anything" (p.7). The Loan Terms domain decides meaning, not money movement (p.3).
- Confidence: high.

## Confusing points, early terms, and gaps

**Confusing**
- **"Vault" means three things:** the participant's browser Vault, the per-loan funding and repayment vaults on Base, and the "Vault payment account".
- **"Anyone who stole that signed transaction can take the collateral" (p.8):** p.2 says signed amounts and destinations cannot change, so it is unclear how a thief benefits.
- **The lender's exit has three names:** "lender recovery" (p.5), "default" transactions (p.3, p.8), and a transaction "the lender signed in advance" (p.1). Who must sign each exit is never explained, because the escrow script is never described.
- **Cooperative settlement:** it is listed as a fixed transaction (p.3) and as a competing exit (p.8), yet its complete operations are excluded (p.11).
- **"One exact refund event on Base" triggers S (p.2):** there are two kinds of Base refund, the lender's and the borrower's repayment refund, and the text does not say which one.
- **Timing:** it is unclear whether the ~72-hour prefund timelock and the 67-hour and 19-hour margins count from broadcast or from confirmation.
- **Mainnet beta (p.10) vs "mainnet deployment not claimed" (p.9).**

**Terms used before they are explained, or never explained**
- Explained later: upgrade governance (p.1, explained p.10), escrow (p.2), long-stop (p.3, explained p.8), T and B (first meaning on p.1, named p.8).
- Never explained: "evidence-conditioned" and the validation service's "production gate", "conditional fallback secret" (presumably S), "protocol address", "fixed recipient", "infraction count" consequences, "projections", "manifests", "Bitcoin's own consensus time", and the "operator-controlled machine".

**Expected but missing**
- The escrow script and its spending conditions.
- Collateral ratio, interest calculation and price-drop handling (liquidation is excluded).
- Fee responsibilities.
- Partial, early or over-repayment handling.
- Who broadcasts the long-stop and S-based recovery.
- Who operates the validation service.
- The named identity provider and the Bitcoin data sources.
- The effect of outages on running deadlines, and the reconciliation procedure.
- Any component or deployment diagram. The only figure is the happy-path flow on p.6.
- A version number.
- The five domain guides it refers to, which are not included.
