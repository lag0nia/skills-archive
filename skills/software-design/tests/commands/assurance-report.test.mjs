#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  blueprintSnapshotDigest,
  loadAssuranceContext,
  sha256File,
} from "../../scripts/lib/model/assurance-coverage.mjs";
import { validateAssuranceResult } from "../../scripts/render-assurance-report.mjs";

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const renderer = path.join(skillRoot, "scripts", "render-assurance-report.mjs");
const coverageValidator = path.join(skillRoot, "scripts", "validate-assurance-coverage.mjs");

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function fixture(context) {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "software-design-assurance-report-"));
  context.after(() => fs.rmSync(workspace, { recursive: true, force: true }));
  const root = path.join(workspace, "design", "software-design");
  const repositoryRoot = path.join(workspace, "example-repository");
  write(path.join(root, "system-model", "architecture.md"), `---
type: system-architecture
name: Example Software Design
assurance_id: "example-system"
domains: "None."
global_invariants: "INV-001"
security_boundaries: "None."
scope_boundaries: "None."
---

# System Architecture
`);
  write(path.join(root, "system-model", "contracts", "invariants", "inv-001-state-integrity.md"), `---
type: system-invariant
id: INV-001
name: State Integrity
responsibilities: "None."
flows: "None."
related_contracts: "None."
---

# INV-001 — State Integrity

## Rule

Malformed input never changes authoritative state.

## Scope

Every public mutation boundary.

## Violation Meaning

Invalid authoritative state could be committed.

## Verification Obligations

<a id="inv-001.vo-001"></a>
### INV-001.VO-001 — Malformed input is rejected

**Claim:** Malformed required fields never change authoritative state.

**Required observation:** Every declared malformed case is rejected and state remains unchanged.

**Risk:** \`high\`

**Evidence expectation:** Parameterized integration evidence observes rejection and unchanged state.

**Boundary cases:** Missing identifier, wrong identifier type, missing owner, and wrong owner type.
`);
  write(path.join(root, "build", "units", "bu-001-example-build-unit.md"), `---
type: build-unit
id: BU-001
name: Example Build Unit
repository: REPO-001
---

# BU-001 — Example Build Unit

### Verification Obligation Assignments

| Verification Obligation | Evidence responsibility | Required evidence or observation | State |
| --- | --- | --- | --- |
| [\`INV-001.VO-001\`](../../system-model/contracts/invariants/inv-001-state-integrity.md#inv-001.vo-001) | Producer evidence | Reject malformed cases and preserve state | \`Planned\` |
`);
  write(path.join(root, "build", "repositories", "repo-001-example", "README.md"), `---
type: repository-build-design
id: REPO-001
name: Example Repository
member_build_units: "BU-001"
---

# REPO-001 — Example Repository
`);
  const manifest = {
    assurance_coverage_version: 1,
    repository: "REPO-001",
    blueprints: [{ id: "example-system", source: "../design/software-design" }],
    bindings: [{
      id: "EVID-001",
      blueprint: "example-system",
      build_unit: "BU-001",
      obligations: ["INV-001.VO-001"],
      kind: "test",
      method: "parameterized integration test",
      locator: "tests/integration/validation.test.ts",
      selector: "validation rejects malformed required fields",
      command: "npm test -- tests/integration/validation.test.ts",
      expected_observation: "Every declared malformed case is rejected without changing authoritative state.",
      cases: ["missing-id", "wrong-id-type", "missing-owner", "wrong-owner-type"],
      fixtures: ["tests/fixtures/malformed-validation-cases.yaml"],
      result_adapter: "scripts/assurance/emit-results.mjs",
    }],
    exceptions: [],
  };
  const manifestPath = path.join(repositoryRoot, "assurance", "coverage.yaml");
  write(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  const result = {
    assurance_result_version: 1,
    blueprint: {
      id: "example-system",
      name: "Example Software Design",
      snapshot_id: blueprintSnapshotDigest(root),
      revision: "example-blueprint-revision-0001",
    },
    run: {
      started_at: "2026-08-29T00:00:00.000Z",
      completed_at: "2026-08-29T00:01:00.000Z",
    },
    generated_at: "2026-08-29T00:01:01.000Z",
    tools: [{ name: "example-result-adapter", version: "1.0.0" }],
    repositories: [{
      id: "REPO-001",
      name: "Example Repository",
      revision: "example-repository-revision-0001",
      manifest_digest: sha256File(manifestPath),
      build_units: [{
        id: "BU-001",
        name: "Example Build Unit",
        records: [{
          id: "INV-001",
          name: "State Integrity",
          kind: "invariant",
          obligations: [{
            id: "INV-001.VO-001",
            title: "Malformed input is rejected",
            claim: "Malformed required fields never change authoritative state.",
            required_observation: "Every declared malformed case is rejected and state remains unchanged.",
            risk: "high",
            status: "passed",
            covers: [],
            evidence: [{
              binding_id: "EVID-001",
              kind: "test",
              method: "parameterized integration test",
              locator: "tests/integration/validation.test.ts",
              selector: "validation rejects malformed required fields",
              status: "passed",
              selector_count: 1,
              discovered_cases: 4,
              executed_cases: 4,
              passing_cases: 4,
              failing_cases: 0,
              skipped_cases: 0,
              case_ids: ["missing-id", "wrong-id-type", "missing-owner", "wrong-owner-type"],
              fixtures: ["tests/fixtures/malformed-validation-cases.yaml"],
              observation: "All four cases were rejected and authoritative state was unchanged.",
            }],
            exception: null,
          }],
        }],
      }],
    }],
  };
  return { workspace, root, repositoryRoot, manifestPath, manifest, result };
}

function rendererArgs(fixture, input, output) {
  return [
    renderer,
    "--root", fixture.root,
    "--repository", "REPO-001=" + fixture.repositoryRoot,
    "--input", input,
    "--output", output,
  ];
}

test("assurance renderer reconciles the blueprint and manifest before producing one human-first report", (context) => {
  const example = fixture(context);
  const input = path.join(example.workspace, "assurance-result.json");
  const output = path.join(example.workspace, ".software-design-assurance", "assurance-report.html");
  write(input, JSON.stringify(example.result, null, 2));
  const rendered = spawnSync(process.execPath, rendererArgs(example, input, output), { encoding: "utf8" });
  assert.equal(rendered.status, 0, rendered.stderr);
  const report = fs.readFileSync(output, "utf8");
  assert.match(report, /Example Software Design/);
  assert.match(report, /Open gaps first/);
  assert.match(report, /example-result-adapter 1\.0\.0/);
  assert.match(report, /INV-001\.VO-001/);
  assert.match(report, /selector · 4\/4 cases executed/);
  assert.match(report, /Declared cases:<\/b> missing-id, wrong-id-type, missing-owner, wrong-owner-type/);
  assert.match(report, /Fixture sources:<\/b> tests\/fixtures\/malformed-validation-cases\.yaml/);
  assert.match(report, /not a claim that the system is universally secure or defect-free/);
});

test("assurance result validation rejects a false pass with a zero-match selector", (context) => {
  const example = fixture(context);
  example.result.repositories[0].build_units[0].records[0].obligations[0].evidence[0].selector_count = 0;
  const errors = validateAssuranceResult(example.result);
  assert.ok(errors.some((error) => /cannot pass when its selector matched zero items/.test(error)));
});

test("assurance reconciliation rejects an adapter result that omits the canonical assignment universe", (context) => {
  const example = fixture(context);
  const contextModel = loadAssuranceContext({
    root: example.root,
    repositoryRoots: new Map([["REPO-001", example.repositoryRoot]]),
  });
  example.result.repositories = [];
  const errors = validateAssuranceResult(example.result, contextModel);
  assert.ok(errors.some((error) => /repositories must be a non-empty array/.test(error)));
  assert.ok(errors.some((error) => /omits expected assignment REPO-001\|BU-001\|INV-001\.VO-001/.test(error)));
});

test("assurance coverage validation rejects a real assignment with no binding", (context) => {
  const example = fixture(context);
  example.manifest.bindings = [];
  write(example.manifestPath, JSON.stringify(example.manifest, null, 2) + "\n");
  const result = spawnSync(process.execPath, [
    coverageValidator,
    "--root", example.root,
    "--repository", "REPO-001=" + example.repositoryRoot,
  ], { encoding: "utf8" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /has no evidence binding or current approved exception/);
});

test("assurance coverage validation rejects non-JSON-compatible manifest YAML instead of guessing", (context) => {
  const example = fixture(context);
  write(example.manifestPath, "assurance_coverage_version: 1\nrepository: REPO-001\n");
  const result = spawnSync(process.execPath, [
    coverageValidator,
    "--root", example.root,
    "--repository", "REPO-001=" + example.repositoryRoot,
  ], { encoding: "utf8" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /must use JSON-compatible YAML/);
});

test("assurance exceptions must identify the exact Build Unit assignment they waive", (context) => {
  const example = fixture(context);
  example.manifest.exceptions = [{
    id: "EXC-001",
    blueprint: "example-system",
    obligations: ["INV-001.VO-001"],
    bindings: [],
    approval_ref: "GOV-001",
    owner: "Security Owner",
    approver: "Risk Approver",
    reason: "Temporary independent evidence outage.",
    residual_risk: "The declared observation is not independently refreshed.",
    approved_at: "2026-08-28T00:00:00.000Z",
    expires_at: "2026-09-28T00:00:00.000Z",
    compensating_control: "None. — the approval accepts the bounded residual risk.",
  }];
  write(example.manifestPath, JSON.stringify(example.manifest, null, 2) + "\n");
  const result = spawnSync(process.execPath, [
    coverageValidator,
    "--root", example.root,
    "--repository", "REPO-001=" + example.repositoryRoot,
  ], { encoding: "utf8" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /build_units must be a unique non-empty array/);
});
