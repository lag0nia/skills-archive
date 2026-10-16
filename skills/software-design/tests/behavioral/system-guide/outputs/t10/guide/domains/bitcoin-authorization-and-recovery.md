# Bitcoin Authorization And Recovery

This domain keeps the borrower's Bitcoin collateral under the control of the two loan participants while letting the system carry out, across crashes, outages and chain reorganizations, only the Bitcoin transactions those participants signed in advance. Bitcoin consensus, not the application, decides which of those transactions finally spends the collateral. The [architecture guide](../architecture.md) shows where this domain fits in the system.

## What this domain does

The system arranges one loan of USDC (a US-dollar stablecoin token) on the Base network, from one lender to one borrower, secured by the borrower's Bitcoin. The USDC side is enforced by contracts on Base. The Bitcoin side cannot be enforced by a contract, because Bitcoin cannot read Base. Instead, the collateral is locked by a Bitcoin script whose spending paths are fixed when the loan is set up, and the participants sign the transactions that use those paths before they are needed. This domain designs those scripts and transactions, has the participants sign them in their own browser vaults, stores the signed results durably, and later finalizes and relays the one transaction that the public evidence allows.

The organization that runs the product never holds a key that can move the collateral. The collateral scripts contain no organization branch, and the organization's Bitcoin fee wallet can add fee to a stuck transaction but cannot change where any signed transaction pays.

### The participants

- **The borrower** stages the Bitcoin, approves receiving the USDC principal, and later recovers the Bitcoin.
- **The lender** signs its share of the setup transactions, claims repayment on Base and, if the borrower defaults, can take the collateral through a timelocked route. That route becomes valid at a fixed time after the repayment deadline whatever happened on Base, as the ordinary default case below explains.
- **Each participant's Vault** is a dedicated browser application, served from its own origin separate from the normal product, that holds that participant's encrypted seed, per-loan keys and secrets. Plaintext keys and secrets exist only briefly inside it; the application servers store only ciphertext and public values.
- **The organization's Bitcoin operations worker** builds unsigned transactions, finalizes already-signed ones when public evidence allows, relays them and reconciles the outcome. It holds no participant key and no unrevealed secret.
- **Independent providers** supply fee estimates, relay transactions to the Bitcoin network and observe the chain. None of them decides anything on their own.
- **One authorized operator** may approve a manual fee bump paid from the organization's fee wallet.

### Concepts used throughout

- **Prefund and escrow.** The **prefund** is the Bitcoin output the borrower creates first, staging the collateral before the loan starts. The **escrow** is a different, later output created by the activation transaction; it is the actual collateral of a running loan. The two are separate objects with separate states, and a prefund is never presented as active collateral.
- **PSBT and package.** A partially signed Bitcoin transaction (PSBT) is the standard container in which a transaction travels for review and signature. A **package** is one exact candidate transaction with its script, signatures and identity record, as retained by this domain. A signed package proves that a participant authorized those exact bytes. It is not permission for anyone to choose a different destination: every participant signature commits to all of the transaction's inputs and outputs, so no holder of a package can alter what it pays.
- **Fee tiers.** Because a transaction is signed before anyone knows the fee market at the time of use, each transaction exists as six variants that differ only in fee: 10, 20, 50, 100, 150 and 200 satoshis per virtual byte (sat/vB). At the time of use the system picks one of the already-signed variants.
- **Anchor and fee bump.** Every activation, refund, normal borrower-recovery, lender and cooperative transaction carries one extra 240-satoshi output called a pay-to-anchor (P2A) output. A separately funded child transaction can spend it to raise the effective fee of the parent; this is called child-pays-for-parent (CPFP). The child cannot change the signed parent.
- **Routes.** A route is one way of spending the prefund or the escrow: activation and prefund refund for the prefund; borrower recovery, lender recovery, borrower long-stop recovery and cooperative settlement for the escrow.
- **Consensus time.** All Bitcoin timelocks in this domain are judged by Bitcoin's median time past (MTP), the time Bitcoin consensus itself uses. An application clock, a provider's clock or Base time never makes a timelocked route valid.

### Three secrets and one secretless route

Three 32-byte secrets connect the Base side to the Bitcoin side. Each loan commits to the hash of each secret, so anyone can check a revealed secret, and each secret has exactly one role:

- **X**, the borrower's secret, is revealed when the borrower accepts the funded principal on Base. It enables only the fixed activation that moves the prefund into escrow.
- **Y**, the lender's secret, is revealed when the lender claims a valid repayment on Base. It enables only the fixed borrower-recovery transaction that returns the escrow to the borrower.
- **S**, an optional secret held by an independent evidence-conditioned validation service (ECVS), can complete that same borrower-recovery transaction after an unclaimed repayment has been refunded on Base. It can exist only for loans created after the capability is activated for production; the records show it as selected but not activated (see the last section).

The **borrower long-stop** is different: it is a borrower-signed route that needs neither Y nor S and becomes valid only after a long absolute timelock. None of these secrets or routes gives the organization any key or spending choice.

## How its responsibilities work together

Three responsibilities share the work.

[Bitcoin prefund, escrow, and package construction](../../system-model/domains/bitcoin-authorization-and-recovery/responsibilities/sr-002-bitcoin-prefund-escrow-and-package-construction.md) builds and checks the exact scripts, outpoints, amounts, outputs, fee variants, identity records and signatures of every package, and later operates only the route that current chain and package evidence justify. It also owns fee selection, relay, independent Bitcoin observation and reconciliation, and the boundary around the manual fee bump. It works only from committed loan terms whose Bitcoin keys came from durable, acknowledged allocations in the participants' Vaults; it cannot allocate a key, choose a key index, or invent a missing binding.

[Borrower Bitcoin authorization and recovery](../../system-model/domains/bitcoin-authorization-and-recovery/responsibilities/sr-004-borrower-bitcoin-authorization-and-recovery.md) is the borrower's side inside the Vault. It creates the borrower's seed and per-loan key, generates and protects X, signs the borrower's packages, and runs the explicit acceptance that reveals X. The external Bitcoin destination that every borrower route pays is the borrower's own choice, committed in the loan terms and kept separate from the borrower's signing key and Base identities.

[Lender Bitcoin authorization and recovery](../../system-model/domains/bitcoin-authorization-and-recovery/responsibilities/sr-009-lender-bitcoin-authorization-and-recovery.md) is the lender's side. It holds the lender's per-loan key and Y, signs the lender's share of the activation and the lender's own timelocked recovery packages, runs the repayment claim that reveals Y, lets the lender export a matured default package for manual broadcast, and signs cooperative settlements.

The cooperation always follows the same pattern. Construction prepares exact unsigned transactions and their identity records. Each Vault independently checks its role, the loan, its current encrypted snapshot, the destinations and the exact bytes, then signs locally. The signed set is stored and acknowledged before anything depends on it. Later, a public fact (a finalized secret on Base, or a matured timelock) lets the operations worker finalize and relay one of those already-signed transactions, and independent observation decides what actually happened.

### What it receives and provides

This domain depends on other domains for facts it must not invent:

- From [Loan Terms And Commitments](./loan-terms-and-commitments.md) it receives the committed loan terms: the loan identity, the participants' per-loan Bitcoin public keys, their external Bitcoin destinations, the commitments to X, Y and, where applicable, S, the repayment deadline and the timing policy. Terms become committed only when both participants have approved the same final candidate. How the lender's approval relates to its earlier publication of the offer is an open question owned by that domain: the architecture record, the offer-and-reservation contract and the origination flow's precondition describe publication as the lender's standing acceptance, with no second lender approval at reservation; the offer-reservation selection says "there is no second lender-approval step", the multi-lender scope record lists no second lender approval, and the funding-vault state lists a second lender approval as invalid. The detailed terms state, offer state, origination flow's approval step and terms responsibility require explicit borrower and lender approvals of the same final candidate before commitment. The terms responsibility also narrows publication to approval of "the proposed commercial values only", which would reconcile the reservation wording but not the selection's statement that no second lender-approval step exists. The question is undecided. This domain consumes only terms that are committed, whichever reading is confirmed.
- From [Participant Access And Loan Operations](./participant-access-and-loan-operations.md) it receives the bounded handoffs that open a participant's Vault for one exact action, the durable jobs that wake the operations worker, and custody of the signed-package archive and its receipts.
- From [Base Observation And Fallback Review](./base-observation-and-fallback-review.md) it receives finalized Base events that make X or Y public, and, only for a loan created after the S capability was activated, an independently published S.
- To [Base USDC Settlement And Funding](./base-usdc-settlement-and-funding.md) and the application it provides the Bitcoin facts that gate Base actions, such as a prefund with six unchanged confirmations and a durably archived set of signed packages. It never moves USDC itself.

Each participant's Vault also holds, separately from all of the above, one independently generated Base payment account per supported network, used only for exact USDC funding or repayment transfers and a narrow participant-transfer purpose, which lets the authenticated participant send received USDC to a chosen recipient (for example, a lender moving recovered funds onward). It is never the protocol signing key, a Bitcoin loan key, X or Y, or a recipient written into the terms. The design records these payment-account connections as planned, not yet delivered; the [payment account contract](../../system-model/contracts/interfaces/iface-022-vault-owned-base-payment-account-and-exact-transfer.md) holds the exact boundary.

## A normal case: from prefund to recovered collateral

The following case is illustrative: the amounts and dates are examples, not approved requirements. A borrower reserves a lender's offer for a USDC loan secured by 50,000,000 satoshis (0.5 BTC), with a repayment deadline D on an illustrative 1 March.

```figure
caption: The collateral passes through two distinct outputs, and each later step uses only bytes signed earlier.
step: Prepare | Each Vault allocates a per-loan key and prepares its destinations and secret hash.
step: Prefund | The borrower stages the Bitcoin in a prefund output.
step: Initial packages | Six activation and six refund variants are built, signed and archived.
step: Accept | The borrower reveals X on Base and receives the principal.
step: Activate | The system relays one signed activation; the escrow forms.
step: Terminal packages | After six confirmations, the escrow-spending packages are built, signed and archived.
step: Repay and claim | The lender claims repayment on Base, revealing Y.
step: Recover | The system completes the borrower's signed recovery with Y; the Bitcoin returns.
```

### Preparing keys and secrets

After the reservation creates a stable loan identity and before the terms are committed, each participant's Vault runs a separate allocation step. The Vault derives a new per-loan Bitcoin key at the next unused hardened index under its seed, records the loan-to-index mapping inside the encrypted vault, saves the changed encrypted snapshot and waits for the application to acknowledge it, and only then publishes the loan's public key. A second, separate preparation step confirms the participant's Base recipient and external Bitcoin destination and reuses or, if absent, automatically generates the participant's secret for this loan (X for the borrower, Y for the lender). The participant never chooses, types or manages the secret. Again the snapshot is saved and acknowledged before the Vault returns only public values: the destinations, the secret's hash and the revision acknowledgements. Changing a destination later reuses the same secret.

The seed is a 12-word BIP-39 phrase (BIP-39 is the common Bitcoin standard for writing a seed as a list of words) shown for backup at Vault creation and afterwards only after fresh reauthentication and a Vault unlock. Everything in the Vault is encrypted under one Vault password, by default six randomly selected words from the BIP-39 English list joined by hyphens, or a custom password of 15 to 256 printable characters. The encryption profile is fixed for this version: the password is stretched with PBKDF2-HMAC-SHA-256, a deliberately slow key-derivation function, run for exactly 600,000 iterations, into a key for AES-256-GCM, a standard authenticated encryption scheme that also detects tampering.

### Staging the prefund and signing the first packages

Once terms are committed, the borrower creates the prefund. Its script allows two spends: **activation**, which needs X and both participants' signatures, and **prefund refund**, which needs only the borrower's signature after a relative timelock of 507 units of 512 seconds (259,584 seconds, about 72 hours and 6 minutes) measured from the prefund's confirmation. The prefund must hold at least the collateral, the 240-satoshi anchor, the activation fee at the 200 sat/vB tier and a minimum non-dust return to the borrower. Any surplus becomes a fee reserve that each activation variant returns to the borrower's committed destination.

The construction responsibility may build the six activation and six refund variants as soon as the exact prefund is observed, even at zero confirmations, provided both participants' allocations and preparations are acknowledged, the terms are committed and the exact network, script, value and attempt binding validate. Each activation variant pays exactly the collateral into the escrow script, 240 satoshis to the anchor and the rest of the reserve, minus its own fee, back to the borrower. Each refund variant pays the anchor and returns the rest to the same borrower destination. The borrower signs all twelve; the lender checks and adds its signature to the six activation variants.

Signing follows a strict order. The operations worker builds the unsigned candidates; the application persists one immutable signing batch for each participant and phase; the matching Vault signs exactly that batch; the application revalidates the unchanged signed result and writes every signed object to a locked, private archive, and only after every write verifies does one database transaction issue the **archive receipt** for the complete set. A receipt can never be an input to the signing step that produces it, and a missing fact cannot be filled in downstream.

An unconfirmed prefund is not collateral. Six unchanged confirmations of the prefund, with fresh agreement from two independent observers, a durably archived initial set and at least 67 hours left before the refund becomes valid, are all required before the loan qualifies and the Base funding window can open.

### Accepting the principal with X

The lender funds the loan on Base. Before the borrower can accept, a fresh gate must pass: the prefund has six unchanged confirmations, identifiers and destinations agree, all twelve initial packages are correctly signed and their archive receipt is valid, the exact principal is finalized on Base and no more than 24 hours old, a fee path is viable, and at least 19 hours remain before the prefund refund becomes valid. The gate is recomputed immediately before submission.

Acceptance takes two confirmations. First the borrower confirms the plain facts of the acceptance, which contain no secret. That first confirmation is not consent to sign: it only lets one isolated worker inside the Vault unlock X and the borrower's Base key and build the exact acceptance transaction. The borrower then reviews those exact bytes and confirms a second time; only that second confirmation lets the Vault sign and submit the call. Any mismatch, change, cancellation, timeout or failure clears X and the key and ends the worker. The application never receives X or signs the call. One part of the acceptance contract still describes the participant authorizing an external browser wallet to sign and submit this call, so which signer the contract means at this step is undecided.

### Activation and the terminal packages

When the acceptance is finalized on Base, X is public. The operations worker then picks one activation variant by the fee rule, inserts X, and relays and rebroadcasts only that transaction. The other signed activation variants remain valid on Bitcoin, so whichever one actually confirms is the real escrow parent, not necessarily the one the application picked. The loan is now **activation pending**, not active.

No escrow-spending transaction exists yet. Only after one activation transaction actually reaches six confirmations does the construction responsibility build the **terminal packages** for that confirmed escrow output, as six fee variants of each of three routes:

- **borrower recovery**, signed by the borrower, which needs Y (or S, on a loan created after the S capability was activated) and pays the borrower's committed destination;
- **lender recovery**, signed by the lender, valid after T = D + 259,200 seconds (72 hours) and paying the lender's committed destination;
- **borrower long-stop**, signed by the borrower, valid after B = D + 864,000 seconds (10 days, one week after the lender route) and paying the borrower's committed destination without any secret.

These 18 packages get their own archive receipt. Only then is the loan **package-ready active**. The package contract and the package-state record define this terminal phase as 18 packages. On the other side, one archive sentence in the construction responsibility still calls it "the 12-package signed terminal phase", and the signed-package archive constraint describes "that parent's six-normal/six-default terminal phase", although the construction responsibility itself lists all 18 variants elsewhere. The difference is whether the six borrower long-stop packages belong to the archived terminal phase, and it is undecided (see the last section). Counting both phases, the package contract records 30 ordinary transaction variants carrying 36 participant signatures.

### Repaying and recovering with Y

The borrower repays exactly on Base by D. The lender then claims the repayment strictly before the claim cutoff C (48 hours after D, an illustrative 3 March). The claim follows the same two-confirmation pattern inside the lender's Vault, so Y is revealed only through the exact claim transaction. As at acceptance, one part of the contract still describes an external participant wallet signing this call, so which signer it means here is undecided. When the claim is finalized on Base, Y is public. The operations worker picks a borrower-recovery variant, inserts Y, and relays it. No new borrower signature is needed and no output changes. The loan's Bitcoin side is complete only when that transaction confirms; every competing variant then becomes historical.

## Fees, relay and observation

**Fee selection.** At the time of use, the system reads a one-block fee estimate and picks the lowest signed tier strictly greater than the estimate plus 25 percent, using integer arithmetic only. Estimates come first from Mempool, then Blockstream Esplora, then Validation Cloud; each request has a 15-second deadline and one retry, and an estimate is usable only if fetched no more than 120 seconds before the first broadcast attempt. If every estimator is unusable, the route enters a fee-estimation-blocked state: nothing is broadcast automatically, and a person may record only a choice among the existing signed tiers, with its basis and approval. Before an activation or refund variant enters the mempool, a fresh estimate may select a different signed variant. Once an activation or terminal transaction is accepted into the mempool, it is the only parent and only a fee bump can add fee. A relayed refund may move only to an already-signed higher-fee refund that Bitcoin's replacement rules permit.

What happens when even the 200 sat/vB tier does not satisfy the rule is an open question. The fee contract's payload and the fee-selection decision say to use the 200 sat/vB variant, record that a fee bump is possible and alert. The same contract's tier-selection action says the result is a fail-closed no-eligible-tier result that selects nothing. The records do not say which applies.

**Manual fee bump.** No fee bump is ever automatic. One currently authorized operator may approve and export an exact child-construction request. A separate local helper builds only an unsigned child that spends the anchor and confirmed inputs from a dedicated organization fee wallet; Bitcoin Core on the operator's machine, manually unlocked, signs and broadcasts it; independent observation records the result. The fee wallet is manually topped up and has no protocol cap; holding roughly 300 to 500 US dollars' worth of Bitcoin is non-binding operating guidance, and every actual balance and fee is checked in satoshis.

**Relay.** A relay receives only already-finalized bytes, first through Mempool and then Blockstream Esplora, with a 15-second deadline per attempt. A timeout or unclear answer is not permission to send anything different: the exact attempt is reconciled against independent observation before any fallback or resend, and exhausted attempts retry the identical bytes after one minute, then two, then every five minutes. A permanent rejection blocks the route and alerts. A relay's "success" means only that the transaction was submitted.

**Observation.** Every fact that changes the loan's lifecycle needs fresh agreement from two independent observers on the same transaction, output and block; when they agree on the block but not the confirmation count, the lower count is used. For the production main network the design names Blockstream and Validation Cloud, for the default test network Blockstream and Mempool, and in the local demonstration two connected Bitcoin Core nodes. Disagreement or unavailability blocks only the automation that depends on that fact, raises an alert and allows no manual override.

## Exceptions and recovery

### Origination stops before X

If the borrower never accepts, or funding or acceptance expires, the lender's USDC returns on Base to its fixed recipient, and the borrower's Bitcoin returns through a prefund refund. Once the refund timelock has matured, the system automatically relays one signed refund variant, but only with fresh two-observer agreement that the unchanged prefund is unspent and finalized Base state showing no accepted X. An accepted X, an observed activation spend, a conflicting or unavailable source or a premature timelock blocks the refund and alerts. When the refund confirms, origination is cancelled. The organization has no way to accept on the borrower's behalf; nonresponse simply ends in this unwind.

### Base pays, but activation does not confirm

Base acceptance and Bitcoin activation are two chains, not one atomic step. After X is finalized, the system keeps resuming and rebroadcasting the same selected activation, escalating only through signed tiers or an approved fee bump, until its escrow output has six confirmations. It may not refund the prefund, pay the principal again or build a replacement. Even so, if activation is censored, underfunded or lost until the prefund refund matures, the borrower or anyone holding the signed refund could broadcast it and win. The borrower would then hold both the principal and the Bitcoin, and the lender would carry unsecured exposure. The design records this as the principal residual cross-chain risk: its controls reduce the exposure but cannot eliminate it.

### The prefund changes or the chain reorganizes

If the prefund transaction is replaced, lost or conflicted, or a reorganization changes it, every package built on it and every signature becomes invalid and must be rebuilt and re-signed under a new attempt. If a reorganization leaves the identical prefund in place, the existing packages are kept and only their use is paused until fresh confirmations requalify them. The same rule applies one level down: a reorganization of the same activation pauses terminal readiness, while a different activation winner invalidates any terminal packages built for the losing parent and requires new ones for the actual escrow output.

### Terminal signing is incomplete

If the borrower or lender has not signed the terminal packages, or the terminal archive receipt fails, the loan stays explicitly **terminal-signing-pending**. The principal is already paid and the escrow already exists, so nothing can be reversed; the system keeps prompting the missing participant and must not present the loan as package-ready. The design accepts this window between activation and terminal signing as a residual risk, and for the lender in particular: if the lender loses its password or required envelope before signing, it loses the ability to sign its own protection route.

### Valid repayment, but the lender never reveals Y

If the borrower repays validly but the lender does not claim before C, the Base contracts make the repayment permanently refundable to the borrower and prevent the lender from also claiming it. Bitcoin cannot see that. On a loan without the activated S capability there is then no secret to complete borrower recovery, and the lender's route still matures at T. The lender, or anyone who stole its signed package, can then take the Bitcoin even though the borrower paid, and the lender cannot also collect the USDC. On a loan with the activated S capability, a timely published S can complete borrower recovery first, but only if that transaction confirms before the lender's. From B the borrower's long-stop becomes valid too, but it does not cancel the lender route: both remain valid until one confirms. The design records this as one of its most important residual risks; it needs no attacker.

### Ordinary default

When no valid repayment was finalized by D, the product classifies the loan as an ordinary default; that classification itself signs, selects or broadcasts nothing. The lender's route becomes usable once Bitcoin's median time passes T, whatever Base shows. The lender, after fresh reauthentication, exports one current signed lender package and broadcasts it through its own means. The export states that Bitcoin cannot inspect Base repayment and that a valid package is not application permission. Once copied, a package cannot be recalled. The organization does not schedule, finalize or broadcast it.

### Long-stop recovery and route races

If the escrow is still unspent at B, the borrower can request relay of one exact signed long-stop variant (see the open question on relay below). Normal recovery, lender recovery, long-stop recovery and cooperative settlement all spend the same escrow output, so at most one can confirm, and the actual confirmed spender, not an application label, decides the outcome. A long-stop that loses is kept only as evidence.

### Lost passwords and lost archives

A participant with a known password can restore the retained encrypted Vault on another device. There is no recovery of a forgotten Vault password in this version: no server, operator, account recovery, code or passkey can rebuild the password, seed, keys, X or Y. Losing the password blocks revealing a secret, signing anything new and cooperative settlement, but does not invalidate packages that were already fully signed.

The signed packages are the exit archive. If an archive write fails, no receipt exists, so the step that needed that phase cannot proceed. The application, the Vaults, Bitcoin automation and the primary archive all run on Cloudflare, so a Cloudflare-wide outage suspends them together; the chains continue, and after recovery the system reconciles both chains before resuming work. Packages are copied hourly to separate, locked storage outside Cloudflare; this copy does not gate a loan, but the system warns after two hours without a verified backup, raises a critical alert after six, and after 24 hours pauses new qualifications without affecting existing loans or eligible recovery. A newly written package exists only in Cloudflare until its first successful backup, a window the design accepts. Participants can also export their current packages as an additional copy.

## Authority boundaries

This domain decides how the Bitcoin transactions are built and checked, which already-signed variant to use, when public evidence makes a route operable, and how the actual outcome is classified. It does not decide anything that belongs to a participant or another domain.

> **Signing in is not authority over Bitcoin**
> A product login, account recovery, retrieved ciphertext, an accepted command, an archived package or a relay response never unlocks a Vault, reveals a secret, signs, moves funds or proves a Bitcoin outcome. Only a participant's Vault signs; only a finalized public secret, a matured timelock or both participants' fresh signatures make a route usable; and only independently observed confirmation settles it.

- The construction responsibility must not generate or decrypt participant keys, give borrower consent, choose a destination, move lender capital, judge Base settlement or ECVS conformity, or hold an organization collateral key. It cannot liquidate collateral or decide how proceeds are split.
- A fee estimate, observer report, public secret, Base event, cached status, clock or archive does not by itself mean broadcast acceptance, confirmation, lifecycle completion or a beneficiary.
- The borrower's side does not own canonical terms, the lender's key or Y, Base state or automatic acceptance, and stores no seed, index or extended public key on any server.
- The lender's side has no automatic default authority and no discretion over destinations. A missing Y, a matured route or an archived package does not mean the borrower failed to pay.
- The fee wallet and fee-bump tools can add fee to a stuck parent; they cannot change its payout, signatures or route, cannot fix a badly built parent and cannot undo a race another spend has already won. The design requires that a compromise of the operator or helper stay bounded to the fee wallet's balance and to delay.

## Choices and their reasons

- **Fixed scripts, witnesses and signature rules.** Every route uses an exact script and witness, and every participant signature commits to the whole transaction. The recorded reason is that signed routes must not allow input or output changes; the security record for implementation defects adds that a construction or witness defect could make a transaction unspendable, pay the wrong output or remove a recovery route. The escrow's branches and the absence of any organization branch were approved by the user on the agent's recommendation.
- **Six pre-signed fee tiers and a strict buffer.** The user specified the six tiers. The user approved, on the agent's recommendation, the rule of choosing the lowest tier strictly above the estimate plus 25 percent, so the chosen tier sits safely above the live estimate. The user specified that the anchor never triggers an automatic fee bump. Allowing a different signed activation variant to be chosen before mempool entry was chosen by the agent without a separate approval.
- **Terminal packages only for the confirmed winner.** The user specified waiting for the actual confirmed activation. Building recovery transactions for every possible activation parent would multiply the terminal transactions by the six activation candidates, most of them never usable, and because every signed activation variant stays valid once X is public, the application's own choice cannot be trusted to be the parent.
- **Zero-confirmation initial signing.** A recorded owner clarification of 29 September 2026 allows the initial packages to be built and signed against an unconfirmed prefund, replacing an earlier first-confirmation restriction. The records give no separate reason.
- **Rebuild on a changed parent, pause on the same parent.** Signatures must never be reused across a changed output, but a reorganization that keeps the identical prefund should not force needless rebuilding. The user specified the pause; the full rebuild was approved on the agent's recommendation.
- **The borrower long-stop.** The earlier three-route escrow could leave collateral stranded when the lender does not act and neither Y nor S is available. Because Bitcoin timelocks only set a lower bound, a later borrower route necessarily competes with the already-valid lender route. The user specified its timing, one week after the lender route; it applies only to newly built escrows.
- **Vault keys and encryption.** The user specified the 12-word seed. Sequential hardened per-loan indices, approved on the agent's recommendation, avoid collisions and make allocation deterministic after a restore; the security record for a stolen loan key notes that correct hardened derivation limits such a leak to one loan. One fixed encryption profile, also approved on the agent's recommendation, keeps every backup of this version interoperable and makes checking a hostile envelope cheap and predictable.
- **Automatic prefund refund.** The user specified that the organization relays the refund at timelock maturity rather than leaving it to the borrower. The gates (an unspent, unconflicted prefund and no accepted X on Base) were approved by the user on the agent's recommendation. Applying the strict 25-percent buffer to the refund, where the user had asked for the closest fee rate, was chosen by the agent without a separate approval.

## Open, excluded and deferred

### Open questions

- **How many packages the terminal phase holds.** The package contract, the package-graph state and the archive invariant define 18 terminal packages: six borrower recovery, six lender recovery and six borrower long-stop. The construction responsibility's archive-readiness sentence still says "the 12-package signed terminal phase", and the archive-durability constraint describes "that parent's six-normal/six-default terminal phase", although the construction responsibility lists all 18 variants elsewhere. The difference is whether the six borrower long-stop packages belong to the archived terminal phase. The records leave this unresolved; this guide describes 18 because that is what the package contract and state define, not because the question has been answered.
- **What happens when no fee tier qualifies.** As described above, one statement selects 200 sat/vB with an alert and the other returns a fail-closed result that selects nothing. Until this is answered, a reader cannot rely on either behavior.
- **Which transactions the relay contract accepts.** The relay contract says a relay accepts only activation, normal-recovery and automatic-refund transactions. The long-stop flow and the operations worker's design have the long-stop relayed through the existing constrained path, and the cooperative flow has the system broadcast a cooperative settlement. Whether the relay contract's list is incomplete or deliberately narrower is undecided.
- **Lender approval of final terms.** As described under what this domain receives, the records disagree on whether a separate lender approval of the final terms is required; this domain consumes only committed terms either way.
- **Who signs the acceptance and claim calls.** The acceptance contract's preparation and signing description, the borrower's responsibility and the activation flow have the same Vault worker sign the prepared call. The contract's signing action still has the participant authorize an injected or external browser wallet to sign and submit it, and the gas-sponsorship contract says the participant browser constructs, signs and submits it. Which signer the contract means is undecided.

### Status of capabilities

- The borrower long-stop is recorded as implemented in the protocol libraries and every consuming slice through the product web application.
- Zero-confirmation initial signing and the Vault's separate preparation step are current design changes whose implementation has not been delivered; earlier delivery evidence does not verify them.
- The S fallback is a selected design, not an available capability: it needs counsel approval and implementation evidence before any new loan can commit to S, and an existing escrow can never gain it.
- The target outcome of this design is a developer-run local demonstration on a private Bitcoin test network; that demonstration is currently blocked, and nothing in this domain claims a public test network, main network or production deployment.

### Excluded and deferred

- **Automatic lender-default broadcast** is excluded: the lender exports and broadcasts its own package. Revisit only with an approved authority, eligibility, broadcast, audit and abuse design.
- **Institutional last-resort collateral recovery** is deferred: the organization holds no collateral key and runs no sale or distribution of Bitcoin. Adding one would make the organization an assisted-custody operator.
- **Activation without the borrower** is deferred: no one else holds X or can accept for the borrower; nonresponse ends in the unwind.
- **Cooperative settlement operations** are deferred: the Bitcoin mechanism (six fresh, dual-signed variants from the same loan keys) is fixed, but the signing session, its Base accounting and support procedures are not designed, so the product cannot claim cooperative settlement is operational.
- **Stronger Vault recovery** is deferred: there are no recovery codes, passkeys, delegated or social recovery for a forgotten password.
- **Liquidation, surplus return and shortfall enforcement** are outside this version.

The [domain record](../../system-model/domains/bitcoin-authorization-and-recovery/domain.md) lists exactly what the domain owns and excludes and links the exact contracts.
