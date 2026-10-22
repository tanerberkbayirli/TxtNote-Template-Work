// Real TxtNote export harness.
//
// Loads the thesis editor fixture (TxtNote/frontend/tests/thesis.html → the real
// ThesisEditor component) with a deterministic document seeded into its storage,
// waits until the editor's own pagination / index / footnote loop is stable, then
// presses the editor's own "PDF" and "Word" buttons and saves the downloads.
// Nothing here builds a PDF itself: the files are exactly what a user gets.
//
// Usage: node engine/tools/export.mjs <fixture.json> <outPrefix> [baseUrl]
//   fixture.json = { title, content, researchData: { thesis: {...} } }
//   writes <outPrefix>.pdf, <outPrefix>.docx, <outPrefix>.layout.json
//
// Requires: vite dev server of TxtNote/frontend (default http://127.0.0.1:5175),
// Chromium with CSS multicol column-wrap (Blink feature MulticolColumnWrapping) and
// the local-fonts permission, so the browser export embeds the installed system fonts.
import { createRequire } from "node:module";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { paginationDiagnostics, blockGapDiagnostics } from "./export-diagnostics.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "/opt/node22/lib/node_modules/playwright");

const [fixturePath, outPrefixArg, baseUrl = "http://127.0.0.1:5175"] = process.argv.slice(2);
if (!fixturePath || !outPrefixArg) { console.error("usage: export.mjs <fixture.json> <outPrefix> [baseUrl]"); process.exit(2); }
const outPrefix = resolve(outPrefixArg);
const exportStarted = performance.now();
let stageStarted = exportStarted;
const timings = {};
const recordStage = name => {
  const now = performance.now();
  timings[name] = +((now - stageStarted) / 1000).toFixed(3);
  stageStarted = now;
};
await mkdir(dirname(outPrefix), { recursive: true });
const doc = JSON.parse(await readFile(fixturePath, "utf8"));
const KEY = "txtnote-thesis-regression";
// Another fixture page (e.g. /tests/thesis-batchb.html, which seeds a custom template) may be named here.
const fixturePage = process.env.THESIS_FIXTURE_PAGE || (doc.__template ? '/tests/thesis-batchb.html' : "/tests/thesis.html");

const browser = await chromium.launch({
  ...(process.env.THESIS_BROWSER_EXECUTABLE ? { executablePath: process.env.THESIS_BROWSER_EXECUTABLE } : {}),
  args: ["--enable-blink-features=MulticolColumnWrapping", "--font-render-hinting=none"],
});
const context = await browser.newContext({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 1, acceptDownloads: true });
await context.grantPermissions(["local-fonts"], { origin: new URL(baseUrl).origin });
const page = await context.newPage();
// Optional acceptance stress condition; production editor behavior is unchanged.
if (process.env.EXPORT_CPU_THROTTLE) {
  const rate = Number(process.env.EXPORT_CPU_THROTTLE);
  if (!Number.isFinite(rate) || rate < 1) throw new Error('EXPORT_CPU_THROTTLE must be a finite number >= 1');
  const session = await context.newCDPSession(page);
  await session.send('Emulation.setCPUThrottlingRate', { rate });
  console.log(`CPU throttling: ${rate}x`);
}
recordStage('browser');
const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (e) => { if (e.type() === "error" || /content security policy|refused to|uncaught/i.test(e.text())) errors.push(`console: ${e.text()}`); });

async function settle() {
  await page.waitForFunction(() => {
    const root = document.querySelector('[aria-label="Belge sayfaları"]');
    return ["true", "fallback"].includes(root?.getAttribute("data-thesis-pagination-ready"))
      || document.body.innerText.includes("Dizin sayfa eşlemesi tamamlanmadı")
      || document.body.innerText.includes("sayfa numarası hesaplanamadı")
      || document.body.innerText.includes("sayfalaması kararlı hale gelmedi");
  }, undefined, { timeout: 120000 }).catch(async (error) => {
    // Diagnose the stall: is the frame loop alive, is the page visible, what do the pagination attributes say?
    const info = await paginationDiagnostics(page);
    throw new Error(`settle timeout (120 s): ${JSON.stringify(info)}; ${String(error.message).split(/\r?\n/)[0]}`);
  });
  return page.evaluate(() => {
    const root = document.querySelector('[aria-label="Belge sayfaları"]');
    const pageMap = JSON.parse(root?.getAttribute("data-thesis-pagination-map") || "{}");
    const targets = JSON.parse(root?.getAttribute("data-thesis-pagination-targets") || "[]");
    const missingTargets = targets.filter((target) => !Object.hasOwn(pageMap, target));
    const mismatchedLabels = [...document.querySelectorAll("[data-thesis-generated] li[data-index-target]")].flatMap((row) => {
      const pageNode = row.querySelector(".thesis-index-page");
      if (!pageNode) return [];
      const target = row.dataset.indexTarget;
      const expected = pageMap[target]?.indexLabel ?? pageMap[target]?.label ?? "";
      const actual = pageNode.textContent.trim();
      return actual === expected ? [] : [{ target, expected, actual }];
    });
    return {
      pagedLayout: Boolean(document.querySelector('.thesis-paper[data-thesis-layout="paged"]')),
      paginationReady: root?.getAttribute("data-thesis-pagination-ready") || "missing",
      pageMap,
      targets,
      missingTargets,
      mismatchedLabels,
      sheets: [...document.querySelectorAll(".thesis-sheet")].map((s) => ({ label: s.dataset.thesisPageLabel || "", group: s.dataset.thesisPageGroup || s.dataset.thesisGroup || "" })),
      warn: document.body.innerText.includes("sayfalaması kararlı hale gelmedi") || document.body.innerText.includes("Dizin sayfa eşlemesi tamamlanmadı") || document.body.innerText.includes("sayfa numarası hesaplanamadı"),
    };
  });
}

try {
  // Seed before the first render; loading an unseeded editor and reloading it doubles
  // pagination/font work and can momentarily render the wrong template.
  // Init scripts also run in opaque-origin subframes (e.g. a PDF/blank preview),
  // where touching localStorage throws. Seed only the actual fixture origin.
  await context.addInitScript(([key, value, origin]) => { if (location.origin !== origin) return; localStorage.clear(); localStorage.setItem(key, value); }, [KEY, JSON.stringify(doc), new URL(baseUrl).origin]);
  await page.goto(`${baseUrl}${fixturePage}`);
  await page.locator(".thesis-sheet").first().waitFor({ timeout: 60000 });
  await page.waitForFunction((id) => document.querySelector('[aria-label="Belge sayfaları"]')?.getAttribute('data-thesis-template-id') === id,
    doc.researchData?.thesis?.templateId, { timeout: 60000 });
  const zoom = page.getByLabel("Yakınlaştır", { exact: true });
  if (await zoom.count()) await zoom.selectOption("100");
  await page.evaluate(() => document.fonts.ready);
  recordStage('editor');
  let state;
  const assertExportable = (phase) => {
    if (state.warn || state.paginationReady !== "true" || state.missingTargets.length || state.mismatchedLabels.length) {
      throw new Error(`${phase}: editor pagination is not exportable: ready=${state.paginationReady}, missing=${state.missingTargets.length}, mismatched=${state.mismatchedLabels.length}, warning=${state.warn}`);
    }
  };
  const readLayout = () => page.evaluate(() => ({
    pagedLayout: Boolean(document.querySelector('.thesis-paper[data-thesis-layout="paged"]')),
    sheets: [...document.querySelectorAll(".thesis-sheet")].map((s) => ({ label: s.dataset.thesisPageLabel || "", group: s.dataset.thesisPageGroup || s.dataset.thesisGroup || "" })),
    templateNotice: document.body.innerText.match(/Şablon yüklenemedi[^\n]*|kayıtlı tez şablonu bulunamadı[^\n]*/)?.[0] || "",
    validation: [...document.querySelectorAll("[data-thesis-validation], .thesis-validation")].map((n) => n.textContent),
  }));
  const exportSnapshots = [];
  let engineLayout = null;
  let interactionBaseline;
  if (process.env.EXPORT_EDIT_LATENCY === '1') {
    await settle();
    const editor = page.locator('.rich-text-body[contenteditable="true"]').first();
    const before = await editor.innerHTML();
    await editor.click();
    await page.keyboard.press('Control+End');
    const samples = [];
    for (let sample = 0; sample < 10; sample++) {
      for (const insert of [true, false]) {
        await editor.evaluate(element => {
          window.__txtnoteInputPaint = new Promise(resolve => element.addEventListener('input', () => {
            const started = performance.now();
            requestAnimationFrame(() => requestAnimationFrame(() => resolve(performance.now() - started)));
          }, { once: true }));
        });
        if (insert) await page.keyboard.insertText('x');
        else await page.keyboard.press('Backspace');
        samples.push(await page.evaluate(() => window.__txtnoteInputPaint));
      }
    }
    if (await editor.innerHTML() !== before) throw new Error('Interaction probe changed editor content/formatting');
    await settle();
    const ordered = [...samples].sort((a, b) => a - b);
    interactionBaseline = { metric: 'input event to second animation frame (ms)', samples,
      count: samples.length, medianMs: ordered[Math.floor(ordered.length / 2)],
      p95Ms: ordered[Math.ceil(ordered.length * .95) - 1], contentPreserved: true,
      limitations: 'One editable field; does not measure full pagination convergence or IME/caret correctness.' };
    recordStage('interaction-probe');
  }
  for (const [button, extension] of [["PDF", "pdf"], ["Word", "docx"]]) {
    await page.getByRole("tab", { name: "Dosya", exact: true }).click();
    // Each export may invalidate the editor's final page/index measurement.
    // Re-settle immediately before every UI action and refuse the export unless
    // the live editor still confirms the complete target map.
    state = await settle();
    assertExportable(`${button} export`);
    const layout = await readLayout();
    if (!layout.pagedLayout) throw new Error(`${button} export: paged layout is not active; refusing a fallback export`);
    if (layout.templateNotice) throw new Error(`${button} export: template fallback: ${layout.templateNotice}`);
    exportSnapshots.push({ button, ...layout, pagination: {
      ready: state.paginationReady,
      targetCount: state.targets.length,
      missingTargets: state.missingTargets,
      mismatchedLabels: state.mismatchedLabels,
      targets: state.targets.map((target) => ({ target, label: state.pageMap[target]?.indexLabel ?? state.pageMap[target]?.label ?? "" })),
    } });
    recordStage(`${extension}.settle`);
    const event = page.waitForEvent("download", { timeout: 240000 });
    const messageBefore = await page.evaluate(() => document.querySelector('.thesis-ribbon-message[role="status"]')?.textContent?.trim() || '');
    await page.getByRole("button", { name: button, exact: true }).click();
    // The editor reports a failed export as a message instead of a download.
    const failure = page.waitForFunction((before) => {
      const busy = [...document.querySelectorAll("button")].some((b) => b.textContent.includes("Hazırlanıyor…"));
      const message = document.querySelector('.thesis-ribbon-message[role="status"]')?.textContent?.trim();
      return !busy && message && message !== before && !/indirildi|Kaydedildi/.test(message) ? message : false;
    }, messageBefore, { timeout: 240000, polling: 500 }).then((handle) => handle.jsonValue());
    const outcome = await Promise.race([event.then((download) => ({ download })), failure.then((message) => ({ message }))]);
    if (!outcome.download) {
      const diagnostics = await paginationDiagnostics(page);
      throw new Error(`${button} export failed in the editor: ${outcome.message}; ${JSON.stringify(diagnostics)}`);
    }
    await outcome.download.saveAs(`${outPrefix}.${extension}`);
    if (extension === 'pdf') {
      engineLayout = await page.evaluate(() => document.querySelector('[aria-label="Belge sayfaları"]')?.__thesisLayoutReport || null);
      if (!engineLayout?.pages?.length) throw new Error('PDF export did not supply its engine layout report');
    }
    recordStage(extension);
  }
  // PDF can cause another pagination/index update. Verify it settled after the
  // final export too, and save this live final state in the layout evidence.
  state = await settle();
  assertExportable("post-export verification");
  const layout = await readLayout();
  const exportFingerprint = (snapshot) => JSON.stringify({ sheets: snapshot.sheets, targets: snapshot.pagination.targets });
  if (exportFingerprint(exportSnapshots[0]) !== exportFingerprint(exportSnapshots[1])) {
    throw new Error("PDF and Word exports were preceded by different page/index mappings; refusing to report them as a matched pair");
  }
  const blockGaps = process.env.EXPORT_DEBUG_BLOCK_GAPS ? await blockGapDiagnostics(page, process.env.EXPORT_DEBUG_BLOCK_GAPS) : undefined;
  const paginationDebug = process.env.EXPORT_DEBUG_PAGINATION ? await paginationDiagnostics(page) : undefined;
  recordStage('final-settle');
  timings.totalSeconds = +((performance.now() - exportStarted) / 1000).toFixed(3);
  await writeFile(`${outPrefix}.layout.json`, JSON.stringify({ fixture: fixturePath, exportedAt: new Date().toISOString(), chromium: browser.version(), interactionBaseline, ...layout, warn: state.warn, ...(blockGaps ? { blockGaps } : {}),
    ...(paginationDebug ? { paginationDebug } : {}), engineLayout, timings, pagination: { ready: state.paginationReady, targetCount: state.targets.length, missingTargets: state.missingTargets, mismatchedLabels: state.mismatchedLabels,
      targets: state.targets.map((target) => ({ target, label: state.pageMap[target]?.indexLabel ?? state.pageMap[target]?.label ?? "" })) }, exportSnapshots, errors }, null, 2));
  if (state.paginationReady !== "true") throw new Error(`paged export readiness unavailable: ${state.paginationReady}`);
  if (!state.pagedLayout) throw new Error("paged layout not active: PDF would come from the fallback writer");
  if (state.missingTargets.length || state.mismatchedLabels.length) throw new Error(`generated index verification failed: missing=${state.missingTargets.length}, mismatched=${state.mismatchedLabels.length}`);
  if (layout.templateNotice) throw new Error(`template fallback: ${layout.templateNotice}`);
  if (errors.length) throw new Error(errors.join("\n"));
  console.log(`exported ${outPrefix}.{pdf,docx} (${state.sheets.length} sheets; ${state.targets.length} generated page targets verified)`);
} catch (error) {
  await page.screenshot({ path: `${outPrefix}.failure.png`, fullPage: false }).catch(() => {});
  console.error(error?.stack || error);
  if (errors.length) console.error(errors.join('\n'));
  process.exitCode = 1;
} finally {
  await browser.close();
}
