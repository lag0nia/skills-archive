## System Guide for the loan-system package (t2): report

**The architecture guide and the Base Observation And Fallback Review guide are written and exported as PDFs.** To get there I had to write guides for all five domains, because the exporter refuses to export anything until every domain has a guide. I exported only the two PDFs you asked for. Both pass the exporter's own checks, and I looked at every page as an image.

PKG = `/private/tmp/claude-501/-Users-alanguerrero-Documents-ai-prompts/b72a9647-f430-4577-b73d-46cf594be5b3/scratchpad/eval/t2/bitrise21/loan-system/design/technical-design`

### PDFs
In `/private/tmp/claude-501/-Users-alanguerrero-Documents-ai-prompts/b72a9647-f430-4577-b73d-46cf594be5b3/scratchpad/eval/t2-pdf/`:
- `bitcoin-backed-usdc-one-loan-system-architecture.pdf` (10 pages)
- `bitcoin-backed-usdc-one-loan-system-base-observation-and-fallback-review.pdf` (10 pages)
- `system-guide-export.json`, the manifest the exporter writes alongside them.

### What changed inside the package
**New guide files**
- `guide/architecture.md`
- `guide/domains/` — one guide for each of the five domains.
- I wrote the architecture and Base Observation guides myself. Four helper agents drafted the other four (Loan Terms, Bitcoin, Base settlement, Participant Access). I reviewed and corrected those drafts.

**Turning the System Guide on**
- `system-model/architecture.md`: added `system_guide: adopted` and replaced `## System Overview` with a one-line link to the guide.
- Each of the five `domain.md` files: replaced `## Domain Overview` with a one-line link to its guide.
- `README.md`: added a "System Guide" entry under "Understand The System".
- SR-001 said "the Domain Overview explains…"; it now points to the Loan Terms guide.

**Facts saved into the records before the overviews were removed**
- Some facts, reasons and conflict notes appeared only in the old overviews. I moved them into the records that own each topic, so nothing was lost:
  - Rationale sentences added to IFACE-001, IFACE-002, SR-001 (failure section), CONS-024, SEL-035, SEL-004 and SCOPE-013.
  - The overviews' three conflict notes are now marked "Unresolved source conflict" in the architecture record, SR-001, SR-002 and IFACE-007.
- I also added a fourth conflict note to STATE-019. The settlement helper found that conflict in the records themselves, and the Base settlement guide mentions it.

**System Explorer files**
- `visuals/assets/explorer.json` stores a fingerprint of each record the System Explorer pages draw on. I updated the fingerprints for the architecture record and STATE-019 by hand, after checking that the explorer cites no changed text and that all 171 of its citations still match.
- I then regenerated the visuals. `sources.json` was refreshed, and every generated HTML page is byte-identical to the original.

### Conflicts in the records that I left undecided
Each is now noted in its record and described as open in the guides:
1. **Lender approval.** The architecture record says reserving a loan needs no second lender approval. SR-001, STATE-001, STATE-002 and FLOW-001 say both participants approve the final terms.
2. **Fee rate when no tier is high enough.** The IFACE-007 policy text and the tickets say pick 200 sat/vB and alert. The same contract's ACT-002 says refuse ("fail closed").
3. **Number of exit packages.** One archive sentence in SR-002 says 12; the other records say 18.
4. **Base contract controls.** STATE-019 still lists an on-chain pause and forbids a single upgrade key. SR-003 and SEL-009 say there is no pause, and allow a single beta upgrade key.

### Questions I would have asked you
- Is it acceptable that asking for two guides meant writing all five domain guides? The tooling gives no way to adopt the guide for only some domains.
- How should each of the four conflicts above be resolved?
- Is it acceptable that I moved rationale with no traceable source into the records rather than dropping it? Two cases: IFACE-001's "interoperability and verifiability…", and SEL-004's "cross-loan correlation".
- Should the guides say "company" or "organization"? I used "company" in four guides and harmonized my Base Observation guide to it; the Base settlement guide says "organization" (the records' term).

### Problems I could not resolve
- **Pre-existing validation errors.** The structure validator still reports the same 5 errors it reported before I started: the UI/UX `role-split` candidate has stale runtime evidence and four missing-behavior checks. They are outside the guide work.
- **Exporter typo.** In the PDFs' "Technical records" list, the exporter prints "Scope boundarys". The typo is in the skill's code, which I was told not to change.
- **Record conflicts reported but not noted in the records:**
  - The architecture record's Vault authority bullet and SR-010's "Must Not Own" contradict each other.
  - CONS-026 still names an EIP-1193 browser-extension wallet.
  - TICKET-0126 conflicts with SR-012 and STATE-020 about the `.demo-system` folder and what reset deletes.
  - STATE-016 is missing the "externally blocked" state.
  - The architecture frontmatter's `scope_boundaries` stops at SCOPE-013.
  - FLOW-008 refers to a "repayment missed" state that STATE-011 does not define.
  - Loan-terms state names differ between SR-001 and STATE-002.
  - Bitcoin observation ownership overlaps between SR-002 and SR-006.

### What I checked
- **Structure validator:** passes except for the 5 errors that were already there.
- **Other generators and validators:**
  - The decision overview is current.
  - The ticket, technical-constraint and dependency-map validators pass.
  - The build-design validator reports only the same pre-existing UI/UX errors.
  - The System Explorer check passes.
- **Export check:** `--check` reports both PDFs as current.
- **Rendered pages:** I rendered all pages to images and inspected them. In the observation guide, a narrow table broke a word mid-column, so I turned it into a list; figures and callouts are not split.
- **Accuracy:** each guide was compared against the records it summarizes, and I spot-checked who-decided-what claims against the tickets. The guides consistently call the decision-maker "the approver" and the drafting AI "the design agent".

### Temporary files
- I used a scratchpad work folder, `t2-guide-work` (a baseline copy of the package, helper scripts and page images), and deleted it at the end.
- I also deleted `scratchpad/exc.md`, a leftover from the Bitcoin helper.
- I briefly created `/tmp/dummy` by mistake and removed it.
- Nothing outside the package changed apart from the PDFs.
