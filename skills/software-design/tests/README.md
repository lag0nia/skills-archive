# Software Design tests

Run the complete portable test suite from any working directory:

```sh
node <software-design-skill-directory>/tests/run.mjs
```

Keep executable skill commands in `../scripts/`. Place Node test files in the domain folder that owns the behavior, use the `.test.mjs` suffix, and keep reusable temporary-workspace helpers in `support/`.
