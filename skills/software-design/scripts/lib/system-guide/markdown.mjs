// Strict Markdown subset for System Guide documents. The validator and the PDF
// exporter read guides through this one parser, so a construct either renders
// exactly or fails with a line-numbered message; nothing is silently dropped.
// The supported subset is documented in references/guide-pdf-export.md.

import { markdownHeadingSlug } from "../model/markdown.mjs";

export class GuideMarkdownError extends Error {
  constructor(problems) {
    super(problems.join("\n"));
    this.problems = problems;
  }
}

const FENCE = /^(\s{0,3})(`{3,}|~{3,})\s*([^`\s]*)\s*$/;
const HEADING = /^(#{1,6})(?:[ \t]+(.*?))?[ \t]*#*[ \t]*$/;
const LIST_ITEM = /^(\s*)([-*+]|\d{1,9}[.)])(?:[ \t]+(.*))?$/;
const TABLE_SEPARATOR = /^\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)*\|?\s*$/;
const THEMATIC_BREAK = /^\s{0,3}(?:(?:-\s*){3,}|(?:\*\s*){3,}|(?:_\s*){3,})$/;
const HTML_BLOCK = /^\s{0,3}<(?:[A-Za-z][\w-]*|\/[A-Za-z]|!(?!--)|\?)/;
const FIGURE_LINE = /^(caption|step|optional)\s*:\s*(.*)$/i;

function indentWidth(line) {
  let width = 0;
  for (const char of line) {
    if (char === " ") width += 1;
    else if (char === "\t") width += 4 - (width % 4);
    else break;
  }
  return width;
}

function stripIndent(line, width) {
  let removed = 0;
  let index = 0;
  while (index < line.length && removed < width && (line[index] === " " || line[index] === "\t")) {
    removed += line[index] === "\t" ? 4 - (removed % 4) : 1;
    index += 1;
  }
  return line.slice(index);
}

// ---------------------------------------------------------------------------
// Inline content

function isWordChar(char) {
  return Boolean(char) && /[\p{L}\p{N}]/u.test(char);
}

function isSpace(char) {
  return !char || /\s/.test(char);
}

function closingBracket(text, open) {
  let depth = 0;
  for (let index = open; index < text.length; index += 1) {
    const char = text[index];
    if (char === "\\") { index += 1; continue; }
    if (char === "`") {
      const run = /^`+/.exec(text.slice(index))[0];
      const close = text.indexOf(run, index + run.length);
      if (close !== -1) { index = close + run.length - 1; continue; }
    }
    if (char === "[") depth += 1;
    else if (char === "]") {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}

function linkDestination(text, start) {
  // text[start] === "(": destination, optional title, ")"
  let index = start + 1;
  while (text[index] === " ") index += 1;
  let destination = "";
  if (text[index] === "<") {
    const close = text.indexOf(">", index);
    if (close === -1) return null;
    destination = text.slice(index + 1, close);
    index = close + 1;
  } else {
    let depth = 0;
    while (index < text.length) {
      const char = text[index];
      if (char === "\\" && index + 1 < text.length) { destination += text[index + 1]; index += 2; continue; }
      if (/\s/.test(char)) break;
      if (char === "(") depth += 1;
      if (char === ")") { if (depth === 0) break; depth -= 1; }
      destination += char;
      index += 1;
    }
  }
  while (text[index] === " ") index += 1;
  let title = null;
  if (text[index] === "\"" || text[index] === "'") {
    const quote = text[index];
    const close = text.indexOf(quote, index + 1);
    if (close === -1) return null;
    title = text.slice(index + 1, close);
    index = close + 1;
    while (text[index] === " ") index += 1;
  }
  if (text[index] !== ")") return null;
  return { destination, title, end: index + 1 };
}

/**
 * Parse inline Markdown into nodes: text, strong, em, code, link.
 * `report(message)` receives unsupported constructs.
 */
export function parseInline(source, report = () => {}, { allowLinks = true } = {}) {
  const text = String(source);
  const nodes = [];
  let buffer = "";
  const flush = () => { if (buffer) { nodes.push({ type: "text", value: buffer }); buffer = ""; } };

  for (let index = 0; index < text.length;) {
    const char = text[index];
    const next = text[index + 1];

    if (char === "\\" && next !== undefined && /[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/.test(next)) {
      buffer += next;
      index += 2;
      continue;
    }

    if (char === "`") {
      const run = /^`+/.exec(text.slice(index))[0];
      const close = text.indexOf(run, index + run.length);
      if (close === -1) { buffer += run; index += run.length; continue; }
      let value = text.slice(index + run.length, close).replace(/\n/g, " ");
      if (/^ .*[^ ].* $/.test(value)) value = value.slice(1, -1);
      flush();
      nodes.push({ type: "code", value });
      index = close + run.length;
      continue;
    }

    if (char === "!" && next === "[") {
      report("images are not supported; use a figure block or a table");
      index += 2;
      continue;
    }

    if (char === "<") {
      const autolink = /^<((?:https?|mailto):[^\s<>]+)>/i.exec(text.slice(index));
      if (autolink) {
        flush();
        nodes.push({ type: "link", href: autolink[1], title: null, children: [{ type: "text", value: autolink[1] }] });
        index += autolink[0].length;
        continue;
      }
      if (/^<!--/.test(text.slice(index))) {
        const close = text.indexOf("-->", index + 4);
        index = close === -1 ? text.length : close + 3;
        continue;
      }
      if (/^<\/?[A-Za-z]/.test(text.slice(index))) {
        report(`raw HTML is not supported: ${/^<[^>\s]*/.exec(text.slice(index))[0]}; write \\< for a literal angle bracket`);
      }
      buffer += char;
      index += 1;
      continue;
    }

    if (char === "[") {
      if (next === "^") report("footnotes are not supported; keep conditions in the sentence they qualify");
      const close = closingBracket(text, index);
      if (close !== -1 && text[close + 1] === "(") {
        const destination = linkDestination(text, close + 1);
        if (destination) {
          const label = text.slice(index + 1, close);
          if (!allowLinks) report("links cannot be nested inside link labels");
          flush();
          nodes.push({
            type: "link",
            href: destination.destination,
            title: destination.title,
            children: parseInline(label, report, { allowLinks: false }),
          });
          index = destination.end;
          continue;
        }
      }
      if (close !== -1 && text[close + 1] === "[") report("reference-style links are not supported; use inline links");
      buffer += char;
      index += 1;
      continue;
    }

    if (char === "*" || char === "_") {
      const run = text.slice(index).match(char === "*" ? /^\*+/ : /^_+/)[0];
      const strong = run.length >= 2;
      const delimiter = char.repeat(strong ? 2 : 1);
      const before = text[index - 1];
      const after = text[index + delimiter.length];
      const canOpen = !isSpace(after) && (char === "*" || !isWordChar(before));
      if (canOpen) {
        let search = index + delimiter.length;
        let closeAt = -1;
        while (search < text.length) {
          const found = text.indexOf(delimiter, search);
          if (found === -1) break;
          const prior = text[found - 1];
          const following = text[found + delimiter.length];
          const escaped = prior === "\\";
          const canClose = !escaped && !isSpace(prior) && (char === "*" || !isWordChar(following))
            && (strong || text[found + 1] !== char || text[found + 2] === char);
          if (canClose && found > index + delimiter.length) { closeAt = found; break; }
          search = found + 1;
        }
        if (closeAt !== -1) {
          flush();
          nodes.push({
            type: strong ? "strong" : "em",
            children: parseInline(text.slice(index + delimiter.length, closeAt), report, { allowLinks }),
          });
          index = closeAt + delimiter.length;
          continue;
        }
      }
      buffer += run;
      index += run.length;
      continue;
    }

    buffer += char === "\n" ? " " : char;
    index += 1;
  }
  flush();
  return nodes;
}

export function inlineText(nodes) {
  return (nodes || []).map((node) => (node.type === "text" || node.type === "code" ? node.value : inlineText(node.children))).join("");
}

export function inlineLinks(nodes, result = []) {
  for (const node of nodes || []) {
    if (node.type === "link") result.push(node);
    if (node.children) inlineLinks(node.children, result);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Blocks

function splitTableRow(line) {
  let value = line.trim();
  if (value.startsWith("|")) value = value.slice(1);
  if (value.endsWith("|") && !value.endsWith("\\|")) value = value.slice(0, -1);
  const cells = [];
  let current = "";
  let code = 0;
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (char === "\\" && value[index + 1] === "|") { current += "\\|"; index += 1; continue; }
    if (char === "`") code = code ? 0 : 1;
    if (char === "|" && !code) { cells.push(current.trim()); current = ""; continue; }
    current += char;
  }
  cells.push(current.trim());
  return cells;
}

function tableAlignment(cell) {
  const value = cell.replace(/\s/g, "");
  if (value.startsWith(":") && value.endsWith(":")) return "center";
  if (value.endsWith(":")) return "right";
  return null;
}

function parseFigure(lines, startLine, report) {
  const figure = { type: "figure", caption: null, steps: [], line: startLine };
  for (const [offset, raw] of lines.entries()) {
    const line = raw.trim();
    if (!line) continue;
    const match = FIGURE_LINE.exec(line);
    const at = startLine + offset + 1;
    if (!match) { report(at, "figure lines are `caption: <text>`, `step: <title> | <explanation>`, or `optional: <title> | <condition and explanation>`"); continue; }
    const kind = match[1].toLowerCase();
    if (kind === "caption") {
      if (figure.caption) report(at, "a figure has one caption");
      figure.caption = parseInline(match[2], (message) => report(at, message));
      continue;
    }
    const [title, ...rest] = match[2].split("|");
    if (!title.trim() || !rest.join("|").trim()) { report(at, "a figure step needs a title and an explanation separated by |"); continue; }
    figure.steps.push({
      optional: kind === "optional",
      title: parseInline(title.trim(), (message) => report(at, message)),
      text: parseInline(rest.join("|").trim(), (message) => report(at, message)),
    });
  }
  if (!figure.caption) report(startLine, "a figure needs a caption line that says what the reader should notice");
  if (figure.steps.length < 2) report(startLine, "a figure needs at least two steps; use a sentence for a single step");
  if (figure.steps.length > 8) report(startLine, "a figure has at most eight steps; split the mechanism or use a table");
  return figure;
}

class BlockParser {
  constructor(lines, firstLine, report, context) {
    this.lines = lines;
    this.firstLine = firstLine;
    this.report = report;
    this.context = context;
    this.index = 0;
  }

  lineNumber(index = this.index) {
    return this.firstLine + index;
  }

  inline(text, line) {
    return parseInline(text, (message) => this.report(line, message));
  }

  startsBlock(line) {
    return HEADING.test(line.trimStart()) && /^\s{0,3}#/.test(line)
      || FENCE.test(line)
      || /^\s{0,3}>/.test(line)
      || LIST_ITEM.test(line) && indentWidth(line) < 4
      || THEMATIC_BREAK.test(line)
      || /^\s*\|/.test(line);
  }

  parse() {
    const blocks = [];
    while (this.index < this.lines.length) {
      const line = this.lines[this.index];
      if (!line.trim()) { this.index += 1; continue; }
      const block = this.block(line);
      if (block) blocks.push(block);
    }
    return blocks;
  }

  block(line) {
    const at = this.lineNumber();
    if (/^\s*<!--/.test(line)) return this.comment();
    const fence = FENCE.exec(line);
    if (fence) return this.fenced(fence);
    if (/^\s{0,3}#/.test(line) && HEADING.test(line.trimStart())) {
      const [, hashes, content = ""] = HEADING.exec(line.trimStart());
      this.index += 1;
      if (!this.context.headings) { this.report(at, "headings are not supported here"); return null; }
      if (hashes.length > 4) this.report(at, "use heading levels 1 to 4; deeper nesting makes a guide hard to navigate");
      if (!content.trim()) this.report(at, "a heading needs text");
      return { type: "heading", level: Math.min(hashes.length, 4), inlines: this.inline(content, at), line: at };
    }
    if (THEMATIC_BREAK.test(line)) {
      this.index += 1;
      this.report(at, "horizontal rules are not supported; start a new section with a heading");
      return null;
    }
    if (/^\s{0,3}>/.test(line)) return this.callout();
    if (LIST_ITEM.test(line) && indentWidth(line) < 4) return this.list(indentWidth(line));
    if (/^\s*\|/.test(line)) {
      if (TABLE_SEPARATOR.test(this.lines[this.index + 1] || "")) return this.table();
      while (this.index < this.lines.length && /^\s*\|/.test(this.lines[this.index])) this.index += 1;
      this.report(at, "a table needs a header row followed by a separator row such as | --- | --- |");
      return null;
    }
    if (HTML_BLOCK.test(line)) {
      this.index += 1;
      this.report(at, "raw HTML is not supported in guides");
      return null;
    }
    if (indentWidth(line) >= 4) {
      this.index += 1;
      this.report(at, "indented code blocks are not supported; use a fenced block");
      return null;
    }
    return this.paragraph();
  }

  comment() {
    while (this.index < this.lines.length) {
      const line = this.lines[this.index];
      this.index += 1;
      if (line.includes("-->")) {
        if (line.slice(line.indexOf("-->") + 3).trim()) this.report(this.lineNumber(this.index - 1), "put content after a comment on its own line");
        return null;
      }
    }
    this.report(this.lineNumber(this.index - 1), "unclosed HTML comment");
    return null;
  }

  fenced([, indent, marker, info]) {
    const at = this.lineNumber();
    const body = [];
    this.index += 1;
    let closed = false;
    while (this.index < this.lines.length) {
      const line = this.lines[this.index];
      this.index += 1;
      if (new RegExp("^\\s{0,3}" + marker[0] + "{" + marker.length + ",}\\s*$").test(line)) { closed = true; break; }
      body.push(stripIndent(line, indent.length));
    }
    if (!closed) this.report(at, "unclosed fenced block");
    if (info.toLowerCase() === "figure") {
      if (!this.context.figures) { this.report(at, "figures are not supported here"); return null; }
      return parseFigure(body, at, this.report);
    }
    return { type: "code", language: info || null, text: body.join("\n"), line: at };
  }

  paragraph() {
    const at = this.lineNumber();
    const parts = [];
    while (this.index < this.lines.length) {
      const line = this.lines[this.index];
      if (!line.trim()) break;
      if (parts.length && (this.startsBlock(line) || /^\s*<!--/.test(line))) break;
      if (parts.length && /^\s{0,3}(?:=+|-+)\s*$/.test(line)) {
        this.report(this.lineNumber(), "underlined (setext) headings are not supported; use # headings");
        this.index += 1;
        continue;
      }
      parts.push(line.trim());
      this.index += 1;
    }
    return { type: "paragraph", inlines: this.inline(parts.join("\n"), at), line: at };
  }

  table() {
    const at = this.lineNumber();
    const header = splitTableRow(this.lines[this.index]);
    const alignment = splitTableRow(this.lines[this.index + 1]).map(tableAlignment);
    this.index += 2;
    if (alignment.length !== header.length) this.report(at, "the table separator row must have one cell per header");
    const rows = [];
    const rowLines = [];
    while (this.index < this.lines.length && /^\s*\|/.test(this.lines[this.index])) {
      const rowAt = this.lineNumber();
      const cells = splitTableRow(this.lines[this.index]);
      if (cells.length !== header.length) this.report(rowAt, `table row has ${cells.length} cells; the header has ${header.length}`);
      rows.push(cells.map((cell) => this.inline(cell, rowAt)));
      rowLines.push(rowAt);
      this.index += 1;
    }
    if (!rows.length) this.report(at, "a table needs at least one row");
    return { type: "table", header: header.map((cell) => this.inline(cell, at)), alignment, rows, rowLines, line: at };
  }

  callout() {
    const at = this.lineNumber();
    const inner = [];
    while (this.index < this.lines.length && /^\s{0,3}>/.test(this.lines[this.index])) {
      inner.push(this.lines[this.index].replace(/^\s{0,3}> ?/, ""));
      this.index += 1;
    }
    if (!this.context.callouts) { this.report(at, "nested quotations are not supported"); return null; }
    // A first line that is entirely bold text titles the callout.
    let title = null;
    let offset = 0;
    const titleLine = /^\s*\*\*(.+)\*\*\s*$/.exec(inner[0] || "");
    if (titleLine && !titleLine[1].includes("**")) {
      title = this.inline(titleLine[1], at);
      offset = 1;
    }
    const blocks = new BlockParser(inner.slice(offset), at + offset, this.report, { headings: false, callouts: false, figures: false, lists: true }).parse();
    for (const block of blocks) {
      if (!["paragraph", "list"].includes(block.type)) this.report(block.line, "a callout contains paragraphs and lists only");
    }
    if (!blocks.length) this.report(at, "a callout needs content");
    return { type: "callout", title, blocks, line: at };
  }

  list(baseIndent) {
    const at = this.lineNumber();
    const first = LIST_ITEM.exec(this.lines[this.index]);
    const ordered = /\d/.test(first[2]);
    const list = { type: "list", ordered, start: ordered ? Number.parseInt(first[2], 10) : 1, items: [], line: at };
    if (!this.context.lists) this.report(at, "lists are not supported here");
    while (this.index < this.lines.length) {
      const line = this.lines[this.index];
      const match = LIST_ITEM.exec(line);
      if (!match || indentWidth(line) !== baseIndent) break;
      if (/\d/.test(match[2]) !== ordered) break;
      const itemAt = this.lineNumber();
      const contentIndent = baseIndent + match[2].length + 1;
      const content = [match[3] || ""];
      this.index += 1;
      while (this.index < this.lines.length) {
        const next = this.lines[this.index];
        if (!next.trim()) {
          const following = this.lines.slice(this.index + 1).find((value) => value.trim());
          if (following !== undefined && indentWidth(following) >= contentIndent) { content.push(""); this.index += 1; continue; }
          break;
        }
        const nextItem = LIST_ITEM.exec(next);
        if (nextItem && indentWidth(next) < contentIndent) break;
        if (indentWidth(next) >= contentIndent) { content.push(stripIndent(next, contentIndent)); this.index += 1; continue; }
        if (this.startsBlock(next) || content[content.length - 1] === "") break;
        content.push(next.trim());
        this.index += 1;
      }
      const blocks = new BlockParser(content, itemAt, this.report, { headings: false, callouts: false, figures: false, lists: true }).parse();
      for (const block of blocks) {
        if (!["paragraph", "list"].includes(block.type)) this.report(block.line, "a list item contains text and nested lists only");
      }
      list.items.push({ blocks, line: itemAt });
      while (this.index < this.lines.length && !this.lines[this.index].trim()) {
        const following = this.lines.slice(this.index + 1).find((value) => value.trim());
        const followingItem = following !== undefined && LIST_ITEM.exec(following);
        if (followingItem && indentWidth(following) === baseIndent) this.index += 1;
        else break;
      }
    }
    return list;
  }
}

/**
 * Parse one guide document. Returns { title, lede, blocks, headings } or throws
 * GuideMarkdownError listing every problem with its line number.
 */
export function parseGuideMarkdown(source, label = "guide") {
  const problems = [];
  const report = (line, message) => problems.push(`${label}:${line}: ${message}.`);
  const text = String(source).replace(/\r\n?/g, "\n");
  let lines = text.split("\n");
  let firstLine = 1;
  if (lines[0] === "---") {
    report(1, "guide documents have no frontmatter; technical metadata stays in the system-model records");
    const close = lines.indexOf("---", 1);
    if (close !== -1) { firstLine = close + 2; lines = lines.slice(close + 1); }
  }
  const blocks = new BlockParser(lines, firstLine, report, { headings: true, callouts: true, figures: true, lists: true }).parse();

  const titleBlock = blocks[0];
  if (titleBlock?.type !== "heading" || titleBlock.level !== 1) report(titleBlock?.line || 1, "a guide starts with one level-1 heading that names it");
  for (const block of blocks.slice(1)) {
    if (block.type === "heading" && block.level === 1) report(block.line, "a guide has exactly one level-1 heading");
  }
  let previousLevel = 1;
  const slugs = new Map();
  const headings = [];
  for (const block of blocks) {
    if (block.type !== "heading") continue;
    if (block.level > previousLevel + 1) report(block.line, `heading level ${block.level} follows level ${previousLevel}; do not skip levels`);
    previousLevel = block.level;
    const base = markdownHeadingSlug(inlineText(block.inlines)) || "section";
    const count = slugs.get(base) || 0;
    slugs.set(base, count + 1);
    block.slug = count ? `${base}-${count}` : base;
    block.text = inlineText(block.inlines);
    headings.push(block);
  }
  if (problems.length) throw new GuideMarkdownError(problems);

  const body = blocks.slice(1);
  const lede = body[0]?.type === "paragraph" ? body.shift() : null;
  return { title: titleBlock.inlines, titleText: inlineText(titleBlock.inlines), titleSlug: titleBlock.slug, lede, blocks: body, headings };
}

/** Every visible text fragment with its line, for identifier and path checks. */
export function visibleText(document) {
  const result = [{ line: 1, text: document.titleText, where: "title" }];
  const visit = (block) => {
    switch (block.type) {
      case "heading": result.push({ line: block.line, text: block.text, where: "heading" }); break;
      case "paragraph": result.push({ line: block.line, text: inlineText(block.inlines), where: "text" }); break;
      case "code": result.push({ line: block.line, text: block.text, where: "code block" }); break;
      case "table":
        result.push({ line: block.line, text: block.header.map(inlineText).join(" | "), where: "table" });
        block.rows.forEach((row, index) => result.push({ line: block.rowLines[index], text: row.map(inlineText).join(" | "), where: "table" }));
        break;
      case "callout":
        if (block.title) result.push({ line: block.line, text: inlineText(block.title), where: "callout" });
        block.blocks.forEach(visit);
        break;
      case "list": for (const item of block.items) item.blocks.forEach(visit); break;
      case "figure":
        if (block.caption) result.push({ line: block.line, text: inlineText(block.caption), where: "figure caption" });
        for (const step of block.steps) result.push({ line: block.line, text: `${inlineText(step.title)} ${inlineText(step.text)}`, where: "figure" });
        break;
      default: break;
    }
  };
  if (document.lede) visit(document.lede);
  document.blocks.forEach(visit);
  return result;
}

/** Every link node with the line of the block holding it. */
export function documentLinks(document) {
  const result = [];
  const take = (nodes, line) => inlineLinks(nodes).forEach((link) => result.push({ ...link, line, label: inlineText(link.children) }));
  const visit = (block) => {
    switch (block.type) {
      case "heading": case "paragraph": take(block.inlines, block.line); break;
      case "table": block.header.forEach((cell) => take(cell, block.line)); block.rows.forEach((row, index) => row.forEach((cell) => take(cell, block.rowLines[index]))); break;
      case "callout": if (block.title) take(block.title, block.line); block.blocks.forEach(visit); break;
      case "list": block.items.forEach((item) => item.blocks.forEach(visit)); break;
      case "figure": if (block.caption) take(block.caption, block.line); block.steps.forEach((step) => { take(step.title, block.line); take(step.text, block.line); }); break;
      default: break;
    }
  };
  take(document.title, 1);
  if (document.lede) visit(document.lede);
  document.blocks.forEach(visit);
  return result;
}
