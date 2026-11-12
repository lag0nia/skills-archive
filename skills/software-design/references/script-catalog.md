# Script Catalog

Read this catalog to choose the deterministic script that owns a contract. Run each script as `node <software-design-skill-directory>/scripts/<script>.mjs`, resolving `<software-design-skill-directory>` to the directory containing the active `SKILL.md`. The reference that owns each workflow gives the exact arguments.

## Scripts

- `validate-software-design-structure.mjs`: package structure, version/owner-link consistency, structured material-interaction shape when an interface adopts it, and the System Guide rules when adopted.
- `validate-implementation-detail-tickets.mjs`: ticket shape, schema version, and canonical owner routing.
- `validate-technical-constraints.mjs`: CONS shape, source-responsibility routing, and ticket reciprocity.
- `report-ticket-answerability.mjs`: scoped read-only decision prerequisite analysis for explicitly selected consultation tickets (or explicit `--all`); invocation and derived notices are owned by [expert-consultation.md](expert-consultation.md).
- `report-ticket-inventory-leads.mjs`: read-only System Responsibility ownership and unresolved-language leads for the independent Stage 7 inventory pass.
- `delivery-snapshot.mjs`: one normalized Stage 9 handoff revision ID, with write and freshness-check modes.
- `validate-build-design.mjs`: Build Design structure, construction-guide coverage, repository/constraint routing, and reusable-result synchronization.
- `validate-handoff-sequence.mjs`: strict single-table Stage 9 execution order, blocker-aware scheduling, direct-requirement, current-group, state, and receipt-index validation.
- `validate-delivery-readiness.mjs`: Stage 9 handoff routing, required-input and required-interaction closure, realizability, snapshot, and planning-readiness validation after Build Design passes.
- `validate-stage9-handoff.mjs`: one explicitly selected handoff under `build/workflow/handoffs/` before a workpack consumes it; runs the readiness reconciliation, selected-row sequence check, and Delivery Readiness validation independently and reports every failure.
- `validate-workpack.mjs`: one `WORKPACK.md` against its linked handoff: exact snapshot, complete current Stage 9 readiness rerun in-process, INPUT/INT/PSEAM/VO/LGATE projection, UI sources and journeys, and the snapshot-derived evidence destination; `--validation-mode planning|execution`, strict by default. [workpack-planning.md](workpack-planning.md) owns when to run it.
- `report-build-unit-readiness-reconciliation.mjs`: read-only two-way comparison of selected build-unit unresolved statements and ticket mappings before a readiness claim.
- `report-delivery-planning-gaps.mjs`: advisory Stage 9 review prompts for missing workpacks, snapshot drift, `Waiting` planning candidates, and stale sequence prose; it reads the default sibling `delivery-workpacks/` directory unless `--workpacks` overrides it; when to run it is owned by [build-design-and-delivery-readiness.md](build-design-and-delivery-readiness.md#delivery-readiness-and-handoff).
- `validate-build-unit-dependency-map.mjs`: Stage 8 HTML coverage, dependency direction/reduction, README linkage, and potential parallelism.
- `validate-ui-ux-design.mjs`: conditional UI/UX artifact shape, navigation, required review sections, and local candidate resources, journey review declarations, interactive candidate markers, and separate structure, embedded screenshots, and self-containment of optional review slideshows; it does not prove usability or screenshot fidelity.
- `build-review-slideshow.mjs`: optional helper that embeds captured screenshots and escaped captions into one self-contained `slides.html`, refusing unusable input.
- `validate-assurance-coverage.mjs`: strict JSON-compatible manifest shape, canonical VO-to-Build-Unit assignment coverage, current exceptions, and exact binding completeness without executing repository evidence.
- `render-assurance-report.mjs`: schema-check and render one human-first blueprint-wide HTML report from normalized repository evidence without executing tests or claiming universal security.
- `generate-visuals.mjs`: generate the System Explorer index and its two destinations (`--views explorer`) from a validated, source-bound `explorer.json` (component, connection and lifecycle facts, authored overview geometry with automatic orthogonal routing, per-selection label slots and geometry checks) and the construction dependency map (`build`), and detect stale sources/outputs with `--check`.
- `export-system-guide.mjs`: export System Guide PDFs (architecture, one domain, all, or combined) to a directory outside the package, verify them, and report freshness with `--check`; see [guide-pdf-export.md](guide-pdf-export.md).
- `generate-decision-overview.mjs`: generate the derived decision overview, check its freshness with `--check`, or list the current decisions that a change to given files or tickets touches with read-only `--affected`.
- `ticket-projection.mjs`: GitHub Project view auditing, ticket projection, reconciliation, comment intake, and draft-response mechanics.

## Unfinished-Work Markers

The readiness reconciliation, inventory-lead and slideshow checks read `TODO` as unfinished work only in marker syntax: `TODO:`, `TODO(owner):`, `[TODO]` or `<TODO>`, and a slideshow field that is just `TODO`. Ordinary prose such as Spanish “está todo definido” or “TODO EL ALCANCE” is never a marker, whatever its case. `TBD` matches in any case. Ticket statuses such as `todo` are unaffected.
