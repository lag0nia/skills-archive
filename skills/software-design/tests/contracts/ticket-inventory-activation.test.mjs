#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { candidateProofValid } from "../../scripts/validate-implementation-detail-tickets.mjs";

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const skill = fs.readFileSync(path.join(skillRoot, "SKILL.md"), "utf8");
const inventoryMode = fs.readFileSync(
  path.join(skillRoot, "references", "ticket-inventory-mode.md"),
  "utf8",
);
const buildDesignMode = fs.readFileSync(
  path.join(skillRoot, "references", "build-design-and-delivery-readiness.md"),
  "utf8",
);
const ticketTemplate = fs.readFileSync(
  path.join(skillRoot, "assets", "templates", "build", "responsibility-tickets.yaml"),
  "utf8",
);

test("frontmatter and routing expose backlog and GitHub ticket workflows", () => {
  const frontmatter = /^---\n([\s\S]*?)\n---/.exec(skill)?.[1] ?? "";
  const description = /^description:\s*(.+)$/m.exec(frontmatter)?.[1] ?? "";

  assert.match(description, /implementation tickets/i);
  assert.match(description, /backfill/i);
  assert.match(description, /GitHub/i);
  assert.match(skill, /\[references\/ticket-inventory-mode\.md\]\(references\/ticket-inventory-mode\.md\)/);
  assert.match(skill, /\[references\/ticket-projection\.md\]\(references\/ticket-projection\.md\)/);
});

test("canonical unresolved tickets require a concrete candidate proof without a retired parent", () => {
  const validProof = "An implementer cannot finish or verify activation relay behavior without choosing provider ordering and retry timing, and the current package does not already choose it.";
  assert.equal(candidateProofValid(validProof), true);
  assert.equal(candidateProofValid("The provider is still TBD."), false);
  assert.equal(
    candidateProofValid("An implementer cannot finish or verify <bounded behavior> without choosing <missing detail>, and the current package does not already choose it."),
    false,
  );
  assert.match(ticketTemplate, /^ticket_file_version: 4$/m);
  assert.match(ticketTemplate, /^    candidate_proof:/m);
  assert.doesNotMatch(ticketTemplate, /parent_decision/);
});

test("inventory completion is snapshot-bounded and missing historical receipts do not block Build Design", () => {
  assert.match(inventoryMode, /bounded to the approved design snapshot/i);
  assert.match(inventoryMode, /does not mean that all future questions are knowable/i);
  assert.match(inventoryMode, /Do not retroactively mark the earlier Stage 7 snapshot incomplete/i);
  assert.match(buildDesignMode, /do not block Build Design for that reason alone/i);
  assert.match(buildDesignMode, /receipt absence alone does not block Build Design/i);
});

// Guidance checks only: whether an agent actually finds an undeclared operation is
// exercised by the manual evaluation in tests/behavioral/workflow-reliability/.
test("journey-operation discovery starts from requirements and Stage 9 consumes it", () => {
  const staged = fs.readFileSync(path.join(skillRoot, "references", "staged-design-workflow.md"), "utf8");
  const format = fs.readFileSync(path.join(skillRoot, "references", "system-model-format.md"), "utf8");
  assert.match(inventoryMode, /\*\*Journey-operation census:\*\* start from the approved requirements, flows, user journeys, and target outcomes in scope, not from existing tickets or `ACT-NNN` lists/);
  assert.match(inventoryMode, /A published event, projection, or simulation describes a result; it does not supply the command that initiates it/);
  assert.match(inventoryMode, /reuse or widen a suitable existing action rather than adding one per button/);
  assert.match(inventoryMode, /No validator or lead report can find an operation that no record declares/);
  assert.match(inventoryMode, /all journey-operation dispositions/);
  assert.match(staged, /7C — Handoff, journey-operation, outcome\/profile/);
  assert.match(staged, /a published event, projection, or simulation does not prove that its initiating command exists/);
  assert.match(staged, /return partial when material findings remain undispositioned or a contract gap found remains unrepaired/);
  assert.match(inventoryMode, /every contract gap found there is repaired;/);
  assert.match(format, /do not infer that a command surface also provides a read surface, or that a published event, projection, or simulation implies the command that initiates it/);
  assert.match(skill, /also run the journey-operation census there/);
  assert.match(buildDesignMode, /An operation with neither blocks the affected slice and routes as the \[journey-operation census\]\(ticket-inventory-mode\.md#reverse-challenge-pass\) does/);
});
