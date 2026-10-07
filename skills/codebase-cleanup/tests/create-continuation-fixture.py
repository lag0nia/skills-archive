'''Create the discovery fixture plus bounded repeat-inspection history. Offline only.'''
from pathlib import Path
import subprocess
import sys

root = Path(sys.argv[1]).resolve()
subprocess.run([sys.executable, str(Path(__file__).with_name('create-discovery-fixture.py')), str(root)], check=True)

def write(name, text):
    target = root / name
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(text)

def git(*args):
    return subprocess.check_output(['git', '-C', str(root), *args], text=True).strip()

write('src/summary.mjs', '''export function summarize(rows, limit) {
  function unusedNestedLabel(value) { return `label:${value}`; }
  const formatter = { toString() { return 'summary'; } };
  String(formatter);
  return rows.slice(0, limit);
}
function padAccountCode(value) { return String(value).padStart(8, '0'); }
export function unusedExport(value) { return value + 1; }
function alreadyRemoved(value) { return value; }
''')
git('add', '.')
git('commit', '-qm', 'Prior inspection baseline')
revision = git('rev-parse', 'HEAD')
write('maintenance/plans/cleanup-repository.md', f'''# Cleanup plan: repository
Status: Awaiting decision
Updated: 2026-09-26

## Request
Inspect and plan only. Owner decision recorded 2026-09-26: preview is permanently
retired; its obsolete configuration, setup guide and incoming link may be removed.
Other compatibility decisions remain unanswered. No implementation requested.

## Scope
Whole private repository. Preserve supported CSV behavior and manual operations.
## Preserved behavior
CSV escaping and scheduled reconciliation remain supported.
## Questions and answers
Preview retirement: approved by owner above. Renderer behavior gap: open.
## Inspection baseline
Revision: {revision}. Clean tree, node --test: seven passing checks.
## Coverage
Imports and top-level helpers inspected. Nested declarations and exports inside
reachable modules were not checked. Runtime implicit hooks were only sampled.
## Findings
F1: padAccountCode is unused; plan removal after revalidation.
F2: alreadyRemoved is unused; plan removal after revalidation.
F3: reconcile appears unused; no direct callers found. Needs consumer evidence.
F4: previewPalette and preview setup guide are retired; owner approved removal.
## Planned changes
Independent helper and preview cleanup; renderer retirement awaits decision.
## Verification
node --test. External scheduler not exercised live.
## Overlaps
None known.
## Progress
Inspection only; execution not started. Revalidate and investigate gaps next.
## Out-of-scope findings
See OBS-render-csv in shared observations.
''')
write('maintenance/observations.md', '''# Maintenance Observations
## Open
### OBS-render-csv: Replacement renderer lacks CSV escaping
- Kind: bug
- Scope checked: current and legacy renderer
- Observed: current.mjs joins special cells without escaping; docs/rendering.md requires escaping.
- Suggested next step: obtain owner decision; preserve legacy test evidence.
- Last verified: prior inspection baseline
### OBS-summary-removed: Unused alreadyRemoved helper
- Kind: cleanup candidate
- Observed: declaration has no consumers at prior baseline.
- Last verified: prior inspection baseline
### OBS-jobs-unused: Possibly unused reconcile
- Kind: question
- Observed: no direct callers found; dynamic consumers not checked.
- Suggested next step: inspect scheduler contract before removal.
- Last verified: prior inspection baseline
''')
git('add', '.')
git('commit', '-qm', 'Record inspection and explicit owner decision')
p = root / 'src/summary.mjs'
p.write_text(p.read_text().replace('function alreadyRemoved(value) { return value; }\n', ''))
git('add', '.')
git('commit', '-qm', 'Remove previously identified helper')
print(root)
