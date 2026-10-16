import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
import { generateVisuals } from '../../scripts/generate-visuals.mjs';
import { loadExplorer, renderExplorer } from '../../scripts/lib/system-explorer.mjs';
import { loadGraphs } from '../../scripts/lib/visual-graphs.mjs';
import { buildModel } from '../../scripts/generate-visuals.mjs';
import { explorerFixture } from '../support/explorer-fixture.mjs';

function workspace(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'system-explorer-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return { root, ...explorerFixture(root) };
}
const modelOf = html => JSON.parse(/<script id="explorer-model" type="application\/json">([\s\S]*?)<\/script>/.exec(html)[1]);
const load = root => loadExplorer(root, loadGraphs(root, buildModel(root)));
const booking = 'system-model/contracts/states/state-001-booking.md';
function mutate(t, change, pattern) {
  const f = workspace(t); change(f.explorer, f); f.write('visuals/assets/explorer.json', f.explorer);
  assert.throws(() => load(f.root), pattern);
}
function accepts(t, change) {
  const f = workspace(t); change(f.explorer, f); f.write('visuals/assets/explorer.json', f.explorer);
  return load(f.root);
}

test('the index opens two destinations; each binds every visible fact to its source', t => {
  const { root } = workspace(t);
  assert.deepEqual(generateVisuals(root).generated, ['index.html', 'pages/system.html', 'pages/states.html', 'maps/build-unit-dependencies.html']);
  assert.equal(generateVisuals(root, { check: true }).checked, true);
  const read = f => fs.readFileSync(path.join(root, 'visuals', f), 'utf8');
  const index = read('index.html');
  assert.deepEqual(fs.readdirSync(path.join(root, 'visuals')).filter(f => f.endsWith('.html')), ['index.html']);
  for (const f of ['pages/system.html', 'pages/states.html']) assert.match(read(f), /href="\.\.\/index.html"/);
  assert.match(index, /href="pages\/system.html"[\s\S]*System overview/); assert.match(index, /href="pages\/states.html"[\s\S]*States and transitions/);
  assert.doesNotMatch(index, /explorer-model/, 'the index is a visual entry point, not the explorer');
  for (const f of ['index.html', 'pages/system.html', 'pages/states.html']) assert.doesNotMatch(read(f), /<script[^>]+src=|@import|https?:\/\/(?!www\.w3\.org)/);
  const data = modelOf(read('pages/system.html'));
  assert.deepEqual(modelOf(read('pages/states.html')), data, 'both destinations read the same model');
  assert.equal(data.components.length, 9);
  assert.ok(data.components.every(c => c.exact?.file) && data.connections.every(c => c.exact?.row));
  const object = data.objects.find(o => o.id === 'booking');
  assert.equal(object.nodes.filter(n => n.terminal).map(n => n.outcome).join(','), 'success,expiry,recovery');
  assert.equal(object.start, 'draft'); assert.equal(object.terms[0].term, 'P'); assert.equal(object.exits[0].object, 'escrow-object');
  const fund = object.edges.find(e => e.id === 'fund');
  assert.equal(fund.path, 'main'); assert.equal(fund.label, 'Escrow funded at exact price'); assert.equal(fund.name, 'Escrow funded', 'the exact technical name stays available');
  assert.match(fund.when[0].exact.row.join(' '), /Escrow funded event/); assert.match(fund.when[1].exact.row.join(' '), /Deposit exact price/, 'each condition cites its own record');
  assert.equal(data.objects.some(o => o.id === 'seat-hold'), false, 'an object without a reviewed graph is not a destination');
  for (const [id, route] of Object.entries(data.overview.routes)) {
    const e = data.connections.find(c => c.id === id), a = data.overview.cards[e.from], b = data.overview.cards[e.to];
    const on = (p, r) => (Math.abs(p[0] - r.x) < 1 || Math.abs(p[0] - r.x - r.width) < 1 || Math.abs(p[1] - r.y) < 1 || Math.abs(p[1] - r.y - r.height) < 1);
    assert.ok(on(route[0], a) && on(route[route.length - 1], b), 'route ' + id + ' is attached to both cards');
  }
});

test('explorer fails closed on retired models, invented facts, unexplained symbols and unreadable geometry', t => {
  mutate(t, x => { x.version = 1; }, /version 1 models described component drill-down views/);
  mutate(t, x => { x.components[2].focus = true; }, /Component focus belonged to the retired/);
  mutate(t, x => { x.connections[0].to = 'invented'; }, /distinct declared components/);
  mutate(t, x => { x.components[3].responsibilities[0].id = 'SR-009'; }, /must name SR-009/);
  mutate(t, x => { delete x.objects[0].transitions.fund.effects[0].source; }, /source/);
  mutate(t, x => { x.objects[0].transitions.invented = { path: 'main', short: 'x' }; }, /must name an edge/);
  mutate(t, x => { delete x.objects[0].states.held.gist; }, /needs a short gist/);
  mutate(t, x => { delete x.objects[0].states.issued.outcome; }, /terminal state needs an outcome/);
  mutate(t, x => { x.objects[0].states.held.outcome = 'success'; }, /only terminal states carry an outcome/);
  mutate(t, x => { x.objects[0].transitions.lapse.path = 'sideways'; }, /path must be one of/);
  mutate(t, x => { delete x.objects[0].transitions.refund; }, /every drawn transition needs/);
  mutate(t, x => { x.objects[0].states.paid.gist = 'Held for 15 minutes.'; }, /states "15", which none of its cited records contain/);
  mutate(t, x => { x.objects[0].transitions.issue.when = ['Issued within 10 minutes of payment']; }, /states "10"/);
  mutate(t, x => { x.objects[0].terms = []; }, /relies on the symbol P/);
  mutate(t, x => { delete x.objects[0].transitions.fund.story; }, /Action Escrow funded needs a story/);
  mutate(t, x => { delete x.objects[0].story; }, /Lifecycle booking needs a story/);
  mutate(t, x => { x.objects[0].transitions.fund.story = 'The price arrives within 30 minutes.'; }, /states "30"/);
  mutate(t, x => { x.objects[0].transitions.fund.label = 'Escrow funded with P'; }, /drawn on the diagram as "Escrow funded with P", which relies on the symbol P\. Give it a readable label/);
  mutate(t, x => { x.objects[0].states.held.label = 'Held for X'; }, /drawn on the diagram as "Held for X"/);
  mutate(t, x => { x.objects[0].transitions.lapse.label = 'Escrow funded at exact price'; }, /two actions leave the same state with the label/);
  mutate(t, x => { x.objects[0].transitions.lapse.label = 'Lapses after 30 minutes'; }, /states "30"/);
  mutate(t, x => { x.objects[0].exits[0].object = 'seat-hold'; }, /exit object must have a reviewed state graph/);
  mutate(t, x => { x.objects[2].transitions = {}; }, /without a reviewed state graph[\s\S]*cannot describe transitions/);
  mutate(t, x => { x.components[1].geometry = { ...x.components[0].geometry, y: x.components[0].geometry.y + 20 }; }, /overlap/);
  mutate(t, x => { x.scenarios[0].steps[0].transition = 'deposit'; }, /must belong to its object/);
  mutate(t, x => { x.components[0].name = 'Customer with a much longer name'; }, /name would be cut off; widen the card to at least \d+/);
  mutate(t, (x, f) => { fs.appendFileSync(path.join(f.root, 'system-model/contracts/interfaces/iface-001-booking.md'), '\nChanged.\n'); }, /source changed/);
});

test('a condition may carry its own record, which then backs the numbers it states', t => {
  const input = accepts(t, x => { x.objects[0].transitions.issue.when = [{ text: 'Issued within 10 minutes of payment', source: { file: booking, heading: 'States', row: 2 } }]; });
  assert.match(input.objects[0].transitions.issue.when[0].exact.row.join(' '), /10 minutes/);
});

test('routes stay orthogonal and attached, and each selection has its own clear label slots', t => {
  const { root } = workspace(t), input = load(root), data = modelOf(renderExplorer(input)['pages/system.html']);
  const cards = Object.entries(data.overview.cards).map(([id, c]) => ({ id, ...c })), routes = data.overview.routes;
  for (const [id, pts] of Object.entries(routes)) for (let i = 1; i < pts.length; i++) {
    const [a, b] = [pts[i - 1], pts[i]];
    assert.ok(a[0] === b[0] || a[1] === b[1], id + ' stays orthogonal');
    for (const c of cards) for (let k = 1; k < 20; k++) {
      const p = [a[0] + (b[0] - a[0]) * k / 20, a[1] + (b[1] - a[1]) * k / 20];
      assert.ok(!(p[0] > c.x + 2 && p[0] < c.x + c.width - 2 && p[1] > c.y + 2 && p[1] < c.y + c.height - 2), id + ' passes through ' + c.id);
    }
  }
  const segs = Object.entries(routes).flatMap(([id, pts]) => pts.slice(1).map((q, i) => ({ id, a: pts[i], b: q })));
  for (const s of segs) for (const t of segs) { if (s.id >= t.id || (s.a[0] === s.b[0]) === (t.a[0] === t.b[0])) continue; const [v, h] = s.a[0] === s.b[0] ? [s, t] : [t, s];
    assert.ok(!(v.a[0] > Math.min(h.a[0], h.b[0]) && v.a[0] < Math.max(h.a[0], h.b[0]) && h.a[1] > Math.min(v.a[1], v.b[1]) && h.a[1] < Math.max(v.a[1], v.b[1])), s.id + ' crosses ' + t.id); }
  for (const s of segs) for (const g of data.overview.groups || []) { const v = s.a[0] === s.b[0], at = v ? s.a[0] : s.a[1], lo = Math.min(v ? s.a[1] : s.a[0], v ? s.b[1] : s.b[0]), hi = Math.max(v ? s.a[1] : s.a[0], v ? s.b[1] : s.b[0]);
    const [e0, e1, q0, q1] = v ? [g.x, g.x + g.width, g.y, g.y + g.height] : [g.y, g.y + g.height, g.x, g.x + g.width];
    assert.ok(!(Math.min(Math.abs(at - e0), Math.abs(at - e1)) < 18 && Math.min(hi, q1) - Math.max(lo, q0) > 12), s.id + ' runs beside the ' + g.id + ' outline'); }
  const hit = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  const crosses = (pts, r) => pts.slice(1).some((q, i) => { const p = pts[i]; return Math.max(p[0], q[0]) > r.x + 1 && Math.min(p[0], q[0]) < r.x + r.w - 1 && Math.max(p[1], q[1]) > r.y + 1 && Math.min(p[1], q[1]) < r.y + r.h - 1; });
  for (const c of data.components) {
    const shown = data.connections.filter(e => e.from === c.id || e.to === c.id), slots = data.overview.labels[c.id];
    assert.deepEqual(Object.keys(slots).sort(), shown.map(e => e.id).sort(), 'every connection of ' + c.id + ' has a label slot');
    const boxes = Object.entries(slots);
    for (const [id, s] of boxes) {
      assert.ok(!cards.some(k => hit(s, { x: k.x, y: k.y, w: k.width, h: k.height })), id + ' label covers a card when ' + c.id + ' is selected');
      assert.ok(!boxes.some(([o, b]) => o !== id && hit(s, b)), id + ' label collides with another label of ' + c.id);
      assert.ok(!shown.some(e => e.id !== id && crosses(routes[e.id], s)), id + ' label sits on another route shown with ' + c.id);
    }
  }
});

// a busy card: extra neighbours stacked to the right of the Booking API
function crowd(x, n, hub = 'api') {
  for (let i = 0; i < n; i++) { const id = 'ext' + i; x.components.push({ id, name: 'Neighbour ' + i, kind: 'external', meta: 'Extra', summary: 'An extra neighbour.', source: x.components[7].source, geometry: { x: 1400, y: -400 + i * 110, width: 248, height: 66 } });
    x.connections.push({ id: 'api-' + id, from: hub, to: id, kind: 'request', label: 'Call ' + i, source: x.connections[7].source }); }
}
// renames a component everywhere the fixture refers to it
function rename(x, from, to) {
  x.components.find(c => c.id === from).id = to;
  for (const e of x.connections) { if (e.from === from) e.from = to; if (e.to === from) e.to = to; }
  for (const g of x.groups) g.members = g.members.map(m => m === from ? to : m);
  for (const o of x.objects) { for (const w of o.owners) if (w.component === from) w.component = to; for (const t of Object.values(o.transitions || {})) for (const e of t.effects || []) if (e.component === from) e.component = to; }
}
test('a busy card spreads its routes over other sides before any port reaches a corner, and states the room it needs', t => {
  const input = accepts(t, x => crowd(x, 3)), api = input.components.find(c => c.id === 'api').geometry, ports = [];
  for (const e of input.connections) for (const p of [e.points[0], e.points.at(-1)]) {
    const v = Math.abs(p[0] - api.x) < .5 || Math.abs(p[0] - api.x - api.width) < .5, h = Math.abs(p[1] - api.y) < .5 || Math.abs(p[1] - api.y - api.height) < .5;
    if ((v && p[1] >= api.y && p[1] <= api.y + api.height) || (h && p[0] >= api.x && p[0] <= api.x + api.width)) ports.push({ p, v });
  }
  assert.ok(ports.length >= 9, 'every route of the busy card is attached to it');
  for (const { p, v } of ports) assert.ok(v ? p[1] >= api.y + 14 && p[1] <= api.y + api.height - 14 : p[0] >= api.x + 14 && p[0] <= api.x + api.width - 14, 'no port in a corner: ' + p);
  for (const a of ports) for (const b of ports) if (a !== b && a.v === b.v && (a.v ? a.p[0] === b.p[0] : a.p[1] === b.p[1])) assert.ok(Math.abs(a.v ? a.p[1] - b.p[1] : a.p[0] - b.p[0]) >= 12, 'ports on one side stay a lane apart');
  assert.equal(api.height, 66, 'the card keeps its size');
  const renamed = accepts(t, x => { rename(x, 'api', 'api:v1:edge'); crowd(x, 3, 'api:v1:edge'); });
  assert.ok(renamed.connections.filter(e => e.from === 'api:v1:edge' || e.to === 'api:v1:edge').length >= 9, 'a component id containing colons still routes through the busy-card rebalancing');
  mutate(t, x => crowd(x, 20), /api needs \d+ separate ports on its right side, which holds 4; make it at least \d+px tall or move a neighbour/);
});

test('the construction map links the delivery sequence only once Stage 9 has created it', t => {
  const { root, write } = workspace(t), map = () => fs.readFileSync(path.join(root, 'visuals/maps/build-unit-dependencies.html'), 'utf8');
  generateVisuals(root);
  assert.doesNotMatch(map(), /handoffs|Actual delivery sequence/, 'no link to a sequence that does not exist');
  write('build/workflow/handoffs/README.md', '# Delivery sequence\n');
  assert.throws(() => generateVisuals(root, { check: true }), /Stale source\(s\): build\/workflow\/handoffs\/README\.md/, 'a new sequence makes the map stale');
  generateVisuals(root);
  assert.match(map(), /<a href="\.\.\/\.\.\/build\/workflow\/handoffs\/README\.md">Actual delivery sequence/);
  write('build/workflow/handoffs/README.md', '# Delivery sequence\n\n| Order | Slice |\n');
  assert.equal(generateVisuals(root, { check: true }).checked, true, 'only the presence of the sequence shapes the map');
});

const ticketFile = 'build/workflow/tickets/booking-tickets.yaml';
const tickets = [
  'ticket_file_version: 4', 'scope: "responsibility:SR-001"', '', 'tickets:',
  '  - id: "TICKET-0001"', '    title: "Choose the hold length"', '    status: "todo"', '    owner: "SR-001"', '    affects: ["SR-001"]', '    write_targets: ["system-model/contracts/states/state-001-booking.md"]',
  '  - id: "TICKET-0002"', '    title: "Choose the refund window"', '    status: "decided"', '    owner: "SR-002"', '    affects: ["SR-002"]', '    write_targets: ["system-model/contracts/states/state-001-booking.md"]',
  '  - id: "TICKET-0003"', '    title: "Choose the escrow network fee payer"', '    status: "deferred"', '    owner: "SR-009"', '    affects: ["SR-009"]', '    write_targets: ["system-model/domains/payments/domain.md"]',
  '', 'archived_records:', '  - id: "TICKET-0004"', '    title: "Retired question"', '    status: "todo"', '    owner: "SR-001"', ''].join('\n');
function withTicket(change) {
  return (x, f) => { f.write(ticketFile, tickets); x.sources[ticketFile] = f.sha(ticketFile); x.objects[0].transitions.lapse.story += ' How long the hold lasts is still open (TICKET-0001).'; change(x, f); };
}
test('an open question may name the existing ticket that owns it, and only a ticket that is open and concerns the cited records', t => {
  const open = n => [{ file: ticketFile, ticket: 'TICKET-000' + n }];
  mutate(t, withTicket(() => {}), /names TICKET-0001, which neither its cited records nor its bound open tickets name\. Bind the ticket/);
  const input = accepts(t, withTicket(x => { x.objects[0].transitions.lapse.open = open(1); x.objects[0].states.held.gist = 'Reserved while P is awaited; the hold length is open.'; x.objects[0].states.held.open = open(1); }));
  assert.equal(input.objects[0].transitions.lapse.openRefs[0].ticket, 'TICKET-0001');
  assert.doesNotMatch(renderExplorer(input)['pages/states.html'], /"open":\[\{"file"/, 'traceability stays in the model, not on screen');
  mutate(t, withTicket(x => { x.objects[0].transitions.lapse.open = open(1); delete x.sources[ticketFile]; }), /without a reviewed fingerprint/);
  mutate(t, withTicket(x => { x.objects[0].transitions.lapse.open = open(2); }), /calls TICKET-0002 open, but its status is decided; say what was decided/);
  mutate(t, withTicket(x => { x.objects[0].transitions.lapse.open = open(3); }), /names TICKET-0003, which does not concern the records it cites/);
  mutate(t, withTicket(x => { x.objects[0].transitions.lapse.open = open(4); }), /TICKET-0004, which is not an active ticket/);
  mutate(t, withTicket(x => { x.objects[0].transitions.lapse.open = open(9); }), /TICKET-0009, which is not an active ticket/);
  mutate(t, withTicket(x => { x.objects[0].transitions.lapse.open = [{ file: 'system-model/architecture.md', ticket: 'TICKET-0001' }]; }), /cites an open ticket as/);
  mutate(t, withTicket(x => { x.objects[0].transitions.lapse.open = open(1); x.objects[0].transitions.lapse.story += ' It costs 25 seats.'; }), /states "25"/, 'a ticket backs only its own ID');
  // the digits of a bound ticket ID are an identity, never a quantity
  mutate(t, withTicket(x => { x.objects[0].transitions.lapse.open = open(1); x.objects[0].transitions.lapse.story += ' The hold lasts 0001 minutes.'; }), /story states "0001", which none of its cited records contain/);
  mutate(t, withTicket((x, f) => { f.write(ticketFile, tickets.replace('TICKET-0001', 'TICKET-2024')); x.sources[ticketFile] = f.sha(ticketFile); const l = x.objects[0].transitions.lapse; l.story = l.story.replace('TICKET-0001', 'TICKET-2024') + ' The hold costs 2024 seats.'; l.open = [{ file: ticketFile, ticket: 'TICKET-2024' }]; }), /story states "2024", which none of its cited records contain/);
  mutate(t, withTicket(x => { x.objects[0].states.held.gist = 'Reserved for 0001 minutes.'; x.objects[0].states.held.open = open(1); }), /State gist for Held states "0001"/);
});

test('a lifecycle reads left to right when it fits and top-down when it is long', t => {
  const f = workspace(t), data = modelOf(renderExplorer(load(f.root))['pages/states.html']);
  for (const o of data.objects) {
    assert.equal(o.layouts.narrow.direction, 'DOWN');
    assert.ok(o.layouts.wide.width <= 1100 || o.layouts.wide.direction === 'DOWN', o.id + ' wide layout stays within a readable width');
    for (const n of o.nodes) assert.ok(o.layouts.wide.nodes[n.id], 'state ' + n.id + ' is drawn');
    for (const e of o.edges) assert.ok(o.layouts.wide.edges[e.id].label, 'action ' + e.id + ' has a reserved label place');
  }
});

test('reader enters each destination from the index, inspects a component, a relationship and an action, and returns', { skip: !process.env.VISUAL_PLAYWRIGHT }, async t => {
  const { root } = workspace(t); generateVisuals(root);
  const { chromium } = await import(pathToFileURL(process.env.VISUAL_PLAYWRIGHT));
  const browser = await chromium.launch({ headless: true, ...(process.env.VISUAL_CHROMIUM ? { executablePath: process.env.VISUAL_CHROMIUM } : {}) }); t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 1360, height: 860 } }), errors = [], requests = [];
  page.on('pageerror', e => errors.push(e.message)); page.on('request', r => { if (!r.url().startsWith('file:')) requests.push(r.url()); });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const index = pathToFileURL(path.join(root, 'visuals/index.html')).href;

  await page.goto(index);
  await page.getByRole('link', { name: /System overview/ }).click(); await page.waitForURL(/system\.html/);
  assert.ok(await page.locator('#panel').isHidden(), 'the overview opens on the diagram alone');
  assert.equal(await page.locator('.pill').count(), 0, 'no connection labels until something is selected');
  await page.locator('.card[data-id="api"]').click();
  const panel = await page.locator('#panel').innerText();
  assert.match(panel, /Booking API[\s\S]*Records each booking/);
  assert.match(panel, /Connects with[\s\S]*Booking Web[\s\S]*Escrow Contract/);
  assert.doesNotMatch(panel, /Booking request|Exact ticket price/, 'Connects with lists names only');
  assert.doesNotMatch(panel, /not built|Detailed view|not yet explorable/i, 'no placeholder navigation');
  assert.equal(await page.locator('.pill').count(), 6, 'the selection names what crosses each of its connections');
  await page.locator('#panel').getByRole('button', { name: 'Escrow Contract' }).click();
  await page.waitForFunction(() => location.hash === '#/sel/api/with/escrow');
  assert.match(await page.locator('#panel').innerText(), /Exact ticket price[\s\S]*Funded, released, refunded/, 'the relationship shows what crosses in each direction');
  await page.goBack(); await page.waitForFunction(() => location.hash === '#/sel/api');
  await page.keyboard.press('Escape'); await page.waitForFunction(() => !location.hash.includes('sel'));
  await page.locator('.card[data-id="api"]').focus(); await page.keyboard.press('Enter');
  await page.waitForFunction(() => location.hash === '#/sel/api');
  await page.locator('#panel').getByRole('link', { name: /Booking/ }).click(); await page.waitForURL(/states\.html#\/o\/booking/);

  await page.goto(index);
  await page.getByRole('link', { name: /States and transitions/ }).click(); await page.waitForURL(/states\.html/);
  const side = await page.locator('#side').innerText();
  assert.match(side, /Lifecycles[\s\S]*Booking[\s\S]*Escrow[\s\S]*One booking follows one seat request[\s\S]*exact ticket price \(P\)/, 'the sidebar tells the lifecycle as a story, introducing its symbol by role');
  assert.doesNotMatch(side, /Kept by|Sources|Symbols in the details/, 'no ownership list, source list or glossary in the sidebar');
  assert.ok(await page.locator('#legend').isHidden(), 'the key starts folded');
  assert.ok(await page.locator('#side-body').evaluate(b => !!(b.compareDocumentPosition(document.querySelector('.side-key')) & Node.DOCUMENT_POSITION_FOLLOWING)), 'the key comes after the explanation');
  await page.locator('.side-key summary').click();
  assert.match(await page.locator('#legend').innerText(), /Start[\s\S]*Main path[\s\S]*Expiry[\s\S]*Recovery[\s\S]*Final state[\s\S]*Continues elsewhere[\s\S]*Action[\s\S]*State/);
  assert.notEqual(await page.locator('.tr.main .lbl rect').first().evaluate(n => getComputedStyle(n).fill), await page.locator('.st rect.box').first().evaluate(n => getComputedStyle(n).fill), 'actions read differently from states');
  assert.doesNotMatch(await page.locator('#scene').textContent(), /seat is reserved while|Customer · seat|Escrow · before/, 'meanings and who/when lines open on selection');
  assert.ok(await page.locator('.st').count() >= 6 && await page.locator('.tr .lbl').count() === 5, 'the whole lifecycle is drawn with its actions');
  const clear = async () => { const boxes = await page.evaluate(() => [...document.querySelectorAll('#side,#side-open,.zoom,#panel,#tour')].filter(n => n.offsetParent || getComputedStyle(n).position === 'fixed' && !n.hidden).map(n => n.getBoundingClientRect())); const parts = await page.evaluate(() => [...document.querySelectorAll('#scene .st,#scene .lbl,#scene circle.start')].map(n => n.getBoundingClientRect()).filter(r => r.right > 0 && r.bottom > 0 && r.left < innerWidth && r.top < innerHeight)); return parts.filter(p => boxes.some(b => p.left < b.right && b.left < p.right && p.top < b.bottom && b.top < p.bottom)).length; };
  assert.equal(await clear(), 0, 'the opening view keeps the diagram clear of the sidebar and zoom');
  const startDot = await page.locator('circle.start').boundingBox();
  assert.ok(startDot && startDot.x >= 0 && startDot.y >= 0 && startDot.x + startDot.width <= 1360 && startDot.y + startDot.height <= 860, 'the lifecycle opens on its beginning');
  const zoomBox = await page.locator('.zoom').boundingBox();
  assert.ok(zoomBox.x > 1360 - 260 && zoomBox.y > 860 - 80, 'zoom sits in the bottom-right corner');
  await page.locator('#side-close').click(); assert.ok(await page.locator('#side').isHidden(), 'the sidebar folds away');
  await page.locator('#side-open').click(); assert.ok(await page.locator('#side').isVisible());
  await page.locator('.tr .lbl', { hasText: 'Escrow funded at exact price' }).click();
  await page.waitForFunction(() => location.hash === '#/o/booking/t/fund');
  const action = await page.locator('#panel').innerText();
  assert.match(action, /Held → Paid\s*The escrow contract reports that the exact ticket price \(P\) arrived/, 'an action reads as a short explanation');
  assert.doesNotMatch(action, /Who acts|Requires|Sources|\d\s*$/m, 'no form-like headings, citation marks or source list on screen');
  await page.locator('#panel details.more summary').click();
  assert.match(await page.locator('#panel').innerText(), /Conditions[\s\S]*Exactly P arrives before the hold expires[\s\S]*exact amount only[\s\S]*Symbols[\s\S]*P[\s\S]*exact ticket price/, 'the exact conditions stay one click away');
  await page.locator('#panel').getByRole('link', { name: /Show Escrow Contract/ }).click(); await page.waitForURL(/system\.html#\/sel\/escrow/);
  await page.goBack(); await page.waitForURL(/states\.html#\/o\/booking\/t\/fund/);
  await page.keyboard.press('Escape'); await page.waitForFunction(() => location.hash === '#/o/booking');
  await page.locator('.st[data-id="paid"]').focus(); await page.keyboard.press('Enter');
  await page.waitForFunction(() => location.hash === '#/o/booking/s/paid');
  assert.match(await page.locator('#panel').innerText(), /Next[\s\S]*Issue ticket[\s\S]*Payment held in escrow[\s\S]*Reached by[\s\S]*Escrow funded at exact price/);
  // framing the state with its neighbours folds the sidebar for now; one click brings it back
  if (await page.locator('#side').isHidden()) await page.locator('#side-open').click();
  await page.locator('#side .lives a', { hasText: 'Escrow' }).click(); await page.waitForFunction(() => location.hash === '#/o/escrow-object');

  await page.locator('#tour-btn').click(); await page.locator('[data-tour="paid-booking"]').click();
  assert.match(await page.locator('#tour').innerText(), /not live state[\s\S]*Step 1 of 5/);
  await page.locator('#tour-next').click(); await page.waitForURL(/system\.html#.*scenario\/paid-booking\/1/);
  assert.match(await page.locator('#tour-count').innerText(), /Step 2 of 5/, 'a tour continues across destinations');
  await page.keyboard.press('Escape'); assert.ok(await page.locator('#tour').isHidden(), 'Escape ends the tour');

  await page.setViewportSize({ width: 390, height: 844 });
  // on a phone a busy selection cannot fit whole at a readable size: the selected item stays clear of every control at the
  // readable floor, and the panel links each neighbour instead
  for (const [f, sel] of [['pages/system.html#/sel/api', '.card[data-id="api"]'], ['pages/states.html#/o/booking/t/fund', '.tr[data-id="fund"] .lbl'], ['pages/states.html#/o/booking/s/paid', '.st[data-id="paid"]']]) {
    await page.goto(pathToFileURL(path.join(root, 'visuals', f.split('#')[0])).href + '#' + f.split('#')[1]); await page.waitForTimeout(200);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no page-wide horizontal scroll on a phone: ' + f);
    assert.ok(await page.locator('#panel').isVisible());
    const seen = await page.evaluate(q => { const b = document.querySelector(q).getBoundingClientRect(), s = document.getElementById('scene'), scale = s.clientWidth / s.viewBox.baseVal.width;
      const covered = [...document.querySelectorAll('#panel,.zoom,#side-open')].filter(n => !n.hidden).map(n => n.getBoundingClientRect()).some(r => b.left < r.right && r.left < b.right && b.top < r.bottom && r.top < b.bottom);
      const controls = [...document.querySelectorAll('.zoom,#side-open')].filter(n => !n.hidden && getComputedStyle(n).display !== 'none').map(n => n.getBoundingClientRect());
      const under = [...document.querySelectorAll('#scene .card:not(.dim), #scene .st:not(.dim)')].map(n => n.getBoundingClientRect()).filter(p => controls.some(r => p.left < r.right && r.left < p.right && p.top < r.bottom && r.top < p.bottom)).length;
      return { scale, on: b.left >= 0 && b.right <= innerWidth && b.top >= 0 && b.bottom <= innerHeight, covered, under }; }, sel);
    assert.equal(seen.under, 0, 'a neighbour the view cuts off is not left beneath a control: ' + f);
    assert.ok(seen.on && !seen.covered, 'the selected item is on screen and clear of the panel and controls: ' + f);
    assert.ok(seen.scale >= 0.72 * 0.97, 'a selection never shrinks text below the readable floor: ' + f + ' at ' + seen.scale.toFixed(2));
  }
  assert.match(await page.locator('#panel').innerText(), /Next[\s\S]*Issue ticket[\s\S]*Refund on cancellation[\s\S]*Payment held in escrow[\s\S]*Reached by[\s\S]*Escrow funded/, 'the panel reaches every neighbour of a state');
  for (const f of ['pages/system.html', 'pages/states.html']) {
    await page.goto(pathToFileURL(path.join(root, 'visuals', f)).href); await page.waitForTimeout(200);
    assert.ok(await page.evaluate(() => { const z = document.querySelector('.zoom').getBoundingClientRect(); return ![...document.querySelectorAll('#scene .card, #scene .st, #scene .lbl, #scene .exit')].some(n => { const b = n.getBoundingClientRect(); return b.left < z.right + 4 && z.left - 4 < b.right && b.top < z.bottom + 4 && z.top - 4 < b.bottom; }); }), 'nothing opens under the zoom control on a phone: ' + f);
  }
  await page.goto(pathToFileURL(path.join(root, 'visuals/pages/states.html')).href); await page.waitForTimeout(200);
  assert.ok(await page.locator('#side').isHidden(), 'on a phone the sidebar starts folded');
  await page.locator('#side-open').click(); const sideBox = await page.locator('#side').boundingBox();
  assert.ok(sideBox.x >= 0 && sideBox.x + sideBox.width <= 390, 'the sidebar fits a phone screen');
  await page.keyboard.press('Escape'); assert.ok(await page.locator('#side').isHidden(), 'Escape folds the sidebar on a phone');
  assert.deepEqual(errors, []); assert.deepEqual(requests, []);
});

test('a neutral final state reads Ends once, while other outcomes keep their word', { skip: !process.env.VISUAL_PLAYWRIGHT }, async t => {
  const f = workspace(t); f.explorer.objects[0].states.refunded.outcome = 'neutral'; f.write('visuals/assets/explorer.json', f.explorer); generateVisuals(f.root);
  const { chromium } = await import(pathToFileURL(process.env.VISUAL_PLAYWRIGHT));
  const browser = await chromium.launch({ headless: true, ...(process.env.VISUAL_CHROMIUM ? { executablePath: process.env.VISUAL_CHROMIUM } : {}) }); t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 1360, height: 860 } }); await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(pathToFileURL(path.join(f.root, 'visuals/pages/states.html')).href + '#/o/booking/s/refunded'); await page.waitForTimeout(200);
  const refunded = page.locator('.st[data-id="refunded"]');
  assert.equal(await refunded.locator('.tag').textContent(), 'Ends'); assert.ok(await refunded.evaluate(n => n.classList.contains('neutral')), 'the neutral styling is kept');
  assert.equal(await refunded.getAttribute('aria-label'), 'Final state: Refunded');
  assert.equal((await page.locator('#panel .eyebrow').first().textContent()).trim(), 'Final state');
  assert.equal(await page.locator('.st[data-id="issued"] .tag').textContent(), 'Ends · Completed');
  assert.equal(await page.locator('.st[data-id="issued"]').getAttribute('aria-label'), 'Final state, completed: Issued');
});

// a recorded terminal state whose permanence an open ticket still decides
const terminalTickets = 'build/workflow/tickets/terminal-tickets.yaml';
function unresolvedTerminal(ticket, change = () => {}) {
  return (x, f) => {
    f.write(terminalTickets, ['ticket_file_version: 4', 'scope: "responsibility:SR-003"', '', 'tickets:',
      '  - id: "TICKET-0011"', '    title: "Decide whether a refund can be reopened"', '    status: "todo"', '    owner: "SR-003"', '    affects: ["SR-003"]', '    write_targets: ["system-model/contracts/states/state-001-booking.md"]',
      '  - id: "TICKET-0012"', '    title: "Decided refund reopening"', '    status: "finished"', '    owner: "SR-003"', '    affects: ["SR-003"]', '    write_targets: ["system-model/contracts/states/state-001-booking.md"]',
      '  - id: "TICKET-0013"', '    title: "Choose the escrow fee payer"', '    status: "todo"', '    owner: "SR-009"', '    affects: ["SR-009"]', '    write_targets: ["system-model/domains/payments/domain.md"]',
      '  - id: "TICKET-0014"', '    title: "Choose the seat hold audit trail"', '    status: "todo"', '    owner: "SR-001"', '    affects: ["SR-001", "SR-002"]', '    write_targets: ["system-model/domains/booking/domain.md"]', ''].join('\n'));
    x.sources[terminalTickets] = f.sha(terminalTickets);
    const refunded = x.objects[0].states.refunded; delete refunded.outcome; refunded.terminalUnresolved = { open: [{ file: terminalTickets, ticket: ticket }] };
    change(x, refunded);
  };
}
test('a recorded terminal state may declare its terminal status unresolved, bound to the open ticket tied to its record', t => {
  const input = accepts(t, unresolvedTerminal('TICKET-0011')), data = modelOf(renderExplorer(input)['pages/states.html']), nodes = data.objects.find(o => o.id === 'booking').nodes;
  const refunded = nodes.find(n => n.id === 'refunded'), issued = nodes.find(n => n.id === 'issued');
  assert.equal(refunded.terminal, true, 'the recorded terminal value is kept'); assert.equal(refunded.terminalUnresolved, true); assert.equal(refunded.outcome, null);
  assert.match(refunded.exact.row.join(' '), /Refunded/, 'the source binding is kept');
  assert.deepEqual([issued.terminal, issued.terminalUnresolved, issued.outcome], [true, false, 'success'], 'established terminal states are unchanged');
  mutate(t, unresolvedTerminal('TICKET-0011', (x, s) => { s.outcome = 'recovery'; }), /terminal status is unresolved carries no outcome/);
  mutate(t, unresolvedTerminal('TICKET-0011', (x, s) => { s.terminalUnresolved = {}; }), /terminalUnresolved needs open/);
  mutate(t, unresolvedTerminal('TICKET-0011', (x, s) => { x.objects[0].states.held.terminalUnresolved = s.terminalUnresolved; }), /applies only to a state its record marks terminal/);
  mutate(t, unresolvedTerminal('TICKET-0012'), /calls TICKET-0012 open, but its status is finished/);
  mutate(t, unresolvedTerminal('TICKET-0013'), /TICKET-0013, which is not tied to system-model\/contracts\/states\/state-001-booking\.md/);
  mutate(t, unresolvedTerminal('TICKET-0014'), /TICKET-0014, which is not tied to/, 'sharing a responsibility is not enough for this claim');
  mutate(t, unresolvedTerminal('TICKET-0019'), /TICKET-0019, which is not an active ticket/);
  mutate(t, unresolvedTerminal('TICKET-0011', x => { delete x.sources[terminalTickets]; }), /without a reviewed fingerprint/);
});

// rewrite the booking record and deliberately re-review its fingerprint, so the Terminal parser alone decides
function reviewedRecord(t, change, explorerChange = () => {}) {
  const f = workspace(t), file = path.join(f.root, booking);
  fs.writeFileSync(file, change(fs.readFileSync(file, 'utf8')));
  explorerChange(f.explorer, f);
  f.graphs.sources[booking] = f.sha(booking); f.explorer.sources[booking] = f.sha(booking);
  f.write('visuals/assets/graphs.json', f.graphs); f.write('visuals/assets/explorer.json', f.explorer);
  return f;
}
const cell = (state, from, to) => s => { const row = s.split('\n').find(l => l.startsWith('| ' + state + ' |')); assert.ok(row.endsWith('| ' + from + ' |')); return s.replace(row, row.slice(0, -from.length - 2) + to + ' |'); };
test('Terminal is exactly Yes or No, read once from the record so validation and rendering cannot disagree', t => {
  const f = workspace(t), input = load(f.root), data = modelOf(renderExplorer(input)['pages/states.html']);
  const booked = data.objects.find(o => o.id === 'booking').nodes;
  assert.deepEqual(booked.map(n => [n.id, n.terminal, n.outcome]), [['draft', false, null], ['held', false, null], ['paid', false, null], ['issued', true, 'success'], ['expired', true, 'expiry'], ['refunded', true, 'recovery']]);
  for (const object of input.objects.filter(o => o.graph)) {
    const validated = input.graphs.get(object.graph).nodes.map(n => [n.id, n.terminal]);
    assert.deepEqual(data.objects.find(o => o.id === object.id).nodes.map(n => [n.id, n.terminal]), validated, 'the page draws the value validation checked: ' + object.id);
  }
  const rejects = (change, pattern, explorerChange) => { const g = reviewedRecord(t, change, explorerChange); assert.throws(() => generateVisuals(g.root), pattern); };
  rejects(cell('Issued', 'Yes', 'Yesterday'), /state-001-booking\.md: state table under "States", row 4 \(Issued\): Terminal must be exactly Yes or No, found "Yesterday"/);
  rejects(cell('Held', 'No', 'Sí'), /row 2 \(Held\): Terminal must be exactly Yes or No, found "Sí"\. Write conditions, qualifications and reopening rules in Meaning/);
  rejects(cell('Held', 'No', ''), /row 2 \(Held\): Terminal must be exactly Yes or No, found a blank cell/);
  rejects(cell('Held', 'No', 'yes'), /row 2 \(Held\): Terminal must be exactly Yes or No, found "yes"/);
  rejects(cell('Refunded', 'Yes', 'Yes, unless reopened on appeal'), /row 6 \(Refunded\): Terminal must be exactly Yes or No, found "Yes, unless reopened on appeal"/);
  rejects(cell('Paid', 'No', 'No; reopened with a reason'), /row 3 \(Paid\): Terminal must be exactly Yes or No/);
  rejects(s => s.replace('| State | Meaning | Terminal |', '| State | Meaning | Final |'), /state-001-booking\.md: state table under "States" has no Terminal column; a state table needs exactly one Terminal column/);
  rejects(s => s.replace('| State | Meaning | Terminal |\n| --- | --- | --- |', '| State | Meaning | Terminal | Terminal |\n| --- | --- | --- | --- |').replace(/^(\| [A-Z][a-z]+ \| [^|]+ \| (?:Yes|No) \|)$/gm, '$1 No |'), /has 2 Terminal columns/);
  // rows and tables this lifecycle does not draw are still canonical states
  rejects(s => s.replace('| Refunded | Payment returned before issue. | Yes |\n', '| Refunded | Payment returned before issue. | Yes |\n| Archived | Kept for audit. | Maybe |\n'), /row 7 \(Archived\): Terminal must be exactly Yes or No, found "Maybe"/);
  rejects(s => s + '## Seat states\n| Seat state | Meaning |\n| --- | --- |\n| Free | Nobody holds it. |\n', /state table under "Seat states" has no Terminal column/);
  rejects(s => s + '## Seat states\n| Seat state | Meaning | Terminal |\n| --- | --- | --- |\n| Free | Nobody holds it. | No |\n## Seat states\n| Seat state | Meaning | Terminal |\n| --- | --- | --- |\n| Sold | Kept by a buyer. | Sí |\n', /state table under "Seat states" \(table 2 under that heading\), row 1 \(Sold\): Terminal must be exactly Yes or No, found "Sí"/);
  // an unresolved terminal status still starts from a recorded Yes, never from a qualified cell
  rejects(cell('Refunded', 'Yes', 'Yes, unless reopened'), /row 6 \(Refunded\): Terminal must be exactly Yes or No/, unresolvedTerminal('TICKET-0011'));
  const unrelated = reviewedRecord(t, s => s + '## Decision Attribution\n| Decision | Origin |\n| --- | --- |\n| Hold length | Yesterday |\n');
  assert.deepEqual(generateVisuals(unrelated.root).generated, ['index.html', 'pages/system.html', 'pages/states.html', 'maps/build-unit-dependencies.html'], 'a table that does not name states is not read for Terminal values');
  const page = modelOf(fs.readFileSync(path.join(unrelated.root, 'visuals/pages/states.html'), 'utf8')).objects.find(o => o.id === 'booking').nodes;
  assert.deepEqual(page.filter(n => n.terminal).map(n => n.id), ['issued', 'expired', 'refunded'], 'the generated page draws the recorded final states');
});

test('an unresolved terminal status is drawn as neither an ending nor an ordinary state, and the record stays readable', { skip: !process.env.VISUAL_PLAYWRIGHT }, async t => {
  const f = workspace(t); unresolvedTerminal('TICKET-0011')(f.explorer, f); f.write('visuals/assets/explorer.json', f.explorer); generateVisuals(f.root);
  const { chromium } = await import(pathToFileURL(process.env.VISUAL_PLAYWRIGHT));
  const browser = await chromium.launch({ headless: true, ...(process.env.VISUAL_CHROMIUM ? { executablePath: process.env.VISUAL_CHROMIUM } : {}) }); t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 1360, height: 860 } }), errors = []; page.on('pageerror', e => errors.push(e.message)); await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(pathToFileURL(path.join(f.root, 'visuals/pages/states.html')).href + '#/o/booking/s/refunded'); await page.waitForTimeout(200);
  const refunded = page.locator('.st[data-id="refunded"]'), issued = page.locator('.st[data-id="issued"]');
  assert.deepEqual(await refunded.evaluate(n => [n.classList.contains('end'), n.classList.contains('unresolved'), n.querySelectorAll('rect.inner').length]), [false, true, 0], 'no final outline');
  assert.equal((await refunded.locator('.tag').allTextContents()).join(' '), 'Terminal status unresolved');
  assert.ok(await refunded.evaluate(n => { const box = n.querySelector('rect.box').getBBox(); return [...n.querySelectorAll('text')].every(t => { const r = t.getBBox(); return r.x >= box.x && r.x + r.width <= box.x + box.width && r.y >= box.y && r.y + r.height <= box.y + box.height; }); }), 'the tag and the name fit inside the state');
  assert.equal(await refunded.getAttribute('aria-label'), 'State, terminal status unresolved: Refunded');
  const panel = await page.locator('#panel').innerText();
  assert.match(panel, /State · terminal status unresolved\s+Refunded/i); assert.match(panel, /Terminal status\s+Its record marks this state terminal\. Whether it stays final is still being decided/);
  assert.doesNotMatch(panel, /Final state|Ends ·|Completed|Recovered|finality/i);
  await page.locator('#panel summary', { hasText: 'Recorded wording' }).click();
  assert.match(await page.locator('#panel details.more').innerText(), /Recorded as terminal Yes/);
  assert.deepEqual(await issued.evaluate(n => [n.classList.contains('end'), n.querySelectorAll('rect.inner').length, n.querySelector('.tag').textContent]), [true, 1, 'Ends · Completed'], 'an established terminal state is unchanged');
  assert.match(await page.locator('#legend').textContent(), /Final state/, 'the key still explains the established final states');
  assert.deepEqual(errors, []);
});
