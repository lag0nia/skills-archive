# software-design

Turn rough requirements into a reviewed software brief, design software behavior, architecture, UI/UX and contracts, assess delivery readiness and write the delivery workpack for a settled Stage 9 handoff.

Intake and delivery planning, formerly the separate `software-design-intake` and `delivery-planning` skills, are now part of this skill: it runs intake when there is no reviewed brief and writes or refreshes the workpack itself. Implementing a workpack belongs to [`software-design-execution`](software-design-execution.md). Re-running the installer leaves earlier links to the two retired skills in place; delete them from `~/.claude/skills` and `~/.agents/skills`, or run `hermes skills uninstall <name>` in Hermes.

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

Node.js is required for the bundled validators and renderers. The GitHub ticket projection additionally requires the gh CLI and authorized GitHub access. Prototype inspection requires a suitable browser; capture-prototype-runtime.mjs accepts a caller-provided Playwright-compatible page or an equivalent observer and does not install or launch a browser. Writing and validating a workpack needs no other skill; pair this skill with [`software-design-execution`](software-design-execution.md) to implement a validated workpack.

System Guide PDF export also needs a Chromium-based browser; see the bundled [PDF export guide](../../skills/software-design/references/guide-pdf-export.md) for discovery and `--browser`. The package includes its fonts, layout code and their notices.

The complete package at the source revision below has 440 files and 11,270,025 bytes (about 10.7 MiB). Version 1.3.0 of Sota's `hermes-harness-ui` plugin allows only 4 MiB per skill and 8 MiB per operation, so it cannot install this complete package. [Plugin 1.3.1](https://github.com/lag0nia/plugins/pull/19) supports 512 files and 40 MiB per skill, within an 80 MiB operation, so this package fits it, also when installed together with `software-design-execution`. Plugin 1.3.1 is bundled in the common Hermes image after v2.6.0, so a machine gets it when it activates that image release. Publishing this archive copy does not update the plugin or installed skills.

Capacity is not the only installation check. An offline scan of the package at the earlier revision `85c42580b9f48bf49bdcef7edce4b1cb5a08296f` using the native Hermes scanner pinned at `v2026.9.24` returned `caution`, which the archive's normal community-source policy refuses. The matches include relative paths in references and test evidence, a template HTML comment and evaluation-isolation wording. That scan has not been re-run for the revision below, so its result is not verified for this package. This source sync preserves the complete upstream package and does not override that policy. Installation through Sota remains unverified until the safety findings and the shared-copy ownership below are resolved through their supported owners.

A copy provided by a shared skill folder is maintained there, and Skills Archive leaves it unchanged. The archive's linked Claude Code/Codex installation and Hermes's image-bundled library are separate distribution paths.

Claude Code, Codex and Hermes load the same SKILL.md and bundled resources. Resolve resource paths relative to the installed skill directory. Existing agents/openai.yaml files are optional Codex UI metadata; other clients use SKILL.md. Installation does not supply missing runtimes or tool capabilities.

## Usage

Ask the agent to use `software-design` for the task described above. Codex also supports `$software-design`. Follow the skill’s inputs, scope and authorization boundaries; installation does not authorize its execution against any project or production system.

## Source

Imported byte-for-byte from [Alangr6/ai-prompts](https://github.com/Alangr6/ai-prompts/tree/5a116fbbf929350db26bdd4ca3810278f69b257b/skills/blueprint-development/technical/software-design) at revision `5a116fbbf929350db26bdd4ca3810278f69b257b`. The complete tracked directory is retained, including tests, assets and third-party notices. There are no local adaptations. Upstream material outside this directory, including the shared blueprint tests and all legacy skills, is excluded.

The upstream repository does not declare a repository-wide license in this revision. This import does not assert a new license for upstream material; preserve any included notices.
