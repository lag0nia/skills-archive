All three guides fail. I checked each claim against the package's technical records and changed nothing in the package. The full findings are in `/private/tmp/claude-501/-Users-alanguerrero-Documents-ai-prompts/b72a9647-f430-4577-b73d-46cf594be5b3/scratchpad/eval/responses/t9-review-b.md`.

| Guide | Critical | Major | Facts kept | Verdict |
|---|---|---|---|---|
| Bitcoin Authorization And Recovery | 0 | 4 | 10 of 16 (63%) | Fail |
| Base USDC Settlement And Funding | 1 | 1 | 10 of 15 (67%) | Fail |
| Base Observation And Fallback Review | 0 | 0 (one borderline) | 9 to 13 of 16 (56–81%) | Fails narrowly; easy to fix |

**Bitcoin guide.** Four facts the records require are missing:
- **Lender exposure after acceptance.** After the borrower accepts, the loan is "activation pending", not active. If the borrower's Bitcoin refund confirms first, the lender is left unsecured (INV-018, SEC-023).
- **Lost Vault password.** It blocks new signing and secret disclosure, but already-signed packages stay usable. The window after confirmation in which lender signatures can still be missing is a recorded risk (SR-004, SR-009).
- **Fallback is not available yet.** Its production gate is never stated, and "activated capability" is never explained in a guide that uses "activation" for the Bitcoin transaction throughout.
- **No usable fee estimator.** The rule that the route is then blocked is missing (IFACE-007).

It also never says that a stolen default package can be broadcast but can only pay the lender's fixed address (SEC-025). It calls one side of the fee conflict "the settled … decision", though it still reports the point as undecided. The 18-versus-12 package count conflict is reported correctly in the text, but the figure shows 18 without the note.

**Base Settlement guide.**
- **Critical: upgrade governance during the beta is stated as settled.** The guide says a single beta key controls upgrades. It describes the opposing records as merely not mentioning the beta key. In fact INV-020, SR-003, SCOPE-007 and STATE-019 say V1 keeps the 2-of-3 Safe with the seven-day timelock, and SEC-017 forbids any key that bypasses them. The guide does declare a narrower point open, so the coordinator could score this Major instead; the guide fails either way.
- **Major:** the fallback is described as something that "might publish a secret", with neither condition: the commitment made when the loan was created, and the production gate.
- **Minor gaps:**
  - Base L1 finality is missing from the repayment rule.
  - It never says the refund stays available indefinitely and never waits for the fallback service.
  - Default classification and the ban on delegated acceptance are only partly carried.

**Base Observation guide.** It has no contradictions and handles the fallback's status and conditions correctly. It fails only the 90% fact threshold because:
- the fallback service's check list and the Bitcoin finalization check list are summarized, though the key requires them in full in this guide;
- the four lookup results are missing, including that an empty or unreachable result is not proof the secret was withheld.

It reports two tensions the records really contain: the one-provider rule against SEC-020, and the long-stop missing from several records.

**Answer-key corrections (v3 candidates):**
- **One-provider tension.** SEC-020 says no single source may become authoritative chain state, while SEL-014 lets one healthy provider report a finalized Base fact. The key treats that rule as settled.
- **Long-stop omission.** The key names only FLOW-005, but INV-025, FLOW-006, FLOW-007 and SEC-024 also leave the long-stop out.
- **Governance conflict.** The key's list for the Safe side omits STATE-019's "Current V1 posture" transition and SEC-017's broader ban on any key that bypasses the Safe.
- **Finality wait.** The "roughly 20 minutes" figure comes from SEL-013, which credits Base's documentation. A guide that attributes it and says it is not a promise should be accepted.
- **Changed technical records.** The migrated Base domain record now gives only the beta-key side of the governance conflict, with no conflict note. That looks like an unauthorized technical change for the technical-diff review. The migrated Bitcoin domain record also drops the "former decision" wording from the fee conflict, which is arguably a correction.
- **Workflow-only fact.** "Target fee classes, not guaranteed minimum rates" exists only in a ticket and the decision overview, not in a system-model record.
