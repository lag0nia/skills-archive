# Emil Kowalski skills

Selected third-party skills copied unchanged from [emilkowalski/skills](https://github.com/emilkowalski/skills).

- Upstream revision: [`2d228630ba1446365f614a108cb8252f1feda202`](https://github.com/emilkowalski/skills/tree/2d228630ba1446365f614a108cb8252f1feda202)
- Archived: 2026-10-13
- License: [MIT](LICENSE), copyright Emil Kowalski.
- Local modifications: none. The original skill directory and frontmatter are preserved.

| Skill | Purpose | Upstream directory |
| --- | --- | --- |
| [break-ui](break-ui/SKILL.md) | Stress-test interfaces with worst-case content, empty states, and extreme values. | `skills/break-ui` |

## Installation

The root installer discovers this skill alongside the main collection and Matt Pocock's skills:

```bash
./install.sh break-ui
```

The default targets are Claude Code and Codex; select `--claude`, `--codex`, or `--hermes` as needed. Archiving this skill does not install it into any local agent. Its upstream source includes `SKILL.md` and the supporting `CATALOG.md`; keep both files together.

## Updating

Choose and record an upstream commit, inspect its changes, and replace the complete `skills/break-ui` directory from upstream. Preserve the license and update the revision and archive date. Other skills in Emil's upstream repository are not included in this selection.
