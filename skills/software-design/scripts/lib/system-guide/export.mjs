// System Guide PDF export: choose editions, skip unchanged outputs, print
// through headless Chromium, verify each PDF, then publish outputs together.
// A failed run leaves every existing PDF and the manifest untouched: publication
// keeps a backup of each replaced file and restores all of them on failure.

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertCurrentFormat } from "../model/package-format.mjs";
import { ARCHITECTURE_KEY, domainKey, readSystemGuide } from "../model/system-guide.mjs";
import { findBrowser, launchBrowser } from "./chromium.mjs";
import { PdfFile } from "./pdf-file.mjs";
import { renderEditionHtml } from "./render.mjs";

const SKILL_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const PDF_ASSETS = path.join(SKILL_ROOT, "assets/pdf");
const CSS_FILE = path.join(PDF_ASSETS, "guide.css");
export const MANIFEST_NAME = ".metadata/system-guide-export.json";
const FINGERPRINT_KEY = "source-fingerprint:";
const PAGE = { widthMm: 210, heightMm: 297, topMm: 26, bottomMm: 22, sideMm: 21 };
const MM_TO_PT = 72 / 25.4;
const BUNDLED_FONT = /^[A-Z]{6}\+Noto(?:Serif|Sans|SansMono|SansMath)-[A-Za-z]+$/;
const VISIBLE_ID = /\b(?:SR|FLOW|IFACE|STATE|INV|SEC|SCOPE|BU|REPO|CONS|SEL|VA|VE|RC|TICKET|TD|ACT|VO|LGATE|INPUT|INT|OUTPUT|PSEAM|OUTCOME|STAGE|EXC|EVID|CAP|THREAT|CONTROL)-\d{2,}\b|\bDOMAIN-[a-z0-9]+(?:-[a-z0-9]+)*/;

export class ExportError extends Error {}

const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
const normalizeText = (value) => String(value).normalize("NFKC").replace(/\s+/g, "").toLowerCase();

function filesUnder(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(target) : [target];
  });
}

/** Hash of everything that shapes the PDF besides the guide text: renderer code, style, fonts. */
export function rendererVersion() {
  const inputs = [
    ...filesUnder(path.join(SKILL_ROOT, "scripts/lib/system-guide")),
    path.join(SKILL_ROOT, "scripts/lib/model/system-guide.mjs"),
    path.join(SKILL_ROOT, "scripts/export-system-guide.mjs"),
    ...filesUnder(PDF_ASSETS),
  ].sort();
  const hash = crypto.createHash("sha256");
  for (const file of inputs) hash.update(path.relative(SKILL_ROOT, file)).update("\0").update(fs.readFileSync(file)).update("\0");
  return hash.digest("hex");
}

/** The real location of a path that may not exist yet: its nearest existing ancestor resolved through symlinks, plus the rest. */
export function resolvedLocation(target) {
  const absolute = path.resolve(target);
  const rest = [];
  let current = absolute;
  while (!fs.existsSync(current)) {
    const parent = path.dirname(current);
    if (parent === current) break;
    rest.unshift(path.basename(current));
    current = parent;
  }
  return path.join(fs.realpathSync.native(current), ...rest);
}

/** Whether target lies in root, judged on real paths so a symlink cannot lead into the package. */
export function insidePackage(root, target) {
  const relative = path.relative(resolvedLocation(root), resolvedLocation(target));
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

/**
 * Resolve editions within one system's export directory. Architecture and the
 * optional combined edition live at the top level; domain PDFs live in domains/.
 * --all and --combined are complete exports: they refuse a package whose
 * architecture declares a domain that has no record and guide yet.
 */
export function planEditions(guide, scopes) {
  const slugs = guide.domains.map((domain) => domain.slug);
  const planned = guide.planned || [];
  if ((scopes.all || scopes.combined) && planned.length) {
    const option = [scopes.all && "--all", scopes.combined && "--combined"].filter(Boolean).join(" and ");
    throw new ExportError(`${option} export the complete System Guide, but the architecture record declares ${planned.length === 1 ? "a domain" : "domains"} without a domain record and guide yet: ${planned.join(", ")}. Write ${planned.length === 1 ? "it" : "them"} first (Stage 2), or export the finished guides with --architecture or --domain <slug>.`);
  }
  const editions = [];
  const add = (edition) => { if (!editions.some((existing) => existing.file === edition.file)) editions.push(edition); };
  if (scopes.architecture || scopes.all) add({ kind: "architecture", keys: [ARCHITECTURE_KEY], file: "architecture.pdf" });
  for (const slug of scopes.all ? slugs : scopes.domains || []) {
    if (planned.includes(slug)) throw new ExportError(`The domain ${slug} is declared but has no domain record and guide yet; there is nothing to export for it.`);
    if (!slugs.includes(slug)) throw new ExportError(`Unknown domain ${slug}. The package's domains are: ${slugs.join(", ")}.`);
    add({ kind: "domain", keys: [domainKey(slug)], file: `domains/${slug}.pdf` });
  }
  if (scopes.combined) add({ kind: "combined", keys: [ARCHITECTURE_KEY, ...guide.domains.map((domain) => domain.key)], file: "system-guide.pdf" });
  if (!editions.length) throw new ExportError("Choose what to export: --architecture, --domain <slug> (repeatable), --all (architecture and every domain), or --combined (one complete System Guide).");
  return editions;
}

function editionSources(guide, edition) {
  const entries = new Map([guide.architecture, ...guide.domains].map((entry) => [entry.key, entry]));
  return edition.keys.map((key) => entries.get(key).file);
}

/** Fingerprint of everything that determines an edition's content, independent of the date and machine. */
function editionFingerprint(guide, edition, renderer) {
  const { html } = renderEditionHtml({
    root: guide.root,
    guide,
    edition,
    generatedDate: "2000-01-01",
    fingerprint: "0".repeat(64),
    cssFile: "/guide.css",
  });
  return sha256(`${renderer}\n${edition.kind}\n${html}`);
}

function readFingerprint(file) {
  try {
    const keywords = new PdfFile(fs.readFileSync(file)).info().Keywords || "";
    return keywords.startsWith(FINGERPRINT_KEY) ? keywords.slice(FINGERPRINT_KEY.length) : null;
  } catch {
    return null;
  }
}

function readManifest(outDir) {
  const file = path.join(outDir, MANIFEST_NAME);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function editionStatus(outDir, edition, fingerprint, manifest) {
  const file = path.join(outDir, edition.file);
  if (!fs.existsSync(file)) return "missing";
  const recorded = manifest?.outputs?.[edition.file];
  if (recorded && recorded.sha256 !== sha256(fs.readFileSync(file))) return "modified";
  if (readFingerprint(file) !== fingerprint) return "stale";
  return "current";
}

function bodyRuns(pdf, pageIndex) {
  const page = pdf.pages()[pageIndex];
  const height = page.mediaBox[3] - page.mediaBox[1];
  const top = (PAGE.topMm - 1) * MM_TO_PT;
  const bottom = height - (PAGE.bottomMm - 1) * MM_TO_PT;
  return pdf.pageText(pageIndex).filter((run) => run.y >= top && run.y <= bottom);
}

/** Check a printed edition against what the guide sources say it must contain. */
export function verifyPdf(bytes, { expected, headings, blocked = [], layoutProblems = [] }) {
  const problems = [];
  for (const url of blocked) problems.push(`The page tried to load a non-local resource, which was blocked: ${url}`);
  problems.push(...layoutProblems.map((problem) => `Layout: ${problem}`));
  const pdf = new PdfFile(bytes);
  const pages = pdf.pages();

  const foreign = new Map();
  for (let index = 0; index < pages.length; index += 1) {
    for (const run of pdf.pageText(index)) {
      if (!BUNDLED_FONT.test(run.font || "")) {
        if (!foreign.has(run.font)) foreign.set(run.font, new Set());
        for (const char of run.text) foreign.get(run.font).add(char);
      }
    }
  }
  for (const font of pdf.fonts()) {
    const name = font.baseFont || font.subtype;
    if (!BUNDLED_FONT.test(font.baseFont || "") && !foreign.has(name)) foreign.set(name, new Set());
  }
  for (const [font, chars] of foreign) {
    const shown = [...chars].filter((char) => char.trim()).map((char) => `${char} (U+${char.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")})`);
    const described = !font ? "an unidentified font" : font === "Type3" ? "a substitute (Type3) font" : font;
    problems.push(`Text was drawn with ${described} instead of the bundled fonts${shown.length ? `; characters not covered: ${shown.join(", ")}` : ""}. Replace those characters or extend assets/pdf/fonts.`);
  }

  const bodyText = pages.map((_, index) => bodyRuns(pdf, index).map((run) => run.text).join("")).join("");
  if (bodyText.includes("�")) problems.push("Some text in the PDF cannot be extracted as Unicode.");
  const visibleId = VISIBLE_ID.exec(bodyText);
  if (visibleId) problems.push(`The PDF shows the blueprint identifier ${visibleId[0]}.`);
  const haystack = normalizeText(bodyText);
  let position = 0;
  const missing = [];
  for (const item of expected) {
    const needle = normalizeText(item.text);
    if (!needle) continue;
    const found = haystack.indexOf(needle, position);
    if (found === -1) missing.push(item);
    else position = found + needle.length;
  }
  for (const item of missing.slice(0, 10)) {
    problems.push(`Text is missing or out of order in the PDF${item.file ? ` (${item.file}${item.line ? `:${item.line}` : ""})` : ""}: "${item.text.slice(0, 90)}${item.text.length > 90 ? "…" : ""}"`);
  }
  if (missing.length > 10) problems.push(`${missing.length - 10} further text blocks are missing or out of order.`);

  // Chromium derives bookmark titles from laid-out text, which can drop spaces at
  // line breaks or repeat a heading split by a page break. Each bookmark must
  // correspond to the heading at its position; its title is then rewritten exactly.
  const outline = pdf.outline();
  const bookmarkTitles = new Map();
  if (outline.length !== headings.length) {
    problems.push(`The PDF has ${outline.length} bookmarks for ${headings.length} headings.`);
  } else {
    outline.forEach((entry, index) => {
      const expectedTitle = normalizeText(headings[index]);
      const actual = normalizeText(entry.title);
      if (actual !== expectedTitle && actual !== expectedTitle.repeat(2)) problems.push(`Bookmark ${index + 1} reads "${entry.title}" where the heading is "${headings[index]}".`);
      else if (entry.title !== headings[index]) bookmarkTitles.set(entry.number, headings[index]);
    });
    let previous = 0;
    for (const entry of outline) {
      if (entry.page < previous) problems.push(`Bookmark "${entry.title}" points before the bookmark preceding it.`);
      previous = Math.max(previous, entry.page);
    }
  }

  const destinations = pdf.namedDestinations();
  for (let index = 0; index < pages.length; index += 1) {
    for (const link of pdf.links(index)) {
      if (link.dest && !destinations.has(link.dest)) problems.push(`An internal link on page ${index + 1} points to a missing destination.`);
    }
  }
  return { problems, pages: pages.length, destinations, bookmarkTitles };
}

const defaultFileOps = {
  rename: (from, to) => fs.renameSync(from, to),
  remove: (file) => fs.rmSync(file, { force: true }),
};

/**
 * Publish staged files over their destinations as one unit. Every destination
 * is checked first; each existing file is moved into backupDir before its
 * replacement is moved in; on any failure every step taken is undone in
 * reverse, so all previous files are back byte for byte. Throws ExportError.
 * entries: [{ temporary, destination }]; ops replaces rename/remove in tests.
 */
export function publishOutputs(entries, backupDir, ops = defaultFileOps) {
  const destinations = new Set();
  for (const { temporary, destination } of entries) {
    if (destinations.has(destination)) throw new ExportError(`Two outputs would be written to ${destination}; nothing was replaced.`);
    destinations.add(destination);
    if (!fs.existsSync(temporary)) throw new ExportError(`The printed file ${temporary} is missing; nothing was replaced.`);
    if (fs.existsSync(destination) && !fs.lstatSync(destination).isFile()) throw new ExportError(`${destination} exists and is not a regular file; nothing was replaced.`);
  }
  for (const directory of new Set(entries.map(({ destination }) => path.dirname(destination)))) {
    try { fs.accessSync(directory, fs.constants.W_OK); } catch { throw new ExportError(`The output directory ${directory} is not writable; nothing was replaced.`); }
  }
  fs.mkdirSync(backupDir, { recursive: true });
  const journal = [];
  try {
    entries.forEach(({ temporary, destination }, index) => {
      const step = { destination, backup: null, published: false };
      journal.push(step);
      if (fs.existsSync(destination)) {
        const backup = path.join(backupDir, `${index}-${path.basename(destination)}`);
        ops.rename(destination, backup);
        step.backup = backup;
      }
      ops.rename(temporary, destination);
      step.published = true;
    });
  } catch (error) {
    const unrestored = [];
    for (const step of journal.reverse()) {
      try {
        if (step.published) ops.remove(step.destination);
        if (step.backup) ops.rename(step.backup, step.destination);
      } catch (restoreError) {
        unrestored.push(`${step.destination}${step.backup ? ` (previous version kept at ${step.backup})` : ""}: ${restoreError.message}`);
      }
    }
    if (unrestored.length) {
      const failure = new ExportError(`Publishing failed (${error.message}) and these files could not be restored:\n  ${unrestored.join("\n  ")}`);
      failure.keepBackups = true;
      throw failure;
    }
    throw new ExportError(`Publishing failed (${error.message}); every previous file was restored and nothing was replaced.`);
  }
}

async function printEdition(browser, workDir, guide, edition, fingerprint, generatedDate) {
  const htmlFile = path.join(workDir, edition.file.replace(/\.pdf$/, ".html"));
  fs.mkdirSync(path.dirname(htmlFile), { recursive: true });
  let pageNumbers = null;
  let result;
  for (let pass = 1; pass <= 3; pass += 1) {
    const rendered = renderEditionHtml({ root: guide.root, guide, edition, generatedDate, fingerprint, cssFile: CSS_FILE, pageNumbers });
    fs.writeFileSync(htmlFile, rendered.html);
    const printed = await browser.print(htmlFile);
    const pdf = new PdfFile(printed.pdf);
    const destinations = pdf.namedDestinations();
    const numbers = new Map(rendered.tocTargets.map((id) => [id, String((destinations.get(id)?.page ?? -1) + 1)]));
    for (const [id, page] of numbers) if (page === "0") throw new ExportError(`${edition.file}: contents entry #${id} has no destination in the printed PDF.`);
    result = { rendered, printed };
    const stable = rendered.tocTargets.length === 0 || (pageNumbers && [...numbers].every(([id, page]) => pageNumbers.get(id) === page));
    if (stable) return result;
    pageNumbers = numbers;
  }
  throw new ExportError(`${edition.file}: contents page numbers did not settle after three passes.`);
}

function subjectFor(guide, edition) {
  if (edition.kind === "combined") return `${guide.systemName} System Guide: complete edition (architecture and all ${guide.domains.length} domain guides)`;
  if (edition.kind === "architecture") return `${guide.systemName} System Guide: architecture guide`;
  const domain = guide.domains.find((entry) => entry.key === edition.keys[0]);
  if (!domain) throw new ExportError(`${edition.file}: no domain guide for ${edition.keys[0]}.`);
  return `${guide.systemName} System Guide: ${domain.name} domain guide`;
}

/**
 * Export or check System Guide PDFs.
 * options: { root, outDir, scopes: { architecture, domains, all, combined }, browser, check, force, date, log, fileOps }
 */
export async function exportSystemGuide(options) {
  const root = path.resolve(options.root);
  const log = options.log || (() => {});
  assertCurrentFormat(root, "System Guide export");
  if (!options.outDir) throw new ExportError("Choose an output directory outside the design package with --out <directory>.");
  const outDir = path.resolve(options.outDir);
  if (insidePackage(root, outDir)) {
    const lexical = path.relative(root, outDir);
    const lexicallyInside = lexical === "" || (!lexical.startsWith("..") && !path.isAbsolute(lexical));
    const via = lexicallyInside ? "" : ` (through a symbolic link it resolves to ${resolvedLocation(outDir)})`;
    throw new ExportError(`The output directory ${outDir} is inside the design package${via}. Generated PDFs are never package records; choose a directory outside ${root}.`);
  }
  const generatedDate = options.date || new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(generatedDate)) throw new ExportError(`--date must be YYYY-MM-DD, not ${generatedDate}.`);

  let guide;
  try {
    guide = readSystemGuide(root);
  } catch (error) {
    throw new ExportError(error.message);
  }
  const editions = planEditions(guide, options.scopes || {});
  for (const file of [...editions.map((edition) => edition.file), MANIFEST_NAME]) {
    const destination = path.join(outDir, file);
    if (!insidePackage(outDir, destination) || insidePackage(root, destination)) {
      throw new ExportError(`The output ${destination} resolves outside the export directory or inside the design package. Remove the redirecting symbolic link first.`);
    }
  }
  const renderer = rendererVersion();
  const manifest = fs.existsSync(outDir) ? readManifest(outDir) : null;
  const planned = editions.map((edition) => {
    const fingerprint = editionFingerprint(guide, edition, renderer);
    return { edition, fingerprint, status: fs.existsSync(outDir) ? editionStatus(outDir, edition, fingerprint, manifest) : "missing" };
  });

  if (options.check) {
    for (const item of planned) log(`${item.status === "current" ? "current" : item.status}: ${path.join(outDir, item.edition.file)}`);
    return { outDir, results: planned.map(({ edition, status }) => ({ file: edition.file, status })) };
  }

  const pending = planned.filter((item) => options.force || item.status !== "current");
  const results = planned.filter((item) => !pending.includes(item)).map(({ edition }) => ({ file: edition.file, status: "unchanged" }));
  if (!pending.length) {
    for (const result of results) log(`unchanged: ${path.join(outDir, result.file)}`);
    return { outDir, results };
  }

  const browserChoice = findBrowser(options.browser);
  fs.mkdirSync(outDir, { recursive: true });
  const workDir = fs.mkdtempSync(path.join(outDir, ".system-guide-export-"));
  const written = [];
  let browser;
  let browserVersion;
  try {
    browser = await launchBrowser({
      browserPath: browserChoice.path,
      allowedRoots: [workDir, PDF_ASSETS],
      contentWidthPx: ((PAGE.widthMm - 2 * PAGE.sideMm) / 25.4) * 96,
    });
    browserVersion = browser.version;
    log(`Printing with ${browserVersion} (${browserChoice.source}).`);
    const failures = [];
    for (const item of pending) {
      const { edition, fingerprint } = item;
      const { rendered, printed } = await printEdition(browser, workDir, guide, edition, fingerprint, generatedDate);
      const verification = verifyPdf(printed.pdf, { expected: rendered.expected, headings: rendered.headings, blocked: printed.blocked, layoutProblems: printed.layoutProblems });
      if (verification.problems.length) {
        failures.push(`${edition.file}:\n  ${verification.problems.join("\n  ")}`);
        continue;
      }
      const source = new PdfFile(printed.pdf);
      const original = source.info();
      const objects = new Map([...verification.bookmarkTitles].map(([number, title]) => {
        const dictionary = source.dictionary(number);
        dictionary.set("Title", title);
        return [number, dictionary];
      }));
      const stamped = source.rewrite({
        objects,
        info: {
          Title: rendered.title,
          Subject: subjectFor(guide, edition),
          Keywords: `${FINGERPRINT_KEY}${fingerprint}`,
          Creator: "Software Design System Guide export",
          Producer: original.Producer,
          CreationDate: original.CreationDate,
          ModDate: original.ModDate,
        },
      });
      const check = new PdfFile(stamped);
      if (check.pages().length !== verification.pages) throw new ExportError(`${edition.file}: rewriting metadata changed the page count.`);
      const finalTitles = check.outline().map((entry) => entry.title);
      if (finalTitles.join("\n") !== rendered.headings.join("\n")) throw new ExportError(`${edition.file}: bookmark titles do not match the headings after rewriting.`);
      const temporary = path.join(workDir, edition.file);
      fs.writeFileSync(temporary, stamped);
      written.push({
        ...item,
        temporary,
        pages: verification.pages,
        sha256: sha256(stamped),
        title: rendered.title,
        sources: editionSources(guide, edition).map((file) => ({ path: path.relative(root, file).split(path.sep).join("/"), sha256: sha256(fs.readFileSync(file)) })),
      });
    }
    if (failures.length) throw new ExportError(`Verification failed; no PDF was replaced.\n${failures.join("\n")}`);
  } catch (error) {
    if (browser) await browser.close().catch(() => {});
    browser = null;
    fs.rmSync(workDir, { recursive: true, force: true });
    throw error;
  } finally {
    if (browser) await browser.close().catch(() => {});
  }

  const nextManifest = {
    generator: "Software Design System Guide export",
    renderer,
    package: { root, system: guide.systemName },
    regenerate: `node ${path.join(SKILL_ROOT, "scripts/export-system-guide.mjs")} --root ${root} --out ${outDir} <--architecture | --domain <slug> | --all | --combined>`,
    outputs: { ...(manifest?.outputs || {}) },
  };
  for (const item of written) {
    nextManifest.outputs[item.edition.file] = {
      edition: item.edition.kind,
      documents: item.edition.keys,
      title: item.title,
      fingerprint: item.fingerprint,
      sha256: item.sha256,
      pages: item.pages,
      generated: generatedDate,
      browser: browserVersion,
      sources: item.sources,
    };
  }
  const manifestTemporary = path.join(workDir, MANIFEST_NAME);
  fs.mkdirSync(path.dirname(manifestTemporary), { recursive: true });
  fs.writeFileSync(manifestTemporary, `${JSON.stringify(nextManifest, null, 2)}\n`);
  try {
    for (const file of [...written.map((item) => item.edition.file), MANIFEST_NAME]) fs.mkdirSync(path.dirname(path.join(outDir, file)), { recursive: true });
    publishOutputs([
      ...written.map((item) => ({ temporary: item.temporary, destination: path.join(outDir, item.edition.file) })),
      { temporary: manifestTemporary, destination: path.join(outDir, MANIFEST_NAME) },
    ], path.join(workDir, "previous"), options.fileOps);
  } catch (error) {
    if (!error.keepBackups) fs.rmSync(workDir, { recursive: true, force: true });
    throw error;
  }
  fs.rmSync(workDir, { recursive: true, force: true });
  for (const item of written) {
    results.push({ file: item.edition.file, status: "written", pages: item.pages });
    log(`written: ${path.join(outDir, item.edition.file)} (${item.pages} pages)`);
  }
  for (const result of results.filter((entry) => entry.status === "unchanged")) log(`unchanged: ${path.join(outDir, result.file)}`);
  return { outDir, results };
}
