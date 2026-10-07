#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const skill = fs.readFileSync(path.join(skillRoot, "SKILL.md"), "utf8");
const reference = fs.readFileSync(path.join(skillRoot, "references", "implementation-detail-tickets.md"), "utf8");
const portableCommand = /node <software-design-skill-directory>\/scripts\/validate-implementation-detail-tickets\.mjs --root <software-design-package>/;
const resolutionRule = /directory containing the active `SKILL\.md`/;

test("ticket validation guidance resolves the validator from the active skill directory", () => {
  assert.doesNotMatch(skill, /node scripts\/validate-implementation-detail-tickets\.mjs/);
  assert.match(skill, portableCommand);
  assert.match(reference, portableCommand);
  assert.match(skill, resolutionRule);
  assert.match(reference, resolutionRule);
});

test("all local instruction and reference links resolve", () => {
  const markdownFiles = [
    path.join(skillRoot, "SKILL.md"),
    ...fs.readdirSync(path.join(skillRoot, "references"))
      .filter((name) => name.endsWith(".md"))
      .map((name) => path.join(skillRoot, "references", name)),
  ];
  const brokenLinks = [];

  for (const filePath of markdownFiles) {
    const content = fs.readFileSync(filePath, "utf8").replace(/^```[^\n]*\n[\s\S]*?^```\s*$/gm, "");
    for (const match of content.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      const targetWithAnchor = match[1].trim();
      const target = targetWithAnchor.split("#", 1)[0];
      if (!target || /^(?:https?:|mailto:)/i.test(target) || target.includes("<")) continue;
      if (!fs.existsSync(path.resolve(path.dirname(filePath), target))) {
        brokenLinks.push(`${path.relative(skillRoot, filePath)} -> ${targetWithAnchor}`);
      }
    }
  }

  assert.deepEqual(brokenLinks, []);
});
