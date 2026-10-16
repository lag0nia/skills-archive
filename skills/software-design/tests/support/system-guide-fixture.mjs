// A small format-2 package with two domains and an adopted System Guide.
// Tests mutate the returned files to exercise one rule at a time.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

export function edit(filePath, replace) {
  fs.writeFileSync(filePath, replace(fs.readFileSync(filePath, "utf8")));
}

const ARCHITECTURE_GUIDE = `# How the Example Payment System works

The Example Payment System takes a payment request from a customer, decides whether it is eligible, and settles the accepted request with a payment provider.

## What the system is for

A customer asks to pay a merchant. The system must decide once whether the request may proceed and then settle it exactly once. Two domains share this work.

| Domain | Its contribution |
| --- | --- |
| [Request Intake](domains/intake.md) | Accepts requests and decides eligibility. |
| [Payment Settlement](domains/settlement.md) | Settles accepted requests with the provider. |

## A payment from request to settlement

\`\`\`figure
caption: Eligibility is decided before any money moves.
step: Request accepted | Intake records the customer's request.
step: Eligibility decided | Intake approves or rejects it once.
optional: Provider retry | Only when the provider times out, settlement retries with the same payment reference.
step: Payment settled | Settlement confirms the provider's result.
\`\`\`

The provider's confirmation, not the customer's screen, establishes that a payment happened.

> **Settlement is not approval**
> An approved request can still fail at the provider. The customer sees a settled payment only after the provider confirms it.

## Authority and sources of truth

Intake owns the eligibility decision. Settlement owns the payment outcome. The [technical architecture record](../system-model/architecture.md#authority-and-sources-of-truth) states the exact boundaries.

## Choices and their reasons

- The system settles each request once, because duplicate settlement would charge the customer twice.
- Retries reuse the original payment reference, so the provider can recognise a repeat.
`;

const INTAKE_GUIDE = `# Request Intake

Request Intake decides, once, whether a customer's payment request may proceed. It is the first domain a request meets; the [architecture guide](../architecture.md) shows where it fits.

## The job

Intake has two responsibilities. [Request Intake Recording](../../system-model/domains/intake/responsibilities/sr-001-request-intake.md) stores each request with its customer and amount. [Eligibility Review](../../system-model/domains/intake/responsibilities/sr-002-eligibility-review.md) applies the eligibility rules and records one decision.

## When a request is rejected

A rejected request never reaches [Payment Settlement](settlement.md). The customer receives the reason, and the decision stays final for that request.

## Where the exact rules live

The [domain record](../../system-model/domains/intake/domain.md) lists what Intake owns and excludes.
`;

const SETTLEMENT_GUIDE = `# Payment Settlement

Payment Settlement turns an approved request into one confirmed payment. Read the [architecture guide](../architecture.md) first for the whole path.

## The job

[Provider Settlement](../../system-model/domains/settlement/responsibilities/sr-003-payment-settlement.md) sends the approved request to the payment provider and records the provider's confirmed result.

## When the provider times out

Settlement retries with the same payment reference. It never creates a second payment for one request, as [the eligibility section](intake.md#when-a-request-is-rejected) of the intake guide explains for rejected requests.

## Where the exact rules live

The [domain record](../../system-model/domains/settlement/domain.md) lists what Settlement owns and excludes.
`;

function responsibility(id, name, domain, slug) {
  return `---
type: system-responsibility
id: ${id}
name: ${name}
domain: ${domain}
depends_on: "None."
participates_in: "FLOW-001"
realized_by: "None."
---

# ${id} — ${name}

## Purpose

Own ${name.toLowerCase()} for the [${domain} domain](../domain.md) (${slug}).
`;
}

export function createGuidePackage({ adopted = true, guides = true } = {}) {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "software-design-guide-"));
  const root = path.join(workspace, "software-design");
  write(path.join(root, "README.md"), `# Example Payment System Design

Read the [System Guide](guide/architecture.md) to understand the system, then the [architecture record](system-model/architecture.md) for exact boundaries.
`);
  write(path.join(root, "system-model/architecture.md"), `---
type: system-architecture
design_format: 2
name: Example Payment System
assurance_id: "example-payment-system"
${adopted ? "system_guide: adopted\n" : ""}domains: "intake, settlement"
global_invariants: "INV-001"
security_boundaries: "None."
scope_boundaries: "None."
---

# Example Payment System Architecture

The reader-facing explanation is the [System Guide](../guide/architecture.md).

## Purpose And Binding

Bind every payment to one request identity.

## Authority And Sources Of Truth

Intake owns eligibility; Settlement owns the payment outcome.

## System Domains

| Domain | Purpose | System Responsibilities |
| --- | --- | --- |
| [Request Intake](./domains/intake/domain.md) | Eligibility | \`SR-001\`, \`SR-002\` |
| [Payment Settlement](./domains/settlement/domain.md) | Settlement | \`SR-003\` |

## Cross-Domain Boundaries

Settlement receives only approved requests.
`);
  write(path.join(root, "system-model/domains/intake/domain.md"), `---
type: system-domain
id: DOMAIN-intake
name: Request Intake
responsibilities: "SR-001, SR-002"
external_responsibilities: "None."
---

# Request Intake

Reader guide: [Request Intake guide](../../../guide/domains/intake.md).

## Purpose

Decide request eligibility once.
`);
  write(path.join(root, "system-model/domains/settlement/domain.md"), `---
type: system-domain
id: DOMAIN-settlement
name: Payment Settlement
responsibilities: "SR-003"
external_responsibilities: "None."
---

# Payment Settlement

Reader guide: [Payment Settlement guide](../../../guide/domains/settlement.md).

## Purpose

Settle approved requests exactly once.
`);
  write(path.join(root, "system-model/domains/intake/responsibilities/sr-001-request-intake.md"), responsibility("SR-001", "Request Intake Recording", "intake", "records"));
  write(path.join(root, "system-model/domains/intake/responsibilities/sr-002-eligibility-review.md"), responsibility("SR-002", "Eligibility Review", "intake", "decides"));
  write(path.join(root, "system-model/domains/settlement/responsibilities/sr-003-payment-settlement.md"), responsibility("SR-003", "Provider Settlement", "settlement", "settles"));
  write(path.join(root, "system-model/behavior/flows/flow-001-pay.md"), `---
type: system-flow
id: FLOW-001
name: Pay
responsibilities: "SR-001, SR-002, SR-003"
contracts: "INV-001"
starts_when: A customer submits a request
ends_when: The payment outcome is recorded
---

# FLOW-001 — Pay

## Purpose

Settle one approved request.
`);
  write(path.join(root, "system-model/contracts/invariants/inv-001-single-settlement.md"), `---
type: system-invariant
id: INV-001
name: Single Settlement
responsibilities: "SR-003"
flows: "FLOW-001"
related_contracts: "None."
---

# INV-001 — Single Settlement

## Rule

A request settles at most once.

## Scope

Every settlement attempt.

## Violation Meaning

A customer would be charged twice.

## Verification Obligations

<a id="inv-001.vo-001"></a>
### INV-001.VO-001 — A repeated settlement is refused

**Claim:** A request cannot settle twice.

**Required observation:** A second settlement attempt for a settled request is refused and the first payment stands.

**Risk:** \`high\`

**Evidence expectation:** Behavioral evidence exercises a settlement and its retry.

**Boundary cases:** First settlement, retry after timeout, and retry after confirmation.
`);
  write(path.join(root, "system-model/behavior/lifecycle.yaml"), `lifecycle_version: 1
name: "Payment Lifecycle"
initial_stage: "STAGE-001"
stages: [{"id":"STAGE-001","name":"Pay","flow":"FLOW-001","next":[],"terminal_outcome":"OUTCOME-001"}]
terminal_outcomes: [{"id":"OUTCOME-001","name":"Settled","meaning":"The payment outcome is recorded."}]
invariants: ["INV-001"]
`);
  if (guides) {
    write(path.join(root, "guide/architecture.md"), ARCHITECTURE_GUIDE);
    write(path.join(root, "guide/domains/intake.md"), INTAKE_GUIDE);
    write(path.join(root, "guide/domains/settlement.md"), SETTLEMENT_GUIDE);
  }
  return { workspace, root };
}

const FIXTURE_DOMAINS = {
  intake: { row: "| [Request Intake](domains/intake.md) | Accepts requests and decides eligibility. |", planned: "| Request Intake | Accepts requests and decides eligibility. |" },
  settlement: { row: "| [Payment Settlement](domains/settlement.md) | Settles accepted requests with the provider. |", planned: "| Payment Settlement | Settles accepted requests with the provider. |" },
};

/**
 * Turn a domain of the fixture back into a planned one, as before Stage 2
 * wrote it: the architecture record still declares it, but its domain record,
 * responsibility records and guide do not exist and no guide links them.
 */
export function unwriteDomain(root, slug) {
  fs.rmSync(path.join(root, "system-model/domains", slug), { recursive: true, force: true });
  fs.rmSync(path.join(root, "guide/domains", `${slug}.md`), { force: true });
  edit(path.join(root, "guide/architecture.md"), (text) => text.replace(FIXTURE_DOMAINS[slug].row, FIXTURE_DOMAINS[slug].planned));
  for (const other of Object.keys(FIXTURE_DOMAINS).filter((name) => name !== slug)) {
    const file = path.join(root, "guide/domains", `${other}.md`);
    if (fs.existsSync(file)) edit(file, (text) => text.replace(new RegExp(`\\[([^\\]]+)\\]\\(${slug}\\.md(?:#[^)]*)?\\)`, "g"), "$1"));
  }
}

/** Remove the responsibility records of a domain, as after Stage 2 and before Stage 3. */
export function unwriteResponsibilities(root, slug) {
  fs.rmSync(path.join(root, "system-model/domains", slug, "responsibilities"), { recursive: true, force: true });
  const file = path.join(root, "guide/domains", `${slug}.md`);
  if (fs.existsSync(file)) edit(file, (text) => text.replace(/\[([^\]]+)\]\(\.\.\/\.\.\/system-model\/domains\/[^)]*\/responsibilities\/[^)]+\)/g, "$1"));
}

/** Give the fixture's domains other slugs (folder names), keeping their names and text. */
export function renameDomainSlugs(root, renames) {
  const files = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? files(target) : [target];
  });
  for (const file of files(root).filter((name) => /\.(?:md|yaml)$/.test(name))) {
    edit(file, (text) => {
      let next = text;
      for (const [from, to] of Object.entries(renames)) {
        next = next
          .replaceAll(`domains/${from}/`, `domains/${to}/`)
          .replaceAll(`domains/${from}.md`, `domains/${to}.md`)
          .replaceAll(`](${from}.md`, `](${to}.md`)
          .replaceAll(`DOMAIN-${from}\n`, `DOMAIN-${to}\n`)
          .replaceAll(`domain: ${from}\n`, `domain: ${to}\n`);
      }
      return next.replace(/^domains: "([^"]*)"$/m, (_, list) => `domains: "${list.split(", ").map((slug) => renames[slug] || slug).join(", ")}"`);
    });
  }
  for (const [from, to] of Object.entries(renames)) {
    fs.renameSync(path.join(root, "system-model/domains", from), path.join(root, "system-model/domains", to));
    fs.renameSync(path.join(root, "guide/domains", `${from}.md`), path.join(root, "guide/domains", `${to}.md`));
  }
}
