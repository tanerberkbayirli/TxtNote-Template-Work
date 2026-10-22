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
  const body = () => page.locator('[data-thesis-flow-section="main"] [role="textbox"]').first();
  const button = (name) => page.getByRole("tabpanel").getByRole("button", { name, exact: true });
  const reset = async (content = "", layout) => {
    await page.evaluate(({ content, layout }) => localStorage.setItem("txtnote-thesis-regression", JSON.stringify({
      title: "Bug regression", content, researchData: { thesis: { templateId: "fixture-university-a-master-tr-v1", templateVersion: "1.0.0", values: { YEAR: "2026" }, sectionContent: {}, enabledSections: [], ...(layout ? { layout } : {}) } },
    })), { content, layout });
    await page.reload(); await body().waitFor();
  };
  const style = (locator, property = "textAlign") => locator.evaluate((node, prop) => getComputedStyle(node)[prop], property);
  const select = async (locator) => locator.evaluate((node) => {
    node.closest('[role="textbox"]').focus();
    const range = document.createRange(); range.selectNodeContents(node); range.collapse(true);
    const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range);
    document.dispatchEvent(new Event("selectionchange"));
  });

  await reset("<p>Birinci paragraf uzun bir metin içerir ve iki yana yaslanabilmelidir.</p><p>İkinci paragraf değişmemeli.</p>");
  await select(body().locator("p").first());
  for (const [label, align] of [["Sağa hizala", "right"], ["İki yana yasla", "justify"], ["Ortala", "center"], ["İki yana yasla", "justify"]]) {
    await button(label).click();
    assert.equal(await style(body().locator("p").first()), align);
    assert.equal(await button(label).getAttribute("aria-pressed"), "true");
  }
  await page.reload(); await body().waitFor();
  assert.equal(await style(body().locator("p").first()), "justify");
  assert.equal(await body().locator("p").nth(1).getAttribute("class"), null);
  console.log("PASS BUG-002: justify transitions, active button and reopen");

  for (const formatButton of ["İtalik", "Kalın", "Ortala"]) {
    await reset("", { additions: [{ id: "bug-frame", type: "text", sectionId: "cover", layoutMode: "absolute", xMm: 35, yMm: 65, widthMm: 100, heightMm: 15, content: "Eski metin", style: { fontSizePt: 12 } }] });
    const frame = page.locator('[data-layout-id="bug-frame"][data-layout-type="text"]');
    await frame.dblclick(); await page.keyboard.press("Control+a"); await page.keyboard.type("YENI METIN");
    await button(formatButton).click();
    const stored = await page.evaluate(() => window.thesisTest.getDoc().researchData.thesis.layout.additions.find((item) => item.id === "bug-frame"));
    assert.equal(stored.text, "YENI METIN"); assert.equal(stored.content, "YENI METIN");
    if (formatButton === "İtalik") assert.equal(stored.style.italic, true);
    if (formatButton === "Kalın") assert.equal(stored.style.fontWeight, 700);
    await page.reload(); await frame.waitFor(); assert.equal(await frame.innerText(), "YENI METIN");
  }
  console.log("PASS BUG-001: pending frame text saved with italic, bold and alignment, including reopen");

  for (const nestedParagraphs of [false, true]) {
    const cell = (text) => nestedParagraphs ? `<p>${text}</p>` : text;
    await reset(`<p>Önce</p><table><tbody><tr><td>${cell("A")}</td><td>${cell("B")}</td></tr><tr><td>${cell("C")}</td><td>${cell("D")}</td></tr></tbody></table><p>Sonra</p>`);
    const cells = body().locator("td");
    const untouched = await cells.evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).textAlign));
    await select(nestedParagraphs ? cells.first().locator("p") : cells.first());
    await button("Ortala").click();
    assert.equal(await style(nestedParagraphs ? cells.first().locator("p") : cells.first()), "center");
    for (const index of [1, 2, 3]) assert.equal(await style(cells.nth(index)), untouched[index]);
    assert.equal(await style(cells.first(), "display"), "table-cell");
    assert.equal(await body().locator('div.fmt-align-center table').count(), 0);
    await page.reload(); await body().waitFor();
    assert.equal(await style(nestedParagraphs ? body().locator("td").first().locator("p") : body().locator("td").first()), "center");
    // A selection across rows changes exactly its three intersected cells.
    await cells.evaluateAll((nodes) => {
      nodes[0].closest('[role="textbox"]').focus();
      const range = document.createRange(); range.setStart(nodes[0], 0); range.setEnd(nodes[2], nodes[2].childNodes.length);
      const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range); document.dispatchEvent(new Event("selectionchange"));
    });
    await button("Sağa hizala").click();
    for (const index of [0, 1, 2]) assert.equal(await style(nestedParagraphs ? cells.nth(index).locator("p") : cells.nth(index)), "right");
    assert.equal(await style(cells.nth(3)), untouched[3]);
  }
  console.log("PASS BUG-003: isolated cell/paragraph alignment, table geometry, cross-row selection and reopen");

  for (const tag of ["ul", "ol"]) {
    await reset(`<${tag}><li>Birinci</li><li>İkinci</li></${tag}><p>Son</p>`);
    const items = body().locator("li"), after = body().locator("p");
    const untouched = await style(items.nth(1)), afterAlign = await style(after);
    await select(items.first()); await button("Sağa hizala").click();
    assert.equal(await style(items.first()), "right");
    assert.equal(await style(items.nth(1)), untouched); assert.equal(await style(after), afterAlign);
    assert.equal(await style(items.first(), "display"), "list-item");
    await page.reload(); await body().waitFor(); assert.equal(await style(items.first()), "right");
    await select(items.first()); await page.keyboard.press("End"); await page.keyboard.press("Enter");
    assert.equal(await body().locator(tag).count(), 1); assert.equal(await body().locator("li").count(), 3);
    assert.equal(await body().locator(`${tag}>div`).count(), 0, "Enter must not replace list items with divs");
  }
  console.log("PASS BUG-004: isolated bullet/numbered item alignment, markers, native Enter and reopen");
  assert.deepEqual(errors, []);
} finally { await browser.close(); }
