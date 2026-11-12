# Mechanism Trace And Registers

This reference defines the mechanism trace and its registers. Intake captures them into the brief; each stage checkpoint re-checks them ([Checkpoint Rule](checkpoint-workflow.md#checkpoint-rule)); [Mechanism Preservation](core-design-audits.md#mechanism-preservation) keeps their truth intact in the package.

## When They Apply

Capture them when the source has ordered behavior, state transitions, cross-system handoffs, credentials, tokens, secrets, contracts, queues, jobs, ledgers, devices, sessions, workflows, or protocol steps. Use only the registers that apply; a system with none of these carries none.

## Definitions

- **Mechanism trace**: one per mechanism, with a stable `M-xxx` ID; ordered steps naming the actor, domain or system, action, inputs, outputs or revealed artifact, what the step enables, the state before and after, and what it must not imply.
- **Stateful Object Register**: records, files, queues, jobs, sessions, devices, accounts, reservations, deployments, or other objects whose state matters across steps, with who changes each, its important states, owner, consumers, and what it must not be confused with.
- **Credential / Token / Secret Register**: keys, tokens, signatures, capabilities, invitations, certificates, passwords, or other artifacts that prove, authorize, unlock, or reveal something, with the holder or issuer, where each is used, what it proves and enables, and what it must not do.
- **External Domain Register**: services, APIs, vendors, devices, ledgers, browsers, payment rails, databases, or execution environments that impose boundaries or finality assumptions, with the facts each owns and does not own.
- **Cross-System Coupling Register**: facts in one system that enable, trigger, authorize, or inform actions in another, with the handoff status and what the coupling must not imply.

Invariants that span boundaries, states, flows, or handoffs go in the brief's `Cross-Component Constraints And Invariants` section, not a separate register. The [brief template](../assets/templates/software-brief.md) gives each register its table.

The registers are source-truth scaffolding, not boundaries: they keep later stages from collapsing distinct states, confusing credentials, skipping activation conditions, or implying unresolved automatic handoffs. Use plain names ([Plain Language And Notation](brief-intake-review.md#plain-language-and-notation)).

## Capturing Them

Capture the trace and registers before finalizing boundaries. When a mechanism-critical detail is missing or contradictory, make it `Ask Now` if a coherent, trustworthy brief or a safety or authority prerequisite depends on it; otherwise mark it `Open But Design-Around` with its safe boundary, visible rather than hidden inside a generic boundary. When the user corrects a mechanism detail, update the trace and the affected registers first, then the boundaries and flows.

Apply domain-specific checks only when the source requires them: blockchain settlement may need confirmations and reorganization handling; a job queue, leases and duplicate-delivery handling. Preserve authority, state, recovery, security, and correctness requirements without assuming a particular domain.

## Where They Appear

Intake checkpoints show the registers concisely when they affect trust in the boundaries or flows, and the brief records them in full. In the package their truth moves into the owning flows' ordered transitions and the state, interface, invariant, and security records, under [Mechanism Preservation](core-design-audits.md#mechanism-preservation). `M-xxx` IDs, like every brief ID, are local to the brief and unrelated to the global module IDs Build Design forbids.
