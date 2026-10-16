## System Guide for the loan-system package: done, with PDFs exported

I used only the frozen skill copy at `.../scratchpad/frozen-skill-v5/software-design`. PKG below means `/private/tmp/claude-501/-Users-alanguerrero-Documents-ai-prompts/b72a9647-f430-4577-b73d-46cf594be5b3/scratchpad/eval/t10/bitrise21/loan-system/design/technical-design`.

**PDFs** (in `/private/tmp/claude-501/-Users-alanguerrero-Documents-ai-prompts/b72a9647-f430-4577-b73d-46cf594be5b3/scratchpad/eval/t10-pdf/`):
- `bitcoin-backed-usdc-one-loan-system-architecture.pdf` (11 pages)
- `bitcoin-backed-usdc-one-loan-system-domain-base-observation-and-fallback-review.pdf` (10 pages)
- The export tool also wrote its own record file, `system-guide-export.json`, in that folder.

### Why all five domains have guides, not just the one requested
The skill's exporter refuses to export anything until the whole package is migrated. That means every domain needs a guide, no domain record may keep its old overview section, and the README and records must link the guides. So the package now has a guide for the architecture and for every domain. Only the two you asked for were exported.

### What changed in the package (checked file by file against an untouched copy)
- **New guides:** `PKG/guide/architecture.md` and `PKG/guide/domains/<slug>.md` for all five domains.
- **`PKG/system-model/architecture.md`:**
  - flagged as using the System Guide;
  - its overview section replaced by a link to the guide;
  - an unresolved-conflict note on lender approval added;
  - a pointer to that note added beside the offer/reservation boundary bullet.
- **All five `domain.md` records:**
  - each old overview replaced by a link line;
  - a new "Choices and rationale" section holding the recorded reasons and conflict notes;
  - a few links moved there from the old overview.
- **Responsibility record SR-001:** its reference to the removed overview now points to the Loan Terms guide.
- **`PKG/README.md`:** a System Guide link added.
- **Visual fingerprints** (`visuals/assets/explorer.json`, `sources.json`): updated by hand for the changed files only. First I confirmed that nothing the System Explorer shows depends on the removed or added text. I left one entry that was already out of date before I started (`handoffs/README.md`, which the check ignores).
- No interface record or other delivery-pinned record changed.
- Outside the package I wrote only the PDFs, plus my own temporary working files in the session scratchpad (`scratchpad/t10-work/`).

### What I checked
- **Independent reviews:** fresh-context reviewers checked all six guides against their source records, and a separate reviewer checked the record changes. Every finding was confirmed against its source before it was fixed. A second independent pass rechecked the fixes in the architecture guide, the Base Observation guide and the records; its points are also fixed.
- **Validators:**
  - The structure validator shows only the 5 failures that were already there before I started: 4 ui-ux "role-split" alternative errors and 1 runtime-evidence error.
  - The assurance-coverage, build-design, delivery-readiness and ui-ux validators show the same failures as before.
  - The ticket, technical-constraint, handoff-sequence and dependency-map validators pass.
  - The visual check and the decision overview check pass.
  - The PDF export check reports both PDFs as current.
- **No internal codes or file paths** appear in any guide's visible text.
- **Every page of both PDFs, viewed as images:** headings stay with their text and no figure or callout is split or clipped. A few pages end with white space where a figure moved to the next page.

### Questions I would have asked you (open in the design; each side kept in its own words)
1. **What the lender approves, and when.** This is recorded as a conflict in the architecture and loan-terms records.
   - *No second approval:* the architecture record, the offer/reservation interface (IFACE-003), the offer selection (SEL-012: "there is no second lender-approval step"), the multi-lender scope record (SCOPE-011), the funding-vault state (STATE-010 lists "second lender approval" as invalid) and the origination flow's precondition (FLOW-001).
   - *Separate final-terms approval:* SR-001, STATE-001, STATE-002 and FLOW-001 step 4.
   - SR-001 says publication approves "the proposed commercial values only". That would reconcile the reservation wording but not SEL-012.
   - *Proposal:* ticket TICKET-0069 records your own words, "if someone clicks and accepts, it automatically accepts", which supports no second approval. TICKET-0005, though, mentions "both matching role acceptances". If you choose no second approval, update SR-001, STATE-001, STATE-002 and FLOW-001.
2. **How many exit packages there are: 12 or 18** (recorded conflict).
   - *12:* one sentence of SR-002 and CONS-014.
   - *18:* another sentence of SR-002, IFACE-005, STATE-009, STATE-015, INV-026 and FLOW-002.
   - The difference is whether the six long-stop packages are archived.
   - *Proposal:* use 18 and fix the SR-002 sentence and CONS-014.
3. **What happens when no fee rate qualifies** (recorded conflict).
   - Use the 200 sat/vB rate and alert: IFACE-007's payload and the fee ticket, which records your approval.
   - Fail closed: IFACE-007's action output and failure text.
   - *Proposal:* use 200 and alert.
4. **Browser-extension wallet in the human acceptance run** (newly recorded conflict in the participant-access record).
   - CONS-026 requires an installed extension.
   - SEL-043 and VA-003 call that path historical.
   - *Proposal:* update CONS-026.
5. **Undecided points, not recorded as conflicts** (the records might be reconciled). The guides state each as open:
   - **Cancelling after the terms are committed.** TICKET-0005 and STATE-001's reopen-after-commitment path versus STATE-002, which allows cancelling only before commitment.
   - **An on-chain pause role.** SEL-009 and CONS-008 say none; STATE-019 lists pause roles and a paused state, which may mean the off-chain pause.
   - **The single upgrade key during the public mainnet beta.** SEL-009 sets it, but STATE-019 lists an "Unrestricted unilateral upgrade/admin key" as invalid, and INV-020 describes only the Safe and timelock.
   - **Relay scope.** IFACE-008 lists three transaction types, but FLOW-009 and FLOW-010 also use the relay.
   - **Who signs acceptance and claim.** IFACE-014 says in one place that the Vault worker signs and elsewhere (ACT-002) that an external wallet signs; IFACE-015 has similar wording.

### Source-record problems to fix later (no guide change needed)
- SEC-024 leaves out the borrower long-stop route that INV-008 and CONS-027 add.
- IFACE-005's anchor-output sentence leaves out the long-stop, while its payout rule implies the long-stop has one.
- SR-009 lists only funding and repayment as the lender's payment uses, but IFACE-022 and FLOW-003 also allow a participant transfer.
- STATE-021's observation paragraph is narrower than its own transition conditions.
- TICKET-0009/0069 versus TICKET-0005 on lender approval, as in question 1.

### Old overview claims with no source (left out of the guides)
- The Bitcoin overview said a "former decision" chose fail-closed fees. No source says this; the fee tickets support 200 sat/vB.
- The Bitcoin overview said per-loan keys avoid "cross-loan correlation". No record gives that reason.

### Not resolved
- None of the open questions above, by design: answering them is your decision.
- The local demonstration is still recorded as blocked. Nothing here changes that.
