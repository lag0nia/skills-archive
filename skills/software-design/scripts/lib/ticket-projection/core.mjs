import fs from "node:fs";
import path from "node:path";
import { validateImplementationDetailTickets } from "../../validate-implementation-detail-tickets.mjs";

const ACTIVE_STATUSES = new Set(["todo", "deferred", "decided", "finished", "out-of-scope"]);
const TICKET_KINDS = new Set(["technical", "product", "operational"]);
const OUTCOMES = new Set(["changed", "no-change", "clarification"]);
const CONFIG_KEYS = new Set(["provider", "ticketRoot", "repository", "project", "syncBranch", "omittedViews"]);

export const PROJECT_STATUS_OPTIONS = Object.freeze(["todo", "deferred", "decided", "finished", "out-of-scope"]);
export const PROJECT_BOARD_STATUS_OPTIONS = Object.freeze(["todo", "Waiting", "deferred", "decided", "finished"]);
export const PROJECT_BOARD_STATUS_COLORS = Object.freeze({ todo: "GREEN", Waiting: "PURPLE", deferred: "ORANGE", decided: "YELLOW", finished: "BLUE" });
export const PROJECT_COMPLEXITY_OPTIONS = Object.freeze(["low", "medium", "high"]);
export const PROJECT_ANSWERING_OPTIONS = Object.freeze(["Ready", "Waiting for answers", "Needs attention"]);
// Canonical kinds stay stable; display names are a one-way projection only.
const KIND_DISPLAY_NAMES = Object.freeze({ technical: "Software", product: "product", operational: "operational" });
export function kindDisplayName(kind) {
  if (!Object.hasOwn(KIND_DISPLAY_NAMES, kind)) throw new Error(`Invalid canonical ticket kind: ${kind}.`);
  return KIND_DISPLAY_NAMES[kind];
}
export const PROJECT_KIND_OPTIONS = Object.freeze([...TICKET_KINDS].map(kindDisplayName));

// Read-only migration advice. A later explicit field edit must preserve all IDs.
export function kindLabelMigration(fields) {
  const matches = fields.filter((field) => field?.name === "Kind");
  if (matches.length !== 1) return null;
  const field = matches[0];
  const type = String(field.dataType || field.type || "").toUpperCase().replace(/[_-]/g, "").replace(/^PROJECTV2/, "").replace(/FIELD$/, "");
  const options = field.options || [];
  if (type !== "SINGLESELECT" || !field.id || options.length !== 3
    || options.some((option, index) => option.name !== [...TICKET_KINDS][index] || !option.id)
    || new Set(options.map((option) => option.id)).size !== 3) return null;
  return {
    fieldId: field.id,
    optionId: options[0].id,
    from: "technical", to: "Software",
    preserveOptionIds: options.map((option) => option.id),
    action: "Explicitly rename the existing Kind option in place after reviewing its ID; preserve field/option IDs, colors, descriptions, order and item selections. Ordinary sync and sync --fields-only do not perform this migration.",
  };
}
export const PROJECT_REPOSITORY_TICKET_LAYER_OPTIONS = Object.freeze(["Repository-wide tickets", "Owned Build Unit tickets"]);
export const PROJECT_REPOSITORIES_FIELD = "Repositories";
export const PROJECT_WORKFLOW_LABEL = "Software Design Workflow";

const STANDARD_VISIBLE_FIELDS = Object.freeze(["Title", "Status", "Kind", "Complexity", "Responsibility", "Category", "Parent Decision"]);
const STATUS_BOARD_VISIBLE_FIELDS = Object.freeze(["Title", "Domain", "Complexity"]);
const REPOSITORY_VISIBLE_FIELDS = Object.freeze(["Title", "Build Units", "Repository Build Units"]);
const DECISION_VISIBLE_FIELDS = Object.freeze(["Title", "Decision Status", "Domain", "Responsibility", "Decision Tickets", "Resume When"]);
const OUT_OF_SCOPE_VISIBLE_FIELDS = Object.freeze(["Title", "Status", "Decision Status", "Domain", "Responsibility", "Decision Tickets", "Resume When"]);
const STATUS_SORT = Object.freeze([{ field: "Status", direction: "ASC" }]);
const TITLE_SORT = Object.freeze([{ field: "Title", direction: "ASC" }]);

export const PROJECT_VIEW_CONTRACT = Object.freeze([
  { name: "Tickets", layout: "BOARD_LAYOUT", filter: "status:todo,deferred -label:\"Technical Decision\"", sliceBy: null, groupBy: ["Work area"], verticalGroupBy: ["Answering group"], sortBy: TITLE_SORT, visibleFields: ["Title", "Status", "Domain", "Waiting on"] },
  { name: "Software", layout: "BOARD_LAYOUT", filter: "kind:Software status:todo,deferred,decided,finished -label:\"Technical Decision\"", sliceBy: null, groupBy: [], verticalGroupBy: ["Board status"], sortBy: TITLE_SORT, visibleFields: STATUS_BOARD_VISIBLE_FIELDS },
  { name: "Product & Operations", layout: "BOARD_LAYOUT", filter: "kind:product,operational status:todo,deferred,decided,finished -label:\"Technical Decision\"", sliceBy: null, groupBy: [], verticalGroupBy: ["Board status"], sortBy: TITLE_SORT, visibleFields: STATUS_BOARD_VISIBLE_FIELDS },
  { name: "All Tickets", layout: "TABLE_LAYOUT", filter: "status:todo,deferred,decided,finished,out-of-scope -label:\"Technical Decision\"", sliceBy: null, groupBy: [], verticalGroupBy: [], sortBy: STATUS_SORT, visibleFields: STANDARD_VISIBLE_FIELDS },
  { name: "Decision Areas", layout: "TABLE_LAYOUT", filter: "label:\"Technical Decision\"", sliceBy: null, groupBy: ["Decision Status"], verticalGroupBy: [], sortBy: TITLE_SORT, visibleFields: DECISION_VISIBLE_FIELDS },
  { name: "Out-of-Scope", layout: "TABLE_LAYOUT", filter: "label:\"Out-of-Scope\"", sliceBy: null, groupBy: [], verticalGroupBy: [], sortBy: TITLE_SORT, visibleFields: OUT_OF_SCOPE_VISIBLE_FIELDS },
  { name: "Repositories", layout: "BOARD_LAYOUT", filter: "has:repositories status:todo,deferred,decided,finished -label:\"Technical Decision\"", sliceBy: PROJECT_REPOSITORIES_FIELD, groupBy: ["Repository Ticket Layer"], verticalGroupBy: ["Status"], sortBy: TITLE_SORT, visibleFields: REPOSITORY_VISIBLE_FIELDS },
]);

// Only Repositories is optional; this changes presentation, never data projection.
export function projectViewContract(config = {}) {
  const omitted = Object.hasOwn(config, "omittedViews") ? config.omittedViews : [];
  if (!Array.isArray(omitted) || omitted.some((name) => name !== "Repositories") || new Set(omitted).size !== omitted.length) {
    throw new Error('omittedViews must be an array of unique optional view names; only "Repositories" may be omitted.');
  }
  return PROJECT_VIEW_CONTRACT.filter((view) => !omitted.includes(view.name));
}

export const PROJECT_MANUAL_UI_CHECKS = Object.freeze([
  {
    id: "visible-tab-order",
    requirement: "The enabled required saved Project tabs appear in requiredVisibleOrder relative to one another. Additional user views keep their positions. Verify requiredSlices for every saved view after reload.",
  },
  {
    id: "tickets-answering-board",
    requirement: "Tickets includes todo/deferred implementation tickets of every kind and repository scope, excluding TD records. Horizontal sections use Work area (Software for canonical technical tickets, Domain otherwise); columns use Answering group in order Ready, Waiting for answers, Needs attention with blank descriptions. Cards show Title, Status, Domain, Waiting on; Title ascending is stable navigation, never dependency priority. Independent ready questions may proceed in parallel. Save shared defaults and reload; no filter warning or No Answering group column.",
  },
  {
    id: "kind-status-boards",
    requirement: "Software shows Kind Software; Product & Operations shows Kind product or operational. Both include ordinary and repository-scoped implementation tickets, exclude Technical Decision records and out-of-scope tickets, and show todo, Waiting, deferred, decided, finished Board status columns; only ready canonical todo tickets appear in todo, blocked todo tickets appear in Waiting, and deferred tickets stay deferred. There is no horizontal grouping or slicing. Cards show Title, Domain, Complexity; Title sorts ascending. Save shared defaults and reload; verify no hidden Board status column, filter warning or No Board status metadata row. Position both tabs immediately after Tickets, preserving existing view identities and the relative order of other tabs.",
  },
  {
    id: "repositories-repo-slice",
    view: "Repositories",
    requirement: "Repositories remains one saved board filtered to items with Repositories membership and the todo, deferred, decided, or finished statuses, then sliced by the multi-select Repositories field. Its sidebar contains only canonical REPO-xxx options and no BU-xxx labels. Selecting one repository shows each applicable stable ticket issue exactly once, with Repository-wide tickets above Owned Build Unit tickets and the four active Status columns shared across both sections. Direct repository scope wins when both routes apply; multiple matching Build Units in one repository never duplicate the issue. Status column descriptions are blank, and no out-of-scope column, filter warning, generated repository issue, or No Status metadata row is present.",
  },
  {
    id: "out-of-scope-view",
    requirement: "Out-of-Scope shows each deferred Technical Decision once as the readable parent group plus each standalone out-of-scope ticket. Out-of-scope child tickets remain real issues but are omitted from this top-level view.",
  },
  {
    id: "all-tickets-decision-separation",
    requirement: "All Tickets shows every canonical TICKET issue, including TD-linked and standalone out-of-scope tickets, while excluding stable Technical Decision issues. Tickets with parent_decision null remain ordinary first-class rows.",
  },
]);

function namedNodes(connection) {
  return (connection?.nodes || connection || []).map((node) => node?.name).filter(Boolean);
}

function sameOrderedValues(left, right) {
  return left.length === right.length && left.every((value, index) => JSON.stringify(value) === JSON.stringify(right[index]));
}

function decisionTicketProgress(tickets) {
  const counts = new Map(PROJECT_STATUS_OPTIONS.map((status) => [status, 0]));
  for (const ticket of tickets) counts.set(ticket.status, (counts.get(ticket.status) || 0) + 1);
  const breakdown = PROJECT_STATUS_OPTIONS
    .filter((status) => counts.get(status))
    .map((status) => `${counts.get(status)} ${status}`);
  return [`${tickets.length} total`, ...breakdown].join(" · ");
}

export function auditProjectViewContract(snapshot, repositoryOptions = [], config = {}) {
  const contract = projectViewContract(config);
  const drifts = [];
  const fields = snapshot?.fields?.nodes || snapshot?.fields || [];
  const fieldByName = new Map(fields.filter(Boolean).map((field) => [field.name, field]));
  for (const [name, expected] of [
    ["Status", PROJECT_STATUS_OPTIONS],
    ["Board status", PROJECT_BOARD_STATUS_OPTIONS],
    ["Kind", PROJECT_KIND_OPTIONS],
    ["Answering group", PROJECT_ANSWERING_OPTIONS],
    ["Complexity", PROJECT_COMPLEXITY_OPTIONS],
    ["Repository Ticket Layer", PROJECT_REPOSITORY_TICKET_LAYER_OPTIONS],
    [PROJECT_REPOSITORIES_FIELD, repositoryOptions],
  ]) {
    const count = fields.filter((field) => field?.name === name).length;
    if (count > 1) drifts.push({ scope: "field", name, property: "count", expected: 1, actual: count });
    const field = fieldByName.get(name);
    const actual = (field?.options || []).map((option) => option.name);
    if (!field || !sameOrderedValues(actual, expected)) drifts.push({ scope: "field", name, property: "options", expected: [...expected], actual });
    const expectedType = name === PROJECT_REPOSITORIES_FIELD ? "MULTISELECT" : "SINGLESELECT";
    const actualType = String(field?.dataType || field?.type || "").toUpperCase().replace(/[_-]/g, "").replace(/^PROJECTV2/, "").replace(/FIELD$/, "");
    if (actualType !== expectedType) drifts.push({ scope: "field", name, property: "type", expected: expectedType, actual: actualType });
  }
  const boardOptions = fieldByName.get("Board status")?.options || [];
  for (const option of boardOptions) {
    const expected = PROJECT_BOARD_STATUS_COLORS[option.name];
    if (expected && option.color !== expected) drifts.push({ scope: "field", name: "Board status", property: "optionColor", option: option.name, expected, actual: option.color ?? null });
  }
  for (const name of ["Status", "Board status", "Answering group"]) {
    const descriptions = (fieldByName.get(name)?.options || []).map((option) => option.description || "");
    if (descriptions.some(Boolean)) drifts.push({ scope: "field", name, property: "optionDescriptions", expected: descriptions.map(() => ""), actual: descriptions });
  }
  for (const name of ["Work area", "Waiting on"]) {
    const matches = fields.filter((field) => field?.name === name);
    if (matches.length !== 1 || matches[0]?.dataType !== "TEXT") drifts.push({ scope: "field", name, property: "schema", expected: "one TEXT field", actual: matches });
  }

  for (const name of ["Domain", "Responsibility", "Category", "Build Units", "Repository Build Units", "Parent Decision", "Decision Status", "Decision Tickets", "Resume When"]) {
    if (!fieldByName.has(name)) drifts.push({ scope: "field", name, property: "presence", expected: true, actual: false });
  }

  const views = snapshot?.views?.nodes || snapshot?.views || [];
  const viewsByName = new Map();
  for (const view of views) {
    const matches = viewsByName.get(view.name) || [];
    matches.push(view);
    viewsByName.set(view.name, matches);
  }
  for (const expected of contract) {
    const matches = viewsByName.get(expected.name) || [];
    if (matches.length !== 1) {
      drifts.push({ scope: "view", name: expected.name, property: "count", expected: 1, actual: matches.length });
      continue;
    }
    const view = matches[0];
    const actual = {
      layout: view.layout,
      filter: view.filter || "",
      groupBy: namedNodes(view.groupByFields),
      verticalGroupBy: namedNodes(view.verticalGroupByFields),
      sortBy: (view.sortByFields?.nodes || view.sortByFields || []).map((entry) => ({ field: entry.field?.name, direction: entry.direction })),
      visibleFields: namedNodes(view.configuration?.visibleFields),
    };
    for (const property of ["layout", "filter", "groupBy", "verticalGroupBy", "sortBy", "visibleFields"]) {
      const expectedValue = expected[property];
      const actualValue = actual[property];
      const matchesValue = Array.isArray(expectedValue)
        ? sameOrderedValues(actualValue, expectedValue)
        : actualValue === expectedValue;
      if (!matchesValue) drifts.push({ scope: "view", name: expected.name, property, expected: expectedValue, actual: actualValue });
    }
  }
  const expectedNames = new Set(contract.map((view) => view.name));
  const additionalViews = views.filter((view) => !expectedNames.has(view.name)).map(({ id, number, name }) => ({ id, number, name }));

  // GitHub currently ignores the requested POSITION/NAME ordering field. Its
  // connection sequence cannot establish saved browser tab order in either direction.
  return {
    apiPassed: drifts.length === 0,
    requiredKindLabelMigration: kindLabelMigration(fields),
    additionalViews,
    drifts,
    requiredVisibleOrder: contract.map((view) => view.name),
    visibleOrderVerification: "manual-ui-required",
    apiViewOrderAuthoritative: false,
    requiredSlices: contract.map(({ name, sliceBy }) => ({ view: name, expected: sliceBy, verification: "saved-browser-required" })),
    manualUiChecks: PROJECT_MANUAL_UI_CHECKS.filter((check) => !check.view || contract.some((view) => view.name === check.view)).map((check) => ({ ...check, status: "required-ui-verification" })),
    completionRule: "Presentation setup is incomplete until API drift is resolved and required UI-only checks are verified after saving. Ordinary ticket synchronization does not audit presentation.",
    apiViewOrder: views.map((view) => view.name),
  };
}

// GitHub's public updateProjectV2View mutation writes only these settings of an existing view.
const VIEW_API_WRITABLE_PROPERTIES = new Set(["layout", "filter", "visibleFields"]);
const GITHUB_UI_REASONS = Object.freeze({
  groupBy: "The public API cannot update horizontal grouping on an existing view.",
  verticalGroupBy: "The public API cannot update vertical grouping on an existing view.",
  sortBy: "The public API cannot update sorting on an existing view.",
  order: "The public API cannot change saved tab positions.",
  count: "sync --views-only never creates, deletes, or chooses between views.",
  unexpected: "sync --views-only never deletes views.",
});
const VIEW_REPAIR_NEXT_STEPS = Object.freeze({
  "project-setup-required": "Complete remainingFieldSetup through explicitly scoped field setup, then rerun the audit; browser verification remains required.",
  "api-failure": "Report the failed, unverified, or not-attempted updates. Do not loop: run project-view-audit to read saved state, then either correct a clear cause and rerun sync --views-only once, or configure the outstanding settings in the signed-in GitHub interface as part of the authorized repair.",
  "github-ui-configuration-required": "Resolve any remainingFieldSetup separately. Configure only remainingGitHubUi in the signed-in GitHub interface, save each changed view, run project-view-audit, then verify audit.manualUiChecks.",
  "audit-passed-ui-checks-required": "Verify audit.manualUiChecks in the signed-in GitHub interface; presentation is not complete until they pass.",
});

function viewLabel(view) {
  return `#${view.number ?? "?"} "${view.name}"`;
}

function visibleFieldNodes(view) {
  return (view?.configuration?.visibleFields?.nodes || view?.configuration?.visibleFields || []);
}

function savedViewValue(view, property) {
  if (property === "visibleFields") return visibleFieldNodes(view).map((field) => field?.name ?? null);
  if (property === "filter") return view.filter || "";
  return view[property];
}

export function parseViewRenameArguments(values = []) {
  const contractNames = PROJECT_VIEW_CONTRACT.map((view) => view.name);
  const renames = values.map((value) => {
    const match = /^([1-9]\d*)=(.+)$/.exec(String(value ?? ""));
    if (!match) throw new Error(`--rename-view needs <view-number>=<contract view name>; received ${JSON.stringify(value ?? "")}.`);
    if (!contractNames.includes(match[2])) {
      throw new Error(`--rename-view target must be a contract view name (${contractNames.join(", ")}); received ${JSON.stringify(match[2])}.`);
    }
    return { number: Number(match[1]), name: match[2] };
  });
  for (const key of ["number", "name"]) {
    const seen = new Set();
    for (const rename of renames) {
      if (seen.has(rename[key])) throw new Error(`--rename-view names view ${key} ${JSON.stringify(rename[key])} more than once.`);
      seen.add(rename[key]);
    }
  }
  return renames;
}

// Plans only supported in-place settings for unambiguous views; any unresolved target blocks every write.
export function planProjectViewRepair(snapshot, { renames = [], config = {} } = {}) {
  const contract = projectViewContract(config);
  const views = (snapshot?.views?.nodes || snapshot?.views || []).filter(Boolean);
  const fields = (snapshot?.fields?.nodes || snapshot?.fields || []).filter((field) => field?.id && field?.name);
  const problems = [];
  const renameByViewId = new Map();
  for (const rename of renames) {
    if (!contract.some((view) => view.name === rename.name)) throw new Error(`Cannot rename to disabled or unknown default view: ${rename.name}.`);
    const matches = views.filter((view) => view.number === rename.number);
    if (matches.length === 1) renameByViewId.set(matches[0].id, rename.name);
    else problems.push(`--rename-view ${rename.number}=${rename.name}: no saved view has number ${rename.number}.`);
  }
  const fieldIdsByName = new Map();
  for (const field of fields) fieldIdsByName.set(field.name, [...(fieldIdsByName.get(field.name) || []), field.id]);
  const unresolvedFields = new Map();
  const updates = [];
  for (const expected of contract) {
    const matches = views.filter((view) => (renameByViewId.get(view.id) ?? view.name) === expected.name);
    if (!matches.length) {
      problems.push(`Missing view "${expected.name}". sync --views-only never creates views: use explicit sync --create-views --view "${expected.name}" after inspecting existing views, or identify an existing saved view with --rename-view <view-number>=${expected.name}.`);
      continue;
    }
    if (matches.length > 1) {
      problems.push(`View "${expected.name}" is ambiguous: ${matches.map(viewLabel).join(", ")}. Resolve the duplicate in the GitHub interface; sync --views-only never guesses which view is canonical.`);
      continue;
    }
    const view = matches[0];
    const visibleFieldIds = expected.visibleFields.map((name) => {
      const ids = fieldIdsByName.get(name) || [];
      if (ids.length === 1) return ids[0];
      const unresolved = unresolvedFields.get(name) || { count: ids.length, views: [] };
      unresolved.views.push(expected.name);
      unresolvedFields.set(name, unresolved);
      return null;
    });
    if (visibleFieldIds.includes(null)) continue;
    const changes = {};
    if (view.name !== expected.name) changes.name = expected.name;
    if (view.layout !== expected.layout) changes.layout = expected.layout;
    if ((view.filter || "") !== expected.filter) changes.filter = expected.filter;
    const savedFieldIds = visibleFieldNodes(view).map((field) => field?.id ?? null);
    if (!sameOrderedValues(savedFieldIds, visibleFieldIds)) changes.visibleFields = [...expected.visibleFields];
    if (!Object.keys(changes).length) continue;
    const { visibleFields, ...scalarChanges } = changes;
    updates.push({
      view: expected.name,
      viewId: view.id,
      number: view.number,
      currentName: view.name,
      properties: Object.keys(changes),
      expected: changes,
      input: { viewId: view.id, ...scalarChanges, ...(visibleFields ? { configuration: { visibleFieldIds } } : {}) },
    });
  }
  for (const [name, { count, views: viewNames }] of unresolvedFields) {
    problems.push(count
      ? `Project field "${name}" is ambiguous: ${count} fields share that name (visible in ${viewNames.join(", ")}). Rename or remove the extra field in the GitHub interface; sync --views-only never guesses field identity.`
      : `Project field "${name}" is missing (visible in ${viewNames.join(", ")}). Create it during Project setup before repairing views.`);
  }
  if (problems.length) {
    throw new Error([
      "Refusing to update Project views; no view was changed.",
      ...problems.map((problem) => `- ${problem}`),
      `Saved views: ${views.map(viewLabel).join(", ") || "none"}.`,
    ].join("\n"));
  }
  return updates;
}

// Verifies applied updates by view ID against the re-read saved state, then classifies the single audit.
export function summarizeProjectViewRepair({ project, updates, applied, failed, notAttempted, snapshot, verificationError = null, repositoryOptions = [], config = {} }) {
  const savedViews = new Map((snapshot?.views?.nodes || snapshot?.views || []).filter(Boolean).map((view) => [view.id, view]));
  const verified = [];
  const unverified = [];
  for (const update of applied) {
    const view = savedViews.get(update.viewId);
    for (const property of update.properties) {
      const entry = { view: update.view, number: update.number, property, expected: update.expected[property] };
      if (!snapshot) {
        unverified.push({ ...entry, reason: `Saved state could not be re-read: ${verificationError}` });
      } else if (!view) {
        unverified.push({ ...entry, reason: "The updated view was not found when saved state was re-read." });
      } else if (property === "visibleFields"
        ? sameOrderedValues(visibleFieldNodes(view).map((field) => field?.id ?? null), update.input.configuration.visibleFieldIds)
        : savedViewValue(view, property) === entry.expected) {
        verified.push({ view: update.view, number: update.number, property, value: entry.expected });
      } else {
        unverified.push({ ...entry, actual: savedViewValue(view, property), reason: "GitHub accepted the update, but the re-read saved view differs." });
      }
    }
  }
  const audit = snapshot ? auditProjectViewContract(snapshot, repositoryOptions, config) : null;
  // A rename that did not land leaves name-based findings that belong to the API failure, not to UI work.
  const unresolvedRenames = updates.filter((update) => update.properties.includes("name")
    && !verified.some((entry) => entry.view === update.view && entry.property === "name"));
  const explainedByUnresolvedRename = (drift) => {
    if (drift.scope === "views" && drift.property === "order") {
      const renamedOrder = audit.apiViewOrder.map((name) => unresolvedRenames.find((update) => update.currentName === name)?.view ?? name).filter((name) => drift.expected.includes(name));
      return unresolvedRenames.length > 0 && sameOrderedValues(renamedOrder, drift.expected);
    }
    return drift.scope === "view" && unresolvedRenames.some((update) => (drift.property === "count" && drift.name === update.view)
      || (drift.property === "unexpected" && drift.name === update.currentName));
  };
  const remainingGitHubUi = [];
  const remainingFieldSetup = [];
  for (const drift of audit?.drifts || []) {
    if (drift.scope === "field") {
      remainingFieldSetup.push({ ...drift, reason: "Explicit field setup required; sync --fields-only handles existing Status/Answering group options with preserved IDs. Kind display-label migration and missing or incompatible fields require separate explicit setup." });
    } else if (drift.scope === "view" && VIEW_API_WRITABLE_PROPERTIES.has(drift.property)) {
      const explained = [...failed, ...notAttempted].some((entry) => entry.view === drift.name)
        || unverified.some((entry) => entry.view === drift.name && entry.property === drift.property);
      if (!explained) unverified.push({ view: drift.name, property: drift.property, expected: drift.expected, actual: drift.actual, reason: "API-writable drift remained after this run." });
    } else if (!explainedByUnresolvedRename(drift)) {
      remainingGitHubUi.push({
        ...drift,
        reason: GITHUB_UI_REASONS[drift.property],
      });
    }
  }
  const outcome = failed.length || notAttempted.length || unverified.length || verificationError
    ? "api-failure"
    : remainingGitHubUi.length ? "github-ui-configuration-required" : remainingFieldSetup.length ? "project-setup-required" : "audit-passed-ui-checks-required";
  return {
    mode: "views-only",
    outcome,
    project,
    plannedUpdates: updates.length,
    verified,
    failed,
    unverified,
    notAttempted,
    remainingGitHubUi,
    remainingFieldSetup,
    ...(verificationError ? { verificationError } : {}),
    nextStep: VIEW_REPAIR_NEXT_STEPS[outcome],
    audit,
  };
}

function requireString(value, name) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${name} must be a non-empty string.`);
  return value.trim();
}

function normalizedRelativePath(value, name) {
  const raw = requireString(value, name).split("\\").join("/");
  if (path.isAbsolute(raw) || raw === ".." || raw.startsWith("../") || raw.split("/").includes("..")) {
    throw new Error(`${name} must be a repository-relative path that does not escape the repository.`);
  }
  return path.posix.normalize(raw).replace(/\/+$/, "");
}

function insideRoot(filePath, root) {
  return filePath === root || filePath.startsWith(`${root}/`);
}

function issueCommentId(url) {
  const match = /#issuecomment-(\d+)$/.exec(url || "");
  return match ? Number(match[1]) : null;
}

function sortedUnique(values, name) {
  if (!Array.isArray(values) || values.some((value) => typeof value !== "string" || !value)) {
    throw new Error(`${name} must be an array of non-empty strings.`);
  }
  return [...new Set(values)].sort();
}

export function validateConfig(rawConfig, cwd = process.cwd()) {
  if (!rawConfig || typeof rawConfig !== "object" || Array.isArray(rawConfig)) throw new Error("Projection config must be a JSON object.");
  for (const key of Object.keys(rawConfig)) if (!CONFIG_KEYS.has(key)) throw new Error(`Unknown config key: ${key}.`);
  for (const key of CONFIG_KEYS) if (key !== "omittedViews" && !Object.hasOwn(rawConfig, key)) throw new Error(`Missing required config key: ${key}.`);

  const provider = requireString(rawConfig.provider, "provider");
  const ticketRoot = normalizedRelativePath(rawConfig.ticketRoot, "ticketRoot");
  const repository = requireString(rawConfig.repository, "repository");
  const project = requireString(rawConfig.project, "project");
  const syncBranch = requireString(rawConfig.syncBranch, "syncBranch");
  if (provider !== "github") throw new Error(`Unsupported provider: ${provider}.`);
  if (ticketRoot === ".") throw new Error("ticketRoot must name a repository subdirectory.");
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) throw new Error("repository must use owner/repository format.");
  if (!/^[A-Za-z0-9_.-]+\/\d+$/.test(project)) throw new Error("project must use owner/number format.");
  const resolvedRoot = path.resolve(cwd, ticketRoot);
  const resolvedCwd = path.resolve(cwd);
  if (!(resolvedRoot === resolvedCwd || resolvedRoot.startsWith(`${resolvedCwd}${path.sep}`))) {
    throw new Error("ticketRoot must stay inside the consumer repository.");
  }
  projectViewContract(rawConfig);
  return { provider, ticketRoot, repository, project, syncBranch, ...(Object.hasOwn(rawConfig, "omittedViews") ? { omittedViews: [...rawConfig.omittedViews] } : {}) };
}

export function loadConfig(cwd = process.cwd()) {
  const configPath = path.join(cwd, "software-design-ticket-projection.json");
  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(configPath, "utf8"));
  } catch (error) {
    throw new Error(`Cannot read ${configPath}: ${error.message}`);
  }
  return validateConfig(raw, cwd);
}

export function issueIdentityMarker(ticketId) {
  if (!/^TICKET-\d{4}$/.test(ticketId || "")) throw new Error("Ticket identity must use TICKET-NNNN format.");
  return `<!-- software-design-ticket ${ticketId} -->`;
}

export function decisionIdentityMarker(decisionId) {
  if (!/^TD-\d{3}$/.test(decisionId || "")) throw new Error("Technical Decision identity must use TD-NNN format.");
  return `<!-- software-design-decision ${decisionId} -->`;
}

function appendSection(lines, heading, content) {
  if (!content) return;
  lines.push("", `## ${heading}`, content);
}

function appendListSection(lines, heading, values) {
  if (!values?.length) return;
  lines.push("", `## ${heading}`, ...values.map((value) => `- ${value}`));
}

function appendCurrentShape(lines, currentShape) {
  if (!currentShape) return;
  const fence = String.fromCharCode(96).repeat(3);
  const language = currentShape.type === "tree" ? "text" : "mermaid";
  lines.push(
    "",
    "## Current shape",
    "**" + currentShape.title + "**",
    "",
    fence + language,
    ...currentShape.lines,
    fence,
  );
}

function relationshipLabel(id, title, url) {
  if (!title) return `Unresolved reference: ${id}`;
  const label = title.replace(/([\\[\]])/g, "\\$1");
  return url ? `[${label}](${url})` : label;
}

function dependencyLabels(record) {
  return (record.dependencies || []).map((id) => {
    const detail = (record.dependencyDetails || []).find((entry) => entry.id === id);
    const label = relationshipLabel(id, detail?.title, detail?.issueUrl);
    return `${label} — ${detail?.status || "status unavailable"}`;
  });
}

function appendCanonicalReference(lines, record) {
  const visualSources = record.currentShape?.source_refs?.length
    ? ["- Current-shape sources: " + record.currentShape.source_refs.map((source) => "`" + source + "`").join(", ")]
    : [];
  lines.push(
    "",
    "<details>",
    "<summary>Canonical reference</summary>",
    "",
    `- Ticket: ${record.id}`,
    `- Source: \`${record.sourcePath}\``,
    ...(record.owner ? [`- Owner: ${record.owner}`] : []),
    ...(record.parentDecision ? [`- Parent decision: ${record.parentDecision}`] : []),
    ...[
      ["Dependencies", record.dependencies],
      ["Durable outcomes", record.resultRefs],
      ["Build units", record.buildUnits],
      ["Repositories", record.repositories],
    ].filter(([, values]) => values?.length).map(([label, values]) => `- ${label}: ${values.join(", ")}`),
    ...(!record.buildUnits?.length && record.buildUnitDisposition ? [`- Build-unit disposition: ${record.buildUnitDisposition}`] : []),
    ...visualSources,
    "",
    "</details>",
  );
}

function decisionTicketTable(ticketRecords) {
  const lines = [
    "| Ticket | Status | Specific question |",
    "| --- | --- | --- |",
  ];
  for (const record of ticketRecords) {
    const ticket = record.issueUrl
      ? `[${record.id} — ${record.title}](${record.issueUrl})`
      : `${record.id} — ${record.title}`;
    lines.push(`| ${ticket} | ${record.status} | ${record.question} |`);
  }
  if (!ticketRecords.length) lines.push("| None yet | — | The decision subject is established; specific implementation questions have not yet been created. |");
  return lines.join("\n");
}

export function renderTechnicalDecisionBody(decision, ticketRecords) {
  const unfinished = ticketRecords.filter((record) => record.status !== "finished");
  const finished = ticketRecords.filter((record) => record.status === "finished");
  const lines = [
    decisionIdentityMarker(decision.id),
    "",
    decision.context,
  ];
  appendCurrentShape(lines, decision.currentShape);
  lines.push(
    "",
    "## Why this matters",
    decision.whyItMatters,
    "",
    "## What is already established",
    decision.established,
    "",
    "## How the tickets fit together",
    decision.howTicketsFit,
    "",
    "## Linked ticket status",
    decisionTicketTable(ticketRecords),
    "",
    "## Decision state",
    `- State: ${decision.decisionStatus}`,
    `- Domain: ${decision.domainLabel}`,
    `- Affected System Responsibilities: ${decision.responsibilityLabel}`,
  );
  if (decision.decisionStatus === "Deferred For Later Design") {
    lines.push(`- Why deferred: ${decision.deferReason}`, `- Resume when: ${decision.resumeWhen}`);
  } else if (decision.decisionStatus === "Resolved") {
    lines.push(`- Combined outcome: ${decision.outcome}`);
  } else if (decision.decisionStatus === "Partially Resolved") {
    lines.push(
      `- Finished tickets: ${finished.map((record) => record.id).join(", ") || "None"}`,
      `- Remaining tickets: ${unfinished.map((record) => record.id).join(", ") || "None"}`,
    );
  } else if (decision.decisionStatus === "Blocked") {
    lines.push(`- Current blocker: ${decision.blocker}`);
  } else {
    lines.push(`- Remaining tickets: ${unfinished.map((record) => record.id).join(", ") || "Specific child tickets have not been created yet"}`);
  }
  lines.push(
    "",
    "<details>",
    "<summary>Canonical reference</summary>",
    "",
    `- Technical Decision: ${decision.id}`,
    `- Source: \`${decision.sourcePath}\``,
    `- Child tickets: ${ticketRecords.length ? ticketRecords.map((record) => record.id).join(", ") : "None yet"}`,
    ...(decision.currentShape?.source_refs?.length
      ? ["- Current-shape sources: " + decision.currentShape.source_refs.map((source) => "`" + source + "`").join(", ")]
      : []),
    "",
    "</details>",
  );
  return lines.join("\n");
}

function appendOptions(lines, options) {
  if (!options?.length) return;
  const letter = (index) => {
    let result = "";
    for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) result = String.fromCharCode(65 + (n - 1) % 26) + result;
    return result;
  };
  appendSection(lines, "Options", options.map((option, index) => `**${letter(index)}.** ${option}`).join("\n\n"));
}

export function renderIssueBody(record) {
  const lines = [issueIdentityMarker(record.id), ""];
  if (record.status === "todo") {
    lines.push(`## ${record.question}`, "", record.context);
  } else if (record.status === "deferred") {
    lines.push("## Why this is deferred", "", record.deferReason);
    appendSection(lines, "Resume when", record.resumeWhen);
    lines.push("", "The answer is still required for the target version.");
    appendSection(lines, "Decision still needed", record.question);
    if (record.context && record.context !== record.deferReason) lines.push("", record.context);
  } else if (record.status === "out-of-scope") {
    lines.push("## Why this is out of scope", "", record.scopeReason);
    appendSection(lines, "Reopen when", record.resumeWhen);
    lines.push("", "No decision is required for the current scope.");
    appendSection(lines, "Future question", record.question);
    if (record.context && record.context !== record.scopeReason) lines.push("", record.context);
  } else if (record.status === "decided" || record.status === "finished") {
    lines.push(record.status === "decided" ? "## Approved decision" : "## Approved final outcome", "", record.resolution);
    if (record.status === "decided") lines.push("", "Affected canonical updates and checks remain before completion.");
    appendSection(lines, "Original question", record.question);
    if (record.context) lines.push("", record.context);
  } else {
    throw new Error(`Cannot render unsupported status ${record.status} for ${record.id}.`);
  }
  appendCurrentShape(lines, record.currentShape);
  if (["todo", "deferred", "out-of-scope"].includes(record.status)) {
    appendOptions(lines, record.options);
    appendSection(lines, "Recommendation", record.recommendation);
  }
  if (record.parentDecision) appendSection(lines, "Related decision", relationshipLabel(record.parentDecision, record.parentDecisionTitle, record.parentDecisionUrl));
  appendListSection(lines, ["todo", "deferred"].includes(record.status) ? "Before answering" : "Related prerequisites", dependencyLabels(record));
  if (["todo", "deferred"].includes(record.status)) appendListSection(lines, "Waiting on", record.waitingOnDetails || []);
  if (record.status === "todo") lines.push("", "Reply in a comment with your choice, adjustment, alternative, or clarification. Comments are discussion input; approval and canonical updates follow the existing design workflow.");
  appendCanonicalReference(lines, record);
  return lines.join("\n");
}

export function buildUnitLabel(buildUnit) {
  if (!/^BU-\d{3,}$/.test(buildUnit?.id || "")) throw new Error("Build Unit identity must use BU-xxx format.");
  if (typeof buildUnit.name !== "string" || !buildUnit.name.trim()) throw new Error(`Build Unit ${buildUnit.id} must have a name.`);
  return `${buildUnit.id} — ${buildUnit.name.trim()}`;
}

export function normalizeBuildUnitRecords(buildUnits) {
  const records = [];
  for (const unit of [...buildUnits.values()].sort((left, right) => left.id.localeCompare(right.id))) {
    records.push({ id: unit.id, name: unit.name, label: buildUnitLabel(unit) });
  }
  return records;
}

export function normalizeRepositoryRecords(repositories, buildUnits = new Map(), repositoryRoot = process.cwd()) {
  const records = [];
  for (const repository of [...repositories.values()].sort((left, right) => left.id.localeCompare(right.id))) {
    if (!/^REPO-\d{3,}$/.test(repository?.id || "")) throw new Error(`Repository identity must use REPO-xxx format: ${repository?.id || "unknown"}.`);
    if (typeof repository.name !== "string" || !repository.name.trim()) throw new Error(`Repository ${repository.id} must have a name.`);
    const memberBuildUnits = [...(repository.memberBuildUnits || [])].sort();
    if (!memberBuildUnits.length) throw new Error(`Repository ${repository.id} must declare member Build Units.`);
    const memberBuildUnitLabels = memberBuildUnits.map((buildUnitId) => {
      const buildUnit = buildUnits.get(buildUnitId);
      if (!buildUnit) throw new Error(`Repository ${repository.id} references unknown Build Unit ${buildUnitId}.`);
      return buildUnit.label || buildUnitLabel(buildUnit);
    });
    records.push({
      id: repository.id,
      name: repository.name.trim(),
      label: `${repository.id} — ${repository.name.trim()}`,
      memberBuildUnits,
      memberBuildUnitLabels,
      sourcePath: path.relative(repositoryRoot, repository.filePath || "").split(path.sep).join("/"),
    });
  }
  return records;
}

export function repositoryTicketProjection(record, repositories = []) {
  const explicitRepositoryIds = new Set(record.repositories || []);
  const ticketBuildUnits = new Set(record.buildUnits || []);
  const ownedRepositoryIds = new Set();
  for (const repository of repositories) {
    if ((repository.memberBuildUnits || []).some((buildUnitId) => ticketBuildUnits.has(buildUnitId))) {
      ownedRepositoryIds.add(repository.id);
    }
  }
  return {
    repositoryIds: [...new Set([...explicitRepositoryIds, ...ownedRepositoryIds])].sort(),
    layer: explicitRepositoryIds.size
      ? PROJECT_REPOSITORY_TICKET_LAYER_OPTIONS[0]
      : ownedRepositoryIds.size
        ? PROJECT_REPOSITORY_TICKET_LAYER_OPTIONS[1]
        : null,
  };
}

export function normalizeTicketDocuments(
  documents,
  repositoryRoot = process.cwd(),
  responsibilities = new Map(),
  domains = new Map(),
  decisions = new Map(),
  repositories = new Map(),
) {
  const ticketDetails = new Map();
  for (const document of documents) {
    for (const ticket of document.tickets || []) {
      if (ticket.id && ticket.title) ticketDetails.set(ticket.id, { title: ticket.title, status: ticket.status });
    }
  }

  const records = [];
  for (const document of documents) {
    for (const ticket of document.tickets || []) {
      if (!ACTIVE_STATUSES.has(ticket.status)) continue;
      const sourcePath = path.relative(repositoryRoot, document.filePath).split(path.sep).join("/");
      const responsibility = responsibilities.get(ticket.owner);
      const parentDecision = ticket.parent_decision ? decisions.get(ticket.parent_decision) : null;
      const domainScope = /^domain:(.+)$/.exec(document.scope || "")?.[1];
      const domainLabel = responsibility?.domainName
        || (domainScope ? domains.get(domainScope)?.name : null)
        || (document.scope === "cross-domain" ? "Cross-domain" : null);
      const dependencies = ticket.depends_on || ticket.dependencies || [];
      const record = {
        id: ticket.id,
        title: ticket.title,
        status: ticket.status,
        kind: ticket.kind,
        complexity: ticket.complexity,
        owner: ticket.owner,
        parentDecision: ticket.parent_decision || null,
        parentDecisionTitle: parentDecision?.title || null,
        domainLabel,
        responsibilityLabel: responsibility?.name ? `${ticket.owner} — ${responsibility.name}` : ticket.owner === "shared" ? "Shared" : ticket.owner,
        concern: ticket.concern,
        question: ticket.question,
        context: ticket.context,
        currentShape: ticket.current_shape || null,
        options: ticket.options || [],
        recommendation: ticket.recommendation,
        dependencies,
        blockedBy: ticket.blocked_by,
        dependencyDetails: dependencies.map((id) => ({ id, ...ticketDetails.get(id) })),
        resolution: ticket.resolution,
        resultRefs: ticket.result_refs || [],
        buildUnits: [...(ticket.build_units || [])].sort(),
        buildUnitDisposition: ticket.build_unit_disposition || null,
        repositories: [...(ticket.repositories || [])].sort(),
        deferReason: ticket.defer_reason || (ticket.status === "deferred" ? ticket.context : null),
        scopeReason: ticket.scope_reason || parentDecision?.deferReason || (ticket.status === "out-of-scope" ? ticket.context : null),
        resumeWhen: ticket.resume_when || (ticket.status === "out-of-scope" ? parentDecision?.resumeWhen : null) || null,
        sourcePath,
      };
      if (!/^TICKET-\d{4}$/.test(record.id || "")) throw new Error(`Invalid ticket identity: ${record.id}.`);
      if (!PROJECT_COMPLEXITY_OPTIONS.includes(record.complexity)) throw new Error(`Invalid ticket complexity for ${record.id}: ${record.complexity}.`);
      if (!TICKET_KINDS.has(record.kind)) throw new Error(`Invalid ticket kind for ${record.id}: ${record.kind}.`);
      if (!record.domainLabel) throw new Error(`Cannot resolve projected Domain for ${record.id}.`);
      for (const repositoryId of record.repositories) {
        if (!repositories.has(repositoryId)) throw new Error(`${record.id} references unknown Repository Build Design ${repositoryId}.`);
      }
      if (record.status === "deferred" && (!record.deferReason || !record.resumeWhen)) {
        throw new Error(`Deferred ticket ${record.id} needs a reason and resume condition.`);
      }
      if (record.status === "out-of-scope" && (!record.scopeReason || !record.resumeWhen)) {
        throw new Error(`Out-of-scope ticket ${record.id} needs a scope reason and resume condition.`);
      }
      record.issueTitle = `${record.id} — ${record.title}`;
      record.body = renderIssueBody(record);
      records.push(record);
    }
  }
  records.sort((left, right) => left.id.localeCompare(right.id));
  const duplicate = records.find((record, index) => index && record.id === records[index - 1].id);
  if (duplicate) throw new Error(`Duplicate ordinary ticket identity: ${duplicate.id}.`);
  return records;
}

export function normalizeDecisionRecords(
  decisions = new Map(),
  ticketRecords = [],
  repositoryRoot = process.cwd(),
  domains = new Map(),
  responsibilities = new Map(),
) {
  const records = [];
  for (const decision of [...decisions.values()].sort((left, right) => left.id.localeCompare(right.id))) {
    const linked = ticketRecords.filter((record) => record.parentDecision === decision.id).sort((left, right) => left.id.localeCompare(right.id));
    const domainLabel = domains.get(decision.primaryDomain)?.name
      || [...new Set(linked.map((record) => record.domainLabel).filter(Boolean))].sort().join(", ")
      || "Cross-domain";
    const responsibilityLabel = (decision.affectedResponsibilities || [])
      .map((responsibilityId) => responsibilities.get(responsibilityId)?.name ? `${responsibilityId} — ${responsibilities.get(responsibilityId).name}` : responsibilityId)
      .join(", ") || "Not specified";
    const record = {
      id: decision.id,
      title: decision.title,
      decisionStatus: decision.state,
      decisionTickets: decisionTicketProgress(linked),
      domainLabel,
      responsibilityLabel,
      context: decision.context,
      whyItMatters: decision.whyItMatters,
      established: decision.established,
      howTicketsFit: decision.howTicketsFit,
      currentShape: decision.currentShape || null,
      blocker: decision.blocker || null,
      outcome: decision.outcome,
      deferReason: decision.deferReason,
      resumeWhen: decision.resumeWhen || "Not deferred",
      sourcePath: path.relative(repositoryRoot, decision.filePath).split(path.sep).join("/"),
      ticketIds: linked.map((record) => record.id),
      childTickets: linked.map((record) => ({
        id: record.id,
        title: record.title,
        status: record.status,
        question: record.question,
      })),
      issueTitle: `${decision.id} — ${decision.title}`,
    };
    record.body = renderTechnicalDecisionBody(record, linked);
    records.push(record);
  }
  return records;
}

export function loadProjectionRecords(config, cwd = process.cwd()) {
  const ticketRoot = path.resolve(cwd, config.ticketRoot);
  const result = validateImplementationDetailTickets(ticketRoot);
  if (result.errors.length) throw new Error(result.errors.join("\n"));
  const buildUnits = normalizeBuildUnitRecords(result.buildUnits || new Map());
  const repositories = normalizeRepositoryRecords(result.repositories || new Map(), new Map(buildUnits.map((buildUnit) => [buildUnit.id, buildUnit])), cwd);
  const repositoryIndex = new Map(repositories.map((repository) => [repository.id, repository]));
  return normalizeTicketDocuments(result.documents || [], cwd, result.responsibilities, result.domains, result.decisions, repositoryIndex);
}

export function loadProjectionBundle(config, cwd = process.cwd()) {
  const ticketRoot = path.resolve(cwd, config.ticketRoot);
  const result = validateImplementationDetailTickets(ticketRoot);
  if (result.errors.length) throw new Error(result.errors.join("\n"));
  const buildUnits = normalizeBuildUnitRecords(result.buildUnits || new Map());
  const repositories = normalizeRepositoryRecords(result.repositories || new Map(), new Map(buildUnits.map((buildUnit) => [buildUnit.id, buildUnit])), cwd);
  const repositoryIndex = new Map(repositories.map((repository) => [repository.id, repository]));
  const records = normalizeTicketDocuments(result.documents || [], cwd, result.responsibilities, result.domains, result.decisions, repositoryIndex);
  const decisions = normalizeDecisionRecords(result.decisions, records, cwd, result.domains, result.responsibilities);
  const archivedRecords = (result.documents || []).flatMap((document) => document.archivedRecords.map((ticket) => ({
    ...ticket, sourcePath: path.relative(cwd, document.filePath).split(path.sep).join("/"),
  })));
  return { records, decisions, buildUnits, repositories, archivedRecords };
}

export function processedThroughMarker(ticketId, commentUrl) {
  if (!/^TICKET-\d{4}$/.test(ticketId || "")) throw new Error("Ticket identity must use TICKET-NNNN format.");
  if (commentUrl !== null && (typeof commentUrl !== "string" || issueCommentId(commentUrl) === null)) {
    throw new Error("comment_url must be null or a canonical GitHub issue comment URL.");
  }
  return `<!-- software-design-processed-through ${JSON.stringify({ ticket: ticketId, comment_url: commentUrl })} -->`;
}

export function parseProcessedThroughMarker(body) {
  const match = /<!-- software-design-processed-through (\{[^\n]*\}) -->/.exec(body || "");
  if (!match) return null;
  let data;
  try {
    data = JSON.parse(match[1]);
  } catch {
    return null;
  }
  if (!/^TICKET-\d{4}$/.test(data.ticket || "") || (data.comment_url !== null && issueCommentId(data.comment_url) === null)) return null;
  if (match[1] !== JSON.stringify({ ticket: data.ticket, comment_url: data.comment_url })) return null;
  return { ticket: data.ticket, commentUrl: data.comment_url };
}

export function selectPendingComments({ ticketId, issue, comments, authenticatedLogin }) {
  const sorted = [...comments].sort((left, right) => Number(left.id) - Number(right.id));
  const validSummaries = sorted.filter((comment) => {
    const marker = parseProcessedThroughMarker(comment.body);
    return marker
      && marker.ticket === ticketId
      && comment.author?.login === authenticatedLogin
      && (marker.commentUrl === null || marker.commentUrl.startsWith(`${issue.url}#issuecomment-`));
  });
  const latestSummary = validSummaries.at(-1);
  let marker = latestSummary ? parseProcessedThroughMarker(latestSummary.body) : null;
  let cursorId = issueCommentId(marker?.commentUrl);
  for (const summary of validSummaries) {
    const candidate = parseProcessedThroughMarker(summary.body);
    const candidateId = issueCommentId(candidate?.commentUrl);
    if (candidateId !== null && (cursorId === null || candidateId > cursorId)) {
      marker = candidate;
      cursorId = candidateId;
    }
  }
  const summaryIds = new Set(validSummaries.map((comment) => Number(comment.id)));
  const pending = sorted.filter((comment) => !summaryIds.has(Number(comment.id)) && (cursorId === null || Number(comment.id) > cursorId));
  return { processedThroughCommentUrl: marker?.commentUrl || null, pending };
}

export function validatePendingPrefix({ pending, processedThroughCommentUrl, sourceCommentUrls }) {
  const sources = new Set(sortedUnique(sourceCommentUrls, "sourceCommentUrls"));
  const pendingUrls = new Set(pending.map((comment) => comment.url));
  if (processedThroughCommentUrl === null || processedThroughCommentUrl === undefined) {
    if ([...sources].some((url) => pendingUrls.has(url))) {
      throw new Error("sourceCommentUrls cannot include pending issue-local comments without advancing processedThroughCommentUrl.");
    }
    return null;
  }
  const index = pending.findIndex((comment) => comment.url === processedThroughCommentUrl);
  if (index < 0) throw new Error("processedThroughCommentUrl must name a pending issue-local comment.");
  for (const comment of pending.slice(0, index + 1)) {
    if (!sources.has(comment.url)) throw new Error("processedThroughCommentUrl must cover a contiguous prefix of pending issue-local comments.");
  }
  for (const comment of pending.slice(index + 1)) {
    if (sources.has(comment.url)) throw new Error("sourceCommentUrls cannot include pending issue-local comments beyond processedThroughCommentUrl.");
  }
  return processedThroughCommentUrl;
}

export function validateSummaryResult(result) {
  if (!result || typeof result !== "object" || !/^TICKET-\d{4}$/.test(result.ticketId || "")) throw new Error("Each summary needs a TICKET-NNNN ticketId.");
  if (!OUTCOMES.has(result.outcome)) throw new Error("Summary outcome must be changed, no-change, or clarification.");
  requireString(result.understoodInput, "understoodInput");
  requireString(result.reason, "reason");
  sortedUnique(result.sourceCommentUrls, "sourceCommentUrls");
  if (!Array.isArray(result.canonicalFiles) || result.canonicalFiles.some((file) => typeof file !== "string" || !file)) {
    throw new Error("canonicalFiles must be an array of non-empty paths.");
  }
  if (result.outcome === "changed") {
    if (typeof result.draftPrUrl !== "string" || !result.draftPrUrl) throw new Error("Changed summaries require a verified draft PR.");
    if (!result.canonicalFiles.length) throw new Error("Changed summaries require canonical files.");
  } else if (result.draftPrUrl !== null && result.draftPrUrl !== undefined) {
    throw new Error("No-change and clarification summaries must not include a draft PR.");
  }
  if (result.outcome === "clarification" && (typeof result.clarificationQuestion !== "string" || !result.clarificationQuestion.trim())) {
    throw new Error("Clarification summaries require a focused clarificationQuestion.");
  }
  return result;
}

export function validateSummaryBatch(results) {
  if (!Array.isArray(results)) throw new Error("post-summaries input must be an array.");
  const ticketIds = new Set();
  for (const result of results) {
    validateSummaryResult(result);
    if (ticketIds.has(result.ticketId)) throw new Error(`Duplicate summary result for ${result.ticketId}.`);
    ticketIds.add(result.ticketId);
  }
  return results;
}

export function renderSummary(result, { markerCommentUrl = result.processedThroughCommentUrl ?? null } = {}) {
  validateSummaryResult(result);
  const sources = result.sourceCommentUrls.length ? result.sourceCommentUrls.map((url) => `- ${url}`).join("\n") : "None";
  const files = result.canonicalFiles.length ? result.canonicalFiles.map((file) => `- ${file}`).join("\n") : "None";
  const details = [
    "## Software Design comment processing",
    "",
    "Source comments:",
    sources,
    "",
    `Processed through: ${markerCommentUrl || "None"}`,
    `Understood input: ${result.understoodInput}`,
    `Outcome: ${result.outcome}`,
    `Reason: ${result.reason}`,
    "Canonical files:",
    files,
    `Draft PR: ${result.draftPrUrl || "None"}`,
  ];
  if (result.clarificationQuestion) details.push(`Clarification question: ${result.clarificationQuestion}`);
  details.push(processedThroughMarker(result.ticketId, markerCommentUrl));
  return details.join("\n");
}

export function branchName(date, existingBranches = new Set()) {
  const iso = new Date(date).toISOString().replace(/\.\d{3}Z$/, "Z").replace(/:/g, "-");
  const base = `td/github-comments-${iso}`;
  if (!existingBranches.has(base)) return base;
  let suffix = 2;
  while (existingBranches.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

export function normalizePublishFiles(files, config) {
  const normalized = sortedUnique(files, "files").map((file) => normalizedRelativePath(file, "file"));
  if (!normalized.length) throw new Error("publish-draft requires at least one file.");
  for (const file of normalized) if (!insideRoot(file, config.ticketRoot)) throw new Error(`publish-draft files must stay under ${config.ticketRoot}: ${file}`);
  return normalized;
}

export async function dispatchProjection({ operation, config, cwd = process.cwd(), options = {}, adapter }) {
  const { records, decisions, buildUnits, repositories, archivedRecords } = loadProjectionBundle(config, cwd);
  if (operation === "project-view-audit") return adapter.projectViewAudit({ config, repositories });
  if (operation === "sync" && options.createViews) return adapter.createViews({ config, repositories, selectedViews: options.selectedViews, publishingLock: options.publishingLock });
  if (operation === "sync" && options.fieldsOnly) return adapter.setupFields({ config, answeringOptionNames: options.answeringOptionNames, publishingLock: options.publishingLock });
  if (operation === "sync" && options.viewsOnly) {
    return adapter.syncViews({ config, repositories, renames: options.renames || [], publishingLock: options.publishingLock });
  }
  if (operation === "sync") return adapter.sync({ config, records, decisions, buildUnits, repositories, archivedRecords, publishingLock: options.publishingLock });
  if (operation === "reconcile") return adapter.reconcile({ config, records, decisions, buildUnits, repositories, archivedRecords });
  if (operation === "pending-comments") return adapter.pendingComments({ config, records });
  if (operation === "publish-draft") {
    const files = normalizePublishFiles(options.files, config);
    const validation = validateImplementationDetailTickets(path.resolve(cwd, config.ticketRoot));
    if (validation.errors.length) throw new Error(validation.errors.join("\n"));
    return adapter.publishDraft({ config, files, title: requireString(options.title, "title"), bodyFile: requireString(options.bodyFile, "body-file") });
  }
  if (operation === "post-summaries") {
    validateSummaryBatch(options.results);
    return adapter.postSummaries({ config, records, results: options.results });
  }
  throw new Error(`Unsupported projection operation: ${operation}.`);
}
