# Software Design Execution tests

Run the portable test suite from the skill directory:

```sh
node --test tests/*.test.mjs
```

Keep structural contract assertions and isolated behavioral tests here. Executable validators belong in `../scripts/`.

The suite needs no other skill: tests stub the Software Design workpack validator with a disposable `scripts/validate-workpack.mjs` and pass its directory as `--software-design-skill`. Real readiness enforcement is tested with the Software Design skill. Automated checks establish declared structural invariants, not semantic completeness or observed application execution.
