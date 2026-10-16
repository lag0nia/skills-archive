# T9 diff review: guide extraction from loan-system technical design

Compared copies:

- PRE: `eval/pre/bitrise21/loan-system/design/technical-design`
- POST: `eval/snap-t9/bitrise21/loan-system/design/technical-design`

`diff -rq` shows 10 changed files outside `guide/`:

1. `README.md`
2. `system-model/architecture.md`
3. `system-model/domains/base-observation-and-fallback-review/domain.md`
4. `system-model/domains/base-usdc-settlement-and-funding/domain.md`
5. `system-model/domains/bitcoin-authorization-and-recovery/domain.md`
6. `system-model/domains/loan-terms-and-commitments/domain.md`
7. `system-model/domains/loan-terms-and-commitments/responsibilities/sr-001-loan-terms-offer-reservation-and-parameter-binding.md`
8. `system-model/domains/participant-access-and-loan-operations/domain.md`
9. `visuals/assets/explorer.json`
10. `visuals/assets/sources.json`

No file was deleted. The only new path is `guide/`.

## Counts

| Rating | Count |
| --- | --- |
| Blocker | 6 |
| Minor | 9 |
| None (checked and clean) | 7 areas |

---

## Blockers

### B1: The settlement domain's upgrade-governance statement gained a condition, and the record changed sides in an unflagged disagreement

POST `system-model/domains/base-usdc-settlement-and-funding/domain.md:40` (Choices And Rationale).

- PRE (`domain.md:35`): "The recorded construction choices use immutable ownerless vaults, while the main contract retains its explicit Transparent Proxy administration, 2-of-3 Safe, seven-day timelock, compatibility checks, and opener-replacement boundary. V1 has no on-chain pause; direct valid exits remain available during application or opener shutdown."
- POST: "Transparent Proxy administration with one ownership path, a dedicated single upgrade key for local/test and the intentionally short public mainnet beta followed by transfer of that sole ownership to a 2-of-3 Safe-controlled seven-day timelock, ... and an operational frontend/API pause that leaves direct valid exits available".

The added condition is a single-key ownership phase during the public mainnet beta. It comes from SEL-009:29 and TICKET-0048, both of which are approved. The canonical system-model records still give the other version, with no beta-key phase:

- SR-003:33: "Transparent Proxy administration retained under a 2-of-3 Safe-controlled seven-day timelock".
- INV-020:14: "V1 retains the Transparent ProxyAdmin controlled by a 2-of-3 Safe through a seven-day timelock."
- STATE-019 ("Current V1 posture ... Transparent ProxyAdmin remains Safe/timelock controlled").

In PRE, the domain record agreed with SR-003, INV-020 and STATE-019. In POST it was rewritten to agree with SEL-009. No record notes that SEL-009/TICKET-0048 and SR-003/INV-020/STATE-019 disagree. Either the domain record should keep its PRE wording, or the disagreement should be recorded as an unresolved source conflict that names both sides.

Related, rated Minor (M6): POST drops "V1 has no on-chain pause" from the domain record.

### B2: Lost rationale: hardened per-loan derivation avoids "cross-loan correlation"

- PRE `bitcoin-authorization-and-recovery/domain.md:37`: "hardened per-loan derivation avoids index reuse, cross-loan correlation, and expanded compromise."
- Where the parts now live:
  - "index reuse" is covered by INV-022:14 ("no key is reused across loans or chains") and SEL-004:27 ("Never reuse an index").
  - "expanded compromise" is covered by INV-022:22 ("One child leak could expand across loans/chains").
  - "cross-loan correlation" appears in no technical record in POST. A grep for `correlation` finds only unrelated SEC-015 and SEC-007 uses. It is not in the guide either.
- The POST Choices item that replaces it (`domain.md:42`) gives a different rationale for a different decision: sequential versus hash-derived index, "avoids hash-to-index collisions and makes allocation deterministic" (SEL-004:15).

Result: the privacy/correlation reason is lost.

### B3: Fee-tier conflict: one source on the fail-closed side was dropped

- PRE `bitcoin-authorization-and-recovery/domain.md:33`: "an earlier ticket/payload selects the largest tier with an alert, while the action contract and former decision say fail closed. This migration preserves both statements and identifies the conflict".
- POST `domain.md:45`: "the IFACE-007 payload rule and TICKET-0018 ... select 200 sat/vB, record CPFP eligibility, and alert, while the IFACE-007 tier-selection action specifies a fail-closed no-eligible-tier result that selects nothing."

Both sides keep their original wording in their own records, and neither record was rewritten. IFACE-007 is byte-identical and pinned:

- IFACE-007:21: "If no tier satisfies the inequality, select 200 sat/vB, record CPFP eligibility, and alert".
- IFACE-007:57: "or a fail-closed no-eligible-tier result".
- IFACE-007:61: "No eligible tier ... selects nothing".
- TICKET-0018 resolution: "if none qualifies it uses 200, records CPFP eligibility, and alerts".

The problem is that PRE attributed the fail-closed side to "the action contract **and former decision**", and POST names only the action contract. No technical record in either copy holds a fail-closed decision: `decision-overview.md:69` and `:419` both state the 200-tier-plus-alert rule. So the "former decision" claim now exists nowhere. Either the reference was dropped as unsupported, in which case that should be said, or a source was lost. Each side's own text survives.

### B4: Package-count conflict: the "stale/current" status and the pending-repair status were dropped

- PRE `bitcoin-authorization-and-recovery/domain.md:25`: "The current package contract specifies six borrower recovery, six lender recovery, and six borrower long-stop variants. A stale SR-002 archive sentence still says twelve terminal packages; this documented source conflict remains for a separate repair."
- POST `domain.md:44`: "Unresolved source conflict: SR-002 phase-specific archive readiness calls the post-activation phase a 12-package signed terminal phase, while SR-002 terminal construction, INV-026, IFACE-005, and TICKET-0014 ... specify six borrower-recovery, six lender-recovery, and six borrower-long-stop packages with an 18-object receipt."

Each side survives in its own record:

- SR-002:36 still says "the 12-package signed terminal phase".
- SR-002:31, INV-026:33, IFACE-005:45 and TICKET-0014 still say 6/6/6, or 18.

POST quotes both sides accurately. However, PRE classified one side as "current" and the other as "stale", and it recorded that the conflict "remains for a separate repair". POST drops both statuses and presents the two sides as equal. This is a dropped status, narrow but real: a reader of POST can no longer tell that the record judged the 12-package sentence obsolete.

### B5: Lost rationale for canonical loan-terms encoding

- PRE `loan-terms-and-commitments/domain.md:31`: "The recorded rationale for canonical encoding is interoperability and verifiability: divergent encodings or mixed immutable and deployment facts could bind signatures, manifests, and chain actions to different loans, or make a package impossible to reproduce."
- POST `domain.md:38` replaces this with a different rationale taken from ticket contexts: "a database-only identifier would not bind Base state to the same immutable terms ... deployment-wide constants and mutable attempt data are not copied ... one machine-verifiable deployment contract prevents components from using incompatible fixed values" (sr-001-tickets.yaml:72 and the TICKET-0075 context).

Where the PRE content lives now:

- "bind ... to different loans" is approximated by INV-001's Violation Meaning: "A mismatched artifact could authorize the wrong participant, loan, ...".
- "make a package impossible to reproduce", and the "interoperability and verifiability" framing, are in no technical record. A grep for `reproduc` finds no matching statement.

### B6: Lost process rule in loan-terms

- PRE `loan-terms-and-commitments/domain.md:33`: "An unresolved implementation question belongs in its existing ticket; a narrative or diagram cannot supply a missing approval."
- No technical record in POST carries it, and the guide does not either. The closest text is architecture.md:75, "They do not replace this written architecture", which is about visuals and is not the same rule. This is low impact but lost.

---

## Minor

- **M1:** SR-001:17 now sends the reader to a guide for the full scenario. "the Domain Overview explains the full cooperation scenario" became "the [Loan Terms And Commitments guide](../../../../guide/domains/loan-terms-and-commitments.md) explains the full cooperation scenario". The link resolves. A technical record now depends on a reader guide for narrative, although the technical content stays in SR-001, STATE-001, STATE-002 and FLOW-001.
- **M2:** architecture.md drops the package-wide note about the fee and package-count discrepancies. PRE (System Overview) said: "Existing approval-wording and fee/count discrepancies identified by the migration remain unresolved source issues; this documentation revision does not choose new behavior."
  - The approval half is now an explicit note at architecture.md:23 and :81.
  - The fee/count half now lives only in `bitcoin-authorization-and-recovery/domain.md:44-45`.
  - The statement is accounted for, but architecture no longer points to it.
- **M3:** architecture.md drops PRE's "Each domain below is a complete reading destination; responsibility and contract links provide precise detail." This is navigation, and after the change it would be untrue, so removing it is correct.
  - The rest of the System Overview is accounted for. The paragraph beginning "Loan Terms And Commitments supplies…" moved verbatim to :73.
  - "The separation matters because each can report progress…" became "Each domain can report progress…", with the same meaning.
  - The first sentence is covered by Purpose And Binding :21.
  - The five-domain sentence is covered by the Domain Map table.
- **M4:** Excludes now labels SCOPE-005 "Outside V1". This appears in settlement :28, bitcoin :28 and participant :29.
  - SCOPE-005 has `status: "deferred"` and says "Signing-session UX, Base accounting, and support runbooks are deferred". It never says "not part of V1".
  - PRE wording was "does not yet provide", "remain excluded" and "remain deferred".
  - The label is slightly stronger than its source. The other "Outside V1" labels are backed by explicit V1 wording in their scope records:
    - SCOPE-001: "V1 does not let…"
    - SCOPE-002: "not part of V1"
    - SCOPE-003: "V1 has no…"
    - SCOPE-006: "V1 … no forgotten-password recovery"
    - SCOPE-014: "Optional … is deferred" under "V1 keeps…"
    - SCOPE-015: "deferred out of V1"
- **M5:** loan-terms `domain.md:40` drops the PRE label "older". PRE :21 said: "The architecture's older standing-approval wording conflicts with these detailed records; this migration records the discrepancy without deciding new behavior."
  - Every side named in POST was verified, and each keeps its original wording:
    - architecture :21 (unchanged)
    - SEL-012:15
    - IFACE-003:91
    - SCOPE-011:14
    - INV-011:14
    - FLOW-001:19 (preconditions)
    - SR-001:31
    - STATE-001:22, :47
    - STATE-002:32
  - No side was rewritten. Architecture :21 and :81 keep their wording and only gained notes saying the conflict is unresolved.
  - PRE explicitly declined to decide, so dropping "older" is a dating label rather than a ruling.
- **M6:** The settlement domain record no longer says "V1 has no on-chain pause".
  - The statement still lives in SR-003:33 ("no on-chain pause, and valid direct exits during application/opener shutdown"), SEL-009:15 and :30, and CONS-008:14.
  - The POST wording "operational frontend/API pause" agrees with SEL-009.
  - STATE-019 still lists "pause/operational roles" and a "Paused for new/risky action" state. That disagreement existed before the change and the change left it untouched, but it is worth recording next to B1.
- **M7:** Bitcoin: the exact-script rationale was restated.
  - PRE :37: "a mismatch can strand collateral or authorize the wrong party."
  - POST :40 quotes the SEC-011 impact list: "unspendable or lost recovery to a wrong output, mutation, secret or key exposure, or cross-chain failure after payout".
  - The SEC-011:66 text matches. "authorize the wrong party" is also covered by INV-001's Violation Meaning. The meaning is preserved and broadened, with a correct source.
- **M8:** Participant: PRE :43 said "A visual, fixture, healthy process, or local design check cannot satisfy those exclusions or activation gates."
  - SCOPE-013's "Must Not Be Inferred" section covers fixtures, configuration names and local evidence.
  - "visual" and "healthy process" are not named there. SR-011:78 covers "health route".
  - The substance survives.
- **M9:** `visuals/assets/sources.json` refreshed the fingerprints of 6 changed system-model files.
  - The refreshed files are the 5 domain records and SR-001; architecture.md was also refreshed, see "None" below.
  - Three of those files carry Blocker findings: settlement (B1), bitcoin (B2–B4) and loan-terms (B5–B6).
  - Every refreshed hash matches the POST bytes. The only stale entry is `build/workflow/handoffs/README.md`, which was already stale in PRE.
  - The HTML outputs are byte-identical, and no visual consumes the changed passages. The generator reads only architecture `design_format`, the build units and explorer/graphs JSON. A grep of explorer.json and graphs.json found no beta-key, pause, 12/18-package, fail-closed or standing-acceptance text.
  - So the refresh does not hide a changed meaning from its consumer. It does mark the visuals as current against records that still need the Blocker fixes, and it will need to be refreshed again after those fixes.

---

## None: areas checked and clean

1. **Pinned records.** `build/workflow/handoffs/repo-002-core-coordination-scope.json` is the only `*-scope.json`.
   - It pins 21 in-package files: IFACE-003 to IFACE-020, IFACE-022, BU-006 and BU-007.
   - All are byte-identical between PRE and POST and match their stored sha256.
   - No changed file is pinned, and no handoff or verification record holds a hash of any changed file. Searches for both full and 8-character prefixes of the PRE hashes match only sources.json and explorer.json.
2. **explorer.json.** The only change is the `system-model/architecture.md` fingerprint, 0673de08… to 609743ae…, which matches the POST bytes.
   - Architecture's meaning is unchanged: Purpose, Authority, Topology, Domain Map and Cross-Domain wording survive, with additive conflict notes and verbatim relocations.
   - The explorer `summary` derives from Purpose And Binding, which is unchanged.
   - This refresh is legitimate.
3. **Observation domain.** All removed narrative (PRE :11–40) is accounted for in technical records:
   - SR-006 :26–33 and :58 (provider policy, cursor acknowledgement, noncanonical marking, operator recheck limits, Bitcoin agreement, incident dedup, "post-`X` failure as immediately critical", payment-transfer limits).
   - SR-007 :17–39 (S, H(S), activation gate, Y-only escrow, C = D + 172,800, independent verification, same borrower-signed transaction, D+3 and D+10 routes, failure cases).
   - STATE-013 (switch to the protocol EOA before C, freeze at C, refund once, no ECVS dependency).
   - FLOW-005 :19–37 (claim/refund exclusivity, cooperative route via FLOW-009).
   - INV-025, and FLOW-006:37 / SCOPE-002:28 (no collateral key or sale authority).
   - SEL-013 and TICKET-0047 (safe status is progress only; L1 finality is not a promised wait time).
   - The new Choices attributions were checked against SEL-013/014/015, CONS-020 and TICKETs 0037, 0047, 0053 and 0054, and they match. SCOPE-001 is still referenced at :47.
4. **Settlement domain.** Apart from B1 and M6, all removed narrative (PRE :11–35) is accounted for:
   - SR-003 :24–33 and :60 (vault and acceptX semantics, exact amounts, "strictly before `C = D + 172,800`", `T = D + 259,200`, payer-neutrality, Vault payment account, fixed permissionless recovery, operator limits).
   - SR-005 :19–29 (verification of the deployed vault, one or more transfers, partial deposits, no pooling, substitution or automatic draw).
   - IFACE-010:32/36 and IFACE-011.
   - STATE-011/012/013; FLOW-001/002/003/004; INV-006/007/008.
   - The vault Choices rationale matches SEL-021:25 and SEL-022. TICKETs 0052, 0072, 0048 and 0065 exist and match.
5. **Bitcoin domain.** Apart from B2–B4 and M7, all removed narrative (PRE :11–37) is accounted for:
   - SR-002 :15, :29–38 and :63 (zero-confirmation construction, six unchanged confirmations, terminal construction only after the winner, signing order and receipt-before-signing rejection, relay ambiguity).
   - INV-003, INV-015, INV-016 :14 (same-parent reorg pauses qualification), INV-022, INV-004.
   - SR-004 :31/:41 and SR-009 :31 (two-step secret-bearing confirmation; no login-based unlock); INV-024.
   - FLOW-007:26 ("Base cannot revoke the signed package").
   - SEC-026 (Y/S share the route-code-3 transaction; route 6 is distinct), IFACE-016 and SEC-027 (fee-wallet authority), CONS-007, IFACE-007.
   - The SCOPE-001/002/003/005/006 exclusions are now in Excludes :28.
   - Attributions checked: CONS-005 (source_tickets 0147, 0148), SEL-027 with TICKET-0055, SEL-004 with TICKET-0082, and TICKETs 0018, 0064, 0089 and 0014.
6. **Loan-terms and participant domains.** Apart from B5, B6, M5 and M8, removed narrative is accounted for:
   - IFACE-002:29 (endpoints, secrets and dynamic facts excluded from deployment identity).
   - architecture :25 ("Neither commitment is a wallet, signing key…").
   - SR-001 :31–38 and :57; STATE-001/002 (including :34 for supersession/amendment); SEL-012:41 (permanent cancellation, next reservation); INV-011/023; IFACE-001:75.
   - SR-010 :27–29; SR-011 :33, :42, :49–50, :78, :86; SR-012 :29–30, :38, :71; IFACE-021; IFACE-022 :48 and :91.
   - STATE-021:67 (Core enters Signing before invoking the signer).
   - SR-006:33 (0/15/60/180-second probes).
   - architecture :43–45 (shared Cloudflare failure domain, D1 outbox with one-minute scan, no RTO/RPO, off-provider backups are not a running fallback).
   - SCOPE-013/014/015 and VA-003:13 ("Current payment-wallet delta: Planned and unverified").
   - The participant Choices attributions were verified: SEL-035; SEL-043; TICKETs 0122, 0123, 0125, 0126 and 0129; and TICKETs 0151–0154 and 0156, which all carry `origin: unknown-origin` exactly as POST says.
7. **Links, anchors and quotation consumers.**
   - Every relative link and anchor in the 8 changed Markdown files resolves in POST. This includes the new `guide/...` links and `domain.md#choices-and-rationale`.
   - A package-wide link check over all `.md` files (256 PRE, 262 POST) found exactly the same set of unresolvable links before and after, all pre-existing. The change introduced no broken link, including from `guide/` into the technical records.
   - Nothing in the package references a removed heading or anchor (`Domain Overview`, `System Overview`, or any removed `###` section), and nothing quotes removed text.
   - `decision-overview.md:1093`/`:1527` → `architecture.md#decision-attribution` still resolves (POST :116).
   - The visuals generator reads only architecture frontmatter `design_format`, so the new `system_guide: adopted` key is harmless.
   - The README.md change (adding the System Guide link, "Start here.") resolves and changes no technical meaning.
