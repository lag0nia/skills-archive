# Emil Kowalski skills

Selected third-party skills copied unchanged from [emilkowalski/skills](https://github.com/emilkowalski/skills).

- Upstream revision: [`2d228630ba1446365f614a108cb8252f1feda202`](https://github.com/emilkowalski/skills/tree/2d228630ba1446365f614a108cb8252f1feda202)
- Archived: 2026-10-13
- License: [MIT](LICENSE), copyright Emil Kowalski.
- Additions archived: 2026-11-09 from [`5206a950b715e0cabe7043ea0b2304332b91494e`](https://github.com/emilkowalski/skills/tree/5206a950b715e0cabe7043ea0b2304332b91494e). The original `break-ui` directory remains unchanged at its revision above.
- Local modifications: none. The original skill directories, supporting files and frontmatter are preserved.

| Skill | Purpose | Upstream directory |
| --- | --- | --- |
| [break-ui](break-ui/SKILL.md) | Stress-test interfaces with worst-case content, empty states, and extreme values. | `skills/break-ui` |
| [animate](animate/SKILL.md) | Build purposeful interface animations. | `skills/animate` |
| [emil-design-eng](emil-design-eng/SKILL.md) | Apply design engineering and UI polish principles. | `skills/emil-design-eng` |
| [find-animation-opportunities](find-animation-opportunities/SKILL.md) | Find worthwhile motion opportunities without implementing them. | `skills/find-animation-opportunities` |
| [improve-animations](improve-animations/SKILL.md) | Audit existing motion and prepare implementation plans. | `skills/improve-animations` |
| [mobile-native](mobile-native/SKILL.md) | Improve how web interfaces behave on phones. | `skills/mobile-native` |
| [remove-animations](remove-animations/SKILL.md) | Remove or simplify unnecessary motion. | `skills/remove-animations` |
| [review-animations](review-animations/SKILL.md) | Review animation changes against a defined craft bar. | `skills/review-animations` |
| [pick-ui-library](pick-ui-library/SKILL.md) | Choose an appropriate UI library; explicitly invoked by `animate` when a component needs one. | `skills/pick-ui-library` |

## Installation

The root installer discovers these skills alongside the main collection and Matt Pocock's skills:

```bash
./install.sh break-ui animate emil-design-eng find-animation-opportunities improve-animations mobile-native remove-animations review-animations pick-ui-library
```

The default targets are Claude Code and Codex; select `--claude`, `--codex`, or `--hermes` as needed. Archiving these skills does not install them into any local agent. The seven requested additions match the installed Claude copies byte-for-byte at import time; `pick-ui-library` is additionally included because `animate` explicitly invokes it. Keep every skill’s supporting files with its `SKILL.md`, including `break-ui`’s `CATALOG.md`, animation recipes and review standards.

## Updating

Choose and record an upstream commit, inspect its changes, and replace each selected complete `skills/<name>` directory from upstream. Preserve the license and update the revision and archive date. Other skills in Emil's upstream repository are not included. In particular, Emil's `prototype` is not added: the archive already provides Matt Pocock's skill with that name, and its installer rejects duplicate names. Cross-references to other optional upstream workflows do not mean those workflows are bundled or verified here.
