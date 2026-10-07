# Bug Audit

## Audit Metadata

- Audit ID: `<audit-id>`
- Target: `<target path or description>`
- Target kind: `<CODE_RUNTIME | PRODUCT_SPEC_PLAN | PROCEDURE_OPERATIONS | CONFIG_SCHEMA_INFRA | MIXED>`
- Intensity: `<low | medium | high>`
- Date: `<yyyy-mm-dd>`
- Audit status: `<complete | partial | blocked>`
- Output path: `<path>`

## Scope

### User Request

<Concise audit request.>

### Included

- <Included surface.>

### Excluded

- <Excluded surface or `None.`>

### Assumptions

- <Accepted assumption or `None.`>

### Boundary Expansion

- <Justified adjacent inspection or `None.`>

## Audit Basis

### Audit Goal

<What this audit is trying to determine.>

### Target Goal

<What the target currently claims to accomplish.>

### Authority Order Used

1. <Highest-authority source.>

### Approved and Current Contracts

- <Contract with exact source.>

### Open Decisions

- <Open decision or `None.`>

### Future or Deferred

- <Future/deferred item or `None.`>

### Explicit Exclusions

- <Exclusion or `None.`>

### Superseded Sources

- <Superseded source or `None.`>

### Contradictory or Unclear Authority

- <Conflict or `None.`>

### User Answers During Audit

- <Answer and affected contract or `None.`>

## Conclusion

- Audit conclusion: `<FOCUSED_SCAN | COVERED | PARTIALLY_COVERED | EXHAUSTED | BLOCKED_BY_ENVIRONMENT>`
- Why the audit stopped: `<reason>`
- Coverage confidence: `<statement>`
- Confirmed findings: `<count>`
- Unconfirmed concerns: `<count>`
- Material limitation: `<limitation or None.>`

## Coverage

### Surfaces Inspected

- <Surface and result.>

### Lenses Applied

- <Lens.>

### Checks Performed

- <Scenario, state, calculation, contract, dependency, or runtime check.>

### Stage Receipt Summary

- <Required stage and outcome.>

### Deliberately Not Inspected

- <Area and reason or `None.`>

### Coverage Ledger or Matrix

- <High-mode ledger/matrix status, or `Not required for this mode.`>

## Confirmed Findings

None.

<!-- Repeat this block only for confirmed findings.

### F-001 — <Title>

- Severity: <CRITICAL | HIGH | MEDIUM | LOW>
- Confidence: <DEMONSTRATED | STRONGLY_SUPPORTED>
- Verification: <allowed verification label>
- Category: <category>
- Affected area: <area>
- Evidence: <exact paths, sections, lines, commands, or receipts>
- Approved or supported contract: <contract and Audit Basis source>
- Failure condition: <condition>
- Observed or logically implied result: <result>
- Expected result: <result>
- Impact: <impact>
- Reproduction / calculation / trace / scenario: <steps>
- Why this is a bug: <why not intended, open, excluded, deferred, or preference>
- Smallest corrective boundary: <boundary>
- Included sibling surface: <surface>
- Nearby excluded surface: <surface>
- Related findings: <IDs or None.>
- Environment or evidence limitations: <limitations or None.>
- Discovery-only handoff: <owner or downstream skill; do not implement>

-->

## Unconfirmed Concerns

None.

<!-- For each material concern, record candidate outcome, evidence, missing proof or intent, exact user question when useful, and affected surface. -->

## Rejected Candidates

None.

<!-- Record only material rejected/intended/out-of-scope candidates whose lineage adds value. -->

## Remaining Search Space

- Likely sibling space: `None.`
- Plausible separate-family space: `None.`
- Open state or contract cells: `None.`
- Uninspected surfaces: `None.`
- Environment or evidence limitations: `None.`

## Recommended Handoff

<Recommended owner or skill, or `None required.` Do not start the handoff automatically.>

