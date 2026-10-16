# T13 reader comprehension scoring (scoped repeat, revised skill)

T13 is a scoped run with two guides, written by a different author on a separate package copy. It is scored against expectations.md part 3 as amended by expectations-v2.md, which amends Q-O3 and adds Q-A9. The verdict definitions and the T7/T8 calibration come from scoring.md, applied as in the [T10 scoring](t10-reader-scoring.md). The guide sources are snap-t13 `guide/architecture.md` and `guide/domains/base-observation-and-fallback-review.md`. The reader prompts match T9's and T10's apart from the PDF path.

## Architecture

| Question | Verdict | Note |
| --- | --- | --- |
| Q-A1 | Met | Bitcoin consensus; Base contract events final on Ethereum (about 20 minutes); application status provisional. |
| Q-A2 | Met | |
| Q-A3 | Met | |
| Q-A4 | Met | Includes the status (not yet runnable, blocked). |
| Q-A5 | Met | The fallback applies only to a loan set up with it ("none can be until counsel approval and implementation evidence activate it"). The answer has the D+3 lender route, the D+10 long-stop, the first confirmed spend and the residual risk. |
| Q-A6 | Met | The three v1 conflicts and 2h-5 (the beta key) are given as undecided, with no side chosen. The guide also lists the expiry of an unused reservation as open; v2 calls that reconciled by scope. That belongs to the guide review, not to this verdict. |
| Q-A7 | Partial | Guide gap, the other half from T10. The guide gives the combination rationale explicitly: the system cannot make a combination of compromises safe "merely because each stolen piece looks harmless alone", and the security records analyse realistic combinations. It says nothing about how a threat must be described: no ban on severity words and no dimensions. The reader said that part is not answered. |
| Q-A8 | Met | |
| Q-A9 (new) | Partial | Guide gap, as in T9 and T10. There is no discussion of package theft, and the default transaction's destination is not stated. The reader inferred the fixed destination and the race after D+3, and labeled it as inference. The T13 observation guide does say that "anyone holding the exported package can broadcast it" to the lender's fixed destination, but the architecture guide does not. |

## Base Observation And Fallback Review

| Question | Verdict | Note |
| --- | --- | --- |
| Q-O1 | Met | |
| Q-O2 | Met | |
| Q-O3 | Partial | Same as T10. The v1 substance is complete: finalized projections stay visible, new Base-dependent actions stop, and replay runs from the cursor after recovery. The v2 split is missing, because disagreement and double outage share one rule and one five-minute alert. Under v1 alone this is Met. |
| Q-O4 | Met | |
| Q-O5 | Met | |
| Q-O6 | Met | The full independent check list is present. |
| Q-O7 | Met | The full finalization check list, fee variant selection, the open fee conflict, and the point that publication is not submission and submission is not confirmation. |
| Q-O8 | Met | Includes the "not proof of withholding" clause, the incident path, both timelocked routes and cooperation. |

## Totals

| Guide | Met | Partial | Not met | Wrong |
| --- | --- | --- | --- | --- |
| Architecture (8 shared) | 7 | 1 | 0 | 0 |
| Base Observation And Fallback Review (8 shared) | 7 | 1 | 0 | 0 |
| **Total, 16 shared questions** | **14** | **2** | **0** | **0** |
| Q-A9 (new) | 0 | 1 | 0 | 0 |
| **Total, 17 questions** | **14** | **3** | **0** | **0** |

With Q-A9, Architecture is 7/2/0. Under v1 alone (without the Q-O3 amendment), Observation is 8/0/0.

## Comparison with T10 (the previous scoped repeat)

| Guide | T10 | T13 | Change |
| --- | --- | --- | --- |
| Architecture (8 shared) | 7 / 1 / 0 | 7 / 1 / 0 | Same count, and Q-A7 is partial in both. T10's guide had the description rule (prerequisites and consequence, no severity label) but not the combination rationale. T13's guide has the rationale but not the description rule. |
| Q-A9 | Partial | Partial | Unchanged. Neither architecture guide states the A-16 fact. |
| Observation | 7 / 1 / 0 | 7 / 1 / 0 | Unchanged. Q-O3 has the same gap in both: replay present, outage and disagreement merged under one alert. |

There are no fixes and no regressions on any question.

## Comparison with T2 (the first scoped repeat, scored under v1)

| Guide | T2 | T13 | Change |
| --- | --- | --- | --- |
| Architecture | 7 / 1 / 0 (Q-A7) | 7 / 1 / 0 (Q-A7) | Identical count. Q-A7 is partial in both runs, though which part of the rule is missing differs. |
| Observation | 8 / 0 / 0 | 7 / 1 / 0 under v2; 8 / 0 / 0 under v1 | Identical on the v1 key. The only difference is the v2 amendment to Q-O3. |

Q-A9 did not exist in T2.

## What this shows

All three scoped repeats (T2, T10, T13) score the same on the shared questions: architecture partial only on Q-A7, observation complete on the v1 key and partial on Q-O3 under v2. Two gaps recur in every scoped run:

- **Q-A7:** no architecture guide has carried the complete threat-description rule. Authors keep one half or the other, consistent with the rule staying in the technical record (scoring.md pattern 4).
- **Q-A9:** no scoped architecture guide has stated the no-redirection fact. The T12 full run's architecture guide did, so an author can carry it. In T13 it reached only the observation guide.
