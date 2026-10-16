import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { validateUpstreamDependency, validateCapabilityFeasibility } from '../../scripts/lib/validation/planned-dependencies.mjs';
import { validatePlannableHandoff } from '../../scripts/lib/validation/handoff-sequence.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'planned-dependencies-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const dir = path.join(root, 'build/workflow/handoffs');
  fs.mkdirSync(dir, { recursive: true });
  fs.mkdirSync(path.join(root, 'system-model/contracts/interfaces'), { recursive: true });
  fs.writeFileSync(path.join(root, 'system-model/architecture.md'), '---\ntype: system-architecture\ndesign_format: 2\n---\n\n# System Architecture\n');
  fs.writeFileSync(path.join(root, 'system-model/contracts/interfaces/iface-001.md'), '# IFACE-001\nApproved v2 contract.\n');
  fs.mkdirSync(path.join(root, 'build/units'), { recursive: true });
  const rows = ['a', 'b', 'c'].map((name, i) => ({ slug: `repo-00${i+1}-${name}`, orderGroup: i+1, buildUnits: [`BU-00${i+1}`], target: path.join(dir, `repo-00${i+1}-${name}.md`), requires: i ? [`repo-00${i}-${['a','b'][i-1]}`] : [] }));
  for (const [i, row] of rows.entries()) {
    fs.writeFileSync(path.join(root, 'build/units', `bu-00${i+1}.md`), `---\nid: BU-00${i+1}\nrepository: REPO-00${i+1}\ndepends_on_build_units: "${i ? `BU-00${i}` : 'None.'}"\n---\n`);
    fs.writeFileSync(row.target, `# Handoff\n**Outcome:** \`IMPLEMENTATION_DETAILS_READY\`\n**Writable build units:** \`BUILD_UNIT:BU-00${i+1}\`\n### OUTPUT-001\n**Output:** API ${i+1}\n**Contract:** v2\n**Contract authority:** [IFACE](../../../system-model/contracts/interfaces/iface-001.md)\n**Owner:** \`BUILD_UNIT:BU-00${i+1}\`\n**Writable paths:** \`src\`\n**Verification:** Run actual public consumer proof.\n`);
  }
  fs.writeFileSync(path.join(dir,'README.md'), `# Handoff Sequence\n\n**Current order group:** \`1\`\n\n| Order group | Delivery slice | Repository | Build Units | Requires | State |\n| --- | --- | --- | --- | --- | --- |\n${rows.map((row,i)=>`| ${i+1} | [${row.slug}](./${path.basename(row.target)}) | REPO-00${i+1} | BU-00${i+1} | ${row.requires.join(', ') || 'None.'} | ${i ? 'Waiting' : 'Ready'} |`).join('\n')}\n`);
  const entry = (i) => ({ id:'INPUT-001', body:`**Consumer:** \`BUILD_UNIT:BU-00${i+1}\`\n**Produced by:** \`BUILD_UNIT:BU-00${i}\`\n**Availability:** \`planned upstream output\`\n**Maturity:** \`not-applicable\`\n**Producer handoff:** [Output](./${path.basename(rows[i-1].target)}#output-001)\n**Expected output:** API ${i}\n**Expected contract:** v2\n**Consumption point:** Phase 1 public client\n**Availability check:** Acquire output and run compatible public-consumer proof before Phase 1.\n**Artifact identity:** \`None.\`\n**Source revision:** \`None.\`\n**Integrity:** \`None.\`\n**Resolution check:** \`None.\`\n**Authorized access check:** \`None.\`\n` });
  const validate = (i, mode='planning', e=entry(i), customRows=rows) => { const errors=[]; validateUpstreamDependency({entry:e, handoffPath:rows[i].target, rows:customRows, writableScopes:[`BUILD_UNIT:BU-00${i+1}`],mode,errors});return errors; };
  return {root, rows, entry, validate, dir};
}
test('A -> B -> C sequence accepts planning selection upfront and B/C dependency contracts, but execution waits', t => {
  const f=fixture(t);
  for (const row of f.rows) assert.deepEqual(validatePlannableHandoff(f.root,row.target,{validationMode:'planning'}).errors,[]);
  for (const i of [1,2]) {
    assert.deepEqual(f.validate(i),[]);
    assert.match(f.validate(i,'execution').join('\n'),/awaits actual compatible/);
    assert.ok(validatePlannableHandoff(f.root,f.rows[i].target).errors.length);
  }
});
test('compatible actual receipt and independent consumer proof satisfy the planned contract after reconciliation', t => {
  const f=fixture(t), e=f.entry(1);
  fs.writeFileSync(path.join(f.dir,'receipt.txt'),`**Outcome:** \`COMPLETE\`\n**Output:** API 1\n**Contract:** v2\n**Producer:** \`BUILD_UNIT:BU-001\`\n**Executed snapshot:** \`sha256:${'a'.repeat(64)}\`\n**Executed workpack content:** \`sha256:${'b'.repeat(64)}\`\n`);
  fs.writeFileSync(path.join(f.dir,'proof.txt'),'**Outcome:** `PASS`\n**Output:** API 1\n**Contract:** v2\n**Consumer:** `BUILD_UNIT:BU-002`\n');
  e.body=e.body.replace('`planned upstream output`','`verified existing input`').replace('`not-applicable`','`verified`')+'**Upstream receipt:** [Observed producer](./receipt.txt)\n**Availability evidence:** [Observed consumer](./proof.txt)\n';
  assert.deepEqual(f.validate(1,'execution',e),[]);
  fs.writeFileSync(path.join(f.dir,'receipt.txt'),fs.readFileSync(path.join(f.dir,'receipt.txt'),'utf8').replace('v2','v1'));
  assert.match(f.validate(1,'execution',e).join('\n'),/matching completed producer receipt/);
});
for (const [name,mutate,pattern] of [
 ['unknown producer', e=>e.body=e.body.replace('BU-001','BU-999'),/earlier directly required/],
 ['unsupported future declaration', e=>e.body=e.body.replace('#output-001','#output-999'),/exact OUTPUT/],
 ['contract mismatch', e=>e.body=e.body.replace('v2','v3'),/incompatible output/],
 ['fabricated integrity', e=>e.body=e.body.replace('**Integrity:** `None.`','**Integrity:** `sha256:fake`'),/cannot fabricate/],
 ['fabricated verification', e=>e.body+='**Consumer challenge:** `PASS` — pretend test ran\n',/must remain Planned/],
 ['authority substitution', (e,f)=>{const p=f.rows[0].target;fs.writeFileSync(p,fs.readFileSync(p,'utf8').replace('../../../system-model/contracts/interfaces/iface-001.md','./README.md'));},/canonical approved contract/],
 ['older Implemented row alone', e=>e.body=e.body.replace('`planned upstream output`','`verified existing input`'),/matching completed producer receipt/],
]) test(name+' fails',t=>{const f=fixture(t),e=f.entry(1);mutate(e,f);assert.match(f.validate(1,'planning',e).join('\n'),pattern);});
test('sequence dependency cycle remains a planning blocker', t=>{const f=fixture(t),p=path.join(f.dir,'README.md');fs.writeFileSync(p,fs.readFileSync(p,'utf8').replace('| None. | Ready |','| repo-003-c | Ready |'));assert.match(validatePlannableHandoff(f.root,f.rows[2].target,{validationMode:'planning'}).errors.join('\n'),/cycle|same or a later/);});
function capability(t,{disposition='Selected-slice output',changes='`src/adapter.mjs`',ceiling='`src`'}={}) {
 const f=fixture(t),errors=[];
 const handoff=`## Allowed Delivery Slice\n**Writable paths:** ${ceiling}\n## Delivery Slice Realizability Review\n**Writable paths:** ${ceiling}\n### CAP-001\n**Capability:** Required assurance adapter\n**Disposition:** \`${disposition}\`\n**Owner:** \`BUILD_UNIT:BU-002\`\n**Allowed interface:** Public assurance adapter entrypoint\n**Required changes:** ${changes}\n**Evidence:** [Owner](./repo-002-b.md)\n**Verification:** Run mapped VE-001 through adapter.\n`;
 validateCapabilityFeasibility({handoff,handoffPath:f.rows[1].target,writableScopes:['BUILD_UNIT:BU-002'],entries:[],mode:'planning',errors});return errors;
}
test('required adapter creation is accepted only inside approved writable ceiling',t=>{
 assert.deepEqual(capability(t),[]);
 assert.match(capability(t,{changes:'`assurance/adapter.mjs`',ceiling:'`assurance/coverage.yaml`'}).join('\n'),/exceed.*ceiling/);
});
test('missing public implementation capability without settled permitted provider blocks planning',t=>{
 assert.match(capability(t,{disposition:'Unresolved',changes:'`None.`'}).join('\n'),/unresolved capability/);
 assert.match(capability(t,{disposition:'Planned upstream output',changes:'`None.`'}).join('\n'),/defined INPUT\/INT/);
});

test('receipt and consumer proof resolve their selected output anchors while inheriting exact summary identities',t=>{
 const f=fixture(t),e=f.entry(1);
 const identities=`**Outcome:** \`COMPLETE\`\n**Executed snapshot:** \`sha256:${'a'.repeat(64)}\`\n**Executed workpack content:** \`sha256:${'b'.repeat(64)}\`\n`;
 const required='## Required output\n**Output:** API 1\n**Contract:** v2\n**Producer:** `BUILD_UNIT:BU-001`\n';
 const unrelated='## Other output\n**Output:** Unrelated API\n**Contract:** other-v1\n**Producer:** `BUILD_UNIT:BU-001`\n';
 const proof='## Required output\n**Outcome:** `PASS`\n**Output:** API 1\n**Contract:** v2\n**Consumer:** `BUILD_UNIT:BU-002`\n';
 const proofOther='## Other output\n**Outcome:** `PASS`\n**Output:** Other API\n**Contract:** other-v1\n**Consumer:** `BUILD_UNIT:BU-003`\n';
 e.body=e.body.replace('`planned upstream output`','`verified existing input`').replace('`not-applicable`','`verified`')+'**Upstream receipt:** [Observed producer](./receipt.txt#required-output)\n**Availability evidence:** [Observed consumer](./proof.txt#required-output)\n';
 for(const reverse of [false,true]) {
  fs.writeFileSync(path.join(f.dir,'receipt.txt'),identities+(reverse?required+unrelated:unrelated+required));
  fs.writeFileSync(path.join(f.dir,'proof.txt'),reverse?proof+proofOther:proofOther+proof);
  assert.deepEqual(f.validate(1,'execution',e),[]);
 }
 const missing={...e,body:e.body.replace('receipt.txt#required-output','receipt.txt#missing-output')};assert.match(f.validate(1,'execution',missing).join('\n'),/matching completed producer receipt/);
 const wrong={...e,body:e.body.replace('proof.txt#required-output','proof.txt#other-output')};assert.match(f.validate(1,'execution',wrong).join('\n'),/consumer availability\/compatibility/);
 fs.appendFileSync(path.join(f.dir,'receipt.txt'),`\n**Executed snapshot:** \`sha256:${'c'.repeat(64)}\`\n`);assert.match(f.validate(1,'execution',e).join('\n'),/matching completed producer receipt/);
});

test('duplicate producer output declarations cannot substitute planning authority and helper modes fail closed',t=>{
 const f=fixture(t);fs.appendFileSync(f.rows[0].target,'\n'+fs.readFileSync(f.rows[0].target,'utf8').slice(fs.readFileSync(f.rows[0].target,'utf8').indexOf('### OUTPUT-001')));
 assert.match(f.validate(1).join('\n'),/exact OUTPUT/);
 assert.throws(()=>f.validate(1,'invalid'),/Unknown validation mode/);
});
