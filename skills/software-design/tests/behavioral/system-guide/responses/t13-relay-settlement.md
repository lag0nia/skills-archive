## Report: Base USDC Settlement And Funding

**Files changed (only these two):**
- `$P/system-model/domains/base-usdc-settlement-and-funding/domain.md`
- `$P/guide/domains/base-usdc-settlement-and-funding.md` (new)

No pinned file was touched: no interfaces, and neither BU-006 nor BU-007.

### 1. Inventory: where each Domain Overview item already lives

- **USDC-on-Base scope; Bitcoin under a separate authority; a payout reveals a secret but cannot sign, broadcast or confirm.** Domain Purpose and Excludes; SR-003 Must Not Own; IFACE-009 Must Not Imply.
- **Funding and repayment vault definitions; transfers stay provisional until exact finalization.** SR-003 Owns; STATE-010, STATE-012; IFACE-010, IFACE-011; SEL-021, SEL-022; CONS-012, CONS-013.
- **Payer-neutral; fixed recipients come from the terms and contract state.** SR-003 Owns; IFACE-009; INV-023.
- **SR-003 paragraph.** SR-003 Owns, Failure And Recovery and State And Artifacts; IFACE-009 (permissionless calls give no discretion).
- **SR-005 paragraph (presented facts, wallet or treasury, Vault payment account, partial deposits, no pooling, substitution or auto-draw).** SR-005 Owns and Must Not Own; INV-011; INV-027.
- **Funding to acceptance (bounded acceptance lifetime, intentional X disclosure, activation pending, active projection only on Bitcoin evidence, expiry refund, separate prefund recovery).** STATE-011; FLOW-001, FLOW-002, FLOW-003; IFACE-009, IFACE-014.
- **Repayment (balance is not repayment; exact debt by D; claim with Y strictly before C = D + 172,800 s; one switch; freeze at C).** INV-006; STATE-012, STATE-013; FLOW-004; CONS-010; IFACE-009.
- **Missed claim (permanent lost claim; one permissionless refund; `UnclaimedRepaymentRefunded` is the only positive fallback trigger; silence, time and raw activity are not; refund is not Bitcoin recovery; T = D + 259,200 s is independent).** INV-007, INV-008; STATE-013; CONS-010; FLOW-005.
- **Failures, retries and operator limits.** SR-003 and SR-005 Failure And Recovery; IFACE-009 action failure rules; SEL-021, SEL-022; CONS-019.
- **Construction and governance (immutable ownerless vaults; Transparent Proxy; 2-of-3 Safe; seven-day timelock; compatibility checks; opener replacement; no on-chain pause; direct exits during shutdown).** SR-003 Owns; SEL-009; CONS-008; STATE-019; INV-019, INV-020.
- **Vault payment account and participant transfer leave contracts and historical recipients unchanged.** SR-003 Owns; INV-023, INV-027.
- **Cooperative-settlement Base accounting deferred.** SCOPE-005 and TICKET-0049 (out-of-scope).
- **Liquidation, custody and automatic allocation excluded.** Domain Excludes; SCOPE-011, SCOPE-012.

Nothing was stated only in the narrative. The only gap was missing links in the technical sections, fixed below.

### 2. Edits to the domain record

1. **Domain Overview replaced** by the required single line:
   `The [Base USDC Settlement And Funding guide](../../../guide/domains/base-usdc-settlement-and-funding.md) explains this domain for readers. This record is its exact technical reference.`
2. **Excludes**, two bullets appended:
   - `- Public or multi-lender matching, pooled lender capital, product custody, and automatic capital deployment are excluded under [SCOPE-011](...); BTC liquidation, automated surplus return, and shortfall enforcement are excluded under [SCOPE-012](...).`
   - `- Base ledger accounting for cooperative settlement is deferred under [SCOPE-005](...); no current automatic Base effect is inferred from a cooperative Bitcoin spend.`
3. **New `## Choices And Rationale` section**, inserted before Cross-Domain Contracts. It holds one plain line starting `Open question:` (full text in section 4).
4. **Cross-Domain Contracts**, two bullets appended:
   - FLOW-001 to FLOW-005 "own the origination, funding and acceptance, preactivation-unwind, normal-repayment, and unclaimed-repayment sequences this domain takes part in."
   - "STATE-019 owns deployment, upgrade, and opener state; INV-008, INV-019, and INV-020 constrain default timing and Base separation, opener and pause boundaries, and the upgrade boundary."

Everything else in the record is byte-identical to the baseline.

### 3. Facts I could not place, and narrative errors

- **Unplaced facts:** none.
- **Narrative errors:** none outright. Two imprecisions are corrected in the guide only:
  - The narrative says "a bound lender can then claim by revealing Y". IFACE-009 lets any caller holding the matching Y claim; FLOW-004 makes the bound lender's Vault the product journey. The guide states both.
  - The narrative calls governance "2-of-3 Safe, seven-day timelock" without qualification. SEL-009 says one key holds ownership during local/test and the short public beta, and the transfer to the Safe waits on a later operation gate (LGATE-002). The guide states this.

### 4. Open questions and conflicts

**Open question (new, recorded in the domain record): is there an on-chain pause?**
- One side:
  - SR-003: "no on-chain pause".
  - SEL-009: "No ... on-chain pause authority exists". The TICKET-0048 decision says emergency response is a frontend/API pause only; the user specified this.
  - CONS-008: "V1 must not add an on-chain pause".
- The other side:
  - STATE-019: each deployment identity includes "pause/operational roles", plus a `Paused for new/risky action` state entered by a "Narrow pause trigger" from an "Authorized operational role".
  - INV-019 bounds "any pause/operational role".
  - SEC-017 also lists "pause/operational signers".
- **Why "Open question" and not a conflict:** one reading reconciles them, namely that STATE-019's pause is the frontend/API operational stop. But STATE-019 does not say whether the pause is on-chain, puts the roles in the deployment identity, and treats on-chain role state as authoritative. So the classification is uncertain, and no owner reconciles it.
- **Guide treatment:** a callout in Exceptions, plus the governance choice and the Open section, state both sides as undecided.
- **Proposal (only a proposal):** STATE-019 and INV-019 probably mean the frontend/API stop, and their wording could be aligned after the user answers.

**Checked and not recorded: upgrades versus existing loans.**
- SEL-009 says an approved upgrade "becomes the one current code path for every loan held by the proxy".
- STATE-019, INV-020 and SCOPE-007 say existing loans "remain on their originating contract", are "not silently migrated", and are not reinterpreted.
- I read these as reconcilable: the originating contract is the proxy deployment, and migration means moving to another deployment. The guide states both limits. Please confirm.

**Avoided: the coordinator's offer/reservation open question.** The guide never says whether the lender approves final terms. It only says the terms are committed and points to the loan terms guide.

### 5. Validator lines for my files

Running `validate-software-design-structure.mjs` reports only two broken links, both from my guide to sibling guides that don't exist yet:
- `guide/domains/base-usdc-settlement-and-funding.md:7: broken link bitcoin-authorization-and-recovery.md.`
- `guide/domains/base-usdc-settlement-and-funding.md:36: broken link participant-access-and-loan-operations.md.`

They will clear once those guides are written. There are no identifier, path or subset errors, and no errors on the domain record.

### 6. For the coordinator to check

- **`Open question:` line format.** I wrote it as a plain line, following the brief literally and matching your architecture record. The loan-terms domain record writes `- Open question:` as a bullet. Pick one style.
- **Status wording in the guide:**
  - The Base contract delivery is "implemented ... with local verification", and "a later delta for the local demonstration is recorded as incomplete". Source: the handoff README and the BU-002 handoff, which call the local-demo attempt INCOMPLETE.
  - Public deployment waits for a later release gate (LGATE-001) and the governance migration for a later operation gate (LGATE-002); no testnet, mainnet or production claim (SCOPE-013).
  - The Vault payment-signing profile is "planned and not yet verified", per SEL-043.
- **Origin statements** in the guide's choices section follow the decision overview (user-specified, agent-recommended and approved, or agent-chosen).
- **Minor wording in your observation guide:** its normal case says "the borrower's Base call finalizes repayment". The owners (SEL-022, CONS-013) say finalization is permissionless and normally submitted by the application worker. That sentence isn't false, but it differs from how my guide tells the same step.
