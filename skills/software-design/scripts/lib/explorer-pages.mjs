// Pages of the visual explorer: a small index with two destinations, the system overview and states and transitions.
// Input is the validated, source-bound model produced by system-explorer.mjs; nothing here adds facts.

const esc = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const json = value => JSON.stringify(value).replaceAll('<', '\\u003c');
const THEME_BTN = '<button class="theme-btn icon quiet" aria-label="Switch between light and dark" title="Light or dark"><svg viewBox="0 0 18 18" width="17" height="17" aria-hidden="true"><circle cx="9" cy="9" r="6.2" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M9 2.8a6.2 6.2 0 0 1 0 12.4z" fill="currentColor"/></svg></button>';
const THEME_JS = "(()=>{const r=document.documentElement,k='explorer-theme';let t=null;try{t=localStorage.getItem(k)}catch(e){}if(t)r.dataset.theme=t;const cur=()=>r.dataset.theme||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.querySelectorAll('.theme-btn').forEach(b=>{const sync=()=>b.setAttribute('aria-pressed',String(cur()==='dark'));sync();b.onclick=()=>{r.dataset.theme=cur()==='dark'?'light':'dark';try{localStorage.setItem(k,r.dataset.theme)}catch(e){}document.querySelectorAll('.theme-btn').forEach(x=>x.setAttribute('aria-pressed',String(cur()==='dark')))}})})();";
const KIND_COLOR = { person: 'person', application: 'application', service: 'service', worker: 'worker', contract: 'contract', store: 'store', external: 'external', network: 'network' };

export function renderPages(data) {
  return { 'index.html': indexPage(data), 'pages/system.html': destination(data, 'system'), 'pages/states.html': destination(data, 'states') };
}

// ---------- index: two destinations, nothing else ----------
function previewSystem(o) {
  const s = Math.min(560 / o.width, 300 / o.height), ox = (560 - o.width * s) / 2, oy = (300 - o.height * s) / 2, P = (x, y) => (ox + x * s).toFixed(1) + ' ' + (oy + y * s).toFixed(1);
  return '<svg viewBox="0 0 560 300" aria-hidden="true">' + o.groups.map(g => '<rect class="pv-group" x="' + (ox + g.x * s).toFixed(1) + '" y="' + (oy + g.y * s).toFixed(1) + '" width="' + (g.width * s).toFixed(1) + '" height="' + (g.height * s).toFixed(1) + '" rx="6"/>').join('')
    + Object.values(o.routes).map(r => '<path class="pv-line" d="M' + r.map(p => P(p[0], p[1])).join('L') + '"/>').join('')
    + Object.values(o.cards).map(c => '<rect class="pv-card" x="' + (ox + c.x * s).toFixed(1) + '" y="' + (oy + c.y * s).toFixed(1) + '" width="' + (c.width * s).toFixed(1) + '" height="' + (c.height * s).toFixed(1) + '" rx="3"/>').join('') + '</svg>';
}
function previewStates(object) {
  if (!object) return '<svg viewBox="0 0 560 300" aria-hidden="true"></svg>';
  const l = object.layouts.wide, s = Math.min(560 / l.width, 300 / l.height), ox = (560 - l.width * s) / 2, oy = (300 - l.height * s) / 2, P = p => (ox + p[0] * s).toFixed(1) + ' ' + (oy + p[1] * s).toFixed(1);
  const kind = Object.fromEntries(object.edges.map(e => [e.id, e.path]));
  return '<svg viewBox="0 0 560 300" aria-hidden="true">' + Object.entries(l.edges).map(([id, e]) => '<path class="pv-line pv-' + (kind[id] || 'alternative') + '" d="M' + e.points.map(P).join('L') + '"/>').join('')
    + Object.entries(l.nodes).filter(([id]) => !id.includes(':')).map(([id, n]) => '<rect class="pv-state' + (object.nodes.find(q => q.id === id && q.terminal && !q.terminalUnresolved) ? ' pv-end' : '') + '" x="' + (ox + n.x * s).toFixed(1) + '" y="' + (oy + n.y * s).toFixed(1) + '" width="' + (n.width * s).toFixed(1) + '" height="' + (n.height * s).toFixed(1) + '" rx="4"/>').join('') + '</svg>';
}
function indexPage(d) {
  const names = d.objects.map(o => o.name), lifecycle = names.length ? 'How ' + (names.length > 1 ? names[0] + ' and ' + (names.length - 1) + ' related lifecycle' + (names.length > 2 ? 's' : '') : names[0]) + ' change' + (names.length > 1 ? '' : 's') + ', what triggers each change and which conditions apply.' : 'No reviewed lifecycle is drawn yet.';
  const card = (href, title, line, preview, disabled) => disabled ? '<div class="dest off" aria-disabled="true"><div class="pv">' + preview + '</div><h2>' + esc(title) + '</h2><p>' + esc(line) + '</p></div>'
    : '<a class="dest" href="' + href + '"><div class="pv">' + preview + '</div><h2>' + esc(title) + ' <span aria-hidden="true">→</span></h2><p>' + esc(line) + '</p></a>';
  return shell(d.title, 'index', '<div class="index-tools">' + THEME_BTN + '</div><main class="index"><header><p class="eyebrow">System design</p><h1>' + esc(d.title) + '</h1><p class="sum">' + esc(d.summary) + '</p></header><nav class="dests" aria-label="Destinations">'
    + card('pages/system.html', 'System overview', 'What the components are, what they do and how they connect.', previewSystem(d.overview))
    + card('pages/states.html', 'States and transitions', lifecycle, previewStates(d.objects[0]), !d.objects.length)
    + '</nav></main>', '<script>' + THEME_JS + '</script>');
}

// ---------- destinations ----------
function destination(d, page) {
  const name = page === 'system' ? 'System overview' : 'States and transitions';
  const ico = d => '<svg viewBox="0 0 18 18" width="18" height="18" aria-hidden="true"><rect x="2" y="3" width="14" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="' + d + '" stroke="currentColor" stroke-width="1.4" fill="none"/></svg>';
  const tours = d.scenarios.length ? '<div class="tours"><button id="tour-btn" aria-haspopup="menu" aria-expanded="false">Tours</button><div id="tour-menu" class="menu glass" role="menu" hidden></div></div>' : '';
  const dests = '<nav class="dests-nav" aria-label="Destinations"><a href="system.html"' + (page === 'system' ? ' aria-current="page"' : '') + '>System</a>' + (d.objects.length ? '<a href="states.html"' + (page === 'states' ? ' aria-current="page"' : '') + '>States</a>' : '') + '</nav>';
  // the diagram fills the screen; navigation and everything informational live in one collapsible sidebar
  const side = '<aside id="side" class="side glass" aria-label="' + name + '"><div class="side-head"><a class="home" href="../index.html" title="All destinations"><span aria-hidden="true">←</span> ' + esc(d.title) + '</a><span class="side-tools">' + THEME_BTN + '<button id="side-close" class="icon quiet" aria-label="Hide sidebar" aria-controls="side">' + ico('M7 3v12M12 7l-2 2 2 2') + '</button></span></div>'
    + '<div class="side-nav">' + dests + tours + '</div><h1 class="eyebrow">' + name + '</h1><div id="side-body" class="side-body"></div><details class="more side-key"><summary>Key</summary><div id="legend" class="legend"></div></details></aside>'
    + '<button id="side-open" class="side-open glass icon" aria-label="Show sidebar" aria-controls="side" hidden>' + ico('M7 3v12M10 7l2 2-2 2') + '</button>';
  // anything that floats over the diagram is small and glass: zoom in the bottom-right corner, the tour and the details panel
  const zoom = '<div class="zoom glass" role="group" aria-label="Zoom"><button id="zoom-out" aria-label="Zoom out">−</button><button id="zoom-fit">Fit</button><button id="zoom-in" aria-label="Zoom in">+</button></div>';
  const tour = '<div id="tour" class="tour glass" role="region" aria-label="Guided tour" hidden><div class="tour-head"><span class="badge">Illustrative tour · not live state</span><span id="tour-count"></span></div><strong id="tour-title"></strong><p id="tour-caption"></p><div class="tour-ctl"><button id="tour-prev">‹ Back</button><button id="tour-next">Next ›</button><button id="tour-exit" class="quiet">End tour</button></div></div>';
  const panel = '<aside id="panel" class="glass" aria-label="Details" hidden><button id="panel-close" class="icon quiet" aria-label="Close details" title="Close">×</button><div id="panel-body" tabindex="-1"></div></aside>';
  const body = '<main id="stage" aria-label="' + (page === 'system' ? 'System diagram' : 'State diagram') + '"><svg id="scene" xmlns="http://www.w3.org/2000/svg" role="group" aria-label="Diagram" preserveAspectRatio="xMinYMin meet"></svg></main>' + side + zoom + tour + panel + '<div id="figure" hidden></div>';
  return shell(d.title + ' · ' + name, page, body, '<script id="explorer-model" type="application/json">' + json(d) + '</script><script>' + THEME_JS + COMMON + (page === 'system' ? SYSTEM : STATES) + '</script>');
}
function shell(title, page, body, scripts) {
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><title>' + esc(title) + '</title><style>' + STYLE + '</style></head><body data-page="' + page + '">' + body + scripts + '</body></html>';
}

const STYLE = String.raw`
:root{color-scheme:light;--canvas:#f7f8f9;--surface:#fff;--rule:#e3e7eb;--plate:#e8ecf0;--ink:#16202a;--ink-2:#3d4955;--muted:#6b7682;--faint:#a3acb5;--line:#cfd5db;--edge:#b3bbc4;--group:#dde2e7;--group-ink:#8a949e;--accent:#2563eb;--accent-soft:#eaf1fe;--focus:#1d4ed8;--application:#4b6fa8;--service:#2f7f78;--worker:#2f7f78;--store:#2f7f78;--contract:#6a5aa8;--person:#5e6670;--external:#8a929b;--network:#8a929b;--main:#3d4955;--alternative:#9aa3ad;--expiry:#b26b12;--failure:#b4352b;--recovery:#1f7a6d;--success:#1f7a4a;--action:#5b4fc4;--action-2:#7f78b8;--shadow:0 10px 32px rgba(17,24,39,.08),0 1px 2px rgba(17,24,39,.05)}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){color-scheme:dark;--canvas:#0f1317;--surface:#161b21;--rule:#262e36;--plate:#0a0d10;--ink:#e7ecf1;--ink-2:#c3ccd5;--muted:#97a3ae;--faint:#5f6a75;--line:#36414c;--edge:#4a5762;--group:#262f38;--group-ink:#7f8a96;--accent:#7aa7ff;--accent-soft:#18243a;--focus:#a3c1ff;--application:#7b9cd6;--service:#5fb3aa;--worker:#5fb3aa;--store:#5fb3aa;--contract:#a497dc;--person:#a2aab3;--external:#7f8892;--network:#7f8892;--main:#c3ccd5;--alternative:#66727e;--expiry:#e0a24a;--failure:#ec7b6f;--recovery:#5cc0b0;--success:#5ccc8f;--action:#a99cf5;--action-2:#9690c4;--shadow:0 12px 36px rgba(0,0,0,.45)}}
:root[data-theme="dark"]{color-scheme:dark;--canvas:#0f1317;--surface:#161b21;--rule:#262e36;--plate:#0a0d10;--ink:#e7ecf1;--ink-2:#c3ccd5;--muted:#97a3ae;--faint:#5f6a75;--line:#36414c;--edge:#4a5762;--group:#262f38;--group-ink:#7f8a96;--accent:#7aa7ff;--accent-soft:#18243a;--focus:#a3c1ff;--application:#7b9cd6;--service:#5fb3aa;--worker:#5fb3aa;--store:#5fb3aa;--contract:#a497dc;--person:#a2aab3;--external:#7f8892;--network:#7f8892;--main:#c3ccd5;--alternative:#66727e;--expiry:#e0a24a;--failure:#ec7b6f;--recovery:#5cc0b0;--success:#5ccc8f;--action:#a99cf5;--action-2:#9690c4;--shadow:0 12px 36px rgba(0,0,0,.45)}
*{box-sizing:border-box}html,body{height:100%}body{margin:0;background:var(--canvas);color:var(--ink);font:14px/1.5 Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;-webkit-font-smoothing:antialiased}
body[data-page="system"],body[data-page="states"]{height:100vh;height:100dvh;overflow:hidden}
a{color:var(--accent)}button{font:inherit;color:inherit;border:1px solid var(--rule);background:var(--surface);border-radius:8px;padding:5px 11px;cursor:pointer;line-height:1.4}button:hover{border-color:var(--line)}button.quiet{border-color:transparent;background:transparent;color:var(--muted)}button.quiet:hover{color:var(--ink);background:var(--rule)}button.icon{width:32px;height:32px;padding:0;font-size:17px;display:inline-grid;place-items:center}button:disabled{opacity:.4;cursor:default}
:focus-visible{outline:2px solid var(--focus);outline-offset:2px}
.index-tools{position:fixed;top:14px;right:14px}.index{max-width:1120px;margin:0 auto;padding:clamp(28px,7vh,72px) 20px 48px}.index header{max-width:720px}.eyebrow{margin:0 0 6px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);font-weight:600}.index h1{margin:0;font-size:clamp(26px,4vw,36px);letter-spacing:-.02em;line-height:1.15}.index .sum{margin:10px 0 0;color:var(--ink-2);font-size:15.5px}
.dests{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,400px),1fr));gap:24px;margin-top:36px}.dest{display:block;text-decoration:none;color:inherit;background:var(--surface);border:1px solid var(--rule);border-radius:16px;padding:18px 20px 20px;transition:border-color .2s,box-shadow .2s}.dest:hover{border-color:var(--line);box-shadow:var(--shadow)}.dest h2{margin:14px 0 4px;font-size:19px;letter-spacing:-.01em}.dest h2 span{color:var(--muted);font-weight:400}.dest p{margin:0;color:var(--muted)}.dest.off{opacity:.55}
.pv{background:var(--canvas);border-radius:10px;border:1px solid var(--rule);aspect-ratio:560/300;overflow:hidden}.pv svg{width:100%;height:100%;display:block}.pv-group{fill:none;stroke:var(--group)}.pv-card{fill:var(--surface);stroke:var(--line)}.pv-line{fill:none;stroke:var(--edge);stroke-width:1}.pv-state{fill:var(--surface);stroke:var(--ink-2);stroke-width:1}.pv-end{stroke-width:2}.pv-main{stroke:var(--main);stroke-width:1.6}.pv-expiry{stroke:var(--expiry);stroke-dasharray:4 3}.pv-failure{stroke:var(--failure)}.pv-recovery{stroke:var(--recovery);stroke-dasharray:4 3}
.glass{background:color-mix(in srgb,var(--surface) 70%,transparent);-webkit-backdrop-filter:blur(16px) saturate(1.4);backdrop-filter:blur(16px) saturate(1.4);border:1px solid color-mix(in srgb,var(--rule) 80%,transparent);box-shadow:0 8px 30px rgba(17,24,39,.08),0 1px 2px rgba(17,24,39,.04)}
.tours{position:relative}.menu{position:absolute;left:0;top:calc(100% + 6px);z-index:12;width:300px;border-radius:12px;padding:6px}.menu[hidden]{display:none}.menu button{display:block;width:100%;text-align:left;border:0;border-radius:8px;padding:9px 10px;background:transparent}.menu button:hover{background:color-mix(in srgb,var(--rule) 60%,transparent)}.menu strong{display:block;font-weight:600}.menu span{display:block;color:var(--muted);font-size:12.5px;margin-top:2px}
#stage{position:fixed;inset:0;overflow:hidden;background:var(--canvas);touch-action:none}#scene{width:100%;height:100%;display:block;cursor:grab;user-select:none;-webkit-user-select:none}#scene.panning{cursor:grabbing}
.side{position:fixed;left:12px;top:12px;bottom:12px;width:300px;z-index:10;border-radius:16px;display:flex;flex-direction:column;overflow:auto;padding:12px 16px 18px;overscroll-behavior:contain}.side[hidden]{display:none}.side-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0 -6px 10px}.side .home{color:var(--muted);text-decoration:none;padding:4px 6px;border-radius:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.side .home:hover{color:var(--ink);background:color-mix(in srgb,var(--rule) 60%,transparent)}.side-nav{display:flex;align-items:center;gap:8px;margin-bottom:16px}.dests-nav{display:flex;background:color-mix(in srgb,var(--rule) 55%,transparent);border-radius:9px;padding:2px;flex:1}.dests-nav a{flex:1;text-align:center;padding:5px 8px;border-radius:7px;color:var(--ink-2);text-decoration:none;font-size:13px}.dests-nav a[aria-current]{background:var(--surface);color:var(--ink);font-weight:600;box-shadow:0 1px 2px rgba(17,24,39,.08)}#tour-btn{padding:5px 10px;font-size:13px;background:transparent}.side h1{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}.side h2{margin:0;font-size:18px;letter-spacing:-.01em;line-height:1.3}.story p,#panel .story p{margin:8px 0 0;color:var(--ink);line-height:1.6}.story p:first-child{margin-top:6px}details.more{margin-top:18px;padding-top:12px;border-top:1px solid color-mix(in srgb,var(--rule) 80%,transparent);font-size:13px;color:var(--ink-2)}details.more summary{cursor:pointer;color:var(--muted);width:max-content}details.more p{margin:8px 0 0}details.more ul{margin:4px 0 0}.k{font-weight:600;color:var(--muted);font-size:12px;margin:10px 0 2px}span.k{margin:0 6px 0 0}.side-tools{display:flex;gap:2px}.side .sum{margin:6px 0 0;color:var(--ink-2)}.side section{margin-top:18px}.side h3{margin:0 0 6px;font-size:12px;font-weight:600;color:var(--muted)}.side ul{list-style:none;margin:0;padding:0;display:grid;gap:5px}.side small{color:var(--muted)}.side details{font-size:13px;color:var(--ink-2)}.side summary{cursor:pointer;color:var(--muted);width:max-content}.side-key .legend{margin-top:10px}.side-body>section:first-child{margin-top:0}.hint{margin:10px 0 0;font-size:13px;color:var(--muted)}.hint[hidden]{display:none}
.zoom{position:fixed;right:16px;bottom:16px;z-index:9;display:flex;gap:2px;border-radius:11px;padding:3px}.zoom button{border:0;background:transparent;min-width:32px;height:30px;padding:0 9px}.zoom button:hover{background:color-mix(in srgb,var(--rule) 70%,transparent)}.side-open{position:fixed;left:16px;top:16px;z-index:10;width:38px;height:38px;border-radius:11px}.side-open[hidden]{display:none}
.legend{display:grid;gap:8px;font-size:13px;color:var(--ink-2)}.legend span{display:flex;align-items:center;gap:10px}.legend svg{width:28px;height:12px;flex:0 0 auto}
#panel{position:fixed;top:12px;right:12px;width:360px;z-index:9;border-radius:16px;overflow:auto;padding:20px 22px 24px;overscroll-behavior:contain;max-height:calc(100% - 84px)}#panel[hidden]{display:none}#panel-close{position:absolute;top:10px;right:10px}#panel-body:focus{outline:none}
#panel .eyebrow{margin:0 30px 4px 0;font-size:11px}#panel h2{margin:0 30px 8px 0;font-size:18px;line-height:1.25;letter-spacing:-.01em}#panel .lead{margin:0;color:var(--ink-2)}#panel section{margin-top:16px}#panel h3{margin:0 0 6px;font-size:12px;font-weight:600;color:var(--muted)}#panel p{margin:0}#panel ul{list-style:none;margin:0;padding:0;display:grid;gap:6px}#panel li.dot{padding-left:14px;position:relative}#panel li.dot::before{content:'';position:absolute;left:2px;top:.65em;width:4px;height:4px;border-radius:50%;background:var(--faint)}#panel small{color:var(--muted);font-size:12.5px}#panel .muted{color:var(--muted)}#panel .names{display:flex;flex-wrap:wrap;gap:6px}#panel .names li{display:block}
.chip{border:1px solid var(--rule);background:var(--canvas);border-radius:999px;padding:3px 10px;font-size:13px;color:var(--ink)}.chip:hover{border-color:var(--accent);color:var(--accent)}
.link{border:0;background:none;padding:0;color:var(--accent);cursor:pointer;text-align:left;border-radius:3px;text-decoration:none}.link:hover{text-decoration:underline}
.boundary{margin-top:12px!important;padding:8px 10px;border-left:2px solid var(--line);color:var(--ink-2);font-size:13px}
.conn+.conn{margin-top:12px;padding-top:12px;border-top:1px solid var(--rule)}.conn .dir{color:var(--muted);font-size:12.5px}
.ref{font-size:10.5px;vertical-align:super;line-height:0;color:var(--muted);text-decoration:none;margin-left:2px}.ref:hover{color:var(--accent)}
details.source{margin-top:18px;padding-top:10px;border-top:1px solid var(--rule);font-size:12px;color:var(--muted)}details.source summary{cursor:pointer;width:max-content}details.source ol{margin:8px 0 0;padding-left:18px;display:grid;gap:10px}details.source dl{display:grid;grid-template-columns:max-content 1fr;gap:3px 10px;margin:6px 0 0}details.source dt{font-weight:600;color:var(--ink-2)}details.source dd{margin:0}details.source a{word-break:break-all}details.source p{margin:4px 0 0}
.actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}
.tour{position:fixed;left:50%;transform:translateX(-50%);bottom:16px;z-index:9;width:min(560px,calc(100vw - 32px));border-radius:14px;padding:10px 14px 8px}.tour[hidden]{display:none}.tour-head{display:flex;justify-content:space-between;align-items:center;gap:10px;font-size:12px;color:var(--muted)}.badge{font-size:11px;color:var(--muted);border:1px solid var(--rule);border-radius:999px;padding:1px 8px}#tour-title{display:block;margin-top:6px;font-size:14px}#tour-caption{margin:2px 0 8px;color:var(--ink-2);font-size:13.5px}.tour-ctl{display:flex;gap:6px;align-items:center}.tour-ctl #tour-exit{margin-left:auto}
#figure{position:absolute;inset:16px;z-index:7;background:var(--surface);border:1px solid var(--rule);border-radius:14px;display:grid;grid-template-rows:auto 1fr auto;box-shadow:var(--shadow)}#figure[hidden]{display:none}#figure header{display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border-bottom:1px solid var(--rule)}#figure iframe{width:100%;height:100%;border:0}#figure footer{padding:8px 14px;color:var(--muted);font-size:12px;border-top:1px solid var(--rule)}
.group rect{fill:none;stroke:var(--group)}.group text{fill:var(--group-ink);font-size:10px;letter-spacing:.12em;text-transform:uppercase;font-weight:600}
.edge path.line{fill:none;stroke:var(--edge);stroke-width:1.15;transition:stroke .2s,opacity .25s}.edge.event path.line{stroke-dasharray:5 4}.edge path.hit{fill:none;stroke:transparent;stroke-width:14;cursor:pointer}.edge.on path.line{stroke:var(--accent);stroke-width:1.8}.dim{opacity:.3}.edge.dim{opacity:.18}
.card{cursor:pointer;transition:opacity .25s}.card .plate{fill:var(--plate)}.card .face{fill:var(--surface);stroke:var(--line);stroke-width:1;transition:stroke .2s}.card:hover .face{stroke:var(--faint)}.card.on .face{stroke:var(--accent);stroke-width:1.6}.card .name{font-size:13.5px;font-weight:600;fill:var(--ink)}.card .meta{font-size:11px;fill:var(--muted)}.card:focus{outline:none}.card:focus-visible .face{stroke:var(--focus);stroke-width:2}
.pill rect{fill:var(--surface);stroke:var(--accent);stroke-width:1}.pill text{font-size:11.5px;fill:var(--ink)}.token{fill:var(--accent)}
.lives a{display:block;padding:6px 10px;margin:0 -10px;border-radius:8px;color:var(--ink);text-decoration:none}.lives a:hover{background:color-mix(in srgb,var(--rule) 60%,transparent)}.lives a[aria-current]{background:var(--surface);font-weight:600}.lives small{display:block;font-weight:400;font-size:12px}.lives h4{margin:10px 0 2px;font-size:11px;letter-spacing:.07em;text-transform:uppercase;color:var(--muted);font-weight:600}.lives h4:first-child{margin-top:0}.kept a{text-decoration:none}.kept a:hover{text-decoration:underline}
.terms{display:grid;grid-template-columns:max-content 1fr;gap:6px 12px;margin:0}.terms dt{font-weight:700;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--ink)}.terms dd{margin:0;color:var(--ink-2)}
.st{cursor:pointer}.st rect.box{fill:var(--surface);stroke:var(--line);stroke-width:1.1;transition:stroke .2s}.st:hover rect.box{stroke:var(--faint)}.st .inner{fill:none;stroke:var(--line)}.st .label{font-size:14px;font-weight:600;fill:var(--ink)}.st .tag{font-size:10.5px;font-weight:600;letter-spacing:.06em;text-transform:uppercase}
.st.end rect.box{stroke-width:1.4}.st.success .tag{fill:var(--success)}.st.expiry .tag{fill:var(--expiry)}.st.failure .tag{fill:var(--failure)}.st.recovery .tag{fill:var(--recovery)}.st.neutral .tag{fill:var(--muted)}.st.unresolved .tag{fill:var(--muted)}.st.junction rect.box{stroke-dasharray:4 3}.st.junction .label{font-style:italic;font-weight:500}
.st.on rect.box{stroke:var(--accent);stroke-width:2}.st.to rect.box{stroke:var(--success);stroke-width:2}.st:focus{outline:none}.st:focus-visible rect.box{stroke:var(--focus);stroke-width:2.2}
.tr path.line{fill:none;stroke-width:1.3;transition:opacity .25s}.tr.main path.line{stroke:var(--main);stroke-width:1.9}.tr.alternative path.line{stroke:var(--alternative)}.tr.expiry path.line{stroke:var(--expiry);stroke-dasharray:6 4}.tr.failure path.line{stroke:var(--failure)}.tr.recovery path.line{stroke:var(--recovery);stroke-dasharray:2 3}.tr path.hit{fill:none;stroke:transparent;stroke-width:14;cursor:pointer}
.tr{--k:var(--action)}.tr.expiry{--k:var(--expiry)}.tr.failure{--k:var(--failure)}.tr.recovery{--k:var(--recovery)}.tr.alternative{--k:var(--action-2)}
.tr .lbl{cursor:pointer}.tr .lbl rect{fill:color-mix(in srgb,var(--k) 11%,var(--canvas));stroke:color-mix(in srgb,var(--k) 38%,var(--canvas));stroke-width:1;transition:stroke .2s,fill .2s}.tr .lbl:hover rect{stroke:var(--k)}.tr .lbl .a{font-size:12.5px;font-weight:600;fill:color-mix(in srgb,var(--k) 78%,var(--ink))}
.tr.on path.line{stroke:var(--accent)!important;stroke-width:2.4}.tr.on .lbl rect{fill:var(--accent-soft);stroke:var(--accent);stroke-width:1.6}.tr.on .lbl .a{fill:var(--accent)}.tr .lbl:focus{outline:none}.tr .lbl:focus-visible rect{stroke:var(--focus);stroke-width:2}.tr.dim,.st.dim{opacity:.45}
.exit{cursor:pointer}.exit rect{fill:var(--canvas);stroke:var(--line);stroke-dasharray:4 3}.exit:hover rect{stroke:var(--accent)}.exit .a{font-size:12.5px;font-weight:600;fill:var(--ink)}.exit .w{font-size:11.5px;fill:var(--muted)}.exit.on rect{stroke:var(--accent);stroke-dasharray:none}.exit:focus{outline:none}.exit:focus-visible rect{stroke:var(--focus);stroke-width:2}
.start{fill:var(--ink-2)}
@media (max-width:760px){.side{left:0;top:0;bottom:0;width:min(330px,88vw);border-radius:0 16px 16px 0;border-left:0}.side-open{left:12px;top:12px}.zoom{right:12px;bottom:12px}.menu{width:min(300px,calc(100vw - 48px))}
 #panel{top:auto;left:0;right:0;bottom:0;width:auto;max-height:58%;border-radius:18px 18px 0 0;border-bottom:0;padding:16px 18px 20px}.tour{bottom:auto;top:12px;width:calc(100vw - 72px);left:60px;transform:none}}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
`;

// ---------- shared client: data, drawing helpers, camera, panel, tours ----------

const COMMON = String.raw`
const D=JSON.parse(document.getElementById('explorer-model').textContent),$=id=>document.getElementById(id),NS='http://www.w3.org/2000/svg',PAGE=document.body.dataset.page;
const E=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const C=Object.fromEntries(D.components.map(c=>[c.id,c])),X=Object.fromEntries(D.connections.map(c=>[c.id,c])),O=Object.fromEntries(D.objects.map(o=>[o.id,o]));
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,narrow=()=>innerWidth<760;
const scene=$('scene'),stage=$('stage');let route={},cam={x:0,y:0,w:100,h:100},bounds={x:0,y:0,width:100,height:100},anim=null,tokens=[],focusNext=false;
const KIND={person:'Person',application:'Application',service:'Service',worker:'Worker',contract:'Smart contract',store:'Storage',external:'External service',network:'Network'};
const CONN={request:'Request and response',command:'Command',event:'Event or observation',transfer:'Transfer'};
const PATH={main:'Main path',alternative:'Alternative',expiry:'Expiry',failure:'Failure',recovery:'Recovery'};
const OUTCOME={success:'Completed',expiry:'Expired',failure:'Failed',recovery:'Recovered',neutral:''};
// a neutral end has no outcome word: its tag reads Ends alone
const ending=o=>OUTCOME[o||'neutral'];
const wrap=(t,max)=>{const out=[];let line='';for(const w of String(t).split(/\s+/)){if((line+' '+w).trim().length>max&&line){out.push(line);line=''}line+=(line?' ':'')+w}if(line)out.push(line);return out};
const kindLine=c=>KIND[c.kind]+(c.group&&!c.group.toLowerCase().includes(KIND[c.kind].toLowerCase())?' · '+c.group:'');
// routes: #/sel/<component>[/with/<component>] on the system page, #/o/<object>[/t|s|x/<id>|/about] on the states page, plus /scenario/<id>/<step>
function parse(h){const p=h.replace(/^#\/?/,'').split('/').filter(Boolean).map(decodeURIComponent),r={};for(let i=0;i<p.length;i+=2){const k=p[i],v=p[i+1];if(k==='scenario'){r.scenario=v;r.step=+p[i+2]||0;i++}else if(k==='about'){r.about=1;i--}else if(['sel','with','o','t','s','x'].includes(k)&&v!==undefined)r[k]=v}return r}
function hashOf(r){let h='#/';for(const k of ['sel','with','o','t','s','x'])if(r[k]!==undefined&&r[k]!==null&&r[k]!=='')h+=k+'/'+encodeURIComponent(r[k])+'/';if(r.about)h+='about/';if(r.scenario)h+='scenario/'+encodeURIComponent(r.scenario)+'/'+(r.step||0);return h.replace(/\/$/,'')||'#/'}
function go(r,{replace=false,focus=true}={}){focusNext=focus;const h=hashOf(r);if(location.hash===h||(h==='#/'&&!location.hash)){show();return}if(replace){history.replaceState(null,'',h);show()}else location.hash=h}
addEventListener('hashchange',()=>show());

// drawing
function el(tag,attrs={},parent=scene){const n=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))if(v!==undefined&&v!==null)n.setAttribute(k,v);parent.appendChild(n);return n}
function txt(parent,lines,x,y,cls,anchor='start',lh=16){const t=el('text',{x,y,class:cls,'text-anchor':anchor},parent);const all=[].concat(lines);all.forEach((l,i)=>{const s=el('tspan',{x,dy:i?lh:0},t);s.textContent=l+(i<all.length-1?' ':'')});return t}
function rounded(points,r=9){if(points.length<3)return 'M'+points.map(p=>p.join(' ')).join('L');let d='M'+points[0][0]+' '+points[0][1];for(let i=1;i<points.length-1;i++){const [a,b,c]=[points[i-1],points[i],points[i+1]],l1=Math.hypot(b[0]-a[0],b[1]-a[1]),l2=Math.hypot(c[0]-b[0],c[1]-b[1]),k=Math.min(r,l1/2,l2/2);if(!l1||!l2)continue;const p1=[b[0]+(a[0]-b[0])*k/l1,b[1]+(a[1]-b[1])*k/l1],p2=[b[0]+(c[0]-b[0])*k/l2,b[1]+(c[1]-b[1])*k/l2];d+='L'+p1.join(' ')+'Q'+b.join(' ')+' '+p2.join(' ')}const z=points[points.length-1];return d+'L'+z[0]+' '+z[1]}
function markers(colors){const defs=el('defs');for(const [id,color] of colors){const m=el('marker',{id,viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:7,markerHeight:7,orient:'auto-start-reverse'},defs);el('path',{d:'M1 1L9 5L1 9',fill:'none',stroke:color,'stroke-width':1.6,'stroke-linecap':'round','stroke-linejoin':'round'},m)}}
function activate(node,onSelect,label){node.setAttribute('tabindex','0');node.setAttribute('role','button');if(label)node.setAttribute('aria-label',label);node.dataset.hit='1';node.addEventListener('click',e=>{e.stopPropagation();focusNext=false;onSelect()});node.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();focusNext=false;onSelect()}})}
function stopTokens(){tokens.forEach(t=>t.stop());tokens=[]}
function travel(path,{back=false,repeat=1,dur=1100}={}){if(reduce||!path)return;const L=path.getTotalLength(),dot=el('circle',{r:4,class:'token'},path.parentNode);let n=0,raf,t0=performance.now(),dead=false;
 const step=now=>{if(dead)return;let t=(now-t0)/dur;if(t>=1){n++;t0=now;t=0;if(n>=(back?repeat*2:repeat)){dot.remove();return}}const u=!back||n%2===0?t:1-t,e=u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2,p=path.getPointAtLength(L*e);dot.setAttribute('cx',p.x);dot.setAttribute('cy',p.y);raf=requestAnimationFrame(step)};
 raf=requestAnimationFrame(step);tokens.push({stop(){dead=true;cancelAnimationFrame(raf);dot.remove()}})}

// camera: the diagram fills the screen; framing keeps clear of the floating sidebar, panel, tour and zoom, and text never drops below a readable scale on entry
function insets(){const n=narrow(),m=n?12:20,i={l:m,t:m,r:m,b:n?60:64};const side=$('side'),p=$('panel'),t=$('tour');
 if(!side.hidden&&!n)i.l=side.getBoundingClientRect().right+m;
 if(!p.hidden){if(n)i.b=p.offsetHeight+12;else i.r=p.offsetWidth+28}if(!t.hidden){if(n)i.t=Math.max(i.t,t.offsetTop+t.offsetHeight+12);else i.b=Math.max(i.b,t.offsetHeight+28)}return i}
let seen=null;
function setCam(c){cam=c;scene.setAttribute('viewBox',c.x+' '+c.y+' '+c.w+' '+c.h);seen={w:scene.clientWidth,h:scene.clientHeight}}
// when the panel, a tour or the key changes the stage size, the diagram keeps its scale and top-left corner instead of shrinking
function sync(){const w=scene.clientWidth,h=scene.clientHeight;if(!w||!h||!seen||!seen.w||(w===seen.w&&h===seen.h))return;const k=seen.w/cam.w;setCam({x:cam.x,y:cam.y,w:w/k,h:h/k})}
new ResizeObserver(sync).observe(stage);
// the sidebar holds navigation, what is shown and the key; the reader folds it away and the choice is remembered (closed by default on phones)
function sideOpen(on,remember=true,refit=true){$('side').hidden=!on;$('side-open').hidden=on;if(remember)try{localStorage.setItem('explorer-side',on?'open':'closed')}catch(e){};if(on&&narrow())$('side-close').focus();if(refit&&window.afterSide)afterSide()}
$('side-close').onclick=()=>{sideOpen(false);$('side-open').focus()};$('side-open').onclick=()=>sideOpen(true);
(()=>{let v=null;try{v=localStorage.getItem('explorer-side')}catch(e){}sideOpen(narrow()?false:v!=='closed',false,false)})();
function area(){const r=scene.getBoundingClientRect(),i=insets();return {r,i,aw:Math.max(60,r.width-i.l-i.r),ah:Math.max(60,r.height-i.t-i.b)}}
function frame(b,s,align){const {r,i,aw,ah}=area();let x=b.x+b.width/2-(i.l+aw/2)/s,y=b.y+b.height/2-(i.t+ah/2)/s;if(align==='start'){if(b.width*s>aw)x=b.x-i.l/s;if(b.height*s>ah)y=b.y-i.t/s}return {x,y,w:r.width/s,h:r.height/s}}
function fitScale(b,pad=24){const {aw,ah}=area();return Math.min(1.15,aw/(b.width+pad*2),ah/(b.height+pad*2))}
const minRead=()=>narrow()?.72:.8;
function visible(b,min){const {r,i}=area(),s=r.width/cam.w,x0=(b.x-cam.x)*s,y0=(b.y-cam.y)*s;return s>=min*.97&&x0>=i.l-1&&y0>=i.t-1&&x0+b.width*s<=r.width-i.r+1&&y0+b.height*s<=r.height-i.b+1&&!underControl(b,cam)}
// a selection is shown whole when that stays readable; otherwise its core is centred at reading size
// a selection whose neighbourhood needs the sidebar's room folds the sidebar for now (not remembered); one click brings it back
// a box is shown when it lies inside the area left clear of the sidebar, panel, tour and zoom
function shown(b,c){const {r,i}=area(),s=r.width/c.w,x0=(b.x-c.x)*s,y0=(b.y-c.y)*s;return x0>=i.l-1&&y0>=i.t-1&&x0+b.width*s<=r.width-i.r+1&&y0+b.height*s<=r.height-i.b+1&&!underControl(b,c)}
// a selection fits whole when it can at a readable size; otherwise the view stays at the readable floor, keeps the
// selection in view and shows as many of its neighbours as fit, and the details panel links the rest
// a selection may fold the sidebar for now, but never right after the reader opened it
let holdSide=false;
// rest: other items that stay undimmed during the selection; the chosen view then moves a little so none of them sits under a
// control, as long as everything it showed whole stays whole and the selection stays clear
function reveal(b,core,items,rest){const m=minRead(),each=items&&items.length?items:[b],whole=v=>scene.getBoundingClientRect().width/v.w>=m*.97&&each.every(q=>shown(q,v));
 const settle=v=>{const bad=t=>(rest||[]).some(q=>underControl(q,t));if(!bad(v))return v;const s=scene.getBoundingClientRect().width/v.w,keep=each.filter(q=>shown(q,v)),c=core||b;
  for(let d=8;d<=160;d+=8)for(const[dx,dy]of[[0,d],[0,-d],[d,0],[-d,0],[d,d],[-d,d],[d,-d],[-d,-d]]){const t={...v,x:v.x-dx/s,y:v.y-dy/s};if(!bad(t)&&shown(c,t)&&keep.every(q=>shown(q,t))&&!each.some(q=>underControl(q,t)))return t}return v};
 if(whole(cam)){const t=settle(cam);if(t!==cam)flyTo(t);return}if(!holdSide&&!narrow()&&!$('side').hidden&&fitScale(b,20)<m)sideOpen(false,false,false);if(whole(cam)){const t=settle(cam);if(t!==cam)flyTo(t);return}
 const s=fitScale(b,20);if(s>=m){const v=clearOfControls(frame(b,Math.min(1,s)),each);if(whole(v)){flyTo(settle(v));return}}
 const c=core||b,list=each,{r,i}=area(),w=r.width/m,h=r.height/m,lx=c.x+c.width-(r.width-i.r)/m,hx=c.x-i.l/m,ly=c.y+c.height-(r.height-i.b)/m,hy=c.y-i.t/m;
 if(lx>hx||ly>hy){if(!visible(c,m))flyTo(settle(frame(c,Math.max(m,Math.min(1,fitScale(c,20))))));return}
 // positions are tried on a grid and where an item's edge meets the clear area's edge, so narrow fits are not missed;
 // among equal counts, the one showing more of the items it cuts wins; an item it cuts may not sit under the zoom or the show-sidebar button
 const part=(q,v)=>{const x0=Math.max(q.x,v.x+i.l/m),x1=Math.min(q.x+q.width,v.x+(r.width-i.r)/m),y0=Math.max(q.y,v.y+i.t/m),y1=Math.min(q.y+q.height,v.y+(r.height-i.b)/m);return x1>x0&&y1>y0?(x1-x0)*(y1-y0)/(q.width*q.height):0};
 const score=v=>{let n=0,f=0;for(const q of list){if(shown(q,v))n++;else if(underControl(q,v))f-=1;else f+=part(q,v)}return n+f/(list.length+1)},mid=frame(c,m),clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
 const xs=[...Array(9).keys()].map(a=>lx+(hx-lx)*a/8).concat(list.flatMap(q=>[q.x-i.l/m,q.x+q.width-(r.width-i.r)/m]).map(v=>clamp(v,lx,hx)));
 const ys=[...Array(9).keys()].map(k=>ly+(hy-ly)*k/8).concat(list.flatMap(q=>[q.y-i.t/m,q.y+q.height-(r.height-i.b)/m]).map(v=>clamp(v,ly,hy)));
 let best={...mid,n:score(mid),d:0};
 for(const x of xs)for(const y of ys){const v={x,y,w,h},n=score(v),d=Math.hypot(x-mid.x,y-mid.y);if(n>best.n+1e-9||(Math.abs(n-best.n)<1e-9&&d<best.d))best={...v,n,d}}

 if(visible(c,m)&&score(cam)>=best.n-1e-9){const t=settle(cam);if(t!==cam)flyTo(t);return}flyTo(settle({x:best.x,y:best.y,w,h}))}
// a view opens with nothing under the zoom or the show-sidebar button: it moves a little until no card, state or action sits beneath them
// the zoom and the show-sidebar button are small: the view keeps content from under them rather than reserving whole bands
function underControl(b,c){const r=scene.getBoundingClientRect(),s=r.width/c.w,x0=r.left+(b.x-c.x)*s,y0=r.top+(b.y-c.y)*s;return [...document.querySelectorAll('.zoom,#side-open')].filter(n=>!n.hidden&&getComputedStyle(n).display!=='none').some(n=>{const q=n.getBoundingClientRect();return x0<q.right+6&&x0+b.width*s>q.left-6&&y0<q.bottom+6&&y0+b.height*s>q.top-6})}
function clearOfControls(c,items){if(!items.some(b=>underControl(b,c)))return c;const s=scene.getBoundingClientRect().width/c.w;for(let d=8;d<=160;d+=8)for(const dy of[d,-d]){const t={...c,y:c.y-dy/s};if(!items.some(b=>underControl(b,t)))return t}return c}
function flyTo(target,ms=380){cancelAnimationFrame(anim);if(reduce||!ms){setCam(target);return}const from={...cam},t0=performance.now(),ease=t=>1-Math.pow(1-t,3);
 const step=now=>{const t=Math.min(1,(now-t0)/ms),k=ease(t);setCam({x:from.x+(target.x-from.x)*k,y:from.y+(target.y-from.y)*k,w:from.w+(target.w-from.w)*k,h:from.h+(target.h-from.h)*k});if(t<1)anim=requestAnimationFrame(step)};anim=requestAnimationFrame(step)}
function zoomBy(f,cx,cy){const r=scene.getBoundingClientRect();cx=cx??r.width/2;cy=cy??r.height/2;const px=cam.x+cam.w*cx/r.width,py=cam.y+cam.h*cy/r.height,w=Math.max(120,Math.min(bounds.width*4+800,cam.w*f)),h=w*cam.h/cam.w;setCam({x:px-(px-cam.x)*w/cam.w,y:py-(py-cam.y)*h/cam.h,w,h})}
$('zoom-in').onclick=()=>zoomBy(1/1.2);$('zoom-out').onclick=()=>zoomBy(1.2);$('zoom-fit').onclick=()=>flyTo(frame(bounds,fitScale(bounds)),260);
scene.addEventListener('wheel',e=>{e.preventDefault();const r=scene.getBoundingClientRect();if(e.ctrlKey||e.metaKey)zoomBy(Math.exp(e.deltaY*.0025),e.clientX-r.left,e.clientY-r.top);else setCam({...cam,x:cam.x+e.deltaX*cam.w/r.width,y:cam.y+e.deltaY*cam.h/r.height})},{passive:false});
const ptrs=new Map();let drag=null,pinch=null;
scene.addEventListener('pointerdown',e=>{ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});if(ptrs.size===2){const [a,b]=[...ptrs.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y)};drag=null;return}drag={x:e.clientX,y:e.clientY,cam:{...cam},moved:false,hit:!!e.target.closest('[data-hit]')};if(!drag.hit){scene.setPointerCapture(e.pointerId);scene.classList.add('panning')}});
scene.addEventListener('pointermove',e=>{if(ptrs.has(e.pointerId))ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});const r=scene.getBoundingClientRect();if(pinch&&ptrs.size===2){const [a,b]=[...ptrs.values()],d=Math.hypot(a.x-b.x,a.y-b.y);if(d>0)zoomBy(pinch.d/d,(a.x+b.x)/2-r.left,(a.y+b.y)/2-r.top);pinch.d=d;return}if(!drag||drag.hit)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>3)drag.moved=true;setCam({...drag.cam,x:drag.cam.x-dx*cam.w/r.width,y:drag.cam.y-dy*cam.h/r.height})});
const release=e=>{ptrs.delete(e.pointerId);if(ptrs.size<2)pinch=null;if(e.type==='pointerup'&&drag&&!drag.hit&&!drag.moved)background();drag=null;scene.classList.remove('panning')};
scene.addEventListener('pointerup',release);scene.addEventListener('pointercancel',release);

// the details panel: one closable panel; each section appears only when it explains the selection
let closedFor=null;const panelKey=()=>hashOf({...route,scenario:undefined});
function sourceList(list){list=list.filter(Boolean);const seen=new Map();for(const x of list){const k=JSON.stringify(x);if(!seen.has(k))seen.set(k,x)}return [...seen.values()]}
function refs(list){const s=sourceList(list);return s}
// sources stay bound to every fact and are checked when the pages are generated; readers see the explanation, not citation marks
function sourceBlock(list){return ''}
function cite(exact,list){return ''}
function panel(o){const p=$('panel');if(!o||closedFor===panelKey()){p.hidden=true;sync();return}closedFor=null;p.hidden=false;
 $('panel-body').innerHTML=(o.eyebrow?'<p class="eyebrow">'+E(o.eyebrow)+'</p>':'')+'<h2>'+o.title+'</h2>'+(o.lead?'<p class="lead">'+o.lead+'</p>':'')+(o.extra||'')+(o.sections||[]).filter(Boolean).map(s=>'<section><h3>'+E(s[0])+'</h3>'+s[1]+'</section>').join('')+(o.actions||'')+(o.more||'');
 p.querySelectorAll('[data-go]').forEach(b=>b.onclick=e=>{e.preventDefault();go(JSON.parse(b.dataset.go))});
 p.querySelectorAll('[data-src]').forEach(a=>a.onclick=e=>{e.preventDefault();const d=p.querySelector('details.source');d.open=true;p.querySelector('#src-'+a.dataset.src)?.scrollIntoView({block:'nearest'})});
 p.querySelectorAll('[data-figure]').forEach(b=>b.onclick=()=>openFigure(C[b.dataset.figure]));p.scrollTop=0;sync()}
$('panel-close').onclick=()=>{closedFor=panelKey();panel(null);fitAfterPanel()};
const goBtn=(label,r,cls='link')=>'<button class="'+cls+'" data-go="'+E(JSON.stringify(r))+'">'+E(label)+'</button>';
const pageLink=(label,page,r)=>'<a class="link" href="'+page+'.html'+hashOf(r)+'">'+E(label)+'</a>';
function openFigure(c){const f=$('figure');f.hidden=false;f.innerHTML='<header><strong>'+E(c.figure.title)+'</strong><button id="figure-close">Close</button></header><iframe title="'+E(c.figure.title)+'" src="'+E('../'+c.figure.file)+'"></iframe><footer>'+E(c.figure.caption)+' · '+E(c.figure.tool)+'</footer>';$('figure-close').onclick=closeFigure;$('figure-close').focus()}
function closeFigure(){$('figure').hidden=true;$('figure').innerHTML=''}

// tours: recorded paths through both destinations; a step opens the destination that owns it
const tours=D.scenarios;
function stepTarget(s,i){const st=s.steps[i],base={scenario:s.id,step:i};
 if(st.object)return {page:'states',route:{...base,o:st.object,t:st.transition}};
 if(st.connection){const x=X[st.connection],a=st.via||x.from;return {page:'system',route:{...base,sel:a,with:a===x.from?x.to:x.from}}}
 return {page:'system',route:{...base,sel:st.component}}}
function tourGo(s,i){const t=stepTarget(s,i);if(t.page===PAGE)go(t.route);else location.href=t.page+'.html'+hashOf(t.route)}
if(tours.length){$('tour-menu').innerHTML=tours.map(s=>'<button role="menuitem" data-tour="'+E(s.id)+'"><strong>'+E(s.title)+'</strong><span>'+E(s.intro)+'</span></button>').join('');
 const toggle=open=>{$('tour-menu').hidden=!open;$('tour-btn').setAttribute('aria-expanded',String(open))};
 $('tour-btn').onclick=e=>{e.stopPropagation();toggle($('tour-menu').hidden);if(!$('tour-menu').hidden)$('tour-menu').querySelector('button').focus()};document.addEventListener('click',e=>{if(!e.target.closest('.tours'))toggle(false)});
 $('tour-menu').querySelectorAll('[data-tour]').forEach(b=>b.onclick=()=>{toggle(false);closedFor=null;tourGo(tours.find(s=>s.id===b.dataset.tour),0)});
 window.closeTourMenu=()=>{if($('tour-menu').hidden)return false;toggle(false);$('tour-btn').focus();return true}}
const tourStep=d=>{const s=tours.find(q=>q.id===route.scenario),n=route.step+d;if(s&&n>=0&&n<s.steps.length)tourGo(s,n)};
$('tour-prev').onclick=()=>tourStep(-1);$('tour-next').onclick=()=>tourStep(1);$('tour-exit').onclick=()=>endTour();
function endTour(){go({...route,scenario:undefined,step:undefined},{focus:true})}
function tourFrame(){const s=route.scenario&&tours.find(q=>q.id===route.scenario);$('tour').hidden=!s;if(!s){sync();return false}const st=s.steps[route.step];if(!st)return false;
 $('tour-title').textContent=s.title;$('tour-count').textContent='Step '+(route.step+1)+' of '+s.steps.length;$('tour-caption').textContent=st.caption;$('tour-prev').disabled=route.step===0;$('tour-next').disabled=route.step===s.steps.length-1;sync();
 const a=document.activeElement;if(!a||a===document.body||a.disabled||!a.closest('#tour'))requestAnimationFrame(()=>($('tour-next').disabled?$('tour-exit'):$('tour-next')).focus());return true}
function ownsStep(){const s=route.scenario&&tours.find(q=>q.id===route.scenario);if(!s||!s.steps[route.step])return true;const t=stepTarget(s,route.step);if(t.page===PAGE)return true;location.replace(t.page+'.html'+hashOf(t.route));return false}

addEventListener('keydown',e=>{if(e.key!=='Escape')return;if(narrow()&&!$('side').hidden){sideOpen(false,false);$('side-open').focus();return}if(window.closeTourMenu&&window.closeTourMenu())return;if(!$('figure').hidden){closeFigure();return}if(route.scenario){endTour();return}up()});
`;

// ---------- system overview ----------

const SYSTEM = String.raw`
const L=D.overview,near=(a,b)=>D.connections.filter(e=>(e.from===a&&e.to===b)||(e.from===b&&e.to===a)),neighbours=id=>[...new Set(D.connections.filter(e=>e.from===id||e.to===id).map(e=>e.from===id?e.to:e.from))];
let layers=null,hover=null,started=false,lastSel=null,lastWidth=innerWidth;
function icon(kind,parent,x,y,color){const g=el('g',{transform:'translate('+x+' '+y+')',fill:'none',stroke:color,'stroke-width':1.4,'stroke-linecap':'round','stroke-linejoin':'round'},parent);const P=d=>el('path',{d},g);
 if(kind==='person'){el('circle',{cx:9,cy:6,r:3.4},g);P('M2.5 17c.8-3.6 3.4-5.4 6.5-5.4s5.7 1.8 6.5 5.4')}
 else if(kind==='application'){el('rect',{x:1.5,y:2.5,width:15,height:11,rx:2},g);P('M6 16.5h6M9 13.5v3')}
 else if(kind==='service'){P('M3 5.5h12M3 9h12M3 12.5h12');el('rect',{x:1.5,y:2.5,width:15,height:13,rx:2.5},g)}
 else if(kind==='worker'){el('circle',{cx:9,cy:9,r:6.5},g);P('M9 5.5V9l2.6 1.8')}
 else if(kind==='contract'){P('M4 2.5h7l3.5 3.5v9.5H4z');P('M11 2.5V6h3.5M6.5 10h5M6.5 12.8h3.5')}
 else if(kind==='store'){el('ellipse',{cx:9,cy:4.5,rx:6.5,ry:2.5},g);P('M2.5 4.5v9c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5v-9M2.5 9c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5')}
 else if(kind==='network'){el('circle',{cx:9,cy:9,r:6.8},g);P('M2.2 9h13.6M9 2.2c2 2 2.9 4.3 2.9 6.8S11 13.8 9 15.8C7 13.8 6.1 11.5 6.1 9S7 4.2 9 2.2')}
 else {el('rect',{x:2,y:2,width:14,height:14,rx:3,'stroke-dasharray':'3 2.4'},g);P('M6.5 9h5M9 6.5v5')}}
const lineSample=k=>'<svg viewBox="0 0 34 12" aria-hidden="true"><path d="M2 6H31" stroke="var(--edge)" stroke-width="1.4" fill="none" '+(k==='event'?'stroke-dasharray="4 3"':'')+'/>'+(k==='request'?'<path d="M6 2L2 6L6 10" stroke="var(--edge)" fill="none" stroke-width="1.4"/>':'')+'<path d="M27 2L31 6L27 10" stroke="var(--edge)" fill="none" stroke-width="1.4"/></svg>';
$('side-body').innerHTML='<p class="sum">'+E(D.summary)+'</p><p id="hint" class="hint">Select a component to see what it does and how it connects.</p>';
$('legend').innerHTML=[['request','Request and response'],['command','Command or transfer'],['event','Event or observation']].map(([k,l])=>'<span>'+lineSample(k)+E(l)+'</span>').join('');
function draw(){scene.innerHTML='';markers([['arrow','var(--edge)'],['arrow-on','var(--accent)']]);bounds={x:0,y:0,width:L.width,height:L.height};
 for(const g of L.groups){const n=el('g',{class:'group'});el('rect',{x:g.x,y:g.y,width:g.width,height:g.height,rx:14},n);txt(n,g.name,g.x+16,g.y+22,'')}
 const edges=el('g'),cards=el('g'),labels=el('g');
 for(const e of D.connections){const g=el('g',{class:'edge '+e.kind,'data-id':e.id},edges),d=rounded(L.routes[e.id]);el('path',{class:'line',d,'marker-end':'url(#arrow)','marker-start':e.kind==='request'?'url(#arrow)':null},g);const hit=el('path',{class:'hit',d},g);hit.dataset.hit='1';
  hit.addEventListener('click',ev=>{ev.stopPropagation();const a=route.sel===e.to?e.to:e.from;focusNext=false;go({sel:a,with:a===e.from?e.to:e.from})});hit.addEventListener('mouseenter',()=>{hover={edge:e.id};paint()});hit.addEventListener('mouseleave',()=>{hover=null;paint()})}
 for(const c of D.components){const b=L.cards[c.id],g=el('g',{class:'card','data-id':c.id,transform:'translate('+b.x+' '+b.y+')'},cards);
  el('rect',{class:'plate',x:0,y:3,width:b.width,height:b.height,rx:10},g);el('rect',{class:'face',width:b.width,height:b.height,rx:10},g);icon(c.kind,g,14,b.height/2-9,'var(--'+c.kind+')');
  txt(g,c.name,42,b.height/2-3,'name');txt(g,c.meta,42,b.height/2+13,'meta');
  activate(g,()=>go({sel:c.id}),c.name+', '+KIND[c.kind]);g.addEventListener('mouseenter',()=>{hover={card:c.id};paint()});g.addEventListener('mouseleave',()=>{hover=null;paint()})}
 return {labels}}
function activeEdges(){if(route.sel&&route.with)return near(route.sel,route.with).map(e=>e.id);if(route.sel)return D.connections.filter(e=>e.from===route.sel||e.to===route.sel).map(e=>e.id);if(hover?.card)return D.connections.filter(e=>e.from===hover.card||e.to===hover.card).map(e=>e.id);if(hover?.edge)return [hover.edge];return []}
function paint(){const ids=new Set(activeEdges()),sel=route.sel,keep=new Set(sel?[sel,...(route.with?[route.with]:neighbours(sel))]:hover?.card?[hover.card,...neighbours(hover.card)]:[]);
 scene.querySelectorAll('.edge').forEach(n=>{const on=ids.has(n.dataset.id),e=X[n.dataset.id];n.classList.toggle('on',on);n.classList.toggle('dim',ids.size>0&&!on&&!!sel);const l=n.querySelector('.line');l.setAttribute('marker-end',on?'url(#arrow-on)':'url(#arrow)');if(e.kind==='request')l.setAttribute('marker-start',on?'url(#arrow-on)':'url(#arrow)')});
 scene.querySelectorAll('.card').forEach(n=>{n.classList.toggle('on',n.dataset.id===sel||n.dataset.id===route.with);n.classList.toggle('dim',!!sel&&!keep.has(n.dataset.id))});
 layers.labels.innerHTML='';const owner=sel||hover?.card;for(const id of ids){const s=(L.labels[owner||X[id].from]||{})[id];if(!s)continue;const g=el('g',{class:'pill'},layers.labels);el('rect',{x:s.x,y:s.y,width:s.w,height:s.h,rx:s.h<26?s.h/2:8},g);txt(g,s.lines,s.x+s.w/2,s.y+16,'','middle',15)}}
function neighbourhood(){const ids=route.with?[route.sel,route.with]:[route.sel,...neighbours(route.sel)],boxes=ids.map(id=>L.cards[id]).concat(activeEdges().map(id=>(L.labels[route.sel]||{})[id]).filter(Boolean).map(s=>({x:s.x,y:s.y,width:s.w,height:s.h})));
 const x0=Math.min(...boxes.map(b=>b.x)),y0=Math.min(...boxes.map(b=>b.y));return {x:x0-16,y:y0-16,width:Math.max(...boxes.map(b=>b.x+b.width))-x0+32,height:Math.max(...boxes.map(b=>b.y+b.height))-y0+32,items:boxes}}
function hub(){return D.components.map(c=>[c.id,D.connections.filter(e=>e.from===c.id||e.to===c.id).length]).sort((a,b)=>b[1]-a[1])[0][0]}
function startView(){return clearOfControls(startFrame(),Object.values(L.cards))}
function startFrame(){const s=fitScale(bounds);if(s>=minRead())return frame(bounds,Math.min(1,s));if(narrow()){const b=L.cards[hub()];return frame({x:b.x-40,y:b.y-60,width:b.width+80,height:b.height+120},minRead())}return frame(bounds,minRead(),'start')}
function component(c){const conns=D.connections.filter(e=>e.from===c.id||e.to===c.id),src=sourceList([c.exact,c.boundary?.exact,...c.responsibilities.map(r=>r.exact)]);
 return {eyebrow:kindLine(c),title:E(c.name),lead:E(c.summary)+' '+cite(c.exact,src),extra:c.boundary?'<p class="boundary"><strong>'+E(c.boundary.label)+'.</strong> '+E(c.boundary.text)+' '+cite(c.boundary.exact,src)+'</p>':'',
  sections:[conns.length?['Connects with','<ul class="names">'+neighbours(c.id).map(id=>'<li>'+goBtn(C[id].name,{sel:c.id,with:id},'chip')+'</li>').join('')+'</ul>']:null,
   c.responsibilities.length?['Responsibilities','<ul>'+c.responsibilities.map(r=>'<li class="dot">'+E(r.name)+' <small>· '+E(r.domain)+'</small>'+cite(r.exact,src)+'</li>').join('')+'</ul>']:null,
   c.lifecycles.length?['States it keeps','<ul>'+c.lifecycles.map(id=>'<li>'+pageLink(O[id].name+' →','states',{o:id})+'</li>').join('')+'</ul>']:null],
  actions:c.figure?'<div class="actions"><button data-figure="'+E(c.id)+'">Open figure</button></div>':'',sources:src}}
function relationship(a,b){const list=near(a.id,b.id),src=sourceList(list.map(e=>e.exact));
 return {eyebrow:'Connection',title:E(a.name)+' <span class="muted">and</span> '+E(b.name),
  extra:'<section>'+list.map(e=>'<div class="conn"><p><strong>'+E(e.label)+'</strong>'+cite(e.exact,src)+'</p><p class="dir">'+E(C[e.from].name)+(e.kind==='request'?' ⇄ ':' → ')+E(C[e.to].name)+' · '+E(CONN[e.kind])+'</p>'+(e.detail?'<p>'+E(e.detail)+'</p>':'')+'</div>').join('')+'</section>',
  actions:'<div class="actions">'+goBtn('About '+b.name,{sel:b.id},'')+goBtn('Back to '+a.name,{sel:a.id},'')+'</div>',sources:src}}
function up(){if(route.with)go({sel:route.sel});else if(route.sel)go({})}
function background(){if(route.scenario)return;if(route.sel)go({})}
function fitAfterPanel(){}
window.afterSide=()=>{if(!started)return;if(route.sel){const b=L.cards[route.with||route.sel],n=neighbourhood();holdSide=true;reveal(n,{x:b.x-24,y:b.y-24,width:b.width+48,height:b.height+48},n.items);holdSide=false}else flyTo(startView(),260)};
function show(){closeFigure();route=parse(location.hash);if(!ownsStep())return;if(route.sel&&!C[route.sel])route={};if(route.with&&(!C[route.with]||!near(route.sel,route.with).length))route.with=undefined;
 tourFrame();if(!layers)layers=draw();stopTokens();paint();
 $('hint').hidden=!!route.sel||!!route.scenario;
 if(!route.sel)panel(null);else panel(route.with?relationship(C[route.sel],C[route.with]):component(C[route.sel]));
 if(!started){started=true;setCam(startView())}
 const key=route.sel+'|'+route.with;if(route.sel&&key!==lastSel){const b=L.cards[route.with||route.sel],n=neighbourhood();reveal(n,{x:b.x-24,y:b.y-24,width:b.width+48,height:b.height+48},n.items);activeEdges().forEach(id=>{if(route.with)travel(scene.querySelector('.edge[data-id="'+CSS.escape(id)+'"] .line'),{back:X[id].kind==='request'})})}
 lastSel=key;
 if(focusNext&&route.sel){const n=scene.querySelector('.card[data-id="'+CSS.escape(route.with||route.sel)+'"]');n&&n.focus({preventScroll:true})}focusNext=false}
addEventListener('resize',()=>{if(Math.abs(innerWidth-lastWidth)<40)return;lastWidth=innerWidth;setCam(route.sel?frame(neighbourhood(),Math.max(minRead(),Math.min(1,fitScale(neighbourhood())))):startView())});
focusNext=true;show();
`;

// ---------- states and transitions ----------

const STATES = String.raw`
let drawn=null,lastSelKey=null,mode=null,lastWidth=innerWidth;
const objectOf=()=>O[route.o]||D.objects[0];
const nodeOf=(o,id)=>o.nodes.find(n=>n.id===id),edgeOf=(o,id)=>o.edges.find(e=>e.id===id);
// the sidebar lists the lifecycles when there is a choice, then tells the shown one's story
function intro(o){const groups=new Map();for(const x of D.objects){const k=x.owners[0].component;if(!groups.has(k))groups.set(k,[]);groups.get(k).push(x)}
 $('side-body').innerHTML=(D.objects.length>1?'<section class="lives" style="margin:0 0 18px"><h3>Lifecycles</h3>'+[...groups].map(([k,list])=>'<h4>'+E(C[k].name)+'</h4>'+list.map(x=>'<a href="#/o/'+encodeURIComponent(x.id)+'"'+(x.id===o.id?' aria-current="true"':'')+'>'+E(x.name)+'<small>'+x.nodes.filter(n=>!n.junction).length+' states · '+x.edges.length+' actions</small></a>').join('')).join('')+'</section>':'')
  +'<h2>'+E(o.name)+'</h2><div class="story">'+paras(o.story)+'</div>'
  +(o.exclusions.length?'<details class="more"><summary>'+o.exclusions.length+' recorded '+(o.exclusions.length>1?'rows are':'row is')+' not drawn</summary><ul>'+o.exclusions.map(x=>'<li class="dot">'+E(x.reason)+'</li>').join('')+'</ul></details>':'');
 $('side-body').querySelectorAll('.lives a').forEach(a=>a.addEventListener('click',()=>{if(narrow())sideOpen(false,false)}));
 legend(o)}
// the key shows only the notation this lifecycle uses
function legend(o){const used=new Set(o.edges.map(e=>e.path).concat(o.exits.map(x=>x.path))),kinds=Object.keys(PATH).filter(k=>used.has(k));
 const line=k=>'<svg viewBox="0 0 28 12" aria-hidden="true"><path d="M1 6H21" stroke="var(--'+k+')" stroke-width="'+(k==='main'?2:1.5)+'" fill="none" '+(k==='expiry'?'stroke-dasharray="5 3"':k==='recovery'?'stroke-dasharray="2 3"':'')+'/><path d="M20 2.5L25 6L20 9.5" stroke="var(--'+k+')" stroke-width="1.5" fill="none"/></svg>';
 $('legend').innerHTML=(o.start?'<span><svg viewBox="0 0 28 12" aria-hidden="true"><circle cx="6" cy="6" r="4.5" fill="var(--ink-2)"/></svg>Start</span>':'')+kinds.map(k=>'<span>'+line(k)+E(PATH[k])+'</span>').join('')
  +(o.nodes.some(n=>n.terminal&&!n.terminalUnresolved)?'<span><svg viewBox="0 0 28 12" aria-hidden="true"><rect x="3" y="1" width="22" height="10" rx="3" fill="none" stroke="var(--ink-2)" stroke-width="1.2"/><rect x="5.5" y="3.5" width="17" height="5" rx="1.5" fill="none" stroke="var(--ink-2)" stroke-width="1"/></svg>Final state</span>':'')
  +(o.exits.length?'<span><svg viewBox="0 0 28 12" aria-hidden="true"><rect x="3" y="1" width="22" height="10" rx="3" fill="none" stroke="var(--ink-2)" stroke-width="1.2" stroke-dasharray="3 2"/></svg>Continues elsewhere</span>':'')
  +'<span><svg viewBox="0 0 28 12" aria-hidden="true"><rect x="1" y="1" width="26" height="10" rx="5" fill="color-mix(in srgb,var(--action) 11%,var(--canvas))" stroke="color-mix(in srgb,var(--action) 38%,var(--canvas))"/></svg>Action; select it for who, when and what follows</span>'
  +'<span><svg viewBox="0 0 28 12" aria-hidden="true"><rect x="1" y="1" width="26" height="10" rx="3" fill="var(--surface)" stroke="var(--line)"/></svg>State; select it for what it means</span>'}
function draw(o){const lay=o.layouts[narrow()?'narrow':'wide'];scene.innerHTML='';markers(['main','alternative','expiry','failure','recovery','accent'].map(k=>['m-'+k,'var(--'+k+')']));bounds={x:0,y:0,width:lay.width,height:lay.height};
 const edges=el('g'),labels=el('g'),nodes=el('g');
 if(o.start&&lay.nodes['start:']){const s=lay.nodes['start:'],e=lay.edges['start:'];el('path',{d:rounded(e.points),fill:'none',stroke:'var(--ink-2)','stroke-width':1.4,'marker-end':'url(#m-main)'},edges);el('circle',{class:'start',cx:s.x+s.width/2,cy:s.y+s.height/2,r:6},edges)}
 for(const e of o.edges){const g=el('g',{class:'tr '+e.path,'data-id':e.id},edges),geo=lay.edges[e.id],d=rounded(geo.points,8);el('path',{class:'line',d,'marker-end':'url(#m-'+e.path+')'},g);const hit=el('path',{class:'hit',d},g);hit.dataset.hit='1';hit.addEventListener('click',ev=>{ev.stopPropagation();focusNext=false;go({o:o.id,t:e.id})});
  const b=geo.label;if(b){const lg=el('g',{class:'tr '+e.path,'data-id':e.id},labels),inner=el('g',{class:'lbl'},lg),la=wrap(e.label,24);el('rect',{x:b.x,y:b.y,width:b.width,height:b.height,rx:Math.min(b.height/2,13)},inner);
   txt(inner,la,b.x+b.width/2,b.y+(b.height-la.length*17)/2+13,'a','middle',17);activate(inner,()=>go({o:o.id,t:e.id}),PATH[e.path]+' action: '+e.label)}}
 for(const n of o.nodes){const b=lay.nodes[n.id],fin=n.terminal&&!n.terminalUnresolved,cls='st'+(fin?' end '+(n.outcome||'neutral'):'')+(n.terminalUnresolved?' unresolved':'')+(n.junction?' junction':''),g=el('g',{class:cls,'data-id':n.id},nodes);
  el('rect',{class:'box',x:b.x,y:b.y,width:b.width,height:b.height,rx:12},g);if(fin)el('rect',{class:'inner',x:b.x+4,y:b.y+4,width:b.width-8,height:b.height-8,rx:9},g);
  const la=wrap(n.label,22),tags=n.junction?[]:n.terminalUnresolved?['Terminal status','unresolved']:fin&&n.outcome?[ending(n.outcome)?'Ends · '+ending(n.outcome):'Ends']:[];let y=b.y+(b.height-la.length*18-tags.length*18)/2+13;for(const t of tags){txt(g,t,b.x+14,y-1,'tag');y+=18}
  txt(g,la,b.x+14,y,'label','start',18);
  activate(g,()=>go({o:o.id,s:n.id}),(n.junction?'Condition: ':n.terminalUnresolved?'State, terminal status unresolved: ':n.terminal?'Final state'+(ending(n.outcome)?', '+ending(n.outcome).toLowerCase():'')+': ':'State: ')+n.label)}
 o.exits.forEach((x,i)=>{const b=lay.nodes['exit:'+i],geo=lay.edges['exit:'+i];if(!b)return;el('path',{d:rounded(geo.points,8),fill:'none',stroke:'var(--'+x.path+')','stroke-width':1.3,'stroke-dasharray':'4 3','marker-end':'url(#m-'+x.path+')'},edges);
  const g=el('g',{class:'exit','data-id':String(i)},nodes);el('rect',{x:b.x,y:b.y,width:b.width,height:b.height,rx:10},g);txt(g,x.label,b.x+12,b.y+19,'a');txt(g,'→ '+(x.object?O[x.object].name:C[x.component].name),b.x+12,b.y+35,'w');activate(g,()=>go({o:o.id,x:String(i)}),'Leads to '+(x.object?O[x.object].name:C[x.component].name)+': '+x.label)});
 return {o,mode:narrow()?'narrow':'wide',lay}}
// a lifecycle opens whole when that stays readable; otherwise near full size on its beginning, and the reader pans along the main path
function startView(){const lay=drawn.lay;return clearOfControls(startFrame(),Object.values(lay.nodes).concat(Object.values(lay.edges).map(e=>e.label)).filter(Boolean))}
function startFrame(){const lay=drawn.lay,s=fitScale(bounds);if(s>=.9)return frame(bounds,Math.min(1,s));const {i,aw,ah}=area(),k=Math.max(.9,Math.min(1,aw/(bounds.width+24)));const st=lay.nodes['start:']||lay.nodes[drawn.o.start]||{x:0,y:0,width:0,height:0};
 const v=frame(bounds,k,'start');if(bounds.width*k>aw){const lead=[st];let at=drawn.o.start;for(let n=0;n<3&&at;n++){const e=drawn.o.edges.find(q=>q.from===at&&q.path==='main')||drawn.o.edges.find(q=>q.from===at);if(!e)break;lead.push(lay.nodes[e.to]);if(lay.edges[e.id].label)lead.push(lay.edges[e.id].label);at=e.to}
  const x0=Math.min(...lead.filter(Boolean).map(b=>b.x)),x1=Math.max(...lead.filter(Boolean).map(b=>b.x+b.width)),cx=x1-x0<=aw/k?(x0+x1)/2:x0+aw/k/2-8;v.x=Math.max(bounds.x-i.l/k,cx-(i.l+aw/2)/k)}if(bounds.height*k>ah)v.y=Math.max(bounds.y-i.t/k,st.y+st.height/2-(i.t+ah/2)/k);return v}
function box(list){const x0=Math.min(...list.map(b=>b.x)),y0=Math.min(...list.map(b=>b.y));return {x:x0-24,y:y0-24,width:Math.max(...list.map(b=>b.x+b.width))-x0+48,height:Math.max(...list.map(b=>b.y+b.height))-y0+48}}
function effectLink(f){if(f.component)return pageLink('Show '+C[f.component].name+' →','system',{sel:f.component});if(f.object)return f.object===route.o?'':goBtn('Open the '+O[f.object].name+' lifecycle →',{o:f.object});return ''}
// symbols stay out of the diagram; a panel explains the ones its own text uses
function symbols(o,texts){const used=o.terms.filter(t=>texts.some(x=>new RegExp('(^|[^\\w\'’-])'+t.term+'(?![\\w\'’-])').test(String(x||''))));return used}
const paras=t=>String(t||'').split(/\n\s*\n/).map(p=>'<p>'+E(p.trim())+'</p>').join('');
// an action reads as a short explanation; the exact recorded wording stays one click away
function transitionPanel(o,e){const from=nodeOf(o,e.from),to=nodeOf(o,e.to),used=symbols(o,[e.actor?.text,e.guard,...e.when.map(w=>w.text),...e.effects.map(f=>f.text)]),links=[...new Set(e.effects.map(effectLink).filter(Boolean))];
 return {eyebrow:'Action · '+PATH[e.path],title:E(e.label),lead:'<span class="muted">'+E(from.label)+' → '+E(to.label)+'</span>',extra:'<div class="story">'+paras(e.story)+'</div>',
  actions:links.length?'<div class="actions">'+links.join('')+'</div>':'',
  more:'<details class="more"><summary>Exact conditions and record</summary>'+(e.actor?'<p><span class="k">Who acts</span> '+E(e.actor.text)+'</p>':'')+(e.when.length?'<p class="k">Conditions</p><ul>'+e.when.map(w=>'<li class="dot">'+E(w.text)+'</li>').join('')+'</ul>':e.guard?'<p><span class="k">Condition</span> '+E(e.guard)+'</p>':'')
   +(e.effects.length?'<p class="k">Effects</p><ul>'+e.effects.map(f=>'<li class="dot">'+E(f.text)+'</li>').join('')+'</ul>':'')+(used.length?'<p class="k">Symbols</p><ul>'+used.map(t=>'<li><strong>'+E(t.term)+'</strong> '+E(t.meaning)+'</li>').join('')+'</ul>':'')
   +'<p><span class="k">Recorded as</span> '+E(e.event)+(e.authority?' · authority '+E(e.authority):'')+'</p></details>'}}
function statePanel(o,n){const out=o.edges.filter(e=>e.from===n.id),inc=o.edges.filter(e=>e.to===n.id),exits=o.exits.map((x,i)=>[x,i]).filter(([x])=>x.from===n.id),used=symbols(o,[n.junction?n.description:n.gist,n.meaning]),src=sourceList([n.exact,...used.map(t=>t.exact)]);
 return {eyebrow:n.junction?'Condition':n.terminalUnresolved?'State · terminal status unresolved':n.terminal?'Final state'+(ending(n.outcome)?' · '+ending(n.outcome):''):'State',title:E(n.label),lead:E(n.junction?n.description:n.gist),
  more:!n.junction&&n.meaning?'<details class="more"><summary>Recorded wording</summary><p><span class="k">'+E(n.name)+'</span> '+E(n.meaning)+'</p>'+(n.terminalUnresolved?'<p><span class="k">Recorded as terminal</span> Yes; whether it stays final is still being decided.</p>':'')+(used.length?'<ul>'+used.map(t=>'<li><strong>'+E(t.term)+'</strong> '+E(t.meaning)+'</li>').join('')+'</ul>':'')+'</details>':'',
  sections:[n.terminalUnresolved?['Terminal status','<p>Its record marks this state terminal. Whether it stays final is still being decided, so it is not shown as an ending.</p>']:null,
   out.length||exits.length?['Next','<ul>'+out.map(e=>'<li>'+goBtn(e.label,{o:o.id,t:e.id})+' <small>→ '+E(nodeOf(o,e.to).label)+'</small></li>').join('')+exits.map(([x,i])=>'<li>'+goBtn(x.label,{o:o.id,x:String(i)})+' <small>→ '+E(x.object?O[x.object].name:C[x.component].name)+'</small></li>').join('')+'</ul>']:['Next','<p class="muted">'+(n.terminalUnresolved?'Nothing recorded.':'Nothing; this is a final state.')+'</p>'],
   inc.length?['Reached by','<ul>'+inc.map(e=>'<li>'+goBtn(e.label,{o:o.id,t:e.id})+' <small>from '+E(nodeOf(o,e.from).label)+'</small></li>').join('')+'</ul>']:null]}}
function exitPanel(o,x){const used=symbols(o,[x.text]),src=sourceList([x.exact,...used.map(t=>t.exact)]),target=x.object?pageLink('Open the '+O[x.object].name+' lifecycle →','states',{o:x.object}):pageLink('Show '+C[x.component].name+' →','system',{sel:x.component});
 return {eyebrow:'Leads elsewhere · '+PATH[x.path],title:E(x.label),lead:E(x.text),actions:'<div class="actions">'+target+'</div>'}}
window.afterSide=()=>{if(!drawn)return;if(route.t||route.s||route.x){lastSelKey=null;holdSide=true;show();holdSide=false}else flyTo(startView(),260)};
function up(){if(route.t||route.s||route.x||route.about)go({o:route.o})}
function background(){if(route.scenario)return;if(route.t||route.s||route.x||route.about)go({o:route.o})}
function fitAfterPanel(){}
function show(){closeFigure();route=parse(location.hash);if(!ownsStep())return;const o=objectOf();if(!o){$('side-body').innerHTML='<h2>No reviewed lifecycle is drawn yet.</h2>';return}route.o=o.id;
 tourFrame();const m=narrow()?'narrow':'wide';if(!drawn||drawn.o!==o||drawn.mode!==m){drawn=draw(o);intro(o);lastSelKey=null;setCam(startView())}
 const e=route.t&&edgeOf(o,route.t),s=!e&&route.s&&nodeOf(o,route.s),x=!e&&!s&&route.x!==undefined&&o.exits[+route.x],about=!e&&!s&&!x&&route.about;stopTokens();
 if(about){sideOpen(true,false);go({o:o.id},{replace:true});return}
 const hot=new Set(e?[e.id]:s?o.edges.filter(q=>q.from===s.id||q.to===s.id).map(q=>q.id):[]);
 scene.querySelectorAll('.tr').forEach(n=>{const on=hot.has(n.dataset.id);n.classList.toggle('on',on);n.classList.toggle('dim',hot.size>0&&!on);const l=n.querySelector('.line');if(l)l.setAttribute('marker-end','url(#m-'+(on?'accent':edgeOf(o,n.dataset.id).path)+')')});
 scene.querySelectorAll('.st').forEach(n=>{n.classList.toggle('on',!!(e&&n.dataset.id===e.from||s&&n.dataset.id===s.id));n.classList.toggle('to',!!(e&&n.dataset.id===e.to))});
 scene.querySelectorAll('.exit').forEach(n=>n.classList.toggle('on',!!x&&n.dataset.id===route.x));
 panel(e?transitionPanel(o,e):s?statePanel(o,s):x?exitPanel(o,x):null);
 const key=route.t+'|'+route.s+'|'+route.x,lay=drawn.lay;
 if(key!==lastSelKey&&(e||s||x)){const near=s?o.edges.filter(q=>q.from===s.id||q.to===s.id).flatMap(q=>[lay.nodes[q.from===s.id?q.to:q.from],lay.edges[q.id].label]).concat(o.exits.map((q,k)=>q.from===s.id&&lay.nodes['exit:'+k])):[];
  const parts=(e?[lay.nodes[e.from],lay.nodes[e.to],lay.edges[e.id].label]:s?[lay.nodes[s.id],...near]:[lay.nodes['exit:'+route.x],lay.nodes[o.exits[+route.x].from]]).filter(Boolean);reveal(box(parts),box([e&&lay.edges[e.id].label||parts[0]]),parts,Object.values(lay.nodes));if(e)travel(scene.querySelector('#scene .tr[data-id="'+CSS.escape(e.id)+'"] .line'))}
 lastSelKey=key;
 if(focusNext){const n=e?scene.querySelector('.tr[data-id="'+CSS.escape(e.id)+'"] .lbl'):s?scene.querySelector('.st[data-id="'+CSS.escape(s.id)+'"]'):x?scene.querySelector('.exit[data-id="'+route.x+'"]'):null;if(n)n.focus({preventScroll:true})}focusNext=false}
addEventListener('resize',()=>{if(Math.abs(innerWidth-lastWidth)<40)return;lastWidth=innerWidth;drawn=null;show()});
focusNext=true;show();
`;
