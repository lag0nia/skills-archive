# Delivery Evidence Contract

Every new or refreshed implementation workpack must plan one repository-relative evidence destination derived from its exact Software Design snapshot:

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

Use `sha256-<digest>` for the directory name, replacing the Snapshot ID's colon with a hyphen while preserving all 64 lowercase hexadecimal characters. AC and VE identifiers remain workpack-local. The execution summary qualifies them through this snapshot-scoped path; do not continue a repository-global VE number sequence or plan one Markdown file per VE.

## Workpack Projection

Add one `Delivery Evidence Contract` section with:

- `Evidence root`: exactly `delivery-evidence/`;
- `Execution summary`: exactly `delivery-evidence/executions/sha256-<digest>/SUMMARY.md`;
- `Raw artifacts`: the sibling `artifacts/` directory, explicitly optional and limited to retained machine output that materially supports a VE;
- `Publication receipts`: `None.` or exact planned JSON paths under `delivery-evidence/receipts/publications/`;
- `Consumer-install receipts`: `None.` or exact planned JSON paths under `delivery-evidence/receipts/consumers/`;
- `Compatibility evidence`: the VE records that exercise the actual shipped consumer seam, with an explicit statement that publication or installation receipts do not establish behavioral compatibility; and
- `Historical evidence`: preserve existing evidence and links without silently rewriting or migrating them.

The workpack plans paths only. Delivery Planning must not create or update evidence in the implementation repository.

## Evidence Roles

- `README.md` is the compact index of the latest implemented snapshot, latest execution summary, execution history, receipts, and open later-lifecycle gates. It must not call a newer unexecuted workpack implemented or stable.
- `IMPLEMENTATION-DELIVERY-REPORT.md` is the current high-level implementation receipt. It names the latest implemented snapshot and links the execution summary that supports the implementation.
- `executions/<snapshot>/SUMMARY.md` records every workpack AC and VE exactly once, including the observed result. It is the normal human-readable execution record.
- For a workpack with `UI/UX Delivery Coverage`, `SUMMARY.md` also records one `UI/UX Delivery Review` section: the build or revision reviewed, viewports and states, review mode, per-journey results against the mapped VEs, and deviations or limitations. Implemented-UI VEs link representative screenshots under `artifacts/`.
- `artifacts/` is optional. Use it only for retained logs, JUnit or coverage output, traces, screenshots, API responses, checksums, or similar machine output that materially supports a VE. Do not preserve secrets, credentials, caches, full dependency trees, or redundant giant logs.
- `receipts/publications/` proves that an exact immutable producer artifact exists at an exact source revision, location, resolution, and integrity.
- `receipts/consumers/` proves that a named consumer resolved and installed the exact artifact and integrity.

A publication receipt does not prove consumer access. A consumer-install receipt does not prove behavioral compatibility. Compatibility remains a VE through the shipped seam.

## Completion Boundary

An implementation execution creates the snapshot-scoped summary only after all required VEs pass. If execution stops, do not create a completed summary, advance the implementation report, or present planned evidence as observed.

The existing validated `No implementation impact` synchronization remains an exception: it does not fabricate an execution directory or another VE record. It may synchronize the handoff, stable workpack, README, and implementation report IDs while retaining the prior execution summary as the physical implementation basis.

## Execution Association

Plan the existing summary to capture `Executed snapshot`, `Executed workpack content` (exact workpack-byte SHA-256), and `Execution started` before implementation, retaining those identities in completion evidence and the report. The handoff Snapshot ID alone does not identify later workpack edits. Execution checks the captured identity before phases, on resume, and before completion; changed workpack content requires reconciliation and recoverable prior history, never silently replacing the start digest. Do not prefill these execution observations during planning. Historical summaries without that association remain historical claims, not verified execution of a newly edited workpack. Use [legacy-lineage-recovery.md](legacy-lineage-recovery.md) only with explicit consumer-project authorization.
