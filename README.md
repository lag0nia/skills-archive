# skills-archive

Agent skills that work in **Claude Code**, **Codex** and **Hermes**. Each skill is a folder under `skills/` with a `SKILL.md` in the open [Agent Skills](https://agentskills.io) format.

| Skill | What it does |
|---|---|
| [`recap`](skills/recap/SKILL.md) | Catches you up on the current plan: goal, phases with progress, where things stand, recent decisions, risks and the next step. Works mid-task without stopping the work. |
| [`quiet`](skills/quiet/SKILL.md) | Quiet mode for long workflows: once on, the agent (and its subagents) only writes when the work is done, when you must intervene, or to answer you. |
| [`repo-workflow`](skills/repo-workflow/SKILL.md) | Change procedure for any git repository: a branch per feature, small commits, a PR for every change, and a merge into the default branch only through that PR and only with your approval. |
| [`software-design`](skills/software-design/SKILL.md) | Design software behavior, architecture, UI/UX, contracts and delivery readiness. [Installation and requirements](docs/skills/software-design.md). |
| [`software-design-intake`](skills/software-design-intake/SKILL.md) | Turn rough software requirements into a reviewed software brief. [Installation and requirements](docs/skills/software-design-intake.md). |
| [`delivery-planning`](skills/delivery-planning/SKILL.md) | Turn a ready software-design handoff into a verifiable delivery workpack. [Installation and requirements](docs/skills/delivery-planning.md). |
| [`delivery-workpack-execution`](skills/delivery-workpack-execution/SKILL.md) | Implement and verify a delivery workpack, including bounded later changes. [Installation and requirements](docs/skills/delivery-workpack-execution.md). |
| [`codebase-cleanup`](skills/codebase-cleanup/SKILL.md) | Remove obsolete code and unnecessary complexity while preserving supported behavior. [Installation and requirements](docs/skills/codebase-cleanup.md). |
| [`codebase-restructure`](skills/codebase-restructure/SKILL.md) | Assess architecture and plan or implement behavior-preserving restructuring. [Installation and requirements](docs/skills/codebase-restructure.md). |
| [`find-bugs`](skills/find-bugs/SKILL.md) | Discover and independently confirm defects without implementing fixes. [Installation and requirements](docs/skills/find-bugs.md). |
| [`task-brief`](skills/task-brief/SKILL.md) | Capture a durable task brief and plan in one Markdown file. [Installation and requirements](docs/skills/task-brief.md). |

## Install

### Claude Code + Codex (one command)

```bash
curl -fsSL https://raw.githubusercontent.com/lag0nia/skills-archive/main/install.sh | bash
```

This clones the archive to `~/.skills-archive` and links every skill into `~/.claude/skills` (Claude Code) and `~/.agents/skills` (Codex). Run the same command again to update: the links point at the clone, so a `git pull` is all it takes.

Only some skills or targets:

```bash
curl -fsSL https://raw.githubusercontent.com/lag0nia/skills-archive/main/install.sh | bash -s -- --claude recap
```

From a clone, `./install.sh` links that clone instead, so edits are live:

```bash
git clone https://github.com/lag0nia/skills-archive.git && ./skills-archive/install.sh
```

### Hermes

Hermes installs skills straight from GitHub:

```bash
hermes skills install lag0nia/skills-archive/skills/recap --yes
```

Or, where `hermes` is on the PATH, `./install.sh --hermes` installs every skill this way. In a running Hermes, `/reload-skills` picks up a new skill without a restart.

### Other agents (skills.sh)

The layout is compatible with the [`skills`](https://github.com/vercel-labs/skills) CLI:

```bash
npx skills add lag0nia/skills-archive
```

That CLI copies the files instead of linking them, so pick one method per machine.

## Options

```text
install.sh [--claude] [--codex] [--hermes] [--all] [--list] [--uninstall] [skill ...]
```

- No target: `--claude --codex`. No skill names: all skills.
- `CLAUDE_SKILLS_DIR`, `CODEX_SKILLS_DIR`, `HERMES_BIN` and `SKILLS_ARCHIVE_DIR` override the default paths.
- An existing folder with the same name that is not a link is left alone and reported.

## Using `recap`

- **Claude Code / Codex:** type `/recap` (or just "recap", "ponme al día", "¿por dónde vamos?"). While the agent is working, send it as a message: it answers and carries on.
- **Hermes:** `/recap` when idle. While a turn is running, use `/steer recap` so the turn is not interrupted. If you type it normally and your `busy_input_mode` interrupts the turn, the skill resumes the interrupted work after the recap.

## Using `quiet`

- Turn it on once per conversation: `/quiet` (or "modo silencio", "avísame solo al terminar"). It stays on until you say "quiet off" or "modo normal".
- Works the same in Claude Code, Codex and Hermes (`/quiet`). Delegated workers get the same rule.
- You can combine it with `/recap` at any time: a question always gets an answer, and the work carries on.

## Using `repo-workflow`

The skill triggers by itself when an agent is about to change files, commit, push or merge in a git repository. To make it apply in **every** repository, add this line once to each agent's global instructions:

> In any git repository, follow the `repo-workflow` skill before changing files: never commit or push to the default branch; every change goes through a branch and a pull request that is merged only with my approval.

| Agent | Global instructions file |
|---|---|
| Claude Code | `~/.claude/CLAUDE.md` |
| Codex | `~/.codex/AGENTS.md` |
| Hermes | `SOUL.md` in the Hermes home (`$HERMES_HOME`) |

To approve a merge, tell the agent "merge" (or "mergea") for that PR, or merge it yourself on GitHub.

## Adding a skill

1. Create `skills/<name>/SKILL.md` with `name` and `description` frontmatter (keep to those plus `license` so every client accepts it).
2. Add a row to the table above.
3. Commit on a branch, open a pull request and merge it (see `repo-workflow`), then re-run the installer wherever you use it.

## License

MIT
