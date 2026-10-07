#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { acquireSyncLock, syncLockPath } from "../../scripts/lib/ticket-projection/sync-lock.mjs";

test("sync lock excludes a second projection writer and releases after completion", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "software-design-sync-lock-"));
  try {
    const lockPath = syncLockPath(directory);
    const release = acquireSyncLock(directory);
    assert.equal(fs.existsSync(lockPath), true);
    assert.throws(() => acquireSyncLock(directory), /already running/);
    release();
    assert.equal(fs.existsSync(lockPath), false);
    const secondRelease = acquireSyncLock(directory);
    secondRelease();
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("sync lock refuses an existing stale lock instead of removing it automatically", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "software-design-sync-lock-"));
  try {
    const lockPath = syncLockPath(directory);
    fs.writeFileSync(lockPath, '{"pid":12345}\n', "utf8");
    assert.throws(() => acquireSyncLock(directory), /verify that no projection command is still running/);
    assert.equal(fs.existsSync(lockPath), true);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
