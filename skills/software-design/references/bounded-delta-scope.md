# Bounded delta scope assessment

Use this assessment only when a handoff excludes an unchanged material action of a writable Build Unit. Unit ownership remains canonical; the bounded delta need not implement or prove every unrelated runtime path of that unit. Ordinary exclusions without a writable material binding retain the existing three-column disposition contract.

First trace the approved target through actual source and contracts. Identify target and changed actions, their direct and transitive data/control prerequisites, current profile/health guards, shared implementation branches, and affected public representations. A separate flow in the same service is not automatically an input. Conversely, an unchanged prerequisite is still required. Do not move current prerequisites to later gates, reclassify unavailable output as unrelated, or expand writable scope to obtain readiness.

For each excluded writable-bound action, keep the existing exact-action/canonical-unit exclusion row and its individual reason. In Allowed Delivery Slice add `**Target actions:**` and `**Changed actions:**`, listing exact backticked `IFACE-NNN.ACT-NNN` IDs. Target actions cannot be empty; Changed actions may be exactly `None.` for a delta that does not alter an interaction. These declarations must agree with the approved target outcome, actual planned behavior, tickets and scope evidence; reducing this list to evade closure is invalid.

Under Exclusions And Local Discretion add:

```markdown
**Bounded delta scope:** [Reviewed assessment](./bounded-delta-scope.json)

**Bounded delta scope integrity:** `sha256:<64 lowercase hex digits>`
```

The JSON assessment is a bounded evidence record, not a second source of behavior or an execution plan. Paths are relative to the JSON file. Pin the exact files reviewed using their SHA-256 bytes. The handoff pins the JSON itself so its existing snapshot also binds the assessment. Refresh the assessment only after reviewing changed source/evidence, then refresh the handoff snapshot. Do not generate new passing evidence by updating hashes alone.

```json
{
  "version": 1,
  "scopeEvidence": [{"path": "approved-delta.md", "sha256": "sha256:<digest>"}],
  "actions": [
    {
      "action": "IFACE-001.ACT-001",
      "requires": [],
      "evidence": [{"path": "../../../system-model/contracts/interfaces/iface-001-example.md", "sha256": "sha256:<digest>"}]
    },
    {
      "action": "IFACE-001.ACT-002",
      "requires": [],
      "evidence": [{"path": "../../../system-model/contracts/interfaces/iface-001-example.md", "sha256": "sha256:<digest>"}],
      "unchangedEvidence": [{"path": "source-and-dependency-review.md", "sha256": "sha256:<digest>"}]
    }
  ],
  "checks": [
    {
      "kind": "public-contract compatibility",
      "actions": ["IFACE-001.ACT-002"],
      "obligation": "PSEAM-001",
      "evidence": [{"path": "compatibility-review.md", "sha256": "sha256:<digest>"}]
    },
    {
      "kind": "shared-code regression",
      "actions": ["IFACE-001.ACT-002"],
      "obligation": "PSEAM-001",
      "evidence": [{"path": "shared-branch-review.md", "sha256": "sha256:<digest>"}]
    }
  ]
}
```

- `scopeEvidence` records the approved delta boundary and source-based impact review, not permission inferred from the exclusion itself.
- `actions` inventories each retained interaction, target/changed action, excluded writable-bound action and referenced prerequisite exactly once. All IDs must belong to the existing conservative selected-scope inventory. Unrelated exclusions without writable bindings need no additional node. `requires` lists its direct interaction prerequisites; use an empty array only after source review. Each node's evidence includes its exact canonical interface file and any implementation/verification sources needed to support those edges. Non-interaction prerequisites remain in the Required Input Ledger. Explicit ID and canonical-action references there still prohibit exclusion.
- Every excluded writable-bound action also has `unchangedEvidence` beyond its interface declaration. Link the actual reviewed implementation, tests or source-based assessment, including the relevant branches, why the target does not consume the output, affected surfaces and evidence limits. An unavailable path is not evidence of unrelatedness.
- The validator follows dependencies from all retained interactions as well as target and changed actions. No reached action may be excluded, whether its producer is writable, read-only or external. It rejects incomplete/duplicate/unknown inventory and missing/stale evidence.
- `checks` retains both public-contract compatibility and shared-code regression for each excluded writable-bound action. Group actions only when the same evidence genuinely covers them. Each check references an existing, non-excluded PSEAM and pins evidence linked from that PSEAM. Removal of the check, seam or evidence fails. Where no public surface/shared code is affected, retain the source-based no-impact review and its limits; this does not demand executing unrelated end-to-end behavior. Otherwise retain focused compatibility probes and shared-branch regression with their actual results and final proof owner. A planned delta may use the existing candidate/planned-proof rules; hashes do not turn planned checks into PASS.

Review evidence semantically: mechanically valid JSON, hashes and links prove identity and declared closure, not that source behavior was honestly classified or that a dependency was not omitted from the assessment. Trace the approved contracts and actual implementation before accepting the declarations. Preserve current availability/writable-producer rules, known consumers of retained interactions, all VO assignments, physical compatibility, external authority and lifecycle checks. This assessment grants no new write permission or gate deferral.

Delivery Planning preserves the exact excluded-output set and the retained PSEAM compatibility/regression obligations in acceptance criteria and verification. Runtime exclusion must never erase the shared-code or public-contract safety work.
