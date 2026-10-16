import fs from "node:fs";
import path from "node:path";

/**
 * Resolve the canonical logical-system layout.
 */
export function systemModelLayout(rootPath) {
  const root = path.resolve(rootPath);
  const systemModelRoot = path.join(root, "system-model");
  const domainsRoot = path.join(systemModelRoot, "domains");
  const behaviorRoot = path.join(systemModelRoot, "behavior");
  const contractsRoot = path.join(systemModelRoot, "contracts");
  return {
    root,
    systemModelRoot,
    architecturePath: path.join(systemModelRoot, "architecture.md"),
    domainsRoot,
    behaviorRoot,
    lifecyclePath: path.join(behaviorRoot, "lifecycle.yaml"),
    flowsRoot: path.join(behaviorRoot, "flows"),
    contractsRoot,
  };
}

function unexpectedChildren(root, relativePath, allowed) {
  const directory = path.join(root, relativePath);
  if (!fs.existsSync(directory) || !fs.statSync(directory).isDirectory()) return [];
  return fs.readdirSync(directory)
    .filter((name) => !name.startsWith(".") && !allowed.has(name))
    .map((name) => path.join(relativePath, name).split(path.sep).join("/"));
}

// Entries left by retired formats get a specific explanation instead of the generic layout error.
export const RETIRED_LAYOUT_ENTRIES = new Map([
  ["diagrams", "diagrams/ is the retired Canvas lane; current views are generated HTML under visuals/. Move any still-useful content to its canonical owner and remove the directory."],
  ["build/workflow/technical-decisions.yaml", "build/workflow/technical-decisions.yaml is a retired Technical Decision registry; its information belongs to domains, responsibilities, contracts, tickets and scope records. Move it to those owners and remove the file."],
]);

export function noncanonicalLayoutEntries(rootPath) {
  const root = path.resolve(rootPath);
  return [
    ...unexpectedChildren(root, ".", new Set(["README.md", "guide", "system-model", "build", "ui-ux", "visuals"])),
    ...unexpectedChildren(root, "system-model", new Set(["architecture.md", "domains", "behavior", "contracts"])),
    ...unexpectedChildren(root, "system-model/behavior", new Set(["lifecycle.yaml", "flows"])),
    ...unexpectedChildren(root, "system-model/contracts", new Set(["interfaces", "states", "invariants", "security", "scope"])),
    ...unexpectedChildren(root, "build", new Set(["README.md", "units", "repositories", "records", "workflow"])),
    ...unexpectedChildren(root, "build/records", new Set(["constraints", "selections", "verification"])),
    ...unexpectedChildren(root, "build/workflow", new Set(["tickets", "handoffs", "decision-overview.md"])),
  ];
}
