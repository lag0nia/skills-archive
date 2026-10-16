# codebase-restructure

Assess architecture and plan or implement behavior-preserving restructuring.

## Install

These commands become available from the archive’s main branch after the corresponding pull request is merged.

Claude Code and Codex:

```sh
curl -fsSL https://raw.githubusercontent.com/lag0nia/skills-archive/main/install.sh | bash -s -- codebase-restructure
```

One client only: add `--claude` or `--codex` before the skill name. From a local clone, use `./install.sh codebase-restructure` instead. The installer links the complete package, including scripts, references and assets. Re-run it to update.

Hermes:

```sh
hermes skills install lag0nia/skills-archive/skills/codebase-restructure --yes
```

Alternatively, run `./install.sh --hermes codebase-restructure` where Hermes is installed. Use `/reload-skills` in a running Hermes to refresh discovery. Hermes fetches the merged GitHub package; local branch edits are not installed by this command.

## Requirements and host support

Use the target repository’s existing toolchains. Node.js and Python 3 are needed only for the bundled offline tests and fixture generators. Preserve THIRD_PARTY_NOTICES.md when copying the package.

Claude Code, Codex and Hermes load the same SKILL.md and bundled resources. Resolve resource paths relative to the installed skill directory. Existing agents/openai.yaml files are optional Codex UI metadata; other clients use SKILL.md. Installation does not supply missing runtimes or tool capabilities.

## Usage

Ask the agent to use `codebase-restructure` for the task described above. Codex also supports `$codebase-restructure`. Follow the skill’s inputs, scope and authorization boundaries; installation does not authorize its execution against any project or production system.

## Source

Imported byte-for-byte from [Alangr6/ai-prompts](https://github.com/Alangr6/ai-prompts/tree/1499c5dcdf540b89500aa3d2b0e0d4671119ec35/skills/others/codebase-restructure) at revision `1499c5dcdf540b89500aa3d2b0e0d4671119ec35`. The complete tracked directory is retained, including tests, assets and third-party notices. There are no local adaptations. The repository-level software-design.zip and all legacy skills are excluded.

The upstream repository does not declare a repository-wide license in this revision. This import does not assert a new license for upstream material; preserve any included notices.
