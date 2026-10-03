#!/usr/bin/env node
// Deterministic conformance checker driver. See orchestration/tools/CHECKER.md.
//   node orchestration/tools/check.mjs --target <id> [--fixture <path>] [--word] [--only <ids>|failed]
//        [--out <dir>] [--no-export <pdf> <docx>] [--build-reference] [--official-docx <path>]
// Flow: checks.json -> real export (export.mjs, per fixture variant) -> optional Word render
//       -> conformance.py (PyMuPDF / DOCX XML) -> check-<stamp>.json/.md. Exit 0 only if no FAIL.
import { spawnSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync, appendFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const args = process.argv.slice(2);
const opt = { word: false, buildReference: false };
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--target") opt.target = args[++i];
  else if (a === "--fixture") opt.fixture = args[++i];
  else if (a === "--word") opt.word = true;
  else if (a === "--only") opt.only = args[++i];
  else if (a === "--out") opt.out = args[++i];
  else if (a === "--build-reference") opt.buildReference = true;
  else if (a === "--official-docx") opt.officialDocx = args[++i];
  else if (a === "--no-export") { opt.noExport = [args[++i], args[++i]]; }
  else { console.error(`unknown argument ${a}`); process.exit(2); }
}
if (!opt.target) { console.error("usage: check.mjs --target <id> [--fixture f] [--word] [--only ids|failed] [--out dir] [--no-export pdf docx] [--build-reference]"); process.exit(2); }
const id = opt.target;
const specs = join(root, "orchestration/specs");
const outDir = resolve(root, opt.out || `orchestration/validation/${id}`);
const runDir = join(outDir, "run");
const refDir = join(root, `orchestration/artifacts/${id}/source/reference`);
const logFile = join(runDir, "check.log");
mkdirSync(runDir, { recursive: true });
const log = (s) => appendFileSync(logFile, s + "\n");
const env = { ...process.env, PYTHONUTF8: "1", PYTHONIOENCODING: "utf-8" };

function py(argv) {
  return spawnSync("python", [join(here, "conformance.py"), ...argv], { encoding: "utf8", env, cwd: root });
}

// ---------------------------------------------------------------- Word (own instance, PID recorded, timeout)
async function wordToPdf(docx, pdf, timeoutMs = Number(process.env.CHECK_WORD_TIMEOUT_MS) || 120000) {
  return new Promise((res) => {
    const ps = spawn("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", join(here, "word2pdf.ps1"), "-In", docx, "-Out", pdf], { cwd: root });
    let out = "", pid = null, done = false;
    const finish = (r) => { if (!done) { done = true; clearTimeout(timer); res(r); } };
    ps.stdout.on("data", (d) => { out += d; const m = out.match(/WORDPID:(\d+)/); if (m) pid = m[1]; });
    ps.stderr.on("data", (d) => { out += d; });
    const timer = setTimeout(() => {
      // kill only the WINWORD instance this run started (and its PowerShell host)
      if (pid) spawnSync("taskkill", ["/PID", pid, "/F"]);
      spawnSync("taskkill", ["/PID", String(ps.pid), "/T", "/F"]);
      finish({ ok: false, reason: `Word timeout after ${timeoutMs / 1000}s (killed own PID ${pid || "unknown"})` });
    }, timeoutMs);
    ps.on("close", () => finish(out.includes("OK") && existsSync(pdf) ? { ok: true, pid } : { ok: false, reason: `Word render failed: ${out.trim().slice(-300)}` }));
    ps.on("error", (e) => finish({ ok: false, reason: `cannot start powershell: ${e.message}` }));
  });
}

// ---------------------------------------------------------------- reference
if (opt.buildReference) {
  mkdirSync(refDir, { recursive: true });
  const wp = join(refDir, "official-word.pdf");
  if (existsSync(wp)) {
    console.log(`reference present, not re-rendering: ${wp}`);
  } else {
    const docx = opt.officialDocx ? resolve(root, opt.officialDocx) : join(refDir, "official.docx");
    if (!existsSync(docx)) { console.error(`no official-word.pdf and no official DOCX (${docx}); pass --official-docx`); process.exit(2); }
    const r = await wordToPdf(docx, wp);
    if (!r.ok) { console.error(r.reason); process.exit(1); }
  }
  const r = py(["build-reference", "--dir", refDir]);
  process.stdout.write(r.stdout); process.stderr.write(r.stderr);
  process.exit(r.status ?? 1);
}

// ---------------------------------------------------------------- select checks
const checksPath = join(specs, `${id}.checks.json`);
if (!existsSync(checksPath)) { console.error(`missing ${checksPath} (see CHECKER.md)`); process.exit(2); }
let checks = JSON.parse(readFileSync(checksPath, "utf8"));
if (!Array.isArray(checks)) checks = checks.checks;
let only = opt.only;
if (only === "failed") {
  const prev = existsSync(outDir) ? readdirSync(outDir).filter((f) => /^check-.*\.json$/.test(f)).sort().pop() : null;
  if (!prev) { console.error("--only failed: no previous check-*.json"); process.exit(2); }
  const j = JSON.parse(readFileSync(join(outDir, prev), "utf8"));
  const failed = j.checks.filter((c) => c.status === "FAIL" || c.status === "CONFLICT").map((c) => c.id);
  if (!failed.length) { console.log(`no failed checks in ${prev}`); process.exit(0); }
  only = failed.join(",");
}
const selected = only ? checks.filter((c) => only.split(",").includes(c.id)) : checks;
const variants = [...new Set(selected.filter((c) => c.kind !== "note").map((c) => c.params?.fixture || c.fixture || "default"))];
if (!existsSync(refDir)) console.error(`note: no cached reference at ${refDir} (create with --build-reference)`);

// ---------------------------------------------------------------- dev server + export
async function up(url) { try { const r = await fetch(url, { signal: AbortSignal.timeout(3000) }); return r.ok; } catch { return false; } }
async function ensureBase() {
  if (process.env.THESIS_BASE_URL) return process.env.THESIS_BASE_URL;
  for (const u of ["http://localhost:5173", "http://127.0.0.1:5175"]) if (await up(u)) return u;
  log("no dev server; starting via devserver.sh (port 5175)");
  spawnSync("bash", [join(here, "devserver.sh"), "start"], { encoding: "utf8", cwd: root });
  if (await up("http://127.0.0.1:5175")) return "http://127.0.0.1:5175";
  console.error("TxtNote frontend dev server not reachable (tried :5173 and :5175). Start it: bash orchestration/tools/devserver.sh start");
  process.exit(3);
}
function fixtureFor(variant) {
  if (variant === "default" && opt.fixture) return resolve(root, opt.fixture);
  const f = join(specs, variant === "default" ? `${id}.fixture.json` : `${id}.fixture.${variant}.json`);
  if (!existsSync(f)) { console.error(`missing fixture ${f}`); process.exit(2); }
  return f;
}
const chrome = process.env.THESIS_BROWSER_EXECUTABLE || ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"].find(existsSync);
const exportEnv = { ...env, PLAYWRIGHT_MODULE: process.env.PLAYWRIGHT_MODULE || join(here, "node_modules/playwright"), ...(chrome ? { THESIS_BROWSER_EXECUTABLE: chrome } : {}) };

const vmap = {};
let base = null;
for (const v of variants) {
  const prefix = join(runDir, v);
  vmap[v] = { pdf: `${prefix}.pdf`, docx: `${prefix}.docx` };
  if (opt.noExport && v === "default") {
    vmap[v] = { pdf: resolve(root, opt.noExport[0]), docx: resolve(root, opt.noExport[1]) };
    continue;
  }
  if (opt.noExport) { vmap[v].pdf = vmap[v].docx = null; vmap[v].note = "--no-export given only for the default variant"; continue; }
  base ??= await ensureBase();
  const r = spawnSync("node", [join(here, "export.mjs"), fixtureFor(v), prefix, base], { encoding: "utf8", env: exportEnv, cwd: root, timeout: 900000 });
  log(`export ${v}: status ${r.status}\n${(r.stdout || "").slice(-600)}\n${(r.stderr || "").slice(-1500)}`);
  if (r.status !== 0) { console.error(`export of variant '${v}' failed (see ${logFile}):\n${(r.stderr || r.stdout || "").trim().slice(-400)}`); process.exit(3); }
}

// ---------------------------------------------------------------- Word render
for (const v of variants) {
  if (!opt.word) { vmap[v].wordNote = "Word render not requested (run with --word)"; continue; }
  if (!vmap[v].docx || !existsSync(vmap[v].docx)) { vmap[v].wordNote = "no DOCX to render"; continue; }
  const wp = vmap[v].docx.replace(/\.docx$/, ".word.pdf");
  const r = await wordToPdf(vmap[v].docx, wp);
  log(`word ${v}: ${JSON.stringify(r)}`);
  if (r.ok) vmap[v].wordPdf = wp; else vmap[v].wordNote = r.reason;
}

// ---------------------------------------------------------------- evaluate
const a = ["run", "--target", id, "--checks", checksPath, "--variants", JSON.stringify(vmap), "--reference", refDir, "--out", outDir];
if (only) a.push("--only", selected.map((c) => c.id).join(","));
if (opt.word) a.push("--word-requested");
const r = py(a);
process.stdout.write(r.stdout);
if (r.stderr) process.stderr.write(r.stderr);
process.exit(r.status ?? 1);
