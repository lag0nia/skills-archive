import assert from "node:assert/strict";
import test from "node:test";
import { createGitHubAdapter } from "../../scripts/lib/ticket-projection/github/adapter.mjs";
import { planProjectViewCreation, projectViewsRestRoute, createdViewDrifts } from "../../scripts/lib/ticket-projection/view-setup.mjs";
import { validateConfig, projectViewContract, auditProjectViewContract, planProjectViewRepair } from "../../scripts/lib/ticket-projection/core.mjs";
import { contractViewState, savedView } from "../support/project-view-state.mjs";

const config = { includedViews: ["Repositories"], provider: "github", syncBranch: "main", ticketRoot: "design/software-design", repository: "owner/repository", project: "owner/7" };
const omitted = { ...config, includedViews: [], omittedViews: ["Repositories"] };
function stateWithout(names = []) {
  const state = contractViewState();
  state.fields.nodes.forEach((field, index) => { field.databaseId = 1001 + index * 17; });
  state.views.nodes = state.views.nodes.filter((view) => !names.includes(view.name));
  return state;
}

function fakeGitHub(state, { ownerType = "Organization", failName, persistBeforeFailure = false, ignoreSetting, failVerification = false, dirty = false, wrongBranch = false, fetchFailure = false, concurrentView = false, metadataIncomplete = false,
  restFailure, restPersist = false, restNearMatch = false, graphqlFailure, graphqlPersist = false, graphqlErrors = false, graphqlDefaultsDiffer = false, ignoreGraphqlFilter = false, failGraphqlIdentityRead = false, graphqlUpdateFailure = false,
} = {}) {
  const calls = []; let postCount = 0, reads = 0;
  let graphqlCount = 0;
  const json = (value) => ({ stdout: JSON.stringify(value) });
  function saved(body) {
    const ref = (id) => {
      const field = state.fields.nodes.find((field) => field.databaseId === id);
      assert.ok(field, `unknown REST field id ${id}`);
      return { id: field.id, name: field.name };
    };
    const number = Math.max(0, ...state.views.nodes.map((view) => view.number)) + 1;
    return {
      id: `NEW_${number}`, number, name: body.name,
      layout: body.layout === "board" ? "BOARD_LAYOUT" : "TABLE_LAYOUT", filter: body.filter,
      configuration: { visibleFields: { nodes: body.visible_fields.map(ref) } },
      groupByFields: { nodes: body.group_by.map(ref) }, verticalGroupByFields: { nodes: (body.vertical_group_by || []).map(ref) },
      sortByFields: { nodes: body.sort_by.map(([id, direction]) => ({ field: ref(id), direction: direction.toUpperCase() })) },
    };
  }
  const run = async (call) => {
    calls.push(call);
    const { command, args, input } = call;
    if (command === "git") {
      if (args[0] === "symbolic-ref") return { stdout: wrongBranch ? "feature" : "main" };
      if (args[0] === "status") return { stdout: dirty ? " M dirty\0" : "" };
      if (args[0] === "fetch" && fetchFailure) throw new Error("offline");
      if (args[0] === "remote") return { stdout: "https://github.com/owner/repository.git" };
      if (args[0] === "rev-parse") return { stdout: args.includes("--show-toplevel") ? "/tmp/consumer" : "a".repeat(40) };
      return { stdout: "" };
    }
    if (args[0] === "project" && args[1] === "view") return json({ id: "PROJECT", title: "Design" });
    if (args.some((arg) => arg.includes("ProjectViewSetupFields"))) {
      assert.ok(args.some((arg) => arg.includes("databaseId")));
      return json({ data: { node: { fields: { nodes: state.fields.nodes, pageInfo: { hasNextPage: metadataIncomplete } } } } });
    }
    if (args.some((arg) => arg.includes("ProjectViewConfiguration"))) {
      ++reads;
      if (concurrentView && reads === 2) {
        const { plans } = planProjectViewCreation(state, ["Tickets"]);
        state.views.nodes.push(saved(plans[0].body));
      }
      if (failVerification && postCount) throw new Error("read unavailable");
      if (failGraphqlIdentityRead && graphqlCount) throw new Error("GraphQL created identity unavailable");
      return json({ data: { node: state } });
    }
    if (args[0] === "api" && args[1] === "users/owner") return json({ type: ownerType, login: "owner", id: 420 });
    if (args[1] === "graphql" && input) {
      const mutation = JSON.parse(input);
      const data = mutation.variables.input;
      if (mutation.query.includes("CreateProjectViewFallback")) {
        graphqlCount++;
        assert.deepEqual(Object.keys(data).sort(), ["configuration", "layout", "name", "projectId"]);
        assert.deepEqual(Object.keys(data.configuration), ["visibleFieldIds"]);
        assert.equal(data.projectId, "PROJECT");
        if (graphqlFailure && !graphqlPersist) throw new Error(graphqlFailure);
        const number = Math.max(0, ...state.views.nodes.map((view) => view.number)) + 1;
        const ref = (id) => {
          const field = state.fields.nodes.find((field) => field.id === id);
          assert.ok(field, `Unknown GraphQL field ${id}`);
          return { id, name: field.name };
        };
        const view = {
          id: `GRAPHQL_${number}`, number, name: data.name, layout: data.layout, filter: "",
          configuration: { visibleFields: { nodes: data.configuration.visibleFieldIds.map(ref) } },
          groupByFields: { nodes: graphqlDefaultsDiffer ? [ref(state.fields.nodes.find((field) => field.name === "Kind").id)] : [] },
          verticalGroupByFields: { nodes: graphqlDefaultsDiffer ? [] : [ref(state.fields.nodes.find((field) => field.name === "Status").id)] },
          sortByFields: { nodes: [] },
        };
        state.views.nodes.push(view);
        if (graphqlFailure) throw new Error(graphqlFailure);
        return json({ data: { createProjectV2View: { projectV2View: { id: view.id, number, name: view.name } } }, ...(graphqlErrors ? { errors: [{ message: "partial response error" }] } : {}) });
      }
      if (mutation.query.includes("ConfigureCreatedProjectView")) {
        assert.deepEqual(Object.keys(data).sort(), ["configuration", "filter", "viewId"]);
        const view = state.views.nodes.find((view) => view.id === data.viewId);
        assert.ok(view.id.startsWith("GRAPHQL_"), "only a newly created fallback identity can be configured");
        if (graphqlUpdateFailure) throw new Error("GraphQL update rejected");
        if (!ignoreGraphqlFilter) view.filter = data.filter;
        return json({ data: { updateProjectV2View: { projectV2View: { id: view.id } } } });
      }
    }
    if (args.includes("POST")) {
      const body = JSON.parse(input); postCount++;
      assert.equal(args[1], ownerType === "User" ? "users/420/projectsV2/7/views" : "orgs/owner/projectsV2/7/views");
      assert.ok(args.includes("X-GitHub-Api-Version: 2026-03-10"));
      if (restFailure) {
        if (restPersist || restNearMatch) {
          const view = saved(body);
          if (restNearMatch) view.name = ` ${body.name.toLowerCase()} `;
          state.views.nodes.push(view);
        }
        throw new Error(restFailure);
      }
      if (body.name === failName && !persistBeforeFailure) throw new Error("POST rejected");
      const view = saved(body);
      if (ignoreSetting) view[ignoreSetting] = { nodes: [] };
      state.views.nodes.push(view);
      if (body.name === failName) throw new Error("connection lost after POST");
      return json({ value: { node_id: view.id, number: view.number, html_url: `https://github.com/users/owner/projects/7/views/${view.number}` } });
    }
    throw new Error(`Unexpected command: ${command} ${args.join(" ")}`);
  };
  return { run, calls };
}
const posts = (calls) => calls.filter((call) => call.args.includes("POST"));
const graphqlMutations = (calls, operation) => calls.filter((call) => call.args[1] === "graphql" && call.input && JSON.parse(call.input).query.includes(operation));

test("confirmed REST 404 falls back once per missing view and verifies GraphQL settings plus observed defaults", async () => {
  const selectedViews = ["Product & Operations", "Software"];
  const state = stateWithout(selectedViews);
  savedView(state, "Tickets").filter = "unrelated drift";
  const existing = structuredClone(state.views.nodes);
  const p = fakeGitHub(state, { ownerType: "User", restFailure: "gh: Not Found (HTTP 404)" });
  const adapter = createGitHubAdapter({ run: p.run });
  const result = await adapter.createViews({ config, selectedViews });
  assert.equal(result.outcome, "view-setup-api-verified-browser-pending");
  assert.equal(result.created.length, 2);
  assert.equal(result.fallbacks.length, 2);
  assert.deepEqual(result.failed, []);
  assert.deepEqual(result.unverified, []);
  assert.equal(graphqlMutations(p.calls, "CreateProjectViewFallback").length, 2);
  assert.equal(graphqlMutations(p.calls, "ConfigureCreatedProjectView").length, 2);
  for (const verified of result.verified) {
    assert.equal(verified.method, "graphql");
    assert.ok(verified.properties.includes("filter"));
    assert.ok(verified.properties.includes("visibleFields"));
    assert.equal(verified.properties.includes("verticalGroupBy"), false, "Status default is not Board status");
    assert.equal(verified.properties.includes("sortBy"), false, "empty sorting is not Title ascending");
  }
  assert.deepEqual(result.remainingGitHubUi.filter((item) => item.property === "sortBy").map(({ view, expected, actual }) => ({ view, expected, actual })), selectedViews.map((view) => ({ view, expected: [{ field: "Title", direction: "ASC" }], actual: [] })));
  assert.equal(result.remainingGitHubUi.some((item) => item.view === "Tickets"), false);
  assert.deepEqual(state.views.nodes.slice(0, existing.length), existing);
  const beforeRerun = structuredClone(state);
  const repeated = await adapter.createViews({ config, selectedViews });
  assert.deepEqual(repeated.created, []);
  assert.equal(repeated.existing.length, 2);
  assert.equal(posts(p.calls).length, 2);
  assert.equal(graphqlMutations(p.calls, "CreateProjectViewFallback").length, 2);
  assert.deepEqual(state, beforeRerun);
});

test("fallback reports actual grouping differences instead of assuming board defaults", async () => {
  const p = fakeGitHub(stateWithout(["Software"]), { restFailure: "HTTP 404", graphqlDefaultsDiffer: true });
  const result = await createGitHubAdapter({ run: p.run }).createViews({ config, selectedViews: ["Software"] });
  assert.equal(result.outcome, "view-setup-api-verified-browser-pending");
  assert.deepEqual(result.verified[0].properties, ["name", "layout", "filter", "visibleFields"]);
  assert.deepEqual(result.remainingGitHubUi.slice(0, 3).map(({ property, expected, actual }) => ({ property, expected, actual })), [
    { property: "groupBy", expected: [], actual: ["Kind"] },
    { property: "verticalGroupBy", expected: ["Board status"], actual: [] },
    { property: "sortBy", expected: [{ field: "Title", direction: "ASC" }], actual: [] },
  ]);
});

test("uncertain or non-404 REST failures never trigger a second creation mechanism", async () => {
  for (const options of [
    { restFailure: "HTTP 403" }, { restFailure: "HTTP 500" }, { restFailure: "connection timed out" },
    { restFailure: "HTTP 404", restPersist: true }, { restFailure: "HTTP 404", restNearMatch: true },
    { restFailure: "HTTP 404", failVerification: true },
  ]) {
    const state = stateWithout(["Product & Operations", "Software"]);
    const p = fakeGitHub(state, options);
    const result = await createGitHubAdapter({ run: p.run }).createViews({ config, selectedViews: ["Product & Operations", "Software"] });
    assert.equal(result.outcome, "api-failure", JSON.stringify(options));
    assert.equal(posts(p.calls).length, 1);
    assert.equal(graphqlMutations(p.calls, "CreateProjectViewFallback").length, 0);
    assert.deepEqual(result.notAttempted, ["Software"]);
  }
});

test("uncertain GraphQL creation is read back without update or another create; rerun preserves the identity", async () => {
  for (const options of [{ graphqlFailure: "connection lost", graphqlPersist: true }, { graphqlErrors: true }]) {
    const state = stateWithout(["Product & Operations", "Software"]);
    const p = fakeGitHub(state, { restFailure: "HTTP 404", ...options });
    const result = await createGitHubAdapter({ run: p.run }).createViews({ config, selectedViews: ["Product & Operations", "Software"] });
    assert.equal(result.outcome, "api-failure");
    assert.equal(result.created[0].observedAfterFailure, true);
    assert.equal(graphqlMutations(p.calls, "CreateProjectViewFallback").length, 1);
    assert.equal(graphqlMutations(p.calls, "ConfigureCreatedProjectView").length, 0);
    assert.ok(result.unverified.some((item) => item.property === "filter"));
    assert.deepEqual(result.notAttempted, ["Software"]);
    const next = fakeGitHub(state);
    const before = structuredClone(savedView(state, "Product & Operations"));
    const repeat = await createGitHubAdapter({ run: next.run }).createViews({ config, selectedViews: ["Product & Operations"] });
    assert.deepEqual(repeat.created, []);
    assert.equal(repeat.existing[0].id, before.id);
    assert.equal(posts(next.calls).length, 0);
    assert.equal(graphqlMutations(next.calls, "CreateProjectViewFallback").length, 0);
    assert.deepEqual(savedView(state, "Product & Operations"), before);
  }
});

test("GraphQL fallback failures stop later creates and do not report unwritten settings as verified", async () => {
  for (const options of [
    { graphqlFailure: "HTTP 404" }, { failGraphqlIdentityRead: true },
    { ignoreGraphqlFilter: true }, { graphqlUpdateFailure: true },
  ]) {
    const p = fakeGitHub(stateWithout(["Product & Operations", "Software"]), { restFailure: "HTTP 404", ...options });
    const result = await createGitHubAdapter({ run: p.run }).createViews({ config, selectedViews: ["Product & Operations", "Software"] });
    assert.equal(result.outcome, "api-failure", JSON.stringify(options));
    assert.deepEqual(result.verified, []);
    assert.equal(graphqlMutations(p.calls, "CreateProjectViewFallback").length, 1);
    if (options.failGraphqlIdentityRead) assert.equal(graphqlMutations(p.calls, "ConfigureCreatedProjectView").length, 0);
    assert.equal(posts(p.calls).length, 1);
    assert.deepEqual(result.notAttempted, ["Software"]);
  }
});

test("status boards create exact REST settings, preserve unrelated drift and skip existing names on rerun", async () => {
  const selectedViews = ["Software", "Product & Operations"];
  const state = stateWithout(selectedViews);
  savedView(state, "Tickets").filter = "saved custom filter";
  savedView(state, "All Tickets").sortByFields.nodes = [];
  state.views.nodes.push({ id: "CUSTOM", number: 99, name: "Personal notes", filter: "custom" });
  const existing = structuredClone(state.views.nodes);
  const databaseId = (name) => state.fields.nodes.find((field) => field.name === name).databaseId;
  const { plans } = planProjectViewCreation(state, selectedViews);
  assert.deepEqual(plans.map((plan) => plan.body), [
    ["Product & Operations", "kind:product,operational"], ["Software", "kind:Software"],
  ].map(([name, kindFilter]) => ({
    name, layout: "board",
    filter: `${kindFilter} status:todo,deferred,decided,finished -label:"Technical Decision"`,
    visible_fields: ["Title", "Domain", "Complexity"].map(databaseId),
    sort_by: [[databaseId("Title"), "asc"]],
    group_by: [], vertical_group_by: [databaseId("Board status")],
  })));
  const p = fakeGitHub(state);
  const adapter = createGitHubAdapter({ run: p.run });
  const result = await adapter.createViews({ config, selectedViews });
  assert.equal(result.outcome, "view-setup-api-verified-browser-pending");
  assert.deepEqual(result.verified.map((view) => view.name), ["Product & Operations", "Software"]);
  assert.deepEqual(posts(p.calls).map((call) => JSON.parse(call.input)), plans.map((plan) => plan.body));
  assert.deepEqual(state.views.nodes.slice(0, existing.length), existing);
  assert.ok(result.audit.drifts.some((drift) => drift.name === "Tickets" && drift.property === "filter"));
  assert.ok(result.audit.drifts.some((drift) => drift.name === "All Tickets" && drift.property === "sortBy"));
  assert.deepEqual(result.remainingGitHubUi.map(({ property, expected }) => ({ property, expected })), [
    { property: "sliceBy", expected: null }, { property: "sliceBy", expected: null },
    { property: "order", expected: ["Tickets", "Product & Operations", "Software", "All Tickets", "Out-of-Scope", "Repositories"] },
  ]);
  // Even drift on an existing selected name must not turn creation into repair.
  savedView(state, "Software").filter = "previously saved settings";
  const beforeRerun = structuredClone(state.views.nodes);
  const repeated = await adapter.createViews({ config, selectedViews });
  assert.deepEqual(repeated.created, []);
  assert.deepEqual(repeated.existing.map((view) => view.name), ["Product & Operations", "Software"]);
  assert.equal(posts(p.calls).length, 2);
  assert.deepEqual(state.views.nodes, beforeRerun);
  assert.equal(p.calls.some((call) => call.args.includes("DELETE") || call.args.includes("PATCH") || call.args.includes("item-edit")), false);
});

for (const ownerType of ["User", "Organization"]) test(`REST setup creates selected missing views for ${ownerType} with metadata field IDs and verifies saved settings`, async () => {
  const state = stateWithout(["Tickets", "All Tickets"]);
  const existing = structuredClone(state.views.nodes);
  const { plans } = planProjectViewCreation(state, ["All Tickets", "Tickets"]);
  const p = fakeGitHub(state, { ownerType });
  const result = await createGitHubAdapter({ run: p.run }).createViews({ config, selectedViews: ["All Tickets", "Tickets"] });
  assert.equal(result.outcome, "view-setup-api-verified-browser-pending");
  assert.deepEqual(posts(p.calls).map((call) => JSON.parse(call.input)), plans.map((plan) => plan.body));
  assert.deepEqual(plans[0].body.group_by, [state.fields.nodes.find((field) => field.name === "Work area").databaseId]);
  assert.deepEqual(plans[0].body.vertical_group_by, [state.fields.nodes.find((field) => field.name === "Answering group").databaseId]);
  assert.deepEqual(plans[0].body.sort_by, [[state.fields.nodes.find((field) => field.name === "Title").databaseId, "asc"]]);
  assert.equal(result.verified.length, 2);
  assert.deepEqual(result.unverified, []);
  assert.deepEqual(state.views.nodes.slice(0, existing.length), existing);
  assert.deepEqual(result.remainingGitHubUi.map((item) => item.property), ["sliceBy", "sliceBy", "order"]);
  const repeated = await createGitHubAdapter({ run: p.run }).createViews({ config, selectedViews: ["Tickets", "All Tickets"] });
  assert.deepEqual(repeated.created, []);
  assert.equal(repeated.existing.length, 2);
  assert.equal(posts(p.calls).length, 2);
  assert.equal(p.calls.some((call) => call.args.includes("DELETE") || call.args.includes("PATCH") || call.args.includes("item-edit")), false);
});

test("creation preflights all selected missing fields before any POST and rejects ambiguous metadata", async () => {
  for (const mutate of [
    (s) => { s.fields.nodes = s.fields.nodes.filter((f) => f.name !== "Category"); },
    (s) => { s.fields.nodes.push({ ...s.fields.nodes.find((f) => f.name === "Title"), id: "DUPLICATE" }); },
    (s) => { s.fields.nodes.find((f) => f.name === "Work area").databaseId = null; },
    (s) => { s.fields.nodes.find((f) => f.name === "Work area").databaseId = "123"; },
    (s) => { s.fields.nodes.find((f) => f.name === "Work area").databaseId = Number.MAX_SAFE_INTEGER + 1; },
  ]) {
    const state = stateWithout(["Tickets", "All Tickets"]); mutate(state);
    const p = fakeGitHub(state);
    await assert.rejects(createGitHubAdapter({ run: p.run }).createViews({ config, selectedViews: ["Tickets", "All Tickets"] }), /field|databaseId/);
    assert.equal(posts(p.calls).length, 0);
  }
});

test("duplicate and near-matching saved names block creation; unrelated extras are preserved", async () => {
  for (const name of ["All Tickets", " tickets "]) {
    const state = stateWithout(["Tickets"]);
    state.views.nodes.push({ id: "OTHER", number: 99, name });
    const p = fakeGitHub(state);
    await assert.rejects(createGitHubAdapter({ run: p.run }).createViews({ config, selectedViews: ["Tickets"] }), /Ambiguous/);
    assert.equal(posts(p.calls).length, 0);
  }
  const state = stateWithout(["Tickets"]);
  const extra = { id: "CUSTOM", number: 99, name: "Personal notes", filter: "custom" };
  state.views.nodes.push(extra);
  const p = fakeGitHub(state);
  await createGitHubAdapter({ run: p.run }).createViews({ config, selectedViews: ["Tickets"] });
  assert.deepEqual(state.views.nodes.find((view) => view.id === extra.id), extra);
});

test("partial failures stop later creates and reruns create only still-missing views", async () => {
  const selectedViews = ["Tickets", "All Tickets", "Out-of-Scope"];
  const state = stateWithout(selectedViews);
  const first = fakeGitHub(state, { failName: "All Tickets" });
  const result = await createGitHubAdapter({ run: first.run }).createViews({ config, selectedViews });
  assert.equal(result.outcome, "api-failure");
  assert.deepEqual(result.verified.map((view) => view.name), ["Tickets"]);
  assert.deepEqual(result.failed.map((view) => view.view), ["All Tickets"]);
  assert.deepEqual(result.notAttempted, ["Out-of-Scope"]);
  const second = fakeGitHub(state);
  await createGitHubAdapter({ run: second.run }).createViews({ config, selectedViews });
  assert.deepEqual(posts(second.calls).map((call) => JSON.parse(call.input).name), ["All Tickets", "Out-of-Scope"]);
  assert.equal(state.views.nodes.filter((view) => view.name === "Tickets").length, 1);
});

test("uncertain POST persistence is read back without blind retry or duplicate on next run", async () => {
  const state = stateWithout(["Tickets", "All Tickets"]);
  const p = fakeGitHub(state, { failName: "Tickets", persistBeforeFailure: true });
  const input = { config, selectedViews: ["Tickets", "All Tickets"] };
  const result = await createGitHubAdapter({ run: p.run }).createViews(input);
  assert.equal(result.outcome, "api-failure");
  assert.equal(result.created[0].observedAfterFailure, true);
  assert.equal(result.verified[0].name, "Tickets");
  assert.deepEqual(result.notAttempted, ["All Tickets"]);
  const next = fakeGitHub(state);
  await createGitHubAdapter({ run: next.run }).createViews(input);
  assert.deepEqual(posts(next.calls).map((call) => JSON.parse(call.input).name), ["All Tickets"]);
});

test("ignored grouping or unreadable saved state remains unverified and stops further writes", async () => {
  for (const options of [{ ignoreSetting: "groupByFields" }, { failVerification: true }]) {
    const state = stateWithout(["Tickets", "All Tickets"]);
    const p = fakeGitHub(state, options);
    const result = await createGitHubAdapter({ run: p.run }).createViews({ config, selectedViews: ["Tickets", "All Tickets"] });
    assert.equal(result.outcome, "api-failure");
    assert.equal(result.unverified.length, 1);
    assert.equal(posts(p.calls).length, 1);
    assert.deepEqual(result.notAttempted, ["All Tickets"]);
    assert.deepEqual(result.remainingGitHubUi.at(-1).expected, projectViewContract(config).map((view) => view.name));
  }
});

test("a selected view appearing before POST is preserved without recreation", async () => {
  const state = stateWithout(["Tickets"]);
  const p = fakeGitHub(state, { concurrentView: true });
  const result = await createGitHubAdapter({ run: p.run }).createViews({ config, selectedViews: ["Tickets"] });
  assert.equal(result.existing[0].name, "Tickets");
  assert.equal(posts(p.calls).length, 0);
});

test("publishing and incomplete metadata gates prevent setup mutations", async () => {
  for (const options of [{ dirty: true }, { wrongBranch: true }, { fetchFailure: true }, { metadataIncomplete: true }]) {
    const p = fakeGitHub(stateWithout(["Tickets"]), options);
    await assert.rejects(createGitHubAdapter({ run: p.run }).createViews({ config, selectedViews: ["Tickets"] }), /Local changes|Wrong branch|Fetch failure|incomplete/);
    assert.equal(posts(p.calls).length, 0);
  }
  assert.throws(() => projectViewsRestRoute(config, { type: "User", login: "other", id: 42 }), /does not match/);
  assert.throws(() => projectViewsRestRoute(config, { type: "User", login: "owner", id: null }), /missing numeric/);
});

test("Repositories omission is explicit, validated, and affects every presentation expectation", async () => {
  assert.deepEqual(validateConfig(omitted), omitted);
  for (const value of [null, "Repositories", ["Tickets"], ["repositories"], ["Repositories", "Repositories"], ["Unknown"]]) assert.throws(() => validateConfig({ ...config, omittedViews: value }), /omittedViews/);
  const state = stateWithout(["Repositories"]);
  assert.equal(auditProjectViewContract(state, [], config).apiPassed, false, "missing does not imply omitted");
  const audit = auditProjectViewContract(state, [], omitted);
  assert.equal(audit.apiPassed, true);
  assert.deepEqual(audit.requiredVisibleOrder, ["Tickets", "Product & Operations", "Software", "All Tickets", "Out-of-Scope"]);
  assert.equal(audit.requiredSlices.some((slice) => slice.view === "Repositories"), false);
  assert.equal(audit.manualUiChecks.some((check) => check.id === "repositories-repo-slice"), false);
  assert.deepEqual(planProjectViewRepair(state, { config: omitted }), []);
  assert.throws(() => planProjectViewRepair(state, { config: omitted, renames: [{ number: 1, name: "Repositories" }] }), /disabled/);
  const p = fakeGitHub(state);
  await assert.rejects(createGitHubAdapter({ run: p.run }).createViews({ config: omitted, selectedViews: ["Repositories"] }), /enabled/);
  assert.equal(p.calls.length, 0);
  assert.equal(state.fields.nodes.some((f) => f.name === "Repositories"), true);
  state.fields.nodes = state.fields.nodes.filter((f) => f.name !== "Repositories");
  assert.equal(auditProjectViewContract(state, [], omitted).apiPassed, false, "underlying schema stays required");
});

test("an existing omitted Repositories view is preserved and ignored by repair and audit", async () => {
  const state = stateWithout();
  savedView(state, "Repositories").filter = "My saved filter";
  const before = structuredClone(state);
  const p = fakeGitHub(state);
  const adapter = createGitHubAdapter({ run: p.run });
  const audited = await adapter.projectViewAudit({ config: omitted });
  assert.equal(audited.apiPassed, true);
  assert.deepEqual(audited.additionalViews.map((view) => view.name), ["Repositories"]);
  assert.equal((await adapter.syncViews({ config: omitted })).plannedUpdates, 0);
  await adapter.createViews({ config: omitted, selectedViews: ["Tickets"] });
  assert.deepEqual(state, before);
  assert.equal(posts(p.calls).length, 0);
});

test("read-back compares exact field identities, not merely names", () => {
  const state = stateWithout(["Tickets"]);
  const plan = planProjectViewCreation(state, ["Tickets"]).plans[0];
  const view = savedView(contractViewState(), "Tickets");
  view.configuration.visibleFields.nodes[0].id = "DIFFERENT_TITLE_ID";
  assert.deepEqual(createdViewDrifts(view, plan).map((drift) => drift.property), ["visibleFields"]);
});

test("an omitted Project creates only its selected enabled defaults and keeps repository schema", async () => {
  const state = stateWithout(projectViewContract(config).map((view) => view.name));
  const beforeFields = structuredClone(state.fields.nodes);
  const p = fakeGitHub(state);
  const selectedViews = projectViewContract(omitted).map((view) => view.name);
  const result = await createGitHubAdapter({ run: p.run }).createViews({ config: omitted, selectedViews });
  assert.equal(result.verified.length, 5);
  assert.equal(result.audit.apiPassed, true);
  assert.deepEqual(state.views.nodes.map((view) => view.name), selectedViews);
  assert.deepEqual(state.fields.nodes, beforeFields);
  assert.equal(result.remainingGitHubUi.some((item) => item.view === "Repositories"), false);
});

test("read-back detects drift in every supported creation setting", () => {
  const state = stateWithout(["Tickets"]);
  const plan = planProjectViewCreation(state, ["Tickets"]).plans[0];
  for (const [property, mutate] of [
    ["name", (view) => { view.name = "Wrong"; }],
    ["layout", (view) => { view.layout = "TABLE_LAYOUT"; }],
    ["filter", (view) => { view.filter = ""; }],
    ["visibleFields", (view) => { view.configuration.visibleFields.nodes.reverse(); }],
    ["sortBy", (view) => { view.sortByFields.nodes[0].direction = "DESC"; }],
    ["groupBy", (view) => { view.groupByFields.nodes = []; }],
    ["verticalGroupBy", (view) => { view.verticalGroupByFields.nodes = []; }],
  ]) {
    const view = savedView(contractViewState(), "Tickets"); mutate(view);
    assert.deepEqual(createdViewDrifts(view, plan).map((drift) => drift.property), [property]);
  }
});

test("incomplete saved view listing cannot establish a genuinely missing view", async () => {
  const state = stateWithout(["Tickets"]);
  state.views.pageInfo.hasNextPage = true;
  const p = fakeGitHub(state);
  await assert.rejects(createGitHubAdapter({ run: p.run }).createViews({ config, selectedViews: ["Tickets"] }), /50-view limit/);
  assert.equal(posts(p.calls).length, 0);
});


const automaticConfig = { ...config };
delete automaticConfig.includedViews;
const canonicalRepositories = [
  { id: "REPO-001", label: "REPO-001 — Main", memberBuildUnits: ["BU-001", "BU-002"] },
  { id: "REPO-002", label: "REPO-002 — Library", memberBuildUnits: ["BU-003"] },
];
for (const [name, preferences, repositories, enabled] of [
  ["zero repositories", {}, [], false],
  ["one repository with multiple units", {}, canonicalRepositories.slice(0, 1), false],
  ["multiple repositories without tickets", {}, canonicalRepositories, true],
  ["repeated identity is one repository", {}, [canonicalRepositories[0], canonicalRepositories[0]], false],
  ["explicit show with one", { includedViews: ["Repositories"] }, canonicalRepositories.slice(0, 1), true],
  ["explicit show with zero", { includedViews: ["Repositories"] }, [], true],
  ["explicit hide with multiple", { omittedViews: ["Repositories"] }, canonicalRepositories, false],
  ["legacy empty omission with one", { omittedViews: [] }, canonicalRepositories.slice(0, 1), false],
  ["legacy empty omission with multiple", { omittedViews: [] }, canonicalRepositories, true],
  ["empty inclusion is automatic", { includedViews: [] }, [], false],
]) {
  test(`effective policy agrees across creation, repair and audit: ${name}`, async () => {
    const selectedConfig = validateConfig({ ...automaticConfig, ...preferences });
    const expected = ["Tickets", "Product & Operations", "Software", "All Tickets", "Out-of-Scope", ...(enabled ? ["Repositories"] : [])];
    assert.deepEqual(projectViewContract(selectedConfig, repositories).map((view) => view.name), expected);
    const state = stateWithout(projectViewContract(config).map((view) => view.name));
    // Canonical field options are independent of whether any tickets exist.
    state.fields.nodes.find((field) => field.name === "Repositories").options = [...new Map(repositories.map((repo) => [repo.id, { name: repo.label }])).values()];
    const uniqueRepositories = [...new Map(repositories.map((repo) => [repo.id, repo])).values()];
    const p = fakeGitHub(state);
    const adapter = createGitHubAdapter({ run: p.run });
    const result = await adapter.createViews({ config: selectedConfig, repositories: uniqueRepositories, selectedViews: expected });
    assert.deepEqual(result.created.map((view) => view.name), expected);
    assert.equal(result.audit.apiPassed, true);
    assert.deepEqual(result.audit.requiredVisibleOrder, expected);
    assert.deepEqual(result.remainingGitHubUi.at(-1).expected, expected);
    const before = structuredClone(state);
    assert.deepEqual(await adapter.projectViewAudit({ config: selectedConfig, repositories: uniqueRepositories }), { project: result.project, ...result.audit });
    assert.equal((await adapter.syncViews({ config: selectedConfig, repositories: uniqueRepositories })).plannedUpdates, 0);
    assert.deepEqual(state, before);
    if (!enabled) await assert.rejects(adapter.createViews({ config: selectedConfig, repositories: uniqueRepositories, selectedViews: ["Repositories"] }), /enabled/);
  });
}

test("view preferences preserve old configuration and reject invalid or conflicting choices", () => {
  for (const preferences of [{}, { omittedViews: [] }, { omittedViews: ["Repositories"] }, { includedViews: ["Repositories"] }]) {
    const input = { ...automaticConfig, ...preferences };
    assert.deepEqual(validateConfig(input), input);
  }
  for (const includedViews of [null, "Repositories", ["Tickets"], ["Repositories", "Repositories"]]) {
    assert.throws(() => validateConfig({ ...automaticConfig, includedViews }), /includedViews/);
  }
  assert.throws(() => validateConfig({ ...automaticConfig, includedViews: ["Repositories"], omittedViews: ["Repositories"] }), /both/);
});

test("automatic omission reports cleanup candidates and preserves every existing custom view identity", async () => {
  const state = stateWithout();
  savedView(state, "Repositories").filter = "custom repository filter";
  state.views.nodes.splice(1, 0, { id: "CUSTOM", number: 51, name: "Personal" }, { id: "BUILD_UNITS", number: 14, name: "Build Units" });
  const before = structuredClone(state);
  const p = fakeGitHub(state);
  const adapter = createGitHubAdapter({ run: p.run });
  const audit = await adapter.projectViewAudit({ config: automaticConfig });
  assert.deepEqual(audit.additionalViews.map(({ name }) => name), ["Personal", "Build Units", "Repositories"]);
  const { id, number, name } = savedView(state, "Repositories");
  assert.deepEqual(audit.presentationCleanupCandidates.map(({ reason, ...identity }) => identity), [{ id, number, name }]);
  await adapter.syncViews({ config: automaticConfig });
  await adapter.createViews({ config: automaticConfig, selectedViews: ["Tickets"] });
  assert.deepEqual(state, before);
  assert.equal(posts(p.calls).length, 0);
});
