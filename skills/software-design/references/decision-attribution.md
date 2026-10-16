# Decision Attribution

Read this reference when recording an answer, part of an answer, or another meaningful design decision, resuming an open ticket, interpreting whether the user approved a choice, revising a settled decision, backfilling or migrating settled history, reconciling expert or GitHub input, or generating the decision overview. Attribution records who chose a decision so that an agent's choice is never mistaken for one the user personally approved. It adds no approval step, ticket status, or decision registry, and it does not limit normal autonomy.

## Contents

- Categories
- What To Attribute
- Interpreting Approval
- Evidence
- Recording
- Conditions
- Changing A Settled Decision
- Handback
- Decision Overview
- Existing Packages And Other Routes

## Categories

| Category | Serialized origin | Meaning |
| --- | --- | --- |
| Human-approved · User specified | `human-approved/user-specified` | The user stated the choice. |
| Human-approved · Agent recommended | `human-approved/agent-recommended` | The agent presented this choice clearly and the user approved it. |
| Agent-chosen | `agent-chosen` | The agent selected the approach while carrying out the task; the user did not specifically select or approve this exact choice. |
| Unknown origin | `unknown-origin` | The record cannot establish who chose it. |

A label grants no authority; the evidence beside it establishes the origin. Both human-approved subtypes receive the same protection under [Changing A Settled Decision](#changing-a-settled-decision).

## What To Attribute

Attribute meaningful design decisions: a ticket answer, or a choice that sets behavior, authority, state, an interface, data, security, funds, operations, verification, or scope. Wording, layout, formatting, file organization, and routine implementation within settled contracts need no attribution.

An unanswered recommendation, or the unanswered part of one, remains a proposal and carries no attribution; it is neither a decision nor of unknown origin.

## Interpreting Approval

This extends the [Approval Semantics](checkpoint-workflow.md#approval-semantics), which keep governing when files may be written. Read approval from the surrounding exchange and the choice actually presented, never from special keywords.

- A plain “yes, do that” to a clearly presented recommendation approves that recommendation: Human-approved · Agent recommended. A choice the user states in their own words is User specified, including a correction the user dictates.
- Approval covers what was presented. General permission to proceed (“go ahead”, a stage `approve`, a migration authorization) personally approves only the consequential choices clearly presented with it; choices made afterward while doing the work are Agent-chosen.
- Approving a presentation, wording, visual direction, or document approves that presentation, not the product behavior underneath it.
- “Handle it; I trust you” authorizes your judgment within the task. The specific choices made under that discretion remain Agent-chosen; record them and continue without asking.
- Discretion never lowers a requirement. Authority over the details covers how to meet a consequential requirement the user stated, never settling for a materially weaker guarantee. When it cannot be met as stated, keep the requirement in the user's words, with its attribution, on its ticket held open under [Parts of an open question](#recording), and never describe the design as meeting it. Explain the specific limitation and make the closest alternative that ticket's remaining question; the alternative stays a proposal until the user accepts it. Continue the work that does not depend on that choice, and do not ask again about what the user already clearly authorized.
- When a reply clearly settles one meaningful part of a question and leaves another open, record the settled part now under [Parts of an open question](#recording) and ask only about the rest.
- Take a clear approval at its word without guessing how much the user understood. The safeguard is the presentation: make each consequential recommendation understandable, naming the choice, its essential tradeoff, and what it changes.
- When a reply is ambiguous about a consequential choice, ask one focused question about the ambiguous part. Keep the clear parts approved; never request blanket reapproval. Ordinary autonomous work proceeds without questions.
- An entry covers only what its evidence shows. A User specified or Agent recommended entry holds just what the user stated or approved. When you carry out an instruction, record what it leaves open separately: an earlier decision you keep relying on stays in its own entry within its original scope, so an approved maximum is not approval of that value as a new fixed setting, and a value or mechanism you select is Agent-chosen. A caveat in your reply never corrects a saved label.
- Approval comes from the user. Expert answers, consultation documents, another collaborator's comment, editorial reconciliation, and your own summaries are evidence or advice. When the user approves an expert-backed recommendation you presented, record Agent recommended and name the expert input in the evidence.
- Existing prose such as “Approved 2026-09-28” or “User answer” is a historical claim to inspect, not proof of either human-approved subtype. Use a human-approved category only when the cited evidence shows the user's choice or approval; otherwise record Unknown origin.

## Evidence

Prefer a usable source reference: a GitHub comment URL, a consultation document, a section of the software brief, or a retained transcript. When the original conversation will not remain accessible, keep a short contextual excerpt in the evidence: the proposal as presented, then the user's response, with the parts that matter for the choice.

- Use quotation marks only for verbatim words, and name the speaker. Label any paraphrase as your summary; a summary is context, never a quote or independent proof.
- Never fabricate quotes, message references, dates, or approval history. A missing fact stays missing.
- Agent-chosen evidence names what authorized the work and why the choice was yours, for example “chosen while writing the fee rule; the user asked the agent to settle the remaining fee details”.
- Unknown-origin evidence names what was inspected, for example “resolution cites a migration authorization; no record of the user selecting this convention”.

## Recording

Record attribution once, in the record that owns the decision, at the same time the decision is recorded or materially changed. Require it for every new or materially changed meaningful decision; add it to historical decisions only when evidence supports it.

**Ticket answers.** A ticket owns the attribution for its decisions in the optional `attribution` field, an inline array of entries. On a `decided` or `finished` ticket the entries cover its resolution:

```yaml
    attribution: [{"decision": "Retry a missed repayment once after three days, then move the loan to manual review.", "origin": "human-approved/agent-recommended", "evidence": "Agent proposal (2026-10-14): retry once after three days, then manual review; the alternative was daily retries. User reply: \"Yes, provided borrowers can recover their funds.\"", "conditions": ["Requirement: A borrower can always withdraw funds that are not owed, including during manual review."]}, {"decision": "Round late fees down to the cent.", "origin": "agent-chosen", "evidence": "Chosen while writing the fee rule under the user's instruction to settle the remaining fee details.", "conditions": []}]
```

Each entry has `decision` (the specific decision covered, readable on its own), `origin`, `evidence`, and optional `conditions`. Name package files in evidence as package-relative backticked paths, the way `write_targets` do. Validation rejects attribution on `out-of-scope` tickets.

The entries are authoritative, and the `resolution` must agree with them. When its parts have different origins, state the outcome neutrally or name each part's origin as its entry does; never introduce the whole answer as the user's decision.

**Parts of an open question.** When the user settles one meaningful part of a `todo` or `deferred` ticket, add that part's entry to the ticket immediately and keep everything else as it is: the status, `resolution: null`, dependencies, and readiness are unchanged, so the ticket stays open and its dependents keep waiting. Narrow `recommendation`, and `question` when needed, to the part still open so the next reader asks only that. Do not split the ticket only to hold the settled part. Keep the part's conditions on its entry, and write neither the part nor its conditions into canonical owners, scope records, or handoffs before the ticket is decided and normal synchronization writes its answer. When resuming an open ticket, read its entries first: they are already decided and are not asked again. When the rest is answered, add its entries and record the full resolution under the normal `decided` rule.

**Decisions without a ticket.** Keep the attribution in the decision's existing authoritative record: Architecture, a Domain, System Responsibility, flow, or contract record, a CONS, SEL, or VA record, a Build Unit, a Repository Build Design, or the UI/UX specification. Add one `## Decision Attribution` section using the reader labels and ordinary relative links:

```markdown
## Decision Attribution

| Decision | Origin | Evidence | Conditions |
| --- | --- | --- | --- |
| Loan balances and repayment handling stay in one Lending Domain. | Agent-chosen | Written during the Stage 1 pass; the checkpoint presented one domain without alternatives. | None |
```

Separate several conditions in a cell with `<br>`. An exclusion's attribution belongs in its scope record, since the out-of-scope ticket's question remains unanswered. Never create a retrospective ticket only to hold attribution.

**One entry per decision.** Split an answer into entries only where parts have different origins, evidence, or conditions, and keep the ticket itself whole. A whole Domain, responsibility, contract, or answer is never labeled human-approved when it contains choices with other origins. Give each meaningful part an entry, using Unknown origin for a part whose origin cannot be established.

**Reference elsewhere.** System Guide documents, CONS and SEL records, and other summaries reference the owner instead of repeating its attribution, and describe the origin truthfully, part by part when the parts differ: “Agent-chosen (TICKET-0012)”, not “approved”. Editorial reconciliation preserves existing attribution and never adds approval.

## Conditions

Keep a condition attached to its decision; the overview and the projected issue show it beside the answer. “Yes, provided borrowers can recover their funds” is a conditional approval, never an unconditional one.

- `Requirement: <rule>` is a continuing design requirement. Write it into the canonical owner with the rest of its decision.
- `Prerequisite before <stage>: <what must happen>` binds from that stage of the existing lifecycle onward: `design`, `implementation`, `build`, `verification`, `release`, `deployment`, `activation`, or `operation`. Choose the stage the user's words actually name, using the project's own claim ladder where it has one: “before launch” is deployment or activation, never build. Keep the user's wording in the text.

A prerequisite before design, implementation, build, or verification names the unresolved ordinary ticket that tracks it, creating one when none exists; external facts go in that ticket's `blocked_by`, and the ticket's affected responsibilities and Build Units let existing readiness rules hold exactly that work.

A prerequisite before release, deployment, activation, or operation is a later-lifecycle gate. It never holds design, implementation, build, or verification, so keep it out of tickets' `blocked_by` and readiness. Record it on the entry. When its decision is written to canonical owners, state the gate in the project's activation-gate scope record when one exists, and carry it into an [`LGATE-NNN`](build-design-and-delivery-readiness.md#delivery-slice-realizability-challenge) in each Stage 9 handoff that covers the affected Build Units when that handoff is next created or refreshed.

A design detail the user left open, such as the amount a condition refers to, stays its own question under normal ticket rules, separate from the gate. Keep genuine dependencies and Build Unit mappings exactly as the work requires.

Never mark a condition satisfied. A tracked prerequisite is satisfied only through its tracking ticket's own recorded resolution; a later-lifecycle gate, only through the evidence its `LGATE-NNN` names.

## Changing A Settled Decision

This extends [Upstream Repair Handling](checkpoint-workflow.md#upstream-repair-handling) and [Ticket And Canonical Owner Synchronization](implementation-detail-tickets.md#ticket-and-canonical-owner-synchronization). Before a consequential revision:

1. List the current decisions it touches with `generate-decision-overview.mjs --root <package> --affected <path-or-TICKET-NNNN>` for each canonical file and ticket you will change, and read the human-approved ones and their conditions.
2. Look for a way to solve the blocker that preserves those decisions.
3. If one must change, explain to the user the decision affected, the proposed difference, the reason, and its consequences, then use the existing ticket and question process for the unresolved choice. When the user's request already clearly authorizes that change, proceed without asking twice; when the change it asks for cannot be met as stated, apply [Discretion never lowers a requirement](#interpreting-approval) instead of settling a weaker one.
4. Record the changed decision with attribution for its new origin; an earlier approval never carries onto a materially changed decision. When the change replaces only part of an earlier entry, split that entry: the part that still holds keeps its origin and evidence, and the replaced part is removed. Keep the relationship to the earlier choice in the evidence and version history.

A withdrawn answer returns its ticket to `todo` without attribution; remove a withdrawn part's entry. A replaced decision keeps only its new entry. Agent-chosen and Unknown-origin decisions follow normal repair authorization.

## Handback

At the end of a pass, briefly list the meaningful Agent-chosen decisions you recorded, each with its owner, so the user sees them. This is visibility, not an approval request.

## Decision Overview

`build/workflow/decision-overview.md` is a generated reading surface listing current decisions under the four categories, with conditions, links to their owners, and evidence. It is never an editable source; change the owning ticket or record and regenerate. The root README links it as Decision Overview.

Within an authorized decision-recording pass that changes attribution, a settled ticket, or a `## Decision Attribution` section, regenerate and check it in the same pass:

```sh
node <software-design-skill-directory>/scripts/generate-decision-overview.mjs --root <software-design-package>
node <software-design-skill-directory>/scripts/generate-decision-overview.mjs --root <software-design-package> --check
```

Generation validates the attribution it reads and fails on a decision attributed in two owners. A settled ticket without attribution appears once as Unknown origin. A part recorded within an open ticket appears marked as part of an open question; the rest of that question, unanswered proposals, archived records, and withdrawn answers never appear. Links are rewritten to reach each owner's targets from the overview. The page covers attributed decisions and settled tickets only, never every historical choice described in prose. Structural checks cannot establish what a conversation meant.

## Existing Packages And Other Routes

Existing packages need no migration or approval exercise. A settled ticket without attribution stays settled and shows as Unknown origin; statuses, readiness, and unrelated validation are unaffected. Generating the overview is optional until a pass records attribution.

- **Decision-history backfill:** attribute each settled ticket from the evidence it cites; record Unknown origin when the evidence cannot establish who chose it.
- **Migration:** preserve `attribution` fields and `## Decision Attribution` sections unchanged. A migration authorization approves the migration, not the migrated choices.
- **Expert consultation:** present a settled prerequisite with its recorded origin. A returned answer stays expert advice until the user approves a resolution.
- **GitHub comments:** a comment is the user's approval only when the user wrote it about the choice that issue presents; cite its URL as evidence.
