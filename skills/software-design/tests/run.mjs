#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const testsRoot = path.dirname(fileURLToPath(import.meta.url));

function testFiles(root) {
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) return testFiles(target);
    return entry.isFile() && entry.name.endsWith(".test.mjs") ? [target] : [];
  }).sort();
}

const result = spawnSync(process.execPath, ["--test", ...testFiles(testsRoot)], { stdio: "inherit" });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
