#!/usr/bin/env node

import { isEntryPoint } from "./lib/entry-point.mjs";
import { assertOwnSkillDirectory } from "./lib/own-skill-directory.mjs";
import { validationMode } from "./lib/validation/validation-mode.mjs";
import { validateSelectedHandoff } from "./lib/validation/selected-handoff.mjs";

function parseArgs(argv) {
  const args = { root: null, handoff: null, validationMode: "execution" };
  let modeSeen = false;
  for (let index = 2; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--root") args.root = argv[++index];
    else if (value === "--handoff") args.handoff = argv[++index];
    else if (value === "--software-design-skill") assertOwnSkillDirectory(argv[++index]);
    else if (value === "--validation-mode") { if (modeSeen) throw new Error("Duplicate --validation-mode."); modeSeen = true; args.validationMode = validationMode(argv[++index] || ""); }
    else throw new Error("Unknown argument: " + value);
  }
  if (!args.root) throw new Error("Use --root <software-design-package>.");
  if (!args.handoff) throw new Error("Use --handoff <build/workflow/handoffs/delivery-slice.md>.");
  return args;
}

function main() {
  const args = parseArgs(process.argv);
  const result = validateSelectedHandoff(args.root, args.handoff, { validationMode: args.validationMode });
  for (const warning of result.warnings) console.error("NON_BLOCKING_PACKAGE_MAINTENANCE: " + warning);
  if (result.errors.length) {
    console.error("Selected Stage 9 handoff is not ready for a workpack:");
    for (const error of result.errors) console.error("- " + error);
    process.exitCode = 1;
    return;
  }
  console.log("Selected Stage 9 handoff passed readiness reconciliation, the selected sequence check, and Delivery Readiness validation.");
  console.log("VALIDATION_MODE: " + result.validationMode + "; STRUCTURAL_CHECKS_ONLY; planning does not authorize implementation.");
}

if (isEntryPoint(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
