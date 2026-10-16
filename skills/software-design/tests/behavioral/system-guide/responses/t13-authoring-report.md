FINAL REPORT. This replaces my earlier interim hand-back, which said the work was unfinished. The task is now done.

I used only the frozen skill copy (.../scratchpad/frozen-skill-v6/software-design).

Package (P): /private/tmp/claude-501/-Users-alanguerrero-Documents-ai-prompts/b72a9647-f430-4577-b73d-46cf594be5b3/scratchpad/eval/t13/bitrise21/loan-system/design/technical-design

PDFs, in /private/tmp/claude-501/-Users-alanguerrero-Documents-ai-prompts/b72a9647-f430-4577-b73d-46cf594be5b3/scratchpad/eval/t13-pdf/:
- bitcoin-backed-usdc-one-loan-system-architecture.pdf (10 pages)
- bitcoin-backed-usdc-one-loan-system-domain-base-observation-and-fallback-review.pdf (10 pages)
- system-guide-export.json (written by the exporter)

The exporter's `--check` reports both PDFs current (exit 0). I rendered every page of both and inspected them:
- every heading stays with its text;
- the figures and the "Not available yet" callout are not split;
- the profile table repeats its header where it breaks;
- nothing is clipped.

One gap in the architecture PDF: page 3 is left short because the 8-step figure is kept whole on page 4.

WHAT I CHANGED (all inside P)

The exporter only runs when every domain has a guide, so the whole package had to be migrated, not just the requested domain.

New guides:
- guide/architecture.md
- guide/domains/ with one guide per domain: base-observation-and-fallback-review, loan-terms-and-commitments, bitcoin-authorization-and-recovery, base-usdc-settlement-and-funding, participant-access-and-loan-operations

Technical files changed:
- README.md: link to the guide.
- system-model/architecture.md:
  - `system_guide: adopted`;
  - System Overview replaced by a link line;
  - an Open question line on lender approval under Purpose And Binding;
  - a second line pointing to it beside the Cross-Domain Boundaries statement.
- The five domain.md files: each Domain Overview replaced by a link line, plus Choices And Rationale, Open question and Unresolved source conflict lines, and Excludes and Cross-Domain links.
- SR-001: one link repointed to the guide.
- visuals/assets/explorer.json and sources.json: architecture.md fingerprint updated after I confirmed that all quotes the explorer cites from that file are still there word for word; visuals regenerated.

Pinned records are byte-identical to the baseline (checked with diff/cmp): contracts/interfaces/*, bu-006, bu-007 and repo-002-core-coordination-scope.json.

REVIEWS (steps 4–5)

Five independent reviewers, each in a fresh context and not the author, checked the work:
- the technical diff;
- the architecture guide;
- the Base Observation And Fallback Review guide;
- the Loan Terms and Settlement guides;
- the Bitcoin and Participant guides.

Their reports are in .../scratchpad/t13-work/reviews/. I checked each finding against its owner record before applying it. Main corrections:

- **Architecture guide:**
  - It wrongly said collateral cannot return after lender silence without the fallback. It now describes the borrower long-stop (D+10 days) racing the lender default (D+3 days).
  - The offer has no interest rate; it now lists the offer's actual values.
  - Bitcoin evidence now needs agreement between independent sources, not one source.
  - The 67-hour opening condition is stated.
  - Repayment must be finalized no later than D.
  - The finality rule is scoped to the application and its workers.
  - Default validity is described as independent of Base.
  - The local demonstration is marked not yet runnable.
  - A delivery-progress summary the skill forbids in guides was removed.

- **Base Observation And Fallback Review guide:**
  - The trigger for the fee conflict is corrected (no signed variant strictly above the estimate plus its margin), and it is labelled an unresolved conflict.
  - The two-provider payment quorum is now shown as deferred, and payment signing as planned and unverified.
  - The "routes authorized at setup" sentence now includes cooperative settlement with fresh signatures.
  - "No later than D" is used, and the observer is shown handing over pending as well as final observations.
  - Scope items are split into deferred vs excluded.
  - Optional figure steps now state their conditions.
  - Polling once a minute and the alert after five minutes now follow the owner wording.

- **Other four guides:** lender approval is shown as open in the Bitcoin guide. Funding and acceptance gates, the claim cutoff C, the payment-status caveat, the "Reconciliation blocked" state name, the backup residual window and decision attributions were corrected.

- **Technical records:**
  - An over-strong SEL-043 citation in the participant wallet line was corrected (TICKET-0153 now cited).
  - The record lists in the three lender-approval lines were aligned.
  - SEC-017 was added to the pause question.

Validators: the full suite was rerun after the last edit:
- the nine validators;
- `generate-visuals --check`;
- `generate-decision-overview --check`.

The output is identical to the untouched baseline: no new failures, and both checks pass. The four validators that still fail (structure, build-design, delivery-readiness, ui-ux) already failed on the baseline.

QUESTIONS FOR YOU

Each is recorded in its owner record as an `Open question:` or `Unresolved source conflict:` line and shown as undecided in every guide passage that reaches it.

1. **Lender approval of final terms.** The architecture record, IFACE-003, SEL-012 and SCOPE-011 say publication is standing acceptance with no second lender approval. STATE-001, STATE-002, SR-001, IFACE-001, FLOW-001, SR-010 and SR-011 require the lender to approve the final candidate.
2. **Terminal package count: 12 vs 18.** One SR-002 sentence says 12; the rest of SR-002 and the state, flow and constraint records say 18. Recorded as an unresolved conflict.
3. **Fee when no signed tier clears 1.25× the estimate.** The IFACE-007 payload, TICKET-0018 and TICKET-0089 use the 200 sat/vB tier; IFACE-007 ACT-002 says fail closed. Recorded as an unresolved conflict. VA-004 says the implemented selector uses the 200 fallback.
4. **Relay path for long-stop and cooperative transactions.** IFACE-008 accepts only activation, recovery and refund; FLOW-010, SEC-025, IFACE-019 and FLOW-009 relay through the existing path.
5. **On-chain pause.** SR-003, SEL-009 and CONS-008 say there is none; STATE-019, INV-019 and SEC-017 describe pause roles and a paused state.
6. **Extension wallet in local-demo acceptance.** CONS-026 and SEL-037 require it; SEL-042, VA-003 and TICKET-0153 call it historical evidence only, and SEL-043 rejects keeping it but requires external-payer proof.
7. **New: single upgrade key during the beta.** SEL-009 allows it. INV-020, SR-003 and SCOPE-007 say V1 keeps the 2-of-3 Safe timelock, and STATE-019 forbids an unrestricted single key. The skill's rule is that a whole-version statement covers the beta.
8. **New: an uncommitted reservation that expires without a prefund attempt.** STATE-001 says it simply expires; SEL-012 and IFACE-003 apply cancel, reopen, block and infraction to any missing prefund at the deadline.
9. **New: raising the fee of an activation already in a mempool.** INV-018 escalates through signed tiers or CPFP; IFACE-007 says an accepted activation is the sole parent and only CPFP adds fee.

UNRESOLVED OR STALE RECORDS (reported, not edited)
- **SEC-024** says a loan without the fallback has no borrower fallback Bitcoin route and omits the long-stop. CONS-027, INV-008 and FLOW-010 require the long-stop, so SEC-024 may be stale.
- **Base reveal from any caller:** IFACE-018 and TICKET-0046 accept a matching X or Y from any caller, but the participant-call contract says a reveal from another address "is not a valid protocol transition". It is unclassified and not recorded as open; it may only be a difference in layer.
- **SEL-014 vs TICKET-0053:** the alert timing for provider disagreement is not aligned.
- **BU-007 command table** still says "Planned — unverified", against the handoff index's "Implemented".
- **Zero-confirmation rule:** TICKET-0013 and the decision overview still show the old rule, which INV-015 and IFACE-005 supersede.
- **Other drift:**
  - SR-001 vs STATE-002 terms state names;
  - API version pin 1.7.0 (IFACE-021, CONS-026) vs handoffs 1.8–1.10;
  - VA-003's passing run vs the supervisor's LOCAL_DEMO_RUNTIME_NOT_IMPLEMENTED;
  - P2A anchor for the long-stop route is unstated;
  - payment capability is PARTIAL (SEL-043).
- **Narrative statements that now live in no record:**
  - "hardened per-loan derivation avoids cross-loan correlation";
  - "a former decision says fee selection fails closed".

AGENT-CHOSEN DECISIONS
- Classifying each open point as an open question or an unresolved conflict. I recorded new items 7–9 and the reservation-expiry point as open questions because no owner reconciles them.
- Where each line sits (domain records; the beside-statement line in the architecture record).
- The explorer fingerprint update.
- The structure and wording of all six guides.

WHAT I CHECKED
- Owner wording for every applied review finding.
- Pinned-record byte identity.
- Explorer quote resolution.
- The full validator suite against the baseline (identical).
- Guide validation (it runs as part of the export, which passed).
- Export `--check`.
- Every page of both PDFs.
