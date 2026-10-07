# Codebase Cleanup tests

Run the portable structural suite from the skill directory:

```sh
node --test tests/*.test.mjs
```

`package-contract.test.mjs` checks the package, not agent behavior: frontmatter limits; relative links that resolve inside the skill, including from an isolated copy; no machine-specific paths, other-skill references or provider-specific tools in agent-facing files; every reference and asset reachable from `SKILL.md`; plan template sections and status values (in every agent-facing file) consistent with `references/maintenance-records.md`; and `maintenance/` paths that follow the shared layout.

`references/maintenance-records.md` is shared byte-for-byte with the codebase-restructure skill so both skills write the same target-repository records while each remains installable alone. The test pins its SHA-256. When you change it, apply the same change to the other copy and update the hash in both skills' tests.

Behavioral validation uses [scenarios.md](scenarios.md). Passing the structural suite says nothing about how an agent follows the skill.

`continuation-fixture.test.mjs` checks that the offline repeat-inspection fixture has
verifiable history and working dynamic/implicit consumers. It does not run an agent.
Scenario 24 covers fresh-agent and same-agent continuation through actual record
comparisons, including a subsequent pass with no additional findings.
