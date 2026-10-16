# Reader context response evaluation

## Method

On 2026-10-09, two fresh independent agent contexts received the same [five inputs](inputs.md), one with the untouched Software Design skill from commit `d6e32c1c0bbc473f055104821fe752483a660793`, the other with the revised skill. Neither received the other output, the change rationale, or an intended answer. The revised agent received a wording correction during its pass clarifying that consultation questions should stay within the recipient's expertise or remit. [Criteria](criteria.md) were recorded before reviewing either output. Full responses are retained: [original](original-responses.md), [revised](revised-responses.md).

These are read-only plain-text simulations, not real package mutations or DOCX exports. Inputs supply compact approved facts and strong boundaries; they do not test discovery from a large package. Each agent handled all five cases in one context, with original and revised runs separate. Skill routing was explicit.

## Observations

| Case | Original | Revised | Assessment |
| --- | --- | --- | --- |
| Technical ticket | Explains participants and failure scenario; plain-language question precedes named mechanism definitions in options. Provisional outbox recommendation has an explicit assumption. | Defines both mechanisms in context before the question; keeps selection open pending capability evidence. | Both preserve approved attempt guarantees and avoid exactly-once claims. Revised concept ordering is more explicit, but context and options repeat some mechanism explanation. Neither recommendation stance is demonstrably superior from these facts. |
| Parent decision | Connects capture, retries, and duplicates to the shared outcome using four existing fields. | Does the same and explicitly separates explanation order from dependency edges. | Both meet the criteria; no observed capability gain. Neither copies child questions or selects open policy. |
| Repair | Gives concrete changes and ownership boundaries; no redundant approval or false completion. | First explains Membership, Authorization, and Storage together, then gives corrections and a scenario. | Revised relationship is easier to locate. Both preserve completed exports and leave running-export policy unsettled. Revised also identifies historical-download permission as unestablished without asking an extra question. Neither exercises actual reconciliation. |
| Consultation | Gives system context, four specialist question groups, answer spaces, and product-owner scope boundary. | Explains Sales and Billing explicitly as parts of the software; asks for accounting input within recipient authority. | Both reuse engagement context and avoid inventing accounting rules or asking the owner to supply specialist answers. Illustrative cases remain labeled. Four groups may still be more than a recipient needs; no recipient study tested the burden. |
| Simple question | One sentence recommending Download invoice PDF. | One sentence recommending the same label. | Both stay brief without a new ticket, approval, or questionnaire. |

No unsupported requirement or material contradiction was identified in these outputs. The observed differences support localized presentation improvements, not a measured improvement in reliability. No repeated sampling, human comprehension study, actual GitHub projection, DOCX rendering, multi-file repair, or canonical-record generation was performed.

## Change and scope review

Guidance extends existing ticket context, consultation preparation, checkpoint explanation, parent fields, and local canonical-record purpose. A single responsibility template illustrates the bounded purpose guidance. Intake was inspected and left unchanged: its source-digestion step already requires clarifying consequential concepts before proposing responsibilities and flows, and its brief template puts plain-language interpretation ahead of source notation. No concrete additional intake gap was established.

Existing consequential-ambiguity guidance, approval semantics, schemas, identities, statuses, mappings, dependency rules, exact contracts and canonical ownership remain intact. No new runtime dependency, external skill reference, consumer package edit, installed-copy edit, renderer change, DOCX layout change, UI/UX workflow change, or delivery-evidence change was introduced. Evaluation files are test evidence under the existing behavioral-test convention, not a second design documentation system.

## Verification

- Full existing Software Design suite with explicit delivery-planning and delivery-workpack-execution directories, Node v24.5.0: **465 tests, 462 passed, 1 failed, 2 skipped**. The two skips are opt-in real-browser tests.
- The failure is `tests/contracts/project-presentation-workflow.test.mjs:23`: `visibleFields.split` throws at line 34. Running that file against the untouched baseline reproduces the same failure: 3 passed, 1 failed. No unrelated repair was made.
- Changed YAML templates retain exactly the same field keys and order. Entrypoint frontmatter is unchanged.
- All 79 relative file links in edited guidance were inspected: the only missing destination is the unchanged illustrative `inv-001-example.md` link in the responsibility template. The newly added relative link and its heading anchor resolve. No new broken links were found.
- `git diff --check` passes. Manual final review found no new approval step, decision dependency, duplicate canonical record, or conflict with the existing ownership rules.
- The skill-creator quick validator could not run because the available Python runtime lacks PyYAML. No dependency was installed for this prose-only change; the suite, schema comparison and link checks above provide the available structural evidence.
