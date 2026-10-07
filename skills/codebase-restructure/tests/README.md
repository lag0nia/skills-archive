# Codebase Restructure tests

Run the portable structural suite from the skill directory:

```sh
node --test tests/*.test.mjs
```

`package-contract.test.mjs` checks the package, not agent behavior: frontmatter limits; relative links that resolve inside the skill, including from an isolated copy; no machine-specific paths, other-skill references or provider-specific tools in agent-facing files; every reference and asset reachable from `SKILL.md`; plan template sections, plan statuses and decision statuses (in every agent-facing file) consistent with `references/maintenance-records.md`; and `maintenance/` paths that follow the shared layout, read from the visible text of HTML assets.

`report-assets.test.mjs` checks the HTML report starter and example: both are linked from `references/visual-report.md`; they load nothing from outside the page (no external scripts, styles, fonts, images or file links); they contain no input controls, storage, tracking or network calls; internal links and ARIA references resolve to unique ids; they declare language, encoding, viewport and title; every SVG is decorative or has a text alternative; and the example has no leftover placeholders and is marked fictional. None of this shows that a report is clear, correct or well designed; render and inspect populated reports for that.

`references/maintenance-records.md` is shared byte-for-byte with the codebase-cleanup skill so both skills write the same target-repository records while each remains installable alone. The test pins its SHA-256. When you change it, apply the same change to the other copy and update the hash in both skills' tests.

Behavioral validation uses [scenarios.md](scenarios.md). Passing the structural suite says nothing about how an agent follows the skill.

`create-architecture-fixture.py` builds the offline repository used by scenarios 14–21 and 23–32; `architecture-fixture.test.mjs` checks that the fixture keeps its intended baseline failure, coupling, drift and history. It does not run an agent.

`THIRD_PARTY_NOTICES.md` at the skill root records the adapted upstream material, its revision and its license. It is provenance, not an agent instruction, so it is deliberately not linked from `SKILL.md`; keep it in installed copies.
