---
type: system-interface
id: IFACE-001
name: Interface name
producers: "SR-001"
consumers: "SR-002"
flows: "FLOW-001"
related_contracts: "STATE-001, INV-001"
---

# IFACE-001 — Interface Name

## Boundary

State the exact producer/consumer or external-domain boundary.

## Payload Or Artifact

State what crosses the boundary, its identity binding, provenance, and protected fields.

## Material Interactions

Create one `### ACT-NNN — <name>` entry for every independently invoked or observed material interaction at this boundary. The stable reference is `IFACE-xxx.ACT-NNN`. Do not enumerate private helper calls or cosmetic UI actions. If this is a passive one-artifact boundary with no separately invocable or observable interaction, replace the example with `**Material interactions:** \`None.\` — <concrete reason>`.

<a id="act-001"></a>
### ACT-001 — Interaction name

**Kind:** `callable` / `state-observation` / `event-or-message` / `artifact-transfer` / `manual-handoff` / `external-system`

**Trigger or entry:** State the exact invocation, observation trigger, publication event, transfer point, or human action.

**Input:** State the request, selector, prior state, artifact, or `None.` with a concrete reason.

**Output or observable result:** State the returned value, projection, event, acknowledgement, artifact, or visible state change.

**Access or authority:** State who may perform or observe it and the authoritative identity or permission check.

**Failure and recovery:** Distinguish material rejection, not-found/empty, forbidden, stale, unavailable, timeout, retry, and recovery meanings that apply.

**Risk:** `ordinary` / `high`

**Verification intent:** State the consumer-observable positive and failure behavior. For `high`, also name the rejection/denial and failure/recovery cases that Stage 9 must bind to a verification matrix.

## Preconditions And Validation

- State required checks and authoritative inputs.

## Failure Meaning

State rejection, retry, timeout, ambiguity, and recovery behavior.

## Must Not Imply

- State conclusions or authority this crossing never grants.
