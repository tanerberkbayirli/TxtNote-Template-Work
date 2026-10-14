import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
const { chromium } = createRequire(import.meta.url)("./node_modules/playwright");
const base = process.env.THESIS_BASE_URL || "http://127.0.0.1:5176";
const out = process.env.THESIS_UI_OUT || "orchestration/validation/iyte/ui";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", args: ["--enable-blink-features=MulticolColumnWrapping"] });
const results = [];
try {
  for (const [institute, degree] of [["lee", "master"], ["lee", "phd"], ["lee-articles", "master"], ["lee-articles", "phd"], ["eee", "undergraduate"]]) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await context.grantPermissions(["local-fonts"], { origin: base });
    const page = await context.newPage();
    const errors = []; page.on("pageerror", error => errors.push(error.message));
    await page.goto(`${base}/tests/iyte.html`);
    await page.getByLabel("Üniversite", { exact: true }).selectOption("iyte");
    await page.getByLabel("Enstitü", { exact: true }).selectOption(institute);
    await page.getByLabel("Tez türü", { exact: true }).selectOption(degree);
    assert.equal(await page.getByLabel("Dil", { exact: true }).inputValue(), "en");
    await page.getByRole("button", { name: "Tez oluştur", exact: true }).click();
    const id = `iyte-${institute}-${degree}-en-v1`;
    await page.locator(`[data-thesis-template-id="${id}"]`).waitFor();
    await page.getByRole("button", { name: "Tez bilgileri", exact: true }).click();
    assert.equal(await page.getByLabel("Tez başlığı", { exact: true }).count(), 1);
    assert.equal(await page.getByLabel("İngilizce başlık", { exact: true }).count(), 0);
    await page.getByLabel("Tez başlığı", { exact: true }).fill("IYTE UI VERIFICATION");
    await page.locator("[data-thesis-source-usage] summary").click();
    assert.ok((await page.locator("[data-thesis-source-usage]").innerText()).includes(institute === "eee" ? "Letter" : "250"));
    const body = page.locator('[data-thesis-flow-section="main"] [contenteditable="true"]');
    await body.fill("Persistent editable verification text.");
    await page.waitForFunction(() => window.iyteTest.getDoc()?.content.includes("Persistent editable verification text."));
    await page.reload();
    await page.locator(`[data-thesis-template-id="${id}"]`).waitFor();
    await page.waitForFunction(() => document.querySelector('[aria-label="Belge sayfaları"]')?.getAttribute("data-thesis-pagination-ready") === "true");
    assert.equal((await page.evaluate(() => window.iyteTest.getDoc().title)), "IYTE UI VERIFICATION");
    assert.ok((await body.innerText()).includes("Persistent editable verification text."));
    assert.equal(await page.locator(".thesis-status-page").innerText(), institute === "eee" ? "Letter" : "A4");
    assert.deepEqual(errors, []);
    await page.screenshot({ path: `${out}/${institute}-${degree}.png` });
    results.push({ id, status: "PASS", checks: ["creator selectors", "real editor", "one primary English title", "source usage", "editable content", "reload persistence", "page-size label", "no page errors"] });
    await context.close();
  }
} finally { await browser.close(); }
await writeFile(`${out}/report.json`, JSON.stringify({ status: "PASS", results }, null, 2) + "\n");
console.log(`PASS: ${results.length} IYTE choices, creation / editing / reload / usage notes`);
