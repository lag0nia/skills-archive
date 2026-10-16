import assert from "node:assert/strict";
import test from "node:test";
import { renderIssueBody } from "../../scripts/lib/ticket-projection/core.mjs";

const ticket = {
  id: "TICKET-0042", status: "todo", owner: "SR-020",
  question: "When should a failed delivery be retried?",
  context: "A delivery provider may be temporarily unavailable. Retrying too quickly can create duplicate notifications.",
  options: ["Retry once after one minute; recipients recover quickly but a prolonged outage still needs staff review.", "Wait for staff review; avoids repeated attempts but delays delivery."],
  recommendation: "Retry once after one minute because transient failures are common. This assumes the provider accepts an idempotency key.",
  resolution: "Retry once after one minute.\n\n- Preserve the idempotency key.\n- Escalate a second failure to staff.",
  dependencies: ["TICKET-0041"],
  dependencyDetails: [{ id: "TICKET-0041", title: "Prevent duplicate delivery", status: "finished", issueUrl: "https://github.com/example/design/issues/41" }],
  buildUnits: ["BU-003"], repositories: ["REPO-002"], resultRefs: ["SEL-004"],
  sourcePath: "design/software-design/build/workflow/tickets/delivery.yaml",
};

test("open brief leads with the authored question, readable choices and conditional recommendation", () => {
  const body = renderIssueBody(ticket);
  assert.ok(body.startsWith(`<!-- software-design-ticket TICKET-0042 -->\n\n## ${ticket.question}\n\n${ticket.context}`));
  assert.ok(body.includes(`## Options\n**A.** ${ticket.options[0]}\n\n**B.** ${ticket.options[1]}`));
  assert.ok(body.includes(`## Recommendation\n${ticket.recommendation}`));
  assert.match(body, /Before answering\n- \[Prevent duplicate delivery\]\(https:\/\/github.com\/example\/design\/issues\/41\) — finished/);
  assert.doesNotMatch(body, /Related decision|TD-\d{3}/);
  assert.match(body, /Reply in a comment with your choice, adjustment, alternative, or clarification/);
  const [brief, reference] = body.split("<details>");
  assert.doesNotMatch(brief, /SR-020|BU-003|REPO-002|SEL-004|TICKET-0041|Situation|Decision needed/);
  for (const id of ["TICKET-0042", "SR-020", "BU-003", "REPO-002", "SEL-004", "TICKET-0041"]) assert.ok(reference.includes(id));
  assert.ok(reference.includes(ticket.sourcePath));
});

test("absent optional relationships and empty proposals do not produce boilerplate", () => {
  const body = renderIssueBody({ ...ticket, dependencies: [], options: [], recommendation: null, buildUnits: [], repositories: [], resultRefs: [] });
  assert.doesNotMatch(body, /## (Before answering|Options|Recommendation)|standalone|None\.|undefined|null/);
});

test("unresolved relationships are reported explicitly rather than guessed or dropped", () => {
  const body = renderIssueBody({ ...ticket, dependencyDetails: [] });
  assert.match(body, /Unresolved reference: TICKET-0041 — status unavailable/);
});

for (const [status, heading] of [["decided", "Recorded decision"], ["finished", "Final outcome"]]) {
  test(`${status} leads with the recorded outcome and keeps the original question`, () => {
    const body = renderIssueBody({ ...ticket, status });
    assert.ok(body.startsWith(`<!-- software-design-ticket TICKET-0042 -->\n\n## ${heading}\n\n${ticket.resolution}`));
    assert.ok(body.includes(`## Original question\n${ticket.question}`));
    assert.equal(body.includes("Affected canonical updates and checks remain before completion."), status === "decided");
    assert.doesNotMatch(body, /## Recommendation|Reply in a comment|## Before answering/);
    assert.match(body, /## Related prerequisites/);
  });
}

test("deferred and excluded tickets prominently retain distinct reasons and resumption conditions", () => {
  const deferred = renderIssueBody({ ...ticket, status: "deferred", deferReason: "The provider must confirm its duplicate-request guarantees.", resumeWhen: "When the provider supplies a tested example." });
  assert.match(deferred, /^<!--[^\n]+-->\n\n## Why this is deferred\n\nThe provider must/);
  assert.match(deferred, /Resume when\nWhen the provider supplies a tested example/);
  assert.match(deferred, /still required for the target version/);
  const excluded = renderIssueBody({ ...ticket, status: "out-of-scope", scopeReason: "Automatic retries are excluded from the first release.", resumeWhen: "Before adding automatic retries." });
  assert.match(excluded, /^<!--[^\n]+-->\n\n## Why this is out of scope/);
  assert.match(excluded, /Reopen when\nBefore adding automatic retries/);
  assert.match(excluded, /No decision is required for the current scope/);
  assert.doesNotMatch(excluded, /Reply in a comment|## Before answering/);
});

test("authored language, Markdown and canonical visuals survive deterministic formatting", () => {
  const record = { ...ticket, question: "When should we retry the delivery?", recommendation: "Confirm the provider’s guarantee before recommending an option.", currentShape: { type: "logic", title: "Retry path", lines: ["flowchart LR", "A --> B"], source_refs: ["system-model/flows/delivery.md"] } };
  const body = renderIssueBody(record);
  assert.ok(body.includes(record.question));
  assert.ok(body.includes(record.recommendation));
  assert.ok(body.includes("```mermaid\nflowchart LR\nA --> B\n```"));
  assert.ok(body.split("<details>")[1].includes("system-model/flows/delivery.md"));
  assert.equal(renderIssueBody(record), body);
});

test("a settled status without attribution is shown as unknown origin, never as approval", () => {
  for (const status of ["decided", "finished"]) {
    const body = renderIssueBody({ ...ticket, status, attribution: [] });
    assert.doesNotMatch(body, /Approved|Human-approved/);
    assert.match(body, /## Decision origin\n- \*\*Unknown origin\*\* — no attribution is recorded for this answer/);
  }
});

test("partial and conditional attribution stays beside the answer it qualifies", () => {
  const attribution = [
    { decision: "Retry once after one minute.", origin: "human-approved/agent-recommended", evidence: "GitHub comment by the user accepting option A.", conditions: ["Requirement: A second failure always reaches staff review.", "Prerequisite before build: The provider confirms idempotency keys (TICKET-0041).", "Prerequisite before activation: Support staff are trained on the review queue."] },
    { decision: "Preserve the idempotency key across the retry.", origin: "agent-chosen", evidence: "Chosen while writing the retry flow under the user's instruction to handle the details.", conditions: [] },
  ];
  const body = renderIssueBody({ ...ticket, status: "finished", attribution });
  const origin = body.slice(body.indexOf("## Decision origin"), body.indexOf("## Original question"));
  assert.ok(body.indexOf(ticket.resolution) < body.indexOf("## Decision origin"));
  assert.match(origin, /- \*\*Human-approved · Agent recommended\*\* — Retry once after one minute\.\n  - Condition \(continuing requirement\): A second failure always reaches staff review\.\n  - Condition \(before build\): The provider confirms idempotency keys \(TICKET-0041\)\.\n  - Condition \(before activation\): Support staff are trained on the review queue\.\n  - Evidence: GitHub comment/);
  assert.match(origin, /- \*\*Agent-chosen\*\* — Preserve the idempotency key across the retry\.\n  - Evidence: Chosen while writing/);
  assert.doesNotMatch(body, /Approved/);
  assert.equal(renderIssueBody({ ...ticket, status: "finished", attribution }), body);
});

test("an open question shows its recorded parts apart from the choices that remain", () => {
  const attribution = [{ decision: "Retry automatically rather than waiting for staff.", origin: "human-approved/agent-recommended", evidence: "User reply: \"Automatic retry, yes. Not sure about one minute yet.\"", conditions: [] }];
  for (const status of ["todo", "deferred"]) {
    const body = renderIssueBody({ ...ticket, status, resolution: null, deferReason: "Waiting on provider limits.", resumeWhen: "After the provider publishes limits.", attribution });
    const decided = body.slice(body.indexOf("## Already decided"), body.indexOf("## Options"));
    assert.match(decided, /These parts are recorded; the rest of the question above is still open\.\n- \*\*Human-approved · Agent recommended\*\* — Retry automatically rather than waiting for staff\.\n  - Evidence: User reply/);
    assert.ok(body.indexOf("## Already decided") < body.indexOf("## Options") && body.indexOf("## Options") < body.indexOf("## Recommendation"));
    assert.doesNotMatch(body, /## Recorded decision|## Final outcome|## Decision origin/);
  }
  assert.doesNotMatch(renderIssueBody(ticket), /## Already decided/);
});
