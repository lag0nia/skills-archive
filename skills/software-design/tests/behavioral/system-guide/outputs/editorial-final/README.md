# Finished human-facing guides

The primary deliverables are the architecture PDF and five individual domain PDFs in `pdf/`. The maintained sources are in `guide/`. This is a bounded editorial revision of T23, not a new design or migration experiment. T23 and earlier evidence, the live Loan System, the installed skill and the existing ZIP were not edited.

## Documents

| Guide | PDF | Markdown | Pages |
| --- | --- | --- | --- |
| Architecture | [PDF](pdf/bitcoin-backed-usdc-one-loan-system-architecture.pdf) | [Source](guide/architecture.md) | 7 |
| Loan Terms And Commitments | [PDF](pdf/bitcoin-backed-usdc-one-loan-system-domain-loan-terms-and-commitments.pdf) | [Source](guide/domains/loan-terms-and-commitments.md) | 3 |
| Bitcoin Authorization And Recovery | [PDF](pdf/bitcoin-backed-usdc-one-loan-system-domain-bitcoin-authorization-and-recovery.pdf) | [Source](guide/domains/bitcoin-authorization-and-recovery.md) | 3 |
| Base USDC Settlement And Funding | [PDF](pdf/bitcoin-backed-usdc-one-loan-system-domain-base-usdc-settlement-and-funding.pdf) | [Source](guide/domains/base-usdc-settlement-and-funding.md) | 3 |
| Base Observation And Fallback Review | [PDF](pdf/bitcoin-backed-usdc-one-loan-system-domain-base-observation-and-fallback-review.pdf) | [Source](guide/domains/base-observation-and-fallback-review.md) | 3 |
| Participant Access And Loan Operations | [PDF](pdf/bitcoin-backed-usdc-one-loan-system-domain-participant-access-and-loan-operations.pdf) | [Source](guide/domains/participant-access-and-loan-operations.md) | 4 |

## What changed

Architecture fell from 5,947 to 2,511 whitespace-delimited words (58% shorter), and from 14 to 7 pages. The journey figure now introduces the journey, rather than repeating it after the full sequence. The explanation follows purpose, participants/domains, normal journey, trust/failure boundaries, limitations and open questions. Repeated authority/finality/fallback explanations and source-by-source disputes were consolidated. Acceptance exposure, repayment/recovery separation, fixed destinations, key and capital control, fallback eligibility and provider/recovery limitations remain explicit.

The domains preserve their original explanatory structures. Paragraphs and source lists were separated; supplementary link labels were shortened; disagreements moved to Open questions with local qualifications. Base's governance, pause, payment accounts and exclusions are separate paragraphs. Bitcoin's package count, long-stop and fee disagreements no longer interrupt the main explanation. Observation's long-stop disagreement is concise. Participant Operations separates scope from payment-status reconciliation. Loan Terms keeps the agreement sequence readable while qualifying the disputed approval step.

T23's inherited gaps were checked before correction: Base now names activation exposure; Participant Operations gives the handoff's exact authority limit; Bitcoin states plaintext cleanup on cancellation/failure; Loan Terms includes both roles' preparation. The independent reviewer requested first-use definitions of X, Y and D in Base and removal of unlocated-decision history from Bitcoin. Both were corrected and the passages rechecked. Authentication uncertainty is preserved: STATE-003 makes MFA enrollment optional and sensitive-action MFA mandatory for enrolled users, while FLOW-004 lists fresh reauthentication/MFA without that qualification. No universal MFA requirement was chosen.

Domain word counts remain close to T23: Loan Terms 763 → 770; Bitcoin 1,115 → 1,120; Base Settlement 954 → 999; Observation 1,267 → 1,273; Participant Operations 1,274 → 1,312. The small increases reflect definitions, qualifications and navigable section breaks, not regenerated explanations. See [the exact guide diff](changes-from-t23.diff).

## Skill and exporter

The three guide references and two guide templates distinguish architecture, domain depth and exact technical ownership. Migration preserves substantive facts across the package, permits paragraph regrouping and removal of repetition, and uses a bounded independent review. Open questions receive short local qualifications and one explanation per affected guide. Capability summaries avoid ticket and verification history. The templates no longer imply guaranteed outcomes.

The existing renderer omits the automatic Technical records catalogue in both editions. Individual scope notes retain architecture navigation; other linked domains receive a compact closing line. This removes redundant navigation without changing typography, fonts, margins or broad page-break behavior. Combined export, freshness, bundled fonts, text/bookmark checks and atomic publication safeguards remain covered by existing tests. No new authoring infrastructure, source scanner, coverage ledger or approval system was added. SKILL.md required no further change.

## Where detailed meaning remains

No technical record changed in this editorial pass. Details removed from the introduction already have authoritative homes in the T23/original package; the domain guides retain package-relative links to them. Paths below are relative to `technical-design/`.

- Exact reservation, approval, encoding and identity rules: `system-model/domains/loan-terms-and-commitments/responsibilities/sr-001-loan-terms-offer-reservation-and-parameter-binding.md`, interfaces `iface-001` to `iface-003`, states `state-001` and `state-002`, and `behavior/flows/flow-001-origination-preparation-and-qualification.md` under `system-model/`.
- Exact prefund safety windows (67 hours for qualification, 19 for acceptance), funding lifetime and deadlines: `system-model/contracts/states/state-008-prefund-and-origination-attempt.md`, `state-005-borrower-x.md`, `system-model/contracts/interfaces/iface-009-base-transition-api-events-and-errors.md`, and the origination/activation flows. The overview preserves the need for these gates without duplicating their arithmetic.
- Six fee variants, package construction/signing, archive ordering and terminal completeness: the Bitcoin domain guide; `system-model/contracts/interfaces/iface-005-origination-binding-and-package-manifest.md`, `iface-007-bitcoin-fee-estimate-and-tier-selection.md`, and `build/records/constraints/cons-014-durable-signed-exit-package-archive.md`.
- Exact Vault confirmations, local signing and plaintext cleanup: `system-model/contracts/interfaces/iface-004-vault-envelope-and-local-handoff.md`, `iface-014-participant-local-base-calls.md`, and normal repayment/activation flows. Cooperative transaction variants and participant agreement remain in `iface-019-cooperative-settlement-package.md`; the deferred complete operation is in `system-model/contracts/scope/scope-005-cooperative-settlement-operations.md`.
- Fallback gates, secret controls, timing and residual races: the Observation and Bitcoin guides, `sr-007-evidence-conditioned-validation-service-fallback.md` in the Observation responsibility directory, `system-model/contracts/invariants/inv-008-default-timing-and-base-separation.md`, `inv-025-missing-y-residual-lender-risk.md`, `system-model/contracts/security/sec-024-valid-repayment-plus-missing-y-leaves-bitcoin-unsettled.md`, and the conditional/long-stop recovery flows.
- Source-by-source reconciliation of package counts, fees, long-stop, governance, pause and payment status: T23 technical domain and architecture records, preserved through [T23's record diff](../t23/record-changes.diff). The unlocated fee-decision qualification remains there; its uncertainty is not deleted or resolved.
- Payment implementation/verification history, local-demo blockers and delivery claims: `build/records/selections/sel-043-vault-owned-participant-payment-account-and-local-realization.md`, `build/records/verification/va-003-runnable-local-demo-browser-acceptance.md` and existing handoffs. Public boundaries remain in `system-model/contracts/interfaces/iface-022-vault-owned-base-payment-account-and-exact-transfer.md` and `system-model/contracts/scope/scope-013-runtime-profile-claims-and-activation-gates.md`.
- Detailed threat cases, design attribution, topology and exclusions remain in the architecture record and existing security/scope/selection records. The introduction retains the major consequences instead of repeating their inventories.

## Verification

- Full existing suite: **582 tests, 575 passed, 0 failed, 7 skipped**. All System Guide PDF, combined-edition and export-safety tests ran. Skips are six separately gated Explorer/graph/UI browser tests and the cross-skill delivery integration test; they are not PDF skips. See [test output](tests.txt).
- Guide parsing, links, canonical domain/responsibility names and rendered text checks passed through export. Structure validation has no new findings against T23; both retain the same unrelated runtime/UI evidence failures, detailed in [validation.txt](validation.txt).
- Freshness reports all six PDFs current. The export manifest records hashes, page counts and commands.
- All **23 final pages** were rendered with Poppler and visually inspected: architecture 1–7; Loan Terms 1–3; Bitcoin 1–3; Base Settlement 1–3; Observation 1–3; Participant Operations 1–4. Headings, table, journey figure, spacing, wrapping, running headers and footers are legible; no clipped content or navigation-only final page remains. Text size and margins are unchanged.
- [One fresh independent review](review.md) found no material factual regression. Its two editorial findings were corrected and narrowly rechecked. No repeated authoring experiment was run.
- The pre-existing tracked diff is byte-identical to its start-of-task snapshot. Changes from this pass are restricted to the previously untracked guide references/templates, renderer/tests and this new example directory.

## Remaining design questions

The guides leave final lender approval, offer/reservation identity placement, twelve versus eighteen terminal packages, long-stop availability, exhausted fee tiers, Base upgrade governance, on-chain pause meaning, MFA scope and payment capability status unresolved. Neither the prose nor the PDFs chooses a design answer. The participant-transfer scope gap already reported by T23 remains a technical reconciliation question; this pass does not silently change its Build Unit boundary.

## Maintaining and regenerating this example

As with T23, `guide/` is a maintained source overlay for the Loan System design package, not a standalone copy of its technical records. Technical Markdown links resolve when placed at the package's `guide/` path; they are intentionally retained rather than rewritten to this machine's live project. This directory does not duplicate the 46 MB technical/UI package.

For regeneration, use a disposable copy of the T23 migrated package and replace only its `guide/` contents with this directory's sources. Alternatively, reconstruct that baseline from the unchanged original package and T23's `record-changes.diff`, then add this guide overlay. Run the existing `scripts/export-system-guide.mjs` with `--root <disposable-package> --out <this-directory>/pdf --all --date 2026-10-15`. The output must be outside the disposable package. Add `--check` for freshness; `--combined` remains optional. Never apply these steps to the live Loan System without separate authorization.
