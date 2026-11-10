# software-design

Design software behavior, architecture, UI/UX, contracts and delivery readiness.

## Install

These commands become available from the archive’s main branch after the corresponding pull request is merged.

Claude Code and Codex:

```sh
curl -fsSL https://raw.githubusercontent.com/lag0nia/skills-archive/main/install.sh | bash -s -- software-design
```

One client only: add `--claude` or `--codex` before the skill name. From a local clone, use `./install.sh software-design` instead. The installer links the complete package, including scripts, references and assets. Re-run it to update.

Hermes:

```sh
hermes skills install lag0nia/skills-archive/skills/software-design --yes
```

Alternatively, run `./install.sh --hermes software-design` where Hermes is installed. Use `/reload-skills` in a running Hermes to refresh discovery. Hermes fetches the merged GitHub package; local branch edits are not installed by this command.

## Requirements and host support

Node.js is required for the bundled validators and renderers. The GitHub ticket projection additionally requires the gh CLI and authorized GitHub access. Prototype inspection requires a suitable browser; capture-prototype-runtime.mjs accepts a caller-provided Playwright-compatible page or an equivalent observer and does not install or launch a browser. Install delivery-planning separately when proceeding to implementation planning.

System Guide PDF export also needs a Chromium-based browser; see the bundled [PDF export guide](../../skills/software-design/references/guide-pdf-export.md) for discovery and `--browser`. The package includes its fonts, layout code and their notices.

The complete package at the source revision below has 418 files and 11,017,376 bytes. Version 1.3.0 of Sota's `hermes-harness-ui` plugin allows only 4 MiB per skill and 8 MiB per operation, so it cannot install this complete package. The capacity change prepared as [plugin 1.3.1](https://github.com/lag0nia/plugins/pull/19) supports 512 files and 40 MiB per skill, within an 80 MiB operation. It must be delivered on the selected connection separately; publishing this archive copy does not deploy the plugin or update installed skills automatically.

Capacity is not the only installation check. An offline scan of this exact package using the native Hermes scanner pinned at `v2026.9.24` returned `caution`, which the archive's normal community-source policy refuses. The matches include relative paths in references and test evidence, a template HTML comment and evaluation-isolation wording. This source sync preserves the complete upstream package and does not override that policy. Installation through Sota remains unverified until the safety findings and the shared-copy ownership below are resolved through their supported owners.

A copy provided by a shared skill folder is maintained there, and Skills Archive leaves it unchanged. The archive's linked Claude Code/Codex installation and Hermes's image-bundled library are separate distribution paths.

Claude Code, Codex and Hermes load the same SKILL.md and bundled resources. Resolve resource paths relative to the installed skill directory. Existing agents/openai.yaml files are optional Codex UI metadata; other clients use SKILL.md. Installation does not supply missing runtimes or tool capabilities.

## Usage

Ask the agent to use `software-design` for the task described above. Codex also supports `$software-design`. Follow the skill’s inputs, scope and authorization boundaries; installation does not authorize its execution against any project or production system.

## Source

Imported byte-for-byte from [Alangr6/ai-prompts](https://github.com/Alangr6/ai-prompts/tree/85c42580b9f48bf49bdcef7edce4b1cb5a08296f/skills/blueprint-development/technical/software-design) at revision `85c42580b9f48bf49bdcef7edce4b1cb5a08296f`. The complete tracked directory is retained, including tests, assets and third-party notices. There are no local adaptations. The repository-level software-design.zip and all legacy skills are excluded.

The upstream repository does not declare a repository-wide license in this revision. This import does not assert a new license for upstream material; preserve any included notices.
