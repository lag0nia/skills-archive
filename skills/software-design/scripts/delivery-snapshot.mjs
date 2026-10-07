#!/usr/bin/env node

import path from "node:path";
import {
  computeDeliverySnapshot,
  deliverySnapshotErrors,
  writeDeliverySnapshot,
} from "./lib/delivery-snapshot.mjs";

function parseArgs(argv) {
  const args = { root: null, handoff: null, write: false, check: false };
  for (let index = 2; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--root") args.root = argv[++index];
    else if (value === "--handoff") args.handoff = argv[++index];
    else if (value === "--write") args.write = true;
    else if (value === "--check") args.check = true;
    else throw new Error("Unknown argument: " + value);
  }
  if (!args.root || !args.handoff) {
    throw new Error("Use --root <software-design-dir> --handoff <handoff-path> [--write] [--check].");
  }
  return args;
}

try {
  const args = parseArgs(process.argv);
  const root = path.resolve(args.root);
  const handoffPath = path.isAbsolute(args.handoff) ? args.handoff : path.resolve(root, args.handoff);
  const snapshot = args.write
    ? writeDeliverySnapshot({ root, handoffPath })
    : computeDeliverySnapshot({ root, handoffPath });

  if (args.check) {
    const errors = deliverySnapshotErrors({ root, handoffPath });
    if (errors.length) throw new Error(errors.join("\n"));
  }

  if (args.write) console.log("Wrote Stage 9 handoff snapshot " + snapshot + ".");
  else if (args.check) console.log("Verified Stage 9 handoff snapshot " + snapshot + ".");
  else console.log(snapshot);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
