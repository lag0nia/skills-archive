# skills-archive

Agent skills that work in **Claude Code**, **Codex** and **Hermes**. Each skill is a folder under `skills/` with a `SKILL.md` in the open [Agent Skills](https://agentskills.io) format.

| Skill | What it does |
|---|---|
| [`recap`](skills/recap/SKILL.md) | Catches you up on the current plan: goal, phases with progress, where things stand, recent decisions, risks and the next step. Works mid-task without stopping the work. |

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

Or, where `hermes` is on the PATH, `./install.sh --hermes` installs every skill this way. Start a new session (`/new`) to pick up a new skill.

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

## Adding a skill

1. Create `skills/<name>/SKILL.md` with `name` and `description` frontmatter (keep to those plus `license` so every client accepts it).
2. Add a row to the table above.
3. Push to `main`, then re-run the installer wherever you use it.

## License

MIT
