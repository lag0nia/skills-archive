import fs from "node:fs";
import { fileURLToPath } from "node:url";

// Node resolves import.meta.url to the module's real path, but process.argv[1] keeps
// the path the caller typed, which may run through a symlinked skill directory.
export function isEntryPoint(moduleUrl) {
  if (!process.argv[1]) return false;
  try {
    return fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(moduleUrl));
  } catch {
    return false;
  }
}
