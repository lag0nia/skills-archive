#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createGitHubAdapter } from "../../scripts/lib/ticket-projection/github/adapter.mjs";
import { dispatchProjection, parseViewRenameArguments, PROJECT_VIEW_CONTRACT } from "../../scripts/lib/ticket-projection/core.mjs";
import { contractViewState as contractState, fieldId, savedView } from "../support/project-view-state.mjs";

const config = { provider: "github", syncBranch: "main", ticketRoot: "design/software-design", repository: "owner/repository", project: "owner/7" };
const READ_ONLY_GIT = new Set(["check-ref-format", "symbolic-ref", "rev-parse", "status", "remote", "fetch", "rev-list"]);

function json(value) {
  return { stdout: JSON.stringify(value) };
}

function isViewRead(call) {
  return call.command === "gh" && call.args.some((arg) => arg.includes("ProjectViewConfiguration"));
}

function isViewUpdate(call) {
  return call.command === "gh" && call.args.join(" ") === "api graphql --input -" && JSON.parse(call.input).query.includes("UpdateProjectViewPresentation");
}

function updateInputs(calls) {
  return calls.filter(isViewUpdate).map((call) => JSON.parse(call.input).variables.input);
}

// Simulates GitHub's saved view state so re-reads observe accepted updates.
function githubViews(state, calls, { failUpdateFor = null, ignoreVisibleFieldsFor = null, failReread = false } = {}) {
  let reads = 0;
  return async (request) => {
    calls.push(request);
    const { command, args, input } = request;
    if (command === "git") {
      if (args[0] === "symbolic-ref") return { stdout: "main\n" };
      if (args[0] === "remote") return { stdout: "https://github.com/owner/repository.git\n" };
      if (args[0] === "rev-parse") return { stdout: args.includes("--show-toplevel") ? "/tmp/consumer\n" : `${"a".repeat(40)}\n` };
      return { stdout: "" };
    }
    if (command === "gh" && args[0] === "project" && args[1] === "view") return json({ id: "PVT_1", title: "Design", url: "https://github.com/users/owner/projects/7" });
    if (isViewRead(request)) {
      reads += 1;
      if (failReread && reads > 1) throw new Error("gh api graphql failed: HTTP 502");
      return json({ data: { node: structuredClone(state) } });
    }
    if (isViewUpdate(request)) {
      const update = JSON.parse(input).variables.input;
      if (update.viewId === failUpdateFor) throw new Error("gh api graphql --input - failed: Resource not accessible by integration");
      const view = state.views.nodes.find((candidate) => candidate.id === update.viewId);
      if (Object.hasOwn(update, "name")) view.name = update.name;
      if (Object.hasOwn(update, "layout")) view.layout = update.layout;
      if (Object.hasOwn(update, "filter")) view.filter = update.filter;
      if (update.configuration && update.viewId !== ignoreVisibleFieldsFor) {
        const fields = new Map(state.fields.nodes.map((field) => [field.id, field]));
        view.configuration.visibleFields.nodes = update.configuration.visibleFieldIds.map((id) => ({ id, name: fields.get(id).name }));
      }
      return json({ data: { updateProjectV2View: { projectV2View: { id: update.viewId } } } });
    }
    throw new Error(`Unexpected command: ${command} ${args.join(" ")}`);
  };
}

function assertPresentationOnly(calls) {
  const unexpected = calls.filter((call) => !(
    (call.command === "git" && READ_ONLY_GIT.has(call.args[0]))
    || (call.command === "gh" && call.args[0] === "project" && call.args[1] === "view")
    || isViewRead(call)
    || isViewUpdate(call)
  ));
  assert.deepEqual(unexpected.map((call) => `${call.command} ${call.args.join(" ")}`), []);
}

test("views-only repair writes only drifted supported settings with exact ordered field IDs", async () => {
  const state = contractState();
  savedView(state, "Tickets").filter = "";
  savedView(state, "All Tickets").configuration.visibleFields.nodes.reverse();
  savedView(state, "Decision Areas").layout = "BOARD_LAYOUT";
  savedView(state, "Out-of-Scope").configuration.visibleFields.nodes.push({ id: "F_SPRINT", name: "Sprint" });
  const calls = [];
  const adapter = createGitHubAdapter({ run: githubViews(state, calls) });

  const result = await adapter.syncViews({ config, repositories: [] });

  assert.deepEqual(updateInputs(calls), [
    { viewId: "PVTV_1", filter: PROJECT_VIEW_CONTRACT[0].filter },
    { viewId: "PVTV_4", configuration: { visibleFieldIds: PROJECT_VIEW_CONTRACT.find((view) => view.name === "All Tickets").visibleFields.map(fieldId) } },
    { viewId: "PVTV_5", layout: "TABLE_LAYOUT" },
    { viewId: "PVTV_6", configuration: { visibleFieldIds: PROJECT_VIEW_CONTRACT.find((view) => view.name === "Out-of-Scope").visibleFields.map(fieldId) } },
  ]);
  assert.equal(result.outcome, "audit-passed-ui-checks-required");
  assert.deepEqual(result.verified.map((entry) => `${entry.view}:${entry.property}`), [
    "Tickets:filter",
    "All Tickets:visibleFields",
    "Decision Areas:layout",
    "Out-of-Scope:visibleFields",
  ]);
  assert.deepEqual([result.failed, result.unverified, result.notAttempted, result.remainingGitHubUi], [[], [], [], []]);
  assert.deepEqual(result.audit.drifts, []);
  assert.ok(result.audit.manualUiChecks.every((check) => check.status === "required-ui-verification"));
  assert.equal(calls.filter(isViewRead).length, 2, "one planning read and one post-write re-read");
  assertPresentationOnly(calls);

  const repeatCalls = [];
  const repeat = await createGitHubAdapter({ run: githubViews(state, repeatCalls) }).syncViews({ config, repositories: [] });
  assert.equal(repeat.plannedUpdates, 0);
  assert.deepEqual(repeat.verified, []);
  assert.equal(repeatCalls.filter(isViewUpdate).length, 0);
  assert.equal(repeatCalls.filter(isViewRead).length, 1, "no re-read without writes");
});

test("unsupported drift stays visible across repeat runs without any mutation or retry", async () => {
  const state = contractState();
  savedView(state, "All Tickets").sortByFields.nodes = [];
  savedView(state, "Repositories").groupByFields.nodes = [];
  const technical = state.views.nodes.findIndex((view) => view.name === "Out-of-Scope");
  [state.views.nodes[technical], state.views.nodes[technical + 1]] = [state.views.nodes[technical + 1], state.views.nodes[technical]];
  state.fields.nodes.find((field) => field.name === "Status").options[0].description = "Awaiting discussion.";

  for (let run = 0; run < 2; run += 1) {
    const calls = [];
    const result = await createGitHubAdapter({ run: githubViews(state, calls) }).syncViews({ config, repositories: [] });
    assert.equal(result.outcome, "github-ui-configuration-required");
    assert.equal(result.plannedUpdates, 0);
    assert.deepEqual(result.remainingGitHubUi.map((drift) => `${drift.scope}:${drift.name ?? ""}:${drift.property}`), [
      "view:All Tickets:sortBy",
      "view:Repositories:groupBy",
    ]);
    assert.deepEqual(result.remainingFieldSetup.map((drift) => `${drift.name}:${drift.property}`), ["Status:optionDescriptions"]);
    assert.ok(result.remainingGitHubUi.every((drift) => drift.reason));
    assert.equal(calls.filter(isViewUpdate).length, 0);
    assert.equal(calls.filter(isViewRead).length, 1);
    assertPresentationOnly(calls);
  }
});

test("missing, duplicate, and ambiguous targets refuse with actionable errors before any view mutation", async () => {
  const cases = [
    ["missing view", (state) => { savedView(state, "Decision Areas").name = "Decisions"; }, [/Missing view "Decision Areas"/, /--rename-view <view-number>=Decision Areas/, /#5 "Decisions"/]],
    ["duplicate view", (state) => { state.views.nodes.push({ ...structuredClone(savedView(state, "Tickets")), id: "PVTV_9", number: 9, filter: "" }); }, [/View "Tickets" is ambiguous: #1 "Tickets", #9 "Tickets"/, /never guesses which view is canonical/]],
    ["missing field", (state) => { state.fields.nodes = state.fields.nodes.filter((field) => field.name !== "Repository Build Units"); }, [/Project field "Repository Build Units" is missing \(visible in Repositories\)/]],
    ["ambiguous field", (state) => { state.fields.nodes.push({ id: "F_CATEGORY_COPY", name: "Category", dataType: "TEXT" }); }, [/Project field "Category" is ambiguous: 2 fields share that name/]],
    ["unknown rename target", () => {}, [/--rename-view 42=Tickets: no saved view has number 42/], [{ number: 42, name: "Tickets" }]],
    ["rename that would leave another view missing", () => {}, [/Missing view "Tickets"/, /View "Decision Areas" is ambiguous/], [{ number: 1, name: "Decision Areas" }]],
  ];
  for (const [scenario, mutate, expected, renames = []] of cases) {
    const state = contractState();
    savedView(state, "Tickets").filter = "";
    mutate(state);
    const calls = [];
    const adapter = createGitHubAdapter({ run: githubViews(state, calls) });
    await assert.rejects(adapter.syncViews({ config, repositories: [], renames }), (error) => {
      assert.match(error.message, /Refusing to update Project views; no view was changed/, scenario);
      for (const pattern of expected) assert.match(error.message, pattern, scenario);
      return true;
    });
    assert.equal(calls.filter(isViewUpdate).length, 0, scenario);
  }
});

test("an explicitly numbered rename updates only that view and reports the verified name", async () => {
  const state = contractState();
  const decisions = savedView(state, "Decision Areas");
  decisions.name = "Decisions";
  decisions.filter = "label:decision";
  const calls = [];
  const result = await createGitHubAdapter({ run: githubViews(state, calls) }).syncViews({
    config,
    repositories: [],
    renames: parseViewRenameArguments(["5=Decision Areas"]),
  });
  assert.deepEqual(updateInputs(calls), [{ viewId: "PVTV_5", name: "Decision Areas", filter: "label:\"Technical Decision\"" }]);
  assert.equal(result.outcome, "audit-passed-ui-checks-required");
  assert.deepEqual(result.verified.map((entry) => [entry.number, entry.property, entry.value]), [
    [5, "name", "Decision Areas"],
    [5, "filter", "label:\"Technical Decision\""],
  ]);

  const failedRename = contractState();
  savedView(failedRename, "Decision Areas").name = "Decisions";
  const failedResult = await createGitHubAdapter({ run: githubViews(failedRename, [], { failUpdateFor: "PVTV_5" }) }).syncViews({
    config,
    repositories: [],
    renames: parseViewRenameArguments(["5=Decision Areas"]),
  });
  assert.equal(failedResult.outcome, "api-failure");
  assert.deepEqual(failedResult.failed.map((entry) => [entry.number, entry.properties]), [[5, ["name"]]]);
  assert.deepEqual(failedResult.audit.drifts.map((drift) => `${drift.name ?? ""}:${drift.property}`), ["Decision Areas:count"]);
  assert.deepEqual(failedResult.remainingGitHubUi, [], "an unlanded rename is never routed to browser view creation or tab reordering");

  assert.throws(() => parseViewRenameArguments(["4=Decisions"]), /contract view name/);
  assert.throws(() => parseViewRenameArguments(["four=Tickets"]), /<view-number>=<contract view name>/);
  assert.throws(() => parseViewRenameArguments(["4=Tickets", "5=Tickets"]), /more than once/);
});

test("a failed update stops later writes, re-reads once, and reports verified, failed, and not-attempted work", async () => {
  const state = contractState();
  for (const name of ["Tickets", "All Tickets", "Repositories"]) savedView(state, name).filter = "";
  const calls = [];
  const result = await createGitHubAdapter({ run: githubViews(state, calls, { failUpdateFor: "PVTV_4" }) }).syncViews({ config, repositories: [] });
  assert.equal(result.outcome, "api-failure");
  assert.deepEqual(result.verified.map((entry) => `${entry.view}:${entry.property}`), ["Tickets:filter"]);
  assert.deepEqual(result.failed.map((entry) => [entry.view, entry.properties]), [["All Tickets", ["filter"]]]);
  assert.match(result.failed[0].error, /Resource not accessible/);
  assert.deepEqual(result.notAttempted, [{ view: "Repositories", number: 7, properties: ["filter"] }]);
  assert.deepEqual(result.unverified, []);
  assert.deepEqual(result.remainingGitHubUi, []);
  assert.deepEqual(result.audit.drifts.map((drift) => `${drift.name}:${drift.property}`), ["All Tickets:filter", "Repositories:filter"]);
  assert.deepEqual(updateInputs(calls).map((input) => input.viewId), ["PVTV_1", "PVTV_4"], "no retry and no later writes");
  assert.equal(calls.filter(isViewRead).length, 2);
  assert.match(result.nextStep, /Do not loop/);
});

test("accepted updates that do not persist or cannot be re-read are never reported as verified", async () => {
  const ignored = contractState();
  savedView(ignored, "All Tickets").configuration.visibleFields.nodes.reverse();
  const ignoredResult = await createGitHubAdapter({ run: githubViews(ignored, [], { ignoreVisibleFieldsFor: "PVTV_4" }) }).syncViews({ config, repositories: [] });
  assert.equal(ignoredResult.outcome, "api-failure");
  assert.deepEqual(ignoredResult.verified, []);
  assert.deepEqual(ignoredResult.unverified.map((entry) => [entry.view, entry.property, entry.expected, entry.actual]), [[
    "All Tickets",
    "visibleFields",
    PROJECT_VIEW_CONTRACT.find((view) => view.name === "All Tickets").visibleFields,
    [...PROJECT_VIEW_CONTRACT.find((view) => view.name === "All Tickets").visibleFields].reverse(),
  ]]);

  const unreadable = contractState();
  savedView(unreadable, "Tickets").filter = "";
  const calls = [];
  const unreadableResult = await createGitHubAdapter({ run: githubViews(unreadable, calls, { failReread: true }) }).syncViews({ config, repositories: [] });
  assert.equal(unreadableResult.outcome, "api-failure");
  assert.equal(unreadableResult.audit, null);
  assert.match(unreadableResult.verificationError, /HTTP 502/);
  assert.deepEqual(unreadableResult.verified, []);
  assert.deepEqual(unreadableResult.unverified.map((entry) => [entry.view, entry.property]), [["Tickets", "filter"]]);
  assert.match(unreadableResult.unverified[0].reason, /could not be re-read/);
  assert.equal(calls.filter(isViewUpdate).length, 1);
});

test("dispatch routes only sync --views-only to view repair and keeps ordinary sync separate", async (t) => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "project-view-dispatch-"));
  t.after(() => fs.rmSync(cwd, { recursive: true, force: true }));
  fs.mkdirSync(path.join(cwd, "design"));
  const calls = [];
  const adapter = {
    createViews: async (input) => { calls.push(["createViews", input]); return { created: [] }; },
    setupFields: async (input) => { calls.push(["setupFields", input]); return { applied: [] }; },
    sync: async (input) => { calls.push(["sync", input]); return { completed: [] }; },
    syncViews: async (input) => { calls.push(["syncViews", input]); return { outcome: "audit-passed-ui-checks-required" }; },
  };
  const lock = { path: "lock", verify() {} };
  const dispatchConfig = { ...config, ticketRoot: "design" };
  const renames = [{ number: 4, name: "Decision Areas" }];
  await dispatchProjection({ operation: "sync", config: dispatchConfig, cwd, adapter, options: { viewsOnly: true, renames, publishingLock: lock } });
  await dispatchProjection({ operation: "sync", config: dispatchConfig, cwd, adapter, options: { publishingLock: lock } });
  assert.deepEqual(calls.map(([name]) => name), ["syncViews", "sync"]);
  assert.deepEqual(Object.keys(calls[0][1]).sort(), ["config", "publishingLock", "renames", "repositories"]);
  assert.equal(calls[0][1].publishingLock, lock);
  assert.deepEqual(calls[0][1].renames, renames);
  assert.equal(Object.hasOwn(calls[1][1], "renames"), false);
  const answeringOptionNames = { existing: "Ready" };
  await dispatchProjection({ operation: "sync", config: dispatchConfig, cwd, adapter, options: { fieldsOnly: true, answeringOptionNames, publishingLock: lock } });
  assert.deepEqual(calls[2], ["setupFields", { config: dispatchConfig, answeringOptionNames, publishingLock: lock }]);
  await dispatchProjection({ operation: "sync", config: dispatchConfig, cwd, adapter, options: { createViews: true, selectedViews: ["Tickets"], publishingLock: lock } });
  assert.deepEqual(calls[3], ["createViews", { config: dispatchConfig, repositories: [], selectedViews: ["Tickets"], publishingLock: lock }]);
});
