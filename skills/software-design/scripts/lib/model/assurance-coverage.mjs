import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { buildLayout } from "./build-layout.mjs";
import { findBuildUnitRecords } from "./build-unit-records.mjs";
import { parseFrontmatter } from "./frontmatter.mjs";
import { findRepositoryBuildDesignRecords } from "./repository-build-design-records.mjs";
import { readSystemModel } from "./system-model-records.mjs";
import {
  collectStructuredVerificationObligations,
  verificationAssignmentRows,
  verificationAssignmentSection,
} from "./assurance-traceability.mjs";

const EVIDENCE_KINDS = new Set(["test", "static-analysis", "dynamic-analysis", "formal-proof", "inspection", "operational-exercise"]);
const BINDING_FIELDS = new Set([
  "id", "blueprint", "build_unit", "obligations", "kind", "method", "locator", "selector", "command",
  "expected_observation", "cases", "fixtures", "result_adapter",
]);
const EXCEPTION_FIELDS = new Set([
  "id", "blueprint", "build_units", "obligations", "bindings", "approval_ref", "owner", "approver", "reason", "residual_risk",
  "approved_at", "expires_at", "compensating_control",
]);

function object(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function text(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function concrete(value) {
  const normalized = String(value || "").trim();
  return text(value)
    && !/^(?:TBD\.?|None\.|<[^>]+>)$/i.test(normalized)
    && !/^(?:replace-|path-or-URI)/i.test(normalized);
}

function uniqueStrings(value) {
  return Array.isArray(value) && value.every(text) && new Set(value).size === value.length;
}

function assignmentKey(repositoryId, buildUnitId, obligationId) {
  return repositoryId + "|" + buildUnitId + "|" + obligationId;
}

export function parseAssuranceRepositoryMapping(value) {
  const match = /^(REPO-\d{3,})=(.+)$/.exec(String(value || ""));
  if (!match) throw new Error("Use --repository REPO-NNN=<implementation-repository-path>.");
  return [match[1], path.resolve(match[2])];
}

export function sha256Bytes(value) {
  return "sha256:" + crypto.createHash("sha256").update(value).digest("hex");
}

export function sha256File(filePath) {
  return sha256Bytes(fs.readFileSync(filePath));
}

function snapshotEntries(root, current = root) {
  return fs.readdirSync(current, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(current, entry.name);
    if (entry.isDirectory()) return snapshotEntries(root, target);
    if (entry.isFile()) return [{ relative: path.relative(root, target).split(path.sep).join("/"), content: fs.readFileSync(target) }];
    if (entry.isSymbolicLink()) return [{ relative: path.relative(root, target).split(path.sep).join("/"), content: Buffer.from("symlink:" + fs.readlinkSync(target)) }];
    return [];
  });
}

export function blueprintSnapshotDigest(rootPath) {
  const root = path.resolve(rootPath);
  const hash = crypto.createHash("sha256");
  for (const entry of snapshotEntries(root).sort((left, right) => left.relative.localeCompare(right.relative))) {
    hash.update(entry.relative);
    hash.update("\0");
    hash.update(String(entry.content.length));
    hash.update("\0");
    hash.update(entry.content);
    hash.update("\0");
  }
  return "sha256:" + hash.digest("hex");
}

export function parseCoverageManifest(filePath) {
  const source = fs.readFileSync(filePath, "utf8");
  try {
    return JSON.parse(source);
  } catch (error) {
    throw new Error(filePath + ": assurance/coverage.yaml must use JSON-compatible YAML: " + error.message);
  }
}

function rejectUnknownFields(value, allowed, label, errors) {
  if (!object(value)) return;
  for (const field of Object.keys(value)) if (!allowed.has(field)) errors.push(label + " contains unsupported field " + field + ".");
}

export function validateCoverageManifest(manifest, { filePath, blueprintId, repository, expectedAssignments, now = new Date() }) {
  const errors = [];
  const bindingsByAssignment = new Map();
  const exceptionsByAssignment = new Map();
  if (!object(manifest) || manifest.assurance_coverage_version !== 1) errors.push(filePath + ": assurance_coverage_version must be 1.");
  rejectUnknownFields(manifest, new Set(["assurance_coverage_version", "repository", "blueprints", "bindings", "exceptions"]), filePath, errors);
  if (manifest?.repository !== repository.id) errors.push(filePath + ": repository must be " + repository.id + ".");
  if (!Array.isArray(manifest?.blueprints) || !manifest.blueprints.length) errors.push(filePath + ": blueprints must be a non-empty array.");
  const blueprintIds = new Set();
  for (const blueprint of manifest?.blueprints || []) {
    rejectUnknownFields(blueprint, new Set(["id", "source"]), filePath + "/blueprint", errors);
    if (!object(blueprint) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(blueprint?.id || "") || !concrete(blueprint?.source)) {
      errors.push(filePath + ": every blueprint route requires a stable lowercase id and concrete source.");
      continue;
    }
    if (blueprintIds.has(blueprint.id)) errors.push(filePath + ": duplicate blueprint route " + blueprint.id + ".");
    blueprintIds.add(blueprint.id);
  }
  if (!blueprintIds.has(blueprintId)) errors.push(filePath + ": blueprints must include " + blueprintId + ".");
  if (!Array.isArray(manifest?.bindings)) errors.push(filePath + ": bindings must be an array.");
  if (!Array.isArray(manifest?.exceptions)) errors.push(filePath + ": exceptions must be an array.");

  const bindingIds = new Set();
  const bindings = new Map();
  for (const binding of manifest?.bindings || []) {
    const label = filePath + "/" + (binding?.id || "binding");
    if (!object(binding)) {
      errors.push(label + " must be an object.");
      continue;
    }
    rejectUnknownFields(binding, BINDING_FIELDS, label, errors);
    for (const field of ["id", "blueprint", "build_unit", "kind", "method", "locator", "command", "expected_observation", "result_adapter"]) {
      if (!concrete(binding[field])) errors.push(label + " requires concrete " + field + ".");
    }
    if (!/^EVID-\d{3,}$/.test(binding.id || "")) errors.push(label + " id must use EVID-NNN.");
    if (bindingIds.has(binding.id)) errors.push(filePath + ": duplicate binding " + binding.id + ".");
    bindingIds.add(binding.id);
    bindings.set(binding.id, binding);
    if (binding.blueprint !== blueprintId) errors.push(label + " blueprint must be " + blueprintId + ".");
    if (!repository.memberBuildUnits.includes(binding.build_unit)) errors.push(label + " build_unit is not a member of " + repository.id + ".");
    if (!uniqueStrings(binding.obligations) || !binding.obligations.length) errors.push(label + " obligations must be a unique non-empty array.");
    if (!EVIDENCE_KINDS.has(binding.kind)) errors.push(label + " kind is invalid.");
    if (!uniqueStrings(binding.cases) || !uniqueStrings(binding.fixtures)) errors.push(label + " cases and fixtures must be unique arrays of non-empty identifiers.");
    if (binding.kind === "test" && !concrete(binding.selector)) errors.push(label + " test binding requires an exact selector.");
    for (const obligationId of Array.isArray(binding.obligations) ? binding.obligations : []) {
      const key = assignmentKey(repository.id, binding.build_unit, obligationId);
      if (!expectedAssignments.has(key)) errors.push(label + " maps " + obligationId + " without a matching Build Unit assignment.");
      if (!bindingsByAssignment.has(key)) bindingsByAssignment.set(key, []);
      bindingsByAssignment.get(key).push(binding);
    }
  }

  const exceptionIds = new Set();
  const instant = now instanceof Date ? now.getTime() : Date.parse(now);
  for (const exception of manifest?.exceptions || []) {
    const label = filePath + "/" + (exception?.id || "exception");
    if (!object(exception)) {
      errors.push(label + " must be an object.");
      continue;
    }
    rejectUnknownFields(exception, EXCEPTION_FIELDS, label, errors);
    for (const field of ["id", "blueprint", "approval_ref", "owner", "approver", "reason", "residual_risk", "approved_at", "expires_at", "compensating_control"]) {
      if (!concrete(exception[field])) errors.push(label + " requires concrete " + field + ".");
    }
    if (!/^EXC-\d{3,}$/.test(exception.id || "")) errors.push(label + " id must use EXC-NNN.");
    if (exceptionIds.has(exception.id)) errors.push(filePath + ": duplicate exception " + exception.id + ".");
    exceptionIds.add(exception.id);
    if (exception.blueprint !== blueprintId) errors.push(label + " blueprint must be " + blueprintId + ".");
    if (!uniqueStrings(exception.obligations) || !exception.obligations.length) errors.push(label + " obligations must be a unique non-empty array.");
    if (!uniqueStrings(exception.build_units) || !exception.build_units.length) errors.push(label + " build_units must be a unique non-empty array.");
    if (!uniqueStrings(exception.bindings)) errors.push(label + " bindings must be a unique array.");
    for (const bindingId of Array.isArray(exception.bindings) ? exception.bindings : []) {
      const binding = bindings.get(bindingId);
      if (!binding) errors.push(label + " names unknown binding " + bindingId + ".");
      else if (!exception.build_units?.includes(binding.build_unit)) errors.push(label + " binding " + bindingId + " is outside the exception build_units scope.");
    }
    const approvedAt = Date.parse(exception.approved_at || "");
    const expiresAt = Date.parse(exception.expires_at || "");
    if (!Number.isFinite(approvedAt) || !Number.isFinite(expiresAt)) errors.push(label + " approved_at and expires_at must be ISO date/times.");
    if (Number.isFinite(approvedAt) && Number.isFinite(instant) && approvedAt > instant) errors.push(label + " approval is not yet effective.");
    if (Number.isFinite(expiresAt) && Number.isFinite(instant) && expiresAt <= instant) errors.push(label + " is expired.");
    for (const buildUnitId of Array.isArray(exception.build_units) ? exception.build_units : []) {
      if (!repository.memberBuildUnits.includes(buildUnitId)) errors.push(label + " build unit " + buildUnitId + " is not a member of " + repository.id + ".");
      for (const obligationId of Array.isArray(exception.obligations) ? exception.obligations : []) {
        const key = assignmentKey(repository.id, buildUnitId, obligationId);
        if (!expectedAssignments.has(key)) errors.push(label + " names " + buildUnitId + "/" + obligationId + " without a matching assignment.");
        else {
          if (!exceptionsByAssignment.has(key)) exceptionsByAssignment.set(key, []);
          exceptionsByAssignment.get(key).push(exception);
        }
      }
    }
  }

  return { errors, bindingsByAssignment, exceptionsByAssignment, bindings };
}

function readBuildUnits(root) {
  return new Map(findBuildUnitRecords(buildLayout(root).unitsRoot).map((record) => {
    const meta = parseFrontmatter(record.content, record.filePath);
    return [meta.id, {
      id: meta.id,
      name: meta.name,
      repository: String(meta.repository || "").trim(),
      filePath: record.filePath,
      content: record.content,
    }];
  }));
}

export function loadAssuranceContext({ root: rootPath, repositoryRoots = new Map(), now = new Date() }) {
  const root = path.resolve(rootPath);
  const errors = [];
  const gaps = [];
  const model = readSystemModel(root);
  const blueprintId = String(model.architecture?.frontmatter?.assurance_id || "").trim();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(blueprintId)) errors.push("system-model/architecture.md assurance_id must be a stable lowercase slug.");
  const obligations = collectStructuredVerificationObligations(model, errors);
  const buildUnits = readBuildUnits(root);
  const repositories = new Map(findRepositoryBuildDesignRecords(buildLayout(root).repositoriesRoot).map((record) => [record.id, record]));
  const expectedAssignments = new Map();
  const assignedObligations = new Set();

  for (const unit of buildUnits.values()) {
    const rows = verificationAssignmentRows(unit.content);
    if (verificationAssignmentSection(unit.content) === null) continue;
    for (const row of rows || []) {
      if (row.invalidTable || !row.obligationId) continue;
      const obligation = obligations.get(row.obligationId);
      if (!obligation) {
        errors.push(unit.id + " assigns unknown Verification Obligation " + row.obligationId + ".");
        continue;
      }
      assignedObligations.add(row.obligationId);
      let repositoryId = unit.repository;
      if (!repositoryId || repositoryId === "None.") repositoryId = "EXTERNAL";
      else if (!repositories.has(repositoryId)) errors.push(unit.id + " names missing Repository Build Design " + repositoryId + ".");
      const key = assignmentKey(repositoryId, unit.id, row.obligationId);
      if (expectedAssignments.has(key)) errors.push(unit.id + " contains duplicate assignment " + row.obligationId + ".");
      expectedAssignments.set(key, {
        key,
        repositoryId,
        buildUnitId: unit.id,
        obligationId: row.obligationId,
        responsibility: row.responsibility,
        requiredEvidence: row.requiredEvidence,
        obligation,
        unit,
        repository: repositories.get(repositoryId) || null,
      });
    }
  }
  for (const [obligationId, obligation] of obligations) {
    if (assignedObligations.has(obligationId)) continue;
    const key = assignmentKey("UNASSIGNED", "UNASSIGNED", obligationId);
    expectedAssignments.set(key, {
      key,
      repositoryId: "UNASSIGNED",
      buildUnitId: "UNASSIGNED",
      obligationId,
      responsibility: "Unassigned",
      requiredEvidence: obligation.evidenceExpectation,
      obligation,
      unit: null,
      repository: null,
    });
    gaps.push(obligationId + " is unassigned across the Build Design.");
  }

  const expectedRepositoryIds = new Set([...expectedAssignments.values()]
    .map((assignment) => assignment.repositoryId)
    .filter((id) => /^REPO-\d{3,}$/.test(id)));
  for (const id of expectedRepositoryIds) if (!repositoryRoots.has(id)) errors.push("Missing --repository " + id + "=<implementation-repository-path>.");
  for (const id of repositoryRoots.keys()) if (!expectedRepositoryIds.has(id)) errors.push("Repository mapping " + id + " has no first-party VO assignment in this blueprint.");

  const manifests = new Map();
  for (const repositoryId of expectedRepositoryIds) {
    if (!repositoryRoots.has(repositoryId)) continue;
    const repository = repositories.get(repositoryId);
    if (!repository) continue;
    const repositoryRoot = path.resolve(repositoryRoots.get(repositoryId));
    const manifestPath = path.join(repositoryRoot, "assurance", "coverage.yaml");
    if (!fs.existsSync(manifestPath)) {
      manifests.set(repositoryId, { repository, repositoryRoot, manifestPath, digest: "missing", value: null, bindingsByAssignment: new Map(), exceptionsByAssignment: new Map() });
      gaps.push(repositoryId + " is missing tracked assurance/coverage.yaml.");
      continue;
    }
    let value;
    try {
      value = parseCoverageManifest(manifestPath);
    } catch (error) {
      errors.push(error.message);
      continue;
    }
    const validation = validateCoverageManifest(value, { filePath: manifestPath, blueprintId, repository, expectedAssignments, now });
    errors.push(...validation.errors);
    const manifest = { repository, repositoryRoot, manifestPath, digest: sha256File(manifestPath), value, ...validation };
    manifests.set(repositoryId, manifest);
    for (const assignment of expectedAssignments.values()) {
      if (assignment.repositoryId !== repositoryId) continue;
      const bindings = validation.bindingsByAssignment.get(assignment.key) || [];
      const exceptions = validation.exceptionsByAssignment.get(assignment.key) || [];
      if (!bindings.length && !exceptions.length) gaps.push(repositoryId + "/" + assignment.buildUnitId + "/" + assignment.obligationId + " has no evidence binding or current approved exception.");
    }
  }

  return {
    root,
    blueprintId,
    snapshotDigest: blueprintSnapshotDigest(root),
    obligations,
    buildUnits,
    repositories,
    expectedAssignments,
    manifests,
    errors,
    gaps,
  };
}

export function assuranceAssignmentKey(repositoryId, buildUnitId, obligationId) {
  return assignmentKey(repositoryId, buildUnitId, obligationId);
}
