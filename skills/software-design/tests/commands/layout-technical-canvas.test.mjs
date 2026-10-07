#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const scriptsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "scripts");
const layoutScript = path.join(scriptsRoot, "layout-technical-canvas.mjs");

function card(id, x, y) {
  return { id, type: "text", x, y, width: 300, height: 160, text: `## ${id}\n\nCompleted action.` };
}

function run(tempDir, name, canvas) {
  const canvasPath = path.join(tempDir, `${name}.canvas`);
  fs.writeFileSync(canvasPath, `${JSON.stringify(canvas, null, 2)}\n`);
  const result = spawnSync(process.execPath, [layoutScript, "--canvas", canvasPath, "--check", "--report"], { encoding: "utf8" });
  return { status: result.status, output: `${result.stdout || ""}\n${result.stderr || ""}` };
}

test("canvas layout validation catches group, padding, and label collisions", (context) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "technical-canvas-layout-test-"));
  context.after(() => fs.rmSync(tempDir, { recursive: true, force: true }));
  const clean = {
    nodes: [
      { id: "group-a", type: "group", x: 0, y: 0, width: 600, height: 400, label: "FLOW A" },
      card("a", 100, 100),
      card("b", 1000, 100),
    ],
    edges: [{ id: "a-b", fromNode: "a", toNode: "b", fromEnd: "none", toEnd: "arrow", label: "With result" }],
  };
  assert.equal(run(tempDir, "clean", clean).status, 0, "clean grouped Canvas should pass");

  const overlappingGroups = structuredClone(clean);
  overlappingGroups.nodes.push({ id: "group-b", type: "group", x: 500, y: 200, width: 400, height: 300, label: "FLOW B" });
  const overlapResult = run(tempDir, "overlapping-groups", overlappingGroups);
  assert.notEqual(overlapResult.status, 0, "overlapping group backgrounds should fail");
  assert.match(overlapResult.output, /"groupOverlaps":\s*1/);

  const insufficientPadding = structuredClone(clean);
  insufficientPadding.nodes.find((node) => node.id === "a").x = 40;
  const paddingResult = run(tempDir, "insufficient-padding", insufficientPadding);
  assert.notEqual(paddingResult.status, 0, "insufficient group padding should fail");
  assert.match(paddingResult.output, /"groupPadding":\s*1/);

  const titleCollision = {
    nodes: [
      card("left", 100, 100),
      card("right", 1200, 100),
      { id: "group-title", type: "group", x: 720, y: 204, width: 400, height: 300, label: "COLLIDING FLOW" },
    ],
    edges: [{ id: "label-at-title", fromNode: "left", toNode: "right", fromEnd: "none", toEnd: "arrow", label: "Condition crossing title" }],
  };
  const titleResult = run(tempDir, "label-title-collision", titleCollision);
  assert.notEqual(titleResult.status, 0, "edge label over a group title should fail");
  assert.match(titleResult.output, /"labelTitleCollisions":\s*1/);

  const cardCollision = {
    nodes: [
      card("left", 100, 100),
      card("middle", 650, 100),
      card("right", 1200, 100),
    ],
    edges: [{ id: "label-at-card", fromNode: "left", toNode: "right", fromEnd: "none", toEnd: "arrow", label: "Condition crossing card" }],
  };
  const cardResult = run(tempDir, "label-card-collision", cardCollision);
  assert.notEqual(cardResult.status, 0, "edge label over a card should fail");
  assert.match(cardResult.output, /"labelCardCollisions":\s*1/);

});
