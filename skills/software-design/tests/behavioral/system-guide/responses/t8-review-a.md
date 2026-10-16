# T8 Review A: Semantic Fidelity of the System Guide (snap-t8)

## Scope and method

- **Package reviewed (post-migration):** `snap-t8/bitrise21/loan-system/design/technical-design`.
- **Pre-migration copy:** `pre/bitrise21/loan-system/design/technical-design`.
- **Guides reviewed:**
  - `guide/architecture.md`
  - `guide/domains/loan-terms-and-commitments.md`
  - `guide/domains/participant-access-and-loan-operations.md`
- **Criteria:** Part 4 of `expectations/expectations.md`. Parts 1 and 2 were used as a checklist, and each item was re-verified against the snap-t8 records.
- **Path convention:** paths below are relative to the snap-t8 `technical-design/` root unless a path starts with `pre/`.
- **What was compared:**
  - Every claim in the three guides was compared with its owning record, including system-model records, build records (CONS, SEL, VA), handoffs, and the decision overview where they record status or attribution.
  - The pre-migration `system-model/architecture.md`, Loan Terms `domain.md`, `sr-001`, and Participant Access `domain.md` were diffed against their post-migration versions. These are the only technical records the migration changed that feed these three guides.
- **Note on the key:** the key cites a `t0` source root. For the records behind these three guides, the snap-t8 contents match the key's quotations. The exception is the architecture "## System Overview" section, which the migration removed (see part 3 of the architecture section).

## Summary

| Guide | Critical | Major | Minor | Key facts Preserved | Comprehension (guide-only) | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| Architecture | 0 | 2 | 9 | 11/15 (73%); 2 Weakened, 2 Missing, 0 Contradicted | 7/8 (Q-A7 unanswerable) | **FAIL** |
| Loan Terms And Commitments | 0 | 0 | 5 | 12/15 (80%); 2 Weakened, 1 Missing, 0 Contradicted | 8/8 | **FAIL (narrowly, on the 90% fact threshold only)** |
| Participant Access And Loan Operations | 0 | 1 | 5 | 10/15 (67%); 5 Weakened, 0 Missing, 0 Contradicted | 6/8, with a guide-traceable dangerous answer on Q-P4 | **FAIL** |

**Strengths shared by all three guides:**
- The three flagged conflicts (approval wording, no-qualifying-tier fee rule, 12 versus 18 terminal packages) are carried with both sides and an explicit "not decided" status.
- The claim ladder is present.
- No guide makes a readiness, ECVS-availability, or RTO/RPO overclaim.
- The status distinctions (accepted, submitted, observed, finalized, confirmed) are kept.

**Where the guides fail:**
- They omit conditions and facts the key assigns to them.
- The architecture guide contains two meaning changes:
  - It says a thief who steals the lender's signed default package "can take the collateral".
  - It presents a single-key upgrade period during the public mainnet beta as settled, although the canonical invariant and state records require a 2-of-3 Safe with a timelock.

---

## 1. Architecture guide (`guide/architecture.md`)

### 1.1 Defects

**AR-1 — Major: a thief "can take the collateral" (fixed destination omitted)**
- **Guide** (callout "Valid repayment alone does not return the Bitcoin"):
  > "The lender's signed recovery still becomes valid at T, one day after C, and the lender, or anyone who stole that signed transaction, can then take the collateral even though the borrower repaid"
- **Owners:**
  - `system-model/contracts/security/sec-025-lender-or-package-holder-broadcasts-default-after-valid-repayment.md`, "### SEC-025.THREAT-001": "BTC may pay the fixed lender destination even though the borrower paid" and "a random package thief cannot redirect value but may collude, extort, or sabotage".
  - Same file, "## Prohibited Authority": "the package holder may not redirect the fixed payout".
- **What is wrong:** an omitted condition that changes the meaning. A thief can broadcast the package, but the BTC goes only to the committed lender destination. The guide implies the thief obtains the collateral. That collapses the fixed-versus-attacker-selected-destination distinction that `system-model/architecture.md` "## Security Change Control" requires every threat statement to keep.
- **Severity:** Major (4.3, "fixed recipient" condition omitted).
- **Fix:** say that anyone holding the package can broadcast it, and the BTC then pays the lender's fixed destination.

**AR-2 — Major: upgrade governance presented as settled despite a source conflict**
- **Guide** ("Consequential choices and their reasons"):
  > "The contract has one upgrade ownership path: a dedicated single upgrade key for local and test use and the intentionally short public mainnet beta, after which the same sole ownership moves to a two-of-three multisignature behind a seven-day public timelock for the rest of the first version. … An approved upgrade changes the code for every loan the deployment holds; no loan is moved to another deployment."
- **Canonical owners** (none of them mention a beta single key):
  - `system-model/contracts/invariants/inv-020-base-upgrade-boundary.md`, "## Rule": "V1 retains the Transparent ProxyAdmin controlled by a 2-of-3 Safe through a seven-day timelock. Upgrades and administration must preserve fixed-recipient/lifecycle authority and originating-loan identity; existing loans remain on their originating contract and are not silently migrated."
  - `system-model/contracts/states/state-019-base-deployment-upgrade-and-opener.md`, "## Invalid Transitions": "Unrestricted unilateral upgrade/admin key, retroactive mutation/migration of existing loans …"
  - `sr-003-base-loan-state-and-usdc-settlement.md`, "## Owns": "Transparent Proxy administration retained under a 2-of-3 Safe-controlled seven-day timelock".
  - `scope-007`, "## Boundary": same statement.
  - `sec-017`, "### SEC-017.THREAT-001" (Noncustodial significance): "An unrestricted unilateral upgrade key contradicts that practical claim for funds held by the proxy."
- **Other side of the conflict:**
  - `build/records/selections/sel-009-base-contract-upgrade-governance.md`, "## Selected Or Inherited Direction".
  - The TICKET-0048 decision in `build/workflow/decision-overview.md` (user: "for the mainnet beta, I will keep the single key").
  - The post-migration Base domain record, "## Choices And Rationale". It cites STATE-019 and INV-020 as support, but those records do not support the beta key.
- **What is wrong:**
  - An unflagged conflict between a human-approved build selection or ticket and the canonical invariant, state, and security records is presented as settled.
  - The guide also drops INV-020's condition that upgrades must preserve fixed-recipient and lifecycle authority and originating-loan identity. A reader could conclude that an upgrade may change existing loans' mechanics.
- **Severity:** Major. This is an unresolved conflict presented as settled, and a build record (README: SELs "do not define system behavior") overrides the canonical model.
- **Fix:** state both sides and that the canonical records have not been reconciled with TICKET-0048/SEL-009. Restore the INV-020 preservation condition.

**AR-3 — Minor: six confirmations generalized to every Bitcoin step**
- **Guide** (Finality):
  > "A Bitcoin step counts only after six unchanged confirmations, observed by independent data sources that agree."
  - Also: "A Bitcoin gate needs six unchanged confirmations and fresh agreement between independent sources."
- **Owners:**
  - `iface-006`, "## Preconditions And Validation": six confirmations are named only for prefund window-opening. The other agreement gates (selected-escrow confirmation, confirmed prefund refund, confirmed terminal spend) carry no depth.
  - `flow-002`, "## Outcomes", and `state-015` fix six for the activation winner only. `state-015`, "## Observation And Finality" says only "Confirmation of the exact spent output".
- **What is wrong:** an invented requirement for terminal spends and the prefund refund. Six confirmations is the owners' rule only for prefund qualification and the activation winner.
- **Severity:** Minor.

**AR-4 — Minor: six pre-signed fee variants generalized to every Bitcoin transaction**
- **Guide** (Signed packages):
  > "The Bitcoin transactions the loan may need are built and signed in advance, each as six fee variants of 10, 20, 50, 100, 150 and 200 satoshis per virtual byte."
- **Owners:**
  - `flow-001`, step 5: the borrower constructs, signs and broadcasts one exact prefund.
  - `flow-009` and `iface-019`: cooperative variants are built later, with fresh signatures.
  - `sr-002`, "## Owns": the six-tier families are activation, refund and terminal.
- **What is wrong:** over-generalization. The prefund is not a pre-signed six-variant family, and cooperative settlement is not signed in advance.
- **Severity:** Minor.

**AR-5 — Minor: wording implies the fallback service may withhold at its discretion**
- **Guide:** "The validation service, once activated, can only publish or withhold one loan's committed secret."
- **Owner:** `sr-007`, "## Must Not Own" (no discretionary release authority) and "### When the path fails" (withholding is an incident path).
- **What is wrong:** "publish or withhold" reads as a discretionary choice.
- **Severity:** Minor.
- **Fix:** "can only publish the committed secret for that loan, and only on the exact finalized evidence".

**AR-6 — Minor: the governance dependency is attached to the collateral-key claim**
- **Guide:** "It holds no key in any collateral script and does not take custody of lender capital, a claim that is only as strong as the governance of the Base contract's upgrades".
- **Owner:** `sec-017` (Noncustodial significance): "The claim that the company cannot redirect Base funds is only as strong as the deployed administration model."
- **What is wrong:** the sentence can be read as making the collateral-key claim depend on Base governance. It does not; only the USDC custody claim does.
- **Severity:** Minor.

**AR-7 — Minor: one source per side on the fee conflict**
- **Guide:** "one source selects the highest variant, records fee-bump eligibility and alerts, while the action contract returns a fail-closed result. Neither is authorized."
- **Owner:** `system-model/domains/bitcoin-authorization-and-recovery/domain.md`, "## Choices And Rationale". The 200 sat/vB side is the IFACE-007 payload section plus the fee-selection tickets. The fail-closed side is IFACE-007 ACT-002 plus "the former decision".
- **What is wrong:** each side has two sources, not one. The substance and the "neither is authorized" status are preserved.
- **Severity:** Minor.

**AR-8 — Minor: valid repayment stated without the L1-finality clause**
- **Guide:** "only exact debt finalized on Base no later than the repayment deadline, D, is valid repayment."
- **Owner:** `inv-006`, "## Rule": "… finalized for exactly the debt no later than D **and** the canonical Repaid event reaches Base L1 finality."
- **What is wrong:** the second condition is dropped, and "finalized on Base" blurs contract finalization with L1 finality. The guide's general finality rule partly compensates.
- **Severity:** Minor.

**AR-9 — Minor: the introduction leans toward one side of the approval conflict**
- **Guide** (introduction): "every movement of USDC or Bitcoin follows rules both participants approved before any money moved."
- **Owner:** the approval-wording conflict in `system-model/architecture.md`, "## Purpose And Binding". Under the system-level wording, the lender approves only the commercial values.
- **What is wrong:** the sentence presumes both roles approved the full bound rules.
- **Severity:** Minor.

**AR-10 — Minor: two weakened facts and an ambiguous term**
- **A-10 weakened:**
  - The guide says "no live fallback provider and no stated recovery-time or recovery-point objective".
  - It omits "no active-active deployment, no guaranteed cold redeployment" (`system-model/architecture.md`, "## V1 Operating Topology And Availability Boundary").
- **A-3 weakened:**
  - The guide says "A matching identifier … does not authorize anything".
  - It omits that the terms and manifest are not a wallet, key, source of funds, chain-state fact, or lifecycle action (`architecture.md`, "## Purpose And Binding").
- **"Activation" used in three senses:** Bitcoin activation, ECVS capability activation, and activated production operation. Each use is qualified, but the collision is not explained.

**Acceptable, not counted:**
- "Base L1 finality, which Base describes as roughly 20 minutes" is attributed to Base. It is sourced from SEL-013 and framed as accepted delay, not as a promise.
- "rate" in the offer is sourced from SEL-012.
- The status notes ("Vault preparation step … not yet been delivered", "Signing against an unconfirmed prefund … not yet been delivered", "recorded as in progress and not yet runnable") are labelled as recorded status. They match `build/workflow/handoffs/README.md` and `inv-015`.

### 1.2 Key facts (part 1.1) and distinctions

| Fact | Status | Note |
| --- | --- | --- |
| A-1 | Preserved | Login versus Vault, accepted command versus outcome, and the Base refund callout. |
| A-2 | Preserved | |
| A-3 | Weakened | See AR-10. |
| A-4 | Preserved | |
| A-5 | Preserved | |
| A-6 | Preserved | |
| A-7 | Preserved | |
| A-8 | Preserved | |
| A-9 | Preserved | |
| A-10 | Weakened | See AR-10. |
| A-11 | Preserved | |
| A-12 | **Missing** | The demo-only identities and fail-closed local predicates are absent from the architecture guide. The Participant Access guide carries them; the architecture guide does not. |
| A-13 | Preserved | Three open conflicts are listed. The "this revision does not choose new behavior" status is carried per item. |
| A-14 | **Missing** | The guide does not state the severity-word prohibition, the rule that individually insufficient credentials can be sufficient in combination, or that each combination has one primary owner. It cites SEC-015 and SEC-017 only by example. Q-A7 cannot be answered. |
| A-15 | Preserved | |

**Distinctions:**
- 2a, 2b, 2c, 2e, and 2f are carried.
- 2d is carried as a summary plus the gate.
- 2g: the claim ladder is present.
- 2h: all three conflicts are present with both sides. 2h-4 (no API version stated) is satisfied.
- Not in the key (see the "Notes on the answer key" section): the upgrade-governance conflict (AR-2).

**Comprehension:**
- Q-A1 through Q-A6 and Q-A8 are answerable correctly.
- Q-A7 fails because the information is absent.
- Outside the key's questions, AR-1 would produce a dangerous answer ("a thief can take the collateral").

### 1.3 Migration losses in the technical records behind this guide

The migration removed `system-model/architecture.md`, "## System Overview" (three paragraphs) and added a conflict note under "## Purpose And Binding".

| Removed content | Still has a technical owner? |
| --- | --- |
| "login is not a Vault unlock, an accepted command is not a chain fact, and a Base refund is not a confirmed Bitcoin recovery" | Yes, in substance. Owners: "## Authority And Sources Of Truth" (ciphertext-only authentication), `state-016`/`inv-013`, and `flow-005`, "## Outcomes" plus `sr-007`, "### When the path fails". The Base domain record no longer carries "Base refund does not imply Bitcoin recovery". |
| "only for an activated precommitted fallback loan, conditional `S` recovery. Either Bitcoin path becomes final only when the expected spend confirms." | Yes: `inv-025`, `sr-007`, `iface-020`, `flow-004`/`flow-006`. |
| "Existing approval-wording and fee/count discrepancies … remain unresolved source issues; this documentation revision does not choose new behavior." | Partly. The approval conflict is now in "## Purpose And Binding" and the Loan Terms domain record. The fee and count conflicts are owned only by the Bitcoin domain record, "## Choices And Rationale". The architecture record no longer indexes them, so the system-level pointer to them now exists only in the guide. Deliberate move, but a weaker system-level index. |
| Statement that the visual index views "do not replace this written architecture" | Lost (navigational only; the README still frames the visuals as supporting navigation). |

**Not a removal, but a related migration change** (outside these three guides, which consume it): the post-migration Base domain record, "## Choices And Rationale", newly states the single beta upgrade key. The pre-migration record said the main contract "retains its explicit Transparent Proxy administration, 2-of-3 Safe, seven-day timelock". The migration therefore introduced into a canonical record the conflict that AR-2 propagates, and cited INV-020 and STATE-019 for it.

### 1.4 Verdict

**FAIL.**
- Critical defects: 0.
- Major defects: 2 (AR-1, AR-2). More than one Major fails the guide.
- Preserved facts: 73%, below the 90% threshold.
- The guide does carry all three conflicts and the claim ladder.

---

## 2. Loan Terms And Commitments guide (`guide/domains/loan-terms-and-commitments.md`)

### 2.1 Defects

**LT-1 — Minor: provisional reading of the open approval conflict**
- **Guide** (box "Open: does the lender approve twice?"):
  > "Until it does, read step 6 as recorded in the detailed rules and the question as open."
- **Owner:** `system-model/domains/loan-terms-and-commitments/domain.md`, "## Choices And Rationale": "whether that reconciles the wording is not decided." `architecture.md`, "## Purpose And Binding" says the same.
- **What is wrong:** the guide supplies an interim reading that the owners do not give. Both sides and the undecided status are present, so the conflict is not silently resolved.
- **Severity:** Minor.
- **Fix:** "Step 6 follows the detailed rules; the system-level wording would omit the lender's approval; which is right is undecided."

**LT-2 — Minor: liquidation attributed to the wrong scope record**
- **Guide:** "public or multi-lender matching, pooled lender capital, product custody, automatic deployment of lender capital, and liquidation are outside the design under the capital-scope record".
- **Owners:**
  - `scope-011`, "## Boundary" does not cover liquidation.
  - `scope-012`, "## Boundary" does.
- **What is wrong:** wrong attribution. It is inherited from the domain record's "## Excludes", which carries the same SCOPE-011 link.
- **Severity:** Minor. Fix both the guide and the domain record.

**LT-3 — Minor: "finalized" omitted from the consumption trigger**
- **Guide** (step 6): "The reservation stays active until the loan is accepted on Base or ends."
- **Owner:** `state-001`, "## States" (Consumed): "the established finalized `STATE-011` `Accepted / X public` origination transition".
- **Severity:** Minor.

**LT-4 — Minor: ambiguous count of the results needed before the candidate**
- **Guide** (step 5): "Once both public results are durably recorded".
- **Owner:** `state-002`, "## Transitions": both roles' allocation (ACT-008) and both roles' preparation (ACT-009) results, four in all.
- **What is wrong:** "both" is ambiguous.
- **Severity:** Minor.

**LT-5 — Minor: stale selection omitted**
- **Guide:** "A second borrower selecting the same offer at the same moment loses without creating a second loan."
- **Owner:** `iface-003`, "## Failure Meaning": "Concurrent **or stale** selection loses".
- **Severity:** Minor.

**Verified as faithful:**
- The deployment-description exclusions.
- The allocation and preparation steps, with both H(X) and H(Y). This correctly repairs the old domain narrative's borrower-only wording.
- Approval invalidation, idempotency and concurrency (`state-002`).
- Cancellation, fresh identity and parties kept (`state-001`, `sel-012`).
- The 24-hour expiry and reopen/infraction/block/notice rules, the 72-hour manual review, no company fee bump on the prefund, the new-prefund route, and operator cancel-and-reopen without an infraction (`state-001`, `sel-012`).
- Identity separation (`inv-023`, `flow-001` "## Failure And Reroute").
- "Approving terms grants no signing, custody, funding or chain authority" (`sr-010`).

### 2.2 Key facts (part 1.2) and distinctions

| Fact | Status | Note |
| --- | --- | --- |
| L-1 | Preserved | |
| L-2 | Preserved | |
| L-3 | Preserved | |
| L-4 | Preserved | Minor: LT-5. |
| L-5 | Preserved | |
| L-6 | Preserved | |
| L-7 | Preserved | |
| L-8 | Preserved | Minor: LT-3. |
| L-9 | Preserved | |
| L-10 | Preserved | |
| L-11 | Weakened | "Before activation, an amendment produces a later version" does not state that an activated loan cannot be superseded (`state-002`, "## Invalid Transitions"). |
| L-12 | **Missing** | The guide never mentions that `H(S)` appears in the terms only for loans created with the approved capability (`sr-001`, "## Owns"). |
| L-13 | Preserved | With LT-1. |
| L-14 | Weakened | The exclusions are present. "a narrative or diagram cannot supply a missing approval" is absent, and the migration also deleted it from the technical record (part 2.3). |
| L-15 | Preserved | |

**Distinctions:** 2a (approval is not signing or funding), 2b, 2f (funding remains the lender's separate decision), and 2h-1 (both sides plus undecided status) are carried.

**Comprehension:** Q-L1 through Q-L8 are all answerable correctly from the guide alone.

### 2.3 Migration losses in the technical records behind this guide

The Loan Terms `domain.md` lost its "## Domain Overview" narrative. SR-001's pointer changed from "the Domain Overview" to the guide.

| Removed content | Still has a technical owner? |
| --- | --- |
| "A matching identifier proves which agreement an artifact describes; it does not authorize a spend or establish a chain outcome." | Yes, in substance: `architecture.md` "## Purpose And Binding", `inv-012`, and `state-002` "## Observation And Finality". |
| Deployment identity excludes URLs, credentials, secrets, mutable state | Yes: `sr-001`, "## Owns". |
| Consumer list (Bitcoin, Base, observers, operations, Vaults bind or check the same loan) | Yes: `inv-001`, and the `sr-001` overview. |
| Approval sequence | Yes: `sr-001`, `state-002`, `flow-001`. |
| "The payment account … does not silently become a loan recipient or protocol caller." | Yes: `inv-023`, `inv-027`. |
| Rejection list, amendment, cancellation and fresh identity | Yes: `sr-001` "## Failure And Recovery", and domain "## Choices And Rationale". |
| "The lender separately retains the capital-funding decision, even after an agreement is committed." | Yes: `sr-001` "## Owns", `inv-011`. |
| **"An unresolved implementation question belongs in its existing ticket; a narrative or diagram cannot supply a missing approval."** | **No. It now exists nowhere**, in neither the technical records nor the guide. It should be restored to the domain record (or another owner) and then restated in the guide. |

### 2.4 Verdict

**FAIL (narrowly).**
- Critical defects: 0. Major defects: 0. Comprehension: 8/8.
- Preserved facts: 80%, below the 90% threshold, which is the only failing criterion.
- Three additions would bring it to 15/15:
  - The conditional `H(S)` commitment.
  - No supersession after activation.
  - The narrative-or-diagram rule, once it is restored to a technical owner.
- LT-1 should also be reworded.

---

## 3. Participant Access And Loan Operations guide (`guide/domains/participant-access-and-loan-operations.md`)

### 3.1 Defects

**PA-1 — Major: Vault handoff conditions missing, and the wording implies signing authority**
- **Guide:**
  > "A **handoff** gives one participant access to one bounded action in their Vault, such as allocating a loan key or signing one exact batch. It is not a general signing token."
  - Also step 4: "the application stores one immutable signing batch; the product launches the bounded Vault handoff; the Vault signs locally."
- **Owners:**
  - `system-model/contracts/interfaces/iface-004-vault-envelope-and-local-handoff.md`, "### One-Time Cross-Origin Handoff":
    - "short-lived, single-use handoff"
    - "The vault requires the same participant's fresh authenticated session, atomically redeems the code once"
    - "independently authorizes the consumed handoff/session and reloads the owning canonical records"
    - "The Vault never signs bytes supplied only by the normal-product page"
    - "A handoff code is an expiring pointer, not authentication, transaction consent, or cryptographic authority."
  - `sr-011`, "## Owns" (fresh-gated handoff bullet).
- **What is wrong:**
  - The guide omits the single-use code, the Vault-side fresh session, the independent canonical reload and validation, and the rule that the Vault never signs page-supplied bytes.
  - "Not a *general* signing token" implies the handoff is a *specific* signing authority, which contradicts "not … cryptographic authority". Distinction 2a is stated in only one direction: login does not decrypt, but nothing says the handoff does not authorize.
  - Q-P4 cannot be answered. A guide-only reader can plausibly answer "the product sends the batch and the handoff authorizes the signature", a dangerous answer traceable to this wording.
- **Severity:** Major (4.3: omitted conditions, and a distinction stated in only one direction).
- **Note:** the old domain narrative had the same "not a general signing token" wording. The guide restated it faithfully, but this guide is the primary owner of the distinction under 2a.

**PA-2 — Minor (weakened fact P-11): operator boundary incomplete**
- **Guide:** "Company staff use a separate operator surface protected by a separate access service, with three explicit roles … Staff identity alone grants nothing."
- **Owners:**
  - `sr-011`, "## Owns" (workforce boundary bullet): Cloudflare Access, allowlisted company Google identities, mandatory TOTP, 15-minute session, active D1 operator permission on every request, "Participant authentication grants no workforce authority".
  - `sr-011`, "## Owns" (one-person approval bullet): "One-person V1 operator approval …", every privileged attempt written to "an operator-uneditable D1 audit".
  - `cons-019`, "## Rule".
- **What is wrong:** the guide omits mandatory TOTP, the 15-minute session, the active-permission check, one-person approval, the uneditable audit, and the explicit no-workforce-authority rule. The roles and actions it does state are correct (`sel-030`).
- **Severity:** Minor (no false statement), but Q-P8 is only partially answerable.

**PA-3 — Minor (weakened fact P-3): the email confirmation limit is missing**
- **Guide:** "Replacing a Vault password also needs a separate single-use confirmation through the participant's verified email."
- **Owner:** `sr-010`, "## Owns": "The confirmation contains no vault material, cannot substitute for the current vault password".
- **What is wrong:** the limit is dropped.
- **Severity:** Minor.

**PA-4 — Minor (weakened fact P-4): per-interaction checks missing**
- **What is missing:** the rule that every interaction makes its own identity and role check, with non-enumerating denials (401, 404, 403).
- **Owner:** `sr-010`, "## Inputs And Outputs" (paragraph after the table): "The presence of an authenticated session … is not an access decision for another interaction."
- **Severity:** Minor.

**PA-5 — Minor (weakened fact P-7): changed-body rejection missing**
- **Guide:** "A retried command with the same identity returns the same result."
- **Owner:** `sr-011`, "## Owns" (first bullet): "scoped idempotency keys enforce same-body recovery and changed-body rejection".
- **What is wrong:** reuse of a key with a changed body is not said to be rejected.
- **Severity:** Minor.

**PA-6 — Minor: identity-provider replacement conditions narrowed**
- **Guide:** "replacing the selected identity provider, which would have to preserve internal account and loan identities and prove sign-in, session, recovery, cut-over and rollback parity."
- **Owner:** `scope-015`, "## Reason": "authenticated same-account linking without changing internal IDs or immutable loan/Vault records, session/MFA/recovery parity, staged cutover/rollback and provider-adapter conformance".
- **What is wrong:** MFA parity, Vault identities, and adapter conformance are dropped.
- **Severity:** Minor.

**Verified as faithful:**
- Payment-reconciliation detail: the 0/15/60/180-second schedule, then explicit reprobe or identical-byte retry, with only missing or contradictory evidence producing a block. This matches `state-021`, "## Bounded Reconciliation Policy" more exactly than the key's P-9 wording does.
- "The fee stipend never funds a payment account" (`iface-015`, "## Boundary").
- "public two-provider payment confirmation … deferred" (`state-021`, `iface-022`).
- "signing profile is recorded as not yet verified" (`cons-028`, "## Rule"; `sel-043`; `va-003`).
- Backup warning, critical and pause thresholds; seven-year retention; the locked R2 bucket (`sr-011`, `sel-026`).
- The two-connected-regtest-node fail-closed rule (`sr-012`, "## Failure And Recovery").
- Demo status "in progress and not yet runnable … blocked" (`build/workflow/handoffs/README.md`, labelled as recorded status).
- Vendor-identifier rationale (`sel-028`).

### 3.2 Key facts (part 1.6) and distinctions

| Fact | Status | Note |
| --- | --- | --- |
| P-1 | Preserved | |
| P-2 | Preserved | |
| P-3 | Weakened | PA-3. |
| P-4 | Weakened | PA-4. |
| P-5 | Preserved | |
| P-6 | Weakened (Major) | PA-1. |
| P-7 | Weakened | PA-5. The receipt-versus-finality part is preserved. |
| P-8 | Preserved | |
| P-9 | Preserved | |
| P-10 | Preserved | |
| P-11 | Weakened | PA-2. |
| P-12 | Preserved | |
| P-13 | Preserved | |
| P-14 | Preserved | |
| P-15 | Preserved | |

**Distinctions:**
- 2a is incomplete because of the handoff gap (PA-1).
- 2b, 2e, 2f (the Vault payment account as one payer purpose) and 2g are carried.
- 2h-1 (both sides plus undecided status) is carried.

**Comprehension:**
- Q-P1, Q-P3, Q-P5, Q-P6 and Q-P7 are answerable.
- Q-P2 and Q-P8 are only partly answerable.
- Q-P4 fails, with a dangerous answer traceable to the guide's wording (PA-1).

### 3.3 Migration losses in the technical records behind this guide

The Participant Access `domain.md` lost "## Domain Overview" and its subsections. New "## Choices And Rationale" and expanded "## Excludes" and "## Cross-Domain Contracts" sections were added.

| Removed content | Still has a technical owner? |
| --- | --- |
| Definitions, SR-010/011/012 narrative, cooperation sequence | Yes: `sr-010`/`011`/`012`, `iface-013`, `state-016`, `flow-001`/`002`/`004`. |
| D1 commit, wake and scan; ambiguous-outcome identities; 0/15/60/180-second probing | Yes: `architecture.md` topology, `sr-011`, `state-021`. |
| Payment-account recoverability, fencing, signing phase, identical bytes, new-device restore | Yes: `inv-027`, `state-021`, `iface-022`. |
| Participant-transfer scope; setup funds not payment evidence or sponsorship | Yes: `flow-001`, `state-021`, `sr-012`, `iface-015`. |
| Cloudflare outage boundary | Yes: `architecture.md`, `sr-011`. |
| Rationale paragraph | Moved to "## Choices And Rationale" (deliberate). |
| SCOPE-005/006/013/014/015 deferrals | Moved to "## Excludes" (deliberate). |
| "The current payment capability is still an implementation target with no execution evidence established by this migration." | Removed from the system model. The status survives only in build records (`cons-028`, `sel-043`: "not yet verified"; `va-003`: "Planned and unverified … All current payment-wallet claims remain planned"). Acceptable, because status belongs to build records. |
| "A visual, fixture, healthy process, or local design check cannot satisfy those exclusions or activation gates." | Partly. "Healthy process" and "fixture" remain in `sr-012`, "## Must Not Own" and `scope-013`, "## Must Not Be Inferred". **"Visual" and "local design check" now exist only in the guide.** |

### 3.4 Verdict

**FAIL.**
- Critical defects: 0.
- Major defects: 1 (PA-1), which would need a correction note.
- Preserved facts: 67%, below the 90% threshold.
- Comprehension: 6/8, but Q-P4 yields a dangerous answer traceable to the guide's wording.
- Fixing PA-1 through PA-5 (all additions) would likely bring it to a pass.

---

## Notes on the answer key (verified against the records)

- **The key omits a real conflict.** S-13 and Q-S8 present only the 2-of-3 Safe and seven-day timelock. They do not record that SEL-009, TICKET-0048 (human-approved) and now the post-migration Base domain record add a single upgrade key for the "intentionally short public mainnet beta". That conflicts with INV-020, STATE-019, SR-003, SCOPE-007 and SEC-017. Section 2h should list it.
- **P-9 is a simplification.** "escalated at 180 seconds to a visible block" does not match `state-021`. After 180 seconds an explicit reprobe or identical-byte retry is allowed, and only missing or contradictory evidence produces Blocked. The Participant Access guide is more accurate than the key here.
- **The A-13 owner section is gone.** "## System Overview" no longer exists in snap-t8. The approval conflict now lives in "## Purpose And Binding"; the fee and count conflicts live only in the Bitcoin domain record.
- **L-14's second sentence has no surviving owner.** The guide cannot restate it until it is restored to a technical record.
- **A-14 is legitimately absent from the guide.** The guide does accurately quote SEC-015's honest claim, which compares a shared frontend compromise with "two unrelated account takeovers".
