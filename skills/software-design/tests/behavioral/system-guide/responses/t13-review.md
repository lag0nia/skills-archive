# T13 review: architecture guide and Base Observation And Fallback Review guide

Package reviewed: `snap-t13/bitrise21/loan-system/design/technical-design` (paths below are relative to it). Baseline: `pre/...` (untouched copy). Criteria: `expectations.md` part 4 as amended by `expectations-v2.md` part 5. Checklist: v1 parts 1–2 plus v2 parts 2–4. Nothing in the package was changed.

Evidence used besides the records: the T13 guide-only reader answers (`responses/t13-architecture-reader.md`, `responses/t13-observation-reader.md`). I cite them only where a reader answer confirms or refutes a defect I found in the text.

## Verdicts

| Guide | Critical | Major | Facts preserved | Reader (≥6 correct, none dangerous) | v2 5.1 blockers | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| `guide/architecture.md` | 0 | 2 | 13 of 16 (81%) | Met: 6 correct, 3 partial, none dangerous | 1 (material omitted condition, A-16) | **FAIL** |
| `guide/domains/base-observation-and-fallback-review.md` | 0 | 0 (one borderline item, see B-m1) | 15 of 16 (94%) | Met: 8 of 8 | None confirmed | **PASS** (with a correction note if B-m1 is ruled Major) |

---

## Part A — Architecture guide (`guide/architecture.md`)

### A.1 Defects

#### A-M1 (Major; v2 5.1 blocker: material omitted condition). Who can broadcast a matured default package is narrowed to the lender

- **Guide:** "The lender exports and broadcasts it; the organization does not broadcast default transactions." ("When things go wrong", "If the borrower does not repay"). The lender-silence paragraph says only "the lender's timelocked route can still win".
- **Owner:** `system-model/contracts/security/sec-025-lender-or-package-holder-broadcasts-default-after-valid-repayment.md`. "### SEC-025.THREAT-001" says: "the lender—or any attacker who stole the already signed default package—broadcasts the Bitcoin default transaction". "Plausibility and incentive" says: "a random package thief cannot redirect value but may collude, extort, or sabotage". "## Prohibited Authority" says: "the package holder may not redirect the fixed payout".
- **What is wrong:** an omitted condition that changes who may act (v1 4.3). It also drops v2's added fact A-16. The guide never says that anyone holding the package can broadcast it once it matures. It also never says that the payout still goes only to the fixed lender destination. Stated alone, "The lender exports and broadcasts it" reads as an exclusive rule, which leads toward Q-A9's dangerous answer "it cannot be broadcast without the lender". The T13 reader could not answer Q-A9 from the guide ("The guide never discusses this case directly"). The reader reached the fixed destination only by inference from the general pre-signed-transaction bullet.
- **Contrast:** the observation guide states this correctly: "The lender, or anyone holding the exported package, can broadcast it".

#### A-M2 (Major). Half of conflict 2h-5 is missing: what an upgrade does to running loans

- **Guide:** the open question "*The single upgrade key during the beta*" covers the beta key. The guide says nothing anywhere about whether an upgrade changes the code that governs existing loans.
- **Owners:**
  - `build/records/selections/sel-009-base-contract-upgrade-governance.md`, "## Selected Or Inherited Direction": "A compatible approved upgrade becomes the one current code path for every loan held by the proxy. V1 has no per-loan legacy rule branch."
  - Against it: `system-model/contracts/invariants/inv-020-base-upgrade-boundary.md`, "## Rule": "existing loans remain on their originating contract and are not silently migrated". `system-model/contracts/states/state-019-base-deployment-upgrade-and-opener.md`, line 37: "Do not migrate or reinterpret existing originating loans". STATE-019 line 48 also lists "retroactive mutation/migration of existing loans" as invalid.
- **What is wrong:** v2 2h-5 requires that "the guides present the governance during the beta, and the effect of an upgrade on running loans, as unresolved, with both sides". v2 also makes 2h-5 one of the architecture's mandatory conflicts (v2 part 1, A-13 and 4.7). The guide states neither side, so this is an omission, not a silent resolution, and it is not Critical. It still leaves a required unresolved point uncarried. The amended record `system-model/domains/base-usdc-settlement-and-funding/domain.md` ("## Choices And Rationale") records only the beta-key half, so the guide follows the record's gap. The key still requires both halves.

#### A-W1 (key fact weakened, A-14). The rule against describing a threat by a severity word alone is missing

- **Guide:** "It cannot make a combination of compromises safe merely because each stolen piece looks harmless alone: the security records analyse realistic combinations, such as a shared frontend compromise during both participants' unlocks, and name one owner for each." ("What the system cannot guarantee").
- **Owner:** `system-model/architecture.md`, "## Security Change Control": "No threat may be summarized by a severity word alone. Analysis must state the compromised capability, exact lifecycle state, …".
- **What is wrong:** the guide keeps the combination rule and the one-owner rule but drops the severity-word rule and the list of what an analysis must state. The T13 reader answered Q-A7 only in part ("It does not give any required format … low on 'how it must be described'"). This is not a 4.3 Major, but it counts against the 90% threshold.

#### Minor defects

- **A-m1. A point the owner scopes is presented as an open question: expiry of an unused reservation.**
  - **Guide:** "the offer selection and the reservation contract apply cancellation, reopening, a block on that borrower and an infraction to any missing prefund at the deadline. Which applies is undecided." The same point appears in the walkthrough: "(whether an unused one that expires before the terms are committed also costs the borrower an infraction is an open question, below)".
  - **Owners:**
    - `state-001-one-loan-offer-and-reservation.md`, "## Transitions", last row: "Unused reservation reaches the 24-hour expiry before terms commitment and without a prefund attempt … once terms are committed, the 24-hour no-prefund rule routes to Reopened instead". Its Reopened row says "after terms commitment".
    - `iface-003-...md`, "## Preconditions And Validation": cancel or reopen happens "only under `STATE-001`".
  - **What is wrong:** v2 rules this "Reconciled by scope, not a conflict", and I agree. STATE-001 states which rule applies to each case, and IFACE-003 defers to STATE-001. Only SEL-012 line 33 is unqualified. Calling IFACE-003 a rule for "any missing prefund" ignores its deferral to STATE-001. The guide keeps both cases and adopts neither, so this is not the Major "either case as the only rule". The open question it restates was added to `participant-access-and-loan-operations/domain.md` in this run, which v2 classes as a Minor process defect.
- **A-m2. The relay open question merges two different wordings.**
  - **Guide:** "the long-stop and cooperative settlement records describe relaying those transactions through the existing constrained path".
  - **Owners:** only `flow-010-...md` step 2 says "through the existing constrained path". `iface-019-...md` says "The platform may select and broadcast one", and `flow-009-...md` step 5 says "Verify, select, finalize, broadcast, and confirm one variant".
  - **What is wrong:** one record's wording is attributed to both.
- **A-m3. The lender-silence paragraphs leave out cooperation, and one time condition is misleading.**
  - **Cooperation:** `flow-005-...md` "## Failure And Reroute" and `flow-006-...md` both list cooperative settlement as a route that remains. The guide's lender-silence paragraph omits it, so the T13 reader's Q-A5 answer lacked the cooperative spend.
  - **Time condition:** "Until the fallback is available, the borrower's only secret-free route is the long-stop". The long-stop stays the borrower's only secret-free unilateral route after availability too, because S is a secret. For loans without H(S), availability changes nothing. The sentence implies a change that the owners do not record.
- **A-m4. Default timing is imprecise.**
  - **Guide:** "Once the deadline passes without a valid, final repayment, the lender may use its pre-signed default transaction." The next sentence then gives the correct maturity, "once median time past passes D plus three days".
  - **Owner:** `inv-008-...md`, "## Rule": the lender route is valid only once MTP satisfies `T = D + 259,200`.
  - **What is wrong:** the first sentence implies use at D.
- **A-m5. Who signs pre-signed transactions is overgeneralized.**
  - **Guide:** "transactions that both participants review and sign in advance".
  - **Owners:** `flow-001-...md` step 7 says the borrower alone signs the refund variants. `flow-002-...md` step 8 says "Each participant signs only its own fixed-destination protection routes; no counterparty signature is required for a unilateral route".
- **A-m6. The finality attribution is merged.**
  - **Guide:** "Waiting for layer-1 finality before any consequential step trades about 20 minutes … for one uniform, safety-first rule; the user specified it."
  - **Owner:** TICKET-0047 (`build/workflow/tickets/base-usdc-settlement-and-funding/sr-003/sr-003-tickets.yaml`). Waiting for L1 finality is "human-approved/user-specified". The uniform gate for all consequential actions is "human-approved/agent-recommended".
  - **Contrast:** the observation guide splits the two correctly.
- **A-m7. "Final" is missing from the fallback trigger.**
  - **Guide:** "The fallback service may only disclose its committed secret after verifying one exact refund event itself."
  - **Owner:** `architecture.md`, "## Authority And Sources Of Truth", says "verifies the exact finalized Base refund event".
  - **What is wrong:** "finalized" is dropped. The guide nowhere states that the service's trigger needs Base L1 finality. Its finality bullet covers only "the application and its workers".
- **A-m8. The terminal-signing window is not mentioned.**
  - **Guide:** "Only then are the terminal transactions … built and signed …, and the loan becomes active once they are archived."
  - **Owner:** `flow-002-...md`, "## Failure And Reroute": missing terminal signatures or a failed terminal receipt leave "an explicit `terminal-signing-pending` state … It cannot reverse the already-paid principal or confirmed escrow".
  - **What is wrong:** this is one of the residual risks in v1 4.3 (the post-confirmation signing window). It is not an assigned architecture fact, so I record it as Minor.
- **A-m9. The local-demo row of the profile table is weakened.** "What it does not prove" is cut to "Any public deployment or real-provider compatibility". The owner (`architecture.md`, "## Target Outcome And Runtime Profiles") also lists "public funding, or production activation". The Production row partly covers activation.

### A.2 Key facts and distinctions (v1 1.1 plus v2 additions)

| Fact | Status | Note |
| --- | --- | --- |
| A-1 domain separation | Preserved | Login is not a Vault unlock, a command is not a chain fact, and a refund is not recovery: each is stated separately. |
| A-2 one borrower, one lender, no matching, pooling, custody, automatic capital or liquidation | Preserved | |
| A-3 canonical terms plus manifest; not authority | Preserved | "it does not authorize a spend"; "It binds; it never moves value". |
| A-4 Bitcoin consensus authority | Preserved | |
| A-5 Base contracts own funding through refund; everything else provisional | Preserved | |
| A-6 Vault-only secrets; login is ciphertext access only | Preserved | |
| A-7 no collateral key; limited fee wallets | Preserved | |
| A-8 Y path; refund; conditional S; confirmation; gate | Preserved | Both v2 O-16 conditions appear: "For a loan set up with the fallback (none can be until counsel approval and implementation evidence activate it)". |
| A-9 shared Cloudflare failure domain | Preserved | |
| A-10 no live fallback, no RTO/RPO; backups protect data only | Preserved | "no stated recovery time". RPO and cold redeployment are not named (acceptable simplification). |
| A-11 local-demo target; no deployment or activation claims | Preserved | |
| A-12 demo isolation fails closed | Preserved (simplified) | "refuses to start if anything points at a public network or credential". |
| A-13 (v2-amended) conflicts 2h-1, 2h-2, 2h-3 and 2h-5 unresolved | **Weakened** | 2h-1, 2h-2 and 2h-3 carry both sides and their undecided status. 2h-5 lacks the running-loan half (A-M2). |
| A-14 severity words; combinations; one owner | **Weakened** | A-W1. |
| A-15 distinct workspace states | Preserved | "Evidence, not status". |
| A-16 (v2) package holder can broadcast but cannot redirect | **Missing/Weakened** | A-M1. |

Distinctions:
- **2a, 2b, 2e, 2f:** stated in both directions; no prohibited phrasing found.
- **2c:** the refunds are kept apart by context: lender USDC to its fixed recipient, the borrower prefund refund by relative timelock, and the unclaimed-repayment refund.
- **2d:** summary plus gate present.
- **2g:** the claim ladder is present. "Local demonstration … Not yet runnable: it is blocked on pending changes" matches `build/workflow/handoffs/README.md` (row 8 "Blocked — …"). ECVS unavailability is stated.
- **v2 section 5.2 checks:**
  - 2h-5: partial (A-M2).
  - A-16: missing (A-M1).
  - O-16: met.
  - P-6: the guide only says Product "sends narrowly bound requests to participants' Vaults". It does not make the handoff a signing authority, so no defect.
  - B-12: acceptance is summarized as "deliberately reviews and accepts in the Vault" without naming the two confirmations. Nothing is misstated, so I treat it as an acceptable summary.
  - 2g: met.

### A.3 Unresolved points the guide reaches

| Point | Treatment | Assessment |
| --- | --- | --- |
| 2h-1 lender final approval | Side A in the walkthrough and both sides in the list; "Whether these describe different stages or conflict is undecided." | Correct. The Side A citation list omits SCOPE-011 (trivial). |
| 2h-2 package count | 12 versus 18 shown; undecided. | Correct. |
| 2h-3 no qualifying tier | Both sides; not merged with the estimator-outage case. | Correct. |
| 2h-5 beta key | Both sides; undecided. | Correct. The running-loan half is missing (A-M2). |
| 2h-8 on-chain pause | Reported as a tension; no pause is asserted. | Accepted under v2 2h-8. |
| 2h-6 H(S) binding | "the hashes of X, Y and, when committed, S". | Accepted under v2. |
| Activation fee raise (INV-018 versus IFACE-007) | Both sides; undecided. | The quotes check out: `inv-018` "escalating through signed tiers or separately approved CPFP"; `iface-007` "Once an activation or terminal candidate is accepted, it is the sole parent and only CPFP may add fee". Legitimate; not in the key. |
| Relay boundary for the long-stop and cooperative transactions | Both sides; undecided. | Legitimate tension, with A-m2's wording issue. Not in the key. |
| Reservation expiry | Presented as undecided. | The owner scopes it (A-m1). |
| Browser-extension wallet in the local demo | Both sides; undecided. | The tension is real. `cons-026` "## Rule" line 22: "separately proves wallet setup with an installed EIP-1193 extension". `sel-042` line 17: "retained for historical regression … not the current participant journey". `va-003` line 13: "historical regression evidence only". Not in the key. |

### A.4 Verdict (architecture): **FAIL**

Against v1 4.7 as amended:
- Zero Critical defects: met.
- At most one Major: not met (A-M1 and A-M2).
- At least 90% of facts Preserved: not met (13 of 16 = 81%; still 14 of 16 = 87.5% if A-13 is counted as Preserved).
- Reader questions: met. The T13 reader answered A1, A2, A3, A4, A6 and A8 correctly. A5 lacked cooperation, A7 was partial and A9 was not covered, with no dangerous answer.
- The architecture-specific requirements (all four 2h conflicts and the claim ladder) are met only in part, because 2h-5 is incomplete.

Against v2 5.1: A-M1 is a material omitted condition (who may act), so it blocks acceptance. I found no contradiction of an owner that rises to a blocker. A-m1 restates an open question added to a technical record rather than contradicting STATE-001 directly; the coordinator may wish to rule on that.

To pass, the guide needs:
1. A statement that anyone holding a matured default package can broadcast it, but that it pays only the fixed lender destination.
2. The running-loan half of 2h-5.
3. The severity-word rule.

Fixing A-m1 and A-m3 would also be advisable.

---

## Part B — Base Observation And Fallback Review guide

### B.1 Defects

No Critical or confirmed Major defects.

- **B-m1 (Minor; borderline Major under v1 4.3, "Activation" vocabulary collision).**
  - **Guide:** "treating `X` as public and activating the collateral" (normal-case section) and "The finalizer checks the activation gate" (Bitcoin finalization). The fallback sense is explained only afterwards, in the callout: "Counsel approval and implementation evidence must activate it".
  - **Owners:** v1 2d, "Guides also must not conflate this 'activation' of the capability with the Bitcoin 'activation' transaction". `sr-007-...md`, "### From an unclaimed repayment to public S": "It validates the activation gate".
  - **What is wrong:** the guide does not conflate the two senses, but it never says which activation "activation gate" means. The T13 reader listed "activation gate" as undefined. I rate it Minor because the callout immediately after the paragraph supplies the meaning. If the coordinator applies 4.3 literally, this becomes one Major and the guide still passes with a correction note.
- **B-m2. "Eligible loan" is undefined, and the opening paragraphs give no conditions.**
  - **Guide:** "holds a separate secret for each eligible loan" ("Two responsibilities with different jobs"), "for an eligible loan, a public, replayable publication of the fallback secret", and the opening sentence, which describes the fallback with no conditions.
  - **Owner:** SR-007 uses "eligible" too, but its overview defines it ("for loans constructed with this capability").
  - **What is wrong:** both v2 O-16 conditions are stated later, in "When the lender does not claim" and the "Not available yet" callout, so this is not the vague quantifier that v2 makes Major. The T13 reader still flagged "eligible" as never defined.
- **B-m3. A choice's attribution is incomplete.**
  - **Guide:** "keeping displaced events as noncanonical records was the agent's choice."
  - **Owners:** TICKET-0047 attributes that point "agent-chosen". TICKET-0054 (`build/workflow/tickets/base-observation-and-fallback-review/sr-006/sr-006-tickets.yaml`), in the same session, records as "human-approved/agent-recommended": "The watcher hands off append-only observations … marking reorged ones noncanonical". Its evidence: "immutable append-only observation records with noncanonical marking after a reorg … User annotations: 'agree'".
  - **What is wrong:** the guide gives only the agent-chosen origin. The two attribution records differ, and the later one records user approval.
- **B-m4. The double-outage case loses the "shown as delayed" behavior.**
  - **Guide:** "If both healthy providers disagree, or neither can supply usable data, existing final projections stay visible but every new consequential action that depends on Base stops, and operations are alerted after five minutes."
  - **Owner:** `sel-014-...md` line 35, for the dual outage: "show fresh Base data as delayed".
  - **What is wrong:** that one behavior is omitted.
  - **Not a defect: the merged five-minute alert.** TICKET-0053's resolution says "A simultaneous-source disagreement or dual outage preserves existing finalized projections, alerts operations after five minutes". Its agent-chosen attribution says "operations are alerted after five minutes of disagreement or dual outage". SEL-014 line 33 gives no delay for the conflict alert. See D.1.
- **B-m5. The second figure misplaces a check and is incomplete.**
  - **Guide:** step "Finalization" says only "checks S against H(S), inserts it … and submits". Step "Confirmation" is labelled "Only if the escrow is still unspent".
  - **Owner:** `sr-007-...md` places the still-unspent check, with the gate, binding, package, signature and outputs checks, in Bitcoin finalization before submission.
  - **What is wrong:** the prose is correct; the figure moves the unspent check to the wrong step and leaves the other checks out.
- **B-m6. The finalization prose omits two preconditions.**
  - **Owners:** `flow-006-...md`, "## Preconditions": "the matching borrower-recovery package set remains durably recorded ready in the Cloudflare primary archive". TICKET-0038's resolution adds "terminal exclusivity" to the finalizer's checks (also in v1 2d).
  - **What is wrong:** the guide's "the exact retained recovery transaction" covers the archive only in part, and terminal exclusivity is missing.
- **B-m7. "The two timelocked routes signed when the loan was set up" is wrong about timing.**
  - **Owner:** `flow-002-...md` steps 7–8. The lender-recovery and long-stop packages are constructed and signed only after the actual activation winner reaches six confirmations.
  - **What is wrong:** they are not signed at setup.
- **B-m8. O-10 is weakened.**
  - **Owner:** `sr-007-...md`, "### Establishing the capability before a loan exists": "a resolved technical ticket does not satisfy that gate".
  - **What is wrong:** the guide does not say this. Its closing section says "This domain has no unresolved tickets" just before "Gated, not available".
- **B-m9. X is never defined in this guide.** It is first used as "the finalized public `X` and `Y` values" (T13 reader flagged it). Its role can only be inferred from the normal-case gate list.

### B.2 Key facts and distinctions (v1 1.5 plus v2 additions)

| Fact | Status | Note |
| --- | --- | --- |
| O-1 observation reports, fallback discloses; neither arbitrates nor signs | Preserved | |
| O-2 observed and safe are display-only; L1 finality; no exact wait | Preserved | "which Base documents as roughly 20 minutes" matches `sel-013` line 15 ("Base documents that stage as roughly 20 minutes"). |
| O-3 versioned ingestion, cursor after acknowledgement, identical resend, no direct writes | Preserved | |
| O-4 (v2-amended) Alchemy and QuickNode; one healthy source; conflict or outage blocks | Preserved | B-m4. |
| O-5 reorg kept as noncanonical, correction, replay; operator recheck only | Preserved | |
| O-6 Bitcoin needs agreement; one incident; 5 minutes or one block; post-X critical | Preserved | |
| O-7 payment evidence versus finalized event; standalone transfer does not advance the loan | Preserved | |
| O-8 one contracted service; 32-byte per-loan S; no master secret, key, destination or discretion | Preserved | |
| O-9 H(S) before construction and signatures; no retrofit; no rotation | Preserved | |
| O-10 not an operating service; gate; resolved ticket does not satisfy it | **Weakened** | B-m8. |
| O-11 only the finalized refund event; independent checks list | Preserved | The list matches `sr-007` word for word. |
| O-12 publication only makes S usable; separate finalization checks; same transaction; confirmation | Preserved | B-m5 and B-m6 are Minor. |
| O-13 four lookup results; empty is not withholding; product gets metadata only | Preserved | |
| O-14 failure handling; no company release or replacement; refund stays valid | Preserved | |
| O-15 lender at D+3 days, long-stop at D+10 days (does not cancel it), cooperation, first confirmed spend; not default, not a guarantee | Preserved | |
| O-16 (v2) both fallback conditions | Preserved | Fallback section and callout; caveat in B-m2. |

Distinctions:
- **2b, 2c, 2e:** preserved. "a refunded USDC balance is not a completed Bitcoin settlement"; "Publication is not a submission, and submission is not confirmation."
- **2d:** carried in full, apart from B-m6.
- **2g:** "The fallback is a selected technical design, not an operating service". "The Base observation worker was built in an earlier delivery … later changes … not yet executed, and no deployment or production operation is claimed" matches the handoffs README ("Implemented" rows are "historical deliveries"; "Core remains an unexecuted delta").
- **v2 section 5.2 checks:**
  - A-16: met ("The lender, or anyone holding the exported package, can broadcast it").
  - O-16: met.
  - The guide does not reach 2h-5, P-6 or B-12.
- **v2 P-9:** the payment probe policy is stated correctly: "probes at 0, 15 and 60 seconds and must escalate at 180 seconds". Escalation is not equated with blocking.

### B.3 Unresolved points the guide reaches

| Point | Treatment | Assessment |
| --- | --- | --- |
| 2h-3 no qualifying tier (reached through recovery fee selection) | "an unresolved conflict between the Bitcoin owners: one statement selects the 200 sat/vB variant … another selects nothing and fails closed". | Correct, with both sides, and not merged with estimator outage. Applying it to recovery variants is supported, because IFACE-007 ACT-002 covers "A current package". |
| 2h-4 FLOW-005 omits the long-stop | The guide includes the long-stop, following SR-007. | Correct. |
| Relay boundary for the long-stop | Not reached. The guide says nothing about which relay boundary carries the long-stop. | No issue. |
| Domain's own conflicts | "This domain has no unresolved tickets and no recorded source conflict of its own." | True of the records: TICKET-0036, 0037, 0053 and 0054 are finished, and TICKET-0045 is out of scope. The B-m3 attribution divergence is an unrecorded disagreement. |

### B.4 Verdict (observation): **PASS**

- No Critical defects.
- No confirmed Major. B-m1 is borderline; if it is ruled Major, the guide passes with a correction note.
- 15 of 16 facts Preserved (94%), none Contradicted.
- The T13 reader answered all 8 questions in line with the Expected answers, with no dangerous answer.
- No v2 5.1 blocker confirmed: no contradiction of an owner, and no material omitted condition.

---

## Part C — Technical-record changes seen while verifying (not a full technical-diff review)

A `diff -r` against `pre/` shows that only `README.md`, `system-model/architecture.md`, the five `domain.md` files, `sr-001-...md` (a link only) and `visuals/assets/*.json` changed.

- **Narrative removed by the migration.** The narrative sections are gone ("## System Overview", each "## Domain Overview"). For the facts these guides rely on, I found surviving owners:
  - finality wording in SEL-013;
  - the refund-recipient switch in FLOW-005;
  - "no collateral key or sale authority" in SCOPE-002 ("Must Not Be Inferred");
  - the missing-Y trigger exclusions in IFACE-017 and SR-007.
- **New open questions added to records.** Each quotes its sources accurately:
  - `architecture.md`: approval.
  - `base-usdc-settlement-and-funding/domain.md`: pause and beta key.
  - `bitcoin-authorization-and-recovery/domain.md`: package count, fee, relay, activation fee raise.
  - `participant-access-and-loan-operations/domain.md`: approval, extension wallet, reservation expiry.
  - `loan-terms-and-commitments/domain.md`: approval.
- **Reservation-expiry note.** v2 rates recording reservation expiry as a source conflict a Minor process defect, because STATE-001 already scopes it.
- **2h-5 is only half recorded.** The beta-key open question in the settlement domain record omits the running-loan tension.
- **Not checked.** I did not check the new "Choices And Rationale" bullets in the loan-terms and participant domain records line by line against their tickets.

---

## Part D — Where the answer key is wrong or incomplete

1. **The v2 O-4 amendment is not supported as written.** v2 says SEL-014 alerts operations after five minutes only for a dual outage, and calls a merged single alert time a Minor defect. SEL-014 line 33, on conflict, gives no delay. TICKET-0053's resolution and its agent-chosen attribution give five minutes for "disagreement or dual outage" alike. The real difference between the two cases is that only the outage shows fresh Base data "as delayed". Proposed v3: drop "one alert time" from the Minor defect and keep the "delayed" display distinction.
2. **Missing tensions that the records now carry and that I verified in the quoted sources.** v3 candidates:
   - activation fee raise (INV-018 versus IFACE-007 line 25);
   - relay boundary for the long-stop and cooperative transactions (IFACE-008 line 15 versus FLOW-010 step 2, SEC-025, IFACE-019 and FLOW-009 step 5);
   - extension-wallet proof in the local demo (CONS-026 line 22 and SEL-037 line 35 versus SEL-042 line 17, SEL-043 and VA-003 line 13).
3. **A missing attribution divergence.** The noncanonical-retention choice is "agent-chosen" in TICKET-0047 but "human-approved/agent-recommended" in TICKET-0054. A guide that states either origin alone is incomplete. The key should say which wording it accepts.
4. **A-16 severity.** v2 adds A-16 without a severity. Omitting it changes who may act (v1 4.3), and the T13 reader's Q-A9 answer shows the effect. Proposed v3: state that omission is Major.
5. **2h-5 omission severity.** v2 states the consequence of resolving 2h-5 (Critical) but not of omitting one half of it. Proposed v3: make an omitted half Major, and say whether it fails the architecture's mandatory-conflicts requirement in 4.7.
6. **O-2 source.** v1 cites "not a promise of an exact waiting time" from the removed observation narrative. No surviving owner says this; SEL-013 says "roughly 20 minutes". Guides that give "roughly 20 minutes" with the Base-documentation attribution should be accepted.
