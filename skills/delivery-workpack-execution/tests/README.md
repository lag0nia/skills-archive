# Delivery Workpack Execution tests

Run the portable test suite from the skill directory:

```sh
node --test tests/*.test.mjs
```

Keep instruction-contract assertions and isolated behavioral tests here. Executable validators belong in `../scripts/`.

Planning/execution regressions use disposable local fixtures. Explicit `--validation-mode planning|execution` is tested through the relevant CLI/wrapper; omitted mode stays strict. See [planning-execution-contract.md](../references/planning-execution-contract.md) for the additive INPUT/INT, OUTPUT, CAP and review formats. Automated checks establish declared structural invariants, not semantic completeness or observed application execution.
