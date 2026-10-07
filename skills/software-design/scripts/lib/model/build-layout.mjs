import path from "node:path";
import { findFiles } from "./files.mjs";

/**
 * Resolve canonical Build Design paths.
 */
export function buildLayout(rootPath) {
  const root = path.resolve(rootPath);
  const buildRoot = path.join(root, "build");
  const recordsRoot = path.join(buildRoot, "records");
  const workflowRoot = path.join(buildRoot, "workflow");
  return {
    root,
    buildRoot,
    buildReadmePath: path.join(buildRoot, "README.md"),
    technicalDecisionsPath: path.join(workflowRoot, "technical-decisions.yaml"),
    ticketsRoot: path.join(workflowRoot, "tickets"),
    constraintsRoot: path.join(recordsRoot, "constraints"),
    unitsRoot: path.join(buildRoot, "units"),
    repositoriesRoot: path.join(buildRoot, "repositories"),
    selectionsRoot: path.join(recordsRoot, "selections"),
    verificationRoot: path.join(recordsRoot, "verification"),
    handoffsRoot: path.join(workflowRoot, "handoffs"),
  };
}

export function selectionFiles(layout) {
  return findFiles(layout.selectionsRoot, (name) => /^sel-[^/]+\.md$/i.test(name));
}

export function capabilityFiles(layout) {
  return findFiles(layout.verificationRoot, (name) => /^va-\d{3,}-.+\.md$/i.test(name));
}
