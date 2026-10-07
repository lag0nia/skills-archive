---
name: hermes-ui-workflow
description: Plan, implement, review and deliver changes to Hermes UI repositories through an architect-led design, a builder implementation, installed-app user testing and an approved pull request.
license: MIT
---

# Hermes UI workflow

Use this workflow for every change in a Hermes UI repository, including documentation changes and work where developers maintain separate backends. It is portable across Claude Code, Codex and Hermes. The repository should link this skill from its `AGENTS.md` so the workflow is mandatory there; installing the skill alone does not enforce it.

Before work, read the repository's `AGENTS.md`, its role and delivery instructions, and the installed `quiet` and `repo-workflow` skills. Apply quiet mode for the task; the workflow explicitly authorizes it. Those two skills are dependencies, not text to copy or replace. If a dependency is unavailable, report that gap and use the normal archive installer or have the repository owner make it available before proceeding.

Use the repository and user's current instructions to determine the architect, builder, clients and model choices. The architect inspects the actual UI and backend code and contracts, decides the design, then gives the builder a bounded assignment. The builder implements that design without redesigning it. The architect reviews once and sends any needed correction to the same builder. Do not assume a machine, a shared backend, or a model from another developer's setup. If the selected builder model is unavailable, report it to the architect and wait for a choice; never switch models silently.

Write builder assignments and the builder's final factual report in English. The report names changed files, the compile/typecheck/packaging checks actually run and their results, and any gaps. The architect communicates with the user in Spanish.

Deliver one feature per branch and pull request. Keep the implementation reviewable and include required dependencies, release notes, and a detailed reproducible backend support guide or an explicit statement that no backend update is required. A package, script or single-command installer is optional; include one only when reliable for the documented supported environments. Follow the existing `repo-workflow` procedure; merge only after the user explicitly approves that pull request.

Until the user says the app works and restores test execution, preserve existing test files and do not add or run unit tests or test suites. Use relevant compile, typecheck and packaging checks, then let the user test the visible feature in the final installed Mac/Android apps. Give the user a Spanish walkthrough that takes no more than ten minutes. The walkthrough happens inside those installed apps; do not make a separate demo, test APK or per-attempt installer. Do not use native UI automation as a gate.

Do not require evidence hashes, leases, evidence manifests or a docs-only pull request for each manual testing attempt. Keep integrity and signature checks that the actual release protocol requires.

Prepare the candidate and all review materials before requesting any missing publication or activation authorization. Publish only through the existing release mechanism and only with that authorization. A successful compile, package or PR does not mean the feature has been delivered. After the user accepts the installed-app behavior, get separate explicit approval to merge; acceptance does not imply merge, publication or restart approval. Finalize release records after the merge. If publication or activation is blocked or unavailable, say so plainly and hand off the completed PR and candidate materials. Do not start the next roadmap feature automatically.

At handoff, identify the branch and PR, checks completed, backend implementation source/version and support guide or the explicit no-update statement, the Spanish walkthrough, any release action still blocked, and the next action the user needs to take. Keep app delivery status separate from code and PR status.

Read [references/release-delivery.md](references/release-delivery.md) when preparing release notes, a backend support guide, candidate testing, or final release records. It defines required release information and the reusable delivery template. The release-history mechanism described there is a required target for future feature work, not a claim that it already exists; inspect the repository and integrate it where needed without inventing an API or path.

For process-only skill or documentation changes, do not create an artificial app version bump, binary or demo feature. Product documentation belongs with the product change it describes.

Do not modify native Hermes. Use the project's own plugin, hooks or services. Automated work must use synthetic fixtures and avoid real model/Jev calls. Never inspect or display credentials. Do not retry provider HTTP 429 responses or change models to bypass limits. Execute backend installation, updates or restarts only when explicitly authorized.
