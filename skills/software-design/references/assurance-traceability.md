# Assurance Traceability

Read this reference when creating or changing structured Verification Obligations, assigning them to Build Units, defining repository evidence mappings, assessing their Delivery Readiness closure, or rendering the blueprint-wide assurance report. Read [system-model-format.md](system-model-format.md) for canonical contract ownership and [build-design-and-delivery-readiness.md](build-design-and-delivery-readiness.md) before Stage 8 or Stage 9 work.

## Purpose And Limits

Assurance traceability lets a reviewer answer four separate questions without reading every test file:

1. What observable correctness or security claim did the blueprint declare?
2. Which Build Unit and repository must supply evidence for it?
3. Which exact test selector, analysis, inspection, exercise, or formal result is bound to it?
4. Did that evidence exist, run, pass, and remain fresh for the exact blueprint and repository revisions under review?

Evidence supports a declared claim; it does not prove that a system is universally secure or defect-free. Never label a repository, Build Unit, obligation, or blueprint `secure` merely because mapped evidence passed. The strongest permitted summary is that the declared obligations are complete for the named snapshot and evidence policy.

This is a traceability contract, not a universal test policy or implementation runner. Test frameworks, coverage percentages, minimum test counts, CI vendors, and repository-specific commands remain repository decisions. A downstream implementation or workpack supplies the adapters that execute evidence and emit normalized results.

Use **Verification Obligation** (`VO`) for an observable claim that requires evidence. Reserve **Proof Obligation** (`PO`) for a genuinely formal method whose logic and proof system make that term accurate. A `VA-xxx` Verification Capability is reusable infrastructure that can support one or more VOs; it is not the claim and does not report a passing run.

## Conditional Lifecycle

Materialize only the layer justified by the active stage:

- **Stage 5:** `INV-xxx` and `SEC-xxx` records define structured VOs inside their existing files. Do not create one file per VO or a new assurance folder in the blueprint.
- **Stage 8:** when Build Design exists and structured VOs exist, assign every VO to at least one `BU-xxx`. Each first-party repository with an assigned VO plans one tracked `assurance/coverage.yaml` covering all of its member Build Units. Do not create one manifest per Build Unit.
- **Stage 9:** a selected delivery slice closes every selected assignment into a concrete downstream evidence route. Planned evidence may remain planned when implementation does not yet exist; unassigned or unrouted obligations block readiness.
- **Implementation and verification:** repository adapters resolve exact evidence bindings, execute them, and emit normalized results. One blueprint-wide report is generated from those results.

Every INV/SEC record requires structured `## Verification Obligations`. Missing current structure fails validation; do not maintain competing verification prose. Do not modify consumer packages merely because this skill changed; report affected records when validating a selected scope.

## Canonical Verification Obligations

Keep VOs in the invariant or security record that owns the behavior. A VO is one reviewable claim with one required observation, not one test case and not a broad promise such as “validate security.” One VO may need zero, one, or many evidence bindings; zero is a visible coverage gap unless a current approved exception applies.

### Invariant obligations

Use stable IDs such as `INV-001.VO-001` under `## Verification Obligations`. Every entry requires:

- a stable explicit HTML anchor matching the lowercase full ID;
- `Claim`: the precise behavior being supported;
- `Required observation`: what a reviewer must observe to accept the claim;
- `Risk`: `ordinary` or `high`;
- `Evidence expectation`: the evidence class or combination needed, without naming a delivery-specific test file; and
- `Boundary cases`: material positive, negative, boundary, failure, recovery, concurrency, or lifecycle cases, or a concrete `None.` reason.

### Security threats, controls, and obligations

Within one `SEC-xxx` record, use stable IDs:

- `SEC-001.THREAT-001` for one concrete attack or misuse scenario;
- `SEC-001.CONTROL-001` for one durable control; and
- `SEC-001.VO-001` for one observable claim about that boundary.

Every control names the threats it mitigates and its canonical owner. Every security VO names the threats and controls it covers. Every structured threat must be mitigated by at least one control, and every structured control must be covered by at least one VO. This produces the human-readable chain `threat → control → obligation → evidence` without creating parallel files.

### Risk and evidence strength

Reuse the existing `ordinary` / `high` risk classification. Apply stronger methods only when the claim warrants them:

- `ordinary` requires evidence appropriate to the stated observation;
- `high` requires explicit positive, rejection or denial, and failure or recovery boundaries when applicable, plus evidence diversity when one method cannot exercise the material failure modes.

Do not require several evidence kinds merely to increase a count. Prefer property-based, fuzz, static or dynamic analysis, model checking, formal proof, independent consumer challenges, or operational exercises only when they materially strengthen the claim. Record external standards references only when they constrain the design; include the exact version or dated source and never hardcode one industry standard into every project.

## Stage 8 Build Unit Assignment

Every Build Unit record uses `### Verification Obligation Assignments` once structured VOs exist in the package. Each assigned row names:

- the exact full VO ID and canonical source link;
- the unit's evidence responsibility, including whether it supplies producer, consumer, joint, repository-wide, or external evidence;
- the required evidence or observation routed to this unit; and
- `Planned` or `Existing — freshness unverified` state.

A unit with no assignment uses a concrete `None.` disposition. Across all Build Units, every structured VO must be assigned at least once. Many-to-many routing is valid: one VO may need several Build Units, and one Build Unit may own evidence for many VOs.

An assignment does not claim that evidence exists or passed. It fixes who must bind the evidence later.

## Repository Assurance Manifest

Each first-party implementation repository that owns one or more assigned VOs contains exactly one authored, reviewed, and tracked file at:

```text
assurance/coverage.yaml
```

Use [the manifest template](../assets/templates/assurance/coverage.yaml). The manifest covers every member Build Unit in that repository and maps each VO assignment to one or more evidence bindings. It is implementation-repository truth, not a file inside the Software Design package. A repository with no assigned VO does not need the file.

Keep the `.yaml` file in the JSON-compatible YAML subset shown by the template. This preserves normal YAML compatibility while allowing the portable validator to parse the manifest deterministically without a repository-specific YAML dependency. The validator rejects unknown or placeholder fields so misspelled binding data cannot silently disappear.

Each evidence binding has a stable repository-local ID and names:

- one stable blueprint key and canonical Software Design source, so identical local VO IDs from different blueprints cannot collide;
- one owning Build Unit and one or more exact VO IDs;
- evidence kind and method;
- an exact locator and, for tests, an exact framework selector rather than only a test-file path;
- the canonical command or adapter that discovers and executes it;
- the expected observation;
- case or fixture sources when applicable; and
- the result adapter that emits normalized evidence.

Bindings are many-to-many. One test file or selector may support several VOs, and one VO may require several selectors or non-test evidence items. Mapping only a file is ambiguous when the file contains several tests. Fixtures are inputs, not evidence by themselves.

For parameterized or data-driven checks, report these separately:

- selector count;
- discovered and executed case counts;
- passing, failing, and skipped case counts; and
- fixture or case IDs.

In normalized test evidence, keep declared parameter cases in `case_ids` and fixture file or dataset locators in `fixtures`; never use one field for both concepts.

This prevents “four tests” from ambiguously meaning four selectors, four parameter cases, or four files.

Supported evidence kinds are `test`, `static-analysis`, `dynamic-analysis`, `formal-proof`, `inspection`, and `operational-exercise`. Repositories may refine `method` values without changing the cross-repository kinds. An inspection or manual exercise needs an immutable or reviewable result locator, reviewer or actor identity appropriate to project governance, and completion time; prose claiming that it happened is not sufficient.

## Freshness And Anti-False-Pass Rules

An assurance run records:

- exact blueprint snapshot or content digest;
- exact repository revision for every participating repository;
- digest of every `assurance/coverage.yaml` used;
- evidence adapter and material tool versions;
- run start and completion time; and
- discovery, execution, and result details for every required binding.

Compute the blueprint `snapshot_id` with the active skill's assurance scripts: files are sorted by package-relative path and the SHA-256 input binds each path, byte length, and file content. Compute each manifest digest from the exact `assurance/coverage.yaml` bytes. The report renderer independently compares both digests, the complete canonical VO-to-Build-Unit assignment universe, and every required manifest binding against the normalized result; a result adapter cannot make an omitted obligation or binding disappear by leaving it out of JSON.

Do not treat these situations as passing:

- a selector matches no test or evidence item;
- an expected parameterized case was not discovered;
- a required binding is skipped, filtered, quarantined, or not run;
- a result was produced for a different blueprint, repository, or manifest revision;
- only a fixture, test file, schema, mock, or command exists without the required observation; or
- a stale cached result lacks an identity-preserving reuse rule.

Normalize obligation status to exactly one of:

`unassigned`, `unmapped`, `missing`, `ambiguous`, `not-run`, `skipped`, `failed`, `passed`, `stale`, or `approved-exception`.

Only `passed` and a current `approved-exception` close an obligation for the named snapshot. A report may also show evidence-item statuses, but it must not collapse a missing selector or skipped required case into `passed`.

## Controlled Exceptions

An exception is a time-bounded governance decision, not a silent exclusion. Keep it in the repository manifest beside the affected mapping and require:

- exact Build Unit assignment, VO, and optional evidence-binding IDs;
- the stable blueprint key;
- canonical approval reference;
- owner;
- approver;
- concrete reason and residual risk;
- approval time;
- expiry or review date; and
- compensating control or a concrete `None.` reason.

Expired, unapproved, mismatched, or revision-inapplicable exceptions become gaps. The blueprint claim remains unchanged; change the canonical `INV` or `SEC` record when the intended behavior itself changes.

## Normalized Result And Human Report

Repository adapters emit normalized JSON shaped like [the result template](../assets/templates/assurance/normalized-result.json). The renderer consumes normalized evidence; it does not run tests or infer security from source code.

Repeat one VO under each Build Unit that owns an assignment and keep its canonical claim, observation, risk, and threat/control coverage identical. To expose a Stage 8 mapping failure, place the VO in the normalized `UNASSIGNED` Repository and Build Unit group with `unassigned` status; use `unmapped` only after a real Build Unit assignment exists but lacks an evidence binding. Summary counts distinguish unique canonical VOs from Build Unit assignments so many-to-many routing is not mistaken for duplicate tests.

Use `manifest_digest: "missing"` for a mapped first-party repository whose tracked manifest is absent, and report each affected assignment as `missing` with no evidence. Use the `EXTERNAL` repository group with `manifest_digest: "not-applicable"` for external/no-code Build Unit assignments and `UNASSIGNED` with the same manifest disposition only for genuine assignment gaps. These explicit groups keep missing ownership distinct from external evidence.

Generate exactly one human-first HTML report for the blueprint under the ignored sibling directory:

```text
<software-design-package-parent>/.software-design-assurance/
├── repositories/
│   └── repo-xxx-result.json
├── assurance-result.json
└── assurance-report.html
```

Place every assurance-owned generated repository fragment, aggregate, and report in this one directory. Do not place generated assurance results in an implementation repository, inside the canonical Software Design package, or in one report per Build Unit. Disposable framework-native output that an adapter reads may remain under the implementation repository's normal ignored test-output location, but it is not a second assurance report or source of normalized truth.

Before the first render, add the exact sibling `.software-design-assurance/` path to the ignore policy of the repository that hosts the design workspace and verify representative generated files are ignored. Do not assume an implementation repository's ignore file covers the design workspace when they are different repositories. The normalized schema and manifest templates remain tracked skill assets; only run outputs are ignored.

Organize the report as:

```text
Blueprint snapshot
└── Repository
    └── Build Unit
        └── INV/SEC record
            └── Verification Obligation
                └── Evidence bindings, selectors, cases, fixtures, observations, and exception
```

Show a linked open-gaps section before the repository hierarchy and display material tool and adapter versions beside the run provenance. For every VO, display its claim, required observation, risk, threat/control coverage when applicable, assignment, binding status, exact evidence locator, selector count, executed and passing cases, skipped or missing cases, fixtures, and freshness provenance. Provide repository, risk, status, evidence kind, and free-text filters; add further filters only when a real report size makes them useful. Counts are navigation aids, never substitutes for the obligation-level explanation.

Validate the repository manifests and complete assignment-to-binding coverage independently of any test runner:

```sh
node <software-design-skill-directory>/scripts/validate-assurance-coverage.mjs \
  --root <software-design-package> \
  --repository REPO-001=<implementation-repository-path>
```

Repeat `--repository` for every first-party repository with an assigned VO. The validator does not execute tests or judge whether an evidence strategy is semantically sufficient; it checks identities, manifest structure, exact assignments, bindings, exceptions, and current manifest presence.

Use `render-assurance-report.mjs` to validate and render a normalized result without executing evidence:

```sh
node <software-design-skill-directory>/scripts/render-assurance-report.mjs \
  --root <software-design-package> \
  --repository REPO-001=<implementation-repository-path> \
  --input <assurance-result.json> \
  --output <software-design-package-parent>/.software-design-assurance/assurance-report.html
```

Both commands derive the stable blueprint key from `system-model/architecture.md` `assurance_id`. The renderer requires the same repository mappings so it can reconcile the normalized result against the current blueprint and manifests before writing HTML. It may render real `unassigned`, `unmapped`, or `missing` gaps, but it rejects a result that merely omits them.

The report footer must repeat the non-overclaim: passing evidence supports only the declared obligations for the exact recorded snapshot.

## Review Gates

Before claiming the applicable stage complete, confirm:

- structured record: all required fields and stable identities exist, with complete security threat/control/VO closure;
- Build Design: every structured VO is assigned, and every affected repository has one manifest route;
- Delivery Readiness: every selected assignment has a downstream evidence route, with no unassigned or unmapped selected VO;
- implementation evidence: selectors resolve, required cases run, results and exceptions are fresh, and revisions match; and
- human review: the report exposes every gap without requiring the reviewer to read tests one by one.

Deterministic validation establishes structural traceability. It does not establish that the claims are sufficient, the chosen evidence is semantically adequate, or the system is secure. Review those questions explicitly, especially for `high` risk.
