# UI/UX Design

This specification owns presentation and interaction requirements for the in-scope human-facing surfaces. Link canonical product and system owners instead of duplicating their behavior or rationale.

**Prototype launcher:** [Open candidates](./prototype.html)

Link each candidate entrypoint below. A candidate folder may contain one or multiple pages and local resources; selection never requires copying it to the launcher.

## Scope And Ownership

- In-scope surfaces: TBD.
- Upstream UI/UX owners: TBD or `None.` with reason.
- Canonical behavior and state sources: TBD.
- Presentation and interaction ownership: this specification.
- Out of scope: TBD.

## Intended Users And Main Tasks

| User or operator | Main task | Likely prior knowledge | What must be clear without blueprint knowledge | Context and device |
| --- | --- | --- | --- | --- |
| TBD | TBD | TBD | Product purpose, where the task starts, next action, and material consequences | TBD |

## Design Rationale

Keep this to a few concrete sentences or compact entries, not a questionnaire.

- **User goal:** TBD.
- **Starting context and next meaningful action:** TBD.
- **Information needed now / later / optionally:** TBD / TBD / TBD.
- **Familiar interaction pattern and why it fits:** TBD.
- **Reference questions:** `None — suitable user-provided or approved direction reused` or the task, interaction, and visual qualities needing evidence.
- **Visual shortlist and evidence:** brief entries in the form `<source link or allowed consumer-artifact path> — <directly inspected flow / published screenshot / promotional image / inferred behavior> — <screen or interaction> — <fit> — <adopt or adapt> — <avoid or cannot transfer>`. Record access or capture limitations; do not imply an image proves a tested interaction.
- **Recommended direction:** the coherent clarity, density, interaction, and visual qualities to use; alternatives only when useful.
- **Direction-review outcome:** `Approved — <qualities>` / `Existing approved direction reused — <source>` / `Blocked — <limitation or unresolved material expectation>`.

## Prototype Alternatives And Selection

Record one explicit selected candidate entrypoint or `Unresolved`; selection does not approve changed behavior or unreviewed journeys.

- **Selected implementation target:** `Unresolved` — select a linked candidate entrypoint after review.
- **Direction selection:** `Selected — <direction>` / `Unresolved`.
- **Covered-flow approval:** `Approved — <flow and states>` / `Not reviewed` / `Blocked — <finding>`.
- **Required prototype coverage:** `Complete — <scope>` / `Incomplete — <remaining scope>` / `Not started`.
- **Review slideshows (optional):** `Not asked` / `Declined` / `Requested — <default or expanded coverage>` / `Skipped — <missing capture capability>`. After a candidate's `slides.html` exists, link it after that candidate's entrypoint in the table below, labelled Slides, and add `partial — <omission>` or `outdated — <limitation>` when applicable. A deck is a derived screenshot aid; it never selects a candidate, approves a flow, or evidences tested interactions.

| Alternative | Bounded comparable coverage | Material presentation or interaction difference | Selection / review status |
| --- | --- | --- | --- |
| [Main candidate](./alternatives/main/index.html) | TBD | TBD | Exploratory / selected / retained comparison; optional date or revision |

## Product And Demo Boundary

State which interactions are product behavior and which are demo conveniences, simulated actors, seeded fixtures, or test data. Preserve the approved account and role model; explain why reviewer-selected actors do not create permanent product-role restrictions. Record the single prototype disclosure outside the product surface. Specify separately any notice that a runnable demo actually requires. If a concrete requirement prevents opening the prototype directly from disk, record that requirement and how to run the prototype.

## Journey And Route Coverage

Start with one direction-setting flow that shows arrival, task discovery, a meaningful action, and its persistent result, plus representative cancellation and failure/recovery. Fix its comprehension and presentation before expanding this table. Reuse approved visual or interaction references when provided.

| Journey or destination | Distinct user purpose and entry | Primary action, consequence, and next step | Consequential dialog or cross-surface transition | Canonical sources |
| --- | --- | --- | --- | --- |
| <a id="journey-main"></a>Representative direction flow | TBD | TBD | TBD or `None.` | TBD |

## State Coverage

Cover only materially distinct states. Reuse a shared pattern instead of enumerating every combination.

| State family | Where it matters | User-facing meaning and available action | Prototype state |
| --- | --- | --- | --- |
| Empty / first use | TBD | TBD | `data-prototype-state="empty"` or `Not applicable — <reason>` |
| Loading | TBD | TBD | `data-prototype-state="loading"` or `Not applicable — <reason>` |
| Waiting / pending | TBD | TBD | `data-prototype-state="waiting"` or `Not applicable — <reason>` |
| Success | TBD | TBD | `data-prototype-state="success"` or `Not applicable — <reason>` |
| Error | TBD | TBD | `data-prototype-state="error"` or `Not applicable — <reason>` |
| Recovery | TBD | TBD | `data-prototype-state="recovery"` or `Not applicable — <reason>` |
| Cancellation / safe exit | TBD | TBD | `data-prototype-state="cancelled"` or `Not applicable — <reason>` |

## Interaction And Content Rules

- Task-derived navigation: each destination has one distinct user purpose and clear label; components, transitions, personas, and coverage rows are not navigation.
- Information needed now: TBD.
- Information deferred until a later action: TBD.
- Optional detail available through progressive disclosure: TBD.
- Informed-decision information visible at the relevant action, including material costs, risks, deadlines, and approval consequences: TBD.
- Audience-appropriate language and internal terms translated or hidden by default: TBD.
- Structure-before-explanation review: record how navigation, grouping, labels, controls, or sequence make the task self-evident before adding instructional copy.
- Bounded subtraction review: record removed redundant summaries, repeated statuses, unnecessary badges, explanatory panels, secondary actions, and technical terms, or `None.` with reason. Do not use arbitrary count limits or hide necessary information.

## Responsive And Accessibility Expectations

- Supported viewport and input contexts: TBD.
- Responsive changes that preserve task completion: TBD.
- Semantic structure, keyboard flow, focus visibility, labels, and announcements: TBD.
- Contrast, motion, touch-target, and zoom expectations: TBD.

## Prototype Review

Record each reviewed or pending journey using its exact anchor from Journey And Route Coverage. Scope review evidence and limitations to that journey. A date or revision is optional. `Reviewed` means rendered interaction inspection and reconciliation against current canonical requirements with no unresolved material contradictions or usability blockers; structure alone cannot establish this.

| Journey | Review result | Evidence and limitations |
| --- | --- | --- |
| [Representative direction flow](#journey-main) | Not reviewed | TBD |

- Review status: `Not reviewed` / `Reviewed — no unresolved usability blockers` / `Blocked`
- Representative walkthrough: arrival → task discovery → meaningful action → result, plus cancellation and failure/recovery.
- Comprehension review: whether an intended user unfamiliar with the source material can understand the purpose, find and complete their task, identify the next action, and understand its consequences without the designer explaining the interface.
- Working-interaction review: action-specific outcomes and next steps; pre- and post-submission cancellation where materially different; confirmed failure and unknown outcomes where applicable; safe recovery without duplicate submission. Generic state switches or toasts are insufficient.
- Specification fidelity: `PASS` / `BLOCKED` — TBD.
- Rendered inspection: tool, representative viewports, the direct-file launcher check (affected navigation and representative interactions, including role switching when applicable), and findings, or `Blocked — <limitation>`; do not claim visual verification from source inspection or portability from relative paths.
- Presentation review: typography, spacing, proportions, alignment, hierarchy, density, controls, and responsive readability.
- Material findings and resolved changes: `None.` or TBD.
- Explicit implementation discretion: details implementation may adapt beyond real content, responsive rendering, and accessibility, or `None.`; the selected candidate otherwise remains the implementation target.
- Explicit distinction: the agent walkthrough is heuristic review; prototype approval is not implementation review or actual user testing.

## Change Synchronization

After the initial reviewed prototype, update canonical requirements normally and batch later prototype edits here. Use exact journey anchors and links to affected canonical owners and originating ticket files (with ticket IDs where applicable). An explicit prototype-change request authorizes affected updates without another sync command or approval. Compare selected journeys with current requirements even when this list is empty; preserve unrelated pending work. Record a stale or failed slideshow refresh beside that deck's link above, never as a pending row. Use `None.` when no pending rows remain.

None.

<!-- Replace None. with this table when prototype work is pending:
| Journey | Pending change | Canonical / ticket references |
| --- | --- | --- |
| [Representative direction flow](#journey-main) | Concrete required prototype change | Link canonical owner and originating ticket file with its ID |
-->
