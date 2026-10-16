All three guides fail the pass rule and the correction's acceptance blockers. None has a Critical defect: each states the open questions it reaches as unresolved, and none claims the system or the fallback is available or production-ready. They fail on omitted conditions and residual risks, on the correction's fallback-condition rule, and in the Observation guide on one sentence that contradicts its owner. I did not run a guide-only reader test, so the reader-question part of the pass rule is unscored. Nothing in the package was changed.

Full findings: /private/tmp/claude-501/-Users-alanguerrero-Documents-ai-prompts/b72a9647-f430-4577-b73d-46cf594be5b3/scratchpad/eval/responses/t12-review-b.md

| Guide | Critical | Major | Facts preserved | Verdict |
| --- | --- | --- | --- | --- |
| Bitcoin Authorization And Recovery | 0 | 3 | 12/16 (75%) | Fail |
| Base USDC Settlement And Funding | 0 | 2 | 10/15 (67%) | Fail |
| Base Observation And Fallback Review | 0 | 2 | 11/16, one partly contradicted | Fail |

Every Major below is also an acceptance blocker.

**Bitcoin guide**
- **B-6 missing:** it never says that after Base acceptance the loan is "activation pending", that acceptance and activation are not atomic, or that the lender is exposed (INV-018, SEC-023).
- **B-16 missing:** it never says that anyone holding a matured default package can broadcast it but cannot redirect the payout (SEC-025, SEC-013). Line 92, "export its package for its own broadcast", suggests only the lender can broadcast.
- **Fallback introduced as "for eligible loans" (line 18):** neither condition is stated there (H(S) committed when the loan was created, and the production gate). Line 62 does state the gate.
- **Minor:** cooperative settlement is weakened (both parties' fresh signatures, no reuse of earlier signatures); clearing of plaintext on failure is omitted; line 79 words a required check as if it were already performed.
- **Open points:** the package-count and no-qualifying-fee-tier conflicts are handled correctly.

**Settlement guide**
- **Fallback mentioned without conditions (line 35):** called "the optional Bitcoin fallback" with neither the production gate nor the H(S) commitment.
- **Refund independence omitted:** nothing says the unclaimed-repayment refund stays callable indefinitely and never depends on or waits for the fallback service (INV-007, IFACE-017, SR-007).
- **Minor:**
  - Default classification is weakened.
  - It omits that no company-held or delegated acceptance exists, and does not list the borrower-nonresponse and platform-paid-reveal exclusions (SCOPE-003, SCOPE-014).
  - The refund-recipient switch is not described as irreversible or signed by the protocol account.
  - Line 39 says expired funding refunds "the principal"; the contract returns the vault's current balance.
  - The opener role is omitted.
  - The on-chain pause tension leaves out SEC-017.
- **Open points:** beta upgrade governance, the effect of upgrades on running loans, and the on-chain pause are all correctly presented as undecided.

**Observation guide**
- **Contradiction of SR-007 (line 57):** "In every one of these cases ... Bitcoin recovery through S is simply unavailable" replaces SR-007's "unspent Bitcoin can still be reached by other already-authorized routes". It also contradicts the guide's own listed cases: an outage is recoverable, and early disclosure enables early recovery.
- **"Eligible loan" (lines 15, 43, 63, and the figure):** the production gate does not appear until line 81.
- **Weakened facts:**
  - The service's independent check list is incomplete; it lacks current implementation, transaction and log, canonicality, and not trusting a workspace label or operator. The key requires it in full here.
  - The Bitcoin finalization checks are cut to "publication and hash".
  - The four lookup outcomes are missing.
  - Provider conflict and dual outage are merged into one rule (Minor under the correction).
- **Correct:** finality, providers, reorg handling, payment evidence, gate status and residual routes.

**Where the key or correction is wrong or incomplete**
- **Finality wait:** v1 4.6 treats a finality waiting time as invented, but SEL-013 records "roughly 20 minutes" as Base's documented figure. The guide's caveated restatement is faithful.
- **Package-count characterization:** v1 2h-2 relies on the owner calling the 12-package sentence "stale", which the migration removed. The migrated Bitcoin domain record now says it "chooses neither", and the guide follows that. Whether that rewrite of an open question was authorized belongs in the technical-diff review.
- **"Eligible":** SR-007 itself uses "eligible loan", so the correction's vague-quantifier rule should say "eligible" counts as vague unless defined in the same passage.
- **On-chain pause sources:** the correction's 2h-8 omits SEC-017's "pause key" and "pause new funding" sources.
- **Reveal caller:** the correction's 2h-7 does not say how to score a guide that states neither caller scope. I treated that as no defect.
- **Refund amounts:** no key item distinguishes the expired-funding refund (current balance) from the unaccepted refund (principal). This is a candidate Minor checklist item.
