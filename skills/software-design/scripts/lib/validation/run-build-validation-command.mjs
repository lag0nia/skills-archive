import path from "node:path";
import { validateBuildAndDeliveryReadiness } from "./build-design-and-delivery-readiness.mjs";

function parseArgs(argv) {
  const args = { root: null, handoff: null };
  for (let index = 2; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--root") args.root = argv[++index];
    else if (value === "--handoff") args.handoff = argv[++index];
    else throw new Error("Unknown argument: " + value);
  }
  if (!args.root) throw new Error("Use --root <software-design-dir>.");
  args.root = path.resolve(args.root);
  if (args.handoff) args.handoff = path.resolve(args.root, args.handoff);
  return args;
}

export function runBuildValidationCommand({ argv, scope }) {
  try {
    const args = parseArgs(argv);
    const result = validateBuildAndDeliveryReadiness(args.root, { scope, handoffPath: args.handoff });
    for (const warning of result.warnings || []) {
      console.warn("NON_BLOCKING_PACKAGE_MAINTENANCE: " + warning);
    }
    if (result.errors.length) {
      console.error(scope === "delivery" ? "Delivery Readiness validation failed:" : "Build Design validation failed:");
      for (const error of result.errors) console.error("- " + error);
      process.exitCode = 1;
    } else if (result.skipped) {
      console.log("No Build Design layer; nothing to validate.");
    } else if (scope === "build" || result.mappingOnly) {
      console.log("Verified Build Design, ticket applicability, construction-guide coverage, and reusable-result synchronization.");
    } else {
      console.log("Structurally valid Build Design and Delivery Readiness handoff: selected-unit routing, required-input ledger, declared cycle checks, receipt shape, and local evidence links passed.");
      if (result.physicalRealizabilityPresent) {
        console.log("PHYSICAL_REALIZABILITY_RECEIPT: PRESENT_AND_STRUCTURALLY_VALID");
      }
      console.log("EXTERNAL_OBSERVATIONS: NOT_RERUN_BY_VALIDATOR");
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
