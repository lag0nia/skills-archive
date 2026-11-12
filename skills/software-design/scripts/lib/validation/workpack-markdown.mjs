import { escapeRegExp as escape } from "../model/markdown.mjs";

// Workpack-specific Markdown readers. They differ deliberately from the package
// validators' helpers: workpack fields may be list items, and `None.` is a meaningful value.

export function sectionBody(text, heading) {
  const match = new RegExp("^##\\s+" + escape(heading) + "\\s*$([\\s\\S]*?)(?=^##\\s+|(?![\\s\\S]))", "m").exec(text);
  return match ? match[1].trim() : null;
}

export function subsectionBody(text, heading) {
  const match = new RegExp("^###\\s+" + escape(heading) + "\\s*$([\\s\\S]*?)(?=^###\\s+|^##\\s+|(?![\\s\\S]))", "m").exec(text);
  return match ? match[1].trim() : null;
}

export function field(block, name) {
  return new RegExp("^(?:[-*]\\s+)?\\*\\*" + escape(name) + ":\\*\\*\\s*(.+)$", "m").exec(block)?.[1]?.trim() || null;
}

export function meaningful(value) {
  const normalized = String(value || "").trim().replace(/^`|`$/g, "");
  return Boolean(normalized) && !/^(?:TBD\.?|<[^>]+>)$/i.test(normalized);
}
