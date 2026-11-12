# Core Design Audits

Run these audits at every stage checkpoint whose work they affect, and again before claiming a stage, Build Design, or Delivery Readiness complete. They are checks inside the existing checkpoint, not extra stages or approvals.

## Application Surface

When the source names a product surface, account, participant, operator, approval workflow, or approval agreement, verify that every human-facing responsibility belongs to an in-scope System Responsibility, an external system, or explicit deferred scope. Cover identity and roles, authentication and recovery, drafting and consent, API/orchestration, durable records, notifications, status projection, the canonical parameter dictionary, and the separation between product records and enforcement authority.

Do not let a protocol-only responsibility map silently stand in for the product application. Do not treat an actor as a System Responsibility or a Build Unit.

For a human-facing surface, apply [UI/UX Design](ui-ux-design.md) proportionately. At Stage 0 establish the intended users, main tasks, product-versus-demo boundary, and basic experience expectations, reusing approved upstream UI/UX ownership by reference. During Stages 1–7 identify material interface questions and their canonical owners. Before exploration, establish only the prerequisites needed to frame a meaningful bounded comparison: intended task, affected owners, known authority and safety constraints, and the hypotheses being tested. Explicit prototype hypotheses may help answer material questions about behavior, state, routes, recovery, or architecture; those questions need not all be settled first. Preserve approved answers in the existing canonical owners and resolve material contradictions before claiming reconciliation. Expose internal transitions, identifiers, implementation terms, or diagnostics by default only when they help the intended audience make an informed decision.

## Mechanism Preservation

When the brief carries a mechanism trace or registers, defined in [mechanism-registers.md](mechanism-registers.md), use them as a consistency contract. Before each affected checkpoint, identify and preserve:

- ordered transitions and terminal outcomes;
- distinct stateful objects;
- credentials, tokens, secrets, signatures, capabilities, and what each proves or enables;
- external-domain fact ownership;
- manual, automatic, evidence-bearing, and unresolved cross-system handoffs; and
- invariants and `must not imply` constraints.

Express their truth through the package artifact that owns the architecture, interface, flow, state, or correctness rule. Package records and stage checkpoints carry that truth, not raw registers, as default output sections; intake checkpoints and the brief show the registers themselves ([Where They Appear](mechanism-registers.md#where-they-appear)).
