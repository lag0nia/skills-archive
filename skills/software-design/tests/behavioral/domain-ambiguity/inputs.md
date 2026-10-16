# Bounded response exercises

Treat each case as an independent user task with no shared conversation. Use the assigned skill copy and relevant references. Sources below are complete for the bounded exercise; do not browse or inspect other projects. Produce the actual next response or requested draft, not an assessment of the instructions. Do not edit files or contact anyone. Any implementation shown is evidence of current behavior, not automatically approved intent.

## 1. Intake: account ownership

Use software-design-intake. User: “Help clarify this before proposing responsibilities: an account owns projects; account admins invite people; disable an account to revoke access.” Notes: Northwind has Alice and Ben as admins and three projects. Alice also works for Southwind. No approved definition of account exists. Ask the next useful question, including advice if supported; do not produce the full checkpoint yet.

## 2. Design discussion: cancellation

Use software-design. Within an approved order-lifecycle design pass, user: “Customers can cancel an order before shipment. Please help settle the cancellation rule.” Approved facts: orders can contain several items shipped separately; cancellation must never recall a shipped item. Existing implementation: cancel(order) rejects when any item is shipped, otherwise cancels all items. The implementation predates the new multi-shipment requirement. No approved rule covers a mixed shipped/unshipped order. Produce the next focused discussion response, not a full package.

## 3. Settled question

Use software-design. User: “Continue the cancellation discussion for TICKET-0042; do we still need to choose partial versus whole-order cancellation?” Approved SR-007 and FLOW-003: customer may cancel any unshipped items even after another item ships; shipped items remain unchanged. TICKET-0042 is finished, resolution matches these records. An older meeting note says “cancellation semantics TBD.” No newer contradictory source exists. Produce the next response.

## 4. Harmless wording

Use software-design-intake. User: “Continue preparing the intake checkpoint; the draft says email alerts and my latest note says email notifications.” Approved source explicitly defines both as the same transactional email, with the same recipient, trigger and delivery rule. No other uncertainty affects this phrase. Respond only to this wording issue and the next action; do not generate an entire checkpoint.

## 5. Standalone ticket / consultation

Use software-design and its ticket/expert guidance. User: “Draft the question for our fulfillment expert from TICKET-0043. They won't have this chat. Plain-text question content only; don't export or send a document or modify tickets.” Ticket: todo, product, SR-007, parent_decision null. Current context: partial cancellation of unshipped items is approved, but it is unknown whether a parcel being packed counts as shipped. Approved policy: a carrier acceptance scan always means shipped; a printed label alone does not. Two unresolved candidates: block cancellation at warehouse seal, or at carrier acceptance. Operational evidence: warehouse staff can reopen sealed parcels before pickup, but this adds handling effort. Draft understandable context, remaining question, options and consequences, and a supported provisional recommendation.

## 6. Approved answer and bounded reconciliation

Use software-design. User: “Approved: customers may cancel the remaining unshipped items after one item has shipped. Reconcile this answer across affected records. Don't change other ticket statuses or relationships. Don't sync the prototype.” Authorized active pass: TICKET-0042, todo, product, owner SR-007, affects SR-007/SR-008, parent TD-006; normal answer recording and its own status transitions are authorized. Existing owners: SR-007 owns cancellation; SR-008 owns fulfillment; FLOW-003 owns order cancellation flow; STATE-002 owns item/order states; IFACE-004 owns cancellation request and response, producer SR-007 and consumer SR-008. BU-001 and BU-002 already realize those producer/consumer responsibilities. TD-006 is Open with TICKET-0042 and TICKET-0043, both todo. TICKET-0043 asks when packing becomes shipment and currently assumes any shipment blocks all cancellation; it remains unresolved. UI specification journey cancel-items currently offers only whole-order cancellation. The initial prototype has been reviewed. No Stage 9 handoff exists. Relevant canonical records currently encode whole-order rejection when any item ships. In this read-only exercise, produce the precise reconciliation plan and short illustrative replacement prose where useful; state what can and cannot be claimed complete without writing or validation.
