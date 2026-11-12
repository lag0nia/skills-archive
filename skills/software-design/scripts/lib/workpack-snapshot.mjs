import { DELIVERY_SNAPSHOT_PATTERN } from "./delivery-snapshot.mjs";

const WORKPACK_SNAPSHOT_FIELD = /^\*\*Software Design snapshot:\*\*\s*(.+?)\s*$/gm;

// One reader for the workpack's copied handoff Snapshot ID, shared by the workpack
// validator and report-delivery-planning-gaps.mjs so both parse the field identically.
export function readWorkpackSnapshot(text) {
  const fields = [...String(text).matchAll(WORKPACK_SNAPSHOT_FIELD)];
  const recorded = fields.length === 1 ? fields[0][1].replace(/`/g, "").trim() : null;
  return {
    fieldCount: fields.length,
    recorded,
    snapshot: recorded && DELIVERY_SNAPSHOT_PATTERN.test(recorded) ? recorded : null,
  };
}
