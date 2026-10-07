#!/usr/bin/env node

import fs from "node:fs";
import { createGitHubAdapter } from "./lib/ticket-projection/github/adapter.mjs";
import { dispatchProjection, loadConfig, parseViewRenameArguments } from "./lib/ticket-projection/core.mjs";
import { acquireSyncLock } from "./lib/ticket-projection/sync-lock.mjs";

// sync --views-only: 0 = no audited drift (UI-only checks remain), 1 = API failure, 2 = GitHub interface work remains.
const VIEW_REPAIR_EXIT_CODES = Object.freeze({
  "audit-passed-ui-checks-required": 0,
  "api-failure": 1,
  "project-setup-required": 2,
  "github-ui-configuration-required": 2,
});

function readOption(argumentsList, name) {
  const index = argumentsList.indexOf(name);
  if (index === -1 || !argumentsList[index + 1]) throw new Error(`${name} is required.`);
  const value = argumentsList[index + 1];
  argumentsList.splice(index, 2);
  return value;
}

function takeFlag(argumentsList, name) {
  const index = argumentsList.indexOf(name);
  if (index === -1) return false;
  argumentsList.splice(index, 1);
  return true;
}

function takeRepeatedOption(argumentsList, name) {
  const values = [];
  for (let index = argumentsList.indexOf(name); index !== -1; index = argumentsList.indexOf(name)) {
    const value = argumentsList[index + 1];
    if (value === undefined || value.startsWith("--")) throw new Error(name === "--rename-view" ? `${name} needs <view-number>=<contract view name>.` : name === "--view" ? "--view needs a selected enabled default view name." : `${name} needs <existing-option-id>=<new-name>.`);
    values.push(value);
    argumentsList.splice(index, 2);
  }
  return values;
}

function parseArguments(argv) {
  const values = [...argv];
  const operation = values.shift();
  if (!operation) throw new Error("Choose auth, project-view-audit, sync, sync --views-only, sync --fields-only, sync --create-views --view <name>, reconcile, pending-comments, publish-draft, or post-summaries.");
  if (operation === "sync") {
    const createViews = takeFlag(values, "--create-views");
    const selectedViews = takeRepeatedOption(values, "--view");
    if (createViews && !selectedViews.length) throw new Error("--create-views requires at least one --view <default-view-name>.");
    if (selectedViews.length && !createViews) throw new Error("--view requires --create-views.");
    const fieldsOnly = takeFlag(values, "--fields-only");
    const answeringOptionNames = Object.create(null);
    for (const mapping of takeRepeatedOption(values, "--answering-option")) {
      const split = mapping.indexOf("=");
      if (split < 1 || split === mapping.length - 1 || Object.hasOwn(answeringOptionNames, mapping.slice(0, split))) throw new Error("--answering-option needs a unique existing option ID=new name.");
      answeringOptionNames[mapping.slice(0, split)] = mapping.slice(split + 1);
    }
    const viewsOnly = takeFlag(values, "--views-only");
    const renames = parseViewRenameArguments(takeRepeatedOption(values, "--rename-view"));
    if (values.length) throw new Error(`Unexpected argument: ${values[0]}`);
    if ([fieldsOnly, viewsOnly, createViews].filter(Boolean).length > 1) throw new Error("--fields-only, --views-only and --create-views are separate operations.");
    if (Object.keys(answeringOptionNames).length && !fieldsOnly) throw new Error("--answering-option requires --fields-only.");
    if (renames.length && !viewsOnly) throw new Error("--rename-view requires --views-only.");
    return { operation, options: createViews ? { createViews, selectedViews } : fieldsOnly ? { fieldsOnly, answeringOptionNames } : viewsOnly ? { viewsOnly, renames } : {} };
  }
  if (operation === "auth" || operation === "project-view-audit" || operation === "reconcile" || operation === "pending-comments") {
    if (values.length) throw new Error(`Unexpected argument: ${values[0]}`);
    return { operation, options: {} };
  }
  if (operation === "publish-draft") {
    const files = readOption(values, "--files").split(",").filter(Boolean);
    const title = readOption(values, "--title");
    const bodyFile = readOption(values, "--body-file");
    if (values.length) throw new Error(`Unexpected argument: ${values[0]}`);
    return { operation, options: { files, title, bodyFile } };
  }
  if (operation === "post-summaries") {
    const input = readOption(values, "--input");
    if (values.length) throw new Error(`Unexpected argument: ${values[0]}`);
    let results;
    try {
      results = JSON.parse(fs.readFileSync(input, "utf8"));
    } catch (error) {
      throw new Error(`Cannot read summary input ${input}: ${error.message}`);
    }
    return { operation, options: { results } };
  }
  throw new Error(`Unsupported projection operation: ${operation}.`);
}

async function main() {
  const { operation, options } = parseArguments(process.argv.slice(2));
  const config = loadConfig(process.cwd());
  const adapter = createGitHubAdapter({
    onProgress(event) {
      const elapsed = `${(event.elapsedMs / 1000).toFixed(1)}s`;
      if (event.type === "sync-start") {
        console.error(`[ticket-projection] Syncing ${event.tickets} tickets and ${event.decisions} Technical Decisions with concurrency ${event.concurrency}.`);
      } else if (event.type === "sync-plan") {
        console.error(`[ticket-projection] ${event.phase}: ${event.changed}/${event.total} identities need ${event.mutations} mutations (${elapsed}).`);
      } else if (event.type === "sync-progress") {
        console.error(`[ticket-projection] ${event.phase}: ${event.completed}/${event.total} completed; latest ${event.id} (${elapsed}).`);
      } else if (event.type === "sync-complete") {
        console.error(`[ticket-projection] Data sync complete (presentation not attempted): ${event.tickets} tickets, ${event.decisions} Technical Decisions, ${event.mutations} planned mutations (${elapsed}).`);
      }
    },
  });
  const authentication = await adapter.ensureAuthenticated({ interactive: true });
  if (operation === "auth") {
    console.log(JSON.stringify(authentication, null, 2));
    return;
  }
  const releaseLock = operation === "sync"
    ? acquireSyncLock(process.cwd())
    : null;
  try {
    const result = await dispatchProjection({
      operation,
      options: { ...options, publishingLock: releaseLock },
      config,
      adapter,
    });
    console.log(JSON.stringify(result, null, 2));
    if (operation === "project-view-audit" && result.drifts.length) process.exitCode = 1;
    if (options.createViews) process.exitCode = result.outcome === "api-failure" ? 1 : 2;
    if (options.viewsOnly) process.exitCode = VIEW_REPAIR_EXIT_CODES[result.outcome] ?? 1;
  } finally {
    releaseLock?.();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
