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

The complete package at the source revision below has 411 files and 10,437,230 bytes. The Sota Skills Archive marketplace bundled in Hermes image v1.8.0 limits a skill to 250 files and 2 MiB, so it cannot install this version through that marketplace. Its limits belong to the `hermes-harness-ui` plugin in `lag0nia/plugins`; this source sync does not change them. The archive's linked Claude Code/Codex installation and Hermes's image-bundled library are separate distribution paths. Existing marketplace installations are not updated automatically.

Claude Code, Codex and Hermes load the same SKILL.md and bundled resources. Resolve resource paths relative to the installed skill directory. Existing agents/openai.yaml files are optional Codex UI metadata; other clients use SKILL.md. Installation does not supply missing runtimes or tool capabilities.

## Usage

Ask the agent to use `software-design` for the task described above. Codex also supports `$software-design`. Follow the skill’s inputs, scope and authorization boundaries; installation does not authorize its execution against any project or production system.

## Source

Imported byte-for-byte from [Alangr6/ai-prompts](https://github.com/Alangr6/ai-prompts/tree/1499c5dcdf540b89500aa3d2b0e0d4671119ec35/skills/blueprint-development/technical/software-design) at revision `1499c5dcdf540b89500aa3d2b0e0d4671119ec35`. The complete tracked directory is retained, including tests, assets and third-party notices. There are no local adaptations. The repository-level software-design.zip and all legacy skills are excluded.

The upstream repository does not declare a repository-wide license in this revision. This import does not assert a new license for upstream material; preserve any included notices.
