# T9 Review A: System Guide semantic fidelity

Scope: `snap-t9/.../technical-design/guide/architecture.md`, `guide/domains/loan-terms-and-commitments.md`, `guide/domains/participant-access-and-loan-operations.md`.
Owners checked: the snapshot's `system-model/`, `build/` and tickets, with `pre/` used to see what the records said before the guides and the migration. Criteria: key v1 part 4 as amended by v2 part 5. Checklist: key v1 parts 1–2 plus v2 parts 2–4. Line numbers are guide line numbers in the snapshot. Nothing was modified.

## Verdict summary

| Guide | Critical | Major | Facts preserved | Reader questions | Verdict |
| --- | --- | --- | --- | --- | --- |
| Architecture | 1 (2h-5 framing) | 2 (activation-pending risk; A-16 package holder) | about 10 of 16 (62%) | 7 of 9, with Q-A9 at risk of a dangerous answer | **Fail** |
| Loan Terms And Commitments | 0 | 2 (L-4 reservation limits; approval-is-not-signing) | 10 of 15 (67%) | 7 of 8 | **Fail** |
| Participant Access And Loan Operations | 0 | 5 (P-6 handoff; P-3; P-4; payment status; P-11) | 5 or 6 of 15 (about 40%) | 4 of 8, with a dangerous Q-P4 answer | **Fail** |

Acceptance blockers under v2 5.1 are present in all three guides. The architecture guide contradicts an owner (INV-020/SR-003/SCOPE-007 recast as "only the final" administration). All three omit a material condition or residual risk (activation-pending exposure; the 24-hour reservation rules; P-6 handoff authority, which v2 marks Major; the 15-minute reauthentication; the same-loan dual-role ban).

---

## 1. Architecture guide (`guide/architecture.md`)

### 1.1 Defects

**ARCH-1. Critical (conflict partly resolved; contradiction of an owner). Upgrade governance, 2h-5.**
- Guide, line 113: "three of them describe only the final multi-signature administration without the single key used during the beta, while two rule out an unrestricted single upgrade key."
- Owners:
  - `system-model/contracts/invariants/inv-020-base-upgrade-boundary.md`, "## Rule": "V1 retains the Transparent ProxyAdmin controlled by a 2-of-3 Safe through a seven-day timelock."
  - `sr-003-...md`, "## Owns": "Transparent Proxy administration retained under a 2-of-3 Safe-controlled seven-day timelock".
  - `scope-007-...md`, "## Boundary": "V1 retains the Transparent ProxyAdmin under the 2-of-3 Safe-controlled seven-day timelock".
  - On the other side, `build/records/selections/sel-009-base-contract-upgrade-governance.md`, "## Selected Or Inherited Direction": "a dedicated single upgrade key for local/test and the intentionally short public mainnet beta, followed by transfer of that same sole ownership to a 2-of-3 multisig-controlled timelock".
  - `state-019-...md`, "## Invalid Transitions": "Unrestricted unilateral upgrade/admin key".
- What is wrong: the guide states Side A's premise, a beta single key, as fact ("the single key used during the beta"). It then recasts the three Side B records as describing "only the final" administration. They do not: they say V1 *retains* the Safe and timelock, which is the conflict itself. This leaves "is the beta key unrestricted?" as the only open point, which is a partial resolution in Side A's favor that no owner makes. v2 2h-5 says no owner states whether the beta key is the forbidden key. The guide also never names the 2-of-3 Safe or the seven-day timelock, so a reader cannot see what Side B says. The effect of an upgrade on running loans is reported only as "worded differently", without either side, though it points to the Base guide.
- Severity: Critical under v2 2h-5 ("states either side as settled"). If the coordinator counts the explicit "None is decided here" label as enough to rule out "silently", this is at least a Major changed meaning and still an acceptance blocker, because it contradicts INV-020.
- Fix: "SEL-009 selects a single upgrade key for the short mainnet beta, then a 2-of-3 Safe with a seven-day timelock. INV-020, SR-003 and SCOPE-007 say V1 retains the Safe and timelock, and STATE-019 and SEC-017 rule out a unilateral upgrade key. Which governs during the beta is undecided."

**ARCH-2. Major (residual risk omitted). Activation-pending lender exposure.**
- Guide, line 90: "**Acceptance without activation.** After X is public, the loan is not yet active. The system keeps pushing the chosen activation route until its escrow output has six confirmations. …" There is no mention of the race with the prefund refund. Line 48, the figure and line 96 are also silent on it.
- Owners:
  - `sec-023-...md`, "### SEC-023.THREAT-001 …": "The borrower has the principal and recovers the prefunded BTC instead of locking it in active escrow. The lender is left with unsecured credit exposure. This is the principal residual cross-chain risk".
  - Same record, "## Honest Capability Claim": "Base acceptance and Bitcoin activation are not literally atomic, so activation pending remains a residual lender risk."
  - `inv-018-...md`, "## Rule".
- What is wrong: v1 4.3 names this residual risk. The guide narrates exactly this state but omits the one consequence that matters.

**ARCH-3. Major (omitted condition on who may act; v2 A-16 and Q-A9). Default package holder.**
- Guide, line 92: "The lender exports and broadcasts it manually; the organization does not broadcast it." The guide never says that anyone holding the matured package can broadcast it, or that its payout is fixed to the lender destination.
- Owner: `sec-025-...md`, "### SEC-025.THREAT-001": "a random package thief cannot redirect value but may collude, extort, or sabotage". "## Prohibited Authority": "the package holder may not redirect the fixed payout".
- What is wrong: A-16 is missing. The guide's wording invites the v2 dangerous answer to Q-A9, "it cannot be broadcast without the lender".

**ARCH-4. Minor. Invented or overstated open point: "One provider as enough".**
- Guide, line 112: "The provider selection lets one healthy provider report a finalized Base fact, while a security record says no one source may become authoritative."
- Owners:
  - `sec-020-...md`, "## Prohibited Authority": "No one source, nominally independent but shared upstream, relay, operator, saved snapshot, provisional finality, or provider outage may become authoritative chain/lifecycle state."
  - The same record's Required Controls "**Rule:**" line: "IFACE-012/STATE-014 own Base failover, L1 finality, correction/replay".
  - `state-014-...md`: "One healthy source suffices for an L1-finalized fact."
  - `sr-006-...md`, "## Owns", says the same.
- What is wrong: SEC-020 itself delegates Base failover to STATE-014. The owners reconcile the two statements, and no owner flags a conflict. Presenting a settled rule as open casts doubt on O-4. It is only Minor because the guide states the rule correctly.

**ARCH-5. Minor. Fee no-tier wording tilts toward one side (2h-3).**
- Guide, line 108: "The fee-selection contract's general rule and a settled fee decision say … the 200-level transaction is used…".
- Owner: snapshot `bitcoin-authorization-and-recovery/domain.md`, "## Choices And Rationale": "the IFACE-007 payload rule and TICKET-0018 … select 200 sat/vB … while the IFACE-007 tier-selection action specifies a fail-closed no-eligible-tier result".
- What is wrong: "settled" is the guide's word. It suggests that one side carries settled authority. Both sides and the "None is decided here" status are present. See part 5 for the related change in the technical record.

**ARCH-6. Minor. A long-stop gap in the S branch.**
- Guide, line 91: "For a loan created with the activated ECVS capability, S can then complete the borrower's recovery, but until that recovery confirms, the lender's timelocked route or a cooperative settlement can still win."
- Owners: `flow-010-...md`, "## Failure And Reroute"; `sec-025-...md` line 40.
- What is wrong: the long-stop is omitted here, although the same paragraph criticizes records for omitting it. The non-S branch includes it.

**ARCH-7. Minor. Cooperative settlement is presented as a route without its deferral.**
- Guide, line 91: "a cooperative settlement can still win".
- Owner: `scope-005-...md`, "## Boundary". `lifecycle.yaml` OUTCOME-005 says "Base accounting remains deferred".
- What is wrong: SCOPE-005 is missing from the line 96 exclusion list. The Bitcoin-level possibility is correct.

**ARCH-8. Minor. Availability and profile detail thinned.**
- Line 81 omits the operator surface from what an outage suspends. It also omits "active-active", "guaranteed cold redeployment" and RPO, keeping only "no stated recovery time" (A-9, A-10).
- Line 83 reduces the fail-closed predicates to "points at a public network or public credentials". A non-loopback bind, a non-regtest network and missing or conflicting predicates are dropped (A-12).
- Line 65 omits "source of funds" and "lifecycle action" from what the binding is not (A-3).

**ARCH-9. Minor. Figure labels.**
- Line 58, "Public X moves collateral into escrow", and line 60 collapse "a public secret makes a signed transaction usable" into "moves". Line 22 states the boundary correctly.
- The "Activate" step does not say that six confirmations of the actual winner come first.

**ARCH-10. Minor. Vocabulary.**
- "Activated ECVS capability" (lines 14, 75, 91) and Bitcoin "activation" (lines 44–48, 90) are never explicitly told apart. The context mostly disambiguates them.

### 1.2 Must-preserve facts (A-1 to A-16)

| Fact | Status | Note |
| --- | --- | --- |
| A-1 | Preserved | Line 36 |
| A-2 | Preserved | Lines 7, 73, 96 |
| A-3 | Weakened | ARCH-8 |
| A-4 | Preserved | Line 70 |
| A-5 | Preserved | Line 71 |
| A-6 | Preserved | Line 72 |
| A-7 | Preserved | Line 77 |
| A-8 / O-16 | Preserved | Lines 14, 20, 91, 96 carry both conditions ("created with the activated ECVS capability") |
| A-9 | Preserved | Operator surface omitted (minor) |
| A-10 | Weakened | ARCH-8 |
| A-11 | Preserved | Line 83 |
| A-12 | Weakened | ARCH-8 |
| A-13 (v2: four conflicts) | Weakened | 2h-1, 2h-2 and 2h-3 are correct; 2h-5 is misframed (ARCH-1) |
| A-14 | **Missing** | No security-description rule, no combination-attack ownership. Q-A7 cannot be answered |
| A-15 | Preserved | Lines 36, 71, figure caption |
| A-16 | **Missing** | ARCH-3 |

About 10 of 16 are fully preserved, below 90%.

### 1.3 Distinctions and unresolved points the guide reaches

- 2a: line 72 is correct. The Vault handoff is not described, so P-6 does not apply.
- 2b: lines 36, 71, 74 and 76 are correct.
- 2c: line 91 says "That refund does not release Bitcoin". The three kinds of refund are qualified in context.
- 2d: summary and gate present (lines 14, 20, 75, 91).
- 2e: present.
- 2f: present. Line 46 gives the 67 h = 24 + 24 + 19 breakdown, which matches `build/records/constraints/cons-011-origination-timing-envelope.md`.
- 2g: claim ladder present. The demo status matches `build/workflow/handoffs/README.md` ("BU-011 remains in progress … VE-002–VE-009 have not passed").
- 2h-1: correct (line 106) and consistent with the snapshot `architecture.md` "Unresolved source conflict".
- 2h-2: correct (line 107).
- 2h-3: present with a tilt (ARCH-5).
- 2h-5: Critical (ARCH-1).
- 2h-6: accepted. Line 65 and line 110 report the tension.
- 2h-8: accepted. The pause is reported as worded differently.
- 2h-4 long-stop: included. The guide also reports SEC-024's "has no borrower fallback Bitcoin route" (`sec-024`, THREAT-001 scenario), which is real and which the key does not list.
- The fee-bump-after-mempool point (line 111) is a genuine silence between `iface-007` "## Payload Or Artifact" ("Once an activation or terminal candidate is accepted, it is the sole parent and only CPFP may add fee") and `inv-018` "## Rule" ("escalating through signed tiers or separately approved CPFP"). Reporting it as unrecorded is acceptable.
- B-12 and P-6 are not narrated in this guide, so they are not applicable. The guide does not claim that only the Vault caller can reveal (2h-7 is not triggered).

### 1.4 Reader questions

| Question | Result |
| --- | --- |
| Q-A1 | Pass |
| Q-A2 | Pass |
| Q-A3 | Pass (RPO and active-active missing) |
| Q-A4 | Pass |
| Q-A5 | Pass |
| Q-A6 | Pass |
| Q-A7 | Fail |
| Q-A8 | Pass |
| Q-A9 | Fail, with the dangerous answer "it cannot be broadcast without the lender" traceable to line 92 |

### 1.5 Verdict: **Fail**

There is one Critical defect (ARCH-1) and two Majors (ARCH-2, ARCH-3), fact coverage is below 90%, and the v2 Architecture condition (all four conflicts correct) is not met for 2h-5. The v2 5.1 acceptance blockers are met by ARCH-1 (owner contradiction) and ARCH-2 (residual risk omitted).

---

## 2. Loan Terms And Commitments guide (`guide/domains/loan-terms-and-commitments.md`)

### 2.1 Defects

**LT-1. Major (limit and condition omitted). Reservation lifetime, expiry and cancellation rules (L-4, v2 "Reconciled by scope").**
- Guide, line 12: "A **reservation** … happens atomically, creates a stable random loan identifier and a durable commercial draft, and cannot be won twice." Line 58: "Cancellation ends that reservation for good."
- Missing:
  - the 24-hour reservation;
  - expiry before commitment, which leads to Expired;
  - no valid prefund after commitment, which leads to cancel and reopen with one infraction, a same-offer block and notices to both parties;
  - a valid stuck prefund at 72 hours, which goes to manual review.
- Owners: `state-001-...md`, "## States" ("Exactly one borrower holds the 24-hour reservation") and "## Transitions" (Reserved → Reopened, Reserved → Expired, Prefund retained → Manual review); `iface-003-...md`, "## Failure Meaning".
- What is wrong: the guide states neither case. Q-L2 loses "24-hour". v2 rates stating only one case as Major, and omitting both is at least as severe.

**LT-2. Major (boundary stated in one direction; v1 4.6 "Loan Terms guide must say approval is not signing or funding").**
- Guide, line 65: "even after an agreement is committed, the lender separately decides whether and when to fund." Nothing says that final-terms approval grants no signing, Vault, custody or chain authority.
- Owners:
  - `sr-010-...md`, "## Owns": "The approval grants no Vault custody, signing, funding, or chain authority."
  - `iface-001-...md`, "## Payload Or Artifact": "Approval grants no Vault, signing, secret, transaction, funding, or custody authority."
  - `state-002-...md`, "## Invalid Transitions"; `flow-001` step 4: "approval grants no signing/custody".
- What is wrong: L-7 is weakened. The funding half is present and the signing half is missing.

**LT-3. Minor. Offer consumption not stated (L-8).**
- Missing: committing the terms does not consume the reservation, and the offer becomes consumed only when Base acceptance is finalized.
- Owner: `state-001-...md`, "## States" (Consumed) and "## Invalid Transitions" ("Consuming the reservation merely because canonical terms were committed").

**LT-4. Minor. Conditional H(S) absent (L-12, amended by v2 2h-6).**
- The guide never mentions the fallback commitment. Line 7 lists "secret commitments" generically, and line 38 lists only X and Y. It does not claim that every loan carries H(S), so this is Missing rather than a defect of meaning.
- Owner: `sr-001-...md`, "## Owns": "Conditional `H(S)` is present only for loans created with the approved capability."

**LT-5. Minor. Supersession after activation implicit (L-11).**
- Line 55: "Before activation, an amendment produces a later version and fresh dependent artifacts."
- Owner: `state-002-...md`, "## Invalid Transitions": "superseding after activation".
- What is wrong: the prohibition is implied only by "before activation". "Two fresh approvals" is implied by line 55's invalidation.

**LT-6. Minor. Naming.**
- Line 20, "the encoding and fingerprint of the terms": the terms have a `terms_hash`, and "fingerprint" is the manifest's term (`sr-001` "## Owns"). The meaning is kept.
- Line 58 omits "next reservation number" (Q-L7 still passes).

Checked and found faithful:
- Line 59's split ("Base-facing consumers also reject the wrong chain, contract or asset, and Bitcoin-facing consumers the wrong Bitcoin network") is supported by `iface-002-...md`, "## Preconditions And Validation": "Base-facing consumers additionally verify … Bitcoin-facing consumers verify the configured Bitcoin network". It is not a narrowing.
- The "Choices" rationale (line 69) matches the snapshot `domain.md` "## Choices And Rationale" and TICKET-0001 and TICKET-0004 (SR-001 tickets).
- The open question (lines 73–79) matches the snapshot domain record's "Unresolved source conflict" bullet, `scope-011` line 14, `inv-011` "## Rule", `sel-012` line 15, `iface-003` "## Must Not Imply" and `state-001` "## Invalid Transitions". Both sides and the "undecided" status are present, and the normal case is labeled as following the detailed records without settling the question.

### 2.2 Must-preserve facts (L-1 to L-15)

| Fact | Status |
| --- | --- |
| L-1 | Preserved (line 7) |
| L-2 | Preserved (lines 14–16) |
| L-3 | Preserved (lines 11, 36) |
| L-4 | **Missing** (LT-1) |
| L-5 | Preserved (lines 37–40; "atomically" not said, "exactly once" kept) |
| L-6 | Preserved (lines 55–57) |
| L-7 | Weakened (LT-2) |
| L-8 | **Missing** (LT-3) |
| L-9 | Preserved (line 63, including recoverability and the disclosure prerequisite from `flow-001` "## Failure And Reroute") |
| L-10 | Preserved (line 59) |
| L-11 | Weakened, minor (LT-5) |
| L-12 | **Missing** (LT-4) |
| L-13 | Preserved |
| L-14 (first sentence) | Preserved (line 83) |
| L-15 | Preserved (lines 63, 65) |

That is 10 of 15 (67%).

### 2.3 Distinctions and unresolved points

- 2a: approval is not signing is missing (LT-2).
- 2f: funding control is present (line 65).
- 2h-1: both sides present, plus "not recorded" for the commercial-sense reading. Correct.
- The 2h-1 naming issue: the guide consistently uses "approval" for final terms, uses "acceptance" only in "acceptance snapshot", and includes both roles' preparations (line 38). This avoids the key's noted inconsistencies.
- 2h-6: not reached.

### 2.4 Reader questions

| Question | Result |
| --- | --- |
| Q-L1 | Pass |
| Q-L2 | Partial: no 24-hour limit; no-final-terms is present |
| Q-L3 | Pass |
| Q-L4 | Pass |
| Q-L5 | Pass |
| Q-L6 | Pass |
| Q-L7 | Pass |
| Q-L8 | Pass |

7 of 8, with no dangerous answer.

### 2.5 Verdict: **Fail**

There are no Critical defects. There are two Majors (LT-1, LT-2), where v1 4.7 allows one with a note, and fact coverage of 67% is below 90%. LT-1 is a v2 5.1 acceptance blocker.

---

## 3. Participant Access And Loan Operations guide (`guide/domains/participant-access-and-loan-operations.md`)

### 3.1 Defects

**PA-1. Major (v2 part 4, P-6 strengthened; distinction 2a in one direction). Handoff authority.**
- Guide, line 14: "A **handoff** gives one participant access to one bounded action in their Vault, through a short-lived, single-use code. It is not a general signing token."
- Also line 30, "the product opens a bounded Vault handoff, and the Vault signs locally", and the figure on line 38, "The Vault performs the bounded action locally."
- Owners:
  - `iface-004-...md`, "### One-Time Cross-Origin Handoff" (lines 51–53): the code is "an expiring pointer, not authentication, transaction consent, or cryptographic authority". The Vault requires the same participant's fresh session, redeems once, independently reloads and validates the canonical action, and "never signs bytes supplied only by the normal-product page".
  - `sr-011-...md`, "## Owns" (fresh-gated handoff bullet).
- What is wrong: v2 names this exact wording ("not a general signing token") as Major. None of the four Vault-side conditions appear, and a reader of Q-P4 will give the dangerous answer ("the link authorizes the signature").

**PA-2. Major (limit omitted on when a participant may act). Session and reauthentication policy (P-3).**
- Guide, line 21: "owns accounts, borrower and lender roles, sessions, account recovery, fresh reauthentication and multi-factor authentication (MFA)". No values are given.
- Owner: `sr-010-...md`, "## Owns": "Seven-day maximum and 24-hour-inactivity sessions; WorkOS reauthentication no older than 15 minutes before sensitive ciphertext, seed-display request, current PSBT, vault handoff, or vault-password replacement; optional participant-enrolled TOTP that becomes required … once enrolled; and, for password replacement only, a separate single-use verified-email confirmation … cannot substitute for the current vault password."
- What is wrong: Q-P2 cannot be answered. The email confirmation, which "cannot substitute for the current vault password", is also absent.

**PA-3. Major (condition omitted on who may act). Same-loan dual role and per-interaction checks (P-4).**
- The guide never says that one account may hold different roles on different loans but never both on the same loan, or that each interaction makes its own non-enumerating identity and role check.
- Owner: `sr-010-...md`, "## Owns" (first bullet), and "## Inputs And Outputs" (paragraph after the table).
- Q-P3 fails.

**PA-4. Major (status collapse risk, v2 2g extended; P-14).**
- Guide, line 64: "The Vault payment capability's delivery is recorded as partial, and its check in the local demonstration is planned and unverified."
- Owners:
  - `build/records/selections/sel-043-...md`: "Delivery status is `PARTIAL`: the bounded own-wallet design and narrow participant-transfer scope are selected, but implementation and execution evidence remain gated to Stage C."
  - `va-003-...md`: "No current implementation or pass is claimed by this record."
  - `iface-022-...md` line 38: "No payment-transfer adapter or payment-profile known-answer vector currently exists."
  - Pre-migration domain record: "an implementation target with no execution evidence established by this migration".
- What is wrong: the guide quotes the label "partial" without its meaning. A reader takes "delivery is partial" as "partly implemented", while the owner status is "selected; not implemented; no execution evidence". Meanwhile lines 46–47 and 54 describe the payment mechanics in the present tense with no status qualifier.

**PA-5. Major (missing boundary; P-11, Q-P8). Workforce operators.**
- Guide, line 21: "Access for the organization's own operators is separate." Line 46: "The participant or an authorized operator may then trigger an explicit reprobe or an identical retry".
- Owner: `sr-011-...md`, "## Owns" (workforce-boundary bullet): Cloudflare Access, company Google identities, mandatory TOTP, a 15-minute session, an active D1 operator permission (viewer, operator or security_admin) and fixed actions only. The one-person-approval bullet adds "One-person V1 operator approval with no general two-person or break-glass bypass" and uneditable audit.
- What is wrong: the guide grants operators a power (line 46) without any of the limits: no amounts or recipients, no fact override, one-person approval, audit, and participant login grants no workforce authority. Line 52 lists what "the domain" never does, but not what operators cannot do. This is rated Major rather than Missing only because the guide introduces operator action. If the coordinator scores it as a Missing fact only, the verdict is unchanged.

**PA-6. Minor. Local demo isolation (P-13, Q-P7).**
- Line 25 omits "loopback-only". Nothing says the demo fails closed on a non-loopback bind, a non-regtest network, a non-local chain or public credentials, or that demo credentials and fixtures are rejected in public profiles.
- Owners: `sr-012-...md`, "## Failure And Recovery" and "## Verification Intent"; `architecture.md`, "## Target Outcome And Runtime Profiles".
- Line 59 only says that a "safe separation" was a reason for the design.

**PA-7. Minor. Account recovery scope (P-5).**
- Line 21 says sign-in cannot decrypt a Vault, and line 66 says there is no forgotten-password recovery. Missing: "Product account recovery restores access and ciphertext retrieval only".
- Owner: `sr-010-...md`, "## Owns" (third bullet).

**PA-8. Minor. Idempotency detail (P-7).**
- "Changed-body reuse is rejected" is missing.
- Owner: `sr-011-...md`, "## Owns" ("scoped idempotency keys enforce same-body recovery and changed-body rejection").

**PA-9. Minor.**
- Line 21 omits Google OAuth and verified email code (P-2).
- Line 66, "a bounded prefunded gas stipend", omits "one-time" and "never signs, submits or relays" (`inv-021-...md`, "## Rule"). The rest of line 66 is correct, including "paying their own gas always remains possible" (`iface-015-...md` line 21: "Self-funding/direct submission always remains available"). It does not claim that only the Vault caller can reveal (2h-7 is not triggered).
- Line 46, "only missing or contradictory evidence blocks it": the owner blocks both the intent and the account (`state-021`, "## Bounded Reconciliation Policy").

Checked and found faithful:
- Line 46, the P-9 reconciliation wording, matches v2 part 3 and `state-021`/`iface-022`.
- Line 47's payment-account recovery matches `iface-022` lines 63–65 and `inv-027` "## Rule".
- Line 48, the Cloudflare failure domain (P-12), is correct.
- Line 52's authority boundaries are correct.
- Line 54, the participant transfer (P-10), is correct.
- Lines 29–32, the normal case, include the 2h-1 open question and "finalized public X". That is more accurate than the pre-migration "observed Base X" and is supported by `iface-020`.
- Line 64, the demo status, matches `handoffs/README.md` and `va-003` ("Planned — unverified").
- Line 66, the deferrals (SCOPE-005, 006, 014, 015), is correct.

### 3.2 Must-preserve facts (P-1 to P-15)

| Fact | Status |
| --- | --- |
| P-1 | Preserved |
| P-2 | Weakened, minor |
| P-3 | **Missing** (PA-2) |
| P-4 | **Missing** (PA-3) |
| P-5 | Weakened (PA-7) |
| P-6 | Weakened, Major (PA-1) |
| P-7 | Weakened (PA-8) |
| P-8 | Preserved |
| P-9 (v2) | Preserved |
| P-10 | Preserved |
| P-11 | **Missing** (PA-5) |
| P-12 | Preserved |
| P-13 | Weakened (PA-6) |
| P-14 | Weakened, Major (PA-4) |
| P-15 | Preserved, with minor gaps |

5 or 6 of 15 preserved (about 40%).

### 3.3 Distinctions and unresolved points

- 2a: login is not decryption (line 21), but the handoff is described in one direction (PA-1), and the operator boundary is missing (PA-5).
- 2b: present (lines 17, 41, 52).
- 2e: accepted vs submitted vs observed vs finalized vs confirmed (line 17). Present.
- 2g: claim ladder present. The payment status is misleading (PA-4).
- 2h-1: correctly flagged (line 29).
- 2h-7: not triggered.
- B-12: not narrated. Line 31 says only "deliberately accepts", so it is not applicable.

### 3.4 Reader questions

| Question | Result |
| --- | --- |
| Q-P1 | Pass |
| Q-P2 | Fail |
| Q-P3 | Fail |
| Q-P4 | Fail, with a dangerous answer traceable to line 14 |
| Q-P5 | Pass |
| Q-P6 | Pass |
| Q-P7 | Partial: status correct; isolation and rejection elsewhere missing |
| Q-P8 | Fail |

4 of 8.

### 3.5 Verdict: **Fail**

There are five Majors, fact coverage is about 40%, and the reader-question score is below 6. PA-1, PA-2 and PA-3 are v2 5.1 acceptance blockers.

---

## 4. Where the answer key is wrong, incomplete or outdated

1. **2h-3 owner characterization is out of date for this package.** The key quotes the pre-migration narrative ("the action contract and former decision say fail closed"). The snapshot `bitcoin-authorization-and-recovery/domain.md` "## Choices And Rationale" now pairs "the IFACE-007 payload rule and TICKET-0018" (200 sat/vB) against "the IFACE-007 tier-selection action" (fail closed). The "former decision" support for the fail-closed side has been removed (see part 5). The key's own silence note suggests the removed claim was unfounded, but the change alters how the two sides are supported.
2. **2h-4 is incomplete.** `sec-024-...md`, THREAT-001 scenario, says "A loan without the production-activated `H(S)` capability has no borrower fallback Bitcoin route". This conflicts with the long-stop in `iface-005` and `flow-010`. The key lists only FLOW-005's omission. The architecture guide reports this correctly.
3. **A further genuine silence is missing from the key.** IFACE-007 "## Payload Or Artifact" ("once … accepted … only CPFP may add fee") and INV-018 "## Rule" ("escalating through signed tiers or separately approved CPFP") are not reconciled by any owner. The architecture guide reports it, which is acceptable.
4. **L-10 is broader than IFACE-002.** `iface-002` "## Preconditions And Validation" assigns live-identity checks by consumer type (Base-facing versus Bitcoin-facing), while every consumer validates schema and fingerprint. A guide that keeps the split, as the loan-terms guide does, should not be scored as narrowing L-10.
5. **The 2f timing breakdown has a better owner.** The 67 h = 24 h + 24 h + 19 h envelope is owned by `build/records/constraints/cons-011-origination-timing-envelope.md`. The key cites only `flow-001` step 9. A guide that states the breakdown is supported.
6. **P-14 needs the label explained.** SEL-043 records the payment capability as `PARTIAL`, meaning selected but implementation and execution gated. The key should say that a guide must explain the label, so that "partial" is not read as partially implemented.
7. **v2 accepted-treatment note for 2h-5 should be added.** v2 does not say how to score a guide that labels 2h-5 "open" but restates one side's premise as fact. This review scores that as Critical (ARCH-1). The coordinator may want to fix the rule for v3.

## 5. Technical-record observations (outside this guide review, for the technical-diff review)

- `system-model/architecture.md`: the migration removed "## System Overview", including "Existing approval-wording and fee/count discrepancies identified by the migration remain unresolved source issues". The approval conflict is re-added under "## Purpose And Binding". The fee and count conflicts are no longer noted in the architecture record and survive only in the Bitcoin domain record's "## Choices And Rationale". This is consistent with v2 part 1, but the architecture record no longer names them.
- `bitcoin-authorization-and-recovery/domain.md`: the fee no-tier conflict was restated without the pre-migration claim that a "former decision" says fail closed, and TICKET-0018, called the "earlier ticket" before, is now named as support for the 200 side. This is a rewrite of how one side of an open question is supported (v2 5.1, second bullet), unless the coordinator accepts it as a correction of an unidentifiable citation.
- `loan-terms-and-commitments/domain.md` and `participant-access-and-loan-operations/domain.md`: the migration replaced the narratives with "## Choices And Rationale" bullets attributed to tickets. These guide facts held uniquely by the removed narratives were not found in any snapshot technical owner:
  - L-14's second sentence ("a narrative or diagram cannot supply a missing approval"). Its absence from all owners is for the technical-diff review to judge under v2 part 1.
  - P-14's "implementation target with no execution evidence". SEL-043 and VA-003 carry an equivalent.
