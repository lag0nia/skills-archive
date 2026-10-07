# GitHub Workflow Projection

Use this reference when synchronizing Software Design tickets and Technical Decisions with GitHub, reconciling drift, configuring or repairing Project views, inspecting ticket comments, or publishing a justified canonical response. Local YAML and durable Software Design records remain canonical; GitHub Issues and one Project are human collaboration views.

## Contents

- Configuration And Authentication
- Canonical Projection Model
- Software Category Display And Existing Project Migration
- Project Presentation Contract
- Build Unit Labels And Repository Field
- Stable Decision Identity
- Human-First Rendering
- Request Routing And Sync Execution
- Mechanical Commands
- Local-Agent Comment Workflow

## Configuration And Authentication

Run commands from the consumer repository root. Resolve script paths from the active skill directory. The repository supplies one uncommitted `software-design-ticket-projection.json`:

```json
{
  "provider": "github",
  "ticketRoot": "design/software-design",
  "repository": "owner/repository",
  "project": "owner/number",
  "syncBranch": "main"
}
```

The five values above are required strings and `ticketRoot` must stay inside the repository. `syncBranch` explicitly names the shared publishing branch; `main` above is an example, never a default. The uncommitted projection configuration must be Git-ignored by the consumer repository.

Optional `omittedViews` records an explicit per-project presentation choice. Its only currently supported member is `"Repositories"`; use `"omittedViews": ["Repositories"]` to omit that optional default, or omit the key/use `[]` to enable all seven defaults. Reject unknown names, duplicate entries, and non-array values. A missing view never implies intentional omission. Audit, selected view creation, existing-view repair, relative order, slices, and manual checks use this same effective contract. An existing omitted view becomes informational and stays unchanged; configuration never deletes it. Repository mappings, labels, fields, field options, and ordinary data sync remain required and unchanged. Record this only in the existing local configuration after the user explicitly chooses it; no consumer config is changed by installing the skill.

Use the local `gh` CLI session. Every provider operation verifies `gh api user`; when needed, launch `gh auth login --hostname github.com --web --git-protocol https` in the active interactive terminal, keep it open during browser approval, and continue automatically after access verifies. Never request pasted credentials or store authentication in canonical files.

## Publishing Safety

Follow: edit → commit → push/merge to shared branch → update local shared branch → sync.

Before any `sync` mode (including `--views-only`, `--fields-only`, and `--create-views`) makes any GitHub mutation, including label or Project setup, require the configured branch (never detached HEAD), a clean index and working tree including untracked files, a successful fresh fetch of that branch from `origin`, and exact equality of local HEAD and the fetched remote branch. Stop on missing configuration, remote or branch, failed fetch, or indeterminate state. Report wrong branch, local changes, unpushed commits, behind/diverged history, and fetch failures distinctly. Never automatically commit, stash, switch branches, merge, reset, or push to satisfy this gate.

Hold the existing workspace-exclusive lock throughout publishing. Only the verified lock owned by this run may be excluded from the clean-tree check; never exempt configuration or unrelated files, bypass an existing lock, or remove a possibly live lock. Read-only commands remain available on other branches. The comment/draft-PR workflow remains separate.

The repository remains canonical. Project edits do not automatically become canonical decisions. Collaborators must avoid overlapping publishing runs: this gate provides neither cross-machine locking nor atomic Git/GitHub updates.

## Canonical Projection Model

- Project every active `TICKET-NNNN` as one stable issue.
- Project every `TD-NNN` as one stable issue in every state: Open, Partially Resolved, Blocked, Deferred For Later Design, or Resolved.
- Derive a TD's child list from ticket `parent_decision`; never create or project separate question records.
- A ticket with `parent_decision: null` remains an ordinary standalone ticket and never appears in Decision Areas.
- Do not create Project items for Domains, System Responsibilities, Build Units, repositories, CONS, SEL, VA, or handoffs.

The Project requires single-select `Status` options ordered exactly `todo`, `deferred`, `decided`, `finished`, `out-of-scope`, each with a blank option description; single-select `Board status` options ordered exactly `todo`, `Waiting`, `deferred`, `decided`, `finished`, with blank descriptions; single-select `Complexity` options ordered exactly `low`, `medium`, `high`; single-select `Kind` display options ordered exactly `Software`, `product`, `operational`; single-select `Repository Ticket Layer` options ordered exactly `Repository-wide tickets`, `Owned Build Unit tickets`; a multi-select `Repositories` field whose options are the canonical `REPO-NNN — Name` values in repository-ID order; single-select `Answering group` options ordered exactly `Ready`, `Waiting for answers`, `Needs attention` with blank descriptions and distinguishable colors; and text fields `Work area`, `Waiting on`, `Domain`, `Responsibility`, `Category`, `Build Units`, `Repository Build Units`, `Parent Decision`, `Decision Status`, `Decision Tickets`, and `Resume When`.

GitHub stores single-select descriptions on shared field options. Keep one canonical Status field. Explicit `sync --fields-only` clears Status, Answering group, and Board status descriptions and applies the canonical Board status colors below, preserving existing option IDs, names, and item values and all other fields’ colors. It can rename Answering group options only through explicit ID mappings, and orders the existing options to the contract. It never creates fields, deletes options, edits items, or touches views. Ordinary sync and `sync --views-only` do not change shared field definitions.

During initial setup, create or update the `Repositories` multi-select field and its exact canonical options in the signed-in GitHub UI before running `sync`. Do not repurpose GitHub's native `Repository` field and do not use Labels as the Repositories slice. `project-view-audit` reports a missing field, the wrong field type, stale options, or noncanonical option order. `sync` and `reconcile` read this schema and multi-select item values through the GitHub GraphQL Project API, not `gh project field-list` or flattened item-list output, because the CLI can omit custom multi-select metadata and values.

Ordinary tickets receive their canonical ticket fields, including `Complexity` for filtering and ordering. TD items have no ticket complexity; clear that field on TDs. Complexity sorting is a discussion aid and never overrides prerequisites. `Parent Decision` renders `TD-NNN — Title` or `None`. Populate `Repositories` from the union of a ticket's explicit canonical `repositories` mapping and the repositories that canonically own its mapped Build Units. Use a set before writing the field, so several matching Build Units in one repository still select that repository only once. Derive `Repository Ticket Layer` only for Project presentation: a ticket with an explicit canonical `repositories` mapping receives `Repository-wide tickets`; otherwise a ticket mapped to a Build Unit owned by at least one repository receives `Owned Build Unit tickets`; a ticket with neither route receives no value. Direct repository scope wins when both routes exist. TD items have no parent, Build Unit mapping, Repository mapping, Repository Build Unit mapping, or Repository Ticket Layer, so synchronization clears those five ticket-only fields. TD items use the shared `Kind: Software` display option (the underlying technical classification and Technical Decision identity are unchanged), render their canonical Domain and affected System Responsibilities, and map state to Project `Status` for consistent board mechanics: Open → `todo`, Partially Resolved → `decided`, Blocked → `deferred`, Deferred For Later Design → `out-of-scope`, and Resolved → `finished`. `Decision Status` retains the exact TD state. `Decision Tickets` is a compact derived progress summary, such as `5 total · 2 todo · 1 deferred · 2 finished`; it never repeats the child-ticket IDs, which remain in the linked TD issue body.

Maintain these issue labels:

- `Technical Decision`: every TD issue in every state;
- `Out-of-Scope`: every deferred TD issue and every standalone out-of-scope ticket;
- `BU-NNN — Name`: non-repository ticket Build Unit applicability.
- `Software Design Workflow`: active ticket without explicit repository scope, including Build Unit and genuinely unmapped tickets.

Do not use `REPO-*` labels for ticket projection. Remove unsupported managed `REPO-*` labels from every projected ticket issue during `sync`; do not delete repository-level label definitions merely to enforce the ticket-label contract.

Do not apply `Out-of-Scope` to an out-of-scope child ticket whose `parent_decision` is non-null. The deferred TD is the readable grouped item in that view; the child remains a real searchable issue and canonical workflow record.

## Software Category Display And Existing Project Migration

Canonical YAML, normalized records and validation retain exactly `product`, `technical`, and `operational`. In human-facing category prose use **Software** for `technical`, meaning Software engineering decisions. Projection maps this value to the `Software` Kind option and to the `Software` Work area section for active technical tickets. Product and operational labels and their Domain-based board placement remain unchanged. This is a display mapping, never a reverse import or a new serialized enum.

Issue bodies currently omit Kind from their canonical-reference metadata; keep that concise format rather than adding a duplicate category field. Canonical machine-readable exports may still contain `technical`. Technical Decisions, their label/filter/identity, TD/CONS terminology, source paths and authored historical prose are not category labels and must not be renamed or rewritten by projection.

For an existing Project, installation alone does not migrate its fields. Before an authorized live migration:

1. Run read-only `project-view-audit`. For the exact legacy Kind schema (`technical`, `product`, `operational`), `requiredKindLabelMigration` identifies the field and existing technical option IDs. Review these identities and the proposed `technical` → `Software` display rename. Unexpected names, duplicate fields/options or missing IDs require explicit investigation; do not guess a mapping.
2. With explicit authorization for this Project’s field change, rename only that existing Kind option in the signed-in GitHub interface, retaining its option ID and the field ID, order, color, description and every item selection. Do not delete/recreate the option, field, view, issue or item. Verify the saved IDs and selections against the pre-change snapshot. Existing TD items use this same option; their Technical Decision label and record identity stay unchanged.
3. Rerun the read-only audit. Only after the new Kind schema is verified, run separately authorized ordinary data sync under the existing publishing preflight. It maps canonical `technical` to that same option ID and updates active tickets’ Work area text from `Technical` to `Software`. The Tickets view continues grouping by the existing Work area field, so its section name changes through item values without recreating the view. Inactive board values remain cleared as before.
4. Reconcile until a second sync has no changes. Verify Kind values, Domain preservation, stable issue/item/view identities and saved board grouping after reload. Inspect user-created filters or hidden-group settings that explicitly name the former display values; change only affected settings under the approved presentation scope, preserving view identities. Do not rewrite unrelated filters or infer a new required view.

Ordinary sync rejects an unmigrated or ambiguous Kind schema before any GitHub mutation; it never renames or creates Kind options. `sync --fields-only` remains limited to its existing Status/Answering group/Board status contract and does not perform this migration. A newly configured Project uses the display options `Software`, `product`, `operational` from the start. Project audit/reconciliation compare presentation values, while canonical ticket validation continues to reject `Software` or `software` as stored kinds.

## Project Presentation Contract

Tab order is browser-verifiable only. GitHub's `views(orderBy: {field: POSITION})` currently returns a sequence that can ignore the ordering field (NAME also returns nonalphabetical results). Keep the returned sequence as diagnostic evidence, but do not convert it into API drift or an API pass for visible order. `apiPassed` covers supported settings only; saved/reloaded browser order remains mandatory even when it is true. Do not recreate or renumber views to match the API sequence. See the [reproduced API ordering report](https://github.com/orgs/community/discussions/206377).

Enable these seven views by default in this relative order; apply only explicitly configured `omittedViews` exclusions. Additional user-created views are informational, not audit failures; never delete or reorder them automatically:

| View | Layout | Filter | Slice | Grouping | Sorting | Visible fields |
|---|---|---|---|---|---|---|
| Tickets | Board | `status:todo,deferred -label:"Technical Decision"` | none | horizontal sections by Work area; columns by Answering group | Title ascending | Title, Status, Domain, Waiting on |
| Software | Board | `kind:Software status:todo,deferred,decided,finished -label:"Technical Decision"` | none | columns by Board status; no horizontal grouping | Title ascending | Title, Domain, Complexity |
| Product & Operations | Board | `kind:product,operational status:todo,deferred,decided,finished -label:"Technical Decision"` | none | columns by Board status; no horizontal grouping | Title ascending | Title, Domain, Complexity |
| All Tickets | Table | `status:todo,deferred,decided,finished,out-of-scope -label:"Technical Decision"` | none | none | Status ascending | Title, Status, Kind, Complexity, Responsibility, Category, Parent Decision |
| Decision Areas | Table | `label:"Technical Decision"` | none | Decision Status | Title ascending | Title, Decision Status, Domain, Responsibility, Decision Tickets, Resume When |
| Out-of-Scope | Table | `label:"Out-of-Scope"` | none | none | Title ascending | Title, Status, Decision Status, Domain, Responsibility, Decision Tickets, Resume When |
| Repositories | Board | `has:repositories status:todo,deferred,decided,finished -label:"Technical Decision"` | Repositories | horizontal sections by Repository Ticket Layer; columns by Status | Title ascending | Title, Build Units, Repository Build Units |

The Out-of-Scope view deliberately mixes two readable top-level record types:

- a deferred TD issue representing one coherent group of related out-of-scope child tickets; and
- a standalone out-of-scope ticket whose `parent_decision` is `null`.

Do not flatten TD children into duplicate top-level Out-of-Scope rows. Do not create OOS wrappers or standalone summary duplicates.

The table renders `PROJECT_VIEW_CONTRACT`, the single source of default presentation settings; `projectViewContract(config)` applies validated omissions consistently. `project-view-audit`, `sync --views-only`, and browser repair all compare saved state against it; do not copy it into another configuration or checklist. Run `project-view-audit` during initial setup, after view changes, or while troubleshooting, and configure or repair views only through [Setup And Explicit View Repair](#setup-and-explicit-view-repair).

`Software` and `Product & Operations` show progress across `todo`, `deferred`, `decided`, and `finished`. Their Kind filters include ordinary, repository-scoped, and Build Unit tickets equally; neither uses the legacy `Software Design Workflow` label. Exclude Technical Decision records even though their Kind is Software. The Status columns already convey status, so cards show Title, Domain, and Complexity without a redundant Status field. Keep `Tickets` as the existing dependency-aware board.

### Dependency-aware Tickets board

`Tickets` includes technical, product, and operational implementation tickets equally, including repository-scoped and Build Unit tickets. Technical Decisions are a separate record type. `Work area` is `Software` for canonical `kind: technical` tickets and the authored canonical Domain otherwise, including legitimate `Cross-domain`; domain validation remains mandatory. No domain registry or project-specific names are introduced.

Ordinary sync and read-only reconcile calculate the board from the complete canonical inventory using `analyzeTicketDependencies`, before any view filtering. Each active card selects its own question against that full inventory to retain explanatory paths. `Ready` means no outstanding recorded prerequisite, external blocker, deferral, or analysis review condition; `Waiting for answers` means unmet ticket prerequisites only; `Needs attention` wins whenever external facts, deferred/resumption conditions, invalid references, cycles, or other analysis review causes coexist. Approved decided/finished prerequisites remain settled boundaries even when historical ancestry has findings. This is mechanical answerability, not proof that prose is semantically correct, questions are necessary, or dependency edges are justified.

`Waiting on` starts each source with its canonical ticket ID and a short title, groups distinct reasons by that source, and marks deeper causes with `via TICKET-XXXX`. Authored blocker/reason/resumption text retains its language; fixed labels are English. Identical external text on different tickets remains distinct. The Project text is bounded to a conservative 1,000 UTF-8 bytes. This is an application budget, not an assertion about GitHub's undocumented exact limit. If the complete card summary exceeds that budget, publish a deterministic source-ID summary with explicit omitted-source counts and a pointer to the issue's **Waiting on** section. That generated issue section retains every full title, path and reason, without truncation. Sync does no AI rewriting and invents no explanation for an edge. Never silently drop explanations or defer rejected values as a permanent workaround. Independent ready tickets may proceed in parallel; Title ascending provides stable navigation, not dependency priority. Cards have no assignee or snapshot timestamp requirement.

Every sync recomputes desired fields and generated Waiting on sections across the inventory, so changing a prerequisite updates dependents even without editing their files. Only differences are written. TDs and all nonactive implementation records (decided, finished, out-of-scope) have Work area, Answering group and Waiting on cleared. Reconcile reports field and generated-body drift. When decided tickets remain, both commands report that approved decisions await canonical completion; they remain in All Tickets, never Tickets.

### Waiting column on the category boards

The shared **Board status** field has this exact color contract on both Software and Product & Operations:

| Option | GitHub color | Meaning |
|---|---|---|
| `todo` | `GREEN` | Ready to answer; aligns with Tickets’ Ready. |
| `Waiting` | `PURPLE` | Waiting on prerequisites or blockers. |
| `deferred` | `ORANGE` | Requires a resumption condition. |
| `decided` | `YELLOW` | Approved decision; canonical updates and checks remain. |
| `finished` | `BLUE` | Completed. |

Use these colors when creating the field. For existing fields, `project-view-audit` reports color drift and explicitly scoped `sync --fields-only` repairs it in place, retaining every option ID and item selection. Ordinary data sync does not mutate field definitions. Verify saved colors after repair. Do not recolor Status or Answering group as part of this change.

Only Software and Product & Operations group columns by the projection-only single-select **Board status**, ordered `todo`, `Waiting`, `deferred`, `decided`, `finished`. Canonical `Status` is unchanged and still controls view filters. For canonical `todo`, Board status is `todo` only when dependency analysis returns Ready; unresolved direct/transitive prerequisites, external blockers, cycles or missing/invalid prerequisite records yield `Waiting`. Canonical `deferred` remains `deferred` even when blocked. Canonical `decided` and `finished` keep those respective columns. Out-of-scope tickets and TDs have Board status cleared and remain excluded by the existing category-board filters. Prerequisite approval must satisfy the existing analyzer's resolution checks before it releases a dependent.

Board status is derived, never manually authored in ticket YAML or reverse-imported from a dragged card. Every sync restores it from canonical status and dependencies. Keep Tickets, All Tickets and Repositories on their existing grouping/status contracts. For an authorized consumer migration, create the missing Board status field with the exact options through explicit field setup, preserving every existing field and option. Populate it with ordinary sync, then change only the two category boards' column grouping in the browser. Verify all five columns after save/reload, including empty columns, with no No Board status column. Installing this skill never performs those consumer changes.

GitHub native `Blocked by` corresponds to `depends_on`; canonical `blocked_by` holds external facts/actions. The current adapter has no native dependency relationship writer. Issue-body prerequisite links are navigation, not native relationships. Keep the board accurate through derived fields; do not add fictional issues or silently introduce native relationship synchronization.

Keep `Repositories` as one saved tab. Filter it with `has:repositories status:todo,deferred,decided,finished -label:"Technical Decision"`; do not use `-no:repositories`, which GitHub can reject as an invalid `-no` value. The explicit status filter removes `out-of-scope` items and leaves exactly the `todo`, `deferred`, `decided`, and `finished` columns. Slice the view by the multi-select `Repositories` field, never by Labels. Its sidebar must contain only canonical `REPO-*` field options and no `BU-*` values. Inside the selected repository, render `Repository-wide tickets` first and `Owned Build Unit tickets` second, with the four active Status columns shared across both sections and no option-description prose below their headings. Each stable issue appears at most once in the selected repository even when several of its Build Units share that owner. A ticket inherited into several repository slices remains one Project item and one GitHub issue; the slices are views of that item, not copies.

### Setup And Explicit View Repair

Keep data, API presentation, and browser verification separate; field setup is an explicitly bounded prerequisite:

| Work | Surface | Changes |
|---|---|---|
| Ticket synchronization | `sync` | Issues, managed labels, Project membership, and Project field values from canonical records; never presentation. |
| API presentation repair | `sync --views-only` | Only supported settings of existing contract views: layout, filter, and the exact ordered visible fields, plus a rename explicitly identified with `--rename-view`. Never tickets, items, labels, field definitions, or view creation and deletion. |
| Missing-view setup | `sync --create-views --view <name> ...` | Only genuinely missing selected enabled default views, through REST creation with all supported initial settings, or the bounded GraphQL fallback below. Existing view IDs/URLs stay unchanged. |
| Bounded field setup | `sync --fields-only` | Existing Status/Answering group/Board status option order, blank descriptions, canonical Board status colors, and explicitly mapped Answering group renames, preserving identities and other colors. Missing or incompatible fields require explicit setup first. |
| Remaining UI configuration | Signed-in GitHub interface | Only what the API cannot write and the audit or UI-only checks still report: sorting and horizontal/column grouping on existing views, plus slicing and tab positioning. REST-created views receive sorting and grouping automatically. GraphQL-created views require browser configuration only where read-back shows those settings differ. Missing field creation is explicit setup, not routine sync. |

The [current GitHub GraphQL schema](https://docs.github.com/en/graphql/reference/projects) supports identity-preserving `updateProjectV2Field` option updates. Its public `createProjectV2View` mutation creates a named view with layout and ordered `configuration.visibleFieldIds`; it does not accept a filter, sorting, grouping, slicing, or tab position. Its public `updateProjectV2View` mutation changes an existing view's name, layout, filter, and ordered visible field IDs. No supported operation updates an existing view's sorting, horizontal or vertical grouping, slicing, or tab position. The [supported REST view creation endpoints](https://docs.github.com/en/rest/projects/views) set name, layout, filter, ordered visible fields, sorting, horizontal grouping, and board column grouping on a genuinely new view, but creation-time support does not imply update support: creation produces a different view with a new identity, number, and position. Never delete/recreate an existing view or create a replacement to obtain a setting the API cannot update.

A request to configure or repair Project views authorizes the presentation changes in this procedure, through the API or the saved GitHub interface, without repeated approval. It does not authorize ticket synchronization, ticket or Project item changes, deleting a view, or choosing between duplicate views; report those as remaining work unless the user explicitly identifies the view.

1. **Inspect and set up missing views.** Inspect saved names and identities first. Explicitly map an existing experimental or renamed view instead of guessing that it is missing. For genuinely missing enabled defaults, use `sync --create-views --view "Tickets" --view "All Tickets"` with exactly the selected names. The command checks all enabled default names for duplicates and case/whitespace ambiguity before any write. Existing exact matches are preserved, even if their settings need later repair; unrelated additional views do not block creation. Finish missing field setup before creating views. The command can use the bounded GraphQL fallback below after a confirmed REST 404. Browser creation is a fallback when API setup remains unavailable, not the normal route; inspect existing identities before creating anything.
2. **API repair.** Satisfy [Publishing Safety](#publishing-safety), then run `sync --views-only`. Under the publishing lock and preflight, it reads the saved views and fields and validates every target before writing. A missing or duplicate contract view, a missing or ambiguous field, or an unknown `--rename-view` number stops the run with an actionable error and changes nothing. Resolve only the named cause, then rerun once. Complete missing field setup in the GitHub interface. Use the explicit missing-view setup above when a view is genuinely absent; then rerun existing-view repair only for remaining supported drift. Otherwise ask the user which saved view, if any, is the contract view, or which duplicate is canonical. Rename only a view explicitly identified by its number, for example `--rename-view "4=Decision Areas"` for the existing decision tab; never infer that an unknown view is a contract view. The command writes only differing supported settings, so a matching repeat run makes zero mutations. It then re-reads saved state once, runs the audit once, and reports `verified`, `failed`, `unverified`, `notAttempted`, `remainingFieldSetup`, `remainingGitHubUi`, the full `audit`, and `nextStep`.
3. **Browser repair.** In the signed-in GitHub Project, change only the settings listed in `remainingGitHubUi`, taking each expected value from the finding and `PROJECT_VIEW_CONTRACT`. This may include sorting, grouping, slicing, and tab order. Use REST setup for genuinely missing views. Do not create a second view to bypass an unsupported in-place update. Correct field findings only as the field requirements above describe, preserving option IDs and item values; apply the canonical colors only to Board status and preserve other fields’ colors.
4. **Save shared defaults.** Save each changed view with its save-changes action, never save-as-new-view, so the setting becomes the shared view default. A correct-looking tab, URL query parameters, or an unsaved preview does not prove the saved view. Reload the view without query parameters before trusting it.
5. **Verify saved state.** After saving the affected views, run `project-view-audit` once. Then verify each check in `audit.manualUiChecks` in the browser, including visible tab order, slicing, and Status columns. Fix only a failing setting, save it, and audit again. Keep completed work; never repeat the whole setup after each setting.
6. **Report.** Give three separate outcomes: A, canonical data and derived fields synchronized (or not attempted/failed); B, API-supported presentation applied and verified (or pending/failed); C, browser-only settings saved and verified (or pending). Name each remaining setting with its view, expected value, and exact limitation. Automated fixtures never prove a rendered board correct. Claim presentation complete only when the audit passes and every UI-only check is verified after saving.

To add only the two status boards to an existing Project, run from the consumer repository root:

```bash
node <skill-dir>/scripts/ticket-projection.mjs sync --create-views --view "Software" --view "Product & Operations"
```

This creates only missing selected names and leaves every existing view unchanged. REST creation sets both filters, visible fields, Title sorting, empty horizontal grouping and Status column grouping automatically. The GraphQL fallback creates the layout and visible fields, then updates the filter on the confirmed new identity; it reports sorting/grouping differences as remaining browser work. Unrelated drift in the returned full audit is informational for this bounded addition; do not run broad view repair as an implicit follow-up. Verify no slicing in the saved browser views, then position Software and Product & Operations immediately after Tickets while preserving all existing identities and the relative order of other tabs. Neither creation API can set tab positions; this one-time browser step is still required.

Missing-view setup resolves the configured owner's REST metadata (`Organization` uses the organization login; `User` uses the numeric user ID). It resolves each field name to exactly one GraphQL field and its numeric `databaseId`, then passes those database IDs in REST `visible_fields`, `sort_by`, `group_by`, and `vertical_group_by`. Never decode opaque node IDs, hardcode built-in field numbers, or substitute field names in those arrays. Missing/ambiguous/unsafe IDs and incomplete metadata stop before creation. The setup command uses the same publishing lock, clean configured branch and fresh remote equality checks as sync; it never changes Git history or files to satisfy them.

All selected plans are validated before writing. Before each creation, re-read saved names; preserve any exact selected view that has appeared. After every attempted creation, read back through GraphQL and verify the new identity plus name, layout, filter, ordered visible fields, sorting and both grouping settings. Report created identities/URLs, verified settings, existing preserved views, failed or unverified attempts, and not-attempted names. Stop later creations on API failure or failed verification of API-writable settings. A lost response may follow a successful creation: inspect the read-back result and rerun only after resolving the cause. Reruns skip existing names, and never retry a creation blindly. If a prior attempt created a view but left settings incomplete, repair that saved identity; rerunning creation does not configure existing names. The workspace lock is not a cross-machine transaction; another writer may still race between the final read and POST. Report any resulting ambiguity instead of deleting a view.

A REST HTTP 404 permits one GraphQL fallback only after a fresh, complete saved-state read confirms that the selected name is still absent and no normalized-name ambiguity exists. A matching view observed after the failed REST call stops creation and is reported; never create another. Other HTTP errors, timeouts, malformed success responses, missing identities, and unreadable state do not authorize switching creation mechanisms. The fallback calls `createProjectV2View` once with the same Project ID, exact name/layout and opaque visible-field IDs, then confirms the returned new identity in saved state before calling `updateProjectV2View` for its filter and visible fields. A GraphQL error or uncertain outcome triggers read-back and stops later writes; do not repeat creation, even if the error also says 404. The existing lock and preflight remain in force. A cross-machine race can still occur after the last read; report ambiguity without deleting or replacing views.

Read back the GraphQL-created view against every requested setting. Verify name, layout, filter, and ordered visible fields; differing or unreadable supported settings are failures. Sorting and horizontal/vertical grouping are not GraphQL-writable: report their actual differences in `remainingGitHubUi`, with expected named fields, rather than failing an otherwise successful creation or claiming the settings were applied. Default Status grouping does not satisfy the Board status grouping required by Software and Product & Operations. Report that difference for browser repair; never assume a default grouping satisfies the selected contract. The result identifies each creation method and fallback reason. Unrelated existing-view drift remains in the full audit and does not become an implicit repair target.

Creation leaves slicing and relative tab positioning as explicit browser checks, even when the expected slice is none. For an already-existing view, sorting and grouping changes also remain browser work; use the audit's exact expected values. A successful creation result verifies only the properties listed for each new view; GraphQL sorting/grouping differences can remain pending. It does not verify pre-existing view drift, missing unselected defaults, or the rendered board. A personal Project may return REST 404 while GraphQL creation succeeds with the same session. The 404 alone does not establish its cause. Keep the same Project and authentication identity, report the REST result and any fallback outcome, and use the browser only for remaining work.

Handle failures by kind:

- An unsupported API setting is a limitation, not a failure: it routes to browser repair. `sync --views-only` exits `2` when UI or separate field setup remains. Field findings are listed in `remainingFieldSetup`, not mislabeled browser-only work.
- An API execution failure exits `1` with `outcome: "api-failure"` and names failed, unverified, or not-attempted updates. Do not loop: correct a clear cause and rerun once, or configure those outstanding settings in the browser as part of the same authorized repair, and report the API failure.
- When browser control is unavailable (no browser tool, no signed-in session, or insufficient Project permission) or a control fails, retry a transient failure once and continue with independent settings. Then report an incomplete result that names every saved change, every remaining setting with its expected value, and the exact limitation. If sign-in is required, ask the user to sign in; never request credentials.
- Never loop indefinitely, recreate views, weaken or edit the contract to match saved state, or return every setting to the user after one transient failure.

Keep setup and view repair separate from routine ticket synchronization. Ordinary `sync` never repairs views, runs `project-view-audit`, or starts browser repair; do not audit views after each ticket update or sync.

## Build Unit Labels And Repository Field

After Build Design, maintain one native `BU-*` label for every canonical Build Unit. Apply all applicable BU labels only to tickets without explicit repository mappings. Remove managed BU labels from explicitly repository-mapped tickets. Also maintain `Software Design Workflow` on every active ticket without explicit repository scope, including genuinely unmapped tickets; retain that legacy label behavior for compatibility with existing consumer views. It is obsolete for the seven default views; retiring it requires a separate authorized migration, never bulk stripping during a skill update. Populate the separate `Repositories` multi-select field for both explicit repository tickets and tickets inherited through canonically owned Build Units. Use sets while deriving repository IDs: two or more matching Build Units owned by the same repository still produce one selected repository option and one Project card. Build Unit tickets retain their BU labels, and the separate field makes the same stable issue visible in the repository board without polluting either slice panel.

Keep the complete Build Unit mapping in the `Build Units` text field and the issue body’s collapsed canonical-reference area. `Repository Build Units` renders the member-unit lists of repositories reached by either projection route; it is display metadata, not a new canonical ownership claim. Keep `Repositories` as projection-only membership. Never write derived repository visibility back into ticket `repositories`, and never treat it as repository-wide scope during design or readiness validation.

## Stable Decision Identity

Render exactly one current `software-design-decision TD-NNN` marker for each TD issue and one current `software-design-ticket TICKET-NNNN` marker for each ticket. Inventory both these namespaces and the legacy `technical-design-decision` / `technical-design-ticket` namespaces before any write. A sole legacy marker is the same durable identity and must be adopted by updating the existing issue body in place, never by creating a replacement. One legacy plus one current marker for the same identity on the same issue is an alias pair that normalizes to one current marker. Repeated identical markers, different identities on the same issue, and the same identity on multiple issues are collisions: stop before any write and reconcile them explicitly. Non-managed history markers such as `casino-migration-history` are not ticket identities. Never adopt from a title alone. A retry after partial migration must recognize both already-migrated and remaining legacy issues; unchanged reruns preserve issue/item IDs, comments and unmanaged fields.

## Human-First Rendering

Render ordinary tickets from the existing canonical text fields, written under [implementation-detail-tickets.md](implementation-detail-tickets.md). A reader given only the issue should understand the situation, decision, practical alternatives, reasons, assumptions, and relevant prerequisites. Preserve authored language and Markdown; fixed labels remain English. The deterministic renderer must not invoke AI, translate, infer consequences, or rewrite narrative text during synchronization.

- `todo`: use the actual question as the opening heading, followed directly by context without a Situation heading. Render lettered alternatives under `Options` and the proposed choice/reasons under `Recommendation`. Add relevant `Before answering` prerequisites and a concise invitation to comment with a choice, adjustment, alternative, or clarification. Comments do not automatically approve or complete a ticket.
- `deferred`: lead with the reason/blocker and `Resume when`; make clear the answer is still required for the target version. Keep the question and any available proposals below this explanation.
- `out-of-scope`: lead with the exclusion and `Reopen when`, explicitly stating that no current-scope decision is required. Any recommendations remain future proposals.
- `decided`: lead with `Approved decision` and the approved resolution; state that affected canonical updates and checks remain before completion.
- `finished`: lead with `Approved final outcome`. Both resolved statuses retain `Original question` and context, without presenting an earlier recommendation as the approved answer.

Omit empty sections and absent optional relationships. When a parent decision exists, retain descriptive navigation under `Related decision`. Resolve generated prerequisite titles and statuses from canonical ticket records. Use descriptive names as relationship labels; explicitly show an unresolved reference and its ID rather than guessing or silently discarding it. Use issue links only when the existing bulk projection snapshot supplies them, without extra per-ticket lookups. A newly created related issue may acquire its navigation link on a subsequent sync; names and canonical IDs are retained in the meantime.

Keep stable issue markers and title conventions unchanged. Put full Build Unit/repository mappings, dependency IDs, parent identity, owner, durable outcome IDs, source path, and realization disposition in the existing collapsed `Canonical reference` area. Project fields, labels, and membership are unchanged.

Preserve canonical `current_shape` under `Current shape`, following the status-specific opening and context. Use a plain-text fence for `tree` and a Mermaid fence for `logic` or `state`. List its canonical `source_refs` in the collapsed reference. Do not infer or generate visuals during projection.

Render each TD issue as one connected brief:

1. Open with its context and why the decision matters.
2. When canonical `current_shape` exists, render it after the opening context without replacing the explanation.
3. Explain what is already established.
4. Explain why its tickets belong together and what compatibility their answers must preserve.
5. Show a table of linked child ticket ID/title and current status.
6. Close according to state:
   - Open: identify the remaining questions;
   - Partially Resolved: distinguish finished from remaining questions;
   - Blocked: state the exact canonical `blocker` prerequisite;
   - Deferred For Later Design: explain why it is outside the target version and when to resume;
   - Resolved: explain the final combined outcome.
7. Put the canonical TD ID, `build/workflow/technical-decisions.yaml` source, and any current-shape sources in a collapsed reference.

Do not inline each child's options, answer, dependencies, mappings, or detailed body. Those remain in the linked ticket issues.

## Request Routing And Sync Execution

Classify the requested GitHub work before choosing a command:

- For a layout-only request about view names, order, layout, filters, slicing, grouping, sorting, or visible fields, inspect with `project-view-audit`, or configure and repair through [Setup And Explicit View Repair](#setup-and-explicit-view-repair). Do not run ticket synchronization merely to inspect or repair a view.
- For canonical ticket or TD changes, issue-body drift, labels, Project membership, or Project field values, run `sync` or use read-only `reconcile` first when provider writes are not yet authorized.
- When both presentation and projection data changed, perform both bounded workflows. Do not treat a successful ticket sync as proof that presentation is correct; routine `sync` never starts view repair.

`sync` loads one complete issue and Project snapshot, validates it, and derives the per-identity mutation plans before scheduling ticket writes. Shared setup, label-schema changes, and other global mutations remain sequential. Distinct tickets then run with at most three plans in flight; after every ticket succeeds, distinct TD plans use the same bound. Every operation for one ticket or TD stays ordered: issue content, managed labels, Project membership, then Project fields. Managed ticket-label additions and removals use one issue edit whenever any are needed. Fields within one Project item remain sequential.

`reconcile` also compares a Project item's native `Title` with its linked issue title and reports `project-title` drift. The GitHub CLI cannot update the Title of an issue-backed Project item in place. `sync` must never remove and recreate an item merely to change that title, because doing so can discard unmanaged Project values. For `project-title` drift, report the affected item and require an explicitly authorized, separately designed Project-item recreation that snapshots and preserves every applicable value.

If one identity fails, stop assigning new plans, allow already-running plans to finish, and report the exact failed, completed, and not-started identities. Rerunning remains the recovery mechanism because all writes are convergent and idempotent. Progress, planned mutation counts, and elapsed time go to standard error so the final JSON result on standard output remains machine-readable. Bounded concurrency improves write-heavy synchronization but does not remove the cost of broad Project-field changes or turn provider writes into one atomic transaction.

## Mechanical Commands

```sh
node <software-design-skill-directory>/scripts/ticket-projection.mjs project-view-audit
node <software-design-skill-directory>/scripts/ticket-projection.mjs sync
node <software-design-skill-directory>/scripts/ticket-projection.mjs sync --views-only [--rename-view <view-number>=<contract-view-name>]...
node <software-design-skill-directory>/scripts/ticket-projection.mjs sync --create-views --view "Tickets" [--view "All Tickets"]...
node <software-design-skill-directory>/scripts/ticket-projection.mjs sync --fields-only [--answering-option <existing-option-id>=<new-name>]...
node <software-design-skill-directory>/scripts/ticket-projection.mjs reconcile
node <software-design-skill-directory>/scripts/ticket-projection.mjs pending-comments
node <software-design-skill-directory>/scripts/ticket-projection.mjs publish-draft --files <comma-separated-relative-paths> --title <text> --body-file <path>
node <software-design-skill-directory>/scripts/ticket-projection.mjs post-summaries --input <json-file>
```

`sync` validates tickets, TDs, Build Units, repositories, and the exact `Repositories` multi-select field through the GraphQL Project schema before provider writes and holds a workspace-exclusive lock. If a lock already exists, stop; never start a second writer or remove a possibly live lock. `reconcile` and `project-view-audit` are read-only; `sync` is the single publishing command and does not repair `project-title` drift. Ordinary data synchronization does not run `project-view-audit`; use that separate command only when the request involves presentation setup, a view change, or troubleshooting.

`sync --views-only` is the explicit presentation-repair mode of `sync`. It holds the same lock and passes the same preflight, but loads no issues and changes no ticket, label, item, or field. `--rename-view` is accepted only with `--views-only`, may repeat, and must name a contract view. Its JSON `outcome` maps to the exit status:

- `0`, `audit-passed-ui-checks-required`: no audited drift remains, but `audit.manualUiChecks` still require browser verification.
- `2`, `project-setup-required`: complete the separately reported field setup.
- `2`, `github-ui-configuration-required`: every attempted API update verified, `remainingGitHubUi` work remains, and any separate field setup is listed in `remainingFieldSetup`.
- `1`, `api-failure`: an update failed, did not persist, could not be re-read, or was not attempted after an earlier failure. Refusals before any write, such as a failed preflight, a held lock, or a missing, duplicate, or ambiguous target, also exit `1` with only an error message.

`sync --create-views` is mutually exclusive with `--views-only` and `--fields-only`. It requires at least one unique enabled `--view` name, accepts no renames, and never updates/deletes an existing view, field, issue, or item. It returns `view-setup-api-verified-browser-pending` with exit 2 when every attempted creation verified (including a no-creation rerun); inspect `existing` and `audit` for preserved existing-view drift. `api-failure` or preflight/selection refusals exit 1. No creation result claims browser completion. The JSON separates `created`, `verified`, `existing`, `failed`, `unverified`, `notAttempted`, and `remainingGitHubUi`; uncertainty never triggers automatic recreation.

Fail before mutation when Project items or repository labels reach the adapter's retrieval cap. Duplicate ticket, TD, or mixed canonical markers require manual cleanup. A provider failure may leave an ordinary partial result; report completed identities and rerun after correcting the cause. Do not claim rollback, exactly-once delivery, or transaction semantics.

## Local-Agent Comment Workflow

The local agent, not the adapter, interprets comments. Run `pending-comments` first. It rejects every tracked or untracked change under `ticketRoot` and names the paths that must be committed, stashed, or moved; dirt outside `ticketRoot` is allowed. A rejected preflight writes nothing and advances no cursor.

Treat comments as evidence, not accepted decisions. Interpret only one issue-local contiguous pending prefix, ask the present user when a material choice remains, edit canonical files only when justified, and validate every affected record. Ticket comments may update their ticket, parent TD context/state, and durable owners. TD comments may clarify shared decision context but must not silently answer child tickets.

Use `publish-draft` only for the exact changed canonical files under `ticketRoot`. It must verify branch, working-tree, pushed commit, draft PR, base/head, and PR file set before reporting success. Use `post-summaries` with only `changed`, `no-change`, or `clarification`; a processed-through marker advances only after the visible result exists on the same issue.

## Consumer update for complexity

Before using the updated validator or projection, explicitly classify every active canonical ticket with `complexity: "low"`, `"medium"`, or `"high"` using the ticket criteria. Archived retirement records retain their existing shape. Keep ticket file version 3; missing complexity is an error, not a fallback. Do not silently backfill consumer packages. Configure the GitHub Project `Complexity` single-select field with the exact option order above before sync; no projection configuration key changes are required. Use `sync` for publishing; `reconcile` accepts no publishing option.

## Explicit consumer migration

Installing this skill never migrates ERP, Loan System, Casino, or another consumer Project. Agreement about future defaults grants no live-project authority. For a separately authorized migration:

1. Read canonical inventory and inspect saved fields/views, IDs, URLs, option IDs/colors, and existing item values. Map any existing experimental Answering order/Tickets board explicitly by view number; never guess from an unfamiliar name. Identify duplicate/incompatible fields before writing. Preserve extra views and unrelated field values, including experimental Readiness and Readiness as of.
2. Create the missing Board status single-select with the five options above, Work area/Waiting on text fields and Answering group single-select through explicitly scoped setup, with the required options and distinguishable colors. `sync` reports missing fields precisely; it does not create them. For an existing compatible Answering group, map any old option ID to its approved new name using `sync --fields-only --answering-option "<id>=Ready" ...`. This bounded operation also clears Status/Answering group/Board status descriptions, applies canonical Board status colors, and verifies the saved IDs, names, colors, order, and descriptions. No option is recreated. Unmapped incompatible names or extra options are conflicts, not deletion permission. External writes may partially fail; inspect saved state before retrying.
3. Record only explicitly chosen optional omissions in `omittedViews`; Repositories remains enabled otherwise. Satisfy publishing safeguards, run normal sync and reconcile, use `sync --create-views --view "<enabled-default-name>"` for genuinely missing selected views, then explicitly repair existing views with `sync --views-only --rename-view "<number>=Tickets"` as applicable. Preserve view IDs/URLs. Do not remove canonical Build Unit/repository mappings or BU labels.
4. Configure horizontal/column grouping, sorting, slicing and relative tab order in the browser. Preserve extra tabs in their existing relative positions. Save shared defaults, reload each affected view, audit readable saved state, and visually verify manual checks. If browser tools, session, or permissions are unavailable, name every pending expected setting from the contract. Never recreate a view to bypass an unsupported update.
5. Delete obsolete tabs only under separate explicit authorization identifying those exact live views. Workflow, Build Units, Technical and Non-Technical are no longer required, but their existence is not an error. No experimental Domains, Ready to answer, or Domains & dependencies defaults are added. Report data, API presentation, and browser verification separately.
