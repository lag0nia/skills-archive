# T10 review: architecture guide and Base Observation And Fallback Review guide

Reviewer: independent fidelity review. No file in the package was changed.

- Package under review: `scratchpad/eval/snap-t10/bitrise21/loan-system/design/technical-design` (called "snap" below).
- Pristine copy: `scratchpad/eval/pre/bitrise21/loan-system/design/technical-design` (called "pre").
- Guides reviewed: `guide/architecture.md` (141 lines) and `guide/domains/base-observation-and-fallback-review.md` (131 lines). Line numbers below refer to these files.
- Criteria: v1 key part 4 plus v2 part 5. Checklist: v1 parts 1 and 2 plus v2 parts 2 to 4. Each claim was checked against the snap owner, and against pre where the migration changed the owner.

## Verdicts

| Guide | Critical | Major | v1 4.7 | v2 5.1 blockers | Verdict |
| --- | --- | --- | --- | --- | --- |
| Architecture | 0 confirmed (A-3 and A-4 below are arguable Criticals) | 6 | Fails: more than one Major; about 10 of 16 facts preserved; one 2h conflict (2h-5) is incomplete | Yes: contradictions of owners in prose, a figure caption and a table | **FAIL** |
| Base Observation And Fallback Review | 0 | 1 (vocabulary collision) | Passes with a correction note: one Major; 16 of 16 facts preserved or only minorly weakened; 8 of 8 reader questions answerable | None confirmed | **PASS, conditional on a correction note** for the "activation gate" wording |

In the review below, "Owner" quotes come from snap unless marked pre.

---

## Part A — Architecture guide (`guide/architecture.md`)

### A.1 Defects

**A-1. H(S) is said to be fixed in every agreement (Major; acceptance blocker: contradicts an owner).**
- Guide, line 19: "The loan is protected by three secrets whose hashes are fixed in the agreement before anything is signed." Line 13 adds: "may hold a fallback secret for some loans once it is approved for production."
- Owners:
  - `system-model/domains/loan-terms-and-commitments/responsibilities/sr-001-…md`, "## Owns": "Conditional `H(S)` is present only for loans created with the approved capability."
  - `system-model/contracts/states/state-007-ecvs-s.md`, "## States": "Production unavailable | No approved operational ECVS publication capability exists for new loans."
  - `system-model/contracts/security/sec-024-…md`, "## Honest Capability Claim": "for every loan without an activated `H(S)` capability".
- What is wrong:
  - Line 19 states that every loan carries H(S). Today no loan may commit it. This is the defect that v2 2h-6 keeps ("Stating that every loan carries H(S) stays a defect").
  - Line 13's "some loans" is the vague quantifier that v2 part 4 (O-16) classes as Major, because it stands in for the condition that H(S) was committed when the loan was created.
  - The guide also contradicts itself. Line 89 correctly says "X, Y and, where used, S".
- Arguable Critical: read with line 19's "can complete that same return transaction", the passage suggests the fallback exists for every loan (v1 4.2 availability overclaim). Lines 13 and 108 qualify it, which is why this review grades it Major.

**A-2. Readiness and guarantee language in the lead (Major).**
- Guide, line 3: "Its guarantee is that every step on either chain happens only through an authority that already agreed to it, and that the application never reports an outcome a chain has not actually produced."
- Owners:
  - No owner states a guarantee.
  - `build/records/verification/va-001…va-004`: "**State:** `Planned — unverified`".
  - `system-model/architecture.md`, "## Target Outcome And Runtime Profiles": the claim ladder makes no claim beyond the target outcome.
- What is wrong: the guide invents a guarantee for a design whose verification is unverified. This breaks v1 4.6, which says not to invent guarantees and bars "guaranteed" unless an owner qualifies it that way. The lead summary is the passage most readers see, and 4.1(5) reads it strictly.

**A-3. Figure caption: the Base claim "releases" the Bitcoin (Major; acceptance blocker: contradiction in a figure; arguable Critical status collapse).**
- Guide, line 78, caption: "The lender's claim on Base is what releases the borrower's Bitcoin."
- Owners:
  - `system-model/architecture.md`, "## Authority And Sources Of Truth": "Base records cannot spend or confirm Bitcoin."
  - "## Cross-Domain Boundaries": "Base facts and public secrets never sign, redirect, broadcast, or confirm Bitcoin by themselves."
  - `flow-004`: recovery is final only on confirmation.
- What is wrong: the caption collapses "the Base claim makes Y public" into "the Bitcoin is released". This is the "Base releases the collateral" wording that S-1 forbids. The figure's own step 4 ("final only when that transaction confirms") softens it, but a caption is read on its own (4.1(5)).

**A-4. Runtime-profile table header turns the target claim into a current claim (Major; acceptance blocker: contradicts the VA status records; arguable Critical status collapse under v2 part 4 "2g extended").**
- Guide, line 118: the column header is "What it may claim now". Row: "Deterministic local verification | Verification only: …".
- Owners:
  - `system-model/architecture.md`, "## Target Outcome And Runtime Profiles": the column is "Target-version claim".
  - `build/records/verification/va-001-…md`: "**State:** `Planned — unverified`". Its Limitations add that passing it "proves verification only".
- What is wrong:
  - The guide qualifies the local-demo row ("once built") but not the verification row, so a reader learns that verification is claimable now.
  - Nothing in the guide says the verification capabilities are planned and unverified (2g "Recorded current status").
  - Line 125 says components are "recorded as implemented", but not that their verification is outstanding.

**A-5. Upgrade-governance conflict (2h-5) stated only in part (Major).**
- Guide, line 139: "how the single upgrade key used during the short public main-network beta fits the deployment state record's ban on an unrestricted single upgrade key". The guide places this among points "not recorded as conflicts, because the records may be read in a way that reconciles them".
- Owners:
  - `build/records/selections/sel-009-…md`, "## Selected Or Inherited Direction": the "dedicated single upgrade key … short public mainnet beta", and "A compatible approved upgrade becomes the one current code path for every loan held by the proxy."
  - `system-model/contracts/invariants/inv-020-base-upgrade-boundary.md`, "## Rule": "V1 retains the Transparent ProxyAdmin controlled by a 2-of-3 Safe through a seven-day timelock … existing loans remain on their originating contract and are not silently migrated."
  - `state-019`, "## States": "Upgraded for permitted scope | … without migrating originating loans."
- What is wrong:
  - The guide takes side A's premise as fact: a single key *is* used during the beta.
  - It represents side B only by STATE-019's ban. It omits INV-020's and SR-003's statement that V1 retains the Safe and timelock.
  - It omits the second half of 2h-5 entirely: what an upgrade does to running loans.
  - It calls the matter reconcilable, which v2 classifies as a conflict.
  - v2 makes 2h-5 one of the four conflicts the architecture guide must carry. Because the guide does call the point undecided, this is graded Major, not Critical.

**A-6. Package-holder broadcast fact missing (A-16 / Q-A9) (Major: a reader's dangerous answer traces to the guide).**
- Guide, line 107: "The company does not broadcast it; the lender exports and broadcasts it manually." Line 108: "exposed to the lender's default route".
- Owner: `system-model/contracts/security/sec-025-…md`, "### SEC-025.THREAT-001": "a random package thief cannot redirect value but may collude, extort, or sabotage". "## Prohibited Authority": "the package holder may not redirect the fixed payout".
- What is wrong:
  - The guide never says that anyone holding a matured default package can broadcast it.
  - Line 107 points a reader toward the dangerous Q-A9 answer, "it cannot be broadcast without the lender".
  - The fixed-destination half survives only through line 20's general statement.

**A-7 to A-18. Minor defects (recorded; they do not fail the guide on their own).**

- **A-7.** Line 112 says each analysed combination has one primary record "rather than a severity label". It omits the A-14 rule from "## Security Change Control": "A component is not secure merely because each credential appears insufficient in isolation when a realistic combination of capabilities is sufficient". It also omits what an analysis must state. A-14 is Weakened; Q-A7 is answerable only in part.
- **A-8.** Line 108, "For loans built after the fallback service is activated, the service may publish S", follows INV-025's wording. It does not name the committed-H(S) condition, which matters because IFACE-017 makes H(S) optional for new loans ("may a newly constructed loan replace…"). This is the remaining half of the O-16 condition; A-1 carries the main defect.
- **A-9.** Line 109, "Disagreeing or unavailable sources block dependent actions", merges the Base and Bitcoin rules. For Base, one unavailable provider does not block anything; only a dual outage or a disagreement does (`sr-006`, "## Owns"). The guide never states the one-healthy-provider rule.
- **A-10.** Line 131, "adds roughly 20 minutes", drops SEL-013's and the domain record's qualifier: "it is not a promise of an exact waiting time".
- **A-11.** Line 137 assigns the breakdown "(six borrower recovery, six lender default)" to both twelve-count sources. Only CONS-014 gives that breakdown ("six-normal/six-default"); SR-002's sentence says only "12-package signed terminal phase".
- **A-12.** Lines 20 and 108 present cooperative settlement as a live route ("may still win"). SCOPE-005, "## Boundary", says the signing-session UX, Base accounting and runbooks are deferred, so it "is not yet an end-to-end operational capability". The deferral is not mentioned.
- **A-13.** A-15 is Weakened. The guide keeps "an accepted command is not a chain fact" and "submitted … stay provisional". It never names the separate observed, finalized, broadcast and confirmation-qualified states (`state-016`, "## Observation And Finality").
- **A-14.** A-12 is Weakened. Line 125 omits the non-loopback bind, and the rule that demo identities, tokens and fixtures exist only inside the local-demo composition.
- **A-15.** Line 110's outage list omits the operator surface. A-10 is only partly explicit: it never says "no live cross-provider fallback, no active-active deployment, no guaranteed cold redeployment".
- **A-16.** Line 71, "the first approves a review of the non-secret facts", does not say what the first confirmation permits (local preparation only) or that an isolated worker then freezes the bytes (B-12, v2 5.2). The same line's "The application never receives X" is ambiguous, because line 73 has the Bitcoin domain consuming public X.
- **A-17.** A-2 is Weakened: the guide never says V1 does not liquidate Bitcoin.
- **A-18.** Line 35, "The only way a Base fact can move Bitcoin is a finalized public secret", overstates the rule. The automatic prefund-refund relay also depends on the finalized Base state having no accepted X (`iface-008`, "## Preconditions And Validation"). In addition, S is not a Base fact.

### A.2 Key facts and distinctions (architecture)

**Facts A-1 to A-16:**

| Status | Facts |
| --- | --- |
| Preserved | A-1, A-3, A-4 in prose (but see defect A-3 for the caption), A-5, A-6, A-7, A-9, A-11 |
| Weakened | A-2, A-8 (defects A-1 and A-8), A-10, A-12, A-13 (2h-5 partial), A-14, A-15 |
| Missing | A-16 |

- Preserved rate: about 10 of 16, even counting A-2 and A-10 as preserved. This is below 90%.
- Nothing is contradicted in the body text. However, line 19 contradicts SR-001's H(S) fact, which v1 assigns to Loan Terms and which applies here through v2 2h-6.

**Distinctions:**

| Distinction | Status |
| --- | --- |
| 2a | Present (lines 18 and 96) |
| 2b | Present (line 95) |
| 2c | Present: the three refunds are kept apart (lines 105 and 108) |
| 2d | Summary and gate present, but see defects A-1 and A-8 |
| 2e | Present (line 108: "publication is not recovery") |
| 2f | Present (lines 71 and 97) |
| 2g | Claim ladder present but mislabelled (defect A-4); recorded VA statuses absent |

**Vocabulary collisions:**
- "Activation" is used for both the Bitcoin transaction and the fallback's production activation (lines 13, 106 and 108). Context mostly separates them. Minor.
- The "acceptance" meanings are separated adequately.

**Reader questions:**

| Result | Questions |
| --- | --- |
| Answered correctly | Q-A1, Q-A2, Q-A3, Q-A5, Q-A6 (minus the running-loan half of 2h-5), Q-A8 |
| At risk | Q-A4: "verification is claimable now" (defect A-4) |
| Partial | Q-A7 |
| Partial, with a dangerous answer traceable to the guide | Q-A9 |

### A.3 Unresolved points the guide reaches

| Point | Guide | Assessment |
| --- | --- | --- |
| 2h-1 approval wording | Callout at line 56 and line 136 | Both sides, with sources. These match the migrated `architecture.md`, "## Purpose And Binding": STATE-010 and the FLOW-001 precondition on side A; STATE-001, STATE-002, FLOW-001 step 4 and SR-001 on side B; SR-001's partial reconciliation; "has not been decided". The figure step "whether the lender approves them again is open" is acceptable. Pass. |
| 2h-2 package count | Lines 73 and 137 | Both sides, marked undecided. The guide follows the snap Bitcoin domain record, which now says "The difference is whether the six borrower long-stop packages belong to the archived terminal phase. This record chooses neither reading." Pre said: "A stale SR-002 archive sentence … remains for a separate repair." See Part C-2. Line 108 then states as settled that "Every newly built escrow also has a borrower long-stop route". That is consistent: CONS-027 settles the route, and the open question is only the archive phase. Pass, apart from the Minor defect A-11. |
| 2h-3 no qualifying fee tier | Line 137 | Both sides, kept apart from estimator outage. Pass. |
| 2h-5 upgrade governance | Line 139 | Incomplete (defect A-5). |
| 2h-7 who may reveal X/Y | Lines 66 and 80 ("the borrower's Vault reveals X", "the lender's Vault reveals Y") | The guide never says *only* the Vault-derived caller can. Line 139 reports a related but different tension (IFACE-014 ACT "authorizes the injected/external Base wallet to sign and submit"). Acceptable. |
| 2h-8 on-chain pause | Line 139 | Reported as an undecided tension. Accepted. |
| Other open points (browser-wallet acceptance; cancellation after commitment; relay scope) | Lines 138 and 139 | Verified against the participant `domain.md` conflict note (CONS-026 vs SEL-043/VA-003), the `sr-001-tickets.yaml` resolution "either role can cancel before Bitcoin or USDC action" vs `state-002` "Cancelled … before dependent setup", and `iface-008` "## Boundary" vs FLOW-010 step 2. All accurate. |

### A.4 Verdict (architecture): **FAIL**

- **v1 4.7:**
  - Six Majors against a limit of one.
  - Fact preservation below 90%.
  - The architecture-specific rule (all four conflicts) is not met, because 2h-5 lacks the Safe/timelock side and the running-loan effect.
- **v2 5.1 blockers:**
  - Contradictions of owners: line 19 (SR-001 and STATE-007), the line 78 caption (`architecture.md` authority), and the line 118 header (VA records).
  - Material omissions: the 2h-5 half, and the A-16 package-holder risk.
- **Corrections needed:**
  1. Make H(S) conditional at line 19 and replace "some loans" at line 13.
  2. Remove "Its guarantee is".
  3. Recaption figure 3, for example: "The lender's claim makes Y public; the Bitcoin returns only when the borrower's recovery confirms."
  4. Restore "Target-version claim" and state the VA "Planned — unverified" status.
  5. Give 2h-5 both sides, including INV-020's Safe/timelock retention, and the running-loan effect (SEL-009 vs INV-020/STATE-019).
  6. Add SEC-025's package-holder sentence.
  7. Fix the Minors listed above.

---

## Part B — Base Observation And Fallback Review guide (`guide/domains/base-observation-and-fallback-review.md`)

### B.1 Defects

**B-1. "Activation gate" left ambiguous (Major under v1 4.3, vocabulary collision; not a v2 5.1 blocker).**
- Guide, line 85: "Bitcoin finalization … then makes its own checks: the activation gate, the publication and event binding, …"
- Owners:
  - `sr-007-…md`, "### From an unclaimed repayment to public S", uses "activation gate" to mean the ECVS production-activation gate.
  - `system-model/contracts/invariants/inv-002-activation-gate.md` is titled "Activation Gate" and governs the Bitcoin acceptX/activation gate.
- What is wrong:
  - The guide uses "activation" for the Bitcoin activation transaction (figure step "Acted on … pre-signed activation", line 38) and for the fallback's production activation (lines 9, 73, 88 and 123), and never says which one line 85 means.
  - v1 2d says guides "must not conflate this 'activation' of the capability with the Bitcoin 'activation' transaction".
  - v1 4.3 lists exactly this collision.
- Correction: line 85 should read "the fallback's production-activation gate".

**B-2 to B-11. Minor defects.**

- **B-2.** Line 49 merges the conflict case and the dual-outage case under one five-minute alert: "Both providers unavailable, or two healthy providers disagree. … operations are alerted after five minutes".
  - `sel-014-…md`, "## Selected Or Inherited Direction", separates them. A disagreement is a `base-observation-conflict` that alerts operations "until canonical replay resolves it". Only "neither source can supply usable data" carries "alert operations after five minutes".
  - v2 part 3 grades this Minor.
  - Note: `build/workflow/decision-overview.md` (TICKET-0053, Agent-chosen) itself says "operations are alerted after five minutes of disagreement or dual outage", so the merger has a workflow-record source (see D-2).
- **B-3.** Line 65: "the repayment event reaches L1 finality before the deadline D". The owners say "no later than D": `flow-005`, "## Preconditions", and `inv-006`, "## Rule", "finalized for exactly the debt no later than `D`". The passage is labelled illustrative, so it narrows the window without stating a wrong rule. Minor.
- **B-4.** Line 85's list of Bitcoin-finalization checks omits:
  - terminal exclusivity;
  - the package checksum and raw witness script;
  - that the matching package set must still be "durably recorded ready in the Cloudflare primary archive" (`flow-006`, "## Preconditions");
  - the step "select an existing fee candidate" (`sr-007`).

  These are byte-level or ordering details (v1 4.4).
- **B-5.** Line 92's non-trigger list omits "balance" (IFACE-017, "## Preconditions And Validation": "A raw USDC transfer, balance, elapsed time, absent claim, or missing `Y` is not equivalent"). Line 107 in the authority list does cover balance.
- **B-6.** Line 98, "Both participants may also agree to a cooperative settlement", omits SCOPE-005's deferral of the operational signing session and the Base accounting.
- **B-7.** Line 96 cites the default route with its fixed destination. It does not say that anyone holding the matured package can broadcast it (A-16/B-16, v2 5.2). The no-redirection half is present.
- **B-8.** Line 59: "only the local profile, with one local Base node and no such claim, is selected now".
  - `state-021`, "## Observation And Finality", and `iface-022` line 77 say only that the public quorum "is deferred and is not a local-demo prerequisite".
  - "is selected now" slightly extends that.
- **B-9.** Line 7, "which the system spends only through transactions the borrower and lender signed in advance", attributes the spending to "the system". The lender's default route is broadcast externally by the lender (SCOPE-001), and no route is jointly signed except the cooperative one. This is wording only.
- **B-10.** Line 13 lists "a refund" among events without saying which one. SR-006 observes three refund-type events: unclaimed-repayment, funding-expiry and unaccepted refund. Later sections use the term precisely.
- **B-11.** Line 127, the delivery status ("recorded as implemented in an earlier delivery slice, with later corrections still pending"), is accurate against `build/workflow/handoffs/README.md`: row 3 is `Implemented`, and the BU-007 generated-client delta is pending. It does not add that the verification capabilities are "Planned — unverified". Minor under the 2g status rule, because the guide does not claim verification.

**Checked and found faithful:**

| Guide passage | Owner |
| --- | --- |
| Finality definitions and "roughly 20 minutes" attributed to Base (line 14) | SEL-013 "Base documents that stage as roughly 20 minutes" |
| Observation identity and pinned-value rejection (line 41) | SEL-015 |
| Ingestion answers "stored"/"already recorded", the cursor rule, tail reread, and `getLoan` used only as a diagnostic (line 43) | SEL-015, IFACE-012 |
| Providers, retry capped at one minute, automatic promotion (line 47) | SEL-014 |
| Reorg handling and operator limits (lines 50–51) | SR-006, "## Failure And Recovery" |
| Bitcoin observer pairs, incident rules, and post-X critical treatment (line 57) | SR-006 |
| Payment probe times and exact-evidence list (line 59) | SR-006, "## Owns" |
| C = D + 172,800, recipient switch, permissionless refund, indefinite availability, exclusivity, independence from the ECVS (lines 71 and 77) | FLOW-005, INV-007 |
| 32-byte per-loan S, no master secret, no early receipt or command (line 81) | SR-007 |
| The ECVS's own checks, publication with evidence, four lookup outcomes, metadata only (line 83) | SR-007, IFACE-017 ACT-002 |
| Same transaction, no fresh signature, three separate steps (line 85) | IFACE-017 "## Payload Or Artifact", FLOW-006 |
| The gate callout, including "a resolved design question does not satisfy that gate" (line 88) | SR-007: "a resolved technical ticket does not satisfy that gate" |
| Failure handling, same-S replay, no replacement S, early-disclosure danger (line 92) | SR-007, "### When the path fails" |
| T and B timing, long-stop does not cancel the lender route, first confirmation wins (lines 96–97) | INV-008, CONS-027 "Every newly constructed canonical escrow" |
| Residual risk with both fallback conditions (line 100) | SEC-024 "## Honest Capability Claim" |
| Authority list (lines 104–112) | SR-006 "## Must Not Own", IFACE-017 "## Must Not Imply" |
| Attributions (lines 117 and 119) | Decision overview: TICKET-0053's revised single-source policy was user-approved, its timings Agent-chosen; for TICKET-0037, the independent contracted service is User-specified, its powers Agent-recommended and human-approved, and the counsel gate Agent-chosen |
| Scope items (lines 124–126) | SCOPE-009, SCOPE-001, SCOPE-002 |

### B.2 Key facts and distinctions (observation)

**Facts O-1 to O-16:**

| Status | Facts |
| --- | --- |
| Preserved | O-1, O-2, O-3, O-5, O-6, O-7, O-8, O-9, O-10, O-11, O-13, O-14, O-15, O-16 (line 73 "Only for a loan built with the activated capability"; line 100 "every loan without an activated fallback, and even with one until an S recovery actually confirms") |
| Preserved, Minor | O-4 (merged alerts, defect B-2); O-12 (fee-tier selection and archive condition omitted, defect B-4) |

The preserved rate is 16 of 16 (two with Minor notes), and nothing is contradicted.

**Distinctions:**

| Distinction | Status |
| --- | --- |
| 2b | Present (lines 41, 59 and 107) |
| 2c | Present: line 68 caption, and line 100 "a refunded USDC balance is not complete Bitcoin settlement" |
| 2d | Present in full, apart from Minor defects B-4 and B-5; activation condition (line 88), prior commitment (line 81), per-event prerequisites (lines 65–77 and 85), non-triggers (line 92), and both check lists (lines 83 and 85) |
| 2e | Present (line 85) |
| 2g | ECVS availability (lines 9, 22, 88 and 123) and delivery status (line 127) present |
| v2 5.2: O-16 | Present |
| v2 5.2: A-16 | Partial (defect B-7) |
| v2 5.2: 2h-5, P-6 and B-12 | Not reached |

**Reader questions:** Q-O1 to Q-O8 are all answerable from the guide. Q-O3 carries the Minor B-2 merger, and Q-O7 lacks "selects an existing fee tier". The result is 8 of 8, with no dangerous answer traceable to the guide.

### B.3 Unresolved points the guide reaches

- Line 129, "No unresolved source conflict is recorded for this domain.", is true of the snap domain record.
- **2h-6 (where H(S) sits).** Line 81 says H(S) "is written into the loan and into the Bitcoin recovery script". v2 accepts the conditional-binding treatment, and the guide conditions it ("For each loan built with the capability").
- **2h-7.** Lines 15 and 69 say the lender "reveals Y" without stating who may call. Acceptable.
- **SEL-014 vs decision overview on alert timing.** Not flagged by any owner. The guide follows the merged reading (defect B-2).
- **Public payment-evidence profile vs the one-healthy-provider Base rule.** These are different scopes (payment-ambiguity reconciliation vs lifecycle observation), not a conflict, and the guide keeps them apart (lines 47 and 59).
- **Steps narrated for other domains.**
  - The acceptance example (lines 30–38) and the claim, refund and recipient-switch steps (lines 69–77) carry no open questions beyond 2h-7.
  - The long-stop narrative (line 97) is consistent with the 2h-2 framing, because only the archive phase is in question.

### B.4 Verdict (observation): **PASS, conditional on a correction note**

- Zero Critical defects.
- One Major (B-1, "activation gate"), which v1 4.7 allows with a correction note.
- At least 90% of facts preserved, none contradicted, and 8 of 8 reader questions answerable.
- No v2 5.1 blocker: no contradiction of an owner was found, and no 4.3 omitted condition or residual risk.
- Correction note: name the production-activation gate at line 85, and separate the two alert rules at line 49.

---

## Part C — Technical-record changes noticed while verifying (outside the two guides, but relevant to v2 5.1)

`diff -rq pre snap` shows changes to:
- `README.md`;
- `system-model/architecture.md`;
- the five `domain.md` files;
- `sr-001`;
- `visuals/assets/explorer.json` and `visuals/assets/sources.json`.

Everything else, including every contract, flow, SR-002, SR-006, SR-007 and every build record, is byte-identical. Most changes remove narratives and add guide links, as v2 part 1 anticipates. Three changes alter meaning:

**C-1. Base domain record rewrites one side of 2h-5 (unauthorized technical change; v2 5.1 blocker for the run).**
- Pre `base-usdc-settlement-and-funding/domain.md` line 35: "the main contract retains its explicit Transparent Proxy administration, 2-of-3 Safe, seven-day timelock".
- Snap, "## Choices And Rationale", now records SEL-009's side A as the domain's choice: "Main contract uses one Transparent ProxyAdmin ownership path: 'a dedicated single upgrade key for local/test and the intentionally short public mainnet beta, followed by transfer …'". It cites INV-020 as support, although INV-020 holds side B.
- No conflict note was added.
- v2 2h-5 says: "Changing any record on either side to match the other is an unauthorized technical change."
- The architecture guide's framing at line 139 follows this rewrite.

**C-2. Bitcoin domain record recharacterizes 2h-2.**
- Pre `bitcoin-authorization-and-recovery/domain.md`: "A stale SR-002 archive sentence still says twelve terminal packages; this documented source conflict remains for a separate repair."
- Snap, "## Choices And Rationale": "Unresolved source conflict: … The difference is whether the six borrower long-stop packages belong to the archived terminal phase. This record chooses neither reading."
- The snap record adds a real second twelve-count source that pre and the key missed: `build/records/constraints/cons-014-durable-signed-exit-package-archive.md` ("must construct only that parent's six-normal/six-default terminal phase", unchanged from pre).
- The owner's judgment changes, from "stale, awaiting repair" to "open, neither chosen". The coordinator should decide whether that change is authorized. The guide follows the snap wording faithfully.

**C-3. Architecture record.**
- The pre "## System Overview" paragraph is removed, including "Existing approval-wording and fee/count discrepancies … remain unresolved".
- An explicit approval conflict note is added, with STATE-010 and the FLOW-001 precondition as additional side-A sources.
- The fee and count notes now live only in the Bitcoin domain record.
- This is not a meaning change, but the architecture record no longer mentions the fee and count conflicts (v2 part 1, A-13).

---

## Part D — Answer-key errors and gaps found

- **D-1. v1 2h-2 misses CONS-014.** CONS-014 is a second source for the twelve-package terminal phase ("six-normal/six-default"). It exists in pre. The key's statement that only SR-002 holds the stale value is incomplete. The key also treats "stale" as the settled characterization, which the snap owner no longer uses (C-2).
- **D-2. v2 part 3 (O-4) treats the merged alert as a guide simplification.** The decision overview's TICKET-0053 entry (Agent-chosen) states the merged rule: "operations are alerted after five minutes of disagreement or dual outage". SEL-014 splits it. This is a SEL-014-vs-workflow-record discrepancy that neither the key nor any owner flags. The Minor grade stays appropriate, because SEL-014 is the selection owner.
- **D-3. v1 2h-1 Side A omits two sources** that the owners now cite: the FLOW-001 precondition ("its publication is standing acceptance") and STATE-010, "## Invalid Transitions" ("second lender approval"). FLOW-001 therefore sits on both sides.
- **D-4. The key does not record three further tensions** that the snap owners now flag or that are verifiable:
  - CONS-026 vs SEL-043/VA-003 on browser-extension wallet acceptance (snap participant `domain.md`; not in pre).
  - `sr-001-tickets.yaml` "either role can cancel before Bitcoin or USDC action" vs `state-002` cancellation "before commitment" / "before dependent setup".
  - IFACE-008 restricting the relay to activation, normal recovery and automatic refund, while FLOW-010 step 2 (long-stop) also requests relay.
- **D-5. v2 2h-7 cites IFACE-014 line 104 (Vault-derived caller).** The same interface's ACT at line 49 still describes "the injected/external Base wallet" signing and submitting. This is a third reading the key omits.
- **D-6. v1 0 names `t0` as the source root.** This review used `pre`; v2 states they are byte-identical. v1's citations of removed narratives were handled under v2 part 1.
