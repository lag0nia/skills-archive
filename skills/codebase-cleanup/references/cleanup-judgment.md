# Cleanup Judgment

Apply these after the evidence is in. Every change must buy a concrete maintainability benefit, such as fewer concepts, fewer places that must change together, less misleading code or cheaper navigation. Matching a personal taste is not a benefit.

## Preserve Behavior

Behavior includes return values and outputs; errors that callers or users rely on; side effects and their order; logs, metrics and events consumed elsewhere; relied-upon timing; public API shapes; command-line flags and exit codes; environment variables and configuration keys; persisted and serialized formats; URLs; accessibility.

- Refactoring code that contains a bug keeps the bug. Record it (see Bugs Versus Cleanup).
- Behavior changes only through explicit authorization recorded in the plan.

## Simplify Without Over-Simplifying

Prefer clear, explicit code to compact code. Worthwhile: removing dead branches and unused parameters, flattening needless nesting, inlining pass-through wrappers that hide no policy, replacing hand-written code with a facility the project already uses, and deleting comments that are false or merely restate the code.

Do not:

- merge distinct concerns into one function or file;
- remove an abstraction that protects a boundary, isolates side effects or policy, standardizes a repeated pattern or serves as a seam that tests actually use;
- trade readability for fewer lines with dense one-liners, nested conditional expressions or clever constructs;
- restyle or reformat code outside the change;
- impose conventions the repository does not already follow.

Use no size or duplication-count thresholds. Split or merge functions and files only when it makes ownership or reading clearly easier.

## Duplication

Consolidate only when the copies share a responsibility and its change pressure: they mean the same thing, and a fix or policy change would have to land in all of them.

Keep copies separate when they belong to different owners or domains, are likely to evolve differently, would need flags or branching as soon as they were merged, or only look alike. Differences in rounding, locale, strictness or error handling are behavior. Check tests, history and callers before treating a difference as an accident.

Consolidate inside an existing owner. When consolidation requires choosing a new owner, creating a shared location or picking one source of truth among modules that each own a copy, it is an architectural decision: record an observation instead.

## Names, Configuration, References and Documentation

- Rename a name that misleads, and update every reference (code, strings, configuration, documentation, tests) so old and new names do not coexist. Public, persisted or externally consumed names are contracts: ask before changing them.
- Remove a configuration key only after proving that no code, environment, deployment file or external system reads it.
- Repair a broken reference when its target still exists elsewhere; remove the reference only when the target is gone for good.
- Documentation follows the Documentation rules below.

## Protections That Look Redundant

Keep these unless evidence proves their role is gone: validation at trust boundaries, authorization and permission checks, idempotency guards, locks, retries, timeouts, cancellation, disposal and shutdown ordering, rollback and recovery paths, readers for older persisted data, kill switches, migration guards and accessibility attributes. "It never happens in tests" is not evidence. Checks that look duplicated across two layers may protect different callers.

## Tests

- Tests protect behavior, not implementations. When the behavior is retired with authorization, its tests go with it. When only an implementation goes, its tests are kept, ported to the current owner or removed as restated mechanics (see Replaced Implementations in [consumer-evidence.md](consumer-evidence.md)), and the plan says which for each affected case.
- Keep regression, rare-case, compatibility and recovery tests. Never delete a test because its case is rare, and never keep code alive only because a test calls it.
- Never weaken assertions, skip tests or loosen checks to make cleanup pass. Tests follow code that is renamed or moved.

## Documentation

Inspecting documentation is part of cleanup. Look for material that is obsolete, superseded, completed, contradicts current code or is broken.

- Documentation describing code you change under authorization, such as a renamed flag, a removed function or a retired feature, changes with that code without a separate question.
- For every other candidate, gather evidence per document or coherent group: what it covers, why that no longer holds (removed or changed code, a newer document superseding it, finished work, statements contradicting current behavior, dead links), what links to it, and anything unresolved it still holds. Age, historical status or few incoming links are not evidence on their own.
- Staleness does not authorize removing or rewriting anything. Ask whether the user wants each group removed, updated or kept, in one grouped question that gives the evidence and what each choice implies. Follow retention preferences and authorization the user has already given, and do not ask again about what they clearly cover.
- Leave candidates untouched until the user decides, and continue independent authorized cleanup meanwhile.
- When the repository's instructions protect a path, say so in the question. Change protected material only if the user explicitly confirms despite that rule.
- After approval, and before removing a document, move its unresolved findings and still-needed facts to a durable location (observations, a current document, or the repository's issue tracker), and update or remove incoming links. Do not replace removed documents with indexes, summaries or report packages unless the user asks for them.
- A partially fixed audit or review still holds open findings. Do not mark findings resolved without verifying each against current code, and do not fix open findings under a cleanup label. While the document stays, point to it rather than copying its findings.

## History That Is Not Documentation

Executable migrations, regression tests and fixtures, and code that keeps older data, clients or formats working are not documentation. Age never makes them removable. Historical migrations stay even when their feature is retired, regression tests follow the Tests rules, and compatibility behavior needs the same consumer evidence as any other code.

## Bugs Versus Cleanup

A bug is behavior that contradicts the supported contract. Cleanup preserves behavior, so it does not fix bugs silently. When you find one:

- record it under the plan's `## Out-of-scope findings` with evidence;
- when a fix is small and clearly wanted, ask whether to add it as a separate, clearly labelled change; otherwise it becomes an observation at completion;
- preserve the current behavior in any cleanup that touches the affected code, and continue independent cleanup.

Differences between producers and consumers, installers and loaders, or documentation and runtime are investigation leads. Establish the supported contract, both sides' evidence and the actual consequence before calling one a bug. For example, a manually run test need not appear in automation; a documented command may be intentionally external. A confirmed contract violation is a separate bug or owner question; correcting its behavior is not ordinary cleanup. Proven stale references can still be cleanup, and explicit retirement remains subject to its authorization.

## Where Cleanup Stops

Cleanup includes removing proven-dead code, completing authorized retirements, inlining or simplifying inside an owner, consolidating duplicates that already share an owner, and renaming within the established vocabulary.

Creating shared modules or layers, moving responsibilities to another module, choosing a single source of truth among modules, changing which modules depend on which, and splitting a module into new boundaries are restructuring. Record the facts and why they matter as an architecture observation, without presenting any design as approved.

## Worth Doing?

Skip a change when its churn outweighs the gain: large renames for little confusion, reshuffles that collide with active plans, style-only edits.
