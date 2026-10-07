---
name: find-bugs
description: Discover and independently confirm real defects in a bounded target without implementing fixes. Use for low-, medium-, or high-intensity bug audits of code, APIs, services, product-design packages, specifications, plans, procedures, configuration, infrastructure descriptions, or mixed artifact-and-implementation scopes, especially when the agent must distinguish bugs from intended behavior, open decisions, explicit exclusions, or unsupported speculation and produce one canonical Markdown audit report.
---

# Find Bugs

Run a discovery-only audit through a controller and fresh stage agents. Establish the target's current intent before judging defects, keep the finding threshold constant across modes, and write one canonical report.

## Hard Boundary

- Discover, challenge, and confirm defects.
- Do not implement fixes, modify audited source artifacts, create fix attempts, or verify attempted fixes.
- Do not automatically start a downstream workflow.
- Do not invoke or import `bug-finder-general`, `bug-confirmation-review`, `pre-execution-bug-risk-audit`, or other workflow-specific discovery/promotion skills inside this audit; this skill's references are the complete stage contract.
- Treat the target as read-only except for the explicitly resolved audit-report path.
- Permit temporary reproduction artifacts only in a temporary boundary; remove them before finalization.

If the request includes implementation, finish discovery and hand off only after the user separately authorizes fixing.

## Load the Contracts

Before substantive work, read:

- [intensity-modes.md](references/intensity-modes.md) for mode-specific stages and stopping claims.
- [evidence-and-findings.md](references/evidence-and-findings.md) for candidate, confidence, severity, family, and promotion rules.
- [stage-packets.md](references/stage-packets.md) for fresh-agent isolation, receipts, and user-decision routing.
- [output-contract.md](references/output-contract.md) for the single-file report contract and output-path rules.
- [scripts/stage-health.mjs](scripts/stage-health.mjs) for deterministic stage initialization, first-heartbeat confirmation, and closure.
- [snapshot-and-sharding.md](references/snapshot-and-sharding.md) for mandatory snapshot boundaries, shard maps, and orchestrator routing.

After initially classifying the target, read the relevant portions of [target-kinds-and-lenses.md](references/target-kinds-and-lenses.md). Read multiple target sections for a mixed audit.

## Controller Flow

Act as the controller, not as a substitute discovery or confirmation agent.

1. Resolve the target, declared scope, intensity, and output destination.
2. Default intensity to `medium` when omitted and tell the user which mode is active.
3. Read [snapshot-and-sharding.md](references/snapshot-and-sharding.md), freeze the resolved target, and record the manifest, hashes, cutoff, and snapshot digest before substantive work.
4. Establish a neutral scope packet, explicit Audit Basis, and deterministic shard map against that snapshot.
5. Ask the user only when material uncertainty changes the audit direction, authoritative contract, or bug-versus-intended classification.
6. Launch the fresh stages required by the mode, routing bounded shard work through the orchestrator.
7. Compact and normalize stage receipts before passing them downstream; use source anchors rather than duplicated source prose.
8. Normalize duplicate candidates into the smallest defensible corrective families.
9. Route material disagreements to fresh cross-shard challenge, confirmation, or adjudication as required.
10. Allocate report-local finding IDs only after confirmation.
11. Compare live state with the snapshot and record post-snapshot drift.
12. Render one canonical report from [bug-audit-template.md](assets/bug-audit-template.md).
13. Stop after reporting and recommend, but do not execute, any handoff.

The controller owns scope, packets, stage sequencing, family normalization, finding-ID allocation, conclusion selection, report naming, and final writing. Fresh agents own mapping, discovery, challenge, confirmation, and conditional adjudication.

## Stage Health And Fail-Fast

Do not infer stage health from an agent API status of `running`. Use the bundled `scripts/stage-health.mjs` rather than hand-writing stage-health JSON. Resolve the script relative to this skill's directory.

Before launching a stage:

1. Create a temporary runtime directory under `.find-bugs-runtime/<audit-id>/<stage>/` or use the environment's equivalent.
2. Run `node <skill-root>/scripts/stage-health.mjs init ...` and record the returned `run_token`. The initializer writes a real current UTC timestamp and `STARTING`; never use a sentinel timestamp such as `00:00Z`.
3. Put the stage-health path, closed-marker path, and `run_token` in the stage packet.
4. Require the stage's first operation to be exactly one `stage-health.mjs update` with `RUNNING`. This is a launch acknowledgement, not a progress channel. Do not request or emit recurring heartbeat updates; the helper rejects them.

Before the first `RUNNING` acknowledgement, keep the stage in `STARTING`; do not convert elapsed time into a startup failure. After the first valid `RUNNING` acknowledgement, do not apply a time limit, poll interval, freshness check, or watchdog. Allow the stage to continue until it returns its complete receipt, explicitly blocks, or becomes unavailable. A wait timeout or an empty polling response is not a terminal condition.

A missing or malformed stage-health record remains `HEALTH_UNVERIFIABLE`; a valid `STARTING` record remains pending indefinitely until the first `RUNNING` acknowledgement.

Treat controller observations conservatively:

- A `wait_agent`/wait call that returns `timed_out`, an empty status, or no new receipt means only that no new observation was received. Leave the stage active and wait again; do not classify it as blocked, failed, unavailable, or `HEALTH_UNVERIFIABLE`.
- When a fresh stage-health read says `RUNNING`, that evidence remains valid even if the agent-management endpoint has not produced a new receipt. Do not override it with a polling timeout.
- Do not call `close_agent`, release, or an equivalent operation on a required stage merely because a wait timed out. A close/release result whose `previous_status` is `running` or `pending_init` proves that the controller closed a live stage; it is not evidence of an environment block.
- Treat a stage as unavailable only when the environment explicitly reports a terminal management failure (for example `not_found`, `errored`, or externally `shutdown`/`interrupted`) and no complete receipt is available, or when the stage itself explicitly returns `BLOCKED_BY_ENVIRONMENT`. If the controller closes a live stage by mistake, mark the audit state as controller-aborted/invalid, discard any environment-block label, and rerun or report the controller error; never render it as `BLOCKED_BY_ENVIRONMENT`.

If a required stage returns a complete receipt, continue normally. If it explicitly returns `BLOCKED_BY_ENVIRONMENT`, the environment explicitly reports it unavailable under the rule above, or its stage-health record is missing or malformed on a fresh read, immediately:

- classify the audit as `BLOCKED_BY_ENVIRONMENT`;
- stop the audit and do not launch downstream stages;
- run `stage-health.mjs close ...` with the `run_token`, then close or release the agent when the environment supports it;
- do not automatically retry or replace the stage;
- write the canonical report with the health evidence, failed stage, stages not run, collected evidence, and remaining search space; and
- tell the user whether the stage was explicitly blocked, unavailable, or health-unverifiable.

The closed marker is authoritative. After an authorized terminal closure, ignore every later stage-health write or agent message from that stage; a late write must not revive it. A replacement shard or lower intensity is allowed only after the user explicitly approves it. An unverifiable shard is an environment limitation, not evidence of a defect and never authorizes promoting a candidate.

## Establish the Audit Basis

Never use a generic idea of correctness. Build a target-specific correctness contract before discovery.

Resolve authority in this order:

1. Explicit user instructions for this audit.
2. Canonical approved target artifacts.
3. Acceptance criteria, invariants, schemas, public contracts, and tests.
4. Current supported behavior demonstrated by callers and integrations.
5. Local conventions only when no stronger source exists.

Classify material intent as:

- `APPROVED_CURRENT`
- `OPEN_DECISION`
- `FUTURE_DEFERRED`
- `EXPLICITLY_EXCLUDED`
- `SUPERSEDED`
- `CONTRADICTORY_OR_UNCLEAR`

Record the target goal, authoritative sources, approved contracts, open decisions, exclusions, superseded sources, and unresolved authority conflicts in `## Audit Basis`.

Do not promote a candidate unless an approved or supported contract exists. Missing optional detail, future work, open intent, and explicit exclusions are not bugs.

## Ask the User When Intent Controls the Verdict

Stage agents never question the user directly. They return `USER_DECISION_NEEDED` with evidence and the smallest exact question. The controller:

- first checks whether repository or target artifacts already answer it;
- groups questions by one root decision;
- asks no more than three concise material questions at a time;
- explains what each answer changes;
- records the answer in the Audit Basis;
- launches a fresh replacement stage for the affected work instead of continuing the old agent.

Ask before broad discovery when the ambiguity affects the whole audit direction. Continue stable areas when ambiguity affects only one candidate, then ask before promotion. If the user declines or cannot answer, preserve the item under `Unconfirmed Concerns`; never guess.

## Preserve Isolation

- Freeze the target once before launching stages and pass the same snapshot root and digest to every stage.
- Use a new agent or isolated session for every stage designated fresh by the selected mode.
- Disable conversation-context inheritance (`fork_context: false`, `fork_turns: "none"`, or the environment's equivalent).
- Pass artifact paths and stage packets, not the full conversation.
- Instruct stage agents to use only this skill's named references; do not let implicit skill triggering substitute a workpack-specific contract.
- Never reuse an agent ID across stages or reruns.
- Keep independent cold passes mutually blind.
- Never reuse a stage agent. After integrating its complete receipt or an explicitly terminal result, terminate or release it when the environment supports that operation; otherwise leave it inactive and never address it again. Do not terminate or release a stage that is still `running` or `pending_init` merely to make polling convenient.
- Run independent shards in parallel where possible; do not make unrelated shards wait on a single monolithic mapper or discovery agent.
- If required freshness is unavailable, use `BLOCKED_BY_ENVIRONMENT` or ask the user to approve a lower mode; do not simulate independence.

## Keep the Finding Bar Stable

Mode changes breadth, independent repetition, verification effort, and stopping rules only. It never changes what counts as a confirmed finding.

A confirmed finding needs:

- an approved or supported contract;
- a concrete violation;
- a reproducible, calculable, traceable, or logically demonstrated failure scenario;
- meaningful impact;
- sufficient evidence;
- the smallest defensible corrective boundary; and
- an explanation of why the issue is not intended, open, excluded, superseded, or merely preferred.

Zero confirmed findings is a valid result.

## Write One Canonical Report

Write exactly one user-facing Markdown report per audit. Do not create separate coverage, candidate, summary, or finding documents.

Resolve the output path using [output-contract.md](references/output-contract.md). Use temporary receipts only when necessary for orchestration or interruption recovery. Temporary receipts are not canonical audit artifacts and must not be presented as completion.

At completion, state:

- target and mode;
- report path;
- audit conclusion;
- confirmed-finding count;
- material limitations or remaining search space; and
- recommended next owner or skill, without starting it.
