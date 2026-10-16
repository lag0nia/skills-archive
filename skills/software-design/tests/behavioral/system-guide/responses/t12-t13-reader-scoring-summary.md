T12 is the first full run with no not-met answer: 40 met and 8 partial on the 48 shared questions, and nothing wrong. T13 scores the same as T10 on every question: 14 met and 2 partial on the 16 shared questions. The tables are in t12-reader-scoring.md and t13-reader-scoring.md under /private/tmp/claude-501/-Users-alanguerrero-Documents-ai-prompts/b72a9647-f430-4577-b73d-46cf594be5b3/scratchpad/eval/responses/. As in my earlier scoring, a correct answer the reader could only infer, because the guide lacks the fact, counts as partial.

**T12 totals (full run)**

| Guide | Met | Partial | Not met | Wrong |
| --- | --- | --- | --- | --- |
| Architecture (8 shared) | 7 | 1 (Q-A7) | 0 | 0 |
| Loan Terms And Commitments | 7 | 1 (Q-L7) | 0 | 0 |
| Bitcoin Authorization And Recovery (8 shared) | 6 | 2 (Q-B3, Q-B6) | 0 | 0 |
| Base USDC Settlement And Funding | 7 | 1 (Q-S7) | 0 | 0 |
| Base Observation And Fallback Review | 6 | 2 (Q-O3, Q-O7) | 0 | 0 |
| Participant Access And Loan Operations | 7 | 1 (Q-P8) | 0 | 0 |
| **Total, 48 shared** | **40** | **8** | **0** | **0** |
| Q-A9 and Q-B9 (new) | 1 (Q-A9) | 1 (Q-B9) | 0 | 0 |
| **Total, 50** | **41** | **9** | **0** | **0** |

With the new questions, Architecture is 8/1/0 and Bitcoin is 6/3/0.

**T12 compared with T9 (34/11/3 → 40/8/0)**
- **Fixed to met (8):** Q-L2, Q-B8, Q-S2, Q-S4, Q-P2, Q-P3, Q-P4, Q-P5.
- **Improved from not met to partial (2):** Q-A7 and Q-P8.
- **Regressed from met to partial (2):**
  - Q-L7: the guide no longer says that old approvals and signing material are never revived.
  - Q-O7: the guide gives only a short list of finalization checks, and does not say another route can still win while an S recovery is unconfirmed.
- **Still partial (4):** Q-B3, Q-B6, Q-S7, Q-O3.
- **New questions:** Q-A9 moves from partial to met, because the architecture guide now says a stolen lender package can be broadcast after it matures, pays only the lender's fixed destination, and can do so even after the borrower repaid. Q-B9 stays partial, because the Bitcoin guide does not say this.

**T12 compared with T8 (43/4/1 → 40/8/0)**
- **Fixed (2):** Q-P4 moves from partial to met, and Q-B6 from not met to partial.
- **Regressed from met to partial (4):** Q-L7, Q-B3, Q-S7, Q-O7.
- **Still partial (3):** Q-A7, Q-O3, Q-P8.

Several remaining partials have the same cause: the fact is in the architecture guide but missing from the domain guide that reader had. This applies to Q-B9 (stated in Q-A9), Q-B3 (the refund race) and Q-P8 (what operators may not do). Q-O3 and Q-A7 are partial in every full run.

**T13 totals (scoped run)**

| Guide | Met | Partial | Not met | Wrong |
| --- | --- | --- | --- | --- |
| Architecture (8 shared) | 7 | 1 (Q-A7) | 0 | 0 |
| Base Observation And Fallback Review (8 shared) | 7 | 1 (Q-O3) | 0 | 0 |
| **Total, 16 shared** | **14** | **2** | **0** | **0** |
| Q-A9 (new) | 0 | 1 | 0 | 0 |
| **Total, 17** | **14** | **3** | **0** | **0** |

With Q-A9, Architecture is 7/2/0. On the original key, without the Q-O3 correction, Observation is 8/0/0.

**T13 compared with T10**
- The counts are identical (7/1/0 and 7/1/0, with Q-A9 partial in both), and no question changed verdict.
- Q-A7 is partial in both runs, but each guide keeps the opposite half of the rule. T10's guide said a threat is described by its prerequisites and consequence rather than a severity label. T13's guide says combinations matter, because pieces that each look harmless can be dangerous together.
- Q-O3 has the same gap in both: replay after an outage is present, but outage and disagreement still share one rule and one five-minute alert.

**T13 compared with T2**
- **Architecture** is identical at 7/1/0, with Q-A7 partial in both.
- **Observation** is 8/0/0 on the original key, matching T2. It drops to 7/1/0 only because of the Q-O3 correction.
- Q-A9 did not exist in T2.

All three scoped repeats (T2, T10, T13) land at the same level. No scoped architecture guide has stated the full threat-description rule or the no-redirection fact. In T13 the no-redirection fact appears only in the observation guide.

**Q-A6 note:** the T13 architecture guide lists the expiry of an unused reservation as an open question. The corrected key treats that point as already reconciled, so this is a matter for the guide review; it does not change the Q-A6 verdict.
