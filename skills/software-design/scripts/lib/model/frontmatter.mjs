export function parseFrontmatter(text, filePath) {
  const match = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (!match) throw new Error(filePath + ": missing YAML frontmatter.");
  return Object.fromEntries(match[1].split("\n")
    .map((line) => /^([\w-]+):\s*(.*)$/.exec(line))
    .filter(Boolean)
    .map((item) => [item[1], item[2].trim().replace(/^['"]|['"]$/g, "")]));
}
