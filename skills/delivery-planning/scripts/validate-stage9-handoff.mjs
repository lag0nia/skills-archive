#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

function parseArgs(argv) {
  const args = { root: null, handoff: null, softwareDesignSkill: null };
  for (let index = 2; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--root") args.root = argv[++index];
    else if (value === "--handoff") args.handoff = argv[++index];
    else if (value === "--software-design-skill") args.softwareDesignSkill = argv[++index];
    else throw new Error("Unknown argument: " + value);
  }
  if (!args.root) throw new Error("Use --root <software-design-dir>.");
  if (!args.handoff) throw new Error("Use --handoff <build/workflow/handoffs/delivery-slice.md>.");
  if (!args.softwareDesignSkill) throw new Error("Use --software-design-skill <active-software-design-skill-dir>.");
  return args;
}

function selectedStage9Handoff(root, requestedHandoff) {
  const handoffsRoot = path.join(root, "build", "workflow", "handoffs");
  const handoffPath = path.resolve(root, requestedHandoff);
  const relative = path.relative(handoffsRoot, handoffPath);
  if (!relative || relative.includes(path.sep) || relative.startsWith(".." + path.sep) || path.isAbsolute(relative) || path.extname(handoffPath).toLowerCase() !== ".md") {
    throw new Error("The selected Stage 9 handoff must be a Markdown file under build/workflow/handoffs/.");
  }
  if (!fs.existsSync(handoffPath) || !fs.statSync(handoffPath).isFile()) {
    throw new Error("The selected Stage 9 handoff does not exist: " + handoffPath);
  }
  return handoffPath;
}

function selectedBuildUnits(handoffPath) {
  const handoff = fs.readFileSync(handoffPath, "utf8");
  const selected = /^\*\*Selected build units:\*\*\s*(.+)$/m.exec(handoff)?.[1] || "";
  return [...selected.matchAll(/BUILD_UNIT:(BU-\d{3,})/g)].map((match) => match[1]);
}

function validate(args) {
  const root = path.resolve(args.root);
  const buildUnitsRoot = path.join(root, "build", "units");
  if (!fs.existsSync(buildUnitsRoot)) {
    throw new Error("Delivery Planning requires an activated current Stage 8 Build Design under build/units/.");
  }
  const handoffPath = selectedStage9Handoff(root, args.handoff);

  const softwareDesignRoot = path.resolve(args.softwareDesignSkill);
  const selected = selectedBuildUnits(handoffPath);
  if (!selected.length) throw new Error("The Stage 9 handoff must declare at least one selected Build Unit before readiness reconciliation.");
  const checks = [
    ["report-build-unit-readiness-reconciliation.mjs", ["--root", root, "--units", selected.join(","), "--assert-ready"]],
    ["validate-handoff-sequence.mjs", ["--root", root, "--handoff", handoffPath, "--assert-plannable"]],
    ["validate-delivery-readiness.mjs", ["--root", root, "--handoff", handoffPath]],
  ];
  // These checks share readable inputs, not successful outcomes. A failed check
  // forbids planning but must not conceal other independent diagnostic failures.
  for (const [script, checkArgs] of checks) {
    const command = path.join(softwareDesignRoot, "scripts", script);
    if (!fs.existsSync(command)) {
      console.error("The supplied software-design skill does not provide scripts/" + script + ".");
      process.exitCode = 1;
      continue;
    }
    const result = spawnSync(process.execPath, [command, ...checkArgs], { stdio: "inherit" });
    if (result.error) console.error(script + ": " + result.error.message);
    if (result.error || result.status !== 0) process.exitCode = 1;
  }
}

try {
  validate(parseArgs(process.argv));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
