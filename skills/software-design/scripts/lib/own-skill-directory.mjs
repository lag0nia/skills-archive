import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SKILL_DIRECTORY = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

// Transitional: callers written for the former separate planning skill pass
// --software-design-skill. Accept it only when it names this very skill, so a stale
// or foreign installation can never stand in for the validator actually running.
export function assertOwnSkillDirectory(value) {
  if (!value) throw new Error("Missing --software-design-skill value.");
  let supplied;
  try {
    supplied = fs.realpathSync(path.resolve(value));
  } catch {
    throw new Error("--software-design-skill does not exist: " + value);
  }
  if (supplied !== fs.realpathSync(SKILL_DIRECTORY)) {
    throw new Error("--software-design-skill must be this skill's own directory (" + SKILL_DIRECTORY + "); omit it, since this validator always uses its own Software Design scripts.");
  }
}
