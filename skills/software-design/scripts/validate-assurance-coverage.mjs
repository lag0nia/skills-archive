#!/usr/bin/env node

import path from "node:path";
import { loadAssuranceContext, parseAssuranceRepositoryMapping } from "./lib/model/assurance-coverage.mjs";
import { isEntryPoint } from "./lib/entry-point.mjs";

function parseArgs(argv) {
  const args = { root: null, repositoryRoots: new Map() };
  for (let index = 2; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--root") args.root = argv[++index];
    else if (value === "--repository") {
      const [id, repositoryRoot] = parseAssuranceRepositoryMapping(argv[++index]);
      if (args.repositoryRoots.has(id)) throw new Error("Duplicate --repository mapping for " + id + ".");
      args.repositoryRoots.set(id, repositoryRoot);
    } else throw new Error("Unknown argument: " + value);
  }
  if (!args.root) {
    throw new Error("Use --root <software-design-package> [--repository REPO-NNN=<implementation-repository-path> ...].");
  }
  args.root = path.resolve(args.root);
  return args;
}

export function validateAssuranceCoverage(args) {
  const context = loadAssuranceContext(args);
  return { context, errors: [...context.errors, ...context.gaps] };
}

function main() {
  const result = validateAssuranceCoverage(parseArgs(process.argv));
  if (result.errors.length) throw new Error("Assurance coverage validation failed:\n- " + result.errors.join("\n- "));
  console.log("Assurance coverage is structurally complete for " + result.context.expectedAssignments.size + " Build Unit assignment(s).");
}

if (isEntryPoint(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
