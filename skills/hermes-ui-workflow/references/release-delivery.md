# Hermes UI release delivery

Use this reference for product features that need a candidate release or backend delivery. Read the current repository instructions and implementation first. Treat every authorization as specific to the action it covers; authorization to implement or accept behavior does not authorize publishing, activating, restarting or merging.

## Candidate and user review

Prepare one feature branch and pull request with the implementation, required dependencies, in-app release notes and exact backend package or an explicit `No backend update required` statement. Prepare the package, installation/update guide and Spanish user walkthrough before asking for missing publication or activation authorization. Do not publish or activate until that authorization exists.

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

When a feature needs backend changes, provide an exact downloadable implementation for the release in its own plugin, package or service. Record its version/tag/commit, minimum compatible Hermes and UI contracts, and supported environments. Start in the same source repository; use a separate repository only for a component maintained independently.

Include one documented installation/update command and a guide that states:

- what is installed or updated, prerequisites and relevant dependencies (for example, the satisfaction package, Jev or Hindsight service);
- which restart is needed, if any; the guide describes it, but the agent executes a restart only with explicit authorization;
- how to preserve existing configuration additively, with optional user-supplied templates containing no secrets;
- backup and rollback steps, including limits caused by persistent-data migrations;
- how the app reports a missing or incompatible backend without breaking unrelated app features;
- the target portability and the environments actually verified, stated separately.

Fail with an actionable explanation on unsupported environments. Do not create AI-generated environment adaptations or install unspecified `main` branches. Do not patch native Hermes.

## Reusable feature delivery template

Adapt this compact record to the repository's existing release mechanism; do not invent a new API, endpoint or path to fill a field.

```markdown
## Candidate
- App version:
- Status: candidate
- Date:
- Visible changes and how to use:
- Known limitations:
- Backend: no update required / package name and exact version, tag or commit
- Backend download location in the existing release mechanism:
- Read-only backend availability/installation verification (method and result):
- Minimum compatible Hermes/UI contracts:
- Supported environments:
- Verified environments:
- Installation/update command and guide:
- Prerequisites and dependencies:
- Configuration preservation, backup and rollback:
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
