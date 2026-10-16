# T7 Review A: semantic fidelity of three System Guides

## Scope and method

- **Guides reviewed:** `guide/architecture.md`, `guide/domains/loan-terms-and-commitments.md`, and `guide/domains/participant-access-and-loan-operations.md`. All are under `snap-t7/bitrise21/loan-system/design/technical-design/`.
- **Truth source:** the snap-t7 technical records (`system-model/`, `build/`, `ui-ux/`, tickets). I checked every claim against the owner record myself, not against the key.
- **Pre-migration copy:** `pre/...`. It is byte-identical to the key's source root `t0/...` (`diff -rq` shows no differences). The migration changed these files:
  - `README.md` and `system-model/architecture.md`;
  - all five `domain.md` records;
  - `SR-001` (one pointer sentence only);
  - two visuals data files.
- **Review criteria:** answer key part 4, used as written. Parts 1 and 2 serve as the checklist.
- **Line numbers** below refer to the snap-t7 guide files.

## Verdict summary

| Guide | Critical | Major | Facts Preserved | Questions answered fully | Verdict |
| --- | --- | --- | --- | --- | --- |
| Architecture | 0 | 2 | 12/15 (80%) | 6/8 | **FAIL** (two Majors; below 90%) |
| Loan Terms And Commitments | 0 | 1 | 11/15 (73%) | 7/8 | **FAIL** (below 90%; the single Major needs a correction note) |
| Participant Access And Loan Operations | 1 | 2 | 10/15 (67%), one partly Contradicted | 6/8 | **FAIL** (Critical; two Majors; Contradicted fact; below 90%) |

Two issues cut across guides:

1. **An invented or overstated "payment account as recipient" conflict.** The Architecture and Loan Terms guides both present it as an open conflict. It enters through a bullet the migration added to the Loan Terms domain record. The canonical owners settle the rule.
2. **The approval-wording conflict.** The Architecture and Loan Terms guides carry both sides correctly. The Participant guide states one side as settled.

The guides are otherwise close to their owners, and most defects are small, local fixes. The strict 90% preservation rule is what fails Loan Terms.

---

## 1. Architecture guide (`guide/architecture.md`)

### 1.1 Defects

**AR-1 — Major: a conflict that does not exist in the owners, and a misattributed position.**
- **Guide, l.73:** "Whether it may be chosen as a recipient for a new loan is an open conflict: the origination flow allows it for a recoverable account with fresh approvals and a disclosure of its separate transfer function, while the architecture record and the lender authorization record say it is never a term-bound recipient."
- **Guide, l.143:** "One set of records allows a Vault payment account as a recipient for a new loan under conditions; another says it is never a term-bound recipient."
- **What the owners say:**
  - `system-model/architecture.md`, "## Purpose And Binding": "A participant Vault payment account is a separate public source-of-funds identity; selecting it as a fresh loan's existing recipient field requires fresh approval and does not rewrite historical terms."
  - `contracts/interfaces/iface-022-...md`, "## Boundary": "It is a custody identity, not itself a LoanTerms recipient field: its public address may equal a role-defined recipient value only when a fresh loan explicitly selects that existing field and the required participant approvals bind the value."
  - `iface-022`, line 161: "...permitted only when the participant owning that address is authorized for that role, the UI discloses the separate participant-transfer scope, and fresh participant approvals bind the exact address."
  - `inv-023-...md`, "## Rule": "For a fresh loan, selecting an existing recipient field remains a value change requiring fresh approvals".
  - `sr-003-...md`, "## Owns" says the same as INV-023.
- **What is wrong:**
  - The architecture record itself permits the selection. Its "Authority And Sources Of Truth" bullet ("a payment account is not the protocol EOA, a loan key, a term-bound recipient, or an organization wallet") is an identity statement. IFACE-022 reconciles that reading explicitly.
  - The word "never" appears only in SR-009 ("It is never the protocol EOA, a Bitcoin child, `Y`, or a term-bound recipient"). That is a wording discrepancy which IFACE-022 resolves, not an open behavioral conflict.
  - The guide also drops the "authorized for that role" condition.
  - The error comes from the migration-added `loan-terms-and-commitments/domain.md` "## Choices And Rationale" bullet (see §4).
- **Effect:** changed meaning and an invented conflict. Fact L-9 (assigned to Loan Terms) becomes doubtful for readers of this guide.

**AR-2 — Major: an implementation selection presented as system behavior, in tension with the system model.**
- **Guide, l.123:** "No server, operator or product mechanism can recover a forgotten Vault password; the participant's own 12-word recovery phrase restores Bitcoin key material, but an unrevealed X or Y is lost with the password."
- **What the owners say:**
  - The only source is `build/records/selections/sel-005-bip39-twelve-word-vault-backup.md`: "The phrase reconstructs master Bitcoin key material but does not decrypt encrypted `X`/`Y` records by itself." The root README says a SEL "does not define system behavior".
  - The system-model owners say the opposite about the consequence:
    - `sr-004-...md`, "## Owns": "Password loss blocks secret disclosure, reconstruction, new signing, and cooperative settlement but does not invalidate an unchanged fully signed package."
    - `state-004-...md`, "## States": "Unavailable | Password/ciphertext/backup loss prevents reconstruction; prepared independent artifacts may remain usable."
    - `inv-024-...md`, "## Rule": no mechanism "can reconstruct a forgotten vault password, seed, child key...".
  - STATE-004 has no transition that restores from a seed phrase.
- **What is wrong:**
  - The guide presents an unflagged SEL-vs-system-model tension as settled.
  - It omits the owners' consequence: new signing, disclosure, and cooperative settlement are blocked, while unchanged fully signed packages stay usable.
  - A reader can infer a participant-side key recovery that lets them keep signing. This would be a Critical "invented forgotten-password recovery" if SEL-005 did not exist.

**AR-3 — Minor: imprecise attribution of the approval conflict.**
- **Guide, l.142:** "The architecture record and the offer-and-reservation records say a reservation binds the canonical loan without a second lender approval." Line 45 has similar wording.
- **What the owners say:** `state-001-...md` ("One-Loan Offer And Reservation"), "## Invalid Transitions": "The required lender final-terms approval is distinct from its earlier commercial-offer approval."
- **What is wrong:** STATE-001 is an offer-and-reservation record, and it sits on the other side. Side A is the architecture record, IFACE-003, SEL-012, and SCOPE-011. Both sides and the open status are otherwise correct.

**AR-4 — Minor (A-3 Weakened).**
- **Guide, l.71:** "Any artifact that cannot prove it belongs to this exact loan and environment is rejected rather than reinterpreted."
- **What the owner says:** `architecture.md`, "## Purpose And Binding": "Neither commitment is a wallet, signing key, source of funds, chain-state fact, or lifecycle action."
- **What is wrong:** the "identity is not authority" half is missing, and the manifest list omits upgrade authority. Question Q-A8 can only be answered partly.

**AR-5 — Minor (A-14 Weakened).**
- **Guide, l.125:** "it asks what capability an attacker would gain at which stage of a loan, not only whether one stolen item is harmful alone."
- **What the owners say:** `architecture.md`, "## Security Change Control": "No threat may be summarized by a severity word alone." Also "### Combination-Attack Ownership": "Each approved combination has one primary `SEC-xxx` owner".
- **What is wrong:** neither rule is stated. Question Q-A7 can only be answered partly.

**AR-6 — Minor (A-12 Weakened).**
- **Guide, l.102:** "refuses to start if any setting points at a public network or credential".
- **What the owner says:** `architecture.md`, "## Target Outcome And Runtime Profiles": "absence, conflict, a non-loopback bind, a non-regtest Bitcoin network, a non-local Base chain, public credentials, or a public deployment manifest fails closed".
- **What is wrong:** the guide drops the absent or conflicting local predicate and the non-loopback bind.

**AR-7 — Minor: a condition omitted from the reservation rule.**
- **Guide, l.45:** "She then has 24 hours to produce a valid Bitcoin prefund; ... otherwise the reservation is cancelled, the offer reopens, Ana is blocked from that offer and receives an infraction."
- **What the owner says:** `state-001-...md`, "## Transitions":
  - The cancel, reopen, and infraction route applies to "No valid prefund by the 24-hour rule **after terms commitment**". It also includes "notify both parties".
  - "Unused reservation reaches the 24-hour expiry before terms commitment and without a prefund attempt → Expired".
- **What is wrong:** the infraction route is not conditioned on commitment, and the notices are omitted.

**AR-8 — Minor: claim ladder present, recorded status absent.**
- **Guide, l.99:** "What this version claims | ... | A developer can start, resume and reset the whole system and complete the browser journey".
- **What the owners say:**
  - `architecture.md` uses "Target-version claim ... A developer may start or resume".
  - `build/records/verification/va-003-...md`: "**State:** `Planned — unverified`", "**Existing-capability evidence:** None."
  - `build/workflow/handoffs/README.md` gives the local-demo row as "Blocked" and notes the supervisor's "`LOCAL_DEMO_RUNTIME_NOT_IMPLEMENTED` stop".
- **What is wrong:** the present-tense "can" with no status note is mild readiness drift. Line 95 frames everything as a target, which limits the damage.

**AR-9 — Minor: overstatement.**
- **Guide, l.39:** "A published secret is the only thing that crosses from Base to Bitcoin".
- **What the owners say:**
  - S is published by the external service, not on Base.
  - Finalized Base states also gate Bitcoin automation. `flow-002` step 6 requires "Finalized public `X`". `flow-003` step 2 requires "finalized Base state with no accepted `X`".
  - `architecture.md`, "## Cross-Domain Boundaries": "Base facts and public secrets never sign, redirect, broadcast, or confirm Bitcoin by themselves."
- **What is wrong:** the guide's sentence is broader than the owners' rule.

**AR-10 — Minor: internal inconsistency about H(S).**
- **Guide, l.20:** "Each secret has a hash commitment recorded in the loan terms". This includes S.
- **What the owners say:** `iface-001`, "## Payload Or Artifact" excludes H(S) from `LoanTermsV1`. The guide's own lines 71 and 144 treat the location as disputed.

**AR-11 — Minor.**
- **Guide, l.25:** "there is no return of any surplus to the borrower".
- **What the owner says:** `scope-012-...md`, "## Boundary": "automated surplus return, shortfall enforcement ... are outside V1".
- **What is wrong:** "automated" is dropped, and cooperative settlement could still return value.

**AR-12 — Minor: vocabulary collision.**
- **Guide, l.14:** "for loans created after a later activation gate" uses activation for the fallback service. Lines 22 and 51 use activation for the Bitcoin activation transaction.
- **What is wrong:** the two meanings are never distinguished. Lines 114 and 117 qualify "the validation service is activated", so the risk is low.

**AR-13 — Minor: fallback gate content missing.**
- **What the guide says:** "a later activation gate" (l.14). Line 123 says "the legal approval the fallback service needs, are outside this technical design".
- **What the owner says:** `iface-017`, "## Preconditions And Validation": "Counsel approval and implementation evidence must satisfy the production-activation gate before availability is represented or `H(S)` is accepted for a new loan."
- **What is wrong:** the gate's content is never stated, and line 123 could be read as the design not requiring counsel approval.

**AR-14 — Minor: conditions omitted from funding and timelock statements.**
- l.49 says "anyone can call the contract to finalize exactly the principal" without "before the funding deadline" (`flow-002` step 3: "Balance ≥ principal before deadline").
- l.23 says the lender route "becomes valid at T" without the median-time-past basis (`inv-008`: "only after MTP satisfies `T = D + 259,200`").

**Checked and acceptable:**
- **"Roughly 20 minutes" (l.131)** is sourced: `sel-013`, "Base documents that stage as roughly 20 minutes". It is hedged.
- **The opener "trusted ... only to report that the Bitcoin prefund qualified" (l.134)** is sourced: `iface-009`, line 281.
- **"After a short beta under one dedicated upgrade key ..." (l.134)** is sourced: `sel-009`.
- **The pause conflict (l.134, l.147)** is real: `sr-003`, `sel-009`, and `cons-008` against `state-019`.
- **"About 72 hours" (l.106)** is sourced: `state-008`, "approximately 72-hour".
- **The 67-hour and 19-hour gates** are sourced: `flow-001` step 9 and `flow-002` step 4.
- **The rule that a fee tier cannot change after mempool entry (l.108)** is sourced: `iface-007` line 25 and `iface-008` line 68.
- **The backups being hourly, in a separate account, and covering packages and Vault data (l.93)** is sourced: `sr-011` and `sel-026`.
- **The fee-bump tooling sitting outside Cloudflare (l.91)** is sourced: `repo-006` and `sel-034`.
- **The SEC-015 shared-frontend description (l.125)** matches SEC-015, including "V1 does not require special multi-person release controls".
- **The domain-map attribution (l.138)** matches `architecture.md`, "## Decision Attribution".

### 1.2 Key facts (A-1 to A-15)

**Preserved (12):**
- **A-1:** l.19, l.67, l.114.
- **A-2:** l.3, l.25.
- **A-4:** table, l.83.
- **A-5:** l.82, l.67.
- **A-6:** l.19, l.80.
- **A-7:** l.87.
- **A-8:** l.14, l.20, l.114.
- **A-9:** l.93. The "operator surface" is missing from the outage list; minor.
- **A-10:** l.93, l.132. "Guaranteed cold redeployment" is missing; minor.
- **A-11:** l.95.
- **A-13:** l.140–147.
- **A-15:** l.67. The states are listed only as "progress information".

**Weakened (3):** A-3 (AR-4), A-12 (AR-6), A-14 (AR-5).

**Missing / Contradicted:** none.

### 1.3 Distinctions and conflicts

- **2a (authentication vs signing authority):** present, at l.19 and in the table.
- **2b (application status vs transfers vs contract facts):** present, at l.67 and l.82.
- **2c (the three kinds of refund):** present. The funding refund is at l.106, the prefund refund at l.106 and l.108, and the unclaimed-repayment refund at l.114. A Base refund is never called a Bitcoin recovery (l.114, callout l.117).
- **2d (the fallback):** the summary and the not-available status are present (l.14). The gate's content is missing (AR-13).
- **2e (publication vs broadcast vs confirmation):** present, at l.67, l.114, l.117, and l.121.
- **2f (funding control):** present, at l.12 and l.81.
- **2g (claim ladder):** the ladder is present (l.97–100). The recorded status is absent (AR-8).
- **2h:** all three conflicts are present with both sides and the not-decided status: approval (l.45, l.142), fee tier (l.145), and package count (l.51, l.146). The attribution of the approval conflict is imprecise (AR-3). The guide adds three more:
  - **Binding placement:** real at the wording level and recorded in the Loan Terms domain record.
  - **On-chain pause:** real.
  - **Payment account as recipient:** overstated (AR-1).
- **Residual risks:** all present.
  - The non-atomic activation-pending risk falls on the lender (l.108).
  - Collateral stays exposed when Y is missing (l.117).
  - Terminal signing can remain pending (l.110).
  - Cloudflare is a shared failure domain (l.93).

### 1.4 Comprehension questions

- **Answered fully (6):** Q-A1, Q-A2, Q-A3, Q-A4, Q-A5, and Q-A6 (Q-A6 picks up the extra conflicts, one of them overstated).
- **Answered partly (2):**
  - Q-A7: the severity-word rule is missing.
  - Q-A8: the "not authority" half is missing.
- **Dangerous answers traceable to the guide:** none, unless the 12-word sentence (AR-2) leads a reader to "I can still sign with my phrase".

### 1.5 Verdict: **FAIL**

- Two Majors (AR-1, AR-2) fail the guide under rule 4.3.
- 12/15 Preserved (80%) is below the 90% threshold.
- The architecture-specific requirements are met: all three conflicts from 2h and the claim ladder are carried.

**Fixes needed:**
1. Rewrite or drop the payment-account conflict (AR-1).
2. Reword l.123 to the system-model consequence (AR-2).
3. Restore A-3, A-12, and A-14.

---

## 2. Loan Terms And Commitments guide (`guide/domains/loan-terms-and-commitments.md`)

### 2.1 Defects

**LT-1 — Major: the same invented conflict as AR-1.**
- **Guide, l.66:** "The origination flow lets a participant choose it as a recipient for a new loan only if the account is recoverable and the product discloses its separate participant-transfer capability, and only through the normal fresh approvals; existing terms stay unchanged. The architecture record and the lender authorization record say instead that a payment account is never a term-bound recipient; that conflict is unresolved."
- **Guide, l.84:** "The records do not reconcile this."
- **What the owners say:** the same owners as AR-1 (`architecture.md` "## Purpose And Binding", `iface-022` "## Boundary" and line 161, `inv-023` "## Rule", `sr-003` "## Owns").
- **What is wrong:**
  - The records do reconcile it, in IFACE-022.
  - The guide again omits "authorized for that role".
- **Effect:** fact L-9 is Weakened, and Q-L6 can only be answered with an unnecessary "but disputed".

**LT-2 — Minor (L-8 Weakened): the finality condition is dropped.**
- **Guide, l.41:** "The reservation itself stays open until Ana later accepts the funded loan on Base; only then is the offer consumed".
- **What the owner says:** `state-001`, "## States": "Consumed | The bound loan reaches the established **finalized** `STATE-011` `Accepted / X public` origination transition".
- **Why only Minor:** the omission changes when the "consumed" label applies, not who may act. `state-001` already forbids reopening while a valid retained prefund remains.

**LT-3 — Minor (L-4 Weakened): the concurrency rule is not stated.**
- **What the guide says:** l.12 says only "atomic selection".
- **What the owners say:**
  - `iface-003`, "## Failure Meaning": "Concurrent or stale selection loses without creating a second reservation."
  - `sr-001`, "## Failure And Recovery": "Reject duplicate/concurrent reservation".

**LT-4 — Minor (L-14 Weakened).**
- **What the guide says:** the exclusions are present (l.82). The meta-rule is absent.
- **What the pre-migration domain record said:** "a narrative or diagram cannot supply a missing approval".
- **Current owner:** none (§4).

**LT-5 — Minor: vocabulary.**
- **Guide, l.56:** "Before activation ... Once the loan is active, its terms cannot be amended."
- **What the owner says:** `state-002` forbids "superseding after activation" and says "No active/effective escrow or Base loan may be amended in place". "Active" is a later state (package-ready).
- **What is wrong:** "activation" and "active" are left undefined. The first sentence keeps the rule correct, so L-11 counts as Preserved.

**LT-6 — Minor: incomplete list of side-A sources.**
- **Guide, l.44:** "A sentence in the architecture record, and similar wording in the selection record and the interface contract".
- **What is missing:** SCOPE-011 ("## Boundary": "...standing lender acceptance, atomic borrower reservation, no second lender approval...") and the architecture record's second instance in "## Cross-Domain Boundaries". The domain record omits SCOPE-011 too.

**LT-7 — Minor: vocabulary collision on "acceptance".**
- **What the guide says:** "An acceptance snapshot" (l.67) means the commercial acceptance snapshot. "accepts the funded loan on Base" (l.41) means X acceptance.
- **What is wrong:** the two senses are not separated. The guide otherwise uses "approval" consistently for final terms.

**Checked and acceptable:**
- **The 19-field list (l.13)** is accurate against `iface-001`, "### Exact `LoanTermsV1` ABI Order", including the random per-loan participant references.
- **The manifest description (l.14)** is accurate against `sr-001` "## Owns" and `iface-002`.
- **The allocation, preparation, and approval steps (l.36–39)** are accurate against `flow-001` steps 2–4, `iface-001`, and `state-002`.
- **Exceptions and recovery (l.48–58)** are accurate against `state-001`, `state-002`, and `sr-001`.
- **The attributions (l.74–75)** match TICKET-0004 (human-approved, agent-recommended) and TICKET-0001 (user-specified deployment facts; approved field list).
- **"Both positions trace to user decisions" (l.44)** matches `decision-overview.md`: TICKET-0069 (2026-08-06) and TICKET-0150 (2026-09-28).

### 2.2 Key facts (L-1 to L-15)

**Preserved (11):**
- **L-1:** l.16.
- **L-2:** l.13–14.
- **L-3:** l.11–12, l.35.
- **L-5:** l.36–39.
- **L-6:** l.39, l.48, l.50.
- **L-7:** l.64–65.
- **L-10:** l.58.
- **L-11:** l.52, l.56.
- **L-12:** l.13, l.83.
- **L-13:** l.43–44, l.81.
- **L-15:** l.67–69.

**Weakened (4):** L-4 (LT-3), L-8 (LT-2), L-9 (LT-1), L-14 (LT-4).

**Missing / Contradicted:** none.

### 2.3 Distinctions and conflicts

- **2a:** present. "Approval is not execution" (l.64).
- **2b:** present (l.16).
- **2f:** present (l.65).
- **2h-1 (approval wording):** both sides and the unresolved status are present (l.43–44, l.81). The list of side-A sources is incomplete (LT-6).
- **Binding-placement conflict:** flagged (l.85), and it matches the domain record. The guide describes the IFACE-001 field list but says so openly.

### 2.4 Comprehension questions

- **Answered fully (7):** Q-L1, Q-L2, Q-L3, Q-L4, Q-L5, Q-L7, Q-L8.
- **Answered partly (1):** Q-L6. The conditions are given, but they are wrongly framed as disputed.
- **Dangerous answers traceable to the guide:** none.

### 2.5 Verdict: **FAIL** (strict rule)

- No Criticals.
- One Major (LT-1). The pass rule tolerates one Major only with a correction note.
- 11/15 Preserved (73%) is below 90%.

**Fixes needed to pass:**
1. Replace the payment-account conflict with the settled IFACE-022 / INV-023 rule, and add role authorization.
2. Add "finalized" to the consumption sentence.
3. Add the concurrency rule.
4. Restore the "narrative cannot supply approval" rule. Its technical owner must be restored first (§4).

---

## 3. Participant Access And Loan Operations guide (`guide/domains/participant-access-and-loan-operations.md`)

### 3.1 Defects

**PA-1 — Critical: the approval conflict is presented as settled.**
- **Guide, l.34:** "**Approving.** The workspace shows both participants the understandable final terms and the identities they bind. Each approves that exact version from their signed-in session."
- **What the owners say:**
  - Side A: `architecture.md`, "## Purpose And Binding": "Publication is the lender's standing acceptance of the offer; reservation creates the canonical loan without a second lender approval."
  - Side A also appears in `iface-003` "## Must Not Imply", `sel-012`, and `scope-011`.
  - The conflict is recorded in `loan-terms-and-commitments/domain.md`, "## Choices And Rationale": "Unresolved source conflict ...".
- **What is wrong:**
  - Only side B appears, with no note and no link. The text is faithful to SR-010 and SR-011, which are side-B records.
  - The key's rule 4.2 ("stated as settled, one side is omitted") makes this Critical.
- **Fix:** one sentence plus a link to the Loan Terms guide's conflict note.

**PA-2 — Major: verification is merged with runnable local use.**
- **Guide, l.76:** "A passing test, a healthy process, a seeded fixture or a demo receipt shows only that the local profile works."
- **What the owners say:**
  - `build/records/verification/va-001-...md`, "Limitations": "Passing this capability proves verification only and cannot establish the runnable local demo".
  - `state-020-...md`, "## Observation And Finality": "READY proves only that the local composition's health gates pass."
  - `architecture.md` claim ladder: deterministic local verification does not prove "A developer-runnable product".
- **Effect:**
  - The callout claims a passing test or a healthy process proves the local profile works, which the owners deny.
  - P-14 is partly Contradicted ("proves none of the later claims").
  - It also contradicts the Architecture guide's own table (l.100).

**PA-3 — Major: the local demo is described in the present tense with no recorded status.**
- **Guide, l.71–73:** "It uses a local Base chain ... One entrypoint checks prerequisites, starts or resumes the system, waits for every part to be healthy and reports the result..."
- **What the status records say:**
  - `va-003-...md`: "**State:** `Planned — unverified`" and "**Existing-capability evidence:** None. The inspected `pnpm dev:system` implementation is a disposable verification composition and cannot satisfy this claim."
  - `build/workflow/handoffs/README.md`: the local-demo row is "`Blocked — ...`", and "BU-011 remains in progress; its supervisor still contains the explicit `LOCAL_DEMO_RUNTIME_NOT_IMPLEMENTED` stop".
- **What is wrong:**
  - The guide flags Vault payment accounts as "a target, not verified behavior" (l.88) but says nothing similar about the demo. The asymmetry implies the demo exists.
  - Q-P7 expects the blocked or unverified status, and the dangerous answer "the demo is already running end to end" becomes reachable.
- **Why Major, not Critical:** the guide never says the demo works. It drops to Minor if status records are judged out of scope for guides; the verdict does not change.

**PA-4 — Minor (P-3 Weakened).**
- **Guide, l.21:** lists the 7-day session, the 24-hour inactivity limit, 15-minute reauthentication, and TOTP.
- **What the owner says:** `sr-010`, "## Owns": "for password replacement only, a separate single-use verified-email confirmation ... cannot substitute for the current vault password".
- **What is wrong:** this extra gate is missing.

**PA-5 — Minor (P-6 Weakened).**
- **What the guide says:** l.14 "a single-use code, not a general signing token". l.35 "which signs in independently, redeems the code, reloads and checks the exact bytes".
- **What the owners say:**
  - `iface-004`, "### One-Time Cross-Origin Handoff": "The vault requires the same participant's fresh authenticated session ... A handoff code is an expiring pointer, not authentication, transaction consent, or cryptographic authority."
  - `sr-011`, "## Owns": the code is "bound server-side to one internal participant, role, loan, expected workspace revision, exact action".
- **What is wrong:** the guide omits the binding fields, the "same participant, fresh session" requirement, and the "not authentication or consent" statement.

**PA-6 — Minor (P-10 Weakened).**
- **What the guide says:** l.88 describes the participant transfer without its loan boundary.
- **What the owners say:**
  - `flow-001`, "## Failure And Reroute": "The participant-transfer capability has no loan/workspace binding and its independent confirmation does not advance loan state".
  - `sr-011`: "A participant transfer's independent confirmation updates only its transfer record."
- **What is wrong:** the exact approval, balance, and gas checks are also omitted. Line 38 partly covers the gap with its general rule.

**PA-7 — Minor (P-4 Weakened).**
- **What is wrong:** the guide never says that every participant interaction makes its own identity and role check with non-enumerating denials.
- **What the owner says:** `sr-010`, "## Inputs And Outputs" paragraph: "Every consumer-visible interaction performs its own authoritative identity and role check."

**PA-8 — Minor: package count without the stale-sentence note.**
- **Guide, l.37:** "twelve exit transactions and Ben his six".
- **What is wrong:** it adopts the current value (18) but does not mention the stale SR-002 "12-package" sentence (`bitcoin-authorization-and-recovery/domain.md` "## Choices And Rationale").
- **Why Minor:** the owners label 12 as stale, so no behavioral question is silently decided.

**PA-9 — Minor.**
- **Guide, l.83:** "an unresolved case leaves the account blocked until the participant decides".
- **What the owners say:**
  - `sr-011`: "explicit participant/operator reprobe or identical-byte retry after escalation".
  - `cons-028`: "permits only explicit identical-byte reprobe/retry after 180 seconds".
- **What is wrong:** the guide loosens a bounded action into a discretionary decision and omits the operator.

**PA-10 — Minor.**
- **What the guide says:** the operator paragraph (l.65) omits two limits.
- **What the owners say:**
  - `sr-011`, "## Owns": "Participant authentication grants no workforce authority."
  - `sr-003` and `sr-006`, "## Failure And Recovery": operators cannot choose amounts.
- **What is wrong:** only "choose a destination" is stated.

**PA-11 — Minor.**
- **What the guide says:** l.71 "on one machine".
- **What the owner says:** `sr-012`, "## Owns": "Loopback-only process supervision".
- **What is wrong:** the loopback-only condition is not stated.

**Checked and acceptable:**
- **Sign-in and session values:** WorkOS with Google or a six-digit code, 7 days, 24 hours, 15 minutes, and roles (`sr-010`).
- **Job retries:** 1, 2, 5, and 15 minutes, then hourly (`sr-011`).
- **Payment reconciliation probes:** 0, 15, and 60 seconds, then 180 (`sr-011`, `state-021`).
- **Backup alerting:** hourly, plus a daily dump; warnings at 2 and 6 hours and a qualification pause at 24 hours (`sr-011`).
- **External monitor:** Better Stack (`sr-011`).
- **Operator roles:** viewer, operator, and security_admin, with one-person approval (`sr-011`, `sel-030`).
- **Notifications** (`sr-011`).
- **The one-time gas stipend** (`iface-015`).
- **Deferrals:** SCOPE-005, -006, -014, and -015.
- **Deferral of the two-provider public payment quorum** (`iface-022`: "this production/public-network quorum is deferred").
- **The status "no execution evidence" for payment accounts** (`sel-043`: "remains planned/unverified"; `cons-028`).

### 3.2 Key facts (P-1 to P-15)

**Preserved (10):**
- **P-1:** l.7.
- **P-2:** l.21, l.59.
- **P-5:** l.59.
- **P-7:** l.53, figure, l.7, l.17.
- **P-8:** l.13, l.51, l.53.
- **P-9:** l.55.
- **P-11:** l.65. See PA-10 for the minor omissions.
- **P-12:** l.57.
- **P-13:** l.71. See PA-11 for the minor omission.
- **P-15:** l.67, l.90–92.

**Weakened (4):** P-3 (PA-4), P-4 (PA-7), P-6 (PA-5), P-10 (PA-6).

**Contradicted, in part (1):** P-14 (PA-2).

### 3.3 Distinctions and conflicts

- **2a (primary for this guide):** present, at l.21, l.59, l.63, and l.64.
- **2b (primary for this guide):** present, at l.7, l.17, l.38, and the caption. The participant-transfer boundary is missing (PA-6).
- **2e:** present (l.17).
- **2f:** present (l.55).
- **2g (primary for this guide):** the claim separation is broken by PA-2, and the recorded status is absent (PA-3).
- **2h-1 (approval):** fails (PA-1).
- **2h-2 (package count):** Minor (PA-8).

### 3.4 Comprehension questions

- **Answered fully (6):** Q-P1, Q-P3, Q-P4, Q-P5, Q-P6, Q-P8.
- **Answered partly (2):**
  - Q-P2: the email confirmation is missing.
  - Q-P7: no status, and the callout invites "tests prove the demo works".

### 3.5 Verdict: **FAIL**

- One Critical (PA-1) and two Majors (PA-2, PA-3).
- One partly Contradicted fact (P-14).
- 10/15 Preserved (67%).

---

## 4. Migration removals: does each removed fact still have a technical owner?

The migration removed the narrative sections listed below and added new "Choices And Rationale" bullets. Each entry gives the removed text, where it now lives, and an assessment.

### `system-model/architecture.md` — "## System Overview" (all three paragraphs removed)

**4.1 — Distinctions between domains.**
- **Removed:** "...each can report progress without acquiring another's authority: login is not a Vault unlock, an accepted command is not a chain fact, and a Base refund is not a confirmed Bitcoin recovery."
- **Now owned by:** `architecture.md` "## Authority And Sources Of Truth" (authentication is not decryption), `inv-013`, `state-016`, `flow-005` "## Outcomes", and `sr-007`.
- **Assessment:** owned piecewise. The combined framing exists only in the guide (l.29).

**4.2 — The normal-repayment and fallback summary.**
- **Removed:** "A normal repayment lets the lender disclose `Y`; lender silence can lead to a Base refund and, only for an activated precommitted fallback loan, conditional `S` recovery. Either Bitcoin path becomes final only when the expected spend confirms."
- **Now owned by:** `flow-004`, `flow-005`, `flow-006`, `inv-007`, `inv-025`, `iface-020`, and the SR-007 bullet in `architecture.md`.
- **Assessment:** owned.

**4.3 — The unresolved-conflict flag (meaning changed).**
- **Removed:** "Existing approval-wording and fee/count discrepancies identified by the migration remain unresolved source issues; this documentation revision does not choose new behavior."
- **Now owned by:**
  - The approval conflict: `loan-terms-and-commitments/domain.md`, "## Choices And Rationale".
  - The fee and count conflicts: `bitcoin-authorization-and-recovery/domain.md`, "## Choices And Rationale".
- **Assessment: regression.**
  - `architecture.md` still asserts side A twice, with no flag in the file. "## Purpose And Binding" says "reservation creates the canonical loan without a second lender approval". "## Cross-Domain Boundaries" says "...and no second lender approval".
  - An agent reading only `architecture.md` now sees side A as fact.
  - The architecture-level statement "this revision does not choose new behavior" now exists only in the guide (l.140).

**4.4 — Precedence of visuals.**
- **Removed:** "Each domain below is a complete reading destination; ... [visual] views ... do not replace this written architecture."
- **Now owned by:** only the README's "technical records ... remain authoritative for every fact". That sentence covers guides but does not explicitly rank the System Explorer.
- **Assessment:** minor gap.

### `system-model/domains/loan-terms-and-commitments/domain.md` — "## Domain Overview" and its subsections removed

**4.5 — The identifier is not authority.**
- **Removed:** "A matching identifier proves which agreement an artifact describes; it does not authorize a spend or establish a chain outcome."
- **Now owned by:** `iface-001` "## Must Not Imply", `inv-012`, and `architecture.md` "## Purpose And Binding".
- **Assessment:** owned.

**4.6 — The approval sequence.**
- **Removed:** the reservation, allocation, preparation, approval, and commitment sequence, including the old borrower-only "H(X)" wording.
- **Now owned by:** `sr-001`, `state-001`, `state-002`, `flow-001`, `iface-001`, and `sr-011`.
- **Assessment:** owned. The borrower-only error is gone.

**4.7 — The settled payment-account rule (meaning changed).**
- **Removed:** "The payment account can fund an eligible transfer; it does not silently become a loan recipient or protocol caller. Selecting an address for a fresh loan's existing recipient field uses the normal role authorization and fresh candidate approvals. Historical terms remain immutable."
- **Replaced by:** a new "Unresolved source conflict" bullet.
- **Assessment: technical-record defect introduced by the migration.**
  - The settled rule is still owned by `iface-022`, `inv-023`, `sr-003`, and `architecture.md` "## Purpose And Binding".
  - The new bullet misreads the architecture record.
  - It also cites "the Preconditions of FLOW-001". The text is in FLOW-001's "## Failure And Reroute"; the `#preconditions` anchor is wrong.
  - This bullet is the source of AR-1 and LT-1.

**4.8 — The documentation meta-rule (now owned nowhere).**
- **Removed:** "An unresolved implementation question belongs in its existing ticket; a narrative or diagram cannot supply a missing approval."
- **Now owned by:** no technical record. It is not in the guide either.
- **Assessment:** this is fact L-14's second half. The rule matters more now that guides exist.

**4.9 — The encoding rationale.**
- **Removed:** "The recorded rationale for canonical encoding is interoperability and verifiability".
- **Now owned by:** the new "## Choices And Rationale" bullet, which keeps the substance.
- **Assessment:** owned. Only the label words survive in the guide alone (l.73).

**4.10 — Funding decision and domain exclusions.**
- **Removed:** "The lender separately retains the capital-funding decision..." and "Product authentication, Vault decryption ... remain with their respective domains".
- **Now owned by:** `sr-001` "## Owns", `architecture.md` "## Purpose And Binding", and the domain record's "## Excludes".
- **Assessment:** owned.

**4.11 — Pointer from SR-001 to the guide.**
- **Changed:** SR-001's "Responsibility Overview" now points to the guide for "the full cooperation scenario".
- **Assessment:** the substance remains in `state-002`, `flow-001`, `iface-001`, and the SR-001 Inputs and Outputs. The pointer is navigational, but it means a technical record now defers to a guide.

### `system-model/domains/participant-access-and-loan-operations/domain.md` — "## Domain Overview" and its subsections removed

**4.12 — Application records are not authority.**
- **Removed:** "Application records coordinate those authorities; they cannot become private keys, participant consent, or chain truth."
- **Now owned by:** the domain record's "## Purpose", `sr-011` "## Must Not Own", and `inv-012`.
- **Assessment:** owned.

**4.13 — Definitions and mechanics.**
- **Removed:** the definitions of workspace, revision, outbox, handoff, and payment intent. Also the outbox and wake mechanics, the 0/15/60/180-second probes, and the pending-bytes rule for a new device.
- **Now owned by:** `sr-011`, `iface-013`, `state-016`, `state-021`, `iface-022`, and `sel-043`.
- **Assessment:** owned.

**4.14 — Rationale for three design choices.**
- **Removed:** "Recorded Choices And Scope", which explained the consumer-continuity work, the local composition, and Vault-owned payment intents.
- **Now owned by:** fragments only:
  - `sr-011` line 78 and `cons-024` (consumer continuity);
  - `sel-035` "Options And Consequences" (local composition);
  - `inv-027` "Violation Meaning" and `sel-043` "Options And Consequences" (payment intents);
  - ticket contexts.
- **Assessment:** partly owned. Unlike its sibling domain records, the participant domain record now has **no "Choices And Rationale" section**. The concise rationale statements exist only in the guide (l.81–83).

**4.15 — Payment capability status.**
- **Removed:** "The current payment capability is still an implementation target with no execution evidence established by this migration."
- **Now owned by:** `sel-043` ("remains planned/unverified until that evidence exists") and `cons-028` ("the profile is not yet verified").
- **Assessment:** owned by build records.

**4.16 — What local evidence cannot satisfy.**
- **Removed:** "A visual, fixture, healthy process, or local design check cannot satisfy those exclusions or activation gates."
- **Now owned by:** `scope-013` "## Must Not Be Inferred" and `sr-012` "## Must Not Own" cover fixtures and healthy processes.
- **Assessment:** "visual" and "local design check" are now unowned.

**4.17 — Provider replacement and platform-paid reveal deferrals.**
- **Removed:** the deferral of identity-provider replacement and of platform-paid reveal execution.
- **Now owned by:** `scope-015`, `scope-014`, and the domain record's "## Excludes".
- **Assessment:** owned.

**4.18 — Local funding is not payment evidence.**
- **Removed:** "Local setup may provision disposable funds ... neither participant-payment evidence nor production gas sponsorship".
- **Now owned by:** `sr-011`, `sr-012`, and `iface-015`.
- **Assessment:** owned.

### Facts that now exist only in a guide, or nowhere

- **Only in the architecture guide:** the architecture-level "unresolved, no new behavior chosen" statement (4.3).
- **Nowhere:** "a narrative or diagram cannot supply a missing approval" (4.8).
- **Nowhere:** the explicit subordinate status of visuals (4.4, 4.16).
- **Only in the participant guide:** concise rationale for consumer continuity and local composition (4.14). Fragments survive in SEL and CONS records and tickets.

The other three `domain.md` records (Bitcoin, Base settlement, Base observation) were also rewritten. I checked them only where the reviewed guides depend on them: the fee and package-count conflicts and the pause conflict are recorded there.

## 5. Notes on the answer key

- **Source root:** the key's `t0` root is identical to `pre`. Section owners cited from the removed narratives no longer exist in snap-t7:
  - `architecture.md` "## System Overview" (A-1, A-8, A-13);
  - the Loan Terms "### ..." subsections (L-1, L-9, L-13, L-14, L-15);
  - the Participant "### ..." subsections (P-1, P-2, P-8, P-9, P-10, P-12, P-14).
- **The key is incomplete on conflicts.**
  - It lists three. The snap-t7 records now flag six.
  - The pause conflict (SR-003, SEL-009, and CONS-008 against STATE-019) and the binding-placement conflict (architecture and SR-001 against IFACE-001) are genuine at the wording level and were missed by the key.
  - The payment-account "conflict" is not genuine. On that point the key's L-9 is right and the migrated records are wrong.
- **The key does not mention SEL-005.** Its B-15 and Q-B8 depend on the system-model wording, which SEL-005 is in tension with (AR-2). A future key should flag this as an unrecorded tension.
- **The key's 4.7 "≥90% Preserved" rule** fails a guide on two Minor weakenings out of 15 facts. Here it is decisive only for the Loan Terms guide.
