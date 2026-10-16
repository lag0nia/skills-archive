#!/usr/bin/env node

import { currentFormatError } from "./lib/model/package-format.mjs";
import fs from "node:fs";
import path from "node:path";
import { isEntryPoint } from "./lib/entry-point.mjs";
import { findFiles as files, readText as read } from "./lib/model/files.mjs";
import { parseFrontmatter as frontmatter } from "./lib/model/frontmatter.mjs";
import { commaSeparatedIds, findBuildUnitRecords } from "./lib/model/build-unit-records.mjs";
import { currentShapeErrors } from "./lib/model/current-shape.mjs";
import { ticketAttributionErrors } from "./lib/model/decision-attribution.mjs";
import { parseTicketFile } from "./lib/model/ticket-format.mjs";
import { buildLayout, capabilityFiles, selectionFiles } from "./lib/model/build-layout.mjs";
import { findRepositoryBuildDesignRecords } from "./lib/model/repository-build-design-records.mjs";
import { findTechnicalConstraintRecords } from "./lib/model/technical-constraint-records.mjs";
import { RETIRED_LAYOUT_ENTRIES, systemModelLayout } from "./lib/model/package-layout.mjs";

const ACTIVE_STATUSES = new Set(["todo", "deferred", "decided", "finished", "out-of-scope"]);
const KINDS = new Set(["product", "technical", "operational"]);
const REPOSITORY_CONTRACT_AREAS = new Set([
  "repository-module-conventions",
  "code-construction-public-api",
  "maintainability-agent-guidance",
]);
const PRE_MAPPING_DISPOSITION = /^Realization mapping has not started\.?$/i;
const REQUIRED_ACTIVE_FIELDS = [
  "id",
  "title",
  "status",
  "kind",
  "complexity",
  "concern",
  "owner",
  "affects",
  "cluster",
  "question",
  "context",
  "options",
  "recommendation",
  "resolution",
  "depends_on",
  "write_targets",
];

const IDENTIFIERS = {
  ticket: /^TICKET-\d{4}$/,
  ticketGlobal: /TICKET-\d{4}/g,
  selection: /^SEL-\d{3}$/,
  result: /^(?:SEL|VA)-\d{3}$/,
  constraint: /^CONS-\d{3,}$/,
};

function parseArgs(argv) {
  const args = { root: "software-design" };
  for (let index = 2; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--root") args.root = argv[++index];
    else throw new Error("Unknown argument: " + value);
  }
  return args;
}

function domainIndex(root) {
  const result = new Map();
  const layout = systemModelLayout(root);
  for (const filePath of files(layout.domainsRoot, (name) => name === "domain.md")) {
    const relative = path.relative(layout.domainsRoot, filePath).split(path.sep).join("/");
    const domain = /^([^/]+)\/domain\.md$/.exec(relative)?.[1];
    if (!domain) continue;
    const text = read(filePath);
    const name = frontmatter(text, filePath).name;
    if (!name) throw new Error(filePath + ": missing Domain name.");
    if (result.has(domain)) throw new Error("Duplicate Domain " + domain + ".");
    result.set(domain, { name, filePath });
  }
  return result;
}

function responsibilityIndex(root, domains) {
  const result = new Map();
  const layout = systemModelLayout(root);
  for (const filePath of files(layout.domainsRoot, (name) => /^sr-\d{3,}-.*\.md$/i.test(name))) {
    const text = read(filePath);
    const meta = frontmatter(text, filePath);
    const { name, id, domain } = meta;
    if (!name || !id || !domain) throw new Error(filePath + ": missing logical owner metadata.");
    if (!domains.has(domain)) throw new Error(filePath + ": owning Domain does not exist.");
    if (result.has(id)) throw new Error("Duplicate logical owner ID " + id + ".");
    result.set(id, { name, domain, domainName: domains.get(domain).name, filePath });
  }
  return result;
}

function buildUnitIndex(root, responsibilities) {
  const result = new Map();
  const layout = buildLayout(root);
  for (const { filePath, filename, content } of findBuildUnitRecords(layout.unitsRoot)) {
    const meta = frontmatter(content, filePath);
    const id = meta.id;
    const name = meta.name;
    const kind = meta.kind;
    const sourceResponsibilities = commaSeparatedIds(meta.source_responsibilities);
    const dependencies = commaSeparatedIds(meta.depends_on_build_units);
    if (meta.type !== "build-unit") throw new Error(filePath + ": build-unit records require type build-unit.");
    if (!/^BU-\d{3,}$/.test(id || "")) throw new Error(filePath + ": invalid or missing BU-xxx id.");
    if (!filename.startsWith(id.toLowerCase() + "-") || !/^bu-\d{3,}-.+\.md$/.test(filename)) {
      throw new Error(filePath + ": filename must start with the lowercase build-unit id and a readable slug.");
    }
    if (!nonEmptyString(name) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(kind || "")) {
      throw new Error(filePath + ": build-unit name must be non-empty and kind must be a lowercase slug.");
    }
    if (!sourceResponsibilities.length || sourceResponsibilities.some((responsibilityId) => !responsibilities.has(responsibilityId))) {
      throw new Error(filePath + ": source_responsibilities must name existing SR-xxx identifiers.");
    }
    if (new Set(sourceResponsibilities).size !== sourceResponsibilities.length) {
      throw new Error(filePath + ": source responsibility mappings must not contain duplicates.");
    }
    if (dependencies.some((dependency) => !/^BU-\d{3,}$/.test(dependency)) || new Set(dependencies).size !== dependencies.length) {
      throw new Error(filePath + ": depends_on_build_units must contain unique BU-xxx identifiers or None.");
    }
    if (result.has(id)) throw new Error("Duplicate build-unit ID " + id + ".");
    result.set(id, { id, name, kind, sourceResponsibilities, dependencies, filePath });
  }
  for (const unit of result.values()) {
    for (const dependency of unit.dependencies) {
      if (dependency === unit.id) throw new Error(unit.filePath + ": build unit cannot depend on itself.");
      if (!result.has(dependency)) throw new Error(unit.filePath + ": unknown build-unit dependency " + dependency + ".");
    }
  }
  return result;
}

function repositoryIndex(root, buildUnits) {
  const result = new Map();
  const repositoriesRoot = buildLayout(root).repositoriesRoot;
  for (const record of findRepositoryBuildDesignRecords(repositoriesRoot)) {
    if (record.type !== "repository-build-design") throw new Error(record.filePath + ": repository records require type repository-build-design.");
    if (!/^REPO-\d{3,}$/.test(record.id || "")) throw new Error(record.filePath + ": invalid or missing REPO-xxx id.");
    if (!nonEmptyString(record.name)) throw new Error(record.filePath + ": repository name must be non-empty.");
    if (result.has(record.id)) throw new Error("Duplicate repository ID " + record.id + ".");
    const memberBuildUnits = record.memberBuildUnits || [];
    if (!memberBuildUnits.length || memberBuildUnits.some((id) => !/^BU-\d{3,}$/.test(id)) || new Set(memberBuildUnits).size !== memberBuildUnits.length) {
      throw new Error(record.filePath + ": member_build_units must contain unique BU-xxx identifiers.");
    }
    if (memberBuildUnits.some((id) => !buildUnits.has(id))) {
      throw new Error(record.filePath + ": member_build_units names an unknown Build Unit.");
    }
    result.set(record.id, { id: record.id, name: record.name, memberBuildUnits, filePath: record.filePath });
  }
  return result;
}

function realizationResultIndex(root, errors) {
  const results = new Map();
  const layout = buildLayout(root);
  for (const filePath of selectionFiles(layout)) {
    try {
      const meta = frontmatter(read(filePath), filePath);
      const id = meta.id;
      if (!IDENTIFIERS.selection.test(id || "")) {
        errors.push(filePath + ": invalid or missing SEL-NNN id.");
        continue;
      }
      if (results.has(id)) errors.push("Duplicate realization result " + id + ".");
      else results.set(id, { id, sourceTickets: commaSeparatedIds(meta.source_tickets), filePath });
    } catch (error) {
      errors.push(error.message);
    }
  }

  for (const filePath of capabilityFiles(layout)) {
    const content = read(filePath);
    const matches = [...content.matchAll(/^#\s+(VA-\d{3})\s+—[^\n]*$/gm)].map((match) => ({ id: match[1], body: content }));
    for (const capability of matches) {
      const sourceLine = /^\*\*Source tickets:\*\*\s*(.+)$/m.exec(capability.body)?.[1] || "";
      const sourceTickets = [...sourceLine.matchAll(IDENTIFIERS.ticketGlobal)].map((item) => item[0]);
      if (results.has(capability.id)) errors.push("Duplicate realization result " + capability.id + ".");
      else results.set(capability.id, { id: capability.id, sourceTickets, filePath });
    }
  }
  return results;
}

function expectedScope(root, document, responsibilities) {
  const relative = path.relative(buildLayout(root).ticketsRoot, document.filePath).split(path.sep).join("/");
  if (relative === "cross-domain-tickets.yaml") return "cross-domain";
  const responsibilityFile = /^([^/]+)\/(sr-\d{3,})\/(.+\.yaml)$/.exec(relative);
  if (!responsibilityFile) throw new Error(document.filePath + ": invalid canonical ticket file location.");
  const responsibilityId = responsibilityFile[2].toUpperCase();
  const responsibility = responsibilities.get(responsibilityId);
  if (!responsibility || responsibility.domain !== responsibilityFile[1]) throw new Error(document.filePath + ": responsibility ticket folder does not match its owning Domain.");
  if (!responsibilityFile[3].startsWith(responsibilityFile[2] + "-") || !responsibilityFile[3].endsWith("-tickets.yaml")) {
    throw new Error(document.filePath + ": responsibility-owned ticket filename must start with " + responsibilityFile[2] + "- and end with -tickets.yaml.");
  }
  return "responsibility:" + responsibilityId;
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function stringArray(value) {
  return Array.isArray(value) && value.every(nonEmptyString);
}

export function candidateProofValid(value) {
  if (!nonEmptyString(value)) return false;
  const match = /^An implementer cannot finish or verify (.+) without choosing (.+), and the current package does not already choose it\.$/.exec(value);
  if (!match) return false;
  return match[1].trim().length >= 8
    && match[2].trim().length >= 8
    && !/[<>]/.test(match[1] + match[2]);
}

export function validateImplementationDetailTickets(root) {
  return validate(path.resolve(root));
}

export function validateRepositoryTicketMappings(tickets, buildUnits, repositories, errors) {
  if (!buildUnits.size) return;

  const ownersByBuildUnit = new Map();
  for (const repository of repositories.values()) {
    for (const buildUnitId of repository.memberBuildUnits || []) {
      if (!ownersByBuildUnit.has(buildUnitId)) ownersByBuildUnit.set(buildUnitId, []);
      ownersByBuildUnit.get(buildUnitId).push(repository.id);
    }
  }

  for (const ticket of tickets) {
    if (ticket.record_state === "archived") continue;
    const contractArea = ticket.repository_contract_area;
    const buildUnitIds = ticket.build_units;
    const repositoryIds = ticket.repositories;
    const isRepositoryContractTicket = contractArea !== undefined && contractArea !== null && REPOSITORY_CONTRACT_AREAS.has(contractArea);
    if (isRepositoryContractTicket && (!Array.isArray(buildUnitIds) || !buildUnitIds.length)) {
      errors.push(ticket.id + ": repository contract ticket " + contractArea + " must map at least one build unit after Build Design exists.");
      continue;
    }
    if (!Array.isArray(buildUnitIds) || !buildUnitIds.length) continue;
    if (!Array.isArray(repositoryIds) || !repositoryIds.length) continue;
    const ticketScopeLabel = isRepositoryContractTicket ? "repository contract ticket " + contractArea : "repository-scoped ticket";

    for (const buildUnitId of buildUnitIds) {
      const owners = ownersByBuildUnit.get(buildUnitId) || [];
      if (!owners.length) {
        errors.push(ticket.id + ": " + ticketScopeLabel + " maps Build Unit " + buildUnitId + " but no Repository Build Design owns it.");
      } else if (!owners.some((repositoryId) => repositoryIds.includes(repositoryId))) {
        errors.push(ticket.id + ": " + ticketScopeLabel + " maps Build Unit " + buildUnitId
          + " to " + repositoryIds.join(", ") + ", but its owning Repository Build Design(s) are " + owners.join(", ") + ".");
      }
    }
  }
}

function validate(root) {
  const formatError = currentFormatError(root);
  if (formatError) return { errors: [formatError], skipped: false, ticketCount: 0, fileCount: 0 };
  const errors = [];
  const registry = "build/workflow/technical-decisions.yaml";
  if (fs.existsSync(path.join(root, registry))) errors.push(RETIRED_LAYOUT_ENTRIES.get(registry));
  const domains = domainIndex(root);
  const responsibilities = responsibilityIndex(root, domains);
  const buildUnits = buildUnitIndex(root, responsibilities);
  const repositories = repositoryIndex(root, buildUnits);
  const realizationResults = realizationResultIndex(root, errors);
  const technicalConstraints = new Map();
  for (const record of findTechnicalConstraintRecords(root)) {
    if (IDENTIFIERS.constraint.test(record.id || "")) technicalConstraints.set(record.id, record);
  }
  const ticketFiles = files(buildLayout(root).ticketsRoot, (name) => name.endsWith("-tickets.yaml"));
  if (!ticketFiles.length) {
    return { errors, skipped: true, ticketCount: 0, fileCount: 0, domains, responsibilities, buildUnits, repositories };
  }

  const documents = [];
  for (const filePath of ticketFiles) {
    try {
      documents.push(parseTicketFile(filePath));
    } catch (error) {
      errors.push(error.message);
    }
  }

  const byId = new Map();
  for (const document of documents) {
    let expected;
    try {
      expected = expectedScope(root, document, responsibilities);
      if (document.scope !== expected) errors.push(document.filePath + ": scope must be " + JSON.stringify(expected) + ".");
    } catch (error) {
      errors.push(error.message);
    }

    for (const ticket of [...document.tickets, ...document.archivedRecords]) {
      if (!IDENTIFIERS.ticket.test(ticket.id || "")) errors.push(document.filePath + ": invalid ticket id " + String(ticket.id) + ".");
      if (byId.has(ticket.id)) errors.push("Duplicate ticket id " + ticket.id + ".");
      byId.set(ticket.id, { ...ticket, filePath: document.filePath, scope: document.scope });

      if (ticket.record_state === "archived") {
        if (ticket.status !== undefined) errors.push(ticket.id + ": archived records must not have an active status.");
        if (!ACTIVE_STATUSES.has(ticket.status_at_close)) errors.push(ticket.id + ": invalid status_at_close.");
        if (!["promoted-to-td", "duplicate", "obsolete"].includes(ticket.closed_reason)) errors.push(ticket.id + ": invalid archived closed_reason.");
        if (ticket.closed_reason === "promoted-to-td" && !/^TD-\d{3}$/.test(ticket.promoted_to || "")) errors.push(ticket.id + ": invalid promoted_to TD.");
        if (!stringArray(ticket.replaced_by) || (ticket.closed_reason !== "obsolete" && !ticket.replaced_by.length)) errors.push(ticket.id + ": archived promotion or duplicate needs replaced_by ticket ids; obsolete may use an empty array.");
        continue;
      }

      for (const field of REQUIRED_ACTIVE_FIELDS) {
        if (!Object.hasOwn(ticket, field)) errors.push(ticket.id + ": missing " + field + ".");
      }
      if (!ACTIVE_STATUSES.has(ticket.status)) errors.push(ticket.id + ": invalid active status.");
      if (!["low", "medium", "high"].includes(ticket.complexity)) errors.push(ticket.id + ": complexity must be low, medium, or high.");
      if (!KINDS.has(ticket.kind)) errors.push(ticket.id + ": invalid kind.");
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(ticket.concern || "")) errors.push(ticket.id + ": invalid concern slug.");
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(ticket.cluster || "")) errors.push(ticket.id + ": invalid cluster slug.");
      if (!nonEmptyString(ticket.title) || !nonEmptyString(ticket.question) || !nonEmptyString(ticket.context) || !nonEmptyString(ticket.recommendation)) {
        errors.push(ticket.id + ": title, question, context, and recommendation must be non-empty.");
      }
      errors.push(...currentShapeErrors(ticket.current_shape, { owner: ticket.id, root }));
      if (["todo", "deferred", "out-of-scope"].includes(ticket.status) && !candidateProofValid(ticket.candidate_proof)) {
        errors.push(ticket.id + ": todo, deferred, and out-of-scope tickets require a concrete candidate_proof using the prescribed sentence.");
      }
      if (!Array.isArray(ticket.options) || !stringArray(ticket.depends_on) || !stringArray(ticket.write_targets)) {
        errors.push(ticket.id + ": options, depends_on, and write_targets must be inline arrays.");
      }
      if (Object.hasOwn(ticket, "result_refs")) {
        if (!stringArray(ticket.result_refs)
          || ticket.result_refs.some((id) => !IDENTIFIERS.result.test(id))
          || new Set(ticket.result_refs).size !== ticket.result_refs.length) {
          errors.push(ticket.id + ": result_refs must be a unique inline array of SEL-NNN or VA-NNN identifiers.");
        } else {
          for (const resultId of ticket.result_refs) {
            const result = realizationResults.get(resultId);
            if (!result) errors.push(ticket.id + " references missing realization result " + resultId + ".");
            else if (!result.sourceTickets.includes(ticket.id)) errors.push(resultId + " must reciprocally name " + ticket.id + " as a source ticket.");
          }
        }
      }
      if (Object.hasOwn(ticket, "constraint_refs")) {
        if (!stringArray(ticket.constraint_refs)
          || ticket.constraint_refs.some((id) => !IDENTIFIERS.constraint.test(id))
          || new Set(ticket.constraint_refs).size !== ticket.constraint_refs.length) {
          errors.push(ticket.id + ": constraint_refs must be a unique inline array of CONS-NNN identifiers.");
        } else {
          for (const constraintId of ticket.constraint_refs) {
            const constraint = technicalConstraints.get(constraintId);
            if (!constraint) errors.push(ticket.id + " references missing Technical Constraint " + constraintId + ".");
            else if (!constraint.sourceTickets.includes(ticket.id)) errors.push(constraintId + " must reciprocally name " + ticket.id + " as a source ticket.");
          }
          if (!["decided", "finished"].includes(ticket.status) && ticket.constraint_refs.length) {
            errors.push(ticket.id + ": unresolved tickets cannot reference decided Technical Constraints.");
          }
        }
      }
      if (!stringArray(ticket.affects) || !ticket.affects.length || ticket.affects.some((id) => !responsibilities.has(id))) {
        errors.push(ticket.id + ": affects must name existing logical-owner identifiers.");
      }
      if (buildUnits.size && !Object.hasOwn(ticket, "build_units")) {
        errors.push(ticket.id + ": build_units is required after realization mapping exists.");
      }
      if (Object.hasOwn(ticket, "build_units")) {
        if (!Array.isArray(ticket.build_units)
          || ticket.build_units.some((id) => typeof id !== "string" || !/^BU-\d{3,}$/.test(id))
          || new Set(ticket.build_units).size !== ticket.build_units.length) {
          errors.push(ticket.id + ": build_units must be a unique inline array of BU-xxx identifiers.");
        } else if (ticket.build_units.some((id) => !buildUnits.has(id))) {
          errors.push(ticket.id + ": build_units names an unknown build unit.");
        }
        if (!ticket.build_units.length && !nonEmptyString(ticket.build_unit_disposition)) {
          errors.push(ticket.id + ": an empty build_units array requires build_unit_disposition.");
        }
        if (buildUnits.size && !ticket.build_units.length && PRE_MAPPING_DISPOSITION.test(ticket.build_unit_disposition || "")) {
          errors.push(ticket.id + ": pre-mapping build_unit_disposition is invalid after realization mapping exists.");
        }
        if (ticket.build_units.length && ticket.build_unit_disposition !== null) {
          errors.push(ticket.id + ": mapped tickets must use build_unit_disposition: null.");
        }
      }
      if (Object.hasOwn(ticket, "repositories")) {
        if (!Array.isArray(ticket.repositories)
          || ticket.repositories.some((id) => typeof id !== "string" || !/^REPO-\d{3,}$/.test(id))
          || new Set(ticket.repositories).size !== ticket.repositories.length) {
          errors.push(ticket.id + ": repositories must be a unique inline array of REPO-xxx identifiers.");
        } else if (ticket.repositories.some((id) => !repositories.has(id))) {
          errors.push(ticket.id + ": repositories names an unknown Repository Build Design.");
        }
      }
      if (Object.hasOwn(ticket, "repository_contract_area")) {
        const contractArea = ticket.repository_contract_area;
        if (contractArea !== null && (!nonEmptyString(contractArea) || !REPOSITORY_CONTRACT_AREAS.has(contractArea))) {
          errors.push(ticket.id + ": repository_contract_area must be null or one of the supported repository contract lanes.");
        } else if (contractArea !== null && (!Array.isArray(ticket.repositories) || !ticket.repositories.length)) {
          errors.push(ticket.id + ": repository_contract_area requires at least one affected Repository Build Design in repositories.");
        }
      }
      const ownerScope = /^responsibility:(SR-\d{3,})$/.exec(document.scope)?.[1];
      if (ownerScope && ticket.owner !== ownerScope) errors.push(ticket.id + ": owner must match responsibility file scope " + ownerScope + ".");
      if (!ownerScope && ticket.owner !== "shared") errors.push(ticket.id + ": shared ticket files must use owner shared.");
      if (ownerScope && !ticket.affects?.includes(ownerScope)) errors.push(ticket.id + ": affects must include its owning logical boundary.");
      if (ticket.status === "todo" && !ticket.options?.length) errors.push(ticket.id + ": todo tickets require concrete options.");
      if (["decided", "finished"].includes(ticket.status) && !nonEmptyString(ticket.resolution)) {
        errors.push(ticket.id + ": decided and finished tickets require a resolution.");
      }
      if (["todo", "deferred", "out-of-scope"].includes(ticket.status) && ticket.resolution !== null) {
        errors.push(ticket.id + ": todo, deferred, and out-of-scope tickets must use resolution: null.");
      }
      if (ticket.status === "finished" && !ticket.write_targets?.length) errors.push(ticket.id + ": finished tickets require write targets.");
      for (const target of ticket.write_targets || []) {
        const absolute = path.resolve(root, target);
        if (!(absolute === root || absolute.startsWith(root + path.sep)) || !fs.existsSync(absolute)) {
          errors.push(ticket.id + ": write target does not resolve inside Software Design: " + target);
        }
      }
      for (const dependency of ticket.depends_on || []) {
        if (!IDENTIFIERS.ticket.test(dependency) || dependency === ticket.id) errors.push(ticket.id + ": invalid depends_on ticket " + dependency + ".");
      }

      if (ticket.status === "out-of-scope" && !nonEmptyString(ticket.scope_reason)) {
        errors.push(ticket.id + ": out-of-scope tickets require scope_reason and a canonical scope reference in write_targets.");
      }
      if (ticket.status === "out-of-scope" && !ticket.write_targets?.some(target => target.startsWith("system-model/contracts/scope/"))) {
        errors.push(ticket.id + ": out-of-scope tickets require an existing scope write target.");
      }
      if (ticket.status === "deferred" && !nonEmptyString(ticket.resume_when)) {
        errors.push(ticket.id + ": deferred tickets require resume_when because they remain in current scope.");
      }
      if (ticket.status === "out-of-scope" && !nonEmptyString(ticket.resume_when)) {
        errors.push(ticket.id + ": out-of-scope tickets require resume_when.");
      }
    }
  }

  validateRepositoryTicketMappings([...byId.values()].filter((ticket) => ticket.record_state !== "archived"), buildUnits, repositories, errors);

  const ticketIds = new Set(byId.keys());
  for (const ticket of byId.values()) errors.push(...ticketAttributionErrors(ticket, { root, ticketIds }));

  for (const ticket of byId.values()) {
    for (const dependency of ticket.depends_on || []) {
      if (!byId.has(dependency)) errors.push(ticket.id + ": unknown dependency " + dependency + ".");
      else if (ticket.record_state !== "archived" && byId.get(dependency).record_state === "archived") errors.push(ticket.id + ": active dependency points to archived ticket " + dependency + "; redirect or retire the dependency.");
    }
    if (ticket.record_state === "archived") {
      for (const replacement of Array.isArray(ticket.replaced_by) ? ticket.replaced_by : []) {
        const child = byId.get(replacement);
        if (!child) errors.push(ticket.id + ": replacement ticket does not exist: " + replacement);
        else if (child.record_state === "archived" || child.id === ticket.id) errors.push(ticket.id + ": replacement must be an active ticket: " + replacement);
      }
    }
  }

  for (const result of realizationResults.values()) {
    for (const ticketId of result.sourceTickets) {
      const ticket = byId.get(ticketId);
      if (!ticket) errors.push(result.id + " references missing source ticket " + ticketId + ".");
      else if (!ticket.result_refs?.includes(result.id)) errors.push(ticketId + " must reciprocally name " + result.id + " in result_refs.");
    }
  }

  return { errors, skipped: false, ticketCount: byId.size, fileCount: documents.length, documents, domains, responsibilities, buildUnits, repositories };
}

function main() {
  const args = parseArgs(process.argv);
  const root = path.resolve(args.root);
  const result = validate(root);
  if (result.errors.length) throw new Error(result.errors.join("\n"));
  if (result.skipped) {
    console.log("No implementation-detail ticket files found; structural validation skipped. Semantic inventory completeness was not assessed.");
  } else {
    console.log(
      "Ticket structure and canonical owner routing are valid for "
      + result.ticketCount
      + " implementation-detail tickets across "
      + result.fileCount
      + " file(s). Semantic inventory completeness was not assessed.",
    );
  }
}

if (isEntryPoint(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
