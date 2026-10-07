#!/usr/bin/env node

import assert from "node:assert/strict";
import test from "node:test";
import { createGitHubAdapter } from "../../scripts/lib/ticket-projection/github/adapter.mjs";
import { deriveTicketBoard } from "../../scripts/lib/ticket-projection/ticket-board.mjs";
import { renderSummary, renderIssueBody, kindDisplayName, PROJECT_BOARD_STATUS_OPTIONS } from "../../scripts/lib/ticket-projection/core.mjs";

const config = {
  provider: "github", syncBranch: "main",
  ticketRoot: "design/software-design",
  repository: "owner/repository",
  project: "owner/7",
};
const record = {
  id: "TICKET-0001",
  issueTitle: "TICKET-0001 — Select retry policy",
  body: "<!-- software-design-ticket TICKET-0001 -->\nbody",
  status: "todo",
  kind: "technical", complexity: "medium",
  owner: "SR-001",
  domainLabel: "Request Handling",
  responsibilityLabel: "SR-001 — Request Validation And Routing",
  concern: "failure-recovery",
  buildUnits: ["BU-002", "BU-001"],
  buildUnitDisposition: null,
  repositories: [],
  parentDecision: null,
  parentDecisionTitle: null,
};
const decision = {
  id: "TD-001",
  issueTitle: "TD-001 — Fallback release",
  decisionStatus: "Deferred For Later Design",
  domainLabel: "Fallback",
  responsibilityLabel: "SR-001 — Fallback Authority",
  decisionTickets: "1 total · 1 out-of-scope",
  context: "Fallback release remains intentionally outside V1.",
  whyItMatters: "The child choices must remain interoperable.",
  established: "The authority boundary is fixed.",
  howTicketsFit: "The child questions jointly define one fallback contract.",
  outcome: null,
  deferReason: "Fallback release is outside V1.",
  resumeWhen: "Before enabling fallback.",
  sourcePath: "design/software-design/build/workflow/technical-decisions.yaml",
  childTickets: [{
    id: "TICKET-0001",
    title: "Select retry policy",
    status: "out-of-scope",
    question: "Which retry policy preserves the fallback boundary?",
  }],
};
const buildUnitRecord = {
  id: "BU-001",
  name: "Shared Library",
  label: "BU-001 — Shared Library",
};
const secondBuildUnitRecord = { id: "BU-002", name: "Web Application", label: "BU-002 — Web Application" };
const buildUnits = [buildUnitRecord, secondBuildUnitRecord];
const workflowLabel = { name: "Software Design Workflow", color: "0e8a16", description: "Active non-repository Software Design ticket" };
const repositoryRecord = {
  id: "REPO-001",
  name: "Application Workspace",
  label: "REPO-001 — Application Workspace",
  memberBuildUnits: ["BU-001"],
};
const secondRepositoryRecord = {
  id: "REPO-002",
  name: "Supporting Service",
  label: "REPO-002 — Supporting Service",
  memberBuildUnits: ["BU-004"],
};

function completeProjectFields(repositories = []) {
  return [
    { id: "F_WORK_AREA", name: "Work area", type: "ProjectV2Field" },
    { id: "F_WAITING_ON", name: "Waiting on", type: "ProjectV2Field" },
    { id: "F_ANSWERING_GROUP", name: "Answering group", type: "ProjectV2SingleSelectField", options: ["Ready", "Waiting for answers", "Needs attention"].map((name) => ({ id: `O_${name}`, name })) },
    { id: "F_BOARD_STATUS", name: "Board status", type: "ProjectV2SingleSelectField", options: PROJECT_BOARD_STATUS_OPTIONS.map((name) => ({ id: `O_BOARD_${name}`, name })) },
    { id: "F_STATUS", name: "Status", type: "ProjectV2SingleSelectField", options: [{ id: "O_TODO", name: "todo" }, { id: "O_DEFERRED", name: "deferred" }, { id: "O_DECIDED", name: "decided" }, { id: "O_FINISHED", name: "finished" }, { id: "O_OUT_OF_SCOPE", name: "out-of-scope" }] },
    { id: "F_COMPLEXITY", name: "Complexity", type: "ProjectV2SingleSelectField", options: ["low", "medium", "high"].map((name) => ({ id: `O_${name.toUpperCase()}`, name })) },
    { id: "F_KIND", name: "Kind", type: "ProjectV2SingleSelectField", options: [{ id: "O_TECHNICAL", name: "Software" }, { id: "O_PRODUCT", name: "product" }, { id: "O_OPERATIONAL", name: "operational" }] },
    { id: "F_REPOSITORIES", name: "Repositories", type: "ProjectV2MultiSelectField", options: repositories.map((repository) => ({ id: `O_${repository.id.replace("-", "_")}`, name: repository.label })) },
    { id: "F_REPOSITORY_LAYER", name: "Repository Ticket Layer", type: "ProjectV2SingleSelectField", options: [{ id: "O_REPOSITORY_WIDE", name: "Repository-wide tickets" }, { id: "O_OWNED_BUILD_UNIT", name: "Owned Build Unit tickets" }] },
    { id: "F_AREA", name: "Domain", type: "ProjectV2Field" },
    { id: "F_RESPONSIBILITY", name: "Responsibility", type: "ProjectV2Field" },
    { id: "F_CATEGORY", name: "Category", type: "ProjectV2Field" },
    { id: "F_BUILD_UNITS", name: "Build Units", type: "ProjectV2Field" },
    { id: "F_REPOSITORY_BU", name: "Repository Build Units", type: "ProjectV2Field" },
    { id: "F_PARENT_DECISION", name: "Parent Decision", type: "ProjectV2Field" },
    { id: "F_DECISION_STATUS", name: "Decision Status", type: "ProjectV2Field" },
    { id: "F_DECISION_TICKETS", name: "Decision Tickets", type: "ProjectV2Field" },
    { id: "F_RESUME_WHEN", name: "Resume When", type: "ProjectV2Field" },
  ];
}

function completeDecisionProjectFields(repositories = []) {
  return completeProjectFields(repositories);
}

function runner(routes, calls = []) {
  return async (request) => {
    calls.push(request);
    for (const route of routes) if (route.when(request)) return route.result(request);
    if (request.command === "gh" && request.args[0] === "api" && request.args[1] === "graphql" && request.args.some((arg) => arg.includes("ProjectProjectionFields"))) {
      const cliRequest = { ...request, args: ["project", "field-list"] };
      const fieldRoute = routes.find((route) => route.when(cliRequest));
      if (!fieldRoute) throw new Error("Project projection field query requires a field fixture.");
      const response = await fieldRoute.result(cliRequest);
      const fields = JSON.parse(response.stdout || "{}").fields || [];
      return json({ data: { node: { fields: { nodes: fields, pageInfo: { hasNextPage: false } } } } });
    }
    if (request.command === "gh" && request.args[0] === "api" && request.args[1] === "graphql" && request.args.some((arg) => arg.includes("ProjectProjectionItemMultiSelectValues"))) {
      const cliRequest = { ...request, args: ["project", "item-list"] };
      const itemRoute = routes.find((route) => route.when(cliRequest));
      if (!itemRoute) throw new Error("Project projection item-value query requires an item fixture.");
      const response = await itemRoute.result(cliRequest);
      const items = JSON.parse(response.stdout || "{}").items || [];
      return json({ data: { node: { items: {
        nodes: items.map((item) => {
          const values = item.fieldValues?.nodes || item.fieldValues || [];
          const repositoryValue = values.find((value) => value.field?.name === "Repositories" || value.name === "Repositories");
          const flattened = item.repositories ?? item.Repositories;
          const options = repositoryValue?.options || (Array.isArray(flattened)
            ? flattened.map((name) => ({ name }))
            : typeof flattened === "string" && flattened ? flattened.split(/,\s*/).map((name) => ({ name })) : []);
          return {
            id: item.id,
            fieldValues: { nodes: [{ field: { name: "Repositories" }, options }] },
          };
        }),
        pageInfo: { hasNextPage: false, endCursor: null },
      } } } });
    }
    if (request.command === "gh" && request.args[0] === "api" && request.args[1] === "graphql" && request.args.some((arg) => arg.includes("StatusOptionPresentation"))) {
      return json({ data: { node: { fields: { nodes: [{
        id: "F_STATUS",
        name: "Status",
        options: ["todo", "deferred", "decided", "finished", "out-of-scope"].map((name, index) => ({
          id: `O_STATUS_${index}`,
          name,
          color: "GRAY",
          description: "",
        })),
      }] } } } });
    }
    if (request.command === "git") {
      const command = request.args[0];
      if (command === "check-ref-format" || command === "fetch" || command === "status") return { stdout: "" };
      if (command === "symbolic-ref") return { stdout: "main\n" };
      if (command === "remote") return { stdout: "https://github.com/owner/repository.git\n" };
      if (command === "rev-parse") return { stdout: request.args.includes("--show-toplevel") ? "/tmp/consumer\n" : "a".repeat(40) + "\n" };
    }
    throw new Error(`Unexpected command: ${request.command} ${request.args.join(" ")}`);
  };
}

function json(value) {
  return { stdout: JSON.stringify(value) };
}

function multiSelectEditRoute() {
  return {
    when: ({ command, args }) => command === "gh" && args[0] === "api" && args[1] === "graphql" && args.includes("--input"),
    result: () => json({ data: { updateProjectV2ItemFieldValue: { projectV2Item: { id: "ITEM_1" } } } }),
  };
}

function numberedRecord(index, overrides = {}) {
  const id = `TICKET-${String(index).padStart(4, "0")}`;
  return {
    ...record,
    id,
    issueTitle: `${id} — Synchronization test`,
    body: `<!-- software-design-ticket ${id} -->\nbody`,
    buildUnits: [],
    buildUnitDisposition: "Unmapped",
    ...overrides,
  };
}

function matchingTicketItem(ticket, issueNumber, itemId, status = ticket.status) {
  const nodes = [
    ...Object.entries(deriveTicketBoard([ticket])[0].boardValues).filter(([, value]) => value !== null).map(([name, text]) => ({ field: { name }, text })),
    { field: { name: "Status" }, name: status },
    { field: { name: "Kind" }, name: kindDisplayName(ticket.kind) },
    { field: { name: "Complexity" }, name: ticket.complexity },
    { field: { name: "Domain" }, text: ticket.domainLabel },
    { field: { name: "Responsibility" }, text: ticket.responsibilityLabel || ticket.owner },
    { field: { name: "Category" }, text: ticket.concern },
    { field: { name: "Build Units" }, text: ticket.buildUnits?.length ? [...ticket.buildUnits].sort().join(", ") : ticket.buildUnitDisposition || "Unmapped" },
    { field: { name: "Repository Build Units" }, text: "Unmapped" },
    { field: { name: "Repositories" }, options: [] },
    { field: { name: "Parent Decision" }, text: ticket.parentDecision ? `${ticket.parentDecision} — ${ticket.parentDecisionTitle}` : "None" },
  ];
  return { id: itemId, content: { number: issueNumber }, fieldValues: { nodes } };
}

test("ticket-root preflight reports tracked, renamed, and untracked target paths while allowing outside-root dirt", async () => {
  const calls = [];
  const adapter = createGitHubAdapter({
    run: runner([
      {
        when: ({ command }) => command === "git",
        result: () => ({ stdout: " M design/software-design/changed.md\0?? design/software-design/new.md\0R  design/software-design/new.yaml\0design/software-design/old.yaml\0?? notes.md\0" }),
      },
    ], calls),
  });
  const result = await adapter.checkTicketRootClean(config);
  assert.equal(result.clean, false);
  assert.deepEqual(result.paths, [
    "design/software-design/changed.md",
    "design/software-design/new.md",
    "design/software-design/new.yaml",
    "design/software-design/old.yaml",
  ]);
  assert.match(result.message, /commit, stash, or move/i);

  const outside = createGitHubAdapter({
    run: runner([{ when: ({ command }) => command === "git", result: () => ({ stdout: " M notes.md\0?? scratch.txt\0" }) }]),
  });
  assert.deepEqual(await outside.checkTicketRootClean(config), { clean: true, paths: [], message: null });
  assert.equal(calls.every((call) => call.command === "git"), true);
});

test("authentication reuses existing gh access without starting a browser login", async () => {
  const calls = [];
  const adapter = createGitHubAdapter({
    run: runner([
      { when: ({ command, args }) => command === "gh" && args.join(" ") === "auth status --active --hostname github.com", result: () => ({ stdout: "Logged in" }) },
      { when: ({ command, args }) => command === "gh" && args.join(" ") === "api user --jq .login", result: () => ({ stdout: "Alangr6\n" }) },
    ], calls),
  });
  assert.deepEqual(await adapter.ensureAuthenticated({ interactive: true }), { authenticated: true, login: "Alangr6", prompted: false });
  assert.deepEqual(calls.map((call) => call.args.join(" ")), [
    "auth status --active --hostname github.com",
    "api user --jq .login",
  ]);
});

test("authentication waits through browser login and verifies access before returning", async () => {
  const calls = [];
  let verified = false;
  const adapter = createGitHubAdapter({
    run: runner([
      { when: ({ command, args }) => command === "gh" && args.join(" ") === "auth status --active --hostname github.com", result: () => {
        if (!verified) throw new Error("stored token is invalid");
        return { stdout: "Logged in" };
      } },
      { when: ({ command, args }) => command === "gh" && args.join(" ") === "api user --jq .login", result: () => {
        if (!verified) throw new Error("bad credentials");
        return { stdout: "Alangr6\n" };
      } },
      { when: ({ command, args }) => command === "gh" && args.join(" ") === "auth login --hostname github.com --web --git-protocol https", result: () => {
        verified = true;
        return { stdout: "", stderr: "" };
      } },
    ], calls),
  });
  assert.deepEqual(await adapter.ensureAuthenticated({ interactive: true, pollAttempts: 1 }), { authenticated: true, login: "Alangr6", prompted: true });
  const loginCall = calls.find((call) => call.args[1] === "login");
  assert.equal(loginCall.interactive, true);
});

test("pending-comments fails before identity, issue, comment, summary, or marker work when the target root is dirty", async () => {
  const calls = [];
  const adapter = createGitHubAdapter({
    run: runner([{ when: ({ command }) => command === "git", result: () => ({ stdout: " M design/software-design/flows/a.md\0" }) }], calls),
  });
  await assert.rejects(adapter.pendingComments({ config, records: [record] }), /ticketRoot is dirty/);
  assert.deepEqual(calls.map((call) => call.command), ["git"]);
});

test("pending-comments allows outside-root dirt and returns one issue-local read snapshot", async () => {
  const calls = [];
  const adapter = createGitHubAdapter({
    run: runner([
      { when: ({ command }) => command === "git", result: () => ({ stdout: " M README.md\0" }) },
      { when: ({ command, args }) => command === "gh" && args.join(" ") === "api user", result: () => json({ login: "bot" }) },
      { when: ({ command, args }) => command === "gh" && args.join(" ").includes("issues?state=all"), result: () => json([[{
        number: 3,
        url: "https://api.github.com/repos/owner/repository/issues/3",
        html_url: "https://github.com/owner/repository/issues/3",
        body: record.body,
      }]]) },
      { when: ({ command, args }) => command === "gh" && args.join(" ").includes("issues/3/comments"), result: () => json([{
        id: 4,
        url: "https://api.github.com/repos/owner/repository/issues/comments/4",
        html_url: "https://github.com/owner/repository/issues/3#issuecomment-4",
        body: "Please clarify",
        user: { login: "teammate" },
      }]) },
    ], calls),
  });
  const batch = await adapter.pendingComments({ config, records: [record] });
  assert.deepEqual(batch.issues[0].pendingComments.map((comment) => comment.url), ["https://github.com/owner/repository/issues/3#issuecomment-4"]);
  assert.equal(batch.issues[0].pendingComments[0].author.login, "teammate");
  assert.equal(batch.issues[0].issue.url, "https://github.com/owner/repository/issues/3");
  assert.equal(calls.filter((call) => call.command === "gh").length, 3);
});

test("sync stops on duplicate identity markers before provider writes", async () => {
  const calls = [];
  const adapter = createGitHubAdapter({
    run: runner([{ when: ({ command, args }) => command === "gh" && args.join(" ").includes("issues?state=all"), result: () => json([[
      { number: 3, body: record.body },
      { number: 4, body: record.body },
    ]]) }], calls),
  });
  await assert.rejects(adapter.sync({ config, records: [record] }), /Duplicate GitHub issue markers.*3, 4/);
  assert.equal(calls.filter((call) => call.command === "gh").length, 1);
});

test("Technical Decision label setup fails before decision projection when the provider is unavailable", async () => {
  const calls = [];
  const adapter = createGitHubAdapter({
    run: runner([
      { when: ({ command, args }) => command === "gh" && args.join(" ").includes("issues?state=all"), result: () => json([[{ number: 3, url: "https://github.com/owner/repository/issues/3", title: record.issueTitle, body: record.body, labels: [] }]]) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("view"), result: () => json({ id: "PVT_1" }) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("field-list"), result: () => json({ fields: completeDecisionProjectFields() }) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("item-list"), result: () => json({ items: [{ id: "ITEM_TICKET", content: { number: 3 } }] }) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("item-edit"), result: () => ({ stdout: "" }) },
      { when: ({ command, args }) => command === "gh" && args[0] === "label" && args[1] === "list", result: () => { throw new Error("provider unavailable"); } },
    ], calls),
  });
  await assert.rejects(
    adapter.sync({ config, records: [{ ...record, buildUnits: [], buildUnitDisposition: "Unmapped" }], decisions: [decision], buildUnits: [] }),
    /provider unavailable/,
  );
});

test("sync keeps matching issue state and assignees while converging ticket Project mappings", async () => {
  const calls = [];
  const adapter = createGitHubAdapter({
    run: runner([
      { when: ({ command, args }) => command === "gh" && args.join(" ").includes("issues?state=all"), result: () => json([[
        { number: 3, url: "https://github.com/owner/repository/issues/3", title: record.issueTitle, body: record.body, state: "CLOSED", assignees: [{ login: "person" }], labels: [...buildUnits.map(({ label: name }) => ({ name })), { name: workflowLabel.name }] },
      ]]) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("view"), result: () => json({
        id: "PVT_1",
        fields: { totalCount: 3 },
        items: { totalCount: 1 },
      }) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("field-list"), result: () => json({ fields: [
        ...completeProjectFields().filter((field) => ["Work area", "Waiting on", "Answering group", "Board status"].includes(field.name)),
        { id: "F_STATUS", name: "Status", type: "ProjectV2SingleSelectField", options: [{ id: "O_TODO", name: "todo" }, { id: "O_DEFERRED", name: "deferred" }, { id: "O_DECIDED", name: "decided" }, { id: "O_FINISHED", name: "finished" }, { id: "O_OUT_OF_SCOPE", name: "out-of-scope" }] },
        { id: "F_COMPLEXITY", name: "Complexity", type: "ProjectV2SingleSelectField", options: ["low", "medium", "high"].map((name) => ({ id: `O_${name.toUpperCase()}`, name })) },
    { id: "F_KIND", name: "Kind", type: "ProjectV2SingleSelectField", options: [{ id: "O_TECHNICAL", name: "Software" }, { id: "O_PRODUCT", name: "product" }, { id: "O_OPERATIONAL", name: "operational" }] },
        { id: "F_REPOSITORIES", name: "Repositories", type: "ProjectV2MultiSelectField", options: [] },
        { id: "F_REPOSITORY_LAYER", name: "Repository Ticket Layer", type: "ProjectV2SingleSelectField", options: [{ id: "O_REPOSITORY_WIDE", name: "Repository-wide tickets" }, { id: "O_OWNED_BUILD_UNIT", name: "Owned Build Unit tickets" }] },
        { id: "F_AREA", name: "Domain", type: "ProjectV2Field" },
        { id: "F_RESPONSIBILITY", name: "Responsibility", type: "ProjectV2Field" },
        { id: "F_CATEGORY", name: "Category", type: "ProjectV2Field" },
        { id: "F_BUILD_UNITS", name: "Build Units", type: "ProjectV2Field" },
        { id: "F_REPOSITORY_BU", name: "Repository Build Units", type: "ProjectV2Field" },
        { id: "F_PARENT_DECISION", name: "Parent Decision", type: "ProjectV2Field" },
        { id: "F_DECISION_STATUS", name: "Decision Status", type: "ProjectV2Field" },
        { id: "F_DECISION_TICKETS", name: "Decision Tickets", type: "ProjectV2Field" },
        { id: "F_RESUME_WHEN", name: "Resume When", type: "ProjectV2Field" },
      ] }) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("item-list"), result: () => json({ items: [
        { id: "ITEM_1", content: { number: 3 }, status: "decided", kind: "product", complexity: "medium", domain: "Unknown", responsibility: "SR-999 — Unknown", category: "testing", buildUnits: "Unmapped", "repository Build Units": "Unknown" },
      ] }) },
      { when: ({ command, args }) => command === "gh" && args[0] === "label" && args[1] === "list", result: () => json([...buildUnits.map(({ id, label: name }) => ({ name, color: "5319e7", description: `Software Design Build Unit ${id}` })), workflowLabel]) },
      { when: ({ command, args }) => command === "gh" && args.includes("item-edit"), result: () => ({ stdout: "" }) },
    ], calls),
  });
  assert.deepEqual(await adapter.sync({ config, records: [record], buildUnits }), { completed: [record.id], buildUnitLabelsCompleted: ["BU-001", "BU-002"], failed: [] });
  assert.equal(calls.some((call) => call.args.includes("issue") && call.args.includes("edit")), false);
  const edits = calls.filter((call) => call.args.includes("item-edit"));
  assert.equal(edits.length, 11);
  assert.equal(edits.some((call) => call.args.includes("--single-select-option-id") && call.args.includes("O_TODO")), true);
  assert.equal(edits.some((call) => call.args.includes("--single-select-option-id") && call.args.includes("O_TECHNICAL")), true);
  assert.equal(edits.filter((call) => call.args.includes("--text")).length, 7);
  assert.equal(edits.some((call) => call.args.includes("--text") && call.args.includes(record.domainLabel)), true);
  assert.equal(edits.some((call) => call.args.includes("--text") && call.args.includes(record.responsibilityLabel)), true);
  assert.equal(edits.some((call) => call.args.includes("--text") && call.args.includes("BU-001, BU-002")), true);
});

test("sync uses the item-add result without reloading the whole Project", async () => {
  const calls = [];
  const adapter = createGitHubAdapter({
    run: runner([
      { when: ({ command, args }) => command === "gh" && args.join(" ").includes("issues?state=all"), result: () => json([[
        { number: 3, url: "https://github.com/owner/repository/issues/3", title: record.issueTitle, body: record.body, labels: [...buildUnits.map(({ label: name }) => ({ name })), { name: workflowLabel.name }] },
      ]]) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("view"), result: () => json({ id: "PVT_1" }) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("field-list"), result: () => json({ fields: [
        ...completeProjectFields().filter((field) => ["Work area", "Waiting on", "Answering group", "Board status"].includes(field.name)),
        { id: "F_STATUS", name: "Status", type: "ProjectV2SingleSelectField", options: [{ id: "O_TODO", name: "todo" }, { id: "O_DEFERRED", name: "deferred" }, { id: "O_DECIDED", name: "decided" }, { id: "O_FINISHED", name: "finished" }, { id: "O_OUT_OF_SCOPE", name: "out-of-scope" }] },
        { id: "F_COMPLEXITY", name: "Complexity", type: "ProjectV2SingleSelectField", options: ["low", "medium", "high"].map((name) => ({ id: `O_${name.toUpperCase()}`, name })) },
    { id: "F_KIND", name: "Kind", type: "ProjectV2SingleSelectField", options: [{ id: "O_TECHNICAL", name: "Software" }, { id: "O_PRODUCT", name: "product" }, { id: "O_OPERATIONAL", name: "operational" }] },
        { id: "F_REPOSITORIES", name: "Repositories", type: "ProjectV2MultiSelectField", options: [] },
        { id: "F_REPOSITORY_LAYER", name: "Repository Ticket Layer", type: "ProjectV2SingleSelectField", options: [{ id: "O_REPOSITORY_WIDE", name: "Repository-wide tickets" }, { id: "O_OWNED_BUILD_UNIT", name: "Owned Build Unit tickets" }] },
        { id: "F_AREA", name: "Domain", type: "ProjectV2Field" },
        { id: "F_RESPONSIBILITY", name: "Responsibility", type: "ProjectV2Field" },
        { id: "F_CATEGORY", name: "Category", type: "ProjectV2Field" },
        { id: "F_BUILD_UNITS", name: "Build Units", type: "ProjectV2Field" },
        { id: "F_REPOSITORY_BU", name: "Repository Build Units", type: "ProjectV2Field" },
        { id: "F_PARENT_DECISION", name: "Parent Decision", type: "ProjectV2Field" },
        { id: "F_DECISION_STATUS", name: "Decision Status", type: "ProjectV2Field" },
        { id: "F_DECISION_TICKETS", name: "Decision Tickets", type: "ProjectV2Field" },
        { id: "F_RESUME_WHEN", name: "Resume When", type: "ProjectV2Field" },
      ] }) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("item-list"), result: () => json({ items: [] }) },
      { when: ({ command, args }) => command === "gh" && args[0] === "label" && args[1] === "list", result: () => json([...buildUnits.map(({ id, label: name }) => ({ name, color: "5319e7", description: `Software Design Build Unit ${id}` })), workflowLabel]) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("item-add"), result: () => json({ id: "ITEM_NEW" }) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("item-edit"), result: () => ({ stdout: "" }) },
    ], calls),
  });
  assert.deepEqual(await adapter.sync({ config, records: [record], buildUnits }), { completed: [record.id], buildUnitLabelsCompleted: ["BU-001", "BU-002"], failed: [] });
  assert.equal(calls.filter((call) => call.args.includes("project") && call.args.includes("view")).length, 1);
  assert.equal(calls.filter((call) => call.args.some((arg) => arg.includes("ProjectProjectionFields"))).length, 1);
  assert.equal(calls.filter((call) => call.args.includes("project") && call.args.includes("item-list")).length, 1);
  assert.equal(calls.filter((call) => call.args.includes("item-add")).length, 1);
  assert.equal(calls.filter((call) => call.args.includes("item-edit") && call.args.includes("ITEM_NEW")).length, 12);
});

test("ordinary sync leaves presentation configuration untouched", async () => {
  const calls = [];
  const statusOptions = ["todo", "deferred", "decided", "finished", "out-of-scope"].map((name, index) => ({
    id: `O_STATUS_${index}`,
    name,
    color: index === 3 ? "GREEN" : "GRAY",
    description: `${name} explanation`,
  }));
  const adapter = createGitHubAdapter({
    run: runner([
      { when: ({ command, args }) => command === "gh" && args.join(" ").includes("issues?state=all"), result: () => json([[]]) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("view"), result: () => json({ id: "PVT_1" }) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("field-list"), result: () => json({ fields: completeProjectFields() }) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("item-list"), result: () => json({ items: [] }) },
      {
        when: ({ command, args }) => command === "gh" && args[0] === "api" && args[1] === "graphql" && args.some((arg) => arg.includes("StatusOptionPresentation")),
        result: () => json({ data: { node: { fields: { nodes: [{ id: "F_STATUS", name: "Status", options: statusOptions }] } } } }),
      },
      {
        when: ({ command, args, input }) => command === "gh" && args[0] === "api" && args[1] === "graphql" && args.includes("--input") && input.includes("CompactStatusOptionDescriptions"),
        result: () => json({ data: { updateProjectV2Field: { projectV2Field: { id: "F_STATUS" } } } }),
      },
    ], calls),
  });

  assert.deepEqual(await adapter.sync({ config, records: [] }), {
    completed: [],
    buildUnitLabelsCompleted: [],
    failed: [],
  });
  assert.equal(calls.some((call) => call.input?.includes("CompactStatusOptionDescriptions") || call.args.some((arg) => arg.includes("ProjectViewConfiguration"))), false);
  assert.equal(calls.some((call) => call.input?.includes("updateProjectV2View")), false);
});

test("sync keeps repository-mapped tickets out of the Build Unit label slice", async () => {
  const calls = [];
  const repositoryTicket = { ...record, buildUnits: ["BU-001"], buildUnitDisposition: null, repositories: ["REPO-001"] };
  const adapter = createGitHubAdapter({
    run: runner([
      { when: ({ command, args }) => command === "gh" && args.join(" ").includes("issues?state=all"), result: () => json([[
        { number: 3, url: "https://github.com/owner/repository/issues/3", title: repositoryTicket.issueTitle, body: repositoryTicket.body, labels: [{ name: buildUnitRecord.label }, { name: workflowLabel.name }] },
      ]]) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("view"), result: () => json({ id: "PVT_1" }) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("field-list"), result: () => json({ fields: completeProjectFields([repositoryRecord]) }) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("item-list"), result: () => json({ items: [{ id: "ITEM_1", content: { number: 3 } }] }) },
      { when: ({ command, args }) => command === "gh" && args[0] === "label" && args[1] === "list", result: () => json([]) },
      { when: ({ command, args }) => command === "gh" && args[0] === "label" && args[1] === "create", result: () => ({ stdout: "" }) },
      { when: ({ command, args }) => command === "gh" && args.includes("issue") && args.includes("edit"), result: () => ({ stdout: "" }) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("item-edit"), result: () => ({ stdout: "" }) },
      multiSelectEditRoute(),
    ], calls),
  });
  const result = await adapter.sync({ config, records: [repositoryTicket], buildUnits: [buildUnitRecord], repositories: [repositoryRecord] });
  assert.deepEqual(result, { completed: [repositoryTicket.id], repositoryFieldOptionsCompleted: ["REPO-001"], buildUnitLabelsCompleted: ["BU-001"], failed: [] });
  assert.equal(calls.some((call) => call.args.includes("label") && call.args.includes("create") && call.args.includes(repositoryRecord.label)), false);
  assert.equal(calls.some((call) => call.args.includes("--add-label") && call.args.includes(repositoryRecord.label)), false);
  assert.equal(calls.some((call) => call.args.includes("--remove-label") && call.args.some((arg) => arg.includes(buildUnitRecord.label))), true);
  assert.equal(calls.some((call) => call.args.includes("--remove-label") && call.args.some((arg) => arg.includes(workflowLabel.name))), true);
  const repositoryEdit = calls.find((call) => call.args[0] === "api" && call.args[1] === "graphql" && call.args.includes("--input"));
  assert.deepEqual(JSON.parse(repositoryEdit.input).variables.optionIds, ["O_REPO_001"]);
  assert.equal(calls.some((call) => call.args.includes("--single-select-option-id") && call.args.includes("O_REPOSITORY_WIDE")), true);
  assert.equal(calls.some((call) => call.args.includes("--text") && call.args.includes("BU-001")), true);
});

test("sync projects one owned-Build-Unit card when two mapped Build Units share one repository", async () => {
  const calls = [];
  const sharedRepository = { ...repositoryRecord, memberBuildUnits: ["BU-001", "BU-002"] };
  const adapter = createGitHubAdapter({
    run: runner([
      { when: ({ command, args }) => command === "gh" && args.join(" ").includes("issues?state=all"), result: () => json([[
        { number: 3, url: "https://github.com/owner/repository/issues/3", title: record.issueTitle, body: record.body, labels: [...buildUnits.map(({ label: name }) => ({ name })), { name: sharedRepository.label }] },
      ]]) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("view"), result: () => json({ id: "PVT_1" }) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("field-list"), result: () => json({ fields: completeProjectFields([sharedRepository]) }) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("item-list"), result: () => json({ items: [{ id: "ITEM_1", content: { number: 3 } }] }) },
      { when: ({ command, args }) => command === "gh" && args[0] === "label" && args[1] === "list", result: () => json(buildUnits.map(({ id, label: name }) => ({ name, color: "5319e7", description: `Software Design Build Unit ${id}` }))) },
      { when: ({ command, args }) => command === "gh" && args[0] === "label" && args[1] === "create", result: () => ({ stdout: "" }) },
      { when: ({ command, args }) => command === "gh" && args.includes("issue") && args.includes("edit"), result: () => ({ stdout: "" }) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("item-edit"), result: () => ({ stdout: "" }) },
      multiSelectEditRoute(),
    ], calls),
  });

  assert.deepEqual(await adapter.sync({ config, records: [record], buildUnits, repositories: [sharedRepository] }), {
    completed: [record.id],
    repositoryFieldOptionsCompleted: ["REPO-001"],
    buildUnitLabelsCompleted: ["BU-001", "BU-002"],
    failed: [],
  });
  const repositoryFieldEdits = calls.filter((call) => call.args[0] === "api" && call.args[1] === "graphql" && call.args.includes("--input"));
  assert.equal(repositoryFieldEdits.length, 1);
  assert.deepEqual(JSON.parse(repositoryFieldEdits[0].input).variables.optionIds, ["O_REPO_001"]);
  assert.equal(calls.some((call) => call.args.includes("--remove-label") && call.args.includes(sharedRepository.label)), true);
  assert.equal(calls.some((call) => call.args.includes("--remove-label") && call.args.includes(buildUnitRecord.label)), false);
  assert.equal(calls.filter((call) => call.args.includes("item-add")).length, 0);
  assert.equal(calls.some((call) => call.args.includes("--single-select-option-id") && call.args.includes("O_OWNED_BUILD_UNIT")), true);
  assert.equal(calls.some((call) => call.args.includes("--text") && call.args.includes("BU-001, BU-002")), true);
});

test("sync preserves many-to-many repository applicability through the Repositories field", async () => {
  const calls = [];
  const repositoryTicket = { ...record, buildUnits: [], buildUnitDisposition: "Unmapped", repositories: ["REPO-001", "REPO-002"] };
  const adapter = createGitHubAdapter({
    run: runner([
      { when: ({ command, args }) => command === "gh" && args.join(" ").includes("issues?state=all"), result: () => json([[
        { number: 3, url: "https://github.com/owner/repository/issues/3", title: repositoryTicket.issueTitle, body: repositoryTicket.body, labels: [] },
      ]]) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("view"), result: () => json({ id: "PVT_1" }) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("field-list"), result: () => json({ fields: completeProjectFields([repositoryRecord, secondRepositoryRecord]) }) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("item-list"), result: () => json({ items: [{ id: "ITEM_1", content: { number: 3 } }] }) },
      { when: ({ command, args }) => command === "gh" && args[0] === "label" && args[1] === "list", result: () => json([]) },
      { when: ({ command, args }) => command === "gh" && args[0] === "label" && args[1] === "create", result: () => ({ stdout: "" }) },
      { when: ({ command, args }) => command === "gh" && args.includes("issue") && args.includes("edit"), result: () => ({ stdout: "" }) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("item-edit"), result: () => ({ stdout: "" }) },
      multiSelectEditRoute(),
    ], calls),
  });
  const repositories = [repositoryRecord, secondRepositoryRecord];
  const result = await adapter.sync({ config, records: [repositoryTicket], buildUnits: [], repositories });
  assert.deepEqual(result, { completed: [repositoryTicket.id], repositoryFieldOptionsCompleted: ["REPO-001", "REPO-002"], buildUnitLabelsCompleted: [], failed: [] });
  assert.equal(calls.some((call) => call.args.includes("--add-label")), false);
  const repositoryEdit = calls.find((call) => call.args[0] === "api" && call.args[1] === "graphql" && call.args.includes("--input"));
  assert.deepEqual(JSON.parse(repositoryEdit.input).variables.optionIds, ["O_REPO_001", "O_REPO_002"]);
  assert.equal(calls.some((call) => call.args.includes("TD Repository")), false);
  assert.equal(calls.some((call) => call.args.includes("--text") && call.args.includes(`${repositoryRecord.label}: BU-001; ${secondRepositoryRecord.label}: BU-004`)), true);
});

test("reconcile rejects REPO ticket labels while accepting repository field membership", async () => {
  const repositoryTicket = { ...record, buildUnits: ["BU-001"], buildUnitDisposition: null, repositories: ["REPO-001"] };
  const adapter = createGitHubAdapter({
    run: runner([
      { when: ({ command, args }) => command === "gh" && args.join(" ").includes("issues?state=all"), result: () => json([[
        { number: 3, url: "https://github.com/owner/repository/issues/3", title: repositoryTicket.issueTitle, body: repositoryTicket.body, labels: [{ name: repositoryRecord.label }] },
      ]]) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("view"), result: () => json({ id: "PVT_1" }) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("field-list"), result: () => json({ fields: completeProjectFields([repositoryRecord]) }) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("item-list"), result: () => json({ items: [{
        id: "ITEM_1",
        content: { number: 3 },
        workArea: "Software", answeringGroup: "Ready", boardStatus: "todo",
        status: "todo",
        kind: "Software", complexity: "medium",
        domain: record.domainLabel,
        responsibility: record.responsibilityLabel,
        category: record.concern,
        buildUnits: "BU-001",
        "repository Build Units": "BU-001",
        repositories: [repositoryRecord.label],
        "repository Ticket Layer": "Repository-wide tickets",
        "parent Decision": "None",
      }] }) },
    ]),
  });
  assert.deepEqual(await adapter.reconcile({ config, records: [repositoryTicket], buildUnits: [buildUnitRecord], repositories: [repositoryRecord] }), {
    drifts: [{ ticketId: repositoryTicket.id, kinds: ["unexpected-repository-labels"] }],
    unknownTicketIds: [],
    fixed: false,
    decisionDrifts: [],
    unknownDecisionIds: [],
  });
});

test("sync gives a standalone out-of-scope ticket the direct view label", async () => {
  const calls = [];
  const detailRecord = {
    ...record,
    id: "TICKET-0002",
    issueTitle: "TICKET-0002 — Deferred recovery",
    status: "out-of-scope",
    body: "<!-- software-design-ticket TICKET-0002 -->\nbody",
    buildUnits: [],
    buildUnitDisposition: "No V1 build artifact is assigned.",
  };
  const adapter = createGitHubAdapter({
    run: runner([
      { when: ({ command, args }) => command === "gh" && args.join(" ").includes("issues?state=all"), result: () => json([[{ number: 3, url: "https://github.com/owner/repository/issues/3", title: detailRecord.issueTitle, body: detailRecord.body, labels: [] }]]) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("view"), result: () => json({ id: "PVT_1" }) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("field-list"), result: () => json({ fields: completeProjectFields() }) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("item-list"), result: () => json({ items: [] }) },
      { when: ({ command, args }) => command === "gh" && args[0] === "label" && args[1] === "list", result: () => json([]) },
      { when: ({ command, args }) => command === "gh" && args[0] === "label" && args[1] === "create", result: () => ({ stdout: "" }) },
      { when: ({ command, args }) => command === "gh" && args.includes("issue") && args.includes("edit"), result: () => ({ stdout: "" }) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("item-add"), result: () => json({ id: "ITEM_DETAIL" }) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("item-edit"), result: () => ({ stdout: "" }) },
    ], calls),
  });
  const result = await adapter.sync({ config, records: [detailRecord], buildUnits: [] });
  assert.deepEqual(result, { completed: [detailRecord.id], buildUnitLabelsCompleted: [], failed: [] });
  assert.equal(calls.some((call) => call.args.includes("F_STATUS") && call.args.includes("O_OUT_OF_SCOPE")), true);
  assert.equal(calls.some((call) => call.args.includes("--add-label") && call.args.some((arg) => arg.includes("Out-of-Scope"))), true);
});

test("sync refuses a potentially truncated Project item listing before adding membership", async () => {
  const calls = [];
  const adapter = createGitHubAdapter({
    run: runner([
      { when: ({ command, args }) => command === "gh" && args.join(" ").includes("issues?state=all"), result: () => json([[
        { number: 3, url: "https://github.com/owner/repository/issues/3", title: record.issueTitle, body: record.body, labels: [] },
      ]]) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("view"), result: () => json({ id: "PVT_1" }) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("field-list"), result: () => json({ fields: completeProjectFields() }) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("item-list"), result: () => json({ items: Array.from({ length: 1000 }, (_, index) => ({ id: `ITEM_${index}`, content: { number: index + 10 } })) }) },
    ], calls),
  });
  await assert.rejects(adapter.sync({ config, records: [{ ...record, buildUnits: [], buildUnitDisposition: "Unmapped" }], buildUnits: [] }), /Project item listing reached the 1000-item limit/);
  assert.equal(calls.some((call) => call.args.includes("item-add")), false);
});

test("Project reads use the GraphQL schema query and discover required fields after the default first 30", async () => {
  const calls = [];
  const fields = [
    ...Array.from({ length: 31 }, (_, index) => ({ id: `F_LEGACY_${index}`, name: `Legacy ${index}`, type: "ProjectV2Field" })),
    ...completeProjectFields(),
  ];
  const adapter = createGitHubAdapter({
    run: runner([
      { when: ({ command, args }) => command === "gh" && args.join(" ").includes("issues?state=all"), result: () => json([[]]) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("view"), result: () => json({ id: "PVT_1" }) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("field-list"), result: () => json({ fields }) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("item-list"), result: () => json({ items: [] }) },
    ], calls),
  });

  const result = await adapter.reconcile({ config, records: [] });
  assert.deepEqual(result.drifts, []);
  const fieldQueryCall = calls.find(({ command, args }) => command === "gh" && args.some((arg) => arg.includes("ProjectProjectionFields")));
  assert.ok(fieldQueryCall);
  assert.equal(fieldQueryCall.args.includes("projectId=PVT_1"), true);
  assert.equal(calls.some(({ command, args }) => command === "gh" && args.includes("field-list")), false);
});

test("reconcile accepts the GraphQL Repositories field when gh project field-list would omit its metadata", async () => {
  const calls = [];
  const adapter = createGitHubAdapter({
    run: runner([
      { when: ({ command, args }) => command === "gh" && args.join(" ").includes("issues?state=all"), result: () => json([[]]) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("view"), result: () => json({ id: "PVT_1" }) },
      { when: ({ command, args }) => command === "gh" && args.some((arg) => arg.includes("ProjectProjectionFields")), result: () => json({ data: { node: { fields: { nodes: completeProjectFields(), pageInfo: { hasNextPage: false } } } } }) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("field-list"), result: () => json({ fields: [{ id: "", name: "", type: "ProjectV2MultiSelectField" }] }) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("item-list"), result: () => json({ items: [] }) },
    ], calls),
  });

  assert.deepEqual(await adapter.reconcile({ config, records: [], decisions: [], buildUnits: [] }), {
    drifts: [],
    unknownTicketIds: [],
    fixed: false,
    decisionDrifts: [],
    unknownDecisionIds: [],
  });
  assert.equal(calls.some(({ command, args }) => command === "gh" && args.includes("field-list")), false);
});

test("reconcile reads Repositories membership through GraphQL when flattened Project items omit it", async () => {
  const ticket = { ...record, buildUnits: [], buildUnitDisposition: "Unmapped", repositories: [repositoryRecord.id] };
  const item = matchingTicketItem(ticket, 3, "ITEM_1");
  item.fieldValues.nodes = item.fieldValues.nodes.map((value) => value.field?.name === "Repository Build Units"
    ? { ...value, text: "BU-001" }
    : value);
  item.fieldValues.nodes.push({ field: { name: "Repository Ticket Layer" }, name: "Repository-wide tickets" });
  const calls = [];
  const adapter = createGitHubAdapter({
    run: runner([
      { when: ({ command, args }) => command === "gh" && args.join(" ").includes("issues?state=all"), result: () => json([[
        { number: 3, url: "https://github.com/owner/repository/issues/3", title: ticket.issueTitle, body: ticket.body, labels: [{ name: workflowLabel.name }] },
      ]]) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("view"), result: () => json({ id: "PVT_1" }) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("field-list"), result: () => json({ fields: completeProjectFields([repositoryRecord]) }) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("item-list"), result: () => json({ items: [item] }) },
      { when: ({ command, args }) => command === "gh" && args.some((arg) => arg.includes("ProjectProjectionItemMultiSelectValues")), result: () => json({ data: { node: { items: {
        nodes: [{ id: "ITEM_1", fieldValues: { nodes: [{ field: { name: "Repositories" }, options: [{ name: repositoryRecord.label }] }] } }],
        pageInfo: { hasNextPage: false, endCursor: null },
      } } } }) },
    ], calls),
  });

  const result = await adapter.reconcile({ config, records: [ticket], decisions: [], buildUnits: [], repositories: [repositoryRecord] });
  assert.deepEqual(result.drifts, []);
  assert.equal(calls.some(({ command, args }) => command === "gh" && args.some((arg) => arg.includes("ProjectProjectionItemMultiSelectValues"))), true);
});

test("reconcile rejects an actually missing Repositories field from the GraphQL Project schema", async () => {
  const adapter = createGitHubAdapter({
    run: runner([
      { when: ({ command, args }) => command === "gh" && args.join(" ").includes("issues?state=all"), result: () => json([[]]) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("view"), result: () => json({ id: "PVT_1" }) },
      { when: ({ command, args }) => command === "gh" && args.some((arg) => arg.includes("ProjectProjectionFields")), result: () => json({ data: { node: { fields: { nodes: completeProjectFields().filter((field) => field.name !== "Repositories"), pageInfo: { hasNextPage: false } } } } }) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("item-list"), result: () => json({ items: [] }) },
    ]),
  });

  await assert.rejects(adapter.reconcile({ config, records: [], decisions: [], buildUnits: [] }), /missing required Repositories field/);
});

test("reconcile reports stale issue-backed Project titles without treating them as a missing field or membership", async () => {
  const ticket = { ...record, buildUnits: [], buildUnitDisposition: "Unmapped" };
  const adapter = createGitHubAdapter({
    run: runner([
      { when: ({ command, args }) => command === "gh" && args.join(" ").includes("issues?state=all"), result: () => json([[
        { number: 3, url: "https://github.com/owner/repository/issues/3", title: ticket.issueTitle, body: ticket.body, labels: [] },
      ]]) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("view"), result: () => json({ id: "PVT_1" }) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("field-list"), result: () => json({ fields: completeProjectFields() }) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("item-list"), result: () => json({ items: [{ ...matchingTicketItem(ticket, 3, "ITEM_1"), title: "TICKET-9999 — Stale retry policy" }] }) },
    ]),
  });

  const result = await adapter.reconcile({ config, records: [ticket], decisions: [], buildUnits: [] });
  assert.deepEqual(result.drifts, [{ ticketId: ticket.id, kinds: ["project-title"] }]);
});

test("normal sync never recreates a Project item solely because its native title is stale", async () => {
  const ticket = { ...record, buildUnits: [], buildUnitDisposition: "Unmapped" };
  const calls = [];
  const adapter = createGitHubAdapter({
    run: runner([
      { when: ({ command, args }) => command === "gh" && args.join(" ").includes("issues?state=all"), result: () => json([[
        { number: 3, url: "https://github.com/owner/repository/issues/3", title: ticket.issueTitle, body: ticket.body, labels: [] },
      ]]) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("view"), result: () => json({ id: "PVT_1" }) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("field-list"), result: () => json({ fields: completeProjectFields() }) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("item-list"), result: () => json({ items: [{ ...matchingTicketItem(ticket, 3, "ITEM_1"), title: "TICKET-9999 — Stale retry policy" }] }) },
      { when: ({ command, args }) => command === "gh" && args[0] === "label" && args[1] === "list", result: () => json([workflowLabel]) },
      { when: ({ command, args }) => command === "gh" && args[0] === "issue" && args[1] === "edit", result: () => ({ stdout: "" }) },
    ], calls),
  });

  assert.deepEqual(await adapter.sync({ config, records: [ticket], decisions: [], buildUnits: [] }), {
    completed: [ticket.id],
    buildUnitLabelsCompleted: [],
    failed: [],
  });
  assert.equal(calls.some(({ command, args }) => command === "gh" && args[0] === "project" && args[1] === "item-delete"), false);
  assert.equal(calls.some(({ command, args }) => command === "gh" && args[0] === "project" && args[1] === "item-add"), false);
  assert.equal(calls.some(({ command, args }) => command === "gh" && args[0] === "issue" && args[1] === "edit" && args.includes("--add-label") && args.some((arg) => arg.includes(workflowLabel.name))), true);
});

test("sync maintains native Build Unit labels and never creates Project draft items", async () => {
  const calls = [];
  const adapter = createGitHubAdapter({
    run: runner([
      { when: ({ command, args }) => command === "gh" && args.join(" ").includes("issues?state=all"), result: () => json([[
        {
          number: 3,
          url: "https://github.com/owner/repository/issues/3",
          title: record.issueTitle,
          body: record.body,
          labels: [{ name: "BU-001 — Shared Library" }, { name: "BU-002 — Old Name" }, { name: "BU-009 — Stale" }, { name: workflowLabel.name }, { name: "security" }],
        },
      ]]) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("view"), result: () => json({ id: "PVT_1" }) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("field-list"), result: () => json({ fields: completeProjectFields() }) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("item-list"), result: () => json({ items: [{
        id: "ITEM_1",
        content: { number: 3 },
        workArea: "Software", answeringGroup: "Ready", boardStatus: "todo",
        status: "todo",
        kind: "Software", complexity: "medium",
        domain: record.domainLabel,
        responsibility: record.responsibilityLabel,
        category: record.concern,
        buildUnits: "BU-001, BU-002",
        "repository Build Units": "Unmapped",
        "parent Decision": "None",
      }] }) },
      { when: ({ command, args }) => command === "gh" && args[0] === "label" && args[1] === "list", result: () => json([
        { name: "BU-001 — Shared Library", color: "5319e7", description: "Software Design Build Unit BU-001" },
        { name: "BU-002 — Old Name", color: "ffffff", description: "old" },
        workflowLabel,
      ]) },
      { when: ({ command, args }) => command === "gh" && args[0] === "label" && args[1] === "edit", result: () => ({ stdout: "" }) },
      { when: ({ command, args }) => command === "gh" && args[0] === "issue" && args[1] === "edit", result: () => ({ stdout: "" }) },
    ], calls),
  });
  assert.deepEqual(await adapter.sync({ config, records: [record], buildUnits }), {
    completed: ["TICKET-0001"],
    buildUnitLabelsCompleted: ["BU-001", "BU-002"],
    failed: [],
  });
  assert.equal(calls.some((call) => call.args.includes("item-create")), false);
  const rename = calls.find((call) => call.args[0] === "label" && call.args[1] === "edit");
  assert.ok(rename.args.includes("BU-002 — Old Name"));
  assert.ok(rename.args.includes("BU-002 — Web Application"));
  const relabel = calls.find((call) => call.args[0] === "issue" && call.args[1] === "edit");
  assert.ok(relabel.args.includes("--remove-label"));
  assert.ok(relabel.args.includes("BU-009 — Stale"));
  assert.equal(relabel.args.join(" ").includes("security"), false);
});

test("sync runs distinct ticket plans concurrently with a hard limit of three and reports progress", async () => {
  const records = [1, 2, 3, 4].map((index) => numberedRecord(index));
  const issues = records.map((ticket, index) => ({
    number: index + 1,
    url: `https://github.com/owner/repository/issues/${index + 1}`,
    title: ticket.issueTitle,
    body: ticket.body,
    labels: [{ name: workflowLabel.name }],
  }));
  const items = records.map((ticket, index) => matchingTicketItem(ticket, index + 1, `ITEM_${index + 1}`, "decided"));
  const progress = [];
  let active = 0;
  let maximumActive = 0;
  const adapter = createGitHubAdapter({
    onProgress: (event) => progress.push(event),
    run: runner([
      { when: ({ command, args }) => command === "gh" && args.join(" ").includes("issues?state=all"), result: () => json([issues]) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("view"), result: () => json({ id: "PVT_1" }) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("field-list"), result: () => json({ fields: completeProjectFields() }) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("item-list"), result: () => json({ items }) },
      { when: ({ command, args }) => command === "gh" && args[0] === "label" && args[1] === "list", result: () => json([workflowLabel]) },
      { when: ({ command, args }) => command === "gh" && args.includes("item-edit"), result: async () => {
        active += 1;
        maximumActive = Math.max(maximumActive, active);
        await new Promise((resolve) => setTimeout(resolve, 15));
        active -= 1;
        return { stdout: "" };
      } },
    ]),
  });

  assert.deepEqual(await adapter.sync({ config, records, buildUnits: [] }), {
    completed: records.map(({ id }) => id),
    buildUnitLabelsCompleted: [],
    failed: [],
  });
  assert.equal(maximumActive, 3);
  assert.deepEqual(progress.find((event) => event.type === "sync-plan" && event.phase === "tickets"), {
    type: "sync-plan",
    phase: "tickets",
    total: 4,
    changed: 4,
    mutations: 4,
    elapsedMs: progress.find((event) => event.type === "sync-plan" && event.phase === "tickets").elapsedMs,
  });
  assert.equal(progress.filter((event) => event.type === "sync-progress" && event.phase === "tickets").length, 4);
  assert.equal(progress.at(-1).type, "sync-complete");
});

test("sync stops scheduling new tickets after a failure while reporting completed in-flight plans", async () => {
  const records = [1, 2, 3, 4, 5].map((index) => numberedRecord(index));
  const issues = records.map((ticket, index) => ({
    number: index + 1,
    url: `https://github.com/owner/repository/issues/${index + 1}`,
    title: ticket.issueTitle,
    body: ticket.body,
    labels: [{ name: workflowLabel.name }],
  }));
  const items = records.map((ticket, index) => matchingTicketItem(ticket, index + 1, `ITEM_${index + 1}`, "decided"));
  const calls = [];
  const adapter = createGitHubAdapter({
    run: runner([
      { when: ({ command, args }) => command === "gh" && args.join(" ").includes("issues?state=all"), result: () => json([issues]) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("view"), result: () => json({ id: "PVT_1" }) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("field-list"), result: () => json({ fields: completeProjectFields() }) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("item-list"), result: () => json({ items }) },
      { when: ({ command, args }) => command === "gh" && args[0] === "label" && args[1] === "list", result: () => json([workflowLabel]) },
      { when: ({ command, args }) => command === "gh" && args.includes("item-edit"), result: async ({ args }) => {
        const itemId = args[args.indexOf("--id") + 1];
        if (itemId === "ITEM_2") throw new Error("simulated provider failure");
        await new Promise((resolve) => setTimeout(resolve, 15));
        return { stdout: "" };
      } },
    ], calls),
  });

  await assert.rejects(
    adapter.sync({ config, records, buildUnits: [] }),
    /Projection failed for TICKET-0002\. Completed: TICKET-0001, TICKET-0003\. Not started: TICKET-0004, TICKET-0005.*simulated provider failure/,
  );
  assert.deepEqual(calls.filter((call) => call.args.includes("item-edit")).map((call) => call.args[call.args.indexOf("--id") + 1]).sort(), ["ITEM_1", "ITEM_2", "ITEM_3"]);
});

test("sync consolidates all managed ticket-label changes into one issue edit", async () => {
  const ticket = numberedRecord(1, {
    status: "out-of-scope",
    buildUnits: ["BU-001"],
    buildUnitDisposition: null,
  });
  const issue = {
    number: 1,
    url: "https://github.com/owner/repository/issues/1",
    title: ticket.issueTitle,
    body: ticket.body,
    labels: [
      { name: "BU-999 — Stale" },
      { name: "REPO-001 — Obsolete" },
      { name: "Technical Decision" },
      { name: "needs-review" },
      { name: "security" },
    ],
  };
  const repositoryLabels = [
    { name: buildUnitRecord.label, color: "5319e7", description: "Software Design Build Unit BU-001" },
    { name: "Technical Decision", color: "1d76db", description: "Stable Software Design decision issue" },
    { name: "Out-of-Scope", color: "c2e0c6", description: "Top-level Software Design item outside the target scope" },
  ];
  const calls = [];
  const adapter = createGitHubAdapter({
    run: runner([
      { when: ({ command, args }) => command === "gh" && args.join(" ").includes("issues?state=all"), result: () => json([[issue]]) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("view"), result: () => json({ id: "PVT_1" }) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("field-list"), result: () => json({ fields: completeProjectFields() }) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("item-list"), result: () => json({ items: [matchingTicketItem(ticket, 1, "ITEM_1")] }) },
      { when: ({ command, args }) => command === "gh" && args[0] === "label" && args[1] === "list", result: () => json(repositoryLabels) },
      { when: ({ command, args }) => command === "gh" && args[0] === "issue" && args[1] === "edit", result: () => ({ stdout: "" }) },
    ], calls),
  });

  await adapter.sync({ config, records: [ticket], buildUnits: [buildUnitRecord] });
  const issueEdits = calls.filter((call) => call.args[0] === "issue" && call.args[1] === "edit");
  assert.equal(issueEdits.length, 1);
  assert.equal(issueEdits[0].args[issueEdits[0].args.indexOf("--add-label") + 1], "BU-001 — Shared Library,Out-of-Scope");
  assert.equal(issueEdits[0].args[issueEdits[0].args.indexOf("--remove-label") + 1], "BU-999 — Stale,REPO-001 — Obsolete,Technical Decision");
  assert.equal(issueEdits[0].args.join(" ").includes("security"), false);
});

test("sync refuses a potentially truncated repository label listing before creating labels", async () => {
  const calls = [];
  const adapter = createGitHubAdapter({
    run: runner([
      { when: ({ command, args }) => command === "gh" && args.join(" ").includes("issues?state=all"), result: () => json([[
        { number: 3, url: "https://github.com/owner/repository/issues/3", title: record.issueTitle, body: record.body, labels: [] },
      ]]) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("view"), result: () => json({ id: "PVT_1" }) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("field-list"), result: () => json({ fields: completeProjectFields() }) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("item-list"), result: () => json({ items: [] }) },
      { when: ({ command, args }) => command === "gh" && args[0] === "label" && args[1] === "list", result: () => json(Array.from({ length: 1000 }, (_, index) => ({ name: `other-${index}`, color: "ffffff", description: "" }))) },
    ], calls),
  });
  await assert.rejects(adapter.sync({ config, records: [record], buildUnits: [buildUnitRecord] }), /repository label listing reached the 1000-label limit/);
  assert.equal(calls.some((call) => call.args[0] === "label" && call.args[1] === "create"), false);
});

test("reconcile reports Build Unit label drift without writing or inspecting draft items", async () => {
  const calls = [];
  const adapter = createGitHubAdapter({
    run: runner([
      { when: ({ command, args }) => command === "gh" && args.join(" ").includes("issues?state=all"), result: () => json([[
        { number: 3, url: "https://github.com/owner/repository/issues/3", title: record.issueTitle, body: record.body, labels: [{ name: "BU-001 — Shared Library" }] },
      ]]) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("view"), result: () => json({ id: "PVT_1" }) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("field-list"), result: () => json({ fields: completeProjectFields() }) },
      { when: ({ command, args }) => command === "gh" && args.includes("project") && args.includes("item-list"), result: () => json({ items: [{
        id: "ITEM_1", content: { number: 3 }, workArea: "Software", answeringGroup: "Ready", boardStatus: "todo", status: "todo", kind: "Software", complexity: "medium", domain: record.domainLabel, responsibility: record.responsibilityLabel, category: record.concern, buildUnits: "BU-001, BU-002", "repository Build Units": "Unmapped", "parent Decision": "None",
      }] }) },
    ], calls),
  });
  assert.deepEqual(await adapter.reconcile({ config, records: [record], buildUnits }), {
    drifts: [{ ticketId: "TICKET-0001", kinds: ["build-unit-labels"] }],
    unknownTicketIds: [],
    fixed: false,
    decisionDrifts: [],
    unknownDecisionIds: [],
  });
  assert.equal(calls.length, 5);
});

test("publish-draft rejects a non-generated current branch before staging, committing, pushing, or PR creation", async () => {
  const calls = [];
  const adapter = createGitHubAdapter({
    run: runner([{ when: ({ command, args }) => command === "git" && args.join(" ") === "branch --show-current", result: () => ({ stdout: "feature/unrelated\n" }) }], calls),
  });
  await assert.rejects(adapter.publishDraft({ config, files: ["design/software-design/flows/a.md"], title: "Update", bodyFile: "/tmp/body.md" }), /main or a td\/github-comments/);
  assert.equal(calls.length, 1);
});

test("publish-draft resumes a committed generated branch, pushes its exact HEAD, and creates one verified draft PR", async () => {
  const calls = [];
  let remoteReads = 0;
  let prLists = 0;
  const branch = "td/github-comments-2026-07-30T11-12-13Z";
  const adapter = createGitHubAdapter({
    run: runner([
      { when: ({ command, args }) => command === "git" && args.join(" ") === "branch --show-current", result: () => ({ stdout: `${branch}\n` }) },
      { when: ({ command, args }) => command === "git" && args.join(" ") === "status --porcelain=v1 -z --untracked-files=all", result: () => ({ stdout: "" }) },
      { when: ({ command, args }) => command === "git" && args.join(" ") === "diff --name-only main...HEAD", result: () => ({ stdout: "design/software-design/flows/a.md\n" }) },
      { when: ({ command, args }) => command === "git" && args[0] === "add", result: () => ({ stdout: "" }) },
      { when: ({ command, args }) => command === "git" && args.join(" ") === "diff --cached --name-only", result: () => ({ stdout: "" }) },
      { when: ({ command, args }) => command === "git" && args.join(" ") === "rev-parse HEAD", result: () => ({ stdout: "abc123\n" }) },
      { when: ({ command, args }) => command === "git" && args[0] === "ls-remote", result: () => ({ stdout: ++remoteReads === 1 ? "" : `abc123\trefs/heads/${branch}\n` }) },
      { when: ({ command, args }) => command === "git" && args[0] === "push", result: () => ({ stdout: "" }) },
      { when: ({ command, args }) => command === "gh" && args.join(" ").startsWith("pr list"), result: () => json(++prLists === 1 ? [] : [{ number: 9, url: "https://github.com/owner/repository/pull/9" }]) },
      { when: ({ command, args }) => command === "gh" && args.join(" ").startsWith("pr create"), result: () => ({ stdout: "https://github.com/owner/repository/pull/9\n" }) },
      { when: ({ command, args }) => command === "gh" && args.join(" ").startsWith("pr view"), result: () => json({ url: "https://github.com/owner/repository/pull/9", isDraft: true, state: "OPEN", baseRefName: "main", headRefName: branch, headRefOid: "abc123", files: [{ path: "design/software-design/flows/a.md" }] }) },
    ], calls),
  });
  const result = await adapter.publishDraft({ config, files: ["design/software-design/flows/a.md"], title: "Update retry", bodyFile: "/tmp/body.md" });
  assert.equal(result.url, "https://github.com/owner/repository/pull/9");
  assert.equal(calls.some((call) => call.args[0] === "commit"), false);
  assert.deepEqual(calls.find((call) => call.args[0] === "add").args, ["add", "--", "design/software-design/flows/a.md"]);
  assert.equal(calls.filter((call) => call.args[0] === "push").length, 1);
});

test("publish-draft rejects an extra working-tree path before it can stage either path", async () => {
  const calls = [];
  const adapter = createGitHubAdapter({
    run: runner([
      { when: ({ command, args }) => command === "git" && args.join(" ") === "branch --show-current", result: () => ({ stdout: "main\n" }) },
      { when: ({ command, args }) => command === "git" && args.join(" ") === "status --porcelain=v1 -z --untracked-files=all", result: () => ({ stdout: " M design/software-design/flows/a.md\0 M README.md\0" }) },
      { when: ({ command, args }) => command === "git" && args.join(" ") === "diff --name-only main...HEAD", result: () => ({ stdout: "" }) },
    ], calls),
  });
  await assert.rejects(adapter.publishDraft({ config, files: ["design/software-design/flows/a.md"], title: "Update", bodyFile: "/tmp/body.md" }), /path set must equal/);
  assert.equal(calls.some((call) => call.args[0] === "add"), false);
  assert.equal(calls.some((call) => call.args[0] === "switch"), false);
});

test("changed summaries refuse an unverified PR and do not post a comment or marker", async () => {
  const calls = [];
  const adapter = createGitHubAdapter({
    run: runner([
      { when: ({ command, args }) => command === "gh" && args.join(" ") === "api user", result: () => json({ login: "bot" }) },
      { when: ({ command, args }) => command === "gh" && args.join(" ").includes("issues?state=all"), result: () => json([[{ number: 3, url: "https://github.com/owner/repository/issues/3", body: record.body }]]) },
      { when: ({ command, args }) => command === "gh" && args.join(" ").includes("issues/3/comments"), result: () => json([]) },
      { when: ({ command, args }) => command === "gh" && args.includes("pr") && args.includes("view"), result: () => json({ url: "https://github.com/owner/repository/pull/9", isDraft: false, state: "OPEN", baseRefName: "main", headRefName: "td/github-comments-2026-07-30T11-12-13Z", headRefOid: "deadbeef", files: [{ path: "design/software-design/flows/a.md" }] }) },
    ], calls),
  });
  await assert.rejects(adapter.postSummaries({
    config,
    records: [record],
    results: [{
      ticketId: record.id,
      sourceCommentUrls: [],
      processedThroughCommentUrl: null,
      understoodInput: "Input",
      outcome: "changed",
      reason: "Changed canonically.",
      canonicalFiles: ["design/software-design/flows/a.md"],
      draftPrUrl: "https://github.com/owner/repository/pull/9",
      clarificationQuestion: null,
    }],
  }), /verified open draft PR/);
  assert.equal(calls.some((call) => call.args.includes("comment")), false);
});

test("post-summaries rejects duplicate ticket results before any provider call", async () => {
  const result = {
    ticketId: record.id,
    sourceCommentUrls: [],
    processedThroughCommentUrl: null,
    understoodInput: "Already covered.",
    outcome: "no-change",
    reason: "The canonical design already says this.",
    canonicalFiles: [],
    draftPrUrl: null,
    clarificationQuestion: null,
  };
  const calls = [];
  const adapter = createGitHubAdapter({
    run: async (request) => {
      calls.push(request);
      return { stdout: "" };
    },
  });
  await assert.rejects(
    adapter.postSummaries({ config, records: [record], results: [result, { ...result }] }),
    /Duplicate summary result.*TICKET-0001/,
  );
  assert.deepEqual(calls, []);
});

test("an exact prior adapter-authored no-change summary is reused without a second provider write", async () => {
  const result = {
    ticketId: record.id,
    sourceCommentUrls: [],
    processedThroughCommentUrl: null,
    understoodInput: "Already covered.",
    outcome: "no-change",
    reason: "The canonical design already says this.",
    canonicalFiles: [],
    draftPrUrl: null,
    clarificationQuestion: null,
  };
  const body = renderSummary(result);
  const calls = [];
  const adapter = createGitHubAdapter({
    run: runner([
      { when: ({ command, args }) => command === "gh" && args.join(" ") === "api user", result: () => json({ login: "bot" }) },
      { when: ({ command, args }) => command === "gh" && args.join(" ").includes("issues?state=all"), result: () => json([[{ number: 3, url: "https://github.com/owner/repository/issues/3", body: record.body }]]) },
      { when: ({ command, args }) => command === "gh" && args.join(" ").includes("issues/3/comments"), result: () => json([[{ id: 8, url: "https://github.com/owner/repository/issues/3#issuecomment-8", body, author: { login: "bot" } }]]) },
    ], calls),
  });
  assert.deepEqual(await adapter.postSummaries({ config, records: [record], results: [result] }), { posted: [{ ticketId: record.id, action: "already-posted" }] });
  assert.equal(calls.some((call) => call.args.includes("comment")), false);
});

test("retirement reconciles existing projected records without creating archived issues and is idempotent", async () => {
  const calls = [];
  let issue = { number: 3, url: 'https://github.com/owner/repository/issues/3', title: record.issueTitle, body: record.body, state: 'open', labels: [] };
  let items = [{ id: 'ITEM_RETIRED', content: { number: 3 } }];
  const archived = { id: record.id, title: 'Select retry policy', closed_reason: 'duplicate', status_at_close: 'todo', replaced_by: ['TICKET-0002'], parent_decision: 'TD-001', sourcePath: 'design/software-design/build/workflow/tickets/example/sr-001/sr-001-tickets.yaml' };
  const adapter = createGitHubAdapter({ run: runner([
    { when: ({ args }) => args.join(' ').includes('issues?state=all'), result: () => json([[issue]]) },
    { when: ({ args }) => args[0] === 'project' && args[1] === 'view', result: () => json({ id: 'PVT_1' }) },
    { when: ({ args }) => args[0] === 'project' && args[1] === 'field-list', result: () => json({ fields: completeProjectFields() }) },
    { when: ({ args }) => args[0] === 'project' && args[1] === 'item-list', result: () => json({ items }) },
    { when: ({ args }) => args[0] === 'label' && args[1] === 'list', result: () => json([]) },
    { when: ({ args }) => args[0] === 'api' && args[1] === 'repos/owner/repository/issues/3' && args.includes('PATCH'), result: ({ input }) => { issue = { ...issue, ...JSON.parse(input) }; return json(issue); } },
    { when: ({ args }) => args[0] === 'project' && args[1] === 'item-delete', result: () => { items = []; return json({}); } },
  ], calls) });
  const input = { config, records: [], archivedRecords: [archived, { ...archived, id: 'TICKET-0004', closed_reason: 'obsolete', replaced_by: [] }] };
  const before = await adapter.reconcile(input);
  assert.deepEqual(before.unknownTicketIds, []);
  assert.deepEqual(before.drifts[0].kinds, ['archived-issue-open', 'archived-body', 'archived-project-membership']);
  assert.equal(issue.state, 'open');
  const result = await adapter.sync(input);
  assert.deepEqual(result.archivedCompleted, ['TICKET-0001']);
  assert.equal(issue.state, 'closed');
  assert.match(issue.body, /duplicate/);
  assert.match(issue.body, /TICKET-0002/);
  assert.match(issue.body, /TD-001/);
  assert.deepEqual(items, []);
  const mutationCount = () => calls.filter(({ args }) => args.includes('PATCH') || args.includes('item-delete')).length;
  assert.equal(mutationCount(), 2);
  assert.deepEqual((await adapter.reconcile(input)).drifts, []);
  await adapter.sync(input);
  assert.equal(mutationCount(), 2);
  assert.equal(calls.some(({ args }) => args[0] === 'issue' && args[1] === 'create'), false);
});

for (const operation of ["sync", "syncViews"]) {
  for (const [scenario, override, expected] of [
    ["missing branch configuration", null, /syncBranch/],
    ["wrong branch", { symbolic: "feature" }, /Wrong branch/],
    ["detached HEAD", { fail: "symbolic-ref" }, /Detached HEAD/],
    ["untracked changes", { status: "?? scratch.md\0" }, /Local changes/],
    ["staged changes", { status: "M  design/file.md\0" }, /Local changes/],
    ["unstaged changes", { status: " M outside-design.md\0" }, /Local changes/],
    ["missing origin", { fail: "remote" }, /Missing origin/],
    ["failed fetch or missing remote branch", { fail: "fetch" }, /Fetch failure/],
    ["unpushed commits", { counts: "1\t0" }, /Unpushed commits/],
    ["behind remote", { counts: "0\t2" }, /Behind remote/],
    ["diverged history", { counts: "2\t3" }, /Diverged history/],
    ["indeterminate history", { counts: "unknown" }, /Indeterminate history/],
    ["indeterminate commit", { sha: "" }, /Indeterminate local/],
  ]) {
    test(`${operation}: ${scenario} prevents every GitHub call, including setup`, async () => {
      const calls = [];
      const adapter = createGitHubAdapter({ run: runner([{
        when: ({ command }) => command === "git",
        result: ({ args }) => {
          if (args[0] === override?.fail) throw new Error("unavailable");
          if (args[0] === "symbolic-ref") return { stdout: override?.symbolic || "main" };
          if (args[0] === "status") return { stdout: override?.status || "" };
          if (args[0] === "remote") return { stdout: "https://github.com/owner/repository.git" };
          if (args[0] === "rev-list") return { stdout: override.counts };
          if (args[0] === "rev-parse") return { stdout: args.includes("--show-toplevel") ? "/tmp/consumer" : Object.hasOwn(override || {}, "sha") ? override.sha : (args[2] === "HEAD^{commit}" || !override?.counts ? "a" : "b").repeat(40) };
          return { stdout: "" };
        },
      }], calls) });
      const input = { config: override === null ? { ...config, syncBranch: undefined } : config, records: [] };
      await assert.rejects(adapter[operation](input), expected);
      assert.equal(calls.some(({ command }) => command === "gh"), false);
    });
  }
}

test("view audit stays read-only and does not require the publishing branch", async () => {
  const calls = [];
  const adapter = createGitHubAdapter({ run: runner([
    { when: ({ command, args }) => command === "gh" && args[0] === "project", result: () => json({ id: "PVT_1" }) },
    { when: ({ command, args }) => command === "gh" && args[1] === "graphql", result: () => json({ data: { node: { fields: { nodes: [] }, views: { nodes: [] } } } }) },
  ], calls) });
  const result = await adapter.projectViewAudit({ config: { ...config, syncBranch: "shared" } });
  assert.equal(result.apiPassed, false);
  assert.equal(calls.some(({ command }) => command === "git"), false);
});


for (const complexity of ["low", "medium", "high"]) {
  test(`sync projects complexity ${complexity} as a single-select option`, async () => {
    const ticket = { ...record, complexity, buildUnits: [] };
    const item = matchingTicketItem(ticket, 3, "ITEM_1");
    item.fieldValues.nodes = item.fieldValues.nodes.filter((value) => value.field.name !== "Complexity");
    const calls = [];
    const adapter = createGitHubAdapter({ run: runner([
      { when: ({ args }) => args.join(" ").includes("issues?state=all"), result: () => json([[{ number: 3, title: ticket.issueTitle, body: ticket.body, labels: [workflowLabel] }]]) },
      { when: ({ args }) => args[0] === "project" && args[1] === "view", result: () => json({ id: "PVT_1" }) },
      { when: ({ args }) => args[1] === "field-list", result: () => json({ fields: completeProjectFields() }) },
      { when: ({ args }) => args[1] === "item-list", result: () => json({ items: [item] }) },
      { when: ({ args }) => args[0] === "label" && args[1] === "list", result: () => json([workflowLabel]) },
      { when: ({ args }) => args[1] === "item-edit", result: () => json({}) },
    ], calls) });
    const drift = await adapter.reconcile({ config, records: [ticket] });
    assert.deepEqual(drift.drifts, [{ ticketId: ticket.id, kinds: ["project-Complexity"] }]);
    assert.equal(calls.some(({ command }) => command === "git"), false);
    await adapter.sync({ config, records: [ticket] });
    const edits = calls.filter(({ args }) => args[1] === "item-edit");
    assert.equal(edits.length, 1);
    assert.ok(edits[0].args.includes("F_COMPLEXITY"));
    assert.ok(edits[0].args.includes(`O_${complexity.toUpperCase()}`));
  });
}

for (const invalid of ["missing", "wrong-type", "wrong-order"]) {
  test(`complexity schema ${invalid} blocks publishing before mutation`, async () => {
    let fields = completeProjectFields();
    if (invalid === "missing") fields = fields.filter((field) => field.name !== "Complexity");
    else if (invalid === "wrong-type") fields.find((field) => field.name === "Complexity").type = "ProjectV2Field";
    else fields.find((field) => field.name === "Complexity").options.reverse();
    const calls = [];
    const adapter = createGitHubAdapter({ run: runner([
      { when: ({ args }) => args.join(" ").includes("issues?state=all"), result: () => json([[]]) },
      { when: ({ args }) => args[0] === "project" && args[1] === "view", result: () => json({ id: "PVT_1" }) },
      { when: ({ args }) => args[1] === "field-list", result: () => json({ fields }) },
      { when: ({ args }) => args[1] === "item-list", result: () => json({ items: [] }) },
    ], calls) });
    await assert.rejects(adapter.sync({ config, records: [] }), /Complexity/);
    assert.equal(calls.some(({ args }) => args.some((arg) => ["create", "item-edit", "item-add", "edit", "PATCH"].includes(arg))), false);
  });
}


test("sync and reconcile reuse bulk issue identities for named prerequisite and parent links", async () => {
  const parentUrl = "https://github.com/owner/repository/issues/8";
  const dependencyUrl = "https://github.com/owner/repository/issues/4";
  const dependency = { ...record, id: "TICKET-0002", issueTitle: "TICKET-0002 — Prevent duplicate delivery", body: "<!-- software-design-ticket TICKET-0002 -->\nDependency body", buildUnits: [] };
  const main = { ...record, buildUnits: [], sourcePath: "design/software-design/build/workflow/tickets/delivery.yaml", question: "When should we retry?", context: "Retries can duplicate a notification.", options: ["Retry once", "Ask staff"], recommendation: "Retry once if duplicate requests are safe.", dependencies: [dependency.id], dependencyDetails: [{ id: dependency.id, title: "Prevent duplicate delivery", status: "finished" }], parentDecision: decision.id, parentDecisionTitle: decision.issueTitle.split(" — ")[1] };
  main.body = renderIssueBody(main);
  const expectedBody = renderIssueBody({ ...main, parentDecisionUrl: parentUrl, waitingOnDetails: ["TICKET-0002: answer required"], dependencyDetails: [{ ...main.dependencyDetails[0], issueUrl: dependencyUrl }] });
  const calls = [];
  let mainBody = main.body;
  const adapter = createGitHubAdapter({ run: runner([
    { when: ({ args }) => args.join(" ").includes("issues?state=all"), result: () => json([[
      { number: 3, url: "https://github.com/owner/repository/issues/3", title: main.issueTitle, body: mainBody, labels: [workflowLabel] },
      { number: 4, url: dependencyUrl, title: dependency.issueTitle, body: dependency.body, labels: [workflowLabel] },
      { number: 8, url: parentUrl, title: decision.issueTitle, body: "<!-- software-design-decision TD-001 -->", labels: [] },
    ]]) },
    { when: ({ args }) => args[0] === "project" && args[1] === "view", result: () => json({ id: "PVT_1" }) },
    { when: ({ args }) => args[1] === "field-list", result: () => json({ fields: completeProjectFields() }) },
    { when: ({ args }) => args[1] === "item-list", result: () => json({ items: [matchingTicketItem(main, 3, "ITEM_1"), matchingTicketItem(dependency, 4, "ITEM_2")] }) },
    { when: ({ args }) => args[0] === "label" && args[1] === "list", result: () => json([workflowLabel]) },
    { when: ({ args }) => args[0] === "label", result: () => json({}) },
    { when: ({ args }) => args[0] === "api" && args.includes("PATCH"), result: ({ args, input }) => { if (args[1].endsWith("/3")) mainBody = JSON.parse(input).body; return json({}); } },
    { when: ({ args }) => args[0] === "project" && args[1] === "item-add", result: () => json({ id: "ITEM_TD" }) },
    { when: ({ args }) => args[0] === "project" && args[1] === "item-edit", result: () => json({}) },
    { when: ({ args }) => args[0] === "issue" && args[1] === "edit", result: ({ args }) => { if (args[2] === "3" && args.includes("--body")) mainBody = args[args.indexOf("--body") + 1]; return json({}); } },
  ], calls) });
  const input = { config, records: [main, dependency], decisions: [decision] };
  await adapter.sync(input);
  assert.equal(mainBody, expectedBody);
  const result = await adapter.reconcile(input);
  assert.equal(result.drifts.some((drift) => drift.ticketId === main.id && drift.kinds.includes("body")), false);
  assert.equal(calls.filter(({ args }) => args.join(" ").includes("issues?state=all")).length, 2);
  assert.equal(calls.some(({ args }) => /^repos\/owner\/repository\/issues\/\d+$/.test(args[1] || "") && !args.includes("PATCH")), false);
  assert.equal(main.body.includes(parentUrl), false, "Rendering must not mutate the canonical input");
});

test("sync and reconcile refresh unchanged dependent cards, clear inactive fields, and converge", async () => {
  const dependent = numberedRecord(1, { question: "Dependent question", context: "Context", sourcePath: "tickets.yaml", title: "Dependent", dependencies: ["TICKET-0002"] });
  const prerequisite = numberedRecord(2, { title: "Prerequisite", dependencies: [] });
  dependent.body = renderIssueBody(dependent);
  const records = [dependent, prerequisite];
  const items = records.map((r, i) => matchingTicketItem(r, i + 1, `ITEM_${i + 1}`));
  const fields = completeProjectFields();
  const issues = records.map((r, i) => ({ number: i + 1, url: `https://github.com/owner/repository/issues/${i + 1}`, title: r.issueTitle, body: r.body, labels: [workflowLabel] }));
  const calls = [];
  const adapter = createGitHubAdapter({ run: runner([
    { when: ({ args }) => args.join(" ").includes("issues?state=all"), result: () => json([issues]) },
    { when: ({ args }) => args[0] === "project" && args[1] === "view", result: () => json({ id: "PVT_1" }) },
    { when: ({ args }) => args[1] === "field-list", result: () => json({ fields }) },
    { when: ({ args }) => args[1] === "item-list", result: () => json({ items }) },
    { when: ({ args }) => args[0] === "label" && args[1] === "list", result: () => json([workflowLabel]) },
    { when: ({ args }) => args[0] === "issue" && args[1] === "edit", result: ({ args }) => {
      issues.find((i) => String(i.number) === args[2]).body = args[args.indexOf("--body") + 1];
      return json({});
    } },
    { when: ({ args }) => args[0] === "project" && args[1] === "item-edit", result: ({ args }) => {
      const item = items.find((i) => i.id === args[args.indexOf("--id") + 1]);
      const field = fields.find((f) => f.id === args[args.indexOf("--field-id") + 1]);
      item.fieldValues.nodes = item.fieldValues.nodes.filter((v) => v.field.name !== field.name);
      if (!args.includes("--clear")) {
        const value = args.includes("--text") ? args[args.indexOf("--text") + 1] : field.options.find((o) => o.id === args[args.indexOf("--single-select-option-id") + 1]).name;
        item.fieldValues.nodes.push({ field: { name: field.name }, text: value });
      }
      return json({});
    } },
  ], calls) });
  const input = { config, records };
  await adapter.sync(input);
  assert.deepEqual((await adapter.reconcile(input)).drifts, []);
  assert.equal(items[0].fieldValues.nodes.find((v) => v.field.name === "Answering group").text, "Waiting for answers");
  assert.equal(items[0].fieldValues.nodes.find((v) => v.field.name === "Board status").text, "Waiting");
  assert.match(issues[0].body, /## Waiting on/);
  const unchanged = structuredClone(dependent);
  prerequisite.status = "decided"; prerequisite.resolution = "Approved";
  const drift = await adapter.reconcile(input);
  assert.ok(drift.drifts.find((d) => d.ticketId === dependent.id).kinds.includes("project-Answering group"));
  assert.deepEqual(drift.decidedTickets, [prerequisite.id]);
  const start = calls.length;
  const result = await adapter.sync(input);
  assert.match(result.completionNotice, /canonical completion/);
  assert.deepEqual(dependent, unchanged);
  assert.equal(items[0].fieldValues.nodes.find((v) => v.field.name === "Answering group").text, "Ready");
  assert.equal(items[0].fieldValues.nodes.some((v) => v.field.name === "Waiting on"), false);
  assert.equal(items[0].fieldValues.nodes.find((v) => v.field.name === "Board status").text, "todo");
  assert.doesNotMatch(issues[0].body, /## Waiting on/);
  assert.ok(calls.slice(start).some((c) => c.args.includes("ITEM_2") && c.args.includes("F_WORK_AREA") && c.args.includes("--clear")));
  const after = calls.length;
  await adapter.sync(input);
  assert.equal(calls.slice(after).filter((c) => c.args.includes("item-edit")).length, 0);
  assert.deepEqual((await adapter.reconcile(input)).drifts, []);
});

test("TD records report and clear all stale ticket-board values without native dependency writes", async () => {
  const item = { id: "ITEM_TD", content: { number: 8 }, fieldValues: { nodes: [
    { field: { name: "Work area" }, text: "Technical" },
    { field: { name: "Answering group" }, name: "Ready" },
    { field: { name: "Waiting on" }, text: "Old prerequisite" },
  ] } };
  const calls = [];
  const adapter = createGitHubAdapter({ run: runner([
    { when: ({ args }) => args.join(" ").includes("issues?state=all"), result: () => json([[{ number: 8, url: "https://github.com/owner/repository/issues/8", title: decision.issueTitle, body: "<!-- software-design-decision TD-001 -->", labels: [{ name: "Technical Decision" }, { name: "Out-of-Scope" }] }]]) },
    { when: ({ args }) => args[1] === "view", result: () => json({ id: "PVT_1" }) },
    { when: ({ args }) => args[1] === "field-list", result: () => json({ fields: completeProjectFields() }) },
    { when: ({ args }) => args[1] === "item-list", result: () => json({ items: [item] }) },
    { when: ({ args }) => args[0] === "label" && args[1] === "list", result: () => json([]) },
    { when: ({ args }) => args[0] === "label", result: () => json({}) },
    { when: ({ args }) => args[0] === "issue" && args[1] === "edit", result: () => json({}) },
    { when: ({ args }) => args[1] === "item-edit", result: () => json({}) },
  ], calls) });
  const input = { config, records: [], decisions: [decision] };
  const drift = await adapter.reconcile(input);
  for (const name of ["Work area", "Answering group", "Waiting on"]) assert.ok(drift.decisionDrifts[0].kinds.includes(`project-${name}`));
  await adapter.sync(input);
  for (const id of ["F_WORK_AREA", "F_ANSWERING_GROUP", "F_WAITING_ON"]) assert.ok(calls.some((c) => c.args.includes(id) && c.args.includes("--clear")));
  assert.equal(calls.some((c) => /blocked_by|dependencies|addBlockedBy/.test(c.input || c.args.join(" "))), false);
});


test("legacy Kind schema blocks every GitHub write until explicitly migrated in place", async () => {
  const fields = completeProjectFields();
  fields.find(({ name }) => name === "Kind").options[0].name = "technical";
  const calls = [];
  const adapter = createGitHubAdapter({ run: runner([
    { when: ({ args }) => args.join(" ").includes("issues?state=all"), result: () => json([[]]) },
    { when: ({ args }) => args[0] === "project" && args[1] === "view", result: () => json({ id: "PVT_1" }) },
    { when: ({ args }) => args[1] === "field-list", result: () => json({ fields }) },
    { when: ({ args }) => args[1] === "item-list", result: () => json({ items: [] }) },
  ], calls) });
  await assert.rejects(adapter.sync({ config, records: [record] }), /Explicit migration required: rename existing Kind option O_TECHNICAL.*F_KIND/);
  assert.equal(calls.some(({ args }) => args.some((arg) => ["create", "item-edit", "item-add", "edit", "PATCH", "--input"].includes(arg))), false);
  assert.equal(fields.find(({ name }) => name === "Kind").options[0].name, "technical");
});

test("Software display reuses the existing Kind ID and updates Work area without recreating views or items", async () => {
  const ticket = { ...record, buildUnits: [] };
  const item = matchingTicketItem(ticket, 3, "ITEM_1");
  item.fieldValues.nodes = item.fieldValues.nodes.filter(({ field }) => field.name !== "Kind");
  item.fieldValues.nodes.find(({ field }) => field.name === "Work area").text = "Technical";
  const fields = completeProjectFields();
  const fieldSnapshot = structuredClone(fields);
  const calls = [];
  const adapter = createGitHubAdapter({ run: runner([
    { when: ({ args }) => args.join(" ").includes("issues?state=all"), result: () => json([[{ number: 3, title: ticket.issueTitle, body: ticket.body, labels: [workflowLabel] }]]) },
    { when: ({ args }) => args[0] === "project" && args[1] === "view", result: () => json({ id: "PVT_1" }) },
    { when: ({ args }) => args[1] === "field-list", result: () => json({ fields }) },
    { when: ({ args }) => args[1] === "item-list", result: () => json({ items: [item] }) },
    { when: ({ args }) => args[0] === "label" && args[1] === "list", result: () => json([workflowLabel]) },
    { when: ({ args }) => args[1] === "item-edit", result: ({ args }) => {
      assert.equal(args[args.indexOf("--id") + 1], "ITEM_1");
      const id = args[args.indexOf("--field-id") + 1];
      if (id === "F_KIND") {
        assert.equal(args[args.indexOf("--single-select-option-id") + 1], "O_TECHNICAL");
        item.fieldValues.nodes.push({ field: { name: "Kind" }, name: "Software" });
      } else {
        assert.equal(id, "F_WORK_AREA");
        assert.equal(args[args.indexOf("--text") + 1], "Software");
        item.fieldValues.nodes.find(({ field }) => field.name === "Work area").text = "Software";
      }
      return json({});
    } },
  ], calls) });
  await adapter.sync({ config, records: [ticket] });
  assert.equal(calls.filter(({ args }) => args[1] === "item-edit").length, 2);
  const firstCount = calls.length;
  await adapter.sync({ config, records: [ticket] });
  assert.equal(calls.slice(firstCount).some(({ args }) => args[1] === "item-edit"), false);
  assert.deepEqual((await adapter.reconcile({ config, records: [ticket] })).drifts, []);
  assert.equal(calls.some(({ args }) => args.includes("item-add") || args.includes("create") || args.includes("--input")), false);
  assert.equal(ticket.kind, "technical");
  assert.deepEqual(fields, fieldSnapshot);
  assert.equal(item.fieldValues.nodes.find(({ field }) => field.name === "Domain").text, ticket.domainLabel);
});

// Stateful provider fixture: unknown writes fail, including issue/item creation.
function identityMigrationFixture({ namespace = "technical", aliases = false, interrupted = false } = {}) {
  const ticket = numberedRecord(1, { question: "Which representation?", context: "Fixed behavior", sourcePath: "tickets.yaml" });
  ticket.body = renderIssueBody(ticket);
  const issues = [
    { number: 3, url: "https://github.com/owner/repository/issues/3", title: ticket.issueTitle, state: "CLOSED", comments: [{ id: 9, body: "Preserve this discussion" }], labels: [workflowLabel], body: `<!-- ${namespace}-design-ticket TICKET-0001 -->${aliases ? "\n<!-- software-design-ticket TICKET-0001 -->" : ""}\nOld body` },
    { number: 8, url: "https://github.com/owner/repository/issues/8", title: decision.issueTitle, state: "OPEN", comments: [], labels: [{ name: "Technical Decision" }, { name: "Out-of-Scope" }], body: `<!-- ${namespace}-design-decision TD-001 -->${aliases ? "\n<!-- software-design-decision TD-001 -->" : ""}\nOld TD body` },
    { number: 99, title: ticket.issueTitle, body: "<!-- casino-migration-history TICKET-0001 -->", state: "CLOSED", comments: [], labels: [] },
  ];
  const historical = structuredClone(issues[2]);
  const items = [matchingTicketItem(ticket, 3, "STABLE_ITEM"), { id: "STABLE_TD_ITEM", content: { number: 8 }, fieldValues: { nodes: [] } }];
  items[0].fieldValues.nodes.push({ field: { name: "Unmanaged notes" }, text: "Preserve" });
  const fields = completeProjectFields();
  const calls = [];
  let failOnce = interrupted;
  const adapter = createGitHubAdapter({ run: runner([
    { when: ({ args }) => args.join(" ").includes("issues?state=all"), result: () => json([issues]) },
    { when: ({ args }) => args[0] === "project" && args[1] === "view", result: () => json({ id: "PVT_1" }) },
    { when: ({ args }) => args[1] === "field-list", result: () => json({ fields }) },
    { when: ({ args }) => args[1] === "item-list", result: () => json({ items }) },
    { when: ({ args }) => args[0] === "label" && args[1] === "list", result: () => json([workflowLabel, { name: "Technical Decision", color: "5319e7", description: "Stable Software Design Technical Decision" }, { name: "Out-of-Scope", color: "b60205", description: "Deferred decision or standalone out-of-scope ticket" }]) },
    { when: ({ args }) => args[0] === "label" && ["create", "edit"].includes(args[1]), result: () => json({}) },
    { when: ({ args }) => args[0] === "issue" && args[1] === "edit", result: ({ args }) => {
      const issue = issues.find((i) => String(i.number) === args[2]);
      if (args.includes("--body")) issue.body = args[args.indexOf("--body") + 1];
      if (args.includes("--title")) issue.title = args[args.indexOf("--title") + 1];
      if (failOnce) { failOnce = false; throw new Error("Connection lost after saved body edit"); }
      return json({});
    } },
    { when: ({ args }) => args[0] === "project" && args[1] === "item-edit", result: ({ args }) => {
      const item = items.find((i) => i.id === args[args.indexOf("--id") + 1]);
      const field = fields.find((f) => f.id === args[args.indexOf("--field-id") + 1]);
      item.fieldValues.nodes = item.fieldValues.nodes.filter((v) => v.field.name !== field.name);
      if (!args.includes("--clear")) {
        const text = args.includes("--text") ? args[args.indexOf("--text") + 1] : field.options.find((o) => o.id === args[args.indexOf("--single-select-option-id") + 1]).name;
        item.fieldValues.nodes.push({ field: { name: field.name }, text });
      }
      return json({});
    } },
  ], calls) });
  return { adapter, input: { config, records: [ticket], decisions: [decision] }, issues, items, calls, historical, fields };
}

for (const options of [{ namespace: "technical" }, { namespace: "software" }, { namespace: "technical", aliases: true }, { namespace: "technical", interrupted: true }]) {
  test(`stable legacy/current identity adoption preserves history and converges: ${JSON.stringify(options)}`, async () => {
    const f = identityMigrationFixture(options);
    const beforeComments = structuredClone(f.issues.map((i) => i.comments));
    if (options.interrupted) await assert.rejects(f.adapter.sync(f.input), /Connection lost/);
    await f.adapter.sync(f.input);
    assert.match(f.issues[0].body, /^<!-- software-design-ticket TICKET-0001 -->/);
    assert.match(f.issues[1].body, /^<!-- software-design-decision TD-001 -->/);
    assert.equal(f.issues[0].state, "CLOSED");
    assert.deepEqual(f.issues.map((i) => i.comments), beforeComments);
    assert.deepEqual(f.issues[2], f.historical);
    assert.deepEqual(f.items.map((i) => i.id), ["STABLE_ITEM", "STABLE_TD_ITEM"]);
    assert.equal(f.items[0].fieldValues.nodes.find((v) => v.field.name === "Unmanaged notes").text, "Preserve");
    const reconciliation = await f.adapter.reconcile(f.input);
    assert.deepEqual(reconciliation.drifts, []);
    assert.deepEqual(reconciliation.decisionDrifts, []);
    assert.deepEqual(reconciliation.unknownTicketIds, []);
    const after = f.calls.length;
    await f.adapter.sync(f.input);
    assert.equal(f.calls.slice(after).some((c) => c.args[0] === "issue" || c.args.includes("item-edit")), false);
    assert.equal(f.calls.some((c) => c.args.includes("item-add") || c.args.includes("item-delete") || c.args[0] === "issue" && c.args[1] === "create"), false);
  });
}

for (const bodies of [
  ["<!-- technical-design-ticket TICKET-0001 -->", "<!-- software-design-ticket TICKET-0001 -->"],
  ["<!-- technical-design-decision TD-001 -->", "<!-- software-design-decision TD-001 -->"],
  ["<!-- technical-design-ticket TICKET-0001 -->\n<!-- software-design-ticket TICKET-0002 -->"],
  ["<!-- technical-design-ticket TICKET-0001 -->\n<!-- software-design-decision TD-001 -->"],
  ["<!-- technical-design-ticket TICKET-0001 -->\n<!-- technical-design-ticket TICKET-0001 -->"],
]) {
  test(`legacy and mixed identity collisions refuse all writes: ${bodies.join(" | ")}`, async () => {
    const f = identityMigrationFixture();
    f.issues.splice(0, f.issues.length, ...bodies.map((body, i) => ({ number: i + 1, body })));
    await assert.rejects(f.adapter.sync(f.input), /collision|Duplicate GitHub/);
    assert.equal(f.calls.some((c) => c.command === "gh" && ["edit", "create", "item-add", "item-edit", "PATCH"].some((word) => c.args.includes(word))), false);
  });
}

for (const invalid of ["missing", "wrong-type", "wrong-options"]) {
  test(`Board status migration fails before writes when schema is ${invalid}`, async () => {
    const f = identityMigrationFixture();
    const index = f.fields.findIndex((field) => field.name === "Board status");
    if (invalid === "missing") f.fields.splice(index, 1);
    if (invalid === "wrong-type") f.fields[index].type = "ProjectV2Field";
    if (invalid === "wrong-options") f.fields[index].options.reverse();
    await assert.rejects(f.adapter.sync(f.input), /Board status/);
    assert.equal(f.calls.some((c) => c.command === "gh" && ["edit", "create", "item-add", "item-edit", "PATCH"].some((word) => c.args.includes(word))), false);
  });
}
