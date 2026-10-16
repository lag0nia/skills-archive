import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createGuidePackage, edit, write } from "../support/system-guide-fixture.mjs";

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const validator = path.join(skillRoot, "scripts/validate-software-design-structure.mjs");

function validate(root) {
  return spawnSync(process.execPath, [validator, "--root", root], { encoding: "utf8" });
}

function fixture(context, options) {
  const created = createGuidePackage(options);
  context.after(() => fs.rmSync(created.workspace, { recursive: true, force: true }));
  return created;
}

function assertRejected(root, ...patterns) {
  const result = validate(root);
  assert.notEqual(result.status, 0, `expected validation to fail\n${result.stdout}`);
  for (const pattern of patterns) assert.match(result.stderr, pattern);
  return result.stderr;
}

const guide = (root, name) => path.join(root, "guide", name);

test("an adopted System Guide with one guide per domain validates", (context) => {
  const { root } = fixture(context);
  const result = validate(root);
  assert.equal(result.status, 0, result.stderr);
});

test("an existing package without the declaration or guide/ stays valid", (context) => {
  const { root } = fixture(context, { adopted: false, guides: false });
  edit(path.join(root, "README.md"), (text) => text.replace("[System Guide](guide/architecture.md)", "System Guide"));
  edit(path.join(root, "system-model/architecture.md"), (text) => text.replace("[System Guide](../guide/architecture.md)", "System Guide"));
  for (const slug of ["intake", "settlement"]) {
    edit(path.join(root, `system-model/domains/${slug}/domain.md`), (text) => text.replace(/Reader guide: .*\n/, "## Domain Overview\n\nThe narrative explanation stays here until the package migrates.\n"));
  }
  const result = validate(root);
  assert.equal(result.status, 0, result.stderr);
});

test("adoption is never inferred from guide files", (context) => {
  const { root } = fixture(context, { adopted: false });
  assertRejected(root, /a System Guide exists but .* does not declare system_guide: adopted/);
});

test("the declaration accepts only adopted", (context) => {
  const { root } = fixture(context);
  edit(path.join(root, "system-model/architecture.md"), (text) => text.replace("system_guide: adopted", "system_guide: partial"));
  assertRejected(root, /system_guide must be adopted when present/);
});

test("adoption requires the architecture guide and a guide for every canonical domain", (context) => {
  const { root } = fixture(context);
  fs.rmSync(guide(root, "domains/settlement.md"));
  assertRejected(root, /missing domain guide for Payment Settlement; every canonical domain has guide\/domains\/settlement\.md/);
  fs.rmSync(guide(root, "architecture.md"));
  assertRejected(root, /guide\/architecture\.md: required when the System Guide is adopted/);
});

test("a domain guide must match a canonical domain slug", (context) => {
  const { root } = fixture(context);
  fs.renameSync(guide(root, "domains/settlement.md"), guide(root, "domains/payments.md"));
  assertRejected(root, /payments\.md: orphan domain guide; no system-model\/domains\/payments\/domain\.md exists/, /missing domain guide for Payment Settlement/);
});

test("guide/ holds only the architecture guide and domain guides", (context) => {
  const { root } = fixture(context);
  write(guide(root, "glossary.md"), "# Glossary\n\nTerms.\n");
  write(guide(root, "domains/notes/extra.md"), "# Extra\n\nNotes.\n");
  assertRejected(root, /glossary\.md: guide\/ holds only architecture\.md and domains\/<domain-slug>\.md/, /notes: guide\/domains\/ holds only <domain-slug>\.md files/);
});

test("staged authoring adds a domain record together with its guide", (context) => {
  const { root } = fixture(context);
  write(path.join(root, "system-model/domains/refunds/domain.md"), `---
type: system-domain
id: DOMAIN-refunds
name: Refund Handling
responsibilities: "SR-004"
external_responsibilities: "None."
---

# Refund Handling

Reader guide: [Refund Handling guide](../../../guide/domains/refunds.md).

## Purpose

Return settled payments on request.
`);
  write(path.join(root, "system-model/domains/refunds/responsibilities/sr-004-refund-return.md"), `---
type: system-responsibility
id: SR-004
name: Refund Return
domain: refunds
depends_on: "None."
participates_in: "FLOW-001"
realized_by: "None."
---

# SR-004 — Refund Return

## Purpose

Return a settled payment to the customer.
`);
  edit(path.join(root, "system-model/behavior/flows/flow-001-pay.md"), (text) => text.replace('responsibilities: "SR-001, SR-002, SR-003"', 'responsibilities: "SR-001, SR-002, SR-003, SR-004"'));
  edit(path.join(root, "system-model/architecture.md"), (text) => text
    .replace('domains: "intake, settlement"', 'domains: "intake, settlement, refunds"')
    .replace("| [Payment Settlement](./domains/settlement/domain.md) | Settlement | `SR-003` |", "| [Payment Settlement](./domains/settlement/domain.md) | Settlement | `SR-003` |\n| [Refund Handling](./domains/refunds/domain.md) | Refunds | `SR-004` |"));
  const before = validate(root);
  assert.notEqual(before.status, 0);
  assert.match(before.stderr, /missing domain guide for Refund Handling/);
  assert.match(before.stderr, /architecture\.md: link the Refund Handling domain guide/);
  assert.match(before.stderr, /architecture\.md: name the Refund Handling domain by its canonical name/);

  write(guide(root, "domains/refunds.md"), `# Refund Handling

Refund Handling returns a settled payment to the customer. The [architecture guide](../architecture.md) shows where refunds start, and the [domain record](../../system-model/domains/refunds/domain.md) holds its exact boundary.

Its one responsibility, [Refund Return](../../system-model/domains/refunds/responsibilities/sr-004-refund-return.md), sends the money back once the refund is accepted.
`);
  edit(guide(root, "architecture.md"), (text) => text.replace("| [Payment Settlement](domains/settlement.md) | Settles accepted requests with the provider. |", "| [Payment Settlement](domains/settlement.md) | Settles accepted requests with the provider. |\n| [Refund Handling](domains/refunds.md) | Returns settled payments. |"));
  const after = validate(root);
  assert.equal(after.status, 0, after.stderr);
});

test("navigation links the guide from the README, the architecture record and each domain record", (context) => {
  const { root } = fixture(context);
  edit(path.join(root, "README.md"), (text) => text.replace("[System Guide](guide/architecture.md)", "System Guide"));
  edit(path.join(root, "system-model/architecture.md"), (text) => text.replace("[System Guide](../guide/architecture.md)", "System Guide"));
  edit(path.join(root, "system-model/domains/intake/domain.md"), (text) => text.replace(/Reader guide: .*\n/, ""));
  assertRejected(root,
    /README\.md: must link guide\/architecture\.md as the System Guide/,
    /architecture\.md: must link \.\.\/guide\/architecture\.md for the reader-facing explanation/,
    /intake\/domain\.md: must link \.\.\/\.\.\/\.\.\/guide\/domains\/intake\.md/);
});

test("guides link their context and every technical owner they explain", (context) => {
  const { root } = fixture(context);
  edit(guide(root, "domains/intake.md"), (text) => text
    .replace("the [architecture guide](../architecture.md)", "the architecture guide")
    .replace("[Eligibility Review](../../system-model/domains/intake/responsibilities/sr-002-eligibility-review.md)", "Eligibility Review")
    .replace("The [domain record](../../system-model/domains/intake/domain.md)", "The domain record"));
  edit(guide(root, "architecture.md"), (text) => text.replace("The [technical architecture record](../system-model/architecture.md#authority-and-sources-of-truth)", "The technical architecture record"));
  assertRejected(root,
    /intake\.md: link the architecture guide/,
    /intake\.md: link the technical domain record/,
    /intake\.md: link the Eligibility Review responsibility record/,
    /architecture\.md: link the technical architecture record/);
});

test("guides name every domain and responsibility by its canonical name", (context) => {
  const { root } = fixture(context);
  edit(guide(root, "domains/intake.md"), (text) => text.replace("[Eligibility Review](", "[the second responsibility]("));
  edit(guide(root, "domains/settlement.md"), (text) => text.replace("# Payment Settlement", "# Settling payments"));
  edit(guide(root, "architecture.md"), (text) => text.replace("[Request Intake](domains/intake.md)", "[Intake](domains/intake.md)"));
  assertRejected(root,
    /intake\.md: explain the Eligibility Review responsibility by its canonical name/,
    /settlement\.md:1: the title must contain the canonical domain name Payment Settlement/,
    /architecture\.md: name the Request Intake domain by its canonical name/);
});

test("reader-visible identifiers and paths are rejected while link destinations may carry them", (context) => {
  const { root } = fixture(context);
  const intake = guide(root, "domains/intake.md");
  const original = fs.readFileSync(intake, "utf8");
  assert.match(original, /sr-002-eligibility-review\.md/, "fixture links carry identifiers in destinations");
  assert.equal(validate(root).status, 0);

  const cases = [
    ["prose", (text) => text.replace("applies the eligibility rules", "applies the SR-002 rules"), /:\d+: text shows blueprint identifier SR-002/],
    ["heading", (text) => text.replace("## The job", "## The job of DOMAIN-intake"), /:\d+: heading shows blueprint identifier DOMAIN-intake/],
    ["link label", (text) => text.replace("[Eligibility Review](", "[Eligibility Review (SR-002)]("), /shows blueprint identifier SR-002/],
    ["code span", (text) => text.replace("records one decision", "records one `FLOW-001` decision"), /shows blueprint identifier FLOW-001/],
    ["dotted obligation", (text) => text.replace("records one decision", "records one decision under INV-001.VO-001"), /shows blueprint identifier INV-001\.VO-001/],
    ["package path", (text) => text.replace("records one decision", "records one decision in system-model/contracts/invariants/inv-001.md"), /shows package path system-model\/contracts\/invariants\/inv-001\.md/],
    ["file name", (text) => text.replace("records one decision", "records one decision in lifecycle.yaml"), /shows package path lifecycle\.yaml/],
  ];
  for (const [label, change, pattern] of cases) {
    fs.writeFileSync(intake, change(original));
    const result = validate(root);
    assert.notEqual(result.status, 0, label);
    assert.match(result.stderr, pattern, label);
  }

  fs.writeFileSync(intake, original);
  const architecture = guide(root, "architecture.md");
  const architectureText = fs.readFileSync(architecture, "utf8");
  for (const [label, change, pattern] of [
    ["table cell", (text) => text.replace("Accepts requests and decides eligibility.", "Owns SR-001 and SR-002."), /:\d+: table shows blueprint identifier SR-001, SR-002/],
    ["figure step", (text) => text.replace("Intake records the customer's request.", "Intake records the request under STATE-004."), /:\d+: figure shows blueprint identifier STATE-004/],
    ["figure caption", (text) => text.replace("caption: Eligibility is decided before any money moves.", "caption: The FLOW-001 path."), /:\d+: figure caption shows blueprint identifier FLOW-001/],
    ["callout title", (text) => text.replace("**Settlement is not approval**", "**INV-001 applies**"), /:\d+: callout shows blueprint identifier INV-001/],
  ]) {
    fs.writeFileSync(architecture, change(architectureText));
    const result = validate(root);
    assert.notEqual(result.status, 0, label);
    assert.match(result.stderr, pattern, label);
  }
});

test("guide links and anchors must resolve", (context) => {
  const { root } = fixture(context);
  edit(guide(root, "domains/settlement.md"), (text) => text
    .replace("intake.md#when-a-request-is-rejected", "intake.md#when-a-request-is-refused")
    .replace("## Where the exact rules live", "## Where the exact rules live\n\nSee [the missing record](../../system-model/contracts/states/state-099-missing.md) and [the timeout section](#when-the-provider-stalls)."));
  edit(guide(root, "architecture.md"), (text) => text.replace("architecture.md#authority-and-sources-of-truth", "architecture.md#who-decides"));
  assertRejected(root,
    /settlement\.md:\d+: broken link anchor intake\.md#when-a-request-is-refused/,
    /settlement\.md:\d+: broken link \.\.\/\.\.\/system-model\/contracts\/states\/state-099-missing\.md/,
    /settlement\.md:\d+: broken anchor #when-the-provider-stalls/,
    /architecture\.md:\d+: broken link anchor \.\.\/system-model\/architecture\.md#who-decides/);
});

test("a guide that leaves the strict Markdown subset reports the line", (context) => {
  const { root } = fixture(context);
  edit(guide(root, "domains/intake.md"), (text) => text.replace("## When a request is rejected", "## When a request is rejected\n\n![diagram](diagram.png)\n\n<div>raw</div>"));
  assertRejected(root, /intake\.md:\d+: .*image/i, /intake\.md:\d+: .*raw HTML/);
});

test("a migrated domain record keeps no Domain Overview narrative", (context) => {
  const { root } = fixture(context);
  edit(path.join(root, "system-model/domains/settlement/domain.md"), (text) => text.replace("## Purpose", "## Domain Overview\n\nSettlement explains itself here too.\n\n## Purpose"));
  assertRejected(root, /settlement\/domain\.md: the reader-facing domain explanation lives in guide\/domains\/settlement\.md; replace ## Domain Overview/);
});

test("decision attribution stays with its technical owner, not the guide", (context) => {
  const { root } = fixture(context);
  edit(guide(root, "domains/settlement.md"), (text) => `${text}
## Decision Attribution

| Decision | Origin | Evidence | Conditions |
| --- | --- | --- | --- |
| Retries reuse the payment reference | Agent-chosen | Settlement retry review | None. |
`);
  assertRejected(root, /guide\/domains\/settlement\.md: ## Decision Attribution belongs in the authoritative record of a decision/);
});

test("guides do not satisfy or replace reciprocal model relationships", (context) => {
  const { root } = fixture(context);
  edit(path.join(root, "system-model/domains/settlement/responsibilities/sr-003-payment-settlement.md"), (text) => text.replace("domain: settlement", "domain: intake"));
  const result = validate(root);
  assert.notEqual(result.status, 0);
  assert.doesNotMatch(result.stderr, /^.*guide\/.*$/m, "a model relationship error is reported against the model, not the guide");
});
