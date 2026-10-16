# Architecture guide review

Guide: `t23/bitrise21/loan-system/design/technical-design/guide/architecture.md`
Owners: `t23/bitrise21/loan-system/design/technical-design/` (paths below are relative to it)
Former overview: `t23work/original/technical-design/system-model/architecture.md` `## System Overview`

Summary: 1 Blocker, 3 Major, 7 Minor, 5 Notes.

---

## Blockers

### B1. Long-stop variants are stated as settled terminal packages, but the terminal-package count is open

Guide line 62 (and figure step `Protect`, line 77):
> "Only then does the Bitcoin domain build the terminal packages for that confirmed escrow: Ana's normal-recovery and long-stop variants and Leo's lender-recovery variants, each paying its signer's fixed destination."

The records leave the terminal set open:
- `system-model/domains/bitcoin-authorization-and-recovery/domain.md:49`: "Unresolved source conflict: [SR-002] `Owns` says 'the 12-package signed terminal phase must receive its own R2/D1 receipt', while SR-002's terminal-construction statement, IFACE-005 ..., STATE-009, and STATE-015 specify six borrower-recovery, six lender-recovery, and six borrower-long-stop variants."
- The twelve-package side also includes `build/records/constraints/cons-014-durable-signed-exit-package-archive.md:14`: "construct only that parent's six-normal/six-default terminal phase", and `system-model/contracts/interfaces/iface-004-vault-envelope-and-local-handoff.md:57`: the signing batches are "borrower post-confirmation signing of six normal-recovery variants; and lender post-confirmation signing of six default variants". No long-stop batch is listed.

The guide states the eighteen-package side as fact at the step where the packages are built. Its own line 123 says "whether the long-stop variants are among the signed terminal packages also turns on the open terminal-package count", and line 183 lists the count as open. A limit given in another section does not repair the passage that narrates the step. Line 62 is next to the long-stop *protection* question but not the package-*count* question.

---

## Major

### M1. "Holder ... taking the collateral" leaves out the fixed-payout limit

Guide line 157:
> "It cannot stop a lender, or a holder of the lender's signed package, from taking the collateral after the borrower repaid but the lender stayed silent, unless a borrower route confirms first;"

Owners:
- `system-model/contracts/security/sec-025-lender-or-package-holder-broadcasts-default-after-valid-repayment.md:57`: "the package holder may not redirect the fixed payout". At line 34: "BTC may pay the fixed lender destination even though the borrower paid." At line 38: "a random package thief cannot redirect value".
- `system-model/contracts/interfaces/iface-018-manual-lender-default-package-export.md:90`: "`SIGHASH_ALL` keeps the fixed lender destination."

The sentence says a package holder can *take* the collateral. A holder can only force payment to Leo's fixed destination. Lines 121, 129 and 149 state the limit correctly, but this list item narrates the same step without it.

### M2. Escrow existence and the end of activation-pending are tied to "confirms", not to six confirmations

Guide:
- Figure step line 76: "Activate | The platform broadcasts one activation with X; the escrow exists once it confirms."
- Line 20: "It becomes the loan's escrow only when an activation transaction spending it confirms."
- Line 58: "from here until the escrow confirms, the loan is activation pending"

Owners:
- `system-model/contracts/invariants/inv-003-prefund-escrow-separation.md:14`: "active escrow exists only after the exact activation transaction and expected escrow output reach six confirmations."
- `system-model/contracts/invariants/inv-018-activation-pending-recovery.md:14`: activation pending lasts "until its expected escrow output reaches six confirmations".
- `system-model/contracts/states/state-015-bitcoin-escrow-and-terminal-outcome.md:21`: "Activation pending | ... expected escrow output is not yet six-confirmed."
- `system-model/behavior/flows/flow-002-activation-completion-and-active-entry.md` Outcomes: "Six confirmed activation confirmations establish the escrow parent."

Line 62 states six confirmations correctly. The figure step and the two narrative sentences read as a single confirmation. This matters because the lender's activation-pending exposure lasts until six confirmations.

### M3. The Vault hand-off is narrated as carrying each step, with no statement that it is only an expiring pointer

Guide line 38:
> "Participant Access And Loan Operations carries each step to the participant's Vault and to the Base contracts."

The table at line 36 also says "the hand-offs to each Vault". The guide never states the hand-off's limit.

Owner: `system-model/contracts/interfaces/iface-004-vault-envelope-and-local-handoff.md:51`: "A handoff code is an expiring pointer, not authentication, transaction consent, or cryptographic authority." Line 143 adds: "neither the code nor authentication alone is consent".

The former overview said the domain "sends narrowly bound actions to participant Vaults". The guide's "carries each step" drops "narrowly bound" and never says that the hand-off grants no consent or authority. Line 13 (login is not authority) and line 48 (destination selection and acknowledgements are not authority) do not cover the hand-off itself.

---

## Minor

### m1. Open-question sides carry wording that only some cited records state (lines 46, 181)

- Side B: "The loan-terms responsibility, the terms interface and the origination flow say that neither publication nor reservation approves or commits the final bound terms". Only SR-001 (`system-model/domains/loan-terms-and-commitments/responsibilities/sr-001-...md:31`, "Neither publication nor reservation approves or commits final bound terms") states the publication half. IFACE-001:57 speaks only of reservation ("it does not create a canonical agreement or approve the final bound terms"). FLOW-001's precondition (`flow-001-...md:19`) says "its publication is standing acceptance".
- Side A: "the exclusion record for multi-lender matching" (SCOPE-011:14) and IFACE-003:19/91 say "standing lender acceptance" and "no second lender approval". Neither says reservation "creates the canonical loan". The architecture record and SEL-012 carry that.

The substance of each side matches the declared conflict (architecture.md:23; loan-terms domain.md:44), so a reader would not be misled about the dispute itself.

### m2. Order and gate in the Y claim (line 66)

> "after fresh reauthentication and multi-factor authentication, his Vault unlocks `Y` and, with the same two-confirmation pattern, ... signs and submits the claim."

`flow-004-normal-repayment-close.md` step 3 and IFACE-004:55 put the first confirmation *before* the minimal unlock. The sentence reads as unlock first. On the gate: IFACE-004:118 and IFACE-018:47 say "any enrolled TOTP", while FLOW-004 says "fresh reauthentication/MFA". Unconditional MFA follows FLOW-004 but is stronger than IFACE-004.

### m3. "Leo verifies them" (line 52)

> "Ana signs all twelve; Leo verifies them and adds his signature to the activation candidates."

"Them" reads as all twelve. FLOW-001 step 7 says the "lender verifies and adds its signature to all activation variants". IFACE-004:57 lists the lender's batch as "the same six activation variants". The signing roles themselves are correct.

### m4. Package definition excludes cooperative settlement (line 21)

> "Apart from the borrower's prefund, each Bitcoin movement uses a package: a transaction the participants signed before it is needed"

Cooperative variants are freshly signed at settlement time (FLOW-009 step 3; guide line 133). The organization's CPFP child is not a participant package either (line 14).

### m5. "When a public secret becomes final on Base" (line 102)

`S` is never published on Base. IFACE-020's Boundary is "Only a canonical finalized public secret event may cross from Base observation or the production-activated ECVS into Bitcoin finalization." The sentence covers `X`/`Y` correctly but implies a Base origin for every public secret.

### m6. Unqualified fixed-route claim in the opening (line 3)

> "It is built so that each asset moves only through fixed routes that the contract rules and the participants' own signatures allow, and so that the product and the organization running it never hold lender capital"

Upgrade authority is open (base-usdc domain.md:48: INV-020 2-of-3 Safe vs SEL-009 single key during "the intentionally short public mainnet beta"). Upgrade reach is also disputed. INV-020:14 says "existing loans remain on their originating contract and are not silently migrated". SEL-009 says "A compatible approved upgrade becomes the one current code path for every loan held by the proxy." SEC-017 adds: "The claim that the company cannot redirect Base funds is only as strong as the deployed administration model". It prohibits support for "an unqualified immutable/noncustodial claim". The opening states design intent, and line 151 treats upgrade control as open, so this is Minor. A clause such as "subject to the open upgrade-control question" would fix it.

### m7. Normal recovery does not say Y must be final (line 66)

> "The platform inserts the public `Y` into Ana's already signed recovery transaction and broadcasts it"

FLOW-004 step 5 requires "Finalized public `Y`". Line 68 in the same section says each cross-chain hand-off waits for a final fact, so a reader is unlikely to miss it.

---

## Notes

- n1. **Upgrade reach is not in Open questions.** The INV-020 vs SEL-009 dispute over whether upgrades reach existing loans is not listed. Line 151 ("if upgrades could alter existing funded loans") correctly keeps it conditional, so nothing is stated as settled.
- n2. **ECVS failure cases (SR-007:39–41).** The guide does not restate each case's outcome. Outage is recoverable by replay of the same `S`. Loss, compromise or withholding has no replacement secret. In all cases the Base refund stays valid. Line 175 lists the causes without assigning outcomes, so nothing is misstated.
- n3. **Deterministic local verification (line 166).** The guide says "planned and unverified" (VA-001). The hand-off README:23 also reports "BU-010 snapshot `94f7b70f…` passed its current and filtered-fresh-copy aggregates". The guide correctly gives the most limited status.
- n4. **Line 123's link** between the long-stop question and the terminal-package count is the guide's inference, not a record sentence. CONS-014 and IFACE-004 support it (see B1).
- n5. **Line 152** (product account takeover) leaves out SEC-002:35's further consequences ("hide notifications, initiate misleading UI ..., or export fixed packages"). Nothing stated is wrong.

---

## Checked and found faithful (no finding)

- **Class 1:** lines 121, 129, 149 and 173 keep the fixed lender payout. Line 157 is the only gap (M1).
- **Class 2:** lines 58, 62, 68, 112 and 156 keep activation pending and the lender's unsecured-principal risk beside each narration. The figure is introduced by the risk sentence at line 68.
- **Class 3:** lines 15, 22, 99, 120 and 175 always pair committed `H(S)` with the production-activation gate. Line 120 gives the current status, unavailable.
- **Class 4:** line 116 matches IFACE-017 ("must never gate the Base refund") and SR-007:15 ("does not itself unlock Bitcoin").
- **Class 6:** line 58 matches IFACE-004:55/254 and FLOW-002 step 4.
- **Class 7:** upgrade authority and pause are open at lines 151, 184 and 185, with correct attributions. See m6 and n1.
- **Class 8:** "Ana signs all twelve" and terminal "each participant signs only their own routes" match FLOW-001 step 7 and FLOW-002 step 8 (see m3).
- **Class 10:** the shared loan reference (line 84) is attributed correctly: the architecture record and SR-001:28 vs IFACE-001:61. The long-stop question (line 123) matches the declared Open question exactly. Fee (182), package count (183), upgrade (184), pause (185) and payment status (86, 94, 187) match their declared lines.
- **Payment-account disputes:** the guide does not state lender payment-account purposes (SR-009 vs IFACE-022) or operator retry after escalation (IFACE-022/STATE-021 vs SEC-028), so it settles neither.
- **Values:** `C = D + 172,800`, `T = D + 259,200` and `B = D + 864,000` (INV-008, FLOW-005). Timing: 67 h, 24 h and 19 h (INV-002, FLOW-001/002). Six fee variants; about 20 minutes to L1 finality (SEL-013:23). The outage cost of delaying Bitcoin action after a secret is public comes from SEC-019:36. Backup loss window: SEC-007:62. Simplicity trade-off: SEL-024:25. Local-demo status: hand-off README:23. Decision attribution: architecture.md decision table.
- **Former System Overview:** all consequential points appear. These are the domain separation and its three examples, each domain's role, Y on normal repayment, Base refund on lender silence with `S` only for an activated precommitted loan, confirmation-only finality, and the approval and fee/count discrepancies left open. The one loss is "narrowly bound actions", which became "carries each step" (M3).
