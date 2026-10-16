import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import test from 'node:test';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {validateImplementationDetailTickets} from '../../scripts/validate-implementation-detail-tickets.mjs';
import {assertCurrentFormat,currentFormatError} from '../../scripts/lib/model/package-format.mjs';
import {noncanonicalLayoutEntries} from '../../scripts/lib/model/package-layout.mjs';
import {buildTicketInventoryLeadReport} from '../../scripts/report-ticket-inventory-leads.mjs';
import {dispatchProjection} from '../../scripts/lib/ticket-projection/core.mjs';
const scripts=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','..','scripts');
const RETIRED=/retired; migrate the package with an earlier Software Design release/;
function fixture(t){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'design-v2-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const write=(f,v)=>{const p=path.join(root,f);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,v)};
 write('system-model/architecture.md','---\ntype: system-architecture\ndesign_format: 2\n---\n');
 write('system-model/domains/example/domain.md','---\ntype: system-domain\nid: DOMAIN-example\nname: Example\nresponsibilities: "SR-001"\n---\n');
 write('system-model/domains/example/responsibilities/sr-001-example.md','---\ntype: system-responsibility\nid: SR-001\nname: Example\ndomain: example\n---\n');
 const ticket='build/workflow/tickets/example/sr-001/sr-001-tickets.yaml';
 const body=`ticket_file_version: 4
scope: "responsibility:SR-001"
tickets:
  - id: "TICKET-0001"
    title: "Choose the exact representation"
    status: "todo"
    kind: "technical"
    complexity: "medium"
    concern: "data-model"
    owner: "SR-001"
    affects: ["SR-001"]
    build_units: []
    build_unit_disposition: "Realization mapping has not started."
    repositories: []
    repository_contract_area: null
    cluster: "representation"
    question: "Which representation preserves the approved request boundary?"
    context: "The responsibility boundary is approved and its representation is undecided."
    candidate_proof: "An implementer cannot finish or verify request persistence without choosing the exact representation, and the current package does not already choose it."
    options: ["Representation A", "Representation B"]
    recommendation: "Use Representation A."
    resolution: null
    result_refs: []
    constraint_refs: []
    depends_on: []
    write_targets: ["system-model/domains/example/responsibilities/sr-001-example.md"]
`;
 write(ticket,body);return {root,write,ticket,body};
}
test('format2 owns tickets directly and inventory reports no retired parent grouping',t=>{
 const {root}=fixture(t);assert.equal(currentFormatError(root),null);assert.doesNotThrow(()=>assertCurrentFormat(root,'sync'));assert.deepEqual(validateImplementationDetailTickets(root).errors,[]);
 const report=buildTicketInventoryLeadReport(root);assert.equal(report.ticketCount,1);for(const key of ['format','linkedTicketCount','independentTicketCount'])assert.equal(Object.hasOwn(report,key),false,key);assert.deepEqual(Object.keys(report.ownership[0]).sort(),['domain','id','name','total']);
});
test('a missing, implicit or unsupported design format is rejected before anything is read',t=>{
 const {root,write}=fixture(t);
 for(const [architecture,found] of [[null,/architecture\.md is missing/],['---\ntype: system-architecture\n---\n',/design_format is missing/],['---\ntype: system-architecture\ndesign_format: 1\n---\n',/unsupported design_format 1/],['---\ntype: system-architecture\ndesign_format: 3\n---\n',/unsupported design_format 3/]]){
  if(architecture===null)fs.rmSync(path.join(root,'system-model/architecture.md'));else write('system-model/architecture.md',architecture);
  assert.match(currentFormatError(root),found);assert.match(currentFormatError(root),RETIRED);
  assert.throws(()=>assertCurrentFormat(root,'sync'),error=>error.message.startsWith('sync: ')&&RETIRED.test(error.message));
  const result=validateImplementationDetailTickets(root);assert.equal(result.errors.length,1);assert.match(result.errors[0],found);
 }
});
test('schema 3, parent_decision and a Technical Decision registry are validator errors, never throws or silent passes',t=>{
 const {root,write,ticket,body}=fixture(t);
 write(ticket,body.replace('version: 4','version: 3'));assert.match(validateImplementationDetailTickets(root).errors.join('\n'),/ticket_file_version 3 is retired; current ticket files use ticket_file_version: 4/);
 write(ticket,body.replace('version: 4','version: 5'));assert.match(validateImplementationDetailTickets(root).errors.join('\n'),/ticket_file_version must be 4/);
 for(const value of ['null','"TD-001"']){write(ticket,body+'    parent_decision: '+value+'\n');assert.match(validateImplementationDetailTickets(root).errors.join('\n'),/TICKET-0001: parent_decision is retired with the Technical Decision registry/);}
 write(ticket,body);write('build/workflow/technical-decisions.yaml','technical_decision_file_version: 1\ndecisions: []\n');
 let result;assert.doesNotThrow(()=>{result=validateImplementationDetailTickets(root);});assert.deepEqual(result.errors,['build/workflow/technical-decisions.yaml is a retired Technical Decision registry; its information belongs to domains, responsibilities, contracts, tickets and scope records. Move it to those owners and remove the file.']);
 assert.ok(noncanonicalLayoutEntries(root).includes('build/workflow/technical-decisions.yaml'));
});
test('out-of-scope requires owner-local reason, revisit condition and a real scope target',t=>{
 const {root,write,ticket,body}=fixture(t);const excluded=body.replace('status: "todo"','status: "out-of-scope"');write(ticket,excluded);const errors=validateImplementationDetailTickets(root).errors.join('\n');assert.match(errors,/scope_reason/);assert.match(errors,/TICKET-0001: out-of-scope tickets require resume_when\./);assert.doesNotMatch(errors,/standalone/);
 const scope='system-model/contracts/scope/scope-001-example.md';write(scope,'---\ntype: system-scope-boundary\nid: SCOPE-001\n---\nApproved exclusion.');write(ticket,excluded.replace('write_targets: [','write_targets: ["'+scope+'",')+'    scope_reason: "The capability is excluded from the approved target."\n    resume_when: "Before offering the excluded capability."\n');assert.deepEqual(validateImplementationDetailTickets(root).errors,[]);
});
test('every package command rejects a retired-format package with one retirement message and no stack trace',t=>{
 const {root,write,ticket,body}=fixture(t);
 write('system-model/architecture.md','---\ntype: system-architecture\n---\n');write(ticket,body.replace('version: 4','version: 3')+'    parent_decision: null\n');
 write('build/workflow/technical-decisions.yaml','technical_decision_file_version: 1\ndecisions: []\n');write('diagrams/build-unit-dependency-map.canvas','{"nodes":[],"edges":[]}\n');
 write('build/units/bu-001-example.md','---\ntype: build-unit\nid: BU-001\nname: Example\n---\n');write('build/records/constraints/README.md','# Constraints\n');
 const commands=[
  ['validate-software-design-structure.mjs'],['validate-implementation-detail-tickets.mjs'],['validate-technical-constraints.mjs'],['sync-technical-constraint-sources.mjs'],
  ['validate-build-design.mjs'],['validate-delivery-readiness.mjs'],['validate-handoff-sequence.mjs'],['validate-build-unit-dependency-map.mjs'],
  ['report-ticket-inventory-leads.mjs'],['report-ticket-answerability.mjs','--all'],['report-build-unit-readiness-reconciliation.mjs','--units','BU-001','--assert-ready'],
  ['generate-decision-overview.mjs','--check'],['delivery-snapshot.mjs','--handoff','build/workflow/handoffs/repo-001-example.md','--check'],
 ];
 const before=fs.readdirSync(root,{recursive:true}).sort();
 for(const [script,...args] of commands){
  const result=spawnSync(process.execPath,[path.join(scripts,script),'--root',root,...args],{encoding:'utf8'});
  assert.equal(result.status,1,script);assert.match(result.stderr,/design_format is missing/,script);assert.match(result.stderr,RETIRED,script);
  assert.doesNotMatch(result.stderr,/^\s+at /m,script);assert.equal(result.stdout,'',script);
 }
 assert.deepEqual(fs.readdirSync(root,{recursive:true}).sort(),before);
});
test('every projection operation rejects a retired-format package before any provider call',async t=>{
 const {root,write}=fixture(t);write('system-model/architecture.md','---\ntype: system-architecture\n---\n');
 const adapter=new Proxy({},{get:(_target,name)=>()=>{throw new Error('provider call '+String(name));}});
 const config={provider:'github',ticketRoot:path.basename(root),repository:'owner/repository',project:'owner/1',syncBranch:'main'};
 for(const operation of ['sync','reconcile','project-view-audit','pending-comments','publish-draft','post-summaries'])await assert.rejects(dispatchProjection({operation,config,cwd:path.dirname(root),adapter}),error=>error.message.startsWith(operation+': ')&&RETIRED.test(error.message),operation);
});
test('the projection command line rejects a retired-format package before GitHub sign-in or the sync lock',t=>{
 const workspace=fs.mkdtempSync(path.join(os.tmpdir(),'design-cli-'));t.after(()=>fs.rmSync(workspace,{recursive:true,force:true}));
 fs.mkdirSync(path.join(workspace,'design/system-model'),{recursive:true});fs.writeFileSync(path.join(workspace,'design/system-model/architecture.md'),'---\ntype: system-architecture\n---\n');
 fs.writeFileSync(path.join(workspace,'software-design-ticket-projection.json'),JSON.stringify({provider:'github',ticketRoot:'design',repository:'owner/repository',project:'owner/1',syncBranch:'main'}));
 const bin=path.join(workspace,'bin'),log=path.join(workspace,'provider.log');fs.mkdirSync(bin);
 for(const name of ['gh','git'])fs.writeFileSync(path.join(bin,name),`#!${process.execPath}\nrequire('node:fs').appendFileSync(${JSON.stringify(log)},${JSON.stringify(name)}+' '+process.argv.slice(2).join(' ')+'\\n');process.exit(9);\n`,{mode:0o755});
 for(const args of [['sync'],['sync','--views-only'],['sync','--fields-only'],['reconcile'],['project-view-audit'],['pending-comments']]){
  const result=spawnSync(process.execPath,[path.join(scripts,'ticket-projection.mjs'),...args],{cwd:workspace,env:{...process.env,PATH:bin+path.delimiter+process.env.PATH},encoding:'utf8'});
  assert.equal(result.status,1,args.join(' '));assert.match(result.stderr,new RegExp('^'+args[0]+': .*design_format is missing'),args.join(' '));assert.match(result.stderr,RETIRED,args.join(' '));
  assert.doesNotMatch(result.stderr,/^\s+at /m,args.join(' '));
 }
 assert.equal(fs.existsSync(log),false,'no gh or git call');
 assert.deepEqual(fs.readdirSync(workspace).sort(),['bin','design','software-design-ticket-projection.json']);
});
