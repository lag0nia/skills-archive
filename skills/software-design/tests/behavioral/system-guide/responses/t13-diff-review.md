# T13 diff review: technical records outside `guide/`

Roots used below:

- PRE = `/private/tmp/claude-501/-Users-alanguerrero-Documents-ai-prompts/b72a9647-f430-4577-b73d-46cf594be5b3/scratchpad/eval/pre/bitrise21/loan-system/design/technical-design`
- NEW = `/private/tmp/claude-501/-Users-alanguerrero-Documents-ai-prompts/b72a9647-f430-4577-b73d-46cf594be5b3/scratchpad/eval/snap-t13/bitrise21/loan-system/design/technical-design`

Nothing was modified. `diff -rq PRE NEW` shows `guide/` added and these 10 files changed:

| File | Change |
| --- | --- |
| `README.md` | +1 line (link to the guide) |
| `system-model/architecture.md` | `system_guide: adopted` front matter; `## System Overview` removed; guide pointer; two "Open question" notes added |
| `system-model/domains/base-observation-and-fallback-review/domain.md` | `## Domain Overview` removed (PRE l.11-43); 3 Cross-Domain bullets added |
| `system-model/domains/base-usdc-settlement-and-funding/domain.md` | Overview removed (PRE l.11-35); 2 Excludes bullets, new `## Choices And Rationale` (2 open questions), 2 Cross-Domain bullets |
| `system-model/domains/bitcoin-authorization-and-recovery/domain.md` | Overview removed (PRE l.11-37); 1 Excludes bullet, new `## Choices And Rationale` (2 conflicts, 2 open questions), 2 Cross-Domain bullets |
| `system-model/domains/loan-terms-and-commitments/domain.md` | Overview removed (PRE l.11-33); 1 Excludes bullet, new `## Choices And Rationale` (1 open question, 1 rationale), 2 Cross-Domain bullets |
| `.../loan-terms-and-commitments/responsibilities/sr-001-...md` | l.17: "the Domain Overview explains" changed to "the [Loan Terms And Commitments guide] explains" |
| `system-model/domains/participant-access-and-loan-operations/domain.md` | Overview removed (PRE l.11-45); 1 Excludes bullet, new `## Choices And Rationale` (3 rationale, 3 open questions), 2 Cross-Domain bullets |
| `visuals/assets/explorer.json` | `sources["system-model/architecture.md"]` hash refreshed |
| `visuals/assets/sources.json` | 7 source hashes and the `explorer.json` hash refreshed |

---

## 1. Mechanical checks (items 4 and 5)

### 1.1 Pinned delivery evidence (item 4): None

`build/workflow/handoffs/repo-002-core-coordination-scope.json` is the only `*-scope.json`. I recomputed SHA-256 for every package-relative path it pins: 24 paths, all OK. Its records are IFACE-003 to IFACE-022, BU-006, BU-007 and review-evidence files. None of the 10 changed files is pinned. The other handoffs (`build/workflow/handoffs/*.md`) are byte-identical between PRE and NEW.

### 1.2 Stored fingerprints (item 4): None

- Every refreshed hash in `visuals/assets/sources.json` and `explorer.json` equals the SHA-256 of the NEW file. I recomputed all 8.
- The old hashes appear nowhere else in the package. The new hashes appear only in those two files.
- `explorer.json` cites `architecture.md` in 9 places, and every citation is to "V1 Operating Topology And Availability Boundary", "Authority And Sources Of Truth" or "Target Outcome And Runtime Profiles". Those sections are unchanged. I validated all 171 `{file, heading, quote}` citations in `explorer.json` against NEW: 0 failures.
- The visuals carry 454 `{file, heading, text|quote}` citations (`visuals/*.html`, `assets/*.json`). Only 12 point into changed files, all into the same unchanged architecture sections, and none into a `Domain Overview` or `System Overview`. The 2 mismatches ("Participant vaults under SR-004..." with the backticks removed) fail the same way in PRE, so they are not caused by this change.
- `graphs.json` and all visual HTML outputs are byte-identical. No visual contains the claims the new open questions question ("second lender", "standing", "pause", "12-package", "beta").

So no refreshed hash hides a change of meaning in content the visuals use. The refresh only records that whole source files changed. The visuals never read the removed overviews or the added open questions.

### 1.3 Links, anchors and quotation consumers (item 5): None

- I resolved every Markdown link in, into, or from the changed files, plus every link from a technical record into `guide/`: 497 links in NEW (428 in PRE), 0 missing files, 0 missing anchors. The links include each record's new guide link (`../../../guide/domains/<domain>.md`, `../guide/architecture.md`, `./guide/architecture.md`) and SR-001's `../../../../guide/domains/loan-terms-and-commitments.md`.
- Across all of `bitrise21/` outside `guide/`, nothing links to `#system-overview` or `#domain-overview` or names those headings. The only anchored links to `architecture.md` target `#decision-attribution` (`build/workflow/decision-overview.md` l.1093 and l.1527), which still exists.
- Outside consumers link only to the files, without anchors: `technical-brief.md` l.596, the `delivery-workpacks/*/WORKPACK.md` files, and the history handoff. All still resolve.
- A 7-word shingle search for removed text found no verbatim reuse in handoffs, tickets or visuals.

---

## 2. Accounting for removed statements (item 1)

"Home" means a non-guide technical record in NEW that carries the same meaning. Rows marked ✓ are accounted for. Rows marked ✗ or ◐ link to findings in §4.

### 2.1 `architecture.md` `## System Overview` (PRE l.16-22)

| Removed statement (PRE) | Home in NEW |
| --- | --- |
| "The product coordinates one borrower, one selected lender, Bitcoin collateral, and USDC settlement on Base." | ✓ `architecture.md` l.21 "a Base USDC loan between one borrower and one selected lender" |
| "Its five domains separate agreement meaning, participant Bitcoin authority, Base value movement, verified observation and conditional fallback, and durable application coordination." | ✓ `architecture.md` System Domains table l.65-71 |
| "login is not a Vault unlock" | ✓ `architecture.md` l.32 "Product authentication permits ciphertext access only; it is not decryption, signing..." |
| "an accepted command is not a chain fact" | ✓ `architecture.md` l.37 "no independent Bitcoin or Base truth"; l.82 STATE-016 "rather than reporting one generic completion" |
| "a Base refund is not a confirmed Bitcoin recovery" | ✓ FLOW-005 Outcomes "Bitcoin remains a distinct unspent output until another authorized route confirms" |
| Per-domain roles in paragraph 2 | ✓ `architecture.md` l.29-37 and the domains table |
| "lender silence can lead to a Base refund and, only for an activated precommitted fallback loan, conditional `S` recovery" | ✓ FLOW-005 l.33 "`FLOW-006` is available only for a loan created after the ECVS production-activation gate, with committed `H(S)`" |
| "Either Bitcoin path becomes final only when the expected spend confirms." | ✓ FLOW-006 step 4 "Publication or submission alone is not final recovery"; FLOW-004 |
| "Each domain below is a complete reading destination; responsibility and contract links provide precise detail." | ◐ Changed role. Domain records now say "This record is its exact technical reference" and readers are sent to the guides. See M2. |
| "Runtime topology, construction dependencies, and state/sequence views are separate derived perspectives in the visual index. They do not replace this written architecture." | ◐ Only implied: `README.md` l.7 "The records below remain authoritative", with visuals listed under "Supporting Navigation". See M1. |
| "Existing approval-wording and fee/count discrepancies identified by the migration remain unresolved source issues; this documentation revision does not choose new behavior." | ◐ The approval part is now an "Open question" (l.23 and l.78) with a changed characterization: see **B1**. The fee and count parts moved to the bitcoin domain record: see **B2** and **B3**. "Does not choose new behavior": see M3. |

### 2.2 Base Observation And Fallback Review `domain.md` (PRE l.11-43)

| Removed statement | Home in NEW |
| --- | --- |
| Base settles USDC, Bitcoin controls collateral, and a wallet transfer, screen or silence "cannot bridge those authorities" | ✓ `architecture.md` l.30-31; SR-006 Must Not Own "Observation must not imply action, ... Bitcoin activation/recovery" |
| Two responsibilities; "Neither responsibility decides who deserves the collateral or signs a Bitcoin transaction." | ✓ Domain Responsibility Composition; SR-007 Must Not Own "discretionary evidence assessment", "Bitcoin keys/signatures"; SR-006 Must Not Own "signing" |
| Named events checked by chain, deployment, loan, transaction and block; observed vs safe vs L1 finality; "safe" is progress only | ✓ SR-006 Owns l.27-28; SEL-013 "`safe` — L1-batched; optional UI progress only" |
| "accepts additional waiting ... one consistent rule ...; it is not a promise of an exact waiting time" | ✓ SEL-013 "delays each consequential handoff by roughly 20 minutes, but keeps one simple rule" |
| Ack before cursor advance; a lost ack resends the same event; stable identity prevents a duplicate | ✓ SR-006 "Durable finalized cursor advancement only after API acknowledgement" and "resend the same observation identity"; SEL-015 "must not create a duplicate" |
| Event history chosen over a mutable snapshot or watcher status | ✓ SEL-015 "A watcher-owned mutable status or stored `getLoan` snapshots would hide the sequence..." |
| Alchemy primary and QuickNode fallback; one healthy provider suffices; dual outage or disagreement keeps projections and blocks actions; reorg handling; operator recheck limits | ✓ SR-006 Owns l.29 and Failure l.58 |
| Bitcoin evidence needs fresh agreement; one incident; post-acceptance failure is critical; Vault payment transfers only update their own record | ✓ SR-006 l.30, l.32-33, l.58 ("treats post-`X` failure as immediately critical") |
| D, Y claim, C = D + 172,800, recipient freeze, permissionless fixed-effect refund, optional switch before C, refund doesn't need ECVS, Bitcoin stays unspent | ✓ FLOW-005 steps 1-4 and Outcomes; SR-007 overview |
| ECVS: one contracted independent service, unique random S, returns only H(S) before construction, commitment in the script, no early release to company, borrower or lender | ✓ SR-007 overview and Owns ("Company, borrower, and lender do not receive `S` before publication or control an early-release override") |
| ECVS checks independently; same borrower-signed transaction; no fresh signature; publication, broadcast and confirmation are separate | ✓ SR-007; FLOW-006 steps 1-4 |
| Gated by counsel and implementation evidence; no H(S) commitment or advertising before the gate; a Y-only escrow can't acquire it; early, withheld, lost or compromised risks | ✓ SR-007 l.(overview) "before any new loan commits H(S)", "An existing Y-only escrow cannot be upgraded in place"; SR-007 Owns third bullet |
| Missing Y, elapsed time, assertion, raw transfer or `Repaid` cannot trigger; on failure the refund stays complete; D+3 days lender route; D+10 days long-stop; one confirmed spend wins; cooperation; residual risk | ✓ SR-007 "When the path fails"; FLOW-006 Failure; INV-008 (`T = D + 259,200`, `B = D + 864,000`); INV-025 |
| SCOPE-001 and SCOPE-002 "remain outside the selected operating boundary"; the company gets no collateral key, sale authority or payout power | ◐ New l.42 says "outside this domain". The system-wide exclusion still lives in SCOPE-001 and SCOPE-002 ("The canonical design has no organization collateral-script key or organization-controlled BTC sale/distribution"). See M8. |

### 2.3 Base USDC Settlement And Funding `domain.md` (PRE l.11-35)

| Removed statement | Home in NEW |
| --- | --- |
| A Base payout can expose a secret but cannot sign, broadcast or confirm | ✓ `architecture.md` l.80 "Base facts and public secrets never sign, redirect, broadcast, or confirm Bitcoin by themselves" |
| Funding and repayment vault definitions; transfers stay provisional until the named action finalizes | ✓ SR-003 Owns l.26-28; `architecture.md` l.31 |
| Payer-neutral: a sender gains no role, recipient or refund right | ✓ SR-003 l.28 "unrelated payers gain no role or destination/refund right" and l.32 |
| `acceptX` atomically pays and deploys the repayment vault; failures revert with no success event | ✓ SR-003 l.28; SR-003 Failure "reverts with a named error, no success event, and no unintended movement" |
| Permissionless callers pay gas but control nothing | ✓ `architecture.md` l.39; SR-003 Failure "gains no exclusive right or discretion" |
| SR-005: explicit lender action, one or more transfers, Vault payment account, partial deposits, no pooling or substitution | ✓ SR-005 Owns l.28; `architecture.md` l.34 |
| Funding window, exact-principal finalization, funded-unaccepted with bounded lifetime, `X` via Vault, activation pending, Bitcoin evidence for active collateral, expiry/refund if unaccepted | ✓ STATE-011 l.37 "24-hour acceptance lifetime"; FLOW-002; FLOW-003; INV-002 |
| Repayment: balance is not repayment; exact debt by D; claim strictly before C; one switch; freeze at C | ✓ SR-003 l.29-31; STATE-012; STATE-013 |
| After C: claim lost, refund once, only positive trigger, Base refund ≠ Bitcoin recovery, T = D + 259,200 independent | ✓ SR-003 l.30 "Lender default package maturity remains a separate Bitcoin fact after `T = D + 259,200`"; INV-007; FLOW-005 |
| Wrong inputs block; excess or late USDC follow fixed paths; no generic rescue; retries reload; operator can't edit meaning | ✓ SR-003 Owns (sweep calls), l.54 "lack ... generic-rescue surfaces", Failure section (CONS-019 operator) |
| Ownerless vaults; Transparent Proxy, 2-of-3 Safe, 7-day timelock, compatibility, opener replacement; "V1 has no on-chain pause; direct valid exits remain available during application or opener shutdown" | ✓ SR-003 l.33 "... no on-chain pause, and valid direct exits during application/opener shutdown"; SR-003 l.54. (This domain record now also adds an open question about this point: M10.) |
| Vault payment account doesn't change payer-neutral contracts or historical recipients | ✓ SR-003 l.32; `architecture.md` l.83 |
| SCOPE-005; liquidation, custody and automatic allocation excluded | ✓ New Excludes l.28-29; SCOPE-005; SCOPE-011; SCOPE-012 |

### 2.4 Bitcoin Authorization And Recovery `domain.md` (PRE l.11-37)

| Removed statement | Home in NEW |
| --- | --- |
| Definitions of prefund, escrow and PSBT; a signed package is prior authorization, not permission to choose a destination; consensus is the authority | ✓ SR-002 Owns l.26; `architecture.md` l.30; SR-002 Must Not Own "arbitrary destination choice", "general spend authority" |
| Secret roles X, Y and S; long-stop needs no secret; no organization collateral key | ✓ SR-002 l.31; INV-004; INV-008; `architecture.md` l.39 |
| SR-002 constructs and validates and consumes committed terms and acknowledged allocations; it "cannot allocate a key or invent a missing binding" | ✓ SR-002 l.27 "cannot request allocation, choose an index ..." and l.32 "missing binding ... cannot be inferred downstream" |
| SR-004: local Vault, two-step acceptance with a second confirmation bound to the bytes; password recovery can't recreate a Vault password | ✓ FLOW-002 step 4 "a second confirmation bound to those bytes authorizes local signing/submission"; SR-004; SCOPE-006 |
| SR-009 lender equivalents; account access exposes no plaintext authority | ✓ SR-009 Owns; FLOW-004 step 3; `architecture.md` l.32 |
| Zero-conf construction; 6 confirmations required; initial 6+6 candidate tiers; terminal only for the winner; 6/6/6 terminal variants | ✓ SR-002 l.29-31; INV-015 |
| "A stale SR-002 archive sentence still says twelve terminal packages; this documented source conflict remains for a separate repair." | ◐ Moved to the new l.40 "Unresolved source conflict", but "stale" and "for a separate repair" were dropped: see **B2** |
| Signing order; the receipt is never input to its own signing | ✓ SR-002 l.32 "A receipt can never be an input to the signing action that creates it" |
| Terminal-signing pending can't undo; a different winner needs fresh signing; a changed parent invalidates recursively; a same-parent reorg preserves bytes and pauses | ✓ SR-002 l.29 and l.63; FLOW-002 l.40-41; INV-016 |
| Y or S fills the same route-code-3 transaction; default and long-stop race; Base can't revoke; cooperative signing needs fresh agreement and is deferred | ✓ SR-002 l.31; CONS-021; INV-008; INV-009; IFACE-019; SCOPE-005 |
| "Fixed fees are necessary because the parent is signed before use. Provider-neutral integer units, ... prevent underestimation or unsafe reselection." | ◐ The rules are in IFACE-007 l.19-25 and INV-010 ("create an unsigned fee path"). The words "underestimation or unsafe reselection" survive only implicitly ("conservatively rounded up"). See M7. |
| "The existing fee sources disagree ... an earlier ticket/payload selects the largest tier with an alert, while the action contract and former decision say fail closed. This migration preserves both statements ..." | ◐ Moved to the new l.41, but "former decision" was dropped from the fail-closed side and TICKET-0089 was added: see **B3** |
| P2A and CPFP separation; relay timeout ambiguity; wrong binding blocks | ✓ IFACE-016; SR-002 l.33-34, l.39 and l.63 ("An ambiguous relay timeout enters reconciliation and cannot create, alter, or immediately submit another transaction") |
| "The recorded rationale for exact scripts and witnesses is that a mismatch can strand collateral or authorize the wrong party." | ◐ INV-001 "A mismatched artifact could authorize the wrong participant, loan, recipient, secret, contract, transaction, or terminal route". **"strand collateral" has no home.** See **B5**. |
| "Fixed envelope/KDF interoperability makes encrypted backups portable" | ✓ SEL-027 "This keeps every V1 backup interoperable" |
| "hardened per-loan derivation avoids index reuse, cross-loan correlation, and expanded compromise" | ◐ INV-022 "no key is reused across loans" and "One child leak could expand across loans/chains"; SEC-006. **"cross-loan correlation" has no home.** See **B5**. |
| "Those are reasons for the existing contracts, not permission to add recovery authority." | ◐ See M6 |
| SCOPE-001/002/003/005/006 "remain excluded ... each with its own revisit condition" | ◐ New l.28 says "remain outside this domain's current authority". The scope records still hold the system-wide exclusion. See M8. |

### 2.5 Loan Terms And Commitments `domain.md` (PRE l.11-33)

| Removed statement | Home in NEW |
| --- | --- |
| Artifacts must agree; "A matching identifier proves which agreement ...; it does not authorize a spend or establish a chain outcome." | ✓ `architecture.md` l.25 "Neither commitment is a wallet, signing key, source of funds, chain-state fact, or lifecycle action"; INV-001 |
| Firm offer; reservation creates a stable random `loan_id`; LoanTermsV1 and terms_hash; ProtocolDeploymentV1 excludes "URLs, credentials, secrets, and mutable application state" | ✓ SR-001 l.31; IFACE-001 field 1 "Nonzero cryptographically random value"; SR-001 l.29 "excluding URLs, credentials, application configuration, dynamic attempts, and secrets" |
| "Separating immutable loan facts from environment facts prevents different consumers from signing or processing different meanings under the same label." | ✓ Merged into the new Choices bullet l.40 "let different consumers sign or process different meanings under the same label". Its new attribution is covered under **B7**. |
| SR-001 is the single responsibility; each domain consumes it | ✓ Responsibility Composition; SR-001 Purpose; INV-001 |
| Reservation before derivation; allocations; H(X); candidate; each role approves; the atomic second approval commits; a hashed-field edit invalidates; idempotent duplicates; stale or wrong approvals rejected | ✓ SR-001 l.32 and l.57 ("A hashed-field change creates a new candidate version/hash and invalidates all prior candidate approvals"); STATE-002 l.32-38 |
| "The architecture's older standing-approval wording conflicts with these detailed records; this migration records the discrepancy without deciding new behavior." | ◐ The new l.39 "Open question ... Whether these statements describe different stages or contradict each other is undecided." See **B1**. |
| Distinct identities; payment account isn't a recipient; fresh-loan selection; snapshot or workspace is not a second authority | ✓ INV-023; `architecture.md` l.25 and l.29; SR-003 l.32 |
| Consumers reject unsupported encodings and similar; amendment gives a later version; cancellation ends the reservation; reopening needs a fresh identity | ✓ SR-001 l.33 and l.57 ("Pre-activation amendment creates a later version and fresh dependent artifacts; cancellation is terminal for that reservation") |
| Canonical-encoding rationale | ✓ The new l.40 keeps the same reason. The attribution added there is **B7**. |
| "The exact encoding and accepted address spellings remain in IFACE-001" | ✓ IFACE-001 is linked in Cross-Domain Contracts l.43 |
| The lender keeps the funding decision; other concerns stay with their domains | ✓ `architecture.md` l.21 and l.34; INV-011 |
| "Public or multi-lender matching, pooled capital, product custody, automatic deployment of lender capital, and liquidation remain excluded under SCOPE-011." | ✗ Attribution changed: liquidation is now under SCOPE-012, and surplus and shortfall were added. See **B4**. |
| "An unresolved implementation question belongs in its existing ticket; a narrative or diagram cannot supply a missing approval." | ◐ See M4 |

### 2.6 Participant Access And Loan Operations `domain.md` (PRE l.11-45)

| Removed statement | Home in NEW |
| --- | --- |
| Domain role; application records cannot become keys, consent or chain truth | ✓ `architecture.md` l.37; INV-012; INV-013 |
| Definitions of workspace, revision, outbox, handoff and payment intent; an accepted request is not submission, observation, finality or confirmation | ✓ IFACE-013; STATE-016; `architecture.md` l.82; IFACE-022 l.19; SEL-043 |
| SR-010: provider adapter; application-owned accounts; operator access separate; authentication can't decrypt | ✓ SR-010; SCOPE-015 "V1 retains WorkOS behind provider adapters"; CONS-019; `architecture.md` l.32 |
| SR-011: acquire and refresh, distinguish absent/forbidden/stale/unavailable, ack, recover; a "mock, health route, or producer-local method does not prove that public consumer path" | ✓ SR-011 l.78 "An internal `WorkspaceService.get`, persisted projection, command handler, mock, health route, ... or producer-local test does not satisfy any"; IFACE-013; TICKET-0121 |
| SR-012: one entrypoint; status, shutdown and reset; local profile resources; descriptor never recursively deletes; shutdown preserves; reset bounded | ✓ SR-012 l.29-32 and l.71; CONS-026; IFACE-021; STATE-020 |
| Cooperation sequence (bind, Vault, approvals, batch, handoff, revalidate, archive, receipt, repayment) | ✓ FLOW-001, FLOW-002 and FLOW-004 (newly linked at l.54); SR-002 l.32 |
| D1 atomic job; wake is an optimization; one-minute scan; identities survive; known delay vs reconciliation; probes at 0/15/60 s and escalation at 180 s | ✓ `architecture.md` l.43; SR-006 l.33; SR-002 l.63; SEL-043 |
| Payment account independence; public only after recoverability; Core intent and fence; Vault pending bytes; Signing before signer; ordered persistence; identical repeat; timeout after Signing ≠ non-submission; new device restore or block | ✓ SEL-043 Selected direction; INV-027; IFACE-022; STATE-021; SR-006 l.33 ("process-death report is not valid non-submission evidence") |
| Participant transfer scope; no loan binding; exclusions; local setup provisioning is neither evidence nor sponsorship; sponsorship is an excluded ticket | ✓ TICKET-0156; IFACE-022; SR-012 l.38; TICKET-0154; new Excludes l.29 (TICKET-0155) |
| Cloudflare shared failure domain; outage behavior; off-provider backups are not a fallback or RTO/RPO | ✓ `architecture.md` l.43-45 |
| Recorded choices (consumer continuity; local composition; Vault-owned payment) | ◐ New Choices l.41-43. The reasons were rewritten from ticket text: see M15 and M16. "The exact mechanics stay with their contracts; prior implementation repair history stays with tickets and handoffs.": see M5. |
| SCOPE-013 distinct claims; "The current payment capability is still an implementation target with no execution evidence established by this migration." | ✓ `architecture.md` profile table; VA-003 l.13 "Current payment-wallet delta: Planned and unverified" |
| SCOPE-006 and SCOPE-005 deferred; "A visual, fixture, healthy process, or local design check cannot satisfy those exclusions or activation gates." | ✓ New Excludes l.29; SR-012 l.43 "A passing deterministic test, healthy process, seeded fixture, ... must not imply testnet deployment ..." |
| WorkOS replacement deferred with its preservation and proof list (SCOPE-015); reveal relayer and paymaster deferred, with the current EOA prefunding and direct submission (SCOPE-014) | ✓ SCOPE-015 Boundary and Reason; SCOPE-014 Boundary "V1 keeps bounded EOA prefunding and participant-controlled signing/submission"; new Excludes l.29 |

### 2.7 `sr-001-...md` l.17

PRE: "...; the Domain Overview explains the full cooperation scenario."
NEW: "...; the [Loan Terms And Commitments guide](../../../../guide/domains/loan-terms-and-commitments.md) explains the full cooperation scenario."

The binding scenario remains in SR-001 l.31-33 and l.57, STATE-001, STATE-002 and FLOW-001. See M17.

---

## 3. Disagreements and open questions the change touched (item 3)

I checked every side's own record. **No side was rewritten.** STATE-001, STATE-002, SR-001 (except l.17), IFACE-001, IFACE-003, IFACE-007, SEL-012, SCOPE-011, SR-002, SR-003, SR-010, SR-011, SR-012, SEL-009, INV-018, INV-019, INV-020, STATE-019, CONS-008, SEC-017, IFACE-008, FLOW-009, FLOW-010, SEC-025, IFACE-019, CONS-026, SEL-037, SEL-042, SEL-043 and VA-003 are all byte-identical between PRE and NEW. `architecture.md` l.21 and l.77 keep their PRE wording exactly ("Publication is the lender's standing acceptance ...; reservation creates the canonical loan without a second lender approval"; "... standing lender acceptance, atomic borrower reservation, and no second lender approval ...").

I checked every quotation inside the new conflict and open-question notes against the cited record. All match. The one exception is IFACE-007, where the note drops the link markup inside "alert for separate manual [IFACE-016](...) approval"; that is formatting only. The problems are in characterization and attribution:

| Point | Sides intact? | Finding |
| --- | --- | --- |
| Standing lender acceptance vs final-terms approvals (arch l.23 and l.78; loan-terms l.39; participant l.44) | Yes | **B1**: recharacterized |
| Terminal package count, 12 vs 18 (bitcoin l.40) | Yes | **B2**: "stale" and "separate repair" status dropped |
| No-eligible fee tier (bitcoin l.41) | Yes | **B3**: "former decision" dropped and TICKET-0089 added |
| New: on-chain pause (settlement l.40) | Yes | M10 |
| New: single beta upgrade key (settlement l.41) | Yes | M11 |
| New: relay boundary for long-stop and cooperative (bitcoin l.42) | Yes | M12 |
| New: fee escalation after mempool acceptance (bitcoin l.43) | Yes | M13 |
| New: extension-wallet acceptance proof (participant l.45) | Yes | **B6**: attribution to SR-012 is unsupported |
| New: expired uncommitted reservation infraction (participant l.46) | Yes | M14 |

---

## 4. Findings

### Blockers

**B1. The standing-approval conflict changed from a recorded conflict to an undecided question.** Files: `architecture.md` l.23 and l.78; `loan-terms-and-commitments/domain.md` l.39; `participant-access-and-loan-operations/domain.md` l.44.
- PRE `loan-terms.../domain.md` l.21: "The architecture's **older** standing-approval wording **conflicts** with these detailed records; this migration records the discrepancy without deciding new behavior."
- PRE `architecture.md` l.22: "Existing approval-wording ... **discrepancies** identified by the migration remain unresolved source issues".
- NEW (all three records): "Whether these statements describe different stages or contradict each other is undecided."
- The status is weaker: what was recorded as a conflict is now possibly no conflict, and the "older" label on the architecture side is gone. Neither the PRE judgment nor the "older" attribution survives in any technical record. The sides themselves are intact, and the added side lists (SEL-012, SCOPE-011, IFACE-001, FLOW-001, SR-010, SR-011) are quoted accurately.

**B2. The package-count conflict lost its "stale" status and its pending-repair disposition.** File: `bitcoin-authorization-and-recovery/domain.md` l.40.
- PRE l.25: "A **stale** SR-002 archive sentence still says twelve terminal packages; this documented source conflict **remains for a separate repair**."
- NEW l.40: "Unresolved source conflict: the terminal-phase package count. [SR-002] ... says 'the 12-package signed terminal phase ...'" followed by the 18-package records. The note no longer says which side is stale or that a repair is pending.
- No other technical record says that SR-002's 12-package sentence is the stale side. Both sides are intact: SR-002 l.36 and the 18-package records.

**B3. The fee no-eligible-tier conflict lost a source on the fail-closed side and gained one on the other.** File: `bitcoin-authorization-and-recovery/domain.md` l.41.
- PRE l.33: "an **earlier** ticket/payload selects the largest tier with an alert, while the action contract **and former decision** say fail closed."
- NEW l.41 names only IFACE-007 ACT-002 on the fail-closed side. It adds TICKET-0089 to the 200-tier side and drops the "earlier" qualifier.
- I found no "former decision" record anywhere in `bitrise21/` that says fail-closed for no eligible tier. `decision-overview.md` l.69 supports the alert side. Reviewer action: identify the "former decision" or record its removal explicitly.

**B4. The loan-terms liquidation exclusion was re-attributed and its scope widened.** File: `loan-terms-and-commitments/domain.md` l.29.
- PRE l.33: "Public or multi-lender matching, pooled capital, product custody, automatic deployment of lender capital, and liquidation remain excluded **under [SCOPE-011]**."
- NEW l.29: "... [SCOPE-011] for public or multi-lender matching, pooled capital, product custody, and automatic capital deployment, and [SCOPE-012] for BTC liquidation, **automated surplus return, and shortfall enforcement**."
- This corrects a real misattribution (SCOPE-011 never mentions liquidation), but it still changes an attribution and adds two exclusions to this domain record. It needs explicit acceptance.

**B5. Two parts of the Bitcoin rationale were lost.** File: PRE `bitcoin-authorization-and-recovery/domain.md` l.37.
- "a mismatch can **strand collateral** or authorize the wrong party": INV-001 covers the "authorize the wrong ..." half. No technical record gives stranding collateral as a reason for exact scripts and witnesses. INV-022's "strand funds" refers to restore and derivation, not script mismatch.
- "hardened per-loan derivation avoids index reuse, **cross-loan correlation**, and expanded compromise": INV-022 and SEC-006 cover reuse and expanded compromise. No technical record mentions cross-loan correlation.

**B6. The new participant open question attributes an external-payer requirement to SR-012, which SR-012 does not contain.** File: `participant-access-and-loan-operations/domain.md` l.45.
- NEW: "[SEL-043] rejects keeping the injected external wallet while requiring external payer compatibility proof, **which [SR-012] requires the browser journey to exercise**."
- SR-012 contains no "external payer" or compatibility requirement for the browser journey. Its l.38 requires "the real Vault-owned exact-transfer handoff ..." and its only uses of "external" are an INV-013 link title. The CONS-026, SEL-037, SEL-042, VA-003, TICKET-0153 and SEL-043 quotes are accurate.

**B7. The canonical-encoding rationale gained a ticket attribution that the tickets only partly support.** File: `loan-terms-and-commitments/domain.md` l.40.
- PRE l.31: "The recorded rationale for canonical encoding is interoperability and verifiability: ... or make a package impossible to reproduce." No source was named.
- NEW l.40 adds "Attribution: [TICKET-0001, TICKET-0004] and [TICKET-0075]."
- TICKET-0004's context supports binding Base to the same terms as Bitcoin package construction, and TICKET-0075 supports preventing incompatible fixed values. None of the three tickets states "interoperability and verifiability" or package reproducibility.

### Minor

- **M1** `architecture.md`: "derived perspectives ... do not replace this written architecture" was dropped. It is now covered only implicitly by README l.7 "The records below remain authoritative".
- **M2** `architecture.md`: "Each domain below is a complete reading destination" was dropped. Domain records now call themselves the "exact technical reference" and send readers to the guides. This is a navigation change, not a design change.
- **M3** `architecture.md`: "this documentation revision does not choose new behavior" was dropped. It is a meta statement about the earlier migration.
- **M4** loan-terms: "An unresolved implementation question belongs in its existing ticket; a narrative or diagram cannot supply a missing approval." was dropped. README l.17 ("Tickets preserve questions, answers, approvals") covers it in part.
- **M5** participant: "The exact mechanics stay with their contracts; prior implementation repair history stays with tickets and handoffs." was dropped. This is navigation only.
- **M6** bitcoin: "Those are reasons for the existing contracts, not permission to add recovery authority." was dropped. SCOPE-006 and the Excludes cover the substance.
- **M7** bitcoin: "prevent underestimation or unsafe reselection" survives only implicitly, through IFACE-007's "conservatively rounded up" and its BIP-125 higher-tier-only rule, and INV-010.
- **M8** observation l.42 and bitcoin l.28: the exclusion wording narrowed from "outside the selected operating boundary" and "remain excluded" to "outside this domain" and "outside this domain's current authority". The SCOPE records still state the system-wide exclusions.
- **M9** settlement Excludes l.28: adds public or multi-lender matching (SCOPE-011) and surplus return and shortfall enforcement (SCOPE-012) to this domain's exclusions. These restate system-wide scope records.
- **M10 to M14** New open questions. Each is accurately quoted and both sides are intact, but none existed in PRE. They add an "undecided" status beyond the declared move-only scope, and in M10 and M11 the PRE domain record had stated the point as settled. The owners should confirm them.
  - M10: pause, settlement l.40. PRE l.35 said "V1 has no on-chain pause"; that statement still lives in SR-003 l.33.
  - M11: beta upgrade key, settlement l.41. SEL-009 itself frames it as a sequence: "moves from the short beta key to a delayed 2-of-3 multisig".
  - M12: relay boundary, bitcoin l.42.
  - M13: activation fee escalation, bitcoin l.43.
  - M14: reservation-expiry infraction, participant l.46.
- **M15** participant l.42: the local-demo rationale was rewritten. PRE: "independently implemented units did not by themselves supply a persistent runnable demonstration or safe profile separation". NEW quotes the TICKET-0125 and TICKET-0126 contexts ("root scripts had no owner ...", "deleted their disposable state on shutdown", "treated as broad completion"). The meaning is equivalent and the tickets support it.
- **M16** participant l.41: the consumer-continuity rationale dropped "passing harness" and now draws on TICKET-0122 and TICKET-0123, which support it.
- **M17** SR-001 l.17: an authoritative record now defers "the full cooperation scenario" to a non-authoritative guide. The binding content remains in SR-001 l.31-33 and l.57.
- **M18** `build/workflow/decision-overview.md` canonical targets (for example l.123, l.143, l.267) and the `write_targets` of TICKET-0036, TICKET-0037, TICKET-0052, TICKET-0066, TICKET-0072 and TICKET-0105 still point to domain records that now hold only links for those decisions. The links resolve and the decisions live in the SR, FLOW and STATE records.

### None (checked, no issue)

- **N1** `README.md` l.7: added guide pointer only.
- **N2** `architecture.md` front matter `system_guide: adopted`: no parser in the package reads it. `generate-visuals.mjs` reads only `design_format`.
- **N3** Pinned scope evidence: 24/24 hashes match and no pinned record changed.
- **N4** `explorer.json` and `sources.json` hash refreshes are correct and cover only unchanged cited content.
- **N5** Links, anchors and visual citations all resolve (§1.3).
- **N6** All other removed statements are accounted for with the same meaning (✓ rows in §2).

## Counts

| Rating | Count |
| --- | --- |
| Blocker | 7 (B1-B7) |
| Minor | 18 (M1-M18) |
| None | 6 (N1-N6) |
