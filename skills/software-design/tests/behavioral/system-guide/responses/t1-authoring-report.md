## Result

I added a System Guide to the package, made the records link to it, and exported 7 PDFs. Two last fidelity re-reviews, one for the revised architecture guide and one for the revised Participant guide, had not reported back when I had to hand off. Their findings are not applied. The PDFs match the current guide sources, but two things were not done after the final export: the export `--check` freshness run, and a page-by-page look at all 41 pages of the combined PDF.

## PDFs written to /private/tmp/claude-501/-Users-alanguerrero-Documents-ai-prompts/b72a9647-f430-4577-b73d-46cf594be5b3/scratchpad/eval/t1-pdf

The export ran `--all --combined` and exited 0.

| File | Pages |
| --- | --- |
| `bitcoin-backed-usdc-one-loan-system-architecture.pdf` | 11 |
| `…-loan-terms-and-commitments.pdf` | 6 |
| `…-bitcoin-authorization-and-recovery.pdf` | 7 |
| `…-base-usdc-settlement-and-funding.pdf` | 6 |
| `…-base-observation-and-fallback-review.pdf` | 6 |
| `…-participant-access-and-loan-operations.pdf` | 7 |
| `…-system-guide.pdf` (combined) | 41 |

The export also wrote `system-guide-export.json`.

## Files changed inside the package

The package is /private/tmp/claude-501/-Users-alanguerrero-Documents-ai-prompts/b72a9647-f430-4577-b73d-46cf594be5b3/scratchpad/eval/t1/bitrise21/loan-system/design/technical-design.

- **New guides:** `guide/architecture.md` and five domain guides in `guide/domains/`: `loan-terms-and-commitments.md`, `bitcoin-authorization-and-recovery.md`, `base-usdc-settlement-and-funding.md`, `base-observation-and-fallback-review.md` and `participant-access-and-loan-operations.md`.
- **`system-model/architecture.md`:**
  - added `system_guide: adopted`;
  - replaced the System Overview with a link to the guide;
  - added one sentence saying the "no second lender approval" statement conflicts with the detailed records.
- **All 5 domain records (`domain.md`):**
  - removed the Domain Overview and replaced it with a link line;
  - added a "Choices And Rationale" section, which records the reasons and the unresolved conflict notes.
- **SR-001 record:** the "Domain Overview explains" pointer now points to the domain guide.
- **`README.md`:** added a System Guide link.
- **`visuals/assets/explorer.json`:** updated the `architecture.md` fingerprint, after checking that its quotes cite only unchanged sections.
- **`visuals/assets/sources.json`:** regenerated; only fingerprints changed. Every visual HTML output is byte-identical to before.

## Checks run

- **Structure validator:** shows only the same 5 errors as the untouched baseline (runtime-evidence identity, plus 4 `ui-ux/alternatives/role-split` errors). There are no guide errors, so all of the guide rules pass: navigation links, coverage by name, no visible IDs or paths, resolving links and anchors, and no Domain Overview left.
- **Other validators** (tickets: 155 valid; technical constraints; build design; UI/UX; assurance coverage): output identical to baseline.
- **Decision overview `--check`:** verified, exit 0.
- **Visuals `--check`:** passes, exit 0.
- **Owner comparison:** earlier, parallel reviewer agents compared every guide sentence with its owning records, and I corrected each guide from their findings.
- **Page inspection:** I rendered and looked at every page of the architecture PDF and all 5 domain PDFs. There was no clipping, no split figures or callouts, and tables break cleanly. For the combined PDF I checked only the cover, the contents, the first domain page and the last page.

## Conflicts I could not resolve

The guides state these as open, with both sides linked; none was repaired.

1. **Second lender approval.** These say publication is the lender's standing acceptance and no second approval is needed: the architecture record, the offer and reservation contract, the offer selection, and the user-approved ticket that excludes a "second lender commercial approval". These require both participants to approve the final terms: SR-001, the offer and terms state records, the terms binding contract and the origination flow. Which governs?
2. **No qualifying fee level.** The fee contract and its ticket pick 200 sat/vB and alert; another part of the same contract and a former decision say the selection fails closed.
3. **Exit packages.** One SR-002 sentence says 12; everything else says 18.

## Newly found discrepancies (stated in the guides; these are my questions for you)

- **What the terms contain.** The architecture record and SR-001 put the offer revision, the reservation number and the hash of S in the binding; the terms contract has no such fields. The terms contract also describes random per-loan participant references, while the offer selection binds the real account IDs.
- **Reservation ending before commitment.** STATE-001 says it simply expires. SEL-012 and IFACE-003 say any deadline without a valid prefund cancels the reservation and records an infraction.
- **Who may reveal X and Y.** IFACE-009 accepts any caller holding the secret; IFACE-014 accepts only the participant's term-bound account.
- **Pause.** SEL-009, SR-003 and the opener constraint say there is no on-chain pause; STATE-019 lists pause roles and a "paused" state.
- **Beta upgrade key.** The single-key beta period appears in SEL-009 only; INV-020 and STATE-019 omit it.
- **Protection reference.** SCOPE-004 says the terms "may bind a reference"; TICKET-0062 and IFACE-001 have only an expiry.
- **Scope list.** The architecture `scope_boundaries` frontmatter omits SCOPE-014 and SCOPE-015. I left it unchanged.

## Other notes

- **Content dropped from the old overviews:** a ticket-process statement, a "no execution evidence" status statement, and a sentence about the visual index.
- **Left unchanged:** the Security Change Control section; the Agent-First headings in the SR, BU and REPO records; and tickets whose write targets point to `domain.md`.
- **Template mismatch:** "Choices And Rationale" holds conflict notes, while the template describes it as settled choices.
- **No design decisions were made;** all changes are documentation.
- **Scratch files** are in `/private/tmp/claude-501/-Users-alanguerrero-Documents-ai-prompts/b72a9647-f430-4577-b73d-46cf594be5b3/scratchpad/t1-work/`: `baseline/` (the package before my edits), validator outputs, `render-tool/` and `pages/`. I created and immediately deleted one temporary file, `/tmp/a2.txt`.

**Still to do:** apply any findings from the two pending re-reviews, then re-export with `--all --combined`, run the export `--check`, and look through the combined PDF pages.
