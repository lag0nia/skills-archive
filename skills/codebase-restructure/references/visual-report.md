# Visual Report

A self-contained HTML page that explains a substantial review to someone who was not part of the conversation: what was examined, what is wrong and why it matters, how the target differs from today, the trade-offs, and what the user needs to decide. It is a disposable presentation of evidence and proposals, not a record. The plan and decision documents stay authoritative, and another agent must be able to continue from them after the report is gone.

Contents: When to Write One; Location and Lifetime; Building the Report; What to Show; Diagrams; Comparing Alternatives; Questions; Technical Requirements; Checking the Report; Telling the User.

## When to Write One

Write one by default for a substantial review: several improvement candidates, a target that changes ownership, boundaries, contracts, build or deployment, or a consequential choice between designs. It needs no separate permission.

Do not write one:

- for a narrow question, a justified no-change conclusion or a small, self-evident change: answer in the conversation;
- when the user asks for text only, no files or no changes: explain in the conversation, with text comparisons instead of diagrams;
- when files cannot be written: say so and explain in the conversation.

The report is neither a stage nor a gate. Write it when there is something substantial to explain, usually once the diagnosis and target are clear or when a question round benefits from a visual explanation, and continue investigating and planning as far as the information allows. It never replaces the migration plan, and nothing waits for the user to approve the report itself.

## Location and Lifetime

- By default, write `report.html` in a new directory for this task inside the operating system's temporary directory, created with the platform's mechanism for unique temporary directories (for example `mktemp -d`) and named after the repository and scope. Never write it inside the target repository by default.
- Honor a destination the user names and any write restrictions. A request for no file changes rules out the report too.
- Within the same discussion, overwrite that file when its conclusions materially change instead of creating numbered versions. Never create a report archive, an index, or an `outputs/` tree in the repository.
- A later session may find the file gone. Nothing may depend on it: if a visual explanation would still help, write a new one from the plan and current evidence.

## Building the Report

Copy the [starter](../assets/architecture-report-template.html) to the report location and fill it in. The [fictional example](../assets/architecture-report-example.html) shows the intended depth and visual quality; its architecture is invented and is not a recommendation. Never edit the starter in place.

- Replace every `{{...}}` placeholder, and delete sections, cards and diagram patterns that do not apply, together with their navigation entries. Leave no empty headings or placeholder text.
- Keep the detail proportionate: a review with two candidates needs less navigation and fewer diagrams than a repository-wide target.
- Write in the user's language when they use one; keep code identifiers, paths and the repository's own terms unchanged.
- Escape every inserted piece of text, including paths, symbols, code, user-written content and diagram labels: `&` as `&amp;`, `<` as `&lt;`, `>` as `&gt;`, and inside attribute values also `"` as `&quot;`. Repository text must render as text, never as markup or script.
- Write enough prose for a reader who did not see the conversation. A sentence of reasoning beats an unexplained badge.

## What to Show

In proportion to the review:

- Header: repository, scope, date, the plan's path and status when a plan exists, and a notice that proposals are not approvals.
- Summary: the objective, the key recommendation and the recommended next action.
- Scope and evidence: what was investigated and how (flows traced, history read, checks run), and what was only sampled, inaccessible or uncertain.
- Navigation when there are several candidates or decisions.
- Overall target: for repository-wide or multi-candidate work, how the candidates fit one coherent organization, which ones complement, depend on or conflict with each other, and what deliberately stays as it is.
- One card per candidate:
  - a descriptive title naming the change;
  - the concrete problem and its cost, with source paths and evidence such as traced callers, co-change history, drifted copies or failing checks;
  - current and proposed arrangements, clearly distinguished (see Diagrams);
  - the proposed change, its meaningful gains, costs, compatibility effects, and uncertainties with what would settle them;
  - its recommendation strength with the reason, kept separate from priority and implementation effort;
  - any conflict with an existing decision: which decision, what changed since it was made, and why reconsidering it is justified;
  - its state: proposed, approved (recorded in the plan) or implemented and verified. These labels describe the page's content; they are not plan or decision statuses and never replace them.
- Alternatives for any decision with genuine options, and scenario checks for significant proposals.
- Material questions and the recommended next action, including what is ready now and what waits on what.

Recommendation strength uses three presentation labels: Strong (a demonstrated cost and a clear remedy), Worth exploring (a real problem whose remedy depends on an open question or more evidence) and Speculative (plausible but unproven; include it only when a reader would otherwise raise it). Never invent scores, percentages, savings or estimates that the evidence does not provide.

## Diagrams

A diagram illustrates a claim; it is not evidence on its own. Current relationships must be ones you verified in the code, configuration or history, and proposed relationships must be ones the proposal actually contains.

- Choose the form by the claim: ownership boxes or an ownership table for who owns a responsibility or state; a dependency graph for who depends on whom and which dependency causes the cost; a sequence for ordering, failure and lifecycle; a build or deployment view for what ships and runs together; a folder tree only where placement itself matters; an interface and caller example for what callers must know.
- Put the current and proposed views side by side (stacked on narrow screens), with the same element names and positions, so only the change differs. Mark what is added, removed or changed in text as well as color or line style.
- Label each view as current (verified) or proposed, and mark uncertain relationships as uncertain. A proposed deployment or interface in a diagram is not evidence that it exists or works; say what remains unverified.
- A folder tree alone, or a schematic of a large module becoming smaller, shows no benefit by itself. Pair it with the ownership, dependency or caller change that produces the benefit, explain qualitative schematics in the caption, and do not let sizes suggest measurements.
- Give every diagram a caption saying what it shows and a text alternative. Use inline SVG or HTML and CSS; the starter includes dependency graph, sequence, build or deployment boundary, folder tree, and interface patterns.

## Comparing Alternatives

For one decision with genuine options, use a table with options as columns and only the dimensions that distinguish them as rows: what changes, benefit, implementation and migration cost, ongoing cost, compatibility, verification, and uncertainty. Follow it with the recommendation and its reason. Include leaving things as they are when it is credible, and do not add weak options to fill the table. Mark the recommended option with a text label, not color alone.

Show improvement candidates as separate cards, not as columns of one table: they solve different problems, and complementary candidates are not a choice between them.

## Questions

Present the current round of material questions as in the conversation: title, precise decision, why it matters, options with their consequences, the recommendation (marked provisional when evidence is missing, with what would change it) and what the answer affects. Show a dependent question only as a later branch with its assumption explicit. The page has no answer controls: the user answers in the conversation, and the answer is recorded in the plan. Opening or reading the report approves nothing.

## Technical Requirements

- Opens directly as a local file: styles embedded, system fonts, inline SVG, HTML and CSS. No CDN, remote fonts, images or scripts, runtime requests, server or build step.
- Readable without JavaScript. The starter uses none; an optional enhancement must leave all content visible when it does not run.
- No forms, buttons, answer or approval controls, saved choices, tracking, storage or analytics.
- Links only to anchors inside the page. Show repository paths as text, since the page does not live in the repository.
- Accessible: headings in order, text labels as well as color, readable contrast and font sizes, keyboard-operable links and disclosures, tables with headers, and diagrams with titles and descriptions.
- Responsive: no horizontal page scrolling on narrow screens; wide tables scroll inside their own container; diagrams stay legible when stacked.
- Printable: the starter's print styles keep cards, diagrams and tables together and all content visible. Do not hide essential content in collapsed disclosures.

## Checking the Report

Writing a report does not require screenshots or a browser. When a browser or rendering tool is available, open the file and inspect every section, not only the first screen: at a wide and a narrow width, and in print preview when the tool supports it. Check that the current and proposed views correspond, that labels are legible and do not overflow, that navigation targets work, and that nothing is requested from the network. Correct what you find.

When rendering is unavailable, state that the report was written but not visually inspected. The limit applies to claims about the report only; it does not block the architectural work.

## Telling the User

In the final response, give the report's path, its key recommendation and whether it was visually inspected, alongside the usual summary. The summary and the plan must stand on their own without the report; the plan does not need to mention it.
