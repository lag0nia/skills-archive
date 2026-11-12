# Software Design tests

Run the complete portable test suite from any working directory:

```sh
node <software-design-skill-directory>/tests/run.mjs
```

Keep executable skill commands in `../scripts/`. Place Node test files in the domain folder that owns the behavior, use the `.test.mjs` suffix, and keep reusable temporary-workspace helpers in `support/`.

Planning/execution regressions use disposable local fixtures. Explicit `--validation-mode planning|execution` is tested through the relevant CLI/wrapper; omitted mode stays strict. See [planning-execution-contract.md](../references/planning-execution-contract.md) for the additive INPUT/INT, OUTPUT, CAP and review formats. Automated checks establish declared structural invariants, not semantic completeness or observed application execution.

The new-consumer regression runs locally from handoff to a validated workpack. The fixture observes actual disposable A bytes and an existing-reader probe, but A history and final B completion records are expressly synthetic validator fixtures. No application workpack is implemented and synthetic completion acceptance does not establish real B consumer fitness. The cross-skill path through execution start and delivery evidence is tested outside this portable skill.

System Guide PDF export tests print real PDFs through a local Chromium-based browser found the same way as the exporter (`SOFTWARE_DESIGN_PDF_BROWSER`, the Playwright cache, `PATH` or standard install locations). Without one, only those printing tests are skipped and the report names the reason; argument, dependency-error and freshness checks still run. Printing checks establish text fidelity, fonts, bookmarks, links, header repetition and atomic replacement, not typographic quality; inspect rendered pages for that.

Manual System Guide evaluations (authoring, independent repetition, reader comprehension, semantic preservation and maintenance, each by a fresh agent on disposable package copies) are preserved in [behavioral/system-guide/results.md](behavioral/system-guide/results.md) with their prompts, inputs, expectations defined before execution, and verbatim outputs. They supplement the automated tests; the Node runner does not execute them.

Manual response evaluations for consequential ambiguity are preserved in [behavioral/domain-ambiguity/results.md](behavioral/domain-ambiguity/results.md), with shared inputs, expectations defined before execution, and verbatim outputs. They supplement structural tests; the Node runner does not execute them.

Manual reader-context evaluations compare original and revised guidance for tickets, the retired parent decisions, repairs, consultations, and brief questions in [behavioral/reader-context/results.md](behavioral/reader-context/results.md). They retain shared inputs, review criteria, and verbatim outputs; the Node runner does not execute them.

Manual workflow-reliability evaluations compare original and revised guidance for prototype alternatives, journey-operation discovery, delegated authority, blockers and completion claims, with a second round on prototype pass scope and boundary-limited delegation and a third on the prototype-selection lifecycle, in [behavioral/workflow-reliability/results.md](behavioral/workflow-reliability/results.md). They retain shared inputs, criteria recorded before execution, and verbatim outputs; the Node runner does not execute them.

The domain-ambiguity and reader-context evaluation sets are frozen pre-migration evaluations. Their inputs and verbatim responses use the retired format-1 parent-decision (TD) workflow, so they are controlled comparisons recorded at their original revision, not current format-2 authoring examples. Current authoring follows `SKILL.md` and its references.
