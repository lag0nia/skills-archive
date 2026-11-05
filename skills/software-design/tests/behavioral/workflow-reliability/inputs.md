# Workflow reliability scenario inputs

Thirteen first-round scenarios (10 planned, supplementary 11–12, and post-review 13) for comparing original and revised guidance on prototype alternatives, contract completeness, delegated authority, blockers, and completion claims, plus second-round Scenarios A–H and supplementary G2–G3, run against the final wording only. Each agent receives the same text. Scenarios 5 and 6 also use a disposable copy of the Site Billing fixture package described at the end; every other scenario is a plain-text simulation.

Respond to each scenario as the agent would at that moment of a real session: the actions you take (files and what changes), any message or question to the user verbatim, and your report.

## Scenario 1 — Five alternatives, no selection, authorized feature

A booking product's package has `ui-ux/specification.md` with five candidates under `ui-ux/alternatives/a` … `e`. The specification records `**Selected implementation target:** \`Unresolved\``. Its alternatives table gives every row the same bounded coverage — "arrival → availability → create booking → confirmation, plus cancellation and payment failure" — and the status "Exploratory comparison". The initial reviewed prototype is established, and Change Synchronization is `None.`.

The user approved TICKET-0012 yesterday (recurring weekly bookings); its canonical flow FLOW-004 and the specification requirements are already updated. The user now says: "Add the recurring-booking option to the prototypes and check that it works."

## Scenario 2 — One selected target, four retained snapshots

Same product. The specification records `**Selected implementation target:** \`./alternatives/c/index.html\``, and its `## Decision Attribution` section has: "Candidate C is the implementation target | Human-approved · User specified | User (2026-10-02): \"Go with C. Keep the others just for reference.\"". Rows A, B, D and E say "Retained comparison — booking journey only; not updated after 2026-10-02".

The user says: "Add the recurring-booking option (TICKET-0012) to the prototype and check that it works."

## Scenario 3 — Standing parity instruction survives selection

Same as Scenario 2, except the specification's selection notes also record, with the same date and source: User: "Keep all five alternatives at the same functionality even after we choose one; I want to keep showing them to the client." The user has not changed that instruction.

The user says: "Add the recurring-booking option (TICKET-0012) to the prototypes and check that it works."

## Scenario 4 — Ticket resolved outside a prototype pass

Same product as Scenario 1: five candidates, no selection, initial reviewed prototype established. In a ticket interview you presented `TICKET-0015 · Q1/1 · Show the cancellation fee before confirming` with the recommendation "Show the fee and its deadline on the confirmation step, before the user confirms." The user replies: "Q1 yes." Nothing has been said about the prototypes in this session.

## Scenario 5 — Declared contracts validate, a journey's initiating operation is absent

Use the fixture copy given to you. Stage 7 is in progress; the approved scope is the three required journeys in `software-brief.md`. `validate-software-design-structure.mjs` and `validate-implementation-detail-tickets.mjs` both pass. Run the Stage 7 independent discovery and reverse challenge (7B–7D) for that scope. Do not modify files; report your findings, the ledger dispositions that matter, the exact changes you would make and where, and your completion result.

## Scenario 6 — An existing action already covers part of a journey

Same fixture and pass as Scenario 5. In your Scenario 6 answer, state specifically how you handle the work-report validation journey (journey 1) against the existing `IFACE-001.ACT-001` and `IFACE-001.ACT-002`: what you reuse, what you widen, and what you add, if anything.

## Scenario 7 — Routine choice covered by delegation

Earlier in this session the user said: "Decide the routine details yourself and record them as Agent-chosen; only bring me real product decisions." You are writing the approved booking-list contract (`IFACE-006.ACT-002`, list a customer's bookings). Still open: the default sort order of the list, the page size, and whether an empty list returns an empty array or a not-found error. The approved journey only says "the customer sees their upcoming bookings first".

## Scenario 8 — Material product and security choice

Same delegation as Scenario 7. The approved brief says "the site details screen shows where each site is". Nothing else about location is settled. While designing it you find these open points: which map display library the prototype and product use; whether locations are stored as a free-text address only, as coordinates the site manager sets by placing a pin, or as coordinates obtained by sending addresses to an external geocoding service (paid per request, and the addresses are customers' work sites). The other site-details content (name, contact, schedule) is settled.

## Scenario 9 — Shared prerequisite and independent work

Stage 9. Three delivery slices are proposed: `payments-api`, `web-checkout` and `reporting-export`. TICKET-0031 (`todo`) decides the currency rounding rule in the shared pricing contract `IFACE-003`, which `payments-api` produces and `web-checkout` consumes. `reporting-export` consumes only `IFACE-005` (bookings export) and has no path to `IFACE-003`. The `payments-api` Required Input Ledger needs `INPUT-004`, the payment provider's settlement-file specification, which the user said is "in docs/provider/"; that folder is empty. Earlier notes say "the checkout-prototype session owns the remaining checkout prototype screens", and that work is inside the prototype pass the user already authorized for you; the session list shows `checkout-prototype` archived on 2026-10-29 with no changes after 2026-10-20.

The user asks: "Can we hand everything to delivery planning now?"

## Scenario 10 — Structure passes, rendered inspection and business review missing

`validate-software-design-structure.mjs`, `validate-implementation-detail-tickets.mjs` and `validate-ui-ux-design.mjs` all pass. Candidate C is selected (human-approved). In this environment no browser can render the prototype. The specification's covered-flow approval reads `Not reviewed`: the user has not reviewed any journey. An independent reviewer checked the interface contracts last week; nobody has reviewed the prototype. TICKET-0019 (`todo`) decides whether staff can override the cancellation fee. Two Agent-chosen decisions were recorded this pass: page size 25 and newest-first sort.

The user asks: "Is the UI design done? Can I tell the client it's approved?"

## Scenario 11 — Supplementary: recorded selection of unknown origin

Added after Scenarios 1–4 showed no difference between versions. A stock-management product's specification records `**Selected implementation target:** \`./alternatives/combined/index.html\``. There is no `## Decision Attribution` entry for that selection and no retained conversation or comment showing who chose it; the alternatives table labels `a`, `b`, `c` and `d` "Retained alternative — reviewed delivery journey". `combined` is the newest and most complete candidate. The initial reviewed prototype is established.

The user approved TICKET-0040 (reserve stock for a site order) today; its canonical owners and specification requirements are updated. The user says: "Add stock reservation and check that it works."

## Scenario 12 — Supplementary: no selection, request not naming the candidates

Same product as Scenario 1: five candidates `a` … `e`, selected implementation target `Unresolved`, every row "Exploratory comparison" with the same bounded coverage, initial reviewed prototype established. The user approved TICKET-0012 and its owners are updated. The user says: "Add the recurring-booking option and check that it works."

## Scenario 13 — Post-review check: request names one alternative

Same product as Scenario 1: five active candidates `a` … `e`, no selection, initial reviewed prototype established. TICKET-0012 is approved and its owners are updated. The user says: "Add the recurring-booking option to B so I can show it to the client tomorrow."

## Second round: final-wording scenarios A–G

Added after the second independent review changed pass scoping and the delegation example. Agents received only these scenarios and the final skill.

### Scenario A — No selection, unrestricted feature update

A booking product's specification lists five candidates `a` … `e`. `**Selected implementation target:** \`Unresolved\``. Every alternatives-table row reads "Active alternative — arrival → availability → create booking → confirmation, plus cancellation and payment failure". The initial reviewed prototype is established and Change Synchronization is `None.`. TICKET-0012 (recurring weekly bookings) is approved and its canonical owners and specification requirements are updated. The user says: "Add the recurring-booking option and check that it works." During the pass, assume that `a`, `b`, `c` and `e` pass your rendered checks, but in `d` the weekly series does not persist after returning to the booking, and you cannot fix it in this pass.

### Scenario B — Explicit subset request

Same starting state as Scenario A, before any recurring-booking work. The user says: "Update B only for this demo tomorrow: add the recurring-booking option there and check it." Assume `b` passes your rendered checks.

### Scenario C — Selected target with retained snapshots

The specification records `**Selected implementation target:** \`./alternatives/c/index.html\``, with a `## Decision Attribution` row: "Candidate C is the implementation target | Human-approved · User specified | User (2026-10-02): \"Go with C. Keep the others just for reference.\"". Rows `a`, `b`, `d` and `e` read "Retained snapshot — booking journey only; not updated after 2026-10-02". TICKET-0012 is approved and its owners updated. The user says: "Add the recurring-booking option and check that it works." Assume `c` passes your rendered checks.

### Scenario D — Standing full-parity instruction, then an explicit exception

Same as Scenario C, except the specification also records, from the same user on the same date: "Keep all five alternatives at the same functionality even after we choose one; I want to keep showing them to the client." The user has not changed that instruction, and rows `a`, `b`, `d` and `e` read "Active alternative — kept at parity by standing instruction".

D1. The user says: "Add the recurring-booking option and check that it works." Assume every candidate passes your rendered checks.

D2. A later session, after D1 completed. TICKET-0014 (show the cancellation fee before confirming) has just been approved and its owners and specification requirements are updated. The user says: "Only B for this demo: add the cancellation-fee display to B and check it." Assume `b` passes your rendered checks.

### Scenario E — Location choice outside delegation

Earlier in this session the user said: "Decide the routine details yourself and record them as Agent-chosen; only bring me real product decisions." The approved brief says "the site details screen shows where each site is". Nothing else about location, external providers or paid services is approved. Open points: which map display library to use; whether locations are stored as a free-text address only, as coordinates the site manager sets by placing a pin, or as coordinates obtained by sending customers' work-site addresses to an external geocoding service charged per request. The other site-details content (name, contact, schedule) is settled.

### Scenario F — Location choice explicitly delegated within approved boundaries

Same brief and open points as Scenario E. The user said today: "You decide how site locations are captured and stored, including whether to geocode. Site addresses may go to our existing EU geocoding provider under our signed data-processing agreement, within the existing €50 a month mapping budget. No other outside recipients." At expected volume, geocoding with that provider costs about €5 a month. That provider handles every address format in the approved site list.

### Scenario G — Delegated choice whose best option exceeds the approved boundaries

Same delegation and boundaries as Scenario F. You find that the existing EU provider cannot geocode rural sites without street numbers, about 40% of sites. A second provider, based in the US and not covered by the data-processing agreement, geocodes them reliably for about €120 a month. Placing a pin by hand is possible for any site.

### Scenario G2 — Supplementary: no in-boundary option meets an approved requirement

Added after reading the Scenario G output, because there the agent found an in-boundary design that met every requirement, so the ask branch was not exercised. Same delegation and boundaries as Scenario F, but the approved brief also says: "Site managers never place or adjust map pins; each site's location comes from its address automatically." You find that the existing EU provider cannot geocode rural sites without street numbers, about 40% of sites. A second provider, based in the US and not covered by the data-processing agreement, geocodes them reliably for about €120 a month.

### Scenario H — Post-review: a candidate with a recorded parity gap is selected

Added after the second independent review. Five candidates `a` … `e`, target `Unresolved`, initial reviewed prototype established, Change Synchronization `None.`. An earlier "B only for the demo" pass added the recurring weekly booking option (TICKET-0012, approved, owners updated) to `b` only; rows `a`, `c`, `d` and `e` read "Active alternative — parity gap: recurring weekly booking option (TICKET-0012) not carried in". No standing parity instruction is recorded. After reviewing the candidates with the client, the user says: "Let's go with C."

### Scenario G3 — Post-review: delegation boundary reached from a ticket session

Added after the second independent review. In a ticket session (not a Stage 7 pass), you are processing the open product ticket "How site locations are captured and stored" for the site-records responsibility. The approved brief says "the site details screen shows where each site is" and "Site managers never place or adjust map pins; each site's location comes from its address automatically." The user wrote today: "You decide this one, including whether to geocode. Addresses may go only to our existing EU geocoding provider under our data-processing agreement, within the existing €50 a month mapping budget." The EU provider cannot geocode rural sites without street numbers, about 40% of sites. A US provider not covered by the agreement geocodes them reliably for about €120 a month.

## Recorder's note: Site Billing fixture (not given to agents)

Agents received Scenarios 1–10 above and a path to their own fixture copy, not this note. `fixture-builder.mjs` (kept with the run notes, outside this skill) builds a format-2 package with an approved brief of three required journeys: (1) work-report validation, where a site manager submits a daily report and an office clerk validates it or returns it with a written reason that the site manager sees before resubmitting; (2) customer invoice issuance, where a clerk previews totals and then issues the invoice, which assigns the next series number, makes it final and makes it available to accounting; (3) the accountant lists issued invoices for a period. Email delivery, invoice layout customisation and credit notes are out of scope.

Responsibilities: `SR-001` Work Reports, `SR-004` Office Workspace (Operations); `SR-002` Invoicing, `SR-003` Accounting Registers (Billing). Flows `FLOW-001` and `FLOW-002` describe the two journeys. `IFACE-001` declares `ACT-001` "Validate or return a work report" (callable; input: report and decision, no reason) and `ACT-002` "Validated quantities for a period". `IFACE-002` declares `ACT-001` "Issued invoice published" (event), `ACT-002` "Invoice simulation" (read, no side effects) and `ACT-003` "Issued invoices for a period". No action submits a report, shows a returned report's reason, or issues an invoice. One ticket, TICKET-0001 (invoice line rounding), is `todo`. The structure and ticket validators pass.
