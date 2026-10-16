# Review A: Architecture, Loan Terms And Commitments, and Participant Access And Loan Operations guides

Package reviewed: `snap-t1/bitrise21/loan-system/design/technical-design` (guide/ against system-model/, build/, ui-ux/, tickets).
Pre-migration copy compared: `pre/bitrise21/loan-system/design/technical-design`.
Criteria: `expectations/expectations.md` part 4, with parts 1–3 as the checklist. I checked every key fact against the records myself; where the key and the records differ, I followed the records and say so in section 0.

Paths below are relative to the package root. Guide line numbers refer to the snapshot files.

## Verdicts at a glance

| Guide | Critical | Major | Facts preserved | Comprehension | Verdict under 4.7 |
| --- | --- | --- | --- | --- | --- |
| `guide/architecture.md` | 0 | 2 | 14/15 (93%) | 7 correct, 1 partial (of 8) | **FAIL**: two Major defects. All three conflicts and the claim ladder are carried. |
| `guide/domains/loan-terms-and-commitments.md` | 0 | 1 | 13/15 (87%) | 6 correct, 2 partial (of 8) | **FAIL**: below the 90% preserved threshold, and the one Major needs a correction note. |
| `guide/domains/participant-access-and-loan-operations.md` | 0 | 0 | 12/15 (80%) | 6 correct, 2 partial (of 8) | **FAIL**: below the 90% preserved threshold only. |

None of the three guides contains an authority collapse, a status collapse, an availability overclaim, a silently resolved conflict, or a wrong number. The failures come from omitted conditions and boundaries. Each one is a fix of one to three sentences, listed in section 5.

---

## 0. Where the key and the records differ

These points come from my own check of the records. They change how some guide content should be graded.

1. **L-12 (H(S) "in the terms").** `SR-001` "## Owns" says conditional `H(S)` is in the binding. `IFACE-001` "### Exact `LoanTermsV1` ABI Order" says "Only these fields belong in `LoanTermsV1`" and lists 19 fields with no `H(S)`. It also says "Offer/reservation identity belongs to IFACE-003, not `LoanTermsV1`." The guides report this as an unreconciled discrepancy. That is correct, and the key missed the conflict. I grade the guides' treatment as Preserved.
2. **P-9 (payment escalation).** The key says outcomes are "escalated at 180 seconds to a visible block." `IFACE-022` ("`PaymentReconciliationPolicyV1`" paragraphs) and `STATE-021` say 180 s is a "mandatory escalation decision". After it a participant or operator may reprobe or retry identical bytes, and "Only missing exact pending/deterministic evidence or contradictory evidence produces `ReconciliationBlocked` and account `Blocked`." The participant guide matches the records more closely than the key does.
3. **Four real discrepancies the key does not list.** The architecture guide reports all four (lines 186–189), and I verified each one:
   - **Reservation ending before commitment.** `STATE-001` "## Transitions" says Reserved goes to Expired "before terms commitment and without a prefund attempt". `SEL-012` "### Offers, reservations, and prefund" says the application cancels with an infraction "If no valid prefund is visible at the deadline". `IFACE-003` "## Failure Meaning" has no carve-out.
   - **Participant references.** `IFACE-001` uses "random per-loan" references that "map privately to the actual product accounts". `SEL-012` "## Options And Consequences" rejects "A new opaque random participant reference" and uses "the immutable borrower and lender account IDs".
   - **Who may reveal X and Y.** `IFACE-009` (table rows for `acceptX` and `releaseWithY`) says "Any caller with an exact 32-byte preimage" or "Any caller with matching `Y`". `IFACE-014` "## Must Not Imply" says a reveal "from an EOA other than the immutable term-bound Vault-derived caller is not a valid protocol transition even if a wallet transaction confirms."
   - **Pause and beta key.** `SEL-009` and `SR-003` "## Owns" say there is "no on-chain pause". `STATE-019` lists "pause/operational roles" and a "Paused for new/risky action" state without saying whether they are on-chain. `INV-020` and `STATE-019` omit the single-key beta period.
4. The key's source root is a `t0` path. All the relative paths it cites resolve in the snapshot, and I checked against the snapshot.

---

## 1. Architecture guide (`guide/architecture.md`)

### 1.1 Defects

**AR-1. Major: wrong condition for Bitcoin observation availability.**
- Guide (line 153): "**Disagreeing sources.** If both Base providers are unavailable or disagree, existing finalized information stays visible but new actions that depend on Base stop. Bitcoin gates stop whenever the two required sources disagree or are both unavailable."
- Owner: `system-model/contracts/interfaces/iface-006-bitcoin-observation-evidence.md`:
  - "## Preconditions And Validation": "Lifecycle-changing gates require fresh agreement on the same transaction/outpoint … Routine primary-only status may be displayed as provisional but cannot trigger automation."
  - "## Failure Meaning": "post-retry unavailability enters `bitcoin-observation-unavailable` … Automation resumes only on fresh agreement."
  - "## Must Not Imply": "One provider … is not a collateral-qualification or finality fact."
  - TICKET-0025 resolution (`build/workflow/tickets/bitcoin-authorization-and-recovery/sr-002/sr-002-external-services-tickets.yaml`): "require fresh agreement … block on conflict or unavailability".
  - For contrast, Base: `SEL-014` and `base-observation-and-fallback-review/domain.md` "## Choices And Rationale" say "one healthy source sufficient".
- What is wrong: an omitted condition that changes meaning. A Bitcoin gate needs agreement between both sources, so it also stops when only one source is unavailable. The sentence gives Base and Bitcoin the same wording, which hides the "one healthy provider for Base but agreement for Bitcoin" asymmetry that 4.3 names. It also contradicts the guide's own line 32 ("Bitcoin lifecycle gates need fresh agreement between two configured sources"). The likely origin is `SR-006` "## Failure And Recovery", which describes incident handling as "Bitcoin observation conflict or dual unavailability". The gate rule itself is in IFACE-006.
- Severity: **Major** (4.3, omitted condition).

**AR-2. Major: the main non-atomic cross-chain residual risk is missing.**
- Guide (line 138): "Once X is public, activation must complete with the same selected transaction: the system cannot refund the prefund, pay the principal again or build a replacement. … nothing undoes the principal payment or the escrow."
- Guide (line 161): "What the system cannot guarantee: an exact waiting time for any chain step, availability during a Cloudflare-wide outage, or return of the collateral after a valid repayment that the lender never claims, unless the fallback is in force, S is published and the recovery confirms first."
- Owner: `system-model/contracts/security/sec-023-base-pays-principal-but-bitcoin-activation-does-not-confirm.md`, "### SEC-023.THREAT-001 — Base pays principal but Bitcoin activation does not confirm":
  - "A malicious or compromised borrower, or anyone holding the signed refund package, then broadcasts refund; the refund confirms first."
  - "The lender is left with unsecured credit exposure. This is the principal residual cross-chain risk: Base payment and Bitcoin activation are not one atomic transaction."
  - "Why the design reduces but cannot eliminate it" explains the controls. See also `INV-018` "## Rule".
- What is wrong: a residual risk is omitted. "The system cannot refund the prefund" is true of the automation, but the borrower-signed refund can still be broadcast at maturity by the borrower or by anyone holding it. That race is why the guide's own 19-hour reserve (line 76) exists. The guide promises at line 3 that "Where a route depends on … a race between routes, this guide says so". Its "cannot guarantee" list names the missing-Y risk but leaves out this one.
- Severity: **Major** (4.3, "activation-pending lender exposure (non-atomic)").

**AR-3. Minor: the security change-control rule is weakened (A-14).**
- Guide (line 159): "The security records analyze what each compromised capability can do in each loan state, with particular attention to combinations, such as a malicious frontend together with one participant's unlocked Vault, that are more dangerous than any single leak."
- Owner: `system-model/architecture.md`, "## Security Change Control": "No threat may be summarized by a severity word alone. Analysis must state the compromised capability, exact lifecycle state, whether prerequisites are genuinely independent …". Also "### Combination-Attack Ownership": "Each approved combination has one primary `SEC-xxx` owner."
- What is wrong: the guide drops the ban on severity words and the analysis dimensions. The combination point survives.
- Severity: Minor. It counts as a Weakened fact.

**AR-4. Minor: a figure label leans toward one side of the approval conflict.**
- Guide (line 54): "step: Offer and reservation | The lender publishes a firm offer; a borrower reserves it, creating the loan."
- Owners: `system-model/architecture.md` "## Purpose And Binding" ("reservation creates the canonical loan") versus `SR-001` "## Owns" ("Neither publication nor reservation approves or commits final bound terms") and `IFACE-001` ("it does not create a canonical agreement").
- What is wrong: "creating the loan" repeats the architecture side's wording in a label. The body text (line 60) correctly says "creates a random loan identifier" and flags the conflict. Under 4.1 step 5, labels get the same strictness as body text.
- Severity: Minor. Suggested wording: "creating the loan identifier".

**AR-5. Minor: the claim-ladder wording reads like current status.**
- Guide (lines 120–124): the "What this design claims" column for Local demo reads "A developer can run and resume the complete isolated system". The table also merges testnet, mainnet and production into one row.
- Owners:
  - `system-model/architecture.md` "## Target Outcome And Runtime Profiles": "Target-version claim | Runnable use", with separate rows for Testnet, Mainnet and Production.
  - `SCOPE-013` "## Must Not Be Inferred": "Testnet deployment … does not establish mainnet …".
  - Status records: VA-001 to VA-004 are "`Planned — unverified`", and `build/workflow/handoffs/README.md` says the local-demo slice is "Blocked" with "`LOCAL_DEMO_RUNTIME_NOT_IMPLEMENTED`".
- What is wrong: the present-tense "can run" can be read as a working demo. Merging the rows loses "testnet does not establish mainnet, and mainnet does not establish activated operation".
- Severity: Minor. It is not Critical because line 118 frames this as "The target outcome of this design".

**AR-6. Minor: the noncustodial framing is overstated.**
- Guide (line 7): "each side keeps control of its own assets and keys throughout."
- Owners: `INV-008` "## Rule" (the lender route becomes valid at T whatever happened on Base), `SCOPE-002`, and `SCOPE-009` "## Boundary" ("whether the product is legally noncustodial … is outside this technical blueprint").
- What is wrong: keys stay with participants, but escrowed collateral is governed by pre-signed routes, one of which pays the lender. "Keeps control of its own assets throughout" is the kind of unqualified wording 4.6 warns against.
- Severity: Minor.

**AR-7. Minor: activation escalation is over-tightened.**
- Guide (line 138): "activation must complete with the same selected transaction".
- Owner: `INV-018` "## Rule": "resumes/rebroadcasts that exact route idempotently, escalating through signed tiers or separately approved CPFP".
- What is wrong: the selected route can move to another already-signed fee tier.
- Severity: Minor.

**AR-8. Minor: cooperative spend is missing from the open routes after a refund.**
- Guide (line 148): "the other routes stay open: the lender's timelock route … and the borrower's long-stop route …".
- Owners: `SR-007`, `flow-005` "## Failure And Reroute" (cooperation), and Q-A5's expected answer.
- What is wrong: cooperative settlement is not listed here. It is mentioned at line 198.
- Severity: Minor.

**AR-9. Minor: the prefund refund is described without its conditions.**
- Guide (line 132): "The borrower's prefund becomes refundable … and one of the pre-signed refund candidates is sent."
- Owners: `INV-017` and `flow-003` steps 2–4. Automatic relay happens only with fresh evidence of an unspent prefund and no accepted X.
- What is wrong: the conditions are missing at this point. Line 138 restores the no-X part.
- Severity: Minor.

**AR-10. Minor: one discrepancy is described slightly too strongly.**
- Guide (line 187): "the offer selection and the reservation contract cancel it and record an infraction whenever no valid prefund is visible at the deadline."
- Owner: `IFACE-003` "## Failure Meaning": "Missing valid prefund cancels and reopens under the approved infraction/notification rule."
- What is wrong: IFACE-003 does not say "whenever". It simply has no pre-commitment carve-out.
- Severity: Minor.

**AR-11. Minor: the Side A source list for the approval conflict is incomplete.**
- Guide (line 178): it lists "The architecture record, the offer and reservation contract, the offer selection and the user-approved offer ticket".
- Owner: `loan-terms-and-commitments/domain.md` "## Choices And Rationale" also lists `SCOPE-011` and the architecture's cross-domain boundaries.
- Severity: Minor.

**AR-12. Minor: the S trigger is stated loosely at first mention.**
- Guide (line 22): S may be published "if the lender never claims a valid repayment".
- Owner: `INV-007` "## Rule": "Only the canonical Base-L1-finalized `UnclaimedRepaymentRefunded` event may trigger publication". Line 148 of the guide is precise.
- Severity: Minor.

Claims I verified as correct, including several the key does not cover:
- 67 h = 24 + 24 + 19 (`CONS-011`).
- The ≥19 h acceptance reserve (`INV-002`).
- 259,584 s (`CONS-011`).
- "strictly later than T" (`FLOW-007` "## Preconditions").
- B = D + 10 days (`INV-008`, `CONS-027`).
- The fee tiers and "lowest … strictly above 1.25×" (`IFACE-007` ACT-002).
- "roughly 20 minutes" (`SEL-013`).
- Opener trust (`IFACE-009` "The opener is trusted only for the external Bitcoin qualification").
- Upgrade path, beta key and "no on-chain pause" (`SEL-009`).
- The manifest environments (`IFACE-002`).
- The deferred, excluded and bounded lists. All 15 scope records are present and the classification matches each record's `status`.

### 1.2 Key facts A-1 to A-15

| Fact | Status | Where / note |
| --- | --- | --- |
| A-1 | Preserved | line 46 |
| A-2 | Preserved | lines 7, 204–205 (see AR-6) |
| A-3 | Preserved | lines 88–90; table row line 98 ("Moving money or proving a chain outcome") |
| A-4 | Preserved | table lines 99–100 |
| A-5 | Preserved | lines 32, 66, 82 |
| A-6 | Preserved | table line 101, callout line 110 ("permits only ciphertext access" is implicit) |
| A-7 | Preserved | lines 11, 107, 155 |
| A-8 | Preserved | lines 13, 80, 146–148, 172 |
| A-9 | Preserved | lines 114–116 |
| A-10 | Preserved (minor gap) | line 116; "active-active" and "cold redeployment" are not named, but nothing implies them |
| A-11 | Preserved | line 118 and table (see AR-5) |
| A-12 | Preserved (minor gap) | line 126; the confinement of demo artifacts is only implied by "isolated profile" |
| A-13 | Preserved | lines 174–180: "This guide does not resolve them." |
| A-14 | **Weakened** | AR-3 |
| A-15 | Preserved | lines 82, 110; the full state list is in the participant guide |

### 1.3 Distinctions (section 2)

- **2a** (login versus signing): present at line 110 and table line 101.
- **2b** (status versus transfer versus contract fact): present at lines 32, 82, 100, 103 and 110.
- **2c** (Base refund versus Bitcoin recovery): present at lines 110 and 146 ("by itself it does not return the Bitcoin"). Each refund is qualified by context. There is no explicit note that three kinds of refund exist; acceptable.
- **2d** (fallback): the summary and the gate are present at lines 13, 22, 148 and 172. Not stated: that only loans created after the gate can commit H(S), and that an existing escrow cannot be retrofitted. Acceptable for this guide under 4.5, but tightening is recommended.
- **2e** (publication versus broadcast versus confirmation): present at lines 32, 80 ("closed when that spend confirms, not when it is sent"), 142 (export versus broadcast) and 154.
- **2f** (who controls funding): present at lines 66 and 102. The lender does not control opening, which the opener does.
- **2g** (claim ladder): carried, with the reservations in AR-5. The guide gives no recorded current status, which this guide does not strictly require.
- **2h-1, 2h-2, 2h-3**: all three conflicts appear with both sides and an explicit "does not resolve them". The fee conflict keeps the owner's unidentified "former decision" and does not invent one. The "12" is labelled stale and is not adopted.

### 1.4 Comprehension (guide-only reader)

| Question | Result | Notes |
| --- | --- | --- |
| Q-A1 | Correct | Table lines 99–100, line 32 |
| Q-A2 | Correct | Lines 11, 107, 155 |
| Q-A3 | Correct | Line 116 |
| Q-A4 | Correct | Line 118 and table; AR-5 is a risk |
| Q-A5 | Correct | Lines 146–148; cooperative spend is missing (AR-8) |
| Q-A6 | Correct | Lines 174–180 |
| Q-A7 | Partial | Severity-word rule missing (AR-3) |
| Q-A8 | Correct | Lines 88–90, 98 |

No "dangerous" answer traces to the guide. However, a reader who relies on line 153 would wrongly conclude that one Bitcoin source is enough for a gate (AR-1).

### 1.5 Verdict

**FAIL** under 4.7 because of two Major defects (AR-1 and AR-2). Every other criterion is met: zero Critical defects, 93% of facts preserved, 7 of 8 comprehension answers correct, and all three conflicts plus the claim ladder carried.

---

## 2. Loan Terms And Commitments guide (`guide/domains/loan-terms-and-commitments.md`)

### 2.1 Defects

**LT-1. Major: the guide never says that approval is not signing, custody or funding authority.**
- Guide text closest to the boundary:
  - Line 7: "It does not move money, sign anything or decide what happened on a chain."
  - Line 49: "The borrower and the lender each explicitly approve that same candidate version and hash, and the second matching approval commits the terms atomically and exactly once."
  - Line 68: "even after the terms are committed, the selected lender separately controls the funding action".
- Owners:
  - `SR-010` "## Owns" (`approve_final_loan_terms` bullet): "The approval grants no Vault custody, signing, funding, or chain authority."
  - `IFACE-001` "## Payload Or Artifact": "Approval grants no Vault, signing, secret, transaction, funding, or custody authority."
  - `FLOW-001` "## Ordered Transitions" step 4: "approval grants no signing/custody".
  - `STATE-002` "## Invalid Transitions": "Treating commercial acceptance as a Bitcoin signature, wallet authority, Base transaction authorization …".
  - `IFACE-003` "## Must Not Imply": "Reservation does not fund USDC, move BTC, create protocol signing authority …".
- What is wrong: the guide says what the domain does not do and keeps the lender's funding decision, but never says that a participant's final-terms approval, or a reservation, carries no signing, Vault-custody, transaction or chain authority. Rule 4.6 says "The Loan Terms guide must say approval is not signing or funding", and 2a assigns this guide "approval is not signing". The distinction is stated in one direction only.
- Severity: **Major** (4.3). This is the same gap that makes L-7 Weakened.

**LT-2. Minor: the reservation-expiry discrepancy is described as silence when it is a conflict.**
- Guide (line 58): "The records do not say which applies before commitment."
- Owner: `STATE-001` "## Transitions" does say it: Reserved goes to Expired when "Unused reservation reaches the 24-hour expiry before terms commitment and without a prefund attempt … once terms are committed, the 24-hour no-prefund rule routes to Reopened instead." `SEL-012` applies cancellation and an infraction with no carve-out.
- What is wrong: the records disagree; they are not silent. No record says which governs. The architecture guide's line 134 has the right wording ("The records disagree").
- Severity: Minor.

**LT-3. Minor: the rejection list is incomplete.**
- Guide (line 56): "… and a stale, wrong-role, wrong-loan or mismatched approval."
- Owner: `SR-001` "## Failure And Recovery": "… stale/wrong-role/wrong-loan/mismatched candidate approval, expired or cancelled draft, and any dependent artifact that does not bind exactly." See also `STATE-002` "## Transitions": "Expired/cancelled drafts … cannot commit."
- What is wrong: expired and cancelled drafts or approvals, and the general rule that a dependent artifact which does not bind exactly is rejected, are both omitted.
- Severity: Minor.

**LT-4. Minor: the rule on narratives and diagrams is lost (L-14).**
- Guide: absent.
- Pre-migration owner: `pre/.../loan-terms-and-commitments/domain.md` "### Choices And Scope": "An unresolved implementation question belongs in its existing ticket; a narrative or diagram cannot supply a missing approval."
- What is wrong: the sentence was removed from the record and not carried into the guide (see 4.1). It counts as a Weakened fact.
- Severity: Minor.

**LT-5. Minor: what does not survive cancellation is not stated.**
- Guide (line 60): "Reopening the offer creates the next reservation number and a fresh loan identifier; the old identifier is never reused."
- Owners: pre-migration domain "### Boundaries And Exceptions" ("These rules prevent an apparently successful retry from reviving old approval or signing material"), `STATE-002` "## Observation And Finality" ("Cancellation/expiry … blocks every dependent action"), and `STATE-001` "## Invalid Transitions".
- What is wrong: the guide does not say that no earlier approval or signing material carries over. Q-L7 is only partly answerable.
- Severity: Minor.

**LT-6. Minor: the guide implies the reservation stays open unconditionally.**
- Guide (line 51): "The reservation itself stays open until the borrower's acceptance on Base is final; committing the terms does not consume it."
- Owner: `STATE-001` "## States" and "## Transitions". The reservation can also be reopened (no prefund), expire, or go to manual review.
- What is wrong: "stays open until" reads as unconditional. The exceptions section restores the conditions.
- Severity: Minor.

**LT-7. Minor: the fallback is mentioned without its production gate.**
- Guide (line 87): "… for a loan using the optional fallback, the hash of a third secret S."
- Owner: `IFACE-001` "## Must Not Imply": "…or a production-available fallback before the separate counsel-and-implementation activation gate is satisfied."
- What is wrong: the gate is not mentioned in this guide.
- Severity: Minor.

**LT-8. Minor: the Side A source list for the approval conflict is incomplete.**
- Guide (line 82): same as AR-11. It omits `SCOPE-011` and the architecture's cross-domain-boundaries bullet.
- Severity: Minor.

Claims I verified as correct:
- The 19-field terms list (`IFACE-001`).
- Manifest content and exclusions (`SR-001`, `IFACE-002`).
- The offer's commercial values (`IFACE-003` ACT-001).
- Allocation, then preparation, then candidate, then two approvals and atomic commit (`SR-001`, `STATE-002`, `FLOW-001`). The guide correctly gives both roles' H(X)/H(Y). The pre-migration narrative said only the borrower's H(X), and that error did not propagate.
- The six distinct identities and the payment-account conditions (`INV-023`, `IFACE-022`, `FLOW-001` "## Failure And Reroute").
- The 72-hour manual review and that it adds no infraction (`STATE-001`).
- "permanently blocked" (`SEL-012`).
- The choices and their attributions (domain "## Choices And Rationale", `SEL-010`, `SEL-012`).
- The approval conflict box, which matches the domain record's wording and "No record decides".
- The discrepancy box on terms content (see section 0, items 1 and 3).

### 2.2 Key facts L-1 to L-15

| Fact | Status | Where / note |
| --- | --- | --- |
| L-1 | Preserved | line 7 |
| L-2 | Preserved | lines 13, 15 |
| L-3 | Preserved | lines 11–12, 82; the "durable commercial draft" is not named |
| L-4 | Preserved | lines 12, 45, 56, 58–59 |
| L-5 | Preserved | lines 47–49 |
| L-6 | Preserved (minor gap) | line 55; LT-3 |
| L-7 | **Weakened** | LT-1; only the funding half is present (line 68) |
| L-8 | Preserved | line 51 |
| L-9 | Preserved | line 71 |
| L-10 | Preserved | lines 3, 56 |
| L-11 | Preserved | lines 57, 60 |
| L-12 | Preserved | line 87, as a correctly reported discrepancy (section 0, item 1) |
| L-13 | Preserved | lines 35, 82–84 |
| L-14 | **Weakened** | exclusions are present at line 89; the narrative/diagram rule is missing (LT-4) |
| L-15 | Preserved | lines 64–71 |

### 2.3 Distinctions

- **2a** (approval is not signing): **missing** (LT-1).
- **2b**: present. Line 7 says a matching identity establishes no chain outcome; line 71 says a workspace copy is not an authority.
- **2e** (offer publication): present at line 11 ("standing approval of those values").
- **2f**: present at line 68. That a reservation grants no funding authority is not stated (part of LT-1).
- **2h-1**: both sides, the record list, and "which wording governs remains undecided" are all present at lines 82–84. The normal case is explicitly labelled as the detailed records' version (lines 35, 84), which is acceptable.
- No readiness language.

### 2.4 Comprehension

| Question | Result | Notes |
| --- | --- | --- |
| Q-L1 | Correct | Lines 11, 68, 82–84 |
| Q-L2 | Partial | The 24-hour exclusive hold and random identifier are present. The commercial draft is not named, and "no funding, BTC movement or signing" is not stated (LT-1). |
| Q-L3 | Correct | Lines 47–49 |
| Q-L4 | Correct | Line 55 |
| Q-L5 | Correct | Lines 13–17 |
| Q-L6 | Correct | Line 71 |
| Q-L7 | Partial | Non-revival of approvals and signing material is not stated (LT-5) |
| Q-L8 | Correct | Line 7 |

No "dangerous" answers.

### 2.5 Verdict

**FAIL** under 4.7. Only 13 of 15 facts are preserved (87%, below 90%), and one Major defect (LT-1) needs a correction note. There are zero Critical defects. One sentence for LT-1 and one restored sentence for LT-4 would bring the guide to 15/15 with no Major defects.

---

## 3. Participant Access And Loan Operations guide (`guide/domains/participant-access-and-loan-operations.md`)

### 3.1 Defects

**PA-1. Minor: the per-interaction authorization rule is missing (P-4).**
- Guide (line 34): "Access errors are deliberately uninformative: an authenticated participant gets the same "not found" answer … while "forbidden" is reserved for a known action within its scope."
- Owner: `SR-010`, the paragraph after the table in "## Inputs And Outputs": "The presence of an authenticated session, an internal service method, or a route family is not an access decision for another interaction. Every consumer-visible interaction performs its own authoritative identity and role check."
- What is wrong: the per-interaction check is omitted. The 403 description is also garbled. The record reserves 403 for "an in-scope resource the participant may know but whose requested action the established role disallows", not for "a known action within its scope".
- Severity: Minor. It counts as a Weakened fact.

**PA-2. Minor: one-person operator approval is missing (P-11).**
- Guide (line 36): it describes Access, TOTP, the 15-minute session, the three roles, the allowed actions, the audit, and "A participant account grants no operator authority".
- Owners:
  - `SR-011` "## Owns": "One-person V1 operator approval with no general two-person or break-glass bypass."
  - `SEL-030` "## Selected Or Inherited Direction": "Require one currently authenticated authorized operator for V1 manual actions, not general two-person approval." Its verification text adds that one-person approval "cannot alter fixed bytes or chain facts".
- What is wrong: the guide does not say that approval is by one person, or that operators cannot override chain facts. The architecture guide says the latter at line 12. A reader cannot rule out "two-person approval protects every action".
- Severity: Minor. It counts as a Weakened fact.

**PA-3. Minor: no recorded status for the payment capability or the demo (P-14).**
- Guide (line 105): "Verification, runnable local use, testnet or mainnet deployment and activated production operation are separate claims, and this design claims only the first two." Lines 60–68 describe the Vault payment account in the present tense with no status.
- Owners:
  - Pre-migration `participant-access-and-loan-operations/domain.md` "### Recorded Choices And Scope": "The current payment capability is still an implementation target with no execution evidence established by this migration." This sentence was removed.
  - It survives only as status in `build/records/verification/va-003-runnable-local-demo-browser-acceptance.md` ("**Current payment-wallet delta:** Planned and unverified … No current implementation or pass is claimed by this record") and in the `BU-004` IFACE-022 rows marked `Planned`.
  - `build/workflow/handoffs/README.md`: local demo "Blocked".
- What is wrong: the guide loses the caveat that the payment capability has no execution evidence. "This design claims only the first two" can be read as a current runnable claim. The key's Q-P7 expects the blocked or unverified status.
- Severity: Minor. It counts as a Weakened fact, and it is close to an availability overclaim if read carelessly.

**PA-4. Minor: inputs simplified to "finalized Base facts".**
- Guide (line 28): "The domain receives … finalized Base facts from Base Observation And Fallback Review".
- Owners: `SR-011` "## Inputs And Outputs" ("Base observations/corrections and Bitcoin evidence" from SR-006, SR-002 and external observers) and `STATE-014` (observed and safe events are shown for display only).
- Severity: Minor.

**PA-5. Minor: the gas stipend is underspecified (P-15).**
- Guide (line 106): "in version 1 participants sign and submit them, helped by a bounded fee stipend."
- Owner: `INV-021` "## Rule": "an ordinary one-time native-ETH stipend transfer to the committed participant protocol EOA; it never carries, signs, submits, relays, or replays the participant's Base call."
- What is wrong: "one-time ETH to the protocol account" is not stated. The point that the platform does not submit is conveyed. Graded as Preserved with a minor gap.
- Severity: Minor.

**PA-6. Minor: participant-transfer checks not listed (P-10).**
- Guide (lines 62–68).
- Owners: `SR-011` "## Owns" (payment paragraph) and `IFACE-022` ACT-003.
- What is wrong: the validated recipient, the USDC and native-gas balance checks, and native value 0 are not stated. The narrow purpose and the exclusions are. Graded as Preserved with a minor gap.
- Severity: Minor.

**PA-7. Minor: missing nuances from 2a and 2e.**
- `SEC-002`: account takeover exposes ciphertext and metadata, and MFA does not protect a password typed into malicious JavaScript. Absent.
- `IFACE-014` "## Payload Or Artifact": a Base transaction returned by the Vault is a "tracking hint only". Absent.
- Severity: Minor.

**PA-8. Minor: reset is described as "clears it".**
- Guide (line 74): "only an explicit, bounded reset clears it".
- Owners: `SR-012` and `CONS-026` (reset then reseed).
- What is wrong: reseeding is not mentioned.
- Severity: Minor.

Claims I verified as correct:
- WorkOS with Google or a six-digit email code; a 7-day session with 24-hour inactivity; 15-minute reauthentication and the list of sensitive actions; TOTP if enrolled; password replacement requiring the current password plus email confirmation (`SR-010`).
- Same-loan dual roles forbidden (`SR-010`).
- Handoff code in the fragment, single use, bound to participant, role, loan, revision and action, with independent reload (`SR-011`, `IFACE-004`).
- Vault isolation from third-party code (`SR-011`).
- Workforce Access, TOTP with email codes excluded, 15-minute session, three roles and their actions (`SEL-030`).
- Retry schedule 1/2/5/15 minutes then hourly, with revalidation (`SR-011`).
- Payment intent, durable Signing, only identical-byte rebroadcast or verified reproduction, and no fee bump, replacement or cancellation (`CONS-028`, `IFACE-022`).
- Reconciliation at 0/15/60/180 s and when an account becomes blocked (`IFACE-022`, `STATE-021`). This is more precise than the key.
- Backup lag at 2/6/24 h (`SR-011`, `CONS-014`).
- Email retried for at most 24 h, with no secret or action link (`SR-011`).
- External monitor with 3-minute checks and alert after 2 failures (`SR-011`).
- "locked object storage" (`SEL-026`: "The package bucket uses a bucket-wide lock").
- Deferrals: `SCOPE-005`, `-006`, `-010`, `-013`, `-014`, `-015`, plus production payment gas, which `SR-011` calls deferred.

### 3.2 Key facts P-1 to P-15

| Fact | Status | Where / note |
| --- | --- | --- |
| P-1 | Preserved | line 3; "participant consent" is paraphrased as "recording an approval grants no signing, custody or funding authority", and line 15 says the handoff is "not … consent" |
| P-2 | Preserved | lines 11, 24, 32 |
| P-3 | Preserved | line 32 |
| P-4 | **Weakened** | PA-1 |
| P-5 | Preserved | lines 83, 106 |
| P-6 | Preserved | lines 15, 52 |
| P-7 | Preserved | lines 25, 78, 91, 93–94 |
| P-8 | Preserved | line 58 |
| P-9 | Preserved | lines 62–66 |
| P-10 | Preserved (minor gap) | lines 62, 68; PA-6 |
| P-11 | **Weakened** | PA-2 |
| P-12 | Preserved | lines 80, 82 |
| P-13 | Preserved (minor gap) | lines 72–74; PA-8 |
| P-14 | **Weakened** | PA-3 |
| P-15 | Preserved (minor gap) | lines 106–107; PA-5 |

### 3.3 Distinctions

- **2a** (primary): present at lines 3, 15, 30–32 and 36. Missing: the per-interaction check (PA-1) and the SEC-002 nuance (PA-7).
- **2b** (primary): present at lines 3, 18, 68, 91 and 93–94.
- **2e**: present at lines 18 and 93–94. The tracking-hint wording is absent (PA-7).
- **2f**: present at lines 62 and 68 (payment account as one eligible payer; payer-neutral).
- **2g** (primary): the claim separation is present at lines 74 and 105. Recorded status is absent (PA-3).
- **2h-1**: both sides and the open status are present at line 50. The reservation-expiry discrepancy is reported correctly at line 79.

### 3.4 Comprehension

| Question | Result | Notes |
| --- | --- | --- |
| Q-P1 | Correct | Line 32 |
| Q-P2 | Correct | Line 32 |
| Q-P3 | Correct | Line 24 |
| Q-P4 | Correct | Lines 15, 52 |
| Q-P5 | Correct | Lines 25, 58, 64, 78 |
| Q-P6 | Correct | Lines 3, 91, 93–94 |
| Q-P7 | Partial | No blocked or unverified status (PA-3) |
| Q-P8 | Partial | One-person approval and no override of chain facts are missing (PA-2) |

No "dangerous" answer traces directly to the guide. Q-P7's "already running" reading is a risk from line 105.

### 3.5 Verdict

**FAIL** under 4.7 on the preserved-facts criterion only: 12 of 15 (80%, below 90%). There are zero Critical and zero Major defects, and 6 of 8 comprehension answers are correct with no dangerous answers. Three one-sentence additions (PA-1, PA-2, PA-3) would make it pass.

---

## 4. Migration check: what the migration removed and where it lives now

### 4.1 Facts that now exist only in a guide, or nowhere

1. **Nowhere.** From the loan terms domain record, "### Choices And Scope": "An unresolved implementation question belongs in its existing ticket; a narrative or diagram cannot supply a missing approval." It is absent from every snapshot record and from the guide (LT-4).
2. **Nowhere as a statement.** From the loan terms domain record, "### Boundaries And Exceptions": "These rules prevent an apparently successful retry from reviving old approval or signing material." The underlying rules partly survive in `STATE-002` (cancellation or expiry "invalidates pending approvals" and "blocks every dependent action") and in `STATE-001` "## Invalid Transitions". The guide does not state the non-revival point (LT-5).
3. **No longer in any system-model record or guide.** From the participant domain record, "### Recorded Choices And Scope": "The current payment capability is still an implementation target with no execution evidence established by this migration." Status survives only in build status records (VA-003 "Planned and unverified"; BU-004 IFACE-022 rows `Planned`). See PA-3.
4. **Only in a guide (system-level wording).** From architecture "## System Overview": "Existing approval-wording and fee/count discrepancies identified by the migration remain unresolved source issues; this documentation revision does not choose new behavior." The ownership was moved deliberately:
   - The approval conflict is in architecture "## Purpose And Binding" (a new sentence pointing to the domain record) and in loan terms domain "## Choices And Rationale".
   - The fee and count conflicts are in Bitcoin domain "## Choices And Rationale".
   - The architecture record itself no longer mentions the fee or count conflicts. Only `guide/architecture.md` lists all three together. This is acceptable because each conflict has an owner.
5. **Only in a guide (framing).** From architecture "## System Overview": "each can report progress without acquiring another's authority: login is not a Vault unlock, an accepted command is not a chain fact, and a Base refund is not a confirmed Bitcoin recovery". This sentence now appears only at guide lines 46 and 110. Each rule underneath it has an owner: the Authority bullet on product authentication, `INV-012`, `INV-013`/`STATE-016`, `SR-007` "### When the path fails", and `flow-005` "## Outcomes".
6. **Trivial meta statements dropped:**
   - "Runtime topology … views … do not replace this written architecture." `README.md` still links the System Explorer.
   - "A visual … cannot satisfy those exclusions or activation gates." `SCOPE-013` "## Must Not Be Inferred" and `SR-012` cover fixtures, healthy processes and local evidence, but not visuals.
   - "These are existing exclusions, not newly selected capabilities."

### 4.2 Removed content that still has a technical owner

**Architecture "## System Overview":**
- Domain roles: "## System Domains".
- The normal, lender-silent and S paths: the Authority bullet on conditional SR-007, `INV-007`, `INV-009`, and `FLOW-004`/`005`/`006`.
- "Either Bitcoin path becomes final only when the expected spend confirms": `INV-009`, `IFACE-020`.

**Loan terms domain "## Domain Overview" and subsections:**
- Identity is not authorization: `IFACE-001` "## Must Not Imply"; architecture "## Purpose And Binding".
- Concept definitions: `SR-001`, `IFACE-001`, `IFACE-002`, `IFACE-003`.
- Consumer list: `SR-001` "## Inputs And Outputs", `INV-001`, `SR-006` "## Failure And Recovery", `IFACE-004`.
- Approval ordering: `SR-001`, `STATE-002`, `FLOW-001`.
- Identity separation: `INV-023`, `IFACE-022`, `SR-003`.
- Rejection, amendment and cancellation: `SR-001`, `STATE-001`, `STATE-002`, `INV-001`.
- Encoding rationale: moved to "## Choices And Rationale".
- Funding control after commit: `SR-001` "## Owns", `INV-011`.
- Exclusions: domain "## Excludes", `SCOPE-011`, `SCOPE-012`.

**Participant domain "## Domain Overview" and subsections:**
- Authority limits: domain "## Purpose", `INV-012`, `INV-013`, `SR-010` "## Must Not Own".
- Definitions: `SR-011`, `IFACE-013`, `IFACE-004`, `IFACE-022`.
- Access: `SR-010`, `STATE-003`.
- "A mock, health route, or producer-local method does not prove that public consumer path": `SR-011` "## Inputs And Outputs" paragraph, `CONS-024`.
- Local composition: `SR-012`, `IFACE-021`, `STATE-020`, `CONS-025`/`026`.
- Cooperation narrative: `FLOW-001`/`002`/`004`.
- Outbox, retry and payment reconciliation: `SR-011`, `IFACE-022`, `STATE-021`.
- Payment authority and participant transfer: `IFACE-022`, `INV-027`, `SR-011`, `CONS-028`/`029`.
- Cloudflare failure domain: architecture, `SR-011`, `CONS-015`.
- Choices: moved to "## Choices And Rationale".
- Claims and deferrals: `SCOPE-005`, `-006`, `-013`, `-014`, `-015`.

### 4.3 Observations on the technical records after migration (not guide defects)

- `system-model/architecture.md` "## Cross-Domain Boundaries" still says the offer interface "preserves … standing lender acceptance, atomic borrower reservation, and no second lender approval" with no conflict marker. Only "## Purpose And Binding" was annotated.
- The pre-migration participant record called production gas sponsorship "an excluded ticketed capability". `SR-011` calls it "deferred", and no scope record owns it. The guide follows SR-011 ("deferred"). This is a small classification drift.
- `SR-001` "## Responsibility Overview" now points to the guide for "the full cooperation scenario". All the scenario's facts are still owned by SR-001's "## Owns" and "## Failure And Recovery".

---

## 5. Corrections that would bring each guide to a pass

**Architecture:**
- AR-1: change line 153 to say that Base needs one healthy provider and stops on disagreement or a dual outage, while Bitcoin gates need fresh agreement and stop if the sources disagree or either one is unavailable.
- AR-2: add the SEC-023 race to the "After acceptance, before full activation" section and to the "cannot guarantee" list. The borrower, or anyone holding the signed refund, can broadcast the prefund refund at maturity. If it confirms first, the lender has paid principal without collateral. The 19-hour reserve reduces this risk but cannot remove it.
- Optional: AR-3 (severity-word rule) and AR-5 ("target claim" wording, separate testnet, mainnet and production rows).

**Loan Terms:**
- LT-1: after line 49, add that neither reservation nor final-terms approval grants Vault custody, signing, transaction, funding or chain authority.
- LT-4: restore the rule that a narrative or diagram cannot supply a missing approval.
- Optional: LT-2 ("the records disagree") and LT-5 (no earlier approval or signing material is revived).

**Participant:**
- PA-1: add that every interaction makes its own identity and role check, and fix the 403 wording.
- PA-2: add that operator approval is by one person, with no two-person or break-glass path, and that operators cannot override chain facts.
- PA-3: add that the payment capability and the local demo are design targets whose current execution status is recorded as planned and unverified, and that the demo slice is blocked.
