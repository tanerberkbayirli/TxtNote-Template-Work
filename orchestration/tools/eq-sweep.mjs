// Real-browser regression sweep for the block-equation gap (aku-fbe guide 2.10).
//
// usage: node orchestration/tools/eq-sweep.mjs [registryId] [outDir]     (needs the dev server, see devserver.sh)
//
// Builds one document whose chapters put a numbered one-line block equation at many different vertical positions
// (k = 0..N one- or two-line paragraphs before it, then a paragraph, a second equation directly after the first, a
// paragraph), exports it with the editor's own PDF button (export.mjs) and measures the baselines (pdfmeasure.py):
//   previous baseline -> equation baseline and equation baseline -> next baseline must be one blank 1.5 line + the line
//   (14.6 mm = 41.4 pt, +-0.2 pt) at EVERY position, and one equation must sit exactly 14.6 mm above the next.
// Exit code 1 lists the positions that deviate.
import { writeFile, mkdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(new URL("../..", import.meta.url).pathname);
const [registryId = "aku-fbe-master-tr-v1", outDir = "/tmp/eq-sweep"] = process.argv.slice(2);
await mkdir(outDir, { recursive: true });
const CHAPTERS = Number(process.env.EQ_SWEEP_CHAPTERS || 26);
const SHORT = (c, j) => `<p>Paragraf ${c}.${j} kısa.</p>`;
const LONG = (c, j) => `<p>Paragraf ${c}.${j} ilk satırda başlar ve ikinci satıra taşacak kadar uzun tutulmuştur; böylece denklemin sayfadaki dikey konumu satır satır değişir, iki satırlık paragraflar da konumu kaydırır.</p>`;
const eq = (n) => `<span class="math-formula math-formula--block" data-display="block" data-latex="x_{${n}} = y + ${n}" data-eq-numbered="true">(x = y)</span>`;
let content = "";
for (let c = 0; c < CHAPTERS; c += 1) {
  content += `<h1>Bölüm ${c + 1}</h1>`;
  for (let j = 0; j < c; j += 1) content += (c + j) % 3 === 0 ? LONG(c, j) : SHORT(c, j);
  content += eq(c * 2 + 1) + `<p>Denklemden sonra gelen paragraf ${c}.</p>` + eq(c * 2 + 2) + eq(c * 2 + 3) + `<p>Son paragraf ${c}.</p>`;
}
await writeFile(`${outDir}/content.json`, JSON.stringify({ title: "Denklem Süpürmesi", content }));
const fixture = `${outDir}/fixture.json`;
execFileSync("node", [`${root}/orchestration/tools/make-fixture.mjs`, registryId, fixture, `${outDir}/content.json`], { stdio: "inherit" });
execFileSync("node", [`${root}/orchestration/tools/export.mjs`, fixture, `${outDir}/sweep`], { stdio: "inherit", timeout: 900000 });
try { execFileSync("python3", [`${root}/orchestration/tools/eq-sweep-measure.py`, `${outDir}/sweep.pdf`], { stdio: "inherit" }); }
catch { process.exit(1); }
