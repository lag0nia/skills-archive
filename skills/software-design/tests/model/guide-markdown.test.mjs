import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { documentLinks, GuideMarkdownError, inlineText, parseGuideMarkdown, visibleText } from "../../scripts/lib/system-guide/markdown.mjs";

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function problems(source) {
  try {
    parseGuideMarkdown(source, "guide.md");
  } catch (error) {
    assert.ok(error instanceof GuideMarkdownError, error.stack);
    return error.problems.join("\n");
  }
  assert.fail("expected the guide to be rejected");
}

test("the guide subset parses title, lede, sections, lists, tables, callouts, figures and comments", () => {
  const document = parseGuideMarkdown(`# How payments settle

The lede explains \\<why> it **matters**.

<!-- authoring guidance never prints -->

## Same name

### Same name

1. First
   - nested detail
2. Second

| Left | Right |
| :--- | ---: |
| a \\| b | [example](https://example.com) |

> **Watch the boundary**
> An approval is not a payment.

\`\`\`figure
caption: What to notice.
step: Request | The customer asks.
optional: Retry | Only after a timeout, settlement retries.
\`\`\`
`, "guide.md");
  assert.equal(document.titleText, "How payments settle");
  assert.equal(inlineText(document.lede.inlines), "The lede explains <why> it matters.");
  assert.deepEqual(document.headings.map((heading) => heading.slug), ["how-payments-settle", "same-name", "same-name-1"]);
  assert.deepEqual(document.blocks.map((block) => block.type), ["heading", "heading", "list", "table", "callout", "figure"]);
  const table = document.blocks.find((block) => block.type === "table");
  assert.deepEqual(table.alignment, [null, "right"]);
  assert.equal(inlineText(table.rows[0][0]), "a | b");
  assert.equal(inlineText(document.blocks.find((block) => block.type === "callout").title), "Watch the boundary");
  assert.deepEqual(document.blocks.find((block) => block.type === "figure").steps.map((step) => step.optional), [false, true]);
  assert.deepEqual(documentLinks(document).map((link) => [link.href, link.label, link.line]), [["https://example.com", "example", 17]]);
  assert.ok(!visibleText(document).some((fragment) => /authoring guidance/.test(fragment.text)));
});

test("constructs outside the subset are rejected with their line numbers", () => {
  const cases = [
    ["---\nowner: x\n---\n# T\n\nLede.\n", /guide\.md:1: guide documents have no frontmatter/],
    ["Lede only.\n", /guide\.md:1: a guide starts with one level-1 heading/],
    ["# T\n\n# U\n", /guide\.md:3: a guide has exactly one level-1 heading/],
    ["# T\n\n### Deep\n", /guide\.md:3: heading level 3 follows level 1; do not skip levels/],
    ["# T\n\n## A\n\n### B\n\n#### C\n\n##### D\n", /guide\.md:9: use heading levels 1 to 4/],
    ["# T\n\nTitle\n=====\n", /guide\.md:4: underlined \(setext\) headings are not supported/],
    ["# T\n\n![diagram](diagram.png)\n", /guide\.md:3: images are not supported/],
    ["# T\n\n<div>block</div>\n", /guide\.md:3: raw HTML is not supported/],
    ["# T\n\nA <b>bold</b> word.\n", /guide\.md:3: raw HTML is not supported: <b; write \\< for a literal angle bracket/],
    ["# T\n\nText[^1].\n\n[^1]: Note.\n", /guide\.md:3: footnotes are not supported/],
    ["# T\n\nSee [x][y].\n\n[y]: https://example.com\n", /guide\.md:3: reference-style links are not supported/],
    ["# T\n\nA\n\n---\n\nB\n", /guide\.md:5: horizontal rules are not supported/],
    ["# T\n\nA\n\n    indented code\n", /guide\.md:5: indented code blocks are not supported/],
    ["# T\n\n> a\n> > b\n", /guide\.md:4: nested quotations are not supported/],
    ["# T\n\n| a | b |\n| c | d |\n", /guide\.md:3: a table needs a header row followed by a separator row/],
    ["# T\n\n| a | b |\n| --- | --- |\n| c |\n", /guide\.md:5: table row has 1 cells; the header has 2/],
    ["# T\n\n```\ncode\n", /guide\.md:3: unclosed fenced block/],
    ["# T\n\n<!-- open\n", /unclosed HTML comment/],
    ["# T\n\n```figure\ncaption: c\nstep: A | a\n```\n", /guide\.md:3: a figure needs at least two steps/],
    ["# T\n\n```figure\nstep: A | a\nstep: B | b\n```\n", /guide\.md:3: a figure needs a caption line/],
    ["# T\n\n```figure\ncaption: c\nstep: A without separator\nstep: B | b\n```\n", /guide\.md:5: a figure step needs a title and an explanation separated by \|/],
    [`# T\n\n\`\`\`figure\ncaption: c\n${Array.from({ length: 9 }, (_, index) => `step: S${index} | s`).join("\n")}\n\`\`\`\n`, /figure.*(at most|eight|8)/i],
  ];
  for (const [source, pattern] of cases) assert.match(problems(source), pattern, source);
});

test("every problem in a guide is reported together", () => {
  const reported = problems("# T\n\n![a](a.png)\n\n<div>x</div>\n\n---\n");
  assert.equal(reported.split("\n").length, 3, reported);
});

test("the shipped guide templates parse in the subset", () => {
  for (const template of ["architecture.md", "domain.md"]) {
    const file = path.join(skillRoot, "assets/templates/guide", template);
    const document = parseGuideMarkdown(fs.readFileSync(file, "utf8"), file);
    assert.ok(document.titleText.length > 0, template);
  }
});
