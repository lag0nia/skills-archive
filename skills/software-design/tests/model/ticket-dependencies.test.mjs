import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzeTicketDependencies as analyze } from '../../scripts/lib/model/ticket-dependencies.mjs';
const id = (n) => `TICKET-${String(n).padStart(4, '0')}`;
const t = (n, deps = [], extra = {}) => ({ id: id(n), title: `Question ${n}`, status: 'todo', depends_on: deps.map(id), ...extra });
const q = (r, n) => r.questions.find((q) => q.id === id(n));
test('crossed topics retain internal order, outside roots, facts and independent branches', () => {
  const records = [t(1), t(2,[3]), t(3,[5]), t(4,[1]), t(5), t(6,[],{blocked_by:['Bank confirmation']}),t(7,[6])];
  const before = JSON.stringify(records);
  const r = analyze(records,[1,2,3,4,6,7].map(id));
  assert.equal(q(r,1).disposition,'answer-now');
  assert.equal(q(r,4).disposition,'answer-after');
  assert.equal(q(r,2).disposition,'waiting');
  assert.deepEqual(q(r,2).internalPrerequisites,[id(3)]);
  assert.deepEqual(q(r,2).causes[0].path,[id(2),id(3),id(5)]);
  assert.deepEqual(r.outsideNotices[0].affected.map((a)=>a.id),[id(2),id(3)]);
  assert.equal(q(r,7).causes[0].kind,'external-fact');
  assert.equal(JSON.stringify(records),before);
  assert.deepEqual(analyze([...records].reverse(),[7,6,4,3,2,1].map(id)),r);
  const crossed = analyze([t(1),t(2,[3]),t(3),t(4,[1])],[1,2,3,4].map(id));
  assert.equal(crossed.findings.length,0);
  assert.ok(crossed.prerequisiteOrder.indexOf(id(3)) < crossed.prerequisiteOrder.indexOf(id(2)));
});
test('omission and empty blockers agree; malformed and misplaced blockers are localized',()=>{
  assert.deepEqual(analyze([t(1)],[id(1)]),analyze([t(1,[],{blocked_by:[]})],[id(1)]));
  for(const blocked_by of [null,'text',[null],[''],[id(9)]]) {
    const r=analyze([t(1,[],{blocked_by}),t(2)],[id(1),id(2)]);
    assert.equal(q(r,1).disposition,'needs-review'); assert.equal(q(r,2).disposition,'answer-now');
  }
});
test('approved boundaries preserve settled context and report historical leads',()=>{
  for(const status of ['finished','decided']) {
    const r=analyze([t(1,[2]),t(2,[3],{status,resolution:'Approved choice',blocked_by:['Old fact']}),t(3,[2])],[id(1)]);
    assert.equal(q(r,1).disposition,'answer-now');
    assert.deepEqual(q(r,1).approvedContext,[id(2)]);
    assert.ok(r.findings.some(f=>f.code==='cycle'));
    assert.ok(r.findings.some(f=>f.code==='settled-prerequisite-review'));
    assert.ok(r.findings.some(f=>f.code==='settled-blocker-review'));
    assert.equal(r.outsideNotices.length,0);
  }
  assert.equal(q(analyze([t(1,[],{status:'decided',resolution:' '})],[id(1)]),1).disposition,'needs-review');
});
test('deferred and excluded questions retain disposition and do not satisfy dependents',()=>{
  for(const status of ['deferred','out-of-scope']) {
    const r=analyze([t(1,[2]),t(2,[],{status,resume_when:'Later'})],[id(1),id(2)]);
    assert.equal(q(r,2).disposition,status); assert.equal(q(r,1).disposition,'needs-review');
  }
});
test('missing, archived, duplicate and malformed dependencies require localized review',()=>{
  for(const records of [[t(1,[2])],[t(1,[2]),t(2,[],{record_state:'archived'})],[t(1,[2]),t(2),t(2)], [t(1,[],{depends_on:'bad'})]]) {
    const r=analyze([...records,t(3)],[id(1),id(3)]);
    assert.equal(q(r,1).disposition,'needs-review'); assert.equal(q(r,3).disposition,'answer-now');
  }
});
test('unresolved cycles and their dependents have no invented order; unrelated cycles stay out',()=>{
  const records=[t(1,[2]),t(2,[1]),t(3,[1]),t(4),t(5,[5])];
  const r=analyze(records,[1,2,3,4].map(id));
  for(const n of [1,2,3]) assert.equal(q(r,n).disposition,'needs-review');
  assert.deepEqual(r.prerequisiteOrder,[id(4)]);
  assert.deepEqual(analyze(records,[id(4)]).findings,[]);
  assert.ok(analyze(records,[id(5)]).findings.some(f=>f.code==='self-dependency'));
});
test('all-in-document chains and shared diamonds retain one path per cause',()=>{
  const r=analyze([t(1,[2,3]),t(2,[4]),t(3,[4]),t(4)],[1,2,3,4].map(id));
  assert.deepEqual(r.prerequisiteOrder,[4,2,3,1].map(id));
  assert.deepEqual(q(r,1).internalPrerequisites,[2,3,4].map(id));
  assert.equal(q(analyze([t(1,[2,3]),t(2,[4]),t(3,[4]),t(4)],[id(1)]),1).causes.filter(c=>c.source===id(4)).length,1);
});

test('identical fact text on different source tickets stays distinct', () => {
  const fact = 'Confirm the accepted format.';
  const records = [t(1, [2, 3]), t(2, [], { blocked_by: [fact] }), t(3, [], { blocked_by: [fact] }), t(4)];
  const report = analyze(records, [1, 2, 3, 4].map(id));
  assert.equal(report.outsideNotices.length, 2);
  assert.deepEqual(report.outsideNotices.map((notice) => notice.sources), [[id(2)], [id(3)]]);
  assert.deepEqual(report.outsideNotices.map((notice) => notice.affected.map((item) => item.id)), [[id(1), id(2)], [id(1), id(3)]]);
  assert.equal(q(report, 4).disposition, 'answer-now');
  assert.deepEqual(q(report, 4).causes, []);
});

test('one source fact propagated through a diamond has unique affected questions and deterministic paths', () => {
  const records = [t(1, [3, 2]), t(2, [4]), t(3, [4]), t(4, [], { blocked_by: ['Bank confirmation', 'Bank confirmation'] }), t(5)];
  const report = analyze(records, [1, 2, 3, 4, 5, 1].map(id));
  assert.equal(report.outsideNotices.length, 1);
  assert.deepEqual(report.outsideNotices[0].sources, [id(4)]);
  assert.deepEqual(report.outsideNotices[0].affected, [
    { id: id(1), path: [1, 2, 4].map(id) },
    { id: id(2), path: [2, 4].map(id) },
    { id: id(3), path: [3, 4].map(id) },
    { id: id(4), path: [id(4)] },
  ]);
  assert.deepEqual(analyze([...records].reverse(), [5, 4, 3, 2, 1].map(id)), report);
  assert.equal(q(report, 5).disposition, 'answer-now');
  assert.deepEqual(q(report, 5).causes, []);
});
