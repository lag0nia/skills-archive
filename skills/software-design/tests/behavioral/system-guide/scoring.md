# Reader comprehension scoring (T3)

Scored by the coordinating session against [expectations.md](expectations.md) part 3 (SHA-256 in [results.md](results.md#method)). The readers never saw the key. Verdicts:

- **Met:** the answer contains the expected substance and nothing listed as wrong or dangerous.
- **Partial:** the answer is correct as far as it goes, but the guide lacked part of the expected substance. The reader usually said so.
- **Not met:** the guide did not let the reader answer.
- **Wrong:** the answer states something the key lists as wrong or dangerous.

No answer in either run was scored Wrong.

## T2 guides (independent repeat; two guides)

| Guide | Met | Partial | Not met | Notes |
| --- | --- | --- | --- | --- |
| Architecture | 7 | 1 (Q-A7) | 0 | Q-A7: the security-description rule was summarized as "capability per loan state, combinations matter", without the full list of dimensions or the ban on severity words. |
| Base Observation And Fallback Review | 8 | 0 | 0 | |

## T1 guides (full authoring run; six guides, re-exported with the fixed renderer)

| Guide | Met | Partial | Not met | Partial / not met questions |
| --- | --- | --- | --- | --- |
| Architecture | 7 | 1 | 0 | Q-A7 (same gap as T2) |
| Loan Terms And Commitments | 7 | 1 | 0 | Q-L7: the guide does not say that no earlier approval or signing material is revived after reopening |
| Bitcoin Authorization And Recovery | 5 | 2 | 1 | Q-B3: the refund race while activation is pending is omitted (the lender may be left unsecured). Q-B8: the guide omits what a forgotten Vault password blocks and what still works. Q-B6 not met: the two-step Vault confirmation for disclosing a secret is absent from this guide (the architecture guide mentions it) |
| Base USDC Settlement And Funding | 8 | 0 | 0 | Q-S8 met. The guide also reports the single-key beta discrepancy, which exists in the records (upgrade governance selection) but is missing from the key |
| Base Observation And Fallback Review | 7 | 1 | 0 | Q-O3: replay after a Base provider outage is not stated |
| Participant Access And Loan Operations | 5 | 3 | 0 | Q-P5: the reader had to assemble the answer from scattered statements, and "ambiguous outcomes are reconciled, not resubmitted" is missing. Q-P7: the recorded status (demo slice blocked, capability unverified) is missing. Q-P8: one-person approval is missing, and the per-permission limits are blurred |
| **Total (48)** | **39** | **8** | **1** | 0 wrong (corrected from 7 partial: the rows sum to 8) |

## Patterns

1. **Residual risks recorded outside the domain record were dropped.** The activation-pending refund race (an invariant record and a security record) is absent from the T1 architecture and Bitcoin guides. The T1 agent's own architecture re-review, which arrived after T1 handed off, flagged the same omission.
2. **Capability status was dropped.** Two capabilities are selected but not available: verified payment reproduction (it awaits a test vector) and the demo slice (blocked and unverified). The guides describe both as if they were working behavior. T1's participant re-review flagged reproduction. T1's own report says it dropped a "no execution evidence" status statement.
3. **Exclusive words narrowed a rule.** "Blocked only when …" repeats one record's wording, but the same records name more blocking conditions (T1's participant re-review, finding 1).
4. **Authoring rules held in the technical owner were summarized rather than restated** (Q-A7, in both runs). This is acceptable under the ownership split: the exact rule stays in the architecture record, and the guide links to it. A reader of the PDF alone cannot recover the checklist.

Readers in every run asked for a glossary, and for terms such as Vault, package and Base to be defined earlier. Some terms are defined in a guide that the reader of a separate domain PDF does not have.

## T7 guides (rerun after guidance revision v3; six guides, fresh authoring agent and fresh readers)

Same questions, same reader prompts apart from the PDF path, same scorer and verdict rules. Calibration against T1: an answer counts as Met when it has the substance T1's Met answers had; for example Q-B7 without the "all estimators unusable" clause, which neither run's guide stated.

| Guide | Met | Partial | Not met | Partial questions |
| --- | --- | --- | --- | --- |
| Architecture | 6 | 2 | 0 | Q-A7 (same summarized rule as T1 and T2). Q-A8: the guide says what binds an artifact to the loan and that non-binding artifacts are rejected, but not that the shared reference moves no money and proves no chain outcome; T1's guide said this |
| Loan Terms And Commitments | 8 | 0 | 0 | Q-L7 is now met: the guide says no earlier approval or signature can be revived |
| Bitcoin Authorization And Recovery | 6 | 2 | 0 | Q-B3 is now met (activation-pending race, lender bears the risk). Q-B6 moves from not met to partial: the two confirmations are present, but not that the first allows only local preparation or that a failure clears the plaintext. Q-B8: what still works is stated, what a forgotten password blocks is only implied |
| Base USDC Settlement And Funding | 8 | 0 | 0 | |
| Base Observation And Fallback Review | 7 | 1 | 0 | Q-O3: replay after a Base provider outage is still not stated (same gap as T1) |
| Participant Access And Loan Operations | 5 | 3 | 0 | Q-P5 and Q-P8 are now met (lost responses never become new actions; one-person approval). Q-P2: the single-use email confirmation for replacing the Vault password, present in T1's guide, is missing. Q-P6: the guide separates accepted, submitted, observed, final and confirmed, but never says what a completed operation means; the reader inferred it. Q-P7: the demonstration is described by its goal; its recorded status (slice blocked, capability unverified) is still missing |
| **Total (48)** | **40** | **8** | **0** | 0 wrong |

### What changed against T1

- **Fixed (5):** Q-L7, Q-B3, Q-P5, Q-P8 to met; Q-B6 from not met to partial. Q-B3 was the targeted residual-risk omission (pattern 1).
- **Regressed (3):** Q-A8, Q-P2, Q-P6 from met to partial. Each is a fact T1's author kept and T7's author did not, not a rule the revision removed.
- **Unchanged gaps (4):** Q-A7 (accepted ownership split), Q-B8 (narrowed), Q-O3, Q-P7.
- **Capability status (pattern 2) is only partly fixed.** T7 states the status of the validation service, Vault payment accounts and cooperative settlement where it introduces them, but the participant guide's exception paragraph describes payment-account behavior without the status, which the reader noticed ("describes Vault payment accounts as if they already work"), and the demonstration's blocked status is still absent.

One run per condition: a net change of one met answer and one fewer not-met answer is within what a different author or reader could produce by chance. The evidence supports "the targeted omissions were fixed in this run", not "the revision improves comprehension".

## T8 guides (rerun after guidance revision v4; six guides, fresh authoring agent and fresh readers)

Same questions, reader prompts apart from the PDF path, scorer, verdict rules and T7 calibration.

| Guide | Met | Partial | Not met | Partial and not-met questions |
| --- | --- | --- | --- | --- |
| Architecture | 7 | 1 | 0 | Q-A7: weaker than in T1, T2 and T7. The guide no longer summarizes how a threat must be described; it gives only the example that a frontend capturing both participants outranks two unrelated account takeovers, from which the reader inferred the combination point |
| Loan Terms And Commitments | 8 | 0 | 0 | |
| Bitcoin Authorization And Recovery | 7 | 0 | 1 | Q-B6 not met: the guide says only "two-step acceptance"; the two confirmations T7 described are gone (as in T1). Q-B1 met with T7's calibration: prefund versus escrow and the confirmations are clear, but the reader could not say when the loan becomes active, because "package-ready" is used without definition |
| Base USDC Settlement And Funding | 8 | 0 | 0 | |
| Base Observation And Fallback Review | 7 | 1 | 0 | Q-O3: replay after a Base provider outage is still not stated (same gap as T1 and T7) |
| Participant Access And Loan Operations | 6 | 2 | 0 | Q-P4: the guide no longer says what the Vault does before signing (redeem a single-use code, reload and check the exact bytes), which T7's guide said. Q-P8: one-person approval, the mandatory one-time code and the 15-minute operator session, present in T7, are missing |
| **Total (48)** | **43** | **4** | **1** | 0 wrong |

### What changed against T7

- **Fixed (5):** Q-A8 (the guide now says a matching identifier authorizes nothing), Q-B8 (what a forgotten password blocks is listed), Q-P2 (the email confirmation is back), Q-P6 (a workspace label is never evidence of a chain outcome), Q-P7 (the demonstration's recorded status: in progress, not yet runnable, blocked). Q-P7 was the targeted capability-status gap that T1 and T7 both missed.
- **Regressed (3):** Q-B6 (from partial to not met), Q-P4 and Q-P8 (from met to partial). Each is detail T7's author kept and T8's did not; none is a rule the revision removed.
- **Unchanged gaps (2):** Q-A7 (weaker), Q-O3.

Across the three full runs, the partial and not-met answers move between questions from run to run: T1 39/8/1, T7 40/8/0, T8 43/4/1. Facts that one author keeps, the next drops. The evidence supports "the targeted gaps were closed in the run after each revision"; one run per condition cannot separate the revision's effect from author variance.

## T9 guides (full authoring with guidance v5; six guides, fresh authoring agent and fresh readers)

Same questions, verdict rules and T7/T8 calibration, plus Q-A9 and Q-B9 from the [key correction](expectations-v2.md) part 6. Unlike earlier runs, T9's answers were scored by a separate scoring agent that received the key, the correction, this file and the guide sources ([its tables](responses/t9-reader-scoring.md)). The coordinating session checked the regressions against the guide sources: each named gap is absent from the T9 guide.

| Guide | Met | Partial | Not met | Partial and not-met questions |
| --- | --- | --- | --- | --- |
| Architecture | 7 | 0 | 1 | Q-A7 not met: no threat-description content at all |
| Loan Terms And Commitments | 7 | 1 | 0 | Q-L2: the 24-hour reservation limit and its expiry rules are gone |
| Bitcoin Authorization And Recovery | 5 | 3 | 0 | Q-B3: the refund race while activation is pending is gone (T1's omission returns). Q-B6 (improved from not met): both borrower confirmations are back, the lender's side and the cleanup on failure are not. Q-B8: what a forgotten password blocks is gone |
| Base USDC Settlement And Funding | 5 | 3 | 0 | Q-S2, Q-S4: funding and repayment count only at Base finality, which the guide never says. Q-S7: which loans the fallback can help is not said |
| Base Observation And Fallback Review | 7 | 1 | 0 | Q-O3: replay after a provider outage, and the corrected key's split between disagreement and unavailability |
| Participant Access And Loan Operations | 3 | 3 | 2 | Q-P2: the 15-minute window, TOTP and email confirmation are gone. Q-P3 not met: same person in both roles. Q-P4: what the Vault checks before signing (as T8). Q-P5: no stable operation identity. Q-P8 not met: operator limits |
| **Total (48)** | **34** | **11** | **3** | 0 wrong |
| Q-A9, Q-B9 (new) | 0 | 2 | 0 | Neither guide says a thief can broadcast the lender's matured default transaction but cannot redirect its payout; both readers inferred the fixed destination and said so |

### What changed against T8

- **Improved (1):** Q-B6, from not met to partial.
- **Regressed (11):** Q-L2, Q-B3, Q-B8, Q-S2, Q-S4, Q-S7, Q-P2 and Q-P5 (met to partial); Q-P3 (met to not met); Q-A7 and Q-P8 (partial to not met).
- **Unchanged gaps (2):** Q-O3, Q-P4.

Every regression is a fact T8's guide stated and T9's does not. T9's six guides are about 11,800 words against T8's 14,200; the losses sit in the participant, settlement and Bitcoin guides. T1 39/8/1, T7 40/8/0, T8 43/4/1, T9 34/11/3.

## T10 guides (independent scoped repeat with guidance v5; architecture and observation)

Scored by the same scoring agent under the same rules ([tables](responses/t10-reader-scoring.md)).

| Guide | Met | Partial | Not met | Partial and not-met questions |
| --- | --- | --- | --- | --- |
| Architecture | 7 | 1 | 0 | Q-A7: threats are described by exact prerequisites and consequence, not severity, with the shared-frontend example; the full list of dimensions and the "individually insufficient credentials together" point are missing |
| Base Observation And Fallback Review | 7 | 1 | 0 | Q-O3: replay after an outage is now stated; only the corrected key's split between disagreement and unavailability is missing (8/0/0 under the original key alone) |
| **Total (16)** | **14** | **2** | **0** | 0 wrong |
| Q-A9 (new) | 0 | 1 | 0 | As in T9: the no-redirect limit is in no guide |

T10 equals T2, the earlier scoped repeat, on the shared questions (architecture 7/1/0; observation 8/0/0 on the original key). Against T9's same two guides it improves Q-A7 (not met to partial) and narrows Q-O3.

## T12 guides (full authoring with guidance v6; six guides, fresh authoring agent and fresh readers)

The same scoring agent as T9 and T10 scored these answers under the same rules and calibration ([tables](responses/t12-reader-scoring.md)). The coordinating session spot-checked the partials against the guide sources; each named gap is absent from the guide the reader had.

| Guide | Met | Partial | Not met | Partial and not-met questions |
| --- | --- | --- | --- | --- |
| Architecture | 7 | 1 | 0 | Q-A7: threats are analysed by the capability lost, the loan state and shared failure domains, with blast radius and controls; the ban on severity words and the other dimensions are missing |
| Loan Terms And Commitments | 7 | 1 | 0 | Q-L7: no earlier approval or signing material is revived after cancellation (as T1) |
| Bitcoin Authorization And Recovery | 6 | 2 | 0 | Q-B3: no "activation pending", and acceptance and activation are not said to be non-atomic (the architecture guide has it). Q-B6: both borrower confirmations, but not what the first permits or the cleanup on failure |
| Base USDC Settlement And Funding | 7 | 1 | 0 | Q-S7: the fallback's eligibility conditions, and that the Bitcoin stays unspent until another route confirms |
| Base Observation And Fallback Review | 6 | 2 | 0 | Q-O3: no replay after a Base outage (unchanged in every full run). Q-O7: finalization checks cut to "publication and hash"; the race is stated only for loans without Y or S |
| Participant Access And Loan Operations | 7 | 1 | 0 | Q-P8: the operator-specific prohibitions and one-person approval (the architecture guide has the prohibitions) |
| **Total (48)** | **40** | **8** | **0** | 0 wrong |
| Q-A9, Q-B9 (new) | 1 | 1 | 0 | Q-A9 met for the first time. Q-B9 partial: the Bitcoin guide never discusses a stolen signed package |

### What changed against T9 and T8

- **Against T9 (34/11/3):**
  - Eight fixed to met: Q-L2, Q-B8, Q-S2, Q-S4, Q-P2, Q-P3, Q-P4 and Q-P5.
  - Q-A7 and Q-P8 move from not met to partial.
  - Q-L7 and Q-O7 regress from met to partial.
  - Q-B3, Q-B6, Q-S7 and Q-O3 are unchanged.
- **Against T8 (43/4/1):**
  - Q-P4 is fixed to met, and Q-B6 moves from not met to partial.
  - Q-L7, Q-B3, Q-S7 and Q-O7 regress from met to partial.
  - Q-A7, Q-O3 and Q-P8 are unchanged.

T12 is the first full run with no not-met answer. Three of its partials (Q-B3, Q-P8, Q-B9) are facts that the T12 architecture guide states and the reader's domain guide omits. T1 39/8/1, T7 40/8/0, T8 43/4/1, T9 34/11/3, T12 40/8/0.

## T13 guides (independent scoped repeat with guidance v6; architecture and observation)

The same scoring agent scored these answers ([tables](responses/t13-reader-scoring.md)).

| Guide | Met | Partial | Not met | Partial and not-met questions |
| --- | --- | --- | --- | --- |
| Architecture | 7 | 1 | 0 | Q-A7: the combination rationale is explicit ("each stolen piece looks harmless alone"), but how a threat must be described is not, which is the opposite half from T10 |
| Base Observation And Fallback Review | 7 | 1 | 0 | Q-O3: the correction's split between disagreement and outage only; 8/0/0 under the original key alone |
| **Total (16)** | **14** | **2** | **0** | 0 wrong |
| Q-A9 (new) | 0 | 1 | 0 | The architecture guide does not discuss package theft. The T13 observation guide does say "anyone holding the exported package can broadcast it", but the architecture reader did not have that guide |

T13 equals T10 and T2 on every shared question. The correction's Q-O3 split turned out to be an error in the key ([results](results.md#answer-key-errors-found-by-reviewers)): TICKET-0053 gives disagreement and outage one rule and one five-minute alert. T10's and T13's Q-O3 partials rest on that split alone, so in substance both observation guides meet Q-O3.
