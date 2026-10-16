# Diagram Selection

Package diagrams are reader aids derived from canonical Software Design records. They never own architecture, behavior, interfaces, state, or decisions. Create the fewest visuals that materially improve understanding; do not create a diagram merely because a flow exists in prose.

## Visual Destinations

The [System Guide](system-guide.md) explains the system and each domain in writing (in a package without one, `system-model/architecture.md` and each domain record do). The generator adds these pages; the System overview and States and transitions are the default visual destinations:

| Page | Reader question | Output | Reference |
| --- | --- | --- | --- |
| System explorer index | Where do I start? | `visuals/index.html` | [system-explorer.md](system-explorer.md) |
| System overview | What are the components, what does each do, and how do they connect? | `visuals/pages/system.html` | [system-explorer.md](system-explorer.md) |
| States and transitions | How does each object change, what triggers it, who acts under which conditions, and where do success, expiry, failure and recovery lead? | `visuals/pages/states.html` | [system-explorer.md](system-explorer.md) |
| Construction dependencies | What must exist first; what can proceed in parallel? | `visuals/maps/build-unit-dependencies.html` | below |

The explorer index is the visual entry point and opens the two default destinations. Component responsibilities, relationships, individual states, actions and guided tours are details inside them, not separate pages, and most packages need no other diagram.

Add another diagram only for a concrete reader question the defaults do not adequately serve. Name the question, the canonical records it derives from, and why a selection, tour or panel in the two destinations would leave the reader worse off; for example, a comparison of deadlines across parties that no single lifecycle shows. For a mechanism that is easier to grasp as a picture than as states, prefer the embedded figure in [system-explorer.md](system-explorer.md#optional-embedded-figure-hairline). An additional diagram is a reader aid like the others: it derives from and cites canonical records, owns no facts, lives under `visuals/`, is linked from the README's visual section beside the System Explorer, and is reviewed and kept current with the package. Never build a gallery or a page per question, and never restate what a destination already shows.

The conditional `ui-ux/index.html` and its candidate workflow remain separate product presentation artifacts; follow [UI/UX Design](ui-ux-design.md). Do not move them into the explorer.

## Form And Review

Inspect supplied screenshots and existing successful visuals before choosing geometry and hierarchy. Treat them as requirements to interpret. The diagram is the primary content; detail appears on demand in a closable panel, with exact source rows behind a disclosure. Motion shows an exchange, a transition or a consequence; meaning must survive without animation.

State machines render one object at a time from reviewed graphs ([visual-graphs.md](visual-graphs.md)). Retain every canonical transition table and exact condition, including failure, reorg, invalid and recovery paths; map compound expressions only when the source unambiguously supports it, and keep unresolved expressions visible as gaps. A selection or animation never hides the rest of the machine; recorded rows deliberately left undrawn are listed with their reviewed reason. Do not guess runnable protocol logic from descriptive rows.

Judge technical preservation, human comprehension and visual usefulness separately. Automated tests establish invariants and working controls; they cannot certify the reading experience. Inspect the rendered result, walk its paths and honor a requested human checkpoint before extending a design across the system.

## Regeneration And Freshness

The bundled generator reads canonical records and the reviewed presentation inputs (`explorer.json`, `graphs.json`). Source fingerprints make changed canonical inputs fail before generation; a hash is a freshness signal, never a substitute for semantic review. `--views explorer,build` selects outputs, and `--check` detects stale sources and edited outputs. Packaging and commands are in [system-explorer.md](system-explorer.md).

## Construction Dependencies

At Stage 8 with two or more stable Build Units, generate `visuals/maps/build-unit-dependencies.html`. Each card derives name, code location, responsibility family, complete declared prerequisite list and purpose from its canonical owner. Topological depth shows possible parallelism, not execution order or readiness. Keep all declared prerequisites visible and show the reduced prerequisite-to-dependent connections; link the actual handoff sequence separately once Stage 9 has created `build/workflow/handoffs/README.md`. Before then the map carries no sequence link and no placeholder; the generator records whether the sequence exists, so creating it makes the map stale until regenerated. A reviewed `build` graph in `graphs.json` may replace the table-derived map. The validator checks canonical units, dependency validity and cycles, exact generated content, freshness, and links from the package and build READMEs.
