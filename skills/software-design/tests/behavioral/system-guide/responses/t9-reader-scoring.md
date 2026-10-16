# T9 reader comprehension scoring

Scored against expectations.md part 3 as amended by expectations-v2.md (Q-S8 and Q-O3 amended, Q-B8 widened, Q-A9 and Q-B9 added). Verdict definitions and the T7/T8 calibration are the same as in scoring.md: an answer is Met when it has the substance T1's Met answers had. A reader's correct inference from facts the guide does state counts as Partial when the guide lacks the fact itself (as for T8 Q-A7). "Guide gap" means the guide source (snap-t9 `guide/`) does not hold the missing substance. "Reader miss" means the guide holds it and the reader left it out.

## Architecture

| Question | Verdict | Note |
| --- | --- | --- |
| Q-A1 | Met | Bitcoin consensus, Base contract events, application status provisional. The guide says "required finality" and never names Base L1 finality; the reader noted that it is not quantified. |
| Q-A2 | Met | |
| Q-A3 | Met | |
| Q-A4 | Met | |
| Q-A5 | Met | The fallback is limited to "a loan created with the activated ECVS capability", and the answer keeps the first-confirmed-spend race. |
| Q-A6 | Met | All three v1 conflicts and 2h-5 are listed as undecided ("None is decided here"). |
| Q-A7 | Not met | Guide gap. The guide has no security-change-control content: no ban on severity words, no list of dimensions and no combination rationale. The reader said the first part is not answered and could only gesture at the second. In T8 the guide at least had the combination example. |
| Q-A8 | Met | One canonical agreement and its hash, a separate deployment description, mismatches rejected, "not a wallet, a signing key or a fact about chain state". |
| Q-A9 (new) | Partial | Guide gap. The guide never discusses theft, never says the default transaction pays a fixed lender destination that a holder cannot redirect, and never mentions collusion, extortion or sabotage. The reader inferred "broadcast once valid, to the lender's agreed address" from "fixed transactions" and "never chooses a destination", and labeled it as inference. |

## Loan Terms And Commitments

| Question | Verdict | Note |
| --- | --- | --- |
| Q-L1 | Met | Standing approval of commercial values only, the open conflict with both sides, funding decided separately. |
| Q-L2 | Partial | Guide gap. The guide no longer gives the 24-hour reservation limit or any expiry rule (T8's guide did), and it does not say there is no funding, Bitcoin movement or signing authority yet. The reader flagged the missing timing rules. |
| Q-L3 | Met | |
| Q-L4 | Met | The reader inferred that destinations are hashed fields. The identical-retry clause is in the guide but missing from the answer, which is a minor reader miss. |
| Q-L5 | Met | |
| Q-L6 | Met | |
| Q-L7 | Met | |
| Q-L8 | Met | |

## Bitcoin Authorization And Recovery

| Question | Verdict | Note |
| --- | --- | --- |
| Q-B1 | Met | |
| Q-B2 | Met | 6+6 before, 18 after, and the 12-versus-18 conflict is noted in the reader's gaps section. |
| Q-B3 | Partial | Guide gap. The guide neither names the "activation pending" status nor says that Base payment and Bitcoin activation are not atomic, so a prefund refund confirming first leaves the lender unsecured. The reader said both are missing. This is the T1 omission (pattern 1) returning. |
| Q-B4 | Met | Same transaction, same output and signature, for loans created with the capability. L1 finality and platform broadcast are not stated; acceptable under the calibration. |
| Q-B5 | Met | |
| Q-B6 | Partial | Guide gap. The two confirmations are back: the first allows only preparation of the exact transaction, and the second, bound to the bytes, allows signing and submission. Missing: a failure clears the plaintext, and the lender's equivalent steps. |
| Q-B7 | Met | |
| Q-B8 | Partial | Guide gap. The guide says only that product account recovery cannot recreate the password and that this version cannot recover it. It does not say what is blocked (new signing, disclosure, cooperative settlement) or that fully signed packages still work. The reader said so. |
| Q-B9 (new) | Partial | Guide gap, as for Q-A9. The reader inferred "broadcast after maturity, to its fixed output" from "not permission ... to choose a new destination", and noted the guide never says what the output is or that theft is discussed anywhere. |

## Base USDC Settlement And Funding

| Question | Verdict | Note |
| --- | --- | --- |
| Q-S1 | Met | |
| Q-S2 | Partial | Guide gap. The guide never says the finalization event must reach Base (L1) finality before the loan counts as funded. It says only that the observation domain "qualifies" events. The answer stops at the contract call. |
| Q-S3 | Met | "No one can accept for the borrower" is not stated in this guide (the architecture guide has it). Acceptable under the calibration. |
| Q-S4 | Partial | Guide gap, same as Q-S2. The rest (exact debt, repayment vault, by D, payer neutral, a balance is not repayment) is present. |
| Q-S5 | Met | |
| Q-S6 | Met | |
| Q-S7 | Partial | Guide gap. The guide says the refund event is the only trigger for "the separate fallback that might publish a secret". It does not say which loans are eligible (H(S) committed at creation and the activation gate, amendment O-16), or that the Bitcoin stays unspent until another route confirms. The reader asked why "might". |
| Q-S8 | Met | Under v2: Safe plus timelock, the beta key, the open question whether it is the forbidden unilateral key, the open effect on running loans, immutable vaults, direct calls surviving a product pause, and the on-chain pause given as open (accepted under 2h-8). |

## Base Observation And Fallback Review

| Question | Verdict | Note |
| --- | --- | --- |
| Q-O1 | Met | |
| Q-O2 | Met | Also reports the one-provider tension. |
| Q-O3 | Partial | Guide gap, unchanged from T1, T7 and T8. There is no replay after a Base provider outage (replay is stated only for reorganizations and Bitcoin), and the v2 split is missing: a disagreement means a conflict with no override until canonical replay, while unavailability means data shown as delayed with an alert after 5 minutes. |
| Q-O4 | Met | |
| Q-O5 | Met | Gate, per-loan S with only H(S) returned, commitment before construction and signing, no later addition. |
| Q-O6 | Met | |
| Q-O7 | Met | |
| Q-O8 | Met | The guide does not say that an empty or unreachable result is not proof of withholding; this is acceptable under the calibration (met in T7 and T8). |

## Participant Access And Loan Operations

| Question | Verdict | Note |
| --- | --- | --- |
| Q-P1 | Met | |
| Q-P2 | Partial | Guide gap. The guide only names "fresh reauthentication and MFA" as owned. It drops the 15-minute window, TOTP if enrolled, and the single-use email confirmation for replacing the Vault password, all of which T8's guide had. The reader said the triggers are not stated. |
| Q-P3 | Not met | Guide gap. Nothing says one person may hold both roles on different loans but never both on the same loan. The reader said it is not answered. |
| Q-P4 | Partial | Guide gap, unchanged from T8. Short-lived single-use code, yes. Missing: the URL fragment and what the code is bound to, the separate origin requiring the same participant's fresh session, redeeming once, reloading and validating the canonical action, and never signing bytes supplied only by the product page. The guide's "not a general signing token" is the one-direction wording that v2 P-6 flags. The reader did not turn it into "the link authorizes the signature", so the answer is not Wrong. |
| Q-P5 | Partial | Mostly a guide gap: there is no stable operation identity, and no rule that a same-body retry returns the operation and a changed body is rejected (the reader asked how a retry is recognized). There is also a reader miss: the guide says a timeout after signing has begun is not proof of non-submission and that the bytes are restored or the account stays visibly blocked, but the answer omits it. |
| Q-P6 | Met | "A completed worker ... does not mean chain finality" is explicit, and the workspace shows sourced provisional or final status. |
| Q-P7 | Met | The status is present (not delivered, supervisor in progress, browser check planned and unverified). Loopback only and "demo credentials rejected elsewhere" are not in this guide; acceptable under the calibration. |
| Q-P8 | Not met | Guide gap. The guide says only that operator access is separate, and that an operator may trigger a reprobe or an identical retry of a payment. It has no levels, no Cloudflare Access/TOTP/15-minute login, no fixed action list, no one-person approval, no audit and no prohibitions. |

## Totals

| Guide | Met | Partial | Not met | Wrong |
| --- | --- | --- | --- | --- |
| Architecture (8 shared) | 7 | 0 | 1 | 0 |
| Loan Terms And Commitments | 7 | 1 | 0 | 0 |
| Bitcoin Authorization And Recovery (8 shared) | 5 | 3 | 0 | 0 |
| Base USDC Settlement And Funding | 5 | 3 | 0 | 0 |
| Base Observation And Fallback Review | 7 | 1 | 0 | 0 |
| Participant Access And Loan Operations | 3 | 3 | 2 | 0 |
| **Total, 48 shared questions** | **34** | **11** | **3** | **0** |
| Q-A9 and Q-B9 (new) | 0 | 2 | 0 | 0 |
| **Total, 50 questions** | **34** | **13** | **3** | **0** |

With the new questions, Architecture is 7/1/1 and Bitcoin is 5/4/0.

## Comparison with T8 (48 shared questions)

T8: 43 Met / 4 Partial / 1 Not met. T9: 34 / 11 / 3.

- **Fixed or improved (1):**
  - Q-B6 moves from not met to partial. The guide again describes both confirmations and what the first one permits (preparation only). It still omits plaintext clearing.
- **Regressed (11):**
  - Met to partial (8): Q-L2 (24-hour reservation), Q-B3 (activation-pending refund race, the T1 pattern-1 omission is back), Q-B8 (what a forgotten password blocks and what still works, which T8 had fixed), Q-S2 and Q-S4 (Base finality condition), Q-S7 (fallback eligibility conditions), Q-P2 (15 minutes, TOTP, email confirmation), Q-P5 (operation identity and changed-body rejection).
  - Met to not met (1): Q-P3 (same person, both roles).
  - Partial to not met (2): Q-A7 (no security-description content at all) and Q-P8 (operator capabilities and limits almost entirely absent).
- **Unchanged (2):** Q-O3 (partial in every run) and Q-P4 (partial, as in T8).
- **Unchanged Met:** the other 34 questions.

Every regression is a guide gap, except a small reader miss inside Q-P5. In each case the substance is absent from the T9 guide source, and T8's guide had it. The T9 guides are about 16 percent shorter than T8's (about 11,800 words against 14,200). The dropped material is concentrated in the participant guide (security checks, roles, operators), the settlement guide (Base finality, fallback eligibility) and the Bitcoin guide (residual risks and password-loss consequences). No answer was Wrong.

The two new questions are partial in both guides. Neither the architecture guide nor the Bitcoin guide states the A-16/B-16 fact (a holder can broadcast but not redirect, and may collude, extort or sabotage). Both readers reached the core answer only by inference and said so.
