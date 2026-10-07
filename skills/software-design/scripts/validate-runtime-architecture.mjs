#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { isEntryPoint } from "./lib/entry-point.mjs";

const CATEGORIES = new Set(["actor", "product", "runtime", "external", "core"]);
const KINDS = new Set(["person", "app", "service", "database", "storage", "worker", "container", "identity", "contract", "network"]);
const EDGE_KINDS = new Set(["request-response", "event", "command"]);

function finite(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function rect(node) {
  return { left: node.x, right: node.x + node.width, top: node.y, bottom: node.y + node.height };
}

function overlaps(left, right) {
  return left.left < right.right && left.right > right.left && left.top < right.bottom && left.bottom > right.top;
}

function pointInside(point, target) {
  const box = rect(target);
  return point[0] > box.left && point[0] < box.right && point[1] > box.top && point[1] < box.bottom;
}

function pointOnBoundary(point, target) {
  const box = rect(target);
  const [x, y] = point;
  const withinHorizontal = x >= box.left && x <= box.right;
  const withinVertical = y >= box.top && y <= box.bottom;
  return (withinHorizontal && (y === box.top || y === box.bottom)) || (withinVertical && (x === box.left || x === box.right));
}

function boundarySide(point, target) {
  const box = rect(target);
  const [x, y] = point;
  if (x === box.left && y > box.top && y < box.bottom) return "left";
  if (x === box.right && y > box.top && y < box.bottom) return "right";
  if (y === box.top && x > box.left && x < box.right) return "top";
  if (y === box.bottom && x > box.left && x < box.right) return "bottom";
  return null;
}

function leavesPerpendicularly(points, node) {
  const [endpoint, next] = points;
  const side = boundarySide(endpoint, node);
  if (!side) return false;
  if (side === "left") return next[0] < endpoint[0] && next[1] === endpoint[1];
  if (side === "right") return next[0] > endpoint[0] && next[1] === endpoint[1];
  if (side === "top") return next[0] === endpoint[0] && next[1] < endpoint[1];
  return next[0] === endpoint[0] && next[1] > endpoint[1];
}

function entersPerpendicularly(points, node) {
  const endpoint = points.at(-1);
  const previous = points.at(-2);
  const side = boundarySide(endpoint, node);
  if (!side) return false;
  if (side === "left") return previous[0] < endpoint[0] && previous[1] === endpoint[1];
  if (side === "right") return previous[0] > endpoint[0] && previous[1] === endpoint[1];
  if (side === "top") return previous[0] === endpoint[0] && previous[1] < endpoint[1];
  return previous[0] === endpoint[0] && previous[1] > endpoint[1];
}

function segments(points) {
  return points.slice(1).map((point, index) => [points[index], point]);
}

function orientation(a, b, c) {
  const value = (b[1] - a[1]) * (c[0] - b[0]) - (b[0] - a[0]) * (c[1] - b[1]);
  return Math.sign(value);
}

function onSegment(a, b, point) {
  return Math.min(a[0], b[0]) <= point[0] && point[0] <= Math.max(a[0], b[0]) && Math.min(a[1], b[1]) <= point[1] && point[1] <= Math.max(a[1], b[1]);
}

function segmentsIntersect([a, b], [c, d]) {
  const first = orientation(a, b, c);
  const second = orientation(a, b, d);
  const third = orientation(c, d, a);
  const fourth = orientation(c, d, b);
  if (first !== second && third !== fourth) return true;
  return (first === 0 && onSegment(a, b, c)) || (second === 0 && onSegment(a, b, d)) || (third === 0 && onSegment(c, d, a)) || (fourth === 0 && onSegment(c, d, b));
}

function samePoint(left, right) {
  return left[0] === right[0] && left[1] === right[1];
}

function segmentTouchesOnlySharedEndpoint(left, right) {
  const leftPoints = [left[0], left[1]];
  const rightPoints = [right[0], right[1]];
  const matches = leftPoints.flatMap((point) => rightPoints.filter((candidate) => samePoint(point, candidate)));
  return matches.length === 1;
}

export function validateRuntimeArchitecture(model) {
  const errors = [];
  if (!model || typeof model !== "object" || Array.isArray(model)) return ["Model must be a JSON object."];
  if (typeof model.title !== "string" || !model.title.trim()) errors.push("title is required.");
  if (!finite(model.width) || !finite(model.height) || model.width < 600 || model.height < 400) errors.push("width and height must be finite canvas dimensions of at least 600 × 400.");
  if (!Array.isArray(model.groups) || !model.groups.length) errors.push("groups must contain at least one named boundary.");
  if (!Array.isArray(model.nodes) || model.nodes.length < 2) errors.push("nodes must contain at least two components.");
  if (!Array.isArray(model.edges) || !model.edges.length) errors.push("edges must contain at least one runtime relationship.");
  if (errors.length) return errors;

  const ids = new Set();
  const groupIds = new Set();
  for (const group of model.groups) {
    if (!group || typeof group !== "object") { errors.push("groups must contain objects."); continue; }
    if (!/^[a-z][a-z0-9-]*$/.test(group.id || "")) errors.push("group requires a lowercase hyphenated id.");
    else if (groupIds.has(group.id)) errors.push("duplicate group id " + group.id + ".");
    else groupIds.add(group.id);
    if (typeof group.label !== "string" || !group.label.trim()) errors.push("group " + (group.id || "?") + " requires a label.");
    for (const field of ["x", "y", "width", "height"]) if (!finite(group[field]) || group[field] <= 0) errors.push("group " + (group.id || "?") + " requires positive " + field + ".");
    if (finite(group.x) && finite(group.y) && finite(group.width) && finite(group.height) && (group.x < 0 || group.y < 0 || group.x + group.width > model.width || group.y + group.height > model.height)) errors.push("group " + group.id + " falls outside the canvas.");
  }
  for (let index = 0; index < model.groups.length; index += 1) {
    for (let other = index + 1; other < model.groups.length; other += 1) {
      if (overlaps(rect(model.groups[index]), rect(model.groups[other]))) errors.push("groups " + model.groups[index].id + " and " + model.groups[other].id + " overlap.");
    }
  }

  for (const node of model.nodes) {
    if (!node || typeof node !== "object") { errors.push("nodes must contain objects."); continue; }
    if (!/^[a-z][a-z0-9-]*$/.test(node.id || "")) errors.push("node requires a lowercase hyphenated id.");
    else if (ids.has(node.id)) errors.push("duplicate node id " + node.id + ".");
    else ids.add(node.id);
    if (typeof node.title !== "string" || !node.title.trim() || node.title.length > 31) errors.push("node " + (node.id || "?") + " title must contain 1–31 characters.");
    if (typeof node.meta !== "string" || !node.meta.trim() || node.meta.length > 58) errors.push("node " + (node.id || "?") + " meta must contain 1–58 characters.");
    if (typeof node.description !== "string" || node.description.trim().length < 20 || node.description.length > 360) errors.push("node " + (node.id || "?") + " description must contain 20–360 characters of human-first prose.");
    if (typeof node.works_with !== "string" || node.works_with.trim().length < 10 || node.works_with.length > 300) errors.push("node " + (node.id || "?") + " works_with must contain 10–300 characters.");
    if (!node.boundary || typeof node.boundary !== "object" || Array.isArray(node.boundary) || typeof node.boundary.label !== "string" || !node.boundary.label.trim() || node.boundary.label.length > 32 || typeof node.boundary.text !== "string" || node.boundary.text.trim().length < 10 || node.boundary.text.length > 260) errors.push("node " + (node.id || "?") + " boundary requires a readable label and 10–260 characters of text.");
    if (!Array.isArray(node.sources) || !node.sources.length || node.sources.length > 8 || node.sources.some((source) => typeof source !== "string" || !/^[A-Z]+-\d+$/.test(source))) errors.push("node " + (node.id || "?") + " sources requires 1–8 canonical identifier strings.");
    if (!CATEGORIES.has(node.category)) errors.push("node " + (node.id || "?") + " category must be actor, product, runtime, external, or core.");
    if (!KINDS.has(node.kind)) errors.push("node " + (node.id || "?") + " kind is not supported.");
    if (!groupIds.has(node.group)) errors.push("node " + (node.id || "?") + " references an unknown group.");
    for (const field of ["x", "y", "width", "height"]) if (!finite(node[field]) || node[field] <= 0) errors.push("node " + (node.id || "?") + " requires positive " + field + ".");
    if (finite(node.x) && finite(node.y) && finite(node.width) && finite(node.height) && (node.x < 0 || node.y < 0 || node.x + node.width > model.width || node.y + node.height > model.height)) errors.push("node " + node.id + " falls outside the canvas.");
    const group = model.groups.find((candidate) => candidate.id === node.group);
    if (group && finite(node.x) && finite(node.y) && finite(node.width) && finite(node.height)) {
      const nodeBox = rect(node); const groupBox = rect(group);
      if (nodeBox.left < groupBox.left + 28 || nodeBox.right > groupBox.right - 28 || nodeBox.top < groupBox.top + 54 || nodeBox.bottom > groupBox.bottom - 28) errors.push("node " + node.id + " needs at least 28px group clearance and must clear the group heading.");
    }
  }
  for (let index = 0; index < model.nodes.length; index += 1) {
    for (let other = index + 1; other < model.nodes.length; other += 1) {
      if (overlaps(rect(model.nodes[index]), rect(model.nodes[other]))) errors.push("nodes " + model.nodes[index].id + " and " + model.nodes[other].id + " overlap.");
    }
  }
  const nodes = new Map(model.nodes.map((node) => [node.id, node]));
  const edgeIds = new Set();
  for (const edge of model.edges) {
    if (!edge || typeof edge !== "object") { errors.push("edges must contain objects."); continue; }
    if (!/^[a-z][a-z0-9-]*$/.test(edge.id || "")) errors.push("edge requires a lowercase hyphenated id.");
    else if (edgeIds.has(edge.id)) errors.push("duplicate edge id " + edge.id + ".");
    else edgeIds.add(edge.id);
    if (!nodes.has(edge.from) || !nodes.has(edge.to) || edge.from === edge.to) errors.push("edge " + (edge.id || "?") + " requires distinct existing from and to nodes.");
    if (!EDGE_KINDS.has(edge.kind)) errors.push("edge " + (edge.id || "?") + " kind must be request-response, event, or command.");
    if (!Array.isArray(edge.points) || edge.points.length < 2 || edge.points.some((point) => !Array.isArray(point) || point.length !== 2 || !finite(point[0]) || !finite(point[1]))) { errors.push("edge " + (edge.id || "?") + " requires two or more numeric route points."); continue; }
    const edgeSegments = segments(edge.points);
    if (edgeSegments.some(([from, to]) => (from[0] !== to[0] && from[1] !== to[1]) || samePoint(from, to))) errors.push("edge " + edge.id + " must use non-zero orthogonal segments only.");
    const fromNode = nodes.get(edge.from); const toNode = nodes.get(edge.to);
    if (fromNode && !pointOnBoundary(edge.points[0], fromNode)) errors.push("edge " + edge.id + " must leave the boundary of " + edge.from + ".");
    if (toNode && !pointOnBoundary(edge.points.at(-1), toNode)) errors.push("edge " + edge.id + " must enter the boundary of " + edge.to + ".");
    if (fromNode && !leavesPerpendicularly(edge.points, fromNode)) errors.push("edge " + edge.id + " must leave " + edge.from + " perpendicular to its card side; use a non-corner anchor and an outward first segment.");
    if (toNode && !entersPerpendicularly(edge.points, toNode)) errors.push("edge " + edge.id + " must enter " + edge.to + " perpendicular to its card side; use a non-corner anchor and an inward final segment.");
    for (const node of model.nodes) {
      for (const segment of edgeSegments) {
        if (node.id !== edge.from && node.id !== edge.to && (pointInside(segment[0], node) || pointInside(segment[1], node) || segmentIntersectsRect(segment, rect(node)))) errors.push("edge " + edge.id + " passes through node " + node.id + ".");
      }
    }
  }
  for (let index = 0; index < model.edges.length; index += 1) {
    for (let other = index + 1; other < model.edges.length; other += 1) {
      for (const first of segments(model.edges[index].points || [])) {
        for (const second of segments(model.edges[other].points || [])) {
          if (segmentsIntersect(first, second) && !segmentTouchesOnlySharedEndpoint(first, second)) errors.push("edges " + model.edges[index].id + " and " + model.edges[other].id + " cross or overlap.");
        }
      }
    }
  }
  return [...new Set(errors)];
}

function segmentIntersectsRect(segment, box) {
  const corners = [[box.left, box.top], [box.right, box.top], [box.right, box.bottom], [box.left, box.bottom]];
  return corners.some((corner, index) => segmentsIntersect(segment, [corner, corners[(index + 1) % corners.length]]));
}

function parseArgs(argv) {
  const args = { input: null };
  for (let index = 2; index < argv.length; index += 1) {
    if (argv[index] === "--input") args.input = argv[++index];
    else throw new Error("Unknown argument: " + argv[index]);
  }
  if (!args.input) throw new Error("Use --input <runtime-architecture-model.json>.");
  return args;
}

function main() {
  const args = parseArgs(process.argv);
  const input = path.resolve(args.input);
  const model = JSON.parse(fs.readFileSync(input, "utf8"));
  const errors = validateRuntimeArchitecture(model);
  if (errors.length) throw new Error("Runtime Architecture validation failed:\n" + errors.map((error) => "- " + error).join("\n"));
  console.log("Verified Runtime Architecture: " + model.nodes.length + " components, " + model.edges.length + " relationships.");
}

if (isEntryPoint(import.meta.url)) {
  try { main(); } catch (error) { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; }
}
