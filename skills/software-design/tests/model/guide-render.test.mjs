import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { readSystemGuide } from "../../scripts/lib/model/system-guide.mjs";
import { renderEditionHtml } from "../../scripts/lib/system-guide/render.mjs";
import { createGuidePackage, edit, write } from "../support/system-guide-fixture.mjs";

function scopeRecord(id, name) {
  return `---
type: system-scope-boundary
id: ${id}
name: ${name}
---

# ${id} — ${name}

## Boundary

${name} is out of scope.
`;
}

function render(root, edition) {
  return renderEditionHtml({ root, guide: readSystemGuide(root), edition, generatedDate: "2026-10-15", fingerprint: "a".repeat(64), cssFile: "/guide.css" });
}

const text = (html) => html.replace(/<style>[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ");

test("a separate domain edition keeps compact guide navigation and omits the record catalogue without identifiers or paths", (context) => {
  const { workspace, root } = createGuidePackage();
  context.after(() => fs.rmSync(workspace, { recursive: true, force: true }));
  write(path.join(root, "system-model/contracts/scope/scope-001-chargebacks.md"), scopeRecord("SCOPE-001", "Card Chargebacks"));
  write(path.join(root, "system-model/contracts/scope/scope-002-refund-fees.md"), scopeRecord("SCOPE-002", "Refund Fees"));
  edit(path.join(root, "guide/domains/settlement.md"), (source) => source.replace("## Where the exact rules live", `## What settlement does not cover

Settlement handles neither [card chargebacks](../../system-model/contracts/scope/scope-001-chargebacks.md) nor [refund fees](../../system-model/contracts/scope/scope-002-refund-fees.md). The [provider's status page](https://status.example.com) shows outages.

## Where the exact rules live`));

  const { html, title, headings } = render(root, { kind: "domain", keys: ["domain:settlement"] });
  const visible = text(html);
  assert.equal(title, "Payment Settlement");
  assert.match(visible, /This is the domain guide for Payment Settlement, one of the two domains of Example Payment System\./);
  assert.doesNotMatch(visible, /Scope boundaries: Card Chargebacks; Refund Fees\./);
  assert.doesNotMatch(visible, /Responsibility record: Provider Settlement\./);
  assert.doesNotMatch(visible, /Domain record: Payment Settlement\./);
  assert.match(visible, /Other guides: .*Request Intake/);
  assert.match(html, /<a href="https:\/\/status\.example\.com">provider&#39;s status page<\/a>/);
  assert.match(html, /<span class="ref">the eligibility section<\/span>/, "a link into a guide outside this edition prints as plain text");
  assert.doesNotMatch(visible, /\b(?:SR|SCOPE|DOMAIN)-\d|system-model\/|\.md\b/);
  assert.ok(!headings.includes("Other guides"));
  assert.ok(!headings.includes("Technical records"));
});

test("the architecture edition names every domain without a record catalogue", (context) => {
  const { workspace, root } = createGuidePackage();
  context.after(() => fs.rmSync(workspace, { recursive: true, force: true }));
  const visible = text(render(root, { kind: "architecture", keys: ["architecture"] }).html);
  assert.match(visible, /This is the architecture guide of Example Payment System\. It explains how the system works as a whole\. Each of its two domains has a separate domain guide: Request Intake and Payment Settlement\./);
  assert.doesNotMatch(visible, /Architecture record: Example Payment System Architecture\./);
});

test("the combined edition links every guide internally without appending a record catalogue", (context) => {
  const { workspace, root } = createGuidePackage();
  context.after(() => fs.rmSync(workspace, { recursive: true, force: true }));
  const { html, headings } = render(root, { kind: "combined", keys: ["architecture", "domain:intake", "domain:settlement"] });
  assert.match(html, /<a href="#domain-intake--when-a-request-is-rejected">the eligibility section<\/a>/);
  assert.doesNotMatch(html, /Other guides/);
  assert.equal(headings.filter((heading) => heading === "Technical records").length, 0);
  const order = ["How the Example Payment System works", "Request Intake", "Payment Settlement"].map((heading) => headings.indexOf(heading));
  assert.deepEqual([...order].sort((left, right) => left - right), order);
});

test("the combined edition omits the records page and its Contents entry", (context) => {
  const { workspace, root } = createGuidePackage();
  context.after(() => fs.rmSync(workspace, { recursive: true, force: true }));
  const { html } = render(root, { kind: "combined", keys: ["architecture", "domain:intake", "domain:settlement"] });
  assert.doesNotMatch(html, /@page records|page: records|edition--technical-records|Technical records/);
  assert.ok(html.indexOf("contents-page") < html.indexOf("guide-doc"));
});

test("System Explorer links keep their source labels without a generated catalogue", (context) => {
  const { workspace, root } = createGuidePackage();
  context.after(() => fs.rmSync(workspace, { recursive: true, force: true }));
  write(path.join(root, "visuals/index.html"), "<!doctype html><title>Example Payment System</title>\n");
  write(path.join(root, "visuals/pages/states.html"), "<!doctype html><title>Example Payment System · States and transitions</title>\n");
  edit(path.join(root, "guide/domains/settlement.md"), (source) => source.replace("## Where the exact rules live", `## Views

The [System Explorer](../../visuals/index.html) and its [state view](../../visuals/pages/states.html) draw the same lifecycle.

## Where the exact rules live`));
  const visible = text(render(root, { kind: "domain", keys: ["domain:settlement"] }).html);
  assert.match(visible, /System Explorer and its state view/);
  assert.doesNotMatch(visible, /Index\b|Example Payment System · /);
  const lone = (() => {
    edit(path.join(root, "guide/domains/settlement.md"), (source) => source.replace(" and its [state view](../../visuals/pages/states.html)", ""));
    return text(render(root, { kind: "domain", keys: ["domain:settlement"] }).html);
  })();
  assert.match(lone, /System Explorer draw the same lifecycle/);
  assert.doesNotMatch(lone, /System Explorer:/);
});

test("rendering refuses an internal link whose target is not in the edition", (context) => {
  const { workspace, root } = createGuidePackage();
  context.after(() => fs.rmSync(workspace, { recursive: true, force: true }));
  const guide = readSystemGuide(root);
  const intake = guide.domains.find((domain) => domain.key === "domain:intake");
  intake.document.headings = intake.document.headings.filter((heading) => heading.slug !== "when-a-request-is-rejected");
  for (const block of intake.document.blocks) if (block.slug === "when-a-request-is-rejected") block.slug = "renamed";
  assert.throws(() => renderEditionHtml({ root, guide, edition: { kind: "combined", keys: ["architecture", "domain:intake", "domain:settlement"] }, generatedDate: "2026-10-15", fingerprint: "a".repeat(64), cssFile: "/guide.css" }), /when-a-request-is-rejected/);
});

test("a paragraph introducing a figure, or ending in a colon before a list, table or code, keeps with it", (context) => {
  const { workspace, root } = createGuidePackage();
  context.after(() => fs.rmSync(workspace, { recursive: true, force: true }));
  edit(path.join(root, "guide/domains/settlement.md"), (text) => text.replace("## Where the exact rules live", `## Retry order

A retry follows three rules:

- It keeps the reference.
- It waits for the answer.

These rules apply to every provider.

- One provider retries itself.

The order of a retry:

\`\`\`figure
caption: One reference throughout.
step: Sent | Settlement sends the request.
step: Confirmed | The provider confirms.
\`\`\`

> **Inside a callout**
> Two cases differ:
>
> - A timeout retries.

## Where the exact rules live`));
  const { html } = render(root, { kind: "domain", keys: ["domain:settlement"] });
  const kept = [...html.matchAll(/<p class="keep-with-next">(.*?)<\/p>/g)].map((match) => match[1]);
  assert.deepEqual(kept, ["A retry follows three rules:", "The order of a retry:", "Two cases differ:"]);
  assert.match(html, /<p>These rules apply to every provider\.<\/p>/);
});
