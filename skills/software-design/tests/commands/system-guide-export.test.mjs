import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { after, before, describe, test } from "node:test";
import { fileURLToPath } from "node:url";
import { browserAvailable } from "../../scripts/lib/system-guide/chromium.mjs";
import { PdfFile } from "../../scripts/lib/system-guide/pdf-file.mjs";
import { createGuidePackage, edit, write } from "../support/system-guide-fixture.mjs";

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const exporter = path.join(skillRoot, "scripts/export-system-guide.mjs");
const DATE = "2026-10-15";
const FILES = {
  architecture: "architecture.pdf",
  intake: "domains/intake.pdf",
  settlement: "domains/settlement.pdf",
  combined: "system-guide.pdf",
};
const BLUEPRINT_ID = /\b(?:SR|FLOW|INV|STATE|IFACE|SEC|SCOPE|TICKET)-\d{2,}\b|\bDOMAIN-[a-z]/;

function run(root, out, args, env = {}) {
  return spawnSync(process.execPath, [exporter, "--root", root, "--out", out, "--date", DATE, ...args], {
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
}

const sha256 = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const outputFiles = (directory) => fs.readdirSync(directory, { recursive: true }).filter((name) => fs.statSync(path.join(directory, name)).isFile()).sort();
const snapshot = (directory) => Object.fromEntries(outputFiles(directory).map((name) => [name, sha256(path.join(directory, name))]));
const pageTexts = (pdf) => pdf.pages().map((_, index) => pdf.pageText(index).map((runItem) => runItem.text).join(""));
const squash = (value) => value.replace(/\s+/g, "");

describe("System Guide export without a browser", () => {
  let fixture;
  before(() => { fixture = createGuidePackage(); });
  after(() => fs.rmSync(fixture.workspace, { recursive: true, force: true }));

  test("refuses an output directory inside the package", () => {
    const result = run(fixture.root, path.join(fixture.root, "pdf"), ["--all"]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /is inside the design package\. Generated PDFs are never package records/);
    assert.equal(fs.existsSync(path.join(fixture.root, "pdf")), false);
  });

  test("requires a scope and a known domain", () => {
    const out = path.join(fixture.workspace, "pdf-scope");
    assert.match(run(fixture.root, out, []).stderr, /Choose what to export: --architecture, --domain <slug>/);
    const unknown = run(fixture.root, out, ["--domain", "refunds"]);
    assert.equal(unknown.status, 1);
    assert.match(unknown.stderr, /Unknown domain refunds\. The package's domains are: intake, settlement\./);
  });

  test("rejects a malformed date", () => {
    const result = spawnSync(process.execPath, [exporter, "--root", fixture.root, "--out", path.join(fixture.workspace, "pdf-date"), "--all", "--date", "15/10/2026"], { encoding: "utf8" });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /--date must be YYYY-MM-DD/);
  });

  test("names the missing dependency and how to install it", () => {
    const out = path.join(fixture.workspace, "pdf-browser");
    const explicit = run(fixture.root, out, ["--all", "--browser", path.join(fixture.workspace, "no-such-browser")]);
    assert.equal(explicit.status, 1);
    assert.match(explicit.stderr, /PDF export needs a browser\.\nThe browser given with --browser is not an executable file/);
    assert.match(explicit.stderr, /npx playwright install chromium/);
    const environment = run(fixture.root, out, ["--all"], { SOFTWARE_DESIGN_PDF_BROWSER: path.join(fixture.workspace, "no-such-browser") });
    assert.equal(environment.status, 1);
    assert.match(environment.stderr, /SOFTWARE_DESIGN_PDF_BROWSER does not name an executable file/);

    const fake = path.join(fixture.workspace, "not-a-browser");
    fs.writeFileSync(fake, "#!/bin/sh\necho 'not a browser' >&2\nexit 3\n");
    fs.chmodSync(fake, 0o755);
    const started = Date.now();
    const notChromium = run(fixture.root, out, ["--all", "--browser", fake]);
    assert.equal(notChromium.status, 1);
    assert.match(notChromium.stderr, /did not start as a DevTools-capable Chromium browser/);
    assert.ok(Date.now() - started < 4000, "a browser that exits at once fails fast");
    assert.deepEqual(fs.existsSync(out) ? fs.readdirSync(out) : [], [], "no partial output remains");
  });

  test("check mode reports missing PDFs without a browser", () => {
    const result = run(fixture.root, path.join(fixture.workspace, "pdf-check"), ["--all", "--combined", "--check"], { SOFTWARE_DESIGN_PDF_BROWSER: "/no/such/browser" });
    assert.equal(result.status, 1);
    assert.equal(result.stdout.match(/^missing: /gm).length, 4);
  });

  test("exports only an adopted, valid guide", () => {
    const unadopted = createGuidePackage({ adopted: false, guides: false });
    try {
      const result = run(unadopted.root, path.join(unadopted.workspace, "pdf"), ["--all"]);
      assert.equal(result.status, 1);
      assert.match(result.stderr, /has not adopted the System Guide/);
    } finally {
      fs.rmSync(unadopted.workspace, { recursive: true, force: true });
    }
    const broken = createGuidePackage();
    try {
      edit(path.join(broken.root, "guide/domains/intake.md"), (text) => text.replace("## The job", "## The job of SR-001"));
      const result = run(broken.root, path.join(broken.workspace, "pdf"), ["--all"]);
      assert.equal(result.status, 1);
      assert.match(result.stderr, /The System Guide has problems to fix before export:\n.*intake\.md:\d+: heading shows blueprint identifier SR-001/);
    } finally {
      fs.rmSync(broken.workspace, { recursive: true, force: true });
    }
  });
});

const browserSkip = browserAvailable() ? false : "no Chromium-based browser found (set SOFTWARE_DESIGN_PDF_BROWSER or run npx playwright install chromium)";

describe("System Guide PDFs", { skip: browserSkip }, () => {
  let fixture;
  let out;
  let first;

  before(() => {
    fixture = createGuidePackage();
    out = path.join(fixture.workspace, "pdf");
    // Boundary cases: a long title, a table spanning pages, special characters and a long code line.
    const rows = Array.from({ length: 70 }, (_, index) => `| Attempt ${index + 1} | The provider answers “pending”; settlement waits ≥ ${index + 1} minutes → retries with the same reference. |`).join("\n");
    edit(path.join(fixture.root, "guide/domains/settlement.md"), (text) => text
      .replace("# Payment Settlement", "# Payment Settlement: how an approved request becomes exactly one confirmed payment, even when the provider is slow, unavailable or answers twice")
      .replace("## Where the exact rules live", `## Every retry, attempt by attempt

Amounts such as 10 € or ±0.01, names such as Zoë, Ωmega & Søren, and a literal \\<reference> print as written.

| Attempt | Provider answer and settlement response |
| --- | --- |
${rows}

\`\`\`text
retry(reference = "settlement-reference-that-is-deliberately-long-to-test-wrapping-of-code-lines-in-the-printed-guide", attempt = 70)
\`\`\`

## Where the exact rules live`));
    first = run(fixture.root, out, ["--all", "--combined"]);
  });
  after(() => fs.rmSync(fixture.workspace, { recursive: true, force: true }));

  test("writes one PDF per guide, the combined edition and a manifest", () => {
    assert.equal(first.status, 0, first.stderr);
    assert.deepEqual(outputFiles(out), [...Object.values(FILES), ".metadata/system-guide-export.json"].sort());
    const manifest = JSON.parse(fs.readFileSync(path.join(out, ".metadata/system-guide-export.json"), "utf8"));
    assert.equal(manifest.package.system, "Example Payment System");
    assert.match(manifest.regenerate, /export-system-guide\.mjs --root .* --out /);
    const combined = manifest.outputs[FILES.combined];
    assert.deepEqual(combined.documents, ["architecture", "domain:intake", "domain:settlement"]);
    assert.deepEqual(combined.sources.map((source) => source.path), ["guide/architecture.md", "guide/domains/intake.md", "guide/domains/settlement.md"]);
    for (const file of Object.values(FILES)) {
      assert.equal(manifest.outputs[file].sha256, sha256(path.join(out, file)), file);
      assert.equal(manifest.outputs[file].generated, DATE);
    }
  });

  test("PDFs carry selectable source text, bundled fonts, a fingerprint and no identifiers", () => {
    for (const file of Object.values(FILES)) {
      const pdf = new PdfFile(fs.readFileSync(path.join(out, file)));
      const text = pageTexts(pdf).join("\n");
      assert.doesNotMatch(text, BLUEPRINT_ID, file);
      assert.match(pdf.info().Keywords, /^source-fingerprint:[0-9a-f]{64}$/, file);
      for (const font of pdf.fonts()) assert.match(font.baseFont, /^[A-Z]{6}\+Noto(?:Serif|Sans|SansMono|SansMath)-/, `${file}: ${font.baseFont}`);
      assert.match(text, /Generated 15 October 2026/, file);
      assert.match(text, new RegExp(`Page ${pdf.pages().length} of ${pdf.pages().length}`), file);
    }
    const settlement = squash(pageTexts(new PdfFile(fs.readFileSync(path.join(out, FILES.settlement)))).join(""));
    for (const phrase of ["10 € or ±0.01", "Zoë, Ωmega & Søren", "a literal <reference>", "waits ≥ 70 minutes → retries", "“pending”"]) {
      assert.ok(settlement.includes(squash(phrase)), phrase);
    }
  });

  test("a long table repeats its header row on every page it spans", () => {
    const pdf = new PdfFile(fs.readFileSync(path.join(out, FILES.settlement)));
    const pages = pageTexts(pdf).map(squash);
    const spanned = pages.map((text, index) => (/Attempt\d+/.test(text) ? index : -1)).filter((index) => index >= 0);
    assert.ok(spanned.length >= 2, `the table spans ${spanned.length} page(s)`);
    for (const index of spanned) assert.ok(pages[index].includes(squash("Provider answer and settlement response")), `page ${index + 1} repeats the header`);
  });

  test("bookmarks follow the headings exactly, including a wrapped long title", () => {
    const pdf = new PdfFile(fs.readFileSync(path.join(out, FILES.settlement)));
    const titles = pdf.outline().map((entry) => entry.title);
    assert.equal(titles[0], "Payment Settlement: how an approved request becomes exactly one confirmed payment, even when the provider is slow, unavailable or answers twice");
    assert.ok(titles.includes("Every retry, attempt by attempt"));
    assert.ok(!titles.includes("Technical records"));

    const combined = new PdfFile(fs.readFileSync(path.join(out, FILES.combined)));
    const levelOne = combined.outline().filter((entry) => entry.level === 1).map((entry) => entry.title);
    assert.deepEqual(levelOne.slice(0, 2), ["Example Payment System", "Contents"]);
    assert.ok(levelOne.includes("How the Example Payment System works"));
    assert.ok(levelOne.includes("Request Intake"));
    assert.match(levelOne.at(-1), /^Payment Settlement/);
  });

  test("links resolve inside a PDF, across guides only in the combined edition, and source records do not produce a catalogue", () => {
    const combined = new PdfFile(fs.readFileSync(path.join(out, FILES.combined)));
    const destinations = combined.namedDestinations();
    const internal = combined.pages().flatMap((_, index) => combined.links(index)).filter((link) => link.dest);
    assert.ok(internal.length > 0);
    for (const link of internal) assert.ok(destinations.has(link.dest), link.dest);
    assert.ok(internal.some((link) => link.dest === "domain-intake--when-a-request-is-rejected"), "the cross-guide anchor link works in the combined edition");

    const separate = new PdfFile(fs.readFileSync(path.join(out, FILES.settlement)));
    const separateLinks = separate.pages().flatMap((_, index) => separate.links(index));
    assert.ok(!separateLinks.some((link) => link.dest === "domain-intake--when-a-request-is-rejected"));
    const text = squash(pageTexts(separate).join(""));
    assert.ok(text.includes(squash("Other guides:")));
    assert.ok(text.includes(squash("Request Intake")));
    assert.ok(!text.includes(squash("Responsibility record: Provider Settlement.")));
    assert.ok(text.includes(squash("This is the domain guide for Payment Settlement, one of the two domains of Example Payment System.")));
    assert.doesNotMatch(pageTexts(separate).join(""), /\.md\b|system-model\//);
  });

  test("the combined edition has no generated records page or Contents destination", () => {
    const combined = new PdfFile(fs.readFileSync(path.join(out, FILES.combined)));
    assert.doesNotMatch(pageTexts(combined).join(""), /Technical records/);
    assert.ok(!combined.namedDestinations().has("edition--technical-records"));
  });

  test("the combined edition always includes every domain in architecture order", () => {
    const text = squash(pageTexts(new PdfFile(fs.readFileSync(path.join(out, FILES.combined)))).join(""));
    assert.ok(text.includes(squash("the architecture guide, followed by both domain guides")));
    const architecture = text.indexOf(squash("How the Example Payment System works"), text.indexOf(squash("Contents")) + 10);
    const intake = text.indexOf(squash("Request Intake decides, once"));
    const settlement = text.indexOf(squash("Payment Settlement turns an approved request"));
    assert.ok(architecture > 0 && architecture < intake && intake < settlement, `${architecture} ${intake} ${settlement}`);
  });

  test("an unchanged guide is not reprinted and check mode reports current", () => {
    const before = snapshot(out);
    const again = run(fixture.root, out, ["--all", "--combined"]);
    assert.equal(again.status, 0, again.stderr);
    assert.equal(again.stdout.match(/^unchanged: /gm).length, 4);
    assert.deepEqual(snapshot(out), before);
    const check = run(fixture.root, out, ["--all", "--combined", "--check"]);
    assert.equal(check.status, 0, check.stdout);
    assert.equal(check.stdout.match(/^current: /gm).length, 4);
  });

  test("check mode names stale and modified PDFs precisely", () => {
    const work = fs.mkdtempSync(path.join(fixture.workspace, "copy-"));
    const root = path.join(work, "software-design");
    const copyOut = path.join(work, "pdf");
    fs.cpSync(fixture.root, root, { recursive: true });
    fs.cpSync(out, copyOut, { recursive: true });
    edit(path.join(root, "guide/domains/intake.md"), (text) => text.replace("stays final for that request", "stays final for that request and is never reopened"));
    const bytes = fs.readFileSync(path.join(copyOut, FILES.architecture));
    fs.writeFileSync(path.join(copyOut, FILES.architecture), Buffer.concat([bytes, Buffer.from("\n% edited\n")]));
    const check = run(root, copyOut, ["--all", "--combined", "--check"]);
    assert.equal(check.status, 1);
    assert.match(check.stdout, new RegExp(`^stale: .*${FILES.intake}$`, "m"));
    assert.match(check.stdout, new RegExp(`^stale: .*${FILES.combined}$`, "m"));
    assert.match(check.stdout, new RegExp(`^current: .*${FILES.settlement}$`, "m"));
    assert.match(check.stdout, new RegExp(`^modified: .*${FILES.architecture}$`, "m"));
  });

  test("a failed export leaves every existing PDF and the manifest untouched", () => {
    const work = fs.mkdtempSync(path.join(fixture.workspace, "fail-"));
    const root = path.join(work, "software-design");
    const copyOut = path.join(work, "pdf");
    fs.cpSync(fixture.root, root, { recursive: true });
    fs.cpSync(out, copyOut, { recursive: true });
    const before = snapshot(copyOut);
    edit(path.join(root, "guide/domains/intake.md"), (text) => text.replace("stores each request", "stores each request (請求)"));
    edit(path.join(root, "guide/architecture.md"), (text) => text.replace("exactly once.", "exactly once, always."));
    const result = run(root, copyOut, ["--all", "--combined"]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Verification failed; no PDF was replaced\./);
    assert.match(result.stderr, /domains\/intake\.pdf:\n  Text was drawn with a substitute \(Type3\) font instead of the bundled fonts; characters not covered: 請 \(U\+8ACB\), 求 \(U\+6C42\)/);
    assert.deepEqual(snapshot(copyOut), before, "existing PDFs and the manifest are unchanged");
    assert.deepEqual(fs.readdirSync(copyOut).filter((name) => name.startsWith(".")), [".metadata"], "no temporary directory remains");
  });

  test("force reprints a current PDF and a single scope leaves the others alone", () => {
    const before = snapshot(out);
    const forced = run(fixture.root, out, ["--domain", "intake", "--force"]);
    assert.equal(forced.status, 0, forced.stderr);
    assert.match(forced.stdout, new RegExp(`^written: .*${FILES.intake} \\(\\d+ pages\\)$`, "m"));
    const after = snapshot(out);
    for (const file of [FILES.architecture, FILES.settlement, FILES.combined]) assert.equal(after[file], before[file], file);
    const manifest = JSON.parse(fs.readFileSync(path.join(out, ".metadata/system-guide-export.json"), "utf8"));
    assert.deepEqual(Object.keys(manifest.outputs).sort(), Object.values(FILES).sort(), "the manifest keeps the other outputs");
    assert.equal(run(fixture.root, out, ["--all", "--combined", "--check"]).status, 0);
  });
});

describe("System Guide page breaks", { skip: browserSkip }, () => {
  test("a narrow table column wraps between words, never inside one", (context) => {
    const fixture = createGuidePackage();
    context.after(() => fs.rmSync(fixture.workspace, { recursive: true, force: true }));
    const claim = "A developer starts or resumes the complete isolated system and completes the browser journey with both participants and every service it needs. ";
    const rows = ["Deterministic local verification", "Local demonstration", "Production"].map((name) => `| ${name} | ${claim.repeat(2)} | ${claim} |`).join("\n");
    edit(path.join(fixture.root, "guide/domains/settlement.md"), (text) => text.replace("## Where the exact rules live", `## Where it runs

| Profile | Claim in this version | Not proven by it |
| --- | --- | --- |
${rows}

## Where the exact rules live`));
    const out = path.join(fixture.workspace, "pdf");
    const result = run(fixture.root, out, ["--domain", "settlement"]);
    assert.equal(result.status, 0, result.stderr);
    const pdf = new PdfFile(fs.readFileSync(path.join(out, FILES.settlement)));
    const lines = pdf.pages().flatMap((_, index) => {
      const byLine = new Map();
      for (const item of pdf.pageText(index)) {
        const key = Math.round(item.y);
        byLine.set(key, (byLine.get(key) || "") + item.text);
      }
      return [...byLine.values()];
    });
    for (const word of ["Deterministic", "verification", "demonstration", "Production"]) {
      assert.ok(lines.some((line) => line.includes(word)), `${word} prints whole on one line`);
    }
  });

  test("a lead-in stays on the page of the figure or list it introduces", (context) => {
    const fixture = createGuidePackage();
    context.after(() => fs.rmSync(fixture.workspace, { recursive: true, force: true }));
    // Sections of growing length move each lead-in through every position on
    // a page, so some lead-in falls where its block no longer fits below it.
    const filler = "Settlement records the provider's answer before it acts, and it keeps the reference unchanged across every attempt so that the provider can recognise a repeat. ";
    const sections = Array.from({ length: 24 }, (_, index) => `## Case ${index + 1}

${filler.repeat(1 + index)}

Case ${index + 1} ${index % 2 ? "unfolds as a list" : "unfolds in four steps"}:

${index % 2
    ? Array.from({ length: 4 }, (_, item) => `- Item ${item + 1} of case ${index + 1}: the provider answers and settlement records the answer.`).join("\n")
    : `\`\`\`figure
caption: Case ${index + 1} keeps one reference.
step: Sent ${index + 1} | Settlement sends the request.
step: Answered | The provider answers.
step: Recorded | Settlement records the answer.
step: Confirmed | The provider confirms.
\`\`\``}
`).join("\n");
    edit(path.join(fixture.root, "guide/domains/settlement.md"), (text) => text.replace("## Where the exact rules live", `${sections}\n## Where the exact rules live`));
    const out = path.join(fixture.workspace, "pdf");
    const result = run(fixture.root, out, ["--domain", "settlement"]);
    assert.equal(result.status, 0, result.stderr);
    const pages = pageTexts(new PdfFile(fs.readFileSync(path.join(out, FILES.settlement)))).map(squash);
    const pageOf = (needle) => pages.findIndex((page) => page.includes(squash(needle)));
    for (let index = 0; index < 24; index += 1) {
      const leadIn = pageOf(`Case ${index + 1} ${index % 2 ? "unfolds as a list" : "unfolds in four steps"}:`);
      const first = pageOf(index % 2 ? `Item 1 of case ${index + 1}:` : `Sent ${index + 1}`);
      assert.ok(leadIn >= 0 && first >= 0, `case ${index + 1} printed`);
      assert.equal(leadIn, first, `case ${index + 1}: the lead-in is on page ${leadIn + 1}, what it introduces starts on page ${first + 1}`);
    }
  });
});
