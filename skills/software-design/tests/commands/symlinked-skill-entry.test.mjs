#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createWorkspace, writeText } from "../support/workspace.mjs";

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

// Agents resolve commands from the directory that contains the active SKILL.md, which may be
// a symlink to this skill, such as ~/.claude/skills/software-design.
function symlinkedSkill(context) {
  const workspace = createWorkspace("software-design-symlink-");
  const linkedRoot = path.join(workspace, "software-design");
  fs.symlinkSync(skillRoot, linkedRoot, "dir");
  context.after(() => {
    fs.unlinkSync(linkedRoot);
    fs.rmSync(workspace, { recursive: true, force: true });
  });
  return { workspace, linkedRoot };
}

function run(scriptPath, args, cwd) {
  const { status, stdout, stderr } = spawnSync(process.execPath, [scriptPath, ...args], { cwd, encoding: "utf8" });
  return { status, stdout, stderr };
}

function writeTicketPackage(root, status) {
  writeText(path.join(root, "system-model", "domains", "example", "domain.md"), `---
type: system-domain
id: DOMAIN-example
name: Example Domain
responsibilities: "SR-001"
---

# Example Domain
`);
  writeText(path.join(root, "system-model", "domains", "example", "responsibilities", "sr-001-example.md"), `---
type: system-responsibility
id: SR-001
name: Example Responsibility
domain: example
---

# SR-001 — Example Responsibility
`);
  writeText(path.join(root, "build", "workflow", "tickets", "example", "sr-001", "sr-001-tickets.yaml"), `ticket_file_version: 3
scope: "responsibility:SR-001"

tickets:
  - id: "TICKET-0001"
    title: "Choose the public API"
    status: "${status}"
    kind: "technical"
    complexity: "medium"
    concern: "interface-api"
    owner: "SR-001"
    affects: ["SR-001"]
    cluster: "public-api"
    parent_decision: null
    question: "Which public API will the implementation expose?"
    context: "The logical responsibility is fixed and the public code interface has been selected."
    options: []
    recommendation: "Use the selected typed interface."
    resolution: "Use the selected typed interface."
    current_shape: null
    result_refs: []
    depends_on: []
    write_targets: ["system-model/domains/example/responsibilities/sr-001-example.md"]
`);
}

test("a validator run through a symlinked skill directory reports its result and exit code", (context) => {
  const { workspace, linkedRoot } = symlinkedSkill(context);
  const validator = path.join(linkedRoot, "scripts", "validate-implementation-detail-tickets.mjs");
  const root = path.join(workspace, "package");

  writeTicketPackage(root, "finished");
  const valid = run(validator, ["--root", root], workspace);
  assert.equal(valid.status, 0, valid.stderr);
  assert.match(valid.stdout, /valid for 1 implementation-detail tickets across 1 file\(s\)/);

  writeTicketPackage(root, "not-a-status");
  const invalid = run(validator, ["--root", root], workspace);
  assert.equal(invalid.status, 1);
  assert.match(invalid.stderr, /TICKET-0001: invalid active status/);
});

test("every command behaves the same through a symlinked skill directory as through its real path", (context) => {
  const { workspace, linkedRoot } = symlinkedSkill(context);
  const commands = fs.readdirSync(path.join(skillRoot, "scripts")).filter((name) => name.endsWith(".mjs")).sort();
  assert.ok(commands.length > 0);

  for (const command of commands) {
    const args = ["--unknown-symlink-regression-argument"];
    const viaSymlink = run(path.join(linkedRoot, "scripts", command), args, workspace);
    const viaRealPath = run(path.join(skillRoot, "scripts", command), args, workspace);
    assert.notEqual(viaSymlink.status, 0, command + " exited 0 through the symlinked skill directory.");
    assert.notEqual(viaSymlink.stderr, "", command + " printed nothing through the symlinked skill directory.");
    assert.deepEqual(viaSymlink, viaRealPath, command);
  }
});
