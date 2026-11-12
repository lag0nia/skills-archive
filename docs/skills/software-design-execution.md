# software-design-execution

Implement and verify a Software Design delivery workpack, including bounded later changes.

This skill was previously archived as `delivery-workpack-execution`. A workpack whose execution skill still names `delivery-workpack-execution` routes here and runs unchanged.

## Install

These commands become available from the archive’s main branch after the corresponding pull request is merged.

Claude Code and Codex:

```sh
curl -fsSL https://raw.githubusercontent.com/lag0nia/skills-archive/main/install.sh | bash -s -- software-design software-design-execution
```

One client only: add `--claude` or `--codex` before the skill names. From a local clone, use `./install.sh software-design software-design-execution` instead. The installer links the complete package, including scripts, references and assets. Re-run it to update.

Hermes:

```sh
hermes skills install lag0nia/skills-archive/skills/software-design --yes
hermes skills install lag0nia/skills-archive/skills/software-design-execution --yes
```

Alternatively, run `./install.sh --hermes software-design software-design-execution` where Hermes is installed. Use `/reload-skills` in a running Hermes to refresh discovery. Hermes fetches the merged GitHub package; local branch edits are not installed by this command.

Installations are not renamed automatically. Re-running the installer leaves an earlier `delivery-workpack-execution` link in place; delete it from `~/.claude/skills` and `~/.agents/skills`, or run `hermes skills uninstall delivery-workpack-execution` in Hermes.

## Requirements and host support

Node.js and the installed software-design package are required: the skill's start, check and completion commands pass its actual installation directory through `--software-design-skill` and rerun its workpack validator. Resolve that directory rather than assuming the original repository hierarchy. The target repository’s declared toolchains are required for implementation and verification. Use the host’s available continuation mechanism; a Codex-specific goal API is not required.

The package at the source revision below has 16 files and 99,682 bytes. It is useful only together with software-design, whose capacity and installation limits are described on [its page](software-design.md).

Claude Code, Codex and Hermes load the same SKILL.md and bundled resources. Resolve resource paths relative to the installed skill directory. Existing agents/openai.yaml files are optional Codex UI metadata; other clients use SKILL.md. Installation does not supply missing runtimes or tool capabilities.

## Usage

Ask the agent to use `software-design-execution` for the task described above. Codex also supports `$software-design-execution`. Follow the skill’s inputs, scope and authorization boundaries; installation does not authorize its execution against any project or production system.

## Source

Imported byte-for-byte from [Alangr6/ai-prompts](https://github.com/Alangr6/ai-prompts/tree/5a116fbbf929350db26bdd4ca3810278f69b257b/skills/blueprint-development/delivery/software-design-execution) at revision `5a116fbbf929350db26bdd4ca3810278f69b257b`. The complete tracked directory is retained, including tests, assets and third-party notices. There are no local adaptations. Upstream material outside this directory, including the shared blueprint tests and all legacy skills, is excluded.

The upstream repository does not declare a repository-wide license in this revision. This import does not assert a new license for upstream material; preserve any included notices.
