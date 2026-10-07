#!/usr/bin/env node

import { randomUUID } from "node:crypto";
import { dirname } from "node:path";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";

const HEALTHY = 0;
const HEALTH_UNVERIFIABLE = 10;
const INVALID_ARGS = 2;

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const args = { command };
  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (!token.startsWith("--")) throw new Error(`Unexpected argument: ${token}`);
    const key = token.slice(2).replaceAll("-", "_");
    const value = rest[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for --${key.replaceAll("_", "-")}`);
    args[key] = value;
    index += 1;
  }
  return args;
}

function requireArg(args, name) {
  if (!args[name]) throw new Error(`Missing required argument: --${name.replaceAll("_", "-")}`);
  return args[name];
}

function nowIso(args) {
  const value = args.now ? new Date(args.now) : new Date();
  if (Number.isNaN(value.getTime())) throw new Error(`Invalid --now timestamp: ${args.now}`);
  return value.toISOString();
}

async function atomicWrite(path, value) {
  await mkdir(dirname(path), { recursive: true });
  const temporaryPath = `${path}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  await rename(temporaryPath, path);
}

async function readJson(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

function baseRecord(args, status, timestamp) {
  return {
    audit_id: requireArg(args, "audit_id"),
    stage: requireArg(args, "stage"),
    run_token: args.run_token || randomUUID(),
    status,
    started_at: timestamp,
    updated_at: timestamp,
    last_completed_checkpoint: args.checkpoint || "stage initialized",
    next_action: args.next_action || "continue stage work"
  };
}

function closedPath(heartbeatPath) {
  return `${heartbeatPath}.closed.json`;
}

async function init(args) {
  const path = requireArg(args, "path");
  const record = baseRecord(args, "STARTING", nowIso(args));
  await atomicWrite(path, record);
  process.stdout.write(`${JSON.stringify(record)}\n`);
}

async function update(args) {
  const path = requireArg(args, "path");
  const existing = await readJson(path);
  if (!existing) throw new Error(`Heartbeat does not exist: ${path}`);
  const token = requireArg(args, "run_token");
  if (existing.run_token !== token) throw new Error("Heartbeat run token does not match");
  if (await readJson(closedPath(path))) throw new Error("Stage is already closed; late heartbeat rejected");
  if (String(existing.status).toUpperCase() !== "STARTING") {
    throw new Error("First RUNNING heartbeat already published; recurring heartbeats are disabled");
  }
  const status = (args.status || "RUNNING").toUpperCase();
  if (status !== "RUNNING") throw new Error("The first stage heartbeat must use status RUNNING");
  const record = {
    ...existing,
    status,
    updated_at: nowIso(args),
    last_completed_checkpoint: args.checkpoint || existing.last_completed_checkpoint,
    next_action: args.next_action || existing.next_action
  };
  await atomicWrite(path, record);
  process.stdout.write(`${JSON.stringify(record)}\n`);
}

async function closeStage(args) {
  const path = requireArg(args, "path");
  const existing = await readJson(path);
  if (!existing) throw new Error(`Heartbeat does not exist: ${path}`);
  const token = requireArg(args, "run_token");
  if (existing.run_token !== token) throw new Error("Heartbeat run token does not match");
  const closed = {
    audit_id: existing.audit_id,
    stage: existing.stage,
    run_token: existing.run_token,
    status: "CLOSED",
    closed_at: nowIso(args),
    reason: args.reason || "controller closed stage"
  };
  await atomicWrite(closedPath(path), closed);
  await atomicWrite(path, {
    ...existing,
    status: "CLOSED",
    updated_at: closed.closed_at,
    next_action: closed.reason
  });
  process.stdout.write(`${JSON.stringify(closed)}\n`);
}

function result(state, reason, extras = {}) {
  const healthy = state === "STARTING" || state === "RUNNING" || state === "COMPLETED";
  return { state, healthy, reason, ...extras };
}

async function check(args) {
  const path = requireArg(args, "path");
  const closed = await readJson(closedPath(path));
  if (closed) {
    process.stdout.write(`${JSON.stringify(result("CLOSED", closed.reason, { closed_at: closed.closed_at }))}\n`);
    process.exitCode = HEALTH_UNVERIFIABLE;
    return;
  }

  const heartbeat = await readJson(path);
  if (!heartbeat) {
    process.stdout.write(`${JSON.stringify(result("HEALTH_UNVERIFIABLE", "heartbeat is missing"))}\n`);
    process.exitCode = HEALTH_UNVERIFIABLE;
    return;
  }
  const updatedAt = new Date(heartbeat.updated_at);
  if (!heartbeat.audit_id || !heartbeat.stage || !heartbeat.run_token || Number.isNaN(updatedAt.getTime())) {
    process.stdout.write(`${JSON.stringify(result("HEALTH_UNVERIFIABLE", "heartbeat schema or timestamp is invalid"))}\n`);
    process.exitCode = HEALTH_UNVERIFIABLE;
    return;
  }
  const status = String(heartbeat.status).toUpperCase();
  if (status === "STARTING") {
    process.stdout.write(`${JSON.stringify(result("STARTING", "awaiting first RUNNING heartbeat"))}\n`);
    return;
  }
  if (status === "COMPLETED") {
    process.stdout.write(`${JSON.stringify(result("COMPLETED", "stage reported completion"))}\n`);
    return;
  }
  if (status !== "RUNNING" && status !== "ACTIVE") {
    process.stdout.write(`${JSON.stringify(result("HEALTH_UNVERIFIABLE", `unsupported heartbeat status: ${heartbeat.status}`))}\n`);
    process.exitCode = HEALTH_UNVERIFIABLE;
    return;
  }
  process.stdout.write(`${JSON.stringify(result("RUNNING", "first RUNNING heartbeat accepted; awaiting stage receipt"))}\n`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.command === "init") return init(args);
  if (args.command === "update") return update(args);
  if (args.command === "close") return closeStage(args);
  if (args.command === "check") return check(args);
  throw new Error(`Unknown command: ${args.command || "(missing)"}`);
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = INVALID_ARGS;
});
