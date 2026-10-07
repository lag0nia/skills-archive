import path from "node:path";
import { findFiles, readText } from "./files.mjs";
import { parseFrontmatter } from "./frontmatter.mjs";
import { commaSeparatedIds } from "./build-unit-records.mjs";

export function findRepositoryBuildDesignRecords(repositoriesRoot) {
  return findFiles(repositoriesRoot, (name) => name === "README.md" || /^repo-\d{3,}-.+\.md$/i.test(name))
    .filter((filePath) => path.basename(filePath) !== "README.md" || /^repo-\d{3,}-.+$/i.test(path.basename(path.dirname(filePath))))
    .map((filePath) => {
      const content = readText(filePath);
      const meta = parseFrontmatter(content, filePath);
      const folderRecord = path.basename(filePath) === "README.md";
      const slug = folderRecord
        ? path.basename(path.dirname(filePath)).toLowerCase()
        : path.basename(filePath, path.extname(filePath)).toLowerCase();
      return {
        type: meta.type,
        id: meta.id,
        name: meta.name,
        memberBuildUnits: commaSeparatedIds(meta.member_build_units),
        technicalConstraints: commaSeparatedIds(meta.technical_constraints),
        discoveryStatus: String(meta.discovery_status || "").trim(),
        discoveryBlockers: commaSeparatedIds(meta.discovery_blockers),
        filePath,
        content,
        filename: path.basename(filePath).toLowerCase(),
        slug,
        folderRecord,
      };
    });
}
