#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { isEntryPoint } from "./lib/entry-point.mjs";
import { validateRuntimeArchitecture } from "./validate-runtime-architecture.mjs";

function escapeHtml(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function serializedModel(model) {
  return JSON.stringify(model, null, 2).replace(/<\/script/gi, "<\\/script");
}

function icon(kind, x, y) {
  const common = `class="icon" transform="translate(${x} ${y}) scale(1.35)"`;
  if (kind === "person") return `<g ${common}><circle cx="0" cy="-7" r="8"/><path d="M-14 15c3-9 8-14 14-14s11 5 14 14"/></g>`;
  if (kind === "app") return `<g ${common}><rect x="-18" y="-14" width="36" height="25" rx="3"/><path d="M-12 1h24M-4 16h8"/></g>`;
  if (kind === "database" || kind === "storage") return `<g ${common}><ellipse cx="0" cy="-11" rx="18" ry="6"/><path d="M-18-11v19c0 4 8 7 18 7s18-3 18-7v-19M-18-1c0 4 8 7 18 7s18-3 18-7"/></g>`;
  if (kind === "worker" || kind === "container") return `<g ${common}><rect x="-18" y="-12" width="36" height="25" rx="2"/><path d="M-10 13v6M10 13v6M-10-12v-6M10-12v-6"/></g>`;
  if (kind === "identity") return `<g ${common}><circle cx="0" cy="0" r="14"/><path d="M-7 0h14M0-7v14"/></g>`;
  if (kind === "contract") return `<g ${common}><path d="M-12-16h18l9 10v22h-27V-16zM6-16v10h9"/></g>`;
  if (kind === "network") return `<g ${common}><circle cx="0" cy="0" r="19"/><path d="M-19 0h38M0-19c8 10 8 28 0 38M0-19c-8 10-8 28 0 38"/></g>`;
  return `<g ${common}><path d="M-13-13h8l-8 13 8 13h-8M13-13h-8l8 13-8 13h8M3-17l-6 34"/></g>`;
}

function nodeMarkup(node) {
  const center = node.x + node.width / 2;
  const iconY = node.y + node.height * .32;
  const titleY = node.y + node.height * .66;
  const metaY = node.y + node.height * .81;
  const className = node.category === "core" ? "node core" : `node ${node.category}`;
  return `<g class="${className}" data-node="${escapeHtml(node.id)}" tabindex="0" role="button" aria-label="${escapeHtml(node.title)}"><rect class="card" x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" rx="10"/>${icon(node.kind, center, iconY)}<text class="node-title" x="${center}" y="${titleY}">${escapeHtml(node.title)}</text><text class="node-meta" x="${center}" y="${metaY}">${escapeHtml(node.meta)}</text></g>`;
}

function edgeMarkup(edge) {
  const pathData = edge.points.map((point, index) => `${index ? "L" : "M"}${point[0]} ${point[1]}`).join(" ");
  const markerStart = edge.kind === "request-response" ? " marker-start=\"url(#arrow-dark)\"" : "";
  const className = edge.kind === "request-response" ? "edge request-response" : `edge ${edge.kind}`;
  return `<path class="${className}" data-edge data-from="${escapeHtml(edge.from)}" data-to="${escapeHtml(edge.to)}" d="${pathData}"${markerStart} marker-end="url(#arrow-dark)"/>`;
}

function render(model) {
  const groups = model.groups.map((group) => `<g class="boundary"><rect x="${group.x}" y="${group.y}" width="${group.width}" height="${group.height}" rx="10"/><text x="${group.x + 24}" y="${group.y + 31}">${escapeHtml(group.label)}</text></g>`).join("\n");
  const edges = model.edges.map(edgeMarkup).join("\n");
  const nodes = model.nodes.map(nodeMarkup).join("\n");
  const descriptions = Object.fromEntries(model.nodes.map((node) => [node.id, {
    title: node.title,
    meta: node.meta,
    prose: node.description,
    worksWith: node.works_with,
    boundary: node.boundary,
    sources: node.sources,
  }]));
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(model.title)} · Runtime Architecture</title>
    <style>
      :root { color-scheme: light; }
      * { box-sizing: border-box; }
      body { margin: 0; overflow: hidden; background: #e8edf2; color: #102a43; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      .toolbar { position: fixed; z-index: 3; top: 16px; left: 16px; display: flex; align-items: center; gap: 4px; padding: 5px; border: 1px solid #cbd5e1; border-radius: 10px; background: rgba(255,255,255,.94); box-shadow: 0 10px 30px rgba(15,23,42,.10); backdrop-filter: blur(12px); }
      .toolbar button { appearance: none; min-width: 34px; height: 32px; padding: 0 10px; border: 0; border-radius: 6px; background: transparent; color: #334155; font: 700 14px inherit; cursor: pointer; }
      .toolbar button:hover { background: #eaf0f5; color: #102a43; }
      #canvas { position: fixed; inset: 0; overflow: hidden; cursor: grab; touch-action: none; background: radial-gradient(circle at 1px 1px, rgba(100,116,139,.13) 1px, transparent 1.2px) 0 0 / 18px 18px, #e8edf2; }
      #canvas.dragging { cursor: grabbing; }
      #diagram { position: absolute; width: ${model.width}px; height: ${model.height}px; transform-origin: 0 0; user-select: none; will-change: transform; }
      .canvas { fill: #f8fafc; } .boundary rect { fill: none; stroke: #cbd5e1; stroke-width: 1.25; } .boundary text { fill: #64748b; font: 600 12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; letter-spacing: 1.5px; } .page-kicker { fill: #64748b; font: 600 12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; letter-spacing: 1.6px; } .page-title { fill: #102a43; font: 700 26px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; letter-spacing: -.4px; }
      .card { fill: #fff; stroke: #94a3b8; stroke-width: 1.35; } .icon { fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; } .node-title { fill: #102a43; font: 700 17px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; text-anchor: middle; dominant-baseline: middle; } .node-meta { fill: #526170; font: 600 12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; text-anchor: middle; dominant-baseline: middle; }
      .node { cursor: pointer; } .node.product { color: #477396; } .node.product .card { stroke: #5b7f9f; } .node.runtime { color: #4d7f78; } .node.runtime .card { stroke: #5f8e88; } .node.external { color: #707b87; } .node.external .card { stroke: #9aa3ad; } .node.actor { color: #64748b; } .node.actor .card { stroke: #64748b; } .node.core { color: #d8e4ef; } .node.core .card { fill: #14324d; stroke: #14324d; stroke-width: 1.7; } .node.core .node-title { fill: #fff; font-size: 20px; } .node.core .node-meta { fill: #d8e4ef; }
      .edge { fill: none; stroke: #94a3b8; stroke-width: 1.5; } .edge.request-response, .edge.command { stroke: #14324d; stroke-width: 2.35; } #diagram.is-focused [data-node]:not(.is-active), #diagram.is-focused [data-edge]:not(.is-active) { opacity: .22; } #diagram .is-active .card { filter: drop-shadow(0 7px 10px rgba(16,42,67,.18)); } #diagram [data-edge].is-active { stroke: #102a43; stroke-width: 2.7; opacity: 1; }
      #inspector { position: fixed; z-index: 2; right: 16px; bottom: 16px; width: min(410px, calc(100vw - 32px)); padding: 18px 20px; border: 1px solid #cbd5e1; border-radius: 10px; background: rgba(255,255,255,.97); box-shadow: 0 12px 32px rgba(15,23,42,.12); pointer-events: none; transition: opacity .16s ease, transform .16s ease; } #inspector[hidden] { display: block; opacity: 0; transform: translateY(8px); } #inspector-title { margin: 0; color: #102a43; font-size: 20px; line-height: 1.2; } #inspector-meta { margin: 4px 0 0; color: #64748b; font-size: 12px; font-weight: 700; } #inspector-prose { margin: 12px 0 0; color: #334155; font-size: 13px; line-height: 1.48; } .inspector-section { margin-top: 12px; padding-top: 11px; border-top: 1px solid #e2e8f0; } .inspector-section h3 { margin: 0; color: #334155; font-size: 12px; line-height: 1.2; } .inspector-section p { margin: 4px 0 0; color: #526170; font-size: 12.5px; line-height: 1.45; } #inspector-sources { color: #64748b; font-size: 12px; font-weight: 700; letter-spacing: .15px; } .hint { position: fixed; z-index: 1; bottom: 19px; left: 20px; color: #64748b; font-size: 12px; font-weight: 600; pointer-events: none; }
    </style>
  </head>
  <body>
    <nav class="toolbar" aria-label="Diagram controls"><button type="button" data-action="zoom-out" aria-label="Zoom out">−</button><button type="button" data-action="zoom-in" aria-label="Zoom in">+</button><span aria-hidden="true">│</span><button type="button" data-action="fit">Fit</button></nav>
    <main id="canvas" aria-label="Interactive runtime architecture diagram">
      <svg id="diagram" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${model.width} ${model.height}" role="img" aria-label="${escapeHtml(model.title)} Runtime Architecture">
        <defs><marker id="arrow-dark" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="#14324d"/></marker></defs>
        <rect class="canvas" width="${model.width}" height="${model.height}"/><text class="page-kicker" x="48" y="50">${escapeHtml(model.title.toUpperCase())}</text><text class="page-title" x="48" y="84">Runtime architecture</text>
        ${groups}
        ${edges}
        ${nodes}
      </svg>
    </main>
    <p class="hint">Two-finger scroll to move · pinch to zoom · hover a component to trace its direct connections</p>
    <aside id="inspector" hidden aria-live="polite"><h2 id="inspector-title"></h2><p id="inspector-meta"></p><p id="inspector-prose"></p><section class="inspector-section"><h3>Works with</h3><p id="inspector-works-with"></p></section><section class="inspector-section"><h3 id="inspector-boundary-title"></h3><p id="inspector-boundary-text"></p></section><section class="inspector-section"><h3>Blueprint</h3><p id="inspector-sources"></p></section></aside>
    <script id="runtime-architecture-model" type="application/json">${serializedModel(model)}</script>
    <script>
      (() => {
        const canvas = document.querySelector('#canvas'), diagram = document.querySelector('#diagram'), inspector = document.querySelector('#inspector'), details = ${JSON.stringify(descriptions)};
        const title = document.querySelector('#inspector-title'), meta = document.querySelector('#inspector-meta'), prose = document.querySelector('#inspector-prose'), worksWith = document.querySelector('#inspector-works-with'), boundaryTitle = document.querySelector('#inspector-boundary-title'), boundaryText = document.querySelector('#inspector-boundary-text'), sources = document.querySelector('#inspector-sources');
        const state = { scale: 1, x: 0, y: 0, drag: null }, width = ${model.width}, height = ${model.height};
        const transform = () => diagram.style.transform = 'translate(' + state.x + 'px, ' + state.y + 'px) scale(' + state.scale + ')';
        const fit = () => { const box = canvas.getBoundingClientRect(); state.scale = Math.min((box.width - 72) / width, (box.height - 72) / height, 1); state.x = (box.width - width * state.scale) / 2; state.y = (box.height - height * state.scale) / 2; transform(); };
        const zoom = (factor, clientX, clientY) => { const box = canvas.getBoundingClientRect(), x = clientX - box.left, y = clientY - box.top, old = state.scale; state.scale = Math.max(.22, Math.min(3.5, old * factor)); const ratio = state.scale / old; state.x = x - (x - state.x) * ratio; state.y = y - (y - state.y) * ratio; transform(); };
        canvas.addEventListener('wheel', event => { event.preventDefault(); if (event.ctrlKey) zoom(Math.exp(-event.deltaY * .002), event.clientX, event.clientY); else { state.x -= event.deltaX; state.y -= event.deltaY; transform(); } }, { passive: false });
        canvas.addEventListener('pointerdown', event => { if (event.button !== 0 || event.target.closest('[data-node]')) return; state.drag = { x: event.clientX - state.x, y: event.clientY - state.y }; canvas.classList.add('dragging'); canvas.setPointerCapture(event.pointerId); });
        canvas.addEventListener('pointermove', event => { if (!state.drag) return; state.x = event.clientX - state.drag.x; state.y = event.clientY - state.drag.y; transform(); });
        const stop = () => { state.drag = null; canvas.classList.remove('dragging'); }; canvas.addEventListener('pointerup', stop); canvas.addEventListener('pointercancel', stop);
        document.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => { const action = button.dataset.action; if (action === 'fit') fit(); else { const box = canvas.getBoundingClientRect(); zoom(action === 'zoom-in' ? 1.18 : 1 / 1.18, box.left + box.width / 2, box.top + box.height / 2); } }));
        const clear = () => { diagram.classList.remove('is-focused'); document.querySelectorAll('.is-active').forEach(item => item.classList.remove('is-active')); inspector.hidden = true; };
        const focus = id => { const detail = details[id]; diagram.classList.add('is-focused'); document.querySelectorAll('[data-node], [data-edge]').forEach(item => item.classList.toggle('is-active', item.dataset.node === id || item.dataset.from === id || item.dataset.to === id)); title.textContent = detail.title; meta.textContent = detail.meta; prose.textContent = detail.prose; worksWith.textContent = detail.worksWith; boundaryTitle.textContent = detail.boundary.label; boundaryText.textContent = detail.boundary.text; sources.textContent = detail.sources.join(' · '); inspector.hidden = false; };
        document.querySelectorAll('[data-node]').forEach(node => { const id = node.dataset.node; node.addEventListener('pointerenter', () => focus(id)); node.addEventListener('pointerleave', clear); node.addEventListener('focus', () => focus(id)); node.addEventListener('blur', clear); });
        document.addEventListener('keydown', event => { if (event.key === '0') fit(); if (event.key === 'Escape') clear(); }); fit();
      })();
    </script>
  </body>
</html>`;
}

function parseArgs(argv) {
  const args = { input: null, output: null };
  for (let index = 2; index < argv.length; index += 1) {
    if (argv[index] === "--input") args.input = argv[++index];
    else if (argv[index] === "--output") args.output = argv[++index];
    else throw new Error("Unknown argument: " + argv[index]);
  }
  if (!args.input || !args.output) throw new Error("Use --input <runtime-architecture-model.json> --output <runtime-architecture.html>.");
  return args;
}

function main() {
  const args = parseArgs(process.argv);
  const model = JSON.parse(fs.readFileSync(path.resolve(args.input), "utf8"));
  const errors = validateRuntimeArchitecture(model);
  if (errors.length) throw new Error("Runtime Architecture validation failed:\n" + errors.map((error) => "- " + error).join("\n"));
  const output = path.resolve(args.output);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, render(model));
  console.log("Rendered Runtime Architecture: " + output);
}

if (isEntryPoint(import.meta.url)) {
  try { main(); } catch (error) { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; }
}
