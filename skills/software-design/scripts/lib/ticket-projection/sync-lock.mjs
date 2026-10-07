import fs from "node:fs";
import path from "node:path";

const LOCK_FILENAME = ".software-design-ticket-projection.sync.lock";

export function syncLockPath(cwd = process.cwd()) {
  return path.join(path.resolve(cwd), LOCK_FILENAME);
}

export function acquireSyncLock(cwd = process.cwd()) {
  const lockPath = syncLockPath(cwd);
  const token = `${process.pid}:${Date.now()}:${Math.random().toString(16).slice(2)}`;
  const contents = `${JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString(), operation: "ticket-projection-sync", token })}\n`;
  let fileDescriptor;
  try {
    fileDescriptor = fs.openSync(lockPath, "wx", 0o600);
    fs.writeFileSync(fileDescriptor, contents, "utf8");
  } catch (error) {
    if (fileDescriptor !== undefined) fs.closeSync(fileDescriptor);
    if (error?.code === "EEXIST") {
      throw new Error(
        `A ticket-projection sync is already running for this workspace. Lock: ${lockPath}. `
        + "Do not start another sync. If a previous process crashed, first verify that no projection command is still running, then remove this stale lock manually.",
      );
    }
    throw error;
  }

  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    try {
      fs.closeSync(fileDescriptor);
    } finally {
      try {
        if (fs.readFileSync(lockPath, "utf8") === contents) fs.unlinkSync(lockPath);
      } catch (error) {
        if (error?.code !== "ENOENT") throw error;
      }
    }
  };
  release.path = lockPath;
  release.verify = () => {
    if (released || fs.lstatSync(lockPath).isSymbolicLink() || fs.readFileSync(lockPath, "utf8") !== contents
      || fs.statSync(lockPath).ino !== fs.fstatSync(fileDescriptor).ino) {
      throw new Error("Publishing lock ownership changed; stop and inspect the workspace lock.");
    }
  };
  return release;
}
