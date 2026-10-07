// Fixture integrity checks, not evidence of agent behavior.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

function createFixture(...flags) {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'restructure-fixture-'));
  const root = path.join(parent, 'repository');
  execFileSync('python3', [path.join(here, 'create-architecture-fixture.py'), root, ...flags]);
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  const run = (command, args) => execFileSync(command, args, { cwd: root, encoding: 'utf8', env, stdio: 'pipe' });
  return { parent, root, run };
}

test('architecture fixture has its intended baseline, coupling and history', () => {
  const { parent, root, run } = createFixture();
  try {
    let output = '';
    try {
      run('node', ['--test', '--test-reporter=tap']);
    } catch (error) {
      output = error.stdout;
    }
    assert.match(output, /# tests 10\b/, 'a baseline run that collects no tests would hide the fixture failure');
    assert.match(output, /# fail 1\b/);
    assert.match(output, /not ok \d+ - a range within one day counts zero full days/);
    assert.equal(run('git', ['status', '--porcelain']), '');

    const emailCommit = run('git', ['log', '--format=%H', '--grep=Add email integration']).trim();
    const touched = run('git', ['show', '--name-only', '--format=', emailCommit]).trim().split('\n');
    assert.ok(touched.length >= 5, `adding an integration touched ${touched.length} files`);

    const web = fs.readFileSync(path.join(root, 'web/app.mjs'), 'utf8');
    assert.match(web, /from '\/app\/pricing\.mjs'/, 'frontend no longer loads code from its server');
    assert.match(fs.readFileSync(path.join(root, 'web/integration-options.mjs'), 'utf8'), /id: 'sms'/);
    assert.doesNotMatch(fs.readFileSync(path.join(root, 'server/integration-registry.mjs'), 'utf8'), /sms/);

    const legacy = `import { loadConfig } from './config/load.mjs';
if ((await loadConfig({ NB_PORT: '7000' })).port !== 7000) process.exit(1);`;
    run('node', ['--input-type=module', '-e', legacy]);
    assert.ok(!fs.existsSync(path.join(root, 'maintenance/plans/restructure-integrations.md')));
  } finally {
    fs.rmSync(parent, { recursive: true, force: true });
  }
});

test('the --with-plan variant adds one plan whose baseline revision exists', () => {
  const { parent, root, run } = createFixture('--with-plan');
  try {
    const plan = fs.readFileSync(path.join(root, 'maintenance/plans/restructure-integrations.md'), 'utf8');
    const revision = plan.match(/2026-09-20, ([a-f0-9]{40})/)[1];
    assert.equal(run('git', ['cat-file', '-t', revision]).trim(), 'commit');
    assert.match(plan, /^Status: Awaiting decision$/m);
    assert.equal(run('git', ['status', '--porcelain']), '');
  } finally {
    fs.rmSync(parent, { recursive: true, force: true });
  }
});
