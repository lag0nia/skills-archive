# Consumer Evidence

Nothing is removable because it looks old, large, unfamiliar, duplicated, oddly defensive or unreferenced by a direct import. Those are clues. Removal needs evidence that no supported consumer remains, or the user's explicit authorization to retire the capability.

## Learn How Code Is Reached

Before judging reachability, find how the project starts and loads code:

- runtime entry points: main modules, server and CLI start-up, manifest scripts and executables, container or process definitions, serverless handlers;
- routes and handlers, including file-system routing and route tables;
- registries, plugins and dependency injection: names in configuration or manifests, decorators, discovery by directory or naming convention;
- dynamic loading: computed imports or requires, reflection, module or class names assembled from strings, package entry-point metadata;
- background work: schedulers, cron definitions, queues, workers, event subscribers, webhooks;
- configuration: environment variables, feature flags, per-environment files, defaults;
- packaging and build: published files and exports, build scripts, bundler inputs, CI and deployment definitions;
- persistence and serialization: schemas, migrations, stored enum values, field names, cache keys, message and file formats;
- public contracts: exported packages, HTTP or RPC APIs, SDKs, events consumed by other systems or repositories;
- templates, styles, translation keys and assets referenced by string;
- manual entry points, which need no internal caller: commands, operator and rollback scripts, compatibility helpers, package exports, import and export functions, and admin or debug endpoints;
- tests, documentation and examples, which do not prove runtime use but must change with the code.

## Discovery Coverage

Check whether discovery methods cover private and nested declarations inside reachable files, as well as exports and unreachable files. Supplement gaps with appropriate available static analysis or a lightweight declaration/reference scan that handles the language's declaration forms and indentation. A name occurring once is a lead, not a universal algorithm or deletion proof; account for language-specific and implicit consumers. Missing tooling does not justify silently omitting a category. Do not install tools or change project configuration merely for inspection unless already authorized.

When delegating, preserve the relevant investigation coverage in assignments and reconcile material omissions in returned work. Delegation is optional; use the workflow's final reconciliation to account for discoveries.

## Prove or Reject a Candidate

1. Search for every form of the name: symbol, file and module path, package name, configuration key, route or event string, kebab, snake and camel variants, and fragments joined at runtime.
2. Classify each hit as production (runtime source, shipped configuration, entry points, migrations, operational scripts), non-production (tests, docs, comments, snapshots) or ambiguous (fixtures, examples, plugins, reflection, generated code, exported surfaces). Inspect ambiguous hits until they are classified.
3. Read the callers and the loading mechanism; search counts alone prove nothing.
4. Read the history (for example `git log` and `git blame` on the path) and any decision records: why it exists, and whether it was retired, abandoned half-built or is waiting for a caller that is still planned.
5. Consider consumers you cannot see: other repositories, deployed clients sending older data, operators, stored records. Look for evidence of them (documentation, runbooks, manifests, history, recorded evidence) instead of assuming either way.
6. State what the removal gives up. "Nothing observable" is acceptable only with evidence.
7. Name the smallest check that would fail if the removal were wrong.

A removal is ready only when every consumer question is answered. Keep code whose consumer is real or whose current decision still justifies it. When a question stays open, do not drop the candidate: record what is confirmed, what is unknown and what would settle it, as a plan question or a qualified observation.

For each planned removal, the plan records the consumers checked, the dynamic, public and persistence checks, the history consulted, what is given up and how it is verified.

## Entry Points Without Internal Callers

Commands, scripts, compatibility helpers, package exports, manual import and export functions, and admin or debug endpoints exist to be called from outside the code, so having no internal caller proves nothing. Find their intended consumer and contract in documentation, runbooks, package metadata, repository instructions, recorded evidence and history. While that use is still plausible, keeping or retiring the entry point is the owner's decision.

A broken command is a repair-or-retire question, not grounds for deletion. Record what is broken and what each choice implies.

## Replaced Implementations

When a newer implementation replaced the candidate:

1. Name the replacement and confirm that production uses it.
2. Sort each test of the old implementation, case by case rather than file by file:
   - the behavior still matters and the replacement's tests cover it: remove the old test;
   - the behavior still matters but nothing covers it: port the assertion to the replacement's tests before the removal, and name the target file in the plan;
   - the test only restates discarded mechanics: remove it with the code.
3. When old tests protect behavior the replacement lacks, the gap is a bug or product question. Record it with the test that shows the behavior, so the guarantee is not lost silently.

Split mixed test files instead of deleting them whole. Do not keep dead code only because its tests pass, and do not delete a behavioral guarantee because its implementation moved.

## Static Analysis

Dead-code, unused-export and unused-dependency tools (for example Knip for JavaScript and TypeScript, or the ecosystem's equivalent) produce leads, never deletion authorization.

- Use such a tool only when it is already available or the repository or user permits adding it. Do not install tools or change dependencies to run one.
- Check configuration before trusting results (without changing project configuration unless authorized): confirm entry points, workspaces or packages, framework integrations, production versus test scope and path aliases. Account for false positives through precise scope and configuration checks, not broad ignore patterns.
- Verify every reported item with the steps above, especially files that may be entry points or dynamically loaded, exports that may be public, and dependencies used by CLIs, configuration files or as peers.
- Re-run the tool after a batch. Removals often expose further candidates, such as an endpoint whose only caller was removed, and these need the same proof.

## Dependencies

A dependency is unused only when no source file, script, configuration file, build step, plugin or command line reaches it, including peer requirements and tools that load it by name. Removing a dependency changes manifests and lockfiles: do it only when the plan authorizes it, using the repository's own package workflow.

## Complete an Authorized Retirement

When the user has explicitly retired a feature, remove it from every surface it reaches, not only the visible UI or one implementation file:

- UI: entry points, navigation, routes, components, styles, assets, translation strings;
- backend: handlers, services, jobs, schedules, event handlers;
- integrations: exports and imports, webhooks, API endpoints, SDK surfaces;
- configuration: flags, environment variables, defaults, per-environment files, permissions and roles;
- telemetry defined in the repository: events, dashboards, alerts;
- dependencies used only by the feature;
- tests and fixtures that exercise only the retired behavior;
- user and developer documentation that exists for the feature, which the retirement authorization covers, adding a changelog or release-note entry where the repository keeps one. Records of past releases stay.

Then search again for every name, path, key and string of the feature.

Retiring a feature does not authorize changing stored data, and deleting stored data is outside cleanup even when the user wants it. Keep historical migrations, do not write data-deleting migrations or scripts, and do not remove readers still needed for existing data. Record what remains as an observation or question, and offer it as a separate data task rather than doing it within this plan. Before removing a public API, wire format or persisted format that other systems may still use, ask. Code the feature shared with surviving behavior stays, together with its tests.
