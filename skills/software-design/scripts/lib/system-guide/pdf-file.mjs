// Minimal PDF reader and metadata writer for the PDFs Chromium prints. It reads
// classic cross-reference tables (Skia's output), resolves the page tree, named
// destinations, outline, link annotations and fonts, and extracts positioned
// text through ToUnicode maps so an export can be verified without third-party
// tools. It is not a general PDF library.

import zlib from "node:zlib";

const WHITESPACE = new Set([0x00, 0x09, 0x0a, 0x0c, 0x0d, 0x20]);
const DELIMITERS = new Set([0x28, 0x29, 0x3c, 0x3e, 0x5b, 0x5d, 0x7b, 0x7d, 0x2f, 0x25]);

export class PdfRef {
  constructor(number, generation) {
    this.number = number;
    this.generation = generation;
  }
}

export class PdfName {
  constructor(value) {
    this.value = value;
  }
}

class Lexer {
  constructor(bytes, position = 0) {
    this.bytes = bytes;
    this.position = position;
  }

  skipSpace() {
    const { bytes } = this;
    while (this.position < bytes.length) {
      const byte = bytes[this.position];
      if (WHITESPACE.has(byte)) this.position += 1;
      else if (byte === 0x25) {
        while (this.position < bytes.length && bytes[this.position] !== 0x0a && bytes[this.position] !== 0x0d) this.position += 1;
      } else break;
    }
  }

  regular() {
    const start = this.position;
    while (this.position < this.bytes.length && !WHITESPACE.has(this.bytes[this.position]) && !DELIMITERS.has(this.bytes[this.position])) this.position += 1;
    return this.bytes.toString("latin1", start, this.position);
  }

  literalString() {
    const { bytes } = this;
    this.position += 1;
    const out = [];
    let depth = 1;
    while (this.position < bytes.length) {
      const byte = bytes[this.position++];
      if (byte === 0x5c) {
        const next = bytes[this.position++];
        const simple = { 0x6e: 0x0a, 0x72: 0x0d, 0x74: 0x09, 0x62: 0x08, 0x66: 0x0c, 0x28: 0x28, 0x29: 0x29, 0x5c: 0x5c };
        if (next in simple) out.push(simple[next]);
        else if (next >= 0x30 && next <= 0x37) {
          let octal = next - 0x30;
          for (let count = 0; count < 2 && bytes[this.position] >= 0x30 && bytes[this.position] <= 0x37; count += 1) octal = octal * 8 + (bytes[this.position++] - 0x30);
          out.push(octal & 0xff);
        } else if (next === 0x0d) {
          if (bytes[this.position] === 0x0a) this.position += 1;
        } else if (next !== 0x0a) out.push(next);
        continue;
      }
      if (byte === 0x28) depth += 1;
      if (byte === 0x29) { depth -= 1; if (depth === 0) break; }
      out.push(byte);
    }
    return Buffer.from(out);
  }

  hexString() {
    this.position += 1;
    const end = this.bytes.indexOf(0x3e, this.position);
    let hex = this.bytes.toString("latin1", this.position, end).replace(/\s+/g, "");
    this.position = end + 1;
    if (hex.length % 2) hex += "0";
    return Buffer.from(hex, "hex");
  }

  // Returns a token: { kind: "value", value } | { kind: "op", value } | { kind: "open"/"close", value }
  next() {
    this.skipSpace();
    const { bytes } = this;
    if (this.position >= bytes.length) return null;
    const byte = bytes[this.position];
    if (byte === 0x2f) {
      this.position += 1;
      const raw = this.regular();
      return { kind: "value", value: new PdfName(raw.replace(/#([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)))) };
    }
    if (byte === 0x28) return { kind: "value", value: this.literalString() };
    if (byte === 0x3c) {
      if (bytes[this.position + 1] === 0x3c) { this.position += 2; return { kind: "open", value: "<<" }; }
      return { kind: "value", value: this.hexString() };
    }
    if (byte === 0x3e && bytes[this.position + 1] === 0x3e) { this.position += 2; return { kind: "close", value: ">>" }; }
    if (byte === 0x5b) { this.position += 1; return { kind: "open", value: "[" }; }
    if (byte === 0x5d) { this.position += 1; return { kind: "close", value: "]" }; }
    if (byte === 0x7b || byte === 0x7d) { this.position += 1; return { kind: "op", value: String.fromCharCode(byte) }; }
    const word = this.regular();
    if (!word) { this.position += 1; return this.next(); }
    if (/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(word)) return { kind: "value", value: Number(word) };
    if (word === "true" || word === "false") return { kind: "value", value: word === "true" };
    if (word === "null") return { kind: "value", value: null };
    return { kind: "op", value: word };
  }
}

/** Parse one PDF value starting at the lexer position; resolves `n g R`. */
function parseValue(lexer, first = lexer.next()) {
  if (!first) throw new Error("Unexpected end of PDF data.");
  if (first.kind === "open" && first.value === "[") {
    const items = [];
    for (;;) {
      const token = lexer.next();
      if (!token || (token.kind === "close" && token.value === "]")) break;
      if (token.kind === "op" && token.value === "R" && items.length >= 2) {
        const generation = items.pop();
        const number = items.pop();
        items.push(new PdfRef(number, generation));
        continue;
      }
      items.push(parseValue(lexer, token));
    }
    return items;
  }
  if (first.kind === "open" && first.value === "<<") {
    const dict = new Map();
    for (;;) {
      const keyToken = lexer.next();
      if (!keyToken || keyToken.kind === "close") break;
      const key = keyToken.value.value;
      let value = parseValue(lexer);
      if (typeof value === "number") {
        const save = lexer.position;
        const second = lexer.next();
        const third = second?.kind === "value" && typeof second.value === "number" ? lexer.next() : null;
        if (third?.kind === "op" && third.value === "R") value = new PdfRef(value, second.value);
        else lexer.position = save;
      }
      dict.set(key, value);
    }
    return dict;
  }
  if (first.kind === "value") return first.value;
  return { operator: first.value };
}

function decodeTextString(value) {
  if (!Buffer.isBuffer(value)) return value == null ? "" : String(value);
  if (value[0] === 0xfe && value[1] === 0xff) {
    const swapped = Buffer.from(value.subarray(2));
    swapped.swap16();
    return swapped.toString("utf16le");
  }
  if (value[0] === 0xef && value[1] === 0xbb && value[2] === 0xbf) return value.subarray(3).toString("utf8");
  return value.toString("latin1");
}

export function encodeTextString(text) {
  const value = String(text);
  if (/^[\x20-\x7e]*$/.test(value)) return `(${value.replace(/[\\()]/g, "\\$&")})`;
  const body = Buffer.from(value, "utf16le");
  body.swap16();
  return `<FEFF${body.toString("hex").toUpperCase()}>`;
}

function parseCMap(text) {
  const map = new Map();
  const hexToString = (hex) => {
    const buffer = Buffer.from(hex, "hex");
    if (buffer.length % 2) return String.fromCharCode(...buffer);
    const swapped = Buffer.from(buffer);
    swapped.swap16();
    return swapped.toString("utf16le");
  };
  for (const block of text.matchAll(/beginbfchar([\s\S]*?)endbfchar/g)) {
    for (const [, source, target] of block[1].matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g)) map.set(Number.parseInt(source, 16), hexToString(target));
  }
  for (const block of text.matchAll(/beginbfrange([\s\S]*?)endbfrange/g)) {
    for (const [, low, high, rest] of block[1].matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*(<[0-9A-Fa-f]+>|\[[^\]]*\])/g)) {
      const start = Number.parseInt(low, 16);
      const end = Number.parseInt(high, 16);
      if (rest.startsWith("[")) {
        [...rest.matchAll(/<([0-9A-Fa-f]+)>/g)].forEach(([, hex], offset) => map.set(start + offset, hexToString(hex)));
      } else {
        const base = Buffer.from(rest.slice(1, -1), "hex");
        for (let code = start; code <= end; code += 1) {
          const target = Buffer.from(base);
          target.writeUInt16BE((target.readUInt16BE(target.length - 2) + code - start) & 0xffff, target.length - 2);
          map.set(code, hexToString(target.toString("hex")));
        }
      }
    }
  }
  return map;
}

function multiply(left, right) {
  const [a, b, c, d, e, f] = left;
  const [A, B, C, D, E, F] = right;
  return [a * A + b * C, a * B + b * D, c * A + d * C, c * B + d * D, e * A + f * C + E, e * B + f * D + F];
}

export class PdfFile {
  constructor(bytes) {
    this.bytes = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
    if (this.bytes.toString("latin1", 0, 5) !== "%PDF-") throw new Error("Not a PDF file.");
    this.offsets = new Map();
    this.cache = new Map();
    this.trailer = this.readCrossReference();
    this.fontCache = new Map();
  }

  readCrossReference() {
    const tail = this.bytes.toString("latin1", Math.max(0, this.bytes.length - 2048));
    const match = /startxref\s+(\d+)\s+%%EOF\s*$/.exec(tail);
    if (!match) throw new Error("PDF has no startxref.");
    let position = Number(match[1]);
    let trailer = null;
    const seen = new Set();
    while (position !== undefined && !seen.has(position)) {
      seen.add(position);
      const lexer = new Lexer(this.bytes, position);
      const keyword = lexer.next();
      if (keyword?.value !== "xref") throw new Error("Unsupported PDF cross-reference format (expected a classic xref table).");
      for (;;) {
        const save = lexer.position;
        const token = lexer.next();
        if (token?.kind === "op" && token.value === "trailer") break;
        if (token?.kind !== "value") { lexer.position = save; throw new Error("Malformed xref table."); }
        const start = token.value;
        const count = lexer.next().value;
        lexer.skipSpace();
        for (let index = 0; index < count; index += 1) {
          const line = this.bytes.toString("latin1", lexer.position, lexer.position + 20);
          const [offset, , type] = line.trim().split(/\s+/);
          if (type === "n" && !this.offsets.has(start + index)) this.offsets.set(start + index, Number(offset));
          lexer.position += 20;
        }
      }
      const dict = parseValue(lexer);
      trailer ||= dict;
      position = dict.get("Prev");
    }
    return trailer;
  }

  /** Parse an object definition and return { value, stream, start, end }. */
  objectAt(number) {
    if (this.cache.has(number)) return this.cache.get(number);
    const offset = this.offsets.get(number);
    if (offset === undefined) return null;
    const lexer = new Lexer(this.bytes, offset);
    const head = [lexer.next(), lexer.next(), lexer.next()];
    if (head[0]?.value !== number || head[2]?.value !== "obj") throw new Error(`PDF object ${number} is not at its xref offset.`);
    const value = parseValue(lexer);
    let stream = null;
    const save = lexer.position;
    const token = lexer.next();
    if (token?.kind === "op" && token.value === "stream") {
      let start = lexer.position;
      if (this.bytes[start] === 0x0d) start += 1;
      if (this.bytes[start] === 0x0a) start += 1;
      const length = this.resolve(value.get("Length"));
      stream = this.bytes.subarray(start, start + length);
      lexer.position = start + length;
      const end = lexer.next();
      if (end?.value !== "endstream") throw new Error(`PDF stream ${number} has a wrong /Length.`);
    } else {
      lexer.position = save;
    }
    const close = lexer.next();
    if (close?.value !== "endobj") throw new Error(`PDF object ${number} is not terminated.`);
    const result = { value, stream, start: offset, end: lexer.position };
    this.cache.set(number, result);
    return result;
  }

  resolve(value) {
    let current = value;
    for (let depth = 0; current instanceof PdfRef && depth < 32; depth += 1) current = this.objectAt(current.number)?.value ?? null;
    return current;
  }

  streamData(reference) {
    const object = reference instanceof PdfRef ? this.objectAt(reference.number) : null;
    if (!object?.stream) return Buffer.alloc(0);
    const filter = this.resolve(object.value.get("Filter"));
    const filters = Array.isArray(filter) ? filter.map((item) => item.value) : filter ? [filter.value] : [];
    let data = object.stream;
    for (const name of filters) {
      if (name === "FlateDecode") data = zlib.inflateSync(data);
      else throw new Error(`Unsupported PDF stream filter ${name}.`);
    }
    return data;
  }

  get catalog() {
    return this.resolve(this.trailer.get("Root"));
  }

  info() {
    const dict = this.resolve(this.trailer.get("Info"));
    const result = {};
    if (dict) for (const [key, value] of dict) result[key] = decodeTextString(this.resolve(value));
    return result;
  }

  pages() {
    if (this.pageList) return this.pageList;
    const result = [];
    const walk = (reference, inherited) => {
      const node = this.resolve(reference);
      const resources = node.get("Resources") ?? inherited.resources;
      const mediaBox = node.get("MediaBox") ?? inherited.mediaBox;
      if (node.get("Type")?.value === "Pages") {
        for (const kid of this.resolve(node.get("Kids"))) walk(kid, { resources, mediaBox });
      } else {
        result.push({ ref: reference, number: reference.number, node, resources: this.resolve(resources), mediaBox: this.resolve(mediaBox).map((value) => this.resolve(value)) });
      }
    };
    walk(this.catalog.get("Pages"), {});
    this.pageList = result;
    return result;
  }

  pageIndex(reference) {
    return this.pages().findIndex((page) => page.number === reference?.number);
  }

  destination(value) {
    const array = this.resolve(value);
    if (!Array.isArray(array)) return null;
    return { page: this.pageIndex(array[0]), top: typeof array[3] === "number" ? array[3] : null };
  }

  /** Named destinations from /Dests or the /Names tree: Map(name -> { page, top }). */
  namedDestinations() {
    const result = new Map();
    const dests = this.resolve(this.catalog.get("Dests"));
    if (dests instanceof Map) for (const [name, value] of dests) result.set(name, this.destination(this.resolve(value)?.get?.("D") ?? value));
    const walk = (node) => {
      if (!node) return;
      const names = this.resolve(node.get("Names"));
      if (names) for (let index = 0; index < names.length; index += 2) result.set(decodeTextString(this.resolve(names[index])), this.destination(this.resolve(names[index + 1])?.get?.("D") ?? names[index + 1]));
      for (const kid of this.resolve(node.get("Kids")) || []) walk(this.resolve(kid));
    };
    walk(this.resolve(this.resolve(this.catalog.get("Names"))?.get("Dests")));
    return result;
  }

  /** Bookmarks in reading order: [{ number, title, level, page }]. */
  outline() {
    const result = [];
    const root = this.resolve(this.catalog.get("Outlines"));
    const named = this.namedDestinations();
    const walk = (reference, level) => {
      let current = reference;
      const visited = new Set();
      while (current instanceof PdfRef && !visited.has(current.number)) {
        visited.add(current.number);
        const node = this.resolve(current);
        let target = node.get("Dest");
        if (target instanceof PdfName) target = named.get(target.value);
        else if (Buffer.isBuffer(target)) target = named.get(decodeTextString(target));
        else target = this.destination(target);
        result.push({ number: current.number, title: decodeTextString(this.resolve(node.get("Title"))), level, page: target?.page ?? -1 });
        walk(node.get("First"), level + 1);
        current = node.get("Next");
      }
    };
    if (root) walk(root.get("First"), 1);
    return result;
  }

  links(pageIndex) {
    const page = this.pages()[pageIndex];
    return (this.resolve(page.node.get("Annots")) || []).map((reference) => this.resolve(reference))
      .filter((annotation) => annotation.get("Subtype")?.value === "Link")
      .map((annotation) => {
        const action = this.resolve(annotation.get("A"));
        const dest = this.resolve(annotation.get("Dest"));
        return {
          rect: this.resolve(annotation.get("Rect")),
          uri: action?.get("URI") ? decodeTextString(this.resolve(action.get("URI"))) : null,
          dest: dest instanceof PdfName ? dest.value : Buffer.isBuffer(dest) ? decodeTextString(dest) : null,
          explicit: Array.isArray(dest) ? this.destination(dest) : null,
        };
      });
  }

  font(reference) {
    const key = reference instanceof PdfRef ? reference.number : reference;
    if (this.fontCache.has(key)) return this.fontCache.get(key);
    const dict = this.resolve(reference);
    const subtype = dict.get("Subtype")?.value;
    const toUnicode = dict.get("ToUnicode");
    const font = {
      subtype,
      baseFont: dict.get("BaseFont")?.value ?? null,
      twoByte: subtype === "Type0",
      map: toUnicode ? parseCMap(this.streamData(toUnicode).toString("latin1")) : new Map(),
    };
    this.fontCache.set(key, font);
    return font;
  }

  /** Every font used on every page: [{ name, subtype, baseFont }]. */
  fonts() {
    const result = new Map();
    const visit = (resources) => {
      const fonts = this.resolve(resources?.get("Font"));
      if (fonts) for (const [, reference] of fonts) {
        const font = this.font(reference);
        result.set(reference instanceof PdfRef ? reference.number : font.baseFont, { subtype: font.subtype, baseFont: font.baseFont });
      }
      const xobjects = this.resolve(resources?.get("XObject"));
      if (xobjects) for (const [, reference] of xobjects) {
        const xobject = this.resolve(reference);
        if (xobject?.get("Subtype")?.value === "Form") visit(this.resolve(xobject.get("Resources")));
      }
    };
    for (const page of this.pages()) visit(page.resources);
    return [...result.values()];
  }

  /**
   * Positioned text runs on one page in drawing order:
   * [{ text, x, y, size, font }] with y measured from the page top in points.
   */
  pageText(pageIndex) {
    const page = this.pages()[pageIndex];
    const height = page.mediaBox[3] - page.mediaBox[1];
    const contents = this.resolve(page.node.get("Contents"));
    const references = Array.isArray(contents) ? contents : [page.node.get("Contents")];
    const data = Buffer.concat(references.map((reference) => this.streamData(reference)));
    const runs = [];
    this.interpret(data, page.resources, [1, 0, 0, 1, 0, 0], runs, height, 0);
    return runs;
  }

  interpret(data, resources, baseMatrix, runs, height, depth) {
    const lexer = new Lexer(data);
    const stack = [];
    let ctm = baseMatrix;
    const saved = [];
    let font = null;
    let fontName = null;
    let size = 0;
    let textMatrix = [1, 0, 0, 1, 0, 0];
    let lineMatrix = [1, 0, 0, 1, 0, 0];
    const fonts = this.resolve(resources?.get("Font"));
    const show = (value) => {
      if (!font || !Buffer.isBuffer(value)) return;
      let text = "";
      if (font.twoByte) {
        for (let index = 0; index + 1 < value.length; index += 2) {
          const code = value.readUInt16BE(index);
          text += font.map.get(code) ?? "�";
        }
      } else {
        for (const code of value) text += font.map.get(code) ?? String.fromCharCode(code);
      }
      const matrix = multiply(textMatrix, ctm);
      runs.push({ text, x: matrix[4], y: height - matrix[5], size: Math.abs(size * matrix[3]), font: fontName });
    };
    for (;;) {
      const token = lexer.next();
      if (!token) break;
      if (token.kind !== "op") {
        if (token.kind === "open") stack.push(parseValue(lexer, token));
        else if (token.kind === "value") stack.push(token.value);
        continue;
      }
      const operator = token.value;
      switch (operator) {
        case "q": saved.push(ctm); break;
        case "Q": ctm = saved.pop() || baseMatrix; break;
        case "cm": ctm = multiply(stack.slice(-6), ctm); break;
        case "BT": textMatrix = [1, 0, 0, 1, 0, 0]; lineMatrix = textMatrix; break;
        case "Tf": {
          const name = stack[stack.length - 2]?.value;
          size = stack[stack.length - 1];
          const reference = fonts?.get(name);
          font = reference ? this.font(reference) : null;
          fontName = font?.baseFont || font?.subtype || name;
          break;
        }
        case "Tm": textMatrix = stack.slice(-6); lineMatrix = textMatrix; break;
        case "Td": case "TD": {
          const [tx, ty] = stack.slice(-2);
          lineMatrix = multiply([1, 0, 0, 1, tx, ty], lineMatrix);
          textMatrix = lineMatrix;
          break;
        }
        case "Tj": case "'": case "\"": show(stack[stack.length - 1]); break;
        case "TJ": for (const part of stack[stack.length - 1] || []) if (Buffer.isBuffer(part)) show(part); break;
        case "BI": {
          const end = data.indexOf("EI", lexer.position, "latin1");
          lexer.position = end === -1 ? data.length : end + 2;
          break;
        }
        case "Do": {
          if (depth > 8) break;
          const name = stack[stack.length - 1]?.value;
          const reference = this.resolve(resources?.get("XObject"))?.get(name);
          const xobject = reference && this.objectAt(reference.number);
          if (xobject?.value.get("Subtype")?.value === "Form") {
            const matrix = this.resolve(xobject.value.get("Matrix")) || [1, 0, 0, 1, 0, 0];
            this.interpret(this.streamData(reference), this.resolve(xobject.value.get("Resources")) || resources, multiply(matrix, ctm), runs, height, depth + 1);
          }
          break;
        }
        default: break;
      }
      stack.length = 0;
    }
  }

  /**
   * Rewrite the file with a new document information dictionary and replaced
   * dictionaries (Map of object number -> Map), then a fresh cross-reference
   * table. Every other object's bytes are copied unchanged.
   */
  rewrite({ info = null, objects = new Map() } = {}) {
    const infoReference = this.trailer.get("Info");
    const numbers = [...this.offsets.keys()].sort((left, right) => left - right);
    const size = Math.max(...numbers, infoReference?.number ?? 0) + 1;
    const infoNumber = infoReference?.number ?? size;
    const header = this.bytes.toString("latin1", 0, this.bytes.indexOf(0x0a)).trim();
    const parts = [Buffer.from(`${header}\n%\xE2\xE3\xCF\xD3\n`, "latin1")];
    let length = parts[0].length;
    const offsets = new Map();
    const append = (number, buffer) => {
      offsets.set(number, length);
      parts.push(buffer, Buffer.from("\n"));
      length += buffer.length + 1;
    };
    const replacements = new Map(objects);
    if (info) {
      replacements.set(infoNumber, new Map(Object.entries(info).filter(([, value]) => value !== undefined && value !== null).map(([key, value]) => [key, String(value)])));
    }
    for (const number of [...new Set([...numbers, infoNumber])].sort((left, right) => left - right)) {
      if (replacements.has(number)) {
        const object = this.offsets.has(number) ? this.objectAt(number) : null;
        if (object?.stream) throw new Error(`PDF object ${number} is a stream and cannot be replaced.`);
        append(number, Buffer.from(`${number} 0 obj\n${serializeValue(replacements.get(number))}\nendobj`, "latin1"));
      } else {
        const object = this.objectAt(number);
        append(number, this.bytes.subarray(object.start, object.end));
      }
    }
    const total = Math.max(size, infoNumber + 1);
    const lines = [`xref\n0 ${total}\n0000000000 65535 f \n`];
    for (let number = 1; number < total; number += 1) {
      lines.push(offsets.has(number) ? `${String(offsets.get(number)).padStart(10, "0")} 00000 n \n` : "0000000000 00000 f \n");
    }
    const root = this.trailer.get("Root");
    lines.push(`trailer\n<</Size ${total}\n/Root ${root.number} ${root.generation} R\n/Info ${infoNumber} 0 R>>\nstartxref\n${length}\n%%EOF\n`);
    parts.push(Buffer.from(lines.join(""), "latin1"));
    return Buffer.concat(parts);
  }

  /** Copy of an object's dictionary for rewrite(). */
  dictionary(number) {
    return new Map(this.objectAt(number).value);
  }
}

function serializeName(value) {
  return `/${value.replace(/[^!-~]|[#()<>[\]{}/%]/g, (char) => `#${char.charCodeAt(0).toString(16).padStart(2, "0")}`)}`;
}

/** Serialize a parsed value; strings given as JS strings become PDF text strings. */
export function serializeValue(value) {
  if (value === null || value === undefined) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(6)));
  if (typeof value === "string") return encodeTextString(value);
  if (Buffer.isBuffer(value)) return `<${value.toString("hex")}>`;
  if (value instanceof PdfName) return serializeName(value.value);
  if (value instanceof PdfRef) return `${value.number} ${value.generation} R`;
  if (Array.isArray(value)) return `[${value.map(serializeValue).join(" ")}]`;
  if (value instanceof Map) return `<<${[...value].map(([key, item]) => `${serializeName(key)} ${serializeValue(item)}`).join("\n")}>>`;
  throw new Error(`Cannot serialize ${typeof value} in a PDF.`);
}
