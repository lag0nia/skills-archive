import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { runtimeEvidenceErrors, prototypeIdentity, readRuntimeEvidence } from '../../scripts/lib/validation/prototype-runtime.mjs';
import { validateUiUxDesign } from '../../scripts/lib/validation/ui-ux-design.mjs';
import { capturePrototypeRuntime } from '../../scripts/capture-prototype-runtime.mjs';

function fixture(t) {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'prototype-runtime-'));
  const root = path.join(temporary, 'ui-ux');
  t.after(() => fs.rmSync(temporary, { recursive: true, force: true }));
  const candidate = path.join(root, 'alternatives/example');
  fs.mkdirSync(candidate, { recursive: true });
  fs.writeFileSync(path.join(candidate, 'index.html'), `<!doctype html><html lang="en"><meta name="viewport" content="width=device-width"><body>
<p data-prototype-disclosure>Simulated prototype</p><details data-prototype-reviewer open><summary>Review</summary><button data-review-state-target="one">One</button><button data-review-state-target="two">Two</button></details>
<main data-product-surface data-prototype-state="initial" data-demo-only="simulation"></main><script src="app.js"></script></body></html>`);
  fs.writeFileSync(path.join(candidate, 'app.js'), `const main=document.querySelector('main');
main.innerHTML='<p data-product-outcome>Ready</p>'+['action','next','cancel','recovery'].map(kind=>'<button data-'+({action:'product-action',next:'next-step',cancel:'cancel-action',recovery:'recovery-action'}[kind])+'>'+kind+'</button>').join('');
document.querySelectorAll('button').forEach(button=>button.onclick=()=>{const state=button.getAttribute('data-review-state-target')||'done-'+button.textContent;main.dataset.prototypeState=state;document.querySelector('[data-product-outcome]').textContent=state+' result';});`);
  return { root, candidate };
}

// Synthetic DOM observations exercise the receipt validator, not browser behavior.
function observations(identity) {
  const steps = ['action', 'next', 'cancel', 'recovery', 'one', 'two'].map((value) => {
    const review = ['one', 'two'].includes(value); const kind = review ? 'review' : value;
    const state = review ? value : 'done-' + value;
    const before = { page: identity.candidate + '/index.html', html: '<html><main></main></html>', states: ['initial'], outcomes: ['Ready'], control: { count: 1, tag: 'BUTTON', text: value, marker: true, target: review ? value : null, inReviewer: review, inProduct: !review, disabled: false }, reviewerTargets: [{ target: 'one', inside: true }, { target: 'two', inside: true }] };
    const after = structuredClone(before); after.states = [state]; after.outcomes = [state + ' result'];
    return { kind, page: identity.candidate + '/index.html', selector: 'button', action: 'click', expected: { state, outcome: state + ' result' }, before, after };
  });
  return { schema: 'prototype-runtime-observations', ...identity, capture: { tool: 'synthetic validator fixture', at: new Date().toISOString() }, errors: [], requests: [identity.candidate + '/index.html', identity.candidate + '/app.js'], steps };
}

test('receipt contract distinguishes transitions from element presence and checks exact identity', (t) => {
  const { root, candidate } = fixture(t); const identity = prototypeIdentity(root, candidate);
  fs.writeFileSync(path.join(root, 'specification.md'), 'Browser review recorded after capture.');
  assert.deepEqual(prototypeIdentity(root, candidate), identity, 'review prose must not invalidate unchanged runtime resources');
  const valid = observations(identity);
  assert.deepEqual(runtimeEvidenceErrors(valid, identity), []);
  const cases = [
    [e => e.steps = e.steps.filter(s => s.kind !== 'recovery'), /missing exercised recovery/],
    [e => e.steps[0].before.control.marker = false, /requires one visible/],
    [e => e.steps[0].after = structuredClone(e.steps[0].before), /no-op/],
    [e => e.steps[0].after.states = ['failed'], /expected state/],
    [e => e.steps[0].before.reviewerTargets[1].target = 'one', /distinct targets/],
    [e => e.steps[0].before.reviewerTargets[1].inside = false, /inside the reviewer/],
    [e => e.steps[4].before.control.inReviewer = false, /incorrect product\/reviewer/],
    [e => e.resources = 'sha256:' + '0'.repeat(64), /stale/],
    [e => e.candidate = 'alternatives/other', /mismatched/],
    [e => e.errors.push('page error'), /failed browser/],
    [e => e.requests.push('alternatives/other/runtime.js'), /bound resource inventory/],
    [e => e.requests = [], /resource-request provenance/],
    [e => e.steps[0].page = 'alternatives/other/index.html', /exact candidate/],
    [e => e.steps[0].before.control.count = 2, /requires one visible/],
    [e => e.steps[0].before.control.disabled = true, /requires one visible/],
    [e => e.steps[0].before.control.text = '', /meaningfully labelled/],
  ];
  for (const [change, pattern] of cases) { const receipt = structuredClone(valid); change(receipt); assert.match(runtimeEvidenceErrors(receipt, identity).join('\n'), pattern); }
  assert.ok(runtimeEvidenceErrors({ passed: true }, identity).length);
  assert.equal(readRuntimeEvidence(root, candidate), null);
  fs.writeFileSync(path.join(candidate, 'runtime-evidence.json'), JSON.stringify(valid));
  assert.deepEqual(readRuntimeEvidence(root, candidate).errors, []);
  for (const name of ['app.js', 'style.css', 'index.html']) {
    const file = path.join(candidate, name); const before = fs.existsSync(file) ? fs.readFileSync(file) : null;
    fs.writeFileSync(file, 'changed');
    assert.match(readRuntimeEvidence(root, candidate).errors.join('\n'), /stale/);
    if (before) fs.writeFileSync(file, before); else fs.unlinkSync(file);
  }
});

test('explicit real-browser capture verifies JavaScript rendering and rejects no-op behavior', { skip: !process.env.PROTOTYPE_PLAYWRIGHT }, async (t) => {
  const { chromium } = createRequire(import.meta.url)(process.env.PROTOTYPE_PLAYWRIGHT);
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await browser.newPage(); page.setDefaultTimeout(500);
  const { root, candidate } = fixture(t);
  const kinds = { action: 'product-action', next: 'next-step', cancel: 'cancel-action', recovery: 'recovery-action' };
  const steps = Object.entries(kinds).map(([kind, attribute]) => ({ page: 'alternatives/example/index.html', kind, selector: '[data-' + attribute + ']', expected: { state: 'done-' + kind, outcome: 'done-' + kind + ' result' } }));
  for (const target of ['one', 'two']) steps.push({ page: 'alternatives/example/index.html', kind: 'review', selector: '[data-review-state-target="' + target + '"]', expected: { state: target, outcome: target + ' result' } });
  const options = { page, uiRoot: root, candidateRoot: candidate, steps, tool: 'Playwright Chromium', timeout: 500 };
  const template = (name) => fs.readFileSync(new URL('../../references/ui-ux/templates/' + name, import.meta.url), 'utf8').replaceAll('alternatives/main/', 'alternatives/example/');
  fs.writeFileSync(path.join(root, 'specification.md'), template('specification.md')
    .replace('`Unresolved` — select a linked candidate entrypoint after review.', '`./alternatives/example/index.html`.')
    .replace('| Not reviewed | TBD |', '| Reviewed | Browser walkthrough and current canonical requirements reconciled. |'));
  fs.writeFileSync(path.join(root, 'prototype.html'), template('prototype.html'));
  assert.match(validateUiUxDesign(path.dirname(root)).errors.join('\n'), /meaningful product action/);
  const evidence = await capturePrototypeRuntime(options);
  assert.deepEqual(runtimeEvidenceErrors(evidence, prototypeIdentity(root, candidate)), []);
  assert.match(readRuntimeEvidence(root, candidate).html, /data-recovery-action/);
  assert.deepEqual(validateUiUxDesign(path.dirname(root)).errors, []);
  fs.appendFileSync(path.join(root, 'specification.md'), '\nAdditional review findings.\n');
  assert.deepEqual(validateUiUxDesign(path.dirname(root)).errors, [], 'recording review must not invalidate runtime evidence');
  fs.writeFileSync(path.join(candidate, 'runtime-evidence.json'), JSON.stringify({ ...evidence, candidate: 'alternatives/wrong' }));
  assert.match(validateUiUxDesign(path.dirname(root)).errors.join('\n'), /mismatched candidate/);
  fs.writeFileSync(path.join(candidate, 'runtime-evidence.json'), JSON.stringify(evidence));
  const script = path.join(candidate, 'app.js'); const working = fs.readFileSync(script, 'utf8');
  const htmlFile = path.join(candidate, 'index.html'); const originalHtml = fs.readFileSync(htmlFile, 'utf8');
  for (const [name, scriptDelta, html] of [
    ['no-op', '\ndocument.querySelector("[data-product-action]").onclick=()=>{};', originalHtml],
    ['missing interaction', '\ndocument.querySelector("[data-recovery-action]").remove();', originalHtml],
    ['failed transition', '\ndocument.querySelector("[data-product-action]").onclick=()=>{main.dataset.prototypeState="failed"};', originalHtml],
    ['duplicate targets', '', originalHtml.replace('data-review-state-target="two"', 'data-review-state-target="one"')],
    ['outside reviewer', '', originalHtml.replace('<button data-review-state-target="two">Two</button></details>', '</details><button data-review-state-target="two">Two</button>')],
  ]) {
    fs.writeFileSync(script, working + scriptDelta); fs.writeFileSync(htmlFile, html);
    await assert.rejects(capturePrototypeRuntime(options), undefined, name);
    assert.ok(readRuntimeEvidence(root, candidate).errors.length, name + ' must replace any prior passing receipt');
  }

});

test('real-browser root outcomes preserve visible transitions and product boundaries', { skip: !process.env.PROTOTYPE_PLAYWRIGHT }, async (t) => {
  const { chromium } = createRequire(import.meta.url)(process.env.PROTOTYPE_PLAYWRIGHT);
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  for (const variant of [
    { name: 'newly visible root outcome', surface: true, hidden: true, reveal: true, pass: true },
    { name: 'hidden root outcome', surface: true, hidden: true, reveal: false, pass: false },
    { name: 'transparent root outcome', surface: true, hidden: false, reveal: false, style: 'opacity:0', pass: false },
    { name: 'root under a hidden ancestor', surface: true, hidden: false, reveal: false, hiddenAncestor: true, pass: false },
    { name: 'unchanged visible root outcome', surface: true, hidden: false, reveal: false, pass: false, noOp: true },
    { name: 'newly visible descendant outcome', surface: false, descendant: true, hidden: true, reveal: true, pass: true },
    { name: 'outcome outside any product surface', surface: false, hidden: true, reveal: true, pass: false },
  ]) await t.test(variant.name, async (child) => {
    const { root, candidate } = fixture(child);
    const page = await browser.newPage(); page.setDefaultTimeout(1000);
    child.after(() => page.close());
    const htmlFile = path.join(candidate, 'index.html');
    const status = `<div id="status" data-product-outcome ${variant.surface ? 'data-product-surface' : ''} ${variant.hidden ? 'hidden' : ''} style="${variant.style || ''}" role="status">Recovery exported</div>`;
    const markup = variant.descendant ? `<section data-product-surface>${status}</section>` : variant.hiddenAncestor ? `<section hidden>${status}</section>` : status;
    fs.writeFileSync(htmlFile, fs.readFileSync(htmlFile, 'utf8').replace('<script src="app.js">', markup + '<script src="app.js">'));
    fs.appendFileSync(path.join(candidate, 'app.js'), `\ndocument.querySelector('[data-recovery-action]').onclick=()=>{${variant.reveal ? "setTimeout(()=>{document.querySelector('#status').hidden=false;},120);" : ''}};\n`);
    const steps = Object.entries({ action: 'product-action', next: 'next-step', cancel: 'cancel-action' }).map(([kind, attribute]) => ({ page: 'alternatives/example/index.html', kind, selector: '[data-' + attribute + ']', expected: { state: 'done-' + kind, outcome: 'done-' + kind + ' result' } }));
    for (const target of ['one', 'two']) steps.push({ page: 'alternatives/example/index.html', kind: 'review', selector: `[data-review-state-target="${target}"]`, expected: { state: target, outcome: target + ' result' } });
    steps.push({ page: 'alternatives/example/index.html', kind: 'recovery', selector: '[data-recovery-action]', expected: { state: 'initial', outcome: 'Recovery exported' } });
    const options = { page, uiRoot: root, candidateRoot: candidate, steps, tool: 'Playwright Chromium', timeout: 700 };
    if (variant.pass) {
      const evidence = await capturePrototypeRuntime(options);
      const recovery = evidence.steps.at(-1);
      assert.deepEqual(recovery.before.states, recovery.after.states, 'a new outcome needs no artificial state change');
      assert.ok(!recovery.before.outcomes.includes('Recovery exported'));
      assert.ok(recovery.after.outcomes.includes('Recovery exported'));
      assert.deepEqual(readRuntimeEvidence(root, candidate).errors, []);
    } else {
      await assert.rejects(capturePrototypeRuntime(options), variant.noOp ? /no-op/ : /failed browser|expected state and product outcome/);
      assert.ok(readRuntimeEvidence(root, candidate).errors.length);
      if (variant.noOp) {
        const evidence = JSON.parse(fs.readFileSync(path.join(candidate, 'runtime-evidence.json'), 'utf8'));
        const recovery = evidence.steps.at(-1);
        assert.ok(recovery.before.outcomes.includes('Recovery exported'));
        assert.deepEqual(recovery.before.outcomes, recovery.after.outcomes);
      }
    }
  });
});
