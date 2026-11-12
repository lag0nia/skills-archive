import fs from "node:fs";
import path from "node:path";
import { validationMode } from "./validation-mode.mjs";
import { validatePlannableHandoff } from "./handoff-sequence.mjs";
import { validateBuildAndDeliveryReadiness } from "./build-design-and-delivery-readiness.mjs";
import { buildReadinessReconciliationReport, readinessReconciliationBlocker } from "../../report-build-unit-readiness-reconciliation.mjs";

// The three checks read the same package but do not depend on each other's success,
// so one failure must not hide the others: each runs and reports independently.
export const DEFAULT_SELECTED_HANDOFF_CHECKS = Object.freeze({
  reconciliation({ root, selectedUnits }) {
    const blocker = readinessReconciliationBlocker(buildReadinessReconciliationReport(root, selectedUnits));
    return { errors: blocker ? [blocker] : [], warnings: [] };
  },
  sequence({ root, handoffPath, validationMode: mode }) {
    return { errors: validatePlannableHandoff(root, handoffPath, { validationMode: mode }).errors, warnings: [] };
  },
  readiness({ root, handoffPath, validationMode: mode }) {
    const result = validateBuildAndDeliveryReadiness(root, { scope: "delivery", handoffPath, validationMode: mode });
    return { errors: result.errors, warnings: result.warnings || [] };
  },
});

const CHECK_LABELS = {
  reconciliation: "Build Unit readiness reconciliation",
  sequence: "Selected handoff sequence check",
  readiness: "Delivery Readiness validation",
};

export function selectedStage9Handoff(root, requestedHandoff) {
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

export function selectedBuildUnits(handoffPath) {
  const handoff = fs.readFileSync(handoffPath, "utf8");
  const selected = /^\*\*Selected build units:\*\*\s*(.+)$/m.exec(handoff)?.[1] || "";
  return [...selected.matchAll(/BUILD_UNIT:(BU-\d{3,})/g)].map((match) => match[1]);
}

// Validates one explicitly selected Stage 9 handoff before a workpack consumes it.
// Other current handoffs may coexist; none is selected implicitly.
export function validateSelectedHandoff(rootPath, requestedHandoff, { validationMode: requestedMode = "execution", checks = DEFAULT_SELECTED_HANDOFF_CHECKS } = {}) {
  const mode = validationMode(requestedMode);
  const root = path.resolve(rootPath);
  if (!fs.existsSync(path.join(root, "build", "units"))) {
    throw new Error("Workpack planning requires an activated current Stage 8 Build Design under build/units/.");
  }
  const handoffPath = selectedStage9Handoff(root, requestedHandoff);
  const selectedUnits = selectedBuildUnits(handoffPath);
  if (!selectedUnits.length) throw new Error("The Stage 9 handoff must declare at least one selected Build Unit before readiness reconciliation.");

  const errors = [];
  const warnings = [];
  for (const name of ["reconciliation", "sequence", "readiness"]) {
    try {
      const result = checks[name]({ root, handoffPath, selectedUnits, validationMode: mode });
      errors.push(...result.errors.map((error) => CHECK_LABELS[name] + ": " + error));
      warnings.push(...(result.warnings || []));
    } catch (error) {
      errors.push(CHECK_LABELS[name] + ": " + (error instanceof Error ? error.message : String(error)));
    }
  }
  return { root, handoffPath, selectedUnits, validationMode: mode, errors, warnings };
}
