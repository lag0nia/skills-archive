import path from "node:path";
import fs from "node:fs";

// No provider command is allowed before this gate succeeds.
export async function publishingPreflight({ config, execute, publishingLock = null }) {
  const branch = config.syncBranch;
  if (typeof branch !== "string" || !branch.trim() || branch !== branch.trim()) {
    throw new Error("Missing or invalid syncBranch configuration; explicitly name the shared publishing branch.");
  }
  const git = (...args) => execute("git", args);
  await git("check-ref-format", "--branch", branch);
  let current;
  try { current = (await git("symbolic-ref", "--quiet", "--short", "HEAD")).trim(); }
  catch { throw new Error("Detached HEAD or indeterminate branch; publishing requires the configured syncBranch."); }
  if (current !== branch) throw new Error(`Wrong branch: expected ${branch}, found ${current || "unknown"}. Update the local shared branch before publishing.`);
  const root = (await git("rev-parse", "--show-toplevel")).trim();
  if (!path.isAbsolute(root)) throw new Error("Indeterminate repository root; refusing publishing.");
  async function clean() {
    publishingLock?.verify();
    const status = await git("status", "--porcelain=v1", "-z", "--untracked-files=all");
    const entries = status.split("\0").filter(Boolean);
    const ownLock = publishingLock ? path.relative(fs.realpathSync(root), fs.realpathSync(publishingLock.path)).split(path.sep).join("/") : null;
    if (entries.some((entry) => entry !== `?? ${ownLock}` || !publishingLock)) {
      throw new Error("Local changes prevent publishing: commit or remove staged, unstaged, and untracked changes. The uncommitted software-design-ticket-projection.json must be Git-ignored. No files were changed automatically.");
    }
  }
  await clean();
  let origin;
  try { origin = (await git("remote", "get-url", "origin")).trim(); }
  catch { throw new Error("Missing origin remote; configure the shared repository before publishing."); }
  if (!origin) throw new Error("Missing origin remote URL; refusing publishing.");
  const remoteRef = `refs/remotes/origin/${branch}`;
  try { await git("fetch", "--no-tags", "origin", `+refs/heads/${branch}:${remoteRef}`); }
  catch (error) { throw new Error(`Fetch failure: could not fetch ${branch} from origin (check branch existence, access, and connectivity). ${error.message}`); }
  const head = (await git("rev-parse", "--verify", "HEAD^{commit}")).trim();
  const remote = (await git("rev-parse", "--verify", `${remoteRef}^{commit}`)).trim();
  if (!/^[a-f0-9]{40,64}$/.test(head) || !/^[a-f0-9]{40,64}$/.test(remote)) throw new Error("Indeterminate local or fetched commit; refusing publishing.");
  if (head !== remote) {
    const counts = (await git("rev-list", "--left-right", "--count", `HEAD...${remoteRef}`)).trim();
    const match = /^(\d+)\s+(\d+)$/.exec(counts);
    if (!match || (+match[1] === 0 && +match[2] === 0)) throw new Error("Indeterminate history comparison; refusing publishing.");
    const [ahead, behind] = match.slice(1).map(Number);
    if (ahead && !behind) throw new Error(`Unpushed commits: local ${branch} is ahead of origin/${branch} by ${ahead}. Push or merge the reviewed work before publishing.`);
    if (behind && !ahead) throw new Error(`Behind remote: local ${branch} is behind origin/${branch} by ${behind}. Update the local shared branch before publishing.`);
    throw new Error(`Diverged history: local ${branch} is ${ahead} ahead and ${behind} behind origin/${branch}. Resolve it manually before publishing.`);
  }
  if ((await git("symbolic-ref", "--quiet", "--short", "HEAD")).trim() !== branch) throw new Error("Branch changed during preflight; refusing publishing.");
  await clean();
  return { branch, head, remote: "origin" };
}
