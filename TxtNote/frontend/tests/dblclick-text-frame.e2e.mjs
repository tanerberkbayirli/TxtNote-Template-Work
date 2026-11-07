import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "../../../engine/tools/node_modules/playwright");
const base = process.argv[2] || "http://127.0.0.1:5184";
const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--enable-blink-features=MulticolColumnWrapping"] });
try {
  const page = await browser.newPage({ viewport: { width: 1400, height: 950 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${base}/tests/thesis.html`);
  const main = "<h1>GİRİŞ</h1><p>Birinci bölümün kısa metni.</p><h1>GENEL BİLGİLER</h1><p>İkinci bölüm.</p>";
  await page.evaluate((main) => localStorage.setItem("txtnote-thesis-regression", JSON.stringify({
    title: "Çift tık", content: main, researchData: { thesis: { templateId: "mcbu-tip-uzmanlik-tr-v1", templateVersion: "1.0.0", values: { YEAR: "2026" }, sectionContent: {}, enabledSections: [] } },
  })), main);
  await page.reload();
  const body = page.locator('[data-thesis-flow-section="main"] [role="textbox"]').first();
  await body.waitFor(); await page.waitForTimeout(800);
  const sheets = () => page.locator(".thesis-sheet").count();
  const before = await sheets();
  const additions = () => page.evaluate(() => window.thesisTest.getDoc().researchData.thesis.layout?.additions || []);

  // Ribbon format at the caret: bold on (the new frame takes it).
  await body.locator("p").first().click();
  await page.getByRole("tabpanel").getByRole("button", { name: "Kalın", exact: true }).click();
  // An empty spot of the chapter's first page, well below its one paragraph.
  const spot = await body.locator("p").first().evaluate((node) => { const box = node.getBoundingClientRect(); return { x: box.left + 60, y: box.bottom + 140 }; });
  assert.equal(await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.classList.contains("rich-text-body"), spot), true, "the spot is empty body area");
  await page.mouse.dblclick(spot.x, spot.y);
  const editing = page.locator('[data-layout-editing="true"]');
  await editing.waitFor();
  await page.keyboard.type("Not kutusu");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);
  let added = await additions();
  assert.equal(added.length, 1);
  assert.equal(added[0].content, "Not kutusu");
  assert.equal(added[0].style.fontWeight, 700, "frame starts in the ribbon's format");
  const frame = page.locator(`[data-layout-id="${added[0].id}"]`);
  const box = await frame.boundingBox();
  assert.ok(Math.abs(box.x - spot.x) < 3 && box.y < spot.y && box.y + box.height > spot.y, "frame opens where the page was double-clicked");
  assert.equal(await sheets(), before, "a positioned frame on a chapter's first page adds no page");
  console.log("PASS double-click opens a text frame at the spot, in the ribbon format, without moving the chapter");

  // A frame left empty is removed.
  await page.mouse.dblclick(spot.x, spot.y + 60);
  await editing.waitFor();
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);
  added = await additions();
  assert.deepEqual(added.map((item) => item.content), ["Not kutusu"]);
  console.log("PASS an empty new frame is removed");

  // Two relaxed clicks with slight hand movement also count as a double click.
  await page.mouse.click(spot.x, spot.y + 90);
  await page.waitForTimeout(500);
  assert.equal(await editing.count(), 0, "one click does not create a frame");
  await page.mouse.click(spot.x + 3, spot.y + 92);
  await editing.waitFor({ timeout: 3000 });
  await page.keyboard.type("Rahat çift tık");
  await page.keyboard.press("Escape");
  added = await additions();
  assert.equal(added.length, 2, "two clicks create exactly one frame");
  assert.equal(added[1].content, "Rahat çift tık");
  console.log("PASS two relaxed clicks with slight movement create one editable frame");

  // Double-click on a word still selects the word, it does not open a frame.
  await body.locator("p").first().dblclick();
  assert.equal((await additions()).length, 2);
  assert.ok((await page.evaluate(() => getSelection().toString())).trim().length > 0);
  console.log("PASS double-click on text keeps selecting the word");

  // Painted text can sit below a transparent hit layer (or pointer-events:none
  // import markup). The event target alone must not classify that spot as blank.
  const textSpot = await body.locator("p").first().evaluate(node => {
    node.style.pointerEvents = "none";
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    const text = walker.nextNode(), range = document.createRange();
    range.setStart(text, 1); range.setEnd(text, Math.min(text.length, 5));
    const box = range.getBoundingClientRect();
    return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
  });
  assert.equal(await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.classList.contains("rich-text-body"), textSpot), true);
  await page.mouse.click(textSpot.x, textSpot.y);
  await page.waitForTimeout(500);
  await page.mouse.click(textSpot.x + 1, textSpot.y);
  assert.equal((await additions()).length, 2, "clicks over painted text must never add a frame even if the target is the body");
  await page.mouse.dblclick(textSpot.x, textSpot.y);
  assert.equal((await additions()).length, 2, "native double-click over painted text must not add a frame either");
  await body.locator("p").first().evaluate(node => node.style.removeProperty("pointer-events"));
  console.log("PASS clicks on visible text behind a transparent hit surface never create rectangles");

  // A new empty frame can be styled before the first character is typed.
  await page.mouse.dblclick(spot.x, spot.y + 190);
  await editing.waitFor();
  await page.getByLabel("Yazı boyutu (pt)", { exact: true }).focus();
  assert.equal(await editing.count(), 1, "an empty frame survives focusing a ribbon input");
  await page.getByRole("option", { name: "Başlık 1", exact: true }).click();
  await editing.waitFor();
  await page.waitForFunction(() => document.querySelector('[data-layout-editing="true"]')?.getAttribute("aria-level") === "1");
  assert.equal(await editing.getAttribute("aria-level"), "1");
  assert.equal(await page.getByRole("option", { name: "Başlık 1", exact: true }).getAttribute("aria-selected"), "true");
  await page.getByRole("button", { name: "Geri al (Ctrl+Z)", exact: true }).click();
  await page.waitForFunction(() => document.querySelector('[data-layout-editing="true"]') && !document.querySelector('[data-layout-editing="true"]').hasAttribute("aria-level"));
  assert.equal(await editing.getAttribute("aria-level"), null);
  await page.getByRole("button", { name: "Yinele (Ctrl+Y)", exact: true }).click();
  await page.waitForFunction(() => document.querySelector('[data-layout-editing="true"]')?.getAttribute("aria-level") === "1");
  assert.equal(await editing.getAttribute("aria-level"), "1");
  await page.keyboard.type("Kutu basligi");
  await page.getByRole("button", { name: "İtalik", exact: true }).click();
  await page.keyboard.type(" devam");
  assert.equal(await editing.textContent(), "Kutu basligi devam", "typing continues after formatting replaces the DOM");
  console.log("PASS heading gallery formats an empty frame and typing survives ribbon formatting");

  // Native selects and inputs can take focus without deleting or losing the draft.
  await page.getByLabel("Paragraf biçimi", { exact: true }).selectOption("2");
  assert.equal(await editing.getAttribute("aria-level"), "2");
  const size = page.getByLabel("Yazı boyutu (pt)", { exact: true });
  await size.fill("18"); await size.press("Enter");
  assert.equal(await editing.evaluate(n => parseFloat(getComputedStyle(n).fontSize) * .75), 18);
  await editing.click(); await page.keyboard.press("End");
  await page.keyboard.type(" son");
  await page.keyboard.press("Escape");
  const styledId = (await additions()).at(-1).id;
  const styledFrame = page.locator(`[data-layout-id="${styledId}"]`);
  assert.equal((await additions()).at(-1).content, "Kutu basligi devam son");
  for (const label of ["Kalın", "Altı çizili", "Üstü çizili", "Yazı rengi", "Vurgu rengi"]) {
    await page.getByRole("button", { name: label, exact: true }).click();
  }
  let style = (await additions()).at(-1).style;
  assert.ok(style.decoration.includes("underline") && style.decoration.includes("line-through"));
  assert.ok(style.color && style.highlight);
  await page.getByLabel("Hizalama alanı", { exact: true }).selectOption("box");
  await page.getByRole("button", { name: "Ortala", exact: true }).click();
  assert.equal((await additions()).at(-1).style.align, "center");
  await page.getByRole("button", { name: "Madde işaretli liste", exact: true }).click();
  assert.equal(await styledFrame.locator("ul li").count(), 1);
  await page.getByRole("button", { name: "Numaralı liste", exact: true }).click();
  assert.equal(await styledFrame.locator("ol li").count(), 1);
  await page.getByRole("button", { name: "Girintiyi artır", exact: true }).click();
  assert.equal((await additions()).at(-1).style.leftIndentMm, 10);
  await page.getByRole("button", { name: "Girintiyi azalt", exact: true }).click();
  assert.equal((await additions()).at(-1).style.leftIndentMm, 0);
  await page.getByRole("button", { name: "Biçimi temizle", exact: true }).click();
  assert.equal((await additions()).at(-1).list, "");
  assert.equal((await additions()).at(-1).headingLevel, 0);
  console.log("PASS paragraph select, point size, lists, indents and clear formatting work on frames");
  await page.getByRole("option", { name: "Başlık 1", exact: true }).click();
  await page.getByRole("listbox", { name: "Stil galerisi" }).getByRole("option", { name: "Normal", exact: true }).click();
  assert.equal((await additions()).at(-1).headingLevel, 0);
  assert.equal((await additions()).at(-1).style.textTransform, "none");
  await page.reload(); await body.waitFor();
  assert.equal(await styledFrame.textContent(), "Kutu basligi devam son");
  console.log("PASS font toggles, colors, alignment, normal style and persistence work on frames");
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
