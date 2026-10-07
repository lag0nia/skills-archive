# Evidence and Findings

## Contents

- [Promotion Test](#promotion-test)
- [Candidate Outcomes](#candidate-outcomes)
- [Confidence and Verification](#confidence-and-verification)
- [Severity](#severity)
- [Finding Families](#finding-families)
- [Required Finding Content](#required-finding-content)
- [Invalid Findings](#invalid-findings)

## Promotion Test

Promote a candidate only when all are true:

1. A current approved or supported contract exists.
2. A specific behavior, requirement, calculation, or artifact violates it.
3. A concrete failure scenario is reproducible, calculable, traceable, or logically demonstrated.
4. The failure has meaningful impact.
5. Evidence is sufficient for `DEMONSTRATED` or `STRONGLY_SUPPORTED`.
6. The smallest defensible corrective boundary is known.
7. The candidate is not intended, open, excluded, deferred, superseded, or merely preferred.

Use this compact test:

```text
known contract + concrete violation + failure scenario + impact + evidence = candidate eligible for confirmation
```

Independent confirmation still decides final promotion.

## Candidate Outcomes

Assign every material candidate exactly one final outcome:

- `CONFIRMED_FINDING`: independently supported and reportable.
- `UNCONFIRMED_CONCERN`: plausible, but missing evidence or intent prevents promotion.
- `REJECTED_NOT_A_BUG`: evidence shows no supported defect.
- `INTENDED_BEHAVIOR`: behavior matches current approved intent.
- `OPEN_DECISION`: no current contract selects the behavior needed for a verdict.
- `OUT_OF_SCOPE`: outside the declared or explicitly approved boundary.
- `INSUFFICIENT_EVIDENCE`: the failure cannot be supported responsibly.

Only `CONFIRMED_FINDING` receives an `F-xxx` ID and appears under confirmed findings. Preserve material non-promoted outcomes in the appropriate report section. Omit trivial false starts.

If intent alone blocks a verdict, return `USER_DECISION_NEEDED` before assigning the final outcome when a user answer can materially resolve it.

## Confidence and Verification

Use one confidence value:

- `DEMONSTRATED`: reproduced at runtime; proven by a test, request, script, or calculation; or established by a direct contradiction with complete premises.
- `STRONGLY_SUPPORTED`: the evidence and failure path are strong, but a real environment or execution limitation prevented full demonstration.

Use one primary verification label:

- `Runtime-verified`
- `Test-verified`
- `Script-verified`
- `Request-verified`
- `Calculation-verified`
- `Contract-trace-verified`
- `Scenario-verified`
- `Contradiction-verified`
- `Static-analysis-only`

Do not promote low-confidence speculation. `Static-analysis-only` normally pairs with `STRONGLY_SUPPORTED` unless the static evidence is a complete logical contradiction.

For `DEMONSTRATED`, record exact inputs, states, steps, calculation, or source premises and the observed or implied result. For `STRONGLY_SUPPORTED`, record the precise path, trigger, missing verification capability, and first step a future owner should use to confirm it.

## Severity

Assign one impact severity:

- `CRITICAL`: serious security compromise, loss of control, major financial or data loss, systemic integrity failure, or catastrophic unsafe design.
- `HIGH`: major product, workflow, financial, reliability, or implementation failure.
- `MEDIUM`: meaningful bounded edge case, state gap, inconsistency, or degraded behavior.
- `LOW`: real limited-impact defect worth correcting; never style or preference.

Mode `low` and severity `LOW` are unrelated. Keep them in separate fields.

## Finding Families

Define a family as the smallest defensible grouping with one materially shared corrective boundary.

- Merge manifestations only when one correction should responsibly address them together.
- Keep similar symptoms separate when ownership or corrective boundaries differ.
- Search for sibling manifestations after finding a pattern.
- Name included sibling surfaces and nearby excluded surfaces.
- Do not broaden a finding into an entire theme or contract without evidence.

Allocate report-local IDs after confirmation as `F-001`, `F-002`, and so on.

For an explicit update of an existing report:

- reuse the ID when the corrective boundary is unchanged;
- record predecessor/superseded linkage when a family splits or merges;
- never recycle an old ID for an unrelated family.

## Required Finding Content

Record for each confirmed finding:

- ID and title;
- severity, confidence, verification label, and category;
- affected area and exact evidence paths;
- approved or supported contract;
- failure condition;
- observed or logically implied result;
- expected result;
- impact;
- reproduction, calculation, trace, or scenario steps;
- why this is a bug rather than intended/open/excluded behavior;
- smallest corrective boundary;
- included sibling surface;
- nearby excluded surface;
- related findings;
- environment or evidence limitations; and
- discovery-only handoff owner, without implementing a fix.

High-level corrective ownership is allowed. A code patch, implementation plan, or claimed fix is not.

## Invalid Findings

Do not report:

- style, naming, or refactoring preferences;
- hypothetical risks without a concrete failure path;
- optional detail missing from an artifact that does not own it;
- explicit future or deferred work;
- explicit scope exclusions;
- unresolved product choices;
- intentional behavior supported by current authority;
- pure plan wording drift without behavioral consequence;
- duplicated symptoms split solely to increase finding count; or
- a known issue whose evidence does not meet the promotion threshold.

Zero confirmed findings is valid. Never lower the bar to avoid an empty section.

