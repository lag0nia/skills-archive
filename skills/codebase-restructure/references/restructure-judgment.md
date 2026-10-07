# Restructure Judgment

A restructuring earns its cost only with a concrete benefit for this repository, such as fewer places to change for a typical change, clearer ownership, simpler dependencies, easier testing, or a delivery need the current structure blocks. Symmetry, fashion, anticipated reuse and conformance to an architectural style are not benefits. Keeping the current organization is a valid conclusion.

Contents: Evidence and Diagnosis; Intended Direction; Material Decisions; Ownership Before Placement; Locality; One Source of Truth; Boundaries and Interfaces; Dependencies and Communication; Dependencies and Verification; Build and Deployment Boundaries; Admitting Abstractions and Patterns; Duplication; Naming and Terminology; Trade-offs; Alternative Designs; Scenario Checks; Past Decisions; Migration Safety; Verifying the Outcome; Whole-Repository Work.

## Evidence and Diagnosis

Classify what the investigation finds before designing anything:

- Confirmed architectural problem: you can name the cost, such as a typical change touching many places, drifted copies, callers that must know a module's internals, tests that need heavy setup, or parts that cannot be built or deployed as they must be.
- Intentional arrangement: an unusual shape with a reason, found in code, tests, history, instructions or decisions.
- Uncertain lead: plausible but unproven; state what would settle it.
- Bug, cleanup candidate or new functionality: outside restructuring. Record bugs and cleanup candidates as observations; new functionality informs the target only as a confirmed need.

A complaint names a symptom. Trace it to its cause before proposing a change: "adding an integration touches many files" may come from a registry duplicated by hand, a missing interface, configuration spread across layers, or simply a large but coherent feature. The cause decides the remedy, and the answer may be that the cost is inherent.

State the scope of every conclusion. A sampled area supports no claim about the parts not inspected.

Keep improvement candidates apart from alternatives. Candidates address different problems; alternatives are different solutions to one problem. When candidates interact, say whether each complements, depends on or conflicts with the others, and present complementary candidates as parts of one target rather than as a choice between them.

## Intended Direction

Future intentions change what is worth doing, but only when they are known.

- Confirmed plans come from the user, earlier answers, current roadmaps or recorded decisions. They can justify an architectural change even when today's maintenance friction is modest.
- Tentative or stale proposals (an old roadmap item, an abandoned branch, a TODO) are leads to confirm, not requirements.
- Your own assumptions are labelled as such and never drive the target alone.
- Code shows what exists, not what is intended. Never infer future plans from it.

Separate changes that are useful now from those that can wait until the need arrives, and make the target leave room for confirmed needs without building speculative extension points. When direction is unknown, recommend from current evidence and say what would change the recommendation.

## Material Decisions

Ask only when the user's judgment decides the outcome. A good question:

1. has a descriptive title, and states the precise decision and why it matters here;
2. offers the realistic options, including leaving things as they are when plausible;
3. gives each option's benefits, costs, risks and compatibility consequences for this repository;
4. recommends one with its reasoning when the evidence supports it, marked provisional with what would change it when a relevant fact is missing;
5. names the design choices or migration steps the answer affects.

Decisions often depend on each other, so ask in rounds:

- A round contains only questions whose prerequisites are settled by earlier answers, established facts or completed investigation. Group independent questions while the round stays easy to answer; there is no fixed number.
- A question that makes sense only after another answer waits for a later round. Mention the branch it opens when that helps the user choose, with its assumption explicit, but never present its options as though the earlier answer were known.
- Facts are yours to find. A question that needs an investigation you can run waits for that investigation, not for the user; ask the rest of the round meanwhile.
- After each answer, record it, work out which questions remain, and ask another round only while a decision the current scope needs is still open. Do not explore hypothetical future branches, and do not ask for blanket confirmation of work that is already authorized.
- An open question or missing evidence blocks only the items that depend on it. Continue independent investigation, planning or authorized execution meanwhile.

Keep each question and its answer in the plan's `## Questions and answers` under a stable identifier that steps and later rounds refer to instead of repeating it. A known dependent question can be recorded there too, as not asked yet and naming the answer it waits for, so that no one asks it early. Once answered, a question is context for the affected steps, not a recurring blocker; their other prerequisites still apply, and having no open questions does not make a plan or step ready while any other condition is unmet. [design-discussion.md](design-discussion.md) works through a round with a dependent question and independent steps.

## Ownership Before Placement

Decide who owns a responsibility before moving any code. The owner is the part whose rules, data or state define the responsibility, that changes when it changes, and whose tests describe it.

- Move code when another part clearly owns the decision, data or state, or when readers must jump elsewhere to understand core behavior.
- Leave code where it is when its current owner is still the main reason it exists, or when a move would create churn without clarity.

## Locality

Keep together what changes together: code, its types, constants, tests and configuration belong near the behavior they serve. A typical change should happen in one place, and code should be findable by following the project's own vocabulary. The folder layout should express these ownership decisions, not a generic template. Evidence includes co-change history, how many places a typical change touches, and bugs caused by an edit missed in one copy.

## One Source of Truth

Each fact, such as a rule, schema, enumeration, default, template definition or piece of state, needs one owner that others read or derive from. Warning signs are copies kept in sync by hand, synchronization code and copies that have drifted. Choose the owner and make the others consume it. Do not add a wrapper that keeps two truths synchronized.

When copies have drifted, the drift is behavior. Decide which behavior is correct from tests, history and callers, and ask the user when product intent decides it. Consolidating must not silently change what any caller accepts or produces. One owner does not require one behavior: a difference that callers deliberately rely on can stay as an explicit, tested rule of the owning module, and whether it is still wanted is a separate question about behavior.

## Boundaries and Interfaces

A module's interface is everything a caller must know to use it correctly: signatures and data shapes, invariants, the order in which calls must happen, errors and how they surface, required configuration, authentication and authority assumptions, lifecycle (setup, shutdown, retries, resource ownership), and the compatibility or performance obligations callers rely on. Consider only the dimensions that matter at the boundary in question; a small helper needs none of this analysis.

A useful module hides substantial behavior behind an interface that is small and stable relative to that behavior, so callers need not know its internals. Test a suspect module by imagining its deletion: if its complexity would scatter across callers, it earns its place; if deletion merely removes a pass-through, it is shallow. Prefer tests that exercise behavior through a module's public interface: callers and tests then rely on the same surface, and internal changes do not break them.

- Preserve a boundary that has one clear responsibility, an understandable public surface, internals that do not leak, and room for future work in its area.
- Split a boundary that holds unrelated responsibilities, contains sub-areas changing for different reasons, or keeps forcing placement exceptions.
- Merge or simplify boundaries whose separation is decorative, where the same change always touches both sides, or that exist for boilerplate rather than a real difference in responsibility.
- Create a boundary for a concern that has its own vocabulary and rules and is already straining its parent, or that a confirmed need requires. Anticipated growth alone is not enough.

## Dependencies and Communication

No arrangement of dependencies is right in general. Layered architecture, domain boundaries and dependency inversion are possible solutions, not destinations. A small tool, script or data pipeline is often best served by a flat, direct structure, and the existing arrangement may already be the right answer.

Investigate before judging:

- Map the actual dependencies and how parts communicate (direct calls, events, shared state, files, network), who owns each part, its callers, and how changes travel through them.
- Look for concrete costs: changes that repeatedly have to be coordinated across parts, behavior that is hard to test without heavy setup, internals that leak into callers, and coupling that forces unrelated parts to change, build or deploy together.
- Treat a cycle, a deep import or an unusual arrangement as a reason to investigate, not as authorization to change it. Many are harmless; act when one causes a cost you can name, such as broken initialization, tangled tests or changes that ripple.
- Respect contracts the runtime or framework imposes, such as routing and discovery conventions, plugin entry points, required file locations and lifecycle hooks, as well as the repository's own rules.

When a cost is real, propose the smallest arrangement that removes it and explain why it improves this repository. Never reshape code into layers just to satisfy a generic rule.

## Dependencies and Verification

What a part depends on decides how its behavior can be verified, and so what a restructuring must keep testable. Classify the dependencies of a part you plan to move or reshape:

- Pure logic and in-memory state: test directly through the interface.
- Local infrastructure, such as the filesystem, an embedded or locally runnable database, or a child process: tests can use the real thing or a faithful local equivalent, as the repository already does.
- Remote services the team owns: both sides can be tested, and the contract between them needs its own check, such as a shared schema, a contract test or an end-to-end path through both.
- External providers the team does not control: test doubles verify how this code calls the provider and handles its answers. Compatibility with the real provider needs a sandbox, a recorded contract or a live check, or it stays unverified.

No adapter or test-double strategy fits every case; add a seam for a dependency only where tests or deployment actually need to vary it (see Admitting Abstractions and Patterns). A test double shows behavior against the contract the test assumes; it does not prove that a shipped integration works or that a third party still behaves that way. Say which of those remains unverified.

## Build and Deployment Boundaries

Build, packaging, configuration and deployment are part of the architecture when they decide what can change, ship or run independently. When a part must be built, distributed or run on its own, or combined with a different counterpart, check:

- what it imports, bundles or assumes from its current neighbors at build time and at run time;
- how it finds its counterpart: hard-coded addresses, same-origin assumptions, shared session or authentication mechanisms, configuration injected at build versus run time;
- the contract between the parts: which interface it relies on, how compatibility is expressed and checked, and what a "compatible" counterpart must provide;
- how it is built, packaged and started today, and what the independent path would be.

Change these boundaries only for a demonstrated cost or a confirmed need, and keep the existing combined delivery working unless the user authorizes retiring it.

For a frontend that must be distributed on its own and connect to other compatible backends, useful questions include which backend contract it requires and how compatibility is checked, how it behaves when an optional capability is missing, whether configuration is fixed at build time or supplied at run time, which authentication and origin constraints apply, how the frontend itself is distributed, and whether combined delivery stays supported. These prompt investigation and material questions; they are not a checklist to complete or a reason to add a gateway, proxy or other layer.

## Admitting Abstractions and Patterns

Do not introduce shared folders, interfaces, services, layers, base classes, registries, facades, factories or adapters for hypothetical reuse or to match a style. Admit one only with current evidence or a confirmed need:

- several real consumers with the same reason to change;
- a real boundary, such as an external system, a trust boundary, or a seam that tests or deployment actually use;
- concentrated risk that benefits from isolation;
- a confirmed upcoming capability that the current shape would block.

A seam with a single implementation is justified when one of these reasons applies, such as an external system or a trust boundary; it does not need a second implementation to prove it. Without such a reason, a single implementation behind an interface is usually indirection. Shared code needs an owner too. Name the problem a pattern solves; if you cannot, leave it out. Follow the repository's existing conventions and vocabulary and the framework contracts it relies on, but do not import a tutorial's or framework's default layout for its own sake.

## Duplication

Consolidate when copies represent the same truth or policy and a change would have to land in all of them. Keep implementations independent when their owners differ, they evolve differently, a merged version would immediately need flags or branching, or the similarity is only in shape. Record why they stay independent where the next reader would otherwise merge them; architectural cases belong in the decision document.

## Naming and Terminology

Names follow the vocabulary already in use in the project, including its domain and architecture records, with one term per concept. Renames travel with the move so old and new names do not coexist. Public and persisted names are contracts.

Clarify a term only when its ambiguity affects ownership, behavior or a design choice, for example when "account" means the sign-in identity in one module and the billing customer in another, and the question is which part owns deletion. State the meaning the plan uses, in the repository's existing words, and update its existing glossary or architecture documentation only when the work is authorized to change it. Do not start a new glossary for routine technical terms, and do not avoid ordinary architectural vocabulary.

## Trade-offs

Weigh and explain:

- the gain: fewer places to change, clearer ownership, simpler dependencies, better testability, a confirmed need met;
- migration cost and risk: number of consumers, public and persisted contracts, packaging, dynamic references;
- churn: conflicts with concurrent work, lost history and review load;
- navigation cost: whether understanding a flow needs more or fewer hops;
- reversibility.

When comparing alternatives for one decision, compare them on the same dimensions so the choice is visible: what changes; the benefit; implementation and migration cost; ongoing cost; compatibility; what verification would show it works; the remaining uncertainty; and why one is recommended. Use only the dimensions that distinguish the options. Present only genuine alternatives, include leaving things as they are when that is plausible, and do not invent weak options to fill a comparison.

State how strongly you recommend a change and why, separately from its priority and its implementation effort: a cheap change can be weakly supported, and a strongly supported one can wait. Never invent scores, savings or estimates the evidence does not provide.

## Alternative Designs

When a consequential interface or ownership decision is unresolved and more than one reasonable design exists, design it more than once before recommending. This is an optional technique; routine or already-settled decisions do not need it.

1. Frame the constraints every design must meet: preserved behavior and contracts, the dependencies involved and how each can be verified, and one representative caller scenario taken from the code.
2. Produce designs that differ in substance: what the interface exposes, where the boundary sits, which part owns state, or how dependencies cross it. Renamed methods or reordered parameters are not alternatives. There is no fixed number; two can be enough, and leaving things as they are may be one of them. Do not add extension points no confirmed need requires.
3. For each design, show enough concrete shape to judge it: an interface or data example, the caller scenario written against it, what it hides, how its dependencies are handled and tested, and its costs.
4. Compare them on the dimensions above and recommend one. Propose a hybrid only when its parts fit together coherently, not to avoid choosing.

Mark every sketch as a proposal, not an approved contract. One agent can do all of this; delegating designs to other agents is optional and only where the environment and the user's authorization allow it. [design-discussion.md](design-discussion.md) has a worked comparison.

## Scenario Checks

Before recommending a significant proposal, walk it through representative and awkward scenarios relevant to it, such as a capability it lacks, a failure and its recovery, ordering and lifecycle (startup, retries, cancellation, shutdown), a new confirmed consumer, or a different deployment. Compare each with what the current code does and what behavior is intended.

When the proposal, the current code and the documented or intended behavior disagree, establish which case applies: a defect in the current code (record a bug observation), stale documentation (a documentation question), or a desired change of behavior (the user's decision). Ask when the user's intent decides it. A restructuring never silently redefines supported behavior.

## Past Decisions

Existing decisions and documented conventions are evidence and constraints. Reassess them against current code and needs. Reopening one requires stating what changed since it was made and why that justifies reconsidering it; do not reopen decisions for taste.

Record approved rationale in the repository's existing decision records. Where they add value, include rejected alternatives that someone would plausibly propose again and the conditions for reconsidering. Do not start a parallel glossary or decision hierarchy next to equivalent records, or a decision per candidate.

## Migration Safety

- Add characterization tests before moving behavior that no test protects.
- Keep moves and renames separate from logic changes so failures and reviews stay attributable.
- Keep every meaningful behavior protected. When tests move to a new interface, retire an old test only for a specific reason, such as the same behavior now being covered through the new interface or the test pinning an internal arrangement that no longer exists. Being old or low-level is not a reason.
- Update every reference, including dynamic ones: registries, string paths, configuration, build and packaging, documentation and tests.
- Add temporary compatibility (re-exports, aliases, adapters, dual configuration) only when consumers cannot move in the same step. Record who uses it and the condition for removing it, and remove it within the plan when possible.
- Every step leaves the system working: no regression attributable to the step, and its changed behavior verified. Record any partial state in `## Progress`.
- For a risky transition, such as changing a persisted format, a public interface or a deployment path, say how to back out or where it is safe to stop, in proportion to the risk.

## Verifying the Outcome

Passing tests shows that nothing detectable broke; it does not show that the restructuring achieved anything. For each significant architectural claim, choose an observable check with existing tools:

- a consolidated rule: one definition remains, and a search shows the relevant callers import it instead of keeping copies;
- a removed dependency: the import or execution path no longer reaches it, shown by a search, the dependency graph or a build that no longer includes it;
- a narrowed interface: supported public entry points still work, and callers no longer reach internals;
- an independently distributable part: it builds, starts and connects to a counterpart through its intended path, not only through the old combined deployment;
- fewer places to change: walk through the typical change that motivated the work and count the places it now touches.

Handle the baseline honestly. Record the failures that existed before the work, attribute new failures to the step that caused them, and do not fix unrelated failures. When a baseline failure blocks verification of a changed behavior, say which check it blocks and what would resolve it; do not report the step as passed. When a check could exit successfully while doing nothing (no tests collected, an empty build, a skipped suite), confirm an expected signal such as the count of tests run or the artifact produced.

## Whole-Repository Work

Start from evidence of cost and from confirmed needs, such as hot spots in history, changes that repeatedly span several parts, and dependencies with a cost you can name, rather than from symmetry or a preferred style. Establish one coherent overall target first, so independent batches move toward the same organization; a collection of individually attractive refactors is not a target. Leave stable, well-owned areas alone. Order batches by dependency and risk. Keep one repository plan and one repository decision document, updating existing area documents where they exist; never create a document per module.
