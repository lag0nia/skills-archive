#!/usr/bin/env node

import { validateUiUxDesign } from "./lib/validation/ui-ux-design.mjs";

function parseArgs(argv) {
  const args = { root: "software-design" };
  for (let index = 2; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--root") args.root = argv[++index];
    else throw new Error("Unknown argument: " + value);
  }
  return args;
}

try {
  const result = validateUiUxDesign(parseArgs(process.argv).root);
  if (result.errors.length) throw new Error(result.errors.join("\n"));
  console.log(result.applicable
    ? "Verified UI/UX Design artifact structure, local prototype linkage, and runtime dependency boundaries; selection, visual quality, and usability still require review."
    : "UI/UX Design not present; no HTML prototype is structurally required.");
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
