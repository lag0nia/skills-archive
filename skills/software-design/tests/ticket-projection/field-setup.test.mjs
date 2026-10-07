import assert from "node:assert/strict";
import test from "node:test";
import { planFieldSetup } from "../../scripts/lib/ticket-projection/field-setup.mjs";
import { createGitHubAdapter } from "../../scripts/lib/ticket-projection/github/adapter.mjs";
import { contractViewState } from "../support/project-view-state.mjs";

const config = { provider: "github", syncBranch: "main", ticketRoot: "design/software-design", repository: "owner/repository", project: "owner/7" };
function fields() {
  const result = contractViewState().fields.nodes;
  for (const field of result) for (const [i, option] of (field.options || []).entries()) if (field.name !== "Board status") option.color = ["GREEN", "YELLOW", "RED", "BLUE", "GRAY"][i];
  return result;
}

test("explicit mappings preserve option identity, color and complete option sets", () => {
  const state = fields();
  const field = state.find((field) => field.name === "Answering group");
  const original = structuredClone(field.options);
  field.options.forEach((option, i) => { option.name = `Old ${i}`; option.description = "Verbose"; });
  field.options.reverse();
  const mapping = Object.fromEntries(original.map((option) => [option.id, option.name]));
  const [update] = planFieldSetup(state, mapping);
  assert.deepEqual(update.singleSelectOptions, original);
  assert.equal(update.fieldId, field.id);
  field.options = update.singleSelectOptions;
  assert.deepEqual(planFieldSetup(state, mapping), []);
  assert.throws(() => planFieldSetup(state, { bogus: "Ready" }), /Unknown/);
  field.options.push({ id: "OTHER", name: "Custom", color: "GRAY" });
  assert.throws(() => planFieldSetup(state), /conflict/);
});

test("missing, duplicate and incompatible fields fail closed", () => {
  for (const mutate of [
    (s) => s.filter((f) => f.name !== "Answering group"),
    (s) => [...s, s.find((f) => f.name === "Answering group")],
    (s) => s.map((f) => f.name === "Answering group" ? { ...f, dataType: "TEXT" } : f),
  ]) assert.throws(() => planFieldSetup(mutate(fields())), /exactly one|single-select/);
});

function provider(state, { failField, ignore = false, dirty = false, rereadFailure = false } = {}) {
  const calls = []; let reads = 0;
  const run = async (call) => {
    calls.push(call);
    const { command, args, input } = call;
    const json = (value) => ({ stdout: JSON.stringify(value) });
    if (command === "git") {
      if (args[0] === "symbolic-ref") return { stdout: "main" };
      if (args[0] === "remote") return { stdout: "https://github.com/owner/repository.git" };
      if (args[0] === "rev-parse") return { stdout: args.includes("--show-toplevel") ? "/tmp/consumer" : "a".repeat(40) };
      return { stdout: dirty && args[0] === "status" ? " M dirty\0" : "" };
    }
    if (args[0] === "project" && args[1] === "view") return json({ id: "PROJECT" });
    if (args.some((arg) => arg.includes("ProjectProjectionFields"))) {
      if (++reads > 1 && rereadFailure) throw new Error("read unavailable");
      return json({ data: { node: { fields: { nodes: state } } } });
    }
    if (input) {
      const request = JSON.parse(input);
      assert.match(request.query, /updateProjectV2Field/);
      const update = request.variables.input;
      if (update.fieldId === failField) throw new Error("permission denied");
      if (!ignore) state.find((field) => field.id === update.fieldId).options = structuredClone(update.singleSelectOptions);
      return json({ data: { updateProjectV2Field: { projectV2Field: { id: update.fieldId } } } });
    }
    throw new Error("Unexpected call");
  };
  return { run, calls };
}

test("bounded setup writes and verifies only option differences then becomes idempotent", async () => {
  const state = fields();
  state.find((f) => f.name === "Status").options[0].description = "Verbose";
  const p = provider(state); const adapter = createGitHubAdapter({ run: p.run });
  const result = await adapter.setupFields({ config });
  assert.equal(result.verified.length, 1);
  assert.deepEqual((await adapter.setupFields({ config })).applied, []);
  assert.equal(p.calls.filter((c) => c.input).length, 1);
  assert.ok(p.calls.every((c) => c.command === "git" || c.args[0] === "api" || c.args[1] === "view"));
});

test("setup preserves preflight, partial failure, and verification refusal", async () => {
  const state = fields();
  for (const f of state.filter((f) => ["Status", "Answering group"].includes(f.name))) f.options[0].description = "Verbose";
  const attention = state.find((f) => f.name === "Answering group").id;
  const partial = provider(structuredClone(state), { failField: attention });
  await assert.rejects(createGitHubAdapter({ run: partial.run }).setupFields({ config }), /Applied: F_STATUS.*Not attempted: none/);
  const dirty = provider(structuredClone(state), { dirty: true });
  await assert.rejects(createGitHubAdapter({ run: dirty.run }).setupFields({ config }), /Local changes/);
  assert.equal(dirty.calls.some((c) => c.command === "gh"), false);
  const ignored = provider(structuredClone(state), { ignore: true });
  await assert.rejects(createGitHubAdapter({ run: ignored.run }).setupFields({ config }), /unverified/);
  const unreadable = provider(structuredClone(state), { rereadFailure: true });
  await assert.rejects(createGitHubAdapter({ run: unreadable.run }).setupFields({ config }), /unverified.*F_STATUS/);
});

 test("Board status colors are audited and repaired in place without changing identities", async () => {
  const { auditProjectViewContract } = await import("../../scripts/lib/ticket-projection/core.mjs");
  const state = fields();
  const board = state.find((f) => f.name === "Board status");
  const original = structuredClone(board.options);
  board.options.forEach((option) => { option.color = "GRAY"; });
  const audit = auditProjectViewContract({ fields: { nodes: state }, views: contractViewState().views });
  assert.equal(audit.drifts.filter((d) => d.property === "optionColor").length, 5);
  const p = provider(state);
  await createGitHubAdapter({ run: p.run }).setupFields({ config });
  assert.deepEqual(board.options, original);
  assert.deepEqual(planFieldSetup(state), []);
  assert.equal(p.calls.filter((c) => c.input).length, 1);
});
