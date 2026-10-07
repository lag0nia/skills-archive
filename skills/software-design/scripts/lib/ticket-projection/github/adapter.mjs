import { validateViewSelection, inspectSetupViews, planProjectViewCreation, createdViewDrifts, projectViewsRestRoute } from "../view-setup.mjs";
import { planFieldSetup } from "../field-setup.mjs";
import { deriveTicketBoard, decidedNotice } from "../ticket-board.mjs";
import { publishingPreflight } from "../publishing-preflight.mjs";
import { spawn } from "node:child_process";
import {
  auditProjectViewContract,
  branchName,
  issueIdentityMarker,
  planProjectViewRepair,
  projectViewContract,
  PROJECT_KIND_OPTIONS,
  kindDisplayName,
  kindLabelMigration,
  PROJECT_ANSWERING_OPTIONS,
  PROJECT_COMPLEXITY_OPTIONS,
  PROJECT_REPOSITORIES_FIELD,
  PROJECT_REPOSITORY_TICKET_LAYER_OPTIONS,
  PROJECT_STATUS_OPTIONS,
  PROJECT_BOARD_STATUS_OPTIONS,
  PROJECT_WORKFLOW_LABEL,
  repositoryTicketProjection,
  renderTechnicalDecisionBody,
  renderIssueBody,
  renderSummary,
  selectPendingComments,
  summarizeProjectViewRepair,
  validatePendingPrefix,
  validateSummaryBatch,
} from "../core.mjs";

const PROJECT_FIELD_NODES = `
  ... on ProjectV2Field { id name dataType }
  ... on ProjectV2SingleSelectField { id name dataType options { id name color description } }
  ... on ProjectV2MultiSelectField { id name dataType options: multiSelectOptions { id name } }
`;

const PROJECT_FIELDS_QUERY = `
query ProjectProjectionFields($projectId: ID!) {
  node(id: $projectId) {
    ... on ProjectV2 {
      fields(first: 100) {
        nodes { ${PROJECT_FIELD_NODES} }
        pageInfo { hasNextPage }
      }
    }
  }
}`;

const PROJECT_ITEM_MULTISELECT_VALUES_QUERY = `
query ProjectProjectionItemMultiSelectValues($projectId: ID!, $after: String) {
  node(id: $projectId) {
    ... on ProjectV2 {
      items(first: 100, after: $after) {
        nodes {
          id
          fieldValues(first: 100) {
            nodes {
              ... on ProjectV2ItemFieldMultiSelectValue {
                field { ... on ProjectV2MultiSelectField { name } }
                options { name }
              }
            }
          }
        }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
}`;

// Every ProjectV2FieldConfiguration member, so exact visible-field comparisons cannot miss an iteration field.
const PROJECT_VIEW_FIELD_REFERENCE = "... on ProjectV2Field { id name } ... on ProjectV2IterationField { id name } ... on ProjectV2SingleSelectField { id name } ... on ProjectV2MultiSelectField { id name }";

const PROJECT_VIEW_QUERY = `
query ProjectViewConfiguration($projectId: ID!) {
  node(id: $projectId) {
    ... on ProjectV2 {
      fields(first: 100) {
        nodes { ${PROJECT_FIELD_NODES} ... on ProjectV2IterationField { id name dataType } }
        pageInfo { hasNextPage }
      }
      views(first: 50, orderBy: { field: POSITION, direction: ASC }) {
        nodes {
          id name number layout filter
          groupByFields(first: 10) { nodes { ${PROJECT_VIEW_FIELD_REFERENCE} } }
          verticalGroupByFields(first: 10) { nodes { ${PROJECT_VIEW_FIELD_REFERENCE} } }
          sortByFields(first: 10) { nodes { direction field { ${PROJECT_VIEW_FIELD_REFERENCE} } } }
          configuration { visibleFields(first: 30) { nodes { ${PROJECT_VIEW_FIELD_REFERENCE} } } }
        }
        pageInfo { hasNextPage }
      }
    }
  }
}`;

const PROJECT_VIEW_SETUP_FIELDS_QUERY = `
query ProjectViewSetupFields($projectId: ID!) {
  node(id: $projectId) {
    ... on ProjectV2 {
      fields(first: 100) {
        nodes {
          ... on ProjectV2Field { id name databaseId }
          ... on ProjectV2SingleSelectField { id name databaseId }
        }
        pageInfo { hasNextPage }
      }
    }
  }
}`;

const UPDATE_PROJECT_VIEW_MUTATION = "mutation UpdateProjectViewPresentation($input: UpdateProjectV2ViewInput!) { updateProjectV2View(input: $input) { projectV2View { id } } }";

function defaultRun({ command, args, cwd, input, interactive = false }) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: interactive ? "inherit" : ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    let settled = false;
    const rejectOnce = (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };
    if (!interactive) {
      child.stdout.setEncoding("utf8");
      child.stderr.setEncoding("utf8");
      child.stdout.on("data", (chunk) => { stdout += chunk; });
      child.stderr.on("data", (chunk) => { stderr += chunk; });
      child.stdin.on("error", rejectOnce);
      child.stdin.end(input ?? "");
    }
    child.on("error", rejectOnce);
    child.on("close", (status) => {
      if (settled) return;
      settled = true;
      if (status !== 0) {
        const output = (stderr || stdout).trim();
        const suffix = output || `exited with status ${status}`;
        reject(new Error(`${command} ${args.join(" ")} failed: ${suffix}`));
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

function commandOutput(result) {
  if (typeof result === "string") return result;
  if (result && typeof result.stdout === "string") return result.stdout;
  return "";
}

function parseJson(text, label) {
  try {
    return JSON.parse(text || "null");
  } catch (error) {
    throw new Error(`Could not parse ${label} JSON: ${error.message}`);
  }
}

function sortedSet(values) {
  return [...new Set(values)].sort();
}

function samePaths(left, right) {
  const a = sortedSet(left);
  const b = sortedSet(right);
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function normalizePath(value) {
  return value.split("\\").join("/").replace(/^\.\//, "");
}

function parsePorcelain(output) {
  const entries = output.split("\0");
  const paths = [];
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    if (!entry) continue;
    const status = entry.slice(0, 2);
    const filePath = normalizePath(entry.slice(3));
    if (filePath) paths.push({ status, path: filePath });
    if (status.includes("R") || status.includes("C")) {
      const oldPath = normalizePath(entries[++index] || "");
      if (oldPath) paths.push({ status, path: oldPath });
    }
  }
  return paths;
}

function underTicketRoot(filePath, ticketRoot) {
  return filePath === ticketRoot || filePath.startsWith(`${ticketRoot}/`);
}

// Legacy/current aliases denote the same identity only on the same issue.
// Exact managed comments exclude history markers and ordinary title mentions.
function managedMarkers(issue) {
  return [...String(issue.body || "").matchAll(/<!-- (software|technical)-design-(ticket|decision) (TICKET-\d{4}|TD-\d{3}) -->/g)]
    .map((match) => ({ namespace: match[1], type: match[2], id: match[3] }));
}

function markerIds(issue) {
  return [...new Set(managedMarkers(issue).filter((marker) => marker.type === "ticket").map((marker) => marker.id))];
}

function decisionMarkerIds(issue) {
  return [...new Set(managedMarkers(issue).filter((marker) => marker.type === "decision").map((marker) => marker.id))];
}

function validateMarkerCollisions(issues) {
  const owners = new Map();
  for (const issue of issues) {
    const markers = managedMarkers(issue);
    const identities = new Set(markers.map((marker) => `${marker.type} ${marker.id}`));
    const exact = markers.map((marker) => `${marker.namespace} ${marker.type} ${marker.id}`);
    const malformed = markers.some((marker) => marker.type === "ticket" ? !marker.id.startsWith("TICKET-") : !marker.id.startsWith("TD-"));
    if (malformed || identities.size > 1 || new Set(exact).size !== exact.length) {
      throw new Error(`Managed marker collision on issue ${issue.number}: ${[...identities].join(", ")}. Clean it up manually before retrying.`);
    }
    for (const identity of identities) {
      if (owners.has(identity)) throw new Error(`Duplicate GitHub issue markers for ${identity}: ${owners.get(identity)}, ${issue.number}. Clean them up manually before retrying.`);
      owners.set(identity, issue.number);
    }
  }
}

function issuesByTicket(issues, records) {
  const wanted = new Set(records.map((record) => record.id));
  const result = new Map([...wanted].map((ticketId) => [ticketId, []]));
  for (const issue of issues) {
    for (const ticketId of markerIds(issue)) if (wanted.has(ticketId)) result.get(ticketId).push(issue);
  }
  for (const [ticketId, matches] of result) {
    if (matches.length > 1) throw new Error(`Duplicate GitHub issue markers for ${ticketId}: ${matches.map((issue) => issue.number).join(", ")}. Clean them up manually before retrying.`);
  }
  return result;
}

function issuesByDecision(issues, decisions) {
  const result = new Map(decisions.map((decision) => [decision.id, []]));
  for (const issue of issues) {
    for (const decisionId of decisionMarkerIds(issue)) if (result.has(decisionId)) result.get(decisionId).push(issue);
  }
  for (const [decisionId, matches] of result) {
    const uniqueMatches = [...new Map(matches.map((issue) => [issue.number, issue])).values()];
    result.set(decisionId, uniqueMatches);
    if (uniqueMatches.length > 1) throw new Error(`Duplicate GitHub Technical Decision issues for ${decisionId}: ${uniqueMatches.map((issue) => issue.number).join(", ")}. Clean them up manually before retrying.`);
  }
  return result;
}

// Use the existing bulk issue snapshot; relationship navigation adds no requests.
function ticketsWithRelationshipLinks(records, ticketIssues, decisionIssues) {
  return records.map((record) => {
    const dependencyDetails = (record.dependencyDetails || []).map((detail) => ({
      ...detail,
      issueUrl: ticketIssues.get(detail.id)?.[0]?.url || null,
    }));
    const parentDecisionUrl = decisionIssues.get(record.parentDecision)?.[0]?.url || null;
    if (!parentDecisionUrl && !dependencyDetails.some((detail) => detail.issueUrl) && !record.waitingOnDetails?.length) return record;
    const linked = { ...record, dependencyDetails, parentDecisionUrl };
    return { ...linked, body: renderIssueBody(linked) };
  });
}

function repositoryBuildUnitText(record, repositoriesById) {
  const repositories = [...repositoriesById.values()];
  const repositoryIds = repositoryTicketProjection(record, repositories).repositoryIds;
  if (!repositoryIds.length) return "Unmapped";
  return repositoryIds.map((repositoryId) => {
    const repository = repositoriesById.get(repositoryId);
    if (!repository) throw new Error(`Ticket ${record.id} references unknown Repository ${repositoryId}.`);
    const buildUnits = repository.memberBuildUnits.join(", ") || "Unmapped";
    return repositoryIds.length === 1 ? buildUnits : `${repository.label}: ${buildUnits}`;
  }).join("; ");
}

function expectedTicketProjectValues(record, repositoriesById = new Map()) {
  const repositoryProjection = repositoryTicketProjection(record, [...repositoriesById.values()]);
  return {
    ...record.boardValues,
    Status: record.status,
    Kind: kindDisplayName(record.kind),
    Complexity: record.complexity,
    Domain: record.domainLabel,
    Responsibility: record.responsibilityLabel || record.owner,
    Category: record.concern,
    "Build Units": record.buildUnits?.length ? [...record.buildUnits].sort().join(", ") : record.buildUnitDisposition || "Unmapped",
    "Repository Build Units": repositoryBuildUnitText(record, repositoriesById),
    [PROJECT_REPOSITORIES_FIELD]: repositoryProjection.repositoryIds.map((repositoryId) => {
      const repository = repositoriesById.get(repositoryId);
      if (!repository) throw new Error(`Ticket ${record.id} references unknown Repository ${repositoryId}.`);
      return repository.label;
    }),
    "Repository Ticket Layer": repositoryProjection.layer,
    "Parent Decision": record.parentDecision ? `${record.parentDecision} — ${record.parentDecisionTitle}` : "None",
    "Decision Status": null,
    "Decision Tickets": null,
    "Resume When": record.resumeWhen || null,
  };
}

function decisionProjectStatus(decision) {
  return {
    Open: "todo",
    "Partially Resolved": "decided",
    "Deferred For Later Design": "out-of-scope",
    Blocked: "deferred",
    Resolved: "finished",
  }[decision.decisionStatus];
}

function expectedDecisionProjectValues(decision) {
  return {
    "Work area": null,
    "Answering group": null,
    "Waiting on": null,
    "Board status": null,
    Status: decisionProjectStatus(decision),
    Kind: kindDisplayName("technical"),
    Complexity: null,
    Domain: decision.domainLabel,
    Responsibility: decision.responsibilityLabel,
    Category: "technical-decision",
    "Build Units": null,
    "Repository Build Units": null,
    [PROJECT_REPOSITORIES_FIELD]: [],
    "Repository Ticket Layer": null,
    "Parent Decision": null,
    "Decision Status": decision.decisionStatus,
    "Decision Tickets": decision.decisionTickets,
    "Resume When": decision.resumeWhen,
  };
}

function decisionWithTicketLinks(decision, ticketIssuesById) {
  const childTickets = (decision.childTickets || []).map((ticket) => ({
    ...ticket,
    issueUrl: ticketIssuesById.get(ticket.id)?.url || null,
  }));
  return { ...decision, body: renderTechnicalDecisionBody(decision, childTickets) };
}

function projectFields(project, repositories = []) {
  const fields = project.fields?.nodes || project.fields || [];
  const result = new Map(fields.map((field) => [field.name, field]));
  const requiredTextFields = [
    "Work area",
    "Waiting on",
    "Answering group",
    "Board status",
    "Status",
    "Kind",
    "Complexity",
    "Domain",
    "Responsibility",
    "Category",
    "Build Units",
    PROJECT_REPOSITORIES_FIELD,
    "Repository Ticket Layer",
    "Parent Decision",
    "Decision Status",
    "Decision Tickets",
    "Resume When",
  ];
  requiredTextFields.push("Repository Build Units");
  for (const name of requiredTextFields) {
    if (!result.has(name)) throw new Error(`GitHub Project is missing required ${name} field. Explicit field setup is required before sync.`);
    if (fields.filter((field) => field.name === name).length !== 1) throw new Error(`GitHub Project field ${name} is ambiguous; explicit setup must resolve duplicate fields.`);
  }
  for (const [name, expectedOptions] of [
    ["Status", PROJECT_STATUS_OPTIONS],
    ["Board status", PROJECT_BOARD_STATUS_OPTIONS],
    ["Kind", PROJECT_KIND_OPTIONS],
    ["Answering group", PROJECT_ANSWERING_OPTIONS],
    ["Complexity", PROJECT_COMPLEXITY_OPTIONS],
    ["Repository Ticket Layer", PROJECT_REPOSITORY_TICKET_LAYER_OPTIONS],
  ]) {
    const field = result.get(name);
    const type = String(field.dataType || field.type || "").toUpperCase().replace(/[_-]/g, "");
    if (type !== "SINGLESELECT" && type !== "PROJECTV2SINGLESELECTFIELD") {
      throw new Error(`GitHub Project ${name} must be a single-select field.`);
    }
    const actualOptions = (field.options || []).map((option) => option.name);
    if (actualOptions.length !== expectedOptions.length || actualOptions.some((option, index) => option !== expectedOptions[index])) {
      const migration = name === "Kind" ? kindLabelMigration(fields) : null;
      const advice = migration ? ` Explicit migration required: rename existing Kind option ${migration.optionId} from technical to Software in field ${migration.fieldId}, preserving IDs and selections; ordinary sync does not rename options.` : " Explicit field setup is required before sync; do not recreate existing options.";
      throw new Error(`GitHub Project ${name} options must be ordered exactly as: ${expectedOptions.join(", ")}.${advice}`);
    }
  }
  const repositoryField = result.get(PROJECT_REPOSITORIES_FIELD);
  const repositoryFieldType = String(repositoryField.dataType || repositoryField.type || "").toUpperCase().replace(/[_-]/g, "");
  if (repositoryFieldType !== "MULTISELECT" && repositoryFieldType !== "PROJECTV2MULTISELECTFIELD") {
    throw new Error(`GitHub Project ${PROJECT_REPOSITORIES_FIELD} must be a multi-select field.`);
  }
  const expectedRepositoryOptions = repositories.map((repository) => repository.label);
  const actualRepositoryOptions = (repositoryField.options || repositoryField.multiSelectOptions || []).map((option) => option.name);
  if (actualRepositoryOptions.length !== expectedRepositoryOptions.length || actualRepositoryOptions.some((option, index) => option !== expectedRepositoryOptions[index])) {
    throw new Error(`GitHub Project ${PROJECT_REPOSITORIES_FIELD} options must be ordered exactly as: ${expectedRepositoryOptions.join(", ") || "none"}.`);
  }
  for (const name of ["Work area", "Waiting on", "Domain", "Responsibility", "Category", "Build Units", "Repository Build Units", "Parent Decision", "Decision Status", "Decision Tickets", "Resume When"]) {
    const type = String(result.get(name).dataType || result.get(name).type || "").toUpperCase();
    if (type !== "TEXT" && type !== "PROJECTV2FIELD") throw new Error(`GitHub Project ${name} must be a text field.`);
  }
  return result;
}

function projectItems(project) {
  return project.items?.nodes || project.items || [];
}

function itemForIssue(project, issue) {
  return projectItems(project).find((item) => String(item.content?.number) === String(issue.number) || item.content?.url === issue.url) || null;
}

function normalizedMultiSelectValues(value) {
  if (value === null || value === undefined || value === "") return [];
  if (Array.isArray(value)) {
    return sortedSet(value.map((entry) => typeof entry === "string" ? entry : entry?.name).filter(Boolean));
  }
  if (Array.isArray(value?.options)) return sortedSet(value.options.map((option) => option?.name).filter(Boolean));
  if (typeof value === "string") return sortedSet(value.split(/,\s*/).filter(Boolean));
  return [];
}

function fieldValue(item, fieldName) {
  const values = item?.fieldValues?.nodes || item?.fieldValues || [];
  const value = values.find((candidate) => candidate.field?.name === fieldName || candidate.name === fieldName);
  if (value) {
    if (fieldName === PROJECT_REPOSITORIES_FIELD) return normalizedMultiSelectValues(value.options ?? value.value ?? value.name);
    return value.name ?? value.text ?? value.value ?? null;
  }
  const [first, ...rest] = fieldName.split(/\s+/);
  const flattenedName = `${first[0].toLowerCase()}${first.slice(1)}${rest.map((word) => `${word[0].toUpperCase()}${word.slice(1)}`).join("")}`;
  const cliTextFieldName = [first[0].toLowerCase() + first.slice(1), ...rest].join(" ");
  const fallback = item?.[flattenedName] ?? item?.[cliTextFieldName] ?? null;
  return fieldName === PROJECT_REPOSITORIES_FIELD ? normalizedMultiSelectValues(fallback) : fallback;
}

function sameFieldValue(actual, expected) {
  if (Array.isArray(expected)) return samePaths(normalizedMultiSelectValues(actual), expected);
  return actual === expected;
}

function parseProject(config) {
  const [owner, number] = config.project.split("/");
  return { owner, number };
}

function issueNumberFromUrl(url) {
  const match = /\/issues\/(\d+)$/.exec(url || "");
  if (!match) throw new Error(`GitHub did not return an issue URL: ${url}`);
  return Number(match[1]);
}

function normalizeIssue(issue) {
  return { ...issue, url: issue.html_url || issue.url };
}

function normalizeComment(comment) {
  return {
    ...comment,
    url: comment.html_url || comment.url,
    author: comment.author || comment.user,
  };
}

const BUILD_UNIT_LABEL_COLOR = "5319e7";
const TECHNICAL_DECISION_LABEL = "Technical Decision";
const OUT_OF_SCOPE_LABEL = "Out-of-Scope";
const TECHNICAL_DECISION_LABEL_COLOR = "1d76db";
const OUT_OF_SCOPE_LABEL_COLOR = "c2e0c6";
const WORKFLOW_LABEL_COLOR = "0e8a16";
const PROJECT_ITEM_LIST_LIMIT = 1000;
const REPOSITORY_LABEL_LIST_LIMIT = 1000;
const SYNC_WRITE_CONCURRENCY = 3;

function buildUnitIdFromLabel(name) {
  return /^(BU-\d{3,}) — .+$/.exec(String(name || ""))?.[1] || null;
}

function repositoryIdFromLabel(name) {
  return /^(REPO-\d{3,}) — .+$/.exec(String(name || ""))?.[1] || null;
}

function issueLabelNames(issue, renamedLabels = new Map()) {
  return (issue?.labels || [])
    .map((label) => typeof label === "string" ? label : label?.name)
    .filter(Boolean)
    .map((name) => renamedLabels.get(name) || name);
}

function changedFieldEntries(item, values) {
  return Object.entries(values).filter(([name, expected]) => !sameFieldValue(fieldValue(item, name), expected));
}

function ticketLabelChanges(issue, record, labelsById, renamedLabels) {
  const desiredIds = record.repositories?.length ? [] : record.buildUnits;
  const desired = new Set(desiredIds.map((id) => {
    const label = labelsById.get(id);
    if (!label) throw new Error(`Ticket ${record.id} references unknown Build Unit ${id}.`);
    return label;
  }));
  const current = new Set(issueLabelNames(issue, renamedLabels));
  const belongsInWorkflow = record.status !== "out-of-scope" && !record.repositories?.length;
  if (belongsInWorkflow) desired.add(PROJECT_WORKFLOW_LABEL);
  const add = new Set([...desired].filter((name) => !current.has(name)));
  const remove = new Set([...current].filter((name) => buildUnitIdFromLabel(name) && !desired.has(name)));
  if (!belongsInWorkflow && current.has(PROJECT_WORKFLOW_LABEL)) remove.add(PROJECT_WORKFLOW_LABEL);
  for (const name of current) if (repositoryIdFromLabel(name)) remove.add(name);
  const isStandaloneOutOfScope = record.status === "out-of-scope" && record.parentDecision === null;
  if (isStandaloneOutOfScope && !current.has(OUT_OF_SCOPE_LABEL)) add.add(OUT_OF_SCOPE_LABEL);
  if (!isStandaloneOutOfScope && current.has(OUT_OF_SCOPE_LABEL)) remove.add(OUT_OF_SCOPE_LABEL);
  if (current.has(TECHNICAL_DECISION_LABEL)) remove.add(TECHNICAL_DECISION_LABEL);
  return { add: [...add].sort(), remove: [...remove].sort() };
}

function decisionLabelChanges(issue, decision) {
  const current = new Set(issueLabelNames(issue));
  const add = new Set();
  const remove = new Set();
  if (!current.has(TECHNICAL_DECISION_LABEL)) add.add(TECHNICAL_DECISION_LABEL);
  if (decision.decisionStatus === "Deferred For Later Design" && !current.has(OUT_OF_SCOPE_LABEL)) add.add(OUT_OF_SCOPE_LABEL);
  if (decision.decisionStatus !== "Deferred For Later Design" && current.has(OUT_OF_SCOPE_LABEL)) remove.add(OUT_OF_SCOPE_LABEL);
  if (current.has(PROJECT_WORKFLOW_LABEL)) remove.add(PROJECT_WORKFLOW_LABEL);
  return { add: [...add].sort(), remove: [...remove].sort() };
}

function hasLabelChanges(changes) {
  return changes.add.length > 0 || changes.remove.length > 0;
}

async function runBoundedPlans(plans, apply, concurrency = SYNC_WRITE_CONCURRENCY) {
  const results = new Array(plans.length);
  const failures = [];
  let nextIndex = 0;
  let stopped = false;
  async function worker() {
    while (!stopped) {
      const index = nextIndex;
      if (index >= plans.length) return;
      nextIndex += 1;
      try {
        results[index] = await apply(plans[index], index);
      } catch (error) {
        failures.push({ index, error });
        stopped = true;
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, plans.length) }, () => worker()));
  failures.sort((left, right) => left.index - right.index);
  return { results, failures };
}

function buildUnitLabelsById(buildUnits) {
  const result = new Map();
  for (const record of buildUnits) {
    if (!/^BU-\d{3,}$/.test(record?.id || "") || typeof record?.label !== "string" || !record.label.startsWith(`${record.id} — `)) {
      throw new Error(`Invalid Build Unit label record for ${record?.id || "unknown"}.`);
    }
    if (result.has(record.id)) throw new Error(`Duplicate Build Unit label record: ${record.id}.`);
    result.set(record.id, record.label);
  }
  return result;
}

function prNumberFromUrl(url) {
  const match = /\/pull\/(\d+)$/.exec(url || "");
  if (!match) throw new Error(`Expected a GitHub pull request URL, received: ${url}`);
  return Number(match[1]);
}

export function createGitHubAdapter({ run = defaultRun, cwd = process.cwd(), now = () => new Date(), onProgress = () => {} } = {}) {
  const syncStartedAt = () => Date.now();
  function emitProgress(event, startedAt) {
    try {
      onProgress({ ...event, elapsedMs: Date.now() - startedAt });
    } catch {
      // Progress reporting must never change projection behavior.
    }
  }
  async function execute(command, args, options = {}) {
    return commandOutput(await run({ command, args, cwd, ...options }));
  }

  async function ghJson(args, label, options = {}) {
    return parseJson(await execute("gh", args, options), label);
  }

  async function ghPages(route, label) {
    const pages = await ghJson(["api", "--paginate", "--slurp", route], label);
    if (!Array.isArray(pages)) return [];
    return pages.flat();
  }

  async function authenticatedLogin() {
    await execute("gh", ["auth", "status", "--active", "--hostname", "github.com"]);
    const login = (await execute("gh", ["api", "user", "--jq", ".login"])).trim();
    if (!login) throw new Error("GitHub authenticated user was empty.");
    return login;
  }

  async function ensureAuthenticated({ interactive = false, pollAttempts = 30, pollIntervalMs = 1000 } = {}) {
    try {
      return { authenticated: true, login: await authenticatedLogin(), prompted: false };
    } catch (initialError) {
      if (!interactive) {
        throw new Error(
          "GitHub authentication is unavailable. Run `gh auth login --hostname github.com --web --git-protocol https` in an interactive terminal, then retry. "
          + initialError.message,
        );
      }

      await execute("gh", ["auth", "login", "--hostname", "github.com", "--web", "--git-protocol", "https"], { interactive: true });
      let lastError = initialError;
      for (let attempt = 0; attempt < pollAttempts; attempt += 1) {
        try {
          return { authenticated: true, login: await authenticatedLogin(), prompted: true };
        } catch (error) {
          lastError = error;
          if (attempt + 1 < pollAttempts) await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
        }
      }
      throw new Error(`GitHub login finished, but access could not be verified. ${lastError.message}`);
    }
  }

  async function readIssues(config) {
    const issues = await ghPages(`repos/${config.repository}/issues?state=all&per_page=100`, "GitHub issues");
    const normalized = issues.filter((issue) => !issue.pull_request).map(normalizeIssue);
    validateMarkerCollisions(normalized);
    return normalized;
  }

  async function readProjectFields(project) {
    if (!project?.id) throw new Error("GitHub Project did not return an id for field retrieval.");
    const response = await ghJson([
      "api",
      "graphql",
      "-f",
      `query=${PROJECT_FIELDS_QUERY}`,
      "-f",
      `projectId=${project.id}`,
    ], "GitHub Project fields");
    const fields = response?.data?.node?.fields;
    if (!fields) throw new Error("GitHub Project field retrieval returned no Project fields.");
    if (fields.pageInfo?.hasNextPage) {
      throw new Error("GitHub Project field retrieval reached the 100-field limit and may be incomplete. Refusing to sync or reconcile until pagination support is added.");
    }
    return fields.nodes || [];
  }

  async function readProjectMultiSelectValues(project) {
    if (!project?.id) throw new Error("GitHub Project did not return an id for item-value retrieval.");
    const valuesByItemId = new Map();
    let after = null;
    do {
      const args = [
        "api",
        "graphql",
        "-f",
        `query=${PROJECT_ITEM_MULTISELECT_VALUES_QUERY}`,
        "-f",
        `projectId=${project.id}`,
      ];
      if (after) args.push("-f", `after=${after}`);
      const response = await ghJson(args, "GitHub Project multi-select item values");
      const items = response?.data?.node?.items;
      if (!items) throw new Error("GitHub Project item-value retrieval returned no Project items.");
      for (const item of items.nodes || []) valuesByItemId.set(item.id, item.fieldValues?.nodes || []);
      if (valuesByItemId.size >= PROJECT_ITEM_LIST_LIMIT && items.pageInfo?.hasNextPage) {
        throw new Error(`GitHub Project item-value retrieval reached the ${PROJECT_ITEM_LIST_LIMIT}-item limit and may be incomplete. Refusing to sync or reconcile until pagination support is added.`);
      }
      if (!items.pageInfo?.hasNextPage) break;
      after = items.pageInfo.endCursor;
      if (!after) throw new Error("GitHub Project item-value retrieval has another page but returned no cursor.");
    } while (after);
    return valuesByItemId;
  }

  function mergeProjectMultiSelectValues(items, valuesByItemId) {
    return items.map((item) => {
      const multiSelectValues = valuesByItemId.get(item.id);
      if (!multiSelectValues) throw new Error(`GitHub Project item-value retrieval omitted item ${item.id}. Refusing to sync or reconcile with an incomplete snapshot.`);
      const existingValues = item.fieldValues?.nodes || item.fieldValues || [];
      const preservedValues = existingValues.filter((value) => value?.field?.name !== PROJECT_REPOSITORIES_FIELD && value?.name !== PROJECT_REPOSITORIES_FIELD);
      return { ...item, fieldValues: { nodes: [...preservedValues, ...multiSelectValues] } };
    });
  }

  async function readProject(config, { repositories = [] } = {}) {
    const { owner, number } = parseProject(config);
    const project = await ghJson(["project", "view", number, "--owner", owner, "--format", "json"], "GitHub Project");
    const fields = await readProjectFields(project);
    const items = await ghJson(["project", "item-list", number, "--owner", owner, "--format", "json", "--limit", String(PROJECT_ITEM_LIST_LIMIT)], "GitHub Project items");
    if (Array.isArray(items.items) && items.items.length >= PROJECT_ITEM_LIST_LIMIT) {
      throw new Error(`GitHub Project item listing reached the ${PROJECT_ITEM_LIST_LIMIT}-item limit and may be incomplete. Refusing to sync or reconcile until the Project is below this limit or pagination support is added.`);
    }
    const projectItems = items.items || [];
    const multiSelectValues = await readProjectMultiSelectValues(project);
    project.fields = fields;
    project.items = mergeProjectMultiSelectValues(projectItems, multiSelectValues);
    projectFields(project, repositories);
    return project;
  }

  async function readViewProject(config, purpose) {
    const { owner, number } = parseProject(config);
    const project = await ghJson(["project", "view", number, "--owner", owner, "--format", "json"], "GitHub Project");
    if (!project?.id) throw new Error(`GitHub Project did not return an id for ${purpose}.`);
    return { id: project.id, title: project.title, url: project.url };
  }

  async function readProjectViewSnapshot(projectId, purpose) {
    const response = await ghJson(["api", "graphql", "-f", `query=${PROJECT_VIEW_QUERY}`, "-f", `projectId=${projectId}`], "GitHub Project view configuration");
    if (response?.errors?.length) throw new Error(response.errors.map((error) => error.message).join("; "));
    const snapshot = response?.data?.node;
    if (!snapshot) throw new Error(`GitHub Project ${purpose} returned no Project snapshot.`);
    if (snapshot.fields?.pageInfo?.hasNextPage) {
      throw new Error(`GitHub Project ${purpose} reached the 100-field limit and may be incomplete. Add pagination support before relying on its result.`);
    }
    if (snapshot.views?.pageInfo?.hasNextPage) {
      throw new Error(`GitHub Project ${purpose} reached the 50-view limit and may be incomplete. Add pagination support before relying on its result.`);
    }
    return snapshot;
  }

  async function projectViewAudit({ config, repositories = [] }) {
    const project = await readViewProject(config, "view auditing");
    const snapshot = await readProjectViewSnapshot(project.id, "view audit");
    return {
      project,
      ...auditProjectViewContract(snapshot, repositories.map((repository) => repository.label), config),
    };
  }

  async function updateProjectView(update) {
    const response = parseJson(await execute("gh", ["api", "graphql", "--input", "-"], {
      input: JSON.stringify({ query: UPDATE_PROJECT_VIEW_MUTATION, variables: { input: update.input } }),
    }), "GitHub Project view update");
    if (response?.errors?.length) throw new Error(response.errors.map((error) => error.message).join("; "));
    if (response?.data?.updateProjectV2View?.projectV2View?.id !== update.viewId) {
      throw new Error("GitHub did not confirm the view update.");
    }
  }

  // Explicit presentation repair writes supported view settings only: never tickets, items, fields, or views themselves.
  async function syncViews({ config, repositories = [], renames = [], publishingLock = null }) {
    await publishingPreflight({ config, execute, publishingLock });
    const project = await readViewProject(config, "view repair");
    const initial = await readProjectViewSnapshot(project.id, "view repair");
    const updates = planProjectViewRepair(initial, { renames, config });
    const applied = [];
    const failed = [];
    let notAttempted = [];
    for (const [index, update] of updates.entries()) {
      try {
        await updateProjectView(update);
        applied.push(update);
      } catch (error) {
        failed.push({ view: update.view, number: update.number, properties: update.properties, error: error.message });
        notAttempted = updates.slice(index + 1).map(({ view, number, properties }) => ({ view, number, properties }));
        break;
      }
    }
    let snapshot = initial;
    let verificationError = null;
    if (applied.length || failed.length) {
      try {
        snapshot = await readProjectViewSnapshot(project.id, "view repair verification");
      } catch (error) {
        snapshot = null;
        verificationError = error.message;
      }
    }
    return summarizeProjectViewRepair({
      project,
      updates,
      applied,
      failed,
      notAttempted,
      snapshot,
      verificationError,
      repositoryOptions: repositories.map((repository) => repository.label),
      config,
    });
  }

  // REST sets the full initial contract. GraphQL is a narrower fallback only
  // after an explicit HTTP 404 and a fresh read confirming no matching view.
  async function createViews({ config, selectedViews, repositories = [], publishingLock = null }) {
    validateViewSelection(selectedViews, config);
    await publishingPreflight({ config, execute, publishingLock });
    const project = await readViewProject(config, "view setup");
    let snapshot = await readProjectViewSnapshot(project.id, "view setup");
    const inspected = inspectSetupViews(snapshot, selectedViews, config);
    let route = null;
    let plans = [];
    if (inspected.missing.length) {
      const metadata = await ghJson(["api", "graphql", "-f", `query=${PROJECT_VIEW_SETUP_FIELDS_QUERY}`, "-f", `projectId=${project.id}`], "REST view field identifiers");
      if (metadata?.errors?.length) throw new Error(metadata.errors.map((error) => error.message).join("; "));
      const fields = metadata?.data?.node?.fields;
      if (!fields || fields.pageInfo?.hasNextPage) throw new Error("View setup field metadata is missing or incomplete; no view was created.");
      ({ plans } = planProjectViewCreation({ ...snapshot, fields }, selectedViews, config));
      const owner = await ghJson(["api", `users/${encodeURIComponent(parseProject(config).owner)}`], "Project owner metadata");
      route = projectViewsRestRoute(config, owner);
    }
    const created = [], verified = [], failed = [], unverified = [], fallbacks = [];
    const graphqlCreatedIds = new Set();
    const graphqlUiProperties = new Set(["sortBy", "groupBy", "verticalGroupBy"]);
    const existing = [...inspected.existing];
    let notAttempted = [];
    let verificationError = null;
    for (const [index, plan] of plans.entries()) {
      let response = null;
      let attempted = false;
      let method = "rest";
      let beforeIds;
      try {
        // Recheck names immediately before each POST to avoid duplicates after a
        // prior run or another writer. The local publishing lock is not global.
        try { snapshot = await readProjectViewSnapshot(project.id, "view setup pre-create check"); }
        catch (error) { verificationError = error.message; throw error; }
        const fresh = inspectSetupViews(snapshot, selectedViews, config);
        const appeared = fresh.existing.find((view) => view.name === plan.name);
        if (appeared) { existing.push(appeared); continue; }
        beforeIds = new Set((snapshot.views?.nodes || snapshot.views || []).map((view) => view.id));
        attempted = true;
        let result;
        try {
          result = await ghJson(["api", route, "--method", "POST", "-H", "Accept: application/vnd.github+json", "-H", "X-GitHub-Api-Version: 2026-03-10", "--input", "-"], "Created Project view", { input: JSON.stringify(plan.body) });
        } catch (restError) {
          // Do not fall back on timeouts, other HTTP errors or malformed success
          // responses: those may conceal a successful creation.
          if (!/\bHTTP 404\b/.test(restError.message)) throw restError;
          snapshot = await readProjectViewSnapshot(project.id, "REST 404 creation check");
          const afterRest = inspectSetupViews(snapshot, selectedViews, config);
          if (afterRest.existing.some((view) => view.name === plan.name)) throw restError;
          beforeIds = new Set((snapshot.views?.nodes || snapshot.views || []).map((view) => view.id));
          method = "graphql";
          fallbacks.push({ view: plan.name, from: "rest", to: "graphql", reason: restError.message });
          const graphql = await ghJson(["api", "graphql", "--input", "-"], "Created Project view through GraphQL", {
            input: JSON.stringify({
              query: "mutation CreateProjectViewFallback($input: CreateProjectV2ViewInput!) { createProjectV2View(input: $input) { projectV2View { id number name } } }",
              variables: { input: { projectId: project.id, name: plan.name, layout: plan.expected.layout, configuration: { visibleFieldIds: plan.expected.visibleFields } } },
            }),
          });
          if (graphql?.errors?.length) throw new Error(graphql.errors.map((error) => error.message).join("; "));
          const view = graphql?.data?.createProjectV2View?.projectV2View;
          result = { value: { node_id: view?.id, number: view?.number } };
        }
        response = result?.value;
        if (!response?.node_id || beforeIds.has(response.node_id) || !Number.isSafeInteger(response.number) || response.number <= 0) throw new Error(`${method} creation returned no confirmed view identity. Inspect saved state before retrying.`);
        created.push({ name: plan.name, id: response.node_id, number: response.number, url: response.html_url || null, method });
        if (method === "graphql") {
          graphqlCreatedIds.add(response.node_id);
          // Confirm the newly returned identity before updating it; never apply
          // fallback settings to a pre-existing or ambiguous name.
          snapshot = await readProjectViewSnapshot(project.id, "GraphQL created identity check");
          const saved = inspectSetupViews(snapshot, selectedViews, config).existing.find((view) => view.name === plan.name);
          if (saved?.id !== response.node_id || saved?.number !== response.number) throw new Error("GraphQL-created identity could not be confirmed before configuration.");
          const configured = await ghJson(["api", "graphql", "--input", "-"], "Configured GraphQL-created Project view", {
            input: JSON.stringify({
              query: "mutation ConfigureCreatedProjectView($input: UpdateProjectV2ViewInput!) { updateProjectV2View(input: $input) { projectV2View { id } } }",
              variables: { input: { viewId: response.node_id, filter: plan.expected.filter, configuration: { visibleFieldIds: plan.expected.visibleFields } } },
            }),
          });
          if (configured?.errors?.length) throw new Error(configured.errors.map((error) => error.message).join("; "));
          if (configured?.data?.updateProjectV2View?.projectV2View?.id !== response.node_id) throw new Error("GraphQL view configuration returned no confirmed identity; inspect saved state before repair.");
        }
      } catch (error) {
        failed.push({ view: plan.name, attempted, error: error.message });
      }
      if (attempted) {
        try {
          snapshot = await readProjectViewSnapshot(project.id, "created view verification");
          const matches = (snapshot.views?.nodes || snapshot.views || []).filter((view) => view.name === plan.name);
          const view = matches.length === 1 ? matches[0] : null;
          if (!view || beforeIds.has(view.id) || (response?.node_id && (view.id !== response.node_id || view.number !== response.number))) {
            unverified.push({ view: plan.name, reason: "Created identity is missing, ambiguous, or differs from the creation response." });
          } else {
            if (!created.some((item) => item.id === view.id)) created.push({ name: plan.name, id: view.id, number: view.number, observedAfterFailure: true, method });
            if (method === "graphql") graphqlCreatedIds.add(view.id);
            const drifts = createdViewDrifts(view, plan);
            const unsupported = method === "graphql" ? graphqlUiProperties : new Set();
            const apiDrifts = drifts.filter((drift) => !unsupported.has(drift.property));
            if (apiDrifts.length) unverified.push(...apiDrifts);
            else verified.push({ name: plan.name, id: view.id, number: view.number, method, properties: Object.keys(plan.expected).filter((property) => !drifts.some((drift) => drift.property === property)) });
          }
        } catch (error) {
          verificationError = error.message;
          unverified.push({ view: plan.name, reason: `Could not read saved state: ${error.message}` });
        }
      }
      if (failed.length || unverified.length) {
        notAttempted = plans.slice(index + 1).map((pending) => pending.name);
        break;
      }
    }
    const audit = verificationError ? null : auditProjectViewContract(snapshot, repositories.map((repository) => repository.label), config);
    return {
      mode: "create-views",
      outcome: failed.length || unverified.length ? "api-failure" : "view-setup-api-verified-browser-pending",
      project, created, verified, existing, failed, unverified, notAttempted, fallbacks,
      ...(verificationError ? { verificationError } : {}),
      audit,
      remainingGitHubUi: [
        ...(audit?.drifts || []).filter((drift) => drift.scope === "view" && graphqlUiProperties.has(drift.property) && created.some((view) => view.name === drift.name && graphqlCreatedIds.has(view.id))).map((drift) => ({ view: drift.name, property: drift.property, expected: drift.expected, actual: drift.actual, reason: "GraphQL creation/configuration cannot set sorting or grouping; configure this saved-view difference in the browser." })),
        ...validateViewSelection(selectedViews, config).filter((view) => [...created, ...existing].some((saved) => saved.name === view.name)).map((view) => ({ view: view.name, property: "sliceBy", expected: view.sliceBy, reason: "View creation APIs do not set slicing; verify/save the shared slice in the browser." })),
        { property: "order", expected: projectViewContract(config).map((view) => view.name), reason: "View creation APIs do not set tab positions; preserve extras and save the enabled views in relative order." },
      ],
      nextStep: "Inspect failed/unverified creations before rerunning; existing names are skipped after a fresh read. Use separate repair for existing-view drift. Save and verify remaining browser settings; no rendered-board verification was performed.",
    };
  }

  async function setupFields({ config, answeringOptionNames = {}, publishingLock = null }) {
    await publishingPreflight({ config, execute, publishingLock });
    const project = await readViewProject(config, "field setup");
    const fields = await readProjectFields(project);
    const updates = planFieldSetup(fields.nodes || fields, answeringOptionNames);
    const applied = [];
    for (const input of updates) {
      try {
        await ghJson(["api", "graphql", "--input", "-"], "Project field setup", {
          input: JSON.stringify({ query: "mutation($input: UpdateProjectV2FieldInput!) { updateProjectV2Field(input: $input) { projectV2Field { ... on ProjectV2SingleSelectField { id } } } }", variables: { input } }),
        });
        applied.push(input.fieldId);
      } catch (error) {
        throw new Error(`Field setup failed for ${input.fieldId}. Applied: ${applied.join(", ") || "none"}. Not attempted: ${updates.slice(applied.length + 1).map((update) => update.fieldId).join(", ") || "none"}. Reconcile saved schema before retrying. ${error.message}`);
      }
    }
    let saved;
    try { saved = await readProjectFields(project); }
    catch (error) { throw new Error(`Field setup unverified; applied fields: ${applied.join(", ") || "none"}. ${error.message}`); }
    const savedFields = saved.nodes || saved;
    for (const update of updates) {
      const field = savedFields.find((field) => field.id === update.fieldId);
      const actual = field?.options?.map(({ id, name, color, description }) => ({ id, name, color, description: description || "" }));
      if (JSON.stringify(actual) !== JSON.stringify(update.singleSelectOptions)) throw new Error(`Field setup unverified for ${update.fieldId}; applied fields: ${applied.join(", ")}. Inspect saved schema.`);
    }
    return { applied, verified: applied, presentation: "Browser settings not attempted; field creation and view setup remain separate." };
  }

  async function readComments(config, issue) {
    const comments = await ghPages(`repos/${config.repository}/issues/${issue.number}/comments?per_page=100`, "GitHub issue comments");
    return comments.map(normalizeComment);
  }

  async function checkTicketRootClean(config) {
    const status = await execute("git", ["status", "--porcelain=v1", "-z", "--untracked-files=all"]);
    const paths = sortedSet(parsePorcelain(status)
      .map((entry) => entry.path)
      .filter((filePath) => underTicketRoot(filePath, config.ticketRoot)));
    if (!paths.length) return { clean: true, paths: [], message: null };
    return {
      clean: false,
      paths,
      message: `ticketRoot is dirty:\n${paths.map((filePath) => `- ${filePath}`).join("\n")}\nCommit, stash, or move these canonical changes before requesting pending comments.`,
    };
  }

  async function applyFieldChanges(project, item, changes, repositories = []) {
    const fields = projectFields(project, repositories);
    for (const [name, expected] of changes) {
      const field = fields.get(name);
      if (!field) throw new Error(`GitHub Project is missing required ${name} field.`);
      const args = ["project", "item-edit", "--project-id", project.id, "--id", item.id, "--field-id", field.id];
      if (expected === null || (Array.isArray(expected) && !expected.length)) {
        args.push("--clear");
      } else if (name === PROJECT_REPOSITORIES_FIELD) {
        const optionIds = expected.map((value) => {
          const option = (field.options || field.multiSelectOptions || []).find((candidate) => candidate.name === value);
          if (!option) throw new Error(`GitHub Project ${name} is missing option ${value}.`);
          return option.id;
        });
        await execute("gh", [
          "api",
          "graphql",
          "--input",
          "-",
        ], {
          input: JSON.stringify({
            query: "mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionIds: [String!]!) { updateProjectV2ItemFieldValue(input: { projectId: $projectId, itemId: $itemId, fieldId: $fieldId, value: { multiSelectOptionIds: $optionIds } }) { projectV2Item { id } } }",
            variables: { projectId: project.id, itemId: item.id, fieldId: field.id, optionIds },
          }),
        });
        continue;
      } else if (["Status", "Board status", "Kind", "Complexity", "Repository Ticket Layer", "Answering group"].includes(name)) {
        const option = (field.options || []).find((candidate) => candidate.name === expected);
        if (!option) throw new Error(`GitHub Project ${name} is missing option ${expected}.`);
        args.push("--single-select-option-id", option.id);
      } else {
        args.push("--text", expected);
      }
      await execute("gh", args);
    }
  }

  async function applyProjectPlan(config, project, issue, plan, repositories = []) {
    let item = plan.projectItem;
    if (!item) {
      const { owner, number } = parseProject(config);
      item = await ghJson(["project", "item-add", number, "--owner", owner, "--url", issue.url, "--format", "json"], "GitHub Project item");
      if (!item?.id) throw new Error(`GitHub Project did not return membership for ${plan.progressLabel} after item-add.`);
    }
    await applyFieldChanges(project, item, plan.fieldChanges, repositories);
  }

  async function ensureDecisionRepositoryLabels(config) {
    const labels = await ghJson(["label", "list", "--repo", config.repository, "--limit", String(REPOSITORY_LABEL_LIST_LIMIT), "--json", "name,color,description"], "GitHub repository labels");
    if (Array.isArray(labels) && labels.length >= REPOSITORY_LABEL_LIST_LIMIT) {
      throw new Error(`GitHub repository label listing reached the ${REPOSITORY_LABEL_LIST_LIMIT}-label limit and may be incomplete. Refusing to sync until the repository is below this limit or pagination support is added.`);
    }
    for (const desired of [
      { name: TECHNICAL_DECISION_LABEL, color: TECHNICAL_DECISION_LABEL_COLOR, description: "Stable Software Design decision issue" },
      { name: OUT_OF_SCOPE_LABEL, color: OUT_OF_SCOPE_LABEL_COLOR, description: "Top-level Software Design item outside the target scope" },
    ]) {
      const existing = (labels || []).find((label) => label.name === desired.name);
      if (!existing) {
        await execute("gh", ["label", "create", desired.name, "--repo", config.repository, "--color", desired.color, "--description", desired.description]);
      } else if (String(existing.color || "").toLowerCase() !== desired.color || existing.description !== desired.description) {
        await execute("gh", ["label", "edit", desired.name, "--repo", config.repository, "--color", desired.color, "--description", desired.description]);
      }
    }
  }

  async function applyIssueLabelChanges(config, issue, changes) {
    if (!hasLabelChanges(changes)) return;
    const args = ["issue", "edit", String(issue.number), "--repo", config.repository];
    if (changes.add.length) args.push("--add-label", changes.add.join(","));
    if (changes.remove.length) args.push("--remove-label", changes.remove.join(","));
    await execute("gh", args);
  }

  async function ensureBuildUnitLabels(config, buildUnits, ensureWorkflowLabel) {
    if (!buildUnits.length && !ensureWorkflowLabel) return new Map();
    const labels = await ghJson(["label", "list", "--repo", config.repository, "--limit", String(REPOSITORY_LABEL_LIST_LIMIT), "--json", "name,color,description"], "GitHub repository labels");
    if (Array.isArray(labels) && labels.length >= REPOSITORY_LABEL_LIST_LIMIT) {
      throw new Error(`GitHub repository label listing reached the ${REPOSITORY_LABEL_LIST_LIMIT}-label limit and may be incomplete. Refusing to sync until the repository is below this limit or pagination support is added.`);
    }
    const managedById = new Map();
    for (const label of labels || []) {
      const id = buildUnitIdFromLabel(label.name);
      if (!id) continue;
      if (managedById.has(id)) throw new Error(`Duplicate GitHub Build Unit labels for ${id}: ${managedById.get(id).name}, ${label.name}. Clean them up manually before retrying.`);
      managedById.set(id, label);
    }
    const renamed = new Map();
    for (const record of buildUnits) {
      const existing = managedById.get(record.id);
      const description = `Software Design Build Unit ${record.id}`;
      if (!existing) {
        await execute("gh", ["label", "create", record.label, "--repo", config.repository, "--color", BUILD_UNIT_LABEL_COLOR, "--description", description]);
      } else if (existing.name !== record.label) {
        await execute("gh", ["label", "edit", existing.name, "--repo", config.repository, "--name", record.label, "--color", BUILD_UNIT_LABEL_COLOR, "--description", description]);
        renamed.set(existing.name, record.label);
      } else if (String(existing.color || "").toLowerCase() !== BUILD_UNIT_LABEL_COLOR || existing.description !== description) {
        await execute("gh", ["label", "edit", record.label, "--repo", config.repository, "--color", BUILD_UNIT_LABEL_COLOR, "--description", description]);
      }
    }
    if (ensureWorkflowLabel) {
      const existing = (labels || []).find((label) => label.name === PROJECT_WORKFLOW_LABEL);
      const description = "Active non-repository Software Design ticket";
      if (!existing) {
        await execute("gh", ["label", "create", PROJECT_WORKFLOW_LABEL, "--repo", config.repository, "--color", WORKFLOW_LABEL_COLOR, "--description", description]);
      } else if (String(existing.color || "").toLowerCase() !== WORKFLOW_LABEL_COLOR || existing.description !== description) {
        await execute("gh", ["label", "edit", PROJECT_WORKFLOW_LABEL, "--repo", config.repository, "--color", WORKFLOW_LABEL_COLOR, "--description", description]);
      }
    }
    return renamed;
  }

  async function upsertIssue(config, issue, record) {
    if (!issue) {
      const url = (await execute("gh", ["issue", "create", "--repo", config.repository, "--title", record.issueTitle, "--body", record.body])).trim();
      return { number: issueNumberFromUrl(url), url, title: record.issueTitle, body: record.body };
    }
    if (issue.title !== record.issueTitle || issue.body !== record.body) {
      await execute("gh", ["issue", "edit", String(issue.number), "--repo", config.repository, "--title", record.issueTitle, "--body", record.body]);
      return { ...issue, title: record.issueTitle, body: record.body };
    }
    return issue;
  }

  function ticketProjectionPlan(record, issue, project, labelsById, renamedLabels, repositoriesById) {
    const projectItem = issue ? itemForIssue(project, issue) : null;
    const labelChanges = ticketLabelChanges(issue, record, labelsById, renamedLabels);
    const fieldChanges = changedFieldEntries(projectItem, expectedTicketProjectValues(record, repositoriesById));
    const contentChange = !issue || issue.title !== record.issueTitle || issue.body !== record.body;
    return {
      id: record.id,
      progressLabel: record.id,
      record,
      issue,
      projectItem,
      labelChanges,
      fieldChanges,
      mutationCount: Number(contentChange) + Number(hasLabelChanges(labelChanges)) + Number(!projectItem) + fieldChanges.length,
    };
  }

  function decisionProjectionPlan(decision, issue, project) {
    const projectItem = issue ? itemForIssue(project, issue) : null;
    const labelChanges = decisionLabelChanges(issue, decision);
    const fieldChanges = changedFieldEntries(projectItem, expectedDecisionProjectValues(decision));
    const contentChange = !issue || issue.title !== decision.issueTitle || issue.body !== decision.body;
    const reopen = Boolean(issue && String(issue.state || "").toLowerCase() === "closed");
    return {
      id: decision.id,
      progressLabel: `Technical Decision ${decision.id}`,
      record: decision,
      issue,
      projectItem,
      labelChanges,
      fieldChanges,
      reopen,
      mutationCount: Number(contentChange) + Number(reopen) + Number(hasLabelChanges(labelChanges)) + Number(!projectItem) + fieldChanges.length,
    };
  }

  async function applyTicketPlan(config, project, plan, repositories) {
    const issue = await upsertIssue(config, plan.issue, plan.record);
    await applyIssueLabelChanges(config, issue, plan.labelChanges);
    await applyProjectPlan(config, project, issue, plan, repositories);
    return issue;
  }

  async function applyDecisionPlan(config, project, plan, repositories) {
    const issue = await upsertIssue(config, plan.issue, plan.record);
    if (plan.reopen) await execute("gh", ["issue", "reopen", String(issue.number), "--repo", config.repository]);
    await applyIssueLabelChanges(config, issue, plan.labelChanges);
    await applyProjectPlan(config, project, issue, plan, repositories);
    return issue;
  }

  function archivedBody(record) {
    return [issueIdentityMarker(record.id), `# ${record.id} — ${record.title || "Archived question"}`,
      "", `Archived: ${record.closed_reason}. Status at close: ${record.status_at_close}.`,
      `Replacements: ${(record.replaced_by || []).join(", ") || "None."}`,
      `Source: ${record.sourcePath}`, "", "Preserved canonical record:", "```json", JSON.stringify(record, null, 2), "```"].join("\n");
  }

  function archivedDrifts(record, issue, project) {
    if (!issue) return []; // Never create a remote issue solely for a retired record.
    const kinds = [];
    if (String(issue.state).toLowerCase() !== "closed") kinds.push("archived-issue-open");
    if (issue.body !== archivedBody(record)) kinds.push("archived-body");
    if (itemForIssue(project, issue)) kinds.push("archived-project-membership");
    return kinds;
  }

  async function retireProjectedRecords(config, archivedRecords, issues, project) {
    const matches = issuesByTicket(issues, archivedRecords);
    const completed = [];
    for (const record of archivedRecords) {
      const issue = matches.get(record.id)[0];
      if (!issue) continue;
      const drifts = archivedDrifts(record, issue, project);
      if (drifts.includes("archived-body") || drifts.includes("archived-issue-open")) {
        await execute("gh", ["api", `repos/${config.repository}/issues/${issue.number}`, "--method", "PATCH", "--input", "-"], {
          input: JSON.stringify({ body: archivedBody(record), state: "closed" }),
        });
      }
      const item = itemForIssue(project, issue);
      if (item) await execute("gh", ["project", "item-delete", "--id", item.id, "--project-id", project.id]);
      completed.push(record.id);
    }
    return completed;
  }

  async function sync({ config, records, decisions = [], buildUnits = [], repositories = [], archivedRecords = [], publishingLock = null }) {
    await publishingPreflight({ config, execute, publishingLock });
    const startedAt = syncStartedAt();
    emitProgress({ type: "sync-start", tickets: records.length, decisions: decisions.length, concurrency: SYNC_WRITE_CONCURRENCY }, startedAt);
    const issues = await readIssues(config);
    const matches = issuesByTicket(issues, records);
    const decisionMatches = issuesByDecision(issues, decisions);
    records = deriveTicketBoard(records);
    records = ticketsWithRelationshipLinks(records, matches, decisionMatches);
    const project = await readProject(config, { repositories });
    projectFields(project, repositories);
    const labelsById = buildUnitLabelsById(buildUnits);
    const renamedLabels = await ensureBuildUnitLabels(config, buildUnits, records.some((record) => record.status !== "out-of-scope" && !record.repositories?.length));
    const needsWorkflowLabels = decisions.length
      || records.some((record) => record.status === "out-of-scope" && record.parentDecision === null);
    if (needsWorkflowLabels) await ensureDecisionRepositoryLabels(config);
    const repositoriesById = new Map(repositories.map((repository) => [repository.id, repository]));
    const ticketPlans = records.map((record) => ticketProjectionPlan(
      record,
      matches.get(record.id)[0],
      project,
      labelsById,
      renamedLabels,
      repositoriesById,
    ));
    emitProgress({
      type: "sync-plan",
      phase: "tickets",
      total: ticketPlans.length,
      changed: ticketPlans.filter((plan) => plan.mutationCount > 0).length,
      mutations: ticketPlans.reduce((total, plan) => total + plan.mutationCount, 0),
    }, startedAt);
    let ticketProgress = 0;
    const ticketExecution = await runBoundedPlans(ticketPlans, async (plan) => {
      const issue = await applyTicketPlan(config, project, plan, repositories);
      ticketProgress += 1;
      emitProgress({ type: "sync-progress", phase: "tickets", id: plan.id, completed: ticketProgress, total: ticketPlans.length }, startedAt);
      return issue;
    });
    const completed = ticketPlans.filter((_, index) => ticketExecution.results[index]).map((plan) => plan.id);
    if (ticketExecution.failures.length) {
      const failed = ticketExecution.failures.map(({ index }) => ticketPlans[index].id);
      const notStarted = ticketPlans.filter((_, index) => !ticketExecution.results[index] && !ticketExecution.failures.some((failure) => failure.index === index)).map((plan) => plan.id);
      const details = ticketExecution.failures.map(({ index, error }) => `${ticketPlans[index].id}: ${error.message}`).join(" | ");
      throw new Error(`Projection failed for ${failed.join(", ")}. Completed: ${completed.join(", ") || "none"}. Not started: ${notStarted.join(", ") || "none"}. Rerun sync. ${details}`);
    }
    const projectedTicketIssues = new Map();
    for (const [index, plan] of ticketPlans.entries()) projectedTicketIssues.set(plan.id, ticketExecution.results[index]);
    const decisionPlans = decisions.map((rawDecision) => {
      const decision = decisionWithTicketLinks(rawDecision, projectedTicketIssues);
      return decisionProjectionPlan(decision, decisionMatches.get(decision.id)[0], project);
    });
    emitProgress({
      type: "sync-plan",
      phase: "decisions",
      total: decisionPlans.length,
      changed: decisionPlans.filter((plan) => plan.mutationCount > 0).length,
      mutations: decisionPlans.reduce((total, plan) => total + plan.mutationCount, 0),
    }, startedAt);
    let decisionProgress = 0;
    const decisionExecution = await runBoundedPlans(decisionPlans, async (plan) => {
      const issue = await applyDecisionPlan(config, project, plan, repositories);
      decisionProgress += 1;
      emitProgress({ type: "sync-progress", phase: "decisions", id: plan.id, completed: decisionProgress, total: decisionPlans.length }, startedAt);
      return issue;
    });
    const decisionCompleted = decisionPlans.filter((_, index) => decisionExecution.results[index]).map((plan) => plan.id);
    if (decisionExecution.failures.length) {
      const failed = decisionExecution.failures.map(({ index }) => decisionPlans[index].id);
      const notStarted = decisionPlans.filter((_, index) => !decisionExecution.results[index] && !decisionExecution.failures.some((failure) => failure.index === index)).map((plan) => plan.id);
      const details = decisionExecution.failures.map(({ index, error }) => `${decisionPlans[index].id}: ${error.message}`).join(" | ");
      throw new Error(`Projection failed for Technical Decision ${failed.join(", ")}. Completed tickets: ${completed.join(", ") || "none"}. Completed decisions: ${decisionCompleted.join(", ") || "none"}. Not started decisions: ${notStarted.join(", ") || "none"}. Rerun sync. ${details}`);
    }
    const archivedCompleted = await retireProjectedRecords(config, archivedRecords, issues, project);
    const result = { completed, buildUnitLabelsCompleted: [...labelsById.keys()], failed: [], ...decidedNotice(records) };
    if (archivedCompleted.length) result.archivedCompleted = archivedCompleted;
    if (repositories.length) result.repositoryFieldOptionsCompleted = repositories.map((repository) => repository.id);
    if (decisions.length) result.decisionCompleted = decisionCompleted;
    emitProgress({
      type: "sync-complete",
      tickets: completed.length,
      decisions: decisionCompleted.length,
      mutations: [...ticketPlans, ...decisionPlans].reduce((total, plan) => total + plan.mutationCount, 0),
    }, startedAt);
    return result;
  }

  async function reconcile({ config, records, decisions = [], buildUnits = [], repositories = [], archivedRecords = [] }) {
    const issues = await readIssues(config);
    const matches = issuesByTicket(issues, records);
    const decisionMatches = issuesByDecision(issues, decisions);
    records = deriveTicketBoard(records);
    records = ticketsWithRelationshipLinks(records, matches, decisionMatches);
    const project = await readProject(config, { repositories });
    projectFields(project, repositories);
    const labelsById = buildUnitLabelsById(buildUnits);
    const drifts = [];
    for (const record of records) {
      const issue = matches.get(record.id)[0];
      const kinds = [];
      if (!issue) {
        kinds.push("missing-issue");
      } else {
        if (issue.title !== record.issueTitle) kinds.push("title");
        if (issue.body !== record.body) kinds.push("body");
        const desiredLabels = (record.repositories?.length ? [] : record.buildUnits).map((id) => labelsById.get(id)).filter(Boolean).sort();
        const currentLabels = issueLabelNames(issue).filter((name) => buildUnitIdFromLabel(name)).sort();
        if (!samePaths(currentLabels, desiredLabels)) kinds.push("build-unit-labels");
        const currentRepositoryLabels = issueLabelNames(issue).filter((name) => repositoryIdFromLabel(name)).sort();
        if (currentRepositoryLabels.length) kinds.push("unexpected-repository-labels");
        const labels = issueLabelNames(issue);
        const expectedOutOfScopeLabel = record.status === "out-of-scope" && record.parentDecision === null;
        if (labels.includes(OUT_OF_SCOPE_LABEL) !== expectedOutOfScopeLabel) kinds.push("out-of-scope-label");
        if (labels.includes(TECHNICAL_DECISION_LABEL)) kinds.push("technical-decision-label");
        const item = itemForIssue(project, issue);
        if (!item) {
          kinds.push("missing-project-membership");
        } else {
          if (typeof item.title === "string" && item.title !== record.issueTitle) kinds.push("project-title");
          for (const [name, expected] of Object.entries(expectedTicketProjectValues(record, new Map(repositories.map((repository) => [repository.id, repository]))))) {
            if (!sameFieldValue(fieldValue(item, name), expected)) kinds.push(`project-${name}`);
          }
        }
      }
      if (kinds.length) drifts.push({ ticketId: record.id, kinds });
    }
    const archivedMatches = issuesByTicket(issues, archivedRecords);
    for (const record of archivedRecords) {
      const kinds = archivedDrifts(record, archivedMatches.get(record.id)[0], project);
      if (kinds.length) drifts.push({ ticketId: record.id, kinds });
    }
    const known = new Set([...records, ...archivedRecords].map((record) => record.id));
    const extras = issues.flatMap((issue) => markerIds(issue)).filter((ticketId) => !known.has(ticketId));
    const decisionDrifts = [];
    const projectedTicketIssues = new Map(records.map((record) => [record.id, matches.get(record.id)[0]]).filter(([, issue]) => issue));
    for (const rawDecision of decisions) {
      const decision = decisionWithTicketLinks(rawDecision, projectedTicketIssues);
      const issue = decisionMatches.get(decision.id)[0];
      const kinds = [];
      if (!issue) {
        kinds.push("missing-issue");
      } else {
        if (issue.title !== decision.issueTitle) kinds.push("title");
        if (issue.body !== decision.body) kinds.push("body");
        const labels = issueLabelNames(issue);
        if (!labels.includes(TECHNICAL_DECISION_LABEL)) kinds.push("technical-decision-label");
        const expectedOutOfScopeLabel = decision.decisionStatus === "Deferred For Later Design";
        if (labels.includes(OUT_OF_SCOPE_LABEL) !== expectedOutOfScopeLabel) kinds.push("out-of-scope-label");
        if (String(issue.state || "").toLowerCase() === "closed") kinds.push("closed-issue");
        const item = itemForIssue(project, issue);
        if (!item) {
          kinds.push("missing-project-membership");
        } else {
          if (typeof item.title === "string" && item.title !== decision.issueTitle) kinds.push("project-title");
          for (const [name, expected] of Object.entries(expectedDecisionProjectValues(decision))) {
            if (!sameFieldValue(fieldValue(item, name), expected)) kinds.push(`project-${name}`);
          }
        }
      }
      if (kinds.length) decisionDrifts.push({ decisionId: decision.id, kinds });
    }
    const knownDecisions = new Set(decisions.map((decision) => decision.id));
    const unknownDecisions = issues.flatMap((issue) => decisionMarkerIds(issue)).filter((decisionId) => !knownDecisions.has(decisionId));
    return {
      drifts,
      ...decidedNotice(records),
      unknownTicketIds: sortedSet(extras),
      fixed: false,
      decisionDrifts,
      unknownDecisionIds: sortedSet(unknownDecisions),
    };
  }

  async function pendingComments({ config, records }) {
    const preflight = await checkTicketRootClean(config);
    if (!preflight.clean) throw new Error(preflight.message);
    const login = (await ghJson(["api", "user"], "GitHub authenticated user")).login;
    if (!login) throw new Error("Could not determine the authenticated GitHub identity.");
    const matches = issuesByTicket(await readIssues(config), records);
    const issues = [];
    for (const record of records) {
      const issue = matches.get(record.id)[0];
      if (!issue) continue;
      const snapshot = await readComments(config, issue);
      const selected = selectPendingComments({ ticketId: record.id, issue, comments: snapshot, authenticatedLogin: login });
      issues.push({
        ticketId: record.id,
        issue: { number: issue.number, url: issue.url, title: issue.title },
        processedThroughCommentUrl: selected.processedThroughCommentUrl,
        pendingComments: selected.pending,
      });
    }
    return { issues };
  }

  async function existingBranchNames() {
    const local = await execute("git", ["branch", "--format=%(refname:short)"]);
    const remote = await execute("git", ["ls-remote", "--heads", "origin", "td/github-comments-*"]);
    const names = new Set(local.split("\n").map((line) => line.trim()).filter(Boolean));
    for (const line of remote.split("\n")) {
      const match = /refs\/heads\/(td\/github-comments-[^\s]+)$/.exec(line);
      if (match) names.add(match[1]);
    }
    return names;
  }

  async function workingPaths() {
    return sortedSet(parsePorcelain(await execute("git", ["status", "--porcelain=v1", "-z", "--untracked-files=all"])).map((entry) => entry.path));
  }

  async function mainDiffPaths() {
    return sortedSet((await execute("git", ["diff", "--name-only", "main...HEAD"])).split("\n").map((line) => normalizePath(line.trim())).filter(Boolean));
  }

  async function pushedHead(branch, localHead) {
    let remote = (await execute("git", ["ls-remote", "--heads", "origin", branch])).trim().split(/\s+/)[0] || "";
    if (remote !== localHead) {
      await execute("git", ["push", "-u", "origin", branch]);
      remote = (await execute("git", ["ls-remote", "--heads", "origin", branch])).trim().split(/\s+/)[0] || "";
    }
    if (remote !== localHead) throw new Error("Remote branch does not point at the current local HEAD.");
  }

  async function openPrs(config, branch) {
    const prs = await ghJson(["pr", "list", "--repo", config.repository, "--state", "open", "--head", branch, "--limit", "100", "--json", "number,url"], "open draft PRs");
    return Array.isArray(prs) ? prs : [];
  }

  async function prDetails(config, number) {
    return ghJson(["pr", "view", String(number), "--repo", config.repository, "--json", "url,isDraft,state,baseRefName,headRefName,headRefOid,files"], "draft PR");
  }

  async function verifyPr(config, pr, { branch, head, files }) {
    const details = pr.number ? await prDetails(config, pr.number) : pr;
    const prFiles = (details.files || []).map((file) => file.path).filter(Boolean);
    if (details.state !== "OPEN" || details.isDraft !== true || details.baseRefName !== "main" || details.headRefName !== branch || details.headRefOid !== head || !samePaths(prFiles, files)) {
      throw new Error("PR is not the verified open draft for the exact branch, pushed HEAD, and supplied file list.");
    }
    return details;
  }

  async function publishDraft({ config, files, title, bodyFile }) {
    let branch = (await execute("git", ["branch", "--show-current"])).trim();
    if (branch !== "main" && !/^td\/github-comments-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z(?:-\d+)?$/.test(branch)) {
      throw new Error("publish-draft may run only from main or a td/github-comments-* branch.");
    }
    const [working, mainDiff] = await Promise.all([workingPaths(), mainDiffPaths()]);
    const acceptedPaths = branch === "main" ? working : sortedSet([...working, ...mainDiff]);
    if (!samePaths(acceptedPaths, files)) throw new Error("The complete working-tree and main-diff path set must equal the supplied file list exactly.");
    if (branch === "main") {
      branch = branchName(now(), await existingBranchNames());
      await execute("git", ["switch", "-c", branch]);
    }
    await execute("git", ["add", "--", ...files]);
    const staged = (await execute("git", ["diff", "--cached", "--name-only"])).trim();
    if (staged) await execute("git", ["commit", "-m", title]);
    const head = (await execute("git", ["rev-parse", "HEAD"])).trim();
    await pushedHead(branch, head);
    let prs = await openPrs(config, branch);
    if (prs.length > 1) throw new Error(`Multiple open PRs exist for ${branch}.`);
    if (!prs.length) {
      await execute("gh", ["pr", "create", "--repo", config.repository, "--base", "main", "--head", branch, "--draft", "--title", title, "--body-file", bodyFile]);
      prs = await openPrs(config, branch);
    }
    if (prs.length !== 1) throw new Error(`Expected exactly one open draft PR for ${branch}.`);
    const verified = await verifyPr(config, prs[0], { branch, head, files });
    return { url: verified.url, verified: true, branch, head, files: [...files] };
  }

  async function verifySummaryPr(config, result) {
    const number = prNumberFromUrl(result.draftPrUrl);
    const details = await prDetails(config, number);
    if (details.url !== result.draftPrUrl || details.state !== "OPEN" || details.isDraft !== true || details.baseRefName !== "main" || !/^td\/github-comments-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z(?:-\d+)?$/.test(details.headRefName || "") || !samePaths((details.files || []).map((file) => file.path), result.canonicalFiles)) {
      throw new Error("Changed summaries require a verified open draft PR for the exact canonical files.");
    }
    const head = (await execute("git", ["rev-parse", "HEAD"])).trim();
    const remote = (await execute("git", ["ls-remote", "--heads", "origin", details.headRefName])).trim().split(/\s+/)[0] || "";
    if (details.headRefOid !== head || remote !== head) throw new Error("Changed summary draft PR does not point at the current pushed HEAD.");
  }

  async function postSummaries({ config, records, results }) {
    validateSummaryBatch(results);
    const login = (await ghJson(["api", "user"], "GitHub authenticated user")).login;
    if (!login) throw new Error("Could not determine the authenticated GitHub identity.");
    const recordById = new Map(records.map((record) => [record.id, record]));
    const matches = issuesByTicket(await readIssues(config), records);
    const posted = [];
    for (const result of results) {
      if (result.outcome === "changed" && result.canonicalFiles.some((file) => !underTicketRoot(file, config.ticketRoot))) {
        throw new Error(`Changed summary canonical files must stay under ${config.ticketRoot}.`);
      }
      const record = recordById.get(result.ticketId);
      const issue = matches.get(result.ticketId)?.[0];
      if (!record || !issue) throw new Error(`Cannot post a summary for unprojected ticket ${result.ticketId}.`);
      const comments = await readComments(config, issue);
      const selected = selectPendingComments({ ticketId: result.ticketId, issue, comments, authenticatedLogin: login });
      validatePendingPrefix({ pending: selected.pending, processedThroughCommentUrl: result.processedThroughCommentUrl, sourceCommentUrls: result.sourceCommentUrls });
      if (result.outcome === "changed") await verifySummaryPr(config, result);
      const markerCommentUrl = result.processedThroughCommentUrl ?? selected.processedThroughCommentUrl;
      const body = renderSummary(result, { markerCommentUrl });
      if (comments.some((comment) => comment.author?.login === login && comment.body === body)) {
        posted.push({ ticketId: result.ticketId, action: "already-posted" });
        continue;
      }
      if (result.outcome === "clarification" && result.applyNeedsClarificationLabel) {
        await execute("gh", ["issue", "edit", String(issue.number), "--repo", config.repository, "--add-label", "td:needs-clarification"]);
      }
      await execute("gh", ["issue", "comment", String(issue.number), "--repo", config.repository, "--body", body]);
      posted.push({ ticketId: result.ticketId, action: "posted" });
    }
    return { posted };
  }

  return {
    ensureAuthenticated,
    checkTicketRootClean,
    projectViewAudit,
    sync,
    syncViews,
    setupFields,
    createViews,
    reconcile,
    pendingComments,
    publishDraft,
    postSummaries,
  };
}
