# System Guide

Read this reference before creating, changing, migrating, or reviewing `guide/`, and whenever a change to a technical owner alters something a guide explains. Write guide prose by [guide-writing.md](guide-writing.md); produce PDFs by [guide-pdf-export.md](guide-pdf-export.md).

## Contents

- Role And Ownership
- Layout
- Adoption And Compatibility
- Architecture Guide
- Domain Guides
- Open Questions
- Writing A New Guide
- Keeping Guides Current
- Migrating An Existing Package
- Validation

## Role And Ownership

The System Guide is the package's reader-facing explanation: one architecture guide and one guide per System Domain. It is the single home of that narrative. A person who knows the product goal but not the blueprint reads it to understand how the system works, then follows its links into the exact records.

The guide **explains**; the technical records **own**. Behavioral rules, ownership, conditions, values, decision attribution and source conflicts stay authoritative in their technical owners (architecture, domain, System Responsibility, flow, lifecycle and contract records, tickets, Build Design and UI/UX records). Every claim in a guide restates an owner faithfully, conditions included; a guide adds understanding, never a fact. Consequently:

- Record behavior in its technical owner first, then reconcile the guide sentence that explains it, in the same pass.
- A guide never resolves a conflict or an undecided point; it explains it as open by [Open Questions](#open-questions).
- A guide holds no `## Decision Attribution` table, parameter registry, glossary, decision list or delivery-progress summary. It may say that a choice was approved or remains open, or that a capability is planned, unverified or gated, when its owner says so.
- Technical records carry one concise descriptive link to their guide instead of a second human explanation. Two full explanations of the same domain or system are a defect.
- Build Design, UI/UX, workflow and handoff documents stay where they are. System Responsibility `Responsibility Overview` sections and the Build Unit and Repository overviews remain dual-audience openings inside their records; a domain guide introduces each responsibility and links its record rather than absorbing it.

One architecture PDF and one separate PDF per domain are the primary reader deliverables. The combined edition is optional. PDFs are the primary way to read and share the guide. They are generated from the Markdown sources into a directory outside the package, never edited, and never stored as package records.

## Layout

```text
software-design/
  guide/
    architecture.md               # architecture guide
    domains/
      <domain-slug>.md            # one per system-model/domains/<domain-slug>/
```

A domain guide's filename is its canonical domain folder slug. `guide/` holds nothing else. Guides are plain Markdown without frontmatter, start with one level-1 title, and use the strict subset in [guide-pdf-export.md](guide-pdf-export.md#markdown-subset), so what validates also prints.

## Adoption And Compatibility

A package adopts the System Guide explicitly with `system_guide: adopted` in the frontmatter of `system-model/architecture.md`. Validation applies the guide rules only to adopted packages, and it never infers adoption or non-adoption from which files exist; a `guide/` directory without the declaration fails validation.

- **New packages** adopt the guide at Stage 1.
- **Existing format-2 packages** stay valid and usable without a guide. Adopt one only when the user asks for it, through [Migrating An Existing Package](#migrating-an-existing-package).
- Adoption changes no design format, ticket schema, identifier or record family.

## Architecture Guide

`guide/architecture.md` explains the system as a whole, in the order a newcomer needs it; start from [the architecture guide template](../assets/templates/guide/architecture.md). Cover:

- the system's purpose and the participants who use, operate or depend on it;
- the concepts a reader needs, each introduced where it first matters;
- every System Domain by its canonical name: its role, its boundary and a link to its guide;
- at least one concrete scenario that crosses domains, showing who supplies what, who decides, what changes and what proves the outcome;
- shared identity: what binds records, artifacts and participants to one subject;
- authority and sources of truth: who may decide or change what, and which fact counts as evidence;
- failure paths and limitations, including what the system cannot guarantee;
- consequential choices with their recorded reasons, and open conflicts stated as open.

Link the technical architecture record for exact boundaries. The guide does not repeat the domain index table, contract inventories or frontmatter relationships.

## Domain Guides

Each `guide/domains/<domain-slug>.md` explains one domain completely enough to be read alone, including as a separate PDF; start from [the domain guide template](../assets/templates/guide/domain.md). Its title contains the canonical domain name. Cover:

- the practical job and why it matters;
- every System Responsibility by its canonical name, what it contributes, and a link to its record;
- how those responsibilities cooperate, and what the domain receives from and provides to other domains;
- the normal path through a concrete scenario, then the consequential exceptions and recoveries;
- authority boundaries: what the domain decides, and what it must not decide or imply;
- choices and their recorded reasons;
- unresolved, excluded and deferred items, with what they mean for a reader now.

Introduce any concept from another domain briefly where it is needed, and link the architecture guide and the domain's technical record.

## Open Questions

An **open question** is a point the owners leave unsettled: two owner statements that may contradict, or a point no owner decides. While it is unanswered:

1. **Classify it against every statement on the point.** Read each statement in its own scope and lifecycle stage as its owner states them: a rule for a beta and one for a later release, a default and its exception, a planned mechanism and its activated state can all hold together when their owners place them in different stages. A statement about a whole version, such as what that version retains or forbids, covers every stage of it, its beta included. Look for an owner that already reconciles them, such as a selection, scope or constraint record or a recorded decision. A reconciling reading must account for every statement, including what an owner forbids or lists as invalid. It uses the owners' own terms: a reading that adds a qualifier no owner states, such as narrowing one side's "approval" to one kind of approval, answers the question instead of reconciling it. A point an owner already records as unresolved, as a discrepancy or as undecided, including in a narrative section being migrated, stays open whatever later records, tickets or decisions say, until the user answers and that owner is updated. Statements that still cannot both hold in the same scope and stage are a **conflict**: record it in the domain or architecture record beside the statements it affects, in one line starting `Unresolved source conflict:` that names each side and the record that holds it. When the classification itself stays uncertain, the point is still open: record it in the same place in one line starting `Open question:` that names each side and its record, without calling it a conflict.
2. **Preserve each owner's statement.** Every side keeps its owner's wording, even when another side looks settled, newer or better reasoned. Aligning one owner with another is the answer to the question, so it waits for the user. A choice an open point reaches is unsettled: a record's choice or rationale line, and a guide sentence, present it through the point's line rather than as one side's settled choice.
3. **Explain the open point wherever a guide depends on it.** Keep a brief qualification beside affected behavior so no interpretation reads as settled. Explain the competing interpretations once in that guide's Open questions section; keep detailed source reconciliation and attribution in technical records.
4. **Continue the unaffected work.** An open question holds back only the sentences and records whose wording depends on its answer.
5. **Report it to the user as a question**, with each side and its record. A proposed answer appears only in that report, labeled as a proposal. Reporting a doubt authorizes no change: an owner changes only through its normal checkpoint after the user answers.

Done when every open question keeps each side in its owner's words, has its `Unresolved source conflict:` or `Open question:` line beside its statements, and is presented as nobody's settled choice; every guide passage that reaches the point states it as open; and the report to the user lists it.

## Writing A New Guide

A new guide is written from its owners: at Stage 1 for the architecture guide, at Stage 2 for each domain guide, and during a migration for any guide with no existing narrative to carry over.

1. **Read the owners whole.** For a domain guide, read the domain record, every responsibility record, and the flows, contracts, constraints and scope records they link. For the architecture guide, read the architecture record, every flow and every record that spans domains. Limits sit in many sections, such as exclusions, prohibited authority, failure and violation meaning, status and revisit conditions, so read each record through. *Done when* every owner the guide restates has been read in full.
2. **Write by the [writing standard](guide-writing.md).** Cover every item in [Architecture Guide](#architecture-guide) or [Domain Guides](#domain-guides), keep each condition and limit beside the step it qualifies, and explain each open point by [Open Questions](#open-questions). *Done when* every listed item is covered.
3. **Self-review** by [guide-writing.md](guide-writing.md#self-review). *Done when* every consequential sentence, figure step, caption, table row and callout matches the owner statement it restates, with that statement's limits.

## Keeping Guides Current

- **Stage 1** creates `guide/architecture.md` with the architecture record and declares adoption.
- **Stage 2** creates each domain guide together with its domain record, so every canonical domain always has its guide.
- **Stages 3–5 and 7** reconcile the affected guides in the same pass whenever an owner changes something a guide explains: a responsibility's job, a flow's path or exception, a contract's condition, a scope exclusion, a recorded rationale or an open conflict.
- **Ticket answers** reconcile affected guides during [Ticket And Canonical Owner Synchronization](implementation-detail-tickets.md#ticket-and-canonical-owner-synchronization), after the owners.
- When a guide sentence and its owner disagree, the owner wins: correct the guide, or, if the owner is wrong, repair the owner through its normal checkpoint.

A change to an owner fact that a guide tells updates every guide location that tells or summarizes the fact, in every guide, including figures, captions, tables and summaries: search the guides for the fact and its wording, change each location, and recheck the limits beside it. A change that rewrites a whole guide is a new guide and takes [Writing A New Guide](#writing-a-new-guide). After guide changes, the user's existing PDFs become stale; `--check` in [guide-pdf-export.md](guide-pdf-export.md) reports which, and regenerating them is part of the change when the user keeps PDFs. An owner change can also invalidate delivery evidence that pins the owner's bytes ([bounded-delta-scope.md](bounded-delta-scope.md)); compare the validators with their output before the change and report each new delivery-readiness finding with the change.

## Migrating An Existing Package

Migrate only on the user's explicit request. Preserve substantive facts across the package, not every sentence in the reader-facing guide. Start from existing narratives and retain useful explanations; architecture may be reorganized as a system-level introduction, while domains retain their greater depth.

1. **Establish the baseline.** Keep copies of affected files and existing validation results outside the package. Read the original narratives and relevant technical owners. Identify consumers of moved headings and any pinned records before changing technical files.
2. **Preserve authoritative meaning.** For unique information removed from a guide, identify its existing technical destination or preserve it in the appropriate technical owner without changing meaning. Keep exact contracts, exhaustive cases, implementation mechanics and source attribution there. Report unresolved ownership or pinned-record constraints rather than silently changing them.
3. **Edit at the intended level.** Apply [guide-writing.md](guide-writing.md). Split and regroup paragraphs, shorten reference lists, and remove repetition. Keep consequential conditions, authority, risks and availability explicit. Record a concise change summary and the destinations of omitted unique detail. Narrow accuracy corrections must name their source; unresolved choices remain open.
4. **Maintain the package links.** Replace migrated narrative sections with descriptive guide links, preserve or update their consumers, declare adoption and refresh affected derived views. Leave unrelated technical records and pinned evidence unchanged. Run appropriate existing checks and compare failures with the baseline.
5. **Review once independently.** Give one fresh reviewer the intended audience and scope, original narratives, revised guides, changes and relevant owners. Check system-level comprehension, preserved domain meaning, misleading simplification and obstructive repetition. Missing low-level detail from architecture is not itself a defect. If technical records changed, also check that removed facts survive in their owners. Correct confirmed findings and recheck affected passages; report unresolved design questions without choosing answers.
6. **Export and inspect.** Export the separate architecture and domain PDFs with `--all`, then inspect every page by [guide-pdf-export.md](guide-pdf-export.md#verification). Deliver the Markdown sources, PDFs, concise changes and verification results. State if independent review was unavailable.

## Validation

For an adopted package, `validate-software-design-structure.mjs` checks:

- the declaration, the guide layout, the architecture guide and one domain guide per canonical domain, with no orphan guides;
- that every guide parses in the strict Markdown subset;
- navigation: the README, the architecture record and each domain record link their guide; the architecture guide links every domain guide and the architecture record; each domain guide links the architecture guide, its domain record and every responsibility record of the domain;
- coverage by name: the architecture guide names every domain and each domain guide names every responsibility by its canonical name, and each domain guide's title contains the domain name;
- that no reader-visible text, including headings, tables, captions, code and link labels, shows a blueprint identifier or package path (identifiers in link destinations are fine);
- that every link and anchor resolves, and that a domain record no longer keeps a `## Domain Overview`.

Decision-attribution validation separately rejects an attribution table in a guide. Validation cannot judge comprehension or factual agreement; the self-review and independent [migration review](#migrating-an-existing-package) do.
