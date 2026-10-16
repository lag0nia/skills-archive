import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { packageFile, resolveGraphSource, mentionsIdentity, calculateLayouts, wrapLabel } from './visual-graphs.mjs';
import { renderPages } from './explorer-pages.mjs';

// The visual explorer has two destinations behind a small index: the system overview (what runs, what each part does,
// how parts connect) and states and transitions (how each recorded object changes, what triggers it, under which
// conditions). Every visible fact cites a canonical row, field or section; layout and motion are presentation only.

const sha = value => createHash('sha256').update(value).digest('hex');
const plain = value => String(value ?? '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[`*_]/g, '').trim();
export const COMPONENT_KINDS = ['person', 'application', 'service', 'worker', 'contract', 'store', 'external', 'network'];
export const CONNECTION_KINDS = ['request', 'command', 'event', 'transfer'];
export const PATH_KINDS = ['main', 'alternative', 'expiry', 'failure', 'recovery'];
export const OUTCOMES = ['success', 'expiry', 'failure', 'recovery', 'neutral'];
const CARD = { width: 232, height: 66 };

function fail(message) { throw Error('System explorer: ' + message); }
function unique(items, label) {
  const ids = new Set();
  for (const item of items || []) { if (!item?.id || ids.has(item.id)) fail(label + ' need unique identities.'); ids.add(item.id); }
  return ids;
}
function text(value, label, max) {
  if (typeof value !== 'string' || !value.trim()) fail(label + ' is required.');
  if (max && value.length > max) fail(label + ' must stay within ' + max + ' characters so it reads on the canvas: ' + value);
  return value.trim();
}
const sourceText = exact => plain(exact?.row ? exact.row.join(' ') : exact?.text || '');
// A number shown to the reader must appear in a cited record; a single-letter symbol must be explained as a term first.
// Ticket IDs are identities, not quantities: one named in the text must be named by a cited record or bound through open,
// and the digits of any ticket ID, in the text or the records, never back a number.
const TICKET_ID = /(?<![\w-])TICKET-\d{4}(?![\w-])/g;
function numbersBacked(value, exacts, label) {
  const cited = exacts.filter(Boolean), records = cited.filter(e => !e.ticket).map(sourceText).join(' ');
  const named = new Set([...(records.match(TICKET_ID) || []), ...cited.filter(e => e.ticket).map(e => e.ticket)]);
  for (const id of String(value).match(TICKET_ID) || []) if (!named.has(id)) fail(label + ' names ' + id + ', which neither its cited records nor its bound open tickets name. Bind the ticket that owns the open question through open, or remove it: ' + value);
  const corpus = records.replace(TICKET_ID, ' ');
  for (const n of String(value).replace(TICKET_ID, ' ').match(/\d+(?:\.\d+)?/g) || []) if (!new RegExp('(?<![\\d.])' + n.replace('.', '\\.') + '(?![\\d])').test(corpus)) fail(label + ' states "' + n + '", which none of its cited records contain. Cite the record that owns it (a condition or actor may carry its own source) or remove it: ' + value);
}
// Labels drawn on the diagram are read before any glossary, so they carry no single-letter symbols at all.
function readableOnCanvas(value, label) {
  const found = String(value).match(/(?<![\w'’-])[B-HJ-Z](?![\w'’-])/g);
  if (found) fail(label + ' is drawn on the diagram as "' + value + '", which relies on the symbol ' + found[0] + '. Give it a readable label a reader can follow without a glossary; the recorded name and the symbol stay in the details panel.');
}
// A question the records leave open may be named for the reader through `open`: each entry binds the existing ticket that owns
// it. The ticket must be active and unresolved and must concern a record the text already cites; only its ID may then be
// named, and the reference never backs a number.
const OPEN_STATUSES = ['todo', 'deferred'];
function ticketRecord(root, ref, label) {
  const text = fs.readFileSync(packageFile(root, ref.file), 'utf8'), active = (/^tickets:\s*$([\s\S]*?)(?=^archived_records:\s*$|(?![\s\S]))/m.exec(text) || [])[1] || '';
  const block = new RegExp('^  - id:\\s*"' + ref.ticket + '"\\s*$([\\s\\S]*?)(?=^  - id:|(?![\\s\\S]))', 'm').exec(active);
  if (!block) fail(label + ' names ' + ref.ticket + ', which is not an active ticket in ' + ref.file + '.');
  const fields = {};
  for (const line of block[1].split('\n')) { const m = /^    ([a-z_]+):\s*(.+?)\s*$/.exec(line); if (m) { try { fields[m[1]] = JSON.parse(m[2]); } catch { fields[m[1]] = m[2]; } } }
  return fields;
}
// tied: the ticket must be bound to the cited record itself (the record names it or it writes to that record), not only share a responsibility
function openTickets(refs, cited, root, input, label, tied = false) {
  if (refs === undefined) return [];
  if (!Array.isArray(refs) || !refs.length) fail(label + ' open lists the tickets that own its open questions.');
  const exacts = cited.filter(Boolean), files = new Set(exacts.map(e => e.file));
  return refs.map(ref => {
    if (!/^TICKET-\d{4}$/.test(ref?.ticket || '') || !/^build\/workflow\/tickets\/.+\.yaml$/.test(ref?.file || '')) fail(label + ' cites an open ticket as { "file": "build/workflow/tickets/<file>.yaml", "ticket": "TICKET-NNNN" }: ' + JSON.stringify(ref));
    if (!input.sources[ref.file]) fail(label + ' cites ' + ref.file + ' without a reviewed fingerprint in sources.');
    const t = ticketRecord(root, ref, label);
    if (!OPEN_STATUSES.includes(t.status)) fail(label + ' calls ' + ref.ticket + ' open, but its status is ' + t.status + '; ' + (t.status === 'out-of-scope' ? 'it is excluded from this release, so say so instead.' : 'say what was decided, citing the record that now owns it.'));
    const owners = [t.owner, ...(t.affects || [])].filter(Boolean), authority = [...files].map(f => /^authority:\s*(.+)$/m.exec(fs.readFileSync(packageFile(root, f), 'utf8'))?.[1] || '').join(' ');
    const bound = (t.write_targets || []).some(f => files.has(f)) || [...files].some(f => mentionsIdentity(fs.readFileSync(packageFile(root, f), 'utf8'), ref.ticket));
    if (tied && !bound) fail(label + ' names ' + ref.ticket + ', which is not tied to ' + [...files].join(', ') + ': that record must name the ticket or the ticket must write to it.');
    const concerns = bound
      || owners.some(id => mentionsIdentity(exacts.map(e => e.row ? e.row.join(' ') : e.text).join(' ') + ' ' + authority, id));
    if (!concerns) fail(label + ' names ' + ref.ticket + ', which does not concern the records it cites: its write targets, owner and affected responsibilities match none of them.');
    return { file: ref.file, ticket: ref.ticket };
  });
}
function symbolsExplained(value, terms, label) {
  for (const s of String(value).match(/(?<![\w'’-])[B-HJ-Z](?![\w'’-])/g) || []) if (!terms.has(s)) fail(label + ' relies on the symbol ' + s + '; explain it in the object\'s terms before using it: ' + value);
}

// ---------- system overview geometry: routes, label slots and local spacing ----------
const inside = (p, r, pad = 0) => p[0] > r.x + pad && p[0] < r.x + r.width - pad && p[1] > r.y + pad && p[1] < r.y + r.height - pad;
function onSide(p, r) {
  const corner = 10, near = (a, b) => Math.abs(a - b) < 0.5;
  const horizontal = (near(p[1], r.y) || near(p[1], r.y + r.height)) && p[0] > r.x + corner && p[0] < r.x + r.width - corner;
  const vertical = (near(p[0], r.x) || near(p[0], r.x + r.width)) && p[1] > r.y + corner && p[1] < r.y + r.height - corner;
  return horizontal || vertical;
}
function segmentCrosses(a, b, r) {
  // orthogonal segments are answered exactly; any other shape is sampled
  if (a[0] === b[0] || a[1] === b[1]) { const v = a[0] === b[0], at = v ? a[0] : a[1], lo = Math.min(v ? a[1] : a[0], v ? b[1] : b[0]), hi = Math.max(v ? a[1] : a[0], v ? b[1] : b[0]);
    const [p0, p1, q0, q1] = v ? [r.x, r.x + r.width, r.y, r.y + r.height] : [r.y, r.y + r.height, r.x, r.x + r.width];
    return at > p0 + 2 && at < p1 - 2 && lo < q1 - 2 && hi > q0 + 2; }
  const steps = Math.max(2, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 4));
  for (let i = 1; i < steps; i++) { const t = i / steps; if (inside([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], r, 2)) return true; }
  return false;
}
const LANE = 12;

// Routes every connection between cards: each leaves and enters a card side perpendicularly, ports are spread along the
// side by the far end's position, and lanes keep LANE apart so parallel routes stay distinguishable. Returns the first
// connection that has no clear route instead of throwing, so spacing can make room for it.
function routeAll(input, thorough = false, tried = new Map()) {
  const cards = Object.fromEntries(input.components.map(c => [c.id, c.geometry])), lanes = [];
  const centre = (r, side) => side === 'right' ? [r.x + r.width, r.y + r.height / 2] : side === 'left' ? [r.x, r.y + r.height / 2] : side === 'bottom' ? [r.x + r.width / 2, r.y + r.height] : [r.x + r.width / 2, r.y];
  const sidePairs = (a, b) => {
    const pairs = [], right = b.x >= a.x + a.width + 24, left = a.x >= b.x + b.width + 24, below = b.y >= a.y + a.height + 24, above = a.y >= b.y + b.height + 24;
    if (right) pairs.push(['right', 'left']); if (left) pairs.push(['left', 'right']); if (below) pairs.push(['bottom', 'top']); if (above) pairs.push(['top', 'bottom']);
    if (right || left) { const h = right ? 'right' : 'left'; if (below) pairs.push([h, 'top'], ['bottom', right ? 'left' : 'right']); if (above) pairs.push([h, 'bottom'], ['top', right ? 'left' : 'right']); }
    pairs.push(['right', 'right'], ['left', 'left'], ['bottom', 'bottom'], ['top', 'top']);
    return pairs;
  };
  const outward = (pts, fs, ts) => {
    const d = (a, b) => [Math.sign(b[0] - a[0]), Math.sign(b[1] - a[1])], want = { right: [1, 0], left: [-1, 0], bottom: [0, 1], top: [0, -1] };
    const first = d(pts[0], pts[1]), last = d(pts[pts.length - 2], pts[pts.length - 1]), w = want[fs], v = want[ts];
    return first[0] === w[0] && first[1] === w[1] && last[0] === -v[0] && last[1] === -v[1];
  };
  const paths = (sides, s, t) => {
    const [fs, ts] = sides, out = [], horizontal = x => x === 'left' || x === 'right';
    if (fs === ts) {
      const dir = fs === 'right' || fs === 'bottom' ? 1 : -1, axis = horizontal(fs) ? 0 : 1, edge = dir > 0 ? Math.max(s[axis], t[axis]) : Math.min(s[axis], t[axis]);
      for (let k = 0; k < 24; k++) { const v = edge + dir * (24 + k * LANE); out.push(axis === 0 ? [s, [v, s[1]], [v, t[1]], t] : [s, [s[0], v], [t[0], v], t]); }
    } else if (horizontal(fs) === horizontal(ts)) {
      const axis = horizontal(fs) ? 0 : 1, other = 1 - axis;
      if (s[other] === t[other]) out.push([s, t]);
      const lo = Math.min(s[axis], t[axis]) + 18, hi = Math.max(s[axis], t[axis]) - 18, mid = (lo + hi) / 2;
      // jogs gather near the card they enter, leaving the open stretch of each route free for its label
      const toward = t[axis] > s[axis] ? -1 : 1;
      for (let k = 0, n = Math.ceil((hi - lo) / LANE) + 1; k < n; k++) { const v = Math.round(t[axis] + toward * (18 + k * LANE)); if (v >= lo && v <= hi) out.push(axis === 0 ? [s, [v, s[1]], [v, t[1]], t] : [s, [s[0], v], [t[0], v], t]); }
    } else {
      out.push(horizontal(fs) ? [s, [t[0], s[1]], t] : [s, [s[0], t[1]], t]);
      // the final pass may also cross over at another height, so a turning route need not run along a card it passes
      if (thorough) { const a = horizontal(fs) ? 0 : 1, b = 1 - a, sd = fs === 'right' || fs === 'bottom' ? 1 : -1, td = ts === 'right' || ts === 'bottom' ? 1 : -1;
        for (let k = 0; k < 12; k++) { const v = s[a] + sd * (18 + k * 2 * LANE); if ((t[a] - v) * sd < 18) break;
          for (let j = 0; j < 4; j++) { const w = t[b] + td * (18 + j * LANE), m = [0, 0], n = [0, 0]; m[a] = v; m[b] = s[b]; n[a] = v; n[b] = w; const o = [0, 0]; o[a] = t[a]; o[b] = w; out.push([s, m, n, o, t]); } } }
    }
    return out.filter(pts => pts.every((q, i) => !i || q[0] === pts[i - 1][0] || q[1] === pts[i - 1][1]) && outward(pts, fs, ts));
  };
  // a route neither passes through a card nor runs along its edge, where it would read as the card's border
  const alongEdge = (a, b, r, m) => { const v = a[0] === b[0], at = v ? a[0] : a[1], lo = Math.min(v ? a[1] : a[0], v ? b[1] : b[0]), hi = Math.max(v ? a[1] : a[0], v ? b[1] : b[0]);
    const [p0, p1, q0, q1] = v ? [r.x, r.x + r.width, r.y, r.y + r.height] : [r.y, r.y + r.height, r.x, r.x + r.width];
    return at > p0 - m && at < p1 + m && lo < q1 - 2 && hi > q0 + 2; };
  const cardClear = pts => { for (let i = 1; i < pts.length; i++) for (const c of input.components) if (segmentCrosses(pts[i - 1], pts[i], cards[c.id]) || alongEdge(pts[i - 1], pts[i], cards[c.id], 8)) return false; return true; };
  // close alongside a card it does not connect, a route still reads as that card's border: avoided where another route exists
  // likewise a route running close beside a group outline reads as a doubled border
  const outlines = (input.groups || []).map(g => g.geometry).filter(Boolean);
  const alongOutline = (a, b, g) => { const v = a[0] === b[0], at = v ? a[0] : a[1], lo = Math.min(v ? a[1] : a[0], v ? b[1] : b[0]), hi = Math.max(v ? a[1] : a[0], v ? b[1] : b[0]);
    const [e0, e1, q0, q1] = v ? [g.x, g.x + g.width, g.y, g.y + g.height] : [g.y, g.y + g.height, g.x, g.x + g.width];
    return (Math.abs(at - e0) < LANE + 6 || Math.abs(at - e1) < LANE + 6) && Math.min(hi, q1) - Math.max(lo, q0) > LANE; };
  const hugs = (pts, e, outlined = thorough) => { let n = 0; for (let i = 1; i < pts.length; i++) { for (const c of input.components) if (c.id !== e.from && c.id !== e.to && alongEdge(pts[i - 1], pts[i], cards[c.id], 2 * LANE)) n++; if (outlined) for (const g of outlines) if (alongOutline(pts[i - 1], pts[i], g)) n++; } return n; };
  const laneClear = (pts, self) => {
    for (let i = 1; i < pts.length; i++) { const [a, b] = [pts[i - 1], pts[i]];
      for (const l of lanes) if (l.id !== self && (a[0] === b[0] ? l.vertical && Math.abs(l.at - a[0]) < LANE - 1 && Math.min(a[1], b[1]) < l.hi && Math.max(a[1], b[1]) > l.lo : !l.vertical && Math.abs(l.at - a[1]) < LANE - 1 && Math.min(a[0], b[0]) < l.hi && Math.max(a[0], b[0]) > l.lo)) return false; }
    return true;
  };
  // the longest part of a segment with no parallel route within label distance: where this route's label can sit
  const openStretch = pts => Math.max(0, ...pts.slice(1).map((b, i) => {
    const a = pts[i], vertical = a[0] === b[0], at = vertical ? a[0] : a[1], lo = Math.min(vertical ? a[1] : a[0], vertical ? b[1] : b[0]), hi = Math.max(vertical ? a[1] : a[0], vertical ? b[1] : b[0]);
    const blocked = lanes.filter(l => l.vertical === vertical && Math.abs(l.at - at) < 48 && l.lo < hi && l.hi > lo).map(l => [Math.max(lo, l.lo), Math.min(hi, l.hi)]).sort((x, y) => x[0] - y[0]);
    let longest = 0, from = lo; for (const [x, y] of blocked) { longest = Math.max(longest, x - from); from = Math.max(from, y); } return Math.max(longest, hi - from);
  }));
  // how many times a route would cross routes already drawn; two routes between the same cards never need to cross
  const crossings = (pts, self) => {
    let n = 0;
    for (let i = 1; i < pts.length; i++) { const [a, b] = [pts[i - 1], pts[i]], vertical = a[0] === b[0], at = vertical ? a[0] : a[1], lo = Math.min(vertical ? a[1] : a[0], vertical ? b[1] : b[0]), hi = Math.max(vertical ? a[1] : a[0], vertical ? b[1] : b[0]);
      for (const l of lanes) if (l.id !== self && l.vertical !== vertical && at > l.lo && at < l.hi && l.at > lo && l.at < hi) n++; }
    return n;
  };
  const record = (pts, id) => { for (let i = 1; i < pts.length; i++) { const [a, b] = [pts[i - 1], pts[i]], vertical = a[0] === b[0]; lanes.push({ id, vertical, at: vertical ? a[0] : a[1], lo: Math.min(vertical ? a[1] : a[0], vertical ? b[1] : b[0]), hi: Math.max(vertical ? a[1] : a[0], vertical ? b[1] : b[0]) }); } };
  for (const e of input.connections.filter(x => x.authoredPoints)) { e.points = e.authoredPoints; record(e.points, e.id); }
  const plan = [];
  for (const e of input.connections.filter(x => !x.authoredPoints)) {
    const a = cards[e.from], b = cards[e.to], sides = sidePairs(a, b).find(pair => paths(pair, centre(a, pair[0]), centre(b, pair[1])).some(cardClear));
    if (!sides) return { edge: e, reason: 'no side pair has a clear orthogonal route' };
    plan.push({ e, a, b, sides });
  }
  // a side holds ports a lane apart and clear of its corners; when more routes choose a side than it holds, those whose far
  // card lies furthest beyond it move to another side pair with room, and a side that still overflows needs a larger card
  const capacity = (card, side) => Math.max(1, Math.floor(((side === 'left' || side === 'right' ? card.height : card.width) - 28) / LANE) + 1);
  // a card side is keyed by its component id and side as a tuple, since ids may contain any character
  const sideKey = (id, side) => JSON.stringify([id, side]);
  const load = new Map(), ends = q => [[q.e.from, q.a, q.sides[0]], [q.e.to, q.b, q.sides[1]]];
  for (const q of plan) for (const [id, , side] of ends(q)) load.set(sideKey(id, side), (load.get(sideKey(id, side)) || 0) + 1);
  const over = () => [...load].find(([key, n]) => { const [id, side] = JSON.parse(key); return n > capacity(cards[id], side); });
  const beyond = (card, side, other) => { const c = side === 'left' || side === 'right' ? other.y + other.height / 2 : other.x + other.width / 2, lo = side === 'left' || side === 'right' ? card.y : card.x, hi = lo + (side === 'left' || side === 'right' ? card.height : card.width); return Math.max(lo - c, c - hi, 0); };
  for (let full = over(); full; full = over()) {
    const [id, side] = JSON.parse(full[0]), moves = [];
    for (const q of plan) for (const [end, card, s, other] of [['from', q.a, q.sides[0], q.b], ['to', q.b, q.sides[1], q.a]]) {
      if ((end === 'from' ? q.e.from : q.e.to) !== id || s !== side) continue;
      for (const pair of sidePairs(q.a, q.b)) {
        if (pair[0] === q.sides[0] && pair[1] === q.sides[1]) continue;
        const room = [[q.e.from, q.a, pair[0], q.sides[0]], [q.e.to, q.b, pair[1], q.sides[1]]].every(([cid, c, ps, was]) => ps === was || (load.get(sideKey(cid, ps)) || 0) < capacity(c, ps));
        if (room && (end === 'from' ? pair[0] : pair[1]) !== side && paths(pair, centre(q.a, pair[0]), centre(q.b, pair[1])).some(cardClear)) { moves.push({ q, pair, far: beyond(card, side, other) }); break; }
      }
    }
    const move = moves.sort((x, y) => y.far - x.far)[0];
    if (!move) { const n = full[1], card = cards[id], needed = 28 + (n - 1) * LANE; return { edge: plan.find(q => ends(q).some(([cid, , s]) => cid === id && s === side)).e, reason: id + ' needs ' + n + ' separate ports on its ' + side + ' side, which holds ' + capacity(card, side) + '; make it at least ' + needed + 'px ' + (side === 'left' || side === 'right' ? 'tall' : 'wide') + ' or move a neighbour so a route can use another side' }; }
    for (const [cid, , s] of ends(move.q)) load.set(sideKey(cid, s), load.get(sideKey(cid, s)) - 1);
    move.q.sides = move.pair;
    for (const [cid, , s] of ends(move.q)) load.set(sideKey(cid, s), (load.get(sideKey(cid, s)) || 0) + 1);
  }
  const ports = new Map();
  for (const p of plan) for (const [end, card, side, other] of [['from', p.a, p.sides[0], p.b], ['to', p.b, p.sides[1], p.a]]) {
    const key = sideKey(end === 'from' ? p.e.from : p.e.to, side); if (!ports.has(key)) ports.set(key, []);
    ports.get(key).push({ p, end, card, side, order: side === 'left' || side === 'right' ? other.y + other.height / 2 : other.x + other.width / 2 });
  }
  // facing sides that overlap share one port line first, so their route runs straight and has room for its label;
  // the remaining ports spread along each side in the order of their far ends, keeping a lane apart from the rest
  for (const list of ports.values()) list.sort((x, y) => x.order - y.order);
  const facing = { right: 'left', left: 'right', bottom: 'top', top: 'bottom' }, fixed = new Map();
  for (const p of plan) {
    const [fs, ts] = p.sides; if (facing[fs] !== ts) continue;
    const axis = fs === 'right' || fs === 'left' ? 1 : 0, k = axis ? 'y' : 'x', size = axis ? 'height' : 'width';
    // the shared line leaves a lane for every port ordered before and after it on both sides
    const room = (key, card, end) => { const list = ports.get(key), i = list.findIndex(x => x.p === p && x.end === end); return [card[k] + 14 + i * LANE, card[k] + card[size] - 14 - (list.length - 1 - i) * LANE]; };
    const [flo, fhi] = room(sideKey(p.e.from, fs), p.a, 'from'), [tlo, thi] = room(sideKey(p.e.to, ts), p.b, 'to');
    const lo = Math.max(flo, tlo), hi = Math.min(fhi, thi);
    if (hi < lo) continue;
    const taken = key => [...fixed].filter(([q, v]) => q.key === key).map(([, v]) => v), fk = sideKey(p.e.from, fs), tk = sideKey(p.e.to, ts);
    const mid = Math.round((lo + hi) / 2), v = [...Array(hi - lo + 1).keys()].map(i => lo + i).sort((x, y) => Math.abs(x - mid) - Math.abs(y - mid)).find(v => [...taken(fk), ...taken(tk)].every(t => Math.abs(t - v) >= LANE));
    if (v === undefined) continue;
    fixed.set({ key: fk, p, end: 'from' }, v); fixed.set({ key: tk, p, end: 'to' }, v);
  }
  let crowded = null;
  const fixedAt = (p, end) => { for (const [q, v] of fixed) if (q.p === p && q.end === end) return v; return undefined; };
  for (const list of ports.values()) {
    list.sort((x, y) => x.order - y.order);
    const placedAt = list.map(item => fixedAt(item.p, item.end)), used = placedAt.filter(v => v !== undefined);
    list.forEach((item, i) => {
      const { card, side } = item, horizontal = side === 'left' || side === 'right', span = horizontal ? card.height : card.width, base = horizontal ? card.y : card.x;
      let at = placedAt[i];
      if (at === undefined) {
        // stay between the neighbours already placed in order, so routes leave the side without crossing each other
        const before = Math.max(-Infinity, ...placedAt.slice(0, i).filter(v => v !== undefined)), after = Math.min(Infinity, ...placedAt.slice(i + 1).filter(v => v !== undefined));
        // aim at the far card, so routes run straight where they can and bundles open toward their destinations
        const want = Math.round(Math.max(base + 14 + i * LANE, Math.min(base + span - 14 - (list.length - 1 - i) * LANE, item.order)));
        const options = [...Array(span - 27).keys()].map(d => base + 14 + d).sort((x, y) => Math.abs(x - want) - Math.abs(y - want)), clear = v => used.every(u => Math.abs(u - v) >= LANE);
        at = options.find(v => clear(v) && v > before && v < after) ?? options.find(clear);
        // never two ports on one spot: a side that cannot keep them a lane apart is reported, not overlapped
        if (at === undefined) { crowded ||= { edge: item.p.e, reason: (item.end === 'from' ? item.p.e.from : item.p.e.to) + "'s " + side + ' side cannot keep its ports a lane apart; make the card larger or move a neighbour so a route can use another side' }; at = want; }
        used.push(at); placedAt[i] = at;
      }
      item.p[item.end] = side === 'right' ? [card.x + card.width, at] : side === 'left' ? [card.x, at] : side === 'bottom' ? [at, card.y + card.height] : [at, card.y];
    });
  }
  if (crowded) return crowded;
  for (const p of plan) {
    // when the spread ports leave no free lane, any other pair of sides with a clear lane is still a correct route
    const clear = paths(p.sides, p.from, p.to).filter(pts => cardClear(pts) && laneClear(pts, p.e.id));
    // fewer crossings first, then the longest open stretch for the label
    const better = (pts, best) => { const c = crossings(pts, p.e.id) + hugs(pts, p.e, false), cb = crossings(best, p.e.id) + hugs(best, p.e, false); return c < cb || (c === cb && openStretch(pts) > openStretch(best) + LANE); };
    const pick = list => list.reduce((best, pts) => !best || better(pts, best) ? pts : best, null);
    const chosen = pick(clear)
      || pick(sidePairs(p.a, p.b).flatMap(pair => paths(pair, centre(p.a, pair[0]), centre(p.b, pair[1]))).filter(pts => cardClear(pts) && laneClear(pts, p.e.id)));
    if (!chosen) return { edge: p.e, reason: 'other routes already use the free lanes between ' + p.e.from + ' and ' + p.e.to };
    p.e.points = chosen; record(chosen, p.e.id);
  }
  // routes are chosen one at a time, so two of them can still cross where both had room to pass in order (typically a
  // request and its reply between the same cards); re-plan each crossing pair together and keep the best combination
  // a re-planned route is judged by crossings, then room for its label, then length and bends (never a detour for room)
  const cost = (pts, e, open) => { const { w, h } = labelSize(e.label), need = Math.max(w, h) + 2 * LABEL.margin; let len = 0; for (let i = 1; i < pts.length; i++) len += Math.abs(pts[i][0] - pts[i - 1][0]) + Math.abs(pts[i][1] - pts[i - 1][1]);
    return [open >= need ? 0 : 1, len + 24 * (pts.length - 2)]; };
  const drop = id => { for (let i = lanes.length - 1; i >= 0; i--) if (lanes[i].id === id) lanes.splice(i, 1); };
  // a few free ports on every usable side, nearest the far card first, so a pair may also swap the sides it uses
  const portsOn = (card, side, other) => { const horizontal = side === 'left' || side === 'right', base = horizontal ? card.y : card.x, span = horizontal ? card.height : card.width, want = horizontal ? other.y + other.height / 2 : other.x + other.width / 2;
    return [...Array(Math.max(1, Math.floor((span - 28) / LANE) + 1)).keys()].map(k => base + 14 + k * LANE).sort((u, v) => Math.abs(u - want) - Math.abs(v - want)).slice(0, 4)
      .map(v => side === 'right' ? [card.x + card.width, v] : side === 'left' ? [card.x, v] : side === 'bottom' ? [v, card.y + card.height] : [v, card.y]); };
  const options = (q, keep = 32) => { const seen = new Set(), list = [];
    for (const pts of [[q.from, q.to, q.sides], ...(!thorough ? [] : sidePairs(q.a, q.b).flatMap(pair => portsOn(q.a, pair[0], q.b).flatMap(f => portsOn(q.b, pair[1], q.a).map(t => [f, t, pair]))))].flatMap(([f, t, pair]) => paths(pair, f, t))) {
      const key = JSON.stringify(pts); if (seen.has(key) || !laneClear(pts, q.e.id) || !cardClear(pts)) continue; seen.add(key); const o = openStretch(pts), [f, l] = cost(pts, q.e, o); list.push({ pts, c: crossings(pts, q.e.id) + hugs(pts, q.e), f, l }); }
    // a few routes per pair of ports, so the short list keeps every way of ordering the pair
    const per = new Map(), short = []; for (const x of list.sort((u, v) => u.c - v.c || u.f - v.f || u.l - v.l)) { const k = x.pts[0] + '|' + x.pts[x.pts.length - 1], n = per.get(k) || 0; if (n < 4) { per.set(k, n + 1); short.push(x); } }
    return short.slice(0, keep).map(x => x.pts); };
  const pairCrossing = (x, y) => { drop(y.e.id); record(y.e.points, y.e.id); const n = crossings(x.e.points, x.e.id) - (drop(y.e.id), crossings(x.e.points, x.e.id)); record(y.e.points, y.e.id); return n; };
  for (let round = 0; round < 3; round++) {
    let improved = false;
    for (const x of plan) for (const y of plan) {
      if (x === y || tried.get(x.e.id) > 1 || tried.get(y.e.id) > 1 || !pairCrossing(x, y)) continue;
      // the pair's own crossing counts once, as it does for each combination below
      drop(y.e.id); const before = crossings(x.e.points, x.e.id) + hugs(x.e.points, x.e) + (record(y.e.points, y.e.id), crossings(y.e.points, y.e.id) + hugs(y.e.points, y.e)), keep = [x.e.points, y.e.points];
      drop(x.e.id); drop(y.e.id);
      let best = null;
      const oy = options(y, 128);
      for (const px of options(x)) {
        const cx = crossings(px, x.e.id) + hugs(px, x.e), kx = cost(px, x.e, openStretch(px)); record(px, x.e.id);
        for (const py of oy) { if (!laneClear(py, y.e.id)) continue; const score = cx + crossings(py, y.e.id) + hugs(py, y.e), ky = cost(py, y.e, openStretch(py)), fit = kx[0] + ky[0], len = kx[1] + ky[1]; if (!best || score < best.score || (score === best.score && (fit < best.fit || (fit === best.fit && len < best.len)))) best = { score, fit, len, px, py }; }
        drop(x.e.id);
      }
      const [px, py] = best && best.score < before ? (improved = true, [best.px, best.py]) : keep;
      x.e.points = px; y.e.points = py; record(px, x.e.id); record(py, y.e.id);
    }
    if (!improved) break;
  }
  // in the final pass a route that still runs beside a card or outline may take another way that is no worse otherwise
  if (thorough) for (const q of plan) {
    const now = crossings(q.e.points, q.e.id) + hugs(q.e.points, q.e); if (!hugs(q.e.points, q.e)) continue;
    drop(q.e.id);
    // its label must still have a place on the new way: a straight stretch clear of cards and group titles
    const blocks = input.components.map(c => ({ x: cards[c.id].x, y: cards[c.id].y, w: cards[c.id].width, h: cards[c.id].height })).concat((input.groups || []).filter(g => g.geometry).map(groupTitle));
    const labelled = pts => labelCandidates({ ...q.e, points: pts }).some(c => !blocks.some(o => overlaps(c.box, o, LABEL.margin)));
    // after its label failed on a way, the next attempt takes the next way, and after three it keeps its own
    const ways = options(q, 8).filter(pts => crossings(pts, q.e.id) + hugs(pts, q.e) < now && labelled(pts)), best = (tried.get(q.e.id) || 0) < 3 && ways[tried.get(q.e.id) || 0];
    if (best) q.e.points = best; record(q.e.points, q.e.id);
  }
  return null;
}

// Labels appear only for one selected component's connections, so slots are placed per component: clear of every card,
// group title and route, and of the other labels shown with them. A connection may sit in a different slot for each end.
const LABEL = { chars: 22, char: 6.5, line: 15, pad: 18, margin: 7 };
const labelSize = label => { const lines = wrapLabel(label, LABEL.chars); return { lines, w: Math.ceil(Math.max(...lines.map(l => l.length)) * LABEL.char + LABEL.pad), h: lines.length * LABEL.line + 9 }; };
const overlaps = (a, b, m = 0) => a.x < b.x + b.w + m && b.x < a.x + a.w + m && a.y < b.y + b.h + m && b.y < a.y + a.h + m;
function segmentHits(p, q, r, m) {
  const x0 = Math.min(p[0], q[0]), x1 = Math.max(p[0], q[0]), y0 = Math.min(p[1], q[1]), y1 = Math.max(p[1], q[1]);
  return x1 >= r.x - m && x0 <= r.x + r.w + m && y1 >= r.y - m && y0 <= r.y + r.h + m;
}
const groupTitle = g => ({ x: g.geometry.x + 10, y: g.geometry.y + 8, w: g.name.length * 7.4 + 16, h: 22 });
function labelCandidates(e) {
  const { w, h } = labelSize(e.label), cands = [];
  e.points.slice(1).forEach((q, i) => {
    const p = e.points[i], horizontal = p[1] === q[1], len = Math.abs(horizontal ? q[0] - p[0] : q[1] - p[1]);
    if (len < (horizontal ? w : h) + 2 * LABEL.margin) return;
    for (const t of [0.5, 0.4, 0.6, 0.3, 0.7, 0.22, 0.78]) {
      const cx = p[0] + (q[0] - p[0]) * t, cy = p[1] + (q[1] - p[1]) * t;
      cands.push({ len, t, i, beside: 0, box: { x: cx - w / 2, y: cy - h / 2, w, h } });
      // beside the line, touching it: used where a parallel route leaves no room on the line itself
      for (const side of [-1, 1]) cands.push({ len, t, i, beside: 1, box: horizontal ? { x: cx - w / 2, y: side < 0 ? cy - h - 3 : cy + 3, w, h } : { x: side < 0 ? cx - w - 4 : cx + 4, y: cy - h / 2, w, h } });
    }
  });
  return cands.sort((a, b) => a.beside - b.beside || b.len - a.len || Math.abs(a.t - 0.5) - Math.abs(b.t - 0.5));
}
function placeLabels(input) {
  const obstacles = input.components.map(c => ({ x: c.geometry.x, y: c.geometry.y, w: c.geometry.width, h: c.geometry.height })).concat((input.groups || []).map(groupTitle));
  const segments = input.connections.flatMap(e => e.points.slice(1).map((q, i) => ({ id: e.id, i, p: e.points[i], q })));
  // a candidate never covers a card or group title; routes it would cover are recorded so the selection can rule them out
  const cands = new Map(input.connections.map(e => [e.id, labelCandidates(e).filter(c => !obstacles.some(o => overlaps(c.box, o, LABEL.margin)))
    .map(c => ({ ...c, covers: new Set(segments.filter(s => !(s.id === e.id && s.i === c.i) && segmentHits(s.p, s.q, c.box, 3)).map(s => s.id)) }))]));
  const slots = {}, failed = [], why = [];
  for (const c of input.components) {
    // routes shown with this selection must stay visible; dimmed unrelated routes may pass under a label, but a clear slot is preferred
    const mine = input.connections.filter(e => e.from === c.id || e.to === c.id), shown = new Set(mine.map(e => e.id)), placed = [];
    const usable = e => cands.get(e.id).filter(x => ![...x.covers].some(id => shown.has(id))).sort((a, b) => a.covers.size - b.covers.size);
    slots[c.id] = {};
    for (const e of [...mine].sort((a, b) => usable(a).length - usable(b).length || labelSize(b.label).w - labelSize(a.label).w)) {
      const best = usable(e).find(x => !placed.some(o => overlaps(x.box, o, LABEL.margin)));
      if (!best) {
        if (!failed.includes(e)) failed.push(e);
        const all = cands.get(e.id), near = all.filter(x => !placed.some(o => overlaps(x.box, o, LABEL.margin))).sort((a, b) => a.covers.size - b.covers.size)[0];
        why.push(e.id + ' (“' + e.label + '”, shown when ' + c.id + ' is selected): ' + (!all.length ? 'no straight stretch of its route is long enough' : near ? 'every slot would cover ' + [...near.covers].filter(id => shown.has(id)).join(', ') : 'every slot collides with another label of ' + c.id));
        continue;
      }
      placed.push(best.box); slots[c.id][e.id] = { ...best.box, lines: labelSize(e.label).lines };
    }
  }
  return { slots, failed, why };
}

// Inserting space along a line that crosses no card keeps the authored arrangement: everything beyond the line moves,
// groups the line passes through widen, and nothing is scaled. Only the crowded line grows.
function insertSpace(state, axis, at, amount) {
  const k = axis === 0 ? 'x' : 'y', size = axis === 0 ? 'width' : 'height';
  for (const c of state.components) if (c.geometry[k] > at) c.geometry[k] += amount;
  for (const g of state.groups || []) { const a = g.geometry[k], b = a + g.geometry[size]; g.geometry[k] = a + (a > at ? amount : 0); g.geometry[size] = b + (b > at ? amount : 0) - g.geometry[k]; }
  for (const e of state.connections) if (e.authoredPoints) e.authoredPoints = e.authoredPoints.map(p => { const q = [...p]; if (q[axis] > at) q[axis] += amount; return q; });
}
function freeLine(state, axis, lo, hi) {
  const k = axis === 0 ? 'x' : 'y', size = axis === 0 ? 'width' : 'height', mid = (lo + hi) / 2;
  for (let d = 0; d <= (hi - lo) / 2; d += 4) for (const at of [mid + d, mid - d]) {
    if (at <= lo || at >= hi) continue;
    if (!state.components.some(c => c.geometry[k] < at + 6 && c.geometry[k] + c.geometry[size] > at - 6)) return at;
  }
  return null;
}
const snapshot = input => ({ components: input.components.map(c => ({ id: c.id, geometry: { ...c.geometry } })), groups: (input.groups || []).map(g => ({ id: g.id, name: g.name, members: g.members, geometry: { ...g.geometry } })), connections: input.connections.map(e => ({ id: e.id, from: e.from, to: e.to, label: e.label, authoredPoints: e.authoredPoints })) });
const area = s => { const all = s.components.map(c => c.geometry).concat(s.groups.map(g => g.geometry)); return (Math.max(...all.map(g => g.x + g.width)) - Math.min(...all.map(g => g.x))) * (Math.max(...all.map(g => g.y + g.height)) - Math.min(...all.map(g => g.y))); };
function attempt(state) { const blocked = routeAll(state); if (blocked) return { blocked, failed: [blocked.edge], slots: {} }; return { ...placeLabels(state), blocked: null }; }
function spaceOverview(input) {
  let state = snapshot(input), result = attempt(state), kept = { state, result }, stalled = 0;
  // each round adds the room that leaves the fewest failing labels; a few steps may pass without progress, but the result
  // is the first arrangement with the fewest failures, so space that did not help is never kept
  for (let round = 0; round < 60 && result.failed.length; round++) {
    const cards = Object.fromEntries(state.components.map(c => [c.id, c.geometry])), candidates = [];
    for (const e of result.failed) {
      const { w, h } = labelSize(e.label), need = Math.max(w, h) + 2 * LABEL.margin + 8;
      if (result.blocked) {
        const a = cards[e.from], b = cards[e.to];
        for (const axis of [0, 1]) { const [k, s] = axis ? ['y', 'height'] : ['x', 'width'], lo = Math.min(a[k] + a[s], b[k] + b[s]), hi = Math.max(a[k], b[k]); const at = hi > lo ? freeLine(state, axis, lo, hi) : null; if (at !== null) candidates.push([axis, at, 40]); }
        continue;
      }
      const points = state.connections.find(x => x.id === e.id).points;
      points.slice(1).forEach((q, i) => {
        const p = points[i], axis = p[1] === q[1] ? 0 : 1, lo = Math.min(p[axis], q[axis]), hi = Math.max(p[axis], q[axis]), len = hi - lo;
        const along = freeLine(state, axis, lo, hi); if (along !== null) candidates.push([axis, along, Math.max(28, need - len + 12)]);
        const across = 1 - axis, at = p[across];
        for (const side of [-1, 1]) { const line = freeLine(state, across, at + side * 8 - 48, at + side * 8 + 48); if (line !== null) candidates.push([across, line, (axis ? w : h) + 2 * LABEL.margin + 6]); }
      });
    }
    let best = null;
    for (const [axis, at, amount] of new Map(candidates.map(c => [c.join(':'), c])).values()) {
      const trial = structuredClone(state); insertSpace(trial, axis, at, amount);
      const r = attempt(trial), score = r.failed.length * 1e9 + area(trial);
      if (!best || score < best.score) best = { score, trial, r };
    }
    if (!best) break;
    state = best.trial; result = best.r;
    if (result.failed.length < kept.result.failed.length) { kept = { state, result }; stalled = 0; } else if (++stalled > 5) break;
  }
  ({ state, result } = kept);
  // once the spacing is settled, routes may also swap card sides to remove crossings, kept only if every label still fits
  // a route whose label then loses its room tries its next way, and the pass is run again
  if (!result.failed.length) { const tried = new Map();
    for (let k = 0; k < 8; k++) { const trial = structuredClone(state); if (routeAll(trial, true, tried)) break; const r = placeLabels(trial);
      if (!r.failed.length) { state = trial; result = { ...r, blocked: null }; break; }
      r.failed.forEach(e => tried.set(e.id, (tried.get(e.id) || 0) + 1)); } }
  if (result.failed.length) fail((result.blocked ? 'no clear orthogonal route for ' + result.blocked.edge.id + ' (' + result.blocked.reason + '). Move the cards apart in the authored geometry, or author the route points.' : 'connection labels have no clear slot even after adding space:\n  ' + result.why.join('\n  ') + '\nRoutes that leave the same card side run side by side; arrange the far cards so these routes leave from different sides or diverge early, or author the route points. See system-explorer.md, Overview geometry.'));
  for (const c of input.components) c.geometry = state.components.find(x => x.id === c.id).geometry;
  for (const g of input.groups || []) g.geometry = state.groups.find(x => x.id === g.id).geometry;
  for (const e of input.connections) e.points = state.connections.find(x => x.id === e.id).points;
  return result.slots;
}

/** Overview geometry is accepted only when it stays legible: no overlapping cards, side-anchored orthogonal routes, no route through a card. */
function validateGeometry(input) {
  for (const group of input.groups || []) {
    const g = group.geometry;
    for (const id of group.members) {
      const c = input.components.find(item => item.id === id).geometry;
      if (c.x < g.x || c.y < g.y + 24 || c.x + c.width > g.x + g.width || c.y + c.height > g.y + g.height) fail('group boundary must contain its member card: ' + id);
    }
  }
  const cards = input.components.map(c => ({ id: c.id, ...c.geometry }));
  for (let i = 0; i < cards.length; i++) for (let j = i + 1; j < cards.length; j++) {
    const a = cards[i], b = cards[j], gap = 12;
    if (a.x < b.x + b.width + gap && b.x < a.x + a.width + gap && a.y < b.y + b.height + gap && b.y < a.y + a.height + gap) fail('cards overlap or touch: ' + a.id + ', ' + b.id);
  }
  for (const edge of input.connections) {
    const p = edge.points;
    for (let i = 1; i < p.length; i++) if (p[i][0] !== p[i - 1][0] && p[i][1] !== p[i - 1][1]) fail('connection segments must be orthogonal: ' + edge.id);
    const from = cards.find(c => c.id === edge.from), to = cards.find(c => c.id === edge.to);
    if (!onSide(p[0], from) || !onSide(p[p.length - 1], to)) fail('connection must start and end on a card side, away from corners: ' + edge.id);
    for (const card of cards) for (let i = 1; i < p.length; i++) if (segmentCrosses(p[i - 1], p[i], card)) fail('connection passes through a card: ' + edge.id + ' through ' + card.id);
  }
}
function groupBox(g, cards) {
  const m = g.members.map(id => cards[id]), x = Math.min(...m.map(c => c.x)) - 24, y = Math.min(...m.map(c => c.y)) - 44;
  return { x, y, width: Math.max(...m.map(c => c.x + c.width)) + 24 - x, height: Math.max(...m.map(c => c.y + c.height)) + 28 - y };
}

// ---------- loading and validation ----------
const RETIRED = { focus: 'Component focus belonged to the retired component drill-down views; components are selections on the system overview. Remove it.' };

/** Reads and validates visuals/assets/explorer.json against canonical sources and the reviewed state graphs. */
export function loadExplorer(root, graphs) {
  const file = path.join(root, 'visuals/assets/explorer.json');
  if (!fs.existsSync(file)) return null;
  const input = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (input.version === 1) fail('version 1 models described component drill-down views. Version 2 has two destinations, the system overview and states and transitions: set version 2, remove component focus, give each state a readable label and gist and each transition a path and a readable label, explain symbols as terms, and let conditions cite their own records. See system-explorer.md.');
  if (input.version !== 2 || !input.sources || !Object.keys(input.sources).length) fail('model needs version 2 and reviewed source fingerprints.');
  for (const [source, digest] of Object.entries(input.sources)) if (sha(fs.readFileSync(packageFile(root, source))) !== digest) fail('source changed; review the explorer meaning before updating its fingerprint: ' + source);
  text(input.title, 'Title', 60);
  text(input.summary, 'Overview summary', 240);
  const cache = new Map(), resolve = ref => resolveGraphSource(root, input, ref, cache);
  if (!input.components?.length || !Array.isArray(input.connections)) fail('model needs components and connections.');
  const components = unique(input.components, 'Components');
  unique(input.objects || [], 'Objects'); unique(input.connections, 'Connections'); unique(input.groups || [], 'Groups'); unique(input.scenarios || [], 'Scenarios');
  if (input.layout && !['auto', 'authored'].includes(input.layout)) fail('layout is auto or authored.');
  const grouped = new Set();
  for (const group of input.groups || []) {
    text(group.name, 'Group name', 48);
    if (!group.members?.length) fail('a group needs members: ' + group.id);
    for (const id of group.members) { if (!components.has(id) || grouped.has(id)) fail('a grouped component must exist and belong to exactly one group: ' + id); grouped.add(id); }
    if (group.source) group.exact = resolve(group.source);
  }
  for (const c of input.components) {
    for (const [key, why] of Object.entries(RETIRED)) if (c[key] !== undefined) fail(why + ' (' + c.id + ')');
    text(c.name, 'Component name', 40); text(c.meta, 'Component second line for ' + c.id, 64); text(c.summary, 'Component summary for ' + c.id, 300);
    if (!COMPONENT_KINDS.includes(c.kind)) fail('component kind must be one of ' + COMPONENT_KINDS.join(', ') + ': ' + c.id);
    c.exact = resolve(c.source);
    if (c.boundary) { text(c.boundary.label, 'Boundary label', 32); text(c.boundary.text, 'Boundary text', 200); if (c.boundary.source) c.boundary.exact = resolve(c.boundary.source); }
    for (const r of c.responsibilities || []) {
      if (!/^SR-\d{3,}$/.test(r.id || '')) fail('responsibility references use SR identities: ' + c.id);
      text(r.name, 'Responsibility name', 64); text(r.domain, 'Responsibility domain', 64);
      r.exact = resolve(r.source);
      if (!mentionsIdentity(String(r.exact.text || r.exact.row?.join(' ')), r.id)) fail('responsibility source must name ' + r.id + ' for ' + c.id);
    }
    if (c.figure) {
      text(c.figure.title, 'Figure title', 80); text(c.figure.caption, 'Figure caption', 280); text(c.figure.tool, 'Figure tool and revision', 120);
      const local = String(c.figure.file || '');
      if (!/\.html$/.test(local) || path.isAbsolute(local) || local.split(/[\\/]/).includes('..') || !fs.existsSync(path.join(root, 'visuals', local))) fail('figure must be an existing HTML file inside visuals/: ' + c.id);
    }
  }
  for (const edge of input.connections) {
    if (!components.has(edge.from) || !components.has(edge.to) || edge.from === edge.to) fail('connection endpoints must be distinct declared components: ' + edge.id);
    if (!CONNECTION_KINDS.includes(edge.kind)) fail('connection kind must be one of ' + CONNECTION_KINDS.join(', ') + ': ' + edge.id);
    text(edge.label, 'Connection label (what crosses) for ' + edge.id, 48);
    if (edge.detail) text(edge.detail, 'Connection detail', 280);
    edge.exact = resolve(edge.source);
  }
  const graphById = new Map((graphs?.graphs || []).filter(g => g.kind === 'states').map(g => [g.id, g]));
  const explorable = new Set((input.objects || []).filter(o => o.graph).map(o => o.id));
  for (const object of input.objects || []) {
    text(object.name, 'Object name', 48); text(object.summary, 'Object summary for ' + object.id, 280);
    if (!object.owners?.length) fail('an object needs the components that manage it: ' + object.id);
    for (const owner of object.owners) { if (!components.has(owner.component)) fail('object owner must be a declared component: ' + object.id); text(owner.role, 'Owner role', 48); if (owner.source) owner.exact = resolve(owner.source); }
    object.exact = resolve(object.source);
    if (!object.graph) { for (const key of ['transitions', 'states', 'terms', 'exits']) if (object[key]) fail('an object without a reviewed state graph is not drawn and cannot describe ' + key + ': ' + object.id); continue; }
    const graph = graphById.get(object.graph);
    if (!graph) fail('object graph must name a reviewed state graph in graphs.json: ' + object.id);
    const terms = new Set();
    for (const term of object.terms || []) {
      text(term.term, 'Term', 12); text(term.meaning, 'Term meaning for ' + term.term, 160);
      if (terms.has(term.term)) fail('each term is explained once: ' + term.term);
      terms.add(term.term); term.exact = resolve(term.source);
      numbersBacked(term.meaning, [term.exact], 'Term ' + term.term);
    }
    const termSources = (object.terms || []).map(t => t.exact);
    const nodes = new Map(graph.nodes.map(n => [n.id, n])), edges = new Map(graph.edges.map(e => [e.id, e]));
    object.states ||= {}; object.transitions ||= {};
    if (object.start && !nodes.has(object.start)) fail('object start must name a state of ' + object.graph + ': ' + object.id);
    for (const key of Object.keys(object.states)) if (!nodes.has(key)) fail('state detail must name a node of ' + object.graph + ': ' + key);
    for (const node of graph.nodes) {
      const detail = object.states[node.id];
      if (node.kind === 'junction') { if (detail?.label) text(detail.label, 'Condition label', 32); readableOnCanvas(detail?.label || node.name, 'Condition ' + node.name); continue; }
      if (!detail?.gist) fail('every drawn state needs a short gist that says what it means for the reader: ' + object.id + ' / ' + node.name);
      text(detail.gist, 'State gist for ' + node.name, 110);
      if (detail.label) text(detail.label, 'State label for ' + node.name, 32);
      // the graph loader parsed the exact Yes/No Terminal cell once; validation and rendering both read that value
      const terminal = node.terminal;
      // a record may mark a state terminal while an open ticket still decides whether it stays final: the recorded value is kept,
      // the doubt is declared beside it and bound to the ticket that owns it, and no definitive outcome is drawn
      if (detail.terminalUnresolved !== undefined) {
        if (!terminal) fail('terminalUnresolved applies only to a state its record marks terminal; a state recorded as not terminal is drawn as an ordinary state: ' + node.name);
        if (detail.outcome !== undefined) fail('a state whose terminal status is unresolved carries no outcome, since the outcome would present it as settled: ' + node.name);
        if (!detail.terminalUnresolved?.open?.length) fail('terminalUnresolved needs open: the unresolved ticket that decides whether ' + node.name + ' stays terminal.');
        detail.terminalUnresolved.refs = openTickets(detail.terminalUnresolved.open, [node.exact], root, input, 'Terminal status of ' + node.name, true);
      }
      else if (terminal && !OUTCOMES.includes(detail.outcome)) fail('a terminal state needs an outcome (' + OUTCOMES.join(', ') + '): ' + node.name);
      if (!terminal && detail.outcome) fail('only terminal states carry an outcome: ' + node.name);
      detail.openRefs = openTickets(detail.open, [node.exact, object.exact], root, input, 'State ' + node.name);
      numbersBacked(detail.gist, [node.exact, object.exact, ...termSources, ...detail.openRefs, ...(detail.terminalUnresolved?.refs || [])], 'State gist for ' + node.name);
      readableOnCanvas(detail.label || node.name, 'State ' + node.name);
      numbersBacked(detail.label || node.name, [node.exact], 'State label for ' + node.name);
      symbolsExplained(detail.gist, terms, 'State ' + node.name);
    }
    for (const key of Object.keys(object.transitions)) if (!edges.has(key)) fail('transition detail must name an edge of ' + object.graph + ': ' + key);
    for (const edge of graph.edges) {
      const detail = object.transitions[edge.id];
      if (!detail) fail('every drawn transition needs its path: ' + object.id + ' / ' + edge.label);
      if (!PATH_KINDS.includes(detail.path)) fail('transition path must be one of ' + PATH_KINDS.join(', ') + ': ' + edge.id);
      if (detail.short !== undefined) text(detail.short, 'Transition short line for ' + edge.label, 48);
      if (detail.label) text(detail.label, 'Transition label for ' + edge.label, 30);
      const cite = item => typeof item === 'string' ? { text: item } : item;
      detail.actor = detail.actor ? cite(detail.actor) : null; detail.when = (detail.when || []).map(cite);
      if (detail.actor) { text(detail.actor.text, 'Transition actor', 100); if (detail.actor.source) detail.actor.exact = resolve(detail.actor.source); }
      for (const condition of detail.when) { text(condition.text, 'Transition condition', 200); if (condition.source) condition.exact = resolve(condition.source); }
      const own = [edge.exact, nodes.get(edge.from).exact, nodes.get(edge.to).exact];
      detail.openRefs = openTickets(detail.open, [...own, detail.actor?.exact, ...detail.when.map(c => c.exact), object.exact], root, input, 'Action ' + edge.label); own.push(...detail.openRefs);
      if (detail.actor) numbersBacked(detail.actor.text, [...own, detail.actor.exact], 'Actor of ' + edge.label);
      for (const condition of detail.when) numbersBacked(condition.text, [...own, condition.exact], 'Condition of ' + edge.label);
      if (detail.short) { numbersBacked(detail.short, [...own, detail.actor?.exact, ...detail.when.map(c => c.exact)], 'Short line of ' + edge.label); symbolsExplained(detail.short, terms, 'Transition ' + edge.label); }
      readableOnCanvas(detail.label || edge.label, 'Action ' + edge.label);
      numbersBacked(detail.label || edge.label, [...own, ...detail.when.map(c => c.exact)], 'Action label of ' + edge.label);
      if (detail.actor) symbolsExplained(detail.actor.text, terms, 'Actor of ' + edge.label);
      for (const condition of detail.when) symbolsExplained(condition.text, terms, 'Condition of ' + edge.label);
      for (const effect of detail.effects || []) {
        text(effect.text, 'Transition effect', 200);
        effect.exact = resolve(effect.source);
        numbersBacked(effect.text, [effect.exact, ...detail.openRefs], 'Effect of ' + edge.label);
        if (effect.component && !components.has(effect.component)) fail('effect component must exist: ' + effect.text.slice(0, 60));
        if (effect.object && !explorable.has(effect.object)) fail('effect object must exist and have a reviewed state graph: ' + effect.text.slice(0, 60));
        if (effect.connection && !input.connections.some(c => c.id === effect.connection)) fail('effect connection must exist: ' + effect.text.slice(0, 60));
      }
    }
    // the diagram shows labels only, so two actions leaving one state must read differently there
    const seen = new Map();
    for (const edge of graph.edges) {
      const key = edge.from + '|' + String(object.transitions[edge.id].label || edge.label).toLowerCase();
      if (seen.has(key)) fail('two actions leave the same state with the label "' + (object.transitions[edge.id].label || edge.label) + '"; put the distinction a reader needs, such as the time limit or the condition, in each label: ' + seen.get(key) + ', ' + edge.id);
      seen.set(key, edge.id);
    }
    // readers get a connected explanation: one for the lifecycle, one for each action; facts stay bound to the records they cite
    const story = (value, label, backing) => {
      if (typeof value !== 'string' || !value.trim()) fail(label + ' needs a story: a short connected explanation written from its records, introducing any symbol by its role where it is first used. See system-explorer.md.');
      text(value, label + ' story', 900); numbersBacked(value, backing, label + ' story'); symbolsExplained(value, terms, label + ' story');
    };
    const everything = [object.exact, ...termSources, ...graph.nodes.map(n => n.exact), ...graph.edges.map(e => e.exact), ...graph.nodes.flatMap(n => [...(object.states[n.id]?.openRefs || []), ...(object.states[n.id]?.terminalUnresolved?.refs || [])])];
    for (const edge of graph.edges) {
      const detail = object.transitions[edge.id], own = [edge.exact, nodes.get(edge.from).exact, nodes.get(edge.to).exact, detail.actor?.exact, ...detail.when.map(c => c.exact), ...(detail.effects || []).map(f => f.exact), ...detail.openRefs];
      everything.push(...own);
      story(detail.story, 'Action ' + edge.label, [...own, ...termSources]);
    }
    for (const exit of object.exits || []) {
      if (!nodes.has(exit.from)) fail('an exit leaves from a drawn state: ' + object.id);
      text(exit.label, 'Exit label', 30); text(exit.text, 'Exit explanation', 200);
      if (!exit.object && !exit.component) fail('an exit leads to another lifecycle or a component: ' + exit.label);
      if (exit.object && !explorable.has(exit.object)) fail('an exit object must have a reviewed state graph: ' + exit.label);
      if (exit.component && !components.has(exit.component)) fail('an exit component must exist: ' + exit.label);
      if (exit.path && !PATH_KINDS.includes(exit.path)) fail('exit path must be one of ' + PATH_KINDS.join(', ') + ': ' + exit.label);
      exit.exact = resolve(exit.source);
      exit.openRefs = openTickets(exit.open, [exit.exact, nodes.get(exit.from).exact], root, input, 'Exit ' + exit.label);
      numbersBacked(exit.text, [exit.exact, ...exit.openRefs], 'Exit ' + exit.label); readableOnCanvas(exit.label, 'Exit ' + exit.label); symbolsExplained(exit.text, terms, 'Exit ' + exit.label);
    }
    for (const exit of object.exits || []) everything.push(exit.exact, ...exit.openRefs);
    everything.push(...openTickets(object.open, [object.exact, ...graph.nodes.map(n => n.exact), ...graph.edges.map(e => e.exact)], root, input, 'Lifecycle ' + object.id));
    story(object.story, 'Lifecycle ' + object.id, everything);
  }
  for (const scenario of input.scenarios || []) {
    text(scenario.title, 'Scenario title', 80); text(scenario.intro, 'Scenario orientation', 360);
    if (!scenario.steps?.length) fail('a scenario needs steps: ' + scenario.id);
    for (const step of scenario.steps) {
      text(step.caption, 'Scenario caption', 280);
      const object = step.object && (input.objects || []).find(o => o.id === step.object);
      if (step.object && !object?.graph) fail('scenario object must have a reviewed state graph: ' + step.object);
      if (step.transition && !graphById.get(object.graph).edges.some(e => e.id === step.transition)) fail('scenario transition must belong to its object: ' + step.transition);
      if (step.connection && !input.connections.some(c => c.id === step.connection)) fail('scenario connection must exist: ' + step.connection);
      if (step.component && !components.has(step.component)) fail('scenario component must exist: ' + step.component);
      if (step.via && !components.has(step.via)) fail('scenario context component must exist: ' + step.via);
      if (!step.object && !step.connection && !step.component) fail('scenario step must show a component, connection or object.');
    }
  }
  if ((input.layout || 'auto') === 'authored') {
    for (const c of input.components) {
      const g = c.geometry;
      if (!g || ![g.x, g.y, g.width, g.height].every(Number.isFinite) || g.width < 160 || g.height < 56) fail('authored layout needs x, y, width ≥ 160 and height ≥ 56 for every component: ' + c.id);
      if (c.name.length * 7.2 > g.width - 56) fail('component name would be cut off; widen the card to at least ' + Math.ceil(c.name.length * 7.2 + 56) + ' or shorten the name: ' + c.id);
      if (c.meta.length * 5.9 > g.width - 52) fail('component second line would be cut off; widen the card to at least ' + Math.ceil(c.meta.length * 5.9 + 52) + ' or shorten it: ' + c.id);
    }
    const cards = Object.fromEntries(input.components.map(c => [c.id, c.geometry]));
    for (const g of input.groups || []) g.geometry ||= groupBox(g, cards);
  } else {
    const l = calculateLayouts([{ key: 'overview', graph: overviewLayoutInput(input) }]).overview;
    for (const c of input.components) { const n = l.children.find(item => item.id === c.id); c.geometry = { x: n.x, y: n.y, width: n.width, height: n.height }; }
    for (const g of input.groups || []) { const n = l.groups.find(item => item.id === 'group:' + g.id); g.geometry = { x: n.x, y: n.y, width: n.width, height: n.height }; }
  }
  for (const e of input.connections) if (e.points) e.authoredPoints = e.points;
  input.labelSlots = spaceOverview(input); validateGeometry(input);
  input.graphs = graphById;
  return input;
}

// Groups are compound containers laid out left to right in authored order; routes are drawn by routeAll afterwards.
function overviewLayoutInput(input) {
  const grouped = new Set((input.groups || []).flatMap(g => g.members));
  const node = c => ({ id: c.id, width: Math.max(CARD.width, Math.ceil(c.name.length * 7.2 + 64)), height: CARD.height });
  const children = input.components.filter(c => !grouped.has(c.id)).map(node).concat((input.groups || []).map(g => ({
    id: 'group:' + g.id, children: g.members.map(id => node(input.components.find(c => c.id === id))),
    layoutOptions: { 'elk.padding': '[top=50,left=30,bottom=30,right=30]' },
    labels: [{ text: g.name, width: g.name.length * 7.4 + 24, height: 20, layoutOptions: { 'elk.nodeLabels.placement': 'INSIDE H_LEFT V_TOP' } }]
  })));
  return { id: 'root', direction: 'RIGHT', layoutOptions: { 'elk.algorithm': 'layered', 'elk.hierarchyHandling': 'INCLUDE_CHILDREN', 'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES', 'elk.edgeRouting': 'ORTHOGONAL', 'elk.spacing.nodeNode': '56', 'elk.layered.spacing.nodeNodeBetweenLayers': '120', 'elk.padding': '[top=40,left=40,bottom=40,right=40]', 'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX', 'elk.layered.wrapping.strategy': 'OFF' },
    children, edges: input.connections.map(e => ({ id: e.id, sources: [e.from], targets: [e.to] })) };
}

// ---------- state machine layout: readable nodes, reserved action labels, main path kept straight ----------
// The diagram carries names, outcomes and path kinds; meanings, actors and conditions open on selection.
const STATE_W = 196;
// tags: lines of the small tag above the name (an outcome takes one; an unresolved terminal status takes two, so the card keeps its width)
function stateNodeSize(label, tags) { const l = wrapLabel(label, 22); return { l, width: STATE_W, height: Math.max(52, 24 + l.length * 18 + tags * 18) }; }
function actionLabelSize(label) { const l = wrapLabel(label, 24); return { l, width: Math.ceil(Math.max(...l.map(x => x.length * 7.2)) + 22), height: l.length * 17 + 12 }; }
function stateLayoutInput(o, graph, direction) {
  const children = [], edges = [], main = new Set(graph.edges.filter(e => o.transitions[e.id].path === 'main').map(e => e.id));
  // model order puts main-path states first so the layered layout keeps them on one line
  const onMain = n => graph.edges.some(e => main.has(e.id) && (e.from === n.id || e.to === n.id));
  const order = [...graph.nodes].sort((a, b) => Number(onMain(b)) - Number(onMain(a)));
  if (o.start) { children.push({ id: 'start:', width: 14, height: 14 }); edges.push({ id: 'start:', sources: ['start:'], targets: [o.start], layoutOptions: { 'elk.layered.priority.straightness': '20' } }); }
  for (const n of order) {
    const d = o.states[n.id] || {}, size = stateNodeSize(d.label || n.name, n.kind === 'junction' ? 0 : d.terminalUnresolved ? 2 : d.outcome ? 1 : 0);
    children.push({ id: n.id, width: size.width, height: size.height });
  }
  for (const e of graph.edges) {
    const d = o.transitions[e.id], size = actionLabelSize(d.label || e.label);
    edges.push({ id: e.id, sources: [e.from], targets: [e.to], labels: [{ text: e.label, width: size.width, height: size.height }], layoutOptions: main.has(e.id) ? { 'elk.layered.priority.straightness': '20', 'elk.layered.priority.direction': '10' } : {} });
  }
  (o.exits || []).forEach((x, i) => { children.push({ id: 'exit:' + i, width: Math.max(150, x.label.length * 7 + 54), height: 46 }); edges.push({ id: 'exit:' + i, sources: [x.from], targets: ['exit:' + i] }); });
  return { id: 'root', direction, wrapping: 'OFF', layoutOptions: { 'elk.algorithm': 'layered', 'elk.edgeRouting': 'ORTHOGONAL', 'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES', 'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF', 'elk.layered.nodePlacement.bk.fixedAlignment': 'BALANCED', 'elk.spacing.nodeNode': '40', 'elk.layered.spacing.nodeNodeBetweenLayers': '30', 'elk.spacing.edgeNode': '26', 'elk.spacing.edgeEdge': '18', 'elk.layered.spacing.edgeNodeBetweenLayers': '26', 'elk.spacing.edgeLabel': '8', 'elk.edgeLabels.placement': 'CENTER', 'elk.padding': '[top=36,left=36,bottom=36,right=36]' }, children, edges };
}
const sectionPoints = edge => edge.sections.flatMap((s, i) => [...(i ? [] : [[s.startPoint.x, s.startPoint.y]]), ...(s.bendPoints || []).map(p => [p.x, p.y]), [s.endPoint.x, s.endPoint.y]]);
const layoutView = l => ({ width: l.width, height: l.height, direction: l.direction, nodes: Object.fromEntries(l.children.map(n => [n.id, { x: n.x, y: n.y, width: n.width, height: n.height }])), edges: Object.fromEntries(l.edges.map(e => [e.id, { points: sectionPoints(e), label: e.labels?.[0] ? { x: e.labels[0].x, y: e.labels[0].y, width: e.labels[0].width, height: e.labels[0].height } : null }])) });

// A lifecycle reads left to right only when that fits a desktop canvas at full size; a longer one reads top-down, so the
// reader scrolls along the main path instead of shrinking it.
const READABLE_WIDTH = 1100;
const readable = (right, down) => right.width <= READABLE_WIDTH ? right : down;

function exactView(exact) {
  if (!exact) return null;
  return exact.row ? { file: exact.file, heading: exact.heading, headers: exact.headers, row: exact.row.map(plain) } : { file: exact.file, heading: exact.heading || exact.field, text: plain(exact.text).slice(0, 900) };
}

/** Produces the index and the two destination pages, keyed by their path inside visuals/. */
export function renderExplorer(input) {
  const objects = (input.objects || []).filter(o => o.graph), jobs = [];
  for (const o of objects) { const graph = input.graphs.get(o.graph); jobs.push({ key: 'wide:' + o.id, graph: stateLayoutInput(o, graph, 'RIGHT') }, { key: 'narrow:' + o.id, graph: stateLayoutInput(o, graph, 'DOWN') }); }
  const layouts = jobs.length ? calculateLayouts(jobs) : {};
  const all = [...input.components.map(c => c.geometry), ...(input.groups || []).map(g => g.geometry)];
  const x0 = Math.min(...all.map(g => g.x)) - 40, y0 = Math.min(...all.map(g => g.y)) - 40, shift = g => ({ x: g.x - x0, y: g.y - y0, width: g.width, height: g.height });
  const overview = {
    width: Math.max(...all.map(g => g.x + g.width)) + 40 - x0, height: Math.max(...all.map(g => g.y + g.height)) + 40 - y0,
    cards: Object.fromEntries(input.components.map(c => [c.id, shift(c.geometry)])),
    groups: (input.groups || []).map(g => ({ id: g.id, name: g.name, ...shift(g.geometry) })),
    routes: Object.fromEntries(input.connections.map(e => [e.id, e.points.map(p => [p[0] - x0, p[1] - y0])])),
    labels: Object.fromEntries(Object.entries(input.labelSlots).map(([c, set]) => [c, Object.fromEntries(Object.entries(set).map(([id, s]) => [id, { x: s.x - x0, y: s.y - y0, w: s.w, h: s.h, lines: s.lines }]))]))
  };
  const data = {
    title: input.title, summary: input.summary, overview,
    components: input.components.map(c => ({ id: c.id, name: c.name, kind: c.kind, meta: c.meta, summary: c.summary, boundary: c.boundary ? { label: c.boundary.label, text: c.boundary.text, exact: exactView(c.boundary.exact) } : null,
      group: (input.groups || []).find(g => g.members.includes(c.id))?.name || '', exact: exactView(c.exact),
      responsibilities: (c.responsibilities || []).map(r => ({ id: r.id, name: r.name, domain: r.domain, exact: exactView(r.exact) })),
      lifecycles: objects.filter(o => o.owners.some(w => w.component === c.id)).map(o => o.id),
      figure: c.figure ? { file: c.figure.file, title: c.figure.title, caption: c.figure.caption, tool: c.figure.tool } : null })),
    connections: input.connections.map(e => ({ id: e.id, from: e.from, to: e.to, kind: e.kind, label: e.label, detail: e.detail || '', exact: exactView(e.exact) })),
    objects: objects.map(o => {
      const graph = input.graphs.get(o.graph);
      const nodes = graph.nodes.map(n => {
        const d = o.states[n.id] || {};
        return { id: n.id, label: d.label || n.name, name: n.name, junction: n.kind === 'junction', description: n.description || '', gist: d.gist || '', outcome: d.outcome || null,
          terminal: n.terminal === true, terminalUnresolved: !!d.terminalUnresolved, meaning: n.exact.row ? plain(n.exact.row[1] || '') : '', exact: exactView(n.exact) };
      });
      const edges = graph.edges.map(e => {
        const d = o.transitions[e.id], row = e.exact.row?.map(plain) || [];
        return { id: e.id, from: e.from, to: e.to, label: d.label || e.label, name: e.label, short: d.short || '', story: d.story, path: d.path, event: row[1] || '', authority: row[2] || '', guard: row[4] || '',
          mapping: e.mapping && Object.keys(e.mapping).length ? e.mapping : null, exact: exactView(e.exact),
          actor: d.actor ? { text: d.actor.text, exact: exactView(d.actor.exact) } : null, when: d.when.map(w => ({ text: w.text, exact: exactView(w.exact) })),
          effects: (d.effects || []).map(f => ({ text: f.text, component: f.component || null, object: f.object || null, connection: f.connection || null, exact: exactView(f.exact) })) };
      });
      return { id: o.id, name: o.name, summary: o.summary, story: o.story, start: o.start || null, exact: exactView(o.exact),
        owners: o.owners.map(w => ({ component: w.component, role: w.role, exact: exactView(w.exact) })),
        terms: (o.terms || []).map(t => ({ term: t.term, meaning: t.meaning, exact: exactView(t.exact) })),
        exits: (o.exits || []).map(x => ({ from: x.from, label: x.label, text: x.text, object: x.object || null, component: x.component || null, path: x.path || 'alternative', exact: exactView(x.exact) })),
        nodes, edges, layouts: { wide: layoutView(readable(layouts['wide:' + o.id], layouts['narrow:' + o.id])), narrow: layoutView(layouts['narrow:' + o.id]) },
        exclusions: [...(graph.exclusions?.states || []), ...(graph.exclusions?.transitions || [])].map(x => ({ reason: x.reason, exact: exactView(x.exact) })) };
    }),
    scenarios: (input.scenarios || []).map(s => ({ id: s.id, title: s.title, intro: s.intro, steps: s.steps }))
  };
  return renderPages(data);
}
