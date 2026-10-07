import path from "node:path";
import { findFiles, readText } from "./files.mjs";
import { parseFrontmatter } from "./frontmatter.mjs";
import { commaSeparatedIds } from "./build-unit-records.mjs";
import { buildLayout } from "./build-layout.mjs";

export function constraintsRoot(root) {
  return buildLayout(root).constraintsRoot;
}

export const technicalConstraintsRoot = constraintsRoot;

export function findTechnicalConstraintRecords(root) {
  return findFiles(constraintsRoot(root), (name) => /^cons-\d{3,}-.+\.md$/i.test(name)).map((filePath) => {
    const content = readText(filePath);
    const meta = parseFrontmatter(content, filePath);
    return {
      type: meta.type,
      id: meta.id,
      title: meta.title,
      technicalSources: commaSeparatedIds(meta.technical_sources),
      affectedResponsibilities: commaSeparatedIds(meta.affected_responsibilities),
      sourceTickets: commaSeparatedIds(meta.source_tickets),
      filePath,
      filename: path.basename(filePath).toLowerCase(),
      content,
    };
  });
}
