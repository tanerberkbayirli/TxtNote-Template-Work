// Golden comparison for refactors that must not change output (no Word needed).
//
// usage: node engine/tools/golden.mjs --save <dir> [--templates id,id|all] [--copies 1]
//        node engine/tools/golden.mjs --compare <dir> --out <dir> [--templates id,id|all] [--copies 1] [--tolerance-mm 0.05]
//
// Per template: make-fixture -> repeat body -> real editor export (export.mjs). Saved per template: every text run of the
// editor's layout report (page, text, x, baseline in mm) and the DOCX parts that carry layout (document.xml, styles.xml,
// numbering.xml, footnotes.xml). --compare exports again and reports, per template: page count, runs whose position moved
// more than --tolerance-mm, runs that appeared/disappeared, and which DOCX parts differ (with the first differing offset).
// Exit 1 when anything differs. Needs the frontend dev server (as export.mjs).
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { unzipSync, strFromU8 } from "fflate";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const args = process.argv.slice(2);
const value = (name, fallback) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : fallback; };
const saveDir = value("save", null), compareDir = value("compare", null);
if (!saveDir === !compareDir) { console.error("give exactly one of --save <dir> or --compare <dir>"); process.exit(2); }
const copies = Number(value("copies", "1"));
const toleranceMm = Number(value("tolerance-mm", "0.05"));
const { THESIS_TEMPLATE_REGISTRY } = await import(new URL("../src/registry.js", import.meta.url).href);
const requested = value("templates", "all");
const templates = requested === "all" ? THESIS_TEMPLATE_REGISTRY.map((entry) => entry.id) : requested.split(",").filter(Boolean);
const workDir = resolve(root, compareDir ? value("out", `.test-tmp/validation/golden-compare`) : saveDir);
mkdirSync(workDir, { recursive: true });

const chrome = process.env.THESIS_BROWSER_EXECUTABLE || ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"].find(existsSync);
const env = { ...process.env, PLAYWRIGHT_MODULE: process.env.PLAYWRIGHT_MODULE || join(here, "node_modules/playwright"), ...(chrome ? { THESIS_BROWSER_EXECUTABLE: chrome } : {}) };
const base = process.env.THESIS_BASE_URL || "http://127.0.0.1:5175";
const DOCX_PARTS = ["word/document.xml", "word/styles.xml", "word/numbering.xml", "word/footnotes.xml"];

function run(command, commandArgs) {
  return new Promise((done) => {
    const child = spawn(command, commandArgs, { env, cwd: root });
    let output = "";
    child.stdout.on("data", (data) => { output += data; });
    child.stderr.on("data", (data) => { output += data; });
    child.on("close", (status) => done({ status, output }));
  });
}

async function capture(id, dir) {
  mkdirSync(dir, { recursive: true });
  const baseFixture = join(dir, "base.fixture.json");
  const made = spawnSync(process.execPath, [join(here, "make-fixture.mjs"), id, baseFixture], { cwd: root, encoding: "utf8" });
  if (made.status !== 0) throw new Error(`make-fixture failed: ${(made.stderr || made.stdout).slice(-200)}`);
  const fixture = JSON.parse(readFileSync(baseFixture, "utf8"));
  const parts = [fixture.content];
  for (let copy = 1; copy < copies; copy += 1) parts.push(fixture.content.replace(/data-fn-id="([^"]+)"/g, `data-fn-id="$1_r${copy}"`));
  writeFileSync(join(dir, "fixture.json"), JSON.stringify({ ...fixture, content: parts.join("") }));
  const prefix = join(dir, "export");
  let exported = await run(process.execPath, [join(here, "export.mjs"), join(dir, "fixture.json"), prefix, base]);
  if (exported.status !== 0) exported = await run(process.execPath, [join(here, "export.mjs"), join(dir, "fixture.json"), prefix, base]);
  if (exported.status !== 0) throw new Error(`export failed: ${exported.output.slice(-300)}`);
  const layout = JSON.parse(readFileSync(`${prefix}.layout.json`, "utf8")).engineLayout;
  const runs = [];
  for (const page of layout.pages) for (const op of page.textOps || []) runs.push([page.page, op.text, round(op.xMm), round(op.baselineMm ?? op.yMm)]);
  const zip = unzipSync(new Uint8Array(readFileSync(`${prefix}.docx`)));
  const docx = Object.fromEntries(DOCX_PARTS.filter((name) => zip[name]).map((name) => [name, strFromU8(zip[name])]));
  const snapshot = { id, pages: layout.pages.length, runs, docx };
  writeFileSync(join(dir, "snapshot.json"), JSON.stringify(snapshot));
  return snapshot;
}
const round = (value) => Math.round(value * 1000) / 1000;

function compare(before, after) {
  const key = (r) => `${r[0]}|${r[1]}`;
  const index = (runs) => { const map = new Map(); for (const r of runs) { const k = key(r); if (!map.has(k)) map.set(k, []); map.get(k).push(r); } return map; };
  const a = index(before.runs), b = index(after.runs);
  let moved = 0, maxMm = 0, missing = 0, added = 0;
  const samples = [];
  for (const [k, list] of a) {
    const other = b.get(k) || [];
    for (let i = 0; i < list.length; i += 1) {
      if (!other[i]) { missing += 1; if (samples.length < 6) samples.push(`missing p${list[i][0]} '${list[i][1].slice(0, 24)}'`); continue; }
      const d = Math.max(Math.abs(list[i][2] - other[i][2]), Math.abs(list[i][3] - other[i][3]));
      maxMm = Math.max(maxMm, d);
      if (d > toleranceMm) { moved += 1; if (samples.length < 6) samples.push(`moved p${list[i][0]} '${list[i][1].slice(0, 24)}' dx=${round(other[i][2] - list[i][2])} dy=${round(other[i][3] - list[i][3])}`); }
    }
  }
  for (const [k, list] of b) added += Math.max(0, list.length - (a.get(k) || []).length);
  const docx = [];
  for (const name of DOCX_PARTS) {
    const x = before.docx[name] ?? "", y = after.docx[name] ?? "";
    if (x === y) continue;
    let i = 0;
    while (i < x.length && x[i] === y[i]) i += 1;
    docx.push({ part: name, at: i, before: x.slice(Math.max(0, i - 60), i + 80), after: y.slice(Math.max(0, i - 60), i + 80) });
  }
  const same = before.pages === after.pages && !moved && !missing && !added && !docx.length;
  return { same, pages: [before.pages, after.pages], moved, maxMovedMm: round(maxMm), missing, added, docx, samples };
}

const report = {};
for (const id of templates) {
  try {
    if (saveDir) { const s = await capture(id, join(workDir, id)); report[id] = { saved: true, pages: s.pages, runs: s.runs.length }; }
    else {
      const before = JSON.parse(readFileSync(join(resolve(root, compareDir), id, "snapshot.json"), "utf8"));
      const after = await capture(id, join(workDir, id));
      report[id] = compare(before, after);
    }
  } catch (error) { report[id] = { error: String(error.message || error).slice(0, 300) }; }
  const r = report[id];
  console.log(`${id}: ${r.error ? `ERROR ${r.error}` : r.saved ? `saved (${r.pages} pages, ${r.runs} runs)` : r.same ? "IDENTICAL" : `DIFF pages ${r.pages.join("/")} moved ${r.moved} (max ${r.maxMovedMm} mm) missing ${r.missing} added ${r.added} docx ${r.docx.map((d) => d.part).join(",") || "-"}${r.samples.length ? ` | ${r.samples.slice(0, 2).join(" ; ")}` : ""}`}`);
}
writeFileSync(join(workDir, "golden-report.json"), JSON.stringify(report, null, 1));
process.exit(Object.values(report).some((r) => r.error || (r.same === false)) ? 1 : 0);
