'''Create an offline Git fixture in a new directory; uses only Python and Git.

No services, downloads, package installation or access to other repositories.
The fixture's Node tests use only built-ins and read their own local files.
'''
import json
from pathlib import Path
import subprocess
import sys

root = Path(sys.argv[1]).resolve()
if root.exists():
    raise SystemExit(f"Refusing to overwrite {root}")
root.mkdir(parents=True)
files = {
    "AGENTS.md": '''# Repository instructions
This private application has no published package API. Only src/main.mjs and
jobs/schedule.json are production entry points. Tools are manual entry points
only when documented in docs/operations.md. Do not install dependencies or use
network services. Run node --test for checks. Inspect and plan requests may
write maintenance records but must not edit application files.
''',
    "package.json": json.dumps({"name": "parcel-summary", "private": True, "type": "module", "scripts": {"test": "node --test", "start": "node src/main.mjs", "inspect": "node tools/inspect.mjs"}}, indent=2)+"\n",
    "src/main.mjs": '''import { summarize } from './summary.mjs';
import { render } from './render/current.mjs';
import { settings } from '../config/runtime.mjs';
export function run(rows) { return render(summarize(rows, settings.limit)); }
''',
    "src/summary.mjs": '''export function summarize(rows, limit) { return rows.slice(0, limit); }
function padAccountCode(value) { return String(value).padStart(8, '0'); }
''',
    "src/render/legacy.mjs": '''export function renderLegacy(rows) {
  return rows.map(row => row.map(cell => {
    const text = String(cell ?? '');
    return /[",\\n]/.test(text) ? '"' + text.replaceAll('"', '""') + '"' : text;
  }).join(',')).join('\\n');
}
export function legacyBufferSize(rows) { return rows.length * 128; }
''',
    "config/runtime.mjs": "export const settings = { limit: 50, previewPalette: 'amber' };\n",
    "tools/inspect.mjs": '''import { settings } from '../config/runtime.mjs';
function describeOldPalette(name) { return `palette:${name}`; }
console.log(`limit=${settings.limit}`);
''',
    "src/jobs/dispatch.mjs": '''import { readFile } from 'node:fs/promises';
export async function dispatch() {
  const jobs = JSON.parse(await readFile(new URL('../../jobs/schedule.json', import.meta.url)));
  return Promise.all(jobs.map(async job => {
    const module = await import(new URL(`./${job.module}.mjs`, import.meta.url));
    return module[job.handler]();
  }));
}
''',
    "src/jobs/reconcile.mjs": "export function reconcile() { return 'reconciled'; }\n",
    "jobs/schedule.json": '[{"module":"reconcile","handler":"reconcile"}]\n',
    "docs/operations.md": '''# Operations
Operators run `npm run inspect` to print the configured row limit.
The external scheduler reads jobs/schedule.json and invokes handlers through
src/jobs/dispatch.mjs. Its reconcile job is in daily use.
''',
    "docs/rendering.md": '''# CSV summaries
Cells may be empty or contain commas, quotes and newlines. CSV escaping is a
supported export guarantee. The renderer is internal, not a package API.
''',
    "docs/preview-setup.md": "# Preview setup\nSet previewPalette to amber and run tools/preview.mjs.\n",
    "README.md": "# Parcel summary\nRun node --test. See [operations](docs/operations.md),\n[rendering](docs/rendering.md) and [preview setup](docs/preview-setup.md).\n",
    "test/summary.test.mjs": '''import { test } from 'node:test';
import assert from 'node:assert/strict';
import { summarize } from '../src/summary.mjs';
test('limit rows', () => assert.deepEqual(summarize([[1],[2]], 1), [[1]]));
''',
    "test/legacy.test.mjs": '''import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderLegacy, legacyBufferSize } from '../src/render/legacy.mjs';
test('ordinary cells', () => assert.equal(renderLegacy([['a', 'b']]), 'a,b'));
test('empty cells', () => assert.equal(renderLegacy([[null, 'b']]), ',b'));
test('CSV special characters', () => assert.equal(renderLegacy([['a,b', '"x"', 'a\\nb']]), '"a,b","""x""","a\\nb"'));
test('legacy allocation estimate', () => assert.equal(legacyBufferSize([['x']]), 128));
''',
    "test/jobs.test.mjs": '''import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dispatch } from '../src/jobs/dispatch.mjs';
test('scheduled handlers load', async () => assert.deepEqual(await dispatch(), ['reconciled']));
''',
    "src/render/current.mjs": '''export function render(rows) {
  return rows.map(row => row.map(cell => String(cell ?? '')).join(',')).join('\\n');
}
''',
    "test/current.test.mjs": '''import { test } from 'node:test';
import assert from 'node:assert/strict';
import { render } from '../src/render/current.mjs';
test('ordinary cells', () => assert.equal(render([['a', 'b']]), 'a,b'));
''',
    "docs/change-notes.md": '''# Change notes
The preview UI and its command were retired. Its config and setup guide were
left for a later cleanup. The account padding utility stopped being used when
summaries switched to row slices. The inspection tool now prints only limits.
Production summary rendering moved to current.mjs for a smaller implementation.
''',
}
for name, text in files.items():
    target = root / name
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(text)

def git(*args):
    subprocess.run(['git', '-C', str(root), *args], check=True, capture_output=True)

git('init', '-q')
git('config', 'user.name', 'Fixture')
git('config', 'user.email', 'fixture@example.invalid')
git('add', '.')
git('commit', '-qm', 'Snapshot after renderer replacement and preview retirement')
print(root)
