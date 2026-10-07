import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import test from "node:test";
import { publishingPreflight } from "../../scripts/lib/ticket-projection/publishing-preflight.mjs";
import { acquireSyncLock } from "../../scripts/lib/ticket-projection/sync-lock.mjs";

function workspace(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "publishing-preflight-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const remote = path.join(root, "remote.git");
  const cwd = path.join(root, "work");
  execFileSync("git", ["init", "--bare", remote], { stdio: "ignore" });
  fs.mkdirSync(cwd);
  const git = (...args) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  git("init", "-b", "shared");
  git("config", "user.name", "Test"); git("config", "user.email", "test@example.invalid");
  fs.writeFileSync(path.join(cwd, "record.md"), "approved\n");
  git("add", "."); git("commit", "-m", "baseline"); git("remote", "add", "origin", remote); git("push", "origin", "shared");
  const calls = [];
  const execute = async (command, args) => { calls.push([command, ...args]); return git(...args); };
  return { cwd, git, calls, input: { config: { syncBranch: "shared" }, execute } };
}

test("fresh exact origin branch and clean working tree pass without modifying canonical files", async (t) => {
  const { input, calls, git } = workspace(t);
  const before = git("rev-parse", "HEAD").trim();
  const result = await publishingPreflight(input);
  assert.equal(result.head, before);
  assert.equal(result.branch, "shared");
  assert.ok(calls.some((args) => args.join(" ") === "git fetch --no-tags origin +refs/heads/shared:refs/remotes/origin/shared"));
  assert.equal(git("status", "--porcelain"), "");
});

test("only the owned lock is exempt; unignored config and other files block publishing", async (t) => {
  const { input, cwd, git } = workspace(t);
  const lock = acquireSyncLock(cwd); t.after(lock);
  await publishingPreflight({ ...input, publishingLock: lock });
  assert.throws(() => acquireSyncLock(cwd), /already running/);
  await assert.rejects(publishingPreflight(input), /Local changes/);
  const configPath = path.join(cwd, "software-design-ticket-projection.json");
  fs.writeFileSync(configPath, "{}\n");
  await assert.rejects(publishingPreflight({ ...input, publishingLock: lock }), /must be Git-ignored/);
  fs.writeFileSync(path.join(cwd, ".git", "info", "exclude"), "software-design-ticket-projection.json\n");
  await publishingPreflight({ ...input, publishingLock: lock });
  fs.writeFileSync(path.join(cwd, "unrelated.txt"), "untracked");
  await assert.rejects(publishingPreflight({ ...input, publishingLock: lock }), /Local changes/);
  fs.unlinkSync(path.join(cwd, "unrelated.txt"));
  fs.writeFileSync(lock.path, "another owner\n");
  await assert.rejects(publishingPreflight({ ...input, publishingLock: lock }), /lock ownership/);
  assert.equal(git("rev-parse", "--abbrev-ref", "HEAD").trim(), "shared");
});
