I wrote the full review to `/private/tmp/claude-501/-Users-alanguerrero-Documents-ai-prompts/b72a9647-f430-4577-b73d-46cf594be5b3/scratchpad/eval/responses/t12-diff-review.md` and changed nothing in either package.

**Counts:** Blocker 8, Minor 3, None 10.

**Overall:** Nearly all of the narrative removed from the five `domain.md` files and the architecture's System Overview survives, with the same meaning, in the SR, IFACE, STATE, INV, SCOPE, SEL and CONS records; the report traces each statement. The blockers are all at points where the change touched a disagreement: it rewrote records that had taken a side, added open questions that weren't recorded before, dropped one attributed side and lost one statement.

**Blockers:**
- **B1, Bitcoin domain, 12 vs 18 terminal packages.** It used to say the 6/6/6 set is the "current package contract" and the SR-002 twelve-package sentence is "stale … remains for a separate repair". It now says "This record chooses neither". The verdict and the repair status are gone.
- **B2, Bitcoin domain, fee conflict.** The "former decision" that said fail closed was dropped as a side, along with the "earlier" qualifier. No record holds either now.
- **B3, Settlement domain, upgrade authority.** It used to state "retains … 2-of-3 Safe, seven-day timelock" as the choice. It is now an unresolved conflict with SEL-009, and the record chooses neither side.
- **B4, Settlement domain, pause.** "V1 has no on-chain pause" became an open question.
- **B5, Settlement domain, new question.** It now asks how upgrades reach existing loans (SEL-009 vs INV-020, STATE-019, SCOPE-007, SEC-017). Nothing recorded this before.
- **B6, Loan Terms domain, approval.** It used to side with the "detailed approved records" against the architecture's "older" wording. It is now a neutral open question that also puts IFACE-003, SEL-012, SCOPE-011 and STATE-010 on the other side.
- **B7, new sub-question.** "Whether reservation itself binds the canonical terms" was added to the architecture (lines 23 and 80) and to the Loan Terms domain (line 39).
- **B8, lost statement.** "An unresolved implementation question belongs in its existing ticket; a narrative or diagram cannot supply a missing approval" (old Loan Terms domain, line 33) is no longer in any technical record, or in the guide.

**Sides intact:** No record holding a side of any disagreement was edited. Every quotation the change added (in the architecture, Settlement, Bitcoin and Loan Terms records) matches its source exactly.

**Minor:**
- The README says the guide is "also exported as PDFs", but there are no PDFs in the package.
- The Bitcoin domain's line saying the rationale grants no recovery authority now also covers the fee-tier reasons.
- Some "Recorded reason … [record] holds …" lines name a record that doesn't actually state the reason (SEC-011, SEL-027, IFACE-007).

**Pinned records, hashes and links:**
- The only hash-pinning handoff (`repo-002-core-coordination-scope.json`) pins IFACE files and two Build Units (BU-006, BU-007). All match and are byte-identical, and none of the changed files is pinned.
- `sources.json` matches every file, and the regenerated visuals are byte-identical to before. Its refreshed hashes do cover the domain files with blocker changes; that refresh only shows the visuals don't use that text, not that the changes were reviewed.
- The architecture hash refresh in `explorer.json` is fine: all 9 explorer quotes into `architecture.md` still resolve, and none of them depends on changed content.
- 220 links and anchors in the changed files all resolve, including every link into `guide/`. Nothing links to a removed section. SR-001's "Domain Overview" mention was updated to point to the guide.
