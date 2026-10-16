import fs from "node:fs";

function normalizeFragment(fragment) {
  try {
    return decodeURIComponent(String(fragment || "")).toLowerCase();
  } catch {
    return String(fragment || "").toLowerCase();
  }
}

export function markdownHeadingSlug(heading) {
  return String(heading || "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+#+\s*$/, "")
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s/g, "-");
}

export function markdownAnchorExists(filePath, fragment) {
  const expected = normalizeFragment(fragment);
  if (!expected) return true;
  const text = fs.readFileSync(filePath, "utf8");
  for (const match of text.matchAll(/<a\s+id=["']([^"']+)["']\s*><\/a>/gi)) {
    if (normalizeFragment(match[1]) === expected) return true;
  }
  for (const match of text.matchAll(/^#{1,6}\s+(.+?)\s*$/gm)) {
    if (markdownHeadingSlug(match[1]) === expected) return true;
  }
  return false;
}

// Inline links as package records write them: a destination, optionally in
// angle brackets, then an optional "double" or 'single' quoted title. Attribution
// validation and overview rewriting both read links through these helpers.
const INLINE_LINK = /\[([^\]]*)\]\((?:<([^>\n]*)>|([^\s)]+))(\s+(?:"[^"]*"|'[^']*'))?\s*\)/g;

export function markdownInlineLinks(text) {
  return [...String(text).matchAll(INLINE_LINK)].map(([, label, angled, bare, title = ""]) => ({ label, destination: angled ?? bare, title }));
}

export function replaceMarkdownInlineLinks(text, replace) {
  return String(text).replace(INLINE_LINK, (whole, label, angled, bare, title = "") => replace({ label, destination: angled ?? bare, title }) ?? whole);
}
