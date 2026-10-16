# Answer Key Correction v3

This file amends [expectations.md](expectations.md) (v1, SHA-256 `f376b8b03553f94765e1b156a0ad97faa3c6ea961e4838b8320e5de1ed96af6a`) as already amended by [expectations-v2.md](expectations-v2.md) (SHA-256 `cf26470fe309405db5b7efbf5b816ca68a69849b0fa5aeefe4454cb63d069d77`). Both earlier files stay unchanged. Every score recorded in [results.md](results.md) and [scoring.md](scoring.md) stays as scored. For each correction, part 1 states what the correction would change in those scores. Runs from T14 onward are scored under v1 as amended by v2 and v3.

## 0. Provenance

- **Written after T13 and before any T14 output existed**, by the coordinating session. No authoring agent sees v1, v2 or v3.
- **Sources:** every correction was checked against the pristine copy `scratchpad/eval/pre/...`. Quotes and line numbers are from that copy.
- **Origin:** the T12 and T13 reviewers ([T12 A](responses/t12-review-a.md) part 5, [T12 B](responses/t12-review-b.md) part 6, [T13](responses/t13-review.md), and their summaries), and the T13 record changes ([diff](outputs/t13/record-changes.diff)). Each claim was verified against its source before it entered this file. Claims that reviewers did not make are not added.
- **Thresholds are unchanged.** No acceptance rule from v1 4.7 or v2 part 5 is removed or relaxed. Corrections 1.1 to 1.3 remove requirements the sources do not support. The others add sources, settle how silence is scored where v2 was ambiguous, or add checks.

## 1. Corrections

### 1.1 O-4 and Q-O3: provider disagreement and dual outage (v2 part 3)

- **Error:** v2 required a split between source disagreement and dual outage, each with its own handling and alert time, and scored merging them as a Minor defect.
- **Source:** the resolution of TICKET-0053 gives one rule: "A simultaneous-source disagreement or dual outage preserves existing finalized projections, alerts operations after five minutes". The only unmerged difference in `sel-014-...md` is line 35: an outage shows fresh Base data "as delayed".
- **Corrected requirement:** one rule for both cases is faithful. It keeps finalized projections, takes no new Base-derived action, alerts operations after five minutes, and allows no manual override. Showing fresh Base data as delayed during an outage is a Minor detail. Inventing an override stays Critical.
- **Effect on earlier scores:** the Q-O3 partials of T10 and T13 rested on the split alone, so both become met. T10's reader total moves from 14/2/0 to 15/1/0, and T13's from 14/2/0 to 15/1/0. The partials in T9 and T12 rest on the missing replay after an outage, and are unchanged. No acceptance verdict changes: T10 and T13 fail on other confirmed defects.

### 1.2 Key 4.6 and O-2: finality waiting time

- **Error:** v1 4.6 lists "waiting times for finality" among invented numbers. O-2 cites the phrase "not a promise of an exact waiting time" from the removed observation narrative.
- **Source:** `sel-013-...md`: "Base documents that stage as roughly 20 minutes", and L1 finality "delays each consequential handoff by roughly 20 minutes". In the pristine package, the "exact waiting time" phrase exists only in the observation `domain.md` narrative that migration removes.
- **Corrected requirement:** giving roughly 20 minutes as Base's documented estimate is faithful. Presenting it as a fixed or promised delay stays a defect. O-2's last clause is met by any wording that keeps the estimate approximate, so the narrative phrase need not survive in an owner. A migration that drops it without keeping SEL-013's "roughly" is a technical-diff finding.
- **Effect on earlier scores:** none. Every reviewer from T9 onward treated the figure as faithful and noted the key error, and no verdict rested on it.

### 1.3 2h-2: the "stale" label

- **Error:** v1 2h-2 records the 12-package sentence as "stale", a label only the removed Bitcoin narrative applies.
- **Source:** no surviving record calls either side of the package-count conflict stale. `sr-002-...md` holds both statements.
- **Corrected requirement:** a guide presents the package count as an unresolved conflict with both statements. A guide or record that labels either side stale, current or older answers the conflict, which is a Major defect. Dropping the narrative's label is correct.
- **Effect on earlier scores:** none. T9 (B4) and T12 (B1, B2, B6) already rated the dropped label as Minor or no defect.

### 1.4 2h-8: on-chain pause

- **Sources added:** `inv-019-...md` line 14: "Any pause/operational role is narrow and cannot reveal secrets, alter committed terms/recipients, withdraw funds, fabricate chain facts, or mutate existing loan authority." `sec-017-...md` line 14 lists "opener/pause/operational signers" among the protected authority. Line 51 says "INV-019 owns opener/pause limits", and line 66 directs "pause new funding" after a Base compromise. With `state-019-...md` lines 15 and 26 ("Paused for new/risky action"), four records describe a pause role or state. `sel-009-...md`, `sr-003-...md` and `cons-008-...md` say V1 has no on-chain pause. No owner says whether the pause role acts on-chain.
- **Corrected requirement:** the point is open, with its classification uncertain under [Open Questions](../../../references/system-guide.md#open-questions). A guide that relies on the pause states that whether V1 has an on-chain pause role is unresolved, with both sides, or links an `Open question:` line that does. Examples are incident response, what stays available during a stop, and what an operator can halt. Stating "no on-chain pause" as settled where a guide relies on it is now a Major defect: an unresolved point presented as settled. v2 accepted that wording. Asserting that an on-chain pause exists stays a defect.
- **Effect on earlier scores:** stricter. Runs before T12 that stated "no on-chain pause" as settled would gain a Major finding. All of them already fail. T12 and T13 recorded the pause as open, and neither guide set was reviewed as stating it settled. No verdict changes.

### 1.5 2h-5: what an upgrade does to running loans

- **Source added:** `sel-009-...md` line 40 also says "each loan remains pinned to its originating deployment identity". That may mean the proxy deployment, which an upgrade keeps, or the original contract code, which it replaces. No owner says which.
- **Corrected requirement:** unchanged. A guide that relies on upgrade reach presents it as unresolved, giving SEL-009 line 32 ("the one current code path for every loan held by the proxy") and the originating-loan statements of INV-020 and STATE-019. It may quote SEL-009 line 40 as a possible reconciliation, but it must not adopt it.
- **Effect on earlier scores:** none.

### 1.6 2h-1: lender approval, side A

- **Sources added:** `state-010-...md` "## Invalid Transitions" line 46 lists "second lender approval" among the invalid transitions of the funding vault. TICKET-0069's resolution (`sr-010-tickets.yaml` line 93) says "no email invitation or second lender commercial approval". Side B's `state-001-...md` separates "final-terms approval" from "commercial-offer approval", so the word "commercial" may bear on the conflict.
- **Corrected requirement:** unchanged. The owners flag the conflict, and a guide keeps both sides and says the point is undecided.
- **Effect on earlier scores:** none.

### 1.7 Distinction 2c, refund 2: funding expiry versus unaccepted funding

- **Error:** 2c item 2 says both refunds transfer the principal.
- **Source:** `iface-009-...md` line 31: `refundExpiredFunding` "returns the funding vault's current configured-USDC balance only to fixed `lender_base_settlement_recipient`". Line 33: `refundUnaccepted` "Returns principal exactly once to fixed `lender_base_settlement_recipient`".
- **Corrected requirement:** after an unfinalized funding deadline, the funding vault's current balance returns to the fixed lender settlement recipient. After funded acceptance expires, the principal returns to the same recipient, exactly once. Saying that expired funding returns the principal is a Minor wrong value. S-5 and Q-S3 are unchanged, since Q-S3 asks about unaccepted funding.
- **Effect on earlier scores:** T12's settlement guide (line 39) gains a Minor finding. It already fails. No verdict changes.

### 1.8 O-16: "eligible" as a vague quantifier (v2 part 4)

- **Ambiguity:** `sr-007-...md` itself writes "For an eligible loan" (line 23).
- **Clarified requirement:** a guide passage on the fallback that says "eligible" without stating both conditions, in the same passage, is the vague-quantifier Major defect. The conditions are H(S) committed when the loan was created, and the production-activation gate. When the guide names both conditions there, "eligible" is fine.
- **Effect on earlier scores:** none. T12's reviewer scored it this way.

### 1.9 2h-7: a guide that states neither caller scope (v2 part 2)

- **Ambiguity:** v2 does not say how to score silence.
- **Clarified requirement:** a guide that describes the participant's Vault-controlled reveal, and asserts neither "only the Vault-derived caller can execute it" nor "any caller's reveal is a valid protocol transition", has no defect.
- **Effect on earlier scores:** none. T12's reviewer scored it this way.

### 1.10 Tensions the key lacked (2h-10 to 2h-12)

T13 recorded three tensions as `Open question:` lines. Each quoted statement was found verbatim in the pristine copy. Each one's classification is uncertain.

- **2h-10, raising the fee on an activation already in a mempool.** `inv-018-...md` line 14: the platform "resumes/rebroadcasts that exact route idempotently, escalating through signed tiers or separately approved CPFP". `iface-007-...md`: "Once an activation or terminal candidate is accepted, it is the sole parent and only CPFP may add fee".
- **2h-11, which relay path carries the long-stop and cooperative transactions.** `iface-008-...md` line 15: "A relay accepts only an already finalized, eligibility-gated activation, normal-recovery, or automatic-refund raw transaction". Against it: `flow-010-...md` step 2, "Request relay of immutable finalized bytes through the existing constrained path"; `sec-025-...md`, "the separately pre-signed borrower long-stop can be relayed without a secret"; and `iface-019-...md`, "The platform may select and broadcast one" cooperative variant.
- **2h-12, wallet proof in local-demo acceptance.** `cons-026-...md` line 22: human-facing acceptance "separately proves wallet setup with an installed EIP-1193 extension". `sel-042-...md` line 17 retains the installed-wallet path only "for historical regression and compatibility context". This is build-level, and no guide must-preserve fact depends on it.

**Accepted:** recording each as an `Open question:` line that quotes each side from its own record, or a guide passage that does not assert a side another owner contradicts. **Defect:** a guide that narrates the step and states one side as settled (Major for 2h-10 and 2h-11, Minor for 2h-12). So is a record line that attributes a statement to a record that does not hold it (part 2, case 10).

**Effect on earlier scores:** none. Earlier reviews did not check these points, and they are not re-scored.

## 2. Regression cases

These ten failure classes were confirmed in T8 to T13. From T14 onward, each is checked in every guide, figure step, caption, table, summary and callout that reaches it, and in each guide on its own: a limit stated in another guide does not repair a passage. Each case names its owners. Items already in v1 or v2 keep their severity. Otherwise a missing limit where the step is narrated is a material omitted condition (Major and an acceptance blocker, v2 part 5).

1. **Stolen lender-default package** (A-16, B-16, Q-A9, Q-B9). Anyone holding the matured package can broadcast it, but the payout goes only to the fixed lender destination. `sec-025-...md` line 57: "the package holder may not redirect the fixed payout". It is checked wherever a guide narrates package export, broadcast or theft.
2. **Activation-pending race** (B-6). After Base acceptance the loan is activation pending. If the borrower's prefund refund confirms first, the lender's principal is unsecured. Sources: `inv-018-...md` line 14, and `sec-023-...md` "## Lifecycle Impact" and "**Direct consequence.**". It is checked wherever a guide narrates acceptance through activation.
3. **Both fallback eligibility conditions** (O-16, v2 part 4, 1.8 above). H(S) committed when the loan was created, and the production-activation gate. It is checked wherever the fallback, S or ECVS recovery is described.
4. **The Base refund does not depend on the fallback** (S-10, S-11). `iface-017-...md` line 15: the ECVS "is not required for and must never gate the Base refund", and the refund "does not itself unlock Bitcoin" (`sr-007-...md` line 15). It is checked wherever the unclaimed-repayment refund or the fallback is narrated.
5. **Vault handoff authority** (P-6, v2 part 4). The handoff code is "an expiring pointer, not authentication, transaction consent, or cryptographic authority", and "The Vault never signs bytes supplied only by the normal-product page" (`iface-004-...md` lines 51 and 53). Wording that only narrows it ("not a general signing permission") is Major.
6. **What each disclosure confirmation authorizes** (B-12). The first authorizes only local preparation. The second, bound to the exact bytes, authorizes signing and submission. A failure or cancellation clears the plaintext.
7. **Upgrade authority, upgrade reach and pause are open wherever relied on** (2h-5, 1.4 and 1.5 above).
8. **Signing roles in figures and prose.** `flow-001-...md` step 7: "Borrower signs all activation and refund variants; lender verifies and adds its signature to all activation variants". "Both participants sign the activation and refund transactions" contradicts an owner, which is an acceptance blocker (v2 part 5), at least Major.
9. **Failure summaries keep each outcome.** `sr-007-...md` lines 39–41: an outage "may be recovered by independent verification and public replay"; loss, compromise or withholding "requires the defined incident path"; early disclosure is "itself dangerous"; and "unspent Bitcoin can still be reached by other already-authorized routes". A summary that says recovery is unavailable "in every case" is Major.
10. **Attribution in open-question and conflict lines.** Each record named on a side holds the statement attributed to it. T13's line attributing external-payer compatibility to SR-012 is the confirmed instance: that phrase is only in SEL-043's proof list. A misattribution in a record is an unauthorized technical change (v2 part 5). In a guide, it is a changed meaning (Major).

## 3. Coverage evidence

From T14 onward, guidance v7 requires a coverage ledger per guide, outside the package and the PDF folder. Reviewers receive the ledgers. They score the guides, not the ledgers: a ledger entry whose guide text does not say what the owner says is a guide defect. A disposition that wrongly says a guide narrates no step a record constrains is reported against the guide that narrates it.
