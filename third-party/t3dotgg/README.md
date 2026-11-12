# Theo Browne's council skill

Selected third-party skill copied unchanged from [t3dotgg/tstack](https://github.com/t3dotgg/tstack).

- Upstream revision: [`11e37a74d0a6868c121cd0910ab2b3bd9873b92a`](https://github.com/t3dotgg/tstack/tree/11e37a74d0a6868c121cd0910ab2b3bd9873b92a)
- Archived: 2026-11-12
- License: [MIT](LICENSE), copyright 2026 Theo Browne.
- Local modifications: none.

| Skill | Purpose | Upstream directory |
| --- | --- | --- |
| [council](council/SKILL.md) | Get review from one flagship model from each of three providers, fix what they agree on, and repeat until all are satisfied. Code reviews get a score out of 10 per round. | `skills/council` |

## Installation and dependencies

The root installer discovers this skill automatically:

```bash
./install.sh council
```

Select `--claude`, `--codex`, or `--hermes` as needed. Say "council" to trigger it.

The skill needs subagents on three different providers' models, for example Claude Opus, GPT and Gemini Pro. T3 Code provides this through `delegate_task`; elsewhere the harness must be able to run those models itself. If three providers are not reachable, or a named member is unavailable, the skill reports it instead of substituting a model. Put your preferred council members in `CLAUDE.md` or `AGENTS.md` (Hermes: `SOUL.md`) rather than editing the skill.

When the work ends in a pull request, the skill writes a score table into the PR description, which needs an authenticated `gh`.

## Updating

Choose and record an upstream commit, inspect its changes, then replace the complete `skills/council` directory. Preserve the upstream license and update the revision and archive date. The other tstack skills (`full-send`, `full-stop`, `sol-loop`, `file-pr`, `babysit-pr`, `modernize`, `takeover`, `leaving-pr-comments`) are not included.
