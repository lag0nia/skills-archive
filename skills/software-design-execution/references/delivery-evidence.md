# Delivery Evidence Materialization

Read this before writing implementation evidence or an authorized publication or install receipt. The workpack's `Delivery Evidence Contract` names the exact paths; this reference says how to fill them.

## Current Layout

```text
delivery-evidence/
├── README.md
├── IMPLEMENTATION-DELIVERY-REPORT.md
├── executions/
│   └── sha256-<full-64-character-digest>/
│       ├── SUMMARY.md
│       └── artifacts/                         # optional
└── receipts/
    ├── publications/
    │   └── <filesystem-safe-artifact>@<version>.json
    └── consumers/
        └── <consumer>--<filesystem-safe-artifact>@<version>.json
```

Copy and adapt the templates under `assets/templates/delivery-evidence/`. The execution directory is the complete Snapshot ID with only its colon replaced by a hyphen. Create `artifacts/`, `receipts/publications/`, or `receipts/consumers/` only to hold a retained output; empty directories are not evidence.

## Execution Summary

The start command creates the one `SUMMARY.md` as `IN_PROGRESS` with its start identity. Keep those start fields immutable and append observations:

- the workpack path, target repository, execution date, starting implementation receipt, and implemented snapshot;
- every workpack `AC-xxx` exactly once with `PASS`, its mapped VE identities, and the observed result;
- every workpack `VE-xxx` exactly once with `PASS`, its procedure, the observed result, and either `Artifacts: None.` or links into the sibling `artifacts/`;
- changed files, protected-boundary results, open later-lifecycle gates, and deviations or escalations.

AC and VE identities are local to this snapshot: record them all in this one file, numbered as the workpack numbers them. A VE the workpack scopes `Evidence scope: consumer-fitness` records that same scope and the observation through the implemented consumer; prerequisite, producer, or fixture evidence and scheduled proof leave it open.

Only after every required VE passes, add `Implemented snapshot`, set `COMPLETE`, and update the README and report. When execution stops, the summary stays `IN_PROGRESS` and the prior README and report stay unchanged. For a same-snapshot workpack revision, keep the old summary in recoverable history before the new start writes the replacement at the same path.

## UI/UX Delivery Review

When the workpack contains `UI/UX Delivery Coverage`, add one `## UI/UX Delivery Review` section to `SUMMARY.md`:

- `Reviewed build`: the exact revision or build identifier and how the application was started;
- `Viewports and states`: what was actually opened and exercised;
- `Review mode`: the workpack's review mode, plus a `Human acceptance` field naming the confirmation when that mode includes `human acceptance`;
- `Deviations and limitations`: material differences from the selected candidate and their disposition, notable permitted adaptations, and any unreviewed condition, or `None.`;
- one table row per workpack journey with its functional and implemented UI/UX VEs and a `PASS` result with concise interaction and comparison findings.

Each implemented UI/UX VE links at least one representative screenshot (`.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`, or `.avif`) under `artifacts/`; logs or traces may accompany it. The summary records what was observed, kept distinct from worker reports and reviewer judgment.

## Optional Artifacts

Retain only bounded machine output that materially helps later verification, such as focused logs, coverage files, traces, screenshots, or checksums; keep secrets, credentials, caches, dependency trees, and giant duplicate logs out. Every artifact link resolves inside the current execution's `artifacts/`; a summary needing no artifact is complete without one.

## README And Implementation Report

`README.md` is the compact index: the latest implemented snapshot, its execution summary, execution history, typed receipts, and open later-lifecycle gates. `IMPLEMENTATION-DELIVERY-REPORT.md` is the current completion receipt: the latest implemented snapshot, `COMPLETE`, the same `Executed snapshot` and `Executed workpack content` as the summary, delivered scope, verification summary, protected boundaries, exclusions, and open gates, linking the summary for detail. Neither labels a newer unexecuted workpack implemented; the [ID-only refresh](#id-only-documentation-refresh) is the one reconciled exception.

## Typed Receipts

Store each receipt in its typed directory from its template, with the unversioned `schema`, every field concrete, and a `PASS` outcome; use filesystem-safe names. A publication receipt proves the producer artifact exists with the recorded identity and integrity; a consumer-install receipt proves the named consumer resolved and installed it. Neither proves behavioral compatibility; that remains a shipped-seam VE in `SUMMARY.md`.

## What Validation Establishes

The completion validator checks the recorded evidence against the workpack, including, for `UI/UX Delivery Coverage`, exact journey coverage, a retained screenshot per implemented UI/UX VE (recognized by file extension), and required human acceptance. It establishes structure and evidence presence only: it cannot judge visual fidelity, authenticate command output, or prove a claimed procedure ran. Run it only for an implementation execution.

## Exact Workpack Content

The handoff snapshot binds the normalized handoff, not the workpack's procedures or scope text. `Executed workpack content` binds the exact workpack bytes at start, and `Executed snapshot` keeps the handoff identity. Historical evidence without these fields stays preserved and fails exact-content verification; a hash of today's workpack never enters an old record as historical proof. When a genuine association cannot be recovered, see [legacy-lineage-recovery.md](legacy-lineage-recovery.md).

## ID-Only Documentation Refresh

Run this only for an explicitly requested synchronization after a handoff refresh with no implementation impact. It creates no execution directory, summary, or VE record, and executes no workpack.

1. Keep the original summary unchanged (`Executed snapshot`, `Executed workpack content`, start time, observations) and the exact original workpack in recoverable history.
2. Copy the new Snapshot ID into the stable workpack and its snapshot-derived evidence paths, changing nothing else.
3. Update the current IDs in the README and report, keep the report's executed-basis identities and old summary link, and add `**Refresh classification:** No implementation impact — <reviewed reason>`.
4. Validate:

   ```sh
   node <software-design-execution-skill-directory>/scripts/validate-delivery-evidence.mjs \
     --workpack <current-WORKPACK.md> --repository <target-repository> \
     --basis-workpack <original-WORKPACK.md-from-recoverable-history> \
     --software-design-skill <software-design-skill-directory>
   ```

This mode reruns current readiness and accepts only snapshot propagation between the two workpacks; it validates the retained execution basis, never execution of the new ID. Missing historical identities stay unknown. A broader documentation-only change needs reviewed reconciliation of the complete difference, keeping the executed identities and labelling reconciled documentation apart from executed acceptance. An implementation-impacting change always needs real execution of a current delta workpack.

A planning refresh leaves prior implemented receipts as recorded even when the current plan is newer; before execution, bind actual prerequisite outputs to their expected contracts as [execution eligibility](execution-eligibility.md) describes.
