# delivery-planning

Turn a ready software-design handoff into a verifiable delivery workpack.

## Install

These commands become available from the archive’s main branch after the corresponding pull request is merged.

Claude Code and Codex:

```sh
curl -fsSL https://raw.githubusercontent.com/lag0nia/skills-archive/main/install.sh | bash -s -- software-design delivery-planning
```

One client only: add `--claude` or `--codex` before the skill name. From a local clone, use `./install.sh software-design delivery-planning` instead. The installer links the complete package, including scripts, references and assets. Re-run it to update.

Hermes:

```sh
hermes skills install lag0nia/skills-archive/skills/software-design --yes
hermes skills install lag0nia/skills-archive/skills/delivery-planning --yes
```

Alternatively, run `./install.sh --hermes software-design delivery-planning` where Hermes is installed. Use `/reload-skills` in a running Hermes to refresh discovery. Hermes fetches the merged GitHub package; local branch edits are not installed by this command.

## Requirements and host support

Node.js and the installed software-design package are required. Pass its actual installation directory through --software-design-skill; do not assume the original repository hierarchy. Install delivery-workpack-execution separately to implement the generated workpack.

Claude Code, Codex and Hermes load the same SKILL.md and bundled resources. Resolve resource paths relative to the installed skill directory. Existing agents/openai.yaml files are optional Codex UI metadata; other clients use SKILL.md. Installation does not supply missing runtimes or tool capabilities.

## Usage

Ask the agent to use `delivery-planning` for the task described above. Codex also supports `$delivery-planning`. Follow the skill’s inputs, scope and authorization boundaries; installation does not authorize its execution against any project or production system.

## Source

Imported from [Alangr6/ai-prompts](https://github.com/Alangr6/ai-prompts/tree/ef249ef32d4e50183d4669741332a4d51078ce40/skills/blueprint-development/delivery/delivery-planning) at revision `ef249ef32d4e50183d4669741332a4d51078ce40`. The complete directory is retained, including its tests and any third-party notices. The repository-level software-design.zip and all legacy skills are excluded.

The upstream repository does not declare a repository-wide license in this revision. This import does not assert a new license for upstream material; preserve any included notices.
