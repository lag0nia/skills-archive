# Diagram Selection

Package diagrams are reader aids derived from canonical Software Design records. They never own architecture, behavior, interfaces, state, or decisions. Create the fewest diagrams that materially improve understanding; do not create a diagram merely because a flow exists in prose.

## Diagram Set

| Diagram | When to create it | Output |
| --- | --- | --- |
| Runtime Architecture | After Runtime Diagram Readiness passes | `diagrams/runtime-architecture.html` |
| Build Unit Dependency Map | During Stage 8 when two or more Build Units exist | `diagrams/build-unit-dependency-map.canvas` |
| State machine | Only when one persisted object's established transitions need visual review | purpose-derived `.canvas` filename |

Only the outputs listed above belong in `diagrams/`. A critical execution trace is an optional later reader aid only when the user explicitly asks for that specific mechanism; it is not part of the default package set.

The conditional `ui-ux/prototype.html` is not a package diagram. It launches the selected interactive candidate under `ui-ux/alternatives/<candidate>/` for human-facing presentation and interaction requirements and follows [UI/UX Design](ui-ux-design.md). Keep it in `ui-ux/`, use representative fake data, and do not treat it as an authority for system behavior.

## Runtime Architecture

Create one Runtime Architecture to answer: **What actually runs, where are its boundaries, which component coordinates the system, and what directly connects to it?**

### Readiness

Generate it only after all of the following are true:

- Build Units and their runtime homes are known for the intended system scope.
- Every ticket or Technical Decision that changes a shown application, worker, container, store, identity provider, external service, or relationship is `decided`, `finished`, or explicitly `out-of-scope`.
- Canonical records establish each shown runtime component, external dependency, and connection direction.
- No unresolved decision would require guessing a component, service binding, storage boundary, or runtime relationship.

Do not wait for implementation. An exploratory local preview is allowed before readiness, but do not commit or link it as the canonical Runtime Architecture. Regenerate the HTML whenever a diagram-relevant canonical decision changes.

### Source And Model

Read the relevant Build Unit records, Repository Build Designs, interfaces, selections, constraints, and resolved ticket outcomes before drafting the model. Build a temporary JSON model with this shape:

```json
{
  "title": "Project name",
  "width": 1600,
  "height": 900,
  "groups": [{ "id": "runtime", "label": "SYSTEM RUNTIME", "x": 480, "y": 140, "width": 640, "height": 700 }],
  "nodes": [{ "id": "processing-service", "title": "Processing Service", "meta": "HTTP service · managed runtime · BU-002", "description": "This is the durable coordination boundary for the application. It accepts requests, records application state, and starts only explicit downstream work.", "works_with": "The client application for requests, the application store for durable state, and workers for approved background work.", "boundary": { "label": "Does not approve", "text": "It never grants user authority, fabricates external outcomes, or treats an unverified provider response as final truth." }, "sources": ["BU-002", "SR-003", "IFACE-002"], "category": "core", "kind": "service", "group": "runtime", "x": 700, "y": 400, "width": 300, "height": 160 }],
  "edges": [{ "id": "service-store", "from": "processing-service", "to": "application-database", "kind": "request-response", "points": [[850, 560], [850, 670]] }]
}
```

Use lowercase hyphenated IDs. The model is a disposable render input: do not retain it as another package diagram. The renderer embeds the exact model inside the final self-contained HTML so the view remains inspectable and reproducible.

Render and verify:

```sh
node <software-design-skill-directory>/scripts/validate-runtime-architecture.mjs --input <temporary-model.json>
node <software-design-skill-directory>/scripts/render-runtime-architecture.mjs --input <temporary-model.json> --output <software-design-package>/diagrams/runtime-architecture.html
```

Link the result directly from the root README as `Runtime Architecture`. Do not generate a separate SVG unless the user explicitly requests a README, PDF, or other static export.

### Visual Language

- Use role-first names: `Artifact Storage`, `Identity Service`, `Workflow Coordination Service`. Put provider, runtime, and optional Build Unit ID in the concise second line.
- Give the central coordinating runtime the largest, darkest card and place it near the visual centre. Do not call a component an engine, API, or vendor name when that hides its operational role.
- Use only four restrained categories: neutral actors, muted-blue product applications, muted-teal owned runtime, and soft-grey external dependencies. Do not use coloured group backgrounds or a legend when the category is obvious from card styling.
- Use thin labelled boundary outlines only. Align cards, titles, icons, and branch rows deliberately; centre card content both horizontally and vertically.
- Keep a clear gap between an icon and its title. Put no paragraph, floating note, or unconnected explanatory card in the diagram.
- Centre the icon, title, and metadata together as one compact card-content stack. Give icons enough visual weight to remain legible at Fit view without touching their text.
- Keep the page view calm and serious: white or near-white cards, restrained borders, and no decorative gradients, shadows, or rainbow connectors beyond the small focus effect.

### Relationship And Geometry Contract

- Every node and relationship must map to approved canonical truth. Omit a local implementation detail unless it changes runtime understanding, authority, trust, data ownership, or a material external boundary.
- One connector has one meaning. Use `request-response` for a direct operational call and its response, `event` for one-way publication or observation, and `command` for a one-way directed command. Do not use bidirectional arrows for a relationship that is only an event.
- Give each connector its own orthogonal lane. Connectors must not cross, overlap, share a lane, pass through a card, collide with a label, or enter a card accidentally. Anchor every connector on one unambiguous card side, never a corner: its first segment must leave outward perpendicular to the source side and its final segment must enter inward perpendicular to the target side. An arrowhead must never run sideways along a card border. Separate routes before they reach the central component.
- Place user-facing entry paths together, owned stores beneath or beside their owner, and background or external branches around the coordinator according to the actual call direction. Do not force every card into a left-to-right chain.
- Validate the model before rendering. Treat any card overlap, group overlap, connector crossing, connector overlap, card pass-through, or incorrect endpoint as a defect. Then inspect the generated HTML at Fit view and reading zoom.

### Inspector Content

The inspector is a reading aid, not another owner of system truth. Every node must provide the following exact model fields derived from its canonical records:

- `description`: 20–360 characters of natural, human-first prose. Explain why the component is here and what it does in the system before using labels or identifiers.
- `works_with`: a concise human sentence naming its direct system relationships and why they exist.
- `boundary`: a context-specific `{ "label", "text" }` pair such as `Keeps private`, `Does not sign`, or `Stays authoritative`. State the most useful trust, authority, or non-ownership boundary.
- `sources`: one to eight canonical IDs, such as `BU-004`, `SR-009`, `IFACE-004`, or `SEL-027`.

On hover or keyboard focus, show the title and concise runtime metadata, then the prose first. Follow it with `Works with`, the context-specific boundary heading, and `Blueprint` source IDs. Keep the prose and each section readable in normal language; do not expose raw YAML, generic field names, or a dense record dump.

### Interactive Viewer Contract

The output is one self-contained local HTML file with inline SVG. It uses no third-party runtime, CDN, or hosted application. It must provide:

- two-finger trackpad scrolling to pan horizontally and vertically;
- pinch zoom centred on the pointer, with restrained sensitivity;
- `+`, `−`, and `Fit` controls, with an 18% button zoom step;
- click-and-drag panning as a fallback;
- hover and keyboard focus that highlights only a component's direct relationships and shows a human-first prose inspector outside the cards; and
- no native SVG title tooltip.

## Build Unit Dependency Map

Create the Canvas map during Stage 8 when the package has at least two stable Build Unit records. Its reader question is: **What independently buildable artifacts exist, what does each require, and what can proceed in parallel?**

Use `diagrams/build-unit-dependency-map.canvas`. Derive one card per Build Unit from its canonical record. Include the Build Unit name, code location, responsibility family, complete `Requires` list, and concise purpose. Draw only transitive-reduction prerequisite-to-dependent edges, label each edge with the supplied interface or artifact, arrange units in topological rows, and use responsibility-family colour consistently. Link it from both the root README and `build/README.md`, then run its semantic validator and Canvas layout validator.

This is a construction map, not a runtime map, lifecycle, schedule, or product overview.

## Optional State Machines

Create a state machine only for one named persisted object whose durable states and transitions are already explicit in canonical records. Use a purpose-derived filename such as `order-processing-recovery.canvas`. Do not use it as a substitute for a Runtime Architecture or a broad system lifecycle.
