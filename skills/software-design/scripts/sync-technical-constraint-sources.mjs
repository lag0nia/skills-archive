#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { readSystemModel } from "./lib/model/system-model-records.mjs";
import { constraintsRoot, findTechnicalConstraintRecords } from "./lib/model/technical-constraint-records.mjs";

function parseArgs(argv) {
  const args = { root: null };
  for (let index = 2; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--root") args.root = argv[++index];
    else throw new Error("Unknown argument: " + value);
  }
  if (!args.root) throw new Error("Use --root <software-design-dir>.");
  return args;
}

function technicalSourceFiles(root) {
  const model = readSystemModel(root);
  return new Map([
    ...model.responsibilities,
    ...model.flows,
    ...Object.values(model.contracts).flat(),
  ].map((record) => [record.frontmatter.id, record.filePath]));
}

function sectionMatch(text, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp("^##\\s+" + escaped + "\\s*$([\\s\\S]*?)(?=^##\\s+|(?![\\s\\S]))", "m").exec(text);
}

function localLinkTargets(text, baseDir) {
  return [...String(text || "").matchAll(/\[[^\]]*\]\(([^)\s]+)(?:\s+[\"'][^\"']*[\"'])?\)/g)]
    .map((match) => match[1].replace(/^<|>$/g, ""))
    .filter((target) => !/^(?:[a-z]+:|\/|\/\/)/i.test(target))
    .map((target) => path.resolve(baseDir, target.split("#", 1)[0]));
}

function insertMissingLinks(content, missingLinks, constraintPath) {
  const match = sectionMatch(content, "Scope And Sources");
  if (!match) throw new Error(constraintPath + " is missing ## Scope And Sources.");

  const headingEnd = content.indexOf("\n", match.index);
  const bodyStart = headingEnd === -1 ? content.length : headingEnd + 1;
  const body = match[1];
  const bodyEnd = bodyStart + body.length;
  const bodyCore = body.replace(/\s+$/, "");
  const generated = [
    "### Canonical Software Design Sources",
    "",
    ...missingLinks.map(({ id, filePath }) => {
      const relative = path.relative(path.dirname(constraintPath), filePath).split(path.sep).join("/");
      return `- [${id}](${relative})`;
    }),
  ].join("\n");

  return content.slice(0, bodyStart)
    + bodyCore
    + (bodyCore ? "\n\n" : "")
    + generated
    + "\n\n"
    + content.slice(bodyEnd);
}

export function syncTechnicalConstraintSources(root) {
  const recordsRoot = constraintsRoot(root);
  if (!fs.existsSync(recordsRoot)) return { skipped: true, changed: [] };

  const technicalSources = technicalSourceFiles(root);
  const changed = [];
  for (const record of findTechnicalConstraintRecords(root)) {
    const sources = sectionMatch(record.content, "Scope And Sources");
    if (!sources) throw new Error(record.filePath + " is missing ## Scope And Sources.");
    const linkedTargets = new Set(localLinkTargets(sources[1], path.dirname(record.filePath)));
    const missingLinks = [];
    for (const id of record.technicalSources) {
      const filePath = technicalSources.get(id);
      if (filePath && !linkedTargets.has(path.resolve(filePath))) missingLinks.push({ id, filePath });
    }
    if (!missingLinks.length) continue;

    const nextContent = insertMissingLinks(record.content, missingLinks, record.filePath);
    fs.writeFileSync(record.filePath, nextContent);
    changed.push({ filePath: record.filePath, sourceIds: missingLinks.map(({ id }) => id) });
  }
  return { skipped: false, changed };
}

try {
  const args = parseArgs(process.argv);
  const result = syncTechnicalConstraintSources(path.resolve(args.root));
  if (result.skipped) console.log("No technical-constraint register is active.");
  else if (!result.changed.length) console.log("Technical Constraint source links are already synchronized.");
  else for (const change of result.changed) {
    console.log(`Synchronized ${path.relative(path.resolve(args.root), change.filePath)}: ${change.sourceIds.join(", ")}.`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
