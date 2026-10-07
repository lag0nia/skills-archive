import { PROJECT_ANSWERING_OPTIONS, PROJECT_STATUS_OPTIONS, PROJECT_BOARD_STATUS_OPTIONS, PROJECT_BOARD_STATUS_COLORS } from "./core.mjs";

// Bounded setup: existing Status/Answering group/Board status options only. Never omit an
// existing option ID: omission can clear every item using that option.
export function planFieldSetup(fields, answeringOptionNames = {}) {
  const updates = [];
  for (const [name, expected] of [["Status", PROJECT_STATUS_OPTIONS], ["Answering group", PROJECT_ANSWERING_OPTIONS], ["Board status", PROJECT_BOARD_STATUS_OPTIONS]]) {
    const matches = fields.filter((field) => field.name === name);
    if (matches.length !== 1) throw new Error(`Explicit setup requires exactly one ${name} field; found ${matches.length}. Create a missing field or resolve ambiguity first.`);
    const field = matches[0];
    if (String(field.dataType || field.type).toUpperCase().replace(/[_-]/g, "").replace(/^PROJECTV2/, "").replace(/FIELD$/, "") !== "SINGLESELECT") throw new Error(`${name} must be single-select; do not repurpose an incompatible field.`);
    const options = field.options || [];
    if (name === "Answering group") for (const id of Object.keys(answeringOptionNames)) {
      if (!options.some((option) => option.id === id)) throw new Error(`Unknown Answering group option ID: ${id}`);
    }
    const next = options.map((option) => {
      if (!option.id || !option.color) throw new Error(`${name} option needs its existing ID and color before setup.`);
      return { id: option.id, name: name === "Answering group" ? answeringOptionNames[option.id] ?? option.name : option.name, color: name === "Board status" ? PROJECT_BOARD_STATUS_COLORS[option.name] ?? option.color : option.color, description: "" };
    });
    if (next.length !== expected.length || expected.some((value) => next.filter((option) => option.name === value).length !== 1)) throw new Error(`${name} options conflict. Explicitly map existing Answering group option IDs to ${PROJECT_ANSWERING_OPTIONS.join(", ")}; never delete/recreate options or guess identities.`);
    next.sort((a, b) => expected.indexOf(a.name) - expected.indexOf(b.name));
    if (JSON.stringify(next) !== JSON.stringify(options.map(({ id, name, color, description }) => ({ id, name, color, description: description || "" })))) updates.push({ fieldId: field.id, singleSelectOptions: next });
  }
  return updates;
}
