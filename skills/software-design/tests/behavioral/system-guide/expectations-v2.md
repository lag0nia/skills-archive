# Answer Key Correction v2

This file amends [expectations.md](expectations.md) (v1, SHA-256 `f376b8b03553f94765e1b156a0ad97faa3c6ea961e4838b8320e5de1ed96af6a`). v1 stays unchanged, and every score recorded through T8 in [results.md](results.md) stays as scored under v1. Runs from T9 onward are scored under v1 as amended here.

## 0. Provenance

- **Written before any T9 output existed**, by the coordinating session. No authoring agent sees v1 or v2.
- **Sources:** each correction was checked by the coordinating session against the pristine copy `scratchpad/eval/pre/...` (byte-identical to v1's `t0` root). Quotes and line locations below are from that copy.
- **Origin:** most corrections were first reported by the T4, T7 and T8 reviewers ([T4 A](responses/t4-review-a.md) part 0, [T4 B](responses/t4-review-b.md) part 5, [T7 A](responses/t7-review-a.md) part 5, [T7 B](responses/t7-review-b.md) part 5, [T8 A](responses/t8-review-a.md) "Notes on the answer key", [T8 B](responses/t8-review-b.md) parts 4–5). A reviewer claim enters v2 only when the quoted source supports it; where reviewers disagreed (the on-chain pause), v2 says so and states what is accepted.
- **Nothing here weakens v1.** No criterion is removed, no disputed point is marked settled, and no implementation-level detail becomes required. Corrections either fix a wrong citation or wording, add a missed conflict or fact, or move a check to the review that can see it.

## 1. Citations to removed narrative sections

v1 cites the pre-migration narratives (`architecture.md` "## System Overview", and each `domain.md` "## Domain Overview" and its subsections). A migration removes them. For a migrated package:

- A fact v1 cites from a removed narrative is still scored in the guide that v1 assigns it to.
- The technical-diff review checks separately that each such fact that the narrative held uniquely survives in a technical owner, or was reported to the user. Its absence from every owner is an unauthorized technical change (part 5), not a guide defect.
- Where v1 also cites a surviving owner, that owner governs.

Specific corrections:

- **A-13** (owner "## System Overview", third paragraph, removed by migration). Amended requirement: the architecture guide states each open question in 2h-1, 2h-2, 2h-3 and the new 2h-5 as unresolved, wherever the migrated records keep the conflict notes. The [4.7](expectations.md#47-suggested-pass-rule) Architecture requirement becomes "all four conflicts from 2h (2h-1, 2h-2, 2h-3, 2h-5)".
- **L-14, second sentence** ("A narrative or diagram cannot supply a missing approval", pre `loan-terms-and-commitments/domain.md` "### Choices And Scope"). It moves from the guide checklist to the technical-diff review: it must survive in a technical owner or be reported. A guide may restate it only when an owner holds it, because a guide adds no fact. The first sentence of L-14 stays a guide fact.
- **B-15 and Q-B8.** The SR-004 password-loss sentence is in "## Owns" (pre `sr-004-...md` line 33), not "## Failure And Recovery". SR-009's equivalent is correctly cited.

## 2. Conflicts and tensions added to 2h

### 2h-5. Upgrade governance during the beta (conflict, unresolved)

**Side A: a single upgrade key first, then the Safe**
- `build/records/selections/sel-009-base-contract-upgrade-governance.md` line 29: "a dedicated single upgrade key for local/test and the intentionally short public mainnet beta, followed by transfer of that same sole ownership to a 2-of-3 multisig-controlled timelock." Line 15: "Its one ownership path moves from the short beta key to a delayed 2-of-3 multisig."
- TICKET-0048 (`build/workflow/tickets/base-usdc-settlement-and-funding/sr-003/sr-003-tickets.yaml`), attributed human-approved.

**Side B: V1 retains the Safe and timelock, and a unilateral key is invalid**
- `inv-020-base-upgrade-boundary.md` line 14: "V1 retains the Transparent ProxyAdmin controlled by a 2-of-3 Safe through a seven-day timelock."
- `sr-003-...md` line 33: "Transparent Proxy administration retained under a 2-of-3 Safe-controlled seven-day timelock".
- `scope-007-...md` line 14; pre `base-usdc-settlement-and-funding/domain.md` line 35 ("retains its explicit Transparent Proxy administration, 2-of-3 Safe, seven-day timelock").
- `state-019-...md` line 48 lists as invalid an "Unrestricted unilateral upgrade/admin key"; `sec-017-...md` line 55: "No unilateral upgrade/admin/opener/pause key may … bypass the timelock/Safe".

**Related tension: what an upgrade does to running loans.** `sel-009` line 32: "A compatible approved upgrade becomes the one current code path for every loan held by the proxy." `inv-020` line 14: "existing loans remain on their originating contract and are not silently migrated"; `state-019` line 37: "Do not migrate or reinterpret existing originating loans."

**Owner's characterization:** none. The pristine package does not record this conflict. Whether SEL-009's beta key is the "unrestricted unilateral" key that STATE-019 forbids is not stated by any owner.

**Required:** the guides present the governance during the beta, and the effect of an upgrade on running loans, as unresolved, with both sides. A guide that states either side as settled has the Critical defect "conflict silently resolved" ([4.2](expectations.md#42-critical-defects-any-one-fails-the-guide), now covering 2h-5). Changing any record on either side to match the other is an unauthorized technical change (part 5). **S-13 and Q-S8** are amended: the Expected answer names the Safe and timelock, says the beta-period governance and the effect on running loans are unresolved, and keeps the rest of v1 (immutable vaults, direct exits, no on-chain pause).

### 2h-6. Where the fallback commitment sits (tension, classification uncertain)

`sr-001-...md` line 28 lists the loan binding, ending "Conditional `H(S)` is present only for loans created with the approved capability." `iface-001-...md` line 27 says "Only these fields belong in `LoanTermsV1`" and its 19 fields omit `H(S)`. SR-001's list is broader than `LoanTermsV1` (it also names offer revision and account references, which IFACE-001 places elsewhere), so the two may describe different artifacts.

**L-12 amended:** "The fallback-secret commitment H(S) is bound to the loan only for loans created with the approved capability." Either treatment is accepted: stating that conditional binding without naming the field list, or reporting the tension. Stating that every loan carries H(S) stays a defect.

### 2h-7. Who may reveal X and Y on Base (tension, classification uncertain)

`iface-009-...md` lines 25 and 28: `acceptX` and `releaseWithY` accept "Any caller" with the matching secret. `iface-014-...md` line 104: a reveal "from an EOA other than the immutable term-bound Vault-derived caller is not a valid protocol transition even if a wallet transaction confirms." The first describes the contract's permission, the second protocol validity; no owner says what follows when the two diverge.

**Accepted:** stating both scopes, or reporting the tension. **Defect (Major):** saying only the Vault-derived caller can execute the call, or that any caller's reveal is a valid protocol transition.

### 2h-8. On-chain pause (tension, reviewers disagree)

`sel-009` lines 15, 30 and 35, `sr-003` line 33 and `cons-008` line 14 say V1 has no on-chain pause; SEL-009 line 35 describes the incident pause as a frontend/API and opener stop that "does not block valid direct contract calls". `state-019` line 15 lists "pause/operational roles" in the deployment identity and line 26 a "Paused for new/risky action" state, without saying whether they are on-chain. T7 B read this as a conflict; T8 B read it as reconcilable.

**Accepted:** "no on-chain pause" with SEL-009's operational pause, or a report of the tension. **Defect:** asserting that an on-chain pause exists (v1 4.2 "invented capability", unchanged).

### 2h-9. Participant references in the terms (tension, classification uncertain, Minor)

`iface-001` line 53: "random per-loan `bytes32` values that map privately to the actual product accounts". `sel-012` line 23 rejects "A new opaque random participant reference" and line 25 uses "the immutable borrower and lender account IDs". IFACE-003 line 19 places account IDs in the reservation record. Either treatment is accepted. Not a must-preserve fact.

### Reconciled by scope, not a conflict

**Reservation expiry versus cancellation.** `state-001` line 39: an unused reservation expires at 24 hours "before terms commitment and without a prefund attempt … once terms are committed, the 24-hour no-prefund rule routes to Reopened instead." This reconciles `sel-012` line 33 and `iface-003` line 87. A guide keeps both cases. Recording this as a source conflict in a technical record is a Minor process defect (the owners already reconcile it), and stating either case as the only rule is a Major defect (an omitted condition).

**Recovery phrase versus password loss (tension, classification uncertain).** `sel-005` line 29: "The phrase reconstructs master Bitcoin key material but does not decrypt encrypted `X`/`Y` records by itself"; `sr-004` line 33: "Password loss blocks secret disclosure, reconstruction, new signing, and cooperative settlement". **Q-B8 amended:** an answer that adds that the phrase reconstructs key material is accepted if it does not claim the phrase recovers a lost password, X or Y. The v1 Expected answer is otherwise unchanged.

## 3. Amended facts

- **P-9.** Replace "escalated at 180 seconds to a visible block" with: "probed at 0, 15 and 60 seconds, with a mandatory escalation decision at 180 seconds; after it, a participant or operator may reprobe or retry the identical bytes, and only missing exact pending evidence or contradictory evidence blocks the account." Sources: `state-021-...md` lines 41 and 43; `iface-022-...md` line 79. "Never silently re-signed" stays.
- **O-4 and Q-O3.** Add the split recorded in `sel-014-...md`: when the sources disagree (line 33), a `base-observation-conflict` keeps existing final projections, stops new Base-derived action and alerts operations until canonical replay resolves it, with no manual override; when neither source is usable (line 35), fresh Base data shows as delayed, operations are alerted after five minutes, and no new Base-derived action is taken. Merging the two into one rule with one alert time is a Minor defect; inventing an override is Critical (v1 authority collapse).
- **2d, supporting source.** `sec-009-...md` line 40: until the ECVS production-activation gate and implementation verification complete, "the product must clearly disclose that forgotten-password recovery and lender-silence borrower Bitcoin release are unavailable." It supports the existing 2d requirement; it adds no new guide fact.

## 4. Facts added to part 1

Each was confirmed in the T8 review as a guide failure and is an owner fact v1 covered only partly.

- **A-16 and B-16 (Architecture, Bitcoin).** Anyone holding a matured default package can broadcast it, but the payout goes only to the fixed lender destination: a package thief "cannot redirect value but may collude, extort, or sabotage" (`sec-025-...md` line 38), and "the package holder may not redirect the fixed payout" (line 57). Prevents: "a thief can take the collateral."
- **O-16 and A-8 amended (Architecture, Observation, Bitcoin, Settlement wherever the fallback is discussed).** After valid repayment with Y missing, "Bitcoin collateral remains exposed for every loan without an activated `H(S)` capability and until an `S` recovery confirms" (`sec-024-...md` line 64). Each passage that discusses the fallback states both conditions: H(S) committed when the loan was created, and the production-activation gate (2d). A vague quantifier ("many loans", "some loans") in place of those conditions is a Major defect (omitted condition).
- **P-6 strengthened, and applied to every guide that describes the handoff.** The handoff code is "an expiring pointer, not authentication, transaction consent, or cryptographic authority", and "the Vault never signs bytes supplied only by the normal-product page" (`iface-004-...md` lines 51–53). Wording that makes the handoff a specific signing authority ("not a general signing token") states distinction 2a in one direction only: Major.
- **2g extended.** Selected, implemented, verified, runnable, deployed and activated are distinct statuses. A guide states the status the owner records for each capability it describes; collapsing two is v1's Critical "status collapse" or "availability overclaim".

B-12 (the two disclosure confirmations and what each permits) and the all-estimators-unusable rule in B-13 are already in v1 and stay must-preserve facts for every guide that describes those steps.

## 5. Acceptance rules for T9 onward

Fixed before any T9 output was examined.

1. **Acceptance blockers.** A run is not accepted while any of these is confirmed:
   - a contradiction of an owner, in any guide, figure, table or callout;
   - an unauthorized technical change: a record's meaning changed, a side of an open question rewritten, a pinned record changed, or a fingerprint or hash refreshed to hide an impact;
   - a material omitted condition: a v1 4.3 omitted condition or residual risk, or an amended item in parts 2–4 marked Major.
   This is stricter than v1 4.7, which tolerated one Major per guide. v1 4.7 still applies per guide.
2. **Section 3 checks across all guides.** Each item is checked in every guide, figure, table and callout that reaches it: 2h-5 (upgrade governance open), A-16/B-16 (no redirection), O-16 (both fallback conditions), P-6 (handoff authority), B-12 (what each confirmation permits), 2g (status distinctions).
3. **Reviewer findings are verified** by the coordinating session against the cited source before they count, in either direction. A finding that contradicts this key is checked against the source; if the source supports the finding, it wins and is recorded as a v3 candidate rather than silently applied.
4. **Coached revisions do not count.** Only the author's own output before any coordinator feedback is scored. A guidance change after a run reruns the affected tests with fresh agents.
5. **Scoped runs.** The independent repeat (architecture plus Base Observation And Fallback Review) is scored only on those guides, plus the technical-diff review of every record it changed.

## 6. Reader questions added

The v1 questions stay. One question is added to the Architecture and Bitcoin reader sets, fixed before T9 output existed:

**Q-A9 and Q-B9.** If someone steals a signed default transaction prepared for the lender, what can they do with it, and where would the Bitcoin go?
- **Expected:** After it matures they can broadcast it, but it pays only the fixed lender destination; they cannot redirect the Bitcoin. They may still harm the borrower (for example after a valid repayment), collude, extort or sabotage.
- **Source:** `sec-025-...md` lines 38 and 57.
- **Wrong or dangerous:** "they can take the collateral," "they can send it anywhere," or "it cannot be broadcast without the lender."
