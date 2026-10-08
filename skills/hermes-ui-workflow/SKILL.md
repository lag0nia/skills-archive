---
name: hermes-ui-workflow
description: Mandatory workflow for every change in a Hermes UI repository - an architect designs and splits the work, builders on an explicitly chosen model implement it, the candidate build is tested by the user in the installed apps, the approved pull request is merged and the release is finalized (in-app history plus a GitHub release with DMG and APK).
license: MIT
---

# Hermes UI workflow

Use this workflow for every change in a Hermes UI repository, including documentation changes and work where developers maintain separate backends. It is portable across Claude Code, Codex and Hermes, and every developer of the app follows it. The repository links this skill from its `AGENTS.md` so the workflow is mandatory there; installing the skill alone does not enforce it.

Before work, read the repository's `AGENTS.md`, its role and delivery instructions, and the installed `quiet` and `repo-workflow` skills. Apply quiet mode for the task; the workflow explicitly authorizes it. Those two skills are dependencies, not text to copy or replace. If a dependency is unavailable, report that gap and use the normal archive installer or have the repository owner make it available before proceeding.

## 1. Roles: architect and builders

- **Architect.** Talks to the user, in the user's language (Spanish for the current owners). Inspects the actual UI and backend code and contracts, decides the design and splits large work into deliverable submodules. Gives each builder a bounded assignment, reviews the result once and sends any correction to the **same** builder. Owns the branch, the pull request, the release notes, the walkthrough and every request for authorization. The architect does not hand design decisions to a builder.
- **Builder.** Implements the assignment without redesigning it and without spawning other agents. Returns a short factual report: changed files, the compile/typecheck/packaging checks actually run with their results, and any gaps.
- Builder assignments and reports, code, contracts and all app copy are in English.

## 2. The builder model is an explicit choice

- Before the first builder assignment, the architect confirms which model the builders use. Take it from the prompt or handoff that started the task. If neither names one, **ask the user** and wait for the answer. Never infer it from another developer's setup.
- Write the chosen model into every builder launch, for example the `model` parameter of the Claude Code Agent tool, or `codex exec -m <model>` with its reasoning effort. State it in the handoff report as well.
- If the chosen model is unavailable, stop and ask the user for a choice. Never switch models silently, including for a correction or a "small" task.
- The architect's own model is whatever the user launched; record it in reports, but do not change it.

## 3. Delivery lifecycle

Each feature, or each submodule of a large feature, goes through these steps in order:

1. **Develop.** One branch, one worktree (under the workspace's `worktrees/` folder) and one writer per feature. The architect designs, builders implement and the architect reviews. Checks are compile, typecheck and relevant packaging only (see §5).
2. **Open the pull request** when the feature is complete and reviewable. It includes:
   - the implementation and its dependencies;
   - the release record (in-app notes);
   - the backend support guide, or the explicit statement `No backend update required`;
   - a Spanish walkthrough of at most ten minutes;
   - if a plugin changes, its pull request in the plugin repository with a new version and tag.
3. **Build the candidate once there is something to test.** Ask the user, in a single message, for the authorizations still missing: publication and, if needed, plugin installation or activation. Then publish the candidate through the repository's release mechanism. The candidate reaches the final installed Mac/Android apps through their updater. There are no separate demos, test APKs or per-attempt installers.
4. **The user tests that build** in the installed apps, following the walkthrough. Fix anything found in the same pull request. Fixed code needs a new, higher version for the next candidate: never overwrite a published version.
5. **Merge** only after the user accepts the behavior **and** explicitly approves that specific pull request. Acceptance alone does not authorize the merge. Squash-merge through the pull request, following `repo-workflow`.
6. **Publish the final release.** Mark the release record `approved` and publish the history without rebuilding identical binaries. Approved versions are then published as downloadable releases (see §6). Report the final state.

While one submodule waits for publication, testing or approval, continue with the next one if it does not depend on it. Do not chain merges on your own, and do not start the next roadmap feature that the user has not asked for.

## 4. Parallel work and versions

- Several architects may work at once. Each owns its own branches. Never commit to another architect's branch or merge their pull requests.
- Before assigning a version, check the published channel (`latest.json`), the open pull requests of the app and plugin repositories, and the plugin tags. Take the next free version and write it in the pull request.
- Only one candidate is in the channel at a time. If another candidate is still being tested, tell the user and let them choose the order.
- Plugins are cumulative: a plugin release never drops features that are already active. If two lines change the same plugin, the second rebases onto the first and takes the next version.

## 5. Checks and testing

Until the user restores test execution, preserve existing test files and do not add or run unit tests or test suites. Use relevant compile, typecheck and packaging checks; the release build compiles the web and native code. The user tests visible features by hand in the final installed apps. Native UI automation is not a gate. Do not require evidence hashes, leases, evidence manifests or docs-only pull requests for testing attempts. Keep the integrity and signature checks that the real release protocol requires.

## 6. Releases in Hermes UI (`lag0nia/hermes-system-ui`)

- **Release record:** `release-notes/releases/<version>.json`, with status `candidate`, then `approved` after the merge.
- **Publication:**
  - `scripts/release.sh <version> <versionCode> "<notes>"` builds, signs and publishes the candidate to the private update channel.
  - `scripts/release.sh --history-only` publishes the history after an approval.
  - Use one Android build cache per worktree (`HERMES_ANDROID_TARGET_DIR`).
- **Downloads:** when a version is approved, the release script also runs `scripts/github-release.sh`. It creates the GitHub release `v<version>` with a Mac DMG, the Android APK and checksums, all built from the exact published binaries, and marks it as Latest. Earlier releases stay downloadable; candidates are not published there.
- **Plugins:** they live in `lag0nia/plugins`. Install them only from tags `<plugin>/v<version>`, following that repository's README and maintenance procedure. When a feature needs a plugin or a minimum version, add it to the app's plugin requirements list.

A developer with their own release channel or backend keeps this order and these rules, and adapts only the commands and locations to their documented setup.

## 7. Product rules

- **App copy** is in English, with dates and numbers formatted with an explicit English locale. It never names the connected system ("backend", "agent", "this Hermes", a machine). Describe the data or the feature instead. When data is missing, use a normal card with plain text such as "Not available yet".
- **Optional backend pieces:** each feature depends on an advertised capability. A missing or incompatible optional piece hides or explains that feature and never breaks the rest of the app.
- **Native Hermes:** do not modify it. Use the project's own plugins, hooks or services, until the app's developers decide together otherwise.
- **Safety:**
  - Automated work uses synthetic fixtures and makes no real model or Jev calls.
  - Never inspect or display credentials.
  - Do not retry provider HTTP 429 responses, and do not change models or accounts to get around limits.
  - Install, update or restart a backend only with explicit authorization.

## 8. Handoff report

Report per feature:
- the branch and pull request;
- the builder model used;
- the checks completed;
- the app version and any plugin versions;
- the backend source, version and support guide, or the no-update statement;
- the Spanish walkthrough;
- any blocked release action;
- the next action the user needs to take.

Keep these states separate: implemented, published, tested by the user, merged, released.

Read [references/release-delivery.md](references/release-delivery.md) when preparing release notes, a backend support guide, candidate testing or the final release. It defines the required release information and a reusable delivery template.

For process-only skill or documentation changes, do not create an artificial app version, binary or demo feature. Product documentation belongs with the product change it describes.
