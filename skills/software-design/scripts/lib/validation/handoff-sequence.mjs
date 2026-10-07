import fs from "node:fs";
import path from "node:path";
import { buildLayout } from "../model/build-layout.mjs";
import { findBuildUnitRecords } from "../model/build-unit-records.mjs";
import { parseFrontmatter } from "../model/frontmatter.mjs";

const TABLE_HEADER = ["Order group", "Delivery slice", "Repository", "Build Units", "Requires", "State"];
const SLICE_PATTERN = /\brepo-\d{3}-[a-z0-9]+(?:-[a-z0-9]+)*\b/g;
const STATE_PATTERN = /^(Implemented|Ready|Next|Blocked|Waiting)(?:\s*(?:—|-|:)\s*(.+))?$/;

function directHandoffFiles(handoffsRoot) {
  if (!fs.existsSync(handoffsRoot)) return [];
  return fs.readdirSync(handoffsRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md") && entry.name.toLowerCase() !== "readme.md")
    .map((entry) => path.join(handoffsRoot, entry.name))
    .sort();
}

function cells(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) return [];
  return trimmed.slice(1, -1).split("|").map((cell) => cell.trim());
}

function plain(text) {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[`*_]/g, "")
    .trim();
}

function ids(text, pattern) {
  return [...new Set((plain(text).match(pattern) || []).map((value) => value.toUpperCase()))];
}

function sliceIds(text) {
  return [...new Set((plain(text).match(SLICE_PATTERN) || []).map((value) => value.toLowerCase()))];
}

function isNone(text) {
  return /^None\.$/i.test(plain(text));
}

function handoffTarget(cell, handoffsRoot) {
  const target = /\[[^\]]+\]\(([^)#]+\.md)(?:#[^)]*)?\)/i.exec(cell)?.[1];
  if (!target || /^(?:[a-z]+:|\/\/)/i.test(target)) return null;
  return path.resolve(handoffsRoot, target);
}

function parseSliceCell(cell) {
  const slices = sliceIds(cell);
  return slices.length === 1 && plain(cell).replace(slices[0], "").trim() === "" ? slices[0] : null;
}

function buildUnitRecords(layout, errors) {
  const records = new Map();
  for (const { filePath, content } of findBuildUnitRecords(layout.unitsRoot)) {
    try {
      const meta = parseFrontmatter(content, filePath);
      if (/^BU-\d{3,}$/.test(meta.id || "")) {
        records.set(meta.id, {
          owner: String(meta.repository || "").trim(),
          dependencies: ids(String(meta.depends_on_build_units || ""), /\bBU-\d{3,}\b/g),
        });
      }
    } catch (error) {
      errors.push(error.message);
    }
  }
  return records;
}

function dependencyCycles(rows, bySlug, errors) {
  const visiting = new Set();
  const visited = new Set();
  const visit = (slug, trail) => {
    if (visiting.has(slug)) {
      const start = trail.indexOf(slug);
      errors.push("Handoff sequence contains a delivery-slice dependency cycle: " + [...trail.slice(start), slug].join(" -> ") + ".");
      return;
    }
    if (visited.has(slug)) return;
    visiting.add(slug);
    for (const required of bySlug.get(slug)?.requires || []) if (bySlug.has(required)) visit(required, [...trail, slug]);
    visiting.delete(slug);
    visited.add(slug);
  };
  for (const row of rows) if (row.slug) visit(row.slug, []);
}

function transitivelyRequires(slug, requiredSlug, bySlug, visited = new Set()) {
  if (slug === requiredSlug) return true;
  if (visited.has(slug)) return false;
  visited.add(slug);
  return (bySlug.get(slug)?.requires || []).some((required) => required === requiredSlug || transitivelyRequires(required, requiredSlug, bySlug, visited));
}

export function validateHandoffSequence(rootPath) {
  const root = path.resolve(rootPath);
  const layout = buildLayout(root);
  const errors = [];

  const indexPath = path.join(layout.handoffsRoot, "README.md");
  if (!fs.existsSync(indexPath)) {
    return { errors: ["Missing Stage 9 sequence index: build/workflow/handoffs/README.md."], skipped: false, rows: [], currentOrderGroup: null };
  }

  const content = fs.readFileSync(indexPath, "utf8");
  if (!/^# Handoff Sequence\s*$/m.test(content)) errors.push("Handoff sequence index must begin with # Handoff Sequence.");
  if (/^##\s+(?:Parked|Blocked)\b/im.test(content)) errors.push("Handoff sequence index must keep every delivery slice in the single Order group table; remove parked or blocked sections.");

  const currentMatches = [...content.matchAll(/^\*\*Current order group:\*\*\s*(.+?)\s*$/gm)];
  if (currentMatches.length !== 1) errors.push("Handoff sequence index requires exactly one **Current order group:** line.");
  let declaredCurrent = null;
  let declaredCurrentValid = false;
  if (currentMatches.length === 1) {
    const value = plain(currentMatches[0][1]);
    if (/^None\.$/i.test(value)) declaredCurrentValid = true;
    else if (/^[1-9]\d*$/.test(value)) {
      declaredCurrent = Number(value);
      declaredCurrentValid = true;
    } else errors.push("Current order group must be a positive integer or `None.`.");
  }

  const lines = content.split(/\r?\n/);
  const headerIndex = lines.findIndex((line) => {
    const parsed = cells(line);
    return parsed.length === TABLE_HEADER.length && parsed.every((value, index) => plain(value) === TABLE_HEADER[index]);
  });
  if (headerIndex < 0) {
    errors.push("Handoff sequence index requires the exact six-column Order group table.");
    return { errors, skipped: false, rows: [], currentOrderGroup: null };
  }

  const separator = cells(lines[headerIndex + 1] || "");
  if (separator.length !== TABLE_HEADER.length || separator.some((cell) => !/^:?-{3,}:?$/.test(cell))) {
    errors.push("Handoff sequence table requires one Markdown separator cell per column.");
  }

  const rows = [];
  let previousOrderGroup = 0;
  for (let index = headerIndex + 2; index < lines.length; index += 1) {
    const parsed = cells(lines[index]);
    if (!parsed.length) break;
    if (parsed.length !== TABLE_HEADER.length) {
      errors.push("Handoff sequence row " + (index + 1) + " must contain exactly six columns.");
      continue;
    }
    const orderGroup = Number(plain(parsed[0]));
    const slug = parseSliceCell(parsed[1]);
    const repositories = ids(parsed[2], /\bREPO-\d{3}\b/g);
    const buildUnits = ids(parsed[3], /\bBU-\d{3,}\b/g);
    const requires = isNone(parsed[4]) ? [] : sliceIds(parsed[4]);
    const stateMatch = STATE_PATTERN.exec(plain(parsed[5]));
    const state = stateMatch?.[1] || null;
    const reason = stateMatch?.[2] || null;
    const target = handoffTarget(parsed[1], layout.handoffsRoot);

    if (!Number.isInteger(orderGroup) || orderGroup < 1) errors.push("Handoff sequence row " + (index + 1) + " requires a positive integer Order group.");
    if (Number.isInteger(orderGroup) && orderGroup < previousOrderGroup) errors.push("Handoff sequence rows must be listed in ascending Order group order.");
    if (Number.isInteger(orderGroup)) previousOrderGroup = Math.max(previousOrderGroup, orderGroup);
    if (!slug) errors.push("Handoff sequence row " + (index + 1) + " requires exactly one repository-prefixed delivery-slice slug.");
    if (!repositories.length) errors.push((slug || "Handoff sequence row " + (index + 1)) + " requires at least one REPO-NNN value.");
    if (!buildUnits.length) errors.push((slug || "Handoff sequence row " + (index + 1)) + " requires at least one BU-NNN value.");
    if (!requires.length && !isNone(parsed[4])) errors.push((slug || "Handoff sequence row " + (index + 1)) + " has an invalid Requires value.");
    if (!stateMatch) errors.push((slug || "Handoff sequence row " + (index + 1)) + " has an invalid State; use Implemented, Ready, Next, Blocked, or Waiting.");
    if (state === "Blocked" && !reason) errors.push((slug || "Handoff sequence row " + (index + 1)) + " must state the exact blocking reason.");
    if (state && state !== "Blocked" && reason) errors.push((slug || "Handoff sequence row " + (index + 1)) + " may include a reason only when its State is Blocked.");
    if (["Ready", "Implemented"].includes(state) && !target) errors.push((slug || "Handoff sequence row " + (index + 1)) + " must link its current handoff receipt.");
    rows.push({ orderGroup, slug, repositories, buildUnits, requires, state, reason, target, line: index + 1 });
  }
  if (!rows.length) errors.push("Handoff sequence index requires at least one delivery-slice row.");

  const bySlug = new Map();
  for (const row of rows) {
    if (!row.slug) continue;
    if (bySlug.has(row.slug)) errors.push("Duplicate delivery slice in sequence index: " + row.slug + ".");
    else bySlug.set(row.slug, row);
  }

  const groupNumbers = [...new Set(rows.map((row) => row.orderGroup).filter(Number.isInteger))].sort((a, b) => a - b);
  for (let index = 0; index < groupNumbers.length; index += 1) {
    if (groupNumbers[index] !== index + 1) {
      errors.push("Order groups must be contiguous from 1; expected group " + (index + 1) + " but found " + groupNumbers[index] + ".");
      break;
    }
  }

  for (const row of rows) {
    for (const required of row.requires) {
      const producer = bySlug.get(required);
      if (!producer) errors.push((row.slug || "Row " + row.line) + " requires unknown delivery slice " + required + ".");
      else if (!(producer.orderGroup < row.orderGroup)) errors.push((row.slug || "Row " + row.line) + " requires " + required + " in the same or a later Order group.");
    }
  }
  dependencyCycles(rows, bySlug, errors);

  const unfinished = rows.filter((row) => row.state !== "Implemented");
  const expectedCurrent = unfinished.length ? Math.min(...unfinished.map((row) => row.orderGroup)) : null;
  if (declaredCurrentValid && declaredCurrent !== expectedCurrent) {
    errors.push("Current order group must be " + (expectedCurrent === null ? "`None.`" : expectedCurrent) + ", the lowest group with unfinished work.");
  }
  for (const row of rows) {
    if (expectedCurrent === null) {
      if (row.state !== "Implemented") errors.push((row.slug || "Row " + row.line) + " must be Implemented when Current order group is `None.`.");
      continue;
    }
    if (row.orderGroup < expectedCurrent && row.state !== "Implemented") {
      errors.push((row.slug || "Row " + row.line) + " must be Implemented before order group " + expectedCurrent + " can start.");
    } else if (row.orderGroup === expectedCurrent && !["Implemented", "Ready", "Next", "Blocked"].includes(row.state)) {
      errors.push((row.slug || "Row " + row.line) + " is in the current order group and must be Implemented, Ready, Next, or Blocked.");
    } else if (row.orderGroup > expectedCurrent && !["Waiting", "Blocked"].includes(row.state)) {
      errors.push((row.slug || "Row " + row.line) + " cannot start before every slice in order group " + expectedCurrent + " is Implemented; use Waiting or Blocked.");
    }
    if (row.state === "Implemented") {
      const unmet = row.requires.filter((required) => bySlug.get(required)?.state !== "Implemented");
      if (unmet.length) errors.push((row.slug || "Row " + row.line) + " cannot be Implemented while Requires remains unfinished: " + unmet.join(", ") + ".");
    }
  }

  for (const orderGroup of groupNumbers) {
    const blocked = rows.filter((row) => row.orderGroup === orderGroup && row.state === "Blocked" && row.slug);
    if (!blocked.length) continue;
    for (const later of rows.filter((row) => row.orderGroup > orderGroup && row.slug)) {
      if (!blocked.some((blockedRow) => transitivelyRequires(later.slug, blockedRow.slug, bySlug))) {
        errors.push(later.slug + " appears after blocked order group " + orderGroup + " without depending on its blocked work; move runnable independent slices before the blocked group and renumber unfinished groups.");
      }
    }
  }

  const buildUnitsById = buildUnitRecords(layout, errors);
  const covered = new Set();
  const slicesByBuildUnit = new Map();
  for (const row of rows) {
    for (const buildUnit of row.buildUnits) {
      covered.add(buildUnit);
      if (!slicesByBuildUnit.has(buildUnit)) slicesByBuildUnit.set(buildUnit, []);
      slicesByBuildUnit.get(buildUnit).push(row.slug);
      if (!buildUnitsById.has(buildUnit)) errors.push((row.slug || "Row " + row.line) + " references unknown " + buildUnit + ".");
      else {
        const owner = buildUnitsById.get(buildUnit).owner;
        if (/^REPO-\d{3}$/.test(owner) && !row.repositories.includes(owner)) {
          errors.push((row.slug || "Row " + row.line) + " must name owning repository " + owner + " for " + buildUnit + ".");
        }
      }
    }
  }
  for (const [buildUnit, record] of buildUnitsById) {
    if (/^REPO-\d{3}$/.test(record.owner) && !covered.has(buildUnit)) errors.push("Handoff sequence index does not place first-party " + buildUnit + " in any delivery slice.");
  }
  for (const row of rows) {
    for (const buildUnit of row.buildUnits) {
      const record = buildUnitsById.get(buildUnit);
      if (!record) continue;
      for (const dependency of record.dependencies) {
        if (row.buildUnits.includes(dependency)) continue;
        const producerSlices = slicesByBuildUnit.get(dependency) || [];
        if (!producerSlices.some((slug) => row.requires.includes(slug))) {
          errors.push((row.slug || "Row " + row.line) + " must require a slice containing direct dependency " + dependency + " of " + buildUnit + ".");
        }
      }
    }
  }

  const rowsByRepository = new Map();
  for (const row of rows) {
    for (const repository of row.repositories) {
      if (!rowsByRepository.has(repository)) rowsByRepository.set(repository, []);
      rowsByRepository.get(repository).push(row);
    }
  }
  for (const [repository, repositoryRows] of rowsByRepository) {
    if (repositoryRows.length < 2) continue;
    const ownedBuildUnits = [...buildUnitsById]
      .filter(([, record]) => record.owner === repository)
      .map(([buildUnit]) => buildUnit)
      .sort();
    const completeCoverage = ownedBuildUnits.join(",");
    const firstSliceByCoverage = new Map();
    for (const row of repositoryRows) {
      const coverage = row.buildUnits
        .filter((buildUnit) => buildUnitsById.get(buildUnit)?.owner === repository)
        .sort();
      if (!coverage.length) continue;
      const coverageKey = coverage.join(",");
      if (completeCoverage && coverageKey === completeCoverage) {
        errors.push((row.slug || "Row " + row.line) + " repeats complete Build Unit coverage for " + repository + "; refresh the existing handoff and stable workpack instead of creating another delivery slice.");
      }
      const firstSlice = firstSliceByCoverage.get(coverageKey);
      if (firstSlice) {
        errors.push((row.slug || "Row " + row.line) + " repeats the same " + repository + " Build Unit coverage as " + firstSlice + "; refresh that existing slice instead.");
      } else firstSliceByCoverage.set(coverageKey, row.slug || "row " + row.line);
    }
  }

  const receiptFiles = directHandoffFiles(layout.handoffsRoot);
  const linkedReceipts = new Map();
  for (const row of rows) {
    if (!row.target) continue;
    if (path.dirname(row.target) !== layout.handoffsRoot || path.basename(row.target).toLowerCase() === "readme.md") {
      errors.push((row.slug || "Row " + row.line) + " must link a direct handoff receipt beside README.md.");
      continue;
    }
    if (!fs.existsSync(row.target)) errors.push((row.slug || "Row " + row.line) + " links a missing handoff receipt: " + path.basename(row.target) + ".");
    if (row.slug && path.basename(row.target, ".md") !== row.slug) errors.push(row.slug + " must link the matching " + row.slug + ".md receipt.");
    linkedReceipts.set(row.target, (linkedReceipts.get(row.target) || 0) + 1);
  }
  for (const receipt of receiptFiles) {
    const count = linkedReceipts.get(receipt) || 0;
    if (count !== 1) errors.push(path.basename(receipt) + " must appear exactly once in the handoff sequence index.");
  }

  return { errors, skipped: false, rows, currentOrderGroup: expectedCurrent };
}

export function validatePlannableHandoff(rootPath, handoffPath) {
  const result = validateHandoffSequence(rootPath);
  const errors = [...result.errors];
  if (errors.length) return { ...result, errors };

  const selected = path.resolve(handoffPath);
  const matches = result.rows.filter((row) => row.target && path.resolve(row.target) === selected);
  if (matches.length !== 1) {
    errors.push("The selected Stage 9 handoff must appear exactly once in the Handoff Sequence table.");
    return { ...result, errors };
  }

  const row = matches[0];
  if (row.state === "Implemented") return { ...result, errors, selectedRow: row };
  if (row.state !== "Ready") {
    errors.push(row.slug + " is not executable while its sequence state is " + row.state + "; use Ready for a current runnable slice or Implemented for a retained completed slice.");
  }
  if (row.orderGroup !== result.currentOrderGroup) {
    errors.push(row.slug + " is in order group " + row.orderGroup + " but the current executable group is " + result.currentOrderGroup + ".");
  }
  const bySlug = new Map(result.rows.filter((candidate) => candidate.slug).map((candidate) => [candidate.slug, candidate]));
  const unmet = row.requires.filter((required) => bySlug.get(required)?.state !== "Implemented");
  if (unmet.length) errors.push(row.slug + " cannot be planned while required slices remain unfinished: " + unmet.join(", ") + ".");
  return { ...result, errors, selectedRow: row };
}
