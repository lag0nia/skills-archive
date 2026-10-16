I reviewed the three guides against the snap-t7 records and changed nothing in the package. Two guides pass and one fails: the Base guide passes only with a correction note, and the Bitcoin guide fails on fact coverage alone. The full findings are in /private/tmp/claude-501/-Users-alanguerrero-Documents-ai-prompts/b72a9647-f430-4577-b73d-46cf594be5b3/scratchpad/eval/responses/t7-review-b.md, which is the only file I created.

| Guide | Critical | Major | Facts kept intact | Reader questions | Verdict |
|---|---|---|---|---|---|
| Bitcoin Authorization And Recovery | 0 | 0 | 12/15 (80%) | 7/8 | **FAIL** |
| Base USDC Settlement And Funding | 0 | 1 | 14/15 (93%) | 8/8 | **PASS with correction note** |
| Base Observation And Fallback Review | 0 | 0 | 14/15 (93%) | 6/8 full, 2 mostly | **PASS** |

**Bitcoin guide.** It fails only the rule that 90% of key facts be kept intact; nothing it says is dangerous. Three facts lose a condition:
- **B-12:** The two-confirmation disclosure is described only for X, not for Y. It also omits that any failure clears the plaintext.
- **B-13:** It doesn't say what happens when no fee estimator is usable. The route enters `fee-estimation-blocked`, and an operator may only record an existing signed tier (IFACE-007).
- **B-15:** It doesn't say that losing the password blocks new signing and cooperative settlement (SR-004). It also adds SEL-005's line that the recovery phrase "reconstructs Bitcoin key material", which invites the opposite reading.
- The other defects are minor: "valid at T" loses "strictly after", and the cut-off for adding the fallback is understated.
- It is correct on the 12 vs 18 package conflict and the no-qualifying-tier fee conflict.

**Base guide.** The one Major defect is the upgrade-governance sentence:
- It presents a single upgrade key for the public beta as settled V1 behaviour. That comes only from SEL-009 and TICKET-0048.
- The core records say V1 uses a 2-of-3 Safe with a seven-day timelock (SR-003, INV-020, STATE-019). SEC-017 prohibits a single key that bypasses the timelock or Safe, and none of them mentions a beta key.

The pass is fragile. It turns into a fail if a reviewer upgrades either of two near-Major issues:
- Step 3 merges "activation pending" with "terminal signing pending" (STATE-015), and the guide never states the lender's exposure while activation is pending (SEC-023).
- The callout says everything "has to fit in the roughly 24 hours between C and T". SEC-025 only requires the recovery to confirm before the lender's transaction.

It correctly reports the on-chain pause question as an open conflict.

**Observation guide.** O-15 is weakened because it never lists mutual cooperation as a remaining route (FLOW-005/006). The other defects are minor:
- The Bitcoin finalization checks are incomplete: no gate re-check and no fee-tier selection.
- The four lookup results are not listed.
- It says event identity comes from the loan and the block. The records (SEL-015, IFACE-012) define it as chain, proxy, block hash, transaction hash and log index.
- It repeats the same 24-hour gloss.
- The fallback figure omits the production gate.

If a strict reviewer requires the full check lists, it drops to 13/15 and fails.

**Migration.** Every rule removed from the domain overviews still has an owner in the records, except two facts:
- "L1 finality is not a promise of an exact waiting time" now exists only in the Observation guide. SEL-013 says only "roughly 20 minutes".
- The rationale for the fee rules ("prevent underestimation or unsafe reselection") now exists nowhere. The rules themselves remain in IFACE-007.

**Answer key corrections:**
- S-13 and Q-S8 still say "no on-chain pause", but snap-t7 now flags that as an unresolved conflict.
- It misses the beta-key inconsistency and the tension between SEL-005 and SR-004 over the recovery phrase.
- The B-15 citation should point to SR-004 "## Owns", not "## Failure And Recovery".
- Many owner citations point to "## Domain Overview" sections the migration deleted.
