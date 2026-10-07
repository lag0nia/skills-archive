# find-bugs

Discover and independently confirm defects without implementing fixes.

## Install

These commands become available from the archive’s main branch after the corresponding pull request is merged.

Claude Code and Codex:

```sh
curl -fsSL https://raw.githubusercontent.com/lag0nia/skills-archive/main/install.sh | bash -s -- find-bugs
```

One client only: add `--claude` or `--codex` before the skill name. From a local clone, use `./install.sh find-bugs` instead. The installer links the complete package, including scripts, references and assets. Re-run it to update.

Hermes:

```sh
hermes skills install lag0nia/skills-archive/skills/find-bugs --yes
```

Alternatively, run `./install.sh --hermes find-bugs` where Hermes is installed. Use `/reload-skills` in a running Hermes to refresh discovery. Hermes fetches the merged GitHub package; local branch edits are not installed by this command.

## Requirements and host support

Node.js is required for scripts/stage-health.mjs. The host must provide fresh isolated subagents or sessions with context inheritance disabled. Map launch, wait and release operations to the host’s native tools; never simulate independent stages in one conversation. If the required capability is unavailable, report BLOCKED_BY_ENVIRONMENT as the skill specifies.

Claude Code, Codex and Hermes load the same SKILL.md and bundled resources. Resolve resource paths relative to the installed skill directory. Existing agents/openai.yaml files are optional Codex UI metadata; other clients use SKILL.md. Installation does not supply missing runtimes or tool capabilities.

## Usage

Ask the agent to use `find-bugs` for the task described above. Codex also supports `$find-bugs`. Follow the skill’s inputs, scope and authorization boundaries; installation does not authorize its execution against any project or production system.

## Source

Imported from [Alangr6/ai-prompts](https://github.com/Alangr6/ai-prompts/tree/ef249ef32d4e50183d4669741332a4d51078ce40/skills/others/find-bugs) at revision `ef249ef32d4e50183d4669741332a4d51078ce40`. The complete directory is retained, including its tests and any third-party notices. The repository-level software-design.zip and all legacy skills are excluded.

The upstream repository does not declare a repository-wide license in this revision. This import does not assert a new license for upstream material; preserve any included notices.
