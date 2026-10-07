import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const DELIVERY_SNAPSHOT_PATTERN = /^sha256:[a-f0-9]{64}$/;

const SNAPSHOT_FIELD_PATTERN = /^\*\*Snapshot ID:\*\*\s*(.+?)\s*$/gm;

function normalizeLineEndings(value) {
  return String(value).replace(/\r\n?/g, "\n");
}

function inside(root, target) {
  const relative = path.relative(root, target);
  return relative === "" || (!relative.startsWith(".." + path.sep) && relative !== ".." && !path.isAbsolute(relative));
}

function snapshotlessHandoff(text) {
  return normalizeLineEndings(text).replace(/\n+\*\*Snapshot ID:\*\*[^\n]*(?:\n+|$)/m, "\n\n");
}

function assertReadableSource({ root, rootReal, sourcePath, label }) {
  if (!inside(root, sourcePath)) throw new Error("Snapshot source escapes the Software Design package: " + label);
  if (!fs.existsSync(sourcePath)) throw new Error("Snapshot source does not exist: " + label);
  if (!fs.statSync(sourcePath).isFile()) throw new Error("Snapshot source is not a file: " + label);
  const sourceReal = fs.realpathSync(sourcePath);
  if (!inside(rootReal, sourceReal)) throw new Error("Snapshot source resolves outside the Software Design package: " + label);
}

export function recordedDeliverySnapshot(handoffText) {
  const matches = [...String(handoffText).matchAll(SNAPSHOT_FIELD_PATTERN)];
  if (matches.length !== 1) return null;
  const value = matches[0][1].trim().replace(/^`|`$/g, "");
  return DELIVERY_SNAPSHOT_PATTERN.test(value) ? value : null;
}

export function deliverySnapshotSources({ root, handoffPath }) {
  const resolvedRoot = path.resolve(root);
  const resolvedHandoff = path.resolve(handoffPath);
  if (!fs.existsSync(resolvedRoot) || !fs.statSync(resolvedRoot).isDirectory()) {
    throw new Error("Software Design package does not exist: " + resolvedRoot);
  }
  const rootReal = fs.realpathSync(resolvedRoot);
  assertReadableSource({ root: resolvedRoot, rootReal, sourcePath: resolvedHandoff, label: resolvedHandoff });
  return [resolvedHandoff];
}

export function computeDeliverySnapshot({ root, handoffPath }) {
  const [resolvedHandoff] = deliverySnapshotSources({ root, handoffPath });
  const content = snapshotlessHandoff(fs.readFileSync(resolvedHandoff, "utf8"));
  const hash = createHash("sha256");
  hash.update(content, "utf8");
  return "sha256:" + hash.digest("hex");
}

export function writeDeliverySnapshot({ root, handoffPath }) {
  const resolvedHandoff = path.resolve(handoffPath);
  const snapshot = computeDeliverySnapshot({ root, handoffPath: resolvedHandoff });
  const original = fs.readFileSync(resolvedHandoff, "utf8");
  const line = "**Snapshot ID:** `" + snapshot + "`";
  let updated;
  if (/^\*\*Snapshot ID:\*\*.*$/m.test(original)) {
    updated = original.replace(/^\*\*Snapshot ID:\*\*.*$/m, line);
  } else {
    const outcome = /^\*\*Outcome:\*\*.*$/m;
    if (!outcome.test(original)) throw new Error("Stage 9 handoff is missing **Outcome:**; cannot place Snapshot ID.");
    updated = original.replace(outcome, (match) => match + "\n\n" + line);
  }
  if (updated !== original) fs.writeFileSync(resolvedHandoff, updated);
  return snapshot;
}

export function deliverySnapshotErrors({ root, handoffPath }) {
  const handoffText = fs.readFileSync(handoffPath, "utf8");
  const matches = [...handoffText.matchAll(SNAPSHOT_FIELD_PATTERN)];
  if (matches.length !== 1) {
    return ["Stage 9 handoff must contain exactly one **Snapshot ID:** `sha256:...` field."];
  }
  const recorded = recordedDeliverySnapshot(handoffText);
  if (!recorded) return ["Stage 9 handoff has an invalid **Snapshot ID:**; expected `sha256:` followed by 64 lowercase hexadecimal characters."];
  try {
    const current = computeDeliverySnapshot({ root, handoffPath });
    return recorded === current
      ? []
      : ["Stage 9 handoff Snapshot ID is stale: recorded `" + recorded + "`, current `" + current + "`."];
  } catch (error) {
    return [error instanceof Error ? error.message : String(error)];
  }
}
