# Consequential ambiguity: bounded response evaluation

Date: 2026-10-09. This is evaluation evidence, not a consumer design package or an executable regression test.

## Method and scope

[Inputs](inputs.md) and [expected behavior](expectations.md) were saved before either run. Two fresh subagents, with no parent conversation, received identical inputs and isolated copies of the original or revised skills. They could read relevant local references, but were told not to read the rubric, other outputs, or changes. Each produced six actual responses in one context; cases were requested as independent tasks, but were not separately sampled contexts. The primary agent manually assessed outputs against the predeclared expectations. No blind independent grader, multiple-model comparison, statistical reliability claim, consumer edits, document exports, or GitHub ticket writes were involved.

Original source: local `main` at `2e29e1d80689c8640180776f2dd4a2392df22a61`. The first revised copy adds this change except the later sentence distinguishing necessary consequences from conditional downstream effects. Both used the same supplied facts. Skill selection was explicit, so discovery/routing from a vague request was not evaluated. The supplied approved records were compact excerpts: this exercises interpretation and response generation, not retrieval from a large repository. Case 6 exercises a reconciliation plan, not actual multi-file mutation.

Verbatim evidence: [original responses](original-responses.md), [first revised responses](revised-responses.md), [final case 2 response](final-case-2-response.md).

## Observations

| Case | Original | First revised | Evidence and assessment |
| --- | --- | --- | --- |
| 1. Overloaded account | Met | Met | Both connect disablement to Northwind/Southwind and ask before assigning responsibilities. Revised explicitly separates organization, membership, and personal sign-in; original distinguishes shared organization and personal identity but does not spell out membership-only revocation. This is added clarity, not a newly passing case. |
| 2. Mixed shipment | Met | Partial | Both contrast item-level eligibility with an order-wide cutoff, treat legacy code as evidence rather than authority, and label advice provisional. Revised adds a useful indivisibility assumption, but says unshipped items “must continue through fulfillment.” Rejection of cancellation does not establish that later transition; this is a small regression. |
| 3. Already resolved | Met | Met | Both cite SR-007, FLOW-003, and finished TICKET-0042; neither reopens the decision because of the older TBD note. No observed improvement. |
| 4. Harmless synonyms | Met | Met | Both normalize “email notifications” and continue without a new decision. No observed improvement. |
| 5. Expert comprehension | Met | Met | Both include approved label/scan boundaries, consequences and conditional advice. Revised gives an explicit second-item, sealed-but-not-accepted scenario; original conveys a similar situation within its options. Revised makes the contrast easier to locate, but no reader study was performed. |
| 6. Approved reconciliation | Met | Met | Both route the answer to SRs, flow, state, interface, mapped producer/consumer Build Units, TD context, and affected unanswered ticket prose; preserve the unresolved cutoff and other statuses/relationships; record Change Synchronization without editing/rendering the prototype; withhold completion claims without writes/checks. No demonstrated capability gain. |

“Met” means the response met this case's decision criteria, not that every sentence is exhaustive or universally correct. Recommendations remain conditional; no actual product policy was approved by these exercises.

## Observed regression and bounded follow-up

After observing case 2, both skill entrypoints gained one sentence requiring necessary consequences to be separated from possible downstream effects. A third fresh agent received only the unchanged case 2 input and the final design skill copy, without the rubric, previous outputs, or explanation of the issue. Its response says the cutoff would “reject the request; neither remaining item is cancelled” and does not assert continued fulfillment. It still distinguishes both interpretations, preserves shipped items, identifies the legacy implementation, and labels its recommendation conditional. This follow-up meets the expectation for that case.

The complete six-case comparison was not repeated on the initial local baseline after this one-sentence correction; a later final-PR-base run is documented below. The initial revised regression is retained above rather than replaced with a clean score. One successful follow-up does not establish that unsupported consequences are generally prevented.

## Changes and limits

Existing approval, canonical ownership, ticket lifecycle, expert preparation, and prototype rules were already strong. The changes make the ambiguity trigger and investigation-first discipline explicit, prevent naming from silently settling ownership, put meaningful scenarios and consequences into existing ticket fields, and trace clarified meaning across existing authoritative records. They add no schema, statuses, questionnaire, glossary, approval stage, or installed-skill dependency.

The comparative examples largely show preservation and clearer expression, not a proven improvement in success rate. Remaining uncertainty includes real source discovery, contradictory approved histories, larger design packages, repeated interruptions, actual reconciliation writes, projected ticket rendering, exported consultation comprehension, and performance across models. The instructions add reading overhead; the revised first response also presents more alternatives, which could help distinguish scope or burden the reader. The exercise is too small to quantify that tradeoff.

## Validation

- Both skill entrypoints pass the existing skill-creator `quick_validate.py`; PyYAML 6.0.3 was installed only in a disposable temporary virtual environment because the available interpreters lacked it.
- Existing full Software Design suite, Node v24.5.0, with explicit delivery-planning and delivery-workpack-execution skill directories: **465 tests, 462 passed, 1 failed, 2 skipped**. The skipped tests require opt-in real-browser capture.
- Failure: `tests/contracts/project-presentation-workflow.test.mjs:23`, “the presentation table renders PROJECT_VIEW_CONTRACT instead of maintaining a second contract”; `visibleFields.split` throws at line 34. Running that four-test file against the untouched original copy reproduces the same failure (3 pass, 1 fail). This unrelated failure was not changed or hidden.
- After the one-sentence correction, ticket workflow, UI/UX workflow, and consultation-template contract files: **44 passed, 0 failed**.
- `git diff --check` passes.

These results were obtained on the local baseline above. The review branch excludes that baseline's unrelated unpublished delivery-planning commit, preserving it on local `main`; final PR-base verification is recorded below. No consumer package or installed skill copy was changed.

### Final PR-base validation

The feature was replayed onto remote `main` at `ef249ef32d4e50183d4669741332a4d51078ce40`, excluding the unrelated local delivery-planning changes. Only the test README needed a conflict resolution: retain the original remote README and append the new behavioral-evidence link. All new behavioral guidance was preserved; existing prototype-sync rules were not modified.

On this exact PR base, the full `node tests/run.mjs` suite reports **443 tests: 440 passed, 1 failed, 2 skipped**, with the same pre-existing presentation-contract failure and optional browser skips. The count differs because the unpublished delivery-planning commit adds tests. Both skill validators pass again, and all 70 relative Markdown links in the changed files resolve. No new structural test failure was observed.

### Final PR-base response run

Because the PR excludes unrelated local guidance changes, a fourth fresh agent received the same six inputs and isolated copies of the final PR-base skills. It did not receive expectations, prior responses, or this rationale. Its [verbatim responses](pr-base-responses.md) provide final-version evidence, not another controlled original-versus-revised comparison. Total exercise size: two six-case comparative runs, one single-case corrective follow-up, and one six-case PR-base check (19 responses across four fresh contexts).

Cases 1–5 met the predeclared criteria. In particular, case 2 no longer asserts that refusing cancellation mandates fulfillment; case 5 includes a sealed-parcel scenario and separates reopening capability from reliable interception. Case 6 preserves canonical ownership, the unresolved cutoff, other ticket statuses, and manual prototype synchronization, but is assessed **partial**: it conditionally treats the restriction on changing other ticket relationships as preventing TICKET-0042's own required Build Unit mapping repair. The intended task authorizes the active ticket's reconciliation. This is an over-cautious scope interpretation and could introduce an unnecessary blocker if that mapping were missing. The response does not assert the mapping is actually missing and does not perform unauthorized writes, but it falls short of the expected autonomous plan.

This remaining weakness was not hidden or used to justify another round of broad instruction changes. It is evidence that clearer ambiguity guidance does not eliminate authorization-scope interpretation errors. The final run is not a clean six-case success claim; actual multi-file reconciliation and authorization interpretation remain areas for future evaluation.
