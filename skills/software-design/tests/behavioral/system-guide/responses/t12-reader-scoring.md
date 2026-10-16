# T12 reader comprehension scoring (full run, revised skill)

Scored against expectations.md part 3 as amended by expectations-v2.md (Q-S8 and Q-O3 amended, Q-B8 widened, Q-A9 and Q-B9 added). The verdict definitions and the T7/T8 calibration come from scoring.md, applied as in the [T9 scoring](t9-reader-scoring.md). The answer counts as Met when it has the substance T1's Met answers had. A correct inference by the reader from facts the guide does state is Partial when the guide lacks the fact itself. "Guide gap" means the guide source (snap-t12 `guide/`) does not hold the missing substance. The reader prompts match T9's apart from the PDF path.

## Architecture

| Question | Verdict | Note |
| --- | --- | --- |
| Q-A1 | Met | Bitcoin consensus; Base events at Base L1 finality (about 20 minutes); everything else provisional. |
| Q-A2 | Met | |
| Q-A3 | Met | |
| Q-A4 | Met | Also gives the demo status (a target, blocked). |
| Q-A5 | Met | The fallback is limited to loans created after activation, with S's hash built in before signing. The answer has the race, the first confirmed spend and the residual risk. |
| Q-A6 | Met | All three v1 conflicts are present, plus 2h-5 (the beta upgrade key and the effect on existing loans) and the on-chain pause, all undecided. |
| Q-A7 | Partial | Guide gap. Threats are "analysed by the exact capability lost, the loan state and whether supposedly independent controls share a failure domain", with blast radius and controls. The guide never bans severity words and lacks the attack window, the fixed-versus-chosen destination, implemented-versus-ticketed controls and the recovery opportunity. The reader derived the combination rationale from the shared-failure-domain example (the malicious Vault release capturing both keys) and said so. This is the same level as T1, T2, T7 and T10. |
| Q-A8 | Met | |
| Q-A9 (new) | Met | First time met. The guide says a stolen signed lender package can be broadcast once its timelock matures. It also says the package pays the lender's fixed destination "even after the borrower repaid", and that holding a package "is not permission to choose a new destination". Collusion and extortion are not named, but the harm to the borrower after repayment is. |

## Loan Terms And Commitments

| Question | Verdict | Note |
| --- | --- | --- |
| Q-L1 | Met | |
| Q-L2 | Met | The 24-hour limit is back. |
| Q-L3 | Met | |
| Q-L4 | Met | |
| Q-L5 | Met | |
| Q-L6 | Met | |
| Q-L7 | Partial | Guide gap, the same as T1. The guide says cancellation is permanent and that reopening needs the next reservation number and a fresh identifier. It does not say that no earlier approval or signing material is revived (T7 to T9 did). The reader said what carries over is only partly answered and inferred it from the new identifier. |
| Q-L8 | Met | |

## Bitcoin Authorization And Recovery

| Question | Verdict | Note |
| --- | --- | --- |
| Q-B1 | Met | |
| Q-B2 | Met | Notes the 12-versus-18 conflict. |
| Q-B3 | Partial | Guide gap, the same as T9. This guide never names "activation pending" and never says that Base payment and activation are not atomic, so the lender is unsecured if the prefund refund confirms first. The reader said the refund race is not addressed. The T12 architecture guide does state it, but that guide is not this reader's document. |
| Q-B4 | Met | |
| Q-B5 | Met | |
| Q-B6 | Partial | Guide gap. The two confirmations are present. The guide does not say the first permits only local preparation (the reader: "does not say exactly what this step permits"), or that a failure clears the plaintext. |
| Q-B7 | Met | Includes the all-estimators-unusable rule (no automatic broadcast; an operator may record only an existing signed level). |
| Q-B8 | Met | What is blocked, what still works, the lender's residual risk and no recovery. |
| Q-B9 (new) | Partial | Guide gap. This guide discusses a stolen loan key but not a stolen signed package. The reader inferred "broadcast at D+3 days, to the lender's committed destination" from the fixed-destination rule. |

## Base USDC Settlement And Funding

| Question | Verdict | Note |
| --- | --- | --- |
| Q-S1 | Met | |
| Q-S2 | Met | Base L1 finality is restored. The reader noticed one paragraph omits it. |
| Q-S3 | Met | |
| Q-S4 | Met | |
| Q-S5 | Met | |
| Q-S6 | Met | |
| Q-S7 | Partial | Guide gap, the same as T9. The guide names the refund as "the only positive Base trigger for the optional Bitcoin fallback". It does not say which loans are eligible (the v2 O-16 conditions) or that the Bitcoin stays unspent until another route confirms. The reader asked what the fallback does. |
| Q-S8 | Met | Under v2: the Safe and timelock, the beta key and the effect on running loans as open, immutable vaults and the pause as open. Direct exits remaining callable is in the guide but not in the answer, a minor reader miss. |

## Base Observation And Fallback Review

| Question | Verdict | Note |
| --- | --- | --- |
| Q-O1 | Met | |
| Q-O2 | Met | |
| Q-O3 | Partial | Guide gap, unchanged in every full run. There is no replay after a Base outage (replay appears only for reorganizations and Bitcoin), no five-minute alert and no v2 split. |
| Q-O4 | Met | |
| Q-O5 | Met | |
| Q-O6 | Met | |
| Q-O7 | Partial | Guide gap. Bitcoin finalization is described only as checking "the publication and hash". The gate, the binding to the event, the retained package and signature, the outputs and the unspent escrow are not listed. The guide states the race against the lender's route only for the case without Y or S, never for an S recovery that has not yet confirmed. The reader inferred the race with low confidence. |
| Q-O8 | Met | Includes "empty or unreachable is not proof of withholding". |

## Participant Access And Loan Operations

| Question | Verdict | Note |
| --- | --- | --- |
| Q-P1 | Met | |
| Q-P2 | Met | 15 minutes, TOTP if enrolled, single-use email confirmation. |
| Q-P3 | Met | |
| Q-P4 | Met | Single-use code in the web address; the Vault signs the participant in afresh, redeems once and reloads the exact action "rather than trusting the page". What the code is bound to is not listed, which is acceptable under the calibration. |
| Q-P5 | Met | Stable operation identity, same-key-same-body versus changed-body, atomic outbox, revalidation, and the payment timeout rule. |
| Q-P6 | Met | |
| Q-P7 | Met | |
| Q-P8 | Partial | Guide gap. The separate login, the three levels, a fixed review and incident list and the audit are present. Missing: one-person approval, the actual list of actions, and the operator-specific prohibitions (amounts, recipients, chain facts, secrets). The architecture guide has those prohibitions, but this guide does not. |

## Totals

| Guide | Met | Partial | Not met | Wrong |
| --- | --- | --- | --- | --- |
| Architecture (8 shared) | 7 | 1 | 0 | 0 |
| Loan Terms And Commitments | 7 | 1 | 0 | 0 |
| Bitcoin Authorization And Recovery (8 shared) | 6 | 2 | 0 | 0 |
| Base USDC Settlement And Funding | 7 | 1 | 0 | 0 |
| Base Observation And Fallback Review | 6 | 2 | 0 | 0 |
| Participant Access And Loan Operations | 7 | 1 | 0 | 0 |
| **Total, 48 shared questions** | **40** | **8** | **0** | **0** |
| Q-A9 and Q-B9 (new) | 1 | 1 | 0 | 0 |
| **Total, 50 questions** | **41** | **9** | **0** | **0** |

With the new questions, Architecture is 8/1/0 and Bitcoin 6/3/0.

## Comparison with T9 (48 shared; T9 34 / 11 / 3, T12 40 / 8 / 0)

- **Fixed to Met (8):**
  - Q-L2 (24-hour reservation)
  - Q-B8 (password-loss consequences)
  - Q-S2 and Q-S4 (Base finality)
  - Q-P2 (15 minutes, TOTP, email confirmation)
  - Q-P3 (both roles, different loans)
  - Q-P4 (fresh session, single redemption, reload rather than trust the page)
  - Q-P5 (operation identity, changed-body rejection)
- **Improved from not met to partial (2):** Q-A7 (the threat-analysis criteria are back) and Q-P8 (login, levels and audit are back).
- **Regressed from Met to partial (2):** Q-L7 (no revival of old approvals or signing material) and Q-O7 (the full finalization checks and the race for a pending S recovery).
- **Unchanged partial (4):** Q-B3, Q-B6, Q-S7 and Q-O3.
- **Unchanged Met:** the other 32.
- **New questions:** Q-A9 goes from partial to Met, because the architecture guide now states the A-16 fact. Q-B9 stays partial, because the Bitcoin guide still does not.

## Comparison with T8 (48 shared; T8 43 / 4 / 1, T12 40 / 8 / 0)

- **Fixed (2):** Q-P4 goes from partial to Met. Q-B6 goes from not met to partial (the two confirmations are present; what the first permits and the plaintext clearing are not).
- **Regressed from Met to partial (4):** Q-L7, Q-B3, Q-S7 and Q-O7.
- **Unchanged partial (3):** Q-A7, Q-O3 and Q-P8.
- **Unchanged Met:** the other 39.

## What this shows

T12 is the first full run with no not-met answer. Its 40 Met answers are four below T8 and six above T9. The T9 regressions in the participant and settlement guides are all repaired. The remaining partial answers are recurring gaps:

- **Missing in every full run:** Q-O3 (replay after an outage, the split) and Q-A7 (the full threat-description rule).
- **Missing in some runs:** Q-B3 (the refund race, stated in this run's architecture guide but not in its Bitcoin guide), Q-B6 and Q-S7.
- **Stated in one guide but not repeated in the domain guide that a reader of that domain uses:** Q-A9 versus Q-B9, Q-B3, and the operator prohibitions in Q-P8.

One run per condition still cannot separate the skill revision from author variance.
