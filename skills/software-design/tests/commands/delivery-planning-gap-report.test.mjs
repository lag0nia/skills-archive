#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { writeDeliverySnapshot } from "../../scripts/lib/delivery-snapshot.mjs";
import { buildDeliveryPlanningGapReport } from "../../scripts/report-delivery-planning-gaps.mjs";
import { createWorkspace, runNode, writeText } from "../support/workspace.mjs";

const scripts = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..", "scripts");
const script = path.join(scripts, "report-delivery-planning-gaps.mjs");
const sequenceValidator = path.join(scripts, "validate-handoff-sequence.mjs");
const deliveryValidator = path.join(scripts, "validate-delivery-readiness.mjs");

const SLICES = [
  { slug: "repo-001-core", repo: "REPO-001", unit: "BU-001", requires: null },
  { slug: "repo-002-api", repo: "REPO-002", unit: "BU-002", requires: "repo-001-core" },
  { slug: "repo-003-web", repo: "REPO-003", unit: "BU-003", requires: "repo-002-api" },
];

const TEMPLATE_PROSE = `Planning may produce linked complete handoffs/workpacks in every requested group, including Waiting rows. Planning completion and exact execution waits live in each existing handoff/workpack review; this table remains execution navigation.

Finish every slice in group \`N\` before starting group \`N+1\`. Slices inside one group may proceed in parallel. Keep every slice in this table and schedule runnable independent work before unrelated blockers.`;

// Group 1 is Ready; groups 2 and 3 wait. repo-002 links a complete future handoff, repo-003 links none.
function createPackage({ linkThird = false, secondOutcome = "IMPLEMENTATION_DETAILS_READY", prose = TEMPLATE_PROSE } = {}) {
  const workspace = createWorkspace("software-design-planning-gaps-");
  const root = path.join(workspace, "software-design");
  writeText(path.join(root, "system-model/architecture.md"), "---\ntype: system-architecture\ndesign_format: 2\nname: Example\n---\n\n# System Architecture\n");
  const handoffsDir = path.join(root, "build/workflow/handoffs");
  const linked = new Set(["repo-001-core", "repo-002-api", ...(linkThird ? ["repo-003-web"] : [])]);
  const rows = SLICES.map((slice, index) => {
    const number = String(index + 1).padStart(3, "0");
    const previous = String(index).padStart(3, "0");
    writeText(path.join(root, `build/units/bu-${number}-example.md`), `---\ntype: build-unit\nid: ${slice.unit}\nrepository: ${slice.repo}\ndepends_on_build_units: "${index ? "BU-" + previous : "None."}"\n---\n\n# ${slice.unit}\n`);
    if (linked.has(slice.slug)) {
      const outcome = slice.slug === "repo-002-api" ? secondOutcome : "IMPLEMENTATION_DETAILS_READY";
      const handoffPath = path.join(handoffsDir, slice.slug + ".md");
      writeText(handoffPath, `# Delivery Planning Handoff\n\n**Sequence index:** [Handoff Sequence](./README.md)\n\n## Readiness Outcome\n\n**Outcome:** \`${outcome}\`\n\n## Allowed Delivery Slice\n\n${slice.slug} fixture.\n`);
      writeDeliverySnapshot({ root, handoffPath });
    }
    const cell = linked.has(slice.slug) ? `[${slice.slug}](./${slice.slug}.md)` : slice.slug;
    return `| ${index + 1} | ${cell} | ${slice.repo} | ${slice.unit} | ${slice.requires || "None."} | ${index ? "Waiting" : "Ready"} |`;
  });
  writeText(path.join(handoffsDir, "README.md"), `# Handoff Sequence\n\n**Current order group:** \`1\`\n\n${prose}\n\n| Order group | Delivery slice | Repository | Build Units | Requires | State |\n| ---: | --- | --- | --- | --- | --- |\n${rows.join("\n")}\n`);
  return { workspace, root, handoffsDir, workpacks: path.join(workspace, "delivery-workpacks") };
}

function handoffSnapshot(fixture, slug) {
  return /^\*\*Snapshot ID:\*\*\s*`([^`]+)`/m.exec(fs.readFileSync(path.join(fixture.handoffsDir, slug + ".md"), "utf8"))[1];
}

function writeWorkpack(fixture, slug, snapshot = handoffSnapshot(fixture, slug)) {
  writeText(path.join(fixture.workpacks, slug, "WORKPACK.md"), `# Example Delivery\n\n## Delivery Objective\nDeliver ${slug}.\n\n**Software Design snapshot:** \`${snapshot}\`\n`);
}

function report(fixture, { workpacks = true, json = true } = {}) {
  const args = ["--root", fixture.root];
  if (workpacks) args.push("--workpacks", fixture.workpacks);
  if (json) args.push("--json");
  return runNode(script, args);
}

function kinds(result) {
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout).findings.map((item) => item.kind + ":" + (item.slice || "-"));
}

// Without --workpacks the report reads the default sibling directory, which these
// fixtures leave empty, so prose and sequence tests ignore the workpack findings.
function reviewKinds(result) {
  return kinds(result).filter((kind) => !/^(?:missing-workpack|snapshot-drift):/.test(kind));
}

function cleanup(context, fixture) {
  context.after(() => fs.rmSync(fixture.workspace, { recursive: true, force: true }));
}

test("the fixture is a valid handoff sequence, so findings come only from the report", (context) => {
  const fixture = createPackage(); cleanup(context, fixture);
  const result = runNode(sequenceValidator, ["--root", fixture.root]);
  assert.equal(result.status, 0, result.stderr);
});

test("a settled handoff without a workpack in the workpacks directory is a review prompt", (context) => {
  const fixture = createPackage({ linkThird: true }); cleanup(context, fixture);
  writeWorkpack(fixture, "repo-001-core");
  writeWorkpack(fixture, "repo-003-web");
  const result = report(fixture);
  assert.deepEqual(kinds(result), ["missing-workpack:repo-002-api"]);
  const [item] = JSON.parse(result.stdout).findings;
  assert.match(item.file, /delivery-workpacks\/repo-002-api\/WORKPACK\.md$/);
  assert.match(item.message, /^Review /);
  assert.match(item.rule.reference, /^references\/planning-execution-contract\.md#/);

  writeWorkpack(fixture, "repo-002-api");
  assert.deepEqual(kinds(report(fixture)), []);
});

test("a handoff that is not READY or PARTIAL needs no workpack", (context) => {
  const fixture = createPackage({ linkThird: true, secondOutcome: "NEEDS_TECHNICAL_DECISION" }); cleanup(context, fixture);
  writeWorkpack(fixture, "repo-001-core");
  writeWorkpack(fixture, "repo-003-web");
  assert.deepEqual(kinds(report(fixture)), []);
});

test("a workpack snapshot that no longer matches its handoff is reported as drift", (context) => {
  const fixture = createPackage({ linkThird: true }); cleanup(context, fixture);
  for (const slice of SLICES) writeWorkpack(fixture, slice.slug);
  assert.deepEqual(kinds(report(fixture)), []);

  const handoffPath = path.join(fixture.handoffsDir, "repo-001-core.md");
  const previous = handoffSnapshot(fixture, "repo-001-core");
  writeText(handoffPath, fs.readFileSync(handoffPath, "utf8").replace("fixture.", "fixture, refreshed."));
  writeDeliverySnapshot({ root: fixture.root, handoffPath });
  const result = report(fixture);
  assert.deepEqual(kinds(result), ["snapshot-drift:repo-001-core"]);
  const [item] = JSON.parse(result.stdout).findings;
  assert.ok(item.message.includes(previous) && item.message.includes(handoffSnapshot(fixture, "repo-001-core")));
  assert.match(item.message, /a workpack is expected to carry its handoff's exact current Snapshot ID/);
  assert.match(item.rule.text, /^When the change remains within an existing slice's repository and Build Unit coverage, refresh its current handoff and stable workpack paths\.$/);
  assert.match(item.rule.reference, /^references\/build-design-and-delivery-readiness\.md#delivery-readiness-and-handoff$/);

  writeText(path.join(fixture.workpacks, "repo-002-api", "WORKPACK.md"), "# Example Delivery\n");
  assert.deepEqual(kinds(report(fixture)), ["snapshot-drift:repo-001-core", "snapshot-drift:repo-002-api"]);
});

test("a Waiting row whose producers all have settled handoffs is a candidate, not a proven plan", (context) => {
  const fixture = createPackage(); cleanup(context, fixture);
  const result = report(fixture, { workpacks: false });
  assert.deepEqual(reviewKinds(result), ["waiting-planning-candidate:repo-003-web"]);
  const item = JSON.parse(result.stdout).findings.find((finding) => finding.kind === "waiting-planning-candidate");
  assert.equal(item.line, 13);
  assert.match(item.message, /candidate/);
  assert.match(item.message, /does not prove the consumer handoff can be written/);
  assert.match(item.message, /scope, contracts, expected outputs and feasibility/);

  const unsettled = createPackage({ secondOutcome: "NEEDS_PRODUCT_DECISION" }); cleanup(context, unsettled);
  assert.deepEqual(reviewKinds(report(unsettled, { workpacks: false })), []);
  const linked = createPackage({ linkThird: true }); cleanup(context, linked);
  assert.deepEqual(reviewKinds(report(linked, { workpacks: false })), []);
});

test("README prose that contradicts the table is flagged as a heuristic; consistent and conditional prose is not", (context) => {
  const stale = createPackage({ linkThird: true, prose: [
    TEMPLATE_PROSE,
    "Next up: `repo-003-web`.",
    "The current order group is 2.",
    "Group 3 is next.",
  ].join("\n\n") }); cleanup(context, stale);
  const result = report(stale, { workpacks: false });
  assert.deepEqual(reviewKinds(result), ["stale-readme-prose:repo-003-web", "stale-readme-prose:-", "stale-readme-prose:-"]);
  const findings = JSON.parse(result.stdout).findings.filter((finding) => finding.kind === "stale-readme-prose");
  assert.ok(findings.every((item) => item.heuristic && /^Heuristic: review/.test(item.message)));
  assert.match(findings[0].message, /as Next, but the sequence table state is Waiting/);
  assert.match(findings[1].message, /names 2 as the current order group, but the sequence table gives 1/);
  assert.match(findings[2].message, /names 3 as the next order group, but the sequence table gives 2/);

  const consistent = createPackage({ linkThird: true, prose: [
    TEMPLATE_PROSE,
    "Next up: [repo-001-core](./repo-001-core.md), which is Ready.",
    "repo-002-api is Waiting on the current order group 1; the next order group is 2.",
    "repo-003-web is not yet ready and starts after repo-002-api is implemented.",
    "```\nrepo-003-web Implemented\n```",
  ].join("\n\n") }); cleanup(context, consistent);
  assert.deepEqual(reviewKinds(report(consistent, { workpacks: false })), []);
});

test("README prose slugs match case-insensitively against the table", (context) => {
  const stale = createPackage({ linkThird: true, prose: TEMPLATE_PROSE + "\n\nREPO-002-API is implemented." }); cleanup(context, stale);
  const result = report(stale, { workpacks: false });
  assert.deepEqual(reviewKinds(result), ["stale-readme-prose:repo-002-api"]);
  assert.match(JSON.parse(result.stdout).findings.find((finding) => finding.kind === "stale-readme-prose").message, /describes repo-002-api as Implemented, but the sequence table state is Waiting/);

  const consistent = createPackage({ linkThird: true, prose: TEMPLATE_PROSE + "\n\nREPO-002-API is Waiting." }); cleanup(context, consistent);
  assert.deepEqual(reviewKinds(report(consistent, { workpacks: false })), []);
});

test("without --workpacks the report reads the sibling delivery-workpacks directory", (context) => {
  const fixture = createPackage({ linkThird: true }); cleanup(context, fixture);
  assert.equal(fs.existsSync(fixture.workpacks), false);
  const json = report(fixture, { workpacks: false });
  assert.equal(json.status, 0, json.stderr);
  const parsed = JSON.parse(json.stdout);
  assert.equal(parsed.workpacks, fixture.workpacks);
  assert.deepEqual(kinds(json), ["missing-workpack:repo-001-core", "missing-workpack:repo-002-api", "missing-workpack:repo-003-web"]);

  for (const slice of SLICES) writeWorkpack(fixture, slice.slug);
  const text = report(fixture, { workpacks: false, json: false });
  assert.equal(text.status, 0, text.stderr);
  assert.ok(text.stdout.includes("Workpacks: " + fixture.workpacks));
  assert.doesNotMatch(text.stdout, /Skipped/);
  assert.match(text.stdout, /Findings: 0/);
});

test("--json has a stable shape and text output lists each finding with its rule", (context) => {
  const fixture = createPackage(); cleanup(context, fixture);
  writeWorkpack(fixture, "repo-001-core");
  const parsed = JSON.parse(report(fixture).stdout);
  assert.deepEqual(Object.keys(parsed), ["root", "workpacks", "sequenceErrors", "findings", "findingCount"]);
  assert.equal(parsed.findingCount, parsed.findings.length);
  assert.deepEqual(parsed.sequenceErrors, []);
  for (const item of parsed.findings) {
    assert.deepEqual(Object.keys(item), ["kind", "slice", "file", "line", "heuristic", "message", "rule"]);
    assert.deepEqual(Object.keys(item.rule), ["text", "reference"]);
  }
  assert.deepEqual(parsed, buildDeliveryPlanningGapReport(fixture.root, { workpacks: fixture.workpacks }));

  const text = report(fixture, { json: false });
  assert.equal(text.status, 0, text.stderr);
  assert.match(text.stdout, /^Delivery Planning Gap Report \(advisory\)/);
  assert.match(text.stdout, /- \[missing-workpack\] repo-002-api — /);
  assert.match(text.stdout, /- \[waiting-planning-candidate\] repo-003-web — build\/workflow\/handoffs\/README\.md:13/);
  assert.match(text.stdout, /Rule: ".+" \(references\/planning-execution-contract\.md#planning-completeness-and-execution-eligibility\)/);
  assert.match(text.stdout, /Findings: 2/);
});

test("the report exits 0 with findings or sequence errors and non-zero only for usage or IO errors", (context) => {
  const fixture = createPackage(); cleanup(context, fixture);
  assert.equal(report(fixture, { workpacks: false }).status, 0);

  const readme = path.join(fixture.handoffsDir, "README.md");
  writeText(readme, fs.readFileSync(readme, "utf8").replace("| Ready |", "| Waiting |"));
  const invalid = report(fixture, { workpacks: false, json: false });
  assert.equal(invalid.status, 0, invalid.stderr);
  assert.match(invalid.stdout, /Handoff sequence validation reports \d+ error\(s\)/);

  for (const args of [[], ["--root"], ["--root", fixture.root, "--unknown"], ["--root", fixture.root, "--workpacks"]]) {
    const result = runNode(script, args);
    assert.equal(result.status, 1, args.join(" "));
    assert.notEqual(result.stderr, "");
  }
  assert.equal(runNode(script, ["--root", path.join(fixture.workspace, "missing")]).status, 1);
  const missingWorkpacks = runNode(script, ["--root", fixture.root, "--workpacks", path.join(fixture.workspace, "missing")]);
  assert.equal(missingWorkpacks.status, 1);
  assert.match(missingWorkpacks.stderr, /Workpacks directory is not a readable directory/);
});

test("running the report leaves files and validator results unchanged", (context) => {
  const fixture = createPackage({ prose: TEMPLATE_PROSE + "\n\nNext up: repo-003-web." }); cleanup(context, fixture);
  writeWorkpack(fixture, "repo-001-core", "sha256:" + "0".repeat(64));
  const files = (dir) => fs.readdirSync(dir, { recursive: true }).sort().map((name) => {
    const file = path.join(dir, String(name));
    return [String(name), fs.statSync(file).isFile() ? fs.readFileSync(file, "utf8") : null];
  });
  const validators = () => [
    runNode(sequenceValidator, ["--root", fixture.root]),
    runNode(deliveryValidator, ["--root", fixture.root]),
    runNode(deliveryValidator, ["--root", fixture.root, "--handoff", "build/workflow/handoffs/repo-001-core.md"]),
  ].map(({ status, stdout, stderr }) => ({ status, stdout, stderr }));

  const before = { files: files(fixture.workspace), results: validators() };
  assert.equal(before.results[0].status, 0, before.results[0].stderr);
  assert.ok(kinds(report(fixture)).length >= 4);
  assert.equal(report(fixture, { workpacks: false, json: false }).status, 0);
  assert.deepEqual({ files: files(fixture.workspace), results: validators() }, before);
});
