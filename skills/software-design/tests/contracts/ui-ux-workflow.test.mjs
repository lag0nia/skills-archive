#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { validateUiUxDesign, validateUiUxJourneyReadiness } from "../../scripts/lib/validation/ui-ux-design.mjs";
import { png, pngDataUrl, writeDeck } from "../support/screenshots.mjs";

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

function read(relativePath) {
  return fs.readFileSync(path.join(skillRoot, relativePath), "utf8");
}

function uiFixture({ reviewed = true } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "software-design-ui-ux-"));
  const uiRoot = path.join(root, "ui-ux");
  fs.mkdirSync(uiRoot, { recursive: true });
  fs.copyFileSync(path.join(skillRoot, "references", "ui-ux", "templates", "specification.md"), path.join(uiRoot, "specification.md"));
  fs.copyFileSync(path.join(skillRoot, "references", "ui-ux", "templates", "prototype.html"), path.join(uiRoot, "prototype.html"));
  const candidate = path.join(uiRoot, "alternatives", "main", "index.html");
  fs.mkdirSync(path.dirname(candidate), { recursive: true });
  fs.copyFileSync(path.join(skillRoot, "references/ui-ux/templates/candidate.html"), candidate);
  if (reviewed) {
    const specificationPath = path.join(uiRoot, "specification.md");
    fs.writeFileSync(specificationPath, fs.readFileSync(specificationPath, "utf8")
      .replace("`Unresolved` — select a linked candidate entrypoint after review.", "`./alternatives/main/index.html`.")
      .replace("| Not reviewed | TBD |", "| Reviewed | Browser walkthrough and current canonical requirements reconciled. |"));
  }
  return root;
}

test("consumer and operator UI workflow is bounded but covers material experience states", () => {
  const staged = read("references/staged-design-workflow.md");
  const ui = read("references/ui-ux-design.md");
  const workflow = read("references/ui-ux/design-workflow.md");
  assert.match(staged, /intended users, their main tasks, likely prior knowledge/);
  assert.match(staged, /human or operator surface/);
  assert.match(workflow, /consumer and operator interfaces/);
  assert.match(workflow, /primary journeys, main routes/);
  assert.match(workflow, /empty\/loading\/waiting\/success\/error\/recovery states/);
  assert.match(workflow, /first-time or returning-user differences/);
  assert.match(workflow, /cross-surface transitions/);
  assert.match(workflow, /meaningful labels, and progressive disclosure/);
  assert.match(workflow, /responsive behavior/);
  assert.match(workflow, /accessible semantics/);
  assert.match(ui, /internal identifiers, implementation terminology, raw transitions, or diagnostics/);
});

test("Stage 7 establishes a task-led direction before expanding coverage", () => {
  const skill = read("SKILL.md");
  const ui = read("references/ui-ux-design.md");
  const workflow = read("references/ui-ux/design-workflow.md");
  const staged = read("references/staged-design-workflow.md");
  assert.match(skill, /selective routes into the portable design module/);
  assert.match(ui, /arrival → task discovery → meaningful action → persistent result/);
  assert.match(workflow, /intended user who has not read the source material/);
  assert.match(workflow, /Derive navigation from user purposes rather than components, protocol transitions, personas, or coverage inventories/);
  assert.match(workflow, /bounded subtraction and plain-language review/);
  assert.match(workflow, /material costs, restrictions, risks, and deadlines as soon as they affect a selection/);
  assert.match(workflow, /When a screen needs substantial instructional text, first reconsider its navigation, grouping, labels, controls, and interaction sequence/);
  assert.match(staged, /An explicit prototype-change request authorizes affected updates in the same pass/);
  assert.match(ui, /if rendering is blocked, record the limitation and do not claim visual verification/i);
});

test("portable UI/UX module is stage-neutral and selectively routed", () => {
  const guide = read("references/ui-ux/README.md");
  const workflow = read("references/ui-ux/design-workflow.md");
  const examples = read("references/ui-ux/examples.md");
  const specification = read("references/ui-ux/templates/specification.md");
  assert.equal(fs.existsSync(path.join(skillRoot, "assets", "templates", "ui-ux")), false);
  assert.match(guide, /Read selectively/);
  assert.match(guide, /prototype starter demonstrates mechanics and is meant to be replaced/);
  assert.doesNotMatch(workflow + examples, /\bStage\s+[0-9]|\bTICKET-|\bBuild Unit\b/);
  assert.match(workflow, /First identify the design questions that need visual evidence from the intended audience, tasks, and interaction needs/);
  assert.match(workflow, /actual product screens and accessible flows over marketing pages or decorative mockups alone/);
  assert.match(workflow, /Recommend one coherent primary direction and, when useful, one or two alternatives/);
  assert.match(workflow, /directly inspected flow from a published screenshot, promotional image, or inferred behavior/);
  assert.match(workflow, /Never fabricate reference screenshots or claim an interaction was tested when only images were available/);
  assert.match(workflow, /Do not create accounts, purchase access, or bypass restrictions/);
  assert.match(workflow, /ask once whether the recommended clarity, density, interaction, and visual qualities match the user's expectations/);
  assert.match(workflow, /Two or three references will often suffice, but there is no quota/);
  assert.match(workflow, /compact ASCII or text wireframe directly in the conversation/);
  assert.match(workflow, /request HTML alternatives without first selecting a wireframe/);
  assert.match(workflow, /Selecting a direction does not approve unreviewed screens or establish delivery readiness/);
  assert.match(workflow, /Actual screenshot files belong in the consumer project's existing allowed artifact location/);
  assert.doesNotMatch(workflow, /Playwright|Chrome|ShowMe|Figma/);
  assert.match(workflow, /Comprehension:/);
  assert.match(workflow, /Presentation:/);
  assert.match(examples, /## Settings:/);
  assert.match(examples, /## Booking:/);
  assert.match(examples, /## Confirmation And Recovery:/);
  assert.match(examples, /before requesting unnecessary attendee details/);
  assert.match(examples, /confirm the final total, cancellation deadline, and booking consequence/);
  assert.match(examples, /failure is confirmed with no effects and retry is safe/);
  assert.match(examples, /outcome is unknown, preserve context and check the existing operation/);
  assert.match(workflow, /closing or cancelling the interface after submission must not imply reversal/);
  assert.match(workflow, /check the existing operation before allowing a potentially duplicate submission/);
  assert.match(specification, /^## Design Rationale$/m);
  assert.match(specification, /Visual shortlist and evidence/);
  assert.match(specification, /Direction-review outcome/);
  assert.match(specification, /confirmed failure and unknown outcomes where applicable/);
});

// These instruction-contract checks guard the written guidance. They do not
// execute a conversation or prove that an agent interprets a user's preferences.
test("instruction contract: prototype choice reuses supplied count and directions", () => {
  const workflow = read("references/ui-ux/design-workflow.md");
  const choice = workflow.split("### Choose Prototype Count And Directions\n")[1]?.split("\n## ")[0] || "";
  assert.match(choice, /Before creating new prototype candidates, reuse any count or directions the user already supplied; ask only for missing information/);
  assert.ok(choice.includes("How many prototype directions would you like—one, two, three, or another number? Do you have directions in mind, or should I propose meaningfully different approaches?"));
  assert.match(choice, /If only the count is missing, ask only the count part/);
  assert.match(choice, /if only directions are missing, ask only the directions part/);
  assert.match(choice, /If both are supplied, proceed without repeating the question/);
  assert.match(choice, /Accept any reasonable user-requested count without a fixed quota/);
  assert.match(choice, /directions unspecified or asks you to propose them, propose a concise set matching the agreed count in the existing direction review/);
});

test("instruction contract: alternatives compare bounded journeys before selected expansion", () => {
  const workflow = read("references/ui-ux/design-workflow.md");
  const comparison = workflow.split("## Compare HTML Alternatives When Useful\n")[1]?.split("\n## ")[0] || "";
  assert.match(comparison, /Create the agreed number of candidates/);
  assert.match(comparison, /same bounded representative journey and comparable states across candidates/);
  assert.match(comparison, /Initially build only enough of each candidate to compare directions, then expand the selected candidate unless the user requests broader comparison/);
  assert.match(workflow, /navigation, interaction sequence, information hierarchy, density, or visual style—not merely colors/);
  assert.match(workflow, /explicitly identify any proposed behavioral differences while preserving canonical constraints; selecting a visual direction does not approve changed behavior/);
});

test("instruction contract: ordinary selected-prototype updates skip the choice question", () => {
  const workflow = read("references/ui-ux/design-workflow.md");
  const integration = read("references/ui-ux-design.md");
  assert.match(workflow, /Skip this question when updating or synchronizing an existing selected prototype unless the user requests new alternatives; then reuse known preferences and ask only for missing information/);
  assert.match(workflow, /existing direction review, with no separate approval cycle, tracking artifact, or status model/);
  assert.match(integration, /design-workflow\.md#choose-prototype-count-and-directions/);
  assert.match(integration, /Skip that question during ordinary updates or synchronization unless new alternatives are requested/);
  assert.doesNotMatch(workflow, /\bStage\s+\d|\btickets?\b|\bBuild Unit\b/i);
});

// Guidance and starter checks only: opening the launcher from disk in a browser is the portability proof.
test("instruction contract: prototypes are portable static files checked by opening the launcher from disk", () => {
  const workflow = read("references/ui-ux/design-workflow.md");
  const integration = read("references/ui-ux-design.md");
  const specification = read("references/ui-ux/templates/specification.md");
  const mechanics = workflow.split("## Prototype Mechanics\n")[1]?.split("\n## ")[0] || "";
  assert.match(mechanics, /opens its launcher, follows its links, and uses the demo without installing dependencies, running commands, building anything, or starting a server/);
  assert.match(mechanics, /relative links and resource paths that stay inside the prototype folder, local CSS and assets, and ordinary browser JavaScript in classic scripts/);
  assert.match(mechanics, /Avoid unnecessary HTTP dependencies, runtime package or CDN dependencies, module loading, and fetching local data files/);
  assert.match(mechanics, /Keep demo data in ordinary JavaScript/);
  assert.match(mechanics, /persistent demo progress is not required unless requested\. Browser storage is optional and must fail harmlessly/);
  assert.match(mechanics, /Separate pages opened as files may not share storage, so a multi-page or role-switch demo must not depend on it/);
  assert.match(mechanics, /Use a server only when a concrete requirement needs one/);
  assert.match(mechanics, /Portability needs no archive, bundle, export copy, or packaging step: the existing folder is what gets shared/);
  assert.match(workflow, /opening the launcher directly from disk, as a recipient would, rather than through a local server preview/);
  assert.match(workflow, /this is the same review, not an additional cycle\./);
  assert.match(workflow, /Relative paths alone do not prove that interactive behavior works/);
  assert.match(workflow, /a static snapshot or a copy rendered under another URL scheme is not a direct-file check/);
  assert.match(integration, /Open `ui-ux\/prototype\.html` directly from disk for this inspection instead of a localhost preview/);
  assert.match(integration, /including role switching when applicable\. This replaces the local-server check; it is not an additional review cycle/);
  assert.match(integration, /The one exception is a server justified by a concrete requirement; record that requirement and how to run the prototype under Product And Demo Boundary/);
  assert.match(integration, /Resolving local paths does not prove that a prototype works when opened from disk/);
  assert.match(specification, /the direct-file launcher check \(affected navigation and representative interactions, including role switching when applicable\)/);
  assert.match(specification, /If a concrete requirement prevents opening the prototype directly from disk, record that requirement and how to run the prototype/);
});

test("the launcher and candidate starters use only relative paths and classic in-page behavior", () => {
  for (const file of ["references/ui-ux/templates/prototype.html", "references/ui-ux/templates/candidate.html"]) {
    const html = read(file);
    assert.doesNotMatch(html, /type=["']module["']|\bimport\s*\(|\bfetch\s*\(|localStorage|sessionStorage|https?:\/\//, file);
    for (const [, target] of html.matchAll(/\b(?:href|src)=["']([^"']+)["']/g)) assert.match(target, /^\.\//, `${file}: ${target}`);
  }
});

test("the launcher starter is one static card per candidate with a View slides button only once slides exist", () => {
  const launcher = read("references/ui-ux/templates/prototype.html");
  const active = launcher.replace(/<!--[\s\S]*?-->/g, "");
  assert.doesNotMatch(launcher, /<script/);
  assert.match(launcher, /Keep this\s+design unchanged so every package's launcher looks and works the same/);
  assert.match(active, /<li class="card">[\s\S]*<h2 class="card-title">Main candidate<\/h2>[\s\S]*<a class="button" href="\.\/alternatives\/main\/index\.html">Open prototype<\/a>/);
  assert.doesNotMatch(active, /slides\.html|class="tag"/);
  assert.match(launcher, /<a class="button button-slides" href="\.\/alternatives\/main\/slides\.html#view">/);
  assert.match(launcher, /one button per entry page/);
  const slides = read("references/ui-ux/templates/slides.html");
  assert.match(slides, /location\.hash === "#view" \? 0/);
  assert.match(slides, /if \(fromLauncher\) \{ history\.back\(\); return; \}/);
});

test("non-UI libraries do not require a prototype", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "software-design-non-ui-"));
  try {
    assert.deepEqual(validateUiUxDesign(root), { applicable: false, errors: [] });
    assert.match(read("references/ui-ux-design.md"), /library, SDK without a maintained UI, background service, pipeline, or infrastructure-only target/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("the UI/UX templates form one local interactive entrypoint", () => {
  const root = uiFixture({ reviewed: false });
  try {
    assert.deepEqual(validateUiUxDesign(root), { applicable: true, errors: [] });
    const specificationPath = path.join(root, "ui-ux", "specification.md");
    fs.writeFileSync(specificationPath, fs.readFileSync(specificationPath, "utf8").replace(/^## Design Rationale$[\s\S]*?(?=^## Product And Demo Boundary$)/m, ""));
    assert.match(validateUiUxDesign(root).errors.join("\n"), /missing ## Design Rationale/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("candidate folders support explicit selection and multiple linked pages without copying", () => {
  const root = uiFixture({ reviewed: false });
  try {
    const uiRoot = path.join(root, "ui-ux");
    const specPath = path.join(uiRoot, "specification.md");
    const candidate = path.join(uiRoot, "alternatives", "main", "index.html");
    const launcher = fs.readFileSync(path.join(uiRoot, "prototype.html"), "utf8");
    assert.doesNotMatch(launcher, /data-product-action|<script/);
    assert.deepEqual(validateUiUxDesign(root).errors, []);
    const specification = fs.readFileSync(specPath, "utf8").replace("`Unresolved` — select a linked candidate entrypoint after review.", "`./alternatives/main/index.html`.");
    fs.writeFileSync(specPath, specification);
    const baseline = fs.readFileSync(candidate, "utf8");
    fs.writeFileSync(candidate, baseline.replace("</main>", '<a href="./result.html">Result</a></main>'));
    fs.writeFileSync(path.join(path.dirname(candidate), "result.html"), '<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width"></head><body><main>Persistent result</main></body></html>');
    assert.deepEqual(validateUiUxDesign(root).errors, []);
    assert.equal(fs.readFileSync(path.join(uiRoot, "prototype.html"), "utf8"), launcher);
    fs.rmSync(path.join(path.dirname(candidate), "result.html"));
    assert.match(validateUiUxDesign(root).errors.join("\n"), /local resource does not resolve/);
    fs.writeFileSync(candidate, baseline);
    fs.writeFileSync(specPath, specification.replace("`./alternatives/main/index.html`", "`./prototype.html`"));
    assert.match(validateUiUxDesign(root).errors.join("\n"), /selected candidate entrypoint/);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test("linked CSS and JS resources are inspected recursively and must remain local", () => {
  const root = uiFixture();
  try {
    const candidate = path.join(root, "ui-ux/alternatives/main/index.html");
    const baseline = fs.readFileSync(candidate, "utf8");
    fs.writeFileSync(candidate, baseline.replace("</head>", '<link rel="stylesheet" href="./style.css"></head>'));
    fs.writeFileSync(path.join(path.dirname(candidate), "style.css"), '@import url("./more.css");');
    fs.writeFileSync(path.join(path.dirname(candidate), "more.css"), 'body { background: url(https://cdn.example.test/image.png); }');
    assert.match(validateUiUxDesign(root).errors.join("\n"), /remote runtime or resource dependencies/);
    fs.writeFileSync(path.join(path.dirname(candidate), "more.css"), 'body { color: black; }');
    assert.deepEqual(validateUiUxDesign(root).errors, []);
    fs.writeFileSync(candidate, baseline.replace("</head>", '<script src="./app.js"></script></head>'));
    fs.writeFileSync(path.join(path.dirname(candidate), "app.js"), 'import "./missing.js";');
    assert.match(validateUiUxDesign(root).errors.join("\n"), /local resource does not resolve/);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test("selected-scope readiness requires reviewed coverage and rejects only relevant pending journeys", () => {
  const root = uiFixture();
  try {
    const specPath = path.join(root, "ui-ux/specification.md");
    let spec = fs.readFileSync(specPath, "utf8").replace("`Unresolved` — select a linked candidate entrypoint after review.", "`./alternatives/main/index.html`.")
      .replace('| Not reviewed | TBD |', '| Reviewed | Browser inspection at narrow and wide viewports; canonical behavior reconciled. |')
      .replace('## State Coverage', '<a id="journey-settings"></a>Settings journey.\n\n## State Coverage');
    fs.writeFileSync(specPath, spec);
    const coverage = '[Checkout](../../../ui-ux/specification.md#journey-main)';
    assert.deepEqual(validateUiUxJourneyReadiness(root, coverage), []);
    const pending = '\n| Journey | Pending change | Canonical / ticket references |\n| --- | --- | --- |\n| [Settings](#journey-settings) | Update navigation | [Requirement](./specification.md#journey-settings) |\n';
    fs.writeFileSync(specPath, spec + pending);
    assert.deepEqual(validateUiUxJourneyReadiness(root, coverage), []);
    assert.match(validateUiUxJourneyReadiness(root, '[Settings](../../../ui-ux/specification.md#journey-settings)').join('\n'), /requires reconciled rendered review/);
    fs.writeFileSync(specPath, spec + pending.replaceAll('journey-settings', 'journey-main'));
    assert.match(validateUiUxJourneyReadiness(root, coverage).join('\n'), /Pending prototype work blocks/);
    fs.writeFileSync(specPath, spec.replace('| Reviewed |', '| Blocked |'));
    assert.match(validateUiUxJourneyReadiness(root, coverage).join('\n'), /requires reconciled rendered review/);
    assert.match(validateUiUxJourneyReadiness(root, 'checkout').join('\n'), /must link selected specification journey anchors/);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test("a remote or non-interactive prototype is rejected without claiming usability", () => {
  const root = uiFixture();
  try {
    const prototypePath = path.join(root, "ui-ux", "alternatives", "main", "index.html");
    fs.writeFileSync(prototypePath, '<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width"><script src="https://example.com/app.js"></script></head><body data-demo-only="fake"><main><button>Open</button><div data-prototype-state="empty"></div></main></body></html>');
    const result = validateUiUxDesign(root);
    assert.match(result.errors.join("\n"), /collapsible prototype reviewer area/);
    assert.match(result.errors.join("\n"), /must not require remote runtime or resource dependencies/);
    assert.match(read("references/ui-ux-design.md"), /does not prove coverage quality, comprehension, presentation quality, usability, accessibility conformance/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("prototype reviewer controls stay outside product content and navigation", () => {
  const root = uiFixture();
  try {
    const prototypePath = path.join(root, "ui-ux", "alternatives", "main", "index.html");
    const baseline = fs.readFileSync(prototypePath, "utf8");
    const main = /<main\b[^>]*data-product-surface\b[^>]*>[\s\S]*?<\/main>/i.exec(baseline)?.[0] || "";
    const reviewer = /<details\b[^>]*data-prototype-reviewer\b[^>]*>[\s\S]*?<\/details>/i.exec(baseline)?.[0] || "";
    assert.ok(main && reviewer);
    assert.doesNotMatch(main, /data-review-(?:state-target|actor)/);
    assert.doesNotMatch(main, /disposable starter demonstrates interaction mechanics/);
    assert.match(reviewer, /data-review-state-target/);
    assert.match(reviewer, /data-review-actor/);
    assert.match(reviewer, /disposable starter demonstrates interaction mechanics/);

    fs.writeFileSync(prototypePath, baseline.replace("</main>", '<button data-review-state-target="forced">Force state</button></main>'));
    assert.match(validateUiUxDesign(root).errors.join("\n"), /reviewer state and fake-actor controls must remain inside/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("prototype structure requires product outcomes, next steps, cancellation, and recovery", () => {
  const root = uiFixture();
  try {
    const prototypePath = path.join(root, "ui-ux", "alternatives", "main", "index.html");
    const baseline = fs.readFileSync(prototypePath, "utf8");
    const cases = [
      ["data-product-outcome", /action-specific product outcome/],
      ["data-next-step", /next step/],
      ["data-cancel-action", /cancellation behavior/],
      ["data-recovery-action", /failure recovery behavior/],
    ];
    for (const [marker, expected] of cases) {
      fs.writeFileSync(prototypePath, baseline.replaceAll(marker, "data-removed-marker"));
      assert.match(validateUiUxDesign(root).errors.join("\n"), expected);
    }
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("displayed URLs and external navigation pass while remote runtime dependencies fail", () => {
  const root = uiFixture();
  try {
    const prototypePath = path.join(root, "ui-ux", "alternatives", "main", "index.html");
    const baseline = fs.readFileSync(prototypePath, "utf8");
    fs.writeFileSync(prototypePath, baseline.replace("</main>", '<p>Support: https://example.test/help</p><a href="https://example.com/policy">External policy</a></main>'));
    assert.deepEqual(validateUiUxDesign(root), { applicable: true, errors: [] });

    fs.writeFileSync(prototypePath, baseline.replace("</head>", '<script src="https://cdn.example.com/runtime.js"></script></head>'));
    assert.match(validateUiUxDesign(root).errors.join("\n"), /remote runtime or resource dependencies/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("later interface tickets record pending prototype work without automatically editing or rendering", () => {
  const tickets = read("references/implementation-detail-tickets.md");
  const checkpoints = read("references/checkpoint-workflow.md");
  assert.match(tickets, /After the initial reviewed prototype, record affected prototype work/);
  assert.match(tickets, /without automatically editing or rendering/);
  assert.match(checkpoints, /Reopen only the affected UI\/UX requirements, prototype states, and Build Unit or handoff routes/);

  const root = uiFixture();
  try {
    const prototypePath = path.join(root, "ui-ux", "alternatives", "main", "index.html");
    const before = fs.readFileSync(prototypePath, "utf8");
    const after = before
      .replaceAll('data-action-target="review"', 'data-action-target="approval-waiting"')
      .replace('data-state-view="review"', 'data-state-view="approval-waiting"')
      .replace('data-review-state-target="review"', 'data-review-state-target="approval-waiting"');
    fs.writeFileSync(prototypePath, after);
    assert.match(after, /data-review-state-target="approval-waiting"/);
    assert.match(after, /data-review-state-target="success"/);
    assert.deepEqual(validateUiUxDesign(root), { applicable: true, errors: [] });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("prototype approval, implementation review, functional acceptance, and user testing remain distinct", () => {
  const ui = read("references/ui-ux-design.md");
  const handoff = read("assets/templates/build/delivery-planning-handoff.md");
  assert.match(ui, /Route functional acceptance and implemented UI\/UX review separately/);
  assert.match(ui, /implementation review is not user testing/i);
  assert.match(handoff, /Functional acceptance owner/);
  assert.match(handoff, /Implemented UI\/UX review owner/);
  assert.match(handoff, /Actual user testing/);
});

test("unfinished alternatives need only structural and local-resource checks", (context) => {
  const root = uiFixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const specPath = path.join(root, 'ui-ux/specification.md');
  const candidate = path.join(root, 'ui-ux/alternatives/sketch/index.html');
  fs.mkdirSync(path.dirname(candidate), { recursive: true });
  const selected = fs.readFileSync(path.join(root, 'ui-ux/alternatives/main/index.html'), 'utf8');
  fs.writeFileSync(candidate, selected.replaceAll('data-recovery-action', 'data-exploratory-action'));
  fs.appendFileSync(specPath, '\n[Exploratory sketch](./alternatives/sketch/index.html) — not selected; recovery not explored.\n');
  assert.deepEqual(validateUiUxDesign(root).errors, []);
  assert.deepEqual(validateUiUxDesign(root, { selectedOnly: true }).errors, []);
  // Even an early static sketch can be retained without acquiring full coverage.
  const sketch = '<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width"></head><body><main>Task layout sketch</main></body></html>';
  fs.writeFileSync(candidate, sketch);
  assert.deepEqual(validateUiUxDesign(root).errors, []);
  fs.writeFileSync(candidate, sketch.replace('</head>', '<script src="./missing.js"></script></head>'));
  assert.match(validateUiUxDesign(root).errors.join('\n'), /local resource does not resolve/);
  fs.writeFileSync(candidate, sketch.replace('</head>', '<script src="https://cdn.example.test/runtime.js"></script></head>'));
  assert.match(validateUiUxDesign(root).errors.join('\n'), /remote runtime or resource dependencies/);
  fs.writeFileSync(candidate, sketch.replace('lang="en"', ''));
  assert.match(validateUiUxDesign(root).errors.join('\n'), /document language/);
});

test("selection alone does not claim reviewed coverage and readiness still requires interactions", (context) => {
  const root = uiFixture({ reviewed: false });
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const specPath = path.join(root, 'ui-ux/specification.md');
  const candidate = path.join(root, 'ui-ux/alternatives/main/index.html');
  fs.writeFileSync(specPath, fs.readFileSync(specPath, 'utf8').replace('`Unresolved` — select a linked candidate entrypoint after review.', '`./alternatives/main/index.html`.'));
  fs.writeFileSync(candidate, fs.readFileSync(candidate, 'utf8').replaceAll('data-recovery-action', 'data-exploratory-action'));
  assert.deepEqual(validateUiUxDesign(root).errors, []);
  assert.match(validateUiUxDesign(root, { selectedOnly: true }).errors.join('\n'), /failure recovery behavior/);
  assert.match(validateUiUxJourneyReadiness(root, '[Main](../../../ui-ux/specification.md#journey-main)').join('\n'), /requires reconciled rendered review/);
  fs.writeFileSync(specPath, fs.readFileSync(specPath, 'utf8').replace('| Not reviewed | TBD |', '| Reviewed | Browser walkthrough. |'));
  assert.match(validateUiUxDesign(root).errors.join('\n'), /failure recovery behavior/);
});

test("JavaScript captions, comments, templates, and regex text are not resource dependencies", (context) => {
  const root = uiFixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const candidate = path.join(root, 'ui-ux/alternatives/main/index.html');
  const baseline = fs.readFileSync(candidate, 'utf8');
  const script = [
    `const caption = "Import from 'your wallet'";`,
    `const quoted = 'import "./imaginary.js"; fetch("https://caption.test")';`,
    String.raw`const escaped = "Say \"hello\" then import('./caption.js')";`,
    '// import "./comment.js"; fetch("https://comment.test")',
    '/* export { x } from "./comment.js"; new Worker("https://comment.test"); */',
    'const template = `Import from \'your wallet\' with url(https://caption.test)`;',
    'const nested = `Text ${"import(\'./nested-caption.js\')"} after`;',
    'const expression = /import("imaginary-regex.js")/;',
    'const cssExample = "url(https://caption.test)";',
    'const example = \'<script src="https://caption.test/app.js">\';',
  ].join('\n');
  fs.writeFileSync(candidate, baseline.replace('</head>', `<script>${script}</script></head>`));
  assert.deepEqual(validateUiUxDesign(root).errors, []);
  fs.writeFileSync(candidate, baseline.replace('</head>', '<script src="./captions.js"></script></head>'));
  fs.writeFileSync(path.join(path.dirname(candidate), 'captions.js'), script);
  assert.deepEqual(validateUiUxDesign(root).errors, []);
  fs.writeFileSync(candidate, baseline.replace('</head>', '<!-- <script src="https://comment.test/app.js"></script> -->\n<script type="application/json">{"caption":"from \'your wallet\'"}</script><style>/* @import "missing.css"; */ p::before { content: "url(https://caption.test)"; }</style></head>'));
  assert.deepEqual(validateUiUxDesign(root).errors, []);
});

test("executable literal imports and runtime dependencies are still inspected", (context) => {
  const root = uiFixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const candidate = path.join(root, 'ui-ux/alternatives/main/index.html');
  const baseline = fs.readFileSync(candidate, 'utf8');
  const app = path.join(path.dirname(candidate), 'app.mjs');
  fs.writeFileSync(path.join(path.dirname(candidate), 'local.mjs'), 'export const value = 1;');
  fs.writeFileSync(candidate, baseline.replace('</head>', '<script type="module" src="./app.mjs"></script></head>'));
  for (const script of [
    'import "./local.mjs";',
    'import { value } /* explanation */ from "./local.mjs";',
    'export { value } from "./local.mjs";',
    'export * from "./local.mjs";',
    'import /* explanation */ ("./local.mjs");',
    'require("./local.mjs");',
    'const caption = `Value ${import("./local.mjs")}`;',
  ]) {
    fs.writeFileSync(app, script);
    assert.deepEqual(validateUiUxDesign(root).errors, [], script);
    fs.writeFileSync(app, script.replace('./local.mjs', './missing.mjs'));
    assert.match(validateUiUxDesign(root).errors.join('\n'), /local resource does not resolve/, script);
  }
  for (const script of [
    'import "https://cdn.example.test/app.js";',
    'export * from "https://cdn.example.test/app.js";',
    'fetch /* comment */ ("https://api.example.test/state");',
    'fetch("https://api.example.test/" + action);',
    'import("https://cdn.example.test/app.js");',
    'new Worker("https://cdn.example.test/app.js");',
    'new WebSocket("wss://api.example.test/events");',
    'new EventSource("https://api.example.test/events");',
    'const output = `${fetch("https://api.example.test/state")}`;',
  ]) {
    fs.writeFileSync(app, script);
    assert.match(validateUiUxDesign(root).errors.join('\n'), /remote runtime or resource dependencies/, script);
    fs.writeFileSync(candidate, baseline.replace('</head>', `<script type="module">${script}</script></head>`));
    assert.match(validateUiUxDesign(root).errors.join('\n'), /remote runtime or resource dependencies/, script);
    fs.writeFileSync(candidate, baseline.replace('</head>', '<script type="module" src="./app.mjs"></script></head>'));
  }
});

const errorsOf = (root, options) => validateUiUxDesign(root, options).errors.join("\n");
const mainCoverage = "[Main](../../../ui-ux/specification.md#journey-main)";

function linkDeck(root, { specification = true, launcher = true } = {}) {
  const specPath = path.join(root, "ui-ux/specification.md");
  const launcherPath = path.join(root, "ui-ux/prototype.html");
  if (specification) fs.writeFileSync(specPath, fs.readFileSync(specPath, "utf8").replace("[Main candidate](./alternatives/main/index.html) |", "[Main candidate](./alternatives/main/index.html) · [Slides](./alternatives/main/slides.html) |"));
  if (launcher) fs.writeFileSync(launcherPath, fs.readFileSync(launcherPath, "utf8").replace(">Open prototype</a>", '>Open prototype</a> <a class="button button-slides" href="./alternatives/main/slides.html#view">View slides</a>'));
}

// Instruction-contract checks guard wording only; they do not prove agent behavior.
test("instruction contract: review slideshows are optional, preference-reusing, and capability-gated", () => {
  const workflow = read("references/ui-ux/design-workflow.md");
  const integration = read("references/ui-ux-design.md");
  const skill = read("SKILL.md");
  const specification = read("references/ui-ux/templates/specification.md");
  const choice = workflow.split("### Choose Prototype Count And Directions\n")[1]?.split("\n## ")[0] || "";
  const slides = workflow.split("## Optional Review Slideshows\n")[1]?.split("\n## ")[0] || "";
  assert.ok(choice.includes("Would you also like a browser slideshow of the important screens and states inside each alternative's folder?"));
  assert.match(choice, /when count and directions are already known, ask only that sentence/);
  assert.match(choice, /Omit it when capture capabilities are unavailable, and reuse any known answer/);
  assert.match(slides, /render the actual candidate under its supported entry mode/);
  assert.match(slides, /capture screenshots as saved image bytes that can be embedded/);
  assert.match(slides, /write the finished HTML and reopen it for inspection/);
  assert.match(slides, /do not infer screenshot export from a tool's name/);
  assert.match(slides, /Do not install software, create accounts, use an external service, or require another plugin/);
  assert.match(slides, /skip slides while continuing all feasible prototype work/);
  assert.match(slides, /missing rendering still prevents any visual-review claim/);
  assert.match(slides, /A yes authorizes slides for the agreed candidates with no approval per capture or file/);
  assert.match(slides, /No answer is not a yes/);
  assert.match(slides, /ordinary updates to an existing prototype do not raise the question/);
  assert.match(slides, /Never manufacture missing states, generate or reconstruct screens, frame live pages, or reuse another candidate's screenshots/);
  assert.match(slides, /Screenshots and any generation inputs are temporary working files/);
  assert.match(slides, /Keep the starter's presentation design and script unchanged so every deck looks and works the same/);
  assert.match(slides, /orders slides by one fixed rule, never by capture time or preference, so a viewer can follow one experience at a time:\n  1\. every desktop capture first, then tablet, then phone/);
  assert.match(slides, /desktop 1024 px and wider, tablet 600–1023 px, phone below 600 px/);
  assert.match(slides, /within each viewport, one role at a time: every screen that role sees before the next role's, with roles in the order they first act in the journey and the same order in every viewport/);
  assert.match(slides, /within each role, its main journey in the order that role meets it, including the waiting states that show where another role takes over, then its other product screens outside that journey/);
  assert.match(slides, /prototype-only reviewer or demo tools last in each viewport/);
  assert.match(slides, /Include a state only when something visible changes/);
  assert.match(slides, /the viewer already shows the viewport, role, and step, so captions need not repeat them/);
  assert.match(slides, /If no screenshot can be captured, create no deck/);
  assert.match(slides, /never claim a complete deck after a partial or failed capture/);
  assert.match(slides, /keep the existing screenshots but mark them visibly as outdated/);
  assert.match(slides, /add a View slides button to that candidate's card in the launcher, linking `slides\.html#view` so it opens straight into the viewer; closing the viewer returns to the launcher/);
  assert.match(workflow, /Build `ui-ux\/prototype\.html` from the \[launcher starter\]\(templates\/prototype\.html\) and keep its static design so every launcher looks and works the same/);
  assert.match(slides, /retained candidates that are not being changed need no automatic deck maintenance/);
  assert.match(slides, /never selects a candidate, approves covered flows, reconciles exploratory behavior/);
  assert.match(slides, /Rendering, interaction, and presentation review remain required independently of slides/);
  assert.doesNotMatch(workflow, /Playwright|Chrome|Chromium|Puppeteer|ShowMe|Figma|PowerPoint|Keynote/);
  assert.doesNotMatch(workflow, /\bStage\s+\d|\btickets?\b|\bBuild Unit\b/i);
  assert.match(integration, /Ticket-only changes update canonical requirements and pending entries without rendering or regenerating slides/);
  assert.match(integration, /A missing or stale optional deck does not by itself block prototype completion or delivery readiness/);
  assert.match(integration, /Keep deck-only limitations in explanatory prose, never in pending journey rows/);
  assert.match(integration, /The one permitted derived export is the optional per-candidate `slides\.html`/);
  assert.match(integration, /slides never substitute for this inspection/);
  assert.match(integration, /The helper is a convenience, not a requirement/);
  assert.match(skill, /produced only after opt-in/);
  assert.match(specification, /\*\*Review slideshows \(optional\):\*\*/);
  assert.match(specification, /never as a pending row/);
});

test("the slideshow starter is self-contained and cannot pass as a completed deck", (context) => {
  const html = read("references/ui-ux/templates/slides.html");
  assert.doesNotMatch(html, /type=["']module["']|\bimport\s*\(|\bfetch\s*\(|https?:\/\/|<iframe|<link\b|localStorage|sessionStorage/i);
  assert.match(html, /<main\b[^>]*data-review-slideshow/);
  for (const marker of ["data-slide-previous", "data-slide-next", "data-slide-status", "data-slide-zoom", "data-slideshow-coverage", "ArrowLeft", "ArrowRight", "aria-disabled", ":focus-visible"]) assert.ok(html.includes(marker), marker);
  // One fixed presentation design: a cover with a large open control, and a full-window viewer.
  for (const marker of ["data-slide-open", "data-slide-poster", "<dialog", "showModal", "requestFullscreen", "pointerdown", "data-slide-close", "<details class=\"deck-about\"", "Keep this design and script unchanged", "data-slide-group", 'data-slide-viewport="desktop" data-slide-role="TBD role" data-slide-part="journey"', '"Step "', '"Other screens "']) assert.ok(html.includes(marker), marker);
  assert.doesNotMatch(html, /class="deck-open"/);
  assert.match(html, /\.js-slides \.deck-list \{ display: none; \}/);
  const launcher = read("references/ui-ux/templates/prototype.html");
  assert.doesNotMatch(launcher.replace(/<!--[\s\S]*?-->/g, ""), /slides\.html/);
  assert.match(launcher, /only after a candidate's review slideshow exists/);

  const root = uiFixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.writeFileSync(path.join(root, "ui-ux/alternatives/main/slides.html"), html);
  const errors = errorsOf(root);
  for (const expected of [/meaningful document title/, /data-slideshow-coverage/, /slide 1 screenshot is not a decodable PNG, JPEG, or WebP/, /slide 1 requires a meaningful screenshot description/, /slide 1 requires a meaningful visible figcaption/]) assert.match(errors, expected);
});

test("a populated screenshot deck beside a real candidate passes without product markers", (context) => {
  const root = uiFixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const candidateRoot = path.join(root, "ui-ux/alternatives/main");
  // Opted-out or unavailable slides: absence is valid everywhere.
  assert.deepEqual(validateUiUxDesign(root).errors, []);
  assert.deepEqual(validateUiUxDesign(root, { selectedOnly: true }).errors, []);
  assert.deepEqual(validateUiUxJourneyReadiness(root, mainCoverage), []);

  writeDeck(candidateRoot, { manifest: { prototype: { href: "./index.html" } } });
  const deck = fs.readFileSync(path.join(candidateRoot, "slides.html"), "utf8");
  assert.doesNotMatch(deck, /data-product-(?:surface|action|outcome)|data-prototype-(?:state|reviewer|disclosure)/);
  linkDeck(root);
  const candidate = path.join(candidateRoot, "index.html");
  fs.writeFileSync(candidate, fs.readFileSync(candidate, "utf8").replace("</main>", '<a href="./slides.html">View slides</a></main>'));
  assert.deepEqual(validateUiUxDesign(root).errors, []);
  assert.deepEqual(validateUiUxDesign(root, { selectedOnly: true }).errors, []);
  assert.deepEqual(validateUiUxJourneyReadiness(root, mainCoverage), []);
  writeDeck(candidateRoot, { slides: 1 });
  assert.deepEqual(validateUiUxDesign(root).errors, []);
});

test("a review slideshow is never the selected target, an entrypoint, or interaction evidence", (context) => {
  const root = uiFixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const uiRoot = path.join(root, "ui-ux");
  const specPath = path.join(uiRoot, "specification.md");
  const candidateRoot = path.join(uiRoot, "alternatives/main");
  const candidate = path.join(candidateRoot, "index.html");
  const baseline = fs.readFileSync(candidate, "utf8");
  const spec = fs.readFileSync(specPath, "utf8");
  writeDeck(candidateRoot);

  fs.writeFileSync(specPath, spec.replace("`./alternatives/main/index.html`.", "`./alternatives/main/slides.html` — [Slides](./alternatives/main/slides.html)."));
  assert.match(errorsOf(root), /selected implementation target must be a candidate product page, not a review slideshow/);
  assert.match(validateUiUxJourneyReadiness(root, mainCoverage).join("\n"), /explicitly selected candidate entrypoint/);

  // A marked deck under another name cannot impersonate a product page.
  fs.copyFileSync(path.join(candidateRoot, "slides.html"), path.join(candidateRoot, "tour.html"));
  fs.writeFileSync(specPath, spec.replace("`./alternatives/main/index.html`.", "`./alternatives/main/tour.html` — [Tour](./alternatives/main/tour.html)."));
  assert.match(errorsOf(root), /not a review slideshow/);
  assert.match(errorsOf(root), /tour\.html: a review slideshow must live at alternatives\/<candidate>\/slides\.html/);
  fs.rmSync(path.join(candidateRoot, "tour.html"));

  // A candidate with only a deck has no entrypoint.
  const deckOnly = path.join(uiRoot, "alternatives/deck-only");
  fs.mkdirSync(deckOnly);
  writeDeck(deckOnly);
  fs.writeFileSync(specPath, spec + "\n[Deck-only slides](./alternatives/deck-only/slides.html)\n");
  assert.match(errorsOf(root), /must link a candidate entrypoint for deck-only\. Its review slideshow is not a candidate entrypoint/);
  fs.rmSync(deckOnly, { recursive: true });
  fs.writeFileSync(specPath, spec);

  // Neither deck markup nor a page reached only through the deck supplies missing interactions.
  fs.writeFileSync(path.join(candidateRoot, "full.html"), baseline);
  writeDeck(candidateRoot, { manifest: { prototype: { href: "./full.html" } } });
  const deckPath = path.join(candidateRoot, "slides.html");
  const markers = '<div hidden data-product-surface data-product-action data-product-outcome data-next-step data-cancel-action data-recovery-action data-prototype-state="x" data-demo-only="x" data-prototype-disclosure></div><details data-prototype-reviewer><summary>Tools</summary><button data-review-state-target="a">A</button><button data-review-state-target="b">B</button></details>';
  fs.writeFileSync(deckPath, fs.readFileSync(deckPath, "utf8").replace("</main>", markers + "</main>"));
  fs.writeFileSync(candidate, '<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width"></head><body><main>Static sketch <a href="./slides.html">Slides</a></main><script>void 0;</script></body></html>');
  const errors = errorsOf(root);
  assert.match(errors, /must include a meaningful product action/);
  assert.match(errors, /collapsible prototype reviewer area/);
  assert.match(errorsOf(root, { selectedOnly: true }), /must include a meaningful product action/);
});

test("declared decks must exist and embed plausible screenshots and every rendering resource", (context) => {
  const root = uiFixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const candidateRoot = path.join(root, "ui-ux/alternatives/main");
  const deckPath = path.join(candidateRoot, "slides.html");
  linkDeck(root);
  assert.match(errorsOf(root), /linked review slideshow does not exist: \.\/alternatives\/main\/slides\.html/);
  assert.match(errorsOf(root), /prototype\.html: local resource does not resolve inside ui-ux\/: \.\/alternatives\/main\/slides\.html/);
  assert.match(errorsOf(root, { selectedOnly: true }), /linked review slideshow does not exist/);
  writeDeck(candidateRoot);
  assert.deepEqual(validateUiUxDesign(root).errors, []);
  const deck = fs.readFileSync(deckPath, "utf8");
  const firstImage = /src="data:image\/png;base64,[^"]+"/;
  for (const [mutate, expected] of [
    [(html) => html.replace("</head>", '<script src="https://cdn.example.test/viewer.js"></script></head>'), /must embed every rendering resource; found external dependency: https:\/\/cdn\.example\.test/],
    [(html) => html.replace("</head>", '<link rel="stylesheet" href="./deck.css"></head>'), /found external dependency: \.\/deck\.css/],
    [(html) => html.replace("</style>", "@import url(https://fonts.example.test/font.css);</style>"), /found external dependency: https:\/\/fonts\.example\.test/],
    [(html) => html.replace("</script>", 'fetch("./state.json");</script>'), /found external dependency: \.\/state\.json/],
    [(html) => html.replace(firstImage, 'src="./shot.png"'), /slide 1 screenshot must be a base64 data:image/],
    [(html) => html.replace(firstImage, 'src="https://images.example.test/shot.png"'), /found external dependency: https:\/\/images\.example\.test/],
    [(html) => html.replace(firstImage, `src="${pngDataUrl(1, 1)}"`), /slide 1 screenshot is 1×1 px, too small/],
    [(html) => html.replace(/(src="data:image\/png;base64,)([^"]+)"/, (_, prefix, payload) => `${prefix}${payload.slice(0, Math.floor(payload.length / 8) * 4)}"`), /slide 1 screenshot is truncated/],
    [(html) => html.replace('src="data:image/png;base64,', 'src="data:image/jpeg;base64,'), /declares image\/jpeg but contains image\/png/],
    [(html) => html.replace(firstImage, 'src="data:image/svg+xml;base64,PHN2Zz48L3N2Zz4="'), /slide 1 screenshot is not a decodable PNG, JPEG, or WebP/],
    [(html) => html.replace('alt="Captured view 1 of the candidate"', 'alt=""'), /slide 1 requires a meaningful screenshot description/],
    [(html) => html.replace(/<figcaption>[\s\S]*?<\/figcaption>/, "<figcaption>TBD</figcaption>"), /slide 1 requires a meaningful visible figcaption/],
    [(html) => html.replace(/<figure\b[\s\S]*<\/figure>/, ""), /requires at least one <figure data-slide> screenshot slide/],
    [(html) => html.replace("<script>", '<script type="module">'), /must use classic scripts/],
    [(html) => html.replace("</main>", '<iframe src="./index.html"></iframe></main>'), /not embedded live pages or objects/],
    [(html) => html.replace(" data-review-slideshow", ""), /must mark its main region with data-review-slideshow/],
    [(html) => html.replace(/<time datetime="[^"]+">/, "<time>"), /<time datetime> capture date/],
    [(html) => html.replace(" data-slide-next", ""), /requires a Next button marked data-slide-next/],
    [(html) => html.replace(' data-slide-viewport="desktop"', ""), /slide 1 requires data-slide-viewport desktop, tablet, or phone/],
    [(html) => html.replace(' data-slide-part="journey"', ' data-slide-part="extras"'), /slide 1 requires data-slide-part journey, other, or reviewer/],
    [(html) => html.replace(' data-slide-viewport="desktop"', ' data-slide-viewport="phone"'), /slide 2 \(desktop · Customer · journey\) is out of order/],
    [(html) => html.replace(' data-slide-part="journey"', ' data-slide-part="reviewer"'), /slide 2 \(desktop · Customer · journey\) is out of order/],
    [(html) => html.replace(' data-slide-role="Customer"', ""), /slide 1 requires data-slide-role naming the role whose screen it shows/],
  ]) {
    fs.writeFileSync(deckPath, mutate(deck));
    assert.match(errorsOf(root), expected, String(expected));
  }
  // One role at a time: a role's screens may not be split by another role's.
  writeDeck(candidateRoot, { slides: 3 });
  let seen = 0;
  const threeSlides = fs.readFileSync(deckPath, "utf8");
  fs.writeFileSync(deckPath, threeSlides.replace(/ data-slide-role="Customer"/g, (match) => (++seen === 2 ? ' data-slide-role="Operator"' : match)));
  assert.match(errorsOf(root), /slide 3 \(desktop · Customer · journey\) is out of order/);
  seen = 0;
  fs.writeFileSync(deckPath, threeSlides.replace(/ data-slide-role="Customer"/g, (match) => (++seen === 3 ? ' data-slide-role="Operator"' : match)));
  assert.match(fs.readFileSync(deckPath, "utf8"), /data-slide-role="Operator"/);
  assert.doesNotMatch(errorsOf(root), /out of order/);
  fs.writeFileSync(deckPath, deck);
  const launcherPath = path.join(root, "ui-ux/prototype.html");
  const launcher = fs.readFileSync(launcherPath, "utf8");
  fs.writeFileSync(launcherPath, launcher.replace("slides.html#view", "slides.html"));
  assert.match(errorsOf(root), /launcher must give main a View slides button linking \.\/alternatives\/main\/slides\.html#view/);
  fs.writeFileSync(launcherPath, launcher.replace(/ <a class="button button-slides"[^>]*>View slides<\/a>/, ""));
  assert.match(errorsOf(root), /launcher must give main a View slides button/);
  assert.deepEqual(validateUiUxDesign(root, { selectedOnly: true }).errors, []);
  fs.writeFileSync(launcherPath, launcher);
  fs.writeFileSync(deckPath, deck.replace("</main>", '<p><a href="./missing.html">Prototype</a> · <a href="https://example.com/policy">Policy</a></p></main>'));
  assert.match(errorsOf(root), /navigation link does not resolve inside ui-ux\/: \.\/missing\.html/);
  assert.doesNotMatch(errorsOf(root), /example\.com/);
});

test("multi-page role candidates keep combined review while their deck stays separate", (context) => {
  const root = uiFixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const candidateRoot = path.join(root, "ui-ux/alternatives/main");
  const candidate = path.join(candidateRoot, "index.html");
  const operator = path.join(candidateRoot, "operator.html");
  const baseline = fs.readFileSync(candidate, "utf8");
  const operatorPage = '<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width"></head><body><main>Operator queue <a href="./index.html">Customer</a> <a href="./slides.html">Slides</a></main></body></html>';
  fs.writeFileSync(candidate, baseline.replace("</main>", '<a href="./operator.html">Operator view</a> <a href="./slides.html">Slides</a></main>'));
  fs.writeFileSync(operator, operatorPage);
  writeDeck(candidateRoot, { slides: 3 });
  linkDeck(root);
  const specPath = path.join(root, "ui-ux/specification.md");
  fs.appendFileSync(specPath, "\n[Operator page](./alternatives/main/operator.html)\n");
  assert.deepEqual(validateUiUxDesign(root).errors, []);
  assert.deepEqual(validateUiUxDesign(root, { selectedOnly: true }).errors, []);

  // Moving the recovery action into the deck fails; moving it to the operator page still passes.
  const withoutRecovery = fs.readFileSync(candidate, "utf8").replaceAll("data-recovery-action", "data-exploratory-action");
  fs.writeFileSync(candidate, withoutRecovery);
  const deckPath = path.join(candidateRoot, "slides.html");
  const deck = fs.readFileSync(deckPath, "utf8");
  fs.writeFileSync(deckPath, deck.replace("</main>", '<button hidden data-recovery-action>Retry</button></main>'));
  assert.match(errorsOf(root, { selectedOnly: true }), /failure recovery behavior/);
  fs.writeFileSync(deckPath, deck);
  fs.writeFileSync(operator, operatorPage.replace("</main>", '<button type="button" data-recovery-action>Try again</button></main>'));
  assert.deepEqual(validateUiUxDesign(root, { selectedOnly: true }).errors, []);
  assert.deepEqual(validateUiUxJourneyReadiness(root, mainCoverage), []);
});

test("selected-scope checks ignore unrelated candidate decks and never require slides", (context) => {
  const root = uiFixture();
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const uiRoot = path.join(root, "ui-ux");
  const otherRoot = path.join(uiRoot, "alternatives/other");
  fs.mkdirSync(otherRoot);
  fs.copyFileSync(path.join(uiRoot, "alternatives/main/index.html"), path.join(otherRoot, "index.html"));
  fs.appendFileSync(path.join(uiRoot, "specification.md"), "\n[Other](./alternatives/other/index.html) · [Slides](./alternatives/other/slides.html) — retained comparison.\n");
  writeDeck(otherRoot);
  const otherDeck = path.join(otherRoot, "slides.html");
  fs.writeFileSync(otherDeck, fs.readFileSync(otherDeck, "utf8").replace(/<figcaption>[\s\S]*?<\/figcaption>/, "<figcaption>TBD</figcaption>"));
  assert.match(errorsOf(root), /other\/slides\.html: review slideshow slide 1 requires a meaningful visible figcaption/);
  assert.deepEqual(validateUiUxDesign(root, { selectedOnly: true }).errors, []);
  assert.deepEqual(validateUiUxJourneyReadiness(root, mainCoverage), []);
  fs.rmSync(otherDeck);
  assert.match(errorsOf(root), /linked review slideshow does not exist: \.\/alternatives\/other\/slides\.html/);
  assert.deepEqual(validateUiUxDesign(root, { selectedOnly: true }).errors, []);
  assert.equal(fs.existsSync(path.join(uiRoot, "alternatives/main/slides.html")), false);
  assert.deepEqual(validateUiUxJourneyReadiness(root, mainCoverage), []);
});
