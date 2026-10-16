#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { FIXTURE_PATHS, decisionFixture, linkOverviewFromReadme, ticket, writeTickets } from "../support/decision-fixture.mjs";
import { runNode, writeText } from "../support/workspace.mjs";
import { buildTicketAnswerabilityReport } from "../../scripts/report-ticket-answerability.mjs";
import { normalizeTicketDocuments } from "../../scripts/lib/ticket-projection/core.mjs";
import { validateImplementationDetailTickets } from "../../scripts/validate-implementation-detail-tickets.mjs";

const scripts = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "scripts");
const generator = path.join(scripts, "generate-decision-overview.mjs");
const overviewPath = (root) => path.join(root, "build/workflow/decision-overview.md");
const run = (script, ...args) => runNode(path.join(scripts, script), args);

const userSpecified = ticket("TICKET-0001", {
  status: "finished",
  title: "Choose the interest accrual period",
  resolution: "Interest accrues daily on outstanding principal.",
  attribution: [{ decision: "Interest accrues daily on outstanding principal.", origin: "human-approved/user-specified", evidence: "User instruction in the 2026-10-14 design session: \"Accrue interest daily on what is still owed.\"" }],
});
const acceptedConditional = ticket("TICKET-0002", {
  status: "finished",
  title: "Choose how a missed repayment is collected",
  resolution: "Retry a missed repayment once after three days, then move the loan to manual review.",
  write_targets: [FIXTURE_PATHS.responsibility, FIXTURE_PATHS.repayment],
  attribution: [{
    decision: "Retry a missed repayment once after three days, then move the loan to manual review.",
    origin: "human-approved/agent-recommended",
    evidence: "Agent proposal (2026-10-14): retry once after three days, then manual review; the alternative was retrying daily. User reply: \"Yes, provided borrowers can recover their funds.\"",
    conditions: ["Requirement: A borrower can always withdraw funds that are not owed, including while a loan is in manual review."],
  }],
});
const partial = ticket("TICKET-0003", {
  status: "decided",
  title: "Choose late fee handling",
  resolution: "Charge a flat late fee after a missed repayment; round fees down to the cent.",
  attribution: [
    { decision: "Charge a flat late fee after a missed repayment.", origin: "human-approved/agent-recommended", evidence: "User accepted option A in the 2026-10-14 session: \"A is fine.\"" },
    { decision: "Round late fees down to the cent.", origin: "agent-chosen", evidence: "Chosen while writing the fee rule; the user asked the agent to settle the remaining fee details." },
  ],
});
const legacy = ticket("TICKET-0004", {
  status: "finished",
  title: "Establish repository module conventions",
  resolution: "Approved under the 2026-08-20 full migration authorization: use one monorepo.",
});
const proposal = ticket("TICKET-0005", { title: "Confirm the partner bank account API" });
const excluded = ticket("TICKET-0006", { status: "out-of-scope", title: "Support co-borrowers", scope_reason: "Co-borrowers are excluded from the first release.", resume_when: "Before adding co-borrowers." });
const prerequisite = ticket("TICKET-0007", {
  status: "decided",
  title: "Choose where loan funds are held",
  resolution: "Hold loan funds with the partner bank.",
  write_targets: [FIXTURE_PATHS.repayment],
  attribution: [{ decision: "Hold loan funds with the partner bank.", origin: "human-approved/agent-recommended", evidence: "User reply to the custody recommendation: \"Go with the partner bank, provided its account API is confirmed before we build against it and counsel signs off on the wording before launch.\"", conditions: ["Prerequisite before build: The partner bank confirms its account API (TICKET-0005).", "Prerequisite before activation: Counsel confirms the custody wording before launch."] }],
});
// The user settled one part of an open question; the rest stays open and its dependent keeps waiting.
const partlyAnswered = ticket("TICKET-0010", {
  title: "Choose the statement delivery channel and schedule",
  question: "Which channel delivers loan statements, and how often?",
  recommendation: "Remaining: send statements monthly.",
  attribution: [{ decision: "Statements are delivered by email, not post.", origin: "human-approved/agent-recommended", evidence: "Agent proposal: email delivery, monthly. User reply: \"Email, yes. Not sure about monthly yet.\"" }],
});
const waitsOnPartlyAnswered = ticket("TICKET-0011", { title: "Choose the statement template", depends_on: ["TICKET-0010"] });
const archivedDuplicate = { id: "TICKET-0008", record_state: "archived", status_at_close: "decided", closed_reason: "duplicate", replaced_by: ["TICKET-0001"], attribution: [{ decision: "Interest accrues monthly.", origin: "human-approved/user-specified", evidence: "Withdrawn answer, kept as history." }] };

function fullFixture() {
  // Out-of-scope tickets need a scope owner; the fixture adds one before writing tickets.
  const fixture = decisionFixture();
  writeText(path.join(fixture.root, "system-model/contracts/scope/scope-001-co-borrowers.md"), "---\ntype: system-scope-boundary\nid: SCOPE-001\nname: Co-borrowers\nstatus: deferred\nresponsibilities: \"SR-001\"\nflows: \"None.\"\n---\n\n# SCOPE-001 — Co-borrowers\n\n## Boundary\n\nCo-borrowers are excluded.\n");
  writeTickets(fixture.root, [userSpecified, acceptedConditional, partial, legacy, proposal, { ...excluded, write_targets: ["system-model/contracts/scope/scope-001-co-borrowers.md"] }, prerequisite, partlyAnswered, waitsOnPartlyAnswered], [archivedDuplicate]);
  writeText(path.join(fixture.root, FIXTURE_PATHS.domain), fs.readFileSync(path.join(fixture.root, FIXTURE_PATHS.domain), "utf8") + `
## Decision Attribution

| Decision | Origin | Evidence | Conditions |
| --- | --- | --- | --- |
| Loan balances and repayment handling stay in one Lending Domain. | Agent-chosen | Written during the Stage 1 pass; the checkpoint presented one domain without alternatives, and approval covered writing that stage. See [the repayment responsibility](./responsibilities/sr-002-repayment.md). | None |
`);
  return fixture;
}

function section(overview, heading) {
  const start = overview.indexOf(`## ${heading}\n`);
  const next = overview.indexOf("\n## ", start + 1);
  return overview.slice(start, next === -1 ? undefined : next);
}

test("the overview groups current decisions by origin and keeps conditions with their decision", (context) => {
  const { workspace, root } = fullFixture();
  context.after(() => fs.rmSync(workspace, { recursive: true, force: true }));
  const result = run("generate-decision-overview.mjs", "--root", root);
  assert.equal(result.status, 0, result.stderr);
  const overview = fs.readFileSync(overviewPath(root), "utf8");

  assert.match(section(overview, "Human-approved · User specified"), /Interest accrues daily on outstanding principal\./);
  const recommended = section(overview, "Human-approved · Agent recommended");
  assert.match(recommended, /Retry a missed repayment once[^\n]*\n  - Owner: [^\n]*TICKET-0002[^\n]* · finished\n  - Canonical targets: [^\n]*Loan Ledger \(SR-001\)[^\n]*; [^\n]*Repayment Handling \(SR-002\)[^\n]*\n  - Condition \(continuing requirement\): A borrower can always withdraw funds/);
  assert.match(recommended, /Hold loan funds with the partner bank\.\*\*\n  - Owner: [^\n]*TICKET-0007[^\n]* · decided\n  - Canonical targets: [^\n]*Repayment Handling/);
  // Status alone never shows whether a target already holds the answer.
  assert.doesNotMatch(overview, /Written to|not yet updated/);
  // A prerequisite keeps the stage it binds: an early one is tracked by its ticket, a launch gate holds no earlier work.
  assert.match(recommended, /Condition \(before build\): The partner bank confirms its account API \(TICKET-0005\)\. — TICKET-0005 is todo\n/);
  assert.match(recommended, /Condition \(before activation\): Counsel confirms the custody wording before launch\. — binds at activation; earlier design, implementation, build, and verification are not held\n/);
  assert.match(recommended, /Statements are delivered by email, not post\.\*\*\n  - Owner: [^\n]*TICKET-0010[^\n]* · todo — recorded part of an open question; the rest is still unanswered\n/);
  assert.match(recommended, /Charge a flat late fee/);
  assert.match(section(overview, "Agent-chosen"), /Round late fees down to the cent\./);
  assert.match(section(overview, "Agent-chosen"), /Loan balances and repayment handling stay in one Lending Domain\.\*\*\n  - Owner: \[Lending Domain\]\(\.\.\/\.\.\/system-model\/domains\/lending\/domain\.md#decision-attribution\)/);
  assert.match(section(overview, "Agent-chosen"), /\[the repayment responsibility\]\(\.\.\/\.\.\/system-model\/domains\/lending\/responsibilities\/sr-002-repayment\.md\)/);
  const unknown = section(overview, "Unknown origin");
  assert.match(unknown, /Establish repository module conventions[^\n]*\n  - Owner: [^\n]*TICKET-0004[^\n]* · finished[\s\S]*Attribution: not recorded/);

  // Proposals, exclusions, archived history and the withdrawn answer are not current decisions.
  for (const absent of ["Confirm the partner bank account API", "Support co-borrowers", "Interest accrues monthly", "TICKET-0006", "TICKET-0008", "TICKET-0011", "send statements monthly", "Which channel delivers"]) {
    assert.ok(!overview.includes(absent), absent);
  }
  // A ticket written to several owners appears once; a partial ticket appears once per attributed part.
  assert.equal(overview.split("Retry a missed repayment once").length - 1, 1);
  assert.equal(overview.split("TICKET-0003 — Choose late fee handling").length - 1, 2);
  assert.match(overview, /- 8 current decisions: 6 from 5 settled tickets, 1 recorded within 1 open ticket, and 1 from 1 canonical record\.\n- 1 settled ticket has no recorded attribution/);
  assert.match(overview, /\| \[Human-approved · Agent recommended\]\(#human-approved--agent-recommended\) \| 4 \|/);
});

test("generation is deterministic, links resolve from the package, and freshness is checked", (context) => {
  const { workspace, root } = fullFixture();
  context.after(() => fs.rmSync(workspace, { recursive: true, force: true }));
  assert.equal(run("generate-decision-overview.mjs", "--root", root, "--check").status, 1, "a missing overview is not fresh");
  assert.equal(run("generate-decision-overview.mjs", "--root", root).status, 0);
  const first = fs.readFileSync(overviewPath(root), "utf8");
  assert.equal(run("generate-decision-overview.mjs", "--root", root).status, 0);
  assert.equal(fs.readFileSync(overviewPath(root), "utf8"), first);
  assert.equal(run("generate-decision-overview.mjs", "--root", root, "--check").status, 0);

  // The structure validator checks every local link and anchor, and requires README navigation.
  const unlinked = run("validate-software-design-structure.mjs", "--root", root);
  assert.equal(unlinked.status, 1);
  assert.match(unlinked.stderr, /README must link to build\/workflow\/decision-overview\.md/);
  linkOverviewFromReadme(root);
  const linked = run("validate-software-design-structure.mjs", "--root", root);
  assert.equal(linked.status, 0, linked.stderr);

  fs.writeFileSync(overviewPath(root), first.replace("Interest accrues daily", "Interest accrues weekly"));
  const edited = run("generate-decision-overview.mjs", "--root", root, "--check");
  assert.equal(edited.status, 1);
  assert.match(edited.stderr, /stale or was edited by hand/);
  assert.equal(run("generate-decision-overview.mjs", "--root", root).status, 0);

  // Replacing an approval with a materially changed agent choice removes the old approval on regeneration.
  writeTickets(root, [{ ...userSpecified, resolution: "Interest accrues monthly.", attribution: [{ decision: "Interest accrues monthly.", origin: "agent-chosen", evidence: "Changed while repairing the statement cycle; replaces the 2026-10-14 daily-accrual answer (see version history). Not yet presented to the user." }] }, acceptedConditional, partial, legacy, proposal, prerequisite, partlyAnswered, waitsOnPartlyAnswered], [archivedDuplicate]);
  const stale = run("generate-decision-overview.mjs", "--root", root, "--check");
  assert.equal(stale.status, 1);
  assert.equal(run("generate-decision-overview.mjs", "--root", root).status, 0);
  const regenerated = fs.readFileSync(overviewPath(root), "utf8");
  assert.ok(!regenerated.includes("Interest accrues daily"));
  assert.match(section(regenerated, "Agent-chosen"), /Interest accrues monthly\./);
  assert.match(section(regenerated, "Human-approved · User specified"), /None recorded\./);
});

test("affected decisions name protected approvals and their conditions before a revision", (context) => {
  const { workspace, root } = fullFixture();
  context.after(() => fs.rmSync(workspace, { recursive: true, force: true }));
  const byPath = run("generate-decision-overview.mjs", "--root", root, "--affected", FIXTURE_PATHS.repayment);
  const byResponsibility = JSON.parse(run("generate-decision-overview.mjs", "--root", root, "--affected", FIXTURE_PATHS.responsibility).stdout);
  assert.deepEqual(byResponsibility.affected.filter((item) => item.owner.id === "TICKET-0010").map((item) => [item.owner.status, item.humanApproved]), [["todo", true]]);
  assert.equal(byPath.status, 0, byPath.stderr);
  const report = JSON.parse(byPath.stdout);
  assert.deepEqual(report.affected.map((item) => [item.owner.id, item.category, item.humanApproved]), [
    ["TICKET-0002", "Human-approved · Agent recommended", true],
    ["TICKET-0007", "Human-approved · Agent recommended", true],
  ]);
  assert.match(report.affected[0].conditions[0], /^Requirement: A borrower can always withdraw/);

  const byTracker = JSON.parse(run("generate-decision-overview.mjs", "--root", root, "--affected", "TICKET-0005").stdout);
  assert.deepEqual(byTracker.affected.map((item) => item.decision), ["Hold loan funds with the partner bank."]);
  const byOwner = JSON.parse(run("generate-decision-overview.mjs", "--root", root, "--affected", FIXTURE_PATHS.domain).stdout);
  assert.deepEqual(byOwner.affected.map((item) => [item.category, item.humanApproved]), [["Agent-chosen", false]]);
  assert.ok(!fs.existsSync(overviewPath(root)), "the affected report is read-only");
  assert.equal(run("generate-decision-overview.mjs", "--root", root, "--affected", "system-model/missing.md").status, 1);
});

test("supplied attribution is validated without requiring it on historical answers", (context) => {
  const { workspace, root } = decisionFixture([legacy, proposal]);
  context.after(() => fs.rmSync(workspace, { recursive: true, force: true }));
  // A package without attribution keeps validating and keeps its statuses.
  assert.equal(run("validate-implementation-detail-tickets.mjs", "--root", root).status, 0);
  assert.equal(run("validate-software-design-structure.mjs", "--root", root).status, 0);

  const rejected = (tickets, pattern) => {
    writeTickets(root, tickets);
    const result = run("validate-implementation-detail-tickets.mjs", "--root", root);
    assert.equal(result.status, 1, JSON.stringify(tickets.at(-1).attribution));
    assert.match(result.stderr, pattern);
  };
  const entry = { decision: "Use option A.", origin: "human-approved/user-specified", evidence: "User: \"Use A.\"" };
  // An open ticket may hold a part the user settled without changing its status.
  writeTickets(root, [legacy, { ...proposal, attribution: [entry] }]);
  assert.equal(run("validate-implementation-detail-tickets.mjs", "--root", root).status, 0);
  writeText(path.join(root, "system-model/contracts/scope/scope-001-co-borrowers.md"), "---\ntype: system-scope-boundary\nid: SCOPE-001\nname: Co-borrowers\nstatus: deferred\nresponsibilities: \"SR-001\"\nflows: \"None.\"\n---\n\n# SCOPE-001 — Co-borrowers\n\n## Boundary\n\nCo-borrowers are excluded.\n");
  rejected([legacy, proposal, { ...excluded, write_targets: ["system-model/contracts/scope/scope-001-co-borrowers.md"], attribution: [entry] }], /TICKET-0006: an out-of-scope ticket records no attribution; keep an exclusion's attribution in its scope record/);
  rejected([legacy, proposal, ticket("TICKET-0009", { status: "finished", attribution: [{ ...entry, origin: "approved" }] })], /attribution origin must be one of/);
  rejected([legacy, proposal, ticket("TICKET-0009", { status: "finished", attribution: [{ ...entry, evidence: "" }] })], /needs evidence/);
  rejected([legacy, proposal, ticket("TICKET-0009", { status: "finished", attribution: [{ ...entry, decision: " " }] })], /must name the specific decision/);
  rejected([legacy, proposal, ticket("TICKET-0009", { status: "finished", attribution: [{ ...entry, conditions: ["Borrowers can recover funds."] }] })], /must start with "Requirement: "/);
  rejected([legacy, proposal, ticket("TICKET-0009", { status: "finished", attribution: [{ ...entry, conditions: ["Prerequisite: Counsel signs off first (TICKET-0005)."] }] })], /"Prerequisite before <stage>: "[^\n]*design, implementation, build, verification, release, deployment, activation, operation/);
  rejected([legacy, proposal, ticket("TICKET-0009", { status: "finished", attribution: [{ ...entry, conditions: ["Prerequisite before launch: Counsel signs off first."] }] })], /"Prerequisite before <stage>: "/);
  rejected([legacy, proposal, ticket("TICKET-0009", { status: "finished", attribution: [{ ...entry, conditions: ["Prerequisite before build: Counsel signs off first."] }] })], /a prerequisite before build must name the unresolved ticket that tracks it/);
  rejected([legacy, proposal, ticket("TICKET-0009", { status: "finished", attribution: [{ ...entry, conditions: ["Prerequisite before build: Counsel signs off first (TICKET-0099)."] }] })], /unknown ticket TICKET-0099/);
  rejected([legacy, proposal, ticket("TICKET-0009", { status: "finished", attribution: [{ ...entry, evidence: "See [the ledger](system-model/domains/lending/domain.md)." }] })], /package-relative backticked paths, not relative Markdown links/);
  // A later-lifecycle gate needs no tracking ticket.
  writeTickets(root, [legacy, proposal, ticket("TICKET-0009", { status: "finished", attribution: [{ ...entry, conditions: ["Prerequisite before activation: Counsel signs off on the wording before launch."] }] })]);
  assert.equal(run("validate-implementation-detail-tickets.mjs", "--root", root).status, 0);
  rejected([legacy, proposal, ticket("TICKET-0009", { status: "finished", attribution: [{ ...entry, evidence: "Recorded in `system-model/missing.md`." }] })], /reference does not resolve/);
  rejected([legacy, proposal, ticket("TICKET-0009", { status: "finished", attribution: [entry, { ...entry, origin: "agent-chosen" }] })], /attributed twice/);
  rejected([legacy, proposal, ticket("TICKET-0009", { status: "finished", attribution: [{ ...entry, approved_by: "user" }] })], /unsupported attribution field/);
});

test("record attribution is checked where decisions are owned, and one decision has one owner", (context) => {
  const { workspace, root } = decisionFixture([ticket("TICKET-0001", { status: "finished", attribution: [{ decision: "Keep one Lending Domain.", origin: "agent-chosen", evidence: "Stage 1 pass." }] })]);
  context.after(() => fs.rmSync(workspace, { recursive: true, force: true }));
  const table = (origin) => `\n## Decision Attribution\n\n| Decision | Origin | Evidence | Conditions |\n| --- | --- | --- | --- |\n| Keep one Lending Domain. | ${origin} | Stage 1 pass. | None |\n`;
  const domain = path.join(root, FIXTURE_PATHS.domain);
  const original = fs.readFileSync(domain, "utf8");

  fs.writeFileSync(domain, original + table("Approved"));
  assert.match(run("validate-software-design-structure.mjs", "--root", root).stderr, /attribution origin must be one of/);

  fs.writeFileSync(domain, original + table("Agent-chosen"));
  assert.equal(run("validate-software-design-structure.mjs", "--root", root).status, 0);
  const duplicate = run("generate-decision-overview.mjs", "--root", root);
  assert.equal(duplicate.status, 1);
  assert.match(duplicate.stderr, /attributed in both TICKET-0001 and system-model\/domains\/lending\/domain\.md; record it once/);

  fs.writeFileSync(domain, original);
  fs.appendFileSync(path.join(root, "README.md"), table("Agent-chosen"));
  assert.match(run("validate-software-design-structure.mjs", "--root", root).stderr, /README\.md: ## Decision Attribution belongs in the authoritative record/);
});

test("projection and consultation carry the recorded origin instead of inferring approval from status", (context) => {
  const { workspace, root } = fullFixture();
  context.after(() => fs.rmSync(workspace, { recursive: true, force: true }));
  const result = validateImplementationDetailTickets(root);
  const records = normalizeTicketDocuments(result.documents, root, result.responsibilities, result.domains);
  const body = (id) => records.find((record) => record.id === id).body;
  assert.match(body("TICKET-0002"), /## Final outcome[\s\S]*## Decision origin\n- \*\*Human-approved · Agent recommended\*\*[\s\S]*Condition \(continuing requirement\): A borrower can always withdraw/);
  assert.match(body("TICKET-0003"), /\*\*Human-approved · Agent recommended\*\* — Charge a flat late fee[\s\S]*\*\*Agent-chosen\*\* — Round late fees down/);
  assert.match(body("TICKET-0004"), /\*\*Unknown origin\*\* — no attribution is recorded/);
  assert.doesNotMatch(records.map((record) => record.body).join("\n"), /## Approved/);

  const report = buildTicketAnswerabilityReport(root, { all: true });
  const origins = Object.fromEntries(report.nodes.filter((node) => node.settled).map((node) => [node.id, node.origins]));
  assert.deepEqual(origins["TICKET-0003"], ["Human-approved · Agent recommended", "Agent-chosen"]);
  assert.deepEqual(origins["TICKET-0004"], ["Unknown origin"]);
  assert.equal(origins["TICKET-0005"], undefined, "an open question has no origin");
  // A recorded part is reported for the open question itself and never becomes settled context for its dependent.
  const partlyAnswered = report.nodes.find((node) => node.id === "TICKET-0010");
  assert.equal(partlyAnswered.settled, false);
  assert.deepEqual(partlyAnswered.recordedParts.map((part) => [part.origin, part.decision]), [["Human-approved · Agent recommended", "Statements are delivered by email, not post."]]);
  const dependent = report.questions.find((question) => question.id === "TICKET-0011");
  assert.deepEqual([dependent.internalPrerequisites, dependent.approvedContext], [["TICKET-0010"], []]);
  assert.match(body("TICKET-0010"), /## Already decided[\s\S]*Statements are delivered by email, not post\.[\s\S]*## Options[\s\S]*## Recommendation\nRemaining: send statements monthly\./);
});

test("retired-format packages are rejected rather than given an overview", (context) => {
  const { workspace, root } = decisionFixture([legacy]);
  context.after(() => fs.rmSync(workspace, { recursive: true, force: true }));
  const architecture = path.join(root, "system-model/architecture.md");
  fs.writeFileSync(architecture, fs.readFileSync(architecture, "utf8").replace("design_format: 2\n", ""));
  for (const args of [[], ["--check"]]) {
    const result = run("generate-decision-overview.mjs", "--root", root, ...args);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Decision overview: .*design_format is missing; current packages declare design_format: 2\. .*retired/);
    assert.doesNotMatch(result.stderr, /^\s+at /m);
  }
  assert.equal(fs.existsSync(path.join(root, "build/workflow/decision-overview.md")), false);
});

test("overview links reach the targets their owners name, from the overview's own location", (context) => {
  const { workspace, root } = decisionFixture([ticket("TICKET-0001", {
    status: "finished",
    attribution: [{ decision: "Use the ledger rule.", origin: "human-approved/user-specified", evidence: "Recorded in `system-model/domains/lending/domain.md#approval` and the brief `../software-brief.md`; thread https://example.com/thread/1." }],
  })]);
  context.after(() => fs.rmSync(workspace, { recursive: true, force: true }));
  const domain = path.join(root, FIXTURE_PATHS.domain);
  const original = fs.readFileSync(domain, "utf8");
  const withSection = (evidence) => `${original}
## Approval

The user approved the single Lending Domain.

## Decision Attribution

| Decision | Origin | Evidence | Conditions |
| --- | --- | --- | --- |
| Keep one Lending Domain. | Human-approved · User specified | ${evidence} | Requirement: Repayment stays with [repayment handling](./responsibilities/sr-002-repayment.md#purpose). |
`;
  fs.writeFileSync(domain, withSection("See [Approval](#approval), the [software brief](../../../../software-brief.md), [repayment](./responsibilities/sr-002-repayment.md#purpose), and [the thread](https://example.com/thread/2)."));
  linkOverviewFromReadme(root);
  const generated = run("generate-decision-overview.mjs", "--root", root);
  assert.equal(generated.status, 0, generated.stderr);
  const overview = fs.readFileSync(overviewPath(root), "utf8");
  // A bare anchor points into its owner; a relative link leaves the package only as far as its owner's did.
  assert.match(overview, /\[Approval\]\(\.\.\/\.\.\/system-model\/domains\/lending\/domain\.md#approval\)/);
  assert.match(overview, /\[software brief\]\(\.\.\/\.\.\/\.\.\/software-brief\.md\)/);
  assert.match(overview, /\[repayment\]\(\.\.\/\.\.\/system-model\/domains\/lending\/responsibilities\/sr-002-repayment\.md#purpose\)/);
  assert.match(overview, /\[repayment handling\]\(\.\.\/\.\.\/system-model\/domains\/lending\/responsibilities\/sr-002-repayment\.md#purpose\)/);
  assert.match(overview, /\[the thread\]\(https:\/\/example\.com\/thread\/2\)/);
  assert.match(overview, /\[`system-model\/domains\/lending\/domain\.md#approval`\]\(\.\.\/\.\.\/system-model\/domains\/lending\/domain\.md#approval\)/);
  assert.match(overview, /\[`\.\.\/software-brief\.md`\]\(\.\.\/\.\.\/\.\.\/software-brief\.md\)/);
  assert.ok(!overview.includes("](#approval)"));
  // Every rewritten link resolves from where the overview lives.
  const checked = run("validate-software-design-structure.mjs", "--root", root);
  assert.equal(checked.status, 0, checked.stderr);

  // Original targets are validated at their owner, including anchors in the owner itself.
  fs.writeFileSync(domain, withSection("See [Approval](#approved-by-the-user)."));
  const broken = run("validate-software-design-structure.mjs", "--root", root);
  assert.equal(broken.status, 1);
  assert.match(broken.stderr, /system-model\/domains\/lending\/domain\.md: attribution reference does not resolve: #approved-by-the-user/);

  // Titled links, and destinations in angle brackets, are read and rewritten the same way, keeping label, title and fragment.
  fs.writeFileSync(domain, withSection("See [Approval](#approval \"original approval\"), the [software brief](../../../../software-brief.md 'the brief'), and [repayment](<./responsibilities/sr-002-repayment.md#purpose> \"repayment rule\")."));
  assert.equal(run("generate-decision-overview.mjs", "--root", root).status, 0);
  const titled = fs.readFileSync(overviewPath(root), "utf8");
  assert.ok(titled.includes('[Approval](../../system-model/domains/lending/domain.md#approval "original approval")'), titled);
  assert.ok(titled.includes("[software brief](../../../software-brief.md 'the brief')"));
  assert.ok(titled.includes('[repayment](../../system-model/domains/lending/responsibilities/sr-002-repayment.md#purpose "repayment rule")'));
  assert.ok(!titled.includes("](#approval"));
  const titledChecked = run("validate-software-design-structure.mjs", "--root", root);
  assert.equal(titledChecked.status, 0, titledChecked.stderr);
  for (const [evidence, reference] of [["See [Approval](#approved-by-the-user \"original approval\").", "#approved-by-the-user"], ["See [the note](./missing.md 'missing')." , "./missing.md"]]) {
    fs.writeFileSync(domain, withSection(evidence));
    const titledBroken = run("validate-software-design-structure.mjs", "--root", root);
    assert.equal(titledBroken.status, 1);
    assert.ok(titledBroken.stderr.includes(`system-model/domains/lending/domain.md: attribution reference does not resolve: ${reference}`), titledBroken.stderr);
  }
});
