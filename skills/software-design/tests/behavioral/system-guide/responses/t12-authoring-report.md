## System Guide added to the loan system design package, with PDFs exported

The package now has a System Guide: one architecture guide and five domain guides. The PDFs are exported and I looked at every page. Validation reports no failure that wasn't already there before I started. Four questions in the design are still undecided, and I need your answers on them (listed below).

Package: `/private/tmp/claude-501/-Users-alanguerrero-Documents-ai-prompts/b72a9647-f430-4577-b73d-46cf594be5b3/scratchpad/eval/t12/bitrise21/loan-system/design/technical-design`

### PDFs
All in `/private/tmp/claude-501/-Users-alanguerrero-Documents-ai-prompts/b72a9647-f430-4577-b73d-46cf594be5b3/scratchpad/eval/t12-pdf/`:

| File | Pages |
|---|---|
| `bitcoin-backed-usdc-one-loan-system-architecture.pdf` | 11 |
| `bitcoin-backed-usdc-one-loan-system-domain-loan-terms-and-commitments.pdf` | 5 |
| `bitcoin-backed-usdc-one-loan-system-domain-bitcoin-authorization-and-recovery.pdf` | 6 |
| `bitcoin-backed-usdc-one-loan-system-domain-base-usdc-settlement-and-funding.pdf` | 6 |
| `bitcoin-backed-usdc-one-loan-system-domain-base-observation-and-fallback-review.pdf` | 6 |
| `bitcoin-backed-usdc-one-loan-system-domain-participant-access-and-loan-operations.pdf` | 7 |
| `bitcoin-backed-usdc-one-loan-system-system-guide.pdf` (combined) | 40 |

The export also wrote its own record file, `system-guide-export.json`. Its freshness check reports every PDF as current.

### What changed in the package
- **New guides:**
  - `guide/architecture.md`
  - `guide/domains/loan-terms-and-commitments.md`
  - `guide/domains/bitcoin-authorization-and-recovery.md`
  - `guide/domains/base-usdc-settlement-and-funding.md`
  - `guide/domains/base-observation-and-fallback-review.md`
  - `guide/domains/participant-access-and-loan-operations.md`
- **`system-model/architecture.md`:**
  - Marked as using the guide, and links to it.
  - The old "System Overview" section is removed. Its link to the visual index moved into the topology section.
  - Added an open-question entry for the lender-approval point, in two places.
- **The five domain records:** each old "Domain Overview" section is replaced by a link to its guide. Facts that were only in those overviews moved into the technical sections:
  - the stated reasons for design choices;
  - links to the scope, flow and contract records behind them;
  - the disagreements, recorded as open-question or conflict entries.
- **`README.md`:** links the System Guide.
- **SR-001 (`sr-001-loan-terms-offer-reservation-and-parameter-binding.md`):** its overview sentence pointed at the removed "Domain Overview"; it now links the loan-terms guide.
- **`visuals/assets/explorer.json` and `sources.json`:** I reviewed what the diagram data quotes from the architecture record, confirmed it still holds, and updated the stored fingerprint on purpose. Regenerating changed none of the visual pages.
- **Nothing else changed.** The one pinned delivery record is byte-identical. The only things written outside the package are the PDFs, plus scratch notes and render images under the session scratchpad (`t12-guide-work/`, and two `t12-pinned*.txt` files a reviewer created).

### Questions I would have asked you (still open)
Each one is recorded beside its statements in the technical records and described as undecided in every guide passage that reaches it. Suggested answers appear only here.

1. **What does the lender approve, and when?**
   - One side says the lender gives no second approval. That's the architecture record, IFACE-003, SEL-012 ("there is no second lender-approval step"; reservation "binds … canonical terms"), SCOPE-011 and STATE-010.
   - The other side says the lender's standing acceptance covers only the commercial values. It then requires an explicit lender approval of the exact final terms, which STATE-001 calls distinct from that commercial approval. That's SR-001, STATE-001 and FLOW-001.
   - Tickets point both ways:
     - TICKET-0069 records the decision as "no email invitation or second lender approval", quoting your words "if someone clicks and accepts, it automatically accepts". Its resolution says "second lender commercial approval".
     - TICKET-0150 records "Both participants approve the final terms separately afterward."
   - The old overview called this a conflict. I recorded it as an open question, because a consistent reading may exist. One of the reviewers agreed with that classification.
   - Suggestion: confirm two separate approvals (standing commercial approval, then explicit final-terms approval), and reword SEL-012, SCOPE-011, STATE-010, IFACE-003 and the architecture record to say "no second commercial approval".
2. **How many packages are in the signed set after activation? (conflict)** SR-002 says "the 12-package signed terminal phase". SR-002's own 6+6+6 terminal variants, STATE-009 ("Exact 18-package terminal inventory"), INV-026, FLOW-002 and FLOW-010 say 18. Suggestion: 18; correct SR-002.
3. **What happens when no signed fee level is high enough? (conflict)** The IFACE-007 payload and the answered fee tickets say to "select 200 sat/vB, record CPFP eligibility, and alert". IFACE-007's selection action says the result is a "fail-closed no-eligible-tier result" that "selects nothing". The old overview also cited a "former decision" for failing closed, but no record holds such a decision, so I could not place it anywhere.
4. **Base contract upgrades and pause.** The step-5 reviewer raised this; I checked it against the records.
   - (a) Who may upgrade during the beta (conflict): SEL-009 uses a single upgrade key during the short public beta. INV-020, SR-003 and SCOPE-007 keep the 2-of-3 Safe with a seven-day timelock for the whole version. STATE-019 treats an "Unrestricted unilateral upgrade/admin key" as invalid, and SEC-017 says no unilateral key may "bypass the timelock/Safe".
   - (b) How upgrades reach existing loans (open question): SEL-009 says an upgrade "becomes the one current code path for every loan held by the proxy". INV-020 says existing loans "remain on their originating contract and are not silently migrated". STATE-019 says "Do not migrate or reinterpret existing originating loans" and forbids retroactive mutation.
   - (c) Is there an on-chain pause? (open question): SEL-009 and SR-003 say there is none. STATE-019 has pause roles and a "Paused for new/risky action" state triggered by an authorized operational role.

### Things I could not place, or noticed in passing
- **Payment feature status:** the old participant overview said the Vault payment feature "is still an implementation target with no execution evidence". No record holds that status, so I didn't put it in the records. The guide instead quotes the handoff sequence: the transfer-review correction passes its focused checks but its delivery isn't finalized, and the browser proof waits on the local demo, which is blocked.
- **"Cross-loan correlation":** given as a reason for per-loan keys only in the old Bitcoin overview. I kept it as the domain record's stated reason; SEL-004 and SEC-013 don't mention it.
- **Gas-sponsorship status mismatch:** TICKET-0155 has status out-of-scope, while IFACE-015 calls production payment-account gas sponsorship deferred.
- **Architecture header scope list:** it names SCOPE-001 to SCOPE-013, but SCOPE-014 and SCOPE-015 exist. I didn't change it.
- **Validator failures that were already there before I started, unchanged:**
  - UI/UX role-split candidate evidence (structure, build-design and UI/UX validators);
  - 962 delivery-readiness findings;
  - the assurance-coverage validator, which needs repository arguments.

### What I checked
- **Validators:** ran every one on the untouched package first, then again after the final technical edits. Each output is identical to the baseline. The guide checks report 0 errors, rerun after the last guide edit. The visuals and decision-overview checks pass.
- **Independent reviews (reviewers that wrote none of the changes):**
  - A technical-diff review: every removed statement survives in a named owner, the pinned records are identical, and every link resolves. It found 10 items. I checked each against its record and fixed the ones that held up, including incomplete sides on the approval question, one misquoted conflict line, a misdirected Excludes line and a wrongly cited owner.
  - A guides-versus-records review: 18 items. I checked each and fixed the ones that held up, including a missing trigger condition for S, wrong "test-network" wording for the demo, missing upgrade-governance conditions, an overstated script limit, the demo and payment status, and acronym definitions. It also surfaced the upgrade and pause points above.
  - Three further focused rechecks of those corrections. The last one found a single wording slip about the ticket quote, which I fixed as it suggested.
- **Self-review:** compared the guides against their records under the skill's writing standard.
- **Export:** rendered all 81 pages to images and looked at each. There is no clipping or overflow. Figures, tables and headings stay together. The combined edition has its contents page with page numbers and its list of technical records. The only blemishes are some white space where a figure moved to the next page whole, and on page 11 of the combined PDF the line "Six points are open…" sits at the bottom of the page with its list starting on the next.
