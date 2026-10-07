---
type: system-security-boundary
id: SEC-001
name: Security boundary name
responsibilities: "SR-001, SR-002"
flows: "FLOW-001"
related_contracts: "INV-001"
---

# SEC-001 — Security Boundary Name

## Protected Assets And Authority

State assets, credentials, capabilities, or authority protected by this boundary.

## Trust Assumptions

- State explicit trust and non-trust assumptions.

## Threats

<a id="sec-001.threat-001"></a>
### SEC-001.THREAT-001 — Threat name

**Scenario:** State one concrete attack or misuse path.

**Affected assets or authority:** Name what the scenario could expose, alter, deny, or illegitimately authorize.

## Required Controls

<a id="sec-001.control-001"></a>
### SEC-001.CONTROL-001 — Control name

**Rule:** State the durable control.

**Mitigates:** `SEC-001.THREAT-001`

**Canonical owner:** Link the owning System Responsibility, interface, state, invariant, or other exact canonical record.

## Prohibited Authority

- State authority no participant, application, operator, or external system may gain.

## Failure Impact

State the bounded impact if this boundary or one of its required controls fails.

## Verification Obligations

Keep each Verification Obligation in this security record. Every structured threat must have a mitigating control, and every structured control must be covered by at least one VO. Apply the active Software Design skill's Assurance Traceability contract before replacing this guidance.

<a id="sec-001.vo-001"></a>
### SEC-001.VO-001 — Observable security obligation name

**Claim:** State one precise observable behavior supported by the required controls.

**Covers:** `SEC-001.THREAT-001`, `SEC-001.CONTROL-001`

**Required observation:** State what a reviewer must observe to accept this claim.

**Risk:** `ordinary` / `high`

**Evidence expectation:** State the evidence class or combination required without prescribing an implementation test file.

**Boundary cases:** State material positive, rejection or denial, failure or recovery, abuse, concurrency, or lifecycle cases; otherwise give a concrete `None.` reason.

**Standards references:** `None.` or exact versioned or dated external references that constrain this obligation.
