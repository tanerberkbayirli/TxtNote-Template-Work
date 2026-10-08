import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--enable-blink-features=MulticolColumnWrapping"] });
const base = process.argv[2] || "http://127.0.0.1:5183";
const near = (a, b, label) => assert.ok(Math.abs(a - b) < 0.1, `${label}: ${a} vs ${b} mm`);
const labels = { left: "Sola hizala", center: "Ortala", right: "Sağa hizala" };
try {
  const page = await browser.newPage({ viewport: { width: 1380, height: 920 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${base}/tests/thesis.html`);
  for (const templateId of ["adu-sagbil-master-tr-v1", "mcbu-tip-uzmanlik-tr-v1"]) {
    await page.evaluate((id) => localStorage.setItem("txtnote-thesis-regression", JSON.stringify({
      title: "TEZİN BAŞLIĞI", content: '<p>Ortalanacak paragraf</p><h1 data-academic-heading="1" data-unnumbered="true">Ortalanacak başlık</h1>',
      researchData: { thesis: { templateId: id, templateVersion: "1.0.0", values: { YEAR: "2026" }, sectionContent: {}, enabledSections: [] } },
    })), templateId);
    await page.reload();
    const cover = page.locator(".thesis-layout-text[data-layout-id]").first();
    await cover.waitFor();
    const measure = (locator) => locator.evaluate((node) => {
      const paper = node.closest(".thesis-paper").getBoundingClientRect();
      const box = node.getBoundingClientRect();
      const scale = paper.width / 210;
      const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
      const rects = [];
      for (let text = walker.nextNode(); text; text = walker.nextNode()) {
        if (!text.textContent.trim()) continue;
        const range = document.createRange(); range.selectNodeContents(text);
        rects.push(...range.getClientRects());
      }
      const left = Math.min(...rects.map((r) => r.left)), right = Math.max(...rects.map((r) => r.right));
      return { y: (box.top - paper.top) / scale, center: ((left + right) / 2 - paper.left) / scale,
        left: (left - paper.left) / scale, right: (right - paper.left) / scale, align: getComputedStyle(node).textAlign };
    });
    for (const zoom of ["75", "100", "125"]) {
      await page.getByLabel("Yakınlaştır", { exact: true }).selectOption(zoom);
      await cover.click();
      const before = await measure(cover);
      for (const align of ["right", "center", "left", "center", "right", "center"]) {
        await page.getByRole("button", { name: labels[align], exact: true }).click();
        const actual = await measure(cover);
        assert.equal(actual.align, align);
        near(actual.y, before.y, `${templateId} ${zoom}% keeps vertical position`);
        near(actual[align], { left: 0, center: 105, right: 210 }[align], `${templateId} ${align}`);
      }
    }
    await page.reload(); await cover.waitFor();
    near((await measure(cover)).center, 105, "center survives save/reopen");
    const body = page.locator('[data-thesis-flow-section="main"] [role="textbox"]').first();
    for (const tag of ["p", "h1"]) {
      const block = body.locator(tag).first();
      await block.click();
      for (const align of ["right", "center", "left", "center"]) {
        await page.getByRole("button", { name: labels[align], exact: true }).click();
        assert.equal(await block.evaluate((node) => getComputedStyle(node).textAlign), align, "command overrides template alignment");
        if (align === "center") {
          const errorMm = await block.evaluate((node) => {
            const box = node.getBoundingClientRect(), paper = node.closest(".thesis-paper").getBoundingClientRect();
            const range = document.createRange(); range.selectNodeContents(node);
            const text = range.getBoundingClientRect();
            return (text.left + text.width / 2 - box.left - box.width / 2) * 210 / paper.width;
          });
          near(errorMm, 0, `${tag} actual text center`);
        }
      }
      assert.equal(await body.locator('div[class*="fmt-align-"]').count(), 0, "commands do not nest alignment wrappers");
    }
  }
  assert.deepEqual(errors, []);
  console.log("PASS: repeated left/right/center transitions, baseline anchors, real glyph centers, 75/100/125% zoom, paragraphs/headings and save/reopen");
} finally { await browser.close(); }
