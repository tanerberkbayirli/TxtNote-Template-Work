import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--enable-blink-features=MulticolColumnWrapping", "--font-render-hinting=none"] });
const base = process.argv[2] || "http://127.0.0.1:5183";
const context = await browser.newContext({ viewport: { width: 1380, height: 920 }, acceptDownloads: true });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const output = path.resolve(import.meta.dirname, "../../output/ribbon-alignment");
const bounds = { left: 35, right: 190, center: 112.5, width: 155 };
const tab = (name) => page.getByRole("tab", { name, exact: true });
const target = (id) => page.locator(`[data-layout-id="${id}"][data-layout-type="text"]`);
async function measure(id) {
  return target(id).evaluate((node) => {
    const paper = node.closest(".thesis-paper[data-thesis-section]").getBoundingClientRect();
    const box = node.getBoundingClientRect();
    const scale = paper.width / 210;
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    const rects = [];
    for (let text = walker.nextNode(); text; text = walker.nextNode()) {
      if (!text.textContent.trim()) continue;
      const range = document.createRange(); range.selectNodeContents(text);
      rects.push(...range.getClientRects());
    }
    const left = Math.min(...rects.map((rect) => rect.left));
    const right = Math.max(...rects.map((rect) => rect.right));
    return { x: (box.left - paper.left) / scale, y: (box.top - paper.top) / scale, width: box.width / scale,
      textLeft: (left - paper.left) / scale, textRight: (right - paper.left) / scale,
      textCenter: ((left + right) / 2 - paper.left) / scale };
  });
}
const near = (actual, expected, message) => assert.ok(Math.abs(actual - expected) <= 0.5, `${message}: ${actual} vs ${expected} mm`);
async function choose(id) {
  await target(id).scrollIntoViewIfNeeded();
  await target(id).click();
  await page.locator(`[data-layout-selection-box="${id}"]`).waitFor();
  await tab("Giriş").click();
}
try {
  await context.grantPermissions(["local-fonts"], { origin: new URL(base).origin });
  await page.goto(`${base}/tests/thesis.html`);
  await page.evaluate(() => localStorage.removeItem("txtnote-thesis-regression"));
  await page.reload();
  await target("cover:block:1").waitFor();
  await page.locator('[data-thesis-flow-section="main"] [role="textbox"]').fill("Gövde metni seçim kontrolü.");
  await page.evaluate(() => {
    const doc = window.thesisTest.getDoc();
    doc.content = "<p>Gövde metni seçim kontrolü.</p>";
    doc.researchData.thesis.layout = {
      page: { margins: { leftMm: 35, rightMm: 20, topMm: 30, bottomMm: 20 } },
      elements: { "cover:block:1": { layoutMode: "absolute", xMm: 75, yMm: 45, widthMm: 65, heightMm: 12, flowHeightMm: 12,
        style: { leftIndentMm: 4, rightIndentMm: 3, firstLineIndentMm: 2 } }, "cover:block:4": { widthMm: 55 }, "cover:block:10.0": { widthMm: 45 } },
      additions: [{ id: "alignment-frame", type: "text", sectionId: "cover", layoutMode: "absolute", xMm: 70, yMm: 72,
        widthMm: 60, heightMm: 12, content: "Çerçeve hizalama testi", style: { fontFamily: "Times New Roman", fontSizePt: 12, align: "left" } }],
    };
    localStorage.setItem("txtnote-thesis-regression", JSON.stringify(doc));
  });
  await page.reload();
  await target("alignment-frame").waitFor();
  await page.locator('select[aria-label="Yakınlaştır"]').selectOption("100");
  const readings = [];
  for (const id of ["cover:block:1", "cover:block:4", "cover:block:10.0", "alignment-frame"]) {
    await choose(id);
    const before = await measure(id);
    const peer = await measure(id === "alignment-frame" ? "cover:block:1" : "alignment-frame");
    assert.equal(await page.getByLabel("Hizalama alanı").inputValue(), "page");
    assert.equal(await page.getByRole("listbox", { name: "Stil galerisi" }).getByRole("option").first().isDisabled(), true, "paragraph-only styles cannot silently act on a text box");
    for (const [label, key, expected] of [["Sola hizala", "textLeft", bounds.left], ["Sağa hizala", "textRight", bounds.right], ["Ortala", "textCenter", bounds.center]]) {
      await page.getByRole("button", { name: label, exact: true }).click();
      await page.waitForFunction(({ id, label }) => {
        const node = document.querySelector(`[data-layout-id="${id}"][data-layout-type="text"]`);
        const align = { "Sola hizala": "left", "Sağa hizala": "right", "Ortala": "center" }[label];
        return node && getComputedStyle(node).textAlign === align;
      }, { id, label });
      const actual = await measure(id);
      near(actual[key], expected, `${id} ${label} aligns glyphs to page writing area`);
      near(actual.x, bounds.left, "frame starts at writing area");
      near(actual.width, bounds.width, "frame spans writing area");
      near(actual.y, before.y, "alignment keeps vertical position");
      assert.equal(await page.getByRole("button", { name: label, exact: true }).getAttribute("aria-pressed"), "true");
      readings.push({ id, label, ...actual });
    }
    await page.getByRole("button", { name: "İki yana yasla", exact: true }).click();
    assert.equal(await target(id).evaluate((node) => getComputedStyle(node).textAlign), "justify");
    near((await measure(id)).width, bounds.width, "justify uses the whole writing area");
    const peerAfter = await measure(id === "alignment-frame" ? "cover:block:1" : "alignment-frame");
    near(peerAfter.x, peer.x, "alignment leaves other block position alone");
    near(peerAfter.width, peer.width, "alignment leaves other block width alone");
  }
  await page.getByRole("button", { name: "Sağa hizala", exact: true }).click();
  await page.getByRole("button", { name: "Geri al (Ctrl+Z)" }).click();
  assert.equal(await target("alignment-frame").evaluate((node) => getComputedStyle(node).textAlign), "justify");
  await page.getByRole("button", { name: "Yinele (Ctrl+Y)" }).click();
  near((await measure("alignment-frame")).textRight, bounds.right, "redo restores page alignment");
  // Explicit box mode must preserve a narrow user-authored frame.
  await page.getByRole("tab", { name: "Düzen", exact: true }).click();
  await page.getByRole("button", { name: "Düzen değişikliğini geri al" }).click();
  await choose("alignment-frame");
  const inspector = page.getByRole("complementary", { name: "Düzen denetçisi" });
  await inspector.getByLabel("Genişlik (mm)", { exact: true }).fill("60");
  await page.getByLabel("Hizalama alanı").selectOption("box");
  const narrow = await measure("alignment-frame");
  await page.getByRole("button", { name: "Sağa hizala", exact: true }).click();
  const inBox = await measure("alignment-frame");
  near(inBox.x, narrow.x, "box alignment preserves x");
  near(inBox.width, 60, "box alignment preserves width");
  near(inBox.textRight, narrow.x + 60, "box right aligns within the box");
  await target("alignment-frame").click({ button: "right" });
  await page.getByRole("menuitem", { name: "Sağa hizala", exact: true }).click();
  near((await measure("alignment-frame")).x, bounds.right - 60, "single-object alignment moves the box to the page edge");
  await target("alignment-frame").click({ button: "right" });
  await page.getByRole("menuitem", { name: "Ortala", exact: true }).click();
  near((await measure("alignment-frame")).x, 105 - 30, "single-object center actually moves the box");
  const verticalBefore = await measure("alignment-frame");
  for (const [label, y] of [["Üste hizala", 30], ["Alta hizala", 277 - 12], ["Dikey ortala", 148.5 - 6]]) {
    await target("alignment-frame").click({ button: "right" });
    await page.getByRole("menuitem", { name: label, exact: true }).click();
    near((await measure("alignment-frame")).y, y, `${label} moves the single object`);
    await page.getByRole("tabpanel").getByRole("button", { name: "Geri al (Ctrl+Z)" }).click();
    near((await measure("alignment-frame")).y, verticalBefore.y, "undo restores vertical placement");
  }
  await choose("alignment-frame");
  const ribbon = page.getByRole("tabpanel");
  await ribbon.getByRole("button", { name: "Üstü çizili", exact: true }).click();
  await ribbon.getByRole("button", { name: "Altı çizili", exact: true }).click();
  await page.keyboard.down("Shift");
  await target("cover:block:1").click();
  await page.keyboard.up("Shift");
  assert.equal(await page.locator("[data-layout-selection-box]").count(), 2);
  assert.equal(await ribbon.getByRole("button", { name: "Kalın", exact: true }).isDisabled(), true, "multi-object selection cannot format the previous body");
  await target("alignment-frame").click({ button: "right" });
  assert.equal(await page.getByRole("menuitem", { name: "Yatay dağıt", exact: true }).isDisabled(), true, "distribution needs three objects");
  await page.keyboard.press("Escape");
  await choose("alignment-frame");
  assert.match(await target("alignment-frame").evaluate((node) => getComputedStyle(node).textDecorationLine), /underline/);
  assert.match(await target("alignment-frame").evaluate((node) => getComputedStyle(node).textDecorationLine), /line-through/);
  await inspector.getByRole("button", { name: "Altı çizili", exact: true }).click();
  assert.equal(await target("alignment-frame").evaluate((node) => getComputedStyle(node).textDecorationLine), "line-through", "sidebar underline toggle preserves strike");
  await target("alignment-frame").click({ button: "right" });
  const menu = page.getByRole("menu");
  await menu.getByRole("button", { name: "Altı çizili", exact: true }).click();
  assert.match(await target("alignment-frame").evaluate((node) => getComputedStyle(node).textDecorationLine), /line-through/);
  await page.keyboard.press("Escape");
  await ribbon.getByRole("button", { name: "Üstü çizili", exact: true }).click();
  await ribbon.getByRole("button", { name: "Altı çizili", exact: true }).click();
  // Locked objects cannot send formatting commands to the previously active body.
  await inspector.getByLabel("Öğeyi kilitle", { exact: true }).check();
  for (const label of ["Sola hizala", "Sağa hizala", "Kalın", "İtalik", "Biçimi temizle"]) {
    assert.equal(await page.getByRole("tabpanel").getByRole("button", { name: label, exact: true }).isDisabled(), true, `${label} disabled for a locked frame`);
  }
  assert.match(await page.evaluate(() => window.thesisTest.getDoc().content), /Gövde metni seçim kontrolü/);
  await inspector.getByLabel("Öğeyi kilitle", { exact: true }).uncheck();
  await page.getByLabel("Hizalama alanı").selectOption("page");
  await page.getByRole("button", { name: "Sağa hizala", exact: true }).click();
  await page.reload();
  near((await measure("alignment-frame")).textRight, bounds.right, "page alignment persists after reload");
  await mkdir(output, { recursive: true });
  await tab("Dosya").click();
  const exported = {};
  for (const [kind, label] of [["pdf", "PDF"], ["docx", "Word"]]) {
    await page.waitForFunction((name) => !document.querySelector(`.thesis-export-tile[aria-label="${name}"]`)?.disabled, label, { timeout: 120000 });
    const pending = page.waitForEvent("download", { timeout: 60000 });
    await page.getByRole("button", { name: label, exact: true }).click();
    const download = await pending;
    const file = path.join(output, `alignment.${kind}`);
    await download.saveAs(file);
    const bytes = await readFile(file);
    if (kind === "pdf") {
      const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
      const pdf = await getDocument({ data: new Uint8Array(bytes), disableFontFace: true }).promise;
      const items = (await (await pdf.getPage(1)).getTextContent()).items;
      const item = items.find((entry) => entry.str.includes("Çerçeve hizalama testi"));
      assert.ok(item, "real PDF preserves the aligned text");
      const rightMm = (item.transform[4] + item.width) * 25.4 / 72;
      near(rightMm, bounds.right, "PDF glyphs reach the writing-area right edge");
      exported.pdf = { pages: pdf.numPages, textRightMm: rightMm };
    } else {
      const { unzipSync, strFromU8 } = await import("fflate");
      const xml = strFromU8(unzipSync(bytes)["word/document.xml"]);
      assert.match(xml, /Çerçeve hizalama testi/);
      assert.match(xml, /<w:jc w:val="right"\s*\/>/);
      assert.match(xml, /<wp:posOffset>1260000<\/wp:posOffset>/, "DOCX frame x is 35 mm");
      assert.match(xml, /<wp:extent cx="5580000"/, "DOCX frame width is 155 mm");
      exported.docx = { pageFrameXmm: 35, pageFrameWidthMm: 155, align: "right" };
    }
  }
  assert.deepEqual(errors, []);
  await choose("alignment-frame");
  await page.screenshot({ path: path.join(output, "page-alignment.png") });
  await writeFile(path.join(output, "result.json"), JSON.stringify({ passed: true, readings, exported, errors }, null, 2));
  console.log("PASS measured page/box alignment, justify, target isolation, lock gating, undo/redo, persistence and real PDF/DOCX exports");
} finally { await browser.close(); }
