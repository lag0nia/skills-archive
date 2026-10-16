import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { generateVisuals } from '../../scripts/generate-visuals.mjs';
import { explorerFixture } from '../support/explorer-fixture.mjs';

// Guarantees carried over from the retired standalone state pages: the states destination keeps reviewed
// exclusions and condition junctions visible and source-bound.
function workspace(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'explorer-states-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return { root, ...explorerFixture(root) };
}
const modelOf = html => JSON.parse(/<script id="explorer-model" type="application\/json">([\s\S]*?)<\/script>/.exec(html)[1]);
const booking = 'system-model/contracts/states/state-001-booking.md';

test('explorer shows an excluded transition with its reason and exact source row', t => {
  const f = workspace(t), graph = f.graphs.graphs[0];
  graph.edges = graph.edges.filter(e => e.id !== 'refund');
  graph.exclusions = { transitions: [{ source: { file: booking, heading: 'Transitions', row: 5 }, reason: 'Refunds are reviewed in a later checkpoint; this is not an impossible transition.' }] };
  delete f.explorer.objects[0].transitions.refund; f.write('visuals/assets/explorer.json', f.explorer);
  f.write('visuals/assets/graphs.json', f.graphs);
  generateVisuals(f.root, { views: ['explorer'] });
  const object = modelOf(fs.readFileSync(path.join(f.root, 'visuals/pages/states.html'), 'utf8')).objects.find(o => o.id === 'booking');
  assert.equal(object.exclusions.length, 1);
  assert.match(object.exclusions[0].reason, /not an impossible transition/);
  assert.match(JSON.stringify(object.exclusions[0].exact), /Refund/);
});

test('explorer marks a condition junction as a condition, never a recorded state', t => {
  const f = workspace(t), graph = f.graphs.graphs[0];
  graph.nodes.push({ id: 'any-active', name: 'Any active booking', kind: 'junction', description: 'Stands for the exact From alternatives in one transition row; not a stored state.', source: { file: booking, heading: 'Transitions', row: 3 } });
  f.write('visuals/assets/graphs.json', f.graphs);
  generateVisuals(f.root, { views: ['explorer'] });
  const object = modelOf(fs.readFileSync(path.join(f.root, 'visuals/pages/states.html'), 'utf8')).objects.find(o => o.id === 'booking');
  const junction = object.nodes.find(n => n.id === 'any-active');
  assert.ok(junction.junction);
  assert.equal(object.nodes.filter(n => !n.junction).length, 6);
});
