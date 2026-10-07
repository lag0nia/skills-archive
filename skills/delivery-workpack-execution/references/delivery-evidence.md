# Delivery Evidence Materialization

Read this reference before writing successful implementation evidence or an authorized publication/install receipt.

## Current Layout

Materialize the workpack's exact repository-relative contract:

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

Copy and adapt the templates under `assets/templates/delivery-evidence/`. Use the complete Snapshot ID digest and replace only the colon in `sha256:<digest>` with a hyphen for the directory name.

Empty directories are not evidence. Create `artifacts/`, `receipts/publications/`, or `receipts/consumers/` only when they contain a retained output.

Every implementation workpack requires `Delivery Evidence Contract` with paths bound to its exact snapshot. A missing contract requires a bounded Delivery Planning correction before execution; preserve retained historical evidence unchanged.

## Execution Summary

Use one `executions/sha256-<digest>/SUMMARY.md` for the workpack. Record:

- the workpack path, target repository, execution date, starting implementation receipt, exact implemented snapshot, and `COMPLETE` outcome;
- every workpack `AC-xxx` exactly once with `PASS`, its mapped VE identities, and the observed result;
- every workpack `VE-xxx` exactly once with `PASS`, its procedure, observed result, and either `Artifacts: None.` or links to material outputs under the sibling `artifacts/` directory;
- changed files, protected-boundary results, open later-lifecycle gates, and deviations or escalations.

AC and VE identifiers are local to this workpack snapshot. Do not continue a repository-global VE number sequence and do not create a Markdown file per VE. A concise result belongs directly in `SUMMARY.md`.

Initialize the summary as `IN_PROGRESS` before implementation using `scripts/execution-record.mjs`; preserve its start fields. Finalize the summary only after every required VE passes. If execution stops or remains incomplete, do not create a `COMPLETE` summary and do not advance the implementation report or README.

## UI/UX Delivery Review

When the workpack contains `UI/UX Delivery Coverage`, add one `## UI/UX Delivery Review` section to `SUMMARY.md`:

- `Reviewed build`: the exact revision or build identifier and how the application was started;
- `Viewports and states`: what was actually opened and exercised;
- `Review mode`: the workpack's review mode, plus a `Human acceptance` field naming the confirmation when that mode includes `human acceptance`;
- `Deviations and limitations`: material differences from the selected candidate and their disposition, permitted adaptations worth noting, and any unreviewed condition, or `None.`; and
- one table row per workpack journey with its functional and implemented UI/UX VEs and a `PASS` result with concise interaction and comparison findings.

Each implemented UI/UX VE links at least one representative screenshot image (`.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`, or `.avif`) under `artifacts/`; logs or traces may accompany it but do not replace it. Keep worker reports and reviewer judgment distinct from execution artifacts; the summary records what was observed. A non-UI workpack omits this section.

## Optional Artifacts

Preserve only machine output that materially helps later verification: focused logs, JUnit or coverage files, traces, screenshots, API responses, checksums, or similarly bounded proof. Do not retain credentials, environment secrets, authorization headers, caches, dependency trees, build output unrelated to evidence, or giant duplicate logs.

Every artifact link in `SUMMARY.md` must resolve inside the current execution's `artifacts/` directory. The summary remains sufficient when no separate artifact is needed.

## README And Implementation Report

`README.md` is a compact evidence index. It records the latest implemented snapshot and links its execution summary, execution history, typed receipts, and open later-lifecycle gates. Never label a newer unexecuted workpack implemented or stable.

`IMPLEMENTATION-DELIVERY-REPORT.md` is the current high-level completion receipt. It records the latest implemented snapshot, `COMPLETE` outcome, delivered scope, verification summary, protected boundaries, exclusions, and open later-lifecycle gates, and links the supporting execution summary. Keep detailed commands and observations in `SUMMARY.md`.

For a validated no-implementation-impact synchronization, do not fabricate an execution summary. Synchronize the handoff, stable workpack, README, and report IDs while retaining and linking the prior execution summary as the physical implementation basis.

## Typed Receipts

Publication and installation are distinct facts. Store new receipts only in their typed directories and use the current unversioned `schema` identity.

A publication receipt uses:

```json
{
  "schema": "producer-publication-receipt",
  "evidence_scope": "producer-publication",
  "artifact": "<canonical artifact or package identity>",
  "version": "<exact immutable version>",
  "source_revision": "<exact source revision>",
  "location": "<registry or immutable publication location>",
  "integrity": "<algorithm and digest>",
  "resolution": "<exact resolvable artifact identity>",
  "result": "PASS"
}
```

A consumer-install receipt uses:

```json
{
  "schema": "consumer-install-receipt",
  "evidence_scope": "consumer-install",
  "consumer_repository": "<canonical consumer repository>",
  "artifact": "<canonical artifact or package identity>",
  "version": "<exact immutable version>",
  "resolved": "<exact resolved location or identity>",
  "integrity": "<algorithm and digest>",
  "install_result": "PASS"
}
```

Use filesystem-safe names without path separators. A publication receipt proves the producer artifact exists with the recorded identity and integrity. A consumer-install receipt proves the named consumer can resolve and install that artifact. Neither proves behavioral compatibility; that remains a shipped-seam VE in `SUMMARY.md`.

## Validation

After successful implementation evidence is materialized, run:

```sh
node <delivery-workpack-execution-skill-directory>/scripts/validate-delivery-evidence.mjs \
  --workpack <delivery-workpack-directory>/WORKPACK.md \
  --repository <target-implementation-repository>
```

For a workpack with `UI/UX Delivery Coverage`, the validator also requires the summary's `UI/UX Delivery Review` to cover exactly the workpack's journeys with their mapped VEs, a retained screenshot image for each implemented UI/UX VE (recognized by file extension, not content), and a recorded human acceptance when the review mode requires one. It establishes structural coverage and evidence presence only; it cannot judge visual fidelity or authenticate recorded observations.

Resolve every failure before claiming completion. This validator is for implementation execution. Do not run it to manufacture a new summary for a no-implementation-impact synchronization or a receipt-only publication/install event.

## Exact Workpack Content And Refreshes

The handoff snapshot binds the normalized handoff, not the workpack's AC/VE procedures or scope text. `Executed workpack content` binds the exact workpack bytes at start; `Executed snapshot` retains the approved handoff identity. The start helper reruns the active planning validator, refuses overwrite or an unresolved interrupted execution, and stores both identities and `Execution started` in SUMMARY.md. Check them on resume, before phases, and at completion. The completion validator compares them with the workpack and report, in addition to its existing exact AC/VE coverage and PASS checks. These checks validate recorded facts and their association; they do not authenticate command output or prove that an agent executed a claimed procedure.

Historical evidence without the new fields is preserved and fails exact-content verification, rather than being silently upgraded. Never compute a current hash and insert it into an old successful record as supposed historical proof. See [legacy-lineage-recovery.md](legacy-lineage-recovery.md) if a genuine association cannot be recovered.

For an ID-only documentation refresh, retain the original summary and exact original workpack in recoverable history, leave its executed-basis fields unchanged, update the current IDs in README/report, and add a concrete `**Refresh classification:** No implementation impact — <reason>` in the report. Validate with:

```sh
node <execution-skill-directory>/scripts/validate-delivery-evidence.mjs \
  --workpack <current-WORKPACK.md> --repository <repository> \
  --basis-workpack <original-exact-WORKPACK.md-from-recoverable-history> \
  --planning-skill <active-planning-skill-directory> \
  --software-design-skill <active-software-design-skill-directory>
```

This mode checks current readiness and requires identical workpack content except propagation of the handoff snapshot and snapshot-derived paths. It validates the old execution basis, not execution of the new ID. A broader truthful documentation-only change requires reviewed reconciliation of the complete difference; this narrow automated mode cannot certify its semantics. Such review does not require reimplementation or a no-op workpack, and must retain the executed identities and distinguish reconciled documentation from executed acceptance. Implementation-impacting changes always require real execution of the current delta workpack.
