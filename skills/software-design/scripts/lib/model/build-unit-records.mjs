import path from "node:path";
import { findFiles, readText } from "./files.mjs";

export function findBuildUnitRecords(buildUnitsRoot, matcher = (name) => name.endsWith(".md")) {
  return findFiles(buildUnitsRoot, matcher).map((filePath) => {
    const content = readText(filePath);
    return {
      filePath,
      filename: path.basename(filePath).toLowerCase(),
      content,
    };
  });
}

export function commaSeparatedIds(value) {
  if (/^None\.$/.test(String(value || "").trim())) return [];
  return String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
}
