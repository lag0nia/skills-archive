# T12 Review A: semantic fidelity of three System Guide files

Reviewed (snapshot `snap-t12/bitrise21/loan-system/design/technical-design`):

- `guide/architecture.md` (cited below as ARCH)
- `guide/domains/loan-terms-and-commitments.md` (LT)
- `guide/domains/participant-access-and-loan-operations.md` (PART)

Line numbers refer to the snapshot guides. Owners were read in the snapshot and, where a narrative was removed, in the `pre/` copy. The criteria are expectations.md parts 4.2–4.7 and expectations-v2.md part 5. The checklist is v1 parts 1–2 as amended by v2 parts 2–4. I did not run the reader-question test (4.1 step 4), so the reader criterion of 4.7 is not scored here.

Severity labels: **Critical** (v1 4.2), **Major** (v1 4.3, or a v2 item marked Major), **Minor** (v1 4.4, or an omission that does not change who may act or when).

---

## 1. Architecture guide (`guide/architecture.md`)

### 1.1 Defects

| # | Guide passage | Owner (file, section) | What is wrong | Severity |
| --- | --- | --- | --- | --- |
| A-D1 | Figure, line 46: "Prefund \| The borrower sends Bitcoin to the prefund; both participants sign the activation and refund transactions." | `system-model/behavior/flows/flow-001-...md`, "## Ordered Transitions" step 7: "Borrower signs all activation and refund variants; lender verifies and adds its signature to all activation variants". Also `iface-004-...md` "### One-Time Cross-Origin Handoff": "lender initial signing of the same six activation variants"; `sr-002-...md` "## Owns": "six borrower-signed prefund-refund candidates". | **Changed meaning, in a figure.** The figure says the lender signs the borrower's prefund refunds. It does not. The lender signs only the activation transactions, so the borrower's pre-activation unwind needs no lender signature. The body text (line 56) is correct, so the figure contradicts both the owner and the guide's own prose. A figure-only reader gets who must sign wrong. | **Major.** It changes who must act. It is an owner contradiction in a figure, so it is a **v2 5.1 acceptance blocker**. |
| A-D2 | Line 19: "An optional third secret **S**, held by the independent validation service, can complete that same recovery, but only after the unclaimed repayment has been refunded on Base and that refund is final; a missing Y alone never releases S." | `sec-024-...md` "## Honest Capability Claim": BTC stays exposed "for every loan without an activated `H(S)` capability and until an `S` recovery confirms"; `inv-025-...md` "## Rule"; v2 part 4 (O-16): "Each passage that discusses the fallback states both conditions". | **Omitted condition.** This passage gives the per-event trigger but replaces both availability conditions (H(S) committed at creation, and the production-activation gate) with "optional". Line 13 just above, in the same section, does give the gate ("for loans created after its separate activation gate … not yet available for production use"), and line 72 gives both conditions. | **Minor** as I score it, because both conditions appear in the same section. A strict "each passage" reading of v2 O-16 would make this Major, and the coordinator may choose to score it that way. |
| A-D3 | Line 72: "For a loan created after the validation service is activated for production, the service holds a per-loan secret S whose hash was built into the borrower's recovery transaction before signing." | `iface-017-...md` "## Payload Or Artifact": "Only after counsel approval and implementation evidence activate the capability **may** a newly constructed loan replace the `H(Y)`-only borrower-recovery portion"; `sr-001-...md` "## Owns": "Conditional `H(S)` is present only for loans created with the approved capability." | **Changed meaning (slight).** "For a loan created after … the service holds" reads as if every post-activation loan carries S. The owner says such a loan *may* commit H(S). Both v2 conditions are present. | Minor |
| A-D4 | Line 119: "**Observers disagree or are unavailable.** Existing finalized status stays visible, new actions that depend on the contested fact stop, and one incident is tracked until fresh agreement returns." | `build/records/selections/sel-014-...md` lines 33 and 35. Conflict: "`base-observation-conflict` … alert operations until canonical replay resolves it". Both sources unusable: "show fresh Base data as delayed, alert operations after five minutes … Once a source is healthy, replay". `sr-006-...md` "## Failure And Recovery": the "fresh agreement" resumption applies to Bitcoin. | **Merged distinction.** The two Base cases (disagreement, and unavailability) and the Bitcoin rule are merged into one rule. Recovery on Base requires a healthy source plus replay, not "fresh agreement" (v1 4.3: "one healthy provider for Base but agreement for Bitcoin"). Line 92 states the Bitcoin agreement rule correctly. v2 part 3 (O-4) classes this merge as Minor. | Minor |
| A-D5 | Line 74: "Mutual cooperation, with fresh signatures from both participants, is a further route." | `scope-005-...md` "## Boundary": the cooperative mechanism is fixed, but "the participant signing session and the corresponding Base ledger treatment are not yet an end-to-end operational capability". | **Omitted deferral.** The cooperative route is presented with no note that its operation is deferred. The guide does not claim the route is operational, and the owners (SEC-024, FLOW-005) do list cooperation as a route. | Minor |
| A-D6 | Line 100: "There is no live fallback provider and no promised recovery time; periodic off-Cloudflare backups protect data, not service." | `system-model/architecture.md` "## V1 Operating Topology And Availability Boundary": "no live cross-provider fallback, active-active deployment, guaranteed cold redeployment, or stated RTO/RPO". | **Understated limit.** It omits "no guaranteed cold redeployment" and "no active-active deployment", and states RTO but not RPO. | Minor (A-10 Weakened) |
| A-D7 | Line 112: "which refuses to start if any setting points at a public network or public credentials." | `architecture.md` "## Target Outcome And Runtime Profiles": "Every required local predicate must agree before bootstrap; absence, conflict, a non-loopback bind, a non-regtest Bitcoin network, a non-local Base chain, public credentials, or a public deployment manifest fails closed". | **Omitted condition.** The guide does not say that an absent or conflicting local predicate, or a non-loopback bind, also fails closed. | Minor (A-12 Weakened) |
| A-D8 | Line 122: "Threats are analysed by the exact capability lost, the loan state and whether supposedly independent controls share a failure domain." | `architecture.md` "## Security Change Control" ("No threat may be summarized by a severity word alone"; "A component is not secure merely because each credential appears insufficient in isolation…") and "### Combination-Attack Ownership" ("Each approved combination has one primary `SEC-xxx` owner"). | **Omitted rules.** The ban on severity-word summaries, the insufficient-in-isolation rule and single primary ownership are absent. The examples given are accurate. | Minor (A-14 Weakened) |
| A-D9 | Table, line 107, Local demonstration: "What it does not prove: Test-network or main-network deployment, real-provider compatibility or production activation." | `architecture.md` profile table: "Testnet/mainnet deployment, real-provider compatibility, public funding, or production activation." | **Omitted item.** "public funding" is missing. | Minor |
| A-D10 | Line 112: "earlier deliveries of every component up to the cross-domain verification harness are recorded as implemented, current corrections to several of them have not yet been executed…" | `build/records/verification/va-001…va-004`: "**State:** `Planned — unverified`"; VA-003 "Existing-capability evidence: None"; v2 part 4 (2g extended). | **Status omitted.** The table describes "Deterministic local verification" as a claim, and the status paragraph reports implementation and blockage, but it never says the verification records are planned and unverified. Nothing in the guide claims verification is done, so there is no status collapse. | Minor |
| A-D11 | Line 3: "Its purpose is that each party gets exactly what the agreed loan says…" | `sec-025-...md`, `inv-025-...md`: after valid repayment the lender's default can still pay the lender. | **Guarantee-like opening.** It is framed as the design's purpose, not as a guarantee, and line 124 states the limits. It still sits in the most-read opening paragraph. | Minor (note only) |
| A-D12 | Lines 56, 116 and 117 use "refund" for the Bitcoin prefund refund; lines 70 and 72 use it for the Base unclaimed-repayment refund. Lines 13 and 72 also use "activated" for the fallback service next to Bitcoin "activation". | v1 4.3 vocabulary collisions "Refund" and "Activation". | Context separates each use ("borrower's signed refund transactions" against "fixed refund, which returns the exact repayment"; "activated for production", "separate activation gate"), but the guide never tells the reader that these are different things. | Minor |

No Critical defect was found. The guide does not collapse any authority or status, does not claim the fallback is available, does not settle any open conflict, and has no wrong number. C is "two days after D … strictly before", T is three days, B is ten days, the fee levels are 10–200, and the 67-hour, six-confirmation and roughly 20-minute values are all sourced (the 20 minutes from `sel-013`, lines 15 and 23).

### 1.2 Must-preserve facts (v1 1.1, as amended by v2)

| Fact | Status | Where / note |
| --- | --- | --- |
| A-1 | Preserved | Lines 36, 72, 85 |
| A-2 | Preserved | Lines 7, 86, 132. "Public or multi-lender matching" is not named, but "one selected lender" and an offer "for exactly one loan" carry it. |
| A-3 | Preserved | Line 78 |
| A-4 | Preserved | Line 83 |
| A-5 | Preserved | Line 84 |
| A-6 | Preserved | Line 85 |
| A-7 | Preserved | Lines 11, 90 |
| A-8 | Preserved | Lines 62, 72 |
| A-9 | Preserved | Lines 98–100 |
| A-10 | Weakened | A-D6 |
| A-11 | Preserved | Table, line 112 |
| A-12 | Weakened | A-D7 |
| A-13 (amended: 2h-1, 2h-2, 2h-3, 2h-5 open) | Preserved | Lines 135–142 |
| A-14 | Weakened | A-D8 |
| A-15 | Preserved | Lines 36, 92 |
| A-16 (v2) | Preserved | Lines 21, 122 |

The guide preserves **13 of 16 facts (81%)** and contradicts none.

Distinctions:

- **2a: present.** Line 85 covers login. The architecture guide never says that final-terms approval grants no signing power; the Loan Terms guide does.
- **2b: present.** Lines 84 and 92.
- **2c: present.** Lines 70–72 and 116. The vocabulary collision is noted in A-D12.
- **2d (summary plus gate): present.** Line 72.
- **2e: present.** Lines 62 and 92. The S path relies on the general "only a confirmed spend" rule.
- **2f: present.** Lines 7, 58 and 86.
- **2g claim ladder: present.** Lines 102–112.

### 1.3 Unresolved points the guide reaches

| Point | Handling |
| --- | --- |
| 2h-1, lender approval | Correct. Figure line 45, line 54 and line 137 give both sides and say "undecided". It also follows the snapshot owner's added nuance on TICKET-0069 and STATE-010. |
| 2h-2, package count | Correct. Lines 60 and 138 give 18 as the activation-flow count and name the stale 12 sentence in SR-002 (verified: `sr-002` "## Owns" archive bullet against its own 6+6+6 bullet). |
| 2h-3, fee | Correct. Lines 60, 117 and 142 give both sides. It is not merged with estimator outage. |
| 2h-5, beta upgrade governance and the effect on running loans | Correct. Lines 3, 89, 139 and 140 give both sides and call each open. |
| 2h-8, on-chain pause | Accepted treatment (the tension is reported). Line 141 reads "the selection and the settlement responsibility say there is none; the deployment state includes pause roles and a narrow operational pause". |
| 2h-4, long-stop after refund | Included (line 74). |
| 2h-4, API version | Not stated, as required. |
| 2h-6 and 2h-7 | Reached without defect. Line 19 does not claim that every loan carries H(S). Lines 48 and 58 do not say only the Vault caller can reveal X. |

### 1.4 Verdict: Architecture guide

- Critical: 0. Major: 1 (A-D1). It is not corrected anywhere in the guide's figures.
- Facts: 81% preserved. This is **below the 90% threshold** of v1 4.7. The weakened facts (A-10, A-12, A-14) are each Minor in isolation.
- All four 2h conflicts and the claim ladder are carried.
- **Verdict: FAIL under v1 4.7** (the 90% criterion; one Major is otherwise tolerable with a correction note). **Not accepted under v2 5.1**, because A-D1 contradicts an owner in a figure.

---

## 2. Loan Terms And Commitments guide (`guide/domains/loan-terms-and-commitments.md`)

### 2.1 Defects

| # | Guide passage | Owner (file, section) | What is wrong | Severity |
| --- | --- | --- | --- | --- |
| LT-D1 | Line 36: "creates the participant's secret, X for the borrower and Y for the lender … Only the secret's hash leaves the Vault." Line 7: "secret commitments". The guide never mentions S or H(S). | `sr-001-...md` "## Owns": "Conditional `H(S)` is present only for loans created with the approved capability."; v2 2h-6 / L-12 amended. | **Omitted fact (L-12 Missing).** The terms guide never tells the reader that a third, conditional commitment can be part of the binding. The guide does not imply that every loan carries H(S), so this is an omission, not a contradiction. | Minor (counts against the 90% fact rule) |
| LT-D2 | Line 53: "the operations domain cancels the reservation, reopens the offer, blocks that borrower from the same offer and records an infraction." Line 34: "If another borrower selects the same offer at the same moment, that selection loses…" | `state-001-...md` "## Transitions": "…increment exactly one infraction, notify both parties"; `iface-003-...md` "## Failure Meaning": "Concurrent or stale selection loses without creating a second reservation." | **Omitted items.** The notices to both parties are missing, and only a concurrent selection is said to lose, not a stale one. | Minor (L-4 Weakened) |
| LT-D3 | Line 50: "Before the collateral is active, the terms can be replaced only by a later version with fresh approvals and freshly built dependent artifacts. An active loan is never amended in place." | `state-002-...md` "## Transitions": supersession guard "No active/effective escrow **or Base loan** may be amended in place"; "## Invalid Transitions": "superseding after activation". | **Omitted condition.** "Before the collateral is active" could read as allowing a replacement after the Base loan is opened, funded or accepted, as long as Bitcoin activation has not confirmed. The owner also bars amending an effective Base loan in place. The owner's "pre-activation" is itself loose. | Minor |
| LT-D4 | Line 14: the manifest "excludes web addresses, credentials, application settings and secrets". | `sr-001-...md` "## Owns": "excluding URLs, credentials, application configuration, **dynamic attempts**, and secrets". | **Omitted item** ("dynamic attempts"). | Minor (L-2 still Preserved) |
| LT-D5 | Line 63: "A workspace copy or an acceptance snapshot is a presentation copy." | `state-002-...md` "## Authority And Identity": "Product acceptances … are immutable workflow records" (that is, final-terms approvals). | **Vocabulary collision.** This "acceptance" (the approval snapshot) is never told apart from borrower X acceptance on Base, which the guide does not discuss. Line 34's "standing acceptance" is explained. | Minor |

Correct values, checked against owners:

- the 24-hour reservation and the 72-hour manual review;
- the reservation counter (`state-001` "## Authority And Identity");
- "principal, rate and dates" (`sel-012` line 31);
- the second approval committing in the same transaction (`state-002`);
- the changed-content rejection (`state-002` "## Observation And Finality");
- the expiry-before-commitment rule, including "no loan and no second lender approval may be inferred" (`state-001` line 39);
- the trade-offs attributed to the SEL-010 and SEL-012 selections;
- the TICKET-0069 and TICKET-0150 quotes (verified in `sr-010-tickets.yaml` lines 93–94 and `sr-004-hd-vault-and-acceptance-tickets.yaml`).

No Critical or Major defect was found.

### 2.2 Must-preserve facts (v1 1.2, as amended)

| Fact | Status | Where / note |
| --- | --- | --- |
| L-1 | Preserved | Line 16 |
| L-2 | Preserved | Line 14 (LT-D4 minor) |
| L-3 | Preserved | Lines 11, 34, 73 |
| L-4 | Weakened | LT-D2 |
| L-5 | Preserved | Lines 36–38. Both roles' preparations are covered (H(X) and H(Y)), so the domain narrative's borrower-only slip is not copied. |
| L-6 | Preserved | Lines 46–48 |
| L-7 | Preserved | Line 40 |
| L-8 | Preserved | Line 40 |
| L-9 | Preserved | Line 62 |
| L-10 | Preserved | Line 49 |
| L-11 | Preserved | Lines 50–51 (LT-D3 minor) |
| L-12 (amended) | **Missing** | LT-D1 |
| L-13 | Preserved | Lines 34, 42, 69, 73 |
| L-14, first sentence | Preserved | Line 75 |
| L-15 | Preserved | Lines 59–63 |

The guide preserves **13 of 15 facts (87%)** and contradicts none. If LT-D2 is judged too slight to weaken L-4, the count is 14 of 15 (93%).

Distinctions:

- **2a (approval is not signing): present.** Line 40.
- **2f: present.** Lines 40 and 60.
- **2h-1: present.**
- **v1 4.6 boundary: present.** The guide says approval is not signing or funding (line 40).
- **Reservation expiry against cancellation (v2 "reconciled by scope"):** both cases are kept (lines 52–53). The guide records no false conflict.

### 2.3 Unresolved points the guide reaches

| Point | Handling |
| --- | --- |
| 2h-1, lender approval | Correct and thorough (line 73). It gives both sides, the TICKET-0069 attribution against the resolution wording, TICKET-0150, and "remains undecided". The normal case (line 34) presents the standing-acceptance wording and points to the open question. |
| 2h-6, where H(S) sits | Not reached, because H(S) is omitted (LT-D1). |
| 2h-9, participant references | Not reached. That is acceptable: it is not a must-preserve fact. |

### 2.4 Verdict: Loan Terms guide

- Critical: 0. Major: 0. Fact preservation is 87%, just under the 90% criterion; the deciding items are the L-12 omission and the L-4 weakening.
- There is no v2 5.1 acceptance blocker: no contradiction, no material omitted condition.
- **Verdict: narrow FAIL under v1 4.7** (the 90% criterion only; it passes if L-4 is scored Preserved). **No acceptance blocker.** Adding one sentence on the conditional H(S) commitment, plus the notices, would clear it.

---

## 3. Participant Access And Loan Operations guide (`guide/domains/participant-access-and-loan-operations.md`)

### 3.1 Defects

| # | Guide passage | Owner (file, section) | What is wrong | Severity |
| --- | --- | --- | --- | --- |
| P-D1 | Line 14: "A **handoff** gives one participant access to one bounded action in their Vault. It is not a general signing permission." No passage says the code is not authentication, consent or cryptographic authority. | `iface-004-...md` "### One-Time Cross-Origin Handoff" (lines 51–53): "A handoff code is an expiring pointer, not authentication, transaction consent, or cryptographic authority."; "The Vault never signs bytes supplied only by the normal-product page." v2 part 4 (P-6 strengthened). | **Distinction stated in one direction.** "Not a *general* signing permission" implies the handoff is a *specific* signing permission. v2 names this exact wording as Major. Line 33 ("reloads the exact action from the application rather than trusting the page") partly carries the "never signs page bytes" half, but the "not authentication, consent, or cryptographic authority" half is absent everywhere. (The wording was copied from the pre-migration domain narrative, which the IFACE-004 owner overrides.) | **Major.** v2 marks this amended item Major, so it is a **v2 5.1 acceptance blocker**. |
| P-D2 | Line 61: "If the outcome is unclear, the application checks at 0, 15 and 60 seconds and escalates at 180 seconds … it reconciles, retries only with the identical signed bytes, or visibly blocks the account." | `state-021-...md` "## Bounded Reconciliation Policy" (lines 41 and 43): "After 180 seconds, a participant or authorized operator may explicitly reprobe or retry the identical signed bytes … Only missing exact pending/deterministic evidence or contradictory evidence produces `Reconciliation blocked` plus account `Blocked`." | **Omitted conditions (v2 P-9 amended).** It does not say that retry after escalation is an explicit participant or operator action, or that blocking happens only on missing or contradictory evidence. It reads as if the application may choose to block. It does not repeat v1's wrong "escalated … to a visible block". | Minor (P-9 Weakened; v2 does not mark P-9 Major) |
| P-D3 | Line 61: "A narrow participant transfer lets a participant send the configured USDC to a recipient they choose; it is not linked to any loan and cannot change loan state." | Pre `participant-access-and-loan-operations/domain.md` "### Payment Authority And Availability": "to a validated user-selected recipient with exact approval and balance/gas checks"; `sr-011-...md` (payment paragraph): "valid user-chosen recipient, positive amount, native value `0`, sufficient USDC/native gas balance, exact gas/fee approval". | **Omitted conditions:** validation, exact approval, and balance and gas checks. | Minor (P-10 Weakened) |
| P-D4 | Line 76, workforce operators. The passage omits that approval is by one person. | `sr-011-...md` "## Owns": "One-person V1 operator approval with no general two-person or break-glass bypass." | **Omitted fact** (P-11). The guide says an operator performs "only a fixed list of review and incident actions", which carries the fixed-action limit, but not the one-person approval. | Minor (P-11 Weakened) |
| P-D5 | Line 61: "The handoff sequence records the latest transfer-review correction as passing its focused checks but not yet finalized…" | Pre `participant-access-and-loan-operations/domain.md` "### Recorded Choices And Scope": "The current payment capability is still an implementation target with no execution evidence established by this migration." `va-003-...md`: "**Current payment-wallet delta:** Planned and unverified." | **Status understated / partly substituted.** The guide reports one correction's focused checks (accurate per `handoffs/README.md` line 23) and that browser proof waits on the blocked demo (supported by VA-003). It never states the owner's status for the payment capability as a whole: an implementation target, planned and unverified. A reader could take "passing its focused checks" as evidence that the payment path works. | Minor (P-14 Weakened; no status collapse) |
| P-D6 | Line 33: "When both participants' results are recorded, the workspace shows one candidate version of the final terms, and each participant approves the same version." No statement that this approval grants no Vault custody, signing, funding or chain authority. | `sr-010-...md` "## Owns" (`approve_final_loan_terms`): "The approval grants no Vault custody, signing, funding, or chain authority." v1 2a lists Participant Access as **primary**. | **Distinction only partly carried.** Login → no decryption is stated (line 27). Approval → no signing is not. The guide does not imply the opposite, so this is not a one-direction collapse in the 4.3 sense. | Minor |
| P-D7 | Line 57: "Retrieving sensitive encrypted data, opening a Vault handoff or replacing the Vault password needs a sign-in no older than 15 minutes…" | `sr-010-...md` "## Owns": "before sensitive ciphertext, seed-display request, current PSBT, vault handoff, or vault-password replacement". | **Omitted items:** seed-display request and current PSBT. The 15-minute value is correct. | Minor |
| P-D8 | Line 13: "so a lost notification cannot lose the work." | Pre `domain.md` "## Domain Overview": "so a lost immediate wake cannot lose the operation"; `sr-011` treats product notifications as a separate, non-authoritative email outbox. | **Naming drift / collision.** "Notification" here means the internal wake, not the product notifications the same domain owns. | Minor |
| P-D9 | Lines 86 and 88, local demonstration. | `sr-012-...md` "## Owns": "Loopback-only process supervision"; `architecture.md`: "a non-loopback bind … fails closed". | **Omitted limit:** loopback-only. "On one machine" and "refuses … public network or public credentials" carry most of it. | Minor |

Correct values, checked against owners:

- WorkOS with Google or a six-digit email code; one account never holding both roles on the same loan;
- sessions of seven days or 24 hours idle; 15-minute reauthentication; TOTP once enrolled; email confirmation that "never replaces the current Vault password";
- the 401/404/403 denial semantics (`sr-010` paragraph after the table);
- the retry schedule of 1, 2, 5 and 15 minutes then hourly, after revalidation (`sr-011` fixed-effect automation bullet);
- backups (hourly locked S3, daily D1 export, 2-hour, 6-hour and 24-hour thresholds, existing loans continue);
- the operator boundary (Access, company Google, TOTP, 15-minute session, viewer/operator/security_admin, uneditable audit);
- the handoff reissue rule ("Recovery creates a fresh code only after reloading unchanged canonical context", `iface-004` line 126);
- the Cloudflare outage boundary, and the deferrals (SCOPE-005, -006, -014, -015, and production gas for payment accounts).

### 3.2 Must-preserve facts (v1 1.6, as amended)

| Fact | Status | Where / note |
| --- | --- | --- |
| P-1 | Preserved | Line 3 |
| P-2 | Preserved | Lines 21, 27 |
| P-3 | Preserved | Line 57 (P-D7 minor) |
| P-4 | Preserved | Lines 21, 55 |
| P-5 | Preserved | Line 94 |
| P-6 (strengthened) | **Weakened (Major)** | P-D1 |
| P-7 | Preserved | Figure, lines 59, 80 |
| P-8 | Preserved | Figure, line 51 |
| P-9 (amended) | Weakened | P-D2 |
| P-10 | Weakened | P-D3 |
| P-11 | Weakened | P-D4 |
| P-12 | Preserved | Line 65 |
| P-13 | Preserved | Lines 86–88 (P-D9 minor) |
| P-14 | Weakened | P-D5 |
| P-15 | Preserved | Lines 94–97 |

The guide preserves **10 of 15 facts (67%)** and contradicts none.

Distinctions:

- **2a: partial.** See P-D1 and P-D6.
- **2b: present.** Lines 17, 73 and 80. Workspace status is not chain truth, so the 4.6 boundary is met.
- **2e: present.** Line 17.
- **2f (Vault payment account as one payer): implicit only.** Line 61 says a participant "can pay", but not that the account can fund or repay without becoming a recipient.
- **2g: present.** Lines 86 and 90: the runtime is not delivered, and the receipt proves only the local profile.

### 3.3 Unresolved points the guide reaches

| Point | Handling |
| --- | --- |
| 2h-1 | Correct (line 33). It says "undecided in the records" and links to the terms guide's two readings. |
| 2h-4, API version | Not stated, as required. |
| Other 2h items | Not reached. |

### 3.4 Verdict: Participant guide

- Critical: 0. Major: 1 (P-D1). Fact preservation is 67%, far below 90%.
- **Verdict: FAIL under v1 4.7** (the 90% criterion). **Not accepted under v2 5.1**, because P-D1 is an amended item marked Major (a material omitted condition).

---

## 4. Cross-guide checks required by v2 part 5.2

| Item | ARCH | LT | PART |
| --- | --- | --- | --- |
| 2h-5, upgrade governance open | Present, both sides, open (lines 3, 89, 139–141) | Not reached (line 14 names "upgrade policy" only as a manifest field) | Not reached |
| A-16 / B-16, no redirection | Present (lines 21, 122) | n/a | n/a |
| O-16, both fallback conditions | Present at line 72. Line 19 relies on line 13 (A-D2). Line 124 says "no S exists". | Fallback not discussed | Fallback not discussed |
| P-6, handoff authority | Handoff only named (line 34); no defect | n/a | **Major** (P-D1) |
| B-12, what each confirmation permits | Present for acceptance (line 58). The claim (line 62) does not narrate confirmations. | n/a | Acceptance not narrated |
| 2g, status distinctions | Present. The verification records' "unverified" state is not stated (A-D10). | n/a | Present. The payment-capability status is partial (P-D5). |

---

## 5. Where the answer key is wrong or incomplete

All points below were verified against the records.

1. **2h-8 (on-chain pause) misses two owners that support the "pause exists" side.**
   - `sec-017-...md` lists "opener/pause/operational signers" (lines 14 and 28), forbids a unilateral "pause key" (line 55), and its incident step is "pause new funding" (line 66).
   - `inv-019-...md` "## Rule": "Any pause/operational role is narrow…".
   - Neither changes the accepted treatments, but the tension is wider than SEL-009 against STATE-019.
2. **2h-5's related tension misses SEL-009's own reconciling sentence.** SEL-009 says both "A compatible approved upgrade becomes the one current code path for every loan held by the proxy" (line 32) and "each loan remains pinned to its originating deployment identity" (also in SEL-009). This suggests that "originating contract" may mean the proxy, which could reconcile INV-020 with SEL-009. The key presents the tension as SEL-009 against INV-020 and STATE-019 only. A guide that reports the open question is still right; the key just understates the evidence.
3. **2h-1 Side A misses STATE-010.** `state-010-...md` "## Invalid Transitions" lists "second lender approval" as excluded. The key also quotes only TICKET-0069's *attribution* ("no … second lender approval"). Its *resolution* says "no email invitation or second lender **commercial** approval" (`sr-010-tickets.yaml` line 93), which supports STATE-001's reservation-only reading. Both guides that reach 2h-1 carry these points, so this is a key gap, not a guide defect.
4. **v1 P-6's original source is weaker than IFACE-004.** The pre-migration Participant domain narrative itself said a handoff "is not a general signing token". v2's P-6 strengthening correctly sets IFACE-004 as the governing owner, but the key does not record that the domain narrative and the interface disagreed. That disagreement explains why the PART guide copied the weaker wording.
5. **v1 1.1 assigns no fact on who signs the initial package phase** (FLOW-001 step 7), although the Architecture guide narrates that phase in both prose and figure. A-D1 is therefore found by owner check, not by the checklist. I suggest a fact for the Architecture and Bitcoin guides: "The borrower signs all six activation and six refund transactions; the lender signs only the six activation transactions."
6. **v1 4.7's 90% "Preserved" threshold interacts harshly with Minor weakenings.** In this run all three guides miss it mainly through Minor omissions (A-10, A-12, A-14; L-4; P-9, P-10, P-11, P-14). This is not an error in the key, but the coordinator should be aware that "Weakened" items with only Minor defects decide two of the three 4.7 verdicts here.

---

## 6. Technical-record changes observed (outside this review's scope)

I report these only because they bear on the owners the guides restate. They belong to the technical-diff review. `build/` is byte-identical to `pre/`. The changed records are `architecture.md`, three domain records in my scope, two others, and SR-001.

- **L-14, second sentence.** "A narrative or diagram cannot supply a missing approval" was removed from the Loan Terms domain record and survives in no system-model record (grep finds no match). Under v2 part 1 this must survive in an owner or be reported.
- **Payment capability status.** "The current payment capability is still an implementation target with no execution evidence established by this migration" was removed from the Participant domain record and survives nowhere in `system-model/` or `build/records/`. VA-003's "Planned and unverified" payment delta partly carries the meaning.
- **A-1 contrast sentence.** "Login is not a Vault unlock, an accepted command is not a chain fact, and a Base refund is not a confirmed Bitcoin recovery" (pre architecture "## System Overview") has no verbatim survivor. Its meaning survives in architecture "## Authority And Sources Of Truth", STATE-013 "## Invalid Transitions" and INV-013.
- **The architecture record's statement that the revision chooses no new behavior** ("this documentation revision does not choose new behavior") was removed. The fee and count conflicts now live as conflict notes in the Bitcoin domain record (lines 45–46), and the approval conflict as an open question in the architecture and Loan Terms records. I found no rewritten side.
- **SR-001 now points to a guide.** Line 17 now says the Loan Terms guide "explains the full cooperation scenario". A technical record now delegates explanation to a reader guide; whether that is permitted is a process question for the technical-diff review.
- **The Base Settlement domain record now records the 2h-5 and 2h-8 conflicts,** which the pristine package did not. Its quotations are accurate (verified for SEL-009, INV-020, STATE-019, SCOPE-007 and SEC-017), and neither side is rewritten.

---

## 7. Summary of verdicts

| Guide | Critical | Major | Facts preserved | v1 4.7 | v2 acceptance |
| --- | --- | --- | --- | --- | --- |
| Architecture | 0 | 1 (A-D1, figure says the lender signs the refunds) | 13/16 (81%) | Fail (90% criterion) | **Blocked**: owner contradiction in a figure |
| Loan Terms And Commitments | 0 | 0 | 13/15 (87%) | Narrow fail (90% criterion; 14/15 if L-4 is scored Preserved) | No blocker |
| Participant Access And Loan Operations | 0 | 1 (P-D1, "not a general signing permission") | 10/15 (67%) | Fail (90% criterion) | **Blocked**: v2-Major P-6 omission |
