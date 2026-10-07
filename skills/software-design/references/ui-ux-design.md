# UI/UX Design

Use this integration contract only when Software Design includes a human-facing application or operator surface. It adds a bounded presentation-and-interaction lane inside the existing staged workflow. It does not create a separate product-design process, prototype stage, ticket taxonomy, or approval hierarchy.

The portable design module lives in [ui-ux/](ui-ux/README.md):

- Read [the design workflow](ui-ux/design-workflow.md) when establishing or reviewing an interface direction, information structure, interaction flow, or prototype.
- Read [the contrasting examples](ui-ux/examples.md) only when a concrete contrast helps resolve a design question or a draft relies on explanation instead of design structure.
- Use the [specification](ui-ux/templates/specification.md) and [launcher](ui-ux/templates/prototype.html) and [interactive candidate](ui-ux/templates/candidate.html) starters, and the optional [review slideshow](ui-ux/templates/slides.html) starter, only when creating those artifacts.

Small integration-only changes do not require loading the full module. The design guidance is stage-neutral; this file owns its Software Design timing, ownership, Build Unit, and readiness bindings.

## Ownership And Behavioral Boundaries

- Approved upstream product artifacts retain authority over intended users, product policy, user-visible behavior, scope, and any UI/UX decisions they already own. Reference those sources; do not copy their rationale into this package.
- Existing Software Design contracts retain authority over system behavior, state, interfaces, authority, security, failures, and recovery.
- `ui-ux/specification.md` owns presentation and interaction requirements: design rationale, journeys, routes, visible states, action priority, information hierarchy, content rules, responsive behavior, and accessibility expectations.
- `ui-ux/prototype.html` is a simple launcher. Candidates live under `ui-ux/alternatives/<candidate>/`, with one or more local HTML pages and supporting resources. The specification explicitly selects one candidate entrypoint and records reviewed coverage; selection requires no copying. Candidates illustrate requirements or explicitly labeled exploration hypotheses; none is a second behavior owner.
- The selected, reviewed candidate concretely illustrates the reviewed experience and is the implementation target for its presentation and interaction; see [Implementation Fidelity](#implementation-fidelity).
- Demo conveniences, simulated actors, fixtures, and test data must be visibly distinguished from product behavior and must not silently become production requirements or account/role restrictions.
- An optional `ui-ux/alternatives/<candidate>/slides.html` review slideshow is a derived screenshot reading aid for that candidate, defined by the portable module's [optional review slideshows](ui-ux/design-workflow.md#optional-review-slideshows). It never becomes the selected implementation target, a behavior owner, or evidence of reviewed interactions.

When an upstream source already owns UI/UX truth, link it from the specification and record only the downstream interpretation needed for Software Design and delivery. When sources conflict, route the conflict to its owner and withhold reconciliation of the affected surface; bounded exploration of explicit hypotheses can continue. Do not present an exploratory hypothesis about authority, transitions, success, automation, or recovery as approved product behavior.

## Stage Integration

### Stage 0 framing

Establish the intended users, their main tasks, whether the target is a product, demo, or explicit combination, and basic expectations that materially shape the work. Include likely prior knowledge and what must be understandable without blueprint, protocol, implementation, or organizational context. Reuse approved upstream answers and visual references.

Do not require a prototype, visual-style selection, reference comparison, or long UX questionnaire at Stage 0. Recommend ordinary reversible defaults and ask only unresolved questions that would change product behavior, architecture, the main journey, informed consent, accessibility, or recovery.

### Stages 1–6

Identify UI/UX questions and their canonical owners as they arise. Before bounded exploration, establish the intended task, affected owners, known authority and safety constraints, and explicit hypotheses needed for a meaningful comparison. Questions about System Responsibilities, flows, interfaces, state, recovery, or cross-surface handoffs may be answered with prototype evidence; they are not prerequisites merely because their consequences are material. Label hypotheses and any conflict with settled constraints, preserve approved answers in the canonical or upstream product owner, and resolve material contradictions before claiming reconciliation.

A reversible label, spacing choice, decorative treatment, or private component arrangement is not a Technical Decision or implementation-detail ticket. A question is material when different answers change a route, required information, user authority, safety, state meaning, recovery, accessibility, or Build Unit boundary.

### Stage 7: prerequisites, exploration, reconciliation, and completion

Preserve initial ticket visibility and the independent inventory audit. Earlier bounded sketches may help resolve a question without moving the required exploration out of Stage 7. For human-facing scopes:

1. Read the portable module's [design workflow](ui-ux/design-workflow.md) and create the concise `ui-ux/specification.md` from its [template](ui-ux/templates/specification.md).
2. Record the short design rationale in that specification and reuse a suitable user-supplied or approved direction. Before creating new candidates, apply the portable workflow's [prototype count and direction choice](ui-ux/design-workflow.md#choose-prototype-count-and-directions), reusing supplied preferences and asking only for missing information. Skip that question during ordinary updates or synchronization unless new alternatives are requested. When the module's capture capabilities are available and no slideshow preference is known, include its optional slideshow sentence in that same choice; reuse a supplied answer, and treat no answer as no opt-in. If no suitable direction exists, use the portable workflow to discover references and compare structure with conversational text wireframes when useful. The user may instead request comparable HTML alternatives or proceed directly when the direction is clear; these are routes through the same direction review, not separate approvals.
3. Establish the direction with one representative arrival → task discovery → meaningful action → persistent result flow, plus cancellation and failure/recovery, using representative fake data and canonical behavior or clearly labeled exploration hypotheses. When alternatives are requested, compare that same bounded flow before selecting and expanding one target.
4. Review comprehension and presentation as distinct qualities; fix material problems in the representative flow before extending its patterns to remaining material journeys and states.
5. Exercise the working interactions and inspect the rendered prototype with available tooling at representative viewports. Open `ui-ux/prototype.html` directly from disk for this inspection instead of a localhost preview, then check the affected navigation and representative interactions, including role switching when applicable. This replaces the local-server check; it is not an additional review cycle. Record the tool and findings; if rendering is blocked, record the limitation and do not claim visual verification. If opening from disk is blocked, record that limitation too and do not claim the prototype is portable. When slides are opted in, capture them from this same inspection and build each agreed candidate's deck; a capture failure yields an honest skipped or partial result without changing prototype-review claims, and slides never substitute for this inspection.
6. Resolve usability blockers and synchronize the affected specification requirements and prototype states at coherent journey boundaries inside the active Stage 7 pass.
7. Complete agreed reviewed coverage and reconcile approved findings through only canonical owners and dependencies actually affected. Material contradictions cannot support a reconciled-design claim. Stage 8 consumes this result when finalizing affected Build Units.

This is one existing checkpoint pass. Do not require approval for every screen, dialog, label, repeated pattern, reference observation, or routine synchronization. Completion means the agreed coverage exists, material questions are resolved, and the walkthrough has no unresolved usability blockers. Only details the specification explicitly leaves open remain implementation discretion. An agent walkthrough is a heuristic review, not actual user testing.

Every Build Unit records `ui_ux_applicability: "applicable"` or `"not-applicable"` plus a concrete `ui_ux_disposition`. An applicable unit includes `UI/UX Realization` linked to the reviewed artifacts. For a library, SDK without a maintained UI, background service, pipeline, or infrastructure-only target, use `not-applicable` and do not create `ui-ux/`. Stages 8 and 9 remain optional for design-only scopes.

### Stage 9

For every selected human-facing delivery slice under either `IMPLEMENTATION_DETAILS_READY` or `IMPLEMENTATION_DETAILS_PARTIAL`, reconcile:

- approved upstream product and UI/UX sources;
- canonical Software Design behavior and correctness requirements;
- `ui-ux/specification.md`;
- the reviewed journeys and states in the selected candidate entrypoint;
- affected Build Units; and
- the Delivery Planning handoff.

Partial delivery cannot bypass requirements applicable to its selected UI scope. Route functional acceptance and implemented UI/UX review separately. Functional acceptance proves implemented behavior and outcomes through the intended application entrypoint against the real system. Implemented UI/UX review opens the built application and compares equivalent journeys and states with the approved specification and selected candidate across representative viewports. Mocks and prototype data may support bounded tests but establish neither.

Prototype approval proves neither implementation quality nor actual user outcomes. Implementation review is not user testing. Record actual user testing only when separately planned and performed. Do not claim UI implementation readiness when the applicable prototype review has not occurred, rendered inspection was blocked, an unresolved usability blocker remains, or the handoff lacks an implementation-review owner and evidence route.

## Implementation Fidelity

For selected human-facing delivery, the reviewed specification and selected candidate define the intended experience. Implementation adapts that experience into the chosen application stack, connects it to the real system, and proves both presentation fidelity and functional correctness.

- Match the selected candidate's navigation, layout, information hierarchy, typography, palette, density, controls, and interactions for the covered journeys and states.
- Adapt only for real content and data volume, responsive rendering across supported viewports, accessibility, stack mechanics that preserve the observable result, and details the specification explicitly leaves to implementation. Changing navigation, hierarchy, visual language, density, control types, or interaction sequence is redesign, not implementation discretion.
- For a state or detail the candidate does not illustrate, apply explicit blueprint requirements and the candidate's established patterns. Route an unresolved material choice or contradiction to its design owner instead of inventing behavior or changing the interface locally.
- Demo conveniences, simulated actors, seeded data, and reviewer controls are not implementation targets.
- Connect covered journeys to their real operations and sourced state through the Build Unit's existing `UI/UX Realization` and `Material Interaction Bindings`; do not create a separate screen-to-backend specification.

Apply this only to the selected human-facing delivery. Non-UI units need no prototype, and a slice need not complete unrelated journeys.

## Artifact And Prototype Constraints

The conditional artifacts are one concise `ui-ux/specification.md`, a simple `ui-ux/prototype.html` launcher, candidates under `ui-ux/alternatives/<candidate>/`, local supporting resources, and an optional per-candidate `slides.html` review slideshow. Each candidate has a linked HTML entrypoint and may contain multiple pages. The specification owns explicit selection, reviewed journey coverage, pending prototype changes with canonical/ticket references, and material limitations in its existing sections. Use journey anchors in the coverage table, review rows, pending rows, Build Units, and handoff coverage so selected-scope checks can match them. A review date or revision is optional context, not a baseline system. Use this one format; do not add legacy-format branches or migrate consumer blueprints as part of a skill change.

Once a direction is selected, record its actual candidate entrypoint in the specification and link it from the launcher, affected Build Units, and handoffs. Selection, approval of covered journeys, and completion of required coverage are separate claims. Retained unselected candidates need no continuous synchronization or full coverage and do not block readiness for a selected target. Exploring another candidate does not invalidate an approved target unless it is replaced or materially affected.

A reconciled prototype must use settled system behavior; exploration may contain explicitly labeled hypotheses, whose material contradictions must be resolved before reconciliation. It must cover representative primary journeys, consequential decisions, materially distinct states, recovery, and applicable cross-surface transitions; remain keyboard-operable and responsive; and avoid exposing internal identifiers, implementation terminology, raw transitions, or diagnostics by default unless the intended audience needs them for an informed decision.

Prototypes are portable static files by default. Sharing the existing `ui-ux/` folder lets a recipient open `prototype.html`, follow its links, and use each candidate without installing dependencies, running commands, building anything, or starting a server. Follow the portable module's [prototype mechanics](ui-ux/design-workflow.md#prototype-mechanics) for relative paths, local resources, classic scripts, demo data and state, and optional browser storage. Ordinary displayed URLs and user-initiated external navigation links are allowed. Runtime scripts, styles, fonts, media, fetches, imports, and other dependencies must not require a remote host. Do not require ShowMe, another optional plugin, a CDN, hosted runtime, network access, or a local server. The one exception is a server justified by a concrete requirement; record that requirement and how to run the prototype under Product And Demo Boundary. Do not add archives, bundles, duplicate exports, backups, portability manifests, statuses, or a separate packaging workflow. The one permitted derived export is the optional per-candidate `slides.html`, which follows the portable module's slideshow rules and adds no manifest, screenshot bundle, or status system.

The starter demonstrates mechanics, including persistent outcomes, cancellation, failure/recovery, reviewer separation, and reset. It is disposable: do not treat its product layout, typography, color, visual theme, information architecture, copy, or fictional delivery scenario as a product recommendation.

## Later Interface Changes

During active discovery, reconcile approved findings at coherent journey boundaries, tracing only material effects through affected canonical owners and dependencies. Distinguish selecting presentation from approving changed behavior.

Manual batching begins after the initial reviewed prototype is established. Later ticket resolutions update canonical requirements normally, including the affected specification requirements, and record pending prototype work under `Change Synchronization`; do not automatically edit or render the prototype. A ticket may finish with pending prototype work only when every other applicable completion requirement is satisfied and that work is recorded in the specification. Canonical write targets, verification, and reciprocal links remain required.

Review slideshows follow the actual prototype, never the ticket. Ticket-only changes update canonical requirements and pending entries without rendering or regenerating slides. When a candidate with a deck is updated or synchronized, refresh its affected captures in the same pass when possible; if that fails, keep its screenshots labeled outdated in the deck and beside its specification and launcher links. Keep deck-only limitations in explanatory prose, never in pending journey rows. A missing or stale optional deck does not by itself block prototype completion or delivery readiness; pending prototype changes and missing rendered review keep their existing effects.

An explicit prototype-change request already authorizes affected updates and inspection; no extra sync command or approval is needed. A synchronization request compares selected journeys against current canonical requirements, using pending entries as leads and history only to resolve ambiguity. An empty pending list does not prove freshness. Update and inspect only affected journeys, reconcile their owners and downstream routes, and clear only completed pending entries. Preserve pending work outside the selected scope. Broaden impact review only when a material shared navigation, authority, safety, accessibility, information hierarchy, or cross-surface change actually affects connected journeys. Selected-scope UI readiness requires relevant reconciliation and reviewed coverage; unrelated journeys need not be revalidated.

## Validation Limits

Run:

```sh
node <software-design-skill-directory>/scripts/validate-ui-ux-design.mjs --root <software-design-package>
```

The validator checks conditional artifact structure, explicit candidate selection, journey review and pending declarations, local entrypoints and supporting resources, and candidate interaction markers. All candidates receive basic structure and local-resource checks; unfinished unselected alternatives need no completed interaction coverage. Completion-level interaction checks apply to the selected candidate when review is declared or selected-scope readiness is checked. The launcher has no interaction-marker requirement. Selected-scope readiness checks reject relevant pending rows and require reviewed journey declarations. It does not prove coverage quality, comprehension, presentation quality, usability, accessibility conformance, implementation fidelity, or user-testing outcomes; review those semantically and through rendered inspection. Resolving local paths does not prove that a prototype works when opened from disk; only the direct-file check during rendered inspection shows that.

Review slideshows are classified separately from candidate pages. The exact `alternatives/<candidate>/slides.html` path and the `data-review-slideshow` marker are reserved: a deck cannot be the selected target or a candidate entrypoint, a marked deck under another name is rejected, and neither deck markup nor pages reached only through a deck count as product-interaction evidence. A present or linked deck must pass document, viewer-shape, caption and description, slide-order, embedded-screenshot, and self-contained-resource checks, and full validation requires its View slides button on the launcher, linking `slides.html#view`; an absent deck is valid. These checks cannot prove screenshot authenticity, fidelity, coverage quality, or freshness; open the deck from disk to inspect it.

When Node is available, the optional helper embeds captured PNG, JPEG, or WebP files and escapes text from a temporary JSON manifest, then refuses to write a deck that fails those checks:

```sh
node <software-design-skill-directory>/scripts/build-review-slideshow.mjs --manifest <temporary-manifest.json> --output <software-design-package>/ui-ux/alternatives/<candidate>/slides.html
```

The manifest supplies `title` (the alternative's name), `captured` (`YYYY-MM-DD`), `coverage`, `omissions`, optional `lang`, `notice`, and `prototype` (`href`, optional `label`), and `slides` listed in journey order with `image`, `viewport` (`desktop`, `tablet`, or `phone`), `role` (whose screen it is; optional only for `reviewer`), `part` (`journey`, `other`, or `reviewer`), `alt`, `caption`, and optional `note`; image paths resolve from the manifest's folder. The helper applies the portable module's fixed slide order, and the validator rejects a deck whose labels are missing or out of order. Delete the manifest and screenshots afterward. The helper is a convenience, not a requirement: a deck produced directly from the starter is equally valid.

## Explicit Verification Of JavaScript-Rendered Interactions

Static validation checks original HTML structure, local resources, disclosure and product/reviewer separation, and the presence of interaction markers. It strips script/style bodies before marker checks: JavaScript strings are not rendered elements. Static markers alone do not establish exercised behavior, usability, or human design approval.

For a selected candidate with JavaScript-rendered elements, explicitly capture `runtime-evidence.json` in that candidate directory. No structural validator launches a browser. Read `scripts/capture-prototype-runtime.mjs` and `scripts/lib/validation/prototype-runtime.mjs` for the capture API and receipt contract. The helper takes an already opened browser page with the Playwright-compatible `goto`, `locator`, `evaluate`, `waitForFunction`, `url`, `on`, and `off` methods; it neither installs nor launches a browser. Use an available browser/testing utility, or an equivalent explicit local capture route emitting the same observations. No agent, tool integration, or browser vendor is mandatory.

Example from a temporary driver outside `ui-ux/`, using a page supplied by your chosen browser utility:

```js
await capturePrototypeRuntime({
  page, uiRoot, candidateRoot, tool: 'browser utility and version',
  steps: [
    { page: 'alternatives/chosen/index.html', kind: 'action',
      selector: '[data-product-action]',
      setup: [{ action: 'fill', selector: '#name', value: 'Example' }],
      expected: { state: 'complete', outcome: 'Saved Example' } },
    // Also exercise next, cancel, recovery, and two distinct review targets.
  ],
});
```

Each step defaults to navigation to its candidate HTML page; `navigate: false` continues the current page. Optional `setup` consists of explicit `fill` or `click` actions and supplies no behavioral proof. A claimed action must click one visible enabled control carrying the standard marker (`data-product-action`, `data-next-step`, `data-cancel-action`, `data-recovery-action`, or `data-review-state-target`). Record before/after rendered DOM, actual browser page, visible active product state and product-outcome text, the clicked control's role/placement, and reviewer targets. The expected state and outcome must be observed after the click and a state/outcome transition must occur. Review controls must change the actual state to their distinct named targets and remain inside `details[data-prototype-reviewer]`, outside product content/navigation. Keep `data-review-state-target`; other project-specific attributes do not substitute.

The receipt's `prototype-runtime-observations` schema binds the exact candidate-relative path and a SHA-256 over candidate and shared UI resources, including HTML, scripts, styles, and runtime data. The conservative inventory includes all files under `ui-ux/` except the canonical `specification.md` review document, other alternatives, derived `slides.html`, and `runtime-evidence.json`; unrelated shared UI changes may therefore require recapture. Keep driver scripts and logs outside that tree. Symlink resources are rejected by this explicit route. Capture checks the same identity before and after exercise and records local browser resource requests. Remote requests, requests into another candidate, and attempts to load excluded review documents/decks as runtime inputs fail this narrowly scoped route; move genuinely shared runtime resources into the shared UI tree before capture. The default helper uses local file URLs; an equivalent route must establish the same local resource identity and browser-page association.

Missing evidence leaves static interaction checks in force. Supplied stale, mismatched, malformed, or failed evidence fails validation even when static markers exist. The validator requires all five interaction kinds, two distinct exercised reviewer targets, observed action/outcome transitions, capture provenance/time, and no browser diagnostics. A Boolean pass assertion, string matches in JavaScript, hidden/dummy controls, duplicate targets, or marker counts alone cannot satisfy the behavioral route. A failed capture replaces its prior receipt with failure diagnostics, preventing reuse of an old passing capture.

The receipt records browser observations, not an authenticated attestation: inspect the actual capture procedure and observations rather than authoring synthetic successful receipts. Structural receipt validation cannot establish that an untrusted transcript is truthful or that generic text changes implement the intended journey. Review observed outcomes against the canonical journey; retain concrete relevant evidence and limitations. Tests with synthetic observations test the validator only. Browser checks establish the exercised prototype transitions, not real backend integration, all journeys, visual quality, or human approval. Existing journey review/selection declarations and pending-work gates remain independent and mandatory.
