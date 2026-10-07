import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

export const runtimeEvidenceName = 'runtime-evidence.json';
const kinds = ['action', 'next', 'cancel', 'recovery', 'review'];
export function runtimeResourceAllowed(relative, candidate) {
  return typeof relative === 'string' && relative.length > 0 && !relative.startsWith('/') && !relative.includes('\\') && !relative.split('/').includes('..')
    && relative !== 'specification.md' && relative !== candidate + '/slides.html'
    && !relative.endsWith('/' + runtimeEvidenceName)
    && (!relative.startsWith('alternatives/') || relative.startsWith(candidate + '/'));
}
const markers = { action: 'data-product-action', next: 'data-next-step', cancel: 'data-cancel-action', recovery: 'data-recovery-action', review: 'data-review-state-target' };

// Conservative content binding: all candidate and shared UI runtime inputs, including
// dynamically imported resources. Other alternatives and derived screenshot decks
// are excluded. No browser, network request, or code execution occurs here.
export function prototypeIdentity(uiRoot, candidateRoot) {
  const candidate = path.relative(uiRoot, candidateRoot).split(path.sep).join('/');
  if (!/^alternatives\/[^/]+$/.test(candidate)) throw new Error('Candidate must be a direct alternatives/ child.');
  const hash = createHash('sha256');
  function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const file = path.join(directory, entry.name);
      const relative = path.relative(uiRoot, file).split(path.sep).join('/');
      if (relative.startsWith('alternatives/') && !relative.startsWith(candidate + '/') && relative !== candidate) continue;
      if (entry.isSymbolicLink()) throw new Error('Runtime identity does not accept symlink resources: ' + relative);
      if (entry.isDirectory()) walk(file);
      else if (entry.isFile() && relative !== 'specification.md' && entry.name !== runtimeEvidenceName && relative !== candidate + '/slides.html') {
        const bytes = fs.readFileSync(file);
        hash.update(JSON.stringify([relative, bytes.length]) + '\n').update(bytes);
      }
    }
  }
  walk(uiRoot);
  return { candidate, resources: 'sha256:' + hash.digest('hex') };
}

// Runs in the browser, via page.evaluate or an equivalent explicit capture route.
// Observations are visible DOM facts, not selectors found inside script strings.
export function observePrototype({ selector, kind }) {
  const visible = (node) => {
    if (!node || !node.getClientRects().length || node.closest('[hidden],[inert],[aria-hidden="true"]')) return false;
    for (let current = node; current; current = current.parentElement) {
      const style = getComputedStyle(current);
      if (style.visibility === 'hidden' || style.display === 'none' || Number(style.opacity) === 0) return false;
    }
    return true;
  };
  const text = (node) => (node?.textContent || '').replace(/\s+/g, ' ').trim();
  const matches = [...document.querySelectorAll(selector)].filter(visible);
  const node = matches.length === 1 ? matches[0] : null;
  const marker = { action: 'data-product-action', next: 'data-next-step', cancel: 'data-cancel-action', recovery: 'data-recovery-action', review: 'data-review-state-target' }[kind];
  const states = [...document.querySelectorAll('[data-product-surface][data-prototype-state]')].filter(visible).map((n) => n.getAttribute('data-prototype-state'));
  const outcomes = [...document.querySelectorAll('[data-product-surface][data-product-outcome], [data-product-surface] [data-product-outcome]')].filter(visible).map(text).filter(Boolean);
  const reviewers = [...document.querySelectorAll('[data-review-state-target]')];
  return {
    html: document.documentElement.outerHTML, states, outcomes,
    control: { count: matches.length, tag: node?.tagName || '', text: text(node), marker: !!node && !!marker && node.hasAttribute(marker), target: node?.getAttribute('data-review-state-target') || null,
      inReviewer: !!node?.closest('details[data-prototype-reviewer]'), inProduct: !!node?.closest('[data-product-surface]'), disabled: !!node?.disabled },
    reviewerTargets: reviewers.map((n) => ({ target: n.getAttribute('data-review-state-target'), inside: !!n.closest('details[data-prototype-reviewer]') && !n.closest('[data-product-surface],nav') })),
  };
}

export function runtimeEvidenceErrors(evidence, identity) {
  const errors = [];
  const fail = (message) => errors.push('Runtime evidence: ' + message);
  if (!evidence || evidence.schema !== 'prototype-runtime-observations' || evidence.candidate !== identity.candidate || evidence.resources !== identity.resources) fail('missing, stale, or mismatched candidate/resource identity.');
  if (!evidence?.capture || typeof evidence.capture.tool !== 'string' || !evidence.capture.tool.trim() || !Number.isFinite(Date.parse(evidence.capture.at)) || Date.parse(evidence.capture.at) > Date.now() + 60000) fail('requires capture tool and valid observation time.');
  if (!Array.isArray(evidence?.requests) || !evidence.requests.length || evidence.requests.some((r) => !runtimeResourceAllowed(r, identity.candidate))) fail('requires local browser resource requests inside the bound resource inventory.');
  if (!Array.isArray(evidence?.errors) || evidence.errors.length) fail('capture has missing or failed browser diagnostics.');
  if (!Array.isArray(evidence?.steps) || !evidence.steps.length) { fail('requires exercised actions and observed outcomes.'); return errors; }
  const covered = new Set();
  const targets = new Set();
  for (const step of evidence.steps) {
    if (!kinds.includes(step.kind)) { fail('unknown behavioral claim.'); continue; }
    const { before, after, expected, kind } = step;
    if (!step.page || !step.page.startsWith(identity.candidate + '/') || step.page.split('/').includes('..') || !step.page.endsWith('.html')) fail('page must belong to the exact candidate.');
    if (typeof step.selector !== 'string' || !step.selector.trim() || step.action !== 'click') fail('requires the actual action and selector.');
    const c = before?.control;
    if (!c || c.count !== 1 || !['BUTTON', 'A', 'INPUT'].includes(c.tag) || c.disabled || !c.marker || !c.text && c.tag !== 'INPUT') fail(kind + ' requires one visible enabled, meaningfully labelled control with ' + markers[kind] + '.');
    if (kind === 'review' ? !c?.inReviewer || c?.inProduct : !c?.inProduct || c?.inReviewer) fail(kind + ' control has incorrect product/reviewer placement.');
    if (!evidence.requests?.includes(step.page) || !evidence.requests?.includes(after?.page)) fail('observed browser pages lack resource-request provenance.');
    if (before?.page !== step.page) fail('observed page differs from the exercised page.');
    for (const observation of [before, after]) {
      if (typeof observation?.page !== 'string' || !observation.page.startsWith(identity.candidate + '/') || observation.page.split('/').includes('..') || !observation.page.endsWith('.html')) fail('observed browser page must belong to the exact candidate.');
      if (!observation || typeof observation.html !== 'string' || !observation.html.includes('<html') || !Array.isArray(observation.states) || !observation.states.length || observation.states.some((s) => typeof s !== 'string' || !s.trim()) || !Array.isArray(observation.outcomes) || observation.outcomes.some((s) => typeof s !== 'string' || !s.trim())) { fail('missing rendered DOM, state, or outcome observations.'); continue; }
      if (!Array.isArray(observation.reviewerTargets) || observation.reviewerTargets.some((t) => !t.inside || typeof t.target !== 'string' || !t.target.trim()) || new Set(observation.reviewerTargets.map((t) => t.target)).size !== observation.reviewerTargets.length) fail('review controls must have distinct targets inside the reviewer area.');
    }
    if (!expected || typeof expected.state !== 'string' || !expected.state.trim() || typeof expected.outcome !== 'string' || !expected.outcome.trim() || !after?.states?.includes(expected.state) || !after?.outcomes?.includes(expected.outcome)) fail(kind + ' did not observe the expected state and product outcome.');
    if (JSON.stringify(before?.states) === JSON.stringify(after?.states) && JSON.stringify(before?.outcomes) === JSON.stringify(after?.outcomes)) fail(kind + ' is a no-op: no observed state/outcome transition.');
    if (kind === 'review') {
      if (!c?.target || c.target !== expected?.state || targets.has(c.target) || JSON.stringify(before?.states) === JSON.stringify(after?.states)) fail('review controls require two distinct targets and observed state transitions.');
      targets.add(c?.target);
    }
    covered.add(kind);
  }
  for (const kind of kinds) if (!covered.has(kind)) fail('missing exercised ' + kind + ' interaction.');
  if (targets.size < 2) fail('requires two exercised reviewer targets.');
  return errors;
}

export function readRuntimeEvidence(uiRoot, candidateRoot, allowedPages = null) {
  const file = path.join(candidateRoot, runtimeEvidenceName);
  if (!fs.existsSync(file)) return null;
  try {
    const evidence = JSON.parse(fs.readFileSync(file, 'utf8'));
    const errors = runtimeEvidenceErrors(evidence, prototypeIdentity(uiRoot, candidateRoot));
    if (!errors.length) for (const step of evidence.steps) for (const page of [step.page, step.before.page, step.after.page]) {
      const file = path.resolve(uiRoot, page);
      if (!fs.existsSync(file) || !fs.statSync(file).isFile() || allowedPages && !allowedPages.includes(file)) errors.push('Runtime evidence: observed page is not a reachable candidate product page: ' + page);
    }
    return { errors, html: errors.length ? '' : evidence.steps.flatMap((s) => [s.before.html, s.after.html]).join('\n') };
  } catch (error) { return { errors: ['Runtime evidence: ' + error.message], html: '' }; }
}
