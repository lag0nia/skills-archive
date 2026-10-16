# Source-bound graph models

Read this reference when authoring the state graphs shown inside the System Explorer ([system-explorer.md](system-explorer.md)) or a reviewed construction dependency graph. Use `scripts/lib/visual-graphs.mjs` through the visual generator. The local ELK layout helper routes directed edges, including cycles, and reserves space for their labels. Its bundled dependency stays local during generation; generated HTML contains coordinates and works offline.

## Authoring and review

1. Read the canonical owners. Author a graph only for an object or construction whose structure a reader needs to see.
2. Put reviewed graph models in `visuals/assets/graphs.json`. Pin every source file with its SHA-256. Use compact labels; keep full authority, guards, finality, and exceptions in canonical rows, available through source disclosure.
3. Generate and inspect actual geometry at desktop and mobile sizes: edge labels, endpoints, self-loops, selection and source disclosure. Mechanical source binding verifies provenance and coverage; a semantic review must still verify that authored labels and mappings mean what their records say.

## Model

The top level is `{ version: 1, sources: { "relative/file.md": "sha256" }, graphs: [...] }`.

Each graph has `id`, `kind` (`states` or `build`), `title`, optional `description`, `group`, and `direction` (`AUTO`, `RIGHT`, or `DOWN`), `nodes`, and `edges`. The explorer lays state graphs out top to bottom; choose the build graph's direction from its actual geometry. Author edges from the actual transition or dependency owners; graph layout establishes neither behavior nor delivery order.

A node has `{ id, name, source }`, optionally `group` (a short secondary node caption), and `description`. An edge has `{ id, from, to, label, kind, source }`, optionally `description`. `kind` is `exchange`, `dependency`, or `transition`: dependencies use dashed arrows; exchanges and transitions use solid arrows. `from` → `to` always states the displayed direction. For a build prerequisite, this is prerequisite → dependent.

A source reference uses exactly one of:

- `{ file, heading, row, table? }`: exact table row; `row` is one-based, `table` is zero-based among tables under that same heading, default zero.
- `{ file, field }`: exact frontmatter field, such as `depends_on` or `responsibilities`.
- `{ file, heading, quote? }`: a source section or exact substring of it.

All files are relative to the technical-design package. Missing references, stale fingerprints, unknown endpoints and duplicate identities fail generation. State tables remain separate even when one record contains several independently governed machines.

## State objects and compound expressions

A state graph also requires `object`, the canonical state-record identity. The explorer shows one object at a time, reached from a component that manages it; an object count is never a reason to combine unrelated machines into one drawing.

Every ordinary state node must cite a row in that object's declared state table. Its display `name` can be compact; its canonical state value and complete row stay attached. A compound transition expression is not a declared state and cannot become an ordinary node.

Every edge must cite the exact transition row in that same object. When a displayed endpoint differs from the exact From or To value, attach `mapping: { from: "Source-supported interpretation", to: "Source-supported interpretation" }`, supplying each differing side. Split explicit alternatives into edges only after reading the state meaning and guards. Preserve broad predicates as predicates; do not infer mutually exclusive states or runnable paths from eligibility, projection, observation, or concurrent authority rules.

For a broad condition that would otherwise produce a misleading tangle, a node may have `kind: "junction"`. It must cite the transition row and provide a `description` explaining the condition. It renders with clipped corners rather than a state rectangle. Edges through it still cite the transition row and explain their differing endpoint mappings. Junctions count as conditions, never declared state coverage. A state graph's short description should explain when its objects include projections or independently eligible routes.

Every declared state row and every transition row across all of the object's tables must appear. If a deliberately bounded view excludes a row, declare it under `exclusions.states` or `exclusions.transitions` as `{ source, reason }`. The inspector exposes these exclusions. Never silently omit an account table, correction, recovery route, or inconvenient guard. Coverage checks establish that a row is represented, not that every alternative has been interpreted correctly; review broad mappings against canonical meaning before accepting a graph.

## Integration

`loadGraphs(root, canonicalModel)` synchronously validates and returns authored graphs, or `null` when absent. `renderGraph(input, 'build')` produces the standalone construction map. `sourceTables(text)` preserves each separately headed table. Both consumers obtain geometry the same way: `graphLayoutInput(graph)` converts a validated graph into an ELK input, and `calculateLayouts(jobs)` runs the jobs synchronously through `scripts/lib/graph-layout.mjs` and its local ELK bundle, returning deterministic routed coordinates. The construction map lays out its build graph this way; the System Explorer lays out each state graph this way when it generates `index.html`. State graphs have no standalone page. Packaging and freshness follow [system-explorer.md](system-explorer.md).

## Readable graph density

Leave `direction` omitted or use `AUTO` to choose the better compact RIGHT/DOWN arrangement for a build graph. Every route endpoint is checked against its source and target; an arrangement whose arrow stops away from its target is discarded. State predicates remain explicitly labeled conditions, retain their exact guards, and never receive invented connecting transitions to make a layout look complete.
