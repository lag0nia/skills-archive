# System Guide PDF Export

Read this reference to export, check or inspect System Guide PDFs, or when guide Markdown fails to parse. The Markdown in `guide/` is the maintained source; PDFs are generated from it without rewriting, and never edited.

## Contents

- Command
- Editions And Filenames
- Freshness And Failure
- Dependencies
- Markdown Subset
- Links In PDFs
- Verification

## Command

```sh
node <software-design-skill-directory>/scripts/export-system-guide.mjs \
  --root <software-design-package> --out <directory-outside-the-package> <scope>
```

Use `--all` for the primary deliverables: a separate architecture PDF and one PDF per domain. The combined edition remains optional. Choose at least one scope:

| Scope | Output |
| --- | --- |
| `--architecture` | the architecture guide |
| `--domain <slug>` | one domain guide; repeat for several |
| `--all` | the architecture guide and every domain guide, one PDF each |
| `--combined` | the complete System Guide in one PDF |

`--all` and `--combined` export the complete System Guide, so they require every domain declared in the architecture record to have its domain record and guide. While Stage 2 is still writing domains, export the finished guides with `--architecture` or `--domain <slug>`; a complete export fails and names the declared domains not yet written, and `--domain` of such a domain fails the same way. A separate architecture PDF says which domain guides are not written yet.

Options: `--check` reports whether existing PDFs are current without printing; `--force` prints even when a PDF is current; `--browser <path>` selects the browser; `--date YYYY-MM-DD` sets the footer date (default today, UTC). The output directory must lie outside the package, judged by real location: a symbolic link anywhere in the path, including in the existing parents of a directory export would create, cannot place output inside the package. Export reads `guide/`, the system name, the domain list and the titles of linked records, and runs only the guide checks; the rest of the package need not pass validation.

## Editions And Filenames

Use one export directory per system, normally `system-guide-pdfs/` beside the design package. Keep the architecture PDF at the top level and the domain PDFs together under `domains/`, without repeating the system name in filenames. Link directly to these PDFs from the package README; keep the export directory free of a separate README or index:

- `architecture.pdf`
- `domains/<domain-slug>.pdf`
- `system-guide.pdf` — the combined edition: a title page that lists every included guide, a contents page with page numbers, then the architecture guide and every domain guide in architecture order, each starting on a new page.

A separate PDF states its own scope under its title: which guide it is and which other guides exist. Longer guides get an "In this guide" contents list. The combined edition always contains every domain the architecture record declares; export fails rather than omit one. Every PDF has bookmarks for its headings, a running header (system name and guide), and a footer with the generation date, a source fingerprint and "Page N of M".

## Freshness And Failure

Each PDF records a source fingerprint in its metadata (`Keywords: source-fingerprint:<sha256>`), derived from the rendered content and the renderer version (scripts, style and fonts), not from the date or machine. The hidden `.metadata/` directory receives `system-guide-export.json`, recording for each PDF its sources and their hashes, fingerprint, file hash, page count, date and browser, plus the regeneration command.

- An export skips a PDF whose fingerprint is current; `--force` prints it anyway. A PDF edited after export no longer matches the manifest and is reprinted.
- `--check` prints `current`, `stale`, `modified` or `missing` per requested PDF and exits non-zero unless all are current.
- Every requested PDF is printed and verified in a temporary directory first; nothing in the output directory changes until all succeed.
- Publication then checks every destination (distinct, a regular file or absent, in a writable directory), moves each existing file aside, and moves the new PDFs and finally the manifest in. If any step fails, the files already moved are restored in reverse order and the export fails saying nothing was replaced. If a restoration itself fails, the export names each file that could not be restored and where its previous copy is kept, in a hidden work directory inside the output directory.

## Dependencies

Export needs Node 20 or later and a Chromium-based browser (Chromium 131 or later): Chrome, Chromium, Edge, Brave or Playwright's Chromium. It searches, in order, `--browser`, the `SOFTWARE_DESIGN_PDF_BROWSER` environment variable, the Playwright browser cache, `PATH` and standard install locations, and fails with installation instructions when none is found (`npx playwright install chromium` installs one). The browser runs headless with a temporary profile and no network: any request outside the generated page and the skill's bundled assets is refused and fails the export.

Fonts are bundled in `assets/pdf/fonts/` (Noto Serif, Noto Sans, Noto Sans Mono and Noto Sans Math subsets, SIL Open Font License 1.1; see its README). A PDF never embeds a machine font: text outside the bundled Latin, Greek, punctuation, currency, arrow and mathematical ranges fails the export with the characters named.

## Markdown Subset

Guides use a strict subset; anything else fails validation with its line number.

- One `#` title first; `##` to `####` sections without skipped levels. The first paragraph after the title is the lede.
- Paragraphs; `-`, `*` or `+` and numbered lists, nested by indentation.
- Inline `**strong**`, `*emphasis*`, `` `code` ``, and inline links (a descriptive label in square brackets followed by the destination in parentheses); `<https://…>` for a bare URL; backslash escapes such as `\<`.
- Tables with a header row and a `| --- |` separator; escape a literal pipe as `\|`.
- Fenced code blocks.
- Callouts: a blockquote whose optional first line is a bold title, followed by paragraphs or lists.
- Figures for short sequences:

  ````text
  ```figure
  caption: What the reader should notice.
  step: Title | One-line explanation.
  optional: Title | The condition, then the explanation.
  step: Title | One-line explanation.
  ```
  ````

  A figure has a caption and two to eight steps; up to four print in a row, more print as a column. Optional steps print dashed and labeled conditional. The paragraph just before a figure prints on the figure's page where the page allows, and so does a paragraph ending in a colon before a list, table or code block, so write a figure's introduction directly above it.

Frontmatter, images, raw HTML, footnotes, reference-style links, horizontal rules, setext headings and indented code are rejected. HTML comments are allowed and do not print.

## Links In PDFs

- Links to sections of the same guide work in every PDF; links between guides work in the combined edition.
- In a separate PDF, a link to a guide it does not contain prints as plain text with compact navigation under "Other guides".
- A link to a technical record prints as plain text without an automatic technical-record catalogue. Technical links and traceability remain in the maintained Markdown and authoritative records.
- External `https:` and `mailto:` links stay clickable.

## Verification

Export verifies each PDF before keeping it: every source block's text appears in order and is selectable, every glyph comes from a bundled font, no blueprint identifier is visible, each heading has a matching bookmark, every internal link has a destination, and nothing overflows the page width. Pages are never rasterized.

These checks do not judge typography. Before delivering PDFs, render every page to an image and inspect it: headings stay with their text, introductions stay with the figure or list they introduce, tables repeat their header row across pages, figures and callouts are not split, and nothing is clipped or crowded.
