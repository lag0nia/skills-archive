#!/usr/bin/env node

import { executionIdentity, checkExecutionRecord, startExecution } from "../scripts/execution-record.mjs";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const validator = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "scripts", "validate-delivery-evidence.mjs");
const SNAPSHOT = "sha256:" + "a".repeat(64);
const EXECUTION_NAME = "sha256-" + "a".repeat(64);

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "delivery-evidence-validator-"));
  const repository = path.join(root, "repository");
  const workpack = path.join(root, "delivery-workpacks", "example", "WORKPACK.md");
  const summaryRelative = "delivery-evidence/executions/" + EXECUTION_NAME + "/SUMMARY.md";
  const summary = path.join(repository, summaryRelative);

  write(workpack, `# Example Workpack

## Delivery Objective
Deliver one observable result.

**Software Design snapshot:** \`${SNAPSHOT}\`

## Acceptance Criteria

### AC-001: Observable result

- **Required evidence:** \`VE-001\`

## Verification Evidence Required

### VE-001: Physical proof

- **Supports:** \`AC-001\`
- **Procedure:** \`npm test\`

## Delivery Evidence Contract

- **Evidence root:** \`delivery-evidence/\`
- **Execution summary:** \`${summaryRelative}\`
- **Raw artifacts:** \`delivery-evidence/executions/${EXECUTION_NAME}/artifacts/\` — Optional.
- **Publication receipts:** \`delivery-evidence/receipts/publications/example@1.0.0.json\`
- **Consumer-install receipts:** \`delivery-evidence/receipts/consumers/consumer--example@1.0.0.json\`
- **Compatibility evidence:** \`VE-001\` proves the shipped seam; installation receipts do not establish behavioral compatibility.
- **Historical evidence:** Preserve without rewrite or migration.
`);

  write(summary, `# Execution Summary

**Workpack:** [WORKPACK.md](../../../../delivery-workpacks/example/WORKPACK.md)

**Target repository:** \`${repository}\`

**Execution date:** \`2026-09-02\`

**Starting implementation:** \`None.\`

**Implemented snapshot:** \`${SNAPSHOT}\`

**Outcome:** \`COMPLETE\`

## Acceptance Criteria

### AC-001: Observable result

- **Status:** \`PASS\`
- **Evidence:** \`VE-001\`
- **Observed result:** The public result was physically observed.

## Verification Evidence

### VE-001: Physical proof

- **Supports:** \`AC-001\`
- **Status:** \`PASS\`
- **Procedure:** \`npm test\`
- **Observed result:** The required test completed successfully.
- **Artifacts:** \`None.\`
`);

  write(path.join(repository, "delivery-evidence", "README.md"), `# Delivery Evidence

**Latest implemented snapshot:** \`${SNAPSHOT}\`

**Latest execution summary:** [Execution summary](./executions/${EXECUTION_NAME}/SUMMARY.md)
`);

  write(path.join(repository, "delivery-evidence", "IMPLEMENTATION-DELIVERY-REPORT.md"), `# Implementation Delivery Report

**Implemented snapshot:** \`${SNAPSHOT}\`

**Outcome:** \`COMPLETE\`

**Execution summary:** [Execution summary](./executions/${EXECUTION_NAME}/SUMMARY.md)
`);

  write(path.join(repository, "delivery-evidence", "receipts", "publications", "example@1.0.0.json"), JSON.stringify({
    schema: "producer-publication-receipt",
    evidence_scope: "producer-publication",
    artifact: "example",
    version: "1.0.0",
    source_revision: "abc123",
    location: "https://registry.example/artifacts/example/1.0.0",
    integrity: "sha256:abc123",
    resolution: "example@1.0.0",
    result: "PASS",
  }, null, 2));

  write(path.join(repository, "delivery-evidence", "receipts", "consumers", "consumer--example@1.0.0.json"), JSON.stringify({
    schema: "consumer-install-receipt",
    evidence_scope: "consumer-install",
    consumer_repository: "consumer",
    artifact: "example",
    version: "1.0.0",
    resolved: "example@1.0.0",
    integrity: "sha256:abc123",
    install_result: "PASS",
  }, null, 2));

  const target = { root, repository, workpack, summary };
  stampFixture(target);
  return target;
}

// Synthetic test evidence only: models a capture at the fixture's execution start.
function stampFixture(target) {
  const identity = executionIdentity(target.workpack);
  for (const file of [target.summary, path.join(target.repository, "delivery-evidence/IMPLEMENTATION-DELIVERY-REPORT.md")]) {
    const text = fs.readFileSync(file, "utf8").replace(/^\*\*(?:Executed snapshot|Executed workpack content|Execution started):\*\*.*\n/gm, "");
    write(file, text + `\n**Executed snapshot:** \`${identity.snapshot}\`\n\n**Executed workpack content:** \`${identity.content}\`\n\n**Execution started:** \`2026-09-28T10:00:00Z\`\n`);
  }
}

function run(target) {
  return spawnSync(process.execPath, [
    validator,
    "--workpack",
    target.workpack,
    "--repository",
    target.repository,
  ], { encoding: "utf8" });
}

test("accepts one snapshot-scoped summary with exact AC/VE coverage and typed receipts", (context) => {
  const target = fixture();
  context.after(() => fs.rmSync(target.root, { recursive: true, force: true }));
  const result = run(target);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Verified snapshot-scoped delivery evidence/);
});

test("derives the canonical evidence path for a pre-existing workpack without the new section", (context) => {
  const target = fixture();
  context.after(() => fs.rmSync(target.root, { recursive: true, force: true }));
  const workpack = fs.readFileSync(target.workpack, "utf8")
    .replace(/## Delivery Evidence Contract[\s\S]*$/, "");
  write(target.workpack, workpack);
  stampFixture(target);
  const result = run(target);
  assert.equal(result.status, 0, result.stderr);
});

test("rejects a completed report whose snapshot is ahead of its execution evidence", (context) => {
  const target = fixture();
  context.after(() => fs.rmSync(target.root, { recursive: true, force: true }));
  const report = path.join(target.repository, "delivery-evidence", "IMPLEMENTATION-DELIVERY-REPORT.md");
  write(report, fs.readFileSync(report, "utf8").replace(SNAPSHOT, "sha256:" + "b".repeat(64)));
  const result = run(target);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Implementation delivery report snapshot does not match/);
});

test("rejects planned or missing VE completion in the execution summary", (context) => {
  const target = fixture();
  context.after(() => fs.rmSync(target.root, { recursive: true, force: true }));
  write(target.summary, fs.readFileSync(target.summary, "utf8").replace(
    "### VE-001: Physical proof\n\n- **Supports:** `AC-001`\n- **Status:** `PASS`",
    "### VE-001: Physical proof\n\n- **Supports:** `AC-001`\n- **Status:** `PLANNED`",
  ));
  const result = run(target);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /VE-001 summary status must be PASS/);
});

test("rejects obsolete versioned receipt schemas", (context) => {
  const target = fixture();
  context.after(() => fs.rmSync(target.root, { recursive: true, force: true }));
  const receipt = path.join(target.repository, "delivery-evidence", "receipts", "publications", "example@1.0.0.json");
  const value = JSON.parse(fs.readFileSync(receipt, "utf8"));
  value.schema_version = "ProducerPublicationReceiptV1";
  write(receipt, JSON.stringify(value, null, 2));
  const result = run(target);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /obsolete schema_version/);
});

test("rejects artifact links outside the current execution artifacts directory", (context) => {
  const target = fixture();
  context.after(() => fs.rmSync(target.root, { recursive: true, force: true }));
  const outside = path.join(target.repository, "delivery-evidence", "outside.log");
  write(outside, "PASS\n");
  write(target.summary, fs.readFileSync(target.summary, "utf8").replace(
    "**Artifacts:** `None.`",
    "**Artifacts:** [outside](../../outside.log)",
  ));
  const result = run(target);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /artifact is outside the current execution artifacts directory/);
});

function humanFacing(target, { mode = "`agent inspection`" } = {}) {
  write(target.workpack, fs.readFileSync(target.workpack, "utf8")
    .replace("- **Required evidence:** `VE-001`", "- **Required evidence:** `VE-001`, `VE-002`")
    .replace("## Delivery Evidence Contract", `### VE-002: Implemented UI/UX review

- **Supports:** \`AC-001\`
- **Procedure:** Open the built application and compare the covered journeys with the selected candidate.

## Stage 9 Obligation Coverage

### UI/UX Delivery Coverage

- **Implemented UI/UX review mode:** ${mode}

| Journey | Acceptance | Functional evidence | Implemented UI/UX evidence |
| --- | --- | --- | --- |
| [Main](../../software-design/ui-ux/specification.md#journey-main) | \`AC-001\` | \`VE-001\` | \`VE-002\` |
| [Recovery](../../software-design/ui-ux/specification.md#journey-recovery) | \`AC-001\` | \`VE-001\` | \`VE-002\` |

## Delivery Evidence Contract`));
  write(path.join(path.dirname(target.summary), "artifacts", "main-390.png"), "png");
  write(target.summary, fs.readFileSync(target.summary, "utf8")
    .replace("- **Evidence:** `VE-001`", "- **Evidence:** `VE-001`, `VE-002`")
    .concat(`
### VE-002: Implemented UI/UX review

- **Supports:** \`AC-001\`
- **Status:** \`PASS\`
- **Procedure:** Opened the built application at 390px and 1280px and exercised both journeys.
- **Observed result:** Layout, hierarchy, controls, and recovery interaction match the selected candidate.
- **Artifacts:** [Main at 390px](./artifacts/main-390.png)

## UI/UX Delivery Review

- **Reviewed build:** \`abc123\` started with \`npm start\`.
- **Viewports and states:** 390px and 1280px; empty, success, error, and recovery.
- **Review mode:** ${mode}
- **Deviations and limitations:** \`None.\`

| Journey | Functional evidence | Implemented UI/UX evidence | Result |
| --- | --- | --- | --- |
| Main #journey-main | \`VE-001\` | \`VE-002\` | \`PASS\` — completion persists and matches the candidate. |
| Recovery #journey-recovery | \`VE-001\` | \`VE-002\` | \`PASS\` — retry preserves context as illustrated. |
`));
  stampFixture(target);
}

test("accepts human-facing completion evidence covering every planned journey", (context) => {
  const target = fixture();
  context.after(() => fs.rmSync(target.root, { recursive: true, force: true }));
  humanFacing(target);
  const result = run(target);
  assert.equal(result.status, 0, result.stderr);
});

test("rejects human-facing completion without a UI/UX Delivery Review", (context) => {
  const target = fixture();
  context.after(() => fs.rmSync(target.root, { recursive: true, force: true }));
  humanFacing(target);
  write(target.summary, fs.readFileSync(target.summary, "utf8").replace(/## UI\/UX Delivery Review[\s\S]*$/, ""));
  const result = run(target);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /must record ## UI\/UX Delivery Review/);
});

test("rejects completion that omits a planned journey or changes its evidence", (context) => {
  const target = fixture();
  context.after(() => fs.rmSync(target.root, { recursive: true, force: true }));
  humanFacing(target);
  write(target.summary, fs.readFileSync(target.summary, "utf8")
    .replace(/^\| Recovery #journey-recovery.*\n/m, "")
    .replace("| Main #journey-main | `VE-001` | `VE-002` |", "| Main #journey-main | `VE-001` | `VE-001` |"));
  const result = run(target);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /omits workpack journey journey-recovery/);
  assert.match(result.stderr, /journey journey-main evidence does not match the workpack mapping/);
});

test("rejects implemented UI/UX evidence without retained screenshots", (context) => {
  const target = fixture();
  context.after(() => fs.rmSync(target.root, { recursive: true, force: true }));
  humanFacing(target);
  write(target.summary, fs.readFileSync(target.summary, "utf8").replace("- **Artifacts:** [Main at 390px](./artifacts/main-390.png)", "- **Artifacts:** `None.`"));
  const result = run(target);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /VE-002 implemented UI\/UX evidence must link at least one retained screenshot image/);
});

test("log-only implemented UI/UX evidence fails while a retained screenshot passes", (context) => {
  const target = fixture();
  context.after(() => fs.rmSync(target.root, { recursive: true, force: true }));
  humanFacing(target);
  const artifacts = path.join(path.dirname(target.summary), "artifacts");
  write(path.join(artifacts, "ui-review.log"), "Compared main journey at 390px: PASS\n");
  const withArtifacts = (links) => write(target.summary, fs.readFileSync(target.summary, "utf8")
    .replace(/^- \*\*Artifacts:\*\* \[.*$/m, "- **Artifacts:** " + links));

  withArtifacts("[Review log](./artifacts/ui-review.log)");
  const logOnly = run(target);
  assert.equal(logOnly.status, 1);
  assert.match(logOnly.stderr, /VE-002 implemented UI\/UX evidence must link at least one retained screenshot image/);

  withArtifacts("[Main at 390px](./artifacts/main-390.png); [Review log](./artifacts/ui-review.log)");
  const screenshot = run(target);
  assert.equal(screenshot.status, 0, screenshot.stderr);
});

test("requires recorded human acceptance only when the workpack asks for it", (context) => {
  const target = fixture();
  context.after(() => fs.rmSync(target.root, { recursive: true, force: true }));
  humanFacing(target, { mode: "`agent inspection`, `human acceptance`" });
  const missing = run(target);
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /must record \*\*Human acceptance:\*\*/);

  write(target.summary, fs.readFileSync(target.summary, "utf8").replace(
    "- **Deviations and limitations:**",
    "- **Human acceptance:** Product owner confirmed both journeys on 2026-09-02.\n- **Deviations and limitations:**",
  ));
  const confirmed = run(target);
  assert.equal(confirmed.status, 0, confirmed.stderr);
});

test("a non-UI workpack needs no UI/UX review evidence", (context) => {
  const target = fixture();
  context.after(() => fs.rmSync(target.root, { recursive: true, force: true }));
  const result = run(target);
  assert.equal(result.status, 0, result.stderr);
  assert.doesNotMatch(result.stderr, /UI\/UX/);
});


test("content changes cannot reuse an execution even with the same snapshot and AC/VE IDs", (context) => {
  const target = fixture(); context.after(() => fs.rmSync(target.root, { recursive: true, force: true }));
  assert.doesNotThrow(() => checkExecutionRecord(target.workpack, target.repository));
  write(target.workpack, fs.readFileSync(target.workpack, "utf8").replace("Deliver one observable result.", "Deliver a different requirement."));
  assert.throws(() => checkExecutionRecord(target.workpack, target.repository), /changed since execution start/);
  assert.match(run(target).stderr, /changed since execution start/);
});

for (const field of ["Executed snapshot", "Executed workpack content", "Execution started"]) test("missing start identity blocks verified completion: " + field, (context) => {
  const target = fixture(); context.after(() => fs.rmSync(target.root, { recursive: true, force: true }));
  write(target.summary, fs.readFileSync(target.summary, "utf8").split("\n").filter((line) => !line.startsWith("**" + field + ":**")).join("\n"));
  assert.equal(run(target).status, 1);
});

test("mismatched report content cannot claim the same executed scope", (context) => {
  const target = fixture(); context.after(() => fs.rmSync(target.root, { recursive: true, force: true }));
  const report = path.join(target.repository, "delivery-evidence/IMPLEMENTATION-DELIVERY-REPORT.md");
  write(report, fs.readFileSync(report, "utf8").replace(executionIdentity(target.workpack).content, "sha256:" + "f".repeat(64)));
  assert.match(run(target).stderr, /exact executed workpack content/);
});

// A stubbed readiness process isolates execution-record behavior; the planning
// suite separately exercises real handoff/readiness enforcement.
function planningStub(target, code = "process.exit(0)") {
  const skill = path.join(target.root, "planning-stub");
  write(path.join(skill, "scripts/validate-workpack.mjs"), code);
  return skill;
}

test("start checks readiness, captures once, resumes, and refuses overwrite or drift", (context) => {
  const target = fixture(); context.after(() => fs.rmSync(target.root, { recursive: true, force: true }));
  fs.rmSync(target.summary);
  const options = { ...target, planningSkill: planningStub(target, "process.exit(1)"), softwareDesignSkill: target.root };
  assert.throws(() => startExecution(options), /readiness failed/);
  assert.ok(!fs.existsSync(target.summary));
  planningStub(target);
  assert.equal(startExecution(options), target.summary);
  assert.doesNotThrow(() => checkExecutionRecord(target.workpack, target.repository));
  assert.throws(() => startExecution(options), /interrupted execution/);
  assert.equal(run(target).status, 1, "IN_PROGRESS cannot be complete");
  write(target.workpack, fs.readFileSync(target.workpack, "utf8") + "\nNew scope\n");
  assert.throws(() => checkExecutionRecord(target.workpack, target.repository), /changed since execution start/);
});

test("documentation-only refresh retains old execution; requirement changes cannot relabel it", (context) => {
  const target = fixture(); context.after(() => fs.rmSync(target.root, { recursive: true, force: true }));
  const basis = path.join(target.root, "historical-WORKPACK.md");
  fs.copyFileSync(target.workpack, basis);
  const next = "sha256:" + "b".repeat(64);
  write(target.workpack, fs.readFileSync(target.workpack, "utf8").replaceAll(SNAPSHOT, next).replaceAll(EXECUTION_NAME, next.replace(":", "-")));
  for (const name of ["README.md", "IMPLEMENTATION-DELIVERY-REPORT.md"]) {
    const file = path.join(target.repository, "delivery-evidence", name);
    write(file, fs.readFileSync(file, "utf8").replace(/(\*\*(?:Latest implemented|Implemented) snapshot:\*\* `)[^`]+/, "$1" + next) + "\n**Refresh classification:** No implementation impact — Only the reconciled handoff identity changed.\n");
  }
  const args = [validator, "--workpack", target.workpack, "--repository", target.repository, "--basis-workpack", basis, "--planning-skill", planningStub(target), "--software-design-skill", target.root];
  let result = spawnSync(process.execPath, args, { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  assert.match(fs.readFileSync(target.summary, "utf8"), new RegExp(SNAPSHOT));
  assert.equal(run(target).status, 1, "current-snapshot execution was never created");
  write(target.workpack, fs.readFileSync(target.workpack, "utf8").replace("Deliver one observable result.", "Deliver an additional result."));
  result = spawnSync(process.execPath, args, { encoding: "utf8" });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /beyond snapshot propagation/);
});
