# Bitcoin Authorization And Recovery

This domain keeps the Bitcoin collateral under the participants' own control while making the fixed transactions they authorized in advance usable across delays, outages and disputes. Bitcoin consensus, not the application, decides which of those transactions finally spends the collateral. The [architecture guide](../architecture.md) shows where the domain fits in the system.

## What this domain does

A loan needs Bitcoin transactions at several moments: to stage the collateral, to lock it in escrow when the loan starts, to return it to the borrower after repayment, to let the lender take it after a default, and to give the borrower a last-resort exit. This domain builds all of them in advance, has each participant sign the ones that protect them, stores them safely, and later broadcasts only the one that current chain evidence justifies. Nobody can afterwards redirect a signed transaction or change its amount, and the company cannot create a new one. Only the participants' own keys can sign anything new: both together for a fresh cooperative settlement, or one key holder once a script branch that accepts that key alone becomes usable.

The concepts below are used throughout.

- **Prefund.** The borrower first sends Bitcoin to a staging output. The borrower alone can refund it after a relative timelock of 507 units of 512 seconds, about 72 hours after the prefund confirms.
- **Escrow.** The collateral output created by the activation transaction once the loan is accepted on Base. Prefund and escrow are different Bitcoin outputs; the escrow exists only once the activation transaction and its escrow output reach six confirmations.
- **Signed packages.** Each transaction is prepared as a partially signed Bitcoin transaction for review and signature, then kept as a package. A signed package is evidence of exact prior authorization, not permission to choose a new destination.
- **Fee variants.** Every family of packages has six variants paying 10, 20, 50, 100, 150 and 200 satoshis per virtual byte. Each also carries a small pay-to-anchor output, which lets a separately funded child transaction add more fee to a stuck parent; this is called child-pays-for-parent.
- **Secrets.** The borrower's secret X enables acceptance on Base and the fixed activation. The lender's secret Y enables the borrower's normal recovery after the lender claims repayment. An optional secret S, published by an independent validation service after one exact Base refund, can complete that same recovery transaction for loans created once the capability is activated.
- **Deadlines.** D is the repayment deadline on Base. The lender's recovery becomes valid at T, three days after D; the borrower's long-stop becomes valid at B, ten days after D. Bitcoin measures these against its own consensus median time, never an application clock.

The company holds no key in the prefund or escrow scripts.

## How its responsibilities work together

[Bitcoin prefund, escrow, and package construction](../../system-model/domains/bitcoin-authorization-and-recovery/responsibilities/sr-002-bitcoin-prefund-escrow-and-package-construction.md) builds and validates every script, transaction, fee variant, manifest and signature, and operates only the route that current chain and package evidence justifies. It consumes committed terms and the participants' acknowledged public keys, and cannot allocate a key or invent a missing binding. It also selects fee variants, relays transactions, reconciles independent chain observations, and bounds the separately funded fee-bump child.

[Borrower Bitcoin authorization and recovery](../../system-model/domains/bitcoin-authorization-and-recovery/responsibilities/sr-004-borrower-bitcoin-authorization-and-recovery.md) keeps the borrower's Vault, seed, per-loan key, X and signing on the borrower's device, inside the dedicated Vault origin. It allocates the loan's key, prepares the borrower's destinations and the hash of X, signs exact batches of packages, and performs the two-step acceptance that reveals X on Base. Preparing the destinations and the hash of X is a current design change whose implementation has not yet been delivered.

[Lender Bitcoin authorization and recovery](../../system-model/domains/bitcoin-authorization-and-recovery/responsibilities/sr-009-lender-bitcoin-authorization-and-recovery.md) applies the same local boundary to the lender's key and Y: signing the activation variants and the lender's own recovery variants, revealing Y to claim repayment, exporting the lender recovery transaction for manual use, and fresh cooperative signing.

The Vault encrypts everything under one password with a fixed profile, and backs the seed up as a twelve-word phrase. Each loan uses a fresh hardened key derived from that seed and never reused, so one leaked loan key does not expose another loan. It can still cost that loan's collateral, because whoever holds it can sign a new transaction once a branch accepting that key alone becomes usable. Signing in to the product only fetches encrypted Vault data; the Vault decrypts and signs locally, and nobody can recover a forgotten Vault password.

The domain receives committed terms from Loan Terms And Commitments, finalized Base facts such as public X and Y from Base Observation And Fallback Review, a published S from the validation service where it applies, and archiving, handoffs and scheduling from Participant Access And Loan Operations. It provides the signed packages, each route's status, alerts and the final classification of which spend won.

## A normal case

Follow an illustrative loan from collateral to recovery.

1. **Prefund.** After the terms commit, the borrower sends the exact prefund. As soon as it is observed, even unconfirmed, the domain builds the initial set: six activation variants and six refund variants. The borrower signs all twelve; the lender adds its signature to the six activation variants. Signing against an unconfirmed prefund is a recent clarification of the design; earlier delivery evidence does not verify it, and its implementation change has not yet been delivered.
2. **Archive.** Signing follows a fixed order. The automation produces the unsigned packages and their review context, the application stores one immutable signing batch, the Vault signs exactly that batch, and the application revalidates the result, writes every package to its primary archive and only then issues its receipt. A receipt can never feed the signing that produces it.
3. **Qualification.** The prefund qualifies the loan for Base funding only after six unchanged confirmations, fresh agreement between independent data sources, the recorded package receipt and at least 67 hours left before the refund becomes valid. Zero confirmations is never collateral proof.
4. **Activation.** When X becomes public through a finalized Base acceptance, the automation inserts X into one activation variant and broadcasts it, and keeps pushing that same transaction until it confirms.
5. **Exit packages.** Once one activation transaction has six confirmations, its output is the escrow. Only then does the domain build eighteen exit packages for that exact escrow: six borrower recovery and six borrower long-stop variants, which the borrower signs, and six lender recovery variants, which the lender signs. Each participant signs only the fixed-destination routes that protect them.
6. **Recovery.** After the lender claims repayment on Base and Y becomes public and final, the automation fills Y into the borrower's signed recovery transaction, chooses a fee variant and broadcasts it. The borrower's Bitcoin returns to the destination fixed in the terms when that spend confirms.

```figure
caption: Exit packages are built only for the activation that actually confirmed, so no signature ever refers to a parent that may never exist.
step: Initial set | Six activation and six refund variants, signed and archived before funding.
step: Qualify | Six unchanged prefund confirmations and enough time before refund.
step: Activate | Public X completes one activation variant; it is pushed until it confirms.
step: Exit set | Eighteen exit packages are built and signed for the confirmed escrow.
step: One spend wins | Recovery, lender recovery, long-stop or cooperative spend; the first to confirm closes the escrow.
```

One responsibility record still describes the exit set as twelve packages, while the flows, invariants and constraints describe eighteen; that discrepancy is recorded as open and awaits a separate repair.

## The exits from escrow

Four kinds of transaction can spend the escrow. They compete for the same output, so only one can ever confirm.

| Exit | Signed by | Usable when | Sent by |
| --- | --- | --- | --- |
| Borrower recovery | Borrower | Y or S is public | The automation |
| Lender recovery | Lender | After T | The lender, manually |
| Borrower long-stop | Borrower | After B | Relayed on request |
| Cooperative settlement | Both, freshly | Both agree a new split | The automation |

Each participant signs its own routes after activation. Borrower recovery becomes usable once Y is public and final on Base or, for a loan with the activated fallback, once a valid S is published; the automation sends it without any new signature. The lender's recovery becomes usable when Bitcoin consensus time passes T; the lender exports it and sends it, and the company never broadcasts it automatically. The long-stop becomes usable when consensus time passes B, without Y or S, and is relayed on the borrower's request. A cooperative settlement needs both participants to sign an exact new split freshly with the same loan keys; the automation sends it once both signatures and the archive receipt exist, and its complete operations are deferred, as noted at the end of this guide.

Y and S are two alternative ways to complete the same borrower recovery transaction: no second transaction family, no new borrower signature and no service key is involved. The long-stop is a separate transaction that needs no secret. After B, the lender recovery and the long-stop can both be valid; the long-stop does not cancel the lender route, and whichever confirms first wins. A Base repayment or refund cannot revoke any of these signatures.

## Exceptions and recovery

- **Origination stops before acceptance.** Once the refund timelock has matured and independent sources show the prefund unspent and X never accepted on Base, the automation broadcasts one signed refund variant. It may move only to an already signed higher-fee refund variant, never to a new transaction. If X was accepted, the automation never broadcasts a refund; the borrower's signed refund nevertheless stays valid on Bitcoin, which is the race in the next item.
- **Activation does not confirm.** After X is public the loan is activation pending, not active. The automation resumes and rebroadcasts the same selected transaction until its escrow confirms. Before any mempool accepts it, the automation may escalate to a higher signed variant; once it is accepted, only a separately approved fee-bump child can add fee. If the borrower's refund matures and confirms first, the lender's principal is unsecured; the records keep this as a residual lender risk.
- **A different activation wins.** Any signed activation variant can confirm instead of the one the automation chose. The one that actually confirms becomes the only parent; exit packages built for any other parent become invalid, and new ones are built and signed for the actual escrow.
- **Exit signatures are incomplete.** If a participant has not yet signed, or the archive receipt fails, the loan stays explicitly waiting for terminal signatures; alerts continue and the participant keeps being prompted. This cannot undo the paid principal or the confirmed escrow, and is never shown as package-ready. The design explicitly accepts this window between activation and exit signing as a residual risk: a participant who loses the Vault password or its data before signing cannot add the signatures for their own exit routes.
- **The parent changes.** A replaced, conflicting or lost prefund invalidates every descendant and its signatures, and a new attempt needs fresh signatures. A reorganization that keeps the same parent only pauses qualification; the existing signed bytes stay valid.
- **Ambiguous relay.** A relay timeout is not permission to send a different transaction. Each exact attempt is reconciled against independent sources before any resend or fallback provider.
- **Sources disagree.** Bitcoin gates need fresh agreement between independent sources; a conflict or outage blocks the dependent automation instead of guessing.
- **Fees spike.** The automation picks the lowest signed variant strictly above the current fee estimate increased by 25 percent. Once an activation or exit transaction is in a mempool, only a fee-bump child can add fee. For those, and for a refund once the highest signed refund variant is in use or no suitable signed replacement remains, an authorized operator can export one exact fee-bump request; a separate helper builds the unsigned child from the company's dedicated fee wallet, and the company's manually unlocked node signs and broadcasts it. The fee wallet gains no participant authority.
- **No signed variant is high enough.** The sources disagree here: one says select the 200 satoshi variant, record that a fee-bump is needed and alert; the fee-selection action contract says return a fail-closed result instead. This guide does not choose between them; the package leaves the case open.
- **A lost Vault password.** It blocks revealing a secret, signing anything new and cooperative settlement, but it does not invalidate packages already fully signed.
- **Backups fail.** Signed packages are backed up hourly outside the hosting provider. A backup outage lasting 24 hours pauses the qualification of new loans; it does not gate the existing signing and archive steps.

## Authority boundaries

The domain decides how the fixed transactions are built, validated and operated, and classifies which spend won once Bitcoin confirms it. It must not:

- choose or change a destination, amount or fee outside the signed variants;
- treat a Base event, a published secret, an application label or a mempool sighting as a Bitcoin outcome; Base facts and public secrets never sign, redirect, broadcast or confirm Bitcoin on their own;
- broadcast the lender's recovery transaction automatically, judge whether evidence conforms, hold an organization collateral key, or liquidate collateral;
- let a signed package for one parent serve another.

## Choices and their reasons

- **Exact scripts and witnesses.** A mismatch can strand collateral or authorize the wrong party.
- **A fixed Vault encryption profile.** Every encrypted backup stays interoperable and portable, and hostile Vault data can be rejected cheaply and deterministically.
- **Hardened, sequential, never-reused per-loan keys.** They avoid index reuse, correlation between loans and wider compromise from one leaked key. These are reasons for the existing contracts, not permission to add recovery authority.
- **Fixed signed fee variants.** The parent is signed before use. Integer fee units, actual transaction size, a strict buffer, fresh estimates and replacement rules prevent underestimating fees or reselecting unsafely.

## Open, excluded and deferred

- **Open:** the rule when no signed fee variant is high enough, and the stale twelve-package description of the exit set, both described above. The [domain record](../../system-model/domains/bitcoin-authorization-and-recovery/domain.md) names each side.
- **Deferred, outside this design:** [automatic company broadcast of lender recovery](../../system-model/contracts/scope/scope-001-automatic-lender-default-broadcast.md), [institutional last-resort collateral recovery](../../system-model/contracts/scope/scope-002-institutional-last-resort-collateral-recovery.md), [activation on behalf of a borrower who does not respond](../../system-model/contracts/scope/scope-003-borrower-nonresponse-activation-recovery.md) and [stronger recovery of a forgotten Vault password](../../system-model/contracts/scope/scope-006-stronger-participant-vault-recovery.md). For a reader, this means a participant who loses access, or a lender who does not act, is not rescued by the company.
- **Deferred:** [complete cooperative-settlement operations](../../system-model/contracts/scope/scope-005-cooperative-settlement-operations.md). The participants can authorize a cooperative Bitcoin settlement, but the participant signing session and the matching Base-side accounting are not yet an end-to-end operational capability.
- **Residual risk:** when valid repayment exists but Y is missing, Bitcoin cannot see the repayment. The lender, or anyone who stole the lender's signed recovery transaction, can take the collateral at T, before the long-stop becomes valid at B, and S helps only loans created after its production gate. The records count this among the most important residual risks; see the [missing-secret residual risk](../../system-model/contracts/invariants/inv-025-missing-y-residual-lender-risk.md).

The [domain record](../../system-model/domains/bitcoin-authorization-and-recovery/domain.md) lists exactly what the domain owns and excludes.
