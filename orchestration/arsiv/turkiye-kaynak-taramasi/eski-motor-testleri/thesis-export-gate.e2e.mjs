// Produce real exports of a template through the editor for the PASS gate (scripts/pass-gate.py).
//   PLAYWRIGHT_MODULE=<playwright> node tests/thesis-export-gate.e2e.mjs <templateId> <outDir> [baseUrl]
// Opens tests/thesis-editable.html?template=<id> with a deterministic multi-page document
// (headings, paragraphs, a figure and a table with captions, metadata) and downloads the
// DOCX and the layout PDF into <outDir>, plus the editor's own page measurements as JSON.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const [templateId, outDir, base = "http://localhost:5173"] = process.argv.slice(2);
if (!templateId || !outDir) { console.error("kullanım: thesis-export-gate.e2e.mjs <templateId> <outDir> [baseUrl]"); process.exit(2); }
const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}) });
// local-fonts lets the PDF writer read the machine's Times New Roman / Arial like the desktop app does; without it the gate records the bundled face as LIMIT.
const context = await browser.newContext({ viewport: { width: 1400, height: 1000 }, acceptDownloads: true, permissions: ["local-fonts"] });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
const lorem = "Bu paragraf, dışa aktarım kapısının satır aralığını, kenar boşluklarını ve iki yana yaslamayı ölçebilmesi için yeterince uzun tutulmuştur; cümleler sayfanın sağ kenarına kadar akar ve böylece metin bloğunun gerçek genişliği ölçülebilir. ";
const paragraph = (n) => `<p>${lorem.repeat(n)}</p>`;
const main = [
  "<h1>Giriş</h1>", paragraph(4), paragraph(5), paragraph(4),
  "<h2>Amaç ve Kapsam</h2>", paragraph(5), paragraph(4),
  `<figure class="academic-figure fmt-align-center" data-kind="figure" contenteditable="false"><img src="${PNG}" width="240" height="120" alt=""><figcaption>Ölçüm için örnek şekil yazısı</figcaption></figure>`,
  paragraph(5),
  "<table><caption>Ölçüm için örnek tablo yazısı</caption><tbody><tr><th>Değişken</th><th>Değer</th></tr><tr><td>A</td><td>1</td></tr><tr><td>B</td><td>2</td></tr></tbody></table>",
  paragraph(5), paragraph(5), paragraph(5), paragraph(5), paragraph(5),
  "<h1>Yöntem</h1>", paragraph(5), paragraph(5), paragraph(5), paragraph(5),
].join("");
const key = `txtnote-thesis-editable:${templateId}`;
const doc = { title: "Dışa Aktarım Kapısı Test Tezi", content: main, researchData: { thesis: { templateId, templateVersion: "1.0.0", selection: {}, values: { YEAR: "2026", STUDENT_NAME: "Ayşe Yılmaz", ADVISOR_NAME: "Prof. Dr. Ali Veli", CITY: "Afyonkarahisar", DEPARTMENT_NAME: "Moleküler Biyoloji ve Genetik", KEYWORDS: "ölçüm, kapı, şablon, tez", KEYWORDS_EN: "measurement, gate, template, thesis" }, sectionContent: { abstract: `<p>${lorem.repeat(3)}</p>`, "english-abstract": `<p>${lorem.repeat(3)}</p>`, bibliography: "<p>Yazar, A. (2026). Örnek kaynak. Yayınevi.</p>" }, enabledSections: [] } } };
try {
  await mkdir(outDir, { recursive: true });
  await page.goto(`${base}/tests/thesis-editable.html?template=${encodeURIComponent(templateId)}`, { waitUntil: "networkidle" });
  await page.waitForSelector(".thesis-paper", { timeout: 60000 });
  await page.waitForTimeout(1500);
  await page.evaluate(([k, d]) => localStorage.setItem(k, JSON.stringify(d)), [key, doc]);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector('[data-thesis-flow-section="main-content"] .rich-text-body[contenteditable="true"], [data-thesis-flow-section="main"] .rich-text-body[contenteditable="true"]', { timeout: 60000 });
  await page.getByLabel("Yakınlaştır", { exact: true }).selectOption("100");
  await page.waitForTimeout(2500); // index/footnote layout passes settle
  const measured = await page.evaluate(() => {
    const pxPerMm = 96 / 25.4;
    const papers = [...document.querySelectorAll(".thesis-paper")].map((paper) => {
      const style = getComputedStyle(paper);
      const body = paper.querySelector(".thesis-body");
      const bodyStyle = body ? getComputedStyle(body) : null;
      return { section: paper.getAttribute("data-thesis-section"), pages: Number(paper.getAttribute("data-thesis-page-count") || 0), marginsMm: [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft].map((v) => +(parseFloat(v) / pxPerMm).toFixed(2)), widthMm: +(parseFloat(style.width) / pxPerMm).toFixed(2), font: bodyStyle?.fontFamily, fontSizePt: bodyStyle ? +(parseFloat(bodyStyle.fontSize) * 0.75).toFixed(2) : null, lineHeightPt: bodyStyle ? +(parseFloat(bodyStyle.lineHeight) * 0.75).toFixed(2) : null, align: bodyStyle?.textAlign };
    });
    return { papers, totalPages: Number(document.querySelector("[data-thesis-total-pages]")?.getAttribute("data-thesis-total-pages") || 0) };
  });
  await writeFile(path.join(outDir, "editor-measurements.json"), JSON.stringify(measured, null, 1));
  const audit = await page.getByRole("button", { name: /^Denetim/ }).getAttribute("aria-label");
  // The finding codes behind the counts, for the gate report (panel opened and closed again).
  await page.getByRole("button", { name: /^Denetim:/ }).click();
  const auditCodes = await page.evaluate(() => [...document.querySelectorAll("[data-thesis-audit-code]")].map((li) => `${li.getAttribute("data-thesis-audit-severity")}:${li.getAttribute("data-thesis-audit-code")}:${li.textContent.trim().slice(0, 120)}`));
  await page.getByRole("button", { name: "Denetimi kapat" }).click();
  for (const kind of ["docx", "pdf"]) {
    const [download] = await Promise.all([page.waitForEvent("download", { timeout: 120000 }), page.getByRole("button", { name: kind === "docx" ? "Word" : "PDF" }).click()]);
    await download.saveAs(path.join(outDir, `export.${kind}`));
    await page.waitForTimeout(500);
  }
  await writeFile(path.join(outDir, "export-meta.json"), JSON.stringify({ templateId, audit, auditCodes, pageErrors: errors, generatedAt: new Date().toISOString() }, null, 1));
  assert.deepEqual(errors, [], "no page errors");
  console.log(`exports → ${outDir} (${measured.totalPages} sayfa; ${audit})`);
} catch (error) {
  console.error(error);
  console.error("page errors:", errors);
  process.exitCode = 1;
} finally {
  await browser.close();
}
