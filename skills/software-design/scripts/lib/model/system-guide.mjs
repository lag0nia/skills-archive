// System Guide: the reader-facing explanation of a package, kept in guide/.
// A package adopts it explicitly with `system_guide: adopted` in
// system-model/architecture.md; without that declaration (existing format-2
// packages) none of these checks apply. See references/system-guide.md.

import fs from "node:fs";
import path from "node:path";
import { parseFrontmatter } from "./frontmatter.mjs";
import { markdownAnchorExists, markdownInlineLinks } from "./markdown.mjs";
import { parseIdList, readSystemModel, recordTitle } from "./system-model-records.mjs";
import { documentLinks, GuideMarkdownError, parseGuideMarkdown, visibleText } from "../system-guide/markdown.mjs";

export const SYSTEM_GUIDE_ADOPTED = "adopted";
export const GUIDE_ARCHITECTURE = "guide/architecture.md";
export const GUIDE_DOMAINS = "guide/domains";

// Blueprint identifiers belong in technical records and link destinations, never in text a reader sees.
const BLUEPRINT_ID = /\b(?:SR|FLOW|IFACE|STATE|INV|SEC|SCOPE|BU|REPO|CONS|SEL|VA|VE|RC|TICKET|TD|ACT|VO|LGATE|INPUT|INT|OUTPUT|PSEAM|OUTCOME|STAGE|EXC|EVID|CAP|THREAT|CONTROL)-\d{2,}(?:\.[A-Z]+-\d+)?\b|\bDOMAIN-[a-z0-9]+(?:-[a-z0-9]+)*/g;
const PACKAGE_PATH = /(?:^|[^\w/])((?:\.{1,2}\/)*(?:system-model|guide|build|ui-ux|visuals)\/[\w./#-]*|[\w-]+\.(?:md|yaml|yml|mjs|json|html))(?![\w/])/g;

const toPosix = (value) => value.split(path.sep).join("/");

export function normalizedName(value) {
  return String(value || "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

export function systemGuideDeclaration(rootPath) {
  const file = path.join(path.resolve(rootPath), "system-model/architecture.md");
  if (!fs.existsSync(file)) return undefined;
  try {
    return parseFrontmatter(fs.readFileSync(file, "utf8"), file).system_guide;
  } catch {
    return undefined;
  }
}

export function guideDomainPath(root, slug) {
  return path.join(root, GUIDE_DOMAINS, `${slug}.md`);
}

// Document identities. A domain slug is a folder name and may be any word,
// including "architecture" or "system-guide", so domain keys carry a prefix
// that the architecture guide's key cannot have.
export const ARCHITECTURE_KEY = "architecture";
export const domainKey = (slug) => `domain:${slug}`;

/**
 * Domains in architecture order: every slug the architecture record declares,
 * then any undeclared domain record. A declared domain without a record is
 * planned (`record: null`): Stage 1 declares the domain map before Stage 2
 * writes each domain record together with its guide.
 */
export function guideDomains(rootPath, model = readSystemModel(rootPath)) {
  const root = path.resolve(rootPath);
  const listed = [...new Set(parseIdList(model.architecture?.frontmatter.domains) || [])];
  const bySlug = new Map(model.domains.map((record) => [path.basename(path.dirname(record.filePath)), record]));
  const order = [...listed, ...[...bySlug.keys()].filter((slug) => !listed.includes(slug)).sort()];
  return order.map((slug) => {
    const record = bySlug.get(slug) || null;
    return {
      slug,
      key: domainKey(slug),
      name: record?.frontmatter.name || slug,
      record,
      planned: !record,
      guidePath: guideDomainPath(root, slug),
      responsibilities: record ? model.responsibilities.filter((item) => item.filePath.startsWith(path.dirname(record.filePath) + path.sep)) : [],
    };
  });
}

/**
 * Classify a guide link destination. Kinds: external, anchor, guide (another
 * guide document), record (a package file), outside (a file beyond the package).
 */
export function classifyGuideLink(rootPath, sourceFile, href) {
  const root = path.resolve(rootPath);
  if (/^(?:https?:|mailto:)/i.test(href)) return { kind: "external", href };
  const hash = href.indexOf("#");
  const target = hash === -1 ? href : href.slice(0, hash);
  const fragment = hash === -1 ? "" : href.slice(hash + 1);
  if (!target) return { kind: "anchor", file: sourceFile, fragment, exists: true };
  let decoded = target;
  try { decoded = decodeURI(target); } catch { /* keep raw */ }
  const file = path.resolve(path.dirname(sourceFile), decoded);
  const rel = toPosix(path.relative(root, file));
  const exists = fs.existsSync(file) && fs.statSync(file).isFile();
  if (rel.startsWith("../") || rel === ".." || path.isAbsolute(rel)) return { kind: "outside", file, fragment, exists };
  if (rel === GUIDE_ARCHITECTURE) return { kind: "guide", document: ARCHITECTURE_KEY, file, rel, fragment, exists };
  const domain = new RegExp(`^${GUIDE_DOMAINS}/([^/]+)\\.md$`).exec(rel);
  if (domain) return { kind: "guide", document: domainKey(domain[1]), file, rel, fragment, exists };
  return { kind: "record", file, rel, fragment, exists };
}

const RECORD_KINDS = [
  [/^system-model\/architecture\.md$/, "Architecture record"],
  [/^system-model\/domains\/[^/]+\/domain\.md$/, "Domain record"],
  [/^system-model\/domains\/[^/]+\/responsibilities\//, "Responsibility record"],
  [/^system-model\/behavior\/flows\//, "Flow record"],
  [/^system-model\/behavior\/lifecycle\.yaml$/, "Lifecycle record"],
  [/^system-model\/contracts\/interfaces\//, "Interface contract"],
  [/^system-model\/contracts\/states\//, "State contract"],
  [/^system-model\/contracts\/invariants\//, "Invariant"],
  [/^system-model\/contracts\/security\//, "Security boundary"],
  [/^system-model\/contracts\/scope\//, "Scope boundary"],
  [/^build\/units\//, "Build Unit"],
  [/^build\/repositories\//, "Repository"],
  [/^build\/records\/constraints\//, "Constraint record"],
  [/^build\/records\/selections\//, "Selection record"],
  [/^build\/records\/verification\//, "Verification record"],
  [/^build\//, "Build Design record"],
  [/^ui-ux\//, "UI/UX design"],
  [/^visuals\//, "System Explorer"],
  [/^README\.md$/, "Design package overview"],
];

function stripIdentifiers(value) {
  return String(value || "")
    .replace(BLUEPRINT_ID, "")
    .replace(/^[\s:—–-]+|[\s:—–-]+$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Reader-facing name and kind of a linked record, without identifiers or paths. */
export function recordDisplay(rootPath, file) {
  const root = path.resolve(rootPath);
  const rel = toPosix(path.relative(root, file));
  const inside = !rel.startsWith("../") && !path.isAbsolute(rel);
  const kind = inside ? (RECORD_KINDS.find(([pattern]) => pattern.test(rel))?.[1] || "Design record") : "Source document";
  let name = "";
  if (/\.md$/i.test(file) && fs.existsSync(file)) {
    const text = fs.readFileSync(file, "utf8");
    name = stripIdentifiers(recordTitle(text.replace(/^---\n[\s\S]*?\n---\n/, "")));
    if (!name) {
      try { name = stripIdentifiers(parseFrontmatter(text, file).name); } catch { /* no frontmatter */ }
    }
  } else if (/\.ya?ml$/i.test(file) && fs.existsSync(file)) {
    name = stripIdentifiers(/^name:\s*"?(.*?)"?\s*$/m.exec(fs.readFileSync(file, "utf8"))?.[1]);
  } else if (/\.html?$/i.test(file) && fs.existsSync(file)) {
    // "Loan System · States and transitions" names the page by its view; a
    // bare index page is the kind itself ("System Explorer"), not "Index".
    const title = /<title>([^<]*)<\/title>/i.exec(fs.readFileSync(file, "utf8"))?.[1] || "";
    name = stripIdentifiers(title.includes("·") ? title.split("·").pop() : "");
    if (!name && /^index\.html?$/i.test(path.basename(file))) return { name: "", kind };
  }
  if (!name) name = stripIdentifiers(path.basename(file).replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").replace(/^\w/, (char) => char.toUpperCase()));
  return { name, kind };
}

function readGuideDocument(file, errors) {
  try {
    return parseGuideMarkdown(fs.readFileSync(file, "utf8"), file);
  } catch (error) {
    if (error instanceof GuideMarkdownError) errors.push(...error.problems);
    else throw error;
    return null;
  }
}

function unexpectedEntries(directory, allowed) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true })
    .filter((entry) => !entry.name.startsWith("."))
    .filter((entry) => !allowed(entry))
    .map((entry) => path.join(directory, entry.name));
}

function anchorsOf(file, cache) {
  if (!cache.has(file)) {
    try {
      cache.set(file, new Set(parseGuideMarkdown(fs.readFileSync(file, "utf8"), file).headings.map((heading) => heading.slug)));
    } catch {
      cache.set(file, null);
    }
  }
  return cache.get(file);
}

function checkVisibleText(file, document, errors) {
  for (const fragment of visibleText(document)) {
    const text = fragment.text.replace(/\b(?:https?|mailto):\S+/g, "");
    const ids = [...new Set(text.match(BLUEPRINT_ID) || [])];
    if (ids.length) errors.push(`${file}:${fragment.line}: ${fragment.where} shows blueprint identifier ${ids.join(", ")}; write the meaningful name and keep identifiers in link destinations.`);
    const paths = [...new Set([...text.matchAll(PACKAGE_PATH)].map((match) => match[1]))];
    if (paths.length) errors.push(`${file}:${fragment.line}: ${fragment.where} shows package path ${paths.join(", ")}; name the record and link it with a descriptive label.`);
  }
}

function checkLinks(root, file, document, anchorCache, errors) {
  const targets = [];
  for (const link of documentLinks(document)) {
    if (!link.label.trim()) errors.push(`${file}:${link.line}: link to ${link.href} needs a descriptive label.`);
    const target = classifyGuideLink(root, file, link.href);
    targets.push(target);
    if (target.kind === "external") continue;
    if (target.kind === "anchor") {
      if (!document.headings.some((heading) => heading.slug === target.fragment.toLowerCase())) errors.push(`${file}:${link.line}: broken anchor #${target.fragment}.`);
      continue;
    }
    if (!target.exists) { errors.push(`${file}:${link.line}: broken link ${link.href}.`); continue; }
    if (!target.fragment) continue;
    const anchors = target.kind === "guide" ? anchorsOf(target.file, anchorCache) : null;
    const found = anchors ? anchors.has(target.fragment.toLowerCase()) : /\.md$/i.test(target.file) && markdownAnchorExists(target.file, target.fragment);
    if (!found) errors.push(`${file}:${link.line}: broken link anchor ${link.href}.`);
  }
  return targets;
}

function linksTo(targets, file) {
  return targets.some((target) => target.file && path.resolve(target.file) === path.resolve(file));
}

function recordLinksTo(recordFile, target) {
  const text = fs.readFileSync(recordFile, "utf8");
  return markdownInlineLinks(text).some(({ destination }) => {
    if (/^(?:https?:|mailto:|#)/.test(destination)) return false;
    return path.resolve(path.dirname(recordFile), destination.split("#")[0]) === path.resolve(target);
  });
}

/**
 * Validate an adopted System Guide. Returns error strings; empty when the
 * package has not adopted the guide and has no guide/ directory.
 */
export function validateSystemGuide(rootPath, model = readSystemModel(rootPath)) {
  const root = path.resolve(rootPath);
  const errors = [];
  const guideRoot = path.join(root, "guide");
  const architectureRecord = path.join(root, "system-model/architecture.md");
  const declaration = systemGuideDeclaration(root);
  if (declaration === undefined) {
    if (fs.existsSync(guideRoot)) errors.push(`${guideRoot}: a System Guide exists but ${architectureRecord} does not declare system_guide: ${SYSTEM_GUIDE_ADOPTED}; declare adoption to maintain it.`);
    return errors;
  }
  if (declaration !== SYSTEM_GUIDE_ADOPTED) {
    errors.push(`${architectureRecord}: system_guide must be ${SYSTEM_GUIDE_ADOPTED} when present.`);
    return errors;
  }

  const architectureGuide = path.join(root, GUIDE_ARCHITECTURE);
  if (!fs.existsSync(architectureGuide)) errors.push(`${architectureGuide}: required when the System Guide is adopted.`);
  for (const entry of unexpectedEntries(guideRoot, (item) => (item.isFile() && item.name === "architecture.md") || (item.isDirectory() && item.name === "domains"))) {
    errors.push(`${entry}: guide/ holds only architecture.md and domains/<domain-slug>.md.`);
  }
  for (const entry of unexpectedEntries(path.join(root, GUIDE_DOMAINS), (item) => item.isFile() && item.name.endsWith(".md"))) {
    errors.push(`${entry}: guide/domains/ holds only <domain-slug>.md files.`);
  }

  // Planned domains (declared, no record yet) have nothing to explain until
  // Stage 2 writes their record and guide together; complete exports refuse them.
  const domains = guideDomains(root, model).filter((domain) => !domain.planned);
  const canonical = new Set(domains.map((domain) => domain.slug));
  const domainGuideFiles = fs.existsSync(path.join(root, GUIDE_DOMAINS))
    ? fs.readdirSync(path.join(root, GUIDE_DOMAINS)).filter((name) => name.endsWith(".md") && !name.startsWith("."))
    : [];
  for (const name of domainGuideFiles) {
    const slug = name.slice(0, -3);
    if (!canonical.has(slug)) errors.push(`${path.join(root, GUIDE_DOMAINS, name)}: orphan domain guide; no system-model/domains/${slug}/domain.md exists. Rename it to its domain's slug or remove it.`);
  }

  const anchorCache = new Map();
  let architectureDocument = null;
  let architectureTargets = [];
  if (fs.existsSync(architectureGuide)) {
    architectureDocument = readGuideDocument(architectureGuide, errors);
    if (architectureDocument) {
      checkVisibleText(architectureGuide, architectureDocument, errors);
      architectureTargets = checkLinks(root, architectureGuide, architectureDocument, anchorCache, errors);
      if (!linksTo(architectureTargets, architectureRecord)) errors.push(`${architectureGuide}: link the technical architecture record for exact boundaries and sources of truth.`);
    }
  }

  const readme = path.join(root, "README.md");
  if (fs.existsSync(readme) && fs.existsSync(architectureGuide) && !recordLinksTo(readme, architectureGuide)) errors.push(`${readme}: must link guide/architecture.md as the System Guide.`);
  if (fs.existsSync(architectureRecord) && fs.existsSync(architectureGuide) && !recordLinksTo(architectureRecord, architectureGuide)) errors.push(`${architectureRecord}: must link ../guide/architecture.md for the reader-facing explanation.`);

  for (const domain of domains) {
    const guideExists = fs.existsSync(domain.guidePath);
    if (!guideExists) {
      errors.push(`${domain.guidePath}: missing domain guide for ${domain.name}; every canonical domain has guide/domains/${domain.slug}.md.`);
    } else if (!recordLinksTo(domain.record.filePath, domain.guidePath)) {
      errors.push(`${domain.record.filePath}: must link ../../../guide/domains/${domain.slug}.md for the reader-facing explanation.`);
    }
    if (/^## Domain Overview\s*$/m.test(domain.record.text)) errors.push(`${domain.record.filePath}: the reader-facing domain explanation lives in guide/domains/${domain.slug}.md; replace ## Domain Overview with a link after preserving its unique facts in their technical owners.`);
    if (architectureDocument) {
      if (!linksTo(architectureTargets, domain.guidePath)) errors.push(`${architectureGuide}: link the ${domain.name} domain guide.`);
      const visible = normalizedName(visibleText(architectureDocument).map((fragment) => fragment.text).join(" "));
      if (!visible.includes(normalizedName(domain.name))) errors.push(`${architectureGuide}: name the ${domain.name} domain by its canonical name.`);
    }
    if (!guideExists) continue;
    const document = readGuideDocument(domain.guidePath, errors);
    if (!document) continue;
    checkVisibleText(domain.guidePath, document, errors);
    const targets = checkLinks(root, domain.guidePath, document, anchorCache, errors);
    if (!normalizedName(document.titleText).includes(normalizedName(domain.name))) errors.push(`${domain.guidePath}:1: the title must contain the canonical domain name ${domain.name}.`);
    if (!linksTo(targets, architectureGuide)) errors.push(`${domain.guidePath}: link the architecture guide so the domain can be read in context.`);
    if (!linksTo(targets, domain.record.filePath)) errors.push(`${domain.guidePath}: link the technical domain record.`);
    const visible = normalizedName(visibleText(document).map((fragment) => fragment.text).join(" "));
    for (const responsibility of domain.responsibilities) {
      const name = responsibility.frontmatter.name || stripIdentifiers(responsibility.title);
      if (!linksTo(targets, responsibility.filePath)) errors.push(`${domain.guidePath}: link the ${name} responsibility record.`);
      if (!visible.includes(normalizedName(name)) && !visible.includes(normalizedName(stripIdentifiers(responsibility.title)))) errors.push(`${domain.guidePath}: explain the ${name} responsibility by its canonical name.`);
    }
  }
  return errors;
}

/** Read every guide document for export; throws with all problems when the guide is not exportable. */
export function readSystemGuide(rootPath) {
  const root = path.resolve(rootPath);
  const model = readSystemModel(root);
  if (systemGuideDeclaration(root) !== SYSTEM_GUIDE_ADOPTED) {
    throw new Error(`${path.join(root, "system-model/architecture.md")}: the package has not adopted the System Guide (system_guide: ${SYSTEM_GUIDE_ADOPTED}); there is nothing to export.`);
  }
  const errors = validateSystemGuide(root, model);
  if (errors.length) throw new Error(`The System Guide has problems to fix before export:\n${errors.join("\n")}`);
  const parse = (file) => parseGuideMarkdown(fs.readFileSync(file, "utf8"), file);
  const domains = guideDomains(root, model);
  return {
    root,
    systemName: model.architecture.frontmatter.name || path.basename(root),
    architecture: { key: ARCHITECTURE_KEY, kind: "architecture", file: path.join(root, GUIDE_ARCHITECTURE), document: parse(path.join(root, GUIDE_ARCHITECTURE)) },
    domains: domains.filter((domain) => !domain.planned).map((domain) => ({ key: domain.key, kind: "domain", slug: domain.slug, name: domain.name, file: domain.guidePath, document: parse(domain.guidePath) })),
    planned: domains.filter((domain) => domain.planned).map((domain) => domain.slug),
  };
}
