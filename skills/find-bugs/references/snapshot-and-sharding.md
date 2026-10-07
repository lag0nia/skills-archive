# Snapshot Boundary and Sharded Execution

## Contents

- [Snapshot Boundary](#snapshot-boundary)
- [Shard Planning](#shard-planning)
- [Stage Routing](#stage-routing)
- [Failure and Coverage Rules](#failure-and-coverage-rules)

## Snapshot Boundary

For every repository or working-tree audit, freeze the resolved target before launching any stage. Do not rely on an agent deciding whether to snapshot.

1. Resolve the target path, declared scope, required adjacent dependencies, and exclusions.
2. Copy only that resolved boundary into a temporary read-only snapshot. Do not snapshot the whole repository when a narrower boundary is sufficient.
3. Record the audit ID, snapshot root, UTC cutoff, Git base/ref when available, complete relative-path manifest, per-file hashes, and a manifest digest.
4. Give every mapper, discovery, challenge, and confirmation stage the same snapshot root and digest. Stage agents must never read the live target path.
5. Compare the live target with the snapshot before finalization. Classify later edits as `POST_SNAPSHOT_DRIFT`; do not mix them into findings or silently widen the audit.
6. If snapshot creation, hashing, or final comparison fails, classify the audit as `BLOCKED_BY_ENVIRONMENT` and report the exact boundary failure.

Tell the user the snapshot cutoff before substantive work. If the user wants later edits included, finish or stop the current cycle and start a fresh audit from a new snapshot.

## Shard Planning

After the snapshot and Audit Basis are complete, the controller creates a deterministic shard map. Shard by cohesive contract family and dependency closure, not by arbitrary file order.

Each shard records:

- `shard_id` and audit ID;
- snapshot-relative source paths;
- contract family and selected lenses;
- required adjacent paths and why they are included;
- upstream/downstream shard dependencies;
- estimated effort and expected receipt size; and
- explicit out-of-shard surfaces.

Use roughly 10–25 related files per shard as a planning target. Split a larger family at a real contract boundary and include small overlapping boundary files only when needed to judge a cross-shard contract. Never create one monolithic shard for a package that can be partitioned. A small target may remain one shard.

The controller owns the shard map. Stage agents must not silently re-scope a shard, read the live tree, or replace a missing sibling with an assumed equivalent. If a shard needs more context, request the exact snapshot-relative dependency and record the boundary expansion.

## Stage Routing

The orchestrator runs independent shard work in parallel where the environment supports it:

1. The controller performs deterministic inventory and creates the shard map. If inventory itself needs agent reasoning, use bounded mapper shards rather than one full-target mapper.
2. A fresh discovery agent audits each shard using only its shard packet and the named snapshot paths.
3. The controller compacts shard receipts and normalizes candidates by corrective family.
4. A fresh cross-shard challenge agent receives the shard map and normalized candidates, then checks missed siblings, dependency edges, boundary contracts, and contradictions spanning shards.
5. A fresh confirmation agent reviews the merged candidate set and cited snapshot evidence.
6. The controller writes one canonical report with per-shard coverage and the snapshot metadata.

Every shard receives one launch acknowledgement through the stage-health protocol. No recurring heartbeat, post-handshake timer, or watchdog is applied. Keep shards cohesive and split oversized contract families for reasoning quality, not to satisfy a timeout. Do not wait serially for one shard before launching or polling unrelated shards. A shard receipt is not a canonical report and cannot allocate final finding IDs.

## Failure and Coverage Rules

A blocked shard must not hold unrelated sibling shards hostage. Stop and close the failed shard promptly, continue already-running independent shards when safe, and preserve the failed shard's stage-health evidence. Do not automatically retry or replace it. If a shard is too broad to complete, split that contract family into smaller shards before requesting another audit.

Do not run cross-shard challenge or confirmation as if the audit were complete when a required discovery shard has no valid receipt. Completed shard work may be retained as coverage evidence, but the final audit must be `BLOCKED_BY_ENVIRONMENT` or otherwise explicitly partial, with no promoted finding that depends on unreviewed shard space. Report the failed shard, stages not run or reduced, completed shard coverage, and remaining search space.

All final claims are about the frozen snapshot. A clean live-tree comparison does not turn an incomplete shard run into a completed audit, and a zero-finding blocked run is never a clean bill of health.
