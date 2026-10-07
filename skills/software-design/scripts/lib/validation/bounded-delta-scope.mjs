import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

// This validates a reviewed dependency assessment, not the semantics of arbitrary
// source code. Pinned sources make stale or unsupported assessments fail closed.
export function validateBoundedDeltaScope({ handoff, handoffDir, expected, excluded, bound, interfaces, field, sectionBody, existingLocalLinks, errors }) {
  const fail = (message) => errors.push("Bounded delta scope: " + message);
  const slice = sectionBody(handoff, "Allowed Delivery Slice") || "";
  const exclusions = sectionBody(handoff, "Exclusions And Local Discretion") || "";
  const links = existingLocalLinks(field(exclusions, "Bounded delta scope") || "", handoffDir);
  if (links.length !== 1 || links[0].local.fragment || !links[0].local.resolved.endsWith(".json")) {
    fail("writable-bound exclusions require one **Bounded delta scope:** JSON assessment link; ownership alone does not prohibit exclusion.");
    return;
  }
  const file = links[0].local.resolved;
  let assessment, bytes;
  try { bytes = fs.readFileSync(file); assessment = JSON.parse(bytes.toString("utf8")); }
  catch { fail("assessment must be readable JSON."); return; }
  const integrity = (field(exclusions, "Bounded delta scope integrity") || "").replaceAll("`", "");
  if (integrity !== "sha256:" + createHash("sha256").update(bytes).digest("hex")) fail("assessment integrity is missing or stale; refresh the reviewed assessment and handoff snapshot.");
  if (assessment?.version !== 1 || !Array.isArray(assessment.actions) || !Array.isArray(assessment.checks)) {
    fail("assessment requires version 1, actions and checks arrays."); return;
  }
  const canonical = new Map(interfaces.map((record) => [record.frontmatter.id, record.filePath]));
  const evidence = (items, label) => {
    const paths = new Set();
    if (!Array.isArray(items) || !items.length) { fail(label + " requires pinned source evidence."); return paths; }
    for (const item of items) {
      if (!item || typeof item.path !== "string" || path.isAbsolute(item.path) || !/^sha256:[a-f0-9]{64}$/.test(item.sha256 || "")) {
        fail(label + " requires relative path and sha256 evidence records."); continue;
      }
      const resolved = path.resolve(path.dirname(file), item.path);
      try {
        if (resolved === file || !fs.statSync(resolved).isFile()
          || "sha256:" + createHash("sha256").update(fs.readFileSync(resolved)).digest("hex") !== item.sha256) {
          fail(label + " has stale or invalid evidence: " + item.path); continue;
        }
        paths.add(resolved);
      } catch { fail(label + " has missing evidence: " + item.path); }
    }
    return paths;
  };
  evidence(assessment.scopeEvidence, "approved delta boundary");
  const declared = (name, allowNone) => {
    const value = field(slice, name) || "";
    if (slice.split("**" + name + ":**").length !== 2) fail(name + " must occur exactly once in Allowed Delivery Slice.");
    if (allowNone && /^`?None\.`?$/.test(value)) return [];
    if (!/^`IFACE-\d{3}\.ACT-\d{3}`(?:,\s*`IFACE-\d{3}\.ACT-\d{3}`)*$/.test(value)) fail(name + " must be an explicit backticked action list, not scope prose.");
    const ids = [...value.matchAll(/\bIFACE-\d{3}\.ACT-\d{3}\b/g)].map((m) => m[0]);
    if (!ids.length || ids.some((id) => !expected.has(id)) || new Set(ids).size !== ids.length) fail(name + " must explicitly list unique canonical actions in Allowed Delivery Slice.");
    return ids;
  };
  const targets = declared("Target actions", false);
  const changed = declared("Changed actions", true);
  const nodes = new Map();
  for (const node of assessment.actions) {
    if (!node || !expected.has(node.action) || nodes.has(node.action) || !Array.isArray(node.requires)
      || new Set(node.requires).size !== node.requires.length || node.requires.some((id) => !expected.has(id))) {
      fail("actions must identify unique canonical interactions with canonical requires edges."); continue;
    }
    nodes.set(node.action, node);
    const sources = evidence(node.evidence, node.action + " dependency assessment");
    if (!sources.has(canonical.get(node.action.split(".")[0]))) fail(node.action + " must pin its canonical interface source.");
    if (excluded.has(node.action) && bound.has(node.action)) {
      const unchanged = evidence(node.unchangedEvidence, node.action + " unchanged behavior");
      if (![...unchanged].some((source) => source !== canonical.get(node.action.split(".")[0]))) fail(node.action + " needs implementation/verification evidence beyond the interface declaration.");
    }
  }
  const roots = new Set([...targets, ...changed, ...[...expected].filter((id) => !excluded.has(id)), ...[...excluded].filter((id) => bound.has(id))]);
  for (const id of new Set([...roots, ...[...nodes.values()].flatMap((node) => node.requires)])) {
    if (!nodes.has(id)) fail("assessment omits canonical interaction " + id + ".");
  }
  // Traverse every retained interaction, not just new outputs: existing and gated
  // consumers also retain their direct and transitive prerequisites.
  const visited = new Set();
  const visit = (id) => {
    if (visited.has(id)) return;
    visited.add(id);
    if (excluded.has(id)) fail(id + " cannot be excluded: target, changed action or direct/transitive prerequisite.");
    for (const dependency of nodes.get(id)?.requires || []) visit(dependency);
  };
  for (const id of new Set([...targets, ...changed, ...[...expected].filter((id) => !excluded.has(id))])) visit(id);

  const physical = sectionBody(handoff, "Physical Realizability Closure") || "";
  const entries = new Map([...physical.matchAll(/^###\s+`?(PSEAM-\d{3})`?[^\n]*\n([\s\S]*?)(?=^###\s|(?![\s\S]))/gm)].map((m) => [m[1], m[2]]));
  const coverage = new Set();
  for (const check of assessment.checks) {
    if (!check || !["public-contract compatibility", "shared-code regression"].includes(check.kind)
      || !Array.isArray(check.actions) || !check.actions.length || new Set(check.actions).size !== check.actions.length
      || check.actions.some((id) => !expected.has(id)) || !entries.has(check.obligation)
      || /`EXCLUDED`/.test(field(entries.get(check.obligation) || "", "Current result") || "")) {
      fail("checks require a compatibility/regression kind, canonical actions and a retained PSEAM obligation."); continue;
    }
    const sources = evidence(check.evidence, check.kind + " " + check.obligation);
    const retained = new Set(existingLocalLinks(entries.get(check.obligation), handoffDir).map(({ local }) => local.resolved));
    if (!sources.size || [...sources].some((source) => !retained.has(source))) fail(check.obligation + " must retain the check's pinned compatibility/regression evidence links.");
    for (const id of check.actions) coverage.add(id + ":" + check.kind);
  }
  for (const id of excluded) if (bound.has(id)) {
    for (const kind of ["public-contract compatibility", "shared-code regression"]) {
      if (!coverage.has(id + ":" + kind)) fail(id + " exclusion omits retained " + kind + " obligation.");
    }
  }
}
