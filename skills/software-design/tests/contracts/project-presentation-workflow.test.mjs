#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { PROJECT_VIEW_CONTRACT } from "../../scripts/lib/ticket-projection/core.mjs";

// These checks keep the documented procedure aligned with the code; they cannot prove browser execution.
const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (relativePath) => fs.readFileSync(path.join(skillRoot, relativePath), "utf8");
const reference = read("references/ticket-projection.md");
const skill = read("SKILL.md");

function section(text, start, end) {
  const from = text.indexOf(start);
  const to = text.indexOf(end, from + start.length);
  assert.ok(from >= 0 && to > from, `missing section ${start}`);
  return text.slice(from, to);
}

test("the presentation table renders PROJECT_VIEW_CONTRACT instead of maintaining a second contract", () => {
  const rows = section(reference, "| View | Layout | Filter | Slice | Grouping | Sorting | Visible fields |", "\n\n")
    .split("\n")
    .filter((line) => line.startsWith("| ") && !line.startsWith("| View |"));
  const table = rows.map((line) => {
    const [name, layout, filter, slice, , , visibleFields] = line.slice(2, -2).split(" | ");
    return {
      name,
      layout: `${layout.toUpperCase()}_LAYOUT`,
      filter: filter.replace(/^`|`$/g, ""),
      sliceBy: slice === "none" ? null : slice,
      visibleFields: visibleFields.split(", "),
    };
  });
  assert.deepEqual(table, PROJECT_VIEW_CONTRACT.map(({ name, layout, filter, sliceBy, visibleFields }) => ({ name, layout, filter, sliceBy, visibleFields: [...visibleFields] })));
});

test("view repair documents the API, browser, and saved-state verification flow", () => {
  const repair = section(reference, "### Setup And Explicit View Repair", "## Build Unit Labels And Repository Field");
  for (const pattern of [
    /\| Ticket synchronization \| `sync` \|/,
    /\| API presentation repair \| `sync --views-only` \|/,
    /\| Remaining UI configuration \| Signed-in GitHub interface \|/,
    /No supported operation updates an existing view's sorting, horizontal or vertical grouping, slicing, or tab position/,
    /creation-time support does not imply update support/,
    /Never delete\/recreate an existing view or create a replacement to obtain a setting the API cannot update/,
    /authorizes the presentation changes in this procedure, through the API or the saved GitHub interface, without repeated approval/,
    /never infer that an unknown view is a contract view/,
    /Use the explicit missing-view setup above when a view is genuinely absent/,
    /change only the settings listed in `remainingGitHubUi`/,
    /save-changes action, never save-as-new-view, so the setting becomes the shared view default/,
    /A correct-looking tab, URL query parameters, or an unsaved preview does not prove the saved view/,
    /After saving the affected views, run `project-view-audit` once/,
    /never repeat the whole setup after each setting/,
    /An unsupported API setting is a limitation, not a failure: it routes to browser repair/,
    /incomplete result that names every saved change, every remaining setting with its expected value, and the exact limitation/,
    /Never loop indefinitely, recreate views, weaken or edit the contract to match saved state, or return every setting to the user after one transient failure/,
    /Ordinary `sync` never repairs views, runs `project-view-audit`, or starts browser repair/,
  ]) assert.match(repair, pattern);
});

test("documented view-repair outcomes match the CLI exit statuses", () => {
  const commands = section(reference, "## Mechanical Commands", "## Local-Agent Comment Workflow");
  assert.match(commands, /ticket-projection\.mjs sync --views-only \[--rename-view <view-number>=<contract-view-name>\]\.\.\./);
  const documented = Object.fromEntries([...commands.matchAll(/^- `(\d)`, `([a-z-]+)`:/gm)].map(([, status, outcome]) => [outcome, Number(status)]));
  const cliSource = read("scripts/ticket-projection.mjs");
  const mapping = section(cliSource, "const VIEW_REPAIR_EXIT_CODES", "});");
  const implemented = Object.fromEntries([...mapping.matchAll(/"([a-z-]+)": (\d)/g)].map(([, outcome, status]) => [outcome, Number(status)]));
  assert.deepEqual(documented, implemented);
  assert.deepEqual([...new Set(Object.values(implemented))].sort(), [0, 1, 2]);
});

test("skill routing sends view configuration to the repair procedure, never to routine ticket sync", () => {
  assert.match(skill, /configure or repair GitHub Project views[^\n]*\[references\/ticket-projection\.md\]/);
  assert.match(skill, /`sync --views-only` for the settings GitHub's API can update, then saved changes in the signed-in GitHub interface for the rest, then a re-audit/);
  assert.match(skill, /A layout-only request uses `project-view-audit` for inspection or that view-repair procedure for configuration, without projecting every ticket; routine `sync` never starts view repair/);
});
