# UI/UX Design Workflow

## Objective

Create the smallest coherent interface that lets the intended user understand their situation and complete their task. Use clear structure, familiar controls, meaningful labels, and progressive disclosure. Every visible element should support the current task or an informed decision.

Smallest does not mean empty, visually sparse, or constrained by arbitrary word, button, destination, or screen counts. Preserve the costs, risks, deadlines, consequences, accessibility support, and recovery guidance an intended user needs. Apply the objective to consumer and operator interfaces according to the audience's actual knowledge and responsibilities.

## Inputs And Boundaries

Start from known user and task context and approved account, role, product, and system constraints. Establish only the prerequisites needed for the bounded exploration; explicit hypotheses may help answer open material questions before those answers are approved. Reuse upstream UI/UX decisions and supplied references rather than recreating them. The design artifacts own presentation and interaction requirements; established product and technical contracts continue to own behavior, authority, state, security, failure meaning, and recovery.

Keep prototype conveniences visibly separate from the product. Fake actors, scenarios, fixtures, simulated time, and seeded data must not become permanent roles, navigation destinations, or product guarantees.

## Establish The Rationale

Before expanding a representative flow, capture a few concrete sentences or compact entries in the specification:

- what the intended user is trying to accomplish;
- their starting context and next meaningful action;
- what they need now, what becomes relevant later, and what is optional detail; and
- which familiar interaction pattern fits the task and why.

This is design reasoning, not a questionnaire or approval gate. Resolve reversible details with a reasonable default. Apart from the compact prototype-choice question below, ask only when an unresolved answer changes the task, authority, informed decision, accessibility, or recovery.

## Discover And Review A Visual Direction

First identify the design questions that need visual evidence from the intended audience, tasks, and interaction needs: for example task discovery, navigation, density, decision support, or recovery. Do not search only by industry, select a whole application to copy, or research alternatives when the user has already supplied or approved a suitable direction. When a supplied reference leaves a material ambiguity, clarify only that ambiguity.

When no suitable direction is already approved, use available search or browser capabilities to inspect a small candidate set. Prefer:

- user-provided references;
- comparable products for the relevant domain interaction;
- adjacent products whose interaction pattern fits the task better; and
- actual product screens and accessible flows over marketing pages or decorative mockups alone.

Evaluate observable task discovery, navigation, language, information density, hierarchy, decision information, and recovery. Preserve the current product's behavior, authority, and security constraints. Popularity, branding, visual attractiveness, or an established user base does not prove usability.

Present a small visual shortlist in the existing direction review. Recommend one coherent primary direction and, when useful, one or two alternatives; do not assemble unrelated layouts from many products without justification. Show relevant screenshots or other directly inspectable visual evidence. For each reference, briefly identify:

- the screen or interaction being considered;
- why it fits the intended user and task;
- what to adopt or adapt; and
- what to avoid or cannot transfer.

Prefer browser captures of accessible product screens. When direct access is unavailable, use attributable official documentation screenshots or product walkthroughs with source links. Distinguish a directly inspected flow from a published screenshot, promotional image, or inferred behavior. Never fabricate reference screenshots or claim an interaction was tested when only images were available.

Do not require a particular browser, plugin, research service, or account. Do not create accounts, purchase access, or bypass restrictions for reference discovery. If visual capture or access is unavailable, provide source links and state the limitation. Actual screenshot files belong in the consumer project's existing allowed artifact location, not this reusable module.

Before expanding a prototype, ask once whether the recommended clarity, density, interaction, and visual qualities match the user's expectations when no suitable direction was already approved. Approval applies to those specific qualities, not wholesale copying. This remains part of the existing direction review: do not ask for approval per reference, wireframe, screen, or routine detail, and reuse the approved direction unless a material change warrants reconsideration.

Stop when there is enough evidence to recommend a direction. Two or three references will often suffice, but there is no quota, exhaustive competitor audit, separate report, or dependency on unavailable research tools. If no suitable reference can be found, explain the limitation and propose familiar interaction patterns rather than forcing a weak example. Record only the selected references, evidence type, relevant qualities, transfer limitations, and direction-review outcome briefly in the existing specification.

### Choose Prototype Count And Directions

Before creating new prototype candidates, reuse any count or directions the user already supplied; ask only for missing information. When both are missing, ask one compact question:

> How many prototype directions would you like—one, two, three, or another number? Do you have directions in mind, or should I propose meaningfully different approaches?

If only the count is missing, ask only the count part; if only directions are missing, ask only the directions part. If both are supplied, proceed without repeating the question. Accept any reasonable user-requested count without a fixed quota. When the user leaves directions unspecified or asks you to propose them, propose a concise set matching the agreed count in the existing direction review. Differentiate candidates through navigation, interaction sequence, information hierarchy, density, or visual style—not merely colors. Reuse supplied directions and explicitly identify any proposed behavioral differences while preserving canonical constraints; selecting a visual direction does not approve changed behavior.

When [review slideshows](#optional-review-slideshows) are possible and no yes/no preference is known, treat that preference as one more part of this choice: add “Would you also like a browser slideshow of the important screens and states inside each alternative's folder?” to the question, or, when count and directions are already known, ask only that sentence. Omit it when capture capabilities are unavailable, and reuse any known answer.

Skip this question when updating or synchronizing an existing selected prototype unless the user requests new alternatives; then reuse known preferences and ask only for missing information. This choice belongs to the existing direction review, with no separate approval cycle, tracking artifact, or status model.

## Explore Structure Before Expensive Prototyping

When navigation, grouping, information priority, or page layout is still uncertain, show a compact ASCII or text wireframe directly in the conversation before investing in HTML. Use realistic destination and action labels, distinguish navigation from content groups, and make the primary action and decision-critical information visibly prominent. Briefly explain the structural choice and its tradeoffs.

Offer multiple wireframes when materially different structures would help the user decide or when the user requests them. Vary navigation, grouping, sequence, or information emphasis—not merely labels, colors, or decoration. A wireframe tests structure only; it does not demonstrate styling, responsive quality, accessibility conformance, or working interactions. It requires no plugin, special skill, HTML file, or permanent artifact.

Reference comparison, wireframe comparison, and prototype-direction review are one bounded design conversation, not three approvals. The user may choose from wireframes, request HTML alternatives without first selecting a wireframe, or proceed directly when the direction is already clear.

## Compare HTML Alternatives When Useful

Create the agreed number of candidates from the prototype-choice step without requiring a prior wireframe choice. Use the same bounded representative journey and comparable states across candidates so comparison is fair. Initially build only enough of each candidate to compare directions, then expand the selected candidate unless the user requests broader comparison.

Preserve any existing prototype while exploring another direction. Alternatives may change presentation, navigation, grouping, sequence, or interaction treatment, and must preserve decision-critical information. Explicitly label any behavior hypothesis and its canonical contradiction; selecting its visual direction does not approve changed behavior. Resolve material contradictions through their owners before claiming reconciliation.

Keep these statuses distinct:

- an **exploratory alternative** is a bounded comparison candidate;
- the **selected direction** is the chosen presentation and interaction approach;
- **covered-flow approval** applies only to the flow and states actually reviewed; and
- **required prototype coverage complete** means the selected prototype covers the agreed material journeys and states.

Selecting a direction does not approve unreviewed screens or establish delivery readiness. Before selection, record the choice as unresolved rather than treating the newest file as selected. Candidates live under `ui-ux/alternatives/<candidate>/` and may have one or multiple local pages. After selection, record its actual entrypoint in the specification; `ui-ux/prototype.html` remains a simple launcher and selection requires no copying. Retained candidate folders under `ui-ux/alternatives/` are clearly named comparisons with their bounded coverage and review status recorded in the specification; they need not stay synchronized or gain full coverage. Exploring another direction does not invalidate an existing approved target unless the user replaces it or a material change affects its validity.

## Shape The Representative Flow

Begin with one task flow showing arrival, task discovery, a meaningful action, and its persistent result, plus representative cancellation and failure/recovery. Derive navigation from user purposes rather than components, protocol transitions, personas, or coverage inventories. Each destination needs a distinct purpose and a label the intended audience understands.

Place information at the decision it supports:

- show needed-now information in the current task context;
- defer information that becomes useful only at a later action;
- make optional or advanced detail deliberately available; and
- show material costs, restrictions, risks, and deadlines as soon as they affect a selection, before avoidable data entry, and confirm the final total and consequences before submission.

Use familiar controls and interaction sequences when they fit. Novelty is not a design objective. Explain unfamiliar concepts and genuine consequences where needed, but do not translate a technical identifier into an equally confusing technical paragraph.

## Fix Structure Before Explanation

When a screen needs substantial instructional text, first reconsider its navigation, grouping, labels, controls, and interaction sequence. Do not compensate for unclear design with explanatory cards, repeated summaries, badges, or paragraphs narrating obvious actions.

Perform a bounded subtraction and plain-language review. Remove or move elements that do not help the current task or an informed decision: redundant summaries, repeated statuses, unnecessary badges, duplicate actions, premature detail, and internal terminology. Retain information when removing it would hide a real consequence, risk, cost, deadline, state distinction, accessibility cue, or recovery path.

## Review The Direction Before Expanding Coverage

Exercise the representative flow before extending its patterns to other material journeys and states. Review two distinct qualities:

- **Comprehension:** Can an intended user who has not read the source material understand the product's purpose, discover their task, identify the next meaningful action, and understand its consequences without the designer explaining the interface?
- **Presentation:** Are typography, spacing, proportions, alignment, hierarchy, density, controls, and responsive behavior coherent and deliberate for the audience and context?

Exercise realistic actions rather than generic state switches. Confirm that results persist when the user returns. Cancellation before submission may preserve the prior state; closing or cancelling the interface after submission must not imply reversal. Offer direct retry only when failure with no effects is established and retry is safe. When the outcome is unknown, preserve context and check the existing operation before allowing a potentially duplicate submission. Verify the prototype against the specification, including representative responsive and keyboard behavior.

Fix material problems in this flow before reusing its navigation, structure, language, and visual treatment. Extend coverage with representative patterns rather than enumerating every state combination or duplicating the same interaction.

Rendered inspection is required when tooling is available. Perform it by opening the launcher directly from disk, as a recipient would, rather than through a local server preview unless a recorded requirement justifies one. Follow the affected navigation and exercise representative interactions, including role switching when applicable; this is the same review, not an additional cycle. When the prototype uses storage, include blocked storage reads and malformed stored data in this affected-interaction review; with valid link-transferred state where applicable, confirm that state survives and the demo remains usable. Relative paths alone do not prove that interactive behavior works, and a static snapshot or a copy rendered under another URL scheme is not a direct-file check. If rendering or opening from disk is blocked, report the limitation and do not claim visual or portability verification. An agent walkthrough is a heuristic review, not evidence of actual user testing. Structural checks can verify files, links, and markers; they cannot establish comprehension, presentation quality, accessibility conformance, or usability.

## Prototype Mechanics

Build prototypes as portable static files by default. A recipient given the existing prototype folder opens its launcher, follows its links, and uses the demo without installing dependencies, running commands, building anything, or starting a server:

- Use relative links and resource paths that stay inside the prototype folder, local CSS and assets, and ordinary browser JavaScript in classic scripts.
- Avoid unnecessary HTTP dependencies, runtime package or CDN dependencies, module loading, and fetching local data files; browsers commonly block modules and local fetches in pages opened as files. Keep demo data in ordinary JavaScript.
- Ordinary displayed URLs and user-initiated external navigation are acceptable; runtime scripts, styles, fonts, media, fetches, imports, and other dependencies must not require a remote host.
- Keep demo state in memory by default; persistent demo progress is not required unless requested. Browser storage is optional and must fail harmlessly, so the demo still works when storage is unavailable, empty, or isolated. Separate pages opened as files may not share storage, so a multi-page or role-switch demo must not depend on it. Preserve the intended state the simplest suitable way, such as switching roles or views within one page, or carrying the needed state in the link to the next page.
- Isolate optional storage access and stored-data parsing failures from link-state parsing and application. Blocked storage reads or malformed stored data must not discard valid state transferred in a link or prevent the demo from operating; do not put them in a shared catch-all that resets valid link state.
- Build `ui-ux/prototype.html` from the [launcher starter](templates/prototype.html) and keep its static design so every launcher looks and works the same: one card per candidate with its name, one sentence describing the direction, and one button per entry page labelled by role or purpose; a Selected tag only on the selected candidate; and a View slides button once that candidate has a deck.
- Use a server only when a concrete requirement needs one, such as a browser capability unavailable to files, and record that requirement and how to run it as a prototype limitation. Portability needs no archive, bundle, export copy, or packaging step: the existing folder is what gets shared.

Put scenario selectors, fake-actor switches, direct state controls, coverage notes, prototype explanations, and reset controls in one clearly labeled, collapsible reviewer area outside product navigation and content. Use one unambiguous prototype disclosure outside the product surface. A notice required by a runnable demo is separate product content and must come from the product's own requirements.

Cover the smallest representative set needed to review the experience: primary journeys, main routes, consequential decisions, materially different empty/loading/waiting/success/error/recovery states, meaningful first-time or returning-user differences, and cross-surface transitions. Preserve accessible semantics, keyboard operation, focus visibility, labels, contrast, touch and zoom support, and applicable reduced-motion behavior.

## Optional Review Slideshows

A review slideshow is an optional, derived reading aid: one self-contained `slides.html` inside a candidate's folder that shows real screenshots of that candidate's important views and states in a coherent sequence. It opens directly from disk, keeps working when copied alone, and needs no presentation software, hosting, or network. It is neither a prototype nor a combined deck across candidates. Produce one per candidate only when the user opted in and capture is possible; slides are never a prerequisite for prototype work.

### Check Capture Capabilities

Before offering or producing slides, confirm that the environment can:

1. render the actual candidate under its supported entry mode;
2. navigate or drive it to the required states;
3. capture screenshots as saved image bytes that can be embedded; and
4. write the finished HTML and reopen it for inspection.

Use whatever supported capabilities are available; do not infer screenshot export from a tool's name. A screenshot that is only displayed and cannot be saved or embedded does not qualify. When support is uncertain, run a minimal check, reusing the first representative prototype inspection where possible. Do not install software, create accounts, use an external service, or require another plugin to obtain these capabilities. When one is missing, state briefly which one and skip slides while continuing all feasible prototype work. Rendering may be possible when image export is not: missing export affects only slides, while missing rendering still prevents any visual-review claim.

### Reuse The Preference

Reuse any yes/no slideshow preference already given, and ask only through the [prototype choice](#choose-prototype-count-and-directions) when creating new candidates. A yes authorizes slides for the agreed candidates with no approval per capture or file. No answer is not a yes: continue independent work and do not enable slides silently. When no preference is recorded, ordinary updates to an existing prototype do not raise the question; a new-candidate choice or an explicit slide request can establish it. Record the preference, or why slides were skipped, briefly in the specification.

### Capture The Actual Candidate

Capture only after rendering and exercising the actual candidate, reusing the existing review walk where possible. By default include the important implemented views and materially distinct states of the agreed comparison journey, with relevant roles and representative responsive differences; expand only on request. Use the same representative task, fixture data, states, and viewport sizes across candidates where their supported coverage permits, so decks stay comparable.

- Reach states through working interactions or clearly identified existing reviewer controls. Do not rewrite product behavior, add states, or change runtime requirements for capture; a prototype with a documented server requirement keeps it, while its deck still opens offline.
- Include role changes and consequential dialogs, waiting, outcome, cancellation, and failure/recovery states that actually exist. Never manufacture missing states, generate or reconstruct screens, frame live pages, or reuse another candidate's screenshots.
- Wait for a stable view, with fonts loaded, animation settled, and overlays placed, and isolate or reset demo state between roles and scenarios.
- Keep interface text readable: split a long page into segments or add detail views rather than shrinking it onto one slide, and choose capture dimensions and encoding that stay legible without needlessly large files.
- Preserve exploration labels and unresolved limitations the candidate shows. Images do not demonstrate interactions or usability; do not infer either from them.

Screenshots and any generation inputs are temporary working files. Keep them outside the shared prototype folder and discard them after embedding; the deck is the only artifact.

### Build The Deck

Start from the [slideshow starter](templates/slides.html), populating it directly or with any reliable local embedding method, and save it only as `ui-ux/alternatives/<candidate>/slides.html`. Keep the starter's presentation design and script unchanged so every deck looks and works the same: a short cover with the candidate's name and one cover image that opens a full-window viewer, with details collapsed under "About these screenshots". Fill only its marked title, notice, about, and slide regions. The deck:

- orders slides by one fixed rule, never by capture time or preference, so a viewer can follow one experience at a time:
  1. every desktop capture first, then tablet, then phone, classified by the capture's CSS viewport width (desktop 1024 px and wider, tablet 600–1023 px, phone below 600 px);
  2. within each viewport, one role at a time: every screen that role sees before the next role's, with roles in the order they first act in the journey and the same order in every viewport; a surface with a single role has a single section;
  3. within each role, its main journey in the order that role meets it, including the waiting states that show where another role takes over, then its other product screens outside that journey;
  4. prototype-only reviewer or demo tools last in each viewport.

  Label every slide with its viewport, role, and part so the order is checkable. Include a state only when something visible changes, and in narrower viewports only screens whose layout differs meaningfully;
- gives every slide a short visible caption saying in plain words what is happening on that screen, plus a screenshot description as alternative text; the viewer already shows the viewport, role, and step, so captions need not repeat them;
- records the capture date, what is shown, and what is omitted, with a visible notice when capture is partial;
- keeps the viewer essentials: document title and language, responsive viewport, semantic main content, keyboard-operable Previous and Next buttons, arrow-key navigation, a current/total indicator, visible focus, fitted images with an accessible way to inspect detail at full size, consistent first and last boundaries, and support for a single slide; the screenshot sequence stays readable without scripting and needs no animation; and
- embeds every screenshot, style, and classic script, with no fetches, module imports, CDNs, external fonts, external images, frames, or embedded running prototype.

An optional link back to the candidate is navigation only: it may work only beside the full candidate folder, and standalone viewing must not depend on it. If no screenshot can be captured, create no deck. Never deliver or link an unpopulated starter, and never claim a complete deck after a partial or failed capture.

Open the finished deck directly from disk and check its sequence, controls, captions, and readability before reporting it. Structural checks cannot establish screenshot authenticity, fidelity, coverage quality, or freshness.

### Link And Maintain

Once a candidate's deck exists, add a View slides button to that candidate's card in the launcher, linking `slides.html#view` so it opens straight into the viewer; closing the viewer returns to the launcher. Never add the button before the deck exists, and keep the candidate's interactive links intact. During authorized work on a candidate that has a deck, regenerate its affected captures in the same pass unless the user declines; retained candidates that are not being changed need no automatic deck maintenance. If a refresh fails, keep the existing screenshots but mark them visibly as outdated with the limitation, in the deck and beside its links. Never present old images as current.

A deck never selects a candidate, approves covered flows, reconciles exploratory behavior, or establishes implementation fidelity, accessibility conformance, or user testing. Rendering, interaction, and presentation review remain required independently of slides.

## Bounded Changes

When an approved change affects the interface, update its behavior owner first if behavior changed, then update the affected specification requirements. Update and inspect prototype states during active discovery or explicitly requested prototype work. After the initial reviewed prototype, later approved changes record affected journeys and canonical references as pending work in Change Synchronization without automatically editing or rendering. Reopen the broader direction only when the change alters the main journey, shared navigation, information hierarchy, safety, accessibility, or a cross-surface contract.

## Discovery And Later Synchronization

During active discovery, reconcile approved findings at coherent journey boundaries. Trace material impacts through only affected canonical owners and dependencies. Bounded sketches and explicitly labeled hypotheses may help discovery, but unresolved material contradictions cannot support a reconciled-design claim.

After the initial reviewed prototype is established, batch later prototype work manually: update canonical requirements and record affected journeys and canonical references in the specification’s existing Change Synchronization section without automatically editing or rendering. An explicit prototype-change request authorizes affected updates and inspection without another synchronization command or approval. For synchronization, compare selected journeys against current canonical requirements; pending entries are leads, and an empty list is not proof of freshness. Consult history only for ambiguity. Inspect only affected journeys, preserve unrelated pending work, and record reviewed coverage and material limitations. A date or revision may help but is optional. Recording pending work regenerates no slides; when a candidate's actual prototype is updated, [maintain its deck](#link-and-maintain) in the same pass.
