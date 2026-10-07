# Stage Packets and Fresh-Agent Isolation

## Contents

- [Isolation Contract](#isolation-contract)
- [Base Scope Packet](#base-scope-packet)
- [Stage Receipts](#stage-receipts)
- [User Decisions](#user-decisions)
- [Per-Stage Inputs](#per-stage-inputs)
- [Controller Integration](#controller-integration)

## Isolation Contract

Use a different fresh agent or isolated session for every stage required by the selected mode.

- Disable surrounding-context inheritance with the environment's supported control.
- Pass only the stage packet, target paths, required references, and explicitly allowed upstream receipts.
- State in every packet that this skill's references are the complete contract for the stage.
- Do not invoke or read `bug-finder-general`, `bug-confirmation-review`, `pre-execution-bug-risk-audit`, or another workflow-specific discovery, promotion, or audit skill; those contracts own different artifact systems.
- Do not reuse agent IDs or continue a completed stage with follow-up input.
- Keep cold passes blind to each other.
- Do not let mapping or discovery agents write the canonical report.
- Never reuse a stage agent. After collecting its receipt, terminate or release it when the environment supports that operation; otherwise leave it inactive and never address it again.

If the environment cannot provide the required isolation, stop with `BLOCKED_BY_ENVIRONMENT` or ask the user whether to use a genuinely runnable lower mode.

## Base Scope Packet

Build the base packet before discovery. Include:

```json
{
  "audit_id": "audit-...",
  "mode": "low|medium|high",
  "audit_goal": "...",
  "target_paths": ["..."],
  "declared_scope": ["..."],
  "explicit_exclusions": ["..."],
  "target_kind": ["CODE_RUNTIME"],
  "audit_basis": {
    "target_goal": "...",
    "authority_order": ["..."],
    "approved_contracts": ["..."],
    "open_decisions": ["..."],
    "future_deferred": ["..."],
    "superseded_sources": ["..."],
    "authority_conflicts": ["..."]
  },
  "selected_lenses": ["..."],
  "adjacent_inspection_rule": "Inspect only when needed to resolve intent or validate the declared scope.",
  "read_only_boundary": true,
  "snapshot": {
    "root": "<temporary-read-only-snapshot>",
    "cutoff_utc": "<snapshot-cutoff>",
    "manifest_digest": "<manifest-sha256>"
  },
  "shard": {
    "shard_id": "shard-001",
    "paths": ["<snapshot-relative-path>"],
    "required_adjacent_paths": [],
    "contract_family": "...",
    "dependencies": []
  },
  "health": {
    "stage_health_destination": ".find-bugs-runtime/<audit-id>/<stage>/stage-health.json",
    "closed_destination": ".find-bugs-runtime/<audit-id>/<stage>/stage-health.json.closed.json",
    "run_token": "returned by scripts/stage-health.mjs init"
  },
  "receipt_destination": "agent return or temporary path"
}
```

Cold Pass A and Pass B must receive the same neutral packet. Do not include prior findings, candidate labels, family conclusions, or coverage claims.

## Stage Receipts

Every stage returns a structured receipt with:

- audit ID, mode, stage, shard ID when applicable, snapshot digest, and status;
- sources inspected;
- work completed;
- candidate or challenge records when applicable;
- coverage and remaining-search-space records;
- environment limitations;
- user decisions needed; and
- a concise stage summary.

Every active stage also publishes one launch acknowledgement outside the canonical report using `scripts/stage-health.mjs`. The controller initializes the file before launch; that initialization must use the actual current UTC time and status `STARTING`, never a placeholder timestamp. The stage's first action changes it to `RUNNING` with the returned `run_token`. No recurring heartbeat is required or allowed. The stage-health packet must identify the shard when the stage is shard-scoped.

Use these command shapes, with paths resolved from the skill root:

```bash
node <skill-root>/scripts/stage-health.mjs init \
  --path <stage_health_destination> --audit-id <audit_id> --stage <stage>
node <skill-root>/scripts/stage-health.mjs update \
  --path <stage_health_destination> --run-token <run_token> --status RUNNING \
  --checkpoint <checkpoint> --next-action <next_action>
node <skill-root>/scripts/stage-health.mjs check \
  --path <stage_health_destination>
node <skill-root>/scripts/stage-health.mjs close \
  --path <stage_health_destination> --run-token <run_token> --reason <reason>
```

The `check` command emits a JSON stage-health state and uses exit code `0` for `STARTING`, first-heartbeat-confirmed `RUNNING`, or `COMPLETED`, and `10` for `HEALTH_UNVERIFIABLE`. Treat the JSON state as authoritative and preserve the closed marker after a failure. The first `RUNNING` update confirms launch; no timing or watchdog state is applied.

```json
{
  "audit_id": "audit-...",
  "stage": "DISCOVERY",
  "run_token": "opaque-controller-issued-token",
  "status": "RUNNING",
  "started_at": "<controller-init-utc-timestamp>",
  "updated_at": "<current-utc-timestamp>",
  "last_completed_checkpoint": "ticket projection core inspected",
  "next_action": "inspect provider adapter partial-result handling"
}
```

If the stage-health record is missing or malformed, classify that stage or shard as `BLOCKED_BY_ENVIRONMENT` with health state `HEALTH_UNVERIFIABLE`. A valid `STARTING` record remains pending until the first `RUNNING` update. After that update, allow the stage to continue until it returns a receipt, explicitly blocks, or becomes unavailable. The closed marker is authoritative: ignore late stage-health writes and late stage messages after closure.

Put the complete structured receipt in the stage's final response. Do not refer to content “above,” hidden reasoning, tool output, or an earlier message as the receipt. Treat a final response that does not contain the receipt itself as invalid and rerun the stage fresh.

Keep receipts compact because later fresh agents also read the raw target sources:

- Point to exact paths plus headings, clauses, or line anchors instead of copying source prose.
- Include only contract truth and state axes that materially control discovery or confirmation.
- Do not narrate the inspection process when a structured field communicates the result.
- Keep a normal mapper, discovery, challenge, or confirmation receipt under roughly 2,000 words; use up to 3,000 only for high-mode maps whose additional state matrix is necessary.
- If more detail is necessary, put evidence in a temporary receipt attachment and pass only its path plus a concise index downstream.
- The controller must reject and compact an oversized receipt before using it as the next stage packet.

Allowed stage statuses:

- `COMPLETED`
- `NO_CANDIDATES`
- `USER_DECISION_NEEDED`
- `BLOCKED_BY_ENVIRONMENT`
- `INVALID_AUDIT_STATE`

Candidate records use stage-local IDs. Only the controller allocates final `F-xxx` IDs after confirmation.

Keep receipts non-canonical. Use in-memory agent returns when practical. When durable receipts are necessary, place them under `.find-bugs-runtime/<audit-id>/` and prune them after successful finalization by default.

## User Decisions

A stage returns `USER_DECISION_NEEDED` only when an unresolved answer changes:

- broad audit direction or scope;
- authoritative source selection;
- approved contract meaning;
- whether a candidate is a bug or intended behavior; or
- whether an adjacent boundary should be included.

Include:

```json
{
  "question_id": "Q-001",
  "unclear_point": "...",
  "evidence": ["path#section"],
  "current_read": "...",
  "why_it_changes_the_audit": "...",
  "question": "one precise user-facing question",
  "affected_candidates_or_surfaces": ["..."],
  "can_continue_elsewhere": true
}
```

The controller must:

1. Check whether authoritative artifacts already answer it.
2. Merge questions that share one root decision.
3. Ask no more than three material questions at once.
4. Explain what the answer changes.
5. Persist the answer in the Audit Basis.
6. Launch a fresh replacement stage for affected work.

Stage agents never ask the user directly. Do not ask generic questions such as “What counts as a bug?” Ask the concrete target-specific intent question.

## Per-Stage Inputs

### Mapper

Input: user request, target paths, explicit scope, mode, and relevant target-kind reference.

Output: a compact source inventory, goal/contract map, target kinds, selected lenses, state/contract axes, required adjacent context, and user decisions needed. Use this shape:

```json
{
  "source_inventory": [
    {"path": "...", "authority": "APPROVED_CURRENT", "role": "...", "anchors": ["#section"]}
  ],
  "audit_basis": {
    "target_goal": "...",
    "authority_order": ["path#anchor"],
    "approved_contracts": [
      {"contract": "one concise claim", "anchors": ["path#anchor"]}
    ],
    "open_decisions": [],
    "future_deferred": [],
    "explicit_exclusions": [],
    "superseded_sources": [],
    "authority_conflicts": []
  },
  "target_kinds": ["PRODUCT_SPEC_PLAN"],
  "selected_lenses": ["..."],
  "state_contract_axes": ["..."],
  "required_adjacent_context": [],
  "declared_surface_coverage": ["path: mapped"],
  "user_decisions_needed": []
}
```

Do not reproduce source paragraphs, explain every non-selected option, or write a standalone review essay. Do not discover or promote findings intentionally; note only mapping blockers.

### Discovery

Input: neutral scope packet and mapped target sources. In low mode the controller's compact map is sufficient.

Output: stage-local candidates, evidence, sibling leads, separate-family leads, coverage, and open questions. Do not allocate final finding IDs or write the report.

### Cold Discovery Passes

Input: identical neutral scope packets with no prior candidate context.

Output: independent candidate and coverage receipts. Never read the other pass.

### Challenge

Input: mapped scope plus a controller-produced merged candidate packet. Do not pass hidden raw reasoning unless needed as cited evidence.

Output: confirmed challenge, narrowed family, split needed, missing sibling, missed separate family, open matrix cell, false-assurance concern, over-broad stopping claim, or material disagreement. State whether adjudication is needed.

### Adjudication

Input: only the material disagreement, relevant evidence, and affected merged records.

Output: narrow decision, rationale, affected records, and final follow-up instruction. Do not restart full discovery.

### Confirmation

Input: candidate set, Audit Basis, cited sources/evidence, challenge outcomes, and applicable finding contract.

Output: one final candidate outcome per material candidate, with promotion rationale or non-promotion reason. Do not discover broadly or write canonical output.

## Controller Integration

The controller may:

- normalize duplicates and family boundaries;
- reconcile stage-local IDs;
- request a fresh challenge or adjudication;
- apply user answers to a new stage packet;
- allocate final IDs after confirmation;
- summarize receipts and write the report.

The controller must not:

- invent new unsupported findings during merge or finalization;
- turn an unconfirmed concern into a finding;
- hide disagreement or remaining search space;
- rewrite stage evidence to imply stronger verification; or
- claim a mode's completion status when its required stages did not run.
