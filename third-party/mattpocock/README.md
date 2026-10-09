# Matt Pocock skills

Selected third-party skills copied unchanged from [mattpocock/skills](https://github.com/mattpocock/skills).

- Upstream revision: [`b0618bc436ad893b3c5e84e55fba86586d34a404`](https://github.com/mattpocock/skills/tree/b0618bc436ad893b3c5e84e55fba86586d34a404)
- Archived: 2026-10-09
- License: [MIT](LICENSE), copyright Matt Pocock. Preserve bundled attribution notices as well.
- Local modifications: none. The original skill directories, supporting files, and frontmatter are preserved.

| Skill | Purpose | Upstream directory |
| --- | --- | --- |
| [prototype](prototype/SKILL.md) | Explore a design question with an interactive logic demo or UI alternatives. | `skills/engineering/prototype` |
| [wait-what](wait-what/SKILL.md) | Re-explain a message with clearer language and missing context. | `skills/productivity/wait-what` |
| [code-review](code-review/SKILL.md) | Review committed changes against requirements and coding standards. | `skills/engineering/code-review` |
| [diagnosing-bugs](diagnosing-bugs/SKILL.md) | Reproduce, diagnose, fix, and verify reported bugs or performance regressions. | `skills/engineering/diagnosing-bugs` |
| [retro](retro/SKILL.md) | Investigate an agent session and recommend improvements to its working environment. | `skills/engineering/retro` |
| [writing-for-agents](writing-for-agents/SKILL.md) | Guide the writing and organization of instructions consumed by agents. | `skills/productivity/writing-for-agents` |

## Dependencies and use

`retro` explicitly invokes `writing-for-agents`; install both when using the upstream retrospective workflow. The other four selected skills do not explicitly invoke another skill. Supporting files inside each directory must travel with its `SKILL.md`.

Some skills expect project context: `wait-what` references a project glossary, and `code-review` expects issue-tracker information and parallel-agent capabilities. Archiving these files does not establish that every workflow is supported by every agent.

The root `install.sh` currently discovers only `skills/`; these third-party directories are not included in that installer. To install manually, copy the complete desired skill directory into your agent's configured skills directory, retaining the license notices. Keep this README and LICENSE with redistributed collections.

## Updating

Choose and record an upstream commit, inspect its changes and dependencies, then replace the corresponding directories with complete copies from the upstream paths above. Update the revision, archive date, and modification statement together. Keep any future local edits explicitly documented so they are not lost during an update.
