#!/usr/bin/env node

import assert from "node:assert/strict";
import test from "node:test";
import {
  auditProjectViewContract,
  branchName,
  decisionIdentityMarker,
  issueIdentityMarker,
  normalizeBuildUnitRecords,
  normalizeDecisionRecords,
  normalizeRepositoryRecords,
  normalizeTicketDocuments,
  parseProcessedThroughMarker,
  PROJECT_KIND_OPTIONS,
  kindDisplayName,
  kindLabelMigration,
  PROJECT_ANSWERING_OPTIONS,
  PROJECT_COMPLEXITY_OPTIONS,
  PROJECT_MANUAL_UI_CHECKS,
  PROJECT_REPOSITORIES_FIELD,
  PROJECT_REPOSITORY_TICKET_LAYER_OPTIONS,
  PROJECT_STATUS_OPTIONS,
  PROJECT_BOARD_STATUS_OPTIONS,
  PROJECT_BOARD_STATUS_COLORS,
  PROJECT_VIEW_CONTRACT,
  processedThroughMarker,
  renderSummary,
  repositoryTicketProjection,
  selectPendingComments,
  validateConfig,
  validatePendingPrefix,
} from "../../scripts/lib/ticket-projection/core.mjs";

const repository = "/tmp/consumer";

function matchingProjectSnapshot() {
  return {
    fields: { nodes: [
      { name: "Work area", dataType: "TEXT" },
      { name: "Waiting on", dataType: "TEXT" },
      { name: "Answering group", dataType: "SINGLE_SELECT", options: ["Ready", "Waiting for answers", "Needs attention"].map((name) => ({ name })) },
      { name: "Board status", dataType: "SINGLE_SELECT", options: PROJECT_BOARD_STATUS_OPTIONS.map((name) => ({ name, color: PROJECT_BOARD_STATUS_COLORS[name] })) },
      { name: "Status", dataType: "SINGLE_SELECT", options: PROJECT_STATUS_OPTIONS.map((name) => ({ name })) },
      { name: "Complexity", dataType: "SINGLE_SELECT", options: PROJECT_COMPLEXITY_OPTIONS.map((name) => ({ name })) },
      { name: "Kind", dataType: "SINGLE_SELECT", options: PROJECT_KIND_OPTIONS.map((name) => ({ name })) },
      { name: PROJECT_REPOSITORIES_FIELD, dataType: "MULTI_SELECT", options: [] },
      { name: "Repository Ticket Layer", dataType: "SINGLE_SELECT", options: PROJECT_REPOSITORY_TICKET_LAYER_OPTIONS.map((name) => ({ name })) },
      { name: "Domain" },
      { name: "Responsibility" },
      { name: "Category" },
      { name: "Build Units" },
      { name: "Repository Build Units" },
      { name: "Parent Decision" },
      { name: "Decision Status" },
      { name: "Decision Tickets" },
      { name: "Resume When" },
    ] },
    views: { nodes: PROJECT_VIEW_CONTRACT.map((view) => ({
      name: view.name,
      layout: view.layout,
      filter: view.filter,
      groupByFields: { nodes: view.groupBy.map((name) => ({ name })) },
      verticalGroupByFields: { nodes: view.verticalGroupBy.map((name) => ({ name })) },
      sortByFields: { nodes: view.sortBy.map(({ field, direction }) => ({ field: { name: field }, direction })) },
      configuration: { visibleFields: { nodes: view.visibleFields.map((name) => ({ name })) } },
    })) },
  };
}

test("Project presentation contract preserves the approved visible order and reports configuration drift", () => {
  assert.deepEqual(PROJECT_VIEW_CONTRACT.map((view) => view.name), [
    "Tickets", "Software", "Product & Operations", "All Tickets", "Decision Areas", "Out-of-Scope", "Repositories",
  ]);
  assert.deepEqual(PROJECT_STATUS_OPTIONS, ["todo", "deferred", "decided", "finished", "out-of-scope"]);
  assert.equal(PROJECT_REPOSITORIES_FIELD, "Repositories");
  assert.deepEqual(PROJECT_REPOSITORY_TICKET_LAYER_OPTIONS, ["Repository-wide tickets", "Owned Build Unit tickets"]);
  assert.equal(PROJECT_VIEW_CONTRACT.find((view) => view.name === "Tickets").filter, "status:todo,deferred -label:\"Technical Decision\"");
  assert.equal(PROJECT_VIEW_CONTRACT.find((view) => view.name === "Decision Areas").filter, "label:\"Technical Decision\"");
  assert.equal(PROJECT_VIEW_CONTRACT.find((view) => view.name === "All Tickets").filter, "status:todo,deferred,decided,finished,out-of-scope -label:\"Technical Decision\"");
  const tickets = PROJECT_VIEW_CONTRACT[0];
  assert.deepEqual(tickets.groupBy, ["Work area"]);
  assert.deepEqual(tickets.verticalGroupBy, ["Answering group"]);
  assert.deepEqual(tickets.visibleFields, ["Title", "Status", "Domain", "Waiting on"]);
  assert.deepEqual(PROJECT_MANUAL_UI_CHECKS.map((check) => check.id), ["visible-tab-order", "tickets-answering-board", "kind-status-boards", "repositories-repo-slice", "out-of-scope-view", "all-tickets-decision-separation"]);
  const clean = auditProjectViewContract(matchingProjectSnapshot());
  assert.deepEqual(clean.drifts, []);
  assert.equal(clean.visibleOrderVerification, "manual-ui-required");
  assert.deepEqual(clean.manualUiChecks.map((check) => [check.id, check.status]), [
    ["visible-tab-order", "required-ui-verification"],
    ["tickets-answering-board", "required-ui-verification"],
    ["kind-status-boards", "required-ui-verification"],
    ["repositories-repo-slice", "required-ui-verification"],
    ["out-of-scope-view", "required-ui-verification"],
    ["all-tickets-decision-separation", "required-ui-verification"],
  ]);
  assert.match(clean.completionRule, /setup is incomplete/);

  const hiddenOutOfScope = matchingProjectSnapshot();
  hiddenOutOfScope.views.nodes.find((view) => view.name === "Tickets").filter = "";
  assert.ok(auditProjectViewContract(hiddenOutOfScope).drifts.some((drift) => (
    drift.scope === "view" && drift.name === "Tickets" && drift.property === "filter"
  )));

  const broken = matchingProjectSnapshot();
  broken.fields.nodes.find((field) => field.name === "Status").options = ["todo", "decided", "finished", "deferred", "out-of-scope"].map((name) => ({ name }));
  broken.views.nodes = [{
    name: "View 1",
    layout: "TABLE_LAYOUT",
    filter: null,
    groupByFields: { nodes: [] },
    verticalGroupByFields: { nodes: [] },
    sortByFields: { nodes: [] },
    configuration: { visibleFields: { nodes: [{ name: "Title" }, { name: "Assignees" }] } },
  }];
  const properties = auditProjectViewContract(broken).drifts.map((drift) => `${drift.scope}:${drift.name}:${drift.property}`);
  assert.ok(properties.includes("field:Status:options"));
  assert.ok(properties.includes("view:Tickets:count"));
  assert.deepEqual(auditProjectViewContract(broken).additionalViews, [{ name: "View 1", id: undefined, number: undefined }]);
});

test("Repositories preserves membership, sections and canonical status columns", () => {
  const repositories = PROJECT_VIEW_CONTRACT.find((view) => view.name === "Repositories");
  assert.equal(repositories.filter, "has:repositories status:todo,deferred,decided,finished -label:\"Technical Decision\"");
  assert.equal(repositories.filter.includes("-no:repositories"), false);
  assert.equal(repositories.filter.includes("out-of-scope"), false);
  assert.equal(repositories.layout, "BOARD_LAYOUT");
  assert.equal(repositories.sliceBy, "Repositories");
  assert.deepEqual(repositories.groupBy, ["Repository Ticket Layer"]);
  assert.deepEqual(repositories.verticalGroupBy, ["Status"]);
  assert.deepEqual(repositories.visibleFields, ["Title", "Build Units", "Repository Build Units"]);
  const outOfScope = PROJECT_VIEW_CONTRACT.find((view) => view.name === "Out-of-Scope");
  assert.equal(outOfScope.filter, "label:\"Out-of-Scope\"");
  assert.equal(outOfScope.sliceBy, null);
  assert.equal(PROJECT_VIEW_CONTRACT.some((view) => view.name === "Product"), false);
  assert.equal(PROJECT_VIEW_CONTRACT.some((view) => view.name === "Operational"), false);

});

test("Project presentation audit requires compact shared Status option headings", () => {
  const snapshot = matchingProjectSnapshot();
  snapshot.fields.nodes.find((field) => field.name === "Status").options = PROJECT_STATUS_OPTIONS.map((name, index) => ({
    name,
    description: index === 0 ? "Identified implementation decision awaiting discussion." : "",
  }));
  assert.deepEqual(
    auditProjectViewContract(snapshot).drifts.filter((drift) => drift.property === "optionDescriptions"),
    [{
      scope: "field",
      name: "Status",
      property: "optionDescriptions",
      expected: ["", "", "", "", ""],
      actual: ["Identified implementation decision awaiting discussion.", "", "", "", ""],
    }],
  );
});

test("repository projection deduplicates multiple Build Units owned by the same repository", () => {
  const repositories = [
    { id: "REPO-001", memberBuildUnits: ["BU-001", "BU-002", "BU-003"] },
    { id: "REPO-002", memberBuildUnits: ["BU-004"] },
  ];
  assert.deepEqual(repositoryTicketProjection({ repositories: [], buildUnits: ["BU-001", "BU-002"] }, repositories), {
    repositoryIds: ["REPO-001"],
    layer: "Owned Build Unit tickets",
  });
  assert.deepEqual(repositoryTicketProjection({ repositories: ["REPO-001"], buildUnits: ["BU-001", "BU-002"] }, repositories), {
    repositoryIds: ["REPO-001"],
    layer: "Repository-wide tickets",
  });
  assert.deepEqual(repositoryTicketProjection({ repositories: [], buildUnits: ["BU-001", "BU-004"] }, repositories), {
    repositoryIds: ["REPO-001", "REPO-002"],
    layer: "Owned Build Unit tickets",
  });
});

test("Repositories slice accepts only canonical repository options and rejects BU sidebar values", () => {
  const repositoryOption = "REPO-001 — Application Workspace";
  const clean = matchingProjectSnapshot();
  clean.fields.nodes.find((field) => field.name === PROJECT_REPOSITORIES_FIELD).options = [{ name: repositoryOption }];
  assert.deepEqual(auditProjectViewContract(clean, [repositoryOption]).drifts, []);

  const polluted = matchingProjectSnapshot();
  polluted.fields.nodes.find((field) => field.name === PROJECT_REPOSITORIES_FIELD).options = [
    { name: repositoryOption },
    { name: "BU-001 — Shared Library" },
  ];
  assert.ok(auditProjectViewContract(polluted, [repositoryOption]).drifts.some((drift) => (
    drift.scope === "field"
      && drift.name === PROJECT_REPOSITORIES_FIELD
      && drift.property === "options"
  )));
});

test("projection config is exact and its ticket root stays inside the consumer repository", () => {
  const config = validateConfig({
    provider: "github", syncBranch: "main",
    ticketRoot: "design/software-design",
    repository: "owner/repository",
    project: "owner/12",
  }, repository);
  assert.equal(config.ticketRoot, "design/software-design");
  for (const alias of ["design/software-design//", "design/software-design/.", "design/software-design/./", "././design/software-design"]) {
    assert.equal(validateConfig({ ...config, ticketRoot: alias }, repository).ticketRoot, "design/software-design");
  }
  assert.throws(() => validateConfig({ ...config, ticketRoot: "." }, repository), /ticketRoot/);
  assert.throws(() => validateConfig({ ...config, ticketRoot: "../software-design" }, repository), /ticketRoot/);
  assert.throws(() => validateConfig({ ...config, extra: true }, repository), /Unknown config key/);
  assert.throws(() => validateConfig({ ...config, provider: "jira" }, repository), /Unsupported provider/);
});

test("normalization projects every canonical ticket status", () => {
  const responsibilities = new Map([
    ["SR-001", {
      name: "Request Validation And Routing",
      domain: "request-handling",
      domainName: "Request Handling",
    }],
  ]);
  const domains = new Map([
    ["request-handling", { name: "Request Handling" }],
  ]);
  const records = normalizeTicketDocuments([
    {
      filePath: "/tmp/consumer/design/software-design/build/workflow/tickets/a/sr-001/sr-001-tickets.yaml",
      tickets: [
        { id: "TICKET-0001", title: "Todo", status: "todo", kind: "technical", complexity: "medium", owner: "SR-001", concern: "testing", question: "Q", context: "C", current_shape: { type: "tree", title: "Current build scope", source_refs: ["design/software-design/build/units/bu-001.md"], lines: ["REPO-001 — Workspace", "└── BU-001 — Library"] }, options: ["A", "B"], recommendation: "Prefer A.", depends_on: ["TICKET-0003"], blocked_by: ["Confirm format"], resolution: null, result_refs: ["SEL-001", "VA-001"], build_units: ["BU-001", "BU-002"], build_unit_disposition: null },
        { id: "TICKET-0002", title: "Decided", status: "decided", kind: "product", complexity: "medium", owner: "SR-001", concern: "testing", question: "Q", context: "C", options: [], recommendation: "R", dependencies: [], resolution: "R" },
        { id: "TICKET-0003", title: "Finished", status: "finished", kind: "operational", complexity: "medium", owner: "SR-001", concern: "testing", question: "Q", context: "C", options: [], recommendation: "R", dependencies: [], resolution: "R" },
        { id: "TICKET-0004", title: "Deferred", status: "deferred", kind: "technical", complexity: "medium", owner: "SR-001", concern: "testing", question: "Q", context: "The provider choice is required for V1 but the review is temporarily postponed.", options: [], recommendation: "Review the primary candidates.", dependencies: [], resolution: null, resume_when: "When the provider review resumes." },
        { id: "TICKET-0007", title: "Out of scope", status: "out-of-scope", kind: "technical", complexity: "medium", owner: "SR-001", concern: "testing", question: "Q", context: "Automatic recovery is explicitly excluded from V1.", options: [], recommendation: "Reassess after V1.", dependencies: [], resolution: null, resume_when: "Before adding automatic recovery." },
      ],
    },
  ], repository, responsibilities, domains);
  assert.deepEqual(records.map((record) => record.id), ["TICKET-0001", "TICKET-0002", "TICKET-0003", "TICKET-0004", "TICKET-0007"]);
  assert.deepEqual(records.map((record) => record.kind), ["technical", "product", "operational", "technical", "technical"]);
  assert.deepEqual(records.map((record) => record.responsibilityLabel), [
    "SR-001 — Request Validation And Routing",
    "SR-001 — Request Validation And Routing",
    "SR-001 — Request Validation And Routing",
    "SR-001 — Request Validation And Routing",
    "SR-001 — Request Validation And Routing",
  ]);
  assert.deepEqual(records.map((record) => record.domainLabel), [
    "Request Handling",
    "Request Handling",
    "Request Handling",
    "Request Handling",
    "Request Handling",
  ]);
  assert.deepEqual(records[0].blockedBy, ["Confirm format"]);
  assert.deepEqual(records[0].dependencies, ["TICKET-0003"]);
  assert.equal(records[0].sourcePath, "design/software-design/build/workflow/tickets/a/sr-001/sr-001-tickets.yaml");
  assert.match(records[0].body, /<!-- software-design-ticket TICKET-0001 -->/);
  assert.match(records[0].body, /^<!-- software-design-ticket TICKET-0001 -->\n\n## Q\n\nC\n\n## Current shape/m);
  const fence = String.fromCharCode(96).repeat(3);
  assert.equal(records[0].body.indexOf("## Current shape") > records[0].body.indexOf("## Q"), true);
  assert.ok(records[0].body.includes(fence + "text\nREPO-001 — Workspace\n└── BU-001 — Library\n" + fence));
  assert.match(records[0].body, /Current-shape sources: .*bu-001\.md/);
  assert.match(records[0].body, /## Options\n\*\*A\.\*\* A\n\n\*\*B\.\*\* B/);
  assert.match(records[0].body, /## Recommendation\nPrefer A\./);
  assert.match(records[0].body, /- Durable outcomes: SEL-001, VA-001/);
  assert.match(records[0].body, /- Build units: BU-001, BU-002/);
  assert.match(records[0].body, /## Before answering\n- Finished — finished/);
  assert.match(records[1].body, /## Approved decision\n\nR/);
  assert.match(records[2].body, /## Approved final outcome\n\nR/);
  assert.match(records[3].body, /## Decision still needed\nQ/);
  assert.match(records[3].body, /## Why this is deferred\n\nThe provider choice is required for V1 but the review is temporarily postponed\./);
  assert.match(records[3].body, /still required for the target version/);
  assert.match(records[4].body, /## Why this is out of scope\n\nAutomatic recovery is explicitly excluded from V1\./);
  assert.match(records[4].body, /## Reopen when\nBefore adding automatic recovery\./);
  assert.doesNotMatch(records.map((record) => record.body).join("\n"), /## Canonical state|- Status:|- Kind:|Resolution: None/);
});

test("Build Unit normalization creates one canonical native-label record", () => {
  const records = normalizeBuildUnitRecords(new Map([["BU-001", {
    id: "BU-001",
    name: "Shared Library",
  }]]));
  assert.deepEqual(records, [{ id: "BU-001", name: "Shared Library", label: "BU-001 — Shared Library" }]);
});

test("Repository normalization creates explicit repository metadata records", () => {
  const buildUnits = new Map([["BU-001", {
    id: "BU-001",
    name: "Shared Library",
    label: "BU-001 — Shared Library",
  }]]);
  const records = normalizeRepositoryRecords(new Map([["REPO-001", {
    id: "REPO-001",
    name: "Application Workspace",
    memberBuildUnits: ["BU-001"],
    filePath: "/tmp/consumer/build/repositories/repo-001-application-workspace/README.md",
  }]]), buildUnits, "/tmp/consumer");
  assert.equal(records[0].id, "REPO-001");
  assert.equal(records[0].label, "REPO-001 — Application Workspace");
  assert.deepEqual(records[0].memberBuildUnits, ["BU-001"]);
  assert.deepEqual(records[0].memberBuildUnitLabels, ["BU-001 — Shared Library"]);
  assert.equal(Object.hasOwn(records[0], "body"), false);
  assert.equal(Object.hasOwn(records[0], "issueTitle"), false);
});

test("decision normalization projects every TD and derives its readable child table", () => {
  const ticketRecords = [{
    id: "TICKET-0001",
    title: "Select evidence model",
    status: "out-of-scope",
    question: "Which evidence model preserves compatibility?",
    parentDecision: "TD-001",
    domainLabel: "Fallback",
  }, {
    id: "TICKET-0002",
    title: "Standalone recovery",
    status: "out-of-scope",
    question: "Which recovery model should be added later?",
    parentDecision: null,
    domainLabel: "Recovery",
  }];
  const decisions = normalizeDecisionRecords(new Map([["TD-001", {
    id: "TD-001",
    title: "Fallback release",
    state: "Deferred For Later Design",
    primaryDomain: "fallback",
    affectedResponsibilities: ["SR-001"],
    context: "Fallback release remains intentionally outside V1.",
    whyItMatters: "The evidence choices must remain interoperable.",
    established: "The authority boundary is already fixed.",
    howTicketsFit: "The tickets jointly define one fallback contract.",
    currentShape: { type: "logic", title: "Current release gate", source_refs: ["system-model/contracts/invariants/inv-001.md"], lines: ["flowchart TD", "A[Verified fact] --> B[Release]"] },
    blocker: null,
    outcome: null,
    deferReason: "Outside V1.",
    resumeWhen: "Before enabling fallback.",
    filePath: "/tmp/software-design/build/workflow/technical-decisions.yaml",
  }]]), ticketRecords, "/tmp/software-design", new Map([["fallback", { name: "Fallback" }]]), new Map([["SR-001", { name: "Fallback Authority" }]]));

  assert.deepEqual(decisions.map((decision) => decision.id), ["TD-001"]);
  const decision = decisions[0];
  assert.equal(decision.decisionTickets, "1 total · 1 out-of-scope");
  assert.match(decision.body, /^<!-- software-design-decision TD-001 -->/);
  assert.match(decision.body, /## Why this matters/);
  assert.equal(decision.body.indexOf("## Current shape") < decision.body.indexOf("## Why this matters"), true);
  assert.ok(decision.body.includes(String.fromCharCode(96).repeat(3) + "mermaid\nflowchart TD\nA[Verified fact] --> B[Release]"));
  assert.match(decision.body, /Current-shape sources: .*inv-001\.md/);
  assert.match(decision.body, /## How the tickets fit together/);
  assert.match(decision.body, /TICKET-0001 — Select evidence model \| out-of-scope/);
  assert.doesNotMatch(decision.body, /TICKET-0002/);
  assert.match(decision.body, /Why deferred: Outside V1\./);
});

test("decision normalization summarizes child-ticket progress without repeating ticket identities", () => {
  const ticketRecords = [
    { id: "TICKET-0001", title: "First", status: "finished", question: "Q1", parentDecision: "TD-001", domainLabel: "Fallback" },
    { id: "TICKET-0002", title: "Second", status: "todo", question: "Q2", parentDecision: "TD-001", domainLabel: "Fallback" },
    { id: "TICKET-0003", title: "Third", status: "todo", question: "Q3", parentDecision: "TD-001", domainLabel: "Fallback" },
    { id: "TICKET-0004", title: "Fourth", status: "out-of-scope", question: "Q4", parentDecision: "TD-001", domainLabel: "Fallback" },
  ];
  const decisions = normalizeDecisionRecords(new Map([["TD-001", {
    id: "TD-001",
    title: "Fallback release",
    state: "Open",
    primaryDomain: "fallback",
    affectedResponsibilities: ["SR-001"],
    context: "Context.",
    whyItMatters: "Why.",
    established: "Established.",
    howTicketsFit: "Fit.",
    blocker: null,
    outcome: null,
    deferReason: null,
    resumeWhen: null,
    filePath: "/tmp/software-design/build/workflow/technical-decisions.yaml",
  }]]), ticketRecords, "/tmp/software-design", new Map([["fallback", { name: "Fallback" }]]), new Map([["SR-001", { name: "Fallback Authority" }]]));

  assert.equal(decisions[0].decisionTickets, "4 total · 2 todo · 1 finished · 1 out-of-scope");
  assert.doesNotMatch(decisions[0].decisionTickets, /TICKET-/);
});

test("blocked decision rendering names the canonical unavailable prerequisite", () => {
  const decisions = normalizeDecisionRecords(new Map([["TD-002", {
    id: "TD-002",
    title: "External signer availability",
    state: "Blocked",
    primaryDomain: "authorization",
    affectedResponsibilities: ["SR-002"],
    context: "The signer boundary is fixed, but the required provider contract is unavailable.",
    whyItMatters: "Signing cannot be implemented safely without that contract.",
    established: "The application never owns signing authority.",
    howTicketsFit: "The child questions must preserve the same signer boundary.",
    blocker: "The external signer provider has not supplied its authenticated request contract.",
    outcome: null,
    deferReason: null,
    resumeWhen: null,
    filePath: "/tmp/software-design/build/workflow/technical-decisions.yaml",
  }]]), [], "/tmp/software-design", new Map([["authorization", { name: "Authorization" }]]), new Map([["SR-002", { name: "Signing Authority" }]]));

  assert.match(decisions[0].body, /Current blocker: The external signer provider has not supplied its authenticated request contract\./);
  assert.doesNotMatch(decisions[0].body, /prerequisite described in the canonical context/);
});

test("normalization routes domain-shared and cross-domain tickets without inventing responsibility ownership", () => {
  const domains = new Map([
    ["access-control-and-recovery", { name: "Access Control And Recovery" }],
  ]);
  const records = normalizeTicketDocuments([
    {
      filePath: "/tmp/consumer/design/software-design/build/workflow/tickets/access-control-and-recovery/domain-shared-tickets.yaml",
      scope: "domain:access-control-and-recovery",
      tickets: [
        { id: "TICKET-0100", title: "Area shared", status: "todo", kind: "technical", complexity: "medium", owner: "shared", concern: "testing", question: "Q", context: "C", options: ["A"], recommendation: "A", dependencies: [], resolution: null },
      ],
    },
    {
      filePath: "/tmp/consumer/design/software-design/build/workflow/tickets/cross-domain-tickets.yaml",
      scope: "cross-domain",
      tickets: [
        { id: "TICKET-0101", title: "Cross area", status: "deferred", kind: "product", complexity: "medium", owner: "shared", concern: "state-lifecycle", question: "Q", context: "C", options: [], recommendation: "R", dependencies: [], resolution: null, resume_when: "Before release." },
      ],
    },
  ], repository, new Map(), domains);
  assert.deepEqual(records.map((record) => [record.domainLabel, record.responsibilityLabel]), [
    ["Access Control And Recovery", "Shared"],
    ["Cross-domain", "Shared"],
  ]);
});

test("identity and processed-through markers are stable and constrained", () => {
  assert.equal(issueIdentityMarker("TICKET-0123"), "<!-- software-design-ticket TICKET-0123 -->");
  assert.equal(decisionIdentityMarker("TD-012"), "<!-- software-design-decision TD-012 -->");
  const marker = processedThroughMarker("TICKET-0123", "https://github.com/owner/repository/issues/4#issuecomment-92");
  assert.equal(marker, "<!-- software-design-processed-through {\"ticket\":\"TICKET-0123\",\"comment_url\":\"https://github.com/owner/repository/issues/4#issuecomment-92\"} -->");
  assert.deepEqual(parseProcessedThroughMarker(marker), {
    ticket: "TICKET-0123",
    commentUrl: "https://github.com/owner/repository/issues/4#issuecomment-92",
  });
  assert.equal(parseProcessedThroughMarker("<!-- software-design-processed-through {\"comment_url\":null,\"ticket\":\"TICKET-0123\"} -->"), null);
});

test("pending selection accepts only same-issue adapter summaries and keeps teammate marker-shaped comments", () => {
  const issue = { number: 4, url: "https://github.com/owner/repository/issues/4" };
  const comments = [
    { id: 10, url: "https://github.com/owner/repository/issues/4#issuecomment-10", body: "first", author: { login: "teammate" } },
    { id: 11, url: "https://github.com/owner/repository/issues/4#issuecomment-11", body: `${processedThroughMarker("TICKET-0123", "https://github.com/owner/repository/issues/4#issuecomment-10")}`, author: { login: "bot" } },
    { id: 12, url: "https://github.com/owner/repository/issues/4#issuecomment-12", body: `${processedThroughMarker("TICKET-0123", null)}`, author: { login: "teammate" } },
    { id: 13, url: "https://github.com/owner/repository/issues/4#issuecomment-13", body: "new input", author: { login: "teammate" } },
  ];
  const result = selectPendingComments({ ticketId: "TICKET-0123", issue, comments, authenticatedLogin: "bot" });
  assert.equal(result.processedThroughCommentUrl, comments[0].url);
  assert.deepEqual(result.pending.map((comment) => comment.id), [12, 13]);
});

test("a later null-cursor marker cannot reopen comments before the last real cursor", () => {
  const issue = { url: "https://github.com/owner/repository/issues/3" };
  const comments = [
    { id: 10, url: `${issue.url}#issuecomment-10`, body: "old", author: { login: "teammate" } },
    { id: 11, url: `${issue.url}#issuecomment-11`, body: processedThroughMarker("TICKET-0123", `${issue.url}#issuecomment-10`), author: { login: "bot" } },
    { id: 12, url: `${issue.url}#issuecomment-12`, body: "new", author: { login: "teammate" } },
    { id: 13, url: `${issue.url}#issuecomment-13`, body: processedThroughMarker("TICKET-0123", null), author: { login: "bot" } },
  ];

  const result = selectPendingComments({ ticketId: "TICKET-0123", issue, comments, authenticatedLogin: "bot" });
  assert.equal(result.processedThroughCommentUrl, `${issue.url}#issuecomment-10`);
  assert.deepEqual(result.pending.map((comment) => comment.id), [12]);
});

test("cursor advancement must cover a contiguous issue-local pending prefix", () => {
  const pending = [
    { url: "https://github.com/o/r/issues/1#issuecomment-1" },
    { url: "https://github.com/o/r/issues/1#issuecomment-2" },
    { url: "https://github.com/o/r/issues/1#issuecomment-3" },
  ];
  assert.doesNotThrow(() => validatePendingPrefix({
    pending,
    processedThroughCommentUrl: pending[1].url,
    sourceCommentUrls: [pending[0].url, pending[1].url],
  }));
  assert.throws(() => validatePendingPrefix({
    pending,
    processedThroughCommentUrl: pending[1].url,
    sourceCommentUrls: [pending[1].url],
  }), /contiguous prefix/);
  assert.throws(() => validatePendingPrefix({
    pending,
    processedThroughCommentUrl: null,
    sourceCommentUrls: [pending[0].url],
  }), /pending issue-local/);
  assert.throws(() => validatePendingPrefix({
    pending,
    processedThroughCommentUrl: pending[0].url,
    sourceCommentUrls: [pending[0].url, pending[1].url],
  }), /pending issue-local/);
  assert.doesNotThrow(() => validatePendingPrefix({
    pending,
    processedThroughCommentUrl: null,
    sourceCommentUrls: ["https://github.com/o/r/issues/2#issuecomment-9"],
  }));
});

test("summaries are deterministic and changed outcomes require a verified PR", () => {
  const result = {
    ticketId: "TICKET-0123",
    sourceCommentUrls: ["https://github.com/o/r/issues/1#issuecomment-1"],
    processedThroughCommentUrl: "https://github.com/o/r/issues/1#issuecomment-1",
    understoodInput: "Clarified the retry boundary.",
    outcome: "changed",
    reason: "The canonical design now names the retry owner.",
    canonicalFiles: ["design/software-design/flows/retry.md"],
    draftPrUrl: "https://github.com/o/r/pull/9",
    clarificationQuestion: null,
  };
  assert.match(renderSummary(result), /Outcome: changed/);
  assert.match(renderSummary(result), /software-design-processed-through/);
  assert.throws(() => renderSummary({ ...result, draftPrUrl: null }), /verified draft PR/);
  assert.throws(() => renderSummary({ ...result, outcome: "no-change", draftPrUrl: result.draftPrUrl }), /must not include a draft PR/);
});

test("generated branch names are readable UTC names with collision suffixes", () => {
  const first = branchName(new Date("2026-07-30T11:12:13.000Z"), new Set());
  assert.equal(first, "td/github-comments-2026-07-30T11-12-13Z");
  assert.equal(branchName(new Date("2026-07-30T11:12:13.000Z"), new Set([first])), `${first}-2`);
});

for (const [viewName, property, badValues] of [
  ["Tickets", "sortByFields", [[], [{ field: { name: "Title" }, direction: "DESC" }]]],
  ["Tickets", "groupByFields", [[], [{ name: "Kind" }]]],
  ["Repositories", "groupByFields", [[], [{ name: "Status" }]]],
  ["Decision Areas", "sortByFields", [[], [{ field: { name: "Status" }, direction: "ASC" }]]],
  ["Decision Areas", "groupByFields", [[], [{ name: "Status" }]]],
]) {
  test(`missing or wrong ${viewName} ${property} fails the API audit`, () => {
    for (const nodes of badValues) {
      const snapshot = matchingProjectSnapshot();
      snapshot.views.nodes.find((view) => view.name === viewName)[property] = { nodes };
      const result = auditProjectViewContract(snapshot);
      assert.equal(result.apiPassed, false);
      assert.ok(result.drifts.some((drift) => drift.name === viewName));
    }
  });
}

test("API order is diagnostic only and the current saved Decision Areas name is required", () => {
  const snapshot = matchingProjectSnapshot();
  assert.equal(auditProjectViewContract(snapshot).apiPassed, true);
  snapshot.views.nodes.reverse();
  const reordered = auditProjectViewContract(snapshot);
  assert.equal(reordered.apiPassed, true);
  assert.equal(reordered.apiViewOrderAuthoritative, false);
  assert.equal(reordered.visibleOrderVerification, "manual-ui-required");
  snapshot.views.nodes.reverse();
  snapshot.views.nodes.find((view) => view.name === "Decision Areas").name = "Technical Decisions";
  assert.equal(auditProjectViewContract(snapshot).apiPassed, false);
});


test("Software is presentation only and legacy Kind migration advice preserves option identities", () => {
  assert.deepEqual(PROJECT_KIND_OPTIONS, ["Software", "product", "operational"]);
  assert.equal(kindDisplayName("technical"), "Software");
  assert.equal(kindDisplayName("product"), "product");
  assert.equal(kindDisplayName("operational"), "operational");
  assert.throws(() => kindDisplayName("Software"), /Invalid canonical/);
  assert.throws(() => kindDisplayName("software"), /Invalid canonical/);
  const field = { id: "F_KIND", name: "Kind", dataType: "SINGLE_SELECT", options: [
    { id: "O_TECHNICAL", name: "technical", color: "BLUE", description: "Kept" },
    { id: "O_PRODUCT", name: "product", color: "GREEN", description: "" },
    { id: "O_OPERATIONAL", name: "operational", color: "GRAY", description: "" },
  ] };
  const before = structuredClone(field);
  const plan = kindLabelMigration([field]);
  assert.equal(plan.fieldId, field.id);
  assert.equal(plan.optionId, "O_TECHNICAL");
  assert.equal(plan.from, "technical");
  assert.equal(plan.to, "Software");
  assert.deepEqual(plan.preserveOptionIds, field.options.map(({ id }) => id));
  assert.deepEqual(field, before, "audit never mutates the supplied schema");
  const audit = auditProjectViewContract({ fields: [field] });
  assert.deepEqual(audit.requiredKindLabelMigration, plan);
  assert.ok(audit.drifts.some(({ name, property }) => name === "Kind" && property === "options"));
  for (const invalid of [
    [field, structuredClone(field)],
    [{ ...field, id: null }],
    [{ ...field, dataType: "TEXT" }],
    [{ ...field, options: [...field.options].reverse() }],
    [{ ...field, options: field.options.map((o) => ({ ...o, id: "same" })) }],
    [{ ...field, options: field.options.map((o, i) => ({ ...o, name: i === 0 ? "unrecognized" : o.name })) }],
  ]) assert.equal(kindLabelMigration(invalid), null, "never guess an ambiguous or unknown identity");
  field.options[0].name = "Software"; // Simulate an explicitly reviewed external rename.
  assert.equal(kindLabelMigration([field]), null);
  assert.equal(auditProjectViewContract({ fields: [field] }).drifts.some(({ name }) => name === "Kind"), false);
});
