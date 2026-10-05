import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({ viewport: { width: 1380, height: 920 } });
const page = await context.newPage();
const base = process.argv[2] || "http://127.0.0.1:5181";
const body = page.locator('[data-thesis-flow-section="main"] [contenteditable="true"]');
const output = path.resolve(import.meta.dirname, "../../output/word-thesis");
const geometryEvidence = [];

async function replaceAndSelect(text) {
  await body.click();
  await page.keyboard.press("Control+a");
  await page.keyboard.press("Backspace");
  await page.keyboard.type(text);
  await page.keyboard.press("Control+a");
}

async function chooseDuringRefresh(modeLabel, colorLabel, expected) {
  await page.getByRole("button", { name: modeLabel, exact: true }).click();
  const swatch = page.getByRole("menuitem", { name: `Renk ${colorLabel}`, exact: true });
  const box = await swatch.boundingBox();
  assert.ok(box, `${colorLabel} swatch is visible`);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  // A queued selectionchange can rerender the toolbar while the physical press is held.
  await page.evaluate(() => document.dispatchEvent(new Event("selectionchange")));
  await page.waitForTimeout(80);
  await page.mouse.up();
  await page.waitForTimeout(20);
  assert.match(await body.innerHTML(), expected, `${colorLabel} is applied after an intervening editor refresh`);
}

try {
  await page.goto(`${base}/tests/thesis.html`);
  await body.waitFor();
  await page.getByRole("tab", { name: "Giriş", exact: true }).click();
  await replaceAndSelect("Palette persistence probe");
  await chooseDuringRefresh("Yazı rengi seçenekleri", "#404040", /data-fmt-color="#404040"/);
  await replaceAndSelect("Standard palette probe");
  await chooseDuringRefresh("Yazı rengi seçenekleri", "#00b0f0", /data-fmt-color="#00b0f0"/);
  await replaceAndSelect("Named palette probe");
  await chooseDuringRefresh("Yazı rengi seçenekleri", "#be123c", /fmt-color-red|data-fmt-color="#be123c"/);
  await replaceAndSelect("Highlight palette probe");
  await chooseDuringRefresh("Vurgu rengi seçenekleri", "#fff2a8", /fmt-highlight-yellow/);
  await replaceAndSelect("Custom color probe");
  await page.getByRole("button", { name: "Yazı rengi seçenekleri", exact: true }).click();
  await page.getByLabel("HEX renk kodu").fill("#123456");
  await page.getByRole("button", { name: "Uygula", exact: true }).click();
  assert.match(await body.innerHTML(), /data-fmt-color="#123456"/);
  await replaceAndSelect("New selection after custom color");
  await page.getByRole("button", { name: "Yazı rengi seçenekleri", exact: true }).click();
  await page.getByLabel("HEX renk kodu").fill("#abcdef");
  await page.getByRole("button", { name: "Uygula", exact: true }).click();
  assert.match(await body.innerHTML(), /data-fmt-color="#abcdef"/);

  await mkdir(output, { recursive: true });
  for (const [width, height, theme] of [[1380, 920, "light"], [1024, 768, "light"], [620, 900, "light"], [1024, 180, "short"], [1380, 920, "dark"]]) {
    await page.setViewportSize({ width, height });
    await page.evaluate((dark) => document.documentElement.classList.toggle("dark", dark), theme === "dark");
    const caret = page.getByRole("button", { name: "Yazı rengi seçenekleri", exact: true });
    await caret.click();
    const menu = page.locator(".thesis-floating-menu");
    const rect = await menu.evaluate((element) => {
      const box = element.getBoundingClientRect();
      return { left: box.left, top: box.top, right: box.right, bottom: box.bottom, width: box.width, height: box.height, scrollHeight: element.scrollHeight, clientHeight: element.clientHeight };
    });
    assert.ok(rect.left >= 0 && rect.right <= width, `${width}x${height} palette fits horizontally`);
    assert.ok(rect.top >= 0 && rect.bottom <= height, `${width}x${height} palette fits vertically`);
    const childOverflow = await menu.evaluate((element) => {
      const menuRect = element.getBoundingClientRect();
      return [...element.querySelectorAll(".thesis-hex-preview,.thesis-hex-input,.thesis-hex-apply,.thesis-palette-custom input")]
        .map((child) => {
          const rect = child.getBoundingClientRect();
          return { label: child.getAttribute("aria-label") || child.textContent.trim() || child.type, left: rect.left, right: rect.right, width: rect.width, menuLeft: menuRect.left, menuRight: menuRect.right };
        });
    });
    assert.ok(childOverflow.every(({ left, right, menuLeft, menuRight }) => left >= menuLeft - 1 && right <= menuRight + 1), "HEX controls and custom picker stay inside the palette edge");
    geometryEvidence.push({ width, height, theme, menu: rect, controls: childOverflow });
    if (height < 260) assert.ok(rect.scrollHeight > rect.clientHeight, "short viewport exposes palette content through internal scrolling");
    const filename = `palette-after-${width}x${height}-${theme}.png`;
    await page.screenshot({ path: path.join(output, filename), fullPage: false });
    await caret.click();
  }
  await page.getByRole("button", { name: "Yazı rengi seçenekleri", exact: true }).click();
  await page.screenshot({ path: path.join(output, "palette-detail-dark.png"), clip: { x: 220, y: 145, width: 290, height: 270 } });
  await writeFile(path.join(output, "ribbon-colors-geometry.json"), JSON.stringify({
    before: {
      viewport: { width: 1024, height: 180 },
      palette: { left: 244, top: 4, right: 494, bottom: 241.59375, height: 237.59375 },
      verticalOverflowPx: 61.59375,
      hexApplyRightOverflowPxApprox: 8,
      hexApplyOverflowBasis: "root visual review of the pre-fix 1380x920 dark palette screenshot",
    },
    after: geometryEvidence,
  }, null, 2));
  console.log("PASS swatches survive delayed pointer-up across gray, standard, named, and highlight palettes; HEX color applies and palette reopens; menu fits all requested viewports including short-height scroll; light/dark screenshots saved.");
} finally {
  await browser.close();
}
