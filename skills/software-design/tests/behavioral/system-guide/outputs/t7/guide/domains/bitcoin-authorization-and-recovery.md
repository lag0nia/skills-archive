# Bitcoin Authorization And Recovery

This domain keeps the borrower's Bitcoin collateral under the participants' own control while making a fixed set of pre-authorized transactions reliably usable, even across crashes, outages and chain reorganizations. The [architecture guide](../architecture.md) shows how it connects to the loan terms, the Base settlement and the participant application.

## What this domain does

Bitcoin cannot see the Base network, and the organization that runs the product holds no key to the collateral. So every way the collateral can ever move is prepared in advance as an exact transaction, signed by the participants in their own Vaults, and stored. Later, the system only chooses among those already-authorized transactions when the chain evidence says one has become valid; it never chooses a new destination or amount. Bitcoin consensus, including its confirmations and timelocks, decides which transaction is spendable and which one finally wins.

A reader needs a few terms:

- **The prefund** is the output to which the borrower first sends Bitcoin. It is a staging object, not yet collateral for an active loan.
- **The escrow** is the later output that secures the active loan. It exists only once a pre-signed activation transaction moving the prefund into it has six confirmations.
- **A partially signed Bitcoin transaction (PSBT)** carries an unsigned transaction and its signing context so a participant can review and sign it. A **package** is such a transaction with the required signatures. A signed package proves that the participant authorized those exact bytes; it is not permission to build a different transaction.
- **Fee variants.** Because a transaction is signed before anyone knows the fee market at the moment of use, each one is prepared in six variants paying 10, 20, 50, 100, 150 or 200 satoshis per virtual byte (sat/vB). Each also carries a small pay-to-anchor (P2A) output of 240 satoshis, which lets a separately funded "child" transaction pay extra fee later (child pays for parent, CPFP) without changing the signed parent.
- **Three secrets.** The borrower's secret X, revealed on Base when the borrower accepts the funded loan, completes the activation transaction. The lender's secret Y, revealed when the lender claims a repayment, completes the borrower's recovery transaction. The independent validation service's secret S can complete that same recovery transaction in one fallback case, and only for loans created after that service is approved for production. None of them gives the organization a collateral key.
- **Deadlines measured by Bitcoin.** Timelocks use the chain's median time past (MTP), not any application clock. The lender's route becomes valid at T, three days after the repayment deadline D; the borrower's long-stop route at B, ten days after D.

## How its responsibilities work together

Three responsibilities divide the work between the shared construction machinery and the two participants' private authority.

[Bitcoin prefund, escrow, and package construction](../../system-model/domains/bitcoin-authorization-and-recovery/responsibilities/sr-002-bitcoin-prefund-escrow-and-package-construction.md) builds and validates the scripts, transactions, fee variants and package set, and later operates the one route that current evidence justifies. It consumes only committed loan terms whose Bitcoin keys came from durable, acknowledged Vault allocations; it cannot allocate a key or fill in a missing binding. It also owns fee selection, relay to the Bitcoin network, independent Bitcoin observation and reconciliation, and the boundary around the organization's fee-bump transactions.

[Borrower Bitcoin authorization and recovery](../../system-model/domains/bitcoin-authorization-and-recovery/responsibilities/sr-004-borrower-bitcoin-authorization-and-recovery.md) keeps the borrower's Vault seed, per-loan keys, X and signing inside the dedicated Vault origin. It allocates the loan's key, prepares the borrower's destinations and the commitment to X, signs exact batches of transactions, and carries out the deliberate two-step acceptance that reveals X.

[Lender Bitcoin authorization and recovery](../../system-model/domains/bitcoin-authorization-and-recovery/responsibilities/sr-009-lender-bitcoin-authorization-and-recovery.md) applies the same local boundary to the lender's key and Y: signing the activation variants and the lender's own default route, claiming the repayment by revealing Y, exporting the default package for manual use, and signing any cooperative settlement.

Around them, the loan terms supply every key, destination, amount and deadline; the participant application stores signed packages, carries handoffs to the Vaults and runs the background jobs; the Base observer supplies finalized evidence that X or Y became public; and the validation-service fallback may supply S. Signing in to the product never exposes either participant's plaintext keys or secrets.

## A normal case

The following case is illustrative. Ana is the borrower and Ben the lender; their terms are already committed.

1. **Prefund.** Ana sends Bitcoin to the exact prefund output. As soon as that transaction is seen with the expected script and amount, even with zero confirmations, construction builds twelve transactions: six activation variants that move the prefund into the escrow, and six refund variants that return it to Ana after a relative timelock of about 72 hours.
2. **Initial signing.** Ana's Vault signs all twelve; Ben's Vault signs the six activation variants. The application then validates the signatures cryptographically, writes every object to its primary archive, verifies them, and only then issues a receipt. A receipt is never an input to the signing that produced it.
3. **Qualification.** Nothing is relied on until the prefund has six unchanged confirmations. Only then can the funding window on Base open, and only while at least 67 hours remain before Ana's refund route becomes valid.
4. **Acceptance.** After Ben funds the loan on Base, Ana accepts in two steps. First she confirms the plain facts of the loan. Then an isolated worker in her Vault briefly unlocks X and her Base key, prepares the exact transaction that reveals X, and asks for a second confirmation tied to those exact bytes before signing and submitting it. Acceptance fails closed unless at least 19 hours remain before the refund route opens.
5. **Activation.** Once the event revealing X reaches finality on Base, the application inserts X into one selected activation variant and broadcasts it. When that transaction, or whichever activation variant actually confirms, has six confirmations, the escrow exists.
6. **Exit packages.** Construction now builds eighteen transactions that spend this exact escrow: six recovery variants that return the Bitcoin to Ana with Y (or S), six lender variants that pay Ben after T, and six long-stop variants that return it to Ana after B without any secret. Ana signs her twelve, Ben signs his six, and the application archives them with a second receipt. Only then is the loan active. (One readiness sentence in the records still counts twelve exit packages; see the open conflicts below.)
7. **Recovery.** Ana repays on Base and Ben claims by revealing Y. When that event is final, the application inserts Y into Ana's already-signed recovery transaction, unchanged in every other respect, and broadcasts it. Its confirmation returns the collateral to Ana's committed destination.

```figure
caption: The system builds transactions for the outpoint that actually exists; exit packages wait for a six-confirmed escrow.
step: Prefund seen | Twelve activation and refund variants are built and signed.
step: Prefund confirmed | Six unchanged confirmations allow the funding window to open.
step: X final on Base | One activation variant is completed with X and broadcast.
step: Escrow confirmed | Six confirmations create the escrow; eighteen exit variants are built and signed.
step: Y final on Base | The borrower's recovery transaction is completed with Y and confirms.
```

## Exceptions and recovery

**The prefund changes or disappears.** If the prefund transaction is replaced or lost, every transaction built on it is invalidated and the whole set is rebuilt. If a reorganization merely reorders blocks but keeps the same prefund, the signed bytes remain valid, but qualification pauses until the confirmations are re-established.

**The borrower never accepts.** If X is not accepted on Base, the Base funding expires and returns the lender's USDC, and after the relative timelock the application may broadcast one of Ana's refund variants, but only with fresh evidence that the prefund is unspent and X was never accepted. The organization holds no copy of X and cannot activate on the borrower's behalf.

**Activation does not confirm.** After X is public, the principal has been paid on Base but the escrow does not exist yet. The application must keep pushing the activation: before the selected variant enters a mempool it may still switch to a higher signed fee variant, but once a variant has been accepted it is the only parent, and only an approved CPFP fee bump can add fee. It may not refund the prefund or choose a different, unsigned replacement. If the borrower's refund nonetheless confirms first, the borrower keeps both the principal and the Bitcoin and the lender is left unsecured. The records call this the principal residual cross-chain risk, borne by the lender, because Base and Bitcoin cannot settle atomically.

**Exit packages are incomplete.** If a participant does not sign their exit variants, or the archive receipt fails, the loan stays explicitly "terminal signing pending". The principal and escrow cannot be reversed, so the application keeps prompting both participants; the design explicitly accepts this window after the escrow confirms and before the exit packages are signed as a residual risk. Exit variants are always built for whichever activation variant actually reaches six confirmations, even if it is not the one the application selected; they are rebuilt and signed again only if a chain reorganization replaces that confirmed winner.

**The lender never reveals Y.** A valid Base repayment does not move Bitcoin. If Ben does not claim before the claim window closes, the USDC goes back to Ana on Base, but the escrow is untouched. Ben's lender variants become valid at T in every case and can take the collateral even though Ana repaid, because Bitcoin cannot see the repayment. For a loan created after the validation service is approved for production, a published S can complete Ana's recovery transaction, but that protects her only if it confirms before Ben's transaction. The validation service is not yet available in production, and the fallback cannot be added to loans whose escrow already exists. Ana's long-stop becomes valid at B, but it does not cancel Ben's route: both can be valid at once and the first to confirm wins.

> **A repaid loan can still lose its collateral**
> Unless a recovery completed with Y or S confirms first, the borrower's Bitcoin remains exposed to the lender's matured route, and a lender or anyone holding the exported package could broadcast it after valid repayment. The records treat this as one of the most important residual risks; the application must disclose it and must never describe Base exclusivity as invalidating the Bitcoin route.

**Ordinary default.** If Ana does not repay, Ben's lender variants become valid at T. In version 1 Ben exports the current eligible package after a fresh sign-in check and broadcasts it himself through an external wallet or node; the organization does not schedule or broadcast default transactions.

**Fees run too high.** Fee selection takes the lowest signed variant whose rate is strictly above the current estimate plus a 25 percent buffer, using integer arithmetic only. Estimates come from Mempool, then Blockstream, then Validation Cloud, each with a 15-second deadline. If a signed transaction is stuck, an operator can approve a CPFP child: a local helper builds an unsigned child from the organization's dedicated fee wallet, a manually unlocked Bitcoin Core node signs and broadcasts it, and independent observation reports the result. The fee wallet only adds fee; it gains no authority over the loan.

**Relay or observation is uncertain.** Broadcasts go to Mempool first and Blockstream second. A timeout means "unknown", not "failed", so the system reconciles the exact attempt before any retry and never sends a different transaction instead. Bitcoin facts must agree across two independent sources before any gate passes, and no one can manually override a contested Bitcoin fact. A recurring observation problem updates one incident that escalates after five minutes or one missed block, and is treated as critical immediately once X is public.

**A participant forgets the Vault password.** There is no forgotten-password recovery. Signing in again or restoring the encrypted backup with the known password works on a new device, but only if the complete encrypted backup has been kept; without the password, no server, operator or product mechanism can restore the Vault, and an unrevealed X or Y is lost. The participant's own 12-word recovery phrase reconstructs Bitcoin key material but does not decrypt those secrets. Packages already fully signed stay usable under their own conditions.

## Authority boundaries

- **The participants authorize; the system operates.** Construction validates and operates fixed transactions but never generates or decrypts participant keys, chooses a destination, or gives consent on a participant's behalf.
- **Evidence is not authority.** A relay response, fee estimate, observer report, public secret, Base event, cached status or archive entry does not prove broadcast acceptance, confirmation, lifecycle completion or a beneficiary. Only a confirmed spend of the exact output settles the outcome.
- **Destinations are fixed in the terms.** Refund, recovery and long-stop pay only the borrower's committed Bitcoin destination; the lender route pays only the lender's. The per-loan Bitcoin keys are separate from these destinations and from every Base identity.
- **Two matching keys are dangerous.** Borrower and lender can freshly sign a cooperative settlement with their existing loan keys, which needs no secret and no timelock. That is why an attacker holding both keys for the same loan could redirect the escrow. A malicious Vault release could collect matching key pairs across many loans and use them later, so the theft might not show at once; the records call this the dominant shared threat to participant keys, and version 1 has no control that stops malicious code shipped through the Vault's own trusted release path.

Canonical terms, Base funding and repayment, Base finality, the validation service's own judgment, product sign-in, lender capital and liquidation are outside this domain.

## Choices and their reasons

- **Exact scripts and witnesses.** Every transaction must match the committed script and witness exactly, because a mismatch can strand the collateral or authorize the wrong party.
- **A fixed Vault encryption profile.** Version 1 uses one fixed, source-controlled encryption and password-derivation profile with no device calibration, negotiation or migration. This keeps every version 1 backup readable by every build and makes checking a hostile backup cheap and predictable.
- **Hardened per-loan keys with sequential numbering.** Each loan gets its own hardened child key at the next unused index. A sequential index avoids collisions outright, needs only a small mapping, and lets a restored Vault resume above its highest index; separate hardened keys avoid correlating loans and limit what one compromised key exposes.
- **Fixed fee variants.** The parent transactions are signed before use, so the only way to adapt to the fee market without new signatures is to sign several variants in advance and add CPFP for the rest.
- **One recovery transaction for Y and S.** The borrower signs each recovery variant once, and the same signature completes it with either secret; the validation service never signs, and no second borrower signing happens after S is published. The user specified that the same transaction must work with both secrets.

## Open, excluded and deferred

Two recorded source conflicts are open in this domain, and this guide does not resolve them:

- **No eligible fee variant.** One paragraph of the fee contract, and the resolved implementation ticket for fee selection, say that if no signed variant clears the buffered estimate, the 200 sat/vB variant is selected, CPFP eligibility is recorded and an alert is raised. The same contract's selection action says the result is a fail-closed "no eligible tier" outcome. Which behavior governs remains open.
- **Twelve or eighteen exit packages.** The archive-readiness item in the construction record's list of what it owns refers to twelve signed exit packages. The terminal-construction item in the same list, and the activation flow, the lifecycle state, the archive invariant and the script constraint, specify eighteen: six recovery, six lender and six long-stop. This guide follows the eighteen, but the records do not reconcile the two.

Deliberately excluded or deferred in version 1, each with its own condition for revisiting:

- [Automatic default broadcast by the organization](../../system-model/contracts/scope/scope-001-automatic-lender-default-broadcast.md): the lender exports and broadcasts manually.
- [Institutional collateral recovery](../../system-model/contracts/scope/scope-002-institutional-last-resort-collateral-recovery.md): the escrow has no organization key and no organization-run sale; the borrower's long-stop is a participant route, not institutional recovery.
- [Activation without the borrower](../../system-model/contracts/scope/scope-003-borrower-nonresponse-activation-recovery.md): if the borrower never accepts, funding expires and the prefund is refunded.
- [Cooperative settlement operations](../../system-model/contracts/scope/scope-005-cooperative-settlement-operations.md): the Bitcoin mechanism is designed, but the signing-session experience, Base accounting and support procedures are not.
- [Stronger Vault recovery](../../system-model/contracts/scope/scope-006-stronger-participant-vault-recovery.md): recovery codes, passkeys, delegated or social recovery are deferred.

The [domain record](../../system-model/domains/bitcoin-authorization-and-recovery/domain.md) lists exactly what the domain owns and excludes.
