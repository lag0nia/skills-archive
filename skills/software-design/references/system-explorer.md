# System Explorer

The package's visual reading surface is a small index, `visuals/index.html`, with two default destinations:

- **System overview** (`visuals/pages/system.html`) — what the components are, what each does and how they connect.
- **States and transitions** (`visuals/pages/states.html`) — how each recorded object changes: its states, the action or event that changes it, who acts, under which conditions, and where success, expiry, failure and recovery lead.

Both destinations are reachable directly from the index. A reader never has to find the component that owns a lifecycle in order to read it. They are reader aids derived from canonical records and never own architecture, behavior, interfaces, state or decisions.

Keep `index.html` as the only HTML file directly under `visuals/`; destination pages live in `pages/`, construction maps in `maps/`, embedded figures in `figures/`, and supporting files in `assets/`.

The index is only a visual entry point: the package title, its one-line summary and two large links with a small preview of each destination. It holds no explanation and never opens into a diagram. The only other generated page is the construction dependency map (`visuals/maps/build-unit-dependencies.html`), which answers a build-time question. Any further diagram meets the reader-need test in [diagram-selection.md](diagram-selection.md) and is linked from the README, not from the index.

## Reading model

**System overview.** It opens on the map, from its left edge when the whole map is not readable at once (on a phone, around the most connected component), with one short line of guidance in the sidebar. Selecting a component highlights its connections, names what crosses each of them and opens the details panel. Selecting a connection, or a name under *Connects with*, inspects that relationship: what crosses in each direction. Selections are details within the destination, never pages of their own.

**States and transitions.** It opens on one complete lifecycle, framed on its beginning. The sidebar lists the lifecycles grouped by the component that keeps them (only when there is more than one), then tells the shown lifecycle's story: a short connected explanation of what it is for and how it moves, followed by a folded note of any recorded rows not drawn. Every recorded state and every action-labelled transition is visible, with main, alternative, expiry, failure and recovery paths drawn together. Selecting an action shows its story (who acts, under which conditions, and what happens here and elsewhere, in a few connected sentences) with links to what it touches; its exact recorded conditions, effects, symbols and event stay one click away under *Exact conditions and record*. Selecting a state shows what it means and the actions that leave and reach it, with its recorded wording folded away. Transitions stay inside their state machine; they are never separate destinations.

**Cross-links are contextual.** A component's panel lists the lifecycles it keeps and links to them; and an action's effect links to the component or lifecycle it touches. Each lifecycle stays independent: never merge machines into one global diagram. Where one lifecycle hands over to another, draw an **exit** from the state where it happens, linking to the related lifecycle.

Every selection has a stable `#/…` address. Escape clears a selection; the browser Back button retraces visits, including across destinations. Guided tours are recorded paths through both destinations, driven from a small step control: an **illustrative path through recorded rules — not live system state**, and its control says so.

## Interface hierarchy

- **One title.** Each destination has one bar: a link back to the index, the destination name, and a link to the other destination. Do not repeat the subject over the canvas.
- **The diagram fills the screen.** There are no header bars. Navigation (home, the two destinations, tours), what is shown and a folded key live in one collapsible left sidebar; it starts open on wide screens and folded on phones, and the reader's choice is remembered. Anything floating over the diagram is small and translucent (glass): the sidebar, zoom and Fit in the bottom-right corner, the tour, and one closable details panel (on the right on wide screens, a bottom sheet on phones) that appears only when something is selected. Opening views and selections are framed clear of these, so they never hide what the reader is looking at: when a selection needs the sidebar's room on a wide screen, the sidebar folds for now (one click brings it back), and folding or opening it re-frames the view. The key sits below the explanation, folded until the reader opens it. A light/dark toggle sits in the sidebar head (and in the index corner); it follows the system setting until the reader chooses, and the choice is remembered.
- **Progressive disclosure, not removal.** The diagram carries what a reader needs to follow the graph: readable state names, terminal outcomes, readable action names and path kinds. State meanings, actors, conditions, effects, recorded names, symbols and sources open on selection, all still bound to their records. Never hide a distinction whose absence would make the visible diagram misleading: put it in the label instead.
- **Labels on demand on the map.** Connection labels appear only for the selected component's connections. The generator reserves a slot for each label in each selection, clear of every card, group title and route shown with it, so labels never cover cards or the lines being read.
- **Important behaviour in the diagram.** In a lifecycle, each state shows its readable name and terminal states show their outcome. Each action is a tinted pill in its path kind's colour, so actions read at a glance as different from states. A label must be understandable without a glossary, and must carry any distinction the graph would otherwise lose: a time limit (*Expire after 24 hours*), the party when two parties can do the same thing, or the condition that separates two actions leaving the same state.
- **Readable size.** Every view has a readable floor, its minimum zoom (0.8 on a wide screen, 0.72 on a phone, keeping card and state names at about 11 and 10 pixels), and never zooms out below it to gain space. A lifecycle opens whole only when that stays readable; otherwise it opens near full size on its start and the reader pans along it. A selection's neighbourhood (a component with its connections and connected cards, a state with its actions, neighbouring states and exits, an action with its two states) is fitted whole when it fits at or above the floor. When it does not, the view stays at the floor, keeps the selected item clear of the sidebar, panel and zoom, and shows as many neighbours as fit; the panel links every neighbour (*Connects with*, *Next*, *Reached by*), and following a link brings it into view. On a phone this is the usual case for a busy component or state, not a defect.
- **Nothing under the controls.** The zoom and the show-sidebar button are small; views keep cards, states and actions from under them rather than reserving whole bands of the screen. A destination opens with nothing beneath them (the view shifts slightly when needed), and a selection that fits at the floor is framed whole and clear of them. When a selection is too large for the floor, a neighbour it cuts off is left off-screen rather than beneath a control. Items that stay undimmed during a selection (every state in a lifecycle) are also kept from under the controls when a small shift allows it without losing anything already shown whole.
- **Quiet chrome.** The key in the sidebar lists only the notation the page uses, each sample with words. Zoom and Fit are compact.

## Keep the concepts distinct

Domains, System Responsibilities, runtime components, contracts and state owners are different things, and their mappings are rarely one to one. Model each concept as itself and show the real mapping:

- A component lists the responsibilities it realizes, each with its domain, citing the record that states the realization.
- An object lists every component that keeps it, each with its role (for example *Governs*, *Projects*, *Observes*), citing the record that establishes the role.
- Separate lifecycles stay separate objects even when one record defines several machines.

## Before authoring

Read, in this order: the existing visual the user values, any supplied reference screenshots, Architecture, the Build Unit records and their runtime homes, interface records, state records and the reviewed `visuals/assets/graphs.json`. Treat supplied references as requirements to interpret, not decoration.

**Overview readiness.** The overview may be published only when canonical records establish every shown component, external dependency and connection direction, and no unresolved ticket would require guessing one. An undecided component or relationship is either omitted or shown as explicitly unresolved in its summary.

**Start from what works.** When an earlier accurate topology exists, carry over its components, grouping and arrangement and improve it; correct only what canonical records contradict.

## Model

Author `visuals/assets/explorer.json` (`"version": 2`). Every fact in the model cites a source reference in one of three forms, all paths relative to the technical-design package. Sources are for the generator, not the reader: it refuses unbacked numbers and stale sources, while the pages show no citation marks or source lists.

- `{ "file", "heading", "row", "table"? }` — an exact table row (one-based `row`; zero-based `table` among tables under that heading).
- `{ "file", "field" }` — a frontmatter field.
- `{ "file", "heading", "quote"? }` — a section, or an exact substring of it.

```json
{
  "version": 2,
  "title": "Booking system",
  "summary": "What the system is, in one or two plain sentences.",
  "sources": { "system-model/contracts/interfaces/iface-001-booking.md": "<sha256 of the reviewed file>" },
  "layout": "authored",
  "groups": [{ "id": "runtime", "name": "Booking runtime", "members": ["api", "store"] }],
  "components": [{
    "id": "api", "name": "Booking API", "kind": "service", "meta": "HTTP service · Booking API (BU-002)",
    "summary": "Why it exists and what it does, before any identifier.",
    "responsibilities": [{ "id": "SR-002", "name": "Take bookings", "domain": "Reservations", "source": { "file": "build/units/bu-002-api.md", "field": "source_responsibilities" } }],
    "source": { "file": "build/units/bu-002-api.md", "heading": "Build Unit Overview" },
    "geometry": { "x": 640, "y": 220, "width": 216, "height": 66 }
  }],
  "connections": [{ "id": "web-api", "from": "web", "to": "api", "kind": "request", "label": "Booking request", "source": { "file": "…", "heading": "Exchanges", "row": 1 } }],
  "objects": [{
    "id": "booking", "name": "Booking", "summary": "What this object is, in one sentence.",
    "owners": [{ "component": "api", "role": "Records", "source": { "file": "…", "heading": "…" } }],
    "graph": "booking", "start": "draft",
    "source": { "file": "system-model/contracts/states/state-001-booking.md", "heading": "Authority And Identity" },
    "story": "One booking follows one seat request. The customer confirms a seat, which is then held while the exact ticket price (P) is paid into the escrow contract. Once paid, the ticket is issued; if the hold lapses first the booking expires.",
    "terms": [{ "term": "P", "meaning": "The exact ticket price the escrow must hold.", "source": { "file": "…", "heading": "…", "row": 2 } }],
    "states": {
      "held": { "gist": "The seat is reserved while P is awaited." },
      "issued": { "label": "Ticket issued", "gist": "The ticket exists and the venue is paid.", "outcome": "success" }
    },
    "transitions": {
      "fund": {
        "path": "main", "label": "Escrow funded at exact price", "short": "Escrow · before the hold expires",
        "story": "The escrow contract reports that the exact ticket price (P) arrived before the hold ran out. The escrow only accepts that exact amount, and from then on it holds the payment for this booking.",
        "actor": "Escrow contract, reported to the API",
        "when": [
          { "text": "The exact price arrives before the hold expires", "source": { "file": "…", "heading": "Transitions", "row": 2 } },
          "Plain reading of the transition row's own guard"
        ],
        "effects": [{ "text": "The escrow now holds the payment.", "component": "escrow", "source": { "file": "…", "heading": "…", "row": 1 } }]
      }
    },
    "exits": [{ "from": "paid", "label": "Payment held in escrow", "text": "While paid, the money follows the escrow lifecycle.", "object": "escrow", "path": "main", "source": { "file": "…", "heading": "States", "row": 2 } }]
  }],
  "scenarios": [{ "id": "paid-booking", "title": "A booking is paid", "intro": "Starting conditions in plain words.", "steps": [
    { "object": "booking", "transition": "fund", "caption": "…" },
    { "connection": "web-api", "caption": "…" }
  ] }]
}
```

Rules the generator enforces (it fails closed rather than drawing a guess):

- **Kinds.** Components: `person`, `application`, `service`, `worker`, `contract`, `store`, `external`, `network`. Connections: `request` (call and response), `command` (one-way instruction), `event` (publication or observation), `transfer` (value or asset moves). One connection has one meaning; draw two connections for two facts.
- **Boundary.** `boundary` (`label`, `text`, optional `source`) is optional. Add one only when it prevents a material misunderstanding a reader would otherwise likely make, for example that a coordinating service holds money it never touches. Do not add a *Does not…* or *Holds no…* line to every component.
- **States.** Every drawn state of an object with a `graph` needs `states[id].gist`: one line (≤ 110 characters) saying what the state means for the reader, shown when the state is selected. `label` (≤ 32) is the readable name drawn on the diagram; set it whenever the recorded name is technical, abbreviated or uses a symbol. The recorded name stays available in the panel. A state the record marks terminal (its `Terminal` cell is exactly `Yes`; see the state record format) needs an `outcome` (`success`, `expiry`, `failure`, `recovery` or `neutral`); other states carry none. When the record marks a state terminal but an open ticket still decides whether it stays final, declare `terminalUnresolved: { "open": [{ "file": "build/workflow/tickets/<file>.yaml", "ticket": "TICKET-NNNN" }] }` instead of an outcome. The recorded value is kept, and the declaration only stops the diagram from presenting the doubt as settled: the state is drawn without the final outline or an outcome, with a neutral *Terminal status unresolved* tag, and its panel still says that the record marks it terminal. The generator accepts the declaration only on a state recorded as terminal, never beside an `outcome`, and only with a ticket that is active, still `todo` or `deferred`, and tied to that state's record (the record names the ticket or the ticket writes to it). Never use it to turn a terminal state into an ordinary one, and do not describe it as finality, which readers may take for transaction finality.
- **Stories.** Every object with a `graph` needs `story`, and every drawn transition needs `story` (each ≤ 900 characters; separate paragraphs with a blank line). Write a connected account a reader can follow without the records: set the context first (who is involved and how they relate), then what happens and what follows. For an action, say who acts, under which conditions and what changes here and elsewhere, covering every recorded condition in plain words; the exact wording stays in `actor`, `when` and `effects`. Introduce a symbol or unfamiliar term by its role in this system where it is first used (*the borrower's secret (X)*), never as a glossary. Numbers in a story must appear in the records the object or action cites, and symbols must be in `terms`.
- **Transitions.** Every drawn transition needs `path` (`main`, `alternative`, `expiry`, `failure` or `recovery`) and may give `short`, a who · when line of at most 48 characters shown under the action's name in its panel. `label` (≤ 30) is the readable action name drawn on the diagram; set it whenever the recorded event name is technical or uses a symbol. Two actions leaving the same state must read differently. The recorded event and authority stay in the panel. The main path is the path an ordinary successful object takes; it is drawn strongest and kept straight.
- **Conditions bind to their own records.** `actor` and each `when` item are a string, read against the transition's own row and its two state rows, or `{ "text", "source" }` when the condition is owned by another record (an interface, a flow, an invariant, a security requirement). Cite that owning record instead of omitting a valid requirement. Never write a condition no cited record states.
- **Numbers.** A number in a label, gist, actor, condition, short line, effect, term or exit must appear in one of the records that text cites; an action label may use the numbers of its own conditions' records. When the generator reports an unbacked number, cite the record that owns it on that condition, or remove the number.
- **Open questions bind to their tickets.** When a story, gist, condition, effect or exit says that something is still open, it may name the existing ticket that owns the question even when the cited rows do not mention it. Add `open: [{ "file": "build/workflow/tickets/<file>.yaml", "ticket": "TICKET-NNNN" }]` to the lifecycle, state, transition or exit, and fingerprint the ticket file in `sources`. The generator accepts the reference only when the ticket is active and still `todo` or `deferred`, and when it concerns a record the text already cites (its write targets include that record, the record names the ticket, or the cited row or the record's authority names the ticket's owner or a responsibility it affects). The binding lets the text name only that ticket's ID; it never backs a quantity, and the digits of a ticket ID, in the text or in a cited record, never count as evidence for a number. A ticket ID named in visible text must be named by a cited record or bound through `open`. Write the question in plain words; naming the ID in the text is optional, and the binding records the traceability either way. When the ticket is decided, generation fails until the text says what was decided.
- **Symbols.** Labels drawn on the diagram (states, conditions, actions and exits) never use single-letter symbols such as `X` or `D`: write what the symbol stands for (*Reveal the secret*, *Before the deadline*). Stories, gists, actors, conditions, short lines, effects and exit text may use a symbol explained in the object's `terms` (term ≤ 12, meaning ≤ 160, with its source); the terms back the generator's checks and appear only in the folded exact record, so the story itself must introduce each symbol it uses.
- **Exits** lead from a drawn state to a related lifecycle (`object`) or a component, with a short label, one sentence of explanation and a source. An `object` link must name an object with a reviewed graph.
- **Effects** must cite a source; an effect may name the `component`, `connection` or `object` it touches, which becomes a link.
- **Objects without a graph** are not destinations and are not drawn. Keep them in the model only as a record of who keeps them; they cannot carry states, transitions, terms or exits. Never show a placeholder for an unbuilt view.
- **Lifecycle coverage.** Review each state record the model names. Draw its lifecycle (a reviewed state graph from its canonical *Transitions* table, with states, transitions and stories) when it records changes a reader needs to follow: more than one meaningful step, or an outcome that matters to a participant. Leave it undrawn when it is a single configuration or value without recorded transitions, or when its changes are already drawn in another lifecycle; never invent states or transitions to complete a picture. A new lifecycle joins *States and transitions* beside the others and links to and from related lifecycles through exits where the records say one hands over to another. When delivering, name each object left undrawn and why.
- A responsibility's cited source must name its SR identity. Transition and state keys must be ids of the object's reviewed state graph. Scenario steps must reference declared items.
- Text limits keep the canvas readable: component name ≤ 40, second line ≤ 64, connection label ≤ 48, component summary ≤ 300, object summary ≤ 280. With authored geometry the generator checks that each name and second line fit their card and states the width needed.
- Changing any fingerprinted source fails generation until you have read the change, corrected the model if needed and deliberately updated that fingerprint. Never refresh hashes as a build step.

### Overview geometry

Use `"layout": "authored"` and give each component `geometry` (cards at least 160 × 56; 216 × 66 is a good default). Groups derive their boundary from their members unless you give one. Omit connection `points`: the generator routes every connection orthogonally, side to side, keeping lanes apart, never crossing a card or running along its edge, and keeping two lanes clear of cards a route does not connect and a lane and a half clear of group outlines wherever another route with room for its label exists (a turning route may cross over at another height for this). Facing cards that overlap share a straight line; other ports aim at their far card. Routes avoid crossing one another: two routes between the same cards (a request and its reply) never cross, and once spacing is settled a crossing pair may move to other ports or sides when that removes crossings and every label still fits. A route that must pass a bundle of others still crosses it; if that reads badly, move the cards so the route has a way around. It then reserves label slots for every selection.

Where a route or a label has no room, the generator adds space along a line that crosses no card, only where it is needed and without scaling anything. When it still cannot place a label, it names the label, the selection that shows it, and either the route it would cover or *no straight stretch long enough*. Two routes that leave the same side of a card side by side for their whole length leave no room for either label. Arrange the far cards so these routes leave from different sides or diverge early. For example, place two stores below and to either side of their owner rather than both directly beneath it. Author route points only as a last resort.

Arrange by the system's real shape: people and entry applications on one side, the coordinating service near the centre, owned stores beside their owner, and workers, contracts, external services and networks around it according to the actual call direction. Use the group boundaries the records establish, not decorative bands. Do not leave large empty areas; the generator adds only the space a label needs.

## Writing for the reader

- Names are role-first and recognizable without knowing the record taxonomy. Identifiers go in the second line or the sources, as `Name (BU-002)`.
- A component summary explains why it exists and what it does, in ordinary language. The panel shows it, the *Connects with* names, the responsibilities and the lifecycles it keeps. Relationship details appear only when a relationship is inspected. Do not repeat what the diagram already shows.
- Connection labels say what crosses (*Signed repayment*, *Loan opened event*), not *calls* or *uses*.
- State and action labels, gists and short lines are written for a reader who has not read the records: what the state means, who acts and when. Keep the exact technical names in the records; they are shown in the panel.
- The top-level `summary` is the index line under the title. Describe the system; do not write interface instructions.
- A tour caption says what this step shows and why it matters on the path; it must not repeat the panel text.
- Lifecycles are recorded rules, not live data. Never show simulated balances, timestamps or metrics.
- Unresolved matters stay visibly unresolved, citing the open ticket.

## Visual language and motion

The renderer provides the visual language: a calm canvas; compact cards with an icon; thin labelled group outlines; orthogonal connections; state machines whose path kinds differ by line style (strong main path, quiet alternatives, dashed expiry, dotted recovery, red failure), terminal states with a double outline and outcome tag, condition junctions drawn dashed, and a start marker. It supports light and dark themes, phones and keyboard use (Tab moves between items, Enter or Space selects, Escape clears). Do not add decoration or text to compensate for a weak layout; fix the layout.

Motion carries meaning only: a marker travels along a selected connection or transition to show direction, and the camera moves to a selection. With reduced motion the marker is not drawn and the camera moves instantly.

## Optional embedded figure (Hairline)

A component may carry one small figure when a tangible mechanism inside it — for example how funds are locked and released — is genuinely easier to grasp as a picture than as a state machine. Topology and state machines are never figures.

Use the actual Hairline tool (`https://github.com/lucasmarkes/hairline`, skill `skills/hairline-create/`, with its `kernel.js`, `bench.html`, `build.mjs`, `validate.mjs` and `look.mjs`) rather than imitating its style. Follow its one-idea-per-figure rule and keep words out of the drawing. Record the exact revision in `figure.tool`, save the self-contained figure under `visuals/figures/`, ship its license and point `figure.file` to it. The figure opens in an overlay from the component's panel. If Hairline cannot be obtained, run offline or clarify the mechanism, omit the figure and report that; never hand-draw a lookalike.

## Progressive checkpoint and extension

Build one complete reading first, using real records: the index, the improved overview with a representative selected neighbourhood and relationship, and one representative complete state machine whose states, actions, conditions, recovery paths and links back to the responsible components are all filled in, plus one tour over it. Render it, exercise it and stop for the user's checkpoint. Add further lifecycles after approval. A checkpoint report states exactly which lifecycles are drawn.

## Build and check

Copy the generator and its libraries into the package so it builds offline: `scripts/generate-visuals.mjs` to `visuals/assets/generate-visuals.mjs`, and `scripts/lib/system-explorer.mjs`, `explorer-pages.mjs`, `visual-graphs.mjs`, `graph-layout.mjs` and `vendor/` (ELK bundle, license, notice) to `visuals/assets/lib/`. From the technical-design root:

```sh
node visuals/assets/generate-visuals.mjs --root . --views explorer,build
node visuals/assets/generate-visuals.mjs --root . --check
```

The manifest `visuals/assets/sources.json` records sources and outputs; `--check` fails on stale sources or edited outputs. Link the index from the package README as the visual entry point. Keep shortcut pages the user asked for, such as a quick-view page; one that serves as a navigation entry points to `index.html` rather than duplicating the index.

## Verify by reading, not by passing checks

Structural checks prove provenance and geometry, not understanding. Open the rendered pages in a browser. The skill does not bundle one: use any installed browser automation (for example Playwright with an installed Chromium) for screenshots and scripted walks, or the agent's own browser tools. If no browser is available, say so and do not call source inspection visual verification. Enter each destination from the index and walk it with pointer and keyboard, at desktop and phone widths, light and dark, with reduced motion. A reader must be able to answer, from the diagram first and the panel second:

1. What does this component do, and what does it connect with?
2. What crosses each connection, in which direction?
3. Which object is this lifecycle about, and what does each state mean, including terminal and recovery states?
4. Which action or event changes the state, who acts and under which conditions, and where do success, expiry, failure and recovery lead?
5. What happens elsewhere as a result, and can I follow it there and come back?

Also confirm: labels never overlap cards, each other or the routes being read; routes do not run along card edges or group outlines; the opening views put nothing under the zoom or the show-sidebar button; a selected item is never hidden by the sidebar, panel or zoom, its neighbourhood is whole when it fits at the readable floor, and otherwise every neighbour is reachable from the panel (on a phone, judge this rather than whether a large neighbourhood fits whole); the index has only the two destinations; panels show no placeholder or unavailable action; the lifecycle page opens quietly on the diagram's beginning with nothing covering it; drawn labels read without a glossary and panels explain any symbol they use; tours are marked illustrative; there are no console errors or network requests; pages do not scroll horizontally on a phone. Judge technical accuracy, comprehension and visual usefulness separately.

When evaluating changes to this skill, freeze the candidate, give a fresh context only the request, the raw records and the supplied references, and do not repair its output and report the repaired result as the skill's own.
