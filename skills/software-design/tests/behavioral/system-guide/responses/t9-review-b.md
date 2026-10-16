# T9 Review B: Bitcoin, Base Settlement and Base Observation guides

Reviewer B worked alone and changed nothing in the package.

**Package under review:** `scratchpad/eval/snap-t9/bitrise21/loan-system/design/technical-design`

- **Guides reviewed:**
  - `guide/domains/bitcoin-authorization-and-recovery.md` (BTC)
  - `guide/domains/base-usdc-settlement-and-funding.md` (SET)
  - `guide/domains/base-observation-and-fallback-review.md` (OBS)
- **Criteria:**
  - v1 `expectations.md`, part 4.
  - v2 `expectations-v2.md`, part 5.
  - Checklist: v1 parts 1–2, and v2 parts 2–4.
- **Owners:** every finding was checked against the snapshot's `system-model/` and `build/` records. Where a record was migrated, the `pre/` copy was also checked.
- **Line numbers:** "Lnn" refers to the guide file's own lines.

## Summary verdicts

| Guide | Critical | Major | Facts preserved (strict / lenient) | v1 4.7 | v2 blockers | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| BTC | 0 | 4 | 10/16 (63%) | fails (≥2 Major, <90%) | material omitted residual risks/conditions | **FAIL** |
| SET | 1 | 1 | 10/15 (67%) | fails (Critical, <90%) | open question 2h-5 settled on one side; O-16 condition omitted | **FAIL** |
| OBS | 0 | 0 (1 borderline) | 9/16 strict, 13/16 lenient (56–81%) | fails only on the 90% fact rule | none confirmed | **FAIL (narrowly; repairable)** |

---

## 1. Bitcoin Authorization And Recovery guide

### 1.1 Defects

**BTC-M1 — Activation-pending status and the lender's non-atomic exposure are omitted (Major: residual risk omitted, 4.3; v2 blocker)**
- **Guide.**
  - L33: "**Activation.** When X is public and final on Base, the system inserts it into one chosen activation transaction and broadcasts it."
  - Figure L42: "Activate | Public X completes one activation transaction."
  - Neither the guide body nor the figure mentions the "activation pending" state, non-atomicity, or the lender's exposure.
- **Owners.**
  - `inv-018-activation-pending-recovery.md` "## Rule": "After Base L1-finalized acceptance, the durable state is `Base accepted / X public / activation pending`, not active."
  - `sec-023-...md` "## Honest Capability Claim": "Base acceptance and Bitcoin activation are not literally atomic, so activation pending remains a residual lender risk."
  - SEC-023 THREAT-001: "The lender is left with unsecured credit exposure."
- **What is wrong.** B-6 is missing. A reader cannot answer Q-B3. The narrative goes from acceptance on Base straight to an activation broadcast, which reads as a seamless swap.

**BTC-M2 — What a lost Vault password blocks, what stays usable, and the post-confirmation signing window are omitted (Major: residual risk omitted, 4.3)**
- **Guide.**
  - L22: "Account recovery in the product cannot recreate a forgotten Vault password."
  - L79: "a stronger way to recover from a forgotten Vault password, which this version cannot do at all".
- **Owners.**
  - `sr-004-...md` "## Owns": "Password loss blocks secret disclosure, reconstruction, new signing, and cooperative settlement but does not invalidate an unchanged fully signed package."
  - `sr-009-...md` "## Failure And Recovery": "password or required-envelope loss removes new signing capability, so the post-confirmation signing window is an explicit residual risk; already signed unchanged packages remain usable under their route conditions."
  - `inv-026-...md` "## Violation Meaning": "This design explicitly accepts both the post-confirmation terminal-signing window …"
- **What is wrong.** B-15 is weakened. The residual risk that 4.3 names, the post-confirmation signing window, is absent. A reader of Q-B8 learns only that nothing can be recovered. They do not learn that already-signed packages still work, or what becomes blocked.

**BTC-M3 — The fallback's production gate is never stated, and "activated capability" collides with Bitcoin "activation" (Major: omitted condition, 4.3 and 4.6 "The Bitcoin guide must say … the fallback is production-gated"; v2 O-16 and 2g)**
- **Guide.**
  - L13: "an optional independent secret **S**, for loans created with that capability, enables the same recovery transaction after a separate refund event on Base;"
  - L51: "Valid public S, for a loan created with the activated capability, fills the same borrower recovery transaction as Y."
- **Owners.**
  - `inv-004-...md` "## Rule": "ECVS-owned `S`, after production activation, enables only that same recovery after the exact finalized refund event."
  - `sr-007-...md` "## Must Not Own": "The selected design must not imply production availability. Counsel approval and implementation evidence remain required before any loan may commit `H(S)` or represent the fallback as available."
  - `state-015-...md` "## Invalid Transitions": "Presenting the selected ECVS capability for a loan that lacks counsel-and-implementation activation evidence and a precommitted `H(S)`".
- **What is wrong.**
  - L13 gives only one of the two O-16 conditions, and its trigger is "a separate refund event" rather than the finalized unclaimed-repayment refund.
  - No passage says the capability is selected but not production-activated.
  - In a guide that uses "activation" more than fifteen times for the Bitcoin transaction, "the activated capability" (L51) is never explained. That is the "Activation" vocabulary collision listed in 4.3.

**BTC-M4 — The rule for when every fee estimator is unusable is omitted (Major: omitted condition on when a route may act; v2 part 4 keeps it must-preserve)**
- **Guide.** L53: "Fee estimates use integer units, the expected signed transaction size, a strict buffer comparison, freshness limits and replacement rules." No passage covers what happens when no estimator is usable.
- **Owners.**
  - `iface-007-...md` "## Preconditions And Validation": "If no source is usable, the route enters `fee-estimation-blocked`: it must not automatically select/broadcast a parent or broadcast a CPFP child. Manual continuation may record only one existing signed tier …"
  - `sr-002-...md` "## Owns": "fail-closed `fee-estimation-blocked` behavior".
- **What is wrong.** B-13 is weakened. Q-B7 cannot be fully answered. The guide does not merge this case with the no-qualifying-tier conflict; it simply leaves it out.

**BTC-m1 — B-16 is missing: a stolen default package cannot redirect the Bitcoin (Minor; v2 part 5 cross-guide check)**
- **Guide.** The only related statement is L7: "It is not permission for the application to choose a new destination." The guide never says who can broadcast a matured default package.
- **Owner.**
  - `sec-025-...md`: "a random package thief cannot redirect value but may collude, extort, or sabotage".
  - SEC-025 "## Prohibited Authority": "the package holder may not redirect the fixed payout".
- **What is wrong.** A reader cannot answer Q-B9. L24, "manual export of the default transaction", may lead them to the dangerous answer that the package "cannot be broadcast without the lender".

**BTC-m2 — The collateral risk after valid repayment is implied, not stated (Minor: weakened)**
- **Guide.** L51: "A Base repayment or refund cannot revoke those signatures."
- **Owner.** `sec-025-...md` "### Valid repayment plus lender silence plus default package maturity": "No hacker is required. The borrower can lose collateral after paying …"
- **What is wrong.** The consequence can be derived, but it is never stated as a residual risk.

**BTC-m3 — Cooperative settlement loses "fresh" (Minor: weakened B-14)**
- **Guide.** L52: "Both participants can agree a new outcome and sign it with their same loan keys."
- **Owners.**
  - `scope-005-...md` "## Boundary": "fresh borrower/lender signatures from the same rederived hardened loan child keys".
  - Pre `bitcoin-authorization-and-recovery/domain.md` L29: "Cooperative signing requires fresh participant agreement."
- **What is wrong.** The guide no longer says that setup, default and recovery signatures cannot be reused.

**BTC-m4 — The lender side of the two-confirmation disclosure (B-12) is only implied, and the plaintext-clearing rule is missing (Minor)**
- **Guide.** L24 says only that SR-009 "applies the same local boundary to the lender: … the normal claim that reveals Y". No passage says that a failure or cancellation clears the plaintext.
- **Owners.**
  - `sr-009-...md` "## Owns": `releaseWithY` "first confirm[s] the canonical nonsecret claim facts … require[s] a second confirmation bound to those exact bytes".
  - `sr-004-...md` "## Failure And Recovery": "… second-review cancellation, invalid signature, or submission failure clears plaintext and the action worker/session and fails closed."

**BTC-m5 — The open fee point leans toward one side (Minor)**
- **Guide.** L77: "The general rule in the fee selection contract, and the settled fee-selection decision, say that … the 200 level is used …"
- **Owner.** Snapshot `domain.md` "## Choices And Rationale" calls this an "Unresolved source conflict" between the IFACE-007 payload together with TICKET-0018, and the IFACE-007 ACT-002 fail-closed result.
- **What is wrong.** Calling TICKET-0018 "the settled … decision" adds status weight to one side. The guide still ends with "A reader should treat this case as undecided", so the conflict is reported. This is not Critical.

**BTC-m6 — The figure states 18 without the conflict note (Minor)**
- **Guide.** Figure L43: "Build exit set | Eighteen exit transactions for the confirmed escrow only."
- **What is wrong.** The stale "12" sentence is flagged in the body (L34, L76) but not in the callout, which 4.1(5) says must be read on its own.

**BTC-m7 — A behavior statement comes only from a workflow record (Minor)**
- **Guide.** L53: "The levels are target fee classes, not guaranteed minimum rates."
- **Source.** The statement exists only in TICKET-0077 (`build/workflow/tickets/.../sr-002-transaction-construction-contract-tickets.yaml`) and `decision-overview.md`. No system-model owner holds it.
- **What is wrong.** The statement is not contradicted, but a workflow record is restated as behavior (README: "durable behavior and rationale live with their canonical owners").

**BTC-m8 — The handoff wording is one-directional (Minor; v2 P-6)**
- **Guide.** L26: "It gives the product workspace unsigned transactions to present for signing."
- **Owner.** `iface-004-...md`: "the Vault never signs bytes supplied only by the normal-product page".
- **What is wrong.** L31 correctly says the Vault "signs exactly that batch". However, the guide never says that the Vault independently reloads the batch.

**Verified correct, no defect.**
- Package inventory and signing split (L30, L34; SR-002, FLOW-002 steps 6–9, INV-026).
- Zero-confirmation boundary (L30, L32; INV-015).
- Signing order and the receipt rule (L31).
- Parent mutation and reorg (L50; INV-016).
- T and B timing and the race (L51; INV-008, CONS-027).
- Long-stop retrofit ban (L14; CONS-027).
- P2A families (L53; INV-010).
- CPFP operator, helper and Core split (L53; IFACE-016, including "same operator-controlled machine").
- Relay ambiguity (L54; SR-002).
- Authority boundaries (L58; SR-002 "## Must Not Own").
- Choice rationales (L64–66; snapshot domain "## Choices And Rationale").
- Fee attribution (L70): TICKET-0018 records the tiers as user-specified and the strict rule as agent-recommended and human-approved. TICKET-0064 and TICKET-0089 record agent-chosen application of the rule to activation and refund.
- Exclusions (L79).

### 1.2 Must-preserve facts

| Fact | Status | Note |
| --- | --- | --- |
| B-1 | Preserved | L7 |
| B-2 | Preserved (S gate missing, see M3) | L11–16 |
| B-3 | Preserved | L30, L32 |
| B-4 | Preserved | L30 |
| B-5 | Preserved, with conflict note | L34, L76 |
| B-6 | **Missing** | M1 |
| B-7 | Preserved | L31, L49 |
| B-8 | Preserved | L50 |
| B-9 | Preserved | L26 ("finalized public X and Y"), L35, L51 |
| B-10 | Preserved | L51 |
| B-11 | Preserved | L24, L79 |
| B-12 | Weakened | m4 |
| B-13 | Weakened | M4 |
| B-14 | Weakened | m3 |
| B-15 | Weakened | M2 |
| B-16 (v2) | **Missing** | m1 |

10 of 16 are preserved (63%).

### 1.3 Open and unresolved points

- **2h-2 (package count).** Reported correctly, with both sides and "Neither is decided here" (L74–76). The figure lacks the note (m6).
- **2h-3 (no qualifying fee tier).** Both sides are given and the point is called undecided. There is a tilt in wording (m5). The estimator-outage case is not merged; it is absent (M4).
- **2h-6 (H(S) binding).** L13, "for loans created with that capability", is an accepted treatment.
- **Steps narrated for other domains.**
  - Base acceptance (L33) is correct on finality.
  - The S trigger (L13) is imprecise (M3).
  - The ECVS gate is absent (M3).

### 1.4 Verdict

**FAIL.** There are 0 Critical and 4 Major defects (v1 4.7 allows at most one Major). Facts preserved are 63%, against a 90% threshold.

v2 acceptance blockers are confirmed:
- material omitted residual risks (activation-pending exposure, post-confirmation signing window);
- the omitted fallback gating condition.

In a guide-only reading, a reader would miss Q-B3 and Q-B9 and answer Q-B7 and Q-B8 only in part. That leaves about 5 of 9 correct, below the required 6 of 8.

---

## 2. Base USDC Settlement And Funding guide

### 2.1 Defects

**SET-C1 — Upgrade governance during the beta is stated as settled, and the other side is recast as silence (Critical under v2 2h-5: "states either side as settled")**
- **Guide, L60.**
  - "That administration has one ownership path. During local and test use and an intentionally short public beta on the main network, a single dedicated upgrade key controls upgrades. After the beta, that same sole ownership moves to a multi-signature wallet."
  - Later: "the upgrade boundary and the deployment and upgrade state describe only the Safe arrangement and do not mention the beta key, and the deployment state and the Base governance security record rule out an unrestricted unilateral upgrade key. Whether the beta key counts as such a key is not stated, so this point is open."
- **Owners on the other side.**
  - `inv-020-base-upgrade-boundary.md` "## Rule": "V1 retains the Transparent ProxyAdmin controlled by a 2-of-3 Safe through a seven-day timelock."
  - `sr-003-...md` "## Owns": "Transparent Proxy administration retained under a 2-of-3 Safe-controlled seven-day timelock". The guide does not cite this side.
  - `scope-007-...md` "## Boundary": "V1 retains the Transparent ProxyAdmin under the 2-of-3 Safe-controlled seven-day timelock". The guide does not cite this side either.
  - `state-019-...md` "## Transitions": "Current V1 posture | … Transparent ProxyAdmin remains Safe/timelock controlled".
  - `sec-017-...md` "## Prohibited Authority": "No unilateral upgrade/admin/opener/pause key may … bypass the timelock/Safe". SEC-017 L51: "STATE-019 and INV-020 own the selected V1 Safe/timelock/proxy posture".
- **What is wrong (changed meaning, unresolved point presented as settled).**
  - The beta single key (SEL-009 and TICKET-0048) is narrated as the governance in force. The opposing owners do more than "describe only the Safe arrangement": they say V1, which includes the public mainnet beta, *retains* the Safe and timelock.
  - The guide reduces the open question to whether the beta key is "unrestricted". SEC-017's prohibition covers any unilateral key that bypasses the Safe or timelock, and a sole beta key does that by construction.
  - A guide-only reader would answer Q-S8 "a single key during the beta, then the Safe", which is the outcome v2 lists as a defect.
- **Severity.** Critical under v2 2h-5. The guide does declare a point open, so the coordinator could score this as Major (changed meaning) instead. Even then the guide still fails.
- **Related observation on the technical records (out of this review's scope).** The migrated `base-usdc-settlement-and-funding/domain.md` "## Choices And Rationale" now records only SEL-009's beta-key path as the domain's choice, with no conflict note. Pre `domain.md` L35, which v2 lists as a Side B source, said the main contract "retains its explicit Transparent Proxy administration, 2-of-3 Safe, seven-day timelock". This looks like one side of 2h-5 being rewritten in a technical record, which v2 part 5 treats as an unauthorized technical change. The technical-diff review should confirm it.

**SET-M1 — The fallback is described without either condition (Major: v2 O-16, "vague quantifier … in place of those conditions"; v2 2g)**
- **Guide.** L45: "The finalized refund event is the only positive Base trigger for the separate fallback that might publish a secret to complete Bitcoin recovery."
- **Owners.**
  - `flow-005-...md` "## Failure And Reroute": "`FLOW-006` is available only for a loan created after the ECVS production-activation gate, with committed `H(S)` and matching public `S`."
  - `inv-025-...md` "## Rule": "borrower Bitcoin recovery through `S` exists only for a loan created after the ECVS production-activation gate".
- **What is wrong.** Neither H(S)-at-creation nor the production gate appears anywhere in the guide. "Might" stands in for both.

**SET-m1 — Repayment validity omits Base L1 finality (Minor: weakened S-7)**
- **Guide.** L29: "A sufficient balance is necessary but is not repayment; the exact debt must be finalized no later than D." The figure (L37) also omits finality.
- **Owner.** `inv-006-valid-repayment.md` "## Rule": "… no later than `D` and the canonical `Repaid` event reaches Base L1 finality."
- **What is wrong.** L22 says events are "qualified" by the observation domain, which softens this, but the stated validity rule is incomplete.

**SET-m2 — The refund's indefinite availability and its independence from the ECVS are not stated (Minor: weakened S-10; v1 2d assigns this to the Base guide)**
- **Guide.** L45: "The exact unclaimed repayment becomes refundable once, by anyone, to the frozen borrower address."
- **Owners.**
  - `sr-007-...md`: "The refund remains available indefinitely and never waits for this service."
  - `iface-017-...md` "## Boundary": "It is not required for and must never gate the Base refund."
  - `flow-005-...md` step 2: "permit fixed-effect refund indefinitely".

**SET-m3 — Ordinary default classification is only partly carried (Minor: weakened S-14)**
- **Guide.** L52: "missing Y or lender silence never counts as … default".
- **Owner.** `flow-008-...md` step 3: "Classify ordinary non-payment for product routing … Classification does not bypass Bitcoin MTP, sign, select, or broadcast a lender package".
- **What is wrong.** The guide does not cover classification from canonical Base facts, or that classification triggers no enforcement.

**SET-m4 — "No delegated acceptance" is implied only (Minor: S-6, SCOPE-003)**
- **Guide.** L28: "The borrower intentionally reveals X through the borrower's Vault."
- **Owner.** `scope-003-...md` "## Boundary": "V1 has no company-held `X`, automatic secret reveal, delegated acceptance, or company activation authority".

**SET-m5 — The activation-pending lender exposure is not mentioned (Minor for this guide)**
- **Guide.** L28 says acceptance "pays the principal and leaves Bitcoin activation pending".
- **What is wrong.** The guide does not say that the lender is unsecured if the prefund refund confirms first (SEC-023). This is primary for the Bitcoin guide, but this guide narrates the moment the principal leaves.

**SET-m6 — An interpretive reconciliation is added (Minor)**
- **Guide.** L67: "These fit if the originating contract means the proxy and its recorded deployment identity, and the immutable-conversion scope speaks only of a future new deployment, but no record says whether a code-path change counts as reinterpreting an existing loan."
- **What is wrong.** Both sides and the open status are kept, as v2 requires. The "These fit if …" gloss, however, is the guide's own reading and has no owner.

**Verified correct, no defect.**
- Vault properties (L11; SR-003 "## State And Artifacts").
- Payer neutrality (L13).
- C and T values (L14).
- Permissionless calls (L18).
- SR-005 presentation and lender control (L20).
- 24-hour window and acceptance limits (L26–27).
- Claim strictly before C, paid once to the fixed recipient (L30).
- Expiry and unaccepted refunds to the lender settlement recipient (L43; IFACE-009 L31, L33).
- Refund switch, including the "access concern" reason (L44; FLOW-005 step 1: "Optional borrower access concern").
- Fallback trigger and non-triggers (L45).
- Excess, late and other-token handling (L46; IFACE-011, SEL-022 "may remain stuck").
- Operators (L48).
- Authority boundaries (L52).
- Payment account (L54).
- Strength of the upgrade claim (L58; SEC-017 L36).
- Governance attribution (L60; TICKET-0048).
- Operational pause (L62; SEL-009).
- On-chain pause tension (L66): accepted under v2 2h-8.
- Deferrals (L71).

### 2.2 Must-preserve facts

| Fact | Status | Note |
| --- | --- | --- |
| S-1 | Preserved | L7 |
| S-2 | Preserved | L11–12 |
| S-3 | Preserved | L13 |
| S-4 | Preserved | L20 |
| S-5 | Preserved | L26, L43 |
| S-6 | Weakened | m4 |
| S-7 | Weakened | m1 |
| S-8 | Preserved | L30 |
| S-9 | Preserved | L44 |
| S-10 | Weakened | m2 |
| S-11 | Preserved (the fallback conditions are missing, see M1) | L45 |
| S-12 | Preserved | L18, L47 |
| S-13 (v2-amended) | **Contradicted** on beta governance (C1); the rest preserved | L58–67 |
| S-14 | Weakened | m3 |
| S-15 | Preserved | L54, L71 |

10 of 15 are preserved (67%).

### 2.3 Open and unresolved points

- **2h-5, governance.** Defective (C1).
- **2h-5, running loans.** Both sides given and open; adds a gloss (m6).
- **2h-8, on-chain pause.** Accepted treatment.
- **2h-7, who may reveal.** No exclusive-caller claim, so no defect.
- **2h-2 and 2h-3.** Not reached.
- **Bitcoin steps narrated here.**
  - Activation pending and active only after confirmed evidence plus a stored exit set (L28): correct.
  - Fallback availability (L45): defective (M1).

### 2.4 Verdict

**FAIL.**
- There is 1 Critical defect (2h-5 settled on one side) and 1 Major (O-16 conditions).
- Facts preserved are 67%.
- v2 blockers are confirmed: an owner contradiction (C1) and a material omitted condition (M1).
- A guide-only reader would get Q-S8 wrong and answer Q-S2 and Q-S4 only in part.

---

## 3. Base Observation And Fallback Review guide

### 3.1 Defects

**OBS-m1 (borderline Major) — The four lookup outcomes and "empty is not withholding" are missing (O-13 missing)**
- **Guide.** L46: "If the service is interrupted, publication can still be recovered later through independent verification and public replay of the same committed S." The guide does not distinguish lookup results at all.
- **Owners.**
  - `sr-007-...md`: the public lookup "distinguishes no publication yet, a valid publication, invalid or mismatched evidence, and an unavailable source. An empty or unreachable response is not proof that the service deliberately withheld S. The product receives public metadata and the commitment-match conclusion".
  - `iface-017-...md` ACT-002: "Empty is not a negative event; stale/unavailable/mismatched/duplicate source cannot be inferred as released or withheld."
- **What is wrong.** A reader cannot answer the second bullet of Q-O8. This is part of the 2d failure boundary. It is scored Minor here because no listed "dangerous" answer follows from the gap; a stricter reading would count it as Major.

**OBS-m2 — The ECVS check list is summarized, not given in full (Minor: weakened O-11; 4.5 lets only the Architecture guide summarize it)**
- **Guide.** L31: "It independently checks the configured Base deployment, the loan, the exact refund event, the amount, the frozen recipient, provenance and L1 finality."
- **Owner.** `sr-007-...md` "### From an unclaimed repayment to public S": "configured chain, deployment and current implementation, event signature, loan, transaction and log, block canonicality, finality, exact debt and frozen recipient".
- **What is wrong.** "Current implementation" and "canonicality" are missing.

**OBS-m3 — The Bitcoin finalization check list is summarized (Minor: weakened O-12)**
- **Guide.** L31: "Bitcoin finalization separately checks the publication, the commitment, the existing signatures and that the escrow is still unspent".
- **Owner.** `sr-007-...md`: "validates the activation gate, public source and event binding, matching hash, exact retained recovery package, signature, fixed outputs and still-unspent escrow".
- **What is wrong.** The activation gate, the retained package and the fixed outputs are missing from the list. The gate itself is covered at L38 and L44.

**OBS-m4 — The two Base provider failures are merged and alert timing is dropped (Minor: v2 O-4 says merging is Minor)**
- **Guide.** L17: "If both are unavailable, or they disagree, existing final status stays visible while new consequential actions that depend on Base are blocked."
- **Owner.** `sel-014-...md`:
  - for a conflict, a "`base-observation-conflict` … alert operations until canonical replay resolves it";
  - for a dual outage, "show fresh Base data as delayed, alert operations after five minutes".

**OBS-m5 — Bitcoin escalation timing is omitted (Minor: weakened O-6)**
- **Guide.** L19 does not include "escalates after five minutes or one missed Bitcoin block" (`sr-006-...md` "## Failure And Recovery").

**OBS-m6 — Minor omissions in O-8 and O-10.**
- 32-byte S, and "no provider-wide master secret" (`sr-007-...md` "## Owns"; `iface-017-...md` payload).
- "A resolved technical ticket does not satisfy that gate" (`sr-007-...md`).

**OBS-m7 — The one-provider rule is presented as open (Minor, but see answer-key note K-1)**
- **Guide.**
  - L17: "The provider security record says that no one source may become authoritative chain state, and how that fits the one-provider rule is not stated, so this point is open."
  - L58 repeats the point.
- **Owners.**
  - `sec-020-...md` "## Prohibited Authority": "No one source, nominally independent but shared upstream, … may become authoritative chain/lifecycle state". It also says "One false source should only create provisional display or block progress."
  - SEC-020's own "## Required Controls" rule says: "IFACE-012/STATE-014 own Base failover".
- **What is wrong.** The tension is real in the text and correctly sourced. However, the guide does not mention that SEC-020 itself delegates Base failover to the owners of the one-provider rule. A reader may doubt the settled O-4 rule.

**Verified correct, no defect.**
- Two responsibilities and their non-authority (L9).
- The observed, safe and L1-finality states, including "two Ethereum epochs" (L13; SEL-013).
- The "roughly 20 minutes" figure with its no-promise caveat (L56). SEL-013 records it as Base's documentation; it is not invented.
- Ingestion, acknowledgement and cursor (L15; SR-006, SEL-015).
- Reorg correction and operator recheck (L17).
- Bitcoin agreement rule (L19).
- Payment evidence (L21).
- C, freeze, refund, the switch reason, and that the refund never waits (L27).
- ECVS identity and precommitment (L29).
- Same transaction, no new signature, and three separate steps (L31).
- Figure conditions (L38–39).
- Production gate, no retrofit, no rotation, and risks (L44).
- Non-triggers and residual routes, including the long-stop and "first confirmed wins" (L46).
- Long-stop inconsistency (L48). Accurately sourced: INV-025, FLOW-005, FLOW-006 L33, FLOW-007 L33 and SEC-024 all omit the long-stop, while CONS-027, SR-007, STATE-015 and SEC-025 include it.
- Authority (L52).
- Choices (L56–59).
- Exclusions (L65).

### 3.2 Must-preserve facts

| Fact | Strict | Lenient |
| --- | --- | --- |
| O-1 | Preserved | Preserved |
| O-2 | Preserved | Preserved |
| O-3 | Preserved | Preserved |
| O-4 | Weakened (m4, m7) | Preserved |
| O-5 | Preserved | Preserved |
| O-6 | Weakened (m5) | Preserved |
| O-7 | Preserved | Preserved |
| O-8 | Weakened (m6) | Preserved |
| O-9 | Preserved | Preserved |
| O-10 | Weakened (m6) | Preserved |
| O-11 | Weakened (m2) | Weakened |
| O-12 | Weakened (m3) | Weakened |
| O-13 | **Missing** (m1) | Missing |
| O-14 | Preserved | Preserved |
| O-15 | Preserved | Preserved |
| O-16 (v2) | Preserved (L38, L44, L46) | Preserved |

Preserved: 9 of 16 strict (56%), 13 of 16 lenient (81%).

### 3.3 Open and unresolved points

- **Fallback status (2d and 2g).** Correct: "selected", gated, "not activated" (L44, L65).
- **2h-4, long-stop.** The guide includes the long-stop and correctly reports the records' inconsistency as open.
- **Base settlement steps narrated here (claim strictly before C, the switch, the refund).** Correct.
- **2h-3 and 2h-5.** Not reached.

### 3.4 Verdict

**FAIL, narrowly.**
- There are 0 Critical defects and 0 confirmed Major ones (m1 is borderline).
- No v2 blocker is confirmed: there is no owner contradiction and no material omitted condition.
- The guide fails v1 4.7's 90% fact rule on either count. The main causes are the summarized check lists (4.5 requires them in full in this guide) and the missing lookup-outcome distinction.
- A guide-only reader would answer about 7 of 8 questions; Q-O8 would be partial.
- Restoring O-11, O-12 and O-13 in full would bring the guide to 94% on the lenient count, and it would pass.

---

## 4. Cross-guide v2 part 5 checks

| Check | BTC | SET | OBS |
| --- | --- | --- | --- |
| 2h-5 upgrade governance open | not reached | **defect (C1)** | not reached |
| A-16/B-16 no redirection | **missing (m1)** | n/a | n/a |
| O-16 both fallback conditions | **missing gate (M3)** | **missing both (M1)** | correct |
| P-6 handoff authority | one-directional wording (m8) | not described | not described |
| B-12 what each confirmation permits | X correct; Y implied, clearing missing (m4) | reveal not detailed (n/a) | n/a |
| 2g status distinctions | ECVS status absent (M3) | ECVS status absent (M1) | correct |

---

## 5. Notes on the answer key (v3 candidates)

- **K-1. A provider-rule tension is missing from 2h.** SEC-020 "## Prohibited Authority" says "No one source … may become authoritative chain/lifecycle state", and its consequence says "One false source should only create provisional display or block progress". SEL-014 and SR-006 instead let "one healthy provider" suffice for a finalized Base fact. SEC-020's control rule delegates Base failover to IFACE-012/STATE-014, so the two can be reconciled, but the text is in tension.
  - The key treats O-4 as settled and does not mention SEC-020.
  - Suggestion: add a 2h entry classified as a tension. A guide that reports it, or states O-4 with the delegation, would be accepted; a guide that says "two Base providers must agree" would remain a defect.
- **K-2. The 2h-4 long-stop omission is broader than the key records.** The key names only FLOW-005. INV-025 "## Rule", FLOW-006 "## Failure And Reroute", FLOW-007 L33 ("Parties may use `FLOW-009` if both consent") and SEC-024 (THREAT-001 consequence) also leave the long-stop out. SEC-024 also says "A loan without the production-activated `H(S)` capability has no borrower fallback Bitcoin route." The OBS guide's treatment is better sourced than the key.
- **K-3. 2h-5 is missing Side B sources.**
  - STATE-019 "## Transitions" ("Current V1 posture … Transparent ProxyAdmin remains Safe/timelock controlled").
  - SEC-017 L51 ("STATE-019 and INV-020 own the selected V1 Safe/timelock/proxy posture").
  - SEC-017 L55 prohibits *any* unilateral key that bypasses the Safe or timelock, not only an "unrestricted" one. v2's statement that "Whether SEL-009's beta key is the 'unrestricted unilateral' key … is not stated" understates SEC-017 L55.
- **K-4. The finality waiting time.** v1 4.6 forbids invented finality waiting times. SEL-013 L15 records "roughly 20 minutes" as Base's documentation. A guide that attributes the figure and says it is not a promise should be accepted, and the key should say so.
- **K-5. Migrated technical records affect the 2h citations.**
  - The snapshot Base `domain.md` "## Choices And Rationale" now records SEL-009's beta-key path without a conflict note, which replaces pre L35's Safe-retained statement (see SET-C1).
  - The snapshot Bitcoin `domain.md` drops pre L33's "action contract and former decision say fail closed" and names TICKET-0018 as support for the 200-tier side.
  - The first change looks like an unauthorized technical change under v2 part 5. The second is arguably a correction, because the key itself could not identify the "former decision".
  - Both belong to the technical-diff review.
- **K-6. A fact sits only in workflow records.** "Target fee classes, not strict minimum feerate guarantees" (TICKET-0077 and the decision overview) has no system-model owner. The key does not cover it, and guides restate it (BTC L53).
