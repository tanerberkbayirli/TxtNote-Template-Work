import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--enable-blink-features=MulticolColumnWrapping"] });
const page = await browser.newPage({ viewport: { width: 1380, height: 920 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const base = process.argv[2] || "http://127.0.0.1:5181";
const output = new URL("../../output/ribbon-panels/", import.meta.url);
try {
  await page.addInitScript(() => {
    window.testPrintCalls = 0;
    window.print = () => { window.parent.testPrintCalls++; };
    const descriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "innerText");
    window.editableTextReads = 0;
    Object.defineProperty(HTMLElement.prototype, "innerText", { ...descriptor, get() {
      if (this.getAttribute("contenteditable") === "true") window.editableTextReads++;
      return descriptor.get.call(this);
    } });
  });
  await page.goto(`${base}/tests/thesis.html`);
  await page.evaluate(() => localStorage.removeItem("txtnote-thesis-regression"));
  await page.reload();
  await page.locator('[data-thesis-flow-section="main"] [role="textbox"]').waitFor();
  await page.waitForFunction(() => document.querySelector('[data-thesis-pagination-ready="true"]'), { timeout: 60000 });
  assert.equal(await page.locator(".thesis-titlebar").count(), 0);
  const shortcuts = page.getByRole("group", { name: "Belge panelleri" });
  for (const name of ["Dosya", "Giriş", "Ekle", "Düzen", "Başvurular", "Görünüm"]) {
    await page.getByRole("tab", { name, exact: true }).click();
    const details = shortcuts.getByRole("button", { name: "Tez bilgileri", exact: true });
    await details.click();
    assert.equal(await details.getAttribute("aria-expanded"), "true");
    await page.getByRole("textbox", { name: "Tez başlığı", exact: true }).waitFor();
    await details.click();
    assert.equal(await details.getAttribute("aria-expanded"), "false");
    const settings = shortcuts.getByRole("button", { name: "Sayfa düzeni", exact: true });
    await settings.click();
    assert.equal(await settings.getAttribute("aria-expanded"), "true");
    await settings.click();
    assert.equal(await settings.getAttribute("aria-expanded"), "false");
  }
  await page.waitForTimeout(700);
  const before = await page.evaluate(() => window.editableTextReads);
  const durations = [];
  for (let i = 0; i < 12; i++) {
    const button = shortcuts.getByRole("button", { name: "Tez bilgileri", exact: true });
    const start = performance.now();
    await button.click();
    durations.push(performance.now() - start);
  }
  const reads = await page.evaluate(() => window.editableTextReads) - before;
  if (process.env.PANEL_BASELINE !== "1") assert.equal(reads, 0, "opening panels must not scan document text");
  // Metadata remains editable and persists across reloads.
  await shortcuts.getByRole("button", { name: "Tez bilgileri", exact: true }).click();
  await page.getByRole("textbox", { name: "Tez başlığı", exact: true }).fill("Panel testi başlığı");
  await page.reload();
  await page.locator('[data-thesis-flow-section="main"] [role="textbox"]').waitFor();
  await shortcuts.getByRole("button", { name: "Tez bilgileri", exact: true }).click();
  assert.equal(await page.getByRole("textbox", { name: "Tez başlığı", exact: true }).inputValue(), "Panel testi başlığı");
  await shortcuts.getByRole("button", { name: "Tez bilgileri", exact: true }).click();
  await page.getByRole("tab", { name: "Giriş", exact: true }).click();
  if (process.env.PANEL_BASELINE !== "1") {
    const counter = page.locator("[data-thesis-word-count]");
    await page.waitForTimeout(500);
    const originalCount = Number(await counter.getAttribute("data-thesis-word-count"));
    const editor = page.locator('[data-thesis-flow-section="main"] [role="textbox"]');
    await editor.fill("Hızlı panel denemesi");
    await page.waitForFunction((expected) => Number(document.querySelector("[data-thesis-word-count]").dataset.thesisWordCount) === expected, originalCount + 3);
    await page.getByRole("button", { name: "Geri al (Ctrl+Z)", exact: true }).click();
    await page.waitForFunction((expected) => Number(document.querySelector("[data-thesis-word-count]").dataset.thesisWordCount) === expected, originalCount);
    await page.getByRole("button", { name: "Yinele (Ctrl+Y)", exact: true }).click();
    await page.waitForFunction((expected) => Number(document.querySelector("[data-thesis-word-count]").dataset.thesisWordCount) === expected, originalCount + 3);
    await page.getByRole("tab", { name: "Düzen", exact: true }).click();
    await page.getByLabel("Cetvel birimi", { exact: true }).selectOption("cm");
    assert.equal(await page.getByLabel("Cetvel birimi", { exact: true }).inputValue(), "cm");
    const rulers = page.getByRole("button", { name: "Cetvelleri göster veya gizle", exact: true });
    await rulers.click();
    assert.equal(await page.locator(".thesis-ruler-horizontal").count(), 0);
    await rulers.click();
    assert.ok(await page.locator(".thesis-ruler-horizontal").count() > 0);
    await shortcuts.getByRole("button", { name: "Sayfa düzeni", exact: true }).click();
    const inspector = page.getByRole("complementary", { name: "Sayfa düzeni denetçisi" });
    const topMargin = inspector.getByLabel("Üst", { exact: true });
    await topMargin.fill("-1");
    assert.equal(await inspector.getByRole("button", { name: "Sayfa ayarlarını uygula" }).isDisabled(), true);
    await topMargin.fill("31");
    await inspector.getByRole("button", { name: "Sayfa ayarlarını uygula" }).click();
    assert.equal(await page.evaluate(() => window.thesisTest.getDoc().researchData.thesis.layout.page.margins.topMm), 31);
    await page.getByRole("button", { name: "Düzen değişikliğini geri al" }).click();
    assert.notEqual(await page.evaluate(() => window.thesisTest.getDoc().researchData.thesis.layout?.page?.margins?.topMm), 31);
    await page.getByRole("button", { name: "Düzen değişikliğini yinele" }).click();
    assert.equal(await page.evaluate(() => window.thesisTest.getDoc().researchData.thesis.layout.page.margins.topMm), 31);
    await shortcuts.getByRole("button", { name: "Sayfa düzeni", exact: true }).click();
    await page.getByRole("tab", { name: "Görünüm", exact: true }).click();
    // The status slider and View dropdown both control the same saved zoom.
    await page.locator('select[aria-label="Yakınlaştırma düzeyi"]').selectOption("75");
    assert.equal(await page.locator('select[aria-label="Yakınlaştır"]').inputValue(), "75");
    await page.locator('select[aria-label="Yakınlaştırma düzeyi"]').selectOption("fit");
    await page.getByRole("tab", { name: "Giriş", exact: true }).click();
    for (const [index, name] of ["Giriş", "Dosya"].entries()) {
      await page.getByRole("tab", { name, exact: true }).click();
      await page.waitForFunction(() => !document.querySelector('[role="tabpanel"] [aria-label="Yazdır"]')?.disabled);
      await page.getByRole("tabpanel").getByRole("button", { name: "Yazdır", exact: true }).click();
      await page.waitForFunction((expected) => window.testPrintCalls === expected, index + 1);
      assert.ok(await page.locator("iframe[srcdoc]").last().getAttribute("srcdoc"), "print prepares a document");
    }
    await page.getByRole("tab", { name: "Giriş", exact: true }).click();
  }
  await page.getByRole("tab", { name: "Giriş", exact: true }).press("ArrowRight");
  assert.equal(await page.getByRole("tab", { name: "Ekle", exact: true }).getAttribute("aria-selected"), "true");
  await page.getByRole("tab", { name: "Ekle", exact: true }).press("Home");
  assert.equal(await page.getByRole("tab", { name: "Dosya", exact: true }).getAttribute("aria-selected"), "true");
  await mkdir(output, { recursive: true });
  for (const width of [1380, 1024, 620, 360]) {
    await page.setViewportSize({ width, height: 920 });
    await page.evaluate(() => document.documentElement.classList.add("dark"));
    const geometry = await shortcuts.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return { left: rect.left, right: rect.right, width: innerWidth };
    });
    assert.ok(geometry.left >= 0 && geometry.right <= geometry.width + 1, `panel shortcuts fit at ${width}px`);
    const statusFits = await page.locator(".thesis-statusbar").evaluate((footer) => [...footer.querySelectorAll("span,button,input,select")].every((node) => {
      const rect = node.getBoundingClientRect();
      return rect.left >= 0 && rect.right <= innerWidth + 1;
    }));
    assert.ok(statusFits, `word count and zoom controls fit at ${width}px`);
    await page.screenshot({ path: new URL(`panel-${width}.png`, output).pathname.replace(/^\/(\w:)/, "$1") });
  }
  assert.deepEqual(errors, []);
  const result = { passed: true, editableTextReadsDuring12PanelToggles: reads, medianToggleMs: durations.sort((a,b) => a-b)[6], errors };
  await writeFile(new URL(process.env.PANEL_BASELINE === "1" ? "baseline.json" : "result.json", output), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
} finally { await browser.close(); }
