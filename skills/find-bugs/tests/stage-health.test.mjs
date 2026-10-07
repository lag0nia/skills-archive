import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import { promisify } from "node:util";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const execFileAsync = promisify(execFile);
const script = fileURLToPath(new URL("../scripts/stage-health.mjs", import.meta.url));

async function run(runtime, ...args) {
  const parseOutput = (output) => output?.trim() ? JSON.parse(output) : null;
  try {
    const result = await execFileAsync(process.execPath, [script, ...args], { env: process.env });
    return { code: 0, json: parseOutput(result.stdout) };
  } catch (error) {
    return { code: error.code, json: parseOutput(error.stdout) };
  }
}

async function fixture() {
  const root = await mkdtemp(join(os.tmpdir(), "find-bugs-stage-health-"));
  const heartbeat = join(root, "heartbeat.json");
  const common = ["--path", heartbeat, "--audit-id", "audit-test", "--stage", "MAPPER"];
  return { root, heartbeat, common };
}

test("init uses a current timestamp and startup remains pending", async () => {
  const { root, heartbeat, common } = await fixture();
  try {
    const initialized = await run(root, "init", ...common);
    assert.equal(initialized.code, 0);
    assert.equal(initialized.json.status, "STARTING");
    assert.notEqual(initialized.json.updated_at, "2026-01-01T00:00:00Z");
    const checked = await run(root, "check", "--path", heartbeat, "--now", "2026-08-08T20:10:00Z");
    assert.equal(checked.code, 0);
    assert.equal(checked.json.state, "STARTING");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("startup remains pending until the first heartbeat", async () => {
  const { root, heartbeat, common } = await fixture();
  try {
    const initialized = await run(root, "init", ...common, "--now", "2026-08-07T20:00:00Z");
    const checked = await run(root, "check", "--path", heartbeat, "--now", "2026-08-07T20:30:00Z");
    assert.equal(checked.code, 0);
    assert.equal(checked.json.state, "STARTING");
    assert.match(checked.json.reason, /awaiting first RUNNING/);
    assert.equal(initialized.json.run_token.length > 0, true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("the first running heartbeat remains valid without a post-handshake deadline", async () => {
  const { root, heartbeat, common } = await fixture();
  try {
    const initialized = await run(root, "init", ...common, "--now", "2026-08-07T20:00:00Z");
    const token = initialized.json.run_token;
    const updated = await run(root, "update", "--path", heartbeat, "--audit-id", "audit-test", "--stage", "MAPPER", "--run-token", token, "--now", "2026-08-07T20:00:01Z", "--checkpoint", "started");
    assert.equal(updated.code, 0);
    const running = await run(root, "check", "--path", heartbeat, "--now", "2026-08-07T20:01:32Z");
    assert.equal(running.code, 0);
    assert.equal(running.json.state, "RUNNING");
    assert.match(running.json.reason, /first RUNNING heartbeat/);
    const repeated = await run(root, "update", "--path", heartbeat, "--audit-id", "audit-test", "--stage", "MAPPER", "--run-token", token, "--now", "2026-08-07T20:02:00Z", "--checkpoint", "should be rejected");
    assert.equal(repeated.code, 2);
    const later = await run(root, "check", "--path", heartbeat, "--now", "2026-08-08T20:00:00Z");
    assert.equal(later.code, 0);
    assert.equal(later.json.state, "RUNNING");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("completed and unsupported statuses remain deterministic", async () => {
  const { root, heartbeat, common } = await fixture();
  try {
    const initialized = await run(root, "init", ...common, "--now", "2026-08-07T20:00:00Z");
    await writeFile(heartbeat, `${JSON.stringify({ ...initialized.json, status: "COMPLETED" })}\n`);
    const completed = await run(root, "check", "--path", heartbeat);
    assert.equal(completed.code, 0);
    assert.equal(completed.json.state, "COMPLETED");
    await writeFile(heartbeat, `${JSON.stringify({ ...initialized.json, status: "PAUSED" })}\n`);
    const unsupported = await run(root, "check", "--path", heartbeat);
    assert.equal(unsupported.code, 10);
    assert.equal(unsupported.json.state, "HEALTH_UNVERIFIABLE");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("closing a stage prevents late heartbeat resurrection", async () => {
  const { root, heartbeat, common } = await fixture();
  try {
    const initialized = await run(root, "init", ...common, "--now", "2026-08-07T20:00:00Z");
    const token = initialized.json.run_token;
    const closed = await run(root, "close", "--path", heartbeat, "--audit-id", "audit-test", "--stage", "MAPPER", "--run-token", token, "--now", "2026-08-07T20:00:10Z", "--reason", "health unverifiable");
    assert.equal(closed.code, 0);
    const late = await run(root, "update", "--path", heartbeat, "--audit-id", "audit-test", "--stage", "MAPPER", "--run-token", token, "--now", "2026-08-07T20:00:11Z");
    assert.equal(late.code, 2);
    const checked = await run(root, "check", "--path", heartbeat, "--now", "2026-08-07T20:00:12Z");
    assert.equal(checked.code, 10);
    assert.equal(checked.json.state, "CLOSED");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
