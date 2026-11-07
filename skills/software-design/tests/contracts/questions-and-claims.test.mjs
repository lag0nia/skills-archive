#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (relativePath) => fs.readFileSync(path.join(skillRoot, relativePath), "utf8");

// These instruction-contract checks guard the written guidance. They do not execute a
// conversation; tests/behavioral/workflow-reliability/ records the manual evaluation.
test("instruction contract: delegation is applied before asking, in the checkpoint owner", () => {
  const skill = read("SKILL.md");
  const checkpoint = read("references/checkpoint-workflow.md");
  const beforeAsking = checkpoint.split("## Before Asking\n")[1]?.split("\n## ")[0] || "";
  assert.match(skill, /Before putting any question to the user, or deciding a material choice the user delegated, read and apply \[Before Asking\]\(references\/checkpoint-workflow\.md#before-asking\)/);
  assert.match(skill, /make the choices your delegation covers within approved requirements and boundaries, and ask only about a material choice beyond them/);
  assert.match(beforeAsking, /It adds no checkpoint, form, or approval cycle/);
  assert.match(beforeAsking, /\*\*Investigate first\.\*\*/);
  assert.match(beforeAsking, /Record each meaningful one as Agent-chosen under \[Interpreting Approval\]\(decision-attribution\.md#interpreting-approval\)/);
  assert.match(beforeAsking, /Judge materiality by consequence, not by calling a choice technical or business/);
  assert.match(beforeAsking, /Name the choice, the consequence that needs the user's answer/);
  assert.match(beforeAsking, /Keep doing the authorized work the answer does not affect; a stage checkpoint still gates that stage's writes/);
  assert.match(beforeAsking, /settled decisions relevant to the choice/);
  assert.match(beforeAsking, /and the material choices the user has explicitly delegated, whenever the result stays within approved requirements and the approved data-sharing, cost, security, and product boundaries/);
  assert.match(beforeAsking, /Delegation never overrides an approved requirement or extends those boundaries; when the best option would exceed one, ask about that specific excess/);
  assert.match(beforeAsking, /choosing a map display library that adds no cost, account, or external data recipient is routine/);
  assert.match(beforeAsking, /ask about it unless the user has explicitly delegated it and your approach stays within the approved boundaries/);
  assert.doesNotMatch(beforeAsking, /external geocoding service is the user's/);
  assert.match(skill, /proceeding would choose an unresolved product or technical decision without approval or explicit delegation/);
  assert.match(skill, /Obtain user approval for material choices outside the authority the user has delegated and for conflicts with approved requirements/);
  assert.match(beforeAsking, /resume the authorized work automatically while its scope remains covered/);
  assert.equal((checkpoint.match(/^## Before Asking$/gm) || []).length, 1);
});

test("instruction contract: blockers and completion claims name their scope and evidence", () => {
  const skill = read("SKILL.md");
  assert.match(skill, /Structural validation, rendered prototype interaction inspection, independent review, the user's approval, and readiness or release eligibility are separate claims/);
  assert.match(skill, /Describe each decision's origin as its attribution record does/);
  assert.match(skill, /Review repaired behavior at the final state of the affected artifacts, reusing evidence for the parts a repair did not touch/);
  assert.match(skill, /Report a blocker by the missing decision, evidence, or prerequisite; the deliverable it actually blocks and the dependency path that makes it block; and the useful work that continues/);
  assert.match(skill, /ask for or locate that input rather than asking for approval again/);
  assert.match(skill, /Preserve genuine shared-contract and readiness dependencies/);
  assert.match(skill, /Before waiting on another agent or session, confirm that it currently owns the remaining work/);
  assert.match(skill, /Treat ownership as stale only on evidence that the owner ended or released it/);
  assert.match(skill, /keeping locks and other mechanical guards in force/);
});

test("new guidance anchors resolve to existing headings", () => {
  const anchor = (heading) => heading.toLowerCase().replace(/[^a-z0-9 -]/g, "").trim().replace(/ /g, "-");
  const headings = (relativePath) => new Set([...read(relativePath).matchAll(/^#{1,6} (.+)$/gm)].map((match) => anchor(match[1])));
  for (const [file, target, id] of [
    ["SKILL.md", "references/checkpoint-workflow.md", "before-asking"],
    ["references/checkpoint-workflow.md", "references/checkpoint-workflow.md", "upstream-repair-handling"],
    ["references/checkpoint-workflow.md", "references/decision-attribution.md", "interpreting-approval"],
    ["references/ui-ux-design.md", "references/ui-ux/design-workflow.md", "keep-active-alternatives-comparable"],
    ["references/ui-ux/design-workflow.md", "references/ui-ux/design-workflow.md", "keep-active-alternatives-comparable"],
    ["references/ticket-inventory-mode.md", "references/ticket-inventory-mode.md", "fixed-point-completion"],
    ["references/build-design-and-delivery-readiness.md", "references/ticket-inventory-mode.md", "reverse-challenge-pass"],
  ]) {
    assert.ok(read(file).includes(`#${id})`), `${file} links #${id}`);
    assert.ok(headings(target).has(id), `${target} has heading #${id}`);
  }
});
