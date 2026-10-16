## System Guide added and exported

I added the System Guide to the loan system's design package and exported the PDFs to `/private/tmp/claude-501/-Users-alanguerrero-Documents-ai-prompts/b72a9647-f430-4577-b73d-46cf594be5b3/scratchpad/eval/t9-pdf`. Every validator gives the same result it gave before I started. I rendered every page of the final PDFs to images and looked at each one. The export check passes.

Package `P` = `/private/tmp/claude-501/-Users-alanguerrero-Documents-ai-prompts/b72a9647-f430-4577-b73d-46cf594be5b3/scratchpad/eval/t9/bitrise21/loan-system/design/technical-design`

**PDFs** (all named `bitcoin-backed-usdc-one-loan-system-*.pdf`):

| File | Pages |
|---|---|
| `architecture.pdf` | 8 |
| `domain-loan-terms-and-commitments.pdf` | 5 |
| `domain-bitcoin-authorization-and-recovery.pdf` | 6 |
| `domain-base-usdc-settlement-and-funding.pdf` | 5 |
| `domain-base-observation-and-fallback-review.pdf` | 5 |
| `domain-participant-access-and-loan-operations.pdf` | 5 |
| `system-guide.pdf` (combined, with cover and contents) | 37 |

The exporter also writes its own `system-guide-export.json` into that folder.

**Files added in the package:**
- `guide/architecture.md`
- `guide/domains/<slug>.md`, one for each of the five domains

**Files changed in the package (nothing outside it apart from the PDFs):**
- **`system-model/architecture.md`:**
  - Added `system_guide: adopted` and a link to the guide.
  - Removed "System Overview". Its domain-relationships paragraph and its sentence about the derived visuals now sit in "System Domains".
  - Added an "Unresolved source conflict" note on lender approval, also pointed to from the matching "Cross-Domain Boundaries" bullet.
- **The five `system-model/domains/*/domain.md` files:**
  - Removed "Domain Overview" and replaced it with a link to the guide.
  - Added a "Choices And Rationale" section. Each line gives a reason and links the record that holds who made the choice.
  - Added "Outside V1" scope links under "Excludes". The removed overviews were the only place these links lived; SCOPE-014 and SCOPE-015 would otherwise have had no link from any system-model record.
- **`sr-001`:** the pointer that referred to the old overview now links the guide.
- **`README.md`:** added a "System Guide" entry.
- **`visuals/assets/explorer.json` and `sources.json`:** fingerprints only.
  - I checked that the explorer content is unaffected by the architecture edits before updating its fingerprint.
  - The generated HTML is byte-identical.

**What I checked:**
- **Validators:** all nine validators, the decision overview check and the visuals check were run before and after; the outputs are identical.
- **Failures that were already there and are unchanged:**
  - UI/UX role-split runtime evidence, which fails the structure, UI/UX and build-design validators.
  - Delivery readiness.
  - Assurance coverage, which needs `--repository` arguments I don't have.
- **Reviews:** two independent reviews, one of the technical-record diff and one of the guides against the records they explain, then a third review of my corrections. I checked each finding against its source record before fixing it. In total:
  - **Guide errors:** about 13, for example the CPFP signer being attributed to the application, an expired-funding refund described as "returns the principal", and the 180-second escalation stated wrongly.
  - **Missing domain scope links:** restored.
  - **Rationales I first wrote that their cited records don't support:** rewritten in the records' own terms.
  - **Attribution links:** wrong ones fixed, missing ones added (TICKET-0055, 0082, 0064, 0089, 0065, 0147, 0148).
- **Guide text:** no record IDs or package paths are visible. All links and anchors resolve, and the export check passes.
- **Layout:** all 71 rendered pages are clean. Headings stay with their text, tables repeat their headers, figures are never split, and nothing is clipped.

**Contradictions between records I recorded as unresolved** (in the domain records' "Choices And Rationale"):
1. **Lender approval.** The architecture record, SEL-012, IFACE-003, SCOPE-011, INV-011 and the FLOW-001 preconditions say there is no second lender approval. SR-001, STATE-002 and the FLOW-001 steps require both parties to approve the final terms. STATE-001 treats these as two different approvals.
2. **12 vs 18 exit transactions.** An SR-002 archive sentence says 12. The SR-002 construction text, INV-026, IFACE-005 and TICKET-0014 say 18.
3. **No fee level qualifies.** IFACE-007's payload rule and TICKET-0018 say use the 200 level, record fee-bump eligibility and alert. IFACE-007's selection action says fail closed and select nothing.

**Points I left open without recording a conflict** (I wasn't sure they were real conflicts; every guide passage that reaches them says they are open):
4. **On-chain pause role.** SEL-009, CONS-008, TICKET-0048/0065 and SR-003 say there is none. STATE-019, INV-019 and SEC-017 list pause roles.
5. **Upgrades and existing loans.** SEL-009 says one code path for every loan. STATE-019 and INV-020 say existing loans are not migrated or reinterpreted.
6. **Beta upgrade key.** SEL-009 and TICKET-0048 (your decision) use a single key during the beta. INV-020, STATE-019 and SCOPE-007 describe only the Safe, and STATE-019 and SEC-017 forbid an unrestricted single key.
7. **Long-stop.** INV-025, FLOW-005, FLOW-006, FLOW-007 and SEC-024 leave it out of the missing-Y case. SEC-024 even says such a loan has no borrower fallback route. CONS-027, SR-007, STATE-015 and SEC-025 include it.
8. **Where the hash of S is committed.** The architecture record says it is part of the agreement binding. IFACE-001's field list has no S field. IFACE-005 and IFACE-017 put it in the recovery script.
9. **Fee bumps after activation is queued.** IFACE-007 and TICKET-0064 allow only a fee-bump child. INV-018 also mentions the signed fee levels.
10. **One provider being enough.** SEL-014 and IFACE-012 say one healthy provider can report a final fact. SEC-020 says no single source may become authoritative.

**Facts I could not place, or that looked wrong:**
- **Unsupported overview claims I did not carry over:**
  - The ECVS overview's "risks are why … the activation gate remain material". The gate's recorded origin is counsel approval.
  - The loan-terms process rule "a narrative cannot supply a missing approval".
  - The narrative reasons "interoperability and verifiability" and "impossible to reproduce".
  - The hardened-key reasons "cross-loan correlation" and "expanded compromise".
- **Overview errors I corrected in the guides:**
  - Liquidation is excluded under SCOPE-012, not SCOPE-011.
  - The old Bitcoin overview mentioned a "former decision" for failing closed when no fee level qualifies; that decision does not exist.
- **Gaps elsewhere in the package:**
  - The architecture frontmatter's `scope_boundaries` leaves out SCOPE-014 and SCOPE-015.
  - Production gas sponsorship for payment accounts has no SCOPE record, only TICKET-0155.
  - The tickets behind the Vault payment account (TICKET-0151 to 0154 and 0156) all record their origin as "unknown".
  - The restored sentence about derived visuals mentions a construction-dependency view that `visuals/index.html` does not link to.
- **Current status:** the local demo is not delivered. BU-011 is still in progress and blocked, and VA-003 is "Planned — unverified". The guides say so.

**Questions I would have asked you:**
- For each of points 1–10, which side is the intended behavior?
- In particular: does the lender approve the final terms a second time? 12 or 18 exit transactions? Fail closed or use the 200 level? Is there an on-chain pause role? Is the single beta upgrade key acceptable given the rule against a unilateral key?
- Should SCOPE-014 and SCOPE-015 be added to the architecture's `scope_boundaries`?

My working notes, review inputs and validator outputs are in `/private/tmp/claude-501/-Users-alanguerrero-Documents-ai-prompts/b72a9647-f430-4577-b73d-46cf594be5b3/scratchpad/t9-guide-work`. The untouched copy of the package is in its `baseline/technical-design-orig` folder.
