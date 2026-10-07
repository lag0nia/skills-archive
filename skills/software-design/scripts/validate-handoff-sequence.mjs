#!/usr/bin/env node

import path from "node:path";
import { validateHandoffSequence, validatePlannableHandoff } from "./lib/validation/handoff-sequence.mjs";

function argumentsFrom(argv) {
  const args = { root: null, handoff: null, assertPlannable: false };
  for (let index = 2; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--root") args.root = argv[++index];
    else if (value === "--handoff") args.handoff = argv[++index];
    else if (value === "--assert-plannable") args.assertPlannable = true;
    else throw new Error("Unknown argument: " + value);
  }
  if (!args.root) throw new Error("Use --root <software-design-dir>.");
  if (args.assertPlannable && !args.handoff) throw new Error("--assert-plannable requires --handoff <Stage-9-handoff>.");
  if (args.handoff && !args.assertPlannable) throw new Error("--handoff is valid only with --assert-plannable.");
  return {
    root: path.resolve(args.root),
    handoff: args.handoff ? path.resolve(args.root, args.handoff) : null,
    assertPlannable: args.assertPlannable,
  };
}

try {
  const args = argumentsFrom(process.argv);
  const result = args.assertPlannable
    ? validatePlannableHandoff(args.root, args.handoff)
    : validateHandoffSequence(args.root);
  if (result.errors.length) {
    console.error("Handoff Sequence validation failed:");
    for (const error of result.errors) console.error("- " + error);
    process.exitCode = 1;
  } else {
    console.log(args.assertPlannable
      ? "Verified that the selected Stage 9 handoff is a current executable slice or a retained implemented slice eligible for bounded lineage planning."
      : "Verified the strict single-table Stage 9 execution order, blocker-aware scheduling, current group, states, direct requirements, and handoff receipt index.");
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
