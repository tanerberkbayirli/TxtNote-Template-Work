// Long-document editor/PDF vs Word parity gate (engine/tools/parity.py does the measuring).
//
// usage: node engine/tools/parity.mjs [--templates id,id,...] [--copies 2] [--out dir] [--no-word]
//                                     [--baseline <summary.json>] [--keep-going] [--pad N]
//   --templates  registry ids (engine/src/registry.js); default: the reference set below
//   --copies     times the deterministic main body of make-fixture.mjs is repeated (2 = 50-58 pages, 3 = 75-80)
//   --baseline   an earlier summary.json; exit 1 when a template got worse (more shifted pages, more moved words,
//                fewer equal page counts, new table-row/figure page mismatches)
//
// Per template: make-fixture -> repeat body -> real editor export (export.mjs: PDF + DOCX buttons) -> Word render of that DOCX
// (own Word instance, PID recorded, timeout, killed by PID) -> parity.py. Writes <out>/<id>/{fixture,pdf,docx,word.pdf,parity.json}
// and <out>/summary.json + summary.md. Needs the frontend dev server (found at :5173/:5175, else devserver.sh start).
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const REFERENCE_SET = ["mcbu-lee-master-tr-v1", "afsu-lee-master-tr-v1", "aku-sbe-master-tr-v1", "adu-sagbil-master-tr-v1", "mcbu-tip-uzmanlik-tr-v1", "iyte-lee-master-en-v1", "aku-matematik-lisans-tr-v1"];

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const value = (name, fallback) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : fallback; };
const templates = value("templates", REFERENCE_SET.join(",")).split(",").filter(Boolean);
const copies = Number(value("copies", "2"));
// --pad N: N one-line filler paragraphs right after every chapter heading. Chapters start on a new page, so this moves everything in a
// chapter down by N lines against the page bottoms: the same content meets every page-end decision (does the caption and table fit?) at
// a different place. Used to tell a rule that is wrong for every layout from one that happens to agree on the default text.
const pad = Number(value("pad", "0"));
const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "");
const outDir = resolve(root, value("out", `.test-tmp/validation/parity-${stamp}`));
const baselinePath = value("baseline", null);
if (!Number.isInteger(copies) || copies < 1) { console.error("--copies must be a positive integer"); process.exit(2); }
mkdirSync(outDir, { recursive: true });

const env = { ...process.env, PYTHONUTF8: "1", PYTHONIOENCODING: "utf-8" };
const bundledPython = process.env.USERPROFILE && join(process.env.USERPROFILE, ".cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe");
const python = process.env.CHECK_PYTHON || (bundledPython && existsSync(bundledPython) ? bundledPython : "python");
const chrome = process.env.THESIS_BROWSER_EXECUTABLE || ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"].find(existsSync);
const exportEnv = { ...env, PLAYWRIGHT_MODULE: process.env.PLAYWRIGHT_MODULE || join(here, "node_modules/playwright"), ...(chrome ? { THESIS_BROWSER_EXECUTABLE: chrome } : {}) };
const log = (message) => console.error(`[parity] ${message}`);

async function up(url) { try { return (await fetch(url, { signal: AbortSignal.timeout(3000) })).ok; } catch { return false; } }
async function ensureBase() {
  if (process.env.THESIS_BASE_URL) return process.env.THESIS_BASE_URL;
  for (const url of ["http://localhost:5173", "http://127.0.0.1:5175"]) if (await up(url)) return url;
  log("no dev server; starting via devserver.sh (port 5175)");
  spawnSync("bash", [join(here, "devserver.sh"), "start"], { stdio: "ignore", cwd: root, timeout: 60000 });
  if (await up("http://127.0.0.1:5175")) return "http://127.0.0.1:5175";
  console.error("TxtNote frontend dev server not reachable (tried :5173 and :5175). Start it: bash engine/tools/devserver.sh start");
  process.exit(3);
}

function run(command, commandArgs, options = {}) {
  return new Promise((done) => {
    const child = spawn(command, commandArgs, { env: exportEnv, cwd: root, ...options });
    let output = "", pid = null, finished = false;
    const finish = (result) => { if (!finished) { finished = true; clearTimeout(timer); done({ ...result, output, pid }); } };
    const timer = setTimeout(() => {
      if (pid) spawnSync("taskkill", ["/PID", pid, "/F"]);
      if (process.platform === "win32") spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"]); else child.kill("SIGTERM");
      finish({ status: 3, timeout: true });
    }, options.timeoutMs || 900000);
    const collect = (data) => { output += data; const m = output.match(/WORDPID:(\d+)/); if (m) pid = m[1]; };
    child.stdout.on("data", collect);
    child.stderr.on("data", collect);
    child.on("error", (error) => { output += error.message; finish({ status: 3 }); });
    child.on("close", (status) => finish({ status }));
  });
}

/** Repeat the generated main body `copies` times; footnote ids stay unique so every copy keeps its notes. */
function repeatBody(fixture) {
  const parts = [fixture.content];
  for (let copy = 1; copy < copies; copy += 1) parts.push(fixture.content.replace(/data-fn-id="([^"]+)"/g, `data-fn-id="$1_r${copy}"`));
  const joined = parts.join("");
  return { ...fixture, content: pad > 0 ? joined.replace(/<\/h1>/g, (heading) => heading + "<p>Dolgu satırı.</p>".repeat(pad)) : joined };
}

const base = await ensureBase();
const summary = { createdAt: new Date().toISOString(), copies, base, python, templates: {} };

for (const id of templates) {
  const dir = join(outDir, id);
  mkdirSync(dir, { recursive: true });
  const entry = { id, status: "ERROR" };
  summary.templates[id] = entry;
  try {
    const baseFixture = join(dir, "base.fixture.json");
    const made = spawnSync(process.execPath, [join(here, "make-fixture.mjs"), id, baseFixture], { cwd: root, encoding: "utf8" });
    if (made.status !== 0) throw new Error(`make-fixture failed: ${(made.stderr || made.stdout).slice(-300)}`);
    const fixture = join(dir, "fixture.json");
    writeFileSync(fixture, JSON.stringify(repeatBody(JSON.parse(readFileSync(baseFixture, "utf8")))));
    const prefix = join(dir, "export");
    let exported = await run(process.execPath, [join(here, "export.mjs"), fixture, prefix, base]);
    if (exported.status !== 0 && /settle timeout|editor pagination is not exportable|Target page, context or browser has been closed/.test(exported.output)) {
      log(`${id}: transient export failure, retrying once`);
      exported = await run(process.execPath, [join(here, "export.mjs"), fixture, prefix, base]);
    }
    if (exported.status !== 0) throw new Error(`export failed: ${exported.output.slice(-400)}`);
    entry.sheets = Number((exported.output.match(/\((\d+) sheets/) || [])[1]) || null;
    if (flag("no-word")) { entry.status = "EXPORTED"; continue; }
    const wordPdf = join(dir, "word.pdf");
    const word = await run("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", join(here, "word2pdf.ps1"), "-In", `${prefix}.docx`, "-Out", wordPdf], { timeoutMs: Number(process.env.CHECK_WORD_TIMEOUT_MS) || 300000 });
    if (word.timeout) throw new Error(`Word timeout (killed own PID ${word.pid || "unknown"})`);
    if (!word.output.includes("OK") || !existsSync(wordPdf)) throw new Error(`Word render failed: ${word.output.slice(-300)}`);
    const parityPath = join(dir, "parity.json");
    const measured = spawnSync(python, [join(here, "parity.py"), "--app", `${prefix}.pdf`, "--word", wordPdf, "--out", parityPath], { cwd: root, env, encoding: "utf8" });
    if (measured.status !== 0) throw new Error(`parity.py failed: ${(measured.stderr || "").slice(-300)}`);
    const parity = JSON.parse(readFileSync(parityPath, "utf8"));
    Object.assign(entry, {
      status: "MEASURED",
      pages: parity.pageCount,
      shiftedPages: parity.shiftedPages.map((page) => page.page),
      movedWordFraction: parity.movedWordFraction,
      tableRowsOnOtherPage: Object.keys(parity.tableRowPages.onOtherPage).length,
      tableRows: parity.tableRowPages.rows,
      figurePagesEqual: parity.figures.samePages,
      figureMaxOffsetPt: Math.max(0, ...parity.figures.offsets.map((o) => o.maxOffsetPt ?? 0)),
      pageLabelMismatches: parity.pageLabelMismatch.length,
      horizontalLines: parity.horizontal?.linesOffset ?? null,
      horizontalMaxDxPt: parity.horizontal?.maxDxPt ?? null,
      firstDivergences: parity.divergences.slice(0, 6),
    });
  } catch (error) {
    entry.error = String(error.message || error);
    log(`${id}: ${entry.error}`);
    if (!flag("keep-going")) { writeFileSync(join(outDir, "summary.json"), JSON.stringify(summary, null, 1)); process.exit(1); }
  }
  log(`${id}: ${entry.status}${entry.pages ? ` pages ${entry.pages.app}/${entry.pages.word}, shifted ${entry.shiftedPages.length}, moved ${(entry.movedWordFraction * 100).toFixed(2)}%` : ""}`);
}

// ---------------------------------------------------------------- baseline comparison + reports
const regressions = [];
if (baselinePath) {
  const baseline = JSON.parse(readFileSync(resolve(root, baselinePath), "utf8"));
  for (const [id, now] of Object.entries(summary.templates)) {
    const before = baseline.templates?.[id];
    if (!before || before.status !== "MEASURED" || now.status !== "MEASURED") continue;
    const worse = [];
    if (now.pages.equal < before.pages.equal) worse.push("page count no longer equal");
    if (now.shiftedPages.length > before.shiftedPages.length) worse.push(`shifted pages ${before.shiftedPages.length} -> ${now.shiftedPages.length}`);
    if (now.movedWordFraction > before.movedWordFraction + 1e-4) worse.push(`moved words ${before.movedWordFraction} -> ${now.movedWordFraction}`);
    if (now.tableRowsOnOtherPage > before.tableRowsOnOtherPage) worse.push(`table rows on other page ${before.tableRowsOnOtherPage} -> ${now.tableRowsOnOtherPage}`);
    if (before.figurePagesEqual && !now.figurePagesEqual) worse.push("figure pages differ");
    if (now.figureMaxOffsetPt > before.figureMaxOffsetPt + 0.5) worse.push(`figure offset ${before.figureMaxOffsetPt} -> ${now.figureMaxOffsetPt} pt`);
    if (Number.isFinite(before.horizontalLines) && now.horizontalLines > before.horizontalLines) worse.push(`lines placed sideways ${before.horizontalLines} -> ${now.horizontalLines}`);
    if (worse.length) regressions.push({ id, worse });
  }
  summary.baseline = { path: baselinePath, regressions };
}
writeFileSync(join(outDir, "summary.json"), JSON.stringify(summary, null, 1));

const rows = Object.values(summary.templates).map((t) => t.status === "MEASURED"
  ? `| ${t.id} | ${t.pages.app}/${t.pages.word} | ${t.shiftedPages.length}${t.shiftedPages.length ? ` (${t.shiftedPages.slice(0, 6).join(",")}${t.shiftedPages.length > 6 ? ",…" : ""})` : ""} | ${(t.movedWordFraction * 100).toFixed(2)} | ${t.tableRowsOnOtherPage}/${t.tableRows} | ${t.figurePagesEqual ? "=" : "≠"} ${t.figureMaxOffsetPt} | ${t.pageLabelMismatches} | ${t.horizontalLines ?? ""} (${t.horizontalMaxDxPt ?? ""}) |`
  : `| ${t.id} | ${t.status}${t.error ? `: ${t.error.slice(0, 80)}` : ""} | | | | | | |`);
writeFileSync(join(outDir, "summary.md"), [
  `# Uzun belge Word eşliği — ${summary.createdAt.slice(0, 10)} (gövde ×${copies})`, "",
  "| şablon | sayfa app/word | kayan sayfa (≥6 sözcük) | başka sayfadaki sözcük % | uzun tablo satırı başka sayfada | şekil sayfaları / en büyük konum farkı pt | sayfa no farkı | yatay kayan satır (en büyük pt) |",
  "|---|---|---|---|---|---|---|---|", ...rows, "",
  ...(baselinePath ? [regressions.length ? `Baseline'a göre kötüleşen: ${regressions.map((r) => `${r.id} (${r.worse.join("; ")})`).join(" · ")}` : "Baseline'a göre kötüleşen yok."] : []), "",
].join("\n"));
console.log(readFileSync(join(outDir, "summary.md"), "utf8"));
console.log(`summary: ${join(outDir, "summary.json")}`);
process.exit(regressions.length || Object.values(summary.templates).some((t) => t.status === "ERROR") ? 1 : 0);
