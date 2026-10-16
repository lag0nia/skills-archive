# Bitcoin Authorization And Recovery

This domain keeps the borrower's Bitcoin collateral under the borrower's and lender's own keys while keeping pre-signed transactions usable through delays, outages and disputes, so the collateral can only move in ways the participants themselves signed. The [architecture guide](../architecture.md) shows how it fits into the whole system.

## What does this domain protect?

The system lends USDC on Base, an Ethereum layer-2 network, against Bitcoin collateral. This domain owns the Bitcoin side: participant loan keys and secrets, the transactions that can move collateral, and when each may be used.

Collateral passes through two distinct outputs. The **prefund** is paid by the borrower from their own Bitcoin wallet before the loan starts and only stages collateral. The **escrow** holds collateral during the loan; it exists only after an activation transaction spends the prefund and its output reaches six confirmations.

A **Partially Signed Bitcoin Transaction (PSBT)** carries a transaction and its signing data so each participant can review and sign it locally; a **package** is one such PSBT with its recorded identity in the loan. Every participant signature commits to all inputs and outputs, so a package is evidence of exact prior authorization: its holder can broadcast that one transaction once its conditions hold, but nobody, including the company, can change where it pays.

Bitcoin consensus decides what can be spent. Signed, broadcast and confirmed are different events, and an outcome counts only when independent observation sees the expected spend confirmed. Timelocks follow **median time past (MTP)**, Bitcoin's consensus clock, never an application clock.

> **No company key over the collateral**
> The escrow can be spent in exactly four ways (borrower recovery, lender default, borrower long-stop and cooperative settlement), and none uses a company key. The company's Bitcoin fee wallet can only add fee to an already signed transaction; it cannot sign for, redirect or spend the collateral.

## Which keys and secrets take part?

Each participant has a **Vault**: a separate browser application at its own web address that holds a password-encrypted seed, derives a distinct key for each loan, and decrypts and signs only locally. Signing in to the product retrieves the Vault's ciphertext but never unlocks it. Each participant also commits an external Bitcoin destination, separate from their loan key and Base addresses, which their unilateral transactions pay.

Three secrets each complete specific fixed transactions; only their hash commitments, H(X), H(Y) and H(S), enter the loan terms.

- **X** is the borrower's random secret, generated automatically in the Vault. Disclosing it on Base accepts the funded principal, and the public X then completes the activation transaction.
- **Y** is the lender's equivalent. Disclosing it on Base claims a valid repayment, and the public Y then completes the borrower's recovery transaction.
- **S** is an optional fallback held by the **validation service**, an independent evidence-conditioned validation service. It publishes S only after verifying a finalized Base refund of a repayment the lender never claimed, and S completes the same borrower recovery transaction as Y. Only loans created after the service's production activation can use it.
- The **borrower long-stop** needs no secret: it is a separate borrower-signed transaction that becomes valid through time alone.

## How do the three responsibilities share the work?

[Bitcoin prefund, escrow, and package construction](../../system-model/domains/bitcoin-authorization-and-recovery/responsibilities/sr-002-bitcoin-prefund-escrow-and-package-construction.md) builds and checks every transaction from the committed terms: scripts, amounts, fixed destinations, fee variants and package identities. It operates only what current chain and package evidence justify: choosing which signed transaction to send and at which fee, relaying it, reconciling uncertain outcomes and classifying the spend that confirms. It cannot allocate a key, choose a destination or invent a missing binding.

[Borrower Bitcoin authorization and recovery](../../system-model/domains/bitcoin-authorization-and-recovery/responsibilities/sr-004-borrower-bitcoin-authorization-and-recovery.md) is the borrower's side inside the Vault: the seed and its backup, the loan key, X, the borrower's signatures, and the deliberate acceptance that discloses X. The borrower first confirms the nonsecret facts; an isolated worker then unlocks X and the Base key just long enough to freeze the exact transaction; only a second confirmation tied to those bytes authorizes signing and submission.

[Lender Bitcoin authorization and recovery](../../system-model/domains/bitcoin-authorization-and-recovery/responsibilities/sr-009-lender-bitcoin-authorization-and-recovery.md) is the lender's matching side: the lender's loan key and Y, signatures on the activations and the lender's own default transactions, the same two-step disclosure of Y when claiming repayment, manual export of the default package, and fresh cooperative signatures. Both Vaults also hold a separately generated Base payment account for exact USDC transfers, which is neither a loan key nor the Base protocol address.

In every signing phase, the company's Bitcoin operations service builds unsigned transactions, the application freezes one signing batch per participant, the Vault signs exactly that batch, and the application verifies the signatures and archives the complete set before recording the receipt that makes the phase usable.

The domain receives committed terms, keys and commitments from [Loan Terms And Commitments](./loan-terms-and-commitments.md); handoffs, commands and package storage from [Participant Access And Loan Operations](./participant-access-and-loan-operations.md); and finalized Base events, a published S and Bitcoin evidence from [Base Observation And Fallback Review](./base-observation-and-fallback-review.md). It provides the Vault-signed calls that disclose X and Y to the contract in [Base USDC Settlement And Funding](./base-usdc-settlement-and-funding.md), the qualification that lets the Base funding window open, and Bitcoin status for the workspace.

## A normal loan, from prefund to recovery

This illustrative sequence follows one loan that closes normally, after both Vaults have created loan keys, X and Y and both participants have approved the same terms, including the repayment deadline **D**.

```figure
caption: Exit transactions are built only for the escrow that actually confirms.
step: Prefund | The borrower pays the prefund from their own wallet.
step: Initial signing | Six activations and six refunds are signed and archived.
step: Qualification | Six unchanged confirmations let the Base funding window open.
step: Acceptance | The borrower discloses X on Base and receives the principal.
step: Activation | After Base finality, one signed activation is relayed with X.
step: Exit signing | The confirmed escrow's exit transactions are signed and archived.
step: Repayment and claim | The borrower repays by D and the lender discloses Y.
step: Recovery | The borrower recovery transaction completed with Y confirms.
```

Once the exact prefund is observed and validated, even with zero confirmations, the domain builds six activation and six refund candidates, one per fee tier of 10, 20, 50, 100, 150 and 200 satoshis per virtual byte (sat/vB); the borrower signs all twelve and the lender the activations. That is preparation only. Relying on the prefund needs six unchanged confirmations, fresh agreement from two independent observers, the archive receipt and at least 67 hours before the refund becomes valid.

The borrower may accept only while a fresh gate holds, including finalized funding and at least 19 hours before the refund becomes valid. Once acceptance is finalized on Base, the domain adds the public X to one selected activation and relays it; the loan is "activation pending", not active. Whichever signed activation actually confirms, selected or not, creates the escrow.

Only after six confirmations of that escrow are its **exit transactions** built (the records call them terminal packages); the current package contract specifies six borrower recovery, six lender default and six borrower long-stop variants. Once each participant has signed its own families and the set is archived, the loan is active. At close, the borrower repays by D and the lender discloses Y before the claim cutoff **C**, two days (172,800 seconds) after D; once that claim is finalized, the domain adds Y to an already borrower-signed recovery transaction and relays it.

## How can the collateral leave escrow?

| Route | Signed by | Usable when | Sent by | Pays |
| --- | --- | --- | --- | --- |
| Borrower recovery | Borrower, after the escrow confirms | Y is public through a finalized Base claim, or valid S is published for an eligible loan | The domain, automatically | Borrower's destination |
| Lender default | Lender, after the escrow confirms | Bitcoin MTP passes D plus three days (259,200 seconds) | The lender, by manual export and outside broadcast | Lender's destination |
| Borrower long-stop | Borrower, after the escrow confirms | Bitcoin MTP passes D plus ten days (864,000 seconds); no secret | Relayed on the borrower's request | Borrower's destination |
| Cooperative settlement | Both, freshly, after agreeing | The escrow is unspent and both have signed | The domain may send one | Agreed outputs |

Every route has six fee variants, and Y and S complete the same borrower recovery transaction with the same signature. Because Bitcoin cannot see Base, the lender default is valid after its timelock whether or not the borrower repaid, and no Base repayment or refund can revoke a signed package. A timelock only sets the earliest moment a route works, so from D plus ten days both timed routes can be valid together; the escrow's one confirmed spend decides the outcome.

## What happens when the normal path breaks?

### Origination stops before X is disclosed

If funding or acceptance expires, the Base contract refunds the lender and the prefund returns through a signed refund, valid about 72 hours after the prefund's first confirmation. The company relays it automatically only when two observers freshly agree that the prefund is unchanged and unspent and finalized Base state shows no accepted X; a pending refund can be replaced only by a higher-fee refund the borrower already signed. Once X is accepted this path is forbidden, and nobody can disclose X for the borrower.

### Chain facts change or are uncertain

A reorganization that keeps the identical parent transaction only pauses qualification; a replaced, lost or conflicting parent invalidates every descendant package and signature, forcing a new attempt with fresh signatures. After acceptance, the domain keeps rebroadcasting the selected activation and cannot refund the prefund or build a replacement. A relay timeout is ambiguous: the exact attempt is reconciled before any retry, and no different transaction is sent. Lifecycle-changing Bitcoin facts need two independent observers to agree; disagreement or outage blocks only the dependent automation, raises an alert and allows no manual override.

### Exit signing is incomplete

If a participant has not signed after the escrow confirms, or the archive has not acknowledged the complete set of exit transactions, the loan stays explicitly "terminal signing pending". Nothing is reversed, since principal is paid and the escrow exists; the application keeps prompting and must not show the loan as ready. This window is an accepted risk: a lender who loses the Vault password in it cannot sign the lender default.

### The borrower repays but the lender never discloses Y

Valid repayment means the exact debt was finalized on Base from the registered repayment vault by D. If the lender has not claimed by C, the Base contract permanently disables the claim and lets anyone trigger a fixed refund to the borrower, so the lender cannot collect that USDC. That refund moves no Bitcoin. For a loan created after the validation service is activated, the service can publish S and the domain completes the borrower recovery with it. Otherwise the collateral stays in escrow: from D plus three days the lender default is valid even though the borrower repaid, and from D plus ten days the borrower long-stop competes with it. The design records this as an explicit [missing-Y residual risk](../../system-model/contracts/invariants/inv-025-missing-y-residual-lender-risk.md); cooperative settlement also remains possible.

### The borrower does not repay

If no valid repayment is finalized by D, the application may classify the loan as in default, but that signs and sends nothing. Once Bitcoin MTP passes D plus three days, the lender may freshly reauthenticate, export the default package and broadcast it outside the system; the export warns that Bitcoin cannot see Base repayment.

### Fees rise or fee data is missing

The domain picks the lowest signed tier strictly more than 25 percent above the current next-block estimate, and may repick before a candidate enters the mempool. After an activation or exit transaction enters it, only **child pays for parent (CPFP)** can add fee: a separate child spends the parent's 240-satoshi **pay-to-anchor (P2A)** output. An authorized operator approves the exact child fee, a local helper builds it from the company's dedicated fee wallet, and the operator's manually unlocked Bitcoin Core signs and broadcasts it. If every fee source is unusable, nothing is sent automatically; an operator may only record a choice among signed tiers.

### A participant forgets the Vault password

There is no forgotten-password recovery; product account recovery returns ciphertext only. Without the password a participant cannot disclose X or Y, sign anything new or settle cooperatively, but already fully signed packages stay usable under their own conditions.

## What may this domain decide, and what must it not?

The domain decides whether Bitcoin artifacts match the committed terms, which signed transaction to operate and at which tier, whether a finalized public secret or matured timelock makes a fixed route eligible, how to reconcile an uncertain relay, and which spend actually confirmed.

It must not decide loan terms, destinations, Base funding, repayment or finality, whether a Base refund qualifies for S, product identity, lender capital, liquidation or proceeds. A relay response, fee estimate, observer report, public secret, Base event, cached status, wall clock or stored package never implies broadcast acceptance, confirmation, completion, a beneficiary or general spending authority.

## Why is it designed this way?

- **Exact scripts and witnesses.** A construction defect can make a transaction unspendable, pay a wrong output that looks committed, or remove a recovery route, in every loan built by the same library version.
- **Signed fee tiers for activation.** Activation got six signed tiers instead of one transaction plus CPFP, because CPFP spends the company's own funds; CPFP stays the last resort. This was approved.
- **Exit transactions only for the real escrow.** Waiting for the confirmed activation avoids signing 36 variants per route for candidates that may never confirm. This was approved.
- **Automatic refund relay.** It was approved that the company, not the borrower, relays the refund at a fee taken from the live estimate.
- **The borrower long-stop.** Without it, an escrow could stay stranded when the lender does not act and neither Y nor S is available; since timelocks are lower bounds, it competes with the lender route instead of expiring it. Its timing, one week after the lender route, was approved.
- **Participant-held keys.** A company key, a recoverable X or stronger password recovery would change custody, consent and the threat model. A fixed Vault encryption profile keeps backups interoperable, and sequential hardened per-loan keys avoid collisions, restore deterministically and keep one leaked key from exposing other loans.

## What remains open, excluded or deferred?

Two conflicts between the domain's own sources are recorded and remain undecided:

- **Fee selection when no signed tier qualifies.** The policy text of the [fee estimate and tier selection contract](../../system-model/contracts/interfaces/iface-007-bitcoin-fee-estimate-and-tier-selection.md) and the [fee selection tickets](../../build/workflow/tickets/bitcoin-authorization-and-recovery/sr-002/sr-002-fee-selection-tickets.yaml) say to select the 200 sat/vB tier, record that CPFP is allowed and alert for its manual approval. The same contract's selection action says the result is a fail-closed "no eligible tier" that selects nothing. Both agree that no new parent transaction is built; which reading governs is undecided.
- **Number of exit transactions.** The [package manifest contract](../../system-model/contracts/interfaces/iface-005-origination-binding-and-package-manifest.md), the escrow states and the construction responsibility's own family description specify eighteen exit transactions, six per route. One archive-readiness sentence in the [construction responsibility](../../system-model/domains/bitcoin-authorization-and-recovery/responsibilities/sr-002-bitcoin-prefund-escrow-and-package-construction.md) still describes a twelve-package signed exit phase. The discrepancy is unresolved.

The S fallback is selected but gated on counsel approval and implementation evidence; it applies only to later loans with H(S) committed before the escrow is built, never to an existing escrow. Until then, every loan carries the missing-Y risk.

Excluded or deferred, each with its own revisit condition:

- company broadcast of the lender default, whose safety and execution consequences remain deferred ([automatic lender-default broadcast](../../system-model/contracts/scope/scope-001-automatic-lender-default-broadcast.md));
- a company collateral key, sale or distribution ([institutional last-resort recovery](../../system-model/contracts/scope/scope-002-institutional-last-resort-collateral-recovery.md));
- accepting for a borrower who never discloses X ([borrower-nonresponse recovery](../../system-model/contracts/scope/scope-003-borrower-nonresponse-activation-recovery.md));
- the cooperative signing session, Base accounting and support, so cooperative settlement may not be presented as operational ([cooperative settlement operations](../../system-model/contracts/scope/scope-005-cooperative-settlement-operations.md));
- forgotten-password or other stronger Vault recovery ([stronger Vault recovery](../../system-model/contracts/scope/scope-006-stronger-participant-vault-recovery.md));
- collateral liquidation, surplus return and shortfall enforcement ([liquidation, surplus and shortfall](../../system-model/contracts/scope/scope-012-bitcoin-liquidation-surplus-and-shortfall.md)).

The design also accepts two bounded windows: between escrow confirmation and complete exit signing, and while a new package exists only in the primary archive before the next off-site backup. A backup outage over 24 hours pauses only new qualification, under the [signed exit package availability rule](../../system-model/contracts/invariants/inv-026-durable-signed-exit-package-availability.md).

The [domain record](../../system-model/domains/bitcoin-authorization-and-recovery/domain.md) lists exactly what the domain owns and excludes.
