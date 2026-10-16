# Independent bounded editorial review

The architecture now works as a system introduction: it introduces participants, cross-chain cooperation, the acceptance exposure and recovery races before the detailed limits. Domain guides retain the substantive explanations of T23 and the original Domain Overview sections. I found no confirmed material factual regression in the revised passages. The inherited omissions listed in T23 are not new losses; the revised text repairs the activation exposure, handoff authority, plaintext cleanup and both-role preparation omissions. Low-level architecture omissions are appropriate to its intended level.

Two small editorial corrections remain. Neither requires a design choice or expanded authoring exercise.

## 1. Introduce the remaining notation in the standalone Base domain guide

File: `skills/blueprint-development/technical/software-design/tests/behavioral/system-guide/outputs/editorial-final/guide/domains/base-usdc-settlement-and-funding.md`, lines 17 and 21.

Quotes: “The borrower must intentionally disclose `X`”; “Exact debt must be finalized no later than `D`”; “claim by revealing `Y`”.

X and Y are never identified here as the borrower's acceptance secret and lender's claim secret, and D is never explicitly introduced as the repayment deadline. The other guides supply these explanations, but this domain is intended to work as a separate PDF. This is inherited from the original/T23 prose, not a new factual regression. Add short first-use definitions, especially “the repayment deadline, D”; no additional mechanics are needed.

Source evidence: original package `system-model/contracts/interfaces/iface-001-loan-terms-and-canonical-binding.md`, lines 48–51, distinguishes the two secret commitments; `system-model/behavior/flows/flow-002-activation-completion-and-active-entry.md`, rows 4–5, gives borrower X acceptance; `system-model/behavior/flows/flow-004-normal-repayment-close.md`, rows 1–4, gives repayment D and lender Y claim. `references/system-guide.md` requires standalone domain explanations; `references/guide-writing.md` principle 1 requires first-use introductions.

## 2. Remove reconciliation history from the Bitcoin fee question

File: `skills/blueprint-development/technical/software-design/tests/behavioral/system-guide/outputs/editorial-final/guide/domains/bitcoin-authorization-and-recovery.md`, line 43.

Quote: “as an earlier explanation says a former decision did; the records could not locate that decision.”

This retained T23 qualification is careful about evidence, but asks the newcomer to follow the history of an unlocated decision after the actual competing behaviors are already clear. Keep the two interpretations (largest tier with an alert versus fail closed), state that the choice remains open, and link the technical record for the reconciliation history. This preserves meaning without repeating uncertain attribution in the reader narrative.

Source evidence: T23 `change-lists.md`, C7, records why the attribution was narrowed and that the technical domain record holds the reconciliation. Revised `references/system-guide.md`, Open Questions step 3, puts detailed source reconciliation and attribution in technical records; `references/guide-writing.md`, principle 6, keeps verification disputes and history there. The uncertainty itself must remain.

## Accuracy and instruction checks

The narrow owner checks support the revised MFA wording: STATE-003 conditions fresh TOTP on enrollment, while FLOW-004 lists fresh reauthentication/MFA without that qualification. Keeping this as an open reconciliation point does not invent universal MFA. FLOW-001 supports both-role preparation, fixed initial signing roles and primary archive readiness; FLOW-002 supports the two confirmations, pending activation and confirmed-parent terminal signing sequence. SR-007 supports the ECVS production gate before H(S), independent refund verification, fixed recovery transaction and remaining Bitcoin race. The architecture's key/capital/recipient separation and Cloudflare outage account agree with the original architecture's authority and topology sections. Long-stop and package-count uncertainties remain explicitly open rather than silently selected.

The revised writing references distinguish architecture depth from domain depth and technical-record precision. I found no confirmed conflicting excessive rule requiring another change in this bounded pass. Repeated short local uncertainty markers are useful qualifications, not obstructive repetition. The two findings above are editorial, not reasons to reopen the design or rerun authoring experiments.

Review only: no guide, owner or instruction files were edited.

## Confirmed corrections and author recheck

Both findings were corrected: X, Y and D have first-use definitions in Base; Bitcoin retains the two fee interpretations and links its domain record for historical reconciliation. The affected passages were rechecked against the review's cited owners. Observation's long-stop explanation was shortened without choosing a side. Redundant generated architecture navigation was removed because the scope note and Markdown closing link already supply it; visual checks cover the resulting pagination.
