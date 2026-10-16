#!/usr/bin/env node

// Export the System Guide of a Software Design package as PDFs.
// Usage and behavior: references/guide-pdf-export.md.

import { BrowserUnavailableError } from "./lib/system-guide/chromium.mjs";
import { exportSystemGuide } from "./lib/system-guide/export.mjs";

const USAGE = `Usage: node export-system-guide.mjs --root <software-design-package> --out <directory-outside-the-package> <scope> [options]

Scope (at least one):
  --architecture        the architecture guide
  --domain <slug>       one domain guide; repeat for several
  --all                 the architecture guide and every domain guide, one PDF each
  --combined            one complete System Guide: architecture, then every domain
                        (--all and --combined need every declared domain written)

Options:
  --check               report whether existing PDFs are current, without printing
  --force               print even when an existing PDF is current
  --browser <path>      Chromium-based browser executable (or SOFTWARE_DESIGN_PDF_BROWSER)
  --date <YYYY-MM-DD>   date printed in the footer (default: today, UTC)`;

function parseArgs(argv) {
  const args = { scopes: { domains: [] } };
  const value = (index, flag) => {
    const next = argv[index + 1];
    if (next === undefined || next.startsWith("--")) throw new Error(`${flag} needs a value.\n\n${USAGE}`);
    return next;
  };
  for (let index = 2; index < argv.length; index += 1) {
    const flag = argv[index];
    switch (flag) {
      case "--root": args.root = value(index, flag); index += 1; break;
      case "--out": args.outDir = value(index, flag); index += 1; break;
      case "--architecture": args.scopes.architecture = true; break;
      case "--domain": args.scopes.domains.push(value(index, flag)); index += 1; break;
      case "--all": args.scopes.all = true; break;
      case "--combined": args.scopes.combined = true; break;
      case "--check": args.check = true; break;
      case "--force": args.force = true; break;
      case "--browser": args.browser = value(index, flag); index += 1; break;
      case "--date": args.date = value(index, flag); index += 1; break;
      case "--help": case "-h": args.help = true; break;
      default: throw new Error(`Unknown argument: ${flag}\n\n${USAGE}`);
    }
  }
  if (!args.help && !args.root) throw new Error(`--root is required.\n\n${USAGE}`);
  return args;
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log(USAGE);
    return;
  }
  const result = await exportSystemGuide({ ...args, log: (line) => console.log(line) });
  if (args.check && result.results.some((entry) => entry.status !== "current")) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof BrowserUnavailableError ? `PDF export needs a browser.\n${error.message}` : error.message);
  process.exitCode = 1;
});
