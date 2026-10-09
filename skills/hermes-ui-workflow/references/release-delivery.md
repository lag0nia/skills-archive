# Hermes UI release delivery

Use this reference for product features that need a release or backend delivery. Read the current repository instructions and implementation first. Treat every authorization as specific to the action it covers; authorization to implement or accept behavior does not authorize publishing, activating, restarting or merging.

## Demo, merge and release

Prepare one feature branch and pull request with the implementation, required dependencies, in-app release notes and a detailed backend support guide, or an explicit `No backend update required` statement. Release notes link to the guide and summarize the required backend work. Prepare the guide and Spanish user walkthrough before asking for missing publication or activation authorization. Do not publish or activate until that authorization exists.

The user first tries the feature in a local demo: the architect runs Hermes Dev in development mode on the user's Mac and phone (see the skill, §3 and §6). Keep the walkthrough short, under ten minutes. Merged work then reaches Hermes Canary from `main`, and either developer cuts a stable version, when they decide. Do not send ad-hoc installers, test APKs or one-off builds. If a demo or a publication is blocked by a missing tool, device or authorization, leave the work reviewable and report the blocker clearly.

Before delivery, verify backend availability and the installed version through the repository's documented read-only status mechanism. Check required package/version and contract compatibility without installing, updating, starting or restarting anything, and make no model or Jev call. If no such read-only mechanism exists, state that limitation and leave availability verification to the user; do not invent an endpoint or path.

After the user accepts the demo, obtain explicit approval for the specific pull request before merging it. Acceptance alone does not authorize merge, publication, backend activation or restart. Merged work is published to Hermes Canary from `main` (only after the merge, and by an agent only with explicit authorization). When one of the developers decides, they cut a stable version from `main`: its release record becomes `approved`, the history is published and its downloadable GitHub release is created. Never overwrite an immutable published version; fixes need a higher version. Get the corresponding authorization before each publication or backend activation.

## Release notes and history

Each published release needs current in-app notes and a browsable persistent history covering all published releases. For each release, show:

- app version, date and status (`candidate` or `approved`);
- visible changes and how to use them;
- known limitations;
- exact backend requirements, or `No backend update required`.

In Hermes UI this exists: release records in `release-notes/releases/<version>.json` feed the in-app history, and approved versions are also published as GitHub releases with a Mac DMG, the Android APK and checksums (`scripts/github-release.sh`, run by `scripts/release.sh`). In another repository, inspect its real mechanism and integrate with it. Do not invent an endpoint, file path or storage API.

## Reproducible backend delivery

When a feature needs backend changes, provide a detailed, reproducible support guide tied to the app release. The implementation must be obtainable and its version fixed. Link the exact source and version (tag, commit or equivalent), relevant modules and dependencies; a downloadable source/module/dependency set or explicit config-only changes are acceptable. A new package or artificial artifact is not required. Start in the same source repository; use a separate repository only for a component maintained independently.

The guide must give technologies and components, the architecture and approach used to support the UI, and the UI/backend contract connection, including minimum compatible contracts. An architecture explanation supplements concrete reproduction steps; it never authorizes AI to invent a different backend adaptation for an environment.

Document, in order:

1. prerequisites, dependencies (for example, the satisfaction package, Jev or Hindsight service), and the supported starting environment;
2. exact source/version links and the implementation components to obtain;
3. concrete install, update and configuration commands plus any manual steps, with user-specific inputs identified and no secrets included;
4. how to preserve existing configuration and data, back up state, and roll back, including persistent-data migration limits;
5. a safe, read-only way to verify backend availability and installed version, without model/Jev calls, writes, installation or restart;
6. the restart required, if any; the guide describes it, but the agent executes it only with explicit authorization;
7. the target portability and environments actually verified, stated separately, plus actionable behavior for unsupported environments.

A script or single-command installer is optional and appropriate only when it is reliable for the documented supported environments. It is not a universal installer or a required next project. Do not install unspecified `main` branches, create AI-generated environment adaptations, or patch native Hermes.

## Reusable feature delivery template

Adapt this compact record to the repository's existing release mechanism; do not invent a new API, endpoint or path to fill a field.

```markdown
## Feature
- Local demo: how it was launched (Mac / Android), walkthrough (Spanish, <= 10 minutes), user acceptance:
- Visible changes and how to use:
- Known limitations:
- Backend work: no update required / summary of required work
- Backend support guide linked from release notes:
- Exact implementation components, source and fixed version links (or config-only change):
- Architecture/approach and UI/backend contract connection:
- Prerequisites, dependencies and supported starting environment:
- Read-only backend availability/installation verification (method and result):
- Ordered install/update/configuration commands and manual steps:
- User-specific inputs (no secrets):
- Configuration/data preservation, backup and rollback:
- Minimum compatible UI/backend contracts:
- Target portability and supported environments:
- Verified environments:
- Optional script/single command and environments where it is reliable:
- Restart required:
- Pull request and explicit merge approval:
- Canary build that carries it:

## Stable release
- App version and date:
- Status: approved
- Canary build it was cut from:
- Pull requests included:
- Stable publication authorization:
- Final release metadata/history location:
- Downloadable release (DMG/APK) link:
- Builder model used:
- Backend authorization, if needed:
```
