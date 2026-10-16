// Export boundaries: incomplete scope, document identity, failure-safe
// publication and the output location. Browser-free checks run everywhere;
// printing checks need a Chromium-based browser.

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, describe, test } from "node:test";
import { fileURLToPath } from "node:url";
import { readSystemGuide, validateSystemGuide } from "../../scripts/lib/model/system-guide.mjs";
import { browserAvailable } from "../../scripts/lib/system-guide/chromium.mjs";
import { ExportError, exportSystemGuide, publishOutputs } from "../../scripts/lib/system-guide/export.mjs";
import { PdfFile } from "../../scripts/lib/system-guide/pdf-file.mjs";
import { renderEditionHtml } from "../../scripts/lib/system-guide/render.mjs";
import { createGuidePackage, edit, renameDomainSlugs, unwriteDomain, unwriteResponsibilities } from "../support/system-guide-fixture.mjs";

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const exporter = path.join(skillRoot, "scripts/export-system-guide.mjs");
const DATE = "2026-10-15";

const run = (root, out, args) => spawnSync(process.execPath, [exporter, "--root", root, "--out", out, "--date", DATE, ...args], { encoding: "utf8" });
const sha256 = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const outputFiles = (directory) => fs.readdirSync(directory, { recursive: true }).filter((name) => fs.statSync(path.join(directory, name)).isFile()).sort();
const snapshot = (directory) => Object.fromEntries(outputFiles(directory).filter((name) => !name.split(path.sep).some((part) => part.startsWith(".") && part !== ".metadata")).map((name) => [name, sha256(path.join(directory, name))]));
const pdfText = (file) => {
  const pdf = new PdfFile(fs.readFileSync(file));
  return pdf.pages().map((_, index) => pdf.pageText(index).map((item) => item.text).join("")).join("\n").replace(/\s+/g, "");
};
const squash = (value) => value.replace(/\s+/g, "");
const visible = (html) => html.replace(/<style>[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ");

function fixture(context, prepare = () => {}) {
  const created = createGuidePackage();
  prepare(created.root);
  context.after(() => fs.rmSync(created.workspace, { recursive: true, force: true }));
  return created;
}

describe("Partial packages and complete exports", () => {
  test("Stage 1: declared domains without records validate, and complete exports refuse them by name", (context) => {
    const { root, workspace } = fixture(context, (base) => { unwriteDomain(base, "intake"); unwriteDomain(base, "settlement"); });
    assert.deepEqual(validateSystemGuide(root), [], "an architecture guide naming planned domains is valid while Stage 2 is pending");
    assert.deepEqual(readSystemGuide(root).planned, ["intake", "settlement"]);
    const out = path.join(workspace, "pdf");
    for (const scope of [["--all"], ["--combined"], ["--combined", "--check"]]) {
      const result = run(root, out, scope);
      assert.equal(result.status, 1, scope.join(" "));
      assert.match(result.stderr, /export the complete System Guide, but the architecture record declares domains without a domain record and guide yet: intake, settlement\. Write them first \(Stage 2\), or export the finished guides with --architecture or --domain <slug>\./);
    }
    const domain = run(root, out, ["--domain", "intake", "--check"]);
    assert.equal(domain.status, 1);
    assert.match(domain.stderr, /The domain intake is declared but has no domain record and guide yet/);
    const architecture = run(root, out, ["--architecture", "--check"]);
    assert.equal(architecture.status, 1);
    assert.match(architecture.stdout, /^missing: .*architecture\.pdf$/m, "the finished architecture guide stays exportable");
    assert.equal(fs.existsSync(out), false);
  });

  test("Stage 2 in progress: one domain written before its responsibilities, one still planned", (context) => {
    const { root, workspace } = fixture(context, (base) => { unwriteDomain(base, "settlement"); unwriteResponsibilities(base, "intake"); });
    assert.deepEqual(validateSystemGuide(root), []);
    const guide = readSystemGuide(root);
    assert.deepEqual(guide.domains.map((domain) => domain.slug), ["intake"]);
    assert.deepEqual(guide.planned, ["settlement"]);
    const out = path.join(workspace, "pdf");
    const combined = run(root, out, ["--combined", "--check"]);
    assert.equal(combined.status, 1);
    assert.match(combined.stderr, /declares a domain without a domain record and guide yet: settlement\. Write it first/);
    const scoped = run(root, out, ["--architecture", "--domain", "intake", "--check"]);
    assert.equal(scoped.stdout.match(/^missing: /gm).length, 2, scoped.stderr);
    const html = visible(renderEditionHtml({ root, guide, edition: { kind: "architecture", keys: ["architecture"] }, generatedDate: DATE, fingerprint: "a".repeat(64), cssFile: "/guide.css" }).html);
    assert.match(html, /The design declares two domains\. Domain guides exist for Request Intake\. The guide for settlement is not written yet\./, "a scoped architecture PDF states what is missing instead of implying completeness");
  });

  test("a declared domain whose record and guide were removed cannot disappear from a combined export", (context) => {
    const { root, workspace } = fixture(context, (base) => unwriteDomain(base, "settlement"));
    assert.deepEqual(validateSystemGuide(root), []);
    const result = run(root, path.join(workspace, "pdf"), ["--all", "--combined"]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /--all and --combined export the complete System Guide.*: settlement\./);
  });

  test("a domain guide written before its domain record is an orphan", (context) => {
    const { root } = fixture(context, (base) => fs.rmSync(path.join(base, "system-model/domains/settlement"), { recursive: true }));
    assert.ok(validateSystemGuide(root).some((error) => /settlement\.md: orphan domain guide/.test(error)));
  });
});

describe("Domain slugs that match edition names", () => {
  test("domains named architecture and system-guide keep distinct documents, anchors and links", (context) => {
    const { root } = fixture(context, (base) => renameDomainSlugs(base, { intake: "architecture", settlement: "system-guide" }));
    assert.deepEqual(validateSystemGuide(root), []);
    const guide = readSystemGuide(root);
    assert.deepEqual([guide.architecture.key, ...guide.domains.map((domain) => domain.key)], ["architecture", "domain:architecture", "domain:system-guide"]);
    const edition = { kind: "combined", keys: ["architecture", "domain:architecture", "domain:system-guide"] };
    const { html, headings } = renderEditionHtml({ root, guide, edition, generatedDate: DATE, fingerprint: "a".repeat(64), cssFile: "/guide.css" });
    assert.match(html, /<section class="guide-doc" id="architecture"/);
    assert.match(html, /<section class="guide-doc" id="domain-architecture"/);
    assert.match(html, /<section class="guide-doc" id="domain-system-guide"/);
    assert.match(html, /<a href="#domain-architecture">Request Intake<\/a>/, "the architecture guide links the domain named architecture, not itself");
    assert.match(html, /<a href="#domain-architecture--when-a-request-is-rejected">the eligibility section<\/a>/);
    assert.deepEqual(headings.filter((heading) => ["How the Example Payment System works", "Request Intake", "Payment Settlement"].includes(heading)), ["How the Example Payment System works", "Request Intake", "Payment Settlement"]);
  });
});

describe("Failure-safe publication", () => {
  function staged(context) {
    const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "software-design-publish-"));
    context.after(() => fs.rmSync(workspace, { recursive: true, force: true }));
    const out = path.join(workspace, "out");
    const work = path.join(out, ".work");
    fs.mkdirSync(work, { recursive: true });
    const names = ["a.pdf", "b.pdf", "c.pdf", "system-guide-export.json"];
    names.slice(0, 2).concat("system-guide-export.json").forEach((name) => fs.writeFileSync(path.join(out, name), `previous ${name}\n`));
    const entries = names.map((name) => {
      const temporary = path.join(work, name);
      fs.writeFileSync(temporary, `next ${name}\n`);
      return { temporary, destination: path.join(out, name) };
    });
    return { out, work, entries, before: snapshot(out) };
  }

  const failingRename = (failAt) => {
    let calls = 0;
    return { rename: (from, to) => { calls += 1; if (calls === failAt) throw new Error(`injected failure on rename ${calls}`); fs.renameSync(from, to); }, remove: (file) => fs.rmSync(file, { force: true }) };
  };

  // Renames: 1 back up a, 2 publish a, 3 back up b, 4 publish b, 5 publish c (new), 6 back up manifest, 7 publish manifest.
  for (const [failAt, moment] of [[3, "after a was replaced"], [4, "after a was replaced and b backed up"], [5, "while adding a new PDF"], [7, "on the manifest, after every PDF was replaced"]]) {
    test(`a failure ${moment} restores every previous file byte for byte`, (context) => {
      const { out, work, entries, before } = staged(context);
      assert.throws(() => publishOutputs(entries, path.join(work, "previous"), failingRename(failAt)), (error) => error instanceof ExportError && /every previous file was restored and nothing was replaced/.test(error.message));
      const after = snapshot(out);
      assert.deepEqual(after, before);
      assert.equal(fs.existsSync(path.join(out, "c.pdf")), false, "a PDF that did not exist before is removed again");
    });
  }

  test("when restoring fails too, the error names the file and where its previous version is kept", (context) => {
    const { work, entries } = staged(context);
    const ops = { ...failingRename(4), remove: () => { throw new Error("injected removal failure"); } };
    assert.throws(() => publishOutputs(entries, path.join(work, "previous"), ops), (error) => {
      assert.match(error.message, /could not be restored:\n {2}.*a\.pdf \(previous version kept at .*previous\/0-a\.pdf\): injected removal failure/);
      assert.equal(error.keepBackups, true);
      return true;
    });
    assert.equal(fs.readFileSync(path.join(work, "previous/0-a.pdf"), "utf8"), "previous a.pdf\n");
  });

  test("a destination that is not a regular file stops publication before anything moves", (context) => {
    const { out, work, entries } = staged(context);
    fs.rmSync(path.join(out, "b.pdf"));
    fs.mkdirSync(path.join(out, "b.pdf"));
    const unchanged = (directory) => Object.fromEntries(fs.readdirSync(directory).filter((name) => fs.statSync(path.join(directory, name)).isFile()).map((name) => [name, sha256(path.join(directory, name))]));
    const expected = unchanged(out);
    assert.throws(() => publishOutputs(entries, path.join(work, "previous")), /b\.pdf exists and is not a regular file; nothing was replaced/);
    assert.deepEqual(unchanged(out), expected);
    assert.equal(fs.existsSync(path.join(work, "a.pdf")), true, "the staged files are untouched");
  });
});

describe("Output location", () => {
  test("a nested output symlink cannot redirect PDFs or metadata outside the export directory", (context) => {
    for (const folder of ["domains", ".metadata"]) {
      const { root, workspace } = fixture(context);
      const out = path.join(workspace, "pdf");
      fs.mkdirSync(out);
      fs.symlinkSync(path.join(root, "guide/domains"), path.join(out, folder));
      const result = run(root, out, ["--all", "--check"]);
      assert.equal(result.status, 1);
      assert.match(result.stderr, /resolves outside the export directory or inside the design package/);
      assert.equal(fs.existsSync(path.join(root, "guide/domains/intake.pdf")), false);
      assert.equal(fs.existsSync(path.join(root, "guide/domains/system-guide-export.json")), false);
    }
  });

  test("a symlink into the package is refused, a symlink to an outside directory is accepted", (context) => {
    const { root, workspace } = fixture(context);
    const intoPackage = path.join(workspace, "looks-outside");
    fs.symlinkSync(root, intoPackage);
    const direct = run(root, intoPackage, ["--all"]);
    assert.equal(direct.status, 1);
    assert.match(direct.stderr, /is inside the design package \(through a symbolic link it resolves to .*software-design\)/);

    const intoGuide = path.join(workspace, "guide-link");
    fs.symlinkSync(path.join(root, "guide"), intoGuide);
    const notYetCreated = run(root, path.join(intoGuide, "new", "pdf"), ["--all"]);
    assert.equal(notYetCreated.status, 1, "a destination that does not exist yet is judged by its nearest existing ancestor");
    assert.match(notYetCreated.stderr, /is inside the design package \(through a symbolic link/);
    assert.equal(fs.existsSync(path.join(root, "guide", "new")), false);

    const outside = path.join(workspace, "outside-target");
    fs.mkdirSync(outside);
    const toOutside = path.join(workspace, "outside-link");
    fs.symlinkSync(outside, toOutside);
    const accepted = run(root, path.join(toOutside, "pdf"), ["--all", "--check"]);
    assert.match(accepted.stdout, /^missing: /m, accepted.stderr);
    assert.doesNotMatch(accepted.stderr, /inside the design package/);

    const rootLink = path.join(workspace, "package-link");
    fs.symlinkSync(root, rootLink);
    const viaRoot = run(rootLink, path.join(root, "pdf"), ["--all"]);
    assert.equal(viaRoot.status, 1, "a package reached through a symlink still contains its real directories");
    assert.match(viaRoot.stderr, /inside the design package/);
  });
});

const browserSkip = browserAvailable() ? false : "no Chromium-based browser found (set SOFTWARE_DESIGN_PDF_BROWSER or run npx playwright install chromium)";

describe("Printed editions with colliding names", { skip: browserSkip }, () => {
  let base;
  let out;
  let result;
  const FILES = {
    architecture: "architecture.pdf",
    domainArchitecture: "domains/architecture.pdf",
    domainSystemGuide: "domains/system-guide.pdf",
    combined: "system-guide.pdf",
  };

  before(() => {
    base = createGuidePackage();
    renameDomainSlugs(base.root, { intake: "architecture", settlement: "system-guide" });
    out = path.join(base.workspace, "pdf");
    result = run(base.root, out, ["--all", "--combined"]);
  });
  after(() => fs.rmSync(base.workspace, { recursive: true, force: true }));

  test("--all and --combined write four distinct PDFs with the right content", () => {
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(fs.readdirSync(out).sort(), [".metadata", "architecture.pdf", "domains", "system-guide.pdf"]);
    assert.deepEqual(outputFiles(out), [...Object.values(FILES), ".metadata/system-guide-export.json"].sort());
    const architecture = pdfText(path.join(out, FILES.architecture));
    assert.ok(architecture.includes(squash("This is the architecture guide of Example Payment System")));
    assert.ok(!architecture.includes(squash("Request Intake decides, once")), "the architecture PDF holds only the architecture guide");
    const intake = pdfText(path.join(out, FILES.domainArchitecture));
    assert.ok(intake.includes(squash("Request Intake decides, once")));
    assert.ok(intake.includes(squash("This is the domain guide for Request Intake")));
    const settlement = pdfText(path.join(out, FILES.domainSystemGuide));
    assert.ok(settlement.includes(squash("Payment Settlement turns an approved request")));
    const combined = pdfText(path.join(out, FILES.combined));
    const order = ["Architecture guide: How the Example Payment System works", "Domain guide: Request Intake", "Domain guide: Payment Settlement"].map((entry) => combined.indexOf(squash(entry)));
    assert.ok(order.every((position) => position >= 0) && order[0] < order[1] && order[1] < order[2], `cover order ${order}`);
    const manifest = JSON.parse(fs.readFileSync(path.join(out, ".metadata/system-guide-export.json"), "utf8"));
    assert.deepEqual(manifest.outputs[FILES.combined].documents, ["architecture", "domain:architecture", "domain:system-guide"]);
    assert.deepEqual(manifest.outputs[FILES.domainArchitecture].sources.map((source) => source.path), ["guide/domains/architecture.md"]);
  });

  test("links in the combined edition reach the domain named architecture", () => {
    const pdf = new PdfFile(fs.readFileSync(path.join(out, FILES.combined)));
    const destinations = pdf.namedDestinations();
    const links = pdf.pages().flatMap((_, index) => pdf.links(index)).filter((link) => link.dest);
    for (const link of links) assert.ok(destinations.has(link.dest), link.dest);
    assert.ok(links.some((link) => link.dest === "domain-architecture"), "the architecture guide's table links the Request Intake guide");
    assert.ok(links.some((link) => link.dest === "domain-architecture--when-a-request-is-rejected"));
    assert.ok(destinations.get("domain-architecture").page > destinations.get("architecture").page);
  });

  test("a single domain export and a combined export each write only their own file", () => {
    const separate = path.join(base.workspace, "separate");
    const single = run(base.root, separate, ["--domain", "system-guide"]);
    assert.equal(single.status, 0, single.stderr);
    assert.deepEqual(outputFiles(separate), [".metadata/system-guide-export.json", FILES.domainSystemGuide]);
    const both = run(base.root, separate, ["--domain", "system-guide", "--combined"]);
    assert.equal(both.status, 0, both.stderr);
    assert.match(both.stdout, new RegExp(`^written: .*${FILES.combined}`, "m"), "the domain named system-guide does not suppress the combined PDF");
    assert.match(both.stdout, new RegExp(`^unchanged: .*${FILES.domainSystemGuide}`, "m"));
  });
});

describe("Publication failure during a real export", { skip: browserSkip }, () => {
  test("failing after the first PDF is replaced restores every previous PDF and the manifest", async (context) => {
    const { root, workspace } = fixture(context);
    const out = path.join(workspace, "pdf");
    assert.equal(run(root, out, ["--all", "--combined"]).status, 0);
    const before = snapshot(out);
    edit(path.join(root, "guide/architecture.md"), (text) => text.replace("exactly once.", "exactly once, never twice."));
    edit(path.join(root, "guide/domains/intake.md"), (text) => text.replace("stays final for that request", "stays final for that request and is never reopened"));
    let intoOut = 0;
    const fileOps = {
      rename: (from, to) => {
        if ([out, path.join(out, "domains")].includes(path.dirname(to)) && (intoOut += 1) === 2) throw new Error("injected failure on the second replacement");
        fs.renameSync(from, to);
      },
      remove: (file) => fs.rmSync(file, { force: true }),
    };
    await assert.rejects(exportSystemGuide({ root, outDir: out, scopes: { all: true, combined: true }, date: DATE, fileOps }), /Publishing failed \(injected failure on the second replacement\); every previous file was restored/);
    assert.deepEqual(snapshot(out), before);
    assert.deepEqual(fs.readdirSync(out).filter((name) => name.startsWith(".")), [".metadata"], "no temporary directory remains");
    const check = run(root, out, ["--all", "--combined", "--check"]);
    assert.match(check.stdout, /^stale: .*architecture\.pdf$/m, "the old PDFs are still the old ones");
  });
});
