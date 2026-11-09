# poteto · pstack verification skills

Selected third-party skills copied unchanged from [Lauren Tan (poteto)'s pstack collection](https://github.com/cursor/plugins/tree/main/pstack).

- Upstream repository: `cursor/plugins`, collection `pstack` (plugin version 0.15.36).
- Upstream revision: [`6b0300214a09fd6029cfb7077043125758cd1fd2`](https://github.com/cursor/plugins/tree/6b0300214a09fd6029cfb7077043125758cd1fd2/pstack).
- Archived: 2026-11-09.
- License: [MIT](LICENSE), copyright Lauren Tan.
- Local modifications: none. Complete skill directories, frontmatter, executable modes, supporting scripts, references and bundled fixtures are preserved.

| Skill | Use it for | Upstream directory |
| --- | --- | --- |
| [statechart](statechart/SKILL.md) | Explore a TLA+ model, check its rules, and show paths to violations as a statechart. Replay findings against real code before calling them product bugs. | `pstack/skills/statechart` |
| [create-verification-skill](create-verification-skill/SKILL.md) | Create and prove a project-local skill that launches and drives the real app, with a feature map and saved evidence. | `pstack/skills/create-verification-skill` |
| [maintain-verification-skill](maintain-verification-skill/SKILL.md) | Reconcile that feature map with source and exercise every mapped feature live; repair verification documentation or harnesses. | `pstack/skills/maintain-verification-skill` |
| [create-formal-verification-skill](create-formal-verification-skill/SKILL.md) | Create a repeatable formal check of a property, using a suitable model checker, prover or code verifier; demonstrate that it catches a deliberately broken case. | `pstack/skills/create-formal-verification-skill` |
| [maintain-formal-verification-skill](maintain-formal-verification-skill/SKILL.md) | Reconcile formal checks with changed code; distinguish verification drift from actual product bugs. | `pstack/skills/maintain-formal-verification-skill` |
| [correct](correct/SKILL.md) | Prevent repeated mistake classes through architecture, types, lint or tests, with evidence that the safeguard catches a past mistake. | `pstack/skills/correct` |

## Which one?

The runtime pair checks observable behavior in a running application. The formal pair checks stated properties under explicit assumptions and bounds. They complement each other: a model passing does not prove that the shipped application matches it. `statechart` is a direct modeling tool; the formal pair leaves behind, or maintains, a project-specific rerunnable check and its code-coverage record.

`correct` is distinct from Matt Pocock's archived `retro`: `retro` investigates an agent session and recommends environment improvements; `correct` changes the repository to enforce safeguards against repeated mistakes. Read each skill's scope before invoking it.

## Installation and prerequisites

The root installer discovers all six names:

```bash
./install.sh statechart create-verification-skill maintain-verification-skill create-formal-verification-skill maintain-formal-verification-skill correct
```

Archiving does not install, invoke or enable these skills. The upstream skills use `disable-model-invocation: true`; clients differ in how they support explicit invocation. Some upstream instructions use Cursor's `.cursor/skills/` location and assume agent, app-driving or GitHub capabilities; archiving is not a portability certification or an authorization to run those workflows.

- The runtime maintenance skill needs an existing project-local verification skill, source-reading subagents, and a way to drive the app.
- Formal generation explicitly refers to sibling `statechart` for TLA+ checks. Keep both installed when using that path; the upstream relative link assumes sibling skill directories.
- `statechart/scripts/statechart` needs Node 22.18–22.x, Node 23.6+, Bun 1.1.5+, or Deno 2+. Its checker uses mise to obtain TLC and Java on first use (network required), or configured `TLA2TOOLS` and `JAVA`. SVG rendering separately uses Pele as documented in its bundled render reference.
- `correct` can change architecture, types, lint, CI and tests. The maintenance skills limit themselves to verification artifacts unless separately authorized to change product code. Existing project and user restrictions still apply.

No modeling, application-driving, dependency installation or verification workflow was executed as part of this import.

## Updating

Choose an upstream commit, inspect the selected skills and dependencies, then replace each complete `pstack/skills/<name>` tree. Preserve executable modes and the collection license; update the revision, date and modification statement. This is a selection, not a full pstack plugin installation: plugin agents, other skills, automations and account/model configuration are not bundled.
