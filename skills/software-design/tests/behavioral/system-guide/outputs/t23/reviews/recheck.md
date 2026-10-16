# Recheck of corrected reader guides

Scope: every changed passage in `t23work/architecture-changes-from-draft.diff`, plus the acted-on domain findings BL-1, MI-1, MI-2 (P4) and the P3 "later" note. Text the corrections did not touch was not re-reviewed.

`G` = `t23/bitrise21/loan-system/design/technical-design`. Guide line numbers refer to the current files.

## Summary

| Class | Count |
| --- | --- |
| Blocker | 0 |
| Major | 0 |
| Minor | 5 |
| Note | 6 |

Every acted-on finding is resolved or mostly resolved. No correction states an open point as settled, and none drops an owner limit at a narrated step. Two corrections leave part of their finding in place (MI-1, MI-2). One insertion breaks the sentence that follows it (line 62). Two diff changes were not prompted by any listed finding: one surfaces a conflict the records do not declare (line 84), and one deletes a correct value (line 46).

---

## Architecture guide: findings

| Finding | Guide line(s) | Resolved? | Faithful to owners? |
| --- | --- | --- | --- |
| B1 | 62, 77, 183 | Yes | Yes. Normal-recovery and lender-recovery variants are on both sides of the declared conflict (`G/system-model/domains/bitcoin-authorization-and-recovery/domain.md:49`). Long-stop variants are now explicitly open. CONS-014:14 ("six-normal/six-default terminal phase") supports adding the archive constraint to the twelve side. "A build constraint requires every new escrow to include this route" matches CONS-027:14. |
| M1 | 157 (also 121, 129) | Yes | Yes. SEC-025:57 says "the package holder may not redirect the fixed payout". IFACE-018:86 says "cannot be cryptographically recalled or revoked by application status", and IFACE-018:90 covers `SIGHASH_ALL`. |
| M2 | 20, 58, 76 | Yes | Yes. INV-003:14 and INV-018:14 both say six confirmations. Lines 58, 62 and 68 now state the race; SEC-023:34 and :81 support it. |
| M3 | 36, 38 | Yes | Yes. IFACE-004:51 says "an expiring pointer, not authentication, transaction consent, or cryptographic authority". IFACE-004:53 says "The Vault never signs bytes supplied only by the normal-product page." |
| m1 | 46, 181 | Yes | Yes. The publication half is now attributed to SR-001 alone. "No second lender approval" is attributed to IFACE-003, SCOPE-011 and SEL-012. Both-approve with a second matching approval is attributed to SR-001, IFACE-001:59 and FLOW-001 step 4 (`flow-001…md:29`). |
| m2 | 66 | Mostly | Order now matches FLOW-004 step 3 (`flow-004…md:27`) and IFACE-004:55. The MFA gate is unchanged (see N-3). |
| m3 | 52 | Yes | Yes. FLOW-001 step 7 (`flow-001…md:32`): "lender verifies and adds its signature to all activation variants". |
| m4 | 21 | Yes | Yes. FLOW-009 step 3 (`flow-009…md:27`): "freshly signs all six". See N-2 for wording. |
| m5 | 102 | Yes | Yes. IFACE-020's boundary separates Base observation from the production-activated ECVS. |
| m6 | 3 | Yes, for authority | Yes. The parenthetical points to the declared conflict (`G/system-model/domains/base-usdc-settlement-and-funding/domain.md:48`). Upgrade *reach* stays outside the open list, as n1 accepted. |
| m7 | 66 | Yes | Yes. FLOW-004 step 5 (`flow-004…md:29`): "Finalized public `Y`". |

Other diff changes I checked and found faithful:

- **Line 22, 99, 175.** `S` applies only to a loan created after production activation with `H(S)` committed. Sources: SR-001:28 ("Conditional `H(S)` is present only for loans created with the approved capability"), IFACE-017:48 and SEC-024.
- **Line 56.** "Explicit funding approval" matches `base-usdc…/domain.md:35` ("explicit selected-lender funding approval"). The wording also stops readers confusing it with the open final-terms approval.
- **Line 58 and 66.** "A failure or cancellation clears the plaintext" matches IFACE-004:55: "Success, rejection, cancellation, timeout … disposes the session and clears the preimage, key …".
- **Line 116.** IFACE-017:15 says the ECVS "must never gate the Base refund". SR-007:15 says "that refund does not itself unlock Bitcoin".
- **Line 123.** SEC-025:42 says "Neither is protection until implemented for the escrow and confirmed before the lender transaction". FLOW-010 owns the route.
- **Line 129.** IFACE-018:74 and :86 cover copied packages that cannot be recalled. SEC-025:18 says "Lender or package holder may broadcast". The fixed destination is IFACE-018:90.
- **Line 182.** Matches the declared line, `bitcoin…/domain.md:48`: "the TICKET-0018 and TICKET-0089 resolutions likewise use the 200 sat/vB parent with CPFP eligibility and an alert".
- **Line 186.** CONS-027:14 sets `nLockTime = repayment_deadline + 864,000`, so attributing `B` to the constraint is supported.

## Domain guides: findings

| Finding | Guide line | Resolved? | Notes |
| --- | --- | --- | --- |
| BL-1 | `G/guide/domains/base-usdc-settlement-and-funding.md:25` | Yes | "Whether V1 has an on-chain pause is also open" now matches the declared line (`base-usdc…/domain.md:49`), and the sentence no longer contradicts itself. Each side is attributed correctly: SR-003, SEL-009 and STATE-019. Change list B3 (`change-lists.md:31`, :64) is updated to match. |
| MI-1 | `G/guide/domains/bitcoin-authorization-and-recovery.md:23` | Partly | See R-4. |
| MI-2 (P4) | `G/guide/domains/participant-access-and-loan-operations.md:17` | Partly | See R-5. |
| P3 "later" | `G/guide/domains/participant-access-and-loan-operations.md:33` | Yes | "Records a correction that now passes focused checks without finalized completion receipts" matches `G/build/workflow/handoffs/README.md:23` ("now passes focused … probes"; completion receipts "have not yet been finalized"). The same inference remains in the architecture guide (N-6). |

---

## Minor

### R-1. Line 62: the inserted refund sentence breaks "Only then"

`G/guide/architecture.md:62`:
> "…whichever actually reaches six confirmations becomes the escrow. If one of Ana's prefund-refund transactions confirms first instead, no escrow exists and Leo's principal is unsecured. Only then does the Bitcoin domain build the terminal packages for that confirmed escrow…"

The M2 insertion now sits between "becomes the escrow" and "Only then". Read literally, "Only then" now refers to the refund-wins case, where "no escrow exists". That contradicts "that confirmed escrow". Most readers will recover the meaning, but this is a new error from the correction. The same race is already stated at lines 58, 68 and 112.

Fix: move the refund sentence after the terminal-package sentences, or change "Only then" to "Only once the escrow is six-confirmed".

### R-2. Line 84: the guide declares an open point the records do not declare, and leaves it out of its own Open questions

`G/guide/architecture.md:84`:
> "Whether it also carries the selected offer revision and reservation number is unresolved: the architecture record and the loan-terms responsibility say it does, while the terms interface says offer and reservation identity belongs to the offer-and-reservation contract, not the terms value."

Each side is quoted accurately:
- `G/system-model/architecture.md:25`: "The binding covers … the selected offer revision and reservation number".
- SR-001:28: "selected offer revision and `(offer_id, reservation_number)`".
- IFACE-001:61: "Offer/reservation identity belongs to IFACE-003, not `LoanTermsV1`."

However, no `Open question:` or `Unresolved source conflict:` line in `system-model/architecture.md` or any `domain.md` declares this point. Line 179 says "The records leave these points undecided", yet line 181–187 does not list it.

So the guide presents a guide-found conflict as a records-declared one, and its body and its Open questions list do not agree. Either list it at 177–187 as a conflict the guide found but the records do not yet declare, or report it to the user for the records to declare.

### R-3. Line 46: the 24-hour reservation window was deleted although no finding asked for it

Draft:
> "reserves the offer for her for 24 hours"

Now:
> "reserves the offer for her"

The value is correct and owned in three places:
- STATE-001:22: "holds the 24-hour reservation".
- IFACE-003:19: "reservation timestamps and 24-hour expiry".
- SEL-012:33: "The reservation gives the borrower 24 hours to produce a valid prefund".

The deletion makes nothing false, but the guide no longer states the reservation window anywhere. Restore it, or say why it was removed.

### R-4. MI-1 is only partly resolved: the guide still says a former decision states fail closed

`G/guide/domains/bitcoin-authorization-and-recovery.md:23`:
> "while the action contract, and a former decision that the records do not identify, say fail closed."

Owner, `G/system-model/domains/bitcoin-authorization-and-recovery/domain.md:48`:
> "The previous domain explanation also attributed fail closed to a 'former decision', which this migration could not locate."

The records do not establish that such a decision exists or what it says. They report only that an earlier explanation made that attribution. The guide still asserts, as a fact, that a former decision says fail closed. That attributes one side of the open point to a source no record confirms. The hedge limits the damage.

Fix: "while the action contract says fail closed (an earlier explanation also cited a former decision that the records cannot locate)".

### R-5. MI-2 is only partly resolved: the main clause still asserts the explicit-approval side

`G/guide/domains/participant-access-and-loan-operations.md:17`:
> "both roles approve the same final candidate under the terms domain's exact rules, although whether the lender approves again after reservation is an unresolved source conflict explained in the loan terms guide."

The main clause still states SR-001's side as fact. The concessive clause then says that same fact is unresolved, so the sentence contradicts itself.

The conflict is now flagged, and the link resolves to `loan-terms-and-commitments.md:11`, which states both sides. A reader is therefore unlikely to take the outcome as settled, which keeps this Minor.

Fix: lead with the conflict, for example "under the terms domain's rules, which leave unresolved whether both roles must approve the final candidate or reservation already creates the loan without a second lender approval".

---

## Notes

- **N-1. Line 183, "its own construction statement".** The subject is now compound ("the package-construction responsibility and the durable package-archive constraint"), so "its" is ambiguous. It means SR-002.
- **N-2. Line 21.** In "Apart from the borrower's prefund and a cooperative settlement, which both participants sign freshly when they agree", the relative clause can be read as covering the prefund, which only the borrower signs. A reader is unlikely to be misled.
- **N-3. Line 66, MFA gate (residue of m2).** "Fresh reauthentication and multi-factor authentication" follows FLOW-004 step 3 ("fresh reauthentication/MFA"). IFACE-004:15 and :118 make TOTP conditional on enrollment ("any enrolled TOTP gate"). This was not changed. The guide follows a record, but it is stronger than the interface.
- **N-4. Line 58, "from here".** Activation pending begins "After Base L1-finalized acceptance" (INV-018:14). "From here", placed after the acceptance sentence, is close enough, but it does not say L1-finalized.
- **N-5. Line 181 and line 46, side B.** FLOW-001 is correctly cited for both-approve (step 4). Its precondition (`flow-001…md:19`) also says publication "is standing acceptance", so FLOW-001 partly sits on side A. The guide no longer claims FLOW-001 denies that, so nothing is misattributed.
- **N-6. Untouched architecture line 86 still says "a later transfer-review correction".** The domain guide removed this same inference under the P3 note. This is outside the diff and is listed only for consistency.
