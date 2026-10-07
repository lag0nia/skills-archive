import assert from "node:assert/strict";
import test from "node:test";
import { deriveTicketBoard, WAITING_ON_BYTE_BUDGET } from "../../scripts/lib/ticket-projection/ticket-board.mjs";
import { auditProjectViewContract, planProjectViewRepair, renderIssueBody } from "../../scripts/lib/ticket-projection/core.mjs";
import { contractViewState } from "../support/project-view-state.mjs";

const ticket = (n, extra = {}) => ({ id: `TICKET-${String(n).padStart(4, "0")}`, title: `Question ${n}`, status: "todo", kind: "product", domainLabel: "Payments", dependencies: [], ...extra });
const values = (records, n = 1) => deriveTicketBoard(records).find((r) => r.id === ticket(n).id).boardValues;

test("work area uses authored domains and technical classification across repository scopes", () => {
  for (const [kind, domainLabel, expected] of [["technical", "Payments", "Software"], ["product", "Loans", "Loans"], ["operational", "Cross-domain", "Cross-domain"]]) {
    assert.deepEqual(values([ticket(1, { kind, domainLabel, repositories: ["REPO-001"] })]), { "Work area": expected, "Answering group": "Ready", "Waiting on": null, "Board status": "todo" });
  }
  assert.throws(() => values([ticket(1, { domainLabel: null })]), /Domain/);
});

test("multiple direct and transitive prerequisites retain every condition and source identity", () => {
  const records = [ticket(1, { dependencies: ["TICKET-0002", "TICKET-0004"], blockedBy: ["Approval"] }), ticket(2, { dependencies: ["TICKET-0003"], blockedBy: ["Approval"] }), ticket(3, { blockedBy: ["Confirm format"] }), ticket(4)];
  const result = values(records);
  assert.equal(result["Answering group"], "Needs attention");
  assert.equal(result["Waiting on"], "TICKET-0001 — Question 1: External: Approval | TICKET-0002 — Question 2: answer required; External: Approval | TICKET-0003 — Question 3 via TICKET-0002: answer required; External: Confirm format | TICKET-0004 — Question 4: answer required");
  records[0].blockedBy = []; records[1].blockedBy = []; records[2].blockedBy = [];
  assert.equal(values(records)["Answering group"], "Waiting for answers");
  assert.deepEqual(values(records), values([...records].reverse()), "inventory ordering cannot change summaries");
});

test("deferred questions need attention even without dependencies, with one resumption notice", () => {
  const result = values([ticket(1, { status: "deferred", deferReason: "Pilot pending", resumeWhen: "Bank confirmation" })]);
  assert.equal(result["Answering group"], "Needs attention");
  assert.equal(result["Waiting on"], "TICKET-0001 — Question 1: deferred: Pilot pending; Resume when: Bank confirmation");
});

test("approved decided and finished prerequisites stop historical waiting and refresh unchanged dependents", () => {
  const dependent = ticket(1, { dependencies: ["TICKET-0002"] });
  for (const status of ["decided", "finished"]) {
    const prerequisite = ticket(2, { dependencies: ["TICKET-9999"], blockedBy: ["Historical"], status, resolution: "Approved" });
    assert.equal(values([dependent, prerequisite])["Answering group"], "Ready");
    assert.equal(values([dependent, prerequisite])["Waiting on"], null);
    delete prerequisite.resolution;
    assert.equal(values([dependent, prerequisite])["Answering group"], "Needs attention");
    assert.match(values([dependent, prerequisite])["Waiting on"], /missing-resolution/);
  }
  assert.equal(values([dependent, ticket(2)])["Answering group"], "Waiting for answers");
});

test("cycles, missing references, malformed blockers, and excluded prerequisites require review", () => {
  const cases = [
    [ticket(1, { dependencies: ["TICKET-9999"] })],
    [ticket(1, { dependencies: ["TICKET-0002"] }), ticket(2, { dependencies: ["TICKET-0001"] })],
    [ticket(1, { blockedBy: ["TICKET-0002"] }), ticket(2)],
    [ticket(1, { dependencies: ["TICKET-0002"] }), ticket(2, { status: "out-of-scope", resumeWhen: "V2" })],
  ];
  for (const records of cases) assert.equal(values(records)["Answering group"], "Needs attention");
});

test("diamonds deduplicate reasons and a directly listed prerequisite is never mislabeled as transitive", () => {
  const result = values([ticket(1, { dependencies: ["TICKET-0002", "TICKET-0003"] }), ticket(2, { dependencies: ["TICKET-0003"] }), ticket(3, { blockedBy: ["Confirm", "Confirm"] })]);
  assert.equal((result["Waiting on"].match(/External: Confirm/g) || []).length, 1);
  assert.doesNotMatch(result["Waiting on"], /via/);
});

test("all nonactive implementation records clear stale board fields", () => {
  for (const status of ["decided", "finished", "out-of-scope"]) assert.deepEqual(values([ticket(1, { status, boardValues: { "Work area": "Old", "Answering group": "Ready", "Waiting on": "Old" } })]), { "Work area": null, "Answering group": null, "Waiting on": null, "Board status": status === "out-of-scope" ? null : status });
});

test("extras are informational and repair never deletes/reorders them", () => {
  const state = contractViewState();
  state.views.nodes.splice(1, 0, { id: "EXTRA", number: 99, name: "My custom view" });
  assert.equal(auditProjectViewContract(state).apiPassed, true);
  assert.deepEqual(auditProjectViewContract(state).additionalViews, [{ id: "EXTRA", number: 99, name: "My custom view" }]);
  const before = structuredClone(state);
  assert.deepEqual(planProjectViewRepair(state), []);
  assert.deepEqual(state, before);
  [state.views.nodes[2], state.views.nodes[3]] = [state.views.nodes[3], state.views.nodes[2]];
  assert.equal(auditProjectViewContract(state).apiPassed, true);
  assert.equal(auditProjectViewContract(state).visibleOrderVerification, "manual-ui-required");
});

test("Waiting separates blocked todo from Ready without changing canonical statuses", () => {
  const records = [ticket(1), ticket(2, { dependencies: ["TICKET-0001"] }),
    ticket(3, { blockedBy: ["Provider confirmation"] }),
    ticket(4, { dependencies: ["TICKET-9999"] }),
    ticket(5, { status: "deferred", deferReason: "Pilot pending", resumeWhen: "Pilot complete" }),
    ticket(6, { status: "decided", resolution: "Approved" }),
    ticket(7, { status: "finished", resolution: "Approved" }), ticket(8, { status: "out-of-scope" })];
  const before = structuredClone(records);
  const derived = deriveTicketBoard(records);
  assert.deepEqual(derived.map((r) => r.boardValues["Board status"]), ["todo", "Waiting", "Waiting", "Waiting", "deferred", "decided", "finished", null]);
  assert.deepEqual(records, before);
  records[0].status = "decided";
  assert.equal(deriveTicketBoard(records)[1].boardValues["Board status"], "Waiting", "approval without a resolution cannot release a dependent");
  records[0].resolution = "Approved";
  assert.equal(deriveTicketBoard(records)[1].boardValues["Board status"], "todo");
  records[0].status = "todo";
  assert.equal(deriveTicketBoard(records)[1].boardValues["Board status"], "Waiting", "reopening reblocks dependents");
});

test("a cycle and a transitive external blocker both enter Waiting", () => {
  const records = [ticket(1, { dependencies: ["TICKET-0002"] }), ticket(2, { dependencies: ["TICKET-0001"] })];
  assert.ok(deriveTicketBoard(records).every((r) => r.boardValues["Board status"] === "Waiting"));
  records[1] = ticket(2, { blockedBy: ["External authority"] });
  assert.equal(deriveTicketBoard(records)[0].boardValues["Board status"], "Waiting");
});

test("large Unicode dependency graphs fit cards and retain all full explanations in the issue", () => {
  const prerequisites = Array.from({ length: 120 }, (_, i) => ticket(i + 2, { title: "Long title 🧪 ".repeat(20), blockedBy: [`Provider ${i}: ${"🔒".repeat(400)}`] }));
  const main = ticket(1, { question: "Which option?", context: "Context", sourcePath: "tickets.yaml", dependencies: prerequisites.map((r) => r.id) });
  const records = [main, ...prerequisites];
  const derived = deriveTicketBoard(records)[0];
  const card = derived.boardValues["Waiting on"];
  assert.ok(Buffer.byteLength(card, "utf8") <= WAITING_ON_BYTE_BUDGET);
  assert.match(card, /120 blocking sources/);
  assert.match(card, /\(\+\d+ more\)/);
  assert.match(card, /this issue's Waiting on section/);
  assert.equal(derived.waitingOnDetails.length, 120);
  const body = renderIssueBody(derived);
  for (const prerequisite of prerequisites) {
    assert.ok(body.includes(prerequisite.title));
    assert.ok(body.includes(prerequisite.blockedBy[0]));
  }
  assert.deepEqual(deriveTicketBoard([...records].reverse()).find((r) => r.id === main.id).boardValues, derived.boardValues);
});

test("the UTF-8 card budget is inclusive and long individual blockers never lose their full text", () => {
  const base = deriveTicketBoard([ticket(1, { blockedBy: ["x"] })])[0];
  const overhead = Buffer.byteLength(base.boardValues["Waiting on"], "utf8") - 1;
  for (const [text, compact] of [["x".repeat(WAITING_ON_BYTE_BUDGET - overhead), false], ["x".repeat(WAITING_ON_BYTE_BUDGET - overhead + 1), true], ["🧪".repeat(300), true]]) {
    const result = deriveTicketBoard([ticket(1, { blockedBy: [text] })])[0];
    assert.ok(Buffer.byteLength(result.boardValues["Waiting on"], "utf8") <= WAITING_ON_BYTE_BUDGET);
    assert.equal(result.boardValues["Waiting on"].includes("Full explanation:"), compact);
    assert.ok(result.waitingOnDetails[0].includes(text));
  }
});
