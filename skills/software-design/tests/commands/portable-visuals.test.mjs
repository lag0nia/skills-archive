import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { explorerFixture } from '../support/explorer-fixture.mjs';

// A package's own copy of the generator must rebuild and check its visuals after the package moves,
// without the skill, and every local link or asset in the generated pages must resolve.
const scripts = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../scripts');
const shipped = ['generate-visuals.mjs', 'lib/system-explorer.mjs', 'lib/explorer-pages.mjs', 'lib/visual-graphs.mjs', 'lib/graph-layout.mjs', 'lib/vendor'];

test('a relocated package regenerates offline with its own generator copy and keeps local links resolvable', t => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'portable-visuals-'));
  t.after(() => fs.rmSync(workspace, { recursive: true, force: true }));
  const original = path.join(workspace, 'original');
  explorerFixture(original);
  fs.writeFileSync(path.join(original, 'README.md'), '# Software Design\n\n[System Explorer](./visuals/index.html)\n');
  fs.mkdirSync(path.join(original, 'build/workflow/handoffs'), { recursive: true });
  fs.writeFileSync(path.join(original, 'build/workflow/handoffs/README.md'), '# Handoffs\n');
  for (const file of shipped) fs.cpSync(path.join(scripts, file), path.join(original, 'visuals/assets', file), { recursive: true });
  const run = (root, ...args) => spawnSync(process.execPath, [path.join(root, 'visuals/assets/generate-visuals.mjs'), '--root', root, ...args], { cwd: workspace, encoding: 'utf8' });
  assert.equal(run(original, '--views', 'explorer,build').status, 0);

  const moved = path.join(workspace, 'elsewhere', 'package');
  fs.mkdirSync(path.dirname(moved), { recursive: true });
  fs.renameSync(original, moved);
  const fresh = run(moved, '--check');
  assert.equal(fresh.status, 0, fresh.stderr);

  const state = path.join(moved, 'system-model/contracts/states/state-002-escrow.md');
  fs.appendFileSync(state, '\nControlled fixture change.\n');
  const stale = run(moved, '--check');
  assert.notEqual(stale.status, 0);
  assert.match(stale.stderr, /Stale source|Graph source changed/);

  let links = 0;
  for (const page of ['visuals/index.html', 'visuals/pages/system.html', 'visuals/pages/states.html', 'visuals/maps/build-unit-dependencies.html']) {
    const file = path.join(moved, page), html = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(html, /<script[^>]+src=|<link[^>]+href=["']https?:|@import/);
    for (const match of html.matchAll(/(?:href|src)=["']([^"'#?]+)/g)) {
      if (/^(?:[a-z]+:|\/\/)/i.test(match[1])) continue;
      assert.ok(fs.existsSync(path.resolve(path.dirname(file), match[1])), page + ' links to missing ' + match[1]);
      links++;
    }
  }
  assert.ok(links > 0);
});
