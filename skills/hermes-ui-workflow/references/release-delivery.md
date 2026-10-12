# Hermes UI release delivery

Use this reference for product features that need a release or backend delivery. Read the current repository instructions and implementation first. Treat every authorization as specific to the action it covers; authorization to implement or accept behavior does not authorize publishing, activating, restarting or merging.

## Demo, merge and release

Prepare one feature branch and pull request with the implementation, required dependencies, in-app release notes and the Hermes image release it needs with a short machine setup guide, or an explicit `No backend update required` statement. Release notes link to the guide. Prepare the guide and Spanish user walkthrough before asking for missing publication or activation authorization. Do not publish or activate until that authorization exists.

The user first tries the feature in a local demo: the architect runs Hermes Dev in development mode on the user's Mac and phone (see the skill, §3 and §6). Keep the walkthrough short, under ten minutes. Merged work then reaches Hermes Canary from `main`, and either developer cuts a stable version, when they decide. Do not send ad-hoc installers, test APKs or one-off builds. If a demo or a publication is blocked by a missing tool, device or authorization, leave the work reviewable and report the blocker clearly.

Before delivery, verify backend availability and the installed version through the repository's documented read-only status mechanism. Check required package/version and contract compatibility without installing, updating, starting or restarting anything, and make no model or Jev call. If no such read-only mechanism exists, state that limitation and leave availability verification to the user; do not invent an endpoint or path.

After the user accepts the demo, obtain explicit approval for the specific pull request before merging it. Acceptance alone does not authorize merge, publication, backend activation or restart. Merged work is published to Hermes Canary from `main` (only after the merge, and by an agent only with explicit authorization). When one of the developers decides, they cut a stable version from `main`: its release record becomes `approved`, the history is published and its downloadable GitHub release is created. Never overwrite an immutable published version; fixes need a higher version. Get the corresponding authorization before each publication or backend activation.

## Release notes and history

Each published release needs current in-app notes and a browsable persistent history covering all published releases. For each release, show:

- app version, date and status (`candidate` or `approved`);
- visible changes and how to use them;
- known limitations;
- the Hermes image release it needs and the machine setup, or `No backend update required`.

In Hermes UI this exists: release records in `release-notes/releases/<version>.json` feed the in-app history, and approved versions are also published as GitHub releases with a Mac DMG, the Android APK and checksums (`scripts/github-release.sh`, run by `scripts/release.sh`). In another repository, inspect its real mechanism and integrate with it. Do not invent an endpoint, file path or storage API.

## Machine setup

A feature that needs something on the developer's machine is implemented and released first as a Hermes image release in `Alangr6/hermes-system`, under its `docs/hermes-image-rules.md`. The app release names that image release and, only when something has to be done on the machine, links a short setup guide:

1. the Hermes image release to update to;
2. modules to enable, keys to configure (where, never their values) and models to download (with the image release's script);
3. data migration and restart, if any; the agent executes a restart only with explicit authorization;
4. how to check, read-only, that the machine has what the feature needs;
5. how to go back.

Setup guides are operational, not implementation tutorials. Do not ask an AI to recreate a backend adaptation, and do not install from a moving branch. The app repository's `docs/app-releases-and-hermes-image.md` defines how to fill the release record.

## Reusable feature delivery template

Adapt this compact record to the repository's existing release mechanism; do not invent a new API, endpoint or path to fill a field.

```markdown
## Feature
- Local demo: how it was launched (Mac / Android), walkthrough (Spanish, <= 10 minutes), user acceptance:
- Visible changes and how to use:
- Known limitations:
- Machine side: `No backend update required` / Hermes image >= X.Y.Z (link to the image release)
- Machine setup guide linked from release notes (modules, keys by location, models, migration, restart, check, go back):
- Core notices checked before asking to merge (if the machine side touches the Hermes core):
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
