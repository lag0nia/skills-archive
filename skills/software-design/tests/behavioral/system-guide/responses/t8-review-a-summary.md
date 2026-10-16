All three guides fail under the key's pass rule, and none has a Critical defect. I changed nothing in the package. The full findings are in /private/tmp/claude-501/-Users-alanguerrero-Documents-ai-prompts/b72a9647-f430-4577-b73d-46cf594be5b3/scratchpad/eval/responses/t8-review-a.md.

| Guide | Major | Minor | Key facts kept | Verdict |
|---|---|---|---|---|
| Architecture | 2 | 9 | 11/15 (73%) | FAIL |
| Loan Terms | 0 | 5 | 12/15 (80%) | FAIL, on the 90% rule only |
| Participant Access | 1 | 5 | 10/15 (67%) | FAIL |

No key fact is contradicted in any guide.

**Architecture: FAIL.** 2 facts are weakened and 2 are missing. It does carry all three flagged conflicts and the claim ladder.
- **Major, stolen recovery transaction:** the guide says the lender "or anyone who stole that signed transaction, can then take the collateral". SEC-025 says the Bitcoin pays only the lender's fixed address and a thief "cannot redirect value".
- **Major, upgrade control:** a single upgrade key during the public mainnet beta is presented as settled. INV-020, STATE-019, SR-003, SCOPE-007 and SEC-017 require a 2-of-3 Safe with a seven-day timelock, and STATE-019 rules out a unilateral key. The single key comes only from SEL-009 and TICKET-0048. The guide also drops INV-020's rule that upgrades must keep fixed recipients and loan identity.
- **Missing facts:** A-12 (local demo isolation) and A-14 (the severity-word rule and credential combinations), so comprehension question Q-A7 cannot be answered.
- **Minor defects include:** six confirmations applied to every Bitcoin step, six fee variants applied to every transaction, the L1-finality condition on repayment left out, and the fallback service described as able to "withhold".

**Loan Terms: narrow FAIL.** It answers 8 of 8 comprehension questions.
- **Missing or weak facts:** the H(S) commitment exists only for loans created with that capability; an activated loan cannot be superseded; "a narrative or diagram cannot supply a missing approval".
- **Minor defects include:** the box gives an interim reading of the open approval question, and liquidation is attributed to SCOPE-011 instead of SCOPE-012. The domain record has the same misattribution.

**Participant Access: FAIL.** 5 facts are weakened.
- **Major, Vault handoff:** the guide omits that the code is single-use, that the Vault needs its own fresh session and reloads the records, and that it "never signs bytes supplied only by the normal-product page". "Not a general signing token" also implies the handoff carries signing authority, which IFACE-004 denies. Question Q-P4 cannot be answered and could get a dangerous answer.
- **Minor defects:**
  - Operator controls are missing: TOTP, the 15-minute session, one-person approval and the audit log.
  - Nothing says the email confirmation cannot replace the vault password.
  - Each interaction's own access check is not mentioned.
  - Reuse of a key with a changed body is not said to be rejected.
  - The conditions for replacing the identity provider are narrowed.
- **Fixes:** all of these are additions, and making them would probably bring the guide to a pass.

**What the migration lost from the technical records:**
- "a narrative or diagram cannot supply a missing approval" now exists nowhere, in neither the records nor the guide.
- The rule that a visual or local design check cannot satisfy the exclusions or activation gates now exists only in the Participant Access guide.
- The architecture record no longer points to the fee and package-count conflicts. They are still recorded in the Bitcoin domain record.
- The migration also edited the canonical Base domain record to state the single beta key, citing INV-020 and STATE-019, which do not support it. That edit is where the architecture guide's upgrade defect comes from.

**Problems with the answer key:**
- It does not list the upgrade-key conflict.
- Its P-9 wording is less precise than STATE-021; the Participant Access guide is correct there.
- The section it cites for A-13 no longer exists.
- L-14 depends on the sentence the migration deleted.
