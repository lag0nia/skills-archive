import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { writeText } from "./workspace.mjs";

const RESPONSIBILITY = "system-model/domains/lending/responsibilities/sr-001-loan-ledger.md";
const REPAYMENT = "system-model/domains/lending/responsibilities/sr-002-repayment.md";
export const FIXTURE_PATHS = Object.freeze({ responsibility: RESPONSIBILITY, repayment: REPAYMENT, domain: "system-model/domains/lending/domain.md" });

// One ordinary ticket with every required field; overrides supply the case.
export function ticket(id, overrides = {}) {
  const settled = ["decided", "finished"].includes(overrides.status);
  return {
    id,
    title: `Choose ${id.toLowerCase()} behavior`,
    status: "todo",
    kind: "product",
    complexity: "medium",
    concern: "product-policy",
    owner: "SR-001",
    affects: ["SR-001"],
    build_unit_disposition: "Realization mapping has not started.",
    build_units: [],
    cluster: "loan-ledger",
    question: `Which ${id} behavior should the loan ledger use?`,
    context: "The loan ledger records principal and repayments for each borrower.",
    candidate_proof: "An implementer cannot finish or verify the loan ledger rule without choosing this behavior, and the current package does not already choose it.",
    options: ["Option A and its consequence", "Option B and its consequence"],
    recommendation: "Option A, because it keeps repayment simple.",
    resolution: settled ? "Use option A." : null,
    depends_on: [],
    write_targets: [RESPONSIBILITY],
    ...overrides,
  };
}

export function ticketYaml(tickets, archived = []) {
  const block = (record) => {
    const [first, ...rest] = Object.entries(record);
    return [`  - ${first[0]}: ${JSON.stringify(first[1])}`, ...rest.map(([key, value]) => `    ${key}: ${JSON.stringify(value)}`)].join("\n");
  };
  return [
    "ticket_file_version: 4",
    "scope: \"responsibility:SR-001\"",
    "",
    "tickets:",
    ...tickets.map(block),
    ...(archived.length ? ["", "archived_records:", ...archived.map(block)] : []),
    "",
  ].join("\n");
}

export function writeTickets(root, tickets, archived = []) {
  writeText(path.join(root, "build/workflow/tickets/lending/sr-001/sr-001-tickets.yaml"), ticketYaml(tickets, archived));
}

export function linkOverviewFromReadme(root) {
  writeText(path.join(root, "README.md"), "# Software Design\n\n- [Decision Overview](./build/workflow/decision-overview.md): generated decisions grouped by origin.\n");
}

// A small format-2 lending package that passes structural validation.
export function decisionFixture(tickets = [], { archived = [] } = {}) {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "software-design-decisions-"));
  const root = path.join(workspace, "software-design");
  writeText(path.join(workspace, "software-brief.md"), "# Software Brief\n\nBorrowers repay loans in installments.\n");
  writeText(path.join(root, "README.md"), "# Software Design\n");
  writeText(path.join(root, "system-model/architecture.md"), `---
type: system-architecture
design_format: 2
name: Example lending system
assurance_id: "None."
domains: "lending"
global_invariants: "None."
security_boundaries: "None."
scope_boundaries: "None."
---

# System Architecture

## Purpose And Binding

Bind every repayment to one loan identity.

## Authority And Sources Of Truth

The Lending Domain owns loan balances.

## System Domains

| Domain | Purpose | System Responsibilities |
| --- | --- | --- |
| [Lending](./domains/lending/domain.md) | Loan balances and repayment | \`SR-001\`, \`SR-002\` |

## Cross-Domain Boundaries

None.
`);
  writeText(path.join(root, "system-model/domains/lending/domain.md"), `---
type: system-domain
id: DOMAIN-lending
name: Lending Domain
responsibilities: "SR-001, SR-002"
external_responsibilities: "None."
---

# Lending Domain

## Purpose

Own loan balances and repayment.
`);
  for (const [file, id, name] of [[RESPONSIBILITY, "SR-001", "Loan Ledger"], [REPAYMENT, "SR-002", "Repayment Handling"]]) {
    writeText(path.join(root, file), `---
type: system-responsibility
id: ${id}
name: ${name}
domain: lending
depends_on: "None."
participates_in: "None."
realized_by: "None."
---

# ${id} — ${name}

## Purpose

Own ${name.toLowerCase()}.
`);
  }
  if (tickets.length || archived.length) writeTickets(root, tickets, archived);
  return { workspace, root };
}
