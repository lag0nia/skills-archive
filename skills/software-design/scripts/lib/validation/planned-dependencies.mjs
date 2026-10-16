import fs from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { validationMode } from "./validation-mode.mjs";

export const PLANNED_DEPENDENCY_FIELDS = ["Producer handoff", "Expected output", "Expected contract", "Consumption point", "Availability check"];
const field = (text, name) => new RegExp("^\\s*(?:- )?\\*\\*" + name + ":\\*\\*\\s*(.+)$", "m").exec(text)?.[1]?.trim() || "";
const plain = (text) => text.replace(/[`]/g, "").trim();
const concrete = (text) => Boolean(text && !/^(?:`?None\.`?|<.*>|TODO|TBD)$/i.test(text.trim()));
const links = (text, base) => [...text.matchAll(/\[[^\]]+\]\(([^)#]+)(?:#([^)]*))?\)/g)]
  .filter((m) => !/^(?:[a-z]+:|\/\/)/i.test(m[1])).map((m) => ({ file: path.resolve(base, m[1]), anchor: m[2] || "" }));
const scopes = (text) => [...new Set(text.match(/BUILD_UNIT:BU-\d{3,}/g) || [])];
function observation(link) {
  if (!link || !fs.existsSync(link.file)) return { document: "", body: "" };
  const document = fs.readFileSync(link.file, "utf8");
  if (!link.anchor) return { document, body: document };
  const headings = [...document.matchAll(/^(#{1,6})\s+(.+)$/gm)];
  const slug = (value) => value.replace(/[`*_]/g, "").toLowerCase().replace(/[^\p{L}\p{N}_ -]/gu, "").replace(/ /g, "-");
  const index = headings.findIndex((match) => slug(match[2]) === decodeURIComponent(link.anchor).toLowerCase());
  if (index < 0) return { document, body: "" };
  const heading = headings[index];
  const next = headings.slice(index + 1).find((match) => match[1].length <= heading[1].length);
  return { document, body: document.slice(heading.index + heading[0].length, next?.index ?? document.length) };
}
function exactExecutionIdentities(document) {
  return ["Executed snapshot", "Executed workpack content"].every((name) => {
    const declarations = document.split(/\r?\n/).filter((line) => line.startsWith("**" + name + ":**"));
    return declarations.length === 1 && /^`?sha256:[a-f0-9]{64}`?$/.test(field(document, name));
  });
}
export function outputRecords(text) {
  return [...text.matchAll(/^### `?(OUTPUT-\d{3})`?[^\n]*\n([\s\S]*?)(?=^#{1,3} |$(?![\s\S]))/gm)].map((m) => ({ id: m[1], body: m[2] }));
}

// Planning authority is a canonical producer declaration, never an execution observation.
export function validateUpstreamDependency({ entry, handoff = "", handoffPath, rows, writableScopes, mode, errors }) {
  mode = validationMode(mode);
  const body = entry.body;
  const availability = plain(field(body, "Availability"));
  const planned = availability === "planned upstream output";
  const declared = Boolean(field(body, "Producer handoff"));
  const evidenceScope = plain(field(body, "Availability evidence scope"));
  if (evidenceScope && !["prerequisite", "consumer-fitness"].includes(evidenceScope)) errors.push(entry.id + " has an unknown Availability evidence scope.");
  if (evidenceScope === "prerequisite" && !declared) errors.push(entry.id + " prerequisite evidence requires an explicit upstream producer contract.");
  if (!planned && !declared) return;
  const label = entry.id;
  const base = path.dirname(handoffPath);
  for (const name of PLANNED_DEPENDENCY_FIELDS) if (!concrete(field(body, name))) errors.push(label + " requires concrete **" + name + ":** for its upstream dependency.");
  const producerScopes = scopes(field(body, "Produced by") || field(body, "Producer"));
  const owner = producerScopes.length === 1 ? producerScopes[0] : null;
  if (!owner || writableScopes.includes(owner)) errors.push(label + " planned upstream producer must be a canonical non-writable Build Unit.");
  const targets = links(field(body, "Producer handoff"), base);
  const selectedRow = rows.find((row) => row.target === handoffPath);
  const producerRow = targets.length === 1 ? rows.find((row) => row.target === targets[0].file) : null;
  if (!producerRow || !selectedRow || !selectedRow.requires.includes(producerRow.slug)
      || producerRow.orderGroup >= selectedRow.orderGroup || !producerRow.buildUnits.includes(owner?.split(":")[1])) {
    errors.push(label + " must link its canonical producer output in an earlier directly required sequence slice.");
    return;
  }
  const target = targets[0];
  if (!fs.existsSync(target.file)) { errors.push(label + " producer handoff is missing."); return; }
  const producer = fs.readFileSync(target.file, "utf8");
  const matches = outputRecords(producer).filter((record) => record.id.toLowerCase() === target.anchor);
  const output = matches.length === 1 ? matches[0] : null;
  if (!output || !/`IMPLEMENTATION_DETAILS_(READY|PARTIAL)`/.test(field(producer, "Outcome"))) {
    errors.push(label + " requires a settled producer handoff and an exact OUTPUT-NNN declaration anchor."); return;
  }
  if (plain(field(output.body, "Output")) !== plain(field(body, "Expected output"))
      || plain(field(output.body, "Contract")) !== plain(field(body, "Expected contract"))
      || field(output.body, "Owner") !== "`" + owner + "`"
      || !scopes(field(producer, "Writable build units")).includes(owner)
      || !concrete(field(output.body, "Writable paths")) || !concrete(field(output.body, "Verification"))) {
    errors.push(label + " promised output/contract/owner must match a realizable writable producer declaration; incompatible output requires reassessment.");
  }
  const root = path.resolve(base, "../../..");
  const authorities = links(field(output.body, "Contract authority"), path.dirname(target.file));
  if (!authorities.length || !authorities.some((link) => {
    const relative = path.relative(root, link.file).split(path.sep).join("/");
    if (!fs.existsSync(link.file)) return false;
    if (relative.startsWith("system-model/contracts/")) return true;
    return relative.startsWith("build/records/selections/") && /^state:\s*["']?(?:Approved|Inherited)["']?\s*$/m.test(fs.readFileSync(link.file, "utf8"));
  })) errors.push(label + " producer contract must cite canonical approved contract/selection authority, not substitute a handoff or receipt.");
  if (planned) {
    if (plain(field(body, "Maturity")) && plain(field(body, "Maturity")) !== "not-applicable") errors.push(label + " planned output cannot claim actual maturity.");
    for (const name of ["Artifact identity", "Source revision", "Integrity", "Resolution check", "Authorized access check", "Upstream receipt", "Availability evidence"]) {
      if (field(body, name) && !/^`?None\.`?$/.test(field(body, name))) errors.push(label + " planned output cannot fabricate **" + name + ":**.");
    }
    for (const name of ["Representation conformance", "Consumer challenge"]) {
      if (field(body, name) && !/^`Planned`\s*(?:—|-)/.test(field(body, name))) errors.push(label + " planned upstream proof must remain Planned: " + name + ".");
    }
    if (mode === "execution") errors.push(label + " awaits actual compatible upstream output; reconcile and verify before execution.");
  } else {
    if (!["verified existing input", "verified existing interaction", "selected-slice consumer"].includes(availability)) errors.push(label + " resolved upstream dependency must be verified existing or an explicitly owned selected-slice consumer, never a selected producer or later-lifecycle output.");
    if (evidenceScope === "prerequisite") {
      const consumer = field(body, "Consumer");
      const consumerScopes = scopes(consumer);
      const seams = [...handoff.matchAll(/^### `?(PSEAM-\d{3})`?[^\n]*\n([\s\S]*?)(?=^#{1,3} |$(?![\s\S]))/gm)];
      const owned = seams.some(([, , seam]) => (field(seam, "Covers").match(/(?:INPUT|INT)-\d{3}/g) || []).includes(label)
        && field(seam, "Implementation situation") === "`new-output`"
        && field(seam, "Current result") === "`DELTA_OWNED`"
        && scopes(field(seam, "Delta owner")).length === 1
        && scopes(field(seam, "Delta owner"))[0] === consumerScopes[0]
        && /^`OBSERVED`\s/.test(field(seam, "Producer observation"))
        && /^`SELECTED_SLICE_OUTPUT`\s/.test(field(seam, "Consumer observation"))
        && /^`PLANNED`\s/.test(field(seam, "Candidate compatibility proof"))
        && /^`planned-proof`\s/.test(field(seam, "Evidence provenance")));
      if (consumerScopes.length !== 1 || !writableScopes.includes(consumerScopes[0]) || !owned
          || availability === "verified existing interaction") errors.push(label + " prerequisite-only evidence requires a new writable consumer with owned DELTA_OWNED implementation and scheduled final proof; existing consumer fitness cannot be deferred.");
    }
    const receipts = links(field(body, "Upstream receipt"), base);
    const observedReceipt = observation(receipts.length === 1 ? receipts[0] : null);
    const receipt = observedReceipt.body;
    if ((field(receipt, "Outcome") || field(observedReceipt.document, "Outcome")) !== "`COMPLETE`" || plain(field(receipt, "Output")) !== plain(field(body, "Expected output"))
        || plain(field(receipt, "Contract")) !== plain(field(body, "Expected contract"))
        || field(receipt, "Producer") !== "`" + owner + "`"
        || !exactExecutionIdentities(observedReceipt.document)) {
      errors.push(label + " requires an actual matching completed producer receipt with exact execution identities and contract; Implemented navigation alone is insufficient.");
    }
    const proofs = links(field(body, "Availability evidence"), base);
    const proof = observation(proofs.length === 1 ? proofs[0] : null).body;
    if (evidenceScope === "prerequisite") {
      const proofBase = proofs.length === 1 ? path.dirname(proofs[0].file) : base;
      const artifacts = links(field(proof, "Artifact"), proofBase);
      const artifact = artifacts.length === 1 && fs.existsSync(artifacts[0].file) && fs.statSync(artifacts[0].file).isFile() ? artifacts[0].file : null;
      const invalidArtifact = field(proof, "Artifact") && (!artifact || plain(field(proof, "Artifact identity")) !== "sha256:" + createHash("sha256").update(fs.readFileSync(artifact)).digest("hex"));
      if (!concrete(field(proof, "Producer identity")) || invalidArtifact
          || !/^`PASS`\s*(?:—|-)\s*\S/.test(field(proof, "Producer conformance"))
          || !links(field(proof, "Producer conformance"), proofBase).some((link) => fs.existsSync(link.file))
          || !/^`(?:PASS|Not applicable)`\s*(?:—|-)\s*\S/.test(field(proof, "Existing-consumer compatibility"))
          || !links(field(proof, "Existing-consumer compatibility"), proofBase).some((link) => fs.existsSync(link.file))) {
        errors.push(label + " prerequisite evidence requires observed producer identity (and exact artifact identity when local bytes are cited), observed producer conformance and completed applicable existing-consumer compatibility (or linked bounded non-applicability).");
      }
    }
    if (field(proof, "Outcome") !== "`PASS`" || plain(field(proof, "Contract")) !== plain(field(body, "Expected contract"))
        || plain(field(proof, "Output")) !== plain(field(body, "Expected output"))
        || field(proof, "Consumer") !== field(body, "Consumer")
        || (evidenceScope === "prerequisite" ? field(proof, "Scope") !== "`prerequisite`" : field(proof, "Scope") && field(proof, "Scope") !== "`consumer-fitness`")) errors.push(label + " resolved upstream output requires actual matching " + (evidenceScope === "prerequisite" ? "prerequisite availability/contract evidence; final consumer fitness remains scheduled" : "consumer availability/compatibility evidence, not a producer receipt or prerequisite probe alone") + ".");
  }
}

export function validateCapabilityFeasibility({ handoff, handoffPath, writableScopes, entries, mode, errors }) {
  mode = validationMode(mode);
  const review = /## Delivery Slice Realizability Review\n([\s\S]*?)(?=^## |$(?![\s\S]))/m.exec(handoff)?.[1] || "";
  const capabilities = [...review.matchAll(/^### `?(CAP-\d{3})`?[^\n]*\n([\s\S]*?)(?=^#{1,3} |$(?![\s\S]))/gm)];
  if (new Set(capabilities.map((match) => match[1])).size !== capabilities.length) errors.push("Capability review contains duplicate CAP identifiers.");
  if (mode === "planning" && !capabilities.length) errors.push("Planning validation requires bounded CAP-NNN capability and writable-scope review entries.");
  const ceiling = [...field(review, "Writable paths").matchAll(/`([^`]+)`/g)].map((m) => m[1]);
  const allowedSlice = /## Allowed Delivery Slice\n([\s\S]*?)(?=^## |$(?![\s\S]))/m.exec(handoff)?.[1] || "";
  const declaredCeiling = field(allowedSlice, "Writable paths");
  if (capabilities.some((m) => plain(field(m[2], "Disposition")) === "Selected-slice output") && (!declaredCeiling || plain(declaredCeiling) !== plain(field(review, "Writable paths")))) errors.push("Capability review Writable paths must match the approved Allowed Delivery Slice ceiling.");
  const safePath = (p) => p && !path.isAbsolute(p) && !p.split("/").includes("..");
  for (const [, id, body] of capabilities) {
    for (const name of ["Capability", "Disposition", "Owner", "Allowed interface", "Required changes", "Evidence", "Verification"]) {
      if (!concrete(field(body, name)) && !(name === "Required changes" && field(body, name) === "`None.`")) errors.push(id + " lacks concrete " + name + ".");
    }
    const disposition = plain(field(body, "Disposition"));
    if (!["Existing", "Selected-slice output", "Planned upstream output"].includes(disposition)) errors.push(id + " unresolved capability/scope decision blocks planning.");
    const changes = [...field(body, "Required changes").matchAll(/`([^`]+)`/g)].map((m) => m[1]).filter((p) => p !== "None.");
    if (disposition === "Selected-slice output") {
      const owner = scopes(field(body, "Owner"));
      if (owner.length !== 1 || !writableScopes.includes(owner[0])) errors.push(id + " required capability or adapter has no permitted writable owner.");
      if (!changes.length || !ceiling.length || changes.some((p) => !safePath(p) || !ceiling.some((c) => safePath(c) && (c === "." || p === c || p.startsWith(c.replace(/\/$/, "") + "/"))))) errors.push(id + " required source/test/adapter/manifest/command-effect changes exceed the approved Writable paths ceiling.");
    } else if (changes.length) errors.push(id + " read-only capability must not make its producer writable through Required changes.");
    if (disposition === "Planned upstream output" && !entries.some((entry) => field(body, "Evidence").includes(entry.id) && plain(field(entry.body, "Availability")) === "planned upstream output")) errors.push(id + " planned capability must cite its defined INPUT/INT upstream dependency.");
    if (disposition === "Existing" && !links(field(body, "Evidence"), path.dirname(handoffPath)).some((link) => fs.existsSync(link.file))) errors.push(id + " existing capability requires allowed-interface evidence.");
  }
}
