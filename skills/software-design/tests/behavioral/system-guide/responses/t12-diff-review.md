# T12 diff review: reader guides and moved narrative (loan-system technical design)

- Before the change: `eval/pre/bitrise21/loan-system/design/technical-design` (called `pre/` below)
- After the change: `eval/snap-t12/bitrise21/loan-system/design/technical-design` (called `snap/` below)
- Method: `diff -ru -x guide pre snap`. I read every removed and added line and searched all technical records in `snap/` for the statements, leaving out `guide/`, `visuals/`, `ui-ux/` and `.obsidian/`. I verified every quotation the change added against its source, recomputed every stored hash, and resolved every link and anchor in the changed files. I modified nothing.

## Result

| Rating | Count |
| --- | --- |
| Blocker | 8 |
| Minor | 3 |
| None | 10 entries, listed in section 4 for completeness |

Short version: almost all of the narrative removed from the five `domain.md` files and the architecture overview is still covered, with the same meaning, by the SR, IFACE, STATE, INV, SCOPE, SEL and CONS records. Section 5 gives the per-file accounting. The pinned records and the stored hashes are clean.

The problem is where the change touched disagreements. Four noting records (the Bitcoin, Settlement and Loan Terms domains, plus the architecture) previously took a side or kept a qualifier. They were rewritten into neutral "chooses neither" open questions. The change also added new open questions that the package did not record before. It dropped one side of the fee conflict ("former decision") and lost one statement without moving it anywhere ("a narrative or diagram cannot supply a missing approval").

The sides of every disagreement are intact. None of the records that hold a side was edited, and every quotation the change added matches its source exactly.

---

## 1. Changed files outside `guide/`

| File | Nature of change |
| --- | --- |
| `README.md` | +1 line: System Guide entry |
| `system-model/architecture.md` | Frontmatter `system_guide: adopted`; guide pointer; `## System Overview` removed; visual-index sentence moved; open question added twice (Purpose And Binding l.23, Cross-Domain Boundaries l.80) |
| `system-model/domains/base-observation-and-fallback-review/domain.md` | `## Domain Overview` and its subsections removed; Excludes +1; new `## Choices And Rationale`; Cross-Domain +1 |
| `system-model/domains/base-usdc-settlement-and-funding/domain.md` | Overview removed; Excludes +1; new Choices And Rationale with 1 conflict + 2 open questions; Cross-Domain +2 |
| `system-model/domains/bitcoin-authorization-and-recovery/domain.md` | Overview removed; Excludes +1; new Choices And Rationale with 2 conflicts; Cross-Domain +2 |
| `system-model/domains/loan-terms-and-commitments/domain.md` | Overview removed; new Choices And Rationale with 1 open question; Cross-Domain +2 |
| `system-model/domains/loan-terms-and-commitments/responsibilities/sr-001-…md` | Line 17: "the Domain Overview explains" changed to "the [Loan Terms And Commitments guide] explains" |
| `system-model/domains/participant-access-and-loan-operations/domain.md` | Overview removed; Excludes +4; new Choices And Rationale; Cross-Domain +2 |
| `visuals/assets/explorer.json` | `sources["system-model/architecture.md"]` hash refreshed |
| `visuals/assets/sources.json` | Hashes refreshed for architecture, 5 domain.md files, SR-001 and explorer.json |

---

## 2. Pinned records, stored hashes, links (checks 4 and 5)

**Pinned delivery evidence.** Only one handoff carries hashes: `build/workflow/handoffs/repo-002-core-coordination-scope.json`. It pins IFACE-003 to IFACE-020, IFACE-022, BU-006 and BU-007. I recomputed all in-package pins and every one matches; all of those files are byte-identical to `pre/`. None of the changed files is pinned there, and no other file in `build/` stores a hash of any changed file, old or new. **Result: none.**

**`visuals/assets/sources.json`.** All 239 source hashes and all output hashes match `snap/`. The generated `index.html`, `system.html`, `states.html` and `maps/*.html` are byte-identical between `pre/` and `snap/`. The manifest is the generator's mechanical staleness record (`generate-visuals.mjs` hashes every `system-model`, `build/units` and `build/records` file). Refreshing it after a regeneration that produced identical outputs therefore hides nothing about the visuals.

Note, though, that the refreshed entries cover the domain files carrying findings B1 to B8. The refresh is legitimate only as a statement that the visuals don't depend on that text. It is not evidence that those meaning changes were reviewed. **Result: none.**

**`visuals/assets/explorer.json`.** This is the reviewed explorer, and its `sources` map records the architecture hash. All 9 explorer references into `architecture.md` resolve under the same heading with the same quote (headings "Authority And Sources Of Truth", "V1 Operating Topology And Availability Boundary" and "Target Outcome And Runtime Profiles"). None of the explorer's claims depends on the removed System Overview or on the new approval open question; the only approval wording is the Participant summary "approve sensitive actions in the separate Vault". The refresh does not hide a changed meaning that the explorer consumes. **Result: none.**

**Links and anchors.** I checked 220 relative links in the 8 changed markdown files and found 0 broken targets and 0 missing anchors. That includes `#purpose-and-binding`, `sr-002…#owns`, `sr-003…#owns`, and all guide links (`../guide/architecture.md`, `../../../guide/domains/*.md`, and `../../../../guide/domains/loan-terms-and-commitments.md` from SR-001). Nothing in `snap/`, guide included, links to a removed heading such as `#system-overview`, `#domain-overview` or any removed subsection.

The only textual consumer of a removed section was SR-001 l.17 ("the Domain Overview explains"), which the change updated. The phrase "System overview" in `README.md:32` and in `visuals/*` names the visual explorer page, not the removed architecture section.

**Quotation consumers.** The explorer quotes are covered above. `graphs.json` has no references to any changed file.

---

## 3. Disagreements touched by the change (check 3)

| # | Disagreement | Side A (wording intact?) | Side B (wording intact?) | Noting record(s): what happened |
| --- | --- | --- | --- | --- |
| C1 | What the lender approves, and when | architecture l.21, IFACE-003 l.91, SEL-012 l.15/l.31, SCOPE-011 l.14, STATE-010 l.46: all unchanged | SR-001 l.31 (only l.17 changed), STATE-001 l.47, FLOW-001 l.29, TICKET-0069 (sr-010 l.93-94), TICKET-0150 (sr-004 l.104): all unchanged | Loan-terms domain had taken side B; **rewritten to neutral (B6)**. Architecture was already neutral and still is, but **a new sub-question was added (B7)** |
| C2 | Size of the post-activation signed terminal phase (12 vs 18) | SR-002 l.36 "the 12-package signed terminal phase": unchanged | SR-002 l.31, STATE-009 l.53, INV-026 l.14/31/33, FLOW-002 l.31-32, FLOW-010, CONS-027 l.14: unchanged | Bitcoin domain had labelled side A stale; **rewritten to neutral (B1)** |
| C3 | Parent fee when no signed tier qualifies | IFACE-007 l.21, fee ticket (sr-002-fee-selection l.18/l.115): unchanged | IFACE-007 ACT-002 l.57/l.61: unchanged; the **"former decision" side was dropped (B2)** | Bitcoin domain (was already neutral) |
| C4 | Upgrade authority during the public beta | SEL-009 l.29: unchanged | INV-020 l.14, SR-003 l.33, STATE-019 l.48, SCOPE-007 l.14, SEC-017 l.55: unchanged | Settlement domain had stated side B as the retained choice; **rewritten to neutral (B3)** |
| C5 | How upgrades reach existing loans | SEL-009 l.32: unchanged | INV-020 l.14, STATE-019 l.37/l.48, SEL-009 l.40, SCOPE-007 l.23, SEC-017 l.55: unchanged | **Newly recorded open question (B5)**; not noted anywhere before |
| C6 | On-chain pause | SEL-009 l.15/l.30, SR-003 l.33: unchanged | STATE-019 l.15/l.26/l.38, SEC-017 l.55/l.66: unchanged | Settlement domain had stated "V1 has no on-chain pause"; **rewritten to an open question (B4)** |

I checked every quotation the change added in C1 to C6 character for character against its source, and all of them match. No record that holds a side was rewritten.

---

## 4. Findings

### Blocker

**B1. The Bitcoin domain's verdict on the 12 vs 18 terminal-package conflict was rewritten to neutral, and its repair status was lost.**

Before (`pre/…/bitcoin-authorization-and-recovery/domain.md` l.25):
> "The current package contract specifies six borrower recovery, six lender recovery, and six borrower long-stop variants. A stale SR-002 archive sentence still says twelve terminal packages; this documented source conflict remains for a separate repair."

After (`snap/…/bitcoin-authorization-and-recovery/domain.md` l.45):
> "Unresolved source conflict: size of the post-activation signed terminal phase. [SR-002] states that "the 12-package signed terminal phase must receive its own R2/D1 receipt"; … describe an 18-package terminal set. This record chooses neither."

The domain had sided with 18 ("current package contract") and called the SR-002 sentence "stale". It now chooses neither, so the record was rewritten to agree with the architecture's earlier neutral wording ("fee/count discrepancies … remain unresolved source issues", `pre/architecture.md` l.22). "Remains for a separate repair" is lost: no technical record holds it, and the guide doesn't either. Both sides themselves are intact.

**B2. The fee conflict lost one attributed side ("former decision") and the "earlier" qualifier.**

Before (`pre/…/bitcoin-authorization-and-recovery/domain.md` l.33):
> "an earlier ticket/payload selects the largest tier with an alert, while the action contract and former decision say fail closed."

After (`snap/…` l.46): the 200-sat/vB side is the IFACE-007 payload plus the fee-selection ticket. The fail-closed side is only "IFACE-007 ACT-002 states that the output is "a fail-closed no-eligible-tier result" and that no eligible tier "selects nothing"".

The "former decision" that also said fail closed has disappeared. I found no record in `snap/` (or `pre/`) that carries a fail-closed decision on this point. `decision-overview.md` l.69/l.419 and the fee tickets all say use 200 with CPFP eligibility and alert. The statement that such a decision existed is therefore lost. Dropping "earlier" also removes the before-text's indication of which statements were older. Neutrality ("This record chooses neither") matches the old "does not authorize either interpretation", so that part is fine.

**B3. The Settlement domain no longer states the 2-of-3 Safe and seven-day timelock as the retained upgrade administration. It now records this as an unresolved conflict.**

Before (`pre/…/base-usdc-settlement-and-funding/domain.md` l.35):
> "The recorded construction choices use immutable ownerless vaults, while the main contract retains its explicit Transparent Proxy administration, 2-of-3 Safe, seven-day timelock, compatibility checks, and opener-replacement boundary."

After (`snap/…` l.40-41):
> "The main contract keeps Transparent Proxy upgradeability with exact-code publication and compatibility verification before every upgrade and delayed opener replacement. … Who holds upgrade authority during the beta … [is] recorded in the next two lines, not as settled choices."
> "Unresolved source conflict: upgrade authority during the public beta. [SEL-009] selects "a dedicated single upgrade key …" … This record chooses neither side."

The domain had been a side (with INV-020, SR-003 l.33 and SCOPE-007). It was rewritten from a settled statement to neutral. The statement itself is not lost, because SR-003 l.33 still owns "Transparent Proxy administration retained under a 2-of-3 Safe-controlled seven-day timelock". The quoted disagreement with SEL-009 l.29 appears genuine. But a change whose job was to move narrative should not move this domain's status from settled to unresolved.

**B4. The Settlement domain's "V1 has no on-chain pause" became an open question.**

Before (`pre/…` l.35):
> "V1 has no on-chain pause; direct valid exits remain available during application or opener shutdown. These choices remain governed by [STATE-019], [INV-019], and [INV-020]."

After (`snap/…` l.43):
> "Open question: on-chain pause. … Whether that pause is only the frontend/API operational stop is not settled; this record chooses neither reading."

This is a status change from settled to open, and the domain was rewritten from a side to neutral. The underlying statements still live in SR-003 l.33 ("no on-chain pause, and valid direct exits during application/opener shutdown") and SEL-009 l.30. The quotes from STATE-019 and SEC-017 are accurate.

**B5. The Settlement domain gained a new open question: "how upgrades reach existing loans".**

After (`snap/…` l.42):
> "Open question: how upgrades reach existing loans. [SEL-009] states "A compatible approved upgrade becomes the one current code path for every loan held by the proxy"; [INV-020] states "existing loans remain on their originating contract and are not silently migrated" … this record chooses neither reading."

Neither `pre/` domain nor any other `pre/` record noted this disagreement, so this is a status added by the change. All six quotations are exact, and the sides are untouched. The issue is that a narrative move introduced an unresolved question that needs its own owner and decision. It should not appear silently in a refactor.

**B6. The Loan Terms domain was rewritten from taking a side to neutral, and its "older" and "approved" qualifiers were dropped.**

Before (`pre/…/loan-terms-and-commitments/domain.md` l.21):
> "The detailed approved records distinguish commercial reservation from final agreement. … Each role explicitly approves that same candidate, and the atomic second matching approval commits it once. … The architecture's older standing-approval wording conflicts with these detailed records; this migration records the discrepancy without deciding new behavior."

After (`snap/…` l.39):
> "Open question: what the lender approves, and when. One side states that the lender gives no second approval: The [architecture record] …, [IFACE-003] …, [SEL-012] …, [SCOPE-011] …, and [STATE-010] …. The other side requires an explicit lender approval of the exact final bound terms: [SR-001] …, [STATE-001] …, and [FLOW-001] …. … this record chooses neither reading."

Before, the domain characterized the architecture wording as "older" and the detailed records as "approved", which favoured side B. Now it is neutral and matches the architecture's framing; the "older" attribution exists nowhere else. It also newly places IFACE-003, SEL-012, SCOPE-011 and STATE-010 on side A, where the before text named only "the architecture's older … wording". Those quotes are exact. The underlying final-approval sequence is not lost: SR-001 l.31 and l.33 and STATE-001 l.47 hold it.

**B7. A new sub-question, "whether reservation itself binds the canonical terms", was added to the architecture and to the Loan Terms domain.**

After (`snap/architecture.md` l.23 and `snap/…/loan-terms-and-commitments/domain.md` l.39):
> "Whether the unqualified "no second lender approval" wording admits a distinct final-terms approval, and whether reservation itself binds the canonical terms, is not settled; this record chooses neither reading."

Plus `snap/architecture.md` l.80 (a new Cross-Domain Boundaries bullet repeating the open question).

Before, the architecture only said "Existing approval-wording … discrepancies identified by the migration remain unresolved source issues" (`pre/architecture.md` l.22). The approval question was already open, so stating it in full is fine. The binding question (SEL-012 l.15 "binds the borrower, selected lender, and canonical terms" against SR-001 l.31 "Neither publication nor reservation approves or commits final bound terms") is a new unresolved status. The architecture's own side sentence (l.21) is unchanged.

**B8. One statement was lost: "An unresolved implementation question belongs in its existing ticket; a narrative or diagram cannot supply a missing approval."**

Before: `pre/…/loan-terms-and-commitments/domain.md` l.33. After: absent from `snap/`. I searched every technical record (and the guide) for "narrative", "diagram … approval", "missing approval" and "existing ticket". The only near match is SCOPE-008 l.14 ("product narrative are outside this technical blueprint"), which does not carry the meaning. This rule limits what narrative can do. It matters more now that narrative lives in `guide/`, so it should survive in a technical record.

### Minor

**M1. `README.md` l.19 says the guide is "also exported as PDFs", but there is no PDF anywhere under `snap/bitrise21/loan-system/design/`.** The link target `./guide/architecture.md` resolves.

**M2. The Bitcoin domain's no-authority caveat now also covers fee-tier reasons.**

Before (`pre/…` l.37):
> "Those are reasons for the existing contracts, not permission to add recovery authority."

Here "those" referred to the exact-script, envelope/KDF and derivation rationale.

After (`snap/…` l.44):
> "The reasons recorded for the fee-tier, exact-script, envelope/KDF, and derivation choices explain the existing contracts; they grant no additional recovery authority."

The added scope is restrictive and harmless, but it is a scope edit.

**M3. "Recorded reason … [record] holds the choice/rule/threat" can be read as saying the named record contains the reason.**

The rationale text itself survives verbatim in each domain record, which is fine. But some named records do not contain the reason:

- SEC-011 has no "strand collateral or authorize the wrong party"; its nearest wording is l.66 "unspendable/lost recovery to wrong output".
- SEL-027 does not mention backup portability.
- IFACE-007 does not state "the parent is signed before use".

SEL-013 l.23, SEL-015 (Options), CONS-020 l.14, SEL-004 l.15, SEL-009 l.23-25 and CONS-024 l.31 do support their stated reasons in substance. Before the change, the text said "The recorded rationale … is" without naming a holder. Consider "[record] holds the choice" without implying it holds the reason, or citing the reason's actual holder.

### None (recorded for completeness)

- **N1.** `architecture.md` frontmatter `system_guide: adopted`: new metadata. The visuals generator reads only `design_format`. No meaning change.
- **N2.** Architecture visual-index sentence: moved verbatim from the removed overview (pre l.22) to `snap/architecture.md` l.47.
- **N3.** SR-001 l.17: the pointer changed from "the Domain Overview" to the guide. The normative cooperation rules are in SR-001 Owns (l.31-33) and Failure And Recovery.
- **N4.** Dropped navigation and meta sentences that the removal makes moot:
  - architecture "Each domain below is a complete reading destination; responsibility and contract links provide precise detail."
  - observation "Exact contracts and the two responsibility records below remain the owners of every rule summarized here."
  - participant "The exact mechanics stay with their contracts; prior implementation repair history stays with tickets and handoffs."
  - participant "These are existing exclusions, not newly selected capabilities." The new Excludes bullets say "deferred under SCOPE-015/SCOPE-014", and those SCOPE records say "deferred".
- **N5.** Excludes additions (observation l.27, settlement Excludes, bitcoin Excludes, participant l.29-32) restate removed overview exclusions with the same meaning and the same SCOPE links. The participant gas-sponsorship bullet's attribution is accurate: IFACE-015 l.15 says "future production payment-gas sponsorship is deferred", and TICKET-0155 is `status: "out-of-scope"` with title "Defer production payment-account gas sponsorship" (sr-005-tickets l.75-77).
- **N6.** Pinned records: clean (section 2).
- **N7.** `sources.json` refresh: consistent, and the outputs are byte-identical (section 2).
- **N8.** `explorer.json` refresh: consistent, and all quotes resolve (section 2).
- **N9.** Links, anchors and inbound references: clean (section 2).
- **N10.** Every quotation added for C1 to C6: exact (section 3).

---

## 5. Per-file accounting of removed and changed lines (check 1)

Format: removed statement (abridged quote from `pre/`), then the technical record in `snap/` that holds it, with a quote. "Domain l.N" means the same domain file in `snap/`. Anything not accounted for is listed in section 4.

### 5.1 `README.md`
Nothing removed; one line added (M1).

### 5.2 `system-model/architecture.md`: removed `## System Overview` (pre l.15-22)

| Removed (pre) | Where it lives now (snap) |
| --- | --- |
| "coordinates one borrower, one selected lender, Bitcoin collateral, and USDC settlement on Base" | architecture l.21 "coordinates a browsable lender-published one-loan offer … Bitcoin collateral, and a Base USDC loan between one borrower and one selected lender" |
| "five domains separate agreement meaning, participant Bitcoin authority, Base value movement, verified observation and conditional fallback, and durable application coordination" | architecture `## System Domains` table (l.65-71): Purpose column for each of the five domains |
| "login is not a Vault unlock" | architecture l.32 "Product authentication permits ciphertext access only; it is not decryption, signing, secret recovery, or chain authority" |
| "an accepted command is not a chain fact" | architecture l.37 (SR-011) "no independent Bitcoin or Base truth"; INV-013 (artifact state is not external state) |
| "a Base refund is not a confirmed Bitcoin recovery" | SR-003 l.38 "must not imply … refund, Bitcoin recovery"; INV-025 l.22 "incorrectly treat Base exclusivity as Bitcoin invalidation" |
| Per-domain roles: "Loan Terms … supplies the shared identity …", "Participant Access … presents and persists …", "Bitcoin Authorization … constructs and validates fixed participant-authorized packages", "Base USDC Settlement … controls its own funding, acceptance, repayment, claim, and refund", "Base Observation … qualifies named Base events and independently constrains optional `S` publication" | architecture Authority And Sources Of Truth l.29-39 (SR-001, SR-003, SR-006, SR-007, SR-011 bullets) and System Domains table |
| "A normal repayment lets the lender disclose `Y`; lender silence can lead to a Base refund and, only for an activated precommitted fallback loan, conditional `S` recovery" | FLOW-004; FLOW-005; INV-025 l.14 "borrower Bitcoin recovery through `S` exists only for a loan created after the ECVS production-activation gate" |
| "Either Bitcoin path becomes final only when the expected spend confirms" | architecture l.30 "Bitcoin consensus owns … confirmations, reorgs, and the one final Bitcoin spend"; FLOW-004 step 6 "Expected spend confirms" |
| Visual-index sentences | Moved verbatim to l.47 (N2) |
| "Each domain below is a complete reading destination …" | N4 |
| "Existing approval-wording and fee/count discrepancies … remain unresolved source issues; this documentation revision does not choose new behavior" | Approval: architecture l.23 open question ("this record chooses neither reading"), with B7 for the added sub-question. Fee/count: bitcoin domain l.45-46 ("Unresolved source conflict … This record chooses neither"), with B1 and B2 for how that record was rewritten |

### 5.3 `domains/base-observation-and-fallback-review/domain.md`: removed Domain Overview (pre l.11-41)

| Removed (pre) | Where it lives now (snap) |
| --- | --- |
| Domain makes one chain's evidence usable elsewhere; "a missing lender response cannot bridge those authorities" | Domain l.17 Purpose; SR-006 l.37-38 "inference from raw token transfers/balances", "must not imply … that missing `Y` satisfies the IFACE-017 condition" |
| Two responsibilities, observation vs fallback; "Neither … decides who deserves the collateral or signs a Bitcoin transaction" | Domain l.31-34 table; Excludes l.26 "Bitcoin signing or broadcast, destination selection, discretionary evidence arbitration" |
| Named events for funding, acceptance, repayment, claim, refund; checks chain, deployment, loan, transaction, block | SR-006 l.27-28 |
| "An event first seen … is provisional. Even the intermediate "safe" status is only progress information; … lifecycle advances and Bitcoin handoffs wait until … Base L1 finality" | STATE-011 l.48 "`observed`/`safe` are display-only; Base L1 finality makes a fact lifecycle-usable"; IFACE-012 l.91; STATE-014 l.32 |
| Finality rationale "accepts additional waiting … not a promise of an exact waiting time" | Domain l.38 (verbatim); SEL-013 l.23 |
| Versioned ingestion handoff; acknowledge before cursor advances; resend on lost acknowledgement; stable identity prevents duplicate | IFACE-012 l.70; SR-006 l.31 "cursor advancement only after API acknowledgement", l.58 "resend the same observation identity after a failed acknowledgement" |
| Event-history rationale ("restart or provider change can reconstruct …") | Domain l.39 (verbatim); SEL-015 Options |
| Alchemy primary, QuickNode fallback; one healthy provider sufficient; dual outage or conflict keeps projections and blocks new actions | SR-006 l.29 |
| Reorg: noncanonical retention, correction, replay from last common finalized block | SR-006 l.31, l.58 "mark displaced events noncanonical" |
| Operator may request recheck, cannot change fact, override, or advance cursor | SR-006 l.58 |
| Bitcoin evidence: fresh agreement, conflicts block, one incident, replay, post-acceptance immediately critical | SR-006 l.30, l.58 "treats post-`X` failure as immediately critical" |
| Vault payment transfers update only their own record; only named finalized events establish funding or repayment | SR-006 l.32-33 |
| Worked case: Y before cutoff, finalizer completes borrower-signed fixed-destination tx; missing Y does not release Bitcoin | FLOW-004; INV-025 l.14 |
| C = D + 172,800; claim disabled; recipient frozen; anyone may refund; caller cannot choose destination | SR-003 l.30-31; CONS-010 l.14; SEL-022 l.31 |
| Borrower may switch to committed borrower protocol account before C | SR-003 l.31; SEL-008 l.40 |
| Observer reports exact refund once finalized; claim/refund mutually exclusive | FLOW-005; INV-007; SR-006 l.27 |
| "The refund does not require the fallback service, and the Bitcoin output remains separately unspent" | FLOW-006 l.33 "Base refund remains complete without ECVS"; CONS-010 l.18 "ECVS … must never gate … the permissionless Base refund" |
| ECVS: one contracted independent service, unique random S per loan, returns only H(S) before construction; script contains commitment; company, borrower and lender cannot get S or command release | CONS-020 l.14; IFACE-017 l.48, l.63 "Bitrise, product watcher, operator, borrower, and lender cannot command or override publication" |
| ECVS checks independently; publishes S durably and publicly; Bitcoin uses S in the same borrower-signed recovery tx; no fresh signature, second family, service key or destination; publication, broadcast and confirmation are separate | CONS-010 l.18; CONS-020 l.14; IFACE-020 l.59 "no second fallback family"; FLOW-004 l.29 "No fresh borrower signature, output change"; CONS-021; IFACE-020 ACT-003 |
| Production gated by counsel and implementation evidence; no H(S) commitment or advertising until then | Domain l.26, l.46; SR-001 l.29 "Conditional `H(S)` is present only for loans created with the approved capability"; `repo-002-core-coordination.md` l.2147 "No `H(S)` loan may be created or advertised" |
| Existing Y-only escrow cannot acquire capability | IFACE-017 l.48 "Existing `H(Y)`-only escrow cannot be upgraded" |
| Service holds no Bitcoin key or arbitration role; secret can be early, withheld, lost or compromised; hence controls and gate | Domain l.40 (verbatim); CONS-020 l.14; IFACE-017 l.48 |
| Missing Y, elapsed time, application assertion, raw transfer, earlier `Repaid` cannot trigger S | SR-007 l.29 "Missing Y, the earlier Repaid event, passage of time or a token balance is insufficient"; CONS-010 l.18 |
| If ECVS fails, refund stays complete and S recovery is unavailable | FLOW-006 l.33; CONS-020 l.14 |
| Lender route at D + 3 days; long-stop at D + 10 days does not cancel lender route; one confirmed spend wins; cooperation is another route | INV-008 l.14 "`T = D + 259,200` … `B = D + 864,000` … timelocks do not expire an already-valid route; … compete until one confirms"; FLOW-010 l.25; FLOW-006 l.33 |
| Residual risks, not default or guarantee | INV-025 l.14, l.22 |
| SCOPE-001/002 exclusions; no collateral key, sale or payout power | Domain Excludes l.27 (same wording) |
| "Exact contracts … remain the owners …" | N4 |

### 5.4 `domains/base-usdc-settlement-and-funding/domain.md`: removed Domain Overview (pre l.11-35)

| Removed (pre) | Where it lives now (snap) |
| --- | --- |
| Domain owns USDC on Base; Base payout can expose a secret but cannot sign, broadcast or confirm Bitcoin | SR-003 l.15, l.37; architecture l.82 "Base facts and public secrets never sign, redirect, broadcast, or confirm Bitcoin" |
| Funding and repayment vault definitions; transfers provisional until named action; payer-neutral; fixed recipients from loan, not payer | SR-003 l.29, l.33, l.38; IFACE-011 l.68, l.70 "The payer gains no borrower/lender role, destination selection, refund right" |
| SR-003 scope: states, deadlines, calls, events, errors, amounts, recipients; atomic acceptX; revert without success event | SR-003 l.27-29, l.55 "reverts with a named error, no success event, and no unintended movement" |
| Permissionless calls: caller pays gas without control | SR-003 l.58 "gains no exclusive right or discretion"; CONS-010 l.16 "That wallet receives no contract role or exclusive right" |
| SR-005: presents vault, chain, asset, loan, remaining principal, deadline, recipient; one or more transfers incl. Vault payment account; partial deposits accumulate; no pooling, substitution or auto-draw | SR-005 l.27-30, l.34 |
| Funding window after qualified origination; exact-principal finalization; bounded acceptance lifetime; borrower discloses X via Vault call; acceptance pays principal; Bitcoin activation pending | SR-003 l.29; CONS-011 l.14 "Successful Base funding starts a 24-hour `X`-acceptance lifetime"; FLOW-001/FLOW-002 (now linked in Cross-Domain l.50) |
| Only confirmed Bitcoin evidence makes active-collateral projection eligible | INV-002 (activation gate); SR-003 l.37 "Must Not Own … active-collateral state" |
| Never accepted: fixed-recipient expiry or refund; prefund has own recovery | SR-003 l.28 (`refundExpiredFunding`, `refundUnaccepted`); FLOW-003 l.39 |
| Balance is not valid repayment; exact debt no later than D; claim strictly before C; pays fixed lender recipient once, exposes Y; one switch before C; freeze at C | IFACE-011 l.68; SR-003 l.29-31 |
| No claim before C: claim lost permanently, refundable once; `UnclaimedRepaymentRefunded` only positive trigger; refund does not imply Bitcoin recovery; T independent | SR-003 l.30; SR-007 l.29; CONS-010 l.18; INV-008 l.14 |
| Wrong loan/hash/role/etc. blocks; excess and late USDC fixed paths; no generic rescue | SR-003 l.58, l.37 "generic token rescue"; SR-005 l.51; CONS-013 l.26 |
| Retries reload facts and keep the same effect | SR-003 l.58; SEL-029 l.35 "Never automatically change … or manufacture a new route or transaction" |
| Operator may request but not edit or claim success | SR-003 l.58 |
| Immutable ownerless vaults | Domain l.39; SR-003 l.54 |
| "main contract retains … 2-of-3 Safe, seven-day timelock …" | SR-003 l.33 (same meaning); domain status changed (**B3**) |
| "V1 has no on-chain pause; direct valid exits remain available …" | SR-003 l.33; SEL-009 l.30; domain status changed (**B4**) |
| Governed by STATE-019, INV-019, INV-020 | Domain l.40, l.43, l.51 |
| Vault payment account and participant transfer don't change payer-neutral contracts or historical recipients | SR-003 l.32 |
| Cooperative settlement lacks complete Base accounting (SCOPE-005); liquidation, custody, auto-allocation excluded | Domain Excludes l.27-28 |

### 5.5 `domains/bitcoin-authorization-and-recovery/domain.md`: removed Domain Overview (pre l.11-37)

| Removed (pre) | Where it lives now (snap) |
| --- | --- |
| Prefund, escrow and PSBT definitions; signed package is prior authorization, not destination choice; consensus is authority | INV-003; SR-002 l.31; architecture l.30 |
| X, Y, S purposes; long-stop is secretless absolute-timelock route; no organization collateral key | STATE-005/006/007; CONS-021; CONS-027 l.14; INV-008 l.14 "requires no `Y` or `S`"; architecture l.39 "The organization has no collateral-script key" |
| SR-002 scope; consumes committed terms and acknowledged allocations, cannot allocate keys or invent bindings; fee selection, relay, observation, fee-bump boundary | SR-002 l.28 "It cannot request allocation, choose an index …", l.31-36; IFACE-007/008/016 (now linked l.53) |
| SR-004 scope; acceptance two-step (nonsecret review, isolated worker, second confirmation bound to bytes) | SR-004; CONS-022 l.16 "A second explicit confirmation bound to those exact bytes …" |
| "Password or login recovery cannot recreate a forgotten Vault password" | INV-024 (no-forgotten-Vault-password recovery), cited by CONS-022 l.26 |
| SR-009 scope; account access never exposes plaintext authority | SR-009; architecture l.32 |
| Zero-confirmation construction allowed; six confirmations required for window, pre-X gate and reliance | INV-015 l.14 |
| Initial family: 6 activation + 6 refund at 10/20/50/100/150/200 | SEL-026 l.32; IFACE-007 l.21; SR-002 l.36 |
| Terminal only for actual winner after six confirmations | SR-002 l.31; INV-026 l.14 |
| 6/6/6 terminal variants; "stale SR-002 … twelve …; remains for a separate repair" | Variants: SR-002 l.31, STATE-009 l.53. Verdict and repair status: **B1** |
| Signing order; receipt not an input to its own signing | IFACE-005 l.55; SR-002 l.32, l.63 "receipt-before-signing" rejected; STATE-009 l.66 |
| Incomplete terminal signing stays pending, cannot undo principal or escrow | SR-002 l.63 "remains explicitly terminal-signing-pending; the system cannot reverse principal or escrow" |
| Different winner needs fresh construction/signing; parent change invalidates descendants; same-parent reorg keeps bytes, suspends qualification | SR-002 l.63; IFACE-005 l.200; INV-016 |
| Y or S fills same route-code-3 tx without changes | CONS-021 l.31; IFACE-020 l.59 |
| Lender default and long-stop concurrent; one spend wins; Base cannot revoke signatures | INV-008 l.14; CONS-027 l.14 |
| Cooperative signing needs fresh agreement and both keys; full operation deferred | IFACE-019; VA-001 l.56 "both participants rederive the same loan children and freshly sign"; SCOPE-005; Domain Excludes l.28 |
| Fixed-fee rationale | Domain l.40 (verbatim content); M3 |
| Fee conflict (earlier ticket/payload vs action contract and former decision) | Domain l.46; **B2** |
| P2A/CPFP separation; IFACE-016 owns arithmetic and process | IFACE-016; CONS-007 l.14; architecture l.39 |
| Relay timeout ambiguous; exact-attempt reconciliation | CONS-023 l.14 "an ambiguous relay result must reconcile independently before any identical-byte retry"; SEL-029 l.35 |
| Wrong binding, stale bytes, contested facts, missing archive, invalid route block | SR-002 l.63 |
| Rationale for scripts, envelope/KDF, derivation; "not permission to add recovery authority" | Domain l.41-44 (verbatim content); M2, M3 |
| SCOPE-001/002/003/006/005 exclusions with revisit conditions | Domain Excludes l.28 |

### 5.6 `domains/loan-terms-and-commitments/domain.md`: removed Domain Overview (pre l.11-33)

| Removed (pre) | Where it lives now (snap) |
| --- | --- |
| All artifacts must agree; domain owns shared meaning; "A matching identifier … does not authorize a spend or establish a chain outcome" | SR-001 l.22 Purpose; INV-001; SR-001 l.67 "INV-012: canonical meaning does not confer participant, application, Base, or Bitcoin execution authority" |
| Firm offer, reservation, `loan_id`, `LoanTermsV1`/`terms_hash` definitions | SR-001 l.26-27, l.31 |
| `ProtocolDeploymentV1` excludes URLs, credentials, secrets, mutable state; separation prevents divergent meanings | SR-001 l.28; SEL-010 l.42 |
| SR-001 consumed by every domain (Bitcoin binds graph; Base accepts pinned terms; observers reject wrong deployment; Vaults check binding) | SR-001 l.47-50 Inputs/Outputs; SR-006 l.58 "Manifest/chain/proxy/code/asset mismatch … blocks advancement"; IFACE-005 |
| Reservation before Vault derivation; both allocations; borrower destination and H(X); Core assembles candidate; each role approves; atomic second approval commits once; hashed-field edit invalidates; idempotent duplicates; rejections | SR-001 l.32-33, l.59 |
| "The detailed approved records …"; "The architecture's older standing-approval wording conflicts …" | Domain l.39 open question; **B6** (status and qualifiers), **B7** (added sub-question) |
| Distinct identities: protocol key, protocol EOA, external destination, payment account; no silent recipient; fresh approvals; historical immutability; snapshot is not authority | SR-001 l.38; SR-003 l.32; architecture l.29; INV-023 |
| Consumers reject unsupported encoding, changed fingerprint, mixed environment, and so on | SR-001 l.30, l.59 |
| Pre-activation amendment gives later version; cancellation ends reservation; reopening needs fresh identity | SR-001 l.33 "fresh loan identity after cancellation/reopening", l.59 |
| Canonical encoding rationale; byte contract in IFACE-001 | Domain l.38 (verbatim content) |
| Lender keeps capital-funding decision after commitment | SR-001 l.31; INV-011 |
| Other domains own authentication, decryption, construction, execution, observation, coordination | SR-001 l.37 Must Not Own |
| SCOPE-011 exclusions | SR-001 l.37; Domain l.45 |
| "An unresolved implementation question belongs in its existing ticket; a narrative or diagram cannot supply a missing approval." | **Lost (B8)** |

### 5.7 `domains/loan-terms-and-commitments/responsibilities/sr-001-…md`
l.17: the pointer changed (N3). Nothing else changed.

### 5.8 `domains/participant-access-and-loan-operations/domain.md`: removed Domain Overview (pre l.11-47)

| Removed (pre) | Where it lives now (snap) |
| --- | --- |
| Domain coordinates authorities; records cannot become keys, consent or chain truth; owns isolated demo | architecture l.37-38 (SR-011, SR-012) |
| Workspace, revision, outbox, handoff, payment intent definitions; accepted request vs submission vs finality | IFACE-013; STATE-016; IFACE-004; IFACE-022; architecture l.43 "A required state change and job record commit atomically" |
| SR-010: accounts, roles, sessions, recovery, MFA; provider adapter; operator access separate; authentication allows ciphertext retrieval only | SR-010; CONS-018 l.16, l.20; architecture l.32 |
| SR-011: commands, idempotency, outbox, projections; absent, forbidden, stale or unavailable; mock or health route is not proof | SR-011; IFACE-013; CONS-024 l.18, l.31; BU-006 l.183 "explicit negative proof that health cannot satisfy other interactions" |
| SR-012: one entrypoint; loopback Anvil, fake USDC, two regtest nodes, isolated sessions; descriptor references producer state; shutdown preserves; bounded reset | SR-012; CONS-026 l.14-16 "BU-011 never recursively deletes a sibling repository or producer-owned root", "Ordinary shutdown … preserves"; CONS-025 l.20; IFACE-021; STATE-020 |
| Cooperation sequence (bind, Vault identities, approvals, batch, handoff, sign, revalidate, archive, receipt, X, normal repayment) | FLOW-001/002/004 (now linked l.54); IFACE-005 l.55 |
| D1 commit with job; one-minute recovery scan | architecture l.43 |
| Exact identities survive ambiguous outcomes; lost response is not a new payment | SEL-029 l.35; `decision-overview.md` l.619 |
| Probes at 0/15/60 s, escalate at 180 s | SR-006 l.33 |
| Payment account independent of protocol EOA and keys; public only after recoverability gives same-address restore; Core owns intent, lease, fence, phases, gate; Vault owns pending bytes and signing; Signing before signer; ordered persistence; identical-byte rebroadcast; timeout after Signing is not non-submission; new device restores or reproduces, else blocked | IFACE-022 l.63; INV-027 l.14; CONS-028 l.14; SEL-043 l.27; VA-003 l.13; architecture l.33 |
| Participant transfer: configured USDC, validated recipient, no loan binding, cannot advance loan | SR-003 l.32; SR-006 l.33 |
| Exclusions: arbitrary calls, approvals, swaps, other assets, native-value sends, generic signing | Domain Excludes l.31 (same wording) |
| Local setup funding is not payment evidence or production sponsorship; the latter is excluded and ticketed | Domain Excludes l.32; IFACE-015 l.15; TICKET-0155 (N5) |
| Cloudflare single failure domain; outage; reconcile before resume; backups are not running fallback | architecture l.43-45; CONS-015 l.14; SEL-024 l.36 |
| Choices rationale (consumer continuity, local composition, Vault-owned intent) | Domain l.44-46 (verbatim content); CONS-024 l.31 supports continuity |
| SCOPE-013 distinct claims | architecture l.55-61 |
| "current payment capability is still an implementation target with no execution evidence" | VA-003 l.13 "Current payment-wallet delta: Planned and unverified. Existing injected-wallet execution evidence remains historical regression evidence only." |
| SCOPE-006 and SCOPE-005 deferrals | Domain Excludes l.29 |
| "A visual, fixture, healthy process, or local design check cannot satisfy those exclusions or activation gates" | SR-012 l.43 "A passing deterministic test, healthy process, seeded fixture, local contract event, or demo receipt must not imply testnet deployment, mainnet deployment, acti[vation]"; visuals footer "do not … prove implementation, deployment, or production activation" |
| WorkOS selected; replacement requirements (SCOPE-015) | SCOPE-015 Boundary and Reason; CONS-018 l.20 |
| Paymaster or relay deferred; current support is bounded protocol-EOA prefunding with participant signing and direct submission (SCOPE-014) | SCOPE-014 Boundary "V1 keeps bounded EOA prefunding and participant-controlled signing/submission" |
| "These are existing exclusions …" / "exact mechanics stay with their contracts …" | N4 |

### 5.9 `visuals/assets/explorer.json`, `visuals/assets/sources.json`
Hash-only changes; see section 2.

---

## 6. Suggested remediation (no edits made)

1. B1, B3, B4, B6: restore each domain's pre-change position text, "stale … remains for a separate repair", "retains … 2-of-3 Safe, seven-day timelock", "V1 has no on-chain pause" and "older … detailed approved records". Alternatively, take any change of stance through the owner as a separate decision. The new quotations can stay as evidence alongside.
2. B2: restore the "former decision" side and the "earlier" qualifier, or state explicitly that the former decision is no longer present in the package.
3. B5, B7: move the newly found disagreements (upgrade reach to existing loans; whether reservation binds canonical terms) into tickets or a separate reviewed change instead of adding them as part of the narrative move.
4. B8: put the "narrative or diagram cannot supply a missing approval" rule back into a technical record, for example the loan-terms domain or the architecture's guide pointer sentence.
5. M1: remove "also exported as PDFs" or ship the PDFs.
