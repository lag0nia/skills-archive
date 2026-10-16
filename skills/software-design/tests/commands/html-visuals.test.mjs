import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import test from 'node:test';
import { generateVisuals, buildModel, dependencyGraph, splitCells } from '../../scripts/generate-visuals.mjs';
import { sourceTables } from '../../scripts/lib/visual-graphs.mjs';
function fixture(t) {
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'html-design-'));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const write=(file,text)=>{const p=path.join(root,file);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,text)};
 write('system-model/architecture.md','---\ntype: system-architecture\ndesign_format: 2\n---\n');
 write('system-model/domains/example/domain.md','---\ntype: system-domain\nid: DOMAIN-example\nname: Example\nresponsibilities: "SR-001"\n---\n## Purpose\nOwn the example.\n');
 write('system-model/domains/example/responsibilities/sr-001-example.md','---\ntype: system-responsibility\nid: SR-001\nname: Example responsibility\n---\n## Purpose\nValidate an exact request.\n');
 for(const [id,deps] of [['BU-001',''],['BU-002','BU-001'],['BU-003','BU-001, BU-002']])write('build/units/'+id+'.md',`---\ntype: build-unit\nid: ${id}\nname: ${id}\ndepends_on_build_units: "${deps}"\n---\n## Build Unit Overview\nA buildable artifact with a precise responsibility.\n`);
 write('system-model/contracts/states/state-001.md',`---\ntype: system-state\nid: STATE-001\nname: Request\n---\n## Authority And Identity\nExact request identity.\n## States\n| State | Meaning |\n| --- | --- |\n| New | Not submitted |\n| Done | Final |\n## Intent Transitions\n| From | Event | Authority | To | Guard and lock action |\n| --- | --- | --- | --- | --- |\n| New | accepted | SR-001 | Done | exact \\| binding and finality |\n## Account Transitions\n| From | Event or fact | Authority | To | Guard |\n| --- | --- | --- | --- | --- |\n| Done | reorg | Observer | New | positive canonical correction |\n## Extra Rule\nNever infer success from a timeout.\n## Observation And Finality\nIndependent exact evidence.\n## Invalid Transitions\nNo blind retry.\n`);
 write('system-model/behavior/flows/flow-001.md','---\nid: FLOW-001\nname: Accepted request\n---\n## Ordered Transitions\n| Step | Actor | Action |\n| --- | --- | --- |\n| 1 | Participant | Approve exact request |\n## Failure And Reroute\nRetry only with evidence.\n');
 return {root,write};
}
test('canonical state tables keep exact cells and every transition row is counted; retired projections are gone',t=>{
 const {root}=fixture(t);const model=buildModel(root);
 assert.deepEqual(Object.keys(model).sort(),['sequence','states','units']);assert.equal(model.sequence,null,'no delivery sequence exists before Stage 9');
 assert.deepEqual(model.states[0],{id:'STATE-001',file:'system-model/contracts/states/state-001.md',transitions:{rows:model.states[0].transitions.rows}});
 assert.equal(model.states[0].transitions.rows.length,2);
 const tables=sourceTables(fs.readFileSync(path.join(root,'system-model/contracts/states/state-001.md'),'utf8'));
 assert.deepEqual(tables.filter(table=>table.headers[0]==='From').map(table=>table.heading),['Intent Transitions','Account Transitions']);
 assert.equal(tables.find(table=>table.heading==='Intent Transitions').rows[0][4],'exact \\| binding and finality');
 assert.equal(model.units[0].inputs,undefined);
 assert.deepEqual(generateVisuals(root).generated,['maps/build-unit-dependencies.html']);assert.equal(generateVisuals(root,{check:true}).transitions,2);
 assert.equal(fs.existsSync(path.join(root,'visuals/index.html')),false,'No gallery is produced without an explorer model');
 assert.throws(()=>generateVisuals(root,{views:['explorer']}),/explorer requires reviewed visuals\/assets\/explorer.json/);
 assert.throws(()=>generateVisuals(root,{views:['states']}),/Unknown visual selection/);
});
test('retired participant registry and reading helper are refused rather than fingerprinted',t=>{
 const {root,write}=fixture(t);generateVisuals(root);
 for(const retired of ['visuals/assets/participants.json','visuals/assets/lib/visual-reading.mjs']){write(retired,'{}');assert.throws(()=>generateVisuals(root,{check:true}),/Retired visual input/);fs.rmSync(path.join(root,retired));}
 assert.equal(generateVisuals(root,{check:true}).transitions,2);
});
test('dependency reduction preserves all prerequisites and rejects cycles or unknown units',()=>{
 const units=[{id:'BU-001',depends:[]},{id:'BU-002',depends:['BU-001']},{id:'BU-003',depends:['BU-001','BU-002']}];
 assert.deepEqual(dependencyGraph(units),{levels:{'BU-001':0,'BU-002':1,'BU-003':2},edges:[{from:'BU-001',to:'BU-002'},{from:'BU-002',to:'BU-003'}]});
 assert.deepEqual(units[2].depends,['BU-001','BU-002']);
 assert.throws(()=>dependencyGraph([{id:'BU-001',depends:['BU-001']}]),/cycle/);
 assert.throws(()=>dependencyGraph([{id:'BU-001',depends:['BU-999']}]),/Unknown/);
});
test('controlled source change refuses stale output, regenerates exact content, and detects output edits/deleted sources',t=>{
 const {root,write}=fixture(t);generateVisuals(root);
 const file='build/units/BU-002.md',output=path.join(root,'visuals/maps/build-unit-dependencies.html');const before=fs.readFileSync(path.join(root,file),'utf8');
 write(file,before.replace('A buildable artifact with a precise responsibility.','An exactly reviewed replacement artifact.'));
 assert.throws(()=>generateVisuals(root,{check:true}),/Stale source/);
 generateVisuals(root);assert.equal(generateVisuals(root,{check:true}).checked,true);
 assert.match(fs.readFileSync(output,'utf8'),/exactly reviewed replacement/);
 fs.appendFileSync(output,'unreviewed change');assert.throws(()=>generateVisuals(root,{check:true}),/modified output|Regeneration differs/);
 generateVisuals(root);fs.unlinkSync(path.join(root,'system-model/behavior/flows/flow-001.md'));assert.throws(()=>generateVisuals(root,{check:true}),/Stale source/);
});
test('legacy format is explicitly rejected and code-span pipes remain a single cell',t=>{
 const {root,write}=fixture(t);write('system-model/architecture.md','---\ntype: system-architecture\n---\n');assert.throws(()=>generateVisuals(root),/design_format: 2/);
 assert.deepEqual(splitCells('| `a|b` | c \\| d |'),['`a|b`','c \\| d']);
});
