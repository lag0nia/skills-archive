# Morluto REA skill

Selected third-party skill copied unchanged from [morluto/rea](https://github.com/morluto/rea).

- Upstream revision: [`efbc486b9bf8ab46da16fdd6ed88128849e30e81`](https://github.com/morluto/rea/tree/efbc486b9bf8ab46da16fdd6ed88128849e30e81)
- Archived: 2026-10-14
- License: [MIT](LICENSE), copyright 2026 morluto.
- Local modifications: none. The skill directory, frontmatter, and all six reference files are preserved.

| Skill | Purpose | Upstream directory |
| --- | --- | --- |
| [reverse-engineer-anything](reverse-engineer-anything/SKILL.md) | Investigate native, managed, JavaScript/Electron, packaged, firmware, and browser targets using REA evidence. | `.agents/skills/reverse-engineer-anything` |

## Installation and dependencies

The root installer discovers this skill automatically:

```bash
./install.sh reverse-engineer-anything
```

Select `--claude`, `--codex`, or `--hermes` as needed. Archiving the skill does not install it into any local agent. Installing the skill supplies instructions only; it does not register the REA MCP server or install analysis engines. See the bundled [connection and recovery reference](reverse-engineer-anything/references/connection-and-recovery.md) for setup and provider requirements. Keep all reference files with `SKILL.md`.

## Updating

Choose and record an upstream commit, inspect its changes and dependencies, then replace the complete `.agents/skills/reverse-engineer-anything` directory. Preserve the upstream license and update the revision and archive date. REA's repository-maintenance skills and application source are not included.
