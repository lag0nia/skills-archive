---
type: system-invariant
id: INV-001
name: Invariant name
responsibilities: "SR-001, SR-002"
flows: "FLOW-001"
related_contracts: "None."
---

# INV-001 — Invariant Name

## Rule

State one durable system-level `must` or `must not` claim.

## Scope

State where and when the rule applies, including boundary conditions.

## Violation Meaning

State what incorrect authority, transition, artifact, or outcome a violation would permit.

## Verification Obligations

Keep each Verification Obligation in this invariant file. Do not create one file per VO or bind a delivery-specific test path here. Apply the active Software Design skill's Assurance Traceability contract before replacing this guidance.

<a id="inv-001.vo-001"></a>
### INV-001.VO-001 — Observable obligation name

**Claim:** State one precise observable behavior that supports the invariant.

**Required observation:** State what a reviewer must observe to accept this claim.

**Risk:** `ordinary` / `high`

**Evidence expectation:** State the evidence class or combination required without prescribing an implementation test file.

**Boundary cases:** State material positive, negative, boundary, failure, recovery, concurrency, or lifecycle cases; otherwise give a concrete `None.` reason.

**Standards references:** `None.` or exact versioned or dated external references that constrain this obligation.
