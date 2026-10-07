import path from "node:path";

const VO_ID_PATTERN = /^(?:INV|SEC)-\d{3,}\.VO-\d{3}$/;
const THREAT_ID_PATTERN = /^SEC-\d{3,}\.THREAT-\d{3}$/;
const CONTROL_ID_PATTERN = /^SEC-\d{3,}\.CONTROL-\d{3}$/;
const RISK_VALUES = new Set(["ordinary", "high"]);

function escape(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function section(text, heading) {
  const match = new RegExp("^##\\s+" + escape(heading) + "\\s*$\\n([\\s\\S]*?)(?=^##\\s+|(?![\\s\\S]))", "m").exec(String(text || ""));
  return match ? match[1].trim() : null;
}

function entries(record, body, idPattern, family, errors) {
  if (body === null) return [];
  const headings = [...body.matchAll(/^###\s+(.+?)\s*$/gm)];
  const result = [];
  for (let index = 0; index < headings.length; index += 1) {
    const match = /^(\S+)\s+—\s+(.+)$/.exec(headings[index][1]);
    if (!match || !idPattern.test(match[1])) {
      errors.push(record.filePath + ": unexpected or malformed ### heading in " + family + ": " + headings[index][1] + ".");
      continue;
    }
    result.push({
      id: match[1],
      title: match[2].trim(),
      body: body.slice(headings[index].index + headings[index][0].length, headings[index + 1]?.index).trim(),
    });
  }
  return result;
}

function field(body, name) {
  return new RegExp("^\\*\\*" + escape(name) + ":\\*\\*\\s*(.+)$", "m").exec(String(body || ""))?.[1]?.trim() || null;
}

function concrete(value) {
  const normalized = String(value || "").trim().replace(/^`|`$/g, "").trim();
  return Boolean(normalized) && !/^(?:TBD\.?|<[^>]+>)$/i.test(normalized);
}

function referencedIds(value, pattern) {
  const flags = pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g";
  return [...String(value || "").matchAll(new RegExp(pattern.source, flags))].map((match) => match[0]);
}

function requireAnchor(record, body, id, errors) {
  const anchor = id.toLowerCase();
  const pattern = new RegExp("<a\\s+id=[\"']" + escape(anchor) + "[\"']><\\/a>\\s*\\n###\\s+" + escape(id) + "\\s+—", "i");
  if (!pattern.test(body)) errors.push(record.filePath + ": " + id + " requires a stable <a id=\"" + anchor + "\"></a> anchor immediately before its heading.");
}

function canonicalOwnerIndex(model) {
  const records = [
    ...(model.domains || []),
    ...(model.responsibilities || []),
    ...(model.flows || []),
    ...Object.values(model.contracts || {}).flat(),
  ];
  return new Map(records
    .filter((record) => record?.filePath && record?.frontmatter?.id)
    .map((record) => [path.resolve(record.filePath), record.frontmatter.id]));
}

function localMarkdownLinks(value, baseDir) {
  return [...String(value || "").matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].flatMap((match) => {
    const target = match[1].trim().replace(/^<|>$/g, "");
    if (!target || /^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith("#")) return [];
    const file = target.split("#", 1)[0];
    if (!file) return [];
    try {
      return [path.resolve(baseDir, decodeURIComponent(file))];
    } catch {
      return [];
    }
  });
}

function validateCanonicalOwner(record, item, owners, errors) {
  const value = field(item.body, "Canonical owner");
  if (!concrete(value)) return;
  const matches = [...new Set(localMarkdownLinks(value, path.dirname(record.filePath))
    .filter((filePath) => owners.has(filePath)))];
  if (matches.length !== 1) {
    errors.push(record.filePath + ": " + item.id + " Canonical owner must contain exactly one local link to a canonical System Model record.");
  }
}

function validateCommonVo(record, entry, sectionBody, errors) {
  requireAnchor(record, sectionBody, entry.id, errors);
  if (!concrete(entry.title)) errors.push(record.filePath + ": " + entry.id + " requires a concrete title.");
  for (const name of ["Claim", "Required observation", "Risk", "Evidence expectation", "Boundary cases"]) {
    const value = field(entry.body, name);
    if (!value) errors.push(record.filePath + ": " + entry.id + " is missing **" + name + ":**.");
    else if (!concrete(value)) errors.push(record.filePath + ": " + entry.id + " **" + name + ":** contains placeholder content.");
  }
  const risk = /^`(ordinary|high)`$/.exec(field(entry.body, "Risk") || "")?.[1];
  if (!RISK_VALUES.has(risk)) errors.push(record.filePath + ": " + entry.id + " Risk must be `ordinary` or `high`.");
  return risk || null;
}

function validateInvariant(record, obligations, errors) {
  const body = section(record.text, "Verification Obligations");
  if (body === null) { errors.push(record.filePath + ": missing ## Verification Obligations."); return; }
  const prefix = record.frontmatter.id + ".VO-";
  const items = entries(record, body, VO_ID_PATTERN, "Verification Obligations", errors);
  if (!items.length) {
    errors.push(record.filePath + ": Verification Obligations must define at least one stable INV-xxx.VO-NNN entry.");
    return;
  }
  for (const item of items) {
    if (!item.id.startsWith(prefix)) errors.push(record.filePath + ": " + item.id + " must use the owning invariant prefix " + prefix + ".");
    if (obligations.has(item.id)) errors.push(record.filePath + ": duplicate Verification Obligation " + item.id + ".");
    const risk = validateCommonVo(record, item, body, errors);
    obligations.set(item.id, {
      ...item,
      risk,
      recordId: record.frontmatter.id,
      record,
      kind: "invariant",
      covers: [],
      claim: field(item.body, "Claim"),
      requiredObservation: field(item.body, "Required observation"),
      evidenceExpectation: field(item.body, "Evidence expectation"),
      boundaryCases: field(item.body, "Boundary cases"),
    });
  }
}

function validateSecurity(record, obligations, owners, errors) {
  const voBody = section(record.text, "Verification Obligations");
  if (voBody === null) { errors.push(record.filePath + ": missing ## Verification Obligations."); return; }
  const threatBody = section(record.text, "Threats");
  const controlBody = section(record.text, "Required Controls");
  const prefix = record.frontmatter.id;
  const threats = entries(record, threatBody, THREAT_ID_PATTERN, "Threats", errors);
  const controls = entries(record, controlBody, CONTROL_ID_PATTERN, "Required Controls", errors);
  const vos = entries(record, voBody, VO_ID_PATTERN, "Verification Obligations", errors);
  if (!threats.length) errors.push(record.filePath + ": structured security requires at least one " + prefix + ".THREAT-NNN entry.");
  if (!controls.length) errors.push(record.filePath + ": structured security requires at least one " + prefix + ".CONTROL-NNN entry.");
  if (!vos.length) errors.push(record.filePath + ": Verification Obligations must define at least one stable " + prefix + ".VO-NNN entry.");

  const threatIds = new Set();
  for (const item of threats) {
    if (!item.id.startsWith(prefix + ".THREAT-")) errors.push(record.filePath + ": " + item.id + " must use the owning security prefix.");
    if (threatIds.has(item.id)) errors.push(record.filePath + ": duplicate security threat " + item.id + ".");
    threatIds.add(item.id);
    requireAnchor(record, threatBody, item.id, errors);
    for (const name of ["Scenario", "Affected assets or authority"]) {
      if (!concrete(field(item.body, name))) errors.push(record.filePath + ": " + item.id + " requires concrete **" + name + ":**.");
    }
  }

  const controlIds = new Set();
  const mitigatedThreats = new Set();
  for (const item of controls) {
    if (!item.id.startsWith(prefix + ".CONTROL-")) errors.push(record.filePath + ": " + item.id + " must use the owning security prefix.");
    if (controlIds.has(item.id)) errors.push(record.filePath + ": duplicate security control " + item.id + ".");
    controlIds.add(item.id);
    requireAnchor(record, controlBody, item.id, errors);
    for (const name of ["Rule", "Mitigates", "Canonical owner"]) {
      if (!concrete(field(item.body, name))) errors.push(record.filePath + ": " + item.id + " requires concrete **" + name + ":**.");
    }
    validateCanonicalOwner(record, item, owners, errors);
    const mitigates = referencedIds(field(item.body, "Mitigates"), /SEC-\d{3,}\.THREAT-\d{3}/);
    if (!mitigates.length) errors.push(record.filePath + ": " + item.id + " must mitigate at least one threat.");
    for (const id of mitigates) {
      if (!threatIds.has(id)) errors.push(record.filePath + ": " + item.id + " mitigates unknown local threat " + id + ".");
      else mitigatedThreats.add(id);
    }
  }

  const coveredControls = new Set();
  for (const item of vos) {
    if (!item.id.startsWith(prefix + ".VO-")) errors.push(record.filePath + ": " + item.id + " must use the owning security prefix.");
    if (obligations.has(item.id)) errors.push(record.filePath + ": duplicate Verification Obligation " + item.id + ".");
    const risk = validateCommonVo(record, item, voBody, errors);
    const coversValue = field(item.body, "Covers");
    if (!concrete(coversValue)) errors.push(record.filePath + ": " + item.id + " requires concrete **Covers:**.");
    const coveredThreatIds = referencedIds(coversValue, /SEC-\d{3,}\.THREAT-\d{3}/);
    const coveredControlIds = referencedIds(coversValue, /SEC-\d{3,}\.CONTROL-\d{3}/);
    if (!coveredThreatIds.length || !coveredControlIds.length) errors.push(record.filePath + ": " + item.id + " Covers must name at least one local threat and control.");
    for (const id of coveredThreatIds) if (!threatIds.has(id)) errors.push(record.filePath + ": " + item.id + " covers unknown local threat " + id + ".");
    for (const id of coveredControlIds) {
      if (!controlIds.has(id)) errors.push(record.filePath + ": " + item.id + " covers unknown local control " + id + ".");
      else coveredControls.add(id);
    }
    const covers = [...coveredThreatIds, ...coveredControlIds];
    obligations.set(item.id, {
      ...item,
      risk,
      recordId: record.frontmatter.id,
      record,
      kind: "security",
      covers,
      claim: field(item.body, "Claim"),
      requiredObservation: field(item.body, "Required observation"),
      evidenceExpectation: field(item.body, "Evidence expectation"),
      boundaryCases: field(item.body, "Boundary cases"),
    });
  }

  for (const id of threatIds) if (!mitigatedThreats.has(id)) errors.push(record.filePath + ": " + id + " has no mitigating control.");
  for (const id of controlIds) if (!coveredControls.has(id)) errors.push(record.filePath + ": " + id + " is not covered by any Verification Obligation.");
}

export function collectStructuredVerificationObligations(model, errors = []) {
  const obligations = new Map();
  const owners = canonicalOwnerIndex(model);
  for (const record of model.contracts.invariants || []) validateInvariant(record, obligations, errors);
  for (const record of model.contracts.security || []) validateSecurity(record, obligations, owners, errors);
  return obligations;
}

export function verificationAssignmentSection(text) {
  const match = /^###\s+Verification Obligation Assignments\s*$\n([\s\S]*?)(?=^#{1,3}\s+|(?![\s\S]))/m.exec(String(text || ""));
  return match ? match[1].trim() : null;
}

export function verificationAssignmentIds(text) {
  const body = verificationAssignmentSection(text);
  if (body === null) return null;
  return referencedIds(body, /(?:INV|SEC)-\d{3,}\.VO-\d{3}/);
}

export function verificationAssignmentRows(text) {
  const body = verificationAssignmentSection(text);
  if (body === null) return null;
  const lines = body.split("\n").map((line) => line.trim()).filter((line) => line.startsWith("|") && line.endsWith("|"));
  if (!lines.length) return [];
  const cells = (line) => line.slice(1, -1).split("|").map((cell) => cell.trim());
  const headers = cells(lines[0]);
  const separator = lines[1] ? cells(lines[1]) : [];
  if (headers.join("|") !== "Verification Obligation|Evidence responsibility|Required evidence or observation|State"
    || separator.length !== 4 || separator.some((cell) => !/^:?-{3,}:?$/.test(cell))) {
    return [{ invalidTable: true, headers }];
  }
  return lines.slice(2).map((line) => {
    const values = cells(line);
    const obligationIds = referencedIds(values[0], /(?:INV|SEC)-\d{3,}\.VO-\d{3}/);
    return {
      invalidTable: values.length !== 4,
      obligationId: obligationIds.length === 1 ? obligationIds[0] : null,
      obligationCell: values[0] || "",
      responsibility: values[1] || "",
      requiredEvidence: values[2] || "",
      state: values[3] || "",
    };
  });
}

export function verificationAssignmentNone(text) {
  const body = verificationAssignmentSection(text);
  if (body === null) return null;
  return /^\*\*Verification obligation assignments:\*\*\s*`?None\.`?\s*(?:—|-)\s*\S+/m.test(body);
}

export const ASSURANCE_STATUS_VALUES = new Set([
  "unassigned",
  "unmapped",
  "missing",
  "ambiguous",
  "not-run",
  "skipped",
  "failed",
  "passed",
  "stale",
  "approved-exception",
]);
