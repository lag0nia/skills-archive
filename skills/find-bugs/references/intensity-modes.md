# Intensity Modes

## Contents

- [Invariant Quality Bar](#invariant-quality-bar)
- [Low: Focused Scan](#low-focused-scan)
- [Medium: Structured Audit](#medium-structured-audit)
- [High: Exhaustive Audit](#high-exhaustive-audit)
- [Mode Changes and Downgrades](#mode-changes-and-downgrades)

## Invariant Quality Bar

Use `medium` when the user does not name a mode.

Every repository audit uses one mandatory frozen snapshot and a deterministic shard map before stage agents launch. A small target may remain one shard; a large mixed target must be partitioned by cohesive contract family and dependency closure. See [snapshot-and-sharding.md](snapshot-and-sharding.md).

Each stage publishes one `RUNNING` launch acknowledgement only; no recurring heartbeat or post-handshake timer is required. If a shard is too broad to complete, split it at a real contract boundary before requesting another audit.

Intensity controls:

- scope inventory depth;
- number and independence of passes;
- breadth of sibling and separate-family search;
- verification effort;
- coverage-ledger detail; and
- allowed stopping claims.

Intensity never controls evidence quality, severity, confidence, or the promotion threshold. A low-mode finding must meet the same finding standard as a high-mode finding.

## Low: Focused Scan

Use for quick signal from a narrow, explicit boundary.

Required flow:

1. Controller freezes a narrow snapshot and builds a scope packet, compact Audit Basis, and one-shard plan.
2. One fresh discovery agent scans the shard with the dominant applicable lenses.
3. One fresh confirmation agent reviews only surfaced candidates and their cited snapshot evidence.
4. Controller finalizes the report and records snapshot drift.

Discovery obligations:

- Start from the exact user-provided boundary.
- Inspect adjacent sources only when needed to resolve intent or validate a candidate.
- Record which obvious neighboring surfaces were not inspected.
- Do not perform broad inventory merely because the target belongs to a large system.

Conclusion:

- Use `FOCUSED_SCAN` on normal completion.
- Use `BLOCKED_BY_ENVIRONMENT` when the required discovery or confirmation isolation cannot run.
- Never use `COVERED` or `EXHAUSTED`.

## Medium: Structured Audit

Use as the default for an end-to-end audit of a bounded declared scope.

Required flow:

1. Controller freezes the target, builds the scope inventory/Audit Basis, and creates a deterministic shard map.
2. One fresh discovery agent audits each shard once or marks that shard open.
3. One fresh cross-shard challenge agent attacks missed siblings, separate families, state asymmetries, cross-artifact gaps, and over-broad claims.
4. One fresh confirmation agent confirms or rejects the merged candidates.
5. Controller finalizes the report with per-shard coverage and snapshot drift.

Mapper and shard-map obligations:

- Inventory authoritative sources, contracts, states, dependencies, and applicable lenses.
- Identify source precedence, open decisions, exclusions, and superseded artifacts.
- Define the minimum adjacent context required to judge each shard and the cross-shard boundary.
- Do not make one mapper agent responsible for an unbounded full-package inventory.

Discovery and challenge obligations:

- Give every declared surface an explicit coverage result.
- Inspect required adjacent dependencies when a contract or failure path crosses the boundary.
- Challenge both candidate reality and the completeness of mapped coverage.
- Preserve open areas rather than implying closure.

Conclusion:

- Use `COVERED` only when every declared surface has an explicit result and no required adjacent surface remains open.
- Use `PARTIALLY_COVERED` when meaningful declared or required adjacent space remains open.
- Use `BLOCKED_BY_ENVIRONMENT` when required isolation or evidence access prevents a responsible audit.
- Never use `EXHAUSTED`.

## High: Exhaustive Audit

Use for maximum defensible coverage of a clearly bounded target.

Required flow:

1. Controller freezes the target and creates a complete declared-scope inventory, Audit Basis, state/contract axes, and shard map.
2. Fresh cold discovery Pass A audits the neutral shards without prior findings.
3. Fresh cold discovery Pass B receives the same neutral shard packets and remains blind to Pass A.
4. Controller merges and differentiates candidates without doing new discovery.
5. One fresh cross-shard challenge agent receives only the shard map and merged packet and attacks sibling depth, separate-family breadth, open matrix cells, contradictions, false assurances, and stopping claims.
6. One fresh adjudication agent runs only when challenge reports a material disagreement.
7. One fresh confirmation agent reviews the final candidate set and supporting snapshot evidence.
8. Controller performs deterministic finalization.

High-mode obligations:

- Keep Pass A and Pass B mechanically blind.
- Record all relevant state, authority, contract, timing, failure, and lifecycle axes.
- Close or list every relevant matrix cell.
- Search beyond the first candidate for siblings sharing its corrective boundary.
- Search adjacent plausible families without merging by symptom alone.
- Challenge whether claimed verification proves the stated contract.
- Include an explicit coverage ledger in the report.

Conclusion:

- Use `EXHAUSTED` only when plausible sibling space, separate-family space, relevant matrix cells, and required verification are closed.
- Use `PARTIALLY_COVERED` whenever any meaningful search space remains.
- Use `BLOCKED_BY_ENVIRONMENT` when required isolation, execution, or source access prevents completion.
- Never manufacture findings to justify high-mode effort.

## Mode Changes and Downgrades

- Never silently downgrade a requested mode.
- If the target is too broad for high mode, ask the user to narrow it or accept explicit partial coverage.
- If required fresh agents are unavailable, explain the missing guarantee and ask whether to use a lower mode only when that lower mode can genuinely run.
- When the user changes mode after work begins, rebuild the remaining stage plan. Do not relabel earlier work as if it satisfied the new mode.
