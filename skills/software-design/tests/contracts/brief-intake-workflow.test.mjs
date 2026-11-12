#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (relative) => fs.readFileSync(path.join(skillRoot, relative), "utf8");
const skill = read("SKILL.md");
const template = read("assets/templates/software-brief.md");
const intake = read("references/brief-intake.md");

const STATUSES = ["Ready for software design", "Needs answers", "Needs intake review"];

test("the router detects exactly the brief statuses the template and intake write", () => {
  for (const status of STATUSES) {
    assert.match(skill, new RegExp("`" + status + "`"), status);
    assert.match(intake, new RegExp("`" + status + "`"), status);
    assert.match(template, new RegExp(status), status);
  }
  assert.match(template, /^Status: Needs intake review$/m);
  assert.doesNotMatch(template, /^Readiness:/m);
  assert.match(skill, /No `Status:` line → ask the user to confirm the brief was reviewed/);
  assert.match(skill, /do not silently turn rough source material into a technical blueprint/);
});

test("intake has one route, writes only after its preview, and hands over to Stage 0", () => {
  assert.match(skill, /\*\*Intake — [^\n]*references\/brief-intake\.md/);
  assert.doesNotMatch(skill, /software-design-intake/);
  assert.match(read("references/checkpoint-workflow.md"), /stage checkpoint, package setup checkpoint, repair checkpoint, or \[brief write preview\]/);
  assert.match(intake, /a plain yes is not a write approval/);
  assert.match(intake, /show the \[Stage 0 checkpoint\]\([^)]+\) in the same response; it writes nothing/);
});

test("the brief keeps its compatible shape and its final prompt", () => {
  assert.match(template, /^## Proposed Components$/m);
  assert.match(template, /^### Component C-001: TBD$/m);
  assert.match(template, /^## Final Prompt For software-design$/m);
  assert.match(template, /^Use `software-design` with this software brief/m);
  assert.match(template, /local to it/);
});
