#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { embeddedScreenshotProblem, screenshotImageInfo, screenshotProblem } from "../../scripts/lib/model/screenshot-image.mjs";
import { reviewSlideshowErrors } from "../../scripts/lib/validation/ui-ux-design.mjs";
import { png } from "../support/screenshots.mjs";

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const script = path.join(skillRoot, "scripts", "build-review-slideshow.mjs");
const run = (...args) => spawnSync(process.execPath, [script, ...args], { encoding: "utf8" });

function workspace(context) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "software-design-slides-"));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const candidate = path.join(root, "ui-ux", "alternatives", "main");
  const captures = path.join(root, "captures");
  fs.mkdirSync(candidate, { recursive: true });
  fs.mkdirSync(captures);
  fs.writeFileSync(path.join(candidate, "index.html"), "<!doctype html><title>Candidate</title>");
  fs.writeFileSync(path.join(captures, "arrival.png"), png(640, 400, [20, 80, 160]));
  fs.writeFileSync(path.join(captures, "outcome.png"), png(390, 844, [200, 60, 40]));
  const manifest = {
    title: "Main candidate — screens and states",
    captured: "2026-09-26",
    coverage: "Customer arrival and outcome",
    omissions: "Operator views",
    slides: [
      { image: "arrival.png", viewport: "desktop", role: "Customer", part: "journey", alt: "Arrival view listing one pending task", caption: "Customer · Arrival · 1280 px desktop" },
      { image: "outcome.png", viewport: "phone", role: "Customer", part: "journey", alt: "Confirmation that the change was saved", caption: "Customer · Outcome · 390 px phone" },
    ],
  };
  const writeManifest = (value) => { fs.writeFileSync(path.join(captures, "slides.json"), JSON.stringify(value)); return path.join(captures, "slides.json"); };
  return { root, candidate, captures, manifest, writeManifest, output: path.join(candidate, "slides.html") };
}

test("the slideshow helper embeds screenshots, escapes text, and writes a self-contained deck", (context) => {
  const { root, candidate, captures, manifest, writeManifest, output } = workspace(context);
  const result = run("--manifest", writeManifest({
    ...manifest,
    title: 'Main <candidate> & "states"',
    lang: "en-GB",
    notice: "Partial — the error state could not be captured",
    prototype: { href: "./index.html" },
    slides: [
      { ...manifest.slides[0], alt: 'Arrival "home" view', caption: "Customer · <script>alert(1)</script> · 1280 px desktop" },
      { ...manifest.slides[1], note: "Outdated — the last refresh failed" },
    ],
  }), "--output", output);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /2 slides \(1 desktop, 1 phone\)/);
  const html = fs.readFileSync(output, "utf8");
  for (const file of ["arrival.png", "outcome.png"]) assert.ok(html.includes("data:image/png;base64," + fs.readFileSync(path.join(captures, file)).toString("base64")), file);
  assert.ok(html.includes("<title>Main &lt;candidate&gt; &amp; &quot;states&quot;</title>"));
  assert.ok(html.includes('alt="Arrival &quot;home&quot; view"'));
  assert.ok(html.includes("&lt;script&gt;alert(1)&lt;/script&gt;"));
  assert.doesNotMatch(html, /<script>alert/);
  assert.match(html, /<html lang="en-GB">/);
  assert.match(html, /<time datetime="2026-09-26">26 September 2026<\/time>\. Shows: Customer arrival and outcome\. Not shown: Operator views\./);
  assert.match(html, /role="note">Partial — the error state could not be captured/);
  const cover = html.slice(html.indexOf('<header class="deck-cover">'), html.indexOf("</header>"));
  const about = html.slice(html.indexOf('<details class="deck-about">'), html.indexOf("</details>"));
  assert.match(cover, /<h1 id="deck-title">Main &lt;candidate&gt;/);
  assert.match(cover, /data-slide-poster/);
  assert.doesNotMatch(cover, /class="deck-open"/);
  assert.doesNotMatch(cover, /data-slideshow-coverage|Open the interactive prototype/);
  assert.match(about, /data-slideshow-coverage/);
  assert.match(about, /<a href="\.\/index\.html">Open the interactive prototype<\/a>/);
  assert.match(html, /class="slide-note">Outdated — the last refresh failed/);
  assert.match(html, /width="640" height="400"/);
  assert.equal((html.match(/<figure class="slide" data-slide id="slide-\d+" data-slide-viewport="(?:desktop|phone)" data-slide-role="Customer" data-slide-part="journey">/g) || []).length, 2);
  assert.doesNotMatch(html, /\bTBD\b|Review slideshow starter/);
  const references = [...html.matchAll(/\b(?:src|href)="([^"]+)"/g)].map((match) => match[1]).filter((value) => !/^(?:data:|#)/.test(value));
  assert.deepEqual(references, ["./index.html"]);
  assert.doesNotMatch(html, /<link\b|type="module"|\bfetch\(|\bimport\(/);

  // The deck alone is sufficient; its optional link back is navigation only.
  const copy = path.join(root, "copied", "slides.html");
  fs.mkdirSync(path.dirname(copy));
  fs.copyFileSync(output, copy);
  fs.rmSync(candidate, { recursive: true });
  assert.deepEqual(reviewSlideshowErrors(fs.readFileSync(copy, "utf8"), copy), []);
});

test("the slideshow helper rejects unusable input without writing a deck", (context) => {
  const { root, captures, manifest, writeManifest, output } = workspace(context);
  fs.writeFileSync(path.join(captures, "tiny.png"), png(1, 1));
  fs.writeFileSync(path.join(captures, "notes.txt"), "not an image");
  const slide = (change) => ({ ...manifest, slides: [{ ...manifest.slides[0], ...change }] });
  for (const [value, expected, target = output] of [
    [manifest, /reserved slides\.html/, path.join(path.dirname(output), "deck.html")],
    [manifest, /Output folder does not exist/, path.join(root, "missing", "slides.html")],
    [{ ...manifest, slides: [] }, /at least one captured screenshot/],
    [slide({ image: "absent.png" }), /image does not exist/],
    [slide({ image: "https://example.test/shot.png" }), /not a URL/],
    [slide({ image: "tiny.png" }), /1×1 px, too small/],
    [slide({ image: "notes.txt" }), /not a decodable PNG, JPEG, or WebP/],
    [slide({ alt: "" }), /slides\[0\]\.alt must be a non-empty string/],
    [slide({ viewport: undefined }), /slides\[0\]\.viewport must be one of: desktop, tablet, phone/],
    [slide({ viewport: "laptop" }), /slides\[0\]\.viewport must be one of: desktop, tablet, phone/],
    [slide({ part: "extras" }), /slides\[0\]\.part must be one of: journey, other, reviewer/],
    [slide({ role: undefined }), /slides\[0\]\.role must be a non-empty string/],
    [slide({ role: "TBD" }), /slide 1 requires data-slide-role naming the role whose screen it shows/],
    [slide({ caption: "TBD" }), /slide 1 requires a meaningful visible figcaption/],
    [slide({ alt: "TBD" }), /slide 1 requires a meaningful screenshot description/],
    [{ ...manifest, captured: "26/09/2026" }, /YYYY-MM-DD/],
    [{ ...manifest, coverage: "TBD" }, /data-slideshow-coverage/],
    [{ ...manifest, lang: "english please" }, /language tag/],
    [{ ...manifest, prototype: { href: "https://example.test/app" } }, /relative link to an existing candidate page/],
    [{ ...manifest, prototype: { href: "./missing.html" } }, /relative link to an existing candidate page/],
  ]) {
    fs.rmSync(output, { force: true });
    const result = run("--manifest", writeManifest(value), "--output", target);
    assert.notEqual(result.status, 0, String(expected));
    assert.match(result.stderr, expected);
    assert.equal(fs.existsSync(output), false, String(expected));
  }
  assert.match(run("--manifest", path.join(captures, "absent.json"), "--output", output).stderr, /Cannot read manifest/);
  assert.match(run("--output", output).stderr, /Usage:/);
});

test("the slideshow helper applies one fixed order: viewport, then one role at a time, then part", (context) => {
  const { captures, manifest, writeManifest, output } = workspace(context);
  // Listed in journey order, where two roles take turns across three viewports.
  const listed = [
    ["desktop", "Customer", "journey", "Customer starts"], ["desktop", "Operator", "journey", "Operator reviews"],
    ["phone", "Customer", "journey", "Customer starts on a phone"], ["desktop", "Customer", "journey", "Customer waits"],
    ["desktop", undefined, "reviewer", "Demo controls"], ["desktop", "Operator", "other", "Operator settings"],
    ["desktop", "Customer", "other", "Customer history"], ["tablet", "Operator", "journey", "Operator reviews on a tablet"],
    ["phone", "Operator", "journey", "Operator reviews on a phone"], ["desktop", "Operator", "journey", "Operator approves"],
  ];
  const slides = listed.map(([viewport, role, part, caption], index) => {
    fs.writeFileSync(path.join(captures, `listed-${index}.png`), png(200 + index, 120));
    return { image: `listed-${index}.png`, viewport, role, part, alt: caption + " screenshot", caption };
  });
  const result = run("--manifest", writeManifest({ ...manifest, slides }), "--output", output);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /10 slides \(7 desktop, 1 tablet, 2 phone\)/);
  const html = fs.readFileSync(output, "utf8");
  const order = [...html.matchAll(/<figure class="slide" data-slide id="slide-(\d+)"[^>]*>[\s\S]*?<figcaption><span>([^<]+)</g)].map((match) => match[2]);
  assert.deepEqual(order, [
    "Customer starts", "Customer waits", "Customer history",
    "Operator reviews", "Operator approves", "Operator settings",
    "Demo controls", "Operator reviews on a tablet", "Customer starts on a phone", "Operator reviews on a phone",
  ]);
  const sections = [...html.matchAll(/<h2 class="deck-section">([^<]+)<\/h2>/g)].map((match) => match[1]);
  assert.deepEqual(sections, ["Desktop · Customer", "Desktop · Operator", "Desktop · Demo and reviewer tools", "Tablet · Operator", "Phone · Customer", "Phone · Operator"]);
  assert.doesNotMatch(html.match(/<figure[^>]*>(?=\s*<img[^>]*alt="Demo controls screenshot")/)[0], /data-slide-role/);
});

test("screenshot plausibility accepts complete PNG, JPEG, and WebP images only", () => {
  const jpeg = Buffer.concat([
    Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]), Buffer.from("JFIF\0", "latin1"), Buffer.from([1, 1, 0, 0, 1, 0, 1, 0, 0]),
    Buffer.from([0xff, 0xc0, 0x00, 0x11, 0x08, 0x00, 0xc8, 0x01, 0x40, 0x03, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1]),
    Buffer.from([0xff, 0xd9]),
  ]);
  const webp = Buffer.alloc(30);
  webp.write("RIFF", 0, "latin1");
  webp.writeUInt32LE(22, 4);
  webp.write("WEBPVP8X", 8, "latin1");
  webp.writeUInt32LE(10, 16);
  webp.writeUIntLE(319, 24, 3);
  webp.writeUIntLE(199, 27, 3);
  assert.deepEqual(screenshotImageInfo(png(200, 100)), { type: "png", width: 200, height: 100, complete: true });
  assert.deepEqual(screenshotImageInfo(jpeg), { type: "jpeg", width: 320, height: 200, complete: true });
  assert.deepEqual(screenshotImageInfo(webp), { type: "webp", width: 320, height: 200, complete: true });
  for (const [bytes, mime] of [[png(200, 100), "image/png"], [jpeg, "image/jpeg"], [webp, "image/webp"]]) {
    assert.equal(embeddedScreenshotProblem(`data:${mime};base64,${bytes.toString("base64")}`), null, mime);
  }
  assert.match(screenshotProblem(jpeg.subarray(0, jpeg.length - 2)), /truncated/);
  assert.match(screenshotProblem(Buffer.from("<svg></svg>")), /not a decodable/);
  assert.match(embeddedScreenshotProblem("data:image/png,%89PNG"), /base64/);
  assert.match(embeddedScreenshotProblem("data:image/png;base64,"), /valid base64 payload/);
  assert.match(embeddedScreenshotProblem("./shot.png"), /base64 data:image/);
});
