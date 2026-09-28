// Browser checks of the Batch B editor behaviour (real ThesisEditor via thesis-batchb.html).
// usage: node tests/batchb-ui.mjs <photo|continuation> <fixture.json>   (dev server on :5175)
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || "/opt/node22/lib/node_modules/playwright");
const [scenario, fixture] = process.argv.slice(2);
const browser = await chromium.launch({ args: ["--enable-blink-features=MulticolColumnWrapping"] });
const page = await (await browser.newContext({ viewport: { width: 1400, height: 1000 } })).newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(`${process.env.BASE_URL || "http://127.0.0.1:5175"}/tests/thesis-batchb.html`);
await page.evaluate(([k, v]) => { localStorage.clear(); localStorage.setItem(k, v); }, ["txtnote-thesis-regression", await readFile(fixture, "utf8")]);
await page.reload();
await page.locator(".thesis-sheet").first().waitFor();
const settle = async () => { let last = ""; for (let i = 0; i < 40; i += 1) { await page.waitForTimeout(250); const now = await page.evaluate(() => [...document.querySelectorAll(".thesis-sheet")].length + ":" + document.querySelectorAll("tr[data-thesis-cont]").length + ":" + document.body.innerText.length); if (now === last) return now; last = now; } return last; };
const pass = (message) => console.log(`PASS ${message}`);
await settle();

if (scenario === "photo") {
  assert.equal(await page.getByRole("button", { name: "Resim ekle" }).count(), 1);
  const select = page.getByLabel("Görsel türü");
  assert.equal(await select.isDisabled(), true);
  await page.locator("figure.academic-figure img").first().click();
  assert.equal(await select.isEnabled(), true);
  await select.selectOption("photo");
  await settle();
  const saved = await page.evaluate(() => window.thesisTest.getDoc().content);
  assert.equal((saved.match(/data-caption-kind="photo"/g) || []).length, 4);
  assert.deepEqual(await page.evaluate(() => [...document.querySelectorAll("figcaption")].map((n) => n.dataset.thesisCaption)), ["Resim 1.1 ", "Resim 1.2 ", "Resim 1.3 ", "Şekil 2.1 ", "Resim 2.1 "]);
  pass("the author picks a figure and changes its kind: renumbered, stored as source markup (data-caption-kind)");
  await page.reload(); await page.locator(".thesis-sheet").first().waitFor(); await settle();
  assert.equal(await page.evaluate(() => document.querySelectorAll('figure[data-caption-kind="photo"]').length), 4);
  pass("the kind survives reload");
}
if (scenario === "continuation") {
  const rows = await page.evaluate(() => document.querySelectorAll('tr[data-thesis-cont="caption"]').length);
  assert.ok(rows >= 4, `continuation rows in the editor: ${rows}`);
  await page.locator(".rich-text-body p").first().click();
  await page.keyboard.type("x");
  await settle();
  const saved = await page.evaluate(() => JSON.stringify(window.thesisTest.getDoc()));
  assert.ok(!/data-thesis-cont/.test(saved), "saved note has no continuation rows");
  assert.equal(await page.evaluate(() => document.querySelectorAll('tr[data-thesis-cont="caption"]').length), rows);
  assert.ok(!(await page.evaluate(() => document.body.innerText.includes("kararlı hale gelmedi"))), "pagination stabilised");
  pass(`${rows} continuation rows in the editor, none stored, pagination stable after an edit`);
  // Editing inside the split table moves the fragments and the rows follow.
  await page.locator("table.academic-table tbody td").first().click();
  for (let i = 0; i < 6; i += 1) await page.keyboard.press("Enter");
  await settle();
  const after = await page.evaluate(() => [...document.querySelectorAll('tr[data-thesis-cont="caption"]')].map((tr) => tr.dataset.thesisContAt));
  assert.ok(after.length >= 4 && !/data-thesis-cont/.test(await page.evaluate(() => JSON.stringify(window.thesisTest.getDoc()))));
  pass("editing inside the table re-derives the continuation rows without storing them");
}
if (scenario === "equation") {
  const box = page.getByLabel("Denklem numarası");
  assert.equal(await box.isDisabled(), true);
  const labels = () => page.evaluate(() => [...document.querySelectorAll(".math-formula--block")].map((n) => n.dataset.thesisEq || ""));
  assert.deepEqual(await labels(), ["(1.1)", "(1.2)", "", "(2.1)"]);
  await page.locator(".math-formula--block .math-formula__render").first().click();
  assert.equal(await box.isEnabled(), true);
  assert.equal(await box.isChecked(), true);
  await box.uncheck();
  await settle();
  assert.deepEqual(await labels(), ["", "(1.1)", "", "(2.1)"]);
  const saved = await page.evaluate(() => window.thesisTest.getDoc().content);
  assert.equal((saved.match(/data-eq-numbered="true"/g) || []).length, 2);
  assert.ok(!/data-thesis-eq/.test(saved), "the equation number is presentation, never stored");
  pass("equation numbers per chapter; switching one off renumbers, the flag is source markup, the number is not stored");
}
if (scenario === "ordinal") {
  await page.locator(".rich-text-body p").first().click();
  const select = page.getByLabel("Paragraf biçimi");
  assert.deepEqual(await select.locator("option").allTextContents(), ["Paragraf biçimi", "Normal", "Başlık 1", "Başlık 2", "Başlık 3", "Başlık 4", "Başlık 5"]);
  await page.locator(".rich-text-body p").first().click();
  await select.selectOption("5");
  await settle();
  const saved = await page.evaluate(() => window.thesisTest.getDoc().content);
  assert.match(saved, /<h5\b/);
  assert.deepEqual(await page.evaluate(() => [...document.querySelectorAll("h1[data-thesis-number]")].map((h) => h.dataset.thesisNumber)), ["BİRİNCİ BÖLÜM", "İKİNCİ BÖLÜM", "ÜÇÜNCÜ BÖLÜM"]);
  const cs = await page.evaluate(() => { const h = document.querySelector("h1[data-thesis-number]"); const p = getComputedStyle(h, "::before"); return [p.display, p.content]; });
  assert.deepEqual(cs, ["block", '"BİRİNCİ BÖLÜM"']);
  pass("the editor offers five heading levels (Başlık 5 converts a paragraph) and shows the ordinal label as its own line");
}
if (scenario === "styles") {
  const select = page.getByLabel("Paragraf biçimi");
  await page.locator(".rich-text-body p:not([data-thesis-style])").first().click();
  assert.deepEqual(await select.locator("option").allTextContents(), ["Paragraf biçimi", "Normal", "Başlık 1", "Başlık 2", "Başlık 3", "Başlık 4", "tableNote", "blockQuote"]);
  await select.selectOption("style:tableNote");
  await settle();
  assert.equal(await page.evaluate(() => document.querySelectorAll('p[data-thesis-style="tableNote"]').length), 2);
  assert.equal((await page.evaluate(() => window.thesisTest.getDoc().content)).match(/data-thesis-style="tableNote"/g).length, 2);
  await page.locator('p[data-thesis-style="tableNote"]').first().click();
  await select.selectOption("0");
  await settle();
  assert.equal(await page.evaluate(() => document.querySelectorAll('p[data-thesis-style="tableNote"]').length), 1);
  pass("the menu offers the template's named styles; choosing one is saved as source markup, Normal removes it");
}
if (scenario === "exceptions") {
  const spans = () => page.evaluate(() => [...document.querySelectorAll("[data-thesis-flow-section=main] :is(h1,h2) span[data-thesis-lower]")].map((n) => n.textContent));
  assert.deepEqual(await spans(), ["ve", "ile", "veya", "VE", "ve"]);
  const lower = await page.evaluate(() => getComputedStyle(document.querySelector("[data-thesis-flow-section=main] h1 span[data-thesis-lower]")).textTransform);
  assert.equal(lower, "lowercase");
  // typing at the end of a heading: the caret stays put while the exception spans are re-derived
  await page.locator("[data-thesis-flow-section=main] h1").first().click();
  await page.keyboard.press("End");
  await page.keyboard.type(" ve ile", { delay: 30 });
  await page.keyboard.type(" son", { delay: 30 });
  await settle();
  assert.equal(await page.evaluate(() => document.querySelector("[data-thesis-flow-section=main] h1").textContent), "Materyal ve metot ve ile son");
  assert.equal((await spans()).filter((w) => /^(ve|ile)$/i.test(w)).length >= 4, true);
  const saved = await page.evaluate(() => window.thesisTest.getDoc().content);
  assert.ok(!/data-thesis-lower/.test(saved), "the wrapper spans are never stored");
  assert.match(saved, /<h1[^>]*>Materyal ve metot ve ile son<\/h1>/);
  // and the caret is still at the end of the heading (typing goes on there)
  await page.keyboard.type("X");
  assert.equal(await page.evaluate(() => document.querySelector("[data-thesis-flow-section=main] h1").textContent), "Materyal ve metot ve ile sonX");
  pass("exception words are wrapped while typing without moving the caret; nothing is stored");
}
assert.deepEqual(errors, []);
await browser.close();
