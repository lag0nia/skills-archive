## Report: participant-access-and-loan-operations ("Participant Access And Loan Operations")

Files changed (only these two):
- Domain record: `$P/system-model/domains/participant-access-and-loan-operations/domain.md`
- Domain guide (new): `$P/guide/domains/participant-access-and-loan-operations.md` (about 5,800 words)

Validation (`validate-software-design-structure.mjs`) reports no line naming either of my files. The only non-UI/UX finding left belongs to another agent: `guide/domains/bitcoin-authorization-and-recovery.md:173` has a broken link to `scope-012-btc-liquidation-su…`. The `generate-decision-overview --check` passes. Nothing in the package links the removed overview headings. No pinned file was touched.

### 1. Inventory: each narrative item and the owner that holds it

**Domain role (opening paragraph)**
- Turns separate authorities into a product workflow; owns the isolated demo; records cannot become keys, consent or chain truth. Owners: domain Purpose, Owns and Excludes; SR-011 Must Not Own; INV-012; INV-013.

**Concept definitions**
- Workspace and revision: SR-011 Owns, STATE-016, CONS-024.
- Outbox committed atomically with the state change: SR-011 (fixed-effect automation), CONS-015, TICKET-0058.
- Handoff is bounded and not a general signing token: SR-011 (handoff bullet), IFACE-004.
- Payment intent: STATE-021, IFACE-022.
- Accepted vs submitted vs observed vs finalized vs confirmed: SR-011 Owns, INV-013, STATE-016.

**Participant identity and role access paragraph**
- Accounts, roles, sessions, recovery, reauthentication/MFA, bound-artifact access: SR-010 Owns.
- Provider adapter with application-owned accounts: SR-010, SEL-028, CONS-018.
- Workforce access is separate: SR-011 workforce bullet, SEL-030, CONS-019.
- Authentication cannot decrypt, recover or validate a chain action: SR-010 Must Not Own and Failure, STATE-003, SCOPE-006.
- STATE-003 holds denial and recovery: SR-010 State (already linked).

**Loan workspace and application coordination paragraph**
- What it owns: SR-011, domain Owns.
- Acquire/refresh; absent vs forbidden vs stale vs unavailable; acknowledgement and recovery: CONS-024, TICKET-0122, TICKET-0123, SR-010 denial table, CONS-018.
- A mock, health route or producer-local method is not proof: SR-011 (paragraph after the I/O table).
- IFACE-013 and STATE-016 are already linked.

**Local runtime composition paragraph**
- Public seams, one entrypoint, paired status/shutdown/reset: SR-012 Owns, IFACE-021.
- Anvil, fake USDC, two regtest nodes, two actors, real paths, identity-bound fixtures: SR-012, CONS-025, CONS-026.
- Descriptor references producer state and never deletes siblings; shutdown preserves state; only explicit reset: SR-012, STATE-020, CONS-025.

**Cooperation through a loan**
- Reservation → allocation/preparation → final candidate → batch draft → Vault sign → verify → archive → receipt: SR-011 bullets, FLOW-001.
- Final-X activation and finalized-Y recovery: SR-011 fixed-effect automation, FLOW-002, FLOW-004.
- The three flow links were not linked from the technical sections; I moved them to Cross-Domain Contracts.

**Durable work**
- Atomic D1 commit; the wake is only an optimization; one-minute scan: SR-011, CONS-015, TICKET-0058.
- Exact identities survive ambiguity; no new or changed action after a lost response: SR-011 Failure And Recovery, STATE-016, TICKET-0058.
- 0/15/60/180-second probes and inclusion delay vs reconciliation: STATE-021, SR-011, CONS-028.

**Payment authority**
- Independence from the protocol EOA and Bitcoin keys; recoverability before exposure: IFACE-022, STATE-021, INV-027, CONS-029.
- Core owns intent, lease, fence, CAS and provider gate; the Vault owns pending bytes and signing; durable Signing before the signer runs: STATE-021, CONS-028, SEL-043.
- Hash and broadcast ordering; identical-byte repeat; fresh review on any edit; timeout after Signing is not non-submission; new-device restore or reproduce, otherwise blocked: STATE-021, CONS-028, CONS-029.
- No change to historical terms, payer-neutral settlement or observation: IFACE-022 Payer And Recipient Semantics, SEL-043, CONS-028.
- Narrow participant transfer, no loan binding, exclusions: STATE-021, IFACE-022, SEL-043, TICKET-0156.
- Local provisioning is not payment evidence: SR-012, IFACE-022 Must Not Imply.
- Production payment-gas sponsorship is excluded: TICKET-0155 (out-of-scope), SR-011.

**Cloudflare failure domain and outage behaviour**
- Owners: SEL-024, CONS-015, TICKET-0119, TICKET-0071, SR-011.

**Recorded choices (rationale)**
- Continuity rationale: TICKET-0122 and TICKET-0123 context.
- Local composition rationale: TICKET-0125 and TICKET-0126 context.
- Vault payment rationale: SEL-043 Options, TICKET-0151 and TICKET-0152 context, INV-027 Violation Meaning, SEC-028.
- I placed all three as lines in Choices And Rationale.

**Scope**
- Profile-claim ladder: SCOPE-013 (already linked).
- Forgotten password: SCOPE-006. Cooperative settlement: SCOPE-005.
- WorkOS replacement: SCOPE-015, TICKET-0120. Reveal relaying/paymaster: SCOPE-014, TICKET-0103.
- "Existing exclusions, not newly selected": the Source And Authority sections of SCOPE-014 and SCOPE-015.
- These four scope links moved into Excludes.

### 2. Exact edits to the domain record

The whole `## Domain Overview` section was replaced with this line, followed by a blank line:

```
The [Participant Access And Loan Operations guide](../../../guide/domains/participant-access-and-loan-operations.md) explains this domain for readers. This record is its exact technical reference.
```

Added under `## Excludes`:

```
- Deferred or excluded capabilities this domain does not provide: forgotten Vault-password or other stronger participant-Vault recovery ([SCOPE-006](../../contracts/scope/scope-006-stronger-participant-vault-recovery.md)); participant-operated cooperative-settlement signing sessions, Base accounting, and support operations ([SCOPE-005](../../contracts/scope/scope-005-cooperative-settlement-operations.md)); an application-owned replacement for WorkOS authentication ([SCOPE-015](../../contracts/scope/scope-015-application-owned-authentication-replacement.md)); platform-signed relaying or paymaster sponsorship of `acceptX`/`releaseWithY` ([SCOPE-014](../../contracts/scope/scope-014-platform-paid-base-reveal-execution.md)); and production gas sponsorship for Vault payment accounts ([TICKET-0155](../../../build/workflow/tickets/base-usdc-settlement-and-funding/sr-005/sr-005-tickets.yaml)).
```

New `## Choices And Rationale` section, inserted immediately before `## Cross-Domain Contracts`. It has five bullets:
1. **Continuity choice.** Reason; links to TICKET-0122/0123 (sr-011 file) and CONS-024.
2. **Local-demo composition and profile-claim separation.** Reason; links to TICKET-0125/0126 (sr-012 file), CONS-025, CONS-026, SCOPE-013.
3. **Vault-owned payment account and pre-submission intent instead of the external wallet or protocol EOA.** Reason; links to SEL-043 and TICKET-0151 (sr-004), TICKET-0152 (sr-005), TICKET-0153 (sr-011), TICKET-0154 (sr-012), TICKET-0156 (sr-011 deferred-capabilities).
4. `- Open question:` on lender final-terms approval (see section 4).
5. `- Open question:` on the extension wallet in local-demo acceptance (see section 4).

Added at the end of `## Cross-Domain Contracts`:

```
- [IFACE-022](../../contracts/interfaces/iface-022-vault-owned-base-payment-account-and-exact-transfer.md) and [STATE-021](../../contracts/states/state-021-vault-owned-base-payment-account-and-intent.md) own the Vault payment account, exact transfer intent, fenced phase order, and bounded reconciliation.
- [FLOW-001](../../behavior/flows/flow-001-origination-preparation-and-qualification.md), [FLOW-002](../../behavior/flows/flow-002-activation-completion-and-active-entry.md), and [FLOW-004](../../behavior/flows/flow-004-normal-repayment-close.md) own the authoritative origination, activation, and normal-repayment sequences that the workspace coordinates.
```

Everything else in the record is byte-identical to the baseline.

### 3. Facts I could not place, and narrative statements the owners correct

No narrative fact lacked an owner. No other file needs an edit.

Statements the owners show were imprecise (the guide follows the owners):
- **"Still an implementation target with no execution evidence established by this migration."**
  - SEL-043 records delivery status PARTIAL: implementation and execution evidence are still outstanding.
  - CONS-028 and IFACE-022 say there is no payment-transfer adapter or known-answer vector, so the signing profile is unverified.
  - The local-demo and Core handoffs claim no current payment implementation receipt.
  - However, the handoffs README says the bounded Application API 1.9/Product transfer-review correction passes focused probes, though its delivery snapshots and receipts are not finalized.
  - So "no execution evidence" overstates the case. "By this migration" also refers to an older migration.
  - The guide states the status as the owners do.
- **Reconciliation schedule.** The narrative put the 0/15/60/180-second schedule inside a general ambiguous-outcome paragraph. The owners scope it to payment intents only. General reconciliation uses different thresholds: operator attention at 15 minutes, warning at 15 minutes and critical at one hour.
- **What happens at 180 seconds.** The narrative said 180 seconds "escalates to the declared visible block/recovery route". STATE-021 says escalation allows an explicit reprobe or a retry with identical bytes. The account becomes Blocked only when the bounded evidence route cannot establish a safe outcome.
- **"A visual … or local design check cannot satisfy those exclusions."** No owner states "visual" or "local design check". The guide uses SCOPE-013's own list instead.

### 4. Open questions (each recorded in the domain record and stated as open in the guide)

1. **Lender approval of the final terms.** This point is already recorded in the architecture record and the terms-domain record. My domain also reaches it, because SR-010 and SR-011 authorize and record `approve_final_loan_terms` by both roles.
   - Side A: SR-010, SR-011, STATE-001, STATE-002 and SR-001 have both participants approve the final candidate.
   - Side B: the architecture record, IFACE-003 and SEL-012 say publication is standing acceptance, no second lender approval is needed, and SEL-012 adds there is no second lender-approval step.
   - Classified as `Open question:`, consistent with the coordinator's classification.

2. **Extension wallet in local-demo acceptance** (newly found).
   - Side A: CONS-026 and SEL-037 require human-facing acceptance to separately prove setup of an installed EIP-1193 extension wallet with the role-specific disposable account.
   - Side B: SEL-043, SEL-042 and VA-003 call the installed or injected external-wallet path historical regression evidence that is not the current journey and cannot satisfy the Vault-payment journey, which SR-012 requires.
   - Classified as `Open question:` rather than conflict. A reconciling reading is possible (the extension proof as external-payer compatibility, which SEL-043 lists in its verification), but no owner states it.
   - Please confirm with the user.

### 5. Validator lines that mention my files

None.

### 6. Things the coordinator should check

- **Line format.** My open-question lines are bullets (`- Open question:`), matching the terms-domain record. The base-usdc record uses a non-bulleted line. Normalize if needed.
- **API contract version.** IFACE-021 (pinned) and CONS-026 require `ApplicationApiContractV1@1.7.0` for the demo to reach READY. The handoffs describe API 1.8, 1.9 and 1.10.0 (ACT-008). This may be a version-pin mismatch. I did not record it; the guide gives no version numbers.
- **Demo status tension.** VA-003 records a passing three-engine run of the full journey on 2026-09-14 using the historical injected-wallet path. The handoffs README says the BU-011 supervisor still contains `LOCAL_DEMO_RUNTIME_NOT_IMPLEMENTED`. The guide states both, as each owner states them.
- **Naming.** The guide calls Core/Application API "the application interface", matching the architecture guide's wording.
- **Links to other guides.** The guide links `loan-terms-and-commitments.md`, `bitcoin-authorization-and-recovery.md`, `base-usdc-settlement-and-funding.md` and `base-observation-and-fallback-review.md`. All resolved at validation time.
- **Review.** Self-review was applied. No independent reviewer has checked steps 4 and 5 yet.
