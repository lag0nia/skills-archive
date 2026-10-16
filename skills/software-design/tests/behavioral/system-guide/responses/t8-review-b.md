# T8 Review B: semantic fidelity of three System Guide domain files

## Scope and method

Package reviewed (read only, nothing changed): `scratchpad/eval/snap-t8/bitrise21/loan-system/design/technical-design` (below, `PKG/`).
Pre-migration copy: `scratchpad/eval/pre/bitrise21/loan-system/design/technical-design` (below, `PRE/`).
Answer key: `scratchpad/eval/expectations/expectations.md` (below, "the key").

Guides reviewed:

- `PKG/guide/domains/bitcoin-authorization-and-recovery.md` (below, "BTC guide")
- `PKG/guide/domains/base-usdc-settlement-and-funding.md` (below, "Base guide")
- `PKG/guide/domains/base-observation-and-fallback-review.md` (below, "Obs guide")

How each guide was reviewed:

1. I read every sentence, figure, caption and callout. Each substantive claim was checked against its owner records in `system-model/`, `build/` and the tickets. The owners read include:
   - responsibilities: SR-002, 003, 004, 005, 006, 007, 009;
   - flows: FLOW-001 to 010;
   - invariants: INV-003, 004, 006, 007, 008, 010, 011, 015, 016, 018, 020, 024, 025, 026;
   - interfaces: IFACE-007, 009, 012, 017, 020, 022;
   - states: STATE-007, 011, 013, 014, 019, 021;
   - security records: SEC-013, 023, 024, 025;
   - scope records: SCOPE-001, 002, 003, 005, 006, 007, 011, 012;
   - build records: SEL-009, SEL-013, SEL-014, SEL-015, CONS-011, `build/workflow/handoffs/README.md` and `build/workflow/decision-overview.md`.
2. I graded each key fact (part 1) as Preserved, Weakened, Missing or Contradicted. I checked every part-2 distinction that names the guide, and every 2h conflict the guide touches.
3. I answered the part-3 questions as a reader who has only the guide.
4. I graded defects under key §4.2–4.4 and applied the §4.7 pass rule.
5. I diffed the PRE and PKG domain records and `architecture.md` to check that every removed fact still has a technical owner.

Line numbers refer to the PKG guide files.

## Verdict summary

| Guide | Critical | Major | Facts Preserved | Contradicted | Comprehension (of 8) | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| BTC guide | 0 | 0 | 13/15 (86.7%) | 0 | 6 full, 1 partial, 1 wrong | **FAIL**: below the 90% fact threshold only |
| Base guide | 0 | 2 | 14/15 (93.3%) | 0 (see S-13 note) | 6 full, 2 partial | **FAIL**: two Majors |
| Obs guide | 0 | 1 | 11/15 (73.3%) | 0 | 5 full, 3 partial (about 6–7) | **FAIL**: below the 90% fact threshold; one Major |

None of the three guides passes. Each has a short, concrete fix path, listed in the section for that guide.

---

## 1. BTC guide: Bitcoin Authorization And Recovery

### 1.1 Defects

No Critical defects and no Major defects. The guide is accurate on:

- the 12+6 / 18 package counts, with the stale 12 flagged (line 52, line 101);
- the no-tier fee conflict, both sides with "does not choose" (line 79);
- activation pending, not active, with lender exposure (line 72);
- one transaction completed with Y or S (line 67);
- first confirmed spend wins (line 49, line 67);
- no Base revocation (line 67);
- lender export only (line 65, line 89);
- no forgotten-password recovery (line 28, line 80);
- the residual missing-Y risk, gated on the production gate (line 104).

The status sentences the guide adds are each backed by an owner:

- Line 24 "implementation has not yet been delivered" and line 36 "earlier delivery evidence does not verify it". Owners: `build/workflow/handoffs/README.md` "## Current bounded planning overlay — ACT-009 and initial zero construction"; INV-015 "## Rule".
- Line 74 "The design explicitly accepts this window". Owner: INV-026 "## Violation Meaning".
- Lines 7 and 28 on one leaked key. Owner: SEC-013.

Minor defects (recorded; none fails the guide):

| # | Guide sentence | Owner (file, section) | What is wrong | Severity |
| --- | --- | --- | --- | --- |
| BTC-m1 | Line 7: "stores them safely, and later broadcasts only the one that current chain evidence justifies." | SR-009 "## Owns" (lender route is exported); SCOPE-001 "## Boundary"; FLOW-007 step 3 | Read alone, this says the domain broadcasts every route. The lender route is only exported and broadcast externally. Lines 65 and 89 correct this, so meaning is restored within the guide. | Minor |
| BTC-m2 | Line 16: "The lender's recovery becomes valid at T, three days after D; the borrower's long-stop becomes valid at B" | INV-008 "## Rule": valid only after Bitcoin median-time-past passes D + 259,200 s / D + 864,000 s | "At" in place of "after MTP passes". The same line names consensus median time, and the table and line 65 say "After T" and "passes T", so the value is not wrong. Strictness is softened only in this sentence. | Minor |
| BTC-m3 | Line 79: "select the 200 satoshi variant, record that a fee-bump is needed and alert" | IFACE-007 "## Payload Or Artifact": "select 200 sat/vB, record CPFP eligibility, and alert for separate manual IFACE-016 approval" | "Fee-bump is needed" is stronger than "CPFP eligibility", and the manual-approval qualifier is dropped. Both sides of the conflict and the undecided status are kept. | Minor |
| BTC-m4 | Table, line 60: "Borrower recovery … Usable when: Y or S is public" | IFACE-020 "## Boundary": "Only a canonical finalized public secret event may cross"; INV-025 | The table cell drops "final" and drops the activated-loan condition for S. Line 65 states both ("public and final on Base … for a loan with the activated fallback"). | Minor |
| BTC-m5 | Line 15: "The lender's secret Y enables the borrower's normal recovery after the lender claims repayment." | INV-004 "## Rule" (Y enables only the fixed claim and normal borrower recovery) | This omits that revealing Y is also the lender's claim action on Base. Line 26 restores it ("revealing Y to claim repayment"). | Minor |
| BTC-m6 | Lines 15, 65, 104 ("once the capability is activated", "the activated fallback", "after its production gate") | SR-007 "### Establishing the capability before a loan exists"; STATE-007 "## States" (starts at Production unavailable) | The guide says S applies only after the production gate. It never says the gate is currently unsatisfied, and the sources record no counsel approval (key 2d silence). "Activated" for the capability is used beside "activation" for the escrow transaction; the subject ("capability", "fallback") disambiguates, but only lightly. | Minor |
| BTC-m7 | Line 78: "picks the lowest signed variant strictly above the current fee estimate increased by 25 percent" | IFACE-007 "### ACT-002" and "## Payload Or Artifact" (fresh, normalized one-block estimate; integer arithmetic) | "Current" stands in for "fresh normalized one-block". Line 97 restores integer units, fresh estimates and the strict buffer. | Minor |

### 1.2 Key facts (part 1.3)

| Fact | Status | Evidence / gap |
| --- | --- | --- |
| B-1 prefund vs escrow; package is prior authorization; consensus decides | Preserved | Lines 3, 12, 13 |
| B-2 single role per secret; no organization key | Preserved | Lines 15, 18, 67 (Y's claim role at line 26) |
| B-3 zero-conf construction and signing; six confirmations for window, acceptance gate and reliance | Preserved | Lines 36, 38 |
| B-4 6+6 initial at 10–200; borrower signs 12, lender 6 | Preserved | Lines 14, 36 |
| B-5 18 terminal, only for the actual winner; signing split 12/6; stale 12 flagged | Preserved | Lines 40, 44, 52, 73, 101 |
| B-6 activation pending; non-atomic; lender unsecured | Preserved | Line 72 |
| B-7 fixed signing order; receipt never an input; terminal-signing-pending, not reversible | Preserved | Lines 37, 74 |
| B-8 changed or lost parent invalidates descendants; reorg of same parent only pauses | Preserved | Line 75 |
| B-9 same borrower-signed transaction with Y or S; final only on confirmation | Preserved | Lines 41, 65, 67 |
| B-10 T and B after MTP; lender route never cancelled; first confirmed wins; Base cannot revoke | Preserved | Lines 16, 65, 67 (see BTC-m2) |
| B-11 lender package by manual export or external broadcast only | Preserved | Lines 61, 65, 89, 102 |
| **B-12 two-confirmation disclosure of X/Y** | **Weakened** | Line 24 says only "performs the two-step acceptance that reveals X on Base". Line 26 says only "revealing Y to claim repayment". Missing: the first confirmation covers nonsecret facts and authorizes only local preparation; an isolated worker freezes the exact bytes; the second confirmation is bound to those bytes and authorizes signing and submission; plaintext is cleared on failure; the same two-step applies to Y. Owners: SR-004 "## Owns" ("Acceptance first confirms only the canonical nonsecret facts, then an isolated worker minimally unlocks `X` … and only a second confirmation bound to those exact bytes authorizes local signing/submission"); SR-009 "## Owns" ("Plaintext and the worker/session clear on every terminal attempt outcome"). |
| **B-13 fee rules** | **Weakened** | The six tiers, strict 1.25, integer arithmetic, fee-bump child from the fee wallet with no participant authority, and the no-tier conflict are present. Missing: the estimator-outage rule. Owner: IFACE-007 "## Preconditions And Validation": "If no source is usable, the route enters `fee-estimation-blocked` … Manual continuation may record only one existing signed tier". |
| B-14 cooperative settlement: fresh agreement and signatures, no reuse, operations deferred | Preserved | Lines 63, 65, 103 |
| B-15 no password recovery; what is blocked vs still usable; signing window as residual risk | Preserved | Lines 28, 74, 80 |

Result: 13/15 = 86.7% Preserved, none Contradicted. **This is below the 90% threshold.**

### 1.3 Distinctions and conflicts

- 2c refund vs recovery: carried (line 71 prefund refund; lines 88, 104).
- 2d fallback: the guide carries same transaction, no new signature and production-gated S (lines 15, 67, 104). Current unavailability is not stated (BTC-m6).
- 2e publication / broadcast / confirmation: carried (lines 41, 49, 76, 88).
- 2h-2 package count: both sides and "awaits a separate repair" (line 52, line 101). Pass.
- 2h-3 no-tier fee: both sides and "does not choose" (line 79). Not merged with the estimator-outage case, because that case is absent (see B-13). Pass.
- 4.6 boundary requirement: "Base cannot revoke signatures" (line 67) and "fallback is production-gated" (line 104) are both present.

### 1.4 Comprehension (guide-only reader)

| Question | Result |
| --- | --- |
| Q-B1 | Correct |
| Q-B2 | Correct |
| Q-B3 | Correct |
| Q-B4 | Correct |
| Q-B5 | Correct |
| Q-B6 | **Wrong**. The guide gives only "two-step". The reader cannot say what each step allows, and nothing exists for Y. |
| Q-B7 | **Partial**. The estimator-outage block is missing. |
| Q-B8 | Correct |

Score: 6 of 8 correct (threshold met), with no dangerous answer traceable to the guide.

### 1.5 Verdict: FAIL (86.7% fact preservation; every other criterion is met)

To reach a pass:

- **B-12:** add one sentence to the SR-004/SR-009 paragraphs: "Revealing X or Y takes two confirmations. The first covers only the nonsecret facts and authorizes only local preparation; an isolated worker then freezes the exact transaction; the second confirmation, bound to those exact bytes, authorizes signing and submission. Any failure clears the plaintext."
- **B-13:** add to "Fees spike": "If no fee estimator is usable, the route is blocked; manual continuation may only record one existing signed variant."

These two changes bring the guide to 15/15.

---

## 2. Base guide: Base USDC Settlement And Funding

### 2.1 Defects

No Critical defects. "Atomically" (lines 20, 32) is used only for the Base acceptance call, which key §4.6 allows.

**Major A: the production-activation condition on the fallback is omitted, and the residual risk is understated.**

Guide sentences:

- Line 55: "The finalized refund event is the only positive trigger for the conditional Bitcoin fallback"
- Line 60 (callout): "Whether it returns depends on the routes described in the Bitcoin Authorization And Recovery guide, and for many loans that remains a recorded residual risk."

Owners:

- SEC-024 "## Honest Capability Claim": "Bitcoin collateral remains exposed for every loan without an activated `H(S)` capability and until an `S` recovery confirms".
- INV-025 "## Rule": "borrower Bitcoin recovery through `S` exists only for a loan created after the ECVS production-activation gate … the selected technical specification alone does not make the selected route available without counsel approval and implementation evidence."
- FLOW-005 "## Failure And Reroute": "After finalized refund, `FLOW-006` is available only for a loan created after the ECVS production-activation gate, with committed `H(S)` and matching public `S`."
- INV-007 "## Rule" ("production-activated ECVS `S`").

What is wrong:

- The guide never says the fallback applies only to loans created after the production-activation gate, or that the gate is not yet satisfied. The word "conditional" is never explained.
- "For many loans" understates the owners' "every loan without an activated `H(S)`". No loan currently has one.
- A reader of the callout alone would infer that most loans have a working fallback.

Severity: **Major** (§4.3, "only for loans created after the activation gate" omitted, plus understatement of the missing-Y residual risk). It is near the Critical availability-overclaim line, but the guide never says the fallback is available.

**Major B: the upgrade governance is adopted from SEL-009 against the canonical system model, without flagging the inconsistency, and the preservation constraint is omitted.**

Guide sentence (line 77): "The main contract stays upgradeable through a proxy with one ownership path: a dedicated single upgrade key for local and test use and the intentionally short public mainnet beta, after which the same sole ownership moves to a two-of-three multisignature behind a seven-day public timelock for the rest of the first version. … but an approved upgrade changes the code for every loan that deployment holds."

Owners that contradict the guide:

- INV-020 "## Rule": "V1 retains the Transparent ProxyAdmin controlled by a 2-of-3 Safe through a seven-day timelock. Upgrades and administration must preserve fixed-recipient/lifecycle authority and originating-loan identity; existing loans remain on their originating contract and are not silently migrated."
- SR-003 "## Owns": "Transparent Proxy administration retained under a 2-of-3 Safe-controlled seven-day timelock".
- STATE-019 "## Invalid Transitions": "Unrestricted unilateral upgrade/admin key, retroactive mutation/migration of existing loans"; "## Transitions": "Do not migrate or reinterpret existing originating loans."

Owners that support the guide:

- `build/records/selections/sel-009-base-contract-upgrade-governance.md`: "a dedicated single upgrade key for local/test and the intentionally short public mainnet beta, followed by transfer of that same sole ownership to a 2-of-3 multisig-controlled timelock"; "uniform behavior across existing records".
- `build/workflow/decision-overview.md` (around line 133), a human-approved single beta key.
- The post-migration Base `domain.md` "## Choices And Rationale".

What is wrong:

- The sources disagree on whether a single key controls upgrades during the public mainnet beta. The system-model contracts say 2-of-3 Safe with a timelock for V1. SEL-009 and the decision overview say a single key first.
- No owner flags this as a conflict. The guide presents the SEL-009 side as settled. That is a build or workflow record treated as overriding the canonical contract records (§4.3).
- The guide drops INV-020's requirement that upgrades preserve fixed-recipient and lifecycle authority and originating-loan identity. Paired with "an approved upgrade changes the code for every loan that deployment holds", this lets a reader conclude upgrades may change existing loans' recipients or lifecycle, which STATE-019 forbids.

Severity: **Major** (§4.3: workflow and build record over canonical model; condition omitted). Against INV-020 alone, the beta-period statement would be a contradiction. The verdict is FAIL either way.

The PRE Base `domain.md` "## Domain Overview" (line 35) read "retains its explicit Transparent Proxy administration, 2-of-3 Safe, seven-day timelock". The migration introduced the single-key wording into the technical record (see §4).

Minor defects:

| # | Guide sentence | Owner | What is wrong | Severity |
| --- | --- | --- | --- | --- |
| BASE-m1 | Line 31: "records a 24-hour acceptance deadline counted from its own Base block, so part of the period passes before its event is final." | CONS-011 (block.timestamp basis); STATE-011 | The first clause is supported. The "so part of the period passes…" clause is the guide's own inference and is not stated by any owner. It is logically true and harmless. | Minor |
| BASE-m2 | Figure caption: "each event pays a recipient fixed before funding began." | STATE-013 "## Authority And Identity"; SR-003 "## Owns" | Open and Fund events pay no one. The refund recipient may be switched once before C, though only to a committed account. The caption is imprecise, not wrong in direction. | Minor |
| BASE-m3 | Line 30: "Only after six unchanged prefund confirmations, and while at least 67 hours remain …" | FLOW-001 step 9; key 2f | Omits the initial archive receipt and observer agreement from the opening preconditions. The BTC guide line 38 carries them. | Minor |
| BASE-m4 | Lines 9–10: vaults are "immutable" | SR-003 "## State And Artifacts": "immutable, ownerless, nonupgradeable" | "Ownerless" is not stated. Named errors (S-12) are not mentioned (line 53 says only "reverts without effect"). | Minor |
| BASE-m5 | Line 83: "Participants can agree a cooperative Bitcoin spend, but this domain records nothing about it." | SCOPE-005 "## Boundary" (complete Base accounting deferred) | "Records nothing" is stronger than "does not yet provide complete Base accounting". | Minor |
| BASE-m6 | Line 55: "At or after C, anyone may trigger a refund … delayed automation never expires that right." | SR-007 "### From an unclaimed repayment to public S": "The refund remains available indefinitely and never waits for this service"; IFACE-017 "## Boundary" | The guide implies, but never states, that the refund never depends on or waits for the fallback service (key 2d requirement for this guide). Its being the trigger implies the ordering. | Minor |

### 2.2 Key facts (part 1.4)

| Fact | Status | Evidence / gap |
| --- | --- | --- |
| S-1 Base decides USDC; payout reveals a secret, cannot sign, broadcast or confirm Bitcoin | Preserved | Lines 3, 16, 68 |
| S-2 immutable per-loan vaults; transfers provisional until named finalization | Preserved | Lines 9–14 (see BASE-m4) |
| S-3 payer-neutral; recipients fixed from the approved loan | Preserved | Line 12 |
| S-4 lender alone decides; partial deposits; no pooling, custody or automatic draw | Preserved | Line 22, line 84 |
| S-5 24-hour window after qualification; exact principal; expiry, excess and late USDC to lender recipient only | Preserved | Lines 30–31, 51 |
| S-6 at most 24-hour acceptance; borrower's own Vault-signed X; activation pending; no delegated acceptance | Preserved | Lines 32, 37 |
| S-7 valid repayment = exact debt finalized by D at L1 finality | Preserved | Lines 14, 33 |
| S-8 claim strictly before C = D + 172,800 s; pays the fixed recipient once; Y public | Preserved | Line 34 |
| S-9 one irreversible switch before C, only to own protocol account; freezes at C | Preserved | Line 55 |
| S-10 claim impossible at C; refund once, indefinitely, never dependent on the fallback | Preserved | Line 55 (see BASE-m6) |
| S-11 refund event is the only positive trigger; non-triggers; refund is not recovery; T independent | Preserved | Line 55, callout line 60 |
| S-12 permissionless gives no control; invalid call reverts, no event, no value | Preserved | Lines 14, 20, 53 (named error not mentioned) |
| **S-13 upgradeable proxy under 2-of-3 Safe and seven-day timelock; immutable vaults; no pause; exits stay open; no silent migration** | **Weakened** | No pause, exits stay open and no move to another deployment are present (line 77). The 2-of-3 Safe and timelock apply only after a single-key beta, and the INV-020 preservation constraint is missing (Major B). Against INV-020 alone this is a contradiction for the beta period. Because SEL-009 supports the guide's wording, I grade it as an unflagged source inconsistency resolved silently, not as an invented fact. |
| S-14 default classification only from canonical Base facts; valid repayment without claim is never default; no enforcement | Preserved | Line 54 ("ordinary default for product purposes"; T under Bitcoin's own timelock); line 60 |
| S-15 Vault payment account only a payer; participant-transfer purpose cannot advance loan state; cooperative Base accounting deferred | Preserved (thin) | Lines 24, 83, 84. The participant-transfer purpose is not named, but line 14's rule (only the named event counts) covers it. |

Result: 14/15 = 93.3% Preserved, none Contradicted (with the S-13 caveat). Meets the 90% threshold.

### 2.3 Distinctions and conflicts

- 2b application status vs raw transfers vs contract facts: carried (lines 14, 33, 66).
- 2c refund vs recovery: carried, with all three refunds distinguished (lines 30, 51–52, 55, 58–60).
- 2d trigger is a Base fact: carried. "Refund never waits for the fallback": implied only (BASE-m6). Production gate: **missing** (Major A).
- 2e Base submission vs finality: carried (lines 14, 66).
- 2f lender funding control: carried (line 22). What the lender does not control (opener, permissionless finalization, recipients, 24-hour window) is carried at lines 30–31 and 51.
- Vocabulary: "refund" is disambiguated by context ("Bitcoin refund", "prefund refund", "frozen borrower recipient"). "Acceptance" and "activation" are used in one sense only. No collision found.
- 2h conflicts: none touched.

### 2.4 Comprehension

| Question | Result |
| --- | --- |
| Q-S1 to Q-S6 | Correct |
| Q-S7 | **Partial**. The reader learns the refund does nothing to the BTC, but not that the fallback applies only to production-activated loans (none today). |
| Q-S8 | **Partial**. The reader answers "single key during beta, then 2-of-3 Safe with timelock", which differs from INV-020. Not in the "dangerous" list. |

Score: 6 correct plus 2 partial (threshold met).

### 2.5 Verdict: FAIL (two Majors)

Correction notes:

- **Major A:** in line 55 say "the conditional Bitcoin fallback, which exists only for loans created after its production-activation gate and is not available today". In the callout, replace "for many loans" with "for every loan without the activated fallback, which today is every loan".
- **Major B:** either restate INV-020 and SR-003 (2-of-3 Safe with seven-day timelock for V1), or present both SEL-009's beta single key and INV-020/STATE-019 as an unresolved source inconsistency. In both cases add "upgrades must preserve fixed recipients, lifecycle authority and originating-loan identity". The technical record also needs repair (see §4).

Fixing either Major leaves one Major with a correction note, which would pass on the other criteria.

---

## 3. Obs guide: Base Observation And Fallback Review

### 3.1 Defects

No Critical defects. The callout at lines 74–76 states clearly that the fallback "is selected, not available".

**Major C: the activation vocabulary collision in the figure is unexplained.**

Guide sentence: figure step, line 55: "optional: Verify and publish | Only for a loan created after activation: the service verifies independently and publishes S."

Owners:

- FLOW-005 "## Failure And Reroute": "available only for a loan created after the ECVS production-activation gate".
- SR-007 "### Establishing the capability before a loan exists".

What is wrong:

- "After activation" is unqualified. Throughout the system, "activation" names the Bitcoin escrow activation transaction.
- A figure-only reader (key §4.1 step 5) can read this as "every loan whose Bitcoin activated qualifies". That is the "available for all loans" misreading.
- The body uses "activation gate" (line 70), and the callout describes "that gate" without the word "activation". Nowhere does the guide say the two "activations" differ.

Severity: **Major** (§4.3, vocabulary collision "activation"). Fix: "Only for a loan created after the fallback's production-activation gate".

Minor defects:

| # | Guide sentence | Owner | What is wrong | Severity |
| --- | --- | --- | --- | --- |
| OBS-m1 | Line 37: "If both Base providers are unavailable or disagree, … operations are alerted after five minutes" | SEL-014: "If neither source can supply usable data, … alert operations after five minutes"; for a disagreement, "stop new Base-derived … action, and alert operations until canonical replay resolves it"; IFACE-013: "provider conflicts … alert immediately" | Two cases are merged. The five-minute delay belongs only to the dual-outage case; conflicts alert at once. Line 37 also omits replay from the durable cursor after recovery (Q-O3 expected element). | Minor |
| OBS-m2 | Line 80: "that public profile is deferred, and only the local demonstration's profile … is defined." | SR-006 "## Owns": "`public-provider-v1` requires two separately operated allowlisted Base providers plus the observer"; STATE-021 and IFACE-022: "that public quorum is deferred" | "Deferred" is correct. "Only the local profile is defined" is wrong, because the public profile's requirements are defined and its operation is deferred. | Minor |
| OBS-m3 | Line 12: "holds a unique random secret, S, for each eligible loan" | SR-007 "## Owns" and "## Must Not Own"; CONS-020 | Omits "32-byte" and "no provider-wide master secret". | Minor |
| OBS-m4 | Callout, line 76: "Production use needs counsel approval and implementation evidence." | SR-007 "### Establishing the capability before a loan exists": "A resolved technical ticket does not satisfy that gate" | Omits that a resolved ticket does not satisfy the gate. | Minor |
| OBS-m5 | Figure step, line 56: "Recover | The automation completes the borrower's signed recovery with S and broadcasts it." | SR-007: "Independent Bitcoin confirmation is required before recovery is final"; FLOW-006 step 4 | The figure ends at broadcast under the label "Recover", with no confirmation step. Line 48 ("three separate steps") corrects this in the body. A figure-only reader could equate broadcast with recovery. This is near the §4.6 diagram rule. | Minor (borderline) |
| OBS-m6 | Line 48: "checks the configured deployment, the loan, the exact refund event, the amount, the frozen recipient, provenance and L1 finality" | SR-007 "### From an unclaimed repayment to public S": "configured chain, deployment and current implementation, event signature, loan, transaction and log, block canonicality, finality, exact debt and frozen recipient" | Compressed: chain, current implementation, event signature and canonicality are not named. The listed items cover them, so O-11 is graded Preserved, but key §4.5 asks for the full list here. | Minor |
| OBS-m7 | Line 11: "Base describes it as roughly 20 minutes." | SEL-013 line 15: "Base documents that stage as roughly 20 minutes" | Sourced and hedged; line 67 adds "not a promise of an exact waiting time". Acceptable, noted only because §4.6 prohibits invented finality times. | Minor (acceptable) |

### 3.2 Key facts (part 1.5)

| Fact | Status | Evidence / gap |
| --- | --- | --- |
| O-1 observation reports, fallback discloses; neither decides entitlement or signs | Preserved | Lines 14, 61 |
| O-2 observed/safe display-only; L1 finality; not a waiting-time promise | Preserved | Lines 11, 28–30, 67 |
| O-3 versioned ingestion; cursor after acknowledgement; resend; no direct projections | Preserved | Line 29, line 61 ("does not … edit application status") |
| O-4 Alchemy/QuickNode; one healthy provider; dual failure keeps views, blocks actions | Preserved | Lines 32, 37 |
| O-5 reorg kept as noncanonical plus correction plus replay; operator recheck only | Preserved | Lines 36, 39 |
| O-6 Bitcoin needs fresh agreement; one incident; 5 min or one missed block; critical after acceptance | Preserved | Line 38 |
| O-7 payment evidence updates only the payment record; only the named event moves the loan | Preserved | Line 40 |
| O-8 one contracted independent service; random per-loan S; only the hash; no key, destination or judgment; nobody gets S early | Preserved | Lines 12, 61 (see OBS-m3) |
| **O-9 hash fixed before construction; unique; cannot be added; no rotation without new escrow** | **Weakened** | Before construction, uniqueness and "never acquire it later" are present (lines 12, 76). Missing: a lost or compromised S cannot be rotated without a new escrow and package graph. Owner: IFACE-017 "## Payload Or Artifact": "Lost or compromised `S` cannot be rotated without a new escrow output and package graph." |
| O-10 selected, not operating; counsel plus implementation evidence before any new loan commits the hash | Preserved | Callout, lines 74–76 (see OBS-m4) |
| O-11 only the canonical L1-final refund event; independent verification list | Preserved | Lines 20, 46–48, 63 (see OBS-m6) |
| **O-12 Bitcoin finalization's separate checks; same transaction; confirmation required** | **Weakened** | Line 48 lists only "the committed hash, the existing signatures and the still-unspent escrow". Missing: the activation gate, the public source and event binding, the exact retained recovery package and the fixed outputs. Owner: SR-007 "### From an unclaimed repayment to public S": "It validates the activation gate, public source and event binding, matching hash, exact retained recovery package, signature, fixed outputs and still-unspent escrow." Key §4.5 requires the full list in this guide. |
| **O-13 four lookup results; empty is not withholding; product gets public metadata only** | **Missing** | None of the three elements appears. Owners: SR-007 "### From an unclaimed repayment to public S" ("distinguishes no publication yet, a valid publication, invalid or mismatched evidence, and an unavailable source. An empty or unreachable response is not proof that the service deliberately withheld S. The product receives public metadata and the commitment-match conclusion"); IFACE-017 "### ACT-002 — Acquire and replay the public S publication". |
| **O-14 bad evidence cannot authorize; outage recovered by replaying the same S; incident path; no company release or replacement; Base refund stays valid** | **Weakened** | Present: non-triggers (line 63), no early-release command (line 61), Base refund complete (line 78). Missing: an outage is recovered by re-verification and replay of the same S; loss, compromise or withholding follows an incident path; no replacement secret. Line 78 ("If the service is unavailable … recovery through S stays unavailable") may lead a reader to treat a temporary outage as final. Owner: SR-007 "### When the path fails": "Outage or interruption may be recovered by independent verification and public replay, using the same committed S. Loss, compromise or withholding requires the defined incident path; there is no discretionary company release or replacement secret". |
| O-15 lender route at D+3 days; long-stop at D+10 days without cancelling it; cooperation; first confirmed wins; not default, not a guarantee | Preserved | Line 78 |

Result: 11/15 = 73.3% Preserved, none Contradicted. **This is below the 90% threshold.**

### 3.3 Distinctions and conflicts

- 2b application status vs contract facts: carried (lines 28–30, 40, 61).
- 2c refund vs recovery: carried (lines 46, 78).
- 2d fallback in full (this guide is the primary owner):
  - Activation condition: carried in the callout.
  - Prior commitment: partial (rotation missing).
  - Per-event prerequisites: carried, though the package-ready-in-archive prerequisite is not named.
  - Non-triggers: carried.
  - ECVS checks: compressed (OBS-m6).
  - Bitcoin-finalization checks: **incomplete** (O-12).
  - Failure boundaries: **incomplete** (O-13, O-14).
  - Vocabulary: "activation" collision in the figure (Major C).
- 2e publication / broadcast / confirmation: carried in the body (line 48); the figure is weak (OBS-m5).
- 2g ECVS availability: carried ("selected, not available").
- 2h conflicts: none touched.

### 3.4 Comprehension

| Question | Result |
| --- | --- |
| Q-O1 | Correct |
| Q-O2 | Correct |
| Q-O3 | Correct on what is shown and what is blocked; replay after recovery is not stated for providers (minor gap) |
| Q-O4 | Correct |
| Q-O5 | Correct |
| Q-O6 | Correct (compressed list) |
| Q-O7 | **Partial**. The gate, event binding and retained package checks are missing. |
| Q-O8 | **Partial**. "Empty is not proof of withholding", "no replacement secret" and the incident path are missing. A guide-only reader might wrongly infer that an outage removes S recovery permanently. |

Score: 6 correct plus 2 partial (threshold met, narrowly).

### 3.5 Verdict: FAIL (73.3% fact preservation; one Major)

Correction notes:

- **O-12:** replace the line 48 list with the full SR-007 list: activation gate, public source and event binding, matching hash, exact retained recovery package, borrower signature, fixed outputs, still-unspent escrow.
- **O-13 and O-14:** add a "When publication fails" paragraph covering:
  - the four lookup results;
  - empty or unreachable is not proof of withholding;
  - the product sees only public metadata;
  - an outage is recovered by re-verifying and replaying the same S;
  - loss, compromise or withholding follows an incident path, with no company release and no replacement secret.
- **O-9:** add "a lost or compromised S cannot be replaced without a new escrow".
- **Major C:** relabel the figure step "Only for a loan created after the fallback's production-activation gate".

With these changes the guide reaches 15/15 and zero Majors.

---

## 4. Migration check: does every removed fact still have a technical owner?

Removed by the migration (PRE vs PKG diff):

- the narrative sections of the three domain records:
  - Bitcoin: "### Package Lifecycle And Recovery", "### Fees, Failures, And Recorded Choices"
  - Base: "## Domain Overview", "### Settlement And Lender Interaction", "### From Funding To Repayment", "### Failure, Authority, And Scope"
  - Observation: "## Domain Overview", "### Establishing a fact the rest of the system can use", "### Limits and remaining recovery paths"
- `architecture.md` "## System Overview".

Added: "## Choices And Rationale" in each domain record, and SCOPE links in "## Excludes". In `architecture.md`, the approval-conflict paragraph moved into "## Purpose And Binding", with a pointer in "## Cross-Domain Boundaries".

Every substantive fact removed from these sections still has a canonical owner:

| Removed content | Current owner(s) |
| --- | --- |
| Prefund vs escrow; package as prior authorization | INV-003 "## Rule"; SR-002 "## Owns" |
| Secret roles | INV-004 "## Rule"; IFACE-020 "## Boundary" |
| Zero-conf construction; six-confirmation gates | INV-015; SR-002 "## Owns"; FLOW-001 |
| Package counts and order; terminal-signing-pending; parent mutation and reorg | SR-002 "## Owns" and "## Failure And Recovery"; FLOW-002; INV-016; INV-026 |
| Same-transaction Y/S completion; confirmation | IFACE-020; FLOW-004; FLOW-006 |
| Lender and long-stop timing, races | INV-008; FLOW-007; FLOW-010; INV-025 |
| Cooperative settlement | FLOW-009; SCOPE-005 |
| Fee-bump child; relay ambiguity; backup cadence and 24-hour pause | IFACE-016; IFACE-008; SR-002 "## Owns"; INV-026 "## Rule" |
| Fee no-tier conflict; 12 vs 18 conflict | Bitcoin `domain.md` "## Choices And Rationale" (both sides, "Neither interpretation is authorized" / "awaits a separate repair"); IFACE-007; SR-002 |
| Base payout cannot sign, broadcast or confirm Bitcoin | SR-003 "## Must Not Own"; IFACE-020 "## Boundary"; Base `domain.md` "## Purpose" |
| Vault immutability, payer neutrality, exact amounts, acceptance, claim, refund, switch | SR-003; SR-005; IFACE-009; IFACE-010; INV-006; INV-007; INV-011; STATE-010, 011, 013 |
| Refund is the only trigger; non-triggers; refund is not recovery; T independent | INV-007; IFACE-017 "## Preconditions And Validation"; SR-003 "## Must Not Own"; INV-008; FLOW-005 "## Outcomes" |
| No pause; exits stay open; upgrade boundary | SR-003 "## Owns"; INV-019; INV-020; STATE-019; SEL-009 (see the changed meaning below) |
| Observation stages, L1 finality, provider rule, reorg, operator recheck, Bitcoin agreement, payment probes | SR-006; IFACE-012; STATE-014; SEL-013, 014, 015 (cited in Observation `domain.md` "## Choices And Rationale"); STATE-021 |
| ECVS model, gate, checks, failure, residual routes | SR-007; IFACE-017; STATE-007; CONS-020; INV-025; SEC-024; SEC-025 |
| Architecture System Overview chain of repayment, refund and S | FLOW-004 to 006; INV-025; SEC-024; approval conflict in `architecture.md` "## Purpose And Binding" |

Findings:

1. **No fact now exists only in a guide or nowhere.** The only guide content without a direct owner sentence is interpretive:
   - the inference at Base guide line 31 (BASE-m1);
   - the reader framing at BTC guide line 102 ("is not rescued by the company"), which is supported by SCOPE-001, 002, 003 and 006 taken together.
   The "PSBT" definition was glossary-only and needs no owner.
2. **One changed meaning was introduced into the technical record by the migration.**
   - PRE Base `domain.md` line 35 said the main contract "retains its explicit Transparent Proxy administration, 2-of-3 Safe, seven-day timelock".
   - PKG Base `domain.md` "## Choices And Rationale" (line 39) now says the ownership path "moves from a dedicated single upgrade key, used for local/test and the intentionally short public mainnet beta, to a 2-of-3 Safe".
   - The new wording matches SEL-009 but conflicts with INV-020, SR-003 and STATE-019, and is not flagged. It is the source of Base guide Major B. The domain record should either revert to the canonical wording or record the SEL-009 vs INV-020/STATE-019 inconsistency as an open source conflict.
3. **Silences carried over unchanged.**
   - The Bitcoin `domain.md` still says "the former decision" says fail closed, without naming it (key 2h-3). The BTC guide correctly does not fill that gap.
   - No source records ECVS counsel approval. The guides treat the ECVS as unavailable (Obs) or gated (BTC). The Base guide's omission of the gate is Major A.
4. **Owners lost from the key's citations.** Many key owners cite domain narrative sections that no longer exist (for example "### Package Lifecycle And Recovery", "### From Funding To Repayment", "### Limits and remaining recovery paths"). In every case the key also cites, or the record set contains, a surviving canonical owner (table above). The key's section references to those headings are now stale.

## 5. Notes on the answer key (verified against the records)

- **S-13 / Q-S8.** The key is drawn from the PRE domain record, SR-003 and INV-020, and does not mention SEL-009's single beta key, which is human-approved per the decision overview. Section 2h-4 should list the SEL-009 vs INV-020/SR-003/STATE-019 governance inconsistency.
- **STATE-019** lists "Paused for new/risky action" (narrow operational pause). SR-003 and SEL-009 say there is no on-chain pause. SEL-009 describes the pause as a frontend, API and opener incident stop, so the two are reconcilable. Guides should keep "no on-chain pause", as the Base guide does.
- **O-4 / Q-O3.** SEL-014 separates dual outage (five-minute alert) from conflict (immediate stop and alert). The key does not record this distinction.
- **O-13** is correct, but its owner text sits in SR-007 "### From an unclaimed repayment to public S" as well as IFACE-017 ACT-002.
- **B-12** owners are correct. Note that SR-009 states the plaintext-clearing rule explicitly; SR-004 states it in "## Failure And Recovery".

## 6. Files

- Findings (this file): `/private/tmp/claude-501/-Users-alanguerrero-Documents-ai-prompts/b72a9647-f430-4577-b73d-46cf594be5b3/scratchpad/eval/responses/t8-review-b.md`
- Guides reviewed: `.../scratchpad/eval/snap-t8/bitrise21/loan-system/design/technical-design/guide/domains/{bitcoin-authorization-and-recovery,base-usdc-settlement-and-funding,base-observation-and-fallback-review}.md`
- Changed-meaning record: `.../snap-t8/bitrise21/loan-system/design/technical-design/system-model/domains/base-usdc-settlement-and-funding/domain.md` (line 39)
