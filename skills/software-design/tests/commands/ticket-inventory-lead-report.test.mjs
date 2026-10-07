#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { buildTicketInventoryLeadReport, formatTicketInventoryLeadReport } from "../../scripts/report-ticket-inventory-leads.mjs";
import { createWorkspace, writeText } from "../support/workspace.mjs";

function createFixture() {
  const root = createWorkspace("software-design-ticket-leads-");
  writeText(
    path.join(root, "system-model", "domains", "sample", "domain.md"),
    `---
type: system-domain
id: DOMAIN-sample
name: Sample Domain
responsibilities: "SR-001, SR-002"
---

# Sample Domain
`,
  );
  writeText(
    path.join(root, "system-model", "domains", "sample", "responsibilities", "sr-001-first-responsibility.md"),
    "---\ntype: system-responsibility\nid: SR-001\nname: First Responsibility\ndomain: sample\n---\n\n# SR-001 — First Responsibility\n",
  );
  writeText(
    path.join(root, "system-model", "domains", "sample", "responsibilities", "sr-002-second-responsibility.md"),
    "---\ntype: system-responsibility\nid: SR-002\nname: Second Responsibility\ndomain: sample\n---\n\n# SR-002 — Second Responsibility\n\nExact queue retry behavior remains responsibility-level implementation detail.\n",
  );
  writeText(
    path.join(root, "build", "workflow", "technical-decisions.yaml"),
    `technical_decision_file_version: 1

decisions:
  - id: "TD-001"
    title: "Authenticated boundary"
    state: "Open"
    primary_domain: "sample"
    affected_responsibilities: ["SR-001"]
    context: "The responsibility requires one coherent authenticated boundary."
    why_it_matters: "The boundary controls authority and interoperability."
    established: "The logical responsibility and denial semantics are fixed."
    how_tickets_fit: "The child ticket selects the one compatible authenticated seam."
    current_shape: null
    blocker: null
    outcome: null
    defer_reason: null
    resume_when: null
`,
  );
  writeText(
    path.join(root, "build", "workflow", "tickets", "sample", "sr-001", "sr-001-tickets.yaml"),
    `ticket_file_version: 3
scope: "responsibility:SR-001"

tickets:
  - id: "TICKET-0001"
    title: "Choose the authenticated boundary"
    status: "todo"
    kind: "technical"
    complexity: "medium"
    concern: "interface-api"
    owner: "SR-001"
    affects: ["SR-001"]
    build_units: []
    build_unit_disposition: "Realization mapping has not started."
    repositories: []
    repository_contract_area: null
    cluster: "authentication"
    parent_decision: "TD-001"
    question: "Which authenticated boundary will the component use?"
    context: "The component requires one bounded authenticated interface."
    candidate_proof: "An implementer cannot finish or verify authenticated requests without choosing the authenticated interface boundary, and the current package does not already choose it."
    options: ["Signed request", "Authenticated session"]
    recommendation: "Use a signed request."
    resolution: null
    current_shape: null
    result_refs: []
    constraint_refs: []
    depends_on: []
    write_targets: ["system-model/domains/sample/responsibilities/sr-001-first-responsibility.md"]
  - id: "TICKET-0002"
    title: "Choose independent storage"
    status: "todo"
    kind: "technical"
    complexity: "medium"
    concern: "data-model"
    owner: "SR-001"
    affects: ["SR-001"]
    build_units: []
    build_unit_disposition: "Realization mapping has not started."
    repositories: []
    repository_contract_area: null
    cluster: "storage"
    parent_decision: null
    question: "Which storage representation will preserve the record?"
    context: "The record needs a durable representation."
    candidate_proof: "An implementer cannot finish or verify durable records without choosing the storage representation and constraints, and the current package does not already choose it."
    options: ["Relational rows", "Append-only events"]
    recommendation: "Use relational rows."
    resolution: null
    current_shape: null
    result_refs: []
    constraint_refs: []
    depends_on: []
    write_targets: ["system-model/domains/sample/responsibilities/sr-001-first-responsibility.md"]
`,
  );
  return root;
}

test("lead report separates TD-linked and independent tickets and exposes zero-owner responsibilities", () => {
  const root = createFixture();
  try {
    const report = buildTicketInventoryLeadReport(root);
    assert.equal(report.responsibilityCount, 2);
    assert.equal(report.ticketCount, 2);
    assert.equal(report.linkedTicketCount, 1);
    assert.equal(report.independentTicketCount, 1);
    assert.deepEqual(report.zeroOwnedResponsibilities, ["SR-002"]);
    assert.equal(report.unresolvedLanguageLeads.length, 1);
    assert.equal(report.unresolvedLanguageLeads[0].file, "system-model/domains/sample/responsibilities/sr-002-second-responsibility.md");
    assert.match(formatTicketInventoryLeadReport(report), /System Responsibilities with zero owned tickets: SR-002/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
