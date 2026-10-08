---
name: hermes-ui-workflow
description: Mandatory workflow for every change in a Hermes UI repository - an architect designs and splits the work, builders on an explicitly chosen model implement it, the candidate build is tested by the user in the installed test app (Hermes Canary), the approved pull request is merged and the stable release is built from the approved commit (in-app history plus a GitHub release with DMG and APK).
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
3. **Build the candidate in the test app once there is something to test.** Where the repository has a separate test app (Hermes UI: **Hermes Canary**, see §6), every candidate goes to that app's channel only; the normal app never receives candidates. Ask the user, in a single message, for the authorizations still missing: publication and, if needed, plugin installation or activation. Then publish the candidate through the repository's release mechanism. The candidate reaches the installed test app on Mac/Android through its updater. The test app is one fixed, permanent app with its own channel, not a per-attempt installer: there are no separate demos, test APKs or per-attempt installers.
4. **The user tests that build** in the installed test app, following the walkthrough. Fix anything found in the same pull request. Fixed code needs a new, higher test build number: never overwrite a published version.
5. **Merge** only after the user accepts the behavior **and** explicitly approves that specific pull request. Before asking for that approval, mark the release record `approved` with the date in the same pull request (data only, no code change). Acceptance alone does not authorize the merge. Squash-merge through the pull request, following `repo-workflow`.
6. **Publish the stable release.** From the approved merge commit on the default branch, build the normal app's identity and publish it to the stable channel, with the stable history (approved versions only) and the downloadable release (see §6). This needs its own publication authorization. Report the final state.

While one submodule waits for publication, testing or approval, continue with the next one if it does not depend on it. Do not chain merges on your own, and do not start the next roadmap feature that the user has not asked for.

## 4. Parallel work and versions

- Several architects may work at once. Each owns its own branches. Never commit to another architect's branch or merge their pull requests.
- Before assigning a version, check the published channel (`latest.json`), the open pull requests of the app and plugin repositories, and the plugin tags. Take the next free version and write it in the pull request.
- Only one candidate is in the test channel at a time. If another candidate is still being tested, tell the user and let them choose the order.
- The stable channel only receives approved versions, in increasing order. If two approved features wait, publish them in version order.
- Plugins are cumulative: a plugin release never drops features that are already active. If two lines change the same plugin, the second rebases onto the first and takes the next version.

## 5. Checks and testing

Until the user restores test execution, preserve existing test files and do not add or run unit tests or test suites. Use relevant compile, typecheck and packaging checks; the release build compiles the web and native code. The user tests visible features by hand in the final installed apps. Native UI automation is not a gate. Do not require evidence hashes, leases, evidence manifests or docs-only pull requests for testing attempts. Keep the integrity and signature checks that the real release protocol requires.

## 6. Releases in Hermes UI (`lag0nia/hermes-system-ui`)

- **Two apps from one source.** **Hermes** (`com.lag0nia.hermesui`, channel `hermes-app`) gets only approved, stable versions. **Hermes Canary** (`com.lag0nia.hermesui.canary`, channel `hermes-app-canary`, yellow icon) gets every test build. They install side by side on Mac and Android and share no local data or sign-ins. The variant is chosen only at build time by `scripts/release.sh --channel`.
- **Versions.** The source (`src-tauri/tauri.conf.json`) carries the next stable version `X.Y.Z` and its Android code. Test builds are `X.Y.Z-canary.N` (N = 1..99, rising with each fix) with Android code `stable code × 100 + N` (for example `0.1.29-canary.3` → `102903`). Stable is `X.Y.Z` with the stable code. Never reuse a published number.
- **Release record:** `release-notes/releases/<version>.json` for the stable version, with status `candidate` while testing and `approved` (with the date) before the merge. Test builds have no repository records: their channel history is extended from the record at each test publication.
- **Publication:**
  - `scripts/release.sh --channel canary <X.Y.Z-canary.N> <code> "<notes>"` builds, signs and publishes a test build to Hermes Canary. Add `--bootstrap-dmg` only for the one-time Mac installer of Hermes Canary, which is served from its channel and never from GitHub.
  - `scripts/release.sh --channel stable <X.Y.Z> <code> "<notes>"` runs after the merge, from a clean checkout of the approved commit on the default branch; it refuses records that are not `approved`.
  - `scripts/release.sh --channel stable --history-only` republishes the stable history.
  - `docs/releasing.md` in the repository describes the publishing account, signing files and recovery.
  - Use one Android build cache per worktree (`HERMES_ANDROID_TARGET_DIR`).
- **Downloads:** each stable publication also runs `scripts/github-release.sh`. It creates the GitHub release `v<version>` with a Mac DMG, the Android APK and checksums, all built from the exact published stable binaries, and marks it as Latest. Earlier releases stay downloadable; test builds are never published there.
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
