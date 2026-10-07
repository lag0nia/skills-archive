import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
const command=fileURLToPath(new URL('../../scripts/report-ticket-answerability.mjs',import.meta.url));
test('CLI works outside skill, ignores unrelated metadata, stays read-only, and fails honestly',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'answerability-'));
 try {
  const dir=path.join(root,'build/workflow/tickets');fs.mkdirSync(dir,{recursive:true});
  const file=path.join(dir,'cross-domain-tickets.yaml');
  const body='ticket_file_version: 3\nscope: "cross-domain"\ntickets:\n  - id: "TICKET-0001"\n    title: "Choice"\n    status: "todo"\n    depends_on: ["TICKET-0002"]\n  - id: "TICKET-0002"\n    status: "todo"\n    depends_on: []\n';
  fs.writeFileSync(file,body);
  const run=(args)=>spawnSync(process.execPath,[command,'--root',root,...args],{cwd:os.tmpdir(),encoding:'utf8'});
  const result=run(['--ticket','TICKET-0001','--json']);
  assert.equal(result.status,0,result.stderr); assert.equal(JSON.parse(result.stdout).questions[0].disposition,'waiting');
  assert.match(run(['--all']).stdout,/Answer after/);
  for(const args of [[],['--all','--ticket','TICKET-0001'],['--ticket'],['--ticket','bad'],['--unknown']]) assert.equal(run(args).status,1);
  assert.equal(fs.readFileSync(file,'utf8'),body);
  const corrupt=path.join(dir,'broken-tickets.yaml'); fs.writeFileSync(corrupt,'ticket_file_version: 3\nscope: "x"\ntickets:\n  - id: "TICKET-0003"\n    depends_on: [bad]\n');
  assert.equal(run(['--ticket','TICKET-0001','--json']).status,1);
  assert.equal(run(['--all','--json']).stdout,'');
  assert.equal(fs.readFileSync(file,'utf8'),body);
  assert.deepEqual(fs.readdirSync(dir).sort(),['broken-tickets.yaml','cross-domain-tickets.yaml']);
 } finally {fs.rmSync(root,{recursive:true,force:true});}
});

test('CLI rejects missing and empty inventories explicitly without writing or reporting success', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'answerability-inventory-'));
  const inventory = path.join(root, 'build/workflow/tickets');
  const run = (selection, json) => spawnSync(process.execPath,
    [command, '--root', root, ...selection, ...(json ? ['--json'] : [])],
    { cwd: os.tmpdir(), encoding: 'utf8' });
  const expectFailure = (message) => {
    for (const selection of [['--all'], ['--ticket', 'TICKET-0001']]) {
      for (const json of [false, true]) {
        const result = run(selection, json);
        assert.equal(result.status, 1);
        assert.equal(result.stdout, '');
        assert.match(result.stderr, message);
        assert.ok(result.stderr.includes(inventory));
      }
    }
  };
  try {
    expectFailure(/Ticket inventory directory is missing/);
    assert.deepEqual(fs.readdirSync(root), []);
    fs.mkdirSync(inventory, { recursive: true });
    expectFailure(/No recognized ticket files/);
    assert.deepEqual(fs.readdirSync(inventory), []);
    const otherFile = path.join(inventory, 'notes.txt');
    fs.writeFileSync(otherFile, 'Unrelated notes.\n');
    expectFailure(/No recognized ticket files/);
    assert.deepEqual(fs.readdirSync(inventory), ['notes.txt']);
    assert.equal(fs.readFileSync(otherFile, 'utf8'), 'Unrelated notes.\n');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
