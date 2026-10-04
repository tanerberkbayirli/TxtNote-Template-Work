// Editable layouts in a real browser: seed, marks, field chips, editing, reset, DOCX.
// Run against Vite: PLAYWRIGHT_MODULE=<installed playwright path> node tests/thesis-editable-layout.e2e.mjs [baseUrl]
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { unzipSync, strFromU8 } from "fflate";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}) });
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 }, acceptDownloads: true });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("dialog", (dialog) => dialog.accept());
const base = process.argv[2] || "http://localhost:5173";
const pxPerMm = 96 / 25.4;
const near = (actual, expected, message, tolerance = 1) => assert.ok(Math.abs(actual - expected) < tolerance, `${message}: ${actual} vs ${expected}`);
const pass = (message) => console.log(`PASS ${message}`);
const doc = () => page.evaluate(() => window.thesisTest.getDoc());
const cover = () => page.locator('[data-thesis-flow-section="cover"] .rich-text-body[contenteditable="true"]');
const stored = async () => (await doc())?.researchData?.thesis?.sectionContent?.cover || "";
try {
  // A cold Vite server may optimise dependencies and reload the page once; settle first.
  await page.goto(`${base}/tests/thesis-editable.html`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-thesis-flow-section="cover"]', { timeout: 60000 });
  await page.waitForTimeout(1500);
  await page.evaluate(() => localStorage.removeItem("txtnote-thesis-editable"));
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector('[data-thesis-flow-section="cover"] .rich-text-body[contenteditable="true"]', { timeout: 60000 });
  await page.getByLabel("Yakınlaştır", { exact: true }).selectOption("100");

  // 1. Seeded page: editable body, no static block renderer, marks drawn by the scoped CSS.
  assert.equal(await page.locator('[data-thesis-flow-section="cover"] .thesis-layout-text').count(), 0, "no static layout nodes");
  const seed = await cover().evaluate((root) => {
    const title = root.querySelector('.thesis-field[data-field="THESIS_TITLE"]');
    const gap = root.querySelector("p.thesis-gap");
    const student = root.querySelector('.thesis-field[data-field="STUDENT_NAME"]');
    const hidden = root.querySelector('[data-thesis-optional="CO_ADVISOR_NAME"]');
    const uni = [...root.querySelectorAll("p")].find((p) => /DEMO Üniversite D/.test(p.textContent));
    const img = root.querySelector("figure img");
    return {
      titleSize: parseFloat(getComputedStyle(title).fontSize), titleText: title.textContent, titleEditable: title.isContentEditable,
      titleAlign: getComputedStyle(title.closest("p")).textAlign, gapHeight: gap.getBoundingClientRect().height, gapAttr: gap.getAttribute("data-gap"),
      studentText: student.textContent, hiddenDisplay: hidden ? getComputedStyle(hidden).display : "missing", uniSize: parseFloat(getComputedStyle(uni).fontSize), uniWeight: getComputedStyle(uni.querySelector("strong")).fontWeight,
      imgWidth: img.getBoundingClientRect().width, paragraphs: root.querySelectorAll("p").length,
    };
  });
  near(seed.titleSize, 24, "18pt title (fmt-pt-18)"); assert.equal(seed.titleText, "DÜZENLENEBİLİR KAPAK"); assert.equal(seed.titleEditable, false, "field chips are not typed over");
  assert.equal(seed.titleAlign, "center"); near(seed.gapHeight, Number(seed.gapAttr) * pxPerMm, "gap paragraph height in mm", 1.5);
  assert.equal(seed.studentText, "Ad SOYAD", "empty metadata shows the fallback"); assert.equal(seed.hiddenDisplay, "none", "optional block hidden while empty");
  near(seed.uniSize, 20, "15pt via data-pt"); assert.ok(Number(seed.uniWeight) >= 600, "bold"); near(seed.imgWidth, 20 * pxPerMm, "20 mm image", 1.5);
  assert.equal(await stored(), "", "nothing stored before the first edit");
  pass("seeded cover: editable, chips, gaps, sizes, hidden optional block, image");

  // 2. Metadata drives chips live, also before any edit.
  await page.getByRole("button", { name: "Tez bilgileri" }).click();
  await page.getByLabel("Öğrenci *", { exact: true }).fill("Ayşe Yılmaz");
  await page.getByLabel("İkinci danışman", { exact: true }).first().fill("Dr. Can Demir");
  await page.getByRole("button", { name: "Tez bilgilerini kapat" }).click();
  await page.waitForFunction(() => document.querySelector('[data-thesis-flow-section="cover"] .thesis-field[data-field="STUDENT_NAME"]')?.textContent === "Ayşe Yılmaz");
  assert.equal(await page.locator('[data-thesis-flow-section="cover"] [data-thesis-optional="CO_ADVISOR_NAME"]').evaluate((el) => getComputedStyle(el).display), "block", "optional block appears once filled");
  pass("chips and optional blocks follow the metadata");

  // 3. Editing: type after the title, the stored HTML keeps chips, marks and the user's text; no hidden stamps are stored.
  await cover().locator('.thesis-field[data-field="THESIS_TITLE"]').click();
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Alt başlık satırı");
  await page.waitForFunction(() => /Alt başlık satırı/.test(window.thesisTest.getDoc()?.researchData?.thesis?.sectionContent?.cover || ""));
  const html = await stored();
  assert.match(html, /data-field="THESIS_TITLE"/); assert.match(html, /fmt-align-center/); assert.match(html, /class="thesis-gap" data-gap="38"/);
  assert.doesNotMatch(html, /data-thesis-hidden/); assert.doesNotMatch(html, /style=/);
  assert.equal(await page.locator('[data-thesis-flow-section="cover"] .thesis-field[data-field="STUDENT_NAME"]').textContent(), "Ayşe Yılmaz", "chips still live after an edit");
  pass("edits persist with chips and marks, without presentation stamps or inline styles");

  // 4. Reset returns to the template seed.
  await page.getByRole("button", { name: "Şablona sıfırla" }).click();
  await page.waitForFunction(() => !/Alt başlık satırı/.test(window.thesisTest.getDoc()?.researchData?.thesis?.sectionContent?.cover || ""));
  assert.equal(await cover().locator("text=Alt başlık satırı").count(), 0);
  pass("reset to template");

  // 5. Jury page: rule + borderless row seeded and editable.
  const jury = await page.locator('[data-thesis-flow-section="jury"] .rich-text-body[contenteditable="true"]').evaluate((root) => ({
    rules: root.querySelectorAll("hr.thesis-rule").length, rowCells: root.querySelectorAll("table.thesis-layout-row td").length,
    cellBorder: getComputedStyle(root.querySelector("table.thesis-layout-row td")).borderTopWidth, ruleWidth: root.querySelector("hr.thesis-rule").getBoundingClientRect().width, cellWidth: root.querySelector("table.thesis-layout-row td").getBoundingClientRect().width,
    secondPadding: parseFloat(getComputedStyle(root.querySelectorAll("table.thesis-layout-row td")[1]).paddingLeft), tableLeft: root.querySelector("table.thesis-layout-row").getBoundingClientRect().left, rootLeft: root.getBoundingClientRect().left,
  }));
  assert.equal(jury.rules, 3); assert.equal(jury.rowCells, 3); assert.equal(jury.cellBorder, "0px"); near(jury.ruleWidth, jury.cellWidth, "rule fills its column", 2);
  near(jury.secondPadding, 6 * pxPerMm, "6 mm column gap", 1); near(jury.tableLeft, jury.rootLeft, "row flush with the text block", 1);
  pass("jury page: rules and borderless row");

  // 6. DOCX: the cover arrives as centred paragraphs with the chip text, exact-height spacers and the image.
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Word" }).click()]);
  const dir = path.resolve("output/desktop-parity"); await mkdir(dir, { recursive: true });
  const file = path.join(dir, "editable-layout.docx"); await download.saveAs(file);
  const zip = unzipSync(new Uint8Array(await readFile(file)));
  const xml = strFromU8(zip["word/document.xml"]);
  assert.match(xml, /Ayşe Yılmaz/); assert.match(xml, /DÜZENLENEBİLİR KAPAK/); assert.match(xml, /w:lineRule="exact"/, "spacer paragraphs");
  assert.match(xml, /<w:jc w:val="center"\/>/); assert.match(xml, /<w:drawing>/, "cover image"); assert.match(xml, /<w:sz w:val="36"\/>/, "18 pt title run");
  assert.match(xml, /JÜRİ ONAYI/); assert.match(xml, /<w:bottom w:val="single"/, "jury rule as bottom border");
  assert.ok(Object.keys(zip).some((name) => /^word\/media\//.test(name)), "image part");
  pass("DOCX export of the editable pages");

  assert.deepEqual(errors, [], "no page errors");
  console.log("ALL PASS");
} catch (error) {
  console.error(error);
  console.error("page errors:", errors);
  process.exitCode = 1;
} finally {
  await browser.close();
}
