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
