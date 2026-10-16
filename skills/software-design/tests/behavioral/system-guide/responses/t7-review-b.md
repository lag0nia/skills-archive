# T7 Review B: Semantic Fidelity of Three Domain Guides

Reviewer B worked alone and made no changes to the package.

## Scope and conventions

**What was reviewed.** All paths below are relative to `PKG`, which is `scratchpad/eval/snap-t7/bitrise21/loan-system/design/technical-design`.

| Guide | Lines |
| --- | --- |
| `guide/domains/bitcoin-authorization-and-recovery.md` | 106 |
| `guide/domains/base-usdc-settlement-and-funding.md` | 83 |
| `guide/domains/base-observation-and-fallback-review.md` | 93 |

**Sources of truth.** Each guide was checked against `PKG/system-model/`, `PKG/build/` and the tickets in the snap-t7 package. The pre-migration copy is `scratchpad/eval/pre/bitrise21/.../technical-design`.

**How the answer key was used.**
- Criteria come from part 4 of `scratchpad/eval/expectations/expectations.md`.
- Its parts 1, 2 and 3 served as a checklist only.
- Every key claim was re-verified against the snap-t7 records.

**Grading convention.**
- **Preserved** means the fact is stated, or is unambiguously entailed by what the guide says.
- **Weakened** means a condition, limit or number is missing or softened, and the gap could lead a guide-only reader to a different answer.
- Where a grade depends on the reviewer's judgment, I say so, and I give the effect on the verdict if the call goes the other way.

## Verdict summary

| Guide | Critical | Major | Facts Preserved | Comprehension | Verdict |
| --- | --- | --- | --- | --- | --- |
| Bitcoin Authorization And Recovery | 0 | 0 | 12/15 (80%) | 7/8 (Q-B8 partial) | **FAIL** (fails only the 90%-facts rule) |
| Base USDC Settlement And Funding | 0 | 1 | 14/15 (93%) | 8/8 | **PASS with correction note** (fragile) |
| Base Observation And Fallback Review | 0 | 0 | 14/15 (93%) | 6/8 fully, 2 mostly (Q-O7, Q-O8) | **PASS** (minor defects recorded) |

**Bitcoin guide.**
- Three small additions would make it pass:
  - the two-step disclosure for Y, plus the plaintext-clearing rule;
  - the rule for when fee estimators are unavailable;
  - the full consequences of losing the password.
- No sentence in it is dangerous.

**Base guide.**
- Its one Major is the upgrade-governance sentence. It presents a single beta upgrade key as settled V1 behavior. That fact comes only from an implementation selection, and it is in tension with the canonical model.
- The guide flips to FAIL if a reviewer also upgrades either of these minors to Major:
  - minor B1, the activation-pending mislabel and the missing lender exposure;
  - minor B2, the gloss that everything "has to fit in 24 hours".

**Observation guide.**
- Two facts are Preserved under the convention above, but the guide does not carry the full lists that part 4.5 asks for:
  - O-12, the Bitcoin finalization checks;
  - O-13, the four lookup results.
- If a stricter grader marks either one Weakened, the guide drops to 13/15 (87%) and fails.

---

## 1. Bitcoin Authorization And Recovery guide

### 1.1 Defects

No Critical or Major defects were found. All the defects below are Minor.

**BTC-m1: The rule for unavailable fee estimators is missing, and so is the freshness limit.** Minor, and the cause of B-13 being Weakened.
- Guide (line 68): "Fee selection takes the lowest signed variant whose rate is strictly above the current estimate plus a 25 percent buffer, using integer arithmetic only. Estimates come from Mempool, then Blockstream, then Validation Cloud, each with a 15-second deadline."
- Owner: `system-model/contracts/interfaces/iface-007-bitcoin-fee-estimate-and-tier-selection.md`, "## Preconditions And Validation": "If no source is usable, the route enters `fee-estimation-blocked`: it must not automatically select/broadcast a parent or broadcast a CPFP child. Manual continuation may record only one existing signed tier, the estimate source or other basis, reason, and approval; it cannot create a new parent feerate or alter a signed parent."
- Owner: `sr-002-...md`, "## Owns", fee bullet. It requires normalized integer estimates and a bounded freshness window for each estimate.
- What is wrong:
  - A guide-only reader cannot say what happens when all three estimators fail.
  - The guide does keep the outage case separate from the "no eligible tier" conflict, so the key's rule in 2h-3 against merging the two is respected.
  - It simply omits the outage case.

**BTC-m2: The two-step disclosure is described only for X, and the plaintext-clearing rule is missing.** Minor, and the cause of B-12 being Weakened.
- Guide (line 37, the X step): "First she confirms the plain facts of the loan. Then an isolated worker in her Vault briefly unlocks X and her Base key, prepares the exact transaction that reveals X, and asks for a second confirmation tied to those exact bytes before signing and submitting it."
- Guide (line 26, Y): the lender's responsibility includes "claiming the repayment by revealing Y". The two-step process is never mentioned for Y.
- Owner: `sr-009-...md`, "## Owns". Exact local `releaseWithY` strictly before `C`: "first confirm the canonical nonsecret claim facts, then let one isolated worker minimally unlock `Y` and the Base key and freeze the exact secret-bearing transaction, and require a second confirmation bound to those exact bytes before local signing/submission. Plaintext and the worker/session clear on every terminal attempt outcome."
- Owner: `sr-004-...md` and `sr-009-...md`, "## Failure And Recovery": "... second-review cancellation, invalid signature, or submission failure clears plaintext and the action worker/session and fails closed."
- What is wrong: For Q-B6 ("a participant"), a reader could describe the X ceremony but could not say that Y follows it, or that a failure clears the plaintext.

**BTC-m3: The consequences of losing the password are incomplete, and the guide adds a recovery-phrase sentence without its qualifier.** Minor, and the cause of B-15 being Weakened.
- Guide (line 72): "...without the password, no server, operator or product mechanism can restore the Vault, and an unrevealed X or Y is lost. The participant's own 12-word recovery phrase reconstructs Bitcoin key material but does not decrypt those secrets. Packages already fully signed stay usable under their own conditions."
- Owner: `sr-004-...md`, "## Owns". Note that the key cites "## Failure And Recovery", but the sentence is in "## Owns": "Password loss blocks secret disclosure, reconstruction, new signing, and cooperative settlement but does not invalidate an unchanged fully signed package."
- Owner: `sr-009-...md`, "## Failure And Recovery": "password or required-envelope loss removes new signing capability, so the post-confirmation signing window is an explicit residual risk".
- Source of the guide's sentence: `build/records/selections/sel-005-bip39-twelve-word-vault-backup.md`, which says "The phrase reconstructs master Bitcoin key material but does not decrypt encrypted `X`/`Y` records by itself."
- What is wrong:
  - The guide does not say that new signing and cooperative settlement are blocked.
  - The recovery-phrase sentence invites the inference that signing remains possible with the phrase.
  - The owners are themselves in unflagged tension here. SEL-005 says the phrase reconstructs key material, while SR-004 says password loss blocks "reconstruction" and "new signing".
  - The guide should either keep SR-004's rule or report the tension. Per part 4.6, it should not resolve it implicitly.
- What the guide gets right: line 59 does carry the post-confirmation signing window as an accepted residual risk.

**BTC-m4: The strictness of T is simplified.** Minor.
- Guide (line 16): "Timelocks use the chain's median time past (MTP)... The lender's route becomes valid at T, three days after the repayment deadline D".
- Owner: `flow-007-...md`, "## Preconditions": the next candidate block's prior MTP must be "strictly later than `T`".
- Owner: `inv-008-...md`, "## Rule": valid only after MTP passes D + 259,200.
- What is wrong: "at T" loses "strictly after". MTP itself is kept, so a reader still won't use the wall clock. This is not the C-strictness case listed under 4.2.

**BTC-m5: The cut-off for adding the fallback is understated.** Minor.
- Guide (line 61): "the fallback cannot be added to loans whose escrow already exists."
- Owners:
  - `sr-007-...md`, "### Establishing the capability before a loan exists": H(S) must be fixed before escrow construction and borrower signatures.
  - CONS-021: H(S) must be committed in the terms for an activated `H(S)` loan.
- What is wrong: Read alone, this sentence suggests the fallback could be added after prefund signing but before the escrow confirms.
- Mitigation: line 15 ("only for loans created after that service is approved for production") limits the misreading.

**BTC-m6: The initial-signing prerequisites are simplified.** Acceptable simplification (4.5).
- Guide (line 34): "even with zero confirmations, construction builds twelve transactions".
- Owner: `sr-002-...md`, "## Owns", and INV-015. Initial signing may proceed "after the INV-015 binding, acknowledged preparation and committed-terms prerequisites".
- The guide's case premise ("their terms are already committed") and line 22 ("Vault allocations ... acknowledged") cover most of this.

**BTC-m7: The recipient of the expiry return is unnamed.** Minor.
- Guide (line 55): "the Base funding expires and returns the lender's USDC".
- Owner: `sr-005-...md`, "## Failure And Recovery". Funds are "permissionlessly recoverable only to the fixed lender settlement recipient."
- This is a cross-domain mention. The Base guide states the recipient correctly.

**BTC-m8: The word "accepted" collides with borrower acceptance.** Minor.
- Guide (line 57): "once a variant has been accepted it is the only parent".
- This means relay or mempool acceptance. Elsewhere in the guide, "acceptance" means the borrower's X acceptance.
- The nearby phrase "enters a mempool" disambiguates it, so this is recorded only.

**Checked and found correct:**
- **Timing and amounts:**
  - 67 h funding-window reserve (FLOW-001) and 19 h acceptance reserve (FLOW-002);
  - a relative refund timelock of about 72 h (507 × 512 s);
  - the 240-sat P2A anchor;
  - the six tiers and the strict 25% buffer with integer arithmetic.
- **Providers and relay:**
  - estimate order Mempool, then Blockstream, then Validation Cloud, each with a 15 s deadline;
  - relay to Mempool, then Blockstream, where a timeout means "unknown";
  - incidents escalate after 5 minutes or one missed block, and are critical once X is public.
- **Lifecycle and exits:**
  - the activation-pending risk (SEC-023 and INV-018), with no refund of the prefund once X is public (FLOW-002 failure);
  - exit packages built only for the actual six-confirmed winner (STATE-015);
  - 18 terminal packages, with the 12/18 conflict stated;
  - the fee conflict stated with both sides and left undecided.
- **Scope, threats and rationale:**
  - the scope list SCOPE-001/002/003/005/006;
  - the dominant common-mode key threat from SEC-015, including that nothing prevents a malicious release shipped through the trusted path;
  - the rationale from SEL-027 (fixed envelope profile) and SEL-004 (hardened sequential keys);
  - the attribution of the shared Y/S PSBT to the user (TICKET-0038).
- **Callout:** "A repaid loan can still lose its collateral" matches SEC-025 and INV-025.
- **Boundaries required by 4.6:**
  - Base cannot revoke signatures ("must never describe Base exclusivity as invalidating the Bitcoin route");
  - the fallback is production-gated (lines 15 and 61).

### 1.2 Must-preserve facts (part 1.3)

| Fact | Status | Evidence in guide |
| --- | --- | --- |
| B-1 prefund ≠ escrow; a package is not permission; consensus decides | Preserved | lines 7, 11–13 |
| B-2 single role per secret; long-stop needs no secret; no organization key | Preserved | lines 15, 39 |
| B-3 zero confirmations allows construction and signing; six unchanged confirmations for window, gate and reliance | Preserved | lines 34, 36 |
| B-4 12 initial packages; borrower signs 12, lender signs 6 activation | Preserved | lines 34–35 |
| B-5 18 terminal packages, for the actual winner only; stale 12 noted | Preserved | lines 39, 59, 96 |
| B-6 activation pending; non-atomic; lender unsecured | Preserved | line 57 |
| B-7 receipt only after signing and archive; terminal-signing-pending; irreversible | Preserved | lines 35, 59 |
| B-8 parent change invalidates descendants; same-parent reorg pauses qualification | Preserved | line 53 |
| B-9 same transaction completed with Y or S; final only on confirmation | Preserved | lines 40, 61, 89 |
| B-10 T and B by MTP; lender route never expires; first confirmed spend wins; Base cannot revoke | Preserved (strictness simplified, BTC-m4) | lines 16, 61, 64 |
| B-11 manual export only; organization does not broadcast | Preserved | lines 66, 100 |
| B-12 two confirmations for X **and Y**; failure clears plaintext | **Weakened** (BTC-m2) | line 37 (X only) |
| B-13 fee tiers, strict buffer, **estimator-blocked route**, CPFP, conflict | **Weakened** (BTC-m1) | lines 68, 95 |
| B-14 cooperative settlement needs fresh signatures from both; deferred | Preserved | lines 79, 103 |
| B-15 no password recovery; **blocks new signing and cooperative settlement**; signed packages usable | **Weakened** (BTC-m3) | line 72 |

The result is 12/15 Preserved (80%), with none Contradicted.

### 1.3 Distinctions (part 2)

- **2a, login versus signing authority: carried.**
  - Line 28: "Signing in to the product never exposes either participant's plaintext keys or secrets."
  - Line 37: the confirmation tied to exact bytes.
  - Line 72: there is no password recovery.
- **2c, Base refund versus Bitcoin recovery: carried.**
  - Line 61: "the USDC goes back to Ana on Base, but the escrow is untouched".
  - The guide avoids the bare word "refund" for the Base step.
- **2d, the fallback: carried for this guide's role.** The guide states the same transaction, no new signature, and that the fallback is unavailable without the gate (lines 15, 61, 89).
- **2e, publication versus broadcast versus confirmation: carried.**
  - Line 77: "Evidence is not authority ... Only a confirmed spend of the exact output settles the outcome."
  - Line 40: recovery is complete on confirmation.
- **2h-2, package count: carried correctly.** Both sides are given, the guide follows 18 with a note, and the conflict is marked not reconciled (line 96).
- **2h-3, fee selection with no qualifying tier: carried correctly.**
  - Both sides are given with their sources (line 95), and the guide says "Which behavior governs remains open."
  - It does not merge this case with the estimator outage, but it also omits the outage (BTC-m1).

### 1.4 Comprehension (part 3.3)

| Question | Answer from the guide alone |
| --- | --- |
| Q-B1 | Correct (lines 11–12, 34, 36, 39) |
| Q-B2 | Correct, including the conflict note (lines 34–35, 39, 96) |
| Q-B3 | Correct: activation pending, non-atomic, lender unsecured (line 57) |
| Q-B4 | Correct: same transaction, S only for loans past the production gate, final on confirmation |
| Q-B5 | Correct: MTP, manual export, long-stop does not cancel, first confirmed spend wins |
| Q-B6 | Mostly correct: the X ceremony is right. Y and the plaintext-clearing rule are missing. Not dangerous. |
| Q-B7 | Mostly correct: tiers, buffer, CPFP from a fee wallet that gains no authority, and the two-sided conflict. The estimator-blocked route is missing. Not dangerous. |
| Q-B8 | Partial: no recovery, signed packages usable, X and Y lost. It does not say new signing or cooperative settlement is blocked, and the recovery-phrase sentence invites the wrong inference. This is not one of the key's listed dangerous answers. |

The result is 7/8 substantially correct, with no dangerous answer traceable to the guide.

### 1.5 Verdict: FAIL

- The guide has 0 Critical and 0 Major defects.
- It fails rule 4.7 on facts alone: 80% are Preserved, against a threshold of 90%.
- The result is not sensitive to judgment calls. Even if one Weakened grade is reversed, 13/15 (87%) still fails.

**Fix.** Make three small additions:
1. "Y is revealed through the same two confirmations, and any failure or cancellation clears the plaintext."
2. "If no estimator is usable, automatic selection stops (`fee-estimation-blocked`); an operator may only record an existing signed tier."
3. "Without the password, new signing and cooperative settlement are also blocked; the recovery phrase does not restore that ability." Alternatively, report the SEL-005/SR-004 tension.

---

## 2. Base USDC Settlement And Funding guide

### 2.1 Defects

**BASE-M1 (Major): a single upgrade key for the beta is presented as settled V1 governance. It comes from an implementation selection and is in tension with the canonical model.**
- Guide (line 70): "A dedicated single upgrade key is used for local and test environments and an intentionally short public beta; sole ownership then moves to a two-of-three multi-signature wallet acting through a seven-day timelock, and stays there for version 1."
- Source of the claim: `build/records/selections/sel-009-base-contract-upgrade-governance.md`: "a dedicated single upgrade key for local/test and the intentionally short public mainnet beta, followed by transfer of that same sole ownership to a 2-of-3 multisig-controlled timelock". The same claim appears in `build/workflow/decision-overview.md` under TICKET-0048.
- The canonical system model says otherwise:
  - `sr-003-...md`, "## Owns": "Transparent Proxy administration retained under a 2-of-3 Safe-controlled seven-day timelock".
  - `inv-020-base-upgrade-boundary.md`, "## Rule": "V1 retains the Transparent ProxyAdmin controlled by a 2-of-3 Safe through a seven-day timelock."
  - `sec-017-...md`, "## Prohibited Authority": "No unilateral upgrade/admin/opener/pause key may redirect/withdraw funds, change recipients/terms, reveal secrets, reopen/mutate existing loans, bypass the timelock/Safe, or support an unqualified immutable/noncustodial claim."
  - SEC-017, "Noncustodial significance": "An unrestricted unilateral upgrade key contradicts that practical claim for funds held by the proxy."
  - `state-019-...md` defines the deployment identity with the timelock and the Safe.
- No canonical record mentions a beta key.
- What is wrong:
  - A real public-mainnet period holding funds under a unilateral, non-timelocked key is a material trust fact.
  - The canonical owners do not acknowledge it, and SEC-017 prohibits a key that bypasses the timelock and Safe.
  - The guide presents the selection's version as settled V1 behavior and does not flag the inconsistency.
  - This is a 4.3 Major: a build or workflow record is cited as if it overrides the canonical system model. It also breaks the 4.6 rule to report silences as silences.
  - It is not Critical, because it is not one of the three named conflicts under 4.2. A stricter reviewer could argue that by analogy it is a "conflict silently resolved".
- **Correction note required.** State the governance as the canonical records do (Safe plus 7-day timelock for V1). Then flag that SEL-009 and TICKET-0048 describe a single-key beta that SEC-017, INV-020 and SR-003 do not reflect.

**BASE-m1 (Minor-high, borderline Major): "activation pending" and "terminal signing pending" are merged, and the guide never mentions the lender's exposure while activation is pending.**
- Guide (line 31): "The application shows it as active only after separate Bitcoin evidence confirms the escrow, both participants have signed the exit packages for it, and their archive receipt validates; until then it shows the loan as waiting for that signing."
- Owner: `state-015-...md`, "## States". These are two distinct, non-terminal states:
  - "Activation pending: Base accepted and `X` is public, but expected escrow output is not yet six-confirmed".
  - "Terminal signing pending: One actual activation winner has six confirmations, but its 18 terminal packages are not yet fully signed and durably recorded".
- Owners: SEC-023 and INV-018. The lender is unsecured if the prefund refund confirms first.
- What is wrong:
  - During activation pending, the loan is not "waiting for that signing". It is waiting for the escrow to confirm, and the principal has already been paid.
  - The Base guide never states the lender's exposure, although it is the guide a lender most needs for this step.
  - Line 65, "Acceptance leaves Bitcoin activation pending", is itself correct.
- Rated Minor because the risk belongs to the Bitcoin domain (B-6) and the Bitcoin guide carries it. If a reviewer applies 4.3's "residual risk is omitted" to this guide, it becomes a second Major and the guide FAILS.

**BASE-m2 (Minor, borderline): the guide turns the 24 hours between C and T into a hard limit that the owners don't state.**
- Guide (line 55, callout): "a published secret only gives the borrower a competing recovery transaction that must confirm first; the refund, its finality, the publication and the Bitcoin confirmation all have to fit in the roughly 24 hours between C and T."
- Owner: `sec-025-...md`, "Detection and recovery": "timely publication and broadcast of the shared borrower-recovery transaction with the committed `S` witness may settle before either timed route."
- SEC-025, "Current status": "Neither is protection until implemented for the escrow and confirmed before the lender transaction."
- What is wrong:
  - The owners' condition is that the recovery confirms before the lender's transaction does.
  - After T, the S route remains valid and the first confirmed spend still wins. The lender may not broadcast promptly.
  - "have to fit in" states a deadline the owners don't have.
  - The gloss is cautious (it overstates the borrower's risk rather than understating it), which is why it is Minor.
  - "Roughly 24 hours" is an approximation of an exact 86,400 s.
- The same sentence appears in the Observation guide (OBS-m4).

**BASE-m3: the guide does not state outright that the refund never waits for the ECVS.** Minor.
- Owners: `inv-007-...md`, "## Rule": "the Base refund never depends on ECVS". `iface-017-...md`, "## Boundary".
- Key 2d requires the Base guide to say "the refund never waits for the ECVS".
- What the guide does say:
  - "if that automation fails, the refund stays available indefinitely";
  - "The final event of that refund is the only Base fact that can start ... fallback".
- These entail the rule, so S-10 is Preserved. It is not stated outright.

**BASE-m4: the guide does not state outright that valid repayment without a claim is not default.** Minor.
- Owners: `flow-008-...md`, "## Outcomes", and `flow-004-...md`, "## Failure And Reroute".
- The guide defines default as "exact repayment is not finalized by D" (line 50), which entails the rule. S-14 is Preserved.
- The guide also omits that an observer conflict pauses classification.

**BASE-m5: "about 20 minutes later" has no qualifier.** Minor.
- Guide (line 30): "The application acts on it once the event is final, about 20 minutes later".
- Owner: `sel-013-...md`: "Base documents that stage as roughly 20 minutes". The pre-migration domain text adds that it is "not a promise of an exact waiting time".
- "About" is soft enough, but the Observation guide adds the "not guaranteed" qualifier and this guide does not.

**BASE-m6: the Vault payment account is not called "recoverability-qualified".** Minor.
- Guide (line 30): "the design also lets him pay from the payment account in his Vault, though that account is not yet verified in implementation."
- Owner: `sr-005-...md`, "## Owns": "recoverable lender Vault payment account".
- The guide is correct that the account is planned and unverified (VA-003; SEL-043).

**BASE-m7: the long-stop B is absent from the aftermath of an unclaimed refund.** Minor.
- B is mentioned only in the definitions (line 15). The callout (line 55) names only the lender route at T and the S route.
- Owners: SEC-025 ("At `D + 864,000`, the borrower long-stop becomes a competing fixed-destination spend") and key 2h-4.
- The Observation guide carries this; the Base guide does not.

**BASE-m8: the heading "No on-chain pause" sits above a body that says the question is open.** Minor.
- Guide (line 71): "**No on-chain pause.** ... The deployment-lifecycle record still lists narrow pause roles and a paused state; this conflict is open." Line 81 repeats that it is open.
- Owner: the post-migration `domains/base-usdc-settlement-and-funding/domain.md`, "## Choices And Rationale": "Unresolved source conflict: SR-003, SEL-009, and CONS-008 say V1 has no on-chain pause role, while STATE-019 lists pause/operational roles ... and a `Paused for new/risky action` state".
- The body is faithful. Only the bold label reads as settled; something like "On-chain pause (open conflict)" would be better.

**Checked and found correct:**
- **Vaults and sweeps:**
  - per-loan vaults are immutable and ownerless, with no arbitrary call or rescue (SEL-021/022, IFACE-010);
  - the rationale against predicted and shared addresses;
  - the repayment vault is deployed at acceptance;
  - residue is swept only to fixed or current recipients;
  - wrong-chain or wrong-token transfers have no guarantee.
- **Repayment and refund:**
  - the guided transfer stops one hour before D;
  - the recipient is confirmed before the repayment vault is shown;
  - one switch, to the borrower's own protocol account only (STATE-013);
  - the claim is strictly before C;
  - after C, a one-time refund of the exact amount to the frozen recipient, which never expires;
  - the fee wallet submits the refund but gains no role.
- **Authority:**
  - gas sponsorship rather than relaying (SEL-020; SCOPE-014 deferral and its reason);
  - the contract verifies the terms hash (IFACE-009, "verified terms_hash");
  - opener limits, quarantine of unknown loans (INV-019), and replacement only through the 7-day path (CONS-008);
  - an upgrade applies to every loan on the contract and there are no legacy branches (TICKET-0048, CONS-008);
  - upgrade authority can be "economically equivalent" to custody (SEC-017);
  - provisioning gas for production payment accounts is deferred (SR-011);
  - SCOPE-005 is deferred and stated so.
- **Boundaries required by 4.6:**
  - the Base guide says the refund is not Bitcoin recovery (callout, line 54);
  - acceptance and claim calls are made by the participant's own Vault (2a).

### 2.2 Must-preserve facts (part 1.4)

| Fact | Status | Evidence in guide |
| --- | --- | --- |
| S-1 Base decides USDC; it cannot sign, broadcast or confirm Bitcoin | Preserved | line 7 |
| S-2 vaults immutable and ownerless; transfers provisional | Preserved | lines 11–12 |
| S-3 payer-neutral | Preserved | line 13 |
| S-4 lender-only decision; partial deposits; no pooling, custody or drawing | Preserved ("recoverability-qualified" missing, BASE-m6) | lines 21, 30, 62 |
| S-5 window after qualification, 24 h, exact principal, recovery only to fixed recipient | Preserved | lines 29–30, 46, 48 |
| S-6 acceptance ≤24 h, X from own Vault, atomic, activation pending, no delegated acceptance | Preserved | lines 30–31, 65, 72, 77 |
| S-7 valid repayment: exact amount, by D, at L1 finality | Preserved | lines 12, 32 |
| S-8 claim strictly before C, fixed recipient, once | Preserved | line 33 |
| S-9 one switch, irreversible, own protocol account only; freezes at C | Preserved | line 52 |
| S-10 claim impossible at C; refund once; indefinite; independent of ECVS | Preserved (entailed, BASE-m3) | line 52 |
| S-11 refund event is the only trigger; refund ≠ Bitcoin recovery; T independent | Preserved | lines 52–55 |
| S-12 permissionless call ≠ control; named-error reverts | Preserved | lines 7, 19, 57 |
| S-13 Proxy + Safe + 7-day timelock; vaults immutable; pause; exits; no migration | **Weakened** (BASE-M1: governance during the beta replaced by SEL-009's single key). The guide's handling of the pause is correct, and the key's "no on-chain pause" is out of date (see Key corrections) | lines 70–71, 81 |
| S-14 default only from canonical facts; repayment without a claim is not default; classification moves nothing | Preserved (entailed, BASE-m4) | line 50 |
| S-15 payment account only a payer; participant transfer unbound; SCOPE-005 | Preserved | lines 63, 76, 80 |

The result is 14/15 Preserved (93%), with none Contradicted.

S-13 is graded Weakened rather than Contradicted because the guide's governance claim is sourced in the package (SEL-009). If a reviewer treats SEL-009 as having no authority and grades S-13 Contradicted, the guide fails rule 4.7.

### 2.3 Distinctions (part 2)

- **2a: carried.** Line 23 ("The participants' Vaults sign the calls that reveal X and Y ... locally"), line 72 ("never receives a secret or signs a participant action").
- **2b, primary for this guide: carried.**
  - "Balances are not results" (line 12).
  - A balance that merely covers the debt "is not yet a valid repayment" (line 32).
  - The figure caption: "a transfer or balance alone never advances the loan".
- **2c: carried** in the callout (line 54) and in "a refund does not recover collateral" (line 65).
  - The three senses of "refund" are kept apart by context: funding expiry, the prefund's own route, and the refund of an unclaimed repayment.
- **2d: carried for this guide's role.** The trigger is the finalized refund event, and lender silence, a missing secret or elapsed time do not count (line 52). The rule that the refund never waits is entailed (BASE-m3).
- **2e, submission versus finality: carried.** "A permissionless finalization, which must execute on Base no later than D", and the application acts only once the event is final.
- **2f, primary for this guide: carried.** Lines 21, 62; recovery only to the fixed settlement recipient (line 46).
- **2g: no readiness language.** The payment account is "not yet verified in implementation" (line 30). "Atomic" is used only for the acceptance call on Base, which 4.6 allows.

### 2.4 Comprehension (part 3.4)

- Q-S1 through Q-S7 are all answered correctly from the guide alone.
- On Q-S8, a reader would answer: proxy; a single key during the beta, then Safe plus 7-day timelock; vaults immutable; pause open; direct exits stay available; existing loans keep their terms, but an upgrade applies to every loan.
  - Apart from the beta key (BASE-M1), this matches the owners better than the key's "Expected" answer, which still says "no on-chain pause" (see Key corrections).
  - None of the dangerous phrasings appear: the guide never says "operators can pause", "fully immutable" or "upgrades move existing loans".

The result is 8/8, with no dangerous answer.

### 2.5 Verdict: PASS with correction note

- 0 Critical, 1 Major (BASE-M1), 93% of facts Preserved, 8/8 comprehension.
- The correction note must address the governance during the beta.
- **The pass is fragile.** The guide fails if any of these is graded up:
  - BASE-m1 (activation pending and the lender's exposure) to Major;
  - BASE-m2 (the 24-hour gloss) to Major;
  - S-13 to Contradicted.
- **Recommended fixes:**
  - split "activation pending" from "terminal signing pending", and add one sentence on the lender's exposure;
  - restate the callout as "S protects the borrower only if her recovery confirms before the lender's transaction; after T both can be valid and the first confirmed spend wins";
  - mention the long-stop B in the aftermath of the refund.

---

## 3. Base Observation And Fallback Review guide

### 3.1 Defects

No Critical or Major defects were found. All the defects below are Minor.

**OBS-m1: the list of Bitcoin finalization checks is incomplete.** Minor. O-12 is Preserved, but the grade is sensitive.
- Guide (line 42): "Bitcoin operations then check the publication, the commitment, the stored recovery transaction that Ana signed after the activation escrow confirmed, and that the escrow is still unspent. They insert S into that same transaction, unchanged in every other respect, and broadcast it."
- Owner: `sr-007-...md`, "### From an unclaimed repayment to public S": "It validates the activation gate, public source and event binding, matching hash, exact retained recovery package, signature, fixed outputs and still-unspent escrow. It can then insert S, select an existing fee candidate and submit the already-authorized transaction."
- Owner: IFACE-020, ACT-002.
- What is wrong:
  - The guide omits the re-validation of the activation gate and the selection of an existing fee tier.
  - Signature and fixed outputs are only implied, by "unchanged in every other respect".
  - Key 4.5 says this guide must carry the full fallback-check lists.
- No reachable outcome changes: a loan without H(S) fails the commitment check anyway.

**OBS-m2: the four lookup results, and the limit on what the product receives, are missing.** Minor. O-13 is Preserved.
- Owner: `sr-007-...md`, same section: "The public lookup contract distinguishes no publication yet, a valid publication, invalid or mismatched evidence, and an unavailable source. An empty or unreachable response is not proof that the service deliberately withheld S. The product receives public metadata and the commitment-match conclusion".
- Owner: IFACE-017, ACT-002.
- The guide keeps the essential safeguard: "an empty or unreachable source is not proof that S was deliberately withheld" (line 67).

**OBS-m3: cooperation is missing from the remaining routes.** Minor, and the cause of O-15 being Weakened.
- Guide (line 67): "...the Bitcoin escrow can still be reached by its other pre-authorized routes, and, after early disclosure or compromise, by S."
- Guide callout (line 70): it names only the lender route and the long-stop.
- Owner: `flow-006-...md`, "## Failure And Reroute": "Until Bitcoin recovery confirms, cooperative settlement or the residual timelocked lender package may still win".
- Owner: `flow-005-...md`, front matter `ends_when`: "Bitcoin may follow conditional fallback, residual lender spend, or cooperative settlement."
- Pre-migration domain record: "Mutual cooperation is another separately authorized route."
- "Other pre-authorized routes" excludes cooperation, which needs fresh signatures. A reader cannot answer the cooperation part of Q-O8.

**OBS-m4: the same "fit in roughly 24 hours" gloss as BASE-m2.** Minor.
- Guide (line 70): "the refund, its finality, the publication and the Bitcoin confirmation all have to fit in the roughly 24 hours between C and that maturity."
- Owner: SEC-025, quoted under BASE-m2.

**OBS-m5: event identity is wrong.** Minor (byte-level detail, but stated incorrectly).
- Guide (line 27): "checks the chain, the contract deployment and its code, the loan, the transaction and the block. Each event gets a stable identity from those fields."
- Owner: `iface-012-...md`: "`BaseEventObservationV1` has immutable identity `(chain_id, proxy_address, block_hash, transaction_hash, log_index)`".
- Owner: `sel-015-...md`: "`chain_id + proxy_address + block_hash + transaction_hash + log_index`".
- What is wrong:
  - The identity includes the log index, which the guide never names.
  - It excludes the loan and the code, which the guide implies are part of it.
  - The 4.4 allowance for omitted byte-level detail does not cover contradicting it.
- Nothing a reader would do changes, so this is recorded as Minor.

**OBS-m6: the delivery order is simplified.** Minor (4.4, simplified ordering).
- Guide (line 29): "When the block reaches layer-1 finality, the observer delivers the event to the application".
- Owner: `sel-015-...md`, "### Cursor and replay": "Blocks newer than that cursor are the unfinalized tail: their event records may be shown as temporary". Observed and safe records are delivered too; only the cursor waits for acknowledged final blocks.
- The guide's line 28 ("may show the event as soon as it is seen") partly compensates. Authority is unaffected.

**OBS-m7: blocking during an outage is stated too broadly.** Minor.
- Guide (line 55): "every new action that depends on Base is blocked".
- Owner: `state-014-...md`: "Block only new Base-derived consequential actions" and "New consequential facts are blocked". SEL-014 uses the same "new consequential actions" wording.
- The error is cautious (it blocks more than the owners do), but it is broader than the owners.

**OBS-m8: the fallback figure omits the production gate.** Minor.
- Figure caption (line 45): "The fallback starts only from one exact, final refund event, and ends only with a confirmed Bitcoin spend."
- Key 4.1 step 5 requires figures and callouts to be read with the same strictness as the body.
- The surrounding text (line 36) and the callout (line 69) state the gate. A reader of the figure alone sees an unconditional fallback, although no step claims availability.

**OBS-m9: two senses of "activation" sit side by side.** Minor; it would be Major under 4.3 only if left unexplained.
- Line 42 says "activation escrow confirmed" (Bitcoin). Lines 36 and 89 say "passed its production gate" and "Production activation of the ECVS" (the capability).
- Each use is qualified, and the guide mostly says "production gate". Recorded, not escalated.

**OBS-m10: the clause about ticket resolution is omitted.** Minor.
- The guide never says that a resolved technical ticket does not satisfy the gate (SR-007, "## Must Not Own"; STATE-007).
- It does say the gate needs counsel approval and implementation evidence (lines 70, 89), so no reader would infer that a ticket is enough.

**OBS-m11: wording.** Minor.
- Line 3: "facts the rest of the system can safely act on". "Safely" is soft readiness language, though it describes the purpose, not a status.
- Line 67: "and, after early disclosure or compromise, by S". This lists a danger (premature borrower recovery) as if it were a route. It is consistent with SR-007, which names early disclosure as a risk, but it should be reworded as a risk.

**Checked and found correct:**
- **Observation:**
  - "safe" in about two minutes is progress only;
  - L1 finality is roughly 20 minutes and is "Base's documented figure, not a guaranteed waiting time" (SEL-013);
  - Alchemy is primary and QuickNode the fallback, and one healthy provider is enough (SEL-014);
  - providers that disagree raise an incident, never settled by majority, and running an own node was judged unjustified;
  - the event history and versioned handoff rationale (SEL-015);
  - reorg handling; operators may only request a recheck.
- **Bitcoin evidence and payments:**
  - Bitcoin needs two sources to agree;
  - incidents escalate after 5 minutes or one missed block, and are critical after X;
  - payment probes at 0/15/60 s, escalation at 180 s, and the account is blocked (SR-006/SR-011);
  - a standalone transfer never advances a loan.
- **The ECVS:**
  - its checks are listed in full (line 40, matching IFACE-017's "## Preconditions And Validation");
  - its boundaries, including no master secret and no early release (line 76);
  - the refund never depends on it (line 77);
  - wrong triggers are listed (line 65);
  - the "designed, not available" callout.
- **Attributions:** TICKET-0047 (the user asked for L1 finality and the agent revised its advice) and TICKET-0037 (the user specified an independent contracted service) match `decision-overview.md`.
- **Required boundaries:** "Valid repayment is not borrower default, and a refunded USDC balance is not complete Bitcoin settlement" (line 91), which 2c requires. Publication is "neither a broadcast nor a confirmation" (line 42), which 2e requires.

### 3.2 Must-preserve facts (part 1.5)

| Fact | Status | Evidence in guide |
| --- | --- | --- |
| O-1 neither job decides entitlement or signs | Preserved | line 13 |
| O-2 observed and safe are display only; L1 finality; no exact waiting time | Preserved | lines 11, 28, 81 |
| O-3 versioned handoff; cursor after acknowledgement; resend; no direct writes | Preserved | lines 29–30, 83 |
| O-4 Alchemy and QuickNode; one healthy provider enough; outage keeps final facts and blocks new actions | Preserved (broadened, OBS-m7) | line 55 |
| O-5 reorg kept as non-canonical; correction; replay; recheck only | Preserved | lines 57, 59 |
| O-6 Bitcoin agreement; one incident; 5 min or one block; critical after X | Preserved | line 61 |
| O-7 payment record versus loan event; transfer never advances a loan | Preserved | line 63 |
| O-8 one contracted service; per-loan S; no master secret, key or judgment; no early receipt | Preserved | lines 11, 19, 76, 84 |
| O-9 commitment fixed before signing; unique; cannot add or rotate | Preserved | lines 19, 67, 70 |
| O-10 designed, not operating; production gate before commitment or advertising | Preserved (ticket clause missing, OBS-m10) | lines 69–70, 89 |
| O-11 only the final refund event; full independent checks | Preserved | lines 21, 40, 65 |
| O-12 publication ≠ recovery; full Bitcoin finalization checks; same transaction; confirmation | Preserved (list incomplete, OBS-m1, sensitive) | line 42 |
| O-13 four lookup results; empty ≠ withheld; public metadata only | Preserved (results not listed, OBS-m2, sensitive) | line 67 |
| O-14 bad evidence cannot authorize; replay same S; incident path; no replacement; refund valid | Preserved | lines 65, 67, 76 |
| O-15 lender route D+3; long-stop D+10 without cancelling; **cooperation**; first confirmed spend; not default | **Weakened** (OBS-m3) | lines 70, 91 |

The result is 14/15 Preserved (93%), with none Contradicted.

### 3.3 Distinctions (part 2)

- **2b, primary for this guide: carried.**
  - "neither a wallet notification, an updated screen nor a lender's silence is proof of anything" (line 7);
  - the observed, safe and final stages;
  - a payment record is not a loan event.
- **2c: carried** (lines 38, 70, 91).
- **2d, primary for this guide, in full: carried, except the full Bitcoin finalization list (OBS-m1).**
  - Prerequisites, independent checks, prior commitment, the activation gate and the unavailability callout are all present.
  - The guide never presents the fallback as available, as addable later, or as a dispute decider.
- **2e: carried** (line 42).
- **2g, ECVS availability: carried** ("The fallback is designed, not available").

### 3.4 Comprehension (part 3.5)

- Q-O1 through Q-O6 are answered correctly.
- Q-O7 is mostly correct: the reader would miss the gate re-check and the existing fee tier (OBS-m1).
- Q-O8 is mostly correct: the reader would miss cooperation (OBS-m3).
- The result is 6/8 fully correct and 2 mostly correct. No answer is dangerous: the guide says outright that there is no company release and no replacement secret, and that the collateral is not guaranteed.

### 3.5 Verdict: PASS (minor defects recorded)

- 0 Critical, 0 Major, 93% of facts Preserved, comprehension at least 6/8.
- **Sensitivity:**
  - If O-12 or O-13 is graded Weakened under a literal reading of 4.5's "carries them in full", the guide drops to 13/15 (87%) and fails.
  - If OBS-m9 is graded as an unexplained vocabulary collision, it becomes a single Major, and the guide still passes with a note.
- **Recommended fixes:**
  - complete the Bitcoin finalization list (activation gate, signature, fixed outputs, existing fee tier);
  - add the four lookup results;
  - add "mutual cooperation remains a separately authorized route";
  - correct the event identity (it includes the log index);
  - rewrite the 24-hour sentence as in BASE-m2;
  - add the production gate to the figure caption.

---

## 4. Migration check (task item 3)

The migration removed these sections from each of the three domain records:
- "## Domain Overview" and its three "###" subsections;
- "## Agent-First Canonical Reference".

It added "## Choices And Rationale" to the Bitcoin and Base records. In `system-model/architecture.md`, only "## System Overview" was removed. I compared each removed sentence with the snap-t7 records.

### 4.1 Removed facts that still have a technical owner

Every rule-bearing sentence removed from these three domain records still has an owner. The ones the answer key cites from the removed sections now sit here:

| Removed domain-overview content (pre) | Current technical owner (snap-t7) |
| --- | --- |
| Bitcoin: prefund ≠ escrow; secret roles; zero-confirmation versus six-confirmation boundary; 12 + 18 packages; order of signing and receipt; parent change and reorg; same-transaction recovery; cooperative settlement | INV-003, INV-004, INV-015, SR-002 "## Owns", FLOW-001/002, STATE-015, INV-016, INV-026, IFACE-020, FLOW-009, SCOPE-005 |
| Bitcoin: fee rules and the no-tier conflict | IFACE-007 (both sides of the conflict); the post-migration domain record "## Choices And Rationale" flags the conflict |
| Base: Base cannot sign or confirm Bitcoin; vaults immutable and ownerless; payer neutrality; permissionless ≠ control | SR-003 "## Owns", "## Must Not Own" and "## Failure And Recovery"; IFACE-009/010; INV-006/007; SEL-021/022 |
| Base: claim, switch, freeze and refund sequence; only the refund event triggers the fallback | STATE-013, FLOW-005, INV-007, IFACE-017 "## Boundary" |
| Base: upgrade and pause boundary | SR-003, INV-019/020, STATE-019, SEC-017, CONS-008, plus the new pause-conflict bullet in the domain record |
| Observation: observed, safe and final stages; handoff and cursor; providers; reorg; recheck; Bitcoin agreement; payment reconciliation | STATE-014, SR-006 "## Owns" and "## Failure And Recovery", IFACE-012, SEL-013/014/015 |
| Observation: ECVS prerequisites, checks, publication, lookup, failure | SR-007 (all subsections), IFACE-017, STATE-007, CONS-020 |
| Observation: remaining routes, including mutual cooperation; residual risk, not default | FLOW-006 "## Failure And Reroute", FLOW-005, INV-025, SEC-025 |
| Architecture "## System Overview" (participant payment account status) | VA-003 ("Current payment-wallet delta: Planned and unverified"), SEL-043 ("remains planned/unverified") |

### 4.2 Facts that now exist only in a guide, or nowhere

1. **"Not a promise of an exact waiting time" for L1 finality.** It now exists only in a guide.
   - Pre-migration Observation domain, "### Establishing a fact the rest of the system can use": "That decision accepts additional waiting in return for one consistent rule at consequential cross-chain boundaries; it is not a promise of an exact waiting time."
   - Snap-t7: no system-model or build record contains this caveat. SEL-013 says only "Base documents that stage as roughly 20 minutes" and "delays each consequential handoff by roughly 20 minutes".
   - It survives only in the Observation guide, line 81: "The roughly 20 minutes is Base's documented figure, not a guaranteed waiting time."
   - Key O-2 and Q-O1 depend on it. "Roughly" implies part of it, but the explicit disclaimer has lost its technical owner.
2. **The rationale for the fee rules.** It now exists nowhere.
   - Pre-migration Bitcoin domain, "### Fees, Failures, And Recorded Choices": "Provider-neutral integer units, actual vsize, strict buffer comparison, estimate freshness, and replacement rules prevent underestimation or unsafe reselection."
   - Snap-t7: no record or guide carries this rationale. The rules themselves remain in IFACE-007 and SR-002.
   - The Bitcoin guide's "Fixed fee variants" choice (line 88) gives a different rationale, about pre-signing.
   - Low impact: only the "why" was lost, not a rule.
3. **"Former decision says fail closed".** Dropped, and the drop is a deliberate correction.
   - Pre-migration Bitcoin domain: "the action contract and former decision say fail closed".
   - The post-migration record names only the action contract. The key itself noted that this "former decision" cannot be identified (4.6), so the drop is an improvement, not a loss.
4. **The SR-002 12-count no longer carries an owner's verdict.**
   - The pre-migration framing called the 12-count stale and due for a separate repair.
   - Snap-t7 replaces that with a neutral "Unresolved source conflict".
   - The Bitcoin guide follows 18 and states that the records don't reconcile the two. This matches the post-migration owner framing, so nothing is lost for these guides.
5. **Out of scope for these three guides, noted for completeness.** The approval-wording discrepancy that was in the architecture "## System Overview" is now carried by the loan-terms domain record, so it still has an owner.
6. **Added, not lost.** The Base domain record gained an explicit pause conflict (SR-003/SEL-009/CONS-008 against STATE-019). The pre-migration copy did not flag it. The Base guide reports it faithfully.

---

## 5. Corrections to the answer key

1. **S-13 and Q-S8 ("There is no on-chain pause") are out of date for snap-t7.**
   - The post-migration Base domain record flags an unresolved conflict: SR-003, SEL-009 and CONS-008 say there is no pause, while STATE-019 lists pause and operational roles and a `Paused for new/risky action` state. INV-019 is titled "Funding Opener And Pause Boundaries".
   - A guide that states "no on-chain pause" as settled would be resolving a flagged conflict silently. The Base guide correctly does not.
   - The key should add this as a fourth flagged conflict in 2h. The Architecture-guide requirement should probably say "four conflicts".
2. **The key does not mention SEL-009's single beta upgrade key.**
   - SEL-009 and TICKET-0048 record a single key for local, test and the public mainnet beta.
   - SR-003, INV-020, STATE-019 and SEC-017 (which prohibits a unilateral key bypassing the timelock or Safe) do not mention it.
   - This unflagged inconsistency belongs in 2h-4, and the expected answer to Q-S8 should mention it.
3. **The key does not mention the SEL-005 versus SR-004 tension.**
   - SEL-005: "The phrase reconstructs master Bitcoin key material".
   - SR-004: "Password loss blocks secret disclosure, reconstruction, new signing, and cooperative settlement".
   - This also belongs in 2h-4.
4. **The B-15 and Q-B8 owner citation is wrong.** The SR-004 password-loss sentence is in "## Owns", not "## Failure And Recovery". SR-009's equivalent is correctly in "## Failure And Recovery".
5. **Owner citations point to sections the migration deleted.** These include S-1, S-2, S-3, S-11, S-12, S-15, O-1, O-2, O-4–O-7, O-10, O-15, B-1–B-3, B-5, B-7, B-8, B-13 and B-14, which cite "## Domain Overview" or its subsections. For snap-t7, the owners are the replacements listed in 4.1.
6. **The 2h-2 framing that SR-002 is "stale" no longer matches the post-migration records,** which call it an "Unresolved source conflict". Guides should not label either side stale.
7. **Rule 4.5's "carries them in full" decides O-12 and O-13, and should be made precise.** For example, it could state whether the Bitcoin finalization list must include the re-validation of the activation gate and the fee-tier selection.
