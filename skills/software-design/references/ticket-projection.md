# GitHub Workflow Projection

Use this reference when synchronizing Software Design tickets with GitHub, reconciling drift, configuring or repairing Project views, inspecting ticket comments, or publishing a justified canonical response. Local YAML and durable Software Design records remain canonical; GitHub Issues and one Project are human collaboration views.

## Contents

- Configuration And Authentication
- Canonical Projection Model
- Software Category Display
- Project Presentation Contract
- Build Unit Labels And Repository Field
- Stable Decision Identity
- Human-First Rendering
- Request Routing And Sync Execution
- Mechanical Commands
- Local-Agent Comment Workflow
- Technical Decision Presentation Retirement

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

Optional `omittedViews` and `includedViews` record explicit per-project presentation preferences. Each accepts only a unique `"Repositories"` member; reject unknown names, duplicates, non-array values, or membership in both arrays. `"omittedViews": ["Repositories"]` explicitly hides it; `"includedViews": ["Repositories"]` explicitly shows it. Missing keys and empty arrays mean automatic behavior, including old empty/default configurations: enable Repositories only when the blueprint contains more than one canonical Repository Build Design identity. Count canonical `REPO-xxx` records, regardless of whether they have tickets; Git remotes, Build Units, folders, and GitHub's native Repository field are not this count. Existing explicit omissions remain effective. Record preferences only when the user explicitly chooses them; installing the skill never changes consumer configuration.

Setup, selected creation, repair, audit, expected tab order, slices, and manual checks use this effective contract. A missing saved view never implies an explicit preference. An existing disabled Repositories view is informational and reported in `presentationCleanupCandidates`; preserve it until the user authorizes presentation cleanup. Configuration and ordinary sync never delete or rearrange saved views. Repository-specific tickets remain ordinary numbered tickets, visible in the other views according to kind and status. Repository mappings, labels, fields, field options, and ticket data synchronization remain unchanged.

Use the local `gh` CLI session. Every provider operation verifies `gh api user`; when needed, launch `gh auth login --hostname github.com --web --git-protocol https` in the active interactive terminal, keep it open during browser approval, and continue automatically after access verifies. Never request pasted credentials or store authentication in canonical files.

## Publishing Safety

Follow: edit → commit → push/merge to shared branch → update local shared branch → sync.

Before any `sync` mode (including `--views-only`, `--fields-only`, and `--create-views`) makes any GitHub mutation, including label or Project setup, require the configured branch (never detached HEAD), a clean index and working tree including untracked files, a successful fresh fetch of that branch from `origin`, and exact equality of local HEAD and the fetched remote branch. Stop on missing configuration, remote or branch, failed fetch, or indeterminate state. Report wrong branch, local changes, unpushed commits, behind/diverged history, and fetch failures distinctly. Never automatically commit, stash, switch branches, merge, reset, or push to satisfy this gate.

Hold the existing workspace-exclusive lock throughout publishing. Only the verified lock owned by this run may be excluded from the clean-tree check; never exempt configuration or unrelated files, bypass an existing lock, or remove a possibly live lock. Read-only commands remain available on other branches. The comment/draft-PR workflow remains separate.

The repository remains canonical. Project edits do not automatically become canonical decisions. Collaborators must avoid overlapping publishing runs: this gate provides neither cross-machine locking nor atomic Git/GitHub updates.

## Canonical Projection Model

- Project every active `TICKET-NNNN` as one stable issue.
- Preserve existing historical TD issues and remote identity mappings without generating current parent records. Only the [Technical Decision Presentation Retirement](#technical-decision-presentation-retirement) archives their items and closes them.
- Do not create Project items for Domains, System Responsibilities, Build Units, repositories, CONS, SEL, VA, or handoffs.

The Project requires single-select `Status` options ordered exactly `todo`, `deferred`, `decided`, `finished`, `out-of-scope`, each with a blank option description; single-select `Board status` options ordered exactly `todo`, `Waiting`, `deferred`, `decided`, `finished`, with blank descriptions; single-select `Complexity` options ordered exactly `low`, `medium`, `high`; single-select `Kind` display options ordered exactly `Software`, `product`, `operational`; single-select `Repository Ticket Layer` options ordered exactly `Repository-wide tickets`, `Owned Build Unit tickets`; a multi-select `Repositories` field whose options are the canonical `REPO-NNN — Name` values in repository-ID order; single-select `Answering group` options ordered exactly `Ready`, `Waiting for answers`, `Needs attention` with blank descriptions and distinguishable colors; and text fields `Work area`, `Waiting on`, `Domain`, `Responsibility`, `Category`, `Build Units`, `Repository Build Units`, `Resume When`.

GitHub stores single-select descriptions on shared field options. Keep one canonical Status field. Explicit `sync --fields-only` clears Status, Answering group, and Board status descriptions and applies the canonical Board status colors below, preserving existing option IDs, names, and item values and all other fields’ colors. It can rename Answering group options only through explicit ID mappings, and orders the existing options to the contract. It never creates fields, deletes options, edits items, or touches views. Ordinary sync and `sync --views-only` do not change shared field definitions.

During initial setup, create or update the `Repositories` multi-select field and its exact canonical options in the signed-in GitHub UI before running `sync`. Do not repurpose GitHub's native `Repository` field and do not use Labels as the Repositories slice. `project-view-audit` reports a missing field, the wrong field type, stale options, or noncanonical option order. `sync` and `reconcile` read this schema and multi-select item values through the GitHub GraphQL Project API, not `gh project field-list` or flattened item-list output, because the CLI can omit custom multi-select metadata and values.

Tickets receive their canonical ticket fields, including `Complexity` for filtering and ordering. Populate `Repositories` from the union of explicit repository mappings and repositories owning mapped Build Units, deduplicated by identity. `Repository Ticket Layer` is `Repository-wide tickets` for explicit repository mappings, otherwise `Owned Build Unit tickets` for mapped repository-owned Build Units, otherwise unset. Direct repository scope wins when both routes exist. Current packages neither require nor write Parent Decision, Decision Status or Decision Tickets fields. Existing legacy fields, TD issue IDs and remote mappings remain historical; installation, migration and `sync` never delete, close, reopen or rewrite those issues. Every out-of-scope ticket appears independently with its own scope reason, resume condition and canonical scope links.

Maintain these issue labels:

- `Technical Decision`: recognize existing historical issues and keep them out of every contract view through the view filters; never create a TD issue, remove this label from one, or delete its definition;
- `Out-of-Scope`: every current out-of-scope ticket;
- `BU-NNN — Name`: non-repository ticket Build Unit applicability.

The retired `Software Design Workflow` label is not maintained: `sync` never creates it, adds it or removes it. Existing applications and the label definition stay until the [retirement procedure](#technical-decision-presentation-retirement) deletes the definition.

Do not use `REPO-*` labels for ticket projection. Remove unsupported managed `REPO-*` labels from every projected ticket issue during `sync`; do not delete repository-level label definitions merely to enforce the ticket-label contract.

Every out-of-scope ticket remains directly visible with its existing identity, reason, revisit condition, and canonical scope references. No grouping issue replaces it.

## Software Category Display

Canonical YAML, normalized records and validation retain exactly `product`, `technical`, and `operational`. In human-facing category prose use **Software** for `technical`, meaning Software engineering decisions. Projection maps this value to the `Software` Kind option and to the `Software` Work area section for active technical tickets. Product and operational labels and their Domain-based board placement remain unchanged. This is a display mapping, never a reverse import or a new serialized enum.

Issue bodies currently omit Kind from their canonical-reference metadata; keep that concise format rather than adding a duplicate category field. Canonical machine-readable exports may still contain `technical`. Technical Decisions, their label/filter/identity, TD/CONS terminology, source paths and authored historical prose are not category labels and must not be renamed or rewritten by projection.

A Project's Kind field offers exactly `Software`, `product`, `operational`, in that order. Ordinary sync rejects any other Kind schema, including the retired `technical` option name, before any GitHub mutation; it never renames or creates Kind options, and `sync --fields-only` remains limited to its Status/Answering group/Board status contract. A Project that still uses the retired option name follows the in-place rename procedure of an earlier Software Design release, which preserves the option ID and every item selection. Project audit/reconciliation compare presentation values, while canonical ticket validation continues to reject `Software` or `software` as stored kinds.

## Project Presentation Contract

Tab order is browser-verifiable only. GitHub's `views(orderBy: {field: POSITION})` currently returns a sequence that can ignore the ordering field (NAME also returns nonalphabetical results). Keep the returned sequence as diagnostic evidence, but do not convert it into API drift or an API pass for visible order. `apiPassed` covers supported settings only; saved/reloaded browser order remains mandatory even when it is true. Do not recreate or renumber views to match the API sequence. See the [reproduced API ordering report](https://github.com/orgs/community/discussions/206377).

Use these views in the listed relative order, with Repositories enabled by the effective policy above. Build Units is not a default view. Additional user-created views are informational, not audit failures; preserve their identities and relative order:

| View | Layout | Filter | Slice | Grouping | Sorting | Visible fields |
|---|---|---|---|---|---|---|
| Tickets | Board | `status:todo,deferred -label:"Technical Decision"` | none | horizontal sections by Work area; columns by Answering group | Title ascending | Title, Status, Domain, Waiting on |
| Product & Operations | Board | `kind:product,operational status:todo,deferred,decided,finished -label:"Technical Decision"` | none | columns by Board status; no horizontal grouping | Title ascending | Title, Domain, Complexity |
| Software | Board | `kind:Software status:todo,deferred,decided,finished -label:"Technical Decision"` | none | columns by Board status; no horizontal grouping | Title ascending | Title, Domain, Complexity |
| All Tickets | Table | `status:todo,deferred,decided,finished,out-of-scope -label:"Technical Decision"` | none | none | Status ascending | Title, Status, Kind, Complexity, Responsibility, Category |
| Out-of-Scope | Table | `status:out-of-scope -label:"Technical Decision"` | none | none | Title ascending | Title, Status, Domain, Responsibility, Resume When |
| Repositories | Board | `has:repositories status:todo,deferred,decided,finished -label:"Technical Decision"` | Repositories | horizontal sections by Repository Ticket Layer; columns by Status | Title ascending | Title, Build Units, Repository Build Units |

Out-of-Scope shows each excluded ticket directly. Existing Decision Areas views are informational; a skill update never deletes or recreates them, and only the [retirement procedure](#technical-decision-presentation-retirement) deletes a named one.

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
2. **API repair.** Satisfy [Publishing Safety](#publishing-safety), then run `sync --views-only`. Under the publishing lock and preflight, it reads the saved views and fields and validates every target before writing. A missing or duplicate contract view, a missing or ambiguous field, or an unknown `--rename-view` number stops the run with an actionable error and changes nothing. Resolve only the named cause, then rerun once. Complete missing field setup in the GitHub interface. Use the explicit missing-view setup above when a view is genuinely absent; then rerun existing-view repair only for remaining supported drift. Otherwise ask the user which saved view, if any, is the contract view, or which duplicate is canonical. Rename only a view explicitly identified by its number, for example `--rename-view "5=Out-of-Scope"` for the existing exclusion tab; never infer that an unknown view is a contract view. The command writes only differing supported settings, so a matching repeat run makes zero mutations. It then re-reads saved state once, runs the audit once, and reports `verified`, `failed`, `unverified`, `notAttempted`, `remainingFieldSetup`, `remainingGitHubUi`, the full `audit`, and `nextStep`.
3. **Browser repair.** In the signed-in GitHub Project, change only the settings listed in `remainingGitHubUi`, taking each expected value from the finding and `PROJECT_VIEW_CONTRACT`. This may include sorting, grouping, slicing, and tab order. Use REST setup for genuinely missing views. Do not create a second view to bypass an unsupported in-place update. Correct field findings only as the field requirements above describe, preserving option IDs and item values; apply the canonical colors only to Board status and preserve other fields’ colors.
4. **Save shared defaults.** Save each changed view with its save-changes action, never save-as-new-view, so the setting becomes the shared view default. A correct-looking tab, URL query parameters, or an unsaved preview does not prove the saved view. Reload the view without query parameters before trusting it.
5. **Verify saved state.** After saving the affected views, run `project-view-audit` once. Then verify each check in `audit.manualUiChecks` in the browser, including visible tab order, slicing, and Status columns. Fix only a failing setting, save it, and audit again. Keep completed work; never repeat the whole setup after each setting.
6. **Report.** Give three separate outcomes: A, canonical data and derived fields synchronized (or not attempted/failed); B, API-supported presentation applied and verified (or pending/failed); C, browser-only settings saved and verified (or pending). Name each remaining setting with its view, expected value, and exact limitation. Automated fixtures never prove a rendered board correct. Claim presentation complete only when the audit passes and every UI-only check is verified after saving.

To add only the two status boards to an existing Project, run from the consumer repository root:

```bash
node <skill-dir>/scripts/ticket-projection.mjs sync --create-views --view "Software" --view "Product & Operations"
```

This creates only missing selected names and leaves every existing view unchanged. REST creation sets both filters, visible fields, Title sorting, empty horizontal grouping and Status column grouping automatically. The GraphQL fallback creates the layout and visible fields, then updates the filter on the confirmed new identity; it reports sorting/grouping differences as remaining browser work. Unrelated drift in the returned full audit is informational for this bounded addition; do not run broad view repair as an implicit follow-up. Verify no slicing in the saved browser views, then position Product & Operations, then Software, immediately after Tickets while preserving all existing identities and the relative order of other tabs. Neither creation API can set tab positions; this one-time browser step is still required.

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

After Build Design, maintain one native `BU-*` label for every canonical Build Unit. Apply all applicable BU labels only to tickets without explicit repository mappings. Remove managed BU labels from explicitly repository-mapped tickets. Populate the separate `Repositories` multi-select field for both explicit repository tickets and tickets inherited through canonically owned Build Units. Use sets while deriving repository IDs: two or more matching Build Units owned by the same repository still produce one selected repository option and one Project card. Build Unit tickets retain their BU labels, and the separate field makes the same stable issue visible in the repository board without polluting either slice panel.

Keep the complete Build Unit mapping in the `Build Units` text field and the issue body’s collapsed canonical-reference area. `Repository Build Units` renders the member-unit lists of repositories reached by either projection route; it is display metadata, not a new canonical ownership claim. Keep `Repositories` as projection-only membership. Never write derived repository visibility back into ticket `repositories`, and never treat it as repository-wide scope during design or readiness validation.

## Stable Decision Identity

Render exactly one current `software-design-ticket TICKET-NNNN` marker for each ticket; the skill renders no TD issues, whose existing `software-design-decision TD-NNN` markers stay historical identities. Inventory both these namespaces and the legacy `technical-design-decision` / `technical-design-ticket` namespaces before any write. Adopting a legacy ticket marker is retired: when the issue of a canonical ticket still carries a `technical-design-ticket` marker, alone or beside a current one, every command that reads ticket issues (`sync`, `reconcile`, `pending-comments` and `post-summaries`) stops before any write and names the issue; migrate it with an earlier Software Design release, never by creating a replacement. A legacy marker on an issue that no canonical ticket names remains a recognized identity, reported in `unknownTicketIds`. One legacy plus one current decision marker for the same TD on the same issue is the same identity. Repeated identical markers, different identities on the same issue, and the same identity on multiple issues are collisions: stop before any write and reconcile them explicitly. Closing or archiving a TD issue does not retire its identity: its marker stays in the collision inventory, and a ticket marker added to its body is a collision. Non-managed history markers such as `casino-migration-history` are not ticket identities. Never match an issue from its title alone. Unchanged reruns preserve issue/item IDs, comments and unmanaged fields.

## Human-First Rendering

Render ordinary tickets from the existing canonical text fields, written under [implementation-detail-tickets.md](implementation-detail-tickets.md). A reader given only the issue should understand the situation, decision, practical alternatives, reasons, assumptions, and relevant prerequisites. Preserve authored language and Markdown; fixed labels remain English. The deterministic renderer must not invoke AI, translate, infer consequences, or rewrite narrative text during synchronization.

- `todo`: use the actual question as the opening heading, followed directly by context without a Situation heading. When the ticket holds recorded parts, show them under `Already decided` before the options, which then cover only what remains open. Render lettered alternatives under `Options` and the proposed choice/reasons under `Recommendation`. Add relevant `Before answering` prerequisites and a concise invitation to comment with a choice, adjustment, alternative, or clarification. Comments do not automatically approve or complete a ticket.
- `deferred`: lead with the reason/blocker and `Resume when`; make clear the answer is still required for the target version. Keep the question and any available proposals below this explanation.
- `out-of-scope`: lead with the exclusion and `Reopen when`, explicitly stating that no current-scope decision is required. Any recommendations remain future proposals.
- `decided`: lead with `Recorded decision` and the resolution; state that affected canonical updates and checks remain before completion.
- `finished`: lead with `Final outcome`. Both resolved statuses follow the resolution with `Decision origin`, which shows each attribution entry's category, decision, conditions, and evidence, or `Unknown origin` when none is recorded, so status alone never implies human approval. Both retain `Original question` and context, without presenting an earlier recommendation as the answer.

Omit empty sections and absent optional relationships. Resolve generated prerequisite titles and statuses from canonical ticket records. Use descriptive names as relationship labels; explicitly show an unresolved reference and its ID rather than guessing or silently discarding it. Use issue links only when the existing bulk projection snapshot supplies them, without extra per-ticket lookups. A newly created related issue may acquire its navigation link on a subsequent sync; names and canonical IDs are retained in the meantime.

Keep stable issue markers and title conventions unchanged. Put full Build Unit/repository mappings, dependency IDs, owner, durable outcome IDs, source path, and realization disposition in the existing collapsed `Canonical reference` area. Project fields, labels, and membership are unchanged.

Preserve canonical `current_shape` under `Current shape`, following the status-specific opening and context. Use a plain-text fence for `tree` and a Mermaid fence for `logic` or `state`. List its canonical `source_refs` in the collapsed reference. Do not infer or generate visuals during projection.

## Request Routing And Sync Execution

Classify the requested GitHub work before choosing a command:

- For a layout-only request about view names, order, layout, filters, slicing, grouping, sorting, or visible fields, inspect with `project-view-audit`, or configure and repair through [Setup And Explicit View Repair](#setup-and-explicit-view-repair). Do not run ticket synchronization merely to inspect or repair a view.
- For canonical ticket changes, issue-body drift, labels, Project membership, or Project field values, run `sync` or use read-only `reconcile` first when provider writes are not yet authorized.
- When both presentation and projection data changed, perform both bounded workflows. Do not treat a successful ticket sync as proof that presentation is correct; routine `sync` never starts view repair.

`sync` loads one complete issue and Project snapshot, validates it, and derives the per-identity mutation plans before scheduling ticket writes. Shared setup, label-schema changes, and other global mutations remain sequential. Distinct tickets then run with at most three plans in flight. Every operation for one ticket stays ordered: issue content, managed labels, Project membership, then Project fields. Managed ticket-label additions and removals use one issue edit whenever any are needed. Fields within one Project item remain sequential.

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

`sync` validates tickets, Build Units, repositories, and the exact `Repositories` multi-select field through the GraphQL Project schema before provider writes and holds a workspace-exclusive lock. If a lock already exists, stop; never start a second writer or remove a possibly live lock. `reconcile` and `project-view-audit` are read-only; `sync` is the single publishing command and does not repair `project-title` drift. Ordinary data synchronization does not run `project-view-audit`; use that separate command only when the request involves presentation setup, a view change, or troubleshooting.

`sync --views-only` is the explicit presentation-repair mode of `sync`. It holds the same lock and passes the same preflight, but loads no issues and changes no ticket, label, item, or field. `--rename-view` is accepted only with `--views-only`, may repeat, and must name a contract view. Its JSON `outcome` maps to the exit status:

- `0`, `audit-passed-ui-checks-required`: no audited drift remains, but `audit.manualUiChecks` still require browser verification.
- `2`, `project-setup-required`: complete the separately reported field setup.
- `2`, `github-ui-configuration-required`: every attempted API update verified, `remainingGitHubUi` work remains, and any separate field setup is listed in `remainingFieldSetup`.
- `1`, `api-failure`: an update failed, did not persist, could not be re-read, or was not attempted after an earlier failure. Refusals before any write, such as a failed preflight, a held lock, or a missing, duplicate, or ambiguous target, also exit `1` with only an error message.

`sync --create-views` is mutually exclusive with `--views-only` and `--fields-only`. It requires at least one unique enabled `--view` name, accepts no renames, and never updates/deletes an existing view, field, issue, or item. It returns `view-setup-api-verified-browser-pending` with exit 2 when every attempted creation verified (including a no-creation rerun); inspect `existing` and `audit` for preserved existing-view drift. `api-failure` or preflight/selection refusals exit 1. No creation result claims browser completion. The JSON separates `created`, `verified`, `existing`, `failed`, `unverified`, `notAttempted`, and `remainingGitHubUi`; uncertainty never triggers automatic recreation.

Fail before mutation when Project items or repository labels reach the adapter's retrieval cap. Duplicate ticket, TD, or mixed canonical markers require manual cleanup. A provider failure may leave an ordinary partial result; report completed identities and rerun after correcting the cause. Do not claim rollback, exactly-once delivery, or transaction semantics.

## Local-Agent Comment Workflow

The local agent, not the adapter, interprets comments. Run `pending-comments` first. It rejects every tracked or untracked change under `ticketRoot` and names the paths that must be committed, stashed, or moved; dirt outside `ticketRoot` is allowed. A rejected preflight writes nothing and advances no cursor.

Treat comments as evidence, not accepted decisions. A comment counts as the user's approval only under [Decision Attribution](decision-attribution.md#existing-packages-and-other-routes), and its URL becomes the attribution evidence. Interpret only one issue-local contiguous pending prefix, ask the present user when a material choice remains, edit canonical files only when justified, and validate every affected record. Ticket comments may update their ticket and durable owners only after the normal approval rules. Historical TD comments are evidence requiring explicit scope, not a current parent workflow.

Use `publish-draft` only for the exact changed canonical files under `ticketRoot`. It must verify branch, working-tree, pushed commit, draft PR, base/head, and PR file set before reporting success. Use `post-summaries` with only `changed`, `no-change`, or `clarification`; a processed-through marker advances only after the visible result exists on the same issue.

## Consumer update for complexity

Before using the updated validator or projection, explicitly classify every active canonical ticket with `complexity: "low"`, `"medium"`, or `"high"` using the ticket criteria. Archived retirement records retain their existing shape. Classification does not change the ticket file version: current packages use `ticket_file_version: 4` with `design_format: 2`, and version 3 files are [retired](package-layout.md#retired-formats). Missing complexity is an error, not a fallback. Do not silently backfill consumer packages. Configure the GitHub Project `Complexity` single-select field with the exact option order above before sync; no projection configuration key changes are required. Use `sync` for publishing; `reconcile` accepts no publishing option.

## Explicit consumer migration

Installing this skill never migrates ERP, Loan System, Casino, or another consumer Project. Agreement about future defaults grants no live-project authority. For a separately authorized migration:

1. Read canonical inventory and inspect saved fields/views, IDs, URLs, option IDs/colors, and existing item values. Map any existing experimental Answering order/Tickets board explicitly by view number; never guess from an unfamiliar name. Identify duplicate/incompatible fields before writing. Preserve extra views and unrelated field values, including experimental Readiness and Readiness as of.
2. Create the missing Board status single-select with the five options above, Work area/Waiting on text fields and Answering group single-select through explicitly scoped setup, with the required options and distinguishable colors. `sync` reports missing fields precisely; it does not create them. For an existing compatible Answering group, map any old option ID to its approved new name using `sync --fields-only --answering-option "<id>=Ready" ...`. This bounded operation also clears Status/Answering group/Board status descriptions, applies canonical Board status colors, and verifies the saved IDs, names, colors, order, and descriptions. No option is recreated. Unmapped incompatible names or extra options are conflicts, not deletion permission. External writes may partially fail; inspect saved state before retrying.
3. Apply the effective Repositories policy above; record explicit show/hide preferences only when chosen by the user. Satisfy publishing safeguards, run normal sync and reconcile, use `sync --create-views --view "<enabled-default-name>"` for genuinely missing selected views, then explicitly repair existing views with `sync --views-only --rename-view "<number>=Tickets"` as applicable. Preserve view IDs/URLs. Do not remove canonical Build Unit/repository mappings or BU labels.
4. Configure horizontal/column grouping, sorting, slicing and relative tab order in the browser. Preserve additional user tabs and their relative positions. Save shared defaults, reload each affected view, audit readable saved state, and visually verify manual checks. If browser tools, session, or permissions are unavailable, name every pending expected setting from the contract. Never recreate a view to bypass an unsupported update.
5. Delete obsolete tabs only under separate explicit authorization identifying those exact live views. Workflow, Build Units, Technical, Non-Technical and Decision Areas are no longer required, but their existence is not an error; delete Decision Areas only through the retirement procedure below, after its TD items are archived. No experimental Domains, Ready to answer, or Domains & dependencies defaults are added. Report data, API presentation, and browser verification separately.

Every projection command, including read-only `reconcile` and `project-view-audit`, requires design format 2 ([Retired Formats](package-layout.md#retired-formats)).

## Technical Decision Presentation Retirement

Current packages have no TD issues. Installation, migration and every `sync` mode leave the historical TD issues, their Project items, Decision Areas views, the retired Parent Decision, Decision Status and Decision Tickets fields, and the retired labels in place. Retire them per Project only under explicit authorization that names the Project and each object: view numbers, field IDs, label names and TD issue numbers. Before starting, the shared branch must hold a design format 2 package and pass [Publishing Safety](#publishing-safety), ordinary `sync` and `reconcile` must have converged, and the TD-to-owner mapping must be recorded in repository evidence outside the canonical package. There is no retirement command; follow these steps:

1. **Snapshot**, read-only, to session scratch or consumer evidence outside the canonical package: the `reconcile` and `project-view-audit` JSON, `gh issue list -R <repo> --label "Technical Decision" --state all --json number,title,state,labels,url`, and a GraphQL Project snapshot of views, fields, options and items with their field values.
2. **Repair the contract views** with `sync --views-only`, adding `--rename-view` only for views the user mapped, then finish the reported `remainingGitHubUi` settings. This removes retired columns and applies the Technical Decision filter guard.
3. **Archive each TD Project item** with `gh project item-archive <number> --owner <owner> --id <item-id>`. Archive, never delete, so its field values remain evidence. Check the Project's built-in workflows first and note any enabled auto-archive or auto-add workflow.
4. **Close each TD issue** with `gh issue close <number> -R <repo> --reason "not planned" --comment "<text>"`. The comment says the Technical Decision is retired and links each current owner, and the mapping record, at a pinned commit. It never contains `<!-- software-design-… -->` or `<!-- technical-design-… -->` text. Never edit the issue body, title, labels or marker.
5. **Delete only the named obsolete views** in the signed-in GitHub interface, after re-reading the view list and matching each number, name and ID to the snapshot.
6. **Optionally delete the retired fields** Parent Decision, Decision Status and Decision Tickets by ID. Never change the Kind field, and never touch experimental fields such as Readiness.
7. **Optionally delete obsolete label definitions:** `Software Design Workflow` once the installed skill no longer maintains it, `Technical Design Workflow`, and labels with no remaining use. Never delete `Technical Decision` or `Out-of-Scope`.
8. **Verify** and report data, API presentation and browser outcomes separately. `reconcile` reports unchanged `historicalDecisionIds` and no ticket drift. `project-view-audit` passes and no deleted view remains in `additionalViews`. A GraphQL read shows no non-archived TD item. Two consecutive `sync` runs make no TD issue, TD item or workflow-label call. In the browser, each contract view is saved without filter warnings, with correct tab order and slicing.

Closed and archived TD issues keep their identities. `sync` and `reconcile` still read their markers for collision detection and report them only as `historicalDecisionIds`; they never read TD comments or write to TD issues and items. Keep the `Technical Decision` label and the view filter guard, because an unarchived or auto-added TD item would otherwise reappear in contract views. A skill copy that still renders TD records could re-render or re-add them on a design format 1 shared branch, so never start while the shared branch is format 1.
