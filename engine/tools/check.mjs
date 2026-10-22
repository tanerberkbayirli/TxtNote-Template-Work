#!/usr/bin/env node
// Deterministic conformance checker driver. See orchestration/motor/CHECKER.md.
//   node engine/tools/check.mjs --target <id> [--fixture <path>] [--word] [--only <ids>|failed]
//        [--out <dir>] [--no-export <pdf> <docx>] [--build-reference] [--official-docx <path>]
// Flow: checks.json -> real export (export.mjs, per fixture variant) -> optional Word render
//       -> conformance.py (PyMuPDF / DOCX XML) -> check-<stamp>.json/.md. Exit 0 only if no FAIL.
import { spawnSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync, appendFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { availableParallelism } from 'node:os';
import { fileHash, acceptanceFingerprint, stableWordEnvironment, sourceFingerprint } from './validationProvenance.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const args = process.argv.slice(2);
const driverStarted = performance.now();

// --all: run every target that has specs/<id>.checks.json (sequentially, other flags passed through),
// print one summary line per target, exit 1 if any target has a FAIL (or errors).
if (args.includes("--all")) {
  const rest = args.filter((a) => a !== "--all");
  const outIndex = rest.indexOf('--out');
  const allOut = outIndex < 0 ? null : rest.splice(outIndex, 2)[1];
  const manifestIndex = rest.indexOf('--manifest');
  const manifestPath = manifestIndex < 0 ? null : resolve(root, rest.splice(manifestIndex, 2)[1]);
  const manifest = { startedAt: new Date().toISOString(), wordRequested: rest.includes('--word'), targets: [] };
  let ids = readdirSync(join(root, "engine/specs")).filter((f) => f.endsWith(".checks.json")).map((f) => f.replace(/\.checks\.json$/, "")).sort();
  const targetIndex = rest.indexOf('--targets');
  if (targetIndex >= 0) {
    const requested = rest.splice(targetIndex, 2)[1]?.split(',') || [];
    if (!requested.length || requested.some(id => !ids.includes(id))) {
      console.error('--targets requires comma-separated registered target IDs'); process.exit(2);
    }
    ids = ids.filter(id => requested.includes(id));
  }
  let bad = 0;
  for (const t of ids) {
    const started = performance.now();
    const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url), "--target", t, ...rest,
      ...(allOut ? ['--out', join(allOut, t)] : [])], { encoding: "utf8", cwd: root });
    const line = (r.stdout || "").split(/\r?\n/).find((l) => l.startsWith(`${t}:`)) || `${t}: ERROR exit ${r.status} ${(r.stderr || r.stdout || "").trim().split(/\r?\n/).pop() || ""}`;
    console.log(line);
    const reportPath = line.match(/ -> (.+)$/)?.[1];
    const report = reportPath && existsSync(resolve(root, reportPath)) ? JSON.parse(readFileSync(resolve(root, reportPath), 'utf8')) : null;
    manifest.targets.push({ target: t, exitCode: r.status, commandSeconds: +( (performance.now() - started) / 1000).toFixed(3),
      report: reportPath || null, counts: report?.counts || {}, measurementSeconds: report?.measurementSeconds ?? null,
      error: report ? null : (r.stderr || r.stdout || '').trim().slice(-1000) });
    if (r.status !== 0) bad++;
  }
  console.log(`--all: ${ids.length} targets, ${bad} with FAIL/error`);
  if (manifestPath) {
    mkdirSync(dirname(manifestPath), { recursive: true });
    writeFileSync(manifestPath, JSON.stringify({ ...manifest, finishedAt: new Date().toISOString(),
      commandSeconds: +((performance.now() - driverStarted) / 1000).toFixed(3) }, null, 2));
  }
  process.exit(bad ? 1 : 0);
}

const opt = { word: false, buildReference: false };
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--target") opt.target = args[++i];
  else if (a === "--fixture") opt.fixture = args[++i];
  else if (a === "--word") opt.word = true;
  else if (a === "--verify-layout-ids") opt.verifyLayoutIds = true;
  else if (a === "--only") opt.only = args[++i];
  else if (a === "--out") opt.out = args[++i];
  else if (a === "--build-reference") opt.buildReference = true;
  else if (a === "--official-docx") opt.officialDocx = args[++i];
  else if (a === "--no-export") { opt.noExport = [args[++i], args[++i]]; }
  else { console.error(`unknown argument ${a}`); process.exit(2); }
}
if (!opt.target) { console.error("usage: check.mjs --target <id> [--fixture f] [--word] [--only ids|failed] [--out dir] [--no-export pdf docx] [--build-reference]"); process.exit(2); }
if (opt.verifyLayoutIds && opt.noExport) {
  console.error('--verify-layout-ids requires two fresh exports; cannot combine with --no-export');
  process.exit(2);
}
const id = opt.target;
const specs = join(root, "engine/specs");
const outDir = resolve(root, opt.out || `.test-tmp/validation/${id}`);
const runDir = join(outDir, "run");
const refDir = join(root, `engine/references/${id}/source/reference`);
const logFile = join(runDir, "check.log");
mkdirSync(runDir, { recursive: true });
const log = (s) => appendFileSync(logFile, s + "\n");
const env = { ...process.env, PYTHONUTF8: "1", PYTHONIOENCODING: "utf-8" };
const revision = spawnSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" });
const codeDiff = spawnSync("git", ["diff", "HEAD", "--", "engine/src", "TxtNote/frontend/src", "engine/tools", "engine/specs"], { cwd: root, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
if (revision.status !== 0 || codeDiff.status !== 0) throw new Error("Cannot record validation source revision");
env.CHECK_SOURCE_PROVENANCE = JSON.stringify({ revision: revision.stdout.trim(),
  trackedDiffSha256: createHash("sha256").update(codeDiff.stdout).digest("hex"),
  diagnosticsSha256: createHash("sha256").update(readFileSync(join(here, "export-diagnostics.mjs"))).digest("hex"),
  startedAt: new Date().toISOString() });
const bundledPython = process.env.USERPROFILE && join(process.env.USERPROFILE, '.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe');
const python = process.env.CHECK_PYTHON || (bundledPython && existsSync(bundledPython) ? bundledPython : 'python');
const environmentProbe = spawnSync('powershell', ['-NoProfile', '-File', join(here, 'validation-environment.ps1')],
  { encoding: 'utf8', timeout: 30000, windowsHide: true });
const environmentPath = join(runDir, 'environment.json');
if (environmentProbe.status !== 0) throw new Error(`Cannot record font/locale environment: ${environmentProbe.stderr}`);
const rendererEnvironment = JSON.parse(environmentProbe.stdout.replace(/^\uFEFF/, ''));
if (!rendererEnvironment.fonts?.length) throw new Error('Font provenance unavailable; acceptance cannot be certified');
writeFileSync(environmentPath, JSON.stringify(rendererEnvironment, null, 2));
env.CHECK_RENDERER_ENVIRONMENT = JSON.stringify({ path: environmentPath, sha256: fileHash(environmentPath) });

function py(argv) {
  const result = spawnSync(python, [join(here, "conformance.py"), ...argv], { encoding: "utf8", env, cwd: root });
  if (result.error) throw new Error(`Conformance Python failed (${python}): ${result.error.message}`);
  return result;
}

// ---------------------------------------------------------------- Word (own instance, PID recorded, timeout)
async function wordToPdf(docx, pdf, refreshed, fieldDump, timeoutMs = Number(process.env.CHECK_WORD_TIMEOUT_MS) || 120000) {
  return new Promise((res) => {
    const ps = spawn("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", join(here, "word2pdf.ps1"), "-In", docx, "-Out", pdf, "-RenderInfo", pdf.replace(/\.pdf$/, ".render.json"), ...(refreshed ? ["-Refreshed", refreshed] : []), ...(fieldDump ? ["-FieldDump", fieldDump] : [])], { cwd: root });
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
    const r = await wordToPdf(docx, wp, null, null);
    if (!r.ok) { console.error(r.reason); process.exit(1); }
    env.CHECK_REFERENCE_RENDER_FRESH = '1';
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
const allVariants = [...new Set(checks.filter(c => c.kind !== "note").map(c => c.params?.fixture || c.fixture || "default"))];
for (const fixture of allVariants) {
  checks.push({ id: `engine-docx-package-${fixture}`, params: { fixture } });
  checks.push({ id: `engine-layout-pdf-${fixture}`, params: { fixture } });
  checks.push({ id: `engine-layout-report-${fixture}`, params: { fixture } });
  if (opt.verifyLayoutIds) checks.push({ id: `engine-layout-ids-${fixture}`, params: { fixture } });
  if (opt.word) for (const kind of ["page_count_match", "page_labels_match"]) checks.push({ id: `engine-${kind}-${fixture}`, params: { fixture } });
  if (opt.word && checks.some(c => c.kind === "line_pitch" && (c.params?.fixture || "default") === fixture)) checks.push({ id: `engine-body-pitch-${fixture}`, params: { fixture } });
}
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
  spawnSync("bash", [join(here, "devserver.sh"), "start"], { stdio: "ignore", cwd: root, timeout: 60000 });
  if (await up("http://127.0.0.1:5175")) return "http://127.0.0.1:5175";
  console.error("TxtNote frontend dev server not reachable (tried :5173 and :5175). Start it: bash engine/tools/devserver.sh start");
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

// settle timeout / unstable pagination: seen once in a while under load (aku-sbe during --all), never reproducible alone; one retry is logged, a deterministic failure fails twice.
const TRANSIENT_EXPORT = /Failed to fetch dynamically imported module|EBUSY|Target page, context or browser has been closed|settle timeout|sayfalaması kararlı hale gelmedi|editor pagination is not exportable/;
const vmap = {};
let base = null;
const exportJobs = [];
for (const v of variants) {
  const prefix = join(runDir, v);
  vmap[v] = { pdf: `${prefix}.pdf`, docx: `${prefix}.docx`, layout: `${prefix}.layout.json`, fixture: fixtureFor(v) };
  if (opt.noExport && v === "default") {
    vmap[v] = { pdf: resolve(root, opt.noExport[0]), docx: resolve(root, opt.noExport[1]), layout: resolve(root, opt.noExport[0]).replace(/\.pdf$/, '.layout.json') };
    continue;
  }
  if (opt.noExport) { vmap[v].pdf = vmap[v].docx = null; vmap[v].note = "--no-export given only for the default variant"; continue; }
  base ??= await ensureBase();
  exportJobs.push({ v, prefix });
  if (opt.verifyLayoutIds) {
    vmap[v].repeatLayout = `${prefix}.repeat.layout.json`;
    exportJobs.push({ v, prefix: `${prefix}.repeat` });
  }
}
async function runExportJob({ v, prefix }) {
  const runExport = () => new Promise((resolveResult) => {
    const child = spawn(process.execPath, [join(here, 'export.mjs'), fixtureFor(v), prefix, base], { env: exportEnv, cwd: root });
    let stdout = '', stderr = '', done = false;
    const finish = result => { if (!done) { done = true; clearTimeout(timer); resolveResult(result); } };
    const timer = setTimeout(() => {
      if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F']);
      else child.kill('SIGTERM');
      finish({ status: 3, stdout, stderr: stderr + '\nExport exceeded 900 s' });
    }, 900000);
    child.stdout.on('data', data => { stdout += data; });
    child.stderr.on('data', data => { stderr += data; });
    child.on('error', error => finish({ status: 3, stdout, stderr: stderr + error.message }));
    child.on('close', status => finish({ status, stdout, stderr }));
  });
  let r = await runExport();
  log(`export ${v}: status ${r.status}\n${(r.stdout || "").slice(-600)}\n${(r.stderr || "").slice(-1500)}`);
  // One retry for transient infrastructure or settling failures. A repeated editor refusal
  // remains an export error; checker FAIL rows are never retried or suppressed.
  if (r.status !== 0 && TRANSIENT_EXPORT.test(r.stderr || "")) {
    log(`export ${v}: transient failure, retrying once`);
    r = await runExport();
    log(`export ${v} (retry): status ${r.status}\n${(r.stdout || "").slice(-600)}\n${(r.stderr || "").slice(-1500)}`);
  }
  if (r.status !== 0) return `export of variant '${v}' failed (see ${logFile}):\n${(r.stderr || r.stdout || '').trim().slice(-400)}`;
  return null;
}
// Independent browser profiles and output prefixes; Word rendering below stays serialized.
const defaultJobs = opt.word ? 1 : Math.max(1, Math.min(5, availableParallelism() - 1));
const requestedJobs = Number(process.env.CHECK_EXPORT_JOBS || defaultJobs);
const jobCount = Number.isInteger(requestedJobs) ? Math.max(1, Math.min(5, requestedJobs)) : 1;
let nextJob = 0;
const exportErrors = [];
await Promise.all(Array.from({ length: Math.min(jobCount, exportJobs.length) }, async () => {
  while (nextJob < exportJobs.length) {
    const error = await runExportJob(exportJobs[nextJob++]);
    if (error) exportErrors.push(error);
  }
}));
if (exportErrors.length) { console.error(exportErrors.join('\n')); process.exit(3); }

// ---------------------------------------------------------------- Word render
// The field-refresh render (second Word export after updating all fields) is made only for targets whose checks use it.
const wantsRefresh = /fields_refresh_match|fields_cached_match|word-refreshed/.test(readFileSync(checksPath, "utf8"));
for (const v of variants) {
  if (!opt.word) { vmap[v].wordNote = "Word render not requested (run with --word)"; continue; }
  if (!vmap[v].docx || !existsSync(vmap[v].docx)) { vmap[v].wordNote = "no DOCX to render"; continue; }
  const wp = vmap[v].docx.replace(/\.docx$/, ".word.pdf");
  const rp = wantsRefresh ? wp.replace(/\.word\.pdf$/, ".word-refreshed.pdf") : null;
  const fd = rp ? wp.replace(/\.word\.pdf$/, ".word-fields.json") : null;
  const r = await wordToPdf(vmap[v].docx, wp, rp, fd);
  log(`word ${v}: ${JSON.stringify(r)}`);
  if (r.ok) {
    vmap[v].wordPdf = wp;
    const renderInfo = wp.replace(/\.pdf$/, ".render.json");
    if (existsSync(renderInfo)) {
      vmap[v].wordRenderInfoPath = renderInfo;
      vmap[v].wordRenderInfo = JSON.parse(readFileSync(renderInfo, "utf8").replace(/^\uFEFF/, ""));
    }
    if (rp && existsSync(rp)) { vmap[v].wordRefreshedPdf = rp; if (fd && existsSync(fd)) vmap[v].wordFieldDump = fd; }
    else if (rp) vmap[v].wordRefreshNote = "Word field-refresh export missing";
  } else vmap[v].wordNote = r.reason;
}

// ---------------------------------------------------------------- evaluate
const sourceProvenance = JSON.parse(env.CHECK_SOURCE_PROVENANCE);
const officialSourceFingerprint = sourceFingerprint(root, id);
const sourceFiles = spawnSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '--', 'engine/src', 'TxtNote/frontend/src', 'engine/tools'],
  { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
if (sourceFiles.status !== 0) throw new Error('Cannot fingerprint current code files');
const codeHash = createHash('sha256');
for (const file of [...new Set(sourceFiles.stdout.trim().split(/\r?\n/))].sort()) {
  if (!/\.(m?js|jsx|ts|py|ps1)$/.test(file) || !existsSync(join(root, file))) continue;
  codeHash.update(file).update(fileHash(join(root, file)));
}
const codeFingerprint = codeHash.digest('hex');
env.CHECK_SOURCE_PROVENANCE = JSON.stringify({ ...sourceProvenance, codeFingerprint, officialSourceFingerprint });
for (const [variant, paths] of Object.entries(vmap)) {
  if (!paths.layout || !existsSync(paths.layout) || !paths.fixture) continue;
  const snapshot = JSON.parse(readFileSync(paths.layout, 'utf8'));
  paths.acceptanceFingerprint = acceptanceFingerprint({
    source: officialSourceFingerprint, checks: fileHash(checksPath), fixture: fileHash(paths.fixture),
    code: codeFingerprint,
    renderer: JSON.stringify({ chromium: snapshot.chromium, word: stableWordEnvironment(paths.wordRenderInfo) }),
    environment: fileHash(environmentPath),
  });
}
const a = ["run", "--target", id, "--checks", checksPath, "--variants", JSON.stringify(vmap), "--reference", refDir, "--out", outDir];
env.CHECK_DRIVER_ELAPSED_SECONDS = String((performance.now() - driverStarted) / 1000);
env.CHECK_EXPORT_MODE = opt.noExport ? 'existing-artifacts' : 'fresh';
if (only) a.push("--only", only);
if (opt.word) a.push("--word-requested");
const r = py(a);
process.stdout.write(r.stdout);
if (r.stderr) process.stderr.write(r.stderr);
process.exit(r.status ?? 1);
