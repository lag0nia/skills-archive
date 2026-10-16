# Answer Key: Reader Guides for the Bitcoin-Backed USDC One-Loan System

## 0. Scope and conventions

- **Source root (read-only):** `/private/tmp/claude-501/-Users-alanguerrero-Documents-ai-prompts/b72a9647-f430-4577-b73d-46cf594be5b3/scratchpad/eval/t0/bitrise21/loan-system/design/technical-design`. Every path below is relative to this root.
- **Guides under evaluation:** one architecture guide plus five domain guides: Loan Terms And Commitments, Bitcoin Authorization And Recovery, Base USDC Settlement And Funding, Base Observation And Fallback Review, and Participant Access And Loan Operations.
- **Owners:** facts come from the canonical system-model records (architecture, domain, responsibility, flow, state, interface, invariant, security, and scope records). Build records, tickets, handoffs, and the decision overview are cited only where they record status, attribution, or a conflict. The root README says those workflow records do not define system behavior.
- **Section headings** are quoted exactly as they appear in the owning file.
- **Shorthand used only in this key:** D = repayment deadline; C = claim cutoff = D + 172,800 s; T = lender-route maturity = D + 259,200 s; B = borrower long-stop maturity = D + 864,000 s. X = the borrower's secret, Y = the lender's secret, S = the independent fallback service's per-loan secret, H(·) = its hash commitment, ECVS = evidence-conditioned validation service. Guides do not need these symbols, but if they use different words they must keep the same meaning and values.
- **Conflicts:** where the owners conflict or are silent, this key reports what each source says and does not resolve it (Section 2h).

---

## 1. Must-preserve facts by guide

Each entry gives a one-sentence fact, the owning file and section, and the misunderstanding it prevents.

### 1.1 Architecture guide

**A-1.** The five domains are kept separate so that each can report progress without gaining another's authority: signing in is not unlocking a Vault, an accepted command is not a chain fact, and a Base refund is not a confirmed Bitcoin recovery.
- Owner: `system-model/architecture.md`, "## System Overview"
- Prevents: reading the domains as layers of one authority, or treating a progress signal in one domain as an outcome in another.

**A-2.** V1 joins exactly one borrower and one selected lender per loan through a browsable lender-published one-loan offer. It is not public or multi-lender matching, pooled capital, product custody, or automatic deployment of lender capital, and it never liquidates BTC.
- Owners: `system-model/architecture.md`, "## Purpose And Binding"; `system-model/contracts/scope/scope-011-public-multi-lender-pooling-custody-and-automatic-capital.md`, "## Boundary"; `system-model/contracts/invariants/inv-011-selected-lender-capital-control.md`, "## Rule"
- Prevents: describing the product as a marketplace, lending pool, custodian, or liquidator.

**A-3.** Every domain identifies the loan by one canonical terms value and its hash, and a separate deployment manifest binds the environment facts. Neither commitment is a wallet, signing key, source of funds, chain-state fact, or lifecycle action.
- Owner: `system-model/architecture.md`, "## Purpose And Binding"
- Prevents: treating the loan identifier or hash as permission to spend, or as proof that something happened.

**A-4.** Bitcoin consensus owns the prefund and escrow outputs, witness validity, signatures, timelocks, broadcasts, confirmations, reorgs, and the one final spend. Base records cannot spend or confirm Bitcoin.
- Owner: `system-model/architecture.md`, "## Authority And Sources Of Truth"
- Prevents: claims that the Base contract, the application, or an operator "releases" Bitcoin.

**A-5.** The Base contracts own funding, acceptance, repayment, claim, fixed-recipient refund, deadlines, and public disclosure of X and Y. Raw USDC transfers, vault balances, transaction submission, and application status stay provisional until the named contract event reaches the approved finality boundary.
- Owner: `system-model/architecture.md`, "## Authority And Sources Of Truth"
- Prevents: reporting a balance or a "submitted" transaction as funded or repaid.

**A-6.** Only participant Vaults hold passwords, seeds, per-loan keys, payment-account keys, and unrevealed X or Y. Product authentication permits only ciphertext access; it is not decryption, signing, secret recovery, or chain authority.
- Owner: `system-model/architecture.md`, "## Authority And Sources Of Truth"
- Prevents: equating login with wallet or signing access.

**A-7.** The organization has no collateral-script key. Its Bitcoin fee wallet may only fund a separate fee-bump child without changing the signed parent, and its Base fee wallet may only submit permissionless fixed-effect calls, without gaining recipient, capital, debt, secret, or contract authority.
- Owner: `system-model/architecture.md`, "## Authority And Sources Of Truth"
- Prevents: assuming the company can recover, redirect, or seize collateral, or set recipients.

**A-8.** A normal repayment lets the lender disclose Y. If the lender stays silent, there can be a Base refund, and only for an activated, precommitted fallback loan is there conditional S recovery. Either Bitcoin path becomes final only when the expected spend confirms, and the fallback's production availability remains gated.
- Owner: `system-model/architecture.md`, "## System Overview" and "## Authority And Sources Of Truth" (bullet on conditional SR-007)
- Prevents: presenting the fallback as universally available, or Bitcoin recovery as complete at refund or publication.

**A-9.** All V1 production application artifacts run on Cloudflare in one shared provider failure domain. An outage therefore suspends the product, Vault, API/D1, Base observation, Bitcoin automation, and operator surface together. The chains keep running, no new consequential command is accepted, and when the provider returns, Base and Bitcoin are reconciled before jobs resume.
- Owner: `system-model/architecture.md`, "## V1 Operating Topology And Availability Boundary"
- Prevents: assuming that separate repositories or origins give independent availability.

**A-10.** V1 has no live cross-provider fallback, no active-active deployment, no guaranteed cold redeployment, and no stated RTO/RPO. Periodic off-Cloudflare package backups protect recoverability of data; they are not a running-service fallback.
- Owner: `system-model/architecture.md`, "## V1 Operating Topology And Availability Boundary"
- Prevents: availability promises that the design does not make.

**A-11.** This blueprint's required target outcome is a developer-operated local demonstration in which two isolated actors use the real public seams to complete one loan through normal repayment and confirmed borrower recovery. It makes no testnet-deployment, mainnet-deployment, or activated-production claim.
- Owners: `system-model/architecture.md`, "## Target Outcome And Runtime Profiles"; `system-model/contracts/scope/scope-013-runtime-profile-claims-and-activation-gates.md`, "## Boundary" and "## Claim Ladder"
- Prevents: production-readiness or deployment claims.

**A-12.** Demo identities, tokens, wallets, balances, contracts, fixtures, and provider substitutes exist only inside the explicit local-demo composition. A missing or conflicting local predicate, a non-loopback bind, a non-regtest Bitcoin network, a non-local Base chain, a public credential, or a public deployment manifest fails closed before any provisioning.
- Owner: `system-model/architecture.md`, "## Target Outcome And Runtime Profiles"
- Prevents: assuming demo shortcuts could leak into, or substitute for, a public profile.

**A-13.** The architecture states that the approval-wording discrepancy and the fee and package-count discrepancies found during migration remain unresolved source issues, and that this revision does not choose new behavior.
- Owner: `system-model/architecture.md`, "## System Overview" (third paragraph)
- Prevents: a guide silently picking one side as if it were settled.

**A-14.** No threat may be summarized by a severity word alone. A component is not secure merely because each credential is insufficient in isolation when a realistic combination of capabilities is sufficient. Each approved combination attack has one primary security owner.
- Owner: `system-model/architecture.md`, "## Security Change Control" and "### Combination-Attack Ownership"
- Prevents: "low/high risk" summaries and ignoring combination attacks such as a shared frontend capturing both participants.

**A-15.** The workspace keeps accepted, durable local completion, submitted, observed, finalized, broadcast, and confirmation-qualified states distinct instead of reporting one generic completion.
- Owners: `system-model/architecture.md`, "## Cross-Domain Boundaries"; `system-model/contracts/states/state-016-workspace-command-outbox-and-projection.md`, "## Observation And Finality"
- Prevents: a single "done" status that hides which external fact is still missing.

### 1.2 Loan Terms And Commitments guide

**L-1.** A matching loan identifier proves which agreement an artifact describes. It does not authorize a spend or establish a chain outcome.
- Owner: `system-model/domains/loan-terms-and-commitments/domain.md`, "## Domain Overview"
- Prevents: treating identity binding as authorization.

**L-2.** The per-loan agreement data (versioned terms and their hash) is separate from the environment-wide deployment manifest (chain, contracts, asset, Bitcoin network, timing policy, upgrade authority). The manifest excludes URLs, credentials, application configuration, dynamic attempts, and secrets.
- Owners: `system-model/domains/loan-terms-and-commitments/domain.md`, "## Domain Overview"; `.../responsibilities/sr-001-loan-terms-offer-reservation-and-parameter-binding.md`, "## Owns"
- Prevents: mixing loan facts with environment facts, or thinking the manifest carries credentials.

**L-3.** Publishing a firm one-loan offer is the lender's standing approval of the proposed commercial values only. One successful borrower selection atomically creates the reservation, a stable random loan identity, and a durable commercial draft, but neither publication nor reservation approves or commits the final bound terms.
- Owners: `.../loan-terms-and-commitments/responsibilities/sr-001-...md`, "## Owns"; `system-model/behavior/flows/flow-001-origination-preparation-and-qualification.md`, "## Ordered Transitions" (step 1)
- Prevents: treating a reservation as the final agreement.

**L-4.** A concurrent or stale selection loses without creating a second reservation. A reservation lasts 24 hours. If no valid prefund arrives after terms are committed, the offer is cancelled and reopened, with one borrower infraction, a same-offer block, and notices to both parties. A valid prefund still unconfirmed after 72 hours goes to manual review.
- Owners: `system-model/contracts/interfaces/iface-003-one-loan-offer-reservation-and-loan-binding.md`, "## Payload Or Artifact" and "## Failure Meaning"; `system-model/contracts/states/state-001-one-loan-offer-and-reservation.md`, "## Transitions"
- Prevents: assuming double reservations, unlimited holds, or automatic cancellation of a valid stuck prefund.

**L-5.** After reservation, each role's Vault returns an acknowledged public allocation result and then a preparation result (confirmed destinations plus that role's secret commitment). Core then assembles one complete candidate version and hash, each role explicitly approves that same candidate, and only the atomic second matching approval commits the agreement, exactly once.
- Owners: `sr-001-...md`, "## Owns"; `system-model/contracts/states/state-002-canonical-loan-terms.md`, "## Transitions"; `flow-001-...md`, "## Ordered Transitions" (steps 2–4)
- Prevents: skipping the allocation and preparation stages, or believing one party or Core can commit alone.

**L-6.** Changing any hashed field creates a new candidate and invalidates every earlier approval. Identical duplicate approvals and commitment retries return the same result, and concurrent final approvals commit at most once. Stale, wrong-role, wrong-loan, mismatched, expired, or cancelled approvals are rejected.
- Owners: `sr-001-...md`, "## Failure And Recovery"; `state-002-...md`, "## Observation And Finality"
- Prevents: believing approvals survive edits, or that a retry can create a second agreement.

**L-7.** Approving the final terms through the authenticated application grants no Vault custody, signing, funding, or chain authority. The lender keeps a separate capital-funding decision even after the agreement is committed.
- Owners: `system-model/domains/participant-access-and-loan-operations/responsibilities/sr-010-participant-identity-and-role-access.md`, "## Owns" (bullet on `approve_final_loan_terms`); `loan-terms-and-commitments/domain.md`, "### Choices And Scope"
- Prevents: treating terms approval as a signature or as a funding commitment.

**L-8.** Committing the terms does not consume the reservation. The offer becomes "consumed" only when the loan reaches finalized borrower acceptance on Base.
- Owner: `state-001-...md`, "## States", "## Transitions", and "## Invalid Transitions"
- Prevents: treating commitment as completion of origination.

**L-9.** A per-loan Bitcoin protocol key, the Base protocol account, the external payout destinations, and a Vault payment account are distinct identities. A payment account becomes a recipient only if it is selected for an existing recipient field of a fresh loan, through normal role authorization and fresh approvals. Historical terms are never rewritten.
- Owners: `loan-terms-and-commitments/domain.md`, "### Boundaries And Exceptions"; `system-model/contracts/invariants/inv-023-key-destination-and-refund-separation.md`, "## Rule"
- Prevents: "the wallet you pay from becomes your payout address," or silent recipient changes.

**L-10.** Every consumer rejects an unsupported encoding, a changed fingerprint, the wrong chain, contract, asset, or network, a mixed environment, the wrong key or destination, or any dependent artifact that does not bind exactly.
- Owners: `loan-terms-and-commitments/domain.md`, "### Boundaries And Exceptions"; `sr-001-...md`, "## Owns"; `system-model/contracts/invariants/inv-001-canonical-loan-binding.md`, "## Rule"
- Prevents: assuming loose matching is tolerated.

**L-11.** A pre-activation amendment produces a later version with fresh dependent artifacts and two fresh approvals. A loan cannot be superseded after activation. Cancellation is terminal for that reservation, and reopening requires a fresh loan identity.
- Owners: `loan-terms-and-commitments/domain.md`, "### Boundaries And Exceptions"; `sr-001-...md`, "## Failure And Recovery"; `state-002-...md`, "## Transitions" and "## Invalid Transitions"
- Prevents: "edit an active loan," or reviving old approvals or signatures after a retry.

**L-12.** The fallback-secret commitment H(S) appears in the terms only for loans created with the approved capability.
- Owner: `sr-001-...md`, "## Owns"
- Prevents: implying that every loan carries the fallback.

**L-13.** The architecture says publication is standing acceptance and that reservation creates the canonical loan "without a second lender approval." The detailed records require both roles to explicitly approve the final candidate. The domain records this as a discrepancy without deciding new behavior.
- Owners: `loan-terms-and-commitments/domain.md`, "### One Responsibility, Shared Meaning"; `system-model/architecture.md`, "## Purpose And Binding"
- Prevents: presenting either wording as the settled rule (see 2h-1).

**L-14.** Public or multi-lender matching, pooled capital, product custody, automatic capital deployment, and liquidation are excluded. A narrative or diagram cannot supply a missing approval.
- Owners: `loan-terms-and-commitments/domain.md`, "### Choices And Scope"; `scope-011-...md`, "## Boundary"
- Prevents: scope inflation, and guides "filling in" decisions.

**L-15.** Product authentication, Vault decryption, Bitcoin construction, Base execution, observation, and workflow coordination stay with their own domains. An acceptance snapshot or workspace copy cannot become a second authority for what the agreement means.
- Owners: `loan-terms-and-commitments/domain.md`, "### Boundaries And Exceptions" and "### Choices And Scope"; `sr-001-...md`, "## Must Not Own"
- Prevents: a UI copy of the terms being treated as the authoritative terms.

### 1.3 Bitcoin Authorization And Recovery guide

**B-1.** A prefund stages the borrower's Bitcoin before activation and is a different object from the later escrow output. A signed package is evidence of exact prior authorization, not permission for the application to choose a new destination. Bitcoin consensus decides spendability.
- Owners: `system-model/domains/bitcoin-authorization-and-recovery/domain.md`, "## Domain Overview"; `system-model/contracts/invariants/inv-003-prefund-escrow-separation.md`, "## Rule"
- Prevents: "sent BTC = collateral," or "the platform can retarget a payout."

**B-2.** Each secret has one role:
- X enables only acceptance and the fixed activation.
- Y enables only the fixed claim and normal borrower recovery.
- The optional independent S enables only that same recovery, after the finalized refund.
- The long-stop needs neither secret.
None of them gives the organization a collateral key.
- Owners: `bitcoin-authorization-and-recovery/domain.md`, "## Domain Overview"; `system-model/contracts/invariants/inv-004-secret-role-separation.md`, "## Rule"
- Prevents: treating the secrets as interchangeable or as keys.

**B-3.** An exactly observed prefund, even at zero confirmations, permits initial construction and setup signing once the terms are committed and both preparations are acknowledged. Six unchanged confirmations are still required for funding-window opening, for the borrower-acceptance gate, and for reliance.
- Owners: `bitcoin-authorization-and-recovery/domain.md`, "### Package Lifecycle And Recovery"; `system-model/contracts/invariants/inv-015-zero-confirmation-boundary.md`, "## Rule"; `.../responsibilities/sr-002-bitcoin-prefund-escrow-and-package-construction.md`, "## Owns"
- Prevents: treating a zero-confirmation prefund as qualified collateral, or believing signing must wait for confirmations.

**B-4.** The initial phase has six activation and six prefund-refund candidates at 10, 20, 50, 100, 150, and 200 sat/vB. The borrower signs all twelve; the lender signs the six activation candidates.
- Owners: `sr-002-...md`, "## Owns"; `flow-001-...md`, "## Ordered Transitions" (steps 6–7)
- Prevents: wrong package inventory, or "the lender signs refunds."

**B-5.** Terminal packages are built only for the activation candidate that actually reaches six confirmations: six borrower-recovery, six lender-recovery, and six borrower long-stop variants, 18 in total. The borrower signs twelve of them and the lender six. One stale SR-002 sentence still says "12-package signed terminal phase"; this is a documented, unrepaired source conflict.
- Owners: `bitcoin-authorization-and-recovery/domain.md`, "### Package Lifecycle And Recovery"; `system-model/behavior/flows/flow-002-activation-completion-and-active-entry.md`, "## Ordered Transitions" (steps 7–9); `system-model/contracts/invariants/inv-026-durable-signed-exit-package-availability.md`, "## Rule"; the stale sentence is in `sr-002-...md`, "## Owns" ("Phase-specific archive readiness" bullet)
- Prevents: terminal packages built for parents that never confirmed, a wrong count, or a silently "corrected" source (see 2h-2).

**B-6.** After the borrower's acceptance finalizes on Base, the loan is "activation pending," not active, because the Base payment and the Bitcoin activation are not atomic. If the prefund refund confirms first, the borrower holds both the principal and the BTC, and the lender is unsecured.
- Owners: `system-model/contracts/invariants/inv-018-activation-pending-recovery.md`, "## Rule"; `system-model/contracts/security/sec-023-base-pays-principal-but-bitcoin-activation-does-not-confirm.md`, "### SEC-023.THREAT-001 — Base pays principal but Bitcoin activation does not confirm" and "## Honest Capability Claim"; `system-model/contracts/states/state-015-bitcoin-escrow-and-terminal-outcome.md`, "## States"
- Prevents: claims of atomic swap or atomic activation, and hidden lender risk.

**B-7.** Signing happens in a fixed order: unsigned construction, an immutable signing batch, participant Vault signing, Core validation and complete archive writes, and only then the receipt, which can never be an input to the signing that produces it. If terminal signing or archiving is incomplete after activation, the loan stays explicitly "terminal-signing-pending," and the principal and escrow cannot be reversed.
- Owners: `bitcoin-authorization-and-recovery/domain.md`, "### Package Lifecycle And Recovery"; `sr-002-...md`, "## Owns" and "## Failure And Recovery"; `flow-002-...md`, "## Failure And Reroute"
- Prevents: "receipt before signing," or presenting an incomplete terminal set as package-ready or as reversible.

**B-8.** A changed or lost parent recursively invalidates every descendant and signature and requires fresh signing. A reorg of the same unchanged parent keeps the bytes and signatures but pauses qualification.
- Owners: `system-model/contracts/invariants/inv-016-parent-mutation-and-reorg.md`, "## Rule"; `bitcoin-authorization-and-recovery/domain.md`, "### Package Lifecycle And Recovery"
- Prevents: reusing stale signatures, or discarding valid ones after a harmless reorg.

**B-9.** After Y is public at Base L1 finality, or a valid S is published for an activated commitment, the platform completes the same borrower-signed recovery transaction without changing its output, signature, transaction ID, or package entry. Recovery is final only when that spend confirms.
- Owners: `bitcoin-authorization-and-recovery/domain.md`, "### Package Lifecycle And Recovery"; `system-model/contracts/interfaces/iface-020-finalized-public-secret-to-fixed-bitcoin-action.md`, "## Boundary" and "## Preconditions And Validation"; `system-model/behavior/flows/flow-004-normal-repayment-close.md`, "## Ordered Transitions" (steps 5–6)
- Prevents: "the borrower signs again," "the fallback is a second transaction," or "recovered at broadcast."

**B-10.** The lender's fixed route becomes valid only after Bitcoin median-time-past passes D + 259,200 s. The borrower long-stop becomes valid only after D + 864,000 s and needs no secret. The lender route never expires, so both may compete after the later time. Only the first confirmed spend wins, and no Base repayment or refund revokes these signatures.
- Owners: `system-model/contracts/invariants/inv-008-default-timing-and-base-separation.md`, "## Rule"; `system-model/behavior/flows/flow-010-borrower-long-stop-recovery.md`, "## Failure And Reroute"; `system-model/behavior/flows/flow-007-timelocked-lender-spend.md`, "## Preconditions"
- Prevents: "the long-stop cancels the lender route," "Base repayment blocks default," and wall-clock maturity.

**B-11.** The lender's default package is used only through manual export and external broadcast, after its timelock is valid, and only to the committed lender destination. The organization does not schedule, finalize, or broadcast it.
- Owners: `.../responsibilities/sr-009-lender-bitcoin-authorization-and-recovery.md`, "## Owns"; `flow-007-...md`, "## Ordered Transitions" (step 3); `system-model/contracts/scope/scope-001-automatic-lender-default-broadcast.md`, "## Boundary"
- Prevents: claims of automatic default enforcement by the company.

**B-12.** Disclosing X or Y on Base takes two confirmations:
1. The first reviews nonsecret facts and authorizes only local preparation.
2. An isolated worker then minimally unlocks the secret and key and freezes the exact transaction.
3. The second confirmation, bound to those exact bytes, authorizes signing and submission.
Any failure or cancellation clears the plaintext.
- Owners: `.../responsibilities/sr-004-borrower-bitcoin-authorization-and-recovery.md`, "## Owns" and "## Failure And Recovery"; `sr-009-...md`, "## Owns"; `system-model/contracts/interfaces/iface-004-vault-envelope-and-local-handoff.md`, "### One-Time Cross-Origin Handoff"
- Prevents: "one click signs," or "the first confirmation is consent to sign."

**B-13.** Fees:
- Fees come only from the six pre-signed tiers.
- The selector picks the lowest tier strictly above 1.25 times a fresh, normalized one-block estimate, using integer arithmetic.
- If every estimator is unusable, the route is blocked; manual continuation may record only an existing signed tier.
- Extra fee comes only from a separately approved manual fee-bump child funded by the organization's fee wallet.
- What happens when no tier qualifies is an unresolved source conflict.
- Owners: `system-model/contracts/interfaces/iface-007-bitcoin-fee-estimate-and-tier-selection.md`, "## Payload Or Artifact", "### ACT-002 — Select one eligible signed parent tier", and "## Preconditions And Validation"; `system-model/contracts/invariants/inv-010-fixed-fee-candidate-families.md`, "## Rule"; `bitcoin-authorization-and-recovery/domain.md`, "### Fees, Failures, And Recorded Choices"
- Prevents: "the platform rebuilds the transaction at a better fee," fee-wallet authority over participants, or a settled-sounding no-tier rule (see 2h-3).

**B-14.** Cooperative settlement needs fresh agreement and fresh signatures from both participants' existing loan keys over newly constructed variants. It cannot reuse setup, default, or recovery signatures, and its product operation and Base accounting remain deferred.
- Owners: `bitcoin-authorization-and-recovery/domain.md`, "### Package Lifecycle And Recovery"; `system-model/behavior/flows/flow-009-cooperative-settlement.md`, "## Ordered Transitions"; `system-model/contracts/scope/scope-005-cooperative-settlement-operations.md`, "## Boundary"
- Prevents: presenting cooperative settlement as a finished product feature, or as possible with one party's consent.

**B-15.** V1 has no recovery for a forgotten vault password. Password loss blocks secret disclosure, new signing, and cooperative settlement, while unchanged, fully signed packages stay usable. The lender's post-confirmation signing window is an explicit residual risk.
- Owners: `sr-004-...md`, "## Failure And Recovery"; `sr-009-...md`, "## Failure And Recovery"; `system-model/contracts/invariants/inv-024-no-forgotten-vault-password-recovery.md`, "## Rule"
- Prevents: "support can recover your Vault," or "a lost password loses everything already signed."

### 1.4 Base USDC Settlement And Funding guide

**S-1.** The Base contracts decide what happens to USDC for one loan. A Base payout can expose a secret that makes a previously authorized Bitcoin transaction usable, but it cannot sign, broadcast, or confirm that transaction.
- Owner: `system-model/domains/base-usdc-settlement-and-funding/domain.md`, "## Domain Overview"
- Prevents: "Base releases the collateral."

**S-2.** The funding vault and the repayment vault are immutable, ownerless per-loan addresses. Transfers into them stay provisional until the named main-contract action finalizes the exact required amount.
- Owners: `base-usdc-settlement-and-funding/domain.md`, "## Domain Overview"; `system-model/contracts/interfaces/iface-010-funding-vault.md`, "## Payload Or Artifact"; `.../responsibilities/sr-003-base-loan-state-and-usdc-settlement.md`, "## State And Artifacts"
- Prevents: treating a deposit as funding or repayment.

**S-3.** Funding and repayment are payer-neutral. Any eligible address may send the tokens, but sending does not acquire the borrower's or lender's role, change a recipient, or gain a refund right. Fixed recipients come from the approved loan, not from the payer.
- Owners: `base-usdc-settlement-and-funding/domain.md`, "## Domain Overview"; `sr-003-...md`, "## Owns"
- Prevents: "whoever pays gets the refund," or payer-based recipient changes.

**S-4.** Only the selected lender decides, explicitly, whether, when, and from which lender-controlled wallet or treasury to transfer principal; a recoverability-qualified Vault payment account is one option. Partial deposits accumulate. The product never pools, custodies, substitutes, or automatically draws lender capital.
- Owners: `.../responsibilities/sr-005-lender-controlled-funding-vault-interaction.md`, "## Purpose", "## Owns", and "## Must Not Own"; `inv-011-...md`, "## Rule"; `iface-010-...md`, "## Preconditions And Validation"
- Prevents: platform-controlled funding, or "the reservation commits the lender's money."

**S-5.** The funding window opens only after origination qualifies and lasts 24 hours. Permissionless finalization moves exactly the principal before the deadline. Expired funding, and any excess or late USDC, is recoverable only to the fixed lender settlement recipient.
- Owners: `system-model/contracts/states/state-010-base-funding-vault.md`, "## States"; `sr-005-...md`, "## Failure And Recovery"; `iface-010-...md`, "## Preconditions And Validation" and "## Failure Meaning"; `flow-002-...md`, "## Ordered Transitions" (steps 1–3)
- Prevents: early funding, open-ended windows, or refunds to arbitrary senders.

**S-6.** Finalized funding starts an acceptance period of at most 24 hours. During it, the borrower must intentionally disclose X through its own Vault-controlled call, which atomically pays principal to the fixed borrower recipient and registers the repayment vault but leaves Bitcoin activation pending. There is no company-held or delegated acceptance.
- Owners: `base-usdc-settlement-and-funding/domain.md`, "### From Funding To Repayment"; `system-model/contracts/states/state-011-main-base-loan.md`, "## States" and "## Transitions"; `system-model/contracts/scope/scope-003-borrower-nonresponse-activation-recovery.md`, "## Boundary"
- Prevents: "acceptance = active loan," or the company accepting on the borrower's behalf.

**S-7.** A repayment is valid only when exactly the debt in the registered repayment vault is finalized no later than D and the repayment event reaches Base L1 finality. Payer identity, a transfer, a balance, or a submitted finalization is not enough.
- Owners: `system-model/contracts/invariants/inv-006-valid-repayment.md`, "## Rule"; `base-usdc-settlement-and-funding/domain.md`, "### From Funding To Repayment"
- Prevents: "repaid once the money is sent."

**S-8.** The bound lender can claim the repayment by revealing Y strictly before C = D + 172,800 s. The claim pays the fixed lender recipient once and makes Y public.
- Owners: `base-usdc-settlement-and-funding/domain.md`, "### From Funding To Repayment"; `system-model/contracts/invariants/inv-007-claim-refund-exclusivity-and-fallback-trigger.md`, "## Rule"; `sr-003-...md`, "## Owns"
- Prevents: an open-ended or inclusive claim window, or a claim that pays somewhere other than the fixed recipient.

**S-9.** Before C, the borrower may make one optional, irreversible switch of the repayment-refund recipient. The switch is signed by its committed protocol account and can only point to that same account. At C, the current recipient freezes.
- Owners: `system-model/contracts/states/state-013-repayment-refund-recipient-and-claim-cutoff.md`, "## Authority And Identity"; `sr-003-...md`, "## Owns"; `system-model/behavior/flows/flow-005-valid-repayment-without-lender-claim.md`, "## Ordered Transitions" (step 1)
- Prevents: "the borrower can redirect the refund anywhere," or "the app can change it."

**S-10.** At or after C, the lender's claim is permanently impossible, and the exact unclaimed repayment is permissionlessly refundable once to the frozen borrower recipient. That refund stays available indefinitely and never depends on, or waits for, the fallback service.
- Owners: `sr-003-...md`, "## Owns" and "## Failure And Recovery"; `flow-005-...md`, "## Ordered Transitions" and "## Failure And Reroute"; `system-model/contracts/interfaces/iface-017-conditional-ecvs-publication.md`, "## Boundary"
- Prevents: double collection, refund expiry, or a fallback veto over the refund.

**S-11.** The finalized refund event for the unclaimed repayment is the only positive Base fallback trigger. Lender silence, a missing secret, elapsed time, or raw token activity is not a trigger. The Base refund does not imply Bitcoin recovery, and the lender's Bitcoin maturity after T stays independent.
- Owner: `base-usdc-settlement-and-funding/domain.md`, "### From Funding To Repayment"
- Prevents: "refund returns the BTC," or "time alone triggers the fallback."

**S-12.** A permissionless call lets any caller pay the gas but gives that caller no control over amount, recipient, or meaning. A wrong-state, wrong-amount, late, or otherwise invalid call reverts with a named error, emits no success event, and moves no value.
- Owners: `base-usdc-settlement-and-funding/domain.md`, "### Settlement And Lender Interaction"; `sr-003-...md`, "## Failure And Recovery"
- Prevents: equating "anyone can call" with "anyone can redirect."

**S-13.** The main contract stays upgradeable through a Transparent Proxy administered by a 2-of-3 Safe with a seven-day timelock, while the vaults are immutable. There is no on-chain pause, valid direct exits remain available during an application or opener shutdown, and existing loans are not silently migrated.
- Owners: `base-usdc-settlement-and-funding/domain.md`, "### Failure, Authority, And Scope"; `sr-003-...md`, "## Owns"; `system-model/contracts/invariants/inv-020-base-upgrade-boundary.md`, "## Rule"
- Prevents: "the contract is fully immutable," "operators can pause loans," or "upgrades move existing loans."

**S-14.** A missed deadline is classified as ordinary default only from canonical Base facts. Valid repayment without a lender claim is never ordinary default, and default classification neither bypasses Bitcoin timelocks nor broadcasts any package.
- Owners: `system-model/behavior/flows/flow-008-ordinary-borrower-default-qualification.md`, "## Ordered Transitions" and "## Outcomes"; `flow-004-...md`, "## Failure And Reroute"
- Prevents: labeling lender silence as borrower default, or treating classification as enforcement.

**S-15.** A Vault payment account is only an eligible payer. Its separate participant-transfer purpose has no loan binding and cannot advance loan state, and cooperative Bitcoin settlement does not yet have a complete Base accounting capability.
- Owners: `sr-003-...md`, "## Owns"; `base-usdc-settlement-and-funding/domain.md`, "### Failure, Authority, And Scope"; `scope-005-...md`, "## Boundary"
- Prevents: treating payment-account activity as loan activity, or inventing Base accounting for cooperative outcomes.

### 1.5 Base Observation And Fallback Review guide

**O-1.** Observation reports what happened on Base, and the fallback controls disclosure of one secret. Neither decides who deserves the collateral, and neither signs a Bitcoin transaction.
- Owners: `system-model/domains/base-observation-and-fallback-review/domain.md`, "## Domain Overview" and "## Excludes"
- Prevents: treating the observer or the fallback service as an arbiter or custodian.

**O-2.** A newly seen Base event is first "observed" and then "safe," and both are display-only progress. Lifecycle advances and Bitcoin handoffs wait for Base L1 finality, which accepts extra waiting in exchange for one consistent rule and is not a promise of an exact waiting time.
- Owners: `base-observation-and-fallback-review/domain.md`, "### Establishing a fact the rest of the system can use"; `system-model/contracts/states/state-014-base-event-observation-and-projection.md`, "## States"
- Prevents: acting on "safe" or one block, or promising a fixed delay.

**O-3.** The observer hands events to the application through a versioned ingestion interface. It advances its durable cursor only after the application acknowledges storage, resends the same event identity after a lost acknowledgement, and never writes loan projections directly.
- Owners: `base-observation-and-fallback-review/domain.md`, "### Establishing a fact the rest of the system can use"; `.../responsibilities/sr-006-base-observation-finality-and-reconciliation.md`, "## Owns"; `system-model/contracts/interfaces/iface-012-base-event-observation-and-correction.md`, "## Boundary"
- Prevents: lost or duplicated events, and an observer that edits status.

**O-4.** Alchemy is the primary Base source and QuickNode the fallback, and one healthy configured provider is enough for a finalized Base fact. If both are unavailable or disagree, existing finalized projections stay visible, but new consequential actions that depend on Base are blocked.
- Owners: `base-observation-and-fallback-review/domain.md`, "### Establishing a fact the rest of the system can use"; `sr-006-...md`, "## Owns"; `state-014-...md`, "## Observation And Finality"
- Prevents: "two Base providers must agree," or acting during a provider conflict.

**O-5.** When a reorg displaces an observed event, the event is kept as noncanonical evidence, a correction is appended, and history is replayed from the last common finalized block. An operator may request a recheck through the application but cannot change a fact, override a result, or advance the cursor.
- Owners: `base-observation-and-fallback-review/domain.md`, "### Establishing a fact the rest of the system can use"; `sr-006-...md`, "## Failure And Recovery"
- Prevents: deleting evidence, or operators correcting chain facts by hand.

**O-6.** Bitcoin lifecycle gates, unlike Base, require fresh agreement between the configured observers. Conflict or outage blocks dependent automation and repeated reports update one incident. Escalation happens after five minutes or one missed block, and any failure after the borrower's acceptance is immediately critical.
- Owners: `base-observation-and-fallback-review/domain.md`, "### Establishing a fact the rest of the system can use"; `sr-006-...md`, "## Owns" and "## Failure And Recovery"
- Prevents: applying the one-source Base rule to Bitcoin.

**O-7.** Exact transaction and nonce evidence can update a Vault payment's own record, but only the named finalized contract event establishes loan funding or repayment. Even a confirmed standalone participant transfer does not advance the loan.
- Owners: `base-observation-and-fallback-review/domain.md`, "### Establishing a fact the rest of the system can use"; `sr-006-...md`, "## Owns"
- Prevents: "confirmed transfer = repaid."

**O-8.** The fallback service is one contracted independent service. It generates a unique random 32-byte secret per loan, returns only the hash beforehand, and holds no provider-wide master secret, Bitcoin key, destination choice, or discretionary judgment. Neither the company, the borrower, nor the lender receives the secret before publication or can command an early release.
- Owners: `.../responsibilities/sr-007-evidence-conditioned-validation-service-fallback.md`, "### Establishing the capability before a loan exists", "## Owns", and "## Must Not Own"; `build/records/constraints/cons-020-independent-ecvs-release-secret-authority.md`, "## Rule"
- Prevents: casting the service as a signer, a company-controlled switch, or an escrow agent.

**O-9.** The hash commitment must be fixed before escrow construction and borrower signatures and must be unique per loan. It cannot be added to an existing escrow that relies only on Y, and a lost or compromised secret cannot be rotated without a new escrow output and package graph.
- Owners: `sr-007-...md`, "### Establishing the capability before a loan exists"; `iface-017-...md`, "## Payload Or Artifact"
- Prevents: "add the fallback later," or "replace the secret."

**O-10.** The selected fallback is an approved technical model, not an operating service. Counsel approval and implementation evidence must satisfy a production-activation gate before any new loan commits the hash or presents the fallback as available, and a resolved technical ticket does not satisfy that gate.
- Owners: `sr-007-...md`, "### Establishing the capability before a loan exists" and "## Must Not Own"; `system-model/contracts/states/state-007-ecvs-s.md`, "## Authority And Identity" and "## States"; `base-observation-and-fallback-review/domain.md`, "### Limits and remaining recovery paths"
- Prevents: presenting the fallback as available today.

**O-11.** Only the canonical, Base-L1-finalized refund event for that loan's unclaimed repayment can authorize publication. The service independently verifies the chain, deployment and current implementation, event signature, loan, transaction and log, canonicality, finality, exact debt, and frozen recipient, rather than trusting the application observer, a workspace label, or an operator.
- Owners: `sr-007-...md`, "### From an unclaimed repayment to public S"; `iface-017-...md`, "## Preconditions And Validation"
- Prevents: triggering on the earlier repayment event, missing Y, elapsed time, a balance, or a platform assertion.

**O-12.** Publication only makes the secret usable. Bitcoin finalization separately checks the activation gate, the public source and event binding, the hash, the retained package, the signature, the fixed outputs, and that the escrow is still unspent. It then inserts the secret into the same borrower-signed transaction, and independent confirmation is required before recovery is final.
- Owners: `sr-007-...md`, "### From an unclaimed repayment to public S"; `system-model/behavior/flows/flow-006-conditional-ecvs-borrower-recovery.md`, "## Ordered Transitions"; `iface-020-...md`, "### ACT-002 — Consume finalized Y or valid public S for fixed borrower recovery"
- Prevents: "publication returns the BTC."

**O-13.** A lookup distinguishes four results: no publication yet, a valid publication, an invalid or mismatched publication, and an unavailable source. An empty or unreachable response is not proof that the service deliberately withheld the secret, and the product receives only public metadata.
- Owners: `sr-007-...md`, "### From an unclaimed repayment to public S"; `iface-017-...md`, "### ACT-002 — Acquire and replay the public S publication"
- Prevents: reading silence as a refusal or as a release.

**O-14.** Wrong, early, nonfinal, cross-loan, or unverifiable evidence cannot authorize publication. An outage may be recovered by re-verifying and replaying the same secret. Loss, compromise, or withholding follows an incident path with no discretionary company release and no replacement secret, and the completed Base refund stays valid throughout.
- Owners: `sr-007-...md`, "### When the path fails" and "## Failure And Recovery"
- Prevents: assuming the company can step in and release or reissue the secret.

**O-15.** If the fallback does not deliver:
- The lender's pre-signed route can still mature at D plus three days.
- The borrower long-stop can mature at D plus ten days, but it does not cancel the lender route.
- Cooperation remains possible.
- The first confirmed spend wins.
These are residual risks. They are not borrower default, and they are not a guarantee that the collateral returns.
- Owners: `base-observation-and-fallback-review/domain.md`, "### Limits and remaining recovery paths"; `system-model/contracts/invariants/inv-025-missing-y-residual-lender-risk.md`, "## Rule"; `system-model/contracts/security/sec-025-lender-or-package-holder-broadcasts-default-after-valid-repayment.md`, "## Compound Threat Relationships"
- Prevents: hiding the no-hacker-required collateral loss after valid repayment.

### 1.6 Participant Access And Loan Operations guide

**P-1.** Application records coordinate the separate agreement, Vault, Base, and Bitcoin authorities, but they cannot become private keys, participant consent, or chain truth.
- Owner: `system-model/domains/participant-access-and-loan-operations/domain.md`, "## Domain Overview"
- Prevents: treating the workspace as the system of record for chain outcomes or consent.

**P-2.** Product sign-in uses WorkOS with Google or a verified email code and resolves to one immutable internal account. It authorizes retrieval of the participant's own encrypted artifacts only; it cannot decrypt a Vault, recover a seed or secret, or make a chain action valid.
- Owners: `participant-access-and-loan-operations/domain.md`, "### Access, Coordination, And Local Composition"; `.../responsibilities/sr-010-participant-identity-and-role-access.md`, "## Owns" and "## Must Not Own"
- Prevents: equating login with wallet unlock or signing.

**P-3.** Sessions last at most seven days, with a 24-hour inactivity limit. Sensitive actions need reauthentication within the last 15 minutes, plus a TOTP challenge if the participant enrolled one. Replacing the vault password also needs a single-use email confirmation, which cannot substitute for the current vault password.
- Owner: `sr-010-...md`, "## Owns"
- Prevents: assuming an ordinary session is enough for sensitive actions, or that email can replace the vault password.

**P-4.** One account may hold different roles on different loans but never both roles on the same loan. Every interaction makes its own identity and role check, with non-enumerating denials.
- Owner: `sr-010-...md`, "## Owns" and "## Inputs And Outputs" (paragraph after the table)
- Prevents: self-dealing on one loan, or assuming that one check covers a whole session.

**P-5.** Product account recovery restores access and ciphertext retrieval only. Nothing in V1 can reconstruct a forgotten vault password, seed, key, or secret.
- Owners: `sr-010-...md`, "## Failure And Recovery"; `inv-024-...md`, "## Rule"; `system-model/contracts/scope/scope-006-stronger-participant-vault-recovery.md`, "## Boundary"
- Prevents: "reset your password to regain your funds."

**P-6.** A handoff to the separately hosted Vault is a short-lived, single-use code bound to one participant, role, loan, workspace revision, and exact action. The Vault requires the same participant's fresh session, redeems the code once, independently reloads and validates the canonical action, and never signs bytes supplied only by the product page. The code is not authentication, consent, or cryptographic authority.
- Owners: `.../responsibilities/sr-011-loan-workspace-and-application-coordination.md`, "## Owns" (fresh-gated handoff bullet); `iface-004-...md`, "### One-Time Cross-Origin Handoff"
- Prevents: "the product sends you a transaction to sign," or "the handoff link is authorization."

**P-7.** Every accepted command gets a stable, retrievable operation identity. A same-key, same-body retry returns that operation, and a changed body is rejected. The workspace is a sourced projection and the operation is a receipt; neither implies chain finality.
- Owners: `sr-011-...md`, "## Owns" and "## Inputs And Outputs" (paragraph after the table); `state-016-...md`, "## Observation And Finality"; `build/records/constraints/cons-024-consumer-visible-workspace-and-operation-continuity.md`
- Prevents: "completed operation = on chain," and duplicate actions after a refresh.

**P-8.** A required state change and its job commit together in D1. The immediate wake is only an optimization; a one-minute scan recovers missed or crashed work. A retry happens only after reloaded facts prove the identical action is still required, and ambiguous outcomes are reconciled rather than resubmitted.
- Owners: `participant-access-and-loan-operations/domain.md`, "### Cooperation Through A Loan"; `sr-011-...md`, "## Owns" (fixed-effect automation bullet) and "## Failure And Recovery"
- Prevents: blind retries that create duplicate financial effects.

**P-9.** A Vault payment account is separate from the protocol account and the Bitcoin keys, and it becomes public only after recoverability is established. Core enters a durable signing phase before the Vault signs, and a timeout after that point is not proof of non-submission. Unresolved outcomes are probed at 0, 15, and 60 seconds and escalated at 180 seconds to a visible block, never silently re-signed.
- Owners: `participant-access-and-loan-operations/domain.md`, "### Payment Authority And Availability" and "### Cooperation Through A Loan"; `sr-011-...md`, "## Owns" (payment-intent paragraphs); `system-model/contracts/invariants/inv-027-vault-payment-account-isolation-and-intent-integrity.md`, "## Rule"
- Prevents: duplicate payments after a lost response, or an exposed address that cannot be restored.

**P-10.** The narrow participant-transfer purpose sends configured USDC to a validated, user-chosen recipient, with exact approval and balance and gas checks. It has no loan binding and cannot advance loan state. Arbitrary calls, approvals, swaps, other assets, native sends, and generic signing remain excluded.
- Owner: `participant-access-and-loan-operations/domain.md`, "### Payment Authority And Availability"
- Prevents: presenting the Vault as a general-purpose wallet, or a transfer as a loan event.

**P-11.** Workforce operators sit behind a separate boundary: Cloudflare Access with a company Google identity, mandatory TOTP, a 15-minute session, and an active operator permission. Approval is by one person and every attempt is written to an uneditable audit. Operators may only request fixed, already-authorized actions, and participant authentication grants no workforce authority.
- Owners: `sr-011-...md`, "## Owns" (workforce-boundary and one-person-approval bullets); `sr-003-...md`, "## Failure And Recovery"; `sr-006-...md`, "## Failure And Recovery"
- Prevents: "support/admin can move funds or fix chain facts."

**P-12.** All V1 application parts share Cloudflare's failure domain. An outage stops new consequential commands while the chains continue, recovery reconciles Base and Bitcoin before jobs resume, and backups are for data recovery, not a running fallback or a promised RTO/RPO.
- Owners: `participant-access-and-loan-operations/domain.md`, "### Payment Authority And Availability"; `sr-011-...md`, "## Failure And Recovery"
- Prevents: invented availability guarantees.

**P-13.** The local demonstration is one developer entrypoint that composes the real units through public seams on loopback-only resources: a local Base chain with fake USDC, two connected regtest Bitcoin nodes, and two isolated participants. Ordinary shutdown preserves state, only an explicit reset reseeds, and any non-local predicate fails closed.
- Owners: `participant-access-and-loan-operations/domain.md`, "### Access, Coordination, And Local Composition"; `.../responsibilities/sr-012-local-runtime-composition-and-controlled-demonstration.md`, "## Owns" and "## Failure And Recovery"
- Prevents: treating the demo as a deployment, or a restart as destructive.

**P-14.** Verification, runnable local use, testnet or mainnet deployment, and activated production operation are separate claims. A passing test, healthy process, fixture, or demo receipt proves none of the later claims. The current payment capability is an implementation target with no execution evidence established by this migration.
- Owners: `participant-access-and-loan-operations/domain.md`, "### Recorded Choices And Scope"; `sr-012-...md`, "## Must Not Own"; `scope-013-...md`, "## Claim Ladder" and "## Must Not Be Inferred"
- Prevents: readiness overclaims.

**P-15.** The gas stipend is a one-time ETH transfer to the participant's protocol account that never signs, submits, or relays the participant's call. Forgotten-password recovery, complete cooperative operation, identity-provider replacement, and platform-paid reveal execution remain deferred.
- Owners: `system-model/contracts/invariants/inv-021-gas-sponsorship-does-not-transfer-authority.md`, "## Rule"; `system-model/contracts/interfaces/iface-015-participant-gas-sponsorship.md`, "## Boundary"; `participant-access-and-loan-operations/domain.md`, "### Recorded Choices And Scope"
- Prevents: "the platform submits your transaction for you," and presenting deferred capabilities as available.

---

## 2. Distinctions the owners establish

### 2a. Authentication (signing in) versus authority to sign or authorize transactions

**What the owners say**
- Login is not a Vault unlock (`system-model/architecture.md`, "## System Overview"). Product authentication permits ciphertext access only; it is not decryption, signing, secret recovery, or chain authority (`architecture.md`, "## Authority And Sources Of Truth").
- Login, role, account recovery, MFA, artifact retrieval, reservation, or allocation must not imply final-terms approval, ownership of a chain asset, secret recovery, transaction consent, funding, repayment, or beneficiary selection (`sr-010-...md`, "## Must Not Own").
- **Two different kinds of "authorization" exist.**
  - *Application authority* comes from an authenticated session plus a role recorded in the database. With it, a participant can reserve, approve the final terms candidate, or retrieve their own ciphertext. Approving final terms "grants no Vault custody, signing, funding, or chain authority" (`sr-010-...md`, "## Owns").
  - *Cryptographic authority* requires the vault password, local decryption in the dedicated Vault origin, and an exact-bytes confirmation (`sr-004-...md` and `sr-009-...md`, "## Owns"; `iface-004-...md`, "### One-Time Cross-Origin Handoff").
- Authentication is necessary for sensitive actions but never sufficient. Reauthentication no older than 15 minutes (plus TOTP if enrolled) gates sensitive ciphertext, seed display, current PSBT, Vault handoff, and password replacement (`sr-010-...md`, "## Owns"). The Vault still requires its own fresh session, redeems the code once, and reloads the canonical action independently (`iface-004-...md`, "### One-Time Cross-Origin Handoff"). The handoff code is "an expiring pointer, not authentication, transaction consent, or cryptographic authority."
- For secret disclosure, the first confirmation authorizes only local preparation; only the second, exact-bytes confirmation authorizes signing (`flow-002-...md` step 4: "First confirmation is not signing consent"; `flow-004-...md` step 3).
- Recovered product access leaves Vault plaintext unavailable without the vault password (`system-model/contracts/states/state-003-product-identity-session-and-fresh-access.md`, "## States"). No forgotten-password recovery exists (`inv-024-...md`).
- Account takeover is not Vault decryption. It exposes metadata and ciphertext, and becomes financially serious only in combination with the vault password, malicious frontend code, a weak password, or a key compromise. MFA reduces unauthorized ciphertext retrieval but does not protect a password typed into malicious JavaScript (`system-model/contracts/security/sec-002-product-account-takeover.md`, "### SEC-002.THREAT-001 — Product account takeover" and "## Prohibited Authority").
- Neither gas sponsorship nor the platform fee wallet transfers caller authority. The participant's Vault-derived protocol account is the sole caller (`inv-021-...md`; `system-model/contracts/interfaces/iface-014-participant-local-base-calls.md`, "## Boundary").
- Workforce authentication (Cloudflare Access plus operator permission) is separate. Participant authentication grants no workforce authority, and operators cannot choose amounts, recipients, or outcomes (`sr-011-...md`, "## Owns"; `sr-003-...md`, "## Failure And Recovery").

**Guides that must carry it:** Architecture, Participant Access (primary), Bitcoin Authorization, and Loan Terms (approval is not signing). Base Settlement must state that acceptance and claim calls are made by the participant's own Vault.

**Must not be written as:** "log in to sign," "your account holds your keys," "MFA secures your collateral," "approving the terms signs the transaction," "the link from the product authorizes the Vault," or "support can restore your Vault."

### 2b. Application status versus raw on-chain transfers versus contract facts

**What the owners say**
- **Application status** (workspace, operation, notifications) is a sourced, replaceable projection. An operation is "only the durable receipt and recovery record"; "Neither a workspace nor an operation establishes external-chain finality" (`state-016-...md`, "## Observation And Finality"). Prepared, signed, selected, exported, accepted-command, outbox-pending, worker-submitted, relay-submitted, observed, safe, current, historical, or corrected states must never collapse into Base L1 finality, Bitcoin confirmation, collateral movement, or a terminal outcome (`system-model/contracts/invariants/inv-013-artifact-state-is-not-external-state.md`, "## Rule").
- **Raw transfers, balances, and submissions** are provisional. "A raw transfer, token event, vault balance, simulation, local worker completion, submitted transaction, observed event, missing Y, or lender silence must not imply finalized funding, valid repayment, claim, refund, Bitcoin recovery, or default" (`sr-003-...md`, "## Must Not Own"). Funding-vault balance is "never a funding-finalized conclusion" (`iface-010-...md`, "### ACT-002 — Observe provisional funding-vault balance"). Payment transfer, nonce, and provider observations are provisional, and only the named finalized contract events finalize funding or repayment (`sr-006-...md`, "## Owns").
- **Contract facts** are named contract events, not saved `getLoan` snapshots, once they reach Base L1 finality. Observed and safe are display-only; L1 finalized "may drive consequential action" (`state-014-...md`, "## States" and "## Authority And Identity"; `state-011-...md`, "## Observation And Finality"). Valid repayment is the exact debt finalized by D plus the repayment event at L1 finality (`inv-006-...md`).
- An observer reports an authoritative fact; it does not create the fact or approve its consequence (`architecture.md`, "## Authority And Sources Of Truth").
- The "Active projection eligible" state is a cross-domain application classification. The Base record itself remains in the accepted state (`state-011-...md`, "## States").
- An on-chain loan record whose terms tuple is absent from the committed registry is quarantined and never promoted into a product loan (`system-model/contracts/invariants/inv-019-funding-opener-and-pause-boundaries.md`, "## Rule"). In other words, a chain fact without its canonical binding is not a product loan.
- On the Bitcoin side, a relay response, fee estimate, observer report, public secret, Base event, cached status, wall clock, or package archive must not imply broadcast acceptance, confirmation, or lifecycle completion (`sr-002-...md`, "## Must Not Own"). Bitcoin gates need fresh agreement between independent observers (`sr-006-...md`, "## Owns").
- Operators cannot override contested facts (`sr-006-...md`, `sr-011-...md`, "## Failure And Recovery").

**Guides that must carry it:** all six. It is primary for Base Settlement, Base Observation, and Participant Access.

**Must not be written as:** "funded when the balance reaches the principal," "repaid once you send the USDC," "the dashboard shows it is complete, so it is final," or "safe = final."

### 2c. A Base-side refund versus a confirmed Bitcoin recovery

**What the owners say**
- "A Base refund is not a confirmed Bitcoin recovery" (`architecture.md`, "## System Overview"). "Base refund does not imply Bitcoin recovery" (`base-usdc-settlement-and-funding/domain.md`, "### From Funding To Repayment"). "A refunded USDC balance is not complete Bitcoin settlement" (`sr-007-...md`, "### When the path fails").
- After an unclaimed-repayment refund, "Bitcoin remains a distinct unspent output until another authorized route confirms" (`flow-005-...md`, "## Outcomes"). Recovery through S exists only for loans created after the production-activation gate (`inv-025-...md`). SEC-024's honest claim is that BTC stays exposed for every loan without an activated H(S) until an S recovery confirms (`system-model/contracts/security/sec-024-valid-repayment-plus-missing-y-leaves-bitcoin-unsettled.md`, "## Honest Capability Claim").
- The lender's default package can still mature at T and pay the fixed lender destination after the borrower's USDC was refunded. Because Bitcoin cannot inspect Base, this risk needs no hacker (`sec-025-...md`, "### SEC-025.THREAT-001 — Lender or package holder broadcasts default after valid repayment" and "## Compound Threat Relationships").
- **Three different "refunds" exist and must not be conflated.**
  1. *Unclaimed-repayment refund.* A Base transfer of the exact debt to the frozen borrower recipient at or after C (`flow-005-...md`).
  2. *Funding expiry or unaccepted refund.* A Base transfer of principal to the fixed lender settlement recipient before X is accepted (`flow-003-...md`, step 1; `state-011-...md`).
  3. *Borrower prefund refund.* A Bitcoin transaction returning staged BTC to the committed borrower destination after CSV maturity, relayed automatically only with fresh evidence of an unspent prefund and no accepted X (`flow-003-...md`, steps 2–4; `inv-017-...md`).
  The pre-activation unwind outcome requires both the lender's Base recovery and a confirmed borrower prefund refund (`system-model/behavior/lifecycle.yaml`, OUTCOME-001).

**Guides that must carry it:** Architecture, Base Settlement, Base Observation, and Bitcoin Authorization.

**Must not be written as:** "the borrower gets their refund and collateral back," "after the refund the loan is closed," or "refund" used without saying which of the three.

### 2d. The fallback path: prerequisites, independent checks, prior commitment, activation conditions

**Activation condition (system-wide).**
- The ECVS model is "selected" but "production-gated." Counsel approval and implementation evidence must satisfy a separate production-activation gate before any new loan may commit H(S) or represent the fallback as available (`iface-017-...md`, "## Boundary" and "## Preconditions And Validation"; `cons-020-...md`, "## Rule").
- "A resolved technical ticket does not satisfy that gate" (`sr-007-...md`, "### Establishing the capability before a loan exists").
- STATE-007 starts at "Production unavailable" and must not be inferred from the specification alone (`state-007-...md`, "## Transitions").
- The lifecycle says this outcome "is unavailable until IFACE-017 gates close" (`lifecycle.yaml`, OUTCOME-003). SCOPE-013 lists "legal/ECVS gates" among the evidence needed for activated production operation (`scope-013-...md`, "## Claim Ladder").
- **Silence:** no source records that the counsel approval or implementation evidence has been obtained. Guides must present the capability as not production-available.

**Required prior commitment (per loan).**
- The ECVS generates a unique random 32-byte S per loan and returns only H(S) before escrow construction and borrower signatures. H(S) must be unique, and duplicate active-loan hashes are rejected (`sr-007-...md`, "### Establishing the capability before a loan exists"; `iface-017-...md`, "## Payload Or Artifact").
- The borrower signs each recovery fee candidate once over the dual-secret script, and the same signature later works with Y or S (`build/records/constraints/cons-021-single-dual-secret-borrower-recovery-psbt.md`, "## Rule").
- Existing escrows that rely only on Y cannot be upgraded. S cannot be rotated without a new escrow and package graph (`iface-017-...md`).

**Per-event prerequisites.** All of the following, in order (`flow-005-...md`, "## Preconditions" and "## Ordered Transitions"; `flow-006-...md`, "## Preconditions"):
1. Valid repayment: the exact debt is finalized by D and the repayment event reaches Base L1 finality.
2. No lender claim finalized strictly before C.
3. At C the claim is disabled and the recipient frozen, then the permissionless refund executes.
4. The canonical refund event reaches Base L1 finality.
5. The loan was created after the activation gate, with H(S) committed.
6. The matching borrower-recovery package set is still durably recorded as ready in the Cloudflare primary archive.
7. The escrow is still unspent.

**What is explicitly not a trigger:** the repayment event alone, missing Y, elapsed time, an application assertion, a raw token transfer or balance, a merely observed or nonfinal event, or a platform watcher's conclusion (`iface-017-...md`, "## Preconditions And Validation"; `base-observation-and-fallback-review/domain.md`, "### Limits and remaining recovery paths").

**Independent checks by the ECVS:** configured chain, deployment and proxy and current implementation, ABI and event signature, loan identifier, block, transaction and log provenance, canonicality, L1 finality, exact debt, and frozen recipient. Publication is authenticated by SHA256(S) = H(S). The ECVS does not trust the application observer, a workspace label, or an operator (`sr-007-...md`, "### From an unclaimed repayment to public S" and "## Owns"; `cons-020-...md`).

**Independent checks by Bitcoin finalization (separate from the ECVS):**
- the activation gate;
- the public source and event binding;
- the matching hash;
- the exact retained recovery package and its checksum and raw witness script;
- the borrower signature;
- the fixed outputs;
- that the escrow is still unspent;
- terminal exclusivity.

Finalization then inserts S into the same transaction, selects an existing fee candidate, submits, and waits for independent confirmation (`sr-007-...md`; `iface-020-...md`, "## Preconditions And Validation"; `cons-021-...md`). The product receives only public metadata and the commitment-match conclusion (`iface-017-...md`, "### ACT-002 — Acquire and replay the public S publication").

**Failure boundaries:** see O-13 and O-14. Base refund stays complete. There is no company release and no replacement secret. Early disclosure is dangerous because it could enable premature borrower recovery (`sr-007-...md`, "### When the path fails").

**Guides that must carry it:** Base Observation (primary, in full), Architecture (summary plus gate), Bitcoin Authorization (same transaction, no new signature, unavailable without the gate), and Base Settlement (the trigger is a Base fact; the refund never waits for the ECVS).

**Must not be written as:** "the fallback service unlocks the Bitcoin," "if the lender disappears, the service returns your BTC," "available for all loans," "can be enabled for an existing loan," or "the service decides disputes." Guides also must not conflate this "activation" of the capability with the Bitcoin "activation" transaction that creates the escrow.

### 2e. Publication versus broadcast versus confirmation

**What the owners say**
- **The word "publication" has several distinct meanings.**
  - *Offer publication* is the lender's standing approval of commercial values (`sr-001-...md`, "## Owns").
  - *ECVS publication of S* is durable and public. It "is not a Bitcoin recovery submission, mempool observation, or confirmation" (`iface-017-...md`, "## Must Not Imply"), and "Publication or submission alone is not final recovery" (`flow-006-...md`, step 4).
  - *Disclosure of X and Y on Base* happens through the participant's contract call. The public secret crosses into Bitcoin action only at Base L1 finality (`iface-020-...md`, "## Boundary").
  - A preparation result "never implies publication, approval, signature, or chain effect" (`sr-011-...md`, "## Owns", prepare_loan_terms_material bullet).
- **Submission and broadcast.**
  - A relay success records only `relay-submitted`. It does not prove peer acceptance, mempool visibility, confirmation, or lifecycle advancement (`system-model/contracts/interfaces/iface-008-relay-submission-and-independent-confirmation.md`, "## Payload Or Artifact" and "## Must Not Imply").
  - A relay timeout is ambiguous and enters reconciliation; it does not permit a different transaction (`bitcoin-authorization-and-recovery/domain.md`, "### Fees, Failures, And Recorded Choices").
  - A Base transaction returned by the Vault is a "tracking hint only" (`flow-002-...md` step 4; `iface-014-...md`, "## Payload Or Artifact").
  - Lender default is export followed by manual or external broadcast. Export is not broadcast, and the organization never broadcasts it (`scope-001-...md`; `flow-007-...md` step 3).
  - The manual fee-bump child is broadcast by the operator in Bitcoin Core, outside the relay (`iface-008-...md`, "## Preconditions And Validation").
- **Confirmation.**
  - For Bitcoin, a mempool or provider presence is not terminal; confirmation of the exact spent output is the source of truth (`state-015-...md`, "## Observation And Finality").
  - Six unchanged confirmations qualify the prefund, and six confirmations of the actual activation winner establish the escrow (`inv-003-...md`; `flow-002-...md`).
  - For Base, the equivalent is L1 finality (`state-014-...md`). "Base remains submitted/observed until L1 finality; Bitcoin remains broadcast/observed until required confirmation" (`state-016-...md`, "## Observation And Finality").

**Guides that must carry it:** Bitcoin Authorization, Base Observation, Participant Access, Architecture, and Base Settlement (for Base submission versus finality).

**Must not be written as:** "once the secret is published the borrower is repaid in BTC," "broadcast = done," or "the relay accepted it."

### 2f. Who controls funding (the lender's control)

**What the owners say**
- "The selected lender owns capital approval and funding. SR-005 presents and coordinates the immutable funding vault and may use a participant Vault payment account as one eligible payer, but cannot pool, custody, substitute, or automatically deploy lender capital" (`architecture.md`, "## Authority And Sources Of Truth").
- The lender alone explicitly controls whether to transfer, and from which controlled wallet or treasury, native Base USDC. The product never pools, custodies, or automatically deploys lender capital (`inv-011-...md`, "## Rule"). The application never controls that wallet or chooses its capital source (`iface-010-...md`, "### ACT-001 — Transfer configured USDC into the registered funding vault").
- Owned by SR-005: explicit lender approval and one or more ordinary transfers, accumulating partial deposits, sender identity granting no contract role, and no required browser-protocol funding wallet (`sr-005-...md`, "## Purpose" and "## Owns").
- Funding control is separate from the terms. The lender keeps the capital-funding decision even after the agreement is committed (`loan-terms-and-commitments/domain.md`, "### Choices And Scope"). Reservation grants no capital custody or automatic funding authority (`sr-001-...md`, "## Invariants"). Final-terms approval grants no funding authority (`sr-010-...md`, "## Owns").
- **What the lender does not control.**
  - Opening the window. The opener may only open a canonical loan's bounded window (`inv-019-...md`), and only after qualification: six confirmations, the initial archive receipt, and at least 67 hours before refund (`flow-001-...md`, step 9).
  - Finalization, which is permissionless and moves exactly the principal (`iface-010-...md`).
  - Where expired, excess, or late funds go, which is only to the fixed lender settlement recipient (`sr-005-...md`, "## Failure And Recovery").
  - The window length, 24 hours (`state-010-...md`).
- The UI specification's lender persona states "Funding does not open before collateral qualifies" (`ui-ux/specification.md`, users table).

**Guides that must carry it:** Base Settlement (primary), Loan Terms, Architecture, and Participant Access (Vault payment account as one payer).

**Must not be written as:** "the platform funds the loan from the lender's balance," "accepting or publishing the offer commits the funds," or "the lender can recover funds to any address."

### 2g. Verification, local demonstration, deployment, and production readiness are separate claims

**What the owners say**
- **Profile claims** (`architecture.md`, "## Target Outcome And Runtime Profiles"; `scope-013-...md`, "## Claim Ladder"):

  | Profile | Claim | What it does not prove |
  | --- | --- | --- |
  | Deterministic local verification | Verification only | A runnable product, deployment, or operation |
  | Local demo | Runnable use | Testnet or mainnet deployment, real-provider compatibility, public funding, or production activation |
  | Testnet | No deployment claim | — |
  | Mainnet | No deployment claim | — |
  | Production | No activated-operation claim | — |

- Configuration names do not establish anything. Passing unit, integration, deterministic, or local-demo evidence does not satisfy public-network, credential, funding, deployment, monitoring, paid-service, legal, audit, or operational gates. Testnet does not establish mainnet, and mainnet does not establish activated operation (`scope-013-...md`, "## Must Not Be Inferred").
- A passing deterministic test, healthy process, seeded fixture, local contract event, or demo receipt must not imply deployment, production operation, security audit completion, paid-provider readiness, or production funding (`sr-012-...md`, "## Must Not Own"). READY proves only that the local composition's health gates pass (`state-020-...md`, "## Observation And Finality").
- **Recorded current status** (status records, not system behavior):
  - VA-001, VA-002, VA-003, and VA-004 are all "**State:** `Planned — unverified`" (`build/records/verification/va-00*.md`).
  - VA-003's "**Existing-capability evidence:** None. The inspected `pnpm dev:system` implementation is a disposable verification composition and cannot satisfy this claim."
  - VA-001's limitation: local Anvil "does not prove real Base L1 finality," and passing it "proves verification only and cannot establish the runnable local demo, deployment, activated operation, production readiness, code review completion, or an independent security audit."
  - The local-demo slice is "Blocked." Its "supervisor still contains the explicit `LOCAL_DEMO_RUNTIME_NOT_IMPLEMENTED` stop and VE-002–VE-009 have not passed." The "Implemented" rows "describe historical deliveries, not completion of the current deltas." "Testnet deployment, mainnet deployment, environment-complete protocol-core publication, and activated production operation remain separate later gates" (`build/workflow/handoffs/README.md`, "# Handoff Sequence" and "## Current bounded planning overlay — ACT-009 and initial zero construction").
  - "The current payment capability is still an implementation target with no execution evidence established by this migration" (`participant-access-and-loan-operations/domain.md`, "### Recorded Choices And Scope").
  - Zero-confirmation initial signing (owner clarification, 29 September 2026) is not verified by historical ticket answers or execution receipts (`inv-015-...md`, "## Rule").
  - "Prototype approval is neither implementation review nor actual user testing" (`ui-ux/specification.md`).
  - The ECVS remains production-unavailable (2d).

**Guides that must carry it:** Architecture and Participant Access (primary). Base Observation must cover ECVS availability. Every guide must avoid readiness language.

**Must not be written as:** "the system is implemented and verified," "the demo proves it works on Base," "ready for testnet," or "production-ready."

### 2h. Unresolved or conflicting items

#### 2h-1. Approval: lender approval of the final terms (flagged by the owners)

**Side A: no second lender approval**
- `architecture.md`, "## Purpose And Binding": "Publication is the lender's standing acceptance of the offer; reservation creates the canonical loan without a second lender approval."
- `architecture.md`, "## Cross-Domain Boundaries": "standing lender acceptance, atomic borrower reservation, and no second lender approval."
- `iface-003-...md`, "## Must Not Imply": "The reservation requires no second lender approval."
- `scope-011-...md`, "## Boundary," and `build/records/selections/sel-012-one-loan-offer-reservation-and-binding.md` say the same.
- `build/workflow/decision-overview.md` (TICKET-0069, human-approved, user-specified, 2026-08-06): "no email invitation or second lender approval."

**Side B: both roles explicitly approve the final candidate**
- `sr-001-...md`, "## Owns": borrower and lender each explicitly approve the same candidate, and "Neither publication nor reservation approves or commits final bound terms."
- `state-001-...md`, "## Invalid Transitions": "The required lender final-terms approval is distinct from its earlier commercial-offer approval."
- `state-002-...md`; `flow-001-...md` step 4; `sr-010-...md` and `sr-011-...md`, "## Owns."
- `ui-ux/specification.md`: "independent final approval."
- `decision-overview.md` (TICKET-0150, user instruction, 2026-09-28): "Both participants approve the final terms separately afterward."

**Owner's characterization:**
- "The architecture's older standing-approval wording conflicts with these detailed records; this migration records the discrepancy without deciding new behavior" (`loan-terms-and-commitments/domain.md`, "### One Responsibility, Shared Meaning").
- "Existing approval-wording ... discrepancies ... remain unresolved source issues" (`architecture.md`, "## System Overview").

**Still undecided:** whether the architecture, IFACE-003, and SCOPE-011 wording is to be repaired, or the behavior changed. STATE-001's sentence reads the "no second approval" rule as applying to reservation only, but the owners still call the issue unresolved. A guide must present both statements and the owners' "not decided" status.

**Related naming inconsistencies (not flagged by the owners):**
- SR-001 names the state `awaiting_final_approvals`; STATE-002 and FLOW-001 say "Awaiting acceptances" or "awaiting acceptances."
- "Acceptance" is also used for the lender's standing offer acceptance, for borrower X acceptance on Base, and for relay or mempool acceptance. Guides must disambiguate.
- The Loan Terms domain narrative mentions only the borrower's preparation of H(X), while SR-009, FLOW-001 step 3, and STATE-002 require both roles' preparations (H(X) and H(Y)).

**Other approval-status facts guides must not overstate**
- ECVS counsel approval is required but not recorded as obtained (2d).
- The domain map: the Participant Access domain is human-approved, but "The other four domains ... Agent-chosen ... No exchange presented the full area list for approval" (`architecture.md`, "## Decision Attribution").
- The decision overview counts 80 user-specified, 195 agent-recommended human-approved, 106 agent-chosen, and 13 unknown-origin decisions. Some local-demo details are recorded as agent-selected and not explicitly approved (`build/workflow/decision-overview.md`, "## Coverage" and "## Agent-chosen").
- UI/UX approval covers only borrower and lender origination through active entry; "Other journeys and overall coverage remain unapproved or incomplete" (`ui-ux/specification.md`).
- Operator approval in V1 is one person, with no two-person rule (`sr-011-...md`, "## Owns").

#### 2h-2. Package count (flagged by the owners)

**18 terminal packages**
- `bitcoin-authorization-and-recovery/domain.md`, "### Package Lifecycle And Recovery": "six borrower recovery, six lender recovery, and six borrower long-stop variants."
- `flow-002-...md`, steps 7–9: "18 terminal PSBTs."
- `state-015-...md`; `inv-026-...md` ("exact 18-object complete-set receipt"); IFACE-005; IFACE-013; CONS-024; SEL-026.

**12 terminal packages (stale)**
- `sr-002-...md`, "## Owns" (archive-readiness bullet): "After activation confirmation, the 12-package signed terminal phase must receive its own R2/D1 receipt."

**Owner's characterization:** "A stale SR-002 archive sentence still says twelve terminal packages; this documented source conflict remains for a separate repair" (`bitcoin-authorization-and-recovery/domain.md`). The architecture also lists the count discrepancy as unresolved.

**Related inconsistencies (not flagged by the owners):**
- `iface-004-...md`, "### One-Time Cross-Origin Handoff," lists the ordinary batches as borrower initial 6+6, lender initial 6, borrower post-confirmation "six normal-recovery variants," and lender six default variants. It omits the borrower's six long-stop signatures.
- `flow-002-...md`, "## Outcomes," says "normal/default terminal phase," although steps 7–9 include the long-stops.

**Legitimate uses of "twelve" that must not be confused with the conflict:** the initial phase is 12 packages (6 activation + 6 refund), and the borrower signs 12 of the 18 terminal packages.

**Still undecided:** the repair has not been made. Guides may report 18 as what the current package contract specifies, but must mention that the stale sentence exists and is unrepaired, rather than silently editing it away or adopting 12.

#### 2h-3. Fee selection when no signed tier qualifies (flagged by the owners)

**Select the 200 sat/vB tier and alert**
- `iface-007-...md`, "## Payload Or Artifact": "If no tier satisfies the inequality, select 200 sat/vB, record CPFP eligibility, and alert for separate manual IFACE-016 approval."
- TICKET-0018 resolution: "if none qualifies it uses 200, records CPFP eligibility, and alerts" (`build/workflow/tickets/bitcoin-authorization-and-recovery/sr-002/sr-002-fee-selection-tickets.yaml`). The decision overview lists this as human-approved, agent-recommended, 2026-07-24.
- The refund ticket resolution in the same file: "or 200 with CPFP eligibility/alert when none qualifies."

**Fail closed and select nothing**
- `iface-007-...md`, "### ACT-002 — Select one eligible signed parent tier": the output is "a fail-closed no-eligible-tier result," and "No eligible tier ... selects nothing." Its verification intent includes "no-eligible failure."

**Neutral or adjacent statements**
- The decision overview's TICKET-0018 entry, "When no tier qualifies, the platform records CPFP eligibility and alerts instead of building or sending a child," does not say which parent is selected.
- TICKET-0020's fail-closed decision ("fee-estimation-blocked") covers the different case where every estimator is unusable. `inv-010-...md` says fees beyond 200 use a separate authorized child. That is consistent with both sides.

**Owner's characterization:** "an earlier ticket/payload selects the largest tier with an alert, while the action contract and former decision say fail closed. This migration preserves both statements and identifies the conflict; it does not authorize either interpretation" (`bitcoin-authorization-and-recovery/domain.md`, "### Fees, Failures, And Recorded Choices"). **Silence:** the domain does not identify which "former decision" says fail closed. The decision recorded in the overview that is worded as fail-closed (TICKET-0020) is about estimator unavailability, not about no qualifying tier.

**Still undecided:** whether "no qualifying tier" selects the 200 sat/vB parent with an alert, or selects nothing and fails closed. Guides must present both and must not merge this case with the estimator-outage case.

#### 2h-4. Other silences and inconsistencies a reviewer should know about (not flagged by the owners)

- `flow-005-...md`, "## Failure And Reroute," lists conditional fallback, residual lender spend, and cooperation after the refund, but not the borrower long-stop. `lifecycle.yaml` (STAGE-005 next includes STAGE-010), `sr-007-...md`, and the observation domain do include it. A guide must include the long-stop.
- API contract versions: SR-002 and SR-011 cite `ApplicationApiContractV1@1.7.0` for the pre-receipt order, while `build/workflow/handoffs/README.md` refers to Application API 1.8 and a 1.9 correction. Guides should not state a "current API version."
- Whether ECVS counsel approval or implementation evidence exists: the sources are silent, so the capability must be treated as production-unavailable (2d).

---

## 3. Reader comprehension questions

Each question is answered from one guide alone. The expected answers below use this key's shorthand; the questions themselves avoid identifiers.

### 3.1 Architecture guide

**Q-A1.** Which part of the system has the final word on whether the Bitcoin collateral has moved, and which has the final word on whether USDC has moved?
- **Expected:** Bitcoin consensus (confirmations, timelocks, the one final spend) for Bitcoin. For USDC, the Base contracts' named events once they reach the approved finality boundary (Base L1 finality). Application status, transfers, balances, and submissions are provisional.
- **Source:** `architecture.md`, "## Authority And Sources Of Truth"
- **Wrong or dangerous:** "the application or backend decides," "the workspace status is final," or "the Base contract controls the Bitcoin."

**Q-A2.** What can the company operating the product do with a borrower's Bitcoin collateral?
- **Expected:** It holds no key in the collateral scripts. Its fee wallet can only fund a separate fee-bump child without changing the signed transaction, so it cannot spend, redirect, liquidate, or recover the collateral.
- **Source:** `architecture.md`, "## Authority And Sources Of Truth" and "## Purpose And Binding"
- **Wrong or dangerous:** "it holds a backup or recovery key," "it can liquidate or redirect in a default," or "it automatically enforces default."

**Q-A3.** What happens to loans in progress during a full outage of the hosting provider, and what happens when service returns?
- **Expected:**
  - Product, Vault, API/database, observation, Bitcoin automation, and the operator surface stop together.
  - The chains continue, and no new consequential command is accepted or chain result claimed.
  - On return, Base and Bitcoin are reconciled before jobs resume.
  - There is no live fallback provider, no active-active deployment, and no RTO/RPO; backups are only for data recovery.
- **Source:** `architecture.md`, "## V1 Operating Topology And Availability Boundary"
- **Wrong or dangerous:** "a secondary provider takes over," "loans are paused on-chain," or "backups provide failover."

**Q-A4.** What does this design version set out to deliver, and which later stages does it explicitly not claim?
- **Expected:** Deterministic local verification plus a runnable, developer-operated local demonstration in which two isolated actors complete a loan through normal repayment and confirmed borrower recovery. It makes no testnet-deployment, mainnet-deployment, or activated-production claim.
- **Source:** `architecture.md`, "## Target Outcome And Runtime Profiles"
- **Wrong or dangerous:** "production-ready," "deployed," or "the demo proves Base finality."

**Q-A5.** When a borrower repays in full and on time but the lender never collects, what can happen to the USDC and to the Bitcoin?
- **Expected:**
  - After the claim cutoff, the USDC is refundable once to the borrower's frozen recipient.
  - The Bitcoin is not released by that refund.
  - Only for a loan created with the activated, precommitted fallback can the published fallback secret complete the borrower's recovery.
  - Otherwise, or meanwhile, the lender's timelocked route, the borrower long-stop, or a cooperative spend may confirm, and the first confirmed spend wins.
- **Source:** `architecture.md`, "## System Overview"; the domain guides elaborate.
- **Wrong or dangerous:** "the refund returns the collateral too," or "the Bitcoin automatically goes back to the borrower."

**Q-A6.** Which points does the design itself record as unresolved, and how does it treat them?
- **Expected:**
  - The approval wording: standing acceptance with "no second lender approval," versus explicit final-candidate approval by both roles.
  - Fee selection when no signed tier qualifies: the 200 sat/vB tier with an alert, versus failing closed.
  - The terminal package count: a stale "12" versus 18.
  - The revision does not choose new behavior.
- **Source:** `architecture.md`, "## System Overview"
- **Wrong or dangerous:** stating one side as the rule, or saying there are no open issues.

**Q-A7.** How must a security threat be described in this design, and why is checking each credential on its own not enough?
- **Expected:**
  - Never by a severity word alone.
  - State the compromised capability, the lifecycle state, whether prerequisites are independent or share a failure domain, the attack window, whether the destination is fixed or attacker-chosen, the consequence, the blast radius, implemented versus ticketed controls, and the recovery opportunity.
  - Credentials that are individually insufficient can be sufficient in realistic combination.
- **Source:** `architecture.md`, "## Security Change Control"
- **Wrong or dangerous:** "threats are rated high, medium, or low," or "each key alone is harmless, so the system is safe."

**Q-A8.** How does every part of the system know it is dealing with the same loan, and what does that shared reference not do?
- **Expected:** One canonical terms value and its hash, plus a separate deployment manifest. Artifacts that do not bind exactly are rejected. The reference is not a wallet, key, source of funds, chain fact, or lifecycle action.
- **Source:** `architecture.md`, "## Purpose And Binding" and "## Cross-Domain Boundaries"
- **Wrong or dangerous:** "the loan identifier authorizes the transaction."

### 3.2 Loan Terms And Commitments guide

**Q-L1.** What does a lender commit to by publishing an offer, and what is decided later?
- **Expected:**
  - Publishing is standing approval of the commercial values only.
  - The final bound terms are approved later on an exact candidate (the guide must also report the recorded wording conflict about a second lender approval).
  - Funding is a separate, later lender decision.
- **Source:** `sr-001-...md`, "## Owns"; `loan-terms-and-commitments/domain.md`, "### One Responsibility, Shared Meaning"
- **Wrong or dangerous:** "publishing commits the lender to fund," "publishing is the final agreement," or giving only one side of the conflict as fact.

**Q-L2.** What does a borrower have at the moment an offer is reserved?
- **Expected:** An atomic, exclusive 24-hour reservation, a stable random loan identity, and a durable commercial draft. There are no final terms, no funding, no Bitcoin movement, and no signing authority.
- **Source:** `sr-001-...md`, "## Owns"; `flow-001-...md`, step 1
- **Wrong or dangerous:** "the loan is agreed, funded, or active."

**Q-L3.** What must exist before the final agreement can be committed, and what exact event commits it?
- **Expected:** Both roles' acknowledged public allocation results, both roles' preparation results (destinations and secret commitments), and one complete candidate version and hash. Both roles approve that same candidate, and the second matching approval commits it atomically, exactly once.
- **Source:** `sr-001-...md`, "## Owns"; `state-002-...md`, "## Transitions"
- **Wrong or dangerous:** "the borrower's acceptance commits it," or "the system commits once the data is complete."

**Q-L4.** What happens to approvals already given if a destination is edited before the agreement is committed?
- **Expected:** Any change to a hashed field creates a new candidate and invalidates all earlier approvals, so fresh approvals are needed. An identical retry returns the same record.
- **Source:** `sr-001-...md`, "## Failure And Recovery"
- **Wrong or dangerous:** "earlier approvals still count."

**Q-L5.** How is the description of a single loan kept apart from the description of the environment it runs in, and why?
- **Expected:**
  - The per-loan terms (participants, amounts, deadlines, keys, destinations, secret commitments) are separate from the environment manifest (chain, contracts, asset, Bitcoin network, timing policy, upgrade authority).
  - The manifest carries no URLs, credentials, application configuration, or secrets.
  - Separation prevents consumers from signing or processing different meanings under the same label, and mismatches are rejected.
- **Source:** `loan-terms-and-commitments/domain.md`, "## Domain Overview"; `sr-001-...md`, "## Owns"
- **Wrong or dangerous:** "they are one document," or "the manifest holds credentials."

**Q-L6.** Under what conditions can a participant's payment wallet become an address that receives loan money?
- **Expected:** Only by selecting it as the value of an existing recipient field for a fresh loan, through normal role authorization, fresh approvals, and disclosure. It is never silent, historical terms are never rewritten, and the payment account stays a distinct identity.
- **Source:** `loan-terms-and-commitments/domain.md`, "### Boundaries And Exceptions"
- **Wrong or dangerous:** "paying from a wallet makes it the recipient," or "it can be swapped in on an existing loan."

**Q-L7.** After a reservation is cancelled, how can that offer be used again, and what carries over?
- **Expected:** Cancellation is terminal for that reservation. Reopening needs the next reservation number and a fresh loan identity, and no earlier approval or signing material is revived.
- **Source:** `loan-terms-and-commitments/domain.md`, "### Boundaries And Exceptions"; `state-001-...md`, "## Invalid Transitions"
- **Wrong or dangerous:** "the old reservation resumes."

**Q-L8.** What does it prove when an artifact carries the correct loan identity?
- **Expected:** Which agreement the artifact describes. It does not authorize a spend or establish a chain outcome.
- **Source:** `loan-terms-and-commitments/domain.md`, "## Domain Overview"
- **Wrong or dangerous:** "it proves the transaction is authorized or completed."

### 3.3 Bitcoin Authorization And Recovery guide

**Q-B1.** How is staged collateral different from active collateral, and what does each permit?
- **Expected:**
  - The prefund is staged BTC.
  - Even at zero confirmations it permits initial construction and setup signing once the terms are committed.
  - Six unchanged confirmations are needed for funding-window opening, the acceptance gate, and reliance.
  - The escrow exists only after the actual activation winner reaches six confirmations, and the loan is package-ready active only after its terminal set is signed and recorded.
- **Source:** `bitcoin-authorization-and-recovery/domain.md`, "### Package Lifecycle And Recovery"; `inv-003-...md`; `inv-015-...md`
- **Wrong or dangerous:** "once the BTC is sent it is collateral," or "nothing can be signed before confirmation."

**Q-B2.** Which transactions are prepared and signed before the lender funds, and which only afterward?
- **Expected:**
  - Before funding: 6 activation and 6 refund candidates; the borrower signs all 12 and the lender signs the 6 activation candidates.
  - After the actual activation winner has 6 confirmations: 18 terminal packages (6 borrower recovery, 6 lender recovery, 6 borrower long-stop). The borrower signs 12 and the lender 6.
  - The guide should note the stale "12" sentence.
- **Source:** `sr-002-...md`, "## Owns"; `flow-002-...md`, steps 7–9
- **Wrong or dangerous:** "everything is signed up front," "terminal packages exist for every activation candidate," or "12 terminal packages" with no conflict note.

**Q-B3.** After the borrower has disclosed their secret and received the USDC, but the Bitcoin activation has not yet confirmed, what is the loan's status and what risk exists?
- **Expected:** Activation pending, not active. The platform keeps operating the same selected activation and can escalate only through signed tiers or approved fee-bumping. Base payment and Bitcoin activation are not atomic, so if the prefund refund confirms first, the lender is unsecured.
- **Source:** `inv-018-...md`; `sec-023-...md`, "## Honest Capability Claim"
- **Wrong or dangerous:** "the loan is active once the USDC is paid," or "the swap is atomic."

**Q-B4.** How does the borrower's Bitcoin come back after normal repayment, and what is different when the independent fallback is used instead?
- **Expected:** The lender's claim makes Y public on Base. At L1 finality the platform inserts Y into the borrower's pre-signed recovery transaction and broadcasts it, and the recovery is final on confirmation. With the fallback (activated loans only), S fills the same transaction: same output, signature, and transaction ID, with only the witness differing.
- **Source:** `bitcoin-authorization-and-recovery/domain.md`, "### Package Lifecycle And Recovery"; `iface-020-...md`
- **Wrong or dangerous:** "the borrower signs a new transaction," "the fallback uses a separate transaction," or "returned at broadcast."

**Q-B5.** If neither recovery secret ever becomes available, which time-based routes exist, and how is a clash between them settled?
- **Expected:**
  - The lender route becomes valid after Bitcoin median-time-past passes D + 259,200 s (3 days). It pays the fixed lender destination by manual export and external broadcast only.
  - The borrower long-stop becomes valid after D + 864,000 s (10 days), without secrets.
  - The lender route never expires, so both may race, and the first confirmed spend wins.
  - Base cannot revoke either.
- **Source:** `inv-008-...md`; `flow-010-...md`
- **Wrong or dangerous:** "the long-stop cancels the lender route," "the app or company picks the winner," or "wall-clock time decides."

**Q-B6.** What confirmations does a participant give when disclosing their secret on Base, and what does each one allow?
- **Expected:**
  1. The first confirmation, on the nonsecret facts, allows only local preparation.
  2. An isolated worker then unlocks the minimum needed and freezes the exact transaction.
  3. The second confirmation, bound to those bytes, allows signing and submission.
  Any failure clears the plaintext.
- **Source:** `sr-004-...md`, "## Owns"; `sr-009-...md`, "## Owns"
- **Wrong or dangerous:** "one click signs and sends," or "the first confirmation is signing consent."

**Q-B7.** How is the fee chosen for a transaction that was signed in advance, and what remains unsettled?
- **Expected:**
  - Only the six pre-signed tiers are used, and the lowest tier strictly above 1.25 times a fresh one-block estimate (integer arithmetic) is chosen.
  - If all estimators are unusable, the route is blocked and only a manual choice of an existing tier is allowed.
  - Extra fee comes only through a manually approved fee-bump child funded by the organization's wallet, which gains no participant authority.
  - Unsettled: when no tier qualifies, the sources say both "use 200 and alert" and "fail closed."
- **Source:** `iface-007-...md`; `bitcoin-authorization-and-recovery/domain.md`, "### Fees, Failures, And Recorded Choices"
- **Wrong or dangerous:** "the platform rebuilds the transaction at the right fee," or stating either no-tier behavior as settled.

**Q-B8.** What happens if a participant forgets their vault password?
- **Expected:** Nothing can recover it. Product account recovery returns ciphertext only. New signing, secret disclosure, and cooperative settlement are blocked, while already fully signed, unchanged packages still work. Missing lender signatures after confirmation are a residual risk.
- **Source:** `sr-004-...md` and `sr-009-...md`, "## Failure And Recovery"; `inv-024-...md`
- **Wrong or dangerous:** "support resets it," or "everything signed is lost."

### 3.4 Base USDC Settlement And Funding guide

**Q-S1.** Who decides whether and how a loan's principal is funded, and what may the product do on that party's behalf?
- **Expected:** The selected lender alone, explicitly, from any lender-controlled wallet or treasury (including a qualified Vault payment account), with partial deposits allowed. The product presents the vault and coordinates permissionless finalization, but never pools, custodies, draws, or substitutes capital.
- **Source:** `sr-005-...md`, "## Owns" and "## Must Not Own"; `inv-011-...md`
- **Wrong or dangerous:** "the platform draws the funds," or "the reservation or terms approval commits the capital."

**Q-S2.** When is a loan funded, and what does a USDC balance at the funding address mean before then?
- **Expected:** When permissionless finalization moves exactly the principal before the deadline and the finalized event reaches Base L1 finality. Before that the balance is provisional, and senders gain no role.
- **Source:** `iface-010-...md`; `base-usdc-settlement-and-funding/domain.md`, "## Domain Overview"
- **Wrong or dangerous:** "funded once the balance covers the principal."

**Q-S3.** What happens to the principal if the borrower never completes acceptance?
- **Expected:** The funded-but-unaccepted state lasts at most 24 hours, then expiry refunds the principal only to the fixed lender settlement recipient. The staged Bitcoin follows its own refund path. No one can accept for the borrower.
- **Source:** `state-011-...md`; `scope-003-...md`; `flow-003-...md`
- **Wrong or dangerous:** "the platform accepts for the borrower," or "funds go back to whoever sent them."

**Q-S4.** What exactly counts as a valid repayment?
- **Expected:** Exactly the debt in the registered repayment vault, finalized no later than D, with the repayment event at Base L1 finality. Payer identity, a transfer, a balance, or a submission is not enough, and payers gain no rights.
- **Source:** `inv-006-...md`
- **Wrong or dangerous:** "any transfer of the amount before the deadline."

**Q-S5.** How long does the lender have to collect a repayment, and what follows if that time passes?
- **Expected:** Strictly before C = D + 172,800 s (48 hours). At or after C the claim is permanently disabled, the refund recipient freezes, and anyone can trigger a one-time refund of the exact repayment to that frozen recipient, at any later time.
- **Source:** `sr-003-...md`, "## Owns"; `flow-005-...md`
- **Wrong or dangerous:** "the lender can claim at any time," "the refund goes to the payer," or "about two days," without the strict cutoff.

**Q-S6.** What control does the borrower have over where an uncollected repayment is returned?
- **Expected:** One optional, irreversible switch before C, signed by the borrower's committed protocol account and only to that same account. Nothing changes after C, and no arbitrary address is possible.
- **Source:** `state-013-...md`; `flow-005-...md`, step 1
- **Wrong or dangerous:** "any address," or "the application can redirect it."

**Q-S7.** What does the return of an uncollected repayment on Base do for the borrower's Bitcoin collateral?
- **Expected:** By itself, nothing. Its finalized event is the only positive trigger for the fallback on eligible loans, the Bitcoin remains unspent until another route confirms, and the lender's Bitcoin maturity is independent.
- **Source:** `base-usdc-settlement-and-funding/domain.md`, "### From Funding To Repayment"
- **Wrong or dangerous:** "the refund releases the Bitcoin."

**Q-S8.** Who can change the main loan contract, and what does that mean for loans already running?
- **Expected:** An upgradeable Transparent Proxy administered by a 2-of-3 Safe through a 7-day timelock. The vaults are immutable and ownerless, there is no on-chain pause, direct exits remain available, and existing loans are not silently migrated.
- **Source:** `base-usdc-settlement-and-funding/domain.md`, "### Failure, Authority, And Scope"; `inv-020-...md`
- **Wrong or dangerous:** "fully immutable," "operators can pause or freeze loans," or "upgrades move existing loans."

### 3.5 Base Observation And Fallback Review guide

**Q-O1.** At what point can an event seen on Base move a loan forward or start a Bitcoin action?
- **Expected:** Only at Base L1 finality. Earlier "observed" and "safe" states are display-only, and finality is not a promise of an exact waiting time.
- **Source:** `base-observation-and-fallback-review/domain.md`, "### Establishing a fact the rest of the system can use"
- **Wrong or dangerous:** "after one confirmation," or "once it shows as safe."

**Q-O2.** How many data sources must work before a Base event is trusted, and how does that compare with Bitcoin evidence?
- **Expected:** For Base, one healthy configured provider is enough (Alchemy primary, QuickNode fallback); the second gives failover and disagreement detection. For Bitcoin gates, fresh agreement between the configured observers is required.
- **Source:** `base-observation-and-fallback-review/domain.md`; `sr-006-...md`, "## Owns"
- **Wrong or dangerous:** "both Base providers must agree," or "one Bitcoin source is enough."

**Q-O3.** What does the application show, and what does it allow, when both Base providers fail or disagree?
- **Expected:** Existing finalized projections stay visible, new consequential Base-dependent actions are blocked, and the observer replays after recovery.
- **Source:** `base-observation-and-fallback-review/domain.md`; `state-014-...md`
- **Wrong or dangerous:** "everything is frozen and hidden," or "new actions continue on cached data."

**Q-O4.** What can a staff operator do if they believe an observed fact is wrong?
- **Expected:** Request a recheck through the application. They cannot change the fact, override the result, edit source records, or advance the cursor.
- **Source:** `sr-006-...md`, "## Failure And Recovery"
- **Wrong or dangerous:** "operators can correct the status."

**Q-O5.** What must already be true when a loan is created for the independent fallback service ever to help that loan?
- **Expected:**
  - The production-activation gate (counsel approval plus implementation evidence) must be satisfied before the loan.
  - The service has generated a unique per-loan secret and returned only its hash.
  - That hash is committed in the terms before escrow construction and borrower signatures.
  - It cannot be added to existing loans.
- **Source:** `sr-007-...md`, "### Establishing the capability before a loan exists"; `iface-017-...md`
- **Wrong or dangerous:** "it can be added later," or "it is available now."

**Q-O6.** What lets the fallback service release its secret, and what does the service check on its own?
- **Expected:** Only the canonical, Base-L1-finalized refund event for that loan's unclaimed repayment. The service itself verifies the chain, deployment and current implementation, event signature, loan, transaction and log, canonicality, finality, exact debt, and frozen recipient. It does not rely on the application's observer, a workspace label, or an operator. Repayment alone, a missing lender secret, elapsed time, or a balance is not enough.
- **Source:** `sr-007-...md`, "### From an unclaimed repayment to public S"; `iface-017-...md`, "## Preconditions And Validation"
- **Wrong or dangerous:** "after the lender is silent for some days," or "when the application reports it."

**Q-O7.** After the fallback secret is published, what still has to happen before the borrower has the Bitcoin back?
- **Expected:** Bitcoin finalization independently validates the gate, the publication and event binding, the hash, the retained package, the signature, the outputs, and that the escrow is unspent. It inserts the secret into the same pre-signed transaction, selects an existing fee tier, submits, and the spend must be confirmed independently. Another route may still win first.
- **Source:** `sr-007-...md`, "### From an unclaimed repayment to public S"; `flow-006-...md`
- **Wrong or dangerous:** "publication returns the Bitcoin."

**Q-O8.** If the fallback service is unreachable or never publishes, what remains true for each party?
- **Expected:**
  - The Base refund stays complete.
  - An empty or unreachable result is not proof of withholding.
  - The fallback route is unavailable.
  - There is no company release or replacement secret; an incident path applies.
  - The lender route can mature at D plus 3 days, the borrower long-stop at D plus 10 days (without cancelling the lender route), and cooperation remains possible. The first confirmed spend wins.
  - This is a residual risk, not borrower default.
- **Source:** `sr-007-...md`, "### When the path fails"; `base-observation-and-fallback-review/domain.md`, "### Limits and remaining recovery paths"
- **Wrong or dangerous:** "the company will release it," "a new secret will be issued," or "the borrower's collateral is guaranteed."

### 3.6 Participant Access And Loan Operations guide

**Q-P1.** What does signing in to the product give a participant?
- **Expected:** Role-scoped application access and retrieval of their own encrypted Vault and package data. It does not decrypt, sign, recover secrets, or make any chain action valid.
- **Source:** `sr-010-...md`, "## Owns" and "## Must Not Own"; `participant-access-and-loan-operations/domain.md`
- **Wrong or dangerous:** "signing in unlocks your wallet."

**Q-P2.** What additional checks apply before especially sensitive actions?
- **Expected:** Reauthentication within the last 15 minutes, plus TOTP if enrolled. Replacing the vault password also needs a single-use email confirmation, which cannot replace knowledge of the current vault password.
- **Source:** `sr-010-...md`, "## Owns"
- **Wrong or dangerous:** "any valid session is enough," or "email confirmation resets the vault password."

**Q-P3.** May the same person act as borrower and lender?
- **Expected:** Yes, on different loans, but never both roles on the same loan.
- **Source:** `sr-010-...md`, "## Owns"
- **Wrong or dangerous:** a flat yes or a flat no.

**Q-P4.** How does the product hand a signing task to the Vault, and what does the Vault do before signing?
- **Expected:** The product passes a short-lived, single-use code in the URL fragment, bound to the participant, role, loan, revision, and action. The separate Vault origin requires the same participant's fresh session, redeems the code once, independently reloads and validates the canonical action, and never signs bytes supplied only by the product page.
- **Source:** `sr-011-...md`, "## Owns"; `iface-004-...md`, "### One-Time Cross-Origin Handoff"
- **Wrong or dangerous:** "the product sends the transaction to sign," or "the link authorizes the signature."

**Q-P5.** If a participant's browser loses its connection right after they submit an action, how does the system avoid doing the action twice?
- **Expected:**
  - Every accepted command has a stable operation identity.
  - A same-key, same-body retry returns that operation, and a changed body is rejected.
  - State and job commit atomically.
  - Ambiguous outcomes are reconciled rather than resubmitted, and a retry needs revalidation.
  - For payments, a timeout after signing has begun is not proof of non-submission; the exact bytes are restored or the account is visibly blocked.
- **Source:** `sr-011-...md`, "## Owns" and "## Failure And Recovery"; `participant-access-and-loan-operations/domain.md`, "### Cooperation Through A Loan" and "### Payment Authority And Availability"
- **Wrong or dangerous:** "just resubmit," or "a timeout means it failed."

**Q-P6.** What does a "completed" operation in the workspace tell a participant about the blockchain?
- **Expected:** Nothing about chain finality. The operation is a receipt and the workspace a sourced projection. Base facts need L1 finality, and Bitcoin facts need the required confirmation.
- **Source:** `state-016-...md`, "## Observation And Finality"; `sr-011-...md`
- **Wrong or dangerous:** "completed means it is on-chain."

**Q-P7.** What is the local demonstration, and what does a successful demo run not prove?
- **Expected:**
  - One developer entrypoint composing the real units through public seams on loopback only, with a local Base chain and fake USDC, two connected regtest nodes, and two isolated actors.
  - Shutdown preserves state, and only an explicit reset reseeds.
  - It proves only local runnable use, not testnet, mainnet, or production operation, a security audit, or real providers.
  - Demo credentials and fixtures are rejected elsewhere.
  - Recorded status: the demo slice is blocked and its acceptance capability is unverified.
- **Source:** `sr-012-...md`; `scope-013-...md`; `build/workflow/handoffs/README.md`
- **Wrong or dangerous:** "the demo shows production readiness," or "the demo is already running end to end."

**Q-P8.** What can a company staff operator do and not do?
- **Expected:**
  - They use a separate login (Cloudflare Access, mandatory TOTP, 15-minute session, active operator permission) with viewer, operator, and security-admin levels.
  - They can perform fixed review, incident, recheck, pause, fee-tier, and fee-bump-export actions, and request already-authorized Base actions.
  - Approval is by one person, and every attempt is audited.
  - They cannot choose amounts or recipients, override chain facts, or access participant secrets, and participant login grants none of this.
- **Source:** `sr-011-...md`, "## Owns"; `sr-003-...md` and `sr-006-...md`, "## Failure And Recovery"
- **Wrong or dangerous:** "admins can move funds or fix records," or "two-person approval protects every action."

---

## 4. Review criteria: did a guide preserve the owners' meaning?

### 4.1 Procedure

1. For every must-preserve fact assigned to the guide (Section 1), mark it **Preserved**, **Weakened** (a condition, limit, or number is missing or softened), **Missing**, or **Contradicted**.
2. For every distinction in Section 2 that names the guide, check that the guide states the boundary and avoids the "must not be written as" phrasings.
3. For each conflict in 2h that the guide touches, check that both sides and the "not decided" status appear.
4. Give the Section 3 questions to a reader who has only the guide. Grade answers against "Expected" and against "Wrong or dangerous." If a wrong answer is traceable to the guide's wording, that is a guide defect, not a reader defect.
5. Read diagrams, captions, summaries, and callouts with the same strictness as the body text. In PDFs, executive summaries, callouts, and diagram labels are often the only parts read.

### 4.2 Critical defects (any one fails the guide)

- **Authority collapse.** Login, MFA, a session, a handoff link, an operator, the observer, the fallback service, the fee wallet, the gas sponsor, or the application is said to sign, decrypt, choose destinations, hold collateral keys, decide entitlement, or create chain facts.
- **Status collapse.** Any of the following is presented as equivalent to an outcome:
  - a balance, transfer, submission, relay acknowledgement, mempool presence, "safe" status, workspace status, or completed operation, treated as funding, repayment, finality, or confirmation;
  - a Base refund, or publication of the fallback secret, treated as Bitcoin recovery;
  - Base acceptance treated as Bitcoin activation or an active loan.
- **Availability overclaim:**
  - the fallback described as available now, for all loans, or as addable later;
  - the system described as implemented, verified, deployed, or production-ready;
  - the local demo described as working or proving Base L1 finality;
  - a live provider fallback or RTO/RPO claimed.
- **Conflict silently resolved.** The approval-wording, package-count, or no-qualifying-tier fee issue is stated as settled, one side is omitted, or the stale value is adopted without a note.
- **Wrong numbers or inverted conditions:**
  - C, T, or B wrong;
  - "until C" without "strictly before";
  - six confirmations misstated, or the fee tiers or strict 1.25 buffer wrong;
  - the 24-hour reservation, funding, or acceptance limits wrong;
  - the 15-minute reauthentication wrong;
  - "the long-stop cancels or expires the lender route";
  - "the lender route expires."
- **Invented capability.** Automatic organization default broadcast, forgotten-password recovery, company release or reissue of the fallback secret, liquidation, an on-chain pause, delegated borrower acceptance, platform-signed reveal calls, pooled or automatic lender capital, a second fallback transaction, or a fresh borrower signature for recovery.

### 4.3 Major defects (two or more fail the guide; one requires a correction note)

- A **condition or limit is omitted** in a way that changes who may act or when: "exactly," "once," "fixed recipient," "strictly before," "only for loans created after the activation gate," "only for the actual confirmed activation winner," "first confirmed spend wins," "one healthy provider for Base but agreement for Bitcoin," "only to the committed protocol account," or "only after the finalized event."
- A **residual risk is omitted:** activation-pending lender exposure (non-atomic), missing-Y collateral exposure after valid repayment, the post-confirmation signing window, or the shared Cloudflare failure domain.
- A **vocabulary collision is left unexplained.**
  - "Refund": unclaimed-repayment refund, funding-expiry refund, or Bitcoin prefund refund.
  - "Activation": the Bitcoin escrow activation, or the production activation of the fallback capability.
  - "Acceptance": standing offer acceptance, final-terms approvals, borrower X acceptance, or relay acceptance.
  - "Publication": offer publication or fallback-secret publication.
  - "Approval": commercial, final-terms, funding, operator, fee-bump, counsel, or UI-review approval.
- **Exclusions and deferrals are omitted** for the guide's domain (for example SCOPE-001, -003, -005, -006, -011, -013, -014, or -015 content).
- A **distinction from Section 2 is stated in only one direction.** For example, the guide says login does not sign, but implies an approved terms candidate authorizes signing.
- **Workflow records** (tickets, the decision overview, handoffs) are cited as if they override the canonical system model, or status records are presented as behavior.

### 4.4 Minor defects (record; they do not fail the guide alone)

- Naming drift that keeps the meaning, such as calling the claim cutoff "collection deadline" while keeping the exact value and strictness.
- Byte-level detail omitted: scripts, encodings, hash domains, witness stacks, provider URLs, API versions. This is acceptable if the guide does not then contradict the owners.
- Ordering simplified where authority and outcome are unaffected.

### 4.5 Acceptable simplifications

- Plain-language names for the secrets and records, if each keeps its single role.
- Exact equivalents for times, such as "48 hours after the repayment deadline" for 172,800 s. Approximations ("about two days," "a few days") are Weakened, and a Critical defect if strictness is lost.
- Naming "the owner record" instead of quoting it, provided the guide does not invent requirements that the owners lack.
- Summarizing the full fallback-check lists in the Architecture guide only, provided the Base Observation guide carries them in full.

### 4.6 Fidelity rules for every guide

- **Report silences as silences.** If the owners do not say something (for example, whether counsel approval exists, or which "former decision" says fail closed), the guide must not fill the gap.
- **Do not invent requirements, numbers, or guarantees.** In particular: RTO/RPO, waiting times for finality, success guarantees for collateral return, or security ratings.
- **Each domain PDF must stand alone at its boundaries.** Where a guide mentions an outcome owned by another domain, it must carry that boundary:
  - The Base guide must say the refund is not Bitcoin recovery.
  - The Bitcoin guide must say Base cannot revoke signatures and the fallback is production-gated.
  - The Participant guide must say workspace status is not chain truth.
  - The Loan Terms guide must say approval is not signing or funding.
- **Diagrams must not draw authority that does not exist.** For example, no arrow from the fallback service or the observer to "sign," "release BTC," or "send funds." State labels must use the owners' distinctions (observed, safe, finalized; submitted, confirmed; activation pending versus active).
- **Readiness language is prohibited** unless it quotes the claim ladder. Words such as "secure," "guaranteed," "atomic," "trustless," "automatic recovery," and "production-ready" are defects unless qualified exactly as the owners qualify them. "Atomic" is acceptable only for single-chain operations the owners call atomic, such as the reservation, the second approval, or the acceptance call on Base.

### 4.7 Suggested pass rule

A guide passes when all of the following hold:
- zero Critical defects;
- at most one Major defect, accompanied by a correction note;
- at least 90% of its assigned facts are Preserved and none are Contradicted;
- a guide-only reader answers at least 6 of its comprehension questions correctly with no "dangerous" answer that traces to the guide's wording.

The Architecture guide additionally must carry all three conflicts from 2h and the claim ladder from 2g.
