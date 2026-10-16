T10 scores 14 met and 2 partial on the 16 shared questions, with nothing not met or wrong; the new Q-A9 is partial. The per-question tables are in /private/tmp/claude-501/-Users-alanguerrero-Documents-ai-prompts/b72a9647-f430-4577-b73d-46cf594be5b3/scratchpad/eval/responses/t10-reader-scoring.md, next to the T9 file (t9-reader-scoring.md) delivered earlier.

**Totals (T10)**

| Guide | Met | Partial | Not met | Wrong |
| --- | --- | --- | --- | --- |
| Architecture (8 shared) | 7 | 1 (Q-A7) | 0 | 0 |
| Base Observation And Fallback Review (8 shared) | 7 | 1 (Q-O3) | 0 | 0 |
| **Total, 16 shared** | **14** | **2** | **0** | **0** |
| Q-A9 (new) | 0 | 1 | 0 | 0 |
| **Total, 17** | **14** | **3** | **0** | **0** |

Architecture including Q-A9 is 7/2/0. On the original key alone, without the Q-O3 correction, Observation would be 8/0/0.

- **Q-A7 (partial):** the guide says threats are described by their exact prerequisites and consequence rather than a severity label, and gives the shared-frontend example. It lacks the full list of dimensions and never says that credentials which are each insufficient can be enough together; the reader inferred that.
- **Q-O3 (partial):** finalized facts stay visible, new Base-dependent actions are blocked, and the observer replays from its cursor after recovery. What is missing is the split the corrected key adds: the guide puts "both unavailable" and "providers disagree" under one rule with one five-minute alert.
- **Q-A9 (partial):** no guide says that a thief cannot redirect the payout but may still collude, extort or sabotage. The reader got "broadcast once valid, to the lender's fixed destination" only by inference.

**Comparison with T9**
- **Architecture** goes from 7/0/1 to 7/1/0. Q-A7 improves from not met to partial, because the T10 guide restores the no-severity-label rule and the prerequisites-and-consequence requirement. The T10 guide also names layer-1 finality, where T9's said only "required finality".
- **Q-A9** is partial in both runs.
- **Observation** is 7/1/0 in both runs, but the Q-O3 gap is narrower. T9 lacked both the replay after an outage and the split; T10 has the replay and lacks only the split. Q-O8 now also includes "an empty or unreachable answer is not proof of withholding".
- **No regressions.**

**Comparison with T2 (scored on the original key)**
- **Architecture** is identical at 7/1/0, with Q-A7 partial at the same level as T1, T2 and T7.
- **Observation** is 7/1/0 on the corrected key and 8/0/0 on the original key, which matches T2 exactly. The only difference is the Q-O3 correction.

Both scoped repeats reach the same level on the shared questions. That suggests T9's Q-A7 not-met came from that author rather than from the guidance. The gaps this run still has are Q-A9 (the no-redirection fact appears in no guide) and the merged Q-O3 rule. The corrected key also lists that merged rule as a Minor guide defect.
