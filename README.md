# skills-archive

Agent skills that work in **Claude Code**, **Codex** and **Hermes**. The main collection lives under `skills/`, with each skill containing a `SKILL.md` in the open [Agent Skills](https://agentskills.io) format. Selected skills from other authors are archived separately under `third-party/`.

| Skill | What it does |
|---|---|
| [`recap`](skills/recap/SKILL.md) | Catches you up on the current plan: goal, phases with progress, where things stand, recent decisions, risks and the next step. Works mid-task without stopping the work. |
| [`quiet`](skills/quiet/SKILL.md) | Quiet mode for long workflows: once on, the agent (and its subagents) only writes when the work is done, when you must intervene, or to answer you. |
| [`repo-workflow`](skills/repo-workflow/SKILL.md) | Change procedure for any git repository: a branch per feature, small commits, a PR for every change, and a merge into the default branch only through that PR and only with your approval. |
| [`software-design`](skills/software-design/SKILL.md) | Turn rough requirements into a reviewed software brief, design behavior, architecture, UI/UX and contracts, assess delivery readiness and write the delivery workpack. [Installation and requirements](docs/skills/software-design.md). |
| [`software-design-execution`](skills/software-design-execution/SKILL.md) | Implement and verify a Software Design delivery workpack, including bounded later changes. [Installation and requirements](docs/skills/software-design-execution.md). |
| [`codebase-cleanup`](skills/codebase-cleanup/SKILL.md) | Remove obsolete code and unnecessary complexity while preserving supported behavior. [Installation and requirements](docs/skills/codebase-cleanup.md). |
| [`codebase-restructure`](skills/codebase-restructure/SKILL.md) | Assess architecture and plan or implement behavior-preserving restructuring. [Installation and requirements](docs/skills/codebase-restructure.md). |
| [`find-bugs`](skills/find-bugs/SKILL.md) | Discover and independently confirm defects without implementing fixes. [Installation and requirements](docs/skills/find-bugs.md). |
| [`task-brief`](skills/task-brief/SKILL.md) | Capture a durable task brief and plan in one Markdown file. [Installation and requirements](docs/skills/task-brief.md). |

## Third-party skills

[Matt Pocock’s selected skills](third-party/mattpocock/README.md): `prototype`, `wait-what`, `code-review`, `diagnosing-bugs`, `retro`, `writing-for-agents`, and `to-questionnaire`. Their source revision, license, dependencies, and update notes are recorded with the collection. The root installer includes these skills and accepts their names just like the main collection.

[Emil Kowalski’s UI and animation skills](third-party/emilkowalski/README.md): `break-ui` plus animation construction, review, audit, discovery, removal, design engineering, mobile polish and UI-library selection. Complete upstream directories and MIT attribution are preserved.

[Lauren Tan (poteto)’s pstack verification skills](third-party/poteto/README.md): `statechart`, the runtime and formal verification create/maintain pairs, and `correct`. The collection explains their differences, prerequisites and source revision; the root installer discovers all six names.

[Morluto’s REA skill](third-party/morluto/README.md): `reverse-engineer-anything`, investigating shipped artifacts and runtime behavior with REA. The upstream skill, six reference files, and MIT license are preserved; the root installer accepts its name. Using it requires REA tools to be configured separately.

[Theo Browne’s council skill](third-party/t3dotgg/README.md): `council`, cross-provider review by one flagship model from each of three providers, repeated in rounds until all are satisfied. It needs those three providers reachable as subagents (T3 Code’s `delegate_task`, or a harness that runs them); the root installer accepts its name.

## Install

### Claude Code + Codex (one command)

```bash
curl -fsSL https://raw.githubusercontent.com/lag0nia/skills-archive/main/install.sh | bash
```

This clones the archive to `~/.skills-archive` and links every skill from `skills/` and `third-party/<author>/` into `~/.claude/skills` (Claude Code) and `~/.agents/skills` (Codex). Run the same command again to update: the links point at the clone, so a `git pull` is all it takes.

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

To install only the seven Matt Pocock skills:

```bash
./install.sh prototype wait-what code-review diagnosing-bugs retro writing-for-agents to-questionnaire
```

Use `--claude`, `--codex`, or `--hermes` to select a target. Install `writing-for-agents` alongside `retro`, which invokes it. Skill names must be unique across both collections; the installer rejects duplicate names rather than choosing a source silently.

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

## Catalog

[`catalog.json`](catalog.json) describes the archive for apps that browse it (schema `skills-archive.catalog.v1`). It is metadata only: installers ignore it, and a skill's `SKILL.md` stays the source of its name, description and instructions.

- `purposes`: the purpose labels a skill can have, in the order apps list them.
- `collections`: the main collection and each third-party collection by its folder (`main`, then the `third-party/<author>` name): its display name, path, author (null for the main collection, which records none separately), a one-line summary, groups of skills that work together (`sequence` when they are used in that order), a note on how they relate, what to know before installing, and the source facts its README records (upstream, revision, license, archive date, modifications).
- `skills`: each skill by its folder name: its collection, display name, purpose, a one-line summary, an icon name, what it does to a project where that matters (`effect`, such as "Changes code"), when to use it, its prerequisites as the collection README lists them (a prerequisite that is another skill names it in `skill`), the skill it is most easily confused with (`compare`) and a note on its name where another author's skill shares it. A third-party skill archived from another revision than its collection records it in `source`.
- `comparisons`: side-by-side rows for those easily confused pairs, in the order of `skills`, with a closing note where the READMEs give one.

Wording is condensed from the collection READMEs and each `SKILL.md`; keep it in step when a skill or its README changes. Skill and collection names must exist in the archive, and every skill in the archive has an entry.

## Adding a skill

1. Create `skills/<name>/SKILL.md` with `name` and `description` frontmatter (keep to those plus `license` so every client accepts it).
2. Add a row to the table above and an entry to [`catalog.json`](catalog.json) (and to a group of its collection).
3. Commit on a branch, open a pull request and merge it (see `repo-workflow`), then re-run the installer wherever you use it.

## License

MIT
