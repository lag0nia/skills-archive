// Headless Chromium printing over the DevTools pipe. No npm dependencies, no
// network: every request outside the allowed local directories is refused and
// reported, so a guide PDF can only contain bundled fonts and generated HTML.

import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const MINIMUM_CHROMIUM_MAJOR = 131; // CSS @page margin boxes (running headers and page numbers)
export const BROWSER_ENV = "SOFTWARE_DESIGN_PDF_BROWSER";

export class BrowserUnavailableError extends Error {}

function executable(candidate) {
  try {
    const stat = fs.statSync(candidate);
    if (!stat.isFile()) return false;
    if (process.platform !== "win32") fs.accessSync(candidate, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function revisionDirectories(root, prefix) {
  try {
    return fs.readdirSync(root)
      .filter((name) => name.startsWith(`${prefix}-`))
      .sort((left, right) => Number(right.split("-").pop()) - Number(left.split("-").pop()))
      .map((name) => path.join(root, name));
  } catch {
    return [];
  }
}

function playwrightCandidates() {
  const home = os.homedir();
  const roots = [
    process.env.PLAYWRIGHT_BROWSERS_PATH,
    process.platform === "darwin" && path.join(home, "Library", "Caches", "ms-playwright"),
    process.platform === "linux" && path.join(process.env.XDG_CACHE_HOME || path.join(home, ".cache"), "ms-playwright"),
    process.platform === "win32" && process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, "ms-playwright"),
  ].filter(Boolean);
  const layouts = {
    darwin: [
      ["chromium_headless_shell", ["chrome-headless-shell-mac-arm64/chrome-headless-shell", "chrome-headless-shell-mac-x64/chrome-headless-shell"]],
      ["chromium", ["chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing", "chrome-mac/Chromium.app/Contents/MacOS/Chromium", "chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"]],
    ],
    linux: [
      ["chromium_headless_shell", ["chrome-headless-shell-linux64/chrome-headless-shell", "chrome-linux/headless_shell"]],
      ["chromium", ["chrome-linux64/chrome", "chrome-linux/chrome"]],
    ],
    win32: [
      ["chromium_headless_shell", ["chrome-headless-shell-win64/chrome-headless-shell.exe", "chrome-win/headless_shell.exe"]],
      ["chromium", ["chrome-win64/chrome.exe", "chrome-win/chrome.exe"]],
    ],
  }[process.platform] || [];
  const result = [];
  for (const root of roots) {
    for (const [prefix, relatives] of layouts) {
      for (const directory of revisionDirectories(root, prefix)) {
        for (const relative of relatives) result.push(path.join(directory, relative));
      }
    }
  }
  return result;
}

function pathCandidates() {
  const names = ["chromium", "chromium-browser", "google-chrome", "google-chrome-stable", "chrome", "microsoft-edge", "microsoft-edge-stable", "brave-browser"];
  const extensions = process.platform === "win32" ? [".exe"] : [""];
  return (process.env.PATH || "").split(path.delimiter).filter(Boolean)
    .flatMap((directory) => names.flatMap((name) => extensions.map((extension) => path.join(directory, name + extension))));
}

function applicationCandidates() {
  if (process.platform === "darwin") {
    return [
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Chromium.app/Contents/MacOS/Chromium",
      "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
      "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    ].flatMap((candidate) => [candidate, path.join(os.homedir(), candidate)]);
  }
  if (process.platform === "linux") return ["/snap/bin/chromium", "/usr/bin/chromium", "/usr/bin/google-chrome", "/opt/google/chrome/chrome", "/usr/bin/microsoft-edge"];
  if (process.platform === "win32") {
    const roots = [process.env.PROGRAMFILES, process.env["PROGRAMFILES(X86)"], process.env.LOCALAPPDATA].filter(Boolean);
    return roots.flatMap((root) => [
      path.join(root, "Google", "Chrome", "Application", "chrome.exe"),
      path.join(root, "Microsoft", "Edge", "Application", "msedge.exe"),
      path.join(root, "Chromium", "Application", "chrome.exe"),
    ]);
  }
  return [];
}

/**
 * Choose the Chromium executable. Order: explicit path, environment variable,
 * Playwright's browser cache, PATH, standard application locations.
 */
const INSTALL_HINT = `Name a Chromium ${MINIMUM_CHROMIUM_MAJOR}+ executable (Chrome, Chromium, Edge, Brave), or install one with: npx playwright install chromium`;

export function findBrowser(explicit) {
  if (explicit) {
    if (executable(explicit)) return { path: path.resolve(explicit), source: "--browser" };
    throw new BrowserUnavailableError(`The browser given with --browser is not an executable file: ${explicit}\n${INSTALL_HINT}`);
  }
  const fromEnvironment = process.env[BROWSER_ENV];
  if (fromEnvironment) {
    if (executable(fromEnvironment)) return { path: path.resolve(fromEnvironment), source: BROWSER_ENV };
    throw new BrowserUnavailableError(`${BROWSER_ENV} does not name an executable file: ${fromEnvironment}\n${INSTALL_HINT}`);
  }
  for (const [source, candidates] of [["Playwright browser cache", playwrightCandidates()], ["PATH", pathCandidates()], ["installed applications", applicationCandidates()]]) {
    const found = candidates.find(executable);
    if (found) return { path: found, source };
  }
  throw new BrowserUnavailableError([
    `No Chromium-based browser was found. PDF export needs Chromium ${MINIMUM_CHROMIUM_MAJOR} or later (Chrome, Chromium, Edge, Brave, or Playwright's Chromium).`,
    "Either install one, for example: npx playwright install chromium",
    `or pass its executable with --browser <path>, or set ${BROWSER_ENV}=<path>.`,
  ].join("\n"));
}

function withinRoots(filePath, roots) {
  const resolved = path.resolve(filePath);
  return roots.some((root) => resolved === root || resolved.startsWith(root + path.sep));
}

class PipeConnection {
  constructor(child) {
    this.child = child;
    this.nextId = 0;
    this.pending = new Map();
    this.listeners = new Set();
    this.buffer = Buffer.alloc(0);
    child.stdio[4].on("data", (chunk) => this.receive(chunk));
  }

  receive(chunk) {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    let end;
    while ((end = this.buffer.indexOf(0)) !== -1) {
      const message = JSON.parse(this.buffer.subarray(0, end).toString("utf8"));
      this.buffer = this.buffer.subarray(end + 1);
      if (message.id !== undefined && this.pending.has(message.id)) {
        const { resolve, reject, method } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) reject(new Error(`${method}: ${message.error.message}`));
        else resolve(message.result);
      } else {
        for (const listener of this.listeners) listener(message);
      }
    }
  }

  send(method, params = {}, sessionId) {
    const id = ++this.nextId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject, method });
      this.child.stdio[3].write(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }) + "\0");
    });
  }

  failAll(error) {
    for (const { reject } of this.pending.values()) reject(error);
    this.pending.clear();
  }

  waitFor(predicate) {
    return new Promise((resolve) => {
      const listener = (message) => {
        if (predicate(message)) { this.listeners.delete(listener); resolve(message); }
      };
      this.listeners.add(listener);
    });
  }
}

function withTimeout(promise, milliseconds, what) {
  let timer;
  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`Timed out after ${milliseconds / 1000}s while ${what}.`)), milliseconds); }),
  ]);
}

const LAYOUT_CHECK = `(() => {
  const problems = [];
  for (const face of document.fonts) {
    if (face.status === "error") problems.push("font failed to load: " + face.family + " " + face.style + " " + face.weight);
  }
  const limit = document.documentElement.clientWidth + 0.5;
  for (const element of document.querySelectorAll("body *")) {
    const box = element.getBoundingClientRect();
    const clipped = element.clientWidth && element.scrollWidth > element.clientWidth + 1;
    if ((box.width && box.right > limit) || clipped) {
      const text = (element.textContent || "").replace(/\\s+/g, " ").trim().slice(0, 80);
      problems.push("content wider than the page (" + element.tagName.toLowerCase() + "): " + text);
    }
  }
  return [...new Set(problems)].slice(0, 20);
})()`;

/**
 * Start one headless browser for a batch of prints. `allowedRoots` lists the
 * directories whose files a page may load (the generated HTML and bundled fonts).
 */
export async function launchBrowser({ browserPath, allowedRoots, contentWidthPx, timeoutMs = 120000 }) {
  const roots = allowedRoots.map((root) => path.resolve(root));
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "software-design-pdf-"));
  const args = [
    "--headless=new",
    "--remote-debugging-pipe",
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-gpu",
    "--disable-extensions",
    "--disable-background-networking",
    "--disable-component-update",
    "--disable-default-apps",
    "--disable-sync",
    "--disable-features=Translate,MediaRouter,OptimizationHints,AutofillServerCommunication",
    "--metrics-recording-only",
    "--no-pings",
    "--mute-audio",
    "--host-resolver-rules=MAP * ~NOTFOUND",
    "--allow-file-access-from-files",
    "--font-render-hinting=none",
  ];
  if (process.platform === "linux" && typeof process.getuid === "function" && process.getuid() === 0) args.push("--no-sandbox");
  args.push("about:blank");

  let child;
  try {
    child = spawn(browserPath, args, { stdio: ["ignore", "ignore", "pipe", "pipe", "pipe"] });
  } catch (error) {
    fs.rmSync(profile, { recursive: true, force: true });
    throw new BrowserUnavailableError(`Could not start ${browserPath}: ${error.message}`);
  }
  let stderr = "";
  child.stderr.on("data", (chunk) => { stderr = (stderr + chunk).slice(-4000); });
  const connection = new PipeConnection(child);
  const exited = new Promise((resolve) => child.on("exit", (code, signal) => resolve({ code, signal })));
  child.on("error", (error) => connection.failAll(new BrowserUnavailableError(`Could not start ${browserPath}: ${error.message}`)));
  exited.then(({ code, signal }) => connection.failAll(new Error(`The browser exited (${signal || code}) before printing finished.${stderr ? `\n${stderr.trim().split("\n").slice(-5).join("\n")}` : ""}`)));
  child.stdio[3].on("error", () => {});

  const close = async () => {
    const running = () => child.exitCode === null && child.signalCode === null;
    if (running()) {
      try { await withTimeout(connection.send("Browser.close"), 5000, "closing the browser"); } catch { /* fall through to kill */ }
    }
    if (running()) child.kill("SIGKILL");
    await withTimeout(exited, 5000, "waiting for the browser to exit").catch(() => {});
    fs.rmSync(profile, { recursive: true, force: true });
  };

  let version;
  try {
    version = await withTimeout(connection.send("Browser.getVersion"), 30000, "starting the browser");
  } catch (error) {
    await close();
    throw error instanceof BrowserUnavailableError ? error : new BrowserUnavailableError(`${browserPath} did not start as a DevTools-capable Chromium browser: ${error.message}`);
  }
  const major = Number(/\/(\d+)\./.exec(version.product)?.[1] || 0);
  if (major < MINIMUM_CHROMIUM_MAJOR) {
    await close();
    throw new BrowserUnavailableError(`${version.product} is too old: PDF export needs Chromium ${MINIMUM_CHROMIUM_MAJOR} or later for running page headers. Install a newer browser (npx playwright install chromium) or pass --browser <path>.`);
  }

  async function print(htmlFile) {
    const blocked = [];
    const { targetId } = await connection.send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await connection.send("Target.attachToTarget", { targetId, flatten: true });
    const pausedListener = (message) => {
      if (message.method !== "Fetch.requestPaused" || message.sessionId !== sessionId) return;
      const { requestId, request } = message.params;
      let allowed = false;
      if (request.url.startsWith("file:")) {
        try { allowed = withinRoots(fileURLToPath(request.url), roots); } catch { allowed = false; }
      } else if (request.url.startsWith("data:")) {
        allowed = true;
      }
      if (allowed) connection.send("Fetch.continueRequest", { requestId }, sessionId).catch(() => {});
      else {
        blocked.push(request.url);
        connection.send("Fetch.failRequest", { requestId, errorReason: "BlockedByClient" }, sessionId).catch(() => {});
      }
    };
    connection.listeners.add(pausedListener);
    try {
      await connection.send("Fetch.enable", { patterns: [{ urlPattern: "*" }] }, sessionId);
      await connection.send("Page.enable", {}, sessionId);
      await connection.send("Emulation.setEmulatedMedia", { media: "print" }, sessionId);
      if (contentWidthPx) await connection.send("Emulation.setDeviceMetricsOverride", { width: Math.floor(contentWidthPx), height: 1000, deviceScaleFactor: 1, mobile: false }, sessionId);
      const loaded = connection.waitFor((message) => message.method === "Page.loadEventFired" && message.sessionId === sessionId);
      const navigation = await connection.send("Page.navigate", { url: pathToFileURL(htmlFile).href }, sessionId);
      if (navigation.errorText) throw new Error(`Could not open the generated HTML: ${navigation.errorText}`);
      await withTimeout(loaded, timeoutMs, "loading the generated HTML");
      await withTimeout(connection.send("Runtime.evaluate", { expression: "document.fonts.ready.then(() => true)", awaitPromise: true }, sessionId), timeoutMs, "loading fonts");
      const layout = await connection.send("Runtime.evaluate", { expression: LAYOUT_CHECK, returnByValue: true }, sessionId);
      if (contentWidthPx) await connection.send("Emulation.clearDeviceMetricsOverride", {}, sessionId);
      const { stream } = await withTimeout(connection.send("Page.printToPDF", {
        printBackground: true,
        preferCSSPageSize: true,
        generateTaggedPDF: true,
        generateDocumentOutline: true,
        displayHeaderFooter: false,
        transferMode: "ReturnAsStream",
      }, sessionId), timeoutMs, "printing the PDF");
      const chunks = [];
      for (;;) {
        const part = await connection.send("IO.read", { handle: stream, size: 1 << 20 }, sessionId);
        chunks.push(Buffer.from(part.data, part.base64Encoded ? "base64" : "utf8"));
        if (part.eof) break;
      }
      await connection.send("IO.close", { handle: stream }, sessionId);
      return { pdf: Buffer.concat(chunks), blocked, layoutProblems: layout.result.value || [] };
    } finally {
      connection.listeners.delete(pausedListener);
      await connection.send("Target.closeTarget", { targetId }).catch(() => {});
    }
  }

  return { version: version.product, print, close };
}

/** Report whether a browser can be found, for tests that need a real browser. */
export function browserAvailable() {
  try {
    findBrowser();
    return true;
  } catch {
    return false;
  }
}
