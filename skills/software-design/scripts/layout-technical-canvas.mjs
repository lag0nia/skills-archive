#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { autoSizeCanvasCards } from "./lib/canvas/card-sizing.mjs";

function parseArgs(argv) {
  const args = { write: false, check: false, report: false };
  for (let i = 2; i < argv.length; i += 1) {
    const key = argv[i];
    if (key === "--write") {
      args.write = true;
    } else if (key === "--check") {
      args.check = true;
    } else if (key === "--report") {
      args.report = true;
    } else if (key === "--canvas") {
      args.canvas = argv[++i];
    } else if (key === "--out") {
      args.out = argv[++i];
    } else {
      throw new Error(`Unknown argument: ${key}`);
    }
  }
  if (!args.canvas) {
    throw new Error("Usage: node layout-technical-canvas.mjs --canvas <path> [--out <path>] [--write] [--check] [--report]");
  }
  return args;
}

function centerOf(node) {
  return { x: node.x + node.width / 2, y: node.y + node.height / 2 };
}

function nearestSides(from, to) {
  const a = centerOf(from);
  const b = centerOf(to);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? { fromSide: "right", toSide: "left" } : { fromSide: "left", toSide: "right" };
  }
  return dy >= 0 ? { fromSide: "bottom", toSide: "top" } : { fromSide: "top", toSide: "bottom" };
}

function edgeAnchor(node, side) {
  const center = centerOf(node);
  if (side === "top") return { x: center.x, y: node.y };
  if (side === "bottom") return { x: center.x, y: node.y + node.height };
  if (side === "left") return { x: node.x, y: center.y };
  return { x: node.x + node.width, y: center.y };
}

function edgeControl(point, side, distance) {
  if (side === "top") return { x: point.x, y: point.y - distance };
  if (side === "bottom") return { x: point.x, y: point.y + distance };
  if (side === "left") return { x: point.x - distance, y: point.y };
  return { x: point.x + distance, y: point.y };
}

function edgeMidpoint(edge, nodesById) {
  const from = nodesById.get(edge.fromNode);
  const to = nodesById.get(edge.toNode);
  const fromSide = edge.fromSide || "right";
  const toSide = edge.toSide || "left";
  const start = edgeAnchor(from, fromSide);
  const end = edgeAnchor(to, toSide);
  const distance = Math.max(80, Math.min(260, Math.hypot(end.x - start.x, end.y - start.y) * 0.3));
  const firstControl = edgeControl(start, fromSide, distance);
  const secondControl = edgeControl(end, toSide, distance);
  return {
    x: (start.x + 3 * firstControl.x + 3 * secondControl.x + end.x) / 8,
    y: (start.y + 3 * firstControl.y + 3 * secondControl.y + end.y) / 8,
  };
}

function edgeLabelRect(edge, nodesById) {
  const midpoint = edgeMidpoint(edge, nodesById);
  const width = Math.min(420, Math.max(120, String(edge.label || "").length * 8 + 24));
  return { id: edge.id, x: midpoint.x - width / 2, y: midpoint.y - 28, width, height: 56 };
}

function groupTitleRect(group) {
  const width = Math.min(group.width - 24, Math.max(130, String(group.label || "").length * 10 + 28));
  return { id: group.id, x: group.x + 12, y: group.y - 24, width, height: 58 };
}

function rectFor(node, padding = 0) {
  return {
    left: node.x - padding,
    right: node.x + node.width + padding,
    top: node.y - padding,
    bottom: node.y + node.height + padding,
  };
}

function rectsOverlap(a, b, padding = 0) {
  const r1 = rectFor(a, padding);
  const r2 = rectFor(b, padding);
  return r1.left < r2.right && r1.right > r2.left && r1.top < r2.bottom && r1.bottom > r2.top;
}

function rectContains(outer, inner, padding = 0) {
  const bounds = rectFor(outer, -padding);
  const target = rectFor(inner);
  return target.left >= bounds.left && target.right <= bounds.right && target.top >= bounds.top && target.bottom <= bounds.bottom;
}

function orientation(a, b, c) {
  const value = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  if (Math.abs(value) < 0.0001) return 0;
  return value > 0 ? 1 : -1;
}

function segmentsIntersect(a, b, c, d) {
  const o1 = orientation(a, b, c);
  const o2 = orientation(a, b, d);
  const o3 = orientation(c, d, a);
  const o4 = orientation(c, d, b);
  return o1 !== o2 && o3 !== o4;
}

function segmentIntersectsRect(a, b, node, padding = 18) {
  const rect = rectFor(node, padding);
  if (a.x >= rect.left && a.x <= rect.right && a.y >= rect.top && a.y <= rect.bottom) return true;
  if (b.x >= rect.left && b.x <= rect.right && b.y >= rect.top && b.y <= rect.bottom) return true;
  const corners = [
    { x: rect.left, y: rect.top },
    { x: rect.right, y: rect.top },
    { x: rect.right, y: rect.bottom },
    { x: rect.left, y: rect.bottom },
  ];
  return (
    segmentsIntersect(a, b, corners[0], corners[1]) ||
    segmentsIntersect(a, b, corners[1], corners[2]) ||
    segmentsIntersect(a, b, corners[2], corners[3]) ||
    segmentsIntersect(a, b, corners[3], corners[0])
  );
}

function updateEdgeSides(canvas) {
  const nodesById = new Map(canvas.nodes.map((node) => [node.id, node]));
  for (const edge of canvas.edges || []) {
    const from = nodesById.get(edge.fromNode);
    const to = nodesById.get(edge.toNode);
    if (!from || !to) continue;
    Object.assign(edge, nearestSides(from, to));
  }
}

function layoutMetrics(canvas) {
  const textNodes = canvas.nodes.filter((node) => node.type === "text");
  const groupNodes = canvas.nodes.filter((node) => node.type === "group");
  const nodesById = new Map(textNodes.map((node) => [node.id, node]));
  const edges = (canvas.edges || []).filter((edge) => nodesById.has(edge.fromNode) && nodesById.has(edge.toNode));
  let overlaps = 0;
  let cramped = 0;
  let crossings = 0;
  let passThrough = 0;
  let groupOverflows = 0;
  let groupOverlaps = 0;
  let groupPadding = 0;
  let labelCardCollisions = 0;
  let labelTitleCollisions = 0;
  let labelLabelCollisions = 0;
  const overlapPairs = [];
  const crampedPairs = [];
  const crossingPairs = [];
  const passThroughPairs = [];
  const groupOverflowPairs = [];
  const groupOverlapPairs = [];
  const groupPaddingPairs = [];
  const labelCardCollisionPairs = [];
  const labelTitleCollisionPairs = [];
  const labelLabelCollisionPairs = [];

  for (let i = 0; i < groupNodes.length; i += 1) {
    for (let j = i + 1; j < groupNodes.length; j += 1) {
      if (rectsOverlap(groupNodes[i], groupNodes[j])) {
        groupOverlaps += 1;
        groupOverlapPairs.push([groupNodes[i].id, groupNodes[j].id]);
      }
    }
  }

  for (const group of groupNodes) {
    for (const node of textNodes) {
      if (rectsOverlap(group, node) && !rectContains(group, node)) {
        groupOverflows += 1;
        groupOverflowPairs.push([group.id, node.id]);
      } else if (rectContains(group, node) && !rectContains(group, node, 80)) {
        groupPadding += 1;
        groupPaddingPairs.push([group.id, node.id]);
      }
    }
  }

  for (let i = 0; i < textNodes.length; i += 1) {
    for (let j = i + 1; j < textNodes.length; j += 1) {
      if (rectsOverlap(textNodes[i], textNodes[j], 0)) {
        overlaps += 1;
        overlapPairs.push([textNodes[i].id, textNodes[j].id]);
      } else if (rectsOverlap(textNodes[i], textNodes[j], 40)) {
        cramped += 1;
        crampedPairs.push([textNodes[i].id, textNodes[j].id]);
      }
    }
  }

  const segments = edges.map((edge) => ({
    edge,
    from: nodesById.get(edge.fromNode),
    to: nodesById.get(edge.toNode),
    a: centerOf(nodesById.get(edge.fromNode)),
    b: centerOf(nodesById.get(edge.toNode)),
  }));

  for (let i = 0; i < segments.length; i += 1) {
    for (let j = i + 1; j < segments.length; j += 1) {
      const a = segments[i];
      const b = segments[j];
      if (a.from.id === b.from.id || a.from.id === b.to.id || a.to.id === b.from.id || a.to.id === b.to.id) {
        continue;
      }
      if (segmentsIntersect(a.a, a.b, b.a, b.b)) {
        crossings += 1;
        crossingPairs.push([a.edge.id, b.edge.id]);
      }
    }
  }

  for (const segment of segments) {
    for (const node of textNodes) {
      if (node.id === segment.from.id || node.id === segment.to.id) continue;
      if (segmentIntersectsRect(segment.a, segment.b, node)) {
        passThrough += 1;
        passThroughPairs.push([segment.edge.id, node.id]);
      }
    }
  }

  const titleRects = groupNodes.map(groupTitleRect);
  const labelRects = edges.filter((edge) => edge.label).map((edge) => edgeLabelRect(edge, nodesById));
  for (const label of labelRects) {
    for (const node of textNodes) {
      if (rectsOverlap(label, node)) {
        labelCardCollisions += 1;
        labelCardCollisionPairs.push([label.id, node.id]);
      }
    }
    for (const title of titleRects) {
      if (rectsOverlap(label, title)) {
        labelTitleCollisions += 1;
        labelTitleCollisionPairs.push([label.id, title.id]);
      }
    }
  }
  for (let i = 0; i < labelRects.length; i += 1) {
    for (let j = i + 1; j < labelRects.length; j += 1) {
      if (rectsOverlap(labelRects[i], labelRects[j])) {
        labelLabelCollisions += 1;
        labelLabelCollisionPairs.push([labelRects[i].id, labelRects[j].id]);
      }
    }
  }

  return {
    textNodes: textNodes.length,
    groups: groupNodes.length,
    edges: edges.length,
    overlaps,
    cramped,
    crossings,
    passThrough,
    groupOverflows,
    groupOverlaps,
    groupPadding,
    labelCardCollisions,
    labelTitleCollisions,
    labelLabelCollisions,
    overlapPairs,
    crampedPairs,
    crossingPairs,
    passThroughPairs,
    groupOverflowPairs,
    groupOverlapPairs,
    groupPaddingPairs,
    labelCardCollisionPairs,
    labelTitleCollisionPairs,
    labelLabelCollisionPairs,
  };
}

function main() {
  const args = parseArgs(process.argv);
  const canvasPath = path.resolve(args.canvas);
  const outPath = path.resolve(args.out || args.canvas);
  const canvas = JSON.parse(fs.readFileSync(canvasPath, "utf8"));
  canvas.nodes ||= [];
  canvas.edges ||= [];

  autoSizeCanvasCards(canvas);

  updateEdgeSides(canvas);
  const metrics = layoutMetrics(canvas);
  if (args.report) console.log(JSON.stringify(metrics, null, 2));
  if (args.check && (
    metrics.overlaps > 0 ||
    metrics.cramped > 0 ||
    metrics.crossings > 0 ||
    metrics.passThrough > 0 ||
    metrics.groupOverflows > 0 ||
    metrics.groupOverlaps > 0 ||
    metrics.groupPadding > 0 ||
    metrics.labelCardCollisions > 0 ||
    metrics.labelTitleCollisions > 0 ||
    metrics.labelLabelCollisions > 0
  )) {
    throw new Error(`Canvas layout is not clean enough: ${JSON.stringify(metrics)}`);
  }

  if (args.write || args.out) {
    fs.writeFileSync(outPath, `${JSON.stringify(canvas, null, 2)}\n`);
    console.log(`Wrote ${outPath}`);
  } else {
    console.log(`Checked ${canvasPath}`);
  }
}

main();
