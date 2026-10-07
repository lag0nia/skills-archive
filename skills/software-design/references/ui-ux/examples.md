# UI/UX Design Examples

These contrasts teach design judgment, not a prescribed visual style or layout.

## Settings: Make The Choice Legible

**Before:** A settings page shows a status badge, a paragraph explaining preference management, current and proposed values in separate panels, and several equal-weight actions.

**After:** Put the current and proposed values together under the setting's user-facing name. Keep the effective date and material consequence beside the confirmation action. Offer advanced policy detail only when requested, and make cancel visually secondary.

**Why:** Remove the badge and explanatory panel because grouping and labels already communicate the state and task. Retain the effective date and consequence because they change an informed decision. Move policy detail because it is useful but not needed to understand the immediate choice.

## Booking: Match The Sequence To The Decision

**Before:** One long page introduces the service, explains every booking rule, lists all availability, asks for attendee details, and shows payment terms before a time is selected.

**After:** Start with the familiar date-and-time selection pattern. Show price and material restrictions with the options they affect, before requesting unnecessary attendee details. Before submission, confirm the final total, cancellation deadline, and booking consequence.

**Why:** Keep selection-changing information early and confirm the final commitment later. The sequence follows the user's decisions instead of the system's data model.

## Confirmation And Recovery: Preserve Truth And Progress

**Before:** Submission shows a generic toast. Returning to the task displays the original action again. Failure clears the form and presents an internal error code with a paragraph about retry behavior.

**After:** Show the specific completed result and useful next step; returning reflects the completed task. Cancellation before submission may preserve the original state, but closing or cancelling after submission does not imply reversal. If failure is confirmed with no effects and retry is safe, say so and offer retry. If the outcome is unknown, preserve context and check the existing operation before allowing another submission.

**Why:** The interface must distinguish completion, safe failure, and uncertainty instead of turning every error into a retry. Persistent state and an outcome-specific next step communicate more reliably than a generic toast or technical paragraph.
