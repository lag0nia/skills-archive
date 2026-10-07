import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

function read(relativePath) {
  return fs.readFileSync(path.join(skillRoot, relativePath), "utf8");
}

test("repository discovery requires all three contract coverage lanes", () => {
  const skill = read("SKILL.md");
  const mode = read("references/build-design-and-delivery-readiness.md");
  const tickets = read("references/implementation-detail-tickets.md");
  const guidanceTemplate = read("assets/templates/build/repository-agent-guidance.md");

  for (const lane of [
    "repository-module-conventions",
    "code-construction-public-api",
    "maintainability-agent-guidance",
  ]) {
    assert.match(skill, new RegExp(lane));
    assert.match(mode, new RegExp(lane));
    assert.match(tickets, new RegExp(lane));
  }

  assert.match(mode, /repository_contract_area/);
  assert.match(mode, /AGENTS\.md/);
  assert.match(skill, /stop readiness until its outcome is reflected in the Repository Build Design/);
  assert.match(skill, /never present `maintainability-agent-guidance-baseline` as an opaque answer/i);
  assert.match(mode, /answerable decision packet/);
  assert.match(tickets, /numbered proposed rules/);
  for (const area of [
    "simplicity and abstraction",
    "duplication and refactoring",
    "naming and rationale comments",
    "agent change boundaries",
    "stop\/escalate conditions",
    "verification (?:plus|and) final-diff review",
  ]) {
    assert.match(skill, new RegExp(area));
    assert.match(mode, new RegExp(area));
    assert.match(tickets, new RegExp(area));
  }
  assert.match(guidanceTemplate, /maintainability-agent-guidance-baseline/);
  assert.match(guidanceTemplate, /## Canonical Sources/);
});

test("maintainability baseline preserves rationale and derived-agent guidance rules", () => {
  const baseline = read("references/maintainability-and-agent-guidance-baseline.md");
  const repositoryTemplate = read("assets/templates/build/repository-build-design.md");

  assert.match(baseline, /maintainability-agent-guidance-baseline/);
  assert.match(baseline, /simplest design that satisfies the real requirement/);
  assert.match(baseline, /reasonable maintainer might ask why/);
  assert.match(baseline, /closest durable location/);
  assert.match(baseline, /AGENTS\.md/);
  assert.match(repositoryTemplate, /## Repository Contract Coverage/);
  assert.match(repositoryTemplate, /## Agent Guidance Projection/);
});

test("complete repository discovery requires a version-control and generated-file policy", () => {
  const skill = read("SKILL.md");
  const mode = read("references/build-design-and-delivery-readiness.md");
  const tickets = read("references/implementation-detail-tickets.md");
  const repositoryTemplate = read("assets/templates/build/repository-build-design.md");
  const validator = read("scripts/lib/validation/build-design-and-delivery-readiness.mjs");

  for (const source of [skill, mode, tickets, repositoryTemplate, validator]) {
    assert.match(source, /Version-Control And Generated-File Policy|version-control (?:and generated-file )?policy/i);
  }
  for (const field of [
    "Must track",
    "Must ignore",
    "Generated-output disposition",
    "Secret/template rule",
    "Verification",
  ]) {
    assert.match(mode, new RegExp(field));
    assert.match(repositoryTemplate, new RegExp(field));
    assert.match(validator, new RegExp(field));
  }
  assert.match(mode, /git check-ignore/);
  assert.match(tickets, /without creating one ticket per pattern/);
});

test("Build Design treats AGENTS guidance as a derived contract, not architecture", () => {
  const mode = read("references/build-design-and-delivery-readiness.md");
  assert.match(mode, /derived guidance artifact/);
  assert.match(mode, /must not become canonical architecture/);
  assert.doesNotMatch(mode, /Do not add an implementation runner, execution\/review workflow, shared test-policy system, or `AGENTS\.md` rules/);
});

test("canonical build records add readable openings without replacing exact construction contracts", () => {
  const skill = read("SKILL.md");
  const mode = read("references/build-design-and-delivery-readiness.md");
  const buildReadme = read("assets/templates/build/README.md");
  const unitTemplate = read("assets/templates/build/build-unit.md");
  const repositoryTemplate = read("assets/templates/build/repository-build-design.md");
  const validator = read("scripts/lib/validation/build-design-and-delivery-readiness.mjs");

  for (const source of [skill, mode]) {
    assert.match(source, /dual-audience canonical construction records|both readers and agents/i);
    assert.match(source, /Never (?:trade construction precision|remove, merge, shorten, or replace)/i);
  }
  for (const heading of ["Build Unit Overview", "Agent-First Canonical Reference"]) {
    assert.match(unitTemplate, new RegExp("## " + heading));
    assert.match(validator, new RegExp(heading));
  }
  assert.doesNotMatch(unitTemplate, /^## At A Glance$/m);
  assert.match(unitTemplate, /### Detailed Code Shape/);
  assert.match(validator, /DETAILED_CODE_SHAPE_SECTION/);
  assert.match(validator, /concrete fenced visual block/);
  for (const heading of ["Repository Overview", "Agent-First Canonical Reference"]) {
    assert.match(repositoryTemplate, new RegExp("## " + heading));
    assert.match(validator, new RegExp(heading));
  }
  assert.match(repositoryTemplate, /### Material Workspace Tree/);
  assert.match(validator, /MATERIAL_WORKSPACE_TREE_SECTION/);
  assert.match(mode, /complete selected action|capability surface/i);
  assert.match(mode, /Material Workspace Tree/);
  assert.match(mode, /template is a seed for a new record/i);
  assert.match(mode, /do not synchronize reader-opening prose/i);
  for (const preservedHeading of [
    "Artifact And Code Location",
    "Applicable Technical Constraints",
    "Source Responsibility Mapping",
    "Interfaces And Dependencies",
    "Module Architecture",
    "Commands And Verification",
  ]) {
    assert.match(unitTemplate, new RegExp("### " + preservedHeading));
    assert.match(validator, new RegExp(preservedHeading));
  }
  for (const preservedHeading of [
    "Repository And Workspace Shape",
    "Member Build Units",
    "Applicable Technical Constraints",
    "Repository Constraints",
    "Commands, Release, And Verification",
  ]) {
    assert.match(repositoryTemplate, new RegExp("### " + preservedHeading));
    assert.match(validator, new RegExp(preservedHeading));
  }
  assert.match(buildReadme, /useful mental model/i);
});

test("canonical build README is the detailed whole-construction guide without another summary surface", () => {
  const skill = read("SKILL.md");
  const mode = read("references/build-design-and-delivery-readiness.md");
  const layout = read("references/package-layout.md");
  const buildReadme = read("assets/templates/build/README.md");
  const validator = read("scripts/lib/validation/build-design-and-delivery-readiness.mjs");

  for (const source of [skill, mode, buildReadme, validator]) {
    assert.match(source, /Construction At A Glance|whole-construction reading surface/);
  }
  assert.match(mode, /do not impose a one-sentence limit/i);
  assert.match(mode, /Group every first-party Repository exactly once/);
  assert.match(mode, /list every member Build Unit exactly once/);
  assert.match(mode, /own linked `#### BU-xxx — Name` block/);
  assert.match(mode, /usable construction mental model/i);
  assert.match(mode, /Do not paste ticket lists/i);
  assert.match(layout, /do not create another summary file or GitHub Project README/i);
  assert.match(validator, /construction guide must link/);
  assert.match(validator, /must not include the/);
  for (const heading of ["Construction Model", "Reusable Records", "Workflow", "Visual Navigation", "Current Readiness"]) {
    assert.doesNotMatch(buildReadme, new RegExp("^## " + heading + "$", "m"));
  }
});

test("reader-facing Build Design prose is name-led while canonical IDs remain available", () => {
  const skill = read("SKILL.md");
  const mode = read("references/build-design-and-delivery-readiness.md");
  const buildReadme = read("assets/templates/build/README.md");
  const unitTemplate = read("assets/templates/build/build-unit.md");
  const repositoryTemplate = read("assets/templates/build/repository-build-design.md");

  for (const source of [skill, mode, buildReadme, unitTemplate, repositoryTemplate]) {
    assert.match(source, /use (?:Repository and Build Unit )?names/i);
    assert.match(source, /first cross-record mention/i);
    assert.match(source, /identifier in parentheses|ID in parentheses|identifier in parentheses/i);
  }
  assert.match(mode, /frontmatter, filenames, agent-first detailed sections, dependency maps, tickets, handoffs, and GitHub projection/i);
  assert.match(buildReadme, /REPO-xxx — Name/);
  assert.match(buildReadme, /BU-xxx — Name/);
});

test("material interactions close from logical contract through consumer fitness", () => {
  const skill = read("SKILL.md");
  const systemModel = read("references/system-model-format.md");
  const inventory = read("references/ticket-inventory-mode.md");
  const readiness = read("references/build-design-and-delivery-readiness.md");
  const interfaceTemplate = read("assets/templates/system-model/contracts/interface.md");
  const unitTemplate = read("assets/templates/build/build-unit.md");
  const handoffTemplate = read("assets/templates/build/delivery-planning-handoff.md");
  const structureValidator = read("scripts/validate-software-design-structure.mjs");
  const readinessValidator = read("scripts/lib/validation/build-design-and-delivery-readiness.mjs");

  for (const source of [skill, systemModel, interfaceTemplate]) assert.match(source, /IFACE-xxx\.ACT-NNN|ACT-NNN/);
  for (const source of [skill, readiness, unitTemplate, readinessValidator]) assert.match(source, /Material Interaction Bindings/);
  for (const source of [skill, readiness, handoffTemplate, readinessValidator]) assert.match(source, /Required Interaction Closure/);
  for (const evidenceClass of [
    "existence",
    "identity-freshness",
    "structural-conformance",
    "behavioral",
    "consumer-fitness",
  ]) {
    assert.match(readiness, new RegExp(evidenceClass));
    assert.match(handoffTemplate, new RegExp(evidenceClass));
    assert.match(readinessValidator, new RegExp(evidenceClass));
  }
  assert.match(inventory, /read-before-write/);
  assert.match(inventory, /empty\/not-found versus forbidden versus stale\/unavailable/);
  assert.match(readiness, /pre-existing producer requires identity\/freshness/);
  assert.match(readiness, /Only `high` interactions require/);
  assert.match(structureValidator, /stable <a id=/);
  assert.match(readinessValidator, /fresh independent consumer-side PASS challenge/);
});
