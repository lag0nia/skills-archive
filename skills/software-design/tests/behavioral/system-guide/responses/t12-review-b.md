# T12 Review B: Bitcoin, Settlement and Observation guides

Reviewed package (read-only): `scratchpad/eval/snap-t12/bitrise21/loan-system/design/technical-design`
Pristine comparison: `scratchpad/eval/pre/bitrise21/loan-system/design/technical-design`
Criteria: key v1 part 4 and correction v2 part 5. Checklist: key v1 parts 1–2, as amended by v2 parts 2–4.

Guides reviewed:
- `guide/domains/bitcoin-authorization-and-recovery.md` (BTC)
- `guide/domains/base-usdc-settlement-and-funding.md` (SET)
- `guide/domains/base-observation-and-fallback-review.md` (OBS)

Each guide line was checked against its owning record in the snapshot. Where the migration replaced a pre-migration narrative, I also compared the pristine `domain.md` text. Guide line numbers refer to the snapshot files. I did not run a guide-only reader test (v1 4.1 step 4), so the reader-question part of the 4.7 pass rule is not scored here. Every verdict below rests on the other three conditions and on the v2 acceptance blockers.

## Summary of verdicts

| Guide | Critical | Major | Facts preserved | v2 acceptance blockers | Verdict |
| --- | --- | --- | --- | --- | --- |
| Bitcoin Authorization And Recovery | 0 | 3 | 12/16 (75%) | yes (omitted residual risk; B-16; O-16) | **Fail** |
| Base USDC Settlement And Funding | 0 | 2 | 10/15 (67%) | yes (O-16; refund-never-waits omitted) | **Fail** |
| Base Observation And Fallback Review | 0 | 2 | 11/16 (69%), 1 partly contradicted | yes (owner contradiction; O-16) | **Fail** |

None of the three guides has a Critical defect. Each states the recorded open questions it reaches as unresolved: package count and the no-qualifying-tier fee rule in BTC, and beta upgrade governance, the effect of an upgrade on running loans, and the on-chain pause in SET. None makes a readiness or availability overclaim. They fail on omitted conditions and residual risks, on the v2 fallback-condition rule, and in OBS on one sentence that contradicts SR-007.

---

## 1. Bitcoin Authorization And Recovery guide

### 1.1 Defects

**BTC-1 — Major: residual risk omitted (activation pending is not active; acceptance and activation are not atomic).** Must-preserve fact B-6.
- Guide, line 40: "The acceptance call itself makes X public on Base; once that acceptance reaches Base L1 finality, the construction responsibility may act on it, completing one activation transaction with X and broadcasting it." The guide never says the loan is "activation pending", not active, after Base acceptance. It never says that the Base principal payment and Bitcoin activation are not atomic, or that the lender is unsecured if the prefund refund confirms first. The only "pending" in the guide is "terminal signing pending" (line 52).
- Owners: `inv-018-activation-pending-recovery.md` "## Rule": "After Base L1-finalized acceptance, the durable state is `Base accepted / X public / activation pending`, not active." `sec-023-...md` "## Honest Capability Claim": "Base acceptance and Bitcoin activation are not literally atomic, so activation pending remains a residual lender risk."
- Type: omitted residual risk (v1 4.3, "activation-pending lender exposure (non-atomic)"). This is a v2 5.1 acceptance blocker (material omitted residual risk).

**BTC-2 — Major: no-redirection fact missing for a stolen or matured default package, and the export wording narrows who can broadcast.** v2 A-16/B-16 (v2 5.2 cross-guide check).
- Guide, line 92: "The lender may only export its package for its own broadcast, and only once that package's Bitcoin condition is valid." Line 12: "it gives nobody, including the application, permission to choose a new destination." The guide never says that anyone holding a matured signed default package can broadcast it, that it still pays only the fixed lender destination, or that a holder may collude, extort or sabotage. "For its own broadcast" suggests that only the lender can broadcast, which is the "it cannot be broadcast without the lender" answer that Q-B9 marks as wrong.
- Owners: `sec-025-...md` (Plausibility): "a random package thief cannot redirect value but may collude, extort, or sabotage". `sec-025` "## Prohibited Authority": "the package holder may not redirect the fixed payout". `sec-013-...md` "## Lifecycle Impact": "any holder of the signed default package can force the fixed lender payout". `scope-001-...md` "## Boundary": "export ... for manual/external broadcast".
- Type: omitted fact plus narrowed meaning. Major under v2 part 4 and an acceptance blocker. Line 81 correctly covers a stolen loan key (SEC-013 arbitrary redirection), so a reader who meets only that passage may also conclude that a stolen package can be redirected.

**BTC-3 — Major: the fallback is introduced with a vague qualifier instead of its two conditions.** v2 O-16.
- Guide, line 18: "An optional **S**, held by an independent validation service for eligible loans, can complete that same recovery transaction, but only after ..." "Eligible" is not defined in this passage. Neither condition (H(S) committed when the loan was created, and the production-activation gate) appears here.
- Owners: `inv-025-...md` "## Rule": "borrower Bitcoin recovery through `S` exists only for a loan created after the ECVS production-activation gate". `inv-004-...md` "## Rule": "ECVS-owned `S`, after production activation". `sec-024-...md` "## Honest Capability Claim": "Bitcoin collateral remains exposed for every loan without an activated `H(S)` capability and until an `S` recovery confirms".
- Type: omitted condition through a vague qualifier. Major under v2 part 4 and an acceptance blocker.
- Mitigation: line 62 restates the INV-025 condition: "For a loan created after the validation service is activated for production". That passage passes. Even so, it does not say that no record shows the gate has been met, or that H(S) must be committed before escrow construction (Minor, recorded as BTC-7).

**BTC-4 — Minor: cooperative settlement weakened (B-14).**
- Guide, line 30: "fresh signatures for a cooperative settlement". Line 96: "The cooperative transactions themselves are defined, but the signing experience, Base accounting and support process are not."
- Owners: `scope-005-...md` "## Boundary": "fresh borrower/lender signatures from the same rederived hardened loan child keys". `flow-009-...md` "## Failure And Reroute": "One-sided/refused consent ... reused setup signature ... stops this flow".
- What is missing: the guide never says that both participants must freshly agree and sign, or that setup, default and recovery signatures cannot be reused.

**BTC-5 — Minor: two-step disclosure partly stated (B-12).**
- Guide, line 40 gives the review step and says the second, exact-bytes confirmation "authorizes signing and submission". It omits that any failure or cancellation clears the plaintext and the worker (`sr-004-...md` "## Failure And Recovery"), and does not describe the lender's matching two-step `releaseWithY` (`sr-009-...md` "## Owns"). What each confirmation permits is preserved.

**BTC-6 — Minor: a required control is worded as an established practice (2g).**
- Guide, line 79: "That is why scripts, witnesses and manifests are checked exactly against golden fixtures and independent implementations."
- Owner: `sec-011-...md` "Detection and recovery": golden fixtures and independent implementations "are required". The VA records are "Planned — unverified".
- Type: requirement presented in the present tense as if performed. This is a light status blur, not a readiness claim.

**BTC-7 — Minor: fallback status in the "When the lender never reveals Y" passage.**
- Guide, line 62 states the gate as a condition but does not say the capability is currently unavailable, and does not say that H(S) must be fixed before escrow construction.
- Owners: `state-007-ecvs-s.md` "## States": "Production unavailable". `sr-007-...md` "### Establishing the capability before a loan exists".
- v1 4.6 asks only that the Bitcoin guide say the fallback is production-gated, which this passage does.

**BTC-8 — Note: package-count characterization follows the migrated record, not the pristine one.**
- Guide, line 86: "Both statements stand in their records and the question is undecided ... leaves the size of the archived set open."
- Snapshot `bitcoin-authorization-and-recovery/domain.md` "## Choices And Rationale": "Unresolved source conflict: size of the post-activation signed terminal phase ... This record chooses neither." The guide is faithful to the current owner and does not adopt 12, so it is not a defect.
- The pristine `domain.md` "### Package Lifecycle And Recovery" said: "The current package contract specifies six borrower recovery, six lender recovery, and six borrower long-stop variants. A stale SR-002 archive sentence still says twelve terminal packages; this documented source conflict remains for a separate repair." The migration changed the owner's account of which side is current. This should go to the technical-diff review (section 5).

### 1.2 Fact checklist (v1 1.3 plus v2)

| Fact | Status | Note |
| --- | --- | --- |
| B-1 prefund ≠ escrow; package ≠ permission to retarget | Preserved | lines 9–12 |
| B-2 secret roles; long-stop needs neither; no organization key | Preserved | lines 16–20 (but see BTC-3) |
| B-3 zero-confirmation build/sign; six confirmations for window, gate and reliance | Preserved | line 36 (says "once the terms are committed"; preparation acknowledgement is implied by commitment) |
| B-4 6+6 at 10…200; borrower signs 12, lender signs 6 activation | Preserved | lines 36, 38 |
| B-5 terminal only for actual winner; 6+6+6; stale or conflicting 12 noted | Preserved | lines 42, 86 (BTC-8) |
| B-6 activation pending; non-atomic; lender exposure | **Missing** | BTC-1 |
| B-7 signing order; receipt never an input; terminal-signing-pending; no reversal | Preserved | lines 38, 52 |
| B-8 changed parent invalidates; same-parent reorg pauses | Preserved | line 48 |
| B-9 same transaction with Y or S; final only on confirmation | Preserved | lines 44, 62 |
| B-10 T and B via MTP; concurrent; first confirmed wins; Base cannot revoke | Preserved | lines 22, 62 |
| B-11 manual export and external broadcast only; no organization broadcast | Preserved | lines 82, 92 |
| B-12 two confirmations and what each permits | Preserved (minor omission) | BTC-5 |
| B-13 fixed tiers; strict 1.25 integer rule; estimator outage; CPFP; no-tier conflict | Preserved | lines 56, 58, 88 |
| B-14 cooperative needs both fresh signatures; deferred operations | Weakened | BTC-4 |
| B-15 no forgotten-password recovery; signed packages usable; lender window | Preserved | lines 64, 82 |
| B-16 holder cannot redirect | **Missing** | BTC-2 |

Distinctions:
- 2a (line 32: "Signing in to the product never exposes ... plaintext keys or secrets"; line 74): preserved.
- 2b (line 72): preserved.
- 2c (prefund refund, line 54, kept apart from the Base refund, line 62): preserved.
- 2d (same transaction and no new signature; gated): preserved apart from BTC-3.
- 2e (lines 44, 60): preserved.
- 2g: BTC-6 only.

### 1.3 Unresolved points reached

| Point | Where | Treatment |
| --- | --- | --- |
| 2h-2 package count | lines 42, 86 | Both sides stated; undecided; consistent with the migrated owner (BTC-8) |
| 2h-3 no qualifying fee tier | lines 56, 88 | Both sides stated; undecided; kept apart from the estimator-outage case |
| Zero-confirmation signing not verified (INV-015 owner clarification) | line 36 | Described as design behavior; no claim that it is verified. Acceptable. |
| 2h-1, 2h-5, 2h-7, 2h-8 | not reached | — |

### 1.4 Verdict: **Fail**

There are no Critical defects. There are three Major defects (BTC-1, BTC-2, BTC-3), and v1 4.7 fails a guide at two. Preservation is 75%, below the 90% threshold. Every Major is also a v2 5.1 acceptance blocker (material omitted residual risk or condition).

---

## 2. Base USDC Settlement And Funding guide

### 2.1 Defects

**SET-1 — Major: the fallback is mentioned without either condition.** v2 O-16.
- Guide, line 35: "The finalized refund event is the only positive Base trigger for the optional Bitcoin fallback." This is the guide's only fallback passage. It never says the fallback exists only for loans created after the production-activation gate with H(S) committed, or that the capability is currently production-unavailable.
- Owners: `inv-007-...md` "## Rule": "Only the canonical Base-L1-finalized `UnclaimedRepaymentRefunded` event may trigger publication of a production-activated ECVS `S`". `inv-025-...md` "## Rule". `iface-017-...md` "## Boundary": "The selected but production-gated ECVS".
- Type: omitted condition. Major under v2 part 4 and an acceptance blocker.

**SET-2 — Major: the refund's independence from the fallback and its lack of expiry are omitted.** S-10; 2d requires the Settlement guide to say "the refund never waits for the ECVS".
- Guide, line 35: "the exact repayment becomes refundable once, by anyone's call, to the borrower's refund recipient as it stood at C." Nothing says the refund stays callable indefinitely or that it never depends on, or waits for, the fallback service.
- Owners: `inv-007-...md` "## Rule": "the Base refund never depends on ECVS". `iface-017-...md` "## Boundary": "It is not required for and must never gate the Base refund." `sr-007-...md` "### From an unclaimed repayment to public S": "The refund remains available indefinitely and never waits for this service." `sr-003-...md` "## Failure And Recovery": "Fixed permissionless recovery remains callable indefinitely".
- Type: omitted condition on when the refund can be used. Major, because this content is explicitly assigned to this guide by key 2d, and an acceptance blocker. The OBS guide carries it (OBS line 41), but each domain guide must stand alone (v1 4.6).

**SET-3 — Minor: default classification weakened (S-14).**
- Guide, line 55: "a missing Y or lender silence never implies ... default." That covers "valid repayment without a lender claim is never ordinary default".
- Owners: `flow-008-...md` "## Ordered Transitions", step 3: "Classification does not bypass Bitcoin MTP, sign, select, or broadcast a lender package". "## Failure And Reroute": "Observer conflict/unavailability pauses classification rather than inferring default."
- What is missing: that default is classified only from canonical Base facts, and that classification neither bypasses timelocks nor broadcasts a package.

**SET-4 — Minor: no statement that acceptance cannot be company-held or delegated (S-6), and SCOPE-003/SCOPE-014 are not listed.**
- Guide, line 27: "Acceptance is deliberate and happens in the borrower's Vault". The "Excluded" list (line 72) omits SCOPE-003 (no company-held X or delegated acceptance) and SCOPE-014 (platform-paid reveal execution deferred). Both name SR-003 among their responsibilities.
- Owners: `scope-003-...md` "## Boundary"; `scope-014-...md` "## Boundary".
- Type: an exclusion omitted for the guide's domain (v1 4.3 lists this as Major). I rate it Minor because the positive statement, that acceptance happens deliberately in the borrower's own Vault, carries most of the boundary.

**SET-5 — Minor: refund-recipient switch weakened (S-9).**
- Guide, line 35: "the borrower may make one switch of that recipient from its original Base recipient to its own committed protocol address on Base".
- Owner: `iface-009-...md` function table: "Only committed `borrower_base_protocol_address`, strictly before `C`, before any prior switch ... Irreversibly changes".
- What is missing: that the protocol account must sign the switch, and that the switch is irreversible.

**SET-6 — Minor: wrong amount for the funding-expiry refund.**
- Guide, line 39: "If the principal is not finalized in time, or the borrower does not accept within 24 hours of finalized funding, anyone may trigger the fixed refund of the principal to the lender's fixed recipient."
- Owner: `iface-009-...md`: `refundExpiredFunding` "returns the funding vault's current configured-USDC balance only to fixed `lender_base_settlement_recipient`". Only `refundUnaccepted` "Returns principal exactly once".
- Type: changed value for the expiry case. The guide's own line 41 handles partial amounts correctly.

**SET-7 — Minor: the opener is omitted.**
- Guide, line 25: "the contract opens the loan's record and deploys its funding vault".
- Owner: `iface-009-...md`: `openFundingWindow` caller is the "Dedicated platform-funded opener, after external Bitcoin qualification". `inv-019-...md` "## Rule" limits that opener.
- Effect: the reader loses the opener role whose compromise the guide later discusses (line 62, "A compromised account allowed to open loans").

**SET-8 — Minor: activation-pending lender exposure named but not explained.**
- Guide, line 27 states that the loan "stays activation pending". It does not say that Base has already paid the principal and that the lender is exposed if activation fails (`sec-023-...md` "## Honest Capability Claim"). The fact is assigned to BTC, so this is Minor here.

**SET-9 — Minor: one source omitted from the on-chain pause tension.**
- Guide, lines 63 and 71 cite only STATE-019 for the pause side.
- Owner: the snapshot Settlement `domain.md` also cites `sec-017-...md` ("pause key"; incident step "pause new funding"). The tension is still reported as undecided, which v2 2h-8 accepts.

### 2.2 Fact checklist (v1 1.4 plus v2)

| Fact | Status | Note |
| --- | --- | --- |
| S-1 Base cannot sign, broadcast or confirm Bitcoin | Preserved | line 7 |
| S-2 immutable ownerless vaults; deposits provisional | Preserved | lines 11, 13 |
| S-3 payer-neutral | Preserved | line 12 |
| S-4 lender alone controls funding; no pooling, custody or draw | Preserved | lines 19, 53 |
| S-5 24-hour window after qualification; exact principal; fixed lender recovery | Preserved | lines 25, 41 (SET-6, SET-7 Minor) |
| S-6 ≤24 h acceptance via own Vault; atomic; activation pending; no delegated acceptance | Weakened | SET-4 |
| S-7 valid repayment definition | Preserved | line 29 |
| S-8 claim strictly before C = D + 172,800 s; fixed recipient once; Y public | Preserved | line 31 |
| S-9 one optional irreversible switch to protocol account; freezes at C | Weakened | SET-5 |
| S-10 refund once to frozen recipient, indefinite, never waits for the fallback | Weakened | SET-2 |
| S-11 only the finalized refund event triggers; refund ≠ Bitcoin recovery; T independent | Weakened | lines 35, 37 are correct, but SET-1 |
| S-12 permissionless caller controls nothing; invalid calls revert | Preserved | lines 17, 43 |
| S-13 (v2-amended) Safe and timelock; beta governance and running-loan effect unresolved; immutable vaults; direct exits; no on-chain pause | Preserved | lines 62–63, 69–71 |
| S-14 default classification | Weakened | SET-3 |
| S-15 payment account is only a payer; participant transfer has no loan binding; cooperative accounting deferred | Preserved | lines 57, 67 |

Distinctions:
- 2a (acceptance and claim are made by the participant's own Vault, lines 27, 31): preserved.
- 2b (line 55): preserved.
- 2c (line 37 "A Base refund does not recover the Bitcoin"; the three refunds are distinguished at lines 35 and 39): preserved.
- 2d: SET-1 and SET-2.
- 2e (line 55 "a submitted transaction ... never implies"): preserved.
- 2f (lines 19, 25, 41): preserved.
- 2g: no readiness language.

### 2.3 Unresolved points reached

| Point | Where | Treatment |
| --- | --- | --- |
| 2h-5 beta upgrade governance | lines 62, 69 | Both sides with sources; "The records do not decide which holds during the beta." Correct. |
| 2h-5 effect of an upgrade on running loans | lines 62, 70 | Both sides; undecided. Correct. |
| 2h-8 on-chain pause | lines 63, 71 | Reported as an open tension (accepted by v2); SET-9 Minor |
| 2h-7 who may reveal X or Y | lines 27, 31 | States neither scope and does not say "only the Vault". Not a defect under v2, but not the accepted "both scopes" treatment either. |
| 2h-1 approval | not reached | — |

### 2.4 Verdict: **Fail**

There are no Critical defects. There are two Major defects (SET-1, SET-2), and v1 4.7 fails a guide at two. Preservation is 67%. Both Majors are v2 5.1 acceptance blockers. The handling of the open questions is good.

---

## 3. Base Observation And Fallback Review guide

### 3.1 Defects

**OBS-1 — Major: one sentence contradicts SR-007 on what follows a fallback failure.**
- Guide, line 57: "An outage can be recovered by independent verification and public replay of the same committed S. ... Early disclosure is itself dangerous, because it could enable premature borrower recovery. ... In every one of these cases the Base refund remains complete, and Bitcoin recovery through S is simply unavailable."
- Owner: `sr-007-...md` "### When the path fails": "Outage or interruption may be recovered by independent verification and public replay, using the same committed S ... Early disclosure is itself dangerous because it could enable premature borrower recovery. In all of these cases the completed Base refund remains valid, but unspent Bitcoin can still be reached by other already-authorized routes."
- What is wrong: the guide replaces the owner's conclusion ("unspent Bitcoin can still be reached by other already-authorized routes") with "Bitcoin recovery through S is simply unavailable" in every case. That contradicts two of the cases it lists. An outage is recoverable through the same S, and early disclosure makes recovery through S possible too early. Line 59 restores the other routes, so the residual-route content survives, but the summary sentence is wrong.
- Type: changed meaning, contradicting the owner. It is not a v1 Critical category, but it is a v2 5.1 acceptance blocker ("a contradiction of an owner").

**OBS-2 — Major: fallback passages use "eligible loan" and leave the production gate to a later section.** v2 O-16.
- Guide, line 15: "For each eligible loan it holds a secret S". Line 43: "The fallback works as follows for an eligible loan:", followed by a figure (lines 45–53) whose steps and caption never mention the production-activation gate. Line 63: "for an eligible loan".
- The conditions appear only in the closing section (line 81: "The fallback is selected but not available. Production use is gated by counsel approval and implementation evidence. Until that gate is met, no new loan may commit to S ..."). The figure's "Commit" step gives the timing of the commitment, but not the gate.
- Owners: `sr-007-...md` "### Establishing the capability before a loan exists": "Counsel approval and implementation evidence must activate production use **before any new loan commits H(S)**". `inv-025-...md` "## Rule". `sec-024-...md` "## Honest Capability Claim".
- Type: omitted condition through an undefined qualifier, in the main narrative and figure. Major under v2 part 4 and an acceptance blocker. v1 4.1 step 5 reads figures and callouts at the same strictness, and this figure is the part most likely to be excerpted.
- Mitigation: SR-007 itself uses "For an eligible loan". Line 81 is a correct and prominent statement. A fix that only states both conditions where "eligible loan" first appears, and in the figure caption, would clear this defect.

**OBS-3 — Minor (fact weakened): the service's independent check list is incomplete.** O-11; key 2d requires it in full in this guide, and v1 4.5 allows summarizing only in the Architecture guide.
- Guide, line 49: "the service independently checks the chain, deployment, loan, event, amount, frozen recipient and finality."
- Owners: `sr-007-...md` "### From an unclaimed repayment to public S": "configured chain, deployment and current implementation, event signature, loan, transaction and log, block canonicality, finality, exact debt and frozen recipient. It does not trust a workspace label or an operator's assertion." `cons-020-...md` "## Rule" (adds proxy/implementation, ABI/event, block, transaction, log, canonicality).
- What is missing: current implementation (proxy), transaction and log provenance, canonicality, and the refusal to trust a workspace label or operator. Line 55 covers only the application observer.

**OBS-4 — Minor (fact weakened): the Bitcoin finalization checks are reduced.** O-12; key 2d.
- Guide, line 51: "The Bitcoin domain checks the publication and hash, inserts S into the same signed transaction and broadcasts it."
- Owner: `sr-007-...md`: "It validates the activation gate, public source and event binding, matching hash, exact retained recovery package, signature, fixed outputs and still-unspent escrow." `iface-020-...md` "## Preconditions And Validation".
- What is missing: the activation gate, the retained package, the signature, the fixed outputs, and the still-unspent escrow. The figure caption ("the Bitcoin domain decides whether the fixed transaction can be completed, and only confirmation finishes it") keeps the authority boundary, which is why this is Minor and not Major.

**OBS-5 — Minor (fact weakened): lookup outcomes are incomplete.** O-13.
- Guide, line 57 keeps "An empty or unreachable publication source does not prove that the service deliberately withheld S."
- Owner: `sr-007-...md` "### From an unclaimed repayment to public S".
- What is missing: the four lookup outcomes (no publication yet, valid publication, invalid or mismatched publication, unavailable source), and that the product receives only public metadata and the commitment-match conclusion.

**OBS-6 — Minor: provider conflict and dual outage merged into one rule.** v2 O-4.
- Guide, line 29: "If both Base providers are unavailable or disagree, finalized status already shown stays visible, and new consequential actions that depend on Base are blocked until the problem clears."
- Owner: `sel-014-...md` lines 33 and 35 split the two cases. A conflict raises a `base-observation-conflict` alert until canonical replay, with no manual override. A dual outage shows data as delayed and alerts after five minutes. v2 rates the merge as Minor. No override is invented.

**OBS-7 — Note: "roughly twenty minutes" is sourced, not invented.**
- Guide, line 23: "roughly twenty minutes as Base documents it, though this is not a promised waiting time". Line 75: "delays each consequential handoff by roughly twenty minutes".
- Owner: `sel-013-...md` "Base documents that stage as roughly 20 minutes" and "Using L1 finality delays each consequential handoff by roughly 20 minutes". The snapshot domain record adds that the rule "is not a promise of an exact waiting time".
- Faithful. Line 75 drops the caveat but repeats SEL-013's own wording. This is not the v1 4.6 "invented waiting time" defect (see section 4).

### 3.2 Fact checklist (v1 1.5 plus v2)

| Fact | Status | Note |
| --- | --- | --- |
| O-1 neither job decides entitlement or signs | Preserved | lines 17, 66, 71 |
| O-2 observed and safe are progress only; L1 finality; no exact wait promised | Preserved | lines 9, 23 (OBS-7) |
| O-3 versioned handoff; cursor after acknowledgement; resend same identity; no direct writes | Preserved | lines 21, 76 |
| O-4 Alchemy/QuickNode; one healthy provider; blocked on conflict or outage | Preserved | line 25, 29 (OBS-6 Minor) |
| O-5 reorg kept as noncanonical; correction; replay; operator recheck only | Preserved | line 31 |
| O-6 Bitcoin needs agreement; one incident; 5 min or one block; critical after acceptance | Preserved | line 33 |
| O-7 payment evidence ≠ loan event | Preserved | line 35 |
| O-8 one independent service; per-loan S; hash only; no early receipt or override | Preserved | lines 15, 47, 55, 71 (omits "no provider-wide master secret", Minor) |
| O-9 commit before escrow and signatures; unique; no add-later; no rotation | Preserved | lines 47, 57, 81 |
| O-10 selected, not operating; counsel and implementation gate; ticket insufficient | Preserved | line 81 |
| O-11 independent checks in full | Weakened | OBS-3 |
| O-12 publication only makes S usable; Bitcoin checks; confirmation | Weakened | OBS-4 |
| O-13 four lookup results; silence ≠ refusal; product gets metadata | Weakened | OBS-5 |
| O-14 failure boundaries; outage recoverable; no company release or replacement | **Partly contradicted** | stated correctly, then contradicted by the summary sentence (OBS-1) |
| O-15 lender at D + 3 days, long-stop at D + 10 days, cooperation, first confirmed wins; residual risks, not default | Preserved | line 59 |
| O-16 both fallback conditions in each fallback passage | Weakened | OBS-2 |

Distinctions:
- 2b (lines 9, 21, 35): preserved.
- 2c (lines 39, 41, 52): preserved.
- 2d: OBS-2 through OBS-5.
- 2e (figure steps Publish, Complete and Confirm): preserved.
- 2g ECVS availability (line 81): preserved.
- v1 4.6, diagrams: the figure draws no authority the service lacks. Its caption says the service only verifies and publishes.

### 3.3 Unresolved points reached

| Point | Where | Treatment |
| --- | --- | --- |
| Counsel approval or implementation evidence not recorded (2d silence, 2h-4) | line 81 | Presented as not available. Correct. |
| 2h-4 FLOW-005 omits the long-stop while SR-007 includes it | line 59 | Long-stop included. Correct. |
| 2h-6 where H(S) sits | figure "Commit" and "Bind" | Does not claim every loan carries H(S). Acceptable. |
| Other 2h items | not reached | — |

The snapshot Observation domain record holds no open questions. No conflict is silently resolved.

### 3.4 Verdict: **Fail**

There are no Critical defects. There are two Major defects (OBS-1, OBS-2), and v1 4.7 fails a guide at two. Preservation is 69% with one fact partly contradicted, while v1 4.7 requires none contradicted. OBS-1 is a v2 5.1 acceptance blocker (owner contradiction) and OBS-2 is a blocker under O-16. Apart from these, the guide is strong: finality, providers, reorg, payment evidence, gate status and residual routes are all correct.

---

## 4. Where the answer key or correction is wrong or incomplete

1. **v1 4.6 and O-2, "waiting times for finality" listed as an invented number.** `sel-013-...md` records "roughly 20 minutes" as Base's documented figure and gives the consequence that each handoff is delayed by roughly 20 minutes. A guide that repeats it with the "not a promised waiting time" caveat is faithful. The key should forbid only promised or exact waiting times, not the sourced approximation.
2. **v1 2h-2, the owner's "stale" characterization of the 12-package sentence, no longer exists in the migrated package.** The snapshot Bitcoin `domain.md` "## Choices And Rationale" now says "This record chooses neither", and the snapshot architecture no longer has "## System Overview". A guide that follows the migrated owner (as BTC line 86 does) should be accepted. Whether the migration may turn "stale ... for a separate repair" into "chooses neither" is a question for the technical-diff review (section 5). It changes the owner's account of which side is current.
3. **v2 O-16, "vague quantifier".** SR-007 itself writes "For an eligible loan" and "for loans constructed with this capability". The rule should say explicitly that "eligible" counts as vague unless the same passage defines it. Otherwise guides that copy owner wording will be scored inconsistently.
4. **v2 2h-8 sources are incomplete.** The pause side also includes `sec-017-...md` lines 14, 55 and 66 ("opener/pause/operational signers", "pause key", "pause new funding"), which the migrated Settlement domain record cites. The v2 treatment of what is accepted is unaffected.
5. **v2 2h-7 does not cover silence.** It says what is accepted (both scopes, or a reported tension) and what is a Major defect ("only the Vault-derived caller", or any caller's reveal treated as a valid transition). It does not say how to score a guide that describes the Vault call and states neither scope, as SET lines 27 and 31 do. I treated it as no defect.
6. **v1 S-5 and the funding-expiry refund amount.** The key's "Expired funding ... recoverable only to the fixed lender settlement recipient" is correct, but no key item records that `refundExpiredFunding` returns the vault's current balance while `refundUnaccepted` returns exactly the principal (`iface-009`). Guides blur this (SET-6). This is a candidate Minor checklist item.

I found no other key item contradicted by the records I checked: SR-002/004/009, SR-003/005, SR-006/007, INV-003/004/007/008/010/015/016/017/018/019/020/024/025/026, IFACE-007/009/011/016/017, SEC-011/013/017/023/024/025, SCOPE-001/002/003/005/006/007/014, SEL-004/009/013/014/021/022/027, STATE-007/009/010, FLOW-008/010, and the decision overview for the fee-tier attribution. Line 78 of the BTC guide, "The six levels were specified and approved by the design's human owner", is correct: the decision overview lists it under "Human-approved · User specified", owned by TICKET-0018.

## 5. Notes for the technical-diff review (outside this guide review)

- `system-model/domains/*/domain.md` (Bitcoin, Settlement, Observation) and `system-model/architecture.md` lost their narrative sections in the snapshot. The Bitcoin package-count conflict was recharacterized: the pristine record called the SR-002 sentence stale and the 18-package contract current, while the snapshot "chooses neither". This may be the v2 5.1 blocker "a side of an open question rewritten" and should be checked against the authorization for the migration.
- The snapshot Settlement and Bitcoin domain records now hold explicit open-question entries (upgrade governance, running loans, on-chain pause, package count, fee tier). They agree with v2 2h-5 and 2h-8 and with v1 2h-2 and 2h-3, apart from the characterization point above.
