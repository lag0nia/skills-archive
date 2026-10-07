# Ticket And Technical Decision Visuals

Use this reference only for optional visual snapshots embedded in projected GitHub ticket or Technical Decision bodies. These snapshots are presentation aids inside canonical workflow records. They are not package-level diagrams, new design owners, or substitutes for exact prose.

## Selection Rule

Add one `current_shape` only when it makes a material relationship easier to understand than the existing brief:

- several current rules form a consequential branch;
- a repository, Build Unit, module, or ownership hierarchy has at least three meaningful nodes; or
- one named persisted object has several established states and transitions.

Omit it for atomic questions, prose that is already clearer, comparisons of alternatives, timelines, decorative summaries, or any view that would repeat the body without adding scanning value. Never add a visual merely because the ticket concern is `state-lifecycle` or because a TD has several children.

Use the smallest truthful visual and only one per ticket or TD. Show current established truth and the exact unresolved boundary when needed. Do not preserve rejected alternatives, obsolete states, interview history, or recommendations as if selected. A visual on an unresolved record may show established scope or structure, but it must not turn the recommendation into current design.

## Canonical Shape

Use one optional inline JSON-compatible YAML field:

```yaml
current_shape: {"type":"tree","title":"Current repository scope","source_refs":["build/repositories/repo-001-application/README.md"],"lines":["REPO-001 — Application Repository","├── apps/web — BU-001","└── services/api — BU-002"]}
```

The object requires exactly:

- `type`: `tree`, `logic`, or `state`;
- `title`: one concise subject-specific title;
- `source_refs`: one or more package-relative canonical sources;
- `lines`: the plain-text or Mermaid body without a Markdown fence.

Omit the field or use `current_shape: null` when no visual is justified. Do not create companion files, images, Canvas records, or a second human-readable copy.

## Grammar Choice

### Tree

Use `tree` for current construction or ownership shape: repository members, Build Unit internals, module ownership, or dependency organization. Render it as a plain-text fenced block so GitHub preserves spacing.

Each line represents containment or ownership. Do not use a tree for runtime sequence, state transitions, or a list that has no meaningful hierarchy.

### Logic

Use `logic` for current conditional rules, authorization gates, eligibility, routing, or fail-closed behavior. The first line must be a Mermaid `flowchart` direction.

Nodes state current facts or outcomes; edges state the exact current condition. Keep it small. Do not display discarded alternatives or use it as decision history.

### State

Use `state` only for one named persisted object whose states and valid transitions already exist in canonical design. The first line must be `stateDiagram-v2`.

Nodes are durable states of that object and edges are valid transitions with established triggers. Do not combine several objects, responsibilities, or broad system lifecycle phases. If the state model is unresolved, do not fabricate it for the ticket.

## Placement And Projection

Render the visual near the beginning of the GitHub issue under `## Current shape`. For ordinary tickets, place it after the status-specific opening and context so approved outcomes or deferral reasons remain prominent. For Technical Decision issues, keep it after the opening context. Use a `text` fence for trees and a `mermaid` fence for logic and state. GitHub Issues render Mermaid code blocks.

Keep the normal ticket or TD sections unchanged after the visual. Put `source_refs` in the collapsed canonical-reference block so readers can trace the snapshot without exposing raw YAML at the top.

The visual changes only when its canonical sources change materially. Reconcile or remove a stale snapshot in the same pass as the affected ticket, TD, Build Unit, repository, state, invariant, or interface update.

## Review Checklist

Before keeping a visual, confirm:

1. It answers one concrete reader question faster than prose.
2. Every node and edge is supported by `source_refs`.
3. It shows current truth rather than alternatives or history.
4. Its grammar matches the relationship.
5. Removing it would make the issue materially harder to scan.
6. The existing prose remains sufficient for agents and nonvisual readers.

If any check fails, omit the visual.
