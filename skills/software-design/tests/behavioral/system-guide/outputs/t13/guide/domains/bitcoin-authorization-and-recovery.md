# Bitcoin Authorization And Recovery

This domain keeps the borrower and the lender in control of the Bitcoin collateral while still letting fixed, previously signed transactions move that collateral through a loan's life, across crashes, network delays and missing participants. It decides which already authorized Bitcoin transaction may be used and when; it never lets the product, the organization or any service choose a new destination or hold a collateral key. The [architecture guide](../architecture.md) shows where the domain sits in the whole system.

## What this domain does and why it matters

A loan in this system pays USDC on Base and is secured by Bitcoin. The Bitcoin side has no lender, operator or contract that can be asked to release funds later. Whatever the borrower and lender want to be possible must be prepared and signed in advance, and Bitcoin consensus then decides which prepared transaction is valid and which one actually wins. This domain owns that preparation, the participants' signing, and the later use of those fixed transactions.

A few terms recur throughout:

- The **prefund** is the Bitcoin output the borrower funds first, before the loan starts. It stages the collateral plus a fee reserve; it is not yet collateral.
- The **escrow** is a different, later output: the confirmed collateral created when one activation transaction spends the prefund. The two are separate Bitcoin objects with separate states.
- A **PSBT** (partially signed Bitcoin transaction) is the standard file format that carries an unsigned transaction and the signatures collected for it, so each participant can review and sign it in turn.
- A **package** is one such prepared transaction with its signatures and binding records. A signed package is evidence of exactly what a participant authorized earlier. Every participant signature commits to all inputs and outputs, so nobody holding the package can change where its money goes.
- Each participant has a **Vault**: a separate browser application on its own web origin that holds the participant's seed, per-loan keys and secrets, encrypted under a password only the participant knows. Signing in to the product never unlocks it.
- Three secrets, each committed in advance by its hash, unlock different fixed routes. The borrower's **X** is revealed when the borrower accepts the funded loan on Base and completes the activation transaction. The lender's **Y** is revealed when the lender claims repayment on Base and completes the borrower's normal recovery transaction. An optional fallback secret **S**, held by an independent evidence-conditioned validation service (the fallback service), can complete that same recovery transaction in one narrow case after a specific refund on Base. None of them gives anyone a collateral key.
- A **long-stop** is a separate borrower recovery transaction that needs neither recovery secret; it becomes valid only after an absolute timelock.

Bitcoin consensus, including confirmations and timelocks, is the authority for what is spendable and for the final outcome. Application records, provider responses and Base events are inputs; none of them can make a Bitcoin transaction valid or confirmed.

Deadlines are counted in seconds from **D**, the loan's repayment deadline. The lender's claim cutoff on Base is D plus 172,800 seconds (48 hours) and is enforced by the Base contract. The two Bitcoin timelocks are judged only by Bitcoin consensus time, the median time past (MTP) of recent blocks, never by a server clock: the lender's recovery route becomes valid after D plus 259,200 seconds (72 hours) and the borrower long-stop after D plus 864,000 seconds (10 days).

## Three responsibilities

[Bitcoin prefund, escrow, and package construction](../../system-model/domains/bitcoin-authorization-and-recovery/responsibilities/sr-002-bitcoin-prefund-escrow-and-package-construction.md) is the deterministic machinery. It builds and validates the scripts, exact outpoints and amounts, fixed outputs, fee variants, manifests, signatures and the whole graph of packages; it selects among already signed fee variants, hands finalized transactions to relays, watches Bitcoin through independent sources, and reconciles what actually happened. It operates only a route that current chain and package evidence justify. It consumes committed loan terms and the participants' acknowledged key allocations; it cannot allocate a key, choose a destination or invent a missing binding.

[Borrower Bitcoin authorization and recovery](../../system-model/domains/bitcoin-authorization-and-recovery/responsibilities/sr-004-borrower-bitcoin-authorization-and-recovery.md) is everything the borrower's Vault does: it creates the 12-word seed, derives a separate key for each loan, generates and encrypts X, records the borrower's own Bitcoin destination, reviews and signs the borrower's packages, performs the explicit acceptance that reveals X, and later signs the borrower's recovery transactions and any cooperative settlement. Plaintext keys and X exist only briefly inside the Vault.

[Lender Bitcoin authorization and recovery](../../system-model/domains/bitcoin-authorization-and-recovery/responsibilities/sr-009-lender-bitcoin-authorization-and-recovery.md) applies the same local boundary to the lender: a separate seed and per-loan key, Y, the lender's own Bitcoin destination, the lender's signatures on activation and on its own timelocked recovery route, the exact claim that reveals Y, manual export of the lender's recovery package, and fresh cooperative signatures.

They cooperate in one direction of trust. The construction responsibility prepares exact unsigned transactions; each Vault independently checks the loan, its role, the destinations and the exact bytes before signing anything; the construction responsibility then verifies the signatures and operates only those fixed transactions. The two Vaults never share keys or secrets, each participant signs only its own routes plus the jointly signed activation and cooperative transactions, and the construction side never receives a private key or an unrevealed secret.

What the domain receives from other domains:

- from the [loan terms domain](loan-terms-and-commitments.md), the committed loan terms that bind both participants' public keys, destinations, secret hashes and deadlines;
- from the [participant access and operations domain](participant-access-and-loan-operations.md), authenticated handoffs into each Vault, the loan workspace that coordinates signing batches, and the primary archive where signed packages are stored;
- from the [Base observation and fallback domain](base-observation-and-fallback-review.md), finalized public X and Y with their provenance, and for an eligible loan the published S;
- from the [Base settlement domain](base-usdc-settlement-and-funding.md), the Base contract calls through which X and Y are revealed.

What it provides: public per-loan keys, destinations and secret hashes for the loan terms; the qualification facts that let Base funding open; signed, archived packages; and Bitcoin outcomes for the workspace to show.

## A normal case: from prefund to returned collateral

Consider a borrower who reserves a lender's one-loan offer, borrows USDC and repays on time.

```figure
caption: Signing happens in two phases; the second waits for the real escrow to confirm, and each participant signs only fixed routes.
step: Keys and secrets | Each Vault allocates a loan key, prepares X or Y and returns only public values for the terms.
step: Prefund | The borrower pays the exact prefund output from an external Bitcoin wallet.
step: Initial packages | Twelve transactions are built and signed: six activation and six borrower refund variants.
step: Qualification | After six unchanged confirmations and an archive receipt, Base funding may open.
step: Acceptance and activation | The borrower reveals X on Base; one signed activation is broadcast and confirms.
step: Terminal packages | For the confirmed escrow only, recovery packages are built, signed and archived.
step: Repayment | The lender reveals Y on Base; the borrower's signed recovery transaction returns the Bitcoin.
```

**Preparing keys and secrets.** After the reservation creates the loan, each participant's Vault receives a separate allocation request. The Vault assigns the next unused hardened index for this loan, saves the encrypted snapshot and gets it acknowledged, and only then returns the loan's public Bitcoin key and Base address. A second, separate preparation request confirms the participant's Base recipient and external Bitcoin destination and generates the role's secret (X for the borrower, Y for the lender) if none exists yet; it returns only the destinations and the secret's hash. The participant never types or chooses X or Y. The loan terms domain then assembles the final terms. The terms and workspace records require both the borrower and the lender to approve that exact candidate, while the offer records treat the lender's published offer as standing acceptance needing no second lender approval; whether the lender's approval here is a separate step or contradicts that is undecided (see the [Loan Terms And Commitments guide](loan-terms-and-commitments.md)).

**Prefund and the initial phase.** The borrower's own external wallet pays the requested prefund amount to the expected output. Once that exact output is observed with matching network, script, value and binding, the construction responsibility builds six activation and six refund candidates, one at each fee rate of 10, 20, 50, 100, 150 and 200 satoshis per virtual byte (sat/vB). Every activation pays exactly the committed collateral into escrow, adds one 240-satoshi anchor output for fee bumping, and returns the unused fee reserve to the borrower's committed destination. Every refund also carries its own 240-satoshi anchor and returns the prefund to the borrower's committed destination after a relative timelock.

The current design allows this construction and signing while the prefund still has zero confirmations, provided the terms are committed and both participants' allocations and preparations are acknowledged. An earlier recorded decision waited for the first confirmation; the zero-confirmation rule records a later owner clarification that replaced it. The delivered library still rejects a zero-confirmation prefund, and the delivery records list zero-confirmation construction as a planned change that has not yet been built. Either way, a zero-confirmation prefund is never collateral: it opens no Base funding window and passes no acceptance gate.

**Signing in a fixed order.** Signing always follows the same sequence, so that a receipt can never feed the signature it is supposed to record:

1. the construction responsibility builds the exact unsigned candidates;
2. the loan workspace stores one immutable signing batch for each participant;
3. the matching Vault reviews and signs exactly that batch;
4. the workspace re-verifies the signatures, writes every package to locked object storage and verifies each write;
5. only then does one database transaction issue the archive receipt for the complete set.

The borrower signs all six activation and all six refund variants; the lender signs all six activation variants. The packages live in a locked Cloudflare R2 bucket, the primary archive, while the D1 database holds only indexes, checksums and receipts, never package bytes. An hourly copy to separate Amazon S3 buckets is a backup and does not gate the loan.

**Qualification.** Base funding may open only after six unchanged prefund confirmations, fresh agreement from two independent Bitcoin sources, a valid archive receipt for the 12-package initial phase, and at least 67 hours left before the refund becomes valid. The refund timelock starts at the prefund's first confirmation and matures after roughly 72 hours.

**Acceptance and activation.** The lender funds the loan on Base. The borrower then accepts in two confirmations: first the borrower confirms the nonsecret facts; then an isolated worker in the Vault briefly unlocks X and the Base key and freezes the exact transaction that will reveal X; only a second confirmation tied to those exact bytes allows the Vault to sign and submit it. Acceptance also requires funding no older than 24 hours and at least 19 hours left before the refund. When Base finalizes the acceptance, X is public, and the construction responsibility selects one signed activation variant by the fee rule, adds X and broadcasts it. The other signed activation variants remain valid competitors until one of them actually spends the prefund.

**The terminal phase.** No recovery package exists for an activation that never confirmed. When one activation actually reaches six confirmations, that transaction, not the one the application selected, fixes the escrow. Only then are the terminal packages built for that exact escrow output: six normal-recovery variants that need Y (or S), six lender-recovery variants that wait for the lender timelock, and six borrower long-stop variants. The borrower signs the twelve borrower variants and the lender signs its six. After they are signed and the archive receipt for the terminal phase is valid, the escrow is active.

> **Unresolved: how many packages the terminal archive receipt covers**
>
> One sentence in the construction responsibility's archive rule says "the 12-package signed terminal phase" must receive its own receipt. That record's own construction rule, the package-graph and escrow states, the archive invariant, the manifest contract, the workspace command contract, the activation flow and two build constraints all give 18 terminal packages: six borrower recovery, six lender recovery and six borrower long-stop. The owners have not resolved the difference, so the count the terminal receipt must cover remains undecided.

**Repayment and recovery.** The borrower repays on Base before D. The lender, freshly reauthenticated, claims strictly before the cutoff through the same two-confirmation pattern: the Vault briefly unlocks Y, freezes the exact claim transaction, and signs it only after a second confirmation of those bytes. Once Base finalizes the claim, Y is public. The construction responsibility selects a fee variant of the borrower's already signed normal-recovery transaction, adds Y and broadcasts it. No new borrower signature, output change or other escrow spend is involved. The collateral is back with the borrower when independent observation sees that exact transaction confirm; until then the outcome is pending.

## Fees: why fixed tiers, and how one is chosen

A Bitcoin transaction's fee is fixed by its signed bytes, and these transactions are signed long before they are used. Every family is therefore signed at six fee rates, 10 to 200 sat/vB, and no fee source or operator may create a new parent transaction or change a signed one.

The selector takes a one-block fee estimate from Mempool, or in order from the two fallback providers, Blockstream Esplora and Validation Cloud. Each provider gets a 15-second deadline and one retry, for at most six attempts and 90 seconds. The estimate is converted to whole thousandths of a sat/vB, rounded up, and must be no more than 120 seconds old at the first broadcast attempt. The rule is to choose the lowest signed tier strictly greater than the estimate times 1.25, evaluated in integer arithmetic only. Before an activation or refund candidate enters the mempool, a fresh estimate may pick a different signed candidate. Once an activation or terminal candidate is accepted, it is the only parent, and only a separately funded child transaction can add fee (child pays for parent, or CPFP, described below). A relayed prefund refund is the exception: it may be replaced, under the standard replace-by-fee rules, only by an already signed higher-fee refund.

> **Unresolved: what happens when even 200 sat/vB is not enough**
>
> If no signed tier is strictly above the buffered estimate, the owners disagree. The fee-selection contract's policy text, the fee-tier ticket and the refund-fee ticket say the 200 sat/vB parent is used, CPFP eligibility is recorded and the organization is alerted for a separate manual decision; in the fee-tier ticket, using the 200 sat/vB parent was approved by the user on the agent's recommendation and the alert for a manual child was specified by the user, while the refund version in the refund-fee ticket was the agent's choice. The same contract's selection action says the result is a fail-closed "no eligible tier" outcome that selects nothing. Neither reading has been chosen, so how the system behaves in this case is undecided.

A different case is settled: when Mempool and both fallback estimators are unavailable, malformed or stale, the route is blocked for fee estimation, the organization is alerted, and nothing is broadcast automatically. A person may then record one existing signed tier with its basis and reason; any extra fee requires the separately approved child.

The child spends the 240-satoshi pay-to-anchor (P2A) output of the stuck parent and pays enough fee for both. The organization never builds or sends it automatically. One currently authorized operator reviews and exports an exact child request with the selected fee; a separate local helper builds an unsigned child from confirmed inputs of a dedicated organization fee wallet and checks the fee against a conservative maximum size; Bitcoin Core on the operator's machine, unlocked by hand, signs and broadcasts it; and independent observation confirms it. The fee wallet is never a treasury or collateral wallet and the application never holds its key. A compromise of this path can waste or steal fee-wallet funds and delay confirmation, but cannot change any signed parent's destination or amount.

## Exceptions and recovery

**The prefund changes or reorganizes.** If the prefund is replaced, disappears, conflicts or is reorganized into a different transaction, every package built on it and every signature becomes invalid, a new attempt number is recorded, and both participants must sign again. If a reorganization keeps the identical prefund, the bytes and signatures stay valid; only confirmation-based qualification pauses until it requalifies. This keeps stale transactions from being treated as executable.

**The borrower never accepts.** Without the borrower's explicit acceptance, X stays private and nobody else can activate the loan. Base funding expires and returns USDC only to the lender's fixed recipient. After the refund timelock matures, the organization may automatically select and broadcast one signed borrower refund, but only when two fresh independent sources agree that the unchanged prefund is unspent and finalized Base state shows no accepted X. The confirmed refund cancels the origination.

**Base has paid but activation has not confirmed.** Base acceptance and Bitcoin activation are not atomic. After X is final, the loan is "activation pending", not active. The system keeps rebroadcasting the same selected activation, raising its fee until the escrow output reaches six confirmations or the failure is reconciled. How fee may be raised once that activation is in a mempool is undecided: the activation-pending invariant says through signed tiers or a separately approved child, while the fee-selection contract says an accepted activation is the sole parent and only a child can add fee; one possible reading, tiers only before acceptance, is stated by no owner. It cannot refund the prefund, pay principal again or build a replacement. If the activation still fails to confirm before the signed refund matures and wins, the lender's principal is left unsecured; the owners record activation pending as a residual lender risk.

**A different activation wins.** If another signed activation variant confirms instead of the selected one, that real winner becomes the only escrow, and any terminal phase built for the losing transaction is invalidated and rebuilt for the real one.

**Terminal signing is incomplete.** If, after the escrow confirms, a participant has not signed or the terminal archive receipt fails, the loan stays explicitly "terminal-signing-pending". Principal has been paid and the escrow exists; neither can be undone. The system keeps alerting and prompting the participant, and the loan is not shown as package-ready active. A lender whose Vault password or required envelope is lost in this window cannot add new signatures; the owners record this post-confirmation signing window as an explicit residual risk.

**A relay times out or sources disagree.** A relay response proves nothing about the chain, and a timeout is ambiguous. The exact attempt is reconciled against independent observation before any retry, and no other transaction is created. Exhausted attempts retry from durable state after one minute, two minutes and then every five minutes; a permanent rejection blocks and alerts. If the outcome stays unknowable, the route stays blocked and an operator is alerted, without any manual override of disputed chain facts. A wrong binding, stale bytes, contested facts, missing primary archive evidence or an invalid route blocks only the affected action.

**The lender never reveals Y after valid repayment.** On Base, the lender's claim ends at D plus 48 hours and the exact repayment becomes refundable to the borrower's frozen recipient, so the lender cannot also collect it. On Bitcoin, the borrower's normal recovery cannot be completed without Y. Three routes may then decide the collateral:

- For a loan created after the fallback service passes its production activation gate, with S committed before the escrow was built, the fallback service publishes S once the Base refund of the unclaimed repayment is final, and S completes the same borrower-signed recovery transaction. It changes no output, signature, transaction ID or package entry, and no second recovery family exists.
- After D plus 72 hours, the lender's signed recovery route is valid. Bitcoin cannot see Base repayment, so the lender, or anyone who stole that package, can still broadcast it.
- After D plus 10 days, the borrower long-stop is also valid, without Y or S, paying the borrower's committed destination.

After the long-stop matures, the lender route does not expire; both remain valid and whichever confirms first wins, since only one transaction can spend the escrow. The owners record valid repayment without Y as one of the most important residual risks: the borrower can lose the collateral after paying, because neither the fallback nor the long-stop is protection until it is implemented for that escrow and confirms before the lender transaction.

> **Unresolved: how the long-stop and cooperative settlement are broadcast**
>
> The relay contract says a relay accepts only activation, normal-recovery and automatic-refund transactions. The long-stop flow has the borrower request relay "through the existing constrained path", a security record says the long-stop "can be relayed", and the cooperative contract and flow say the platform may broadcast one cooperative variant. No owner states whether these use the same relay boundary or another path, so this remains an open question.

**Ordinary default.** If the borrower does not repay, the lender's route becomes valid only when Bitcoin consensus time passes D plus 72 hours. The organization does not schedule, finalize or broadcast it. The freshly reauthenticated lender exports the current signed package and broadcasts it outside the system; the export discloses that Bitcoin cannot inspect Base repayment and that package validity is not application permission.

**Cooperative settlement.** Borrower and lender can agree to close or split the escrow differently. Both rederive the same loan keys and freshly sign six variants of the agreed outputs, which are archived like any other phase before use. Refusal by either, a lost password or any mismatch stops it and leaves the earlier routes intact. The Bitcoin mechanism is defined, but its signing-session experience, Base accounting and support procedures are deferred.

**A forgotten password or lost backup.** There is no way to recover a forgotten Vault password: no server copy, recovery code or support path. Account recovery can return only the encrypted Vault. With the known password and a retained envelope, a participant can restore on a new device. Without them, new signing, secret disclosure and cooperative settlement are impossible, but packages that were already fully signed and remain unchanged stay usable under their route conditions.

**Archive outages.** A phase is usable only after every package is verified in the primary archive and its receipt exists. The hourly S3 backup is monitored separately: a warning after two hours without a verified backup, a critical alert after six, and after 24 hours new qualification pauses without invalidating existing loans or eligible recovery. The design accepts a bounded window in which a newly written package exists only in Cloudflare until the next successful backup.

## Authority boundaries

The domain decides which already signed transaction may be operated, at which signed fee tier, and how the actual Bitcoin outcome is classified. It must not decide or imply anything else:

- It never holds a collateral key: no organization key appears in any prefund or escrow script, and the escrow has exactly four ways out (normal borrower recovery, lender recovery, borrower long-stop and cooperative settlement).
- It never chooses a destination. Prefund refund, normal recovery and the long-stop pay only the borrower's committed destination; lender recovery pays only the lender's.
- It never accepts for the borrower, never activates without the borrower's X, and never broadcasts a lender default.
- It never treats a relay response, fee estimate, observer report, public secret, Base event, cached status, wall clock or archive entry as proof of broadcast acceptance, confirmation, lifecycle completion or who deserves the collateral. Local "selected" or "historical" labels cannot revoke a still-valid signed transaction.
- It never decides loan terms, Base funding or repayment, Base finality, the fallback service's judgment, product sign-in, lender capital or liquidation.

Holding something is not authority beyond its fixed route, but it is not harmless either. A stolen package can force only its fixed transaction once its condition exists; a stolen lender-recovery package can still be broadcast after maturity even when the borrower has repaid. A stolen X can force the borrower's acceptance early, paying only the fixed recipients. A single stolen loan key normally cannot take the collateral until a script branch that accepts that key becomes usable; from then on the thief can sign a spend to any destination through that branch, and per-loan hardened keys confine the leak to one loan. Both matching loan keys together can immediately redirect the escrow through the cooperative branch; the owners treat a common malicious frontend that captures both participants during origination as a more important common-mode threat than two unrelated account takeovers.

## Choices and their reasons

- **Six fixed fee tiers for every family.** A signed fee cannot change, and the owners forbid inventing an unsigned parent. The tiers themselves are recorded as specified by the user; the strict 1.25 buffer rule as approved by the user on the agent's recommendation. What happens when no tier qualifies is the unresolved conflict described above.
- **Manual-only CPFP.** When a fee bump is needed the organization is alerted and a person decides and sends it; the user specified this. The fee wallet is kept separate so that a compromise stays bounded to its balance.
- **Terminal packages only for the actual confirmed activation**, so recovery packages are never signed for activation transactions that may never confirm; the user specified this.
- **The borrower long-stop**, so that an escrow does not stay unspent indefinitely when the lender does not act and no secret is available. Its timing, one week after the lender route becomes valid, is recorded as specified by the user; the design in which both timed routes stay valid until one confirms, as approved by the user on the agent's recommendation; the route numbering and package order, as chosen by the agent.
- **Exact scripts, witnesses and package validation.** The owners record that a construction or finalization defect can range from an unspendable or lost recovery to a wrong output or an exposed secret, so every package must match its binding byte for byte.
- **Sequential hardened per-loan key indices**, which avoid collisions and restore reliably with the encrypted backup; the sequential choice is recorded as approved by the user on the agent's recommendation. Hardened derivation also keeps a leaked loan key from reaching other loans.
- **One fixed Vault encryption profile**, password-based key derivation (PBKDF2-HMAC-SHA-256 at 600,000 iterations) with AES-256-GCM encryption, so every first-version backup stays interoperable and hostile envelopes are cheap to reject; changing it needs a separately reviewed second version.
- **No forgotten-password recovery**, recorded as approved by the user on the agent's recommendation, because any stronger mechanism would change who can restore or access participant keys and secrets.
- **Fail closed when every fee estimator is unusable**, specified by the user so that the system never sends blindly during a provider outage.

These reasons explain the existing contracts; none of them grants additional recovery authority.

## Open, excluded and deferred

Open now, and undecided until the owners are reconciled:

- how many packages the terminal-phase archive receipt covers (12 in one sentence, 18 everywhere else);
- whether fee selection uses the 200 sat/vB parent or selects nothing when no signed tier qualifies;
- which relay boundary carries the borrower long-stop and cooperative settlement transactions;
- how fee may be raised for an activation already in a mempool: through signed tiers, or only through a child transaction.

Deferred, each with its own condition for revisiting:

- [automatic organization broadcast of lender-default packages](../../system-model/contracts/scope/scope-001-automatic-lender-default-broadcast.md): today the lender exports and broadcasts manually;
- [institutional last-resort collateral recovery](../../system-model/contracts/scope/scope-002-institutional-last-resort-collateral-recovery.md): no organization recovery key or sale of collateral; the long-stop is not institutional recovery;
- [activation recovery when the borrower does not respond](../../system-model/contracts/scope/scope-003-borrower-nonresponse-activation-recovery.md): nonresponse follows the refund path, as the user specified;
- [cooperative settlement operations and Base accounting](../../system-model/contracts/scope/scope-005-cooperative-settlement-operations.md): recorded as an agent choice; the product may not claim cooperative settlement is operational or closes the Base ledger;
- [stronger participant-Vault recovery](../../system-model/contracts/scope/scope-006-stronger-participant-vault-recovery.md).

Excluded: [Bitcoin liquidation, automated surplus return and shortfall enforcement](../../system-model/contracts/scope/scope-012-bitcoin-liquidation-surplus-and-shortfall.md). Several questions in this domain, such as automatic default eligibility and institutional recovery governance, are recorded as out of scope rather than answered.

Status matters as much as design. The fallback service's S route is selected but not available: it requires counsel approval and implementation evidence, and only loans created after that gate can carry S. The delivery records show the earlier delivery slices for the protocol libraries, the Vault, Bitcoin operations and the fee-bump helper as implemented; those records do not cover current changes such as zero-confirmation initial construction, which is not yet built. The local demonstration runtime is still blocked, and [testnet deployment, mainnet deployment and activated production operation](../../system-model/contracts/scope/scope-013-runtime-profile-claims-and-activation-gates.md) are not claimed.

The [domain record](../../system-model/domains/bitcoin-authorization-and-recovery/domain.md) lists exactly what the domain owns and excludes, and records the open questions with each side's source.
