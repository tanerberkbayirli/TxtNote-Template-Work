import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "../../../engine/tools/node_modules/playwright");
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1450, height: 1000 } });
const base = process.argv[2] || "http://localhost:5173";
const errors = [];
page.on("pageerror", error => errors.push(error.message));
const box = id => page.locator(`[data-layout-id="${id}"]`);
const link = id => page.locator(`[data-writing-plan-layout-id="${id}"]`);
const plan = page.locator('.thesis-plan-list');
const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const openPlan = async () => {
  if (await plan.isVisible()) return;
  const drawer = page.getByRole("complementary", { name: "Yan paneller", exact: true });
  if (await drawer.isVisible()) await drawer.getByRole("button", { name: "Yazım planı", exact: true }).click();
  else await page.getByRole("button", { name: "Bölüm gezintisini aç/kapat", exact: true }).click();
};
async function add(id) {
  await box(id).scrollIntoViewIfNeeded(); await box(id).click({ button: "right" });
  await page.getByRole("menuitem", { name: "Yazım planına ekle", exact: true }).click();
  await link(id).waitFor();
}
try {
  await page.goto(`${base}/tests/thesis.html`);
  await page.evaluate(() => localStorage.setItem("txtnote-thesis-regression", JSON.stringify({
    title: "Plan boxes", content: "<h1>ALPHA</h1><p>Body.</p><h1>OMEGA</h1><p>Body.</p>",
    researchData: { thesis: { templateId: "fixture-university-a-master-tr-v1", values: { YEAR: "2026" }, sectionContent: {}, enabledSections: [],
      layout: { additions: [
        { id: "plan-abstract", type: "text", sectionId: "abstract", layoutMode: "absolute", xMm: 35, yMm: 5, widthMm: 100, content: "test" },
        { id: "plan-earlier", type: "text", sectionId: "main", layoutMode: "absolute", xMm: 35, yMm: 10, widthMm: 100, content: "Earlier box" },
        { id: "plan-later", type: "text", sectionId: "main", layoutMode: "absolute", xMm: 35, yMm: 240, widthMm: 100, content: "Later box" },
      ] } },
    },
  })));
  await page.reload(); await box("plan-earlier").waitFor();
  await add("plan-abstract");
  assert.equal(await link("plan-abstract").evaluate(node => node.closest('li').parentElement.classList.contains('thesis-plan-list')), true, "manual box is a top-level entry, not a section child");
  assert.match(await link("plan-abstract").evaluate(node => node.closest('li').nextElementSibling.querySelector('.thesis-plan-section').textContent), /özet/i, "box above the abstract appears before the abstract section");
  console.log("PASS test above ÖZET is an independent row before ÖZET, outside its children");
  await add("plan-later"); await add("plan-earlier");
  const children = plan.getByRole('button').filter({ hasText: /Earlier box|Later box|ALPHA|OMEGA/ });
  assert.equal((await children.allTextContents())[0], "Earlier box");
  assert.equal((await children.allTextContents()).at(-1), "Later box");
  assert.ok((await children.allTextContents()).some(text => text.includes("ALPHA")));
  assert.ok((await children.allTextContents()).some(text => text.includes("OMEGA")));
  console.log("PASS adding in reverse order merges boxes with existing headings by document position");

  await link("plan-later").click();
  await page.locator('[data-layout-selection-box="plan-later"]').waitFor();
  await page.waitForFunction(() => {
    const node = document.querySelector('[data-layout-id="plan-later"]'), bounds = node.getBoundingClientRect();
    return bounds.top > 150 && bounds.bottom < innerHeight;
  });
  console.log("PASS writing-plan link scrolls to and selects the exact box");

  await box("plan-later").click({ button: "right" });
  const menu = page.getByRole("menu", { name: "Öğe menüsü" });
  assert.equal(await menu.getByRole("menuitem", { name: "Yazım planından çıkar", exact: true }).count(), 1);
  await menu.getByRole("menuitem", { name: "Ayrıntıları aç", exact: true }).click();
  await page.getByLabel("Y (mm)", { exact: true }).fill("5");
  await openPlan(); await settle();
  assert.equal((await children.allTextContents())[0], "Later box", "moving a box updates its order");
  await page.reload(); await box("plan-earlier").waitFor(); await openPlan();
  assert.equal(await link("plan-later").count(), 1);
  assert.equal((await children.allTextContents())[0], "Later box");
  console.log("PASS box membership and moved order survive reload without duplicate entries");

  await box("plan-later").click({ button: "right" });
  await page.getByRole("menuitem", { name: "Yazım planından çıkar", exact: true }).click();
  await settle(); assert.equal(await link("plan-later").count(), 0);
  assert.equal(await box("plan-later").count(), 1, "removing from the plan keeps the text box");
  console.log("PASS the same menu removes an entry without deleting the box");

  await page.getByRole("button", { name: "Paneli kapat", exact: true }).click();
  await box("plan-later").dblclick();
  await page.keyboard.press("Control+a"); await page.keyboard.type("Live renamed box");
  await add("plan-later");
  assert.equal(await link("plan-later").textContent(), "Live renamed box");
  assert.equal(await box("plan-later").textContent(), "Live renamed box", "adding while typing preserves uncommitted text");
  await page.getByRole("button", { name: "Paneli kapat", exact: true }).click();
  await box("plan-later").dblclick();
  await page.keyboard.press("Control+a"); await page.keyboard.type("Live updated label"); await settle();
  assert.equal(await link("plan-later").textContent(), "Live updated label", "entry text follows the draft before blur");
  await page.keyboard.press("Escape");
  console.log("PASS adding a live edit preserves its text and plan labels track subsequent typing");
  const paper = page.locator('.thesis-paper[data-thesis-section="main"]');
  await paper.scrollIntoViewIfNeeded();
  const point = await paper.evaluate(node => {
    const rect = node.getBoundingClientRect(), scale = rect.width / 210;
    return { x: rect.left + 70 * scale, y: rect.top + 160 * scale };
  });
  await page.mouse.dblclick(point.x, point.y);
  const empty = page.locator('[data-layout-editing="true"]'); await empty.waitFor();
  const emptyId = await empty.getAttribute("data-layout-id");
  await add(emptyId);
  assert.equal(await link(emptyId).textContent(), "Boş metin kutusu");
  assert.equal(await box(emptyId).count(), 1, "an enrolled empty box survives leaving edit mode");
  await page.reload(); await box(emptyId).waitFor(); await openPlan();
  assert.equal(await link(emptyId).textContent(), "Boş metin kutusu");
  console.log("PASS a double-clicked empty box can be bookmarked before typing and survives reload");
  // The real MCBU abstract is grouped from separate header/body/footer sections.
  // A body-owned box above the header still belongs before the whole group.
  await page.evaluate(() => localStorage.setItem("txtnote-thesis-regression", JSON.stringify({
    title: "MCBU plan", content: "", researchData: { thesis: {
      templateId: "mcbu-lee-master-tr-v1", values: { YEAR: "2026" }, sectionContent: {}, enabledSections: [],
      layout: { additions: [{ id: "mcbu-test", type: "text", sectionId: "abstract", layoutMode: "absolute", xMm: 35, yMm: 5, widthMm: 100, content: "test", inWritingPlan: true }] },
    } },
  })));
  await page.reload(); await box("mcbu-test").waitFor(); await openPlan();
  assert.equal(await link("mcbu-test").evaluate(node => node.closest('li').parentElement.classList.contains('thesis-plan-list')), true);
  assert.match(await link("mcbu-test").evaluate(node => node.closest('li').nextElementSibling.querySelector('.thesis-plan-section').textContent), /ÖZET/);
  console.log("PASS real MCBU grouped abstract keeps test above ÖZET as an independent row");
  assert.deepEqual(errors, []);
} finally { await browser.close(); }
