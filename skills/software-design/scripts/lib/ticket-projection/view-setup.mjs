import { projectViewContract } from "./core.mjs";

const nodes = (connection) => connection?.nodes || connection || [];
const normalizedName = (name) => String(name || "").trim().toLowerCase();

export function validateViewSelection(selectedViews, config = {}) {
  const contract = projectViewContract(config);
  if (!Array.isArray(selectedViews) || !selectedViews.length || new Set(selectedViews).size !== selectedViews.length
    || selectedViews.some((name) => !contract.some((view) => view.name === name))) {
    throw new Error(`Select unique enabled default views with --view. Enabled: ${contract.map((view) => view.name).join(", ")}.`);
  }
  return contract.filter((view) => selectedViews.includes(view.name));
}

// An explicit selection authorizes creation only when no matching view exists.
// Near-matching names require explicit identity mapping, never another view.
export function inspectSetupViews(snapshot, selectedViews, config = {}) {
  const selected = validateViewSelection(selectedViews, config);
  const saved = nodes(snapshot?.views);
  const existing = [], missing = [];
  for (const expected of projectViewContract(config)) {
    const matches = saved.filter((view) => normalizedName(view.name) === normalizedName(expected.name));
    if (matches.length > 1 || (matches.length === 1 && matches[0].name !== expected.name)) {
      throw new Error(`Ambiguous existing view for ${expected.name}: ${matches.map((view) => `#${view.number} ${view.name}`).join(", ")}. Identify/rename the existing view explicitly before setup; no view was created.`);
    }
    if (!selected.some((view) => view.name === expected.name)) continue;
    if (matches.length) existing.push({ name: expected.name, id: matches[0].id, number: matches[0].number });
    else missing.push(expected);
  }
  return { existing, missing };
}

export function planProjectViewCreation(snapshot, selectedViews, config = {}) {
  const { existing, missing } = inspectSetupViews(snapshot, selectedViews, config);
  const fields = nodes(snapshot?.fields);
  const plans = missing.map((view) => {
    const refs = new Map();
    for (const name of new Set([...view.visibleFields, ...view.groupBy, ...view.verticalGroupBy, ...view.sortBy.map((sort) => sort.field)])) {
      const matches = fields.filter((field) => field?.name === name);
      if (matches.length !== 1) throw new Error(`View ${view.name}: expected exactly one field ${name}; found ${matches.length}. Complete field setup before creating views.`);
      const field = matches[0];
      if (!field.id || !Number.isSafeInteger(field.databaseId) || field.databaseId <= 0) {
        throw new Error(`View ${view.name}: field ${name} has no safe numeric databaseId in GitHub metadata. Do not decode or guess REST field identifiers.`);
      }
      refs.set(name, field);
    }
    if (new Set([...refs.values()].map((field) => field.databaseId)).size !== refs.size) throw new Error(`View ${view.name}: conflicting REST field identifiers.`);
    const ids = (names, key) => names.map((name) => refs.get(name)[key]);
    return {
      name: view.name,
      body: {
        name: view.name,
        layout: view.layout === "BOARD_LAYOUT" ? "board" : "table",
        filter: view.filter,
        visible_fields: ids(view.visibleFields, "databaseId"),
        sort_by: view.sortBy.map(({ field, direction }) => [refs.get(field).databaseId, direction.toLowerCase()]),
        group_by: ids(view.groupBy, "databaseId"),
        ...(view.layout === "BOARD_LAYOUT" ? { vertical_group_by: ids(view.verticalGroupBy, "databaseId") } : {}),
      },
      // Read-back uses GraphQL identities, not the unrelated numeric REST IDs.
      expected: {
        name: view.name, layout: view.layout, filter: view.filter,
        visibleFields: ids(view.visibleFields, "id"),
        groupBy: ids(view.groupBy, "id"), verticalGroupBy: ids(view.verticalGroupBy, "id"),
        sortBy: view.sortBy.map(({ field, direction }) => ({ field: refs.get(field).id, direction })),
      },
    };
  });
  return { existing, plans };
}

export function createdViewDrifts(view, plan) {
  const actual = {
    name: view.name, layout: view.layout, filter: view.filter || "",
    visibleFields: nodes(view.configuration?.visibleFields).map((field) => field.id),
    groupBy: nodes(view.groupByFields).map((field) => field.id),
    verticalGroupBy: nodes(view.verticalGroupByFields).map((field) => field.id),
    sortBy: nodes(view.sortByFields).map(({ field, direction }) => ({ field: field?.id, direction })),
  };
  return Object.entries(plan.expected).flatMap(([property, expected]) => JSON.stringify(actual[property]) === JSON.stringify(expected)
    ? [] : [{ view: plan.name, property, expected, actual: actual[property] }]);
}

export function projectViewsRestRoute(config, owner) {
  const [login, number] = config.project.split("/");
  if (typeof owner?.login !== "string" || owner.login.toLowerCase() !== login.toLowerCase()) throw new Error("Project owner metadata does not match the configured owner.");
  if (owner.type === "Organization") return `orgs/${encodeURIComponent(owner.login)}/projectsV2/${number}/views`;
  if (owner.type === "User" && Number.isSafeInteger(owner.id) && owner.id > 0) return `users/${owner.id}/projectsV2/${number}/views`;
  throw new Error("Unsupported Project owner type or missing numeric user ID; refusing REST creation.");
}
