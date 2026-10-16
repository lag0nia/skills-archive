# Bundled PDF fonts

System Guide PDFs embed only these fonts, so output does not depend on the fonts installed on a machine. The export fails, naming the characters, when text needs a glyph outside them ([guide-pdf-export.md](../../../references/guide-pdf-export.md#dependencies)).

| File | Family in `guide.css` | Upstream version |
| --- | --- | --- |
| `NotoSerif-Regular`, `-Italic`, `-Bold`, `-BoldItalic` | Guide Serif (body) | Noto Serif 2.015 |
| `NotoSans-Regular`, `-Italic`, `-Bold` | Guide Sans (headings, tables, captions) | Noto Sans 2.015 |
| `NotoSansMono-Regular` | Guide Mono (code) | Noto Sans Mono 2.014 |
| `NotoSansMath-Regular` | Guide Math (arrows and mathematical symbols) | Noto Sans Math 3.000 |

Source: the unhinted TTF files in the Noto project's `notofonts.github.io` repository (`fonts/<Family>/unhinted/ttf/`). License: SIL Open Font License 1.1, in [OFL.txt](OFL.txt).

## Subsets

Each file is a WOFF2 subset made with fontTools `pyftsubset`, keeping all name records and the `.notdef` outline:

- Text families (Serif, Sans, Mono): `U+0000-007E, U+00A0-024F, U+0259, U+02B0-02FF, U+0300-036F, U+0370-03FF, U+1E00-1EFF, U+2000-206F, U+20A0-20CF, U+2100-214F, U+2150-218F, U+FEFF, U+FFFD` (Latin with extensions and combining marks, Greek, general punctuation, currency, letterlike symbols and number forms), with layout features `kern, liga, clig, calt, ccmp, locl, mark, mkmk, onum, lnum, tnum, pnum, case, sups, subs, frac`.
- Math: `U+2190-21FF, U+2200-22FF, U+2300-23FF, U+25A0-25FF, U+27C0-27FF, U+2900-2AFF, U+2B00-2BFF` (arrows, mathematical operators, technical symbols, geometric shapes).

To cover more characters, subset the same upstream files with the added ranges, replace the WOFF2 files, and rerun the export tests. Changing any file here changes the renderer version, so existing PDFs report `stale` until re-exported.
