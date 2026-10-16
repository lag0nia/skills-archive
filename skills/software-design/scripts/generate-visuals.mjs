#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {loadGraphs,renderGraph} from './lib/visual-graphs.mjs';
import {loadExplorer,renderExplorer} from './lib/system-explorer.mjs';

const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const read = file => fs.readFileSync(file, 'utf8');
const esc = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const json = value => JSON.stringify(value).replaceAll('<','\\u003c');
const walk = dir => fs.existsSync(dir) ? fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name)).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]) : [];
const rel = (root,file) => path.relative(root,file).split(path.sep).join('/');
const idList = value => String(value || '').match(/(?:SR|BU|FLOW|IFACE|STATE|INV|SEC|CONS|SEL)-\d{3,}/g) || [];
function frontmatter(text) {
 const block=/^---\r?\n([\s\S]*?)\r?\n---/.exec(text)?.[1] || '';
 return Object.fromEntries(block.split('\n').map(l=>/^([a-z_]+):\s*(.*)$/.exec(l)).filter(Boolean).map(([,k,v])=>[k,v.replace(/^"|"$/g,'')]));
}
function section(text,name) {
 const lines=text.split('\n'); const start=lines.findIndex(l=>l===`## ${name}` || l===`### ${name}`); if(start<0)return '';
 let end=start+1;while(end<lines.length&&!/^#{1,3} /.test(lines[end]))end++;return lines.slice(start+1,end).join('\n').trim();
}
export function splitCells(line) {
 const cells=[];let value='',code=false,escaped=false;
 for(const c of line.trim().replace(/^\|/,'').replace(/\|$/,'')) {
  if(escaped){value+=c;escaped=false;continue;} if(c==='\\'){escaped=true;value+=c;continue;}
  if(c==='`')code=!code;
  if(c==='|'&&!code){cells.push(value.trim());value='';}else value+=c;
 }cells.push(value.trim());return cells;
}
function table(text) {
 const lines=text.split('\n').filter(l=>/^\|/.test(l)); if(!lines.length)return {headers:[],rows:[]};
 const [headers,...rest]=lines.map(splitCells); const rows=rest.filter(row=>!row.every(v=>/^:?-+:?$/.test(v.replaceAll(' ',''))));
 if(rows.some(row=>row.length!==headers.length))throw new Error('Malformed canonical table; repair source explicitly before generation.');return {headers,rows};
}
function records(root,dir) {return walk(path.join(root,dir)).filter(p=>p.endsWith('.md')).map(file=>{const text=read(file);return {file:rel(root,file),text,meta:frontmatter(text)};});}
function md(text) {return esc(text).replace(/\[([^\]]+)\]\(([^)]+)\)/g,'$1').replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');}
const css=`:root{color-scheme:light;--ink:#17372f;--muted:#5f6961;--paper:#f4f2e9;--line:#d3d9ce;--accent:#bc4e28;--mint:#e5eee3}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.58 'Avenir Next',Avenir,'Segoe UI',sans-serif}a{color:inherit;text-underline-offset:4px}button,input,select{font:inherit;max-width:100%;min-width:0}button,select,input{border:1px solid #8a9e91;background:#fffdf5;color:var(--ink);padding:9px 14px;border-radius:4px}button{cursor:pointer}button:hover,button[aria-pressed=true]{background:var(--ink);color:white}button:disabled{opacity:.4;cursor:default}a:focus-visible,button:focus-visible,select:focus-visible,input:focus-visible{outline:3px solid var(--accent);outline-offset:4px}nav{display:flex;justify-content:space-between;gap:24px;border-bottom:1px solid var(--line);padding:18px 4vw;font-size:13px;letter-spacing:.04em}main{overflow-wrap:anywhere;max-width:1440px;margin:auto;padding:50px 4vw 100px}.eyebrow{font:12px/1.4 'Courier New',monospace;letter-spacing:.18em;text-transform:uppercase;color:var(--accent)}h1{font:clamp(32px,5vw,62px)/1.08 Georgia,serif;letter-spacing:-.03em;max-width:1000px;margin:12px 0 24px}h2{font:29px/1.15 Georgia,serif}h3{font-size:18px;margin:0 0 10px}.lede{font-size:19px;max-width:850px;color:var(--muted)}.toolbar{max-width:100%;display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:24px 0}.note{border-left:3px solid var(--accent);padding:9px 18px;background:#eeeade;color:#465247}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:22px}.view{padding:28px 0;border-top:2px solid var(--ink);text-decoration:none;display:block}.view:hover h2{color:var(--accent)}.view h2{margin:10px 0}.view small,.meta{font:12px/1.5 'Courier New',monospace;color:var(--muted)}.source{display:inline-block;margin:10px 0;font-size:13px}.panel{border:1px solid var(--line);padding:24px;background:#fffdf6;border-radius:6px}.flowrow{display:grid;grid-template-columns:1fr 70px 1fr;align-items:center;gap:12px}.flowrow>*{min-width:0;overflow-wrap:anywhere}.state{padding:15px;background:var(--mint);border:1px solid #b6c8b6;border-radius:4px}.arrow{font-size:30px;text-align:center;color:var(--accent)}.transition{display:block;width:100%;text-align:left;margin:12px 0;padding:20px}.transition.active{outline:3px solid var(--accent);background:#fff9e9;color:var(--ink)}.transition small{display:block;color:var(--muted);margin-top:10px}.twocol{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(320px,1fr);gap:28px;align-items:start}.sticky{position:sticky;top:20px}dt{font-size:12px;letter-spacing:.09em;text-transform:uppercase;color:var(--muted);margin-top:18px}dd{margin:5px 0 0;white-space:pre-wrap}table{width:100%;border-collapse:collapse;font-size:14px}th,td{text-align:left;border-bottom:1px solid var(--line);padding:10px;vertical-align:top}pre{white-space:pre-wrap;font:14px/1.65 'Avenir Next',Avenir,sans-serif;overflow-wrap:anywhere}.scroll{overflow:auto}.lane{display:grid;grid-template-columns:120px 1fr;gap:24px;border-top:1px solid var(--line);padding:28px 0}.unitgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px}.unit{border-top:4px solid var(--ink);padding:22px;background:#fffdf6}.unit.dim{opacity:.3}.tag{display:inline-block;padding:3px 9px;border:1px solid var(--line);border-radius:3px;font-size:12px;margin:3px}.stepnum{font:80px/1 Georgia,serif;color:var(--accent)}.stategraph{width:100%;height:auto;min-width:700px}.stategraph text{font-family:'Avenir Next',sans-serif}.stategraph .edge{stroke:#a4b0a5;stroke-width:2;fill:none}.stategraph .edge.selected{stroke:#bc4e28;stroke-width:4}.stategraph .node{fill:#e5eee3;stroke:#a2b9a5}.status{font-size:13px;color:var(--muted)}details{margin:20px 0}summary{cursor:pointer;font-weight:600}footer{border-top:1px solid var(--line);padding-top:24px;font-size:13px;color:var(--muted)}@media(max-width:850px){main{padding-top:28px}.twocol{grid-template-columns:1fr}.sticky{position:static}.lane{grid-template-columns:1fr}.flowrow{grid-template-columns:1fr 30px 1fr}.grid{grid-template-columns:1fr}}@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}}`;
function page(title,question,body,script='',data=null,depth=1) {const base=depth?'../'.repeat(depth):'';return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)} · System design</title><style>${css}</style></head><body><nav><a href="${base}index.html">← System design</a><a href="${base}../system-model/architecture.md">Written architecture ↗</a></nav><main><div class="eyebrow">Derived reading aid · canonical sources linked</div><h1>${esc(title)}</h1><p class="lede">${esc(question)}</p>${body}<footer>These views explain recorded design. They do not execute the protocol or prove implementation, deployment, or production activation. Source changes require regeneration and review.</footer></main>${data?`<script id="visual-data" type="application/json">${json(data)}</script>`:''}${script?`<script>${script}</script>`:''}</body></html>`;}
const client=`const DATA=JSON.parse(document.getElementById('visual-data').textContent);const $=id=>document.getElementById(id);const E=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');const clean=s=>String(s||'').replaceAll(String.fromCharCode(96),'');const link=f=>'../../'+f;`;
// the delivery sequence exists only from Stage 9; the map links it only when it does
const SEQUENCE='build/workflow/handoffs/README.md';
export function buildModel(root) {
 const units=records(root,'build/units').filter(r=>r.meta.type==='build-unit');
 const states=records(root,'system-model/contracts/states').map(r=>{
  const tables=[...r.text.matchAll(/^## ([^\n]+)\n([\s\S]*?)(?=^## |$(?![\s\S]))/gm)].filter(m=>/^\|/m.test(m[2])).map(m=>table(m[2]));
  return {id:r.meta.id,file:r.file,transitions:{rows:tables.filter(t=>t.headers[0]==='From'&&t.headers[3]==='To').flatMap(t=>t.rows)}};
 });
 const sequence=fs.existsSync(path.join(root,SEQUENCE))?SEQUENCE:null;
 return {sequence,units:units.map(r=>({id:r.meta.id,name:r.meta.name,file:r.file,depends:idList(r.meta.depends_on_build_units),family:r.meta.responsibility_family,code:r.meta.code_path,repository:r.meta.repository,purpose:section(r.text,'Build Unit Overview').split('\n\n')[0]})),states};
}
export function dependencyGraph(units) {
 const byId=new Map(units.map(u=>[u.id,u])),levels=new Map(),visiting=new Set();
 function level(id){if(levels.has(id))return levels.get(id);if(visiting.has(id))throw new Error('Build Unit dependency cycle at '+id);if(!byId.has(id))throw new Error('Unknown Build Unit dependency '+id);visiting.add(id);const n=Math.max(-1,...byId.get(id).depends.map(level))+1;visiting.delete(id);levels.set(id,n);return n;}units.forEach(u=>level(u.id));
 function reaches(from,target){return from===target||byId.get(from).depends.some(d=>reaches(d,target));}
 const edges=units.flatMap(u=>u.depends.filter(d=>!u.depends.some(other=>other!==d&&reaches(other,d))).map(d=>({from:d,to:u.id})));
 return {levels:Object.fromEntries(levels),edges};
}
function buildMap(model){const graph=dependencyGraph(model.units);const max=Math.max(0,...Object.values(graph.levels));return page('Construction dependencies','What must exist before each Build Unit can be built, and which independent units could proceed in parallel?',`<p class="note">Rows show dependency depth, not delivery order or readiness. Units in the same row have no prerequisite edge between them; actual execution follows the handoff sequence and current blockers.</p><div class="toolbar"><label for="unit">Inspect prerequisites</label><select id="unit"><option value="">All Build Units</option>${model.units.map(u=>`<option value="${u.id}">${esc(u.name)}</option>`).join('')}</select>${model.sequence?'<a href="../../'+model.sequence+'">Actual delivery sequence ↗</a>':''}</div>${Array.from({length:max+1},(_,n)=>`<section class="lane"><div><span class="eyebrow">Depth ${n}</span><p>${n===0?'Shared starting point':'Prerequisites above'}</p></div><div class="unitgrid">${model.units.filter(u=>graph.levels[u.id]===n).map(u=>`<article class="unit" data-unit="${u.id}"><small>${esc(u.family)} · ${u.id}</small><h3>${esc(u.name)}</h3><p>${md(u.purpose)}</p><code>${esc(u.repository)} / ${esc(u.code)}</code><p>Requires ${u.depends.length?u.depends.map(id=>`<a class="tag" href="#${id}" data-focus="${id}">${esc(model.units.find(x=>x.id===id)?.name||id)}</a>`).join(''):'no Build Unit prerequisite'}</p><a class="source" id="${u.id}" href="../../${u.file}">Construction contract ↗</a></article>`).join('')}</div></section>`).join('')}<details><summary>Reduced prerequisite → dependent connections (${graph.edges.length})</summary><table><thead><tr><th>Supplied artifact</th><th>Dependent</th></tr></thead><tbody>${graph.edges.map(e=>`<tr><td>${esc(model.units.find(u=>u.id===e.from).name)}</td><td>${esc(model.units.find(u=>u.id===e.to).name)}</td></tr>`).join('')}</tbody></table><p>All direct declared prerequisites remain on each card. Transitive reduction removes only graph edges already reachable through another prerequisite.</p></details>`,client+`function focus(){const chosen=$('unit').value;const keep=new Set();function add(id){if(keep.has(id))return;keep.add(id);DATA.units.find(u=>u.id===id)?.depends.forEach(add)}if(chosen)add(chosen);document.querySelectorAll('[data-unit]').forEach(el=>el.classList.toggle('dim',!!chosen&&!keep.has(el.dataset.unit)))}$('unit').onchange=focus;document.querySelectorAll('[data-focus]').forEach(a=>a.onclick=e=>{e.preventDefault();$('unit').value=a.dataset.focus;focus();document.getElementById(a.dataset.focus).scrollIntoView({block:'center'})});`,{units:model.units,graph});}
export function generateVisuals(rootPath,{check=false,views=null}={}) {
 const root=path.resolve(rootPath),format=frontmatter(read(path.join(root,'system-model/architecture.md'))).design_format;
 if(format!=='2')throw new Error('HTML generation requires design_format: 2; migrate legacy packages explicitly.');
 const dir=path.join(root,'visuals'),manifestPath=path.join(dir,'assets/sources.json');const previous=fs.existsSync(manifestPath)?JSON.parse(read(manifestPath)):null;
 const canonical=walk(path.join(root,'system-model')).concat(walk(path.join(root,'build/units'))).concat(walk(path.join(root,'build/records'))).filter(f=>/\.(md|yaml)$/.test(f));
 const sources=Object.fromEntries(canonical.map(file=>[rel(root,file),hash(read(file))]));
 for(const retired of ['visuals/assets/participants.json','visuals/assets/lib/visual-reading.mjs'])if(fs.existsSync(path.join(root,retired)))throw new Error('Retired visual input '+retired+' is still present; the explorer owns component identity and canonical rows own state identity. Remove it and regenerate.');
 for(const name of ['explorer.json','graphs.json','generate-visuals.mjs','lib/system-explorer.mjs','lib/explorer-pages.mjs','lib/visual-graphs.mjs','lib/graph-layout.mjs','lib/vendor/elk.bundled.cjs','lib/vendor/ELK-LICENSE.md','lib/vendor/ELK-NOTICE.md']){const file='visuals/assets/'+name;if(fs.existsSync(path.join(root,file)))sources[file]=hash(read(path.join(root,file)));}
 // only the sequence's presence shapes the map, so it is recorded as present rather than hashed
 if(fs.existsSync(path.join(root,SEQUENCE)))sources[SEQUENCE]='present';
 const changed=previous?Object.keys({...previous.sources,...sources}).filter(f=>previous.sources[f]!==sources[f]):Object.keys(sources);
 const model=buildModel(root),graphs=loadGraphs(root,model),explorer=loadExplorer(root,graphs);
 const known=['explorer','build'],selected=views||previous?.views?.filter(v=>known.includes(v))||(explorer?['explorer','build']:['build']);
 if(selected.some(v=>!known.includes(v)))throw Error('Unknown visual selection. Use explorer and/or build; the connected explorer replaces separate logical, state, walkthrough and gallery pages.');
 if(selected.includes('explorer')&&!explorer)throw Error('The system explorer requires reviewed visuals/assets/explorer.json; see system-explorer.md.');
 const generated={};
 if(selected.includes('explorer'))Object.assign(generated,renderExplorer(explorer));
 if(selected.includes('build'))generated['maps/build-unit-dependencies.html']=graphs?.graphs.some(g=>g.kind==='build')?renderGraph(graphs,'build'):buildMap(model);
 if(check){const errors=[];if(!previous)errors.push('Missing visual source manifest.');else{if(changed.length)errors.push('Stale source(s): '+changed.join(', '));for(const [f,h] of Object.entries(previous.outputs)){if(!fs.existsSync(path.join(dir,f))||hash(read(path.join(dir,f)))!==h)errors.push('Stale or modified output: '+f)}}for(const [f,content] of Object.entries(generated)){if(!fs.existsSync(path.join(dir,f))||read(path.join(dir,f))!==content)errors.push('Regeneration differs: '+f)}if(errors.length)throw new Error(errors.join('\n'));return {checked:true,views:selected,sourceCount:Object.keys(sources).length,states:model.states.length,transitions:model.states.reduce((n,s)=>n+s.transitions.rows.length,0)};}
 for(const [f,content] of Object.entries(generated)){const p=path.join(dir,f);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,content)}
 const outputs=Object.fromEntries(Object.keys(generated).map(f=>[f,hash(generated[f])]));
 fs.mkdirSync(path.dirname(manifestPath),{recursive:true});fs.writeFileSync(manifestPath,JSON.stringify({version:2,views:selected,sources,outputs},null,2)+'\n');
 return {generated:Object.keys(outputs),sourceCount:Object.keys(sources).length,states:model.states.length,transitions:model.states.reduce((n,s)=>n+s.transitions.rows.length,0)};
}
if(process.argv[1]&&fs.realpathSync(process.argv[1])===fileURLToPath(import.meta.url)) {
 try {let root=null,check=false,views=null;for(let i=2;i<process.argv.length;i++){if(process.argv[i]==='--root')root=process.argv[++i];else if(process.argv[i]==='--check')check=true;else if(process.argv[i]==='--views')views=process.argv[++i].split(',');else throw new Error('Unknown argument '+process.argv[i])}if(!root)throw new Error('Use --root <package> [--views explorer,build] [--check].');console.log(JSON.stringify(generateVisuals(root,{check,views}),null,2))}catch(error){console.error(error.message);process.exitCode=1}
}
