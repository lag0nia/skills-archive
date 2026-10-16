# T10 reader comprehension scoring (scoped repeat)

T10 is an independent scoped run with two guides, written by a different author on a separate package copy. Scored against expectations.md part 3 as amended by expectations-v2.md, which amends Q-O3 and adds Q-A9. The verdict definitions and the T7/T8 calibration from scoring.md apply, as in the [T9 scoring](t9-reader-scoring.md). As there, when the guide lacks a fact and the reader infers it correctly from facts the guide does state, the answer is Partial. The guide sources are in snap-t10 `guide/architecture.md` and `guide/domains/base-observation-and-fallback-review.md`. The reader prompts match T9's apart from the PDF path.

## Architecture

| Question | Verdict | Note |
| --- | --- | --- |
| Q-A1 | Met | Bitcoin consensus; Base contract events at "Base's final settlement point", which the guide later names as layer-1 finality (about 20 minutes); application status provisional. |
| Q-A2 | Met | |
| Q-A3 | Met | Same for Q-A4. |
| Q-A4 | Met | Same for Q-A3. |
| Q-A5 | Met | The fallback is limited to "loans built after the fallback service is activated". The answer keeps the race, the first-confirmed-spend rule and the 10-day long-stop. |
| Q-A6 | Met | Lender approval, the 12-versus-18 package count and fee selection are all given as undecided. The beta upgrade key (2h-5) is also listed, though the guide files it under "smaller points" that might reconcile rather than as a recorded conflict. |
| Q-A7 | Partial | Guide gap, and the same level as T1, T2 and T7. The guide says each attack combination has one primary threat record that "states its exact prerequisites and consequence rather than a severity label", and gives the shared-frontend example. It lacks the full list of dimensions (window, fixed or attacker-chosen destination, blast radius, implemented versus ticketed controls, recovery) and never says that individually insufficient credentials can be sufficient together. The reader inferred the combination point and labeled it as inference. |
| Q-A8 | Met | "Neither binding is itself a wallet, key, source of funds or chain fact." |
| Q-A9 (new) | Partial | Guide gap, as in T9. The guide never discusses theft of a package, never says a holder cannot redirect the payout, and never mentions collusion, extortion or sabotage. The reader inferred "broadcast once valid, Bitcoin to the lender's committed destination" from "every route is pre-signed to a fixed destination", and labeled it as inference. |

## Base Observation And Fallback Review

| Question | Verdict | Note |
| --- | --- | --- |
| Q-O1 | Met | |
| Q-O2 | Met | |
| Q-O3 | Partial | The v1 substance is complete for the first time in any run. Finalized facts stay visible, no new Base-dependent action is taken, and the observer replays missed events from its cursor after recovery. The gap is only the v2 split: the guide puts "both unavailable" and "two healthy providers disagree" under one rule with one five-minute alert, which v2 calls a Minor merge. It also never says that a disagreement is a conflict held until canonical replay. The reader noticed that "delayed" is stated only for outages. Under v1 alone this would be Met. |
| Q-O4 | Met | |
| Q-O5 | Met | |
| Q-O6 | Met | The full independent check list is present. |
| Q-O7 | Met | |
| Q-O8 | Met | Includes "an empty or unreachable answer is not proof that the service deliberately withheld S", which the T9 guide lacked. |

## Totals

| Guide | Met | Partial | Not met | Wrong |
| --- | --- | --- | --- | --- |
| Architecture (8 shared) | 7 | 1 | 0 | 0 |
| Base Observation And Fallback Review (8 shared) | 7 | 1 | 0 | 0 |
| **Total, 16 shared questions** | **14** | **2** | **0** | **0** |
| Q-A9 (new) | 0 | 1 | 0 | 0 |
| **Total, 17 questions** | **14** | **3** | **0** | **0** |

Architecture with Q-A9 is 7/2/0. Under v1 alone (without the Q-O3 amendment), Observation would be 8/0/0.

## Comparison

### With T9 (same two guides)

| Guide | T9 | T10 | Change |
| --- | --- | --- | --- |
| Architecture (8 shared) | 7 / 0 / 1 | 7 / 1 / 0 | Q-A7 improves from not met to partial: the T10 guide states the no-severity-label rule and the prerequisites-and-consequence requirement, which the T9 guide dropped entirely. |
| Q-A9 | Partial | Partial | Unchanged. Neither guide states the A-16 fact. |
| Observation | 7 / 1 / 0 | 7 / 1 / 0 | The count is the same, but Q-O3's gap narrows. T9 lacked both replay after an outage and the split. T10 has the replay and lacks only the v2 split. |

- **No regressions** against T9.
- **Q-A1** is met in both runs, and the T10 guide names layer-1 finality where T9 said only "required finality".
- **Q-O8** is met in both runs, and T10 adds the "empty or unreachable is not proof of withholding" clause.

### With T2 (the earlier scoped repeat, scored under v1)

| Guide | T2 | T10 | Change |
| --- | --- | --- | --- |
| Architecture | 7 / 1 / 0 (Q-A7) | 7 / 1 / 0 (Q-A7) | Identical. Q-A7 is partial for the same reason, a summarized rule without the full dimension list. |
| Observation | 8 / 0 / 0 | 7 / 1 / 0 under v2; 8 / 0 / 0 under v1 | The only difference is the v2 amendment to Q-O3. On the v1 key, T10 matches T2. |

Q-A9 did not exist in T2.

### What this shows

Both scoped repeats reach the same comprehension level on the shared questions: architecture partial only on Q-A7, observation complete on the v1 key. The T9 full run's Q-A7 not-met is therefore author variance, not a guidance effect, since a different author working from the same guidance restored the T1/T2/T7 level. The two gaps in this scoped run are:

- **Q-A9:** no guide has yet stated the no-redirection fact.
- **Q-O3:** the outage and disagreement cases are merged. The same merge is a Minor defect under v2 3 (amended O-4).
