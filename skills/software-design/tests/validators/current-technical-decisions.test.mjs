#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { validateImplementationDetailTickets } from "../../scripts/validate-implementation-detail-tickets.mjs";

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function currentFixture({
  decisionState = "Open",
  ticketStatus = "todo",
  parentDecision = "TD-001",
  includeParent = true,
  includeBlocker = true,
} = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "software-design-current-td-"));
  write(path.join(root, "system-model", "architecture.md"), `---
type: system-architecture
name: Example
---

# System Architecture
`);
  write(path.join(root, "system-model", "domains", "example", "domain.md"), `---
type: system-domain
id: DOMAIN-example
name: Example Domain
responsibilities: "SR-001"
---

# Example Domain
`);
  write(path.join(root, "system-model", "domains", "example", "responsibilities", "sr-001-example.md"), `---
type: system-responsibility
id: SR-001
name: Example Responsibility
domain: example
---

# SR-001 — Example Responsibility
`);

  const deferred = decisionState === "Deferred For Later Design";
  const blocked = decisionState === "Blocked";
  const resolved = decisionState === "Resolved";
  const blocker = includeBlocker ? `\n    blocker: ${blocked ? '"The required representation authority is unavailable."' : "null"}` : "";
  write(path.join(root, "build", "workflow", "technical-decisions.yaml"), `technical_decision_file_version: 1

decisions:
  - id: "TD-001"
    title: "Example representation"
    state: "${decisionState}"
    primary_domain: "example"
    affected_responsibilities: ["SR-001"]
    context: "The example representation requires one coherent technical choice."
    why_it_matters: "The representation controls interoperability."
    established: "The logical responsibility boundary is fixed."
    how_tickets_fit: "The child questions must preserve one representation contract."${blocker}
    current_shape: {"type":"logic","title":"Current representation boundary","source_refs":["system-model/domains/example/responsibilities/sr-001-example.md"],"lines":["flowchart TD","A[Logical boundary fixed] --> B[Select representation]"]}
    outcome: ${resolved ? '"Use the approved representation and verification boundary."' : "null"}
    defer_reason: ${deferred ? '"The representation is outside the target version."' : "null"}
    resume_when: ${deferred ? '"Before enabling the deferred representation."' : "null"}
`);

  const finished = ticketStatus === "finished";
  const resume = ["deferred", "out-of-scope"].includes(ticketStatus)
    ? '\n    resume_when: "Before enabling the deferred representation."'
    : "";
  const parent = includeParent ? `\n    parent_decision: ${parentDecision === null ? "null" : `"${parentDecision}"`}` : "";
  write(path.join(root, "build", "workflow", "tickets", "example", "sr-001", "sr-001-tickets.yaml"), `ticket_file_version: 3
scope: "responsibility:SR-001"

tickets:
  - id: "TICKET-0001"
    title: "Choose the representation"
    status: "${ticketStatus}"
    kind: "technical"
    complexity: "medium"
    concern: "data-model"
    owner: "SR-001"
    affects: ["SR-001"]
    build_units: []
    build_unit_disposition: "Realization mapping has not started."
    repositories: []
    repository_contract_area: null${parent}
    cluster: "representation"
    question: "Which representation will realize the responsibility?"
    context: "The logical boundary is fixed, but its representation must be selected."
    current_shape: null
    candidate_proof: "An implementer cannot finish or verify the example responsibility without choosing the exact representation and verification boundary, and the current package does not already choose it."
    options: ["Representation A", "Representation B"]
    recommendation: "Use Representation A."
    resolution: ${finished ? '"Use Representation A."' : "null"}
    result_refs: []
    constraint_refs: []
    depends_on: []
    write_targets: ["system-model/domains/example/responsibilities/sr-001-example.md"]${resume}
`);
  return root;
}

function validateCase(context, options) {
  const root = currentFixture(options);
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return validateImplementationDetailTickets(root);
}

test("the canonical ticket schema links each ticket directly to its Technical Decision", (context) => {
  const result = validateCase(context, {});
  assert.deepEqual(result.errors, []);
  assert.equal(result.decisions.has("TD-001"), true);
});

test("the canonical ticket schema requires explicit parent_decision", (context) => {
  const missing = validateCase(context, { includeParent: false });
  assert.ok(missing.errors.some((error) => /parent_decision is required/.test(error)));
});

test("standalone tickets use explicit null", (context) => {
  assert.deepEqual(validateCase(context, { parentDecision: null }).errors, []);
});

test("deferred Technical Decisions contain only finished or out-of-scope children", (context) => {
  assert.deepEqual(validateCase(context, { decisionState: "Deferred For Later Design", ticketStatus: "out-of-scope" }).errors, []);

  const currentChild = validateCase(context, { decisionState: "Deferred For Later Design", ticketStatus: "todo" });
  assert.ok(currentChild.errors.some((error) => /requires every unfinished child ticket to be out-of-scope/.test(error)));
});

test("resolved Technical Decisions require finished children and a combined outcome", (context) => {
  assert.deepEqual(validateCase(context, { decisionState: "Resolved", ticketStatus: "finished" }).errors, []);

  const staleParent = validateCase(context, { decisionState: "Open", ticketStatus: "finished" });
  assert.ok(staleParent.errors.some((error) => /every child is finished; set the TD to Resolved/.test(error)));
});

test("blocked Technical Decisions require the exact unavailable prerequisite", (context) => {
  assert.deepEqual(validateCase(context, { decisionState: "Blocked" }).errors, []);

  assert.throws(
    () => validateCase(context, { decisionState: "Blocked", includeBlocker: false }),
    /Blocked requires a concrete blocker/,
  );
});

test("retiring the last obsolete child allows a resolved TD with preserved closure relationships", (context) => {
  const root = currentFixture({ decisionState: "Resolved", ticketStatus: "finished" });
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const ticketPath = path.join(root, "build/workflow/tickets/example/sr-001/sr-001-tickets.yaml");
  const retired = fs.readFileSync(ticketPath, "utf8").replace('tickets:', 'archived_records:')
    .replace('    status: "finished"', '    record_state: "archived"\n    status_at_close: "finished"\n    closed_reason: "obsolete"\n    replaced_by: []');
  write(ticketPath, retired);
  assert.deepEqual(validateImplementationDetailTickets(root).errors, []);
  write(ticketPath, retired.replace('parent_decision: "TD-001"', 'parent_decision: null'));
  assert.match(validateImplementationDetailTickets(root).errors.join('\n'), /Resolved requires/);
});

test("promotion archives retain replacement parent validation", (context) => {
  const root = currentFixture({ decisionState: "Resolved", ticketStatus: "finished" });
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const file = path.join(root, "build/workflow/tickets/example/sr-001/sr-001-tickets.yaml");
  const text = fs.readFileSync(file, "utf8") + '\narchived_records:\n  - id: "TICKET-0002"\n    title: "Broad source"\n    record_state: "archived"\n    status_at_close: "todo"\n    closed_reason: "promoted-to-td"\n    promoted_to: "TD-001"\n    replaced_by: ["TICKET-0001"]\n';
  write(file, text);
  assert.deepEqual(validateImplementationDetailTickets(root).errors, []);
  write(file, text.replace('parent_decision: "TD-001"', 'parent_decision: null'));
  assert.match(validateImplementationDetailTickets(root).errors.join('\n'), /replacement TICKET-0001 does not point to TD-001/);
});
