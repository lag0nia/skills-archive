// Fixture integrity checks, not evidence of agent discovery or compliance.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
test('continuation fixture preserves executable consumers and verifiable prior history', () => {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'cleanup-fixture-'));
  const root = path.join(parent, 'repository');
  const childEnv = { ...process.env };
  delete childEnv.NODE_TEST_CONTEXT;
  const run = (command, args) => execFileSync(command, args, { cwd: root, encoding: 'utf8', env: childEnv, stdio: 'pipe' });
  try {
    execFileSync('python3', [path.join(here, 'create-continuation-fixture.py'), root]);
    const checks = run('node', ['--test', '--test-reporter=tap']);
    assert.match(checks, /# tests 7\b/);
    assert.match(checks, /# fail 0\b/);
    assert.equal(run('git', ['status', '--porcelain']), '');
    const plan = fs.readFileSync(path.join(root, 'maintenance/plans/cleanup-repository.md'), 'utf8');
    const revision = plan.match(/Revision: ([a-f0-9]{40})/)[1];
    const prior = run('git', ['show', `${revision}:src/summary.mjs`]);
    const current = fs.readFileSync(path.join(root, 'src/summary.mjs'), 'utf8');
    assert.ok(prior.includes('function alreadyRemoved('));
    assert.ok(!current.includes('function alreadyRemoved('));
    for (const declaration of ['export function unusedExport(', 'function padAccountCode(', '  function unusedNestedLabel(']) {
      assert.ok(current.includes(declaration));
    }
    const probe = `import { summarize } from './src/summary.mjs';
import { dispatch } from './src/jobs/dispatch.mjs';
import assert from 'node:assert/strict';
assert.deepEqual(summarize([[1], [2]], 1), [[1]]);
assert.deepEqual(await dispatch(), ['reconciled']);`;
    run('node', ['--input-type=module', '-e', probe]);
    const implicitProbe = current.replace("return 'summary';", "throw new Error('implicit hook reached');");
    assert.throws(() => run('node', ['--input-type=module', '-e', implicitProbe + '\nsummarize([], 1);']), /implicit hook reached/);
    assert.ok(plan.includes('Owner decision recorded'));
    assert.ok(fs.readFileSync(path.join(root, 'maintenance/observations.md'), 'utf8').includes('OBS-render-csv'));
  } finally {
    fs.rmSync(parent, { recursive: true, force: true });
  }
});
