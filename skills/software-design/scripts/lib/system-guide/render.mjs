// Render parsed guide documents to print HTML. The text is the guide's own
// Markdown text; the renderer only adds generated framing (document labels,
// scope notes, contents, and closing notes that replace links a PDF reader
// cannot follow). See references/guide-pdf-export.md.

import { pathToFileURL } from "node:url";
import { inlineText } from "./markdown.mjs";
import { classifyGuideLink } from "../model/system-guide.mjs";

export const PAGE_NUMBER_PLACEHOLDER = "00";
const CONTENTS_MINIMUM_SECTIONS = 4;
const HEADER_LABEL_LIMIT = 64;
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[char]);
const cssString = (value) => `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, "\\\"").replace(/[\n\r]/g, " ")}"`;

// Anchor prefixes stay distinct for any domain slug: "architecture", "domain-<slug>" and "edition".
export function documentPrefix(entry) {
  return entry.kind === "architecture" ? "architecture" : `domain-${entry.slug}`;
}

function anchorId(prefix, fragment) {
  return `${prefix}--${String(fragment).toLowerCase()}`;
}

function shorten(value, limit = HEADER_LABEL_LIMIT) {
  const text = String(value);
  return text.length > limit ? `${text.slice(0, limit - 1).trimEnd()}…` : text;
}

function joinNames(names) {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

const NUMBER_WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
const countWord = (count) => NUMBER_WORDS[count] || String(count);
const allDomainGuides = (count) => (count === 1 ? "its one domain guide" : count === 2 ? "both domain guides" : `all ${countWord(count)} domain guides`);

export function formatDate(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${day} ${months[month - 1]} ${year}`;
}

class RenderContext {
  constructor({ root, documents, included, pageNumbers }) {
    this.root = root;
    this.documents = new Map(documents.map((document) => [document.key, document]));
    this.included = included;
    this.pageNumbers = pageNumbers;
    this.figureNumber = 0;
    this.expected = [];
    this.internalTargets = new Set();
    this.definedIds = new Set();
    this.tocTargets = [];
    this.headings = [];
    this.related = new Map();
    this.current = null;
  }

  expect(text, line = 0, file = this.current?.file) {
    if (String(text).trim()) this.expected.push({ text: String(text), line, file });
  }

  define(id) {
    if (this.definedIds.has(id)) throw new Error(`Duplicate generated anchor ${id}.`);
    this.definedIds.add(id);
    return id;
  }

  pageOf(id) {
    return this.pageNumbers?.get(id) ?? PAGE_NUMBER_PLACEHOLDER;
  }
}

function renderInlines(nodes, context) {
  return (nodes || []).map((node) => {
    switch (node.type) {
      case "text": return escapeHtml(node.value);
      case "code": return `<code>${escapeHtml(node.value)}</code>`;
      case "strong": return `<strong>${renderInlines(node.children, context)}</strong>`;
      case "em": return `<em>${renderInlines(node.children, context)}</em>`;
      case "link": return renderLink(node, context);
      default: throw new Error(`Unsupported inline node ${node.type}.`);
    }
  }).join("");
}

function renderLink(node, context) {
  const label = renderInlines(node.children, context);
  const target = classifyGuideLink(context.root, context.current.file, node.href);
  if (target.kind === "external") return `<a href="${escapeHtml(node.href)}">${label}</a>`;
  if (target.kind === "anchor") {
    const id = anchorId(context.current.prefix, target.fragment);
    context.internalTargets.add(id);
    return `<a href="#${escapeHtml(id)}">${label}</a>`;
  }
  if (target.kind === "guide") {
    if (context.included.has(target.document)) {
      const prefix = context.documents.get(target.document).prefix;
      const id = target.fragment ? anchorId(prefix, target.fragment) : prefix;
      context.internalTargets.add(id);
      return `<a href="#${escapeHtml(id)}">${label}</a>`;
    }
    if (target.document !== context.current.key) context.related.set(target.document, context.documents.get(target.document));
    return `<span class="ref">${label}</span>`;
  }
  return `<span class="ref">${label}</span>`;
}

function renderList(block, context) {
  const tag = block.ordered ? "ol" : "ul";
  const start = block.ordered && block.start !== 1 ? ` start="${block.start}"` : "";
  const items = block.items.map((item) => {
    if (item.blocks.length === 1 && item.blocks[0].type === "paragraph") {
      context.expect(inlineText(item.blocks[0].inlines), item.line);
      return `<li>${renderInlines(item.blocks[0].inlines, context)}</li>`;
    }
    return `<li>${renderBlocks(item.blocks, context)}</li>`;
  }).join("");
  return `<${tag}${start}>${items}</${tag}>`;
}

function renderTable(block, context) {
  const align = (index) => (block.alignment[index] ? ` data-align="${block.alignment[index]}"` : "");
  const header = block.header.map((cell, index) => {
    context.expect(inlineText(cell), block.line);
    return `<th${align(index)}>${renderInlines(cell, context)}</th>`;
  }).join("");
  const rows = block.rows.map((row) => `<tr>${row.map((cell, index) => {
    context.expect(inlineText(cell), block.line);
    return `<td${align(index)}>${renderInlines(cell, context)}</td>`;
  }).join("")}</tr>`).join("");
  const labelColumn = block.header.length >= 2 ? " class=\"label-column\"" : "";
  return `<table${labelColumn}><thead><tr>${header}</tr></thead><tbody>${rows}</tbody></table>`;
}

function renderFigure(block, context) {
  context.figureNumber += 1;
  const vertical = block.steps.length > 4;
  const arrow = `<span class="arrow" aria-hidden="true">${vertical ? "↓" : "→"}</span>`;
  const steps = block.steps.map((step) => {
    const label = step.optional ? "<span class=\"step-label\">Conditional</span>" : "";
    if (step.optional) context.expect("Conditional", block.line);
    context.expect(inlineText(step.title), block.line);
    context.expect(inlineText(step.text), block.line);
    return `<div class="step${step.optional ? " optional" : ""}">${label}<span class="step-title">${renderInlines(step.title, context)}</span>${renderInlines(step.text, context)}</div>`;
  }).join(arrow);
  const legend = block.steps.some((step) => step.optional) ? "<span class=\"figure-legend\">Dashed boxes are conditional steps.</span>" : "";
  if (legend) context.expect("Dashed boxes are conditional steps.", block.line);
  context.expect(`Figure ${context.figureNumber}. ${inlineText(block.caption)}`, block.line);
  return `<figure><div class="steps${vertical ? " vertical" : ""}">${steps}</div><figcaption>${legend}Figure ${context.figureNumber}. ${renderInlines(block.caption, context)}</figcaption></figure>`;
}

// A paragraph that introduces the block after it stays on its page: any
// paragraph before a figure, and one ending in a colon before a list, table or
// code block. The browser still breaks between them when nothing else fits.
function introduces(block, next) {
  if (block.type !== "paragraph" || !next) return false;
  if (next.type === "figure") return true;
  return ["list", "table", "code"].includes(next.type) && /:\s*$/.test(inlineText(block.inlines));
}

function renderBlocks(blocks, context) {
  return blocks.map((block, index) => renderBlock(block, context, { keepWithNext: introduces(block, blocks[index + 1]) })).join("");
}

function renderBlock(block, context, { keepWithNext = false } = {}) {
  switch (block.type) {
    case "heading": {
      const id = context.define(anchorId(context.current.prefix, block.slug));
      context.expect(block.text, block.line);
      context.headings.push(block.text);
      return `<h${block.level} id="${escapeHtml(id)}">${renderInlines(block.inlines, context)}</h${block.level}>`;
    }
    case "paragraph":
      context.expect(inlineText(block.inlines), block.line);
      return `<p${keepWithNext ? " class=\"keep-with-next\"" : ""}>${renderInlines(block.inlines, context)}</p>`;
    case "list": return renderList(block, context);
    case "table": return renderTable(block, context);
    case "code":
      context.expect(block.text, block.line);
      return `<pre><code>${escapeHtml(block.text)}</code></pre>`;
    case "callout": {
      const title = block.title ? `<p class="callout-title">${renderInlines(block.title, context)}</p>` : "";
      if (block.title) context.expect(inlineText(block.title), block.line);
      return `<aside class="callout">${title}${renderBlocks(block.blocks, context)}</aside>`;
    }
    case "figure": return renderFigure(block, context);
    default: throw new Error(`Unsupported block ${block.type}.`);
  }
}

function tocEntry(context, id, title, level) {
  context.internalTargets.add(id);
  context.tocTargets.push(id);
  context.expect(title);
  const page = context.pageOf(id);
  return `<li class="${level}"><a href="#${escapeHtml(id)}"><span class="toc-title">${escapeHtml(title)}</span><span class="toc-leader"></span><span class="toc-page">${page}</span></a></li>`;
}

function documentLabel(document) {
  return document.kind === "architecture" ? "Architecture guide" : "Domain guide";
}

function scopeNote(document, context, systemName, domainNames, planned) {
  const total = domainNames.length + planned.length;
  if (document.kind === "architecture") {
    const opening = `This is the architecture guide of ${systemName}. It explains how the system works as a whole.`;
    if (!planned.length) return `${opening} Each of its ${countWord(total)} domains has a separate domain guide: ${joinNames(domainNames)}.`;
    const written = domainNames.length ? ` Domain guides exist for ${joinNames(domainNames)}.` : "";
    return `${opening} The design declares ${countWord(total)} domains.${written} The ${planned.length === 1 ? "guide" : "guides"} for ${joinNames(planned)} ${planned.length === 1 ? "is" : "are"} not written yet.`;
  }
  return `This is the domain guide for ${document.name}, one of the ${countWord(total)} domains of ${systemName}. The architecture guide, a separate document, explains how the domains work together.`;
}

function closingNotes(context, { includeRelated }) {
  // The architecture already names every domain in its scope note. Domain
  // editions retain compact navigation; exact source links stay in Markdown.
  if (!includeRelated || !context.related.size || context.current.kind === "architecture") return "";
  const related = [...context.related.values()].filter((document) => document.kind !== "architecture");
  if (!related.length) return ""; // The scope note already points to architecture.
  const text = `Other guides: ${related.map((document) => document.title).join("; ")}.`;
  context.expect(text);
  return `<section class="closing"><p>${escapeHtml(text)}</p></section>`;
}

function renderGuideDocument(document, context, options) {
  context.current = document;
  context.related = options.individual ? new Map() : context.related;
  const { prefix } = document;
  const parsed = document.document;
  const parts = [];
  const sectionId = context.define(prefix);
  context.expect(documentLabel(document));
  parts.push(`<section class="guide-doc" id="${sectionId}" style="page: ${options.pageName}">`);
  parts.push(`<p class="eyebrow">${documentLabel(document)}</p>`);
  const titleId = context.define(anchorId(prefix, parsed.titleSlug));
  context.expect(parsed.titleText, 1);
  context.headings.push(parsed.titleText);
  parts.push(`<h1 id="${titleId}">${renderInlines(parsed.title, context)}</h1>`);
  if (parsed.lede) {
    context.expect(inlineText(parsed.lede.inlines), parsed.lede.line);
    parts.push(`<p class="lede">${renderInlines(parsed.lede.inlines, context)}</p>`);
  }
  if (options.individual) {
    const note = scopeNote(document, context, options.systemName, options.domainNames, options.planned);
    context.expect(note);
    parts.push(`<p class="scope-note">${escapeHtml(note)}</p>`);
  }
  const sections = parsed.headings.filter((heading) => heading.level === 2);
  if (options.individual && sections.length >= CONTENTS_MINIMUM_SECTIONS) {
    context.expect("In this guide");
    parts.push(`<p class="contents-label">In this guide</p><ol class="toc">${sections.map((heading) => tocEntry(context, anchorId(prefix, heading.slug), heading.text, "toc-section-flat")).join("")}</ol>`);
  }
  parts.push(renderBlocks(parsed.blocks, context));
  if (options.individual) parts.push(closingNotes(context, { prefix, includeRelated: true }));
  parts.push("</section>");
  return parts.join("");
}

/**
 * Build the print HTML for one edition.
 * edition: { kind: "architecture" | "domain" | "combined", keys: [document keys in order] }
 */
export function renderEditionHtml({ root, guide, edition, generatedDate, fingerprint, cssFile, pageNumbers = null }) {
  const allDocuments = [guide.architecture, ...guide.domains].map((entry) => ({
    key: entry.key,
    kind: entry.kind,
    slug: entry.slug,
    prefix: documentPrefix(entry),
    file: entry.file,
    name: entry.name || guide.systemName,
    title: entry.document.titleText,
    document: entry.document,
  }));
  const byKey = new Map(allDocuments.map((document) => [document.key, document]));
  const included = new Set(edition.keys);
  const context = new RenderContext({ root, documents: allDocuments, included, pageNumbers });
  const domainNames = guide.domains.map((domain) => domain.name);
  const systemName = guide.systemName;
  const footer = `Generated ${formatDate(generatedDate)} · Source ${fingerprint.slice(0, 12)}`;
  const pageRules = [`@page { @top-left { content: ${cssString(shorten(systemName))}; } @bottom-left { content: ${cssString(footer)}; } }`];
  const body = [];
  let contentsAt = 0;

  if (edition.kind === "combined") {
    context.current = { file: null, prefix: "edition" };
    const statement = `The complete System Guide of ${systemName}: the architecture guide, followed by ${allDomainGuides(guide.domains.length)}.`;
    context.expect("System guide");
    context.expect(systemName);
    context.expect(statement);
    const coverList = edition.keys.map((key) => {
      const document = byKey.get(key);
      const text = `${documentLabel(document)}: ${document.title}`;
      context.expect(text);
      return `<li>${escapeHtml(text)}</li>`;
    }).join("");
    const meta = `Generated ${formatDate(generatedDate)} from the maintained guide sources. Source fingerprint ${fingerprint.slice(0, 12)}.`;
    context.expect(meta);
    context.headings.push(systemName, "Contents");
    body.push(`<section class="cover"><p class="eyebrow">System guide</p><h1 class="cover-title" id="${context.define("edition--cover")}">${escapeHtml(systemName)}</h1><p class="cover-statement">${escapeHtml(statement)}</p><ul class="cover-list">${coverList}</ul><p class="cover-meta">${escapeHtml(meta)}</p></section>`);
    // Contents follows the cover; its text is verified in that reading position.
    body.push(null);
    contentsAt = context.expected.length;
    pageRules.push(`@page contents { @top-right { content: ${cssString("System guide / Contents")}; } }`);
    pageRules.push("@page cover { @top-left { content: none; border: none; } @top-right { content: none; border: none; } @bottom-left { content: none; border: none; } @bottom-right { content: none; border: none; } }");
  }

  edition.keys.forEach((key, index) => {
    const document = byKey.get(key);
    const pageName = `doc-${index + 1}`;
    const label = document.kind === "architecture" ? "System guide / Architecture" : `System guide / ${document.name}`;
    pageRules.push(`@page ${pageName} { @top-right { content: ${cssString(shorten(label))}; } }`);
    body.push(renderGuideDocument(document, context, {
      individual: edition.kind !== "combined",
      pageName,
      systemName,
      domainNames,
      planned: guide.planned || [],
    }));
  });

  if (edition.kind === "combined") {
    context.current = { file: null, prefix: "edition", key: null };
    const contentsFrom = context.expected.length;
    context.expect("Contents");
    const entries = edition.keys.flatMap((key) => {
      const document = byKey.get(key);
      return [
        tocEntry(context, document.prefix, `${documentLabel(document)}: ${document.title}`, "toc-document"),
        ...document.document.headings.filter((heading) => heading.level === 2)
          .map((heading) => tocEntry(context, anchorId(document.prefix, heading.slug), heading.text, "toc-section")),
      ];
    });
    context.expected.splice(contentsAt, 0, ...context.expected.splice(contentsFrom));
    body[body.indexOf(null)] = `<section class="contents-page" style="page: contents"><h1 id="${context.define("edition--contents")}">Contents</h1><ol class="toc">${entries.join("")}</ol></section>`;
  }

  for (const target of context.internalTargets) {
    if (!context.definedIds.has(target)) throw new Error(`Internal link target #${target} does not exist in the rendered edition.`);
  }

  const title = edition.kind === "combined" ? `${systemName}: System Guide` : byKey.get(edition.keys[0]).title;
  const html = [
    "<!doctype html>",
    "<html lang=\"en\"><head><meta charset=\"utf-8\">",
    `<title>${escapeHtml(title)}</title>`,
    `<link rel="stylesheet" href="${pathToFileURL(cssFile).href}">`,
    `<style>${pageRules.join("\n")}</style>`,
    "</head><body>",
    body.join("\n"),
    "</body></html>",
  ].join("\n");
  return { html, title, expected: context.expected, tocTargets: context.tocTargets, headings: context.headings };
}

