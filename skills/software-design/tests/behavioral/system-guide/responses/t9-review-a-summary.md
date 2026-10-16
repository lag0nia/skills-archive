All three guides fail under the key's pass rule, and each hits at least one of the correction's acceptance blockers. I changed nothing in the package; the full findings are in `/private/tmp/claude-501/-Users-alanguerrero-Documents-ai-prompts/b72a9647-f430-4577-b73d-46cf594be5b3/scratchpad/eval/responses/t9-review-a.md`.

| Guide | Critical | Major | Facts preserved | Reader questions | Verdict |
| --- | --- | --- | --- | --- | --- |
| Architecture | 1 | 2 | about 10 of 16 | 7 of 9 (Q-A9 risks a dangerous answer) | Fail |
| Loan Terms And Commitments | 0 | 2 | 10 of 15 | 7 of 8 | Fail |
| Participant Access And Loan Operations | 0 | 5 | about 6 of 15 | 4 of 8 (dangerous Q-P4 answer) | Fail |

**Architecture guide**
- **Critical, upgrade governance (2h-5), line 113.** The guide treats the beta single upgrade key as fact ("the single key used during the beta"). It says INV-020, SR-003 and SCOPE-007 describe "only the final" administration. They actually say V1 retains the 2-of-3 Safe with a seven-day timelock. This partly settles the open question in SEL-009's favor and contradicts INV-020. If you accept the guide's explicit "open" label as enough, it is still a Major owner contradiction and a blocker.
- **Major, line 90.** The activation-pending risk to the lender is missing: SEC-023 says acceptance and activation are not atomic, and the lender can be left unsecured.
- **Major, line 92.** The guide never says that anyone holding a matured default package can broadcast it but cannot redirect the payout (SEC-025). "The lender exports and broadcasts it manually" invites Q-A9's dangerous answer.
- **Missing fact.** The security-description and combination-attack rule (A-14) is absent.
- **Minor.**
  - The "one provider as enough" open point overstates a tension: SEC-020 itself hands Base failover to STATE-014, which says one healthy source suffices.
  - Calling TICKET-0018 "a settled fee decision" tilts the no-tier fee conflict.
  - The approval-wording, package-count and fee conflicts are otherwise correct.

**Loan Terms And Commitments guide**
- **Major.** The reservation rules are missing: the 24-hour limit, expiry before commitment, cancel-and-reopen with an infraction after commitment, and manual review at 72 hours (STATE-001, IFACE-003).
- **Major.** The guide never says final-terms approval grants no signing, Vault, custody or chain authority (SR-010, IFACE-001). It does say the lender keeps the funding decision.
- **Missing.** Commitment does not consume the offer (L-8), and the fallback commitment is bound only for loans created with that capability (L-12).
- The approval-wording conflict is handled correctly.
- Its split of chain checks between Base-facing and Bitcoin-facing consumers is supported by IFACE-002, so I did not count it as a defect.

**Participant Access And Loan Operations guide**
- **Majors.**
  - **Handoff.** It is described as "not a general signing token", the exact wording the correction marks Major. None of the Vault-side conditions appear: same participant's fresh session, single redemption, independent reload, never signing bytes from the product page.
  - **Session limits.** No 7-day and 24-hour session limits, no 15-minute reauthentication, no TOTP, and no rule that the email confirmation cannot replace the vault password.
  - **Same-loan dual role.** No ban on one account holding both roles on the same loan.
  - **Payment status.** Line 64 says the payment capability's "delivery is recorded as partial". SEL-043 means design selected, implementation and execution evidence still gated, and VA-003 claims no implementation.
  - **Operators.** Operators are given reprobe and retry power with none of their limits: separate login, one-person approval, audit, no amounts or recipients.
- **Minor.** The demo's loopback-only, fail-closed isolation is missing.
- **Correct.** The payment reconciliation wording (0, 15, 60 and 180 seconds) and the Cloudflare failure domain.

**Where the key is wrong or incomplete**
- Its description of the fee no-tier conflict is out of date. The migrated Bitcoin domain record dropped the "former decision says fail closed" claim and now names TICKET-0018 as support for the 200 sat/vB side.
- SEC-024's sentence that a loan without the fallback has "no borrower fallback Bitcoin route" conflicts with the long-stop, and the key does not list it.
- The IFACE-007 versus INV-018 fee-bump wording is a genuine silence the key misses.
- L-10 is broader than IFACE-002, which assigns live chain checks by consumer type.
- The 67-hour breakdown (24 + 24 + 19) belongs to CONS-011, which the key does not cite.
- Neither file says how to score a guide that labels a conflict "open" but states one side's premise as fact.

**For the technical-diff review**
- The migration removed the architecture record's note that the fee and count conflicts are unresolved. Those notes now survive only in the Bitcoin domain record.
- The rewording of the fee conflict's sides may count as a side of an open question being rewritten.
