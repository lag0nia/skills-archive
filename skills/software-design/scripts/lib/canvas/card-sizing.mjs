const DEFAULT_BUCKET = 20;

function visibleLinkName(target) {
  const last = String(target || "").split(/[\\/]/).filter(Boolean).pop() || target;
  return last.replace(/\.(md|canvas|mmd)$/i, "");
}

export function visibleCanvasText(text = "") {
  return String(text)
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, (_match, target) => visibleLinkName(target))
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`~]/g, "")
    .trimEnd();
}

function wrappedLineCount(line, width, charWidth) {
  const availableWidth = Math.max(180, width - 56);
  const charsPerLine = Math.max(18, Math.floor(availableWidth / charWidth));
  return Math.max(1, Math.ceil(line.length / charsPerLine));
}

export function estimateCanvasTextHeight(text = "", width = 560) {
  const lines = visibleCanvasText(text).split("\n");
  let units = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      units += 0.6;
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      const content = heading[2].trim();
      const charWidth = level <= 2 ? 9.5 : 8.4;
      const multiplier = level <= 2 ? 1.45 : 1.2;
      units += wrappedLineCount(content, width, charWidth) * multiplier;
      continue;
    }

    const bullet = /^[-*]\s+/.test(line);
    units += wrappedLineCount(line, width, bullet ? 7.2 : 7.55);
  }

  return roundUp(52 + units * 23, DEFAULT_BUCKET);
}

export function roundUp(value, bucket = DEFAULT_BUCKET) {
  return Math.ceil(value / bucket) * bucket;
}

export function desiredCanvasCardHeight(node, options = {}) {
  if (node.type !== "text") return node.height;

  const width = node.width || options.width || 560;
  const minHeight = options.minHeight || 160;
  const extraHeight = options.extraHeight || 24;
  return roundUp(Math.max(minHeight, estimateCanvasTextHeight(node.text || "", width) + extraHeight), options.bucket || 20);
}

export function autoSizeCanvasCards(canvas, options = {}) {
  const changes = [];
  for (const node of canvas.nodes || []) {
    if (node.type !== "text") continue;
    const previousHeight = node.height;
    const nextHeight = desiredCanvasCardHeight(node, options);
    if (nextHeight !== previousHeight) {
      node.height = nextHeight;
      changes.push({ id: node.id, previousHeight, nextHeight, delta: nextHeight - previousHeight });
    }
  }
  return changes;
}
