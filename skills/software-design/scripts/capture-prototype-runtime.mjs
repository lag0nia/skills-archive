import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { observePrototype, prototypeIdentity, runtimeEvidenceErrors, runtimeEvidenceName, runtimeResourceAllowed } from './lib/validation/prototype-runtime.mjs';

// Explicit, opt-in capture. The caller supplies a browser page with Playwright's
// goto/locator/evaluate API; an equivalent observer can produce the same contract.
// This module does not install dependencies, launch a browser, or approve a design.
export async function capturePrototypeRuntime({ page, uiRoot, candidateRoot, steps, tool, timeout = 5000, output = path.join(candidateRoot, runtimeEvidenceName) }) {
  uiRoot = path.resolve(uiRoot);
  candidateRoot = path.resolve(candidateRoot);
  const identity = prototypeIdentity(uiRoot, candidateRoot);
  const evidence = { schema: 'prototype-runtime-observations', ...identity, capture: { tool, at: new Date().toISOString() }, errors: [], requests: [], steps: [] };
  const onError = (error) => evidence.errors.push(String(error.message || error));
  const onRequest = (request) => {
    try {
      const url = new URL(request.url());
      if (['data:', 'blob:'].includes(url.protocol)) return;
      if (url.protocol !== 'file:') throw new Error('Remote runtime resource: ' + url.origin);
      url.hash = ''; url.search = '';
      const relative = path.relative(uiRoot, fileURLToPath(url)).split(path.sep).join('/');
      if (!runtimeResourceAllowed(relative, identity.candidate)) throw new Error('Runtime request is outside the bound resource inventory: ' + relative);
      if (!evidence.requests.includes(relative)) evidence.requests.push(relative);
    } catch (error) { onError(error); }
  };
  page.on('request', onRequest);
  page.on('pageerror', onError);
  try {
    for (const step of steps) {
      const relative = path.relative(uiRoot, path.resolve(uiRoot, step.page)).split(path.sep).join('/');
      if (!relative.startsWith(identity.candidate + '/') || !relative.endsWith('.html')) throw new Error('Capture page is outside the candidate.');
      if (step.navigate !== false) await page.goto(pathToFileURL(path.resolve(uiRoot, relative)).href);
      // Explicit setup may enter inputs or open reviewer details; it is never proof.
      for (const setup of step.setup || []) {
        if (setup.action === 'fill') await page.locator(setup.selector).fill(setup.value);
        else if (setup.action === 'click') await page.locator(setup.selector).click();
        else throw new Error('Unsupported setup action.');
      }
      const observedPage = () => {
        const url = new URL(page.url()); url.hash = ''; url.search = '';
        if (url.protocol !== 'file:') throw new Error('Capture must observe the local candidate resources.');
        const relative = path.relative(uiRoot, fileURLToPath(url)).split(path.sep).join('/');
        if (!relative.startsWith(identity.candidate + '/')) throw new Error('Browser navigated outside the candidate.');
        return relative;
      };
      const before = await page.evaluate(observePrototype, step);
      before.page = observedPage();
      if (before.page !== relative) throw new Error('Observed page differs from the requested candidate page.');
      await page.locator(step.selector).click();
      await page.waitForFunction(({ state, outcome }) => {
        // Match the observer's visibility rules so pre-existing hidden status
        // text cannot end the wait before the actual outcome becomes visible.
        const visible = (node) => {
          if (!node || !node.getClientRects().length || node.closest('[hidden],[inert],[aria-hidden="true"]')) return false;
          for (let current = node; current; current = current.parentElement) {
            const style = getComputedStyle(current);
            if (style.visibility === 'hidden' || style.display === 'none' || Number(style.opacity) === 0) return false;
          }
          return true;
        };
        return [...document.querySelectorAll('[data-product-surface][data-prototype-state]')].filter(visible).some((n) => n.getAttribute('data-prototype-state') === state)
          && [...document.querySelectorAll('[data-product-surface][data-product-outcome], [data-product-surface] [data-product-outcome]')].filter(visible).some((n) => n.textContent.replace(/\s+/g, ' ').trim() === outcome);
      }, step.expected, { timeout });
      const after = await page.evaluate(observePrototype, step);
      after.page = observedPage();
      evidence.steps.push({ page: relative, kind: step.kind, selector: step.selector, action: 'click', expected: step.expected, before, after });
    }
  } catch (error) { onError(error); }
  finally { page.off('pageerror', onError); page.off('request', onRequest); }
  if (prototypeIdentity(uiRoot, candidateRoot).resources !== identity.resources) evidence.errors.push('Resources changed during capture.');
  const errors = runtimeEvidenceErrors(evidence, identity);
  // Retain failure diagnostics, so a failed new capture cannot leave old PASS evidence.
  fs.writeFileSync(output, JSON.stringify(evidence, null, 2) + '\n');
  if (errors.length) throw new Error(errors.join('\n'));
  return evidence;
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.error('Import capturePrototypeRuntime from this module and supply an explicit browser page, candidate paths, and steps; this helper does not launch a browser.');
  process.exitCode = 1;
}
