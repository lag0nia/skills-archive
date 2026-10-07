#!/usr/bin/env node

// Optional helper: embed real candidate screenshots into the slideshow starter.
// Inputs are temporary working files; only the written slides.html is an artifact.
//
//   node build-review-slideshow.mjs --manifest <slides.json> --output <candidate-folder>/slides.html
//
// Manifest (image paths resolve from the manifest's folder; title is the alternative's name):
//   { "title": "Main candidate", "captured": "YYYY-MM-DD", "coverage": "...", "omissions": "...",
//     "lang": "en", "notice": "Partial — ...", "prototype": { "href": "./index.html", "label": "..." },
//     "slides": [{ "image": "01-arrival.png", "viewport": "desktop", "role": "Customer", "part": "journey",
//                  "alt": "...", "caption": "...", "note": "Outdated — ..." }] }
// lang, notice, prototype, and note are optional. viewport is desktop (1024 px and
// wider), tablet (600–1023 px), or phone (below 600 px); role names whose screen
// it is (optional only for reviewer slides); part is journey, other, or reviewer.
// List slides in journey order. The helper then applies the fixed order: viewport;
// within it one role at a time, in order of first appearance; each role's journey,
// then its other screens; reviewer tools last.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isEntryPoint } from "./lib/entry-point.mjs";
import { SCREENSHOT_MIME_TYPES, screenshotImageInfo, screenshotProblem } from "./lib/model/screenshot-image.mjs";
import { SLIDE_PARTS, SLIDE_VIEWPORTS, reviewSlideshowErrors } from "./lib/validation/ui-ux-design.mjs";

const templatePath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "references", "ui-ux", "templates", "slides.html");

const sentence = (value) => /[.!?)]$/.test(value) ? value : value + ".";
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

function parseArgs(argv) {
  const args = {};
  for (let index = 2; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--manifest") args.manifest = argv[++index];
    else if (value === "--output") args.output = argv[++index];
    else throw new Error("Unknown argument: " + value);
  }
  if (!args.manifest || !args.output) throw new Error("Usage: build-review-slideshow.mjs --manifest <slides.json> --output <candidate-folder>/slides.html");
  return args;
}

function text(value, name) {
  if (typeof value !== "string" || !value.trim()) throw new Error("Manifest " + name + " must be a non-empty string.");
  return value.trim();
}

function replaceRegion(html, name, content) {
  const pattern = new RegExp("<!-- " + name + " -->[\\s\\S]*?<!-- /" + name + " -->");
  if (!pattern.test(html)) throw new Error("Slideshow starter is missing its " + name + " region.");
  return html.replace(pattern, () => "<!-- " + name + " -->\n" + content + "\n      <!-- /" + name + " -->");
}

export function buildReviewSlideshow({ manifestPath, outputPath }) {
  const output = path.resolve(outputPath);
  if (path.basename(output) !== "slides.html") throw new Error("Output must be the candidate's reserved slides.html file.");
  if (!fs.existsSync(path.dirname(output)) || !fs.statSync(path.dirname(output)).isDirectory()) throw new Error("Output folder does not exist: " + path.dirname(output));
  const manifestFile = path.resolve(manifestPath);
  let manifest;
  try { manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8")); } catch (error) { throw new Error("Cannot read manifest " + manifestFile + ": " + error.message); }
  const lang = manifest.lang === undefined ? "en" : text(manifest.lang, "lang");
  if (!/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(lang)) throw new Error("Manifest lang must be a language tag such as en or es-ES.");
  const title = text(manifest.title, "title");
  const captured = text(manifest.captured, "captured");
  const capturedDate = new Date(captured + "T00:00:00Z");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(captured) || Number.isNaN(capturedDate.getTime())) throw new Error("Manifest captured must be a YYYY-MM-DD date.");
  const coverage = text(manifest.coverage, "coverage");
  const omissions = text(manifest.omissions, "omissions");
  if (!Array.isArray(manifest.slides) || !manifest.slides.length) throw new Error("Manifest slides must list at least one captured screenshot.");

  const header = [`      <h1 id="deck-title">${escapeHtml(title)}</h1>`];
  if (manifest.notice !== undefined) header.push(`      <p class="deck-alert" role="note">${escapeHtml(text(manifest.notice, "notice"))}</p>`);
  const about = [
    `      <p data-slideshow-coverage>Captured <time datetime="${captured}">${escapeHtml(capturedDate.toLocaleDateString(lang, { dateStyle: "long", timeZone: "UTC" }))}</time>. Shows: ${escapeHtml(sentence(coverage))} Not shown: ${escapeHtml(sentence(omissions))}</p>`,
  ];
  if (manifest.prototype !== undefined) {
    const href = text(manifest.prototype?.href, "prototype.href");
    if (/^(?:[a-z][\w+.-]*:|\/)/i.test(href) || !fs.existsSync(path.resolve(path.dirname(output), href.split(/[?#]/)[0]))) {
      throw new Error("Manifest prototype.href must be a relative link to an existing candidate page: " + href);
    }
    const label = manifest.prototype.label === undefined ? "Open the interactive prototype" : text(manifest.prototype.label, "prototype.label");
    about.push(`      <p><a href="${escapeHtml(href)}">${escapeHtml(label)}</a></p>`);
  }

  const choice = (value, allowed, name) => {
    if (!Object.hasOwn(allowed, value ?? "")) throw new Error("Manifest " + name + " must be one of: " + Object.keys(allowed).join(", ") + ".");
    return value;
  };
  const entries = manifest.slides.map((slide, index) => {
    const label = "Manifest slides[" + index + "]";
    const image = text(slide?.image, "slides[" + index + "].image");
    if (/^[a-z][\w+.-]*:/i.test(image)) throw new Error(label + " image must be a local captured screenshot file, not a URL.");
    const imagePath = path.resolve(path.dirname(manifestFile), image);
    if (!fs.existsSync(imagePath) || !fs.statSync(imagePath).isFile()) throw new Error(label + " image does not exist: " + imagePath);
    const bytes = fs.readFileSync(imagePath);
    const problem = screenshotProblem(bytes);
    if (problem) throw new Error(label + " image " + problem + ": " + imagePath);
    return {
      bytes,
      ...screenshotImageInfo(bytes),
      viewport: choice(slide.viewport, SLIDE_VIEWPORTS, "slides[" + index + "].viewport"),
      part: choice(slide.part, SLIDE_PARTS, "slides[" + index + "].part"),
      role: slide.part === "reviewer" && slide.role === undefined ? null : text(slide.role, "slides[" + index + "].role"),
      alt: text(slide.alt, "slides[" + index + "].alt"),
      caption: text(slide.caption, "slides[" + index + "].caption"),
      note: slide.note === undefined ? null : text(slide.note, "slides[" + index + "].note"),
      index,
    };
  });
  // Stable sort: the listed journey order survives inside each role and part.
  const roles = [...new Set(entries.filter((entry) => entry.part !== "reviewer").map((entry) => entry.role))];
  const key = (entry) => [SLIDE_VIEWPORTS[entry.viewport], entry.part === "reviewer" ? 1 : 0, entry.part === "reviewer" ? 0 : roles.indexOf(entry.role), SLIDE_PARTS[entry.part], entry.index];
  entries.sort((a, b) => key(a).reduce((result, value, position) => result || value - key(b)[position], 0));
  const viewportNames = { desktop: "Desktop", tablet: "Tablet", phone: "Phone" };
  const section = (entry) => viewportNames[entry.viewport] + " · " + (entry.part === "reviewer" ? "Demo and reviewer tools" : entry.role);
  const slides = entries.map((entry, index) => [
    // Section headings keep the plain list readable without scripting.
    ...(index === 0 || section(entries[index - 1]) !== section(entry) ? [`      <h2 class="deck-section">${escapeHtml(section(entry))}</h2>`] : []),
    `      <figure class="slide" data-slide id="slide-${index + 1}" data-slide-viewport="${entry.viewport}"${entry.role === null ? "" : ` data-slide-role="${escapeHtml(entry.role)}"`} data-slide-part="${entry.part}">`,
    `        <img src="data:${SCREENSHOT_MIME_TYPES[entry.type]};base64,${entry.bytes.toString("base64")}" width="${entry.width}" height="${entry.height}" alt="${escapeHtml(entry.alt)}">`,
    `        <figcaption><span>${escapeHtml(entry.caption)}</span>${entry.note === null ? "" : `<span class="slide-note">${escapeHtml(entry.note)}</span>`}</figcaption>`,
    `      </figure>`,
  ].join("\n"));

  let html = fs.readFileSync(templatePath, "utf8")
    .replace(/<html lang="[^"]*">/, () => `<html lang="${lang}">`)
    .replace(/<title>[\s\S]*?<\/title>/, () => `<title>${escapeHtml(title)}</title>`)
    .replace(/\s*<!--\s*Review slideshow starter\.[\s\S]*?-->/, "");
  html = replaceRegion(html, "deck-header", header.join("\n"));
  html = replaceRegion(html, "deck-about", about.join("\n"));
  html = replaceRegion(html, "deck-slides", slides.join("\n"));
  const errors = reviewSlideshowErrors(html, output);
  if (errors.length) throw new Error(errors.join("\n"));
  fs.writeFileSync(output, html);
  const counts = Object.keys(SLIDE_VIEWPORTS).map((viewport) => [viewport, entries.filter((entry) => entry.viewport === viewport).length]).filter(([, count]) => count);
  return { output, slides: slides.length, order: counts.map(([viewport, count]) => count + " " + viewport).join(", "), bytes: Buffer.byteLength(html) };
}

if (isEntryPoint(import.meta.url)) {
  try {
    const args = parseArgs(process.argv);
    const result = buildReviewSlideshow({ manifestPath: args.manifest, outputPath: args.output });
    console.log(`Wrote ${result.output}: ${result.slides} slide${result.slides === 1 ? "" : "s"} (${result.order}), ${(result.bytes / 1048576).toFixed(1)} MB. Structural checks passed; open the deck directly from disk to inspect it before reporting it complete.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
