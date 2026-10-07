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

test("canonical unresolved tickets require a concrete candidate proof and explicit parent", () => {
  const validProof = "An implementer cannot finish or verify activation relay behavior without choosing provider ordering and retry timing, and the current package does not already choose it.";
  assert.equal(candidateProofValid(validProof), true);
  assert.equal(candidateProofValid("The provider is still TBD."), false);
  assert.equal(
    candidateProofValid("An implementer cannot finish or verify <bounded behavior> without choosing <missing detail>, and the current package does not already choose it."),
    false,
  );
  assert.match(ticketTemplate, /^ticket_file_version: 3$/m);
  assert.match(ticketTemplate, /^    candidate_proof:/m);
  assert.match(ticketTemplate, /^    parent_decision: null$/m);
});

test("inventory completion is snapshot-bounded and missing historical receipts do not block Build Design", () => {
  assert.match(inventoryMode, /bounded to the approved design snapshot/i);
  assert.match(inventoryMode, /does not mean that all future questions are knowable/i);
  assert.match(inventoryMode, /Do not retroactively mark the earlier Stage 7 snapshot incomplete/i);
  assert.match(buildDesignMode, /do not block Build Design for that reason alone/i);
  assert.match(buildDesignMode, /receipt absence alone does not block Build Design/i);
});
