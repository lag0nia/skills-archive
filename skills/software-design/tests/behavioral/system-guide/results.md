# System Guide evaluation

## Method

On 2026-10-15, fresh agent contexts exercised the System Guide guidance on disposable copies of a real format-2 package: the Bitcoin-backed USDC one-loan system (Loan System), with an architecture record, five domains, 155 tickets and delivery evidence. Every copy was made from one pristine snapshot of the live `design/` directory (356 files; the SHA-256 of its sorted hash list is `b22bdfb6…cdee0d`). The live package was never written. It hashed identically before and after the evaluation, and it has no `guide/`.

The skill each agent used was a frozen copy:

- **v1** (tree hash `6adb2030…5b9ce33`): T0–T5.
- **v2** (tree hash `a1819278…f1c2d`): T6, stopped. It adds the first guidance revision and the renderer's label pluralization fix.
- **v3** (tree hash `231738c4…53b7ee`): T7. It adds the second guidance revision.
- **v4** (tree hash `c169bc6e…bc7b02`): T8. It adds the third guidance revision.
- **v5** (tree hash `80fba0ca…fa0f3f`, 206 files): T9–T11. It adds the fourth guidance revision and the exporter safety fixes.
- **v6** (tree hash `27dac673…8a0f5d1e`, 206 files): T12–T13. It adds the fifth guidance revision. v6 is the shipped guidance: the skill in this repository matches it file for file, apart from this evaluation directory.

Frozen copies leave out this evaluation directory, so no agent could read the answer key or earlier outputs through the skill.

Each agent received only the prompt in [prompts.md](prompts.md), and no agent saw another's output. Authoring prompts were ordinary user requests that named the skill copy and the package; they did not mention the guidance under test. Readers received one PDF and a question list, and were told not to open anything else.

The answer key ([expectations.md](expectations.md), SHA-256 `f376b8b0…96af6a`) was written by T0 from the technical records before any guide existed. No authoring agent saw it.

A versioned correction ([expectations-v2.md](expectations-v2.md), SHA-256 `cf26470f…069d77`) was written by the coordinating session after T8's reviews and before T9 produced any output. It amends the key with source-backed reasons, weakens no requirement, defines T9's criteria and acceptance blockers in advance, and adds two reader questions (Q-A9, Q-B9). The original key is unchanged, and T1–T8 keep their scores under it. T9, T10, T12 and T13 are scored under both files. Reviewers later found three points where the key or its correction is wrong; see [Answer-key errors](#answer-key-errors-found-by-reviewers). Neither file was edited after its runs began.

Scoring, comparisons and visual inspection were done by the coordinating session, except that reader answers from T9 onward were scored by one separate scoring agent and spot-checked by the coordinating session. Verbatim agent reports are in [responses/](responses/). The guide sources each authoring run produced, and its changes to technical records, are in [outputs/](outputs/). PDFs are not kept here: they are generated artifacts, and their facts are recorded below.

## Runs

| Run | Purpose | Input | Result |
| --- | --- | --- | --- |
| T0 | Answer key | untouched copy | 6 × 8–15 must-preserve facts, distinctions 2a–2h, 48 reader questions, review criteria |
| T1 | Full authoring, ordinary request | fresh copy, v1 | 6 guides, 7 PDFs; validation identical to baseline |
| T2 | Independent repeat: architecture + observation/fallback domain | fresh copy, v1 | all 6 guides (adoption requires every domain guide), 2 PDFs; **6 new delivery-readiness errors** |
| T3 | Reader comprehension, one PDF per reader | T1 (6) and T2 (2) PDFs | 56 answers scored (below) |
| T4 | Semantic preservation review against owners and the key | T1 package snapshot | see [T4](#t4-semantic-preservation) |
| T5 | Maintenance: hypothetical 12-hour reservation | T1 package copy | see [T5](#t5-maintenance) |
| T6 | Full authoring rerun with the first revision | fresh copy, v2 | stopped when T4 required a second revision; no changes made |
| T7 | Full authoring rerun with the second revision; six readers; two reviewers | fresh copy, v3 | see [T7](#t7-rerun-after-guidance-revision) |
| T8 | Full authoring rerun with the third revision; six readers; two reviewers | fresh copy, v4 | see [T8](#t8-rerun-after-the-third-revision) |
| T9 | Full authoring with the fourth revision; technical-diff review; two guide reviewers; six readers | fresh copy, v5 | **fails**: see [T9](#t9-full-authoring-after-the-fourth-revision) |
| T10 | Independent scoped repeat: architecture + observation/fallback; one guide reviewer; two readers | fresh copy, v5 | **fails**: see [T10](#t10-independent-scoped-repeat) |
| T11 | Maintenance: hypothetical 12-hour reservation | T9 package copy, v5 | passes its checks: see [T11](#t11-maintenance) |
| T12 | Full authoring with the fifth revision; technical-diff review; two guide reviewers; six readers | fresh copy, v6 | **fails**: see [T12](#t12-full-authoring-after-the-fifth-revision) |
| T13 | Independent scoped repeat: architecture + observation/fallback; technical-diff review; one guide reviewer; two readers | fresh copy, v6 | **fails** (observation guide passes): see [T13](#t13-independent-scoped-repeat-with-v6) |

## Baseline

The validators listed in the skill, plus the decision-overview and visual `--check`s, were run on an untouched copy with the HEAD skill and with the new skill. Their outputs were identical: 1,036 lines, byte for byte. Four validators fail on the untouched package: structure, Build Design, delivery readiness and UI/UX. The failures are pre-existing and unrelated to the guide: stale runtime evidence, four `ui-ux/alternatives/role-split` behavior checks, and delivery evidence that points into implementation repositories not present in the copy. Every later run was compared against this baseline.

## T1: full authoring

T1 followed the migration: it inventoried the narrative, preserved unique facts, wrote six guides, replaced each narrative with one link line, declared adoption, refreshed the System Explorer fingerprint and `sources.json` after checking their quotations, and exported seven PDFs. It ran six read-only fact-checking helpers over its drafts and corrected the guides from their findings. Its validation output is identical to the baseline.

It handed off with three steps undone, and said so:

- two re-reviews it had launched were still running;
- `--check` had not been run after the last export;
- only 4 of the 41 combined pages had been inspected.

Both re-reviews later reported to the coordinating session ([architecture](responses/t1-helper-architecture-rereview.md), [participant](responses/t1-helper-participant-rereview.md)). Their findings were never applied, so they count as findings against the T1 guides.

T1 kept every recorded conflict open and reported newly found discrepancies (offer-binding contents, reservation expiry versus cancellation, who may reveal X and Y, pause, beta upgrade key) without resolving them. It also reported that the domain template's `Choices And Rationale` described only settled choices, although it needed to hold conflict notes there.

The coordinating session re-exported T1's unchanged sources with the fixed renderer (below), and `--check` reported all seven current. Page counts: architecture 11; domains 6, 7, 6, 6 and 7; combined 41.

## T2: independent repeat

T2 asked for two guides and could not export them until every domain had a guide, because adoption requires one guide per canonical domain. It delegated four domain drafts to helpers and reviewed them. It found the renderer typo "Scope boundarys", which was fixed with a regression test.

It preserved unique facts in different owners than T1. It added rationale to interface, selection, constraint and scope records, and a conflict note to the fee interface. That interface's bytes are pinned by a delivery slice's bounded-delta assessment, so validation reported **six new errors**: three actions, each with stale evidence and an unpinned source.

**T2's report said validation showed only the pre-existing errors.** It had not compared delivery-readiness output against a baseline. This finding drove the migration revision below.

Boundary slips by T2 and its helpers: a scratch file `exc.md` in the scratchpad and a `/tmp/dummy` file, both deleted by T2. T1 created and deleted `/tmp/a2.txt`, and left a work folder in the scratchpad. None touched the live package or the skill.

## T3: reader comprehension

The readers could not page through the PDFs as instructed because `pdftoppm` was missing, so each read the whole PDF in a single Read call (text and page images). Full [scoring](scoring.md):

| Guides | Met | Partial | Not met | Wrong |
| --- | --- | --- | --- | --- |
| T2 architecture + observation (16 questions) | 15 | 1 | 0 | 0 |
| T1 all six (48 questions) | 39 | 8 | 1 | 0 |

No reader stated a wrong or dangerous answer, and every reader marked gaps instead of guessing. The misses cluster in four patterns:

1. residual risks recorded in invariant and security records rather than in the domain record (the activation-pending refund race);
2. capability status (payment reproduction awaiting a test vector, the demo slice blocked and unverified) presented as working behavior;
3. an exclusive "only" that narrowed a rule the records state more broadly;
4. an authoring rule (how to describe a threat) that the guide summarized and left to its owner.

Readers of separate domain PDFs consistently asked for earlier definitions of cross-domain terms (Vault, package, Base) and for a glossary. The guide deliberately has no glossary.

## T4: semantic preservation

Two fresh reviewers checked every T1 guide claim against its owners, using the key's part 4 as criteria and the untouched copy to see what the migration removed ([review A](responses/t4-review-a.md), [review B](responses/t4-review-b.md), with summaries alongside). They were told to verify the key rather than trust it.

| Guide | Critical | Major | Key facts kept | Verdict under the key's strict rule |
| --- | --- | --- | --- | --- |
| Architecture | 0 | 2 | 14/15 | fail (two Majors) |
| Loan Terms And Commitments | 0 | 1 | 13/15 | fail (under 90%) |
| Bitcoin Authorization And Recovery | 0 | 3 | 11/15 | fail |
| Base USDC Settlement And Funding | 0 | 2 | 12/15 | fail (narrow) |
| Base Observation And Fallback Review | 0 | 1 | 14/15 | pass with a correction note |
| Participant Access And Loan Operations | 0 | 0 | 12/15 | fail (under 90% only) |

No guide had a Critical defect. The reviewers found no wrong value or strict inequality, no merged secret, account or outcome, no conflict silently resolved, and no availability overclaim.

Every Major is an omission or a narrowing:

- the activation-pending refund race (architecture, Bitcoin);
- Bitcoin gates stopping when only one source is down (architecture);
- the two-step Vault confirmation before a secret is disclosed, and what a forgotten Vault password blocks (Bitcoin);
- approval granting no signing, custody or funding authority (loan terms);
- the upgrade-governance discrepancy stated too mildly, and the permanence of the unclaimed-repayment refund (settlement);
- what an empty fallback lookup does not prove (observation).

On preservation, every behavior fact the migration removed still has a technical owner. The exceptions:

- a capability-status sentence ("no execution evidence") now survives only in build status records;
- two meta-rules are gone ("a narrative or diagram cannot supply a missing approval"; "not permission to add recovery authority");
- domain records lost their links to the scope records behind their exclusions;
- two discrepancies T1 discovered exist only in a guide;
- the architecture record still states "no second lender approval" in a second place without a conflict marker.

Both reviewers found the key incomplete. It misses four real discrepancies that the guides report correctly (pause and beta upgrade key, who may reveal X and Y, expiry versus cancellation, participant references). It also treats one contested field as settled. The guides were more faithful than the key on those points.

T6, the first rerun with v2, was stopped after T4 because review B's preservation findings called for a further revision. It had made no change to its copy; its last step was running the new baseline validation.

## Guidance revision

Changes made after T1–T4 and after T7, each tied to observed evidence:

| Evidence | Change |
| --- | --- |
| T2 edited a pinned record, and its report missed the regression | Migration starts with a validator **baseline** and ends by comparing against it: a new failure is a regression to fix. Consumer inspection now covers records pinned by bounded-delta assessments; pinned records stay unchanged, or the fact is reported. |
| T1 and T2 placed conflict notes in different owners; T1 found the template mismatch | Conflict notes from a migrated narrative go to the domain record's `Choices And Rationale` (or beside the system-wide statement in the architecture record), never into the conflicting records. The domain-record template now allows one `Unresolved source conflict:` line per conflict. |
| T3 patterns 1–3 and the T1 re-reviews | Writing principles 6, 7 and 9 now require recorded capability status, an in-place note where a scenario passes an open conflict, and residual risks or races where the narrative reaches the threatened state. Self-review step 2 now reads past the domain records into invariant, security, constraint, scope and selection records, and checks exclusive words against the owner. Self-review step 1 now checks that every term is explained where it is first used. |
| T2's "Scope boundarys" | The renderer pluralizes `-y` labels correctly, with a regression test. |
| T4: discrepancies found while writing existed only in a guide | A conflict first noticed while writing is recorded in its domain or architecture record before the guide explains it, and reported. |
| T4: the rule against a guide "status summary" plausibly led T1 to drop a capability's status | The ban now names a delivery-progress summary, and a guide may say a capability is planned, unverified or gated when its owner says so. |
| T4: lost scope links; dropped authority steps and risks | Migration moves the narrative's unlinked record links into `Excludes` or `Cross-Domain Contracts`, and compares each guide with the narrative it replaces for every consequential point. A system-wide conflict note goes beside each statement it qualifies. Principle 6 adds that signing in, approving or holding an identifier is not authority. |

| T7: the participant guide narrated the disputed approval as settled, though other guides flagged it | Self-review lists every conflict the package records as open and checks each guide passage that reaches it, including steps narrated in another domain's guide. |
| T7: the demonstration's "Planned — unverified" status lived in a verification record the self-review did not name; a "must not imply" became "shows only" | Self-review reads verification records and the package's delivery status. Principle 6 keeps an owner's limit exactly as strong as the owner states it. |
| T7 recorded a "conflict" that another owner reconciles | A conflict is two owner statements that cannot both hold; before recording one, the author reads each in its own scope and looks for a reconciling owner, and reports remaining doubt to the user instead. |

The first four rows form v2; v3 adds the next three; v4 adds the last three.

## T5: maintenance

T5 received a copy of the T1 package with its PDFs and a hypothetical request: shorten the reservation to 12 hours, nothing else changes ([report](responses/t5-maintenance-report.md)). The coordinating session verified the result independently:

- **Owners first, guide second.** The state, interface and selection records and the settling ticket changed; then the three guide passages that state the length (architecture, loan terms, participant operations). No other file changed apart from the derived decision overview and `sources.json`.
- **Nothing else moved.** All twelve remaining "24-hour" mentions in the guides are other timers: funding window, acceptance deadline, sessions, backups and email retries. T5 named the 67-hour origination envelope and left it alone deliberately.
- **Attribution.** The original user-specified entry keeps its August evidence without the duration. A new user-specified entry quotes the request and notes that it was presented as hypothetical. The decision overview went from 394 to 395 decisions.
- **PDFs.** T5 re-exported only the four stale PDFs; `--check` with the skill copy it used reports all seven current. The same `--check` under v2 reports all seven stale, as designed, because v2's renderer differs.
- **Validation.** Six new delivery-readiness findings appear, because the reservation interface is pinned by a delivery slice's bounded-delta assessment. T5 reported this, explained that the already-built API and harness now disagree with the design, and declined to rehash the pin without the review it requires. Every other validator matches the T1 run.

T5 asked whether 12 hours should cover everything before the prefund (both Vaults, both final approvals, the prefund) or start at terms commitment. It also noted that a shorter window makes the existing expiry/cancellation conflict more common. Boundary slips: it briefly placed two helper tools in a shared scratchpad folder before moving them out, left four unreported scratch files (`affected.json`, `find24.py`, `find24b.py`, `findphr.py`) and an empty directory in the scratchpad root, and viewed only the changed pages of the combined PDF.

## T7: rerun after guidance revision

T7 received T1's request with only the skill copy (v3) and paths changed ([report](responses/t7-authoring-report.md)). It used three read-only fact-checking helpers, fixed about 40 findings before handing off, rendered and inspected every page itself, and reported seven open questions. The coordinating session verified it independently:

- **Validation** is byte-identical to the baseline (1,036 lines), and `--check` reports all seven PDFs current.
- **Changed records:** the architecture record, five domain records, one responsibility record (a sentence that pointed at the removed overview), the README, and the System Explorer and `sources.json` fingerprints. Diff: [outputs/t7/record-changes.diff](outputs/t7/record-changes.diff).
- **Pinned records:** none edited; every pinned hash present in the copy matches.
- **Conflicts:** six are recorded as `Unresolved source conflict:` lines in three domain records, as the revised template asks: approval, binding contents and payment-account recipient (loan terms); the no-qualifying-tier fee rule and the package count (Bitcoin); the on-chain pause (settlement).
- **Boundary:** no slip found; T7 deleted its own work folder, which also removed its intermediate evidence.

### Readers

Six fresh readers, with T1's prompts apart from the PDF path ([scoring](scoring.md#t7-guides-rerun-after-guidance-revision-v3-six-guides-fresh-authoring-agent-and-fresh-readers)): 40 met, 8 partial, 0 not met, 0 wrong (T1: 39, 8, 1, 0). The targeted omissions improved: the activation-pending refund race (Q-B3), the two-step disclosure (Q-B6, now partial), lost responses never becoming new actions (Q-P5) and one-person operator approval (Q-P8). Three answers T1's guides supported regressed: what the shared loan reference does not do (Q-A8), the email confirmation for a Vault password change (Q-P2), and what a completed operation means (Q-P6). The demonstration's recorded status is still missing (Q-P7).

### Fidelity review

The two reviewers received T4's prompts with the snapshot and output names changed ([review A](responses/t7-review-a.md), [review B](responses/t7-review-b.md), with summaries alongside). The coordinating session checked each Critical and Major finding against the records; "confirmed" below means the cited owner text says what the reviewer reported.

| Guide | Critical | Major | Key facts kept | Verdict | T1 (T4) |
| --- | --- | --- | --- | --- | --- |
| Architecture | 0 | 2 | 12/15 | fail | 0 / 2 / 14 |
| Loan Terms And Commitments | 0 | 1 | 11/15 | fail | 0 / 1 / 13 |
| Bitcoin Authorization And Recovery | 0 | 0 | 12/15 | fail (under 90% only) | 0 / 3 / 11 |
| Base USDC Settlement And Funding | 0 | 1 | 14/15 | pass with a correction note | 0 / 2 / 12 |
| Base Observation And Fallback Review | 0 | 0 | 14/15 | pass | 0 / 1 / 14 |
| Participant Access And Loan Operations | 1 | 2 | 10/15 | fail | 0 / 0 / 12 |

Majors fell from 9 to 6 and two guides now pass, but the guides review A covers got worse, and one Critical appeared:

- **Critical, confirmed.** The participant guide narrates "each approves that exact version" as settled. The approval step is a recorded open conflict, which the loan-terms and architecture guides flag; principle 7 required a note here too.
- **Invented conflict, confirmed (Major in two guides).** T7 recorded "payment account as recipient" as unresolved in the loan-terms domain record and both guides. The records reconcile it: the account is not itself a terms field, but its address may be selected for a fresh loan's existing recipient field with fresh approval (architecture record "Purpose And Binding"; the payment-account interface's "Must Not Imply"). T7 read "not a term-bound recipient" outside its scope. A wrong statement now sits in a technical owner of the copy.
- **Capability status and limits, confirmed (two Majors, participant).** The local demonstration is described in the present tense, while its verification record says "Planned — unverified" and its slice is blocked. The callout turns the owner's "must not imply" into "shows only that the local profile works", a positive claim the owner does not make.
- **Recovery phrase, plausible (Major in architecture; minor in Bitcoin).** The guides repeat the selection record's "the 12-word phrase restores Bitcoin key material" but not the responsibility record's "password loss blocks new signing and cooperative settlement". The two records are in tension and nothing flags it.
- **Beta upgrade key, confirmed as a record inconsistency (Major, settlement).** The guide repeats the upgrade selection's single beta key as settled; the system-model records describe only the 2-of-3 Safe with its timelock. T1 had reported this discrepancy; T7 did not.
- **Migration loss.** The architecture record still says "no second lender approval" in two places with no marker; the dispute is recorded only in the loan-terms domain record and the guides. Two meta-statements ("a narrative or diagram cannot supply a missing approval"; "L1 finality is not a promise of an exact waiting time" outside the guide) and the fee rules' rationale no longer have an owner.

Both reviewers again found the key incomplete (pause, binding contents, beta key, recovery phrase) and citing sections the migration removed.

### What T7 shows

The v3 changes worked where they named a place to look: residual risks recorded outside the domain record now appear, conflicts are recorded in technical owners, and pinned records were left alone. They did not stop three failures: a conflict narrated as settled in a guide other than the one that owns it, capability status held in verification records (which the self-review did not name), and a "conflict" recorded without checking whether the records reconcile it. T7 is one run by a different author than T1, so the per-guide differences mix guidance and author effects.

## T8: rerun after the third revision

T8 received T7's request with only the skill copy (v4) and paths changed ([report](responses/t8-authoring-report.md)). It used three read-only fact-checking helpers, verified each finding against the records before applying it, inspected every page of the combined PDF, and listed five questions it would have asked. The coordinating session verified it independently:

- **Validation** is byte-identical to the baseline (1,036 lines), and `--check` reports all seven PDFs current. The ticket-inventory leads report, which is informational, fell from 98 to 87 leads because the removed narratives were their source.
- **Changed records:** the architecture record, five domain records, one responsibility record (a sentence that pointed at the removed overview), the README, and the System Explorer and `sources.json` fingerprints. T8 also removed each domain record's empty `Agent-First Canonical Reference` heading, which nothing links to, and asked about it. Diff: [outputs/t8/record-changes.diff](outputs/t8/record-changes.diff).
- **Pinned records:** none edited; all 24 pinned hashes present in the copy match.
- **Conflicts:** the three conflicts the original narratives held are recorded, and no others: the approval wording (beside the statements in the architecture record, and in the loan-terms domain record), and the no-qualifying-tier fee rule and the package count (Bitcoin domain record). T8 did not record the payment-account "conflict" T7 invented. On the beta upgrade key it read the records as compatible, recorded the selection's sequence as the settled choice, and asked the user whether the system-model records were meant to cover the beta, as the v4 rule asks.
- **Boundary:** no slip found; T8 deleted its own work folder.

### Readers

Six fresh readers with T7's prompts apart from the PDF path ([scoring](scoring.md#t8-guides-rerun-after-guidance-revision-v4-six-guides-fresh-authoring-agent-and-fresh-readers)): 43 met, 4 partial, 1 not met, 0 wrong (T7: 40, 8, 0, 0; T1: 39, 8, 1, 0). Fixed against T7: the demonstration's recorded status (Q-P7, missed by T1 and T7), what the shared loan reference does not do (Q-A8), what a forgotten password blocks (Q-B8), the email confirmation (Q-P2) and what a completed operation means (Q-P6). Regressed: the two Vault confirmations before disclosing a secret (Q-B6, now not met, as in T1), what the Vault checks before signing (Q-P4) and one-person operator approval (Q-P8). Unchanged: the threat-description rule (Q-A7, weaker than before) and replay after a provider outage (Q-O3).

### Fidelity review

The two reviewers received T7's prompts with the snapshot and output names changed ([review A](responses/t8-review-a.md), [review B](responses/t8-review-b.md), with summaries alongside). The coordinating session checked each Major finding against the records, as for T7.

| Guide | Critical | Major | Key facts kept | Verdict | T7 | T1 (T4) |
| --- | --- | --- | --- | --- | --- | --- |
| Architecture | 0 | 2 | 11/15 | fail | 0 / 2 / 12 | 0 / 2 / 14 |
| Loan Terms And Commitments | 0 | 0 | 12/15 | fail (under 90% only) | 0 / 1 / 11 | 0 / 1 / 13 |
| Bitcoin Authorization And Recovery | 0 | 0 | 13/15 | fail (under 90% only) | 0 / 0 / 12 | 0 / 3 / 11 |
| Base USDC Settlement And Funding | 0 | 2 | 14/15 | fail | 0 / 1 / 14 | 0 / 2 / 12 |
| Base Observation And Fallback Review | 0 | 1 | 11/15 | fail | 0 / 0 / 14 | 0 / 1 / 14 |
| Participant Access And Loan Operations | 0 | 1 | 10/15 | fail | 1 / 2 / 10 | 0 / 0 / 12 |
| **All six** | **0** | **6** | **71/90** | **no guide passes** | 1 / 6 / 73, two pass | 0 / 9 / 76, one passes |

The three v4 targets held: no guide narrates the approval step as settled, the demonstration's status is stated without an overclaim, and no conflict was invented. The verified Majors:

- **Beta upgrade key, confirmed (Major in architecture and settlement), and a changed technical record.** Before the migration, the settlement domain record said the main contract "retains" the 2-of-3 Safe and seven-day timelock, as the upgrade-boundary invariant and the deployment state do; the deployment state lists an "unrestricted unilateral upgrade/admin key" as invalid. T8 rewrote that record to the upgrade selection's sequence (a single key through the public mainnet beta, then the Safe), citing records that do not support it, and both guides state it as settled. T8 reported its doubt to the user (its question 4) instead of recording a conflict, as v4 asks, but then adopted one side, which the migration rules and principle 7 forbid. The reviewers rated it Major because it was reported, not silent; under the key it sits next to the Critical "conflict silently resolved".
- **Stolen recovery transaction, confirmed (Major, architecture).** The guide says the lender "or anyone who stole that signed transaction, can then take the collateral". The security record says a package thief "cannot redirect value": the transaction pays only the lender's fixed destination. The Bitcoin guide has the same sentence; review B did not flag it there.
- **Fallback gate, confirmed (Major, settlement).** The guide never says the Bitcoin fallback exists only for loans created after its production gate, and its callout says the residual risk applies "for many loans"; the security record says the collateral stays exposed "for every loan without an activated" fallback commitment, which today is every loan.
- **Vault handoff, confirmed omission (Major, participant).** The single-use code, the Vault's own fresh session and reload, and "the Vault never signs bytes supplied only by the normal-product page" are missing; the interface record says a handoff code is "not … cryptographic authority". The guide's "not a general signing token" came from the original narrative.
- **"After activation" in the observation figure, plausible.** The wording is ambiguous (it can read as the Bitcoin escrow activation rather than the fallback's production gate), as the reviewer says; the reader resolved it correctly while noting the confusion, so the Major rating is a judgment.
- **Migration loss.** "A narrative or diagram cannot supply a missing approval" again has no owner, and the narrative's "visual, fixture, healthy process, or local design check" wording survives only in the participant guide (the runtime-profile scope record carries the substantive rule). Review B found no other fact that now exists only in a guide or nowhere.

Both reviewers again found the key incomplete (the beta-key inconsistency, the split between the dual-outage and provider-conflict alerts) and citing sections the migration removed.

### What T8 shows

Each revision closed what it targeted in the next run: v4 removed T7's Critical, invented conflict and demonstration overclaim, and readers did best on T8's guides (43 of 48 met). The fidelity bar was not reached: facts kept fell from 76 to 73 to 71 of 90 across T1, T7 and T8, Majors went from 9 to 6 to 6, and no T8 guide passes the strict rule. Most Majors and missing facts are details one author kept and the next dropped. Per-question author variance is as large as the revision effects. Different reviewers also judge differently (the stolen-transaction sentence was rated Major in one guide and not noticed in another).

The beta-key failure points to a gap in v4: "report the question to the user instead of recording a conflict" says what not to write, not what the records and guides say while the question is open. A natural next change, **not made and not tested**, would add: "until the user answers, leave each owner's statement unchanged and present the point as open in every guide that reaches it." Per the plan, guidance iteration stopped after T8.

## Fourth revision, exporter fixes and key correction

After T8 the user authorized fixing exporter defects, a further guidance revision, and a key correction, with fresh runs to test them.

**Exporter (v5).** Four defects were reproduced on v4's exporter with a small fixture before being fixed. Fixed: a complete export (`--all`, `--combined`) silently left out a domain declared in the architecture record but not yet written; it now fails and names the missing domains, and a separate architecture PDF says which domain guides are not written yet. Two output names could collide; domain PDFs are now `<system>-domain-<slug>.pdf`, distinct whatever the slugs. A failed export could leave a mixed set; PDFs are now printed and verified first, then published with backups and rolled back in reverse on failure, keeping any file that cannot be restored and naming it. A symbolic link could place output inside the package; containment is now judged by real path, including the existing parents of a directory the export would create. `tests/commands/system-guide-export-safety.test.mjs` adds 16 tests; 15 of them fail against v4's exporter.

**Guidance (v5).**

| Evidence | Change |
| --- | --- |
| T8 adopted one side of the beta-key question after reporting its doubt; T7 invented a conflict | A new **Open Questions** procedure in `system-guide.md`: classify against every statement, including what an owner forbids, reading each in its own scope and stage; record only a real conflict; keep each owner's wording; explain the point as open everywhere a guide reaches it; continue the unaffected work; report it as a question, with any proposed answer only in the report |
| T7 and T8 lost narrative facts and changed records without an independent check | Migration rewritten as seven steps, each with a completion criterion: inventory (with copies kept outside the package), placement, changes and drafts (no failure beyond the baseline), an independent technical-diff review, an independent guide review against exact sources, correction and recheck, then export and inspection. A PDF exported earlier is a draft and accepts nothing. Notes stay outside the package; the migration adds no registry or approval stage |
| T8: "for many loans"; capability statuses merged; confirmations without what they permit | Principle 4 gives an owner's exact condition instead of a vague quantifier. Principle 6 keeps selected, implemented, verified, runnable, deployed and activated distinct, and says what each confirmation permits |
| T8: the same fact correct in one guide and wrong in another | Self-review checks prose, figures, tables and callouts alike; lists every open question and checks every restated fact in other guides; and keeps claims about failures, attackers and participants exactly as strong as their owner |

**Key correction.** See [Method](#method). Its part 5 makes three things acceptance blockers: a confirmed contradiction of an owner, an unauthorized technical change, and a material omitted condition. It also lists the Section 3 checks: upgrade governance stays unresolved; a stolen default transaction can be broadcast but its payout cannot be redirected; the fallback states both its prior-commitment and production-activation conditions; the Vault keeps its signing checks and a handoff code is not cryptographic authority; secret disclosure says what each confirmation permits; capability statuses stay distinct; and equivalent passages are checked everywhere.

## T9: full authoring after the fourth revision

T9 received T8's request with only the skill copy (v5) and paths changed ([report](responses/t9-authoring-report.md)). It ran its own independent reviews of the diff and the guides, then a review of its corrections, and listed ten open points. The coordinating session verified it independently:

- **Validation** is byte-identical to the baseline (1,036 lines), and `--check` reports all seven PDFs current.
- **Changed records:** the architecture record, five domain records, one responsibility record, the README, and the System Explorer and `sources.json` fingerprints ([diff](outputs/t9/record-changes.diff)). No pinned record changed.
- **Boundary:** T9 kept its working notes in `$S/t9-guide-work`, outside the package as v5 asks but also outside "the PDFs" the prompt allowed it to write. The two instructions pull in different directions; it is recorded here, not counted as a defect.

### Technical-diff review

A fresh reviewer compared every changed technical file with the untouched copy ([review](responses/t9-diff-review.md)). It rated 6 Blockers and 9 Minors. The coordinating session confirmed one Blocker and reclassified five:

- **Confirmed (B1): a side changed in a technical record.** Before migration, the settlement domain record said the main contract "retains" the 2-of-3 Safe with its seven-day timelock, as the upgrade-boundary invariant and the immutable-conversion scope record say for V1. The migrated record's new `Choices And Rationale` line states the upgrade selection's sequence instead: a single upgrade key through the public mainnet beta, then the Safe. No note says the point is open. T8 made the same change.
- **Reclassified to Minor (B2, B3, B5, B6).** Four rationales or rules ("cross-loan correlation", the "former decision" for failing closed, "interoperability and verifiability", "a narrative cannot supply a missing approval") existed only in the removed overviews. No other record supports them. T9 reported each to the user as unsupported instead of placing it, which is what migration step 2 prescribes. The guidance deletes such a fact with its narrative, which this run makes visible.
- **Reclassified to Minor (B4).** The old Bitcoin overview called the 18-package side "current" and the 12-package sentence "stale". The new conflict note drops those labels. They were the narrative's own answer to a recorded conflict, so dropping them follows Open Questions step 2.

### Readers

Six fresh readers, with T8's prompts apart from the PDF path plus Q-A9 and Q-B9 ([scoring](scoring.md#t9-guides-full-authoring-with-guidance-v5-six-guides-fresh-authoring-agent-and-fresh-readers)): 34 met, 11 partial, 3 not met, 0 wrong on the 48 shared questions (T8: 43, 4, 1, 0). Q-A9 and Q-B9, about a stolen default transaction, are partial: neither guide states the no-redirect limit. Every regression is a fact the T9 guide no longer states.

### Fidelity review

Two fresh reviewers received T8's prompts with the snapshot changed and the correction added as criteria ([review A](responses/t9-review-a.md), [review B](responses/t9-review-b.md), with summaries alongside). The coordinating session checked each Critical and Major finding against the records, as before.

| Guide | Critical | Major | Key facts kept | Verdict | T8 |
| --- | --- | --- | --- | --- | --- |
| Architecture | 1 | 2 | about 10/16 | fail | 0 / 2 / 11 of 15 |
| Loan Terms And Commitments | 0 | 2 | 10/15 | fail | 0 / 0 / 12 |
| Bitcoin Authorization And Recovery | 0 | 4 | 10/16 | fail | 0 / 0 / 13 of 15 |
| Base USDC Settlement And Funding | 1 | 1 | 10/15 | fail | 0 / 2 / 14 |
| Base Observation And Fallback Review | 0 | 0 | 9–13/16 | fail (under 90% only) | 0 / 1 / 11 of 15 |
| Participant Access And Loan Operations | 0 | 5 | about 6/15 | fail | 0 / 1 / 10 |

The correction adds facts to some guides' lists, so fact counts are not directly comparable with T8. The verified findings, against the Section 3 checks:

- **Upgrade governance: fail, confirmed (Critical in architecture and settlement under the correction's 2h-5; at least Major).** Both guides state the single beta key as a fact and leave open only how it "fits" the ban on an unrestricted key. The architecture guide says three records "describe only the final multi-signature administration". They state V1's administration: "V1 retains the Transparent ProxyAdmin controlled by a 2-of-3 Safe through a seven-day timelock" (upgrade-boundary invariant).
- **Stolen default transaction: fail, confirmed (Major).** No guide says that a holder can broadcast the matured transaction but cannot redirect its payout (security record for package theft). The architecture guide's "the lender exports and broadcasts it manually" leaves Q-A9 to inference.
- **Fallback conditions: partial.** The observation and architecture guides state both conditions. The Bitcoin guide never states the production gate, and the settlement guide's "the separate fallback that might publish a secret" states neither (Major in each, confirmed). "Many loans" no longer appears.
- **Vault handoff: fail, confirmed (Major).** The participant guide keeps "not a general signing token" and none of the Vault's checks: the same participant's fresh session, single redemption, independent reload, and never signing bytes supplied only by the product page.
- **Secret disclosure: partial.** The borrower's two confirmations and what each permits are back; the lender's side is missing.
- **Capability status: partial.** The demonstration's status is correct. The participant guide says the Vault payment capability's "delivery is recorded as partial", which quotes its selection record literally but does not say that the design is selected while implementation evidence is still gated (Major per review A; plausible).
- **Equivalent passages: fail.** Each condition above appears in one guide and is missing from another that narrates the same step.
- **Other confirmed Majors:** the activation-pending race that can leave the lender unsecured is missing from the architecture and Bitcoin guides; the loan-terms guide omits the reservation rules and that final-terms approval grants no signing or chain authority; the participant guide omits session limits, the same-loan dual-role ban and operator limits; the Bitcoin guide omits what a forgotten password blocks and the blocked route when no fee estimator is usable.

Under the correction's part 5, T9 fails: it has confirmed contradictions, one unauthorized technical change and several material omitted conditions. **The T9 PDFs are not accepted.**

## T10: independent scoped repeat

T10 received T2's request (architecture plus observation/fallback) with only the skill copy (v5) and paths changed ([report](responses/t10-authoring-report.md)). As in T2, adoption requires every domain guide, so T10 wrote all six and exported the two it was asked for. It said so in its report. It used independent reviewers and a second pass on its fixes, and listed four recorded conflicts and five open points.

- **Validation** is byte-identical to the baseline (1,036 lines). No pinned record changed ([diff](outputs/t10/record-changes.diff)).
- **Visual:** both PDFs (11 and 10 pages) rendered and inspected page by page; pure grayscale; two pages end early where a figure moves whole to the next page.
- **The same record change as T8 and T9.** The settlement domain record's new choice line states the single beta key, then the Safe, with no open-question note. The architecture guide frames the point as "how the single upgrade key ... fits" the ban.
- **Readers** ([scoring](scoring.md#t10-guides-independent-scoped-repeat-with-guidance-v5-architecture-and-observation)): 14 met and 2 partial of 16, equal to T2. Q-A9 partial: no guide states the no-redirect limit.

### Fidelity review

One fresh reviewer received the T9 prompt scoped to the two requested guides ([review](responses/t10-review.md), with a summary alongside). The coordinating session checked each Major finding against the records.

| Guide | Critical | Major | Key facts kept | Verdict |
| --- | --- | --- | --- | --- |
| Architecture | 0 (two arguable) | 6 | about 10/16 | fail |
| Base Observation And Fallback Review | 0 | 1 | 16/16 | pass with a correction note |

- **Confirmed:** "three secrets whose hashes are fixed in the agreement before anything is signed". The terms record says the fallback hash is present only for loans created with the approved capability, and none can have it today. "Some loans" stands where the conditions belong.
- **Confirmed:** the upgrade point takes the beta key as a fact, as in T9, and omits the V1 Safe statement and the dispute about running loans.
- **Confirmed:** the no-redirect limit is missing, and "the lender exports and broadcasts it manually" implies only the lender can broadcast.
- **Plausible:** the runtime-profile table heads the record's target-version column "What it may claim now"; the repayment figure's caption says the lender's Base claim "releases the borrower's Bitcoin", where the claim only makes Y public; and "Its guarantee is …" asserts a guarantee no owner states.
- **Observation guide:** its one Major is an unqualified "activation gate" in the Bitcoin finalization checks, which can be read as the Bitcoin activation or the fallback's production gate; T8's observation guide had the same ambiguity. It keeps all 16 key facts and states both fallback conditions in a callout.

Under the correction's part 5, T10 fails: the architecture guide has confirmed contradictions and omitted conditions, and the settlement domain record has the same unauthorized change as T9's. **The T10 PDFs are not accepted**; the observation PDF alone would pass after its correction note.

## T11: maintenance

T11 received T5's request (a hypothetical 12-hour reservation) on a copy of the T9 package and PDFs, with v5 ([report](responses/t11-maintenance-report.md); [diff against T9](outputs/t11/changes.diff)). The coordinating session verified it:

- **Owners first.** The reservation state record (four mentions), the reservation interface, the offer selection and the settling ticket changed, then the derived decision overview (394 to 395 decisions) and `sources.json` fingerprints. The original user-specified decision keeps its evidence with a note that its 24-hour figure was replaced; a new entry quotes the request and records that it was hypothetical.
- **Guides and PDFs unchanged, correctly.** No T9 guide states the reservation length (review A counts this as a missing loan-terms fact), so no guide sentence depends on it; `--check` reports all seven PDFs current, and they are byte-identical to T9's. T11 asked whether the guides should explain the deadline, rather than adding it unasked.
- **Pinned evidence handled honestly.** The reservation interface is pinned by the Core coordination slice's bounded-delta assessment. Validation reports six new delivery-readiness findings ([delta](outputs/t11/validation-delta.txt)); the assessment's hashes were not refreshed, and T11 explained that a fresh review is needed and which slices are affected. Every other validator matches T9's output.
- **Boundary:** T11 kept its baseline copies in `$S/t11-baseline`, outside the package.

T11 passes its checks. It does not test guide rewriting, because the changed fact was absent from the guides.

## What T9 and T10 show

v5 closed what it named in the following run: no "many loans", the borrower's two confirmations, no invented conflict, both fallback conditions in the observation guide, and no record rewritten to align with another. The run failed on three recurring mechanisms:

1. **A version-wide rule read as a later stage.** Open Questions step 1's example ("a rule for a beta and one for a later release ... can hold together") fits the beta-key case on its surface. T8, T9 and T10 each read the upgrade selection's beta key as a stage the Safe records do not cover, although those records state V1's posture and the deployment state forbids an unrestricted single key. The point then stayed "uncertain", which v5 left with no record line. Migration step 2 placed the selection's rationale as the domain's settled choice, and the record changed side with no note.
2. **Limits stay in the guide that owns them.** The no-redirect limit, the handoff's lack of authority, the activation-pending race and the fallback's production gate each live in a security, interface or scope record. Guides for other domains narrate the same steps without them. The self-review checked facts each guide restates, not limits it leaves out, and the authors' own reviewers did not catch them.
3. **Author variance.** T9's guides are 16% shorter than T8's, and facts T8's author kept were dropped. T10's author wrote about 28,400 words across six guides against T9's 11,800. One run per condition cannot separate guidance effects from this variance.

What remains unproven under v5: that the guidance produces a guide set that passes the key.

## Fifth revision (v6)

Changes tied to T9 and T10, made after their reviews:

| Evidence | Change |
| --- | --- |
| Mechanism 1 | Open Questions step 1: stages hold together only when their owners place them in different stages; a statement about a whole version covers every stage of it, its beta included. An uncertain point is recorded beside its statements in one `Open question:` line naming each side and its record, as a conflict is with `Unresolved source conflict:`. Step 2: a choice an open point reaches is unsettled, in records and guides alike. Migration step 2 checks for an open point before placing any rationale. The domain-record template allows the `Open question:` line |
| Mechanism 2 | Self-review step 3 also lists every limit an owner places on a step (what a stolen artifact cannot do, what a handoff or confirmation does not authorize, the gate a capability waits for) and checks each guide passage narrating that step. Migration step 5's reviewer checks the same |

v6 is the frozen copy `27dac673…8a0f5d1e`; only `system-guide.md`, `guide-writing.md` and the domain-record template differ from v5.

## T12: full authoring after the fifth revision

T12 received T9's request with only the skill copy (v6) and paths changed ([report](responses/t12-authoring-report.md)). It ran its own technical-diff review, guide review and three rechecks of its corrections. It reported four open points as questions, each with any suggested answer only in the report. The coordinating session verified it independently:

- **Validation** is byte-identical to the baseline (1,036 lines), and `--all --combined --check` reports all seven PDFs current.
- **Changed records:** the architecture record, five domain records, one responsibility record (SR-001's pointer to the removed overview), the README, and the System Explorer and `sources.json` fingerprints ([diff](outputs/t12/record-changes.diff)). No pinned record changed. The regenerated visual pages are byte-identical.
- **Open points in the records:** the lender-approval point is an `Open question:` line in the architecture and loan-terms records. The package count, the no-qualifying fee tier and **beta upgrade authority** are `Unresolved source conflict:` lines. How upgrades reach running loans and whether an on-chain pause exists are `Open question:` lines. Every quotation matches its source.
- **Boundary:** as in T9, working notes stayed in `$S/t12-guide-work`, and one of T12's reviewers wrote two `t12-pinned*.txt` files in the scratchpad. Both are outside the package and outside the PDF folder the prompt allowed; this is recorded, not counted.

### Technical-diff review

A fresh reviewer compared every changed technical file with the untouched copy ([review](responses/t12-diff-review.md)). It rated 8 Blockers, 3 Minors and 10 None. **The coordinating session confirmed none of the Blockers**, applying T9's calibration:

- **B3 and B4, upgrade authority and pause, are now None.** The settlement record's removed overview said the contract "retains" the Safe and had "no on-chain pause". Those sentences were the narrative's. INV-020, SR-003, SCOPE-007 and SEL-009 keep their own wording. The migrated record states each point beside its statements and chooses neither, as v6 prescribes. T8–T10 made the opposite change: the record took the beta-key side. That did not recur.
- **B5 and B7, new open points (upgrade reach, whether reservation binds the terms), are None.** v6 asks the author to record the open points it finds. The quotes are exact, and T12 reported both points to the user.
- **B1, B2 and B6 are now Minor.** The narrative's own labels ("stale", "former decision", the "older" approval wording) were dropped. As in T9, they were the narrative's answer to a recorded point. No record holds the "former decision", and T12 reported it.
- **B8 is now Minor.** A process rule ("a narrative or diagram cannot supply a missing approval") has no owner and was dropped. T9 reported the same rule; T12 did not.

T12 is the first full run with no confirmed technical-record Blocker.

### Readers

Six fresh readers received T9's prompts with the PDF path changed ([scoring](scoring.md#t12-guides-full-authoring-with-guidance-v6-six-guides-fresh-authoring-agent-and-fresh-readers)). Results:

- **Shared questions:** 40 met, 8 partial, 0 not met and 0 wrong of 48. T9 had 34/11/3 and T8 had 43/4/1.
- **Q-A9 is met.** The architecture guide says a stolen lender package can be broadcast after it matures, pays only the lender's fixed destination, and works even after the borrower repaid.
- **Q-B9 stays partial.** The Bitcoin guide never says it.

Three of the eight partials are facts the architecture guide states and the reader's domain guide omits.

### Fidelity review

Two fresh reviewers received T9's prompts with the snapshot changed ([review A](responses/t12-review-a.md), [review B](responses/t12-review-b.md), with summaries alongside). The coordinating session checked each Major against the records.

| Guide | Critical | Major (confirmed) | Key facts kept | Verdict | T9 |
| --- | --- | --- | --- | --- | --- |
| Architecture | 0 | 1 | 13/16 | fail | 1 / 2 / about 10 of 16 |
| Loan Terms And Commitments | 0 | 0 | 13/15 | fail (under 90% only) | 0 / 2 / 10 |
| Bitcoin Authorization And Recovery | 0 | 2 (a third reclassified Minor) | 12/16 | fail | 0 / 4 / 10 |
| Base USDC Settlement And Funding | 0 | 2 | 10/15 | fail | 1 / 1 / 10 |
| Base Observation And Fallback Review | 0 | 1 (a second plausible) | 11/16 | fail | 0 / 0 / 9–13 |
| Participant Access And Loan Operations | 0 | 1 | 10/15 | fail | 0 / 5 / about 6 |

Against the Section 3 checks:

- **Upgrade governance: pass.** Every guide that reaches the beta key presents it as an unresolved conflict with both sides, and presents the upgrade-reach and pause tensions as undecided. No Critical anywhere.
- **Stolen default transaction: partial.** The architecture guide states the limit. The Bitcoin guide, whose own security record (SEC-025) owns it, does not, and its "export its package for its own broadcast" implies only the lender can broadcast (Major, confirmed).
- **Fallback conditions: partial.** The architecture and observation guides state both conditions; the observation guide says "eligible loan" before it states the gate. The Bitcoin guide states them later in the same guide. The settlement guide names "the optional Bitcoin fallback" with neither condition, and omits that the refund never waits for it (two Majors, confirmed). "Many loans" does not appear.
- **Vault handoff: partial.** The Vault's checks are back: fresh sign-in, single redemption, and reloading the exact action instead of trusting the page. The participant guide still calls the handoff "not a general signing permission", which the correction rates Major, and no guide says it is not cryptographic authority (confirmed).
- **Secret disclosure: partial.** Both borrower confirmations are present. What the first one permits, and the lender's side, are not (Q-B6 partial).
- **Capability status: pass with a Minor.** The demonstration is "a target, not yet an achieved result" in the architecture guide, and "not yet delivered … blocked" in the participant guide. The payment capability is described by its latest correction's focused checks rather than VA-003's "Planned and unverified".
- **Equivalent passages: fail.** The theft limit, the activation-pending race and the refund's independence each appear in one T12 guide and are missing from another that narrates the same step. The architecture figure says "both participants sign the activation and refund transactions"; the guide's own prose and FLOW-001 give the lender only the activations (Major, confirmed). The observation guide closes its failure list with "In every one of these cases … Bitcoin recovery through S is simply unavailable". This overstates SR-007, which says unspent Bitcoin "can still be reached by other already-authorized routes", and contradicts the guide's own outage and early-disclosure cases (Major, confirmed).

Under the correction's part 5, T12 fails on material omitted conditions and one contradicted limit, although it has no contradiction of an open point and no unauthorized technical change. **The T12 PDFs are not accepted.**

## T13: independent scoped repeat with v6

T13 received T10's request with only the skill copy (v6) and paths changed ([report](responses/t13-authoring-report.md)). As in T2 and T10, adoption requires every domain guide, so T13 wrote all six and exported the two it was asked for.

- **Relay message.** T13 delegated the four other domain guides to helper agents and stopped before they reported. Their final reports reached the coordinating session instead. That session saved each verbatim ([loan terms](responses/t13-relay-loan-terms.md), [settlement](responses/t13-relay-settlement.md), [participant](responses/t13-relay-participant.md), [Bitcoin](responses/t13-relay-bitcoin.md)) and sent T13 one message, recorded in [prompts.md](prompts.md). The message says where the reports are and asks T13 to finish as originally requested. It carries no content guidance. T13's two interim reports, sent before the relay, are kept alongside.
- **Validation** is byte-identical to the baseline, and `--check` reports both PDFs current. No pinned record changed ([diff](outputs/t13/record-changes.diff)).
- **Open points in the records:** the beta key and the on-chain pause are `Open question:` lines in the settlement record. The package count and the fee tier are `Unresolved source conflict:` lines. Eight further `Open question:` lines cover five points:
  - lender approval (four lines);
  - the relay boundary;
  - the activation fee raise;
  - reservation expiry;
  - the browser-extension wallet proof.

  No record carries the upgrade-reach disagreement.

### Technical-diff review

A fresh reviewer rated 7 Blockers, 18 Minors and 6 None ([review](responses/t13-diff-review.md)). The coordinating session reached these verdicts:

- **B6 is confirmed.** A new participant open-question line says SR-012 "requires the browser journey to exercise" external-payer compatibility. SR-012 has no such requirement; the phrase is in SEL-043's proof list.
- **B7 is plausible.** A rationale gained an attribution to three tickets that support the binding but state neither "interoperability and verifiability" nor reproducibility.
- **The other five are Minor**, on T9's calibration:
  - The narrative's own labels were dropped.
  - Two unsupported reasons were dropped, and T13 reported them.
  - A liquidation exclusion was corrected to SCOPE-012, which names it and lists SR-001.
  - TICKET-0089 was added to the side its resolution supports.

No side of any disagreement was rewritten, and the beta-key record change of T8–T10 did not recur.

### Readers and fidelity review

- **Readers** ([scoring](scoring.md#t13-guides-independent-scoped-repeat-with-guidance-v6-architecture-and-observation)): 14 met and 2 partial of 16, the same as T10 and T2. Q-A9 is partial.
- **Fidelity review:** one fresh reviewer received the T10 prompt with the snapshot changed ([review](responses/t13-review.md)).

| Guide | Critical | Major (confirmed) | Key facts kept | Verdict |
| --- | --- | --- | --- | --- |
| Architecture | 0 | 2 | 13/16 | fail |
| Base Observation And Fallback Review | 0 | 0 (one borderline) | 15/16 | pass |

- **Confirmed: the theft limit is missing from the architecture guide.** The guide says only "The lender exports and broadcasts it". SEC-025 says the lender "or any attacker who stole the already signed default package" can broadcast it, and "the package holder may not redirect the fixed payout". The T13 observation guide does state it: "The lender, or anyone holding the exported package, can broadcast it", with a fixed destination.
- **Confirmed: the upgrade-reach disagreement is missing from the architecture guide.** The guide carries the beta key as open, but not the disagreement over whether an upgrade reaches running loans (SEL-009 against INV-020 and STATE-019).
- **Section 3: upgrade governance passes.** The beta key is open in the records and in both guides. The fallback conditions are stated in both guides, and "many loans" does not appear.
- **Observation guide:** its borderline Major is again the unqualified "activation gate", as in T8 and T10.

Under the correction's part 5, T13 fails: the architecture guide omits a required limit and an open disagreement, and one technical record gained a misattributed requirement. **The T13 PDFs are not accepted as a set.** The observation PDF passes the review on its own.

## What T12 and T13 show

**Mechanism 1 is closed in both v6 runs.** In each run:

- no record takes a side;
- the beta key is open in the records and in every guide that reaches it;
- the pause tension is recorded beside its statements. T12 records the upgrade-reach tension the same way; T13 records it nowhere.

T12 has no confirmed technical-record Blocker. T13 has one: a misattributed requirement inside a new open-question line.

**Mechanism 2 persists.** v6 added a self-review step that lists every limit an owner places on a step. Both authors' own reviewers still missed these:

- the theft limit, absent from T12's Bitcoin guide and T13's architecture guide;
- the activation-pending race, absent from T12's Bitcoin guide;
- the refund's independence from the fallback, absent from T12's settlement guide.

Each limit appears in another guide from the same run. SEC-025 is the Bitcoin domain's own security record, so this is not only a failure to propagate a limit across domains. The authors did not cover the security and invariant records their own responsibilities link.

**Two new failure kinds appeared in T12:**

- a figure that contradicts its own guide's prose;
- a summary sentence that overstates its owner's limit.

**Author variance is unchanged.** T12 wrote about 14,500 words (T9: 11,800), and its readers improved to 40/8/0. T13 wrote about 26,600 (T10: 28,400). The three scoped repeats score identically.

What remains unproven under v6:

- that the guidance produces a guide set that passes the key;
- whether more prose guidance can close mechanism 2, or whether it needs a structural check. One such check: each domain guide covers every security and invariant record its responsibilities link.

No further revision was made, because one would have to be rerun before it could be reported.

## Answer-key errors found by reviewers

The coordinating session checked each claimed error against the records. The key files are unchanged; these notes qualify their use.

| Key item | Claim | Check |
| --- | --- | --- |
| Correction part 3, O-4 / Q-O3 | Merging provider disagreement and dual outage into one rule with one five-minute alert is not a defect | **Confirmed.** TICKET-0053's resolution gives exactly that rule: "A simultaneous-source disagreement or dual outage preserves existing finalized projections, alerts operations after five minutes". The only unmerged difference in SEL-014 is that an outage shows fresh Base data as delayed. T10's and T13's Q-O3 partials rest on this point alone. |
| Key 4.6 | A finality waiting time is not an invented number | **Confirmed.** SEL-013 says Base documents L1 finality "as roughly 20 minutes". A guide that gives that figure as Base's documented estimate, not a promise, is faithful. |
| Key 2h-2 | The 12-package sentence is labelled "stale" only by the removed narrative | **Confirmed.** No surviving record calls either side stale, so a guide cannot. |

Reviewers' other notes on the key were recorded but not verified, and change no verdict above. They include:

- SEC-017 and INV-019 as further on-chain pause sources;
- SEL-009's "each loan remains pinned to its originating deployment identity";
- STATE-010 on the no-approval side;
- three tensions T13 recorded that the key lacks.

## Visual verification

Every page of every exported PDF was rendered, laid out on contact sheets, and inspected: T2's two PDFs (20 pages) and T1's seven final PDFs (84 pages) at 1.5× (108 dpi), and T7's and T8's seven PDFs (84 and 82 pages) at 1× (72 dpi). Checks: running headers and footers, "Page N of N", cover and contents with correct page numbers, heading hierarchy, tables with header rules, horizontal step figures with captions, ruled callouts, underlined internal links, and black-and-white output throughout. No clipping, overlap or split figure, table row or callout was found. When a figure does not fit, it moves to the next page whole, leaving the lower part of the previous page blank (T2 observation guide, page 3).

Machine checks on T1's final PDFs:

- every PDF is tagged;
- every PDF has an outline: 25, 10–14 and 75 entries;
- internal links resolve (the combined edition has 85);
- every embedded font is a Type0 subset of the bundled Noto Serif, Noto Sans and Noto Sans Math, with no Type3 fallback and no system font;
- the title and the `source-fingerprint` keyword are set.

T7's PDFs pass the same checks: outlines of 10, 10–11 and 53 entries, 75 internal links in the combined edition, and only Type0 subsets of the bundled fonts.

T8's PDFs pass them too: outlines of 27, 10–12 and 72 entries, 74 internal links in the combined edition, and only Type0 subsets of the bundled fonts. The T8 sheets show the dashed boxes of conditional figure steps, the exits table T8 restructured, and the same whole-figure page breaks (combined pages 8 and 21: architecture page 5 and Bitcoin page 3).

The v5 and v6 runs were rendered and inspected the same way, every page. No page of any of these runs has a pixel whose colour channels differ by more than 8, so the output is greyscale throughout.

| Run | PDFs and pages | Machine checks | Layout notes |
| --- | --- | --- | --- |
| T9 (v5) | 7 PDFs, 71 pages, at 1.2× | tagged; outlines 10 and 51 entries; 75 internal links in the combined edition; Type0 Noto subsets only | combined pages 6 and 11 and architecture page 3 end early before a figure |
| T10 (v5) | 2 PDFs, 21 pages, at 1× | tagged; outlines 13 and 14 entries | architecture page 3 and observation page 5 end early before a figure |
| T12 (v6) | 7 PDFs, 81 pages, at 1× | tagged; outlines 10–12 and 55 entries; 80 internal links in the combined edition; Type0 Noto subsets only | the observation guide's lead-in "The fallback works as follows for an eligible loan:" sits on a page about two-thirds blank because its figure moved whole (page 3); combined page 11 ends with "Six points are open and remain undecided:" and the list starts on page 12; combined page 17 holds one closing sentence |
| T13 (v6) | 2 PDFs, 20 pages, at 1× | tagged; outlines 10 and 12 entries; Type0 Noto subsets only | architecture page 3 ends early before the 8-step figure; the "Not available yet" callout is whole |

No clipping, overlap, or split figure, table row or callout was found. The recurring blemish is a page that ends early: the paragraph introducing a figure is not kept with it, and a list's lead-in can end a page. Both are layout effects with no lost content.

## T23: carried-over prose after the ledger removal

The coverage-ledger workflow and its tooling were removed. Migration now carries each domain narrative over with listed changes instead of rewriting it, and new-guide authoring is a separate path. T23 applied this to a disposable copy that already had T21's reviewed record corrections. The five domain guides are the original narratives with 23 guide-specific changes plus five common ones, all listed. The architecture guide was written new from the T21 draft and corrected after one independent review and one recheck. The final recheck found no Blockers or Majors, and its five Minors were fixed.

A maintenance check changed the claim cutoff from 48 to 36 hours. `--check` reported exactly the affected PDFs as stale, re-export cleared them, and the new validator findings were the predicted delivery pins. No reader scoring was run. [outputs/t23/comparison.md](outputs/t23/comparison.md) gives the before-and-after comparison, and the guides, PDFs, change lists, diffs and reviews sit beside it.

## Limitations

- Each condition ran once. There is no repeated sampling, so differences between runs are observations, not measured reliability. Each full run had a different author, and facts one author kept the next sometimes dropped, so per-question changes mix guidance and author effects. Guide length alone varied from about 11,800 to 28,400 words for the same request.
- Readers and reviewers are models, not people. **No claim about human usability is made.** Reader answers show what a careful model can recover from one PDF.
- One package was tested. The guidance was not exercised on a small or a non-financial system.
- The coordinating session wrote the questions' scoring rules (taken from T0) and the key correction, and it scored T1–T8. One separate scoring agent scored T9, T10, T12 and T13 across four requests with the same rules, and the coordinating session spot-checked it. The coordinating session also decided every reclassification of a reviewer's finding, so scoring judgment is not independent of the evaluator.
- Reviewers found three errors in the key and its correction ([above](#answer-key-errors-found-by-reviewers)). Scores were not recomputed: the affected verdicts are named instead.
- T13 received one relay message after its first prompt; it is recorded verbatim and carried no content guidance. T12 and T13 used helper agents of their own, as T9 and T10 did, and their own reviewers are part of their runs.
- Visual inspection was done by one reviewer on contact sheets. Text-level fidelity was checked through reader answers and reviews, not by proofreading every line.
- The verbatim reports keep the scratchpad paths the agents used; those paths existed only during the evaluation.
- The evidence here quotes the Loan System's design. Remove this directory before sharing the skill outside the owner's projects if that design is confidential.
