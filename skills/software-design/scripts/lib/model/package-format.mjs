import fs from "node:fs";
import path from "node:path";

// Design format 2 is the only supported package format. Older packages are rejected
// rather than read: they migrate with an earlier Software Design release.
export const RETIRED_FORMAT_HINT = "Design format 1, ticket schema 3, the Technical Decision registry and the Canvas diagrams/ lane are retired; migrate the package with an earlier Software Design release.";

export function currentFormatError(root) {
  const file = path.join(path.resolve(root), "system-model/architecture.md");
  if (!fs.existsSync(file)) return `${file} is missing; a current package declares design_format: 2 there. ${RETIRED_FORMAT_HINT}`;
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(fs.readFileSync(file, "utf8"))?.[1] || "";
  const value = /^design_format:\s*(.*?)\s*$/m.exec(frontmatter)?.[1];
  if (value === "2") return null;
  const found = value === undefined ? "design_format is missing" : `unsupported design_format ${value}`;
  return `${file}: ${found}; current packages declare design_format: 2. ${RETIRED_FORMAT_HINT}`;
}

export function assertCurrentFormat(root, operation) {
  const error = currentFormatError(root);
  if (error) throw new Error(`${operation}: ${error}`);
}
