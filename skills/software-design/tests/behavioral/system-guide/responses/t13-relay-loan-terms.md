Report for domain `loan-terms-and-commitments` ("Loan Terms And Commitments")

Files changed (only these two):
- /private/tmp/claude-501/-Users-alanguerrero-Documents-ai-prompts/b72a9647-f430-4577-b73d-46cf594be5b3/scratchpad/eval/t13/bitrise21/loan-system/design/technical-design/system-model/domains/loan-terms-and-commitments/domain.md
- /private/tmp/claude-501/-Users-alanguerrero-Documents-ai-prompts/b72a9647-f430-4577-b73d-46cf594be5b3/scratchpad/eval/t13/bitrise21/loan-system/design/technical-design/guide/domains/loan-terms-and-commitments.md (new)

## 1. Inventory: what the old narrative said and which record holds it

- All artifacts must agree on participants, amounts, deadlines, destinations and secret commitments, and the domain owns that shared meaning: INV-001, SR-001 Purpose, domain Purpose, IFACE-001.
- A matching identifier proves which agreement an artifact describes but does not authorize a spend or establish a chain outcome: IFACE-001 Must Not Imply, INV-012, architecture Purpose And Binding.
- Firm offer means the lender's proposed commercial values: SR-001 Owns, IFACE-003 ACT-001.
- Reservation selects one offer revision and creates a stable random `loan_id`: SR-001, IFACE-003 ACT-002, FLOW-001 step 1, SEL-012.
- LoanTermsV1 is ordered and versioned, and terms_hash binds the encoded values: IFACE-001, SR-001.
- ProtocolDeploymentV1 holds environment identity and excludes URLs, credentials, secrets and mutable state: IFACE-002, SR-001, TICKET-0075.
- "Separating loan facts from environment facts prevents divergent meanings" is rationale. It is now placed in the domain record's Choices And Rationale; the decisions themselves are in TICKET-0001 and TICKET-0075.
- SR-001 is the single responsibility and covers identity, encoding, candidates, approvals, commitment, cancellation and supersession: SR-001 Owns.
- Consumers (Bitcoin package binding, Base recomputing the hash, observers validating the deployment, the workspace presenting the candidate, the Vault checking role and loan): IFACE-001, IFACE-002, IFACE-005, IFACE-004 ACT-008, TICKET-0004, TICKET-0006.
- Ordering of reservation, then allocation, then preparation, then candidate, then dual approval, then atomic commit; invalidation on any hashed-field edit; idempotent retry; rejection classes: SR-001 Owns and Failure And Recovery, STATE-002, IFACE-001, IFACE-013 ACT-002, FLOW-001 steps 1 to 4.
- Key, EOA, payout destination and payment account are separate; a payment account never silently becomes a recipient or caller; a fresh-loan recipient selection needs fresh approvals and historical terms stay unchanged: INV-023, INV-012, FLOW-001 Failure And Reroute, architecture.
- A snapshot or workspace copy is not a second authority: SR-001 Must Not Own, IFACE-001 Boundary and Failure Meaning.
- Consumer rejection classes, pre-activation amendment, and cancellation requiring a fresh loan identity: SR-001, IFACE-001, IFACE-002, STATE-001, STATE-002, SEL-012.
- Canonical-encoding rationale ("interoperability and verifiability…") was stated only in the narrative. It is now placed in Choices And Rationale, with attribution linked to TICKET-0001, TICKET-0004 and TICKET-0075.
- Lender keeps the funding decision after commitment: INV-011, SEL-012, SR-001 Owns.
- Other domains' authorities: domain Excludes, SR-001 Must Not Own.
- Exclusions: SCOPE-011 covers matching, pooling, custody and automatic deployment. Liquidation is in SCOPE-012 (see section 3).
- "A narrative or diagram cannot supply a missing approval" is a method rule, not a domain fact. It is not placed in the record; the guide restates it.

## 2. Exact edits to the domain record

- The whole `## Domain Overview` section (old lines 11 to 34) is replaced by:
  `The [Loan Terms And Commitments guide](../../../guide/domains/loan-terms-and-commitments.md) explains this domain for readers. This record is its exact technical reference.`
- Excludes, new bullet:
  `- The exclusion records are [SCOPE-011](../../contracts/scope/scope-011-public-multi-lender-pooling-custody-and-automatic-capital.md) for public or multi-lender matching, pooled capital, product custody, and automatic capital deployment, and [SCOPE-012](../../contracts/scope/scope-012-bitcoin-liquidation-surplus-and-shortfall.md) for BTC liquidation, automated surplus return, and shortfall enforcement.`
- New `## Choices And Rationale` section, inserted immediately before `## Cross-Domain Contracts`, with two bullets:
  - The `Open question:` line. Its full text is in section 4.
  - `` - `LoanTermsV1` is one fixed, ordered, versioned ABI-encoded tuple whose domain-separated `terms_hash` binds the exact encoded values, and environment-wide facts stay in the separate `ProtocolDeploymentV1` manifest. Recorded reason: interoperability and verifiability; divergent encodings, or immutable loan facts mixed with deployment facts, could bind signatures, manifests, and chain actions to different loans, let different consumers sign or process different meanings under the same label, or make a package impossible to reproduce. Attribution: [TICKET-0001, TICKET-0004](…/sr-001-tickets.yaml) and [TICKET-0075](…/sr-001-deployment-configuration-tickets.yaml). ``
- Cross-Domain Contracts, two new bullets:
  - `- [INV-012](../../contracts/invariants/inv-012-authority-separation.md) keeps canonical term meaning separate from participant, application, Base, and Bitcoin authority, and [INV-023](../../contracts/invariants/inv-023-key-destination-and-refund-separation.md) keeps protocol keys, protocol EOAs, Vault payment accounts, and payout destinations distinct.`
  - `- [FLOW-001](../../behavior/flows/flow-001-origination-preparation-and-qualification.md) orders the cross-domain origination steps from reservation through terms commitment to prefund qualification.`
- Everything else is byte-identical to the baseline (checked with `diff`). No pinned record was touched.

## 3. Facts not placed, and where the old narrative was wrong

- **Liquidation was cited to the wrong record.** The narrative put liquidation under SCOPE-011. SCOPE-011 does not mention liquidation; SCOPE-012 owns that exclusion, and INV-011 links it. I linked SCOPE-012 in Excludes, and the guide cites it.
- **The narrative was incomplete on preparation.** It said only "the borrower prepares its public destination and H(X)". FLOW-001 step 3 and IFACE-004 ACT-009 show both roles prepare (the lender's destinations and H(Y) too). The guide follows the owners.
- **Stale consumer outside my files (I did not edit it).** SR-001's Responsibility Overview says "the Domain Overview explains the full cooperation scenario". Proposed owner: SR-001. Proposed wording: "the Loan Terms And Commitments guide explains the full cooperation scenario", with a link to `../../../../guide/domains/loan-terms-and-commitments.md`.
- **Derived artifact to refresh (coordinator).** `visuals/assets/sources.json` binds the hash of this domain record, so it needs regenerating.

## 4. Open question: lender approval of final terms

Classification: **Open question** (uncertain), not a conflict.

- **Staged reading.** A staged reading is plausible for part of the wording:
  - SR-001 says publication approves the "commercial values only".
  - STATE-001 calls the lender's final-terms approval "distinct from its earlier commercial-offer approval".
  - TICKET-0069's resolution says "no … second lender commercial approval".
- **What that reading cannot cover.**
  - SEL-012: "there is no second lender-approval step" (unqualified).
  - SCOPE-011: "no second lender approval" (unqualified).
  - Architecture: "reservation creates the canonical loan without a second lender approval". STATE-002 says no canonical agreement exists until commitment.
  - No record reconciles every statement.
- **Both sides have human-approved support:**
  - TICKET-0069 (user-specified): "no email invitation or second lender approval".
  - TICKET-0005 (human-approved, agent recommended): commit only with both matching role acceptances.
  - TICKET-0150 (user-specified): "Both participants approve the final terms separately afterward."

The line I recorded:
"Open question: the architecture record (Purpose And Binding and Cross-Domain Boundaries), the one-loan offer and reservation contract [IFACE-003], the one-loan offer selection [SEL-012] and the public or multi-lender matching exclusion [SCOPE-011] say that offer publication is standing lender acceptance and that reservation needs no second lender approval, and the selection adds that there is no second lender-approval step; [STATE-001], [STATE-002] and [SR-001] require matching borrower and lender approvals of the final candidate terms before commitment, a lender final-terms approval distinct from its commercial-offer approval, as do [IFACE-001] and [FLOW-001]. Whether these statements describe different stages or contradict each other is undecided."

My line adds SCOPE-011 to the first side, and IFACE-001 and FLOW-001 to the second, because both state the dual approval. You may want the architecture line to match.

Where the guide states it as undecided:
- the offer concept bullet;
- the normal-case approval paragraph;
- the figure caption and its Approve step;
- the pre-activation amendment paragraph;
- the "Approval of final terms" choice paragraph;
- a callout in Open, excluded and deferred.

## 5. Validator lines naming my files

- Four "broken link" errors in my guide, to `participant-access-and-loan-operations.md` (twice), `bitcoin-authorization-and-recovery.md` and `base-usdc-settlement-and-funding.md`. They will resolve once the parallel agents' guides exist.
- No errors for the domain record.
- No identifier, path or subset errors.

## 6. For the coordinator to check

- **SR-001 and STATE-002 disagree on terms state names.** SR-001 lists `commercial_draft`, `awaiting_allocations`, `awaiting_final_approvals`, …; STATE-002 has Commercial draft, Awaiting acceptances, Committed, Cancelled, Superseded and no awaiting-allocations state. The guide avoids the names. Possible naming drift.
- **Possible open point on reservation expiry before commitment.** SEL-012 says any reservation with no valid prefund at the deadline is cancelled, reopened and given an infraction. STATE-001 routes an unused reservation that expires before terms commitment to a terminal "Expired" state and gives the infraction rule only after commitment. The guide restates STATE-001's split without saying whether an infraction applies before commitment. STATE-001's authority is SR-011, in Participant Access.
- **Minor wording difference on offer contents.** SEL-012 says an offer "states its available principal, rate, and dates". IFACE-003 offer terms carry principal, total debt, deadline, protection expiry and collateral. The guide follows IFACE-003.
- **Delivery status stated in the guide**, from the handoffs README:
  - earlier slices are recorded as Implemented;
  - the ACT-009 preparation change to Core is planned but not yet executed;
  - the local demo is blocked;
  - testnet, mainnet, environment-complete manifest publication and production activation are later gates.

  Please confirm this matches your architecture guide.
- **Interpretation of the cancellation rule.** STATE-002 allows cancellation only before commitment (from draft or awaiting acceptances). TICKET-0005 says "before Bitcoin or USDC action". The guide follows STATE-002.
- **No independent review.** Self-review was applied; there was no independent reviewer for migration steps 4 and 5.
