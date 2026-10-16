STATUS: NOT FINISHED. I was asked to hand back before the independent reviews completed, so the final PDFs have not been written to /private/tmp/claude-501/-Users-alanguerrero-Documents-ai-prompts/b72a9647-f430-4577-b73d-46cf594be5b3/scratchpad/eval/t13-pdf yet. Please treat the guides as unreviewed drafts.

Package (P): /private/tmp/claude-501/-Users-alanguerrero-Documents-ai-prompts/b72a9647-f430-4577-b73d-46cf594be5b3/scratchpad/eval/t13/bitrise21/loan-system/design/technical-design
Skill used: only the copy at .../scratchpad/frozen-skill-v6/software-design

WHAT IS DONE
- Whole-package System Guide migration. The exporter refuses to run unless every declared domain is migrated, so all five domains had to be done, not only the requested one.
- Guides written: P/guide/architecture.md and P/guide/domains/{base-observation-and-fallback-review, loan-terms-and-commitments, bitcoin-authorization-and-recovery, base-usdc-settlement-and-funding, participant-access-and-loan-operations}.md. I wrote the architecture and Base Observation And Fallback Review guides. Sub-agents wrote the other four, and their reports are in .../scratchpad/eval/t13-relay/.
- Technical files changed (diff against an untouched baseline copy is in .../scratchpad/t13-work/tech.diff):
  - README.md: added a link to the guide.
  - system-model/architecture.md: added `system_guide: adopted`, replaced System Overview with a link line, and added an Open question on lender approval.
  - The five domain.md files: replaced Domain Overview with a link line, and added Choices And Rationale (open questions and conflicts), Excludes and Cross-Domain Contracts links.
  - SR-001: repointed a link from "Domain Overview" to the Loan Terms guide.
  - visuals/assets/explorer.json and sources.json: updated the architecture.md fingerprint after confirming every cited quote still resolves, then regenerated.
- Pinned records were not touched: contracts/interfaces/*, bu-006 and bu-007.
- Validators: the full suite (structure, tickets, constraints, build-design, handoff-sequence, delivery-readiness, dependency-map, ui-ux, assurance, visuals --check, decision-overview --check) was rerun after all edits. Exit codes and outputs are identical to the baseline, so there are no new failures. The four checks that fail (structure, build-design, delivery-readiness, ui-ux) already failed before my changes.
- Trial export: it passed guide validation and printed both PDFs (architecture, 9 pages; BOFR domain, 9 pages) to the scratch folder .../scratchpad/t13-work/trial-pdf/. I rendered them to PNG with a local PDFKit renderer and spot-checked pages 1–2 of the architecture PDF; they look clean. The other pages have not been inspected.

WHAT IS NOT DONE
- Steps 4–5 (independent reviews) are still running in fresh contexts. They will write to .../scratchpad/t13-work/reviews/: technical-review.md, architecture-guide-review.md, bofr-guide-review.md, guides-a-review.md, guides-b-review.md. Their findings have not been checked or applied.
- Steps 6–7 are not done: corrections, a validator recheck, the final export to .../eval/t13-pdf with --check, and page-by-page inspection. To finish, apply the reviewed corrections, then run: node <skill>/scripts/export-system-guide.mjs --root P --out .../eval/t13-pdf --architecture --domain base-observation-and-fallback-review (it found Playwright Chromium automatically). Then run --check and inspect every page.

QUESTIONS I WOULD HAVE ASKED YOU / UNRESOLVED (all recorded as open in the records and the guides)
1. Lender approval: the architecture record, IFACE-003, SEL-012 and SCOPE-011 conflict with STATE-001, STATE-002 and SR-001 (plus FLOW-001, SR-010, SR-011). It is unclear whether these describe different stages or contradict each other.
2. Bitcoin terminal package count: 12 vs 18 (recorded as an unresolved conflict).
3. Fee when no tier qualifies: the IFACE-007 payload, TICKET-0018 and TICKET-0089 pick 200 sat/vB, while IFACE-007 ACT-002 says fail closed. VA-004 says the implemented selector uses the 200 fallback.
4. Relay boundary for long-stop and cooperative routes: IFACE-008 vs FLOW-010, SEC-025, IFACE-019 and FLOW-009.
5. On-chain pause: SR-003, SEL-009 and CONS-008 vs STATE-019, INV-019 and SEC-017.
6. Extension wallet in local-demo acceptance: CONS-026 and SEL-037 vs SEL-043, SEL-042 and VA-003.

Further drift flagged but not resolved:
- Terms state names: SR-001 vs STATE-002.
- Reservation-expiry infraction rule: SEL-012 vs STATE-001.
- Zero-confirmation rule: TICKET-0013 and the decision overview still show the old rule, which INV-015 and IFACE-005 supersede.
- The "cross-loan correlation" rationale has no owner (SEL-004/006).
- SCOPE-001/002/003/005/006 are deferred, not excluded.
- "Former decision says fail closed" has no current owner.
- P2A anchor for the long-stop route is not stated.
- INV-018 tier escalation vs IFACE-007 as sole parent.
- API version pin 1.7.0 vs handoffs 1.8–1.10.
- VA-003 records a passing run, but the supervisor reports LOCAL_DEMO_RUNTIME_NOT_IMPLEMENTED.
- Single governance key in beta (SEL-009, LGATE-002).
- Payment capability is PARTIAL (SEL-043).

AGENT-CHOSEN DECISIONS: how each open point was classified (open question vs unresolved conflict) and where it was placed; the explorer fingerprint update; and the guide structure and wording.

CHECKED: links and the guide-validator subset (it passes, because the trial export ran), byte-identity of the pinned records (untouched), the explorer quotes, and the validator comparison against the baseline.
