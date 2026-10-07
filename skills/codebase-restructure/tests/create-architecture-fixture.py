'''Create an offline architecture fixture repository. Usage: create-architecture-fixture.py <dir> [--with-plan]

The repository contains: integrations registered by hand in several places (with drift),
a frontend that only works when served by its own server, a well-owned configuration
module with a dynamically loaded legacy mapping, one unrelated pre-existing test failure,
a roadmap with committed and stale items, and maintenance records written earlier by
cleanup work. --with-plan adds an existing restructuring plan for execute and resume runs.
'''
from pathlib import Path
import subprocess
import sys

args = [a for a in sys.argv[1:] if not a.startswith('--')]
with_plan = '--with-plan' in sys.argv
root = Path(args[0]).resolve()
if root.exists() and any(root.iterdir()):
    sys.exit(f'{root} must be empty or absent')
root.mkdir(parents=True, exist_ok=True)


def write(name, text):
    target = root / name
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(text.lstrip('\n'))


def git(*a):
    return subprocess.check_output(['git', '-C', str(root), *a], text=True).strip()


def commit(message, date):
    git('add', '-A')
    env_date = f'{date}T10:00:00'
    subprocess.run(['git', '-C', str(root), 'commit', '-qm', message],
                   check=True, env={'GIT_AUTHOR_DATE': env_date, 'GIT_COMMITTER_DATE': env_date,
                                    'GIT_AUTHOR_NAME': 'Fixture', 'GIT_AUTHOR_EMAIL': 'fixture@example.invalid',
                                    'GIT_COMMITTER_NAME': 'Fixture', 'GIT_COMMITTER_EMAIL': 'fixture@example.invalid',
                                    'PATH': '/usr/bin:/bin:/usr/local/bin:/opt/homebrew/bin'})


git('init', '-q', '-b', 'main')

write('package.json', '''
{
  "name": "notice-board",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test",
    "build": "node scripts/build.mjs",
    "start": "node server/main.mjs"
  }
}
''')
write('README.md', '''
# Notice board

A small notice board. `server/` serves the JSON API and the browser application from
`dist/public`, which `npm run build` produces from `web/`. Integrations forward notices
to external services. Configuration is described in `config/README.md`.
''')
write('config/README.md', '''
# Configuration

`loadConfig()` reads `APP_*` environment variables once at startup and returns a plain
object. Defaults live in `load.mjs` next to the code that reads them.

Installations from before version 2 still use `NB_*` names. When any `NB_*` variable is
present, `legacy-env.mjs` is loaded to translate them. Supported until version 3.
''')
write('config/load.mjs', '''
const DEFAULTS = { port: 8080, currency: 'EUR', logLevel: 'info' };

export async function loadConfig(env = process.env) {
  let source = env;
  if (Object.keys(env).some((key) => key.startsWith('NB_'))) {
    const { translateLegacy } = await import(new URL('./legacy-env.mjs', import.meta.url));
    source = { ...translateLegacy(env), ...env };
  }
  return {
    port: Number(source.APP_PORT ?? DEFAULTS.port),
    currency: source.APP_CURRENCY ?? DEFAULTS.currency,
    logLevel: source.APP_LOG_LEVEL ?? DEFAULTS.logLevel,
  };
}
''')
write('config/legacy-env.mjs', '''
const NAMES = { NB_PORT: 'APP_PORT', NB_CURRENCY: 'APP_CURRENCY' };

export function translateLegacy(env) {
  const out = {};
  for (const [oldName, newName] of Object.entries(NAMES)) {
    if (env[oldName] !== undefined) out[newName] = env[oldName];
  }
  return out;
}
''')
write('server/pricing.mjs', '''
export function formatPrice(cents, currency) {
  return new Intl.NumberFormat('en', { style: 'currency', currency }).format(cents / 100);
}
''')
write('server/reports.mjs', '''
export function countDays(start, end) {
  return Math.round((end - start) / 86400000) + 1;
}
''')
write('integrations/webhook.mjs', '''
export async function send(settings, notice) {
  return { via: 'webhook', to: settings.url, body: notice.title };
}
''')
write('server/integration-registry.mjs', '''
import * as webhook from '../integrations/webhook.mjs';

export function getIntegration(name) {
  switch (name) {
    case 'webhook': return webhook;
    default: throw new Error(`Unknown integration: ${name}`);
  }
}
''')
write('server/integration-settings.mjs', '''
export function validateSettings(name, settings) {
  if (name === 'webhook') {
    if (!settings.url?.startsWith('https://')) throw new Error('webhook url must use https');
    return;
  }
  throw new Error(`Unknown integration: ${name}`);
}
''')
write('server/api.mjs', '''
import { readFile } from 'node:fs/promises';
import { getIntegration } from './integration-registry.mjs';
import { validateSettings } from './integration-settings.mjs';

const notices = [{ id: 1, title: 'Welcome', priceCents: 1250 }];

export function createHandler(config) {
  return async function handle({ method, path, body }) {
    if (method === 'GET' && path === '/api/notices') return json(notices);
    if (method === 'POST' && path.startsWith('/api/integrations/')) {
      const name = path.split('/')[3];
      validateSettings(name, body.settings);
      return json(await getIntegration(name).send(body.settings, body.notice));
    }
    if (method === 'GET' && path === '/app/pricing.mjs') {
      const source = await readFile(new URL('./pricing.mjs', import.meta.url), 'utf8');
      return { status: 200, type: 'text/javascript', body: source };
    }
    if (method === 'GET' && path === '/') {
      const html = `<!doctype html><script>window.APP_CONFIG=${JSON.stringify({ currency: config.currency })}</script>` +
        '<script type="module" src="/static/app.mjs"></script>';
      return { status: 200, type: 'text/html', body: html };
    }
    return { status: 404, type: 'text/plain', body: 'Not found' };
  };
}

function json(value) {
  return { status: 200, type: 'application/json', body: JSON.stringify(value) };
}
''')
write('server/main.mjs', '''
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { loadConfig } from '../config/load.mjs';
import { createHandler } from './api.mjs';

const config = await loadConfig();
const handle = createHandler(config);

http.createServer(async (req, res) => {
  if (req.url.startsWith('/static/')) {
    try {
      const file = await readFile(new URL(`../dist/public/${req.url.slice(8)}`, import.meta.url));
      res.writeHead(200, { 'content-type': 'text/javascript' }).end(file);
    } catch {
      res.writeHead(404).end();
    }
    return;
  }
  let raw = '';
  for await (const chunk of req) raw += chunk;
  const result = await handle({ method: req.method, path: req.url, body: raw ? JSON.parse(raw) : {} });
  res.writeHead(result.status, { 'content-type': result.type }).end(result.body);
}).listen(config.port);
''')
write('web/api-client.mjs', '''
export function createClient(fetchImpl = fetch) {
  return {
    notices: () => fetchImpl('/api/notices').then((response) => response.json()),
    testIntegration: (name, settings, notice) =>
      fetchImpl(`/api/integrations/${name}`, { method: 'POST', body: JSON.stringify({ settings, notice }) })
        .then((response) => response.json()),
  };
}
''')
write('web/integration-options.mjs', '''
export const INTEGRATION_OPTIONS = [
  { id: 'webhook', label: 'Webhook', fields: ['url'] },
];
''')
write('web/app.mjs', '''
import { formatPrice } from '/app/pricing.mjs';
import { createClient } from './api-client.mjs';
import { INTEGRATION_OPTIONS } from './integration-options.mjs';

const client = createClient();
const list = document.querySelector('#notices');
for (const notice of await client.notices()) {
  const item = document.createElement('li');
  item.textContent = `${notice.title} (${formatPrice(notice.priceCents, window.APP_CONFIG.currency)})`;
  list.append(item);
}
document.querySelector('#integrations').append(...INTEGRATION_OPTIONS.map((option) => new Option(option.label, option.id)));
''')
write('scripts/build.mjs', '''
import { cp, mkdir } from 'node:fs/promises';

await mkdir(new URL('../dist/public/', import.meta.url), { recursive: true });
await cp(new URL('../web/', import.meta.url), new URL('../dist/public/', import.meta.url), { recursive: true });
console.log('built dist/public');
''')
write('.gitignore', 'dist/\nnode_modules/\n')
write('test/config.test.mjs', '''
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../config/load.mjs';

test('defaults apply when nothing is set', async () => {
  assert.deepEqual(await loadConfig({}), { port: 8080, currency: 'EUR', logLevel: 'info' });
});
test('APP_ variables override defaults', async () => {
  assert.equal((await loadConfig({ APP_PORT: '9000' })).port, 9000);
});
test('legacy NB_ names are still understood', async () => {
  assert.equal((await loadConfig({ NB_CURRENCY: 'USD' })).currency, 'USD');
});
''')
write('test/api.test.mjs', '''
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler } from '../server/api.mjs';

const handle = createHandler({ currency: 'EUR' });
test('lists notices', async () => {
  assert.equal(JSON.parse((await handle({ method: 'GET', path: '/api/notices' })).body)[0].title, 'Welcome');
});
test('index injects runtime configuration', async () => {
  assert.match((await handle({ method: 'GET', path: '/' })).body, /APP_CONFIG=\\{"currency":"EUR"\\}/);
});
test('serves the pricing module to the browser', async () => {
  assert.match((await handle({ method: 'GET', path: '/app/pricing.mjs' })).body, /formatPrice/);
});
''')
write('test/web-client.test.mjs', '''
import test from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '../web/api-client.mjs';

test('client requests notices from the API path', async () => {
  const seen = [];
  const client = createClient(async (url) => { seen.push(url); return { json: async () => [] }; });
  await client.notices();
  assert.deepEqual(seen, ['/api/notices']);
});
''')
write('test/reports.test.mjs', '''
import test from 'node:test';
import assert from 'node:assert/strict';
import { countDays } from '../server/reports.mjs';

test('a range within one day counts zero full days', () => {
  const start = Date.UTC(2026, 0, 1, 8);
  assert.equal(countDays(start, start + 3600000), 0);
});
''')
write('docs/integrations.md', '''
# Adding an integration

1. Create `integrations/<name>.mjs` exporting `send(settings, notice)`.
2. Add a `case` to `server/integration-registry.mjs`.
3. Add validation to `server/integration-settings.mjs`.
4. Add the option and its fields to `web/integration-options.mjs`.
5. Add tests.
''')
commit('Notice board with webhook integration', '2025-03-02')

write('integrations/email.mjs', '''
export async function send(settings, notice) {
  return { via: 'email', to: settings.address, subject: `${settings.subjectPrefix ?? ''}${notice.title}` };
}
''')
reg = root / 'server/integration-registry.mjs'
reg.write_text(reg.read_text()
               .replace("import * as webhook from '../integrations/webhook.mjs';\n",
                        "import * as webhook from '../integrations/webhook.mjs';\nimport * as email from '../integrations/email.mjs';\n")
               .replace("    case 'webhook': return webhook;\n",
                        "    case 'webhook': return webhook;\n    case 'email': return email;\n"))
settings = root / 'server/integration-settings.mjs'
settings.write_text(settings.read_text().replace("  throw new Error(`Unknown integration: ${name}`);\n}",
                                                 "  if (name === 'email') {\n    if (!settings.address?.includes('@')) throw new Error('email address is invalid');\n    return;\n  }\n  throw new Error(`Unknown integration: ${name}`);\n}"))
options = root / 'web/integration-options.mjs'
options.write_text(options.read_text().replace("  { id: 'webhook', label: 'Webhook', fields: ['url'] },\n",
                                               "  { id: 'webhook', label: 'Webhook', fields: ['url'] },\n  { id: 'email', label: 'Email', fields: ['address', 'subjectPrefix'] },\n"))
write('test/integrations.test.mjs', '''
import test from 'node:test';
import assert from 'node:assert/strict';
import { getIntegration } from '../server/integration-registry.mjs';
import { validateSettings } from '../server/integration-settings.mjs';

test('webhook and email are registered', () => {
  assert.equal(typeof getIntegration('webhook').send, 'function');
  assert.equal(typeof getIntegration('email').send, 'function');
});
test('webhook settings require https', () => {
  assert.throws(() => validateSettings('webhook', { url: 'http://x' }), /https/);
});
''')
commit('Add email integration', '2025-06-11')

options.write_text(options.read_text().replace("  { id: 'email', label: 'Email', fields: ['address', 'subjectPrefix'] },\n",
                                               "  { id: 'email', label: 'Email', fields: ['address', 'subjectPrefix'] },\n  { id: 'sms', label: 'SMS', fields: ['phone'] },\n"))
commit('Show SMS option in settings screen', '2025-09-30')

write('docs/roadmap.md', '''
# Roadmap

## Committed (reviewed 2026-09-01)

- SMS integration on the server, so the SMS option in the settings screen works. Target: Q4 2026.

## Ideas (2024, not scheduled)

- Marketplace for third-party integrations.
- Native mobile application.
''')
write('maintenance/decisions/repository.md', '''
# Repository architecture decisions

Lasting architectural rationale for the notice board.

## Server delivers the browser application

- Status: Implemented
- Applies to: server/, web/, scripts/build.mjs
- Decided: 2025-03-02

**Context and constraints.** One team, one host, one deployment.

**Decision.** The API server serves the built browser application and injects runtime configuration into the page. The browser application calls the API through same-origin relative paths.

**Why.** One artifact to deploy, and no cross-origin configuration.

**Alternatives rejected.** Separate static hosting: extra infrastructure for a single deployment.

**Reconsider when.** The browser application must be deployed or distributed separately from this server.
''')
write('maintenance/observations.md', '''
# Maintenance Observations

Unresolved findings worth keeping. Remove an entry once it is resolved or disproved.

## Open

### OBS-integrations-duplicated-list: Integration list is maintained by hand in several places

- Kind: architecture
- Scope checked: web/ during a cleanup inspection; server/ only searched for the names
- Observed: web/integration-options.mjs lists webhook, email and sms; server/integration-registry.mjs handles webhook and email.
- Why it matters: the lists can drift; sms is offered in the UI but rejected by the server.
- Uncertainty: whether sms is intentionally shown ahead of server support.
- Suggested next step: choose an owner for the integration list in a restructuring task.
- Last verified: 2026-09-10 at working tree

### OBS-config-legacy-env-unused: config/legacy-env.mjs appears unused

- Kind: cleanup candidate
- Scope checked: static imports in the repository
- Observed: no file imports config/legacy-env.mjs.
- Suggested next step: remove it after confirming no dynamic consumer.
- Last verified: 2026-09-10 at working tree
''')
write('maintenance/plans/cleanup-web.md', '''
# Cleanup plan: web

Status: Ready
Updated: 2026-09-10
Scope kind: module-focused

## Request

"Clean up the web module; plan only." Mode: inspect and plan.

## Scope

- Focus: web/
- Related edits allowed: tests and documentation referring to web/
- Excluded: server behavior
- Records: maintenance/

## Preserved behavior

- The settings screen offers the same options with the same fields.

Authorized behavior changes and retirements:

- None

## Questions and answers

- None

## Inspection baseline

- Date and revision: 2026-09-10, working tree
- Working tree: clean
- Other plans checked: none present
- Baseline checks: node --test: one failure in test/reports.test.mjs, unrelated to web/

## Planned changes

### Batch 1: Clearer option field name

- Readiness: ready
- Changes: rename `fields` to `settingFields` in web/integration-options.mjs and its use in web/app.mjs
- Preserves: the options and fields shown
- Verify: node --test; search for `.fields` in web/ finds no remaining use

## Verification

- node --test (same single baseline failure expected)
- Not verifiable here: the browser screen

## Overlaps

- None

## Progress

- [ ] Batch 1: Clearer option field name
- Current state: not started
- Next step: Batch 1

## Out-of-scope findings

- Integration list duplicated between web and server. Status: recorded as OBS-integrations-duplicated-list
''')
commit('Record cleanup inspection of web', '2026-09-10')

if with_plan:
    revision = git('rev-parse', 'HEAD')
    write('maintenance/plans/restructure-integrations.md', f'''
# Restructure plan: integrations

Status: Awaiting decision
Updated: 2026-09-20
Scope kind: module-focused

## Request

"Adding integrations requires changes everywhere; investigate why." Mode: inspect and plan.

- Objective: adding an integration should need changes in one place.
- Proposed outcome: each integration declares its identity, settings validation and sending; the server derives its registry and validation from those declarations, and the settings screen gets its options from the server.

## Scope

- Focus: the integration responsibility across integrations/, server/ and web/
- Related edits allowed: callers, tests and docs/integrations.md
- Excluded: new integrations; behavior of existing integrations
- Records: maintenance/

## Preserved behavior

- POST /api/integrations/<name> accepts and rejects the same settings and returns the same results for webhook and email.
- The settings screen offers webhook and email with the same fields.

Authorized behavior changes:

- None

## Direction and constraints

- Confirmed needs: SMS integration on the server, Q4 2026 (docs/roadmap.md, committed).
- Tentative or unconfirmed: third-party integration marketplace (2024 idea, not scheduled); not designed for.

## Questions and answers

- Q1: The settings screen offers SMS, which the server rejects. Deriving the screen's options from the server would remove SMS from the screen until the server supports it.
  - Options: (a) derive options from the server and let SMS disappear until it ships; (b) keep a screen-only SMS entry marked unavailable until it ships; (c) keep SMS as a special case in the screen permanently.
  - Recommendation: (a). The screen stops offering something that fails, and the committed SMS work brings it back through the same single declaration. (b) keeps one duplicated entry temporarily; (c) keeps the drift the plan removes.
  - A: Open
  - Affects: Step 3

## Inspection baseline

- Date and revision: 2026-09-20, {revision}
- Working tree: clean
- Other plans checked: maintenance/plans/cleanup-web.md (overlapping, see Overlaps)
- Observations and decisions consulted: OBS-integrations-duplicated-list holds; OBS-config-legacy-env-unused not relevant here
- Baseline checks: node --test: 10 tests, 9 pass, 1 fail (test/reports.test.mjs, unrelated)

## Coverage

- Traced: POST /api/integrations/<name> from server/api.mjs through registry, validation and integrations/*.mjs; the settings options from web/app.mjs
- Inspected: integrations/, server/integration-*.mjs, web/integration-options.mjs, docs/integrations.md, history of these files
- Sampled or inaccessible: the browser screen was not run

## Current responsibilities

| Responsibility or concept | Where it lives now | Consumers | Assessment and evidence |
| --- | --- | --- | --- |
| Which integrations exist | registry switch, settings validation, web options list | API, settings screen | Confirmed problem: "Add email integration" touched five files; web and server lists have drifted (sms) |
| Settings rules per integration | server/integration-settings.mjs, field names in web options | API, settings screen | Confirmed problem: rules and field names kept apart from the integration they describe |

## Target organization

- Ownership: each integrations/<name>.mjs owns its id, label, settings fields, validation and send.
- Boundaries and interfaces: integrations/index.mjs lists the modules; the server reads descriptors; GET /api/integrations returns id, label and fields for the screen.
- Dependencies and contracts: registry and validation depend on descriptors instead of switches; new internal endpoint GET /api/integrations.
- Deliberately unchanged: sending logic of each integration; POST contract.
- Compatibility: POST contract unchanged; no transition needed.
- Success criteria: adding a throwaway integration touches only its module and integrations/index.mjs; no integration names remain in server/integration-*.mjs or web/.

## Trade-offs

- Recommended: descriptors owned by each integration; one list.
- Alternative: a shared JSON catalog; rejected because validation code would stay separate from it.
- Leaving it as is: every integration keeps touching five files, and lists keep drifting.

## Migration order

### Step 1: Characterize integration behavior

- Readiness: ready
- Changes: tests in test/integrations.test.mjs for email validation and for the send results of webhook and email through POST /api/integrations/<name>
- State afterwards: unchanged code, more tests
- Preserves: everything
- Verify: node --test runs the new tests and they pass; the baseline failure is unchanged

### Step 2: Server derives registry and validation from descriptors

- Readiness: after Step 1
- Changes: integrations/webhook.mjs and integrations/email.mjs export `descriptor`; new integrations/index.mjs; server/integration-registry.mjs and server/integration-settings.mjs read descriptors; switches removed
- State afterwards: server side single-sourced; web options still hand-written
- Preserves: POST behavior for webhook and email
- Verify: Step 1 tests pass; no integration names in server/integration-*.mjs

### Step 3: Settings screen gets options from the server

- Readiness: waiting on Q1; after Step 2
- Changes: GET /api/integrations; web/api-client.mjs gains integrations(); web/app.mjs uses it; web/integration-options.mjs removed; docs/integrations.md updated
- Preserves: webhook and email options and fields
- Verify: API test for GET /api/integrations; web client test; search finds no integration names in web/

## Verification

- Preserved behavior: node --test (baseline failure in test/reports.test.mjs expected and unrelated)
- Architectural outcome: search for integration names outside integrations/; walk through adding a throwaway integration
- Baseline failures: test/reports.test.mjs; blocks no check in this plan
- Not verifiable here: the browser screen

## Decision record

- Destination: none yet: the target is a proposal held in this plan
- Status when written: Approved, not yet implemented

## Overlaps

- maintenance/plans/cleanup-web.md: overlapping on web/integration-options.mjs (its Batch 1 renames a field this plan's Step 3 removes); order not yet agreed

## Progress

- [ ] Step 1: Characterize integration behavior
- [ ] Step 2: Server derives registry and validation from descriptors
- [ ] Step 3: Settings screen gets options from the server
- Current state: not started
- Next step: Step 1

## Out-of-scope findings

- countDays counts one day too many (test/reports.test.mjs fails). Status: not yet recorded
''')
    commit('Plan integrations restructuring', '2026-09-20')

print(root)
