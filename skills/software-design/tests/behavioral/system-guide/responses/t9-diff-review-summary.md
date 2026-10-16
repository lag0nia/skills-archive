I reviewed all 10 files that changed outside `guide/` and changed nothing in either copy. The change has 6 Blockers and 9 Minor findings. The full report, with quotes and file:line references, is at `/private/tmp/claude-501/-Users-alanguerrero-Documents-ai-prompts/b72a9647-f430-4577-b73d-46cf594be5b3/scratchpad/eval/responses/t9-diff-review.md`.

The changed files are `README.md`, `architecture.md`, the 5 `domain.md` records, SR-001, `explorer.json` and `sources.json`.

**Blockers (6)**
- **B1 – Settlement domain, upgrade governance (`domain.md:40`):** it now adds a "dedicated single upgrade key for … the intentionally short public mainnet beta" before the 2-of-3 Safe timelock. That wording comes from SEL-009 and TICKET-0048. SR-003:33, INV-020 and STATE-019 still say the proxy stays under the Safe, which is what the domain record said before. The record switched sides in a disagreement that no record notes.
- **B2 – Bitcoin domain, lost rationale:** "cross-loan correlation", given as a reason for hardened per-loan key derivation, is now in no technical record. The new Choices item gives a different reason for a different decision (avoiding hash-to-index collisions, SEL-004).
- **B3 – Bitcoin fee conflict, dropped source:** the fail-closed side used to cite "the action contract and former decision"; "former decision" is gone. No decision record in either copy supports it. Both sides keep their own wording, and IFACE-007 is byte-identical.
- **B4 – Bitcoin package-count conflict, dropped status:** the earlier text called the 6/6/6 contract "current" and the 12-package SR-002 sentence "stale", and said the conflict "remains for a separate repair". The new text drops all three labels. Both sides keep their own wording.
- **B5 – Loan-terms, lost rationale:** canonical encoding avoids making "a package impossible to reproduce", framed as "interoperability and verifiability". This survives nowhere; it was replaced by a different rationale taken from ticket context.
- **B6 – Loan-terms, lost rule:** "a narrative or diagram cannot supply a missing approval" survives nowhere. Low impact.

**Minor (9)**
- SR-001 now sends the reader to a guide for the cooperation scenario.
- `architecture.md` no longer mentions the fee and package-count conflicts; they now live only in the Bitcoin domain record.
- `architecture.md` drops its "complete reading destination" note. That was navigation only, and would be untrue now.
- SCOPE-005 is labelled "Outside V1", but the record itself only says "deferred".
- The loan-terms domain record drops the "older" label on the approval conflict.
- The settlement domain record drops "no on-chain pause"; the statement still lives in SR-003, SEL-009 and CONS-008. STATE-019's pause roles disagree with it; that predates the change.
- The exact-script rationale was reworded from SEC-011. Same meaning, correct source.
- A participant "visual, fixture…" statement is mostly covered by SCOPE-013.
- `sources.json` refreshed hashes for domain records that carry Blockers. The visual outputs are byte-identical and don't use the changed passages, so the refresh hides nothing. It will need refreshing again once the Blockers are fixed.

**Clean**
- **Delivery-pinned records:** `repo-002-core-coordination-scope.json` pins 21 in-package files. All are byte-identical, and none of the changed files is pinned anywhere.
- **`explorer.json`:** its refreshed `architecture.md` hash is legitimate, because the architecture's meaning is unchanged.
- **Conflicts:** no side of any conflict was rewritten. Every side named in the new loan-terms note was checked against its own record.
- **Removed narrative:** everything except B2, B5 and B6 is accounted for in SR, STATE, FLOW, INV, IFACE, SCOPE, SEL and TICKET records. The attributions in the new Choices sections check out, including the "unknown-origin" tickets 0151–0156.
- **Links:** every link and anchor in the changed files resolves, including those into `guide/`. Across the package the change adds no new broken links, and nothing refers to or quotes a removed heading.
