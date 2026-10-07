import {
  PROJECT_COMPLEXITY_OPTIONS,
  PROJECT_KIND_OPTIONS,
  PROJECT_ANSWERING_OPTIONS,
  PROJECT_REPOSITORY_TICKET_LAYER_OPTIONS,
  PROJECT_STATUS_OPTIONS,
  PROJECT_BOARD_STATUS_OPTIONS,
  PROJECT_BOARD_STATUS_COLORS,
  PROJECT_VIEW_CONTRACT,
} from "../../scripts/lib/ticket-projection/core.mjs";

const TEXT_FIELDS = ["Work area", "Waiting on", "Domain", "Responsibility", "Category", "Build Units", "Repository Build Units", "Parent Decision", "Decision Status", "Decision Tickets", "Resume When"];

export function fieldId(name) {
  return `F_${name.toUpperCase().replace(/[^A-Z]+/g, "_")}`;
}

export function fieldRef(name) {
  return { id: fieldId(name), name };
}

// A saved GitHub Project view snapshot that satisfies PROJECT_VIEW_CONTRACT; tests introduce drift on a copy.
export function contractViewState() {
  const select = (name, options, dataType = "SINGLE_SELECT") => ({
    id: fieldId(name),
    name,
    dataType,
    options: options.map((option) => ({ id: `${fieldId(name)}_${option}`, name: option, ...(name === "Board status" ? { color: PROJECT_BOARD_STATUS_COLORS[option] } : {}), description: "" })),
  });
  const fields = [
    { id: fieldId("Title"), name: "Title", dataType: "TITLE" },
    { id: fieldId("Assignees"), name: "Assignees", dataType: "ASSIGNEES" },
    select("Status", PROJECT_STATUS_OPTIONS),
    select("Board status", PROJECT_BOARD_STATUS_OPTIONS),
    select("Answering group", PROJECT_ANSWERING_OPTIONS),
    select("Kind", PROJECT_KIND_OPTIONS),
    select("Complexity", PROJECT_COMPLEXITY_OPTIONS),
    select("Repository Ticket Layer", PROJECT_REPOSITORY_TICKET_LAYER_OPTIONS),
    select("Repositories", [], "MULTI_SELECT"),
    { id: "F_SPRINT", name: "Sprint", dataType: "ITERATION" },
    ...TEXT_FIELDS.map((name) => ({ id: fieldId(name), name, dataType: "TEXT" })),
  ].reverse();
  const views = PROJECT_VIEW_CONTRACT.map((view, index) => ({
    id: `PVTV_${index + 1}`,
    number: index + 1,
    name: view.name,
    layout: view.layout,
    filter: view.filter,
    groupByFields: { nodes: view.groupBy.map(fieldRef) },
    verticalGroupByFields: { nodes: view.verticalGroupBy.map(fieldRef) },
    sortByFields: { nodes: view.sortBy.map(({ field, direction }) => ({ field: fieldRef(field), direction })) },
    configuration: { visibleFields: { nodes: view.visibleFields.map(fieldRef) } },
  }));
  return { fields: { nodes: fields, pageInfo: { hasNextPage: false } }, views: { nodes: views, pageInfo: { hasNextPage: false } } };
}

export function savedView(state, name) {
  return state.views.nodes.find((view) => view.name === name);
}
