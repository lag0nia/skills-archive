# Change lists: carried-over domain guides

Each domain guide is its original `## Domain Overview`, copied unchanged and then changed only as listed. Kinds follow the skill's migration step 3: Format, Names, Coverage, Accuracy, Editorial.

Changes common to all five guides (Format):

- F1. The title is the canonical domain name, replacing "Domain Overview"; `###` headings become `##`.
- F2. Link destinations are rewritten to resolve from `guide/domains/`.
- F3. A closing line links the architecture guide and the domain record, as validation requires.

Changes common to all five guides (Names):

- N1. Each responsibility is introduced with its canonical name as the link label, replacing "Name (SR-xxx link)".
- N2. Each link whose label was a blueprint identifier (an interface, state, invariant, flow or scope record) is relabelled with that record's name. Link destinations are unchanged.

## Loan Terms And Commitments

| # | Kind | Change | Reason |
| --- | --- | --- | --- |
| L1 | Accuracy | "The detailed approved records" → "The detailed records". | The mechanism's attribution is mixed: TICKET-0150 records the separate-approval principle as user-specified but the final-approval mechanics as agent-chosen. "Approved" overstates its status. |
| L2 | Accuracy | "The architecture's older standing-approval wording conflicts with these detailed records; this migration records the discrepancy without deciding new behavior." → a sentence giving the architecture record's side ("publication is the lender's standing acceptance … without a second lender approval") and saying it is an unresolved source conflict and neither wording is chosen. | "Older" presents one side as superseded (Open Questions step 2). The conflict line in the loan-terms and architecture records states both sides. "This migration" names an earlier documentation revision that a guide reader cannot see. |
| L3 | Names | "Base protocol EOA" → "Base protocol externally owned account (EOA)". | Acronym on first use. |
| L4 | Accuracy | "Public or multi-lender matching, pooled capital, product custody, automatic deployment of lender capital, and liquidation remain excluded under [SCOPE-011]" → the first four under the matching, pooling, custody and automatic capital exclusion; liquidation under the liquidation, surplus and shortfall exclusion. | SCOPE-011's Boundary lists only the first four. SCOPE-012's Boundary excludes BTC liquidation and lists SR-001. |

## Base USDC Settlement And Funding

| # | Kind | Change | Reason |
| --- | --- | --- | --- |
| B1 | Names | "successful borrower `acceptX`" → "successful borrower acceptance (the `acceptX` call)". | A code name used before it is explained. |
| B2 | Accuracy | "retains its explicit Transparent Proxy administration, 2-of-3 Safe, seven-day timelock, …" → the administration is retained, and who holds it is an unresolved source conflict: INV-020's 2-of-3 Safe through a seven-day timelock against SEL-009's single upgrade key for local/test and the short public mainnet beta. | The base-usdc record's `Unresolved source conflict:` line. The narrative stated INV-020's side as settled. |
| B3 | Accuracy | "V1 has no on-chain pause;" → whether V1 has an on-chain pause is open: SR-003 and SEL-009 say no on-chain pause, while STATE-019 has pause roles and a narrow operational pause. | The base-usdc record's `Open question:` line. The narrative stated one side as settled. |
| B4 | Names | "governed by [STATE-019], [INV-019], and [INV-020]" → the records named in words, two of them already linked earlier in the paragraph. | Identifier labels. |

## Bitcoin Authorization And Recovery

| # | Kind | Change | Reason |
| --- | --- | --- | --- |
| C1 | Names | "PSBT" → "PSBT (partially signed Bitcoin transaction)"; "sat/vB" → "sat/vB (satoshis per virtual byte)"; "vsize" → "virtual size"; "P2A anchor permits a separately funded CPFP child" → "pay-to-anchor (P2A) output permits a separately funded child-pays-for-parent (CPFP) child"; "envelope/KDF" → "envelope and key derivation function (KDF)". | Acronyms and units on first use. "Anchor" becomes "output" because the expanded acronym already says "anchor". |
| C2 | Accuracy | "The current package contract specifies … A stale SR-002 archive sentence still says twelve terminal packages; this documented source conflict remains for a separate repair." → the package contract's eighteen variants against the construction responsibility's archive-readiness rule and the durable signed exit package archive constraint (twelve), stated as an unresolved conflict with neither count chosen. | "Current" and "stale" present one side as settled. The bitcoin record's conflict line states both. CONS-014 line 14 ("six-normal/six-default terminal phase") is also on the twelve side (answer key v4 1.4). |
| C3 | Names | "complete R2 writes, then the D1 receipt" → "complete writes to the R2 package archive, then the receipt committed in the D1 workspace database". | Provider product names used without explanation. CONS-014 and SR-011 identify R2 as the package archive and D1 as the workspace database. |
| C4 | Names | "route-code-3 recovery transaction" → "recovery transaction (route code 3)". | Code name after the meaningful name. |
| C5 | Editorial | "for an activated commitment" → "for a production-activated commitment". | Guide-writing Names rule: "activation" also means the loan's Bitcoin activation, and the T18 review confirmed that merging the two misleads. Same meaning: SR-007's gate is production activation. |
| C6 | Accuracy | After "only one confirmed spend wins", one sentence: whether every loan has the long-stop is an open question, with each side (CONS-027, INV-008 and FLOW-010 against SEC-024). | The bitcoin record's `Open question:` line. The narrative presented the long-stop as settled for every loan. |
| C7 | Accuracy | "an earlier ticket/payload selects the largest tier with an alert, while the action contract and former decision say fail closed. This migration preserves both statements and identifies the conflict; it does not authorize either interpretation." → "the payload description and two ticket resolutions select the largest tier with an alert, while the action contract says fail closed, as an earlier explanation says a former decision did; the records could not locate that decision. The records preserve both statements and identify the conflict; neither interpretation is authorized until it is answered." | "Earlier" presents the largest-tier side as superseded (Open Questions step 2). The bitcoin record names two ticket resolutions and could not locate the former decision. "This migration" names an earlier documentation revision. |

## Base Observation And Fallback Review

| # | Kind | Change | Reason |
| --- | --- | --- | --- |
| O1 | Names | "[Base observation and reconciliation]" → "[Base observation, finality, and reconciliation]"; "[The independent validation-service fallback]" → "[The evidence-conditioned validation-service fallback]". | Canonical responsibility names, which validation requires. |
| O2 | Names | "Base L1 finality" (first use) → "Base L1 (layer 1) finality". | Acronym on first use. |
| O3 | Accuracy | After the borrower long-stop sentence, one sentence: whether a loan without a production-activated S commitment has that long-stop is an open question, with each side (CONS-027 and FLOW-010 against SEC-024 and FLOW-005). | The observation record's `Open question:` line. |
| O4 | Format | "the two responsibility records below" → "the two responsibility records linked above". | In the domain record they were below. In the guide they are linked in the second paragraph. |

## Participant Access And Loan Operations

| # | Kind | Change | Reason |
| --- | --- | --- | --- |
| P1 | Names | "reauthentication/MFA" → "reauthentication and multi-factor authentication (MFA)"; "protocol EOA" → "protocol externally owned account (EOA)"; "promised RTO/RPO" → "promised recovery time or recovery point objective (RTO/RPO)". | Acronyms on first use. |
| P2 | Names | "commit in D1 together" → "commit together in the D1 workspace database". | Provider product name. SR-011 names D1 as the workspace store. |
| P4 | Accuracy | "both roles approve the same final candidate under the terms domain's exact rules." → "under the terms domain's detailed rules both roles approve the same final candidate, which is one side of an unresolved source conflict over whether the lender approves again after reservation, explained in the loan terms guide." | The loan-terms and architecture conflict lines. As written, the sentence states the explicit-approval side as settled. Found by the review (MI-2) and narrowed by the recheck (R-5). |
| P3 | Accuracy | "The current payment capability is still an implementation target with no execution evidence established by this migration." → the records disagree about its status (SEL-043 and VA-003 against the core coordination handoff and the handoff sequence), which status holds is undecided, and the most limited reading is selected but planned and unverified. | The participant record's `Open question:` line. Guide-writing principle 6: give the most limited status and report the disagreement. "This migration" names an earlier documentation revision. |

C7 was narrowed twice: the review (MI-1) and the recheck (R-4) found the "former decision" wording stronger than the record. B3 is narrowed to an *on-chain* pause, because SEL-009 and CONS-008 settle that a frontend/API operational stop exists (review BL-1).

## Known gaps in the retained prose (not changed)

These are omissions, not errors, so step 3 leaves them as written. Each is reported to the user.

- Base USDC, acceptance: the activation-pending race (the lender's principal is unsecured if the borrower's prefund refund confirms first) is not stated beside "leaves Bitcoin activation pending".
- Participant access, handoff: "it is not a general signing token" is weaker than the Vault envelope contract's "an expiring pointer, not authentication, transaction consent, or cryptographic authority".
- Bitcoin, acceptance confirmations: that a failure or cancellation clears the plaintext is not stated.
- Loan terms, preparation: only the borrower's `H(X)` preparation is named; the owners require both roles' preparation.
- Participant access, transfer scope: the guide states the participant-transfer purpose as selected (SEL-043). The record's open question about whether BU-004 omits it is not reached by any sentence about BU-004, so it is reported rather than written into the guide.
