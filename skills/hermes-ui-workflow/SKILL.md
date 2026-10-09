---
name: hermes-ui-workflow
description: Mandatory workflow for every change in a Hermes UI repository - an architect designs and splits the work, builders on an explicitly chosen model implement it, the architect launches a local demo (Hermes Dev in development mode on Mac and Android) for the user to try, the approved pull request is merged, Hermes Canary carries main for the team, and either developer cuts a stable release when they decide (in-app history plus a GitHub release with DMG and APK).
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

1. **Develop.** One branch, one worktree (under the workspace's `worktrees/` folder) and one writer per feature. The architect designs, builders implement and the architect reviews. Checks are compile and typecheck (see §5).
2. **Local demo.** When there is something to try, the architect launches the app from the feature worktree in development mode, as **Hermes Dev** (see §6), and tells the user it is ready:
   - **Mac:** `npm run dev:app` (Hermes Dev; never plain `npm run tauri dev`, which runs under the Hermes identity). The app opens on the user's Mac with live reload.
   - **Android:** `npm run dev:android` (Hermes Dev; never plain `npm run tauri android dev`, which would replace the installed Hermes app), with the user's phone connected by USB or wireless debugging (or an emulator). The app runs on the phone with live reload.
   - The architect starts the processes and keeps them running, but does not judge the UI itself. Native UI automation is not a gate.
   - It then writes in one message: "Demo ready", what to open on each platform, a Spanish walkthrough of at most ten minutes, and what the demo cannot show yet.
   - If the feature needs a backend change, the plugin change must be installed on the user's server first, with that installation explicitly authorized. Otherwise the demo shows the feature as unavailable.
   - The user tries it. Fixes go into the same branch; most of them appear without restarting the demo. Repeat until the user says it works.
3. **Open or update the pull request.** It includes:
   - the implementation and its dependencies;
   - the release notes for the feature;
   - the backend support guide, or the explicit statement `No backend update required`;
   - the walkthrough;
   - if a plugin changes, its pull request in the plugin repository with a new version and tag.
4. **Merge** only after the user accepts the demo **and** explicitly approves that specific pull request. Acceptance alone does not authorize the merge. Squash-merge through the pull request, following `repo-workflow`.
5. **Canary.** Merged work reaches **Hermes Canary**, the team's second installed app, which is built from `main` (see §6). Both developers see everyone's merged work together there. Canary is published by hand from `origin/main` after a merge the owner approved, by the owner or the second developer (see §6); an agent publishes only with the owner's explicit authorization for that publication. Canary is where integration problems show up, not where individual features are first tried.
6. **Stable release.** Either developer may decide and publish a stable version. When one of them decides Canary is good, they cut a stable version from that `main` commit. It reaches the normal **Hermes** app and the GitHub releases page with DMG and APK. An agent never publishes stable without the user's explicit order. Report the final state.

While one submodule waits for its demo, review or approval, continue with the next one if it does not depend on it. Do not chain merges on your own, and do not start the next roadmap feature that the user has not asked for.

## 4. Parallel work and versions

- Several architects may work at once. Each owns its own branches. Never commit to another architect's branch or merge their pull requests.
- Versions are assigned when publishing, not per feature: Canary builds number themselves from the base version (`X.Y.Z-canary.N`), and the stable version is set when a release is cut. Plugin versions: check the open pull requests and tags of the plugin repository and take the next free one.
- Feature work is tried in local demos, not by publishing per-feature builds. Canary publishes `main` only, so one developer's work never replaces the other's.
- Plugins are cumulative: a plugin release never drops features that are already active. If two lines change the same plugin, the second rebases onto the first and takes the next version.

## 5. Checks and testing

Until the user restores test execution, preserve existing test files and do not add or run unit tests or test suites. Use compile and typecheck checks; publication builds compile and package everything. The user tests visible features by hand: first in the local demo, then together with everyone's merged work in Canary. Native UI automation is not a gate. Do not send ad-hoc installers, test APKs or one-off builds to anyone: individual features are tried in the local demo, and team builds go through Canary. Do not require evidence hashes, leases, evidence manifests or docs-only pull requests for testing attempts. Keep the integrity and signature checks that the real release protocol requires.

## 6. Apps, channels and releases in Hermes UI (`lag0nia/hermes-system-ui`)

There are three app identities. They install side by side, each with its own local data and sessions:

| App | Built from | Reaches | Purpose |
|---|---|---|---|
| **Hermes Dev** | the feature worktree, in development mode | only the developer's own Mac/phone; never published | local demos and fast iteration |
| **Hermes Canary** | `main` | both developers, through the Canary update channel | team integration testing |
| **Hermes** | a stable cut of `main` | everyone, through the stable channel and GitHub releases | daily use |

- **Never run a development build under the Hermes or Hermes Canary identity:** on Android it would replace the installed app and its data. If the Hermes Dev identity is not available yet in the checkout, say so and do not start an Android demo.
- **Publishing** goes through the restricted publisher of the private MSI channel, with a channel parameter (`stable` or `canary`). Every developer uses the same path with their own SSH key. `docs/releasing.md` in the app repository has the exact commands, requirements and failure handling; follow it rather than copying commands from here.
- **Who approves and publishes** (owner decision, 2026-10-09; `docs/releasing.md` §0 has the step-by-step flow):
  - Every merge needs the owner's explicit approval of that pull request, whoever wrote it.
  - **Canary:** the owner and the second developer (Alan, GitHub `Alangr6`) publish, each with their own publisher key, **only from `origin/main` after an owner-approved merge**; never from a feature branch. Canary is published by hand; there are no automatic builds yet.
  - **Stable:** either developer (the owner or Alan) decides when and publishes it, from a clean, up-to-date `origin/main`; whoever publishes it opens the version-bump pull request for the next cycle.
- **Release records** live in `release-notes/releases/`. They feed the in-app history of each app.
- **Downloads:** each stable version also becomes a GitHub release `v<version>` with a Mac DMG, the Android APK and checksums, built from the exact published binaries and marked Latest. Earlier releases stay downloadable; Canary builds never appear there.
- Use one Android build cache per worktree (`HERMES_ANDROID_TARGET_DIR`).
- **Plugins** live in `lag0nia/plugins`. Install them only from tags `<plugin>/v<version>`, following that repository's README and maintenance procedure. When a feature needs a plugin or a minimum version, add it to the app's plugin requirements list.

A developer with their own backend keeps this order and these rules, and adapts only server names and locations to their documented setup.

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
- the Spanish walkthrough and how the local demo was launched;
- any blocked release action;
- the next action the user needs to take.

Keep these states separate: implemented, demo accepted by the user, merged, in Canary, released as stable.

Read [references/release-delivery.md](references/release-delivery.md) when preparing release notes, a backend support guide, a demo, or a Canary or stable release. It defines the required release information and a reusable delivery template.

For process-only skill or documentation changes, do not create an artificial app version, binary or demo feature. Product documentation belongs with the product change it describes.
