#!/usr/bin/env node

import { isEntryPoint } from "./lib/entry-point.mjs";
import { affectedDecisions, checkDecisionOverview, writeDecisionOverview } from "./lib/decision-overview.mjs";

function parseArgs(argv) {
  const args = { root: null, check: false, affected: [] };
  for (let index = 2; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--root" || value === "--affected") {
      const next = argv[++index];
      if (!next || next.startsWith("--")) throw new Error("Missing value for " + value + ".");
      if (value === "--root") args.root = next;
      else args.affected.push(next);
    } else if (value === "--check") args.check = true;
    else throw new Error("Unknown argument: " + value);
  }
  if (!args.root) throw new Error("Use --root <software-design-package> [--check | --affected <path|TICKET-NNNN>...].");
  if (args.check && args.affected.length) throw new Error("--check and --affected are separate read-only modes; use one.");
  return args;
}

function main() {
  const args = parseArgs(process.argv);
  if (args.affected.length) console.log(JSON.stringify(affectedDecisions(args.root, args.affected), null, 2));
  else if (args.check) console.log(JSON.stringify({ verified: true, ...checkDecisionOverview(args.root) }, null, 2));
  else console.log(JSON.stringify({ written: true, ...writeDecisionOverview(args.root) }, null, 2));
}

if (isEntryPoint(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
