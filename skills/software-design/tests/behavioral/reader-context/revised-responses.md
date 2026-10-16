1. Technical ticket — TICKET-0101

context: Orders records accepted orders in its database. Notifications uses the acceptance information to attempt an acceptance email. These happen separately: an unavailable email service must not prevent an order from being accepted, but every accepted order must eventually lead to a notification attempt. The missing choice is how to preserve and pass that information between them. A transactional outbox saves a pending acceptance event alongside the order in the same database transaction, so they are committed together; a relay later reads that event and passes it toward Notifications. The alternative reads committed order changes from the database's change log and turns the relevant changes into notification work. For example, if processing stops just after an order is committed, either approach must allow the notification work to be recovered afterward. Neither approach has been selected, and capturing the work alone does not settle retry or duplicate handling.

question: Should accepted-order notification work be captured by saving a pending event with the order, or by reading committed order changes from the database log?

options:
- Transactional outbox: Orders saves the order and its pending acceptance event together. This makes the obligation to notify explicit in the same commit as acceptance. It requires an event record and a relay that finds pending work and tracks its progress; those details must preserve recovery after interruption.
- Database-log capture: A separate reader detects accepted orders from committed database changes. Orders does not need to write a separate pending-event record. This requires a suitable database log and a reader that can identify acceptance changes, track its position, and recover without losing required changes. Suitability depends on database capabilities and log retention, which are not yet established.

recommendation: Keep the selection open until those database and recovery capabilities can be compared. The outbox is a reasonable candidate when an explicit pending notification record can be committed with the order; log capture is a reasonable candidate when the database and capture tooling can reliably retain and resume the relevant changes. The approved behavior does not by itself establish which is preferable. Neither option promises exactly-once processing or successful email delivery; the required outcome is an eventual notification attempt.

2. Parent — TD-010

context: Orders accepts and stores orders; Notifications sends their acceptance emails. The shared decision is how to connect those responsibilities reliably while allowing order acceptance to continue when the email service is unavailable. Notification work must survive the separation between recording an accepted order and attempting its email.

why_it_matters: An order could be accepted and then lose its notification work if processing stops between the two responsibilities. Making email availability a condition of acceptance would instead prevent valid orders from being accepted during an email outage. The combined design must preserve acceptance independence and eventual notification attempts.

established: Orders commits accepted orders to its database. Notifications sends acceptance emails. Accepting an order must not depend on email service availability. Every accepted order must eventually cause a notification attempt. The capture mechanism, retry timings, and duplicate policy remain unresolved; no exactly-once guarantee is established.

how_tickets_fit: The capture child establishes how accepted orders become recoverable notification work. The relay-retry child establishes how interrupted or unsuccessful transfer of that work continues. The duplicate-handling child establishes how repeated processing of the same acceptance is handled. Their outcomes must work together so that recovery preserves required attempts and repeated work receives the agreed treatment. These are complementary parts of the same reliability decision; their grouping and explanation order do not establish dependency edges.

3. Repair

I would pause the affected part of the pass to repair the incorrect revocation rule, then resume the authorized pass. Your approved correction supplies the required behavior; no further approval is needed for this bounded repair. This exercise plans the changes only.

Membership owns whether someone belongs to an organization. Export Authorization uses that permission at the time an export is requested, while Export Storage holds exports already produced. The current records incorrectly make membership revocation delete completed exports. The correction separates permission to request future exports from retention of completed output.

The proposed record corrections are:
- Membership: “Revoking a person's membership in an organization must block that person's subsequent export requests for that organization. Revocation must not delete exports already produced.” Remove any revocation effect that directs deletion of completed exports.
- Export Authorization: “At export request time, check the person's permission for the requested organization. Reject a future export request by a person whose membership in that organization has been revoked.” Replace any rule that treats deletion of historical output as the means of enforcing revocation.
- Export Storage: “Completed exports are retained when the producing person's membership is revoked. Membership revocation does not trigger deletion of completed exports.” Remove the revocation-triggered deletion transition and corresponding storage instruction wherever they are recorded.
- Affected flows and contracts: route revocation's authorization consequence to future export requests and remove the completed-export deletion consequence. Correct existing invariant/security obligations to verify both rejection of subsequent requests for that organization and preservation of already-produced exports.

For example, if a person produces an export and then loses membership, a subsequent export request for that organization must be rejected, and the completed export must remain stored. This does not establish whether that person can download historical exports or what happens to an export already running; neither behavior needs to be chosen to record this correction.

Route: Software Design repair within the already authorized pass, because this changes the recorded permission and retention behavior. Resume the pass after the affected records agree.

Expected Recording Plan: Amend the existing Membership, Export Authorization, and Export Storage records and affected flow/state/contract owners under system-model/. Repair earlier source records only where they actually contain the wrong rule. Reconcile any existing affected ticket resolution, parent TD context, and unanswered options under build/workflow/; preserve genuine remaining questions and established relationships. Check affected Build Design or handoff records if present for inherited deletion instructions, and update their affected routing within scope. Validate changed records before claiming reconciliation or ticket completion. No writes or validation are claimed in this read-only exercise.

4. Consultation — Invoice correction advice

Prepared: 9 October 2026
Respondent: ____________________
Response date: ____________________

Purpose and context

We need your accounting advice so the product owner can decide which invoice correction workflows this software should support. Please use the jurisdiction and business entity already supplied in your engagement.

Sales is the part of the software that records confirmed purchases. Billing uses those purchase records to issue invoices. Once issued, an invoice cannot be edited in this software. The correction workflow has not yet been selected. We need to understand suitable accounting treatments and the information they require while preserving the original issued invoice.

Your advice will inform the product owner's scope decision. You are not being asked to approve product scope or choose software architecture. Please distinguish required treatment from recommended practice, identify any conditions on your advice, and cite applicable authority where useful. If an answer depends on a fact not supplied, name that fact and give conditional guidance where possible.

1. Suitable treatments for different corrections

For an issued invoice that needs correction, what accounting treatments are suitable in the applicable jurisdiction? Please distinguish the cases that materially change the treatment. Illustrative cases to assess, rather than assumed supported features, include an incorrect amount, incorrect customer information, and a purchase subsequently cancelled in whole or part.

For each relevant case, explain whether a correcting document, a reversal and replacement, or another treatment is appropriate; what happens to the original invoice's accounting meaning; and what restrictions or conditions apply. Please identify cases in which retaining the original invoice without editing it would be insufficient and explain the additional action required.

Answer:
____________________________________________________________
____________________________________________________________

2. Information and documentary links

For each suitable treatment, what information must the software capture or produce? Please specify the required links to the original invoice or purchase, the correction reason, dates, amounts and tax details, numbering or references, and evidence where applicable. Which details must remain visible on the original and correcting documents, and what must be communicated to the customer?

Please distinguish mandatory information from useful additional information, and explain any conditional requirements.

Answer:
____________________________________________________________
____________________________________________________________

3. Timing, payment, and reporting consequences

Does the suitable correction treatment change when an invoice has been paid, partly paid, or included in an accounting or tax reporting period? These are illustrative circumstances for your assessment. Please explain which distinctions the product owner must account for, the resulting accounting or reporting actions, and any conditions or time limits that affect a supported workflow.

Answer:
____________________________________________________________
____________________________________________________________

4. Advice for the product owner's workflow decision

Based on your answers, which correction treatments would you recommend the product owner consider supporting, and why? Describe any cases that require separate handling or accountant involvement, and the consequences of leaving a treatment unsupported. Please identify the facts still needed to firm up your recommendation. The product owner will decide the supported scope after reviewing this advice.

Answer:
____________________________________________________________
____________________________________________________________

Incorrect assumptions, exceptions, missing requirements, or other concerns:
____________________________________________________________
____________________________________________________________

5. Simple

Use “Download invoice PDF.” It names both the document and the format.
