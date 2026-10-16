## System Guide added; PDFs exported

I used only the frozen skill copy. Package root: `/private/tmp/claude-501/-Users-alanguerrero-Documents-ai-prompts/b72a9647-f430-4577-b73d-46cf594be5b3/scratchpad/eval/t8/bitrise21/loan-system/design/technical-design`. The only thing written outside it is the PDF folder. I deleted my temporary scratch folder (`scratchpad/t8-work`).

### PDFs in `/private/tmp/claude-501/-Users-alanguerrero-Documents-ai-prompts/b72a9647-f430-4577-b73d-46cf594be5b3/scratchpad/eval/t8-pdf`

| Guide | File | Pages |
|---|---|---|
| Architecture | `bitcoin-backed-usdc-one-loan-system-architecture.pdf` | 11 |
| Loan Terms And Commitments | `bitcoin-backed-usdc-one-loan-system-loan-terms-and-commitments.pdf` | 5 |
| Bitcoin Authorization And Recovery | `bitcoin-backed-usdc-one-loan-system-bitcoin-authorization-and-recovery.pdf` | 7 |
| Base USDC Settlement And Funding | `bitcoin-backed-usdc-one-loan-system-base-usdc-settlement-and-funding.pdf` | 6 |
| Base Observation And Fallback Review | `bitcoin-backed-usdc-one-loan-system-base-observation-and-fallback-review.pdf` | 6 |
| Participant Access And Loan Operations | `bitcoin-backed-usdc-one-loan-system-participant-access-and-loan-operations.pdf` | 6 |
| Combined guide | `bitcoin-backed-usdc-one-loan-system-system-guide.pdf` | 41 |

The exporter also wrote its own record of the export, `system-guide-export.json`, in the same folder.

### What changed in the package

- **New guides:**
  - `guide/architecture.md`, explaining the whole system.
  - Five domain guides in `guide/domains/`: `loan-terms-and-commitments.md`, `bitcoin-authorization-and-recovery.md`, `base-usdc-settlement-and-funding.md`, `base-observation-and-fallback-review.md` and `participant-access-and-loan-operations.md`.
- **`system-model/architecture.md`:**
  - It now declares that the package uses a System Guide (`system_guide: adopted`).
  - The old `## System Overview` narrative is replaced by one line linking the architecture guide.
  - The approval-wording conflict that narrative held is kept as an open note beside the statements it affects.
- **The five `system-model/domains/*/domain.md` records:**
  - Each `## Domain Overview` narrative is replaced by one line linking its guide.
  - The narrative's reasons and conflict notes moved into a new `## Choices And Rationale` section.
  - Its links to scope records moved into `Excludes` and `Cross-Domain Contracts`.
  - I also removed the empty `## Agent-First Canonical Reference` heading: it had no content left, the domain template doesn't have it, and nothing links to it.
  - In the Base USDC Settlement record, the upgrade-governance choice now says what the beta-key selection record (SEL-009) says: a single upgrade key during local/test use and the short mainnet beta, then a 2-of-3 multisig with a seven-day timelock.
- **SR-001 record:** one sentence pointed to the deleted Domain Overview; it now points to the Loan Terms guide.
- **`README.md`:** links the System Guide under "Understand The System".
- **`visuals/assets/explorer.json` and `sources.json`:** only stored file fingerprints changed. No explorer content refers to the edited sections, and the regenerated HTML is byte-identical.

### Questions I would have asked you

1. **Does the lender approve twice?** The system-level wording, the offer contract (IFACE-003), SCOPE-011 and SEL-012 say publishing the offer is the lender's standing acceptance and no second lender approval is needed. SR-001, STATE-002 and FLOW-001 require both participants to approve the exact final terms. STATE-001 treats final-terms approval as different from commercial approval, which may reconcile the two. Your recorded remark ("if someone clicks and accepts, it automatically accepts") leaves me unsure, so every guide marks this point as open.
2. **What happens when no signed fee variant is high enough?** The recorded former decision and the fee-selection action description say: pick the 200 sat/vB variant, record that a fee-bump is needed, and alert. The fee-selection interface says to return a fail-closed result instead. Which one is intended?
3. **Should the stale sentence in SR-002 be repaired?** Its Owns section still says the post-activation exit set is 12 packages. FLOW-002, FLOW-010, INV-026 and CONS-005 say 18. The guides use 18 and flag the discrepancy.
4. **Do INV-020, SR-003, STATE-019 and SCOPE-007 mean to describe the state after the beta?** They say V1 "retains" a 2-of-3 multisig, while SEL-009 adds a single-key beta first. I read them as compatible, so I did not record a conflict. If they are meant to cover the beta too, it is a real conflict.
5. **Was it acceptable to remove the empty Agent-First heading?**

### Not resolved

- **Open conflicts:** questions 1–3 above. They are recorded in the architecture and domain records and stated as open in every guide that reaches those points; none of them is settled.
- **Validation failures that already existed:** structure, build-design, delivery-readiness, UI/UX and assurance fail exactly as before I started. The causes are:
  - the role-split UI prototype and its missing runtime evidence;
  - delivery-readiness evidence that lives outside the package;
  - the assurance check needs a `--repository` argument.
- **SCOPE-014 and SCOPE-015:** the architecture record's `scope_boundaries` list leaves them out. I did not change it.
- **Records that disagree:**
  - STATE-019 lists "pause/operational roles", but SEL-009 says there is no on-chain pause. The guides follow SEL-009.
  - The Bitcoin and Observation records list SCOPE-001 and SCOPE-002 under Excludes, but those scope records say "deferred". The guides label them deferred.
- **PDF layout:** some pages end early with blank space because figures do not split across pages (architecture page 7, Bitcoin page 21). The text is unaffected.

### What I checked

- **Validators:** after every edit, all 13 package checks give the same results as before I started. The only changed output is the inventory-leads report, which dropped from 98 to 87 leads because the removed narrative text was the source of those leads. No new leads appeared.
- **Guides:** the skill's guide validator reports no errors, and all six guides parse under its Markdown rules.
- **Links:** every link and section anchor in the records, guides and README resolves.
- **Records other files depend on:** I checked records pinned by `repo-002-core-coordination-scope.json`; none of them were edited. Explorer content is unchanged.
- **Generated views:** the visuals and the decision overview are both current.
- **Export:** the export's `--check` passes.
- **Visual inspection:** I looked at every page of the combined PDF. I restructured the Bitcoin "exits from escrow" table so words no longer break inside its columns.
- **Fact-checking:** three independent read-only reviews compared every guide with its source records. I verified each finding against those records before applying it. The main corrections:
  - Statements that implied the lender-approval question was settled are now neutral.
  - Fee-bumps are described as operator-approved, not automatic.
  - Activation now says it can switch to a higher signed fee variant only before a mempool accepts it.
  - The company-run funding opener is shown as a trusted link from Bitcoin to Base.
  - The upgrade-governance sequence and its effect on existing loans are stated.
  - The custody claim carries its upgrade-governance condition.
  - Cloudflare hosting is limited to the application components.
  - Added conditions:
    - the timing that opens funding;
    - when the acceptance clock starts;
    - reservation expiry versus cancellation;
    - the manual-review rules;
    - refunds "at or after C";
    - the local demo requiring regtest;
    - the 180-second payment escalation;
    - the email confirmation needed to replace a Vault password.
  - Added facts a reader needs:
    - the after-repayment default risk, with SEC-025 counting it among the most important residual risks;
    - the accepted gap between activation and exit signing;
    - the paused Vault preparation work;
    - the backup-outage pause;
    - that the seed phrase cannot rebuild X or Y;
    - the stipend ceiling;
    - the provider alert times;
    - deferred payment profiles;
    - the local demo's blocked delivery state.
  - I added L1 finality's meaning and the open fee rule to the architecture guide.
