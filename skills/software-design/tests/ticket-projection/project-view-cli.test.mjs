import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { PROJECT_VIEW_CONTRACT, PROJECT_STATUS_OPTIONS, PROJECT_BOARD_STATUS_OPTIONS, PROJECT_BOARD_STATUS_COLORS, PROJECT_KIND_OPTIONS, PROJECT_COMPLEXITY_OPTIONS, PROJECT_REPOSITORY_TICKET_LAYER_OPTIONS } from "../../scripts/lib/ticket-projection/core.mjs";
import { syncLockPath } from "../../scripts/lib/ticket-projection/sync-lock.mjs";
import { contractViewState, fieldRef, savedView } from "../support/project-view-state.mjs";

const cli = fileURLToPath(new URL("../../scripts/ticket-projection.mjs", import.meta.url));
function snapshot() {
  return { fields: { nodes: [
    ...[["Answering group", ["Ready", "Waiting for answers", "Needs attention"]], ["Status", PROJECT_STATUS_OPTIONS], ["Board status", PROJECT_BOARD_STATUS_OPTIONS], ["Kind", PROJECT_KIND_OPTIONS], ["Complexity", PROJECT_COMPLEXITY_OPTIONS], ["Repository Ticket Layer", PROJECT_REPOSITORY_TICKET_LAYER_OPTIONS], ["Repositories", []]].map(([name, options]) => ({ name, dataType: name === "Repositories" ? "MULTISELECT" : "SINGLESELECT", options: options.map((option) => ({ name: option, ...(name === "Board status" ? { color: PROJECT_BOARD_STATUS_COLORS[option] } : {}) })) })),
    ...["Work area", "Waiting on"].map((name) => ({ name, dataType: "TEXT" })),
    ...["Domain", "Responsibility", "Category", "Build Units", "Repository Build Units", "Parent Decision", "Decision Status", "Decision Tickets", "Resume When"].map((name) => ({ name })),
  ] }, views: { nodes: PROJECT_VIEW_CONTRACT.map((view) => ({
    name: view.name, layout: view.layout, filter: view.filter,
    groupByFields: { nodes: view.groupBy.map((name) => ({ name })) },
    verticalGroupByFields: { nodes: view.verticalGroupBy.map((name) => ({ name })) },
    sortByFields: { nodes: view.sortBy.map(({ field, direction }) => ({ field: { name: field }, direction })) },
    configuration: { visibleFields: { nodes: view.visibleFields.map((name) => ({ name })) } },
  })) } };
}

test("project-view-audit CLI returns nonzero drift diagnostics and zero for correct saved API settings", (t) => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "project-view-cli-"));
  t.after(() => fs.rmSync(cwd, { recursive: true, force: true }));
  fs.mkdirSync(path.join(cwd, "design"));
  fs.writeFileSync(path.join(cwd, "software-design-ticket-projection.json"), JSON.stringify({ provider: "github", ticketRoot: "design", repository: "owner/repo", project: "owner/1", syncBranch: "shared" }));
  const bin = path.join(cwd, "bin"); fs.mkdirSync(bin);
  fs.writeFileSync(path.join(bin, "gh"), `#!${process.execPath}
const fs = require('node:fs');
const args = process.argv.slice(2);
if (args[0] === 'auth' && args[1] === 'status') process.exit(0);
if (args[0] === 'api' && args[1] === 'user') console.log(JSON.stringify({login:'test'}));
else if (args[0] === 'project') console.log(JSON.stringify({id:'PVT_1'}));
else if (args[0] === 'api' && args[1] === 'graphql') console.log(JSON.stringify({data:{node:JSON.parse(fs.readFileSync('snapshot.json','utf8'))}}));
else process.exit(9);
`, { mode: 0o755 });
  const data = snapshot();
  for (const invalid of [true, false]) {
    const current = structuredClone(data);
    if (invalid) current.views.nodes.find((view) => view.name === "All Tickets").sortByFields.nodes = [];
    fs.writeFileSync(path.join(cwd, "snapshot.json"), JSON.stringify(current));
    const result = spawnSync(process.execPath, [cli, "project-view-audit"], { cwd, env: { ...process.env, PATH: bin + path.delimiter + process.env.PATH }, encoding: "utf8" });
    assert.equal(result.status, invalid ? 1 : 0, result.stderr);
    assert.ok(result.stdout.trim(), result.stderr);
    const output = JSON.parse(result.stdout);
    assert.equal(output.apiPassed, !invalid);
    assert.equal(output.drifts.length > 0, invalid);
    assert.ok(output.manualUiChecks.every((check) => check.status === "required-ui-verification"));
  }
});


test("reconcile rejects publishing arguments before configuration or provider access", () => {
  const result = spawnSync(process.execPath, [cli, "reconcile", "--fix"], { cwd: os.tmpdir(), encoding: "utf8" });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unexpected argument: --fix/);
});

test("view-repair flags belong only to sync and fail before configuration or provider access", () => {
  for (const [args, expected] of [
    [["reconcile", "--views-only"], /Unexpected argument: --views-only/],
    [["project-view-audit", "--views-only"], /Unexpected argument: --views-only/],
    [["pending-comments", "--views-only"], /Unexpected argument: --views-only/],
    [["sync", "--create-views"], /requires at least one --view/],
    [["sync", "--view", "Tickets"], /requires --create-views/],
    [["sync", "--create-views", "--view", "Tickets", "--views-only"], /separate operations/],
    [["sync", "--create-views", "--view", "Tickets", "--fields-only"], /separate operations/],
    [["sync", "--create-views", "--view", "Tickets", "--rename-view", "1=Tickets"], /requires --views-only/],
    [["sync", "--create-views", "--view"], /selected enabled default view name/],
    [["sync", "--fields-only", "--views-only"], /separate operations/],
    [["sync", "--answering-option", "abc=Ready"], /requires --fields-only/],
    [["sync", "--fields-only", "--answering-option"], /needs <existing-option-id>=<new-name>/],
    [["sync", "--fields-only", "--answering-option", "abc=Ready", "--answering-option", "abc=Needs attention"], /unique existing option/],
    [["sync", "--fix"], /Unexpected argument: --fix/],
    [["sync", "--views-only", "--views-only"], /Unexpected argument: --views-only/],
    [["sync", "--rename-view", "4=Decision Areas"], /--rename-view requires --views-only/],
    [["sync", "--views-only", "--rename-view"], /--rename-view needs <view-number>=<contract view name>/],
    [["sync", "--views-only", "--rename-view", "0=Tickets"], /--rename-view needs <view-number>=<contract view name>/],
    [["sync", "--views-only", "--rename-view", "4=Decisions"], /target must be a contract view name/],
    [["sync", "--views-only", "--rename-view", "4=Tickets", "--rename-view", "4=Repositories"], /more than once/],
  ]) {
    const result = spawnSync(process.execPath, [cli, ...args], { cwd: os.tmpdir(), encoding: "utf8" });
    assert.equal(result.status, 1, args.join(" "));
    assert.match(result.stderr, expected, args.join(" "));
    assert.doesNotMatch(result.stderr, /Cannot read|GitHub/, args.join(" "));
  }
});

test("explicit view repair and REST creation honor the publishing lock, preflight, config omissions and exit outcomes", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "project-view-repair-cli-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const remote = path.join(root, "remote.git");
  const cwd = path.join(root, "work");
  execFileSync("git", ["init", "--bare", remote], { stdio: "ignore" });
  fs.mkdirSync(cwd);
  const git = (...args) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  git("init", "-b", "shared");
  git("config", "user.name", "Test"); git("config", "user.email", "test@example.invalid");
  fs.writeFileSync(path.join(cwd, "README.md"), "consumer\n");
  git("add", "."); git("commit", "-m", "baseline"); git("remote", "add", "origin", remote); git("push", "origin", "shared");
  fs.writeFileSync(path.join(cwd, ".git", "info", "exclude"), "software-design-ticket-projection.json\n");
  fs.writeFileSync(path.join(cwd, "software-design-ticket-projection.json"), JSON.stringify({ provider: "github", ticketRoot: "design", repository: "owner/repo", project: "owner/1", syncBranch: "shared" }));
  fs.mkdirSync(path.join(cwd, "design"));

  const statePath = path.join(root, "state.json");
  const logPath = path.join(root, "gh-calls.log");
  const state = contractViewState();
  state.fields.nodes.forEach((field, index) => { field.databaseId = 1000 + index; });
  savedView(state, "Tickets").filter = "";
  savedView(state, "All Tickets").sortByFields.nodes = [];
  fs.writeFileSync(statePath, JSON.stringify(state));
  fs.writeFileSync(logPath, "");
  const bin = path.join(root, "bin"); fs.mkdirSync(bin);
  fs.writeFileSync(path.join(bin, "gh"), `#!${process.execPath}
const fs = require('node:fs');
const args = process.argv.slice(2);
const log = (entry) => fs.appendFileSync(process.env.GH_CALL_LOG, JSON.stringify(entry) + '\\n');
const read = () => JSON.parse(fs.readFileSync(process.env.VIEW_STATE, 'utf8'));
if (args[0] === 'auth' || (args[0] === 'api' && args[1] === 'user')) { log({ kind: 'auth' }); console.log('test'); process.exit(0); }
if (args[0] === 'project' && args[1] === 'view') { log({ kind: 'project' }); console.log(JSON.stringify({ id: 'PVT_1', title: 'Design', url: 'https://github.com/users/owner/projects/1' })); process.exit(0); }
if (args[0] === 'api' && args[1] === 'users/owner') { console.log(JSON.stringify({type: 'User', login: 'owner', id: 420})); process.exit(0); }
if (args[0] === 'api' && args.some((arg) => arg.includes('ProjectViewSetupFields'))) { console.log(JSON.stringify({data: {node: {fields: read().fields}}})); process.exit(0); }
if (args[0] === 'api' && args[1] === 'users/420/projectsV2/1/views' && args.includes('POST')) {
  if (!fs.existsSync(process.env.PUBLISHING_LOCK)) { console.error('missing lock'); process.exit(9); }
  const body = JSON.parse(fs.readFileSync(0, 'utf8'));
  log({ kind: 'create', body });
  const current = read();
  const ref = (id) => { const field = current.fields.nodes.find((field) => field.databaseId === id); if (!field) throw new Error('bad REST ID'); return {id: field.id, name: field.name}; };
  const view = { id: 'NEW_VIEW', number: 20, name: body.name, layout: body.layout.toUpperCase() + '_LAYOUT', filter: body.filter,
    configuration: {visibleFields: {nodes: body.visible_fields.map(ref)}},
    sortByFields: {nodes: body.sort_by.map(([id, direction]) => ({field: ref(id), direction: direction.toUpperCase()}))},
    groupByFields: {nodes: body.group_by.map(ref)}, verticalGroupByFields: {nodes: (body.vertical_group_by || []).map(ref)} };
  current.views.nodes.push(view);
  fs.writeFileSync(process.env.VIEW_STATE, JSON.stringify(current));
  console.log(JSON.stringify({value: {node_id: view.id, number: view.number, html_url: 'https://github.com/users/owner/projects/1/views/20'}})); process.exit(0);
}
if (args[0] === 'api' && args[1] === 'graphql' && args[2] === '--input') {
  const update = JSON.parse(fs.readFileSync(0, 'utf8')).variables.input;
  log({ kind: 'mutation', update });
  const current = read();
  const view = current.views.nodes.find((candidate) => candidate.id === update.viewId);
  for (const key of ['name', 'layout', 'filter']) if (key in update) view[key] = update[key];
  if (update.configuration) {
    const fields = new Map(current.fields.nodes.map((field) => [field.id, field]));
    view.configuration.visibleFields.nodes = update.configuration.visibleFieldIds.map((id) => ({ id, name: fields.get(id).name }));
  }
  fs.writeFileSync(process.env.VIEW_STATE, JSON.stringify(current));
  console.log(JSON.stringify({ data: { updateProjectV2View: { projectV2View: { id: update.viewId } } } }));
  process.exit(0);
}
if (args[0] === 'api' && args[1] === 'graphql' && args.some((arg) => arg.includes('ProjectViewConfiguration'))) { log({ kind: 'view-read' }); console.log(JSON.stringify({ data: { node: read() } })); process.exit(0); }
log({ kind: 'unexpected', args });
process.exit(9);
`, { mode: 0o755 });
  const env = { ...process.env, PATH: bin + path.delimiter + process.env.PATH, GH_CALL_LOG: logPath, VIEW_STATE: statePath, PUBLISHING_LOCK: syncLockPath(cwd) };
  const run = (...args) => spawnSync(process.execPath, [cli, ...(args.length ? args : ["sync", "--views-only"])], { cwd, env, encoding: "utf8" });
  const calls = () => fs.readFileSync(logPath, "utf8").split("\n").filter(Boolean).map((line) => JSON.parse(line));
  const projectCallsSince = (start) => calls().slice(start).filter((call) => call.kind !== "auth");

  let result = run();
  assert.equal(result.status, 2, result.stderr);
  let output = JSON.parse(result.stdout);
  assert.equal(output.outcome, "github-ui-configuration-required");
  assert.deepEqual(output.verified.map((entry) => `${entry.view}:${entry.property}`), ["Tickets:filter"]);
  assert.deepEqual(output.remainingGitHubUi.map((drift) => `${drift.name}:${drift.property}`), ["All Tickets:sortBy"]);
  assert.deepEqual(calls().filter((call) => call.kind === "mutation").map((call) => call.update), [{ viewId: "PVTV_1", filter: PROJECT_VIEW_CONTRACT[0].filter }]);
  assert.deepEqual(calls().filter((call) => call.kind === "unexpected"), []);
  assert.equal(fs.existsSync(syncLockPath(cwd)), false, "the lock is released after the run");
  assert.equal(git("status", "--porcelain"), "");
  assert.equal(git("rev-parse", "--abbrev-ref", "HEAD").trim(), "shared");

  result = run();
  assert.equal(result.status, 2, result.stderr);
  assert.equal(JSON.parse(result.stdout).plannedUpdates, 0);
  assert.equal(calls().filter((call) => call.kind === "mutation").length, 1, "a repeat run performs zero mutations and never retries unsupported settings");

  let start = calls().length;
  fs.writeFileSync(path.join(cwd, "scratch.txt"), "local edit\n");
  result = run();
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Local changes prevent publishing/);
  assert.deepEqual(projectCallsSince(start), []);
  fs.unlinkSync(path.join(cwd, "scratch.txt"));

  start = calls().length;
  fs.writeFileSync(syncLockPath(cwd), "{\"pid\":12345}\n");
  result = run();
  assert.equal(result.status, 1);
  assert.match(result.stderr, /already running/);
  assert.deepEqual(projectCallsSince(start), []);
  assert.equal(fs.existsSync(syncLockPath(cwd)), true, "an existing lock is never removed automatically");
  fs.unlinkSync(syncLockPath(cwd));

  const saved = JSON.parse(fs.readFileSync(statePath, "utf8"));
  savedView(saved, "All Tickets").sortByFields.nodes = [{ field: fieldRef("Status"), direction: "ASC" }];
  fs.writeFileSync(statePath, JSON.stringify(saved));
  result = run();
  assert.equal(result.status, 0, result.stderr);
  output = JSON.parse(result.stdout);
  assert.equal(output.outcome, "audit-passed-ui-checks-required");
  assert.ok(output.audit.manualUiChecks.length > 0 && output.audit.manualUiChecks.every((check) => check.status === "required-ui-verification"));
  assert.match(output.nextStep, /not complete until they pass/);

  const creationState = JSON.parse(fs.readFileSync(statePath, "utf8"));
  creationState.views.nodes = creationState.views.nodes.filter((view) => !["Tickets", "Repositories"].includes(view.name));
  const preservedViews = structuredClone(creationState.views.nodes);
  fs.writeFileSync(statePath, JSON.stringify(creationState));
  const configPath = path.join(cwd, "software-design-ticket-projection.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  config.omittedViews = ["Repositories"];
  fs.writeFileSync(configPath, JSON.stringify(config));
  result = run("sync", "--create-views", "--view", "Tickets");
  assert.equal(result.status, 2, result.stderr);
  output = JSON.parse(result.stdout);
  assert.equal(output.outcome, "view-setup-api-verified-browser-pending");
  assert.equal(output.verified[0].id, "NEW_VIEW");
  assert.deepEqual(output.audit.requiredVisibleOrder, ["Tickets", "Software", "Product & Operations", "All Tickets", "Decision Areas", "Out-of-Scope"]);
  assert.equal(output.audit.manualUiChecks.some((check) => check.id === "repositories-repo-slice"), false);
  assert.deepEqual(JSON.parse(fs.readFileSync(statePath, "utf8")).views.nodes.slice(0, -1), preservedViews);
  assert.equal(fs.existsSync(syncLockPath(cwd)), false);
  result = run("sync", "--create-views", "--view", "Tickets");
  assert.equal(result.status, 2, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout).created, []);
  assert.equal(calls().filter((call) => call.kind === "create").length, 1);
  start = calls().length;
  fs.writeFileSync(syncLockPath(cwd), '{"pid":12345}');
  result = run("sync", "--create-views", "--view", "Tickets");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /already running/);
  assert.deepEqual(projectCallsSince(start), []);
  fs.unlinkSync(syncLockPath(cwd));
  result = run("sync", "--create-views", "--view", "Repositories");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /enabled default views/);
  assert.equal(git("status", "--porcelain"), "");

});
