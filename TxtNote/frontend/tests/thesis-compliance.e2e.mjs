// Template compliance panel in a real browser: findings for body marks, seeded-page edits and
// missing metadata; jumping to the section; the all-clear state.
// Run against Vite: PLAYWRIGHT_MODULE=<installed playwright path> node tests/thesis-compliance.e2e.mjs [baseUrl]
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}) });
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const base = process.argv[2] || "http://localhost:5173";
const pass = (message) => console.log(`PASS ${message}`);
const KEY = "txtnote-thesis-editable";
const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
const codes = async () => page.locator("[data-thesis-audit-list] li").evaluateAll((items) => items.map((li) => li.getAttribute("data-thesis-audit-code")));
const ready = async () => page.waitForSelector('[data-thesis-flow-section="cover"] .rich-text-body[contenteditable="true"]', { timeout: 60000 });
try {
  await page.goto(`${base}/tests/thesis-editable.html`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-thesis-flow-section="cover"]', { timeout: 60000 });
  await page.waitForTimeout(1500);

  // 1. A document with body marks that depart from the template, a pseudo heading and a caption-less figure.
  const main = `<h1>Giriş</h1><p class="fmt-align-center"><span class="fmt-pt-10">Ortalı ve küçük paragraf</span></p><p><span class="fmt-size-heading">Sahte başlık</span></p><p>Normal paragraf.</p><figure class="academic-figure fmt-align-center" data-kind="image" contenteditable="false"><img src="${PNG}" width="40" height="40" alt=""></figure>`;
  await page.evaluate(([key, content]) => localStorage.setItem(key, JSON.stringify({ title: "Denetim testi", content, researchData: { thesis: { templateId: "demo-university-d-master-tr-v1", templateVersion: "1.0.0", selection: { universityId: "demo-university-d", instituteId: "graduate", degreeType: "master", language: "tr" }, values: { YEAR: "2026" }, sectionContent: {}, enabledSections: [] } } })), [KEY, main]);
  await page.reload({ waitUntil: "networkidle" }); await ready();
  const button = page.getByRole("button", { name: /^Denetim:/ });
  assert.match(await button.getAttribute("aria-label"), /\d+ hata, \d+ uyarı/);
  await button.click();
  await page.waitForSelector("[data-thesis-audit-list]");
  let list = await codes();
  for (const code of ["metadata.missing", "paragraph.align", "paragraph.size", "heading.pseudo", "figure.caption", "section.empty"]) assert.ok(list.includes(code), `${code} listed: ${list.join(", ")}`);
  assert.equal(list[0], "metadata.missing", "errors first");
  const alignItem = page.locator('[data-thesis-audit-code="paragraph.align"] button');
  assert.match(await alignItem.textContent(), /Beklenen: iki yana yaslı · Mevcut: ortalı/);
  assert.match(await alignItem.textContent(), /Kaynak: şablon › main › typography.body/);
  pass("body findings with expected/actual/source; errors first");

  // 2. Clicking a finding activates its section.
  await alignItem.click();
  await page.waitForFunction(() => document.querySelector('[data-thesis-flow-section="main"]')?.getBoundingClientRect().top < 400);
  pass("finding jumps to its section");

  // 3. Seeded cover edited away from the template: the audit compares with the fresh seed.
  await page.getByRole("button", { name: "Denetimi kapat" }).click();
  const tezLine = page.locator('[data-thesis-flow-section="cover"] p', { hasText: "YÜKSEK LİSANS TEZİ" });
  await tezLine.scrollIntoViewIfNeeded(); await tezLine.click();
  await page.keyboard.press(process.platform === "darwin" ? "Meta+ArrowRight" : "End"); await page.keyboard.press("Enter"); await page.keyboard.type("Ek satır");
  await page.waitForFunction(() => /Ek satır/.test(JSON.parse(localStorage.getItem("txtnote-thesis-editable")).researchData.thesis.sectionContent.cover || ""));
  // Delete the student line (a required field) by removing the chip through the stored HTML round trip.
  await page.evaluate((key) => { const doc = JSON.parse(localStorage.getItem(key)); doc.researchData.thesis.sectionContent.cover = doc.researchData.thesis.sectionContent.cover.replace(/<p class="fmt-align-center"[^>]*><span class="fmt-pt-12"><span class="thesis-field" data-field="STUDENT_NAME"[^>]*>[^<]*<\/span><\/span><\/p>/, ""); localStorage.setItem(key, JSON.stringify(doc)); }, KEY);
  await page.reload({ waitUntil: "networkidle" }); await ready();
  await page.getByRole("button", { name: /^Denetim:/ }).click(); await page.waitForSelector("[data-thesis-audit-list]");
  list = await codes();
  assert.ok(list.includes("layout.fieldRemoved"), `field removal listed: ${list.join(", ")}`);
  assert.ok(list.includes("layout.extraLines"), "extra line noted");
  assert.equal(await page.locator('[data-thesis-audit-code="layout.fieldRemoved"]').getAttribute("data-thesis-audit-severity"), "error");
  pass("seeded page compared with the template seed");

  // 4. Reset + fill everything: the panel reports the all-clear.
  await page.locator('[data-thesis-flow-section="cover"] .rich-text-body[contenteditable="true"]').click();
  await page.getByRole("button", { name: "Şablona sıfırla" }).click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.waitForFunction((key) => !(JSON.parse(localStorage.getItem(key)).researchData.thesis.sectionContent.cover || "").trim(), KEY).catch(() => {});
  await page.evaluate((key) => { const doc = JSON.parse(localStorage.getItem(key)); doc.content = "<h1>Giriş</h1><p>Düzgün paragraf.</p>"; doc.researchData.thesis.sectionContent = { abstract: "<p>Özet.</p>", bibliography: "<p>Kaynak.</p>", jury: "" }; doc.researchData.thesis.values = { YEAR: "2026", STUDENT_NAME: "Ayşe Yılmaz", ADVISOR_NAME: "Prof. Dr. Ali Veli", CITY: "Manisa" }; localStorage.setItem(key, JSON.stringify(doc)); }, KEY);
  await page.reload({ waitUntil: "networkidle" }); await ready();
  await page.getByRole("button", { name: /^Denetim/ }).click();
  await page.waitForSelector('aside[aria-label="Şablon denetimi"]');
  const remaining = await page.locator("[data-thesis-audit-list] li").count();
  assert.equal(remaining, 0, `no findings left: ${(await codes()).join(", ")}`);
  assert.match(await page.locator('aside[aria-label="Şablon denetimi"]').textContent(), /şablon kurallarına uyuyor/);
  await page.screenshot({ path: "output/desktop-parity/compliance-clear.png" });
  pass("all-clear state");

  assert.deepEqual(errors, [], "no page errors");
  console.log("ALL PASS");
} catch (error) {
  console.error(error);
  console.error("page errors:", errors);
  await page.screenshot({ path: "output/desktop-parity/compliance-failure.png" }).catch(() => {});
  process.exitCode = 1;
} finally {
  await browser.close();
}
