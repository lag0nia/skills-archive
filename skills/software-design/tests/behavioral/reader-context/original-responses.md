## 1. TICKET-0101

Context: Orders records an accepted order in its database. Notifications sends its acceptance email. An email service outage must not prevent an order being accepted, and every accepted order must eventually lead to a notification attempt. The unresolved problem is how to preserve the work to be done between those two steps. For example, if the software stops immediately after saving an accepted order, it must still be possible to discover that an email needs to be attempted when processing resumes. This ticket chooses the software mechanism for that handoff; the required behavior is already fixed.

Question: How should accepted orders become durable work for Notifications: by saving a pending event alongside the order, or by reading committed changes from the database log?

Options:

- Transactional outbox: Save a pending notification event in the same database transaction as the accepted order, so both records are saved together or neither is. A relay—a background process that forwards pending work—later passes the event toward Notifications. This makes the notification obligation explicit in application data. The software must maintain that record and its forwarding process, including recovery after interruptions.
- Read committed changes from the database log: Use the database's record of committed changes to identify accepted orders and pass corresponding work toward Notifications. This avoids a separate application-written pending-event record for capture. It requires a suitable way to read and interpret the log and to resume without losing required changes after an interruption. Feasibility depends on the database and its available facilities, which have not been specified.

Recommendation: Provisionally prefer the transactional outbox because it directly records the obligation to attempt notification alongside acceptance of the order. This recommendation assumes the order and pending event can be committed together; that must be verified. A database-log approach may be preferable if suitable capture and recovery facilities are available, but that evidence is not supplied. Neither option is selected. The capture mechanism alone does not establish exactly-once delivery or decide retry and duplicate behavior.

## 2. TD-010

context: Orders accepts orders by committing them to its database; Notifications sends acceptance emails afterward. This decision brings together the software choices needed to preserve the notification obligation across that handoff and handle interrupted processing.

why_it_matters: An accepted order could otherwise be left without any notification attempt, or an email outage could interfere with order acceptance. The combined design must preserve acceptance independently of email availability while keeping the later notification work recoverable.

established: Orders owns the committed accepted order, and Notifications sends the acceptance email. Accepting an order must not depend on the email service being available. Every accepted order must eventually cause a notification attempt. Event capture, retry timings, and duplicate handling have not been selected; no exactly-once guarantee is established.

how_tickets_fit: Event capture preserves evidence that notification work exists. Relay retry behavior governs how forwarding continues after failures. Duplicate handling governs what happens when the same work is encountered again. Their answers must form a compatible path from accepted order to notification attempt, including recovery after interruptions. The children own their individual choices; their shared parent does not impose a decision order.

## 3. Approved membership correction

The planned repair will replace the rule that deletes completed exports on membership revocation with the approved distinction between future export permission and already-produced files.

Concrete record corrections:

- Membership: “Revoking a person's membership in an organization removes that membership as a basis for future export authorization for that organization.” Remove any revocation side effect that deletes completed exports.
- Export Authorization: “At export request time, reject a request by a person whose membership in the requested organization has been revoked.” Keep permission checking owned here and organization membership owned by Membership.
- Export Storage: “Membership revocation must not delete exports already produced for that organization.” Remove the existing deletion rule and any corresponding storage transition.
- Affected flows, contracts and correctness obligations: replace the revocation-to-deletion step with the request-time authorization rule. Record two observable checks: a revoked person cannot request a future export for that organization, and exports completed before revocation remain stored. Update examples or ticket options that still imply deletion.

This is a Software Design repair: it corrects permission and retention behavior in the existing owners. Your explicit approval covers this correction, so no further approval is needed. Running exports are outside the supplied correction; this repair will not establish behavior for them.

Route: Reconcile the affected Software Design sources, then continue the authorized pass from the corrected rules.

Expected Recording Plan: Amend the existing Membership, Export Authorization and Export Storage records and their affected flows, state, contracts and verification obligations under `system-model/`. Repair the brief first only if it contains the same error. Record the approved resolution in any existing affected ticket, refresh any associated TD and directly affected open questions, and reconcile existing Build Design or handoff references where they inherit the incorrect behavior. Mark a ticket finished only after its canonical targets and applicable checks are complete. This read-only exercise proposes those actions; no records have been written or validated.

## 4. Accountant consultation

Invoice correction workflow — accounting advice
Prepared: 9 October 2026
Respondent: ____________________
Response date: ____________________

Purpose and context

We are designing how the software should support corrections after an invoice has been issued. Sales records confirmed purchases, and Billing creates invoices from those purchases. Once issued, an invoice cannot be edited in this software. The product owner has not yet selected which correction workflows the product will support.

Please advise on appropriate accounting treatments and the information they require for the jurisdiction and business entity already covered by your engagement. Your advice will inform the product owner's scope decision. Please distinguish requirements from recommendations and note conditions or exceptions. You do not need to choose software mechanisms.

1. Appropriate treatments for an issued invoice that needs correction

If an issued invoice contains an incorrect amount or customer detail, what accounting treatments are suitable? Please distinguish cases where the underlying purchase was recorded incorrectly from cases where only the invoice is wrong. These are illustrative situations, not approved product scope.

For each applicable treatment, explain when it may or must be used, which additional documents or entries it requires, and how those relate to the original invoice. Where there are alternatives, explain their practical consequences and your recommendation. The original issued invoice must remain unchanged in this software; please identify any accounting requirement that this constraint would prevent us from meeting.

Answer: ____________________________________________________________
____________________________________________________________________

2. Information and evidence required

For the treatments you identify, what information must be retained or recorded to explain and substantiate the correction? Please address any required links to the original invoice or purchase, reasons, amounts, dates, identifying information, approvals or supporting evidence, where applicable. Distinguish mandatory information from helpful audit information and identify the basis for mandatory requirements.

Answer: ____________________________________________________________
____________________________________________________________________

3. Conditions that change the treatment

Does the appropriate treatment change if an invoice has already been sent, paid, partly paid, or included in a reported accounting period? Please explain only the distinctions relevant to the engagement, including any effect on balances, payments, reporting or customer documentation. If another fact is needed to advise, name it and explain how the answer could change.

Answer: ____________________________________________________________
____________________________________________________________________

4. Advice for deciding supported workflows

Which of the treatments above would you recommend supporting, for which situations, and why? Please distinguish a treatment that is required when a situation occurs from an optional convenience. Identify cases that would need separate professional handling if the product did not support them. The product owner will use this advice to decide the supported scope; no correction behavior has yet been approved.

Answer: ____________________________________________________________
____________________________________________________________________

Incorrect assumptions, exceptions, missing requirements or other concerns:
____________________________________________________________________
____________________________________________________________________

## 5. Download button

Use **Download invoice PDF**. It clearly names both the action and the file.
