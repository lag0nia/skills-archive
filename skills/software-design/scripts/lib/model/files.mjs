import fs from "node:fs";
import path from "node:path";

export function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

export function findFiles(root, matcher) {
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) return findFiles(target, matcher);
    return entry.isFile() && matcher(entry.name) ? [target] : [];
  });
}
