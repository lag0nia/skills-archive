#!/usr/bin/env node

// Structural checks for the HTML report assets. They cannot show that a report is clear,
// accurate or well designed; render and inspect a populated report for that.

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reportReference = "references/visual-report.md";

function read(relativePath) {
  return fs.readFileSync(path.join(skillRoot, relativePath), "utf8");
}

function htmlAssets() {
  return fs
    .readdirSync(path.join(skillRoot, "assets"))
    .filter((name) => name.endsWith(".html"))
    .map((name) => path.join("assets", name));
}

function withoutComments(html) {
  return html.replace(/<!--[\s\S]*?-->/g, "");
}

function attributeValues(html, name) {
  return [...html.matchAll(new RegExp(`\\s${name}\\s*=\\s*["']([^"']*)["']`, "gi"))].map((match) => match[1]);
}

test("the report reference links the HTML starter and example it describes", () => {
  const linked = [...read(reportReference).matchAll(/\]\(([^)\s]+\.html)\)/g)].map((match) =>
    path.normalize(path.join("references", match[1])),
  );
  const assets = htmlAssets();
  assert.ok(assets.length >= 2, "expected an HTML starter and a populated example");
  for (const asset of assets) assert.ok(linked.includes(path.normalize(asset)), `${reportReference} does not link ${asset}`);
});

test("HTML report assets are self-contained and load nothing from elsewhere", () => {
  for (const file of htmlAssets()) {
    const html = withoutComments(read(file));
    for (const name of ["href", "src", "srcset", "xlink:href", "action", "poster", "data"]) {
      for (const value of attributeValues(html, name)) {
        assert.ok(/^(#|data:)/.test(value), `${file} ${name} points outside the page: ${value}`);
      }
    }
    assert.doesNotMatch(html, /<link\b/i, `${file} links an external resource`);
    assert.doesNotMatch(html, /<(iframe|object|embed)\b/i, `${file} embeds external content`);
    assert.doesNotMatch(html, /@import|@font-face/i, `${file} imports styles or fonts`);
    for (const [, target] of html.matchAll(/url\(\s*["']?([^"')]*)/gi)) {
      assert.ok(/^(#|data:)/.test(target), `${file} references ${target} from CSS`);
    }
  }
});

test("HTML report assets have no answer controls, storage, tracking or network calls", () => {
  for (const file of htmlAssets()) {
    const html = withoutComments(read(file));
    assert.doesNotMatch(html, /<(form|input|textarea|select|button)\b/i, `${file} contains an input control`);
    assert.doesNotMatch(
      html,
      /\b(fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|localStorage|sessionStorage|indexedDB|document\.cookie)\b/,
      `${file} uses a network or storage API`,
    );
    for (const script of html.matchAll(/<script\b[^>]*>/gi)) {
      assert.doesNotMatch(script[0], /\bsrc\s*=/i, `${file} loads an external script`);
    }
  }
});

test("internal links and ARIA references point at unique, existing ids", () => {
  for (const file of htmlAssets()) {
    const html = withoutComments(read(file));
    const ids = attributeValues(html, "id");
    const unique = new Set(ids);
    assert.equal(unique.size, ids.length, `${file} repeats an id`);
    for (const href of attributeValues(html, "href").filter((value) => value.startsWith("#"))) {
      assert.ok(unique.has(href.slice(1)), `${file} links to missing target ${href}`);
    }
    for (const name of ["aria-labelledby", "aria-describedby"]) {
      for (const value of attributeValues(html, name)) {
        for (const id of value.split(/\s+/).filter(Boolean)) assert.ok(unique.has(id), `${file} ${name} names missing id ${id}`);
      }
    }
    for (const [, id] of html.matchAll(/url\(#([^)]+)\)/g)) assert.ok(unique.has(id), `${file} references missing SVG id ${id}`);
  }
});

test("HTML report assets declare language, encoding, viewport and title", () => {
  for (const file of htmlAssets()) {
    const html = read(file);
    assert.match(html, /^<!doctype html>/i, `${file} lacks a doctype`);
    assert.match(html, /<html\b[^>]*\blang=["'][^"']+["']/i, `${file} lacks a document language`);
    assert.match(html, /<meta\s+charset=["']?utf-8/i, `${file} lacks a UTF-8 declaration`);
    assert.match(html, /<meta\s+name=["']viewport["']/i, `${file} lacks a responsive viewport`);
    assert.match(html, /<title>[^<]+<\/title>/i, `${file} lacks a title`);
  }
});

test("every diagram is either decorative or has a text alternative", () => {
  for (const file of htmlAssets()) {
    for (const [tag] of withoutComments(read(file)).matchAll(/<svg\b[^>]*>/gi)) {
      const decorative = /aria-hidden=["']true["']/.test(tag);
      const labelled = /role=["']img["']/.test(tag) && /aria-(labelledby|label)=/.test(tag);
      assert.ok(decorative || labelled, `${file} has an SVG without a text alternative: ${tag}`);
    }
  }
});

test("the populated example is complete and marked as fictional", () => {
  const examples = htmlAssets().filter((file) => /example/.test(file));
  assert.ok(examples.length > 0, "no populated example found");
  for (const file of examples) {
    const html = read(file);
    assert.doesNotMatch(html, /\{\{/, `${file} still contains template placeholders`);
    assert.match(html, /fictional/i, `${file} is not marked as fictional`);
  }
});
