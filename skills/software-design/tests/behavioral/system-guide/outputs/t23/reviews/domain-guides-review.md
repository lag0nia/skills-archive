# Domain guides review

I reviewed this independently and changed nothing except this file. I checked five guides against their original narratives, the change list, and the owner records.

Paths are relative to `B=.../scratchpad/eval`. `G` = `t23/bitrise21/loan-system/design/technical-design`.

## Method

- I compared the original with the guide word by word for each slug. I recomputed these diffs myself instead of relying only on the supplied `.txt` diffs, with link destinations and heading markers stripped. I also read both texts in full.
- I mapped every difference to a change-list entry: F1–F3, N1–N2, L1–L4, B1–B4, C1–C7, O1–O4 and P1–P3.
- I opened every link in each guide and compared the label with the destination's `name:`, `title:` or `#` heading.
- For each Accuracy change, I opened the `Unresolved source conflict:` or `Open question:` line in `G/system-model/domains/*/domain.md`, then the records those lines quote: INV-020, SEL-009, SR-003, STATE-019, CONS-008, SR-001, the architecture record, TICKET-0150, SR-002, CONS-014, CONS-027, IFACE-007, SEC-024, SEL-043, VA-003, `handoffs/README.md` and `repo-002-core-coordination.md`.

## Summary

| Class | Count |
| --- | --- |
| Blocker | 1 |
| Minor | 2 |
| Note | 10 |

Check 1: every difference is covered by a listed change of the claimed kind. I found no unlisted difference.

Check 4: all links resolve to existing files, including 0 missing out of about 100 links checked and the `#owns` anchor in SR-006.

## Blocker

### BL-1: Base USDC, B3 says the existence of any pause is open, which overstates the open question

Guide `G/guide/domains/base-usdc-settlement-and-funding.md:25`:

> "Whether V1 has any pause is also open: this domain's settlement responsibility and the upgrade governance selection say V1 has no on-chain pause, while the [deployment, upgrade, and opener states] include pause roles and a narrow operational pause; whether that pause is the frontend/API operational stop or an on-chain role is undecided."

- The change list cites the record's `Open question:` line, `G/system-model/domains/base-usdc-settlement-and-funding/domain.md:49`. That line leaves only one point open: "Whether that state is the frontend/API operational stop or an on-chain role is undecided."
- The owners settle that a frontend/API operational stop exists:
  - SEL-009 (`G/build/records/selections/sel-009-base-contract-upgrade-governance.md`, "Selected Or Inherited Direction") says: "During an incident, the organization may pause normal actions in its frontend/API and disable opener orchestration. This is an operational control only".
  - CONS-008:14 says: "Incident response stops frontend/API and opener infrastructure".
- So "Whether V1 has any pause is also open" presents a settled fact as open, and it contradicts the same sentence's last clause.
- Domain record line 47 uses the same loose wording ("whether any pause exists are reached by the two lines below"), so the guide has a source for it. The cited `Open question:` line does not support it.
- Suggested fix: "Whether V1 has an on-chain pause is also open: …".

## Minor

### MI-1: Bitcoin, C7 keeps an attribution the owner record could not locate

Guide `G/guide/domains/bitcoin-authorization-and-recovery.md:23` says: "while the action contract and a former decision say fail closed."

- The owner line `G/system-model/domains/bitcoin-authorization-and-recovery/domain.md:48` says: "The previous domain explanation also attributed fail closed to a 'former decision', which this migration could not locate."
- The action-contract half is correct: IFACE-007:57 says "fail-closed no-eligible-tier result", and :61 says "No eligible tier … selects nothing".
- The "former decision" half is attributed to a record that the owners say they cannot find.
- C7 rewrote this exact clause (it added "a") but neither kept nor flagged the problem.
- Suggested fix: restate the attribution as one the records could not locate, or attribute fail closed to the action contract only. If the latter drops a statement, it should be listed as an Accuracy change.

### MI-2: Participant access guide states one side of the unresolved approval conflict as settled, and nothing lists it

Guide `G/guide/domains/participant-access-and-loan-operations.md:17` says: "both roles approve the same final candidate under the terms domain's exact rules."

- This is SR-001's side of the unresolved source conflict recorded at:
  - `G/system-model/domains/loan-terms-and-commitments/domain.md:44`
  - `G/system-model/architecture.md:23`
- The other side, in architecture.md:21, IFACE-003, SCOPE-011 and SEL-012, says there is "no second lender approval".
- L2 restates the same conflict as open in the loan-terms guide (`loan-terms-and-commitments.md:11`). The participant guide keeps the settled wording without a change-list entry and without a Known-gaps entry.
- The phrase "under the terms domain's exact rules" points the reader to the terms domain, which partly limits the damage. The sentence itself still asserts the outcome.
- The attribution is not false, since SR-001 says this, so I rate it Minor rather than Blocker. By the migration's own Accuracy rule ("an open point narrated as settled, restated as open"), it should have been changed for consistency with L2.

## Notes

### NO-1: Base USDC, B2 places the seven-day delay on one side only

The seven-day delay now appears only on INV-020's side (`base-usdc…md:25`). SEL-009 also requires that "Every scheduled upgrade has a public seven-day delay before execution", but only for the multisig phase. The guide's SEL-009 side follows the domain record's quote (domain.md:48) exactly, so nothing is misattributed. A reader might infer that SEL-009 has no delay.

### NO-2: Base USDC, B3 leaves out part of each side

- The no-pause side omits CONS-008, which domain.md:49 also cites.
- "include pause roles" shortens STATE-019:15, which says "pause/operational roles".

Neither changes the meaning.

### NO-3: Each Accuracy change names only part of each side

| Change | Side the guide names | Also on that side in the record |
| --- | --- | --- |
| L2 | the architecture record | IFACE-003, SCOPE-011, SEL-012 |
| C6 | SEC-024 | INV-025, FLOW-005 |
| O3 | SEC-024 | INV-025 |

Every record that is named actually says what the guide attributes to it.

### NO-4: Bitcoin, C7 says "a ticket"

The guide says "a ticket and the payload description select the largest tier". The record cites two tickets, TICKET-0018 and TICKET-0089 (domain.md:48). Strength is unchanged.

### NO-5: Bitcoin, C2 cites more than the record's conflict line

- C2 adds CONS-014 to the twelve side. The record's conflict line (domain.md:49) does not cite it.
- CONS-014:14 supports it: "construct only that parent's six-normal/six-default terminal phase".
- CONS-027:14 sits on the eighteen side ("one 18-leaf terminal manifest"). The guide does not need to name it.
- C2's reason cites "answer key v4 1.4", which is not a package record. That is a change-list wording issue, not a guide issue.

### NO-6: Observation, O1 drops "independent" from the SR-007 label

The canonical name replaces "The independent validation-service fallback" and loses the word "independent" (`base-observation…md:5`). Independence is still stated at line 23: "one contracted independent service".

### NO-7: Loan terms, the INV-011 label is a shortened name

The label "selected lender capital control" (`loan-terms…md:15`) leaves out "And No Liquidation" from the record name "Selected Lender Capital Control And No Liquidation". It still identifies the record.

### NO-8: The supplied observation diff is out of date

`t23work/diffs/base-observation-and-fallback-review.txt` shows "an activated S commitment". The guide (line 31) and O3 both say "a production-activated S commitment". The guide is consistent with the record (SEC-024: "production-activated `H(S)` capability").

### NO-9: Participant access, P3 adds "later"

The guide says "the handoff sequence records a later correction". `G/build/workflow/handoffs/README.md:23` says the correction "now passes"; "later" is an inference. The rest of P3 matches domain.md:56, SEL-043 ("Delivery status is `PARTIAL` …"), VA-003:13 ("Planned and unverified") and `repo-002-core-coordination.md:2447`.

### NO-10: Participant access, an open question about transfer scope is not reflected

Guide line 25 says "The selected narrow participant-transfer purpose permits…". The guide does not reflect the open question at `participant-access…/domain.md:57`: BU-004 may describe a narrower Vault signing scope than SEL-043. "Selected" is SEL-043's own status, so the sentence is not false. Neither the change list nor the Known gaps section mentions this question.

## Accuracy changes confirmed correct

| Change | Finding |
| --- | --- |
| L1 | TICKET-0150 attribution (`sr-004-hd-vault-and-acceptance-tickets.yaml:104`): separate approval is "human-approved/user-specified", and the final-approval mechanics are "agent-chosen". Removing "approved" is justified. |
| L2 | The architecture quote matches architecture.md:21. "Neither … chosen" matches domain.md:44. The consequence "whether the lender approves the final candidate separately remains open" follows directly from the two sides. |
| L4 | SCOPE-011's Boundary lists only the first four exclusions. SCOPE-012 excludes BTC liquidation. The domain record (domain.md:28) already splits them the same way. |
| B2 | The INV-020 and SEL-009 quotes match domain.md:48 and both source records. |
| C2 | SR-002:36 ("12-package signed terminal phase must receive its own R2/D1 receipt") against IFACE-005 and SR-002:31 (6+6+6). "Neither count is chosen" matches the record. |
| C6, O3 | CONS-027:14, INV-008, FLOW-010 and SEC-024:26 match domain.md:48 (observation) and :53 (bitcoin). The "different loans or contradict" ending is the record's own. |
| C7 | Apart from MI-1 and NO-4, this matches domain.md:48 and IFACE-007:21, :57 and :61. |
| P3 | Matches domain.md:56. The most limited status is used and the disagreement is reported. |

## Format, Names and Editorial changes confirmed correct

All of these keep meaning, conditions and strength.

- **F1–F3:** headings and closing lines.
- **N1:** canonical names of SR-001 to SR-012, including "Borrower/Lender **Bitcoin** authorization and recovery" (SR-004, SR-009).
- **N2:** every relabelled link names its destination record. The only shortened labels are those in NO-7 and the SCOPE-005 label "cooperative settlement operations"; both still identify the record.
- **B1, B4, C1, C3–C4, O2, O4, P1–P2, L3:**
  - C1: P2A is an output type, so "pay-to-anchor (P2A) output" is accurate.
  - C3: CONS-014:14 commits the receipt in D1, and SR-011:15 describes a "D1-backed durable participant workspace".
- **C5:** "production-activated" matches IFACE-020:15, :47 and :84 ("production-activated ECVS") and SEC-024.

## The "Known gaps in the retained prose (not changed)" section

I agree that all four are omissions, not false statements, so leaving them unchanged is correct under the rules. Two need more attention than the others.

1. **Base USDC, activation-pending race.** Agree. "acceptance pays principal and leaves Bitcoin activation pending" is true. SEC-023:34 and :81 state the unsecured-lender race the guide leaves out.
2. **Participant access, handoff.** Agree, but this one is close to the line. "grants a particular participant access to one bounded Vault action" is consistent with IFACE-004:49 (a "participant-bound, role-bound, loan-bound, action-bound, short-lived, single-use handoff") and ACT-003:124. However, IFACE-004:51 says the code is "an expiring pointer, not authentication, transaction consent, or cryptographic authority" and that the Vault separately requires a fresh authenticated session. "Grants … access" sounds stronger than a pointer, but it is not contradicted outright, so it is an omission.
3. **Bitcoin, plaintext clearing on failure or cancellation.** Agree. Nothing in the retained prose contradicts it.
4. **Loan terms, preparation by both roles.** Agree, also close to the line. The sentence "The borrower prepares its public destination and `H(X)` result; Core assembles a complete candidate version and hash" does not say "only". Read as a sequence, though, it implies that Core assembles after the borrower's preparation alone. STATE-002:22 and :31, and FLOW-001 steps 3–4, require both roles' destination and commitment preparation results first. TICKET-0150's user-specified decision also covers "a fresh X or Y per loan". This is an omission, but worth fixing through Coverage.

Two more items should arguably be on the list: the open conflict in MI-2 and the open question in NO-10.
