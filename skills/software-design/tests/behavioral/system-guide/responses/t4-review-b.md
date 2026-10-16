# T4 Review B: Bitcoin, Base Settlement and Base Observation guides

## Scope and method

- **Guides reviewed** (package `snap-t1/bitrise21/loan-system/design/technical-design`):
  - `guide/domains/bitcoin-authorization-and-recovery.md`
  - `guide/domains/base-usdc-settlement-and-funding.md`
  - `guide/domains/base-observation-and-fallback-review.md`
- **Owners checked.** I checked the guides against the post-migration technical records:
  - the three domain records and the architecture;
  - SR-002, SR-003, SR-004, SR-005, SR-006, SR-007 and SR-009;
  - FLOW-001 to FLOW-010;
  - IFACE-007, -008, -009, -010, -011, -012, -014, -015, -017, -019 and -020;
  - STATE-007, -010, -011, -012, -013, -014 and -019;
  - INV-002 to -011, -015 to -018, -020, -021 and -024 to -026;
  - SEC-009, -017, -023, -024 and -025;
  - SCOPE-001, -002, -003, -005, -006, -007, -012 and -014;
  - SEL-009, -013 and -015, and CONS-008, -010, -013 and -027;
  - the root README.
- **Migration comparison.** I compared the package with the untouched copy (`pre/...`) using `diff -rq`. The only system-model files that changed are `architecture.md`, the five `domain.md` records and SR-001. A `guide/` directory was added.
- **Answer key.** The key's source root `t0/...` is byte-identical to `pre/...`: `diff -rq` reports no differences.
- **Criteria.** I used key part 4 as the review criteria and key parts 1–3 as checklists. I verified each key item against the records rather than trusting it.
- **Independence.** I read no other reviewer's response files and changed nothing in the package.

## Verdicts at a glance

| Guide | Critical | Major | Key facts preserved | Comprehension (guide-only reader) | Verdict |
| --- | --- | --- | --- | --- | --- |
| Bitcoin Authorization And Recovery | 0 | 3 | 11/15 (73%): 3 Weakened, 1 Missing | about 5/8 (Q-B3 and Q-B6 fail; Q-B7 and Q-B8 partial) | **FAIL** |
| Base USDC Settlement And Funding | 0 | 2 | 12/15 (80%): 3 Weakened | 8/8 (two answers carry caveats) | **FAIL (narrow)** |
| Base Observation And Fallback Review | 0 | 1 | 14/15 (93%): 1 Missing | 7/8 plus Q-O8 partial | **PASS with correction note** |

No guide contains a Critical defect. The values and conditions the key treats as critical are all correct in all three guides:
- the times C, T and B;
- "strictly before C";
- six confirmations;
- the tiers 10/20/50/100/150/200 sat/vB and the strict 1.25 buffer;
- the 24-hour limits;
- non-cancellation of the lender route by the long-stop.

The failures come from omitted residual risks and omitted authority steps, not from wrong values.

---

## 1. Bitcoin Authorization And Recovery guide

### 1.1 Defects

#### B-MAJ-1: Activation-pending lender exposure is omitted, and one sentence suggests the refund path is closed (Major: residual risk omitted)

- **Guide**, "Exceptions and recovery": "**Activation stalls after X is public.** The system must keep operating the same selected activation; it cannot refund the prefund or build an unapproved replacement."
- **Guide**, "A normal case": "Until one activation has six confirmations the loan is *activation pending*."
- **Owner:** `system-model/contracts/security/sec-023-base-pays-principal-but-bitcoin-activation-does-not-confirm.md`.
  - "### SEC-023.THREAT-001 — Base pays principal but Bitcoin activation does not confirm": "A malicious or compromised borrower, or anyone holding the signed refund package, then broadcasts refund; the refund confirms first." It continues: "The lender is left with unsecured credit exposure. This is the principal residual cross-chain risk: Base payment and Bitcoin activation are not one atomic transaction."
  - "## Honest Capability Claim": "Base acceptance and Bitcoin activation are not literally atomic, so activation pending remains a residual lender risk."
  - Also `inv-018-activation-pending-recovery.md`, "## Violation Meaning": "lender principal could become unsecured while the product falsely shows active collateral."
- **What is wrong:** omitted condition and residual risk (key B-6).
  - The guide states the activation-pending label correctly but never says what can go wrong in that window.
  - "It cannot refund the prefund" describes only what the platform may relay. A guide-only reader will conclude that the refund path is closed once X is public. In fact the borrower or any package holder can still broadcast the signed refund and win the race.
  - Part 4.3 lists this exact omission ("activation-pending lender exposure (non-atomic)") as Major.

#### B-MAJ-2: The two-confirmation secret disclosure is missing (Major: authority distinction 2a given in one direction only; key B-12 Missing)

- **Guide**, SR-004 summary: "…signs exact batches of packages, and performs the explicit acceptance that reveals X."
- **Guide**, SR-009 summary: "…performs the repayment claim that reveals Y…"
- **Owners:**
  - `sr-004-borrower-bitcoin-authorization-and-recovery.md`, "## Owns": "Acceptance first confirms only the canonical nonsecret facts, then an isolated worker minimally unlocks `X` and the Base key to freeze the exact secret-bearing transaction, and only a second confirmation bound to those exact bytes authorizes local signing/submission."
  - `sr-009-…md`, "## Owns": the same two-step rule for `releaseWithY`, plus "Plaintext and the worker/session clear on every terminal attempt outcome."
  - `flow-002-…md`, step 4, "Must not imply": "First confirmation is not signing consent."
  - `iface-014-…md`, "## Preconditions And Validation": "The first confirmation grants no signing/submission authority."
- **What is wrong:** the guide says sign-in never unlocks the Vault. It never says that the first confirmation inside the Vault is also not consent to sign, or that plaintext is cleared on failure.
  - Q-B6 cannot be answered from the guide.
  - The pre-migration domain record carried this sentence in its narrative ("Acceptance first reviews nonsecret facts; a narrowly unlocked worker prepares …; a second confirmation tied to those bytes authorizes signing and submission"). The guide dropped content the migration source gave it.

#### B-MAJ-3: The consequences of a forgotten password and the lender's post-confirmation signing window are omitted (Major: residual risk omitted; key B-15 Weakened)

- **Guide:** "**A forgotten Vault password.** Product sign-in and support cannot recover it; stronger Vault recovery is deferred."
- **Guide:** "**Exit packages are incomplete.** The loan stays *terminal signing pending* and recovery work continues; nothing undoes the principal or the escrow."
- **Owners:**
  - `sr-009-…md`, "## Failure And Recovery": "password or required-envelope loss removes new signing capability, so the post-confirmation signing window is an explicit residual risk; already signed unchanged packages remain usable under their route conditions."
  - `sr-004-…md`, "## Owns": "Password loss blocks secret disclosure, reconstruction, new signing, and cooperative settlement but does not invalidate an unchanged fully signed package."
  - `inv-024-…md`, "## Rule": "Product recovery may return authorized ciphertext only; prepared fixed packages and public-condition paths remain independently usable where designed."
- **What is wrong:** the guide says only that the password cannot be recovered. It omits both what still works (signed, unchanged packages) and what is blocked (disclosure, new signing, cooperative settlement). It also omits that a lender who loses access before signing its route leaves an explicit residual risk.
  - Part 4.3 names "the post-confirmation signing window" as a Major residual risk.

#### B-MIN-1: Estimator-outage behaviour is omitted (Minor; key B-13 Weakened)

- **Guide:** "Estimates come from Mempool, then Blockstream Esplora, then Validation Cloud; each request has a 15-second deadline, and an estimate fetched more than 120 seconds before the first broadcast is not used."
- **Owner:** `iface-007-…md`, "## Preconditions And Validation": "If no source is usable, the route enters `fee-estimation-blocked`: it must not automatically select/broadcast a parent or broadcast a CPFP child. Manual continuation may record only one existing signed tier…"
- **What is wrong:** the fail-closed blocked state and the limit on manual continuation (existing tier only) are missing. The guide does not merge this case with the no-qualifying-tier conflict, so no conflict is distorted.

#### B-MIN-2: "Acceptance" and "activation" collisions are left unexplained (Minor)

- **"Accepted" in two senses:**
  - "Once an activation or exit transaction is accepted, only a child transaction can add fee" means mempool acceptance (`iface-007`, "## Payload Or Artifact": "Once an activation or terminal candidate is accepted…").
  - Elsewhere in the same guide, "accepts" means the borrower's X acceptance on Base.
- **"Activation" in two senses:** the Secrets bullet uses "the independent validation service's production activation" beside the Bitcoin "activation" transaction.
- **Why Minor:** context and the qualifier disambiguate both, so neither reaches the Major "left unexplained" bar. A one-clause gloss would remove the risk.

#### B-MIN-3: The mempool-reselection rule is slightly generalized (Minor)

- **Guide:** "Before a candidate enters the mempool, a fresh estimate may select another signed level."
- **Owner:** `iface-007`, "## Payload Or Artifact": "Before any activation or refund candidate enters the mempool…"

#### B-MIN-4: When X is public versus when it is usable (Minor)

- **Guide:** "When the borrower's acceptance on Base reaches finality, X is public."
- **Owners:** X becomes public when `acceptX` executes. Base L1 finality is when it may cross into Bitcoin action (`iface-020`, "## Boundary": "Only a canonical finalized public secret event may cross…").
- **Why Minor:** no authority is affected.

#### B-MIN-5: The fallback's current unavailability is implicit (Minor)

- **Guide:** S is usable "only for a loan created after the independent validation service's production activation".
- **What is wrong:** the guide never says that the gate has not been evidenced. SEC-009, "Build obligations", requires that "lender-silence borrower Bitcoin release are unavailable" be disclosed until then.
- **Why Minor:** part 4.6 ("fallback is production-gated") is met.

**Checked and correct.** These items were verified and are not defects:
- prefund CSV of 259,584 s;
- the 240-sat P2A on activation and refund;
- the signing order and receipt-last rule;
- terminal packages only for the actual winner (6+6+6, borrower 12 and lender 6);
- terminal-signing-pending;
- parent mutation and same-parent reorg;
- the same transaction for Y and S;
- T "strictly later" (FLOW-007) and B "satisfies" (INV-008);
- no cancellation between the timed routes, and the first confirmed spend wins;
- manual export after fresh reauthentication (FLOW-007 step 3);
- relay order, deadline and retry backoff;
- observer pairs per network and the lower confirmation count;
- escalation after five minutes or one missed block;
- CPFP through operator export, helper and Core;
- the deferred and excluded list;
- both open-conflict callouts, with the source silence kept ("a former decision").
- All guide links resolve.

### 1.2 Key facts (part 1.3)

| Fact | Status | Note |
| --- | --- | --- |
| B-1 prefund ≠ escrow; signed package ≠ destination permission | Preserved | Concepts and callout |
| B-2 secret roles | Preserved | |
| B-3 zero-confirmation signing versus six confirmations | Preserved | The acceptance gate is covered by "before anything else relies on it" |
| B-4 initial inventory and signers | Preserved | |
| B-5 18 terminal packages, actual winner only, stale 12 flagged | Preserved | |
| B-6 activation pending, not atomic, lender unsecured if refund wins | **Weakened** | Label present; risk missing (B-MAJ-1) |
| B-7 signing order; terminal-signing-pending irreversible | Preserved | |
| B-8 changed parent versus same-parent reorg | Preserved | |
| B-9 same transaction for Y or S; final on confirmation | Preserved | |
| B-10 T and B timing; no expiry; race; Base cannot revoke | Preserved | |
| B-11 manual export only; organization never broadcasts | Preserved | |
| B-12 two-confirmation disclosure | **Missing** | B-MAJ-2 |
| B-13 fee rule, estimator outage, CPFP, no-tier conflict | **Weakened** | Estimator outage missing (B-MIN-1) |
| B-14 cooperative settlement fresh and deferred | Preserved | |
| B-15 password loss consequences and signing-window risk | **Weakened** | B-MAJ-3 |

### 1.3 Section 2 distinctions

| Distinction | Status |
| --- | --- |
| 2a | Partial. "Signing in to the product never unlocks the Vault" is present; the exact-bytes second confirmation is absent. |
| 2b | Present. The authority list includes "a relay response or a missing secret". |
| 2c | Present. "Base refund", the prefund refund and unclaimed-repayment refunds are distinguished. |
| 2d | Present. Same transaction, no new signature, production-gated. |
| 2e | Present. The "Signed is not sent, and sent is not final" callout; a relay timeout is ambiguous; export is not broadcast. |
| 2g | Present. No readiness language. |
| 2h-2, 2h-3 | Both sides and their undecided status are present. |

### 1.4 Comprehension (guide-only reader)

| Question | Result |
| --- | --- |
| Q-B1 | ✓ |
| Q-B2 | ✓ |
| Q-B3 | ✗ The status is answerable but the risk is not. The guide's "cannot refund the prefund" points the reader toward "no risk". |
| Q-B4 | ✓ |
| Q-B5 | ✓ |
| Q-B6 | ✗ |
| Q-B7 | Partial. Estimator outage is missing. |
| Q-B8 | Partial. The reader would not know signed packages still work, or that new signing is blocked. |

About 5 of 8 are answered: fewer than 6.

### 1.5 Verdict: FAIL

- **Majors:** three (B-MAJ-1, B-MAJ-2, B-MAJ-3) against a limit of one.
- **Facts preserved:** 73%, below the 90% threshold.
- **Comprehension:** fewer than 6 of 8.

All three Majors are omissions that one or two sentences each would repair. The SEC-023 risk, the two-step disclosure, and the forgotten-password consequences are all available in their owners.

---

## 2. Base USDC Settlement And Funding guide

### 2.1 Defects

#### S-MAJ-1: Upgrade governance restates a selection-only claim as the design and understates the canonical prohibition (Major: changed meaning, omitted limit, conflict understated)

- **Guide**, "Choices and their reasons": "The main contract sits behind an upgradeable proxy with one ownership path: a single upgrade key for local and test use and the intentionally short public mainnet beta, then a two-of-three multi-signature Safe acting through a seven-day timelock for the rest of version 1. … Existing loans are never migrated to another contract, but an approved upgrade becomes the code path for every loan the proxy holds."
- **Guide**, "Open discrepancies: pause and the beta upgrade key": "the upgrade invariant and the deployment state record describe only the two-of-three Safe and seven-day timelock, while the upgrade selection adds the single-key period during the short beta."
- **Owners:**
  - `inv-020-base-upgrade-boundary.md`, "## Rule": "V1 retains the Transparent ProxyAdmin controlled by a 2-of-3 Safe through a seven-day timelock. Upgrades and administration must preserve fixed-recipient/lifecycle authority and originating-loan identity; existing loans remain on their originating contract and are not silently migrated."
  - `state-019-…md`, "## Invalid Transitions": "Unrestricted unilateral upgrade/admin key, retroactive mutation/migration of existing loans…". Its transition guard says: "Do not migrate or reinterpret existing originating loans."
  - `sec-017-…md`, "## Prohibited Authority": "No unilateral upgrade/admin/opener/pause key may … bypass the timelock/Safe…". Under "Noncustodial significance": "An unrestricted unilateral upgrade key contradicts that practical claim for funds held by the proxy."
  - Root `README.md`, "Blueprint Terms": an implementation selection "does not define system behavior."
- **What is wrong:**
  1. The Choices bullet states SEL-009's single-key beta period as the design.
  2. The callout says the canonical owners "describe only" the Safe and timelock. In fact STATE-019 and SEC-017 prohibit an unrestricted unilateral upgrade key, so this is a contradiction, not an elaboration.
  3. INV-020's limit ("must preserve fixed-recipient/lifecycle authority and originating-loan identity") is omitted. Without it, "an approved upgrade becomes the code path for every loan" reads as unlimited power over existing loans.
  4. SEC-017's honest claim, that upgrade authority bears directly on the noncustodial claim, is missing.

The conflict is flagged, so this is not "silently resolved" (Critical). It is still a Major change of meaning.

#### S-MAJ-2: The unclaimed-repayment refund's independence from the fallback is not stated (Major: omitted condition; key S-10 Weakened; required by key 2d for this guide)

- **Guide:** "**The lender does not claim.** … At or after C, anyone may refund the exact unclaimed repayment, once, to the frozen recipient. Claim and refund exclude each other."
- **Guide**, callout: "The finalized unclaimed-repayment refund event is the only Base fact that can trigger the optional fallback…"
- **Owners:**
  - `inv-007-…md`, "## Rule": "the exact amount is permanently refundable once to the recipient frozen at `C` … the Base refund never depends on ECVS."
  - `state-013-…md`, "## Observation And Finality": "Base refund availability and completion never depend on ECVS."
  - `sr-007-…md`, "### From an unclaimed repayment to public S": "The refund remains available indefinitely and never waits for this service."
- **What is wrong:** "permanently" or "indefinitely", and "never depends on or waits for the fallback", are both missing. The ordering in the callout implies independence, and the Observation guide states it. The Base guide must stand alone at this boundary (part 4.6) and does not.
- **Severity note:** this is borderline Major. It is a one-sentence fix, and the verdict does not depend on it.

#### S-MIN-1: Valid repayment without a claim is never called "not default" (Minor; key S-14 Weakened)

- **Guide:** the guide never uses the word "default". The "repayment is late or wrong" bullet covers missed D and the separate Bitcoin timelock.
- **Owners:**
  - `flow-004-…md`, "## Failure And Reroute": "If exact repayment finalizes but lender claim does not finalize before `C`, reroute to `FLOW-005`; this is not ordinary default."
  - `flow-008-…md`, step 3: "Classification does not bypass Bitcoin MTP, sign, select, or broadcast a lender package."
- **What is wrong:** omitted distinction. Nothing in the guide contradicts it.

#### S-MIN-2: Participant transfer is not said to lack loan binding (Minor; key S-15 Weakened)

- **Guide:** "A Vault payment account, and the separate narrow capability to send configured USDC to a recipient of the participant's choice, change none of the payer-neutral rules or historical recipients."
- **Owner:** `sr-003-…md`, "## Owns": "A participant transfer has no loan binding and cannot advance or rewrite loan state."
- **What is wrong:** the "cannot advance loan state" half is missing. The guide's general statement ("A balance, a sent transaction or an application screen is not proof") partly compensates.

#### S-MIN-3: Small qualifiers are dropped (Minor)

- **"an optional Vault payment account":** SR-005 requires a "recoverable" or "recoverability-qualified" account.
- **The refund-recipient switch:** "irreversibly" is omitted, although "once" is kept (IFACE-009 and STATE-013).
- **Named custom errors:** omitted, although the guide does say "reverts without a success event".
- **Guided repayment cutoff:** IFACE-011, "## Preconditions And Validation", says the guided transfer flow "closes one hour before `D`". This is omitted.

#### S-MIN-4: Ambiguous wording about the main contract (Minor)

- **Guide:** "For each loan, a main loan contract on Base keeps the authoritative record…"
- **Owners:** STATE-011 and IFACE-009 describe one main contract holding one record per `loan_id`. The guide's later text ("every loan the proxy holds") is consistent with that, but this sentence can be read as one contract per loan.

#### S-MIN-5: Activation-pending exposure is not mentioned at acceptance (Minor for this guide)

- **Guide:** "This is the moment the borrower receives the money. The Bitcoin side is still only *activation pending*…"
- **What is wrong:** the boundary is stated correctly and nothing claims cross-chain atomicity; "atomic" is used only for the Base call, which part 4.6 allows. The lender's resulting exposure (SEC-023) is left to the Bitcoin guide, which also omits it.

**Checked and correct.** These items were verified and are not defects:
- the caller-restriction statement ("Only two calls are restricted"), verbatim against IFACE-009;
- the 24-hour funding window and acceptance deadline;
- exact-principal and exact-debt finalization;
- every sweep and refund recipient, including the funding vault after finalization or expiry and the repayment vault after finalization or strictly after D, current before C and frozen from C;
- claim strictly before C = D + 172,800 s;
- the switch limited to the protocol EOA;
- the gas stipend: one-shot, no refill, a hard stop on extreme fees, self-funding always available (IFACE-015);
- no on-chain pause, and exits remain available;
- delayed opener replacement;
- the deferred and excluded items (SCOPE-007, SCOPE-005, SCOPE-014, production payment-gas sponsorship per IFACE-015 "## Boundary", SCOPE-011 and SCOPE-012);
- the "who may reveal X and Y" discrepancy: IFACE-009 lets "Any caller with matching X/Y", while IFACE-014 "## Must Not Imply" says reveal "from an EOA other than the immutable term-bound Vault-derived caller is not a valid protocol transition even if a wallet transaction confirms". The discrepancy is real and correctly framed.
- the pause discrepancy, which is real:
  - SEL-009, SR-003 and CONS-008 say there is no on-chain pause;
  - STATE-019 has "pause/operational roles" and a "Paused for new/risky action" state;
  - INV-019 and SEC-017 also refer to pause roles or keys.

### 2.2 Key facts (part 1.4)

| Fact | Status | Note |
| --- | --- | --- |
| S-1 to S-9 | Preserved | S-4 drops "recoverability-qualified"; S-9 drops "irreversible". Both Minor. |
| S-10 refund permanent and independent of the fallback | **Weakened** | S-MAJ-2 |
| S-11 only positive trigger; refund ≠ Bitcoin recovery; T independent | Preserved | |
| S-12 permissionless ≠ control; reverts move no value | Preserved | |
| S-13 Transparent Proxy, Safe and timelock; immutable vaults; no pause; no migration | Preserved | All elements present, but altered by the SEL-009 addition (S-MAJ-1) |
| S-14 default classification from Base facts; valid repayment never default | **Weakened** | S-MIN-1 |
| S-15 payment account only a payer; participant transfer cannot advance loan | **Weakened** | S-MIN-2 |

### 2.3 Section 2 distinctions

| Distinction | Status |
| --- | --- |
| 2a | Present. Acceptance and claim are made only from the participant's Vault and protocol account. |
| 2b | Primary; present. |
| 2c | Present. All three refunds are separated. |
| 2d | Partial. The trigger is a Base fact, but "never waits for the ECVS" is missing. |
| 2e | Present. |
| 2f | Present. |
| 2g | Present. No readiness language. |
| 2h | No 2h conflict is touched. |

### 2.4 Comprehension

| Question | Result |
| --- | --- |
| Q-S1 to Q-S4 | ✓ |
| Q-S5 | ✓ "At any later time" is only implicit. |
| Q-S6 | ✓ |
| Q-S7 | ✓ |
| Q-S8 | ✓ but the reader would add the beta single key and "the upgrade becomes every loan's code path" without INV-020's limit. |

8 of 8, with no dangerous answers.

### 2.5 Verdict: FAIL (narrow)

- **Majors:** two (S-MAJ-1, S-MAJ-2) against a limit of one.
- **Facts preserved:** 80%, below the 90% threshold.

Comprehension passes. The fixes are:
- rewrite the governance bullet and callout so the canonical posture comes first, with INV-020's limit and the STATE-019/SEC-017 prohibition stated;
- add one sentence on the refund being permanent and independent of the fallback;
- add one sentence that valid repayment without a lender claim is not default;
- add one clause that a participant transfer cannot advance the loan.

---

## 3. Base Observation And Fallback Review guide

### 3.1 Defects

#### O-MAJ-1: The four lookup outcomes, and "an empty result is not withholding", are missing (Major, needs a correction note; key O-13 Missing)

- **Guide:** "**The fallback fails.** Wrong, early, non-final, cross-loan or unverifiable evidence cannot authorize publication. An outage can be recovered by verifying again and replaying the same S. If S is lost, compromised or withheld, the defined incident path applies…"
- **Owners:**
  - `sr-007-…md`, "### From an unclaimed repayment to public S": "The public lookup contract distinguishes no publication yet, a valid publication, invalid or mismatched evidence, and an unavailable source. An empty or unreachable response is not proof that the service deliberately withheld S. The product receives public metadata and the commitment-match conclusion…"
  - `iface-017-…md`, "### ACT-002 — Acquire and replay the public S publication": "Empty is not a negative event; stale/unavailable/mismatched/duplicate source cannot be inferred as released or withheld."
- **What is wrong:** the guide names "withheld" as a failure path that triggers an incident. It never says that silence or an unreachable source must not be read as withholding, or as release. A reader could start the incident path, or tell a borrower that the service refused, on an empty lookup. Q-O8 is only partly answerable.

#### O-MIN-1: The production gate is missing from the summary and the fallback diagram (Minor; part 4.1 step 5)

- **Guide**, intro: "it defines a narrow fallback that can help return a borrower's Bitcoin when a valid repayment was never claimed by the lender."
- **Guide**, figure: "step: Commit | Before the loan is built, the ECVS creates S and returns only its hash for the escrow script."
- **Owner:** `sr-007`: "Counsel approval and implementation evidence must activate production use **before any new loan commits H(S)**…"
- **What is wrong:** the gate appears only in the check list ("production-activated for the loan") and in the closing callout ("The fallback is selected, not available"). Nothing claims the fallback is available, so this is not Critical. A reader of only the summary or the figure would miss the gate.

#### O-MIN-2: Gate and secret details are omitted (Minor)

- The guide omits "a resolved technical ticket does not satisfy that gate" (SR-007, "### Establishing the capability…").
- It omits "no provider-wide master secret" and the 32-byte size (SR-007, "## Owns"; IFACE-017, "## Payload Or Artifact").

#### O-MIN-3: The handoff is simplified to finalized facts only (Minor; ordering simplification)

- **Guide**, figure: "Hand off | The observer sends the finalized fact to the application through a versioned handoff."
- **Guide**, text: "When finality arrives, the application stores the source evidence and acknowledges it…"
- **Owners:**
  - `sel-015`, "### Cursor and replay": tail events "may be shown as temporary".
  - `iface-012`, ACT-001: the input carries "finality state".
  - `state-014`, "## Observation And Finality": the cursor advances only through acknowledged L1-final blocks.
- **What is wrong:** observations are ingested with observed, safe or finalized status. The guide's version implies storage happens only at finality. Authority is unaffected.

#### O-MIN-4: "Irreversibly settled" (Minor)

- **Guide:** "**Base L1 finality**, the stage at which it is irreversibly settled on Ethereum".
- **Owners:** SEL-013 supports this as "the normal irreversible L1-finality guarantee". STATE-014 still models a correction of an L1-finalized observation ("Observed or Safe or L1 finalized → Noncanonical"), and SEL-013 keeps reconciliation as "a defense against … anomalous chain data".
- **What is wrong:** the guide's phrase is slightly stronger than the owners.

#### O-MIN-5: The observer's role toward the fallback is overstated (Minor)

- **Guide:** the observer "provides finalized Base facts … to the fallback service".
- **Owner:** `sr-006`, "## Inputs And Outputs": the output to SR-007 is an "Independently verifiable public event reference", which the ECVS re-verifies.
- **What is wrong:** the guide corrects this later ("The ECVS does not accept the application's conclusion"), but the first statement overstates the observer's role.

#### O-MIN-6: Smaller omissions and possible confusion (Minor)

- **Replay after an outage:** not stated for provider outages. STATE-014 and IFACE-012 say "blocks only new Base-derived consequential actions until replay recovers".
- **Two providers versus one:** "two separately operated Base providers" (payment reconciliation, SR-006) sits next to "one healthy provider is enough". The contexts differ but are not contrasted.
- **Optional pre-C recipient switch:** omitted. It is owned by the Base guide.

**Checked and correct.** These items were verified and are not defects:
- the observed, safe and finalized states, with safe as progress only (SEL-013: "L1-batched");
- about 20 minutes and "not a promise of an exact waiting time";
- cursor advancement after acknowledgement, same-identity resend, and no duplicates;
- Alchemy as primary and QuickNode as fallback, with one healthy source enough;
- dual outage or conflict keeps finalized information visible and blocks new consequential actions;
- reorg handling: noncanonical status, appended correction, replay from the last common finalized block;
- operator recheck only;
- Bitcoin agreement required, one incident, escalation after five minutes or one block, critical after X, resume after fresh agreement;
- probes at 0, 15 and 60 s and escalation at 180 s, with the payment record separate from loan state;
- the ECVS check list, verbatim against SR-007;
- the Bitcoin-side checks;
- the same borrower-signed transaction, with no new signature, family or destination;
- final only on confirmation;
- the failure paths, with no company release or replacement secret;
- the refund never waits for the ECVS;
- the residual routes (T, B, no cancellation, cooperation, first confirmed spend), framed as "not default, not a promise".

### 3.2 Key facts (part 1.5)

| Fact | Status |
| --- | --- |
| O-1 to O-7 | Preserved |
| O-8 | Preserved. "No provider-wide master secret" and "32-byte" are omitted (Minor). |
| O-9 | Preserved |
| O-10 | Preserved. "A resolved ticket does not satisfy the gate" is omitted (Minor). |
| O-11, O-12 | Preserved |
| O-13 | **Missing** (O-MAJ-1) |
| O-14, O-15 | Preserved |

### 3.3 Section 2 distinctions

| Distinction | Status |
| --- | --- |
| 2b | Present. |
| 2c | Present. The unclaimed-repayment refund is distinguished from Bitcoin recovery. |
| 2d | Primary; present in full except the lookup outcomes. |
| 2e | Present. "Publishing S is not a Bitcoin recovery". |
| 2g | Present. The ECVS is "selected, not available". |

No "must not be written as" phrasing appears.

### 3.4 Comprehension

| Question | Result |
| --- | --- |
| Q-O1 | ✓ |
| Q-O2 | ✓ |
| Q-O3 | ✓ Replay after recovery is only implicit. |
| Q-O4 to Q-O7 | ✓ |
| Q-O8 | Partial. "Empty is not proof of withholding" is missing. |

### 3.5 Verdict: PASS with a correction note

- **Criticals:** none.
- **Majors:** one (O-MAJ-1). The correction note should add the four lookup outcomes and "an empty or unreachable result is not proof of withholding or release".
- **Facts preserved:** 93%.
- **Comprehension:** 7 of 8.
- **Also recommended:** add the production gate to the intro and to the conditional-fallback figure caption.

---

## 4. Migration check: was anything removed from the technical records left without an owner?

The migration replaced the narrative sections of the three domain records with a pointer to the guide plus a new "Choices And Rationale" section. It also removed `architecture.md` "## System Overview". I traced every removed statement that bears on these three domains.

### 4.1 Bitcoin domain record (removed "Domain Overview" and its three subsections)

| Removed content | Surviving owner or destination |
| --- | --- |
| Prefund, escrow and PSBT meanings; "signed package is evidence of exact prior authorization, not permission … to choose a new destination"; consensus decides | INV-003 "## Rule"; SR-002 "## Must Not Own"; IFACE-020 "## Must Not Imply" |
| Secret roles; long-stop needs no secret; no organization key | INV-004, INV-008, INV-022 ("no organization key appears in prefund or escrow scripts"), SCOPE-002 |
| SR-002, SR-004 and SR-009 descriptions, including the two-step acceptance and password-loss sentence | SR-002, SR-004 and SR-009 "## Owns" and "## Failure And Recovery"; INV-024 |
| Zero-confirmation boundary, initial tiers, terminal set only for the actual winner | INV-015; SR-002 "## Owns"; FLOW-001 steps 6–9; FLOW-002 steps 7–9; INV-026 |
| The 18-versus-stale-12 conflict | **Moved deliberately** to domain "## Choices And Rationale" ("Unresolved source conflict: terminal package count") |
| Signing order, receipt-last, terminal-signing-pending, different winner, parent mutation and reorg | SR-002 "## Owns" and "## Failure And Recovery"; FLOW-002 "## Failure And Reroute"; INV-016 |
| Y and S fill the same transaction; timed routes concurrent; Base cannot revoke; cooperative settlement fresh and deferred | IFACE-017, IFACE-020, INV-008, FLOW-007, FLOW-010, FLOW-009, SCOPE-005 |
| The no-qualifying-tier fee conflict | **Moved deliberately** to "## Choices And Rationale" (TICKET-0018 and the IFACE-007 payload versus ACT-002 and "a former decision"; silence kept) |
| P2A and CPFP separation; relay timeout ambiguity; blocking conditions | SR-002 "## Owns" and "## Failure And Recovery"; IFACE-016; IFACE-008 |
| Rationale for scripts, envelope and hardened derivation | **Moved deliberately** to "## Choices And Rationale", with SEL-027, SEL-004 and SEL-003 attribution |
| "Those are reasons for the existing contracts, not permission to add recovery authority." | **No owner.** Dropped everywhere. It is a guard sentence rather than a behavior fact; low impact. |
| Exclusion roll-up: SCOPE-001, -002, -003, -006 and -005 "each with its own revisit condition" | Scope records still own each boundary. **Traceability loss:** the domain record no longer links any of these scope records, and its "## Excludes" lists none of them. The per-domain roll-up now exists only in the guide's "Open, excluded and deferred" paragraph, which links only SCOPE-001. |

### 4.2 Base settlement domain record

| Removed content | Surviving owner or destination |
| --- | --- |
| Base cannot sign, broadcast or confirm Bitcoin | SR-003 "## Must Not Own"; IFACE-020 "No Base fact automatically spends Bitcoin" |
| Vault meanings; provisional until finalized; payer neutrality | IFACE-010, IFACE-011, STATE-010, STATE-012, SR-003 "## Owns" |
| A permissionless caller pays gas without control | IFACE-009 ("Callers and token-transfer senders never select recipients or acquire loan roles"); SR-003 "## Failure And Recovery" |
| Funding, acceptance and repayment narrative; claim strictly before C; switch; freeze; only positive trigger; T independent | FLOW-001 to FLOW-005; STATE-011 to STATE-013; INV-006, INV-007, INV-008 |
| Failure, authority and upgrade posture; no pause; exits | SR-003 "## Owns" and "## Failure And Recovery"; STATE-019; INV-019; INV-020 |
| Construction rationale | **Moved deliberately** to "## Choices And Rationale" (SEL-021, -022, -009; SCOPE-007) |
| "Cooperative Bitcoin settlement does not yet provide a complete Base accounting capability (SCOPE-005)"; exclusion of liquidation, custody and automatic allocation | SCOPE-005; domain "## Excludes". **Traceability loss:** SCOPE-005 is no longer linked from the domain record. |

### 4.3 Observation domain record

| Removed content | Surviving owner or destination |
| --- | --- |
| Fact establishment: events, provenance, safe ≠ final, cursor and acknowledgement, providers, reorg, operator recheck, Bitcoin agreement, Vault-payment meaning | SR-006 "## Owns" and "## Failure And Recovery"; STATE-014; IFACE-012; SEL-013, -014, -015. Rationales **moved** to "## Choices And Rationale". |
| The lender-silence case, including the optional pre-C switch | FLOW-005; STATE-013; SR-007 "### From an unclaimed repayment to public S" |
| ECVS model, independent checks, same transaction | SR-007; IFACE-017; CONS-020; FLOW-006; IFACE-020 |
| Limits: gate, Y-only escrow cannot upgrade, residual routes, not default | SR-007 "### When the path fails"; STATE-007; INV-025; SEC-025; domain "## Excludes" |
| "Monitoring, package storage and the ECVS give the company no collateral key, sale authority or discretionary payout power"; SCOPE-002 link | SCOPE-002 ("Package operation, ECVS, CPFP, monitoring, support, or Base roles do not give the organization collateral spend or sale authority"). The domain record still links SCOPE-001 but no longer links SCOPE-002 (traceability only). |

### 4.4 Architecture "## System Overview" (the parts that touch these domains)

- **Removed:** "Existing approval-wording and fee/count discrepancies … remain unresolved source issues; this documentation revision does not choose new behavior."
  - The fee and count conflicts now live in the Bitcoin domain record's "## Choices And Rationale".
  - The approval-wording conflict is now a pointer sentence in "## Purpose And Binding".
  - This is a deliberate move. The system-level roll-up of open conflicts no longer exists in any technical record.
- **Removed:** the "normal repayment / lender silence / conditional S" narrative. It is still owned by FLOW-004, FLOW-005, FLOW-006 and INV-025.

### 4.5 Content that exists only in a guide

1. **Base guide, "Open discrepancy: who may reveal X and Y"** (IFACE-009 versus IFACE-014) and **"Open discrepancies: pause and the beta upgrade key"** (SEL-009, SR-003 and CONS-008 versus STATE-019, INV-019, INV-020 and SEC-017).
   - I verified both conflicts in the records, and the guide reports them without resolving them.
   - **No technical record records either discrepancy.** The Base domain record's "## Choices And Rationale" is silent, and a grep for discrepancy or conflict markers finds only the Bitcoin and Loan Terms conflict entries.
   - Unlike the Bitcoin guide's conflicts, which mirror the domain record, these exist only in reader documentation. They should be recorded in the Base domain record so that a technical owner holds them.
2. **The per-domain list of deferred and excluded capabilities for Bitcoin**, as noted in 4.1. Each item is owned by its scope record, but the list exists only in the guide.

No behavior fact for these three domains now exists only in a guide or nowhere. The one dropped sentence (4.1) is a meta-guard, not behavior.

---

## 5. Notes on the answer key

These are items where I checked the key and found it incomplete or not quite right.

1. **Conflicts missing from 2h.** The key's 2h-4 does not list three real, unflagged Base conflicts that the Base guide surfaces:
   - who may call `acceptX` and `releaseWithY`: IFACE-009 "Any caller with matching X/Y" versus IFACE-014 "## Must Not Imply";
   - whether there is an on-chain pause: SEL-009, SR-003 and CONS-008 say none, while STATE-019 has pause roles and a pause state, and INV-019 and SEC-017 refer to pause roles or keys;
   - the beta single upgrade key: SEL-009 versus INV-020, SR-003, the STATE-019 invalid transitions and the SEC-017 prohibited authority.
2. **S-13 is incomplete.** It should include:
   - INV-020's limit "Upgrades and administration must preserve fixed-recipient/lifecycle authority and originating-loan identity";
   - SEC-017's honest claim on upgrade power.
   There is also a latent tension worth noting: SEL-009 says an approved upgrade "becomes the one current code path for every loan held by the proxy", while STATE-019's guard says "Do not migrate or reinterpret existing originating loans".
3. **Owner citations point to removed sections.** Many owner citations in key 1.3–1.5 name domain-record sections that no longer exist in the migrated package, for example "### Package Lifecycle And Recovery" and "### Establishing a fact the rest of the system can use". In every case I found the surviving owners listed in section 4.
4. **O-6 wording.** SR-006 says the incident path covers "conflict or dual unavailability". The key's "conflict or outage" is acceptable, and the Observation guide follows SR-006 exactly.
5. **Possible addition.** The key could add SEC-009's "Until the separate ECVS production-activation gate and implementation verification complete, the product must clearly disclose that … lender-silence borrower Bitcoin release are unavailable" as a must-preserve for the Bitcoin and Observation guides.
