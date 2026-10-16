# Guide Writing Standard

Apply this standard to every System Guide document, and to the `Domain Overview` of a package that has not adopted the guide. The reader-facing openings inside technical records (System Responsibility, Build Unit and Repository overviews) follow the same principles while keeping their own identifier conventions. The standard describes how to explain a system to a reader who knows the product goal but not the blueprint, its record families or its identifiers. Write in clear technical English. This is a writing standard, not a controlled language; no glossary or term workflow is involved. When editing existing prose, preserve its substantive meaning while improving its structure and removing repetition. Architecture explains the whole system; domain guides explain their domain more deeply; technical records retain exact contracts, exhaustive cases, implementation mechanics and source attribution.

## Contents

- Principles
- Names, Acronyms And Identifiers
- Figures, Tables And Callouts
- Self-Review

## Principles

1. **Context before detail.** Open with what the subject is for and why it matters, then introduce the participants and mechanisms the reader needs, before any rule that depends on them. Define a term where it first matters, with its consequence.
2. **Organize around the reader's questions.** Order sections by what a reader asks next (what is this, who takes part, what happens normally, what can go wrong, who decides, what is not covered), not by specification fields or record order. Headings name the question or the situation.
3. **Show cooperation through concrete situations.** Follow one case far enough to show who supplies an input, who decides or acts, what changes, what proves the result, and what happens when the normal path is unavailable. Label an example as illustrative when it is not an approved requirement.
4. **Keep conditions beside the mechanisms they qualify.** Put the prerequisite, limit or exception in the same sentence or paragraph as the behavior it constrains. A condition stated pages away reads as an absent condition. Include exact conditions, scope or counts when they change the reader's understanding, an important outcome, authority, risk or availability. Use human units such as "two days"; seconds and formulas belong here only when they help this reader.
5. **Progress from understanding to precision.** Explain the idea first, then give the exact values, states and cases that change its meaning. Leave exhaustive tables, wire names and parameter lists with their owners and link them.
6. **Preserve meaningful detail.** Keep every distinction that changes what a reader would conclude: separate secrets, keys, accounts, transactions, states and outcomes stay separate; "published", "broadcast" and "confirmed" are different events; signing in, approving or holding an identifier is not authority to sign, fund or move assets; a verification claim is not a deployment claim. Summarize capability status accurately, distinguishing a selected design from an available capability. Keep ticket history, verification disputes and implementation progress in technical records; describe any resulting uncertainty briefly. Where a participant confirms or approves a step, say what that confirmation permits and what it does not. Keep an owner's limit exactly as strong as the owner states it: evidence the owner says must not imply an outcome proves nothing new in the guide. A summary that groups failure cases keeps each case's own outcome: a route that is unavailable, an outage that can recover, and a route still open through an earlier authorization are different outcomes. Simplify wording, never the mechanism.
7. **Explain choices honestly.** Give the recorded reason for a choice, say who settled it only as its owner records, and present open questions, conflicts and unknown rationale as open by [Open Questions](system-guide.md#open-questions). Where a scenario or explanation passes an open point, say so there instead of narrating one side as settled. Keep facts, recorded rationale, recommendations and inference distinguishable.
8. **Make links supplementary.** The guide must stand alone at its intended level; paragraphs may rely on concepts already introduced. A link offers more precision, not a missing explanation. Use descriptive labels that say what the reader will find.
9. **Keep detail proportionate.** Give each topic space in proportion to its consequence for the reader. A mechanism that can lose funds or authority earns a scenario; a routine field earns a clause. A recorded residual risk or race belongs where the narrative reaches the state it threatens, with who bears it. Split overloaded paragraphs, regroup related explanations and remove genuinely repeated explanation when meaning is preserved. Technical detail need not appear at every guide level.

## Names, Acronyms And Identifiers

- Use one meaningful name per concept throughout the guide and across guides: canonical domain and responsibility names, and consistent meaningful names for states and artifacts. Explain concepts before exact technical names; avoid code names where plain language carries the same meaning.
- Where the records use one word for different things, such as a loan's activation and a capability's activation, qualify the word every time it appears, so a reader cannot merge them.
- Spell out an acronym on first use in each document, unless the reader's field uses it as a plain word.
- In guides, keep blueprint identifiers (such as responsibility, flow, contract, Build Unit, repository, ticket and domain identifiers) and package paths out of everything a reader sees: prose, headings, tables, figure text, captions, code blocks and link labels. Identifiers belong in link destinations and in the technical records. Validation enforces this.

## Figures, Tables And Callouts

Use them only when they answer a reader question better than prose; see [guide-pdf-export.md](guide-pdf-export.md#markdown-subset) for syntax.

- **Figure:** a short sequence of two to eight steps, one line each, with a caption that says what to notice. Mark a conditional step as optional and state its condition in the step. Each step names exactly the actor and action its owner gives, such as which participant signs which transaction. A figure, caption, table or summary is held to the same owners and limits as prose.
- **Table:** a comparison of several items along the same attributes. Keep explanations in prose.
- **Callout:** one consequential boundary or warning a reader must not miss, with a short title.

## Self-Review

Before finishing a guide:

1. Read only the guide, without links. Can a newcomer state the subject's job, each responsibility's contribution, how they cooperate, one consequential exception and what remains open? Is every term explained where it is first used?
2. Check each consequential statement against the owner it restates, wherever the guide tells it: prose, figure steps and their actors, captions, tables and callouts. Correct every gap. Limits a reader most often loses: what a stolen or leaked artifact still cannot do; what a handoff, confirmation or disclosure authorizes and what it does not; each condition of an eligibility; a race between steps that are not atomic, with who bears it; a route that stays available independently of another; the gate a capability waits for; and an open point the step relies on. Check each exclusive or universal word (only, never, every, all, cannot) against the owner's own scope.
3. Check that affected passages qualify unresolved behavior briefly and that competing interpretations are explained once in each affected guide's Open questions section. Detailed source reconciliation belongs in technical records. Then check each restated fact in every other guide that tells it, with its limits there.
4. Check that every distinction in principle 6 that applies to the subject survives, and that every claim about what a failure, an attacker or a participant can or cannot achieve is exactly as strong as its owner states.
5. Check that no identifier, path or unexplained acronym is visible.

Low acronym counts do not establish comprehension, and a link or a matching term does not establish fidelity; steps 1 to 3 do.
