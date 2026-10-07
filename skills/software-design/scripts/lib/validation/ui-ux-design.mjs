import fs from "node:fs";
import { readRuntimeEvidence } from "./prototype-runtime.mjs";
import path from "node:path";
import { markdownAnchorExists } from "../model/markdown.mjs";
import { embeddedScreenshotProblem } from "../model/screenshot-image.mjs";

const REQUIRED_SPEC_SECTIONS = [
  "Scope And Ownership", "Intended Users And Main Tasks", "Design Rationale",
  "Prototype Alternatives And Selection", "Product And Demo Boundary", "Journey And Route Coverage",
  "State Coverage", "Interaction And Content Rules", "Responsive And Accessibility Expectations",
  "Prototype Review", "Change Synchronization",
];
const withoutComments = (text) => text.replace(/<!--[\s\S]*?-->/g, "");
const section = (text, title) => new RegExp("^## " + title + "\\s*$([\\s\\S]*?)(?=^## |$(?![\\s\\S]))", "m").exec(text)?.[1] || "";
const links = (text) => [...text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map((m) => m[1]);
const tableRows = (text) => text.split("\n").filter((line) => /^\s*\|/.test(line)).map((line) => line.trim().slice(1, -1).split("|").map((cell) => cell.trim())).filter((cells) => cells[0] !== "Journey" && !cells.every((cell) => /^[-:\s]+$/.test(cell)));

function insideFile(target, root) {
  return target.startsWith(root + path.sep) && fs.existsSync(target) && fs.statSync(target).isFile()
    && fs.realpathSync(target).startsWith(fs.realpathSync(root) + path.sep);
}

// An optional review slideshow is a derived screenshot deck, never a product page.
// It lives only at alternatives/<candidate>/slides.html and carries this marker.
const markupOnly = (html) => withoutComments(html).replace(/<(script|style)\b([^>]*)>[\s\S]*?<\/\1\s*>/gi, "<$1$2></$1>");
const isMarkedSlideshow = (html) => /<[^>]*\bdata-review-slideshow\b/i.test(markupOnly(html));
function isReservedSlideshowPath(filePath, uiRoot) {
  const parts = path.relative(path.join(uiRoot, "alternatives"), filePath).split(path.sep);
  return parts.length === 2 && parts[0] !== ".." && parts[1] === "slides.html";
}
function isSlideshowFile(filePath, uiRoot, html = fs.readFileSync(filePath, "utf8")) {
  return isReservedSlideshowPath(filePath, uiRoot) || isMarkedSlideshow(html);
}

export function readUiUxSpecification(rootPath) {
  const root = path.resolve(rootPath);
  const specificationPath = path.join(root, "ui-ux", "specification.md");
  const errors = [];
  const result = { specificationPath, selectedPath: null, reviewed: new Map(), pending: [], errors };
  if (!fs.existsSync(specificationPath) || !fs.statSync(specificationPath).isFile()) {
    errors.push(specificationPath + ": required when ui-ux/ exists.");
    return result;
  }
  const text = withoutComments(fs.readFileSync(specificationPath, "utf8"));
  if (!/^#\s+UI\/UX Design\s*$/m.test(text)) errors.push(specificationPath + ": requires the # UI/UX Design heading.");
  for (const name of REQUIRED_SPEC_SECTIONS) if (!text.includes("## " + name + "\n")) errors.push(specificationPath + ": missing ## " + name + ".");
  const selection = /\*\*Selected implementation target:\*\*\s*`([^`]+)`/.exec(section(text, "Prototype Alternatives And Selection"))?.[1];
  if (!selection) errors.push(specificationPath + ": requires an explicit Selected implementation target in backticks (candidate entrypoint or Unresolved).");
  else if (selection !== "Unresolved") {
    const target = path.resolve(path.dirname(specificationPath), selection);
    if (!/^\.\/alternatives\/[^/]+\/(?:[^/]+\/)*[^/]+\.html$/.test(selection) || !insideFile(target, path.join(root, "ui-ux", "alternatives"))) {
      errors.push(specificationPath + ": selected candidate entrypoint must resolve under ./alternatives/<candidate>/.");
    } else if (isSlideshowFile(target, path.join(root, "ui-ux"))) {
      errors.push(specificationPath + ": selected implementation target must be a candidate product page, not a review slideshow.");
    } else result.selectedPath = target;
    if (!links(text).includes(selection)) errors.push(specificationPath + ": selected candidate must have a direct Markdown link.");
  }
  const coverage = section(text, "Journey And Route Coverage");
  const journeyIds = new Set([...coverage.matchAll(/<a\s+id=["'](journey-[^"']+)["']\s*><\/a>/g)].map((m) => m[1]));
  if (!journeyIds.size) errors.push(specificationPath + ": journey coverage requires explicit journey-* anchors.");
  function journey(cell) {
    const refs = links(cell);
    if (refs.length !== 1 || !refs[0].startsWith("#journey-") || !journeyIds.has(refs[0].slice(1))) {
      errors.push(specificationPath + ": review and pending rows must link one declared journey anchor: " + cell);
      return null;
    }
    return refs[0].slice(1);
  }
  for (const row of tableRows(section(text, "Prototype Review"))) {
    const id = journey(row[0]);
    if (row.length !== 3 || !["Reviewed", "Not reviewed", "Blocked"].includes(row[1]) || !row[2]) errors.push(specificationPath + ": review rows require Journey, Review result (Reviewed / Not reviewed / Blocked), and Evidence and limitations.");
    if (id) {
      if (result.reviewed.has(id)) errors.push(specificationPath + ": duplicate journey review: " + id);
      result.reviewed.set(id, { status: row[1], evidence: row[2] || "" });
    }
  }
  const synchronization = section(text, "Change Synchronization");
  const pendingRows = tableRows(synchronization);
  if (!pendingRows.length && !/^None\.\s*$/m.test(synchronization)) errors.push(specificationPath + ": Change Synchronization requires pending rows or explicit None.");
  for (const row of pendingRows) {
    const id = journey(row[0]);
    if (row.length !== 3 || !row[1] || !links(row[2] || "").length) errors.push(specificationPath + ": pending rows require Journey, Pending change, and linked Canonical / ticket references.");
    for (const reference of links(row[2] || "")) {
      const [local, fragment] = reference.split("#");
      const target = path.resolve(path.dirname(specificationPath), local);
      if (!local || !insideFile(target, root) || (fragment && target.endsWith(".md") && !markdownAnchorExists(target, fragment))) errors.push(specificationPath + ": pending canonical/ticket reference does not resolve: " + reference);
    }
    if (id) result.pending.push({ journey: id, change: row[1], references: row[2] });
  }
  return result;
}

// Tokenize executable JavaScript before looking for literal dependencies. Text in
// strings, comments, template text, and regex literals is not executable syntax.
function javascriptReferences(source) {
  const tokens = [];
  let offset = 0;
  const add = (type, value) => tokens.push({ type, value });
  const decode = (value) => value.replace(/\\(?:u\{([\da-f]+)\}|u([\da-f]{4})|x([\da-f]{2})|(\r\n|[\s\S]))/gi, (_, point, unicode, hex, escaped) => {
    if (point || unicode || hex) {
      const code = parseInt(point || unicode || hex, 16);
      return code <= 0x10ffff ? String.fromCodePoint(code) : "";
    }
    return ({ n: "\n", r: "\r", t: "\t", "\n": "", "\r": "", "\r\n": "" })[escaped] ?? escaped;
  });
  function scan(interpolation = false) {
    let braces = 0;
    while (offset < source.length) {
      const char = source[offset];
      if (/\s/.test(char)) { offset++; continue; }
      if (source.startsWith("//", offset)) {
        const end = source.indexOf("\n", offset + 2);
        offset = end < 0 ? source.length : end;
        continue;
      }
      if (source.startsWith("/*", offset)) {
        const end = source.indexOf("*/", offset + 2);
        offset = end < 0 ? source.length : end + 2;
        continue;
      }
      if (interpolation && char === "}" && braces === 0) { offset++; return; }
      if (char === '"' || char === "'" || char === "`") {
        const quote = char;
        const start = ++offset;
        let dynamic = false;
        while (offset < source.length && source[offset] !== quote) {
          if (source[offset] === "\\") { offset += 2; continue; }
          if (quote === "`" && source.startsWith("${", offset)) {
            dynamic = true;
            add("punctuation", "(");
            offset += 2;
            scan(true);
            add("punctuation", ")");
          } else offset++;
        }
        add(dynamic ? "dynamic" : "string", dynamic ? "" : decode(source.slice(start, offset)));
        offset++;
        continue;
      }
      // A slash after an expression is division; expression-start positions can
      // contain regex literals, whose contents must not be scanned as code.
      const previous = tokens.at(-1);
      const regexStart = !previous || /^(?:return|throw|case|typeof|void|delete|yield|await)$/.test(previous.value)
        || (previous.type === "punctuation" && /^[({[=,:;!?&|+*%~<>-]$/.test(previous.value));
      if (char === "/" && regexStart) {
        offset++;
        let inClass = false;
        while (offset < source.length) {
          const next = source[offset++];
          if (next === "\\") { offset++; continue; }
          if (next === "[") inClass = true;
          if (next === "]") inClass = false;
          if (next === "/" && !inClass) break;
        }
        while (/[a-z]/i.test(source[offset] || "")) offset++;
        add("regex", "");
        continue;
      }
      const word = /^[\w$]+/.exec(source.slice(offset));
      if (word) { add("word", word[0]); offset += word[0].length; continue; }
      if (char === "{") braces++;
      if (char === "}") braces--;
      add("punctuation", char);
      offset++;
    }
  }
  scan();
  const refs = [];
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];
    if (token.type !== "word") continue;
    const next = tokens[index + 1];
    if (["fetch", "import", "require", "WebSocket", "EventSource", "Worker"].includes(token.value)
      && next?.value === "(" && tokens[index + 2]?.type === "string"
      && ([")", ","].includes(tokens[index + 3]?.value)
        || /^(?:[a-z][\w+.-]*:|\/\/)/i.test(tokens[index + 2].value))) {
      refs.push({ value: tokens[index + 2].value });
    }
    if (!["import", "export"].includes(token.value) || tokens[index - 1]?.value === "." || ["(", "."].includes(next?.value)) continue;
    if (token.value === "import" && next?.type === "string") refs.push({ value: next.value });
    else if ((next?.type === "word" && next.value !== "default") || ["{", "*"].includes(next?.value)) {
      for (let cursor = index + 1; cursor < tokens.length && ![";", "=", "import", "export"].includes(tokens[cursor].value); cursor++) {
        if (tokens[cursor].type === "word" && tokens[cursor].value === "from" && tokens[cursor + 1]?.type === "string") {
          refs.push({ value: tokens[cursor + 1].value });
          break;
        }
      }
    }
  }
  return refs;
}

function cssReferences(source) {
  // Skip comments and unrelated quoted content; retain strings only as URL or
  // @import arguments. This also avoids treating CSS content text as a URL.
  const refs = [];
  const pattern = /\/\*[\s\S]*?\*\/|(?:url\(\s*|@import\s+(?:url\(\s*)?)(?:"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)'|([^\s'";)]+))|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/gi;
  for (const match of source.matchAll(pattern)) {
    const value = match[1] ?? match[2] ?? match[3];
    if (value !== undefined) refs.push({ value });
  }
  return refs;
}

// Literal references only. Computed dependencies and actual interaction/fidelity
// still require inspection; this is not a full JavaScript parser or runtime.
function resourceReferences(text, extension) {
  if ([".js", ".mjs"].includes(extension)) return javascriptReferences(text);
  if (extension === ".css") return cssReferences(text);
  if (extension !== ".html") return [];
  const refs = [];
  const markup = withoutComments(text).replace(/<(script|style)\b([^>]*)>([\s\S]*?)<\/\1\s*>/gi, (_, tag, attributes, body) => {
    if (tag.toLowerCase() === "style") refs.push(...cssReferences(body));
    else {
      const type = /\btype\s*=\s*["']([^"']+)["']/i.exec(attributes)?.[1].toLowerCase();
      if (!type || /^(?:module|(?:text|application)\/(?:java|ecma)script)$/.test(type)) refs.push(...javascriptReferences(body));
    }
    return `<${tag}${attributes}></${tag}>`;
  });
  for (const tag of markup.matchAll(/<(\w+)\b(?:"[^"]*"|'[^']*'|[^'">])*>/g)) {
    for (const attr of tag[0].matchAll(/\b(src|href|poster|data|action)\s*=\s*["']([^"']+)["']/gi)) refs.push({ value: attr[2], navigation: tag[1].toLowerCase() === "a" && attr[1].toLowerCase() === "href" });
    for (const attr of tag[0].matchAll(/\bsrcset\s*=\s*["']([^"']+)["']/gi)) for (const item of attr[1].split(",")) refs.push({ value: item.trim().split(/\s/)[0] });
    for (const attr of tag[0].matchAll(/\b(style|on[\w]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) {
      const value = (attr[2] ?? attr[3]).replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'").replace(/&amp;/g, "&");
      refs.push(...(attr[1].toLowerCase() === "style" ? cssReferences(value) : javascriptReferences(value)));
    }
  }
  return refs;
}

// Review slideshows reached here are collected for their own checks and never
// traversed, so deck markup and pages linked only from a deck cannot count as
// product-page interaction evidence.
function inspectResources(sourcePath, uiRoot, errors, visited, slideshows = new Set()) {
  if (visited.has(sourcePath) || slideshows.has(sourcePath)) return;
  const extension = path.extname(sourcePath);
  if (![".html", ".css", ".js", ".mjs", ".svg"].includes(extension)) { visited.add(sourcePath); return; }
  const text = fs.readFileSync(sourcePath, "utf8");
  if (extension === ".html" && isSlideshowFile(sourcePath, uiRoot, text)) { slideshows.add(sourcePath); return; }
  visited.add(sourcePath);
  for (const { value, navigation } of resourceReferences(text, extension === ".svg" ? ".html" : extension)) {
    if (/^(?:data:|#)/i.test(value)) continue;
    if (/^(?:[a-z][\w+.-]*:|\/\/)/i.test(value)) {
      if (navigation && /^(?:https?:|mailto:|\/\/)/i.test(value)) continue;
      errors.push(sourcePath + ": must not require remote runtime or resource dependencies: " + value);
      continue;
    }
    let local;
    try { local = decodeURIComponent(value.split(/[?#]/)[0]); } catch { local = value; }
    const target = path.resolve(path.dirname(sourcePath), local);
    if (!insideFile(target, uiRoot)) errors.push(sourcePath + ": local resource does not resolve inside ui-ux/: " + value);
    else inspectResources(target, uiRoot, errors, visited, slideshows);
  }
}

function htmlChecks(html, sourcePath, errors) {
  for (const [pattern, message] of [
    [/<!doctype html>/i, "must declare <!doctype html>."],
    [/<html\b[^>]*\blang=["'][^"']+["']/i, "must declare the document language."],
    [/<meta\b[^>]*\bname=["']viewport["']/i, "must declare a responsive viewport."],
    [/<main\b/i, "must contain a semantic main region."],
  ]) if (!pattern.test(html)) errors.push(sourcePath + ": " + message);
}

function interactionChecks(html, sourcePath, errors) {
  html = markupOnly(html);
  for (const [pattern, message] of [
    [/<button\b/i, "must contain keyboard-operable interaction controls."],
    [/<script\b/i, "must contain interactive behavior."],
    [/<main\b[^>]*\bdata-product-surface\b/i, "must mark the product surface separately from prototype review tools."],
    [/<[^>]*\bdata-demo-only=["'][^"']+["']/i, "must label simulated behavior with data-demo-only."],
    [/<[^>]*\bdata-prototype-disclosure\b/i, "must provide a prototype disclosure outside the product surface."],
    [/<[^>]*\bdata-product-action\b/i, "must include a meaningful product action."],
    [/<[^>]*\bdata-prototype-state=["'][^"']+["']/i, "must expose the active prototype state with data-prototype-state."],
    [/<[^>]*\bdata-product-outcome\b/i, "must include an action-specific product outcome."],
    [/<[^>]*\bdata-next-step\b/i, "must expose a next step from a representative outcome."],
    [/<[^>]*\bdata-cancel-action\b/i, "must include representative cancellation behavior."],
    [/<[^>]*\bdata-recovery-action\b/i, "must include representative failure recovery behavior."],
  ]) if (!pattern.test(html)) errors.push(sourcePath + ": " + message);
  const reviewers = [...html.matchAll(/<details\b[^>]*data-prototype-reviewer\b[^>]*>[\s\S]*?<\/details>/gi)].map((m) => m[0]);
  if (!reviewers.length || reviewers.some((reviewer) => !/<summary\b/i.test(reviewer))) errors.push(sourcePath + ": must contain a collapsible prototype reviewer area using details, summary, and data-prototype-reviewer.");
  const targets = new Set([...reviewers.join("\n").matchAll(/data-review-state-target=["']([^"']+)["']/gi)].map((m) => m[1]));
  if (targets.size < 2) errors.push(sourcePath + ": reviewer area must provide at least two representative state controls.");
  interactionSeparationChecks(html, sourcePath, errors);
}

function interactionSeparationChecks(html, sourcePath, errors) {
  html = markupOnly(html);
  const reviewers = [...html.matchAll(/<details\b[^>]*data-prototype-reviewer\b[^>]*>[\s\S]*?<\/details>/gi)].map((m) => m[0]);
  const outsideReviewer = reviewers.reduce((text, reviewer) => text.replace(reviewer, ""), html);
  if (/<[^>]*\bdata-review-(?:state-target|actor)\b/i.test(outsideReviewer)) errors.push(sourcePath + ": reviewer state and fake-actor controls must remain inside the collapsible reviewer area.");
  for (const main of html.matchAll(/<main\b[^>]*data-product-surface\b[^>]*>[\s\S]*?<\/main>/gi)) if (/data-prototype-(?:disclosure|reviewer)\b/i.test(main[0])) errors.push(sourcePath + ": prototype disclosure and reviewer tools must remain outside product content.");
  for (const nav of html.matchAll(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi)) if (/data-review-(?:state-target|actor)\b/i.test(nav[0])) errors.push(sourcePath + ": product navigation must not contain prototype reviewer controls.");
}

const placeholderText = (text) => !text || text.length < 3 || /\bTBD\b|\bTODO\b|lorem ipsum|replace (?:this|with)/i.test(text);
const decodeEntities = (text) => text.replace(/&(?:#(\d+)|#x([\da-f]+)|(amp|lt|gt|quot|apos|nbsp));/gi, (entity, decimal, hex, name) => {
  if (name) return ({ amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " })[name.toLowerCase()];
  const code = parseInt(decimal || hex, decimal ? 10 : 16);
  return code <= 0x10ffff ? String.fromCodePoint(code) : entity;
});
const visibleText = (markup) => decodeEntities(markup.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
function attribute(tag, name) {
  const match = new RegExp("\\s" + name + "\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)')", "i").exec(tag);
  return match ? decodeEntities(match[1] ?? match[2]) : null;
}

// One fixed slide order: widest viewport first; within it one role at a time (in
// order of first appearance), each role's journey before its other screens, and
// prototype-only reviewer or demo tools last.
export const SLIDE_VIEWPORTS = { desktop: 0, tablet: 1, phone: 2 };
export const SLIDE_PARTS = { journey: 0, other: 1, reviewer: 2 };

// Viewer-specific structure replaces product-page markers for a review slideshow.
// These checks cannot prove capture authenticity, fidelity, coverage, or freshness.
function reviewSlideshowChecks(html, sourcePath, errors, uiRoot = null) {
  htmlChecks(html, sourcePath, errors);
  const markup = markupOnly(html);
  const fail = (message) => errors.push(sourcePath + ": review slideshow " + message);
  if (placeholderText(visibleText(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/i.exec(markup)?.[1] || ""))) fail("requires a meaningful document title.");
  if (!/<main\b[^>]*\bdata-review-slideshow\b/i.test(markup)) fail("must mark its main region with data-review-slideshow.");
  for (const [marker, name] of [["data-slide-previous", "Previous"], ["data-slide-next", "Next"]]) {
    if (!new RegExp("<button\\b[^>]*\\b" + marker + "\\b", "i").test(markup)) fail("requires a " + name + " button marked " + marker + ".");
  }
  if (!/<[^>]*\bdata-slide-status\b/i.test(markup)) fail("requires a current/total indicator marked data-slide-status.");
  const scripts = [...withoutComments(html).matchAll(/<script\b([^>]*)>/gi)];
  if (!scripts.length) fail("requires its embedded viewer script.");
  if (scripts.some((script) => /\btype\s*=\s*["']module["']/i.test(script[1]))) fail("must use classic scripts, not modules.");
  if (/<(?:iframe|frame|object|embed|portal)\b/i.test(markup)) fail("must show captured screenshots, not embedded live pages or objects.");
  const coverage = /<(\w+)\b[^>]*\bdata-slideshow-coverage\b[^>]*>([\s\S]*?)<\/\1\s*>/i.exec(markup);
  if (!coverage || placeholderText(visibleText(coverage[2])) || !/<time\b[^>]*\bdatetime\s*=\s*["']\d{4}-\d{2}-\d{2}/i.test(coverage[2])) {
    fail("requires a data-slideshow-coverage summary with a <time datetime> capture date and meaningful coverage and omissions.");
  }
  const slides = [...markup.matchAll(/<figure\b(?=[^>]*\sdata-slide(?=[\s>=/]))([^>]*)>([\s\S]*?)<\/figure\s*>/gi)];
  if (!slides.length) fail("requires at least one <figure data-slide> screenshot slide.");
  const roleOrder = [];
  let previousKey = null;
  const compareKeys = (a, b) => a.reduce((result, value, position) => result || value - b[position], 0);
  slides.forEach(([, tag, body], index) => {
    const label = "slide " + (index + 1);
    const viewport = attribute(tag, "data-slide-viewport");
    const part = attribute(tag, "data-slide-part");
    const role = (attribute(tag, "data-slide-role") || "").trim();
    const namedRole = Boolean(role) && !/\bTBD\b/i.test(role);
    const knownViewport = Object.hasOwn(SLIDE_VIEWPORTS, viewport ?? "");
    const knownPart = Object.hasOwn(SLIDE_PARTS, part ?? "");
    if (!knownViewport) fail(label + " requires data-slide-viewport desktop, tablet, or phone.");
    if (!knownPart) fail(label + " requires data-slide-part journey, other, or reviewer.");
    else if (part !== "reviewer" && !namedRole) fail(label + " requires data-slide-role naming the role whose screen it shows.");
    if (knownViewport && knownPart && (part === "reviewer" || namedRole)) {
      // Roles keep the order in which they first appear, in every viewport.
      if (part !== "reviewer" && !roleOrder.includes(role)) roleOrder.push(role);
      const key = [SLIDE_VIEWPORTS[viewport], part === "reviewer" ? 1 : 0, part === "reviewer" ? 0 : roleOrder.indexOf(role), SLIDE_PARTS[part]];
      if (previousKey && compareKeys(key, previousKey) < 0) {
        fail(label + " (" + [viewport, part === "reviewer" ? "" : role, part].filter(Boolean).join(" · ") + ") is out of order: slides run desktop, tablet, then phone; within each, one role at a time in the same role order, each role's journey before its other screens, then reviewer tools.");
      } else previousKey = key;
    }
    const images = [...body.matchAll(/<img\b(?:"[^"]*"|'[^']*'|[^'">])*>/gi)].map((match) => match[0]);
    if (!images.length) fail(label + " requires an embedded screenshot image.");
    for (const image of images) {
      const problem = embeddedScreenshotProblem(attribute(image, "src") || "");
      if (problem) fail(label + " screenshot " + problem + ".");
      if (placeholderText((attribute(image, "alt") || "").trim())) fail(label + " requires a meaningful screenshot description in alt.");
    }
    if (placeholderText(visibleText(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption\s*>/i.exec(body)?.[1] || ""))) {
      fail(label + " requires a meaningful visible figcaption saying what the screen shows.");
    }
  });
  // Everything the deck renders is embedded. Only user-initiated navigation may
  // point elsewhere; a local link back to the prototype must resolve in place.
  for (const { value, navigation } of resourceReferences(html, ".html")) {
    if (/^(?:data:|#)/i.test(value) || (navigation && /^(?:https?:|mailto:|\/\/)/i.test(value))) continue;
    if (navigation && !/^[a-z][\w+.-]*:/i.test(value)) {
      let local;
      try { local = decodeURIComponent(value.split(/[?#]/)[0]); } catch { local = value; }
      if (uiRoot && !insideFile(path.resolve(path.dirname(sourcePath), local), uiRoot)) fail("navigation link does not resolve inside ui-ux/: " + value);
      continue;
    }
    fail("must embed every rendering resource; found external dependency: " + value);
  }
}

function slideshowFileChecks(filePath, uiRoot, errors) {
  if (!isReservedSlideshowPath(filePath, uiRoot)) {
    errors.push(filePath + ": a review slideshow must live at alternatives/<candidate>/slides.html and cannot stand in for a candidate page.");
  } else reviewSlideshowChecks(fs.readFileSync(filePath, "utf8"), filePath, errors, uiRoot);
}

export function reviewSlideshowErrors(html, sourcePath) {
  const errors = [];
  reviewSlideshowChecks(html, sourcePath, errors);
  return errors;
}

export function validateUiUxDesign(rootPath, { selectedOnly = false } = {}) {
  const root = path.resolve(rootPath);
  const uiRoot = path.join(root, "ui-ux");
  const errors = [];
  if (!fs.existsSync(uiRoot)) return { applicable: false, errors };
  if (!fs.statSync(uiRoot).isDirectory()) return { applicable: true, errors: [uiRoot + ": must be a directory."] };
  const allowed = new Set(["specification.md", "prototype.html", "alternatives", "assets"]);
  for (const entry of fs.readdirSync(uiRoot, { withFileTypes: true })) if (!entry.name.startsWith(".") && !allowed.has(entry.name)) errors.push(uiRoot + ": unsupported entry " + entry.name + ".");
  const spec = readUiUxSpecification(root);
  errors.push(...spec.errors);
  const slideshows = new Set();
  const prototypePath = path.join(uiRoot, "prototype.html");
  let launcherLinks = null;
  if (!insideFile(prototypePath, uiRoot)) errors.push(prototypePath + ": simple launcher is required.");
  else {
    const html = fs.readFileSync(prototypePath, "utf8");
    htmlChecks(html, prototypePath, errors);
    launcherLinks = resourceReferences(html, ".html").filter(({ navigation }) => navigation)
      .map(({ value }) => ({ target: path.resolve(uiRoot, value.split(/[?#]/)[0]), fragment: /#([^?]*)/.exec(value)?.[1] ?? "" }));
    // Delivery validates the selected candidate, not retained unselected resources.
    if (!selectedOnly) inspectResources(prototypePath, uiRoot, errors, new Set(), slideshows);
    if (spec.selectedPath && !resourceReferences(html, ".html").some(({ value, navigation }) => navigation && path.resolve(uiRoot, value.split(/[?#]/)[0]) === spec.selectedPath)) errors.push(prototypePath + ": launcher must link the selected candidate entrypoint.");
  }
  const alternativesRoot = path.join(uiRoot, "alternatives");
  if (!fs.existsSync(alternativesRoot) || !fs.statSync(alternativesRoot).isDirectory()) return { applicable: true, errors: [...errors, alternativesRoot + ": candidate folders are required."] };
  if (!fs.existsSync(spec.specificationPath) || !fs.statSync(spec.specificationPath).isFile()) return { applicable: true, errors };
  const specification = withoutComments(fs.readFileSync(spec.specificationPath, "utf8"));
  const entries = fs.readdirSync(alternativesRoot, { withFileTypes: true }).filter((entry) => !entry.name.startsWith("."));
  if (!entries.length) errors.push(alternativesRoot + ": requires at least one candidate folder.");
  for (const entry of entries) {
    if (!entry.isDirectory()) { errors.push(alternativesRoot + ": use candidate folders, not flat HTML alternatives: " + entry.name); continue; }
    const candidateRoot = path.join(alternativesRoot, entry.name);
    if (selectedOnly && (!spec.selectedPath || !spec.selectedPath.startsWith(candidateRoot + path.sep))) continue;
    const candidateLinks = links(specification).filter((link) => link.startsWith("./alternatives/" + entry.name + "/") && link.endsWith(".html")).map((link) => path.resolve(uiRoot, link));
    // The optional deck is linked beside, never instead of, a candidate entrypoint.
    const deckPath = path.join(candidateRoot, "slides.html");
    const entrypoints = candidateLinks.filter((link) => link !== deckPath);
    if (!entrypoints.length) errors.push(spec.specificationPath + ": must link a candidate entrypoint for " + entry.name + "." + (candidateLinks.length ? " Its review slideshow is not a candidate entrypoint." : ""));
    const visited = new Set();
    for (const entrypoint of entrypoints) {
      if (!insideFile(entrypoint, candidateRoot)) errors.push(candidateRoot + ": candidate entrypoint does not resolve: " + entrypoint);
      else inspectResources(entrypoint, uiRoot, errors, visited, slideshows);
    }
    if (insideFile(deckPath, candidateRoot)) {
      slideshows.add(deckPath);
      // Every existing deck is reachable from the launcher, opening straight into its viewer.
      if (!selectedOnly && launcherLinks && !launcherLinks.some((link) => link.target === deckPath && link.fragment === "view")) {
        errors.push(prototypePath + ": launcher must give " + entry.name + " a View slides button linking ./alternatives/" + entry.name + "/slides.html#view.");
      }
    } else if (candidateLinks.includes(deckPath)) errors.push(spec.specificationPath + ": linked review slideshow does not exist: ./alternatives/" + entry.name + "/slides.html");
    const pages = [...visited].filter((file) => file.endsWith(".html") && file.startsWith(candidateRoot + path.sep));
    const html = pages.map((file) => { const content = fs.readFileSync(file, "utf8"); htmlChecks(content, file, errors); return content; }).join("\n");
    const selected = spec.selectedPath?.startsWith(candidateRoot + path.sep);
    const reviewDeclared = [...spec.reviewed.values()].some((review) => review.status === "Reviewed");
    if (pages.length && selected && (selectedOnly || reviewDeclared)) {
      const runtime = readRuntimeEvidence(uiRoot, candidateRoot, pages);
      if (runtime) {
        errors.push(...runtime.errors);
        interactionSeparationChecks(html, candidateRoot, errors);
      }
      // Rendered observations supplement interaction presence only. Original HTML
      // and resource checks above remain mandatory; failed evidence never falls back.
      interactionChecks(runtime && !runtime.errors.length ? runtime.html : html, candidateRoot, errors);
    }
  }
  for (const slideshow of slideshows) slideshowFileChecks(slideshow, uiRoot, errors);
  return { applicable: true, errors };
}

export function validateUiUxJourneyReadiness(root, coverage, sourceDir = path.join(root, "build/workflow/handoffs")) {
  const spec = readUiUxSpecification(root);
  const errors = [...spec.errors];
  if (!spec.selectedPath) errors.push("UI readiness requires an explicitly selected candidate entrypoint.");
  const journeys = [...new Set(links(coverage).filter((link) => path.resolve(sourceDir, link.split("#")[0]) === spec.specificationPath).map((link) => link.split("#")[1]).filter(Boolean))];
  if (!journeys.length) errors.push("Covered prototype states must link selected specification journey anchors.");
  for (const journey of journeys) {
    const review = spec.reviewed.get(journey);
    if (!review || review.status !== "Reviewed" || /\b(?:TBD|blocked|not inspected|not rendered|not reviewed)\b/i.test(review.evidence)) errors.push("Selected UI journey requires reconciled rendered review: " + journey);
    if (spec.pending.some((row) => row.journey === journey)) errors.push("Pending prototype work blocks selected UI journey: " + journey);
  }
  return errors;
}
