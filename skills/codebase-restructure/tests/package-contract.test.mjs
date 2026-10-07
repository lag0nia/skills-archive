#!/usr/bin/env node

// Structural checks only: they cannot show how an agent behaves.
// Behavioral scenarios live in scenarios.md.

import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skillName = "codebase-restructure";
const planTemplatePath = "assets/restructure-plan-template.md";
const planTitle = "# Restructure plan: <scope>";
const plannedChangesHeading = "## Migration order";
const includesRestructuringSections = true;

// references/maintenance-records.md is kept byte-identical in the codebase-cleanup skill.
// When it changes, apply the same change to both copies and update this hash in both tests.
const sharedRecordsSha256 = "a873258c3bb221701f4c9097ce7d17ad4fc608d1f07679567ef9ea426c631b57";

const forbiddenNames = [
  /codebase-cleanup/,
  /codebase-rules/,
  /task-brief/,
  /find-bugs/,
  /maintainability-cleanup/,
  /workpack/i,
];
const providerSpecific = /\b(Claude|Codex|OpenAI|Anthropic|GPT-\d|AskUserQuestion|spawn_agent|fork_context)\b/;
const machinePaths = /(\/Users\/|\/home\/|[A-Za-z]:\\|~\/)/;

function read(relativePath, root = skillRoot) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function listFiles(root, relativeDir) {
  const dir = path.join(root, relativeDir);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = path.join(relativeDir, entry.name);
    return entry.isDirectory() ? listFiles(root, relativePath) : [relativePath];
  });
}

function agentFacingFiles(root = skillRoot) {
  return ["SKILL.md", ...listFiles(root, "references"), ...listFiles(root, "assets")];
}

function relativeLinks(text) {
  return [...text.matchAll(/\]\(([^)\s]+)\)/g)]
    .map((match) => match[1].split("#")[0])
    .filter((target) => target && !/^[a-z]+:/i.test(target));
}

function assertLinksResolve(root) {
  for (const file of agentFacingFiles(root).filter((name) => name.endsWith(".md"))) {
    for (const link of relativeLinks(read(file, root))) {
      const target = path.resolve(root, path.dirname(file), link);
      assert.ok(target.startsWith(root + path.sep), `${file} links outside the skill: ${link}`);
      assert.ok(fs.existsSync(target), `${file} links to a missing file: ${link}`);
    }
  }
}

function section(text, heading) {
  const start = text.indexOf(`\n${heading}\n`);
  assert.ok(start >= 0, `missing section ${heading}`);
  const rest = text.slice(start + heading.length + 2);
  const level = heading.match(/^#+/)[0];
  const next = rest.search(new RegExp(`\\n${level} `));
  return next >= 0 ? rest.slice(0, next) : rest;
}

function planStatuses() {
  const status = section(read("references/maintenance-records.md"), "### Status");
  return [...status.matchAll(/^\| `([^`]+)` \|/gm)].map((match) => match[1]);
}

function decisionStatuses() {
  const line = read("references/maintenance-records.md").match(/^- Status: (Proposed \|.*)$/m);
  assert.ok(line, "decision template lacks a Status line");
  return line[1].split(" | ").map((value) => value.replace(/ \(.*\)$/, "").replace(/ by <.*>$/, ""));
}

function requiredPlanHeadings() {
  const plans = section(read("references/maintenance-records.md"), "## Plans");
  const common = [...plans.matchAll(/^- `(## [^`]+)`/gm)].map((match) =>
    match[1] === "## Planned changes" ? plannedChangesHeading : match[1],
  );
  if (!includesRestructuringSections) return common;
  const extra = plans.match(/^Restructuring plans also contain (.*)$/m);
  assert.ok(extra, "restructuring plan sections are not listed");
  return [...common, ...[...extra[1].matchAll(/`(## [^`]+)`/g)].map((match) => match[1])];
}

test("frontmatter names the skill and respects description limits", () => {
  const frontmatter = read("SKILL.md").match(/^---\n([\s\S]*?)\n---\n/);
  assert.ok(frontmatter, "SKILL.md lacks frontmatter");
  assert.match(frontmatter[1], new RegExp(`^name: ${skillName}$`, "m"));
  assert.equal(path.basename(skillRoot), skillName);
  const description = frontmatter[1].match(/^description: (.+)$/m)?.[1] ?? "";
  assert.ok(description.length > 0 && description.length <= 1024, `description length ${description.length}`);
  assert.doesNotMatch(description, /[<>]/);
});

test("every relative link resolves inside the skill", () => {
  assertLinksResolve(skillRoot);
});

test("an isolated copy of the skill resolves every link on its own", () => {
  const isolated = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "skill-isolation-")), skillName);
  try {
    fs.cpSync(skillRoot, isolated, { recursive: true });
    assertLinksResolve(isolated);
  } finally {
    fs.rmSync(path.dirname(isolated), { recursive: true, force: true });
  }
});

test("every reference and asset is reachable from SKILL.md", () => {
  const linked = new Set(relativeLinks(read("SKILL.md")).map((link) => path.normalize(link)));
  for (const file of agentFacingFiles().filter((name) => name !== "SKILL.md")) {
    assert.ok(linked.has(path.normalize(file)), `${file} is not linked from SKILL.md`);
  }
});

test("agent-facing files avoid machine paths, other skills and provider-specific tools", () => {
  for (const file of agentFacingFiles()) {
    const text = read(file);
    assert.doesNotMatch(text, machinePaths, `${file} contains a machine-specific path`);
    assert.doesNotMatch(text, providerSpecific, `${file} names a provider-specific tool or model`);
    for (const name of forbiddenNames) assert.doesNotMatch(text, name, `${file} depends on ${name}`);
  }
});

test("shared maintenance records match the pinned shared copy", () => {
  const digest = crypto.createHash("sha256").update(read("references/maintenance-records.md")).digest("hex");
  assert.equal(digest, sharedRecordsSha256, "maintenance-records.md diverged from the copy shared with the sibling skill");
});

test("plan template provides every required section and a defined status", () => {
  const template = read(planTemplatePath);
  assert.ok(template.startsWith(`${planTitle}\n`), "plan template title changed");
  const status = template.match(/^Status: (.+)$/m)?.[1];
  assert.ok(planStatuses().includes(status), `template status ${status} is not a defined plan status`);
  assert.match(template, /^Updated: /m);
  assert.match(read("references/maintenance-records.md"), /exclusions, and where the records are kept/);
  assert.match(section(template, "## Scope"), /^- Records: /m, "plan template scope lacks the records location");
  for (const heading of requiredPlanHeadings()) {
    assert.match(template, new RegExp(`^${heading}$`, "m"), `plan template lacks ${heading}`);
  }
});

test("status names used in instructions and templates are defined", () => {
  const plan = new Set(planStatuses());
  const decision = new Set(decisionStatuses());
  const known = /^(Draft|Awaiting decision|Ready|In progress|Blocked|Complete|Completed|Done|Pending|Active|Proposed|Approved|Approved, not yet implemented|Partly implemented|Implemented|Superseded)$/;
  for (const file of agentFacingFiles()) {
    for (const [, token] of read(file).matchAll(/`([^`]+)`/g)) {
      if (known.test(token)) assert.ok(plan.has(token) || decision.has(token), `${file} uses undefined status ${token}`);
    }
  }
  const recorded = read(planTemplatePath).match(/^- Status when written: <(.+)>$/m);
  if (includesRestructuringSections) assert.ok(recorded, "plan template lacks the decision status field");
  for (const value of recorded ? recorded[1].split(" | ") : []) {
    assert.ok(decision.has(value), `plan template offers undefined decision status ${value}`);
  }
});

test("maintenance paths follow the shared layout", () => {
  const allowed = [
    /^maintenance\/$/,
    /^maintenance\/plans\/$/,
    /^maintenance\/plans\/<operation>-<scope>\.md$/,
    /^maintenance\/plans\/(cleanup|restructure)-[a-z0-9<>-]+\.md$/,
    /^maintenance\/observations\.md$/,
    /^maintenance\/decisions\/$/,
    /^maintenance\/decisions\/(repository|<area>)\.md$/,
  ];
  for (const file of agentFacingFiles()) {
    // In HTML assets, check the text a reader sees: markup such as </code> would otherwise join the path.
    const text = file.endsWith(".html") ? read(file).replace(/<\/?[a-z][^>]*>/gi, " ") : read(file);
    for (const [raw] of text.matchAll(/maintenance\/[^\s`)"'|,;]*/g)) {
      const mention = raw.replace(/[.:]+$/, "");
      assert.ok(allowed.some((pattern) => pattern.test(mention)), `${file} uses nonstandard path ${mention}`);
    }
  }
});

test("observation and decision templates carry the fields their rules require", () => {
  const records = read("references/maintenance-records.md");
  for (const field of ["Kind", "Scope checked", "Observed", "Interpretation", "Why it matters", "Uncertainty", "Suggested next step", "Last verified"]) {
    assert.match(records, new RegExp(`^- ${field}: `, "m"), `observation template lacks ${field}`);
  }
  assert.match(records, /^### OBS-<area>-<slug>: /m);
  for (const part of ["Context and constraints", "Decision", "Why", "Alternatives rejected", "Reconsider when"]) {
    assert.match(records, new RegExp(`^\\*\\*${part}\\.\\*\\* `, "m"), `decision template lacks ${part}`);
  }
});
