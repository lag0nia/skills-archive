# Output Contract

## Contents

- [One Canonical File](#one-canonical-file)
- [Path Resolution](#path-resolution)
- [Required Sections](#required-sections)
- [Conclusion Values](#conclusion-values)
- [Section Contracts](#section-contracts)
- [Reruns and Lineage](#reruns-and-lineage)
- [Temporary Receipts](#temporary-receipts)

## One Canonical File

Write exactly one user-facing Markdown report per audit from [../assets/bug-audit-template.md](../assets/bug-audit-template.md).

Do not create separate coverage, candidate, summary, finding, review, or handoff files. The report is the only canonical audit truth.

## Path Resolution

Resolve the output in this order:

1. Exact user-provided output file.
2. User-provided audit directory.
3. `bug-audits/` under the nearest clear writable target root.
4. Ask for a destination when no safe writable target root exists.

Default filename:

```text
<yyyy-mm-dd>-<target-slug>-<mode>.md
```

Use lowercase `kebab-case` for the target slug. If the path exists, append a collision-free numeric suffix such as `-2`. Do not overwrite a prior audit unless the user explicitly requests an update or rerun of that exact report.

The report may live inside the target workspace, but no other audited artifact may change.

## Required Sections

Use this exact order:

1. `# Bug Audit`
2. `## Audit Metadata`
3. `## Scope`
4. `## Audit Basis`
5. `## Conclusion`
6. `## Coverage`
7. `## Confirmed Findings`
8. `## Unconfirmed Concerns`
9. `## Rejected Candidates`
10. `## Remaining Search Space`
11. `## Recommended Handoff`

Do not omit empty sections. Use `None.` when no entries exist.

## Conclusion Values

Use exactly one:

- `FOCUSED_SCAN`: low mode completed its bounded scan and confirmation.
- `COVERED`: medium mode gave every declared and required adjacent surface an explicit closed result.
- `PARTIALLY_COVERED`: meaningful declared, adjacent, sibling, family, matrix, or verification space remains open.
- `EXHAUSTED`: high mode completed every required stage and closed plausible remaining search space.
- `BLOCKED_BY_ENVIRONMENT`: required isolation, source access, or verification could not run responsibly.

Never use `EXHAUSTED` outside high mode. Never use `COVERED` in low mode. A conclusion describes coverage, not absence of defects.

## Section Contracts

### Audit Metadata

Record:

- Audit ID
- Target
- Target kind
- Intensity
- Date
- Audit status
- Output path

### Scope

Record:

- user request summary;
- included files, artifacts, systems, or areas;
- excluded areas;
- accepted assumptions;
- justified boundary expansion.

### Audit Basis

Record:

- audit goal;
- target goal;
- authority order actually used;
- approved/current contracts;
- open decisions;
- future/deferred items;
- explicit exclusions;
- superseded sources;
- contradictory or unclear authority;
- user answers received during the audit.

This section is the defect oracle. Findings must cite a contract established here or explain the supported runtime contract and its evidence.

### Conclusion

Record the exact conclusion, why the audit stopped, coverage confidence, finding counts, and the most material limitation.

### Coverage

Record:

- surfaces inspected;
- selected lenses;
- scenarios, states, calculations, contracts, and dependencies checked;
- mode-required stage receipt summaries;
- areas deliberately not inspected;
- high-mode matrix or ledger status when applicable.

### Confirmed Findings

Use `None.` or one subsection per `F-xxx`. Follow [evidence-and-findings.md](evidence-and-findings.md) exactly.

### Unconfirmed Concerns

Record material `UNCONFIRMED_CONCERN`, unresolved `OPEN_DECISION`, and `INSUFFICIENT_EVIDENCE` outcomes. Include missing evidence or the exact user question that would resolve the verdict.

### Rejected Candidates

Record only material `REJECTED_NOT_A_BUG`, `INTENDED_BEHAVIOR`, or `OUT_OF_SCOPE` outcomes whose lineage helps the reader understand the audit. Omit trivial false starts.

### Remaining Search Space

Record:

- likely sibling space;
- plausible separate-family space;
- open state or contract cells;
- uninspected surfaces;
- environment and evidence limitations.

Use explicit empty values. Do not imply closure through silence.

### Recommended Handoff

Recommend an owner or downstream skill without starting it:

- code finding: adapt to `bug-fix-execute` only after user authorization;
- product-design finding: route to the owning decision or product artifact;
- plan finding: route to the owning design or planning stage;
- intent question: route to the product decision owner;
- no findings: state that no handoff is required.

## Reruns and Lineage

Create a new dated report by default. Update an existing report only when the user explicitly identifies it as the rerun target.

When updating:

- preserve the prior audit ID or record a new cycle under metadata;
- reuse finding IDs when corrective boundaries are unchanged;
- record predecessor, merge, split, and superseded lineage;
- refresh the full report so conclusion and remaining search space are current;
- never leave an older coverage claim current after audit-basis or target changes.

## Temporary Receipts

Prefer in-memory stage returns. When durable receipts are required, use:

```text
.find-bugs-runtime/<audit-id>/
```

Receipts are non-canonical. Prune them after successful finalization by default. If interrupted or blocked, retain only when useful for diagnosis or resumption and point to them explicitly. Never present receipts as the completed audit.

