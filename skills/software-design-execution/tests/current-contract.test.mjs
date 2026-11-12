#!/usr/bin/env node

// Structural and behavioral contract checks for the skill text. They pin the
// shape the text must keep (sections, links, commands, names), not its wording.

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const skill = read("SKILL.md");
const frontmatter = /^---\n([\s\S]*?)\n---\n/.exec(skill)?.[1] ?? "";
const body = skill.slice(skill.indexOf("\n---\n", 4) + 5);

// Copies kept byte-identical with the Software Design skill; that skill and the
// repository-level shared-copy test own their content and link targets.
const SHARED_COPIES = new Set(["references/execution-eligibility.md", "references/legacy-lineage-recovery.md"]);
const OWNED_DOCS = ["SKILL.md", "references/delivery-evidence.md", "references/target-preflight.md", "tests/README.md"];
const SKILL_TEXT = ["SKILL.md", ...fs.readdirSync(path.join(root, "references")).map((name) => "references/" + name)];

function files(directory) {
  return fs.readdirSync(path.join(root, directory), { withFileTypes: true }).flatMap((entry) => {
    const relative = path.posix.join(directory, entry.name);
    return entry.isDirectory() ? files(relative) : [relative];
  });
}

function slug(heading) {
  return heading.trim().toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, "").replace(/\s/g, "-");
}

function headings(text) {
  return [...text.matchAll(/^#{1,6}\s+(.+)$/gm)].map((match) => slug(match[1]));
}

function links(text) {
  return [...text.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)].map((match) => match[1]).filter((target) => !/^[a-z]+:/i.test(target));
}

function commands(text) {
  return [...text.matchAll(/^\s*```sh\n([\s\S]*?)^\s*```/gm)]
    .flatMap((match) => match[1].replace(/\\\n\s*/g, " ").split("\n"))
    .map((line) => line.trim())
    .filter((line) => line.startsWith("node "));
}

function tempDirectory(context) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "software-design-execution-contract-"));
  context.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  return directory;
}

test("SKILL.md keeps the renamed identity, a bounded description, and the required sections in order", () => {
  assert.match(frontmatter, /^name: software-design-execution$/m);
  const description = /^description: (.+)$/m.exec(frontmatter)?.[1] ?? "";
  assert.ok(description.length > 0 && description.length <= 1024, "description length " + description.length);
  assert.match(description, /tagging, or publishing a release/);
  assert.match(body, /^# Software Design Execution$/m);
  assert.deepEqual([...body.matchAll(/^## (.+)$/gm)].map((match) => match[1]), [
    "Activate",
    "Before Source Edits",
    "While Implementing",
    "Human-Facing Delivery",
    "Continuation Loop",
    "Release And Post-Implementation Lineage",
    "Completion",
    "Stop",
  ]);
});

test("owned documents link only to existing files and headings inside the skill", () => {
  for (const document of OWNED_DOCS) {
    for (const target of links(read(document))) {
      const [file, anchor] = target.split("#");
      const resolved = file ? path.resolve(path.dirname(path.join(root, document)), file) : path.join(root, document);
      assert.ok(fs.existsSync(resolved), document + " links a missing file: " + target);
      if (anchor) assert.ok(headings(fs.readFileSync(resolved, "utf8")).includes(anchor), document + " links a missing heading: " + target);
    }
  }
});

test("the evidence reference keeps its layout tree and the templates it names", () => {
  const reference = read("references/delivery-evidence.md");
  const tree = /```text\n(delivery-evidence\/[\s\S]*?)```/.exec(reference)?.[1] ?? "";
  for (const entry of ["README.md", "IMPLEMENTATION-DELIVERY-REPORT.md", "sha256-<full-64-character-digest>/", "SUMMARY.md", "publications/", "consumers/"]) {
    assert.ok(tree.includes(entry), "layout tree lacks " + entry);
  }
  for (const name of ["README.md", "IMPLEMENTATION-DELIVERY-REPORT.md", "SUMMARY.md", "producer-publication-receipt.json", "consumer-install-receipt.json"]) {
    assert.ok(fs.existsSync(path.join(root, "assets/templates/delivery-evidence", name)), "missing evidence template " + name);
  }
});

test("every documented command names an existing script and only flags its parser accepts", (context) => {
  const scratch = tempDirectory(context);
  const documented = SKILL_TEXT.flatMap((document) => commands(read(document)).map((command) => ({ document, command })));
  assert.ok(documented.length >= 4, "expected the start, check, completion, and refresh commands");
  for (const { document, command } of documented) {
    const [, script, ...args] = command.split(/\s+/);
    const local = /^<software-design-execution-skill-directory>\/(scripts\/[\w./-]+\.mjs)$/.exec(script);
    assert.ok(local, document + " runs a script outside this skill: " + script);
    assert.ok(fs.existsSync(path.join(root, local[1])), document + " runs a missing script: " + local[1]);
    for (let index = 0; index < args.length; index += 2) {
      assert.match(args[index], /^--[a-z-]+$/, document + ": expected a flag in " + command);
      assert.ok(args[index + 1] && !args[index + 1].startsWith("--"), document + ": flag without value in " + command);
    }
    // Placeholders become missing paths, so the run must get past argument
    // parsing and fail only on the absent workpack or repository.
    const real = args.map((arg) => (/^<[^>]+>$/.test(arg) ? path.join(scratch, "missing", arg.replace(/[<>]/g, "")) : arg));
    const result = spawnSync(process.execPath, [path.join(root, local[1]), ...real], { encoding: "utf8" });
    assert.equal(result.status, 1, command);
    assert.doesNotMatch(result.stderr, /Unknown|Use --|Missing --|only --validation-mode/, document + ": " + command + "\n" + result.stderr);
    assert.match(result.stderr, /ENOENT|does not exist/, document + ": " + command + "\n" + result.stderr);
  }
  const record = documented.filter(({ command }) => command.includes("execution-record.mjs")).map(({ command }) => command);
  for (const mode of ["start", "check"]) {
    assert.ok(record.some((command) => command.includes("--mode " + mode) && command.includes("--software-design-skill ")), mode + " must pass --software-design-skill");
  }
  assert.ok(commands(skill).some((command) => command.includes("validate-delivery-evidence.mjs") && command.includes("--software-design-skill ")), "completion must rerun readiness");
});

test("skill text names no host-specific goal command or runtime", () => {
  for (const document of [...SKILL_TEXT, "tests/README.md"]) {
    assert.doesNotMatch(read(document), /\/goal|\bCodex\b|\bHermes\b/, document);
  }
});

test("a workpack naming the former skill is accepted and runs unchanged", (context) => {
  assert.match(/^description: (.+)$/m.exec(frontmatter)[1], /Workpacks naming delivery-workpack-execution route here\./);
  assert.match(body, /`\*\*Execution skill:\*\*` still names `delivery-workpack-execution`[^.]*routes here/);

  const scratch = tempDirectory(context);
  const snapshot = "sha256:" + "d".repeat(64);
  const workpack = path.join(scratch, "delivery-workpacks/legacy/WORKPACK.md");
  const repository = path.join(scratch, "repository");
  const softwareDesign = path.join(scratch, "software-design");
  fs.mkdirSync(path.dirname(workpack), { recursive: true });
  fs.mkdirSync(repository);
  fs.mkdirSync(path.join(softwareDesign, "scripts"), { recursive: true });
  fs.writeFileSync(path.join(softwareDesign, "scripts/validate-workpack.mjs"), "process.exit(0);");
  fs.writeFileSync(workpack, `# Legacy Workpack\n\n**Software Design snapshot:** \`${snapshot}\`\n\n## Execution Handoff\n\n- **Execution skill:** \`delivery-workpack-execution\`\n`);
  const record = (mode) => spawnSync(process.execPath, [path.join(root, "scripts/execution-record.mjs"), "--validation-mode", "execution", "--mode", mode,
    "--workpack", workpack, "--repository", repository, "--software-design-skill", softwareDesign], { encoding: "utf8" });

  const started = record("start");
  assert.equal(started.status, 0, started.stderr);
  const summary = fs.readFileSync(started.stdout.trim(), "utf8");
  assert.ok(summary.includes("`sha256:" + createHash("sha256").update(fs.readFileSync(workpack)).digest("hex") + "`"));
  const checked = record("check");
  assert.equal(checked.status, 0, checked.stderr);
});

test("no link, path, or name points outside the skill", () => {
  const text = [...SKILL_TEXT, "tests/README.md", ...files("scripts"), ...files("assets")];
  for (const document of text) {
    const content = read(document);
    assert.doesNotMatch(content, /delivery-planning|software-design-intake|planning-skill|skills\/blueprint-development|\/Users\/|~\//, document);
    for (const placeholder of content.match(/<[\w-]*skill-directory>/g) ?? []) {
      assert.ok(["<software-design-execution-skill-directory>", "<software-design-skill-directory>"].includes(placeholder), document + " uses " + placeholder);
    }
    for (const line of content.split("\n").filter((candidate) => candidate.includes("delivery-workpack-execution"))) {
      assert.match(line, /routes? here/, document + " names the former skill outside its legacy-acceptance statement");
    }
  }
  for (const document of [...OWNED_DOCS, ...SHARED_COPIES]) {
    for (const target of links(read(document))) {
      const resolved = path.resolve(path.dirname(path.join(root, document)), target.split("#")[0] || ".");
      const relative = path.relative(root, resolved);
      assert.ok(!relative.startsWith("..") && !path.isAbsolute(relative), document + " links outside the skill: " + target);
    }
  }
});
