Fidelity review of PKG/guide/architecture.md (paths below are relative to PKG = .../loan-system/design/technical-design). Most of the guide checks out against its owners: the funding window and the 67h = 24+24+19 envelope, opener trust, package counts and signers, finality, C/T/B and MTP strictness, refunds and their recipients, the Cloudflare outage boundary, hourly backups, the demo fail-closed rule, upgrade governance and no on-chain pause, the reservation and infraction rules, all three open conflicts, and the excluded/deferred/bounded split (it matches every `status:` field). Only the problems are listed.

**Overclaim (omission of a race the lede promises to state)**

1. Guide L138: "Once X is public, activation must complete with the same selected transaction: the system cannot refund the prefund…". L161's list of what the system "cannot guarantee" also leaves this out.
   - The owners record a live race here. The borrower's pre-signed prefund refund stays Bitcoin-valid once its CSV matures. If activation does not confirm first, the refund can win: the borrower keeps both the principal and the BTC, and the lender is left unsecured.
   - Sources: system-model/contracts/invariants/inv-018-activation-pending-recovery.md L22 ("lender principal could become unsecured") and L31 ("refund race"); system-model/contracts/security/sec-023-base-pays-principal-but-bitcoin-activation-does-not-confirm.md L32–36, which calls it "the principal residual cross-chain risk". The 19-hour reserve in build/records/constraints/cons-011-origination-timing-envelope.md L14 exists for this race.
   - The lede (L3) says the guide states every race, so this should appear in "After acceptance" and in the L161 list.

**Minor (imprecise, unsupported, or implicitly sides with one record)**

2. L22: S is published "if the lender never claims a valid repayment". The actual trigger is the Base-L1-finalized `UnclaimedRepaymentRefunded` event, at or after C. Missing Y alone is not the trigger. See state-007-ecvs-s.md L23 and L38, inv-007 L14, flow-005 L26. L148 states it correctly.

3. L22: "S is never revealed on Base." No owner says this. The records say only that S is published "on a durable public source" (sr-007 L33; iface-017 L61).

4. L18: "only its hash goes into the agreement" is applied to all three secrets, and L22 says a loan "commits to the fallback".
   - Whether H(S) is part of the terms is exactly the discrepancy the guide itself raises at L186. The terms field list in iface-001 L27–49 has no H(S).
   - So these sentences quietly take the architecture/SR-001 side.

5. L7, two characterisations the records don't support:
   - "each side keeps control of its own assets and keys throughout" overclaims. Funded USDC sits in an ownerless vault and then in an upgradeable contract (iface-010 L15 and L70; sel-009). After T, the lender alone can spend the escrow (inv-008 L14).
   - "It is not a marketplace" is not the records' wording. They exclude only "public or multi-lender matching" (architecture.md L21), and the offers are browsable (sel-012 L15).

6. L107 and L155: "can pay to speed up a stuck Bitcoin transaction" / "A stuck Bitcoin transaction can be accelerated…" is too broad.
   - The organization can only fund a P2A/CPFP child of a pre-signed package (architecture.md L37).
   - It "cannot add fee to the borrower-controlled prefund itself" (sel-012 L35).

7. L153: "Bitcoin gates stop whenever the two required sources disagree or are both unavailable." This understates the rule. Gates need fresh agreement of both sources, and primary-only status "cannot trigger automation" (iface-006 L63–64), so one source being down also blocks gates.

8. L114: "They are separate deployments with separate credentials". The record says the parts keep separate build, project, credential, origin and release boundaries only "where required" (architecture.md L41).

9. L189, open discrepancy: "the upgrade invariant and that state record also omit the single-key beta period".
   - That is accurate for inv-020 L14.
   - For state-019 it understates the problem: L48 lists "Unrestricted unilateral upgrade/admin key" as an invalid transition. That is in tension with sel-009's single beta key, not just an omission.

No factual errors were found in the numbered items checked: 67h/19h, 259,584 s, C = D+172,800, T = D+259,200, B = D+864,000, the 6+6 and 6+6+6 package counts, the fee tiers, and the 7-day / 2-of-3 governance.
