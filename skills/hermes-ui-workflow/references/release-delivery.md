# Hermes UI release delivery

Use this reference for product features that need a candidate release or backend delivery. Read the current repository instructions and implementation first. Treat every authorization as specific to the action it covers; authorization to implement or accept behavior does not authorize publishing, activating, restarting or merging.

## Candidate and user review

Prepare one feature branch and pull request with the implementation, required dependencies, in-app release notes and a detailed backend support guide, or an explicit `No backend update required` statement. Release notes link to the guide and summarize the required backend work. Prepare the guide and Spanish user walkthrough before asking for missing publication or activation authorization. Do not publish or activate until that authorization exists.

Use the existing release channel to put the candidate in the final installed Mac/Android apps. The user performs the functional walkthrough in those apps; keep the steps short and under ten minutes. Do not create standalone demos, test APKs or per-attempt installers. If there is no usable delivery mechanism or authorization, leave the candidate reviewable and report the blocker clearly.

Before delivery, verify backend availability and the installed version through the repository's documented read-only status mechanism. Check required package/version and contract compatibility without installing, updating, starting or restarting anything, and make no model or Jev call. If no such read-only mechanism exists, state that limitation and leave availability verification to the user; do not invent an endpoint or path.

After the user accepts the visible behavior, obtain explicit approval for the specific pull request before merging it. Acceptance alone does not authorize merge, production publication, backend activation or restart. After merge, finalize release metadata and history. When the candidate's approved bits are identical, finalize that candidate without rebuilding identical artifacts. Never overwrite an immutable published version; code fixes require a higher app version. If a final release requires a new binary or backend activation, get the corresponding authorization first.

## Release notes and history

Each published release needs current in-app notes and a browsable persistent history covering all published releases. For each release, show:

- app version, date and status (`candidate` or `approved`);
- visible changes and how to use them;
- known limitations;
- exact backend requirements, or `No backend update required`.

This is a required product target; do not imply the history mechanism already exists. Inspect the current app and backend contracts, then integrate the history with the real implementation where needed. Do not invent an endpoint, file path or storage API.

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
## Candidate
- App version:
- Status: candidate
- Date:
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
- Candidate publication/activation authorization:
- Installed-app walkthrough (Spanish, <= 10 minutes):

## Final release
- Status: approved
- User acceptance:
- Pull request and explicit merge approval:
- Final release metadata/history location:
- Final binary/backend authorization, if needed:
```
