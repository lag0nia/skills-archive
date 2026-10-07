#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import {
  assuranceAssignmentKey,
  loadAssuranceContext,
  parseAssuranceRepositoryMapping,
} from "./lib/model/assurance-coverage.mjs";
import { ASSURANCE_STATUS_VALUES } from "./lib/model/assurance-traceability.mjs";
import { isEntryPoint } from "./lib/entry-point.mjs";

const GAP_ORDER = ["unassigned", "unmapped", "missing", "ambiguous", "not-run", "skipped", "failed", "stale", "approved-exception", "passed"];
const EVIDENCE_KINDS = new Set(["test", "static-analysis", "dynamic-analysis", "formal-proof", "inspection", "operational-exercise"]);

function parseArgs(argv) {
  const args = { input: null, output: null, root: null, repositoryRoots: new Map() };
  for (let index = 2; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--input") args.input = argv[++index];
    else if (value === "--output") args.output = argv[++index];
    else if (value === "--root") args.root = argv[++index];
    else if (value === "--repository") {
      const [id, repositoryRoot] = parseAssuranceRepositoryMapping(argv[++index]);
      if (args.repositoryRoots.has(id)) throw new Error("Duplicate --repository mapping for " + id + ".");
      args.repositoryRoots.set(id, repositoryRoot);
    }
    else throw new Error("Unknown argument: " + value);
  }
  if (!args.input || !args.output || !args.root) {
    throw new Error("Use --root <software-design-package> [--repository REPO-NNN=<implementation-repository-path> ...] --input <assurance-result.json> --output <assurance-report.html>.");
  }
  return { ...args, root: path.resolve(args.root), input: path.resolve(args.input), output: path.resolve(args.output) };
}

function object(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function text(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function concreteText(value) {
  return text(value) && !/^(?:TBD\.?|None\.|replace-|<[^>]+>)$/i.test(value.trim());
}

function finiteNonnegative(value) {
  return Number.isInteger(value) && value >= 0;
}

function validateException(exception, generatedAt, label, errors) {
  if (!object(exception)) {
    errors.push(label + " approved-exception requires an exception object.");
    return;
  }
  for (const name of ["id", "approval_ref", "owner", "approver", "reason", "residual_risk", "approved_at", "expires_at", "compensating_control"]) {
    if (!text(exception[name])) errors.push(label + " exception requires " + name + ".");
  }
  const approvedAt = Date.parse(exception.approved_at || "");
  const expiresAt = Date.parse(exception.expires_at || "");
  if (!Number.isFinite(approvedAt)) errors.push(label + " exception approved_at must be an ISO date/time.");
  if (!Number.isFinite(expiresAt)) errors.push(label + " exception expires_at must be an ISO date/time.");
  if (Number.isFinite(expiresAt) && Number.isFinite(generatedAt) && expiresAt <= generatedAt) errors.push(label + " exception is expired for this report run.");
  if (Number.isFinite(approvedAt) && Number.isFinite(generatedAt) && approvedAt > generatedAt) errors.push(label + " exception approval occurs after this report run.");
}

function validateEvidence(evidence, label, errors) {
  if (!object(evidence)) {
    errors.push(label + " evidence item must be an object.");
    return;
  }
  for (const name of ["binding_id", "kind", "method", "locator", "status", "observation"]) {
    if (!text(evidence[name])) errors.push(label + " evidence requires " + name + ".");
  }
  if (!EVIDENCE_KINDS.has(evidence.kind)) errors.push(label + " evidence kind is invalid.");
  if (!ASSURANCE_STATUS_VALUES.has(evidence.status)) errors.push(label + " evidence status is invalid.");
  if (evidence.kind === "test") {
    if (!text(evidence.selector)) errors.push(label + " test evidence requires an exact selector.");
    if (!Array.isArray(evidence.case_ids) || evidence.case_ids.some((item) => !text(item)) || new Set(evidence.case_ids).size !== evidence.case_ids.length) {
      errors.push(label + " test evidence requires a unique case_ids array.");
    }
    for (const name of ["selector_count", "discovered_cases", "executed_cases", "passing_cases", "failing_cases", "skipped_cases"]) {
      if (!finiteNonnegative(evidence[name])) errors.push(label + " test evidence requires nonnegative integer " + name + ".");
    }
    if (evidence.selector_count === 0 && evidence.status === "passed") errors.push(label + " cannot pass when its selector matched zero items.");
    if (evidence.discovered_cases !== evidence.executed_cases + evidence.skipped_cases) errors.push(label + " discovered cases must equal executed plus skipped cases.");
    if (evidence.executed_cases !== evidence.passing_cases + evidence.failing_cases) errors.push(label + " executed cases must equal passing plus failing cases.");
    if (evidence.status === "passed" && (evidence.failing_cases > 0 || evidence.skipped_cases > 0 || evidence.executed_cases === 0)) {
      errors.push(label + " cannot pass with failing, skipped, or zero executed cases.");
    }
    if (evidence.status === "passed" && evidence.discovered_cases < (evidence.case_ids?.length || 0)) errors.push(label + " cannot pass when declared cases were not all discovered.");
  }
  if (["inspection", "operational-exercise"].includes(evidence.kind)) {
    if (!text(evidence.actor)) errors.push(label + " " + evidence.kind + " evidence requires actor.");
    if (!Number.isFinite(Date.parse(evidence.completed_at || ""))) errors.push(label + " " + evidence.kind + " evidence requires completed_at ISO date/time.");
  }
  if (evidence.fixtures !== undefined && (!Array.isArray(evidence.fixtures) || evidence.fixtures.some((item) => !text(item)))) {
    errors.push(label + " fixtures must be an array of non-empty identifiers.");
  }
}

export function validateAssuranceResult(result, context = null) {
  const errors = [];
  if (!object(result) || result.assurance_result_version !== 1) errors.push("assurance_result_version must be 1.");
  if (!object(result?.blueprint)) errors.push("blueprint must be an object.");
  else for (const name of ["id", "name", "snapshot_id", "revision"]) if (!concreteText(result.blueprint[name])) errors.push("blueprint requires concrete " + name + ".");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(result?.blueprint?.id || "")) errors.push("blueprint id must be a stable lowercase slug.");
  if (!/^sha256:[a-f0-9]{64}$/.test(result?.blueprint?.snapshot_id || "")) errors.push("blueprint snapshot_id must be an exact sha256 digest.");
  const generatedAt = Date.parse(result?.generated_at || "");
  if (!Number.isFinite(generatedAt)) errors.push("generated_at must be an ISO date/time.");
  const startedAt = Date.parse(result?.run?.started_at || "");
  const completedAt = Date.parse(result?.run?.completed_at || "");
  if (!object(result?.run) || !Number.isFinite(startedAt) || !Number.isFinite(completedAt)) errors.push("run must contain started_at and completed_at ISO date/times.");
  else if (startedAt > completedAt) errors.push("run started_at must not be after completed_at.");
  if (Number.isFinite(generatedAt) && Number.isFinite(completedAt) && generatedAt < completedAt) errors.push("generated_at must not be before run completed_at.");
  if (!Array.isArray(result?.repositories) || !result.repositories.length) errors.push("repositories must be a non-empty array.");
  if (!Array.isArray(result?.tools) || !result.tools.length || result.tools.some((tool) => !object(tool) || !text(tool.name) || !text(tool.version))) {
    errors.push("tools must be a non-empty list with name and version for every material adapter.");
  }

  const canonicalObligations = new Map();
  const repositoryIds = new Set();
  for (const repository of result?.repositories || []) {
    const repositoryLabel = text(repository?.id) ? repository.id : "repository";
    for (const name of ["id", "name", "revision", "manifest_digest"]) if (!text(repository?.[name])) errors.push(repositoryLabel + " requires " + name + ".");
    const unassignedRepository = repository?.id === "UNASSIGNED";
    const externalRepository = repository?.id === "EXTERNAL";
    if (!unassignedRepository && !externalRepository && !/^REPO-\d{3,}$/.test(repository?.id || "")) errors.push(repositoryLabel + " has an invalid repository id.");
    if (repositoryIds.has(repository?.id)) errors.push("duplicate repository " + repository?.id + ".");
    repositoryIds.add(repository?.id);
    if (!unassignedRepository && !concreteText(repository?.revision)) errors.push(repositoryLabel + " requires an exact revision.");
    if (!unassignedRepository && !externalRepository && !/^(?:sha256:[a-f0-9]{64}|missing)$/.test(repository?.manifest_digest || "")) errors.push(repositoryLabel + " manifest_digest must be an exact sha256 digest or missing.");
    if ((unassignedRepository || externalRepository) && repository?.manifest_digest !== "not-applicable") errors.push(repositoryLabel + " manifest_digest must be not-applicable.");
    if (!Array.isArray(repository?.build_units) || !repository.build_units.length) errors.push(repositoryLabel + " build_units must be a non-empty array.");
    const buildUnitIds = new Set();
    for (const unit of repository?.build_units || []) {
      const unitLabel = repositoryLabel + "/" + (unit?.id || "build-unit");
      const unassignedUnit = unit?.id === "UNASSIGNED";
      if ((!unassignedUnit && !/^BU-\d{3,}$/.test(unit?.id || "")) || !text(unit?.name)) errors.push(unitLabel + " requires a valid id and name.");
      if (unassignedRepository !== unassignedUnit) errors.push(unitLabel + " UNASSIGNED repository and Build Unit identities must be used together.");
      if (externalRepository && unassignedUnit) errors.push(unitLabel + " EXTERNAL cannot use the UNASSIGNED Build Unit identity.");
      if (buildUnitIds.has(unit?.id)) errors.push(repositoryLabel + " contains duplicate Build Unit " + unit?.id + ".");
      buildUnitIds.add(unit?.id);
      if (!Array.isArray(unit?.records) || !unit.records.length) errors.push(unitLabel + " records must be a non-empty array.");
      const unitObligations = new Set();
      const recordIds = new Set();
      for (const record of unit?.records || []) {
        const recordLabel = unitLabel + "/" + (record?.id || "record");
        if (!/^(?:INV|SEC)-\d{3,}$/.test(record?.id || "") || !text(record?.name) || !["invariant", "security"].includes(record?.kind)) {
          errors.push(recordLabel + " requires a valid id, name, and kind.");
        }
        if (recordIds.has(record?.id)) errors.push(unitLabel + " contains duplicate record " + record?.id + ".");
        recordIds.add(record?.id);
        if (!Array.isArray(record?.obligations) || !record.obligations.length) errors.push(recordLabel + " obligations must be a non-empty array.");
        for (const obligation of record?.obligations || []) {
          const obligationLabel = recordLabel + "/" + (obligation?.id || "obligation");
          if (!new RegExp("^" + String(record?.id || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\.VO-\\d{3}$").test(obligation?.id || "")) {
            errors.push(obligationLabel + " must use its owning record prefix.");
          }
          if (unitObligations.has(obligation?.id)) errors.push(unitLabel + " contains duplicate obligation " + obligation.id + ".");
          unitObligations.add(obligation?.id);
          for (const name of ["title", "claim", "required_observation", "risk", "status"]) if (!text(obligation?.[name])) errors.push(obligationLabel + " requires " + name + ".");
          if (!["ordinary", "high"].includes(obligation?.risk)) errors.push(obligationLabel + " risk must be ordinary or high.");
          if (!ASSURANCE_STATUS_VALUES.has(obligation?.status)) errors.push(obligationLabel + " status is invalid.");
          if (!Array.isArray(obligation?.covers) || obligation.covers.some((item) => !text(item))) errors.push(obligationLabel + " covers must be an array of IDs.");
          if (!Array.isArray(obligation?.evidence)) errors.push(obligationLabel + " evidence must be an array.");
          if (unassignedRepository && obligation?.status !== "unassigned") errors.push(obligationLabel + " under UNASSIGNED must use unassigned status.");
          if (!unassignedRepository && obligation?.status === "unassigned") errors.push(obligationLabel + " unassigned status must use the UNASSIGNED repository and Build Unit group.");
          const canonicalShape = JSON.stringify({
            title: obligation?.title,
            claim: obligation?.claim,
            required_observation: obligation?.required_observation,
            risk: obligation?.risk,
            covers: obligation?.covers,
          });
          if (canonicalObligations.has(obligation?.id) && canonicalObligations.get(obligation.id) !== canonicalShape) {
            errors.push(obligationLabel + " disagrees with another assignment of the same canonical VO.");
          } else canonicalObligations.set(obligation?.id, canonicalShape);
          const evidenceIds = new Set();
          for (const evidence of obligation?.evidence || []) {
            validateEvidence(evidence, obligationLabel + "/" + (evidence?.binding_id || "evidence"), errors);
            if (evidenceIds.has(evidence?.binding_id)) errors.push(obligationLabel + " contains duplicate evidence binding " + evidence?.binding_id + ".");
            evidenceIds.add(evidence?.binding_id);
          }
          if (obligation?.status === "passed") {
            if (!obligation.evidence?.length) errors.push(obligationLabel + " cannot pass without evidence.");
            if (obligation.evidence?.some((item) => item.status !== "passed")) errors.push(obligationLabel + " cannot pass while a required evidence item is not passed.");
            if (obligation.exception !== null && obligation.exception !== undefined) errors.push(obligationLabel + " passed status cannot also carry an exception.");
          } else if (obligation?.status === "approved-exception") {
            validateException(obligation.exception, generatedAt, obligationLabel, errors);
          }
        }
      }
    }
  }
  if (context) errors.push(...reconcileAssuranceResult(result, context));
  return errors;
}

function sameValues(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function reconcileAssuranceResult(result, context) {
  const errors = [];
  if (context.errors.length) errors.push(...context.errors);
  if (result?.blueprint?.id !== context.blueprintId) errors.push("result blueprint id does not match system-model/architecture.md assurance_id.");
  if (result?.blueprint?.snapshot_id !== context.snapshotDigest) errors.push("result blueprint snapshot_id does not match the current Software Design package digest.");
  const actual = new Map();
  const resultRepositories = new Map((result?.repositories || []).map((repository) => [repository.id, repository]));
  for (const repository of result?.repositories || []) {
    const manifest = context.manifests.get(repository.id);
    if (manifest && repository.manifest_digest !== manifest.digest) errors.push(repository.id + " manifest_digest does not match the current assurance/coverage.yaml.");
    for (const unit of repository.build_units || []) {
      for (const record of unit.records || []) {
        for (const obligation of record.obligations || []) {
          const key = assuranceAssignmentKey(repository.id, unit.id, obligation.id);
          if (actual.has(key)) errors.push("duplicate assurance assignment " + key + ".");
          actual.set(key, { repository, unit, record, obligation });
        }
      }
    }
  }
  for (const key of actual.keys()) if (!context.expectedAssignments.has(key)) errors.push("normalized result includes unexpected assignment " + key + ".");
  for (const [key, expected] of context.expectedAssignments) {
    const found = actual.get(key);
    if (!found) {
      errors.push("normalized result omits expected assignment " + key + ".");
      continue;
    }
    const { repository, unit, record, obligation } = found;
    if (expected.repository && repository.name !== expected.repository.name) errors.push(key + " repository name disagrees with the canonical Repository Build Design.");
    if (expected.unit && unit.name !== expected.unit.name) errors.push(key + " Build Unit name disagrees with the canonical Build Unit.");
    if (record.id !== expected.obligation.recordId
      || record.name !== expected.obligation.record.frontmatter.name
      || record.kind !== expected.obligation.kind) errors.push(key + " record identity disagrees with the canonical System Model record.");
    const canonicalShape = {
      title: expected.obligation.title,
      claim: expected.obligation.claim,
      required_observation: expected.obligation.requiredObservation,
      risk: expected.obligation.risk,
      covers: expected.obligation.covers,
    };
    const actualShape = {
      title: obligation.title,
      claim: obligation.claim,
      required_observation: obligation.required_observation,
      risk: obligation.risk,
      covers: obligation.covers,
    };
    if (!sameValues(actualShape, canonicalShape)) errors.push(key + " canonical claim fields disagree with the current Verification Obligation.");
    if (expected.repositoryId === "UNASSIGNED") {
      if (obligation.status !== "unassigned" || obligation.evidence?.length) errors.push(key + " must report unassigned with no evidence.");
      continue;
    }
    if (expected.repositoryId === "EXTERNAL") continue;
    const manifest = context.manifests.get(expected.repositoryId);
    if (!manifest || manifest.digest === "missing") {
      if (repository.manifest_digest !== "missing" || obligation.status !== "missing" || obligation.evidence?.length) {
        errors.push(key + " must report missing with no evidence while assurance/coverage.yaml is absent.");
      }
      continue;
    }
    const bindings = manifest.bindingsByAssignment.get(key) || [];
    const exceptions = manifest.exceptionsByAssignment.get(key) || [];
    if (obligation.status === "approved-exception") {
      if (!exceptions.some((exception) => exception.id === obligation.exception?.id)) errors.push(key + " approved exception is not current in assurance/coverage.yaml.");
      continue;
    }
    if (!bindings.length && !exceptions.length) {
      if (obligation.status !== "unmapped" || obligation.evidence?.length) errors.push(key + " must report unmapped with no evidence while no binding exists.");
      continue;
    }
    const expectedBindingIds = bindings.map((binding) => binding.id).sort();
    const actualBindingIds = (obligation.evidence || []).map((evidence) => evidence.binding_id).sort();
    if (!sameValues(actualBindingIds, expectedBindingIds)) errors.push(key + " evidence bindings do not exactly match assurance/coverage.yaml.");
    for (const evidence of obligation.evidence || []) {
      const binding = bindings.find((item) => item.id === evidence.binding_id);
      if (!binding) continue;
      for (const field of ["kind", "method", "locator"]) if (evidence[field] !== binding[field]) errors.push(key + "/" + evidence.binding_id + " " + field + " disagrees with assurance/coverage.yaml.");
      if (binding.kind === "test" && evidence.selector !== binding.selector) errors.push(key + "/" + evidence.binding_id + " selector disagrees with assurance/coverage.yaml.");
      if (binding.kind === "test" && !sameValues(evidence.case_ids, binding.cases)) errors.push(key + "/" + evidence.binding_id + " case_ids disagree with assurance/coverage.yaml.");
      if (!sameValues(evidence.fixtures || [], binding.fixtures)) errors.push(key + "/" + evidence.binding_id + " fixtures disagree with assurance/coverage.yaml.");
    }
  }
  for (const repositoryId of resultRepositories.keys()) {
    if (![...context.expectedAssignments.values()].some((assignment) => assignment.repositoryId === repositoryId)) {
      errors.push("normalized result includes repository group with no expected assignment: " + repositoryId + ".");
    }
  }
  return errors;
}

function html(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function rank(status) {
  const value = GAP_ORDER.indexOf(status);
  return value === -1 ? GAP_ORDER.length : value;
}

function sortedObligations(record) {
  return [...record.obligations].sort((left, right) => rank(left.status) - rank(right.status) || left.id.localeCompare(right.id));
}

function evidenceHtml(item) {
  const counts = item.kind === "test"
    ? `<span>${html(item.selector_count)} selector · ${html(item.executed_cases)}/${html(item.discovered_cases)} cases executed · ${html(item.passing_cases)} passed · ${html(item.failing_cases)} failed · ${html(item.skipped_cases)} skipped</span>`
    : "";
  const cases = item.case_ids?.length ? `<div><b>Declared cases:</b> ${html(item.case_ids.join(", "))}</div>` : "";
  const fixtures = item.fixtures?.length ? `<div><b>Fixture sources:</b> ${html(item.fixtures.join(", "))}</div>` : "";
  return `<li class="evidence"><div class="evidence-head"><code>${html(item.binding_id)}</code><span class="pill ${html(item.status)}">${html(item.status)}</span><span>${html(item.kind)} · ${html(item.method)}</span></div><div><b>Locator:</b> <code>${html(item.locator)}</code></div>${item.selector ? `<div><b>Selector:</b> <code>${html(item.selector)}</code></div>` : ""}<div class="counts">${counts}</div>${cases}${fixtures}<div><b>Observation:</b> ${html(item.observation)}</div></li>`;
}

function assignmentAnchor(repository, unit, obligation) {
  return [repository.id, unit.id, obligation.id].join("-").toLowerCase().replace(/[^a-z0-9.-]+/g, "-");
}

function obligationHtml({ repository, unit, record, obligation }) {
  const open = obligation.status === "passed" ? "" : " open";
  const exception = obligation.exception ? `<div class="exception"><b>Exception:</b> ${html(obligation.exception.id)} · ${html(obligation.exception.reason)} · expires ${html(obligation.exception.expires_at)} · approval ${html(obligation.exception.approval_ref)}</div>` : "";
  return `<details id="${assignmentAnchor(repository, unit, obligation)}" class="obligation"${open} data-repository="${html(repository.id)}" data-unit="${html(unit.id)}" data-record="${html(record.id)}" data-risk="${html(obligation.risk)}" data-status="${html(obligation.status)}" data-kind="${html([...new Set(obligation.evidence.map((item) => item.kind))].join(" "))}" data-search="${html([repository.name, unit.name, record.name, obligation.id, obligation.title, obligation.claim].join(" ").toLowerCase())}"><summary><span class="pill ${html(obligation.status)}">${html(obligation.status)}</span><code>${html(obligation.id)}</code><strong>${html(obligation.title)}</strong><span class="risk">${html(obligation.risk)}</span></summary><div class="obligation-body"><p><b>Claim:</b> ${html(obligation.claim)}</p><p><b>Required observation:</b> ${html(obligation.required_observation)}</p>${obligation.covers.length ? `<p><b>Covers:</b> ${html(obligation.covers.join(", "))}</p>` : ""}${exception}<h5>Evidence bindings</h5>${obligation.evidence.length ? `<ul>${obligation.evidence.map(evidenceHtml).join("")}</ul>` : `<p class="gap">No evidence binding was reported.</p>`}</div></details>`;
}

export function renderAssuranceReport(result) {
  const assignments = result.repositories.flatMap((repository) => repository.build_units.flatMap((unit) => unit.records.flatMap((record) => record.obligations.map((obligation) => ({ repository, unit, record, obligation })))));
  const all = assignments.map((item) => item.obligation);
  const counts = Object.fromEntries(GAP_ORDER.map((status) => [status, all.filter((item) => item.status === status).length]));
  const byCanonicalId = new Map();
  for (const obligation of all) {
    if (!byCanonicalId.has(obligation.id)) byCanonicalId.set(obligation.id, []);
    byCanonicalId.get(obligation.id).push(obligation.status);
  }
  const canonicalStatuses = [...byCanonicalId.values()];
  const gaps = canonicalStatuses.filter((statuses) => statuses.some((status) => !["passed", "approved-exception"].includes(status))).length;
  const fullyPassed = canonicalStatuses.filter((statuses) => statuses.every((status) => status === "passed")).length;
  const exceptionInvolved = canonicalStatuses.filter((statuses) => statuses.every((status) => ["passed", "approved-exception"].includes(status)) && statuses.includes("approved-exception")).length;
  const openGaps = assignments
    .filter(({ obligation }) => !["passed", "approved-exception"].includes(obligation.status))
    .sort((left, right) => rank(left.obligation.status) - rank(right.obligation.status) || left.obligation.id.localeCompare(right.obligation.id));
  const openGapsHtml = openGaps.length
    ? `<ol>${openGaps.map(({ repository, unit, obligation }) => `<li><span class="pill ${html(obligation.status)}">${html(obligation.status)}</span> <a href="#${assignmentAnchor(repository, unit, obligation)}"><code>${html(obligation.id)}</code> — ${html(obligation.title)}</a> <span class="risk">${html(repository.name)} / ${html(unit.name)}</span></li>`).join("")}</ol>`
    : `<p>No open obligation gaps were reported for this exact snapshot.</p>`;
  const tools = result.tools.map((tool) => `<code>${html(tool.name)} ${html(tool.version)}</code>`).join(" · ");
  const repositoryOptions = result.repositories.map((item) => `<option value="${html(item.id)}">${html(item.id)} — ${html(item.name)}</option>`).join("");
  const sections = result.repositories.map((repository) => {
    const units = repository.build_units.map((unit) => {
      const records = unit.records.map((record) => `<section class="record"><h4><code>${html(record.id)}</code> ${html(record.name)}</h4>${sortedObligations(record).map((obligation) => obligationHtml({ repository, unit, record, obligation })).join("")}</section>`).join("");
      return `<section class="unit"><h3><code>${html(unit.id)}</code> ${html(unit.name)}</h3>${records}</section>`;
    }).join("");
    return `<section class="repository"><h2><code>${html(repository.id)}</code> ${html(repository.name)}</h2><p class="provenance">Revision <code>${html(repository.revision)}</code> · Manifest <code>${html(repository.manifest_digest)}</code></p>${units}</section>`;
  }).join("");

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${html(result.blueprint.name)} assurance report</title><style>
:root{color-scheme:light;--ink:#182028;--muted:#68737d;--line:#d8dee4;--panel:#f7f9fb;--bad:#a22b2b;--warn:#8a5a00;--good:#176b45}*{box-sizing:border-box}body{margin:0;font:15px/1.5 ui-sans-serif,system-ui,-apple-system,sans-serif;color:var(--ink);background:#fff}header{padding:28px clamp(20px,5vw,64px);background:#111b24;color:#fff}header h1{margin:0 0 8px;font-size:clamp(24px,4vw,42px)}header p{margin:4px 0;color:#c8d2db}code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.92em}.summary,.open-gaps,.filters,main,footer{max-width:1240px;margin:auto}.summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;padding:22px 20px}.metric{border:1px solid var(--line);border-radius:10px;padding:14px;background:var(--panel)}.metric b{display:block;font-size:24px}.open-gaps{padding:0 20px 20px}.open-gaps h2{margin-bottom:8px}.open-gaps ol{margin:0;padding-left:24px}.open-gaps li{padding:5px 0}.open-gaps a{color:var(--ink)}.filters{position:sticky;top:0;z-index:2;display:grid;grid-template-columns:2fr repeat(4,1fr);gap:10px;padding:14px 20px;background:#fffffff2;border-block:1px solid var(--line);backdrop-filter:blur(8px)}input,select{width:100%;padding:9px 10px;border:1px solid #aeb8c2;border-radius:7px;background:#fff}main{padding:10px 20px 50px}.repository{margin-top:30px}.repository h2{border-bottom:2px solid #243746;padding-bottom:8px}.provenance{color:var(--muted)}.unit{margin:22px 0 0 18px}.record{margin:18px 0 0 18px}.obligation{border:1px solid var(--line);border-left:5px solid #8c98a3;border-radius:8px;margin:10px 0;background:#fff;scroll-margin-top:90px}.obligation[open]{box-shadow:0 3px 14px #13202c12}.obligation summary{display:flex;align-items:center;gap:10px;padding:12px;cursor:pointer}.obligation summary strong{flex:1}.obligation-body{border-top:1px solid var(--line);padding:12px 16px}.pill{display:inline-block;border-radius:999px;padding:2px 8px;font-size:12px;font-weight:700;background:#e8edf1}.pill.passed{background:#dff3e9;color:var(--good)}.pill.approved-exception{background:#fff0c9;color:var(--warn)}.pill.failed,.pill.missing,.pill.unassigned,.pill.unmapped,.pill.ambiguous,.pill.stale{background:#ffe3e1;color:var(--bad)}.risk{color:var(--muted);font-size:13px}.evidence{margin:10px 0;padding:12px;border:1px solid var(--line);border-radius:7px;background:var(--panel)}.evidence-head{display:flex;gap:10px;align-items:center;margin-bottom:6px}.counts,.gap{color:var(--muted)}.exception{padding:10px;border-left:4px solid #d99b16;background:#fff8e5}footer{padding:25px 20px 50px;color:var(--muted);border-top:1px solid var(--line)}[hidden]{display:none!important}@media(max-width:850px){.filters{grid-template-columns:1fr 1fr}.filters input{grid-column:1/-1}.unit,.record{margin-left:0}.obligation summary{align-items:flex-start;flex-wrap:wrap}}
</style></head><body><header><h1>${html(result.blueprint.name)}</h1><p>Blueprint <code>${html(result.blueprint.id)}</code> · assurance traceability report · run ${html(result.run.started_at)} to ${html(result.run.completed_at)} · generated ${html(result.generated_at)}</p><p>Blueprint snapshot <code>${html(result.blueprint.snapshot_id)}</code> · revision <code>${html(result.blueprint.revision)}</code></p><p>Evidence tools and adapters: ${tools}</p></header><section class="summary"><div class="metric"><b>${byCanonicalId.size}</b>unique obligations</div><div class="metric"><b>${all.length}</b>Build Unit assignments</div><div class="metric"><b>${gaps}</b>open obligation gaps</div><div class="metric"><b>${fullyPassed}</b>fully passed</div><div class="metric"><b>${exceptionInvolved}</b>exception-involved</div></section><section class="open-gaps"><h2>Open gaps first</h2>${openGapsHtml}</section><section class="filters"><input id="search" type="search" placeholder="Search obligation, claim, repository…"><select id="repository"><option value="">All repositories</option>${repositoryOptions}</select><select id="risk"><option value="">All risks</option><option>ordinary</option><option>high</option></select><select id="status"><option value="">All statuses</option>${GAP_ORDER.map((item) => `<option>${item}</option>`).join("")}</select><select id="kind"><option value="">All evidence</option>${[...EVIDENCE_KINDS].map((item) => `<option>${item}</option>`).join("")}</select></section><main>${sections}</main><footer>Passing evidence supports only the declared Verification Obligations for the exact blueprint, repository, manifest, tool, and run snapshot recorded here. It is not a claim that the system is universally secure or defect-free.</footer><script>
const controls=["search","repository","risk","status","kind"].map(id=>document.getElementById(id));function filter(){const [q,repo,risk,status,kind]=controls.map(x=>x.value.toLowerCase());for(const item of document.querySelectorAll(".obligation")){const visible=(!q||item.dataset.search.includes(q))&&(!repo||item.dataset.repository.toLowerCase()===repo)&&(!risk||item.dataset.risk===risk)&&(!status||item.dataset.status===status)&&(!kind||item.dataset.kind.split(" ").includes(kind));item.hidden=!visible}for(const group of document.querySelectorAll(".record,.unit,.repository")){group.hidden=!group.querySelector(".obligation:not([hidden])")}}controls.forEach(x=>x.addEventListener("input",filter));
</script></body></html>`;
}

function main() {
  const args = parseArgs(process.argv);
  const result = JSON.parse(fs.readFileSync(args.input, "utf8"));
  const context = loadAssuranceContext(args);
  const errors = validateAssuranceResult(result, context);
  if (errors.length) throw new Error("Assurance result validation failed:\n- " + errors.join("\n- "));
  fs.mkdirSync(path.dirname(args.output), { recursive: true });
  fs.writeFileSync(args.output, renderAssuranceReport(result));
  console.log("Rendered assurance report: " + args.output);
}

if (isEntryPoint(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
