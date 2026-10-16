**Answers from the Bitcoin Authorization And Recovery guide (7 pages)**

How I read it: the Read tool failed whenever I used the `pages` parameter, because `pdftoppm` is not installed. The PDF has only 7 pages, so I read it in a single Read call without `pages` and got every page. I opened no other file and ran no commands.

---

### 1. Staged collateral vs active collateral
The document never uses the words "staged collateral" or "active collateral." The closest terms are the **prefund**, which it also calls the "staging script" or "prefund address", and the **escrow**. My mapping of your terms onto these two is my own inference.

- **Prefund (staged):**
  - The borrower sends Bitcoin to it after the terms are committed. It holds the collateral plus a fee reserve.
  - The system may build and sign the initial packages against it before it confirms.
  - It needs six unchanged confirmations, agreed by two sources, before the funding window opens or anything else relies on it.
  - It can be spent two ways:
    - by an activation, which needs X, into the escrow; or
    - by the borrower's refund, after a relative timelock of 259,584 s (about 3 days), if the loan never activates and no X has been accepted.
  - Pages 1, 3, 5.
- **Escrow (active):**
  - The activation creates it. It is "the collateral output on which every later route depends."
  - Any unused reserve goes back to the borrower's committed destination at activation.
  - It permits four routes:
    - normal recovery, with Y or S;
    - the lender timelock, after T;
    - the borrower long-stop, after B;
    - cooperative settlement, freshly signed by both.
  - The loan is shown as active only after the 18 exit packages are stored and receipted.
  - Pages 1, 3, 4.

Confidence: high for what each one permits, medium for the mapping of terms.

### 2. Signed before the lender funds vs only afterward
The document never describes the lender's funding step directly. It only says "the funding window opens only after the prefund qualifies on Bitcoin" (p.2, p.3).

- **Before (by inference):** the 12 initial packages, which are 6 activation candidates and 6 prefund refunds.
  - The borrower signs all 12. The lender verifies and signs the 6 activations.
  - Each carries a 240-sat pay-to-anchor (P2A) output, so its fee can be raised later.
  - This can start before the prefund confirms (p.3).
  - X is inserted into the chosen activation only later, after acceptance; that is not a new signature.
- **Only afterward:** the 18 exit packages. They are built only for the escrow that actually confirmed, after the activation has six confirmations (p.3):
  - 6 normal-recovery variants and 6 long-stop variants, signed by the borrower;
  - 6 lender-timelock variants, signed by the lender.
- **Also afterward:** cooperative settlement, freshly signed by both (p.4, p.7), and any CPFP child transaction built when it is needed (p.4).

Gap: the document never says the initial set must be complete and stored before funding. That placement comes from the order in Figure 1 (p.3).

Confidence: high for the package sets, medium-low for "before the lender funds".

### 3. X disclosed and USDC received, but activation not yet confirmed
- **Status:** "activation pending" until one activation has six confirmations (p.3). The document says X becomes public when the borrower "accepts the funded loan on Base" (p.2). It does not explicitly say the USDC is received at that moment.
- **Rules and risks:**
  - If activation stalls after X is public, the system must keep operating the same selected activation. It cannot refund the prefund or build an unapproved replacement (p.5). Fee help after mempool acceptance comes only from a CPFP child (p.4).
  - A different pre-signed activation might confirm instead. That winner then becomes the escrow (p.3).
  - A source conflict or outage is treated as critical at once after acceptance (p.5).
  - A reorganization that changes or loses the parent invalidates every descendant, which must then be rebuilt and re-signed (p.5).
- **Not answered:**
  - The document never states who bears the economic risk in this window.
  - It never says whether the borrower's pre-signed refund, valid after about 3 days, could race the stalled activation.

Confidence: high for the status, medium for the risk.

### 4. Bitcoin returned after normal repayment vs the independent fallback
- **Normal repayment:**
  - The lender claims the repayment on Base, which makes Y public.
  - Once the claim is final, the system picks a fee level, adds Y to the borrower's pre-signed normal-recovery transaction and broadcasts it.
  - The collateral is returned when that spend confirms, to the borrower's committed destination.
  - No fresh borrower signature, output change or new destination is involved (p.3, p.4).
- **Independent fallback (secret S):**
  - S completes the same recovery transaction as Y.
  - It applies only to a loan created after the independent validation service's production activation, with the hash of S committed in advance.
  - The service publishes S only after a finalized Base refund of an unclaimed repayment (p.2, p.4).
  - The lender's claim window closes at C, two days after the repayment deadline D. The repayment can then be refunded to the borrower on Base (p.5).
- **What differs:**
  - who reveals the secret (the service instead of the lender);
  - what triggers it (a refund instead of a claim);
  - which loans can use it (eligibility);
  - the borrower also gets the USDC repayment back on Base.
- **Risk:** the lender timelock becomes valid once MTP is strictly later than T (D plus 3 days), regardless of either secret. So any valid route may confirm first. The document calls this "a residual risk for a borrower who repaid, not a default" (p.5).
- **Not stated:**
  - how quickly S is published;
  - what an ineligible borrower whose lender never claims can do beyond the long-stop.

The words "independent fallback" are my label for the S route; the document doesn't use them.

Confidence: high.

### 5. Neither Y nor S ever available
- **Lender timelock:**
  - Signed by the lender.
  - Usable once MTP is strictly later than T, three days after D. Pays the lender's committed destination.
  - The lender exports a current package after fresh reauthentication and broadcasts it with its own tools. The organization does not select, schedule or broadcast it (p.4, p.5).
- **Borrower long-stop:**
  - Signed by the borrower.
  - Usable once MTP "satisfies" B, ten days after D. Pays the borrower's committed destination (p.4).
- **How a clash is settled:**
  - The two routes do not cancel each other. After B both can be valid, and whichever spend confirms first is the outcome.
  - "The actual confirmed spender decides which route won."
  - A Base repayment or refund cannot revoke a signed package (p.4, p.6).
- **Not stated:**
  - who broadcasts the long-stop;
  - any priority rule.
- **Implied by the numbers but not stated:** the lender route opens seven days earlier.

Confidence: high.

### 6. Confirmations given when disclosing a secret on Base
The document does not answer this. It only says:
- the borrower performs "the explicit acceptance that reveals X";
- the lender performs "the repayment claim that reveals Y" (p.2).

The effects downstream are:
- X lets the system insert X into an activation once the acceptance reaches Base finality (p.3);
- Y lets the system complete normal recovery once the claim is final (p.4).

It lists no specific confirmations or acknowledgements, and does not say what each would allow.

Confidence: high that this is not covered.

### 7. Fee choice for a pre-signed transaction, and what is unsettled
- **The six signed levels:** 10, 20, 50, 100, 150 and 200 sat/vB (p.1).
- **Selection when a route is operated:**
  - Take a fresh one-block estimate.
  - Pick the lowest level strictly greater than 1.25 × the estimate, using integer arithmetic only.
  - Estimate sources: Mempool, then Blockstream Esplora, then Validation Cloud. Each request has a 15 s deadline.
  - An estimate fetched more than 120 s before the first broadcast is not used.
  - Before mempool entry, a fresh estimate may select another level (p.4).
- **After acceptance:**
  - An activation or exit transaction can be bumped only by a child. CPFP spends the anchor: an operator approves and exports the request, a local helper builds the child, and a manually unlocked Bitcoin Core fee wallet signs and broadcasts it.
  - A refund may be replaced only by a higher pre-signed refund that Bitcoin's replacement rules permit (p.4).
- **Unsettled:** when no level is strictly above the buffered estimate, two readings remain and neither has been chosen (p.6):
  - select 200 sat/vB, record CPFP eligibility and alert; or
  - fail closed and select nothing.
- **Smaller gaps:**
  - P2A anchors are stated only for activation and refund transactions (p.3), yet CPFP is described for exit transactions too.
  - "Actual transaction size" is cited as a safeguard (p.6), but the document never explains its role.

Confidence: high.

### 8. A forgotten Vault password
- Product sign-in and support cannot recover it. Stronger Vault recovery is deferred (p.5, p.6).
- The Vault encrypts the seed, keys and secrets under the participant's password, and signing in to the product never unlocks it (p.2).
- The document mentions a 12-word seed (p.2), portable encrypted backups and "a restored Vault" (p.6). It never says whether restoring from the seed works around a forgotten password.
- It also doesn't explain the consequence for a live loan, for example being unable to accept, claim or sign.

Confidence: high on what is stated; the answer is only partial.

---

### Confusing points, early terms, missing items
- **Undefined terms:**
  - "binding" (as in "missing binding" or "wrong binding")
  - "current snapshot"
  - "committed" destination or terms
  - "qualifies" / "requalifies"
  - "lifecycle gate"
  - "unchanged confirmations"
  - "retention policy"
  - "the organization" (who it is)
  - "fee wallet" and "local helper" (who runs them)
- **Terms used before they are explained:**
  - "funding window" (p.2) appears while the lender's funding step is never described.
  - "default package" (p.2) is presumably the lender timelock package; that name only appears on p.5.
  - "terminal signing pending" (p.5) appears with no list of loan statuses.
  - C is introduced only on p.5.
  - D is defined only inside the table.
- **Inconsistencies or ambiguity:**
  - The timelock comparisons differ: "strictly later than T" versus "satisfies B".
  - "Activation" is overloaded: the loan's activation versus the service's "production activation".
  - "Validation Cloud" (a data provider) and the "independent validation service" sound alike.
  - "Keep operating the same selected activation" sits uneasily with "a different pre-signed activation confirms instead" and with reselecting a level before mempool entry.
  - The P2A anchor is stated only for activation and refund transactions.
  - "Staging script", "prefund" and "prefund address" are used interchangeably.
- **Internal design jargon in the open conflicts (p.6):** "payload section", "action definition", "implementation ticket", "archive sentence", "domain record".
- **Expected but missing:**
  - when and how the lender funds;
  - what the borrower's acceptance and the lender's claim involve for the participant;
  - script and key structure;
  - how a destination is committed, and whether it can change;
  - the seed backup and restore procedure;
  - what happens if an activation stall outlasts the roughly 3-day refund timelock;
  - who broadcasts the long-stop;
  - what happens if the validation service never publishes S;
  - a glossary or worked timeline with concrete values for D, C, T and B.
