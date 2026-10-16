Report: Bitcoin Authorization And Recovery (slug `bitcoin-authorization-and-recovery`)

Files changed (only these two):
- `$P/system-model/domains/bitcoin-authorization-and-recovery/domain.md`
- `$P/guide/domains/bitcoin-authorization-and-recovery.md` (new, about 4,650 words)

I confirmed that every interface contract, the three responsibility records and BU-006 are byte-identical to the baseline.

## 1. Inventory: each narrative item and the owner that holds it

- Opening paragraph:
  - Prefund vs escrow: INV-003, STATE-008, STATE-015.
  - PSBT and "a signed package is evidence, not permission to choose a destination": STATE-009 (Observation), SR-002 Must Not Own.
  - Consensus is the authority: STATE-015, architecture record.
- Secret roles (X, Y, S), the long-stop without secrets, and "no organization collateral key": INV-004, IFACE-020, CONS-027, FLOW-010, IFACE-005 ("no organization branch"), the domain record's Excludes.
- SR-002 paragraph: SR-002 Owns, Must Not Own, and Inputs And Outputs. Fee, relay, observation and CPFP points: IFACE-007, IFACE-008, IFACE-006, IFACE-016.
- SR-004 paragraph:
  - Vault, seed, keys, X, allocation, snapshot acknowledgement, preparation, two-step acceptance: SR-004 Owns, IFACE-004.
  - "Login cannot recreate a forgotten password": INV-024, SCOPE-006.
- SR-009 paragraph: SR-009 Owns. "Account access never exposes plaintext": SR-004 and SR-009 Must Not Own, INV-014.
- Zero-confirmation construction and the six-confirmation gates: SR-002, INV-015, STATE-008, FLOW-001.
- Initial 6+6 candidates at 10/20/50/100/150/200 sat/vB: SR-002, STATE-009.
- Terminal packages only for the actual winner after six confirmations: SR-002, STATE-009, INV-026.
- 18 terminal variants vs "twelve": the conflict, see section 4.
- Signing order, and "the receipt is never an input to its own signing": SR-002, IFACE-005.
- Terminal-signing-pending cannot undo principal or escrow: SR-002 Failure, FLOW-002, STATE-015.
- A different winner means fresh terminal construction: SR-002, FLOW-002.
- Changed parent invalidates descendants; a same-parent reorg only pauses: INV-016, STATE-008. The "avoids stale transactions" rationale: INV-016 Violation Meaning.
- Y or S fills the same route-3 transaction: IFACE-020, CONS-021, STATE-009.
- Lender route and long-stop run concurrently, one spend wins: INV-008, INV-009, CONS-027, STATE-015.
- Base cannot revoke the signatures: INV-008, SEC-025, IFACE-018.
- Cooperative signing needs fresh agreement and both keys; operations deferred: IFACE-019, FLOW-009, SCOPE-005.
- Fixed-fee rationale and the integer, buffer and freshness rules: IFACE-007, INV-010, CONS-007, TICKET-0018/0019.
- The no-tier conflict: see section 4.
- P2A/CPFP separation and fee-wallet limits: IFACE-016, SEC-027, STATE-018.
- Relay timeout reconciliation: SR-002 Failure, IFACE-008.
- What blocks an action: SR-002 Failure And Recovery.
- Rationales:
  - Exact scripts: SEC-011, CONS-005.
  - Envelope/KDF interoperability: SEL-027.
  - Hardened per-loan derivation: SEL-004, TICKET-0082, INV-022, SEC-013.
- Deferred capabilities: SCOPE-001, 002, 003, 005 and 006. Before this change the domain record's technical sections did not link them; the links are now in Excludes.

## 2. Exact edits to the domain record

- The whole `## Domain Overview` is replaced by:
  `The [Bitcoin Authorization And Recovery guide](../../../guide/domains/bitcoin-authorization-and-recovery.md) explains this domain for readers. This record is its exact technical reference.`
- Added to Excludes (one bullet): automatic organization lender-default broadcast (SCOPE-001), institutional last-resort collateral recovery (SCOPE-002), borrower-nonresponse activation recovery (SCOPE-003), cooperative settlement operations and Base accounting (SCOPE-005), and stronger participant-vault recovery (SCOPE-006). The bullet says these "remain outside this domain's current authority under those scope records, each with its own revisit condition", and links each scope record.
- New `## Choices And Rationale` section, placed immediately before Cross-Domain Contracts, with three lines:
  - `Unresolved source conflict:` terminal-phase package count. It quotes SR-002's "12-package signed terminal phase" against SR-002's own construction bullet, STATE-009, STATE-015, INV-026, IFACE-005, IFACE-013, FLOW-002, CONS-021 and CONS-027 (all 18), with links.
  - `Unresolved source conflict:` fee selection when no tier qualifies. It quotes IFACE-007's payload paragraph, TICKET-0018's resolution and TICKET-0089's resolution (the 200 sat/vB side) against IFACE-007 ACT-002's output and failure text (the fail-closed side), with links.
  - `Open question:` which relay boundary carries the long-stop and cooperative transactions. It quotes IFACE-008 against FLOW-010 step 2, SEC-025, IFACE-019 and FLOW-009 step 5.
- Added to Cross-Domain Contracts (two bullets):
  - links to IFACE-007, 014, 016, 019 and 020, with a short purpose clause;
  - links to INV-015 (zero-confirmation construction) and INV-025 (missing-`Y` residual risk).

## 3. Facts not placed, and narrative errors

- **Not placed:** the narrative's "cross-loan correlation" reason for hardened per-loan derivation. No owner states it; collisions and leak containment are covered by SEL-004, INV-022 and SEC-013. The guide omits it. Its owner would be SEL-004 or SEL-006, which I did not edit. Proposed wording, if the user confirms it: "hardened per-loan keys also prevent cross-loan correlation."
- **Narrative imprecision:** it called SCOPE-001/002/003/005/006 "excluded". Their records say status `deferred`; only SCOPE-012 is `excluded`. The guide uses deferred and excluded as recorded.
- **"Former decision says fail closed":** I found no current owner for this. TICKET-0020's fail-closed rule (`fee-estimation-blocked`) covers a different case, every estimator being unusable, so it is not a side of the conflict. The guide states it as a separate, settled case.

## 4. Open questions and conflicts

1. **Terminal package count — classified as a conflict.**
   - 12 side: SR-002, Owns, "Phase-specific archive readiness": "the 12-package signed terminal phase must receive its own R2/D1 receipt…".
   - 18 side: SR-002's terminal-construction bullet (six route-3, six route-4, six route-6), STATE-009, STATE-015, INV-026, IFACE-005, IFACE-013, FLOW-002, CONS-021, CONS-027 (also CONS-024 and TICKET-0148).
   - Reasoning: both describe the same phase and the same archive receipt, so they cannot both hold. No reconciling owner exists.
   - Proposal (report only): correct SR-002's "12-package" to 18.
2. **No tier qualifies — classified as a conflict.**
   - 200 sat/vB side: IFACE-007 Payload ("If no tier satisfies the inequality, select 200 sat/vB, record CPFP eligibility, and alert for separate manual IFACE-016 approval"); TICKET-0018 resolution, whose attribution entry records this part as human-approved/agent-recommended; TICKET-0089 resolution for refunds (that part's entry is agent-chosen).
   - Fail-closed side: IFACE-007 ACT-002, output "a fail-closed no-eligible-tier result" and failure "No eligible tier … selects nothing".
   - Reasoning: both cover the same case at the same stage, and no owner reconciles them. VA-004 reports that the implemented selector "records the tier-200 fallback with a warning/CPFP-manual disposition". That describes the code, not a design decision; I did not use it as a side.
   - IFACE-007 holds both sides and is pinned, so any fix changes delivery evidence.
3. **Relay boundary for long-stop and cooperative transactions — classified as an open question.** This one is new; the narrative did not mention it. IFACE-008 accepts only activation, normal-recovery and automatic-refund transactions, while FLOW-010, SEC-025, IFACE-019 and FLOW-009 have long-stop or cooperative transactions relayed or broadcast by the platform. It is unclear whether the "existing constrained path" is the IFACE-008 relay, so I recorded it as an open question rather than a conflict. Remove the line if you judge this out of scope.

The guide's callouts state each side and say the point is undecided at every passage that reaches it: the terminal phase, fees, the long-stop and cooperative settlement, and the Open section.

**Another inconsistency, treated as reconciled.** TICKET-0013's resolution and its human-approved/user-specified entry say "No activation, refund, or terminal package is constructed for a zero-confirmation prefund", and the decision overview lists this as a current decision. INV-015 and IFACE-005 record a 29 September 2026 "owner clarification" that zero-confirmation initial signing supersedes that restriction, and that historical ticket answers keep their original scope. Because an owner explicitly reconciles the two, I did not add an open-question line. The guide says the earlier decision was replaced by a later owner clarification, without calling the clarification approved. The ticket and the decision overview still show the old rule as current, so they need a normal-checkpoint update.

## 5. Validator lines mentioning my files

None. The remaining failures are the baseline ui-ux role-split and runtime-evidence ones.

## 6. For the coordinator to check

- `visuals/assets/sources.json` holds a source hash for this domain record. It needs the System Explorer refresh (`--check`).
- **Delivery status wording.** Per the handoffs and repo-001, zero-confirmation construction is a planned BU-003 0.2.1 change that is not yet built ("installed 0.2.0 rejects zero"). The guide says so and does not claim it is implemented. The S fallback is described as selected but not available.
- **P2A omission.** IFACE-005 and INV-010 list a P2A anchor for activation, refund, normal, default and cooperative transactions, but not for the long-stop. The guide does not say whether the long-stop has an anchor.
- **Fee escalation wording.** INV-018 says activation-pending recovery may escalate "through signed tiers or separately approved CPFP", while IFACE-007 says an accepted activation is the sole parent. Both can hold if tier escalation happens only before mempool acceptance. The guide restates INV-018 as written; please confirm no conflict is intended.
- **Cross-guide consistency.** The other domain guides and the architecture guide should describe the 18-package terminal phase, the no-tier fee case and the long-stop relay as open wherever they reach them.
