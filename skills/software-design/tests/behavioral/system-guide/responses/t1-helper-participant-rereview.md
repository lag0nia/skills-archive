I found two substantive problems in the guide and several smaller wording issues. Everything not listed matched its owning records. That covers sessions, reauthentication and TOTP, Vault password replacement, the Vault's dependency rules, handoffs, the 0/15/60/180-second schedule, backups, Cloudflare outage and monitoring, the local demo and its fail-closed rule, the 72-hour rule, authority boundaries, and the scope statuses.

PKG = …/t1/bitrise21/loan-system/design/technical-design

## Substantive problems

**1. A conflict between the payment records is resolved without being stated (guide line 66).**
- Guide: "The account is visibly blocked **only when** the exact pending bytes can be neither found nor reproduced, or the evidence is contradictory."
- The guide repeats the narrow "only" wording from PKG/system-model/contracts/interfaces/iface-022-…md:79 and PKG/system-model/contracts/states/state-021-…md:43.
- The same records also block the account in other cases:
  - when the policy probes run out ("exhausted policy probes escalates visibly to `ReconciliationBlocked`/`Blocked`"): iface-022:133, :141, :167, :175;
  - when the bounded route is exhausted, the generation is stale, or an active intent "cannot be safely classified": state-021:54, :97;
  - when evidence stays unresolved within the bound ("Bounded unresolved evidence visibly blocks the account"): PKG/system-model/domains/participant-access-and-loan-operations/responsibilities/sr-011-…md:49, :86.
- Fix: either drop "only" and list all the blocking conditions, or state the inconsistency as open.

**2. Missing condition on rebroadcast and reproduction (guide lines 64 and 66).**
- Guide: "allows only a rebroadcast of the identical bytes, or a verified reproduction of them" and "A new device must restore or reproduce the exact pending bytes, or the account stays blocked."
- Reproduction is a selected target, not something available now. It depends on a future BU-004 deterministic-signing test vector and proof that it reproduces identically across browsers, restore and a fresh process.
  - PKG/build/records/constraints/cons-028-…md:15 says the current Vault has "no payment-transfer KAT, so the profile is not yet verified".
  - iface-022:38 says no payment-transfer adapter exists yet; iface-022:63–65 says reproduction is allowed "only after the required future KAT … exists".
- If neither the pending record nor a valid reproduction is available, the options are to recover the original backup or device, or to leave the intent and account Blocked "pending an explicit user decision" (iface-022:65). The guide omits that decision.

## Minor wording

**3. Access errors (line 34).**
- Guide: "'forbidden' is reserved for a known action within its scope."
- The record says 403 is for "an in-scope resource the participant may know but whose requested action the established role disallows" (sr-010:49; PKG/build/records/constraints/cons-018-…md:16).
- The guide also leaves out that invalid or expired authentication returns 401.

**4. Operator permissions (line 36).**
- Guide: "Operators can acknowledge incidents, pause automation…"
- After naming all three permissions, this reads as if every workforce member can do these things. Only the `operator` permission can. `viewer` is read-only and `security_admin` manages membership and roles (PKG/build/records/selections/sel-030-…md:33; sr-011:42).

**5. Retry schedule (line 58).**
- Guide: "Retries happen after 1, 2, 5 and 15 minutes and then hourly."
- That schedule is for "an ordinary retryable failure" (PKG/build/records/selections/sel-029-…md:33).
- Two cases the guide omits:
  - Safety-critical reconciliation jobs stay durable until finished, and need operator attention after 15 minutes.
  - Ambiguous timeouts go into reconciliation with no immediate resubmission (sel-029:35; sr-011:86).

**6. Reservation timer (line 79).**
- The lead clause states the unconditional cancel/reopen/infraction rule as what the application does.
- The offer-state record applies Reopened only "after terms commitment" (PKG/system-model/contracts/states/state-001-…md:35).
- The guide does call this a discrepancy, so it does not resolve it. It would be clearer to attribute each version to its record (the offer-selection record PKG/build/records/selections/sel-012-…md:33 versus state-001) and say it is undecided, as the Loan Terms guide does.

**7. Notifications (line 81).**
- Guide: "never contains … an action link"
- The records say no "action-performing link" (sr-011:40), or no "link that itself performs a sensitive action" (sel-029:37). The guide's wording is broader than the records.

**8. Replacing sign-in (line 107).**
- Guide: "Replacing the sign-in provider … it remains deferred."
- What is deferred is "Building and operating an application-owned replacement" for WorkOS (PKG/system-model/contracts/scope/scope-015-…md:14).
- Its conditions also include "an explicit runtime/provider choice" (scope-015:18), which the guide leaves out.
